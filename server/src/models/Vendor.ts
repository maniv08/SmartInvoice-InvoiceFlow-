import mongoose, { Document, Schema, Types } from 'mongoose';

export type VendorStatus = 'ACTIVE' | 'INACTIVE' | 'BLOCKED';

export interface IVendor extends Document {
  name: string;
  code: string;
  category: string;
  contactPerson: string;
  email: string;
  phone: string;
  address: {
    street?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    country?: string;
  };
  gstin: string;
  panNumber?: string;
  bankDetails: {
    accountName: string;
    accountNumber: string;
    ifscCode: string;
    bankName: string;
    branch?: string;
  };
  paymentTerms: string;
  status: VendorStatus;
  organization: Types.ObjectId;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const VendorSchema = new Schema<IVendor>(
  {
    name: {
      type: String,
      required: [true, 'Vendor name is required'],
      trim: true,
    },
    code: {
      type: String,
      required: [true, 'Vendor code is required'],
      uppercase: true,
      trim: true,
    },
    category: {
      type: String,
      default: 'General Supplies',
      trim: true,
    },
    contactPerson: {
      type: String,
      required: [true, 'Contact person name is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Vendor email is required'],
      lowercase: true,
      trim: true,
    },
    phone: {
      type: String,
      required: [true, 'Vendor phone is required'],
      trim: true,
    },
    address: {
      street: String,
      city: String,
      state: String,
      postalCode: String,
      country: { type: String, default: 'India' },
    },
    gstin: {
      type: String,
      required: [true, 'GSTIN is required'],
      uppercase: true,
      trim: true,
    },
    panNumber: {
      type: String,
      uppercase: true,
      trim: true,
    },
    bankDetails: {
      accountName: { type: String, required: true },
      accountNumber: { type: String, required: true },
      ifscCode: { type: String, required: true, uppercase: true },
      bankName: { type: String, required: true },
      branch: String,
    },
    paymentTerms: {
      type: String,
      default: 'Net 30',
    },
    status: {
      type: String,
      enum: ['ACTIVE', 'INACTIVE', 'BLOCKED'],
      default: 'ACTIVE',
    },
    organization: {
      type: Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
    },
    notes: String,
  },
  {
    timestamps: true,
  }
);

VendorSchema.index({ organization: 1 });
VendorSchema.index({ organization: 1, code: 1 }, { unique: true });
VendorSchema.index({ organization: 1, gstin: 1 });

export const Vendor = mongoose.model<IVendor>('Vendor', VendorSchema);
