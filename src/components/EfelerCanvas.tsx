import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import {
  ANCIENT_SIGNPOST_POSITIONS,
  DISTRICT_ZONES,
  LANDMARKS,
  PLAYER_HOME_DOOR_POS,
  ROAD_X_COORDS,
  ROAD_Z_COORDS,
  STREET_NAMES_X,
  STREET_NAMES_Z,
  TIME_MOODS,
} from '../data/efelerData';
import { audioEngine } from '../game/audioEngine';
import { buildEfelerCity } from '../game/cityBuilder';
import { createCityMaterials } from '../game/materials';
import { createProceduralTextures } from '../game/textures';
import { createVehicleModel, VehicleRig } from '../game/vehicles';
import {
  CameraPreset,
  ColliderBox,
  ErrandDef,
  GamePhase,
  LandmarkDef,
  NearbyStreetInteraction,
  PlayerHudSnapshot,
  StreetInteractionType,
  TimeOfDay,
  VehicleConfig,
  WeatherType,
} from '../types/game';

export interface EfelerCanvasHandle {
  teleportTo: (x: number, z: number, heading?: number) => void;
  triggerDiscoverNearby: () => void;
  triggerHorn: () => void;
}

interface EfelerCanvasProps {
  phase: GamePhase;
  vehicleConfig: VehicleConfig;
  timeOfDay: TimeOfDay;
  weather: WeatherType;
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
  onEnterHome: () => void;
}

const _targetSky = new THREE.Color();
const _targetSun = new THREE.Color();
const _targetHemiSky = new THREE.Color();
const _targetHemiGround = new THREE.Color();
const _stormTint = new THREE.Color(0x3a4354);
const _rainTint = new THREE.Color(0x6c7c8e);
const _snowTint = new THREE.Color(0xdde6ef);
const _lightningTint = new THREE.Color(0xdbe8ff);
const _camGoal = new THREE.Vector3();
const _lookGoal = new THREE.Vector3();
const _lookCurrent = new THREE.Vector3();
const _projVec = new THREE.Vector3();
const _pointerVec = new THREE.Vector2();

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
  }

  return { district, street: bestStreet };
}

