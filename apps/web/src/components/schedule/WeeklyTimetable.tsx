import { PeriodSlot, type ScheduleSlot } from './PeriodSlot';

const DAYS = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'] as const;
const DAY_LABELS: Record<string, string> = {
  MONDAY: 'Mon',
  TUESDAY: 'Tue',
  WEDNESDAY: 'Wed',
  THURSDAY: 'Thu',
  FRIDAY: 'Fri',
  SATURDAY: 'Sat',
};
const PERIODS = [1, 2, 3, 4, 5, 6, 7, 8];

interface WeeklyTimetableProps {
  schedules: ScheduleSlot[];
  onDelete?: (id: string) => void;
}

export function WeeklyTimetable({ schedules, onDelete }: WeeklyTimetableProps) {
  // Build lookup: day → period → slot
  const grid: Record<string, Record<number, ScheduleSlot>> = {};
  for (const s of schedules) {
    const day = (s as unknown as { dayOfWeek: string }).dayOfWeek;
    if (!grid[day]) grid[day] = {};
    grid[day]![s.period] = s;
  }

  if (schedules.length === 0) {
    return (
      <div className="text-center py-16">
        <p className="text-4xl mb-3">📅</p>
        <p className="text-[#6B7280] text-sm">No schedules yet — add one to get started</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-[#E5E7EB]">
      <table className="w-full border-collapse min-w-[640px]">
        <thead>
          <tr className="bg-[#F9FAFB]">
            <th className="px-3 py-2 text-left text-xs font-medium text-[#6B7280] uppercase tracking-wider w-16 border-b border-[#E5E7EB]">
              Period
            </th>
            {DAYS.map((day) => (
              <th
                key={day}
                className="px-3 py-2 text-center text-xs font-medium text-[#6B7280] uppercase tracking-wider border-b border-[#E5E7EB]"
              >
                {DAY_LABELS[day]}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {PERIODS.map((period) => (
            <tr key={period} className="border-b border-[#E5E7EB] last:border-0">
              <td className="px-3 py-2 text-xs font-medium text-[#9CA3AF] text-center align-top pt-3">
                P{period}
              </td>
              {DAYS.map((day) => (
                <td key={day} className="px-1.5 py-1.5 align-top">
                  <PeriodSlot slot={grid[day]?.[period] ?? null} onDelete={onDelete} />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
