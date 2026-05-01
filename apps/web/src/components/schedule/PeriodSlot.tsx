export interface ScheduleSlot {
  id: string;
  period: number;
  shift: 'MORNING' | 'AFTERNOON';
  startTime: string;
  endTime: string;
  batch: { id: string; name: string };
  mentor: { id: string; user: { name: string } } | null;
}

interface PeriodSlotProps {
  slot: ScheduleSlot | null;
  onDelete?: (id: string) => void;
}

const SHIFT_COLORS: Record<string, string> = {
  MORNING: 'bg-amber-50 border-amber-200 text-amber-800',
  AFTERNOON: 'bg-indigo-50 border-indigo-200 text-indigo-800',
};

export function PeriodSlot({ slot, onDelete }: PeriodSlotProps) {
  if (!slot) {
    return (
      <div className="h-full min-h-[72px] rounded-lg border border-dashed border-[#E5E7EB] flex items-center justify-center">
        <span className="text-xs text-[#D1D5DB]">—</span>
      </div>
    );
  }

  const colorClass = SHIFT_COLORS[slot.shift] ?? SHIFT_COLORS['MORNING']!;

  return (
    <div
      className={`h-full min-h-[72px] rounded-lg border p-2 flex flex-col gap-1 group relative ${colorClass}`}
    >
      <p className="text-xs font-semibold leading-tight">{slot.batch.name}</p>
      <p className="text-[10px] opacity-75">
        {slot.startTime}–{slot.endTime}
      </p>
      {slot.mentor && <p className="text-[10px] opacity-75 truncate">{slot.mentor.user.name}</p>}
      {onDelete && (
        <button
          onClick={() => onDelete(slot.id)}
          className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-700 text-[10px] leading-none"
          title="Remove"
        >
          ✕
        </button>
      )}
    </div>
  );
}
