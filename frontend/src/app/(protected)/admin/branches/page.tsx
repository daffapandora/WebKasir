'use client';

import { MOCK_BRANCHES } from '@/lib/mock-data';
import { cn } from '@/lib/utils';
import { Building2, Plus, Edit2, MapPin, Phone, Users, ToggleRight, ToggleLeft } from 'lucide-react';

export default function BranchesPage() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold" style={{ color: 'var(--color-text-primary)' }}>Cabang</h1><p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>{MOCK_BRANCHES.length} cabang terdaftar</p></div>
        <button className="btn btn-primary"><Plus className="w-4 h-4" /> Tambah Cabang</button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {MOCK_BRANCHES.map((branch, i) => (
          <div key={branch.id} className="card p-5 animate-slide-up" style={{ animationDelay: `${i * 80}ms` }}>
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ background: 'var(--color-accent-light)' }}>
                  <Building2 className="w-7 h-7" style={{ color: 'var(--color-accent)' }} />
                </div>
                <div>
                  <p className="font-bold" style={{ color: 'var(--color-text-primary)' }}>{branch.name}</p>
                  <span className={cn('badge', branch.is_active ? 'badge-success' : 'badge-danger')}>{branch.is_active ? 'Aktif' : 'Nonaktif'}</span>
                </div>
              </div>
            </div>

            <div className="space-y-3 text-sm">
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: 'var(--color-text-muted)' }} />
                <span style={{ color: 'var(--color-text-secondary)' }}>{branch.address}</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--color-text-muted)' }} />
                <span style={{ color: 'var(--color-text-secondary)' }}>{branch.phone}</span>
              </div>
            </div>

            <div className="flex gap-2 mt-4 pt-4 border-t" style={{ borderColor: 'var(--color-border-light)' }}>
              <button className="btn btn-outline btn-sm flex-1"><Edit2 className="w-3.5 h-3.5" /> Edit</button>
              <button className="btn btn-outline btn-sm"><Users className="w-3.5 h-3.5" /></button>
              <button className="btn btn-outline btn-sm">{branch.is_active ? <ToggleRight className="w-4 h-4" style={{ color: 'var(--color-success)' }} /> : <ToggleLeft className="w-4 h-4" />}</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
