import { Response } from 'express';
import { Invoice, Vendor, User, Approval, Payment, IInvoiceItem, PurchaseOrder } from '../models';
import { AuthRequest } from '../middleware/auth';
import { checkDuplicateInvoice } from '../services/duplicateDetector';
import { calculateRequiredApprovalSteps } from '../services/approvalEngine';
import { logAuditEvent } from '../middleware/auditLogger';
import { validateGSTIN, calculateGSTBreakdown } from '../services/gstValidator';
import { extractInvoiceFromText } from '../services/ocrEngine';
import { performThreeWayMatch } from '../services/matchingEngine';

export const getInvoices = async (req: AuthRequest, res: Response): Promise<void> => {
  const {
    page = 1,
    limit = 10,
    search,
    status,
    vendorId,
    startDate,
    endDate,
    minAmount,
    maxAmount,
    sortBy = 'createdAt',
    sortOrder = 'desc',
  } = req.query as any;

  const filter: any = { organization: req.orgId };

  // Vendor role can only see their own vendor invoices
  if (req.userRole === 'VENDOR') {
    if (req.user?.vendor) {
      filter.vendor = req.user.vendor;
    } else {
      res.status(200).json({ success: true, invoices: [], pagination: { total: 0, page: 1, totalPages: 0 } });
      return;
    }
  } else if (vendorId) {
    filter.vendor = vendorId;
  }

  if (status && status !== 'ALL') {
    filter.status = status;
  }

  if (startDate || endDate) {
    filter.issueDate = {};
    if (startDate) filter.issueDate.$gte = new Date(startDate as string);
    if (endDate) {
      const end = new Date(endDate as string);
      end.setHours(23, 59, 59, 999);
      filter.issueDate.$lte = end;
    }
  }

  if (minAmount !== undefined || maxAmount !== undefined) {
    filter.totalAmount = {};
    if (minAmount !== undefined) filter.totalAmount.$gte = Number(minAmount);
    if (maxAmount !== undefined) filter.totalAmount.$lte = Number(maxAmount);
  }

  if (search) {
    const searchRegex = new RegExp(search as string, 'i');
    // Also find matching vendor ids
    const matchedVendors = await Vendor.find({
      organization: req.orgId,
      name: searchRegex,
    }).select('_id');

    filter.$or = [
      { invoiceNumber: searchRegex },
      { poNumber: searchRegex },
      { description: searchRegex },
      { vendor: { $in: matchedVendors.map((v) => v._id) } },
    ];
  }

  const pageNum = Number(page);
  const limitNum = Number(limit);
  const skip = (pageNum - 1) * limitNum;
  const sortDirection = sortOrder === 'asc' ? 1 : -1;

  const [invoices, total] = await Promise.all([
    Invoice.find(filter)
      .populate('vendor', 'name code email gstin paymentTerms')
      .populate('createdBy', 'name email avatar')
      .populate('approvedBy', 'name email')
      .sort({ [sortBy as string]: sortDirection })
      .skip(skip)
      .limit(limitNum),
    Invoice.countDocuments(filter),
  ]);

  res.status(200).json({
    success: true,
    invoices,
    pagination: {
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum),
    },
  });
};

export const getInvoiceById = async (req: AuthRequest, res: Response): Promise<void> => {
  const { id } = req.params;

  const invoice = await Invoice.findOne({ _id: id, organization: req.orgId })
    .populate('vendor')
    .populate('createdBy', 'name email avatar role')
    .populate('approvedBy', 'name email avatar role')
    .populate('rejectedBy', 'name email avatar role');

  if (!invoice) {
    res.status(404).json({ success: false, message: 'Invoice not found' });
    return;
  }

  // If vendor role, ensure ownership
  if (req.userRole === 'VENDOR' && req.user?.vendor && !invoice.vendor.equals(req.user.vendor)) {
    res.status(403).json({ success: false, message: 'Access denied to this invoice.' });
    return;
  }

  // Fetch approval steps
  const approvals = await Approval.find({ invoice: invoice._id })
    .populate('approver', 'name email avatar role')
    .sort({ stepNumber: 1 });

  // Fetch payments
  const payments = await Payment.find({ invoice: invoice._id })
    .populate('processedBy', 'name email')
    .sort({ paymentDate: -1 });

  res.status(200).json({
    success: true,
    invoice,
    approvals,
    payments,
  });
};

