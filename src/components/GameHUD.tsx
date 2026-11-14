import {
  type PointerEvent as ReactPointerEvent,
  type MouseEvent as ReactMouseEvent,
  memo,
  useEffect,
  useState,
} from 'react';
import {
  ArrowDown,
  ArrowUp,
  Bike,
  Bird,
  BookOpen,
  Camera,
  Car,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Clock,
  CloudRain,
  Compass,
  Eye,
  Feather,
  Footprints,
  Gamepad2,
  Home,
  MapPin,
  MessageCircle,
  Music,
  Paintbrush,
  Pause,
  Play,
  Radio,
  SlidersHorizontal,
  Sparkles,
  Sun,
  Volume2,
  VolumeX,
  Wind,
  X,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import { TouchDriveInput } from './EfelerCanvas';
import { VirtualJoystick } from './VirtualJoystick';
import {
  ACCENT_SWATCHES,
  getFigTreeStage,
  getRadioStationForDistrict,
  HOUSE_ROOF_SWATCHES,
  HOUSE_STYLE_OPTIONS,
  HOUSE_TRIM_SWATCHES,
  HOUSE_WALL_SWATCHES,
  LANDMARKS,
  LOFI_TRACKS,
  PAINT_SWATCHES,
  RADIO_STATIONS,
  SEASON_OPTIONS,
  TIME_MOODS,
  WEATHER_OPTIONS,
} from '../data/efelerData';
import {
  BuildingNpcDef,
  CameraPreset,
  ErrandDef,
  ExplorationMode,
  HeldTreatType,
  HouseExteriorConfig,
  LandmarkDef,
  LofiTrackId,
  PlayerHudSnapshot,
  SeasonType,
  TimeOfDay,
  VehicleConfig,
  VehicleType,
  WeatherType,
} from '../types/game';

const TREAT_LABELS: Record<Exclude<HeldTreatType, 'none'>, string> = {
  coffee: '☕ Türk Kahvesi',
  simit: '🥨 Susamlı Simit',
  kumpir: '🥔 Sıcak Kumpir',
  keskek: '🥣 Aydın Keşkeği',
  icecream: '🍦 Cornet Dondurma',
};

interface GameHUDProps {
  hud: PlayerHudSnapshot;
  explorationMode: ExplorationMode;
  vehicleConfig: VehicleConfig;
  houseExterior: HouseExteriorConfig;
  profileName: string;
  profileEmoji: string;
  isCloudSignedIn: boolean;
  timeOfDay: TimeOfDay;
  season: SeasonType;
  weather: WeatherType;
  autoAtmosphere: boolean;
  lofiTrack: LofiTrackId;
  autoDistrictRadio: boolean;
  cameraPreset: CameraPreset;
  discoveredIds: string[];
  coins: number;
  lokmaPower: number;
  activeErrand: ErrandDef | null;
  errandPickedUp: boolean;
  recentlyDiscovered: LandmarkDef | null;
  errandToast: string | null;
  isMuted: boolean;
  musicEnabled: boolean;
  onChangeExplorationMode: (next: ExplorationMode) => void;
  onChangeVehicleConfig: (next: VehicleConfig) => void;
  onChangeHouseExterior: (next: HouseExteriorConfig) => void;
  onChangeTimeOfDay: (next: TimeOfDay) => void;
  onChangeSeason: (next: SeasonType) => void;
  onChangeWeather: (next: WeatherType) => void;
  onToggleAutoAtmosphere: () => void;
  onChangeLofiTrack: (next: LofiTrackId) => void;
  onToggleAutoDistrictRadio: () => void;
  onChangeCameraPreset: (next: CameraPreset) => void;
  onInteractNpc: (npc: BuildingNpcDef) => void;
  onToggleMute: () => void;
  onToggleMusic: () => void;
  onOpenJournal: () => void;
  onOpenRealMap: () => void;
  onOpenProfile: () => void;
  onEnterHome: () => void;
  onPause: () => void;
  onDiscoverNearby: () => void;
  onHorn: () => void;
  onChirp?: () => void;
  onTouchInput: (next: Partial<TouchDriveInput>) => void;
  onAdjustZoom: (delta: number) => void;
}

export const GameHUD = memo(function GameHUD({
  hud,
  explorationMode,
  vehicleConfig,
  houseExterior,
  profileName,
  profileEmoji,
  isCloudSignedIn,
  timeOfDay,
  season,
  weather,
  autoAtmosphere,
  lofiTrack,
  autoDistrictRadio,
  cameraPreset,
  discoveredIds,
  coins,
  lokmaPower,
  activeErrand,
  errandPickedUp,
  recentlyDiscovered,
  errandToast,
  isMuted,
  musicEnabled,
  onChangeExplorationMode,
  onChangeVehicleConfig,
  onChangeHouseExterior,
  onChangeTimeOfDay,
  onChangeSeason,
  onChangeWeather,
  onToggleAutoAtmosphere,
  onChangeLofiTrack,
  onToggleAutoDistrictRadio,
  onChangeCameraPreset,
  onInteractNpc,
  onToggleMute,
  onToggleMusic,
  onOpenJournal,
  onOpenRealMap,
  onOpenProfile,
  onEnterHome,
  onPause,
  onDiscoverNearby,
  onHorn,
  onChirp,
  onTouchInput,
  onAdjustZoom,
}: GameHUDProps) {
  const [viewport, setViewport] = useState(() => {
    if (typeof window === 'undefined') {
      return { width: 1280, height: 800, coarse: false };
    }
    return {
      width: window.innerWidth,
      height: window.innerHeight,
      coarse: window.matchMedia('(pointer: coarse)').matches || navigator.maxTouchPoints > 0,
    };
  });

  useEffect(() => {
    const updateViewport = () => {
      setViewport({
        width: window.innerWidth,
        height: window.innerHeight,
        coarse: window.matchMedia('(pointer: coarse)').matches || navigator.maxTouchPoints > 0,
      });
    };
    window.addEventListener('resize', updateViewport);
    window.addEventListener('orientationchange', updateViewport);
    return () => {
      window.removeEventListener('resize', updateViewport);
      window.removeEventListener('orientationchange', updateViewport);
    };
  }, []);

  const isCompactLandscape = viewport.width > viewport.height && viewport.height <= 540;
  const isCompactViewport = viewport.coarse || isCompactLandscape || viewport.width < 768;

  const [dockCollapsed, setDockCollapsed] = useState(() => {
    if (typeof window === 'undefined') return false;
    const coarse = window.matchMedia('(pointer: coarse)').matches || navigator.maxTouchPoints > 0;
    return coarse || window.innerHeight <= 540 || window.innerWidth < 768;
  });
  const [activeDrawer, setActiveDrawer] = useState<
    'none' | 'garage' | 'house' | 'atmosphere' | 'radio'
  >('none');
  const [mobileDockTab, setMobileDockTab] = useState<'move' | 'view' | 'design'>('move');
  const [touchControlsEnabled, setTouchControlsEnabled] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(pointer: coarse)').matches || window.innerWidth < 768;
  });

  useEffect(() => {
    if (isCompactLandscape) {
      setDockCollapsed(true);
    }
  }, [isCompactLandscape]);

  const figStage = getFigTreeStage(coins);

  const bindDriveButton = (key: keyof TouchDriveInput) => ({
    onPointerDown: (e: ReactPointerEvent<HTMLButtonElement>) => {
      e.preventDefault();
      e.stopPropagation();
      e.currentTarget.setPointerCapture(e.pointerId);
      onTouchInput({ [key]: true });
    },
    onPointerUp: (e: ReactPointerEvent<HTMLButtonElement>) => {
      e.stopPropagation();
      if (e.currentTarget.hasPointerCapture(e.pointerId)) {
        e.currentTarget.releasePointerCapture(e.pointerId);
      }
      onTouchInput({ [key]: false });
    },
    onPointerCancel: () => onTouchInput({ [key]: false }),
    onLostPointerCapture: () => onTouchInput({ [key]: false }),
    onContextMenu: (e: ReactMouseEvent<HTMLButtonElement>) => e.preventDefault(),
  });

  const nearbyIsUndiscovered =
    hud.nearbyLandmark && !discoveredIds.includes(hud.nearbyLandmark.id);

  const nearbyIsErrandPoint =
    hud.nearbyLandmark &&
    activeErrand &&
    (errandPickedUp
      ? activeErrand.toLandmarkId === hud.nearbyLandmark.id
      : activeErrand.fromLandmarkId === hud.nearbyLandmark.id);

  const setVehicleType = (type: VehicleType) => {
    onChangeVehicleConfig({ ...vehicleConfig, type });
    if (explorationMode !== 'vehicle') {
      onChangeExplorationMode('vehicle');
    }
  };

  const cycleCameraPreset = () => {
    const order: CameraPreset[] = ['isometric', 'perspective', 'first_person'];
    const idx = order.indexOf(cameraPreset);
    onChangeCameraPreset(order[(idx + 1) % order.length]);
  };

  const errandTargetName = activeErrand
    ? LANDMARKS.find(
        (l) =>
          l.id ===
          (errandPickedUp ? activeErrand.toLandmarkId : activeErrand.fromLandmarkId)
      )?.name
    : null;

  const currentStation =
    RADIO_STATIONS.find((s) => s.id === lofiTrack) ?? RADIO_STATIONS[0];
  const districtStation = getRadioStationForDistrict(hud.currentDistrict);
  const isRadioPlaying =
    musicEnabled && !isMuted && lofiTrack !== 'ambient_only';

  const cycleRadioStation = (dir: -1 | 1) => {
    const idx = RADIO_STATIONS.findIndex((s) => s.id === lofiTrack);
    const currentIdx = idx >= 0 ? idx : 0;
    const nextIdx = (currentIdx + dir + RADIO_STATIONS.length) % RADIO_STATIONS.length;
    onChangeLofiTrack(RADIO_STATIONS[nextIdx].id);
  };

  const rootPaddingClass = isCompactLandscape
    ? 'pl-[max(0.6rem,env(safe-area-inset-left))] pr-[max(0.6rem,env(safe-area-inset-right))] pt-[max(0.4rem,env(safe-area-inset-top))] pb-[max(0.45rem,env(safe-area-inset-bottom))]'
    : 'p-2.5 sm:p-4 md:p-6 pt-[max(0.65rem,env(safe-area-inset-top))] pb-[max(0.65rem,env(safe-area-inset-bottom))] pl-[max(0.65rem,env(safe-area-inset-left))] pr-[max(0.65rem,env(safe-area-inset-right))]';

  return (
    <div className={`absolute inset-0 z-10 pointer-events-none flex flex-col justify-between ${rootPaddingClass}`}>
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
              onClick={() => {
                setDockCollapsed(false);
                setActiveDrawer((d) => (d === 'radio' ? 'none' : 'radio'));
              }}
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
                onClick={() => cycleRadioStation(-1)}
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
                onClick={() => cycleRadioStation(1)}
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
        </div>
      </div>

      {/* Discovery / Errand Celebration Banner (Non-blocking, top-center) */}
      {(recentlyDiscovered || errandToast) && (
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
      )}

      {/* Bottom Area: Nearby Prompt + Collapsible Bottom Dock */}
      <div className={`flex flex-col items-center ${isCompactLandscape ? 'gap-1.5' : 'gap-2.5'}`}>
        {hud.nearbyStreetInteraction ? (
          <button
            key="street-interaction"
            type="button"
            onClick={onDiscoverNearby}
            className="pointer-events-auto inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#C85A32] hover:bg-[#B44D28] border-2 border-[#FAF2E2]/80 text-[#FAF2E2] text-xs md:text-sm font-semibold shadow-lg transition-colors cursor-pointer"
          >
            <Sparkles className="w-4 h-4 shrink-0" aria-hidden="true" />
            <span className="truncate max-w-[75vw]">
              {touchControlsEnabled ? '' : '[E] '}
              {hud.nearbyStreetInteraction.label.replace(' (Tıkla veya E)', '')}
            </span>
          </button>
        ) : hud.nearbyNpc ? (
          <button
            key="nearby-npc"
            type="button"
            onClick={() => onInteractNpc(hud.nearbyNpc!)}
            className="pointer-events-auto inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#C85A32] hover:bg-[#B44D28] border-2 border-[#FAF2E2]/80 text-[#FAF2E2] text-xs md:text-sm font-semibold shadow-lg transition-colors cursor-pointer"
          >
            <MessageCircle className="w-4 h-4 shrink-0" aria-hidden="true" />
            <span>
              {touchControlsEnabled ? '' : '[E] '}
              {hud.nearbyNpc.name} ile Sohbet Et ({hud.nearbyNpc.role})
            </span>
          </button>
        ) : hud.nearPlayerHome ? (
          <div key="near-home" className="pointer-events-auto flex flex-wrap items-center justify-center gap-2">
            <button
              type="button"
              onClick={onEnterHome}
              className="inline-flex items-center gap-2 px-3.5 sm:px-5 py-2 rounded-xl bg-[#5D8A48] hover:bg-[#4F783C] border-2 border-[#FAF2E2]/80 text-[#FAF2E2] text-xs md:text-sm font-semibold shadow-lg transition-colors cursor-pointer"
            >
              <Home className="w-4 h-4" aria-hidden="true" />
              <span>{touchControlsEnabled ? 'Sıcak Yuvam’a Gir' : '[E] Sıcak Yuvam’a Gir (Evim)'}</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setDockCollapsed(false);
                setActiveDrawer((d) => (d === 'house' ? 'none' : 'house'));
              }}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#F7EEDC] hover:bg-[#EFE0C3] border-2 border-[#B99464] text-[#3A2618] text-xs md:text-sm font-semibold shadow-lg transition-colors cursor-pointer"
            >
              <Paintbrush className="w-4 h-4 text-[#C85A32]" aria-hidden="true" />
              <span>Dış Cepheyi Tasarla</span>
            </button>
          </div>
        ) : hud.nearbyLandmark && (nearbyIsUndiscovered || nearbyIsErrandPoint) ? (
          <button
            key="nearby-landmark"
            type="button"
            onClick={onDiscoverNearby}
            className="pointer-events-auto inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#C85A32] hover:bg-[#B44D28] border-2 border-[#FAF2E2]/80 text-[#FAF2E2] text-xs md:text-sm font-semibold shadow-lg transition-colors cursor-pointer"
          >
            <Compass className="w-4 h-4 shrink-0" aria-hidden="true" />
            <span>
              <span>
                {touchControlsEnabled ? '' : '[E] '}
                {hud.nearbyLandmark.name} —{' '}
              </span>
              <span
                key={
                  nearbyIsErrandPoint
                    ? errandPickedUp
                      ? 'deliver'
                      : 'pickup'
                    : 'discover'
                }
              >
                {nearbyIsErrandPoint
                  ? errandPickedUp
                    ? 'Görevi Teslim Et'
                    : 'Paketi Teslim Al'
                  : 'Yapıyı Keşfet'}
              </span>
            </span>
          </button>
        ) : (
          hud.nearAncientSignpost && (
            <button
              key="ancient-signpost"
              type="button"
              onClick={onDiscoverNearby}
              className="pointer-events-auto inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#F7EEDC] hover:bg-[#EFE0C3] border-2 border-[#B99464] text-[#3A2618] text-xs md:text-sm font-semibold shadow-lg transition-colors cursor-pointer"
            >
              <Compass className="w-4 h-4 text-[#B84C27]" aria-hidden="true" />
              <span>
                {touchControlsEnabled ? '' : '[E] '}Aydın Antik Kentleri Levhasını İncele
              </span>
            </button>
          )
        )}

        {/* Efeler Regional Radio Tuner Drawer */}
        {!dockCollapsed && activeDrawer === 'radio' && (
          <div className="pointer-events-auto w-full max-w-2xl max-h-[58dvh] sm:max-h-[42dvh] overflow-y-auto efeler-scroll rounded-2xl bg-[#F7EEDC]/98 border-2 border-[#B99464] p-3 sm:p-4 text-[#3A2618] shadow-xl space-y-2.5 sm:space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-[#B99464]/35">
              <div className="flex items-center gap-2.5">
                <span
                  className="inline-flex items-center justify-center w-9 h-9 rounded-xl text-[#FAF2E2] shadow-sm shrink-0"
                  style={{ backgroundColor: currentStation.accentColor }}
                >
                  <Radio className="w-5 h-5" aria-hidden="true" />
                </span>
                <div>
                  <div className="flex flex-wrap items-center gap-1.5 text-xs font-bold text-[#3A2618]">
                    <span>Efeler Bölge Radyosu</span>
                    <span className="px-2 py-0.5 rounded-md bg-[#EFE0C3] border border-[#B99464]/50 font-mono-num text-[10px] text-[#B84C27]">
                      {currentStation.frequency}
                    </span>
                  </div>
                  <div className="text-[11px] text-[#6B5038]">
                    Her semtin ruhuna özel Lo-Fi yayınları — seç veya bölgene göre ayarla.
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => onChangeLofiTrack(districtStation.id)}
                  title={`Bulunduğun bölgeye geç: ${districtStation.label}`}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#EFE0C3] hover:bg-[#E4D1AE] border border-[#B99464]/60 text-[11px] font-semibold text-[#3A2618] transition-colors cursor-pointer"
                >
                  <MapPin className="w-3.5 h-3.5 text-[#C85A32]" aria-hidden="true" />
                  <span>Bölgeme Geç</span>
                </button>

                <button
                  type="button"
                  onClick={onToggleAutoDistrictRadio}
                  className={`px-2.5 py-1.5 rounded-lg text-[11px] font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                    autoDistrictRadio
                      ? 'bg-[#5D8A48] text-[#FAF2E2]'
                      : 'bg-[#EDE0C6] text-[#5B432F] hover:bg-[#E2D1B2]'
                  }`}
                >
                  Oto Bölge: {autoDistrictRadio ? 'Açık' : 'Kapalı'}
                </button>

                <button
                  type="button"
                  onClick={() => setActiveDrawer('none')}
                  aria-label="Radyo Panelini Kapat"
                  className="p-1.5 rounded-lg bg-[#EDE0C6] hover:bg-[#E2D1B2] text-[#5B432F] transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" aria-hidden="true" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {RADIO_STATIONS.map((station) => {
                const isSelected = lofiTrack === station.id;
                const isHere = station.id === districtStation.id;
                return (
                  <button
                    key={station.id}
                    type="button"
                    onClick={() => onChangeLofiTrack(station.id)}
                    className={`text-left rounded-xl border-2 p-2.5 transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-[#EFE0C3] border-[#C85A32] shadow-sm'
                        : 'bg-[#FAF2E2]/90 border-[#B99464]/45 hover:bg-[#EFE0C3]/75'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <span
                          className="px-2 py-0.5 rounded-md text-[10px] font-bold font-mono-num text-[#FAF2E2] shrink-0"
                          style={{ backgroundColor: station.accentColor }}
                        >
                          {station.frequency}
                        </span>
                        <div className="min-w-0">
                          <div className="text-xs font-bold text-[#3A2618] truncate">
                            {station.label}
                          </div>
                          <div className="text-[10px] font-semibold text-[#6B5038] truncate">
                            {station.region}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        {isHere && (
                          <span className="px-1.5 py-0.5 rounded-md bg-[#5D8A48]/15 border border-[#5D8A48]/40 text-[9px] font-bold text-[#456D36]">
                            Bölgen
                          </span>
                        )}
                        {isSelected && (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-[#C85A32] text-[9px] font-bold text-[#FAF2E2]">
                            {isRadioPlaying ? 'Çalıyor' : 'Seçili'}
                          </span>
                        )}
                      </div>
                    </div>

                    <p className="text-[10px] text-[#5B432F] leading-snug mt-1.5">
                      {station.mood}
                    </p>
                    <div className="text-[9px] font-semibold text-[#8F5624] mt-1">
                      {station.bpmLabel}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Atmosphere (Seasons, Weather, Auto Cycle & Lo-Fi) Drawer */}
        {!dockCollapsed && activeDrawer === 'atmosphere' && (
          <div className="pointer-events-auto w-full max-w-2xl max-h-[58dvh] sm:max-h-[40dvh] overflow-y-auto efeler-scroll rounded-2xl bg-[#F7EEDC]/98 border-2 border-[#B99464] p-3 sm:p-4 text-[#3A2618] shadow-xl space-y-2.5 sm:space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-[#B99464]/35">
              <div>
                <div className="text-xs font-bold text-[#3A2618]">
                  Mevsim, Hava Durumu &amp; Lo-Fi Müzik
                </div>
                <div className="text-[11px] text-[#6B5038]">
                  Saat ve hava durumu seçilen mevsime göre kademeli olarak değişir.
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={onToggleAutoAtmosphere}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                    autoAtmosphere
                      ? 'bg-[#5D8A48] text-[#FAF2E2]'
                      : 'bg-[#EDE0C6] text-[#5B432F] hover:bg-[#E2D1B2]'
                  }`}
                >
                  <span>Oto Akış: </span>
                  <span key={autoAtmosphere ? 'on' : 'off'}>
                    {autoAtmosphere ? 'Açık' : 'Sabit'}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveDrawer('none')}
                  aria-label="Hava ve Müzik Panelini Kapat"
                  className="p-1.5 rounded-lg bg-[#EDE0C6] hover:bg-[#E2D1B2] text-[#5B432F] transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" aria-hidden="true" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <div className="text-[11px] font-semibold text-[#6B5038] mb-1.5">Mevsim</div>
                <div className="flex flex-wrap items-center gap-1.5">
                  {SEASON_OPTIONS.map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => onChangeSeason(s.id)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                        season === s.id
                          ? 'bg-[#5D8A48] text-[#FAF2E2]'
                          : 'bg-[#EDE0C6] text-[#5B432F] hover:bg-[#E2D1B2]'
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <div className="text-[11px] font-semibold text-[#6B5038] mb-1.5">Hava Durumu</div>
                <div className="flex flex-wrap items-center gap-1.5">
                  {WEATHER_OPTIONS.map((w) => (
                    <button
                      key={w.id}
                      type="button"
                      onClick={() => onChangeWeather(w.id)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                        weather === w.id
                          ? 'bg-[#C85A32] text-[#FAF2E2]'
                          : 'bg-[#EDE0C6] text-[#5B432F] hover:bg-[#E2D1B2]'
                      }`}
                    >
                      {w.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <div className="text-[11px] font-semibold text-[#6B5038]">
                  Bölge Radyosu &amp; Lo-Fi Kanalı
                </div>
                <button
                  type="button"
                  onClick={() => setActiveDrawer('radio')}
                  className="text-[11px] font-bold text-[#B84C27] hover:underline cursor-pointer"
                >
                  Tüm Radyo İstasyonları →
                </button>
              </div>
              <div className="flex flex-wrap items-center gap-1.5">
                {LOFI_TRACKS.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => onChangeLofiTrack(t.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                      lofiTrack === t.id
                        ? 'bg-[#5B3D28] text-[#FAF2E2]'
                        : 'bg-[#EDE0C6] text-[#5B432F] hover:bg-[#E2D1B2]'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Garage Customization Drawer */}
        {!dockCollapsed && activeDrawer === 'garage' && (
          <div className="pointer-events-auto w-full max-w-2xl max-h-[58dvh] sm:max-h-[40dvh] overflow-y-auto efeler-scroll rounded-2xl bg-[#F7EEDC]/98 border-2 border-[#B99464] p-3 sm:p-4 text-[#3A2618] shadow-xl space-y-2.5 sm:space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-[#B99464]/35">
              <div>
                <div className="text-xs font-bold text-[#3A2618]">
                  Araç Tasarımı &amp; Boya Atölyesi
                </div>
                <div className="text-[11px] text-[#6B5038]">
                  Aracını seç, gövde/jant rengini ve aksesuarlarını anında değiştir.
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="flex items-center gap-1 p-0.5 rounded-lg bg-[#E8D8B9]">
                  {(
                    [
                      ['car', 'Araba'],
                      ['bicycle', 'Bisiklet'],
                      ['motorcycle', 'Motor'],
                    ] as [VehicleType, string][]
                  ).map(([vt, label]) => (
                    <button
                      key={vt}
                      type="button"
                      onClick={() => setVehicleType(vt)}
                      className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
                        vehicleConfig.type === vt
                          ? 'bg-[#C85A32] text-[#FAF2E2]'
                          : 'text-[#5B432F] hover:text-[#3A2618]'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => setActiveDrawer('none')}
                  aria-label="Araç Tasarımı Panelini Kapat"
                  className="p-1.5 rounded-lg bg-[#EDE0C6] hover:bg-[#E2D1B2] text-[#5B432F] transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" aria-hidden="true" />
                </button>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 sm:gap-4">
              {/* Paint Swatches */}
              <div>
                <div className="text-[11px] font-semibold text-[#6B5038] mb-1.5">Gövde Rengi</div>
                <div className="flex items-center gap-2">
                  {PAINT_SWATCHES.map((sw) => (
                    <button
                      key={sw.id}
                      type="button"
                      title={sw.name}
                      aria-label={sw.name}
                      onClick={() =>
                        onChangeVehicleConfig({ ...vehicleConfig, color: sw.hex })
                      }
                      className={`w-6 h-6 rounded-full border-2 transition-transform cursor-pointer ${
                        vehicleConfig.color === sw.hex
                          ? 'border-[#3A2618] scale-115 shadow-sm'
                          : 'border-[#B99464]/70 hover:scale-105'
                      }`}
                      style={{ backgroundColor: sw.hex }}
                    />
                  ))}
                </div>
              </div>

              {/* Accent / Rim Color */}
              <div>
                <div className="text-[11px] font-semibold text-[#6B5038] mb-1.5">
                  Jant &amp; Detay
                </div>
                <div className="flex items-center gap-2">
                  {ACCENT_SWATCHES.map((sw) => (
                    <button
                      key={sw.id}
                      type="button"
                      title={sw.name}
                      aria-label={sw.name}
                      onClick={() =>
                        onChangeVehicleConfig({ ...vehicleConfig, accentColor: sw.hex })
                      }
                      className={`w-6 h-6 rounded-full border-2 transition-transform cursor-pointer ${
                        vehicleConfig.accentColor === sw.hex
                          ? 'border-[#3A2618] scale-115 shadow-sm'
                          : 'border-[#B99464]/70 hover:scale-105'
                      }`}
                      style={{ backgroundColor: sw.hex }}
                    />
                  ))}
                </div>
              </div>

              {/* Finish + Accessories */}
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() =>
                    onChangeVehicleConfig({
                      ...vehicleConfig,
                      finish: vehicleConfig.finish === 'gloss' ? 'matte' : 'gloss',
                    })
                  }
                  className="px-3 py-1.5 rounded-lg bg-[#EDE0C6] hover:bg-[#E2D1B2] border border-[#B99464]/60 text-xs font-semibold text-[#3A2618] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                >
                  <span>Boya: </span>
                  <span key={vehicleConfig.finish}>
                    {vehicleConfig.finish === 'gloss' ? 'Parlak' : 'Mat'}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() =>
                    onChangeVehicleConfig({
                      ...vehicleConfig,
                      hasAccessory: !vehicleConfig.hasAccessory,
                    })
                  }
                  className={`px-3 py-1.5 rounded-lg border text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    vehicleConfig.hasAccessory
                      ? 'bg-[#C85A32] border-[#A74522] text-[#FAF2E2]'
                      : 'bg-[#EDE0C6] border-[#B99464]/60 text-[#5B432F]'
                  }`}
                >
                  <span key={vehicleConfig.type}>
                    {vehicleConfig.type === 'car'
                      ? 'Tavan Bavulu'
                      : vehicleConfig.type === 'bicycle'
                        ? 'İncir Sepeti'
                        : 'Siperlik & Çanta'}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() =>
                    onChangeVehicleConfig({
                      ...vehicleConfig,
                      hasStripe: !vehicleConfig.hasStripe,
                    })
                  }
                  className={`px-3 py-1.5 rounded-lg border text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    vehicleConfig.hasStripe
                      ? 'bg-[#C85A32] border-[#A74522] text-[#FAF2E2]'
                      : 'bg-[#EDE0C6] border-[#B99464]/60 text-[#5B432F]'
                  }`}
                >
                  Retro Şerit
                </button>
              </div>
            </div>
          </div>
        )}

        {/* House Exterior Live Customization Drawer */}
        {!dockCollapsed && activeDrawer === 'house' && (
          <div className="pointer-events-auto w-full max-w-2xl max-h-[58dvh] sm:max-h-[42dvh] overflow-y-auto efeler-scroll rounded-2xl bg-[#F7EEDC]/98 border-2 border-[#B99464] p-3 sm:p-4 text-[#3A2618] shadow-xl space-y-2.5 sm:space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-[#B99464]/35">
              <div>
                <div className="text-xs font-bold text-[#3A2618]">
                  Evim — Dış Cephe &amp; Mimari Düzenleme
                </div>
                <div className="text-[11px] text-[#6B5038]">
                  Sevgi Yolu üzerindeki evinin mimarisini ve boya renklerini canlı değiştir.
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={onEnterHome}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#5D8A48] hover:bg-[#4F783C] text-[#FAF2E2] text-xs font-semibold transition-colors cursor-pointer"
                >
                  <Home className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>İçeri Gir &amp; Mağaza</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveDrawer('none')}
                  aria-label="Ev Cephesi Panelini Kapat"
                  className="p-1.5 rounded-lg bg-[#EDE0C6] hover:bg-[#E2D1B2] text-[#5B432F] transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" aria-hidden="true" />
                </button>
              </div>
            </div>

            <div>
              <div className="text-[11px] font-semibold text-[#6B5038] mb-1.5">
                Mimari Bina Modeli (4 Stil)
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {HOUSE_STYLE_OPTIONS.map((opt) => {
                  const selected = houseExterior.style === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() =>
                        onChangeHouseExterior({
                          style: opt.id,
                          wallColor: opt.defaultWall,
                          roofColor: opt.defaultRoof,
                          trimColor: opt.defaultTrim,
                        })
                      }
                      className={`text-left px-3 py-2 rounded-xl border-2 transition-colors cursor-pointer ${
                        selected
                          ? 'bg-[#C85A32]/12 border-[#C85A32] text-[#3A2618]'
                          : 'bg-[#FAF2E2] border-[#B99464]/50 hover:bg-[#EFE0C3]'
                      }`}
                    >
                      <div className="text-xs font-bold text-[#3A2618]">{opt.name}</div>
                      <div className="text-[10px] text-[#6B5038] leading-snug mt-0.5">
                        {opt.subtitle}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <div className="text-[11px] font-semibold text-[#6B5038] mb-1.5">
                  Dış Duvar Boyası
                </div>
                <div className="flex flex-wrap items-center gap-1.5">
                  {HOUSE_WALL_SWATCHES.map((sw) => (
                    <button
                      key={sw.id}
                      type="button"
                      title={sw.name}
                      aria-label={sw.name}
                      onClick={() =>
                        onChangeHouseExterior({ ...houseExterior, wallColor: sw.hex })
                      }
                      className={`w-6 h-6 rounded-full border-2 transition-transform cursor-pointer ${
                        houseExterior.wallColor === sw.hex
                          ? 'border-[#3A2618] scale-115 shadow-sm'
                          : 'border-[#B99464]/70 hover:scale-105'
                      }`}
                      style={{ backgroundColor: sw.hex }}
                    />
                  ))}
                </div>
              </div>

              <div>
                <div className="text-[11px] font-semibold text-[#6B5038] mb-1.5">Çatı Rengi</div>
                <div className="flex flex-wrap items-center gap-1.5">
                  {HOUSE_ROOF_SWATCHES.map((sw) => (
                    <button
                      key={sw.id}
                      type="button"
                      title={sw.name}
                      aria-label={sw.name}
                      onClick={() =>
                        onChangeHouseExterior({ ...houseExterior, roofColor: sw.hex })
                      }
                      className={`w-6 h-6 rounded-full border-2 transition-transform cursor-pointer ${
                        houseExterior.roofColor === sw.hex
                          ? 'border-[#3A2618] scale-115 shadow-sm'
                          : 'border-[#B99464]/70 hover:scale-105'
                      }`}
                      style={{ backgroundColor: sw.hex }}
                    />
                  ))}
                </div>
              </div>

              <div>
                <div className="text-[11px] font-semibold text-[#6B5038] mb-1.5">
                  Pervaz &amp; Çit
                </div>
                <div className="flex flex-wrap items-center gap-1.5">
                  {HOUSE_TRIM_SWATCHES.map((sw) => (
                    <button
                      key={sw.id}
                      type="button"
                      title={sw.name}
                      aria-label={sw.name}
                      onClick={() =>
                        onChangeHouseExterior({ ...houseExterior, trimColor: sw.hex })
                      }
                      className={`w-6 h-6 rounded-full border-2 transition-transform cursor-pointer ${
                        houseExterior.trimColor === sw.hex
                          ? 'border-[#3A2618] scale-115 shadow-sm'
                          : 'border-[#B99464]/70 hover:scale-105'
                      }`}
                      style={{ backgroundColor: sw.hex }}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Mobile / Touch Joystick + Driving/Flight Pedals */}
        {touchControlsEnabled && activeDrawer === 'none' && (
          <div className="w-full flex items-end justify-between gap-2 px-0.5 sm:px-2">
            {/* Left Analog Virtual Joystick */}
            <VirtualJoystick
              size={isCompactLandscape ? 94 : 112}
              knobSize={isCompactLandscape ? 40 : 46}
              accent={explorationMode === 'walk' ? 'olive' : 'terracotta'}
              ariaLabel={
                explorationMode === 'sparrow'
                  ? 'Serçe Yön Joysticki'
                  : explorationMode === 'walk'
                    ? 'Yürüme Joysticki'
                    : 'Sürüş Joysticki'
              }
              label={
                isCompactLandscape
                  ? undefined
                  : explorationMode === 'sparrow'
                    ? 'Uç & Yön'
                    : explorationMode === 'walk'
                      ? 'Yürü'
                      : 'Yön'
              }
              onChange={({ x, y }) => onTouchInput({ joyX: x, joyY: y })}
            />

            {/* Center Quick Mode, Camera Cycle & Zoom Bar */}
            <div className="pointer-events-auto flex items-center gap-1 rounded-2xl bg-[#F7EEDC]/92 border-2 border-[#B99464] p-1 shadow-md">
              <button
                type="button"
                aria-label={explorationMode === 'walk' ? 'Araca Bin' : 'Yürüyerek Gez'}
                onClick={() =>
                  onChangeExplorationMode(explorationMode === 'walk' ? 'vehicle' : 'walk')
                }
                className={`w-9 h-9 rounded-xl flex items-center justify-center touch-manipulation cursor-pointer ${
                  explorationMode === 'walk'
                    ? 'bg-[#5D8A48] text-[#FAF2E2]'
                    : 'bg-[#EDE0C6] text-[#3A2618]'
                }`}
              >
                <Footprints className="w-4 h-4" aria-hidden="true" />
              </button>
              <button
                type="button"
                aria-label={explorationMode === 'sparrow' ? 'Araca Dön' : 'Serçe Modu'}
                onClick={() =>
                  onChangeExplorationMode(explorationMode === 'sparrow' ? 'vehicle' : 'sparrow')
                }
                className={`w-9 h-9 rounded-xl flex items-center justify-center touch-manipulation cursor-pointer ${
                  explorationMode === 'sparrow'
                    ? 'bg-[#B84C27] text-[#FAF2E2]'
                    : 'bg-[#EDE0C6] text-[#3A2618]'
                }`}
              >
                <Bird className="w-4 h-4" aria-hidden="true" />
              </button>
              <button
                type="button"
                aria-label="Kamera Bakış Açısını Değiştir"
                onClick={cycleCameraPreset}
                className={`h-9 px-2 rounded-xl flex items-center gap-1 text-[10px] font-bold touch-manipulation cursor-pointer ${
                  cameraPreset === 'perspective' || cameraPreset === 'first_person'
                    ? 'bg-[#C85A32] text-[#FAF2E2]'
                    : 'bg-[#EDE0C6] text-[#3A2618]'
                }`}
              >
                {cameraPreset === 'first_person' ? (
                  <Eye className="w-3.5 h-3.5" aria-hidden="true" />
                ) : (
                  <Camera className="w-3.5 h-3.5" aria-hidden="true" />
                )}
                <span>
                  {cameraPreset === 'perspective'
                    ? 'Omuz'
                    : cameraPreset === 'first_person'
                      ? '1.Şahıs'
                      : 'İzo'}
                </span>
              </button>
              {cameraPreset !== 'first_person' && cameraPreset !== 'perspective' && (
                <>
                  <button
                    type="button"
                    aria-label="Uzaklaştır"
                    onClick={() => onAdjustZoom(-0.18)}
                    className="w-8 h-9 rounded-xl bg-[#EDE0C6] active:bg-[#DFCCA8] text-[#3A2618] flex items-center justify-center touch-manipulation cursor-pointer"
                  >
                    <ZoomOut className="w-4 h-4" aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    aria-label="Yakınlaştır"
                    onClick={() => onAdjustZoom(0.18)}
                    className="w-8 h-9 rounded-xl bg-[#EDE0C6] active:bg-[#DFCCA8] text-[#3A2618] flex items-center justify-center touch-manipulation cursor-pointer"
                  >
                    <ZoomIn className="w-4 h-4" aria-hidden="true" />
                  </button>
                </>
              )}
              {isCompactLandscape && (
                <button
                  type="button"
                  aria-label={dockCollapsed ? 'Kontrol Panelini Aç' : 'Kontrol Panelini Gizle'}
                  onClick={() => setDockCollapsed((v) => !v)}
                  className="h-9 px-2 rounded-xl bg-[#5B3D28] text-[#FAF2E2] flex items-center gap-1 text-[10px] font-bold touch-manipulation cursor-pointer"
                >
                  <SlidersHorizontal className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Panel</span>
                </button>
              )}
            </div>

            {/* Right Flight / Gas & Brake Pedals */}
            {explorationMode === 'sparrow' ? (
              <div className="pointer-events-auto flex items-end gap-1.5">
                <button
                  type="button"
                  aria-label="Serçe Ötüşü"
                  onClick={() => (onChirp ? onChirp() : onHorn())}
                  className={`${
                    isCompactLandscape ? 'w-10 h-10' : 'w-11 h-11 sm:w-12 sm:h-12'
                  } rounded-2xl bg-[#F7EEDC]/94 active:bg-[#E2D0AF] active:scale-95 border-2 border-[#B99464] text-[#B84C27] shadow-lg flex flex-col items-center justify-center touch-manipulation select-none cursor-pointer transition-transform`}
                >
                  <Sparkles className="w-4 h-4" aria-hidden="true" />
                  <span className="text-[9px] font-bold leading-none mt-0.5">ÖT</span>
                </button>
                <button
                  type="button"
                  aria-label="Dalış"
                  {...bindDriveButton('dive')}
                  className={`${
                    isCompactLandscape ? 'w-10 h-10' : 'w-11 h-11 sm:w-12 sm:h-12'
                  } rounded-2xl bg-[#F7EEDC]/94 active:bg-[#E2D0AF] active:scale-95 border-2 border-[#B99464] text-[#3A2618] shadow-lg flex flex-col items-center justify-center touch-none select-none cursor-pointer transition-transform`}
                >
                  <Wind className="w-4 h-4" aria-hidden="true" />
                  <span className="text-[9px] font-bold leading-none mt-0.5">DAL</span>
                </button>
                <button
                  type="button"
                  aria-label="Kanat Çırp"
                  {...bindDriveButton('flap')}
                  className={`${
                    isCompactLandscape ? 'w-12 h-12' : 'w-13 h-13 sm:w-14 sm:h-14'
                  } rounded-2xl bg-[#5D8A48]/95 active:bg-[#496F37] active:scale-95 border-2 border-[#FAF2E2]/85 text-[#FAF2E2] shadow-lg flex flex-col items-center justify-center touch-none select-none cursor-pointer transition-transform`}
                >
                  <Feather className="w-5 h-5" aria-hidden="true" />
                  <span className="text-[9px] font-bold leading-none mt-0.5">KANAT</span>
                </button>
                <button
                  type="button"
                  aria-label="İleri Uç ve Zıpla"
                  {...bindDriveButton('forward')}
                  className={`${
                    isCompactLandscape ? 'w-13 h-13' : 'w-14 h-14 sm:w-15 sm:h-15'
                  } rounded-2xl bg-[#C85A32]/96 active:bg-[#A64420] active:scale-95 border-2 border-[#FAF2E2]/85 text-[#FAF2E2] shadow-lg flex flex-col items-center justify-center touch-none select-none cursor-pointer transition-transform`}
                >
                  <ArrowUp className="w-5 h-5 sm:w-6 sm:h-6" aria-hidden="true" />
                  <span className="text-[10px] font-bold leading-none mt-0.5">UÇ</span>
                </button>
              </div>
            ) : (
              <div className="pointer-events-auto flex items-end gap-1.5 sm:gap-2">
                {explorationMode === 'vehicle' && (
                  <button
                    type="button"
                    aria-label={vehicleConfig.type === 'bicycle' ? 'Zil Çal' : 'Korna Çal'}
                    onClick={onHorn}
                    className={`${
                      isCompactLandscape ? 'w-10 h-10' : 'w-11 h-11'
                    } rounded-2xl bg-[#F7EEDC]/94 active:bg-[#E2D0AF] active:scale-95 border-2 border-[#B99464] text-[#8F5624] shadow-lg flex flex-col items-center justify-center touch-manipulation select-none cursor-pointer transition-transform`}
                  >
                    <Volume2 className="w-4 h-4" aria-hidden="true" />
                    <span className="text-[8px] font-bold leading-none mt-0.5">
                      {vehicleConfig.type === 'bicycle' ? 'ZİL' : 'KORNA'}
                    </span>
                  </button>
                )}
                <button
                  type="button"
                  aria-label="Fren ve Geri"
                  {...bindDriveButton('backward')}
                  className={`${
                    isCompactLandscape ? 'w-11 h-11' : 'w-12 h-12 sm:w-14 sm:h-14'
                  } rounded-2xl bg-[#F7EEDC]/94 active:bg-[#E2D0AF] active:scale-95 border-2 border-[#B99464] text-[#3A2618] shadow-lg flex flex-col items-center justify-center touch-none select-none cursor-pointer transition-transform`}
                >
                  <ArrowDown className="w-5 h-5" aria-hidden="true" />
                  <span className="text-[8px] font-bold leading-none mt-0.5">FREN</span>
                </button>
                <button
                  type="button"
                  aria-label="İleri Gaz"
                  {...bindDriveButton('forward')}
                  className={`${
                    isCompactLandscape ? 'w-13 h-13' : 'w-15 h-15 sm:w-16 sm:h-16'
                  } rounded-2xl bg-[#C85A32]/96 active:bg-[#A64420] active:scale-95 border-2 border-[#FAF2E2]/85 text-[#FAF2E2] shadow-lg flex flex-col items-center justify-center touch-none select-none cursor-pointer transition-transform`}
                >
                  <ArrowUp className="w-5 h-5 sm:w-6 sm:h-6" aria-hidden="true" />
                  <span key={explorationMode} className="text-[10px] font-bold leading-none mt-0.5">
                    {explorationMode === 'walk' ? 'YÜRÜ' : 'GAZ'}
                  </span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* Collapsible Unified Bottom Control Dock */}
        <div className="pointer-events-auto flex flex-col items-center max-w-full">
          {(!isCompactLandscape || !dockCollapsed) && (
            <button
              type="button"
              onClick={() => setDockCollapsed((v) => !v)}
              className="inline-flex items-center gap-2 px-4 py-1 rounded-t-xl bg-[#F7EEDC]/96 border-2 border-b-0 border-[#B99464] text-[11px] font-semibold text-[#5B432F] hover:text-[#3A2618] transition-colors cursor-pointer"
            >
              {dockCollapsed ? (
                <span key="collapsed" className="inline-flex items-center gap-1.5">
                  <ChevronUp className="w-3.5 h-3.5 text-[#C85A32]" aria-hidden="true" />
                  <span>
                    Kontrol Paneli ·{' '}
                    {explorationMode === 'walk'
                      ? 'Yürü'
                      : explorationMode === 'sparrow'
                        ? 'Serçe'
                        : vehicleConfig.type === 'car'
                          ? 'Araba'
                          : vehicleConfig.type === 'bicycle'
                            ? 'Bisiklet'
                            : 'Motor'}
                  </span>
                </span>
              ) : (
                <span key="expanded" className="inline-flex items-center gap-1.5">
                  <ChevronDown className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Paneli Gizle</span>
                </span>
              )}
            </button>
          )}

          {!dockCollapsed && (
            <div className="rounded-2xl bg-[#F7EEDC]/96 border-2 border-[#B99464] px-3 py-2 sm:px-3.5 sm:py-2.5 text-[#3A2618] shadow-xl max-w-[96vw]">
              {/* Desktop Structured 2-Row Layout */}
              <div className={isCompactViewport ? 'hidden' : 'flex flex-col gap-2'}>
                {/* Row 1: Gezinti Modu + Özelleştirme */}
                <div className="flex flex-wrap items-center justify-center gap-2.5">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] font-bold text-[#6B5038] whitespace-nowrap">
                      Gezinti
                    </span>
                    <div className="flex items-center gap-1 p-0.5 rounded-xl bg-[#E8D8B9]">
                      <button
                        type="button"
                        onClick={() => onChangeExplorationMode('walk')}
                        title="Avatar ile Yürüyerek Gez [V]"
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                          explorationMode === 'walk'
                            ? 'bg-[#5D8A48] text-[#FAF2E2]'
                            : 'text-[#5B432F] hover:text-[#3A2618]'
                        }`}
                      >
                        <Footprints className="w-3.5 h-3.5" aria-hidden="true" />
                        <span>Yürü</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setVehicleType('car')}
                        title="Araba ile Sür"
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                          explorationMode === 'vehicle' && vehicleConfig.type === 'car'
                            ? 'bg-[#C85A32] text-[#FAF2E2]'
                            : 'text-[#5B432F] hover:text-[#3A2618]'
                        }`}
                      >
                        <Car className="w-3.5 h-3.5" aria-hidden="true" />
                        <span>Araba</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setVehicleType('bicycle')}
                        title="Bisiklet ile Gez"
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                          explorationMode === 'vehicle' && vehicleConfig.type === 'bicycle'
                            ? 'bg-[#C85A32] text-[#FAF2E2]'
                            : 'text-[#5B432F] hover:text-[#3A2618]'
                        }`}
                      >
                        <Bike className="w-3.5 h-3.5" aria-hidden="true" />
                        <span>Bisiklet</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setVehicleType('motorcycle')}
                        title="Motosiklet ile Sür"
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                          explorationMode === 'vehicle' && vehicleConfig.type === 'motorcycle'
                            ? 'bg-[#C85A32] text-[#FAF2E2]'
                            : 'text-[#5B432F] hover:text-[#3A2618]'
                        }`}
                      >
                        <Sparkles className="w-3.5 h-3.5" aria-hidden="true" />
                        <span>Motor</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => onChangeExplorationMode('sparrow')}
                        title="Serçe Modu — Çatılarda Zıpla ve Uç [V]"
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                          explorationMode === 'sparrow'
                            ? 'bg-[#B84C27] text-[#FAF2E2]'
                            : 'text-[#5B432F] hover:text-[#3A2618]'
                        }`}
                      >
                        <Bird className="w-3.5 h-3.5" aria-hidden="true" />
                        <span>Serçe</span>
                      </button>
                    </div>
                  </div>

                  <span className="text-[#B99464]/50" aria-hidden="true">
                    |
                  </span>

                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] font-bold text-[#6B5038] whitespace-nowrap">
                      Tasarım
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        setActiveDrawer((d) => (d === 'garage' ? 'none' : 'garage'))
                      }
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                        activeDrawer === 'garage'
                          ? 'bg-[#C85A32] border-[#A74522] text-[#FAF2E2]'
                          : 'bg-[#EDE0C6] border-[#B99464]/60 text-[#3A2618] hover:bg-[#E2D1B2]'
                      }`}
                    >
                      <Paintbrush className="w-3.5 h-3.5" aria-hidden="true" />
                      <span>Araç Tasarımı</span>
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setActiveDrawer((d) => (d === 'house' ? 'none' : 'house'))
                      }
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                        activeDrawer === 'house'
                          ? 'bg-[#5D8A48] border-[#4A7138] text-[#FAF2E2]'
                          : 'bg-[#EDE0C6] border-[#B99464]/60 text-[#3A2618] hover:bg-[#E2D1B2]'
                      }`}
                    >
                      <Home className="w-3.5 h-3.5" aria-hidden="true" />
                      <span>Ev Cephesi</span>
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setActiveDrawer((d) => (d === 'atmosphere' ? 'none' : 'atmosphere'))
                      }
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                        activeDrawer === 'atmosphere'
                          ? 'bg-[#5D8A48] border-[#4A7138] text-[#FAF2E2]'
                          : 'bg-[#EDE0C6] border-[#B99464]/60 text-[#3A2618] hover:bg-[#E2D1B2]'
                      }`}
                    >
                      <CloudRain className="w-3.5 h-3.5 text-[#3B6E8C]" aria-hidden="true" />
                      <span>
                        Hava &amp; Müzik ({SEASON_OPTIONS.find((s) => s.id === season)?.label} ·{' '}
                        {WEATHER_OPTIONS.find((w) => w.id === weather)?.label})
                      </span>
                    </button>
                  </div>
                </div>

                {/* Row 2: Kamera + Vakit + Hızlı Araçlar */}
                <div className="flex flex-wrap items-center justify-center gap-2.5 pt-1.5 border-t border-[#B99464]/30">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] font-bold text-[#6B5038] whitespace-nowrap">
                      Kamera
                    </span>
                    <div className="flex items-center gap-1 p-0.5 rounded-xl bg-[#E8D8B9]">
                      {(
                        [
                          ['isometric', 'İzometrik'],
                          ['perspective', 'Omuz Arkası'],
                          ['close', 'Yakın'],
                          ['overview', 'Geniş'],
                          ['first_person', '1. Şahıs'],
                        ] as [CameraPreset, string][]
                      ).map(([preset, label]) => (
                        <button
                          key={preset}
                          type="button"
                          onClick={() => onChangeCameraPreset(preset)}
                          className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                            cameraPreset === preset
                              ? preset === 'first_person' || preset === 'perspective'
                                ? 'bg-[#C85A32] text-[#FAF2E2]'
                                : 'bg-[#5B3D28] text-[#FAF2E2]'
                              : 'text-[#6B5038] hover:text-[#3A2618]'
                          }`}
                        >
                          {preset === 'perspective' && (
                            <Camera className="w-3 h-3" aria-hidden="true" />
                          )}
                          {preset === 'first_person' && (
                            <Eye className="w-3 h-3" aria-hidden="true" />
                          )}
                          <span>{label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <span className="text-[#B99464]/50" aria-hidden="true">
                    |
                  </span>

                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] font-bold text-[#6B5038] whitespace-nowrap inline-flex items-center gap-1">
                      <Sun className="w-3.5 h-3.5 text-[#C85A32]" aria-hidden="true" />
                      <span>Vakit</span>
                    </span>
                    <div className="flex items-center gap-1 p-0.5 rounded-xl bg-[#E8D8B9]">
                      {(['morning', 'noon', 'golden', 'evening'] as TimeOfDay[]).map((tod) => (
                        <button
                          key={tod}
                          type="button"
                          onClick={() => onChangeTimeOfDay(tod)}
                          className={`px-2 py-1 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                            timeOfDay === tod
                              ? 'bg-[#5B3D28] text-[#FAF2E2]'
                              : 'text-[#6B5038] hover:text-[#3A2618]'
                          }`}
                        >
                          {TIME_MOODS[tod].label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <span className="text-[#B99464]/50" aria-hidden="true">
                    |
                  </span>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() =>
                        explorationMode === 'sparrow' && onChirp ? onChirp() : onHorn()
                      }
                      className="px-2.5 py-1 rounded-xl bg-[#EDE0C6] hover:bg-[#E2D1B2] border border-[#B99464]/50 text-xs font-semibold text-[#3A2618] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                    >
                      <span key={explorationMode === 'sparrow' ? 'chirp' : vehicleConfig.type}>
                        {explorationMode === 'sparrow'
                          ? 'Öt [Q]'
                          : vehicleConfig.type === 'bicycle'
                            ? 'Zil'
                            : 'Korna'}
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setTouchControlsEnabled((prev) => {
                          if (prev) {
                            onTouchInput({
                              forward: false,
                              backward: false,
                              left: false,
                              right: false,
                              joyX: 0,
                              joyY: 0,
                              flap: false,
                              dive: false,
                            });
                          }
                          return !prev;
                        });
                      }}
                      title="Dokunmatik Joystick ve Pedalları Aç/Kapat"
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-xl border text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                        touchControlsEnabled
                          ? 'bg-[#EFE0C3] border-[#C85A32]/60 text-[#B84C27]'
                          : 'bg-[#EDE0C6] border-[#B99464]/50 text-[#6B5038]'
                      }`}
                    >
                      <Gamepad2 className="w-3.5 h-3.5" aria-hidden="true" />
                      <span>Joystick</span>
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        setActiveDrawer((d) => (d === 'radio' ? 'none' : 'radio'))
                      }
                      title="Efeler Bölge Radyosunu Aç/Kapat"
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-xl border text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                        activeDrawer === 'radio'
                          ? 'bg-[#C85A32] border-[#A74522] text-[#FAF2E2]'
                          : isRadioPlaying
                            ? 'bg-[#EFE0C3] border-[#C85A32]/60 text-[#B84C27]'
                            : 'bg-[#EDE0C6] border-[#B99464]/50 text-[#6B5038]'
                      }`}
                    >
                      <Radio className="w-3.5 h-3.5" aria-hidden="true" />
                      <span>Radyo</span>
                    </button>

                    <button
                      type="button"
                      onClick={onToggleMusic}
                      title="Sakinleştirici Müziği Aç/Kapat"
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-xl border text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                        musicEnabled && !isMuted
                          ? 'bg-[#EFE0C3] border-[#C85A32]/60 text-[#B84C27]'
                          : 'bg-[#EDE0C6] border-[#B99464]/50 text-[#6B5038]'
                      }`}
                    >
                      <Music className="w-3.5 h-3.5" aria-hidden="true" />
                      <span>Müzik</span>
                    </button>

                    <button
                      type="button"
                      onClick={onToggleMute}
                      title="Tüm Sesleri Aç/Kapat"
                      aria-label={isMuted ? 'Sesi Aç' : 'Sesi Kapat'}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-[#EDE0C6] hover:bg-[#E2D1B2] border border-[#B99464]/50 text-xs font-semibold text-[#3A2618] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                    >
                      {isMuted ? (
                        <VolumeX key="muted" className="w-3.5 h-3.5 text-[#B84C27]" aria-hidden="true" />
                      ) : (
                        <Volume2 key="unmuted" className="w-3.5 h-3.5 text-[#4B743B]" aria-hidden="true" />
                      )}
                      <span>{isMuted ? 'Sessiz' : 'Ses'}</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Mobile & Landscape Compact Tabbed Layout */}
              <div className={isCompactViewport ? 'flex flex-col gap-2 w-full' : 'hidden'}>
                <div className="flex items-center justify-center gap-1 p-0.5 rounded-xl bg-[#E8D8B9]">
                  <button
                    type="button"
                    onClick={() => setMobileDockTab('move')}
                    className={`flex-1 inline-flex items-center justify-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold transition-colors whitespace-nowrap cursor-pointer ${
                      mobileDockTab === 'move'
                        ? 'bg-[#C85A32] text-[#FAF2E2]'
                        : 'text-[#5B432F]'
                    }`}
                  >
                    <Car className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>Gezinti</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setMobileDockTab('view')}
                    className={`flex-1 inline-flex items-center justify-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold transition-colors whitespace-nowrap cursor-pointer ${
                      mobileDockTab === 'view'
                        ? 'bg-[#5B3D28] text-[#FAF2E2]'
                        : 'text-[#5B432F]'
                    }`}
                  >
                    <Clock className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>Kamera &amp; Vakit</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setMobileDockTab('design')}
                    className={`flex-1 inline-flex items-center justify-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold transition-colors whitespace-nowrap cursor-pointer ${
                      mobileDockTab === 'design'
                        ? 'bg-[#5D8A48] text-[#FAF2E2]'
                        : 'text-[#5B432F]'
                    }`}
                  >
                    <SlidersHorizontal className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>Tasarım &amp; Ses</span>
                  </button>
                </div>

                {mobileDockTab === 'move' && (
                  <div className="flex flex-wrap items-center justify-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => onChangeExplorationMode('walk')}
                      className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold cursor-pointer ${
                        explorationMode === 'walk'
                          ? 'bg-[#5D8A48] text-[#FAF2E2]'
                          : 'bg-[#EDE0C6] text-[#3A2618]'
                      }`}
                    >
                      <Footprints className="w-3.5 h-3.5" aria-hidden="true" />
                      <span>Yürü</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setVehicleType('car')}
                      className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold cursor-pointer ${
                        explorationMode === 'vehicle' && vehicleConfig.type === 'car'
                          ? 'bg-[#C85A32] text-[#FAF2E2]'
                          : 'bg-[#EDE0C6] text-[#3A2618]'
                      }`}
                    >
                      <Car className="w-3.5 h-3.5" aria-hidden="true" />
                      <span>Araba</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setVehicleType('bicycle')}
                      className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold cursor-pointer ${
                        explorationMode === 'vehicle' && vehicleConfig.type === 'bicycle'
                          ? 'bg-[#C85A32] text-[#FAF2E2]'
                          : 'bg-[#EDE0C6] text-[#3A2618]'
                      }`}
                    >
                      <Bike className="w-3.5 h-3.5" aria-hidden="true" />
                      <span>Bisiklet</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setVehicleType('motorcycle')}
                      className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold cursor-pointer ${
                        explorationMode === 'vehicle' && vehicleConfig.type === 'motorcycle'
                          ? 'bg-[#C85A32] text-[#FAF2E2]'
                          : 'bg-[#EDE0C6] text-[#3A2618]'
                      }`}
                    >
                      <Sparkles className="w-3.5 h-3.5" aria-hidden="true" />
                      <span>Motor</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => onChangeExplorationMode('sparrow')}
                      className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold cursor-pointer ${
                        explorationMode === 'sparrow'
                          ? 'bg-[#B84C27] text-[#FAF2E2]'
                          : 'bg-[#EDE0C6] text-[#3A2618]'
                      }`}
                    >
                      <Bird className="w-3.5 h-3.5" aria-hidden="true" />
                      <span>Serçe</span>
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        explorationMode === 'sparrow' && onChirp ? onChirp() : onHorn()
                      }
                      className="px-2.5 py-1.5 rounded-lg bg-[#EFE0C3] border border-[#B99464]/60 text-xs font-semibold text-[#3A2618] cursor-pointer"
                    >
                      {explorationMode === 'sparrow'
                        ? 'Öt'
                        : vehicleConfig.type === 'bicycle'
                          ? 'Zil'
                          : 'Korna'}
                    </button>
                  </div>
                )}

                {mobileDockTab === 'view' && (
                  <div className="flex flex-col gap-1.5">
                    <div className="flex flex-wrap items-center justify-center gap-1">
                      {(
                        [
                          ['isometric', 'İzometrik'],
                          ['perspective', 'Omuz'],
                          ['close', 'Yakın'],
                          ['overview', 'Geniş'],
                          ['first_person', '1. Şahıs'],
                        ] as [CameraPreset, string][]
                      ).map(([preset, label]) => (
                        <button
                          key={preset}
                          type="button"
                          onClick={() => onChangeCameraPreset(preset)}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold cursor-pointer ${
                            cameraPreset === preset
                              ? 'bg-[#C85A32] text-[#FAF2E2]'
                              : 'bg-[#EDE0C6] text-[#5B432F]'
                          }`}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                    <div className="flex flex-wrap items-center justify-center gap-1">
                      {(['morning', 'noon', 'golden', 'evening'] as TimeOfDay[]).map((tod) => (
                        <button
                          key={tod}
                          type="button"
                          onClick={() => onChangeTimeOfDay(tod)}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold cursor-pointer ${
                            timeOfDay === tod
                              ? 'bg-[#5B3D28] text-[#FAF2E2]'
                              : 'bg-[#EDE0C6] text-[#5B432F]'
                          }`}
                        >
                          {TIME_MOODS[tod].label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {mobileDockTab === 'design' && (
                  <div className="flex flex-wrap items-center justify-center gap-1.5">
                    <button
                      type="button"
                      onClick={() =>
                        setActiveDrawer((d) => (d === 'garage' ? 'none' : 'garage'))
                      }
                      className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold cursor-pointer ${
                        activeDrawer === 'garage'
                          ? 'bg-[#C85A32] text-[#FAF2E2]'
                          : 'bg-[#EDE0C6] text-[#3A2618]'
                      }`}
                    >
                      <Paintbrush className="w-3.5 h-3.5" aria-hidden="true" />
                      <span>Araç</span>
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setActiveDrawer((d) => (d === 'house' ? 'none' : 'house'))
                      }
                      className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold cursor-pointer ${
                        activeDrawer === 'house'
                          ? 'bg-[#5D8A48] text-[#FAF2E2]'
                          : 'bg-[#EDE0C6] text-[#3A2618]'
                      }`}
                    >
                      <Home className="w-3.5 h-3.5" aria-hidden="true" />
                      <span>Ev Cephesi</span>
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setActiveDrawer((d) => (d === 'atmosphere' ? 'none' : 'atmosphere'))
                      }
                      className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold cursor-pointer ${
                        activeDrawer === 'atmosphere'
                          ? 'bg-[#5D8A48] text-[#FAF2E2]'
                          : 'bg-[#EDE0C6] text-[#3A2618]'
                      }`}
                    >
                      <CloudRain className="w-3.5 h-3.5" aria-hidden="true" />
                      <span>Hava &amp; Lo-Fi</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setTouchControlsEnabled((prev) => {
                          if (prev) {
                            onTouchInput({
                              forward: false,
                              backward: false,
                              left: false,
                              right: false,
                              joyX: 0,
                              joyY: 0,
                              flap: false,
                              dive: false,
                            });
                          }
                          return !prev;
                        });
                      }}
                      className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold cursor-pointer ${
                        touchControlsEnabled
                          ? 'bg-[#EFE0C3] border border-[#C85A32]/60 text-[#B84C27]'
                          : 'bg-[#EDE0C6] text-[#5B432F]'
                      }`}
                    >
                      <Gamepad2 className="w-3.5 h-3.5" aria-hidden="true" />
                      <span>Joystick</span>
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setActiveDrawer((d) => (d === 'radio' ? 'none' : 'radio'))
                      }
                      className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold cursor-pointer ${
                        activeDrawer === 'radio'
                          ? 'bg-[#C85A32] text-[#FAF2E2]'
                          : isRadioPlaying
                            ? 'bg-[#EFE0C3] border border-[#C85A32]/60 text-[#B84C27]'
                            : 'bg-[#EDE0C6] text-[#5B432F]'
                      }`}
                    >
                      <Radio className="w-3.5 h-3.5" aria-hidden="true" />
                      <span>Radyo</span>
                    </button>
                    <button
                      type="button"
                      onClick={onToggleMusic}
                      className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold cursor-pointer ${
                        musicEnabled && !isMuted
                          ? 'bg-[#EFE0C3] border border-[#C85A32]/60 text-[#B84C27]'
                          : 'bg-[#EDE0C6] text-[#5B432F]'
                      }`}
                    >
                      <Music className="w-3.5 h-3.5" aria-hidden="true" />
                      <span>Müzik</span>
                    </button>
                    <button
                      type="button"
                      onClick={onToggleMute}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#EDE0C6] text-xs font-semibold text-[#3A2618] cursor-pointer"
                    >
                      {isMuted ? (
                        <VolumeX key="muted" className="w-3.5 h-3.5 text-[#B84C27]" aria-hidden="true" />
                      ) : (
                        <Volume2 key="unmuted" className="w-3.5 h-3.5 text-[#4B743B]" aria-hidden="true" />
                      )}
                      <span>{isMuted ? 'Sessiz' : 'Ses'}</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
});
