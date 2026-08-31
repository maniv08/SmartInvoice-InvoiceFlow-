import mongoose, { Document, Schema, Types } from 'mongoose';

export type UserRole = 'ADMIN' | 'FINANCE_MANAGER' | 'APPROVER' | 'VENDOR';

export interface IUser extends Document {
  name: string;
  email: string;
  password?: string;
  role: UserRole;
  organization: Types.ObjectId;
  vendor?: Types.ObjectId;
  avatar?: string;
  twoFactorEnabled: boolean;
  twoFactorSecret?: string;
  isActive: boolean;
  lastLogin?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: 6,
      select: false, // Don't return password by default
    },
    role: {
      type: String,
      enum: ['ADMIN', 'FINANCE_MANAGER', 'APPROVER', 'VENDOR'],
      default: 'APPROVER',
      required: true,
    },
    organization: {
      type: Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
    },
    vendor: {
      type: Schema.Types.ObjectId,
      ref: 'Vendor',
    },
    avatar: String,
    twoFactorEnabled: {
      type: Boolean,
      default: false,
    },
    twoFactorSecret: {
      type: String,
      select: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    lastLogin: Date,
  },
  {
    timestamps: true,
  }
);

UserSchema.index({ organization: 1, role: 1 });

export const User = mongoose.model<IUser>('User', UserSchema);
