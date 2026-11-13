import { useCallback, useEffect, useRef, useState } from 'react';
import { AgendaModal } from './components/AgendaModal';
import { CozyRoomView } from './components/CozyRoomView';
import { EfelerCanvas, EfelerCanvasHandle } from './components/EfelerCanvas';
import { GameHUD } from './components/GameHUD';
import { JournalModal } from './components/JournalModal';
import { PauseModal } from './components/PauseModal';
import { TitleScreen } from './components/TitleScreen';
import {
  DEFAULT_COZY_ROOM_STATE,
  DEFAULT_VEHICLE_CONFIG,
  LANDMARKS,
} from './data/efelerData';
import { audioEngine } from './game/audioEngine';
import {
  AgendaNote,
  CameraPreset,
  CozyRoomState,
  ErrandDef,
  GamePhase,
  LandmarkDef,
  LofiTrackId,
  PlayerHudSnapshot,
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
  nearAncientSignpost: false,
  nearPlayerHome: false,
  nearbyStreetInteraction: null,
  vendorBubble: null,
  distanceToActiveErrand: null,
  playerPos: [-18, 27],
  headingRad: 0,
};

function loadSavedRoomState(): CozyRoomState {
  try {
    const raw = localStorage.getItem(ROOM_STORAGE_KEY);
    if (!raw) return DEFAULT_COZY_ROOM_STATE;
    const parsed = JSON.parse(raw) as Partial<CozyRoomState>;
    return {
      ...DEFAULT_COZY_ROOM_STATE,
      ...parsed,
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
  const [agendaOpen, setAgendaOpen] = useState(false);

  const [vehicleConfig, setVehicleConfig] = useState<VehicleConfig>(DEFAULT_VEHICLE_CONFIG);
  const [timeOfDay, setTimeOfDay] = useState<TimeOfDay>('golden');
  const [weather, setWeather] = useState<WeatherType>('clear');
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
    }
    canvasRef.current?.teleportTo(tx, tz, heading);
    setJournalOpen(false);
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
    setJournalOpen(false);
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
      if (e.code === 'Escape') {
        if (agendaOpen) {
          setAgendaOpen(false);
        } else if (journalOpen) {
          setJournalOpen(false);
        } else if (inHome) {
          setInHome(false);
        } else if (phase === 'playing') {
          setPhase('paused');
        } else if (phase === 'paused') {
          setPhase('playing');
        }
      } else if (e.code === 'KeyJ' && phase === 'playing' && !inHome) {
        setJournalOpen((o) => !o);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [agendaOpen, inHome, journalOpen, phase]);

  useEffect(() => {
    return () => {
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
      audioEngine.dispose();
    };
  }, []);

  const effectivePhase: GamePhase = journalOpen && phase === 'playing' ? 'paused' : phase;

  return (
    <main className="relative w-screen h-screen overflow-hidden bg-[#181612]">
      {!inHome ? (
        <EfelerCanvas
          ref={canvasRef}
          phase={effectivePhase}
          vehicleConfig={vehicleConfig}
          timeOfDay={timeOfDay}
          weather={weather}
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

      {phase === 'playing' && !journalOpen && !inHome && (
        <GameHUD
          hud={hud}
          vehicleConfig={vehicleConfig}
          timeOfDay={timeOfDay}
          weather={weather}
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
          onChangeVehicleConfig={(next) => {
            audioEngine.init();
            setVehicleConfig(next);
          }}
          onChangeTimeOfDay={setTimeOfDay}
          onChangeWeather={handleChangeWeather}
          onChangeLofiTrack={handleChangeLofiTrack}
          onChangeCameraPreset={setCameraPreset}
          onToggleMute={handleToggleMute}
          onToggleMusic={handleToggleMusic}
          onOpenJournal={() => setJournalOpen(true)}
          onEnterHome={handleEnterHome}
          onPause={() => setPhase('paused')}
          onDiscoverNearby={() => canvasRef.current?.triggerDiscoverNearby()}
          onHorn={() => canvasRef.current?.triggerHorn()}
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

      {agendaOpen && (
        <AgendaModal
          notes={agendaNotes}
          onAddNote={handleAddAgendaNote}
          onToggleNote={handleToggleAgendaNote}
          onDeleteNote={handleDeleteAgendaNote}
          onClose={() => setAgendaOpen(false)}
        />
      )}

      {phase === 'paused' && !journalOpen && !inHome && (
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
