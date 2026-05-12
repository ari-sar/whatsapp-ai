import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { AuthUser } from '../types/auth';

interface AuthState {
  token: string | null;
  expiresAt: number | null;
  user: AuthUser | null;
  setSession: (args: { token: string; expiresAt: number; user: AuthUser }) => void;
  setUser: (user: AuthUser) => void;
  logout: () => void;
  isAuthenticated: () => boolean;
  isOnboarded: () => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      token: null,
      expiresAt: null,
      user: null,
      setSession: ({ token, expiresAt, user }) => set({ token, expiresAt, user }),
      setUser: (user) => set({ user }),
      logout: () => set({ token: null, expiresAt: null, user: null }),
      isAuthenticated: () => {
        const { token, expiresAt } = get();
        if (!token || !expiresAt) return false;
        if (Date.now() >= expiresAt) return false;
        return true;
      },
      isOnboarded: () => !!get().user?.isOnboarded,
    }),
    { name: 'meetwave-auth' }
  )
);
