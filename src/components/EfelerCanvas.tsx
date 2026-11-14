import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import {
  ANCIENT_SIGNPOST_POSITIONS,
  DISTRICT_ZONES,
  getSolarClockLabel,
  getTimeOfDayFromPhase,
  LANDMARKS,
  pickAutoWeatherForCycle,
  PLAYER_HOME_DOOR_POS,
  ROAD_X_COORDS,
  ROAD_Z_COORDS,
  SampledSolarMood,
  sampleSolarCurve,
  STREET_NAMES_X,
  STREET_NAMES_Z,
  TIME_MOODS,
  TIME_PHASE_ANCHORS,
} from '../data/efelerData';
import { BUILDING_NPCS } from '../data/npcData';
import { audioEngine } from '../game/audioEngine';
import { buildEfelerCity } from '../game/cityBuilder';
import {
  CityAvatarRig,
  CompanionWalkerRig,
  createCityAvatarRig,
  createCompanionWalkerRig,
} from '../game/cityNpcs';
import { createCityMaterials } from '../game/materials';
import {
  getTabakhaneCenterX,
  getWalkableSlopeAngles,
  getWalkableSurfaceHeightAt,
} from '../game/terrain';
import { SparrowChaseCamera } from '../game/sparrowCamera';
import { SparrowController, SparrowInputState } from '../game/sparrowController';
import { SparrowFX } from '../game/sparrowFx';
import { SparrowMesh } from '../game/sparrowMesh';
import { createProceduralTextures } from '../game/textures';
import { createVehicleModel, VehicleRig } from '../game/vehicles';
import {
  AvatarConfig,
  BuildingNpcDef,
  CameraPreset,
  ColliderBox,
  ErrandDef,
  ExplorationMode,
  GamePhase,
  HeldTreatType,
  HouseExteriorConfig,
  LandmarkDef,
  NearbyStreetInteraction,
  PlayerHudSnapshot,
  SeasonType,
  StreetInteractionType,
  TimeOfDay,
  VehicleConfig,
  WeatherType,
} from '../types/game';

export interface TouchDriveInput {
  forward: boolean;
  backward: boolean;
  left: boolean;
  right: boolean;
  joyX?: number;
  joyY?: number;
  flap?: boolean;
  dive?: boolean;
}

export interface EfelerCanvasHandle {
  teleportTo: (x: number, z: number, heading?: number) => void;
  triggerDiscoverNearby: () => void;
  triggerHorn: () => void;
  triggerChirp: () => void;
  setTouchInput: (next: Partial<TouchDriveInput>) => void;
  adjustZoom: (delta: number) => void;
  startCompanionWalk: (npc: BuildingNpcDef, treat: HeldTreatType) => void;
  giveTreat: (treat: HeldTreatType) => void;
}

interface EfelerCanvasProps {
  phase: GamePhase;
  explorationMode: ExplorationMode;
  avatarConfig: AvatarConfig;
  vehicleConfig: VehicleConfig;
  houseExterior: HouseExteriorConfig;
  timeOfDay: TimeOfDay;
  season: SeasonType;
  weather: WeatherType;
  autoAtmosphere: boolean;
  cameraPreset: CameraPreset;
  discoveredIds: string[];
  coins: number;
  activeErrand: ErrandDef | null;
  errandPickedUp: boolean;
  initialTransform?: { x: number; z: number; heading: number };
  onHudUpdate: (snapshot: PlayerHudSnapshot) => void;
  onDiscoverLandmark: (landmark: LandmarkDef) => void;
  onErrandAction: (landmarkId: string) => void;
  onInspectSignpost: () => void;
  onStreetEvent: (type: StreetInteractionType) => void;
  onInteractNpc: (npc: BuildingNpcDef) => void;
  onWalkChatMessage: (msg: string) => void;
  onAutoTimeSync?: (nextTod: TimeOfDay) => void;
  onAutoWeatherSync?: (nextWeather: WeatherType) => void;
  onCollectCrumb?: (amount: number) => void;
  onEnterHome: () => void;
}

const _targetSky = new THREE.Color();
const _targetSkyB = new THREE.Color();
const _targetSun = new THREE.Color();
const _targetSunB = new THREE.Color();
const _targetHemiSky = new THREE.Color();
const _targetHemiSkyB = new THREE.Color();
const _targetHemiGround = new THREE.Color();
const _targetHemiGroundB = new THREE.Color();
const _targetRim = new THREE.Color();
const _stormTint = new THREE.Color(0x3a4354);
const _rainTint = new THREE.Color(0x6c7c8e);
const _snowTint = new THREE.Color(0xdde6ef);
const _lightningTint = new THREE.Color(0xdbe8ff);
const _dayRimColor = new THREE.Color(0xfff1dc);
const _goldenRimColor = new THREE.Color(0xffcfa0);
const _nightRimColor = new THREE.Color(0x7c9ad4);
const _camGoal = new THREE.Vector3();
const _lookGoal = new THREE.Vector3();
const _lookCurrent = new THREE.Vector3();
const _projVec = new THREE.Vector3();
const _pointerVec = new THREE.Vector2();
const _chaseTarget = new THREE.Vector3();

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

function resolveLocationLabels(x: number, z: number): { district: string; street: string } {
  let district = 'Efeler Merkez';
  for (const dz of DISTRICT_ZONES) {
    if (x >= dz.minX && x <= dz.maxX && z >= dz.minZ && z <= dz.maxZ) {
      district = dz.name;
      break;
    }
  }

  let bestStreet = 'Efeler Sokakları';
  let minDist = 8.5;

  for (const rx of ROAD_X_COORDS) {
    const d = Math.abs(x - rx);
    if (d < minDist) {
      minDist = d;
      bestStreet = STREET_NAMES_X[rx] || bestStreet;
    }
  }
  for (const rz of ROAD_Z_COORDS) {
    const d = Math.abs(z - rz);
    if (d < minDist) {
      minDist = d;
      bestStreet = STREET_NAMES_Z[rz] || bestStreet;
    }
  }

  if (Math.hypot(x, z - 12) < 18) {
    bestStreet = 'Atatürk Kent Meydanı';
  } else if (x < -94 && Math.abs(z + 22) < 9.5) {
    bestStreet = 'Magnesia Antik Yolu';
  } else if (Math.abs(x + 132) < 15 && Math.abs(z + 40) < 15) {
    bestStreet = 'Magnesia Artemis Tapınağı';
  }

  return { district, street: bestStreet };
}

const STREAM_BRIDGE_ZS = [-96, -58, -22, 12, 48];

function resolveCollision(
  x: number,
  z: number,
  radius: number,
  colliders: ColliderBox[]
): [number, number] {
  let nx = THREE.MathUtils.clamp(x, -154, 104);
  let nz = THREE.MathUtils.clamp(z, -106, 72);

  // Keep player on riverbanks / stone bridges instead of stepping into Tabakhane Deresi water
  const onBridge = STREAM_BRIDGE_ZS.some((bz) => Math.abs(nz - bz) < 4.5);
  if (!onBridge) {
    const streamX = getTabakhaneCenterX(nz);
    const bankMinDist = 3.1 + radius;
    const dxStream = nx - streamX;
    if (Math.abs(dxStream) < bankMinDist) {
      nx = streamX + (dxStream >= 0 ? bankMinDist : -bankMinDist);
    }
  }

  for (const b of colliders) {
    const closestX = Math.max(b.minX, Math.min(nx, b.maxX));
    const closestZ = Math.max(b.minZ, Math.min(nz, b.maxZ));
    const dx = nx - closestX;
    const dz = nz - closestZ;
    const distSq = dx * dx + dz * dz;
    if (distSq < radius * radius) {
      const dist = Math.sqrt(distSq) || 0.001;
      const overlap = radius - dist;
      if (distSq > 0.0001) {
        nx += (dx / dist) * overlap;
        nz += (dz / dist) * overlap;
      } else {
        nx += overlap;
      }
    }
  }
  return [nx, nz];
}

