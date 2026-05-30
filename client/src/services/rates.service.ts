// ════════════════════════════════════════════════════════════
// RATES API SERVICE — Separated API calls for rates
// ════════════════════════════════════════════════════════════

import { apiClient } from '../lib/api';
import type { ApiResponse, BankWithRates, CurrencyDetails, ExchangeRate, RatesOverview } from '../types';

export const ratesApi = {
  getLatest: async (currency?: string) => {
    const params = currency ? { currency } : {};
    const { data } = await apiClient.get<ApiResponse<BankWithRates[]> & { updatedAt: string }>('/rates', { params });
    return data;
  },

  getOverview: async () => {
    const { data } = await apiClient.get<ApiResponse<RatesOverview>>('/rates/overview');
    return data;
  },

  getCurrencyRates: async (code: string) => {
    const { data } = await apiClient.get<ApiResponse<CurrencyDetails> & { currency: string }>(`/rates/${code}`);
    return data;
  },

  getRateHistory: async (bankCode: string, currency: string, days = 30) => {
    const { data } = await apiClient.get<ApiResponse<ExchangeRate[]>>(
      `/rates/history/${bankCode}/${currency}`,
      { params: { days } }
    );
    return data;
  },

  refresh: async () => {
    const { data } = await apiClient.post<ApiResponse>('/admin/refresh');
    return data;
  },
};
