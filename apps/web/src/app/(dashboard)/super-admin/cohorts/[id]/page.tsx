'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { Role } from '@attendance-tracker/shared-types';
import { userApiClient } from '@/lib/api-client';
import { AssignAdminModal } from '@/components/super-admin/AssignAdminModal';
import { EditCohortModal } from '@/components/super-admin/EditCohortModal';
import Link from 'next/link';

interface CohortDetail {
  id: string;
  name: string;
  description: string | null;
  isActive: boolean;
  createdAt: string;
  admins: Array<{
    id: string;
    userId: string;
    user: { id: string; name: string; email: string };
  }>;
  batches: Array<{ id: string; name: string }>;
  _count: { students: number; mentors: number };
}

function CohortDetailContent() {
  const params = useParams();
  const id = params['id'] as string;

  const [cohort, setCohort] = useState<CohortDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAssign, setShowAssign] = useState(false);
  const [showEdit, setShowEdit] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    userApiClient
      .get<{ success: boolean; data: CohortDetail }>(`/api/cohorts/${id}`)
      .then((r) => setCohort(r.data))
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  async function removeAdmin(userId: string, name: string) {
    if (!confirm(`Remove ${name} as admin?`)) return;
    try {
      await userApiClient.delete(`/api/admins/${userId}`);
      load();
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : 'Failed to remove admin');
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 bg-gray-200 rounded-xl w-48 animate-pulse" />
        <div className="h-32 bg-white rounded-2xl animate-pulse border border-[#E5E7EB]" />
      </div>
    );
  }

  if (error || !cohort) {
    return (
      <div className="bg-red-50 text-red-700 rounded-xl p-4 text-sm border border-red-200">
        {error || 'Cohort not found'}
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center gap-3 mb-1">
        <Link
          href="/super-admin/cohorts"
          className="text-[#6B7280] hover:text-[#FF6B00] text-sm transition"
        >
          ← Cohorts
        </Link>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-8 mt-2">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-[#121212]">{cohort.name}</h1>
            <span
              className={`px-2 py-0.5 rounded-full text-xs font-medium ${cohort.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}
            >
              {cohort.isActive ? 'Active' : 'Inactive'}
            </span>
          </div>
          {cohort.description && (
            <p className="text-[#6B7280] text-sm mt-1">{cohort.description}</p>
          )}
        </div>
        <button
          onClick={() => setShowEdit(true)}
          className="px-4 py-2 rounded-xl border border-[#D1D5DB] text-sm font-medium text-[#374151] hover:bg-[#F9FAFB] transition"
        >
          Edit Cohort
        </button>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        {[
          { label: 'Admins', value: cohort.admins.length },
          { label: 'Students', value: cohort._count.students },
          { label: 'Mentors', value: cohort._count.mentors },
        ].map((s) => (
          <div
            key={s.label}
            className="bg-white rounded-2xl p-5 border border-[#E5E7EB] text-center"
          >
            <p className="text-2xl font-bold text-[#121212]">{s.value}</p>
            <p className="text-[#6B7280] text-sm mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Admins table */}
      <div className="bg-white rounded-2xl border border-[#E5E7EB] overflow-hidden mb-6">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E5E7EB]">
          <h2 className="font-semibold text-[#121212]">Admins</h2>
          <button
            onClick={() => setShowAssign(true)}
            className="px-4 py-2 bg-[#FF6B00] text-white text-xs font-semibold rounded-xl hover:bg-[#E55F00] transition"
          >
            + Add Admin
          </button>
        </div>

        {cohort.admins.length === 0 ? (
          <div className="px-6 py-10 text-center text-[#9CA3AF]">
            <p className="text-3xl mb-2">👤</p>
            <p className="text-sm">No admins assigned yet</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[480px]">
              <thead>
                <tr className="border-b border-[#E5E7EB]">
                  <th className="text-left px-6 py-3 text-xs font-medium text-[#6B7280] uppercase tracking-wider">
                    Name
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-[#6B7280] uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F3F4F6]">
                {cohort.admins.map((a) => (
                  <tr key={a.id} className="hover:bg-[#FAFAFA]">
                    <td className="px-6 py-3 text-sm font-medium text-[#121212]">{a.user.name}</td>
                    <td className="px-6 py-3 text-sm text-[#6B7280]">{a.user.email}</td>
                    <td className="px-6 py-3 text-right">
                      <button
                        onClick={() => removeAdmin(a.userId, a.user.name)}
                        className="text-xs text-red-500 hover:text-red-700 transition font-medium"
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Batches */}
      {cohort.batches.length > 0 && (
        <div className="bg-white rounded-2xl border border-[#E5E7EB] overflow-hidden">
          <div className="px-6 py-4 border-b border-[#E5E7EB]">
            <h2 className="font-semibold text-[#121212]">Batches ({cohort.batches.length})</h2>
          </div>
          <div className="divide-y divide-[#F3F4F6]">
            {cohort.batches.map((b) => (
              <div key={b.id} className="px-6 py-3 text-sm text-[#374151]">
                {b.name}
              </div>
            ))}
          </div>
        </div>
      )}

      {showAssign && (
        <AssignAdminModal
          cohortId={cohort.id}
          cohortName={cohort.name}
          onClose={() => setShowAssign(false)}
          onAssigned={() => {
            setShowAssign(false);
            load();
          }}
        />
      )}

      {showEdit && (
        <EditCohortModal
          cohort={cohort}
          onClose={() => setShowEdit(false)}
          onUpdated={() => {
            setShowEdit(false);
            load();
          }}
        />
      )}
    </div>
  );
}

export default function CohortDetailPage() {
  return (
    <ProtectedRoute allowedRoles={[Role.SUPER_ADMIN]}>
      <CohortDetailContent />
    </ProtectedRoute>
  );
}
