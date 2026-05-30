// ════════════════════════════════════════════════════════════
// REACT QUERY HOOKS — Data fetching with caching & auto-refresh
// ════════════════════════════════════════════════════════════

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi, ratesApi } from '../services';

// ── Query Keys ────────────────────────────────────────
export const queryKeys = {
  dashboardStats: ['dashboard', 'stats'] as const,
  analytics: (days: number) => ['analytics', days] as const,
  users: (page: number) => ['users', page] as const,
  banks: ['banks'] as const,
  scrapeLogs: ['scrapeLogs'] as const,
  latestRates: ['rates', 'latest'] as const,
  currencyRates: (code: string) => ['rates', 'currency', code] as const,
  rateHistory: (bankCode: string, currency: string, days: number) =>
    ['rates', 'history', bankCode, currency, days] as const,
};

// ── Dashboard ─────────────────────────────────────────
export function useDashboardStats() {
  return useQuery({
    queryKey: queryKeys.dashboardStats,
    queryFn: adminApi.getDashboardStats,
    refetchInterval: 30_000, // Auto-refresh every 30s
  });
}

// ── Analytics ─────────────────────────────────────────
export function useAnalytics(days: number) {
  return useQuery({
    queryKey: queryKeys.analytics(days),
    queryFn: () => adminApi.getAnalytics(days),
  });
}

// ── Users ─────────────────────────────────────────────
export function useUsers(page: number, limit = 20) {
  return useQuery({
    queryKey: queryKeys.users(page),
    queryFn: () => adminApi.getUsers(page, limit),
    placeholderData: (prev) => prev, // Keep old data while loading new page
  });
}

// ── Banks ─────────────────────────────────────────────
export function useBanks() {
  return useQuery({
    queryKey: queryKeys.banks,
    queryFn: adminApi.getBanks,
  });
}

export function useToggleBank() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => adminApi.toggleBank(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.banks });
    },
  });
}

// ── Scrape Logs ───────────────────────────────────────
export function useScrapeLogs(limit = 100) {
  return useQuery({
    queryKey: queryKeys.scrapeLogs,
    queryFn: () => adminApi.getScrapeLogs(limit),
  });
}

// ── Rates ─────────────────────────────────────────────
export function useLatestRates() {
  return useQuery({
    queryKey: queryKeys.latestRates,
    queryFn: () => ratesApi.getLatest(),
  });
}

export function useCurrencyRates(code: string) {
  return useQuery({
    queryKey: queryKeys.currencyRates(code),
    queryFn: () => ratesApi.getCurrencyRates(code),
    enabled: !!code,
  });
}

// ── Refresh Rates ─────────────────────────────────────
export function useRefreshRates() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ratesApi.refresh,
    onSuccess: () => {
      // Invalidate all rate queries after refresh
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ['rates'] });
        queryClient.invalidateQueries({ queryKey: queryKeys.dashboardStats });
      }, 5000);
    },
  });
}
