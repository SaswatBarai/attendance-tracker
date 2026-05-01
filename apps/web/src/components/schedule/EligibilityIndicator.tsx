interface EligibilityIndicatorProps {
  studentShift: 'MORNING' | 'AFTERNOON';
  scheduleShift: 'MORNING' | 'AFTERNOON';
}

export function EligibilityIndicator({ studentShift, scheduleShift }: EligibilityIndicatorProps) {
  const eligible = studentShift === 'MORNING' || scheduleShift === 'AFTERNOON';

  return (
    <span
      className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${
        eligible ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'
      }`}
    >
      {eligible ? '✓ Eligible' : '✗ Ineligible'}
    </span>
  );
}
