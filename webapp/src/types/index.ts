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

export interface Bank {
  id: string;
  code: string;
  name: string;
  nameUz: string;
  website?: string;
  isCentral: boolean;
  isActive: boolean;
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

export interface RatesOverview {
  market: {
    totalCurrencies: number;
    totalBanks: number;
    commercialBanks: number;
    reportingBanks: number;
    lastUpdated: string | null;
  };
  currencies: CurrencySummary[];
  banks: unknown[];
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
}
