'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { scheduleApiClient, userApiClient } from '@/lib/api-client';
import { Role } from '@attendance-tracker/shared-types';

interface ScheduleSummary {
  id: string;
  dayOfWeek: string;
  period: number;
  shift: 'MORNING' | 'AFTERNOON';
  startTime: string;
  endTime: string;
  batch: { id: string; name: string; cohort: { id: string; name: string } };
  mentor: { id: string; user: { name: string } } | null;
}

interface Batch {
  id: string;
  name: string;
  cohort: { id: string; name: string };
}

const DAY_ORDER = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];

export default function SchedulesPage() {
  const [schedules, setSchedules] = useState<ScheduleSummary[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [filterBatch, setFilterBatch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams();
      if (filterBatch) params.set('batchId', filterBatch);

      const [schedRes, batchRes] = await Promise.all([
        scheduleApiClient.get<{ success: boolean; data: ScheduleSummary[] }>(
          `/api/schedules?${params.toString()}`
        ),
        userApiClient.get<{ success: boolean; data: Batch[] }>('/api/batches'),
      ]);

      setSchedules(schedRes.data ?? []);
      setBatches(batchRes.data ?? []);
    } catch {
      setError('Failed to load schedules');
    } finally {
      setLoading(false);
    }
  }, [filterBatch]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleDelete(id: string) {
    if (!confirm('Remove this schedule slot?')) return;
    try {
      await scheduleApiClient.delete(`/api/schedules/${id}`);
      await load();
    } catch {
      alert('Failed to delete schedule');
    }
  }

  // Group by day
  const byDay = DAY_ORDER.reduce<Record<string, ScheduleSummary[]>>((acc, day) => {
    acc[day] = schedules.filter((s) => s.dayOfWeek === day).sort((a, b) => a.period - b.period);
    return acc;
  }, {});

  const totalSlots = schedules.length;

  return (
    <ProtectedRoute allowedRoles={[Role.ADMIN]}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-[#121212]">Schedules</h1>
            <p className="text-sm text-[#6B7280] mt-0.5">
              {totalSlots} slot{totalSlots !== 1 ? 's' : ''} scheduled
            </p>
          </div>
          <div className="flex gap-2">
            <Link
              href="/admin/schedules/timetable"
              className="px-4 py-2 text-sm font-medium text-[#374151] border border-[#E5E7EB] rounded-lg hover:bg-[#F9FAFB] transition-colors"
            >
              Timetable View
            </Link>
            <Link
              href="/admin/schedules/create"
              className="px-4 py-2 text-sm font-medium text-white bg-[#FF6B00] rounded-lg hover:bg-[#E55A00] transition-colors"
            >
              + Add Slot
            </Link>
          </div>
        </div>

        <div className="flex gap-3">
          <select
            value={filterBatch}
            onChange={(e) => setFilterBatch(e.target.value)}
            className="border border-[#E5E7EB] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6B00]/40"
          >
            <option value="">All batches</option>
            {batches.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name} — {b.cohort.name}
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
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-24 bg-[#F9FAFB] rounded-xl animate-pulse" />
            ))}
          </div>
        ) : totalSlots === 0 ? (
          <div className="text-center py-16">
            <p className="text-4xl mb-3">📅</p>
            <p className="text-[#6B7280] text-sm">No schedules yet</p>
            <Link
              href="/admin/schedules/create"
              className="inline-block mt-4 px-4 py-2 text-sm font-medium text-white bg-[#FF6B00] rounded-lg hover:bg-[#E55A00] transition-colors"
            >
              Add first slot
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {DAY_ORDER.filter((day) => (byDay[day]?.length ?? 0) > 0).map((day) => (
              <div
                key={day}
                className="bg-white rounded-2xl border border-[#E5E7EB] overflow-hidden"
              >
                <div className="px-5 py-3 bg-[#F9FAFB] border-b border-[#E5E7EB]">
                  <h2 className="text-sm font-semibold text-[#374151]">
                    {day.charAt(0) + day.slice(1).toLowerCase()}
                  </h2>
                </div>
                <div className="divide-y divide-[#E5E7EB]">
                  {byDay[day]?.map((s) => (
                    <div key={s.id} className="px-5 py-3 flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <span className="text-xs font-mono text-[#9CA3AF] w-8">P{s.period}</span>
                        <div>
                          <p className="text-sm font-medium text-[#121212]">{s.batch.name}</p>
                          <p className="text-xs text-[#6B7280]">
                            {s.startTime}–{s.endTime}
                            {s.mentor ? ` · ${s.mentor.user.name}` : ''}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                            s.shift === 'MORNING'
                              ? 'bg-amber-100 text-amber-700'
                              : 'bg-indigo-100 text-indigo-700'
                          }`}
                        >
                          {s.shift === 'MORNING' ? '☀' : '🌙'} {s.shift.toLowerCase()}
                        </span>
                        <button
                          onClick={() => handleDelete(s.id)}
                          className="text-xs text-[#EF4444] hover:underline"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}
