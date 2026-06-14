'use client';

import { useState, useRef, useEffect } from 'react';
import { Calendar, ChevronDown, X } from 'lucide-react';
import { cn, formatDate } from '@/lib/utils';

export interface DateRange {
  from: string; // YYYY-MM-DD
  to: string;   // YYYY-MM-DD
  label?: string;
}

interface DateRangePickerProps {
  value: DateRange;
  onChange: (range: DateRange) => void;
  className?: string;
}

function getPresets(): { label: string; getRange: () => DateRange }[] {
  const now = new Date();
  const today = now.toISOString().split('T')[0];

  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay());

  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const startOfQuarter = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1);

  const startOfYear = new Date(now.getFullYear(), 0, 1);

  const daysAgo = (n: number) => {
    const d = new Date(now);
    d.setDate(d.getDate() - n);
    return d.toISOString().split('T')[0];
  };

  return [
    { label: 'Hari Ini', getRange: () => ({ from: today, to: today, label: 'Hari Ini' }) },
    { label: 'Kemarin', getRange: () => ({ from: daysAgo(1), to: daysAgo(1), label: 'Kemarin' }) },
    { label: '7 Hari Terakhir', getRange: () => ({ from: daysAgo(6), to: today, label: '7 Hari Terakhir' }) },
    { label: '30 Hari Terakhir', getRange: () => ({ from: daysAgo(29), to: today, label: '30 Hari Terakhir' }) },
    { label: 'Minggu Ini', getRange: () => ({ from: startOfWeek.toISOString().split('T')[0], to: today, label: 'Minggu Ini' }) },
    { label: 'Bulan Ini', getRange: () => ({ from: startOfMonth.toISOString().split('T')[0], to: today, label: 'Bulan Ini' }) },
    { label: 'Kuartal Ini', getRange: () => ({ from: startOfQuarter.toISOString().split('T')[0], to: today, label: 'Kuartal Ini' }) },
    { label: 'Tahun Ini', getRange: () => ({ from: startOfYear.toISOString().split('T')[0], to: today, label: 'Tahun Ini' }) },
    { label: '90 Hari Terakhir', getRange: () => ({ from: daysAgo(89), to: today, label: '90 Hari Terakhir' }) },
  ];
}

export function DateRangePicker({ value, onChange, className }: DateRangePickerProps) {
  const [open, setOpen] = useState(false);
  const [customFrom, setCustomFrom] = useState(value.from);
  const [customTo, setCustomTo] = useState(value.to);
  const ref = useRef<HTMLDivElement>(null);
  const presets = getPresets();

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const applyCustomRange = () => {
    if (customFrom && customTo) {
      onChange({ from: customFrom, to: customTo, label: `${formatDate(customFrom)} – ${formatDate(customTo)}` });
      setOpen(false);
    }
  };

  const displayLabel = value.label || (value.from && value.to
    ? `${formatDate(value.from)} – ${formatDate(value.to)}`
    : 'Pilih Periode');

  return (
    <div ref={ref} className={cn('relative', className)}>
      <button
        onClick={() => setOpen(v => !v)}
        className="btn btn-outline gap-2 text-sm"
      >
        <Calendar className="w-4 h-4" />
        <span className="truncate max-w-[200px]">{displayLabel}</span>
        <ChevronDown className={cn('w-3.5 h-3.5 transition-transform', open && 'rotate-180')} />
      </button>

      {open && (
        <div
          className="absolute right-0 top-full mt-2 w-[360px] card p-0 shadow-xl overflow-hidden z-50 animate-fade-in"
          style={{ background: 'var(--color-bg-surface)', border: '1px solid var(--color-border-light)' }}
        >
          {/* Presets */}
          <div className="p-3 border-b" style={{ borderColor: 'var(--color-border-light)' }}>
            <p className="text-xs font-semibold mb-2" style={{ color: 'var(--color-text-muted)' }}>
              PRESET PERIODE
            </p>
            <div className="grid grid-cols-3 gap-1">
              {presets.map(preset => (
                <button
                  key={preset.label}
                  onClick={() => {
                    const range = preset.getRange();
                    onChange(range);
                    setCustomFrom(range.from);
                    setCustomTo(range.to);
                    setOpen(false);
                  }}
                  className={cn(
                    'text-xs py-1.5 px-2 rounded-lg text-left transition-colors',
                    value.label === preset.label
                      ? 'font-semibold'
                      : 'hover:bg-[var(--color-bg-elevated)]'
                  )}
                  style={{
                    color: value.label === preset.label ? 'var(--color-accent)' : 'var(--color-text-secondary)',
                    background: value.label === preset.label ? 'var(--color-accent-subtle)' : undefined,
                  }}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          {/* Custom Range */}
          <div className="p-3">
            <p className="text-xs font-semibold mb-2" style={{ color: 'var(--color-text-muted)' }}>
              RENTANG KUSTOM
            </p>
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={customFrom}
                onChange={e => setCustomFrom(e.target.value)}
                className="input input-sm flex-1 text-xs"
              />
              <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>→</span>
              <input
                type="date"
                value={customTo}
                onChange={e => setCustomTo(e.target.value)}
                className="input input-sm flex-1 text-xs"
              />
            </div>
            <button
              onClick={applyCustomRange}
              disabled={!customFrom || !customTo}
              className="btn btn-primary btn-sm w-full mt-2"
            >
              Terapkan
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
