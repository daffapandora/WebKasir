'use client';

import { useState } from 'react';
import { X, Tag, Percent } from 'lucide-react';
import { formatCurrency, cn } from '@/lib/utils';
import { MOCK_DISCOUNTS } from '@/lib/mock-data';

interface DiscountModalProps {
  onApply: (type: 'fixed' | 'percentage' | 'none', value: number) => void;
  onClose: () => void;
}

export function DiscountModal({ onApply, onClose }: DiscountModalProps) {
  const [mode, setMode] = useState<'preset' | 'custom'>('preset');
  const [type, setType] = useState<'fixed' | 'percentage'>('percentage');
  const [value, setValue] = useState('');

  const activeDiscounts = MOCK_DISCOUNTS.filter(d => d.is_active);

  return (
    <div className="modal-backdrop flex items-center justify-center p-4">
      <div
        className="modal-content card w-full max-w-md overflow-hidden"
        style={{ background: 'var(--color-bg-surface)' }}
      >
        <div className="flex items-center justify-between p-4 border-b" style={{ borderColor: 'var(--color-border-light)' }}>
          <div className="flex items-center gap-2">
            <Tag className="w-5 h-5" style={{ color: 'var(--color-accent)' }} />
            <h2 className="font-bold" style={{ color: 'var(--color-text-primary)' }}>Diskon</h2>
          </div>
          <button onClick={onClose} className="btn btn-ghost btn-icon">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          {/* Mode toggle */}
          <div className="flex rounded-lg overflow-hidden border" style={{ borderColor: 'var(--color-border)' }}>
            <button
              onClick={() => setMode('preset')}
              className={cn('flex-1 py-2 text-sm font-medium transition-colors',
                mode === 'preset' ? 'text-white' : ''
              )}
              style={{ background: mode === 'preset' ? 'var(--color-accent)' : 'transparent', color: mode === 'preset' ? 'white' : 'var(--color-text-secondary)' }}
            >
              Promo Aktif
            </button>
            <button
              onClick={() => setMode('custom')}
              className={cn('flex-1 py-2 text-sm font-medium transition-colors')}
              style={{ background: mode === 'custom' ? 'var(--color-accent)' : 'transparent', color: mode === 'custom' ? 'white' : 'var(--color-text-secondary)' }}
            >
              Manual
            </button>
          </div>

          {mode === 'preset' ? (
            <div className="space-y-2">
              {activeDiscounts.map(d => (
                <button
                  key={d.id}
                  onClick={() => onApply(d.type, d.value)}
                  className="w-full card p-3 text-left hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-sm" style={{ color: 'var(--color-text-primary)' }}>{d.name}</p>
                      <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                        {d.code && <span className="font-mono mr-2">{d.code}</span>}
                        {d.min_purchase && `Min. ${formatCurrency(d.min_purchase)}`}
                      </p>
                    </div>
                    <span className="text-lg font-bold" style={{ color: 'var(--color-accent)' }}>
                      {d.type === 'percentage' ? `${d.value}%` : formatCurrency(d.value)}
                    </span>
                  </div>
                </button>
              ))}
              {activeDiscounts.length === 0 && (
                <p className="text-center py-6 text-sm" style={{ color: 'var(--color-text-muted)' }}>
                  Tidak ada promo aktif
                </p>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex rounded-lg overflow-hidden border" style={{ borderColor: 'var(--color-border)' }}>
                <button
                  onClick={() => setType('percentage')}
                  className="flex-1 py-2 text-sm font-medium flex items-center justify-center gap-1"
                  style={{ background: type === 'percentage' ? 'var(--color-accent)' : 'transparent', color: type === 'percentage' ? 'white' : 'var(--color-text-secondary)' }}
                >
                  <Percent className="w-3.5 h-3.5" /> Persen
                </button>
                <button
                  onClick={() => setType('fixed')}
                  className="flex-1 py-2 text-sm font-medium"
                  style={{ background: type === 'fixed' ? 'var(--color-accent)' : 'transparent', color: type === 'fixed' ? 'white' : 'var(--color-text-secondary)' }}
                >
                  Rp Tetap
                </button>
              </div>

              <input
                type="number"
                value={value}
                onChange={e => setValue(e.target.value)}
                placeholder={type === 'percentage' ? 'Masukkan persen...' : 'Masukkan jumlah...'}
                className="input text-lg font-bold text-center tabular-nums"
                autoFocus
                min={0}
                max={type === 'percentage' ? 100 : undefined}
              />

              <div className="flex gap-2">
                <button onClick={onClose} className="btn btn-outline flex-1">Batal</button>
                <button
                  onClick={() => onApply(type, parseFloat(value) || 0)}
                  disabled={!value || parseFloat(value) <= 0}
                  className="btn btn-primary flex-1"
                >
                  Terapkan
                </button>
              </div>
            </div>
          )}

          {/* Remove discount */}
          <button
            onClick={() => onApply('none', 0)}
            className="btn btn-ghost w-full text-sm"
            style={{ color: 'var(--color-danger)' }}
          >
            Hapus Diskon
          </button>
        </div>
      </div>
    </div>
  );
}
