'use client';

import Link from 'next/link';
import { ShiftBadge } from './ShiftBadge';

export interface StudentRow {
  id: string;
  regno: string;
  shift: 'MORNING' | 'AFTERNOON';
  user: { id: string; name: string; email: string; isActive: boolean };
  cohort: { id: string; name: string } | null;
  batch: { id: string; name: string } | null;
}

interface StudentTableProps {
  students: StudentRow[];
  onDelete: (id: string) => void;
}

export function StudentTable({ students, onDelete }: StudentTableProps) {
  if (students.length === 0) {
    return (
      <div className="text-center py-16">
        <p className="text-4xl mb-3">🎓</p>
        <p className="text-[#6B7280] text-sm">No students found</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-[#E5E7EB]">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-[#F9FAFB] text-left text-[#6B7280] text-xs uppercase tracking-wider">
            <th className="px-4 py-3 font-medium">Name</th>
            <th className="px-4 py-3 font-medium">Email</th>
            <th className="px-4 py-3 font-medium">Reg. No</th>
            <th className="px-4 py-3 font-medium">Shift</th>
            <th className="px-4 py-3 font-medium">Batch</th>
            <th className="px-4 py-3 font-medium">Status</th>
            <th className="px-4 py-3 font-medium">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#E5E7EB]">
          {students.map((s) => (
            <tr key={s.id} className="hover:bg-[#FAFAFA] transition-colors">
              <td className="px-4 py-3 font-medium text-[#121212]">{s.user.name}</td>
              <td className="px-4 py-3 text-[#6B7280]">{s.user.email}</td>
              <td className="px-4 py-3 font-mono text-[#374151]">{s.regno}</td>
              <td className="px-4 py-3">
                <ShiftBadge shift={s.shift} size="sm" />
              </td>
              <td className="px-4 py-3 text-[#6B7280]">{s.batch?.name ?? '—'}</td>
              <td className="px-4 py-3">
                <span
                  className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                    s.user.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'
                  }`}
                >
                  {s.user.isActive ? 'Active' : 'Inactive'}
                </span>
              </td>
              <td className="px-4 py-3">
                <div className="flex items-center gap-2">
                  <Link
                    href={`/admin/students/${s.id}`}
                    className="text-xs text-[#FF6B00] hover:underline font-medium"
                  >
                    View
                  </Link>
                  <button
                    onClick={() => onDelete(s.id)}
                    className="text-xs text-[#EF4444] hover:underline font-medium"
                  >
                    Remove
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
