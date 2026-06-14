'use client';

import { useState, useEffect } from 'react';
import { getDiscounts, addDiscount, updateDiscount, deleteDiscount, logAuditTrail } from '@/lib/firebase-service';
import { formatCurrency, formatDate, cn } from '@/lib/utils';
import { Tag, Plus, Edit2, Trash2, ToggleLeft, ToggleRight, Calendar, Percent, DollarSign, X, Loader2, AlertTriangle } from 'lucide-react';
import { useUIStore } from '@/store/ui-store';
import { useAuthStore } from '@/store/auth-store';
import { ConfirmModal } from '@/components/shared/confirm-modal';
import type { Discount } from '@/types';

export default function DiscountsPage() {
  const { addToast } = useUIStore();
  const { user } = useAuthStore();
  const [discounts, setDiscounts] = useState<Discount[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingDiscount, setEditingDiscount] = useState<Discount | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Discount | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Form fields
  const [formName, setFormName] = useState('');
  const [formCode, setFormCode] = useState('');
  const [formType, setFormType] = useState<'percentage' | 'fixed'>('percentage');
  const [formValue, setFormValue] = useState<number>(0);
  const [formScope, setFormScope] = useState<'cart' | 'product'>('cart');
  const [formMinPurchase, setFormMinPurchase] = useState<number>(0);
  const [formMaxDiscount, setFormMaxDiscount] = useState<number>(0);
  const [formStartDate, setFormStartDate] = useState('');
  const [formEndDate, setFormEndDate] = useState('');
  const [formIsActive, setFormIsActive] = useState(true);

  const loadData = async () => {
    try {
      setLoading(true);
      // A10: getDiscounts now auto-deactivates expired ones
      const list = await getDiscounts();
      setDiscounts(list);
    } catch (err) {
      console.error(err);
      addToast('error', 'Gagal memuat data diskon');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  // A10: Check for soon-expiring discounts
  const soonExpiring = discounts.filter(d => {
    if (!d.is_active || !d.end_date) return false;
    const end = new Date(d.end_date);
    const now = new Date();
    const diffDays = (end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
    return diffDays >= 0 && diffDays <= 3;
  });

  const openAddForm = () => {
    setEditingDiscount(null);
    setFormName(''); setFormCode(''); setFormType('percentage'); setFormValue(0);
    setFormScope('cart'); setFormMinPurchase(0); setFormMaxDiscount(0);
    setFormStartDate(''); setFormEndDate(''); setFormIsActive(true);
    setShowForm(true);
  };

  const openEditForm = (d: Discount) => {
    setEditingDiscount(d);
    setFormName(d.name); setFormCode(d.code || ''); setFormType(d.type);
    setFormValue(d.value); setFormScope(d.scope); setFormMinPurchase(d.min_purchase || 0);
    setFormMaxDiscount(d.max_discount || 0); setFormStartDate(d.start_date || '');
    setFormEndDate(d.end_date || ''); setFormIsActive(d.is_active);
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName || formValue <= 0) {
      addToast('warning', 'Nama dan nilai diskon wajib diisi');
      return;
    }
    try {
      setSubmitting(true);
      const payload: any = {
        name: formName, code: formCode || undefined, type: formType, value: formValue,
        scope: formScope, min_purchase: formMinPurchase || undefined,
        max_discount: formMaxDiscount || undefined,
        start_date: formStartDate || undefined, end_date: formEndDate || undefined,
        is_active: formIsActive, usage_count: editingDiscount?.usage_count || 0,
        usage_limit: editingDiscount?.usage_limit || undefined,
      };
      if (editingDiscount) {
        await updateDiscount(editingDiscount.id, payload);
        await logAuditTrail(user?.name || 'System', 'update', 'discounts', `Mengubah diskon: ${formName}`);
        addToast('success', 'Diskon berhasil diperbarui');
      } else {
        await addDiscount(payload);
        await logAuditTrail(user?.name || 'System', 'create', 'discounts', `Menambahkan diskon baru: ${formName}`);
        addToast('success', 'Diskon berhasil ditambahkan');
      }
      setShowForm(false);
      loadData();
    } catch (err) {
      console.error(err);
      addToast('error', 'Gagal menyimpan diskon');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleActive = async (d: Discount) => {
    try {
      await updateDiscount(d.id, { is_active: !d.is_active });
      addToast('success', `Diskon ${!d.is_active ? 'diaktifkan' : 'dinonaktifkan'}`);
      loadData();
    } catch (err) {
      addToast('error', 'Gagal mengubah status diskon');
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteDiscount(deleteTarget.id);
      await logAuditTrail(user?.name || 'System', 'delete', 'discounts', `Menghapus diskon: ${deleteTarget.name}`);
      addToast('success', 'Diskon berhasil dihapus');
      setDeleteTarget(null);
      loadData();
    } catch (err) {
      addToast('error', 'Gagal menghapus diskon');
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold" style={{ color: 'var(--color-text-primary)' }}>Diskon & Promosi</h1><p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>Kelola diskon dan promosi aktif</p></div>
        <button onClick={openAddForm} className="btn btn-primary"><Plus className="w-4 h-4" /> Tambah Diskon</button>
      </div>

      {/* A10: Warning for soon-expiring discounts */}
      {soonExpiring.length > 0 && (
        <div className="p-3 rounded-lg flex items-start gap-3" style={{ background: 'rgb(245 158 11 / 0.08)' }}>
          <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: 'var(--color-warning)' }} />
          <div>
            <p className="text-sm font-medium" style={{ color: 'var(--color-warning)' }}>Diskon Akan Berakhir</p>
            <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
              {soonExpiring.map(d => `"${d.name}"`).join(', ')} akan berakhir dalam 3 hari ke depan.
            </p>
          </div>
        </div>
      )}

      {loading ? (
        <div className="card p-12 flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin" style={{ color: 'var(--color-accent)' }} />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {discounts.map(d => (
            <div key={d.id} className={cn('card p-5', !d.is_active && 'opacity-60')}>
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: d.is_active ? 'var(--color-accent-light)' : 'var(--color-bg-elevated)' }}>
                    {d.type === 'percentage' ? <Percent className="w-6 h-6" style={{ color: d.is_active ? 'var(--color-accent)' : 'var(--color-text-muted)' }} /> : <DollarSign className="w-6 h-6" style={{ color: d.is_active ? 'var(--color-accent)' : 'var(--color-text-muted)' }} />}
                  </div>
                  <div>
                    <p className="font-semibold" style={{ color: 'var(--color-text-primary)' }}>{d.name}</p>
                    {d.code && <p className="text-xs font-mono px-2 py-0.5 rounded mt-0.5 inline-block" style={{ background: 'var(--color-bg-elevated)', color: 'var(--color-accent)' }}>{d.code}</p>}
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold tabular-nums" style={{ color: 'var(--color-accent)' }}>
                    {d.type === 'percentage' ? `${d.value}%` : formatCurrency(d.value)}
                  </p>
                  <span className={cn('badge', d.is_active ? 'badge-success' : 'badge-danger')}>{d.is_active ? 'Aktif' : 'Nonaktif'}</span>
                </div>
              </div>

              <div className="space-y-2 text-sm border-t pt-3" style={{ borderColor: 'var(--color-border-light)' }}>
                <div className="flex justify-between"><span style={{ color: 'var(--color-text-muted)' }}>Cakupan</span><span style={{ color: 'var(--color-text-primary)' }}>{d.scope === 'cart' ? 'Seluruh keranjang' : 'Per produk'}</span></div>
                {d.min_purchase && <div className="flex justify-between"><span style={{ color: 'var(--color-text-muted)' }}>Min. Belanja</span><span className="tabular-nums">{formatCurrency(d.min_purchase)}</span></div>}
                {d.max_discount && <div className="flex justify-between"><span style={{ color: 'var(--color-text-muted)' }}>Maks. Diskon</span><span className="tabular-nums">{formatCurrency(d.max_discount)}</span></div>}
                {d.start_date && <div className="flex justify-between"><span style={{ color: 'var(--color-text-muted)' }}>Periode</span><span className="text-xs">{formatDate(d.start_date)} - {d.end_date ? formatDate(d.end_date) : '∞'}</span></div>}
                <div className="flex justify-between"><span style={{ color: 'var(--color-text-muted)' }}>Penggunaan</span><span className="tabular-nums">{d.usage_count}{d.usage_limit ? `/${d.usage_limit}` : ''}</span></div>
              </div>

              <div className="flex gap-2 mt-4 pt-3 border-t" style={{ borderColor: 'var(--color-border-light)' }}>
                <button onClick={() => openEditForm(d)} className="btn btn-outline btn-sm flex-1"><Edit2 className="w-3.5 h-3.5" /> Edit</button>
                <button onClick={() => handleToggleActive(d)} className="btn btn-outline btn-sm">
                  {d.is_active ? <ToggleRight className="w-4 h-4" style={{ color: 'var(--color-success)' }} /> : <ToggleLeft className="w-4 h-4" />}
                </button>
                <button onClick={() => setDeleteTarget(d)} className="btn btn-outline btn-sm"><Trash2 className="w-3.5 h-3.5" style={{ color: 'var(--color-danger)' }} /></button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* A4: Delete Confirm */}
      {deleteTarget && (
        <ConfirmModal
          title="Hapus Diskon?"
          message={`Apakah Anda yakin ingin menghapus diskon "${deleteTarget.name}"? Tindakan ini tidak dapat dibatalkan.`}
          confirmLabel="Hapus"
          variant="danger"
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}

      {/* Discount Form Modal */}
      {showForm && (
        <div className="modal-backdrop flex items-center justify-center p-4">
          <div className="modal-content card w-full max-w-md overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-4 border-b flex items-center justify-between" style={{ borderColor: 'var(--color-border-light)' }}>
              <h3 className="font-bold text-lg" style={{ color: 'var(--color-text-primary)' }}>
                {editingDiscount ? 'Edit Diskon' : 'Tambah Diskon Baru'}
              </h3>
              <button onClick={() => setShowForm(false)} className="btn btn-ghost btn-icon btn-sm"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-4 space-y-4 overflow-y-auto flex-1">
              <div><label className="block text-xs font-semibold mb-1">Nama Diskon *</label><input type="text" value={formName} onChange={e => setFormName(e.target.value)} className="input" placeholder="Flash Sale Weekend" required /></div>
              <div><label className="block text-xs font-semibold mb-1">Kode Promo</label><input type="text" value={formCode} onChange={e => setFormCode(e.target.value.toUpperCase())} className="input" placeholder="SALE50" /></div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold mb-1">Tipe *</label>
                  <select value={formType} onChange={e => setFormType(e.target.value as 'percentage' | 'fixed')} className="input">
                    <option value="percentage">Persentase (%)</option>
                    <option value="fixed">Nominal (Rp)</option>
                  </select>
                </div>
                <div><label className="block text-xs font-semibold mb-1">Nilai *</label><input type="number" value={formValue} onChange={e => setFormValue(Number(e.target.value))} className="input" min="0" required /></div>
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1">Cakupan</label>
                <select value={formScope} onChange={e => setFormScope(e.target.value as 'cart' | 'product')} className="input">
                  <option value="cart">Seluruh Keranjang</option>
                  <option value="product">Per Produk</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-xs font-semibold mb-1">Min. Belanja</label><input type="number" value={formMinPurchase} onChange={e => setFormMinPurchase(Number(e.target.value))} className="input" min="0" /></div>
                <div><label className="block text-xs font-semibold mb-1">Maks. Diskon</label><input type="number" value={formMaxDiscount} onChange={e => setFormMaxDiscount(Number(e.target.value))} className="input" min="0" /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-xs font-semibold mb-1">Tanggal Mulai</label><input type="date" value={formStartDate} onChange={e => setFormStartDate(e.target.value)} className="input" /></div>
                <div><label className="block text-xs font-semibold mb-1">Tanggal Selesai</label><input type="date" value={formEndDate} onChange={e => setFormEndDate(e.target.value)} className="input" /></div>
              </div>
              <label className="flex items-center gap-2 cursor-pointer text-sm"><input type="checkbox" checked={formIsActive} onChange={e => setFormIsActive(e.target.checked)} className="w-4 h-4 rounded" /> Aktifkan langsung</label>
              <div className="pt-4 border-t flex justify-end gap-2" style={{ borderColor: 'var(--color-border-light)' }}>
                <button type="button" onClick={() => setShowForm(false)} className="btn btn-outline" disabled={submitting}>Batal</button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Simpan Diskon'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