export const checkDuplicate = async (req: AuthRequest, res: Response): Promise<void> => {
  const { vendorId, invoiceNumber, amount, issueDate, excludeId } = req.body;

  const result = await checkDuplicateInvoice({
    organizationId: req.orgId!,
    vendorId,
    invoiceNumber,
    amount: amount ? Number(amount) : undefined,
    issueDate,
    excludeId,
  });

  res.status(200).json({
    success: true,
    duplicateCheck: result,
  });
};

export const createInvoice = async (req: AuthRequest, res: Response): Promise<void> => {
  const {
    invoiceNumber,
    vendorId,
    poNumber,
    description,
    issueDate,
    dueDate,
    paymentTerms,
    currency = 'INR',
    items,
    subtotal,
    taxRate = 18,
    taxAmount,
    discountAmount = 0,
    totalAmount,
    status = 'SUBMITTED',
    notes,
  } = req.body;

  // Enforce vendor role to only create for their own vendor
  let resolvedVendorId = vendorId;
  if (req.userRole === 'VENDOR') {
    if (!req.user?.vendor) {
      res.status(400).json({ success: false, message: 'Vendor account is not linked to a vendor profile.' });
      return;
    }
    resolvedVendorId = req.user.vendor.toString();
  }

  const vendor = await Vendor.findOne({ _id: resolvedVendorId, organization: req.orgId });
  if (!vendor) {
    res.status(400).json({ success: false, message: 'Selected vendor does not exist.' });
    return;
  }

  // Check duplicate invoice
  const duplicateCheck = await checkDuplicateInvoice({
    organizationId: req.orgId!,
    vendorId: resolvedVendorId,
    invoiceNumber,
    amount: totalAmount,
    issueDate,
  });

  // Calculate GST breakdown
  const gstBreakdown = calculateGSTBreakdown({
    supplierGSTIN: vendor.gstin,
    buyerGSTIN: '27AAACA1234F1Z5',
    subtotal: subtotal || totalAmount / (1 + (taxRate || 18) / 100),
    taxRate,
  });

  // Calculate required approval steps based on org thresholds
  const requiredApprovalSteps = await calculateRequiredApprovalSteps(req.orgId!, totalAmount);

  // Check 3-Way Match if PO is specified
  let matchingStatus: any = 'PERFECT_MATCH';
  let matchingScore = 99;

  if (poNumber) {
    const po = await PurchaseOrder.findOne({
      organization: req.orgId,
      poNumber: poNumber.trim().toUpperCase(),
    });
    if (po) {
      const matchResult = performThreeWayMatch({
        invoice: {
          invoiceNumber,
          poNumber,
          totalAmount,
          items: items || [],
        },
        po: po.toObject() as any,
        grn: po.grnRecords?.[0] as any,
      });
      matchingStatus = matchResult.matchStatus;
      matchingScore = matchResult.matchScore;
    } else {
      matchingStatus = 'NO_PO_FOUND';
      matchingScore = 70;
    }
  }

  const initialStatus = status === 'DRAFT' ? 'DRAFT' : 'SUBMITTED';

  const invoice = await Invoice.create({
    invoiceNumber: invoiceNumber.trim().toUpperCase(),
    vendor: resolvedVendorId,
    organization: req.orgId,
    poNumber: poNumber?.trim().toUpperCase(),
    description,
    issueDate: new Date(issueDate),
    dueDate: new Date(dueDate),
    paymentTerms: paymentTerms || vendor.paymentTerms || 'Net 30',
    currency,
    items,
    subtotal,
    taxRate,
    taxAmount,
    discountAmount,
    totalAmount,
    status: initialStatus,
    matchingStatus,
    matchingScore,
    ocrConfidence: 99,
    gstBreakdown: {
      isInterState: gstBreakdown.isInterState,
      supplierGSTIN: vendor.gstin,
      buyerGSTIN: '27AAACA1234F1Z5',
      isGSTINValid: validateGSTIN(vendor.gstin || '').isValid,
      cgstAmount: gstBreakdown.cgstAmount,
      sgstAmount: gstBreakdown.sgstAmount,
      igstAmount: gstBreakdown.igstAmount,
    },
    createdBy: req.userId,
    currentApprovalStep: 1,
    requiredApprovalSteps,
    notes,
  });

  await logAuditEvent({
    action: 'INVOICE_CREATE',
    entityType: 'Invoice',
    entityId: invoice._id.toString(),
    entityName: invoice.invoiceNumber,
    newValue: {
      invoiceNumber: invoice.invoiceNumber,
      vendor: vendor.name,
      totalAmount: invoice.totalAmount,
      status: invoice.status,
    },
    req,
  });

  const populated = await invoice.populate('vendor', 'name email code');

  res.status(201).json({
    success: true,
    message: 'Invoice created successfully',
    invoice: populated,
    duplicateWarning: duplicateCheck.isDuplicate ? duplicateCheck : undefined,
  });
};

