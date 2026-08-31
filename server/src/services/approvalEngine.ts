import { Invoice, Setting, Approval, ApprovalDelegation, Notification, User, IInvoice, IUser } from '../models';

export const calculateRequiredApprovalSteps = async (
  organizationId: string,
  totalAmount: number
): Promise<number> => {
  const setting = await Setting.findOne({ organization: organizationId });
  const tier1 = setting?.approvalThresholds?.tier1Limit || 10000;
  const tier2 = setting?.approvalThresholds?.tier2Limit || 100000;

  if (totalAmount < tier1) {
    return 1;
  } else if (totalAmount <= tier2) {
    return 2;
  } else {
    return 3;
  }
};

export const checkDelegation = async (
  organizationId: string,
  targetApproverId: string,
  currentUserId: string
): Promise<{ isDelegated: boolean; originalApproverId?: string }> => {
  if (targetApproverId === currentUserId) {
    return { isDelegated: false };
  }

  const now = new Date();
  const delegation = await ApprovalDelegation.findOne({
    organization: organizationId,
    fromUser: targetApproverId,
    toUser: currentUserId,
    isActive: true,
    startDate: { $lte: now },
    endDate: { $gte: now },
  });

  if (delegation) {
    return {
      isDelegated: true,
      originalApproverId: targetApproverId,
    };
  }

  return { isDelegated: false };
};

export const processApprovalStep = async (params: {
  invoiceId: string;
  user: IUser;
  comments?: string;
}): Promise<{ invoice: IInvoice; isCompleted: boolean; currentStep: number }> => {
  const { invoiceId, user, comments } = params;

  const invoice = await Invoice.findById(invoiceId).populate('vendor', 'name');
  if (!invoice) {
    throw new Error('Invoice not found');
  }

  if (invoice.status !== 'PENDING_APPROVAL' && invoice.status !== 'UNDER_VERIFICATION' && invoice.status !== 'SUBMITTED') {
    throw new Error(`Cannot approve invoice in status '${invoice.status}'`);
  }

  const currentStep = invoice.currentApprovalStep || 1;
  const requiredSteps = invoice.requiredApprovalSteps || 1;

  // Record this approval step
  await Approval.create({
    invoice: invoice._id,
    organization: invoice.organization,
    stepNumber: currentStep,
    approver: user._id,
    status: 'APPROVED',
    comments,
    decisionDate: new Date(),
  });

  let isCompleted = false;

  if (currentStep >= requiredSteps) {
    // Final approval reached
    invoice.status = 'APPROVED';
    invoice.approvedBy = user._id;
    isCompleted = true;

    // Notify Finance Manager and submitter
    await Notification.create({
      user: invoice.createdBy,
      organization: invoice.organization,
      title: `Invoice ${invoice.invoiceNumber} Approved!`,
      message: `Invoice ${invoice.invoiceNumber} for ${(invoice.vendor as any)?.name || 'vendor'} has been fully approved for payment.`,
      type: 'APPROVED',
      link: `/invoices/${invoice._id}`,
      metadata: { invoiceId: invoice._id, amount: invoice.totalAmount },
    });
  } else {
    // Advance to next step
    invoice.currentApprovalStep = currentStep + 1;
    invoice.status = 'PENDING_APPROVAL';

    // Find next approver or notify approvers
    const nextApprovers = await User.find({
      organization: invoice.organization,
      role: currentStep + 1 >= 3 ? 'FINANCE_MANAGER' : 'APPROVER',
      isActive: true,
    });

    for (const app of nextApprovers) {
      await Notification.create({
        user: app._id,
        organization: invoice.organization,
        title: `Step ${currentStep + 1} Approval Required`,
        message: `Invoice ${invoice.invoiceNumber} requires Step ${currentStep + 1} approval.`,
        type: 'APPROVAL_PENDING',
        link: `/invoices/${invoice._id}`,
        metadata: { invoiceId: invoice._id, step: currentStep + 1 },
      });
    }
  }

  await invoice.save();
  return { invoice, isCompleted, currentStep };
};

export const processRejection = async (params: {
  invoiceId: string;
  user: IUser;
  reason: string;
}): Promise<IInvoice> => {
  const { invoiceId, user, reason } = params;

  const invoice = await Invoice.findById(invoiceId);
  if (!invoice) {
    throw new Error('Invoice not found');
  }

  invoice.status = 'REJECTED';
  invoice.rejectedBy = user._id;
  invoice.rejectionReason = reason;
  invoice.rejectedAt = new Date();

  await Approval.create({
    invoice: invoice._id,
    organization: invoice.organization,
    stepNumber: invoice.currentApprovalStep,
    approver: user._id,
    status: 'REJECTED',
    comments: reason,
    decisionDate: new Date(),
  });

  // Notify creator about rejection
  await Notification.create({
    user: invoice.createdBy,
    organization: invoice.organization,
    title: `Invoice ${invoice.invoiceNumber} Rejected`,
    message: `Invoice ${invoice.invoiceNumber} was rejected by ${user.name}. Reason: "${reason}"`,
    type: 'REJECTED',
    link: `/invoices/${invoice._id}`,
    metadata: { invoiceId: invoice._id, reason },
  });

  await invoice.save();
  return invoice;
};
