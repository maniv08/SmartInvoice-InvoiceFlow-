import mongoose, { Document, Schema, Types } from 'mongoose';

export type InvoiceStatus =
  | 'DRAFT'
  | 'SUBMITTED'
  | 'UNDER_VERIFICATION'
  | 'PENDING_APPROVAL'
  | 'APPROVED'
  | 'REJECTED'
  | 'PAYMENT_PROCESSING'
  | 'PAID'
  | 'OVERDUE';

export interface IInvoiceItem {
  description: string;
  hsnCode?: string;
  quantity: number;
  unitPrice: number;
  taxRate: number; // e.g. 18 for 18%
  taxAmount: number;
  amount: number;
}

export interface IInvoiceAttachment {
  filename: string;
  originalName: string;
  url: string;
  fileType: string;
  fileSize: number;
  uploadedBy?: Types.ObjectId;
  uploadedAt?: Date;
}

export interface IInvoice extends Document {
  invoiceNumber: string;
  vendor: Types.ObjectId;
  organization: Types.ObjectId;
  poNumber?: string;
  description?: string;
  issueDate: Date;
  dueDate: Date;
  paymentTerms: string;
  currency: string;
  items: IInvoiceItem[];
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  discountAmount: number;
  totalAmount: number;
  status: InvoiceStatus;
  matchingStatus?: 'PERFECT_MATCH' | 'TOLERANCE_ACCEPTED' | 'DISCREPANCY_FLAGGED' | 'NO_PO_FOUND';
  matchingScore?: number;
  ocrConfidence?: number;
  gstBreakdown?: {
    isInterState: boolean;
    supplierGSTIN?: string;
    buyerGSTIN?: string;
    isGSTINValid?: boolean;
    cgstAmount: number;
    sgstAmount: number;
    igstAmount: number;
  };
  createdBy: Types.ObjectId;
  approvedBy?: Types.ObjectId;
  rejectionReason?: string;
  rejectedBy?: Types.ObjectId;
  rejectedAt?: Date;
  currentApprovalStep: number;
  requiredApprovalSteps: number;
  attachments: IInvoiceAttachment[];
  remindersSent: Array<{
    reminderType: string;
    sentAt: Date;
    recipient: string;
  }>;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const InvoiceItemSchema = new Schema<IInvoiceItem>(
  {
    description: { type: String, required: true, trim: true },
    hsnCode: { type: String, trim: true, default: '998313' },
    quantity: { type: Number, required: true, min: 1, default: 1 },
    unitPrice: { type: Number, required: true, min: 0 },
    taxRate: { type: Number, default: 18, min: 0 },
    taxAmount: { type: Number, default: 0, min: 0 },
    amount: { type: Number, required: true, min: 0 },
  },
  { _id: true }
);

const InvoiceAttachmentSchema = new Schema<IInvoiceAttachment>(
  {
    filename: { type: String, required: true },
    originalName: { type: String, required: true },
    url: { type: String, required: true },
    fileType: { type: String, required: true },
    fileSize: { type: Number, required: true },
    uploadedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    uploadedAt: { type: Date, default: Date.now },
  },
  { _id: true }
);

const InvoiceSchema = new Schema<IInvoice>(
  {
    invoiceNumber: {
      type: String,
      required: [true, 'Invoice number is required'],
      uppercase: true,
      trim: true,
    },
    vendor: {
      type: Schema.Types.ObjectId,
      ref: 'Vendor',
      required: [true, 'Vendor reference is required'],
    },
    organization: {
      type: Schema.Types.ObjectId,
      ref: 'Organization',
      required: [true, 'Organization reference is required'],
    },
    poNumber: {
      type: String,
      uppercase: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    issueDate: {
      type: Date,
      required: [true, 'Issue date is required'],
    },
    dueDate: {
      type: Date,
      required: [true, 'Due date is required'],
    },
    paymentTerms: {
      type: String,
      default: 'Net 30',
    },
    currency: {
      type: String,
      default: 'INR',
      uppercase: true,
    },
    items: {
      type: [InvoiceItemSchema],
      default: [],
    },
    subtotal: {
      type: Number,
      required: true,
      min: 0,
    },
    taxRate: {
      type: Number,
      default: 18,
      min: 0,
    },
    taxAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    discountAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    status: {
      type: String,
      enum: [
        'DRAFT',
        'SUBMITTED',
        'UNDER_VERIFICATION',
        'PENDING_APPROVAL',
        'APPROVED',
        'REJECTED',
        'PAYMENT_PROCESSING',
        'PAID',
        'OVERDUE',
      ],
      default: 'DRAFT',
    },
    matchingStatus: {
      type: String,
      enum: ['PERFECT_MATCH', 'TOLERANCE_ACCEPTED', 'DISCREPANCY_FLAGGED', 'NO_PO_FOUND'],
      default: 'PERFECT_MATCH',
    },
    matchingScore: {
      type: Number,
      default: 98,
    },
    ocrConfidence: {
      type: Number,
      default: 99,
    },
    gstBreakdown: {
      isInterState: Boolean,
      supplierGSTIN: String,
      buyerGSTIN: String,
      isGSTINValid: Boolean,
      cgstAmount: Number,
      sgstAmount: Number,
      igstAmount: Number,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    approvedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    rejectionReason: String,
    rejectedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    rejectedAt: Date,
    currentApprovalStep: {
      type: Number,
      default: 1,
      min: 1,
    },
    requiredApprovalSteps: {
      type: Number,
      default: 1,
      min: 1,
      max: 3,
    },
    attachments: {
      type: [InvoiceAttachmentSchema],
      default: [],
    },
    remindersSent: [
      {
        reminderType: String,
        sentAt: { type: Date, default: Date.now },
        recipient: String,
      },
    ],
    notes: String,
  },
  {
    timestamps: true,
  }
);

// Indexes for fast lookup and duplicate detection
InvoiceSchema.index({ organization: 1, vendor: 1, invoiceNumber: 1 });
InvoiceSchema.index({ organization: 1, status: 1 });
InvoiceSchema.index({ organization: 1, dueDate: 1 });
InvoiceSchema.index({ organization: 1, createdAt: -1 });

export const Invoice = mongoose.model<IInvoice>('Invoice', InvoiceSchema);

