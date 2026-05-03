'use client';

interface QRCodeDisplayProps {
  qrImageDataUrl?: string;
  isLoading?: boolean;
}

export function QRCodeDisplay({ qrImageDataUrl, isLoading }: QRCodeDisplayProps) {
  return (
    <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5 sm:p-6">
      <div className="aspect-square w-full max-w-sm mx-auto rounded-2xl border border-[#E5E7EB] bg-[#F9FAFB] grid place-items-center overflow-hidden">
        {isLoading ? (
          <div className="w-10 h-10 border-4 border-[#FF6B00] border-t-transparent rounded-full animate-spin" />
        ) : qrImageDataUrl ? (
          <img src={qrImageDataUrl} alt="Attendance QR code" className="w-full h-full object-contain p-4" />
        ) : (
          <span className="text-sm text-[#6B7280]">No active QR</span>
        )}
      </div>
    </div>
  );
}
