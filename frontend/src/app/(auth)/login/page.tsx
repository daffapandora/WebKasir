'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth-store';
import { useUIStore } from '@/store/ui-store';
import { Eye, EyeOff, Loader2, Monitor, Moon, Sun, Store } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const { login, isAuthenticated, user, checkAndRestoreSession } = useAuthStore();
  const { theme, toggleTheme, addToast } = useUIStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const init = async () => {
      if (!isAuthenticated) {
        await checkAndRestoreSession();
      }
      setMounted(true);
    };
    init();
  }, [isAuthenticated, checkAndRestoreSession]);

  useEffect(() => {
    if (isAuthenticated && user) {
      window.location.href = user.role === 'cashier' ? '/pos' : '/admin/dashboard';
    }
  }, [isAuthenticated, user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    const result = await login(email, password);

    if (result.success) {
      addToast('success', 'Login berhasil', 'Selamat datang kembali!');
    } else {
      setError(result.error || 'Login gagal');
    }
    setIsLoading(false);
  };

  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--color-bg-primary)' }}>
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-10 h-10 animate-spin" style={{ color: 'var(--color-accent)' }} />
          <p className="text-sm font-medium" style={{ color: 'var(--color-text-muted)' }}>Memuat halaman masuk...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex" style={{ background: 'var(--color-bg-primary)' }}>
      {/* Left Panel — Branding */}
      <div
        className="hidden lg:flex lg:w-1/2 xl:w-[55%] relative overflow-hidden flex-col justify-between p-12"
        style={{
          background: 'linear-gradient(135deg, var(--color-accent) 0%, #1B4332 50%, #081C15 100%)',
        }}
      >
        {/* Pattern overlay */}
        <div className="absolute inset-0 opacity-[0.04]" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }} />

        {/* Logo */}
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-2xl bg-white/15 backdrop-blur-sm flex items-center justify-center border border-white/20">
              <Store className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white tracking-tight">TokoPOS</h1>
              <p className="text-sm text-white/60">Enterprise Point of Sale</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="relative z-10 max-w-lg">
          <h2 className="text-4xl xl:text-5xl font-bold text-white leading-tight mb-6">
            Sistem Kasir
            <br />
            <span className="text-[#95D5B2]">Modern & Cepat</span>
          </h2>
          <p className="text-lg text-white/70 leading-relaxed mb-8">
            Kelola transaksi, inventaris, dan laporan keuangan dalam satu platform
            yang dirancang untuk efisiensi maksimal selama shift panjang.
          </p>

          <div className="grid grid-cols-2 gap-4">
            {[
              { label: 'Transaksi Cepat', desc: '3-4 langkah per penjualan' },
              { label: 'Multi Cabang', desc: 'Kelola semua outlet' },
              { label: 'Laporan Real-time', desc: 'Analitik bisnis lengkap' },
              { label: 'Aman & Terkontrol', desc: 'RBAC & audit trail' },
            ].map((f, i) => (
              <div key={i} className="bg-white/8 backdrop-blur-sm rounded-xl p-4 border border-white/10">
                <p className="text-white font-semibold text-sm">{f.label}</p>
                <p className="text-white/50 text-xs mt-1">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="relative z-10">
          <p className="text-white/40 text-sm">© 2025 TokoPOS — Dibuat untuk bisnis Indonesia</p>
        </div>
      </div>

      {/* Right Panel — Login Form */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-md">
          {/* Theme toggle */}
          <div className="flex justify-end mb-8">
            <button
              onClick={toggleTheme}
              className="btn btn-ghost btn-icon rounded-xl"
              aria-label="Toggle dark mode"
            >
              {theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
            </button>
          </div>

          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <div className="w-11 h-11 rounded-2xl flex items-center justify-center" style={{ background: 'var(--color-accent)' }}>
              <Store className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold" style={{ color: 'var(--color-text-primary)' }}>TokoPOS</h1>
              <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>Enterprise Point of Sale</p>
            </div>
          </div>

          {/* Welcome text */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-2" style={{ color: 'var(--color-text-primary)' }}>
              Selamat Datang 👋
            </h2>
            <p style={{ color: 'var(--color-text-secondary)' }}>
              Masuk ke akun Anda untuk memulai
            </p>
          </div>

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email */}
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-primary)' }}>
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={e => { setEmail(e.target.value); setError(''); }}
                placeholder="nama@tokoku.id"
                className={`input ${error ? 'input-error' : ''}`}
                required
                autoComplete="email"
                disabled={isLoading}
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-primary)' }}>
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => { setPassword(e.target.value); setError(''); }}
                  placeholder="••••••••"
                  className={`input pr-11 ${error ? 'input-error' : ''}`}
                  required
                  autoComplete="current-password"
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded"
                  tabIndex={-1}
                >
                  {showPassword
                    ? <EyeOff className="w-4 h-4" style={{ color: 'var(--color-text-muted)' }} />
                    : <Eye className="w-4 h-4" style={{ color: 'var(--color-text-muted)' }} />
                  }
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="animate-slide-up rounded-lg p-3 text-sm" style={{
                background: 'var(--color-danger-light)',
                color: 'var(--color-danger)',
              }}>
                {error}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              className="btn btn-primary btn-lg w-full"
              disabled={isLoading || !email || !password}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Memproses...
                </>
              ) : (
                'Masuk'
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
