import { Response } from 'express';
import { Vendor, Invoice, Payment } from '../models';
import { AuthRequest } from '../middleware/auth';
import { logAuditEvent } from '../middleware/auditLogger';

export const getVendors = async (req: AuthRequest, res: Response): Promise<void> => {
  const { search, category, status } = req.query as any;

  const filter: any = { organization: req.orgId };

  if (status && status !== 'ALL') {
    filter.status = status;
  }
  if (category && category !== 'ALL') {
    filter.category = category;
  }
  if (search) {
    const searchRegex = new RegExp(search as string, 'i');
    filter.$or = [
      { name: searchRegex },
      { code: searchRegex },
      { email: searchRegex },
      { gstin: searchRegex },
      { contactPerson: searchRegex },
    ];
  }

  const vendors = await Vendor.find(filter).sort({ name: 1 });

  // Calculate high-level metrics per vendor
  const vendorIds = vendors.map((v) => v._id);
  const invoiceAggregates = await Invoice.aggregate([
    { $match: { vendor: { $in: vendorIds }, organization: req.user?.organization } },
    {
      $group: {
        _id: '$vendor',
        totalInvoices: { $sum: 1 },
        totalAmount: { $sum: '$totalAmount' },
        paidAmount: {
          $sum: {
            $cond: [{ $eq: ['$status', 'PAID'] }, '$totalAmount', 0],
          },
        },
        pendingAmount: {
          $sum: {
            $cond: [
              { $in: ['$status', ['PENDING_APPROVAL', 'APPROVED', 'PAYMENT_PROCESSING', 'UNDER_VERIFICATION', 'SUBMITTED', 'OVERDUE']] },
              '$totalAmount',
              0,
            ],
          },
        },
      },
    },
  ]);

  const statsMap = new Map();
  invoiceAggregates.forEach((agg) => {
    statsMap.set(agg._id.toString(), agg);
  });

  const enrichedVendors = vendors.map((v) => {
    const stats = statsMap.get(v._id.toString()) || {
      totalInvoices: 0,
      totalAmount: 0,
      paidAmount: 0,
      pendingAmount: 0,
    };
    return {
      ...v.toObject(),
      stats,
    };
  });

  res.status(200).json({ success: true, vendors: enrichedVendors });
};

export const getVendorById = async (req: AuthRequest, res: Response): Promise<void> => {
  const { id } = req.params;

  const vendor = await Vendor.findOne({ _id: id, organization: req.orgId });
  if (!vendor) {
    res.status(404).json({ success: false, message: 'Vendor not found' });
    return;
  }

  // Fetch Vendor 360 profile metrics
  const invoices = await Invoice.find({ vendor: vendor._id, organization: req.orgId })
    .sort({ issueDate: -1 })
    .limit(50);

  const invoiceIds = invoices.map((i) => i._id);
  const payments = await Payment.find({ invoice: { $in: invoiceIds } })
    .sort({ paymentDate: -1 })
    .limit(50);

  const totalInvoices = invoices.length;
  const totalBilled = invoices.reduce((sum, inv) => sum + inv.totalAmount, 0);
  const totalPaid = invoices
    .filter((inv) => inv.status === 'PAID')
    .reduce((sum, inv) => sum + inv.totalAmount, 0);
  const outstandingBalance = totalBilled - totalPaid;

  res.status(200).json({
    success: true,
    vendor,
    profile360: {
      totalInvoices,
      totalBilled,
      totalPaid,
      outstandingBalance,
      invoices,
      payments,
    },
  });
};

export const createVendor = async (req: AuthRequest, res: Response): Promise<void> => {
  const vendorData = req.body;

  const existingCode = await Vendor.findOne({
    organization: req.orgId,
    code: vendorData.code.toUpperCase(),
  });
  if (existingCode) {
    res.status(400).json({ success: false, message: 'Vendor code already exists in this organization' });
    return;
  }

  const vendor = await Vendor.create({
    ...vendorData,
    code: vendorData.code.toUpperCase(),
    gstin: vendorData.gstin.toUpperCase(),
    organization: req.orgId,
  });

  await logAuditEvent({
    action: 'VENDOR_CREATE',
    entityType: 'Vendor',
    entityId: vendor._id.toString(),
    entityName: vendor.name,
    newValue: vendor.toObject(),
    req,
  });

  res.status(201).json({
    success: true,
    message: 'Vendor created successfully',
    vendor,
  });
};

export const updateVendor = async (req: AuthRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  const updates = req.body;

  const vendor = await Vendor.findOne({ _id: id, organization: req.orgId });
  if (!vendor) {
    res.status(404).json({ success: false, message: 'Vendor not found' });
    return;
  }

  const previousValue = vendor.toObject();

  if (updates.code) updates.code = updates.code.toUpperCase();
  if (updates.gstin) updates.gstin = updates.gstin.toUpperCase();

  Object.assign(vendor, updates);
  await vendor.save();

  await logAuditEvent({
    action: 'VENDOR_UPDATE',
    entityType: 'Vendor',
    entityId: vendor._id.toString(),
    entityName: vendor.name,
    previousValue,
    newValue: vendor.toObject(),
    req,
  });

  res.status(200).json({
    success: true,
    message: 'Vendor updated successfully',
    vendor,
  });
};

export const deleteVendor = async (req: AuthRequest, res: Response): Promise<void> => {
  const { id } = req.params;

  const vendor = await Vendor.findOne({ _id: id, organization: req.orgId });
  if (!vendor) {
    res.status(404).json({ success: false, message: 'Vendor not found' });
    return;
  }

  // Check if invoices exist
  const invoiceCount = await Invoice.countDocuments({ vendor: vendor._id });
  if (invoiceCount > 0) {
    res.status(400).json({
      success: false,
      message: `Cannot delete vendor with ${invoiceCount} linked invoices. Consider marking status as INACTIVE instead.`,
    });
    return;
  }

  await Vendor.deleteOne({ _id: vendor._id });

  await logAuditEvent({
    action: 'VENDOR_DELETE',
    entityType: 'Vendor',
    entityId: vendor._id.toString(),
    entityName: vendor.name,
    previousValue: vendor.toObject(),
    req,
  });

  res.status(200).json({ success: true, message: 'Vendor deleted successfully' });
};
