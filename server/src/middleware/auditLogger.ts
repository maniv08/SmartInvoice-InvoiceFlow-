import { AuditLog } from '../models';
import { AuthRequest } from './auth';

export interface AuditLogOptions {
  action: string;
  entityType: string;
  entityId: string;
  entityName?: string;
  previousValue?: any;
  newValue?: any;
  req: AuthRequest;
}

export const logAuditEvent = async ({
  action,
  entityType,
  entityId,
  entityName,
  previousValue,
  newValue,
  req,
}: AuditLogOptions): Promise<void> => {
  try {
    const ipAddress =
      (req.headers['x-forwarded-for'] as string)?.split(',')[0] ||
      req.socket.remoteAddress ||
      '';

    const userAgent = req.headers['user-agent'] || '';

    await AuditLog.create({
      user: req.user?._id,
      userName: req.user?.name || 'System',
      action,
      entityType,
      entityId,
      entityName,
      previousValue,
      newValue,
      ipAddress,
      userAgent,
      organization: req.user?.organization,
    });
  } catch (err) {
    console.error('Failed to write audit log entry:', err);
  }
};
