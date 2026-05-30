import axios from 'axios';
import type { RatesOverview, CurrencyDetails, ApiResponse } from '../types';

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (axios.isAxiosError(error)) {
      const message = error.response?.data?.message || error.message || 'Network error';
      throw new Error(message);
    }
    throw error;
  }
);

export async function getOverview(): Promise<RatesOverview> {
  const response = await apiClient.get<ApiResponse<RatesOverview>>('/rates/overview');
  if (!response.data.success || !response.data.data) {
    throw new Error(response.data.message || 'Failed to fetch overview');
  }
  return response.data.data;
}

export async function getCurrencyDetails(
  code: string
): Promise<{ data: CurrencyDetails; currency: string }> {
  const response = await apiClient.get<
    ApiResponse<CurrencyDetails> & { currency: string }
  >(`/rates/${code}`);
  if (!response.data.success || !response.data.data) {
    throw new Error(response.data.message || 'Failed to fetch currency details');
  }
  return {
    data: response.data.data,
    currency: response.data.currency,
  };
}
