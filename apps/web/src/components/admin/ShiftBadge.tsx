interface ShiftBadgeProps {
  shift: 'MORNING' | 'AFTERNOON';
  size?: 'sm' | 'md';
}

export function ShiftBadge({ shift, size = 'md' }: ShiftBadgeProps) {
  const base = size === 'sm' ? 'text-xs px-2 py-0.5' : 'text-xs px-2.5 py-1';
  const color =
    shift === 'MORNING' ? 'bg-amber-100 text-amber-700' : 'bg-indigo-100 text-indigo-700';

  return (
    <span className={`inline-flex items-center rounded-full font-medium ${base} ${color}`}>
      {shift === 'MORNING' ? '☀ Morning' : '🌙 Afternoon'}
    </span>
  );
}
