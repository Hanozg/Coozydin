import { useState } from 'react';
import {
  Bike,
  BookOpen,
  Car,
  ChevronDown,
  ChevronUp,
  CloudRain,
  Compass,
  Home,
  Music,
  Paintbrush,
  Pause,
  Sparkles,
  Sun,
  Volume2,
  VolumeX,
} from 'lucide-react';
import {
  ACCENT_SWATCHES,
  getFigTreeStage,
  LANDMARKS,
  LOFI_TRACKS,
  PAINT_SWATCHES,
  TIME_MOODS,
  WEATHER_OPTIONS,
} from '../data/efelerData';
import {
  CameraPreset,
  ErrandDef,
  LandmarkDef,
  LofiTrackId,
  PlayerHudSnapshot,
  TimeOfDay,
  VehicleConfig,
  VehicleType,
  WeatherType,
} from '../types/game';

interface GameHUDProps {
  hud: PlayerHudSnapshot;
  vehicleConfig: VehicleConfig;
  timeOfDay: TimeOfDay;
  weather: WeatherType;
  lofiTrack: LofiTrackId;
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
  onChangeVehicleConfig: (next: VehicleConfig) => void;
  onChangeTimeOfDay: (next: TimeOfDay) => void;
  onChangeWeather: (next: WeatherType) => void;
  onChangeLofiTrack: (next: LofiTrackId) => void;
  onChangeCameraPreset: (next: CameraPreset) => void;
  onToggleMute: () => void;
  onToggleMusic: () => void;
  onOpenJournal: () => void;
  onEnterHome: () => void;
  onPause: () => void;
  onDiscoverNearby: () => void;
  onHorn: () => void;
}

