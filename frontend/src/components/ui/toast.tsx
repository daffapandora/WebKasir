'use client';

import { useUIStore } from '@/store/ui-store';
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react';
import type { Toast as ToastT } from '@/types';

function ToastItem({ toast }: { toast: ToastT }) {
  const removeToast = useUIStore(s => s.removeToast);

  const icons = {
    success: <CheckCircle className="w-5 h-5 text-[var(--color-success)]" />,
    error: <XCircle className="w-5 h-5 text-[var(--color-danger)]" />,
    warning: <AlertTriangle className="w-5 h-5 text-[var(--color-warning)]" />,
    info: <Info className="w-5 h-5 text-[var(--color-info)]" />,
  };

  const bgColors = {
    success: 'border-l-[var(--color-success)]',
    error: 'border-l-[var(--color-danger)]',
    warning: 'border-l-[var(--color-warning)]',
    info: 'border-l-[var(--color-info)]',
  };

  return (
    <div
      className={`toast card flex items-start gap-3 p-4 border-l-4 min-w-[320px] max-w-[420px]`}
      style={{ borderLeftColor: `var(--color-${toast.type === 'error' ? 'danger' : toast.type})` }}
    >
      <div className="flex-shrink-0 mt-0.5">{icons[toast.type]}</div>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm" style={{ color: 'var(--color-text-primary)' }}>{toast.title}</p>
        {toast.message && (
          <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-secondary)' }}>{toast.message}</p>
        )}
      </div>
      <button
        onClick={() => removeToast(toast.id)}
        className="flex-shrink-0 p-1 rounded hover:bg-[var(--color-bg-elevated)] transition-colors"
      >
        <X className="w-4 h-4" style={{ color: 'var(--color-text-muted)' }} />
      </button>
    </div>
  );
}

export function ToastContainer() {
  const toasts = useUIStore(s => s.toasts);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2">
      {toasts.map(toast => (
        <ToastItem key={toast.id} toast={toast} />
      ))}
    </div>
  );
}
