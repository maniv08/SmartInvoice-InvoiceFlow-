import { z } from 'zod';

export const createPaymentSchema = z.object({
  invoiceId: z.string().min(1, 'Invoice ID is required'),
  amount: z.number().min(1, 'Payment amount must be greater than 0'),
  paymentDate: z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}/)).optional(),
  paymentMethod: z.enum(['NEFT', 'RTGS', 'UPI', 'IMPS', 'CREDIT_CARD', 'CHEQUE', 'WIRE_TRANSFER']),
  referenceId: z.string().min(3, 'Transaction reference/UTR number is required'),
  status: z.enum(['NOT_DUE', 'DUE_SOON', 'DUE', 'OVERDUE', 'PROCESSING', 'PAID', 'FAILED']).optional().default('PAID'),
  notes: z.string().optional(),
});

export const updatePaymentStatusSchema = z.object({
  status: z.enum(['NOT_DUE', 'DUE_SOON', 'DUE', 'OVERDUE', 'PROCESSING', 'PAID', 'FAILED']),
  referenceId: z.string().optional(),
  notes: z.string().optional(),
});
