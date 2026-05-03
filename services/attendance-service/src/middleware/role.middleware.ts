import type { Request, Response, NextFunction } from 'express';
import { Role } from '@attendance-tracker/shared-types';

export function requireRole(...roles: Role[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Not authenticated' });
      return;
    }

    if (!roles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        error: `Access denied. Required role: ${roles.join(' or ')}`,
      });
      return;
    }

    next();
  };
}

export const requireStudent = requireRole(Role.STUDENT);
export const requireMentor = requireRole(Role.SUPER_ADMIN, Role.ADMIN, Role.MENTOR);