function resolveCollision(
  x: number,
  z: number,
  radius: number,
  colliders: ColliderBox[]
): [number, number] {
  let nx = THREE.MathUtils.clamp(x, -95, 95);
  let nz = THREE.MathUtils.clamp(z, -90, 72);

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
      vehicleConfig,
      timeOfDay,
      weather,
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
      onEnterHome,
    },
    ref
  ) {
    const mountRef = useRef<HTMLDivElement | null>(null);
    const [contextLost, setContextLost] = useState(false);

    const phaseRef = useRef(phase);
    const vehicleConfigRef = useRef(vehicleConfig);
    const timeOfDayRef = useRef(timeOfDay);
    const weatherRef = useRef(weather);
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
      onEnterHome,
    });

    phaseRef.current = phase;
    vehicleConfigRef.current = vehicleConfig;
    timeOfDayRef.current = timeOfDay;
    weatherRef.current = weather;
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
      onEnterHome,
    };

    const simRef = useRef({
      x: initialTransform?.x ?? -18,
      z: initialTransform?.z ?? 27,
      heading: initialTransform?.heading ?? 0,
      speed: 0,
      steerAngle: 0,
      wheelSpin: 0,
      zoomFactor: 1.0,
      rebuildVehicleRequested: false,
      nearbyLandmark: null as LandmarkDef | null,
      nearAncientSignpost: false,
      nearPlayerHome: false,
      nearbyStreetInteraction: null as NearbyStreetInteraction | null,
    });

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

      // Priority 2: Enter Player Home ("Sıcak Yuvam")
      if (simRef.current.nearPlayerHome) {
        audioEngine.updateEngineSound(0, vehicleConfigRef.current.type, false);
        audioEngine.playDiscoveryChime();
        callbacksRef.current.onEnterHome();
        return;
      }

      // Priority 3: Ancient Cities Signpost
      if (simRef.current.nearAncientSignpost && !simRef.current.nearbyLandmark) {
        audioEngine.playDiscoveryChime();
        callbacksRef.current.onInspectSignpost();
        return;
      }

      // Priority 4: Landmark Discovery / Errand Pickup & Dropoff
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
        simRef.current.heading = heading;
        simRef.current.speed = 0;
      },
      triggerDiscoverNearby: () => {
        performDiscover();
      },
      triggerHorn: () => {
        audioEngine.playHorn(vehicleConfigRef.current.type);
      },
    }));

    useEffect(() => {
      simRef.current.rebuildVehicleRequested = true;
    }, [vehicleConfig]);

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
      renderer.toneMappingExposure = 1.08;
      renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
      renderer.shadowMap.enabled = !isSoftwareGl;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      renderer.setSize(container.clientWidth, container.clientHeight);
      renderer.domElement.style.display = 'block';
      renderer.domElement.style.width = '100%';
      renderer.domElement.style.height = '100%';
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
      scene.background = new THREE.Color(initialMood.skyColor);
      scene.fog = new THREE.FogExp2(initialMood.fogColor, 0.004);

      const pmrem = new THREE.PMREMGenerator(renderer);
      const envRT = pmrem.fromScene(new RoomEnvironment(), 0.04);
      scene.environment = envRT.texture;
      pmrem.dispose();

      const aspect = container.clientWidth / Math.max(1, container.clientHeight);
      const baseFrustum = 35;
      const camera = new THREE.OrthographicCamera(
        (-baseFrustum * aspect) / 2,
        (baseFrustum * aspect) / 2,
        baseFrustum / 2,
        -baseFrustum / 2,
        -120,
        350
      );
      camera.position.set(38, 34, 62);
      _lookCurrent.set(simRef.current.x, 1, simRef.current.z);
      camera.lookAt(_lookCurrent);

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
      sunLight.shadow.mapSize.width = 2048;
      sunLight.shadow.mapSize.height = 2048;
      sunLight.shadow.camera.near = 5;
      sunLight.shadow.camera.far = 220;
      const d = 62;
      sunLight.shadow.camera.left = -d;
      sunLight.shadow.camera.right = d;
      sunLight.shadow.camera.top = d;
      sunLight.shadow.camera.bottom = -d;
      sunLight.shadow.bias = -0.0005;
      sunLight.shadow.normalBias = 0.02;
      scene.add(sunLight);
      scene.add(sunLight.target);

      const rimLight = new THREE.DirectionalLight(0xc2d9ff, 0.35);
      rimLight.position.set(-40, 28, -50);
      scene.add(rimLight);

      const textures = createProceduralTextures(renderer.capabilities.getMaxAnisotropy());
      const mats = createCityMaterials(textures, isSoftwareGl);
      const city = buildEfelerCity(mats);
      scene.add(city.group);

      let lastLokmaTime = -20;
      let prevVendorBubble = false;

      streetTriggersRef.current = {
        triggerMusicians: () => {
          city.musicians.triggerZeybek();
          audioEngine.playZeybekDance(11.5);
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
      vehicleRig.root.position.set(simRef.current.x, 0, simRef.current.z);
      scene.add(vehicleRig.root);

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
      const weatherCount = 240;
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

      // Raycasting for Clicking Street Musicians, Vendor, and Lokma Stand directly in 3D
      const raycaster = new THREE.Raycaster();
      let lastMoveRaycast = 0;

      const updatePointer = (clientX: number, clientY: number) => {
        const rect = renderer.domElement.getBoundingClientRect();
        _pointerVec.x = ((clientX - rect.left) / rect.width) * 2 - 1;
        _pointerVec.y = -((clientY - rect.top) / rect.height) * 2 + 1;
      };

      const onPointerMove = (e: PointerEvent) => {
        if (phaseRef.current !== 'playing') return;
        const now = performance.now();
        if (now - lastMoveRaycast < 65) return;
        lastMoveRaycast = now;
        updatePointer(e.clientX, e.clientY);
        raycaster.setFromCamera(_pointerVec, camera);
        const hits = raycaster.intersectObjects(city.interactiveClickables, false);
        renderer.domElement.style.cursor = hits.length > 0 ? 'pointer' : 'default';
      };

      const onPointerClick = (e: MouseEvent) => {
        if (phaseRef.current !== 'playing') return;
        updatePointer(e.clientX, e.clientY);
        raycaster.setFromCamera(_pointerVec, camera);
        const hits = raycaster.intersectObjects(city.interactiveClickables, false);
        if (hits.length > 0 && streetTriggersRef.current) {
          const type = hits[0].object.userData.interactionType as StreetInteractionType;
          if (type === 'musicians') streetTriggersRef.current.triggerMusicians();
          else if (type === 'lokma') streetTriggersRef.current.triggerLokma();
          else if (type === 'vendor') streetTriggersRef.current.triggerVendor();
        }
      };

      renderer.domElement.addEventListener('pointermove', onPointerMove);
      renderer.domElement.addEventListener('click', onPointerClick);

      const heldKeys = new Set<string>();
      const onKeyDown = (e: KeyboardEvent) => {
        if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) {
          if (phaseRef.current === 'playing') e.preventDefault();
        }
        const wasDown = heldKeys.has(e.code);
        heldKeys.add(e.code);

        if (!wasDown && phaseRef.current === 'playing') {
          if (e.code === 'Space') {
            audioEngine.playHorn(vehicleConfigRef.current.type);
          } else if (e.code === 'KeyE') {
            performDiscover();
          }
        }
      };
      const onKeyUp = (e: KeyboardEvent) => {
        heldKeys.delete(e.code);
      };
      const onWindowBlur = () => {
        heldKeys.clear();
      };
      const onWheel = (e: WheelEvent) => {
        if (phaseRef.current !== 'playing') return;
        simRef.current.zoomFactor = THREE.MathUtils.clamp(
          simRef.current.zoomFactor - e.deltaY * 0.0008,
          0.72,
          2.05
        );
      };

      window.addEventListener('keydown', onKeyDown);
      window.addEventListener('keyup', onKeyUp);
      window.addEventListener('blur', onWindowBlur);
      renderer.domElement.addEventListener('wheel', onWheel, { passive: true });

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
      let hudAccum = 0;

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
          vehicleRig.root.position.set(simRef.current.x, 0, simRef.current.z);
          vehicleRig.root.rotation.y = simRef.current.heading;
          scene.add(vehicleRig.root);
        }

        const mood = TIME_MOODS[timeOfDayRef.current];
        const wType = weatherRef.current;

        if (wType === 'storm') {
          lightningTimer -= dt;
          if (lightningTimer <= 0) {
            lightningFlash = 1.0;
            lightningTimer = 4.5 + Math.random() * 6.5;
          }
          lightningFlash = Math.max(0, lightningFlash - dt * 3.8);
        } else {
          lightningFlash = 0;
        }

        _targetSky.set(mood.skyColor);
        if (wType === 'storm') {
          _targetSky.lerp(_stormTint, 0.68);
        } else if (wType === 'rain') {
          _targetSky.lerp(_rainTint, 0.45);
        } else if (wType === 'snow') {
          _targetSky.lerp(_snowTint, 0.35);
        }
        if (lightningFlash > 0.02) {
          _targetSky.lerp(_lightningTint, lightningFlash * 0.55);
        }

        (scene.background as THREE.Color).lerp(_targetSky, Math.min(1, dt * 3.5));
        if (scene.fog instanceof THREE.FogExp2) {
          scene.fog.color.copy(scene.background as THREE.Color);
          const targetFogDensity =
            wType === 'storm' ? 0.009 : wType === 'rain' ? 0.0068 : wType === 'snow' ? 0.006 : 0.004;
          scene.fog.density = THREE.MathUtils.damp(scene.fog.density, targetFogDensity, 2.5, dt);
        }

        _targetSun.set(mood.sunColor);
        if (wType === 'storm') _targetSun.lerp(_stormTint, 0.55);
        sunLight.color.lerp(_targetSun, Math.min(1, dt * 3));
        const weatherSunScale = wType === 'storm' ? 0.55 : wType === 'rain' ? 0.72 : wType === 'snow' ? 0.85 : 1.0;
        sunLight.intensity = THREE.MathUtils.damp(
          sunLight.intensity,
          mood.sunIntensity * weatherSunScale + lightningFlash * 1.6,
          4,
          dt
        );
        _targetHemiSky.set(mood.hemiSky);
        _targetHemiGround.set(mood.hemiGround);
        hemiLight.color.lerp(_targetHemiSky, Math.min(1, dt * 3));
        hemiLight.groundColor.lerp(_targetHemiGround, Math.min(1, dt * 3));
        hemiLight.intensity = THREE.MathUtils.damp(hemiLight.intensity, mood.hemiIntensity, 3, dt);

        const nightOrStorm = mood.lampOn || wType === 'storm' || wType === 'rain';
        mats.windowLit.emissiveIntensity = THREE.MathUtils.damp(
          mats.windowLit.emissiveIntensity,
          nightOrStorm ? Math.max(0.75, mood.windowGlow) : mood.windowGlow,
          3.5,
          dt
        );
        mats.lampBulb.emissiveIntensity = THREE.MathUtils.damp(
          mats.lampBulb.emissiveIntensity,
          nightOrStorm ? 1.85 : 0.08,
          3.5,
          dt
        );
        vehicleRig.headlightGlowMeshes.forEach((hm) => {
          const mat = hm.material as THREE.MeshStandardMaterial;
          mat.emissiveIntensity = nightOrStorm ? 1.7 : 0.25;
        });

        // Update Living World & Interactive Street Encounters
        city.figTree.update(dt, coinsRef.current, elapsed);
        city.pedestrians.update(dt, elapsed);
        city.trafficLights.update(elapsed);
        city.musicians.update(dt, elapsed);
        city.libraryVendor.update(dt, elapsed);
        city.lokmaStand.update(dt, elapsed);

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
        if (phaseRef.current === 'playing') {
          const forward = heldKeys.has('KeyW') || heldKeys.has('ArrowUp');
          const backward = heldKeys.has('KeyS') || heldKeys.has('ArrowDown');
          const left = heldKeys.has('KeyA') || heldKeys.has('ArrowLeft');
          const right = heldKeys.has('KeyD') || heldKeys.has('ArrowRight');

          const maxSpeed = vType === 'bicycle' ? 11.5 : vType === 'motorcycle' ? 19.5 : 17.0;
          const accel = vType === 'bicycle' ? 14 : vType === 'motorcycle' ? 22 : 17;
          const drag = vType === 'bicycle' ? 3.8 : 2.6;
          const turnRate = vType === 'bicycle' ? 2.5 : vType === 'motorcycle' ? 2.35 : 1.95;

          if (forward) {
            sim.speed = Math.min(maxSpeed, sim.speed + accel * dt);
          } else if (backward) {
            sim.speed = Math.max(-maxSpeed * 0.45, sim.speed - accel * 0.9 * dt);
          } else {
            sim.speed = THREE.MathUtils.damp(sim.speed, 0, drag, dt);
            if (Math.abs(sim.speed) < 0.04) sim.speed = 0;
          }

          const steerInput = (left ? 1 : 0) - (right ? 1 : 0);
          sim.steerAngle = THREE.MathUtils.damp(sim.steerAngle, steerInput * 0.42, 10, dt);

          if (Math.abs(sim.speed) > 0.15) {
            const dirSign = sim.speed >= 0 ? 1 : -1;
            const speedTurnScale = THREE.MathUtils.clamp(Math.abs(sim.speed) / 4.5, 0.35, 1.0);
            sim.heading += steerInput * turnRate * speedTurnScale * dirSign * dt;
          }

          const moveX = -Math.sin(sim.heading) * sim.speed * dt;
          const moveZ = -Math.cos(sim.heading) * sim.speed * dt;

          const colRadius = vType === 'car' ? 1.35 : 0.72;
          const [resolvedX, resolvedZ] = resolveCollision(
            sim.x + moveX,
            sim.z + moveZ,
            colRadius,
            city.colliders
          );
          sim.x = resolvedX;
          sim.z = resolvedZ;

          audioEngine.updateEngineSound(Math.abs(sim.speed), vType, true);
        } else {
          sim.speed = THREE.MathUtils.damp(sim.speed, 0, 4, dt);
          audioEngine.updateEngineSound(0, vType, false);
        }

        vehicleRig.root.position.set(sim.x, 0, sim.z);
        vehicleRig.root.rotation.y = sim.heading;

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
        const targetRoll =
          vType === 'car'
            ? -sim.steerAngle * Math.min(1, Math.abs(sim.speed) / 12) * 0.14
            : sim.steerAngle * Math.min(1, Math.abs(sim.speed) / 8) * 0.38;
        vehicleRig.tiltGroup.rotation.z = THREE.MathUtils.damp(
          vehicleRig.tiltGroup.rotation.z,
          targetRoll,
          8,
          dt
        );

        if (Math.abs(sim.speed) > 4.5 && phaseRef.current === 'playing') {
          particleSpawnAccum += dt;
          if (particleSpawnAccum > 0.09) {
            particleSpawnAccum = 0;
            const p = particles[nextParticle];
            nextParticle = (nextParticle + 1) % particleCount;
            p.active = true;
            p.life = 0;
            p.x = sim.x + Math.sin(sim.heading) * 1.1 + (Math.random() - 0.5) * 0.5;
            p.y = 0.18;
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

        // Update 3D Weather Particles centered around look target
        if (wType === 'clear') {
          if (weatherMesh.visible) weatherMesh.visible = false;
        } else {
          if (!weatherMesh.visible) weatherMesh.visible = true;
          if (wType === 'snow') {
            weatherMat.color.setHex(0xffffff);
            weatherMat.opacity = 0.85;
          } else if (wType === 'storm') {
            weatherMat.color.setHex(0xb8cde4);
            weatherMat.opacity = 0.68;
          } else {
            weatherMat.color.setHex(0xd0e2f2);
            weatherMat.opacity = 0.52;
          }

          for (let i = 0; i < weatherCount; i++) {
            const drop = weatherDrops[i];
            if (wType === 'snow') {
              drop.y -= 3.2 * drop.speed * dt;
              drop.ox += Math.sin(elapsed * 1.4 + drop.phase) * 1.4 * dt;
            } else if (wType === 'storm') {
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

            wDummy.position.set(_lookCurrent.x + drop.ox, drop.y, _lookCurrent.z + drop.oz);
            if (wType === 'snow') {
              wDummy.rotation.set(elapsed + drop.phase, elapsed * 0.6, 0);
              wDummy.scale.set(2.2, 0.22, 2.2);
            } else if (wType === 'storm') {
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

        if (phaseRef.current === 'title') {
          const orbitAngle = elapsed * 0.11;
          const focusX = Math.sin(orbitAngle) * 20;
          const focusZ = 2 + Math.cos(orbitAngle) * 22;
          _lookGoal.set(focusX, 2, focusZ);
          _camGoal.set(focusX + 42, 36, focusZ + 42);
          camera.zoom = THREE.MathUtils.damp(camera.zoom, 0.9, 2.5, dt);
        } else {
          _lookGoal.set(sim.x, 1.0, sim.z);
          _camGoal.set(sim.x + 38, 34, sim.z + 38);
          camera.zoom = THREE.MathUtils.damp(
            camera.zoom,
            sim.zoomFactor * presetZoom,
            5,
            dt
          );
        }

        _lookCurrent.lerp(_lookGoal, 1 - Math.exp(-5.5 * dt));
        camera.position.lerp(_camGoal, 1 - Math.exp(-5.5 * dt));
        camera.lookAt(_lookCurrent);
        camera.updateProjectionMatrix();

        sunLight.target.position.copy(_lookCurrent);
        sunLight.position.set(
          _lookCurrent.x + mood.sunPosition[0],
          mood.sunPosition[1],
          _lookCurrent.z + mood.sunPosition[2]
        );

        hudAccum += dt;
        if (hudAccum >= 0.08) {
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
            _projVec.copy(city.libraryVendor.headWorldPos).project(camera);
            if (_projVec.z < 1 && Math.abs(_projVec.x) <= 1.05 && Math.abs(_projVec.y) <= 1.05) {
              vendorBubble = {
                x: ((_projVec.x + 1) / 2) * container.clientWidth,
                y: (-(_projVec.y - 1) / 2) * container.clientHeight,
                visible: true,
                text: 'Islak mendil, lif ister misiniz? Buyurun!',
              };
            }
          }

          callbacksRef.current.onHudUpdate({
            speedKmh: Math.round(Math.abs(sim.speed) * 2.8),
            currentDistrict: loc.district,
            currentStreet: loc.street,
            nearbyLandmark: closestLm,
            nearAncientSignpost: nearSign,
            nearPlayerHome: sim.nearPlayerHome,
            nearbyStreetInteraction: streetInt,
            vendorBubble,
            distanceToActiveErrand: distToErrand,
            playerPos: [sim.x, sim.z],
            headingRad: sim.heading,
          });
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
        window.removeEventListener('keydown', onKeyDown);
        window.removeEventListener('keyup', onKeyUp);
        window.removeEventListener('blur', onWindowBlur);
        window.removeEventListener('resize', onResize);
        renderer.domElement.removeEventListener('pointermove', onPointerMove);
        renderer.domElement.removeEventListener('click', onPointerClick);
        renderer.domElement.removeEventListener('wheel', onWheel);
        renderer.domElement.removeEventListener('webglcontextlost', handleContextLost);
        renderer.domElement.removeEventListener('webglcontextrestored', handleContextRestored);

        audioEngine.updateEngineSound(0, vehicleConfigRef.current.type, false);
        vehicleRig.dispose();
        particleGeo.dispose();
        particleMat.dispose();
        weatherGeo.dispose();
        weatherMat.dispose();
        city.dispose();
        mats.dispose();
        textures.dispose();
        envRT.dispose();
        renderer.dispose();
        if (renderer.domElement.parentNode === container) {
          container.removeChild(renderer.domElement);
        }
      };
    }, []);

    return (
      <div className="relative w-full h-full">
        <div ref={mountRef} className="w-full h-full" />
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
