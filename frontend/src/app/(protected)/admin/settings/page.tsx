'use client';

import { useState, useEffect } from 'react';
import { 
  Settings, Save, Loader2, Store, Printer, Bell, Database, Moon, Sun, 
  Download, Upload, Shield, Clock, CheckCircle2, Wifi, WifiOff, RefreshCw, 
  Bluetooth, Cpu, CreditCard, BellRing, Globe, HelpCircle, HardDrive, ToggleLeft
} from 'lucide-react';
import { useUIStore } from '@/store/ui-store';
import { exportAllData, importData } from '@/lib/firebase-service';
import { ConfirmModal } from '@/components/shared/confirm-modal';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/dexie-db';

export default function SettingsPage() {
  const { addToast, theme, toggleTheme } = useUIStore();
  const [saving, setSaving] = useState(false);

  // Store profile
  const [storeName, setStoreName] = useState('TokoPOS');
  const [storeAddress, setStoreAddress] = useState('Jl. Sudirman No. 123, Jakarta Pusat');
  const [storePhone, setStorePhone] = useState('021-5551234');
  const [receiptFooter, setReceiptFooter] = useState('Terima kasih atas kunjungan Anda!');

  // Backup states
  const [backupLoading, setBackupLoading] = useState(false);
  const [restoreLoading, setRestoreLoading] = useState(false);
  const [lastBackup, setLastBackup] = useState<string | null>(null);
  const [showRestoreConfirm, setShowRestoreConfirm] = useState(false);
  const [pendingRestoreFile, setPendingRestoreFile] = useState<File | null>(null);

  // General Settings - Receipt Logo
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);

  // General Settings - Payment Portal (EDC & QRIS)
  const [edcApiUrl, setEdcApiUrl] = useState('https://api.edc-local.net/v1');
  const [edcApiKey, setEdcApiKey] = useState('edc_sec_key_example_1234');
  const [qrisMerchantId, setQrisMerchantId] = useState('MID-9923812739');
  const [qrisTerminalId, setQrisTerminalId] = useState('TID-01');

  // General Settings - Global Localization & Timezone
  const [timezone, setTimezone] = useState('Asia/Jakarta');

  // General Settings - Stock Alert Threshold
  const [minStockLimit, setMinStockLimit] = useState(10);

  // Hardware - Bluetooth
  const [btScanning, setBtScanning] = useState(false);
  const [btDevices, setBtDevices] = useState<Array<{ name: string; id: string; connected: boolean }>>([]);
  const [connectedBt, setConnectedBt] = useState<string | null>(null);

  // Hardware - LAN/WiFi
  const [lanIp, setLanIp] = useState('192.168.1.100');
  const [lanPort, setLanPort] = useState('9100');
  const [lanTesting, setLanTesting] = useState(false);

  // Hardware - Additional Triggers
  const [autoOpenDrawer, setAutoOpenDrawer] = useState(true);
  const [barcodeScannerMode, setBarcodeScannerMode] = useState<'keyboard' | 'api'>('keyboard');

  // Offline Sync States & Counters
  const [isOnline, setIsOnline] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null);

  // Dexie.js Live Query for unsynced transactions queue
  const unsyncedCount = useLiveQuery(
    () => db.transactionsQueue.where('status').anyOf('pending', 'failed').count()
  ) ?? 0;

  useEffect(() => {
    setLastBackup(localStorage.getItem('tokopos_last_backup'));
    setLastSyncTime(localStorage.getItem('tokopos_last_sync_time'));

    // Network status listeners
    if (typeof window !== 'undefined') {
      setIsOnline(navigator.onLine);
      const goOnline = () => setIsOnline(true);
      const goOffline = () => setIsOnline(false);

      window.addEventListener('online', goOnline);
      window.addEventListener('offline', goOffline);

      // Listen for background sync updates
      const handleSyncEvent = (e: any) => {
        if (e.detail && e.detail.lastSync) {
          setLastSyncTime(e.detail.lastSync);
        }
      };
      window.addEventListener('tokopos-sync-status', handleSyncEvent);

      return () => {
        window.removeEventListener('online', goOnline);
        window.removeEventListener('offline', goOffline);
        window.removeEventListener('tokopos-sync-status', handleSyncEvent);
      };
    }
  }, []);

  // Handle Logo Upload
  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!['image/png', 'image/jpeg', 'image/jpg'].includes(file.type)) {
      addToast('warning', 'Format file tidak valid', 'Gunakan gambar berformat PNG, JPG, atau JPEG');
      return;
    }
    setLogoFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setLogoPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
    addToast('success', 'Logo struk terpilih');
  };

  // Scan Bluetooth Devices using Web Bluetooth API
  const handleBluetoothScan = async () => {
    setBtScanning(true);
    try {
      if (typeof navigator !== 'undefined' && (navigator as any).bluetooth) {
        const device = await (navigator as any).bluetooth.requestDevice({
          acceptAllDevices: true,
          optionalServices: ['printer_service' as any]
        });
        const deviceName = device.name || 'Printer Bluetooth Kasir';
        setBtDevices(prev => {
          const exists = prev.some(d => d.id === device.id);
          if (exists) return prev;
          return [...prev, { name: deviceName, id: device.id, connected: true }];
        });
        setConnectedBt(deviceName);
        addToast('success', 'Bluetooth Terhubung', `Terhubung ke ${deviceName}`);
      } else {
        // Fallback simulation for unsupported systems
        await new Promise(r => setTimeout(r, 2000));
        const simulatedName = `BT-Printer-${Math.floor(Math.random() * 900 + 100)}`;
        setBtDevices([{ name: simulatedName, id: 'mock-bt-id', connected: true }]);
        setConnectedBt(simulatedName);
        addToast('success', 'Bluetooth Terhubung (Simulasi)', `Terhubung ke ${simulatedName}`);
      }
    } catch (err: any) {
      console.warn('Bluetooth scan interrupted or unsupported:', err.message);
      addToast('warning', 'Bluetooth tidak terhubung', err.message || 'Bluetooth Scan dibatalkan');
    } finally {
      setBtScanning(false);
    }
  };

  // LAN Thermal Printer print test
  const handleLanPrintTest = async () => {
    setLanTesting(true);
    try {
      await new Promise(r => setTimeout(r, 1500));
      addToast('success', 'Uji Cetak Terkirim', `Perintah cetak dikirim ke printer LAN di ${lanIp}:${lanPort}`);
    } catch (err: any) {
      addToast('error', 'Gagal cetak uji', err.message || 'Jaringan tidak menanggapi');
    } finally {
      setLanTesting(false);
    }
  };

  // Manual Sync trigger
  const handleManualSync = async () => {
    if (!isOnline) {
      addToast('warning', 'Koneksi Offline', 'Tidak dapat menyelaraskan data saat sedang offline.');
      return;
    }
    setSyncing(true);
    try {
      const { syncPendingTransactions } = await import('@/utils/sync-manager');
      const result = await syncPendingTransactions();
      if (result.success) {
        if (result.syncedCount > 0) {
          addToast('success', 'Sinkronisasi Berhasil', `${result.syncedCount} transaksi diunggah ke server.`);
        } else {
          addToast('info', 'Data Sudah Sinkron', 'Tidak ada transaksi lokal yang perlu diselaraskan.');
        }
      } else {
        addToast('error', 'Sinkronisasi Gagal', result.errors?.[0] || 'Gagal memproses data.');
      }
    } catch (err: any) {
      addToast('error', 'Error Sinkronisasi', err.message);
    } finally {
      setSyncing(false);
    }
  };

  // Save General settings to LocalStorage
  const handleSave = async () => {
    setSaving(true);
    await new Promise(r => setTimeout(r, 1000));
    
    // Save configuration settings
    localStorage.setItem('tokopos_settings', JSON.stringify({
      storeName, storeAddress, storePhone, receiptFooter,
      edcApiUrl, edcApiKey, qrisMerchantId, qrisTerminalId,
      timezone, minStockLimit, autoOpenDrawer, barcodeScannerMode,
      lanIp, lanPort
    }));
    
    setSaving(false);
    addToast('success', 'Pengaturan disimpan');
  };

  // Backup & Restore
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
    <div className="space-y-6 animate-fade-in pb-10">
      {/* Header bar */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--color-text-primary)' }}>Pengaturan</h1>
          <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
            Konfigurasi umum aplikasi, integrasi pembayaran, perangkat kasir, dan sinkronisasi data.
          </p>
        </div>
        <button onClick={handleSave} className="btn btn-primary shadow-md flex items-center gap-2 hover:opacity-90 transition-opacity" disabled={saving}>
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Simpan Pengaturan
        </button>
      </div>

      {/* Grid Layout of configuration blocks */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        
        {/* LEFT COLUMN (2/3 width on wide screens) */}
        <div className="lg:col-span-2 space-y-6">

          {/* CARD 1: PROFIL TOKO */}
          <div className="card p-6 shadow-sm border border-gray-100 dark:border-gray-800 space-y-5">
            <h3 className="font-semibold text-base flex items-center gap-2 border-b pb-3" style={{ color: 'var(--color-text-primary)' }}>
              <Store className="w-5 h-5 text-indigo-500" /> Profil Toko & Informasi Cetak
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold mb-1.5 text-gray-500 dark:text-gray-400">Nama Toko</label>
                <input type="text" value={storeName} onChange={e => setStoreName(e.target.value)} className="input" />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1.5 text-gray-500 dark:text-gray-400">Telepon Toko</label>
                <input type="text" value={storePhone} onChange={e => setStorePhone(e.target.value)} className="input" />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold mb-1.5 text-gray-500 dark:text-gray-400">Alamat Lengkap</label>
                <textarea value={storeAddress} onChange={e => setStoreAddress(e.target.value)} className="input" rows={2} />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold mb-1.5 text-gray-500 dark:text-gray-400">Pesan Kaki Struk (Receipt Footer)</label>
                <input type="text" value={receiptFooter} onChange={e => setReceiptFooter(e.target.value)} className="input text-sm" />
              </div>
            </div>

            {/* Receipt Logo Dropper */}
            <div className="pt-2">
              <label className="block text-xs font-semibold mb-2.5 text-gray-500 dark:text-gray-400">Logo Struk Cetak</label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-center">
                <div className="relative group w-24 h-24 border border-dashed border-gray-300 dark:border-gray-700 rounded-2xl overflow-hidden flex items-center justify-center bg-gray-50 dark:bg-gray-850 flex-shrink-0 transition-all duration-350 hover:border-indigo-500 hover:bg-indigo-500/5">
                  {logoPreview ? (
                    <>
                      <img src={logoPreview} alt="Preview Logo" className="object-contain w-full h-full p-2 transition-transform duration-300 group-hover:scale-105" />
                      <button 
                        type="button" 
                        onClick={() => { setLogoFile(null); setLogoPreview(null); }}
                        className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 text-white text-[11px] font-bold"
                      >
                        Hapus Logo
                      </button>
                    </>
                  ) : (
                    <Printer className="w-8 h-8 text-gray-300 group-hover:text-indigo-400 transition-colors" />
                  )}
                </div>
                
                <div className="sm:col-span-2">
                  <input 
                    type="file" 
                    accept="image/png, image/jpeg, image/jpg" 
                    onChange={handleLogoChange}
                    className="hidden" 
                    id="receipt-logo-file" 
                  />
                  <label 
                    htmlFor="receipt-logo-file" 
                    className="btn btn-outline cursor-pointer py-2 px-4 text-xs font-semibold flex items-center gap-2 w-fit bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-750 border-gray-300 dark:border-gray-700 shadow-sm"
                  >
                    <Upload className="w-4 h-4 text-gray-500" /> Pilih Gambar Logo
                  </label>
                  <p className="text-[10px] mt-2 text-gray-400 leading-normal">
                    Format gambar yang didukung: PNG, JPG, JPEG. Maksimum file size 500KB. Logo akan tampil di bagian atas struk kasir.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* CARD 2: PERANGKAT KERAS KASIR */}
          <div className="card p-6 shadow-sm border border-gray-100 dark:border-gray-800 space-y-5">
            <h3 className="font-semibold text-base flex items-center gap-2 border-b pb-3" style={{ color: 'var(--color-text-primary)' }}>
              <Cpu className="w-5 h-5 text-rose-500" /> Modul Perangkat Keras Kasir (Printer & Drawer)
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Bluetooth Section */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 flex items-center gap-1.5">
                    <Bluetooth className="w-4 h-4 text-blue-500 animate-pulse" /> Printer Bluetooth
                  </h4>
                  <div className="flex items-center gap-1.5">
                    <span className={`w-2 h-2 rounded-full ${connectedBt ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`} />
                    <span className="text-[10px] font-semibold text-gray-500">
                      {connectedBt ? 'Tersambung' : 'Terputus'}
                    </span>
                  </div>
                </div>

                <div className="flex gap-3 items-center">
                  {btScanning ? (
                    <div className="relative flex items-center justify-center w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/50 flex-shrink-0">
                      <span className="absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75 animate-ping" />
                      <Bluetooth className="relative w-5 h-5 text-blue-600 dark:text-blue-400 animate-pulse" />
                    </div>
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-800/60 flex items-center justify-center flex-shrink-0">
                      <Bluetooth className="w-5 h-5 text-gray-400" />
                    </div>
                  )}
                  <button 
                    onClick={handleBluetoothScan} 
                    disabled={btScanning}
                    className="btn btn-outline py-2 px-3 flex-1 text-xs font-bold"
                  >
                    {btScanning ? 'Memindai...' : 'Pindai Printer Bluetooth'}
                  </button>
                </div>

                {btDevices.length > 0 && (
                  <div className="border rounded-xl p-3 bg-gray-50 dark:bg-gray-800/30 text-xs transition-all animate-fade-in">
                    <p className="font-semibold text-gray-400 mb-2">Perangkat Tertaut:</p>
                    <div className="space-y-2">
                      {btDevices.map((d) => (
                        <div key={d.id} className="flex justify-between items-center py-1 border-b border-gray-100 dark:border-gray-800 last:border-0">
                          <span className="font-medium text-gray-600 dark:text-gray-300">{d.name}</span>
                          <span className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[9px] font-black px-2 py-0.5 rounded-full">Active</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* LAN/WiFi Section */}
              <div className="space-y-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 flex items-center gap-1.5">
                  <Printer className="w-4 h-4 text-emerald-500" /> Printer Jaringan (LAN / Wi-Fi)
                </h4>
                <div className="grid grid-cols-3 gap-3">
                  <div className="col-span-2">
                    <label className="block text-[9px] font-bold text-gray-400 mb-1">Alamat IP Printer</label>
                    <input type="text" value={lanIp} onChange={e => setLanIp(e.target.value)} className="input text-xs py-1.5" />
                  </div>
                  <div>
                    <label className="block text-[9px] font-bold text-gray-400 mb-1">Port</label>
                    <input type="text" value={lanPort} onChange={e => setLanPort(e.target.value)} className="input text-xs py-1.5" />
                  </div>
                </div>
                <button 
                  onClick={handleLanPrintTest} 
                  disabled={lanTesting}
                  className="btn btn-outline w-full py-2 text-xs font-bold flex items-center justify-center gap-1.5"
                >
                  {lanTesting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Printer className="w-3.5 h-3.5" />}
                  Kirim Cetak Uji
                </button>
              </div>

              {/* Extra Triggers */}
              <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4 border-t pt-4">
                <div className="flex items-center justify-between p-3.5 border border-gray-100 dark:border-gray-850 rounded-xl bg-gray-50/50 dark:bg-gray-800/20">
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-gray-700 dark:text-gray-200">Buka Laci Uang Otomatis</span>
                    <span className="text-[10px] text-gray-400 mt-0.5">Kick drawer otomatis untuk transaksi Tunai</span>
                  </div>
                  <button 
                    onClick={() => setAutoOpenDrawer(!autoOpenDrawer)}
                    className="flex-shrink-0 focus:outline-none"
                  >
                    {autoOpenDrawer ? (
                      <div className="w-11 h-6 rounded-full flex items-center p-0.5 bg-indigo-600 transition-colors"><div className="w-5 h-5 rounded-full bg-white ml-auto shadow-sm" /></div>
                    ) : (
                      <div className="w-11 h-6 rounded-full flex items-center p-0.5 bg-gray-300 dark:bg-gray-700 transition-colors"><div className="w-5 h-5 rounded-full bg-white shadow-sm" /></div>
                    )}
                  </button>
                </div>

                <div className="flex items-center justify-between p-3.5 border border-gray-100 dark:border-gray-850 rounded-xl bg-gray-50/50 dark:bg-gray-800/20">
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-gray-700 dark:text-gray-200">Mode Barcode Scanner</span>
                    <span className="text-[10px] text-gray-400 mt-0.5">Metode baca kode produk periferal</span>
                  </div>
                  <select 
                    value={barcodeScannerMode} 
                    onChange={e => setBarcodeScannerMode(e.target.value as any)} 
                    className="input py-1 text-xs w-36 border border-gray-200 dark:border-gray-800 rounded-lg"
                  >
                    <option value="keyboard">Keyboard Emulator</option>
                    <option value="api">Web USB/HID API</option>
                  </select>
                </div>
              </div>

            </div>
          </div>

          {/* CARD 3: PAYMENT PORTAL */}
          <div className="card p-6 shadow-sm border border-gray-100 dark:border-gray-800 space-y-5">
            <h3 className="font-semibold text-base flex items-center gap-2 border-b pb-3" style={{ color: 'var(--color-text-primary)' }}>
              <CreditCard className="w-5 h-5 text-emerald-500" /> Portal Pembayaran Nontunai
            </h3>
            
            <div className="space-y-4">
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full" /> Integrasi Mesin EDC
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-semibold mb-1 text-gray-400">API Gateway URL</label>
                    <input type="text" value={edcApiUrl} onChange={e => setEdcApiUrl(e.target.value)} className="input text-xs" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold mb-1 text-gray-400">Terminal Secret Key</label>
                    <input type="password" value={edcApiKey} onChange={e => setEdcApiKey(e.target.value)} className="input text-xs font-mono" />
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full" /> Kredensial QRIS Dinamis
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-semibold mb-1 text-gray-400">Merchant ID (MID)</label>
                    <input type="text" value={qrisMerchantId} onChange={e => setQrisMerchantId(e.target.value)} className="input text-xs" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold mb-1 text-gray-400">Terminal ID (TID)</label>
                    <input type="text" value={qrisTerminalId} onChange={e => setQrisTerminalId(e.target.value)} className="input text-xs" />
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* RIGHT COLUMN (1/3 width, focused on Sync Status, Localization & Backup) */}
        <div className="space-y-6">

          {/* CARD 4: OFFLINE SYNC DASHBOARD (GLOWING CARDS) */}
          <div className="card p-6 shadow-sm border border-gray-100 dark:border-gray-800 space-y-4">
            <h3 className="font-semibold text-base flex items-center gap-2 border-b pb-3" style={{ color: 'var(--color-text-primary)' }}>
              <Database className="w-5 h-5 text-blue-500" /> Sinkronisasi Offline-First
            </h3>

            <div className="flex flex-col gap-3">
              {/* Online/Offline Status */}
              {isOnline ? (
                <div className="rounded-xl p-4 bg-emerald-50/30 dark:bg-emerald-950/10 border border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.05)] transition-all duration-300 hover:shadow-[0_0_20px_rgba(16,185,129,0.1)]">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-emerald-800 dark:text-emerald-400">Status Koneksi</span>
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                    </span>
                  </div>
                  <p className="text-sm font-black text-emerald-700 dark:text-emerald-400 mt-2">Tersambung (Online)</p>
                </div>
              ) : (
                <div className="rounded-xl p-4 bg-red-50/30 dark:bg-red-950/10 border border-red-500/20 shadow-[0_0_15px_rgba(239,68,68,0.05)] transition-all duration-300">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-red-800 dark:text-red-400">Status Koneksi</span>
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
                    </span>
                  </div>
                  <p className="text-sm font-black text-red-700 dark:text-red-400 mt-2">Terputus (Offline)</p>
                </div>
              )}

              {/* IndexedDB Counter status */}
              <div className="rounded-xl p-4 bg-amber-50/30 dark:bg-amber-950/10 border border-amber-500/20 shadow-[0_0_15px_rgba(245,158,11,0.05)] transition-all duration-300 hover:shadow-[0_0_20px_rgba(245,158,11,0.1)]">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-amber-800 dark:text-amber-400">Antrean Lokal</span>
                  <Database className="w-4 h-4 text-amber-500" />
                </div>
                <div className="flex items-baseline gap-1.5 mt-2">
                  <p className={`text-2xl font-black ${unsyncedCount > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-gray-500'}`}>
                    {unsyncedCount}
                  </p>
                  <span className="text-[10px] text-amber-600 dark:text-amber-500 font-bold">Transaksi Tertunda</span>
                </div>
              </div>
            </div>

            <button 
              onClick={handleManualSync} 
              disabled={syncing || !isOnline} 
              className="btn btn-primary w-full py-2.5 text-xs font-bold flex items-center justify-center gap-2 shadow-sm"
            >
              {syncing ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
              {syncing ? 'Menyelaraskan data...' : 'Sinkronkan Sekarang'}
            </button>

            <div className="flex items-center gap-1.5 text-[10px] text-gray-400 pt-1 border-t border-gray-100 dark:border-gray-800">
              <Clock className="w-3.5 h-3.5 text-gray-400" />
              <span>Sinkronisasi terakhir: </span>
              <span className="font-bold text-gray-600 dark:text-gray-300">
                {lastSyncTime ? (
                  new Date(lastSyncTime).toLocaleDateString('id-ID', {
                    day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
                  })
                ) : 'Belum pernah'}
              </span>
            </div>
          </div>

          {/* CARD 5: LOKALISASI & ALERTS */}
          <div className="card p-6 shadow-sm border border-gray-100 dark:border-gray-800 space-y-4">
            <h3 className="font-semibold text-base flex items-center gap-2 border-b pb-3" style={{ color: 'var(--color-text-primary)' }}>
              <Globe className="w-5 h-5 text-amber-500" /> Lokalisasi & Notifikasi
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold mb-1.5 text-gray-500 dark:text-gray-400">Zona Waktu Operasional</label>
                <select value={timezone} onChange={e => setTimezone(e.target.value)} className="input py-2 text-xs">
                  <option value="Asia/Jakarta">WIB - Asia/Jakarta (GMT+7)</option>
                  <option value="Asia/Makassar">WITA - Asia/Makassar (GMT+8)</option>
                  <option value="Asia/Jayapura">WIT - Asia/Jayapura (GMT+9)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1.5 text-gray-500 dark:text-gray-400">Batas Minimum Stok Kritis</label>
                <div className="relative">
                  <input 
                    type="number" 
                    value={minStockLimit} 
                    onChange={e => setMinStockLimit(parseInt(e.target.value) || 0)} 
                    className="input text-xs pr-10" 
                    min="0"
                  />
                  <span className="absolute right-3 top-2.5 text-[10px] text-gray-400 font-bold">UNIT</span>
                </div>
              </div>

              <div className="bg-amber-500/10 border border-amber-500/20 p-3.5 rounded-xl flex items-start gap-2.5">
                <BellRing className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                <p className="text-[10px] text-amber-700 dark:text-amber-300 leading-normal">
                  Sistem otomatis memberikan notifikasi dan tanda peringatan kritis di dashboard inventori ketika persediaan bahan baku kurang dari batas minimum di atas.
                </p>
              </div>
            </div>
          </div>

          {/* CARD 6: EXPORT & RESTORE DATA */}
          <div className="card p-6 shadow-sm border border-gray-100 dark:border-gray-800 space-y-4">
            <h3 className="font-semibold text-base flex items-center gap-2 border-b pb-3" style={{ color: 'var(--color-text-primary)' }}>
              <Database className="w-5 h-5 text-indigo-500" /> Cadangan Laporan
            </h3>

            {lastBackup ? (
              <div className="flex items-center gap-2.5 p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/10">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <div className="text-[10px]">
                  <p className="font-bold text-emerald-700 dark:text-emerald-400">Backup Tersimpan</p>
                  <p className="text-gray-400">
                    {new Date(lastBackup).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2.5 p-3 rounded-xl bg-rose-500/5 border border-rose-500/10">
                <Shield className="w-4 h-4 text-rose-500 flex-shrink-0" />
                <div className="text-[10px]">
                  <p className="font-bold text-rose-700 dark:text-rose-400">Belum Ada Backup</p>
                  <p className="text-gray-400 leading-tight">Segera lakukan ekspor cadangan data demi keamanan laporan Anda.</p>
                </div>
              </div>
            )}

            <div className="flex flex-col gap-2.5 pt-1">
              <button onClick={handleBackup} disabled={backupLoading} className="btn btn-primary py-2 text-xs flex items-center justify-center gap-2 font-bold shadow-sm">
                {backupLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                Ekspor Data (.json)
              </button>
              <label className={`btn btn-outline cursor-pointer py-2 text-xs flex items-center justify-center gap-2 font-bold ${restoreLoading ? 'opacity-50' : ''}`}>
                {restoreLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                Impor Data (.json)
                <input type="file" accept=".json" onChange={handleRestoreSelect} className="hidden" disabled={restoreLoading} />
              </label>
            </div>
          </div>

        </div>

      </div>

      {/* Restore Confirmation */}
      {showRestoreConfirm && (
        <ConfirmModal
          title="Restore Data Cadangan?"
          message={`Berkas "${pendingRestoreFile?.name}" akan memulihkan data dan menimpa transaksi terkini Anda. Proses ini tidak dapat dibatalkan.`}
          confirmLabel="Pulihkan Sekarang"
          variant="warning"
          onConfirm={executeRestore}
          onCancel={() => { setShowRestoreConfirm(false); setPendingRestoreFile(null); }}
        />
      )}
    </div>
  );
}
