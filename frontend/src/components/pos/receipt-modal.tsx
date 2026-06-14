'use client';

import { X, Printer, Share2, CheckCircle } from 'lucide-react';
import { formatCurrency, formatDateTime } from '@/lib/utils';

interface ReceiptModalProps {
  invoiceNumber: string;
  change: number;
  total: number;
  onClose: () => void;
}

export function ReceiptModal({ invoiceNumber, change, total, onClose }: ReceiptModalProps) {
  const received = total + change;

  return (
    <div className="modal-backdrop flex items-center justify-center p-4">
      <div
        className="modal-content card w-full max-w-sm overflow-hidden"
        style={{ background: 'var(--color-bg-surface)' }}
      >
        {/* Success Header */}
        <div className="text-center p-6" style={{ background: 'var(--color-success-light)' }}>
          <div className="w-16 h-16 rounded-full mx-auto mb-3 flex items-center justify-center" style={{ background: 'var(--color-success)' }}>
            <CheckCircle className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-xl font-bold" style={{ color: 'var(--color-success)' }}>Pembayaran Berhasil!</h2>
          <p className="text-sm mt-1" style={{ color: 'var(--color-text-secondary)' }}>
            {formatDateTime(new Date())}
          </p>
        </div>

        {/* Receipt Preview */}
        <div className="p-4 space-y-3">
          <div className="p-4 rounded-xl border" style={{ borderColor: 'var(--color-border-light)', background: 'var(--color-bg-elevated)' }}>
            <div className="text-center mb-3 pb-3 border-b border-dashed" style={{ borderColor: 'var(--color-border)' }}>
              <p className="font-bold text-sm" style={{ color: 'var(--color-text-primary)' }}>TokoPOS</p>
              <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>Toko Pusat - Jakarta</p>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between">
                <span style={{ color: 'var(--color-text-secondary)' }}>No. Invoice</span>
                <span className="font-mono font-medium" style={{ color: 'var(--color-text-primary)' }}>{invoiceNumber}</span>
              </div>
              
              <div className="flex justify-between pt-2 border-t" style={{ borderColor: 'var(--color-border-light)' }}>
                <span style={{ color: 'var(--color-text-secondary)' }}>Total Belanja</span>
                <span className="font-bold tabular-nums" style={{ color: 'var(--color-text-primary)' }}>{formatCurrency(total)}</span>
              </div>

              <div className="flex justify-between">
                <span style={{ color: 'var(--color-text-secondary)' }}>Uang Diterima</span>
                <span className="font-semibold tabular-nums" style={{ color: 'var(--color-text-primary)' }}>{formatCurrency(received)}</span>
              </div>

              {change > 0 && (
                <div className="flex justify-between pt-2 border-t" style={{ borderColor: 'var(--color-border-light)' }}>
                  <span className="font-semibold text-sm" style={{ color: 'var(--color-text-primary)' }}>Kembalian</span>
                  <span className="font-bold tabular-nums text-lg" style={{ color: 'var(--color-success)' }}>
                    {formatCurrency(change)}
                  </span>
                </div>
              )}
            </div>
          </div>

          <p className="text-xs text-center" style={{ color: 'var(--color-text-muted)' }}>
            Terima kasih atas kunjungan Anda!
          </p>
        </div>

        {/* Actions */}
        <div className="p-4 border-t space-y-2" style={{ borderColor: 'var(--color-border-light)' }}>
          <div className="grid grid-cols-2 gap-2">
            <button className="btn btn-outline btn-sm">
              <Printer className="w-4 h-4" />
              Cetak
            </button>
            <button className="btn btn-outline btn-sm">
              <Share2 className="w-4 h-4" />
              Bagikan
            </button>
          </div>
          <button onClick={onClose} className="btn btn-primary w-full">
            Transaksi Baru
          </button>
        </div>
      </div>
    </div>
  );
}
