import * as THREE from 'three';
import { ColliderBox, StreetInteractionType } from '../types/game';
import { CityMaterialLibrary } from './materials';
import { mergeStaticGroupMeshes } from './meshMerge';
import { createSculptedHumanRig, SculptedHumanRig } from './sculptedHumans';
import { SPARROW_PALETTE } from './sculptor';
import { getTerrainHeightAt, getWalkableSurfaceHeightAt } from './terrain';

interface EfeDancerRig {
  pivot: THREE.Group;
  rig: SculptedHumanRig;
  baseAngle: number;
}

export interface StreetMusiciansRig {
  group: THREE.Group;
  clickTarget: THREE.Mesh;
  center: [number, number];
  isDancing: () => boolean;
  triggerZeybek: () => void;
  update: (dt: number, elapsed: number, focusX?: number, focusZ?: number) => void;
}

export interface LibraryVendorRig {
  group: THREE.Group;
  clickTarget: THREE.Mesh;
  vendorPos: [number, number];
  headWorldPos: THREE.Vector3;
  isBubbleVisible: () => boolean;
  triggerBubble: () => void;
  update: (dt: number, elapsed: number, focusX?: number, focusZ?: number) => void;
}

export interface LokmaStandRig {
  group: THREE.Group;
  clickTarget: THREE.Mesh;
  pos: [number, number];
  triggerServeEffect: () => void;
  update: (dt: number, elapsed: number, focusX?: number, focusZ?: number) => void;
}

export interface ParkGuitarYouthRig {
  group: THREE.Group;
  clickTarget: THREE.Mesh;
  center: [number, number];
  isPlaying: () => boolean;
  triggerJam: () => void;
  update: (dt: number, elapsed: number, focusX?: number, focusZ?: number) => void;
}

const EFE_SKINS = [0xe2b48d, 0xd8a37b, 0xebc09c, 0xd59f76, 0xe6b994, 0xdeb089];
const EFE_HAIRS = [0x2a1e17, 0x3b281e, 0x1f1916, 0x4b3324, 0x2f231b, 0x3d2e24];

function createEfeDancer(idx = 0): EfeDancerRig {
  const pivot = new THREE.Group();
  const rig = createSculptedHumanRig(
    {
      skinHex: EFE_SKINS[idx % EFE_SKINS.length],
      shirtHex: 0x202b3d,
      sleeveHex: 0xf4eee3,
      pantsHex: 0x202b3d,
      sashHex: 0x9e2b2b,
      goldTrim: true,
      hairHex: EFE_HAIRS[idx % EFE_HAIRS.length],
      scarfHex: 0x202b3d,
      hatHex: 0x9e2b2b,
      hairStyle: 'short',
      hatStyle: 'fes',
      facialHair: 'mustache',
    },
    { forwardIsNegZ: false, castShadow: 'full' }
  );
  pivot.add(rig.root);
  return { pivot, rig, baseAngle: 0 };
}

function makeClickProxy(
  radius: number,
  height: number,
  type: StreetInteractionType
): THREE.Mesh {
  const mat = new THREE.MeshBasicMaterial({ visible: false });
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, height, 12), mat);
  mesh.position.y = height / 2;
  mesh.userData.interactionType = type;
  return mesh;
}

/**
 * 1. Interactive Street Musicians & Zeybek Efeler Circle (Kent Meydanı Promenade)
 */
