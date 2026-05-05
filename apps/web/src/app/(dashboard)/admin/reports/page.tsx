'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import type { Route } from 'next';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { Role } from '@attendance-tracker/shared-types';
import { attendanceApiClient } from '@/lib/api-client';
import { BarChart2, Users, TrendingUp, ChevronRight } from 'lucide-react';

interface Overview {
  total: number;
  present: number;
  absent: number;
  rate: number;
}

export default function ReportsPage() {
  const [overview, setOverview] = useState<Overview | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    attendanceApiClient
      .get<{ success: boolean; data: Overview }>('/api/reports/overview')
      .then((r) => setOverview(r.data ?? null))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <ProtectedRoute allowedRoles={[Role.ADMIN]}>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-[#121212]">Reports & Analytics</h1>
          <p className="text-sm text-[#6B7280] mt-0.5">Attendance insights across all batches</p>
        </div>

        {/* Overview Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {loading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-24 bg-[#F9FAFB] rounded-2xl animate-pulse" />
            ))
          ) : (
            <>
              {[
                {
                  label: 'Total Records',
                  value: overview?.total ?? 0,
                  color: 'text-[#121212]',
                  icon: '📋',
                },
                {
                  label: 'Present',
                  value: overview?.present ?? 0,
                  color: 'text-green-600',
                  icon: '✅',
                },
                {
                  label: 'Absent',
                  value: overview?.absent ?? 0,
                  color: 'text-red-500',
                  icon: '❌',
                },
                {
                  label: 'Overall Rate',
                  value: `${overview?.rate ?? 0}%`,
                  color: 'text-[#FF6B00]',
                  icon: '📊',
                },
              ].map(({ label, value, color, icon }) => (
                <div key={label} className="bg-white rounded-2xl border border-[#E5E7EB] p-5">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xl">{icon}</span>
                    <span className={`text-2xl font-bold ${color}`}>{value}</span>
                  </div>
                  <p className="text-sm text-[#6B7280]">{label}</p>
                </div>
              ))}
            </>
          )}
        </div>

        {/* Rate bar */}
        {overview && (
          <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="font-medium text-[#121212] flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-[#FF6B00]" />
                Overall Attendance Rate
              </span>
              <span className="text-2xl font-bold text-[#FF6B00]">{overview.rate}%</span>
            </div>
            <div className="w-full bg-[#F3F4F6] rounded-full h-3">
              <div
                className="h-3 rounded-full transition-all duration-500"
                style={{
                  width: `${overview.rate}%`,
                  backgroundColor:
                    overview.rate >= 75 ? '#22c55e' : overview.rate >= 50 ? '#f59e0b' : '#ef4444',
                }}
              />
            </div>
            <div className="flex justify-between text-xs text-[#9CA3AF] mt-1">
              <span>0%</span>
              <span>75% threshold</span>
              <span>100%</span>
            </div>
          </div>
        )}

        {/* Report Links */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Link
            href={'/admin/reports/attendance' as Route}
            className="bg-white rounded-2xl border border-[#E5E7EB] p-5 hover:border-[#FF6B00] hover:shadow-sm transition-all group"
          >
            <div className="flex items-start justify-between">
              <div className="w-10 h-10 bg-orange-50 rounded-xl flex items-center justify-center mb-3">
                <BarChart2 className="w-5 h-5 text-[#FF6B00]" />
              </div>
              <ChevronRight className="w-4 h-4 text-[#9CA3AF] group-hover:text-[#FF6B00] transition-colors" />
            </div>
            <h2 className="font-semibold text-[#121212] mb-1">Batch Attendance Report</h2>
            <p className="text-sm text-[#6B7280]">
              Attendance breakdown by batch with date range filters.
            </p>
          </Link>

          <Link
            href={'/admin/reports/students' as Route}
            className="bg-white rounded-2xl border border-[#E5E7EB] p-5 hover:border-[#FF6B00] hover:shadow-sm transition-all group"
          >
            <div className="flex items-start justify-between">
              <div className="w-10 h-10 bg-orange-50 rounded-xl flex items-center justify-center mb-3">
                <Users className="w-5 h-5 text-[#FF6B00]" />
              </div>
              <ChevronRight className="w-4 h-4 text-[#9CA3AF] group-hover:text-[#FF6B00] transition-colors" />
            </div>
            <h2 className="font-semibold text-[#121212] mb-1">Student Performance Report</h2>
            <p className="text-sm text-[#6B7280]">
              Per-student attendance percentages with CSV export.
            </p>
          </Link>
        </div>
      </div>
    </ProtectedRoute>
  );
}
