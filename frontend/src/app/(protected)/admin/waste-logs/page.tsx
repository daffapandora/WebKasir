'use client';

import { useState, useEffect } from 'react';
import {
  Trash2, Plus, CalendarClock, AlertTriangle, TrendingDown,
  BarChart3, Filter, Search, ChevronDown
} from 'lucide-react';
import { useWasteLogStore } from '@/store/waste-log-store';
import { WasteLogFormModal } from './WasteLogFormModal';
import { WasteAnalyticsPanel } from './WasteAnalyticsPanel';
import { cn } from '@/lib/utils';
import type { WasteLog } from '@/types/waste-log';

// ─── Constants ────────────────────────────────────────────────────────────────

const REASON_LABELS: Record<string, { label: string; color: string }> = {
  expired:          { label: 'Kadaluarsa',   color: 'text-red-400 bg-red-500/10 border-red-500/25' },
  spoiled:          { label: 'Busuk/Rusak',  color: 'text-orange-400 bg-orange-500/10 border-orange-500/25' },
  unsold:           { label: 'Tidak Terjual',color: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/25' },
  production_error: { label: 'Kesalahan Buat',color: 'text-purple-400 bg-purple-500/10 border-purple-500/25' },
  other:            { label: 'Lainnya',      color: 'text-slate-400 bg-slate-500/10 border-slate-500/25' },
};

// ─── Sub-components ───────────────────────────────────────────────────────────

function ReasonBadge({ reason }: { reason: string }) {
  const meta = REASON_LABELS[reason] ?? REASON_LABELS.other;
  return (
    <span className={cn('text-[10px] px-1.5 py-0.5 rounded border font-medium', meta.color)}>
      {meta.label}
    </span>
  );
}

function WasteLogCard({ log }: { log: WasteLog }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="card overflow-hidden">
      {/* ── Header Row ── */}
      <button
        onClick={() => setExpanded(v => !v)}
        className="w-full flex items-center justify-between p-4 text-left hover:bg-[var(--color-bg-elevated)] transition-colors"
      >
        <div className="flex items-center gap-4 flex-1 min-w-0">
          <div
            className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ background: 'rgb(239 68 68 / 0.12)' }}
          >
            <Trash2 className="w-4 h-4 text-red-400" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium truncate" style={{ color: 'var(--color-text-primary)' }}>
              {new Date(log.logged_at).toLocaleDateString('id-ID', {
                day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
              })}
            </p>
            <p className="text-xs mt-0.5 truncate" style={{ color: 'var(--color-text-muted)' }}>
              {log.user_name} · {log.items?.length ?? 0} item
              {log.notes && ` · ${log.notes}`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 flex-shrink-0">
          <div className="text-right">
            <p className="text-sm font-bold font-mono text-red-400">
              - Rp {Number(log.total_loss_amount).toLocaleString('id-ID')}
            </p>
            <p className="text-[10px] uppercase font-medium" style={{ color: 'var(--color-text-muted)' }}>
              Total Kerugian
            </p>
          </div>
          <ChevronDown
            className={cn('w-4 h-4 transition-transform', expanded && 'rotate-180')}
            style={{ color: 'var(--color-text-muted)' }}
          />
        </div>
      </button>

      {/* ── Items Detail ── */}
      {expanded && log.items && log.items.length > 0 && (
        <div className="border-t" style={{ borderColor: 'var(--color-border-light)' }}>
          <table className="w-full">
            <thead>
              <tr style={{ background: 'var(--color-bg-elevated)' }}>
                {['Item', 'Tipe', 'Qty', 'HPP/Unit', 'Total', 'Alasan'].map(h => (
                  <th key={h} className="text-left px-4 py-2 text-[10px] font-semibold uppercase tracking-wider"
                    style={{ color: 'var(--color-text-muted)' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y" style={{ borderColor: 'var(--color-border-light)' }}>
              {log.items.map((item: import('@/types/waste-log').WasteLogItem) => (
                <tr key={item.id} className="hover:bg-[var(--color-bg-elevated)] transition-colors">
                  <td className="px-4 py-2.5">
                    <span className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>
                      {item.item_name}
                    </span>
                  </td>
                  <td className="px-4 py-2.5">
                    <span className={cn(
                      'text-[10px] px-1.5 py-0.5 rounded border',
                      item.wasted_type.includes('Ingredient')
                        ? 'text-blue-400 bg-blue-500/10 border-blue-500/25'
                        : 'text-purple-400 bg-purple-500/10 border-purple-500/25'
                    )}>
                      {item.wasted_type.includes('Ingredient') ? 'Bahan Baku' : 'Produk'}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-sm font-mono" style={{ color: 'var(--color-text-secondary)' }}>
                    {Number(item.quantity).toLocaleString('id-ID', { maximumFractionDigits: 3 })} {item.unit}
                  </td>
                  <td className="px-4 py-2.5 text-sm font-mono" style={{ color: 'var(--color-text-secondary)' }}>
                    Rp {Number(item.cost_at_time).toLocaleString('id-ID')}
                  </td>
                  <td className="px-4 py-2.5 text-sm font-mono font-semibold text-red-400">
                    Rp {Number(item.total_cost).toLocaleString('id-ID')}
                  </td>
                  <td className="px-4 py-2.5">
                    <div className="flex flex-col gap-1">
                      <ReasonBadge reason={item.reason} />
                      {item.reason_detail && (
                        <p className="text-[10px]" style={{ color: 'var(--color-text-muted)' }}>
                          {item.reason_detail}
                        </p>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function WasteLogsPage() {
  const { wasteLogs, totalLoss, isLoading, fetchWasteLogs } = useWasteLogStore();

  const [formOpen, setFormOpen]     = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [dateFrom, setDateFrom]     = useState('');
  const [dateTo, setDateTo]         = useState('');

  useEffect(() => {
    fetchWasteLogs({ from: dateFrom, to: dateTo });
  }, [dateFrom, dateTo, fetchWasteLogs]);

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: 'rgb(239 68 68 / 0.15)' }}>
            <Trash2 className="w-4 h-4 text-red-400" />
          </div>
          <div>
            <h1 className="text-lg font-bold" style={{ color: 'var(--color-text-primary)' }}>
              Log Limbah Makanan
            </h1>
            <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
              Lacak kebocoran biaya dari pembuangan bahan & produk
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowAnalytics(v => !v)}
            className={cn('btn btn-sm gap-2', showAnalytics ? 'btn-primary' : 'btn-ghost')}
          >
            <BarChart3 className="w-4 h-4" />
            Analitik
          </button>
          <button
            onClick={() => setFormOpen(true)}
            className="btn btn-primary btn-sm gap-2"
          >
            <Plus className="w-4 h-4" />
            Catat Limbah
          </button>
        </div>
      </div>

      {/* ── Analytics Panel ── */}
      {showAnalytics && (
        <WasteAnalyticsPanel from={dateFrom} to={dateTo} />
      )}

      {/* ── Loss Summary Card ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card p-4 border-l-4 border-red-500">
          <p className="text-xs uppercase font-semibold tracking-wider" style={{ color: 'var(--color-text-muted)' }}>
            Total Kerugian Periode
          </p>
          <p className="text-2xl font-bold font-mono text-red-400 mt-1">
            Rp {Number(totalLoss).toLocaleString('id-ID')}
          </p>
        </div>
        <div className="card p-4 border-l-4" style={{ borderColor: 'var(--color-accent)' }}>
          <p className="text-xs uppercase font-semibold tracking-wider" style={{ color: 'var(--color-text-muted)' }}>
            Total Log
          </p>
          <p className="text-2xl font-bold font-mono mt-1" style={{ color: 'var(--color-text-primary)' }}>
            {wasteLogs.length}
          </p>
        </div>
        <div className="card p-4 border-l-4 border-orange-500">
          <p className="text-xs uppercase font-semibold tracking-wider" style={{ color: 'var(--color-text-muted)' }}>
            Rata-rata per Log
          </p>
          <p className="text-2xl font-bold font-mono text-orange-400 mt-1">
            Rp {wasteLogs.length > 0
              ? Math.round(totalLoss / wasteLogs.length).toLocaleString('id-ID')
              : '0'}
          </p>
        </div>
      </div>

      {/* ── Filters ── */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <CalendarClock className="w-4 h-4" style={{ color: 'var(--color-text-muted)' }} />
          <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="input input-sm" />
          <span className="text-sm" style={{ color: 'var(--color-text-muted)' }}>—</span>
          <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="input input-sm" />
        </div>
        {(dateFrom || dateTo) && (
          <button
            onClick={() => { setDateFrom(''); setDateTo(''); }}
            className="btn btn-ghost btn-sm text-xs"
          >
            Reset Filter
          </button>
        )}
      </div>

      {/* ── Log List ── */}
      <div className="space-y-3">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="card h-20 animate-pulse" style={{ background: 'var(--color-bg-elevated)' }} />
          ))
        ) : wasteLogs.length === 0 ? (
          <div className="card py-16 text-center">
            <TrendingDown className="w-10 h-10 mx-auto mb-3" style={{ color: 'var(--color-text-muted)' }} />
            <p className="text-sm font-medium" style={{ color: 'var(--color-text-secondary)' }}>
              Belum ada log limbah
            </p>
            <p className="text-xs mt-1" style={{ color: 'var(--color-text-muted)' }}>
              Klik "Catat Limbah" untuk memulai pencatatan
            </p>
          </div>
        ) : (
          wasteLogs.map((log: WasteLog) => <WasteLogCard key={log.id} log={log} />)
        )}
      </div>

      {/* ── Modal ── */}
      {formOpen && <WasteLogFormModal onClose={() => setFormOpen(false)} />}
    </div>
  );
}
