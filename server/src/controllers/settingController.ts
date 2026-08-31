import { Response } from 'express';
import { Setting, User, Organization } from '../models';
import { AuthRequest } from '../middleware/auth';
import { runReminderCheck } from '../services/reminderScheduler';
import { logAuditEvent } from '../middleware/auditLogger';

export const getSettings = async (req: AuthRequest, res: Response): Promise<void> => {
  let setting = await Setting.findOne({ organization: req.orgId });

  if (!setting) {
    setting = await Setting.create({
      organization: req.orgId,
      approvalThresholds: { tier1Limit: 10000, tier2Limit: 100000 },
      reminderConfig: {
        preDueDays: [7, 3, 1],
        postDueDays: [1, 7, 15],
        emailNotificationsEnabled: true,
        inAppNotificationsEnabled: true,
        escalationRole: 'FINANCE_MANAGER',
      },
    });
  }

  const organization = await Organization.findById(req.orgId);

  res.status(200).json({
    success: true,
    settings: setting,
    organization,
  });
};

export const updateApprovalThresholds = async (req: AuthRequest, res: Response): Promise<void> => {
  const { tier1Limit, tier2Limit } = req.body;

  let setting = await Setting.findOne({ organization: req.orgId });
  if (!setting) {
    setting = new Setting({ organization: req.orgId });
  }

  const previousValue = setting.approvalThresholds;
  setting.approvalThresholds = {
    tier1Limit: Number(tier1Limit),
    tier2Limit: Number(tier2Limit),
  };

  await setting.save();

  await logAuditEvent({
    action: 'APPROVAL_THRESHOLDS_UPDATE',
    entityType: 'Setting',
    entityId: setting._id.toString(),
    entityName: 'Approval Threshold Configuration',
    previousValue,
    newValue: setting.approvalThresholds,
    req,
  });

  res.status(200).json({
    success: true,
    message: 'Approval thresholds updated successfully. New rules will apply to future invoice submissions.',
    settings: setting,
  });
};

export const updateReminderConfig = async (req: AuthRequest, res: Response): Promise<void> => {
  const { preDueDays, postDueDays, emailNotificationsEnabled, inAppNotificationsEnabled, escalationRole } = req.body;

  let setting = await Setting.findOne({ organization: req.orgId });
  if (!setting) {
    setting = new Setting({ organization: req.orgId });
  }

  const previousValue = setting.reminderConfig;
  setting.reminderConfig = {
    preDueDays,
    postDueDays,
    emailNotificationsEnabled,
    inAppNotificationsEnabled,
    escalationRole: escalationRole || 'FINANCE_MANAGER',
  };

  await setting.save();

  await logAuditEvent({
    action: 'REMINDER_CONFIG_UPDATE',
    entityType: 'Setting',
    entityId: setting._id.toString(),
    entityName: 'Reminder & Scheduler Configuration',
    previousValue,
    newValue: setting.reminderConfig,
    req,
  });

  res.status(200).json({
    success: true,
    message: 'Reminder configuration updated successfully',
    settings: setting,
  });
};

export const updateCompanyProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  const profile = req.body;

  let setting = await Setting.findOne({ organization: req.orgId });
  if (!setting) {
    setting = new Setting({ organization: req.orgId });
  }

  setting.companyProfile = {
    ...setting.companyProfile,
    ...profile,
  };

  await setting.save();

  // Also update organization name if provided
  if (profile.name) {
    await Organization.updateOne({ _id: req.orgId }, { name: profile.name, gstin: profile.taxId, phone: profile.phone, email: profile.email });
  }

  res.status(200).json({
    success: true,
    message: 'Company profile updated successfully',
    settings: setting,
  });
};

export const getUsers = async (req: AuthRequest, res: Response): Promise<void> => {
  const users = await User.find({ organization: req.orgId })
    .select('-password')
    .populate('vendor', 'name code')
    .sort({ createdAt: -1 });

  res.status(200).json({ success: true, users });
};

export const updateUserRole = async (req: AuthRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  const { role, isActive } = req.body;

  const user = await User.findOne({ _id: id, organization: req.orgId });
  if (!user) {
    res.status(404).json({ success: false, message: 'User not found' });
    return;
  }

  const previousValue = { role: user.role, isActive: user.isActive };

  if (role) user.role = role;
  if (isActive !== undefined) user.isActive = isActive;

  await user.save();

  await logAuditEvent({
    action: 'USER_ROLE_UPDATE',
    entityType: 'User',
    entityId: user._id.toString(),
    entityName: user.name,
    previousValue,
    newValue: { role: user.role, isActive: user.isActive },
    req,
  });

  res.status(200).json({
    success: true,
    message: 'User permissions updated successfully',
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      isActive: user.isActive,
    },
  });
};

export const triggerScheduler = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const result = await runReminderCheck();

    await logAuditEvent({
      action: 'SCHEDULER_MANUAL_RUN',
      entityType: 'Scheduler',
      entityId: 'manual-trigger',
      entityName: 'Manual Reminder Scheduler Trigger',
      newValue: result,
      req,
    });

    res.status(200).json({
      success: true,
      message: 'Reminder & Recurring Scheduler executed successfully',
      result,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};
