'use client';

import { PackageOpen } from 'lucide-react';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({ icon, title, description, actionLabel, onAction }: EmptyStateProps) {
  return (
    <div className="card py-16 text-center animate-fade-in">
      <div
        className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
        style={{ background: 'var(--color-accent-subtle)', color: 'var(--color-accent)' }}
      >
        {icon || <PackageOpen className="w-8 h-8" />}
      </div>
      <h3 className="text-lg font-bold mb-1" style={{ color: 'var(--color-text-primary)' }}>
        {title}
      </h3>
      {description && (
        <p className="text-sm max-w-md mx-auto mb-4" style={{ color: 'var(--color-text-muted)' }}>
          {description}
        </p>
      )}
      {actionLabel && onAction && (
        <button onClick={onAction} className="btn btn-primary">
          {actionLabel}
        </button>
      )}
    </div>
  );
}
