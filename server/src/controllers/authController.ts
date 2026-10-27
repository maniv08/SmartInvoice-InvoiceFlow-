import { Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import speakeasy from 'speakeasy';
import QRCode from 'qrcode';
import { User, Organization, Vendor } from '../models';
import { AuthRequest } from '../middleware/auth';
import { logAuditEvent } from '../middleware/auditLogger';

const signToken = (user: any): string => {
  const secret = process.env.JWT_SECRET || 'invoiceflow_super_secret_jwt_key_2026_production_grade';
  const expiresIn = process.env.JWT_EXPIRES_IN || '7d';
  return jwt.sign(
    {
      id: user._id,
      email: user.email,
      role: user.role,
      orgId: user.organization,
    },
    secret,
    { expiresIn: expiresIn as any }
  );
};

export const register = async (req: AuthRequest, res: Response): Promise<void> => {
  const { name, email, password, role, vendorId, organizationName, vendorName, gstin } = req.body;

  const existingUser = await User.findOne({ email: email.toLowerCase() });
  if (existingUser) {
    res.status(400).json({ success: false, message: 'User already exists with this email address' });
    return;
  }

  // Find or create organization
  let org = await Organization.findOne({});
  if (role === 'ADMIN' && organizationName) {
    const code = organizationName.replace(/[^a-zA-Z0-9]/g, '').slice(0, 6).toUpperCase() || 'ORG_01';
    org = await Organization.create({
      name: organizationName,
      code,
      email: email.toLowerCase(),
    });
  } else if (!org) {
    org = await Organization.create({
      name: organizationName || 'DBS World Pvt Ltd',
      code: 'DBS_WLD',
    });
  }

  // Handle vendor creation if VENDOR role and vendorName provided
  let linkedVendorId = vendorId;
  if (role === 'VENDOR' && !linkedVendorId && vendorName) {
    const vCode = 'VEND-' + Math.random().toString(36).substring(2, 7).toUpperCase();
    const newVendor = await Vendor.create({
      name: vendorName,
      code: vCode,
      category: 'General Supplies & Services',
      contactPerson: name,
      email: email.toLowerCase(),
      phone: '+91 98765 43210',
      gstin: gstin || '29AABCT1234Z1ZA',
      bankDetails: {
        accountName: vendorName,
        accountNumber: '000000' + Math.floor(100000 + Math.random() * 900000),
        ifscCode: 'HDFC0001234',
        bankName: 'HDFC Bank Ltd',
      },
      paymentTerms: 'Net 30',
      status: 'ACTIVE',
      organization: org._id,
    });
    linkedVendorId = newVendor._id;
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await User.create({
    name,
    email: email.toLowerCase(),
    password: hashedPassword,
    role: role || 'APPROVER',
    organization: org._id,
    vendor: linkedVendorId || undefined,
  });

  const token = signToken(user);

  await logAuditEvent({
    action: 'USER_REGISTER',
    entityType: 'User',
    entityId: user._id.toString(),
    entityName: user.name,
    newValue: { email: user.email, role: user.role },
    req,
  });

  res.status(201).json({
    success: true,
    message: 'User registered successfully',
    token,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      organization: org,
      twoFactorEnabled: user.twoFactorEnabled,
    },
  });
};

export const login = async (req: AuthRequest, res: Response): Promise<void> => {
  const { email, password, twoFactorToken } = req.body;

  const user = await User.findOne({ email: email.toLowerCase() })
    .select('+password +twoFactorSecret')
    .populate('organization')
    .populate('vendor');

  if (!user || !user.password) {
    res.status(401).json({ success: false, message: 'Invalid email or password' });
    return;
  }

  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) {
    res.status(401).json({ success: false, message: 'Invalid email or password' });
    return;
  }

  // 2FA Verification if enabled
  if (user.twoFactorEnabled && user.twoFactorSecret) {
    if (!twoFactorToken) {
      res.status(200).json({
        success: true,
        requires2FA: true,
        message: 'Two-factor authentication code required',
      });
      return;
    }

    const verified = speakeasy.totp.verify({
      secret: user.twoFactorSecret,
      encoding: 'base32',
      token: twoFactorToken,
      window: 1,
    });

    if (!verified) {
      res.status(401).json({ success: false, message: 'Invalid 2FA authentication code' });
      return;
    }
  }

  user.lastLogin = new Date();
  await user.save();

  const token = signToken(user);

  res.status(200).json({
    success: true,
    message: 'Login successful',
    token,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      organization: user.organization,
      vendor: user.vendor,
      avatar: user.avatar,
      twoFactorEnabled: user.twoFactorEnabled,
    },
  });
};

