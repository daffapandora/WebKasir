'use client';

import { useAuth } from '@/lib/auth/context';
import { useSync } from '@/hooks/useSync';
import { formatRupiah, formatNumber } from '@/lib/utils';
import { useState } from 'react';

export default function DashboardPage() {
  const { user, outlet, logout } = useAuth();
  const { isOnline, pendingSyncCount, triggerSync, pullMasterData } = useSync();
  const [isPulling, setIsPulling] = useState(false);
  const [pullStats, setPullStats] = useState<{ products: number; categories: number } | null>(null);

  const handlePullMasterData = async () => {
    setIsPulling(true);
    try {
      const stats = await pullMasterData();
      setPullStats(stats);
      setTimeout(() => setPullStats(null), 3000);
    } catch (e) {
      console.error(e);
    } finally {
      setIsPulling(false);
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '32px' }}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: 800, color: '#0f172a', marginBottom: '8px' }}>
            Dashboard
          </h1>
          <p style={{ color: '#64748b', fontSize: '15px' }}>
            Selamat datang kembali, <strong>{user?.name}</strong> di {outlet?.name || 'Toko'}.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            onClick={logout}
            style={{
              padding: '10px 16px', borderRadius: '10px', fontSize: '14px', fontWeight: 600,
              background: 'white', color: '#ef4444', border: '1px solid #fecaca', cursor: 'pointer',
              boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
            }}
          >
            🚪 Keluar
          </button>
        </div>
      </div>

      {/* Sync Status Card */}
      <div style={{
        background: 'white', padding: '24px', borderRadius: '16px', marginBottom: '32px',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)',
        border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{
            width: 48, height: 48, borderRadius: '12px',
            background: isOnline ? '#dcfce7' : '#fee2e2',
            color: isOnline ? '#16a34a' : '#dc2626',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '24px'
          }}>
            {isOnline ? '🌐' : '📵'}
          </div>
          <div>
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#1e293b', marginBottom: '4px' }}>
              Status Koneksi: {isOnline ? 'Online' : 'Offline'}
            </h3>
            <p style={{ fontSize: '14px', color: '#64748b' }}>
              {pendingSyncCount > 0 
                ? `${pendingSyncCount} transaksi menunggu sinkronisasi.` 
                : 'Semua data tersinkronisasi.'}
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            onClick={handlePullMasterData}
            disabled={!isOnline || isPulling}
            style={{
              padding: '10px 16px', borderRadius: '10px', fontSize: '14px', fontWeight: 600,
              background: '#f1f5f9', color: '#334155', border: 'none', cursor: isOnline ? 'pointer' : 'not-allowed',
            }}
          >
            {isPulling ? 'Mengunduh...' : '⬇️ Unduh Data Master'}
          </button>
          
          <button
            onClick={triggerSync}
            disabled={!isOnline || pendingSyncCount === 0}
            style={{
              padding: '10px 16px', borderRadius: '10px', fontSize: '14px', fontWeight: 600,
              background: '#4f46e5', color: 'white', border: 'none', cursor: (isOnline && pendingSyncCount > 0) ? 'pointer' : 'not-allowed',
              opacity: (isOnline && pendingSyncCount > 0) ? 1 : 0.5
            }}
          >
            🔄 Sinkronisasi Sekarang
          </button>
        </div>
      </div>

      {pullStats && (
        <div style={{ padding: '12px 16px', background: '#dcfce7', color: '#166534', borderRadius: '8px', marginBottom: '24px', fontSize: '14px' }}>
          ✅ Berhasil mengunduh {pullStats.products} produk dan {pullStats.categories} kategori.
        </div>
      )}

      {/* Analytics Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '24px' }}>
        {[
          { label: 'Penjualan Hari Ini', value: formatRupiah(1250000), trend: '+15%', color: '#6366f1' },
          { label: 'Total Transaksi', value: formatNumber(42), trend: '+5%', color: '#10b981' },
          { label: 'Pelanggan Aktif', value: formatNumber(18), trend: '+2', color: '#f59e0b' },
          { label: 'Produk Terjual', value: formatNumber(156), trend: '+12%', color: '#ec4899' },
        ].map((stat, i) => (
          <div key={i} style={{
            background: 'white', padding: '24px', borderRadius: '16px',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
            border: '1px solid #e2e8f0', position: 'relative', overflow: 'hidden'
          }}>
            <div style={{
              position: 'absolute', top: 0, left: 0, width: '4px', height: '100%',
              background: stat.color
            }} />
            <div style={{ fontSize: '14px', color: '#64748b', fontWeight: 500, marginBottom: '8px' }}>
              {stat.label}
            </div>
            <div style={{ fontSize: '28px', fontWeight: 800, color: '#0f172a', fontFamily: 'var(--font-mono)', marginBottom: '8px' }}>
              {stat.value}
            </div>
            <div style={{ fontSize: '13px', fontWeight: 600, color: '#10b981' }}>
              {stat.trend} dari kemarin
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
