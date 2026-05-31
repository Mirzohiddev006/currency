import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { z } from 'zod';

for (const envPath of [
  path.resolve(process.cwd(), '.env'),
  path.resolve(process.cwd(), '../.env'),
]) {
  if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath });
  }
}

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().default('5000'),
  DATABASE_URL: z.string(),
  JWT_SECRET: z.string().min(32),
  JWT_EXPIRES_IN: z.string().default('7d'),
  TELEGRAM_BOT_TOKEN: z.string().optional(),
  TELEGRAM_WEBHOOK_URL: z.string().optional(),
  KEEPALIVE_URL: z.string().optional(),
  CLIENT_URL: z.string().default('http://localhost:3000'),
  CBU_API_URL: z.string().default('https://cbu.uz/uz/arkhiv-kursov-valyut/json/'),
  SCRAPE_INTERVAL: z.string().default('0 9,16 * * *'), // Daily 09:00 & 16:00 (Asia/Tashkent)
  ADMIN_EMAIL: z.string().email().default('admin@currency.uz'),
  ADMIN_PASSWORD: z.string().min(8).default('Admin@12345'),
});

const _env = envSchema.safeParse(process.env);

if (!_env.success) {
  console.error('❌ Invalid environment variables:');
  console.error(_env.error.format());
  process.exit(1);
}

export const env = _env.data;
