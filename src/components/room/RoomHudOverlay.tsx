import {
  Calendar,
  ChevronDown,
  ChevronUp,
  CloudRain,
  Coffee,
  DoorOpen,
  Gamepad2,
  Heart,
  Home,
  LampDesk,
  Move,
  Music,
  Paintbrush,
  PawPrint,
  RotateCcw,
  RotateCw,
  ShoppingBag,
  SlidersHorizontal,
  Sparkles,
  User,
  Volume2,
  VolumeX,
  X,
} from 'lucide-react';
import { VirtualJoystick } from '../VirtualJoystick';
import {
  AVATAR_HAIR_STYLES,
  AVATAR_SHIRT_SWATCHES,
  AVATAR_SKIN_SWATCHES,
  FURNITURE_CATALOG,
  FURNITURE_STYLE_SHOP,
  HOUSE_ROOF_SWATCHES,
  HOUSE_STYLE_OPTIONS,
  HOUSE_TRIM_SWATCHES,
  HOUSE_WALL_SWATCHES,
  LOFI_TRACKS,
  ROOM_WALL_SWATCHES,
  WEATHER_OPTIONS,
} from '../../data/efelerData';
import {
  AvatarConfig,
  CozyRoomState,
  FurnitureStyleDef,
  HouseExteriorConfig,
  LofiTrackId,
  PetType,
  RoomFurnitureId,
  WeatherType,
} from '../../types/game';
import { MobileRoomTab, NearbyRoomInteractable, RoomDrawerTab } from './roomConstants';

interface RoomHudOverlayProps {
  roomState: CozyRoomState;
  houseExterior: HouseExteriorConfig;
  lokmaPower: number;
  unlockedFurnitureStyles: string[];
  weather: WeatherType;
  lofiTrack: LofiTrackId;
  isMuted: boolean;
  musicEnabled: boolean;
  editOpen: boolean;
  placementMode: boolean;
  selectedFurniture: RoomFurnitureId;
  shopFilter: RoomFurnitureId | 'all';
  drawerTab: RoomDrawerTab;
  roomDockCollapsed: boolean;
  mobileRoomTab: MobileRoomTab;
  roomToast: string | null;
  nearbyInteractable: NearbyRoomInteractable | null;
  touchPadOpen: boolean;
  avatarConfig: AvatarConfig;
  avatarPlaced: boolean;
  selectedLabel: string;
  onSetEditOpen: (open: boolean) => void;
  onSetPlacementMode: (next: boolean) => void;
  onTogglePlacementMode: () => void;
  onSetSelectedFurniture: (id: RoomFurnitureId) => void;
  onSetShopFilter: (filter: RoomFurnitureId | 'all') => void;
  onSetDrawerTab: (tab: RoomDrawerTab) => void;
  onToggleRoomTab: (tab: RoomDrawerTab) => void;
  onToggleDockCollapsed: () => void;
  onSetMobileRoomTab: (tab: MobileRoomTab) => void;
  onToggleTouchPad: () => void;
  onJoystickChange: (x: number, y: number) => void;
  onTriggerNearbyInteraction: (id: NearbyRoomInteractable['id']) => void;
  onToggleFurniture: (id: RoomFurnitureId) => void;
  onCycleFurnitureSlot: (id: RoomFurnitureId) => void;
  onRotateFurniture: (id: RoomFurnitureId) => void;
  onResetRoomLayout: () => void;
  onToggleAvatarPlaced: () => void;
  onUpdateAvatarConfig: (patch: Partial<AvatarConfig>) => void;
  onChangeRoomState: (next: CozyRoomState) => void;
  onChangeHouseExterior: (next: HouseExteriorConfig) => void;
  onPurchaseFurnitureStyle: (item: FurnitureStyleDef) => boolean;
  onChangeWeather: (next: WeatherType) => void;
  onChangeLofiTrack: (next: LofiTrackId) => void;
  onToggleMute: () => void;
  onToggleMusic: () => void;
  onOpenAgenda: () => void;
  onExitHome: () => void;
  onShowToast: (msg: string) => void;
}

