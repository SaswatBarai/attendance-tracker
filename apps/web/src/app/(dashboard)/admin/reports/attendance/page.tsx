'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import type { Route } from 'next';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { Role } from '@attendance-tracker/shared-types';
import { attendanceApiClient } from '@/lib/api-client';
import { ChevronLeft, RefreshCw } from 'lucide-react';

interface BatchRow {
  batchId: string;
  batchName: string;
  total: number;
  present: number;
  absent: number;
  rate: number;
}

function RateBar({ rate }: { rate: number }) {
  const color = rate >= 75 ? 'bg-green-500' : rate >= 50 ? 'bg-amber-400' : 'bg-red-500';
  return (
    <div className="flex items-center gap-2 min-w-[120px]">
      <div className="flex-1 bg-[#F3F4F6] rounded-full h-2">
        <div className={`h-2 rounded-full ${color}`} style={{ width: `${rate}%` }} />
      </div>
      <span className="text-xs font-medium text-[#374151] w-9 text-right">{rate}%</span>
    </div>
  );
}

export default function BatchAttendanceReportPage() {
  const [rows, setRows] = useState<BatchRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams();
      if (from) params.set('from', from);
      if (to) params.set('to', to);
      const res = await attendanceApiClient.get<{ success: boolean; data: BatchRow[] }>(
        `/api/reports/by-batch?${params.toString()}`
      );
      setRows(res.data ?? []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load report');
    } finally {
      setLoading(false);
    }
  }, [from, to]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <ProtectedRoute allowedRoles={[Role.ADMIN]}>
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Link
            href={'/admin/reports' as Route}
            className="inline-flex items-center text-sm font-medium text-[#6B7280] hover:text-[#121212] transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            Reports
          </Link>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-[#121212]">Batch Attendance Report</h1>
            <p className="text-sm text-[#6B7280] mt-0.5">
              {rows.length} {rows.length === 1 ? 'batch' : 'batches'}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <input
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              className="border border-[#E5E7EB] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6B00]/40"
            />
            <span className="text-[#9CA3AF] text-sm">to</span>
            <input
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="border border-[#E5E7EB] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6B00]/40"
            />
            <button
              onClick={() => {
                setFrom('');
                setTo('');
              }}
              className="text-xs text-[#6B7280] hover:text-[#121212] px-2"
            >
              Clear
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-600">
            {error}
          </div>
        )}

        <div className="bg-white rounded-2xl border border-[#E5E7EB] overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#E5E7EB] bg-[#F9FAFB]">
                <th className="text-left px-5 py-3 font-medium text-[#374151]">Batch</th>
                <th className="text-right px-4 py-3 font-medium text-[#374151]">Total</th>
                <th className="text-right px-4 py-3 font-medium text-green-600">Present</th>
                <th className="text-right px-4 py-3 font-medium text-red-500">Absent</th>
                <th className="text-right px-5 py-3 font-medium text-[#374151]">Rate</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    <td colSpan={5} className="px-5 py-3">
                      <div className="h-5 bg-[#F9FAFB] rounded animate-pulse" />
                    </td>
                  </tr>
                ))
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-10 text-center text-[#9CA3AF]">
                    <RefreshCw className="w-8 h-8 mx-auto mb-2 text-[#E5E7EB]" />
                    No attendance data for the selected range
                  </td>
                </tr>
              ) : (
                rows.map((r) => (
                  <tr key={r.batchId} className="border-b border-[#F3F4F6] hover:bg-[#FAFAFA]">
                    <td className="px-5 py-3 font-medium text-[#121212]">{r.batchName}</td>
                    <td className="px-4 py-3 text-right text-[#374151]">{r.total}</td>
                    <td className="px-4 py-3 text-right text-green-600 font-medium">{r.present}</td>
                    <td className="px-4 py-3 text-right text-red-500 font-medium">{r.absent}</td>
                    <td className="px-5 py-3 flex justify-end">
                      <RateBar rate={r.rate} />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </ProtectedRoute>
  );
}
