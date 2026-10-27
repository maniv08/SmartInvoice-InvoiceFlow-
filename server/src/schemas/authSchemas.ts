import { z } from 'zod';

export const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  role: z.enum(['ADMIN', 'FINANCE_MANAGER', 'APPROVER', 'VENDOR']).optional().default('APPROVER'),
  vendorId: z.string().optional(),
  organizationName: z.string().optional(),
  vendorName: z.string().optional(),
  gstin: z.string().optional(),
  department: z.string().optional(),
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
  twoFactorToken: z.string().optional(),
});

export const verify2FASchema = z.object({
  token: z.string().min(6, '2FA token must be 6 digits').max(6),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(6, 'New password must be at least 6 characters'),
});

export const updateProfileSchema = z.object({
  name: z.string().min(2).optional(),
  avatar: z.string().optional(),
});
