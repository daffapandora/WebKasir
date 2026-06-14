'use client';

import { useState, useEffect } from 'react';
import {
  getEmployees,
  addEmployee,
  updateEmployee,
  deleteEmployee,
  getBranches,
  getShifts,
  logAuditTrail
} from '@/lib/firebase-service';
import { formatDateTime, formatCurrency, cn } from '@/lib/utils';
import { useUIStore } from '@/store/ui-store';
import { useAuthStore } from '@/store/auth-store';
import {
  UserCog, Search, Plus, Edit2, Trash2, Shield, Key, X, Loader2, Phone,
  Clock, Warehouse, DollarSign, FileText
} from 'lucide-react';
import { ConfirmModal } from '@/components/shared/confirm-modal';
import { Pagination, usePagination } from '@/components/shared/pagination';
import type { Employee, Branch, Role, Shift } from '@/types';

export default function EmployeesPage() {
  const { addToast } = useUIStore();
  const { user } = useAuthStore();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [shifts, setShifts] = useState<Shift[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [loadingShifts, setLoadingShifts] = useState(false);
  const [activeTab, setActiveTab] = useState<'list' | 'attendance'>('list');
  
  // Search states
  const [search, setSearch] = useState('');
  const [shiftSearch, setShiftSearch] = useState('');

  // Form modal states
  const [showForm, setShowForm] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formRole, setFormRole] = useState<Role>('cashier');
  const [formBranchId, setFormBranchId] = useState<number | ''>('');
  const [submitting, setSubmitting] = useState(false);

  // A4: Delete confirm
  const [deleteTarget, setDeleteTarget] = useState<Employee | null>(null);

  // A7: Phone validation error
  const [phoneError, setPhoneError] = useState('');

  const loadData = async () => {
    try {
      setLoading(true);
      const [empList, branchList] = await Promise.all([getEmployees(), getBranches()]);
      setEmployees(empList);
      setBranches(branchList);
    } catch (err) {
      console.error(err);
      addToast('error', 'Gagal memuat data karyawan');
    } finally {
      setLoading(false);
    }
  };

  const loadShiftsData = async () => {
    try {
      setLoadingShifts(true);
      const shiftList = await getShifts();
      setShifts(shiftList);
    } catch (err) {
      console.error(err);
      addToast('error', 'Gagal memuat log absensi / shift');
    } finally {
      setLoadingShifts(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (activeTab === 'attendance') {
      loadShiftsData();
    }
  }, [activeTab]);

  const openAddForm = () => {
    setEditingEmployee(null);
    setFormName(''); setFormEmail(''); setFormPhone('');
    setFormRole('cashier');
    setFormBranchId(branches[0]?.id || '');
    setPhoneError('');
    setShowForm(true);
  };

  const openEditForm = (emp: Employee) => {
    setEditingEmployee(emp);
    setFormName(emp.name); setFormEmail(emp.email);
    setFormPhone(emp.phone || '');
    setFormRole(emp.role);
    setFormBranchId(emp.branch_id);
    setPhoneError('');
    setShowForm(true);
  };

  // A7: Validate phone format
  const validatePhone = (phone: string): boolean => {
    if (!phone) {
      setPhoneError('Nomor telepon wajib diisi');
      return false;
    }
    if (!/^08\d{8,11}$/.test(phone)) {
      setPhoneError('Format harus diawali 08 dan 10-13 digit');
      return false;
    }
    setPhoneError('');
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName || !formEmail || !formBranchId) {
      addToast('warning', 'Nama, Email, dan Cabang wajib diisi');
      return;
    }
    // A7: Validate phone
    if (!validatePhone(formPhone)) return;

    try {
      setSubmitting(true);
      const br = branches.find(b => b.id === Number(formBranchId));
      const payload = {
        name: formName, email: formEmail, phone: formPhone,
        role: formRole, branch_id: Number(formBranchId),
        branch_name: br ? br.name : 'Toko Pusat',
        is_active: editingEmployee ? editingEmployee.is_active : true,
      };
      if (editingEmployee) {
        await updateEmployee(editingEmployee.id, payload);
        await logAuditTrail(user?.name || 'System', 'update', 'employees', `Mengubah data karyawan: ${formName}`);
        addToast('success', 'Data karyawan berhasil diperbarui');
      } else {
        await addEmployee(payload);
        await logAuditTrail(user?.name || 'System', 'create', 'employees', `Menambahkan karyawan baru: ${formName}`);
        addToast('success', 'Karyawan berhasil ditambahkan');
      }
      setShowForm(false);
      loadData();
    } catch (err) {
      console.error(err);
      addToast('error', 'Gagal menyimpan data karyawan');
    } finally {
      setSubmitting(false);
    }
  };

  // A4: Confirm delete
  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteEmployee(deleteTarget.id);
      await logAuditTrail(user?.name || 'System', 'delete', 'employees', `Menghapus karyawan: ${deleteTarget.name}`);
      addToast('success', 'Karyawan berhasil dihapus');
      setDeleteTarget(null);
      loadData();
    } catch (err) {
      console.error(err);
      addToast('error', 'Gagal menghapus karyawan');
    }
  };

  const filteredEmployees = employees.filter(emp => {
    if (search) {
      const q = search.toLowerCase();
      return emp.name.toLowerCase().includes(q) || emp.email.toLowerCase().includes(q);
    }
    return true;
  });

  const filteredShifts = shifts.filter(s => {
    if (shiftSearch) {
      const q = shiftSearch.toLowerCase();
      return s.cashier_name.toLowerCase().includes(q) || s.branch_name.toLowerCase().includes(q);
    }
    return true;
  });

  // Shift/Attendance Pagination
  const shiftPagination = usePagination(filteredShifts, 20);

  const roleLabels: Record<string, string> = { super_admin: 'Super Admin', admin: 'Admin', manager: 'Manager', cashier: 'Kasir' };
  const roleColors: Record<string, string> = { super_admin: 'badge-danger', admin: 'badge-info', manager: 'badge-warning', cashier: 'badge-success' };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--color-text-primary)' }}>Karyawan & Absensi</h1>
          <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
            Manajemen daftar staff, hak akses, dan log shift (absensi) kasir.
          </p>
        </div>
        {activeTab === 'list' && (
          <button onClick={openAddForm} className="btn btn-primary self-start">
            <Plus className="w-4 h-4 mr-1" /> Tambah Karyawan
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex border-b" style={{ borderColor: 'var(--color-border-light)' }}>
        <button
          onClick={() => setActiveTab('list')}
          className={cn(
            'px-5 py-2.5 font-medium text-sm border-b-2 -mb-[2px] transition-all',
            activeTab === 'list'
              ? 'border-[var(--color-accent)] text-[var(--color-accent)] font-semibold'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          )}
        >
          Daftar Karyawan
        </button>
        <button
          onClick={() => setActiveTab('attendance')}
          className={cn(
            'px-5 py-2.5 font-medium text-sm border-b-2 -mb-[2px] transition-all',
            activeTab === 'attendance'
              ? 'border-[var(--color-accent)] text-[var(--color-accent)] font-semibold'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          )}
        >
          Log Absensi / Shift Kasir
        </button>
      </div>

      {activeTab === 'list' ? (
        <>
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--color-text-muted)' }} />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Cari karyawan..."
              className="input pl-10"
            />
          </div>

          {loading ? (
            <div className="card p-12 flex flex-col items-center justify-center gap-3">
              <Loader2 className="w-8 h-8 animate-spin" style={{ color: 'var(--color-accent)' }} />
              <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>Memuat data karyawan...</p>
            </div>
          ) : filteredEmployees.length === 0 ? (
            <div className="card p-12 text-center" style={{ background: 'var(--color-bg-surface)', borderColor: 'var(--color-border-light)' }}>
              <p className="font-semibold text-base" style={{ color: 'var(--color-text-primary)' }}>Karyawan Tidak Ditemukan</p>
              <p className="text-xs mt-1" style={{ color: 'var(--color-text-muted)' }}>Coba ubah kata pencarian Anda.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {filteredEmployees.map(emp => (
                <div key={emp.id} className="card p-5 animate-slide-up flex flex-col justify-between" style={{ background: 'var(--color-bg-surface)', borderColor: 'var(--color-border-light)' }}>
                  <div>
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-lg font-bold text-white flex-shrink-0" style={{ background: 'var(--color-accent)' }}>
                          {emp.name.charAt(0)}
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold truncate" style={{ color: 'var(--color-text-primary)' }}>{emp.name}</p>
                          <p className="text-xs text-muted truncate" style={{ color: 'var(--color-text-muted)' }}>{emp.email}</p>
                        </div>
                      </div>
                      <span className={cn('badge flex-shrink-0', roleColors[emp.role])}>{roleLabels[emp.role]}</span>
                    </div>

                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span style={{ color: 'var(--color-text-muted)' }}>Cabang</span>
                        <span style={{ color: 'var(--color-text-primary)' }}>{emp.branch_name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span style={{ color: 'var(--color-text-muted)' }}>Telepon</span>
                        <span style={{ color: emp.phone ? 'var(--color-text-primary)' : 'var(--color-danger)' }}>
                          {emp.phone || '⚠️ Belum diisi'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span style={{ color: 'var(--color-text-muted)' }}>Status</span>
                        <span className={cn('badge', emp.is_active ? 'badge-success' : 'badge-danger')}>{emp.is_active ? 'Aktif' : 'Nonaktif'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2 mt-4 pt-4 border-t" style={{ borderColor: 'var(--color-border-light)' }}>
                    <button onClick={() => openEditForm(emp)} className="btn btn-outline btn-sm flex-1"><Edit2 className="w-3.5 h-3.5 mr-1" /> Edit</button>
                    <button onClick={() => setDeleteTarget(emp)} className="btn btn-outline btn-sm" title="Hapus"><Trash2 className="w-3.5 h-3.5" style={{ color: 'var(--color-danger)' }} /></button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      ) : (
        <>
          {/* Attendance Tab */}
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--color-text-muted)' }} />
            <input
              type="text"
              value={shiftSearch}
              onChange={e => setShiftSearch(e.target.value)}
              placeholder="Cari kasir / cabang..."
              className="input pl-10"
            />
          </div>

          {loadingShifts ? (
            <div className="card p-12 flex flex-col items-center justify-center gap-3">
              <Loader2 className="w-8 h-8 animate-spin" style={{ color: 'var(--color-accent)' }} />
              <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>Memuat log absensi...</p>
            </div>
          ) : filteredShifts.length === 0 ? (
            <div className="card p-12 text-center" style={{ background: 'var(--color-bg-surface)', borderColor: 'var(--color-border-light)' }}>
              <Clock className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="font-semibold text-base" style={{ color: 'var(--color-text-primary)' }}>Tidak Ada Log Absensi</p>
              <p className="text-xs mt-1" style={{ color: 'var(--color-text-muted)' }}>Belum ada karyawan yang melakukan buka/tutup shift kasir.</p>
            </div>
          ) : (
            <div className="card overflow-hidden" style={{ background: 'var(--color-bg-surface)', borderColor: 'var(--color-border-light)' }}>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr style={{ background: 'var(--color-bg-elevated)' }}>
                      <th className="text-left py-3 px-4 font-medium" style={{ color: 'var(--color-text-secondary)' }}>Kasir</th>
                      <th className="text-left py-3 px-4 font-medium" style={{ color: 'var(--color-text-secondary)' }}>Cabang</th>
                      <th className="text-left py-3 px-4 font-medium" style={{ color: 'var(--color-text-secondary)' }}>Buka Shift</th>
                      <th className="text-left py-3 px-4 font-medium" style={{ color: 'var(--color-text-secondary)' }}>Tutup Shift</th>
                      <th className="text-right py-3 px-4 font-medium" style={{ color: 'var(--color-text-secondary)' }}>Modal Awal</th>
                      <th className="text-right py-3 px-4 font-medium" style={{ color: 'var(--color-text-secondary)' }}>Kas Akhir</th>
                      <th className="text-right py-3 px-4 font-medium" style={{ color: 'var(--color-text-secondary)' }}>Selisih</th>
                      <th className="text-right py-3 px-4 font-medium" style={{ color: 'var(--color-text-secondary)' }}>Total Omset</th>
                      <th className="text-center py-3 px-4 font-medium" style={{ color: 'var(--color-text-secondary)' }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {shiftPagination.paginatedItems.map(s => {
                      const diff = s.difference ?? 0;
                      return (
                        <tr key={s.id} className="border-b hover:bg-[var(--color-bg-elevated)] transition-colors" style={{ borderColor: 'var(--color-border-light)' }}>
                          <td className="py-3 px-4 font-medium" style={{ color: 'var(--color-text-primary)' }}>{s.cashier_name}</td>
                          <td className="py-3 px-4 text-xs" style={{ color: 'var(--color-text-secondary)' }}>{s.branch_name}</td>
                          <td className="py-3 px-4 text-xs" style={{ color: 'var(--color-text-secondary)' }}>{formatDateTime(s.opened_at)}</td>
                          <td className="py-3 px-4 text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                            {s.closed_at ? formatDateTime(s.closed_at) : '—'}
                          </td>
                          <td className="py-3 px-4 text-right tabular-nums text-xs" style={{ color: 'var(--color-text-primary)' }}>
                            {formatCurrency(s.opening_cash)}
                          </td>
                          <td className="py-3 px-4 text-right tabular-nums text-xs" style={{ color: 'var(--color-text-primary)' }}>
                            {s.closing_cash !== undefined ? formatCurrency(s.closing_cash) : '—'}
                          </td>
                          <td className="py-3 px-4 text-right tabular-nums text-xs font-semibold">
                            {s.status === 'closed' ? (
                              <span style={{ color: diff < 0 ? 'var(--color-danger)' : diff > 0 ? 'var(--color-success)' : 'inherit' }}>
                                {diff === 0 ? '0' : (diff > 0 ? '+' : '') + formatCurrency(diff)}
                              </span>
                            ) : (
                              '—'
                            )}
                          </td>
                          <td className="py-3 px-4 text-right tabular-nums font-bold" style={{ color: 'var(--color-text-primary)' }}>
                            {formatCurrency(s.total_sales)}
                          </td>
                          <td className="py-3 px-4 text-center">
                            <span className={cn('badge text-xs uppercase font-bold px-2 py-0.5', s.status === 'open' ? 'badge-success animate-pulse' : 'badge-neutral')}>
                              {s.status === 'open' ? 'Aktif' : 'Selesai'}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <div className="p-4 border-t" style={{ borderColor: 'var(--color-border-light)' }}>
                <Pagination
                  currentPage={shiftPagination.currentPage}
                  totalPages={shiftPagination.totalPages}
                  totalItems={shiftPagination.totalItems}
                  perPage={shiftPagination.perPage}
                  onPageChange={shiftPagination.handlePageChange}
                  onPerPageChange={shiftPagination.handlePerPageChange}
                />
              </div>
            </div>
          )}
        </>
      )}

      {/* A4: Delete Confirm */}
      {deleteTarget && (
        <ConfirmModal
          title="Hapus Karyawan?"
          message={`Apakah Anda yakin ingin menghapus "${deleteTarget.name}"? Tindakan ini tidak dapat dibatalkan.`}
          confirmLabel="Hapus"
          variant="danger"
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}

      {/* Employee Form Modal */}
      {showForm && (
        <div className="modal-backdrop flex items-center justify-center p-4">
          <div className="modal-content card w-full max-w-md overflow-hidden flex flex-col" style={{ background: 'var(--color-bg-surface)', borderColor: 'var(--color-border-light)' }}>
            <div className="p-4 border-b flex items-center justify-between" style={{ borderColor: 'var(--color-border-light)' }}>
              <h3 className="font-bold text-lg" style={{ color: 'var(--color-text-primary)' }}>
                {editingEmployee ? 'Edit Karyawan' : 'Tambah Karyawan Baru'}
              </h3>
              <button onClick={() => setShowForm(false)} className="btn btn-ghost btn-icon btn-sm"><X className="w-5 h-5" /></button>
            </div>

            <form onSubmit={handleSubmit} className="p-4 space-y-4">
              <div><label className="block text-xs font-semibold mb-1">Nama Karyawan *</label><input type="text" value={formName} onChange={e => setFormName(e.target.value)} className="input" placeholder="Contoh: Siti Aisyah" required /></div>
              <div><label className="block text-xs font-semibold mb-1">Email *</label><input type="email" value={formEmail} onChange={e => setFormEmail(e.target.value)} className="input" placeholder="siti@tokoku.id" required /></div>
              {/* A7: Phone required with validation */}
              <div>
                <label className="block text-xs font-semibold mb-1">Nomor Telepon * <span className="text-[10px] font-normal" style={{ color: 'var(--color-text-muted)' }}>(Format: 08xxxxxxxxxx)</span></label>
                <input
                  type="text"
                  value={formPhone}
                  onChange={e => { setFormPhone(e.target.value); if (phoneError) validatePhone(e.target.value); }}
                  className={cn('input', phoneError && 'border-red-500')}
                  placeholder="08xxxxxxxxxx"
                  required
                />
                {phoneError && <p className="text-xs mt-1" style={{ color: 'var(--color-danger)' }}>{phoneError}</p>}
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1">Jabatan / Role *</label>
                <select value={formRole} onChange={e => setFormRole(e.target.value as Role)} className="input" required>
                  <option value="super_admin">Super Admin</option>
                  <option value="admin">Admin</option>
                  <option value="manager">Manager</option>
                  <option value="cashier">Kasir / Cashier</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1">Cabang Penempatan *</label>
                <select value={formBranchId} onChange={e => setFormBranchId(Number(e.target.value))} className="input" required>
                  <option value="">Pilih Cabang...</option>
                  {branches.map(b => (<option key={b.id} value={b.id}>{b.name}</option>))}
                </select>
              </div>

              <div className="pt-4 border-t flex justify-end gap-2" style={{ borderColor: 'var(--color-border-light)' }}>
                <button type="button" onClick={() => setShowForm(false)} className="btn btn-outline" disabled={submitting}>Batal</button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Simpan Karyawan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
