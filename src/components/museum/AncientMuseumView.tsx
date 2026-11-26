import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import {
  ArrowLeft,
  BookOpen,
  Check,
  ChevronDown,
  ChevronUp,
  Compass,
  Eye,
  Flame,
  Flashlight,
  Landmark,
  Lock,
  MapPin,
  Unlock,
  Volume2,
  VolumeX,
} from 'lucide-react';
import {
  ANCIENT_CITIES,
  ANCIENT_CITY_MAP,
  getExhibitsForCity,
  MUSEUM_EXHIBITS,
} from '../../data/ancientMuseumData';
import {
  buildAncientCity,
  resolveMuseumPlayerCollision,
  sampleMuseumSurface,
} from '../../game/museum/ancientCityBuilder';
import { MuseumAudioEngine } from '../../game/museum/museumAudio';
import { createMuseumPbrMaterials } from '../../game/museum/pbrTextures';
import { avatarConfigToAppearance, createSculptedHumanRig } from '../../game/sculptedHumans';
import { narrateMuseumExhibit, stopVoiceGuide } from '../../game/voiceGuide';
import {
  AncientCityId,
  AncientCitySkyTheme,
  AncientMuseumHudSnapshot,
  AvatarConfig,
  CryptLightMode,
  MuseumExhibitDef,
  MuseumSurfaceType,
} from '../../types/game';
import { MuseumExhibitCard } from './MuseumExhibitCard';

interface AncientMuseumViewProps {
  cityId: AncientCityId;
  avatarConfig: AvatarConfig;
  discoveredMuseumIds: string[];
  isMuted: boolean;
  onSelectCity: (nextCityId: AncientCityId) => void;
  onDiscoverExhibit: (exhibit: MuseumExhibitDef) => void;
  onToggleMute: () => void;
  onOpenJournal: () => void;
  onExitMuseum: () => void;
}

const SURFACE_LABELS: Record<MuseumSurfaceType, string> = {
  marble: 'Antik Mermer',
  stone: 'Traverten Taş',
  mosaic: 'Roma Mozaiği',
  dirt: 'Toprak Patika',
  crypt_stone: 'Mahzen Taşı · Yankılı',
};

function detectSoftwareWebGL(): boolean {
  try {
    const testCanvas = document.createElement('canvas');
    const gl = testCanvas.getContext('webgl2') || testCanvas.getContext('webgl');
    if (!gl) return true;
    const dbg = gl.getExtension('WEBGL_debug_renderer_info');
    const rendererStr = dbg
      ? String(gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL) || '')
      : String(gl.getParameter(gl.RENDERER) || '');
    return /SwiftShader|Software|llvmpipe|Mesa OffScreen|ANGLE.*SwiftShader/i.test(rendererStr);
  } catch {
    return false;
  }
}

function createGoldenHourSkyDome(skyTheme: AncientCitySkyTheme): {
  mesh: THREE.Mesh;
  mat: THREE.ShaderMaterial;
  geo: THREE.SphereGeometry;
} {
  const geo = new THREE.SphereGeometry(175, 28, 18);
  const mat = new THREE.ShaderMaterial({
    uniforms: {
      uSunDir: { value: new THREE.Vector3(...skyTheme.sunPos).normalize() },
      uZenith: { value: new THREE.Color(skyTheme.zenithHex) },
      uHorizon: { value: new THREE.Color(skyTheme.horizonHex) },
      uGround: { value: new THREE.Color(skyTheme.groundHex) },
    },
    vertexShader: `
      varying vec3 vWorldDir;
      void main() {
        vec4 worldPos = modelMatrix * vec4(position, 1.0);
        vWorldDir = normalize(worldPos.xyz);
        gl_Position = projectionMatrix * viewMatrix * worldPos;
      }
    `,
    fragmentShader: `
      uniform vec3 uSunDir;
      uniform vec3 uZenith;
      uniform vec3 uHorizon;
      uniform vec3 uGround;
      varying vec3 vWorldDir;
      void main() {
        vec3 d = normalize(vWorldDir);
        float h = clamp(d.y, 0.0, 1.0);
        vec3 col = mix(uHorizon, uZenith, pow(h, 0.58));
        if (d.y < 0.0) {
          col = mix(uHorizon, uGround, clamp(-d.y * 3.5, 0.0, 1.0));
        }
        float sunDot = max(0.0, dot(d, normalize(uSunDir)));
        float sunHalo = pow(sunDot, 12.0) * 0.42 + pow(sunDot, 160.0) * 1.15;
        col += vec3(1.0, 0.84, 0.54) * sunHalo;
        gl_FragColor = vec4(col, 1.0);
      }
    `,
    side: THREE.BackSide,
    depthWrite: false,
    fog: false,
  });
  const mesh = new THREE.Mesh(geo, mat);
  return { mesh, mat, geo };
}

