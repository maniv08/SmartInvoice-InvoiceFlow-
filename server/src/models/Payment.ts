import mongoose, { Document, Schema, Types } from 'mongoose';

export type PaymentMethod =
  | 'NEFT'
  | 'RTGS'
  | 'UPI'
  | 'IMPS'
  | 'CREDIT_CARD'
  | 'CHEQUE'
  | 'WIRE_TRANSFER';

export type PaymentStatus =
  | 'NOT_DUE'
  | 'DUE_SOON'
  | 'DUE'
  | 'OVERDUE'
  | 'PROCESSING'
  | 'PAID'
  | 'FAILED';

export interface IPayment extends Document {
  paymentNumber: string;
  invoice: Types.ObjectId;
  organization: Types.ObjectId;
  amount: number;
  currency: string;
  paymentDate: Date;
  paymentMethod: PaymentMethod;
  referenceId: string;
  status: PaymentStatus;
  notes?: string;
  processedBy?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const PaymentSchema = new Schema<IPayment>(
  {
    paymentNumber: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
    },
    invoice: {
      type: Schema.Types.ObjectId,
      ref: 'Invoice',
      required: true,
    },
    organization: {
      type: Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    currency: {
      type: String,
      default: 'INR',
      uppercase: true,
    },
    paymentDate: {
      type: Date,
      required: true,
      default: Date.now,
    },
    paymentMethod: {
      type: String,
      enum: ['NEFT', 'RTGS', 'UPI', 'IMPS', 'CREDIT_CARD', 'CHEQUE', 'WIRE_TRANSFER'],
      required: true,
    },
    referenceId: {
      type: String,
      required: [true, 'UTR / Reference transaction ID is required'],
      trim: true,
    },
    status: {
      type: String,
      enum: ['NOT_DUE', 'DUE_SOON', 'DUE', 'OVERDUE', 'PROCESSING', 'PAID', 'FAILED'],
      default: 'PROCESSING',
    },
    notes: String,
    processedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

PaymentSchema.index({ invoice: 1 });
PaymentSchema.index({ organization: 1, status: 1 });
PaymentSchema.index({ organization: 1, paymentDate: -1 });

export const Payment = mongoose.model<IPayment>('Payment', PaymentSchema);
