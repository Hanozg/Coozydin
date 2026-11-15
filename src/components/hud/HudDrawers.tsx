import { Home, MapPin, Radio, X } from 'lucide-react';
import {
  ACCENT_SWATCHES,
  HOUSE_ROOF_SWATCHES,
  HOUSE_STYLE_OPTIONS,
  HOUSE_TRIM_SWATCHES,
  HOUSE_WALL_SWATCHES,
  LOFI_TRACKS,
  PAINT_SWATCHES,
  RADIO_STATIONS,
  SEASON_OPTIONS,
  WEATHER_OPTIONS,
} from '../../data/efelerData';
import {
  HouseExteriorConfig,
  LofiTrackId,
  RadioStationDef,
  SeasonType,
  VehicleConfig,
  VehicleType,
  WeatherType,
} from '../../types/game';
import { HudDrawerType } from './hudTypes';

interface HudDrawersProps {
  dockCollapsed: boolean;
  activeDrawer: HudDrawerType;
  setActiveDrawer: (next: HudDrawerType) => void;
  currentStation: RadioStationDef;
  districtStation: RadioStationDef;
  lofiTrack: LofiTrackId;
  autoDistrictRadio: boolean;
  isRadioPlaying: boolean;
  season: SeasonType;
  weather: WeatherType;
  autoAtmosphere: boolean;
  vehicleConfig: VehicleConfig;
  houseExterior: HouseExteriorConfig;
  onChangeLofiTrack: (next: LofiTrackId) => void;
  onToggleAutoDistrictRadio: () => void;
  onChangeSeason: (next: SeasonType) => void;
  onChangeWeather: (next: WeatherType) => void;
  onToggleAutoAtmosphere: () => void;
  onSetVehicleType: (type: VehicleType) => void;
  onChangeVehicleConfig: (next: VehicleConfig) => void;
  onChangeHouseExterior: (next: HouseExteriorConfig) => void;
  onEnterHome: () => void;
}

export function HudDrawers({
  dockCollapsed,
  activeDrawer,
  setActiveDrawer,
  currentStation,
  districtStation,
  lofiTrack,
  autoDistrictRadio,
  isRadioPlaying,
  season,
  weather,
  autoAtmosphere,
  vehicleConfig,
  houseExterior,
  onChangeLofiTrack,
  onToggleAutoDistrictRadio,
  onChangeSeason,
  onChangeWeather,
  onToggleAutoAtmosphere,
  onSetVehicleType,
  onChangeVehicleConfig,
  onChangeHouseExterior,
  onEnterHome,
}: HudDrawersProps) {
  if (dockCollapsed || activeDrawer === 'none') {
    return null;
  }

  return (
    <>
      {/* Efeler Regional Radio Tuner Drawer */}
      {activeDrawer === 'radio' && (
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
      {activeDrawer === 'atmosphere' && (
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
      {activeDrawer === 'garage' && (
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
                    onClick={() => onSetVehicleType(vt)}
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
      {activeDrawer === 'house' && (
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
    </>
  );
}
