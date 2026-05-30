// ════════════════════════════════════════════════════════════
// FRONTEND TYPES — Shared TypeScript interfaces
// ════════════════════════════════════════════════════════════

export interface Admin {
  id: string;
  email: string;
  name: string;
  role: 'SUPER_ADMIN' | 'ADMIN';
  createdAt?: string;
}

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

// ── Bank & Rates ──────────────────────────────────────
export interface Bank {
  id: string;
  code: string;
  name: string;
  nameUz: string;
  website?: string;
  logoUrl?: string;
  isActive: boolean;
  isCentral: boolean;
  createdAt: string;
  updatedAt: string;
  _count?: { rates: number };
  currentRatesCount?: number;
  totalCurrencies?: number;
  coveragePercent?: number;
  missingCurrencies?: number;
  supportedCurrencies?: string[];
  lastUpdated?: string | null;
}

export interface ExchangeRate {
  id: string;
  bankId: string;
  currency: string;
  code: string;
  buyRate: number | null;
  sellRate: number | null;
  cbRate: number | null;
  date: string;
  bank?: Bank;
}

export interface BankWithRates {
  bank: Pick<Bank, 'id' | 'code' | 'name' | 'nameUz' | 'isCentral'>;
  rates: ExchangeRate[];
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
  bank: Pick<Bank, 'id' | 'code' | 'name' | 'nameUz' | 'isCentral'>;
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
  bank: Pick<Bank, 'id' | 'code' | 'name' | 'nameUz' | 'website' | 'logoUrl' | 'isCentral' | 'isActive'>;
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
  bank: Pick<Bank, 'id' | 'code' | 'name' | 'nameUz' | 'website' | 'logoUrl' | 'isCentral' | 'isActive'>;
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
  bank: Pick<Bank, 'id' | 'code' | 'name' | 'nameUz' | 'website' | 'logoUrl' | 'isCentral' | 'isActive'>;
  summary: {
    currencyCount: number;
    lastUpdated: string | null;
    usdBuyRate: number | null;
    usdSellRate: number | null;
    usdSpread: number | null;
  };
  currencies: BankDetailsCurrency[];
}

// ── Scrape Logs ───────────────────────────────────────
export interface ScrapeLog {
  id: string;
  bankCode: string;
  status: 'SUCCESS' | 'FAILED' | 'PARTIAL';
  message?: string;
  duration?: number;
  ratesCount?: number;
  createdAt: string;
}

// ── Dashboard ─────────────────────────────────────────
export interface DashboardStats {
  users: { total: number; active: number; newToday: number };
  requests: { today: number };
  banks: { total: number; active: number };
  lastUpdate: string | null;
  scrapeLogs: ScrapeLog[];
}

// ── Analytics ─────────────────────────────────────────
export interface AnalyticsData {
  requestsByDay: Record<string, number>;
  usersByDay: Record<string, number>;
  topCommands: { command: string; count: number }[];
  totalRequests: number;
  totalNewUsers: number;
}

// ── Telegram User ─────────────────────────────────────
export interface TelegramUser {
  id: string;
  telegramId: string;
  username?: string;
  firstName?: string;
  lastName?: string;
  isActive: boolean;
  language: string;
  subscribedAt: string;
  lastActiveAt: string;
  _count?: { requests: number };
}
