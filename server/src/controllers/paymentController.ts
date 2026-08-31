import { Response } from 'express';
import { Payment, Invoice, Notification, Vendor } from '../models';
import { AuthRequest } from '../middleware/auth';
import { logAuditEvent } from '../middleware/auditLogger';

export const getPayments = async (req: AuthRequest, res: Response): Promise<void> => {
  const { status, paymentMethod, startDate, endDate, search } = req.query as any;

  const filter: any = { organization: req.orgId };

  if (status && status !== 'ALL') {
    filter.status = status;
  }
  if (paymentMethod && paymentMethod !== 'ALL') {
    filter.paymentMethod = paymentMethod;
  }
  if (startDate || endDate) {
    filter.paymentDate = {};
    if (startDate) filter.paymentDate.$gte = new Date(startDate);
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      filter.paymentDate.$lte = end;
    }
  }

  if (search) {
    const searchRegex = new RegExp(search, 'i');
    filter.$or = [
      { paymentNumber: searchRegex },
      { referenceId: searchRegex },
      { notes: searchRegex },
    ];
  }

  const payments = await Payment.find(filter)
    .populate({
      path: 'invoice',
      select: 'invoiceNumber totalAmount status dueDate vendor',
      populate: { path: 'vendor', select: 'name code gstin bankDetails' },
    })
    .populate('processedBy', 'name email avatar')
    .sort({ paymentDate: -1 });

  res.status(200).json({ success: true, payments });
};

export const recordPayment = async (req: AuthRequest, res: Response): Promise<void> => {
  const { invoiceId, amount, paymentDate, paymentMethod, referenceId, status = 'PAID', notes } = req.body;

  const invoice = await Invoice.findOne({ _id: invoiceId, organization: req.orgId }).populate('vendor', 'name email');
  if (!invoice) {
    res.status(404).json({ success: false, message: 'Invoice not found' });
    return;
  }

  const paymentNumber = `PAY-${Date.now().toString().slice(-6)}`;

  const payment = await Payment.create({
    paymentNumber,
    invoice: invoice._id,
    organization: req.orgId,
    amount: Number(amount),
    currency: invoice.currency || 'INR',
    paymentDate: paymentDate ? new Date(paymentDate) : new Date(),
    paymentMethod,
    referenceId,
    status,
    notes,
    processedBy: req.userId,
  });

  // Automatically update invoice status
  if (status === 'PAID') {
    invoice.status = 'PAID';
    await invoice.save();
  } else if (status === 'PROCESSING') {
    invoice.status = 'PAYMENT_PROCESSING';
    await invoice.save();
  }

  // Notify creator / vendor
  await Notification.create({
    user: invoice.createdBy,
    organization: invoice.organization,
    title: `Payment Dispatched: ${invoice.invoiceNumber}`,
    message: `Payment of ₹${Number(amount).toLocaleString('en-IN')} has been recorded (Ref: ${referenceId}).`,
    type: 'PAYMENT_COMPLETED',
    link: `/invoices/${invoice._id}`,
    metadata: { invoiceId: invoice._id, paymentId: payment._id, amount },
  });

  await logAuditEvent({
    action: 'PAYMENT_RECORD',
    entityType: 'Payment',
    entityId: payment._id.toString(),
    entityName: paymentNumber,
    newValue: payment.toObject(),
    req,
  });

  const populated = await payment.populate([
    { path: 'invoice', populate: { path: 'vendor' } },
    { path: 'processedBy', select: 'name email' },
  ]);

  res.status(201).json({
    success: true,
    message: 'Payment recorded successfully',
    payment: populated,
    updatedInvoiceStatus: invoice.status,
  });
};

export const updatePaymentStatus = async (req: AuthRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  const { status, referenceId, notes } = req.body;

  const payment = await Payment.findOne({ _id: id, organization: req.orgId });
  if (!payment) {
    res.status(404).json({ success: false, message: 'Payment record not found' });
    return;
  }

  const previousValue = payment.toObject();

  if (status) payment.status = status;
  if (referenceId) payment.referenceId = referenceId;
  if (notes) payment.notes = notes;

  await payment.save();

  // If marked paid, ensure invoice is paid
  if (status === 'PAID') {
    await Invoice.updateOne({ _id: payment.invoice }, { status: 'PAID' });
  }

  await logAuditEvent({
    action: 'PAYMENT_STATUS_UPDATE',
    entityType: 'Payment',
    entityId: payment._id.toString(),
    entityName: payment.paymentNumber,
    previousValue,
    newValue: payment.toObject(),
    req,
  });

  res.status(200).json({
    success: true,
    message: 'Payment status updated successfully',
    payment,
  });
};
