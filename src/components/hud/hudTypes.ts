import { TouchDriveInput } from '../EfelerCanvas';
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
  WeatherType,
} from '../../types/game';

export const TREAT_LABELS: Record<Exclude<HeldTreatType, 'none'>, string> = {
  coffee: '☕ Türk Kahvesi',
  simit: '🥨 Susamlı Simit',
  kumpir: '🥔 Sıcak Kumpir',
  keskek: '🥣 Aydın Keşkeği',
  icecream: '🍦 Cornet Dondurma',
};

export type HudDrawerType = 'none' | 'garage' | 'house' | 'atmosphere' | 'radio';

export type MobileDockTab = 'move' | 'view' | 'design';

export interface GameHUDProps {
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
  voiceGuideLandmark: LandmarkDef | null;
  voiceGuideLoading?: boolean;
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
  onToggleVoiceGuide: () => void;
  onStopVoiceGuide: () => void;
  onOpenJournal: () => void;
  onOpenRealMap: () => void;
  onJumpToLandmark: (landmark: LandmarkDef) => void;
  onOpenProfile: () => void;
  onOpenAbout: () => void;
  onEnterHome: () => void;
  onEnterAncientMuseum: () => void;
  onPause: () => void;
  onDiscoverNearby: () => void;
  onHorn: () => void;
  onChirp?: () => void;
  onTouchInput: (next: Partial<TouchDriveInput>) => void;
  onAdjustZoom: (delta: number) => void;
}
