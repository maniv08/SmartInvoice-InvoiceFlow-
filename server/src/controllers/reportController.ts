import { Response } from 'express';
import { Invoice, Payment, Vendor } from '../models';
import { AuthRequest } from '../middleware/auth';

export const getReportsData = async (req: AuthRequest, res: Response): Promise<void> => {
  const { startDate, endDate, vendorId, status, reportType = 'invoices' } = req.query as any;

  const orgId = req.orgId;
  const dateFilter: any = {};
  if (startDate) dateFilter.$gte = new Date(startDate);
  if (endDate) {
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);
    dateFilter.$lte = end;
  }

  if (reportType === 'payments') {
    const pFilter: any = { organization: orgId };
    if (Object.keys(dateFilter).length > 0) pFilter.paymentDate = dateFilter;
    if (status && status !== 'ALL') pFilter.status = status;

    const payments = await Payment.find(pFilter)
      .populate({
        path: 'invoice',
        select: 'invoiceNumber vendor totalAmount',
        populate: { path: 'vendor', select: 'name code' },
      })
      .sort({ paymentDate: -1 });

    const totalAmount = payments.reduce((s, p) => s + p.amount, 0);

    res.status(200).json({
      success: true,
      reportType: 'payments',
      data: payments,
      summary: {
        totalRecords: payments.length,
        totalAmount,
      },
    });
    return;
  }

  if (reportType === 'vendors') {
    const vFilter: any = { organization: orgId };
    if (vendorId && vendorId !== 'ALL') vFilter._id = vendorId;

    const vendors = await Vendor.find(vFilter);
    const invoices = await Invoice.find({ organization: orgId });

    const vendorReport = vendors.map((v) => {
      const vInvoices = invoices.filter((i) => i.vendor.toString() === v._id.toString());
      const billed = vInvoices.reduce((s, i) => s + i.totalAmount, 0);
      const paid = vInvoices.filter((i) => i.status === 'PAID').reduce((s, i) => s + i.totalAmount, 0);
      return {
        vendorId: v._id,
        vendorName: v.name,
        vendorCode: v.code,
        gstin: v.gstin,
        category: v.category,
        totalInvoices: vInvoices.length,
        totalBilled: billed,
        totalPaid: paid,
        outstanding: billed - paid,
      };
    });

    res.status(200).json({
      success: true,
      reportType: 'vendors',
      data: vendorReport,
      summary: {
        totalVendors: vendorReport.length,
        totalBilled: vendorReport.reduce((s, v) => s + v.totalBilled, 0),
        totalPaid: vendorReport.reduce((s, v) => s + v.totalPaid, 0),
      },
    });
    return;
  }

  if (reportType === 'tax') {
    const invFilter: any = { organization: orgId };
    if (Object.keys(dateFilter).length > 0) invFilter.issueDate = dateFilter;

    const invoices = await Invoice.find(invFilter).populate('vendor', 'name gstin');

    let totalSubtotal = 0;
    let totalTax = 0;
    let totalGross = 0;
    const taxByRate: Record<string, { taxableAmount: number; taxAmount: number }> = {};

    invoices.forEach((inv) => {
      totalSubtotal += inv.subtotal;
      totalTax += inv.taxAmount;
      totalGross += inv.totalAmount;

      inv.items.forEach((item) => {
        const rateKey = `${item.taxRate}% GST`;
        if (!taxByRate[rateKey]) {
          taxByRate[rateKey] = { taxableAmount: 0, taxAmount: 0 };
        }
        const itemSub = item.unitPrice * item.quantity;
        taxByRate[rateKey].taxableAmount += itemSub;
        taxByRate[rateKey].taxAmount += item.taxAmount || (itemSub * item.taxRate) / 100;
      });
    });

    res.status(200).json({
      success: true,
      reportType: 'tax',
      data: Object.entries(taxByRate).map(([rate, vals]) => ({
        taxSlab: rate,
        taxableAmount: vals.taxableAmount,
        taxAmount: vals.taxAmount,
        totalWithTax: vals.taxableAmount + vals.taxAmount,
      })),
      summary: {
        totalSubtotal,
        totalTax,
        totalGross,
      },
    });
    return;
  }

  // Default: Invoices Report
  const invFilter: any = { organization: orgId };
  if (Object.keys(dateFilter).length > 0) invFilter.issueDate = dateFilter;
  if (vendorId && vendorId !== 'ALL') invFilter.vendor = vendorId;
  if (status && status !== 'ALL') invFilter.status = status;

  const invoices = await Invoice.find(invFilter)
    .populate('vendor', 'name code gstin')
    .populate('approvedBy', 'name email')
    .sort({ issueDate: -1 });

  const totalInvoiced = invoices.reduce((s, i) => s + i.totalAmount, 0);
  const totalTax = invoices.reduce((s, i) => s + i.taxAmount, 0);

  res.status(200).json({
    success: true,
    reportType: 'invoices',
    data: invoices,
    summary: {
      totalInvoices: invoices.length,
      totalInvoiced,
      totalTax,
    },
  });
};
