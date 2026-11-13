import { type PointerEvent as ReactPointerEvent, useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  Calendar,
  CloudRain,
  Coffee,
  DoorOpen,
  Gamepad2,
  Heart,
  LampDesk,
  Move,
  Music,
  Paintbrush,
  PawPrint,
  RotateCcw,
  RotateCw,
  Sparkles,
  User,
  Volume2,
  VolumeX,
} from 'lucide-react';
import {
  AVATAR_HAIR_STYLES,
  AVATAR_SHIRT_SWATCHES,
  AVATAR_SKIN_SWATCHES,
  DEFAULT_AVATAR_CONFIG,
  DEFAULT_COZY_ROOM_STATE,
  FURNITURE_CATALOG,
  LOFI_TRACKS,
  ROOM_WALL_SWATCHES,
  WEATHER_OPTIONS,
} from '../data/efelerData';
import { audioEngine } from '../game/audioEngine';
import {
  avatarConfigToAppearance,
  createSculptedHumanRig,
  SculptedHumanRig,
} from '../game/sculptedHumans';
import {
  AvatarConfig,
  CozyRoomState,
  LofiTrackId,
  PetType,
  RoomFurnitureId,
  WeatherType,
} from '../types/game';

interface CozyRoomViewProps {
  roomState: CozyRoomState;
  weather: WeatherType;
  lofiTrack: LofiTrackId;
  isMuted: boolean;
  musicEnabled: boolean;
  onChangeRoomState: (next: CozyRoomState) => void;
  onChangeWeather: (next: WeatherType) => void;
  onChangeLofiTrack: (next: LofiTrackId) => void;
  onToggleMute: () => void;
  onToggleMusic: () => void;
  onOpenAgenda: () => void;
  onExitHome: () => void;
}

type NearbyRoomInteractable = {
  id: 'armchair' | 'desk' | 'turntable' | 'teatable' | 'bookshelf' | 'cat' | 'dog';
  label: string;
};

function detectSoftwareWebGL(): boolean {
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

const SLOT_COORDS: Record<RoomFurnitureId, [number, number, number][]> = {
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

const SLOT_ROTATIONS: Record<RoomFurnitureId, number[]> = {
  armchair: [0.55, -0.55, 1.25],
  desk: [0, 0, -Math.PI / 2],
  bookshelf: [Math.PI / 2, Math.PI / 2, 0],
  rug: [0, 0.15, -0.15],
  plant: [0, 0.8, 1.6],
  turntable: [-Math.PI / 2, Math.PI / 2, Math.PI],
  teatable: [0, 0.4, -0.3],
  wallart: [0, 0, 0],
};

const FURNITURE_RADII: Partial<Record<RoomFurnitureId, number>> = {
  armchair: 0.72,
  desk: 0.92,
  bookshelf: 0.65,
  plant: 0.48,
  turntable: 0.55,
  teatable: 0.62,
};

function resolveFurnitureTransform(
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

function createCatRig(): {
  group: THREE.Group;
  tail: THREE.Mesh;
  hitMesh: THREE.Mesh;
} {
  const group = new THREE.Group();
  const furMat = new THREE.MeshStandardMaterial({ color: 0xd9904b, roughness: 0.78 });
  const creamMat = new THREE.MeshStandardMaterial({ color: 0xf4e7d3, roughness: 0.82 });
  const darkMat = new THREE.MeshStandardMaterial({ color: 0x241d18, roughness: 0.5 });

  const body = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.3, 0.62), furMat);
  body.position.y = 0.24;
  body.castShadow = true;
  group.add(body);

  const chest = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.22, 0.18), creamMat);
  chest.position.set(0, 0.22, 0.28);
  group.add(chest);

  const head = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.3, 0.32), furMat);
  head.position.set(0, 0.45, 0.34);
  head.castShadow = true;
  group.add(head);

  const earGeo = new THREE.ConeGeometry(0.08, 0.16, 4);
  [-0.1, 0.1].forEach((ex) => {
    const ear = new THREE.Mesh(earGeo, furMat);
    ear.position.set(ex, 0.64, 0.32);
    ear.rotation.y = Math.PI / 4;
    group.add(ear);
  });

  [-0.08, 0.08].forEach((ex) => {
    const eye = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.05, 0.03), darkMat);
    eye.position.set(ex, 0.47, 0.5);
    group.add(eye);
  });

  const tail = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.05, 0.42, 8), furMat);
  tail.position.set(0, 0.42, -0.34);
  tail.rotation.x = -0.6;
  group.add(tail);

  const hitMesh = new THREE.Mesh(
    new THREE.BoxGeometry(0.8, 0.9, 0.95),
    new THREE.MeshBasicMaterial({ visible: false })
  );
  hitMesh.position.y = 0.4;
  hitMesh.userData.roomAction = 'pet-cat';
  group.add(hitMesh);

  return { group, tail, hitMesh };
}

function createDogRig(): {
  group: THREE.Group;
  tail: THREE.Mesh;
  hitMesh: THREE.Mesh;
} {
  const group = new THREE.Group();
  const furMat = new THREE.MeshStandardMaterial({ color: 0xc29864, roughness: 0.8 });
  const earMat = new THREE.MeshStandardMaterial({ color: 0x6f4a2e, roughness: 0.82 });
  const collarMat = new THREE.MeshStandardMaterial({ color: 0xb64b36, roughness: 0.6 });
  const darkMat = new THREE.MeshStandardMaterial({ color: 0x221b17, roughness: 0.5 });

  const body = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.36, 0.78), furMat);
  body.position.y = 0.34;
  body.castShadow = true;
  group.add(body);

  [
    [-0.15, 0.14, 0.26],
    [0.15, 0.14, 0.26],
    [-0.15, 0.14, -0.26],
    [0.15, 0.14, -0.26],
  ].forEach(([lx, ly, lz]) => {
    const leg = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.28, 0.11), furMat);
    leg.position.set(lx, ly, lz);
    group.add(leg);
  });

  const collar = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.08, 0.16), collarMat);
  collar.position.set(0, 0.44, 0.36);
  group.add(collar);

  const head = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.34, 0.38), furMat);
  head.position.set(0, 0.58, 0.46);
  head.castShadow = true;
  group.add(head);

  const snout = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.16, 0.18), furMat);
  snout.position.set(0, 0.52, 0.68);
  group.add(snout);

  const nose = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.06, 0.05), darkMat);
  nose.position.set(0, 0.57, 0.77);
  group.add(nose);

  [-0.21, 0.21].forEach((ex) => {
    const ear = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.24, 0.16), earMat);
    ear.position.set(ex, 0.56, 0.42);
    group.add(ear);
  });

  [-0.09, 0.09].forEach((ex) => {
    const eye = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.05, 0.03), darkMat);
    eye.position.set(ex, 0.63, 0.65);
    group.add(eye);
  });

  const tail = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.05, 0.38, 8), furMat);
  tail.position.set(0, 0.5, -0.42);
  tail.rotation.x = -0.65;
  group.add(tail);

  const hitMesh = new THREE.Mesh(
    new THREE.BoxGeometry(0.9, 1.0, 1.1),
    new THREE.MeshBasicMaterial({ visible: false })
  );
  hitMesh.position.y = 0.45;
  hitMesh.userData.roomAction = 'pet-dog';
  group.add(hitMesh);

  return { group, tail, hitMesh };
}

interface AvatarRig {
  root: THREE.Group;
  rig: SculptedHumanRig;
  applyConfig: (cfg: AvatarConfig) => void;
}

function createAvatarRig(initial: AvatarConfig): AvatarRig {
  const rig = createSculptedHumanRig(avatarConfigToAppearance(initial), {
    scale: 0.138,
    forwardIsNegZ: false,
  });

  const shadowMat = new THREE.MeshBasicMaterial({
    color: 0x1e150e,
    transparent: true,
    opacity: 0.28,
    depthWrite: false,
  });
  const shadow = new THREE.Mesh(new THREE.CircleGeometry(0.36, 18), shadowMat);
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.y = 0.025;
  rig.root.add(shadow);

  return {
    root: rig.root,
    rig,
    applyConfig: (cfg: AvatarConfig) => {
      rig.applyAppearance(avatarConfigToAppearance(cfg));
    },
  };
}

