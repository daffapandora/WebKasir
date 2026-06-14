'use client';

import { X, Clock, Trash2, RotateCcw } from 'lucide-react';
import { formatCurrency, formatRelativeTime } from '@/lib/utils';
import type { HeldBill } from '@/types';

interface HeldBillsDrawerProps {
  bills: HeldBill[];
  onRecall: (id: string) => void;
  onRemove: (id: string) => void;
  onClose: () => void;
}

export function HeldBillsDrawer({ bills, onRecall, onRemove, onClose }: HeldBillsDrawerProps) {
  return (
    <div className="modal-backdrop flex items-end sm:items-center justify-center sm:p-4">
      <div
        className="modal-content card w-full sm:max-w-md max-h-[80vh] overflow-hidden flex flex-col rounded-t-2xl sm:rounded-2xl"
        style={{ background: 'var(--color-bg-surface)' }}
      >
        <div className="flex items-center justify-between p-4 border-b" style={{ borderColor: 'var(--color-border-light)' }}>
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5" style={{ color: 'var(--color-warning)' }} />
            <h2 className="font-bold" style={{ color: 'var(--color-text-primary)' }}>Transaksi Ditahan</h2>
            <span className="badge badge-warning">{bills.length}</span>
          </div>
          <button onClick={onClose} className="btn btn-ghost btn-icon">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {bills.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 opacity-50">
              <Clock className="w-12 h-12 mb-3" style={{ color: 'var(--color-text-muted)' }} />
              <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>Tidak ada transaksi ditahan</p>
            </div>
          ) : (
            <div className="divide-y" style={{ borderColor: 'var(--color-border-light)' }}>
              {bills.map(bill => (
                <div key={bill.id} className="p-4 animate-fade-in">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="font-medium text-sm" style={{ color: 'var(--color-text-primary)' }}>
                        {bill.customer_name || 'Pelanggan Umum'}
                      </p>
                      <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                        {bill.items.length} item • {formatRelativeTime(bill.held_at)}
                      </p>
                      {bill.notes && (
                        <p className="text-xs mt-1" style={{ color: 'var(--color-info)' }}>{bill.notes}</p>
                      )}
                    </div>
                    <p className="font-bold tabular-nums" style={{ color: 'var(--color-accent)' }}>
                      {formatCurrency(bill.subtotal)}
                    </p>
                  </div>

                  <div className="text-xs space-y-0.5 mb-3">
                    {bill.items.slice(0, 3).map(item => (
                      <p key={item.id} style={{ color: 'var(--color-text-secondary)' }}>
                        {item.name} × {item.quantity}
                      </p>
                    ))}
                    {bill.items.length > 3 && (
                      <p style={{ color: 'var(--color-text-muted)' }}>+{bill.items.length - 3} item lainnya</p>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => onRecall(bill.id)}
                      className="btn btn-primary btn-sm flex-1"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      Lanjutkan
                    </button>
                    <button
                      onClick={() => onRemove(bill.id)}
                      className="btn btn-outline btn-sm"
                    >
                      <Trash2 className="w-3.5 h-3.5" style={{ color: 'var(--color-danger)' }} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
