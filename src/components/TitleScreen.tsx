import { useEffect } from 'react';
import { ArrowRight, User } from 'lucide-react';

interface TitleScreenProps {
  profileName?: string;
  profileEmoji?: string;
  isCloudSignedIn?: boolean;
  onStart: () => void;
  onOpenProfile?: () => void;
}

export function TitleScreen({
  profileName = 'Efeler Gezgini',
  profileEmoji = '🏡',
  isCloudSignedIn = false,
  onStart,
  onOpenProfile,
}: TitleScreenProps) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = document.activeElement?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;
      if (e.code === 'Enter' || e.code === 'Space') {
        e.preventDefault();
        onStart();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onStart]);

  return (
    <div className="absolute inset-0 z-20 flex flex-col justify-between p-3 sm:p-6 md:p-12 pl-[max(0.75rem,env(safe-area-inset-left))] pr-[max(0.75rem,env(safe-area-inset-right))] pt-[max(0.75rem,env(safe-area-inset-top))] pb-[max(0.75rem,env(safe-area-inset-bottom))] pointer-events-none overflow-y-auto efeler-scroll">
      {/* Subtle warm golden edge gradient so the sunlit miniature diorama stays crisp */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'linear-gradient(105deg, rgba(46, 30, 18, 0.56) 0%, rgba(46, 30, 18, 0.22) 44%, rgba(46, 30, 18, 0.04) 100%)',
        }}
      />

      <div className="relative z-10 max-w-lg my-auto sm:my-0 sm:mt-4 md:mt-8 pointer-events-auto rounded-2xl sm:rounded-3xl bg-[#F7EEDC]/96 border-2 border-[#B99464] p-4 sm:p-6 md:p-8 shadow-2xl text-[#3A2618]">
        {/* Bespoke SVG Landmark Emblem + Title Lockup */}
        <svg
          viewBox="0 0 360 88"
          className="w-44 sm:w-60 md:w-76 h-auto mb-2 sm:mb-4 text-[#3A2618]"
          aria-label="Efeler: Aydın Yolları"
        >
          {/* Stylized Tralleis Triple Arch Emblem */}
          <g fill="none" stroke="#C85A32" strokeWidth="2.8" strokeLinecap="round">
            <path d="M8 62 V34 A11 11 0 0 1 30 34 V62" />
            <path d="M35 62 V28 A13 13 0 0 1 61 28 V62" />
            <path d="M66 62 V34 A11 11 0 0 1 88 34 V62" />
            <line x1="4" y1="62" x2="92" y2="62" strokeWidth="2.2" />
            <line x1="5" y1="16" x2="91" y2="16" strokeWidth="2" opacity="0.75" />
          </g>
          <text
            x="108"
            y="38"
            fill="#3A2618"
            fontFamily="Bricolage Grotesque, sans-serif"
            fontWeight="700"
            fontSize="30"
            letterSpacing="-0.02em"
          >
            Efeler
          </text>
          <text
            x="109"
            y="62"
            fill="#B84C27"
            fontFamily="Plus Jakarta Sans, sans-serif"
            fontWeight="700"
            fontSize="14"
            letterSpacing="0.08em"
          >
            AYDIN YOLLARI
          </text>
        </svg>

        <h1 className="font-display text-lg sm:text-2xl md:text-3xl font-bold text-[#3A2618] leading-[1.15] tracking-tight text-balance mb-1.5 sm:mb-3">
          Aydın’ın sokaklarında huzurlu bir izometrik yolculuk.
        </h1>

        <p className="text-xs sm:text-sm md:text-base text-[#5E4530] leading-relaxed max-w-md mb-3.5 sm:mb-6 line-clamp-2 sm:line-clamp-none">
          Tralleis Üç Gözler’den Nasuh Paşa Külliyesi’ne, Bey Camii’nden Sevgi Yolu’na uzanan
          tarihi dokuyu araba, bisiklet, motosiklet veya serçe olarak sokak sokak keşfedin.
        </p>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={onStart}
            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2.5 px-5 sm:px-7 py-3 rounded-xl bg-[#C85A32] hover:bg-[#B44D28] active:scale-[0.98] text-[#FAF2E2] font-semibold text-sm md:text-base shadow-md transition-all duration-150 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#3A2618]"
          >
            <span>Sürüşe Başla</span>
            <ArrowRight className="w-4 h-4" aria-hidden="true" />
          </button>

          {onOpenProfile && (
            <button
              type="button"
              onClick={onOpenProfile}
              className="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-[#EFE0C3] hover:bg-[#E4D1AE] border-2 border-[#B99464] text-[#3A2618] font-semibold text-xs sm:text-sm shadow-sm transition-colors cursor-pointer"
            >
              <span key={profileEmoji} aria-hidden="true">
                {profileEmoji}
              </span>
              <User className="w-3.5 h-3.5 text-[#6B5038]" aria-hidden="true" />
              <span className="truncate max-w-[120px]">{profileName}</span>
              {isCloudSignedIn && (
                <span className="w-2 h-2 rounded-full bg-[#5D8A48]" aria-hidden="true" />
              )}
            </button>
          )}
        </div>
      </div>

      {/* Single flat control-hint line */}
      <div className="relative z-10 self-start mt-2 rounded-xl bg-[#F7EEDC]/94 border border-[#B99464] px-3 py-1.5 text-[11px] sm:text-xs font-medium text-[#4D3623] tracking-wide shadow">
        Joystick veya WASD ile Gez · Sürükleyerek Etrafa Bak · Mobilde Yatay Kullanım Önerilir
      </div>
    </div>
  );
}
