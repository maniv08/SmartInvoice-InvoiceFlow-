import mongoose, { Document, Schema, Types } from 'mongoose';

export type NotificationType =
  | 'APPROVAL_PENDING'
  | 'APPROVED'
  | 'REJECTED'
  | 'PAYMENT_DUE'
  | 'PAYMENT_OVERDUE'
  | 'PAYMENT_COMPLETED'
  | 'SYSTEM';

export interface INotification extends Document {
  user: Types.ObjectId;
  organization?: Types.ObjectId;
  title: string;
  message: string;
  type: NotificationType;
  link?: string;
  isRead: boolean;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

const NotificationSchema = new Schema<INotification>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    organization: {
      type: Schema.Types.ObjectId,
      ref: 'Organization',
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    message: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      enum: [
        'APPROVAL_PENDING',
        'APPROVED',
        'REJECTED',
        'PAYMENT_DUE',
        'PAYMENT_OVERDUE',
        'PAYMENT_COMPLETED',
        'SYSTEM',
      ],
      default: 'SYSTEM',
    },
    link: String,
    isRead: {
      type: Boolean,
      default: false,
    },
    metadata: {
      type: Schema.Types.Mixed,
    },
  },
  {
    timestamps: true,
  }
);

NotificationSchema.index({ user: 1, isRead: 1, createdAt: -1 });

export const Notification = mongoose.model<INotification>('Notification', NotificationSchema);
