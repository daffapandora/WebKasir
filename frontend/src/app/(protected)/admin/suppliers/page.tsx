'use client';

import { useState, useEffect } from 'react';
import { getPurchaseOrders, updatePOStatus } from '@/lib/firebase-service';
import { formatCurrency, formatDate, cn, getStatusColor } from '@/lib/utils';
import { useUIStore } from '@/store/ui-store';
import { Truck, Plus, Edit2, FileText, CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { ConfirmModal } from '@/components/shared/confirm-modal';
import { apiClient } from '@/lib/api-client';
import type { PurchaseOrder, Supplier } from '@/types';

export default function SuppliersPage() {
  const { addToast } = useUIStore();
  const [tab, setTab] = useState<'suppliers' | 'orders'>('suppliers');
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [suppliersLoading, setSuppliersLoading] = useState(false);
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [poLoading, setPoLoading] = useState(false);

  // A9: PO status update confirmation
  const [confirmPO, setConfirmPO] = useState<{ po: PurchaseOrder; newStatus: PurchaseOrder['status'] } | null>(null);

  const loadSuppliers = async () => {
    setSuppliersLoading(true);
    try {
      const res = await apiClient.get<{ success: boolean; data: Supplier[] }>('/suppliers');
      if (res.data.success) {
        setSuppliers(res.data.data);
      }
    } catch (err) {
      console.error(err);
      addToast('error', 'Gagal memuat daftar supplier');
    } finally {
      setSuppliersLoading(false);
    }
  };

  const loadPOs = async () => {
    setPoLoading(true);
    try {
      const list = await getPurchaseOrders();
      setPurchaseOrders(list);
    } catch (err) {
      console.error(err);
      addToast('error', 'Gagal memuat Purchase Orders');
    } finally {
      setPoLoading(false);
    }
  };

  useEffect(() => {
    if (tab === 'suppliers') {
      loadSuppliers();
    } else {
      loadPOs();
    }
  }, [tab]);

  // A9: Handle PO status update
  const handleUpdatePOStatus = async () => {
    if (!confirmPO) return;
    try {
      await updatePOStatus(confirmPO.po.id, confirmPO.newStatus);
      addToast('success', `PO ${confirmPO.po.po_number} status diubah ke "${confirmPO.newStatus}"`);
      if (confirmPO.newStatus === 'received') {
        addToast('info', 'Stok produk telah diupdate otomatis dari PO');
      }
      setConfirmPO(null);
      loadPOs();
    } catch (err) {
      console.error(err);
      addToast('error', 'Gagal mengubah status PO');
    }
  };

  // A9: Get available next statuses for a PO
  const getNextStatuses = (status: string): { label: string; status: PurchaseOrder['status']; variant: 'primary' | 'danger' | 'warning' }[] => {
    switch (status) {
      case 'draft': return [{ label: 'Kirim ke Supplier', status: 'sent', variant: 'primary' }, { label: 'Batalkan', status: 'cancelled', variant: 'danger' }];
      case 'sent': return [{ label: 'Tandai Diterima', status: 'received', variant: 'primary' }, { label: 'Sebagian Diterima', status: 'partial', variant: 'warning' }, { label: 'Batalkan', status: 'cancelled', variant: 'danger' }];
      case 'partial': return [{ label: 'Tandai Diterima Semua', status: 'received', variant: 'primary' }];
      default: return [];
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold" style={{ color: 'var(--color-text-primary)' }}>Supplier & Pembelian</h1><p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>Kelola pemasok dan pesanan pembelian</p></div>
        <button className="btn btn-primary"><Plus className="w-4 h-4" /> {tab === 'suppliers' ? 'Tambah Supplier' : 'Buat PO Baru'}</button>
      </div>

      <div className="flex gap-1 border-b" style={{ borderColor: 'var(--color-border-light)' }}>
        {[{ key: 'suppliers', label: 'Daftar Supplier' }, { key: 'orders', label: 'Purchase Orders' }].map(t => (
          <button key={t.key} onClick={() => setTab(t.key as typeof tab)} className={cn('px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors', tab === t.key ? 'border-[var(--color-accent)]' : 'border-transparent')} style={{ color: tab === t.key ? 'var(--color-accent)' : 'var(--color-text-secondary)' }}>{t.label}</button>
        ))}
      </div>

      {tab === 'suppliers' && (
        suppliersLoading ? (
          <div className="card p-12 flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-8 h-8 animate-spin" style={{ color: 'var(--color-accent)' }} />
            <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>Memuat daftar supplier...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {suppliers.map(s => (
              <div key={s.id} className="card p-5">
                <div className="flex items-start gap-3 mb-4">
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: 'var(--color-accent-light)' }}><Truck className="w-6 h-6" style={{ color: 'var(--color-accent)' }} /></div>
                  <div className="flex-1"><p className="font-semibold" style={{ color: 'var(--color-text-primary)' }}>{s.name}</p><p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>CP: {s.contact_person}</p></div>
                  <span className={cn('badge', s.is_active ? 'badge-success' : 'badge-danger')}>{s.is_active ? 'Aktif' : 'Nonaktif'}</span>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between"><span style={{ color: 'var(--color-text-muted)' }}>Telepon</span><span style={{ color: 'var(--color-text-primary)' }}>{s.phone}</span></div>
                  {s.email && <div className="flex justify-between"><span style={{ color: 'var(--color-text-muted)' }}>Email</span><span className="text-xs" style={{ color: 'var(--color-text-primary)' }}>{s.email}</span></div>}
                  {s.address && <p className="text-xs pt-2 border-t" style={{ color: 'var(--color-text-muted)', borderColor: 'var(--color-border-light)' }}>{s.address}</p>}
                </div>
                <div className="flex gap-2 mt-4 pt-3 border-t" style={{ borderColor: 'var(--color-border-light)' }}>
                  <button className="btn btn-outline btn-sm flex-1"><Edit2 className="w-3.5 h-3.5" /> Edit</button>
                  <button className="btn btn-primary btn-sm flex-1"><FileText className="w-3.5 h-3.5" /> Buat PO</button>
                </div>
              </div>
            ))}
            {suppliers.length === 0 && (
              <div className="col-span-full card p-8 text-center text-sm" style={{ color: 'var(--color-text-muted)' }}>
                Belum ada data supplier.
              </div>
            )}
          </div>
        )
      )}

      {tab === 'orders' && (
        <div className="card overflow-hidden">
          {poLoading ? (
            <div className="p-12 flex flex-col items-center justify-center gap-3">
              <Loader2 className="w-8 h-8 animate-spin" style={{ color: 'var(--color-accent)' }} />
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead><tr style={{ background: 'var(--color-bg-elevated)' }}>
                <th className="text-left py-3 px-4 font-medium" style={{ color: 'var(--color-text-secondary)' }}>No. PO</th>
                <th className="text-left py-3 px-4 font-medium" style={{ color: 'var(--color-text-secondary)' }}>Supplier</th>
                <th className="text-right py-3 px-4 font-medium" style={{ color: 'var(--color-text-secondary)' }}>Item</th>
                <th className="text-right py-3 px-4 font-medium" style={{ color: 'var(--color-text-secondary)' }}>Total</th>
                <th className="text-center py-3 px-4 font-medium" style={{ color: 'var(--color-text-secondary)' }}>Status</th>
                <th className="text-right py-3 px-4 font-medium" style={{ color: 'var(--color-text-secondary)' }}>Tanggal</th>
                <th className="text-center py-3 px-4 font-medium" style={{ color: 'var(--color-text-secondary)' }}>Aksi</th>
              </tr></thead>
              <tbody>
                {purchaseOrders.map(po => (
                  <tr key={po.id} className="border-b hover:bg-[var(--color-bg-elevated)]" style={{ borderColor: 'var(--color-border-light)' }}>
                    <td className="py-3 px-4 font-mono font-medium" style={{ color: 'var(--color-text-primary)' }}>{po.po_number}</td>
                    <td className="py-3 px-4" style={{ color: 'var(--color-text-secondary)' }}>{po.supplier_name}</td>
                    <td className="py-3 px-4 text-right tabular-nums">{po.items.length}</td>
                    <td className="py-3 px-4 text-right font-medium tabular-nums" style={{ color: 'var(--color-text-primary)' }}>{formatCurrency(po.total)}</td>
                    <td className="py-3 px-4 text-center"><span className={cn('badge', getStatusColor(po.status))}>{po.status}</span></td>
                    <td className="py-3 px-4 text-right text-xs" style={{ color: 'var(--color-text-muted)' }}>{formatDate(po.created_at)}</td>
                    <td className="py-3 px-4 text-center">
                      {/* A9: Action buttons based on current status */}
                      <div className="flex items-center justify-center gap-1">
                        {getNextStatuses(po.status).map(action => (
                          <button
                            key={action.status}
                            onClick={() => setConfirmPO({ po, newStatus: action.status })}
                            className={cn('btn btn-sm', action.variant === 'primary' ? 'btn-primary' : action.variant === 'danger' ? 'btn-outline' : 'btn-outline')}
                            title={action.label}
                          >
                            {action.status === 'received' ? <CheckCircle2 className="w-3.5 h-3.5" /> : action.status === 'cancelled' ? <XCircle className="w-3.5 h-3.5" style={{ color: 'var(--color-danger)' }} /> : <Truck className="w-3.5 h-3.5" />}
                          </button>
                        ))}
                        {getNextStatuses(po.status).length === 0 && (
                          <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>—</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {purchaseOrders.length === 0 && (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-sm" style={{ color: 'var(--color-text-muted)' }}>
                      Belum ada Purchase Order.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* A9: PO Status Update Confirmation */}
      {confirmPO && (
        <ConfirmModal
          title={`Update Status PO?`}
          message={`Ubah status PO "${confirmPO.po.po_number}" menjadi "${confirmPO.newStatus}"?${confirmPO.newStatus === 'received' ? ' Stok produk akan otomatis ditambahkan berdasarkan item PO.' : confirmPO.newStatus === 'cancelled' ? ' PO akan dibatalkan dan tidak bisa digunakan lagi.' : ''}`}
          confirmLabel="Konfirmasi"
          variant={confirmPO.newStatus === 'cancelled' ? 'danger' : 'primary'}
          onConfirm={handleUpdatePOStatus}
          onCancel={() => setConfirmPO(null)}
        />
      )}
    </div>
  );
}
