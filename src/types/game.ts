import type { TradeProfileState } from './trade';

export type GamePhase = 'title' | 'playing' | 'paused';

export type VehicleType = 'car' | 'bicycle' | 'motorcycle';

export type PaintFinish = 'gloss' | 'matte';

export type TimeOfDay = 'morning' | 'noon' | 'golden' | 'evening';

export type SeasonType = 'spring' | 'summer' | 'autumn' | 'winter';

export type WeatherType = 'clear' | 'rain' | 'snow' | 'storm';

export type LofiTrackId =
  | 'aegean'
  | 'bazaar_oud'
  | 'tralleis_echo'
  | 'aytepe_campus'
  | 'rainy_piano'
  | 'night_lofi'
  | 'ambient_only';

export interface RadioStationDef {
  id: LofiTrackId;
  frequency: string;
  label: string;
  region: string;
  mood: string;
  bpmLabel: string;
  accentColor: string;
  matchingDistricts: string[];
}

export type CameraPreset = 'isometric' | 'close' | 'overview' | 'first_person' | 'perspective';

export type ExplorationMode = 'vehicle' | 'walk' | 'sparrow';

export type HeldTreatType = 'none' | 'coffee' | 'simit' | 'kumpir' | 'keskek' | 'icecream';

export type StreetInteractionType = 'musicians' | 'lokma' | 'vendor' | 'guitar_band';

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
  discoveredMuseumIds: string[];
  completedErrandIds: string[];
  chattedNpcIds: string[];
  unlockedFurnitureStyles: string[];
  vehicleConfig: VehicleConfig;
  houseExterior: HouseExteriorConfig;
  cozyRoomState: CozyRoomState;
  agendaNotes: AgendaNote[];
  tradeProfile?: TradeProfileState;
}

export type MuseumSurfaceType = 'marble' | 'stone' | 'mosaic' | 'dirt' | 'crypt_stone';

export type CryptLightMode = 'torch' | 'flashlight';

export type AncientCityId =
  | 'tralleis'
  | 'magnesia'
  | 'nysa'
  | 'aphrodisias'
  | 'priene'
  | 'milet_didyma'
  | 'alinda_alabanda';

export interface AncientCitySkyTheme {
  zenithHex: number;
  horizonHex: number;
  groundHex: number;
  fogHex: number;
  fogDensity: number;
  sunColorHex: number;
  sunIntensity: number;
  sunPos: [number, number, number];
  hemiSkyHex: number;
  hemiGroundHex: number;
  godRayHex: number;
}

export interface AncientCityDef {
  id: AncientCityId;
  name: string;
  shortName: string;
  district: string;
  era: string;
  tagline: string;
  description: string;
  landmarkId?: string;
  spawnPos: [number, number, number];
  spawnYaw: number;
  defaultZoneName: string;
  plazaZoneName: string;
  westZoneName: string;
  eastZoneName: string;
  northZoneName: string;
  cryptZoneName: string;
  skyTheme: AncientCitySkyTheme;
}

export interface MuseumExhibitDef {
  id: string;
  cityId: AncientCityId;
  catalogCode: string;
  title: string;
  subtitle: string;
  period: string;
  zone: string;
  material: string;
  dimensions: string;
  position: [number, number, number];
  standPosition: [number, number, number];
  standRotationY: number;
  focusCameraPos: [number, number, number];
  focusLookAt: [number, number, number];
  shortDescription: string;
  historicalStory: string;
  architecturalNote: string;
  voiceNarrationText: string;
  rewardCoins: number;
}

