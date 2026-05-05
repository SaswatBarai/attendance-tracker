'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import type { Route } from 'next';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { Role } from '@attendance-tracker/shared-types';
import { useAuth } from '@/hooks/useAuth';
import { userApiClient, scheduleApiClient, attendanceApiClient } from '@/lib/api-client';
import { QrCode, Keyboard, Calendar, Clock, BookOpen, TrendingUp } from 'lucide-react';

const DAY_NAMES = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];

interface StudentProfile {
  id: string;
  regno: string;
  shift: 'MORNING' | 'AFTERNOON';
  cohort: { id: string; name: string } | null;
  batch: { id: string; name: string } | null;
}

interface Schedule {
  id: string;
  period: number;
  shift: string;
  startTime: string;
  endTime: string;
  dayOfWeek: string;
  batch: { name: string };
  mentor: { user: { name: string } } | null;
}

interface AttendanceStats {
  total: number;
  present: number;
  absent: number;
  percentage: number;
}

export default function StudentDashboardPage() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [todaySchedules, setTodaySchedules] = useState<Schedule[]>([]);
  const [stats, setStats] = useState<AttendanceStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const today = DAY_NAMES[new Date().getDay()];

    Promise.all([
      userApiClient.get<{ success: boolean; data: StudentProfile }>('/api/students/me'),
      scheduleApiClient.get<{ success: boolean; data: Schedule[] }>(
        `/api/schedules/my/student?dayOfWeek=${today}`
      ),
      attendanceApiClient.get<{
        success: boolean;
        data: { stats: AttendanceStats };
      }>('/api/attendance/my/history'),
    ])
      .then(([profileRes, schedulesRes, historyRes]) => {
        setProfile(profileRes.data ?? null);
        setTodaySchedules(schedulesRes.data ?? []);
        setStats(historyRes.data?.stats ?? null);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <ProtectedRoute allowedRoles={[Role.STUDENT]}>
      <div className="max-w-3xl mx-auto space-y-6 pb-12">
        <div>
          <h1 className="text-3xl font-bold text-[#121212]">
            Welcome, {user?.name?.split(' ')[0]}
          </h1>
          <p className="text-[#6B7280] mt-1">
            {profile
              ? `${profile.regno} · ${profile.shift} shift · ${profile.batch?.name ?? 'No batch assigned'}`
              : 'Loading your profile…'}
          </p>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-4">
          <Link
            href="/student/attendance"
            className="flex flex-col items-center justify-center p-6 bg-white rounded-2xl border border-[#E5E7EB] hover:border-[#FF6B00] hover:shadow-md transition-all group"
          >
            <div className="w-12 h-12 bg-orange-50 rounded-full flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
              <QrCode className="w-6 h-6 text-[#FF6B00]" />
            </div>
            <span className="font-semibold text-[#121212]">Show QR Code</span>
            <span className="text-xs text-[#6B7280] mt-1">Mark attendance</span>
          </Link>

          <Link
            href="/student/attendance/manual"
            className="flex flex-col items-center justify-center p-6 bg-white rounded-2xl border border-[#E5E7EB] hover:border-[#FF6B00] hover:shadow-md transition-all group"
          >
            <div className="w-12 h-12 bg-orange-50 rounded-full flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
              <Keyboard className="w-6 h-6 text-[#FF6B00]" />
            </div>
            <span className="font-semibold text-[#121212]">Manual Code</span>
            <span className="text-xs text-[#6B7280] mt-1">Fallback entry</span>
          </Link>
        </div>

        {/* Attendance Stats */}
        {stats !== null && (
          <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-[#121212] flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-[#FF6B00]" />
                Attendance Overview
              </h2>
              <Link
                href={'/student/attendance/history' as Route}
                className="text-xs text-[#FF6B00] font-medium hover:underline"
              >
                View history →
              </Link>
            </div>
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-[#FF6B00]">{stats.percentage}%</p>
                <p className="text-xs text-[#6B7280]">Rate</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600">{stats.present}</p>
                <p className="text-xs text-[#6B7280]">Present</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-red-500">{stats.absent}</p>
                <p className="text-xs text-[#6B7280]">Absent</p>
              </div>
            </div>
            <div className="w-full bg-[#F3F4F6] rounded-full h-2">
              <div
                className="bg-[#FF6B00] h-2 rounded-full transition-all"
                style={{ width: `${stats.percentage}%` }}
              />
            </div>
          </div>
        )}

        {/* Today's Classes */}
        <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-[#121212] flex items-center gap-2">
              <Calendar className="w-4 h-4 text-[#FF6B00]" />
              Today&apos;s Classes
            </h2>
            <Link
              href={'/student/schedule' as Route}
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
              <p className="text-sm">No classes scheduled today</p>
            </div>
          ) : (
            <div className="space-y-3">
              {todaySchedules.map((s) => (
                <div
                  key={s.id}
                  className="flex items-center justify-between p-4 bg-[#FFF7F0] rounded-xl border border-orange-100"
                >
                  <div>
                    <p className="font-medium text-[#121212] text-sm">Period {s.period}</p>
                    <p className="text-xs text-[#6B7280] mt-0.5">
                      {s.mentor ? `Mentor: ${s.mentor.user.name}` : 'No mentor assigned'}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-1 text-[#FF6B00] text-sm font-medium">
                      <Clock className="w-3.5 h-3.5" />
                      {s.startTime}–{s.endTime}
                    </div>
                    <span className="text-xs text-[#6B7280]">{s.shift}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}
