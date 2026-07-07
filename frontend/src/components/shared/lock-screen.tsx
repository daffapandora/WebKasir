'use client';

import { useState, useCallback } from 'react';
import { useAuthStore } from '@/store/auth-store';
import { Lock, Store, User } from 'lucide-react';

export function LockScreen() {
  const { user, unlock } = useAuthStore();
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;
    setIsLoading(true);
    try {
      const success = await unlock(pin);
      if (!success) {
        setError('PIN salah');
        setPin('');
      }
    } catch {
      setError('Gagal memverifikasi PIN');
      setPin('');
    } finally {
      setIsLoading(false);
    }
  }, [pin, unlock, isLoading]);

  const handleDigit = (digit: string) => {
    if (pin.length < 6) {
      const newPin = pin + digit;
      setPin(newPin);
      setError('');
    }
  };

  const handleBackspace = () => {
    setPin(p => p.slice(0, -1));
    setError('');
  };

  return (
    <div
      className="fixed inset-0 z-[200] flex flex-col items-center justify-center"
      style={{
        background: 'linear-gradient(135deg, #1A1D23 0%, #22262E 100%)',
      }}
    >
      <div className="animate-scale-in flex flex-col items-center max-w-sm w-full px-6">
        {/* Lock icon */}
        <div className="w-20 h-20 rounded-3xl bg-white/10 backdrop-blur-sm flex items-center justify-center mb-6 border border-white/10">
          <Lock className="w-10 h-10 text-white/70" />
        </div>

        {/* User */}
        <div className="flex items-center gap-2 mb-2">
          <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
            <User className="w-4 h-4 text-white/60" />
          </div>
          <span className="text-white font-medium">{user?.name}</span>
        </div>
        <p className="text-white/40 text-sm mb-8">Layar terkunci • Masukkan PIN</p>

        {/* PIN display */}
        <form onSubmit={handleSubmit} className="w-full">
          <div className="flex justify-center gap-3 mb-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="w-12 h-12 rounded-xl border flex items-center justify-center text-2xl font-bold text-white transition-all"
                style={{
                  borderColor: error ? '#EF6461' : pin.length > i ? 'rgba(255,255,255,0.4)' : 'rgba(255,255,255,0.1)',
                  background: pin.length > i ? 'rgba(255,255,255,0.1)' : 'transparent',
                }}
              >
                {pin.length > i ? '•' : ''}
              </div>
            ))}
          </div>

          {error && (
            <p className="text-center text-sm mb-4" style={{ color: '#EF6461' }}>{error}</p>
          )}

          {/* Numpad */}
          <div className="grid grid-cols-3 gap-3 max-w-[240px] mx-auto">
            {['1','2','3','4','5','6','7','8','9','','0','⌫'].map((digit, i) => {
              if (digit === '') return <div key={i} />;
              return (
                <button
                  key={i}
                  type={digit === '⌫' ? 'button' : 'button'}
                  onClick={() => digit === '⌫' ? handleBackspace() : handleDigit(digit)}
                  className="w-16 h-16 rounded-2xl text-xl font-semibold text-white
                    bg-white/8 hover:bg-white/15 active:scale-95 transition-all
                    flex items-center justify-center mx-auto"
                >
                  {digit}
                </button>
              );
            })}
          </div>

          <button
            type="submit"
            disabled={pin.length < 4 || isLoading}
            className="btn btn-primary btn-lg w-full mt-6"
          >
            {isLoading ? 'Memverifikasi...' : 'Buka Kunci'}
          </button>

          <p className="text-center text-xs text-white/30 mt-4">
            Demo PIN: 1234
          </p>
        </form>
      </div>
    </div>
  );
}