export function RoomHudOverlay({
  roomState,
  houseExterior,
  lokmaPower,
  unlockedFurnitureStyles,
  weather,
  lofiTrack,
  isMuted,
  musicEnabled,
  editOpen,
  placementMode,
  selectedFurniture,
  shopFilter,
  drawerTab,
  roomDockCollapsed,
  mobileRoomTab,
  roomToast,
  nearbyInteractable,
  touchPadOpen,
  avatarConfig,
  avatarPlaced,
  selectedLabel,
  onSetEditOpen,
  onSetPlacementMode,
  onTogglePlacementMode,
  onSetSelectedFurniture,
  onSetShopFilter,
  onSetDrawerTab,
  onToggleRoomTab,
  onToggleDockCollapsed,
  onSetMobileRoomTab,
  onToggleTouchPad,
  onJoystickChange,
  onTriggerNearbyInteraction,
  onToggleFurniture,
  onCycleFurnitureSlot,
  onRotateFurniture,
  onResetRoomLayout,
  onToggleAvatarPlaced,
  onUpdateAvatarConfig,
  onChangeRoomState,
  onChangeHouseExterior,
  onPurchaseFurnitureStyle,
  onChangeWeather,
  onChangeLofiTrack,
  onToggleMute,
  onToggleMusic,
  onOpenAgenda,
  onExitHome,
  onShowToast,
}: RoomHudOverlayProps) {
  return (
    <div className="absolute inset-0 z-10 pointer-events-none flex flex-col justify-between p-3 sm:p-4 md:p-6 pt-[max(0.75rem,env(safe-area-inset-top))] pb-[max(0.75rem,env(safe-area-inset-bottom))]">
      {/* Top Row */}
      <div className="flex items-start justify-between gap-2 sm:gap-4">
        <div className="pointer-events-auto rounded-2xl bg-[#F7EEDC]/96 border-2 border-[#B99464] px-3 py-2 sm:px-4 sm:py-3 text-[#3A2618] shadow-md max-w-[58vw] sm:max-w-lg">
          <div className="font-display text-sm sm:text-base md:text-lg font-bold leading-tight truncate">
            <span>Sıcak Yuvam · </span>
            <span key={placementMode ? 'place' : 'walk'}>
              {placementMode ? 'Eşya Yerleştirme Modu' : 'Gezinti & Yaşam'}
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-x-1.5 sm:gap-x-2 text-[11px] sm:text-xs text-[#6B5038] mt-0.5 sm:mt-1 font-medium">
            <span>{WEATHER_OPTIONS.find((w) => w.id === weather)?.label}</span>
            <span aria-hidden="true">·</span>
            <span className="truncate">{LOFI_TRACKS.find((t) => t.id === lofiTrack)?.label}</span>
            <span aria-hidden="true">·</span>
            <span className="font-mono-num text-[#B84C27] font-semibold">
              Sevgi: {roomState.petAffection}
            </span>
            <span aria-hidden="true">·</span>
            <span className="font-mono-num text-[#8F5624] font-semibold">
              {lokmaPower} Lokma
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2 pointer-events-auto shrink-0">
          <button
            type="button"
            onClick={onOpenAgenda}
            className="inline-flex items-center gap-1.5 px-2.5 sm:px-3.5 py-2 rounded-xl bg-[#F7EEDC]/96 hover:bg-[#EFE0C3] border-2 border-[#B99464] text-xs font-semibold text-[#3A2618] shadow-md transition-colors whitespace-nowrap cursor-pointer"
          >
            <Calendar className="w-3.5 h-3.5 text-[#B84C27]" aria-hidden="true" />
            <span className="hidden sm:inline">Ajanda &amp; Takvim</span>
            <span className="sm:hidden">Ajanda</span>
          </button>

          <button
            type="button"
            onClick={onExitHome}
            className="inline-flex items-center gap-1.5 px-2.5 sm:px-3.5 py-2 rounded-xl bg-[#C85A32] hover:bg-[#B44D28] border-2 border-[#FAF2E2]/80 text-[#FAF2E2] text-xs font-semibold shadow-md transition-colors whitespace-nowrap cursor-pointer"
          >
            <DoorOpen className="w-3.5 h-3.5" aria-hidden="true" />
            <span className="hidden sm:inline">Efeler Sokağına Çık</span>
            <span className="sm:hidden">Sokağa Çık</span>
          </button>
        </div>
      </div>

      {/* Center Status Toast or Placement Helper */}
      <div className="self-center flex flex-col items-center gap-2">
        {roomToast && (
          <div className="rounded-xl bg-[#F7EEDC]/98 border-2 border-[#C85A32]/70 px-4 py-2 text-xs font-semibold text-[#3A2618] flex items-center gap-2 shadow-xl text-center max-w-md">
            <Heart className="w-3.5 h-3.5 text-[#C85A32] shrink-0" aria-hidden="true" />
            <span>{roomToast}</span>
          </div>
        )}

        {placementMode && (
          <div className="pointer-events-auto flex flex-wrap items-center justify-center gap-2 rounded-2xl bg-[#F7EEDC]/96 border-2 border-[#C85A32]/65 px-3.5 py-2 text-xs text-[#3A2618] shadow-lg">
            <span className="font-semibold text-[#B84C27]">
              Seçili: {selectedLabel}
            </span>
            <span className="hidden sm:inline text-[#6B5038]">
              (Zemine dokun/sürükle ile taşı)
            </span>
            <button
              type="button"
              onClick={() => onRotateFurniture(selectedFurniture)}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#EDE0C6] hover:bg-[#E2D1B2] border border-[#B99464]/60 font-semibold cursor-pointer"
            >
              <RotateCw className="w-3.5 h-3.5 text-[#B84C27]" aria-hidden="true" />
              <span>45° Döndür</span>
            </button>
            <button
              type="button"
              onClick={() => onSetPlacementMode(false)}
              className="px-2.5 py-1 rounded-lg bg-[#5D8A48] text-[#FAF2E2] font-semibold cursor-pointer"
            >
              Bitti
            </button>
          </div>
        )}
      </div>

      {/* Bottom Area: Contextual Prompt + Mobile Walk Pad + Customization Drawer & Bar */}
      <div className="flex flex-col items-center gap-2 sm:gap-2.5 max-w-full">
        {/* Proximity Interact Prompt */}
        {!placementMode && nearbyInteractable && (
          <button
            type="button"
            onClick={() => onTriggerNearbyInteraction(nearbyInteractable.id)}
            className="pointer-events-auto inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#C85A32] hover:bg-[#B44D28] border-2 border-[#FAF2E2]/85 text-[#FAF2E2] text-xs sm:text-sm font-semibold shadow-lg transition-colors cursor-pointer"
          >
            {nearbyInteractable.id === 'teatable' ? (
              <Coffee key="coffee" className="w-4 h-4" aria-hidden="true" />
            ) : (
              <Sparkles key="sparkle" className="w-4 h-4" aria-hidden="true" />
            )}
            <span>[E] {nearbyInteractable.label}</span>
          </button>
        )}

        {/* Compact Analog Walk Joystick when Avatar is placed */}
        {touchPadOpen && !placementMode && avatarPlaced && !editOpen && (
          <div className="w-full flex items-end justify-between px-1 sm:px-3">
            <VirtualJoystick
              size={112}
              knobSize={46}
              accent="olive"
              ariaLabel="Oda İçi Yürüme Joysticki"
              label="Yürü"
              onChange={({ x, y }) => onJoystickChange(x, y)}
            />
            <div className="rounded-xl bg-[#F7EEDC]/90 border border-[#B99464]/60 px-2.5 py-1.5 text-[11px] font-medium text-[#5B432F]">
              Joystick veya zemine dokunarak yürü
            </div>
          </div>
        )}

        {!roomDockCollapsed && editOpen && (
          <div className="pointer-events-auto w-full max-w-2xl max-h-[42dvh] overflow-y-auto efeler-scroll rounded-2xl bg-[#F7EEDC]/98 border-2 border-[#B99464] p-3.5 sm:p-4 text-[#3A2618] shadow-2xl">
            {/* Drawer Header + Close Button */}
            <div className="flex items-center justify-between gap-2 pb-2 mb-2.5 border-b border-[#B99464]/35">
              <div className="text-xs font-bold text-[#3A2618]">
                Oda &amp; Yaşam Alanı Tasarımı
              </div>
              <button
                type="button"
                onClick={() => onSetEditOpen(false)}
                aria-label="Oda Tasarım Panelini Kapat"
                className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-[#EDE0C6] hover:bg-[#E2D1B2] text-[11px] font-semibold text-[#5B432F] transition-colors cursor-pointer"
              >
                <X className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Kapat</span>
              </button>
            </div>

            {/* Tabs */}
            <div className="flex flex-wrap items-center gap-1.5 pb-2.5 mb-3 border-b border-[#B99464]/40">
              {(
                [
                  ['shop', 'Mobilya Mağazası'],
                  ['exterior', 'Ev Dışı & Cephe'],
                  ['furniture', 'Eşya & Yerleşim'],
                  ['avatar', 'Avatarım'],
                  ['style', 'Duvar & Zemin'],
                  ['pets', 'Can Dostlarım'],
                  ['atmosphere', 'Hava & Lo-Fi'],
                ] as const
              ).map(([id, label]) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => onSetDrawerTab(id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                    drawerTab === id
                      ? 'bg-[#C85A32] text-[#FAF2E2]'
                      : 'bg-[#EDE0C6] text-[#5B432F] hover:bg-[#E2D1B2]'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            {drawerTab === 'shop' && (
              <div className="space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="text-xs text-[#6B5038]">
                    Bey Camii hayır lokması ve keşiflerden kazandığın <strong>Lokma Puanı</strong> ile koltuk, pikap ve oda mobilyalarının yeni görünümlerini aç!
                  </div>
                  <div className="px-3 py-1 rounded-lg bg-[#EFE0C3] border border-[#B99464] text-xs font-bold text-[#8F5624] font-mono-num shrink-0">
                    Bakiye: {lokmaPower} Lokma
                  </div>
                </div>

                {/* Category Filter */}
                <div className="flex flex-wrap items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => onSetShopFilter('all')}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold cursor-pointer ${
                      shopFilter === 'all'
                        ? 'bg-[#5B3D28] text-[#FAF2E2]'
                        : 'bg-[#EDE0C6] text-[#5B432F]'
                    }`}
                  >
                    Tümü
                  </button>
                  {FURNITURE_CATALOG.map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => onSetShopFilter(cat.id)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold cursor-pointer ${
                        shopFilter === cat.id
                          ? 'bg-[#5B3D28] text-[#FAF2E2]'
                          : 'bg-[#EDE0C6] text-[#5B432F]'
                      }`}
                    >
                      {cat.label.split(' ')[0]}
                    </button>
                  ))}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {FURNITURE_STYLE_SHOP.filter(
                    (s) => shopFilter === 'all' || s.furnitureId === shopFilter
                  ).map((item) => {
                    const isOwned =
                      item.priceLokma === 0 || unlockedFurnitureStyles.includes(item.key);
                    const curSlot = roomState.furniture.find((f) => f.id === item.furnitureId);
                    const isEquipped = (curSlot?.styleId || 'classic') === item.styleId;
                    const catLabel =
                      FURNITURE_CATALOG.find((c) => c.id === item.furnitureId)?.label ||
                      item.furnitureId;

                    return (
                      <div
                        key={item.key}
                        className={`flex flex-col justify-between gap-2 rounded-xl border p-2.5 ${
                          isEquipped
                            ? 'bg-[#EFE0C3] border-[#5D8A48]'
                            : 'bg-[#FAF3E6] border-[#B99464]/45'
                        }`}
                      >
                        <div className="flex items-start gap-2.5">
                          <span
                            className="w-5 h-5 rounded-full border border-[#3A2618]/25 shrink-0 mt-0.5"
                            style={{ backgroundColor: item.accentHex }}
                          />
                          <div className="min-w-0">
                            <div className="text-[10px] font-semibold text-[#8A6D50] uppercase tracking-wide">
                              {catLabel}
                            </div>
                            <div className="text-xs font-bold text-[#3A2618] leading-tight">
                              {item.name}
                            </div>
                            <div className="text-[11px] text-[#6B5038] mt-0.5 leading-snug">
                              {item.description}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center justify-between gap-2 pt-1 border-t border-[#B99464]/20">
                          <span className="text-[11px] font-bold font-mono-num text-[#8F5624]">
                            {item.priceLokma === 0 ? 'Başlangıç' : `${item.priceLokma} Lokma`}
                          </span>
                          {isEquipped ? (
                            <span
                              key="equipped"
                              className="px-2.5 py-1 rounded-lg bg-[#5D8A48] text-[#FAF2E2] text-[11px] font-semibold"
                            >
                              Takılı ✓
                            </span>
                          ) : isOwned ? (
                            <button
                              key="equip"
                              type="button"
                              onClick={() => {
                                onChangeRoomState({
                                  ...roomState,
                                  furniture: roomState.furniture.map((f) =>
                                    f.id === item.furnitureId
                                      ? { ...f, styleId: item.styleId, enabled: true }
                                      : f
                                  ),
                                });
                                onShowToast(`${item.name} odaya yerleştirildi!`);
                              }}
                              className="px-2.5 py-1 rounded-lg bg-[#3B6E8C] hover:bg-[#315D77] text-[#FAF2E2] text-[11px] font-semibold cursor-pointer"
                            >
                              Kullan
                            </button>
                          ) : (
                            <button
                              key="buy"
                              type="button"
                              disabled={lokmaPower < item.priceLokma}
                              onClick={() => {
                                const ok = onPurchaseFurnitureStyle(item);
                                if (ok) {
                                  onShowToast(`${item.name} satın alındı ve takıldı!`);
                                } else {
                                  onShowToast(
                                    `Yetersiz Lokma! Bey Camii önünden hayır lokması alabilirsin (${item.priceLokma} Lokma gerekir).`
                                  );
                                }
                              }}
                              className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold cursor-pointer ${
                                lokmaPower >= item.priceLokma
                                  ? 'bg-[#C85A32] hover:bg-[#B44D28] text-[#FAF2E2]'
                                  : 'bg-[#E2D3B8] text-[#8E7761] cursor-not-allowed'
                              }`}
                            >
                              Satın Al ({item.priceLokma} Lokma)
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {drawerTab === 'exterior' && (
              <div className="space-y-3">
                <div className="text-xs text-[#6B5038]">
                  Efeler sokağındaki kendi evinin dış mimarisini, duvar boyasını ve çatı rengini dilediğin gibi tasarla. Sokağa çıktığında evin anında güncellenir!
                </div>

                <div>
                  <div className="text-[11px] font-semibold text-[#6B5038] mb-1.5">
                    Mimari Ev Modeli
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {HOUSE_STYLE_OPTIONS.map((opt) => {
                      const active = houseExterior.style === opt.id;
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
                          className={`text-left rounded-xl border p-2.5 transition-colors cursor-pointer ${
                            active
                              ? 'bg-[#EFE0C3] border-[#C85A32]'
                              : 'bg-[#FAF3E6] border-[#B99464]/45 hover:bg-[#F3E7D2]'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-xs font-bold text-[#3A2618]">{opt.name}</span>
                            {active && (
                              <span className="text-[10px] font-bold text-[#4B743B]">Seçili ✓</span>
                            )}
                          </div>
                          <div className="text-[11px] text-[#6B5038] mt-0.5 leading-snug">
                            {opt.subtitle}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-5">
                  <div>
                    <div className="text-[11px] font-semibold text-[#6B5038] mb-1.5">
                      Dış Cephe Boyası
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      {HOUSE_WALL_SWATCHES.map((sw) => (
                        <button
                          key={sw.id}
                          type="button"
                          title={sw.name}
                          onClick={() =>
                            onChangeHouseExterior({ ...houseExterior, wallColor: sw.hex })
                          }
                          className={`w-6 h-6 rounded-full border-2 cursor-pointer ${
                            houseExterior.wallColor === sw.hex
                              ? 'border-[#3A2618] scale-110'
                              : 'border-[#B99464]/60'
                          }`}
                          style={{ backgroundColor: sw.hex }}
                        />
                      ))}
                    </div>
                  </div>

                  <div>
                    <div className="text-[11px] font-semibold text-[#6B5038] mb-1.5">
                      Çatı Rengi
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      {HOUSE_ROOF_SWATCHES.map((sw) => (
                        <button
                          key={sw.id}
                          type="button"
                          title={sw.name}
                          onClick={() =>
                            onChangeHouseExterior({ ...houseExterior, roofColor: sw.hex })
                          }
                          className={`w-6 h-6 rounded-full border-2 cursor-pointer ${
                            houseExterior.roofColor === sw.hex
                              ? 'border-[#3A2618] scale-110'
                              : 'border-[#B99464]/60'
                          }`}
                          style={{ backgroundColor: sw.hex }}
                        />
                      ))}
                    </div>
                  </div>

                  <div>
                    <div className="text-[11px] font-semibold text-[#6B5038] mb-1.5">
                      Söve &amp; Pervaz
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      {HOUSE_TRIM_SWATCHES.map((sw) => (
                        <button
                          key={sw.id}
                          type="button"
                          title={sw.name}
                          onClick={() =>
                            onChangeHouseExterior({ ...houseExterior, trimColor: sw.hex })
                          }
                          className={`w-6 h-6 rounded-full border-2 cursor-pointer ${
                            houseExterior.trimColor === sw.hex
                              ? 'border-[#3A2618] scale-110'
                              : 'border-[#B99464]/60'
                          }`}
                          style={{ backgroundColor: sw.hex }}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {drawerTab === 'furniture' && (
              <div className="space-y-2.5">
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-[#6B5038]">
                  <span>
                    Bir eşya seçip <strong>Serbest Taşı</strong> modunda odada dilediğin yere koyabilirsin.
                  </span>
                  <button
                    type="button"
                    onClick={onResetRoomLayout}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#EDE0C6] hover:bg-[#E2D1B2] border border-[#B99464]/45 text-[11px] font-semibold text-[#3A2618] cursor-pointer"
                  >
                    <RotateCcw className="w-3 h-3" aria-hidden="true" />
                    <span>Düzeni Sıfırla</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {FURNITURE_CATALOG.map((item) => {
                    const placement = roomState.furniture.find((f) => f.id === item.id);
                    const enabled = placement?.enabled ?? true;
                    const isSel = selectedFurniture === item.id;
                    return (
                      <div
                        key={item.id}
                        className={`flex items-center justify-between gap-2 rounded-xl border px-3 py-2 ${
                          isSel
                            ? 'bg-[#EFE0C3] border-[#C85A32]'
                            : 'bg-[#FAF3E6] border-[#B99464]/45'
                        }`}
                      >
                        <button
                          type="button"
                          onClick={() => onToggleFurniture(item.id)}
                          title="Göster/Gizle"
                          className={`text-xs font-semibold text-left cursor-pointer ${
                            enabled ? 'text-[#3A2618]' : 'text-[#9A8570] line-through'
                          }`}
                        >
                          {item.label}
                        </button>
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => {
                              onSetSelectedFurniture(item.id);
                              onSetPlacementMode(true);
                              onSetEditOpen(false);
                            }}
                            className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-[#C85A32] hover:bg-[#B44D28] text-[11px] font-semibold text-[#FAF2E2] cursor-pointer"
                          >
                            <Move className="w-3 h-3" aria-hidden="true" />
                            <span>Taşı</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => onRotateFurniture(item.id)}
                            title="Döndür"
                            className="p-1 rounded-md bg-[#EDE0C6] hover:bg-[#E2D1B2] border border-[#B99464]/45 text-[#3A2618] cursor-pointer"
                          >
                            <RotateCw className="w-3 h-3 text-[#B84C27]" aria-hidden="true" />
                          </button>
                          <button
                            type="button"
                            onClick={() => onCycleFurnitureSlot(item.id)}
                            title="Hazır Konum"
                            className="px-1.5 py-1 rounded-md bg-[#EDE0C6] hover:bg-[#E2D1B2] border border-[#B99464]/45 text-[11px] font-semibold text-[#3A2618] cursor-pointer"
                          >
                            #{(placement?.slotIndex ?? 0) + 1}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Quick Audio Device Selector */}
                <div className="rounded-xl bg-[#FAF3E6] border border-[#B99464]/50 p-2.5 space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-[#3A2618]">
                      <Music className="w-3.5 h-3.5 text-[#C85A32]" aria-hidden="true" />
                      <span>Oda Ses Cihazı (Pikap · Gramofon · Amfi · Ev Sistemi)</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        onSetShopFilter('turntable');
                        onSetDrawerTab('shop');
                      }}
                      className="text-[11px] font-bold text-[#B84C27] hover:underline cursor-pointer"
                    >
                      Mağazada Tümünü Gör →
                    </button>
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5">
                    {FURNITURE_STYLE_SHOP.filter((s) => s.furnitureId === 'turntable').map((device) => {
                      const isOwned =
                        device.priceLokma === 0 || unlockedFurnitureStyles.includes(device.key);
                      const curAudio = roomState.furniture.find((f) => f.id === 'turntable');
                      const isEquipped = (curAudio?.styleId || 'classic') === device.styleId;
                      return (
                        <button
                          key={device.key}
                          type="button"
                          onClick={() => {
                            if (isEquipped) return;
                            if (isOwned) {
                              onChangeRoomState({
                                ...roomState,
                                furniture: roomState.furniture.map((f) =>
                                  f.id === 'turntable'
                                    ? { ...f, styleId: device.styleId, enabled: true }
                                    : f
                                ),
                              });
                              onShowToast(`${device.name} odaya kuruldu!`);
                            } else {
                              onSetShopFilter('turntable');
                              onSetDrawerTab('shop');
                              onShowToast(
                                `${device.name} için ${device.priceLokma} Lokma gerekir — mağazadan açabilirsin.`
                              );
                            }
                          }}
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-[11px] font-semibold transition-colors cursor-pointer ${
                            isEquipped
                              ? 'bg-[#5D8A48] border-[#4A7138] text-[#FAF2E2]'
                              : isOwned
                                ? 'bg-[#EFE0C3] hover:bg-[#E4D1AE] border-[#B99464]/55 text-[#3A2618]'
                                : 'bg-[#EDE0C6]/70 border-[#B99464]/35 text-[#7A624B]'
                          }`}
                        >
                          <span
                            className="w-2.5 h-2.5 rounded-full border border-[#3A2618]/25 shrink-0"
                            style={{ backgroundColor: device.accentHex }}
                          />
                          <span>{device.name}</span>
                          {!isOwned && (
                            <span className="text-[10px] font-mono-num text-[#8F5624]">
                              ({device.priceLokma}L)
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {drawerTab === 'avatar' && (
              <div className="space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="text-xs text-[#6B5038]">
                    Avatarını odaya yerleştirip WASD, dokunmatik tuşlar veya zemine tıklayarak yürütebilirsin.
                  </div>
                  <button
                    type="button"
                    onClick={onToggleAvatarPlaced}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer ${
                      avatarPlaced
                        ? 'bg-[#5D8A48] text-[#FAF2E2]'
                        : 'bg-[#EDE0C6] text-[#3A2618]'
                    }`}
                  >
                    <span key={avatarPlaced ? 'placed' : 'unplaced'}>
                      {avatarPlaced ? 'Avatar Odada (Gizle)' : 'Avatarı Odaya Yerleştir'}
                    </span>
                  </button>
                </div>

                <div>
                  <div className="text-[11px] font-semibold text-[#6B5038] mb-1.5">
                    Saç &amp; Şapka Stili
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5">
                    {AVATAR_HAIR_STYLES.map((hs) => (
                      <button
                        key={hs.id}
                        type="button"
                        onClick={() => onUpdateAvatarConfig({ hairStyle: hs.id })}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer ${
                          avatarConfig.hairStyle === hs.id
                            ? 'bg-[#C85A32] text-[#FAF2E2]'
                            : 'bg-[#EDE0C6] text-[#5B432F]'
                        }`}
                      >
                        {hs.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-5">
                  <div>
                    <div className="text-[11px] font-semibold text-[#6B5038] mb-1.5">
                      Kıyafet Rengi
                    </div>
                    <div className="flex items-center gap-2">
                      {AVATAR_SHIRT_SWATCHES.map((sw) => (
                        <button
                          key={sw.id}
                          type="button"
                          title={sw.name}
                          onClick={() => onUpdateAvatarConfig({ shirtColor: sw.hex })}
                          className={`w-6 h-6 rounded-full border-2 cursor-pointer ${
                            avatarConfig.shirtColor === sw.hex
                              ? 'border-[#3A2618] scale-110'
                              : 'border-[#B99464]/60'
                          }`}
                          style={{ backgroundColor: sw.hex }}
                        />
                      ))}
                    </div>
                  </div>

                  <div>
                    <div className="text-[11px] font-semibold text-[#6B5038] mb-1.5">
                      Ten Tonu
                    </div>
                    <div className="flex items-center gap-2">
                      {AVATAR_SKIN_SWATCHES.map((sw) => (
                        <button
                          key={sw.id}
                          type="button"
                          title={sw.name}
                          onClick={() => onUpdateAvatarConfig({ skinColor: sw.hex })}
                          className={`w-6 h-6 rounded-full border-2 cursor-pointer ${
                            avatarConfig.skinColor === sw.hex
                              ? 'border-[#3A2618] scale-110'
                              : 'border-[#B99464]/60'
                          }`}
                          style={{ backgroundColor: sw.hex }}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {drawerTab === 'style' && (
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <div className="text-[11px] font-semibold text-[#6B5038] mb-1.5">Duvar Rengi</div>
                  <div className="flex items-center gap-2">
                    {ROOM_WALL_SWATCHES.map((sw) => (
                      <button
                        key={sw.id}
                        type="button"
                        title={sw.name}
                        onClick={() => onChangeRoomState({ ...roomState, wallColor: sw.hex })}
                        className={`w-7 h-7 rounded-full border-2 cursor-pointer ${
                          roomState.wallColor === sw.hex
                            ? 'border-[#3A2618] scale-110'
                            : 'border-[#B99464]/60'
                        }`}
                        style={{ backgroundColor: sw.hex }}
                      />
                    ))}
                  </div>
                </div>

                <div>
                  <div className="text-[11px] font-semibold text-[#6B5038] mb-1.5">Zemin Dokusu</div>
                  <div className="flex flex-wrap items-center gap-1.5">
                    {(
                      [
                        ['oak', 'Sıcak Meşe'],
                        ['pine', 'Açık Çam'],
                        ['stone', 'Doğal Taş'],
                      ] as const
                    ).map(([tone, label]) => (
                      <button
                        key={tone}
                        type="button"
                        onClick={() => onChangeRoomState({ ...roomState, floorTone: tone })}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer ${
                          roomState.floorTone === tone
                            ? 'bg-[#C85A32] text-[#FAF2E2]'
                            : 'bg-[#EDE0C6] text-[#5B432F]'
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {drawerTab === 'pets' && (
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-1.5">
                  {(
                    [
                      ['cat', 'Sadece Pamuk (Kedi)'],
                      ['dog', 'Sadece Efe (Köpek)'],
                      ['both', 'İkisi Birden'],
                    ] as [PetType, string][]
                  ).map(([p, label]) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => onChangeRoomState({ ...roomState, petType: p })}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer ${
                        roomState.petType === p
                          ? 'bg-[#C85A32] text-[#FAF2E2]'
                          : 'bg-[#EDE0C6] text-[#5B432F]'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
                <div className="text-xs text-[#6B5038] font-medium">
                  Yanlarına yürüyüp [E] ile veya dokunarak sevebilirsin.
                </div>
              </div>
            )}

            {drawerTab === 'atmosphere' && (
              <div className="space-y-3">
                <div>
                  <div className="text-[11px] font-semibold text-[#6B5038] mb-1.5">
                    Pencere Dışı Hava Durumu
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5">
                    {WEATHER_OPTIONS.map((w) => (
                      <button
                        key={w.id}
                        type="button"
                        onClick={() => onChangeWeather(w.id)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer ${
                          weather === w.id
                            ? 'bg-[#C85A32] text-[#FAF2E2]'
                            : 'bg-[#EDE0C6] text-[#5B432F]'
                        }`}
                      >
                        {w.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <div className="text-[11px] font-semibold text-[#6B5038] mb-1.5">
                    Lo-Fi Müzik Kanalı
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5">
                    {LOFI_TRACKS.map((t) => (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => onChangeLofiTrack(t.id)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer ${
                          lofiTrack === t.id
                            ? 'bg-[#5D8A48] text-[#FAF2E2]'
                            : 'bg-[#EDE0C6] text-[#5B432F]'
                        }`}
                      >
                        {t.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Collapsible Structured Bottom Bar */}
        <div className="pointer-events-auto flex flex-col items-center max-w-full">
          <button
            type="button"
            onClick={onToggleDockCollapsed}
            className="inline-flex items-center gap-2 px-4 py-1 rounded-t-xl bg-[#F7EEDC]/96 border-2 border-b-0 border-[#B99464] text-[11px] font-semibold text-[#5B432F] hover:text-[#3A2618] transition-colors cursor-pointer"
          >
            {roomDockCollapsed ? (
              <span key="room-collapsed" className="inline-flex items-center gap-1.5">
                <ChevronUp className="w-3.5 h-3.5 text-[#C85A32]" aria-hidden="true" />
                <span>Oda Panelini Aç</span>
              </span>
            ) : (
              <span key="room-expanded" className="inline-flex items-center gap-1.5">
                <ChevronDown className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Paneli Gizle</span>
              </span>
            )}
          </button>

          {!roomDockCollapsed && (
            <div className="rounded-2xl bg-[#F7EEDC]/96 border-2 border-[#B99464] px-3 py-2 sm:px-3.5 sm:py-2.5 text-[#3A2618] shadow-xl max-w-[96vw]">
              {/* Desktop & Tablet 2-Row Structured Bar */}
              <div className="hidden md:flex flex-col gap-2">
                {/* Row 1: Oda & Tasarım */}
                <div className="flex flex-wrap items-center justify-center gap-1.5">
                  <span className="text-[11px] font-bold text-[#6B5038] mr-1 whitespace-nowrap">
                    Oda &amp; Tasarım
                  </span>

                  <button
                    type="button"
                    onClick={onTogglePlacementMode}
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                      placementMode
                        ? 'bg-[#C85A32] border-[#A74522] text-[#FAF2E2]'
                        : 'bg-[#EDE0C6] border-[#B99464]/60 hover:bg-[#E2D1B2] text-[#3A2618]'
                    }`}
                  >
                    <Move className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>Eşya Taşı</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => onToggleRoomTab('shop')}
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                      editOpen && drawerTab === 'shop'
                        ? 'bg-[#C85A32] border-[#A74522] text-[#FAF2E2]'
                        : 'bg-[#EFE0C3] hover:bg-[#E4D1AE] border-[#C85A32]/40 text-[#3A2618]'
                    }`}
                  >
                    <ShoppingBag className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>Mağaza</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => onToggleRoomTab('furniture')}
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                      editOpen && drawerTab === 'furniture'
                        ? 'bg-[#C85A32] border-[#A74522] text-[#FAF2E2]'
                        : 'bg-[#EDE0C6] border-[#B99464]/60 hover:bg-[#E2D1B2] text-[#3A2618]'
                    }`}
                  >
                    <Paintbrush className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>Eşyalar &amp; Düzen</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => onToggleRoomTab('style')}
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                      editOpen && drawerTab === 'style'
                        ? 'bg-[#C85A32] border-[#A74522] text-[#FAF2E2]'
                        : 'bg-[#EDE0C6] border-[#B99464]/60 hover:bg-[#E2D1B2] text-[#3A2618]'
                    }`}
                  >
                    <Sparkles className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>Duvar &amp; Zemin</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => onToggleRoomTab('exterior')}
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                      editOpen && drawerTab === 'exterior'
                        ? 'bg-[#5D8A48] border-[#4A7138] text-[#FAF2E2]'
                        : 'bg-[#EDE0C6] border-[#B99464]/60 hover:bg-[#E2D1B2] text-[#3A2618]'
                    }`}
                  >
                    <Home className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>Ev Dışı</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => onToggleRoomTab('avatar')}
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                      editOpen && drawerTab === 'avatar'
                        ? 'bg-[#5D8A48] border-[#4A7138] text-[#FAF2E2]'
                        : 'bg-[#EDE0C6] border-[#B99464]/60 hover:bg-[#E2D1B2] text-[#3A2618]'
                    }`}
                  >
                    <User className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>Avatarım</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => onToggleRoomTab('pets')}
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                      editOpen && drawerTab === 'pets'
                        ? 'bg-[#5D8A48] border-[#4A7138] text-[#FAF2E2]'
                        : 'bg-[#EDE0C6] border-[#B99464]/60 hover:bg-[#E2D1B2] text-[#3A2618]'
                    }`}
                  >
                    <PawPrint className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>Dostlarım</span>
                  </button>
                </div>

                {/* Row 2: Ortam, Kontrol & Ses */}
                <div className="flex flex-wrap items-center justify-center gap-1.5 pt-1.5 border-t border-[#B99464]/30">
                  <span className="text-[11px] font-bold text-[#6B5038] mr-1 whitespace-nowrap">
                    Ortam &amp; Ses
                  </span>

                  <button
                    type="button"
                    onClick={() =>
                      onChangeRoomState({ ...roomState, lampOn: !roomState.lampOn })
                    }
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                      roomState.lampOn
                        ? 'bg-[#EFE0C3] border-[#C85A32]/60 text-[#B84C27]'
                        : 'bg-[#EDE0C6] border-[#B99464]/50 text-[#6B5038]'
                    }`}
                  >
                    <LampDesk className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>
                      Lamba:{' '}
                      <span key={roomState.lampOn ? 'on' : 'off'}>
                        {roomState.lampOn ? 'Açık' : 'Kapalı'}
                      </span>
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => onToggleRoomTab('atmosphere')}
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                      editOpen && drawerTab === 'atmosphere'
                        ? 'bg-[#5D8A48] border-[#4A7138] text-[#FAF2E2]'
                        : 'bg-[#EDE0C6] border-[#B99464]/60 hover:bg-[#E2D1B2] text-[#3A2618]'
                    }`}
                  >
                    <CloudRain className="w-3.5 h-3.5 text-[#3B6E8C]" aria-hidden="true" />
                    <span>Hava &amp; Lo-Fi</span>
                  </button>

                  <button
                    type="button"
                    onClick={onToggleTouchPad}
                    title="Ekrandaki Yürüme Joystickini Göster/Gizle"
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                      touchPadOpen
                        ? 'bg-[#EFE0C3] border-[#C85A32]/60 text-[#B84C27]'
                        : 'bg-[#EDE0C6] border-[#B99464]/50 text-[#5B432F]'
                    }`}
                  >
                    <Gamepad2 className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>Joystick</span>
                  </button>

                  <button
                    type="button"
                    onClick={onToggleMusic}
                    title="Lo-Fi Müziği Aç/Kapat"
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                      musicEnabled && !isMuted
                        ? 'bg-[#EFE0C3] border-[#C85A32]/60 text-[#B84C27]'
                        : 'bg-[#EDE0C6] border-[#B99464]/50 text-[#5B432F]'
                    }`}
                  >
                    <Music className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>Müzik</span>
                  </button>

                  <button
                    type="button"
                    onClick={onToggleMute}
                    title="Tüm Sesleri Aç/Kapat"
                    className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-[#EDE0C6] hover:bg-[#E2D1B2] border border-[#B99464]/50 text-xs font-semibold text-[#3A2618] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
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

              {/* Mobile Compact 2-Tab Layout */}
              <div className="flex md:hidden flex-col gap-2">
                <div className="flex items-center justify-center gap-1 p-0.5 rounded-xl bg-[#E8D8B9]">
                  <button
                    type="button"
                    onClick={() => onSetMobileRoomTab('room')}
                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-[11px] font-semibold transition-colors cursor-pointer ${
                      mobileRoomTab === 'room'
                        ? 'bg-[#C85A32] text-[#FAF2E2]'
                        : 'text-[#5B432F]'
                    }`}
                  >
                    <Paintbrush className="w-3 h-3" aria-hidden="true" />
                    <span>Tasarım</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => onSetMobileRoomTab('ambient')}
                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-[11px] font-semibold transition-colors cursor-pointer ${
                      mobileRoomTab === 'ambient'
                        ? 'bg-[#5B3D28] text-[#FAF2E2]'
                        : 'text-[#5B432F]'
                    }`}
                  >
                    <SlidersHorizontal className="w-3 h-3" aria-hidden="true" />
                    <span>Ortam &amp; Ses</span>
                  </button>
                </div>

                {mobileRoomTab === 'room' ? (
                  <div className="flex flex-wrap items-center justify-center gap-1.5">
                    <button
                      type="button"
                      onClick={onTogglePlacementMode}
                      className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold cursor-pointer ${
                        placementMode
                          ? 'bg-[#C85A32] text-[#FAF2E2]'
                          : 'bg-[#EDE0C6] text-[#3A2618]'
                      }`}
                    >
                      <Move className="w-3.5 h-3.5" aria-hidden="true" />
                      <span>Taşı</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => onToggleRoomTab('shop')}
                      className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold cursor-pointer ${
                        editOpen && drawerTab === 'shop'
                          ? 'bg-[#C85A32] text-[#FAF2E2]'
                          : 'bg-[#EFE0C3] text-[#3A2618]'
                      }`}
                    >
                      <ShoppingBag className="w-3.5 h-3.5" aria-hidden="true" />
                      <span>Mağaza</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => onToggleRoomTab('furniture')}
                      className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold cursor-pointer ${
                        editOpen && drawerTab === 'furniture'
                          ? 'bg-[#C85A32] text-[#FAF2E2]'
                          : 'bg-[#EDE0C6] text-[#3A2618]'
                      }`}
                    >
                      <Paintbrush className="w-3.5 h-3.5" aria-hidden="true" />
                      <span>Düzenle</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => onToggleRoomTab('exterior')}
                      className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold cursor-pointer ${
                        editOpen && drawerTab === 'exterior'
                          ? 'bg-[#5D8A48] text-[#FAF2E2]'
                          : 'bg-[#EDE0C6] text-[#3A2618]'
                      }`}
                    >
                      <Home className="w-3.5 h-3.5" aria-hidden="true" />
                      <span>Ev Dışı</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => onToggleRoomTab('avatar')}
                      className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold cursor-pointer ${
                        editOpen && drawerTab === 'avatar'
                          ? 'bg-[#5D8A48] text-[#FAF2E2]'
                          : 'bg-[#EDE0C6] text-[#3A2618]'
                      }`}
                    >
                      <User className="w-3.5 h-3.5" aria-hidden="true" />
                      <span>Avatar</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => onToggleRoomTab('pets')}
                      className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold cursor-pointer ${
                        editOpen && drawerTab === 'pets'
                          ? 'bg-[#5D8A48] text-[#FAF2E2]'
                          : 'bg-[#EDE0C6] text-[#3A2618]'
                      }`}
                    >
                      <PawPrint className="w-3.5 h-3.5" aria-hidden="true" />
                      <span>Dostlar</span>
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-wrap items-center justify-center gap-1.5">
                    <button
                      type="button"
                      onClick={() =>
                        onChangeRoomState({ ...roomState, lampOn: !roomState.lampOn })
                      }
                      className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl border text-xs font-semibold cursor-pointer ${
                        roomState.lampOn
                          ? 'bg-[#EFE0C3] border-[#C85A32]/50 text-[#B84C27]'
                          : 'bg-[#EDE0C6] border-[#B99464]/50 text-[#6B5038]'
                      }`}
                    >
                      <LampDesk className="w-3.5 h-3.5" aria-hidden="true" />
                      <span>Lamba</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => onToggleRoomTab('atmosphere')}
                      className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold cursor-pointer ${
                        editOpen && drawerTab === 'atmosphere'
                          ? 'bg-[#5D8A48] text-[#FAF2E2]'
                          : 'bg-[#EDE0C6] text-[#3A2618]'
                      }`}
                    >
                      <CloudRain className="w-3.5 h-3.5 text-[#3B6E8C]" aria-hidden="true" />
                      <span>Hava &amp; Lo-Fi</span>
                    </button>
                    <button
                      type="button"
                      onClick={onToggleTouchPad}
                      className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl border text-xs font-semibold cursor-pointer ${
                        touchPadOpen
                          ? 'bg-[#EFE0C3] border-[#C85A32]/60 text-[#B84C27]'
                          : 'bg-[#EDE0C6] border-[#B99464]/50 text-[#5B432F]'
                      }`}
                    >
                      <Gamepad2 className="w-3.5 h-3.5" aria-hidden="true" />
                      <span>Joystick</span>
                    </button>
                    <button
                      type="button"
                      onClick={onToggleMusic}
                      className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl border text-xs font-semibold cursor-pointer ${
                        musicEnabled && !isMuted
                          ? 'bg-[#EFE0C3] border-[#C85A32]/60 text-[#B84C27]'
                          : 'bg-[#EDE0C6] border-[#B99464]/50 text-[#5B432F]'
                      }`}
                    >
                      <Music className="w-3.5 h-3.5" aria-hidden="true" />
                      <span>Müzik</span>
                    </button>
                    <button
                      type="button"
                      onClick={onToggleMute}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-[#EDE0C6] border border-[#B99464]/50 text-xs font-semibold text-[#3A2618] cursor-pointer"
                    >
                      {isMuted ? (
                        <VolumeX key="m-muted" className="w-3.5 h-3.5 text-[#B84C27]" aria-hidden="true" />
                      ) : (
                        <Volume2 key="m-unmuted" className="w-3.5 h-3.5 text-[#4B743B]" aria-hidden="true" />
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
}
