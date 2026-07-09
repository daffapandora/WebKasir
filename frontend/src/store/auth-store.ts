/*
  Auth Store - Zustand + Supabase Auth
  =====================================
  Uses Supabase Auth exclusively for login/logout.
  After successful auth, fetches user profile from public.users.
*/

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User, Role, CashierPermissions } from '@/types';
import { DEFAULT_CASHIER_PERMISSIONS } from '@/lib/mock-data';
import { createClient } from '@/utils/supabase/client';

/* — Session expiry durations (ms) — */
const SESSION_TTL: Record<string, number> = {
  super_admin: 8 * 60 * 60 * 1000, // 8 hours
  admin:       8 * 60 * 60 * 1000,
  manager:     8 * 60 * 60 * 1000,
  cashier:    12 * 60 * 60 * 1000, // 12 hours
};

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
  checkSessionExpiry: () => boolean;
  hasRole: (...roles: Role[]) => boolean;
  isAdmin: () => boolean;
  checkAndRestoreSession: () => Promise<void>;
    updateCashierPermissions: (permissions: CashierPermissions) => void;
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

      login: async (email: string, password: string) => {
        try {
          const supabase = createClient();

          // Sign in with Supabase Auth
          const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
            email,
            password,
          });

          if (authError || !authData.user) {
            return {
              success: false,
              error: authError?.message || 'Email atau password salah',
            };
          }

          // Fetch user profile from public.users
          const { data: profile, error: profileError } = await supabase
            .from('users')
            .select('*')
            .eq('email', email)
            .single();

          if (profileError || !profile) {
            // Sign out since we couldn't get profile
            await supabase.auth.signOut();
            return {
              success: false,
              error: 'User profile tidak ditemukan',
            };
          }

          if (!profile.is_active) {
            await supabase.auth.signOut();
            return {
              success: false,
              error: 'Akun tidak aktif. Hubungi administrator.',
            };
          }

          const user: User = {
            id: Number(profile.id),
            name: profile.name,
            email: profile.email,
            role: profile.role as Role,
            branch_id: profile.branch_id,
            branch_name: profile.branch_name || '',
            permissions: (profile.permissions as string[]) || [],
            is_active: profile.is_active,
            created_at: new Date().toISOString(),
          };

          set({
            user,
            isAuthenticated: true,
            isLocked: false,
            lastActivity: Date.now(),
            lastLoginAt: Date.now(),
            cashierPermissions:
              user.role === 'cashier'
                ? (profile.permissions as CashierPermissions) || DEFAULT_CASHIER_PERMISSIONS
                : DEFAULT_CASHIER_PERMISSIONS,
          });

          return { success: true };
        } catch (err) {
          console.error('Login error:', err);
          return {
            success: false,
            error: 'Terjadi kesalahan. Silakan coba lagi.',
          };
        }
      },

      logout: () => {
        const supabase = createClient();
        supabase.auth.signOut();
        set({
          user: null,
          isAuthenticated: false,
          isLocked: false,
          lastActivity: Date.now(),
          lastLoginAt: null,
          cashierPermissions: DEFAULT_CASHIER_PERMISSIONS,
        });
      },

      lock: () => {
        set({ isLocked: true });
      },

      unlock: async (pin: string) => {
        const { user } = get();
        if (!user) return false;

        try {
          const supabase = createClient();
          const { data, error } = await supabase
            .from('users')
            .select('remember_token')
            .eq('email', user.email)
            .single();

          if (error || !data) return false;

          // PIN stored as remember_token or use simple check
          if (data.remember_token === pin) {
            set({ isLocked: false, lastActivity: Date.now() });
            return true;
          }
          return false;
        } catch {
          return false;
        }
      },

      verifyAdminPin: async (pin: string) => {
        try {
          const supabase = createClient();
          const { data, error } = await supabase
            .from('users')
            .select('remember_token, role')
            .in('role', ['super_admin', 'admin', 'manager'])
            .eq('remember_token', pin)
            .limit(1);

          if (error || !data || data.length === 0) return false;
          return true;
        } catch {
          return false;
        }
      },

      updateLastActivity: () => {
        set({ lastActivity: Date.now() });
      },

      checkSessionExpiry: () => {
        const { user, lastActivity, isAuthenticated } = get();
        if (!isAuthenticated || !user) return false;

        const ttl = SESSION_TTL[user.role] || SESSION_TTL.cashier;
        const isExpired = Date.now() - lastActivity > ttl;

        if (isExpired) {
          const supabase = createClient();
          supabase.auth.signOut();
          set({
            user: null,
            isAuthenticated: false,
            isLocked: false,
          });
        }

        return isExpired;
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

      checkAndRestoreSession: async () => {
        try {
          const supabase = createClient();
          const { data: { session } } = await supabase.auth.getSession();

          if (!session?.user) {
            set({ user: null, isAuthenticated: false });
            return;
          }

          // Session exists - fetch profile
          const { data: profile, error } = await supabase
            .from('users')
            .select('*')
            .eq('email', session.user.email)
            .single();

          if (error || !profile || !profile.is_active) {
            await supabase.auth.signOut();
            set({ user: null, isAuthenticated: false });
            return;
          }

          const user: User = {
            id: Number(profile.id),
            name: profile.name,
            email: profile.email,
            role: profile.role as Role,
            branch_id: profile.branch_id,
            branch_name: profile.branch_name || '',
            permissions: (profile.permissions as string[]) || [],
            is_active: profile.is_active,
            created_at: new Date().toISOString(),
          };

          set({
            user,
            isAuthenticated: true,
            lastActivity: Date.now(),
          });
        } catch (err) {
          console.error('Session restore error:', err);
          set({ user: null, isAuthenticated: false });
        }
      },
          updateCashierPermissions: (permissions: CashierPermissions) => {
                  set({ cashierPermissions: permissions });
                },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        isLocked: state.isLocked,
        cashierPermissions: state.cashierPermissions,
        lastActivity: state.lastActivity,
        lastLoginAt: state.lastLoginAt,
      }),
    }
  )
);
