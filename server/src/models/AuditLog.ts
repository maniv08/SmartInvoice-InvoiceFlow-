import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IAuditLog extends Document {
  user?: Types.ObjectId;
  userName: string;
  action: string;
  entityType: string;
  entityId: string;
  entityName?: string;
  previousValue?: any;
  newValue?: any;
  ipAddress?: string;
  userAgent?: string;
  organization?: Types.ObjectId;
  createdAt: Date;
}

const AuditLogSchema = new Schema<IAuditLog>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    userName: {
      type: String,
      default: 'System',
    },
    action: {
      type: String,
      required: true,
      trim: true,
    },
    entityType: {
      type: String,
      required: true,
      trim: true,
    },
    entityId: {
      type: String,
      required: true,
      trim: true,
    },
    entityName: String,
    previousValue: Schema.Types.Mixed,
    newValue: Schema.Types.Mixed,
    ipAddress: String,
    userAgent: String,
    organization: {
      type: Schema.Types.ObjectId,
      ref: 'Organization',
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false }, // Append-only
  }
);

AuditLogSchema.index({ entityType: 1, entityId: 1 });
AuditLogSchema.index({ organization: 1, createdAt: -1 });

export const AuditLog = mongoose.model<IAuditLog>('AuditLog', AuditLogSchema);
