'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { ShiftBadge } from '@/components/admin/ShiftBadge';
import { BatchAssignment } from '@/components/admin/BatchAssignment';
import { userApiClient } from '@/lib/api-client';
import { Role } from '@attendance-tracker/shared-types';

interface Student {
  id: string;
  regno: string;
  shift: 'MORNING' | 'AFTERNOON';
  createdAt: string;
  user: { id: string; name: string; email: string; isActive: boolean; createdAt: string };
  cohort: { id: string; name: string } | null;
  batch: { id: string; name: string } | null;
}

export default function StudentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [student, setStudent] = useState<Student | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await userApiClient.get<{ success: boolean; data: Student }>(
        `/api/students/${id}`
      );
      setStudent(res.data ?? null);
    } catch {
      setError('Student not found');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <ProtectedRoute allowedRoles={[Role.ADMIN]}>
      <div className="space-y-6 max-w-2xl">
        <div className="flex items-center gap-3">
          <Link href="/admin/students" className="text-[#6B7280] hover:text-[#374151] text-sm">
            ← Students
          </Link>
          {student && (
            <>
              <span className="text-[#E5E7EB]">/</span>
              <span className="text-sm text-[#374151]">{student.user.name}</span>
            </>
          )}
        </div>

        {error && (
          <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-600">
            {error}
          </div>
        )}

        {loading ? (
          <div className="space-y-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-16 bg-[#F9FAFB] rounded-xl animate-pulse" />
            ))}
          </div>
        ) : student ? (
          <div className="space-y-4">
            {/* Profile card */}
            <div className="bg-white rounded-2xl border border-[#E5E7EB] p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h1 className="text-xl font-bold text-[#121212]">{student.user.name}</h1>
                  <p className="text-sm text-[#6B7280]">{student.user.email}</p>
                </div>
                <span
                  className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                    student.user.isActive
                      ? 'bg-green-100 text-green-700'
                      : 'bg-red-100 text-red-600'
                  }`}
                >
                  {student.user.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>

              <dl className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <dt className="text-[#6B7280] text-xs uppercase tracking-wider mb-0.5">
                    Reg. No
                  </dt>
                  <dd className="font-mono font-medium text-[#374151]">{student.regno}</dd>
                </div>
                <div>
                  <dt className="text-[#6B7280] text-xs uppercase tracking-wider mb-0.5">Shift</dt>
                  <dd>
                    <ShiftBadge shift={student.shift} />
                  </dd>
                </div>
                <div>
                  <dt className="text-[#6B7280] text-xs uppercase tracking-wider mb-0.5">Cohort</dt>
                  <dd className="text-[#374151]">{student.cohort?.name ?? '—'}</dd>
                </div>
                <div>
                  <dt className="text-[#6B7280] text-xs uppercase tracking-wider mb-0.5">
                    Enrolled
                  </dt>
                  <dd className="text-[#374151]">
                    {new Date(student.createdAt).toLocaleDateString()}
                  </dd>
                </div>
              </dl>
            </div>

            {/* Batch assignment */}
            <div className="bg-white rounded-2xl border border-[#E5E7EB] p-6">
              <h2 className="text-sm font-semibold text-[#121212] mb-3">Batch Assignment</h2>
              {student.cohort ? (
                <BatchAssignment
                  studentId={student.id}
                  cohortId={student.cohort.id}
                  currentBatchId={student.batch?.id ?? null}
                  onAssigned={load}
                />
              ) : (
                <p className="text-sm text-[#6B7280]">Student has no cohort assigned</p>
              )}
            </div>
          </div>
        ) : null}
      </div>
    </ProtectedRoute>
  );
}
