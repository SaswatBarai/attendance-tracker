'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { Role } from '@attendance-tracker/shared-types';
import { scheduleApiClient } from '@/lib/api-client';
import { Clock, ChevronLeft } from 'lucide-react';

const DAYS = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'] as const;
type Day = (typeof DAYS)[number];

interface Schedule {
  id: string;
  period: number;
  shift: string;
  startTime: string;
  endTime: string;
  dayOfWeek: Day;
  batch: { name: string };
  mentor: { user: { name: string } } | null;
}

const SHIFT_COLORS: Record<string, string> = {
  MORNING: 'bg-amber-50 border-amber-200 text-amber-800',
  AFTERNOON: 'bg-blue-50 border-blue-200 text-blue-700',
};

export default function StudentSchedulePage() {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    scheduleApiClient
      .get<{ success: boolean; data: Schedule[] }>('/api/schedules/my/student')
      .then((r) => setSchedules(r.data ?? []))
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const byDay = DAYS.reduce<Record<Day, Schedule[]>>(
    (acc, day) => ({ ...acc, [day]: schedules.filter((s) => s.dayOfWeek === day) }),
    {} as Record<Day, Schedule[]>
  );

  const todayName = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'][
    new Date().getDay()
  ] as Day;

  return (
    <ProtectedRoute allowedRoles={[Role.STUDENT]}>
      <div className="max-w-3xl mx-auto pb-12">
        <div className="flex items-center gap-3 mb-6">
          <Link
            href="/student"
            className="inline-flex items-center text-sm font-medium text-[#6B7280] hover:text-[#121212] transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            Dashboard
          </Link>
        </div>

        <h1 className="text-3xl font-bold text-[#121212] mb-1">My Schedule</h1>
        <p className="text-[#6B7280] mb-8">Your weekly class timetable</p>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-600 mb-6">
            {error}
          </div>
        )}

        {loading ? (
          <div className="space-y-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 bg-[#F9FAFB] rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="space-y-6">
            {DAYS.map((day) => {
              const daySchedules = byDay[day];
              const isToday = day === todayName;
              return (
                <div
                  key={day}
                  className={`rounded-2xl border p-5 ${isToday ? 'border-[#FF6B00] bg-[#FFF7F0]' : 'border-[#E5E7EB] bg-white'}`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <h2
                      className={`font-semibold ${isToday ? 'text-[#FF6B00]' : 'text-[#121212]'}`}
                    >
                      {day.charAt(0) + day.slice(1).toLowerCase()}
                      {isToday && (
                        <span className="ml-2 text-xs font-normal bg-[#FF6B00] text-white px-2 py-0.5 rounded-full">
                          Today
                        </span>
                      )}
                    </h2>
                    <span className="text-xs text-[#9CA3AF]">
                      {daySchedules.length} {daySchedules.length === 1 ? 'class' : 'classes'}
                    </span>
                  </div>

                  {daySchedules.length === 0 ? (
                    <p className="text-sm text-[#9CA3AF]">No classes</p>
                  ) : (
                    <div className="space-y-2">
                      {daySchedules
                        .sort((a, b) => a.period - b.period)
                        .map((s) => (
                          <div
                            key={s.id}
                            className="flex items-center justify-between bg-white rounded-xl border border-[#E5E7EB] px-4 py-3"
                          >
                            <div>
                              <span className="font-medium text-sm text-[#121212]">
                                Period {s.period}
                              </span>
                              <span
                                className={`ml-2 text-xs px-2 py-0.5 rounded-full border ${SHIFT_COLORS[s.shift] ?? ''}`}
                              >
                                {s.shift}
                              </span>
                              {s.mentor && (
                                <p className="text-xs text-[#6B7280] mt-0.5">
                                  {s.mentor.user.name}
                                </p>
                              )}
                            </div>
                            <div className="flex items-center gap-1 text-sm text-[#374151] font-medium">
                              <Clock className="w-3.5 h-3.5 text-[#9CA3AF]" />
                              {s.startTime}–{s.endTime}
                            </div>
                          </div>
                        ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}
