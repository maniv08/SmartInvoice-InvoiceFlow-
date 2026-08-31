import { z } from 'zod';

export const createVendorSchema = z.object({
  name: z.string().min(2, 'Vendor name is required'),
  code: z.string().min(2, 'Vendor code is required'),
  category: z.string().optional().default('General Supplies'),
  contactPerson: z.string().min(2, 'Contact person name is required'),
  email: z.string().email('Invalid email address'),
  phone: z.string().min(8, 'Phone number is required'),
  address: z
    .object({
      street: z.string().optional(),
      city: z.string().optional(),
      state: z.string().optional(),
      postalCode: z.string().optional(),
      country: z.string().optional().default('India'),
    })
    .optional(),
  gstin: z
    .string()
    .regex(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/, 'Invalid Indian GSTIN format (e.g. 29ABCDE1234F1Z5)'),
  panNumber: z.string().optional(),
  bankDetails: z.object({
    accountName: z.string().min(2, 'Account name is required'),
    accountNumber: z.string().min(8, 'Account number is required'),
    ifscCode: z.string().min(4, 'IFSC code is required'),
    bankName: z.string().min(2, 'Bank name is required'),
    branch: z.string().optional(),
  }),
  paymentTerms: z.string().optional().default('Net 30'),
  status: z.enum(['ACTIVE', 'INACTIVE', 'BLOCKED']).optional().default('ACTIVE'),
  notes: z.string().optional(),
});

export const updateVendorSchema = createVendorSchema.partial();