export function createStreetMusiciansZeybek(
  mats: CityMaterialLibrary
): StreetMusiciansRig {
  const group = new THREE.Group();
  const cx = -8.2;
  const cz = 18.6;
  const plazaY = getWalkableSurfaceHeightAt(cx, cz);
  group.position.set(cx, plazaY, cz);

  // Woven Kilim Rug on Plaza Stone
  const rugMat = new THREE.MeshStandardMaterial({ color: 0x993e2f, roughness: 0.88 });
  const rug = new THREE.Mesh(new THREE.BoxGeometry(3.4, 0.04, 2.6), rugMat);
  rug.position.y = 0.02;
  rug.receiveShadow = true;
  group.add(rug);

  const rugInnerMat = new THREE.MeshStandardMaterial({ color: 0xd99b43, roughness: 0.85 });
  const rugInner = new THREE.Mesh(new THREE.BoxGeometry(2.5, 0.05, 1.8), rugInnerMat);
  rugInner.position.y = 0.025;
  group.add(rugInner);

  // Musician 1: Davulcu & Musician 2: Zurna Player in Sparrow Sim sculpted style
  const musicianBaseY = 0.045;
  const buildMusician = (x: number, z: number, coatHex: number, isDrummer: boolean) => {
    const m = new THREE.Group();
    m.position.set(x, musicianBaseY, z);

    const rig = createSculptedHumanRig(
      {
        skinHex: isDrummer ? 0xdca880 : 0xe6ba95,
        shirtHex: coatHex,
        pantsHex: 0x2e3b46,
        hairHex: isDrummer ? 0x3b281e : 0x564e48,
        scarfHex: SPARROW_PALETTE.wallCreamTrim,
        hatHex: isDrummer ? 0x3b4552 : 0x4f3e32,
        hairStyle: 'short',
        hatStyle: 'newsboy',
        facialHair: 'mustache',
      },
      { forwardIsNegZ: false, castShadow: 'full' }
    );
    m.add(rig.root);

    if (isDrummer) {
      const drum = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.28, 0.36, 12), mats.creamPlaster);
      drum.rotation.z = Math.PI / 2;
      drum.position.set(0, 0.88, 0.3);
      m.add(drum);
      const drumRim = new THREE.Mesh(
        new THREE.CylinderGeometry(0.295, 0.295, 0.08, 12),
        mats.darkTimber
      );
      drumRim.rotation.z = Math.PI / 2;
      drumRim.position.set(0, 0.88, 0.3);
      m.add(drumRim);
    } else {
      const zurna = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.055, 0.55, 8), mats.brass);
      zurna.rotation.x = Math.PI * 0.36;
      zurna.position.set(0, 1.16, 0.28);
      m.add(zurna);
    }

    return { group: m, rig };
  };

  const drummer = buildMusician(-0.65, 0, 0x3b526b, true);
  const zurnaPlayer = buildMusician(0.65, 0.15, 0x6b4536, false);
  group.add(drummer.group, zurnaPlayer.group);

  // Subtle glowing stage ring around musicians
  const stageRingGeo = new THREE.RingGeometry(2.1, 2.35, 32);
  stageRingGeo.rotateX(-Math.PI / 2);
  const stageRingMat = new THREE.MeshStandardMaterial({
    color: 0xe3a84f,
    emissive: new THREE.Color(0xe3a84f),
    emissiveIntensity: 0.35,
    side: THREE.DoubleSide,
  });
  const stageRing = new THREE.Mesh(stageRingGeo, stageRingMat);
  stageRing.position.y = 0.04;
  group.add(stageRing);

  // 6 Efeler Dancers circling around the musicians
  const dancers: EfeDancerRig[] = [];
  const dancerCount = 6;
  for (let i = 0; i < dancerCount; i++) {
    const efe = createEfeDancer(i);
    const ang = (i * Math.PI * 2) / dancerCount;
    efe.baseAngle = ang;
    efe.pivot.position.set(Math.cos(ang) * 3.1, 0, Math.sin(ang) * 3.1);
    efe.pivot.rotation.y = -ang + Math.PI / 2;
    group.add(efe.pivot);
    dancers.push(efe);
  }

  // Visual Festival Sparkles (Golden celebration bursts during Zeybek)
  const sparkCount = 24;
  const sparkGeo = new THREE.OctahedronGeometry(0.14, 0);
  const sparkMat = new THREE.MeshStandardMaterial({
    color: 0xffd166,
    emissive: new THREE.Color(0xffb830),
    emissiveIntensity: 1.2,
    roughness: 0.2,
  });
  const sparkInst = new THREE.InstancedMesh(sparkGeo, sparkMat, sparkCount);
  sparkInst.frustumCulled = false;
  group.add(sparkInst);
  const sparkDummy = new THREE.Object3D();

  const clickTarget = makeClickProxy(2.8, 2.4, 'musicians');
  group.add(clickTarget);

  let danceTimer = 0;
  let circleRotation = 0;
  let sparkHidden = false;
  let poseInitialized = false;
  let settleTimer = 1.2;

  return {
    group,
    clickTarget,
    center: [cx, cz],
    isDancing: () => danceTimer > 0,
    triggerZeybek: () => {
      danceTimer = 11.5;
      settleTimer = 1.2;
    },
    update: (dt: number, elapsed: number, focusX?: number, focusZ?: number) => {
      if (danceTimer > 0) {
        if (!group.visible) group.visible = true;
        danceTimer = Math.max(0, danceTimer - dt);
        if (sparkHidden) {
          sparkInst.visible = true;
          sparkHidden = false;
        }
        settleTimer = 1.2;
        poseInitialized = true;
        circleRotation += dt * 0.42;
        stageRingMat.emissiveIntensity = 1.2 + Math.sin(elapsed * 8) * 0.4;

        // Musicians play energetically with the 9/8 beat
        drummer.group.position.y = musicianBaseY + Math.abs(Math.sin(elapsed * 7)) * 0.08;
        zurnaPlayer.group.rotation.z = Math.sin(elapsed * 4.5) * 0.08;
        drummer.rig.updateWalk(0, dt, elapsed, true);
        zurnaPlayer.rig.updateWalk(0, dt, elapsed, true);

        // Efeler perform expressive 9/8 Zeybek choreography (kneeling dips & curved wing arms)
        const danceTime = 11.5 - danceTimer;
        dancers.forEach((efe, idx) => {
          const ang = efe.baseAngle + circleRotation;
          const rad = 3.2 + Math.sin(elapsed * 2 + idx) * 0.15;
          efe.pivot.position.set(Math.cos(ang) * rad, 0, Math.sin(ang) * rad);
          efe.pivot.rotation.y = -ang;
          efe.rig.updateZeybek(dt, elapsed, danceTime, idx * 0.42);
        });

        // Festival golden sparkles swirling up
        for (let i = 0; i < sparkCount; i++) {
          const t = (elapsed * 0.9 + i / sparkCount) % 1;
          const ang = i * 1.3 + elapsed * 1.8;
          const rad = 1.6 + Math.sin(t * Math.PI) * 2.4;
          sparkDummy.position.set(Math.cos(ang) * rad, 0.6 + t * 4.2, Math.sin(ang) * rad);
          sparkDummy.rotation.set(elapsed * 2, elapsed * 3, 0);
          sparkDummy.scale.setScalar(Math.sin(t * Math.PI) * 1.15);
          sparkDummy.updateMatrix();
          sparkInst.setMatrixAt(i, sparkDummy.matrix);
        }
        sparkInst.instanceMatrix.needsUpdate = true;
      } else {
        if (!sparkHidden) {
          sparkInst.visible = false;
          sparkHidden = true;
        }
        if (poseInitialized && settleTimer <= 0 && focusX !== undefined && focusZ !== undefined) {
          const dx = focusX - cx;
          const dz = focusZ - cz;
          if (dx * dx + dz * dz > 5625) {
            if (group.visible) group.visible = false;
            return;
          }
        }
        if (!group.visible) group.visible = true;
        settleTimer = Math.max(0, settleTimer - dt);
        poseInitialized = true;

        stageRingMat.emissiveIntensity = 0.28 + Math.sin(elapsed * 2) * 0.08;
        drummer.group.position.y = musicianBaseY;
        zurnaPlayer.group.rotation.z = 0;
        drummer.rig.updateWalk(0, dt, elapsed, true);
        zurnaPlayer.rig.updateWalk(0, dt, elapsed, true);

        dancers.forEach((efe, idx) => {
          const ang = efe.baseAngle;
          efe.pivot.position.set(Math.cos(ang) * 3.0, 0, Math.sin(ang) * 3.0);
          efe.pivot.rotation.y = -ang + Math.PI / 2;
          efe.rig.updateWalk(0, dt, elapsed + idx * 0.5, false);
        });
      }
    },
  };
}

