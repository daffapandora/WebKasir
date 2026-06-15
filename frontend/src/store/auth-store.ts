/* ═══════════════════════════════════════════════════
   Auth Store — Zustand
   ═══════════════════════════════════════════════════ */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User, Role, CashierPermissions } from '@/types';
import { DEFAULT_CASHIER_PERMISSIONS } from '@/lib/mock-data';
import { supabase } from '@/lib/supabase';

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
        try {
          if (!email || !password) {
            return { success: false, error: 'Email dan password tidak boleh kosong' };
          }

          const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
            email,
            password,
          });

          if (authError) {
            return { success: false, error: authError.message };
          }

          // Fetch user profile from public.users table in database
          const { data: userProfile, error: profileError } = await supabase
            .from('users')
            .select('*')
            .eq('email', email)
            .single();

          if (profileError || !userProfile) {
            return { success: false, error: 'Profil pengguna tidak ditemukan di database' };
          }

          if (!userProfile.is_active) {
            return { success: false, error: 'Akun Anda sedang dinonaktifkan' };
          }

          const user: User = {
            id: Number(userProfile.id),
            name: userProfile.name,
            email: userProfile.email,
            role: userProfile.role as Role,
            branch_id: Number(userProfile.branch_id),
            branch_name: userProfile.branch_name,
            permissions: userProfile.permissions || [],
            is_active: userProfile.is_active,
            created_at: userProfile.created_at,
          };

          set({
            user,
            isAuthenticated: true,
            isLocked: false,
            lastActivity: Date.now(),
          });
          return { success: true };
        } catch (err: any) {
          return { success: false, error: err.message || 'Gagal masuk ke akun' };
        }
      },

      logout: () => {
        supabase.auth.signOut().catch(console.error);
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
