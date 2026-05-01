'use client';

import { useState, useEffect } from 'react';
import { userApiClient } from '@/lib/api-client';

export interface MentorOption {
  id: string;
  user: { name: string; email: string };
  cohort: { id: string; name: string };
}

interface MentorAssignmentDropdownProps {
  value: string;
  onChange: (mentorId: string) => void;
  cohortId?: string;
  disabled?: boolean;
}

export function MentorAssignmentDropdown({
  value,
  onChange,
  cohortId,
  disabled,
}: MentorAssignmentDropdownProps) {
  const [mentors, setMentors] = useState<MentorOption[]>([]);

  useEffect(() => {
    userApiClient
      .get<{ success: boolean; data: MentorOption[] }>('/api/mentors')
      .then((r) => {
        const all = r.data ?? [];
        setMentors(cohortId ? all.filter((m) => m.cohort.id === cohortId) : all);
      })
      .catch(() => {});
  }, [cohortId]);

  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      className="w-full border border-[#E5E7EB] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6B00]/40 disabled:bg-[#F9FAFB] disabled:text-[#9CA3AF]"
    >
      <option value="">No mentor</option>
      {mentors.map((m) => (
        <option key={m.id} value={m.id}>
          {m.user.name} ({m.cohort.name})
        </option>
      ))}
    </select>
  );
}
