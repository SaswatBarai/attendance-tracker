'use client';

interface ManualCodeDisplayProps {
  code?: string;
  expiresAt?: string;
  isLoading?: boolean;
}

export function ManualCodeDisplay({ code, expiresAt, isLoading }: ManualCodeDisplayProps) {
  return (
    <div className="bg-white rounded-2xl border border-[#E5E7EB] p-6 text-center">
      <p className="text-sm font-medium text-[#6B7280] mb-3">Manual attendance code</p>
      <div className="min-h-20 flex items-center justify-center">
        {isLoading ? (
          <div className="w-8 h-8 border-4 border-[#FF6B00] border-t-transparent rounded-full animate-spin" />
        ) : code ? (
          <span className="font-mono text-5xl sm:text-6xl font-bold tracking-[0.12em] text-[#121212]">
            {code}
          </span>
        ) : (
          <span className="text-sm text-[#6B7280]">No code generated</span>
        )}
      </div>
      {expiresAt && (
        <p className="text-xs text-[#6B7280] mt-4">
          Valid until {new Date(expiresAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </p>
      )}
    </div>
  );
}
