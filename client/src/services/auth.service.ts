// ════════════════════════════════════════════════════════════
// AUTH API SERVICE — Separated API calls for authentication
// ════════════════════════════════════════════════════════════

import { apiClient } from '../lib/api';
import type { Admin, ApiResponse } from '../types';

interface LoginResponse {
  success: boolean;
  token: string;
  admin: Admin;
}

interface MeResponse {
  success: boolean;
  admin: Admin;
}

export const authApi = {
  login: async (email: string, password: string) => {
    const { data } = await apiClient.post<LoginResponse>('/auth/login', { email, password });
    return data;
  },

  getMe: async () => {
    const { data } = await apiClient.get<MeResponse>('/auth/me');
    return data.admin;
  },
};
