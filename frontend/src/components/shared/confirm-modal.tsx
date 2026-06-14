'use client';

import { AlertTriangle, Trash2, X, Loader2 } from 'lucide-react';
import { useState } from 'react';

interface ConfirmModalProps {
  title: string;
  message: string | React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'warning' | 'primary';
  icon?: React.ReactNode;
  onConfirm: () => void | Promise<void>;
  onCancel: () => void;
}

export function ConfirmModal({
  title,
  message,
  confirmLabel = 'Hapus',
  cancelLabel = 'Batal',
  variant = 'danger',
  icon,
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  const [loading, setLoading] = useState(false);

  const variantStyles = {
    danger: {
      iconBg: 'rgb(239 68 68 / 0.12)',
      iconColor: 'var(--color-danger)',
      btnClass: 'btn-danger',
    },
    warning: {
      iconBg: 'rgb(245 158 11 / 0.12)',
      iconColor: 'var(--color-warning)',
      btnClass: 'btn-warning',
    },
    primary: {
      iconBg: 'var(--color-accent-subtle)',
      iconColor: 'var(--color-accent)',
      btnClass: 'btn-primary',
    },
  };

  const style = variantStyles[variant];

  const defaultIcon = variant === 'danger'
    ? <Trash2 className="w-6 h-6" />
    : <AlertTriangle className="w-6 h-6" />;

  const handleConfirm = async () => {
    setLoading(true);
    try {
      await onConfirm();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-backdrop flex items-center justify-center p-4" style={{ zIndex: 100 }}>
      <div
        className="modal-content card w-full max-w-sm overflow-hidden animate-fade-in"
        style={{ background: 'var(--color-bg-surface)' }}
      >
        <div className="p-6 text-center">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
            style={{ background: style.iconBg, color: style.iconColor }}
          >
            {icon || defaultIcon}
          </div>
          <h3 className="text-lg font-bold mb-2" style={{ color: 'var(--color-text-primary)' }}>
            {title}
          </h3>
          <p className="text-sm leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
            {message}
          </p>
        </div>
        <div className="p-4 pt-0 flex gap-3">
          <button
            onClick={onCancel}
            disabled={loading}
            className="btn btn-outline flex-1"
          >
            {cancelLabel}
          </button>
          <button
            onClick={handleConfirm}
            disabled={loading}
            className={`btn ${style.btnClass} flex-1`}
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
