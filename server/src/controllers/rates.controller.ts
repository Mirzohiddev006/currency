// ════════════════════════════════════════════════════════════
// RATES CONTROLLER — Thin controllers for rate endpoints
// ════════════════════════════════════════════════════════════

import { Request, Response } from 'express';
import { ratesService } from '../services/rates.service';
import { getSchedulerStatus } from '../services/scheduler.service';
import { ConflictError, NotFoundError } from '../lib/errors';

export async function getLatestRatesHandler(req: Request, res: Response) {
  const currency = req.query.currency as string | undefined;
  const rates = await ratesService.getLatestRates(currency);
  return res.json({ success: true, data: rates, updatedAt: new Date() });
}

export async function getRatesOverviewHandler(_req: Request, res: Response) {
  const overview = await ratesService.getRatesOverview();
  return res.json({ success: true, data: overview });
}

export async function getBankBoardHandler(req: Request, res: Response) {
  const currency = (req.query.currency as string | undefined) || 'USD';
  const board = await ratesService.getBankBoard(currency);
  return res.json({ success: true, data: board });
}

export async function getBankDetailsHandler(req: Request, res: Response) {
  const { bankCode } = req.params;
  const details = await ratesService.getBankDetails(bankCode);
  if (!details) {
    throw new NotFoundError('Bank');
  }

  return res.json({ success: true, data: details });
}

export async function getCurrencyRatesHandler(req: Request, res: Response) {
  const { code } = req.params;
  const details = await ratesService.getCurrencyDetails(code);
  return res.json({ success: true, data: details, currency: code.toUpperCase() });
}

export async function getRateHistoryHandler(req: Request, res: Response) {
  const { bankCode, currency } = req.params;
  const days = (req.query as any).days || 30;
  const history = await ratesService.getRateHistory(bankCode, currency, days);
  return res.json({ success: true, data: history });
}

export async function manualRefreshHandler(req: Request, res: Response) {
  const { isRunning } = getSchedulerStatus();
  if (isRunning) {
    throw new ConflictError('Yangilash jarayoni allaqachon davom etmoqda');
  }

  // Return immediately, run refresh in background
  res.json({ success: true, message: "Yangilash boshlandi. Bu bir necha daqiqa olishi mumkin." });

  ratesService.refreshAllRates().catch((err) =>
    console.error('Background refresh error:', err)
  );
}

export async function manualBankRefreshHandler(req: Request, res: Response) {
  const { bankCode } = req.params;
  const { isRunning } = getSchedulerStatus();
  if (isRunning) {
    throw new ConflictError('Yangilash jarayoni allaqachon davom etmoqda');
  }

  res.json({
    success: true,
    message: "Bank kurslarini yangilash boshlandi. Bu bir necha daqiqa olishi mumkin.",
  });

  ratesService.refreshBankRates(bankCode).catch((err) =>
    console.error('Background bank refresh error:', err)
  );
}

export async function getDashboardStatsHandler(req: Request, res: Response) {
  // Imported lazily to avoid circular dependency
  const { adminService } = await import('../services/admin.service');
  const stats = await adminService.getDashboardStats();
  return res.json({ success: true, data: stats });
}
