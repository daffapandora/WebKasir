'use client';

import { useState } from 'react';
import { X, PackagePlus, AlertCircle, Info } from 'lucide-react';
import { useIngredientStore } from '@/store/ingredient-store';
import type { Ingredient, StockInData } from '@/types/ingredient';

interface Props {
  ingredient: Ingredient;
  onClose: () => void;
}

export function StockInModal({ ingredient, onClose }: Props) {
  const { stockIn } = useIngredientStore();

  const [form, setForm] = useState<StockInData>({
    quantity:  0,
    unit_cost: ingredient.cost_price,
    reference: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');

  const newAvgPreview = (() => {
    const oldStock  = ingredient.stock;
    const oldAvg    = ingredient.avg_cost_price;
    const totalStock = oldStock + form.quantity;
    if (totalStock <= 0 || form.quantity <= 0) return ingredient.avg_cost_price;
    return (oldStock * oldAvg + form.quantity * form.unit_cost) / totalStock;
  })();

  const handleSubmit = async () => {
    if (form.quantity <= 0)  { setError('Jumlah harus lebih dari 0.'); return; }
    if (form.unit_cost < 0) { setError('Harga beli tidak boleh negatif.'); return; }

    setLoading(true);
    setError('');

    try {
      await stockIn(ingredient.id, form);
      onClose();
    } catch (err: any) {
      setError(err?.response?.data?.message ?? err?.message ?? 'Terjadi kesalahan.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-content max-w-md w-full">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b"
          style={{ borderColor: 'var(--color-border-light)' }}>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ background: 'rgb(16 185 129 / 0.15)' }}>
              <PackagePlus className="w-4 h-4 text-emerald-400" />
            </div>
            <div>
              <h2 className="text-base font-bold" style={{ color: 'var(--color-text-primary)' }}>
                Penerimaan Stok
              </h2>
              <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
                {ingredient.name}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="btn btn-ghost btn-icon btn-sm">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4">
          {/* Current Stock Info */}
          <div className="flex items-center gap-3 p-3 rounded-lg"
            style={{ background: 'var(--color-bg-elevated)' }}>
            <Info className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--color-text-muted)' }} />
            <div className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
              Stok saat ini:{' '}
              <strong>{ingredient.stock.toLocaleString('id-ID', { maximumFractionDigits: 3 })} {ingredient.unit}</strong>
              {' '} · Avg cost: <strong>Rp {Number(ingredient.avg_cost_price).toLocaleString('id-ID')}</strong>
            </div>
          </div>

          {/* Jumlah Masuk */}
          <div>
            <label className="label">Jumlah Masuk ({ingredient.unit}) <span className="text-red-400">*</span></label>
            <input
              type="number"
              min="0.001"
              step="0.001"
              value={form.quantity || ''}
              onChange={e => setForm(f => ({ ...f, quantity: Number(e.target.value) }))}
              placeholder="0"
              className="input w-full text-lg font-mono"
            />
          </div>

          {/* Harga Beli */}
          <div>
            <label className="label">Harga Beli / Unit (Rp) <span className="text-red-400">*</span></label>
            <input
              type="number"
              min="0"
              value={form.unit_cost || ''}
              onChange={e => setForm(f => ({ ...f, unit_cost: Number(e.target.value) }))}
              className="input w-full font-mono"
            />
          </div>

          {/* Nomor Referensi */}
          <div>
            <label className="label">Referensi (No. PO / Faktur)</label>
            <input
              type="text"
              value={form.reference ?? ''}
              onChange={e => setForm(f => ({ ...f, reference: e.target.value }))}
              placeholder="PO-2026-001"
              className="input w-full"
            />
          </div>

          {/* Avg Cost Preview */}
          {form.quantity > 0 && (
            <div className="p-3 rounded-lg border" style={{
              background: 'rgb(16 185 129 / 0.06)',
              borderColor: 'rgb(16 185 129 / 0.25)'
            }}>
              <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                Setelah penerimaan ini:
              </p>
              <div className="flex items-center justify-between mt-1">
                <span className="text-sm font-medium text-emerald-400">
                  Stok baru: {(ingredient.stock + form.quantity).toLocaleString('id-ID', { maximumFractionDigits: 3 })} {ingredient.unit}
                </span>
                <span className="text-sm font-medium" style={{ color: 'var(--color-text-secondary)' }}>
                  Avg cost baru: Rp {Math.round(newAvgPreview).toLocaleString('id-ID')}
                </span>
              </div>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="flex items-center gap-2 p-3 rounded-lg"
              style={{ background: 'rgb(239 68 68 / 0.1)', color: 'rgb(239 68 68)' }}>
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <p className="text-sm">{error}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 px-5 pb-5">
          <button onClick={onClose} className="btn btn-ghost btn-sm" disabled={loading}>Batal</button>
          <button onClick={handleSubmit} className="btn btn-sm gap-2" disabled={loading}
            style={{ background: 'rgb(16 185 129)', color: 'white' }}>
            <PackagePlus className="w-3.5 h-3.5" />
            {loading ? 'Menyimpan…' : 'Tambah Stok'}
          </button>
        </div>
      </div>
    </div>
  );
}
