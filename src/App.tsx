import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { AgendaModal } from './components/AgendaModal';
import { CozyRoomView } from './components/CozyRoomView';
import { EfelerCanvas, EfelerCanvasHandle, TouchDriveInput } from './components/EfelerCanvas';
import { ErrorBoundary } from './components/ErrorBoundary';
import { GameHUD } from './components/GameHUD';
import { JournalModal } from './components/JournalModal';
import { NpcDialogueModal } from './components/NpcDialogueModal';
import { PauseModal } from './components/PauseModal';
import { ProfileModal } from './components/ProfileModal';
import { RealAydinMapModal } from './components/RealAydinMapModal';
import { TitleScreen } from './components/TitleScreen';
import {
  DEFAULT_AVATAR_CONFIG,
  DEFAULT_COZY_ROOM_STATE,
  DEFAULT_HOUSE_EXTERIOR,
  DEFAULT_UNLOCKED_FURNITURE_STYLES,
  DEFAULT_VEHICLE_CONFIG,
  LANDMARKS,
} from './data/efelerData';
import { audioEngine } from './game/audioEngine';
import { auth } from './services/firebase';
import {
  loadCloudProfile,
  loadLocalSavePayload,
  sanitizeUserSavePayload,
  saveCloudProfile,
  saveLocalSavePayload,
} from './services/profileService';
import {
  AgendaNote,
  BuildingNpcDef,
  CameraPreset,
  CozyRoomState,
  ErrandDef,
  ExplorationMode,
  FurnitureStyleDef,
  GamePhase,
  HouseExteriorConfig,
  LandmarkDef,
  LofiTrackId,
  NpcActionOption,
  PlayerHudSnapshot,
  SeasonType,
  StreetInteractionType,
  TimeOfDay,
  UserSavePayload,
  VehicleConfig,
  WeatherType,
} from './types/game';

const LEGACY_ROOM_STORAGE_KEY = 'efeler_cozy_room_v1';
const LEGACY_AGENDA_STORAGE_KEY = 'efeler_agenda_notes_v1';

const INITIAL_HUD: PlayerHudSnapshot = {
  speedKmh: 0,
  currentDistrict: 'Efeler Merkez & Kent Meydanı',
  currentStreet: 'Sevgi Yolu',
  nearbyLandmark: null,
  nearbyNpc: null,
  nearAncientSignpost: false,
  nearPlayerHome: false,
  nearbyStreetInteraction: null,
  vendorBubble: null,
  distanceToActiveErrand: null,
  playerPos: [-18, 27],
  headingRad: 0,
  companionName: null,
  heldTreat: 'none',
};

function loadInitialPlayerSave(): UserSavePayload {
  const saved = loadLocalSavePayload();
  if (saved) return saved;

  let legacyRoom: Partial<CozyRoomState> | undefined;
  let legacyAgenda: AgendaNote[] = [];
  try {
    const rawRoom = localStorage.getItem(LEGACY_ROOM_STORAGE_KEY);
    if (rawRoom) legacyRoom = JSON.parse(rawRoom) as Partial<CozyRoomState>;
  } catch {
    // Ignore parse errors
  }
  try {
    const rawAgenda = localStorage.getItem(LEGACY_AGENDA_STORAGE_KEY);
    if (rawAgenda) {
      const parsed = JSON.parse(rawAgenda) as AgendaNote[];
      if (Array.isArray(parsed)) legacyAgenda = parsed;
    }
  } catch {
    // Ignore parse errors
  }

  return sanitizeUserSavePayload({
    displayName: 'Efeler Gezgini',
    avatarEmoji: '🏡',
    coins: 0,
    lokmaPower: 2,
    discoveredIds: [],
    completedErrandIds: [],
    chattedNpcIds: [],
    unlockedFurnitureStyles: DEFAULT_UNLOCKED_FURNITURE_STYLES,
    vehicleConfig: DEFAULT_VEHICLE_CONFIG,
    houseExterior: DEFAULT_HOUSE_EXTERIOR,
    cozyRoomState: legacyRoom
      ? {
          ...DEFAULT_COZY_ROOM_STATE,
          ...legacyRoom,
          avatarConfig: {
            ...DEFAULT_AVATAR_CONFIG,
            ...(legacyRoom.avatarConfig || {}),
          },
          furniture:
            Array.isArray(legacyRoom.furniture) && legacyRoom.furniture.length > 0
              ? legacyRoom.furniture
              : DEFAULT_COZY_ROOM_STATE.furniture,
        }
      : DEFAULT_COZY_ROOM_STATE,
    agendaNotes: legacyAgenda,
  });
}

