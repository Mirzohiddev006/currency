// ════════════════════════════════════════════════════════════
// AUTH MIDDLEWARE — Improved JWT authentication
// ════════════════════════════════════════════════════════════

import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { UnauthorizedError } from '../lib/errors';
import { AuthRequest, JwtPayload } from '../types';

export function authMiddleware(req: AuthRequest, _res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new UnauthorizedError('Token taqdim etilmagan');
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, env.JWT_SECRET) as JwtPayload;
    req.admin = decoded;
    next();
  } catch {
    throw new UnauthorizedError('Token yaroqsiz yoki muddati tugagan');
  }
}

/**
 * Optional: Require SUPER_ADMIN role
 */
export function requireSuperAdmin(req: AuthRequest, _res: Response, next: NextFunction): void {
  if (req.admin?.role !== 'SUPER_ADMIN') {
    throw new UnauthorizedError('Super admin huquqi kerak');
  }
  next();
}
