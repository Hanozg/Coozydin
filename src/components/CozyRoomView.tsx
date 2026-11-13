import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import {
  Calendar,
  CloudRain,
  DoorOpen,
  Heart,
  LampDesk,
  Music,
  Paintbrush,
  PawPrint,
  RotateCw,
  Volume2,
  VolumeX,
} from 'lucide-react';
import {
  FURNITURE_CATALOG,
  LOFI_TRACKS,
  ROOM_WALL_SWATCHES,
  WEATHER_OPTIONS,
} from '../data/efelerData';
import { audioEngine } from '../game/audioEngine';
import {
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
    [-2.1, 0, -1.7, 0.45],
    [1.9, 0, -1.8, -0.45],
    [-2.0, 0, 1.8, 1.15],
  ].map(([x, y, z]) => [x, y, z]),
  desk: [
    [2.1, 0, -2.5, 0],
    [-2.1, 0, -2.5, 0],
    [2.5, 0, 1.2, -Math.PI / 2],
  ].map(([x, y, z]) => [x, y, z]),
  bookshelf: [
    [-3.35, 0, -0.5, Math.PI / 2],
    [-3.35, 0, 2.0, Math.PI / 2],
    [0.2, 0, -3.35, 0],
  ].map(([x, y, z]) => [x, y, z]),
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
  const [drawerTab, setDrawerTab] = useState<'furniture' | 'style' | 'pets' | 'atmosphere'>('furniture');
  const [petToast, setPetToast] = useState<string | null>(null);

  const roomStateRef = useRef(roomState);
  const weatherRef = useRef(weather);
  const lofiTrackRef = useRef(lofiTrack);
  const callbacksRef = useRef({
    onOpenAgenda,
    onChangeRoomState,
    onChangeLofiTrack,
  });

  roomStateRef.current = roomState;
  weatherRef.current = weather;
  lofiTrackRef.current = lofiTrack;
  callbacksRef.current = {
    onOpenAgenda,
    onChangeRoomState,
    onChangeLofiTrack,
  };

  const petBounceRef = useRef({ cat: 0, dog: 0 });
  const toastTimerRef = useRef<number | null>(null);

  const showPetHeart = (pet: 'cat' | 'dog', nextAffection: number) => {
    setPetToast(
      pet === 'cat'
        ? `Pamuk (Kedi) mırıldandı! · Sevgi Puanı: ${nextAffection}`
        : `Efe (Köpek) neşeyle kuyruk salladı! · Sevgi Puanı: ${nextAffection}`
    );
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    toastTimerRef.current = window.setTimeout(() => setPetToast(null), 2600);
  };

  useEffect(() => {
    return () => {
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    };
  }, []);

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
    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#1B1815');

    const pmrem = new THREE.PMREMGenerator(renderer);
    const envRT = pmrem.fromScene(new RoomEnvironment(), 0.04);
    scene.environment = envRT.texture;
    pmrem.dispose();

    const aspect = container.clientWidth / Math.max(1, container.clientHeight);
    const baseFrustum = 10.2;
    const camera = new THREE.OrthographicCamera(
      (-baseFrustum * aspect) / 2,
      (baseFrustum * aspect) / 2,
      baseFrustum / 2,
      -baseFrustum / 2,
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

    const wallMat = new THREE.MeshStandardMaterial({ color: '#EADEC9', roughness: 0.88 });
    const trimMat = new THREE.MeshStandardMaterial({ color: 0x5d432f, roughness: 0.72 });

    // Back Wall (-Z) & Left Wall (-X)
    const backWall = new THREE.Mesh(new THREE.BoxGeometry(8.2, 4.4, 0.32), wallMat);
    backWall.position.set(0, 2.2, -3.94);
    backWall.receiveShadow = true;
    roomGroup.add(backWall);

    const leftWall = new THREE.Mesh(new THREE.BoxGeometry(0.32, 4.4, 8.2), wallMat);
    leftWall.position.set(-3.94, 2.2, 0);
    leftWall.receiveShadow = true;
    roomGroup.add(leftWall);

    // Wooden Baseboards
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

    // Window mullions
    const mullionV = new THREE.Mesh(new THREE.BoxGeometry(0.08, 1.65, 0.12), trimMat);
    mullionV.position.set(-1.35, 2.45, -3.62);
    const mullionH = new THREE.Mesh(new THREE.BoxGeometry(1.95, 0.08, 0.12), trimMat);
    mullionH.position.set(-1.35, 2.45, -3.62);
    roomGroup.add(mullionV, mullionH);

    // Mini Weather Particles visible inside the Window Pane
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
    }

    // 2. Desk + Open Agenda + Desk Lamp
    let agendaMesh: THREE.Mesh;
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

      // Open Agenda Notebook (Clickable!)
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
      agendaMesh = new THREE.Mesh(
        new THREE.BoxGeometry(0.75, 0.35, 0.6),
        new THREE.MeshBasicMaterial({ visible: false })
      );
      agendaMesh.position.set(-0.22, 1.05, 0.08);
      agendaMesh.userData.roomAction = 'agenda';
      clickables.push(agendaMesh);

      // Desk Lamp (Clickable!)
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

      g.add(top, agendaCover, agendaPages, agendaMesh, lampBase, lampNeck, lampShade, lampHit);
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
    }

    // 6. Lo-Fi Turntable & Vinyl Stand (Clickable!)
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
      const hit = new THREE.Mesh(
        new THREE.BoxGeometry(1.0, 1.25, 0.65),
        new THREE.MeshBasicMaterial({ visible: false })
      );
      hit.position.y = 0.65;
      hit.userData.roomAction = 'turntable';
      clickables.push(hit);
      g.add(cabinet, deck, vinylDisc, label, hit);
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
    }

    Object.values(furnitureGroups).forEach((fg) => roomGroup.add(fg));

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

    const updatePointer = (clientX: number, clientY: number) => {
      const rect = renderer.domElement.getBoundingClientRect();
      pointer.x = ((clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((clientY - rect.top) / rect.height) * 2 + 1;
    };

    const onPointerMove = (e: PointerEvent) => {
      updatePointer(e.clientX, e.clientY);
      raycaster.setFromCamera(pointer, camera);
      const hits = raycaster.intersectObjects(clickables, false).filter((h) => {
        let p: THREE.Object3D | null = h.object;
        while (p) {
          if (!p.visible) return false;
          p = p.parent;
        }
        return true;
      });
      renderer.domElement.style.cursor = hits.length > 0 ? 'pointer' : 'default';
    };

    const onPointerClick = (e: MouseEvent) => {
      updatePointer(e.clientX, e.clientY);
      raycaster.setFromCamera(pointer, camera);
      const hits = raycaster.intersectObjects(clickables, false).filter((h) => {
        let p: THREE.Object3D | null = h.object;
        while (p) {
          if (!p.visible) return false;
          p = p.parent;
        }
        return true;
      });
      if (hits.length === 0) return;
      const action = hits[0].object.userData.roomAction as string;
      const st = roomStateRef.current;

      if (action === 'agenda') {
        audioEngine.playDiscoveryChime();
        callbacksRef.current.onOpenAgenda();
      } else if (action === 'lamp') {
        callbacksRef.current.onChangeRoomState({ ...st, lampOn: !st.lampOn });
      } else if (action === 'turntable') {
        const idx = LOFI_TRACKS.findIndex((t) => t.id === lofiTrackRef.current);
        const nextTrack = LOFI_TRACKS[(idx + 1) % LOFI_TRACKS.length].id;
        callbacksRef.current.onChangeLofiTrack(nextTrack);
      } else if (action === 'pet-cat') {
        petBounceRef.current.cat = 1.0;
        audioEngine.playPetSound('cat');
        const nextAff = st.petAffection + 1;
        callbacksRef.current.onChangeRoomState({ ...st, petAffection: nextAff });
        showPetHeart('cat', nextAff);
      } else if (action === 'pet-dog') {
        petBounceRef.current.dog = 1.0;
        audioEngine.playPetSound('dog');
        const nextAff = st.petAffection + 1;
        callbacksRef.current.onChangeRoomState({ ...st, petAffection: nextAff });
        showPetHeart('dog', nextAff);
      }
    };

    renderer.domElement.addEventListener('pointermove', onPointerMove);
    renderer.domElement.addEventListener('click', onPointerClick);

    const onResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = Math.max(1, container.clientHeight);
      const asp = w / h;
      camera.left = (-baseFrustum * asp) / 2;
      camera.right = (baseFrustum * asp) / 2;
      camera.top = baseFrustum / 2;
      camera.bottom = -baseFrustum / 2;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', onResize);

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

      // Sync Furniture Visibility & Slot Positions
      for (const item of st.furniture) {
        const grp = furnitureGroups[item.id];
        grp.visible = item.enabled;
        const coords = SLOT_COORDS[item.id];
        const slot = coords[item.slotIndex % coords.length];
        grp.position.set(slot[0], slot[1], slot[2]);
        grp.rotation.y = SLOT_ROTATIONS[item.id][item.slotIndex % SLOT_ROTATIONS[item.id].length];
        if (item.id === 'desk') {
          lampPoint.position.set(slot[0] + 0.5, 1.9, slot[2]);
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
      renderer.domElement.removeEventListener('pointermove', onPointerMove);
      renderer.domElement.removeEventListener('click', onPointerClick);

      roomGroup.traverse((obj) => {
        if ((obj as THREE.Mesh).isMesh) {
          (obj as THREE.Mesh).geometry.dispose();
        }
      });
      envRT.dispose();
      renderer.dispose();
      if (renderer.domElement.parentNode === container) {
        container.removeChild(renderer.domElement);
      }
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
        f.id === id ? { ...f, slotIndex: (f.slotIndex + 1) % 3, enabled: true } : f
      ),
    });
  };

  return (
    <div className="relative w-full h-full">
      <div ref={mountRef} className="w-full h-full" />

      {/* Cozy Room HUD Overlay (Zero backdrop-filter, zero pills) */}
      <div className="absolute inset-0 z-10 pointer-events-none flex flex-col justify-between p-4 md:p-6">
        {/* Top Row */}
        <div className="flex items-start justify-between gap-4">
          <div className="pointer-events-auto rounded-xl bg-[#181612]/90 border border-[#F5EFE6]/12 px-4 py-3 text-[#F5EFE6]">
            <div className="font-display text-base md:text-lg font-semibold leading-tight">
              Sıcak Yuvam · Efeler Evi
            </div>
            <div className="flex flex-wrap items-center gap-x-2 text-xs text-[#C7BEB0] mt-1">
              <span>{WEATHER_OPTIONS.find((w) => w.id === weather)?.label}</span>
              <span aria-hidden="true">·</span>
              <span>{LOFI_TRACKS.find((t) => t.id === lofiTrack)?.label}</span>
              <span aria-hidden="true">·</span>
              <span className="font-mono-num text-[#E8A08B]">
                Sevgi Puanı: {roomState.petAffection}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 pointer-events-auto">
            <button
              type="button"
              onClick={onOpenAgenda}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#181612]/90 hover:bg-[#26211B] border border-[#F5EFE6]/12 text-xs font-medium text-[#F5EFE6] transition-colors cursor-pointer"
            >
              <Calendar className="w-3.5 h-3.5 text-[#D99B43]" aria-hidden="true" />
              <span>Ajanda &amp; Takvim</span>
            </button>

            <button
              type="button"
              onClick={onExitHome}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#D99B43] hover:bg-[#E4AC59] text-[#181612] text-xs font-semibold transition-colors cursor-pointer"
            >
              <DoorOpen className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Efeler Sokağına Çık</span>
            </button>
          </div>
        </div>

        {/* Pet Interaction Toast */}
        {petToast && (
          <div className="self-center rounded-xl bg-[#1F1B16]/95 border border-[#E8A08B]/40 px-4 py-2 text-xs font-medium text-[#F5EFE6] flex items-center gap-2 shadow-xl">
            <Heart className="w-3.5 h-3.5 text-[#E88A78]" aria-hidden="true" />
            <span>{petToast}</span>
          </div>
        )}

        {/* Bottom Room Customization Drawer & Control Bar */}
        <div className="flex flex-col items-center gap-2.5">
          {editOpen && (
            <div className="pointer-events-auto w-full max-w-2xl rounded-2xl bg-[#181612]/95 border border-[#F5EFE6]/14 p-4 text-[#F5EFE6] shadow-2xl">
              {/* Tabs */}
              <div className="flex flex-wrap items-center gap-1.5 pb-3 mb-3 border-b border-[#F5EFE6]/10">
                {(
                  [
                    ['furniture', 'Eşyalar & Konum'],
                    ['style', 'Duvar & Zemin'],
                    ['pets', 'Can Dostlarım'],
                    ['atmosphere', 'Hava & Lo-Fi'],
                  ] as const
                ).map(([id, label]) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setDrawerTab(id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                      drawerTab === id
                        ? 'bg-[#D99B43] text-[#181612]'
                        : 'bg-[#25211B] text-[#CFC6B8] hover:text-[#F5EFE6]'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>

              {drawerTab === 'furniture' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
                  {FURNITURE_CATALOG.map((item) => {
                    const placement = roomState.furniture.find((f) => f.id === item.id);
                    const enabled = placement?.enabled ?? true;
                    const slotIdx = (placement?.slotIndex ?? 0) + 1;
                    return (
                      <div
                        key={item.id}
                        className="flex items-center justify-between gap-2 rounded-xl bg-[#24201A] border border-[#F5EFE6]/8 px-3 py-2"
                      >
                        <button
                          type="button"
                          onClick={() => toggleFurniture(item.id)}
                          className={`text-xs font-medium text-left cursor-pointer ${
                            enabled ? 'text-[#F5EFE6]' : 'text-[#7F7669] line-through'
                          }`}
                        >
                          {item.label}
                        </button>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            type="button"
                            onClick={() => cycleFurnitureSlot(item.id)}
                            title="Yerini Değiştir"
                            className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-[#312B23] hover:bg-[#3D352B] text-[11px] text-[#E6DCCB] cursor-pointer"
                          >
                            <RotateCw className="w-3 h-3" aria-hidden="true" />
                            <span>Konum {slotIdx}</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {drawerTab === 'style' && (
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <div className="text-[11px] text-[#BEB5A6] mb-1.5">Duvar Rengi</div>
                    <div className="flex items-center gap-2">
                      {ROOM_WALL_SWATCHES.map((sw) => (
                        <button
                          key={sw.id}
                          type="button"
                          title={sw.name}
                          onClick={() => onChangeRoomState({ ...roomState, wallColor: sw.hex })}
                          className={`w-7 h-7 rounded-full border-2 cursor-pointer ${
                            roomState.wallColor === sw.hex
                              ? 'border-[#F5EFE6] scale-110'
                              : 'border-[#F5EFE6]/25'
                          }`}
                          style={{ backgroundColor: sw.hex }}
                        />
                      ))}
                    </div>
                  </div>

                  <div>
                    <div className="text-[11px] text-[#BEB5A6] mb-1.5">Zemin Dokusu</div>
                    <div className="flex items-center gap-1.5">
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
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer ${
                            roomState.floorTone === tone
                              ? 'bg-[#D99B43] text-[#181612]'
                              : 'bg-[#26221C] text-[#CFC6B8]'
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
                  <div className="flex items-center gap-2">
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
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer ${
                          roomState.petType === p
                            ? 'bg-[#D99B43] text-[#181612]'
                            : 'bg-[#26221C] text-[#CFC6B8]'
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                  <div className="text-xs text-[#C7BEB0]">
                    Odadaki dostlarımıza tıklayarak sevebilirsiniz.
                  </div>
                </div>
              )}

              {drawerTab === 'atmosphere' && (
                <div className="space-y-3">
                  <div>
                    <div className="text-[11px] text-[#BEB5A6] mb-1.5">Pencere Dışı Hava Durumu</div>
                    <div className="flex flex-wrap items-center gap-1.5">
                      {WEATHER_OPTIONS.map((w) => (
                        <button
                          key={w.id}
                          type="button"
                          onClick={() => onChangeWeather(w.id)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer ${
                            weather === w.id
                              ? 'bg-[#D99B43] text-[#181612]'
                              : 'bg-[#26221C] text-[#CFC6B8]'
                          }`}
                        >
                          {w.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <div className="text-[11px] text-[#BEB5A6] mb-1.5">Lo-Fi Müzik Kanalı</div>
                    <div className="flex flex-wrap items-center gap-1.5">
                      {LOFI_TRACKS.map((t) => (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => onChangeLofiTrack(t.id)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer ${
                            lofiTrack === t.id
                              ? 'bg-[#61B88A] text-[#181612]'
                              : 'bg-[#26221C] text-[#CFC6B8]'
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
          <div className="pointer-events-auto flex flex-wrap items-center justify-center gap-2 rounded-2xl bg-[#181612]/92 border border-[#F5EFE6]/12 px-3 py-2 text-[#F5EFE6] shadow-xl">
            <button
              type="button"
              onClick={() => {
                setDrawerTab('furniture');
                setEditOpen((o) => !o);
              }}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                editOpen && drawerTab !== 'atmosphere'
                  ? 'bg-[#D99B43] text-[#181612]'
                  : 'bg-[#24201A] hover:bg-[#302A22] text-[#E6DCCB]'
              }`}
            >
              <Paintbrush className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Odayı Düzenle</span>
            </button>

            <button
              type="button"
              onClick={() =>
                onChangeRoomState({ ...roomState, lampOn: !roomState.lampOn })
              }
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                roomState.lampOn
                  ? 'bg-[#D99B43]/20 border border-[#D99B43]/45 text-[#F3D19C]'
                  : 'bg-[#24201A] text-[#A89F91]'
              }`}
            >
              <LampDesk className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Masa Lambası</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setDrawerTab('pets');
                setEditOpen(true);
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#24201A] hover:bg-[#302A22] text-xs font-medium text-[#E6DCCB] transition-colors cursor-pointer"
            >
              <PawPrint className="w-3.5 h-3.5 text-[#E8A08B]" aria-hidden="true" />
              <span>Dostlarım</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setDrawerTab('atmosphere');
                setEditOpen(true);
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#24201A] hover:bg-[#302A22] text-xs font-medium text-[#E6DCCB] transition-colors cursor-pointer"
            >
              <CloudRain className="w-3.5 h-3.5 text-[#8FBCE6]" aria-hidden="true" />
              <span>Hava &amp; Lo-Fi</span>
            </button>

            <button
              type="button"
              onClick={onToggleMusic}
              title="Lo-Fi Müziği Aç/Kapat"
              className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                musicEnabled && !isMuted
                  ? 'bg-[#2A2620] border-[#D99B43]/35 text-[#D99B43]'
                  : 'bg-[#24201A] border-[#F5EFE6]/10 text-[#8B8274]'
              }`}
            >
              <Music className="w-3.5 h-3.5" aria-hidden="true" />
            </button>

            <button
              type="button"
              onClick={onToggleMute}
              title="Tüm Sesler"
              className="p-1.5 rounded-lg bg-[#24201A] hover:bg-[#2F2A22] border border-[#F5EFE6]/10 text-[#E6DCCB] transition-colors cursor-pointer"
            >
              {isMuted ? (
                <VolumeX className="w-3.5 h-3.5 text-[#C86D5B]" aria-hidden="true" />
              ) : (
                <Volume2 className="w-3.5 h-3.5 text-[#89C490]" aria-hidden="true" />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
