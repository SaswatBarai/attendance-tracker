'use client';

import { useEffect, useState, useCallback } from 'react';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { Role } from '@attendance-tracker/shared-types';
import { userApiClient } from '@/lib/api-client';

interface AdminEntry {
  id: string;
  userId: string;
  createdAt: string;
  user: { id: string; name: string; email: string; isActive: boolean; createdAt: string };
  cohort: { id: string; name: string };
}

function AdminsContent() {
  const [admins, setAdmins] = useState<AdminEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(() => {
    setLoading(true);
    userApiClient
      .get<{ success: boolean; data: AdminEntry[] }>('/api/admins')
      .then((r) => setAdmins(r.data))
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function removeAdmin(userId: string, name: string) {
    if (!confirm(`Remove ${name} as admin? They will be downgraded to STUDENT.`)) return;
    try {
      await userApiClient.delete(`/api/admins/${userId}`);
      load();
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : 'Failed to remove admin');
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-[#121212]">Admins</h1>
          <p className="text-[#6B7280] text-sm mt-1">All admins across all cohorts</p>
        </div>
      </div>

      {loading && (
        <div className="bg-white rounded-2xl border border-[#E5E7EB] h-64 animate-pulse" />
      )}

      {error && (
        <div className="bg-red-50 text-red-700 rounded-xl p-4 text-sm border border-red-200">
          {error}
        </div>
      )}

      {!loading && !error && admins.length === 0 && (
        <div className="text-center py-20 text-[#9CA3AF]">
          <p className="text-4xl mb-3">👤</p>
          <p className="font-medium">No admins yet</p>
          <p className="text-sm mt-1">Create admins from the cohort detail page</p>
        </div>
      )}

      {admins.length > 0 && (
        <div className="bg-white rounded-2xl border border-[#E5E7EB] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px]">
              <thead>
                <tr className="border-b border-[#E5E7EB] bg-[#FAFAFA]">
                  <th className="text-left px-6 py-3 text-xs font-medium text-[#6B7280] uppercase tracking-wider">
                    Name
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-[#6B7280] uppercase tracking-wider">
                    Email
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-[#6B7280] uppercase tracking-wider">
                    Cohort
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-[#6B7280] uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F3F4F6]">
                {admins.map((a) => (
                  <tr key={a.id} className="hover:bg-[#FAFAFA]">
                    <td className="px-6 py-3.5 text-sm font-medium text-[#121212]">{a.user.name}</td>
                    <td className="px-6 py-3.5 text-sm text-[#6B7280]">{a.user.email}</td>
                    <td className="px-6 py-3.5">
                      <span className="px-2.5 py-1 rounded-lg bg-[#FFF3EC] text-[#FF6B00] text-xs font-medium">
                        {a.cohort.name}
                      </span>
                    </td>
                    <td className="px-6 py-3.5">
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-medium ${a.user.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}
                      >
                        {a.user.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-3.5 text-right">
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
        </div>
      )}
    </div>
  );
}

export default function AdminsPage() {
  return (
    <ProtectedRoute allowedRoles={[Role.SUPER_ADMIN]}>
      <AdminsContent />
    </ProtectedRoute>
  );
}