export const updateInvoice = async (req: AuthRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  const updates = req.body;

  const invoice = await Invoice.findOne({ _id: id, organization: req.orgId });
  if (!invoice) {
    res.status(404).json({ success: false, message: 'Invoice not found' });
    return;
  }

  // Only DRAFT or SUBMITTED invoices can be freely edited
  if (!['DRAFT', 'SUBMITTED', 'REJECTED'].includes(invoice.status) && req.userRole !== 'ADMIN') {
    res.status(400).json({
      success: false,
      message: `Cannot edit invoice in '${invoice.status}' status. Only Draft, Submitted, or Rejected invoices may be modified.`,
    });
    return;
  }

  const previousValue = invoice.toObject();

  if (updates.totalAmount && updates.totalAmount !== invoice.totalAmount) {
    updates.requiredApprovalSteps = await calculateRequiredApprovalSteps(req.orgId!, updates.totalAmount);
  }

  Object.assign(invoice, updates);
  await invoice.save();

  await logAuditEvent({
    action: 'INVOICE_UPDATE',
    entityType: 'Invoice',
    entityId: invoice._id.toString(),
    entityName: invoice.invoiceNumber,
    previousValue,
    newValue: invoice.toObject(),
    req,
  });

  const populated = await invoice.populate('vendor', 'name email code');

  res.status(200).json({
    success: true,
    message: 'Invoice updated successfully',
    invoice: populated,
  });
};

export const deleteInvoice = async (req: AuthRequest, res: Response): Promise<void> => {
  const { id } = req.params;

  const invoice = await Invoice.findOne({ _id: id, organization: req.orgId });
  if (!invoice) {
    res.status(404).json({ success: false, message: 'Invoice not found' });
    return;
  }

  if (invoice.status === 'PAID' || invoice.status === 'PAYMENT_PROCESSING') {
    res.status(400).json({
      success: false,
      message: 'Cannot delete an invoice with active or settled payments.',
    });
    return;
  }

  await Invoice.deleteOne({ _id: invoice._id });
  await Approval.deleteMany({ invoice: invoice._id });

  await logAuditEvent({
    action: 'INVOICE_DELETE',
    entityType: 'Invoice',
    entityId: invoice._id.toString(),
    entityName: invoice.invoiceNumber,
    previousValue: invoice.toObject(),
    req,
  });

  res.status(200).json({ success: true, message: 'Invoice deleted successfully' });
};

export const uploadAttachment = async (req: AuthRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  const file = req.file;

  if (!file) {
    res.status(400).json({ success: false, message: 'No file uploaded' });
    return;
  }

  const invoice = await Invoice.findOne({ _id: id, organization: req.orgId });
  if (!invoice) {
    res.status(404).json({ success: false, message: 'Invoice not found' });
    return;
  }

  const attachment = {
    filename: file.filename,
    originalName: file.originalname,
    url: `/uploads/${file.filename}`,
    fileType: file.mimetype,
    fileSize: file.size,
    uploadedBy: req.user?._id as any,
    uploadedAt: new Date(),
  };

  invoice.attachments.push(attachment as any);
  await invoice.save();

  await logAuditEvent({
    action: 'ATTACHMENT_UPLOAD',
    entityType: 'Invoice',
    entityId: invoice._id.toString(),
    entityName: invoice.invoiceNumber,
    newValue: { filename: file.originalname, size: file.size },
    req,
  });

  res.status(200).json({
    success: true,
    message: 'Attachment uploaded successfully',
    attachment,
  });
};