/**
 * 2. Aydın İl Halk Kütüphanesi & Mendil/Lif Satıcısı (Across from Kent Meydanı)
 */
export function createLibraryAndVendor(
  mats: CityMaterialLibrary,
  colliders: ColliderBox[]
): LibraryVendorRig {
  const group = new THREE.Group();

  // A. Library Building at [-38.0, y, 26.5] facing East toward Kent Meydanı & Menderes Blv.
  const libX = -38.0;
  const libZ = 26.5;
  const lib = new THREE.Group();
  lib.position.set(libX, getTerrainHeightAt(libX, libZ), libZ);

  const podium = new THREE.Mesh(new THREE.BoxGeometry(9.2, 0.4, 11.4), mats.travertine);
  podium.position.y = 0.2;
  podium.receiveShadow = true;
  lib.add(podium);

  const mainHall = new THREE.Mesh(new THREE.BoxGeometry(7.6, 5.2, 9.8), mats.creamPlaster);
  mainHall.position.set(-0.3, 3.0, 0);
  mainHall.castShadow = true;
  mainHall.receiveShadow = true;
  lib.add(mainHall);

  const roof = new THREE.Mesh(new THREE.BoxGeometry(8.2, 1.1, 10.4), mats.terracottaRoof);
  roof.position.set(-0.3, 6.1, 0);
  roof.castShadow = true;
  lib.add(roof);

  // Reading Room Tall Windows facing Sevgi Yolu & Kent Meydanı (+X)
  [-3.2, -1.6, 1.6, 3.2].forEach((wz) => {
    const win = new THREE.Mesh(new THREE.BoxGeometry(0.15, 2.2, 1.0), mats.windowLit);
    win.position.set(3.52, 2.8, wz);
    lib.add(win);
  });

  // Entrance Pediment & Sign Plaque
  const door = new THREE.Mesh(new THREE.BoxGeometry(0.2, 2.4, 1.8), mats.darkTimber);
  door.position.set(3.52, 1.6, 0);
  lib.add(door);

  const signPlate = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.65, 3.6), mats.brass);
  signPlate.position.set(3.56, 4.7, 0);
  lib.add(signPlate);

  mergeStaticGroupMeshes(lib);
  group.add(lib);
  colliders.push({
    minX: libX - 4.6,
    maxX: libX + 4.6,
    minZ: libZ - 5.7,
    maxZ: libZ + 5.7,
  });

  // B. Mendil & Lif Satıcısı (on Menderes sidewalk at [-25.5, y, 24.5], facing Kent Meydanı)
  const vx = -25.5;
  const vz = 24.5;
  const vy = getWalkableSurfaceHeightAt(vx, vz);
  const vendor = new THREE.Group();
  vendor.position.set(vx, vy, vz);
  vendor.rotation.y = Math.PI / 2; // Facing East toward Kent Meydanı

  const vendorRig = createSculptedHumanRig(
    {
      skinHex: 0xe8bc98,
      shirtHex: 0x4b6a7a,
      pantsHex: 0x2e3b46,
      hairHex: 0x6b5c53,
      scarfHex: SPARROW_PALETTE.wallCreamTrim,
      hatHex: 0xf4eee3,
      hairStyle: 'bun',
      hatStyle: 'headscarf',
      apron: true,
    },
    { forwardIsNegZ: false, castShadow: 'full' }
  );
  vendor.add(vendorRig.root);

  // Wooden Portable Display Tray with Colorful Lif & White Mendil Packs
  const tray = new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.12, 0.56), mats.darkTimber);
  tray.position.set(0, 0.76, 0.48);
  vendor.add(tray);

  const legL = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.75, 6), mats.darkTimber);
  legL.position.set(-0.36, 0.37, 0.58);
  const legR = legL.clone();
  legR.position.x = 0.36;
  vendor.add(legL, legR);

  // White Wet-Wipe Packs (Islak Mendil)
  const packMat = new THREE.MeshStandardMaterial({ color: 0xf4f4f0, roughness: 0.5 });
  for (let i = 0; i < 3; i++) {
    const pack = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.08, 0.14), packMat);
    pack.position.set(-0.24 + i * 0.18, 0.86, 0.42);
    vendor.add(pack);
  }

  // Colorful Knitted Bath Puffs (Lif)
  const lifColors = [0xd96b86, 0x5aa8b0, 0xe8b954];
  lifColors.forEach((c, i) => {
    const lif = new THREE.Mesh(
      new THREE.TorusGeometry(0.08, 0.035, 6, 12),
      new THREE.MeshStandardMaterial({ color: c, roughness: 0.85 })
    );
    lif.rotation.x = Math.PI / 2;
    lif.position.set(-0.22 + i * 0.22, 0.86, 0.6);
    vendor.add(lif);
  });

  const clickTarget = makeClickProxy(1.1, 1.8, 'vendor');
  vendor.add(clickTarget);
  group.add(vendor);

  colliders.push({
    minX: vx - 0.8,
    maxX: vx + 0.8,
    minZ: vz - 0.8,
    maxZ: vz + 0.8,
  });

  // Auto-callout cycle: first greeting at 6s, then every ~48s for 7.5s
  let bubbleTimer = 6.5;
  let cycleTimer = 8.0;

  return {
    group,
    clickTarget,
    vendorPos: [vx, vz],
    headWorldPos: new THREE.Vector3(vx, vy + 1.75, vz),
    isBubbleVisible: () => bubbleTimer > 0,
    triggerBubble: () => {
      bubbleTimer = 7.5;
      cycleTimer = 48.0;
    },
    update: (dt: number, elapsed: number, focusX?: number, focusZ?: number) => {
      if (focusX !== undefined && focusZ !== undefined) {
        const dx = focusX - vx;
        const dz = focusZ - vz;
        const visible = dx * dx + dz * dz <= 5625;
        if (vendor.visible !== visible) vendor.visible = visible;
        if (!visible) return;
      }

      // Gentle vendor greeting & waving when calling out
      vendorRig.updateWave(bubbleTimer > 0, dt, elapsed, 1.2);

      if (bubbleTimer > 0) {
        bubbleTimer = Math.max(0, bubbleTimer - dt);
      } else {
        cycleTimer -= dt;
        if (cycleTimer <= 0) {
          bubbleTimer = 7.5;
          cycleTimer = 48.0;
        }
      }
    },
  };
}

