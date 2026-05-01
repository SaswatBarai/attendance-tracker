'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { userApiClient } from '@/lib/api-client';
import { Role } from '@attendance-tracker/shared-types';

interface Cohort {
  id: string;
  name: string;
}

interface Batch {
  id: string;
  name: string;
  createdAt: string;
  cohort: { id: string; name: string };
  _count: { students: number };
}

export default function BatchesPage() {
  const [batches, setBatches] = useState<Batch[]>([]);
  const [cohorts, setCohorts] = useState<Cohort[]>([]);
  const [filterCohort, setFilterCohort] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');
  const [newCohortId, setNewCohortId] = useState('');
  const [creating, setCreating] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams();
      if (filterCohort) params.set('cohortId', filterCohort);

      const [batchesRes, cohortsRes] = await Promise.all([
        userApiClient.get<{ success: boolean; data: Batch[] }>(`/api/batches?${params.toString()}`),
        userApiClient.get<{ success: boolean; data: Cohort[] }>('/api/cohorts'),
      ]);

      setBatches(batchesRes.data ?? []);
      setCohorts(cohortsRes.data ?? []);
    } catch {
      setError('Failed to load batches');
    } finally {
      setLoading(false);
    }
  }, [filterCohort]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!newName.trim() || !newCohortId) return;
    setCreating(true);
    try {
      await userApiClient.post('/api/batches', { name: newName.trim(), cohortId: newCohortId });
      setNewName('');
      setNewCohortId('');
      setShowCreate(false);
      await load();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Failed to create batch');
    } finally {
      setCreating(false);
    }
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Delete batch "${name}"? Students will be unassigned.`)) return;
    try {
      await userApiClient.delete(`/api/batches/${id}`);
      await load();
    } catch {
      alert('Failed to delete batch');
    }
  }

  return (
    <ProtectedRoute allowedRoles={[Role.ADMIN]}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-[#121212]">Batches</h1>
            <p className="text-sm text-[#6B7280] mt-0.5">
              {batches.length} batch{batches.length !== 1 ? 'es' : ''}
            </p>
          </div>
          <button
            onClick={() => setShowCreate(true)}
            className="px-4 py-2 text-sm font-medium text-white bg-[#FF6B00] rounded-lg hover:bg-[#E55A00] transition-colors"
          >
            + New Batch
          </button>
        </div>

        <div className="flex gap-3">
          <select
            value={filterCohort}
            onChange={(e) => setFilterCohort(e.target.value)}
            className="border border-[#E5E7EB] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6B00]/40"
          >
            <option value="">All cohorts</option>
            {cohorts.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        {error && (
          <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-600">
            {error}
          </div>
        )}

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-32 bg-[#F9FAFB] rounded-xl animate-pulse" />
            ))}
          </div>
        ) : batches.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-4xl mb-3">📦</p>
            <p className="text-[#6B7280] text-sm">No batches yet — create one to get started</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {batches.map((batch) => (
              <div
                key={batch.id}
                className="bg-white rounded-2xl border border-[#E5E7EB] p-5 hover:shadow-sm transition-shadow"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-[#121212]">{batch.name}</h3>
                    <p className="text-xs text-[#6B7280] mt-0.5">{batch.cohort.name}</p>
                  </div>
                  <span className="text-2xl font-bold text-[#FF6B00]">{batch._count.students}</span>
                </div>
                <p className="text-xs text-[#9CA3AF] mb-4">
                  {batch._count.students} student{batch._count.students !== 1 ? 's' : ''}
                </p>
                <div className="flex gap-2">
                  <Link
                    href={`/admin/batches/${batch.id}`}
                    className="flex-1 text-center px-3 py-1.5 text-xs font-medium text-[#FF6B00] border border-[#FF6B00]/30 rounded-lg hover:bg-[#FF6B00]/5 transition-colors"
                  >
                    View
                  </Link>
                  <button
                    onClick={() => handleDelete(batch.id, batch.name)}
                    className="px-3 py-1.5 text-xs font-medium text-[#EF4444] border border-red-200 rounded-lg hover:bg-red-50 transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Create batch modal */}
        {showCreate && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm mx-4 p-6">
              <h2 className="text-lg font-semibold text-[#121212] mb-4">New Batch</h2>
              <form onSubmit={handleCreate} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-[#374151] mb-1">
                    Batch Name
                  </label>
                  <input
                    type="text"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    autoFocus
                    className="w-full border border-[#E5E7EB] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6B00]/40"
                    placeholder="e.g. Batch A"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#374151] mb-1">Cohort</label>
                  <select
                    value={newCohortId}
                    onChange={(e) => setNewCohortId(e.target.value)}
                    className="w-full border border-[#E5E7EB] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6B00]/40"
                  >
                    <option value="">Select cohort…</option>
                    {cohorts.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex gap-3 pt-1">
                  <button
                    type="button"
                    onClick={() => setShowCreate(false)}
                    className="flex-1 px-4 py-2 text-sm font-medium text-[#374151] border border-[#E5E7EB] rounded-lg hover:bg-[#F9FAFB] transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={creating || !newName.trim() || !newCohortId}
                    className="flex-1 px-4 py-2 text-sm font-medium text-white bg-[#FF6B00] rounded-lg hover:bg-[#E55A00] transition-colors disabled:opacity-50"
                  >
                    {creating ? 'Creating…' : 'Create'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}