export const bulkApprove = async (req: AuthRequest, res: Response): Promise<void> => {
  const { invoiceIds, comments = 'Bulk approved' } = req.body;

  if (!Array.isArray(invoiceIds) || invoiceIds.length === 0) {
    res.status(400).json({ success: false, message: 'Array of invoiceIds is required' });
    return;
  }

  let approvedCount = 0;
  for (const id of invoiceIds) {
    const invoice = await Invoice.findOne({ _id: id, organization: req.orgId });
    if (invoice && ['SUBMITTED', 'UNDER_VERIFICATION', 'PENDING_APPROVAL'].includes(invoice.status)) {
      invoice.status = 'APPROVED';
      invoice.approvedBy = req.user?._id as any;
      invoice.currentApprovalStep = invoice.requiredApprovalSteps;
      await invoice.save();

      await Approval.create({
        invoice: invoice._id,
        organization: invoice.organization,
        stepNumber: invoice.requiredApprovalSteps,
        approver: req.user?._id,
        status: 'APPROVED',
        comments,
        decisionDate: new Date(),
      });

      approvedCount++;
    }
  }

  res.status(200).json({
    success: true,
    message: `Successfully approved ${approvedCount} invoices.`,
    approvedCount,
  });
};

export const bulkReject = async (req: AuthRequest, res: Response): Promise<void> => {
  const { invoiceIds, reason = 'Bulk rejected by manager' } = req.body;

  if (!Array.isArray(invoiceIds) || invoiceIds.length === 0) {
    res.status(400).json({ success: false, message: 'Array of invoiceIds is required' });
    return;
  }

  let rejectedCount = 0;
  for (const id of invoiceIds) {
    const invoice = await Invoice.findOne({ _id: id, organization: req.orgId });
    if (invoice && invoice.status !== 'PAID' && invoice.status !== 'REJECTED') {
      invoice.status = 'REJECTED';
      invoice.rejectedBy = req.user?._id as any;
      invoice.rejectionReason = reason;
      invoice.rejectedAt = new Date();
      await invoice.save();

      await Approval.create({
        invoice: invoice._id,
        organization: invoice.organization,
        stepNumber: invoice.currentApprovalStep,
        approver: req.user?._id,
        status: 'REJECTED',
        comments: reason,
        decisionDate: new Date(),
      });

      rejectedCount++;
    }
  }

  res.status(200).json({
    success: true,
    message: `Successfully rejected ${rejectedCount} invoices.`,
    rejectedCount,
  });
};

export const bulkCsvImport = async (req: AuthRequest, res: Response): Promise<void> => {
  const { invoices: importList } = req.body;

  if (!Array.isArray(importList) || importList.length === 0) {
    res.status(400).json({ success: false, message: 'Invoices array is required for bulk import' });
    return;
  }

  const vendors = await Vendor.find({ organization: req.orgId });
  const vendorMap = new Map();
  vendors.forEach((v) => {
    vendorMap.set(v.name.toLowerCase(), v);
    vendorMap.set(v.code.toLowerCase(), v);
  });

  const createdInvoices = [];
  const errors = [];

  for (let i = 0; i < importList.length; i++) {
    const row = importList[i];
    try {
      const vendorRef =
        vendorMap.get(row.vendorName?.toLowerCase() || '') ||
        vendorMap.get(row.vendorCode?.toLowerCase() || '') ||
        vendors[0];

      const subtotal = Number(row.subtotal || row.amount || 10000);
      const taxRate = Number(row.taxRate || 18);
      const taxAmount = (subtotal * taxRate) / 100;
      const totalAmount = subtotal + taxAmount;

      const requiredApprovalSteps = await calculateRequiredApprovalSteps(req.orgId!, totalAmount);

      const inv = await Invoice.create({
        invoiceNumber: (row.invoiceNumber || `IMP-${Date.now()}-${i}`).toUpperCase(),
        vendor: vendorRef._id,
        organization: req.orgId,
        poNumber: row.poNumber?.toUpperCase(),
        description: row.description || 'Imported via CSV batch upload',
        issueDate: row.issueDate ? new Date(row.issueDate) : new Date(),
        dueDate: row.dueDate ? new Date(row.dueDate) : new Date(Date.now() + 30 * 86400000),
        paymentTerms: row.paymentTerms || vendorRef.paymentTerms || 'Net 30',
        currency: 'INR',
        items: [
          {
            description: row.itemDescription || row.description || 'General line item services',
            quantity: Number(row.quantity || 1),
            unitPrice: subtotal,
            taxRate,
            taxAmount,
            amount: totalAmount,
          },
        ],
        subtotal,
        taxRate,
        taxAmount,
        discountAmount: 0,
        totalAmount,
        status: 'SUBMITTED',
        createdBy: req.userId,
        currentApprovalStep: 1,
        requiredApprovalSteps,
      });

      createdInvoices.push(inv);
    } catch (err: any) {
      errors.push({ row: i + 1, message: err.message });
    }
  }

  res.status(200).json({
    success: true,
    message: `Successfully imported ${createdInvoices.length} invoices. ${errors.length} failed.`,
    importedCount: createdInvoices.length,
    errors,
  });
};

