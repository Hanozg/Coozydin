import { useEffect } from 'react';
import { ArrowRight } from 'lucide-react';

interface TitleScreenProps {
  onStart: () => void;
}

export function TitleScreen({ onStart }: TitleScreenProps) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code === 'Enter' || e.code === 'Space') {
        e.preventDefault();
        onStart();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onStart]);

  return (
    <div className="absolute inset-0 z-20 flex flex-col justify-between p-8 md:p-14 pointer-events-none">
      {/* Subtle edge scrim on left for effortless legibility without obscuring the live 3D city */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'linear-gradient(105deg, rgba(20, 18, 15, 0.84) 0%, rgba(20, 18, 15, 0.42) 44%, rgba(20, 18, 15, 0.06) 100%)',
        }}
      />

      <div className="relative z-10 max-w-xl mt-6 md:mt-12 pointer-events-auto">
        {/* Bespoke SVG Landmark Emblem + Title Lockup */}
        <svg
          viewBox="0 0 360 88"
          className="w-72 md:w-88 h-auto mb-5 text-[#F5EFE6]"
          aria-label="Efeler: Aydın Yolları"
        >
          {/* Stylized Tralleis Triple Arch Emblem */}
          <g fill="none" stroke="#D99B43" strokeWidth="2.4" strokeLinecap="round">
            <path d="M8 62 V34 A11 11 0 0 1 30 34 V62" />
            <path d="M35 62 V28 A13 13 0 0 1 61 28 V62" />
            <path d="M66 62 V34 A11 11 0 0 1 88 34 V62" />
            <line x1="4" y1="62" x2="92" y2="62" strokeWidth="2" />
            <line x1="5" y1="16" x2="91" y2="16" strokeWidth="1.8" opacity="0.7" />
          </g>
          <text
            x="108"
            y="38"
            fill="#F5EFE6"
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
            fill="#D99B43"
            fontFamily="Plus Jakarta Sans, sans-serif"
            fontWeight="600"
            fontSize="15"
            letterSpacing="0.08em"
          >
            AYDIN YOLLARI
          </text>
        </svg>

        <h1 className="font-display text-3xl md:text-5xl font-semibold text-[#F5EFE6] leading-[1.12] tracking-tight text-balance mb-4">
          Aydın’ın sokaklarında huzurlu bir izometrik yolculuk.
        </h1>

        <p className="text-sm md:text-base text-[#D6CEC2] leading-relaxed max-w-md mb-8">
          Tralleis Üç Gözler’den Nasuh Paşa Külliyesi’ne, Bey Camii’nden Sevgi Yolu’na uzanan
          tarihi dokuyu özelleştirilebilir araba, bisiklet veya motosikletinizle sokak sokak keşfedin.
        </p>

        <button
          type="button"
          onClick={onStart}
          className="inline-flex items-center gap-3 px-7 py-3.5 rounded-xl bg-[#D99B43] hover:bg-[#E4AC59] active:scale-[0.98] text-[#181612] font-semibold text-sm md:text-base transition-all duration-150 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#F5EFE6]"
        >
          <span>Sürüşe Başla</span>
          <ArrowRight className="w-4 h-4" aria-hidden="true" />
        </button>
      </div>

      {/* Single flat control-hint line */}
      <div className="relative z-10 text-xs md:text-sm text-[#CFC6B8] tracking-wide">
        WASD / Yön Tuşları Sür · Space Korna / Zil · E Keşfet · Esc Duraklat
      </div>
    </div>
  );
}
