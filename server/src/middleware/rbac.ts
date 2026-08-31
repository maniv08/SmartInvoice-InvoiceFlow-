import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth';
import { UserRole } from '../models';

export const requireRoles = (...allowedRoles: UserRole[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user || !req.userRole) {
      res.status(401).json({
        success: false,
        message: 'Unauthorized: User authentication required.',
      });
      return;
    }

    if (!allowedRoles.includes(req.userRole)) {
      res.status(403).json({
        success: false,
        message: `Forbidden: Access restricted. Requires one of roles: [${allowedRoles.join(', ')}]. Current role: ${req.userRole}`,
      });
      return;
    }

    next();
  };
};