export const parseInvoiceDocument = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { rawText, vendorName } = req.body;
    let textToParse = rawText;

    if (req.file) {
      // If a file was uploaded, read the buffer/text content
      textToParse = req.file.buffer ? req.file.buffer.toString('utf-8') : rawText || '';
    }

    if (!textToParse) {
      res.status(400).json({ success: false, message: 'Invoice document content or rawText is required for OCR parsing.' });
      return;
    }

    const extracted = extractInvoiceFromText(textToParse, vendorName);

    // Also run proactive duplicate check on extracted invoice number
    let duplicateCheckResult = undefined;
    if (extracted.invoiceNumber?.value) {
      duplicateCheckResult = await checkDuplicateInvoice({
        organizationId: req.orgId!,
        vendorId: req.body.vendorId || '',
        invoiceNumber: extracted.invoiceNumber.value,
        amount: extracted.totalAmount?.value,
        issueDate: extracted.issueDate?.value,
      });
    }

    // Determine GST tax split
    const gstBreakdown = calculateGSTBreakdown({
      supplierGSTIN: extracted.supplierGSTIN?.value,
      buyerGSTIN: extracted.buyerGSTIN?.value,
      subtotal: extracted.subtotal?.value || 0,
      taxRate: extracted.taxRate?.value || 18,
    });

    res.status(200).json({
      success: true,
      extracted,
      gstBreakdown,
      duplicateCheck: duplicateCheckResult,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: `OCR Parsing failed: ${err.message}` });
  }
};

export const matchInvoiceWithPO = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { invoiceId, poNumber, invoiceData } = req.body;

    let targetInvoice = invoiceData;
    if (invoiceId) {
      const dbInvoice = await Invoice.findOne({ _id: invoiceId, organization: req.orgId });
      if (dbInvoice) {
        targetInvoice = dbInvoice.toObject();
      }
    }

    if (!targetInvoice) {
      res.status(400).json({ success: false, message: 'Invoice data or invoiceId is required' });
      return;
    }

    const targetPoNumber = poNumber || targetInvoice.poNumber;
    if (!targetPoNumber) {
      res.status(400).json({ success: false, message: 'Purchase Order number is required for 3-way match' });
      return;
    }

    const po = await PurchaseOrder.findOne({
      organization: req.orgId,
      poNumber: targetPoNumber.trim().toUpperCase(),
    });

    const matchResult = performThreeWayMatch({
      invoice: {
        invoiceNumber: targetInvoice.invoiceNumber,
        poNumber: targetPoNumber,
        totalAmount: targetInvoice.totalAmount,
        items: targetInvoice.items || [],
      },
      po: po ? (po.toObject() as any) : null,
      grn: po?.grnRecords?.[0] as any,
    });

    // If matching a saved invoice, persist matching score & status
    if (invoiceId) {
      await Invoice.updateOne(
        { _id: invoiceId, organization: req.orgId },
        {
          matchingStatus: matchResult.matchStatus,
          matchingScore: matchResult.matchScore,
        }
      );
    }

    res.status(200).json({
      success: true,
      matchResult,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: `3-Way Match calculation failed: ${err.message}` });
  }
};

export const validateInvoiceGST = async (req: AuthRequest, res: Response): Promise<void> => {
  const { supplierGSTIN, buyerGSTIN, subtotal, taxRate } = req.body;

  const supplierValidation = validateGSTIN(supplierGSTIN || '');
  const buyerValidation = validateGSTIN(buyerGSTIN || '27AAACA1234F1Z5');

  const gstBreakdown = calculateGSTBreakdown({
    supplierGSTIN,
    buyerGSTIN: buyerGSTIN || '27AAACA1234F1Z5',
    subtotal: Number(subtotal || 0),
    taxRate: Number(taxRate || 18),
  });

  res.status(200).json({
    success: true,
    supplierValidation,
    buyerValidation,
    gstBreakdown,
  });
};

