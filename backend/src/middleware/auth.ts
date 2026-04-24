import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export const JWT_SECRET = process.env.JWT_SECRET || '24ghanta-super-secret-key-change-in-prod';

export type AdminRole = 'admin' | 'author';

export interface AuthRequest extends Request {
  adminId?: number;        // admin_users.id when role === 'admin'
  authorId?: number;       // authors.id when role === 'author'
  role?: AdminRole;
}

interface AdminTokenPayload {
  id: number;
  role?: AdminRole;
}

function verifyToken(req: AuthRequest): AdminTokenPayload | null {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) return null;
  try {
    const decoded = jwt.verify(header.split(' ')[1], JWT_SECRET) as AdminTokenPayload;
    return decoded;
  } catch {
    return null;
  }
}

/** Allows both admins and authors. */
export function requireAuth(req: AuthRequest, res: Response, next: NextFunction) {
  const decoded = verifyToken(req);
  if (!decoded) return res.status(401).json({ error: 'Unauthorized' });

  const role = decoded.role ?? 'admin'; // legacy tokens without role → admin
  if (role !== 'admin' && role !== 'author') {
    return res.status(403).json({ error: 'Forbidden' });
  }

  req.role = role;
  if (role === 'admin') req.adminId = decoded.id;
  if (role === 'author') req.authorId = decoded.id;
  next();
}

/** Restricts to admins only. */
export function requireAdmin(req: AuthRequest, res: Response, next: NextFunction) {
  const decoded = verifyToken(req);
  if (!decoded) return res.status(401).json({ error: 'Unauthorized' });
  const role = decoded.role ?? 'admin';
  if (role !== 'admin') return res.status(403).json({ error: 'Admin access required' });
  req.role = 'admin';
  req.adminId = decoded.id;
  next();
}
