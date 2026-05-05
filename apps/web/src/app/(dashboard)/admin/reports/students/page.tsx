'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import type { Route } from 'next';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { Role } from '@attendance-tracker/shared-types';
import { attendanceApiClient, userApiClient } from '@/lib/api-client';
import { ChevronLeft, Download, AlertTriangle } from 'lucide-react';

interface StudentRow {
  studentId: string;
  name: string;
  email: string;
  regno: string;
  batchName: string;
  total: number;
  present: number;
  absent: number;
  rate: number;
}

interface Batch {
  id: string;
  name: string;
}

function RateBadge({ rate }: { rate: number }) {
  const cls =
    rate >= 75
      ? 'bg-green-50 text-green-700 border-green-200'
      : rate >= 50
        ? 'bg-amber-50 text-amber-700 border-amber-200'
        : 'bg-red-50 text-red-600 border-red-200';
  return (
    <span
      className={`inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full border ${cls}`}
    >
      {rate < 75 && <AlertTriangle className="w-3 h-3" />}
      {rate}%
    </span>
  );
}

export default function StudentReportPage() {
  const [rows, setRows] = useState<StudentRow[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [loading, setLoading] = useState(false);
  const [batchId, setBatchId] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    userApiClient
      .get<{ success: boolean; data: Batch[] }>('/api/batches')
      .then((r) => setBatches(r.data ?? []))
      .catch(() => {});
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams();
      if (batchId) params.set('batchId', batchId);
      if (from) params.set('from', from);
      if (to) params.set('to', to);
      const res = await attendanceApiClient.get<{ success: boolean; data: StudentRow[] }>(
        `/api/reports/by-student?${params.toString()}`
      );
      setRows(res.data ?? []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load report');
    } finally {
      setLoading(false);
    }
  }, [batchId, from, to]);

  useEffect(() => {
    void load();
  }, [load]);

  function handleExport() {
    const params = new URLSearchParams();
    if (batchId) params.set('batchId', batchId);
    if (from) params.set('from', from);
    if (to) params.set('to', to);
    const url = `${process.env['NEXT_PUBLIC_ATTENDANCE_SERVICE_URL'] ?? 'http://localhost:3003'}/api/reports/export/students?${params.toString()}`;
    window.open(url, '_blank');
  }

  const lowPerformers = rows.filter((r) => r.rate < 75).length;

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

        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-[#121212]">Student Performance Report</h1>
            <p className="text-sm text-[#6B7280] mt-0.5">
              {rows.length} students
              {lowPerformers > 0 && (
                <span className="ml-2 text-amber-600 font-medium">· {lowPerformers} below 75%</span>
              )}
            </p>
          </div>
          <button
            onClick={handleExport}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-[#FF6B00] rounded-lg hover:bg-[#E55A00] transition-colors self-start"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3">
          <select
            value={batchId}
            onChange={(e) => setBatchId(e.target.value)}
            className="border border-[#E5E7EB] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6B00]/40"
          >
            <option value="">All batches</option>
            {batches.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
          <input
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className="border border-[#E5E7EB] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6B00]/40"
          />
          <span className="self-center text-[#9CA3AF] text-sm">to</span>
          <input
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="border border-[#E5E7EB] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6B00]/40"
          />
          <button
            onClick={() => {
              setBatchId('');
              setFrom('');
              setTo('');
            }}
            className="text-xs text-[#6B7280] hover:text-[#121212] px-2"
          >
            Clear
          </button>
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
                <th className="text-left px-5 py-3 font-medium text-[#374151]">Student</th>
                <th className="text-left px-4 py-3 font-medium text-[#374151]">Batch</th>
                <th className="text-right px-4 py-3 font-medium text-[#374151]">Total</th>
                <th className="text-right px-4 py-3 font-medium text-green-600">Present</th>
                <th className="text-right px-4 py-3 font-medium text-red-500">Absent</th>
                <th className="text-center px-5 py-3 font-medium text-[#374151]">Rate</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i}>
                    <td colSpan={6} className="px-5 py-3">
                      <div className="h-5 bg-[#F9FAFB] rounded animate-pulse" />
                    </td>
                  </tr>
                ))
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-10 text-center text-[#9CA3AF]">
                    No attendance data for the selected filters
                  </td>
                </tr>
              ) : (
                rows.map((r) => (
                  <tr
                    key={r.studentId}
                    className={`border-b border-[#F3F4F6] hover:bg-[#FAFAFA] ${r.rate < 75 ? 'bg-red-50/30' : ''}`}
                  >
                    <td className="px-5 py-3">
                      <p className="font-medium text-[#121212]">{r.name}</p>
                      <p className="text-xs text-[#9CA3AF]">{r.regno}</p>
                    </td>
                    <td className="px-4 py-3 text-[#374151]">{r.batchName}</td>
                    <td className="px-4 py-3 text-right text-[#374151]">{r.total}</td>
                    <td className="px-4 py-3 text-right text-green-600 font-medium">{r.present}</td>
                    <td className="px-4 py-3 text-right text-red-500 font-medium">{r.absent}</td>
                    <td className="px-5 py-3 text-center">
                      <RateBadge rate={r.rate} />
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
