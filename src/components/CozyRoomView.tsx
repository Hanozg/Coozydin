import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import {
  DEFAULT_AVATAR_CONFIG,
  DEFAULT_COZY_ROOM_STATE,
  FURNITURE_CATALOG,
  LOFI_TRACKS,
} from '../data/efelerData';
import { audioEngine } from '../game/audioEngine';
import { AvatarConfig, RoomFurnitureId } from '../types/game';
import {
  CozyRoomViewProps,
  MobileRoomTab,
  NearbyRoomInteractable,
  resolveFurnitureTransform,
  RoomDrawerTab,
} from './room/roomConstants';
import { RoomHudOverlay } from './room/RoomHudOverlay';
import { mountCozyRoomScene } from './room/roomSceneBuilder';

export function CozyRoomView({
  roomState,
  houseExterior,
  lokmaPower,
  unlockedFurnitureStyles,
  weather,
  lofiTrack,
  isMuted,
  musicEnabled,
  onChangeRoomState,
  onChangeHouseExterior,
  onPurchaseFurnitureStyle,
  onChangeWeather,
  onChangeLofiTrack,
  onToggleMute,
  onToggleMusic,
  onOpenAgenda,
  onExitHome,
}: CozyRoomViewProps) {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [placementMode, setPlacementMode] = useState(false);
  const [selectedFurniture, setSelectedFurniture] = useState<RoomFurnitureId>('armchair');
  const [shopFilter, setShopFilter] = useState<RoomFurnitureId | 'all'>('all');
  const [drawerTab, setDrawerTab] = useState<RoomDrawerTab>('furniture');
  const [roomDockCollapsed, setRoomDockCollapsed] = useState(false);
  const [mobileRoomTab, setMobileRoomTab] = useState<MobileRoomTab>('room');
  const [roomToast, setRoomToast] = useState<string | null>(null);
  const [nearbyInteractable, setNearbyInteractable] = useState<NearbyRoomInteractable | null>(null);
  const [isSitting, setIsSitting] = useState(false);
  const [touchPadOpen, setTouchPadOpen] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(pointer: coarse)').matches || window.innerWidth < 768;
  });

  const toggleRoomTab = (tab: RoomDrawerTab) => {
    if (editOpen && drawerTab === tab) {
      setEditOpen(false);
    } else {
      setDrawerTab(tab);
      setEditOpen(true);
      setPlacementMode(false);
    }
  };

  const avatarConfig: AvatarConfig = {
    ...DEFAULT_AVATAR_CONFIG,
    ...(roomState.avatarConfig || {}),
  };
  const avatarPlaced = roomState.avatarPlaced ?? true;

  const roomStateRef = useRef(roomState);
  const weatherRef = useRef(weather);
  const lofiTrackRef = useRef(lofiTrack);
  const placementModeRef = useRef(placementMode);
  const selectedFurnitureRef = useRef(selectedFurniture);
  const isSittingRef = useRef(isSitting);

  roomStateRef.current = roomState;
  weatherRef.current = weather;
  lofiTrackRef.current = lofiTrack;
  placementModeRef.current = placementMode;
  selectedFurnitureRef.current = selectedFurniture;
  isSittingRef.current = isSitting;

  const onChangeRoomStateRef = useRef(onChangeRoomState);
  onChangeRoomStateRef.current = onChangeRoomState;
  const callbacksRef = useRef({
    onOpenAgenda,
    onChangeRoomState,
    onChangeLofiTrack,
  });
  callbacksRef.current = {
    onOpenAgenda,
    onChangeRoomState,
    onChangeLofiTrack,
  };

  const avatarWalkRef = useRef({
    x: 0.2,
    z: 1.5,
    rotY: Math.PI,
    targetX: null as number | null,
    targetZ: null as number | null,
  });

  const touchMoveRef = useRef({
    up: false,
    down: false,
    left: false,
    right: false,
    joyX: 0,
    joyY: 0,
  });

  const petBounceRef = useRef({ cat: 0, dog: 0 });
  const teaSipRef = useRef(0);
  const toastTimerRef = useRef<number | null>(null);

  const showToast = (msg: string) => {
    setRoomToast(msg);
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    toastTimerRef.current = window.setTimeout(() => setRoomToast(null), 2800);
  };
  const showToastRef = useRef(showToast);
  showToastRef.current = showToast;

  useEffect(() => {
    return () => {
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    };
  }, []);

  const triggerInteractionRef = useRef<(id: NearbyRoomInteractable['id']) => void>(() => {});
  triggerInteractionRef.current = (id: NearbyRoomInteractable['id']) => {
    const st = roomStateRef.current;
    if (id === 'armchair') {
      const nextSit = !isSittingRef.current;
      setIsSitting(nextSit);
      if (nextSit) {
        const tf = resolveFurnitureTransform(
          'armchair',
          st.furniture.find((f) => f.id === 'armchair')
        );
        avatarWalkRef.current.x = tf.x + Math.sin(tf.rotY) * 0.14;
        avatarWalkRef.current.z = tf.z + Math.cos(tf.rotY) * 0.14;
        avatarWalkRef.current.rotY = tf.rotY;
        avatarWalkRef.current.targetX = null;
        avatarWalkRef.current.targetZ = null;
        audioEngine.playDiscoveryChime();
        showToast('Okuma koltuğuna yerleştin, kitabını ve çayını keyifle yudumla!');
      } else {
        const tf = resolveFurnitureTransform(
          'armchair',
          st.furniture.find((f) => f.id === 'armchair')
        );
        avatarWalkRef.current.x = THREE.MathUtils.clamp(
          tf.x + Math.sin(tf.rotY) * 0.9,
          -3.25,
          3.25
        );
        avatarWalkRef.current.z = THREE.MathUtils.clamp(
          tf.z + Math.cos(tf.rotY) * 0.9,
          -3.25,
          3.25
        );
        showToast('Koltuktan kalktın.');
      }
    } else if (id === 'desk') {
      audioEngine.playDiscoveryChime();
      callbacksRef.current.onOpenAgenda();
    } else if (id === 'turntable') {
      const idx = LOFI_TRACKS.findIndex((t) => t.id === lofiTrackRef.current);
      const nextTrack = LOFI_TRACKS[(idx + 1) % LOFI_TRACKS.length];
      callbacksRef.current.onChangeLofiTrack(nextTrack.id);
      showToast(`Pikap plağı değişti: ${nextTrack.label}`);
    } else if (id === 'teatable') {
      teaSipRef.current = 1.0;
      audioEngine.playDiscoveryChime();
      showToast('Tavşan kanı Ege çayı yudumlandı — zihnin dinlendi!');
    } else if (id === 'bookshelf') {
      const notes = [
        'Kitaplıktan not: “Tralleis Antik Kenti’ndeki Üç Gözler MS 2. yüzyıldan kalmadır.”',
        'Kitaplıktan not: “Aydın inciri güneşte kurutulur ve Ege rüzgarıyla tatlanır.”',
        'Kitaplıktan not: “Zeybek oyunu Efeler’in vakar ve dinginliğini simgeler.”',
      ];
      showToast(notes[Math.floor(Math.random() * notes.length)]);
    } else if (id === 'cat') {
      petBounceRef.current.cat = 1.0;
      audioEngine.playPetSound('cat');
      const nextAff = st.petAffection + 1;
      callbacksRef.current.onChangeRoomState({ ...st, petAffection: nextAff });
      showToast(`Pamuk (Kedi) mırıldandı! · Sevgi Puanı: ${nextAff}`);
    } else if (id === 'dog') {
      petBounceRef.current.dog = 1.0;
      audioEngine.playPetSound('dog');
      const nextAff = st.petAffection + 1;
      callbacksRef.current.onChangeRoomState({ ...st, petAffection: nextAff });
      showToast(`Efe (Köpek) neşeyle kuyruk salladı! · Sevgi Puanı: ${nextAff}`);
    }
  };

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    return mountCozyRoomScene({
      container,
      roomStateRef,
      weatherRef,
      placementModeRef,
      selectedFurnitureRef,
      isSittingRef,
      avatarWalkRef,
      touchMoveRef,
      petBounceRef,
      teaSipRef,
      triggerInteractionRef,
      onChangeRoomStateRef,
      onSelectFurniture: setSelectedFurniture,
      onSetIsSitting: setIsSitting,
      onSetNearbyInteractable: setNearbyInteractable,
      onShowToast: (msg) => showToastRef.current(msg),
    });
  }, []);

  const toggleFurniture = (id: RoomFurnitureId) => {
    onChangeRoomState({
      ...roomState,
      furniture: roomState.furniture.map((f) =>
        f.id === id ? { ...f, enabled: !f.enabled } : f
      ),
    });
  };

  const cycleFurnitureSlot = (id: RoomFurnitureId) => {
    onChangeRoomState({
      ...roomState,
      furniture: roomState.furniture.map((f) =>
        f.id === id
          ? {
              ...f,
              slotIndex: (f.slotIndex + 1) % 3,
              x: undefined,
              z: undefined,
              rotY: undefined,
              enabled: true,
            }
          : f
      ),
    });
  };

  const rotateFurniture = (id: RoomFurnitureId) => {
    onChangeRoomState({
      ...roomState,
      furniture: roomState.furniture.map((f) => {
        if (f.id !== id) return f;
        const cur = resolveFurnitureTransform(f.id, f);
        return { ...f, rotY: cur.rotY + Math.PI / 4, enabled: true };
      }),
    });
  };

  const resetRoomLayout = () => {
    onChangeRoomState({
      ...roomState,
      furniture: DEFAULT_COZY_ROOM_STATE.furniture.map((item) => ({ ...item })),
    });
    showToast('Oda eşya düzeni varsayılana sıfırlandı.');
  };

  const updateAvatarConfig = (patch: Partial<AvatarConfig>) => {
    onChangeRoomState({
      ...roomState,
      avatarPlaced: true,
      avatarConfig: { ...avatarConfig, ...patch },
    });
  };

  const selectedLabel =
    FURNITURE_CATALOG.find((c) => c.id === selectedFurniture)?.label || 'Eşya';

  return (
    <div className="relative w-full h-full">
      <div ref={mountRef} className="w-full h-full" />

      <RoomHudOverlay
        roomState={roomState}
        houseExterior={houseExterior}
        lokmaPower={lokmaPower}
        unlockedFurnitureStyles={unlockedFurnitureStyles}
        weather={weather}
        lofiTrack={lofiTrack}
        isMuted={isMuted}
        musicEnabled={musicEnabled}
        editOpen={editOpen}
        placementMode={placementMode}
        selectedFurniture={selectedFurniture}
        shopFilter={shopFilter}
        drawerTab={drawerTab}
        roomDockCollapsed={roomDockCollapsed}
        mobileRoomTab={mobileRoomTab}
        roomToast={roomToast}
        nearbyInteractable={nearbyInteractable}
        touchPadOpen={touchPadOpen}
        avatarConfig={avatarConfig}
        avatarPlaced={avatarPlaced}
        selectedLabel={selectedLabel}
        onSetEditOpen={setEditOpen}
        onSetPlacementMode={setPlacementMode}
        onTogglePlacementMode={() => {
          setPlacementMode((v) => !v);
          setEditOpen(false);
        }}
        onSetSelectedFurniture={setSelectedFurniture}
        onSetShopFilter={setShopFilter}
        onSetDrawerTab={setDrawerTab}
        onToggleRoomTab={toggleRoomTab}
        onToggleDockCollapsed={() => setRoomDockCollapsed((v) => !v)}
        onSetMobileRoomTab={setMobileRoomTab}
        onToggleTouchPad={() =>
          setTouchPadOpen((v) => {
            if (v) {
              touchMoveRef.current.joyX = 0;
              touchMoveRef.current.joyY = 0;
            }
            return !v;
          })
        }
        onJoystickChange={(x, y) => {
          touchMoveRef.current.joyX = x;
          touchMoveRef.current.joyY = y;
        }}
        onTriggerNearbyInteraction={(id) => triggerInteractionRef.current(id)}
        onToggleFurniture={toggleFurniture}
        onCycleFurnitureSlot={cycleFurnitureSlot}
        onRotateFurniture={rotateFurniture}
        onResetRoomLayout={resetRoomLayout}
        onToggleAvatarPlaced={() => {
          const nextPlaced = !avatarPlaced;
          if (nextPlaced) {
            avatarWalkRef.current.x = 0.2;
            avatarWalkRef.current.z = 1.5;
            avatarWalkRef.current.targetX = null;
            avatarWalkRef.current.targetZ = null;
          }
          onChangeRoomState({ ...roomState, avatarPlaced: nextPlaced });
        }}
        onUpdateAvatarConfig={updateAvatarConfig}
        onChangeRoomState={onChangeRoomState}
        onChangeHouseExterior={onChangeHouseExterior}
        onPurchaseFurnitureStyle={onPurchaseFurnitureStyle}
        onChangeWeather={onChangeWeather}
        onChangeLofiTrack={onChangeLofiTrack}
        onToggleMute={onToggleMute}
        onToggleMusic={onToggleMusic}
        onOpenAgenda={onOpenAgenda}
        onExitHome={onExitHome}
        onShowToast={showToast}
      />
    </div>
  );
}
