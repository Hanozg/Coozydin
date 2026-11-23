import {
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Headphones,
  Home,
  Info,
  Landmark,
  MapPin,
  Pause,
  Play,
  Radio,
  Square,
} from 'lucide-react';
import { AydinTopographicMinimap } from '../AydinTopographicMinimap';
import { getFigTreeStage, LANDMARKS } from '../../data/efelerData';
import {
  CameraPreset,
  ErrandDef,
  ExplorationMode,
  LandmarkDef,
  LofiTrackId,
  PlayerHudSnapshot,
  RadioStationDef,
} from '../../types/game';
import { TREAT_LABELS } from './hudTypes';

interface TopTelemetryBarProps {
  hud: PlayerHudSnapshot;
  explorationMode: ExplorationMode;
  profileName: string;
  profileEmoji: string;
  isCloudSignedIn: boolean;
  cameraPreset: CameraPreset;
  discoveredIds: string[];
  coins: number;
  lokmaPower: number;
  activeErrand: ErrandDef | null;
  errandPickedUp: boolean;
  errandTargetName: string | null;
  recentlyDiscovered: LandmarkDef | null;
  errandToast: string | null;
  voiceGuideLandmark: LandmarkDef | null;
  voiceGuideLoading: boolean;
  isCompactLandscape: boolean;
  isCompactViewport: boolean;
  touchControlsEnabled: boolean;
  currentStation: RadioStationDef;
  districtStation: RadioStationDef;
  lofiTrack: LofiTrackId;
  autoDistrictRadio: boolean;
  isRadioPlaying: boolean;
  onToggleRadioDrawer: () => void;
  onCycleRadioStation: (dir: -1 | 1) => void;
  onChangeLofiTrack: (next: LofiTrackId) => void;
  onToggleMusic: () => void;
  onOpenProfile: () => void;
  onEnterHome: () => void;
  onEnterAncientMuseum: () => void;
  onOpenRealMap: () => void;
  onOpenJournal: () => void;
  onToggleVoiceGuide: () => void;
  onStopVoiceGuide: () => void;
  onOpenAbout: () => void;
  onPause: () => void;
  onJumpToLandmark: (landmark: LandmarkDef) => void;
}

