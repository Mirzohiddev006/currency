// ════════════════════════════════════════════════════════════
// GLOBAL ERROR HANDLER — Centralized error processing
// ════════════════════════════════════════════════════════════

import { Request, Response, NextFunction } from 'express';
import { AppError } from '../lib/errors';
import { logger } from '../config/logger';

export function globalErrorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  // Known operational errors
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      message: err.message,
    });
    return;
  }

  // Prisma known errors
  if (err.constructor.name === 'PrismaClientKnownRequestError') {
    logger.error('Prisma error:', err);
    res.status(400).json({
      success: false,
      message: 'Database xatosi',
    });
    return;
  }

  // Unexpected errors — log full stack, return generic message
  logger.error('Unhandled error:', err);
  res.status(500).json({
    success: false,
    message: 'Ichki server xatosi',
  });
}

export function notFoundHandler(_req: Request, res: Response): void {
  res.status(404).json({
    success: false,
    message: 'Endpoint topilmadi',
  });
}
