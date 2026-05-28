// ============================================
// KasirPro — Auth Context
// JWT authentication with role-based access
// ============================================

'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { User, Outlet, Tenant, AuthTokens, UserRole } from '../types';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

interface AuthState {
  user: User | null;
  outlet: Outlet | null;
  tenant: Tenant | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  hasRole: (...roles: UserRole[]) => boolean;
  refreshToken: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    outlet: null,
    tenant: null,
    isAuthenticated: false,
    isLoading: true,
  });

  // Load stored auth on mount
  useEffect(() => {
    const stored = localStorage.getItem('kasirpro_auth');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setState({
          user: parsed.user,
          outlet: parsed.outlet,
          tenant: parsed.tenant,
          isAuthenticated: true,
          isLoading: false,
        });
      } catch {
        localStorage.removeItem('kasirpro_auth');
        localStorage.removeItem('kasirpro_access_token');
        setState(s => ({ ...s, isLoading: false }));
      }
    } else {
      setState(s => ({ ...s, isLoading: false }));
    }
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify({ email, password }),
      credentials: 'include',
    });

    if (!res.ok) {
      const error = await res.json().catch(() => ({ message: 'Login failed' }));
      throw new Error(error.message || 'Invalid credentials');
    }

    const data: { data: AuthTokens } = await res.json();
    const { accessToken, user, outlet, tenant } = data.data;

    localStorage.setItem('kasirpro_access_token', accessToken);
    localStorage.setItem('kasirpro_auth', JSON.stringify({ user, outlet, tenant }));

    setState({
      user,
      outlet,
      tenant,
      isAuthenticated: true,
      isLoading: false,
    });
  }, []);

  const logout = useCallback(async () => {
    try {
      const token = localStorage.getItem('kasirpro_access_token');
      await fetch(`${API_BASE}/auth/logout`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
        credentials: 'include',
      });
    } catch {
      // Ignore logout errors
    }

    localStorage.removeItem('kasirpro_access_token');
    localStorage.removeItem('kasirpro_auth');

    setState({
      user: null,
      outlet: null,
      tenant: null,
      isAuthenticated: false,
      isLoading: false,
    });
  }, []);

  const hasRole = useCallback((...roles: UserRole[]) => {
    return state.user ? roles.includes(state.user.role) : false;
  }, [state.user]);

  const refreshToken = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/auth/refresh`, {
        method: 'POST',
        headers: { 'Accept': 'application/json' },
        credentials: 'include',
      });

      if (res.ok) {
        const data = await res.json();
        localStorage.setItem('kasirpro_access_token', data.data.accessToken);
      } else {
        await logout();
      }
    } catch {
      await logout();
    }
  }, [logout]);

  // Auto refresh token before expiry (every 12 minutes for 15-minute tokens)
  useEffect(() => {
    if (!state.isAuthenticated) return;

    const interval = setInterval(() => {
      refreshToken();
    }, 12 * 60 * 1000);

    return () => clearInterval(interval);
  }, [state.isAuthenticated, refreshToken]);

  return (
    <AuthContext.Provider value={{ ...state, login, logout, hasRole, refreshToken }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
