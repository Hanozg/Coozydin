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
    <div className="absolute inset-0 z-40 flex items-center justify-center bg-[#2E1E12]/65 p-6">
      <div className="w-full max-w-md rounded-2xl bg-[#F7EEDC] border-2 border-[#B99464] p-7 text-[#3A2618] shadow-2xl">
        <p className="text-xs text-[#B84C27] font-semibold mb-1">Oyun Duraklatıldı</p>
        <h2 className="font-display text-2xl font-bold tracking-tight mb-5 text-[#3A2618]">
          Efeler Sokaklarında Mola
        </h2>

        <div className="flex items-center gap-4 text-sm text-[#6B5038] pb-5 mb-6 border-b border-[#B99464]/40 font-medium">
          <span>
            Keşfedilen Yapı:{' '}
            <strong className="text-[#3A2618] font-mono-num">
              {discoveredCount}/{totalLandmarks}
            </strong>
          </span>
          <span aria-hidden="true">·</span>
          <span>
            İncir Puanı:{' '}
            <strong className="text-[#B84C27] font-mono-num">{coins}</strong>
          </span>
        </div>

        <div className="flex flex-col gap-3">
          <button
            type="button"
            onClick={onResume}
            className="w-full inline-flex items-center justify-center gap-2.5 px-5 py-3 rounded-xl bg-[#C85A32] hover:bg-[#B44D28] text-[#FAF2E2] font-semibold text-sm transition-colors cursor-pointer"
          >
            <Play className="w-4 h-4" aria-hidden="true" />
            <span>Sürüşe Devam Et</span>
          </button>

          <button
            type="button"
            onClick={onResetPosition}
            className="w-full inline-flex items-center justify-center gap-2.5 px-5 py-3 rounded-xl bg-[#EDE0C6] hover:bg-[#E2D1B2] text-[#3A2618] font-semibold text-sm border border-[#B99464]/60 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-4 h-4 text-[#6B5038]" aria-hidden="true" />
            <span>Sevgi Yolu’na Dön</span>
          </button>

          <button
            type="button"
            onClick={onReturnTitle}
            className="w-full inline-flex items-center justify-center gap-2.5 px-5 py-2.5 rounded-xl text-[#6B5038] hover:text-[#3A2618] hover:bg-[#EDE0C6]/70 font-semibold text-sm transition-colors cursor-pointer"
          >
            <Home className="w-4 h-4" aria-hidden="true" />
            <span>Ana Ekrana Çık</span>
          </button>
        </div>
      </div>
    </div>
  );
}
