import { Response } from 'express';
import { Invoice, Approval, ApprovalDelegation, User } from '../models';
import { AuthRequest } from '../middleware/auth';
import { processApprovalStep, processRejection } from '../services/approvalEngine';
import { logAuditEvent } from '../middleware/auditLogger';

export const getPendingApprovals = async (req: AuthRequest, res: Response): Promise<void> => {
  const userId = req.userId!;
  const orgId = req.orgId!;
  const now = new Date();

  // Find users who have delegated their approvals to current user
  const delegations = await ApprovalDelegation.find({
    organization: orgId,
    toUser: userId,
    isActive: true,
    startDate: { $lte: now },
    endDate: { $gte: now },
  });

  const delegatedFromUserIds = delegations.map((d) => d.fromUser.toString());
  const effectiveUserIds = [userId, ...delegatedFromUserIds];

  // Fetch pending invoices
  const filter: any = {
    organization: orgId,
    status: { $in: ['PENDING_APPROVAL', 'UNDER_VERIFICATION', 'SUBMITTED'] },
  };

  const invoices = await Invoice.find(filter)
    .populate('vendor', 'name code email gstin')
    .populate('createdBy', 'name email avatar')
    .sort({ createdAt: -1 });

  // Filter based on role and step
  const userRole = req.userRole;
  const filteredInvoices = invoices.filter((inv) => {
    if (userRole === 'ADMIN' || userRole === 'FINANCE_MANAGER') {
      return true;
    }
    // Approvers can approve step 1 or 2
    if (userRole === 'APPROVER') {
      return inv.currentApprovalStep <= 2;
    }
    return false;
  });

  res.status(200).json({
    success: true,
    pendingInvoices: filteredInvoices,
    delegationsActive: delegations,
  });
};

export const approveInvoice = async (req: AuthRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  const { comments } = req.body;

  try {
    const result = await processApprovalStep({
      invoiceId: id,
      user: req.user!,
      comments,
    });

    await logAuditEvent({
      action: 'INVOICE_APPROVE',
      entityType: 'Invoice',
      entityId: id,
      entityName: result.invoice.invoiceNumber,
      newValue: {
        currentApprovalStep: result.invoice.currentApprovalStep,
        status: result.invoice.status,
        comments,
      },
      req,
    });

    res.status(200).json({
      success: true,
      message: result.isCompleted ? 'Invoice fully approved!' : `Step ${result.currentStep} approval recorded.`,
      invoice: result.invoice,
      isCompleted: result.isCompleted,
    });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
};

export const rejectInvoice = async (req: AuthRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  const { reason } = req.body;

  try {
    const invoice = await processRejection({
      invoiceId: id,
      user: req.user!,
      reason,
    });

    await logAuditEvent({
      action: 'INVOICE_REJECT',
      entityType: 'Invoice',
      entityId: id,
      entityName: invoice.invoiceNumber,
      newValue: { status: 'REJECTED', rejectionReason: reason },
      req,
    });

    res.status(200).json({
      success: true,
      message: 'Invoice rejected successfully',
      invoice,
    });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
};

export const getDelegations = async (req: AuthRequest, res: Response): Promise<void> => {
  const delegations = await ApprovalDelegation.find({ organization: req.orgId })
    .populate('fromUser', 'name email role')
    .populate('toUser', 'name email role')
    .sort({ createdAt: -1 });

  res.status(200).json({ success: true, delegations });
};

export const createDelegation = async (req: AuthRequest, res: Response): Promise<void> => {
  const { toUserId, startDate, endDate, reason } = req.body;

  const toUser = await User.findById(toUserId);
  if (!toUser) {
    res.status(404).json({ success: false, message: 'Target delegatee user not found' });
    return;
  }

  const delegation = await ApprovalDelegation.create({
    organization: req.orgId,
    fromUser: req.userId,
    toUser: toUserId,
    startDate: new Date(startDate),
    endDate: new Date(endDate),
    reason,
    isActive: true,
  });

  await logAuditEvent({
    action: 'APPROVAL_DELEGATION_CREATE',
    entityType: 'ApprovalDelegation',
    entityId: delegation._id.toString(),
    newValue: { from: req.user?.name, to: toUser.name, startDate, endDate },
    req,
  });

  const populated = await delegation.populate(['fromUser', 'toUser']);

  res.status(201).json({
    success: true,
    message: 'Approval delegation established successfully',
    delegation: populated,
  });
};

export const revokeDelegation = async (req: AuthRequest, res: Response): Promise<void> => {
  const { id } = req.params;

  const delegation = await ApprovalDelegation.findOne({ _id: id, organization: req.orgId });
  if (!delegation) {
    res.status(404).json({ success: false, message: 'Delegation record not found' });
    return;
  }

  delegation.isActive = false;
  await delegation.save();

  res.status(200).json({ success: true, message: 'Delegation revoked successfully' });
};