export const getProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  const user = await User.findById(req.userId)
    .populate('organization')
    .populate('vendor');

  if (!user) {
    res.status(404).json({ success: false, message: 'User profile not found' });
    return;
  }

  res.status(200).json({
    success: true,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      organization: user.organization,
      vendor: user.vendor,
      avatar: user.avatar,
      twoFactorEnabled: user.twoFactorEnabled,
      createdAt: user.createdAt,
    },
  });
};

export const updateProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  const { name, avatar } = req.body;
  const user = await User.findById(req.userId);
  if (!user) {
    res.status(404).json({ success: false, message: 'User not found' });
    return;
  }

  if (name) user.name = name;
  if (avatar !== undefined) user.avatar = avatar;

  await user.save();

  res.status(200).json({
    success: true,
    message: 'Profile updated successfully',
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatar: user.avatar,
    },
  });
};

export const changePassword = async (req: AuthRequest, res: Response): Promise<void> => {
  const { currentPassword, newPassword } = req.body;
  const user = await User.findById(req.userId).select('+password');
  if (!user || !user.password) {
    res.status(404).json({ success: false, message: 'User not found' });
    return;
  }

  const isValid = await bcrypt.compare(currentPassword, user.password);
  if (!isValid) {
    res.status(400).json({ success: false, message: 'Current password does not match' });
    return;
  }

  user.password = await bcrypt.hash(newPassword, 10);
  await user.save();

  res.status(200).json({ success: true, message: 'Password updated successfully' });
};

export const setup2FA = async (req: AuthRequest, res: Response): Promise<void> => {
  const user = await User.findById(req.userId);
  if (!user) {
    res.status(404).json({ success: false, message: 'User not found' });
    return;
  }

  const secret = speakeasy.generateSecret({
    name: `InvoiceFlow (${user.email})`,
    issuer: 'InvoiceFlow System',
  });

  user.twoFactorSecret = secret.base32;
  await user.save();

  const qrCodeDataUrl = await QRCode.toDataURL(secret.otpauth_url || '');

  res.status(200).json({
    success: true,
    secret: secret.base32,
    qrCode: qrCodeDataUrl,
  });
};

export const verify2FA = async (req: AuthRequest, res: Response): Promise<void> => {
  const { token } = req.body;
  const user = await User.findById(req.userId).select('+twoFactorSecret');
  if (!user || !user.twoFactorSecret) {
    res.status(400).json({ success: false, message: '2FA has not been set up yet' });
    return;
  }

  const verified = speakeasy.totp.verify({
    secret: user.twoFactorSecret,
    encoding: 'base32',
    token,
    window: 1,
  });

  if (!verified) {
    res.status(400).json({ success: false, message: 'Invalid 2FA verification token' });
    return;
  }

  user.twoFactorEnabled = true;
  await user.save();

  res.status(200).json({ success: true, message: 'Two-factor authentication enabled successfully!' });
};

export const disable2FA = async (req: AuthRequest, res: Response): Promise<void> => {
  const user = await User.findById(req.userId);
  if (!user) {
    res.status(404).json({ success: false, message: 'User not found' });
    return;
  }

  user.twoFactorEnabled = false;
  user.twoFactorSecret = undefined;
  await user.save();

  res.status(200).json({ success: true, message: 'Two-factor authentication disabled' });
};

export const getOrganizations = async (_req: AuthRequest, res: Response): Promise<void> => {
  const organizations = await Organization.find({});
  res.status(200).json({ success: true, organizations });
};
