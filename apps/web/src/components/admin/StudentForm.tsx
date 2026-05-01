'use client';

import { useState, useEffect } from 'react';
import { userApiClient } from '@/lib/api-client';

interface Cohort {
  id: string;
  name: string;
}

interface Batch {
  id: string;
  name: string;
  cohortId: string;
}

interface StudentFormProps {
  onClose: () => void;
  onCreated: () => void;
}

export function StudentForm({ onClose, onCreated }: StudentFormProps) {
  const [cohorts, setCohorts] = useState<Cohort[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [form, setForm] = useState({
    name: '',
    email: '',
    regno: '',
    shift: 'MORNING' as 'MORNING' | 'AFTERNOON',
    cohortId: '',
    batchId: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    userApiClient
      .get<{ success: boolean; data: Cohort[] }>('/api/cohorts')
      .then((r) => setCohorts(r.data ?? []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!form.cohortId) {
      setBatches([]);
      return;
    }
    userApiClient
      .get<{ success: boolean; data: Batch[] }>(`/api/batches?cohortId=${form.cohortId}`)
      .then((r) => setBatches(r.data ?? []))
      .catch(() => setBatches([]));
  }, [form.cohortId]);

  function set(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
    setError('');
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name || !form.email || !form.regno || !form.cohortId) {
      setError('Name, email, regno, and cohort are required');
      return;
    }
    setLoading(true);
    try {
      await userApiClient.post('/api/students', {
        ...form,
        batchId: form.batchId || undefined,
      });
      onCreated();
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to create student');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 p-6">
        <h2 className="text-lg font-semibold text-[#121212] mb-4">Add Student</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[#374151] mb-1">Full Name</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => set('name', e.target.value)}
              className="w-full border border-[#E5E7EB] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6B00]/40"
              placeholder="John Doe"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#374151] mb-1">Email</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => set('email', e.target.value)}
              className="w-full border border-[#E5E7EB] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6B00]/40"
              placeholder="john@example.com"
            />
          </div>
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="block text-sm font-medium text-[#374151] mb-1">Reg. No</label>
              <input
                type="text"
                value={form.regno}
                onChange={(e) => set('regno', e.target.value)}
                className="w-full border border-[#E5E7EB] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6B00]/40"
                placeholder="2021001"
              />
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-[#374151] mb-1">Shift</label>
              <select
                value={form.shift}
                onChange={(e) => set('shift', e.target.value)}
                className="w-full border border-[#E5E7EB] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6B00]/40"
              >
                <option value="MORNING">Morning</option>
                <option value="AFTERNOON">Afternoon</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-[#374151] mb-1">Cohort</label>
            <select
              value={form.cohortId}
              onChange={(e) => set('cohortId', e.target.value)}
              className="w-full border border-[#E5E7EB] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6B00]/40"
            >
              <option value="">Select cohort…</option>
              {cohorts.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-[#374151] mb-1">
              Batch <span className="text-[#6B7280] font-normal">(optional – auto-assigned)</span>
            </label>
            <select
              value={form.batchId}
              onChange={(e) => set('batchId', e.target.value)}
              disabled={!form.cohortId}
              className="w-full border border-[#E5E7EB] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6B00]/40 disabled:bg-[#F9FAFB] disabled:text-[#9CA3AF]"
            >
              <option value="">Auto-assign</option>
              {batches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>
          {error && <p className="text-sm text-[#EF4444]">{error}</p>}
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
              {loading ? 'Creating…' : 'Add Student'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
