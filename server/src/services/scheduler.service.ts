// ════════════════════════════════════════════════════════════
// SCHEDULER SERVICE — Cron job management (refactored)
// ════════════════════════════════════════════════════════════

import cron from 'node-cron';
import { logger } from '../config/logger';
import { ratesService } from './rates.service';
import { env } from '../config/env';
import { notifyUsersAboutRates } from './telegram.service';
import { SchedulerStatus } from '../types';

let isRunning = false;
let lastRun: Date | null = null;

export function startScheduler(): void {
  const cronExpression = env.SCRAPE_INTERVAL;

  if (!cron.validate(cronExpression)) {
    logger.error(`❌ Invalid cron expression: "${cronExpression}"`);
    return;
  }

  cron.schedule(cronExpression, async () => {
    if (isRunning) {
      logger.warn('⏭️  Scheduler: previous job still running, skipping...');
      return;
    }

    isRunning = true;
    logger.info('⏰ Scheduler: Starting daily rates refresh...');

    try {
      const result = await ratesService.refreshAllRates();
      lastRun = new Date();
      logger.info(
        `✅ Scheduler: Done. CBU: ${result.cbuRates} rates. Banks: ${result.bankResults.length}. ` +
        `Duration: ${result.totalDuration}ms. Errors: ${result.errors.length}`
      );

      // Notify Telegram subscribers on successful CBU update
      if (result.cbuRates > 0) {
        try {
          await notifyUsersAboutRates();
        } catch (notifError) {
          logger.error('❌ Notification error:', notifError);
        }
      }
    } catch (error) {
      logger.error('❌ Scheduler error:', error);
    } finally {
      isRunning = false;
    }
  }, {
    // Cron hours are interpreted in Uzbekistan local time, not the
    // server's UTC. So "0 9,16 * * *" means 09:00 and 16:00 in Tashkent.
    timezone: 'Asia/Tashkent',
  });

  logger.info(`✅ Scheduler started. Cron: "${cronExpression}" (Asia/Tashkent)`);
}

export function getSchedulerStatus(): SchedulerStatus {
  return {
    isRunning,
    lastRun,
    nextRun: env.SCRAPE_INTERVAL,
  };
}
