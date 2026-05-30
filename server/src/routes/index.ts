import { Router } from 'express';
import { login, getMe } from '../controllers/auth.controller';
import {
  getAnalytics,
  getBanks,
  getScrapeLogs,
  getUsers,
  toggleBank,
} from '../controllers/admin.controller';
import {
  getBankBoardHandler,
  getBankDetailsHandler,
  getCurrencyRatesHandler,
  getDashboardStatsHandler,
  getLatestRatesHandler,
  getRateHistoryHandler,
  getRatesOverviewHandler,
  manualRefreshHandler,
} from '../controllers/rates.controller';
import { asyncHandler } from '../lib/async-handler';
import { authMiddleware } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { getBot, isTelegramBotConfigured } from '../services/telegram.service';
import {
  analyticsQuerySchema,
  bankCodeParamsSchema,
  bankIdSchema,
  currencyCodeSchema,
  loginSchema,
  paginationSchema,
  rateHistoryParamsSchema,
  rateHistoryQuerySchema,
  ratesQuerySchema,
  scrapeLogsQuerySchema,
} from '../validators';

const router = Router();

router.post('/auth/login', validate(loginSchema), asyncHandler(login));
router.get('/auth/me', authMiddleware, asyncHandler(getMe));

router.get('/rates', validate(ratesQuerySchema, 'query'), asyncHandler(getLatestRatesHandler));
router.get('/rates/overview', asyncHandler(getRatesOverviewHandler));
router.get('/banks', validate(ratesQuerySchema, 'query'), asyncHandler(getBankBoardHandler));
router.get('/banks/:bankCode', validate(bankCodeParamsSchema, 'params'), asyncHandler(getBankDetailsHandler));
router.get('/rates/:code', validate(currencyCodeSchema, 'params'), asyncHandler(getCurrencyRatesHandler));
router.get(
  '/rates/history/:bankCode/:currency',
  validate(rateHistoryParamsSchema, 'params'),
  validate(rateHistoryQuerySchema, 'query'),
  asyncHandler(getRateHistoryHandler)
);

router.post('/admin/refresh', authMiddleware, asyncHandler(manualRefreshHandler));
router.get('/admin/stats', authMiddleware, asyncHandler(getDashboardStatsHandler));
router.get('/admin/users', authMiddleware, validate(paginationSchema, 'query'), asyncHandler(getUsers));
router.get('/admin/banks', authMiddleware, asyncHandler(getBanks));
router.patch('/admin/banks/:id/toggle', authMiddleware, validate(bankIdSchema, 'params'), asyncHandler(toggleBank));
router.get('/admin/logs', authMiddleware, validate(scrapeLogsQuerySchema, 'query'), asyncHandler(getScrapeLogs));
router.get('/admin/analytics', authMiddleware, validate(analyticsQuerySchema, 'query'), asyncHandler(getAnalytics));

router.post('/bot/webhook', (req, res) => {
  if (!isTelegramBotConfigured()) {
    return res.status(503).json({
      success: false,
      message: 'Telegram bot is disabled',
    });
  }

  try {
    const bot = getBot();
    bot.handleUpdate(req.body);
    return res.sendStatus(200);
  } catch {
    return res.sendStatus(500);
  }
});

export default router;
