'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/context';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      await login(email, password);
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Login gagal. Periksa kembali email dan password.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center" style={{
      backgroundColor: '#F9FAFB', display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh',
      fontFamily: '"Inter", sans-serif'
    }}>
      <div style={{
        background: '#FFFFFF', padding: '48px', borderRadius: '24px',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.01)', 
        width: '100%', maxWidth: '420px', border: '1px solid #F1F5F9'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <div style={{
            width: 64, height: 64, borderRadius: 16,
            background: '#0F766E', // Deep Teal
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 900, fontSize: '32px', color: 'white',
            margin: '0 auto 20px'
          }}>
            K
          </div>
          <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#1E293B', marginBottom: '8px' }}>
            KasirPro
          </h1>
          <p style={{ color: '#64748B', fontSize: '15px' }}>
            Masuk untuk memulai shift Anda.
          </p>
        </div>

        {error && (
          <div style={{
            background: '#FEF2F2', color: '#DC2626', padding: '16px',
            borderRadius: '12px', fontSize: '14px', marginBottom: '24px',
            border: '1px solid #FECACA', fontWeight: 500
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: '#1E293B', marginBottom: '8px' }}>
              Email Kasir
            </label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              style={{
                width: '100%', padding: '14px 16px', borderRadius: '12px',
                border: '1px solid #E2E8F0', fontSize: '15px', color: '#1E293B',
                outline: 'none', transition: 'border-color 0.2s', backgroundColor: '#F8FAFC'
              }}
              placeholder="admin@kasirpro.com"
              onFocus={(e) => e.target.style.borderColor = '#0F766E'}
              onBlur={(e) => e.target.style.borderColor = '#E2E8F0'}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: '#1E293B', marginBottom: '8px' }}>
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              style={{
                width: '100%', padding: '14px 16px', borderRadius: '12px',
                border: '1px solid #E2E8F0', fontSize: '15px', color: '#1E293B',
                outline: 'none', transition: 'border-color 0.2s', backgroundColor: '#F8FAFC'
              }}
              placeholder="••••••••"
              onFocus={(e) => e.target.style.borderColor = '#0F766E'}
              onBlur={(e) => e.target.style.borderColor = '#E2E8F0'}
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            style={{
              width: '100%', padding: '16px', borderRadius: '12px',
              backgroundColor: isLoading ? '#94A3B8' : '#0F766E', // Deep Teal
              color: 'white', fontSize: '16px', fontWeight: 700,
              border: 'none', cursor: isLoading ? 'not-allowed' : 'pointer',
              marginTop: '12px', boxShadow: isLoading ? 'none' : '0 4px 12px rgba(15, 118, 110, 0.2)',
              transition: 'all 0.2s',
            }}
          >
            {isLoading ? 'Memeriksa...' : 'Masuk Sekarang'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '32px', fontSize: '14px', color: '#64748B' }}>
          <p>Demo Akses:</p>
          <p style={{ fontWeight: 600, marginTop: '4px', color: '#1E293B' }}>admin@kasirpro.com / password</p>
        </div>
      </div>
    </div>
  );
}
