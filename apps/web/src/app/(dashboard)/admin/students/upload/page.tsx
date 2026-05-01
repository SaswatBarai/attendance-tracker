'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { CSVUploader, type ParsedStudent } from '@/components/admin/CSVUploader';
import { userApiClient } from '@/lib/api-client';
import { Role } from '@attendance-tracker/shared-types';

interface Cohort {
  id: string;
  name: string;
}

export default function CSVUploadPage() {
  const router = useRouter();
  const [cohorts, setCohorts] = useState<Cohort[]>([]);
  const [cohortId, setCohortId] = useState('');
  const [students, setStudents] = useState<ParsedStudent[]>([]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ created: number } | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    userApiClient
      .get<{ success: boolean; data: Cohort[] }>('/api/cohorts')
      .then((r) => setCohorts(r.data ?? []))
      .catch(() => {});
  }, []);

  async function handleUpload() {
    if (!cohortId) {
      setError('Please select a cohort first');
      return;
    }
    if (students.length === 0) {
      setError('Please upload a CSV file with at least one student');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await userApiClient.post<{ success: boolean; data: { created: number } }>(
        '/api/students/bulk',
        { cohortId, students }
      );
      setResult(res.data ?? null);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setLoading(false);
    }
  }

  if (result) {
    return (
      <ProtectedRoute allowedRoles={[Role.ADMIN]}>
        <div className="max-w-lg mx-auto text-center py-16 space-y-4">
          <p className="text-5xl">✅</p>
          <h2 className="text-xl font-semibold text-[#121212]">
            {result.created} student{result.created !== 1 ? 's' : ''} created
          </h2>
          <p className="text-sm text-[#6B7280]">
            Default password for each student is{' '}
            <code className="bg-[#F3F4F6] px-1.5 py-0.5 rounded text-[#374151]">
              Welcome@&lt;regno&gt;
            </code>
          </p>
          <div className="flex justify-center gap-3 pt-2">
            <button
              onClick={() => {
                setResult(null);
                setStudents([]);
              }}
              className="px-4 py-2 text-sm font-medium text-[#374151] border border-[#E5E7EB] rounded-lg hover:bg-[#F9FAFB] transition-colors"
            >
              Upload More
            </button>
            <button
              onClick={() => router.push('/admin/students')}
              className="px-4 py-2 text-sm font-medium text-white bg-[#FF6B00] rounded-lg hover:bg-[#E55A00] transition-colors"
            >
              View Students
            </button>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute allowedRoles={[Role.ADMIN]}>
      <div className="space-y-6 max-w-2xl">
        <div className="flex items-center gap-3">
          <Link href="/admin/students" className="text-[#6B7280] hover:text-[#374151] text-sm">
            ← Students
          </Link>
          <span className="text-[#E5E7EB]">/</span>
          <h1 className="text-2xl font-bold text-[#121212]">CSV Upload</h1>
        </div>

        <div className="bg-[#FFF7F0] border border-[#FFD4A8] rounded-xl p-4 text-sm text-[#92400E]">
          <p className="font-medium mb-1">Expected CSV format</p>
          <code className="block text-xs bg-white/60 rounded p-2 font-mono">
            Name,Email,Regno,Shift
            <br />
            John Doe,john@example.com,2021001,MORNING
            <br />
            Jane Smith,jane@example.com,2021002,AFTERNOON
          </code>
        </div>

        <div>
          <label className="block text-sm font-medium text-[#374151] mb-2">Cohort</label>
          <select
            value={cohortId}
            onChange={(e) => setCohortId(e.target.value)}
            className="border border-[#E5E7EB] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6B00]/40 w-full max-w-sm"
          >
            <option value="">Select cohort…</option>
            {cohorts.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <CSVUploader onParsed={setStudents} />

        {error && (
          <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-600">
            {error}
          </div>
        )}

        <div className="flex gap-3">
          <Link
            href="/admin/students"
            className="px-4 py-2 text-sm font-medium text-[#374151] border border-[#E5E7EB] rounded-lg hover:bg-[#F9FAFB] transition-colors"
          >
            Cancel
          </Link>
          <button
            onClick={handleUpload}
            disabled={loading || students.length === 0 || !cohortId}
            className="px-6 py-2 text-sm font-medium text-white bg-[#FF6B00] rounded-lg hover:bg-[#E55A00] transition-colors disabled:opacity-50"
          >
            {loading
              ? 'Uploading…'
              : `Upload ${students.length > 0 ? `${students.length} ` : ''}Student${students.length !== 1 ? 's' : ''}`}
          </button>
        </div>
      </div>
    </ProtectedRoute>
  );
}