export function GameHUD({
  hud,
  vehicleConfig,
  timeOfDay,
  weather,
  lofiTrack,
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
  onChangeVehicleConfig,
  onChangeTimeOfDay,
  onChangeWeather,
  onChangeLofiTrack,
  onChangeCameraPreset,
  onToggleMute,
  onToggleMusic,
  onOpenJournal,
  onEnterHome,
  onPause,
  onDiscoverNearby,
  onHorn,
}: GameHUDProps) {
  const [dockCollapsed, setDockCollapsed] = useState(false);
  const [activeDrawer, setActiveDrawer] = useState<'none' | 'garage' | 'atmosphere'>('none');

  const figStage = getFigTreeStage(coins);

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
  };

  const errandTargetName = activeErrand
    ? LANDMARKS.find(
        (l) =>
          l.id ===
          (errandPickedUp ? activeErrand.toLandmarkId : activeErrand.fromLandmarkId)
      )?.name
    : null;

  return (
    <div className="absolute inset-0 z-10 pointer-events-none flex flex-col justify-between p-4 md:p-6">
      {/* Screen-Projected Speech Bubble for Mendil & Lif Satıcısı */}
      {hud.vendorBubble?.visible && (
        <div
          className="absolute z-20 -translate-x-1/2 -translate-y-full pb-2 pointer-events-none"
          style={{
            left: `${hud.vendorBubble.x}px`,
            top: `${hud.vendorBubble.y}px`,
          }}
        >
          <div className="rounded-xl bg-[#F5EFE6] text-[#181612] border border-[#D99B43] px-3.5 py-2 text-xs font-semibold shadow-xl whitespace-nowrap">
            “{hud.vendorBubble.text}”
          </div>
        </div>
      )}

      {/* Top Perimeter Row */}
      <div className="flex items-start justify-between gap-4">
        {/* Top-Left Clean Unboxed District & Telemetry Readout (Zero Pills, Zero Pulsing Dots) */}
        <div className="pointer-events-auto rounded-xl bg-[#181612]/88 border border-[#F5EFE6]/12 px-4 py-3 text-[#F5EFE6] max-w-xs sm:max-w-xl">
          <div className="font-display text-base md:text-lg font-semibold leading-tight tracking-tight truncate">
            {hud.currentStreet}
          </div>
          <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-[#C7BEB0] mt-1">
            <span>{hud.currentDistrict}</span>
            <span aria-hidden="true">·</span>
            <span className="font-mono-num text-[#E6DCCB]">{hud.speedKmh} km/s</span>
            <span aria-hidden="true">·</span>
            <span className="font-mono-num">
              {discoveredIds.length}/{LANDMARKS.length} Yer
            </span>
            <span aria-hidden="true">·</span>
            <span className="font-mono-num text-[#D99B43]">{coins} İncir</span>
            <span aria-hidden="true">·</span>
            <span className="font-mono-num text-[#E8B86D]">{lokmaPower} Lokma Gücü</span>
            <span aria-hidden="true">·</span>
            <span className="text-[#9AC58C]">{figStage.label}</span>
          </div>
        </div>

        {/* Top-Right Compact Journal & Pause Actions */}
        <div className="flex flex-col items-end gap-2 pointer-events-auto">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onEnterHome}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#181612]/88 hover:bg-[#24201A] border border-[#61B88A]/35 text-xs font-medium text-[#F5EFE6] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Home className="w-3.5 h-3.5 text-[#61B88A]" aria-hidden="true" />
              <span>Evim</span>
            </button>

            <button
              type="button"
              onClick={onOpenJournal}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#181612]/88 hover:bg-[#24201A] border border-[#F5EFE6]/12 text-xs font-medium text-[#F5EFE6] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <BookOpen className="w-3.5 h-3.5 text-[#D99B43]" aria-hidden="true" />
              <span>Keşif Defteri</span>
            </button>

            <button
              type="button"
              onClick={onPause}
              aria-label="Duraklat"
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#181612]/88 hover:bg-[#24201A] border border-[#F5EFE6]/12 text-xs font-medium text-[#F5EFE6] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Pause className="w-3.5 h-3.5" aria-hidden="true" />
              <span className="hidden sm:inline">Duraklat</span>
            </button>
          </div>

          {activeErrand && errandTargetName && (
            <div className="rounded-xl bg-[#181612]/88 border border-[#61B88A]/30 px-3.5 py-2 text-right max-w-xs">
              <div className="text-[11px] text-[#89C490] font-medium">
                {errandPickedUp ? 'Teslimat Noktası' : 'Alım Noktası'}
                {hud.distanceToActiveErrand !== null && (
                  <span className="font-mono-num"> · {hud.distanceToActiveErrand} m</span>
                )}
              </div>
              <div className="text-xs text-[#F5EFE6] font-medium truncate">
                {activeErrand.title} → {errandTargetName}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Discovery / Errand Celebration Banner (Non-blocking, top-center) */}
      {(recentlyDiscovered || errandToast) && (
        <div className="self-center pointer-events-auto rounded-xl bg-[#1F1C17]/95 border border-[#D99B43]/40 px-5 py-3 text-center max-w-md shadow-xl">
          {recentlyDiscovered ? (
            <>
              <div className="text-xs text-[#D99B43] font-medium">
                Tarihi Yapı Keşfedildi · +{recentlyDiscovered.rewardCoins} İncir Puanı
              </div>
              <div className="font-display text-base font-semibold text-[#F5EFE6] mt-0.5">
                {recentlyDiscovered.name}
              </div>
              <div className="text-xs text-[#CFC6B8] mt-1 line-clamp-2">
                {recentlyDiscovered.summary}
              </div>
            </>
          ) : (
            <div className="text-xs md:text-sm text-[#89C490] font-medium">{errandToast}</div>
          )}
        </div>
      )}

      {/* Bottom Area: Nearby Prompt + Collapsible Bottom Dock */}
      <div className="flex flex-col items-center gap-2.5">
        {hud.nearbyStreetInteraction ? (
          <button
            type="button"
            onClick={onDiscoverNearby}
            className="pointer-events-auto inline-flex items-center gap-2.5 px-5 py-2.5 rounded-xl bg-[#D99B43] hover:bg-[#E4AC59] text-[#181612] text-xs md:text-sm font-semibold shadow-lg transition-colors cursor-pointer"
          >
            <Sparkles className="w-4 h-4" aria-hidden="true" />
            <span>[E] {hud.nearbyStreetInteraction.label}</span>
          </button>
        ) : hud.nearPlayerHome ? (
          <button
            type="button"
            onClick={onEnterHome}
            className="pointer-events-auto inline-flex items-center gap-2.5 px-5 py-2.5 rounded-xl bg-[#61B88A] hover:bg-[#72C89B] text-[#181612] text-xs md:text-sm font-semibold shadow-lg transition-colors cursor-pointer"
          >
            <Home className="w-4 h-4" aria-hidden="true" />
            <span>[E] Sıcak Yuvam’a Gir (Evim)</span>
          </button>
        ) : hud.nearbyLandmark && (nearbyIsUndiscovered || nearbyIsErrandPoint) ? (
          <button
            type="button"
            onClick={onDiscoverNearby}
            className="pointer-events-auto inline-flex items-center gap-2.5 px-5 py-2.5 rounded-xl bg-[#D99B43] hover:bg-[#E4AC59] text-[#181612] text-xs md:text-sm font-semibold shadow-lg transition-colors cursor-pointer"
          >
            <Compass className="w-4 h-4" aria-hidden="true" />
            <span>
              [E] {hud.nearbyLandmark.name} —{' '}
              {nearbyIsErrandPoint
                ? errandPickedUp
                  ? 'Görevi Teslim Et'
                  : 'Paketi Teslim Al'
                : 'Yapıyı Keşfet'}
            </span>
          </button>
        ) : (
          hud.nearAncientSignpost && (
            <button
              type="button"
              onClick={onDiscoverNearby}
              className="pointer-events-auto inline-flex items-center gap-2.5 px-5 py-2.5 rounded-xl bg-[#2A241C]/95 hover:bg-[#362E24] border border-[#D99B43]/45 text-[#F5EFE6] text-xs md:text-sm font-medium shadow-lg transition-colors cursor-pointer"
            >
              <Compass className="w-4 h-4 text-[#D99B43]" aria-hidden="true" />
              <span>[E] Aydın Antik Kentleri (Çok Yakında) Levhasını İncele</span>
            </button>
          )
        )}

        {/* Atmosphere (Weather & Lo-Fi) Drawer */}
        {!dockCollapsed && activeDrawer === 'atmosphere' && (
          <div className="pointer-events-auto w-full max-w-2xl rounded-2xl bg-[#181612]/94 border border-[#F5EFE6]/14 p-4 text-[#F5EFE6] shadow-2xl space-y-3">
            <div>
              <div className="text-[11px] text-[#BEB5A6] mb-1.5">Hava Durumu</div>
              <div className="flex flex-wrap items-center gap-1.5">
                {WEATHER_OPTIONS.map((w) => (
                  <button
                    key={w.id}
                    type="button"
                    onClick={() => onChangeWeather(w.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                      weather === w.id
                        ? 'bg-[#D99B43] text-[#181612]'
                        : 'bg-[#26221C] text-[#CFC6B8] hover:text-[#F5EFE6]'
                    }`}
                  >
                    {w.label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <div className="text-[11px] text-[#BEB5A6] mb-1.5">Lo-Fi Müzik Kanalı</div>
              <div className="flex flex-wrap items-center gap-1.5">
                {LOFI_TRACKS.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => onChangeLofiTrack(t.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                      lofiTrack === t.id
                        ? 'bg-[#61B88A] text-[#181612]'
                        : 'bg-[#26221C] text-[#CFC6B8] hover:text-[#F5EFE6]'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Garage Customization Drawer (Expands above bottom dock only when toggled) */}
        {!dockCollapsed && activeDrawer === 'garage' && (
          <div className="pointer-events-auto w-full max-w-2xl rounded-2xl bg-[#181612]/94 border border-[#F5EFE6]/14 p-4 text-[#F5EFE6] shadow-2xl">
            <div className="flex flex-wrap items-center justify-between gap-4">
              {/* Paint Swatches */}
              <div>
                <div className="text-[11px] text-[#BEB5A6] mb-1.5">Gövde Rengi</div>
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
                          ? 'border-[#F5EFE6] scale-110'
                          : 'border-[#F5EFE6]/25 hover:scale-105'
                      }`}
                      style={{ backgroundColor: sw.hex }}
                    />
                  ))}
                </div>
              </div>

              {/* Accent / Rim Color */}
              <div>
                <div className="text-[11px] text-[#BEB5A6] mb-1.5">Jant & Detay</div>
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
                          ? 'border-[#F5EFE6] scale-110'
                          : 'border-[#F5EFE6]/25 hover:scale-105'
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
                  className="px-3 py-1.5 rounded-lg bg-[#28241E] hover:bg-[#332E26] border border-[#F5EFE6]/10 text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                >
                  Boya: {vehicleConfig.finish === 'gloss' ? 'Parlak' : 'Mat'}
                </button>

                <button
                  type="button"
                  onClick={() =>
                    onChangeVehicleConfig({
                      ...vehicleConfig,
                      hasAccessory: !vehicleConfig.hasAccessory,
                    })
                  }
                  className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    vehicleConfig.hasAccessory
                      ? 'bg-[#D99B43]/20 border-[#D99B43]/50 text-[#F3D19C]'
                      : 'bg-[#28241E] border-[#F5EFE6]/10 text-[#CFC6B8]'
                  }`}
                >
                  {vehicleConfig.type === 'car'
                    ? 'Tavan Bavulu'
                    : vehicleConfig.type === 'bicycle'
                      ? 'İncir Sepeti'
                      : 'Siperlik & Çanta'}
                </button>

                <button
                  type="button"
                  onClick={() =>
                    onChangeVehicleConfig({
                      ...vehicleConfig,
                      hasStripe: !vehicleConfig.hasStripe,
                    })
                  }
                  className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    vehicleConfig.hasStripe
                      ? 'bg-[#D99B43]/20 border-[#D99B43]/50 text-[#F3D19C]'
                      : 'bg-[#28241E] border-[#F5EFE6]/10 text-[#CFC6B8]'
                  }`}
                >
                  Retro Şerit
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Collapsible Unified Bottom Control Dock */}
        <div className="pointer-events-auto flex flex-col items-center">
          <button
            type="button"
            onClick={() => setDockCollapsed((v) => !v)}
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-t-lg bg-[#181612]/90 border border-b-0 border-[#F5EFE6]/12 text-[11px] text-[#CFC6B8] hover:text-[#F5EFE6] transition-colors cursor-pointer"
          >
            {dockCollapsed ? (
              <>
                <ChevronUp className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Kontroller</span>
              </>
            ) : (
              <>
                <ChevronDown className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Gizle</span>
              </>
            )}
          </button>

          {!dockCollapsed && (
            <div className="flex flex-wrap items-center justify-center gap-2 rounded-2xl bg-[#181612]/92 border border-[#F5EFE6]/12 px-3 py-2 text-[#F5EFE6] shadow-xl max-w-[94vw]">
              {/* Vehicle Selector */}
              <div className="flex items-center gap-1 p-0.5 rounded-lg bg-[#24201A]">
                <button
                  type="button"
                  onClick={() => setVehicleType('car')}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    vehicleConfig.type === 'car'
                      ? 'bg-[#D99B43] text-[#181612]'
                      : 'text-[#CFC6B8] hover:text-[#F5EFE6]'
                  }`}
                >
                  <Car className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Araba</span>
                </button>
                <button
                  type="button"
                  onClick={() => setVehicleType('bicycle')}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    vehicleConfig.type === 'bicycle'
                      ? 'bg-[#D99B43] text-[#181612]'
                      : 'text-[#CFC6B8] hover:text-[#F5EFE6]'
                  }`}
                >
                  <Bike className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Bisiklet</span>
                </button>
                <button
                  type="button"
                  onClick={() => setVehicleType('motorcycle')}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    vehicleConfig.type === 'motorcycle'
                      ? 'bg-[#D99B43] text-[#181612]'
                      : 'text-[#CFC6B8] hover:text-[#F5EFE6]'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Motor</span>
                </button>
              </div>

              {/* Garage & Atmosphere Toggles */}
              <button
                type="button"
                onClick={() =>
                  setActiveDrawer((d) => (d === 'garage' ? 'none' : 'garage'))
                }
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  activeDrawer === 'garage'
                    ? 'bg-[#D99B43]/20 border-[#D99B43]/50 text-[#F3D19C]'
                    : 'bg-[#24201A] border-[#F5EFE6]/10 text-[#E6DCCB] hover:bg-[#2F2A22]'
                }`}
              >
                <Paintbrush className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Garaj</span>
              </button>

              <button
                type="button"
                onClick={() =>
                  setActiveDrawer((d) => (d === 'atmosphere' ? 'none' : 'atmosphere'))
                }
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  activeDrawer === 'atmosphere'
                    ? 'bg-[#61B88A]/20 border-[#61B88A]/50 text-[#A7E2C2]'
                    : 'bg-[#24201A] border-[#F5EFE6]/10 text-[#E6DCCB] hover:bg-[#2F2A22]'
                }`}
              >
                <CloudRain className="w-3.5 h-3.5 text-[#8FBCE6]" aria-hidden="true" />
                <span>{WEATHER_OPTIONS.find((w) => w.id === weather)?.label} · Lo-Fi</span>
              </button>

              <span className="hidden sm:inline text-[#F5EFE6]/15">|</span>

              {/* Time of Day Mood */}
              <div className="flex items-center gap-1 p-0.5 rounded-lg bg-[#24201A]">
                <Sun className="w-3.5 h-3.5 text-[#D99B43] ml-1.5 mr-0.5" aria-hidden="true" />
                {(['morning', 'noon', 'golden', 'evening'] as TimeOfDay[]).map((tod) => (
                  <button
                    key={tod}
                    type="button"
                    onClick={() => onChangeTimeOfDay(tod)}
                    className={`px-2 py-1 rounded-md text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                      timeOfDay === tod
                        ? 'bg-[#3A332A] text-[#F5EFE6]'
                        : 'text-[#A89F91] hover:text-[#F5EFE6]'
                    }`}
                  >
                    {TIME_MOODS[tod].label}
                  </button>
                ))}
              </div>

              {/* Camera Preset */}
              <div className="hidden md:flex items-center gap-1 p-0.5 rounded-lg bg-[#24201A]">
                {(
                  [
                    ['isometric', 'İzometrik'],
                    ['close', 'Yakın'],
                    ['overview', 'Geniş'],
                  ] as [CameraPreset, string][]
                ).map(([preset, label]) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => onChangeCameraPreset(preset)}
                    className={`px-2 py-1 rounded-md text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                      cameraPreset === preset
                        ? 'bg-[#3A332A] text-[#F5EFE6]'
                        : 'text-[#A89F91] hover:text-[#F5EFE6]'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>

              <span className="hidden sm:inline text-[#F5EFE6]/15">|</span>

              {/* Horn / Bell & Audio Controls */}
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={onHorn}
                  className="px-2.5 py-1.5 rounded-lg bg-[#24201A] hover:bg-[#2F2A22] text-xs font-medium text-[#E6DCCB] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                >
                  {vehicleConfig.type === 'bicycle' ? 'Zil' : 'Korna'}
                </button>

                <button
                  type="button"
                  onClick={onToggleMusic}
                  title="Sakinleştirici Müzik"
                  aria-label="Müziği Aç/Kapat"
                  className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                    musicEnabled && !isMuted
                      ? 'bg-[#2A2620] border-[#D99B43]/35 text-[#D99B43]'
                      : 'bg-[#24201A] border-[#F5EFE6]/10 text-[#8B8274]'
                  }`}
                >
                  <Music className="w-3.5 h-3.5" aria-hidden="true" />
                </button>

                <button
                  type="button"
                  onClick={onToggleMute}
                  title="Tüm Sesler"
                  aria-label="Sesi Aç/Kapat"
                  className="p-1.5 rounded-lg bg-[#24201A] hover:bg-[#2F2A22] border border-[#F5EFE6]/10 text-[#E6DCCB] transition-colors cursor-pointer"
                >
                  {isMuted ? (
                    <VolumeX className="w-3.5 h-3.5 text-[#C86D5B]" aria-hidden="true" />
                  ) : (
                    <Volume2 className="w-3.5 h-3.5 text-[#89C490]" aria-hidden="true" />
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
