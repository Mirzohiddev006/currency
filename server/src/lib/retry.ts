// ════════════════════════════════════════════════════════════
// RETRY UTILITY — Exponential backoff with jitter for scrapers
// ════════════════════════════════════════════════════════════

import { logger } from '../config/logger';

export interface RetryOptions {
  maxRetries: number;
  baseDelayMs: number;
  maxDelayMs: number;
  /** Descriptive label for logging */
  label?: string;
}

const DEFAULT_OPTIONS: RetryOptions = {
  maxRetries: 3,
  baseDelayMs: 1000,
  maxDelayMs: 10000,
};

/**
 * Executes a function with exponential backoff retry.
 * Adds jitter to prevent thundering herd on recovery.
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: Partial<RetryOptions> = {}
): Promise<T> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  let lastError: Error | undefined;

  for (let attempt = 0; attempt <= opts.maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      if (attempt >= opts.maxRetries) break;

      const delay = Math.min(
        opts.baseDelayMs * Math.pow(2, attempt) + Math.random() * 500,
        opts.maxDelayMs
      );

      if (opts.label) {
        logger.warn(
          `[Retry] ${opts.label} — attempt ${attempt + 1}/${opts.maxRetries} failed, retrying in ${Math.round(delay)}ms: ${lastError.message}`
        );
      }

      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  throw lastError!;
}
