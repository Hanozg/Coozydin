import { useCallback, useEffect, useRef, useState } from 'react';
import { AgendaModal } from './components/AgendaModal';
import { CozyRoomView } from './components/CozyRoomView';
import { EfelerCanvas, EfelerCanvasHandle, TouchDriveInput } from './components/EfelerCanvas';
import { GameHUD } from './components/GameHUD';
import { JournalModal } from './components/JournalModal';
import { NpcDialogueModal } from './components/NpcDialogueModal';
import { PauseModal } from './components/PauseModal';
import { RealAydinMapModal } from './components/RealAydinMapModal';
import { TitleScreen } from './components/TitleScreen';
import {
  DEFAULT_AVATAR_CONFIG,
  DEFAULT_COZY_ROOM_STATE,
  DEFAULT_VEHICLE_CONFIG,
  LANDMARKS,
} from './data/efelerData';
import { audioEngine } from './game/audioEngine';
import {
  AgendaNote,
  BuildingNpcDef,
  CameraPreset,
  CozyRoomState,
  ErrandDef,
  ExplorationMode,
  GamePhase,
  LandmarkDef,
  LofiTrackId,
  NpcActionOption,
  PlayerHudSnapshot,
  SeasonType,
  StreetInteractionType,
  TimeOfDay,
  VehicleConfig,
  WeatherType,
} from './types/game';

const ROOM_STORAGE_KEY = 'efeler_cozy_room_v1';
const AGENDA_STORAGE_KEY = 'efeler_agenda_notes_v1';

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

function loadSavedRoomState(): CozyRoomState {
  try {
    const raw = localStorage.getItem(ROOM_STORAGE_KEY);
    if (!raw) return DEFAULT_COZY_ROOM_STATE;
    const parsed = JSON.parse(raw) as Partial<CozyRoomState>;
    return {
      ...DEFAULT_COZY_ROOM_STATE,
      ...parsed,
      avatarPlaced: parsed.avatarPlaced ?? DEFAULT_COZY_ROOM_STATE.avatarPlaced,
      avatarConfig: {
        ...DEFAULT_AVATAR_CONFIG,
        ...(parsed.avatarConfig || {}),
      },
      furniture:
        Array.isArray(parsed.furniture) && parsed.furniture.length > 0
          ? parsed.furniture
          : DEFAULT_COZY_ROOM_STATE.furniture,
    };
  } catch {
    return DEFAULT_COZY_ROOM_STATE;
  }
}

