'use client';

import { useState, useEffect } from 'react';
import { userApiClient, scheduleApiClient } from '@/lib/api-client';
import { MentorAssignmentDropdown } from './MentorAssignmentDropdown';

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

interface ScheduleCreatorProps {
  onClose: () => void;
  onCreated: () => void;
  prefillBatchId?: string;
  prefillDay?: string;
  prefillPeriod?: number;
}

export function ScheduleCreator({
  onClose,
  onCreated,
  prefillBatchId = '',
  prefillDay = '',
  prefillPeriod,
}: ScheduleCreatorProps) {
  const [batches, setBatches] = useState<Batch[]>([]);
  const [form, setForm] = useState({
    batchId: prefillBatchId,
    dayOfWeek: prefillDay,
    period: prefillPeriod ?? 1,
    shift: 'MORNING' as 'MORNING' | 'AFTERNOON',
    startTime: DEFAULT_TIMES[prefillPeriod ?? 1]?.start ?? '08:00',
    endTime: DEFAULT_TIMES[prefillPeriod ?? 1]?.end ?? '09:00',
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
      await scheduleApiClient.post('/api/schedules', {
        ...form,
        mentorId: form.mentorId || null,
      });
      onCreated();
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to create schedule');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 p-6 max-h-[90vh] overflow-y-auto">
        <h2 className="text-lg font-semibold text-[#121212] mb-4">Add Schedule Slot</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
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
            <label className="block text-sm font-medium text-[#374151] mb-1">Shift</label>
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
              <label className="block text-sm font-medium text-[#374151] mb-1">Start</label>
              <input
                type="time"
                value={form.startTime}
                onChange={(e) => set('startTime', e.target.value)}
                className="w-full border border-[#E5E7EB] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6B00]/40"
              />
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-[#374151] mb-1">End</label>
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
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 text-sm font-medium text-[#374151] border border-[#E5E7EB] rounded-lg hover:bg-[#F9FAFB] transition-colors"
            >
              Cancel
            </button>
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
    </div>
  );
}
