import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface AdminInfo {
  id: string;
  phone: string;
  name: string | null;
}

interface AdminAuthState {
  token: string | null;
  expiresAt: number | null;
  admin: AdminInfo | null;
  setSession: (args: { token: string; expiresAt: number; admin: AdminInfo }) => void;
  setAdmin: (admin: AdminInfo) => void;
  logout: () => void;
  isAuthenticated: () => boolean;
}

export const useAdminAuthStore = create<AdminAuthState>()(
  persist(
    (set, get) => ({
      token: null,
      expiresAt: null,
      admin: null,
      setSession: ({ token, expiresAt, admin }) => set({ token, expiresAt, admin }),
      setAdmin: (admin) => set({ admin }),
      logout: () => set({ token: null, expiresAt: null, admin: null }),
      isAuthenticated: () => {
        const { token, expiresAt } = get();
        if (!token || !expiresAt) return false;
        return Date.now() < expiresAt;
      },
    }),
    { name: 'meetwave-admin-auth' }
  )
);
