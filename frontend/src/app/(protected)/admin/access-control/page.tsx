'use client';

import { useState } from 'react';
import { useAuthStore } from '@/store/auth-store';
import { useUIStore } from '@/store/ui-store';
import { ShieldCheck, Save, Loader2, Info } from 'lucide-react';
import type { CashierPermissions } from '@/types';

interface PermissionGroup {
  title: string;
  description: string;
  items: { key: keyof CashierPermissions; label: string; help: string; type: 'toggle' | 'number' }[];
}

const PERMISSION_GROUPS: PermissionGroup[] = [
  {
    title: 'Aksi Transaksi',
    description: 'Kontrol apa yang bisa dilakukan kasir saat transaksi',
    items: [
      { key: 'can_apply_discount', label: 'Berikan diskon', help: 'Kasir dapat menerapkan diskon preset ke keranjang', type: 'toggle' },
      { key: 'can_apply_custom_discount', label: 'Diskon manual', help: 'Kasir dapat memasukkan nominal diskon secara manual', type: 'toggle' },
      { key: 'can_void_item', label: 'Void item', help: 'Kasir dapat menghapus item dari keranjang', type: 'toggle' },
      { key: 'can_void_transaction', label: 'Void transaksi', help: 'Kasir dapat membatalkan seluruh transaksi yang sudah selesai', type: 'toggle' },
      { key: 'can_process_refund', label: 'Proses refund', help: 'Kasir dapat memproses pengembalian dana', type: 'toggle' },
      { key: 'can_reprint_receipt', label: 'Cetak ulang struk', help: 'Kasir dapat mencetak ulang struk transaksi', type: 'toggle' },
      { key: 'can_edit_quantity', label: 'Edit jumlah', help: 'Kasir dapat mengubah kuantitas item secara manual', type: 'toggle' },
      { key: 'can_edit_price', label: 'Edit harga', help: 'Kasir dapat mengubah harga jual produk', type: 'toggle' },
      { key: 'can_hold_bill', label: 'Tahan bill', help: 'Kasir dapat menahan transaksi untuk dilanjutkan nanti', type: 'toggle' },
      { key: 'can_use_offline_mode', label: 'Mode offline', help: 'Kasir dapat bertransaksi saat koneksi terputus', type: 'toggle' },
    ],
  },
  {
    title: 'Visibilitas Data',
    description: 'Kontrol data apa yang dapat dilihat kasir',
    items: [
      { key: 'can_view_cost_price', label: 'Lihat harga beli', help: 'Kasir dapat melihat harga beli/modal produk', type: 'toggle' },
      { key: 'can_view_profit_margin', label: 'Lihat margin profit', help: 'Kasir dapat melihat persentase margin keuntungan', type: 'toggle' },
      { key: 'can_view_daily_omzet', label: 'Lihat omzet harian', help: 'Kasir dapat melihat total penjualan harian lengkap', type: 'toggle' },
      { key: 'can_view_own_shift_only', label: 'Hanya shift sendiri', help: 'Kasir hanya dapat melihat data shift miliknya', type: 'toggle' },
      { key: 'can_view_full_history', label: 'Lihat semua riwayat', help: 'Kasir dapat melihat riwayat transaksi semua kasir', type: 'toggle' },
      { key: 'can_view_own_history_only', label: 'Hanya riwayat sendiri', help: 'Kasir hanya dapat melihat transaksi yang dia proses', type: 'toggle' },
      { key: 'can_view_stock_levels', label: 'Lihat stok', help: 'Kasir dapat melihat jumlah stok tersedia', type: 'toggle' },
      { key: 'can_view_customer_profiles', label: 'Lihat profil pelanggan', help: 'Kasir dapat mengakses data pelanggan', type: 'toggle' },
    ],
  },
  {
    title: 'Kontrol Persetujuan (Admin PIN)',
    description: 'Aksi yang memerlukan PIN admin untuk dijalankan',
    items: [
      { key: 'discount_requires_pin', label: 'Diskon butuh PIN', help: 'Setiap pemberian diskon memerlukan verifikasi PIN admin', type: 'toggle' },
      { key: 'void_requires_pin', label: 'Void butuh PIN', help: 'Pembatalan transaksi memerlukan verifikasi PIN admin', type: 'toggle' },
      { key: 'refund_requires_pin', label: 'Refund butuh PIN', help: 'Pengembalian dana memerlukan verifikasi PIN admin', type: 'toggle' },
      { key: 'price_override_requires_pin', label: 'Ubah harga butuh PIN', help: 'Perubahan harga jual memerlukan verifikasi PIN admin', type: 'toggle' },
    ],
  },
  {
    title: 'Kontrol Sesi',
    description: 'Pengaturan keamanan sesi kasir',
    items: [
      { key: 'auto_logout_minutes', label: 'Auto-logout (menit)', help: 'Otomatis kunci layar setelah tidak ada aktivitas', type: 'number' },
      { key: 'quick_lock_enabled', label: 'Quick lock aktif', help: 'Kasir dapat mengunci layar dengan cepat', type: 'toggle' },
      { key: 'pin_required_to_unlock', label: 'PIN untuk buka kunci', help: 'Memerlukan PIN untuk membuka layar terkunci', type: 'toggle' },
    ],
  },
  {
    title: 'Perangkat & Cetak',
    description: 'Kontrol akses ke fitur perangkat keras',
    items: [
      { key: 'can_print_receipt', label: 'Cetak struk', help: 'Kasir dapat mencetak struk transaksi', type: 'toggle' },
      { key: 'can_open_cash_drawer', label: 'Buka laci kas', help: 'Kasir dapat membuka laci kas manual', type: 'toggle' },
      { key: 'can_use_scanner_override', label: 'Override scanner', help: 'Kasir dapat input barcode manual tanpa scanner', type: 'toggle' },
    ],
  },
];

