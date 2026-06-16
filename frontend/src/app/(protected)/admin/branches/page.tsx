'use client';

import { useState, useEffect } from 'react';
import {
  getBranches,
  addBranch,
  updateBranch,
  deleteBranch,
  logAuditTrail
} from '@/lib/firebase-service';
import { cn } from '@/lib/utils';
import { useUIStore } from '@/store/ui-store';
import { useAuthStore } from '@/store/auth-store';
import {
  Building2, Plus, Edit2, MapPin, Phone, ToggleRight, ToggleLeft,
  Search, Loader2, X, Trash2
} from 'lucide-react';
import { ConfirmModal } from '@/components/shared/confirm-modal';
import type { Branch } from '@/types';

export default function BranchesPage() {
  const { addToast } = useUIStore();
  const { user } = useAuthStore();
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Modal and Form States
  const [showForm, setShowForm] = useState(false);
  const [editingBranch, setEditingBranch] = useState<Branch | null>(null);
  const [formName, setFormName] = useState('');
  const [formAddress, setFormAddress] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formIsActive, setFormIsActive] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Delete Confirm States
  const [deleteTarget, setDeleteTarget] = useState<Branch | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await getBranches();
      setBranches(data);
    } catch (err) {
      console.error(err);
      addToast('error', 'Gagal memuat data cabang');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openAddForm = () => {
    setEditingBranch(null);
    setFormName('');
    setFormAddress('');
    setFormPhone('');
    setFormIsActive(true);
    setShowForm(true);
  };

  const openEditForm = (branch: Branch) => {
    setEditingBranch(branch);
    setFormName(branch.name);
    setFormAddress(branch.address || '');
    setFormPhone(branch.phone || '');
    setFormIsActive(branch.is_active);
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName) {
      addToast('warning', 'Nama cabang wajib diisi');
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        name: formName,
        address: formAddress,
        phone: formPhone,
        is_active: formIsActive
      };

      if (editingBranch) {
        await updateBranch(editingBranch.id, payload);
        await logAuditTrail(
          user?.name || 'System',
          'update',
          'branches',
          `Mengubah data cabang: ${formName}`
        );
        addToast('success', 'Data cabang berhasil diperbarui');
      } else {
        await addBranch(payload);
        await logAuditTrail(
          user?.name || 'System',
          'create',
          'branches',
          `Menambahkan cabang baru: ${formName}`
        );
        addToast('success', 'Cabang baru berhasil ditambahkan');
      }
      setShowForm(false);
      loadData();
    } catch (err) {
      console.error(err);
      addToast('error', 'Gagal menyimpan data cabang');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (branch: Branch) => {
    try {
      const nextStatus = !branch.is_active;
      await updateBranch(branch.id, { is_active: nextStatus });
      await logAuditTrail(
        user?.name || 'System',
        'update',
        'branches',
        `Mengubah status aktif cabang ${branch.name} menjadi ${nextStatus ? 'Aktif' : 'Nonaktif'}`
      );
      addToast('success', `Cabang berhasil ${nextStatus ? 'diaktifkan' : 'dinonaktifkan'}`);
      loadData();
    } catch (err) {
      console.error(err);
      addToast('error', 'Gagal mengubah status cabang');
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteBranch(deleteTarget.id);
      await logAuditTrail(
        user?.name || 'System',
        'delete',
        'branches',
        `Menghapus cabang: ${deleteTarget.name}`
      );
      addToast('success', 'Cabang berhasil dihapus');
      setDeleteTarget(null);
      loadData();
    } catch (err) {
      console.error(err);
      addToast('error', 'Gagal menghapus cabang (mungkin masih digunakan oleh karyawan atau data transaksi)');
    }
  };

  const filteredBranches = branches.filter(branch => {
    if (search) {
      const q = search.toLowerCase();
      return (
        branch.name.toLowerCase().includes(q) ||
        (branch.address || '').toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--color-text-primary)' }}>Cabang</h1>
          <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
            {filteredBranches.length} cabang terdaftar
          </p>
        </div>
        <button onClick={openAddForm} className="btn btn-primary self-start">
          <Plus className="w-4 h-4 mr-1" /> Tambah Cabang
        </button>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--color-text-muted)' }} />
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Cari cabang..."
          className="input pl-10"
        />
      </div>

      {loading ? (
        <div className="card p-12 flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin" style={{ color: 'var(--color-accent)' }} />
          <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>Memuat data cabang...</p>
        </div>
      ) : filteredBranches.length === 0 ? (
        <div className="card p-12 text-center" style={{ background: 'var(--color-bg-surface)', borderColor: 'var(--color-border-light)' }}>
          <p className="font-semibold text-base" style={{ color: 'var(--color-text-primary)' }}>Cabang Tidak Ditemukan</p>
          <p className="text-xs mt-1" style={{ color: 'var(--color-text-muted)' }}>Belum ada cabang terdaftar atau kata pencarian tidak cocok.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredBranches.map((branch, i) => (
            <div key={branch.id} className="card p-5 animate-slide-up flex flex-col justify-between" style={{ animationDelay: `${i * 80}ms`, background: 'var(--color-bg-surface)', borderColor: 'var(--color-border-light)' }}>
              <div>
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ background: 'var(--color-accent-light)' }}>
                      <Building2 className="w-7 h-7" style={{ color: 'var(--color-accent)' }} />
                    </div>
                    <div>
                      <p className="font-bold" style={{ color: 'var(--color-text-primary)' }}>{branch.name}</p>
                      <span className={cn('badge', branch.is_active ? 'badge-success' : 'badge-danger')}>
                        {branch.is_active ? 'Aktif' : 'Nonaktif'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="space-y-3 text-sm">
                  <div className="flex items-start gap-2">
                    <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: 'var(--color-text-muted)' }} />
                    <span style={{ color: 'var(--color-text-secondary)' }}>{branch.address || '—'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--color-text-muted)' }} />
                    <span style={{ color: 'var(--color-text-secondary)' }}>{branch.phone || '—'}</span>
                  </div>
                </div>
              </div>

              <div className="flex gap-2 mt-4 pt-4 border-t" style={{ borderColor: 'var(--color-border-light)' }}>
                <button onClick={() => openEditForm(branch)} className="btn btn-outline btn-sm flex-1">
                  <Edit2 className="w-3.5 h-3.5 mr-1" /> Edit
                </button>
                <button onClick={() => handleToggleStatus(branch)} className="btn btn-outline btn-sm" title={branch.is_active ? 'Nonaktifkan' : 'Aktifkan'}>
                  {branch.is_active ? (
                    <ToggleRight className="w-4 h-4" style={{ color: 'var(--color-success)' }} />
                  ) : (
                    <ToggleLeft className="w-4 h-4" />
                  )}
                </button>
                <button onClick={() => setDeleteTarget(branch)} className="btn btn-outline btn-sm" title="Hapus">
                  <Trash2 className="w-3.5 h-3.5" style={{ color: 'var(--color-danger)' }} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Delete Confirmation */}
      {deleteTarget && (
        <ConfirmModal
          title="Hapus Cabang?"
          message={`Apakah Anda yakin ingin menghapus cabang "${deleteTarget.name}"? Tindakan ini tidak dapat dibatalkan.`}
          confirmLabel="Hapus"
          variant="danger"
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}

      {/* Branch Form Modal */}
      {showForm && (
        <div className="modal-backdrop flex items-center justify-center p-4">
          <div className="modal-content card w-full max-w-md overflow-hidden flex flex-col" style={{ background: 'var(--color-bg-surface)', borderColor: 'var(--color-border-light)' }}>
            <div className="p-4 border-b flex items-center justify-between" style={{ borderColor: 'var(--color-border-light)' }}>
              <h3 className="font-bold text-lg" style={{ color: 'var(--color-text-primary)' }}>
                {editingBranch ? 'Edit Cabang' : 'Tambah Cabang Baru'}
              </h3>
              <button onClick={() => setShowForm(false)} className="btn btn-ghost btn-icon btn-sm">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold mb-1">Nama Cabang *</label>
                <input
                  type="text"
                  value={formName}
                  onChange={e => setFormName(e.target.value)}
                  className="input"
                  placeholder="Contoh: Cabang Bandung"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1">Alamat Cabang</label>
                <textarea
                  value={formAddress}
                  onChange={e => setFormAddress(e.target.value)}
                  className="input min-h-[80px]"
                  placeholder="Contoh: Jl. Braga No. 78, Bandung"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1">Nomor Telepon</label>
                <input
                  type="text"
                  value={formPhone}
                  onChange={e => setFormPhone(e.target.value)}
                  className="input"
                  placeholder="Contoh: 022-4201234"
                />
              </div>

              <div className="flex items-center justify-between pt-2">
                <span className="text-sm font-semibold">Cabang Aktif</span>
                <button
                  type="button"
                  onClick={() => setFormIsActive(!formIsActive)}
                  className="btn btn-ghost p-1"
                >
                  {formIsActive ? (
                    <ToggleRight className="w-8 h-8" style={{ color: 'var(--color-success)' }} />
                  ) : (
                    <ToggleLeft className="w-8 h-8" style={{ color: 'var(--color-text-muted)' }} />
                  )}
                </button>
              </div>

              <div className="pt-4 border-t flex justify-end gap-2" style={{ borderColor: 'var(--color-border-light)' }}>
                <button type="button" onClick={() => setShowForm(false)} className="btn btn-outline" disabled={submitting}>
                  Batal
                </button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Simpan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
