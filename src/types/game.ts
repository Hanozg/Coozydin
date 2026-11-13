export type GamePhase = 'title' | 'playing' | 'paused';

export type VehicleType = 'car' | 'bicycle' | 'motorcycle';

export type PaintFinish = 'gloss' | 'matte';

export type TimeOfDay = 'morning' | 'noon' | 'golden' | 'evening';

export type SeasonType = 'spring' | 'summer' | 'autumn' | 'winter';

export type WeatherType = 'clear' | 'rain' | 'snow' | 'storm';

export type LofiTrackId = 'aegean' | 'rainy_piano' | 'night_lofi' | 'ambient_only';

export type CameraPreset = 'isometric' | 'close' | 'overview' | 'first_person' | 'perspective';

export type ExplorationMode = 'vehicle' | 'walk' | 'sparrow';

export type HeldTreatType = 'none' | 'coffee' | 'simit' | 'kumpir' | 'keskek' | 'icecream';

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

export type AvatarHairStyle = 'kasket' | 'short' | 'long' | 'bun';

export interface AvatarConfig {
  skinColor: string;
  shirtColor: string;
  pantsColor: string;
  hairStyle: AvatarHairStyle;
  hairColor: string;
}

export type HouseExteriorStyle =
  | 'cottage_villa'
  | 'modern_gable'
  | 'aegean_veranda'
  | 'twin_cottage';

export interface HouseExteriorConfig {
  style: HouseExteriorStyle;
  wallColor: string;
  roofColor: string;
  trimColor: string;
}

export interface FurnitureStyleDef {
  key: string; // e.g. 'armchair:mustard_velvet'
  furnitureId: RoomFurnitureId;
  styleId: string;
  name: string;
  description: string;
  priceLokma: number;
  accentHex: string;
}

export interface FurnitureSlotPlacement {
  id: RoomFurnitureId;
  enabled: boolean;
  slotIndex: number;
  x?: number;
  z?: number;
  rotY?: number;
  styleId?: string;
}

export interface CozyRoomState {
  wallColor: string;
  floorTone: 'oak' | 'pine' | 'stone';
  lampOn: boolean;
  petType: PetType;
  petAffection: number;
  avatarPlaced?: boolean;
  avatarConfig?: AvatarConfig;
  furniture: FurnitureSlotPlacement[];
}

export type GezginBadgeCategory = 'landmark' | 'errand';

export interface GezginBadgeDef {
  id: string;
  category: GezginBadgeCategory;
  targetId: string;
  title: string;
  subtitle: string;
  description: string;
  icon: string;
  accentColor: string;
}

export interface UserSavePayload {
  displayName: string;
  avatarEmoji: string;
  coins: number;
  lokmaPower: number;
  discoveredIds: string[];
  completedErrandIds: string[];
  chattedNpcIds: string[];
  unlockedFurnitureStyles: string[];
  vehicleConfig: VehicleConfig;
  houseExterior: HouseExteriorConfig;
  cozyRoomState: CozyRoomState;
  agendaNotes: AgendaNote[];
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

export interface NpcActionOption {
  id: string;
  label: string;
  cost: number;
  treat: HeldTreatType;
  startsWalk?: boolean;
  resultMessage: string;
}

export interface BuildingNpcDef {
  id: string;
  landmarkId: string;
  buildingName: string;
  name: string;
  role: string;
  position: [number, number];
  facingRad: number;
  shirtColor: string;
  pantsColor: string;
  hatStyle: 'cap' | 'headscarf' | 'chef' | 'none';
  hatColor: string;
  propType: 'icecream_cart' | 'simit_tray' | 'coffee_tray' | 'keskek_pot' | 'notebook' | 'none';
  greeting: string;
  walkChatLines?: string[];
  actions: NpcActionOption[];
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
  nearbyNpc: BuildingNpcDef | null;
  nearAncientSignpost: boolean;
  nearPlayerHome: boolean;
  nearbyStreetInteraction: NearbyStreetInteraction | null;
  vendorBubble: VendorBubbleScreenPos | null;
  distanceToActiveErrand: number | null;
  playerPos: [number, number];
  headingRad: number;
  companionName: string | null;
  heldTreat: HeldTreatType;
  solarClock?: string;
  sparrowState?: 'perched' | 'grounded' | 'flying';
  sparrowStamina?: number;
  isDancingZeybek?: boolean;
}

export interface RoofColliderMeta {
  cx: number;
  cz: number;
  halfW: number;
  halfD: number;
  wallTopY: number;
  peakH: number;
  ridgeAlongZ: boolean;
  rotY?: number;
}

export interface ColliderBox {
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
  maxY?: number;
  roof?: RoofColliderMeta;
}