export default function AccessControlPage() {
  const { cashierPermissions, updateCashierPermissions } = useAuthStore();
  const { addToast } = useUIStore();
  const [perms, setPerms] = useState<CashierPermissions>(cashierPermissions);
  const [saving, setSaving] = useState(false);

  const handleToggle = (key: keyof CashierPermissions) => {
    setPerms(p => ({ ...p, [key]: !p[key] } as CashierPermissions));
  };

  const handleNumber = (key: keyof CashierPermissions, value: number) => {
    setPerms(p => ({ ...p, [key]: value } as CashierPermissions));
  };

  const handleSave = async () => {
    setSaving(true);
    await new Promise(r => setTimeout(r, 1000));
    updateCashierPermissions(perms);
    setSaving(false);
    addToast('success', 'Izin kasir berhasil diperbarui', 'Perubahan akan berlaku segera');
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--color-text-primary)' }}>Akses Kontrol Kasir</h1>
          <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>Atur izin dan batasan untuk akun kasir</p>
        </div>
        <button onClick={handleSave} className="btn btn-primary" disabled={saving}>
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Simpan Perubahan
        </button>
      </div>

      <div className="p-4 rounded-xl flex items-start gap-3" style={{ background: 'var(--color-warning-light)' }}>
        <ShieldCheck className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: 'var(--color-warning)' }} />
        <div className="text-sm" style={{ color: 'var(--color-warning)' }}>
          <p className="font-semibold">Perhatian</p>
          <p>Perubahan pada izin kasir akan langsung berlaku setelah disimpan. Pastikan konfigurasi sesuai dengan kebijakan toko Anda.</p>
        </div>
      </div>

      <div className="space-y-6">
        {PERMISSION_GROUPS.map(group => (
          <div key={group.title} className="card overflow-hidden">
            <div className="p-4 border-b" style={{ background: 'var(--color-bg-elevated)', borderColor: 'var(--color-border-light)' }}>
              <h3 className="font-bold" style={{ color: 'var(--color-text-primary)' }}>{group.title}</h3>
              <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>{group.description}</p>
            </div>
            <div className="divide-y" style={{ borderColor: 'var(--color-border-light)' }}>
              {group.items.map(item => (
                <div key={item.key} className="flex items-center justify-between p-4 hover:bg-[var(--color-bg-elevated)] transition-colors">
                  <div className="flex-1 mr-4">
                    <p className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>{item.label}</p>
                    <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>{item.help}</p>
                  </div>
                  {item.type === 'toggle' ? (
                    <button onClick={() => handleToggle(item.key)} className="flex-shrink-0">
                      {(perms[item.key] as boolean) ? (
                        <div className="w-11 h-6 rounded-full flex items-center p-0.5 transition-colors" style={{ background: 'var(--color-accent)' }}>
                          <div className="w-5 h-5 rounded-full bg-white ml-auto shadow-sm transition-transform" />
                        </div>
                      ) : (
                        <div className="w-11 h-6 rounded-full flex items-center p-0.5 transition-colors" style={{ background: 'var(--color-border)' }}>
                          <div className="w-5 h-5 rounded-full bg-white shadow-sm transition-transform" />
                        </div>
                      )}
                    </button>
                  ) : (
                    <input
                      type="number"
                      value={perms[item.key] as number}
                      onChange={e => handleNumber(item.key, parseInt(e.target.value) || 0)}
                      className="input w-20 text-center tabular-nums text-sm"
                      min={1}
                      max={480}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
