'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { Role } from '@attendance-tracker/shared-types';
import { attendanceApiClient } from '@/lib/api-client';
import { ChevronLeft, CheckCircle, XCircle, Clock } from 'lucide-react';

interface AttendanceRecord {
  id: string;
  status: 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED';
  method: string;
  createdAt: string;
  schedule: {
    period: number;
    shift: string;
    startTime: string;
    endTime: string;
    dayOfWeek: string;
    batch: { name: string };
    mentor: { user: { name: string } } | null;
  };
}

interface AttendanceStats {
  total: number;
  present: number;
  absent: number;
  percentage: number;
}

const STATUS_STYLES: Record<string, { icon: React.ReactNode; cls: string; label: string }> = {
  PRESENT: {
    icon: <CheckCircle className="w-4 h-4" />,
    cls: 'text-green-600 bg-green-50 border-green-200',
    label: 'Present',
  },
  ABSENT: {
    icon: <XCircle className="w-4 h-4" />,
    cls: 'text-red-500 bg-red-50 border-red-200',
    label: 'Absent',
  },
  LATE: {
    icon: <Clock className="w-4 h-4" />,
    cls: 'text-amber-600 bg-amber-50 border-amber-200',
    label: 'Late',
  },
  EXCUSED: {
    icon: <Clock className="w-4 h-4" />,
    cls: 'text-blue-600 bg-blue-50 border-blue-200',
    label: 'Excused',
  },
};

export default function AttendanceHistoryPage() {
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [stats, setStats] = useState<AttendanceStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    attendanceApiClient
      .get<{ success: boolean; data: { records: AttendanceRecord[]; stats: AttendanceStats } }>(
        '/api/attendance/my/history'
      )
      .then((r) => {
        setRecords(r.data?.records ?? []);
        setStats(r.data?.stats ?? null);
      })
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <ProtectedRoute allowedRoles={[Role.STUDENT]}>
      <div className="max-w-3xl mx-auto pb-12">
        <div className="flex items-center gap-3 mb-6">
          <Link
            href="/student"
            className="inline-flex items-center text-sm font-medium text-[#6B7280] hover:text-[#121212] transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            Dashboard
          </Link>
        </div>

        <h1 className="text-3xl font-bold text-[#121212] mb-1">Attendance History</h1>
        <p className="text-[#6B7280] mb-6">Your complete attendance record</p>

        {stats && (
          <div className="grid grid-cols-4 gap-3 mb-6">
            {[
              { label: 'Total', value: stats.total, color: 'text-[#121212]' },
              { label: 'Present', value: stats.present, color: 'text-green-600' },
              { label: 'Absent', value: stats.absent, color: 'text-red-500' },
              { label: 'Rate', value: `${stats.percentage}%`, color: 'text-[#FF6B00]' },
            ].map(({ label, value, color }) => (
              <div
                key={label}
                className="bg-white rounded-2xl border border-[#E5E7EB] p-4 text-center"
              >
                <p className={`text-2xl font-bold ${color}`}>{value}</p>
                <p className="text-xs text-[#6B7280] mt-1">{label}</p>
              </div>
            ))}
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-600 mb-4">
            {error}
          </div>
        )}

        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-16 bg-[#F9FAFB] rounded-xl animate-pulse" />
            ))}
          </div>
        ) : records.length === 0 ? (
          <div className="text-center py-16 text-[#6B7280]">
            <p className="text-lg font-medium">No attendance records yet</p>
            <p className="text-sm mt-1">Records will appear once your attendance is marked.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {records.map((r) => {
              const style = STATUS_STYLES[r.status] ?? STATUS_STYLES['ABSENT']!;
              return (
                <div
                  key={r.id}
                  className="bg-white rounded-xl border border-[#E5E7EB] px-4 py-3 flex items-center justify-between"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm text-[#121212]">
                        {r.schedule.batch.name}
                      </span>
                      <span className="text-xs text-[#9CA3AF]">· Period {r.schedule.period}</span>
                    </div>
                    <p className="text-xs text-[#6B7280] mt-0.5">
                      {r.schedule.dayOfWeek.charAt(0) + r.schedule.dayOfWeek.slice(1).toLowerCase()}{' '}
                      · {r.schedule.startTime}–{r.schedule.endTime}
                      {r.schedule.mentor && ` · ${r.schedule.mentor.user.name}`}
                    </p>
                    <p className="text-xs text-[#9CA3AF] mt-0.5">
                      {new Date(r.createdAt).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </p>
                  </div>
                  <span
                    className={`inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full border ${style.cls}`}
                  >
                    {style.icon}
                    {style.label}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}
