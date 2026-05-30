// ════════════════════════════════════════════════════════════
// ASYNC HANDLER — Eliminates repetitive try/catch in controllers
// ════════════════════════════════════════════════════════════

import { Request, Response, NextFunction, RequestHandler } from 'express';

type AsyncHandler = (
  req: Request,
  res: Response,
  next: NextFunction
) => Promise<any>;

/**
 * Wraps an async route handler to automatically catch errors
 * and forward them to Express error middleware.
 */
export function asyncHandler(fn: AsyncHandler): RequestHandler {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