export default function App() {
  const initialSave = useMemo(() => loadInitialPlayerSave(), []);

  const canvasRef = useRef<EfelerCanvasHandle | null>(null);
  const lastTransformRef = useRef<{ x: number; z: number; heading: number }>({
    x: -18,
    z: 27,
    heading: 0,
  });

  const [phase, setPhase] = useState<GamePhase>('title');
  const [inHome, setInHome] = useState(false);
  const [journalOpen, setJournalOpen] = useState(false);
  const [realMapOpen, setRealMapOpen] = useState(false);
  const [agendaOpen, setAgendaOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [activeNpc, setActiveNpc] = useState<BuildingNpcDef | null>(null);
  const [activeNpcIsFirstChat, setActiveNpcIsFirstChat] = useState(false);
  const [quotaExceeded, setQuotaExceeded] = useState(false);

  const [displayName, setDisplayName] = useState<string>(initialSave.displayName);
  const [avatarEmoji, setAvatarEmoji] = useState<string>(initialSave.avatarEmoji);
  const [chattedNpcIds, setChattedNpcIds] = useState<string[]>(initialSave.chattedNpcIds);
  const [discoveredIds, setDiscoveredIds] = useState<string[]>(initialSave.discoveredIds);
  const [completedErrandIds, setCompletedErrandIds] = useState<string[]>(
    initialSave.completedErrandIds
  );
  const [coins, setCoins] = useState<number>(initialSave.coins);
  const [lokmaPower, setLokmaPower] = useState<number>(initialSave.lokmaPower);
  const [unlockedFurnitureStyles, setUnlockedFurnitureStyles] = useState<string[]>(
    initialSave.unlockedFurnitureStyles
  );
  const [vehicleConfig, setVehicleConfig] = useState<VehicleConfig>(initialSave.vehicleConfig);
  const [houseExterior, setHouseExterior] = useState<HouseExteriorConfig>(
    initialSave.houseExterior
  );
  const [cozyRoomState, setCozyRoomState] = useState<CozyRoomState>(initialSave.cozyRoomState);
  const [agendaNotes, setAgendaNotes] = useState<AgendaNote[]>(initialSave.agendaNotes);

  const [explorationMode, setExplorationMode] = useState<ExplorationMode>('vehicle');
  const [timeOfDay, setTimeOfDay] = useState<TimeOfDay>('golden');
  const [season, setSeason] = useState<SeasonType>('spring');
  const [weather, setWeather] = useState<WeatherType>('clear');
  const [autoAtmosphere, setAutoAtmosphere] = useState<boolean>(true);
  const [lofiTrack, setLofiTrack] = useState<LofiTrackId>('aegean');
  const [cameraPreset, setCameraPreset] = useState<CameraPreset>('isometric');

  const [activeErrand, setActiveErrand] = useState<ErrandDef | null>(null);
  const [errandPickedUp, setErrandPickedUp] = useState(false);

  const [hud, setHud] = useState<PlayerHudSnapshot>(INITIAL_HUD);
  const [recentlyDiscovered, setRecentlyDiscovered] = useState<LandmarkDef | null>(null);
  const [errandToast, setErrandToast] = useState<string | null>(null);

  const [isMuted, setIsMuted] = useState(false);
  const [musicEnabled, setMusicEnabled] = useState(true);

  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [cloudSyncing, setCloudSyncing] = useState(false);
  const [cloudStatusMessage, setCloudStatusMessage] = useState<string | null>(null);
  const [cloudErrorMessage, setCloudErrorMessage] = useState<string | null>(null);

  const cloudHydratedRef = useRef(false);
  const toastTimerRef = useRef<number | null>(null);

  const currentPayload = useMemo<UserSavePayload>(
    () =>
      sanitizeUserSavePayload({
        displayName,
        avatarEmoji,
        coins,
        lokmaPower,
        discoveredIds,
        completedErrandIds,
        chattedNpcIds,
        unlockedFurnitureStyles,
        vehicleConfig,
        houseExterior,
        cozyRoomState,
        agendaNotes,
      }),
    [
      agendaNotes,
      avatarEmoji,
      chattedNpcIds,
      coins,
      completedErrandIds,
      cozyRoomState,
      discoveredIds,
      displayName,
      houseExterior,
      lokmaPower,
      unlockedFurnitureStyles,
      vehicleConfig,
    ]
  );

  const latestPayloadRef = useRef<UserSavePayload>(currentPayload);
  latestPayloadRef.current = currentPayload;

  const applySavePayload = useCallback((data: UserSavePayload) => {
    setDisplayName(data.displayName);
    setAvatarEmoji(data.avatarEmoji);
    setCoins(data.coins);
    setLokmaPower(data.lokmaPower);
    setDiscoveredIds(data.discoveredIds);
    setCompletedErrandIds(data.completedErrandIds);
    setChattedNpcIds(data.chattedNpcIds);
    setUnlockedFurnitureStyles(data.unlockedFurnitureStyles);
    setVehicleConfig(data.vehicleConfig);
    setHouseExterior(data.houseExterior);
    setCozyRoomState(data.cozyRoomState);
    setAgendaNotes(data.agendaNotes);
  }, []);

  // Local auto-save (immediate debounce)
  useEffect(() => {
    const timer = window.setTimeout(() => {
      saveLocalSavePayload(currentPayload);
    }, 350);
    return () => window.clearTimeout(timer);
  }, [currentPayload]);

  // Firebase Auth listener & initial cloud hydration
  useEffect(() => {
    let active = true;
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!active) return;
      setFirebaseUser(user);
      setCloudErrorMessage(null);

      if (!user) {
        cloudHydratedRef.current = false;
        setCloudStatusMessage(null);
        return;
      }

      setCloudSyncing(true);
      try {
        const cloudData = await loadCloudProfile(user.uid);
        if (!active) return;
        const local = latestPayloadRef.current;

        if (!cloudData) {
          const initialName =
            local.displayName === 'Efeler Gezgini' && user.displayName
              ? user.displayName.slice(0, 40)
              : local.displayName;
          const seeded = sanitizeUserSavePayload({
            ...local,
            displayName: initialName,
          });
          applySavePayload(seeded);
          await saveCloudProfile(user.uid, seeded);
          if (!active) return;
          setCloudStatusMessage('Yeni bulut profili oluşturuldu ve puanların kaydedildi.');
        } else {
          const merged = sanitizeUserSavePayload({
            ...cloudData,
            displayName:
              cloudData.displayName === 'Efeler Gezgini' &&
              local.displayName !== 'Efeler Gezgini'
                ? local.displayName
                : cloudData.displayName,
            coins: Math.max(cloudData.coins, local.coins),
            lokmaPower: Math.max(cloudData.lokmaPower, local.lokmaPower),
            discoveredIds: Array.from(
              new Set([...cloudData.discoveredIds, ...local.discoveredIds])
            ),
            completedErrandIds: Array.from(
              new Set([...(cloudData.completedErrandIds || []), ...local.completedErrandIds])
            ),
            chattedNpcIds: Array.from(
              new Set([...cloudData.chattedNpcIds, ...local.chattedNpcIds])
            ),
            unlockedFurnitureStyles: Array.from(
              new Set([...cloudData.unlockedFurnitureStyles, ...local.unlockedFurnitureStyles])
            ),
          });
          applySavePayload(merged);
          setCloudStatusMessage('Bulut profilin yüklendi.');
        }
        cloudHydratedRef.current = true;
      } catch {
        if (!active) return;
        cloudHydratedRef.current = true;
        setCloudErrorMessage('Bulut profiline erişilemedi. Yerel kaydınız aktif.');
      } finally {
        if (active) setCloudSyncing(false);
      }
    });

    return () => {
      active = false;
      unsubscribe();
    };
  }, [applySavePayload]);

  // Debounced cloud auto-save when signed in
  useEffect(() => {
    if (!firebaseUser || !cloudHydratedRef.current) return;
    let cancelled = false;
    const timer = window.setTimeout(async () => {
      try {
        await saveCloudProfile(firebaseUser.uid, currentPayload);
        if (!cancelled) {
          const now = new Date();
          const hh = String(now.getHours()).padStart(2, '0');
          const mm = String(now.getMinutes()).padStart(2, '0');
          setCloudStatusMessage(`Buluta otomatik kaydedildi (${hh}:${mm}).`);
          setCloudErrorMessage(null);
        }
      } catch {
        if (!cancelled) {
          setCloudErrorMessage('Bulut kaydı güncellenemedi; yerel kaydınız güvende.');
        }
      }
    }, 2200);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [currentPayload, firebaseUser]);

  const handleManualCloudSave = useCallback(async () => {
    if (!firebaseUser) return;
    setCloudSyncing(true);
    setCloudErrorMessage(null);
    try {
      await saveCloudProfile(firebaseUser.uid, latestPayloadRef.current);
      const now = new Date();
      const hh = String(now.getHours()).padStart(2, '0');
      const mm = String(now.getMinutes()).padStart(2, '0');
      setCloudStatusMessage(`Buluta başarıyla kaydedildi (${hh}:${mm}).`);
    } catch {
      setCloudErrorMessage('Buluta kaydedilirken bir hata oluştu.');
    } finally {
      setCloudSyncing(false);
    }
  }, [firebaseUser]);

  const handleManualCloudLoad = useCallback(async () => {
    if (!firebaseUser) return;
    setCloudSyncing(true);
    setCloudErrorMessage(null);
    try {
      const cloudData = await loadCloudProfile(firebaseUser.uid);
      if (cloudData) {
        applySavePayload(cloudData);
        setCloudStatusMessage('Buluttaki son kayıtlı profil yüklendi.');
      } else {
        setCloudStatusMessage('Bulutta henüz kayıt bulunamadı.');
      }
    } catch {
      setCloudErrorMessage('Buluttan yükleme başarısız oldu.');
    } finally {
      setCloudSyncing(false);
    }
  }, [applySavePayload, firebaseUser]);

  useEffect(() => {
    const onQuotaExceeded = () => setQuotaExceeded(true);
    window.addEventListener('gmp-quota-exceeded', onQuotaExceeded);
    return () => window.removeEventListener('gmp-quota-exceeded', onQuotaExceeded);
  }, []);

  const handleHudUpdate = useCallback((snapshot: PlayerHudSnapshot) => {
    lastTransformRef.current = {
      x: snapshot.playerPos[0],
      z: snapshot.playerPos[1],
      heading: snapshot.headingRad,
    };
    setHud(snapshot);
  }, []);

  const showDiscoveryToast = useCallback((lm: LandmarkDef) => {
    setRecentlyDiscovered(lm);
    setErrandToast(null);
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    toastTimerRef.current = window.setTimeout(() => {
      setRecentlyDiscovered(null);
    }, 4500);
  }, []);

  const showErrandToast = useCallback((msg: string) => {
    setErrandToast(msg);
    setRecentlyDiscovered(null);
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    toastTimerRef.current = window.setTimeout(() => {
      setErrandToast(null);
    }, 4000);
  }, []);

  const handleStartGame = useCallback(() => {
    audioEngine.init();
    audioEngine.setLofiTrack(lofiTrack);
    audioEngine.setWeatherAudio(weather);
    setPhase('playing');
  }, [lofiTrack, weather]);

  const handleChangeWeather = useCallback((next: WeatherType) => {
    audioEngine.init();
    setWeather(next);
    audioEngine.setWeatherAudio(next);
  }, []);

  const handleAutoWeatherSync = useCallback((next: WeatherType) => {
    setWeather(next);
    audioEngine.setWeatherAudio(next);
  }, []);

  const handleChangeLofiTrack = useCallback((next: LofiTrackId) => {
    audioEngine.init();
    setLofiTrack(next);
    audioEngine.setLofiTrack(next);
  }, []);

  const handleDiscoverLandmark = useCallback(
    (lm: LandmarkDef) => {
      setDiscoveredIds((prev) => {
        if (prev.includes(lm.id)) return prev;
        setCoins((c) => c + lm.rewardCoins);
        setLokmaPower((p) => p + 1);
        showDiscoveryToast(lm);
        return [...prev, lm.id];
      });
    },
    [showDiscoveryToast]
  );

  const handleErrandAction = useCallback(
    (landmarkId: string) => {
      if (!activeErrand) return;
      if (!errandPickedUp && activeErrand.fromLandmarkId === landmarkId) {
        setErrandPickedUp(true);
        const destName =
          LANDMARKS.find((l) => l.id === activeErrand.toLandmarkId)?.name || 'hedefe';
        showErrandToast(`${activeErrand.title} alındı! Şimdi ${destName} noktasına sürün.`);
      } else if (errandPickedUp && activeErrand.toLandmarkId === landmarkId) {
        setCoins((c) => c + activeErrand.rewardCoins);
        setLokmaPower((p) => p + 2);
        const isFirstCompletion = !completedErrandIds.includes(activeErrand.id);
        setCompletedErrandIds((prev) =>
          prev.includes(activeErrand.id) ? prev : [...prev, activeErrand.id]
        );
        showErrandToast(
          isFirstCompletion
            ? `Görev tamamlandı: ${activeErrand.title} (+${activeErrand.rewardCoins} İncir, +2 Lokma · Efeler Gezgini Rozeti Kazanıldı!)`
            : `Görev tamamlandı: ${activeErrand.title} (+${activeErrand.rewardCoins} İncir, +2 Lokma)`
        );
        setActiveErrand(null);
        setErrandPickedUp(false);
      }
    },
    [activeErrand, completedErrandIds, errandPickedUp, showErrandToast]
  );

  const handleInspectSignpost = useCallback(() => {
    showErrandToast(
      'Aydın Antik Kentleri Çok Yakında: Nysa · Aphrodisias · Magnesia · Miletos · Priene rotaları hazırlanıyor!'
    );
  }, [showErrandToast]);

  const handleStreetEvent = useCallback(
    (type: StreetInteractionType) => {
      if (type === 'musicians') {
        setExplorationMode((prev) => (prev === 'vehicle' ? 'walk' : prev));
        showErrandToast(
          'Kent Meydanı’nda Zeybek çalıyor — Efeler halk oyununa katıldınız!'
        );
      } else if (type === 'lokma') {
        setLokmaPower((p) => p + 1);
        showErrandToast('Bey Camii önünden taze hayır lokması aldınız! +1 Lokma Puanı');
      } else if (type === 'vendor') {
        showErrandToast('“Islak mendil, lif ister misiniz? Buyurun!”');
      }
    },
    [showErrandToast]
  );

  const handlePurchaseFurnitureStyle = useCallback(
    (item: FurnitureStyleDef): boolean => {
      const alreadyOwned =
        item.priceLokma === 0 || unlockedFurnitureStyles.includes(item.key);

      if (alreadyOwned) {
        audioEngine.init();
        audioEngine.playDiscoveryChime();
        setCozyRoomState((prev) => ({
          ...prev,
          furniture: prev.furniture.map((f) =>
            f.id === item.furnitureId ? { ...f, enabled: true, styleId: item.styleId } : f
          ),
        }));
        return true;
      }

      if (lokmaPower < item.priceLokma) {
        showErrandToast(
          `Bu mobilya için ${item.priceLokma} Lokma Puanı gerekli (Bey Camii veya keşiflerden kazanabilirsiniz).`
        );
        return false;
      }

      audioEngine.init();
      audioEngine.playDiscoveryChime();
      setLokmaPower((p) => Math.max(0, p - item.priceLokma));
      setUnlockedFurnitureStyles((prev) =>
        prev.includes(item.key) ? prev : [...prev, item.key]
      );
      setCozyRoomState((prev) => ({
        ...prev,
        furniture: prev.furniture.map((f) =>
          f.id === item.furnitureId ? { ...f, enabled: true, styleId: item.styleId } : f
        ),
      }));
      showErrandToast(`${item.name} satın alındı ve odaya yerleştirildi!`);
      return true;
    },
    [lokmaPower, showErrandToast, unlockedFurnitureStyles]
  );

  const handleInteractNpc = useCallback(
    (npc: BuildingNpcDef) => {
      audioEngine.init();
      canvasRef.current?.setTouchInput({
        forward: false,
        backward: false,
        left: false,
        right: false,
        flap: false,
        dive: false,
      });
      const isFirst = !chattedNpcIds.includes(npc.id);
      if (isFirst) {
        setChattedNpcIds((prev) => (prev.includes(npc.id) ? prev : [...prev, npc.id]));
        setCoins((c) => c + 5);
      }
      setActiveNpcIsFirstChat(isFirst);
      setActiveNpc(npc);
    },
    [chattedNpcIds]
  );

  const handleSelectNpcAction = useCallback(
    (npc: BuildingNpcDef, action: NpcActionOption) => {
      if (coins < action.cost) return;
      audioEngine.init();
      audioEngine.playDiscoveryChime();
      setCoins((c) => Math.max(0, c - action.cost));
      setActiveNpc(null);
      showErrandToast(action.resultMessage);
      if (action.startsWalk) {
        setExplorationMode('walk');
        canvasRef.current?.startCompanionWalk(npc, action.treat);
      } else {
        canvasRef.current?.giveTreat(action.treat);
      }
    },
    [coins, showErrandToast]
  );

  const handleNavigateToLandmark = useCallback((lm: LandmarkDef) => {
    const [lx, , lz] = lm.position;
    let tx = lx;
    let tz = lz + 10.5;
    let heading = 0;
    if (lm.id === 'beycamii') {
      tx = lx - 11;
      tz = lz + 4;
      heading = -Math.PI / 2;
    } else if (lm.id === 'nasuhpasa' || lm.id === 'saribelediye') {
      tx = lx - 12.5;
      tz = lz;
      heading = -Math.PI / 2;
    } else if (lm.id === 'cihanoglu' || lm.id === 'tekstilpark') {
      tx = lx + 15.5;
      tz = lz;
      heading = Math.PI / 2;
    } else if (lm.id === 'forumaydin') {
      tx = lx - 15.5;
      tz = lz;
      heading = -Math.PI / 2;
    } else if (lm.id === 'kentmeydani') {
      tx = lx;
      tz = lz + 18;
      heading = 0;
    } else if (lm.id === 'trengari') {
      tx = lx;
      tz = lz - 9.5;
      heading = Math.PI;
    } else if (lm.id === 'ortamahalle') {
      tx = lx - 14.0;
      tz = lz;
      heading = -Math.PI / 2;
    } else if (lm.id === 'universite') {
      tx = lx - 16.0;
      tz = lz;
      heading = -Math.PI / 2;
    }
    canvasRef.current?.teleportTo(tx, tz, heading);
    setJournalOpen(false);
    setRealMapOpen(false);
    setProfileOpen(false);
    setInHome(false);
    setPhase('playing');
  }, []);

  const handleToggleMute = useCallback(() => {
    audioEngine.init();
    setIsMuted((prev) => {
      const next = !prev;
      audioEngine.setMuted(next);
      return next;
    });
  }, []);

  const handleToggleMusic = useCallback(() => {
    audioEngine.init();
    setMusicEnabled((prev) => {
      const next = !prev;
      audioEngine.setMusicEnabled(next);
      return next;
    });
  }, []);

  const handleEnterHome = useCallback(() => {
    audioEngine.init();
    audioEngine.updateEngineSound(0, vehicleConfig.type, false);
    canvasRef.current?.setTouchInput({
      forward: false,
      backward: false,
      left: false,
      right: false,
      flap: false,
      dive: false,
    });
    setJournalOpen(false);
    setRealMapOpen(false);
    setProfileOpen(false);
    setInHome(true);
  }, [vehicleConfig.type]);

  const handleExitHome = useCallback(() => {
    setAgendaOpen(false);
    setInHome(false);
  }, []);

  const handleAddAgendaNote = useCallback((dateKey: string, text: string) => {
    setAgendaNotes((prev) => [
      { id: `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, dateKey, text, done: false },
      ...prev,
    ]);
  }, []);

  const handleToggleAgendaNote = useCallback((id: string) => {
    setAgendaNotes((prev) => prev.map((n) => (n.id === id ? { ...n, done: !n.done } : n)));
  }, []);

  const handleDeleteAgendaNote = useCallback((id: string) => {
    setAgendaNotes((prev) => prev.filter((n) => n.id !== id));
  }, []);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const tag = document.activeElement?.tagName;
      const typing = tag === 'INPUT' || tag === 'TEXTAREA';
      if (e.code === 'Escape') {
        if (profileOpen) {
          setProfileOpen(false);
        } else if (agendaOpen) {
          setAgendaOpen(false);
        } else if (activeNpc) {
          setActiveNpc(null);
        } else if (realMapOpen) {
          setRealMapOpen(false);
        } else if (journalOpen) {
          setJournalOpen(false);
        } else if (inHome) {
          setInHome(false);
        } else if (phase === 'playing') {
          setPhase('paused');
        } else if (phase === 'paused') {
          setPhase('playing');
        }
      } else if (
        e.code === 'KeyJ' &&
        phase === 'playing' &&
        !inHome &&
        !realMapOpen &&
        !profileOpen &&
        !activeNpc &&
        !typing
      ) {
        setJournalOpen((o) => !o);
      } else if (
        e.code === 'KeyM' &&
        phase === 'playing' &&
        !inHome &&
        !journalOpen &&
        !agendaOpen &&
        !profileOpen &&
        !activeNpc &&
        !typing
      ) {
        setRealMapOpen((o) => !o);
      } else if (
        e.code === 'KeyV' &&
        phase === 'playing' &&
        !inHome &&
        !journalOpen &&
        !realMapOpen &&
        !agendaOpen &&
        !profileOpen &&
        !activeNpc &&
        !typing
      ) {
        setExplorationMode((m) =>
          m === 'vehicle' ? 'walk' : m === 'walk' ? 'sparrow' : 'vehicle'
        );
      } else if (
        e.code === 'KeyC' &&
        phase === 'playing' &&
        !inHome &&
        !journalOpen &&
        !realMapOpen &&
        !agendaOpen &&
        !profileOpen &&
        !activeNpc &&
        !typing
      ) {
        setCameraPreset((p) =>
          p === 'isometric' ? 'perspective' : p === 'perspective' ? 'first_person' : 'isometric'
        );
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [activeNpc, agendaOpen, inHome, journalOpen, phase, profileOpen, realMapOpen]);

  useEffect(() => {
    return () => {
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
      audioEngine.dispose();
    };
  }, []);

  const effectivePhase: GamePhase =
    (journalOpen || realMapOpen || profileOpen || Boolean(activeNpc)) && phase === 'playing'
      ? 'paused'
      : phase;

  const handleTouchInput = useCallback((next: Partial<TouchDriveInput>) => {
    if (next.forward || next.backward || next.left || next.right) {
      audioEngine.init();
    }
    canvasRef.current?.setTouchInput(next);
  }, []);

  const handleAdjustZoom = useCallback((delta: number) => {
    canvasRef.current?.adjustZoom(delta);
  }, []);

  return (
    <main className="relative w-screen h-[100dvh] overflow-hidden bg-[#EAD0AA] select-none">
      {quotaExceeded && (
        <div className="bg-amber-50 border-b border-amber-200 text-amber-900 px-4 py-2.5 text-xs md:text-sm text-center sticky top-0 z-50 shadow-sm">
          <span>
            Google Maps Platform quota reached. If you are the app owner, visit{' '}
            <a
              href="https://developers.google.com/maps/ai/ai-studio?utm_campaign=gmp_mcp_codeassist_v1_aistudio#quota_exceeded_errors"
              target="_blank"
              rel="noopener noreferrer"
              className="underline font-semibold text-amber-950 hover:text-amber-800"
            >
              maps developer site
            </a>{' '}
            for instructions to update your account.
          </span>
        </div>
      )}
      {!inHome ? (
        <ErrorBoundary
          key="city-boundary"
          fallbackTitle="Efeler Sahnesi Yenileniyor"
          onReset={() => setPhase('playing')}
        >
          <EfelerCanvas
            ref={canvasRef}
            phase={effectivePhase}
            explorationMode={explorationMode}
            avatarConfig={cozyRoomState.avatarConfig || DEFAULT_AVATAR_CONFIG}
            vehicleConfig={vehicleConfig}
            houseExterior={houseExterior}
            timeOfDay={timeOfDay}
            season={season}
            weather={weather}
            autoAtmosphere={autoAtmosphere}
            cameraPreset={cameraPreset}
            discoveredIds={discoveredIds}
            coins={coins}
            activeErrand={activeErrand}
            errandPickedUp={errandPickedUp}
            initialTransform={lastTransformRef.current}
            onHudUpdate={handleHudUpdate}
            onDiscoverLandmark={handleDiscoverLandmark}
            onErrandAction={handleErrandAction}
            onInspectSignpost={handleInspectSignpost}
            onStreetEvent={handleStreetEvent}
            onInteractNpc={handleInteractNpc}
            onWalkChatMessage={showErrandToast}
            onAutoTimeSync={setTimeOfDay}
            onAutoWeatherSync={handleAutoWeatherSync}
            onCollectCrumb={(amt) => setCoins((c) => c + amt)}
            onEnterHome={handleEnterHome}
          />
        </ErrorBoundary>
      ) : (
        <ErrorBoundary
          key="home-boundary"
          fallbackTitle="Sıcak Yuvam Yenileniyor"
          onReset={handleExitHome}
        >
          <CozyRoomView
            roomState={cozyRoomState}
            houseExterior={houseExterior}
            lokmaPower={lokmaPower}
            unlockedFurnitureStyles={unlockedFurnitureStyles}
            weather={weather}
            lofiTrack={lofiTrack}
            isMuted={isMuted}
            musicEnabled={musicEnabled}
            onChangeRoomState={setCozyRoomState}
            onChangeHouseExterior={setHouseExterior}
            onPurchaseFurnitureStyle={handlePurchaseFurnitureStyle}
            onChangeWeather={handleChangeWeather}
            onChangeLofiTrack={handleChangeLofiTrack}
            onToggleMute={handleToggleMute}
            onToggleMusic={handleToggleMusic}
            onOpenAgenda={() => setAgendaOpen(true)}
            onExitHome={handleExitHome}
          />
        </ErrorBoundary>
      )}

      {phase === 'title' && !inHome && (
        <TitleScreen
          profileName={displayName}
          profileEmoji={avatarEmoji}
          isCloudSignedIn={Boolean(firebaseUser)}
          onStart={handleStartGame}
          onOpenProfile={() => setProfileOpen(true)}
        />
      )}

      {phase === 'playing' && !journalOpen && !realMapOpen && !activeNpc && !inHome && (
        <GameHUD
          hud={hud}
          explorationMode={explorationMode}
          vehicleConfig={vehicleConfig}
          houseExterior={houseExterior}
          profileName={displayName}
          profileEmoji={avatarEmoji}
          isCloudSignedIn={Boolean(firebaseUser)}
          timeOfDay={timeOfDay}
          season={season}
          weather={weather}
          autoAtmosphere={autoAtmosphere}
          lofiTrack={lofiTrack}
          cameraPreset={cameraPreset}
          discoveredIds={discoveredIds}
          coins={coins}
          lokmaPower={lokmaPower}
          activeErrand={activeErrand}
          errandPickedUp={errandPickedUp}
          recentlyDiscovered={recentlyDiscovered}
          errandToast={errandToast}
          isMuted={isMuted}
          musicEnabled={musicEnabled}
          onChangeExplorationMode={(next) => {
            audioEngine.init();
            setExplorationMode(next);
          }}
          onChangeVehicleConfig={(next) => {
            audioEngine.init();
            setVehicleConfig(next);
          }}
          onChangeHouseExterior={setHouseExterior}
          onChangeTimeOfDay={setTimeOfDay}
          onChangeSeason={setSeason}
          onChangeWeather={handleChangeWeather}
          onToggleAutoAtmosphere={() => setAutoAtmosphere((prev) => !prev)}
          onChangeLofiTrack={handleChangeLofiTrack}
          onChangeCameraPreset={setCameraPreset}
          onInteractNpc={handleInteractNpc}
          onToggleMute={handleToggleMute}
          onToggleMusic={handleToggleMusic}
          onOpenJournal={() => setJournalOpen(true)}
          onOpenRealMap={() => setRealMapOpen(true)}
          onOpenProfile={() => setProfileOpen(true)}
          onEnterHome={handleEnterHome}
          onPause={() => {
            canvasRef.current?.setTouchInput({
              forward: false,
              backward: false,
              left: false,
              right: false,
              flap: false,
              dive: false,
            });
            setPhase('paused');
          }}
          onDiscoverNearby={() => canvasRef.current?.triggerDiscoverNearby()}
          onHorn={() => canvasRef.current?.triggerHorn()}
          onChirp={() => canvasRef.current?.triggerChirp()}
          onTouchInput={handleTouchInput}
          onAdjustZoom={handleAdjustZoom}
        />
      )}

      {activeNpc && !inHome && (
        <NpcDialogueModal
          npc={activeNpc}
          coins={coins}
          isFirstChat={activeNpcIsFirstChat}
          onSelectAction={handleSelectNpcAction}
          onClose={() => setActiveNpc(null)}
        />
      )}

      {journalOpen && !inHome && (
        <JournalModal
          discoveredIds={discoveredIds}
          completedErrandIds={completedErrandIds}
          activeErrand={activeErrand}
          errandPickedUp={errandPickedUp}
          onSelectErrand={(err) => {
            setActiveErrand(err);
            setErrandPickedUp(false);
          }}
          onNavigateToLandmark={handleNavigateToLandmark}
          onClose={() => setJournalOpen(false)}
        />
      )}

      {realMapOpen && !inHome && (
        <ErrorBoundary
          key="map-boundary"
          fallbackTitle="Harita Yenileniyor"
          fallbackActionLabel="Haritayı Kapat"
          onReset={() => setRealMapOpen(false)}
        >
          <RealAydinMapModal
            onJumpTo3DLandmark={handleNavigateToLandmark}
            onClose={() => setRealMapOpen(false)}
          />
        </ErrorBoundary>
      )}

      {agendaOpen && (
        <AgendaModal
          notes={agendaNotes}
          onAddNote={handleAddAgendaNote}
          onToggleNote={handleToggleAgendaNote}
          onDeleteNote={handleDeleteAgendaNote}
          onClose={() => setAgendaOpen(false)}
        />
      )}

      {profileOpen && (
        <ProfileModal
          displayName={displayName}
          avatarEmoji={avatarEmoji}
          coins={coins}
          lokmaPower={lokmaPower}
          discoveredIds={discoveredIds}
          completedErrandIds={completedErrandIds}
          chattedNpcCount={chattedNpcIds.length}
          unlockedStyleCount={unlockedFurnitureStyles.length}
          houseExterior={houseExterior}
          firebaseUser={firebaseUser}
          cloudSyncing={cloudSyncing}
          cloudStatusMessage={cloudStatusMessage}
          cloudErrorMessage={cloudErrorMessage}
          onChangeDisplayName={(next) => setDisplayName(next.slice(0, 40))}
          onChangeAvatarEmoji={setAvatarEmoji}
          onManualCloudSave={handleManualCloudSave}
          onManualCloudLoad={handleManualCloudLoad}
          onClose={() => setProfileOpen(false)}
        />
      )}

      {phase === 'paused' &&
        !journalOpen &&
        !realMapOpen &&
        !profileOpen &&
        !activeNpc &&
        !inHome && (
          <PauseModal
            discoveredCount={discoveredIds.length}
            totalLandmarks={LANDMARKS.length}
            coins={coins}
            onResume={() => setPhase('playing')}
            onResetPosition={() => {
              canvasRef.current?.teleportTo(-18, 27, 0);
              setPhase('playing');
            }}
            onReturnTitle={() => setPhase('title')}
          />
        )}
    </main>
  );
}
