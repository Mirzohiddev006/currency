// ════════════════════════════════════════════════════════════
// SERVER ENTRY POINT — Production-grade bootstrap
// ════════════════════════════════════════════════════════════

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import swaggerUi from 'swagger-ui-express';
import { env } from './config/env';
import { swaggerSpec } from './config/swagger';
import { logger } from './config/logger';
import prisma from './config/database';
import routes from './routes/index';
import { startScheduler } from './services/scheduler.service';
import { startBot, stopBot } from './services/telegram.service';
import { startKeepAlive, stopKeepAlive } from './services/keepalive.service';
import { ratesService } from './services/rates.service';
import { globalErrorHandler, notFoundHandler } from './middleware/error-handler';

const app = express();

// ── Trust proxy ──────────────────────────────────────────
// Render (and most PaaS) sit behind a reverse proxy that sets
// X-Forwarded-For. Without this, express-rate-limit throws
// ERR_ERL_UNEXPECTED_X_FORWARDED_FOR and client IPs are wrong.
app.set('trust proxy', 1);

// ETag'ni o'chiramiz — aks holda API GET javoblari 304 qaytaradi va
// frontend axios (validateStatus 200-299) buni xato deb qabul qiladi.
app.set('etag', false);

// ── Security Middlewares ─────────────────────────────────
app.use(helmet({
  contentSecurityPolicy: env.NODE_ENV === 'production' ? undefined : false,
}));
const allowedOrigins = env.CLIENT_URL.split(',').map((o) => o.trim()).filter(Boolean);
app.use(cors({
  origin(origin, callback) {
    // Allow non-browser clients (no Origin header), wildcard "*", and any
    // whitelisted origin. CLIENT_URL may be a comma-separated list
    // (Render + Vercel admin + webapp) or "*" to allow everything.
    if (!origin || allowedOrigins.includes('*') || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error('Not allowed by CORS: ' + origin));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
}));

// ── Rate Limiting ────────────────────────────────────────
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 min
  max: 100,
  message: { success: false, message: 'Juda ko\'p so\'rovlar. 15 daqiqadan keyin qayta urinib ko\'ring.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { success: false, message: 'Juda ko\'p login urinishlari.' },
});

app.use('/api/', apiLimiter);
app.use('/api/auth/login', authLimiter);

// ── Body Parser ──────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ── HTTP Logging ─────────────────────────────────────────
if (env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined', {
    stream: { write: (message) => logger.info(message.trim()) },
  }));
}

// ── Routes ───────────────────────────────────────────────
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customSiteTitle: 'Currency Tracker API',
}));
app.get('/api/docs.json', (_req, res) => res.json(swaggerSpec));

// API javoblari brauzerda keshlanmasin (304 oldini olish uchun).
app.use('/api', (_req, res, next) => {
  res.set('Cache-Control', 'no-store');
  next();
});

app.use('/api', routes);

// ── Health Check ─────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date(),
    env: env.NODE_ENV,
    uptime: process.uptime(),
  });
});

// ── Error Handling (must be after routes) ─────────────────
app.use(notFoundHandler);
app.use(globalErrorHandler);

// ── Bootstrap ─────────────────────────────────────────────
async function bootstrap() {
  try {
    await prisma.$connect();
    logger.info('✅ Database connected');

    await ratesService.ensureBanksExist();

    const PORT = parseInt(env.PORT);
    const server = app.listen(PORT, () => {
      logger.info(`🚀 Server running on http://localhost:${PORT}`);
      logger.info(`📱 Admin Panel: ${env.CLIENT_URL}`);
    });

    startScheduler();
    await startBot();
    startKeepAlive();

    // ── Initial data load ──────────────────────────────
    // The scheduler only scrapes on its cron (09:00 & 16:00). On a
    // fresh deploy the bank rates may be missing until then, so do one
    // background scrape on boot if there are no bank rates yet.
    // NB: CBU rows are stored with only cbRate set (buy/sell = null),
    // so we count rows that actually carry a buy/sell rate.
    try {
      const existingBankRates = await prisma.exchangeRate.count({
        where: { OR: [{ buyRate: { not: null } }, { sellRate: { not: null } }] },
      });
      if (existingBankRates === 0) {
        logger.info('📥 No bank rates in DB — running initial scrape...');
        void ratesService
          .refreshAllRates()
          .then((r) =>
            logger.info(
              `🔄 Initial load done. CBU: ${r.cbuRates} rates, banks: ${r.bankResults.length}`
            )
          )
          .catch((e) => logger.error('❌ Initial load failed:', e));
      }
    } catch (e) {
      logger.error('❌ Initial rates check failed:', e);
    }

    // ── Graceful Shutdown ──────────────────────────────
    const shutdown = async (signal: string) => {
      logger.info(`${signal} received, shutting down gracefully...`);

      server.close(async () => {
        stopKeepAlive();
        await stopBot();
        await prisma.$disconnect();
        logger.info('👋 Server shut down gracefully');
        process.exit(0);
      });

      // Force exit after 10 seconds
      setTimeout(() => {
        logger.error('Forced shutdown after timeout');
        process.exit(1);
      }, 10_000);
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));

  } catch (error) {
    logger.error('❌ Bootstrap error:', error);
    process.exit(1);
  }
}

// Handle unhandled rejections
process.on('unhandledRejection', (reason) => {
  logger.error('Unhandled Rejection:', reason);
});

process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

bootstrap();
