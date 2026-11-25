import { useMemo, useState } from 'react';
import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  Building2,
  Check,
  ChevronDown,
  ChevronUp,
  Grid,
  Home,
  Layers,
  Minus,
  Plus,
  RotateCcw,
  RotateCw,
  Route,
  Spline,
  Trash2,
  Trees,
  Umbrella,
  Undo2,
  X,
} from 'lucide-react';
import {
  SandboxBuildingCategory,
  SandboxCustomHouseSpec,
  SandboxHudState,
  SandboxNewRoadSpec,
  SandboxRoadSurface,
  SandboxToolMode,
  SandboxTreeKind,
} from '../types/game';

export const SANDBOX_HOUSE_PRESETS: SandboxCustomHouseSpec[] = [
  { kind: 'house', w: 6.0, d: 5.2, h: 4.4, variant: 0, label: 'Krem Ege Evi' },
  { kind: 'house', w: 6.2, d: 5.4, h: 5.3, variant: 2, label: 'Terakota Konak' },
  { kind: 'house', w: 5.8, d: 5.0, h: 4.2, variant: 3, label: 'Okr Bahçeli Ev' },
  { kind: 'house', w: 6.4, d: 5.2, h: 5.5, variant: 4, label: 'Adaçayı Köşk' },
  { kind: 'house', w: 5.8, d: 5.0, h: 4.5, variant: 5, label: 'Mavi Panjurlu Ev' },
];

export const SANDBOX_RESORT_PRESETS: Array<{
  spec: SandboxCustomHouseSpec;
  subtitle: string;
  swatchClass: string;
}> = [
  {
    spec: { kind: 'sea_cove', w: 16.0, d: 12.0, h: 0.45, variant: 0, label: 'Ege Denizi & Koy' },
    subtitle: '16×12m · Turkuaz deniz, köpüklü kıyı ve şamandıralar',
    swatchClass: 'bg-[#25B1CE] border-[#137491]',
  },
  {
    spec: { kind: 'sand_beach', w: 12.0, d: 10.0, h: 0.45, variant: 0, label: 'Altın Kumsal Alanı' },
    subtitle: '12×10m · Kumsal zemin, ahşap patika ve havlular',
    swatchClass: 'bg-[#EED49B] border-[#B99254]',
  },
  {
    spec: { kind: 'sun_loungers', w: 5.6, d: 4.4, h: 2.8, variant: 0, label: 'Şezlong & Plaj Şemsiyesi' },
    subtitle: '5.6×4.4m · Çift şezlong, çizgili şemsiye ve sehpa',
    swatchClass: 'bg-[#269EB3] border-[#196E7E]',
  },
  {
    spec: {
      kind: 'beach_volleyball',
      w: 14.0,
      d: 8.6,
      h: 2.7,
      variant: 0,
      label: 'Plaj Voleybol Sahası',
    },
    subtitle: '14×8.6m · Kum saha, file, hakem kulesi ve skorboard',
    swatchClass: 'bg-[#F2BF49] border-[#B68222]',
  },
  {
    spec: { kind: 'wooden_pier', w: 4.4, d: 12.0, h: 1.6, variant: 0, label: 'Ahşap Deniz İskelesi' },
    subtitle: '4.4×12m · Teak iskele, halatlı babalar ve deniz merdiveni',
    swatchClass: 'bg-[#B78554] border-[#774F2B]',
  },
  {
    spec: { kind: 'beach_cabana', w: 6.4, d: 5.4, h: 4.9, variant: 0, label: 'Plaj Barı & Hasır Kabana' },
    subtitle: '6.4×5.4m · Hasır çatılı sahil barı, tabureler ve fenerler',
    swatchClass: 'bg-[#D9B36C] border-[#9B7738]',
  },
  {
    spec: { kind: 'lifeguard_tower', w: 4.4, d: 4.4, h: 4.9, variant: 0, label: 'Cankurtaran Kulesi' },
    subtitle: '4.4×4.4m · Gözetleme kulesi, can simidi ve kurtarma tahtası',
    swatchClass: 'bg-[#D63C2B] border-[#962317]',
  },
  {
    spec: { kind: 'sailboat_surf', w: 6.0, d: 4.2, h: 4.8, variant: 0, label: 'Yelkenli Tekne & Sörf' },
    subtitle: '6×4.2m · Ege yelkenlisi ve renkli sörf tahtası standı',
    swatchClass: 'bg-[#1E4366] border-[#112A42]',
  },
];

export const SANDBOX_TREE_PRESETS: Array<{
  kind: SandboxTreeKind;
  label: string;
  subtitle: string;
}> = [
  { kind: 'broadleaf', label: 'Çınar / Zeytin Ağacı', subtitle: 'Mevsime göre yaprak değiştirir' },
  { kind: 'pine', label: 'Fıstık Çamı', subtitle: 'Dört mevsim yeşil Ege çamı' },
  { kind: 'palm', label: 'Bulvar Palmiyesi', subtitle: 'Aydın bulvarlarının simgesi' },
];

export const ROAD_SURFACE_OPTIONS: Array<{
  id: SandboxRoadSurface;
  label: string;
  shortLabel: string;
  subtitle: string;
  swatchClass: string;
}> = [
  {
    id: 'asphalt',
    label: 'Asfalt',
    shortLabel: 'Asfalt',
    subtitle: 'Bulvar & ana cadde',
    swatchClass: 'bg-[#464C54] border-[#2E3339]',
  },
  {
    id: 'cobble',
    label: 'Parke Taşı',
    shortLabel: 'Parke',
    subtitle: 'Tarihi Arnavut kaldırımı',
    swatchClass: 'bg-[#C4AE8D] border-[#8D7A5E]',
  },
  {
    id: 'dirt',
    label: 'Toprak Yol',
    shortLabel: 'Toprak',
    subtitle: 'Ege köy & bahçe yolu',
    swatchClass: 'bg-[#BD9564] border-[#8B6841]',
  },
  {
    id: 'gravel',
    label: 'Çakıl / Stabilize',
    shortLabel: 'Çakıl',
    subtitle: 'Kır & taşlık patika',
    swatchClass: 'bg-[#9E988D] border-[#6F6A61]',
  },
  {
    id: 'brick',
    label: 'Kilit Taşı',
    shortLabel: 'Kilit Taşı',
    subtitle: 'Terakota yürüyüş yolu',
    swatchClass: 'bg-[#B1624B] border-[#7E4130]',
  },
];

const ROAD_SURFACE_LABELS: Record<SandboxRoadSurface, string> = {
  asphalt: 'Asfalt',
  cobble: 'Parke Taşı',
  dirt: 'Toprak',
  gravel: 'Çakıl',
  brick: 'Kilit Taşı',
};

const ROAD_SURFACE_DOT_CLASS: Record<SandboxRoadSurface, string> = {
  asphalt: 'bg-[#464C54]',
  cobble: 'bg-[#C4AE8D]',
  dirt: 'bg-[#BD9564]',
  gravel: 'bg-[#9E988D]',
  brick: 'bg-[#B1624B]',
};

const CORNER_RADIUS_PRESETS: Array<{ value: number; label: string }> = [
  { value: 0, label: 'Keskin' },
  { value: 4, label: '4m' },
  { value: 8, label: '8m' },
  { value: 14, label: '14m' },
];

