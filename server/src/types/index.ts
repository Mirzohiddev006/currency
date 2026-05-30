// ════════════════════════════════════════════════════════════
// SHARED TYPES — Single source of truth for all TypeScript types
// ════════════════════════════════════════════════════════════

import { Request } from 'express';

// ── Auth ──────────────────────────────────────────────
export interface JwtPayload {
  id: string;
  email: string;
  role: 'SUPER_ADMIN' | 'ADMIN';
}

export interface AuthRequest extends Request {
  admin?: JwtPayload;
}

// ── API Response ──────────────────────────────────────
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  meta?: PaginationMeta;
}

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  pages: number;
}

// ── Rates & Banks ─────────────────────────────────────
export interface BankRateResult {
  bankCode: string;
  currency: string;
  code: string;
  buyRate: number | null;
  sellRate: number | null;
}

export interface ScrapeResult {
  bankCode: string;
  rates: BankRateResult[];
  success: boolean;
  duration: number;
  error?: string;
  logoUrl?: string | null;
}

export interface RefreshResult {
  success: boolean;
  cbuRates: number;
  bankResults: ScrapeResult[];
  totalDuration: number;
  errors: string[];
}

export interface CBURateResponse {
  id: string;
  Code: string;
  Ccy: string;
  CcyNm_RU: string;
  CcyNm_UZ: string;
  CcyNm_UZC: string;
  CcyNm_EN: string;
  Nominal: string;
  Rate: string;
  Diff: string;
  Date: string;
}

export interface BankSeedData {
  code: string;
  name: string;
  nameUz: string;
  website?: string;
  logoUrl?: string;
  isCentral?: boolean;
}

export type TrendDirection = 'up' | 'down' | 'flat';

export interface CurrencySummary {
  code: string;
  currency: string;
  cbRate: number;
  diff: number;
  nominal: number;
  trend: TrendDirection;
  date: string;
  reportingBanks: number;
  totalBanks: number;
  missingBanks: number;
  coveragePercent: number;
  bestBuy: number | null;
  bestSell: number | null;
  averageBuy: number | null;
  averageSell: number | null;
}

export interface CurrencyDetailsRow {
  bank: {
    id: string;
    code: string;
    name: string;
    nameUz: string;
    isCentral: boolean;
  };
  buyRate: number | null;
  sellRate: number | null;
  cbRate: number | null;
  spread: number | null;
  hasRate: boolean;
  date: string | null;
}

export interface CurrencyDetails {
  summary: CurrencySummary | null;
  rows: CurrencyDetailsRow[];
  missingBanks: string[];
}

export interface BankCoverageSummary {
  bank: {
    id: string;
    code: string;
    name: string;
    nameUz: string;
    website?: string | null;
    logoUrl?: string | null;
    isCentral: boolean;
    isActive: boolean;
  };
  ratesCount: number;
  totalCurrencies: number;
  missingCurrencies: number;
  coveragePercent: number;
  supportedCurrencies: string[];
  lastUpdated: string | null;
}

export interface RatesOverview {
  market: {
    totalCurrencies: number;
    totalBanks: number;
    commercialBanks: number;
    reportingBanks: number;
    lastUpdated: string | null;
  };
  currencies: CurrencySummary[];
  banks: BankCoverageSummary[];
}

export interface BankBoardRow {
  bank: {
    id: string;
    code: string;
    name: string;
    nameUz: string;
    website?: string | null;
    logoUrl?: string | null;
    isCentral: boolean;
    isActive: boolean;
  };
  buyRate: number | null;
  sellRate: number | null;
  cbRate: number | null;
  spread: number | null;
  hasRate: boolean;
  availableCurrencies: number;
  lastUpdated: string | null;
}

export interface BankBoard {
  currency: string;
  date: string | null;
  totalBanks: number;
  reportingBanks: number;
  missingBanks: string[];
  banks: BankBoardRow[];
}

export interface BankDetailsCurrency {
  code: string;
  currency: string;
  buyRate: number | null;
  sellRate: number | null;
  cbRate: number | null;
  spread: number | null;
  lastUpdated: string | null;
}

export interface BankDetails {
  bank: {
    id: string;
    code: string;
    name: string;
    nameUz: string;
    website?: string | null;
    logoUrl?: string | null;
    isCentral: boolean;
    isActive: boolean;
  };
  summary: {
    currencyCount: number;
    lastUpdated: string | null;
    usdBuyRate: number | null;
    usdSellRate: number | null;
    usdSpread: number | null;
  };
  currencies: BankDetailsCurrency[];
}

// ── Dashboard & Analytics ─────────────────────────────
export interface DashboardStats {
  users: { total: number; active: number; newToday: number };
  requests: { today: number };
  banks: { total: number; active: number };
  lastUpdate: Date | null;
  scrapeLogs: ScrapeLogEntry[];
}

export interface ScrapeLogEntry {
  id: string;
  bankCode: string;
  status: string;
  message?: string | null;
  duration?: number | null;
  ratesCount?: number | null;
  createdAt: Date;
}

export interface AnalyticsData {
  requestsByDay: Record<string, number>;
  usersByDay: Record<string, number>;
  topCommands: { command: string; count: number }[];
  totalRequests: number;
  totalNewUsers: number;
}

// ── Scheduler ─────────────────────────────────────────
export interface SchedulerStatus {
  isRunning: boolean;
  lastRun: Date | null;
  nextRun: string | null;
}

// ── Cache Keys ────────────────────────────────────────
export const CACHE_KEYS = {
  LATEST_RATES: 'rates:latest',
  LATEST_RATES_BY_CURRENCY: (code: string) => `rates:latest:${code}`,
  CURRENCY_RATES: (code: string) => `rates:currency:${code}:rows`,
  CURRENCY_DETAILS: (code: string) => `rates:currency:${code}:details`,
  BANK_BOARD: (currency: string) => `rates:banks:${currency}`,
  BANK_DETAILS: (bankCode: string) => `rates:bank:${bankCode}`,
  RATES_OVERVIEW: 'rates:overview',
  CBU_SNAPSHOT: 'rates:cbu:snapshot',
  RATE_HISTORY: (bankCode: string, currency: string, days: number) =>
    `rates:history:${bankCode}:${currency}:${days}`,
  DASHBOARD_STATS: 'dashboard:stats',
  ANALYTICS: (days: number) => `analytics:${days}`,
} as const;

export const CACHE_TTL = {
  RATES: 300,          // 5 minutes
  DASHBOARD: 60,       // 1 minute
  ANALYTICS: 120,      // 2 minutes
  HISTORY: 600,        // 10 minutes
} as const;
