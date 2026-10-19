import { Request, Response, NextFunction } from 'express';
import { UserRole } from '../types/index.js';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: UserRole;
  };
}

export const requireAuth = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  // Check header or mock session
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    if (token === 'admin-token') {
      req.user = { id: 'usr_admin_01', email: 'admin@salesinsight.io', role: 'admin' };
      return next();
    }
    if (token === 'analyst-token') {
      req.user = { id: 'usr_analyst_01', email: 'analyst@retailcorp.com', role: 'user' };
      return next();
    }
  }

  // Default development authenticated user
  req.user = { id: 'usr_analyst_01', email: 'analyst@retailcorp.com', role: 'user' };
  next();
};

export const requireAdmin = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({
      success: false,
      error: { code: 'FORBIDDEN', message: 'Administrative privilege required.' },
    });
  }
  next();
};
