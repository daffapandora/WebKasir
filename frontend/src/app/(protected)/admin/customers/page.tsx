'use client';

import { useState, useEffect } from 'react';
import { getCustomers, addCustomer, updateCustomer, deleteCustomer, logAuditTrail, getTransactions } from '@/lib/firebase-service';
import { formatCurrency, formatDate, cn } from '@/lib/utils';
import { useUIStore } from '@/store/ui-store';
import { useAuthStore } from '@/store/auth-store';
import { Users, Search, Plus, Crown, Star, Edit2, Phone, Mail, Trash2, X, Loader2, History, Receipt } from 'lucide-react';
import { ConfirmModal } from '@/components/shared/confirm-modal';
import { Pagination, usePagination } from '@/components/shared/pagination';
import type { Customer, Transaction } from '@/types';
import { MOCK_TRANSACTIONS } from '@/lib/mock-data';

export default function CustomersPage() {
  const { addToast } = useUIStore();
  const { user } = useAuthStore();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [tierFilter, setTierFilter] = useState<string>('all');

  // Form modal states
  const [showForm, setShowForm] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [formName, setFormName] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formAddress, setFormAddress] = useState('');
  const [formMembershipTier, setFormMembershipTier] = useState<'none' | 'bronze' | 'silver' | 'gold'>('none');
  const [submitting, setSubmitting] = useState(false);

  // A4: Delete confirm
  const [deleteTarget, setDeleteTarget] = useState<Customer | null>(null);

  // B5-25: Transaction history modal
  const [historyCustomer, setHistoryCustomer] = useState<Customer | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [list, txnList] = await Promise.all([getCustomers(), getTransactions()]);
      setCustomers(list);
      setTransactions(txnList);
    } catch (err) {
      console.error(err);
      addToast('error', 'Gagal memuat data pelanggan');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const openAddForm = () => {
    setEditingCustomer(null);
    setFormName(''); setFormPhone(''); setFormEmail(''); setFormAddress('');
    setFormMembershipTier('none');
    setShowForm(true);
  };

  const openEditForm = (c: Customer) => {
    setEditingCustomer(c);
    setFormName(c.name); setFormPhone(c.phone); setFormEmail(c.email || '');
    setFormAddress(c.address || ''); setFormMembershipTier(c.membership_tier);
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName || !formPhone) {
      addToast('warning', 'Nama dan Nomor HP wajib diisi');
      return;
    }
    try {
      setSubmitting(true);
      const payload = {
        name: formName, phone: formPhone, email: formEmail, address: formAddress,
        membership_tier: formMembershipTier,
        loyalty_points: editingCustomer ? editingCustomer.loyalty_points : 0,
        total_spent: editingCustomer ? editingCustomer.total_spent : 0,
        total_transactions: editingCustomer ? editingCustomer.total_transactions : 0,
        last_visit: editingCustomer ? editingCustomer.last_visit || undefined : undefined,
        is_active: true
      };
      if (editingCustomer) {
        await updateCustomer(editingCustomer.id, payload);
        await logAuditTrail(user?.name || 'System', 'update', 'customers', `Mengubah data pelanggan: ${formName}`);
        addToast('success', 'Data pelanggan berhasil diperbarui');
      } else {
        await addCustomer(payload);
        await logAuditTrail(user?.name || 'System', 'create', 'customers', `Menambahkan pelanggan baru: ${formName}`);
        addToast('success', 'Pelanggan berhasil ditambahkan');
      }
      setShowForm(false);
      loadData();
    } catch (err) {
      console.error(err);
      addToast('error', 'Gagal menyimpan data pelanggan');
    } finally {
      setSubmitting(false);
    }
  };

  // A4: Confirm delete
  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteCustomer(deleteTarget.id);
      await logAuditTrail(user?.name || 'System', 'delete', 'customers', `Menghapus pelanggan: ${deleteTarget.name}`);
      addToast('success', 'Pelanggan berhasil dihapus');
      setDeleteTarget(null);
      loadData();
    } catch (err) {
      console.error(err);
      addToast('error', 'Gagal menghapus pelanggan');
    }
  };

  const filtered = customers.filter(c => {
    if (tierFilter !== 'all' && c.membership_tier !== tierFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return c.name.toLowerCase().includes(q) || c.phone.includes(q);
    }
    return true;
  });

  const { currentPage, totalPages, perPage, paginatedItems, totalItems, handlePageChange, handlePerPageChange } = usePagination(filtered, 20);

  const tierIcons: Record<string, React.ReactNode> = {
    gold: <Crown className="w-4 h-4 text-yellow-500" />,
    silver: <Star className="w-4 h-4 text-gray-400" />,
    bronze: <Star className="w-4 h-4 text-orange-600" />
  };

  // B5-25: Get transactions for a customer
  const getCustomerTransactions = (customerId: number) => {
    return transactions.filter(t => t.customer_id === customerId);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--color-text-primary)' }}>Pelanggan</h1>
          <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>{customers.length} pelanggan terdaftar</p>
        </div>
        <button onClick={openAddForm} className="btn btn-primary">
          <Plus className="w-4 h-4" /> Tambah Pelanggan
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total', value: customers.length, icon: Users, color: 'var(--color-accent)' },
          { label: 'Gold', value: customers.filter(c => c.membership_tier === 'gold').length, icon: Crown, color: '#D4A017' },
          { label: 'Silver', value: customers.filter(c => c.membership_tier === 'silver').length, icon: Star, color: '#9CA3AF' },
          { label: 'Bronze', value: customers.filter(c => c.membership_tier === 'bronze').length, icon: Star, color: '#B45309' },
        ].map((s, i) => {
          const Icon = s.icon;
          return (
            <div key={i} className="card p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${s.color}15` }}>
                <Icon className="w-5 h-5" style={{ color: s.color }} />
              </div>
              <div>
                <p className="text-xl font-bold tabular-nums" style={{ color: 'var(--color-text-primary)' }}>{s.value}</p>
                <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>{s.label}</p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--color-text-muted)' }} />
          <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Cari nama atau HP..." className="input pl-10" />
        </div>
        <div className="flex gap-1">
          {['all', 'gold', 'silver', 'bronze', 'none'].map(t => (
            <button key={t} onClick={() => setTierFilter(t)} className={cn('btn btn-sm', tierFilter === t ? 'btn-primary' : 'btn-outline')}>
              {t === 'all' ? 'Semua' : t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="card p-12 flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin" style={{ color: 'var(--color-accent)' }} />
          <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>Memuat data pelanggan...</p>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ background: 'var(--color-bg-elevated)' }}>
                  <th className="text-left py-3 px-4 font-medium" style={{ color: 'var(--color-text-secondary)' }}>Pelanggan</th>
                  <th className="text-left py-3 px-4 font-medium" style={{ color: 'var(--color-text-secondary)' }}>Kontak</th>
                  <th className="text-center py-3 px-4 font-medium" style={{ color: 'var(--color-text-secondary)' }}>Tier</th>
                  <th className="text-right py-3 px-4 font-medium" style={{ color: 'var(--color-text-secondary)' }}>Poin</th>
                  <th className="text-right py-3 px-4 font-medium" style={{ color: 'var(--color-text-secondary)' }}>Total Belanja</th>
                  <th className="text-right py-3 px-4 font-medium" style={{ color: 'var(--color-text-secondary)' }}>Transaksi</th>
                  <th className="text-right py-3 px-4 font-medium" style={{ color: 'var(--color-text-secondary)' }}>Kunjungan</th>
                  <th className="text-center py-3 px-4 font-medium" style={{ color: 'var(--color-text-secondary)' }}>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {paginatedItems.map(c => (
                  <tr key={c.id} className="border-b hover:bg-[var(--color-bg-elevated)] transition-colors" style={{ borderColor: 'var(--color-border-light)' }}>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0" style={{ background: 'var(--color-accent)' }}>
                          {c.name.charAt(0)}
                        </div>
                        <p className="font-medium" style={{ color: 'var(--color-text-primary)' }}>{c.name}</p>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex flex-col gap-0.5 text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                        <div className="flex items-center gap-1"><Phone className="w-3 h-3" /> {c.phone}</div>
                        {c.email && <div className="flex items-center gap-1"><Mail className="w-3 h-3" /> {c.email}</div>}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-center">{tierIcons[c.membership_tier] || <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>—</span>}</td>
                    <td className="py-3 px-4 text-right tabular-nums font-medium" style={{ color: 'var(--color-accent)' }}>{c.loyalty_points.toLocaleString()}</td>
                    <td className="py-3 px-4 text-right tabular-nums" style={{ color: 'var(--color-text-primary)' }}>{formatCurrency(c.total_spent)}</td>
                    <td className="py-3 px-4 text-right tabular-nums" style={{ color: 'var(--color-text-secondary)' }}>{c.total_transactions}</td>
                    <td className="py-3 px-4 text-right text-xs" style={{ color: 'var(--color-text-muted)' }}>{c.last_visit ? formatDate(c.last_visit) : '—'}</td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-1">
                        {/* B5-25: Transaction history */}
                        <button onClick={() => setHistoryCustomer(c)} className="btn btn-ghost btn-icon btn-sm" title="Riwayat Transaksi"><History className="w-3.5 h-3.5" /></button>
                        <button onClick={() => openEditForm(c)} className="btn btn-ghost btn-icon btn-sm" title="Edit"><Edit2 className="w-3.5 h-3.5" /></button>
                        <button onClick={() => setDeleteTarget(c)} className="btn btn-ghost btn-icon btn-sm" title="Hapus"><Trash2 className="w-3.5 h-3.5" style={{ color: 'var(--color-danger)' }} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-4 pb-4">
            <Pagination currentPage={currentPage} totalPages={totalPages} totalItems={totalItems} perPage={perPage} onPageChange={handlePageChange} onPerPageChange={handlePerPageChange} />
          </div>
        </div>
      )}

      {/* A4: Delete Confirm */}
      {deleteTarget && (
        <ConfirmModal
          title="Hapus Pelanggan?"
          message={`Apakah Anda yakin ingin menghapus "${deleteTarget.name}"? Semua data poin loyalitas akan hilang. Tindakan ini tidak dapat dibatalkan.`}
          confirmLabel="Hapus"
          variant="danger"
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}

      {/* B5-25: Transaction History Modal */}
      {historyCustomer && (
        <div className="modal-backdrop flex items-center justify-center p-4">
          <div className="modal-content card w-full max-w-2xl overflow-hidden flex flex-col max-h-[80vh]">
            <div className="p-4 border-b flex items-center justify-between" style={{ borderColor: 'var(--color-border-light)' }}>
              <div>
                <h3 className="font-bold text-lg" style={{ color: 'var(--color-text-primary)' }}>Riwayat Transaksi</h3>
                <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>{historyCustomer.name}</p>
              </div>
              <button onClick={() => setHistoryCustomer(null)} className="btn btn-ghost btn-icon btn-sm"><X className="w-5 h-5" /></button>
            </div>
            <div className="overflow-y-auto flex-1 p-4">
              {getCustomerTransactions(historyCustomer.id).length === 0 ? (
                <div className="py-12 text-center">
                  <Receipt className="w-10 h-10 mx-auto mb-3" style={{ color: 'var(--color-text-muted)' }} />
                  <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>Belum ada riwayat transaksi</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {getCustomerTransactions(historyCustomer.id).map(txn => (
                    <div key={txn.id} className="p-3 rounded-lg" style={{ background: 'var(--color-bg-elevated)' }}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-mono font-medium" style={{ color: 'var(--color-accent)' }}>{txn.invoice_number}</span>
                        <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>{formatDate(txn.created_at)}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                          {txn.items.length} item · {txn.cashier_name}
                        </div>
                        <span className="font-bold tabular-nums" style={{ color: 'var(--color-text-primary)' }}>{formatCurrency(txn.total)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Customer Form Modal */}
      {showForm && (
        <div className="modal-backdrop flex items-center justify-center p-4">
          <div className="modal-content card w-full max-w-md overflow-hidden flex flex-col">
            <div className="p-4 border-b flex items-center justify-between" style={{ borderColor: 'var(--color-border-light)' }}>
              <h3 className="font-bold text-lg" style={{ color: 'var(--color-text-primary)' }}>
                {editingCustomer ? 'Edit Pelanggan' : 'Daftarkan Pelanggan Baru'}
              </h3>
              <button onClick={() => setShowForm(false)} className="btn btn-ghost btn-icon btn-sm"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-4 space-y-4">
              <div><label className="block text-xs font-semibold mb-1">Nama Pelanggan *</label><input type="text" value={formName} onChange={e => setFormName(e.target.value)} className="input" placeholder="Contoh: Budi Susilo" required /></div>
              <div><label className="block text-xs font-semibold mb-1">Nomor HP / WA *</label><input type="text" value={formPhone} onChange={e => setFormPhone(e.target.value)} className="input" placeholder="08xxxxxxxxxx" required /></div>
              <div><label className="block text-xs font-semibold mb-1">Email</label><input type="email" value={formEmail} onChange={e => setFormEmail(e.target.value)} className="input" placeholder="budi@email.com" /></div>
              <div><label className="block text-xs font-semibold mb-1">Alamat Rumah</label><input type="text" value={formAddress} onChange={e => setFormAddress(e.target.value)} className="input" placeholder="Jl. Raya Utama No. 12" /></div>
              <div>
                <label className="block text-xs font-semibold mb-1">Tier Membership</label>
                <select value={formMembershipTier} onChange={e => setFormMembershipTier(e.target.value as any)} className="input">
                  <option value="none">None (Bukan Member)</option>
                  <option value="bronze">Bronze</option>
                  <option value="silver">Silver</option>
                  <option value="gold">Gold</option>
                </select>
              </div>
              <div className="pt-4 border-t flex justify-end gap-2" style={{ borderColor: 'var(--color-border-light)' }}>
                <button type="button" onClick={() => setShowForm(false)} className="btn btn-outline" disabled={submitting}>Batal</button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Simpan Pelanggan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
