import { Response } from 'express';
import { AuditLog } from '../models';
import { AuthRequest } from '../middleware/auth';

export const getAuditLogs = async (req: AuthRequest, res: Response): Promise<void> => {
  const { entityType, action, userId, startDate, endDate, limit = 100 } = req.query as any;

  const filter: any = { organization: req.orgId };

  if (entityType && entityType !== 'ALL') {
    filter.entityType = entityType;
  }
  if (action && action !== 'ALL') {
    filter.action = action;
  }
  if (userId) {
    filter.user = userId;
  }
  if (startDate || endDate) {
    filter.createdAt = {};
    if (startDate) filter.createdAt.$gte = new Date(startDate);
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      filter.createdAt.$lte = end;
    }
  }

  const logs = await AuditLog.find(filter)
    .populate('user', 'name email avatar role')
    .sort({ createdAt: -1 })
    .limit(Number(limit));

  res.status(200).json({ success: true, logs });
};
