import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IApprovalDelegation extends Document {
  organization: Types.ObjectId;
  fromUser: Types.ObjectId;
  toUser: Types.ObjectId;
  startDate: Date;
  endDate: Date;
  reason?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ApprovalDelegationSchema = new Schema<IApprovalDelegation>(
  {
    organization: {
      type: Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
    },
    fromUser: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    toUser: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
    reason: String,
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

ApprovalDelegationSchema.index({ organization: 1, fromUser: 1, isActive: 1 });
ApprovalDelegationSchema.index({ organization: 1, toUser: 1, isActive: 1 });

export const ApprovalDelegation = mongoose.model<IApprovalDelegation>(
  'ApprovalDelegation',
  ApprovalDelegationSchema
);
