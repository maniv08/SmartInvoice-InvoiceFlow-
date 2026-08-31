import mongoose, { Document, Schema, Types } from 'mongoose';

export type ApprovalStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface IApproval extends Document {
  invoice: Types.ObjectId;
  organization: Types.ObjectId;
  stepNumber: number;
  approver: Types.ObjectId;
  delegatedFrom?: Types.ObjectId;
  status: ApprovalStatus;
  comments?: string;
  decisionDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const ApprovalSchema = new Schema<IApproval>(
  {
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
    stepNumber: {
      type: Number,
      required: true,
      min: 1,
    },
    approver: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    delegatedFrom: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    status: {
      type: String,
      enum: ['PENDING', 'APPROVED', 'REJECTED'],
      default: 'PENDING',
    },
    comments: String,
    decisionDate: Date,
  },
  {
    timestamps: true,
  }
);

ApprovalSchema.index({ invoice: 1, stepNumber: 1 });
ApprovalSchema.index({ organization: 1, approver: 1, status: 1 });

export const Approval = mongoose.model<IApproval>('Approval', ApprovalSchema);