export const SANDBOX_ROAD_PRESETS: Array<{
  spec: SandboxNewRoadSpec;
  subtitle: string;
}> = [
  {
    spec: {
      name: 'Yeni Bulvar',
      surface: 'asphalt',
      width: 8.4,
      hasCenterLine: true,
      hasSidewalk: true,
      length: 36,
    },
    subtitle: '8.4m · Çift şeritli asfalt',
  },
  {
    spec: {
      name: 'Taş Sokak',
      surface: 'cobble',
      width: 6.6,
      hasCenterLine: false,
      hasSidewalk: true,
      length: 28,
    },
    subtitle: '6.6m · Arnavut kaldırımı',
  },
  {
    spec: {
      name: 'Toprak Köy Yolu',
      surface: 'dirt',
      width: 5.8,
      hasCenterLine: false,
      hasSidewalk: false,
      length: 34,
    },
    subtitle: '5.8m · Kaldırımsız doğal toprak',
  },
  {
    spec: {
      name: 'Çakıl Patika',
      surface: 'gravel',
      width: 5.4,
      hasCenterLine: false,
      hasSidewalk: false,
      length: 30,
    },
    subtitle: '5.4m · Stabilize kır yolu',
  },
  {
    spec: {
      name: 'Kilit Taşlı Cadde',
      surface: 'brick',
      width: 7.4,
      hasCenterLine: false,
      hasSidewalk: true,
      length: 32,
    },
    subtitle: '7.4m · Kırmızı kilit taşı',
  },
];

interface SandboxOverlayProps {
  state: SandboxHudState | null;
  onExitSandbox: () => void;
  onSetToolMode: (mode: SandboxToolMode) => void;
  onFocusBuilding: (id: string) => void;
  onDeselect: () => void;
  onRotateSelected: (deltaRad: number) => void;
  onNudgeSelected: (dx: number, dz: number) => void;
  onSpawnHouse: (spec: SandboxCustomHouseSpec) => void;
  onDeleteSelected: () => void;
  onResetSelected: () => void;
  onDeselectTree: () => void;
  onRotateSelectedTree: (deltaRad: number) => void;
  onScaleSelectedTree: (deltaScale: number) => void;
  onNudgeSelectedTree: (dx: number, dz: number) => void;
  onSpawnTree: (kind: SandboxTreeKind) => void;
  onDeleteSelectedTree: () => void;
  onResetSelectedTree: () => void;
  onFocusRoad: (id: string) => void;
  onDeselectRoad: () => void;
  onAdjustRoadWidth: (delta: number) => void;
  onSetRoadSurface: (surface: SandboxRoadSurface) => void;
  onToggleRoadSurface: () => void;
  onToggleRoadCenterLine: () => void;
  onToggleRoadSidewalk: () => void;
  onSetRoadCornerRadius: (radius: number) => void;
  onToggleAutoRoundCorners: () => void;
  onAppendRoadNode: () => void;
  onDeleteRoadNode: () => void;
  onSpawnRoad: (spec: SandboxNewRoadSpec) => void;
  onDeleteSelectedRoad: () => void;
  onResetSelectedRoad: () => void;
  onResetAll: () => void;
  onUndo: () => void;
  onToggleGridSnap: () => void;
  onAdjustZoom: (delta: number) => void;
}

const CATEGORY_LABELS: Record<SandboxBuildingCategory, string> = {
  player_home: 'Evim',
  landmark: 'Tarihi & Önemli Yapı',
  custom_house: 'Eklenen Model',
  house: 'Mahalle Evi',
};

