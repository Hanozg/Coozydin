import {
  CozyRoomState,
  FurnitureStyleDef,
  HouseExteriorConfig,
  LofiTrackId,
  RoomFurnitureId,
  WeatherType,
} from '../../types/game';

export interface CozyRoomViewProps {
  roomState: CozyRoomState;
  houseExterior: HouseExteriorConfig;
  lokmaPower: number;
  unlockedFurnitureStyles: string[];
  weather: WeatherType;
  lofiTrack: LofiTrackId;
  isMuted: boolean;
  musicEnabled: boolean;
  onChangeRoomState: (next: CozyRoomState) => void;
  onChangeHouseExterior: (next: HouseExteriorConfig) => void;
  onPurchaseFurnitureStyle: (item: FurnitureStyleDef) => boolean;
  onChangeWeather: (next: WeatherType) => void;
  onChangeLofiTrack: (next: LofiTrackId) => void;
  onToggleMute: () => void;
  onToggleMusic: () => void;
  onOpenAgenda: () => void;
  onExitHome: () => void;
}

export type NearbyRoomInteractable = {
  id: 'armchair' | 'desk' | 'turntable' | 'teatable' | 'bookshelf' | 'cat' | 'dog';
  label: string;
};

export type RoomDrawerTab =
  | 'furniture'
  | 'shop'
  | 'exterior'
  | 'avatar'
  | 'style'
  | 'pets'
  | 'atmosphere';

export type MobileRoomTab = 'room' | 'ambient';

export function detectSoftwareWebGL(): boolean {
  try {
    const probeCanvas = document.createElement('canvas');
    const gl = probeCanvas.getContext('webgl2');
    if (!gl) return true;
    const ext = gl.getExtension('WEBGL_debug_renderer_info');
    const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
    const gpu = String(gl.getParameter(param) || '');
    gl.getExtension('WEBGL_lose_context')?.loseContext();
    return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
  } catch {
    return false;
  }
}

export const SLOT_COORDS: Record<RoomFurnitureId, [number, number, number][]> = {
  armchair: [
    [-2.1, 0, -1.7],
    [1.9, 0, -1.8],
    [-2.0, 0, 1.8],
  ],
  desk: [
    [2.1, 0, -2.5],
    [-2.1, 0, -2.5],
    [2.5, 0, 1.2],
  ],
  bookshelf: [
    [-3.35, 0, -0.5],
    [-3.35, 0, 2.0],
    [0.2, 0, -3.35],
  ],
  rug: [
    [0, 0.02, 0.3],
    [-0.7, 0.02, 0.6],
    [0.7, 0.02, 0.6],
  ],
  plant: [
    [-3.1, 0, -3.0],
    [3.1, 0, 2.8],
    [-3.0, 0, 3.0],
  ],
  turntable: [
    [3.1, 0, -0.5],
    [-3.0, 0, 1.1],
    [1.8, 0, 2.8],
  ],
  teatable: [
    [-0.1, 0, 0.5],
    [-1.1, 0, -0.4],
    [0.9, 0, 0.8],
  ],
  wallart: [
    [0, 2.7, -3.72],
    [2.2, 2.7, -3.72],
    [-1.8, 2.7, -3.72],
  ],
};

export const SLOT_ROTATIONS: Record<RoomFurnitureId, number[]> = {
  armchair: [0.55, -0.55, 1.25],
  desk: [0, 0, -Math.PI / 2],
  bookshelf: [Math.PI / 2, Math.PI / 2, 0],
  rug: [0, 0.15, -0.15],
  plant: [0, 0.8, 1.6],
  turntable: [-Math.PI / 2, Math.PI / 2, Math.PI],
  teatable: [0, 0.4, -0.3],
  wallart: [0, 0, 0],
};

export const FURNITURE_RADII: Partial<Record<RoomFurnitureId, number>> = {
  armchair: 0.72,
  desk: 0.92,
  bookshelf: 0.65,
  plant: 0.48,
  turntable: 0.55,
  teatable: 0.62,
};

export function resolveFurnitureTransform(
  id: RoomFurnitureId,
  placement?: { slotIndex: number; x?: number; z?: number; rotY?: number }
): { x: number; y: number; z: number; rotY: number } {
  const coords = SLOT_COORDS[id];
  const rots = SLOT_ROTATIONS[id];
  const idx = (placement?.slotIndex ?? 0) % coords.length;
  const base = coords[idx];
  return {
    x: typeof placement?.x === 'number' ? placement.x : base[0],
    y: base[1],
    z: typeof placement?.z === 'number' ? placement.z : base[2],
    rotY: typeof placement?.rotY === 'number' ? placement.rotY : rots[idx % rots.length],
  };
}
