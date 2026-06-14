'use client';

import { useState, useRef, useEffect } from 'react';
import { useUIStore } from '@/store/ui-store';
import { useAuthStore } from '@/store/auth-store';
import { X, Lock, ShieldCheck } from 'lucide-react';

export function AdminPinModal() {
  const { pinModalOpen, pinCallback, closePinModal } = useUIStore();
  const verifyAdminPin = useAuthStore(s => s.verifyAdminPin);
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (pinModalOpen && inputRef.current) {
      inputRef.current.focus();
      setPin('');
      setError('');
    }
  }, [pinModalOpen]);

  if (!pinModalOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (verifyAdminPin(pin)) {
      if (pinCallback) pinCallback(true);
      useUIStore.setState({ pinModalOpen: false, pinCallback: null });
      setPin('');
      setError('');
    } else {
      setError('PIN admin salah');
      setPin('');
      inputRef.current?.focus();
    }
  };

  return (
    <div className="modal-backdrop flex items-center justify-center p-4">
      <div className="modal-content card p-6 w-full max-w-sm" style={{ background: 'var(--color-bg-surface)' }}>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'var(--color-accent-light)' }}>
              <ShieldCheck className="w-5 h-5" style={{ color: 'var(--color-accent)' }} />
            </div>
            <div>
              <h3 className="font-semibold" style={{ color: 'var(--color-text-primary)' }}>Verifikasi Admin</h3>
              <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>Masukkan PIN admin untuk melanjutkan</p>
            </div>
          </div>
          <button onClick={closePinModal} className="btn-ghost btn-icon rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="relative mb-4">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--color-text-muted)' }} />
            <input
              ref={inputRef}
              type="password"
              maxLength={6}
              value={pin}
              onChange={e => { setPin(e.target.value); setError(''); }}
              placeholder="PIN Admin"
              className={`input pl-10 text-center text-lg tracking-[0.5em] font-mono ${error ? 'input-error' : ''}`}
              autoComplete="off"
            />
          </div>

          {error && (
            <p className="text-xs mb-3 text-center" style={{ color: 'var(--color-danger)' }}>{error}</p>
          )}

          <div className="flex gap-2">
            <button type="button" onClick={closePinModal} className="btn btn-outline flex-1">
              Batal
            </button>
            <button type="submit" className="btn btn-primary flex-1" disabled={pin.length < 4}>
              Verifikasi
            </button>
          </div>

          <p className="text-xs text-center mt-3" style={{ color: 'var(--color-text-muted)' }}>
            Demo PIN: 0000
          </p>
        </form>
      </div>
    </div>
  );
}
