import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export const JWT_SECRET = process.env.JWT_SECRET || '24ghanta-super-secret-key-change-in-prod';

export interface AuthRequest extends Request {
  adminId?: number;
}

export function requireAuth(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { id: number; role?: string };
    if (decoded.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden' });
    }
    req.adminId = decoded.id;
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid token' });
  }
}
