// ════════════════════════════════════════════════════════════
// ADMIN SERVICE — Dashboard stats & analytics business logic
// ════════════════════════════════════════════════════════════

import { ratesRepository, userRepository } from '../repositories';
import { cacheGetOrSet } from '../lib/cache';
import { daysAgo, formatDateKey } from '../lib/date';
import { CACHE_KEYS, CACHE_TTL, DashboardStats, AnalyticsData } from '../types';
import { NotFoundError } from '../lib/errors';
import { ratesService } from './rates.service';

export class AdminService {
  async getDashboardStats(): Promise<DashboardStats> {
    return cacheGetOrSet(CACHE_KEYS.DASHBOARD_STATS, CACHE_TTL.DASHBOARD, async () => {
      const [totalUsers, activeUsers, newToday, todayRequests, lastLog, bankCounts, scrapeLogs] =
        await Promise.all([
          userRepository.getTotalCount(),
          userRepository.getActiveCount(),
          userRepository.getNewTodayCount(),
          userRepository.getTodayRequestCount(),
          ratesRepository.getLastScrapeLog(),
          ratesRepository.getBankCounts(),
          ratesRepository.getScrapeLogs(20),
        ]);

      return {
        users: { total: totalUsers, active: activeUsers, newToday },
        requests: { today: todayRequests },
        banks: bankCounts,
        lastUpdate: lastLog?.createdAt || null,
        scrapeLogs,
      };
    });
  }

  async getAnalytics(days: number): Promise<AnalyticsData> {
    return cacheGetOrSet(CACHE_KEYS.ANALYTICS(days), CACHE_TTL.ANALYTICS, async () => {
      const since = daysAgo(days);

      const [requests, newUsers] = await Promise.all([
        userRepository.getRequestsSince(since),
        userRepository.getNewUsersSince(since),
      ]);

      // Group requests by day
      const requestsByDay: Record<string, number> = {};
      requests.forEach((r) => {
        const day = formatDateKey(r.createdAt);
        requestsByDay[day] = (requestsByDay[day] || 0) + 1;
      });

      // Top commands
      const byCommand: Record<string, number> = {};
      requests.forEach((r) => {
        byCommand[r.command] = (byCommand[r.command] || 0) + 1;
      });

      const topCommands = Object.entries(byCommand)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 10)
        .map(([command, count]) => ({ command, count }));

      // New users by day
      const usersByDay: Record<string, number> = {};
      newUsers.forEach((u) => {
        const day = formatDateKey(u.subscribedAt);
        usersByDay[day] = (usersByDay[day] || 0) + 1;
      });

      return {
        requestsByDay,
        usersByDay,
        topCommands,
        totalRequests: requests.length,
        totalNewUsers: newUsers.length,
      };
    });
  }

  async getUsers(page: number, limit: number) {
    return userRepository.getPaginatedUsers(page, limit);
  }

  async getBanks() {
    const [banks, overview] = await Promise.all([
      ratesRepository.getAllBanks(),
      ratesService.getRatesOverview(),
    ]);

    const coverageByCode = new Map(
      overview.banks.map((bank) => [bank.bank.code, bank])
    );

    return banks.map((bank) => {
      const coverage = coverageByCode.get(bank.code);
      return {
        ...bank,
        currentRatesCount: coverage?.ratesCount ?? 0,
        totalCurrencies: coverage?.totalCurrencies ?? overview.market.totalCurrencies,
        coveragePercent: coverage?.coveragePercent ?? (bank.isCentral ? 100 : 0),
        missingCurrencies: coverage?.missingCurrencies ?? 0,
        supportedCurrencies: coverage?.supportedCurrencies ?? [],
        lastUpdated: coverage?.lastUpdated ?? null,
      };
    });
  }

  async toggleBank(id: string) {
    const bank = await ratesRepository.getBankById(id);
    if (!bank) throw new NotFoundError('Bank');
    return ratesRepository.toggleBank(id, !bank.isActive);
  }

  async getScrapeLogs(limit: number) {
    return ratesRepository.getScrapeLogs(limit);
  }
}

export const adminService = new AdminService();
