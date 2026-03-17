import { useQuery } from '@tanstack/react-query';
import { getOverview, getCurrencyDetails } from '../services/api';

export function useOverview() {
  return useQuery({
    queryKey: ['overview'],
    queryFn: getOverview,
    staleTime: 60 * 1000, // 60 seconds
    refetchInterval: 60 * 1000,
    retry: 2,
  });
}

export function useCurrencyDetails(code: string | null) {
  return useQuery({
    queryKey: ['currency', code],
    queryFn: () => getCurrencyDetails(code!),
    enabled: !!code,
    staleTime: 30 * 1000, // 30 seconds
    retry: 2,
  });
}