export function CozyRoomView({
  roomState,
  weather,
  lofiTrack,
  isMuted,
  musicEnabled,
  onChangeRoomState,
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
  const [drawerTab, setDrawerTab] = useState<
    'furniture' | 'avatar' | 'style' | 'pets' | 'atmosphere'
  >('furniture');
  const [roomToast, setRoomToast] = useState<string | null>(null);
  const [nearbyInteractable, setNearbyInteractable] = useState<NearbyRoomInteractable | null>(null);
  const [isSitting, setIsSitting] = useState(false);
  const [touchPadOpen, setTouchPadOpen] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(pointer: coarse)').matches || window.innerWidth < 768;
  });

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
  });

  const petBounceRef = useRef({ cat: 0, dog: 0 });
  const teaSipRef = useRef(0);
  const toastTimerRef = useRef<number | null>(null);

  const showToast = (msg: string) => {
    setRoomToast(msg);
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    toastTimerRef.current = window.setTimeout(() => setRoomToast(null), 2800);
  };

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
        avatarWalkRef.current.x = tf.x;
        avatarWalkRef.current.z = tf.z + Math.cos(tf.rotY) * 0.08;
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
        avatarWalkRef.current.x = tf.x + Math.sin(tf.rotY) * 0.9;
        avatarWalkRef.current.z = tf.z + Math.cos(tf.rotY) * 0.9;
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

    const isSoftwareGl = detectSoftwareWebGL();
    const renderer = new THREE.WebGLRenderer({
      antialias: !isSoftwareGl,
      powerPreference: 'high-performance',
    });
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.06;
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = !isSoftwareGl;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.domElement.style.display = 'block';
    renderer.domElement.style.width = '100%';
    renderer.domElement.style.height = '100%';
    renderer.domElement.style.touchAction = 'none';
    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#271E17');

    const pmrem = new THREE.PMREMGenerator(renderer);
    const envRT = pmrem.fromScene(new RoomEnvironment(), 0.04);
    scene.environment = envRT.texture;
    pmrem.dispose();

    const getRoomFrustum = (asp: number) =>
      asp < 1 ? 10.2 / Math.max(0.65, Math.pow(asp, 0.45)) : 10.2;

    const aspect = container.clientWidth / Math.max(1, container.clientHeight);
    const initialFrustum = getRoomFrustum(aspect);
    const camera = new THREE.OrthographicCamera(
      (-initialFrustum * aspect) / 2,
      (initialFrustum * aspect) / 2,
      initialFrustum / 2,
      -initialFrustum / 2,
      -40,
      80
    );
    camera.position.set(11.5, 9.6, 11.5);
    camera.lookAt(0, 1.3, 0);

    const hemiLight = new THREE.HemisphereLight(0xf6ead6, 0x4b3b2e, 0.7);
    scene.add(hemiLight);

    const keyLight = new THREE.DirectionalLight(0xffe5bd, 1.15);
    keyLight.position.set(8, 12, 9);
    keyLight.castShadow = !isSoftwareGl;
    keyLight.shadow.mapSize.set(1024, 1024);
    scene.add(keyLight);

    const lampPoint = new THREE.PointLight(0xffb86b, 4.5, 11, 1.6);
    lampPoint.position.set(2.1, 1.9, -2.5);
    scene.add(lampPoint);

    const windowFill = new THREE.DirectionalLight(0xa3c4eb, 0.55);
    windowFill.position.set(-7, 6, -4);
    scene.add(windowFill);

    // Room Shell
    const roomGroup = new THREE.Group();
    scene.add(roomGroup);

    const floorMat = new THREE.MeshStandardMaterial({ color: 0xa67a50, roughness: 0.78 });
    const floor = new THREE.Mesh(new THREE.BoxGeometry(8.2, 0.35, 8.2), floorMat);
    floor.position.set(0, -0.175, 0);
    floor.receiveShadow = true;
    roomGroup.add(floor);

    // Invisible Floor Raycast Plane at y = 0 for click-to-walk & click-to-place furniture
    const floorHitPlane = new THREE.Mesh(
      new THREE.PlaneGeometry(7.6, 7.6),
      new THREE.MeshBasicMaterial({ visible: false })
    );
    floorHitPlane.rotation.x = -Math.PI / 2;
    floorHitPlane.position.y = 0.02;
    roomGroup.add(floorHitPlane);

    const wallMat = new THREE.MeshStandardMaterial({ color: '#EADEC9', roughness: 0.88 });
    const trimMat = new THREE.MeshStandardMaterial({ color: 0x5d432f, roughness: 0.72 });

    const backWall = new THREE.Mesh(new THREE.BoxGeometry(8.2, 4.4, 0.32), wallMat);
    backWall.position.set(0, 2.2, -3.94);
    backWall.receiveShadow = true;
    roomGroup.add(backWall);

    const leftWall = new THREE.Mesh(new THREE.BoxGeometry(0.32, 4.4, 8.2), wallMat);
    leftWall.position.set(-3.94, 2.2, 0);
    leftWall.receiveShadow = true;
    roomGroup.add(leftWall);

    const baseBack = new THREE.Mesh(new THREE.BoxGeometry(8.0, 0.22, 0.08), trimMat);
    baseBack.position.set(0, 0.11, -3.76);
    const baseLeft = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.22, 8.0), trimMat);
    baseLeft.position.set(-3.76, 0.11, 0);
    roomGroup.add(baseBack, baseLeft);

    // Cozy Window on Back Wall looking out into Aydın weather
    const windowFrame = new THREE.Mesh(new THREE.BoxGeometry(2.2, 1.9, 0.16), trimMat);
    windowFrame.position.set(-1.35, 2.45, -3.74);
    roomGroup.add(windowFrame);

    const windowSkyMat = new THREE.MeshBasicMaterial({ color: 0x89b3d9 });
    const windowSky = new THREE.Mesh(new THREE.PlaneGeometry(1.92, 1.62), windowSkyMat);
    windowSky.position.set(-1.35, 2.45, -3.65);
    roomGroup.add(windowSky);

    const mullionV = new THREE.Mesh(new THREE.BoxGeometry(0.08, 1.65, 0.12), trimMat);
    mullionV.position.set(-1.35, 2.45, -3.62);
    const mullionH = new THREE.Mesh(new THREE.BoxGeometry(1.95, 0.08, 0.12), trimMat);
    mullionH.position.set(-1.35, 2.45, -3.62);
    roomGroup.add(mullionV, mullionH);

    // Mini Weather Particles inside Window Pane
    const winDropCount = 36;
    const winDropGeo = new THREE.BoxGeometry(0.03, 0.18, 0.02);
    const winDropMat = new THREE.MeshBasicMaterial({ color: 0xe6f2ff });
    const winDrops = new THREE.InstancedMesh(winDropGeo, winDropMat, winDropCount);
    winDrops.frustumCulled = false;
    roomGroup.add(winDrops);
    const winDropState = Array.from({ length: winDropCount }, () => ({
      x: (Math.random() - 0.5) * 1.75,
      y: (Math.random() - 0.5) * 1.45,
      speed: 0.7 + Math.random() * 0.5,
      phase: Math.random() * Math.PI * 2,
    }));
    const wDummy = new THREE.Object3D();

    // Selection & Walk Target Floor Rings
    const selectionRing = new THREE.Mesh(
      new THREE.RingGeometry(0.68, 0.84, 32),
      new THREE.MeshBasicMaterial({ color: 0xe39b38, side: THREE.DoubleSide })
    );
    selectionRing.rotation.x = -Math.PI / 2;
    selectionRing.position.y = 0.045;
    selectionRing.visible = false;
    roomGroup.add(selectionRing);

    const walkMarker = new THREE.Mesh(
      new THREE.RingGeometry(0.24, 0.34, 24),
      new THREE.MeshBasicMaterial({ color: 0x61b88a, side: THREE.DoubleSide })
    );
    walkMarker.rotation.x = -Math.PI / 2;
    walkMarker.position.y = 0.04;
    walkMarker.visible = false;
    roomGroup.add(walkMarker);

    // 8 Customizable Furniture Pieces
    const woodMat = new THREE.MeshStandardMaterial({ color: 0x735036, roughness: 0.76 });
    const fabricMat = new THREE.MeshStandardMaterial({ color: 0x9b4f3a, roughness: 0.85 });
    const cushionMat = new THREE.MeshStandardMaterial({ color: 0xe6d4b5, roughness: 0.86 });
    const rugMat = new THREE.MeshStandardMaterial({ color: 0x9e4738, roughness: 0.92 });
    const brassMat = new THREE.MeshStandardMaterial({ color: 0xd4a857, roughness: 0.35, metalness: 0.65 });
    const lampShadeMat = new THREE.MeshStandardMaterial({
      color: 0xf4deb3,
      emissive: 0xffb764,
      emissiveIntensity: 1.1,
      roughness: 0.6,
    });

    const clickables: THREE.Object3D[] = [];
    const furnitureHitMeshes: THREE.Mesh[] = [];
    const furnitureGroups: Record<RoomFurnitureId, THREE.Group> = {
      armchair: new THREE.Group(),
      desk: new THREE.Group(),
      bookshelf: new THREE.Group(),
      rug: new THREE.Group(),
      plant: new THREE.Group(),
      turntable: new THREE.Group(),
      teatable: new THREE.Group(),
      wallart: new THREE.Group(),
    };

    const addFurnitureHitbox = (id: RoomFurnitureId, w: number, h: number, d: number, y: number) => {
      const hit = new THREE.Mesh(
        new THREE.BoxGeometry(w, h, d),
        new THREE.MeshBasicMaterial({ visible: false })
      );
      hit.position.y = y;
      hit.userData.furnitureId = id;
      furnitureGroups[id].add(hit);
      furnitureHitMeshes.push(hit);
      return hit;
    };

    // 1. Armchair
    {
      const g = furnitureGroups.armchair;
      const seat = new THREE.Mesh(new THREE.BoxGeometry(1.15, 0.42, 1.05), fabricMat);
      seat.position.y = 0.3;
      seat.castShadow = true;
      const back = new THREE.Mesh(new THREE.BoxGeometry(1.15, 0.85, 0.25), fabricMat);
      back.position.set(0, 0.72, -0.4);
      back.castShadow = true;
      [-0.5, 0.5].forEach((ax) => {
        const arm = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.55, 1.02), fabricMat);
        arm.position.set(ax, 0.46, 0);
        g.add(arm);
      });
      const pillow = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.38, 0.16), cushionMat);
      pillow.position.set(0, 0.62, -0.2);
      pillow.rotation.x = -0.25;
      g.add(seat, back, pillow);
      const hit = addFurnitureHitbox('armchair', 1.25, 1.15, 1.15, 0.58);
      hit.userData.roomAction = 'armchair';
      clickables.push(hit);
    }

    // 2. Desk + Open Agenda + Desk Lamp
    {
      const g = furnitureGroups.desk;
      const top = new THREE.Mesh(new THREE.BoxGeometry(1.85, 0.1, 0.92), woodMat);
      top.position.y = 0.88;
      top.castShadow = true;
      [
        [-0.82, 0.44, -0.36],
        [0.82, 0.44, -0.36],
        [-0.82, 0.44, 0.36],
        [0.82, 0.44, 0.36],
      ].forEach(([lx, ly, lz]) => {
        const leg = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.88, 0.1), woodMat);
        leg.position.set(lx, ly, lz);
        g.add(leg);
      });

      const agendaCover = new THREE.Mesh(
        new THREE.BoxGeometry(0.58, 0.04, 0.4),
        new THREE.MeshStandardMaterial({ color: 0x3b6e8c, roughness: 0.7 })
      );
      agendaCover.position.set(-0.22, 0.95, 0.08);
      const agendaPages = new THREE.Mesh(
        new THREE.BoxGeometry(0.52, 0.05, 0.36),
        new THREE.MeshStandardMaterial({ color: 0xf7efe0, roughness: 0.85 })
      );
      agendaPages.position.set(-0.22, 0.96, 0.08);
      const agendaHit = new THREE.Mesh(
        new THREE.BoxGeometry(0.75, 0.35, 0.6),
        new THREE.MeshBasicMaterial({ visible: false })
      );
      agendaHit.position.set(-0.22, 1.05, 0.08);
      agendaHit.userData.roomAction = 'agenda';
      clickables.push(agendaHit);

      const lampBase = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.16, 0.08, 12), brassMat);
      lampBase.position.set(0.58, 0.97, -0.18);
      const lampNeck = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.45, 8), brassMat);
      lampNeck.position.set(0.58, 1.2, -0.18);
      const lampShade = new THREE.Mesh(new THREE.ConeGeometry(0.24, 0.25, 14), lampShadeMat);
      lampShade.position.set(0.58, 1.45, -0.18);
      const lampHit = new THREE.Mesh(
        new THREE.BoxGeometry(0.5, 0.75, 0.5),
        new THREE.MeshBasicMaterial({ visible: false })
      );
      lampHit.position.set(0.58, 1.25, -0.18);
      lampHit.userData.roomAction = 'lamp';
      clickables.push(lampHit);

      g.add(top, agendaCover, agendaPages, agendaHit, lampBase, lampNeck, lampShade, lampHit);
      addFurnitureHitbox('desk', 1.9, 1.2, 1.0, 0.6);
    }

    // 3. Bookshelf
    {
      const g = furnitureGroups.bookshelf;
      const frame = new THREE.Mesh(new THREE.BoxGeometry(1.4, 2.35, 0.44), woodMat);
      frame.position.y = 1.175;
      frame.castShadow = true;
      g.add(frame);

      const bookColors = [0xb64b36, 0x3b6e8c, 0x586f4e, 0xd4a857, 0x7b4c65];
      for (let shelf = 0; shelf < 3; shelf++) {
        const sy = 0.52 + shelf * 0.68;
        for (let b = 0; b < 5; b++) {
          const book = new THREE.Mesh(
            new THREE.BoxGeometry(0.14, 0.36 + ((b + shelf) % 2) * 0.08, 0.28),
            new THREE.MeshStandardMaterial({
              color: bookColors[(b + shelf * 2) % bookColors.length],
              roughness: 0.75,
            })
          );
          book.position.set(-0.42 + b * 0.2, sy, 0.14);
          g.add(book);
        }
      }
      const hit = addFurnitureHitbox('bookshelf', 1.5, 2.3, 0.6, 1.15);
      hit.userData.roomAction = 'bookshelf';
      clickables.push(hit);
    }

    // 4. Woven Aegean Rug
    {
      const g = furnitureGroups.rug;
      const outer = new THREE.Mesh(new THREE.BoxGeometry(3.5, 0.03, 2.5), rugMat);
      outer.receiveShadow = true;
      const inner = new THREE.Mesh(new THREE.BoxGeometry(2.7, 0.036, 1.8), cushionMat);
      const center = new THREE.Mesh(
        new THREE.BoxGeometry(1.3, 0.04, 0.9),
        new THREE.MeshStandardMaterial({ color: 0x3b6e8c, roughness: 0.9 })
      );
      g.add(outer, inner, center);
      addFurnitureHitbox('rug', 3.4, 0.2, 2.4, 0.08);
    }

    // 5. Olive Tree in Terracotta Pot
    {
      const g = furnitureGroups.plant;
      const pot = new THREE.Mesh(
        new THREE.CylinderGeometry(0.34, 0.24, 0.52, 12),
        new THREE.MeshStandardMaterial({ color: 0xb66041, roughness: 0.85 })
      );
      pot.position.y = 0.26;
      pot.castShadow = true;
      const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.09, 0.95, 8), woodMat);
      trunk.position.y = 0.85;
      const crown = new THREE.Mesh(
        new THREE.IcosahedronGeometry(0.56, 1),
        new THREE.MeshStandardMaterial({ color: 0x677e56, roughness: 0.84 })
      );
      crown.position.y = 1.48;
      crown.castShadow = true;
      g.add(pot, trunk, crown);
      addFurnitureHitbox('plant', 0.9, 1.9, 0.9, 0.95);
    }

    // 6. Lo-Fi Turntable & Vinyl Stand
    let vinylDisc: THREE.Mesh;
    {
      const g = furnitureGroups.turntable;
      const cabinet = new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.88, 0.56), woodMat);
      cabinet.position.y = 0.44;
      cabinet.castShadow = true;
      const deck = new THREE.Mesh(
        new THREE.BoxGeometry(0.68, 0.09, 0.44),
        new THREE.MeshStandardMaterial({ color: 0x2a241f, roughness: 0.55 })
      );
      deck.position.set(0, 0.92, 0);
      vinylDisc = new THREE.Mesh(
        new THREE.CylinderGeometry(0.18, 0.18, 0.02, 20),
        new THREE.MeshStandardMaterial({ color: 0x161618, roughness: 0.3 })
      );
      vinylDisc.position.set(-0.06, 0.98, 0);
      const label = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.025, 14), brassMat);
      label.position.set(-0.06, 0.985, 0);
      const hit = addFurnitureHitbox('turntable', 1.0, 1.25, 0.65, 0.65);
      hit.userData.roomAction = 'turntable';
      clickables.push(hit);
      g.add(cabinet, deck, vinylDisc, label);
    }

    // 7. Turkish Tea Tray Table
    {
      const g = furnitureGroups.teatable;
      const table = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.55, 0.08, 16), woodMat);
      table.position.y = 0.42;
      table.castShadow = true;
      const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.14, 0.42, 10), woodMat);
      leg.position.y = 0.21;
      const tray = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.28, 0.04, 16), brassMat);
      tray.position.y = 0.47;
      const teaGlass = new THREE.Mesh(
        new THREE.CylinderGeometry(0.055, 0.045, 0.14, 10),
        new THREE.MeshStandardMaterial({ color: 0x9b2d20, roughness: 0.25 })
      );
      teaGlass.position.set(0.08, 0.56, 0.04);
      const teapot = new THREE.Mesh(new THREE.SphereGeometry(0.1, 10, 8), brassMat);
      teapot.position.set(-0.1, 0.56, -0.04);
      g.add(table, leg, tray, teaGlass, teapot);
      const hit = addFurnitureHitbox('teatable', 1.15, 0.85, 1.15, 0.42);
      hit.userData.roomAction = 'teatable';
      clickables.push(hit);
    }

    // 8. Tralleis Wall Art Frame
    {
      const g = furnitureGroups.wallart;
      const frame = new THREE.Mesh(new THREE.BoxGeometry(1.45, 1.0, 0.08), woodMat);
      const canvas = new THREE.Mesh(
        new THREE.PlaneGeometry(1.24, 0.8),
        new THREE.MeshStandardMaterial({ color: 0xe6caa0, roughness: 0.9 })
      );
      canvas.position.z = 0.045;
      const archTint = new THREE.Mesh(
        new THREE.BoxGeometry(0.75, 0.42, 0.02),
        new THREE.MeshStandardMaterial({ color: 0xb88154, roughness: 0.8 })
      );
      archTint.position.set(0, -0.05, 0.055);
      g.add(frame, canvas, archTint);
      addFurnitureHitbox('wallart', 1.5, 1.1, 0.35, 0);
    }

    Object.values(furnitureGroups).forEach((fg) => roomGroup.add(fg));

    // Player Avatar Rig
    const initialAvatarCfg: AvatarConfig = {
      ...DEFAULT_AVATAR_CONFIG,
      ...(roomStateRef.current.avatarConfig || {}),
    };
    const avatarRig = createAvatarRig(initialAvatarCfg);
    avatarRig.root.position.set(avatarWalkRef.current.x, 0, avatarWalkRef.current.z);
    roomGroup.add(avatarRig.root);

    // Interactive Pets
    const catRig = createCatRig();
    catRig.group.position.set(-0.85, 0.03, 1.35);
    roomGroup.add(catRig.group);
    clickables.push(catRig.hitMesh);

    const dogRig = createDogRig();
    dogRig.group.position.set(1.15, 0.03, 1.05);
    roomGroup.add(dogRig.group);
    clickables.push(dogRig.hitMesh);

    if (!isSoftwareGl) {
      renderer.compile(scene, camera);
    }

    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    const heldKeys = new Set<string>();
    let draggingFurniture = false;
    let pointerDownPos = { x: 0, y: 0 };

    const updatePointer = (clientX: number, clientY: number) => {
      const rect = renderer.domElement.getBoundingClientRect();
      pointer.x = ((clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((clientY - rect.top) / rect.height) * 2 + 1;
    };

    const isHierarchyVisible = (obj: THREE.Object3D) => {
      let p: THREE.Object3D | null = obj;
      while (p) {
        if (!p.visible) return false;
        p = p.parent;
      }
      return true;
    };

    const moveSelectedFurnitureToFloorPoint = (pt: THREE.Vector3) => {
      const selId = selectedFurnitureRef.current;
      const st = roomStateRef.current;
      const clampedX = THREE.MathUtils.clamp(Math.round(pt.x * 10) / 10, -3.3, 3.3);
      const clampedZ = THREE.MathUtils.clamp(Math.round(pt.z * 10) / 10, -3.3, 3.3);

      const nextFurniture = st.furniture.map((f) => {
        if (f.id !== selId) return f;
        if (selId === 'wallart') {
          return {
            ...f,
            enabled: true,
            x: THREE.MathUtils.clamp(clampedX, -2.8, 2.8),
            z: -3.72,
            rotY: 0,
          };
        }
        return {
          ...f,
          enabled: true,
          x: clampedX,
          z: clampedZ,
        };
      });
      callbacksRef.current.onChangeRoomState({ ...st, furniture: nextFurniture });
    };

    const onPointerDown = (e: PointerEvent) => {
      pointerDownPos = { x: e.clientX, y: e.clientY };
      if (!placementModeRef.current) return;
      updatePointer(e.clientX, e.clientY);
      raycaster.setFromCamera(pointer, camera);

      const fHits = raycaster
        .intersectObjects(furnitureHitMeshes, false)
        .filter((h) => isHierarchyVisible(h.object));
      if (fHits.length > 0) {
        const fId = fHits[0].object.userData.furnitureId as RoomFurnitureId;
        setSelectedFurniture(fId);
        draggingFurniture = true;
        return;
      }

      const floorHits = raycaster.intersectObject(floorHitPlane, false);
      if (floorHits.length > 0) {
        draggingFurniture = true;
        moveSelectedFurnitureToFloorPoint(floorHits[0].point);
      }
    };

    const onPointerMove = (e: PointerEvent) => {
      updatePointer(e.clientX, e.clientY);
      raycaster.setFromCamera(pointer, camera);

      if (placementModeRef.current && draggingFurniture) {
        const floorHits = raycaster.intersectObject(floorHitPlane, false);
        if (floorHits.length > 0) {
          moveSelectedFurnitureToFloorPoint(floorHits[0].point);
        }
        renderer.domElement.style.cursor = 'grabbing';
        return;
      }

      if (placementModeRef.current) {
        const fHits = raycaster
          .intersectObjects(furnitureHitMeshes, false)
          .filter((h) => isHierarchyVisible(h.object));
        renderer.domElement.style.cursor = fHits.length > 0 ? 'grab' : 'crosshair';
        return;
      }

      const hits = raycaster
        .intersectObjects(clickables, false)
        .filter((h) => isHierarchyVisible(h.object));
      renderer.domElement.style.cursor = hits.length > 0 ? 'pointer' : 'default';
    };

    const onPointerUp = () => {
      draggingFurniture = false;
    };

    const onPointerClick = (e: MouseEvent) => {
      if (Math.hypot(e.clientX - pointerDownPos.x, e.clientY - pointerDownPos.y) > 8) return;
      if (placementModeRef.current) return;

      updatePointer(e.clientX, e.clientY);
      raycaster.setFromCamera(pointer, camera);

      // Priority 1: Direct click on interactive props/pets
      const hits = raycaster
        .intersectObjects(clickables, false)
        .filter((h) => isHierarchyVisible(h.object));
      if (hits.length > 0) {
        const action = hits[0].object.userData.roomAction as string;
        const st = roomStateRef.current;
        if (action === 'agenda') {
          triggerInteractionRef.current('desk');
        } else if (action === 'lamp') {
          callbacksRef.current.onChangeRoomState({ ...st, lampOn: !st.lampOn });
          showToast(st.lampOn ? 'Masa lambası kapatıldı.' : 'Masa lambası açıldı.');
        } else if (action === 'turntable') {
          triggerInteractionRef.current('turntable');
        } else if (action === 'armchair') {
          triggerInteractionRef.current('armchair');
        } else if (action === 'teatable') {
          triggerInteractionRef.current('teatable');
        } else if (action === 'bookshelf') {
          triggerInteractionRef.current('bookshelf');
        } else if (action === 'pet-cat') {
          triggerInteractionRef.current('cat');
        } else if (action === 'pet-dog') {
          triggerInteractionRef.current('dog');
        }
        return;
      }

      // Priority 2: Click/Tap on Floor to Walk Avatar there!
      if (roomStateRef.current.avatarPlaced ?? true) {
        const floorHits = raycaster.intersectObject(floorHitPlane, false);
        if (floorHits.length > 0) {
          if (isSittingRef.current) setIsSitting(false);
          avatarWalkRef.current.targetX = THREE.MathUtils.clamp(floorHits[0].point.x, -3.35, 3.35);
          avatarWalkRef.current.targetZ = THREE.MathUtils.clamp(floorHits[0].point.z, -3.35, 3.35);
        }
      }
    };

    const onKeyDown = (e: KeyboardEvent) => {
      if (document.activeElement?.tagName === 'INPUT') return;
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) {
        e.preventDefault();
      }
      const wasDown = heldKeys.has(e.code);
      heldKeys.add(e.code);

      if (!wasDown && e.code === 'KeyE' && nearbyInteractableRef.current) {
        triggerInteractionRef.current(nearbyInteractableRef.current.id);
      } else if (!wasDown && e.code === 'KeyR' && placementModeRef.current) {
        const selId = selectedFurnitureRef.current;
        const st = roomStateRef.current;
        callbacksRef.current.onChangeRoomState({
          ...st,
          furniture: st.furniture.map((f) => {
            if (f.id !== selId) return f;
            const cur = resolveFurnitureTransform(f.id, f);
            return { ...f, rotY: cur.rotY + Math.PI / 4, enabled: true };
          }),
        });
      }
    };
    const onKeyUp = (e: KeyboardEvent) => {
      heldKeys.delete(e.code);
    };
    const onBlur = () => {
      heldKeys.clear();
      touchMoveRef.current = { up: false, down: false, left: false, right: false };
    };

    let pinchStartDist = 0;
    let pinchStartZoom = 1;
    const getTouchDist = (t1: Touch, t2: Touch) =>
      Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY);

    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        pinchStartDist = getTouchDist(e.touches[0], e.touches[1]);
        pinchStartZoom = camera.zoom;
      }
    };
    const onTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 2 && pinchStartDist > 10) {
        e.preventDefault();
        const dist = getTouchDist(e.touches[0], e.touches[1]);
        camera.zoom = THREE.MathUtils.clamp(pinchStartZoom * (dist / pinchStartDist), 0.78, 2.2);
        camera.updateProjectionMatrix();
      }
    };
    const onTouchEnd = (e: TouchEvent) => {
      if (e.touches.length < 2) pinchStartDist = 0;
    };
    const onWheel = (e: WheelEvent) => {
      camera.zoom = THREE.MathUtils.clamp(camera.zoom - e.deltaY * 0.0008, 0.78, 2.2);
      camera.updateProjectionMatrix();
    };

    renderer.domElement.addEventListener('pointerdown', onPointerDown);
    renderer.domElement.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    renderer.domElement.addEventListener('click', onPointerClick);
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('blur', onBlur);
    renderer.domElement.addEventListener('wheel', onWheel, { passive: true });
    renderer.domElement.addEventListener('touchstart', onTouchStart, { passive: true });
    renderer.domElement.addEventListener('touchmove', onTouchMove, { passive: false });
    renderer.domElement.addEventListener('touchend', onTouchEnd, { passive: true });
    renderer.domElement.addEventListener('touchcancel', onTouchEnd, { passive: true });

    const onResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = Math.max(1, container.clientHeight);
      const asp = w / h;
      const frustum = getRoomFrustum(asp);
      camera.left = (-frustum * asp) / 2;
      camera.right = (frustum * asp) / 2;
      camera.top = frustum / 2;
      camera.bottom = -frustum / 2;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', onResize);

    const nearbyInteractableRef = { current: null as NearbyRoomInteractable | null };
    let lastNearbyId: string | null = null;
    let lastAvatarSig = '';

    const clock = new THREE.Clock();
    let frameId = 0;
    let disposed = false;

    function afterDraw(cb: () => void) {
      const gl = renderer.getContext() as WebGL2RenderingContext;
      const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
      gl.flush();
      const poll = () => {
        if (disposed) return;
        const state = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
        if (state === gl.UNSIGNALED) {
          frameId = window.setTimeout(poll, 5);
        } else {
          if (sync) gl.deleteSync(sync);
          frameId = window.setTimeout(cb, 80);
        }
      };
      frameId = window.setTimeout(poll, 5);
    }

    const tick = () => {
      if (disposed) return;
      const dt = Math.min(clock.getDelta(), 0.05);
      const elapsed = clock.elapsedTime;
      const st = roomStateRef.current;
      const wType = weatherRef.current;

      // Sync Wall & Floor Colors
      wallMat.color.set(st.wallColor);
      floorMat.color.setHex(
        st.floorTone === 'oak' ? 0xa67a50 : st.floorTone === 'pine' ? 0xc8a374 : 0x8f8a82
      );

      // Sync Lamp State
      lampPoint.intensity = THREE.MathUtils.damp(lampPoint.intensity, st.lampOn ? 4.8 : 0, 6, dt);
      lampShadeMat.emissiveIntensity = st.lampOn ? 1.15 : 0.08;

      // Sync Furniture Positions & Rotations
      for (const item of st.furniture) {
        const grp = furnitureGroups[item.id];
        grp.visible = item.enabled;
        const tf = resolveFurnitureTransform(item.id, item);
        grp.position.set(tf.x, tf.y, tf.z);
        grp.rotation.y = tf.rotY;
        if (item.id === 'desk') {
          lampPoint.position.set(tf.x + 0.5, 1.9, tf.z);
        }
      }

      // Highlight selected furniture in Placement Mode
      if (placementModeRef.current) {
        const selId = selectedFurnitureRef.current;
        const selPlacement = st.furniture.find((f) => f.id === selId);
        const tf = resolveFurnitureTransform(selId, selPlacement);
        selectionRing.visible = selPlacement?.enabled ?? true;
        selectionRing.position.set(tf.x, 0.045, selId === 'wallart' ? -3.45 : tf.z);
        selectionRing.scale.setScalar(1.0 + Math.sin(elapsed * 4.5) * 0.06);
      } else {
        selectionRing.visible = false;
      }

      // Sync Avatar Config & Walking/Sitting Animation
      const showAvatar = st.avatarPlaced ?? true;
      avatarRig.root.visible = showAvatar;
      if (showAvatar) {
        const cfg: AvatarConfig = {
          ...DEFAULT_AVATAR_CONFIG,
          ...(st.avatarConfig || {}),
        };
        const sig = `${cfg.skinColor}|${cfg.shirtColor}|${cfg.pantsColor}|${cfg.hairStyle}|${cfg.hairColor}`;
        if (sig !== lastAvatarSig) {
          lastAvatarSig = sig;
          avatarRig.applyConfig(cfg);
        }

        const av = avatarWalkRef.current;
        let moveX = 0;
        let moveZ = 0;
        if (!placementModeRef.current) {
          const up = heldKeys.has('KeyW') || heldKeys.has('ArrowUp') || touchMoveRef.current.up;
          const down =
            heldKeys.has('KeyS') || heldKeys.has('ArrowDown') || touchMoveRef.current.down;
          const left =
            heldKeys.has('KeyA') || heldKeys.has('ArrowLeft') || touchMoveRef.current.left;
          const right =
            heldKeys.has('KeyD') || heldKeys.has('ArrowRight') || touchMoveRef.current.right;

          // Isometric screen-aligned directions
          if (up) {
            moveX -= 1;
            moveZ -= 1;
          }
          if (down) {
            moveX += 1;
            moveZ += 1;
          }
          if (left) {
            moveX -= 1;
            moveZ += 1;
          }
          if (right) {
            moveX += 1;
            moveZ -= 1;
          }
        }

        let isMoving = false;
        if (moveX !== 0 || moveZ !== 0) {
          if (isSittingRef.current) setIsSitting(false);
          av.targetX = null;
          av.targetZ = null;
          const len = Math.hypot(moveX, moveZ);
          moveX /= len;
          moveZ /= len;
          isMoving = true;
        } else if (av.targetX !== null && av.targetZ !== null && !isSittingRef.current) {
          const dx = av.targetX - av.x;
          const dz = av.targetZ - av.z;
          const dist = Math.hypot(dx, dz);
          if (dist < 0.14) {
            av.targetX = null;
            av.targetZ = null;
          } else {
            moveX = dx / dist;
            moveZ = dz / dist;
            isMoving = true;
          }
        }

        if (isMoving) {
          const walkSpeed = 2.45;
          let nx = THREE.MathUtils.clamp(av.x + moveX * walkSpeed * dt, -3.35, 3.35);
          let nz = THREE.MathUtils.clamp(av.z + moveZ * walkSpeed * dt, -3.35, 3.35);

          // Collide against solid floor furniture
          for (const item of st.furniture) {
            if (!item.enabled) continue;
            const r = FURNITURE_RADII[item.id];
            if (!r) continue;
            const tf = resolveFurnitureTransform(item.id, item);
            const dx = nx - tf.x;
            const dz = nz - tf.z;
            const dist = Math.hypot(dx, dz);
            const minDist = r + 0.28;
            if (dist < minDist && dist > 0.001) {
              nx = tf.x + (dx / dist) * minDist;
              nz = tf.z + (dz / dist) * minDist;
            }
          }

          av.x = THREE.MathUtils.clamp(nx, -3.35, 3.35);
          av.z = THREE.MathUtils.clamp(nz, -3.35, 3.35);
          const targetRot = Math.atan2(moveX, moveZ);
          let diff = targetRot - av.rotY;
          while (diff > Math.PI) diff -= Math.PI * 2;
          while (diff < -Math.PI) diff += Math.PI * 2;
          av.rotY += diff * Math.min(1, dt * 12);
        }

        // Walk marker display
        if (av.targetX !== null && av.targetZ !== null && !isSittingRef.current) {
          walkMarker.visible = true;
          walkMarker.position.set(av.targetX, 0.04, av.targetZ);
          walkMarker.scale.setScalar(1.0 + Math.sin(elapsed * 6) * 0.12);
        } else {
          walkMarker.visible = false;
        }

        avatarRig.root.position.set(av.x, 0, av.z);
        avatarRig.root.rotation.y = av.rotY;

        teaSipRef.current = Math.max(0, teaSipRef.current - dt * 1.4);

        if (isSittingRef.current) {
          avatarRig.rig.updateSit(dt, elapsed, teaSipRef.current);
        } else if (isMoving) {
          avatarRig.rig.updateWalk(3.4, dt, elapsed, false);
        } else {
          avatarRig.rig.updateWalk(0, dt, elapsed, false);
          if (teaSipRef.current > 0.01) {
            avatarRig.rig.armR.shoulder.rotation.x =
              -Math.sin(teaSipRef.current * Math.PI) * 0.9;
            avatarRig.rig.armR.elbow.rotation.x = -0.45;
          }
        }

        // Determine nearest interactive object in Gezinti Mode
        let closest: NearbyRoomInteractable | null = null;
        let closestDist = 1.65;
        if (!placementModeRef.current) {
          const checks: [NearbyRoomInteractable['id'], number, number, string, boolean][] = [];
          for (const item of st.furniture) {
            if (!item.enabled) continue;
            const tf = resolveFurnitureTransform(item.id, item);
            if (item.id === 'armchair') {
              checks.push([
                'armchair',
                tf.x,
                tf.z,
                isSittingRef.current ? 'Koltuktan Kalk' : 'Koltuğa Otur',
                true,
              ]);
            } else if (item.id === 'desk') {
              checks.push(['desk', tf.x, tf.z, 'Ajanda & Takvimi Aç', true]);
            } else if (item.id === 'turntable') {
              checks.push(['turntable', tf.x, tf.z, 'Lo-Fi Plağı Değiştir', true]);
            } else if (item.id === 'teatable') {
              checks.push(['teatable', tf.x, tf.z, 'Tavşan Kanı Çay İç', true]);
            } else if (item.id === 'bookshelf') {
              checks.push(['bookshelf', tf.x, tf.z, 'Kitaba Göz At', true]);
            }
          }
          if (catRig.group.visible) {
            checks.push([
              'cat',
              catRig.group.position.x,
              catRig.group.position.z,
              'Pamuk’u Sev',
              true,
            ]);
          }
          if (dogRig.group.visible) {
            checks.push([
              'dog',
              dogRig.group.position.x,
              dogRig.group.position.z,
              'Efe’yi Sev',
              true,
            ]);
          }

          for (const [id, tx, tz, label] of checks) {
            const d = Math.hypot(av.x - tx, av.z - tz);
            if (d < closestDist) {
              closestDist = d;
              closest = { id, label };
            }
          }
        }
        nearbyInteractableRef.current = closest;
        const nextId = closest ? `${closest.id}:${closest.label}` : null;
        if (nextId !== lastNearbyId) {
          lastNearbyId = nextId;
          setNearbyInteractable(closest);
        }
      } else {
        walkMarker.visible = false;
        if (lastNearbyId !== null) {
          lastNearbyId = null;
          setNearbyInteractable(null);
        }
      }

      // Spin Vinyl Record gently
      vinylDisc.rotation.y += dt * 1.4;

      // Window Sky & Outside Weather Animation
      if (wType === 'storm') windowSkyMat.color.setHex(0x283344);
      else if (wType === 'rain') windowSkyMat.color.setHex(0x52687e);
      else if (wType === 'snow') windowSkyMat.color.setHex(0xb8c8d8);
      else windowSkyMat.color.setHex(0x88b8de);

      if (wType === 'clear') {
        winDrops.visible = false;
      } else {
        winDrops.visible = true;
        winDropMat.color.setHex(wType === 'snow' ? 0xffffff : 0xcce2f7);
        for (let i = 0; i < winDropCount; i++) {
          const d = winDropState[i];
          if (wType === 'snow') {
            d.y -= 0.45 * d.speed * dt;
            d.x += Math.sin(elapsed * 2 + d.phase) * 0.25 * dt;
          } else {
            d.y -= (wType === 'storm' ? 2.6 : 1.7) * d.speed * dt;
            d.x -= (wType === 'storm' ? 0.6 : 0.15) * dt;
          }
          if (d.y < -0.75) {
            d.y = 0.75;
            d.x = (Math.random() - 0.5) * 1.75;
          }
          if (d.x < -0.9) d.x = 0.9;
          wDummy.position.set(-1.35 + d.x, 2.45 + d.y, -3.63);
          wDummy.scale.set(
            wType === 'snow' ? 1.8 : 0.8,
            wType === 'snow' ? 0.35 : 1.0,
            1
          );
          wDummy.rotation.z = wType === 'storm' ? 0.25 : wType === 'rain' ? 0.08 : 0;
          wDummy.updateMatrix();
          winDrops.setMatrixAt(i, wDummy.matrix);
        }
        winDrops.instanceMatrix.needsUpdate = true;
      }

      // Pets Idle Wandering + Happy Bounce
      catRig.group.visible = st.petType === 'cat' || st.petType === 'both';
      dogRig.group.visible = st.petType === 'dog' || st.petType === 'both';

      if (catRig.group.visible) {
        petBounceRef.current.cat = Math.max(0, petBounceRef.current.cat - dt * 2.2);
        const hop = Math.sin(petBounceRef.current.cat * Math.PI) * 0.42;
        catRig.group.position.x = -0.85 + Math.sin(elapsed * 0.4) * 0.55;
        catRig.group.position.z = 1.35 + Math.cos(elapsed * 0.35) * 0.35;
        catRig.group.position.y = 0.03 + hop;
        catRig.group.rotation.y = Math.sin(elapsed * 0.4) * 0.6 + 0.5;
        catRig.tail.rotation.z = Math.sin(elapsed * 3.2) * 0.32;
      }

      if (dogRig.group.visible) {
        petBounceRef.current.dog = Math.max(0, petBounceRef.current.dog - dt * 2.2);
        const hop = Math.sin(petBounceRef.current.dog * Math.PI) * 0.48;
        dogRig.group.position.x = 1.15 + Math.cos(elapsed * 0.48) * 0.5;
        dogRig.group.position.z = 1.0 + Math.sin(elapsed * 0.42) * 0.45;
        dogRig.group.position.y = 0.03 + hop;
        dogRig.group.rotation.y = -Math.cos(elapsed * 0.48) * 0.7 - 0.5;
        dogRig.tail.rotation.z = Math.sin(elapsed * 7.5) * 0.42;
      }

      renderer.render(scene, camera);

      if (isSoftwareGl) {
        afterDraw(tick);
      } else {
        frameId = requestAnimationFrame(tick);
      }
    };

    if (isSoftwareGl) {
      afterDraw(tick);
    } else {
      frameId = requestAnimationFrame(tick);
    }

    return () => {
      disposed = true;
      cancelAnimationFrame(frameId);
      clearTimeout(frameId);
      window.removeEventListener('resize', onResize);
      window.removeEventListener('pointerup', onPointerUp);
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('blur', onBlur);
      renderer.domElement.removeEventListener('pointerdown', onPointerDown);
      renderer.domElement.removeEventListener('pointermove', onPointerMove);
      renderer.domElement.removeEventListener('click', onPointerClick);
      renderer.domElement.removeEventListener('wheel', onWheel);
      renderer.domElement.removeEventListener('touchstart', onTouchStart);
      renderer.domElement.removeEventListener('touchmove', onTouchMove);
      renderer.domElement.removeEventListener('touchend', onTouchEnd);
      renderer.domElement.removeEventListener('touchcancel', onTouchEnd);

      roomGroup.traverse((obj) => {
        if ((obj as THREE.Mesh).isMesh) {
          const geo = (obj as THREE.Mesh).geometry;
          if (!geo.userData?.isSharedHumanGeo) {
            geo.dispose();
          }
        }
      });
      envRT.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    };
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

  const bindPadButton = (dir: 'up' | 'down' | 'left' | 'right') => ({
    onPointerDown: (e: ReactPointerEvent<HTMLButtonElement>) => {
      e.preventDefault();
      e.currentTarget.setPointerCapture(e.pointerId);
      touchMoveRef.current[dir] = true;
    },
    onPointerUp: (e: ReactPointerEvent<HTMLButtonElement>) => {
      if (e.currentTarget.hasPointerCapture(e.pointerId)) {
        e.currentTarget.releasePointerCapture(e.pointerId);
      }
      touchMoveRef.current[dir] = false;
    },
    onPointerCancel: () => {
      touchMoveRef.current[dir] = false;
    },
    onLostPointerCapture: () => {
      touchMoveRef.current[dir] = false;
    },
  });

  const selectedLabel =
    FURNITURE_CATALOG.find((c) => c.id === selectedFurniture)?.label || 'Eşya';

  return (
    <div className="relative w-full h-full">
      <div ref={mountRef} className="w-full h-full" />

      {/* Cozy Room HUD Overlay (Storybook Warm Parchment, Mobile Friendly) */}
      <div className="absolute inset-0 z-10 pointer-events-none flex flex-col justify-between p-3 sm:p-4 md:p-6 pt-[max(0.75rem,env(safe-area-inset-top))] pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        {/* Top Row */}
        <div className="flex items-start justify-between gap-2 sm:gap-4">
          <div className="pointer-events-auto rounded-2xl bg-[#F7EEDC]/96 border-2 border-[#B99464] px-3 py-2 sm:px-4 sm:py-3 text-[#3A2618] shadow-md max-w-[58vw] sm:max-w-lg">
            <div className="font-display text-sm sm:text-base md:text-lg font-bold leading-tight truncate">
              <span>Sıcak Yuvam · </span>
              <span key={placementMode ? 'place' : 'walk'}>
                {placementMode ? 'Eşya Yerleştirme Modu' : 'Gezinti & Yaşam'}
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-x-1.5 sm:gap-x-2 text-[11px] sm:text-xs text-[#6B5038] mt-0.5 sm:mt-1 font-medium">
              <span>{WEATHER_OPTIONS.find((w) => w.id === weather)?.label}</span>
              <span aria-hidden="true">·</span>
              <span className="truncate">{LOFI_TRACKS.find((t) => t.id === lofiTrack)?.label}</span>
              <span aria-hidden="true">·</span>
              <span className="font-mono-num text-[#B84C27] font-semibold">
                Sevgi: {roomState.petAffection}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 pointer-events-auto shrink-0">
            <button
              type="button"
              onClick={onOpenAgenda}
              className="inline-flex items-center gap-1.5 px-2.5 sm:px-3.5 py-2 rounded-xl bg-[#F7EEDC]/96 hover:bg-[#EFE0C3] border-2 border-[#B99464] text-xs font-semibold text-[#3A2618] shadow-md transition-colors whitespace-nowrap cursor-pointer"
            >
              <Calendar className="w-3.5 h-3.5 text-[#B84C27]" aria-hidden="true" />
              <span className="hidden sm:inline">Ajanda &amp; Takvim</span>
              <span className="sm:hidden">Ajanda</span>
            </button>

            <button
              type="button"
              onClick={onExitHome}
              className="inline-flex items-center gap-1.5 px-2.5 sm:px-3.5 py-2 rounded-xl bg-[#C85A32] hover:bg-[#B44D28] border-2 border-[#FAF2E2]/80 text-[#FAF2E2] text-xs font-semibold shadow-md transition-colors whitespace-nowrap cursor-pointer"
            >
              <DoorOpen className="w-3.5 h-3.5" aria-hidden="true" />
              <span className="hidden sm:inline">Efeler Sokağına Çık</span>
              <span className="sm:hidden">Sokağa Çık</span>
            </button>
          </div>
        </div>

        {/* Center Status Toast or Placement Helper */}
        <div className="self-center flex flex-col items-center gap-2">
          {roomToast && (
            <div className="rounded-xl bg-[#F7EEDC]/98 border-2 border-[#C85A32]/70 px-4 py-2 text-xs font-semibold text-[#3A2618] flex items-center gap-2 shadow-xl text-center max-w-md">
              <Heart className="w-3.5 h-3.5 text-[#C85A32] shrink-0" aria-hidden="true" />
              <span>{roomToast}</span>
            </div>
          )}

          {placementMode && (
            <div className="pointer-events-auto flex flex-wrap items-center justify-center gap-2 rounded-2xl bg-[#F7EEDC]/96 border-2 border-[#C85A32]/65 px-3.5 py-2 text-xs text-[#3A2618] shadow-lg">
              <span className="font-semibold text-[#B84C27]">
                Seçili: {selectedLabel}
              </span>
              <span className="hidden sm:inline text-[#6B5038]">
                (Zemine dokun/sürükle ile taşı)
              </span>
              <button
                type="button"
                onClick={() => rotateFurniture(selectedFurniture)}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#EDE0C6] hover:bg-[#E2D1B2] border border-[#B99464]/60 font-semibold cursor-pointer"
              >
                <RotateCw className="w-3.5 h-3.5 text-[#B84C27]" aria-hidden="true" />
                <span>45° Döndür</span>
              </button>
              <button
                type="button"
                onClick={() => setPlacementMode(false)}
                className="px-2.5 py-1 rounded-lg bg-[#5D8A48] text-[#FAF2E2] font-semibold cursor-pointer"
              >
                Bitti
              </button>
            </div>
          )}
        </div>

        {/* Bottom Area: Contextual Prompt + Mobile Walk Pad + Customization Drawer & Bar */}
        <div className="flex flex-col items-center gap-2 sm:gap-2.5 max-w-full">
          {/* Proximity Interact Prompt */}
          {!placementMode && nearbyInteractable && (
            <button
              type="button"
              onClick={() => triggerInteractionRef.current(nearbyInteractable.id)}
              className="pointer-events-auto inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#C85A32] hover:bg-[#B44D28] border-2 border-[#FAF2E2]/85 text-[#FAF2E2] text-xs sm:text-sm font-semibold shadow-lg transition-colors cursor-pointer"
            >
              {nearbyInteractable.id === 'teatable' ? (
                <Coffee key="coffee" className="w-4 h-4" aria-hidden="true" />
              ) : (
                <Sparkles key="sparkle" className="w-4 h-4" aria-hidden="true" />
              )}
              <span>[E] {nearbyInteractable.label}</span>
            </button>
          )}

          {/* Compact Touch Walk Pad when Avatar is placed */}
          {touchPadOpen && !placementMode && avatarPlaced && !editOpen && (
            <div className="w-full flex items-end justify-between px-1 sm:px-3">
              <div className="pointer-events-auto grid grid-cols-3 gap-1 w-32">
                <div />
                <button
                  type="button"
                  aria-label="Yukarı Yürü"
                  {...bindPadButton('up')}
                  className="h-10 rounded-xl bg-[#F7EEDC]/92 active:bg-[#E2D0AF] border-2 border-[#B99464] text-[#3A2618] flex items-center justify-center touch-none select-none cursor-pointer"
                >
                  <ArrowUp className="w-4 h-4" aria-hidden="true" />
                </button>
                <div />
                <button
                  type="button"
                  aria-label="Sola Yürü"
                  {...bindPadButton('left')}
                  className="h-10 rounded-xl bg-[#F7EEDC]/92 active:bg-[#E2D0AF] border-2 border-[#B99464] text-[#3A2618] flex items-center justify-center touch-none select-none cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" aria-hidden="true" />
                </button>
                <button
                  type="button"
                  aria-label="Aşağı Yürü"
                  {...bindPadButton('down')}
                  className="h-10 rounded-xl bg-[#F7EEDC]/92 active:bg-[#E2D0AF] border-2 border-[#B99464] text-[#3A2618] flex items-center justify-center touch-none select-none cursor-pointer"
                >
                  <ArrowDown className="w-4 h-4" aria-hidden="true" />
                </button>
                <button
                  type="button"
                  aria-label="Sağa Yürü"
                  {...bindPadButton('right')}
                  className="h-10 rounded-xl bg-[#F7EEDC]/92 active:bg-[#E2D0AF] border-2 border-[#B99464] text-[#3A2618] flex items-center justify-center touch-none select-none cursor-pointer"
                >
                  <ArrowRight className="w-4 h-4" aria-hidden="true" />
                </button>
              </div>
              <div className="rounded-xl bg-[#F7EEDC]/90 border border-[#B99464]/60 px-2.5 py-1.5 text-[11px] font-medium text-[#5B432F]">
                Zemine dokunarak da yürüyebilirsin
              </div>
            </div>
          )}

          {editOpen && (
            <div className="pointer-events-auto w-full max-w-2xl max-h-[42dvh] overflow-y-auto efeler-scroll rounded-2xl bg-[#F7EEDC]/98 border-2 border-[#B99464] p-3.5 sm:p-4 text-[#3A2618] shadow-2xl">
              {/* Tabs */}
              <div className="flex flex-wrap items-center gap-1.5 pb-2.5 mb-3 border-b border-[#B99464]/40">
                {(
                  [
                    ['furniture', 'Eşya & Yerleşim'],
                    ['avatar', 'Avatarım'],
                    ['style', 'Duvar & Zemin'],
                    ['pets', 'Can Dostlarım'],
                    ['atmosphere', 'Hava & Lo-Fi'],
                  ] as const
                ).map(([id, label]) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setDrawerTab(id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                      drawerTab === id
                        ? 'bg-[#C85A32] text-[#FAF2E2]'
                        : 'bg-[#EDE0C6] text-[#5B432F] hover:bg-[#E2D1B2]'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>

              {drawerTab === 'furniture' && (
                <div className="space-y-2.5">
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-[#6B5038]">
                    <span>
                      Bir eşya seçip <strong>Serbest Taşı</strong> modunda odada dilediğin yere koyabilirsin.
                    </span>
                    <button
                      type="button"
                      onClick={resetRoomLayout}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#EDE0C6] hover:bg-[#E2D1B2] border border-[#B99464]/45 text-[11px] font-semibold text-[#3A2618] cursor-pointer"
                    >
                      <RotateCcw className="w-3 h-3" aria-hidden="true" />
                      <span>Düzeni Sıfırla</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {FURNITURE_CATALOG.map((item) => {
                      const placement = roomState.furniture.find((f) => f.id === item.id);
                      const enabled = placement?.enabled ?? true;
                      const isSel = selectedFurniture === item.id;
                      return (
                        <div
                          key={item.id}
                          className={`flex items-center justify-between gap-2 rounded-xl border px-3 py-2 ${
                            isSel
                              ? 'bg-[#EFE0C3] border-[#C85A32]'
                              : 'bg-[#FAF3E6] border-[#B99464]/45'
                          }`}
                        >
                          <button
                            type="button"
                            onClick={() => toggleFurniture(item.id)}
                            title="Göster/Gizle"
                            className={`text-xs font-semibold text-left cursor-pointer ${
                              enabled ? 'text-[#3A2618]' : 'text-[#9A8570] line-through'
                            }`}
                          >
                            {item.label}
                          </button>
                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedFurniture(item.id);
                                setPlacementMode(true);
                                setEditOpen(false);
                              }}
                              className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-[#C85A32] hover:bg-[#B44D28] text-[11px] font-semibold text-[#FAF2E2] cursor-pointer"
                            >
                              <Move className="w-3 h-3" aria-hidden="true" />
                              <span>Taşı</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => rotateFurniture(item.id)}
                              title="Döndür"
                              className="p-1 rounded-md bg-[#EDE0C6] hover:bg-[#E2D1B2] border border-[#B99464]/45 text-[#3A2618] cursor-pointer"
                            >
                              <RotateCw className="w-3 h-3 text-[#B84C27]" aria-hidden="true" />
                            </button>
                            <button
                              type="button"
                              onClick={() => cycleFurnitureSlot(item.id)}
                              title="Hazır Konum"
                              className="px-1.5 py-1 rounded-md bg-[#EDE0C6] hover:bg-[#E2D1B2] border border-[#B99464]/45 text-[11px] font-semibold text-[#3A2618] cursor-pointer"
                            >
                              #{(placement?.slotIndex ?? 0) + 1}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {drawerTab === 'avatar' && (
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="text-xs text-[#6B5038]">
                      Avatarını odaya yerleştirip WASD, dokunmatik tuşlar veya zemine tıklayarak yürütebilirsin.
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const nextPlaced = !avatarPlaced;
                        if (nextPlaced) {
                          avatarWalkRef.current.x = 0.2;
                          avatarWalkRef.current.z = 1.5;
                          avatarWalkRef.current.targetX = null;
                          avatarWalkRef.current.targetZ = null;
                        }
                        onChangeRoomState({ ...roomState, avatarPlaced: nextPlaced });
                      }}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer ${
                        avatarPlaced
                          ? 'bg-[#5D8A48] text-[#FAF2E2]'
                          : 'bg-[#EDE0C6] text-[#3A2618]'
                      }`}
                    >
                      <span key={avatarPlaced ? 'placed' : 'unplaced'}>
                        {avatarPlaced ? 'Avatar Odada (Gizle)' : 'Avatarı Odaya Yerleştir'}
                      </span>
                    </button>
                  </div>

                  <div>
                    <div className="text-[11px] font-semibold text-[#6B5038] mb-1.5">
                      Saç &amp; Şapka Stili
                    </div>
                    <div className="flex flex-wrap items-center gap-1.5">
                      {AVATAR_HAIR_STYLES.map((hs) => (
                        <button
                          key={hs.id}
                          type="button"
                          onClick={() => updateAvatarConfig({ hairStyle: hs.id })}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer ${
                            avatarConfig.hairStyle === hs.id
                              ? 'bg-[#C85A32] text-[#FAF2E2]'
                              : 'bg-[#EDE0C6] text-[#5B432F]'
                          }`}
                        >
                          {hs.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-5">
                    <div>
                      <div className="text-[11px] font-semibold text-[#6B5038] mb-1.5">
                        Kıyafet Rengi
                      </div>
                      <div className="flex items-center gap-2">
                        {AVATAR_SHIRT_SWATCHES.map((sw) => (
                          <button
                            key={sw.id}
                            type="button"
                            title={sw.name}
                            onClick={() => updateAvatarConfig({ shirtColor: sw.hex })}
                            className={`w-6 h-6 rounded-full border-2 cursor-pointer ${
                              avatarConfig.shirtColor === sw.hex
                                ? 'border-[#3A2618] scale-110'
                                : 'border-[#B99464]/60'
                            }`}
                            style={{ backgroundColor: sw.hex }}
                          />
                        ))}
                      </div>
                    </div>

                    <div>
                      <div className="text-[11px] font-semibold text-[#6B5038] mb-1.5">
                        Ten Tonu
                      </div>
                      <div className="flex items-center gap-2">
                        {AVATAR_SKIN_SWATCHES.map((sw) => (
                          <button
                            key={sw.id}
                            type="button"
                            title={sw.name}
                            onClick={() => updateAvatarConfig({ skinColor: sw.hex })}
                            className={`w-6 h-6 rounded-full border-2 cursor-pointer ${
                              avatarConfig.skinColor === sw.hex
                                ? 'border-[#3A2618] scale-110'
                                : 'border-[#B99464]/60'
                            }`}
                            style={{ backgroundColor: sw.hex }}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {drawerTab === 'style' && (
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <div className="text-[11px] font-semibold text-[#6B5038] mb-1.5">Duvar Rengi</div>
                    <div className="flex items-center gap-2">
                      {ROOM_WALL_SWATCHES.map((sw) => (
                        <button
                          key={sw.id}
                          type="button"
                          title={sw.name}
                          onClick={() => onChangeRoomState({ ...roomState, wallColor: sw.hex })}
                          className={`w-7 h-7 rounded-full border-2 cursor-pointer ${
                            roomState.wallColor === sw.hex
                              ? 'border-[#3A2618] scale-110'
                              : 'border-[#B99464]/60'
                          }`}
                          style={{ backgroundColor: sw.hex }}
                        />
                      ))}
                    </div>
                  </div>

                  <div>
                    <div className="text-[11px] font-semibold text-[#6B5038] mb-1.5">Zemin Dokusu</div>
                    <div className="flex flex-wrap items-center gap-1.5">
                      {(
                        [
                          ['oak', 'Sıcak Meşe'],
                          ['pine', 'Açık Çam'],
                          ['stone', 'Doğal Taş'],
                        ] as const
                      ).map(([tone, label]) => (
                        <button
                          key={tone}
                          type="button"
                          onClick={() => onChangeRoomState({ ...roomState, floorTone: tone })}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer ${
                            roomState.floorTone === tone
                              ? 'bg-[#C85A32] text-[#FAF2E2]'
                              : 'bg-[#EDE0C6] text-[#5B432F]'
                          }`}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {drawerTab === 'pets' && (
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-1.5">
                    {(
                      [
                        ['cat', 'Sadece Pamuk (Kedi)'],
                        ['dog', 'Sadece Efe (Köpek)'],
                        ['both', 'İkisi Birden'],
                      ] as [PetType, string][]
                    ).map(([p, label]) => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => onChangeRoomState({ ...roomState, petType: p })}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer ${
                          roomState.petType === p
                            ? 'bg-[#C85A32] text-[#FAF2E2]'
                            : 'bg-[#EDE0C6] text-[#5B432F]'
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                  <div className="text-xs text-[#6B5038] font-medium">
                    Yanlarına yürüyüp [E] ile veya dokunarak sevebilirsin.
                  </div>
                </div>
              )}

              {drawerTab === 'atmosphere' && (
                <div className="space-y-3">
                  <div>
                    <div className="text-[11px] font-semibold text-[#6B5038] mb-1.5">
                      Pencere Dışı Hava Durumu
                    </div>
                    <div className="flex flex-wrap items-center gap-1.5">
                      {WEATHER_OPTIONS.map((w) => (
                        <button
                          key={w.id}
                          type="button"
                          onClick={() => onChangeWeather(w.id)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer ${
                            weather === w.id
                              ? 'bg-[#C85A32] text-[#FAF2E2]'
                              : 'bg-[#EDE0C6] text-[#5B432F]'
                          }`}
                        >
                          {w.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <div className="text-[11px] font-semibold text-[#6B5038] mb-1.5">
                      Lo-Fi Müzik Kanalı
                    </div>
                    <div className="flex flex-wrap items-center gap-1.5">
                      {LOFI_TRACKS.map((t) => (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => onChangeLofiTrack(t.id)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer ${
                            lofiTrack === t.id
                              ? 'bg-[#5D8A48] text-[#FAF2E2]'
                              : 'bg-[#EDE0C6] text-[#5B432F]'
                          }`}
                        >
                          {t.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Bottom Bar */}
          <div className="pointer-events-auto flex items-center gap-1.5 sm:gap-2 rounded-2xl bg-[#F7EEDC]/96 border-2 border-[#B99464] px-2.5 sm:px-3 py-1.5 sm:py-2 text-[#3A2618] shadow-lg max-w-[96vw] overflow-x-auto efeler-scroll">
            <button
              type="button"
              onClick={() => {
                setPlacementMode((v) => !v);
                setEditOpen(false);
              }}
              className={`inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                placementMode
                  ? 'bg-[#C85A32] text-[#FAF2E2]'
                  : 'bg-[#EDE0C6] hover:bg-[#E2D1B2] text-[#3A2618]'
              }`}
            >
              <Move className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Eşya Yerleştir</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setDrawerTab('furniture');
                setEditOpen((o) => !o);
              }}
              className={`inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                editOpen && drawerTab === 'furniture'
                  ? 'bg-[#C85A32] text-[#FAF2E2]'
                  : 'bg-[#EDE0C6] hover:bg-[#E2D1B2] text-[#3A2618]'
              }`}
            >
              <Paintbrush className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Odayı Düzenle</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setDrawerTab('avatar');
                setEditOpen(true);
              }}
              className={`inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                editOpen && drawerTab === 'avatar'
                  ? 'bg-[#5D8A48] text-[#FAF2E2]'
                  : 'bg-[#EDE0C6] hover:bg-[#E2D1B2] text-[#3A2618]'
              }`}
            >
              <User className="w-3.5 h-3.5 text-[#B84C27]" aria-hidden="true" />
              <span>Avatarım</span>
            </button>

            <button
              type="button"
              onClick={() =>
                onChangeRoomState({ ...roomState, lampOn: !roomState.lampOn })
              }
              className={`inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl border text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                roomState.lampOn
                  ? 'bg-[#EFE0C3] border-[#C85A32]/50 text-[#B84C27]'
                  : 'bg-[#EDE0C6] border-[#B99464]/50 text-[#6B5038]'
              }`}
            >
              <LampDesk className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Lamba</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setDrawerTab('pets');
                setEditOpen(true);
              }}
              className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-[#EDE0C6] hover:bg-[#E2D1B2] text-xs font-semibold text-[#3A2618] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <PawPrint className="w-3.5 h-3.5 text-[#B84C27]" aria-hidden="true" />
              <span>Dostlarım</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setDrawerTab('atmosphere');
                setEditOpen(true);
              }}
              className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-[#EDE0C6] hover:bg-[#E2D1B2] text-xs font-semibold text-[#3A2618] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <CloudRain className="w-3.5 h-3.5 text-[#3B6E8C]" aria-hidden="true" />
              <span>Hava &amp; Lo-Fi</span>
            </button>

            <button
              type="button"
              onClick={() => setTouchPadOpen((v) => !v)}
              title="Yürüme Tuşları"
              aria-label="Yürüme Tuşları"
              className={`p-1.5 rounded-xl border transition-colors shrink-0 cursor-pointer ${
                touchPadOpen
                  ? 'bg-[#EFE0C3] border-[#C85A32]/60 text-[#B84C27]'
                  : 'bg-[#EDE0C6] border-[#B99464]/50 text-[#8A735D]'
              }`}
            >
              <Gamepad2 className="w-3.5 h-3.5" aria-hidden="true" />
            </button>

            <button
              type="button"
              onClick={onToggleMusic}
              title="Lo-Fi Müziği Aç/Kapat"
              aria-label="Müziği Aç/Kapat"
              className={`p-1.5 rounded-xl border transition-colors shrink-0 cursor-pointer ${
                musicEnabled && !isMuted
                  ? 'bg-[#EFE0C3] border-[#C85A32]/60 text-[#B84C27]'
                  : 'bg-[#EDE0C6] border-[#B99464]/50 text-[#8A735D]'
              }`}
            >
              <Music className="w-3.5 h-3.5" aria-hidden="true" />
            </button>

            <button
              type="button"
              onClick={onToggleMute}
              title="Tüm Sesler"
              aria-label="Sesi Aç/Kapat"
              className="p-1.5 rounded-xl bg-[#EDE0C6] hover:bg-[#E2D1B2] border border-[#B99464]/50 text-[#3A2618] transition-colors shrink-0 cursor-pointer"
            >
              {isMuted ? (
                <VolumeX key="muted" className="w-3.5 h-3.5 text-[#B84C27]" aria-hidden="true" />
              ) : (
                <Volume2 key="unmuted" className="w-3.5 h-3.5 text-[#4B743B]" aria-hidden="true" />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
