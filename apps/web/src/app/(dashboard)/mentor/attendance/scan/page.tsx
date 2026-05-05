'use client';

import { useState } from 'react';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { Role } from '@attendance-tracker/shared-types';
import { QRScanner } from '@/components/mentor/QRScanner';
import { attendanceApiClient } from '@/lib/api-client';
import Link from 'next/link';

interface MarkResponse {
  success: boolean;
  data: unknown;
  student: { user: { name: string } };
}

export default function MentorQRScanPage() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  function showToast(type: 'success' | 'error', message: string) {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3000);
  }

  const handleScanSuccess = async (decodedText: string) => {
    if (isProcessing) return;

    setIsProcessing(true);
    try {
      const res = await attendanceApiClient.post<MarkResponse>('/api/attendance/mark', {
        code: decodedText,
      });
      showToast('success', `${res.student.user.name} marked present`);
    } catch (err: unknown) {
      showToast('error', err instanceof Error ? err.message : 'Scan failed');
    } finally {
      setTimeout(() => setIsProcessing(false), 2000);
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

        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-[#121212]">Scan QR Code</h1>
          <p className="text-[#6B7280] mt-2">Ask the student to show their dynamic QR code</p>
        </div>

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

        <QRScanner onScanSuccess={handleScanSuccess} isProcessing={isProcessing} />
      </div>
    </ProtectedRoute>
  );
}
