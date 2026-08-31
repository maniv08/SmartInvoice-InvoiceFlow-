import { z } from 'zod';

export const invoiceItemSchema = z.object({
  description: z.string().min(1, 'Item description is required'),
  quantity: z.number().min(1, 'Quantity must be at least 1').default(1),
  unitPrice: z.number().min(0, 'Unit price must be positive'),
  taxRate: z.number().min(0).default(18),
  taxAmount: z.number().min(0).optional(),
  amount: z.number().min(0).optional(),
});

export const createInvoiceSchema = z.object({
  invoiceNumber: z.string().min(2, 'Invoice number is required'),
  vendorId: z.string().min(1, 'Vendor ID is required'),
  poNumber: z.string().optional(),
  description: z.string().optional(),
  issueDate: z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}/)),
  dueDate: z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}/)),
  paymentTerms: z.string().optional().default('Net 30'),
  currency: z.string().optional().default('INR'),
  items: z.array(invoiceItemSchema).min(1, 'At least one line item is required'),
  subtotal: z.number().min(0),
  taxRate: z.number().min(0).default(18),
  taxAmount: z.number().min(0),
  discountAmount: z.number().min(0).optional().default(0),
  totalAmount: z.number().min(0),
  status: z.enum([
    'DRAFT',
    'SUBMITTED',
    'UNDER_VERIFICATION',
    'PENDING_APPROVAL',
    'APPROVED',
    'REJECTED',
    'PAYMENT_PROCESSING',
    'PAID',
    'OVERDUE',
  ]).optional().default('DRAFT'),
  notes: z.string().optional(),
});

export const updateInvoiceSchema = createInvoiceSchema.partial();

export const duplicateCheckSchema = z.object({
  vendorId: z.string().min(1, 'Vendor ID is required'),
  invoiceNumber: z.string().min(1, 'Invoice number is required'),
  amount: z.number().optional(),
  issueDate: z.string().optional(),
  excludeId: z.string().optional(),
});

export const invoiceQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(10),
  search: z.string().optional(),
  status: z.string().optional(),
  vendorId: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  minAmount: z.coerce.number().optional(),
  maxAmount: z.coerce.number().optional(),
  sortBy: z.string().optional().default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
});
