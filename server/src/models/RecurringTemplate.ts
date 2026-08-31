import mongoose, { Document, Schema, Types } from 'mongoose';
import { IInvoiceItem } from './Invoice';

export type RecurrenceFrequency = 'WEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'YEARLY';

export interface IRecurringTemplate extends Document {
  title: string;
  vendor: Types.ObjectId;
  organization: Types.ObjectId;
  frequency: RecurrenceFrequency;
  items: IInvoiceItem[];
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  totalAmount: number;
  paymentTerms: string;
  nextRunDate: Date;
  lastGeneratedDate?: Date;
  isActive: boolean;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const RecurringTemplateSchema = new Schema<IRecurringTemplate>(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    vendor: {
      type: Schema.Types.ObjectId,
      ref: 'Vendor',
      required: true,
    },
    organization: {
      type: Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
    },
    frequency: {
      type: String,
      enum: ['WEEKLY', 'MONTHLY', 'QUARTERLY', 'YEARLY'],
      default: 'MONTHLY',
    },
    items: [
      {
        description: { type: String, required: true },
        quantity: { type: Number, required: true, default: 1 },
        unitPrice: { type: Number, required: true },
        taxRate: { type: Number, default: 18 },
        taxAmount: { type: Number, default: 0 },
        amount: { type: Number, required: true },
      },
    ],
    subtotal: { type: Number, required: true },
    taxRate: { type: Number, default: 18 },
    taxAmount: { type: Number, required: true },
    totalAmount: { type: Number, required: true },
    paymentTerms: { type: String, default: 'Net 30' },
    nextRunDate: { type: Date, required: true },
    lastGeneratedDate: Date,
    isActive: { type: Boolean, default: true },
    notes: String,
  },
  {
    timestamps: true,
  }
);

export const RecurringTemplate = mongoose.model<IRecurringTemplate>(
  'RecurringTemplate',
  RecurringTemplateSchema
);