export function TopTelemetryBar({
  hud,
  explorationMode,
  profileName,
  profileEmoji,
  isCloudSignedIn,
  cameraPreset,
  discoveredIds,
  coins,
  lokmaPower,
  activeErrand,
  errandPickedUp,
  errandTargetName,
  recentlyDiscovered,
  errandToast,
  voiceGuideLandmark,
  voiceGuideLoading,
  isCompactLandscape,
  isCompactViewport,
  touchControlsEnabled,
  currentStation,
  districtStation,
  lofiTrack,
  autoDistrictRadio,
  isRadioPlaying,
  onToggleRadioDrawer,
  onCycleRadioStation,
  onChangeLofiTrack,
  onToggleMusic,
  onOpenProfile,
  onEnterHome,
  onEnterAncientMuseum,
  onOpenRealMap,
  onOpenJournal,
  onToggleVoiceGuide,
  onStopVoiceGuide,
  onOpenAbout,
  onPause,
  onJumpToLandmark,
}: TopTelemetryBarProps) {
  const figStage = getFigTreeStage(coins);

  return (
    <>
      {/* Screen-Projected Speech Bubble for Mendil & Lif Satıcısı */}
      {hud.vendorBubble?.visible && (
        <div
          className="absolute z-20 -translate-x-1/2 -translate-y-full pb-2 pointer-events-none"
          style={{
            left: `${hud.vendorBubble.x}px`,
            top: `${hud.vendorBubble.y}px`,
          }}
        >
          <div className="rounded-xl bg-[#FAF2E2] text-[#3A2618] border-2 border-[#B99464] px-3 py-1.5 sm:px-3.5 sm:py-2 text-[11px] sm:text-xs font-semibold shadow-lg max-w-[78vw] sm:max-w-sm text-center leading-snug">
            “{hud.vendorBubble.text}”
          </div>
        </div>
      )}

      {/* Top Perimeter Row */}
      <div className="flex items-start justify-between gap-2 sm:gap-4">
        {/* Top-Left Column: District Telemetry + Compact Regional Radio Mini-Player */}
        <div
          className={`flex ${
            isCompactLandscape
              ? 'flex-row flex-wrap items-center gap-1.5 max-w-[60vw]'
              : 'flex-col items-start gap-1.5 sm:gap-2 max-w-[54vw] sm:max-w-xl'
          }`}
        >
          <div
            className={`pointer-events-auto rounded-2xl bg-[#F7EEDC]/94 border-2 border-[#B99464] text-[#3A2618] shadow-md ${
              isCompactLandscape ? 'px-2.5 py-1' : 'px-3 py-2 sm:px-4 sm:py-3 w-full'
            }`}
          >
            <div
              className={`font-display font-bold leading-tight tracking-tight truncate text-[#3A2618] ${
                isCompactLandscape ? 'text-xs max-w-[160px]' : 'text-sm sm:text-base md:text-lg'
              }`}
            >
              {hud.currentStreet}
            </div>
            <div
              className={`flex flex-wrap items-center gap-x-1.5 sm:gap-x-2 gap-y-0.5 text-[#6B5038] font-medium ${
                isCompactLandscape ? 'text-[10px] mt-0' : 'text-[11px] sm:text-xs mt-0.5 sm:mt-1'
              }`}
            >
              {!isCompactLandscape && (
                <>
                  <span className="hidden sm:inline">{hud.currentDistrict}</span>
                  <span className="hidden sm:inline" aria-hidden="true">·</span>
                </>
              )}
              {hud.solarClock && !isCompactLandscape && (
                <span className="inline-flex items-center gap-x-1.5 sm:gap-x-2">
                  <span className="font-mono-num text-[#3A2618] font-semibold">
                    {hud.solarClock}
                  </span>
                  <span aria-hidden="true">·</span>
                </span>
              )}
              <span className="font-mono-num text-[#3A2618] font-semibold">
                {hud.speedKmh} km/s
              </span>
              <span aria-hidden="true">·</span>
              <span
                className="font-mono-num text-[#4B743B] font-semibold"
                title="1:100 Aydın Haritası Gerçek Rakım"
              >
                {hud.elevationMeters ?? 64} m
              </span>
              <span aria-hidden="true">·</span>
              <span className="font-mono-num">
                {discoveredIds.length}/{LANDMARKS.length}
              </span>
              <span aria-hidden="true">·</span>
              <span className="font-mono-num text-[#B84C27] font-semibold">{coins} İncir</span>
              {!isCompactLandscape && (
                <>
                  <span className="hidden xs:inline sm:inline" aria-hidden="true">·</span>
                  <span className="font-mono-num text-[#8F5624] font-semibold">
                    {lokmaPower} Lokma
                  </span>
                  <span className="hidden md:inline" aria-hidden="true">·</span>
                  <span className="hidden md:inline text-[#4B743B] font-semibold">{figStage.label}</span>
                </>
              )}
            </div>
          </div>

          {/* Efeler Regional Radio Mini-Player */}
          <div
            className={`pointer-events-auto inline-flex items-center gap-1 rounded-2xl bg-[#F7EEDC]/94 border-2 border-[#B99464] text-[#3A2618] shadow-md max-w-full ${
              isCompactLandscape ? 'px-1.5 py-0.5' : 'sm:gap-1.5 px-2 py-1 sm:px-2.5 sm:py-1.5'
            }`}
          >
            <button
              type="button"
              onClick={onToggleRadioDrawer}
              title="Efeler Bölge Radyosu İstasyonlarını Aç"
              className="flex items-center gap-1.5 min-w-0 text-left cursor-pointer group"
            >
              <span
                className="inline-flex items-center justify-center w-6 h-6 rounded-lg shrink-0 text-[#FAF2E2]"
                style={{ backgroundColor: currentStation.accentColor }}
              >
                {isRadioPlaying ? (
                  <span className="inline-flex items-end gap-[2px] h-3" aria-hidden="true">
                    <span className="w-[2.5px] h-2 bg-[#FAF2E2] rounded-full animate-pulse" />
                    <span className="w-[2.5px] h-3 bg-[#FAF2E2] rounded-full animate-pulse [animation-delay:150ms]" />
                    <span className="w-[2.5px] h-1.5 bg-[#FAF2E2] rounded-full animate-pulse [animation-delay:300ms]" />
                  </span>
                ) : (
                  <Radio className="w-3.5 h-3.5" aria-hidden="true" />
                )}
              </span>

              <span className="min-w-0">
                <span className="flex items-center gap-1 text-[11px] font-bold text-[#3A2618] leading-tight">
                  <span className="font-mono-num text-[#B84C27] shrink-0">
                    {currentStation.frequency}
                  </span>
                  <span className="truncate max-w-[90px] sm:max-w-[140px] group-hover:text-[#B84C27] transition-colors">
                    {currentStation.label}
                  </span>
                </span>
                <span className="hidden sm:block text-[10px] text-[#6B5038] truncate max-w-[180px] leading-tight">
                  {autoDistrictRadio ? `Oto: ${currentStation.region}` : currentStation.region}
                </span>
              </span>
            </button>

            <div className="flex items-center gap-0.5 pl-1 border-l border-[#B99464]/40 shrink-0">
              <button
                type="button"
                onClick={() => onCycleRadioStation(-1)}
                title="Önceki İstasyon"
                aria-label="Önceki İstasyon"
                className="w-6 h-6 rounded-lg hover:bg-[#EDE0C6] flex items-center justify-center text-[#5B432F] cursor-pointer"
              >
                <ChevronLeft className="w-3.5 h-3.5" aria-hidden="true" />
              </button>

              <button
                type="button"
                onClick={() => {
                  if (lofiTrack === 'ambient_only') {
                    onChangeLofiTrack(districtStation.id);
                  } else {
                    onToggleMusic();
                  }
                }}
                title={isRadioPlaying ? 'Radyoyu Duraklat' : 'Radyoyu Çal'}
                aria-label={isRadioPlaying ? 'Radyoyu Duraklat' : 'Radyoyu Çal'}
                className={`w-6 h-6 rounded-lg flex items-center justify-center cursor-pointer transition-colors ${
                  isRadioPlaying
                    ? 'bg-[#C85A32] text-[#FAF2E2]'
                    : 'bg-[#EDE0C6] text-[#3A2618] hover:bg-[#E2D1B2]'
                }`}
              >
                {isRadioPlaying ? (
                  <Pause className="w-3 h-3" aria-hidden="true" />
                ) : (
                  <Play className="w-3 h-3" aria-hidden="true" />
                )}
              </button>

              <button
                type="button"
                onClick={() => onCycleRadioStation(1)}
                title="Sonraki İstasyon"
                aria-label="Sonraki İstasyon"
                className="w-6 h-6 rounded-lg hover:bg-[#EDE0C6] flex items-center justify-center text-[#5B432F] cursor-pointer"
              >
                <ChevronRight className="w-3.5 h-3.5" aria-hidden="true" />
              </button>
            </div>
          </div>
        </div>

        {/* Top-Right Compact Parchment Action Ribbon */}
        <div className="flex flex-col items-end gap-1 sm:gap-2 pointer-events-auto shrink-0">
          <div
            className={`flex items-center gap-1 rounded-2xl bg-[#F7EEDC]/94 border-2 border-[#B99464] shadow-md ${
              isCompactLandscape ? 'p-0.5' : 'sm:gap-1.5 p-1 sm:p-1.5'
            }`}
          >
            <button
              type="button"
              onClick={onOpenProfile}
              title="Profilim ve Bulut Kayıt"
              aria-label="Profilim ve Bulut Kayıt"
              className={`inline-flex items-center gap-1.5 rounded-xl bg-[#EFE0C3] hover:bg-[#E4D1AE] border border-[#B99464]/60 text-xs font-semibold text-[#3A2618] transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                isCompactLandscape ? 'px-2 py-1.5' : 'px-2.5 sm:px-3 py-1.5'
              }`}
            >
              <span key={profileEmoji} className="text-sm leading-none" aria-hidden="true">
                {profileEmoji}
              </span>
              {!isCompactLandscape && (
                <>
                  <span className="hidden md:inline max-w-[96px] truncate">{profileName}</span>
                  <span className="hidden sm:inline md:hidden">Profil</span>
                </>
              )}
              {isCloudSignedIn && (
                <span
                  className="w-2 h-2 rounded-full bg-[#5D8A48] shrink-0"
                  title="Bulut Kaydı Aktif"
                  aria-hidden="true"
                />
              )}
            </button>

            <button
              type="button"
              onClick={onEnterHome}
              title="Evim"
              aria-label="Evim"
              className={`inline-flex items-center gap-1.5 rounded-xl bg-[#EFE0C3] hover:bg-[#E4D1AE] border border-[#5D8A48]/40 text-xs font-semibold text-[#3A2618] transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                isCompactLandscape ? 'p-1.5' : 'px-2.5 sm:px-3 py-1.5'
              }`}
            >
              <Home className="w-4 h-4 sm:w-3.5 sm:h-3.5 text-[#4B743B]" aria-hidden="true" />
              {!isCompactLandscape && <span className="hidden sm:inline">Evim</span>}
            </button>

            <button
              type="button"
              onClick={onEnterAncientMuseum}
              title="Tralleis Antik Kenti & Açık Hava Müzesi"
              aria-label="Antik Kent Müzesi"
              className={`inline-flex items-center gap-1.5 rounded-xl bg-[#EFE0C3] hover:bg-[#E4D1AE] border border-[#8F5624]/45 text-xs font-semibold text-[#3A2618] transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                isCompactLandscape ? 'p-1.5' : 'px-2.5 sm:px-3 py-1.5'
              }`}
            >
              <Landmark className="w-4 h-4 sm:w-3.5 sm:h-3.5 text-[#8F5624]" aria-hidden="true" />
              {!isCompactLandscape && <span className="hidden sm:inline">Antik Kent</span>}
            </button>

            <button
              type="button"
              onClick={onOpenRealMap}
              title="Gerçek Harita"
              aria-label="Gerçek Harita"
              className={`inline-flex items-center gap-1.5 rounded-xl bg-[#EFE0C3] hover:bg-[#E4D1AE] border border-[#C85A32]/40 text-xs font-semibold text-[#3A2618] transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                isCompactLandscape ? 'p-1.5' : 'px-2.5 sm:px-3 py-1.5'
              }`}
            >
              <MapPin className="w-4 h-4 sm:w-3.5 sm:h-3.5 text-[#B84C27]" aria-hidden="true" />
              {!isCompactLandscape && (
                <>
                  <span className="hidden md:inline">Gerçek Harita</span>
                  <span className="hidden sm:inline md:hidden">Harita</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={onOpenJournal}
              title="Keşif Defteri"
              aria-label="Keşif Defteri"
              className={`inline-flex items-center gap-1.5 rounded-xl hover:bg-[#EDE0C6] text-xs font-semibold text-[#3A2618] transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                isCompactLandscape ? 'p-1.5' : 'px-2.5 sm:px-3 py-1.5'
              }`}
            >
              <BookOpen className="w-4 h-4 sm:w-3.5 sm:h-3.5 text-[#9C5D29]" aria-hidden="true" />
              {!isCompactLandscape && (
                <>
                  <span className="hidden md:inline">Keşif Defteri</span>
                  <span className="hidden sm:inline md:hidden">Defter</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={onToggleVoiceGuide}
              aria-pressed={Boolean(voiceGuideLandmark)}
              title={
                voiceGuideLoading
                  ? 'Sesli Rehber hazırlanıyor...'
                  : voiceGuideLandmark
                    ? `Sesli Rehber’i Durdur (${voiceGuideLandmark.name})`
                    : hud.nearbyLandmark
                      ? `Sesli Rehber: ${hud.nearbyLandmark.name}`
                      : 'Sesli Rehber (Yakındaki tarihi yapı hakkında bilgi dinle)'
              }
              aria-label="Sesli Rehber"
              className={`inline-flex items-center gap-1.5 rounded-xl text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                isCompactLandscape ? 'p-1.5' : 'px-2.5 sm:px-3 py-1.5'
              } ${
                voiceGuideLandmark || voiceGuideLoading
                  ? 'bg-[#C85A32] text-[#FAF2E2] border border-[#9E4120]'
                  : hud.nearbyLandmark
                    ? 'bg-[#EFE0C3] hover:bg-[#E4D1AE] border border-[#C85A32]/70 text-[#3A2618]'
                    : 'hover:bg-[#EDE0C6] text-[#3A2618]'
              }`}
            >
              <Headphones
                className={`w-4 h-4 sm:w-3.5 sm:h-3.5 ${
                  voiceGuideLandmark || voiceGuideLoading
                    ? 'text-[#FAF2E2] animate-pulse'
                    : hud.nearbyLandmark
                      ? 'text-[#B84C27]'
                      : 'text-[#6B5038]'
                }`}
                aria-hidden="true"
              />
              {!isCompactLandscape && (
                <span className="hidden sm:inline">
                  {voiceGuideLoading
                    ? 'Hazırlanıyor...'
                    : voiceGuideLandmark
                      ? 'Rehber · Durdur'
                      : 'Sesli Rehber'}
                </span>
              )}
              {hud.nearbyLandmark && !voiceGuideLandmark && !voiceGuideLoading && (
                <span className="w-2 h-2 rounded-full bg-[#C85A32] shrink-0" aria-hidden="true" />
              )}
            </button>

            <button
              type="button"
              onClick={onOpenAbout}
              aria-label="Hakkında"
              title="Hakkında"
              className={`inline-flex items-center gap-1.5 rounded-xl hover:bg-[#EDE0C6] text-xs font-semibold text-[#3A2618] transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                isCompactLandscape ? 'p-1.5' : 'px-2 sm:px-2.5 py-1.5'
              }`}
            >
              <Info className="w-4 h-4 sm:w-3.5 sm:h-3.5 text-[#B84C27]" aria-hidden="true" />
              {!isCompactLandscape && <span className="hidden xl:inline">Hakkında</span>}
            </button>

            <button
              type="button"
              onClick={onPause}
              aria-label="Duraklat"
              title="Duraklat"
              className={`inline-flex items-center gap-1.5 rounded-xl hover:bg-[#EDE0C6] text-xs font-semibold text-[#3A2618] transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                isCompactLandscape ? 'p-1.5' : 'px-2 sm:px-2.5 py-1.5'
              }`}
            >
              <Pause className="w-4 h-4 sm:w-3.5 sm:h-3.5 text-[#6B5038]" aria-hidden="true" />
              {!isCompactLandscape && <span className="hidden lg:inline">Duraklat</span>}
            </button>
          </div>

          {activeErrand && errandTargetName && (
            <div className="rounded-xl bg-[#F7EEDC]/96 border-2 border-[#5D8A48]/70 px-3 py-1.5 sm:px-3.5 sm:py-2 text-right max-w-[52vw] sm:max-w-xs shadow-md">
              <div className="text-[10px] sm:text-[11px] text-[#456D36] font-semibold">
                <span key={errandPickedUp ? 'deliver' : 'pickup'}>
                  {errandPickedUp ? 'Teslimat' : 'Alım'}
                </span>
                {hud.distanceToActiveErrand !== null && (
                  <span className="font-mono-num">
                    <span> · </span>
                    <span>{hud.distanceToActiveErrand} m</span>
                  </span>
                )}
              </div>
              <div className="text-[11px] sm:text-xs text-[#3A2618] font-semibold truncate">
                <span>{activeErrand.title}</span>
                <span> → </span>
                <span>{errandTargetName}</span>
              </div>
            </div>
          )}

          {(hud.heldTreat !== 'none' ||
            hud.companionName ||
            hud.isDancingZeybek ||
            cameraPreset === 'first_person' ||
            cameraPreset === 'perspective' ||
            explorationMode === 'sparrow') && (
            <div className="rounded-xl bg-[#F7EEDC]/96 border-2 border-[#B99464] px-3 py-1.5 text-right max-w-[62vw] sm:max-w-xs shadow-md space-y-1">
              {hud.isDancingZeybek && (
                <div className="text-[11px] font-bold text-[#B84C27]">
                  ♪ Zeybek Oynanıyor · Kent Meydanı
                </div>
              )}
              {(hud.heldTreat !== 'none' || hud.companionName) && (
                <div className="text-[11px] font-semibold text-[#3A2618]">
                  {hud.heldTreat !== 'none' && (
                    <span key={hud.heldTreat}>{TREAT_LABELS[hud.heldTreat]}</span>
                  )}
                  {hud.companionName && (
                    <span className="text-[#4B743B]">
                      {hud.heldTreat !== 'none' && <span> · </span>}
                      <span>Yürüyüş: {hud.companionName}</span>
                    </span>
                  )}
                </div>
              )}
              {explorationMode === 'sparrow' && (
                <div className="space-y-1">
                  <div className="flex items-center justify-end gap-2 text-[11px] font-semibold text-[#3A2618]">
                    <span className="text-[#B84C27]">
                      <span>Serçe · </span>
                      <span key={hud.sparrowState ?? 'ground'}>
                        {hud.sparrowState === 'flying'
                          ? 'Uçuyor'
                          : hud.sparrowState === 'perched'
                            ? 'Tünemiş'
                            : 'Yerde'}
                      </span>
                    </span>
                    <span className="font-mono-num text-[#6B5038]">
                      %{Math.round((hud.sparrowStamina ?? 1) * 100)}
                    </span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-[#E5D3B3] overflow-hidden">
                    <div
                      className="h-full rounded-full bg-[#C85A32] transition-[width] duration-150"
                      style={{
                        width: `${Math.max(4, Math.round((hud.sparrowStamina ?? 1) * 100))}%`,
                      }}
                    />
                  </div>
                  {!touchControlsEnabled && (
                    <div className="text-[10px] font-medium text-[#6B5038]">
                      [Space] Kanat · [Shift] Dalış · [Q] Öt · Sürükle: Bak
                    </div>
                  )}
                </div>
              )}
              {explorationMode !== 'sparrow' && cameraPreset === 'first_person' && !isCompactLandscape && (
                <div className="text-[10px] font-medium text-[#6B5038]">
                  1. Şahıs Bakış · Etrafa bakmak için sürükle
                </div>
              )}
              {explorationMode !== 'sparrow' && cameraPreset === 'perspective' && !isCompactLandscape && (
                <div className="text-[10px] font-medium text-[#6B5038]">
                  Omuz Arkası Bakış · Etrafa bakmak için sürükle
                </div>
              )}
            </div>
          )}

          <AydinTopographicMinimap
            playerPos={hud.playerPos}
            headingRad={hud.headingRad}
            elevationMeters={hud.elevationMeters ?? 64}
            currentDistrict={hud.currentDistrict}
            discoveredIds={discoveredIds}
            activeErrand={activeErrand}
            errandPickedUp={errandPickedUp}
            isCompactViewport={isCompactViewport}
            onJumpToLandmark={onJumpToLandmark}
          />
        </div>
      </div>

      {/* Discovery / Errand Celebration Banner (Non-blocking, top-center) */}
      {(recentlyDiscovered || errandToast) ? (
        <div className="self-center pointer-events-auto rounded-2xl bg-[#F7EEDC]/98 border-2 border-[#C85A32]/75 px-5 py-3 text-center max-w-md shadow-xl">
          {recentlyDiscovered ? (
            <div key={`disc-${recentlyDiscovered.id}`}>
              <div className="text-xs text-[#B84C27] font-semibold">
                Tarihi Yapı Keşfedildi · +{recentlyDiscovered.rewardCoins} İncir · +1 Lokma · Efeler
                Gezgini Rozeti!
              </div>
              <div className="font-display text-base font-bold text-[#3A2618] mt-0.5">
                {recentlyDiscovered.name}
              </div>
              <div className="text-xs text-[#6B5038] mt-1 line-clamp-2">
                {recentlyDiscovered.summary}
              </div>
            </div>
          ) : (
            <div key="errand-toast" className="text-xs md:text-sm text-[#456D36] font-semibold">
              {errandToast}
            </div>
          )}
        </div>
      ) : (
        (voiceGuideLandmark || voiceGuideLoading) && (
          <div className="self-center pointer-events-auto inline-flex items-center gap-2.5 rounded-2xl bg-[#3A2618]/94 border-2 border-[#B99464] px-3.5 py-2 text-[#FAF2E2] shadow-xl max-w-[88vw] sm:max-w-md">
            <Headphones className="w-4 h-4 text-[#FFD43B] animate-pulse shrink-0" aria-hidden="true" />
            <div className="min-w-0 text-left">
              <div className="text-[10px] font-bold uppercase tracking-wide text-[#FFD43B]">
                {voiceGuideLoading ? 'Sesli Rehber Hazırlanıyor...' : 'Sesli Rehber Anlatıyor'}
              </div>
              <div className="text-xs font-semibold truncate">
                {voiceGuideLandmark?.name || hud.nearbyLandmark?.name || ''}
              </div>
            </div>
            <button
              type="button"
              onClick={onStopVoiceGuide}
              aria-label="Sesli Rehberi Durdur"
              title="Sesli Rehberi Durdur"
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#C85A32] hover:bg-[#B44D28] text-[11px] font-bold text-[#FAF2E2] shrink-0 cursor-pointer transition-colors"
            >
              <Square className="w-3 h-3 fill-current" aria-hidden="true" />
              <span>{voiceGuideLoading ? 'İptal' : 'Durdur'}</span>
            </button>
          </div>
        )
      )}
    </>
  );
}
