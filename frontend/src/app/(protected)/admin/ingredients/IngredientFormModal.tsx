'use client';

import { useState, useEffect } from 'react';
import { X, FlaskConical, AlertCircle } from 'lucide-react';
import { useIngredientStore } from '@/store/ingredient-store';
import { getSuppliers } from '@/lib/firebase-service';
import type { Supplier } from '@/types';
import type { Ingredient, IngredientFormData } from '@/types/ingredient';

const UNITS = ['gram', 'kg', 'ml', 'liter', 'pcs', 'butir', 'sachet', 'lembar', 'botol', 'bungkus', 'buah'];

interface Props {
  ingredient?: Ingredient;
  onClose: () => void;
}

export function IngredientFormModal({ ingredient, onClose }: Props) {
  const { createIngredient, updateIngredient } = useIngredientStore();
  const isEdit = Boolean(ingredient);

  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [form, setForm] = useState<IngredientFormData>({
    name:             ingredient?.name ?? '',
    sku:              ingredient?.sku ?? '',
    unit:             ingredient?.unit ?? 'gram',
    cost_price:       ingredient?.cost_price ?? 0,
    min_stock:        ingredient?.min_stock ?? 0,
    stock:            ingredient?.stock ?? 0,
    expiry_date:      ingredient?.expiry_date ?? null,
    storage_location: ingredient?.storage_location ?? null,
    is_active:        ingredient?.is_active ?? true,
    category_id:      ingredient?.category_id ?? null,
    supplier_id:      ingredient?.supplier_id ?? null,
    supplier:         ingredient?.supplier ?? null,
    notes:            ingredient?.notes ?? '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');

  // Fetch suppliers
  useEffect(() => {
    getSuppliers()
      .then(setSuppliers)
      .catch(console.error);
  }, []);

  const set = <K extends keyof IngredientFormData>(key: K, value: IngredientFormData[K]) =>
    setForm(prev => ({ ...prev, [key]: value }));

  const handleSubmit = async () => {
    if (!form.name.trim()) { setError('Nama bahan baku wajib diisi.'); return; }
    if (!form.unit)        { setError('Satuan wajib dipilih.'); return; }
    if (form.cost_price < 0) { setError('Harga tidak boleh negatif.'); return; }

    setLoading(true);
    setError('');

    try {
      if (isEdit && ingredient) {
        await updateIngredient(ingredient.id, form);
      } else {
        await createIngredient(form);
      }
      onClose();
    } catch (err: any) {
      setError(err?.response?.data?.message ?? err?.message ?? 'Terjadi kesalahan.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-content max-w-lg w-full">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b"
          style={{ borderColor: 'var(--color-border-light)' }}>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center"
               style={{ background: 'var(--color-accent)', opacity: 0.9 }}>
              <FlaskConical className="w-4 h-4 text-white" />
            </div>
            <h2 className="text-base font-bold" style={{ color: 'var(--color-text-primary)' }}>
              {isEdit ? 'Edit Bahan Baku' : 'Tambah Bahan Baku'}
            </h2>
          </div>
          <button onClick={onClose} className="btn btn-ghost btn-icon btn-sm">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4">
          {/* Nama & SKU */}
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 sm:col-span-1">
              <label className="label">Nama Bahan Baku <span className="text-red-400">*</span></label>
              <input
                type="text"
                value={form.name}
                onChange={e => set('name', e.target.value)}
                placeholder="cth. Mie Kering"
                className="input w-full"
              />
            </div>
            <div>
              <label className="label">SKU <span className="text-[10px] text-[var(--color-text-muted)]">(auto jika kosong)</span></label>
              <input
                type="text"
                value={form.sku ?? ''}
                onChange={e => set('sku', e.target.value)}
                placeholder="ING-XXXX"
                className="input w-full"
              />
            </div>
          </div>

          {/* Satuan & Harga */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Satuan <span className="text-red-400">*</span></label>
              <select
                value={form.unit}
                onChange={e => set('unit', e.target.value)}
                className="input w-full"
              >
                {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Harga Beli / Unit (Rp) <span className="text-red-400">*</span></label>
              <input
                type="number"
                min="0"
                value={form.cost_price}
                onChange={e => set('cost_price', Number(e.target.value))}
                className="input w-full"
              />
            </div>
          </div>

          {/* Stok Awal & Min Stok */}
          {!isEdit && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Stok Awal</label>
                <input
                  type="number"
                  min="0"
                  step="0.001"
                  value={form.stock ?? 0}
                  onChange={e => set('stock', Number(e.target.value))}
                  className="input w-full"
                />
              </div>
              <div>
                <label className="label">Min. Stok (alert)</label>
                <input
                  type="number"
                  min="0"
                  step="0.001"
                  value={form.min_stock ?? 0}
                  onChange={e => set('min_stock', Number(e.target.value))}
                  className="input w-full"
                />
              </div>
            </div>
          )}

          {/* Expiry & Lokasi */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Tanggal Kadaluarsa</label>
              <input
                type="date"
                value={form.expiry_date ?? ''}
                onChange={e => set('expiry_date', e.target.value || null)}
                className="input w-full"
              />
            </div>
            <div>
              <label className="label">Lokasi Penyimpanan</label>
              <input
                type="text"
                value={form.storage_location ?? ''}
                onChange={e => set('storage_location', e.target.value || null)}
                placeholder="cth. Gudang B Rak 3"
                className="input w-full"
              />
            </div>
          </div>

          {/* Supplier & Catatan */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Supplier</label>
              <select
                value={form.supplier_id ?? ''}
                onChange={e => {
                  const val = e.target.value ? Number(e.target.value) : null;
                  const selectedSup = suppliers.find(s => s.id === val);
                  setForm(prev => ({
                    ...prev,
                    supplier_id: val,
                    supplier: selectedSup ? { id: selectedSup.id, name: selectedSup.name } : null
                  }));
                }}
                className="input w-full"
              >
                <option value="">Pilih Supplier</option>
                {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Catatan</label>
              <textarea
                value={form.notes ?? ''}
                onChange={e => set('notes', e.target.value)}
                placeholder="Catatan tambahan (opsional)..."
                className="input w-full h-[38px] py-1 resize-none"
              />
            </div>
          </div>

          {/* Status */}
          <div className="flex items-center gap-3">
            <input
              id="ing-active"
              type="checkbox"
              checked={form.is_active}
              onChange={e => set('is_active', e.target.checked)}
              className="w-4 h-4 rounded"
            />
            <label htmlFor="ing-active" className="text-sm cursor-pointer"
              style={{ color: 'var(--color-text-secondary)' }}>
              Bahan baku aktif
            </label>
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

        {/* Footer */}
        <div className="flex justify-end gap-2 px-5 pb-5">
          <button onClick={onClose} className="btn btn-ghost btn-sm" disabled={loading}>Batal</button>
          <button onClick={handleSubmit} className="btn btn-primary btn-sm" disabled={loading}>
            {loading ? 'Menyimpan…' : isEdit ? 'Simpan Perubahan' : 'Tambah Bahan Baku'}
          </button>
        </div>
      </div>
    </div>
  );
}
