import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { User, IUser, UserRole } from '../models';

export interface AuthRequest extends Request {
  user?: IUser;
  userId?: string;
  userRole?: UserRole;
  orgId?: string;
}

export const authenticateJWT = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const authHeader = req.headers.authorization;
  let token: string | undefined;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  } else if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
  }

  if (!token) {
    res.status(401).json({
      success: false,
      message: 'Authentication required. No token provided.',
    });
    return;
  }

  try {
    const secret = process.env.JWT_SECRET || 'invoiceflow_super_secret_jwt_key_2026_production_grade';
    const decoded = jwt.verify(token, secret) as { id: string; role: UserRole; orgId: string };

    const user = await User.findById(decoded.id);
    if (!user || !user.isActive) {
      res.status(401).json({
        success: false,
        message: 'Invalid session or user deactivated.',
      });
      return;
    }

    req.user = user;
    req.userId = user._id.toString();
    req.userRole = user.role;
    req.orgId = user.organization?.toString();

    next();
  } catch (error) {
    res.status(401).json({
      success: false,
      message: 'Invalid or expired token.',
    });
  }
};
