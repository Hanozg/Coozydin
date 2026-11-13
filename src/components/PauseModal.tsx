import { RotateCcw, Play, Home } from 'lucide-react';

interface PauseModalProps {
  discoveredCount: number;
  totalLandmarks: number;
  coins: number;
  onResume: () => void;
  onReturnTitle: () => void;
  onResetPosition: () => void;
}

export function PauseModal({
  discoveredCount,
  totalLandmarks,
  coins,
  onResume,
  onReturnTitle,
  onResetPosition,
}: PauseModalProps) {
  return (
    <div className="absolute inset-0 z-40 flex items-center justify-center bg-[#14120F]/80 p-6">
      <div className="w-full max-w-md rounded-2xl bg-[#1F1C17] border border-[#F5EFE6]/12 p-7 text-[#F5EFE6] shadow-2xl">
        <p className="text-xs text-[#D99B43] font-medium mb-1">Oyun Duraklatıldı</p>
        <h2 className="font-display text-2xl font-semibold tracking-tight mb-5">
          Efeler Sokaklarında Mola
        </h2>

        <div className="flex items-center gap-4 text-sm text-[#CFC6B8] pb-5 mb-6 border-b border-[#F5EFE6]/10">
          <span>
            Keşfedilen Yapı:{' '}
            <strong className="text-[#F5EFE6] font-mono-num">
              {discoveredCount}/{totalLandmarks}
            </strong>
          </span>
          <span aria-hidden="true">·</span>
          <span>
            İncir Puanı: <strong className="text-[#D99B43] font-mono-num">{coins}</strong>
          </span>
        </div>

        <div className="flex flex-col gap-3">
          <button
            type="button"
            onClick={onResume}
            className="w-full inline-flex items-center justify-center gap-2.5 px-5 py-3 rounded-xl bg-[#D99B43] hover:bg-[#E4AC59] text-[#181612] font-semibold text-sm transition-colors cursor-pointer"
          >
            <Play className="w-4 h-4" aria-hidden="true" />
            <span>Sürüşe Devam Et</span>
          </button>

          <button
            type="button"
            onClick={onResetPosition}
            className="w-full inline-flex items-center justify-center gap-2.5 px-5 py-3 rounded-xl bg-[#2A2620] hover:bg-[#342F28] text-[#F5EFE6] font-medium text-sm border border-[#F5EFE6]/10 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" aria-hidden="true" />
            <span>Sevgi Yolu’na Dön</span>
          </button>

          <button
            type="button"
            onClick={onReturnTitle}
            className="w-full inline-flex items-center justify-center gap-2.5 px-5 py-2.5 rounded-xl text-[#C7BEB0] hover:text-[#F5EFE6] hover:bg-[#2A2620]/60 font-medium text-sm transition-colors cursor-pointer"
          >
            <Home className="w-4 h-4" aria-hidden="true" />
            <span>Ana Ekrana Çık</span>
          </button>
        </div>
      </div>
    </div>
  );
}
