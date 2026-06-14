'use client';

import { useEffect } from 'react';
import { TrendingDown, AlertTriangle, Package, Flame } from 'lucide-react';
import { useWasteLogStore } from '@/store/waste-log-store';
import { cn } from '@/lib/utils';

const REASON_LABELS: Record<string, string> = {
  expired:          'Kadaluarsa',
  spoiled:          'Busuk/Rusak',
  unsold:           'Tidak Terjual',
  production_error: 'Kesalahan Buat',
  other:            'Lainnya',
};

const REASON_COLORS: Record<string, string> = {
  expired:          'bg-red-500',
  spoiled:          'bg-orange-500',
  unsold:           'bg-yellow-500',
  production_error: 'bg-purple-500',
  other:            'bg-slate-500',
};

interface Props {
  from?: string;
  to?: string;
}

export function WasteAnalyticsPanel({ from, to }: Props) {
  const { analytics, fetchAnalytics } = useWasteLogStore();

  useEffect(() => {
    fetchAnalytics({ from, to });
  }, [from, to, fetchAnalytics]);

  if (!analytics) {
    return (
      <div className="card p-6">
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-8 rounded animate-pulse" style={{ background: 'var(--color-bg-elevated)' }} />
          ))}
        </div>
      </div>
    );
  }

  const maxByReason = Math.max(...analytics.by_reason.map(r => r.total_cost), 1);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* ── Kerugian per Alasan ── */}
      <div className="card p-5">
        <div className="flex items-center gap-2 mb-4">
          <AlertTriangle className="w-4 h-4 text-orange-400" />
          <h3 className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>
            Kerugian per Alasan
          </h3>
        </div>

        {analytics.by_reason.length === 0 ? (
          <p className="text-sm text-center py-6" style={{ color: 'var(--color-text-muted)' }}>
            Tidak ada data pada periode ini
          </p>
        ) : (
          <div className="space-y-3">
            {analytics.by_reason.map(item => {
              const pct = Math.round((item.total_cost / maxByReason) * 100);
              return (
                <div key={item.reason}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <div className={cn('w-2.5 h-2.5 rounded-full', REASON_COLORS[item.reason] ?? 'bg-slate-500')} />
                      <span className="text-xs font-medium" style={{ color: 'var(--color-text-secondary)' }}>
                        {REASON_LABELS[item.reason] ?? item.reason}
                      </span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded"
                        style={{ background: 'var(--color-bg-elevated)', color: 'var(--color-text-muted)' }}>
                        {item.count}×
                      </span>
                    </div>
                    <span className="text-xs font-mono font-semibold text-red-400">
                      Rp {Number(item.total_cost).toLocaleString('id-ID')}
                    </span>
                  </div>
                  <div className="w-full rounded-full h-1.5" style={{ background: 'var(--color-bg-elevated)' }}>
                    <div
                      className={cn('h-1.5 rounded-full transition-all duration-700', REASON_COLORS[item.reason] ?? 'bg-slate-500')}
                      style={{ width: `${pct}%`, opacity: 0.75 }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Top 10 Item Limbah ── */}
      <div className="card p-5">
        <div className="flex items-center gap-2 mb-4">
          <Flame className="w-4 h-4 text-red-400" />
          <h3 className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>
            Top 10 Item Limbah
          </h3>
        </div>

        {analytics.top_items.length === 0 ? (
          <p className="text-sm text-center py-6" style={{ color: 'var(--color-text-muted)' }}>
            Tidak ada data pada periode ini
          </p>
        ) : (
          <div className="space-y-2">
            {analytics.top_items.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between py-1.5 border-b last:border-0"
                style={{ borderColor: 'var(--color-border-light)' }}>
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-xs font-bold w-5 text-center flex-shrink-0"
                    style={{ color: idx < 3 ? 'var(--color-accent)' : 'var(--color-text-muted)' }}>
                    {idx + 1}
                  </span>
                  <div className="min-w-0">
                    <p className="text-xs font-medium truncate" style={{ color: 'var(--color-text-primary)' }}>
                      {item.item_name}
                    </p>
                    <p className="text-[10px]" style={{ color: 'var(--color-text-muted)' }}>
                      {item.wasted_type.includes('Ingredient') ? 'Bahan Baku' : 'Produk'} ·{' '}
                      {Number(item.total_qty).toLocaleString('id-ID', { maximumFractionDigits: 2 })} unit
                    </p>
                  </div>
                </div>
                <span className="text-xs font-mono font-semibold text-red-400 flex-shrink-0 ml-2">
                  Rp {Number(item.total_cost).toLocaleString('id-ID')}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