export const EfelerCanvas = forwardRef<EfelerCanvasHandle, EfelerCanvasProps>(
  function EfelerCanvas(
    {
      phase,
      explorationMode,
      avatarConfig,
      vehicleConfig,
      houseExterior,
      timeOfDay,
      season,
      weather,
      autoAtmosphere,
      cameraPreset,
      discoveredIds,
      coins,
      activeErrand,
      errandPickedUp,
      initialTransform,
      onHudUpdate,
      onDiscoverLandmark,
      onErrandAction,
      onInspectSignpost,
      onStreetEvent,
      onInteractNpc,
      onWalkChatMessage,
      onAutoTimeSync,
      onAutoWeatherSync,
      onCollectCrumb,
      onEnterHome,
    },
    ref
  ) {
    const mountRef = useRef<HTMLDivElement | null>(null);
    const [contextLost, setContextLost] = useState(false);

    const phaseRef = useRef(phase);
    const explorationModeRef = useRef(explorationMode);
    const avatarConfigRef = useRef(avatarConfig);
    const vehicleConfigRef = useRef(vehicleConfig);
    const houseExteriorRef = useRef(houseExterior);
    const timeOfDayRef = useRef(timeOfDay);
    const seasonRef = useRef(season);
    const weatherRef = useRef(weather);
    const autoAtmosphereRef = useRef(autoAtmosphere);
    const cameraPresetRef = useRef(cameraPreset);
    const discoveredIdsRef = useRef(discoveredIds);
    const coinsRef = useRef(coins);
    const activeErrandRef = useRef(activeErrand);
    const errandPickedUpRef = useRef(errandPickedUp);
    const callbacksRef = useRef({
      onHudUpdate,
      onDiscoverLandmark,
      onErrandAction,
      onInspectSignpost,
      onStreetEvent,
      onInteractNpc,
      onWalkChatMessage,
      onAutoTimeSync,
      onAutoWeatherSync,
      onCollectCrumb,
      onEnterHome,
    });

    phaseRef.current = phase;
    explorationModeRef.current = explorationMode;
    avatarConfigRef.current = avatarConfig;
    vehicleConfigRef.current = vehicleConfig;
    houseExteriorRef.current = houseExterior;
    timeOfDayRef.current = timeOfDay;
    seasonRef.current = season;
    weatherRef.current = weather;
    autoAtmosphereRef.current = autoAtmosphere;
    cameraPresetRef.current = cameraPreset;
    discoveredIdsRef.current = discoveredIds;
    coinsRef.current = coins;
    activeErrandRef.current = activeErrand;
    errandPickedUpRef.current = errandPickedUp;
    callbacksRef.current = {
      onHudUpdate,
      onDiscoverLandmark,
      onErrandAction,
      onInspectSignpost,
      onStreetEvent,
      onInteractNpc,
      onWalkChatMessage,
      onAutoTimeSync,
      onAutoWeatherSync,
      onCollectCrumb,
      onEnterHome,
    };

    const lastAutoSyncedTodRef = useRef<TimeOfDay>(timeOfDay);
    const manualTargetPhaseRef = useRef<number | null>(null);

    const simRef = useRef({
      x: initialTransform?.x ?? -18,
      z: initialTransform?.z ?? 27,
      y: getWalkableSurfaceHeightAt(initialTransform?.x ?? -18, initialTransform?.z ?? 27),
      pitch: 0,
      roll: 0,
      heading: initialTransform?.heading ?? 0,
      speed: 0,
      steerAngle: 0,
      wheelSpin: 0,
      zoomFactor: 1.0,
      isoYawOffset: 0,
      fpYaw: 0,
      fpPitch: -0.04,
      rebuildVehicleRequested: false,
      updateAvatarConfigRequested: false,
      rebuildHomeRequested: false,
      nearbyLandmark: null as LandmarkDef | null,
      nearbyNpc: null as BuildingNpcDef | null,
      nearAncientSignpost: false,
      nearPlayerHome: false,
      nearbyStreetInteraction: null as NearbyStreetInteraction | null,
      heldTreat: 'none' as HeldTreatType,
      treatTimer: 0,
      treatDirty: false,
      companionNpc: null as BuildingNpcDef | null,
      companionTimer: 0,
      companionChatAccum: 0,
      companionChatIdx: 0,
      companionX: initialTransform?.x ?? -18,
      companionZ: initialTransform?.z ?? 27,
      companionDirty: false,
      zeybekTimer: 0,
      zeybekElapsed: 0,
      lastZeybekDipBar: -1,
    });

    const touchInputRef = useRef<TouchDriveInput>({
      forward: false,
      backward: false,
      left: false,
      right: false,
      joyX: 0,
      joyY: 0,
      flap: false,
      dive: false,
    });

    const sparrowActionsRef = useRef<{
      chirp: () => void;
      resetAt: (x: number, z: number, yaw: number) => void;
    } | null>(null);

    const streetTriggersRef = useRef<{
      triggerMusicians: () => void;
      triggerLokma: () => void;
      triggerVendor: () => void;
    } | null>(null);

    const performDiscover = () => {
      // Priority 1: Specific street interaction (Zeybek musicians, Bey Camii Lokma, Vendor)
      const streetInt = simRef.current.nearbyStreetInteraction;
      if (streetInt && streetTriggersRef.current) {
        if (streetInt.type === 'musicians') {
          streetTriggersRef.current.triggerMusicians();
          return;
        }
        if (streetInt.type === 'lokma') {
          streetTriggersRef.current.triggerLokma();
          return;
        }
        if (streetInt.type === 'vendor') {
          streetTriggersRef.current.triggerVendor();
          return;
        }
      }

      // Priority 2: Building NPC Chat / Treat / Walk
      if (simRef.current.nearbyNpc) {
        audioEngine.playDiscoveryChime();
        callbacksRef.current.onInteractNpc(simRef.current.nearbyNpc);
        return;
      }

      // Priority 3: Enter Player Home ("Sıcak Yuvam")
      if (simRef.current.nearPlayerHome) {
        audioEngine.updateEngineSound(0, vehicleConfigRef.current.type, false);
        audioEngine.playDiscoveryChime();
        callbacksRef.current.onEnterHome();
        return;
      }

      // Priority 4: Ancient Cities Signpost
      if (simRef.current.nearAncientSignpost && !simRef.current.nearbyLandmark) {
        audioEngine.playDiscoveryChime();
        callbacksRef.current.onInspectSignpost();
        return;
      }

      // Priority 5: Landmark Discovery / Errand Pickup & Dropoff
      const lm = simRef.current.nearbyLandmark;
      if (!lm) return;
      if (!discoveredIdsRef.current.includes(lm.id)) {
        audioEngine.playDiscoveryChime();
        callbacksRef.current.onDiscoverLandmark(lm);
      }
      const err = activeErrandRef.current;
      if (err) {
        const targetId = errandPickedUpRef.current ? err.toLandmarkId : err.fromLandmarkId;
        if (targetId === lm.id) {
          audioEngine.playDiscoveryChime();
          callbacksRef.current.onErrandAction(lm.id);
        }
      }
    };

    useImperativeHandle(ref, () => ({
      teleportTo: (x: number, z: number, heading = 0) => {
        simRef.current.x = x;
        simRef.current.z = z;
        simRef.current.y = getWalkableSurfaceHeightAt(x, z);
        simRef.current.pitch = 0;
        simRef.current.roll = 0;
        simRef.current.heading = heading;
        simRef.current.speed = 0;
        sparrowActionsRef.current?.resetAt(x, z, heading + Math.PI);
        if (simRef.current.companionNpc) {
          simRef.current.companionX = x + Math.cos(heading) * 1.25;
          simRef.current.companionZ = z - Math.sin(heading) * 1.25;
        }
      },
      triggerDiscoverNearby: () => {
        performDiscover();
      },
      triggerHorn: () => {
        if (explorationModeRef.current === 'sparrow') {
          sparrowActionsRef.current?.chirp();
        } else {
          audioEngine.playHorn(vehicleConfigRef.current.type);
        }
      },
      triggerChirp: () => {
        if (explorationModeRef.current === 'sparrow') {
          sparrowActionsRef.current?.chirp();
        } else {
          audioEngine.playSparrowChirp(false);
        }
      },
      setTouchInput: (next: Partial<TouchDriveInput>) => {
        Object.assign(touchInputRef.current, next);
      },
      adjustZoom: (delta: number) => {
        simRef.current.zoomFactor = THREE.MathUtils.clamp(
          simRef.current.zoomFactor + delta,
          0.68,
          2.2
        );
      },
      startCompanionWalk: (npc: BuildingNpcDef, treat: HeldTreatType) => {
        const s = simRef.current;
        s.companionNpc = npc;
        s.companionTimer = 30;
        s.companionChatAccum = 3.5;
        s.companionChatIdx = 0;
        s.companionX = s.x + Math.cos(s.heading) * 1.28;
        s.companionZ = s.z - Math.sin(s.heading) * 1.28;
        s.companionDirty = true;
        s.heldTreat = treat;
        s.treatTimer = 34;
        s.treatDirty = true;
      },
      giveTreat: (treat: HeldTreatType) => {
        const s = simRef.current;
        s.heldTreat = treat;
        s.treatTimer = 30;
        s.treatDirty = true;
      },
    }));

    useEffect(() => {
      simRef.current.rebuildVehicleRequested = true;
    }, [vehicleConfig]);

    useEffect(() => {
      simRef.current.updateAvatarConfigRequested = true;
    }, [avatarConfig]);

    useEffect(() => {
      simRef.current.rebuildHomeRequested = true;
    }, [houseExterior]);

    useEffect(() => {
      if (timeOfDay !== lastAutoSyncedTodRef.current) {
        lastAutoSyncedTodRef.current = timeOfDay;
        manualTargetPhaseRef.current = TIME_PHASE_ANCHORS[timeOfDay];
      }
    }, [timeOfDay]);

    useEffect(() => {
      if (cameraPreset === 'first_person') {
        simRef.current.fpYaw = 0;
        simRef.current.fpPitch = -0.04;
      }
    }, [cameraPreset]);

    useEffect(() => {
      const container = mountRef.current;
      if (!container) return;

      const isSoftwareGl = detectSoftwareWebGL();
      const isTouchDevice =
        window.matchMedia('(pointer: coarse)').matches || navigator.maxTouchPoints > 0;
      const renderer = new THREE.WebGLRenderer({
        antialias: !isSoftwareGl && !isTouchDevice,
        alpha: true,
        powerPreference: 'high-performance',
      });
      renderer.setClearColor(0x000000, 0);
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.18;
      const maxDpr = isSoftwareGl ? 1 : isTouchDevice ? 1.35 : 2;
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, maxDpr));
      renderer.shadowMap.enabled = !isSoftwareGl;
      renderer.shadowMap.type = THREE.PCFShadowMap;
      renderer.setSize(container.clientWidth, container.clientHeight);
      renderer.domElement.style.display = 'block';
      renderer.domElement.style.width = '100%';
      renderer.domElement.style.height = '100%';
      renderer.domElement.style.touchAction = 'none';
      container.appendChild(renderer.domElement);

      const handleContextLost = (e: Event) => {
        e.preventDefault();
        setContextLost(true);
      };
      const handleContextRestored = () => {
        setContextLost(false);
      };
      renderer.domElement.addEventListener('webglcontextlost', handleContextLost);
      renderer.domElement.addEventListener('webglcontextrestored', handleContextRestored);

      const scene = new THREE.Scene();
      const initialMood = TIME_MOODS[timeOfDayRef.current];
      scene.background = null;
      scene.fog = new THREE.FogExp2(initialMood.fogColor, 0.0026);

      const pmrem = new THREE.PMREMGenerator(renderer);
      const envRT = pmrem.fromScene(new RoomEnvironment(), 0.04);
      scene.environment = envRT.texture;
      pmrem.dispose();

      const getEffectiveFrustum = (asp: number, heightPx: number) => {
        if (asp < 1) {
          return 32 / Math.max(0.62, Math.pow(asp, 0.48));
        }
        // Compact landscape mobile viewports need slightly wider vertical frustum so buildings & roads read comfortably
        if (heightPx <= 520 && asp > 1.25) {
          return 36;
        }
        return 32;
      };

      const aspect = container.clientWidth / Math.max(1, container.clientHeight);
      const initialFrustum = getEffectiveFrustum(aspect, container.clientHeight);
      const camera = new THREE.OrthographicCamera(
        (-initialFrustum * aspect) / 2,
        (initialFrustum * aspect) / 2,
        initialFrustum / 2,
        -initialFrustum / 2,
        -120,
        350
      );
      camera.position.set(38, 34, 62);
      _lookCurrent.set(simRef.current.x, 1, simRef.current.z);
      camera.lookAt(_lookCurrent);

      const fpCamera = new THREE.PerspectiveCamera(64, aspect, 0.12, 280);
      fpCamera.position.set(simRef.current.x, simRef.current.y + 1.46, simRef.current.z);

      const chaseCamera = new THREE.PerspectiveCamera(60, aspect, 0.12, 320);
      const sparrowChaseCam = new SparrowChaseCamera();
      const unbindChaseDrag = sparrowChaseCam.bindDrag(
        renderer.domElement,
        () =>
          phaseRef.current === 'playing' &&
          (explorationModeRef.current === 'sparrow' || cameraPresetRef.current === 'perspective')
      );

      const hemiLight = new THREE.HemisphereLight(
        initialMood.hemiSky,
        initialMood.hemiGround,
        initialMood.hemiIntensity
      );
      scene.add(hemiLight);

      const sunLight = new THREE.DirectionalLight(
        initialMood.sunColor,
        initialMood.sunIntensity
      );
      sunLight.position.set(...initialMood.sunPosition);
      sunLight.castShadow = !isSoftwareGl;
      const shadowRes = isTouchDevice ? 1024 : 1536;
      sunLight.shadow.mapSize.width = shadowRes;
      sunLight.shadow.mapSize.height = shadowRes;
      sunLight.shadow.camera.near = 5;
      sunLight.shadow.camera.far = 210;
      const d = isTouchDevice ? 34 : 42;
      sunLight.shadow.camera.left = -d;
      sunLight.shadow.camera.right = d;
      sunLight.shadow.camera.top = d;
      sunLight.shadow.camera.bottom = -d;
      sunLight.shadow.bias = -0.0004;
      sunLight.shadow.normalBias = 0.02;
      sunLight.shadow.radius = isTouchDevice ? 1.4 : 2.0;
      scene.add(sunLight);
      scene.add(sunLight.target);

      const rimLight = new THREE.DirectionalLight(0xffe0ba, 0.38);
      rimLight.position.set(42, 26, -45);
      scene.add(rimLight);

      const textures = createProceduralTextures(renderer.capabilities.getMaxAnisotropy());
      const mats = createCityMaterials(textures, isSoftwareGl);
      const city = buildEfelerCity(mats, houseExteriorRef.current);
      scene.add(city.group);

      let lastLokmaTime = -20;
      let prevVendorBubble = false;

      streetTriggersRef.current = {
        triggerMusicians: () => {
          city.musicians.triggerZeybek();
          audioEngine.playZeybekDance(11.5);
          const s = simRef.current;
          s.zeybekTimer = 11.5;
          s.zeybekElapsed = 0;
          s.lastZeybekDipBar = -2;
          s.speed = 0;
          const dxM = city.musicians.center[0] - s.x;
          const dzM = city.musicians.center[1] - s.z;
          if (Math.hypot(dxM, dzM) > 0.25) {
            s.heading = Math.atan2(-dxM, -dzM);
          }
          callbacksRef.current.onStreetEvent('musicians');
        },
        triggerLokma: () => {
          const now = performance.now() / 1000;
          if (now - lastLokmaTime < 5) return;
          lastLokmaTime = now;
          city.lokmaStand.triggerServeEffect();
          audioEngine.playLokmaGain();
          callbacksRef.current.onStreetEvent('lokma');
        },
        triggerVendor: () => {
          city.libraryVendor.triggerBubble();
          audioEngine.playVendorCallout();
          callbacksRef.current.onStreetEvent('vendor');
        },
      };

      let vehicleRig: VehicleRig = createVehicleModel(
        vehicleConfigRef.current,
        textures.contactShadow,
        isSoftwareGl
      );
      vehicleRig.root.position.set(simRef.current.x, simRef.current.y, simRef.current.z);
      vehicleRig.root.rotation.order = 'YXZ';
      scene.add(vehicleRig.root);

      const cityAvatarRig: CityAvatarRig = createCityAvatarRig(
        avatarConfigRef.current,
        textures.contactShadow
      );
      cityAvatarRig.root.position.set(simRef.current.x, simRef.current.y, simRef.current.z);
      cityAvatarRig.root.visible = explorationModeRef.current === 'walk';
      scene.add(cityAvatarRig.root);

      const companionRig: CompanionWalkerRig = createCompanionWalkerRig();
      scene.add(companionRig.root);

      // Sparrow Sim articulated 3D sparrow + FX (clouds, chirp rings, trails, crumbs)
      const sparrowMesh = new SparrowMesh(1.32);
      sparrowMesh.root.visible = explorationModeRef.current === 'sparrow';
      scene.add(sparrowMesh.root);

      const sparrowFx = new SparrowFX(city.crumbSpots);
      scene.add(sparrowFx.group);

      const sparrowController = new SparrowController(
        sparrowMesh,
        city.perches,
        city.colliders,
        sparrowFx
      );
      sparrowController.resetAt(
        simRef.current.x,
        simRef.current.z,
        simRef.current.heading + Math.PI
      );
      sparrowChaseCam.snapTo(sparrowController.position, sparrowController.yaw);

      sparrowActionsRef.current = {
        chirp: () => sparrowController.triggerChirp(),
        resetAt: (x: number, z: number, yaw: number) => {
          sparrowController.resetAt(x, z, yaw);
          sparrowChaseCam.snapTo(sparrowController.position, sparrowController.yaw);
        },
      };

      const particleCount = 24;
      const particleGeo = new THREE.SphereGeometry(0.22, 6, 6);
      const particleMat = new THREE.MeshBasicMaterial({
        color: 0xe6dac5,
        transparent: true,
        opacity: 0.45,
      });
      const particleMesh = new THREE.InstancedMesh(particleGeo, particleMat, particleCount);
      particleMesh.frustumCulled = false;
      scene.add(particleMesh);
      const particles = Array.from({ length: particleCount }, () => ({
        active: false,
        x: 0,
        y: -5,
        z: 0,
        vx: 0,
        vy: 0,
        vz: 0,
        life: 0,
        maxLife: 0.55,
      }));
      let nextParticle = 0;
      let particleSpawnAccum = 0;
      const pDummy = new THREE.Object3D();

      // Pooled 3D Weather Particles (Rain / Snow / Storm)
      const weatherCount = isTouchDevice ? 120 : 220;
      const weatherGeo = new THREE.BoxGeometry(0.08, 0.85, 0.08);
      const weatherMat = new THREE.MeshBasicMaterial({
        color: 0xd6e6f5,
        transparent: true,
        opacity: 0.58,
      });
      const weatherMesh = new THREE.InstancedMesh(weatherGeo, weatherMat, weatherCount);
      weatherMesh.frustumCulled = false;
      scene.add(weatherMesh);
      const weatherDrops = Array.from({ length: weatherCount }, () => ({
        ox: (Math.random() - 0.5) * 68,
        y: Math.random() * 26,
        oz: (Math.random() - 0.5) * 68,
        speed: 0.75 + Math.random() * 0.5,
        phase: Math.random() * Math.PI * 2,
      }));
      const wDummy = new THREE.Object3D();
      let lightningTimer = 4.2;
      let lightningFlash = 0;

      if (!isSoftwareGl) {
        renderer.compile(scene, camera);
      }

      // Raycasting for Clicking Street Encounters & Building NPCs + Drag-to-Look / Isometric Orbit
      const raycaster = new THREE.Raycaster();
      let lastMoveRaycast = 0;
      let activeDragPointerId: number | null = null;
      let lastDragX = 0;
      let lastDragY = 0;
      let pointerDragDist = 0;
      let pinchStartDist = 0;
      let pinchStartZoom = 1;

      const updatePointer = (clientX: number, clientY: number) => {
        const rect = renderer.domElement.getBoundingClientRect();
        _pointerVec.x = ((clientX - rect.left) / rect.width) * 2 - 1;
        _pointerVec.y = -((clientY - rect.top) / rect.height) * 2 + 1;
      };

      const onPointerDown = (e: PointerEvent) => {
        if (phaseRef.current !== 'playing' || activeDragPointerId !== null || pinchStartDist > 0) return;
        activeDragPointerId = e.pointerId;
        lastDragX = e.clientX;
        lastDragY = e.clientY;
        pointerDragDist = 0;
      };

      const onPointerMove = (e: PointerEvent) => {
        if (phaseRef.current !== 'playing') return;
        if (activeDragPointerId === e.pointerId && pinchStartDist === 0) {
          const dx = e.clientX - lastDragX;
          const dy = e.clientY - lastDragY;
          lastDragX = e.clientX;
          lastDragY = e.clientY;
          pointerDragDist += Math.hypot(dx, dy);
          if (cameraPresetRef.current === 'first_person') {
            simRef.current.fpYaw = THREE.MathUtils.clamp(
              simRef.current.fpYaw - dx * 0.0055,
              -2.1,
              2.1
            );
            simRef.current.fpPitch = THREE.MathUtils.clamp(
              simRef.current.fpPitch - dy * 0.0045,
              -0.52,
              0.45
            );
          } else if (
            explorationModeRef.current !== 'sparrow' &&
            cameraPresetRef.current !== 'perspective'
          ) {
            simRef.current.isoYawOffset -= dx * 0.0052;
          }
        }
        if (e.pointerType === 'touch') return;
        const now = performance.now();
        if (now - lastMoveRaycast < 65) return;
        lastMoveRaycast = now;
        updatePointer(e.clientX, e.clientY);
        const activeCam =
          cameraPresetRef.current === 'first_person'
            ? fpCamera
            : explorationModeRef.current === 'sparrow' ||
                cameraPresetRef.current === 'perspective'
              ? chaseCamera
              : camera;
        raycaster.setFromCamera(_pointerVec, activeCam);
        const hits = raycaster.intersectObjects(city.interactiveClickables, false);
        renderer.domElement.style.cursor = hits.length > 0 ? 'pointer' : 'default';
      };

      const onPointerUp = (e: PointerEvent) => {
        if (activeDragPointerId === e.pointerId) {
          activeDragPointerId = null;
        }
      };

      const onPointerClick = (e: MouseEvent) => {
        if (phaseRef.current !== 'playing') return;
        if (pointerDragDist > 8) return;
        updatePointer(e.clientX, e.clientY);
        const activeCam =
          cameraPresetRef.current === 'first_person'
            ? fpCamera
            : explorationModeRef.current === 'sparrow' ||
                cameraPresetRef.current === 'perspective'
              ? chaseCamera
              : camera;
        raycaster.setFromCamera(_pointerVec, activeCam);
        const hits = raycaster.intersectObjects(city.interactiveClickables, false);
        if (hits.length > 0) {
          const ud = hits[0].object.userData;
          if (ud.npcId) {
            const npc = BUILDING_NPCS.find((n) => n.id === ud.npcId);
            if (npc) {
              audioEngine.playDiscoveryChime();
              callbacksRef.current.onInteractNpc(npc);
              return;
            }
          }
          if (streetTriggersRef.current) {
            const type = ud.interactionType as StreetInteractionType;
            if (type === 'musicians') streetTriggersRef.current.triggerMusicians();
            else if (type === 'lokma') streetTriggersRef.current.triggerLokma();
            else if (type === 'vendor') streetTriggersRef.current.triggerVendor();
          }
        }
      };

      renderer.domElement.addEventListener('pointerdown', onPointerDown);
      renderer.domElement.addEventListener('pointermove', onPointerMove);
      window.addEventListener('pointerup', onPointerUp);
      window.addEventListener('pointercancel', onPointerUp);
      renderer.domElement.addEventListener('click', onPointerClick);

      const heldKeys = new Set<string>();
      let flapQueued = false;
      let chirpQueued = false;
      let peckQueued = false;
      let prevTouchFlap = false;
      let prevMode: ExplorationMode = explorationModeRef.current;
      let prevCamPreset: CameraPreset = cameraPresetRef.current;

      const onKeyDown = (e: KeyboardEvent) => {
        if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) {
          if (phaseRef.current === 'playing') e.preventDefault();
        }
        const wasDown = heldKeys.has(e.code);
        heldKeys.add(e.code);

        if (!wasDown && phaseRef.current === 'playing') {
          if (e.code === 'Space') {
            if (explorationModeRef.current === 'sparrow') {
              flapQueued = true;
            } else {
              audioEngine.playHorn(vehicleConfigRef.current.type);
            }
          } else if (e.code === 'KeyQ') {
            chirpQueued = true;
          } else if (e.code === 'KeyE') {
            if (explorationModeRef.current === 'sparrow') {
              peckQueued = true;
            }
            performDiscover();
          }
        }
      };
      const onKeyUp = (e: KeyboardEvent) => {
        heldKeys.delete(e.code);
      };
      const onWindowBlur = () => {
        heldKeys.clear();
        touchInputRef.current.forward = false;
        touchInputRef.current.backward = false;
        touchInputRef.current.left = false;
        touchInputRef.current.right = false;
        touchInputRef.current.flap = false;
        touchInputRef.current.dive = false;
      };
      const onWheel = (e: WheelEvent) => {
        if (phaseRef.current !== 'playing') return;
        simRef.current.zoomFactor = THREE.MathUtils.clamp(
          simRef.current.zoomFactor - e.deltaY * 0.0008,
          0.68,
          2.2
        );
      };

      const getTouchDist = (t1: Touch, t2: Touch) =>
        Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY);

      const onTouchStart = (e: TouchEvent) => {
        if (phaseRef.current !== 'playing') return;
        if (e.touches.length === 2) {
          activeDragPointerId = null;
          pinchStartDist = getTouchDist(e.touches[0], e.touches[1]);
          pinchStartZoom = simRef.current.zoomFactor;
        }
      };
      const onTouchMove = (e: TouchEvent) => {
        if (phaseRef.current !== 'playing') return;
        if (e.touches.length === 2 && pinchStartDist > 10) {
          e.preventDefault();
          const dist = getTouchDist(e.touches[0], e.touches[1]);
          const ratio = dist / pinchStartDist;
          simRef.current.zoomFactor = THREE.MathUtils.clamp(pinchStartZoom * ratio, 0.68, 2.2);
        }
      };
      const onTouchEnd = (e: TouchEvent) => {
        if (e.touches.length < 2) {
          pinchStartDist = 0;
        }
      };

      window.addEventListener('keydown', onKeyDown);
      window.addEventListener('keyup', onKeyUp);
      window.addEventListener('blur', onWindowBlur);
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
        const frustum = getEffectiveFrustum(asp, h);
        camera.left = (-frustum * asp) / 2;
        camera.right = (frustum * asp) / 2;
        camera.top = frustum / 2;
        camera.bottom = -frustum / 2;
        camera.updateProjectionMatrix();
        fpCamera.aspect = asp;
        fpCamera.updateProjectionMatrix();
        chaseCamera.aspect = asp;
        chaseCamera.updateProjectionMatrix();
        renderer.setSize(w, h);
      };
      window.addEventListener('resize', onResize);

      const clock = new THREE.Clock();
      let frameId = 0;
      let disposed = false;
      let hudAccum = 0;

      // Continuous Daily Solar Clock & Gradual Weather State Machine
      let solarPhase = TIME_PHASE_ANCHORS[timeOfDayRef.current];
      const sampledSolar: SampledSolarMood = {
        a: TIME_MOODS.golden,
        b: TIME_MOODS.golden,
        t: 0,
        sunIntensity: 2.0,
        hemiIntensity: 0.78,
        windowGlow: 0.4,
        lampLevel: 0.5,
        sunPos: [0, 50, 40],
      };
      const weatherWeights = {
        clear: weatherRef.current === 'clear' ? 1 : 0,
        rain: weatherRef.current === 'rain' ? 1 : 0,
        snow: weatherRef.current === 'snow' ? 1 : 0,
        storm: weatherRef.current === 'storm' ? 1 : 0,
      };
      let frostFactor = seasonRef.current === 'winter' || weatherRef.current === 'snow' ? 0.85 : 0;
      let wetFactor = weatherRef.current === 'rain' || weatherRef.current === 'storm' ? 0.8 : 0;
      let autoWeatherTimer = 34;

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
        const rawDt = clock.getDelta();
        const dt = Math.min(rawDt, 0.05);
        const elapsed = clock.elapsedTime;

        if (simRef.current.rebuildVehicleRequested) {
          simRef.current.rebuildVehicleRequested = false;
          scene.remove(vehicleRig.root);
          vehicleRig.dispose();
          vehicleRig = createVehicleModel(
            vehicleConfigRef.current,
            textures.contactShadow,
            isSoftwareGl
          );
          vehicleRig.root.position.set(simRef.current.x, simRef.current.y, simRef.current.z);
          vehicleRig.root.rotation.order = 'YXZ';
          vehicleRig.root.rotation.y = simRef.current.heading;
          vehicleRig.root.rotation.x = simRef.current.pitch;
          scene.add(vehicleRig.root);
        }

        if (simRef.current.updateAvatarConfigRequested) {
          simRef.current.updateAvatarConfigRequested = false;
          cityAvatarRig.applyConfig(avatarConfigRef.current);
        }

        if (simRef.current.rebuildHomeRequested) {
          simRef.current.rebuildHomeRequested = false;
          city.updatePlayerHomeExterior(houseExteriorRef.current);
        }

        // 1. Continuous Solar Clock Progression (Auto-Cycle or Smooth Manual Glide)
        if (manualTargetPhaseRef.current !== null) {
          const targetP = manualTargetPhaseRef.current;
          let diff = targetP - solarPhase;
          if (diff > 0.6) diff -= 1;
          if (diff < -0.6) diff += 1;
          if (Math.abs(diff) < 0.004) {
            solarPhase = targetP;
            manualTargetPhaseRef.current = null;
          } else {
            solarPhase = ((solarPhase + diff * Math.min(1, dt * 1.65)) % 1 + 1) % 1;
          }
        } else if (autoAtmosphereRef.current && phaseRef.current === 'playing') {
          // Gentle full 24h Efeler cycle (~4 minutes real-time)
          solarPhase = (solarPhase + dt * 0.0042) % 1;
          const bucket = getTimeOfDayFromPhase(solarPhase);
          if (bucket !== lastAutoSyncedTodRef.current) {
            lastAutoSyncedTodRef.current = bucket;
            callbacksRef.current.onAutoTimeSync?.(bucket);
          }
        }

        sampleSolarCurve(solarPhase, sampledSolar);

        // 2. Gradual Multi-Second Weather Crossfade & Auto Weather Drift
        if (autoAtmosphereRef.current && phaseRef.current === 'playing') {
          autoWeatherTimer -= dt;
          if (autoWeatherTimer <= 0) {
            autoWeatherTimer = 36 + Math.random() * 24;
            const candidate = pickAutoWeatherForCycle(solarPhase, seasonRef.current, Math.random());
            if (candidate !== weatherRef.current) {
              callbacksRef.current.onAutoWeatherSync?.(candidate);
            }
          }
        }

        const wType = weatherRef.current;
        const wFadeRate = Math.min(1, dt * 0.28);
        weatherWeights.clear = THREE.MathUtils.lerp(weatherWeights.clear, wType === 'clear' ? 1 : 0, wFadeRate);
        weatherWeights.rain = THREE.MathUtils.lerp(weatherWeights.rain, wType === 'rain' ? 1 : 0, wFadeRate);
        weatherWeights.snow = THREE.MathUtils.lerp(weatherWeights.snow, wType === 'snow' ? 1 : 0, wFadeRate);
        weatherWeights.storm = THREE.MathUtils.lerp(weatherWeights.storm, wType === 'storm' ? 1 : 0, wFadeRate);

        const targetFrost =
          seasonRef.current === 'winter'
            ? Math.max(0.76, weatherWeights.snow)
            : weatherWeights.snow * 0.92;
        frostFactor = THREE.MathUtils.damp(frostFactor, targetFrost, 0.35, dt);

        const targetWet = Math.min(1, weatherWeights.rain + weatherWeights.storm * 1.15);
        wetFactor = THREE.MathUtils.damp(wetFactor, targetWet, 0.45, dt);

        const windStrength =
          0.55 + weatherWeights.rain * 0.35 + weatherWeights.storm * 1.15 + weatherWeights.snow * 0.25;

        if (weatherWeights.storm > 0.35) {
          lightningTimer -= dt;
          if (lightningTimer <= 0) {
            lightningFlash = weatherWeights.storm;
            lightningTimer = 4.5 + Math.random() * 6.5;
          }
          lightningFlash = Math.max(0, lightningFlash - dt * 3.8);
        } else {
          lightningFlash = 0;
        }

        _targetSky.set(sampledSolar.a.fogColor);
        _targetSkyB.set(sampledSolar.b.fogColor);
        _targetSky.lerp(_targetSkyB, sampledSolar.t);
        _targetSky.lerp(_stormTint, weatherWeights.storm * 0.68);
        _targetSky.lerp(_rainTint, weatherWeights.rain * 0.45);
        _targetSky.lerp(_snowTint, weatherWeights.snow * 0.35);
        if (lightningFlash > 0.02) {
          _targetSky.lerp(_lightningTint, lightningFlash * 0.55);
        }

        if (scene.fog instanceof THREE.FogExp2) {
          scene.fog.color.lerp(_targetSky, Math.min(1, dt * 2.6));
          const targetFogDensity =
            0.0026 +
            weatherWeights.storm * 0.0056 +
            weatherWeights.rain * 0.0032 +
            weatherWeights.snow * 0.0024;
          scene.fog.density = THREE.MathUtils.damp(scene.fog.density, targetFogDensity, 1.8, dt);
        }

        _targetSun.set(sampledSolar.a.sunColor);
        _targetSunB.set(sampledSolar.b.sunColor);
        _targetSun.lerp(_targetSunB, sampledSolar.t);
        _targetSun.lerp(_stormTint, weatherWeights.storm * 0.55);
        sunLight.color.lerp(_targetSun, Math.min(1, dt * 2.6));
        const weatherSunScale =
          1.0 -
          weatherWeights.storm * 0.45 -
          weatherWeights.rain * 0.28 -
          weatherWeights.snow * 0.15;
        sunLight.intensity = THREE.MathUtils.damp(
          sunLight.intensity,
          sampledSolar.sunIntensity * weatherSunScale + lightningFlash * 1.6,
          2.6,
          dt
        );

        _targetHemiSky.set(sampledSolar.a.hemiSky);
        _targetHemiSkyB.set(sampledSolar.b.hemiSky);
        _targetHemiSky.lerp(_targetHemiSkyB, sampledSolar.t);
        _targetHemiGround.set(sampledSolar.a.hemiGround);
        _targetHemiGroundB.set(sampledSolar.b.hemiGround);
        _targetHemiGround.lerp(_targetHemiGroundB, sampledSolar.t);
        hemiLight.color.lerp(_targetHemiSky, Math.min(1, dt * 2.6));
        hemiLight.groundColor.lerp(_targetHemiGround, Math.min(1, dt * 2.6));
        hemiLight.intensity = THREE.MathUtils.damp(
          hemiLight.intensity,
          sampledSolar.hemiIntensity,
          2.6,
          dt
        );

        const nightMix = THREE.MathUtils.clamp((sampledSolar.lampLevel - 0.35) / 0.65, 0, 1);
        const goldenWarmth = Math.max(0, 1 - Math.abs(solarPhase - 0.58) / 0.18);
        _targetRim
          .copy(_dayRimColor)
          .lerp(_goldenRimColor, goldenWarmth * 0.85)
          .lerp(_nightRimColor, nightMix * 0.9);
        rimLight.color.lerp(_targetRim, Math.min(1, dt * 2.6));
        rimLight.intensity = THREE.MathUtils.damp(
          rimLight.intensity,
          0.32 + goldenWarmth * 0.16 - nightMix * 0.14,
          2.6,
          dt
        );
        renderer.toneMappingExposure = THREE.MathUtils.damp(
          renderer.toneMappingExposure,
          1.18 - nightMix * 0.12 + goldenWarmth * 0.05,
          2.4,
          dt
        );

        const lampActiveLevel = Math.max(
          sampledSolar.lampLevel,
          weatherWeights.storm * 0.85 + weatherWeights.rain * 0.55
        );
        mats.windowLit.emissiveIntensity = THREE.MathUtils.damp(
          mats.windowLit.emissiveIntensity,
          Math.max(sampledSolar.windowGlow, lampActiveLevel * 0.72),
          3.0,
          dt
        );
        mats.lampBulb.emissiveIntensity = THREE.MathUtils.damp(
          mats.lampBulb.emissiveIntensity,
          0.08 + lampActiveLevel * 1.77,
          3.0,
          dt
        );
        vehicleRig.headlightGlowMeshes.forEach((hm) => {
          const mat = hm.material as THREE.MeshStandardMaterial;
          mat.emissiveIntensity = 0.25 + lampActiveLevel * 1.45;
        });

        // Update Living World, Seasonal Trees, Diorama Roofs/Ground, Street Encounters & NPCs
        city.update(dt, elapsed);
        city.figTree.update(
          dt,
          coinsRef.current,
          elapsed,
          seasonRef.current,
          frostFactor,
          windStrength
        );
        city.updateAtmosphere(dt, elapsed, {
          season: seasonRef.current,
          frostFactor,
          wetFactor,
          windStrength,
          lookX: _lookCurrent.x,
          lookZ: _lookCurrent.z,
        });
        city.pedestrians.update(dt, elapsed);
        city.trafficLights.update(elapsed);
        city.musicians.update(dt, elapsed);
        city.libraryVendor.update(dt, elapsed);
        city.lokmaStand.update(dt, elapsed);
        city.buildingNpcs.update(dt, elapsed, simRef.current.x, simRef.current.z);

        const bubbleNow = city.libraryVendor.isBubbleVisible();
        if (bubbleNow && !prevVendorBubble && phaseRef.current === 'playing') {
          if (
            Math.hypot(
              simRef.current.x - city.libraryVendor.vendorPos[0],
              simRef.current.z - city.libraryVendor.vendorPos[1]
            ) < 42
          ) {
            audioEngine.playVendorCallout();
          }
        }
        prevVendorBubble = bubbleNow;

        const sim = simRef.current;
        const vType = vehicleConfigRef.current.type;
        const curMode = explorationModeRef.current;
        const isWalking = curMode === 'walk';
        const isSparrow = curMode === 'sparrow';
        const isFirstPerson =
          cameraPresetRef.current === 'first_person' && phaseRef.current !== 'title';
        const slopesPre = getWalkableSlopeAngles(sim.x, sim.z, sim.heading);

        // Mode switch synchronization (Vehicle/Walk <-> Sparrow)
        if (isSparrow && prevMode !== 'sparrow') {
          sparrowController.resetAt(sim.x, sim.z, sim.heading + Math.PI);
          sparrowChaseCam.snapTo(sparrowController.position, sparrowController.yaw);
        } else if (!isSparrow && prevMode === 'sparrow') {
          sim.x = THREE.MathUtils.clamp(sparrowController.position.x, -154, 104);
          sim.z = THREE.MathUtils.clamp(sparrowController.position.z, -106, 72);
          sim.y = getWalkableSurfaceHeightAt(sim.x, sim.z);
          sim.heading = sparrowController.yaw + Math.PI;
          sim.speed = 0;
        }
        prevMode = curMode;

        if (cameraPresetRef.current === 'perspective' && prevCamPreset !== 'perspective') {
          if (isSparrow) {
            sparrowChaseCam.snapTo(sparrowController.position, sparrowController.yaw, false);
          } else {
            _chaseTarget.set(sim.x, sim.y, sim.z);
            sparrowChaseCam.snapTo(_chaseTarget, sim.heading + Math.PI, !isWalking);
          }
        }
        prevCamPreset = cameraPresetRef.current;

        // Held treat duration & rig sync
        if (sim.treatTimer > 0) {
          sim.treatTimer -= dt;
          if (sim.treatTimer <= 0) {
            sim.heldTreat = 'none';
            sim.treatDirty = true;
          }
        }
        if (sim.treatDirty) {
          sim.treatDirty = false;
          cityAvatarRig.setTreat(sim.heldTreat);
        }

        // Update Storybook Sparrow FX (clouds, crumb treats, rings, wing trails)
        sparrowFx.update(dt, elapsed, goldenWarmth, nightMix, weatherWeights.storm);

        const touchFlapNow = Boolean(touchInputRef.current.flap);
        const touchFlapRising = touchFlapNow && !prevTouchFlap;
        prevTouchFlap = touchFlapNow;

        if (sim.zeybekTimer > 0) {
          sim.zeybekTimer = Math.max(0, sim.zeybekTimer - dt);
          sim.zeybekElapsed += dt;
          const distMus = Math.hypot(
            sim.x - city.musicians.center[0],
            sim.z - city.musicians.center[1]
          );
          if (Math.abs(sim.speed) > 1.8 || distMus > 24) {
            sim.zeybekTimer = 0;
          }
        }

        let groundY = getWalkableSurfaceHeightAt(sim.x, sim.z);

        if (isSparrow) {
          vehicleRig.root.visible = false;
          cityAvatarRig.root.visible = false;
          companionRig.root.visible = false;
          sparrowMesh.root.visible = !isFirstPerson;
          audioEngine.updateEngineSound(0, vType, false);

          const sparrowInput: SparrowInputState = {
            forward:
              heldKeys.has('KeyW') || heldKeys.has('ArrowUp') || touchInputRef.current.forward,
            backward:
              heldKeys.has('KeyS') || heldKeys.has('ArrowDown') || touchInputRef.current.backward,
            left: heldKeys.has('KeyA') || heldKeys.has('ArrowLeft') || touchInputRef.current.left,
            right:
              heldKeys.has('KeyD') || heldKeys.has('ArrowRight') || touchInputRef.current.right,
            joyX: touchInputRef.current.joyX ?? 0,
            joyY: touchInputRef.current.joyY ?? 0,
            flapHeld: heldKeys.has('Space') || touchFlapNow,
            flapPressed: flapQueued || touchFlapRising,
            diveHeld:
              heldKeys.has('ShiftLeft') ||
              heldKeys.has('ShiftRight') ||
              Boolean(touchInputRef.current.dive),
            chirpPressed: chirpQueued,
            peckPressed: peckQueued,
          };
          flapQueued = false;
          chirpQueued = false;
          peckQueued = false;

          sparrowController.update(
            dt,
            elapsed,
            sparrowChaseCam.yaw,
            sparrowInput,
            phaseRef.current === 'playing'
          );

          if (sim.zeybekTimer > 0 && sparrowController.mode !== 'flying') {
            const barSec = 2.52;
            const barIdx = Math.floor(sim.zeybekElapsed / barSec);
            const u = (sim.zeybekElapsed % barSec) / barSec;
            if (sim.lastZeybekDipBar === -2) {
              sim.lastZeybekDipBar = -1;
              sparrowController.triggerChirp();
            } else if (u >= 0.5 && u <= 0.64 && barIdx !== sim.lastZeybekDipBar) {
              sim.lastZeybekDipBar = barIdx;
              sparrowController.triggerChirp();
            }
          }

          sim.x = sparrowController.position.x;
          sim.y = sparrowController.position.y;
          sim.z = sparrowController.position.z;
          sim.heading = sparrowController.yaw + Math.PI;
          sim.speed = Math.hypot(sparrowController.velocity.x, sparrowController.velocity.z);
          sim.pitch = -sparrowMesh.bodyPivot.rotation.x;
          groundY = getWalkableSurfaceHeightAt(sim.x, sim.z);
        } else {
          sparrowMesh.root.visible = false;
          flapQueued = false;
          peckQueued = false;
          if (chirpQueued) {
            chirpQueued = false;
            audioEngine.playSparrowMicroChirp('idle');
          }

          if (phaseRef.current === 'playing') {
            const keyForward = heldKeys.has('KeyW') || heldKeys.has('ArrowUp');
            const keyBackward = heldKeys.has('KeyS') || heldKeys.has('ArrowDown');
            const keyLeft = heldKeys.has('KeyA') || heldKeys.has('ArrowLeft');
            const keyRight = heldKeys.has('KeyD') || heldKeys.has('ArrowRight');
            const hasKeyMove = keyForward || keyBackward || keyLeft || keyRight;

            const joyX = touchInputRef.current.joyX ?? 0;
            const joyY = touchInputRef.current.joyY ?? 0;
            const joyMag = Math.min(1, Math.hypot(joyX, joyY));
            const touchButtonsActive =
              touchInputRef.current.forward ||
              touchInputRef.current.backward ||
              touchInputRef.current.left ||
              touchInputRef.current.right;

            const sprint = heldKeys.has('ShiftLeft') || heldKeys.has('ShiftRight');

            const maxSpeed = isWalking
              ? sprint
                ? 8.0
                : 5.4
              : vType === 'bicycle'
                ? 11.5
                : vType === 'motorcycle'
                  ? 19.5
                  : 17.0;
            const accel = isWalking ? 24 : vType === 'bicycle' ? 14 : vType === 'motorcycle' ? 22 : 17;
            const drag = isWalking ? 14 : vType === 'bicycle' ? 3.8 : 2.6;
            const turnRate = isWalking
              ? 2.65
              : vType === 'bicycle'
                ? 2.5
                : vType === 'motorcycle'
                  ? 2.35
                  : 1.95;

            const isIsoCam =
              cameraPresetRef.current !== 'first_person' &&
              cameraPresetRef.current !== 'perspective';
            const isoAzimuth = Math.PI / 4 + sim.isoYawOffset;

            if (isIsoCam && joyMag > 0.08 && !hasKeyMove && !touchButtonsActive) {
              // Smart 360-degree screen-relative isometric analog control for both walking and driving!
              const cosA = Math.cos(isoAzimuth);
              const sinA = Math.sin(isoAzimuth);
              const worldDirX = joyX * cosA - joyY * sinA;
              const worldDirZ = -joyX * sinA - joyY * cosA;
              const targetHeading = Math.atan2(-worldDirX, -worldDirZ);
              let diff = targetHeading - sim.heading;
              while (diff > Math.PI) diff -= Math.PI * 2;
              while (diff < -Math.PI) diff += Math.PI * 2;
              const steerResponsiveness = isWalking ? 12 : vType === 'bicycle' ? 8.5 : vType === 'motorcycle' ? 7.8 : 6.4;
              sim.heading += diff * Math.min(1, dt * steerResponsiveness);
              // Ease forward speed cleanly on sharp 180° turns so vehicle pivots smoothly
              const cornerFactor = isWalking ? 1.0 : Math.max(0.35, 1.0 - Math.abs(diff) / (Math.PI * 1.15));
              const targetSpeed = maxSpeed * joyMag * cornerFactor;
              sim.speed = THREE.MathUtils.damp(sim.speed, targetSpeed, isWalking ? 14 : 6.5, dt);
              sim.steerAngle = THREE.MathUtils.damp(
                sim.steerAngle,
                THREE.MathUtils.clamp(diff * 0.55, -0.45, 0.45),
                10,
                dt
              );
            } else {
              // In chase/1P mode or when pedals/keys are held: never reverse accidentally when steering left/right on joystick
              const joyFwd = joyY > 0.1 ? joyY : Math.abs(joyX) > 0.25 && joyY > -0.2 ? Math.abs(joyX) * 0.42 : 0;
              const joyRev = joyY < -0.35 ? (-joyY - 0.35) / 0.65 : 0;
              const forwardStrength = Math.max(
                keyForward || touchInputRef.current.forward ? 1 : 0,
                joyFwd
              );
              const backwardStrength = Math.max(
                keyBackward || touchInputRef.current.backward ? 1 : 0,
                joyRev
              );

              if (forwardStrength > 0.05) {
                const cap = maxSpeed * forwardStrength;
                if (sim.speed < cap) {
                  sim.speed = Math.min(cap, sim.speed + accel * forwardStrength * dt);
                } else {
                  sim.speed = THREE.MathUtils.damp(sim.speed, cap, drag, dt);
                }
              } else if (backwardStrength > 0.05) {
                const revCap = -maxSpeed * (isWalking ? 0.65 : 0.45) * backwardStrength;
                sim.speed = Math.max(revCap, sim.speed - accel * 0.9 * backwardStrength * dt);
              } else {
                sim.speed = THREE.MathUtils.damp(sim.speed, 0, drag, dt);
                if (Math.abs(sim.speed) < 0.04) sim.speed = 0;
              }

              // Gentle uphill resistance & downhill coasting on Aytepe / Tralleis slopes
              if (!isWalking && Math.abs(slopesPre.pitch) > 0.008 && Math.abs(sim.speed) > 0.25) {
                sim.speed -= Math.sin(slopesPre.pitch) * 4.8 * dt;
              }

              const left = keyLeft || touchInputRef.current.left;
              const right = keyRight || touchInputRef.current.right;
              const steerInput = THREE.MathUtils.clamp(
                (left ? 1 : 0) - (right ? 1 : 0) - joyX,
                -1,
                1
              );
              sim.steerAngle = THREE.MathUtils.damp(sim.steerAngle, steerInput * 0.42, 10, dt);

              if (isWalking) {
                sim.heading += steerInput * turnRate * dt;
              } else if (Math.abs(sim.speed) > 0.15) {
                const dirSign = sim.speed >= 0 ? 1 : -1;
                const speedTurnScale = THREE.MathUtils.clamp(Math.abs(sim.speed) / 4.5, 0.45, 1.0);
                sim.heading += steerInput * turnRate * speedTurnScale * dirSign * dt;
              } else if (Math.abs(steerInput) > 0.15) {
                // Allow gentle in-place steering aim on mobile when starting from standstill
                sim.heading += steerInput * turnRate * 0.45 * dt;
              }
            }

            const moveX = -Math.sin(sim.heading) * sim.speed * dt;
            const moveZ = -Math.cos(sim.heading) * sim.speed * dt;

            const colRadius = isWalking ? 0.55 : vType === 'car' ? 1.35 : 0.72;
            const [resolvedX, resolvedZ] = resolveCollision(
              sim.x + moveX,
              sim.z + moveZ,
              colRadius,
              city.colliders
            );
            sim.x = resolvedX;
            sim.z = resolvedZ;

            if (isWalking) {
              audioEngine.updateEngineSound(0, vType, false);
            } else {
              audioEngine.updateEngineSound(Math.abs(sim.speed), vType, true);
            }
          } else {
            sim.speed = THREE.MathUtils.damp(sim.speed, 0, 4, dt);
            audioEngine.updateEngineSound(0, vType, false);
          }

          groundY = getWalkableSurfaceHeightAt(sim.x, sim.z);
          const slopes = getWalkableSlopeAngles(sim.x, sim.z, sim.heading);
          const yDamp = groundY > sim.y ? 32 : 20;
          sim.y = Math.max(groundY - 0.008, THREE.MathUtils.damp(sim.y, groundY, yDamp, dt));
          sim.pitch = THREE.MathUtils.damp(sim.pitch, slopes.pitch, 12, dt);
          sim.roll = THREE.MathUtils.damp(sim.roll, -slopes.roll, 12, dt);

          if (isWalking) {
            const isDancing = sim.zeybekTimer > 0 && Math.abs(sim.speed) < 0.8;
            vehicleRig.root.visible = false;
            cityAvatarRig.root.visible = !isFirstPerson;
            cityAvatarRig.root.position.set(sim.x, sim.y, sim.z);
            cityAvatarRig.root.rotation.order = 'YXZ';
            cityAvatarRig.root.rotation.y = sim.heading;
            cityAvatarRig.root.rotation.x = isDancing ? 0 : sim.pitch * 0.18;
            if (isDancing) {
              cityAvatarRig.updateZeybek(dt, elapsed, sim.zeybekElapsed);
              const barSec = 2.52;
              const barIdx = Math.floor(sim.zeybekElapsed / barSec);
              const u = (sim.zeybekElapsed % barSec) / barSec;
              if (sim.lastZeybekDipBar === -2) {
                sim.lastZeybekDipBar = -1;
                _chaseTarget.set(sim.x, groundY + 0.05, sim.z);
                sparrowFx.spawnChirpRing(_chaseTarget, 0xf5be49);
              } else if (u >= 0.5 && u <= 0.64 && barIdx !== sim.lastZeybekDipBar) {
                sim.lastZeybekDipBar = barIdx;
                _chaseTarget.set(sim.x, groundY + 0.05, sim.z);
                sparrowFx.spawnChirpRing(_chaseTarget, 0xf5be49);
                sparrowFx.spawnCrumbs(_chaseTarget, 5);
              }
            } else {
              cityAvatarRig.updateWalk(sim.speed, dt, elapsed);
            }
          } else {
            cityAvatarRig.root.visible = false;
            vehicleRig.root.visible = !isFirstPerson;
            vehicleRig.root.position.set(sim.x, sim.y, sim.z);
            vehicleRig.root.rotation.order = 'YXZ';
            vehicleRig.root.rotation.y = sim.heading;
            vehicleRig.root.rotation.x = sim.pitch;

            sim.wheelSpin += (sim.speed * dt) / (vType === 'car' ? 0.33 : 0.35);
            vehicleRig.wheels.forEach((w) => {
              w.rotation.x = -sim.wheelSpin;
            });
            vehicleRig.steerPivots.forEach((p) => {
              p.rotation.y = sim.steerAngle;
            });
            if (vehicleRig.pedalCrank) {
              vehicleRig.pedalCrank.rotation.x = -sim.wheelSpin * 0.7;
            }
            const steerRoll =
              vType === 'car'
                ? -sim.steerAngle * Math.min(1, Math.abs(sim.speed) / 12) * 0.14
                : sim.steerAngle * Math.min(1, Math.abs(sim.speed) / 8) * 0.38;
            vehicleRig.tiltGroup.rotation.z = THREE.MathUtils.damp(
              vehicleRig.tiltGroup.rotation.z,
              steerRoll + sim.roll,
              8,
              dt
            );
          }
        }

        // Collect floating sesame & fig crumbs (rooftops, bridges & Kent Meydanı)
        if (phaseRef.current === 'playing') {
          for (let i = 0; i < sparrowFx.pickups.length; i++) {
            const pk = sparrowFx.pickups[i];
            if (pk.collected) continue;
            if (
              Math.hypot(sim.x - pk.pos.x, sim.z - pk.pos.z) < 1.45 &&
              Math.abs(sim.y - pk.pos.y) < 1.45
            ) {
              pk.collected = true;
              pk.mesh.visible = false;
              pk.respawnTimer = 45;
              sparrowFx.spawnCrumbs(pk.pos, 9);
              audioEngine.playCrumbEat();
              if (isSparrow) sparrowController.triggerEat();
              callbacksRef.current.onCollectCrumb?.(3);
            }
          }
        }

        // Companion NPC boulevard walk logic
        if (sim.companionDirty && sim.companionNpc) {
          sim.companionDirty = false;
          companionRig.configure(
            sim.companionNpc,
            sim.heldTreat !== 'none' ? sim.heldTreat : 'icecream'
          );
        }
        if (sim.companionNpc && isWalking) {
          sim.companionTimer -= dt;
          companionRig.root.visible = true;
          const targetCX = sim.x + Math.cos(sim.heading) * 1.28 + Math.sin(sim.heading) * 0.15;
          const targetCZ = sim.z - Math.sin(sim.heading) * 1.28 + Math.cos(sim.heading) * 0.15;
          const stepX = THREE.MathUtils.damp(sim.companionX, targetCX, 5.5, dt);
          const stepZ = THREE.MathUtils.damp(sim.companionZ, targetCZ, 5.5, dt);
          const [resCX, resCZ] = resolveCollision(stepX, stepZ, 0.48, city.colliders);
          const compSpeed =
            Math.hypot(resCX - sim.companionX, resCZ - sim.companionZ) / Math.max(0.001, dt);
          sim.companionX = resCX;
          sim.companionZ = resCZ;
          companionRig.root.position.set(resCX, getWalkableSurfaceHeightAt(resCX, resCZ), resCZ);
          companionRig.root.rotation.y = sim.heading;
          if (sim.zeybekTimer > 0 && Math.abs(sim.speed) < 0.8) {
            companionRig.updateZeybek(dt, elapsed, sim.zeybekElapsed);
          } else {
            companionRig.updateWalk(compSpeed, dt, elapsed);
          }

          if (phaseRef.current === 'playing') {
            sim.companionChatAccum -= dt;
            if (sim.companionChatAccum <= 0) {
              sim.companionChatAccum = 8.5;
              const lines = sim.companionNpc.walkChatLines || [
                'Efeler sokaklarında birlikte yürümek çok keyifli!',
              ];
              const line = lines[sim.companionChatIdx % lines.length];
              sim.companionChatIdx += 1;
              callbacksRef.current.onWalkChatMessage(`${sim.companionNpc.name}: “${line}”`);
            }
          }

          if (sim.companionTimer <= 0) {
            const doneName = sim.companionNpc.name;
            sim.companionNpc = null;
            companionRig.root.visible = false;
            callbacksRef.current.onWalkChatMessage(
              `${doneName} ile keyifli bulvar yürüyüşünüz tamamlandı!`
            );
          }
        } else {
          if (!isWalking && sim.companionNpc) {
            sim.companionNpc = null;
            sim.companionTimer = 0;
          }
          companionRig.root.visible = false;
        }

        if (!isWalking && !isSparrow && Math.abs(sim.speed) > 4.5 && phaseRef.current === 'playing') {
          particleSpawnAccum += dt;
          if (particleSpawnAccum > 0.09) {
            particleSpawnAccum = 0;
            const p = particles[nextParticle];
            nextParticle = (nextParticle + 1) % particleCount;
            p.active = true;
            p.life = 0;
            p.x = sim.x + Math.sin(sim.heading) * 1.1 + (Math.random() - 0.5) * 0.5;
            p.y = groundY + 0.18;
            p.z = sim.z + Math.cos(sim.heading) * 1.1 + (Math.random() - 0.5) * 0.5;
            p.vx = (Math.random() - 0.5) * 0.6;
            p.vy = 0.65 + Math.random() * 0.4;
            p.vz = (Math.random() - 0.5) * 0.6;
          }
        }
        for (let i = 0; i < particleCount; i++) {
          const p = particles[i];
          if (!p.active) {
            pDummy.position.set(0, -10, 0);
            pDummy.scale.setScalar(0.01);
          } else {
            p.life += dt;
            if (p.life >= p.maxLife) {
              p.active = false;
              pDummy.position.set(0, -10, 0);
              pDummy.scale.setScalar(0.01);
            } else {
              p.x += p.vx * dt;
              p.y += p.vy * dt;
              p.z += p.vz * dt;
              const t = p.life / p.maxLife;
              const s = (1 - t) * 0.85;
              pDummy.position.set(p.x, p.y, p.z);
              pDummy.scale.setScalar(Math.max(0.01, s));
            }
          }
          pDummy.updateMatrix();
          particleMesh.setMatrixAt(i, pDummy.matrix);
        }
        particleMesh.instanceMatrix.needsUpdate = true;

        let closestLm: LandmarkDef | null = null;
        let closestDist = Infinity;
        for (const blm of city.landmarks) {
          const rx = blm.ringMesh.position.x;
          const rz = blm.ringMesh.position.z;
          const dist = Math.hypot(sim.x - rx, sim.z - rz);
          const centerDist = Math.hypot(
            sim.x - blm.def.position[0],
            sim.z - blm.def.position[2]
          );
          const effDist = Math.min(dist, centerDist);
          if (effDist < blm.def.interactionRadius && effDist < closestDist) {
            closestDist = effDist;
            closestLm = blm.def;
          }

          const isDiscovered = discoveredIdsRef.current.includes(blm.def.id);
          const isErrandTarget =
            activeErrandRef.current &&
            (errandPickedUpRef.current
              ? activeErrandRef.current.toLandmarkId === blm.def.id
              : activeErrandRef.current.fromLandmarkId === blm.def.id);

          const scalePulse = isErrandTarget
            ? 1.15 + Math.sin(elapsed * 3.5) * 0.14
            : 1.0 + Math.sin(elapsed * 2.2) * 0.06;
          blm.ringMesh.scale.setScalar(scalePulse);
          const ringMat = blm.ringMesh.material as THREE.MeshStandardMaterial;
          if (isErrandTarget) {
            ringMat.color.setHex(0x61b88a);
            ringMat.emissive.setHex(0x4ba877);
            ringMat.emissiveIntensity = 1.0;
          } else if (isDiscovered) {
            ringMat.color.setHex(0x9ab091);
            ringMat.emissive.setHex(0x6b8462);
            ringMat.emissiveIntensity = 0.25;
          } else {
            ringMat.color.setHex(0xe3a84f);
            ringMat.emissive.setHex(0xe3a84f);
            ringMat.emissiveIntensity = 0.72;
          }
        }
        sim.nearbyLandmark = closestLm;

        let closestNpc: BuildingNpcDef | null = null;
        let closestNpcDist = 6.2;
        for (const npc of BUILDING_NPCS) {
          const nd = Math.hypot(sim.x - npc.position[0], sim.z - npc.position[1]);
          if (nd < closestNpcDist) {
            closestNpcDist = nd;
            closestNpc = npc;
          }
        }
        sim.nearbyNpc = closestNpc;

        // Check proximity to Interactive Street Encounters
        let streetInt: NearbyStreetInteraction | null = null;
        const dMusicians = Math.hypot(
          sim.x - city.musicians.center[0],
          sim.z - city.musicians.center[1]
        );
        const dLokma = Math.hypot(
          sim.x - city.lokmaStand.pos[0],
          sim.z - city.lokmaStand.pos[1]
        );
        const dVendor = Math.hypot(
          sim.x - city.libraryVendor.vendorPos[0],
          sim.z - city.libraryVendor.vendorPos[1]
        );

        if (dMusicians < 8.5) {
          streetInt = {
            type: 'musicians',
            label: city.musicians.isDancing()
              ? 'Efeler Zeybek Oynuyor!'
              : 'Sokak Müzisyenleri — Zeybek Çaldır (Tıkla veya E)',
          };
        } else if (dLokma < 7.0) {
          streetInt = {
            type: 'lokma',
            label: 'Bey Camii Önü Hayır Lokması — +1 Lokma Gücü Al (Tıkla veya E)',
          };
        } else if (dVendor < 6.5) {
          streetInt = {
            type: 'vendor',
            label: 'Kütüphane Önü Mendil & Lif Satıcısıyla Konuş (Tıkla veya E)',
          };
        }
        sim.nearbyStreetInteraction = streetInt;

        let nearSign = false;
        for (const [sx, sz] of ANCIENT_SIGNPOST_POSITIONS) {
          if (Math.hypot(sim.x - sx, sim.z - sz) < 9.5) {
            nearSign = true;
            break;
          }
        }
        sim.nearAncientSignpost = nearSign;

        const dHome = Math.hypot(
          sim.x - PLAYER_HOME_DOOR_POS[0],
          sim.z - PLAYER_HOME_DOOR_POS[1]
        );
        sim.nearPlayerHome = dHome < 7.2;
        city.homeRingMesh.scale.setScalar(
          sim.nearPlayerHome ? 1.18 + Math.sin(elapsed * 4) * 0.1 : 1.0 + Math.sin(elapsed * 2.2) * 0.06
        );

        // Update 3D Weather Particles gradually with crossfaded precipitation strength
        const precipStrength = Math.max(
          weatherWeights.rain,
          weatherWeights.snow,
          weatherWeights.storm
        );
        const snowDom = weatherWeights.snow > Math.max(weatherWeights.rain, weatherWeights.storm);
        const stormDom = weatherWeights.storm > Math.max(weatherWeights.rain, weatherWeights.snow);
        if (precipStrength < 0.03) {
          if (weatherMesh.visible) weatherMesh.visible = false;
        } else {
          if (!weatherMesh.visible) weatherMesh.visible = true;
          if (snowDom) {
            weatherMat.color.setHex(0xffffff);
            weatherMat.opacity = 0.85 * precipStrength;
          } else if (stormDom) {
            weatherMat.color.setHex(0xb8cde4);
            weatherMat.opacity = 0.68 * precipStrength;
          } else {
            weatherMat.color.setHex(0xd0e2f2);
            weatherMat.opacity = 0.52 * precipStrength;
          }

          const activeDrops = Math.floor(weatherCount * precipStrength);
          for (let i = 0; i < weatherCount; i++) {
            if (i >= activeDrops) {
              wDummy.position.set(0, -30, 0);
              wDummy.scale.setScalar(0.01);
              wDummy.updateMatrix();
              weatherMesh.setMatrixAt(i, wDummy.matrix);
              continue;
            }
            const drop = weatherDrops[i];
            if (snowDom) {
              drop.y -= 3.2 * drop.speed * dt;
              drop.ox += Math.sin(elapsed * 1.4 + drop.phase) * 1.4 * dt;
            } else if (stormDom) {
              drop.y -= 28 * drop.speed * dt;
              drop.ox -= 7.5 * dt;
            } else {
              drop.y -= 20 * drop.speed * dt;
              drop.ox -= 2.0 * dt;
            }

            if (drop.y < 0.1) {
              drop.y = 24 + Math.random() * 4;
              drop.ox = (Math.random() - 0.5) * 68;
              drop.oz = (Math.random() - 0.5) * 68;
            }

            wDummy.position.set(
              _lookCurrent.x + drop.ox,
              Math.max(0, _lookCurrent.y - 1.0) + drop.y,
              _lookCurrent.z + drop.oz
            );
            if (snowDom) {
              wDummy.rotation.set(elapsed + drop.phase, elapsed * 0.6, 0);
              wDummy.scale.set(2.2, 0.22, 2.2);
            } else if (stormDom) {
              wDummy.rotation.set(0, 0, 0.28);
              wDummy.scale.set(1.0, 1.35, 1.0);
            } else {
              wDummy.rotation.set(0, 0, 0.09);
              wDummy.scale.set(0.85, 1.0, 0.85);
            }
            wDummy.updateMatrix();
            weatherMesh.setMatrixAt(i, wDummy.matrix);
          }
          weatherMesh.instanceMatrix.needsUpdate = true;
        }

        const presetZoom =
          cameraPresetRef.current === 'close'
            ? 1.48
            : cameraPresetRef.current === 'overview'
              ? 0.65
              : 1.0;

        const useChaseCam =
          phaseRef.current !== 'title' &&
          !isFirstPerson &&
          (isSparrow || cameraPresetRef.current === 'perspective');
        const activeCam = isFirstPerson ? fpCamera : useChaseCam ? chaseCamera : camera;

        if (phaseRef.current === 'title') {
          const orbitAngle = elapsed * 0.11;
          const focusX = Math.sin(orbitAngle) * 20;
          const focusZ = 2 + Math.cos(orbitAngle) * 22;
          const focusY = getWalkableSurfaceHeightAt(focusX, focusZ);
          _lookGoal.set(focusX, focusY + 2, focusZ);
          _camGoal.set(focusX + 42, focusY + 36, focusZ + 42);
          camera.zoom = THREE.MathUtils.damp(camera.zoom, 0.9, 2.5, dt);
          _lookCurrent.lerp(_lookGoal, 1 - Math.exp(-5.5 * dt));
          camera.position.lerp(_camGoal, 1 - Math.exp(-5.5 * dt));
          camera.lookAt(_lookCurrent);
          camera.updateProjectionMatrix();
        } else if (isFirstPerson) {
          const eyeH = isSparrow ? 0.34 : isWalking ? 1.46 : 1.32;
          const fwdOff = isSparrow ? 0.24 : isWalking ? 0.14 : 0.38;
          const camX = sim.x - Math.sin(sim.heading) * fwdOff;
          const camZ = sim.z - Math.cos(sim.heading) * fwdOff;
          const camY = sim.y + eyeH;
          const lookAngle = sim.heading + sim.fpYaw;
          const totalPitch = THREE.MathUtils.clamp(sim.pitch * 0.6 + sim.fpPitch, -0.65, 0.52);

          fpCamera.position.set(camX, camY, camZ);
          _lookGoal.set(
            camX - Math.sin(lookAngle) * Math.cos(totalPitch) * 16,
            camY + Math.sin(totalPitch) * 16,
            camZ - Math.cos(lookAngle) * Math.cos(totalPitch) * 16
          );
          fpCamera.lookAt(_lookGoal);
          _lookCurrent.set(sim.x, sim.y + (isSparrow ? 0.4 : 1.0), sim.z);
        } else if (useChaseCam) {
          if (isSparrow) {
            _chaseTarget.copy(sparrowController.position);
            sparrowChaseCam.update(chaseCamera, {
              targetPos: _chaseTarget,
              targetYaw: sparrowController.yaw,
              targetForwardX: Math.sin(sparrowController.yaw),
              targetForwardZ: Math.cos(sparrowController.yaw),
              airspeed: sim.speed,
              maxAirspeed: 22,
              bankAngle: sparrowMesh.bodyPivot.rotation.z,
              verticalVel: sparrowController.velocity.y,
              isFlying: sparrowController.mode === 'flying',
              isVehicle: false,
              zoomFactor: sim.zoomFactor,
              colliders: city.colliders,
              dt,
            });
            _lookCurrent.set(sim.x, sim.y + 0.4, sim.z);
          } else {
            _chaseTarget.set(sim.x, sim.y, sim.z);
            sparrowChaseCam.update(chaseCamera, {
              targetPos: _chaseTarget,
              targetYaw: sim.heading + Math.PI,
              targetForwardX: -Math.sin(sim.heading),
              targetForwardZ: -Math.cos(sim.heading),
              airspeed: Math.abs(sim.speed),
              maxAirspeed: 20,
              bankAngle: 0,
              verticalVel: 0,
              isFlying: false,
              isVehicle: !isWalking,
              zoomFactor: sim.zoomFactor,
              colliders: city.colliders,
              dt,
            });
            _lookCurrent.set(sim.x, sim.y + 1.0, sim.z);
          }
        } else {
          const isoAzimuth = Math.PI / 4 + sim.isoYawOffset;
          const isoDist = 53.74;
          const speedLead = THREE.MathUtils.clamp(Math.abs(sim.speed) * 0.14, 0, 2.2);
          const fwdSign = sim.speed >= -0.2 ? 1 : -1;
          const leadX = -Math.sin(sim.heading) * speedLead * fwdSign;
          const leadZ = -Math.cos(sim.heading) * speedLead * fwdSign;

          _lookGoal.set(sim.x + leadX, sim.y + 1.0, sim.z + leadZ);
          _camGoal.set(
            _lookGoal.x + Math.sin(isoAzimuth) * isoDist,
            sim.y + 34,
            _lookGoal.z + Math.cos(isoAzimuth) * isoDist
          );
          camera.zoom = THREE.MathUtils.damp(
            camera.zoom,
            sim.zoomFactor * presetZoom,
            5,
            dt
          );
          _lookCurrent.lerp(_lookGoal, 1 - Math.exp(-6.5 * dt));
          camera.position.lerp(_camGoal, 1 - Math.exp(-6.5 * dt));
          camera.lookAt(_lookCurrent);
          camera.updateProjectionMatrix();
        }

        sunLight.target.position.copy(_lookCurrent);
        sunLight.position.set(
          _lookCurrent.x + sampledSolar.sunPos[0],
          _lookCurrent.y + sampledSolar.sunPos[1],
          _lookCurrent.z + sampledSolar.sunPos[2]
        );

        hudAccum += dt;
        const hudInterval = city.libraryVendor.isBubbleVisible() ? 0.065 : 0.15;
        if (hudAccum >= hudInterval) {
          hudAccum = 0;
          const loc = resolveLocationLabels(sim.x, sim.z);
          let distToErrand: number | null = null;
          if (activeErrandRef.current) {
            const targetId = errandPickedUpRef.current
              ? activeErrandRef.current.toLandmarkId
              : activeErrandRef.current.fromLandmarkId;
            const targetLm = LANDMARKS.find((l) => l.id === targetId);
            if (targetLm) {
              distToErrand = Math.round(
                Math.hypot(sim.x - targetLm.position[0], sim.z - targetLm.position[2])
              );
            }
          }

          // Project Vendor Head Position for crisp DOM Speech Bubble
          let vendorBubble: PlayerHudSnapshot['vendorBubble'] = null;
          if (city.libraryVendor.isBubbleVisible() && container) {
            _projVec.copy(city.libraryVendor.headWorldPos).project(activeCam);
            if (_projVec.z < 1 && Math.abs(_projVec.x) <= 1.05 && Math.abs(_projVec.y) <= 1.05) {
              vendorBubble = {
                x: ((_projVec.x + 1) / 2) * container.clientWidth,
                y: (-(_projVec.y - 1) / 2) * container.clientHeight,
                visible: true,
                text: 'Mendil yara bandı ıslak mendil lif ister misiniz ? buyrunnn',
              };
            }
          }

          callbacksRef.current.onHudUpdate({
            speedKmh: Math.round(Math.abs(sim.speed) * 2.8),
            currentDistrict: loc.district,
            currentStreet: loc.street,
            nearbyLandmark: closestLm,
            nearbyNpc: closestNpc,
            nearAncientSignpost: nearSign,
            nearPlayerHome: sim.nearPlayerHome,
            nearbyStreetInteraction: streetInt,
            vendorBubble,
            distanceToActiveErrand: distToErrand,
            playerPos: [sim.x, sim.z],
            headingRad: sim.heading,
            companionName: sim.companionNpc ? sim.companionNpc.name : null,
            heldTreat: sim.heldTreat,
            solarClock: getSolarClockLabel(solarPhase),
            sparrowState: isSparrow ? sparrowController.mode : undefined,
            sparrowStamina: isSparrow ? sparrowController.flightStamina : undefined,
            isDancingZeybek: sim.zeybekTimer > 0,
          });
        }

        renderer.render(scene, activeCam);

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
        window.removeEventListener('keydown', onKeyDown);
        window.removeEventListener('keyup', onKeyUp);
        window.removeEventListener('blur', onWindowBlur);
        window.removeEventListener('resize', onResize);
        window.removeEventListener('pointerup', onPointerUp);
        window.removeEventListener('pointercancel', onPointerUp);
        renderer.domElement.removeEventListener('pointerdown', onPointerDown);
        renderer.domElement.removeEventListener('pointermove', onPointerMove);
        renderer.domElement.removeEventListener('click', onPointerClick);
        renderer.domElement.removeEventListener('wheel', onWheel);
        renderer.domElement.removeEventListener('touchstart', onTouchStart);
        renderer.domElement.removeEventListener('touchmove', onTouchMove);
        renderer.domElement.removeEventListener('touchend', onTouchEnd);
        renderer.domElement.removeEventListener('touchcancel', onTouchEnd);
        renderer.domElement.removeEventListener('webglcontextlost', handleContextLost);
        renderer.domElement.removeEventListener('webglcontextrestored', handleContextRestored);

        audioEngine.updateEngineSound(0, vehicleConfigRef.current.type, false);
        unbindChaseDrag();
        sparrowActionsRef.current = null;
        sparrowFx.dispose();
        vehicleRig.dispose();
        cityAvatarRig.dispose();
        companionRig.dispose();
        particleGeo.dispose();
        particleMat.dispose();
        weatherGeo.dispose();
        weatherMat.dispose();
        city.dispose();
        mats.dispose();
        textures.dispose();
        envRT.dispose();
        renderer.dispose();
        renderer.domElement.remove();
      };
    }, []);

    return (
      <div
        className={`relative w-full h-full overflow-hidden efeler-atmosphere-root efeler-cycle-${timeOfDay} efeler-weather-${weather}`}
        data-time-of-day={timeOfDay}
        data-weather={weather}
      >
        <div aria-hidden="true" className="absolute inset-0 pointer-events-none efeler-sky-backdrop" />
        <div aria-hidden="true" className="absolute inset-0 pointer-events-none efeler-sky-stars" />
        <div aria-hidden="true" className="absolute inset-0 pointer-events-none efeler-sky-sun-halo" />
        <div ref={mountRef} className="relative w-full h-full efeler-canvas-stage" />
        <div aria-hidden="true" className="absolute inset-0 pointer-events-none efeler-lighting-overlay" />
        {contextLost && (
          <div className="absolute inset-0 flex items-center justify-center bg-[#181612]/90 text-[#F5EFE6]">
            <div className="text-center max-w-sm px-6">
              <h2 className="font-display text-xl font-semibold mb-2">
                Grafik Bağlamı Yenileniyor
              </h2>
              <p className="text-sm text-[#C7BEB0]">
                Efeler sahnesi birkaç saniye içinde yeniden yüklenecektir.
              </p>
            </div>
          </div>
        )}
      </div>
    );
  }
);
