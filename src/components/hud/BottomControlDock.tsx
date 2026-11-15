import {
  type PointerEvent as ReactPointerEvent,
  type MouseEvent as ReactMouseEvent,
} from 'react';
import {
  ArrowDown,
  ArrowUp,
  Bike,
  Bird,
  Camera,
  Car,
  ChevronDown,
  ChevronUp,
  Clock,
  CloudRain,
  Eye,
  Feather,
  Footprints,
  Gamepad2,
  Home,
  Music,
  Paintbrush,
  Radio,
  SlidersHorizontal,
  Sparkles,
  Sun,
  Volume2,
  VolumeX,
  Wind,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import { TouchDriveInput } from '../EfelerCanvas';
import { VirtualJoystick } from '../VirtualJoystick';
import { SEASON_OPTIONS, TIME_MOODS, WEATHER_OPTIONS } from '../../data/efelerData';
import {
  CameraPreset,
  ExplorationMode,
  SeasonType,
  TimeOfDay,
  VehicleConfig,
  VehicleType,
  WeatherType,
} from '../../types/game';
import { HudDrawerType, MobileDockTab } from './hudTypes';

interface BottomControlDockProps {
  explorationMode: ExplorationMode;
  vehicleConfig: VehicleConfig;
  cameraPreset: CameraPreset;
  timeOfDay: TimeOfDay;
  season: SeasonType;
  weather: WeatherType;
  isMuted: boolean;
  musicEnabled: boolean;
  isRadioPlaying: boolean;
  isCompactLandscape: boolean;
  isCompactViewport: boolean;
  touchControlsEnabled: boolean;
  dockCollapsed: boolean;
  activeDrawer: HudDrawerType;
  mobileDockTab: MobileDockTab;
  onToggleDockCollapsed: () => void;
  onToggleDrawer: (drawer: Exclude<HudDrawerType, 'none'>) => void;
  onSetMobileDockTab: (tab: MobileDockTab) => void;
  onToggleTouchControls: () => void;
  onChangeExplorationMode: (next: ExplorationMode) => void;
  onSetVehicleType: (type: VehicleType) => void;
  onCycleCameraPreset: () => void;
  onChangeCameraPreset: (next: CameraPreset) => void;
  onChangeTimeOfDay: (next: TimeOfDay) => void;
  onToggleMusic: () => void;
  onToggleMute: () => void;
  onHorn: () => void;
  onChirp?: () => void;
  onTouchInput: (next: Partial<TouchDriveInput>) => void;
  onAdjustZoom: (delta: number) => void;
}

export function BottomControlDock({
  explorationMode,
  vehicleConfig,
  cameraPreset,
  timeOfDay,
  season,
  weather,
  isMuted,
  musicEnabled,
  isRadioPlaying,
  isCompactLandscape,
  isCompactViewport,
  touchControlsEnabled,
  dockCollapsed,
  activeDrawer,
  mobileDockTab,
  onToggleDockCollapsed,
  onToggleDrawer,
  onSetMobileDockTab,
  onToggleTouchControls,
  onChangeExplorationMode,
  onSetVehicleType,
  onCycleCameraPreset,
  onChangeCameraPreset,
  onChangeTimeOfDay,
  onToggleMusic,
  onToggleMute,
  onHorn,
  onChirp,
  onTouchInput,
  onAdjustZoom,
}: BottomControlDockProps) {
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

  return (
    <>
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
              onClick={onCycleCameraPreset}
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
                onClick={onToggleDockCollapsed}
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
            onClick={onToggleDockCollapsed}
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
                      onClick={() => onSetVehicleType('car')}
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
                      onClick={() => onSetVehicleType('bicycle')}
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
                      onClick={() => onSetVehicleType('motorcycle')}
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
                    onClick={() => onToggleDrawer('garage')}
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
                    onClick={() => onToggleDrawer('house')}
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
                    onClick={() => onToggleDrawer('atmosphere')}
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
                    onClick={onToggleTouchControls}
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
                    onClick={() => onToggleDrawer('radio')}
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
                  onClick={() => onSetMobileDockTab('move')}
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
                  onClick={() => onSetMobileDockTab('view')}
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
                  onClick={() => onSetMobileDockTab('design')}
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
                    onClick={() => onSetVehicleType('car')}
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
                    onClick={() => onSetVehicleType('bicycle')}
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
                    onClick={() => onSetVehicleType('motorcycle')}
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
                    onClick={() => onToggleDrawer('garage')}
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
                    onClick={() => onToggleDrawer('house')}
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
                    onClick={() => onToggleDrawer('atmosphere')}
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
                    onClick={onToggleTouchControls}
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
                    onClick={() => onToggleDrawer('radio')}
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
    </>
  );
}