function loadSavedAgendaNotes(): AgendaNote[] {
  try {
    const raw = localStorage.getItem(AGENDA_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as AgendaNote[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export default function App() {
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
  const [activeNpc, setActiveNpc] = useState<BuildingNpcDef | null>(null);
  const [activeNpcIsFirstChat, setActiveNpcIsFirstChat] = useState(false);
  const [chattedNpcIds, setChattedNpcIds] = useState<string[]>([]);
  const [quotaExceeded, setQuotaExceeded] = useState(false);

  const [explorationMode, setExplorationMode] = useState<ExplorationMode>('vehicle');
  const [vehicleConfig, setVehicleConfig] = useState<VehicleConfig>(DEFAULT_VEHICLE_CONFIG);
  const [timeOfDay, setTimeOfDay] = useState<TimeOfDay>('golden');
  const [season, setSeason] = useState<SeasonType>('spring');
  const [weather, setWeather] = useState<WeatherType>('clear');
  const [autoAtmosphere, setAutoAtmosphere] = useState<boolean>(true);
  const [lofiTrack, setLofiTrack] = useState<LofiTrackId>('aegean');
  const [cameraPreset, setCameraPreset] = useState<CameraPreset>('isometric');

  const [cozyRoomState, setCozyRoomState] = useState<CozyRoomState>(loadSavedRoomState);
  const [agendaNotes, setAgendaNotes] = useState<AgendaNote[]>(loadSavedAgendaNotes);

  const [discoveredIds, setDiscoveredIds] = useState<string[]>([]);
  const [coins, setCoins] = useState(0);
  const [lokmaPower, setLokmaPower] = useState(0);
  const [activeErrand, setActiveErrand] = useState<ErrandDef | null>(null);
  const [errandPickedUp, setErrandPickedUp] = useState(false);

  const [hud, setHud] = useState<PlayerHudSnapshot>(INITIAL_HUD);
  const [recentlyDiscovered, setRecentlyDiscovered] = useState<LandmarkDef | null>(null);
  const [errandToast, setErrandToast] = useState<string | null>(null);

  const [isMuted, setIsMuted] = useState(false);
  const [musicEnabled, setMusicEnabled] = useState(true);

  const toastTimerRef = useRef<number | null>(null);

  useEffect(() => {
    try {
      localStorage.setItem(ROOM_STORAGE_KEY, JSON.stringify(cozyRoomState));
    } catch {
      // Ignore storage quota errors
    }
  }, [cozyRoomState]);

  useEffect(() => {
    try {
      localStorage.setItem(AGENDA_STORAGE_KEY, JSON.stringify(agendaNotes));
    } catch {
      // Ignore storage quota errors
    }
  }, [agendaNotes]);

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
        showErrandToast(
          `Görev tamamlandı: ${activeErrand.title} (+${activeErrand.rewardCoins} İncir Puanı)`
        );
        setActiveErrand(null);
        setErrandPickedUp(false);
      }
    },
    [activeErrand, errandPickedUp, showErrandToast]
  );

  const handleInspectSignpost = useCallback(() => {
    showErrandToast(
      'Aydın Antik Kentleri Çok Yakında: Nysa · Aphrodisias · Magnesia · Miletos · Priene rotaları hazırlanıyor!'
    );
  }, [showErrandToast]);

  const handleStreetEvent = useCallback(
    (type: StreetInteractionType) => {
      if (type === 'musicians') {
        showErrandToast(
          'Kent Meydanı’nda Zeybek çalıyor — Efeler halk oyununa başladı!'
        );
      } else if (type === 'lokma') {
        setLokmaPower((p) => p + 1);
        showErrandToast('Bey Camii önünden taze hayır lokması aldınız! +1 Lokma Gücü');
      } else if (type === 'vendor') {
        showErrandToast('“Islak mendil, lif ister misiniz? Buyurun!”');
      }
    },
    [showErrandToast]
  );

  const handleInteractNpc = useCallback(
    (npc: BuildingNpcDef) => {
      audioEngine.init();
      canvasRef.current?.setTouchInput({
        forward: false,
        backward: false,
        left: false,
        right: false,
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
    });
    setJournalOpen(false);
    setRealMapOpen(false);
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
      const typing = document.activeElement?.tagName === 'INPUT';
      if (e.code === 'Escape') {
        if (agendaOpen) {
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
        !activeNpc &&
        !typing
      ) {
        setExplorationMode((m) => (m === 'walk' ? 'vehicle' : 'walk'));
      } else if (
        e.code === 'KeyC' &&
        phase === 'playing' &&
        !inHome &&
        !journalOpen &&
        !realMapOpen &&
        !agendaOpen &&
        !activeNpc &&
        !typing
      ) {
        setCameraPreset((p) => (p === 'first_person' ? 'isometric' : 'first_person'));
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [activeNpc, agendaOpen, inHome, journalOpen, phase, realMapOpen]);

  useEffect(() => {
    return () => {
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
      audioEngine.dispose();
    };
  }, []);

  const effectivePhase: GamePhase =
    (journalOpen || realMapOpen || Boolean(activeNpc)) && phase === 'playing' ? 'paused' : phase;

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
        <EfelerCanvas
          ref={canvasRef}
          phase={effectivePhase}
          explorationMode={explorationMode}
          avatarConfig={cozyRoomState.avatarConfig || DEFAULT_AVATAR_CONFIG}
          vehicleConfig={vehicleConfig}
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
          onEnterHome={handleEnterHome}
        />
      ) : (
        <CozyRoomView
          roomState={cozyRoomState}
          weather={weather}
          lofiTrack={lofiTrack}
          isMuted={isMuted}
          musicEnabled={musicEnabled}
          onChangeRoomState={setCozyRoomState}
          onChangeWeather={handleChangeWeather}
          onChangeLofiTrack={handleChangeLofiTrack}
          onToggleMute={handleToggleMute}
          onToggleMusic={handleToggleMusic}
          onOpenAgenda={() => setAgendaOpen(true)}
          onExitHome={handleExitHome}
        />
      )}

      {phase === 'title' && !inHome && <TitleScreen onStart={handleStartGame} />}

      {phase === 'playing' && !journalOpen && !realMapOpen && !activeNpc && !inHome && (
        <GameHUD
          hud={hud}
          explorationMode={explorationMode}
          vehicleConfig={vehicleConfig}
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
          onEnterHome={handleEnterHome}
          onPause={() => {
            canvasRef.current?.setTouchInput({
              forward: false,
              backward: false,
              left: false,
              right: false,
            });
            setPhase('paused');
          }}
          onDiscoverNearby={() => canvasRef.current?.triggerDiscoverNearby()}
          onHorn={() => canvasRef.current?.triggerHorn()}
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
        <RealAydinMapModal
          onJumpTo3DLandmark={handleNavigateToLandmark}
          onClose={() => setRealMapOpen(false)}
        />
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

      {phase === 'paused' && !journalOpen && !realMapOpen && !activeNpc && !inHome && (
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
