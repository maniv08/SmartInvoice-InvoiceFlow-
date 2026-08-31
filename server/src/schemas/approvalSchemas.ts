import { z } from 'zod';

export const approveInvoiceSchema = z.object({
  comments: z.string().optional(),
});

export const rejectInvoiceSchema = z.object({
  reason: z.string().min(3, 'Rejection reason is required and must explain why the invoice was rejected'),
});

export const createDelegationSchema = z.object({
  toUserId: z.string().min(1, 'Delegatee user ID is required'),
  startDate: z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}/)),
  endDate: z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}/)),
  reason: z.string().optional(),
});