export function SandboxOverlay({
  state,
  onExitSandbox,
  onSetToolMode,
  onFocusBuilding,
  onDeselect,
  onRotateSelected,
  onNudgeSelected,
  onSpawnHouse,
  onDeleteSelected,
  onResetSelected,
  onDeselectTree,
  onRotateSelectedTree,
  onScaleSelectedTree,
  onNudgeSelectedTree,
  onSpawnTree,
  onDeleteSelectedTree,
  onResetSelectedTree,
  onFocusRoad,
  onDeselectRoad,
  onAdjustRoadWidth,
  onSetRoadSurface,
  onToggleRoadSurface,
  onToggleRoadCenterLine,
  onToggleRoadSidewalk,
  onSetRoadCornerRadius,
  onToggleAutoRoundCorners,
  onAppendRoadNode,
  onDeleteRoadNode,
  onSpawnRoad,
  onDeleteSelectedRoad,
  onResetSelectedRoad,
  onResetAll,
  onUndo,
  onToggleGridSnap,
  onAdjustZoom,
}: SandboxOverlayProps) {
  const [dockCollapsed, setDockCollapsed] = useState(false);
  const [openPopover, setOpenPopover] = useState<
    'none' | 'buildings' | 'spawn_house' | 'spawn_tree' | 'roads' | 'spawn_road' | 'road_layers'
  >('none');
  const [libraryTab, setLibraryTab] = useState<'resort' | 'houses'>('resort');
  const [listFilter, setListFilter] = useState<'all' | 'landmarks' | 'houses'>('landmarks');
  const [confirmResetAll, setConfirmResetAll] = useState(false);

  const toolMode: SandboxToolMode = state?.toolMode ?? 'buildings';
  const selectedBuilding = state?.selectedBuilding ?? null;
  const selectedTree = state?.selectedTree ?? null;
  const selectedRoad = state?.selectedRoad ?? null;
  const selectedRoadNodeIndex = state?.selectedRoadNodeIndex ?? null;

  const movedCount = state?.movedCount ?? 0;
  const customCount = state?.customCount ?? 0;
  const editedTreeCount = state?.editedTreeCount ?? 0;
  const customTreeCount = state?.customTreeCount ?? 0;
  const deletedTreeCount = state?.deletedTreeCount ?? 0;
  const editedRoadCount = state?.editedRoadCount ?? 0;
  const customRoadCount = state?.customRoadCount ?? 0;

  const totalTreeEdits = editedTreeCount + customTreeCount + deletedTreeCount;
  const totalRoadEdits = editedRoadCount + customRoadCount;
  const hasAnyEdits =
    movedCount > 0 || customCount > 0 || totalTreeEdits > 0 || totalRoadEdits > 0;

  const gridSnap = state?.gridSnap ?? false;
  const autoRoundCorners = state?.autoRoundCorners ?? true;
  const canUndo = state?.canUndo ?? false;

  const filteredBuildings = useMemo(() => {
    const all = state?.buildings ?? [];
    if (listFilter === 'landmarks') {
      return all.filter((b) => b.category === 'landmark' || b.category === 'player_home');
    }
    if (listFilter === 'houses') {
      return all.filter((b) => b.category === 'custom_house' || b.category === 'house');
    }
    return all;
  }, [listFilter, state?.buildings]);

  const degAngle = selectedBuilding
    ? ((Math.round((selectedBuilding.rotY * 180) / Math.PI) % 360) + 360) % 360
    : 0;

  const handleSwitchMode = (mode: SandboxToolMode) => {
    setOpenPopover('none');
    onSetToolMode(mode);
  };

  return (
    <div className="absolute inset-0 z-20 pointer-events-none flex flex-col justify-between p-2.5 sm:p-4 md:p-5 pt-[max(0.65rem,env(safe-area-inset-top))] pb-[max(0.65rem,env(safe-area-inset-bottom))]">
      {/* Top Perimeter Row */}
      <div className="flex items-start justify-between gap-2 sm:gap-3">
        {/* Top-Left Exit CTA & 3-Mode Tool Switcher */}
        <div className="pointer-events-auto flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={onExitSandbox}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#C85A32] hover:bg-[#B24D27] border-2 border-[#FAF2E2]/80 text-[#FAF2E2] text-xs sm:text-sm font-semibold shadow-md transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Check className="w-4 h-4 shrink-0" aria-hidden="true" />
            <span>Keşfe Dön [B]</span>
          </button>

          {/* 3-Tab Segmented Editor Switcher */}
          <div
            role="tablist"
            aria-label="Sandbox Düzenleme Modu"
            className="inline-flex items-center gap-1 p-1 rounded-2xl bg-[#F7EEDC]/96 border-2 border-[#B99464] shadow-md"
          >
            <button
              type="button"
              role="tab"
              aria-selected={toolMode === 'buildings'}
              onClick={() => handleSwitchMode('buildings')}
              title="Binaları Düzenle (1)"
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                toolMode === 'buildings'
                  ? 'bg-[#8F5624] text-[#FAF2E2] shadow-sm'
                  : 'text-[#3A2618] hover:bg-[#EFE0C3]'
              }`}
            >
              <Building2 className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
              <span>Binalar</span>
            </button>

            <button
              type="button"
              role="tab"
              aria-selected={toolMode === 'trees'}
              onClick={() => handleSwitchMode('trees')}
              title="Ağaçları Düzenle (2)"
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                toolMode === 'trees'
                  ? 'bg-[#4E7A3D] text-[#FAF2E2] shadow-sm'
                  : 'text-[#3A2618] hover:bg-[#EFE0C3]'
              }`}
            >
              <Trees className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
              <span>Ağaçlar</span>
            </button>

            <button
              type="button"
              role="tab"
              aria-selected={toolMode === 'roads'}
              onClick={() => handleSwitchMode('roads')}
              title="Yolları Düzenle (3)"
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                toolMode === 'roads'
                  ? 'bg-[#5A544B] text-[#FAF2E2] shadow-sm'
                  : 'text-[#3A2618] hover:bg-[#EFE0C3]'
              }`}
            >
              <Route className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
              <span>Yollar</span>
            </button>
          </div>

          {/* Compact Edit Summary Chip (Desktop) */}
          <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#F7EEDC]/94 border border-[#B99464] text-[11px] text-[#5B432F] font-medium shadow-sm whitespace-nowrap">
            <span className="font-mono-num">{movedCount + customCount} bina</span>
            <span aria-hidden="true">·</span>
            <span className="font-mono-num">{totalTreeEdits} ağaç</span>
            <span aria-hidden="true">·</span>
            <span className="font-mono-num">{totalRoadEdits} yol</span>
          </div>
        </div>

        {/* Top-Right Contextual Lists & Add Menus */}
        <div className="pointer-events-auto flex flex-col items-end gap-2 shrink-0">
          {toolMode === 'buildings' && (
            <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-[#F7EEDC]/96 border-2 border-[#B99464] shadow-md">
              <button
                type="button"
                onClick={() =>
                  setOpenPopover((p) => (p === 'buildings' ? 'none' : 'buildings'))
                }
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  openPopover === 'buildings'
                    ? 'bg-[#8F5624] text-[#FAF2E2]'
                    : 'bg-[#EFE0C3] hover:bg-[#E4D1AE] text-[#3A2618]'
                }`}
              >
                <Building2 className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Liste</span>
              </button>

              <button
                type="button"
                onClick={() =>
                  setOpenPopover((p) => (p === 'spawn_house' ? 'none' : 'spawn_house'))
                }
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  openPopover === 'spawn_house'
                    ? 'bg-[#5D8A48] text-[#FAF2E2]'
                    : 'bg-[#EFE0C3] hover:bg-[#E4D1AE] text-[#3A2618]'
                }`}
              >
                <Plus className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Model Kütüphanesi</span>
              </button>
            </div>
          )}

          {toolMode === 'trees' && (
            <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-[#F7EEDC]/96 border-2 border-[#B99464] shadow-md">
              <button
                type="button"
                onClick={() =>
                  setOpenPopover((p) => (p === 'spawn_tree' ? 'none' : 'spawn_tree'))
                }
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  openPopover === 'spawn_tree'
                    ? 'bg-[#4E7A3D] text-[#FAF2E2]'
                    : 'bg-[#EFE0C3] hover:bg-[#E4D1AE] text-[#3A2618]'
                }`}
              >
                <Plus className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Yeni Ağaç Dik</span>
              </button>
            </div>
          )}

          {toolMode === 'roads' && (
            <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-[#F7EEDC]/96 border-2 border-[#B99464] shadow-md">
              <button
                type="button"
                onClick={() =>
                  setOpenPopover((p) => (p === 'road_layers' ? 'none' : 'road_layers'))
                }
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  openPopover === 'road_layers'
                    ? 'bg-[#8F5624] text-[#FAF2E2]'
                    : 'bg-[#EFE0C3] hover:bg-[#E4D1AE] text-[#3A2618]'
                }`}
              >
                <Layers className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Katmanlar</span>
              </button>

              <button
                type="button"
                onClick={() => setOpenPopover((p) => (p === 'roads' ? 'none' : 'roads'))}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  openPopover === 'roads'
                    ? 'bg-[#5A544B] text-[#FAF2E2]'
                    : 'bg-[#EFE0C3] hover:bg-[#E4D1AE] text-[#3A2618]'
                }`}
              >
                <Route className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Yol Listesi</span>
              </button>

              <button
                type="button"
                onClick={() =>
                  setOpenPopover((p) => (p === 'spawn_road' ? 'none' : 'spawn_road'))
                }
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  openPopover === 'spawn_road'
                    ? 'bg-[#5D8A48] text-[#FAF2E2]'
                    : 'bg-[#EFE0C3] hover:bg-[#E4D1AE] text-[#3A2618]'
                }`}
              >
                <Plus className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Yeni Yol Ekle</span>
              </button>
            </div>
          )}

          {/* Popover: Buildings List */}
          {openPopover === 'buildings' && (
            <div className="w-72 sm:w-80 rounded-2xl bg-[#F7EEDC] border-2 border-[#B99464] text-[#3A2618] shadow-xl overflow-hidden">
              <div className="px-3.5 py-2.5 border-b border-[#B99464]/40 bg-[#EFE0C3] flex items-center justify-between gap-2">
                <span className="text-xs font-display font-bold">Şehirdeki Binalar</span>
                <button
                  type="button"
                  onClick={() => setOpenPopover('none')}
                  aria-label="Listeyi Kapat"
                  className="p-1 rounded-lg hover:bg-[#E2D0AF] text-[#6B5038] cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="flex items-center gap-1 p-2 border-b border-[#B99464]/30 bg-[#FAF3E6]">
                {(
                  [
                    ['landmarks', 'Tarihi & Önemli'],
                    ['houses', 'Evler'],
                    ['all', 'Tümü'],
                  ] as const
                ).map(([key, label]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setListFilter(key)}
                    className={`flex-1 px-2 py-1 rounded-lg text-[11px] font-semibold transition-colors whitespace-nowrap cursor-pointer ${
                      listFilter === key
                        ? 'bg-[#8F5624] text-[#FAF2E2]'
                        : 'text-[#5B432F] hover:bg-[#EDE0C6]'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>

              <div className="max-h-64 overflow-y-auto efeler-scroll divide-y divide-[#B99464]/25">
                {filteredBuildings.map((b) => {
                  const isSel = b.id === state?.selectedId;
                  return (
                    <button
                      key={b.id}
                      type="button"
                      onClick={() => {
                        onFocusBuilding(b.id);
                        setOpenPopover('none');
                      }}
                      className={`w-full px-3.5 py-2 flex items-center justify-between gap-2 text-left transition-colors cursor-pointer ${
                        isSel ? 'bg-[#E8D5B3]' : 'hover:bg-[#EFE0C3]/70'
                      }`}
                    >
                      <div className="min-w-0">
                        <div className="text-xs font-semibold text-[#3A2618] truncate">
                          {b.label}
                        </div>
                        <div className="text-[10px] text-[#6B5038] font-medium">
                          {CATEGORY_LABELS[b.category]}
                          {b.isMoved && !b.isCustom ? ' · Taşındı' : ''}
                        </div>
                      </div>
                      <span className="text-[10px] font-mono-num text-[#8F5624] shrink-0">
                        {Math.round(b.x)}, {Math.round(b.z)}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Popover: Spawnable Model Library (Summer Resort & Aegean Houses) */}
          {openPopover === 'spawn_house' && (
            <div className="w-80 sm:w-[21.5rem] rounded-2xl bg-[#F7EEDC] border-2 border-[#B99464] text-[#3A2618] shadow-xl overflow-hidden">
              <div className="px-3.5 py-2.5 border-b border-[#B99464]/40 bg-[#EFE0C3] flex items-center justify-between gap-2">
                <span className="text-xs font-display font-bold">Model Kütüphanesi</span>
                <button
                  type="button"
                  onClick={() => setOpenPopover('none')}
                  aria-label="Kütüphaneyi Kapat"
                  className="p-1 rounded-lg hover:bg-[#E2D0AF] text-[#6B5038] cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Library Category Tabs */}
              <div className="flex items-center gap-1 p-2 border-b border-[#B99464]/30 bg-[#FAF3E6]">
                <button
                  type="button"
                  onClick={() => setLibraryTab('resort')}
                  className={`flex-1 inline-flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold transition-colors whitespace-nowrap cursor-pointer ${
                    libraryTab === 'resort'
                      ? 'bg-[#269EB3] text-[#FAF2E2]'
                      : 'text-[#5B432F] hover:bg-[#EDE0C6]'
                  }`}
                >
                  <Umbrella className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                  <span>Tatil &amp; Plaj ({SANDBOX_RESORT_PRESETS.length})</span>
                </button>
                <button
                  type="button"
                  onClick={() => setLibraryTab('houses')}
                  className={`flex-1 inline-flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold transition-colors whitespace-nowrap cursor-pointer ${
                    libraryTab === 'houses'
                      ? 'bg-[#8F5624] text-[#FAF2E2]'
                      : 'text-[#5B432F] hover:bg-[#EDE0C6]'
                  }`}
                >
                  <Home className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                  <span>Ege Evleri ({SANDBOX_HOUSE_PRESETS.length})</span>
                </button>
              </div>

              {libraryTab === 'resort' ? (
                <div className="p-2 space-y-1.5 max-h-[62vh] overflow-y-auto efeler-scroll">
                  {SANDBOX_RESORT_PRESETS.map(({ spec, subtitle, swatchClass }) => (
                    <button
                      key={spec.label}
                      type="button"
                      onClick={() => {
                        onSpawnHouse(spec);
                        setOpenPopover('none');
                      }}
                      className="w-full px-2.5 py-2 rounded-xl bg-[#FAF3E6] hover:bg-[#EFE0C3] border border-[#B99464]/45 flex items-center justify-between gap-2 text-left transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span
                          aria-hidden="true"
                          className={`w-6 h-6 rounded-lg border-2 shrink-0 shadow-inner ${swatchClass}`}
                        />
                        <div className="min-w-0">
                          <div className="text-xs font-semibold text-[#3A2618] truncate">
                            {spec.label}
                          </div>
                          <div className="text-[10px] text-[#6B5038] truncate mt-0.5">
                            {subtitle}
                          </div>
                        </div>
                      </div>
                      <span className="text-[11px] font-semibold text-[#1D7E91] shrink-0">
                        + Ekle
                      </span>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="p-2 space-y-1.5">
                  {SANDBOX_HOUSE_PRESETS.map((spec) => (
                    <button
                      key={spec.label}
                      type="button"
                      onClick={() => {
                        onSpawnHouse(spec);
                        setOpenPopover('none');
                      }}
                      className="w-full px-3 py-2 rounded-xl bg-[#FAF3E6] hover:bg-[#EFE0C3] border border-[#B99464]/45 flex items-center justify-between gap-2 text-left transition-colors cursor-pointer"
                    >
                      <span className="inline-flex items-center gap-2 text-xs font-semibold text-[#3A2618]">
                        <Home className="w-3.5 h-3.5 text-[#5D8A48] shrink-0" aria-hidden="true" />
                        <span>{spec.label}</span>
                      </span>
                      <span className="text-[11px] font-semibold text-[#5D8A48]">+ Ekle</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Popover: Spawn New Tree */}
          {openPopover === 'spawn_tree' && (
            <div className="w-72 rounded-2xl bg-[#F7EEDC] border-2 border-[#B99464] text-[#3A2618] shadow-xl overflow-hidden">
              <div className="px-3.5 py-2.5 border-b border-[#B99464]/40 bg-[#EFE0C3] flex items-center justify-between gap-2">
                <span className="text-xs font-display font-bold">Yeni Aydın Ağacı Dik</span>
                <button
                  type="button"
                  onClick={() => setOpenPopover('none')}
                  aria-label="Kapat"
                  className="p-1 rounded-lg hover:bg-[#E2D0AF] text-[#6B5038] cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="p-2 space-y-1.5">
                {SANDBOX_TREE_PRESETS.map((preset) => (
                  <button
                    key={preset.kind}
                    type="button"
                    onClick={() => {
                      onSpawnTree(preset.kind);
                      setOpenPopover('none');
                    }}
                    className="w-full px-3 py-2 rounded-xl bg-[#FAF3E6] hover:bg-[#EFE0C3] border border-[#B99464]/45 flex items-center justify-between gap-2 text-left transition-colors cursor-pointer"
                  >
                    <div className="min-w-0">
                      <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#3A2618]">
                        <Trees className="w-3.5 h-3.5 text-[#4E7A3D] shrink-0" aria-hidden="true" />
                        <span>{preset.label}</span>
                      </div>
                      <div className="text-[10px] text-[#6B5038] mt-0.5">{preset.subtitle}</div>
                    </div>
                    <span className="text-[11px] font-semibold text-[#4E7A3D] shrink-0">+ Dik</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Popover: Roads List */}
          {openPopover === 'roads' && (
            <div className="w-72 sm:w-80 rounded-2xl bg-[#F7EEDC] border-2 border-[#B99464] text-[#3A2618] shadow-xl overflow-hidden">
              <div className="px-3.5 py-2.5 border-b border-[#B99464]/40 bg-[#EFE0C3] flex items-center justify-between gap-2">
                <span className="text-xs font-display font-bold">
                  Şehir Yolları ({state?.roads.length ?? 0})
                </span>
                <button
                  type="button"
                  onClick={() => setOpenPopover('none')}
                  aria-label="Listeyi Kapat"
                  className="p-1 rounded-lg hover:bg-[#E2D0AF] text-[#6B5038] cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="max-h-72 overflow-y-auto efeler-scroll divide-y divide-[#B99464]/25">
                {(state?.roads ?? []).map((r) => {
                  const isSel = r.id === state?.selectedRoadId;
                  return (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => {
                        onFocusRoad(r.id);
                        setOpenPopover('none');
                      }}
                      className={`w-full px-3.5 py-2 flex items-center justify-between gap-2 text-left transition-colors cursor-pointer ${
                        isSel ? 'bg-[#E8D5B3]' : 'hover:bg-[#EFE0C3]/70'
                      }`}
                    >
                      <div className="min-w-0">
                        <div className="text-xs font-semibold text-[#3A2618] truncate">
                          {r.name}
                        </div>
                        <div className="text-[10px] text-[#6B5038] font-medium">
                          {ROAD_SURFACE_LABELS[r.surface]} · {r.width}m · {r.pointCount} nokta
                          {r.cornerRadius > 0 ? ` · R${r.cornerRadius}m` : ''}
                          {r.isCustom ? ' · Yeni' : r.isEdited ? ' · Düzenlendi' : ''}
                        </div>
                      </div>
                      <span className="text-[10px] font-semibold text-[#8F5624] shrink-0">
                        Odakla
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Popover: Road Layer Editor & Corner Rounding */}
          {openPopover === 'road_layers' && (
            <div className="w-80 sm:w-[21.5rem] rounded-2xl bg-[#F7EEDC] border-2 border-[#B99464] text-[#3A2618] shadow-xl overflow-hidden">
              <div className="px-3.5 py-2.5 border-b border-[#B99464]/40 bg-[#EFE0C3] flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <div className="text-xs font-display font-bold flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-[#8F5624] shrink-0" aria-hidden="true" />
                    <span>Yol Katman Düzenleyici</span>
                  </div>
                  {selectedRoad && (
                    <div className="text-[10px] text-[#6B5038] truncate mt-0.5">
                      {selectedRoad.name}
                    </div>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => setOpenPopover('none')}
                  aria-label="Katman Düzenleyiciyi Kapat"
                  className="p-1 rounded-lg hover:bg-[#E2D0AF] text-[#6B5038] cursor-pointer shrink-0"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="p-3 space-y-3 max-h-[70vh] overflow-y-auto efeler-scroll">
                {/* Global Auto-Rounding Switch */}
                <div className="px-3 py-2 rounded-xl bg-[#FAF3E6] border border-[#B99464]/45 flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <div className="text-xs font-semibold text-[#3A2618] flex items-center gap-1.5">
                      <Spline className="w-3.5 h-3.5 text-[#5D8A48] shrink-0" aria-hidden="true" />
                      <span>Otomatik Köşe Yuvarlatma</span>
                    </div>
                    <div className="text-[10px] text-[#6B5038] mt-0.5">
                      Yeni kıvrım eklerken virajları otomatik yumuşatır
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={onToggleAutoRoundCorners}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                      autoRoundCorners
                        ? 'bg-[#5D8A48] text-[#FAF2E2]'
                        : 'bg-[#E6D7BC] text-[#5B432F] hover:bg-[#DCC8A4]'
                    }`}
                  >
                    {autoRoundCorners ? 'Açık' : 'Kapalı'}
                  </button>
                </div>

                {!selectedRoad ? (
                  <div className="px-3 py-4 rounded-xl bg-[#FAF3E6] border border-dashed border-[#B99464]/65 text-center space-y-2">
                    <p className="text-xs font-semibold text-[#5B432F]">
                      Katmanlarını düzenlemek için haritadan bir yola tıklayın
                    </p>
                    <button
                      type="button"
                      onClick={() => setOpenPopover('roads')}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#EFE0C3] hover:bg-[#E2D0AF] border border-[#B99464]/60 text-xs font-semibold text-[#3A2618] cursor-pointer"
                    >
                      <Route className="w-3.5 h-3.5 text-[#8F5624]" aria-hidden="true" />
                      <span>Yol Listesinden Seç</span>
                    </button>
                  </div>
                ) : (
                  <>
                    {/* 1. Surface Texture Picker */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold uppercase tracking-wide text-[#6B5038]">
                          Yüzey Dokusu
                        </span>
                        <span className="text-[11px] font-semibold text-[#8F5624]">
                          {ROAD_SURFACE_LABELS[selectedRoad.surface]}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 gap-1.5">
                        {ROAD_SURFACE_OPTIONS.map((opt) => {
                          const isActive = selectedRoad.surface === opt.id;
                          return (
                            <button
                              key={opt.id}
                              type="button"
                              onClick={() => onSetRoadSurface(opt.id)}
                              className={`w-full px-2.5 py-2 rounded-xl border flex items-center justify-between gap-2.5 text-left transition-colors cursor-pointer ${
                                isActive
                                  ? 'bg-[#E9D7B7] border-[#8F5624] shadow-sm'
                                  : 'bg-[#FAF3E6] hover:bg-[#EFE0C3] border-[#B99464]/45'
                              }`}
                            >
                              <div className="flex items-center gap-2.5 min-w-0">
                                <span
                                  aria-hidden="true"
                                  className={`w-7 h-7 rounded-lg border-2 shrink-0 shadow-inner ${opt.swatchClass}`}
                                />
                                <div className="min-w-0">
                                  <div className="text-xs font-semibold text-[#3A2618] truncate">
                                    {opt.label}
                                  </div>
                                  <div className="text-[10px] text-[#6B5038] truncate">
                                    {opt.subtitle}
                                  </div>
                                </div>
                              </div>
                              {isActive && (
                                <span className="w-5 h-5 rounded-full bg-[#8F5624] text-[#FAF2E2] inline-flex items-center justify-center shrink-0">
                                  <Check className="w-3 h-3" aria-hidden="true" />
                                </span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* 2. Road Cross-Section Layers */}
                    <div className="space-y-1.5 pt-1 border-t border-[#B99464]/35">
                      <span className="text-[11px] font-bold uppercase tracking-wide text-[#6B5038]">
                        Yol Katmanları
                      </span>
                      <div className="grid grid-cols-2 gap-1.5">
                        <button
                          type="button"
                          onClick={onToggleRoadSidewalk}
                          className={`px-2.5 py-2 rounded-xl border text-xs font-semibold transition-colors cursor-pointer ${
                            selectedRoad.hasSidewalk
                              ? 'bg-[#5A544B] text-[#FAF2E2] border-[#5A544B]'
                              : 'bg-[#FAF3E6] hover:bg-[#EFE0C3] text-[#3A2618] border-[#B99464]/55'
                          }`}
                        >
                          Kaldırım: {selectedRoad.hasSidewalk ? 'Açık' : 'Yok'}
                        </button>
                        <button
                          type="button"
                          onClick={onToggleRoadCenterLine}
                          className={`px-2.5 py-2 rounded-xl border text-xs font-semibold transition-colors cursor-pointer ${
                            selectedRoad.hasCenterLine
                              ? 'bg-[#5A544B] text-[#FAF2E2] border-[#5A544B]'
                              : 'bg-[#FAF3E6] hover:bg-[#EFE0C3] text-[#3A2618] border-[#B99464]/55'
                          }`}
                        >
                          Orta Şerit: {selectedRoad.hasCenterLine ? 'Açık' : 'Yok'}
                        </button>
                      </div>
                    </div>

                    {/* 3. Corner Rounding Radius */}
                    <div className="space-y-2 pt-1 border-t border-[#B99464]/35">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold uppercase tracking-wide text-[#6B5038]">
                          Köşe Yuvarlatma Yarıçapı
                        </span>
                        <span className="text-xs font-mono-num font-bold text-[#8F5624]">
                          {selectedRoad.cornerRadius > 0
                            ? `${selectedRoad.cornerRadius.toFixed(1)}m`
                            : 'Keskin'}
                        </span>
                      </div>

                      <input
                        type="range"
                        min={0}
                        max={16}
                        step={0.5}
                        value={selectedRoad.cornerRadius}
                        onChange={(e) => onSetRoadCornerRadius(Number(e.target.value))}
                        aria-label="Köşe yuvarlatma yarıçapı"
                        className="w-full accent-[#8F5624] cursor-pointer"
                      />

                      <div className="grid grid-cols-4 gap-1">
                        {CORNER_RADIUS_PRESETS.map((preset) => {
                          const active = Math.abs(selectedRoad.cornerRadius - preset.value) < 0.25;
                          return (
                            <button
                              key={preset.value}
                              type="button"
                              onClick={() => onSetRoadCornerRadius(preset.value)}
                              className={`py-1 rounded-lg text-[11px] font-semibold font-mono-num transition-colors cursor-pointer ${
                                active
                                  ? 'bg-[#8F5624] text-[#FAF2E2]'
                                  : 'bg-[#EFE0C3] hover:bg-[#E2D0AF] text-[#3A2618]'
                              }`}
                            >
                              {preset.label}
                            </button>
                          );
                        })}
                      </div>

                      {selectedRoad.pointCount < 3 && (
                        <p className="text-[10px] text-[#7D5D3F]">
                          İpucu: Viraj oluşturmak için yol üzerindeki yeşil noktayı sürükleyerek kıvrım ekleyin.
                        </p>
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Popover: Spawn New Road */}
          {openPopover === 'spawn_road' && (
            <div className="w-72 rounded-2xl bg-[#F7EEDC] border-2 border-[#B99464] text-[#3A2618] shadow-xl overflow-hidden">
              <div className="px-3.5 py-2.5 border-b border-[#B99464]/40 bg-[#EFE0C3] flex items-center justify-between gap-2">
                <span className="text-xs font-display font-bold">Yeni Yol Oluştur</span>
                <button
                  type="button"
                  onClick={() => setOpenPopover('none')}
                  aria-label="Kapat"
                  className="p-1 rounded-lg hover:bg-[#E2D0AF] text-[#6B5038] cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="p-2 space-y-1.5">
                {SANDBOX_ROAD_PRESETS.map(({ spec, subtitle }) => (
                  <button
                    key={spec.name}
                    type="button"
                    onClick={() => {
                      onSpawnRoad(spec);
                      setOpenPopover('none');
                    }}
                    className="w-full px-3 py-2 rounded-xl bg-[#FAF3E6] hover:bg-[#EFE0C3] border border-[#B99464]/45 flex items-center justify-between gap-2 text-left transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span
                        aria-hidden="true"
                        className={`w-3.5 h-3.5 rounded-full shrink-0 border border-[#3A2618]/25 ${ROAD_SURFACE_DOT_CLASS[spec.surface]}`}
                      />
                      <div className="min-w-0">
                        <div className="text-xs font-semibold text-[#3A2618] truncate">
                          {spec.name}
                        </div>
                        <div className="text-[10px] text-[#6B5038] mt-0.5 truncate">{subtitle}</div>
                      </div>
                    </div>
                    <span className="text-[11px] font-semibold text-[#5D8A48] shrink-0">+ Ekle</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Center-Top Subtle Road Overlap Notice (Only while dragging a building or tree over a road) */}
      {state?.isDragging && state.onRoadWarning && toolMode !== 'roads' && (
        <div className="self-center pointer-events-none">
          <div className="px-3.5 py-1.5 rounded-xl bg-[#9E351B] border border-[#F5D79E]/75 text-[#FAF2E2] text-xs font-semibold shadow-lg">
            Ana yol üzerindesiniz — isterseniz yine de yerleştirebilirsiniz
          </div>
        </div>
      )}

      {/* Bottom Collapsible Unified Sandbox Control Dock */}
      <div className="flex flex-col items-center gap-1.5">
        {dockCollapsed ? (
          <button
            type="button"
            onClick={() => setDockCollapsed(false)}
            className="pointer-events-auto inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#F7EEDC]/96 border-2 border-[#B99464] text-[#3A2618] text-xs font-semibold shadow-md cursor-pointer"
          >
            <ChevronUp className="w-3.5 h-3.5 text-[#8F5624]" aria-hidden="true" />
            <span>Sandbox Kontrolleri</span>
          </button>
        ) : (
          <div className="pointer-events-auto flex flex-col items-center gap-1.5 max-w-[96vw]">
            {/* 1. Selected Building Action Strip */}
            {toolMode === 'buildings' && selectedBuilding && (
              <div className="flex flex-wrap items-center justify-center gap-1.5 px-3 py-2 rounded-2xl bg-[#F7EEDC]/97 border-2 border-[#B99464] text-[#3A2618] shadow-lg">
                <div className="pr-2 mr-0.5 border-r border-[#B99464]/45 min-w-0">
                  <div className="text-xs font-display font-bold truncate max-w-[180px] sm:max-w-[220px]">
                    {selectedBuilding.label}
                  </div>
                  <div className="text-[10px] text-[#6B5038] font-mono-num">
                    X: {selectedBuilding.x} · Z: {selectedBuilding.z} · {degAngle}°
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => onRotateSelected(-Math.PI / 4)}
                  title="Sola 45° Döndür (Shift+R)"
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-[#EFE0C3] hover:bg-[#E2D0AF] border border-[#B99464]/60 text-xs font-semibold transition-colors cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-[#8F5624]" aria-hidden="true" />
                  <span>-45°</span>
                </button>
                <button
                  type="button"
                  onClick={() => onRotateSelected(Math.PI / 4)}
                  title="Sağa 45° Döndür (R)"
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-[#EFE0C3] hover:bg-[#E2D0AF] border border-[#B99464]/60 text-xs font-semibold transition-colors cursor-pointer"
                >
                  <RotateCw className="w-3.5 h-3.5 text-[#8F5624]" aria-hidden="true" />
                  <span>+45°</span>
                </button>

                <div className="hidden sm:inline-flex items-center gap-0.5 px-1 py-0.5 rounded-xl bg-[#EFE0C3] border border-[#B99464]/50">
                  <button
                    type="button"
                    onClick={() => onNudgeSelected(-1.5, 0)}
                    aria-label="Batıya Kaydır"
                    className="p-1 rounded-lg hover:bg-[#E2D0AF] text-[#5B432F] cursor-pointer"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onNudgeSelected(0, -1.5)}
                    aria-label="Kuzeye Kaydır"
                    className="p-1 rounded-lg hover:bg-[#E2D0AF] text-[#5B432F] cursor-pointer"
                  >
                    <ArrowUp className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onNudgeSelected(0, 1.5)}
                    aria-label="Güneye Kaydır"
                    className="p-1 rounded-lg hover:bg-[#E2D0AF] text-[#5B432F] cursor-pointer"
                  >
                    <ArrowDown className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onNudgeSelected(1.5, 0)}
                    aria-label="Doğuya Kaydır"
                    className="p-1 rounded-lg hover:bg-[#E2D0AF] text-[#5B432F] cursor-pointer"
                  >
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                {selectedBuilding.isCustom ? (
                  <button
                    type="button"
                    onClick={onDeleteSelected}
                    title="Bu Eklenen Evi Sil (Delete)"
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-[#B83B24] hover:bg-[#9E311D] text-[#FAF2E2] text-xs font-semibold transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>Sil</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={onResetSelected}
                    disabled={!selectedBuilding.isMoved}
                    title="Seçili Binayı Orijinal Yerine Al"
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-[#EFE0C3] hover:bg-[#E2D0AF] disabled:opacity-45 border border-[#B99464]/60 text-xs font-semibold transition-colors cursor-pointer disabled:cursor-not-allowed"
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-[#B84C27]" aria-hidden="true" />
                    <span>Eski Yeri</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={onDeselect}
                  aria-label="Seçimi Kaldır"
                  className="p-1.5 rounded-xl hover:bg-[#E2D0AF] text-[#6B5038] cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* 2. Selected Tree Action Strip */}
            {toolMode === 'trees' && selectedTree && (
              <div className="flex flex-wrap items-center justify-center gap-1.5 px-3 py-2 rounded-2xl bg-[#F7EEDC]/97 border-2 border-[#4E7A3D] text-[#3A2618] shadow-lg">
                <div className="pr-2 mr-0.5 border-r border-[#B99464]/45 min-w-0">
                  <div className="text-xs font-display font-bold truncate max-w-[180px]">
                    {selectedTree.label}
                  </div>
                  <div className="text-[10px] text-[#6B5038] font-mono-num">
                    X: {selectedTree.x} · Z: {selectedTree.z} · {selectedTree.scale.toFixed(2)}x
                  </div>
                </div>

                {/* Scale Controls */}
                <div className="inline-flex items-center gap-0.5 px-1 py-0.5 rounded-xl bg-[#EFE0C3] border border-[#B99464]/60">
                  <button
                    type="button"
                    onClick={() => onScaleSelectedTree(-0.15)}
                    title="Ağacı Küçült (-)"
                    className="p-1 rounded-lg hover:bg-[#E2D0AF] text-[#3A2618] cursor-pointer"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="text-[11px] font-semibold text-[#5B432F] px-1">Boyut</span>
                  <button
                    type="button"
                    onClick={() => onScaleSelectedTree(0.15)}
                    title="Ağacı Büyüt (+)"
                    className="p-1 rounded-lg hover:bg-[#E2D0AF] text-[#3A2618] cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Rotate Controls */}
                <button
                  type="button"
                  onClick={() => onRotateSelectedTree(Math.PI / 4)}
                  title="45° Döndür (R)"
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-[#EFE0C3] hover:bg-[#E2D0AF] border border-[#B99464]/60 text-xs font-semibold transition-colors cursor-pointer"
                >
                  <RotateCw className="w-3.5 h-3.5 text-[#4E7A3D]" aria-hidden="true" />
                  <span>+45°</span>
                </button>

                {/* Fine Nudge */}
                <div className="hidden sm:inline-flex items-center gap-0.5 px-1 py-0.5 rounded-xl bg-[#EFE0C3] border border-[#B99464]/50">
                  <button
                    type="button"
                    onClick={() => onNudgeSelectedTree(-1.0, 0)}
                    aria-label="Batıya Kaydır"
                    className="p-1 rounded-lg hover:bg-[#E2D0AF] text-[#5B432F] cursor-pointer"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onNudgeSelectedTree(0, -1.0)}
                    aria-label="Kuzeye Kaydır"
                    className="p-1 rounded-lg hover:bg-[#E2D0AF] text-[#5B432F] cursor-pointer"
                  >
                    <ArrowUp className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onNudgeSelectedTree(0, 1.0)}
                    aria-label="Güneye Kaydır"
                    className="p-1 rounded-lg hover:bg-[#E2D0AF] text-[#5B432F] cursor-pointer"
                  >
                    <ArrowDown className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onNudgeSelectedTree(1.0, 0)}
                    aria-label="Doğuya Kaydır"
                    className="p-1 rounded-lg hover:bg-[#E2D0AF] text-[#5B432F] cursor-pointer"
                  >
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                {!selectedTree.isCustom && (
                  <button
                    type="button"
                    onClick={onResetSelectedTree}
                    disabled={!selectedTree.isMoved}
                    title="Ağacı Orijinal Yerine Al"
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-[#EFE0C3] hover:bg-[#E2D0AF] disabled:opacity-45 border border-[#B99464]/60 text-xs font-semibold transition-colors cursor-pointer disabled:cursor-not-allowed"
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-[#8F5624]" aria-hidden="true" />
                    <span>Eski Yeri</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={onDeleteSelectedTree}
                  title="Bu Ağacı Kaldır (Delete)"
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-[#B83B24] hover:bg-[#9E311D] text-[#FAF2E2] text-xs font-semibold transition-colors cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Sil</span>
                </button>

                <button
                  type="button"
                  onClick={onDeselectTree}
                  aria-label="Seçimi Kaldır"
                  className="p-1.5 rounded-xl hover:bg-[#E2D0AF] text-[#6B5038] cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* 3. Selected Road Action Strip */}
            {toolMode === 'roads' && selectedRoad && (
              <div className="flex flex-wrap items-center justify-center gap-1.5 px-3 py-2 rounded-2xl bg-[#F7EEDC]/97 border-2 border-[#5A544B] text-[#3A2618] shadow-lg">
                <div className="pr-2 mr-0.5 border-r border-[#B99464]/45 min-w-0">
                  <div className="text-xs font-display font-bold truncate max-w-[190px] sm:max-w-[230px]">
                    {selectedRoad.name}
                  </div>
                  <div className="text-[10px] text-[#6B5038] font-mono-num">
                    {selectedRoad.pointCount} nokta
                    {selectedRoadNodeIndex !== null ? ` · P${selectedRoadNodeIndex + 1} seçili` : ''}
                  </div>
                </div>

                {/* Width Controls */}
                <div className="inline-flex items-center gap-0.5 px-1 py-0.5 rounded-xl bg-[#EFE0C3] border border-[#B99464]/60">
                  <button
                    type="button"
                    onClick={() => onAdjustRoadWidth(-0.8)}
                    title="Yolu Daralt (-)"
                    className="p-1 rounded-lg hover:bg-[#E2D0AF] text-[#3A2618] cursor-pointer"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="text-[11px] font-mono-num font-semibold text-[#3A2618] px-1">
                    {selectedRoad.width.toFixed(1)}m
                  </span>
                  <button
                    type="button"
                    onClick={() => onAdjustRoadWidth(0.8)}
                    title="Yolu Genişlet (+)"
                    className="p-1 rounded-lg hover:bg-[#E2D0AF] text-[#3A2618] cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Layer Editor / Surface Quick Trigger */}
                <button
                  type="button"
                  onClick={() =>
                    setOpenPopover((p) => (p === 'road_layers' ? 'none' : 'road_layers'))
                  }
                  onContextMenu={(e) => {
                    e.preventDefault();
                    onToggleRoadSurface();
                  }}
                  title="Yüzey Dokusu ve Katman Düzenleyiciyi Aç"
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs font-semibold transition-colors whitespace-nowrap cursor-pointer ${
                    openPopover === 'road_layers'
                      ? 'bg-[#8F5624] text-[#FAF2E2] border-[#8F5624]'
                      : 'bg-[#EFE0C3] hover:bg-[#E2D0AF] text-[#3A2618] border-[#B99464]/60'
                  }`}
                >
                  <span
                    aria-hidden="true"
                    className={`w-2.5 h-2.5 rounded-full border border-white/60 shrink-0 ${ROAD_SURFACE_DOT_CLASS[selectedRoad.surface]}`}
                  />
                  <span>{ROAD_SURFACE_LABELS[selectedRoad.surface]}</span>
                </button>

                {/* Quick Corner Rounding Toggle */}
                <button
                  type="button"
                  onClick={() =>
                    onSetRoadCornerRadius(selectedRoad.cornerRadius > 0.25 ? 0 : 8)
                  }
                  title="Köşe Yuvarlatmayı Aç/Kapat (Detay için Katmanlar)"
                  className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl border text-xs font-semibold transition-colors whitespace-nowrap cursor-pointer ${
                    selectedRoad.cornerRadius > 0.25
                      ? 'bg-[#5D8A48] text-[#FAF2E2] border-[#5D8A48]'
                      : 'bg-[#EFE0C3] hover:bg-[#E2D0AF] text-[#3A2618] border-[#B99464]/60'
                  }`}
                >
                  <Spline className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                  <span className="font-mono-num">
                    {selectedRoad.cornerRadius > 0.25
                      ? `Yuvarlat: ${selectedRoad.cornerRadius.toFixed(0)}m`
                      : 'Köşe: Keskin'}
                  </span>
                </button>

                {/* Center Line Toggle */}
                <button
                  type="button"
                  onClick={onToggleRoadCenterLine}
                  title="Orta Yol Şeridini Aç/Kapat"
                  className={`hidden sm:inline-flex px-2.5 py-1.5 rounded-xl border text-xs font-semibold transition-colors whitespace-nowrap cursor-pointer ${
                    selectedRoad.hasCenterLine
                      ? 'bg-[#5A544B] text-[#FAF2E2] border-[#5A544B]'
                      : 'bg-[#EFE0C3] hover:bg-[#E2D0AF] text-[#3A2618] border-[#B99464]/60'
                  }`}
                >
                  Şerit: {selectedRoad.hasCenterLine ? 'Açık' : 'Kapalı'}
                </button>

                {/* Extend / Delete Node */}
                <button
                  type="button"
                  onClick={onAppendRoadNode}
                  title="Yolun Ucuna Yeni Nokta Ekle"
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-[#5D8A48] hover:bg-[#4F783D] text-[#FAF2E2] text-xs font-semibold transition-colors whitespace-nowrap cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Uzat</span>
                </button>

                <button
                  type="button"
                  onClick={onDeleteRoadNode}
                  disabled={selectedRoad.pointCount <= 2}
                  title="Seçili Yol Noktasını Sil (Delete)"
                  className="px-2.5 py-1.5 rounded-xl bg-[#EFE0C3] hover:bg-[#E2D0AF] disabled:opacity-40 border border-[#B99464]/60 text-xs font-semibold transition-colors whitespace-nowrap cursor-pointer disabled:cursor-not-allowed"
                >
                  Noktayı Sil
                </button>

                {!selectedRoad.isCustom && (
                  <button
                    type="button"
                    onClick={onResetSelectedRoad}
                    disabled={!selectedRoad.isEdited}
                    title="Bu Yolu Orijinal Haline Döndür"
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-[#EFE0C3] hover:bg-[#E2D0AF] disabled:opacity-45 border border-[#B99464]/60 text-xs font-semibold transition-colors whitespace-nowrap cursor-pointer disabled:cursor-not-allowed"
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-[#8F5624]" aria-hidden="true" />
                    <span>Eski Hali</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={onDeleteSelectedRoad}
                  title="Bu Yolu Tamamen Sil"
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-[#B83B24] hover:bg-[#9E311D] text-[#FAF2E2] text-xs font-semibold transition-colors whitespace-nowrap cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Yolu Sil</span>
                </button>

                <button
                  type="button"
                  onClick={onDeselectRoad}
                  aria-label="Seçimi Kaldır"
                  className="p-1.5 rounded-xl hover:bg-[#E2D0AF] text-[#6B5038] cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* Main Sandbox Utility Dock */}
            <div className="flex flex-wrap items-center justify-center gap-1.5 px-3 py-2 rounded-2xl bg-[#F7EEDC]/96 border-2 border-[#B99464] text-[#3A2618] shadow-xl">
              <button
                type="button"
                onClick={onToggleGridSnap}
                title="2m Izgara Kilidi Aç/Kapat (G)"
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors whitespace-nowrap cursor-pointer ${
                  gridSnap
                    ? 'bg-[#5D8A48] text-[#FAF2E2]'
                    : 'bg-[#EFE0C3] hover:bg-[#E2D0AF] text-[#3A2618] border border-[#B99464]/55'
                }`}
              >
                <Grid className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Izgara 2m: {gridSnap ? 'Açık' : 'Kapalı'}</span>
              </button>

              <button
                type="button"
                onClick={onUndo}
                disabled={!canUndo}
                title="Son Hamleyi Geri Al (Ctrl+Z)"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#EFE0C3] hover:bg-[#E2D0AF] disabled:opacity-45 border border-[#B99464]/55 text-xs font-semibold text-[#3A2618] transition-colors whitespace-nowrap cursor-pointer disabled:cursor-not-allowed"
              >
                <Undo2 className="w-3.5 h-3.5 text-[#8F5624]" aria-hidden="true" />
                <span>Geri Al</span>
              </button>

              <div className="inline-flex items-center gap-0.5 px-1 py-0.5 rounded-xl bg-[#EFE0C3] border border-[#B99464]/55">
                <button
                  type="button"
                  onClick={() => onAdjustZoom(-0.18)}
                  title="Uzaklaştır"
                  className="px-2 py-1 rounded-lg hover:bg-[#E2D0AF] text-xs font-bold text-[#3A2618] cursor-pointer"
                >
                  −
                </button>
                <span className="text-[11px] font-medium text-[#6B5038] px-1">Yakınlık</span>
                <button
                  type="button"
                  onClick={() => onAdjustZoom(0.18)}
                  title="Yakınlaştır"
                  className="px-2 py-1 rounded-lg hover:bg-[#E2D0AF] text-xs font-bold text-[#3A2618] cursor-pointer"
                >
                  +
                </button>
              </div>

              {confirmResetAll ? (
                <div className="inline-flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => {
                      onResetAll();
                      setConfirmResetAll(false);
                    }}
                    className="px-3 py-1.5 rounded-xl bg-[#B83B24] hover:bg-[#9E311D] text-[#FAF2E2] text-xs font-semibold whitespace-nowrap cursor-pointer"
                  >
                    Eminim, Sıfırla
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmResetAll(false)}
                    className="px-2.5 py-1.5 rounded-xl bg-[#EFE0C3] hover:bg-[#E2D0AF] text-xs font-semibold text-[#3A2618] cursor-pointer"
                  >
                    Vazgeç
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setConfirmResetAll(true)}
                  disabled={!hasAnyEdits}
                  title="Tüm Bina, Ağaç ve Yolları Orijinal Efeler Düzenine Döndür"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#EFE0C3] hover:bg-[#E2D0AF] disabled:opacity-45 border border-[#B99464]/55 text-xs font-semibold text-[#9E351B] transition-colors whitespace-nowrap cursor-pointer disabled:cursor-not-allowed"
                >
                  <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Şehri Sıfırla</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => setDockCollapsed(true)}
                aria-label="Kontrolleri Gizle"
                title="Gizle"
                className="p-1.5 rounded-xl hover:bg-[#E2D0AF] text-[#6B5038] cursor-pointer"
              >
                <ChevronDown className="w-4 h-4" />
              </button>
            </div>

            {/* Mode-Specific Single-Line Controls Legend */}
            <div className="hidden md:flex items-center gap-2.5 px-3 py-1 rounded-xl bg-[#3A2618]/84 text-[#F7EEDC] text-[11px] font-medium">
              {toolMode === 'buildings' && (
                <>
                  <span>Binaya Tıkla & Sürükle: Taşı</span>
                  <span aria-hidden="true">·</span>
                  <span>R: 45° Döndür</span>
                  <span aria-hidden="true">·</span>
                  <span>Boşluğa Sürükle / WASD: Kamera</span>
                  <span aria-hidden="true">·</span>
                  <span>1-2-3: Mod Değiştir</span>
                </>
              )}
              {toolMode === 'trees' && (
                <>
                  <span>Ağaca Tıkla & Sürükle: Taşı</span>
                  <span aria-hidden="true">·</span>
                  <span>+ / -: Boyut</span>
                  <span aria-hidden="true">·</span>
                  <span>R: Döndür</span>
                  <span aria-hidden="true">·</span>
                  <span>Delete: Sil</span>
                  <span aria-hidden="true">·</span>
                  <span>1-2-3: Mod Değiştir</span>
                </>
              )}
              {toolMode === 'roads' && (
                <>
                  <span>Yola Tıkla: Seç</span>
                  <span aria-hidden="true">·</span>
                  <span>Sarı Nokta Sürükle: Güzergâhı Değiştir</span>
                  <span aria-hidden="true">·</span>
                  <span>Yeşil Nokta: Yeni Kıvrım Ekle</span>
                  <span aria-hidden="true">·</span>
                  <span>+ / -: Genişlik</span>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
