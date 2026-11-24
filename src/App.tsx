import { useCallback, useEffect, useRef, useState } from 'react';
import { AboutModal } from './components/AboutModal';
import { AgendaModal } from './components/AgendaModal';
import { CozyRoomView } from './components/CozyRoomView';
import { EfelerCanvas, EfelerCanvasHandle, TouchDriveInput } from './components/EfelerCanvas';
import { ErrorBoundary } from './components/ErrorBoundary';
import { GameHUD } from './components/GameHUD';
import { JournalModal } from './components/JournalModal';
import { AncientMuseumView } from './components/museum/AncientMuseumView';
import { NpcDialogueModal } from './components/NpcDialogueModal';
import { PauseModal } from './components/PauseModal';
import { ProfileModal } from './components/ProfileModal';
import { RealAydinMapModal } from './components/RealAydinMapModal';
import { TitleScreen } from './components/TitleScreen';
import {
  ANCIENT_CITY_MAP,
  getAncientCityByLandmarkId,
} from './data/ancientMuseumData';
import {
  COZY_ERRANDS,
  DEFAULT_AVATAR_CONFIG,
  getRadioStationForDistrict,
  LANDMARKS,
} from './data/efelerData';
import { audioEngine } from './game/audioEngine';
import { narrateLandmark, stopVoiceGuide } from './game/voiceGuide';
import { useGamePersistence } from './hooks/useGamePersistence';
import {
  AncientCityId,
  BuildingNpcDef,
  CameraPreset,
  ErrandDef,
  ExplorationMode,
  FurnitureStyleDef,
  GamePhase,
  LandmarkDef,
  LofiTrackId,
  MuseumExhibitDef,
  NpcActionOption,
  PlayerHudSnapshot,
  SeasonType,
  StreetInteractionType,
  TimeOfDay,
  WeatherType,
} from './types/game';

const INITIAL_HUD: PlayerHudSnapshot = {
  speedKmh: 0,
  currentDistrict: 'Güzelhisar Mahallesi · Merkez',
  currentStreet: 'Adnan Menderes Bulvarı',
  nearbyLandmark: null,
  nearbyNpc: null,
  nearAncientSignpost: false,
  nearPlayerHome: false,
  nearbyStreetInteraction: null,
  vendorBubble: null,
  distanceToActiveErrand: null,
  playerPos: [-19, 24],
  headingRad: 0,
  companionName: null,
  heldTreat: 'none',
  elevationMeters: 64,
};

