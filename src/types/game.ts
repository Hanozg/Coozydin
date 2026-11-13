export type GamePhase = 'title' | 'playing' | 'paused';

export type VehicleType = 'car' | 'bicycle' | 'motorcycle';

export type PaintFinish = 'gloss' | 'matte';

export type TimeOfDay = 'morning' | 'noon' | 'golden' | 'evening';

export type WeatherType = 'clear' | 'rain' | 'snow' | 'storm';

export type LofiTrackId = 'aegean' | 'rainy_piano' | 'night_lofi' | 'ambient_only';

export type CameraPreset = 'isometric' | 'close' | 'overview';

export type StreetInteractionType = 'musicians' | 'lokma' | 'vendor';

export type PetType = 'cat' | 'dog' | 'both';

export type RoomFurnitureId =
  | 'armchair'
  | 'desk'
  | 'bookshelf'
  | 'rug'
  | 'plant'
  | 'turntable'
  | 'teatable'
  | 'wallart';

export interface FurnitureSlotPlacement {
  id: RoomFurnitureId;
  enabled: boolean;
  slotIndex: number;
}

export interface CozyRoomState {
  wallColor: string;
  floorTone: 'oak' | 'pine' | 'stone';
  lampOn: boolean;
  petType: PetType;
  petAffection: number;
  furniture: FurnitureSlotPlacement[];
}

export interface AgendaNote {
  id: string;
  dateKey: string; // YYYY-MM-DD
  text: string;
  done: boolean;
}

export interface VehicleConfig {
  type: VehicleType;
  color: string;
  finish: PaintFinish;
  accentColor: string;
  hasAccessory: boolean;
  hasStripe: boolean;
}

export interface LandmarkDef {
  id: string;
  name: string;
  era: string;
  district: string;
  position: [number, number, number];
  interactionRadius: number;
  summary: string;
  architectureNote: string;
  rewardCoins: number;
  doorPosition?: [number, number];
}

export interface ErrandDef {
  id: string;
  title: string;
  fromLandmarkId: string;
  toLandmarkId: string;
  description: string;
  rewardCoins: number;
}

export interface DistrictZone {
  id: string;
  name: string;
  subtitle: string;
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
}

export interface VendorBubbleScreenPos {
  x: number;
  y: number;
  visible: boolean;
  text: string;
}

export interface NearbyStreetInteraction {
  type: StreetInteractionType;
  label: string;
}

export interface PlayerHudSnapshot {
  speedKmh: number;
  currentDistrict: string;
  currentStreet: string;
  nearbyLandmark: LandmarkDef | null;
  nearAncientSignpost: boolean;
  nearPlayerHome: boolean;
  nearbyStreetInteraction: NearbyStreetInteraction | null;
  vendorBubble: VendorBubbleScreenPos | null;
  distanceToActiveErrand: number | null;
  playerPos: [number, number];
  headingRad: number;
}

export interface ColliderBox {
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
}
