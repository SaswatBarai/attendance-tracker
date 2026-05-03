'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import type { Route } from 'next';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { userApiClient } from '@/lib/api-client';
import { Role } from '@attendance-tracker/shared-types';
import { useAuth } from '@/hooks/useAuth';

interface Stats {
  totalStudents: number;
  totalBatches: number;
  totalMentors: number;
  activeCohorts: number;
}

interface StatCardProps {
  label: string;
  value: number | string;
  icon: string;
  href: Route;
  color: string;
}

function StatCard({ label, value, icon, href, color }: StatCardProps) {
  return (
    <Link
      href={href}
      className="bg-white rounded-2xl border border-[#E5E7EB] p-5 hover:shadow-sm transition-shadow block"
    >
      <div className="flex items-center justify-between mb-3">
        <span className="text-2xl">{icon}</span>
        <span className={`text-3xl font-bold ${color}`}>{value}</span>
      </div>
      <p className="text-sm text-[#6B7280]">{label}</p>
    </Link>
  );
}

export default function AdminDashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    userApiClient
      .get<{ success: boolean; data: Stats }>('/api/stats')
      .then((r) => setStats(r.data ?? null))
      .catch(() => {});
  }, []);

  return (
    <ProtectedRoute allowedRoles={[Role.ADMIN]}>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-[#121212]">Admin Dashboard</h1>
          <p className="text-sm text-[#6B7280] mt-0.5">Welcome back, {user?.name}</p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label="Students"
            value={stats?.totalStudents ?? '—'}
            icon="🎓"
            href="/admin/students"
            color="text-[#FF6B00]"
          />
          <StatCard
            label="Batches"
            value={stats?.totalBatches ?? '—'}
            icon="📦"
            href="/admin/batches"
            color="text-blue-600"
          />
          <StatCard
            label="Mentors"
            value={stats?.totalMentors ?? '—'}
            icon="👨‍🏫"
            href="/admin"
            color="text-purple-600"
          />
          <StatCard
            label="Active Cohorts"
            value={stats?.activeCohorts ?? '—'}
            icon="🏫"
            href="/admin"
            color="text-green-600"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Link
            href="/admin/students"
            className="bg-white rounded-2xl border border-[#E5E7EB] p-5 hover:shadow-sm transition-shadow"
          >
            <h2 className="font-semibold text-[#121212] mb-1">Student Management</h2>
            <p className="text-sm text-[#6B7280]">
              Enroll students individually or bulk-upload via CSV, manage shifts and batch
              assignments.
            </p>
            <p className="text-xs text-[#FF6B00] font-medium mt-3">View students →</p>
          </Link>

          <Link
            href="/admin/batches"
            className="bg-white rounded-2xl border border-[#E5E7EB] p-5 hover:shadow-sm transition-shadow"
          >
            <h2 className="font-semibold text-[#121212] mb-1">Batch Management</h2>
            <p className="text-sm text-[#6B7280]">
              Create and manage batches, view student distribution and shift breakdowns per batch.
            </p>
            <p className="text-xs text-[#FF6B00] font-medium mt-3">View batches →</p>
          </Link>
        </div>
      </div>
    </ProtectedRoute>
  );
}
