'use client';

import { useState, useEffect } from 'react';
import { userApiClient } from '@/lib/api-client';

interface Batch {
  id: string;
  name: string;
}

interface BatchAssignmentProps {
  studentId: string;
  cohortId: string;
  currentBatchId: string | null;
  onAssigned: () => void;
}

export function BatchAssignment({
  studentId,
  cohortId,
  currentBatchId,
  onAssigned,
}: BatchAssignmentProps) {
  const [batches, setBatches] = useState<Batch[]>([]);
  const [selected, setSelected] = useState(currentBatchId ?? '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    userApiClient
      .get<{ success: boolean; data: Batch[] }>(`/api/batches?cohortId=${cohortId}`)
      .then((r) => setBatches(r.data ?? []))
      .catch(() => {});
  }, [cohortId]);

  async function handleSave() {
    setLoading(true);
    setError('');
    try {
      await userApiClient.put(`/api/students/${studentId}`, {
        batchId: selected || null,
      });
      onAssigned();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to update batch');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex items-center gap-2">
      <select
        value={selected}
        onChange={(e) => setSelected(e.target.value)}
        className="border border-[#E5E7EB] rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6B00]/40"
      >
        <option value="">Unassigned</option>
        {batches.map((b) => (
          <option key={b.id} value={b.id}>
            {b.name}
          </option>
        ))}
      </select>
      <button
        onClick={handleSave}
        disabled={loading || selected === (currentBatchId ?? '')}
        className="px-3 py-1.5 text-xs font-medium text-white bg-[#FF6B00] rounded-lg hover:bg-[#E55A00] transition-colors disabled:opacity-50"
      >
        {loading ? 'Saving…' : 'Save'}
      </button>
      {error && <p className="text-xs text-[#EF4444]">{error}</p>}
    </div>
  );
}