/**
 * 3. Bey Camii Önü Hayır Lokması Standı (Grants +1 Lokma Gücü)
 */
export function createBeyCamiiLokmaStand(
  mats: CityMaterialLibrary,
  colliders: ColliderBox[]
): LokmaStandRig {
  const group = new THREE.Group();
  const lx = -29.2;
  const lz = 5.2;
  const ly = getWalkableSurfaceHeightAt(lx, lz);
  group.position.set(lx, ly, lz);

  const lokmaStaticGroup = new THREE.Group();
  group.add(lokmaStaticGroup);

  // Stone Serving Counter Base
  const counter = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.92, 1.35), mats.travertine);
  counter.position.y = 0.46;
  counter.castShadow = true;
  counter.receiveShadow = true;
  lokmaStaticGroup.add(counter);

  const counterTop = new THREE.Mesh(new THREE.BoxGeometry(3.35, 0.1, 1.5), mats.darkTimber);
  counterTop.position.y = 0.96;
  lokmaStaticGroup.add(counterTop);

  // Copper Cauldron (Bakır Kazan) & Glowing Embers
  const copperMat = new THREE.MeshStandardMaterial({
    color: 0xb86538,
    roughness: 0.28,
    metalness: 0.8,
  });
  const cauldron = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.45, 0.52, 16), copperMat);
  cauldron.position.set(-0.75, 1.18, 0);
  lokmaStaticGroup.add(cauldron);

  // Golden Sizzling Lokma Rings inside Cauldron
  const lokmaMat = new THREE.MeshStandardMaterial({ color: 0xe6a135, roughness: 0.45 });
  for (let i = 0; i < 6; i++) {
    const ang = (i * Math.PI * 2) / 6;
    const lok = new THREE.Mesh(new THREE.TorusGeometry(0.08, 0.035, 6, 10), lokmaMat);
    lok.rotation.x = Math.PI / 2;
    lok.position.set(-0.75 + Math.cos(ang) * 0.24, 1.44, Math.sin(ang) * 0.24);
    lokmaStaticGroup.add(lok);
  }

  // Stack of Paper Serving Plates & Syrup Bowl
  const plateMat = new THREE.MeshStandardMaterial({ color: 0xf6f3eb, roughness: 0.65 });
  const plates = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.22, 0.22, 12), plateMat);
  plates.position.set(0.55, 1.12, 0.15);
  lokmaStaticGroup.add(plates);

  const syrupBowl = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.16, 0.2, 12), mats.brass);
  syrupBowl.position.set(1.05, 1.1, -0.15);
  lokmaStaticGroup.add(syrupBowl);

  mergeStaticGroupMeshes(lokmaStaticGroup);

  // Friendly Attendant pouring Lokma (Sparrow Sim sculpted chef figure)
  const attendantRig = createSculptedHumanRig(
    {
      skinHex: 0xe1b28b,
      shirtHex: 0xf0ece1,
      pantsHex: 0x3b4856,
      hairHex: 0x3b281e,
      scarfHex: SPARROW_PALETTE.coatRose,
      hatHex: 0xf7f3ea,
      hairStyle: 'short',
      hatStyle: 'chef_toque',
      facialHair: 'mustache',
      apron: true,
    },
    { forwardIsNegZ: false, castShadow: 'full' }
  );
  attendantRig.root.position.set(-0.2, getWalkableSurfaceHeightAt(lx - 0.2, lz - 1.0) - ly, -1.0);
  group.add(attendantRig.root);

  // Subtle Warm Steam Puffs over Cauldron
  const steamGeo = new THREE.SphereGeometry(0.16, 6, 6);
  const steamMat = new THREE.MeshBasicMaterial({
    color: 0xf7f2e8,
    transparent: true,
    opacity: 0.42,
  });
  const steamPuffs: THREE.Mesh[] = [];
  for (let i = 0; i < 5; i++) {
    const puff = new THREE.Mesh(steamGeo, steamMat);
    puff.position.set(-0.75, 1.6 + i * 0.25, 0);
    group.add(puff);
    steamPuffs.push(puff);
  }

  // Interactive Amber Ground Ring
  const ringGeo = new THREE.RingGeometry(1.4, 1.75, 28);
  ringGeo.rotateX(-Math.PI / 2);
  const ringMat = new THREE.MeshStandardMaterial({
    color: 0xe6a135,
    emissive: new THREE.Color(0xe6a135),
    emissiveIntensity: 0.6,
    side: THREE.DoubleSide,
    polygonOffset: true,
    polygonOffsetFactor: -3,
  });
  const ring = new THREE.Mesh(ringGeo, ringMat);
  ring.position.set(0, Math.max(0.06, getWalkableSurfaceHeightAt(lx, lz + 1.75) - ly + 0.08), 1.75);
  group.add(ring);

  const clickTarget = makeClickProxy(1.8, 2.0, 'lokma');
  group.add(clickTarget);

  colliders.push({
    minX: lx - 1.75,
    maxX: lx + 1.75,
    minZ: lz - 1.2,
    maxZ: lz + 0.85,
  });

  let servePopTimer = 0;
  let poseInitialized = false;

  return {
    group,
    clickTarget,
    pos: [lx, lz],
    triggerServeEffect: () => {
      servePopTimer = 1.4;
    },
    update: (dt: number, elapsed: number, focusX?: number, focusZ?: number) => {
      if (servePopTimer <= 0 && poseInitialized && focusX !== undefined && focusZ !== undefined) {
        const dx = focusX - lx;
        const dz = focusZ - lz;
        if (dx * dx + dz * dz > 5625) {
          if (group.visible) group.visible = false;
          return;
        }
      }
      if (!group.visible) group.visible = true;
      poseInitialized = true;

      steamPuffs.forEach((puff, i) => {
        const t = (elapsed * 0.55 + i * 0.2) % 1;
        puff.position.y = 1.55 + t * 1.45;
        puff.position.x = -0.75 + Math.sin(elapsed * 2 + i) * 0.14;
        puff.scale.setScalar(0.55 + Math.sin(t * Math.PI) * 0.75);
      });

      attendantRig.updateWave(servePopTimer > 0, dt, elapsed, 2.5);

      if (servePopTimer > 0) {
        servePopTimer = Math.max(0, servePopTimer - dt);
        ringMat.emissiveIntensity = 1.5;
        ring.scale.setScalar(1.25);
      } else {
        ringMat.emissiveIntensity = 0.55 + Math.sin(elapsed * 2.5) * 0.15;
        ring.scale.setScalar(1.0 + Math.sin(elapsed * 2.5) * 0.05);
      }
    },
  };
}

