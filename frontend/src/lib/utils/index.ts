// ============================================
// KasirPro — Utility Functions
// ============================================

/** Format number as Indonesian Rupiah */
export function formatRupiah(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

/** Format number with thousand separators */
export function formatNumber(num: number): string {
  return new Intl.NumberFormat('id-ID').format(num);
}

/** Format date to Indonesian locale */
export function formatDate(date: string | Date): string {
  return new Date(date).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

/** Format date and time */
export function formatDateTime(date: string | Date): string {
  return new Date(date).toLocaleString('id-ID', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/** Format time only */
export function formatTime(date: string | Date): string {
  return new Date(date).toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

/** Format relative time (e.g., "2 jam lalu") */
export function formatRelativeTime(date: string | Date): string {
  const now = new Date();
  const then = new Date(date);
  const diffMs = now.getTime() - then.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'Baru saja';
  if (diffMins < 60) return `${diffMins} menit lalu`;
  if (diffHours < 24) return `${diffHours} jam lalu`;
  if (diffDays < 7) return `${diffDays} hari lalu`;
  return formatDate(date);
}

/** Generate UUID v4 */
export function generateUUID(): string {
  return crypto.randomUUID();
}

/** Debounce function */
export function debounce<T extends (...args: unknown[]) => unknown>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
}

/** Truncate text */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - 3) + '...';
}

/** Capitalize first letter */
export function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/** Payment method display name */
export function getPaymentMethodLabel(method: string): string {
  const labels: Record<string, string> = {
    cash: 'Tunai',
    qris: 'QRIS',
    bank_transfer: 'Transfer Bank',
    e_wallet: 'E-Wallet',
  };
  return labels[method] || method;
}

/** Payment method icon */
export function getPaymentMethodIcon(method: string): string {
  const icons: Record<string, string> = {
    cash: '💵',
    qris: '📱',
    bank_transfer: '🏦',
    e_wallet: '💳',
  };
  return icons[method] || '💰';
}

/** Role display name */
export function getRoleLabel(role: string): string {
  const labels: Record<string, string> = {
    owner: 'Pemilik',
    manager: 'Manajer',
    cashier: 'Kasir',
    inventory_staff: 'Staff Inventaris',
  };
  return labels[role] || role;
}

/** Stock status */
export function getStockStatus(quantity: number, threshold: number): {
  label: string;
  className: string;
} {
  if (quantity <= 0) return { label: 'Habis', className: 'out' };
  if (quantity <= threshold) return { label: 'Stok Rendah', className: 'low' };
  return { label: `${quantity} tersedia`, className: '' };
}

/** Quick cash amounts for payment */
export function getQuickCashAmounts(total: number): number[] {
  const rounded = Math.ceil(total / 1000) * 1000;
  const amounts: number[] = [rounded];

  // Add common denominations above total
  const denominations = [5000, 10000, 20000, 50000, 100000];
  for (const d of denominations) {
    const next = Math.ceil(total / d) * d;
    if (next > rounded && !amounts.includes(next)) {
      amounts.push(next);
    }
  }

  // Always include these if above total
  for (const exact of [50000, 100000, 200000, 500000]) {
    if (exact >= total && !amounts.includes(exact)) {
      amounts.push(exact);
    }
  }

  return amounts.sort((a, b) => a - b).slice(0, 6);
}
