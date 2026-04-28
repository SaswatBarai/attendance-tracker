'use client';

import { useEffect, useState } from 'react';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { Role } from '@attendance-tracker/shared-types';
import { userApiClient } from '@/lib/api-client';
import Link from 'next/link';

interface Stats {
  totalUsers: number;
  totalCohorts: number;
  activeCohorts: number;
  totalAdmins: number;
  totalMentors: number;
  totalStudents: number;
}

function StatCard({
  label,
  value,
  sub,
  color,
}: {
  label: string;
  value: number | string;
  sub?: string;
  color: string;
}) {
  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-[#E5E7EB]">
      <p className="text-[#6B7280] text-sm font-medium mb-1">{label}</p>
      <p className={`text-3xl font-bold ${color}`}>{value}</p>
      {sub && <p className="text-[#9CA3AF] text-xs mt-1">{sub}</p>}
    </div>
  );
}

function SuperAdminContent() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    userApiClient
      .get<{ success: boolean; data: Stats }>('/api/stats')
      .then((r) => setStats(r.data))
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[#121212]">Super Admin Dashboard</h1>
        <p className="text-[#6B7280] text-sm mt-1">Manage cohorts, admins, and platform health.</p>
      </div>

      {loading && (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="bg-white rounded-2xl p-6 h-28 animate-pulse border border-[#E5E7EB]"
            />
          ))}
        </div>
      )}

      {error && (
        <div className="bg-red-50 text-red-700 rounded-xl p-4 text-sm border border-red-200">
          Failed to load stats: {error}
        </div>
      )}

      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          <StatCard label="Total Users" value={stats.totalUsers} color="text-[#121212]" />
          <StatCard
            label="Cohorts"
            value={stats.totalCohorts}
            sub={`${stats.activeCohorts} active`}
            color="text-[#FF6B00]"
          />
          <StatCard label="Admins" value={stats.totalAdmins} color="text-[#3B82F6]" />
          <StatCard label="Mentors" value={stats.totalMentors} color="text-[#8B5CF6]" />
          <StatCard label="Students" value={stats.totalStudents} color="text-[#10B981]" />
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Link
          href="/super-admin/cohorts"
          className="bg-white rounded-2xl p-6 border border-[#E5E7EB] hover:border-[#FF6B00] hover:shadow-md transition-all group"
        >
          <p className="text-2xl mb-2">🏫</p>
          <p className="font-semibold text-[#121212] group-hover:text-[#FF6B00] transition-colors">
            Manage Cohorts
          </p>
          <p className="text-[#6B7280] text-sm mt-1">Create cohorts and assign admins</p>
        </Link>
        <Link
          href="/super-admin/admins"
          className="bg-white rounded-2xl p-6 border border-[#E5E7EB] hover:border-[#FF6B00] hover:shadow-md transition-all group"
        >
          <p className="text-2xl mb-2">👤</p>
          <p className="font-semibold text-[#121212] group-hover:text-[#FF6B00] transition-colors">
            Manage Admins
          </p>
          <p className="text-[#6B7280] text-sm mt-1">Create admin accounts and assign them</p>
        </Link>
      </div>
    </div>
  );
}

export default function SuperAdminDashboardPage() {
  return (
    <ProtectedRoute allowedRoles={[Role.SUPER_ADMIN]}>
      <SuperAdminContent />
    </ProtectedRoute>
  );
}
