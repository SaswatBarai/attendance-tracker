'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { StudentTable, type StudentRow } from '@/components/admin/StudentTable';
import { StudentForm } from '@/components/admin/StudentForm';
import { userApiClient } from '@/lib/api-client';
import { Role } from '@attendance-tracker/shared-types';

interface Cohort {
  id: string;
  name: string;
}

export default function StudentsPage() {
  const [students, setStudents] = useState<StudentRow[]>([]);
  const [cohorts, setCohorts] = useState<Cohort[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);

  const [filterCohort, setFilterCohort] = useState('');
  const [filterShift, setFilterShift] = useState('');
  const [search, setSearch] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams();
      if (filterCohort) params.set('cohortId', filterCohort);
      if (filterShift) params.set('shift', filterShift);
      if (search) params.set('search', search);

      const [studentsRes, cohortsRes] = await Promise.all([
        userApiClient.get<{ success: boolean; data: StudentRow[] }>(
          `/api/students?${params.toString()}`
        ),
        userApiClient.get<{ success: boolean; data: Cohort[] }>('/api/cohorts'),
      ]);

      setStudents(studentsRes.data ?? []);
      setCohorts(cohortsRes.data ?? []);
    } catch {
      setError('Failed to load students');
    } finally {
      setLoading(false);
    }
  }, [filterCohort, filterShift, search]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleDelete(id: string) {
    if (!confirm('Remove this student? This cannot be undone.')) return;
    try {
      await userApiClient.delete(`/api/students/${id}`);
      await load();
    } catch {
      alert('Failed to remove student');
    }
  }

  return (
    <ProtectedRoute allowedRoles={[Role.ADMIN]}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-[#121212]">Students</h1>
            <p className="text-sm text-[#6B7280] mt-0.5">{students.length} students enrolled</p>
          </div>
          <div className="flex gap-2">
            <Link
              href="/admin/students/upload"
              className="px-4 py-2 text-sm font-medium text-[#374151] border border-[#E5E7EB] rounded-lg hover:bg-[#F9FAFB] transition-colors"
            >
              CSV Upload
            </Link>
            <button
              onClick={() => setShowForm(true)}
              className="px-4 py-2 text-sm font-medium text-white bg-[#FF6B00] rounded-lg hover:bg-[#E55A00] transition-colors"
            >
              + Add Student
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3">
          <input
            type="text"
            placeholder="Search name, email, regno…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="border border-[#E5E7EB] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6B00]/40 w-64"
          />
          <select
            value={filterCohort}
            onChange={(e) => setFilterCohort(e.target.value)}
            className="border border-[#E5E7EB] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6B00]/40"
          >
            <option value="">All cohorts</option>
            {cohorts.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          <select
            value={filterShift}
            onChange={(e) => setFilterShift(e.target.value)}
            className="border border-[#E5E7EB] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6B00]/40"
          >
            <option value="">All shifts</option>
            <option value="MORNING">Morning</option>
            <option value="AFTERNOON">Afternoon</option>
          </select>
        </div>

        {error && (
          <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-600">
            {error}
          </div>
        )}

        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-12 bg-[#F9FAFB] rounded-lg animate-pulse" />
            ))}
          </div>
        ) : (
          <StudentTable students={students} onDelete={handleDelete} />
        )}

        {showForm && <StudentForm onClose={() => setShowForm(false)} onCreated={load} />}
      </div>
    </ProtectedRoute>
  );
}