const GUITAR_ROSETTE_MAT = new THREE.MeshStandardMaterial({ color: 0xc88b48, roughness: 0.5 });
const GUITAR_SOUNDHOLE_MAT = new THREE.MeshStandardMaterial({ color: 0x1a120d, roughness: 0.9 });
const GUITAR_BRIDGE_MAT = new THREE.MeshStandardMaterial({ color: 0x2c1b12, roughness: 0.5 });
const GUITAR_NECK_MAT = new THREE.MeshStandardMaterial({ color: 0x3a2417, roughness: 0.52 });
const GUITAR_METAL_MAT = new THREE.MeshStandardMaterial({
  color: 0xd9dde2,
  roughness: 0.25,
  metalness: 0.75,
});

function createAcousticGuitarMesh(spruceHex: number, rimHex: number): THREE.Group {
  const g = new THREE.Group();

  // Figure-8 dreadnought acoustic guitar body silhouette
  const bodyShape = new THREE.Shape();
  bodyShape.moveTo(0, -0.24);
  bodyShape.bezierCurveTo(0.18, -0.24, 0.21, -0.06, 0.12, 0.02);
  bodyShape.bezierCurveTo(0.08, 0.06, 0.15, 0.13, 0.13, 0.21);
  bodyShape.bezierCurveTo(0.11, 0.27, -0.11, 0.27, -0.13, 0.21);
  bodyShape.bezierCurveTo(-0.15, 0.13, -0.08, 0.06, -0.12, 0.02);
  bodyShape.bezierCurveTo(-0.21, -0.06, -0.18, -0.24, 0, -0.24);

  const sideGeo = new THREE.ExtrudeGeometry(bodyShape, {
    depth: 0.095,
    bevelEnabled: true,
    bevelThickness: 0.012,
    bevelSize: 0.01,
    bevelSegments: 2,
  });
  sideGeo.translate(0, 0, -0.0475);
  const rimMat = new THREE.MeshStandardMaterial({ color: rimHex, roughness: 0.42 });
  const bodySide = new THREE.Mesh(sideGeo, rimMat);
  g.add(bodySide);

  const topGeo = new THREE.ShapeGeometry(bodyShape, 12);
  const spruceMat = new THREE.MeshStandardMaterial({ color: spruceHex, roughness: 0.36 });
  const topFace = new THREE.Mesh(topGeo, spruceMat);
  topFace.position.z = 0.061;
  g.add(topFace);

  // Dark soundhole & warm wooden rosette
  const rosette = new THREE.Mesh(new THREE.RingGeometry(0.046, 0.058, 18), GUITAR_ROSETTE_MAT);
  rosette.position.set(0, 0.04, 0.063);
  const soundhole = new THREE.Mesh(new THREE.CircleGeometry(0.045, 16), GUITAR_SOUNDHOLE_MAT);
  soundhole.position.set(0, 0.04, 0.064);
  const bridge = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.028, 0.014), GUITAR_BRIDGE_MAT);
  bridge.position.set(0, -0.11, 0.066);
  g.add(rosette, soundhole, bridge);

  // Fretboard Neck & Slotted Headstock
  const neck = new THREE.Mesh(new THREE.BoxGeometry(0.044, 0.44, 0.022), GUITAR_NECK_MAT);
  neck.position.set(0, 0.44, 0.045);
  const headstock = new THREE.Mesh(new THREE.BoxGeometry(0.068, 0.12, 0.022), rimMat);
  headstock.position.set(0, 0.7, 0.04);
  headstock.rotation.x = 0.14;
  g.add(neck, headstock);

  // Silver tuning pegs + subtle 4 visible strings
  [-0.042, 0.042].forEach((px) => {
    [-0.025, 0.025].forEach((py) => {
      const peg = new THREE.Mesh(
        new THREE.CylinderGeometry(0.008, 0.008, 0.024, 6),
        GUITAR_METAL_MAT
      );
      peg.rotation.z = Math.PI / 2;
      peg.position.set(px, 0.7 + py, 0.04);
      g.add(peg);
    });
  });
  [-0.012, -0.004, 0.004, 0.012].forEach((sx) => {
    const str = new THREE.Mesh(new THREE.BoxGeometry(0.0025, 0.72, 0.002), GUITAR_METAL_MAT);
    str.position.set(sx, 0.26, 0.067);
    g.add(str);
  });

  return g;
}

