'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import type { Route } from 'next';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { Role } from '@attendance-tracker/shared-types';
import { useAuth } from '@/hooks/useAuth';
import { userApiClient, scheduleApiClient } from '@/lib/api-client';
import { Camera, Keyboard, Calendar, Clock, Users, BookOpen } from 'lucide-react';

const DAY_NAMES = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];

interface MentorProfile {
  id: string;
  cohort: { id: string; name: string } | null;
}

interface Schedule {
  id: string;
  period: number;
  shift: string;
  startTime: string;
  endTime: string;
  dayOfWeek: string;
  batch: { id: string; name: string; cohort: { name: string } };
}

export default function MentorDashboardPage() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<MentorProfile | null>(null);
  const [todaySchedules, setTodaySchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const today = DAY_NAMES[new Date().getDay()];

    Promise.all([
      userApiClient.get<{ success: boolean; data: MentorProfile }>('/api/mentors/me'),
      scheduleApiClient.get<{ success: boolean; data: Schedule[] }>(
        `/api/schedules/my/mentor?dayOfWeek=${today}`
      ),
    ])
      .then(([profileRes, schedulesRes]) => {
        setProfile(profileRes.data ?? null);
        setTodaySchedules(schedulesRes.data ?? []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <ProtectedRoute allowedRoles={[Role.MENTOR]}>
      <div className="max-w-3xl mx-auto pb-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-[#121212]">
            Welcome, {user?.name?.split(' ')[0]}
          </h1>
          <p className="text-[#6B7280] mt-1">
            {profile?.cohort ? `Cohort: ${profile.cohort.name}` : 'Loading your profile…'}
          </p>
        </div>

        {/* Mark Attendance Actions */}
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

        {/* Today's Classes */}
        <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5 mb-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-[#121212] flex items-center gap-2">
              <Calendar className="w-4 h-4 text-[#FF6B00]" />
              Today&apos;s Classes
            </h2>
            <Link
              href={'/mentor/schedule' as Route}
              className="text-xs text-[#FF6B00] font-medium hover:underline"
            >
              Full schedule →
            </Link>
          </div>

          {loading ? (
            <div className="space-y-3">
              {[1, 2].map((i) => (
                <div key={i} className="h-16 bg-[#F9FAFB] rounded-xl animate-pulse" />
              ))}
            </div>
          ) : todaySchedules.length === 0 ? (
            <div className="text-center py-8 text-[#6B7280]">
              <BookOpen className="w-10 h-10 mx-auto mb-2 text-[#E5E7EB]" />
              <p className="text-sm">No classes assigned today</p>
            </div>
          ) : (
            <div className="space-y-3">
              {todaySchedules.map((s) => (
                <Link
                  key={s.id}
                  href="/mentor/attendance"
                  className="flex items-center justify-between p-4 bg-[#FFF7F0] rounded-xl border border-orange-100 hover:border-[#FF6B00] transition-colors block"
                >
                  <div>
                    <p className="font-medium text-[#121212] text-sm">
                      {s.batch.name}
                      <span className="text-[#9CA3AF] font-normal ml-2">· Period {s.period}</span>
                    </p>
                    <div className="flex items-center gap-1.5 mt-1">
                      <Users className="w-3 h-3 text-[#9CA3AF]" />
                      <span className="text-xs text-[#6B7280]">{s.batch.cohort.name}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-1 text-[#FF6B00] text-sm font-medium">
                      <Clock className="w-3.5 h-3.5" />
                      {s.startTime}–{s.endTime}
                    </div>
                    <span className="text-xs text-[#6B7280]">{s.shift}</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Quick Link to Attendance Overview */}
        <Link
          href="/mentor/attendance"
          className="flex items-center justify-between bg-white rounded-2xl border border-[#E5E7EB] p-5 hover:shadow-sm transition-shadow"
        >
          <div>
            <h2 className="font-semibold text-[#121212]">Attendance Overview</h2>
            <p className="text-sm text-[#6B7280] mt-0.5">
              View and manage batch attendance records
            </p>
          </div>
          <span className="text-[#FF6B00] font-medium text-sm">View →</span>
        </Link>
      </div>
    </ProtectedRoute>
  );
}
