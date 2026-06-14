'use client';

import { useState, useCallback, useEffect } from 'react';
import { Plus, Trash2, Search, AlertCircle, AlertTriangle } from 'lucide-react';
import { useWasteLogStore } from '@/store/waste-log-store';
import { useIngredientStore } from '@/store/ingredient-store';
import { useAuthStore } from '@/store/auth-store';
import { getProducts } from '@/lib/firebase-service';
import type { WasteLogItemInput } from '@/types/waste-log';
import type { Ingredient } from '@/types/ingredient';
import type { Product } from '@/types';
import { cn } from '@/lib/utils';
import { ConfirmModal } from '@/components/shared/confirm-modal';

const REASONS = [
  { value: 'expired',          label: 'Kadaluarsa' },
  { value: 'spoiled',          label: 'Busuk / Rusak' },
  { value: 'unsold',           label: 'Tidak Terjual' },
  { value: 'production_error', label: 'Kesalahan Pembuatan' },
  { value: 'other',            label: 'Lainnya' },
] as const;

interface Props {
  onClose: () => void;
}

export function WasteLogFormModal({ onClose }: Props) {
  const { createWasteLog } = useWasteLogStore();
  const { ingredients }    = useIngredientStore();
  const { user }           = useAuthStore();

  const [products, setProducts] = useState<Product[]>([]);
  const [loggedAt, setLoggedAt] = useState(new Date().toISOString().slice(0, 16));
  const [notes, setNotes]       = useState('');
  const [items, setItems]       = useState<WasteLogItemInput[]>([]);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');
  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => {
    getProducts().then(setProducts).catch(console.error);
  }, []);

  // ── Item mutations ─────────────────────────────────

  const addItem = useCallback(() => {
    setItems(prev => [...prev, {
      wasted_type: 'ingredient',
      wasted_id: 0,
      quantity: 1,
      reason: 'expired',
      reason_detail: '',
    }]);
  }, []);

  const updateItem = useCallback(<K extends keyof WasteLogItemInput>(
    idx: number, key: K, value: WasteLogItemInput[K]
  ) => {
    setItems(prev => {
      const next = [...prev];
      next[idx] = { ...next[idx], [key]: value };
      // Reset wasted_id saat ganti tipe
      if (key === 'wasted_type') next[idx].wasted_id = 0;
      return next;
    });
  }, []);

  const removeItem = useCallback((idx: number) => {
    setItems(prev => prev.filter((_, i) => i !== idx));
  }, []);

  // ── Estimated cost preview ────────────────────────

  const getItemCost = (item: WasteLogItemInput): number => {
    if (item.wasted_type === 'ingredient' && item.wasted_id) {
      const ing = ingredients.find((i: Ingredient) => i.id === item.wasted_id);
      return ing ? Number(ing.avg_cost_price) * item.quantity : 0;
    } else if (item.wasted_type === 'product' && item.wasted_id) {
      const prod = products.find((p: Product) => p.id === item.wasted_id);
      return prod ? Number(prod.cost_price) * item.quantity : 0;
    }
    return 0;
  };

  const estimatedTotal = items.reduce((sum, item) => sum + getItemCost(item), 0);

  // ── Submit ─────────────────────────────────────────

  const handlePreSubmit = () => {
    if (items.length === 0) { setError('Tambahkan minimal 1 item.'); return; }
    const invalidItems = items.filter((i: WasteLogItemInput) => !i.wasted_id || i.quantity <= 0);
    if (invalidItems.length) { setError('Lengkapi semua item limbah.'); return; }
    
    setError('');
    setShowConfirm(true);
  };

  const handleSubmit = async () => {
    setShowConfirm(false);
    setLoading(true);

    try {
      await createWasteLog({ logged_at: loggedAt, notes, items }, user?.name || 'Admin');
      onClose();
    } catch (err: any) {
      setError(err?.message ?? 'Terjadi kesalahan.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
        <div className="modal-content max-w-2xl w-full max-h-[90vh] flex flex-col">
          {/* ── Modal Header ── */}
          <div className="flex items-center justify-between p-5 border-b flex-shrink-0"
            style={{ borderColor: 'var(--color-border-light)' }}>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ background: 'rgb(239 68 68 / 0.12)' }}>
                <Trash2 className="w-4 h-4 text-red-400" />
              </div>
              <h2 className="text-base font-bold" style={{ color: 'var(--color-text-primary)' }}>
                Catat Limbah Baru
              </h2>
            </div>
          </div>

          {/* ── Body ── */}
          <div className="flex-1 overflow-y-auto p-5 space-y-5">
            {/* Meta */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Waktu Kejadian</label>
                <input
                  type="datetime-local"
                  value={loggedAt}
                  onChange={e => setLoggedAt(e.target.value)}
                  className="input w-full"
                />
              </div>
              <div>
                <label className="label">Catatan</label>
                <input
                  type="text"
                  placeholder="Opsional…"
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  className="input w-full"
                />
              </div>
            </div>

            {/* Items */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                  Item Limbah
                </p>
                <button onClick={addItem} className="btn btn-ghost btn-sm gap-1.5">
                  <Plus className="w-3.5 h-3.5" />
                  Tambah Item
                </button>
              </div>

              {items.length === 0 ? (
                <div className="border-2 border-dashed rounded-xl py-10 text-center"
                  style={{ borderColor: 'var(--color-border-light)' }}>
                  <Trash2 className="w-6 h-6 mx-auto mb-2" style={{ color: 'var(--color-text-muted)' }} />
                  <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
                    Belum ada item. Klik "+ Tambah Item".
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {items.map((item, idx) => {
                    const ing = item.wasted_type === 'ingredient'
                      ? ingredients.find((i: Ingredient) => i.id === item.wasted_id)
                      : null;
                    const prod = item.wasted_type === 'product'
                      ? products.find((p: Product) => p.id === item.wasted_id)
                      : null;

                    return (
                      <div key={idx} className="p-4 rounded-xl border space-y-3"
                        style={{ background: 'var(--color-bg-elevated)', borderColor: 'var(--color-border-light)' }}>
                        <div className="grid grid-cols-4 gap-3">
                          {/* Tipe */}
                          <div>
                            <label className="label text-[10px]">Tipe</label>
                            <select
                              value={item.wasted_type}
                              onChange={e => updateItem(idx, 'wasted_type', e.target.value as 'ingredient' | 'product')}
                              className="input w-full text-sm"
                            >
                              <option value="ingredient">Bahan Baku</option>
                              <option value="product">Produk Jadi</option>
                            </select>
                          </div>

                          {/* Item Selector */}
                          <div className="col-span-2">
                            <label className="label text-[10px]">
                              {item.wasted_type === 'ingredient' ? 'Bahan Baku' : 'Produk'}
                            </label>
                            {item.wasted_type === 'ingredient' ? (
                              <select
                                value={item.wasted_id || ''}
                                onChange={e => updateItem(idx, 'wasted_id', Number(e.target.value))}
                                className="input w-full text-sm"
                              >
                                <option value="">Pilih bahan baku…</option>
                                {ingredients.filter((i: Ingredient) => i.is_active).map((i: Ingredient) => (
                                  <option key={i.id} value={i.id}>
                                    {i.name} (stok: {i.stock} {i.unit})
                                  </option>
                                ))}
                              </select>
                            ) : (
                              <select
                                value={item.wasted_id || ''}
                                onChange={e => updateItem(idx, 'wasted_id', Number(e.target.value))}
                                className="input w-full text-sm"
                              >
                                <option value="">Pilih produk jadi…</option>
                                {products.filter((p: Product) => p.is_active).map((p: Product) => (
                                  <option key={p.id} value={p.id}>
                                    {p.name} (stok: {p.stock} {p.unit})
                                  </option>
                                ))}
                              </select>
                            )}
                          </div>

                          {/* Qty */}
                          <div>
                            <label className="label text-[10px]">
                              Qty {item.wasted_type === 'ingredient' ? ing && `(${ing.unit})` : prod && `(${prod.unit})`}
                            </label>
                            <input
                              type="number"
                              min="0.001"
                              step="0.001"
                              value={item.quantity}
                              onChange={e => updateItem(idx, 'quantity', Number(e.target.value))}
                              className="input w-full text-sm font-mono"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          {/* Alasan */}
                          <div>
                            <label className="label text-[10px]">Alasan</label>
                            <select
                              value={item.reason}
                              onChange={e => updateItem(idx, 'reason', e.target.value)}
                              className="input w-full text-sm"
                            >
                              {REASONS.map(r => (
                                <option key={r.value} value={r.value}>{r.label}</option>
                              ))}
                            </select>
                          </div>

                          {/* Detail Alasan */}
                          <div>
                            <label className="label text-[10px]">Detail (opsional)</label>
                            <input
                              type="text"
                              placeholder="Keterangan tambahan…"
                              value={item.reason_detail ?? ''}
                              onChange={e => updateItem(idx, 'reason_detail', e.target.value)}
                              className="input w-full text-sm"
                            />
                          </div>
                        </div>

                        {/* Cost Preview + Delete */}
                        <div className="flex items-center justify-between">
                          <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                            Estimasi kerugian:{' '}
                            <span className="font-semibold text-red-400 font-mono">
                              Rp {getItemCost(item).toLocaleString('id-ID')}
                            </span>
                          </p>
                          <button
                            onClick={() => removeItem(idx)}
                            className="btn btn-ghost btn-icon btn-xs text-red-400"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Error */}
            {error && (
              <div className="flex items-center gap-2 p-3 rounded-lg"
                style={{ background: 'rgb(239 68 68 / 0.1)', color: 'rgb(239 68 68)' }}>
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <p className="text-sm">{error}</p>
              </div>
            )}
          </div>

          {/* ── Footer ── */}
          <div className="flex items-center justify-between p-5 border-t flex-shrink-0"
            style={{ borderColor: 'var(--color-border-light)' }}>
            <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
              Total estimasi:{' '}
              <strong className="text-red-400 font-mono">
                Rp {estimatedTotal.toLocaleString('id-ID')}
              </strong>
            </p>
            <div className="flex gap-2">
              <button onClick={onClose} className="btn btn-ghost btn-sm" disabled={loading}>
                Batal
              </button>
              <button onClick={handlePreSubmit} className="btn btn-primary btn-sm" disabled={loading}>
                {loading ? 'Menyimpan…' : 'Simpan Log'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {showConfirm && (
        <ConfirmModal
          title="Konfirmasi Pengurangan Stok"
          message={
            <div className="space-y-3">
              <p>Menyimpan log limbah ini akan otomatis memotong stok barang di gudang:</p>
              <div className="bg-[var(--color-bg-elevated)] p-3.5 rounded-xl border space-y-2" style={{ borderColor: 'var(--color-border-light)' }}>
                {items.map((item, idx) => {
                  const name = item.wasted_type === 'ingredient'
                    ? ingredients.find(i => i.id === item.wasted_id)?.name
                    : products.find(p => p.id === item.wasted_id)?.name;
                  const unit = item.wasted_type === 'ingredient'
                    ? ingredients.find(i => i.id === item.wasted_id)?.unit
                    : products.find(p => p.id === item.wasted_id)?.unit || 'pcs';
                  return (
                    <div key={idx} className="flex justify-between text-sm">
                      <span style={{ color: 'var(--color-text-secondary)' }}>{name || `Item ID: ${item.wasted_id}`}</span>
                      <span className="font-semibold text-red-400">-{item.quantity} {unit}</span>
                    </div>
                  );
                })}
              </div>
              <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>Tindakan ini tidak dapat dibatalkan.</p>
            </div>
          }
          confirmLabel="Kurangi Stok & Simpan"
          variant="danger"
          onConfirm={handleSubmit}
          onCancel={() => setShowConfirm(false)}
        />
      )}
    </>
  );
}