/**
 * 4. Nevzat Biçer Parkı Çimlerinde Akustik Gitar Çalan Gençler Grubu
 */
export function createParkGuitarYouthGroup(
  mats: CityMaterialLibrary,
  colliders: ColliderBox[]
): ParkGuitarYouthRig {
  const group = new THREE.Group();
  const cx = -126.4;
  const cz = 18.4;
  const baseY = getWalkableSurfaceHeightAt(cx, cz);
  group.position.set(cx, baseY, cz);

  const parkStaticGroup = new THREE.Group();
  group.add(parkStaticGroup);

  // Cozy bohemian picnic kilim + wooden log cushions on park lawn
  const rugMat = new THREE.MeshStandardMaterial({ color: 0xa64935, roughness: 0.9 });
  const rug = new THREE.Mesh(new THREE.BoxGeometry(3.5, 0.04, 2.8), rugMat);
  rug.position.y = 0.025;
  rug.receiveShadow = true;
  const rugPatternMat = new THREE.MeshStandardMaterial({ color: 0xe3b15b, roughness: 0.88 });
  const rugInner = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.05, 1.9), rugPatternMat);
  rugInner.position.y = 0.028;
  parkStaticGroup.add(rug, rugInner);

  // Wooden seat log & cajon box drum
  const seatLog = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.26, 1.55, 10), mats.darkTimber);
  seatLog.rotation.z = Math.PI / 2;
  seatLog.rotation.y = 0.28;
  seatLog.position.set(-0.92, 0.22, 0.46);
  parkStaticGroup.add(seatLog);

  const cajonMat = new THREE.MeshStandardMaterial({ color: 0xc98b4d, roughness: 0.65 });
  const cajon = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.56, 0.42), cajonMat);
  cajon.position.set(-0.02, 0.3, -0.78);
  const cajonFront = new THREE.Mesh(
    new THREE.BoxGeometry(0.36, 0.48, 0.03),
    new THREE.MeshStandardMaterial({ color: 0x5c361e, roughness: 0.72 })
  );
  cajonFront.position.set(-0.02, 0.3, -0.56);
  parkStaticGroup.add(cajon, cajonFront);

  // Open guitar hardcase + two takeaway park coffee cups on blanket
  const caseBase = new THREE.Mesh(
    new THREE.BoxGeometry(0.95, 0.1, 0.42),
    new THREE.MeshStandardMaterial({ color: 0x2a2421, roughness: 0.7 })
  );
  caseBase.position.set(0.05, 0.08, 0.92);
  caseBase.rotation.y = -0.18;
  const caseLining = new THREE.Mesh(
    new THREE.BoxGeometry(0.86, 0.03, 0.34),
    new THREE.MeshStandardMaterial({ color: 0x8c2e38, roughness: 0.85 })
  );
  caseLining.position.set(0.05, 0.13, 0.92);
  caseLining.rotation.y = -0.18;
  parkStaticGroup.add(caseBase, caseLining);

  [
    [-0.35, 0.22],
    [0.42, -0.12],
  ].forEach(([tx, tz]) => {
    const cup = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.04, 0.14, 8), mats.creamPlaster);
    cup.position.set(tx, 0.11, tz);
    parkStaticGroup.add(cup);
  });

  // Warm fairy-light lantern post beside blanket
  const postMat = mats.darkTimber;
  [-1.75, 1.75].forEach((px, i) => {
    const pz = i === 0 ? -1.1 : 1.05;
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.05, 1.85, 6), postMat);
    post.position.set(px, 0.92, pz);
    const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.11, 8, 6), mats.lampBulb);
    bulb.position.set(px, 1.86, pz);
    parkStaticGroup.add(post, bulb);
  });

  mergeStaticGroupMeshes(parkStaticGroup);

  // Youth 1: Kerem — Seated Lead Acoustic Guitarist on Wooden Log
  const keremRig = createSculptedHumanRig(
    {
      skinHex: 0xdfb18a,
      shirtHex: 0xd99b3d, // warm mustard hoodie
      pantsHex: 0x2f435a, // indigo denim
      hairHex: 0x261b15,
      scarfHex: 0xf0e6d2,
      hairStyle: 'short',
      hatStyle: 'none',
    },
    { forwardIsNegZ: false, castShadow: 'full' }
  );
  keremRig.root.position.set(-0.92, 0.18, 0.44);
  keremRig.root.rotation.y = 1.1;
  group.add(keremRig.root);

  const guitarKerem = createAcousticGuitarMesh(0xe0ae67, 0x6b3a1e);
  mergeStaticGroupMeshes(guitarKerem);
  // Attach guitar across Kerem's torso (inverse human scale ~ 1/0.152 = 6.58)
  guitarKerem.scale.setScalar(1 / 0.152);
  guitarKerem.position.set(0.1, 1.05, 0.96);
  guitarKerem.rotation.set(-0.14, 0.08, -1.22);
  keremRig.torsoPivot.add(guitarKerem);

  // Youth 2: Elif — Seated Classical Guitarist on Picnic Kilim
  const elifRig = createSculptedHumanRig(
    {
      skinHex: 0xf0c7a5,
      shirtHex: 0x5c8554, // sage green cardigan
      pantsHex: 0x383d47,
      hairHex: 0x573322,
      scarfHex: 0xf4eee1,
      hairStyle: 'waves',
      hatStyle: 'none',
    },
    { forwardIsNegZ: false, castShadow: 'full' }
  );
  elifRig.root.position.set(0.88, 0.02, 0.36);
  elifRig.root.rotation.y = -1.05;
  group.add(elifRig.root);

  const guitarElif = createAcousticGuitarMesh(0xe8c488, 0x7c4526);
  mergeStaticGroupMeshes(guitarElif);
  guitarElif.scale.setScalar(0.94 / 0.152);
  guitarElif.position.set(0.1, 1.05, 0.94);
  guitarElif.rotation.set(-0.14, 0.08, -1.2);
  elifRig.torsoPivot.add(guitarElif);

  // Youth 3: Arda — Seated Cajon Percussionist
  const ardaRig = createSculptedHumanRig(
    {
      skinHex: 0xd39f78,
      shirtHex: 0xc25838, // terracotta crewneck
      pantsHex: 0x2d3540,
      hairHex: 0x1f1916,
      scarfHex: 0xe8dfd0,
      hairStyle: 'short',
      hatStyle: 'none',
    },
    { forwardIsNegZ: false, castShadow: 'full' }
  );
  ardaRig.root.position.set(-0.02, 0.22, -0.94);
  ardaRig.root.rotation.y = 0.04;
  group.add(ardaRig.root);

  // Youth 4: Defne — Standing/Swaying Friend Clapping & Singing Along
  const defneRig = createSculptedHumanRig(
    {
      skinHex: 0xebb994,
      shirtHex: 0x456e8f, // denim jacket
      pantsHex: 0x3b312d,
      hairHex: 0x362218,
      scarfHex: 0xf5efe6,
      hairStyle: 'bun',
      hatStyle: 'none',
    },
    { forwardIsNegZ: false, castShadow: 'full' }
  );
  defneRig.root.position.set(1.52, 0.03, -0.45);
  defneRig.root.rotation.y = -1.95;
  group.add(defneRig.root);

  // Interactive soft acoustic stage ring & floating golden musical glow notes
  const ringGeo = new THREE.RingGeometry(2.15, 2.42, 32);
  ringGeo.rotateX(-Math.PI / 2);
  const ringMat = new THREE.MeshStandardMaterial({
    color: 0x62b878,
    emissive: new THREE.Color(0x52a868),
    emissiveIntensity: 0.4,
    side: THREE.DoubleSide,
    polygonOffset: true,
    polygonOffsetFactor: -3,
  });
  const stageRing = new THREE.Mesh(ringGeo, ringMat);
  stageRing.position.y = 0.045;
  group.add(stageRing);

  const noteCount = 12;
  const noteGeo = new THREE.OctahedronGeometry(0.11, 0);
  const noteMat = new THREE.MeshStandardMaterial({
    color: 0xffe082,
    emissive: new THREE.Color(0xffbe42),
    emissiveIntensity: 1.15,
    roughness: 0.25,
  });
  const noteInst = new THREE.InstancedMesh(noteGeo, noteMat, noteCount);
  noteInst.frustumCulled = false;
  group.add(noteInst);
  const noteDummy = new THREE.Object3D();

  const clickTarget = makeClickProxy(2.7, 2.2, 'guitar_band');
  group.add(clickTarget);

  colliders.push({
    minX: cx - 1.9,
    maxX: cx + 1.9,
    minZ: cz - 1.4,
    maxZ: cz + 1.4,
    maxY: baseY + 1.9,
  });

  let jamTimer = 0;
  let noteHidden = false;
  let poseInitialized = false;
  let settleTimer = 1.2;

  const poseGuitarist = (
    rig: SculptedHumanRig,
    dt: number,
    elapsed: number,
    seed: number,
    strumSpeed: number,
    strumAmp: number
  ) => {
    rig.updateSit(dt, elapsed, 0);
    // Gentle forward lean & rhythmic head nod over guitar
    rig.torsoPivot.rotation.x = THREE.MathUtils.damp(rig.torsoPivot.rotation.x, 0.14, 8, dt);
    rig.torsoPivot.rotation.z = THREE.MathUtils.damp(
      rig.torsoPivot.rotation.z,
      Math.sin(elapsed * 2.1 + seed) * (jamTimer > 0 ? 0.055 : 0.025),
      8,
      dt
    );
    rig.headPivot.rotation.x = THREE.MathUtils.damp(
      rig.headPivot.rotation.x,
      0.16 + Math.sin(elapsed * strumSpeed * 0.5 + seed) * (jamTimer > 0 ? 0.11 : 0.04),
      8,
      dt
    );
    // Left hand fretting neck
    rig.armL.shoulder.rotation.x = -0.68;
    rig.armL.shoulder.rotation.z = -0.22 + Math.sin(elapsed * 1.8 + seed) * 0.08;
    rig.armL.elbow.rotation.x = -1.15;
    // Right hand rhythmic strumming across guitar soundhole
    const strum = Math.sin(elapsed * strumSpeed + seed);
    rig.armR.shoulder.rotation.x = -0.56 + strum * strumAmp * 0.45;
    rig.armR.shoulder.rotation.z = 0.28 + strum * strumAmp * 0.32;
    rig.armR.elbow.rotation.x = -0.95 + strum * strumAmp * 0.7;
    rig.armR.elbow.rotation.z = 0.22;
  };

  return {
    group,
    clickTarget,
    center: [cx, cz],
    isPlaying: () => jamTimer > 0,
    triggerJam: () => {
      jamTimer = 12.0;
      settleTimer = 1.2;
    },
    update: (dt: number, elapsed: number, focusX?: number, focusZ?: number) => {
      const active = jamTimer > 0;
      if (active) {
        if (!group.visible) group.visible = true;
        jamTimer = Math.max(0, jamTimer - dt);
        settleTimer = 1.2;
        if (noteHidden) {
          noteInst.visible = true;
          noteHidden = false;
        }
        ringMat.emissiveIntensity = 1.15 + Math.sin(elapsed * 6) * 0.35;
      } else {
        if (!noteHidden) {
          noteInst.visible = false;
          noteHidden = true;
        }
        if (poseInitialized && settleTimer <= 0 && focusX !== undefined && focusZ !== undefined) {
          const dx = focusX - cx;
          const dz = focusZ - cz;
          if (dx * dx + dz * dz > 5625) {
            if (group.visible) group.visible = false;
            return;
          }
        }
        if (!group.visible) group.visible = true;
        settleTimer = Math.max(0, settleTimer - dt);
        ringMat.emissiveIntensity = 0.36 + Math.sin(elapsed * 2.2) * 0.1;
      }
      poseInitialized = true;

      const strumSpeed = active ? 8.8 : 3.6;
      const strumAmp = active ? 0.55 : 0.2;

      poseGuitarist(keremRig, dt, elapsed, 0, strumSpeed, strumAmp);
      poseGuitarist(elifRig, dt, elapsed, 1.4, strumSpeed * 0.98, strumAmp * 0.9);

      // Arda tapping Cajon box drum
      ardaRig.updateSit(dt, elapsed, 0);
      const tapSpeed = active ? 9.5 : 3.2;
      const tapAmp = active ? 0.34 : 0.1;
      ardaRig.torsoPivot.rotation.x = 0.2;
      ardaRig.armL.shoulder.rotation.x = -0.78 + Math.sin(elapsed * tapSpeed) * tapAmp;
      ardaRig.armR.shoulder.rotation.x = -0.78 - Math.sin(elapsed * tapSpeed) * tapAmp;
      ardaRig.armL.elbow.rotation.x = -0.52;
      ardaRig.armR.elbow.rotation.x = -0.52;
      ardaRig.headPivot.rotation.x = 0.1 + Math.sin(elapsed * tapSpeed * 0.5) * 0.08;

      // Defne swaying & clapping happily during jam
      defneRig.updateWave(false, dt, elapsed, 2.3);
      if (active) {
        const clap = Math.abs(Math.sin(elapsed * 7.2));
        defneRig.armL.shoulder.rotation.x = -0.75;
        defneRig.armR.shoulder.rotation.x = -0.75;
        defneRig.armL.shoulder.rotation.z = -0.25 + clap * 0.25;
        defneRig.armR.shoulder.rotation.z = 0.25 - clap * 0.25;
        defneRig.armL.elbow.rotation.x = -0.65;
        defneRig.armR.elbow.rotation.x = -0.65;
        defneRig.torsoPivot.rotation.z = Math.sin(elapsed * 3.6) * 0.06;
      }

      // Floating musical note sparkles when jamming
      if (active) {
        for (let i = 0; i < noteCount; i++) {
          const t = (elapsed * 0.55 + i / noteCount) % 1;
          const ang = i * 1.15 + elapsed * 1.2;
          const rad = 0.8 + Math.sin(t * Math.PI) * 1.35;
          noteDummy.position.set(Math.cos(ang) * rad, 0.9 + t * 2.4, Math.sin(ang) * rad);
          noteDummy.rotation.set(elapsed * 1.8, elapsed * 2.2, 0);
          noteDummy.scale.setScalar(Math.sin(t * Math.PI) * 1.1);
          noteDummy.updateMatrix();
          noteInst.setMatrixAt(i, noteDummy.matrix);
        }
        noteInst.instanceMatrix.needsUpdate = true;
      }
    },
  };
}
