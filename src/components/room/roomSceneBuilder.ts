import { type MutableRefObject } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { DEFAULT_AVATAR_CONFIG } from '../../data/efelerData';
import {
  buildFurnitureVariant,
  disposeFurnitureVisualGroup,
} from '../../game/roomFurnitureBuilder';
import {
  AvatarConfig,
  CozyRoomState,
  RoomFurnitureId,
  WeatherType,
} from '../../types/game';
import {
  createAvatarRig,
  createCatRig,
  createDogRig,
  PetWanderState,
  stepPetWander,
} from './roomCharacterRigs';
import {
  detectSoftwareWebGL,
  FURNITURE_RADII,
  NearbyRoomInteractable,
  resolveFurnitureTransform,
} from './roomConstants';

export interface CozyRoomSceneParams {
  container: HTMLDivElement;
  roomStateRef: MutableRefObject<CozyRoomState>;
  weatherRef: MutableRefObject<WeatherType>;
  placementModeRef: MutableRefObject<boolean>;
  selectedFurnitureRef: MutableRefObject<RoomFurnitureId>;
  isSittingRef: MutableRefObject<boolean>;
  avatarWalkRef: MutableRefObject<{
    x: number;
    z: number;
    rotY: number;
    targetX: number | null;
    targetZ: number | null;
  }>;
  touchMoveRef: MutableRefObject<{
    up: boolean;
    down: boolean;
    left: boolean;
    right: boolean;
    joyX: number;
    joyY: number;
  }>;
  petBounceRef: MutableRefObject<{ cat: number; dog: number }>;
  teaSipRef: MutableRefObject<number>;
  triggerInteractionRef: MutableRefObject<(id: NearbyRoomInteractable['id']) => void>;
  onChangeRoomStateRef: MutableRefObject<(next: CozyRoomState) => void>;
  onSelectFurniture: (id: RoomFurnitureId) => void;
  onSetIsSitting: (sitting: boolean) => void;
  onSetNearbyInteractable: (nearby: NearbyRoomInteractable | null) => void;
  onShowToast: (msg: string) => void;
}

