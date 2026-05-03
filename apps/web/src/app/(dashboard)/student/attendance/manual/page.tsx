'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { AttendanceStatus } from '@/components/student/AttendanceStatus';
import { ManualCodeDisplay } from '@/components/student/ManualCodeDisplay';
import { attendanceApiClient } from '@/lib/api-client';
import { Role } from '@attendance-tracker/shared-types';

interface ManualCode {
  id: string;
  code: string;
  expiresAt: string;
  schedule: {
    period: number;
    startTime: string;
    endTime: string;
    batch: { name: string };
  };
}

export default function ManualAttendancePage() {
  const [code, setCode] = useState<ManualCode | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const generateCode = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await attendanceApiClient.post<{ success: boolean; data: ManualCode }>(
        '/api/attendance-codes/manual',
        {}
      );
      setCode(res.data);
    } catch (err) {
      setCode(null);
      setError(err instanceof Error ? err.message : 'Unable to generate manual code');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void generateCode();
  }, [generateCode]);

  return (
    <ProtectedRoute allowedRoles={[Role.STUDENT]}>
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-[#121212]">Manual Code</h1>
            <p className="text-sm text-[#6B7280] mt-1">Use this fallback when QR scanning is unavailable.</p>
          </div>
          <Link
            href="/student/attendance"
            className="px-4 py-2 text-sm font-medium text-[#374151] border border-[#E5E7EB] rounded-lg hover:bg-white transition-colors"
          >
            QR code
          </Link>
        </div>

        <ManualCodeDisplay code={code?.code} expiresAt={code?.expiresAt} isLoading={loading} />

        <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-[#121212]">Current period fallback</p>
            <p className="text-xs text-[#6B7280] mt-1">The code expires at the end of this class period.</p>
          </div>
          <button
            onClick={generateCode}
            className="px-4 py-2 text-sm font-medium text-white bg-[#FF6B00] rounded-lg hover:bg-[#E55A00] transition-colors"
          >
            Generate new code
          </button>
        </div>

        <AttendanceStatus
          status={loading ? 'loading' : error ? 'error' : code ? 'ready' : 'idle'}
          message={
            error ||
            (code
              ? `${code.schedule.batch.name} · Period ${code.schedule.period} · ${code.schedule.startTime}-${code.schedule.endTime}`
              : 'No active class found')
          }
        />
      </div>
    </ProtectedRoute>
  );
}
