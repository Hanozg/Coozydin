import { Check, Headphones, MapPin, Sparkles, Square, X } from 'lucide-react';
import { MuseumExhibitDef } from '../../types/game';

interface MuseumExhibitCardProps {
  exhibit: MuseumExhibitDef;
  cityName?: string;
  isDiscovered: boolean;
  isNewlyDiscovered: boolean;
  voicePlaying: boolean;
  voiceLoading: boolean;
  useBackdropBlur: boolean;
  onToggleVoice: () => void;
  onClose: () => void;
}

export function MuseumExhibitCard({
  exhibit,
  cityName,
  isDiscovered,
  isNewlyDiscovered,
  voicePlaying,
  voiceLoading,
  useBackdropBlur,
  onToggleVoice,
  onClose,
}: MuseumExhibitCardProps) {
  const glassSurface = useBackdropBlur
    ? 'bg-[#171310]/74 backdrop-blur-md'
    : 'bg-[#181410]/92';

  return (
    <aside
      aria-label={exhibit.title}
      className={`pointer-events-auto w-full max-w-[430px] max-h-[82dvh] flex flex-col rounded-2xl ${glassSurface} border border-[#E6C58D]/35 text-[#F6EFE2] shadow-[0_24px_64px_rgba(0,0,0,0.55)] overflow-hidden`}
    >
      {/* Editorial Top Accession Header */}
      <div className="px-5 pt-5 pb-4 border-b border-[#E6C58D]/20 bg-gradient-to-b from-[#E6C58D]/10 to-transparent">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#E6C58D]">
              {cityName && (
                <>
                  <span>{cityName}</span>
                  <span aria-hidden="true">·</span>
                </>
              )}
              <span className="font-mono-num">{exhibit.catalogCode}</span>
              <span aria-hidden="true">·</span>
              <span className="truncate">{exhibit.zone}</span>
            </div>
            <h2 className="font-display text-xl sm:text-2xl font-bold tracking-tight text-[#FCF7EE] mt-1.5 leading-snug">
              {exhibit.title}
            </h2>
            <p className="text-xs text-[#D5C7B2] mt-1 font-medium">{exhibit.subtitle}</p>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Müze Kartını Kapat"
            title="Kapat (E veya Esc)"
            className="p-1.5 rounded-lg text-[#D5C7B2] hover:text-[#FCF7EE] hover:bg-white/10 transition-colors cursor-pointer shrink-0"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        {/* Discovery Reward Pill / Status */}
        <div className="flex flex-wrap items-center gap-2 mt-3">
          {isNewlyDiscovered ? (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#E6C58D]/20 border border-[#E6C58D]/50 text-[#F8DFAA] text-[11px] font-semibold">
              <Sparkles className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Koleksiyona Eklendi · +{exhibit.rewardCoins} İncir Puanı</span>
            </span>
          ) : isDiscovered ? (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#5D8A48]/25 border border-[#84B86C]/40 text-[#C5E8B3] text-[11px] font-semibold">
              <Check className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Müze Koleksiyonunda Kayıtlı</span>
            </span>
          ) : null}
        </div>
      </div>

      {/* Scrollable Curatorial Narrative & Accession Metadata */}
      <div className="flex-1 overflow-y-auto efeler-scroll px-5 py-4 space-y-4">
        <p className="text-sm text-[#F2E9DB] leading-relaxed font-normal">
          {exhibit.historicalStory}
        </p>

        {/* Architectural Detail Note */}
        <div className="rounded-xl bg-white/[0.04] border border-[#E6C58D]/20 p-3.5 space-y-1">
          <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.14em] font-semibold text-[#E6C58D]">
            <MapPin className="w-3 h-3" aria-hidden="true" />
            <span>Mimari ve Yüzey Detayı</span>
          </div>
          <p className="text-xs text-[#DDD0BC] leading-relaxed">{exhibit.architecturalNote}</p>
        </div>

        {/* Archival Accession Metadata Grid */}
        <dl className="grid grid-cols-1 gap-2.5 pt-2 border-t border-[#E6C58D]/18 text-xs">
          <div className="flex items-baseline justify-between gap-4 border-b border-white/[0.06] pb-2">
            <dt className="text-[11px] uppercase tracking-wider text-[#B6A58D] shrink-0">Dönem</dt>
            <dd className="text-right text-[#F3EADB] font-medium">{exhibit.period}</dd>
          </div>
          <div className="flex items-baseline justify-between gap-4 border-b border-white/[0.06] pb-2">
            <dt className="text-[11px] uppercase tracking-wider text-[#B6A58D] shrink-0">Malzeme</dt>
            <dd className="text-right text-[#F3EADB] font-medium">{exhibit.material}</dd>
          </div>
          <div className="flex items-baseline justify-between gap-4">
            <dt className="text-[11px] uppercase tracking-wider text-[#B6A58D] shrink-0">Ölçüler</dt>
            <dd className="text-right text-[#F3EADB] font-medium">{exhibit.dimensions}</dd>
          </div>
        </dl>
      </div>

      {/* Bottom Curatorial Action Bar */}
      <div className="px-5 py-3.5 border-t border-[#E6C58D]/20 bg-black/25 flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={onToggleVoice}
          className={`flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
            voicePlaying || voiceLoading
              ? 'bg-[#C85A32] hover:bg-[#B24C27] text-[#FAF2E2]'
              : 'bg-[#E6C58D] hover:bg-[#F0D39E] text-[#1D150F]'
          }`}
        >
          {voicePlaying || voiceLoading ? (
            <Square className="w-3.5 h-3.5 fill-current shrink-0" aria-hidden="true" />
          ) : (
            <Headphones className="w-4 h-4 shrink-0" aria-hidden="true" />
          )}
          <span>
            {voiceLoading
              ? 'Sesli Rehber Hazırlanıyor...'
              : voicePlaying
                ? 'Sesli Rehberi Durdur'
                : 'Sesli Rehberi Dinle'}
          </span>
        </button>

        <button
          type="button"
          onClick={onClose}
          className="px-3.5 py-2.5 rounded-xl bg-white/10 hover:bg-white/16 border border-white/15 text-xs font-semibold text-[#F6EFE2] transition-colors cursor-pointer shrink-0"
        >
          Keşfe Dön
        </button>
      </div>
    </aside>
  );
}
