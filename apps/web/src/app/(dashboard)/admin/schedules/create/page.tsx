'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { MentorAssignmentDropdown } from '@/components/schedule/MentorAssignmentDropdown';
import { scheduleApiClient, userApiClient } from '@/lib/api-client';
import { Role } from '@attendance-tracker/shared-types';

const DAYS = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'] as const;
const PERIODS = [1, 2, 3, 4, 5, 6, 7, 8];

const DEFAULT_TIMES: Record<number, { start: string; end: string }> = {
  1: { start: '08:00', end: '09:00' },
  2: { start: '09:00', end: '10:00' },
  3: { start: '10:00', end: '11:00' },
  4: { start: '11:00', end: '12:00' },
  5: { start: '13:00', end: '14:00' },
  6: { start: '14:00', end: '15:00' },
  7: { start: '15:00', end: '16:00' },
  8: { start: '16:00', end: '17:00' },
};

interface Batch {
  id: string;
  name: string;
  cohort: { id: string; name: string };
}

export default function CreateSchedulePage() {
  const router = useRouter();
  const [batches, setBatches] = useState<Batch[]>([]);
  const [form, setForm] = useState({
    batchId: '',
    dayOfWeek: '',
    period: 1,
    shift: 'MORNING' as 'MORNING' | 'AFTERNOON',
    startTime: '08:00',
    endTime: '09:00',
    mentorId: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    userApiClient
      .get<{ success: boolean; data: Batch[] }>('/api/batches')
      .then((r) => setBatches(r.data ?? []))
      .catch(() => {});
  }, []);

  function set(field: string, value: string | number) {
    setError('');
    setForm((prev) => {
      const next = { ...prev, [field]: value };
      if (field === 'period') {
        const times = DEFAULT_TIMES[value as number];
        if (times) {
          next.startTime = times.start;
          next.endTime = times.end;
        }
      }
      return next;
    });
  }

  const selectedBatch = batches.find((b) => b.id === form.batchId);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.batchId || !form.dayOfWeek) {
      setError('Batch and day are required');
      return;
    }
    setLoading(true);
    try {
      await scheduleApiClient.post('/api/schedules', { ...form, mentorId: form.mentorId || null });
      router.push('/admin/schedules');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to create schedule');
    } finally {
      setLoading(false);
    }
  }

  return (
    <ProtectedRoute allowedRoles={[Role.ADMIN]}>
      <div className="space-y-6 max-w-lg">
        <div className="flex items-center gap-3">
          <Link href="/admin/schedules" className="text-[#6B7280] hover:text-[#374151] text-sm">
            ← Schedules
          </Link>
          <span className="text-[#E5E7EB]">/</span>
          <h1 className="text-2xl font-bold text-[#121212]">Add Schedule Slot</h1>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-2xl border border-[#E5E7EB] p-6 space-y-5"
        >
          <div>
            <label className="block text-sm font-medium text-[#374151] mb-1">Batch</label>
            <select
              value={form.batchId}
              onChange={(e) => set('batchId', e.target.value)}
              className="w-full border border-[#E5E7EB] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6B00]/40"
            >
              <option value="">Select batch…</option>
              {batches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name} — {b.cohort.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex gap-3">
            <div className="flex-1">
              <label className="block text-sm font-medium text-[#374151] mb-1">Day</label>
              <select
                value={form.dayOfWeek}
                onChange={(e) => set('dayOfWeek', e.target.value)}
                className="w-full border border-[#E5E7EB] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6B00]/40"
              >
                <option value="">Select day…</option>
                {DAYS.map((d) => (
                  <option key={d} value={d}>
                    {d.charAt(0) + d.slice(1).toLowerCase()}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-[#374151] mb-1">Period</label>
              <select
                value={form.period}
                onChange={(e) => set('period', parseInt(e.target.value))}
                className="w-full border border-[#E5E7EB] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6B00]/40"
              >
                {PERIODS.map((p) => (
                  <option key={p} value={p}>
                    Period {p}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-[#374151] mb-2">Shift</label>
            <div className="flex gap-3">
              {(['MORNING', 'AFTERNOON'] as const).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => set('shift', s)}
                  className={`flex-1 py-2 text-sm rounded-lg border transition-colors ${
                    form.shift === s
                      ? s === 'MORNING'
                        ? 'bg-amber-100 border-amber-300 text-amber-800 font-medium'
                        : 'bg-indigo-100 border-indigo-300 text-indigo-800 font-medium'
                      : 'border-[#E5E7EB] text-[#6B7280] hover:bg-[#F9FAFB]'
                  }`}
                >
                  {s === 'MORNING' ? '☀ Morning' : '🌙 Afternoon'}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-3">
            <div className="flex-1">
              <label className="block text-sm font-medium text-[#374151] mb-1">Start time</label>
              <input
                type="time"
                value={form.startTime}
                onChange={(e) => set('startTime', e.target.value)}
                className="w-full border border-[#E5E7EB] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6B00]/40"
              />
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-[#374151] mb-1">End time</label>
              <input
                type="time"
                value={form.endTime}
                onChange={(e) => set('endTime', e.target.value)}
                className="w-full border border-[#E5E7EB] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6B00]/40"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-[#374151] mb-1">
              Mentor <span className="text-[#6B7280] font-normal">(optional)</span>
            </label>
            <MentorAssignmentDropdown
              value={form.mentorId}
              onChange={(v) => set('mentorId', v)}
              cohortId={selectedBatch?.cohort.id}
            />
          </div>

          {error && (
            <p className="text-sm text-[#EF4444] bg-red-50 rounded-lg px-3 py-2">{error}</p>
          )}

          <div className="flex gap-3 pt-1">
            <Link
              href="/admin/schedules"
              className="flex-1 text-center px-4 py-2 text-sm font-medium text-[#374151] border border-[#E5E7EB] rounded-lg hover:bg-[#F9FAFB] transition-colors"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 text-sm font-medium text-white bg-[#FF6B00] rounded-lg hover:bg-[#E55A00] transition-colors disabled:opacity-50"
            >
              {loading ? 'Adding…' : 'Add Slot'}
            </button>
          </div>
        </form>
      </div>
    </ProtectedRoute>
  );
}
