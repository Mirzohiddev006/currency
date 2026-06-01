// ════════════════════════════════════════════════════════════
// ZOD VALIDATORS — Request validation schemas
// ════════════════════════════════════════════════════════════

import { z } from 'zod';

// ── Auth ──────────────────────────────────────────────
export const loginSchema = z.object({
  email: z.string().email('Email noto\'g\'ri formatda'),
  password: z.string().min(1, 'Parol kiritilishi shart'),
});

// ── Rates ─────────────────────────────────────────────
export const currencyCodeSchema = z.object({
  code: z.string().min(2).max(5).transform((v) => v.toUpperCase()),
});

export const rateHistoryParamsSchema = z.object({
  bankCode: z.string().min(2).max(30),
  currency: z.string().min(2).max(5).transform((v) => v.toUpperCase()),
});

export const rateHistoryQuerySchema = z.object({
  days: z.coerce.number().int().min(1).max(365).default(30),
});

export const ratesQuerySchema = z.object({
  currency: z.string().min(2).max(5).transform((v) => v.toUpperCase()).optional(),
});

// ── Admin ─────────────────────────────────────────────
export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const analyticsQuerySchema = z.object({
  days: z.coerce.number().int().min(1).max(90).default(7),
});

export const scrapeLogsQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(500).default(50),
});

export const bankIdSchema = z.object({
  id: z.string().cuid(),
});

export const bankCodeParamsSchema = z.object({
  bankCode: z.string().min(2).max(40).regex(/^[a-z0-9-]+$/i),
});

export const broadcastSchema = z
  .object({
    text: z.string().trim().max(4000).optional().default(''),
    imageUrl: z.string().trim().url('Rasm URL manzili xato').optional().or(z.literal('')),
  })
  .refine(
    (data) => (data.text && data.text.length > 0) || (data.imageUrl && data.imageUrl.length > 0),
    { message: 'Matn yoki rasm URL manzilidan kamida bittasi kiritilishi shart' }
  );
