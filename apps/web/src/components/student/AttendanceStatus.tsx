'use client';

interface AttendanceStatusProps {
  status: 'idle' | 'loading' | 'ready' | 'error';
  message?: string;
}

export function AttendanceStatus({ status, message }: AttendanceStatusProps) {
  const styles = {
    idle: 'bg-[#F9FAFB] text-[#6B7280] border-[#E5E7EB]',
    loading: 'bg-amber-50 text-amber-700 border-amber-200',
    ready: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    error: 'bg-red-50 text-red-600 border-red-200',
  };

  return (
    <div className={`rounded-lg border px-3 py-2 text-sm ${styles[status]}`}>
      {message ?? (status === 'ready' ? 'Code ready' : 'Waiting for current class')}
    </div>
  );
}
