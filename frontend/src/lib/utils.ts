/* ═══════════════════════════════════════════════════
   Utility Functions
   ═══════════════════════════════════════════════════ */

import { clsx, type ClassValue } from 'clsx';

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

// ─── Currency Formatting (Indonesian Rupiah) ───
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatNumber(num: number): string {
  return new Intl.NumberFormat('id-ID').format(num);
}

export function formatCompact(num: number): string {
  if (num >= 1_000_000_000) return `${(num / 1_000_000_000).toFixed(1)}M`;
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}Jt`;
  if (num >= 1_000) return `${(num / 1_000).toFixed(1)}Rb`;
  return num.toString();
}

// ─── Date Formatting ───
export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(date));
}

export function formatDateTime(date: string | Date): string {
  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date));
}

export function formatTime(date: string | Date): string {
  return new Intl.DateTimeFormat('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date));
}

export function formatRelativeTime(date: string | Date): string {
  const now = new Date();
  const d = new Date(date);
  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Baru saja';
  if (diffMins < 60) return `${diffMins} menit lalu`;
  if (diffHours < 24) return `${diffHours} jam lalu`;
  if (diffDays < 7) return `${diffDays} hari lalu`;
  return formatDate(date);
}

// ─── Percentage ───
export function formatPercentage(value: number, decimals = 1): string {
  return `${value.toFixed(decimals)}%`;
}

export function calcPercentageChange(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return ((current - previous) / previous) * 100;
}

// ─── Invoice Number Generator ───
export function generateInvoiceNumber(): string {
  const now = new Date();
  const date = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
  const rand = String(Math.floor(Math.random() * 10000)).padStart(4, '0');
  return `INV-${date}-${rand}`;
}

// ─── ID Generator ───
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// ─── Cash Denominations (Indonesian) ───
export const CASH_DENOMINATIONS = [
  100000, 75000, 50000, 20000, 10000, 5000, 2000, 1000, 500,
];

export function suggestCashAmount(total: number): number[] {
  const suggestions: number[] = [];
  const exactAmount = total;
  suggestions.push(exactAmount);

  for (const denom of CASH_DENOMINATIONS) {
    const rounded = Math.ceil(total / denom) * denom;
    if (rounded > total && !suggestions.includes(rounded)) {
      suggestions.push(rounded);
    }
  }

  return suggestions.slice(0, 6).sort((a, b) => a - b);
}

// ─── Debounce ───
export function debounce<T extends (...args: unknown[]) => void>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timer: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

// ─── Barcode Detection ───
export function isBarcode(input: string): boolean {
  return /^\d{8,13}$/.test(input);
}

// ─── Status Colors ───
export function getStatusColor(status: string): string {
  const map: Record<string, string> = {
    completed: 'badge-success',
    active: 'badge-success',
    open: 'badge-success',
    voided: 'badge-danger',
    refunded: 'badge-warning',
    held: 'badge-info',
    closed: 'badge-info',
    draft: 'badge-info',
    sent: 'badge-info',
    partial: 'badge-warning',
    received: 'badge-success',
    cancelled: 'badge-danger',
    inactive: 'badge-danger',
  };
  return map[status] || 'badge-info';
}

// ─── Tier Colors ───
export function getTierColor(tier: string): string {
  const map: Record<string, string> = {
    gold: 'text-yellow-600',
    silver: 'text-gray-500',
    bronze: 'text-orange-700',
    none: 'text-gray-400',
  };
  return map[tier] || 'text-gray-400';
}

// ─── Payment Method Labels ───
export function getPaymentLabel(method: string): string {
  const map: Record<string, string> = {
    cash: 'Tunai',
    qris: 'QRIS',
    card: 'Kartu',
    transfer: 'Transfer',
    loyalty: 'Poin',
  };
  return map[method] || method;
}
