// ════════════════════════════════════════════════════════════
// KEEP-ALIVE SERVICE — Render free tier'da doimiy ishlash
// ────────────────────────────────────────────────────────────
// Render bepul web service 15 daqiqa harakatsizlikdan keyin
// uxlaydi. Bu servis har bir necha daqiqada o'z /health
// manziliga so'rov yuboradi va instansiyani uyg'oq saqlaydi.
// Tashqi xizmat (UptimeRobot va h.k.) talab qilinmaydi.
// ════════════════════════════════════════════════════════════

import axios from 'axios';
import { logger } from '../config/logger';
import { env } from '../config/env';

// Render har bir web service'ga RENDER_EXTERNAL_URL ni avtomatik beradi.
// Lokal yoki boshqa hosting bo'lsa, KEEPALIVE_URL ni qo'lda kiritish mumkin.
const SELF_URL = env.KEEPALIVE_URL || process.env.RENDER_EXTERNAL_URL;

// 14 daqiqa < Render'ning 15 daqiqalik uyqu chegarasi
const PING_INTERVAL_MS = 14 * 60 * 1000;

let timer: NodeJS.Timeout | null = null;

export function startKeepAlive(): void {
  // Faqat production'da va tashqi URL mavjud bo'lganda ishlaydi
  if (env.NODE_ENV !== 'production') {
    logger.info('💤 Keep-alive disabled (not production)');
    return;
  }

  if (!SELF_URL) {
    logger.warn(
      '⚠️  Keep-alive disabled: RENDER_EXTERNAL_URL/KEEPALIVE_URL topilmadi'
    );
    return;
  }

  const healthUrl = `${SELF_URL.replace(/\/$/, '')}/health`;

  timer = setInterval(async () => {
    try {
      const res = await axios.get(healthUrl, { timeout: 10_000 });
      logger.info(`💓 Keep-alive ping OK (${res.status})`);
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      logger.warn(`💔 Keep-alive ping failed: ${msg}`);
    }
  }, PING_INTERVAL_MS);

  // Node jarayonini bu timer ushlab turmasin (graceful shutdown uchun)
  timer.unref?.();

  logger.info(`💓 Keep-alive started → ${healthUrl} (every 14 min)`);
}

export function stopKeepAlive(): void {
  if (timer) {
    clearInterval(timer);
    timer = null;
  }
}
