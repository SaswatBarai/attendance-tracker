'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { ShiftBadge } from '@/components/admin/ShiftBadge';
import { userApiClient } from '@/lib/api-client';
import { Role } from '@attendance-tracker/shared-types';

interface StudentInBatch {
  id: string;
  regno: string;
  shift: 'MORNING' | 'AFTERNOON';
  user: { id: string; name: string; email: string; isActive: boolean };
}

interface BatchDetail {
  id: string;
  name: string;
  createdAt: string;
  cohort: { id: string; name: string };
  students: StudentInBatch[];
  _count: { students: number };
}

export default function BatchDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [batch, setBatch] = useState<BatchDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editName, setEditName] = useState('');
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await userApiClient.get<{ success: boolean; data: BatchDetail }>(
        `/api/batches/${id}`
      );
      setBatch(res.data ?? null);
    } catch {
      setError('Batch not found');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleRename(e: React.FormEvent) {
    e.preventDefault();
    if (!editName.trim() || !batch) return;
    setSaving(true);
    try {
      await userApiClient.put(`/api/batches/${id}`, {
        name: editName.trim(),
        cohortId: batch.cohort.id,
      });
      setEditing(false);
      await load();
    } catch {
      alert('Failed to rename batch');
    } finally {
      setSaving(false);
    }
  }

  return (
    <ProtectedRoute allowedRoles={[Role.ADMIN]}>
      <div className="space-y-6 max-w-3xl">
        <div className="flex items-center gap-3">
          <Link href="/admin/batches" className="text-[#6B7280] hover:text-[#374151] text-sm">
            ← Batches
          </Link>
          {batch && (
            <>
              <span className="text-[#E5E7EB]">/</span>
              <span className="text-sm text-[#374151]">{batch.name}</span>
            </>
          )}
        </div>

        {error && (
          <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-600">
            {error}
          </div>
        )}

        {loading ? (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-20 bg-[#F9FAFB] rounded-xl animate-pulse" />
            ))}
          </div>
        ) : batch ? (
          <div className="space-y-4">
            {/* Header card */}
            <div className="bg-white rounded-2xl border border-[#E5E7EB] p-6">
              {editing ? (
                <form onSubmit={handleRename} className="flex gap-2">
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    autoFocus
                    className="border border-[#E5E7EB] rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6B00]/40 flex-1 max-w-xs"
                  />
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-3 py-1.5 text-xs font-medium text-white bg-[#FF6B00] rounded-lg disabled:opacity-50"
                  >
                    {saving ? 'Saving…' : 'Save'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditing(false)}
                    className="px-3 py-1.5 text-xs font-medium text-[#374151] border border-[#E5E7EB] rounded-lg"
                  >
                    Cancel
                  </button>
                </form>
              ) : (
                <div className="flex items-start justify-between">
                  <div>
                    <h1 className="text-xl font-bold text-[#121212]">{batch.name}</h1>
                    <p className="text-sm text-[#6B7280] mt-0.5">{batch.cohort.name}</p>
                  </div>
                  <button
                    onClick={() => {
                      setEditName(batch.name);
                      setEditing(true);
                    }}
                    className="text-xs text-[#6B7280] hover:text-[#374151] px-2 py-1 border border-[#E5E7EB] rounded-lg"
                  >
                    Rename
                  </button>
                </div>
              )}

              <div className="grid grid-cols-3 gap-4 mt-5 pt-4 border-t border-[#E5E7EB]">
                <div>
                  <p className="text-2xl font-bold text-[#FF6B00]">{batch._count.students}</p>
                  <p className="text-xs text-[#6B7280]">Total students</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-amber-600">
                    {batch.students.filter((s) => s.shift === 'MORNING').length}
                  </p>
                  <p className="text-xs text-[#6B7280]">Morning</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-indigo-600">
                    {batch.students.filter((s) => s.shift === 'AFTERNOON').length}
                  </p>
                  <p className="text-xs text-[#6B7280]">Afternoon</p>
                </div>
              </div>
            </div>

            {/* Students list */}
            <div className="bg-white rounded-2xl border border-[#E5E7EB] overflow-hidden">
              <div className="px-6 py-4 border-b border-[#E5E7EB] flex items-center justify-between">
                <h2 className="text-sm font-semibold text-[#121212]">Students</h2>
                <Link
                  href={`/admin/students?batchId=${batch.id}`}
                  className="text-xs text-[#FF6B00] hover:underline"
                >
                  Manage →
                </Link>
              </div>

              {batch.students.length === 0 ? (
                <div className="text-center py-10">
                  <p className="text-[#6B7280] text-sm">No students in this batch yet</p>
                </div>
              ) : (
                <div className="divide-y divide-[#E5E7EB]">
                  {batch.students.map((s) => (
                    <div key={s.id} className="px-6 py-3 flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-[#121212]">{s.user.name}</p>
                        <p className="text-xs text-[#6B7280]">
                          {s.user.email} · {s.regno}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <ShiftBadge shift={s.shift} size="sm" />
                        <Link
                          href={`/admin/students/${s.id}`}
                          className="text-xs text-[#FF6B00] hover:underline"
                        >
                          View
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : null}
      </div>
    </ProtectedRoute>
  );
}
