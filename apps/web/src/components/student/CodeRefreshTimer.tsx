'use client';

interface CodeRefreshTimerProps {
  secondsLeft: number;
  totalSeconds?: number;
}

export function CodeRefreshTimer({ secondsLeft, totalSeconds = 30 }: CodeRefreshTimerProps) {
  const progress = Math.max(0, Math.min(1, secondsLeft / totalSeconds));
  const degrees = Math.round(progress * 360);

  return (
    <div className="flex items-center gap-3">
      <div
        className="w-11 h-11 rounded-full grid place-items-center"
        style={{
          background: `conic-gradient(#FF6B00 ${degrees}deg, #F3E8D8 ${degrees}deg)`,
        }}
      >
        <div className="w-8 h-8 rounded-full bg-white grid place-items-center text-xs font-semibold text-[#121212]">
          {secondsLeft}
        </div>
      </div>
      <div>
        <p className="text-sm font-medium text-[#121212]">Auto refresh</p>
        <p className="text-xs text-[#6B7280]">Every {totalSeconds} seconds</p>
      </div>
    </div>
  );
}