export function mountCozyRoomScene(params: CozyRoomSceneParams): () => void {
  const {
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
    onSelectFurniture,
    onSetIsSitting,
    onSetNearbyInteractable,
    onShowToast,
  } = params;

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

  // 8 Customizable Furniture Pieces with Live Style Variants
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
  const furnitureVisualGroups: Record<RoomFurnitureId, THREE.Group> = {
    armchair: new THREE.Group(),
    desk: new THREE.Group(),
    bookshelf: new THREE.Group(),
    rug: new THREE.Group(),
    plant: new THREE.Group(),
    turntable: new THREE.Group(),
    teatable: new THREE.Group(),
    wallart: new THREE.Group(),
  };
  (Object.keys(furnitureGroups) as RoomFurnitureId[]).forEach((fid) => {
    furnitureGroups[fid].add(furnitureVisualGroups[fid]);
  });

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

  {
    const hit = addFurnitureHitbox('armchair', 1.25, 1.15, 1.15, 0.58);
    hit.userData.roomAction = 'armchair';
    clickables.push(hit);
  }
  {
    const agendaHit = new THREE.Mesh(
      new THREE.BoxGeometry(0.75, 0.35, 0.6),
      new THREE.MeshBasicMaterial({ visible: false })
    );
    agendaHit.position.set(-0.22, 1.05, 0.08);
    agendaHit.userData.roomAction = 'agenda';
    clickables.push(agendaHit);

    const lampHit = new THREE.Mesh(
      new THREE.BoxGeometry(0.5, 0.75, 0.5),
      new THREE.MeshBasicMaterial({ visible: false })
    );
    lampHit.position.set(0.58, 1.25, -0.18);
    lampHit.userData.roomAction = 'lamp';
    clickables.push(lampHit);

    furnitureGroups.desk.add(agendaHit, lampHit);
    addFurnitureHitbox('desk', 1.9, 1.2, 1.0, 0.6);
  }
  {
    const hit = addFurnitureHitbox('bookshelf', 1.5, 2.3, 0.6, 1.15);
    hit.userData.roomAction = 'bookshelf';
    clickables.push(hit);
  }
  addFurnitureHitbox('rug', 3.4, 0.2, 2.4, 0.08);
  addFurnitureHitbox('plant', 0.9, 1.9, 0.9, 0.95);
  {
    const hit = addFurnitureHitbox('turntable', 1.0, 1.25, 0.65, 0.65);
    hit.userData.roomAction = 'turntable';
    clickables.push(hit);
  }
  {
    const hit = addFurnitureHitbox('teatable', 1.15, 0.85, 1.15, 0.42);
    hit.userData.roomAction = 'teatable';
    clickables.push(hit);
  }
  addFurnitureHitbox('wallart', 1.5, 1.1, 0.35, 0);

  const activeStyleSigs: Partial<Record<RoomFurnitureId, string>> = {};
  let vinylDisc: THREE.Object3D | undefined;
  let lampShadeMat: THREE.MeshStandardMaterial | undefined;

  const syncFurnitureStyle = (id: RoomFurnitureId, styleId: string) => {
    if (activeStyleSigs[id] === styleId) return;
    activeStyleSigs[id] = styleId;
    const vGrp = furnitureVisualGroups[id];
    disposeFurnitureVisualGroup(vGrp);
    const built = buildFurnitureVariant(id, styleId);
    vGrp.add(built.group);
    if (id === 'turntable') {
      vinylDisc = built.spinPart;
    }
    if (id === 'desk' && built.lampShadeMat) {
      lampShadeMat = built.lampShadeMat;
    }
  };

  for (const item of roomStateRef.current.furniture) {
    syncFurnitureStyle(item.id, item.styleId || 'classic');
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
  catRig.group.position.set(-0.9, 0.005, 1.35);
  roomGroup.add(catRig.group);
  clickables.push(catRig.hitMesh);

  const dogRig = createDogRig();
  dogRig.group.position.set(1.15, 0.005, 1.0);
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
    onChangeRoomStateRef.current({ ...st, furniture: nextFurniture });
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
      onSelectFurniture(fId);
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

    const hits = raycaster
      .intersectObjects(clickables, false)
      .filter((h) => isHierarchyVisible(h.object));
    if (hits.length > 0) {
      const action = hits[0].object.userData.roomAction as string;
      const st = roomStateRef.current;
      if (action === 'agenda') {
        triggerInteractionRef.current('desk');
      } else if (action === 'lamp') {
        onChangeRoomStateRef.current({ ...st, lampOn: !st.lampOn });
        onShowToast(st.lampOn ? 'Masa lambası kapatıldı.' : 'Masa lambası açıldı.');
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

    if (roomStateRef.current.avatarPlaced ?? true) {
      const floorHits = raycaster.intersectObject(floorHitPlane, false);
      if (floorHits.length > 0) {
        if (isSittingRef.current) onSetIsSitting(false);
        avatarWalkRef.current.targetX = THREE.MathUtils.clamp(floorHits[0].point.x, -3.35, 3.35);
        avatarWalkRef.current.targetZ = THREE.MathUtils.clamp(floorHits[0].point.z, -3.35, 3.35);
      }
    }
  };

  const nearbyInteractableRef = { current: null as NearbyRoomInteractable | null };

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
      onChangeRoomStateRef.current({
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
    touchMoveRef.current = { up: false, down: false, left: false, right: false, joyX: 0, joyY: 0 };
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

  let lastNearbyId: string | null = null;
  let lastAvatarSig = '';

  const catState: PetWanderState = { x: -0.9, z: 1.35, targetX: -0.9, targetZ: 1.35, rotY: 0.4, wait: 0.9 };
  const dogState: PetWanderState = { x: 1.15, z: 1.0, targetX: 1.15, targetZ: 1.0, rotY: -0.5, wait: 1.3 };

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

    wallMat.color.set(st.wallColor);
    floorMat.color.setHex(
      st.floorTone === 'oak' ? 0xa67a50 : st.floorTone === 'pine' ? 0xc8a374 : 0x8f8a82
    );

    lampPoint.intensity = THREE.MathUtils.damp(lampPoint.intensity, st.lampOn ? 4.8 : 0, 6, dt);
    if (lampShadeMat) {
      lampShadeMat.emissiveIntensity = st.lampOn ? 1.15 : 0.08;
    }

    for (const item of st.furniture) {
      syncFurnitureStyle(item.id, item.styleId || 'classic');
      const grp = furnitureGroups[item.id];
      grp.visible = item.enabled;
      const tf = resolveFurnitureTransform(item.id, item);
      grp.position.set(tf.x, tf.y, tf.z);
      grp.rotation.y = tf.rotY;
      if (item.id === 'desk') {
        lampPoint.position.set(tf.x + 0.5, 1.9, tf.z);
      }
    }

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
      let walkMag = 1;
      if (!placementModeRef.current) {
        const up = heldKeys.has('KeyW') || heldKeys.has('ArrowUp') || touchMoveRef.current.up;
        const down =
          heldKeys.has('KeyS') || heldKeys.has('ArrowDown') || touchMoveRef.current.down;
        const left =
          heldKeys.has('KeyA') || heldKeys.has('ArrowLeft') || touchMoveRef.current.left;
        const right =
          heldKeys.has('KeyD') || heldKeys.has('ArrowRight') || touchMoveRef.current.right;

        const fwdAmt = THREE.MathUtils.clamp(
          (up ? 1 : 0) - (down ? 1 : 0) + touchMoveRef.current.joyY,
          -1,
          1
        );
        const rightAmt = THREE.MathUtils.clamp(
          (right ? 1 : 0) - (left ? 1 : 0) + touchMoveRef.current.joyX,
          -1,
          1
        );

        moveX = -fwdAmt + rightAmt;
        moveZ = -fwdAmt - rightAmt;
        walkMag = Math.min(1, Math.hypot(fwdAmt, rightAmt));
      }

      let isMoving = false;
      const rawLen = Math.hypot(moveX, moveZ);
      if (rawLen > 0.05) {
        if (isSittingRef.current) onSetIsSitting(false);
        av.targetX = null;
        av.targetZ = null;
        moveX /= rawLen;
        moveZ /= rawLen;
        isMoving = true;
      } else {
        moveX = 0;
        moveZ = 0;
        if (av.targetX !== null && av.targetZ !== null && !isSittingRef.current) {
          const dx = av.targetX - av.x;
          const dz = av.targetZ - av.z;
          const dist = Math.hypot(dx, dz);
          if (dist < 0.14) {
            av.targetX = null;
            av.targetZ = null;
          } else {
            moveX = dx / dist;
            moveZ = dz / dist;
            walkMag = 1;
            isMoving = true;
          }
        }
      }

      if (isMoving) {
        const walkSpeed = 2.45 * Math.max(0.3, walkMag);
        let nx = THREE.MathUtils.clamp(av.x + moveX * walkSpeed * dt, -3.35, 3.35);
        let nz = THREE.MathUtils.clamp(av.z + moveZ * walkSpeed * dt, -3.35, 3.35);

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
        onSetNearbyInteractable(closest);
      }
    } else {
      walkMarker.visible = false;
      if (lastNearbyId !== null) {
        lastNearbyId = null;
        onSetNearbyInteractable(null);
      }
    }

    if (vinylDisc) {
      vinylDisc.rotation.y += dt * 1.4;
    }

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

    catRig.group.visible = st.petType === 'cat' || st.petType === 'both';
    dogRig.group.visible = st.petType === 'dog' || st.petType === 'both';

    if (catRig.group.visible) {
      petBounceRef.current.cat = Math.max(0, petBounceRef.current.cat - dt * 2.2);
      const hop = Math.sin(petBounceRef.current.cat * Math.PI) * 0.42;
      const catMoving = stepPetWander(
        catState,
        dogRig.group.visible ? dogState : null,
        st,
        0.34,
        0.62,
        dt,
        avatarWalkRef.current
      );
      const stepBob = catMoving ? Math.abs(Math.sin(elapsed * 7.5)) * 0.028 : 0;
      catRig.group.position.set(catState.x, 0.005 + hop + stepBob, catState.z);
      catRig.group.rotation.y = catState.rotY;
      catRig.tail.rotation.z = Math.sin(elapsed * (catMoving ? 5.2 : 2.8)) * 0.32;
    }

    if (dogRig.group.visible) {
      petBounceRef.current.dog = Math.max(0, petBounceRef.current.dog - dt * 2.2);
      const hop = Math.sin(petBounceRef.current.dog * Math.PI) * 0.48;
      const dogMoving = stepPetWander(
        dogState,
        catRig.group.visible ? catState : null,
        st,
        0.38,
        0.74,
        dt,
        avatarWalkRef.current
      );
      const stepBob = dogMoving ? Math.abs(Math.sin(elapsed * 8.5)) * 0.035 : 0;
      dogRig.group.position.set(dogState.x, 0.005 + hop + stepBob, dogState.z);
      dogRig.group.rotation.y = dogState.rotY;
      dogRig.tail.rotation.z = Math.sin(elapsed * (dogMoving ? 9.5 : 6.2)) * 0.42;
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

    (Object.keys(furnitureVisualGroups) as RoomFurnitureId[]).forEach((fid) => {
      disposeFurnitureVisualGroup(furnitureVisualGroups[fid]);
    });
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
}
