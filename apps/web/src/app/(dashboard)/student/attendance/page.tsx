'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { AttendanceStatus } from '@/components/student/AttendanceStatus';
import { CodeRefreshTimer } from '@/components/student/CodeRefreshTimer';
import { QRCodeDisplay } from '@/components/student/QRCodeDisplay';
import { attendanceApiClient } from '@/lib/api-client';
import { getAccessToken } from '@/lib/auth';
import { getAttendanceSocket } from '@/lib/socket-client';
import { Role } from '@attendance-tracker/shared-types';

interface AttendanceCode {
  id: string;
  qrData: string;
  qrImageDataUrl: string;
  expiresAt: string;
  schedule: {
    period: number;
    shift: string;
    startTime: string;
    endTime: string;
    batch: { name: string };
    mentor: { user: { name: string } } | null;
  };
}

interface SocketResponse {
  success: boolean;
  data?: AttendanceCode;
  error?: string;
}

export default function StudentAttendancePage() {
  const [code, setCode] = useState<AttendanceCode | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(30);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const mounted = useRef(false);

  const generateViaHttp = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await attendanceApiClient.post<{ success: boolean; data: AttendanceCode }>(
        '/api/attendance-codes/qr',
        {}
      );
      setCode(res.data);
      setSecondsLeft(30);
    } catch (err) {
      setCode(null);
      setError(err instanceof Error ? err.message : 'Unable to generate QR code');
    } finally {
      setLoading(false);
    }
  }, []);

  const refreshViaSocket = useCallback(() => {
    const token = getAccessToken();
    if (!token) {
      void generateViaHttp();
      return;
    }

    const socket = getAttendanceSocket();
    if (!socket.connected) socket.connect();

    socket.timeout(5000).emit(
      'attendance-code:refresh',
      { token, codeType: 'QR_CODE' },
      (err: Error | null, response?: SocketResponse) => {
        if (err || !response?.success || !response.data) {
          void generateViaHttp();
          return;
        }
        setCode(response.data);
        setSecondsLeft(30);
        setError('');
        setLoading(false);
      }
    );
  }, [generateViaHttp]);

  useEffect(() => {
    if (mounted.current) return;
    mounted.current = true;
    refreshViaSocket();
  }, [refreshViaSocket]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          refreshViaSocket();
          return 30;
        }
        return prev - 1;
      });
    }, 1000);

    return () => window.clearInterval(timer);
  }, [refreshViaSocket]);

  return (
    <ProtectedRoute allowedRoles={[Role.STUDENT]}>
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-[#121212]">My QR Code</h1>
            <p className="text-sm text-[#6B7280] mt-1">Show this to your mentor during the active class period.</p>
          </div>
          <Link
            href="/student/attendance/manual"
            className="px-4 py-2 text-sm font-medium text-[#374151] border border-[#E5E7EB] rounded-lg hover:bg-white transition-colors"
          >
            Manual code
          </Link>
        </div>

        <QRCodeDisplay qrImageDataUrl={code?.qrImageDataUrl} isLoading={loading} />

        <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <CodeRefreshTimer secondsLeft={secondsLeft} />
          <button
            onClick={refreshViaSocket}
            className="px-4 py-2 text-sm font-medium text-white bg-[#FF6B00] rounded-lg hover:bg-[#E55A00] transition-colors"
          >
            Refresh now
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
