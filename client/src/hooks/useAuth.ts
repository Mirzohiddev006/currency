import { create } from 'zustand';
import { api } from '../lib/api';

interface Admin {
  id: string;
  email: string;
  name: string;
  role: string;
}

interface AuthState {
  admin: Admin | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  checkAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  admin: null,
  token: localStorage.getItem('auth_token'),
  isLoading: true,

  login: async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password });
    localStorage.setItem('auth_token', data.token);
    set({ admin: data.admin, token: data.token });
  },

  logout: () => {
    localStorage.removeItem('auth_token');
    set({ admin: null, token: null });
  },

  checkAuth: async () => {
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) { set({ isLoading: false }); return; }
      const { data } = await api.get('/auth/me');
      set({ admin: data.admin, isLoading: false });
    } catch {
      localStorage.removeItem('auth_token');
      set({ admin: null, token: null, isLoading: false });
    }
  },
}));
