'use client';

import { useState, useEffect } from 'react';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { Role, AttendanceStatus } from '@attendance-tracker/shared-types';
import { AttendanceList } from '@/components/mentor/AttendanceList';
import { BatchSelector } from '@/components/mentor/BatchSelector';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { attendanceApiClient } from '@/lib/api-client';
import { Camera, Keyboard } from 'lucide-react';
import Link from 'next/link';

export default function MentorAttendancePage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [schedules, setSchedules] = useState<unknown[]>([]);
  const [selectedScheduleId, setSelectedScheduleId] = useState<string | null>(null);
  const [attendances, setAttendances] = useState<unknown[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    if (user?.role === Role.MENTOR) {
      setSchedules([]);
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (!selectedScheduleId) return;

    attendanceApiClient
      .get<{ success: boolean; data: unknown[] }>(`/api/attendance/schedule/${selectedScheduleId}`)
      .then((r) => setAttendances(r.data))
      .catch((err: Error) =>
        toast({
          title: 'Error fetching attendance',
          description: err.message,
          variant: 'destructive',
        })
      );
  }, [selectedScheduleId, toast]);

  const handleUpdateStatus = async (id: string, status: AttendanceStatus) => {
    setIsUpdating(true);
    try {
      await attendanceApiClient.put(`/api/attendance/${id}/status`, { status });
      setAttendances((prev: unknown[]) =>
        prev.map((a: unknown) => {
          const att = a as { id: string };
          return att.id === id ? { ...att, status } : att;
        })
      );
      toast({ title: 'Status updated', description: `Attendance marked as ${status}` });
    } catch (err: unknown) {
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Update failed',
        variant: 'destructive',
      });
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <ProtectedRoute allowedRoles={[Role.MENTOR]}>
      <div className="max-w-3xl mx-auto pb-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-[#121212]">Today&apos;s Classes</h1>
          <p className="text-[#6B7280] mt-1">Select a batch to manage attendance</p>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-8">
          <Link
            href="/mentor/attendance/scan"
            className="flex flex-col items-center justify-center p-6 bg-white rounded-2xl border border-[#E5E7EB] hover:border-[#FF6B00] hover:shadow-md transition-all group"
          >
            <div className="w-12 h-12 bg-orange-50 rounded-full flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
              <Camera className="w-6 h-6 text-[#FF6B00]" />
            </div>
            <span className="font-semibold text-[#121212]">Scan QR Code</span>
          </Link>

          <Link
            href="/mentor/attendance/manual"
            className="flex flex-col items-center justify-center p-6 bg-white rounded-2xl border border-[#E5E7EB] hover:border-[#FF6B00] hover:shadow-md transition-all group"
          >
            <div className="w-12 h-12 bg-orange-50 rounded-full flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
              <Keyboard className="w-6 h-6 text-[#FF6B00]" />
            </div>
            <span className="font-semibold text-[#121212]">Manual Entry</span>
          </Link>
        </div>

        {!isLoading && (
          <BatchSelector
            schedules={schedules}
            selectedScheduleId={selectedScheduleId}
            onSelect={setSelectedScheduleId}
          />
        )}

        {selectedScheduleId && (
          <AttendanceList
            attendances={attendances}
            onUpdateStatus={handleUpdateStatus}
            isUpdating={isUpdating}
          />
        )}
      </div>
    </ProtectedRoute>
  );
}
