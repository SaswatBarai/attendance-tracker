'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { WeeklyTimetable } from '@/components/schedule/WeeklyTimetable';
import { scheduleApiClient, userApiClient } from '@/lib/api-client';
import { Role } from '@attendance-tracker/shared-types';
import type { ScheduleSlot } from '@/components/schedule/PeriodSlot';

interface Batch {
  id: string;
  name: string;
  cohort: { id: string; name: string };
}

export default function TimetablePage() {
  const [schedules, setSchedules] = useState<ScheduleSlot[]>([]);
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
        scheduleApiClient.get<{ success: boolean; data: ScheduleSlot[] }>(
          `/api/schedules?${params.toString()}`
        ),
        userApiClient.get<{ success: boolean; data: Batch[] }>('/api/batches'),
      ]);

      setSchedules(schedRes.data ?? []);
      setBatches(batchRes.data ?? []);
    } catch {
      setError('Failed to load timetable');
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

  return (
    <ProtectedRoute allowedRoles={[Role.ADMIN]}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/admin/schedules" className="text-[#6B7280] hover:text-[#374151] text-sm">
              ← Schedules
            </Link>
            <span className="text-[#E5E7EB]">/</span>
            <h1 className="text-2xl font-bold text-[#121212]">Weekly Timetable</h1>
          </div>
          <Link
            href="/admin/schedules/create"
            className="px-4 py-2 text-sm font-medium text-white bg-[#FF6B00] rounded-lg hover:bg-[#E55A00] transition-colors"
          >
            + Add Slot
          </Link>
        </div>

        <div className="flex items-center gap-4">
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

          {/* Legend */}
          <div className="flex items-center gap-3 text-xs text-[#6B7280]">
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded bg-amber-200 inline-block" /> Morning
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded bg-indigo-200 inline-block" /> Afternoon
            </span>
          </div>
        </div>

        {error && (
          <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-600">
            {error}
          </div>
        )}

        {loading ? (
          <div className="h-96 bg-[#F9FAFB] rounded-xl animate-pulse" />
        ) : (
          <WeeklyTimetable schedules={schedules} onDelete={handleDelete} />
        )}
      </div>
    </ProtectedRoute>
  );
}
