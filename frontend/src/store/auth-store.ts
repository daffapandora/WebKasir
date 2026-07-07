/* ═══════════════════════════════════════════════════
   Auth Store — Zustand + Laravel Sanctum
   ═══════════════════════════════════════════════════ */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User, Role, CashierPermissions } from '@/types';
import { DEFAULT_CASHIER_PERMISSIONS } from '@/lib/mock-data';

/* ── Session expiry durations (ms) ── */
const SESSION_TTL: Record<string, number> = {
  super_admin: 8 * 60 * 60 * 1000,  // 8 hours
  admin:       8 * 60 * 60 * 1000,
  manager:     8 * 60 * 60 * 1000,
  cashier:    12 * 60 * 60 * 1000,  // 12 hours
};

/* ── API base URL ── */
function getApiBaseUrl(): string {
  let base = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000';
  if (!base.endsWith('/api')) {
    base = `${base.replace(/\/$/, '')}/api`;
  }
  return base;
}

interface AuthStore {
  user: User | null;
  isAuthenticated: boolean;
  isLocked: boolean;
  cashierPermissions: CashierPermissions;
  lastActivity: number;
  lastLoginAt: number | null;

  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  lock: () => void;
  unlock: (pin: string) => Promise<boolean>;
  verifyAdminPin: (pin: string) => Promise<boolean>;
  updateLastActivity: () => void;
  hasPermission: (permission: string) => boolean;
  hasRole: (...roles: Role[]) => boolean;
  isAdmin: () => boolean;
  updateCashierPermissions: (perms: Partial<CashierPermissions>) => void;
  checkSessionFreshness: () => boolean;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      isLocked: false,
      cashierPermissions: DEFAULT_CASHIER_PERMISSIONS,
      lastActivity: Date.now(),
      lastLoginAt: null,

      /* ── Login via Laravel Sanctum ── */
      login: async (email: string, password: string) => {
        try {
          if (!email || !password) {
            return { success: false, error: 'Email dan password tidak boleh kosong' };
          }

          const baseUrl = getApiBaseUrl();
          const res = await fetch(`${baseUrl}/login`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json',
            },
            body: JSON.stringify({ email, password }),
          });

          const json = await res.json();

          if (!res.ok || !json.success) {
            return { success: false, error: json.message || 'Email atau password salah' };
          }

          // Store the Sanctum token
          if (typeof window !== 'undefined' && json.token) {
            localStorage.setItem('sanctum_token', json.token);
          }

          const userData = json.user;
          const user: User = {
            id: Number(userData.id),
            name: userData.name,
            email: userData.email,
            role: userData.role as Role,
            branch_id: Number(userData.branch_id),
            branch_name: userData.branch_name,
            permissions: userData.permissions || [],
            is_active: userData.is_active,
            created_at: userData.created_at || new Date().toISOString(),
          };

          set({
            user,
            isAuthenticated: true,
            isLocked: false,
            lastActivity: Date.now(),
            lastLoginAt: Date.now(),
          });
          return { success: true };
        } catch (err: any) {
          // Network error — API unreachable
          const message = err.message?.includes('fetch')
            ? 'Tidak dapat terhubung ke server. Periksa koneksi internet Anda.'
            : err.message || 'Gagal masuk ke akun';
          return { success: false, error: message };
        }
      },

      /* ── Logout ── */
      logout: () => {
        // Call backend logout (fire-and-forget)
        const token = typeof window !== 'undefined' ? localStorage.getItem('sanctum_token') : null;
        if (token) {
          const baseUrl = getApiBaseUrl();
          fetch(`${baseUrl}/logout`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Accept': 'application/json',
            },
          }).catch(() => {
            // Ignore errors — we're logging out anyway
          });
        }

        // Clear local state
        if (typeof window !== 'undefined') {
          localStorage.removeItem('sanctum_token');
        }
        set({
          user: null,
          isAuthenticated: false,
          isLocked: false,
          lastLoginAt: null,
        });
      },

      /* ── Lock screen ── */
      lock: () => {
        set({ isLocked: true });
      },

      /* ── Unlock via backend PIN verification ── */
      unlock: async (pin: string) => {
        try {
          const token = typeof window !== 'undefined' ? localStorage.getItem('sanctum_token') : null;
          if (!token) return false;

          const baseUrl = getApiBaseUrl();
          const res = await fetch(`${baseUrl}/unlock`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json',
              'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify({ pin }),
          });

          const json = await res.json();
          if (res.ok && json.success) {
            set({ isLocked: false, lastActivity: Date.now() });
            return true;
          }
          return false;
        } catch {
          // Fallback: allow unlock with default PIN if server unreachable
          // This prevents being locked out during network issues
          if (pin === '1234') {
            set({ isLocked: false, lastActivity: Date.now() });
            return true;
          }
          return false;
        }
      },

      /* ── Admin PIN verification via backend ── */
      verifyAdminPin: async (pin: string) => {
        try {
          const token = typeof window !== 'undefined' ? localStorage.getItem('sanctum_token') : null;
          if (!token) return false;

          const baseUrl = getApiBaseUrl();
          const res = await fetch(`${baseUrl}/verify-pin`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json',
              'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify({ pin }),
          });

          const json = await res.json();
          return res.ok && json.success;
        } catch {
          // Fallback for offline scenarios
          return pin === '0000';
        }
      },

      /* ── Activity tracking ── */
      updateLastActivity: () => {
        set({ lastActivity: Date.now() });
      },

      /* ── Permission checks ── */
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

      /* ── Cashier permissions ── */
      updateCashierPermissions: (perms: Partial<CashierPermissions>) => {
        set(state => ({
          cashierPermissions: { ...state.cashierPermissions, ...perms },
        }));
      },

      /* ── Session freshness check ── */
      checkSessionFreshness: () => {
        const { user, lastLoginAt, isAuthenticated } = get();
        if (!isAuthenticated || !user || !lastLoginAt) return false;

        const ttl = SESSION_TTL[user.role] || SESSION_TTL.cashier;
        const elapsed = Date.now() - lastLoginAt;

        if (elapsed > ttl) {
          // Session expired — force logout
          get().logout();
          return false;
        }
        return true;
      },
    }),
    {
      name: 'pos-auth',
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        cashierPermissions: state.cashierPermissions,
        lastLoginAt: state.lastLoginAt,
      }),
    }
  )
);
