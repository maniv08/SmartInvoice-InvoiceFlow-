import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IPOItem {
  description: string;
  hsnCode?: string;
  quantity: number;
  unitPrice: number;
  taxRate: number;
  taxAmount: number;
  amount: number;
}

export interface IPurchaseOrder extends Document {
  poNumber: string;
  organization: Types.ObjectId;
  vendor: Types.ObjectId;
  orderDate: Date;
  deliveryDate?: Date;
  status: 'OPEN' | 'PARTIALLY_FULFILLED' | 'COMPLETED' | 'CANCELLED';
  items: IPOItem[];
  subtotal: number;
  taxAmount: number;
  totalAmount: number;
  grnRecords: Array<{
    grnNumber: string;
    receivedDate: Date;
    receivedBy: string;
    items: Array<{
      description: string;
      receivedQuantity: number;
      acceptedQuantity: number;
      rejectedQuantity: number;
    }>;
  }>;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const POItemSchema = new Schema<IPOItem>(
  {
    description: { type: String, required: true, trim: true },
    hsnCode: { type: String, trim: true, default: '998313' },
    quantity: { type: Number, required: true, min: 1 },
    unitPrice: { type: Number, required: true, min: 0 },
    taxRate: { type: Number, default: 18 },
    taxAmount: { type: Number, default: 0 },
    amount: { type: Number, required: true },
  },
  { _id: true }
);

const PurchaseOrderSchema = new Schema<IPurchaseOrder>(
  {
    poNumber: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
    },
    organization: {
      type: Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
    },
    vendor: {
      type: Schema.Types.ObjectId,
      ref: 'Vendor',
      required: true,
    },
    orderDate: {
      type: Date,
      required: true,
      default: Date.now,
    },
    deliveryDate: Date,
    status: {
      type: String,
      enum: ['OPEN', 'PARTIALLY_FULFILLED', 'COMPLETED', 'CANCELLED'],
      default: 'OPEN',
    },
    items: {
      type: [POItemSchema],
      default: [],
    },
    subtotal: {
      type: Number,
      required: true,
      min: 0,
    },
    taxAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    grnRecords: [
      {
        grnNumber: String,
        receivedDate: { type: Date, default: Date.now },
        receivedBy: String,
        items: [
          {
            description: String,
            receivedQuantity: Number,
            acceptedQuantity: Number,
            rejectedQuantity: { type: Number, default: 0 },
          },
        ],
      },
    ],
    notes: String,
  },
  {
    timestamps: true,
  }
);

PurchaseOrderSchema.index({ organization: 1, poNumber: 1 }, { unique: true });
PurchaseOrderSchema.index({ organization: 1, vendor: 1 });

export const PurchaseOrder = mongoose.model<IPurchaseOrder>('PurchaseOrder', PurchaseOrderSchema);
