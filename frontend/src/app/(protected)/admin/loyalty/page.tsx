'use client';

import { useState, useEffect } from 'react';
import { formatCurrency, formatDateTime, cn } from '@/lib/utils';
import { Star, Crown, Save, ArrowUp, ArrowDown, Settings, Loader2 } from 'lucide-react';
import { useUIStore } from '@/store/ui-store';
import { apiClient } from '@/lib/api-client';

interface LoyaltyConfig {
  points_per_amount: number;
  amount_threshold: number;
  point_value: number;
  min_redeem_points: number;
  bronze_threshold: number;
  silver_threshold: number;
  gold_threshold: number;
  is_active: boolean;
}

interface LoyaltyTransaction {
  id: number;
  customer_name: string;
  type: 'earn' | 'redeem' | 'adjust' | 'expire';
  points: number;
  balance_after: number;
  notes?: string;
  reference?: string;
  created_at: string;
}

export default function LoyaltyPage() {
  const { addToast } = useUIStore();
  const [config, setConfig] = useState<LoyaltyConfig>({
    points_per_amount: 1,
    amount_threshold: 10000,
    point_value: 100,
    min_redeem_points: 10,
    bronze_threshold: 100,
    silver_threshold: 500,
    gold_threshold: 1500,
    is_active: true
  });
  const [transactions, setTransactions] = useState<LoyaltyTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [configRes, ledgerRes] = await Promise.all([
        apiClient.get<{ success: boolean; data: LoyaltyConfig }>('/loyalty/config'),
        apiClient.get<{ success: boolean; data: LoyaltyTransaction[] }>('/loyalty/ledger')
      ]);

      if (configRes.data.success) {
        setConfig(configRes.data.data);
      }
      if (ledgerRes.data.success) {
        setTransactions(ledgerRes.data.data);
      }
    } catch (err) {
      console.error(err);
      addToast('error', 'Gagal memuat data program loyalti');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await apiClient.post<{ success: boolean; message: string }>('/loyalty/config', config);
      if (res.data.success) {
        addToast('success', 'Konfigurasi program loyalti berhasil disimpan');
      }
    } catch (err) {
      console.error(err);
      addToast('error', 'Gagal menyimpan konfigurasi');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--color-text-primary)' }}>Program Loyalti</h1>
          <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>Konfigurasi poin dan tier membership</p>
        </div>
        <button onClick={handleSave} className="btn btn-primary" disabled={saving || loading}>
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Simpan
        </button>
      </div>

      {loading ? (
        <div className="card p-12 flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin" style={{ color: 'var(--color-accent)' }} />
          <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>Memuat data loyalti...</p>
        </div>
      ) : (
        <>
          {/* Tier visualization */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { tier: 'Bronze', threshold: config.bronze_threshold, color: '#B45309', bg: '#FEF3C7', icon: Star },
              { tier: 'Silver', threshold: config.silver_threshold, color: '#6B7280', bg: '#F3F4F6', icon: Star },
              { tier: 'Gold', threshold: config.gold_threshold, color: '#D97706', bg: '#FEF9C3', icon: Crown },
            ].map(t => {
              const Icon = t.icon;
              return (
                <div key={t.tier} className="card p-5 text-center" style={{ borderTop: `3px solid ${t.color}` }}>
                  <Icon className="w-8 h-8 mx-auto mb-2" style={{ color: t.color }} />
                  <p className="font-bold text-lg" style={{ color: 'var(--color-text-primary)' }}>{t.tier}</p>
                  <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>≥ {t.threshold.toLocaleString()} poin</p>
                  <input
                    type="number"
                    value={t.threshold}
                    onChange={e => {
                      const val = parseInt(e.target.value) || 0;
                      if (t.tier === 'Bronze') setConfig({ ...config, bronze_threshold: val });
                      if (t.tier === 'Silver') setConfig({ ...config, silver_threshold: val });
                      if (t.tier === 'Gold') setConfig({ ...config, gold_threshold: val });
                    }}
                    className="input text-center mt-3 text-sm tabular-nums"
                  />
                </div>
              );
            })}
          </div>

          {/* Config Form */}
          <div className="card p-5">
            <h3 className="font-semibold mb-4 flex items-center gap-2" style={{ color: 'var(--color-text-primary)' }}>
              <Settings className="w-5 h-5" /> Aturan Poin
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: 'var(--color-text-secondary)' }}>Poin per Rp</label>
                <div className="flex gap-2 items-center">
                  <input
                    type="number"
                    value={config.points_per_amount}
                    onChange={e => setConfig({ ...config, points_per_amount: parseInt(e.target.value) || 0 })}
                    className="input tabular-nums"
                  />
                  <span className="text-xs whitespace-nowrap" style={{ color: 'var(--color-text-muted)' }}>
                    poin per Rp {config.amount_threshold.toLocaleString()}
                  </span>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: 'var(--color-text-secondary)' }}>Threshold Belanja</label>
                <input
                  type="number"
                  value={config.amount_threshold}
                  onChange={e => setConfig({ ...config, amount_threshold: parseInt(e.target.value) || 0 })}
                  className="input tabular-nums"
                />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: 'var(--color-text-secondary)' }}>Nilai Per Poin (Rp)</label>
                <input
                  type="number"
                  value={config.point_value}
                  onChange={e => setConfig({ ...config, point_value: parseInt(e.target.value) || 0 })}
                  className="input tabular-nums"
                />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: 'var(--color-text-secondary)' }}>Min. Redeem</label>
                <input
                  type="number"
                  value={config.min_redeem_points}
                  onChange={e => setConfig({ ...config, min_redeem_points: parseInt(e.target.value) || 0 })}
                  className="input tabular-nums"
                />
              </div>
            </div>
            <p className="text-xs mt-3 p-3 rounded-lg" style={{ background: 'var(--color-info-light)', color: 'var(--color-info)' }}>
              Setiap belanja Rp {config.amount_threshold.toLocaleString()} mendapatkan {config.points_per_amount} poin. Setiap poin bernilai Rp {config.point_value.toLocaleString()}. Minimum redeem: {config.min_redeem_points} poin.
            </p>
          </div>

          {/* Recent Loyalty Transactions */}
          <div className="card p-5">
            <h3 className="font-semibold mb-4" style={{ color: 'var(--color-text-primary)' }}>Riwayat Poin Terbaru</h3>
            <div className="space-y-3">
              {transactions.map(lt => (
                <div key={lt.id} className="flex items-center gap-3 py-2 border-b" style={{ borderColor: 'var(--color-border-light)' }}>
                  <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center', lt.points > 0 ? 'bg-green-50' : 'bg-red-50')}>
                    {lt.points > 0 ? <ArrowUp className="w-4 h-4 text-green-600" /> : <ArrowDown className="w-4 h-4 text-red-500" />}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>{lt.customer_name}</p>
                    <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                      {lt.type === 'earn' ? 'Mendapat' : lt.type === 'redeem' ? 'Redeem' : 'Penyesuaian'} • {lt.reference || lt.notes}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className={cn('text-sm font-bold tabular-nums', lt.points > 0 ? 'text-green-600' : 'text-red-500')}>
                      {lt.points > 0 ? '+' : ''}{lt.points} poin
                    </p>
                    <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>{formatDateTime(lt.created_at)}</p>
                  </div>
                </div>
              ))}
              {transactions.length === 0 && (
                <div className="text-center py-6 text-sm" style={{ color: 'var(--color-text-muted)' }}>
                  Belum ada riwayat poin loyalti.
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