export default function App() {
  const {
    displayName,
    setDisplayName,
    avatarEmoji,
    setAvatarEmoji,
    chattedNpcIds,
    setChattedNpcIds,
    discoveredIds,
    setDiscoveredIds,
    discoveredMuseumIds,
    setDiscoveredMuseumIds,
    completedErrandIds,
    setCompletedErrandIds,
    coins,
    setCoins,
    lokmaPower,
    setLokmaPower,
    unlockedFurnitureStyles,
    setUnlockedFurnitureStyles,
    vehicleConfig,
    setVehicleConfig,
    houseExterior,
    setHouseExterior,
    cozyRoomState,
    setCozyRoomState,
    agendaNotes,
    setAgendaNotes,
    firebaseUser,
    cloudSyncing,
    cloudStatusMessage,
    cloudErrorMessage,
    handleManualCloudSave,
    handleManualCloudLoad,
  } = useGamePersistence();

  const canvasRef = useRef<EfelerCanvasHandle | null>(null);
  const lastTransformRef = useRef<{ x: number; z: number; heading: number }>({
    x: -19,
    z: 24,
    heading: 0,
  });

  const [phase, setPhase] = useState<GamePhase>('title');
  const [inHome, setInHome] = useState(false);
  const [inAncientMuseum, setInAncientMuseum] = useState(false);
  const [activeAncientCityId, setActiveAncientCityId] = useState<AncientCityId>('tralleis');
  const [journalOpen, setJournalOpen] = useState(false);
  const [journalInitialTab, setJournalInitialTab] = useState<
    'landmarks' | 'museum' | 'errands' | 'evolution'
  >('landmarks');
  const [realMapOpen, setRealMapOpen] = useState(false);
  const [agendaOpen, setAgendaOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [aboutOpen, setAboutOpen] = useState(false);
  const [activeNpc, setActiveNpc] = useState<BuildingNpcDef | null>(null);
  const [activeNpcIsFirstChat, setActiveNpcIsFirstChat] = useState(false);
  const [quotaExceeded, setQuotaExceeded] = useState(false);

  const [explorationMode, setExplorationMode] = useState<ExplorationMode>('vehicle');
  const [timeOfDay, setTimeOfDay] = useState<TimeOfDay>('golden');
  const [season, setSeason] = useState<SeasonType>('spring');
  const [weather, setWeather] = useState<WeatherType>('clear');
  const [autoAtmosphere, setAutoAtmosphere] = useState<boolean>(true);
  const [lofiTrack, setLofiTrack] = useState<LofiTrackId>('aegean');
  const [autoDistrictRadio, setAutoDistrictRadio] = useState<boolean>(false);
  const [cameraPreset, setCameraPreset] = useState<CameraPreset>('isometric');

  const [activeErrand, setActiveErrand] = useState<ErrandDef | null>(null);
  const [errandPickedUp, setErrandPickedUp] = useState(false);

  const [hud, setHud] = useState<PlayerHudSnapshot>(INITIAL_HUD);
  const [recentlyDiscovered, setRecentlyDiscovered] = useState<LandmarkDef | null>(null);
  const [errandToast, setErrandToast] = useState<string | null>(null);

  const [isMuted, setIsMuted] = useState(false);
  const [musicEnabled, setMusicEnabled] = useState(true);
  const [voiceGuideLandmark, setVoiceGuideLandmark] = useState<LandmarkDef | null>(null);
  const [voiceGuideLoading, setVoiceGuideLoading] = useState(false);

  const toastTimerRef = useRef<number | null>(null);

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
    setHud((prev) => {
      if (
        prev.speedKmh === snapshot.speedKmh &&
        prev.currentDistrict === snapshot.currentDistrict &&
        prev.currentStreet === snapshot.currentStreet &&
        prev.nearbyLandmark?.id === snapshot.nearbyLandmark?.id &&
        prev.nearbyNpc?.id === snapshot.nearbyNpc?.id &&
        prev.nearAncientSignpost === snapshot.nearAncientSignpost &&
        prev.nearPlayerHome === snapshot.nearPlayerHome &&
        prev.nearbyStreetInteraction?.type === snapshot.nearbyStreetInteraction?.type &&
        prev.nearbyStreetInteraction?.label === snapshot.nearbyStreetInteraction?.label &&
        prev.distanceToActiveErrand === snapshot.distanceToActiveErrand &&
        prev.companionName === snapshot.companionName &&
        prev.heldTreat === snapshot.heldTreat &&
        prev.solarClock === snapshot.solarClock &&
        prev.sparrowState === snapshot.sparrowState &&
        Math.round((prev.sparrowStamina ?? 1) * 100) ===
          Math.round((snapshot.sparrowStamina ?? 1) * 100) &&
        prev.isDancingZeybek === snapshot.isDancingZeybek &&
        Math.round(prev.playerPos[0] * 2) === Math.round(snapshot.playerPos[0] * 2) &&
        Math.round(prev.playerPos[1] * 2) === Math.round(snapshot.playerPos[1] * 2) &&
        Math.round(prev.headingRad * 10) === Math.round(snapshot.headingRad * 10) &&
        prev.vendorBubble?.visible === snapshot.vendorBubble?.visible &&
        prev.vendorBubble?.x === snapshot.vendorBubble?.x &&
        prev.vendorBubble?.y === snapshot.vendorBubble?.y &&
        prev.vendorBubble?.text === snapshot.vendorBubble?.text
      ) {
        return prev;
      }
      return snapshot;
    });
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

  const handleChangeLofiTrack = useCallback((next: LofiTrackId, fromAuto = false) => {
    audioEngine.init();
    setLofiTrack(next);
    audioEngine.setLofiTrack(next, !fromAuto);
    if (!fromAuto && next !== 'ambient_only') {
      setMusicEnabled(true);
      audioEngine.setMusicEnabled(true);
    }
  }, []);

  useEffect(() => {
    if (!autoDistrictRadio || phase !== 'playing' || inHome || inAncientMuseum) return;
    const matched = getRadioStationForDistrict(hud.currentDistrict);
    if (matched.id !== lofiTrack) {
      setLofiTrack(matched.id);
      audioEngine.setLofiTrack(matched.id, true);
    }
  }, [autoDistrictRadio, hud.currentDistrict, inAncientMuseum, inHome, lofiTrack, phase]);

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
    [setCoins, setDiscoveredIds, setLokmaPower, showDiscoveryToast]
  );

  const handleDiscoverMuseumExhibit = useCallback(
    (exhibit: MuseumExhibitDef) => {
      setDiscoveredMuseumIds((prev) => {
        if (prev.includes(exhibit.id)) return prev;
        setCoins((c) => c + exhibit.rewardCoins);
        return [...prev, exhibit.id];
      });
    },
    [setCoins, setDiscoveredMuseumIds]
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
    [
      activeErrand,
      completedErrandIds,
      errandPickedUp,
      setCoins,
      setCompletedErrandIds,
      setLokmaPower,
      showErrandToast,
    ]
  );

  const handleInspectSignpost = useCallback(() => {
    setJournalInitialTab('museum');
    setJournalOpen(true);
    showErrandToast(
      'Aydın’ın 7 Antik Kenti açık! Tralleis, Magnesia, Nysa, Afrodisias, Priene, Milet & Didyma, Alinda & Alabanda’yı seçip girebilirsiniz.'
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
        showErrandToast('“Mendil yara bandı ıslak mendil lif ister misiniz ? buyrunnn”');
      } else if (type === 'guitar_band') {
        showErrandToast(
          'Nevzat Biçer Parkı’nda gençler akustik gitar çalıp eşlik ediyor — keyifli dinletiler!'
        );
      }
    },
    [setLokmaPower, showErrandToast]
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
    [
      lokmaPower,
      setCozyRoomState,
      setLokmaPower,
      setUnlockedFurnitureStyles,
      showErrandToast,
      unlockedFurnitureStyles,
    ]
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
    [chattedNpcIds, setChattedNpcIds, setCoins]
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
    [coins, setCoins, showErrandToast]
  );

  const handleNavigateToLandmark = useCallback((lm: LandmarkDef) => {
    const [lx, , lz] = lm.position;
    let tx = lx;
    let tz = lz + 10.5;
    let heading = 0;
    if (lm.id === 'beycamii') {
      tx = lx;
      tz = lz + 11.2;
      heading = 0;
    } else if (lm.id === 'nasuhpasa' || lm.id === 'saribelediye') {
      tx = lx - 12.0;
      tz = lz;
      heading = -Math.PI / 2;
    } else if (lm.id === 'cihanoglu') {
      tx = lx + 14.0;
      tz = lz;
      heading = Math.PI / 2;
    } else if (lm.id === 'tekstilpark') {
      tx = lx - 15.0;
      tz = lz;
      heading = -Math.PI / 2;
    } else if (lm.id === 'forumaydin') {
      tx = lx - 15.5;
      tz = lz;
      heading = -Math.PI / 2;
    } else if (lm.id === 'kentmeydani') {
      tx = lx;
      tz = lz + 16.5;
      heading = 0;
    } else if (lm.id === 'trengari') {
      tx = lx;
      tz = lz - 9.0;
      heading = Math.PI;
    } else if (lm.id === 'ortamahalle') {
      tx = lx - 14.0;
      tz = lz;
      heading = -Math.PI / 2;
    } else if (lm.id === 'universite') {
      tx = lx - 16.0;
      tz = lz;
      heading = -Math.PI / 2;
    } else if (lm.id === 'magnesia') {
      tx = lx;
      tz = lz + 15.0;
      heading = 0;
    } else if (lm.id === 'nevzatbicerpark') {
      tx = lx + 17.0;
      tz = lz;
      heading = Math.PI / 2;
    } else if (lm.id === 'kipaavm') {
      tx = lx;
      tz = lz - 12.0;
      heading = Math.PI;
    } else if (lm.id === 'sevgiyolu') {
      tx = lx;
      tz = lz;
      heading = -Math.PI / 2;
    } else if (lm.id === 'yagcilarici') {
      tx = lx + 12.5;
      tz = lz;
      heading = -Math.PI / 2;
    } else if (lm.id === 'tralleis') {
      tx = lx;
      tz = lz + 9.0;
      heading = 0;
    }
    canvasRef.current?.teleportTo(tx, tz, heading);
    setJournalOpen(false);
    setRealMapOpen(false);
    setProfileOpen(false);
    setInHome(false);
    setInAncientMuseum(false);
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

  const handleStopVoiceGuide = useCallback(() => {
    stopVoiceGuide();
    audioEngine.setMusicDucked(false);
    setVoiceGuideLoading(false);
    setVoiceGuideLandmark(null);
  }, []);

  const handleToggleVoiceGuide = useCallback(() => {
    const target = hud.nearbyLandmark;
    if (
      voiceGuideLoading ||
      (voiceGuideLandmark && (!target || voiceGuideLandmark.id === target.id))
    ) {
      handleStopVoiceGuide();
      return;
    }
    if (!target) {
      showErrandToast('Sesli Rehber için bir tarihi yapıya veya bölgeye yaklaşın.');
      return;
    }
    if (isMuted) {
      showErrandToast('Sesli Rehber’i dinlemek için önce sesi açın.');
      return;
    }
    void narrateLandmark(target, {
      onLoading: () => {
        setVoiceGuideLoading(true);
        setVoiceGuideLandmark(target);
      },
      onStart: () => {
        setVoiceGuideLoading(false);
        audioEngine.setMusicDucked(true);
        setVoiceGuideLandmark(target);
      },
      onEnd: () => {
        setVoiceGuideLoading(false);
        audioEngine.setMusicDucked(false);
        setVoiceGuideLandmark(null);
      },
      onFallbackNotice: (msg) => {
        showErrandToast(msg);
      },
      onError: (reason) => {
        setVoiceGuideLoading(false);
        audioEngine.setMusicDucked(false);
        setVoiceGuideLandmark(null);
        showErrandToast(
          reason === 'unsupported'
            ? 'Tarayıcınız Sesli Rehber özelliğini desteklemiyor.'
            : 'Sesli Rehber şu anda başlatılamadı.'
        );
      },
    });
  }, [
    handleStopVoiceGuide,
    hud.nearbyLandmark,
    isMuted,
    showErrandToast,
    voiceGuideLandmark,
    voiceGuideLoading,
  ]);

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
    setAboutOpen(false);
    setInAncientMuseum(false);
    setInHome(true);
  }, [vehicleConfig.type]);

  const handleExitHome = useCallback(() => {
    setAgendaOpen(false);
    setInHome(false);
  }, []);

  const handleEnterAncientMuseum = useCallback(
    (cityId?: AncientCityId) => {
      stopVoiceGuide();
      audioEngine.updateEngineSound(0, vehicleConfig.type, false);
      audioEngine.setMusicEnabled(false);
      canvasRef.current?.setTouchInput({
        forward: false,
        backward: false,
        left: false,
        right: false,
        flap: false,
        dive: false,
      });
      if (cityId) {
        setActiveAncientCityId(cityId);
      } else {
        const nearbyCity = getAncientCityByLandmarkId(hud.nearbyLandmark?.id);
        if (nearbyCity) {
          setActiveAncientCityId(nearbyCity.id);
        }
      }
      setJournalOpen(false);
      setRealMapOpen(false);
      setProfileOpen(false);
      setAboutOpen(false);
      setActiveNpc(null);
      setInHome(false);
      setInAncientMuseum(true);
      setPhase('playing');
    },
    [hud.nearbyLandmark?.id, vehicleConfig.type]
  );

  const handleExitAncientMuseum = useCallback(() => {
    stopVoiceGuide();
    setInAncientMuseum(false);
    if (musicEnabled && !isMuted) {
      audioEngine.setMusicEnabled(true);
    }
  }, [isMuted, musicEnabled]);

  const handleAddAgendaNote = useCallback(
    (dateKey: string, text: string) => {
      setAgendaNotes((prev) => [
        { id: `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, dateKey, text, done: false },
        ...prev,
      ]);
    },
    [setAgendaNotes]
  );

  const handleToggleAgendaNote = useCallback(
    (id: string) => {
      setAgendaNotes((prev) => prev.map((n) => (n.id === id ? { ...n, done: !n.done } : n)));
    },
    [setAgendaNotes]
  );

  const handleDeleteAgendaNote = useCallback(
    (id: string) => {
      setAgendaNotes((prev) => prev.filter((n) => n.id !== id));
    },
    [setAgendaNotes]
  );

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const tag = document.activeElement?.tagName;
      const typing = tag === 'INPUT' || tag === 'TEXTAREA';
      if (e.code === 'Escape') {
        if (aboutOpen) {
          setAboutOpen(false);
        } else if (profileOpen) {
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
        } else if (inAncientMuseum) {
          return;
        } else if (phase === 'playing') {
          setPhase('paused');
        } else if (phase === 'paused') {
          setPhase('playing');
        }
      } else if (
        e.code === 'KeyE' &&
        !e.repeat &&
        phase === 'playing' &&
        !inHome &&
        !inAncientMuseum &&
        !journalOpen &&
        !realMapOpen &&
        !profileOpen &&
        !aboutOpen &&
        !activeNpc &&
        !typing
      ) {
        const matchedAncientCity = getAncientCityByLandmarkId(hud.nearbyLandmark?.id);
        if (
          matchedAncientCity &&
          hud.nearbyLandmark &&
          discoveredIds.includes(hud.nearbyLandmark.id) &&
          (!activeErrand ||
            (errandPickedUp
              ? activeErrand.toLandmarkId !== hud.nearbyLandmark.id
              : activeErrand.fromLandmarkId !== hud.nearbyLandmark.id))
        ) {
          handleEnterAncientMuseum(matchedAncientCity.id);
        }
      } else if (
        e.code === 'KeyJ' &&
        phase === 'playing' &&
        !inHome &&
        !inAncientMuseum &&
        !realMapOpen &&
        !profileOpen &&
        !aboutOpen &&
        !activeNpc &&
        !typing
      ) {
        setJournalInitialTab('landmarks');
        setJournalOpen((o) => !o);
      } else if (
        e.code === 'KeyM' &&
        phase === 'playing' &&
        !inHome &&
        !inAncientMuseum &&
        !journalOpen &&
        !agendaOpen &&
        !profileOpen &&
        !aboutOpen &&
        !activeNpc &&
        !typing
      ) {
        setRealMapOpen((o) => !o);
      } else if (
        e.code === 'KeyV' &&
        phase === 'playing' &&
        !inHome &&
        !inAncientMuseum &&
        !journalOpen &&
        !realMapOpen &&
        !agendaOpen &&
        !profileOpen &&
        !aboutOpen &&
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
        !inAncientMuseum &&
        !journalOpen &&
        !realMapOpen &&
        !agendaOpen &&
        !profileOpen &&
        !aboutOpen &&
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
  }, [
    aboutOpen,
    activeErrand,
    activeNpc,
    agendaOpen,
    discoveredIds,
    errandPickedUp,
    handleEnterAncientMuseum,
    hud.nearbyLandmark?.id,
    inAncientMuseum,
    inHome,
    journalOpen,
    phase,
    profileOpen,
    realMapOpen,
  ]);

  useEffect(() => {
    if (phase !== 'playing' || inHome || inAncientMuseum || isMuted) {
      if (voiceGuideLandmark || voiceGuideLoading) {
        handleStopVoiceGuide();
      }
    }
  }, [
    handleStopVoiceGuide,
    inAncientMuseum,
    inHome,
    isMuted,
    phase,
    voiceGuideLandmark,
    voiceGuideLoading,
  ]);

  useEffect(() => {
    audioEngine.bindGlobalUnlock();
    return () => {
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
      stopVoiceGuide();
      audioEngine.dispose();
    };
  }, []);

  const effectivePhase: GamePhase =
    (journalOpen || realMapOpen || profileOpen || aboutOpen || Boolean(activeNpc)) &&
    phase === 'playing'
      ? 'paused'
      : phase;

  const handleTouchInput = useCallback((next: Partial<TouchDriveInput>) => {
    if (
      next.forward ||
      next.backward ||
      next.left ||
      next.right ||
      next.flap ||
      next.dive ||
      Math.abs(next.joyX ?? 0) > 0.05 ||
      Math.abs(next.joyY ?? 0) > 0.05
    ) {
      audioEngine.unlock();
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
      {inAncientMuseum ? (
        <ErrorBoundary
          key={`museum-boundary-${activeAncientCityId}`}
          fallbackTitle={`${ANCIENT_CITY_MAP.get(activeAncientCityId)?.name ?? 'Antik Kent'} Yenileniyor`}
          onReset={handleExitAncientMuseum}
        >
          <AncientMuseumView
            cityId={activeAncientCityId}
            avatarConfig={cozyRoomState.avatarConfig || DEFAULT_AVATAR_CONFIG}
            discoveredMuseumIds={discoveredMuseumIds}
            isMuted={isMuted}
            onSelectCity={setActiveAncientCityId}
            onDiscoverExhibit={handleDiscoverMuseumExhibit}
            onToggleMute={handleToggleMute}
            onOpenJournal={() => {
              setJournalInitialTab('museum');
              setJournalOpen(true);
            }}
            onExitMuseum={handleExitAncientMuseum}
          />
        </ErrorBoundary>
      ) : !inHome ? (
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
            completedErrandIds={completedErrandIds}
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

      {phase === 'title' && !inHome && !inAncientMuseum && (
        <TitleScreen
          profileName={displayName}
          profileEmoji={avatarEmoji}
          isCloudSignedIn={Boolean(firebaseUser)}
          disableStartShortcut={profileOpen || aboutOpen}
          onStart={handleStartGame}
          onOpenProfile={() => setProfileOpen(true)}
          onOpenAbout={() => setAboutOpen(true)}
        />
      )}

      {phase === 'playing' &&
        !journalOpen &&
        !realMapOpen &&
        !profileOpen &&
        !aboutOpen &&
        !activeNpc &&
        !inHome &&
        !inAncientMuseum && (
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
          autoDistrictRadio={autoDistrictRadio}
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
          voiceGuideLandmark={voiceGuideLandmark}
          voiceGuideLoading={voiceGuideLoading}
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
          onToggleAutoDistrictRadio={() => {
            audioEngine.init();
            setAutoDistrictRadio((prev) => {
              const next = !prev;
              if (next) {
                const matched = getRadioStationForDistrict(hud.currentDistrict);
                setLofiTrack(matched.id);
                audioEngine.setLofiTrack(matched.id, true);
                setMusicEnabled(true);
                audioEngine.setMusicEnabled(true);
              }
              return next;
            });
          }}
          onChangeCameraPreset={setCameraPreset}
          onInteractNpc={handleInteractNpc}
          onToggleMute={handleToggleMute}
          onToggleMusic={handleToggleMusic}
          onToggleVoiceGuide={handleToggleVoiceGuide}
          onStopVoiceGuide={handleStopVoiceGuide}
          onOpenJournal={() => {
            setJournalInitialTab('landmarks');
            setJournalOpen(true);
          }}
          onOpenRealMap={() => setRealMapOpen(true)}
          onJumpToLandmark={handleNavigateToLandmark}
          onOpenProfile={() => setProfileOpen(true)}
          onOpenAbout={() => {
            canvasRef.current?.setTouchInput({
              forward: false,
              backward: false,
              left: false,
              right: false,
              flap: false,
              dive: false,
            });
            setAboutOpen(true);
          }}
          onEnterHome={handleEnterHome}
          onEnterAncientMuseum={handleEnterAncientMuseum}
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

      {activeNpc && !inHome && (() => {
        const availableErrandForNpc =
          COZY_ERRANDS.find(
            (err) =>
              err.fromLandmarkId === activeNpc.landmarkId &&
              err.id !== activeErrand?.id &&
              !completedErrandIds.includes(err.id)
          ) ?? null;
        const isActiveFromNpc = Boolean(
          activeErrand && activeErrand.fromLandmarkId === activeNpc.landmarkId
        );
        return (
          <NpcDialogueModal
            npc={activeNpc}
            coins={coins}
            isFirstChat={activeNpcIsFirstChat}
            availableErrand={availableErrandForNpc}
            isActiveErrandFromNpc={isActiveFromNpc}
            onAcceptErrand={(err) => {
              audioEngine.init();
              audioEngine.playDiscoveryChime();
              setActiveErrand(err);
              setErrandPickedUp(true);
              setActiveNpc(null);
              const destName =
                LANDMARKS.find((l) => l.id === err.toLandmarkId)?.name || 'hedefe';
              showErrandToast(`${err.title} alındı! Şimdi ${destName} noktasına ulaştırın.`);
            }}
            onSelectAction={handleSelectNpcAction}
            onClose={() => setActiveNpc(null)}
          />
        );
      })()}

      {journalOpen && !inHome && (
        <JournalModal
          discoveredIds={discoveredIds}
          discoveredMuseumIds={discoveredMuseumIds}
          completedErrandIds={completedErrandIds}
          activeErrand={activeErrand}
          errandPickedUp={errandPickedUp}
          initialTab={journalInitialTab}
          onSelectErrand={(err) => {
            setActiveErrand(err);
            setErrandPickedUp(false);
          }}
          onNavigateToLandmark={handleNavigateToLandmark}
          onEnterAncientMuseum={handleEnterAncientMuseum}
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

      {aboutOpen && <AboutModal onClose={() => setAboutOpen(false)} />}

      {phase === 'paused' &&
        !journalOpen &&
        !realMapOpen &&
        !profileOpen &&
        !aboutOpen &&
        !activeNpc &&
        !inHome &&
        !inAncientMuseum && (
          <PauseModal
            discoveredCount={discoveredIds.length}
            totalLandmarks={LANDMARKS.length}
            coins={coins}
            onResume={() => setPhase('playing')}
            onResetPosition={() => {
              canvasRef.current?.teleportTo(-18, 27, 0);
              setPhase('playing');
            }}
            onOpenAbout={() => setAboutOpen(true)}
            onReturnTitle={() => setPhase('title')}
          />
        )}
    </main>
  );
}
