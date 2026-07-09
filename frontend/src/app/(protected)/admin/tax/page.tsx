'use client';

import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Calculator, Save, Loader2, ToggleLeft, ToggleRight, Info } from 'lucide-react';
import { useUIStore } from '@/store/ui-store';
import { apiClient } from '@/lib/api-client';
import type { TaxConfig } from '@/types';

export default function TaxPage() {
  const { addToast } = useUIStore();
  const [configs, setConfigs] = useState<TaxConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    apiClient.get<{ success: boolean; data: TaxConfig[] }>('/tax-configs')
      .then(res => {
        if (res.data.success) {
          setConfigs(res.data.data);
        }
      })
      .catch(err => {
        console.error(err);
        addToast('error', 'Gagal memuat konfigurasi pajak');
      })
      .finally(() => setLoading(false));
  }, [addToast]);

  const handleToggle = (id: number) => {
    setConfigs(cs => cs.map(c => c.id === id ? { ...c, is_active: !c.is_active } : c));
  };

  const handleRateChange = (id: number, rate: number) => {
    setConfigs(cs => cs.map(c => c.id === id ? { ...c, rate } : c));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await Promise.all(
        configs.map(c =>
          apiClient.put(`/tax-configs/${c.id}`, {
            rate: c.rate,
            is_active: c.is_active,
            is_inclusive: c.is_inclusive,
            apply_before_discount: c.apply_before_discount,
            label: c.label
          })
        )
      );
      addToast('success', 'Konfigurasi pajak disimpan');
    } catch (err) {
      console.error(err);
      addToast('error', 'Gagal menyimpan konfigurasi pajak');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--color-text-primary)' }}>Pajak & Service Charge</h1>
          <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>Konfigurasi pajak dan biaya layanan</p>
        </div>
        <button onClick={handleSave} className="btn btn-primary" disabled={saving || loading}>
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Simpan
        </button>
      </div>

      <div className="p-4 rounded-xl flex items-start gap-3" style={{ background: 'var(--color-info-light)' }}>
        <Info className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: 'var(--color-info)' }} />
        <div className="text-sm" style={{ color: 'var(--color-info)' }}>
          <p className="font-semibold">Catatan Penting</p>
          <p>Perubahan pajak akan langsung mempengaruhi perhitungan checkout di kasir. Pastikan tarif sesuai dengan peraturan yang berlaku.</p>
        </div>
      </div>

      {loading ? (
        <div className="card p-12 flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin" style={{ color: 'var(--color-accent)' }} />
          <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>Memuat konfigurasi pajak...</p>
        </div>
      ) : (
        <div className="space-y-4">
          {configs.map(tax => (
            <div key={tax.id} className={cn('card p-6', !tax.is_active && 'opacity-60')}>
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ background: tax.is_active ? 'var(--color-accent-light)' : 'var(--color-bg-elevated)' }}>
                    <Calculator className="w-7 h-7" style={{ color: tax.is_active ? 'var(--color-accent)' : 'var(--color-text-muted)' }} />
                  </div>
                  <div>
                    <p className="text-lg font-bold" style={{ color: 'var(--color-text-primary)' }}>{tax.name}</p>
                    <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
                      {tax.type === 'vat' ? 'Pajak Pertambahan Nilai' : tax.type === 'restaurant' ? 'Pajak Restoran / PB1' : 'Biaya Layanan'}
                    </p>
                  </div>
                </div>
                <button onClick={() => handleToggle(tax.id)} className="btn btn-ghost btn-icon">
                  {tax.is_active ? <ToggleRight className="w-6 h-6" style={{ color: 'var(--color-success)' }} /> : <ToggleLeft className="w-6 h-6" style={{ color: 'var(--color-text-muted)' }} />}
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium mb-1" style={{ color: 'var(--color-text-secondary)' }}>Tarif (%)</label>
                  <input type="number" value={tax.rate} onChange={e => handleRateChange(tax.id, parseFloat(e.target.value) || 0)} className="input text-lg font-bold tabular-nums text-center" min={0} max={100} step={0.5} />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1" style={{ color: 'var(--color-text-secondary)' }}>Label di Struk</label>
                  <input type="text" value={tax.label} onChange={e => setConfigs(cs => cs.map(c => c.id === tax.id ? { ...c, label: e.target.value } : c))} className="input" />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1" style={{ color: 'var(--color-text-secondary)' }}>Urutan Kalkulasi</label>
                  <select value={tax.apply_before_discount ? 'before' : 'after'} onChange={e => setConfigs(cs => cs.map(c => c.id === tax.id ? { ...c, apply_before_discount: e.target.value === 'before' } : c))} className="input">
                    <option value="after">Setelah Diskon</option>
                    <option value="before">Sebelum Diskon</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-4 mt-4 pt-4 border-t text-sm" style={{ borderColor: 'var(--color-border-light)' }}>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={tax.is_inclusive} onChange={e => setConfigs(cs => cs.map(c => c.id === tax.id ? { ...c, is_inclusive: e.target.checked } : c))} className="w-4 h-4 rounded" />
                  <span style={{ color: 'var(--color-text-secondary)' }}>Harga sudah termasuk pajak (inklusif)</span>
                </label>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