export interface AncientMuseumHudSnapshot {
  zoneName: string;
  surfaceType: MuseumSurfaceType;
  inCrypt: boolean;
  cryptFactor: number;
  lightActive: boolean;
  lightMode: CryptLightMode;
  focusZoomActive: boolean;
  pointerLocked: boolean;
  nearbyExhibit: MuseumExhibitDef | null;
  activeExhibit: MuseumExhibitDef | null;
  playerElevation: number;
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
  skinColor?: string;
  hairColor?: string;
  hairStyle?: 'short' | 'bob' | 'waves' | 'bun';
  facialHair?: 'none' | 'mustache' | 'goatee' | 'full_beard';
  glasses?: boolean;
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
  elevationMeters?: number;
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

export type SandboxToolMode = 'buildings' | 'trees' | 'roads';

export type SandboxBuildingCategory = 'landmark' | 'player_home' | 'house' | 'custom_house';

export type SandboxCustomPropKind =
  | 'house'
  | 'sea_cove'
  | 'sand_beach'
  | 'sun_loungers'
  | 'beach_volleyball'
  | 'wooden_pier'
  | 'beach_cabana'
  | 'lifeguard_tower'
  | 'sailboat_surf';

export interface SandboxCustomHouseSpec {
  kind?: SandboxCustomPropKind;
  w: number;
  d: number;
  h: number;
  variant: number;
  label: string;
}

export interface SandboxPlacementEntry {
  id: string;
  x: number;
  z: number;
  rotY: number;
  customSpec?: SandboxCustomHouseSpec;
}

export interface SandboxBuildingSummary {
  id: string;
  label: string;
  category: SandboxBuildingCategory;
  x: number;
  z: number;
  rotY: number;
  defaultX: number;
  defaultZ: number;
  defaultRotY: number;
  isMoved: boolean;
  isCustom: boolean;
}

export type SandboxTreeKind = 'broadleaf' | 'pine' | 'palm';

export interface SandboxTreeSummary {
  id: string;
  kind: SandboxTreeKind;
  label: string;
  x: number;
  z: number;
  rotY: number;
  scale: number;
  isMoved: boolean;
  isCustom: boolean;
}

export interface SandboxTreeOverrideEntry {
  id: string;
  kind: SandboxTreeKind;
  x: number;
  z: number;
  rotY: number;
  scale: number;
  deleted?: boolean;
  isCustom?: boolean;
}

export type SandboxRoadSurface = 'asphalt' | 'cobble' | 'dirt' | 'gravel' | 'brick';

export interface SandboxRoadSummary {
  id: string;
  name: string;
  surface: SandboxRoadSurface;
  width: number;
  hasCenterLine: boolean;
  hasSidewalk: boolean;
  cornerRadius: number;
  pointCount: number;
  centerX: number;
  centerZ: number;
  isEdited: boolean;
  isCustom: boolean;
}

export interface SandboxRoadOverrideEntry {
  id: string;
  name: string;
  surface: SandboxRoadSurface;
  width: number;
  hasCenterLine: boolean;
  hasSidewalk?: boolean;
  cornerRadius?: number;
  points: [number, number][];
  deleted?: boolean;
  isCustom?: boolean;
}

export interface SandboxNewRoadSpec {
  name: string;
  surface: SandboxRoadSurface;
  width: number;
  hasCenterLine: boolean;
  hasSidewalk?: boolean;
  cornerRadius?: number;
  length: number;
}

export interface SandboxHudState {
  toolMode: SandboxToolMode;
  selectedId: string | null;
  selectedBuilding: SandboxBuildingSummary | null;
  selectedTreeId: string | null;
  selectedTree: SandboxTreeSummary | null;
  selectedRoadId: string | null;
  selectedRoadNodeIndex: number | null;
  selectedRoad: SandboxRoadSummary | null;
  autoRoundCorners: boolean;
  isDragging: boolean;
  onRoadWarning: boolean;
  gridSnap: boolean;
  movedCount: number;
  customCount: number;
  editedTreeCount: number;
  customTreeCount: number;
  deletedTreeCount: number;
  editedRoadCount: number;
  customRoadCount: number;
  canUndo: boolean;
  buildings: SandboxBuildingSummary[];
  roads: SandboxRoadSummary[];
}


