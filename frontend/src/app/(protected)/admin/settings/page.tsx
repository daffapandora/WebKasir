'use client';

import { useState, useEffect } from 'react';
import { Settings, Save, Loader2, Store, Printer, Bell, Database, Moon, Sun, Download, Upload, Shield, Clock, CheckCircle2 } from 'lucide-react';
import { useUIStore } from '@/store/ui-store';
import { exportAllData, importData } from '@/lib/firebase-service';
import { ConfirmModal } from '@/components/shared/confirm-modal';

export default function SettingsPage() {
  const { addToast, theme, toggleTheme } = useUIStore();
  const [saving, setSaving] = useState(false);
  const [storeName, setStoreName] = useState('TokoPOS');
  const [storeAddress, setStoreAddress] = useState('Jl. Sudirman No. 123, Jakarta Pusat');
  const [storePhone, setStorePhone] = useState('021-5551234');
  const [receiptFooter, setReceiptFooter] = useState('Terima kasih atas kunjungan Anda!');

  // A1: Backup state
  const [backupLoading, setBackupLoading] = useState(false);
  const [restoreLoading, setRestoreLoading] = useState(false);
  const [lastBackup, setLastBackup] = useState<string | null>(null);
  const [showRestoreConfirm, setShowRestoreConfirm] = useState(false);
  const [pendingRestoreFile, setPendingRestoreFile] = useState<File | null>(null);

  useEffect(() => {
    setLastBackup(localStorage.getItem('tokopos_last_backup'));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    await new Promise(r => setTimeout(r, 1000));
    // Save store settings to localStorage
    localStorage.setItem('tokopos_settings', JSON.stringify({
      storeName, storeAddress, storePhone, receiptFooter
    }));
    setSaving(false);
    addToast('success', 'Pengaturan disimpan');
  };

  // A1: Backup — Export all Firestore data to JSON
  const handleBackup = async () => {
    setBackupLoading(true);
    try {
      const data = await exportAllData();
      const json = JSON.stringify(data, null, 2);
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `tokopos-backup-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);

      const now = new Date().toISOString();
      localStorage.setItem('tokopos_last_backup', now);
      setLastBackup(now);
      addToast('success', 'Backup berhasil diunduh', 'File JSON telah disimpan');
    } catch (err) {
      console.error(err);
      addToast('error', 'Gagal membuat backup');
    } finally {
      setBackupLoading(false);
    }
  };

  // A1: Restore — Import JSON data
  const handleRestoreSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.name.endsWith('.json')) {
      addToast('warning', 'Format file tidak valid', 'Gunakan file .json dari backup TokoPOS');
      return;
    }
    setPendingRestoreFile(file);
    setShowRestoreConfirm(true);
  };

  const executeRestore = async () => {
    if (!pendingRestoreFile) return;
    setRestoreLoading(true);
    setShowRestoreConfirm(false);
    try {
      const text = await pendingRestoreFile.text();
      const data = JSON.parse(text);
      const count = await importData(data);
      addToast('success', 'Data berhasil direstore', `${count} record berhasil diimport`);
    } catch (err) {
      console.error(err);
      addToast('error', 'Gagal merestore data', 'Pastikan file JSON valid');
    } finally {
      setRestoreLoading(false);
      setPendingRestoreFile(null);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold" style={{ color: 'var(--color-text-primary)' }}>Pengaturan</h1><p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>Konfigurasi umum aplikasi</p></div>
        <button onClick={handleSave} className="btn btn-primary" disabled={saving}>
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Simpan
        </button>
      </div>

      {/* Store Profile */}
      <div className="card p-5">
        <h3 className="font-semibold mb-4 flex items-center gap-2" style={{ color: 'var(--color-text-primary)' }}><Store className="w-5 h-5" /> Profil Toko</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div><label className="block text-xs font-medium mb-1" style={{ color: 'var(--color-text-secondary)' }}>Nama Toko</label><input type="text" value={storeName} onChange={e => setStoreName(e.target.value)} className="input" /></div>
          <div><label className="block text-xs font-medium mb-1" style={{ color: 'var(--color-text-secondary)' }}>Telepon</label><input type="text" value={storePhone} onChange={e => setStorePhone(e.target.value)} className="input" /></div>
          <div className="sm:col-span-2"><label className="block text-xs font-medium mb-1" style={{ color: 'var(--color-text-secondary)' }}>Alamat</label><textarea value={storeAddress} onChange={e => setStoreAddress(e.target.value)} className="input" rows={2} /></div>
        </div>
      </div>

      {/* Receipt */}
      <div className="card p-5">
        <h3 className="font-semibold mb-4 flex items-center gap-2" style={{ color: 'var(--color-text-primary)' }}><Printer className="w-5 h-5" /> Template Struk</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2"><label className="block text-xs font-medium mb-1" style={{ color: 'var(--color-text-secondary)' }}>Pesan Footer Struk</label><input type="text" value={receiptFooter} onChange={e => setReceiptFooter(e.target.value)} className="input" /></div>
          <div>
            <label className="flex items-center gap-2 cursor-pointer text-sm" style={{ color: 'var(--color-text-secondary)' }}>
              <input type="checkbox" defaultChecked className="w-4 h-4 rounded" /> Tampilkan logo di struk
            </label>
          </div>
          <div>
            <label className="flex items-center gap-2 cursor-pointer text-sm" style={{ color: 'var(--color-text-secondary)' }}>
              <input type="checkbox" defaultChecked className="w-4 h-4 rounded" /> Auto-print setelah bayar
            </label>
          </div>
        </div>
      </div>

      {/* Appearance */}
      <div className="card p-5">
        <h3 className="font-semibold mb-4 flex items-center gap-2" style={{ color: 'var(--color-text-primary)' }}>{theme === 'light' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />} Tampilan</h3>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>Mode Gelap</p>
            <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>Nyaman untuk penggunaan shift malam</p>
          </div>
          <button onClick={toggleTheme} className="flex-shrink-0">
            {theme === 'dark' ? (
              <div className="w-11 h-6 rounded-full flex items-center p-0.5" style={{ background: 'var(--color-accent)' }}><div className="w-5 h-5 rounded-full bg-white ml-auto shadow-sm" /></div>
            ) : (
              <div className="w-11 h-6 rounded-full flex items-center p-0.5" style={{ background: 'var(--color-border)' }}><div className="w-5 h-5 rounded-full bg-white shadow-sm" /></div>
            )}
          </button>
        </div>
      </div>

      {/* A1: Backup & Restore — Fully Functional */}
      <div className="card p-5">
        <h3 className="font-semibold mb-4 flex items-center gap-2" style={{ color: 'var(--color-text-primary)' }}><Database className="w-5 h-5" /> Data & Backup</h3>

        {/* Status Bar */}
        <div className="flex items-center gap-3 p-3 rounded-lg mb-4" style={{ background: lastBackup ? 'rgb(34 197 94 / 0.08)' : 'rgb(239 68 68 / 0.08)' }}>
          {lastBackup ? (
            <>
              <CheckCircle2 className="w-5 h-5 flex-shrink-0" style={{ color: 'var(--color-success)' }} />
              <div>
                <p className="text-sm font-medium" style={{ color: 'var(--color-success)' }}>Backup terakhir berhasil</p>
                <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                  {new Date(lastBackup).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </>
          ) : (
            <>
              <Shield className="w-5 h-5 flex-shrink-0" style={{ color: 'var(--color-danger)' }} />
              <div>
                <p className="text-sm font-medium" style={{ color: 'var(--color-danger)' }}>Belum pernah backup</p>
                <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>Segera buat backup untuk melindungi data Anda</p>
              </div>
            </>
          )}
        </div>

        <div className="flex gap-3">
          <button onClick={handleBackup} disabled={backupLoading} className="btn btn-primary flex-1">
            {backupLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            {backupLoading ? 'Membuat Backup...' : 'Backup Sekarang'}
          </button>
          <label className={`btn btn-outline flex-1 cursor-pointer ${restoreLoading ? 'opacity-50' : ''}`}>
            {restoreLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
            {restoreLoading ? 'Memulihkan...' : 'Restore dari File'}
            <input type="file" accept=".json" onChange={handleRestoreSelect} className="hidden" disabled={restoreLoading} />
          </label>
        </div>
        <p className="text-xs mt-3" style={{ color: 'var(--color-text-muted)' }}>
          Backup mencakup: Produk, Kategori, Pelanggan, Transaksi, Karyawan, Diskon, Stok, Audit Log
        </p>
      </div>

      {/* Restore Confirmation */}
      {showRestoreConfirm && (
        <ConfirmModal
          title="Restore Data?"
          message={`File "${pendingRestoreFile?.name}" akan menimpa data yang ada. Pastikan Anda sudah membuat backup terlebih dahulu. Tindakan ini tidak dapat dibatalkan.`}
          confirmLabel="Restore Sekarang"
          variant="warning"
          onConfirm={executeRestore}
          onCancel={() => { setShowRestoreConfirm(false); setPendingRestoreFile(null); }}
        />
      )}
    </div>
  );
}
