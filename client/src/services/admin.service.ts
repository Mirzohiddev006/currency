// ════════════════════════════════════════════════════════════
// ADMIN API SERVICE — Separated API calls for admin panel
// ════════════════════════════════════════════════════════════

import { apiClient } from '../lib/api';
import type { ApiResponse, DashboardStats, AnalyticsData, TelegramUser, Bank, ScrapeLog, PaginationMeta } from '../types';

export const adminApi = {
  getDashboardStats: async () => {
    const { data } = await apiClient.get<ApiResponse<DashboardStats>>('/admin/stats');
    return data.data!;
  },

  getAnalytics: async (days = 7) => {
    const { data } = await apiClient.get<ApiResponse<AnalyticsData>>('/admin/analytics', {
      params: { days },
    });
    return data.data!;
  },

  getUsers: async (page = 1, limit = 20) => {
    const { data } = await apiClient.get<ApiResponse<TelegramUser[]> & { meta: PaginationMeta }>(
      '/admin/users',
      { params: { page, limit } }
    );
    return { users: data.data!, meta: data.meta! };
  },

  getBanks: async () => {
    const { data } = await apiClient.get<ApiResponse<Bank[]>>('/admin/banks');
    return data.data!;
  },

  toggleBank: async (id: string) => {
    const { data } = await apiClient.patch<ApiResponse<Bank>>(`/admin/banks/${id}/toggle`);
    return data.data!;
  },

  getScrapeLogs: async (limit = 100) => {
    const { data } = await apiClient.get<ApiResponse<ScrapeLog[]>>('/admin/logs', {
      params: { limit },
    });
    return data.data!;
  },
};
