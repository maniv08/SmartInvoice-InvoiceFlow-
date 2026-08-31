import { z } from 'zod';

export const updateApprovalThresholdsSchema = z.object({
  tier1Limit: z.number().min(1000, 'Tier 1 limit must be at least ₹1,000'),
  tier2Limit: z.number().min(5000, 'Tier 2 limit must be greater than Tier 1'),
});

export const updateReminderConfigSchema = z.object({
  preDueDays: z.array(z.number()).min(1),
  postDueDays: z.array(z.number()).min(1),
  emailNotificationsEnabled: z.boolean(),
  inAppNotificationsEnabled: z.boolean(),
  escalationRole: z.string().optional().default('FINANCE_MANAGER'),
});

export const updateCompanyProfileSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  phone: z.string().min(8),
  taxId: z.string().min(5),
  website: z.string().optional(),
});
