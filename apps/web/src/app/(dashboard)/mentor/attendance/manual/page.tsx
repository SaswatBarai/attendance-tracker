'use client';

import { useState } from 'react';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { Role } from '@attendance-tracker/shared-types';
import { ManualCodeInput } from '@/components/mentor/ManualCodeInput';
import { attendanceApiClient } from '@/lib/api-client';
import Link from 'next/link';

interface MarkResponse {
  success: boolean;
  data: unknown;
  student: { user: { name: string } };
}

export default function MentorManualEntryPage() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  function showToast(type: 'success' | 'error', message: string) {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3000);
  }

  const handleManualSubmit = async (code: string) => {
    if (isProcessing) return;

    setIsProcessing(true);
    try {
      const res = await attendanceApiClient.post<MarkResponse>('/api/attendance/mark', { code });
      showToast('success', `${res.student.user.name} marked present`);
    } catch (err: unknown) {
      showToast('error', err instanceof Error ? err.message : 'Entry failed');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <ProtectedRoute allowedRoles={[Role.MENTOR]}>
      <div className="max-w-md mx-auto pt-4 pb-12">
        <Link
          href="/mentor/attendance"
          className="inline-flex items-center text-sm font-medium text-[#6B7280] hover:text-[#121212] transition-colors mb-6"
        >
          ← Back to Dashboard
        </Link>

        {toast && (
          <div
            className={`mb-4 px-4 py-3 rounded-xl text-sm font-medium text-center ${
              toast.type === 'success'
                ? 'bg-green-50 text-green-700 border border-green-200'
                : 'bg-red-50 text-red-700 border border-red-200'
            }`}
          >
            {toast.message}
          </div>
        )}

        <ManualCodeInput onSubmit={handleManualSubmit} isProcessing={isProcessing} />
      </div>
    </ProtectedRoute>
  );
}
