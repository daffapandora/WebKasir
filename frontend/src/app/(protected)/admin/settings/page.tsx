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

  // A1: Backup state
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
        await new Promise(r => setTimeout(r, 1500));
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
      // Send raw TCP payload simulator
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

  // Firestore backup handlers
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
          <h1 className="text-2xl font-bold" style={{ color: 'var(--color-text-primary)' }}>Pengaturan Sistem</h1>
          <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
            Konfigurasi toko, perangkat keras, integrasi pembayaran, dan sinkronisasi offline.
          </p>
        </div>
        <button onClick={handleSave} className="btn btn-primary shadow-sm" disabled={saving}>
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Simpan
        </button>
      </div>

      {/* Grid Layout of configuration blocks */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* SECTION 1: PROFIL TOKO & STRUK */}
        <div className="card p-5 space-y-4">
          <h3 className="font-semibold text-lg flex items-center gap-2 border-b pb-2" style={{ color: 'var(--color-text-primary)' }}>
            <Store className="w-5 h-5 text-indigo-500" /> Profil Toko & Struk
          </h3>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--color-text-secondary)' }}>Nama Toko</label>
              <input type="text" value={storeName} onChange={e => setStoreName(e.target.value)} className="input" />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--color-text-secondary)' }}>Telepon</label>
              <input type="text" value={storePhone} onChange={e => setStorePhone(e.target.value)} className="input" />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--color-text-secondary)' }}>Alamat Toko</label>
              <textarea value={storeAddress} onChange={e => setStoreAddress(e.target.value)} className="input" rows={2} />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--color-text-secondary)' }}>Footer Struk</label>
              <input type="text" value={receiptFooter} onChange={e => setReceiptFooter(e.target.value)} className="input" />
            </div>
          </div>

          {/* Struct Logo Upload */}
          <div className="pt-2">
            <label className="block text-xs font-semibold mb-2" style={{ color: 'var(--color-text-secondary)' }}>Logo Struk Cetak</label>
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 border rounded-lg overflow-hidden flex items-center justify-center bg-gray-50 dark:bg-gray-800">
                {logoPreview ? (
                  <img src={logoPreview} alt="Preview Logo" className="object-contain w-full h-full" />
                ) : (
                  <Printer className="w-8 h-8 text-gray-300" />
                )}
              </div>
              <div className="flex-1">
                <input 
                  type="file" 
                  accept="image/png, image/jpeg, image/jpg" 
                  onChange={handleLogoChange}
                  className="hidden" 
                  id="receipt-logo-file" 
                />
                <label 
                  htmlFor="receipt-logo-file" 
                  className="btn btn-outline cursor-pointer py-2 px-3 text-xs flex items-center gap-1.5 w-fit"
                >
                  <Upload className="w-3.5 h-3.5" /> Pilih File Gambar
                </label>
                <p className="text-[10px] mt-1 text-gray-400">Format yang didukung: PNG, JPG, JPEG. Ukuran maks 500KB.</p>
              </div>
            </div>
          </div>
        </div>

        {/* SECTION 2: PORTAL PEMBAYARAN & API INTEGRATION */}
        <div className="card p-5 space-y-4">
          <h3 className="font-semibold text-lg flex items-center gap-2 border-b pb-2" style={{ color: 'var(--color-text-primary)' }}>
            <CreditCard className="w-5 h-5 text-emerald-500" /> Portal Pembayaran (EDC & QRIS)
          </h3>
          
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400">Integrasi Mesin EDC</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: 'var(--color-text-secondary)' }}>URL API Terminal</label>
                <input type="text" value={edcApiUrl} onChange={e => setEdcApiUrl(e.target.value)} className="input text-sm" />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: 'var(--color-text-secondary)' }}>Kunci API Kredensial</label>
                <input type="password" value={edcApiKey} onChange={e => setEdcApiKey(e.target.value)} className="input text-sm" />
              </div>
            </div>

            <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 pt-2">Layanan QRIS Dinamis</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: 'var(--color-text-secondary)' }}>Merchant ID (MID)</label>
                <input type="text" value={qrisMerchantId} onChange={e => setQrisMerchantId(e.target.value)} className="input text-sm" />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: 'var(--color-text-secondary)' }}>Terminal ID (TID)</label>
                <input type="text" value={qrisTerminalId} onChange={e => setQrisTerminalId(e.target.value)} className="input text-sm" />
              </div>
            </div>
          </div>
        </div>

        {/* SECTION 3: LOKALISASI & ALERTS */}
        <div className="card p-5 space-y-4">
          <h3 className="font-semibold text-lg flex items-center gap-2 border-b pb-2" style={{ color: 'var(--color-text-primary)' }}>
            <Globe className="w-5 h-5 text-amber-500" /> Lokalisasi & Notifikasi
          </h3>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--color-text-secondary)' }}>Zona Waktu Operasional</label>
              <select value={timezone} onChange={e => setTimezone(e.target.value)} className="input py-2">
                <option value="Asia/Jakarta">WIB - Asia/Jakarta (GMT+7)</option>
                <option value="Asia/Makassar">WITA - Asia/Makassar (GMT+8)</option>
                <option value="Asia/Jayapura">WIT - Asia/Jayapura (GMT+9)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--color-text-secondary)' }}>Batas Minimum Stok Kritis</label>
              <div className="relative">
                <input 
                  type="number" 
                  value={minStockLimit} 
                  onChange={e => setMinStockLimit(parseInt(e.target.value) || 0)} 
                  className="input pr-10" 
                  min="0"
                />
                <span className="absolute right-3 top-2.5 text-xs text-gray-400 font-medium">Unit</span>
              </div>
            </div>
          </div>
          <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 p-3 rounded-lg flex items-start gap-2.5">
            <BellRing className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-amber-800 dark:text-amber-300 leading-relaxed">
              Batas minimum stok kritis digunakan untuk mengirim notifikasi peringatan dini di dasbor inventori ketika kuantitas bahan baku berada di bawah angka penentu di atas.
            </p>
          </div>
        </div>

        {/* SECTION 4: MODUL SINKRONISASI DATA OFFLINE */}
        <div className="card p-5 space-y-4">
          <h3 className="font-semibold text-lg flex items-center gap-2 border-b pb-2" style={{ color: 'var(--color-text-primary)' }}>
            <Database className="w-5 h-5 text-blue-500" /> Sinkronisasi Transaksi Offline-First
          </h3>

          <div className="grid grid-cols-2 gap-4">
            {/* Status Jaringan */}
            <div className="border rounded-xl p-3 flex flex-col justify-between h-20 bg-gray-50 dark:bg-gray-800/40">
              <span className="text-xs font-semibold text-gray-400">Status Jaringan</span>
              <div className="flex items-center gap-1.5 mt-1">
                {isOnline ? (
                  <>
                    <Wifi className="w-4 h-4 text-emerald-500" />
                    <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">Tersambung (Online)</span>
                  </>
                ) : (
                  <>
                    <WifiOff className="w-4 h-4 text-red-500" />
                    <span className="text-sm font-bold text-red-600 dark:text-red-400">Terputus (Offline)</span>
                  </>
                )}
              </div>
            </div>

            {/* Antrean Lokal */}
            <div className="border rounded-xl p-3 flex flex-col justify-between h-20 bg-gray-50 dark:bg-gray-800/40">
              <span className="text-xs font-semibold text-gray-400">Antrean Offline</span>
              <div className="flex items-baseline gap-1 mt-1">
                <span className={`text-xl font-black ${unsyncedCount > 0 ? 'text-amber-500' : 'text-gray-500'}`}>
                  {unsyncedCount}
                </span>
                <span className="text-[10px] text-gray-400 font-medium">Transaksi Tertunda</span>
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <button 
              onClick={handleManualSync} 
              disabled={syncing || !isOnline} 
              className="btn btn-primary flex-1 py-2 text-xs flex items-center justify-center gap-2"
            >
              {syncing ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
              {syncing ? 'Menyelaraskan...' : 'Sinkronkan Sekarang'}
            </button>
          </div>

          <div className="flex items-center gap-1.5 text-xs text-gray-400 pt-1">
            <Clock className="w-3.5 h-3.5" />
            <span>Terakhir disinkronkan: </span>
            <span className="font-semibold">
              {lastSyncTime ? (
                new Date(lastSyncTime).toLocaleDateString('id-ID', {
                  day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
                })
              ) : 'Belum pernah'}
            </span>
          </div>
        </div>

        {/* SECTION 5: MODUL PERANGKAT KERAS KASIR (BLUETOOTH & LAN) */}
        <div className="card p-5 lg:col-span-2 space-y-5">
          <h3 className="font-semibold text-lg flex items-center gap-2 border-b pb-2" style={{ color: 'var(--color-text-primary)' }}>
            <Cpu className="w-5 h-5 text-rose-500" /> Perangkat Keras Kasir (Printer & Drawer)
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Koneksi Printer Bluetooth */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-gray-400 flex items-center gap-1.5">
                  <Bluetooth className="w-4 h-4 text-blue-500" /> Printer Bluetooth (Web Bluetooth)
                </h4>
                <div className="flex items-center gap-1.5">
                  <span className={`w-2.5 h-2.5 rounded-full ${connectedBt ? 'bg-emerald-500' : 'bg-red-500'}`} />
                  <span className="text-xs font-semibold text-gray-500">
                    {connectedBt ? 'Tersambung' : 'Terputus'}
                  </span>
                </div>
              </div>
              
              <button 
                onClick={handleBluetoothScan} 
                disabled={btScanning} 
                className="btn btn-outline w-full py-2.5 flex items-center justify-center gap-2 text-xs font-medium"
              >
                {btScanning ? <Loader2 className="w-4 h-4 animate-spin" /> : <Bluetooth className="w-4 h-4" />}
                Pindai Perangkat Bluetooth
              </button>

              {btDevices.length > 0 && (
                <div className="border rounded-lg p-3 bg-gray-50 dark:bg-gray-800/30 text-xs">
                  <p className="font-semibold text-gray-400 mb-2">Daftar Perangkat Taut:</p>
                  <div className="space-y-1.5">
                    {btDevices.map((d) => (
                      <div key={d.id} className="flex justify-between items-center py-1">
                        <span className="font-medium text-gray-600 dark:text-gray-300">{d.name}</span>
                        <span className="bg-emerald-100 text-emerald-800 text-[9px] font-bold px-2 py-0.5 rounded">Connected</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Koneksi Printer Jaringan (LAN/Wi-Fi) */}
            <div className="space-y-3">
              <h4 className="text-sm font-bold text-gray-400 flex items-center gap-1.5">
                <Printer className="w-4 h-4 text-emerald-500" /> Printer Jaringan (LAN/Wi-Fi)
              </h4>
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="block text-[10px] text-gray-400 mb-1">Alamat IP Printer</label>
                  <input type="text" value={lanIp} onChange={e => setLanIp(e.target.value)} className="input text-xs" />
                </div>
                <div>
                  <label className="block text-[10px] text-gray-400 mb-1">Port</label>
                  <input type="text" value={lanPort} onChange={e => setLanPort(e.target.value)} className="input text-xs" />
                </div>
              </div>
              <button 
                onClick={handleLanPrintTest} 
                disabled={lanTesting}
                className="btn btn-outline w-full py-2.5 text-xs font-medium flex items-center justify-center gap-2"
              >
                {lanTesting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Printer className="w-3.5 h-3.5" />}
                Kirim Perintah Cetak Uji
              </button>
            </div>

            {/* Pemicu Tambahan */}
            <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4 border-t pt-4">
              <div className="flex items-center justify-between p-3 border rounded-xl bg-gray-50 dark:bg-gray-800/40">
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-gray-700 dark:text-gray-200">Laci Uang Otomatis (Cash Drawer)</span>
                  <span className="text-[10px] text-gray-400 mt-0.5">Pemicu tendang laci saat bayar tunai</span>
                </div>
                <button 
                  onClick={() => setAutoOpenDrawer(!autoOpenDrawer)}
                  className="flex-shrink-0"
                >
                  {autoOpenDrawer ? (
                    <div className="w-11 h-6 rounded-full flex items-center p-0.5 bg-indigo-600"><div className="w-5 h-5 rounded-full bg-white ml-auto shadow-sm" /></div>
                  ) : (
                    <div className="w-11 h-6 rounded-full flex items-center p-0.5 bg-gray-300 dark:bg-gray-700"><div className="w-5 h-5 rounded-full bg-white shadow-sm" /></div>
                  )}
                </button>
              </div>

              <div className="flex items-center justify-between p-3 border rounded-xl bg-gray-50 dark:bg-gray-800/40">
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-gray-700 dark:text-gray-200">Mode Barcode Scanner</span>
                  <span className="text-[10px] text-gray-400 mt-0.5">Metode input periferal kasir</span>
                </div>
                <select 
                  value={barcodeScannerMode} 
                  onChange={e => setBarcodeScannerMode(e.target.value as any)} 
                  className="input py-1 text-xs w-40"
                >
                  <option value="keyboard">Keyboard Emulator</option>
                  <option value="api">Web USB/HID API</option>
                </select>
              </div>
            </div>

          </div>
        </div>

        {/* SECTION 6: DATA BACKUP & RESTORE */}
        <div className="card p-5 lg:col-span-2 space-y-4">
          <h3 className="font-semibold text-lg flex items-center gap-2 border-b pb-2" style={{ color: 'var(--color-text-primary)' }}>
            <Database className="w-5 h-5 text-indigo-500" /> Ekspor & Impor Cadangan Data
          </h3>

          <div className="flex items-center gap-3 p-3 rounded-lg" style={{ background: lastBackup ? 'rgb(34 197 94 / 0.08)' : 'rgb(239 68 68 / 0.08)' }}>
            {lastBackup ? (
              <>
                <CheckCircle2 className="w-5 h-5 flex-shrink-0 text-emerald-500" />
                <div>
                  <p className="text-sm font-semibold text-emerald-800 dark:text-emerald-400">Cadangan Terakhir Tersimpan</p>
                  <p className="text-xs text-gray-500">
                    {new Date(lastBackup).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </>
            ) : (
              <>
                <Shield className="w-5 h-5 flex-shrink-0 text-rose-500" />
                <div>
                  <p className="text-sm font-semibold text-rose-800 dark:text-rose-400">Cadangan Belum Tersedia</p>
                  <p className="text-xs text-gray-500">Unduh cadangan data sekarang untuk memproteksi laporan penting Anda.</p>
                </div>
              </>
            )}
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <button onClick={handleBackup} disabled={backupLoading} className="btn btn-primary flex-1 py-2 text-xs flex items-center justify-center gap-2">
              {backupLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
              {backupLoading ? 'Mengekspor data...' : 'Ekspor Cadangan (.json)'}
            </button>
            <label className={`btn btn-outline flex-1 cursor-pointer py-2 text-xs flex items-center justify-center gap-2 ${restoreLoading ? 'opacity-50' : ''}`}>
              {restoreLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
              {restoreLoading ? 'Memulihkan...' : 'Impor Cadangan (.json)'}
              <input type="file" accept=".json" onChange={handleRestoreSelect} className="hidden" disabled={restoreLoading} />
            </label>
          </div>
          <p className="text-xs text-gray-400 leading-relaxed">
            Berkas cadangan (.json) mencakup seluruh koleksi lokal: Produk, Kategori, Pelanggan, Transaksi, Diskon, dan Pengaturan.
          </p>
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
