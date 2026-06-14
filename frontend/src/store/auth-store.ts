/* ═══════════════════════════════════════════════════
   Auth Store — Zustand
   ═══════════════════════════════════════════════════ */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User, Role, CashierPermissions } from '@/types';
import { MOCK_USERS, DEFAULT_CASHIER_PERMISSIONS } from '@/lib/mock-data';

interface AuthStore {
  user: User | null;
  isAuthenticated: boolean;
  isLocked: boolean;
  lockPin: string;
  cashierPermissions: CashierPermissions;
  lastActivity: number;

  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  lock: () => void;
  unlock: (pin: string) => boolean;
  verifyAdminPin: (pin: string) => boolean;
  updateLastActivity: () => void;
  hasPermission: (permission: string) => boolean;
  hasRole: (...roles: Role[]) => boolean;
  isAdmin: () => boolean;
  updateCashierPermissions: (perms: Partial<CashierPermissions>) => void;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      isLocked: false,
      lockPin: '1234',
      cashierPermissions: DEFAULT_CASHIER_PERMISSIONS,
      lastActivity: Date.now(),

      login: async (email: string, password: string) => {
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 800));

        const user = MOCK_USERS.find(u => u.email === email);
        if (!user) {
          return { success: false, error: 'Email tidak ditemukan' };
        }
        // Demo: any password works
        if (password.length < 1) {
          return { success: false, error: 'Password tidak boleh kosong' };
        }

        set({
          user,
          isAuthenticated: true,
          isLocked: false,
          lastActivity: Date.now(),
        });
        return { success: true };
      },

      logout: () => {
        set({
          user: null,
          isAuthenticated: false,
          isLocked: false,
        });
      },

      lock: () => {
        set({ isLocked: true });
      },

      unlock: (pin: string) => {
        if (pin === get().lockPin) {
          set({ isLocked: false, lastActivity: Date.now() });
          return true;
        }
        return false;
      },

      verifyAdminPin: (pin: string) => {
        // Default admin PIN: 0000
        return pin === '0000';
      },

      updateLastActivity: () => {
        set({ lastActivity: Date.now() });
      },

      hasPermission: (permission: string) => {
        const { user } = get();
        if (!user) return false;
        if (user.permissions.includes('*')) return true;
        return user.permissions.includes(permission);
      },

      hasRole: (...roles: Role[]) => {
        const { user } = get();
        if (!user) return false;
        return roles.includes(user.role);
      },

      isAdmin: () => {
        const { user } = get();
        if (!user) return false;
        return ['super_admin', 'admin', 'manager'].includes(user.role);
      },

      updateCashierPermissions: (perms: Partial<CashierPermissions>) => {
        set(state => ({
          cashierPermissions: { ...state.cashierPermissions, ...perms },
        }));
      },
    }),
    {
      name: 'pos-auth',
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        cashierPermissions: state.cashierPermissions,
      }),
    }
  )
);
