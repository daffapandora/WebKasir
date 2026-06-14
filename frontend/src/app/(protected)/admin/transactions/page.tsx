'use client';

import { useState, useEffect } from 'react';
import { getTransactions, updateTransactionStatus } from '@/lib/firebase-service';
import { formatCurrency, formatDateTime, getStatusColor, getPaymentLabel, cn } from '@/lib/utils';
import { Search, Filter, Receipt, Eye, RotateCcw, XCircle, Printer, ChevronDown, Loader2 } from 'lucide-react';
import { Pagination, usePagination } from '@/components/shared/pagination';
import { useUIStore } from '@/store/ui-store';
import { useAuthStore } from '@/store/auth-store';
import type { Transaction } from '@/types';

export default function TransactionsPage() {
  const { addToast } = useUIStore();
  const { user } = useAuthStore();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedTxnId, setSelectedTxnId] = useState<number | null>(null);

  // Void/Refund reason modal state
  const [showReasonModal, setShowReasonModal] = useState<'void' | 'refund' | null>(null);
  const [actionReason, setActionReason] = useState('');
  const [isSubmittingAction, setIsSubmittingAction] = useState(false);

  const loadTransactions = async () => {
    setIsLoading(true);
    try {
      const data = await getTransactions();
      setTransactions(data);
    } catch (e) {
      console.error(e);
      addToast('error', 'Gagal memuat data transaksi');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadTransactions();
  }, []);

  const filtered = transactions.filter(t => {
    if (statusFilter !== 'all' && t.status !== statusFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        t.invoice_number.toLowerCase().includes(q) ||
        t.cashier_name.toLowerCase().includes(q) ||
        (t.customer_name?.toLowerCase().includes(q) ?? false)
      );
    }
    return true;
  });

  const {
    currentPage,
    totalPages,
    perPage,
    paginatedItems,
    totalItems,
    handlePageChange,
    handlePerPageChange,
  } = usePagination(filtered, 20);

  const selected = selectedTxnId ? transactions.find(t => t.id === selectedTxnId) : null;

  const handleOpenActionModal = (type: 'void' | 'refund') => {
    setActionReason('');
    setShowReasonModal(type);
  };

  const handleConfirmAction = async () => {
    if (!selected || !showReasonModal || !actionReason.trim()) return;
    setIsSubmittingAction(true);
    try {
      const newStatus = showReasonModal === 'void' ? 'voided' : 'refunded';
      await updateTransactionStatus(
        selected.id,
        newStatus,
        actionReason,
        user?.name || 'Admin'
      );
      addToast('success', `Transaksi berhasil di-${showReasonModal === 'void' ? 'void' : 'refund'}`);
      setShowReasonModal(null);
      setActionReason('');
      await loadTransactions();
    } catch (e) {
      console.error(e);
      addToast('error', `Gagal memproses ${showReasonModal}`);
    } finally {
      setIsSubmittingAction(false);
    }
  };

  const handlePrintReceipt = (txn: Transaction) => {
    addToast('info', 'Mencetak struk...');
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      addToast('error', 'Popup blocker aktif, gagal mencetak struk.');
      return;
    }

    const itemsHtml = txn.items
      .map(
        item => `
      <tr>
        <td style="padding: 4px 0;">${item.product_name}<br/><span style="font-size: 10px; color: #666;">${item.quantity} x ${formatCurrency(item.unit_price)}</span></td>
        <td style="text-align: right; vertical-align: bottom; padding: 4px 0;">${formatCurrency(item.subtotal)}</td>
      </tr>
    `
      )
      .join('');

    const paymentsHtml = txn.payments
      .map(
        p => `
      <div style="display: flex; justify-content: space-between; font-size: 11px; margin-top: 2px;">
        <span>Bayar (${getPaymentLabel(p.method)})</span>
        <span>${formatCurrency(p.amount)}</span>
      </div>
    `
      )
      .join('');

    printWindow.document.write(`
      <html>
        <head>
          <title>Struk Pembayaran - ${txn.invoice_number}</title>
          <style>
            @media print {
              body { margin: 0; padding: 10px; font-family: monospace; font-size: 12px; color: #000; width: 58px; }
            }
            body { font-family: monospace; font-size: 12px; max-width: 300px; margin: 20px auto; padding: 15px; border: 1px dashed #ccc; }
            .text-center { text-align: center; }
            .divider { border-top: 1px dashed #000; margin: 8px 0; }
            table { width: 100%; border-collapse: collapse; }
          </style>
        </head>
        <body>
          <div class="text-center">
            <h3 style="margin: 0 0 4px 0;">TokoPOS</h3>
            <p style="margin: 0; font-size: 10px;">Cabang: ${txn.branch_name}</p>
            <p style="margin: 0; font-size: 10px;">Kasir: ${txn.cashier_name}</p>
          </div>
          <div class="divider"></div>
          <div style="font-size: 10px;">
            <div>Inv: ${txn.invoice_number}</div>
            <div>Tgl: ${formatDateTime(txn.created_at)}</div>
            <div>Pelanggan: ${txn.customer_name || 'Umum'}</div>
          </div>
          <div class="divider"></div>
          <table>
            <tbody>
              ${itemsHtml}
            </tbody>
          </table>
          <div class="divider"></div>
          <div style="display: flex; justify-content: space-between;">
            <span>Subtotal</span>
            <span>${formatCurrency(txn.subtotal)}</span>
          </div>
          ${
            txn.discount_amount > 0
              ? `
          <div style="display: flex; justify-content: space-between; color: red;">
            <span>Diskon</span>
            <span>-${formatCurrency(txn.discount_amount)}</span>
          </div>
          `
              : ''
          }
          ${
            txn.tax_amount > 0
              ? `
          <div style="display: flex; justify-content: space-between;">
            <span>Pajak</span>
            <span>${formatCurrency(txn.tax_amount)}</span>
          </div>
          `
              : ''
          }
          <div style="display: flex; justify-content: space-between; font-weight: bold; margin-top: 4px;">
            <span>TOTAL</span>
            <span>${formatCurrency(txn.total)}</span>
          </div>
          <div class="divider"></div>
          ${paymentsHtml}
          <div style="display: flex; justify-content: space-between; font-size: 11px; margin-top: 2px;">
            <span>Kembali</span>
            <span>${formatCurrency(txn.change_amount)}</span>
          </div>
          <div class="divider"></div>
          <div class="text-center" style="font-size: 10px; margin-top: 10px;">
            Terima Kasih Atas Kunjungan Anda<br/>
            Barang yang sudah dibeli tidak dapat ditukar/dikembalikan
          </div>
          <script>
            window.onload = function() {
              window.print();
              setTimeout(function() { window.close(); }, 500);
            }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--color-text-primary)' }}>Transaksi</h1>
          <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
            {isLoading ? 'Memuat...' : `${filtered.length} transaksi ditemukan`}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--color-text-muted)' }} />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Cari invoice, kasir, pelanggan..."
            className="input pl-10"
          />
        </div>
        <div className="flex gap-1">
          {[
            { key: 'all', label: 'Semua' },
            { key: 'completed', label: 'Selesai' },
            { key: 'voided', label: 'Void' },
            { key: 'refunded', label: 'Refund' }
          ].map(s => (
            <button
              key={s.key}
              onClick={() => {
                setStatusFilter(s.key);
                setSelectedTxnId(null);
              }}
              className={cn('btn btn-sm', statusFilter === s.key ? 'btn-primary' : 'btn-outline')}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Transaction List */}
        <div className="flex-1 card overflow-hidden flex flex-col justify-between" style={{ background: 'var(--color-bg-surface)', borderColor: 'var(--color-border-light)' }}>
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 space-y-4">
              <Loader2 className="w-8 h-8 animate-spin" style={{ color: 'var(--color-accent)' }} />
              <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>Memuat transaksi...</p>
            </div>
          ) : paginatedItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center space-y-2">
              <Receipt className="w-12 h-12 text-gray-400" />
              <p className="font-semibold" style={{ color: 'var(--color-text-primary)' }}>Tidak Ada Transaksi</p>
              <p className="text-xs max-w-xs" style={{ color: 'var(--color-text-secondary)' }}>
                Belum ada data transaksi yang cocok dengan kriteria pencarian Anda.
              </p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr style={{ background: 'var(--color-bg-elevated)' }}>
                      <th className="text-left py-3 px-4 font-medium" style={{ color: 'var(--color-text-secondary)' }}>Invoice</th>
                      <th className="text-left py-3 px-4 font-medium" style={{ color: 'var(--color-text-secondary)' }}>Kasir</th>
                      <th className="text-left py-3 px-4 font-medium" style={{ color: 'var(--color-text-secondary)' }}>Pelanggan</th>
                      <th className="text-left py-3 px-4 font-medium" style={{ color: 'var(--color-text-secondary)' }}>Bayar</th>
                      <th className="text-right py-3 px-4 font-medium" style={{ color: 'var(--color-text-secondary)' }}>Total</th>
                      <th className="text-center py-3 px-4 font-medium" style={{ color: 'var(--color-text-secondary)' }}>Status</th>
                      <th className="text-right py-3 px-4 font-medium" style={{ color: 'var(--color-text-secondary)' }}>Waktu</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedItems.map(txn => (
                      <tr
                        key={txn.id}
                        onClick={() => setSelectedTxnId(txn.id)}
                        className={cn(
                          'border-b cursor-pointer transition-colors',
                          selectedTxnId === txn.id ? 'bg-[var(--color-accent-subtle)]' : 'hover:bg-[var(--color-bg-elevated)]'
                        )}
                        style={{ borderColor: 'var(--color-border-light)' }}
                      >
                        <td className="py-3 px-4 font-mono text-xs font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                          {txn.invoice_number}
                        </td>
                        <td className="py-3 px-4" style={{ color: 'var(--color-text-secondary)' }}>{txn.cashier_name}</td>
                        <td className="py-3 px-4" style={{ color: 'var(--color-text-secondary)' }}>{txn.customer_name || '—'}</td>
                        <td className="py-3 px-4">
                          <span className="badge badge-info">
                            {txn.payments && txn.payments.length > 0
                              ? txn.payments.map(p => getPaymentLabel(p.method)).join(' + ')
                              : '—'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right font-bold tabular-nums" style={{ color: 'var(--color-text-primary)' }}>
                          {formatCurrency(txn.total)}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className={cn('badge text-xs uppercase font-bold px-2 py-0.5', getStatusColor(txn.status))}>
                            {txn.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right text-xs" style={{ color: 'var(--color-text-muted)' }}>
                          {formatDateTime(txn.created_at)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="p-4 border-t" style={{ borderColor: 'var(--color-border-light)' }}>
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  totalItems={totalItems}
                  perPage={perPage}
                  onPageChange={handlePageChange}
                  onPerPageChange={handlePerPageChange}
                />
              </div>
            </>
          )}
        </div>

        {/* Detail Panel */}
        {selected && (
          <div
            className="w-full lg:w-[380px] card p-5 flex-shrink-0 animate-slide-in-right self-start sticky top-0"
            style={{ background: 'var(--color-bg-surface)', borderColor: 'var(--color-border-light)' }}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-base" style={{ color: 'var(--color-text-primary)' }}>Detail Transaksi</h3>
              <button onClick={() => setSelectedTxnId(null)} className="btn btn-ghost btn-icon btn-sm">
                <XCircle className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4 text-sm">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span style={{ color: 'var(--color-text-muted)' }}>Invoice</span>
                  <span className="font-mono font-bold" style={{ color: 'var(--color-text-primary)' }}>{selected.invoice_number}</span>
                </div>
                <div className="flex justify-between">
                  <span style={{ color: 'var(--color-text-muted)' }}>Kasir</span>
                  <span style={{ color: 'var(--color-text-primary)' }}>{selected.cashier_name}</span>
                </div>
                <div className="flex justify-between">
                  <span style={{ color: 'var(--color-text-muted)' }}>Cabang</span>
                  <span style={{ color: 'var(--color-text-primary)' }}>{selected.branch_name}</span>
                </div>
                <div className="flex justify-between">
                  <span style={{ color: 'var(--color-text-muted)' }}>Status</span>
                  <span className={cn('badge text-xs uppercase font-bold', getStatusColor(selected.status))}>{selected.status}</span>
                </div>
              </div>

              <div className="border-t pt-3" style={{ borderColor: 'var(--color-border-light)' }}>
                <p className="font-semibold mb-2" style={{ color: 'var(--color-text-primary)' }}>Daftar Item</p>
                <div className="max-h-48 overflow-y-auto space-y-2 pr-1">
                  {selected.items.map(item => (
                    <div key={item.id} className="flex justify-between py-1">
                      <div>
                        <p className="font-medium" style={{ color: 'var(--color-text-secondary)' }}>{item.product_name}</p>
                        <p className="text-[10px]" style={{ color: 'var(--color-text-muted)' }}>{item.quantity} × {formatCurrency(item.unit_price)}</p>
                      </div>
                      <span className="tabular-nums font-semibold" style={{ color: 'var(--color-text-primary)' }}>{formatCurrency(item.subtotal)}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="border-t pt-3 space-y-1.5" style={{ borderColor: 'var(--color-border-light)' }}>
                <div className="flex justify-between">
                  <span style={{ color: 'var(--color-text-muted)' }}>Subtotal</span>
                  <span className="tabular-nums font-semibold">{formatCurrency(selected.subtotal)}</span>
                </div>
                {selected.discount_amount > 0 && (
                  <div className="flex justify-between">
                    <span style={{ color: 'var(--color-danger)' }}>Diskon</span>
                    <span className="tabular-nums font-semibold" style={{ color: 'var(--color-danger)' }}>-{formatCurrency(selected.discount_amount)}</span>
                  </div>
                )}
                {selected.tax_amount > 0 && (
                  <div className="flex justify-between">
                    <span style={{ color: 'var(--color-text-muted)' }}>PPN</span>
                    <span className="tabular-nums font-semibold">{formatCurrency(selected.tax_amount)}</span>
                  </div>
                )}
                <div
                  className="flex justify-between font-bold text-base pt-2 border-t"
                  style={{ borderColor: 'var(--color-border-light)', color: 'var(--color-text-primary)' }}
                >
                  <span>Total</span>
                  <span className="tabular-nums text-lg" style={{ color: 'var(--color-accent)' }}>{formatCurrency(selected.total)}</span>
                </div>
              </div>

              {selected.payments && selected.payments.length > 0 && (
                <div className="border-t pt-3 space-y-1" style={{ borderColor: 'var(--color-border-light)' }}>
                  <p className="font-semibold text-xs mb-1" style={{ color: 'var(--color-text-primary)' }}>Pembayaran</p>
                  {selected.payments.map((p, idx) => (
                    <div key={idx} className="flex justify-between text-xs">
                      <span style={{ color: 'var(--color-text-secondary)' }}>{getPaymentLabel(p.method)}</span>
                      <span className="tabular-nums">{formatCurrency(p.amount)}</span>
                    </div>
                  ))}
                  <div className="flex justify-between text-xs pt-1 border-t" style={{ borderColor: 'var(--color-border-light)' }}>
                    <span style={{ color: 'var(--color-text-muted)' }}>Kembalian</span>
                    <span className="tabular-nums">{formatCurrency(selected.change_amount)}</span>
                  </div>
                </div>
              )}

              {selected.void_reason && (
                <div className="p-3 rounded-lg" style={{ background: 'rgba(239, 68, 68, 0.1)' }}>
                  <p className="text-xs font-semibold" style={{ color: 'var(--color-danger)' }}>Alasan Void</p>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-secondary)' }}>
                    {selected.void_reason} — oleh {selected.voided_by || 'Sistem'}
                  </p>
                </div>
              )}

              {selected.refund_reason && (
                <div className="p-3 rounded-lg" style={{ background: 'rgba(245, 158, 11, 0.1)' }}>
                  <p className="text-xs font-semibold" style={{ color: 'var(--color-warning)' }}>Alasan Refund</p>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-secondary)' }}>
                    {selected.refund_reason} — oleh {selected.refunded_by || 'Sistem'}
                  </p>
                </div>
              )}

              <div className="flex gap-2 pt-2 border-t" style={{ borderColor: 'var(--color-border-light)' }}>
                <button
                  onClick={() => handlePrintReceipt(selected)}
                  className="btn btn-outline btn-sm flex-1"
                >
                  <Printer className="w-3.5 h-3.5 mr-1" /> Cetak
                </button>
                {selected.status === 'completed' && (
                  <>
                    <button
                      onClick={() => handleOpenActionModal('refund')}
                      className="btn btn-outline btn-sm flex-1"
                      style={{ color: 'var(--color-warning)' }}
                    >
                      <RotateCcw className="w-3.5 h-3.5 mr-1" /> Refund
                    </button>
                    <button
                      onClick={() => handleOpenActionModal('void')}
                      className="btn btn-outline btn-sm"
                      style={{ color: 'var(--color-danger)' }}
                      title="Void Transaksi"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Void/Refund Reason Dialog Modal */}
      {showReasonModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="card p-6 w-full max-w-md space-y-4" style={{ background: 'var(--color-bg-surface)' }}>
            <h3 className="font-bold text-lg" style={{ color: 'var(--color-text-primary)' }}>
              Konfirmasi {showReasonModal === 'void' ? 'Void' : 'Refund'} Transaksi
            </h3>
            <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
              Apakah Anda yakin ingin {showReasonModal === 'void' ? 'membatalkan (void)' : 'mengembalikan dana (refund)'} transaksi ini? Tindakan ini akan mengembalikan stok produk yang dibeli dan menyesuaikan statistik keuangan.
            </p>
            <div className="space-y-1">
              <label className="text-xs font-semibold" style={{ color: 'var(--color-text-secondary)' }}>
                Alasan {showReasonModal === 'void' ? 'Void' : 'Refund'} (Wajib)
              </label>
              <textarea
                value={actionReason}
                onChange={e => setActionReason(e.target.value)}
                placeholder={`Masukkan alasan ${showReasonModal === 'void' ? 'void' : 'refund'}...`}
                className="input w-full min-h-[80px] p-2 text-sm"
                rows={3}
              />
            </div>
            <div className="flex gap-2 justify-end pt-2">
              <button
                onClick={() => setShowReasonModal(null)}
                className="btn btn-outline btn-sm"
                disabled={isSubmittingAction}
              >
                Batal
              </button>
              <button
                onClick={handleConfirmAction}
                className="btn btn-sm text-white"
                style={{ background: showReasonModal === 'void' ? 'var(--color-danger)' : 'var(--color-warning)' }}
                disabled={!actionReason.trim() || isSubmittingAction}
              >
                {isSubmittingAction ? 'Memproses...' : 'Konfirmasi'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
