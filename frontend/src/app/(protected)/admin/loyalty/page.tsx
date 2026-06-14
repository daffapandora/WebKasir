'use client';

import { useState } from 'react';
import { MOCK_LOYALTY_CONFIG, MOCK_LOYALTY_TRANSACTIONS } from '@/lib/mock-data';
import { formatCurrency, formatDateTime, cn } from '@/lib/utils';
import { Star, Crown, Save, ArrowUp, ArrowDown, Settings, Loader2 } from 'lucide-react';
import { useUIStore } from '@/store/ui-store';

export default function LoyaltyPage() {
  const { addToast } = useUIStore();
  const [config, setConfig] = useState(MOCK_LOYALTY_CONFIG);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    await new Promise(r => setTimeout(r, 1000));
    setSaving(false);
    addToast('success', 'Konfigurasi loyalti disimpan');
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold" style={{ color: 'var(--color-text-primary)' }}>Program Loyalti</h1><p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>Konfigurasi poin dan tier membership</p></div>
        <button onClick={handleSave} className="btn btn-primary" disabled={saving}>
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Simpan
        </button>
      </div>

      {/* Tier visualization */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { tier: 'Bronze', threshold: config.bronze_threshold, color: '#B45309', bg: '#FEF3C7', icon: Star },
          { tier: 'Silver', threshold: config.silver_threshold, color: '#6B7280', bg: '#F3F4F6', icon: Star },
          { tier: 'Gold', threshold: config.gold_threshold, color: '#D97706', bg: '#FEF9C3', icon: Crown },
        ].map(t => { const Icon = t.icon; return (
          <div key={t.tier} className="card p-5 text-center" style={{ borderTop: `3px solid ${t.color}` }}>
            <Icon className="w-8 h-8 mx-auto mb-2" style={{ color: t.color }} />
            <p className="font-bold text-lg" style={{ color: 'var(--color-text-primary)' }}>{t.tier}</p>
            <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>≥ {t.threshold.toLocaleString()} poin</p>
            <input type="number" value={t.threshold} onChange={e => {
              const val = parseInt(e.target.value) || 0;
              if (t.tier === 'Bronze') setConfig({ ...config, bronze_threshold: val });
              if (t.tier === 'Silver') setConfig({ ...config, silver_threshold: val });
              if (t.tier === 'Gold') setConfig({ ...config, gold_threshold: val });
            }} className="input text-center mt-3 text-sm tabular-nums" />
          </div>
        ); })}
      </div>

      {/* Config Form */}
      <div className="card p-5">
        <h3 className="font-semibold mb-4 flex items-center gap-2" style={{ color: 'var(--color-text-primary)' }}><Settings className="w-5 h-5" /> Aturan Poin</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div><label className="block text-xs font-medium mb-1" style={{ color: 'var(--color-text-secondary)' }}>Poin per Rp</label><div className="flex gap-2 items-center"><input type="number" value={config.points_per_amount} onChange={e => setConfig({ ...config, points_per_amount: parseInt(e.target.value) || 0 })} className="input tabular-nums" /><span className="text-xs whitespace-nowrap" style={{ color: 'var(--color-text-muted)' }}>poin per Rp {config.amount_threshold.toLocaleString()}</span></div></div>
          <div><label className="block text-xs font-medium mb-1" style={{ color: 'var(--color-text-secondary)' }}>Threshold Belanja</label><input type="number" value={config.amount_threshold} onChange={e => setConfig({ ...config, amount_threshold: parseInt(e.target.value) || 0 })} className="input tabular-nums" /></div>
          <div><label className="block text-xs font-medium mb-1" style={{ color: 'var(--color-text-secondary)' }}>Nilai Per Poin (Rp)</label><input type="number" value={config.point_value} onChange={e => setConfig({ ...config, point_value: parseInt(e.target.value) || 0 })} className="input tabular-nums" /></div>
          <div><label className="block text-xs font-medium mb-1" style={{ color: 'var(--color-text-secondary)' }}>Min. Redeem</label><input type="number" value={config.min_redeem_points} onChange={e => setConfig({ ...config, min_redeem_points: parseInt(e.target.value) || 0 })} className="input tabular-nums" /></div>
        </div>
        <p className="text-xs mt-3 p-3 rounded-lg" style={{ background: 'var(--color-info-light)', color: 'var(--color-info)' }}>
          Setiap belanja Rp {config.amount_threshold.toLocaleString()} mendapatkan {config.points_per_amount} poin. Setiap poin bernilai Rp {config.point_value.toLocaleString()}. Minimum redeem: {config.min_redeem_points} poin.
        </p>
      </div>

      {/* Recent Loyalty Transactions */}
      <div className="card p-5">
        <h3 className="font-semibold mb-4" style={{ color: 'var(--color-text-primary)' }}>Riwayat Poin Terbaru</h3>
        <div className="space-y-3">
          {MOCK_LOYALTY_TRANSACTIONS.map(lt => (
            <div key={lt.id} className="flex items-center gap-3 py-2 border-b" style={{ borderColor: 'var(--color-border-light)' }}>
              <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center', lt.points > 0 ? 'bg-green-50' : 'bg-red-50')}>
                {lt.points > 0 ? <ArrowUp className="w-4 h-4 text-green-600" /> : <ArrowDown className="w-4 h-4 text-red-500" />}
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>{lt.customer_name}</p>
                <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>{lt.type === 'earn' ? 'Mendapat' : lt.type === 'redeem' ? 'Redeem' : 'Penyesuaian'} • {lt.reference || lt.notes}</p>
              </div>
              <div className="text-right">
                <p className={cn('text-sm font-bold tabular-nums', lt.points > 0 ? 'text-green-600' : 'text-red-500')}>
                  {lt.points > 0 ? '+' : ''}{lt.points} poin
                </p>
                <p className="text-[10px]" style={{ color: 'var(--color-text-muted)' }}>Saldo: {lt.balance_after.toLocaleString()}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
