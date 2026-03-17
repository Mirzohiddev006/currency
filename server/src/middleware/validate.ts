// ════════════════════════════════════════════════════════════
// VALIDATION MIDDLEWARE — Zod schema validation for requests
// ════════════════════════════════════════════════════════════

import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';

type ValidateTarget = 'body' | 'params' | 'query';

/**
 * Creates middleware that validates req[target] against a Zod schema.
 * On success, replaces req[target] with parsed (coerced/transformed) values.
 * On failure, returns 400 with structured error details.
 */
export function validate(schema: ZodSchema, target: ValidateTarget = 'body') {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req[target]);
    if (!result.success) {
      const errors = formatZodErrors(result.error);
      res.status(400).json({
        success: false,
        message: 'Validation xatoligi',
        errors,
      });
      return;
    }
    // Replace with parsed & transformed values
    (req as any)[target] = result.data;
    next();
  };
}

function formatZodErrors(error: ZodError): Record<string, string> {
  const formatted: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.join('.') || '_';
    formatted[key] = issue.message;
  }
  return formatted;
}
