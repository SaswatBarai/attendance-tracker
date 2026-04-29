'use client';

import { useEffect, useState, useCallback } from 'react';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { Role } from '@attendance-tracker/shared-types';
import { userApiClient } from '@/lib/api-client';
import { CreateCohortModal } from '@/components/super-admin/CreateCohortModal';
import { EditCohortModal } from '@/components/super-admin/EditCohortModal';
import Link from 'next/link';

interface Cohort {
  id: string;
  name: string;
  description: string | null;
  isActive: boolean;
  createdAt: string;
  _count: { admins: number; students: number; mentors: number; batches: number };
}

function CohortsContent() {
  const [cohorts, setCohorts] = useState<Cohort[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [editingCohort, setEditingCohort] = useState<Cohort | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    userApiClient
      .get<{ success: boolean; data: Cohort[] }>('/api/cohorts')
      .then((r) => setCohorts(r.data))
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function toggleStatus(id: string) {
    try {
      await userApiClient.patch(`/api/cohorts/${id}/toggle`);
      load();
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : 'Failed to update');
    }
  }

  async function deleteCohort(id: string, name: string) {
    if (!confirm(`Delete cohort "${name}"? This cannot be undone.`)) return;
    try {
      await userApiClient.delete(`/api/cohorts/${id}`);
      load();
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : 'Failed to delete');
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-[#121212]">Cohorts</h1>
          <p className="text-[#6B7280] text-sm mt-1">Manage all cohorts on the platform</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="px-5 py-2.5 bg-[#FF6B00] text-white text-sm font-semibold rounded-xl hover:bg-[#E55F00] transition"
        >
          + New Cohort
        </button>
      </div>

      {loading && (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="bg-white rounded-2xl h-20 animate-pulse border border-[#E5E7EB]"
            />
          ))}
        </div>
      )}

      {error && (
        <div className="bg-red-50 text-red-700 rounded-xl p-4 text-sm border border-red-200">
          {error}
        </div>
      )}

      {!loading && !error && cohorts.length === 0 && (
        <div className="text-center py-20 text-[#9CA3AF]">
          <p className="text-4xl mb-3">🏫</p>
          <p className="font-medium">No cohorts yet</p>
          <p className="text-sm mt-1">Create your first cohort to get started</p>
        </div>
      )}

      <div className="space-y-3">
        {cohorts.map((c) => (
          <div
            key={c.id}
            className="bg-white rounded-2xl p-5 border border-[#E5E7EB] flex flex-col sm:flex-row sm:items-center gap-4 hover:border-[#FF6B00]/40 transition"
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <Link
                  href={`/super-admin/cohorts/${c.id}`}
                  className="font-semibold text-[#121212] hover:text-[#FF6B00] transition truncate"
                >
                  {c.name}
                </Link>
                <span
                  className={`shrink-0 px-2 py-0.5 rounded-full text-xs font-medium ${
                    c.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                  }`}
                >
                  {c.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
              {c.description && <p className="text-[#6B7280] text-sm truncate">{c.description}</p>}
              <div className="flex gap-4 mt-2 text-xs text-[#9CA3AF]">
                <span>
                  {c._count.admins} admin{c._count.admins !== 1 ? 's' : ''}
                </span>
                <span>{c._count.students} students</span>
                <span>{c._count.mentors} mentors</span>
                <span>{c._count.batches} batches</span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <Link
                href={`/super-admin/cohorts/${c.id}`}
                className="px-3 py-1.5 rounded-lg border border-[#D1D5DB] text-xs font-medium text-[#374151] hover:bg-[#F9FAFB] transition"
              >
                View
              </Link>
              <button
                onClick={() => setEditingCohort(c)}
                className="px-3 py-1.5 rounded-lg border border-[#D1D5DB] text-xs font-medium text-[#374151] hover:bg-[#F9FAFB] transition"
              >
                Edit
              </button>
              <button
                onClick={() => toggleStatus(c.id)}
                className="px-3 py-1.5 rounded-lg border border-[#D1D5DB] text-xs font-medium text-[#374151] hover:bg-[#F9FAFB] transition"
              >
                {c.isActive ? 'Deactivate' : 'Activate'}
              </button>
              <button
                onClick={() => deleteCohort(c.id, c.name)}
                className="px-3 py-1.5 rounded-lg border border-red-200 text-xs font-medium text-red-600 hover:bg-red-50 transition"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      {showCreate && (
        <CreateCohortModal
          onClose={() => setShowCreate(false)}
          onCreated={() => {
            setShowCreate(false);
            load();
          }}
        />
      )}

      {editingCohort && (
        <EditCohortModal
          cohort={editingCohort}
          onClose={() => setEditingCohort(null)}
          onUpdated={() => {
            setEditingCohort(null);
            load();
          }}
        />
      )}
    </div>
  );
}

export default function CohortsPage() {
  return (
    <ProtectedRoute allowedRoles={[Role.SUPER_ADMIN]}>
      <CohortsContent />
    </ProtectedRoute>
  );
}
