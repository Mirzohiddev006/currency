// ════════════════════════════════════════════════════════════
// RATES REPOSITORY — Database access layer for exchange rates
// ════════════════════════════════════════════════════════════

import prisma from '../config/database';
import { daysAgo, startOfDay } from '../lib/date';

export class RatesRepository {
  async getActiveBanks() {
    return prisma.bank.findMany({ where: { isActive: true } });
  }

  async getAllBanks() {
    return prisma.bank.findMany({
      include: { _count: { select: { rates: true } } },
      orderBy: [{ isCentral: 'desc' }, { name: 'asc' }],
    });
  }

  async getBankByCode(code: string) {
    return prisma.bank.findUnique({ where: { code } });
  }

  async getBankById(id: string) {
    return prisma.bank.findUnique({ where: { id } });
  }

  async toggleBank(id: string, isActive: boolean) {
    return prisma.bank.update({
      where: { id },
      data: { isActive },
    });
  }

  async upsertBank(data: {
    code: string;
    name: string;
    nameUz: string;
    website?: string;
    logoUrl?: string;
    isCentral?: boolean;
  }) {
    return prisma.bank.upsert({
      where: { code: data.code },
      update: {
        name: data.name,
        nameUz: data.nameUz,
        website: data.website,
        logoUrl: data.logoUrl,
        isCentral: data.isCentral ?? false,
      },
      create: { ...data, isActive: true },
    });
  }

  async updateBankLogo(id: string, logoUrl: string) {
    return prisma.bank.update({
      where: { id },
      data: { logoUrl },
    });
  }

  async getAllLatestRates(currency?: string) {
    return prisma.exchangeRate.findMany({
      where: currency ? { code: currency.toUpperCase() } : undefined,
      orderBy: [{ bankId: 'asc' }, { code: 'asc' }, { date: 'desc' }],
      distinct: ['bankId', 'code'],
      include: { bank: true },
    });
  }

  async getLatestRatesForBank(bankId: string, currency?: string) {
    if (currency) {
      return prisma.exchangeRate.findMany({
        where: {
          bankId,
          code: currency.toUpperCase(),
        },
        orderBy: { date: 'desc' },
        take: 1,
      });
    }

    return prisma.exchangeRate.findMany({
      where: { bankId },
      orderBy: [{ code: 'asc' }, { date: 'desc' }],
      distinct: ['code'],
    });
  }

  async getCurrencyRatesToday(code: string) {
    return prisma.exchangeRate.findMany({
      where: {
        code: code.toUpperCase(),
      },
      include: { bank: true },
      orderBy: [{ bankId: 'asc' }, { date: 'desc' }],
      distinct: ['bankId'],
    });
  }

  async getRateHistory(bankId: string, currencyCode: string, days: number) {
    return prisma.exchangeRate.findMany({
      where: {
        bankId,
        code: currencyCode.toUpperCase(),
        date: { gte: daysAgo(days) },
      },
      orderBy: { date: 'asc' },
    });
  }

  async deleteTodaysRates(bankId: string) {
    return prisma.exchangeRate.deleteMany({
      where: {
        bankId,
        date: { gte: startOfDay() },
      },
    });
  }

  async createManyRates(data: {
    bankId: string;
    currency: string;
    code: string;
    buyRate: number | null;
    sellRate: number | null;
    cbRate?: number | null;
    date: Date;
  }[]) {
    return prisma.exchangeRate.createMany({
      data,
      skipDuplicates: true,
    });
  }

  async createScrapeLog(data: {
    bankCode: string;
    status: 'SUCCESS' | 'FAILED' | 'PARTIAL';
    message?: string;
    duration?: number;
    ratesCount?: number;
  }) {
    return prisma.scrapeLog.create({ data });
  }

  async getScrapeLogs(limit: number) {
    return prisma.scrapeLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  async getLastScrapeLog() {
    return prisma.scrapeLog.findFirst({ orderBy: { createdAt: 'desc' } });
  }

  async getBankCounts() {
    const [total, active] = await Promise.all([
      prisma.bank.count(),
      prisma.bank.count({ where: { isActive: true } }),
    ]);
    return { total, active };
  }
}

export const ratesRepository = new RatesRepository();
