import mongoose, { Document, Schema } from 'mongoose';

export interface IOrganization extends Document {
  name: string;
  code: string;
  gstin?: string;
  email?: string;
  phone?: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    country?: string;
  };
  currency: string;
  logo?: string;
  createdAt: Date;
  updatedAt: Date;
}

const OrganizationSchema = new Schema<IOrganization>(
  {
    name: {
      type: String,
      required: [true, 'Organization name is required'],
      trim: true,
    },
    code: {
      type: String,
      required: [true, 'Organization code is required'],
      unique: true,
      uppercase: true,
      trim: true,
    },
    gstin: {
      type: String,
      trim: true,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
    },
    phone: {
      type: String,
      trim: true,
    },
    address: {
      street: String,
      city: String,
      state: String,
      postalCode: String,
      country: { type: String, default: 'India' },
    },
    currency: {
      type: String,
      default: 'INR',
      uppercase: true,
    },
    logo: String,
  },
  {
    timestamps: true,
  }
);

export const Organization = mongoose.model<IOrganization>('Organization', OrganizationSchema);
