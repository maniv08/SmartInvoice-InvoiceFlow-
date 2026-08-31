import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IApprovalThresholds {
  tier1Limit: number; // < tier1Limit -> 1 approval (e.g. 10,000 INR)
  tier2Limit: number; // tier1Limit to tier2Limit -> 2 approvals (e.g. 100,000 INR), > tier2Limit -> 3 approvals
}

export interface IReminderConfig {
  preDueDays: number[]; // e.g. [7, 3, 1]
  postDueDays: number[]; // e.g. [1, 7, 15]
  emailNotificationsEnabled: boolean;
  inAppNotificationsEnabled: boolean;
  escalationRole: string; // e.g. 'FINANCE_MANAGER'
}

export interface ISetting extends Document {
  organization: Types.ObjectId;
  approvalThresholds: IApprovalThresholds;
  reminderConfig: IReminderConfig;
  companyProfile: {
    name: string;
    email: string;
    phone: string;
    taxId: string;
    website?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

const SettingSchema = new Schema<ISetting>(
  {
    organization: {
      type: Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
      unique: true,
    },
    approvalThresholds: {
      tier1Limit: { type: Number, default: 10000 },
      tier2Limit: { type: Number, default: 100000 },
    },
    reminderConfig: {
      preDueDays: { type: [Number], default: [7, 3, 1] },
      postDueDays: { type: [Number], default: [1, 7, 15] },
      emailNotificationsEnabled: { type: Boolean, default: true },
      inAppNotificationsEnabled: { type: Boolean, default: true },
      escalationRole: { type: String, default: 'FINANCE_MANAGER' },
    },
    companyProfile: {
      name: { type: String, default: 'Acme Enterprises India' },
      email: { type: String, default: 'finance@acmeindia.com' },
      phone: { type: String, default: '+91 80 2345 6789' },
      taxId: { type: String, default: '29ABCDE1234F1Z5' },
      website: { type: String, default: 'https://acmeindia.com' },
    },
  },
  {
    timestamps: true,
  }
);

export const Setting = mongoose.model<ISetting>('Setting', SettingSchema);
