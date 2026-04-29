'use client';

import { useState } from 'react';
import { userApiClient } from '@/lib/api-client';

interface Props {
  cohort: {
    id: string;
    name: string;
    description: string | null;
  };
  onClose: () => void;
  onUpdated: () => void;
}

export function EditCohortModal({ cohort, onClose, onUpdated }: Props) {
  const [name, setName] = useState(cohort.name);
  const [description, setDescription] = useState(cohort.description ?? '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await userApiClient.put(`/api/cohorts/${cohort.id}`, {
        name,
        description: description || undefined,
      });
      onUpdated();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to update cohort');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-semibold text-[#121212]">Edit Cohort</h2>
          <button
            onClick={onClose}
            className="text-[#9CA3AF] hover:text-[#121212] text-xl leading-none"
          >
            X
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[#374151] mb-1">
              Cohort Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              minLength={2}
              className="w-full px-4 py-2.5 rounded-xl border border-[#D1D5DB] text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6B00]/50 focus:border-[#FF6B00] transition"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[#374151] mb-1">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full px-4 py-2.5 rounded-xl border border-[#D1D5DB] text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6B00]/50 focus:border-[#FF6B00] transition resize-none"
            />
          </div>

          {error && <p className="text-red-600 text-sm bg-red-50 rounded-lg px-3 py-2">{error}</p>}

          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 rounded-xl border border-[#D1D5DB] text-sm font-medium text-[#374151] hover:bg-[#F9FAFB] transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2.5 rounded-xl bg-[#FF6B00] text-white text-sm font-semibold hover:bg-[#E55F00] transition disabled:opacity-50"
            >
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