export function AncientMuseumView({
  cityId,
  avatarConfig,
  discoveredMuseumIds,
  isMuted,
  onSelectCity,
  onDiscoverExhibit,
  onToggleMute,
  onOpenJournal,
  onExitMuseum,
}: AncientMuseumViewProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const audioRef = useRef<MuseumAudioEngine | null>(null);

  const cityDef = useMemo(
    () => ANCIENT_CITY_MAP.get(cityId) ?? ANCIENT_CITIES[0],
    [cityId]
  );
  const cityExhibits = useMemo(() => getExhibitsForCity(cityId), [cityId]);

  const discoveredSet = useMemo(() => new Set(discoveredMuseumIds), [discoveredMuseumIds]);
  const discoveredSetRef = useRef<ReadonlySet<string>>(discoveredSet);
  discoveredSetRef.current = discoveredSet;

  const cityDiscoveredCount = useMemo(
    () => cityExhibits.filter((ex) => discoveredSet.has(ex.id)).length,
    [cityExhibits, discoveredSet]
  );

  const isMutedRef = useRef(isMuted);
  isMutedRef.current = isMuted;

  const [isSoftwareGl, setIsSoftwareGl] = useState(false);
  const [contextLost, setContextLost] = useState(false);
  const [dockCollapsed, setDockCollapsed] = useState(false);
  const [teleportOpen, setTeleportOpen] = useState(false);
  const [citySwitcherOpen, setCitySwitcherOpen] = useState(false);
  const [voicePlaying, setVoicePlaying] = useState(false);
  const [voiceLoading, setVoiceLoading] = useState(false);
  const [noticeToast, setNoticeToast] = useState<string | null>(null);
  const [newlyDiscoveredId, setNewlyDiscoveredId] = useState<string | null>(null);

  const [hud, setHud] = useState<AncientMuseumHudSnapshot>({
    zoneName: cityDef.plazaZoneName,
    surfaceType: 'stone',
    inCrypt: false,
    cryptFactor: 0,
    lightActive: false,
    lightMode: 'torch',
    focusZoomActive: false,
    pointerLocked: false,
    nearbyExhibit: null,
    activeExhibit: null,
    playerElevation: 0,
  });

  // Imperative bridge refs between React controls and Three.js loop
  const activeExhibitRef = useRef<MuseumExhibitDef | null>(null);
  const nearbyExhibitRef = useRef<MuseumExhibitDef | null>(null);
  const lightModeRef = useRef<CryptLightMode>('torch');
  const manualLightOnRef = useRef<boolean>(false);
  const zoomToggleRef = useRef<boolean>(false);
  const rightMouseZoomRef = useRef<boolean>(false);
  const teleportRequestRef = useRef<{ x: number; z: number; yaw?: number } | null>(null);
  const touchMoveRef = useRef<{ x: number; y: number; running: boolean }>({
    x: 0,
    y: 0,
    running: false,
  });
  const canvasDomRef = useRef<HTMLCanvasElement | null>(null);
  const toastTimerRef = useRef<number | null>(null);

  const showToast = useCallback((msg: string) => {
    setNoticeToast(msg);
    if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current);
    toastTimerRef.current = window.setTimeout(() => setNoticeToast(null), 3200);
  }, []);

  const stopExhibitVoice = useCallback(() => {
    stopVoiceGuide();
    setVoiceLoading(false);
    setVoicePlaying(false);
  }, []);

  const openExhibitInspection = useCallback(
    (exhibit: MuseumExhibitDef) => {
      audioRef.current?.init();
      audioRef.current?.playExhibitFocusChime();
      if (document.pointerLockElement) {
        try {
          document.exitPointerLock();
        } catch {
          // Ignore exitPointerLock errors
        }
      }
      stopExhibitVoice();
      activeExhibitRef.current = exhibit;
      const isNew = !discoveredSetRef.current.has(exhibit.id);
      setNewlyDiscoveredId(isNew ? exhibit.id : null);
      if (isNew) {
        onDiscoverExhibit(exhibit);
      }
      setTeleportOpen(false);
      setCitySwitcherOpen(false);
      setHud((prev) => ({ ...prev, activeExhibit: exhibit, pointerLocked: false }));
    },
    [onDiscoverExhibit, stopExhibitVoice]
  );

  const closeExhibitInspection = useCallback(() => {
    stopExhibitVoice();
    activeExhibitRef.current = null;
    setNewlyDiscoveredId(null);
    setHud((prev) => ({ ...prev, activeExhibit: null }));
  }, [stopExhibitVoice]);

  const handleToggleExhibitVoice = useCallback(() => {
    const target = activeExhibitRef.current;
    if (!target) return;
    if (voicePlaying || voiceLoading) {
      stopExhibitVoice();
      return;
    }
    if (isMutedRef.current) {
      showToast('Sesli Rehber’i dinlemek için önce sesi açın.');
      return;
    }
    void narrateMuseumExhibit(target.id, target.voiceNarrationText, {
      onLoading: () => {
        setVoiceLoading(true);
        setVoicePlaying(false);
      },
      onStart: () => {
        setVoiceLoading(false);
        setVoicePlaying(true);
      },
      onEnd: () => {
        setVoiceLoading(false);
        setVoicePlaying(false);
      },
      onFallbackNotice: (msg) => showToast(msg),
      onError: () => {
        setVoiceLoading(false);
        setVoicePlaying(false);
        showToast('Sesli Rehber şu anda başlatılamadı.');
      },
    });
  }, [showToast, stopExhibitVoice, voiceLoading, voicePlaying]);

  const handleSwitchLightMode = useCallback(() => {
    audioRef.current?.init();
    const next: CryptLightMode = lightModeRef.current === 'torch' ? 'flashlight' : 'torch';
    lightModeRef.current = next;
    // If outdoors and off, also switch it on so user sees immediate feedback!
    if (!manualLightOnRef.current && hud.cryptFactor < 0.32) {
      manualLightOnRef.current = true;
    }
    audioRef.current?.playLightToggleClick(next);
    showToast(
      next === 'torch'
        ? 'Antik Meşale modu seçildi (sıcak titreşimli alev)'
        : 'Arkeolog El Feneri modu seçildi (odaklı spot ışığı)'
    );
    setHud((prev) => ({ ...prev, lightMode: next, lightActive: true }));
  }, [hud.cryptFactor, showToast]);

  const handleToggleManualLight = useCallback(() => {
    audioRef.current?.init();
    manualLightOnRef.current = !manualLightOnRef.current;
    audioRef.current?.playLightToggleClick(lightModeRef.current);
  }, []);

  const handleToggleZoom = useCallback(() => {
    zoomToggleRef.current = !zoomToggleRef.current;
  }, []);

  const handleTogglePointerLock = useCallback(() => {
    const canvas = canvasDomRef.current;
    if (!canvas) return;
    if (document.pointerLockElement === canvas) {
      document.exitPointerLock();
    } else if (!activeExhibitRef.current) {
      try {
        canvas.requestPointerLock?.();
      } catch {
        showToast('Tarayıcı fare kilidine izin vermedi; sürükleyerek bakabilirsiniz.');
      }
    }
  }, [showToast]);

  const handleTeleportToExhibit = useCallback(
    (exhibit: MuseumExhibitDef) => {
      closeExhibitInspection();
      const [sx, , sz] = exhibit.standPosition;
      // Place explorer cleanly 2.1m in front of the exhibit stand
      const angle = exhibit.standRotationY;
      const tx = sx + Math.sin(angle) * 2.1;
      const tz = sz + Math.cos(angle) * 2.1;
      teleportRequestRef.current = { x: tx, z: tz, yaw: angle + Math.PI };
      setTeleportOpen(false);
      showToast(`${exhibit.title} noktasına geçildi.`);
    },
    [closeExhibitInspection, showToast]
  );

  // Keep MuseumAudioEngine mute state synced
  useEffect(() => {
    audioRef.current?.setMuted(isMuted);
  }, [isMuted]);

  // Main Three.js Scene + Over-the-Shoulder Camera + Physics + Lighting + Audio Loop
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const swGl = detectSoftwareWebGL();
    setIsSoftwareGl(swGl);

    const museumAudio = new MuseumAudioEngine();
    museumAudio.setMuted(isMutedRef.current);
    audioRef.current = museumAudio;

    const renderer = new THREE.WebGLRenderer({
      antialias: !swGl,
      powerPreference: 'high-performance',
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, swGl ? 1 : 2));
    renderer.setSize(container.clientWidth || window.innerWidth, container.clientHeight || window.innerHeight);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.08;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    if (!swGl) {
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    }

    const canvas = renderer.domElement;
    canvas.style.display = 'block';
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    canvas.style.touchAction = 'none';
    container.appendChild(canvas);
    canvasDomRef.current = canvas;

    const onContextLost = (e: Event) => {
      e.preventDefault();
      setContextLost(true);
    };
    const onContextRestored = () => {
      setContextLost(false);
    };
    canvas.addEventListener('webglcontextlost', onContextLost);
    canvas.addEventListener('webglcontextrestored', onContextRestored);

    // Reset transient UI & imperative state when entering/switching ancient cities
    stopExhibitVoice();
    activeExhibitRef.current = null;
    nearbyExhibitRef.current = null;
    teleportRequestRef.current = null;
    zoomToggleRef.current = false;
    rightMouseZoomRef.current = false;
    setTeleportOpen(false);
    setCitySwitcherOpen(false);
    setNewlyDiscoveredId(null);
    setHud((prev) => ({
      ...prev,
      zoneName: cityDef.plazaZoneName,
      surfaceType: 'stone',
      inCrypt: false,
      cryptFactor: 0,
      focusZoomActive: false,
      pointerLocked: false,
      nearbyExhibit: null,
      activeExhibit: null,
      playerElevation: 0,
    }));
    showToast(`${cityDef.name} — ${cityDef.tagline}`);

    const skyTheme = cityDef.skyTheme;
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(skyTheme.fogHex);
    scene.fog = new THREE.FogExp2(skyTheme.fogHex, skyTheme.fogDensity);

    // PMREM IBL for realistic antique marble & bronze specular response
    const pmrem = new THREE.PMREMGenerator(renderer);
    const roomEnv = new RoomEnvironment();
    const envTarget = pmrem.fromScene(roomEnv, 0.04);
    scene.environment = envTarget.texture;
    roomEnv.dispose();
    pmrem.dispose();

    const camera = new THREE.PerspectiveCamera(
      52,
      (container.clientWidth || window.innerWidth) / (container.clientHeight || window.innerHeight),
      0.15,
      260
    );

    // Golden Hour Sky Dome tailored per ancient city
    const sky = createGoldenHourSkyDome(skyTheme);
    scene.add(sky.mesh);

    // Golden Hour Lighting Rig
    const hemiLight = new THREE.HemisphereLight(skyTheme.hemiSkyHex, skyTheme.hemiGroundHex, 0.88);
    scene.add(hemiLight);

    const sunLight = new THREE.DirectionalLight(skyTheme.sunColorHex, skyTheme.sunIntensity);
    sunLight.position.set(...skyTheme.sunPos);
    if (!swGl) {
      sunLight.castShadow = true;
      sunLight.shadow.mapSize.width = 2048;
      sunLight.shadow.mapSize.height = 2048;
      sunLight.shadow.camera.near = 6;
      sunLight.shadow.camera.far = 140;
      const d = 46;
      sunLight.shadow.camera.left = -d;
      sunLight.shadow.camera.right = d;
      sunLight.shadow.camera.top = d;
      sunLight.shadow.camera.bottom = -d;
      sunLight.shadow.bias = -0.0004;
      sunLight.shadow.normalBias = 0.03;
      sunLight.shadow.radius = 3.2;
    }
    scene.add(sunLight);

    // Cool opposite sky bounce light so shadows in stone recesses stay lush and readable
    const fillLight = new THREE.DirectionalLight(0x88b0d8, 0.42);
    fillLight.position.set(36, 18, -28);
    scene.add(fillLight);

    // Build Procedural PBR Materials & Enterable Ancient City
    const maxAniso = renderer.capabilities.getMaxAnisotropy();
    const pbrMats = createMuseumPbrMaterials(maxAniso, swGl);
    const city = buildAncientCity(cityId, pbrMats, swGl);
    scene.add(city.root);

    // Build Player Sculpted Explorer Character (1:1 Human Scale ~1.74m tall)
    const explorerRig = createSculptedHumanRig(avatarConfigToAppearance(avatarConfig), {
      castShadow: !swGl ? 'full' : false,
    });
    explorerRig.root.scale.setScalar(1.08);
    explorerRig.root.traverse((obj: THREE.Object3D) => {
      if ((obj as THREE.Mesh).isMesh) {
        obj.castShadow = !swGl;
        obj.receiveShadow = true;
      }
    });
    scene.add(explorerRig.root);

    // Dual-Mode Held Light Props mounted cleanly to explorerRig.rightHandMount
    // Note: rightHandMount already applies inverse humanScale (1 / 0.152), so coordinates here are in world meters (~1.08x).
    // 1) Sculpted Ancient Torch (~44 cm tall, realistic hand-held proportions) + flickering flame + warm embers
    const torchProp = new THREE.Group();
    torchProp.rotation.x = 1.12; // Counteract forward-bent holding arm so torch stands upright with slight forward lean

    const torchHandlePoints = [
      new THREE.Vector2(0.0, -0.095),
      new THREE.Vector2(0.015, -0.09),
      new THREE.Vector2(0.014, -0.05),
      new THREE.Vector2(0.0165, 0.04),
      new THREE.Vector2(0.0195, 0.16),
      new THREE.Vector2(0.023, 0.25),
      new THREE.Vector2(0.019, 0.26),
      new THREE.Vector2(0.0, 0.26),
    ];
    const torchHandleGeo = new THREE.LatheGeometry(torchHandlePoints, 14);
    const torchHandleMat = new THREE.MeshStandardMaterial({
      color: 0x523722,
      roughness: 0.88,
      metalness: 0.04,
      flatShading: false,
    });
    const torchHandle = new THREE.Mesh(torchHandleGeo, torchHandleMat);
    torchHandle.castShadow = !swGl;
    torchHandle.receiveShadow = true;
    torchProp.add(torchHandle);

    const torchGripGeo = new THREE.CylinderGeometry(0.0195, 0.018, 0.1, 14);
    const torchGripMat = new THREE.MeshStandardMaterial({
      color: 0x2d1c11,
      roughness: 0.94,
      metalness: 0.02,
    });
    const torchGrip = new THREE.Mesh(torchGripGeo, torchGripMat);
    torchGrip.position.set(0, 0.01, 0);
    torchProp.add(torchGrip);

    const torchCupPoints = [
      new THREE.Vector2(0.018, 0.24),
      new THREE.Vector2(0.025, 0.255),
      new THREE.Vector2(0.032, 0.285),
      new THREE.Vector2(0.042, 0.32),
      new THREE.Vector2(0.045, 0.33),
      new THREE.Vector2(0.038, 0.332),
      new THREE.Vector2(0.032, 0.3),
      new THREE.Vector2(0.0, 0.295),
    ];
    const torchCupGeo = new THREE.LatheGeometry(torchCupPoints, 16);
    const torchCupMat = new THREE.MeshStandardMaterial({
      color: 0x3b3530,
      roughness: 0.48,
      metalness: 0.68,
      flatShading: false,
    });
    const torchCup = new THREE.Mesh(torchCupGeo, torchCupMat);
    torchCup.castShadow = !swGl;
    torchCup.receiveShadow = true;
    torchProp.add(torchCup);

    const flameGeo = new THREE.ConeGeometry(0.034, 0.125, 12);
    const flameMat = new THREE.MeshBasicMaterial({ color: 0xffa63d });
    const flameMesh = new THREE.Mesh(flameGeo, flameMat);
    flameMesh.position.set(0, 0.382, 0);
    torchProp.add(flameMesh);

    const flameCoreGeo = new THREE.SphereGeometry(0.021, 10, 8);
    const flameCoreMat = new THREE.MeshBasicMaterial({ color: 0xfff0b3 });
    const flameCore = new THREE.Mesh(flameCoreGeo, flameCoreMat);
    flameCore.position.set(0, 0.348, 0);
    torchProp.add(flameCore);
    torchProp.visible = false;
    explorerRig.rightHandMount.add(torchProp);

    // 2) Sculpted Modern Archaeologist Flashlight (~20.5 cm long, realistic hand-held proportions)
    const flashProp = new THREE.Group();
    flashProp.rotation.x = 1.02; // Point horizontally forward along explorer facing direction

    const flashProfile = [
      new THREE.Vector2(0.0, -0.06),
      new THREE.Vector2(0.0155, -0.058),
      new THREE.Vector2(0.0175, -0.045),
      new THREE.Vector2(0.0175, 0.085),
      new THREE.Vector2(0.021, 0.102),
      new THREE.Vector2(0.0265, 0.115),
      new THREE.Vector2(0.0265, 0.145),
      new THREE.Vector2(0.023, 0.146),
      new THREE.Vector2(0.0, 0.14),
    ];
    const flashBodyGeo = new THREE.LatheGeometry(flashProfile, 16);
    flashBodyGeo.rotateX(Math.PI * 0.5);
    const flashBodyMat = new THREE.MeshStandardMaterial({
      color: 0x2c323a,
      roughness: 0.34,
      metalness: 0.82,
      flatShading: false,
    });
    const flashBody = new THREE.Mesh(flashBodyGeo, flashBodyMat);
    flashBody.castShadow = !swGl;
    flashBody.receiveShadow = true;
    flashProp.add(flashBody);

    const flashRingGeo = new THREE.TorusGeometry(0.0185, 0.0032, 8, 16);
    const flashRingMat = new THREE.MeshStandardMaterial({
      color: 0xc89a4b,
      roughness: 0.32,
      metalness: 0.78,
    });
    const flashRing = new THREE.Mesh(flashRingGeo, flashRingMat);
    flashRing.position.set(0, 0, 0.052);
    flashProp.add(flashRing);

    const flashLensGeo = new THREE.CircleGeometry(0.0225, 16);
    const flashLensMat = new THREE.MeshBasicMaterial({ color: 0xf4faff });
    const flashLens = new THREE.Mesh(flashLensGeo, flashLensMat);
    flashLens.position.set(0, 0, 0.147);
    flashProp.add(flashLens);
    flashProp.visible = false;
    explorerRig.rightHandMount.add(flashProp);

    // World-space dynamic lights driven by the held prop
    const torchLight = new THREE.PointLight(0xff8e36, 0, 18, 1.7);
    scene.add(torchLight);

    const flashlightSpot = new THREE.SpotLight(0xeef6ff, 0, 28, Math.PI * 0.22, 0.46, 1.45);
    scene.add(flashlightSpot);
    scene.add(flashlightSpot.target);

    // Rising torch ember particles
    const emberCount = 24;
    const emberPositions = new Float32Array(emberCount * 3);
    const emberLife = new Float32Array(emberCount);
    for (let i = 0; i < emberCount; i++) {
      emberLife[i] = Math.random();
    }
    const emberGeo = new THREE.BufferGeometry();
    emberGeo.setAttribute('position', new THREE.BufferAttribute(emberPositions, 3));
    const emberMat = new THREE.PointsMaterial({
      size: 0.042,
      map: pbrMats.dustSpriteTexture,
      color: 0xff9a38,
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const emberPoints = new THREE.Points(emberGeo, emberMat);
    emberPoints.visible = false;
    scene.add(emberPoints);

    // ============================================================================
    // PLAYER & OVER-THE-SHOULDER CAMERA STATE
    // ============================================================================
    const spawnSurf = sampleMuseumSurface(cityDef.spawnPos[0], cityDef.spawnPos[2], cityId);
    const playerPos = new THREE.Vector3(
      cityDef.spawnPos[0],
      spawnSurf.height,
      cityDef.spawnPos[2]
    );
    let playerYaw = cityDef.spawnYaw;
    let camYaw = cityDef.spawnYaw - Math.PI;
    let camPitch = 0.14;
    let currentArmDist = 3.15;
    let timeScale = 1.0;
    let strideAccumulator = 0;
    let hudEmitTimer = 0;

    const currentCamPos = new THREE.Vector3(
      playerPos.x + Math.cos(camYaw) * 0.58 + Math.sin(camYaw) * 3.15,
      playerPos.y + 2.0,
      playerPos.z - Math.sin(camYaw) * 0.58 + Math.cos(camYaw) * 3.15
    );
    const currentLookAt = new THREE.Vector3(
      playerPos.x - Math.sin(camYaw) * 5.0,
      playerPos.y + 1.45,
      playerPos.z - Math.cos(camYaw) * 5.0
    );

    // Pre-allocated scratch vectors (zero per-frame GC allocations)
    const raycaster = new THREE.Raycaster();
    const tmpShoulderPivot = new THREE.Vector3();
    const tmpDesiredCam = new THREE.Vector3();
    const tmpDesiredLook = new THREE.Vector3();
    const tmpRayDir = new THREE.Vector3();
    const tmpRight = new THREE.Vector3();
    const tmpForward = new THREE.Vector3();
    const tmpMove = new THREE.Vector3();
    const tmpHandWorld = new THREE.Vector3();
    const tmpCamForward = new THREE.Vector3();

    // Input Tracking
    const keys = new Set<string>();
    let draggingLook = false;
    let lastPointerX = 0;
    let lastPointerY = 0;

    const onKeyDown = (e: KeyboardEvent) => {
      museumAudio.init();
      const tag = document.activeElement?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;

      keys.add(e.code);

      if (e.code === 'KeyE' && !e.repeat) {
        if (activeExhibitRef.current) {
          closeExhibitInspection();
        } else if (nearbyExhibitRef.current) {
          openExhibitInspection(nearbyExhibitRef.current);
        }
      } else if (e.code === 'KeyV' && !e.repeat && !activeExhibitRef.current) {
        zoomToggleRef.current = !zoomToggleRef.current;
      } else if (e.code === 'KeyF' && !e.repeat) {
        const next: CryptLightMode = lightModeRef.current === 'torch' ? 'flashlight' : 'torch';
        lightModeRef.current = next;
        const surf = sampleMuseumSurface(playerPos.x, playerPos.z, cityId);
        if (surf.cryptFactor < 0.32 && !manualLightOnRef.current) {
          manualLightOnRef.current = true;
        }
        museumAudio.playLightToggleClick(next);
        showToast(
          next === 'torch'
            ? 'Antik Meşale modu (sıcak titreşimli alev)'
            : 'Arkeolog El Feneri modu (odaklı spot ışığı)'
        );
      } else if (e.code === 'KeyL' && !e.repeat) {
        manualLightOnRef.current = !manualLightOnRef.current;
        museumAudio.playLightToggleClick(lightModeRef.current);
      } else if (e.code === 'Escape' && !e.repeat) {
        if (document.pointerLockElement === canvas) {
          document.exitPointerLock();
        } else if (activeExhibitRef.current) {
          closeExhibitInspection();
        }
      }
    };

    const onKeyUp = (e: KeyboardEvent) => {
      keys.delete(e.code);
    };

    const onPointerDown = (e: PointerEvent) => {
      museumAudio.init();
      if (activeExhibitRef.current) return;
      if (e.button === 2) {
        rightMouseZoomRef.current = true;
        return;
      }
      if (e.button === 1) {
        e.preventDefault();
        handleTogglePointerLock();
        return;
      }
      if (e.button === 0) {
        draggingLook = true;
        lastPointerX = e.clientX;
        lastPointerY = e.clientY;
        canvas.setPointerCapture?.(e.pointerId);
      }
    };

    const onPointerMove = (e: PointerEvent) => {
      if (activeExhibitRef.current) return;
      if (document.pointerLockElement === canvas) {
        camYaw -= e.movementX * 0.0026;
        camPitch = THREE.MathUtils.clamp(camPitch + e.movementY * 0.0022, -0.44, 0.92);
        return;
      }
      if (!draggingLook) return;
      const dx = e.clientX - lastPointerX;
      const dy = e.clientY - lastPointerY;
      lastPointerX = e.clientX;
      lastPointerY = e.clientY;
      camYaw -= dx * 0.0044;
      camPitch = THREE.MathUtils.clamp(camPitch + dy * 0.0036, -0.44, 0.92);
    };

    const onPointerUp = (e: PointerEvent) => {
      if (e.button === 2) {
        rightMouseZoomRef.current = false;
      }
      if (e.button === 0) {
        draggingLook = false;
      }
    };

    const onContextMenu = (e: MouseEvent) => {
      e.preventDefault();
    };

    const onPointerLockChange = () => {
      const locked = document.pointerLockElement === canvas;
      setHud((prev) => (prev.pointerLocked === locked ? prev : { ...prev, pointerLocked: locked }));
    };

    const onResize = () => {
      const w = container.clientWidth || window.innerWidth;
      const h = container.clientHeight || window.innerHeight;
      camera.aspect = w / Math.max(1, h);
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('resize', onResize);
    document.addEventListener('pointerlockchange', onPointerLockChange);
    canvas.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    canvas.addEventListener('contextmenu', onContextMenu);

    // ============================================================================
    // MAIN SIMULATION & RENDER LOOP (with software-WebGL pacing safety)
    // ============================================================================
    let rafId = 0;
    let timeoutId = 0;
    let disposed = false;
    let lastTime = performance.now();
    let worldElapsed = 0;

    const tick = () => {
      if (disposed) return;

      const now = performance.now();
      const rawDt = Math.min(0.05, Math.max(0.001, (now - lastTime) / 1000));
      lastTime = now;

      // Apply requested instant teleport (from exhibit quick-jump menu)
      if (teleportRequestRef.current) {
        const tp = teleportRequestRef.current;
        teleportRequestRef.current = null;
        playerPos.x = tp.x;
        playerPos.z = tp.z;
        const tpSurf = sampleMuseumSurface(tp.x, tp.z, cityId);
        playerPos.y = tpSurf.height;
        if (typeof tp.yaw === 'number') {
          playerYaw = tp.yaw;
          camYaw = tp.yaw - Math.PI;
        }
      }

      // Smooth Bullet-Time / Time Dilation during exhibit inspection!
      const targetTimeScale = activeExhibitRef.current ? 0.18 : 1.0;
      timeScale = THREE.MathUtils.damp(timeScale, targetTimeScale, 5.5, rawDt);
      const simDt = rawDt * timeScale;
      worldElapsed += simDt;

      // 1. Player Locomotion & Stone-Step Ground Following
      let moveSpeed = 0;
      let isRunning = false;
      if (!activeExhibitRef.current) {
        let forwardInput = 0;
        let strafeInput = 0;
        if (keys.has('KeyW') || keys.has('ArrowUp')) forwardInput += 1;
        if (keys.has('KeyS') || keys.has('ArrowDown')) forwardInput -= 1;
        if (keys.has('KeyD') || keys.has('ArrowRight')) strafeInput += 1;
        if (keys.has('KeyA') || keys.has('ArrowLeft')) strafeInput -= 1;

        // Blend mobile touch joystick
        if (Math.abs(touchMoveRef.current.y) > 0.05) forwardInput += touchMoveRef.current.y;
        if (Math.abs(touchMoveRef.current.x) > 0.05) strafeInput += touchMoveRef.current.x;

        isRunning =
          keys.has('ShiftLeft') || keys.has('ShiftRight') || touchMoveRef.current.running;
        const focusZoomNow = zoomToggleRef.current || rightMouseZoomRef.current;

        const inputLen = Math.hypot(forwardInput, strafeInput);
        if (inputLen > 0.05) {
          const nf = forwardInput / Math.max(1, inputLen);
          const ns = strafeInput / Math.max(1, inputLen);
          // Camera forward direction in XZ plane (camYaw = 0 looks toward -Z)
          tmpForward.set(-Math.sin(camYaw), 0, -Math.cos(camYaw));
          tmpRight.set(Math.cos(camYaw), 0, -Math.sin(camYaw));
          tmpMove
            .set(0, 0, 0)
            .addScaledVector(tmpForward, nf)
            .addScaledVector(tmpRight, ns)
            .normalize();

          const maxSpeed = focusZoomNow ? 2.15 : isRunning ? 5.65 : 3.25;
          moveSpeed = maxSpeed * Math.min(1, inputLen);

          const nextX = playerPos.x + tmpMove.x * moveSpeed * simDt;
          const nextZ = playerPos.z + tmpMove.z * moveSpeed * simDt;
          const resolved = resolveMuseumPlayerCollision(
            nextX,
            nextZ,
            playerPos.y,
            0.42,
            city.boxColliders,
            city.cylinderColliders
          );
          playerPos.x = resolved.x;
          playerPos.z = resolved.z;

          // Smooth character facing toward movement vector
          const targetCharYaw = Math.atan2(tmpMove.x, tmpMove.z);
          let deltaYaw = targetCharYaw - playerYaw;
          while (deltaYaw > Math.PI) deltaYaw -= Math.PI * 2;
          while (deltaYaw < -Math.PI) deltaYaw += Math.PI * 2;
          playerYaw += deltaYaw * (1 - Math.exp(-11 * rawDt));
        }
      }

      const surf = sampleMuseumSurface(playerPos.x, playerPos.z, cityId);
      playerPos.y = THREE.MathUtils.damp(playerPos.y, surf.height, 14, rawDt);

      // Update Explorer Mesh Pose & Fluid Walk/Run/Step Animation
      explorerRig.root.position.copy(playerPos);
      explorerRig.root.rotation.y = playerYaw;

      const autoCryptLightOn = surf.cryptFactor > 0.32;
      const lightActive = autoCryptLightOn || manualLightOnRef.current;
      const activeMode = lightModeRef.current;

      // Pass speed scaled for expressive walking/running stride + hold right arm forward when light is on
      explorerRig.updateWalk(moveSpeed * 0.92, simDt, worldElapsed, lightActive);

      // Synchronized surface-aware footsteps
      if (moveSpeed > 0.45 && !activeExhibitRef.current) {
        strideAccumulator += moveSpeed * simDt;
        const stepInterval = isRunning ? 1.55 : 1.18;
        if (strideAccumulator >= stepInterval) {
          strideAccumulator -= stepInterval;
          museumAudio.playFootstep(surf.surfaceType, surf.cryptFactor, isRunning);
        }
      } else {
        strideAccumulator = Math.min(strideAccumulator, 0.7);
      }

      // 2. Dynamic Golden Hour -> Vaulted Crypt Lighting & Dual-Mode Auto-Light
      const outdoorVisibility = 1 - surf.cryptFactor * 0.84;
      sunLight.intensity = THREE.MathUtils.damp(
        sunLight.intensity,
        skyTheme.sunIntensity * outdoorVisibility,
        6,
        rawDt
      );
      hemiLight.intensity = THREE.MathUtils.damp(hemiLight.intensity, 0.88 * outdoorVisibility + 0.08, 6, rawDt);
      fillLight.intensity = THREE.MathUtils.damp(fillLight.intensity, 0.42 * outdoorVisibility, 6, rawDt);

      // Subtle atmospheric fog adaptation inside crypt
      const fog = scene.fog as THREE.FogExp2;
      fog.density = THREE.MathUtils.damp(
        fog.density,
        skyTheme.fogDensity + surf.cryptFactor * 0.018,
        5,
        rawDt
      );

      torchProp.visible = lightActive && activeMode === 'torch';
      flashProp.visible = lightActive && activeMode === 'flashlight';
      emberPoints.visible = lightActive && activeMode === 'torch';

      if (lightActive && activeMode === 'torch') {
        flameCore.getWorldPosition(tmpHandWorld);
        // Warm living torch flicker
        const flicker =
          1 +
          Math.sin(worldElapsed * 17.5) * 0.12 +
          Math.sin(worldElapsed * 29.3) * 0.07 +
          Math.cos(worldElapsed * 11.2) * 0.06;
        const targetInt = (6.8 + surf.cryptFactor * 6.5) * flicker;
        torchLight.intensity = THREE.MathUtils.damp(torchLight.intensity, targetInt, 16, rawDt);
        torchLight.position.set(tmpHandWorld.x, tmpHandWorld.y + 0.08, tmpHandWorld.z);
        flameMesh.scale.set(
          0.92 + Math.sin(worldElapsed * 22) * 0.14,
          0.95 + Math.cos(worldElapsed * 18) * 0.2,
          0.92 + Math.sin(worldElapsed * 25) * 0.14
        );
        flashlightSpot.intensity = THREE.MathUtils.damp(flashlightSpot.intensity, 0, 14, rawDt);

        // Animate rising ember sparks directly from the torch flame tip
        const eAttr = emberGeo.attributes.position as THREE.BufferAttribute;
        for (let i = 0; i < emberCount; i++) {
          emberLife[i] += simDt * (0.85 + (i % 5) * 0.15);
          if (emberLife[i] >= 1) emberLife[i] -= 1;
          const t = emberLife[i];
          const swirl = worldElapsed * 3.5 + i * 1.9;
          eAttr.setXYZ(
            i,
            tmpHandWorld.x + Math.cos(swirl) * (0.016 + t * 0.055),
            tmpHandWorld.y + 0.04 + t * 0.42,
            tmpHandWorld.z + Math.sin(swirl) * (0.016 + t * 0.055)
          );
        }
        eAttr.needsUpdate = true;
      } else if (lightActive && activeMode === 'flashlight') {
        flashLens.getWorldPosition(tmpHandWorld);
        torchLight.intensity = THREE.MathUtils.damp(torchLight.intensity, 0, 14, rawDt);
        const targetSpot = 14.0 + surf.cryptFactor * 14.0;
        flashlightSpot.intensity = THREE.MathUtils.damp(flashlightSpot.intensity, targetSpot, 14, rawDt);
        flashlightSpot.position.copy(tmpHandWorld);
        camera.getWorldDirection(tmpCamForward);
        flashlightSpot.target.position.copy(flashlightSpot.position).addScaledVector(tmpCamForward, 12);
      } else {
        torchLight.intensity = THREE.MathUtils.damp(torchLight.intensity, 0, 10, rawDt);
        flashlightSpot.intensity = THREE.MathUtils.damp(flashlightSpot.intensity, 0, 10, rawDt);
      }

      // 3. Nearest Interactive Museum Plinth Detection
      let closestEx: MuseumExhibitDef | null = null;
      let closestDist = 3.7;
      for (let i = 0; i < city.plinths.length; i++) {
        const p = city.plinths[i];
        const d = playerPos.distanceTo(p.group.position);
        if (d < closestDist) {
          closestDist = d;
          closestEx = p.exhibit;
        }
      }
      nearbyExhibitRef.current = closestEx;

      // 4. Camera Choreography: Curatorial Exhibit Focus OR Over-the-Shoulder Spring-Arm
      const focusZoomActive = zoomToggleRef.current || rightMouseZoomRef.current;
      const inspecting = activeExhibitRef.current;

      if (inspecting) {
        tmpDesiredCam.set(...inspecting.focusCameraPos);
        tmpDesiredLook.set(...inspecting.focusLookAt);
        currentCamPos.lerp(tmpDesiredCam, 1 - Math.exp(-4.6 * rawDt));
        currentLookAt.lerp(tmpDesiredLook, 1 - Math.exp(-5.4 * rawDt));
        camera.fov = THREE.MathUtils.damp(camera.fov, 42, 5, rawDt);
        camera.updateProjectionMatrix();
      } else {
        // Right-shoulder anchor point above explorer
        const shoulderRight = focusZoomActive ? 0.44 : 0.58;
        const shoulderUp = focusZoomActive ? 1.54 : 1.62;
        const targetArmDist = focusZoomActive ? 1.48 : 3.18;

        tmpRight.set(Math.cos(camYaw), 0, -Math.sin(camYaw));
        tmpShoulderPivot.set(
          playerPos.x + tmpRight.x * shoulderRight,
          playerPos.y + shoulderUp,
          playerPos.z + tmpRight.z * shoulderRight
        );

        // Spherical orbit behind the shoulder
        const cosPitch = Math.cos(camPitch);
        tmpRayDir
          .set(Math.sin(camYaw) * cosPitch, Math.sin(camPitch), Math.cos(camYaw) * cosPitch)
          .normalize();

        // Spring-Arm Raycast Collision against walls, arches, columns, & vaulted crypt ceiling!
        raycaster.set(tmpShoulderPivot, tmpRayDir);
        raycaster.near = 0.1;
        raycaster.far = targetArmDist + 0.35;
        const hits = raycaster.intersectObjects(city.cameraCollisionMeshes, false);

        let safeDist = targetArmDist;
        if (hits.length > 0) {
          safeDist = Math.max(0.55, hits[0].distance - 0.28);
        }

        // Fast pull-in on obstacle hit (zero wall clip), smooth relaxed pull-out when clear
        const springLambda = safeDist < currentArmDist ? 22 : 7.5;
        currentArmDist = THREE.MathUtils.damp(currentArmDist, safeDist, springLambda, rawDt);

        tmpDesiredCam.copy(tmpShoulderPivot).addScaledVector(tmpRayDir, currentArmDist);
        // Never allow camera below current floor surface
        const camGround = sampleMuseumSurface(tmpDesiredCam.x, tmpDesiredCam.z, cityId).height;
        if (tmpDesiredCam.y < camGround + 0.38) {
          tmpDesiredCam.y = camGround + 0.38;
        }

        // Look forward past the shoulder along the gaze ray
        tmpDesiredLook.copy(tmpShoulderPivot).addScaledVector(tmpRayDir, -8.0);

        const posLambda = focusZoomActive ? 14 : 11;
        currentCamPos.lerp(tmpDesiredCam, 1 - Math.exp(-posLambda * rawDt));
        currentLookAt.lerp(tmpDesiredLook, 1 - Math.exp(-15 * rawDt));

        const targetFov = focusZoomActive ? 36 : isRunning && moveSpeed > 3.8 ? 56 : 52;
        if (Math.abs(camera.fov - targetFov) > 0.05) {
          camera.fov = THREE.MathUtils.damp(camera.fov, targetFov, 8, rawDt);
          camera.updateProjectionMatrix();
        }
      }

      camera.position.copy(currentCamPos);
      camera.lookAt(currentLookAt);

      // 5. Update Volumetric God Rays, Floating Dust Motes, Wind Foliage & Audio Ambience
      city.updateAtmosphere(
        worldElapsed,
        simDt,
        playerPos,
        closestEx?.id ?? null,
        discoveredSetRef.current
      );
      museumAudio.updateAmbience(
        rawDt,
        surf.cryptFactor,
        timeScale,
        lightActive && activeMode === 'torch'
      );

      // Render Frame
      renderer.render(scene, camera);

      // Throttled HUD snapshot updates (~10 Hz) so React never fights WebGL FPS
      hudEmitTimer += rawDt;
      if (hudEmitTimer >= 0.1) {
        hudEmitTimer = 0;
        const nextSnap: AncientMuseumHudSnapshot = {
          zoneName: surf.zoneName,
          surfaceType: surf.surfaceType,
          inCrypt: surf.cryptFactor > 0.35,
          cryptFactor: surf.cryptFactor,
          lightActive,
          lightMode: activeMode,
          focusZoomActive,
          pointerLocked: document.pointerLockElement === canvas,
          nearbyExhibit: closestEx,
          activeExhibit: activeExhibitRef.current,
          playerElevation: Math.round(playerPos.y * 10) / 10,
        };
        setHud((prev) => {
          if (
            prev.zoneName === nextSnap.zoneName &&
            prev.surfaceType === nextSnap.surfaceType &&
            prev.inCrypt === nextSnap.inCrypt &&
            prev.lightActive === nextSnap.lightActive &&
            prev.lightMode === nextSnap.lightMode &&
            prev.focusZoomActive === nextSnap.focusZoomActive &&
            prev.pointerLocked === nextSnap.pointerLocked &&
            prev.nearbyExhibit?.id === nextSnap.nearbyExhibit?.id &&
            prev.activeExhibit?.id === nextSnap.activeExhibit?.id &&
            prev.playerElevation === nextSnap.playerElevation
          ) {
            return prev;
          }
          return nextSnap;
        });
      }

      if (swGl) {
        timeoutId = window.setTimeout(() => {
          if (!disposed) rafId = window.requestAnimationFrame(tick);
        }, 32);
      } else {
        rafId = window.requestAnimationFrame(tick);
      }
    };

    rafId = window.requestAnimationFrame(tick);

    return () => {
      disposed = true;
      window.cancelAnimationFrame(rafId);
      window.clearTimeout(timeoutId);
      if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current);
      stopVoiceGuide();

      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('resize', onResize);
      document.removeEventListener('pointerlockchange', onPointerLockChange);
      canvas.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      canvas.removeEventListener('contextmenu', onContextMenu);
      canvas.removeEventListener('webglcontextlost', onContextLost);
      canvas.removeEventListener('webglcontextrestored', onContextRestored);

      if (document.pointerLockElement === canvas) {
        try {
          document.exitPointerLock();
        } catch {
          // Ignore exitPointerLock errors
        }
      }

      museumAudio.dispose();
      city.dispose();
      pbrMats.dispose();
      sky.geo.dispose();
      sky.mat.dispose();
      torchHandleGeo.dispose();
      torchHandleMat.dispose();
      torchGripGeo.dispose();
      torchGripMat.dispose();
      torchCupGeo.dispose();
      torchCupMat.dispose();
      flameGeo.dispose();
      flameMat.dispose();
      flameCoreGeo.dispose();
      flameCoreMat.dispose();
      flashBodyGeo.dispose();
      flashBodyMat.dispose();
      flashRingGeo.dispose();
      flashRingMat.dispose();
      flashLensGeo.dispose();
      flashLensMat.dispose();
      emberGeo.dispose();
      emberMat.dispose();
      envTarget.dispose();
      renderer.dispose();
      if (canvas.parentNode === container) {
        container.removeChild(canvas);
      }
      canvasDomRef.current = null;
    };
  }, [
    avatarConfig,
    cityDef,
    cityId,
    closeExhibitInspection,
    handleTogglePointerLock,
    openExhibitInspection,
    showToast,
    stopExhibitVoice,
  ]);

  const glassPill = !isSoftwareGl
    ? 'bg-[#17120E]/68 backdrop-blur-md border border-[#E6C58D]/30'
    : 'bg-[#18130F]/90 border border-[#E6C58D]/35';

  const popoverSurface = !isSoftwareGl
    ? 'bg-[#171310]/88 backdrop-blur-md border border-[#E6C58D]/35'
    : 'bg-[#171310]/96 border border-[#E6C58D]/40';

  return (
    <div className="relative w-full h-[100dvh] overflow-hidden bg-[#1D1610] select-none">
      {/* 3D WebGL Viewport */}
      <div ref={containerRef} className="absolute inset-0 w-full h-full" />

      {/* Graceful WebGL Context Loss Backdrop */}
      {contextLost && (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-[#18130F]/95 text-[#F6EFE2] p-6 text-center gap-3">
          <p className="font-display text-lg font-bold">3B Grafik Bağlamı Yenileniyor</p>
          <p className="text-xs text-[#D5C7B2] max-w-sm">
            Antik kent görünümü yeniden yükleniyor veya doğrudan Efeler şehrine dönebilirsiniz.
          </p>
          <button
            type="button"
            onClick={onExitMuseum}
            className="px-4 py-2 rounded-xl bg-[#C85A32] text-[#FAF2E2] text-xs font-semibold cursor-pointer"
          >
            Efeler’e Dön
          </button>
        </div>
      )}

      {/* Minimal Semantic HUD Layer */}
      <div className="absolute inset-0 z-10 pointer-events-none flex flex-col justify-between p-3 sm:p-5">
        {/* Top Row: Return + Zone Telemetry (Left) & Collection / Journal (Right) */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2 pointer-events-auto">
            <button
              type="button"
              onClick={() => {
                stopExhibitVoice();
                onExitMuseum();
              }}
              className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl ${glassPill} hover:bg-[#2A2018]/85 text-[#FAF2E2] text-xs sm:text-sm font-semibold shadow-lg transition-colors cursor-pointer`}
            >
              <ArrowLeft className="w-4 h-4 text-[#E6C58D]" aria-hidden="true" />
              <span>Efeler’e Dön</span>
            </button>

            <div className={`px-3.5 py-2 rounded-xl ${glassPill} text-[#FAF2E2] shadow-lg`}>
              <div className="text-[10px] uppercase tracking-[0.14em] text-[#E6C58D] font-semibold leading-none">
                {cityDef.shortName} Açık Hava Müzesi · {cityDef.district}
              </div>
              <div className="flex items-center gap-2 mt-1 text-xs sm:text-sm font-display font-bold leading-tight">
                <span>{hud.zoneName}</span>
                <span className="text-[#E6C58D]/45" aria-hidden="true">·</span>
                <span className="text-[11px] font-sans font-medium text-[#D5C7B2]">
                  {SURFACE_LABELS[hud.surfaceType]}
                </span>
              </div>
            </div>
          </div>

          {/* Top-Right Compact City Switcher, Discovery Counter & Quick Collection Actions */}
          <div className="flex flex-wrap items-center justify-end gap-2 pointer-events-auto">
            <button
              type="button"
              onClick={() => {
                setCitySwitcherOpen((o) => !o);
                setTeleportOpen(false);
              }}
              className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl ${glassPill} ${
                citySwitcherOpen ? 'border-[#E6C58D]/75 bg-[#2A2018]/90' : 'hover:bg-[#2A2018]/85'
              } text-[#FAF2E2] text-xs font-semibold shadow-lg transition-colors cursor-pointer`}
              title="Aydın’ın 7 Antik Kenti Arasında Geçiş Yap"
            >
              <Landmark className="w-4 h-4 text-[#E6C58D]" aria-hidden="true" />
              <span className="hidden sm:inline">Antik Kentler</span>
              <span className="font-mono-num text-[#E6C58D]">({ANCIENT_CITIES.length})</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setTeleportOpen((o) => !o);
                setCitySwitcherOpen(false);
              }}
              className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl ${glassPill} ${
                teleportOpen ? 'border-[#E6C58D]/75 bg-[#2A2018]/90' : 'hover:bg-[#2A2018]/85'
              } text-[#FAF2E2] text-xs font-semibold shadow-lg transition-colors cursor-pointer`}
              title={`${cityDef.shortName} Bölgeleri ve Eserleri`}
            >
              <Compass className="w-4 h-4 text-[#E6C58D]" aria-hidden="true" />
              <span className="font-mono-num">
                {cityDiscoveredCount} / {cityExhibits.length} Eser
              </span>
            </button>

            <button
              type="button"
              onClick={() => {
                stopExhibitVoice();
                onOpenJournal();
              }}
              className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl ${glassPill} hover:bg-[#2A2018]/85 text-[#FAF2E2] text-xs font-semibold shadow-lg transition-colors cursor-pointer`}
              title="Keşif Defteri — Tüm Antik Müze Koleksiyonu"
            >
              <BookOpen className="w-4 h-4 text-[#E6C58D]" aria-hidden="true" />
              <span className="hidden sm:inline">Koleksiyon</span>
            </button>
          </div>
        </div>

        {/* Non-blocking Notice Toast */}
        {noticeToast && (
          <div className="self-center pointer-events-none">
            <div
              className={`px-4 py-2 rounded-xl ${glassPill} text-[#F7EEDC] text-xs font-medium shadow-xl`}
            >
              {noticeToast}
            </div>
          </div>
        )}

        {/* 7 Ancient Cities Switcher Popover (Top-Right) */}
        {citySwitcherOpen && !hud.activeExhibit && (
          <div
            className={`self-end pointer-events-auto w-full max-w-xs sm:max-w-sm rounded-2xl ${popoverSurface} text-[#F6EFE2] shadow-2xl overflow-hidden`}
          >
            <div className="px-4 py-3 border-b border-[#E6C58D]/20 flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-[0.12em] text-[#E6C58D]">
                Aydın Antik Kentleri (7 Müze)
              </span>
              <span className="text-[11px] font-mono-num text-[#D5C7B2]">
                {discoveredMuseumIds.length}/{MUSEUM_EXHIBITS.length} Toplam
              </span>
            </div>
            <div className="max-h-72 overflow-y-auto efeler-scroll divide-y divide-white/[0.06]">
              {ANCIENT_CITIES.map((c) => {
                const exhibitsForC = getExhibitsForCity(c.id);
                const foundForC = exhibitsForC.filter((e) => discoveredSet.has(e.id)).length;
                const isCurrent = c.id === cityId;
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => {
                      setCitySwitcherOpen(false);
                      if (!isCurrent) {
                        onSelectCity(c.id);
                      }
                    }}
                    className={`w-full px-4 py-2.5 flex items-center justify-between gap-2 text-left transition-colors cursor-pointer ${
                      isCurrent ? 'bg-[#E6C58D]/16' : 'hover:bg-white/[0.07]'
                    }`}
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 text-[10px] text-[#E6C58D] font-medium">
                        <span>{c.district}</span>
                        <span>·</span>
                        <span className="truncate text-[#C6B7A0]">{c.era}</span>
                      </div>
                      <div className="text-xs font-semibold text-[#FCF7EE] truncate mt-0.5">
                        {c.name}
                      </div>
                      <div className="text-[11px] text-[#C6B7A0] truncate">{c.tagline}</div>
                    </div>
                    <div className="flex flex-col items-end gap-1 shrink-0">
                      <span
                        className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-md ${
                          isCurrent
                            ? 'bg-[#E6C58D] text-[#1D150F]'
                            : 'bg-white/10 text-[#F0D39E]'
                        }`}
                      >
                        {isCurrent && <Check className="w-3 h-3" aria-hidden="true" />}
                        <span>{isCurrent ? 'Buradasınız' : 'Ziyaret Et'}</span>
                      </span>
                      <span className="text-[10px] font-mono-num text-[#D5C7B2]">
                        {foundForC}/{exhibitsForC.length} Eser
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Quick Archaeological Area & Exhibit Jump Popover (Top-Right) */}
        {teleportOpen && !hud.activeExhibit && (
          <div
            className={`self-end pointer-events-auto w-full max-w-xs sm:max-w-sm rounded-2xl ${popoverSurface} text-[#F6EFE2] shadow-2xl overflow-hidden`}
          >
            <div className="px-4 py-3 border-b border-[#E6C58D]/20 flex items-center justify-between gap-2">
              <span className="text-xs font-semibold uppercase tracking-[0.12em] text-[#E6C58D] truncate">
                {cityDef.shortName} Durakları (Hızlı Geçiş)
              </span>
              <span className="text-[11px] font-mono-num text-[#D5C7B2] shrink-0">
                {cityDiscoveredCount}/{cityExhibits.length}
              </span>
            </div>
            <div className="max-h-64 overflow-y-auto efeler-scroll divide-y divide-white/[0.06]">
              {cityExhibits.map((ex) => {
                const done = discoveredSet.has(ex.id);
                return (
                  <button
                    key={ex.id}
                    type="button"
                    onClick={() => handleTeleportToExhibit(ex)}
                    className="w-full px-4 py-2.5 flex items-center justify-between gap-2 hover:bg-white/[0.07] text-left transition-colors cursor-pointer"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 text-[10px] font-mono-num text-[#E6C58D]">
                        <span>{ex.catalogCode}</span>
                        <span>·</span>
                        <span className="truncate font-sans text-[#C6B7A0]">{ex.zone}</span>
                      </div>
                      <div className="text-xs font-semibold text-[#FCF7EE] truncate mt-0.5">
                        {ex.title}
                      </div>
                    </div>
                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-md shrink-0 ${
                        done
                          ? 'bg-[#5D8A48]/25 text-[#C5E8B3]'
                          : 'bg-[#E6C58D]/15 text-[#F0D39E]'
                      }`}
                    >
                      {done ? 'Keşfedildi' : 'Git'}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Active Curatorial Glassmorphism Exhibit Card (Right Side — Leaves 3D Artwork Unobstructed) */}
        {hud.activeExhibit && (
          <div className="self-end my-auto w-full flex justify-end">
            <MuseumExhibitCard
              exhibit={hud.activeExhibit}
              cityName={cityDef.shortName}
              isDiscovered={discoveredSet.has(hud.activeExhibit.id)}
              isNewlyDiscovered={newlyDiscoveredId === hud.activeExhibit.id}
              voicePlaying={voicePlaying}
              voiceLoading={voiceLoading}
              useBackdropBlur={!isSoftwareGl}
              onToggleVoice={handleToggleExhibitVoice}
              onClose={closeExhibitInspection}
            />
          </div>
        )}

        {/* Bottom Area: Exhibit Proximity Prompt + Collapsible Minimalist Control Dock */}
        <div className="flex flex-col items-center gap-2.5">
          {/* Interactive Exhibit Proximity Prompt */}
          {hud.nearbyExhibit && !hud.activeExhibit && (
            <button
              type="button"
              onClick={() => openExhibitInspection(hud.nearbyExhibit!)}
              className={`pointer-events-auto inline-flex items-center gap-2.5 px-4 py-2.5 rounded-xl ${glassPill} border-[#E6C58D]/65 hover:bg-[#2B2118]/90 text-[#FCF7EE] text-xs sm:text-sm font-semibold shadow-2xl transition-colors cursor-pointer`}
            >
              <span className="inline-flex items-center justify-center px-1.5 py-0.5 rounded bg-[#E6C58D] text-[#1D150F] font-mono-num text-[11px] font-bold">
                E
              </span>
              <MapPin className="w-4 h-4 text-[#E6C58D] shrink-0" aria-hidden="true" />
              <span>İncele · {hud.nearbyExhibit.title}</span>
            </button>
          )}

          {/* Collapsible Bottom Dock */}
          <div className="pointer-events-auto flex flex-col items-center gap-1.5">
            {dockCollapsed ? (
              <button
                type="button"
                onClick={() => setDockCollapsed(false)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl ${glassPill} text-[#FAF2E2] text-xs font-semibold shadow-lg cursor-pointer`}
              >
                <ChevronUp className="w-3.5 h-3.5 text-[#E6C58D]" aria-hidden="true" />
                <span>Kontroller</span>
              </button>
            ) : (
              <div
                className={`flex flex-wrap items-center justify-center gap-1.5 px-2.5 py-2 rounded-2xl ${glassPill} text-[#FAF2E2] shadow-xl`}
              >
                {/* Torch / Archaeologist Flashlight Mode Switch */}
                <button
                  type="button"
                  onClick={handleSwitchLightMode}
                  title="Mahzen Işık Tarzını Değiştir: Antik Meşale / Arkeolog El Feneri (F)"
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                    hud.lightActive
                      ? hud.lightMode === 'torch'
                        ? 'bg-[#C86428] text-[#FFF6EA]'
                        : 'bg-[#3D5B78] text-[#F2F8FF]'
                      : 'bg-white/10 hover:bg-white/15 text-[#E8DCCB]'
                  }`}
                >
                  {hud.lightMode === 'torch' ? (
                    <Flame className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                  ) : (
                    <Flashlight className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                  )}
                  <span>
                    {hud.lightMode === 'torch' ? 'Meşale' : 'El Feneri'} [F]
                  </span>
                  {hud.inCrypt && (
                    <span className="text-[10px] opacity-80">· Oto</span>
                  )}
                </button>

                {/* Manual Light Toggle Outdoors */}
                {!hud.inCrypt && (
                  <button
                    type="button"
                    onClick={handleToggleManualLight}
                    title="Işığı Manuel Aç/Kapat (L)"
                    className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                      hud.lightActive
                        ? 'bg-[#E6C58D]/25 text-[#F9DFAD] border border-[#E6C58D]/45'
                        : 'bg-white/8 hover:bg-white/15 text-[#D5C7B2]'
                    }`}
                  >
                    {hud.lightActive ? 'Işık Açık [L]' : 'Işık [L]'}
                  </button>
                )}

                {/* Focus / Shoulder Zoom */}
                <button
                  type="button"
                  onClick={handleToggleZoom}
                  title="Omuz Yakın İnceleme Modu (V veya Sağ Tık Basılı)"
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                    hud.focusZoomActive
                      ? 'bg-[#E6C58D] text-[#1D150F]'
                      : 'bg-white/10 hover:bg-white/15 text-[#E8DCCB]'
                  }`}
                >
                  <Eye className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                  <span>Yakın Bakış [V]</span>
                </button>

                {/* Optional Pointer Lock Toggle */}
                <button
                  type="button"
                  onClick={handleTogglePointerLock}
                  title="Sürükle-döndür veya isteğe bağlı fare kilidi"
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                    hud.pointerLocked
                      ? 'bg-[#5D8A48] text-[#FAF2E2]'
                      : 'bg-white/10 hover:bg-white/15 text-[#E8DCCB]'
                  }`}
                >
                  {hud.pointerLocked ? (
                    <Lock className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                  ) : (
                    <Unlock className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                  )}
                  <span className="hidden sm:inline">
                    {hud.pointerLocked ? 'Fare Kilitli (Esc)' : 'Fare Kilidi'}
                  </span>
                </button>

                {/* Audio Mute */}
                <button
                  type="button"
                  onClick={onToggleMute}
                  aria-label={isMuted ? 'Sesi Aç' : 'Sesi Kapat'}
                  title={isMuted ? 'Sesi Aç' : 'Sesi Kapat'}
                  className="p-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-[#E8DCCB] transition-colors cursor-pointer"
                >
                  {isMuted ? (
                    <VolumeX className="w-4 h-4 text-[#E88A6B]" aria-hidden="true" />
                  ) : (
                    <Volume2 className="w-4 h-4 text-[#E6C58D]" aria-hidden="true" />
                  )}
                </button>

                {/* Collapse Dock */}
                <button
                  type="button"
                  onClick={() => setDockCollapsed(true)}
                  aria-label="Kontrol Çubuğunu Gizle"
                  title="Gizle"
                  className="p-1.5 rounded-xl hover:bg-white/15 text-[#C6B7A0] transition-colors cursor-pointer"
                >
                  <ChevronDown className="w-4 h-4" aria-hidden="true" />
                </button>
              </div>
            )}

            {/* Subtle Single-Line Controls Legend */}
            {!dockCollapsed && !hud.activeExhibit && (
              <div className="hidden md:flex items-center gap-3 text-[11px] text-[#E6D9C5]/85 font-medium drop-shadow">
                <span>WASD: Yürü</span>
                <span aria-hidden="true">·</span>
                <span>Shift: Koş</span>
                <span aria-hidden="true">·</span>
                <span>Sürükle: Bak</span>
                <span aria-hidden="true">·</span>
                <span>Sağ Tık / V: Yakınlaş</span>
                <span aria-hidden="true">·</span>
                <span>E: Eser İncele</span>
                <span aria-hidden="true">·</span>
                <span>F: Meşale / Fener</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Compact Touch D-Pad for Mobile / Tablet Coarse Pointers */}
      {!hud.activeExhibit && (
        <div className="sm:hidden absolute bottom-24 left-3 z-20 pointer-events-auto grid grid-cols-3 gap-1 w-28">
          <div />
          <button
            type="button"
            onPointerDown={() => {
              touchMoveRef.current.y = 1;
            }}
            onPointerUp={() => {
              touchMoveRef.current.y = 0;
            }}
            onPointerLeave={() => {
              touchMoveRef.current.y = 0;
            }}
            className="h-9 rounded-lg bg-[#17120E]/75 border border-[#E6C58D]/40 text-[#FAF2E2] text-xs font-bold"
          >
            ▲
          </button>
          <div />
          <button
            type="button"
            onPointerDown={() => {
              touchMoveRef.current.x = -1;
            }}
            onPointerUp={() => {
              touchMoveRef.current.x = 0;
            }}
            onPointerLeave={() => {
              touchMoveRef.current.x = 0;
            }}
            className="h-9 rounded-lg bg-[#17120E]/75 border border-[#E6C58D]/40 text-[#FAF2E2] text-xs font-bold"
          >
            ◀
          </button>
          <button
            type="button"
            onPointerDown={() => {
              touchMoveRef.current.y = -1;
            }}
            onPointerUp={() => {
              touchMoveRef.current.y = 0;
            }}
            onPointerLeave={() => {
              touchMoveRef.current.y = 0;
            }}
            className="h-9 rounded-lg bg-[#17120E]/75 border border-[#E6C58D]/40 text-[#FAF2E2] text-xs font-bold"
          >
            ▼
          </button>
          <button
            type="button"
            onPointerDown={() => {
              touchMoveRef.current.x = 1;
            }}
            onPointerUp={() => {
              touchMoveRef.current.x = 0;
            }}
            onPointerLeave={() => {
              touchMoveRef.current.x = 0;
            }}
            className="h-9 rounded-lg bg-[#17120E]/75 border border-[#E6C58D]/40 text-[#FAF2E2] text-xs font-bold"
          >
            ▶
          </button>
        </div>
      )}
    </div>
  );
}
