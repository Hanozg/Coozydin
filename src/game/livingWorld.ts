import * as THREE from 'three';
import { ANCIENT_SIGNPOST_POSITIONS, LANDMARKS } from '../data/efelerData';
import { ColliderBox, SeasonType } from '../types/game';
import { CityMaterialLibrary } from './materials';
import { createSculptedPedestrianGeos } from './sculptedHumans';
import { getSurfaceHeightAt, getSurfaceSlopeAngles } from './terrain';

/**
 * 1. Growing Fig Tree in the Heart of Kent Meydanı (scales with İncir Puanı)
 */
export interface LivingFigTree {
  group: THREE.Group;
  update: (
    dt: number,
    coins: number,
    elapsed: number,
    season?: SeasonType,
    frostFactor?: number,
    windStrength?: number
  ) => void;
}

export function createLivingFigTree(mats: CityMaterialLibrary): LivingFigTree {
  const group = new THREE.Group();
  group.position.set(0, 0, 21.8);

  // Octagonal Travertine Planter & Soil Bed
  const planter = new THREE.Mesh(
    new THREE.CylinderGeometry(2.55, 2.75, 0.55, 8),
    mats.travertine
  );
  planter.position.y = 0.275;
  planter.castShadow = true;
  planter.receiveShadow = true;
  group.add(planter);

  const soilMat = new THREE.MeshStandardMaterial({ color: 0x4e3928, roughness: 0.95 });
  const soil = new THREE.Mesh(new THREE.CylinderGeometry(2.15, 2.15, 0.14, 8), soilMat);
  soil.position.y = 0.54;
  group.add(soil);

  // Scaling Tree Rig
  const treeScaleGroup = new THREE.Group();
  treeScaleGroup.position.y = 0.55;
  group.add(treeScaleGroup);

  const barkMat = new THREE.MeshStandardMaterial({ color: 0x7b6d5e, roughness: 0.9 });
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.48, 2.5, 9), barkMat);
  trunk.position.y = 1.25;
  trunk.castShadow = true;
  treeScaleGroup.add(trunk);

  // Spreading Fig Boughs
  const boughAngles = [0, Math.PI * 0.5, Math.PI, Math.PI * 1.5];
  boughAngles.forEach((ang, i) => {
    const bough = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.2, 1.85, 7), barkMat);
    bough.position.set(Math.cos(ang) * 0.65, 2.55 + (i % 2) * 0.12, Math.sin(ang) * 0.65);
    bough.rotation.z = -Math.cos(ang) * 0.68;
    bough.rotation.x = Math.sin(ang) * 0.68;
    bough.castShadow = true;
    treeScaleGroup.add(bough);
  });

  // Lush Broad Fig Canopy Clusters (smooth organic puffs)
  const leafColors = [0x588a45, 0x67984f, 0x4b793b, 0x74a254, 0x5d8d48];
  const canopyOffsets: [number, number, number, number][] = [
    [0, 3.7, 0, 1.72],
    [-1.25, 3.15, 0.72, 1.32],
    [1.28, 3.22, 0.68, 1.3],
    [0.84, 3.18, -1.15, 1.28],
    [-0.98, 3.1, -1.08, 1.24],
    [0.2, 4.15, -0.2, 1.18],
  ];
  const leafMats: THREE.MeshStandardMaterial[] = [];
  const leafMeshes: THREE.Mesh[] = [];
  canopyOffsets.forEach(([cx, cy, cz, r], i) => {
    const leafMat = new THREE.MeshStandardMaterial({
      color: leafColors[i % leafColors.length],
      roughness: 0.82,
    });
    const puff = new THREE.Mesh(new THREE.IcosahedronGeometry(r, 2), leafMat);
    puff.scale.set(1.18, 0.76, 1.18);
    puff.position.set(cx, cy, cz);
    puff.castShadow = true;
    puff.receiveShadow = true;
    treeScaleGroup.add(puff);
    leafMats.push(leafMat);
    leafMeshes.push(puff);
  });

  // 16 Ripening Aydın Figs (appear progressively as coins grow)
  const figMeshes: THREE.Mesh[] = [];
  const figMat = new THREE.MeshStandardMaterial({
    color: 0x6b3a5b,
    roughness: 0.55,
  });
  for (let i = 0; i < 16; i++) {
    const ang = (i * Math.PI * 2) / 16 + (i % 3) * 0.2;
    const rad = 1.05 + (i % 3) * 0.55;
    const fy = 2.65 + (i % 4) * 0.28;
    const fig = new THREE.Mesh(new THREE.SphereGeometry(0.16, 8, 8), figMat);
    fig.position.set(Math.cos(ang) * rad, fy, Math.sin(ang) * rad);
    fig.scale.setScalar(0.001);
    treeScaleGroup.add(fig);
    figMeshes.push(fig);
  }

  let currentScale = 0.42;
  const _figBaseColor = new THREE.Color();
  const _figTargetColor = new THREE.Color();
  const _figFrost = new THREE.Color(0xeef5fb);
  const _figBarkBase = new THREE.Color(0x7b6d5e);
  const _figBarkWinter = new THREE.Color(0xa6a3a0);
  const springPalette = [0x82b859, 0xf2afc4, 0x94c966, 0xf7c9d8, 0x76ad4f];
  const autumnPalette = [0xde802b, 0xebaa3a, 0xc75422, 0xe89731, 0xd46b28];
  const winterPalette = [0xcadbe6, 0xd8e6ef, 0xbccfd9, 0xe2eef5, 0xc4d6e0];

  return {
    group,
    update: (
      dt: number,
      coins: number,
      elapsed: number,
      season: SeasonType = 'summer',
      frostFactor = 0,
      windStrength = 0.5
    ) => {
      // Smoothly grow from sapling (0.42) up to monumental fig tree (1.42) as coins reach 200+
      const targetScale = 0.42 + THREE.MathUtils.clamp(coins / 200, 0, 1) * 1.0;
      currentScale = THREE.MathUtils.damp(currentScale, targetScale, 3.2, dt);
      const sway = Math.sin(elapsed * (1.1 + windStrength * 0.35)) * (0.012 * windStrength);
      treeScaleGroup.scale.setScalar(currentScale);
      treeScaleGroup.rotation.z = sway;

      // Update seasonal canopy color & winter sparseness
      const canopyScaleTarget = season === 'winter' ? 0.38 : season === 'autumn' ? 0.94 : 1.0;
      leafMeshes.forEach((mesh, idx) => {
        const ls = THREE.MathUtils.damp(mesh.scale.x, 1.18 * canopyScaleTarget, 2.2, dt);
        mesh.scale.set(ls, ls * 0.64, ls);
        const targetHex =
          season === 'spring'
            ? springPalette[idx % springPalette.length]
            : season === 'autumn'
              ? autumnPalette[idx % autumnPalette.length]
              : season === 'winter'
                ? winterPalette[idx % winterPalette.length]
                : leafColors[idx % leafColors.length];
        _figTargetColor.setHex(targetHex);
        if (frostFactor > 0.01) {
          _figTargetColor.lerp(_figFrost, frostFactor * 0.52);
        }
        leafMats[idx].color.lerp(_figTargetColor, Math.min(1, dt * 1.6));
      });
      _figBaseColor.copy(_figBarkBase).lerp(_figBarkWinter, Math.max(season === 'winter' ? 0.5 : 0, frostFactor * 0.6));
      barkMat.color.lerp(_figBaseColor, Math.min(1, dt * 2.0));

      // Reveal figs gradually starting from 30 coins (hidden in winter)
      const unlockedFigs =
        season === 'winter' ? 0 : Math.floor(THREE.MathUtils.clamp((coins - 20) / 10, 0, 16));
      figMeshes.forEach((fm, idx) => {
        const target = idx < unlockedFigs ? 1 : 0.001;
        const s = THREE.MathUtils.damp(fm.scale.x, target, 4, dt);
        fm.scale.setScalar(s);
      });
    },
  };
}

/**
 * 2. Cozy Tiny Pedestrians (Kent Meydanı crowd + walking into & out of buildings)
 */
interface WalkerAgent {
  x: number;
  z: number;
  targetX: number;
  targetZ: number;
  speed: number;
  isPlazaWalker: boolean;
  doorId: string | null;
  state: 'walking' | 'entering' | 'inside' | 'exiting';
  timer: number;
  scale: number;
  phaseOffset: number;
}

export interface PedestrianSystem {
  group: THREE.Group;
  update: (dt: number, elapsed: number) => void;
}

const CLOTHING_PALETTE = [
  0xc95242, 0x4e688c, 0xc7953e, 0x587d63, 0xad535d, 0x424a59, 0x826ba6, 0x543622,
];

export function createPedestrianSystem(): PedestrianSystem {
  const group = new THREE.Group();
  const count = 64;

  const { bodyGeo, headGeo } = createSculptedPedestrianGeos();
  const bodyMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    vertexColors: true,
    roughness: 0.82,
    metalness: 0.02,
  });
  const bodyInst = new THREE.InstancedMesh(bodyGeo, bodyMat, count);
  bodyInst.castShadow = true;
  bodyInst.frustumCulled = false;

  const headMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    vertexColors: true,
    roughness: 0.8,
    metalness: 0.02,
  });
  const headInst = new THREE.InstancedMesh(headGeo, headMat, count);
  headInst.castShadow = true;
  headInst.frustumCulled = false;

  const colorTmp = new THREE.Color();
  const doorLandmarks = LANDMARKS.filter((l) => l.doorPosition);

  const pickPlazaPoint = (): [number, number] => {
    const ang = Math.random() * Math.PI * 2;
    const rad = 4.6 + Math.random() * 9.5;
    return [Math.cos(ang) * rad, 12 + Math.sin(ang) * rad];
  };

  const streetWaypoints: [number, number][] = [
    [-18, -14],
    [-18, 2],
    [-18, 26],
    [-18, 42],
    [-18, -58],
    [-18, -77],
    [18, 26],
    [18, -4],
    [18, -30],
    [18, -58],
    [58, -40],
    [64, -40],
    [58, -78],
    [63, -78],
    [28, 12],
    [-28, 12],
    [58, 18],
    [68, 30],
    [-54, 22],
    [-62, 30],
    [0, 56],
  ];

  const agents: WalkerAgent[] = [];

  for (let i = 0; i < count; i++) {
    colorTmp.setHex(CLOTHING_PALETTE[i % CLOTHING_PALETTE.length]);
    bodyInst.setColorAt(i, colorTmp);

    const isPlaza = i < 34; // Dense lively crowd in Atatürk Kent Meydanı!
    if (isPlaza) {
      const [sx, sz] = pickPlazaPoint();
      const [tx, tz] = pickPlazaPoint();
      agents.push({
        x: sx,
        z: sz,
        targetX: tx,
        targetZ: tz,
        speed: 1.05 + Math.random() * 0.55,
        isPlazaWalker: true,
        doorId: null,
        state: 'walking',
        timer: Math.random() * 2,
        scale: 1,
        phaseOffset: Math.random() * Math.PI * 2,
      });
    } else {
      const doorLm = doorLandmarks[i % doorLandmarks.length];
      const [dx, dz] = doorLm.doorPosition!;
      const wp = streetWaypoints[(i * 3) % streetWaypoints.length];
      const startAtDoor = i % 2 === 0;
      agents.push({
        x: startAtDoor ? dx + (Math.random() - 0.5) * 2 : wp[0],
        z: startAtDoor ? dz + (Math.random() - 0.5) * 2 : wp[1],
        targetX: dx,
        targetZ: dz,
        speed: 1.15 + Math.random() * 0.5,
        isPlazaWalker: false,
        doorId: doorLm.id,
        state: 'walking',
        timer: 0,
        scale: 1,
        phaseOffset: Math.random() * Math.PI * 2,
      });
    }
  }

  if (bodyInst.instanceColor) bodyInst.instanceColor.needsUpdate = true;
  bodyInst.computeBoundingSphere();
  headInst.computeBoundingSphere();
  group.add(bodyInst, headInst);

  const dummy = new THREE.Object3D();

  return {
    group,
    update: (dt: number, elapsed: number) => {
      for (let i = 0; i < count; i++) {
        const a = agents[i];

        if (a.state === 'inside') {
          a.timer -= dt;
          a.scale = 0.001;
          if (a.timer <= 0) {
            a.state = 'exiting';
            const wp = streetWaypoints[Math.floor(Math.random() * streetWaypoints.length)];
            a.targetX = wp[0];
            a.targetZ = wp[1];
          }
        } else if (a.state === 'entering') {
          a.scale = Math.max(0.001, a.scale - dt * 2.5);
          if (a.scale <= 0.02) {
            a.state = 'inside';
            a.timer = 2.5 + Math.random() * 3.5;
          }
        } else if (a.state === 'exiting') {
          a.scale = Math.min(1, a.scale + dt * 2.5);
          if (a.scale >= 0.99) {
            a.scale = 1;
            a.state = 'walking';
          }
        } else {
          // Walking slowly & peacefully
          const dx = a.targetX - a.x;
          const dz = a.targetZ - a.z;
          const dist = Math.hypot(dx, dz);

          if (dist < 0.6) {
            if (a.isPlazaWalker) {
              // Pause briefly to admire Kent Meydanı, then pick another spot
              a.timer -= dt;
              if (a.timer <= 0) {
                const [nx, nz] = pickPlazaPoint();
                a.targetX = nx;
                a.targetZ = nz;
                a.timer = 1.0 + Math.random() * 2.5;
              }
            } else if (a.doorId) {
              // Entered a building door!
              a.state = 'entering';
              a.doorId = null;
            } else {
              // Pick a building door to walk into
              const nextDoor =
                doorLandmarks[Math.floor(Math.random() * doorLandmarks.length)];
              a.doorId = nextDoor.id;
              a.targetX = nextDoor.doorPosition![0];
              a.targetZ = nextDoor.doorPosition![1];
            }
          } else {
            const step = Math.min(dist, a.speed * dt);
            a.x += (dx / dist) * step;
            a.z += (dz / dist) * step;
          }
        }

        const isMoving =
          a.state === 'walking' && Math.hypot(a.targetX - a.x, a.targetZ - a.z) > 0.6;
        const bob = isMoving ? Math.abs(Math.sin(elapsed * 6.5 + a.phaseOffset)) * 0.06 : 0;

        dummy.position.set(a.x, getSurfaceHeightAt(a.x, a.z) + bob, a.z);
        dummy.scale.setScalar(a.scale * 1.12);
        dummy.rotation.y = Math.atan2(a.targetX - a.x, a.targetZ - a.z);
        dummy.updateMatrix();
        bodyInst.setMatrixAt(i, dummy.matrix);
        headInst.setMatrixAt(i, dummy.matrix);
      }

      bodyInst.instanceMatrix.needsUpdate = true;
      headInst.instanceMatrix.needsUpdate = true;
    },
  };
}

/**
 * 3. Tiny Cozy Traffic Lights at Major Boulevard Intersections
 */
export interface TrafficLightSystem {
  group: THREE.Group;
  update: (elapsed: number) => void;
}

export function createTrafficLightSystem(mats: CityMaterialLibrary): TrafficLightSystem {
  const group = new THREE.Group();

  const intersections: [number, number][] = [
    [-54, 12],
    [-18, 12],
    [18, 12],
    [58, 12],
    [18, -22],
    [18, 48],
    [58, -58],
    [-18, -58],
    [58, -96],
  ];

  const redMatNS = new THREE.MeshStandardMaterial({
    color: 0x551818,
    emissive: new THREE.Color(0xff3b30),
    emissiveIntensity: 0,
  });
  const amberMatNS = new THREE.MeshStandardMaterial({
    color: 0x554215,
    emissive: new THREE.Color(0xffb830),
    emissiveIntensity: 0,
  });
  const greenMatNS = new THREE.MeshStandardMaterial({
    color: 0x164a28,
    emissive: new THREE.Color(0x34c759),
    emissiveIntensity: 0,
  });

  const redMatEW = redMatNS.clone();
  const amberMatEW = amberMatNS.clone();
  const greenMatEW = greenMatNS.clone();

  intersections.forEach(([ix, iz], idx) => {
    // Place two corner poles cleanly on sidewalk corners
    const corners: [number, number, boolean][] = [
      [ix + 5.2, iz + 5.2, true], // faces N-S traffic
      [ix - 5.2, iz - 5.2, false], // faces E-W traffic
    ];

    corners.forEach(([px, pz, isNS]) => {
      const poleGroup = new THREE.Group();
      poleGroup.position.set(px, getSurfaceHeightAt(px, pz), pz);
      if (!isNS) poleGroup.rotation.y = Math.PI / 2;

      const pole = new THREE.Mesh(
        new THREE.CylinderGeometry(0.07, 0.09, 3.1, 8),
        mats.wroughtIron
      );
      pole.position.y = 1.55;
      poleGroup.add(pole);

      const housing = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.88, 0.28), mats.wroughtIron);
      housing.position.set(0, 3.1, 0);
      housing.castShadow = true;
      poleGroup.add(housing);

      const rMat = isNS ? redMatNS : redMatEW;
      const aMat = isNS ? amberMatNS : amberMatEW;
      const gMat = isNS ? greenMatNS : greenMatEW;

      const rLamp = new THREE.Mesh(new THREE.SphereGeometry(0.085, 8, 8), rMat);
      rLamp.position.set(0, 3.36, 0.14);
      const aLamp = new THREE.Mesh(new THREE.SphereGeometry(0.085, 8, 8), aMat);
      aLamp.position.set(0, 3.1, 0.14);
      const gLamp = new THREE.Mesh(new THREE.SphereGeometry(0.085, 8, 8), gMat);
      gLamp.position.set(0, 2.84, 0.14);

      poleGroup.add(rLamp, aLamp, gLamp);
      group.add(poleGroup);
      void idx;
    });
  });

  return {
    group,
    update: (elapsed: number) => {
      const cycle = elapsed % 12;
      // 0..5s: NS Green, EW Red | 5..6s: NS Amber, EW Red | 6..11s: NS Red, EW Green | 11..12s: NS Red, EW Amber
      greenMatNS.emissiveIntensity = cycle < 5 ? 1.8 : 0.05;
      amberMatNS.emissiveIntensity = cycle >= 5 && cycle < 6 ? 1.8 : 0.05;
      redMatNS.emissiveIntensity = cycle >= 6 ? 1.8 : 0.05;

      redMatEW.emissiveIntensity = cycle < 6 ? 1.8 : 0.05;
      greenMatEW.emissiveIntensity = cycle >= 6 && cycle < 11 ? 1.8 : 0.05;
      amberMatEW.emissiveIntensity = cycle >= 11 ? 1.8 : 0.05;
    },
  };
}

/**
 * 4. "Aydın Antik Kentleri Çok Yakında" Tourist Signpost Boards
 */
export function buildAncientCitiesSignposts(
  mats: CityMaterialLibrary,
  colliders: ColliderBox[]
): THREE.Group {
  const group = new THREE.Group();

  ANCIENT_SIGNPOST_POSITIONS.forEach(([sx, sz], idx) => {
    const signGroup = new THREE.Group();
    signGroup.position.set(sx, getSurfaceHeightAt(sx, sz), sz);
    if (idx === 1) signGroup.rotation.y = -Math.PI / 2;

    const plinth = new THREE.Mesh(new THREE.BoxGeometry(4.4, 0.4, 1.3), mats.travertine);
    plinth.position.y = 0.2;
    signGroup.add(plinth);

    [-1.7, 1.7].forEach((px) => {
      const post = new THREE.Mesh(new THREE.BoxGeometry(0.24, 3.2, 0.24), mats.darkTimber);
      post.position.set(px, 1.8, 0);
      post.castShadow = true;
      signGroup.add(post);
    });

    const boardFrame = new THREE.Mesh(new THREE.BoxGeometry(4.0, 2.0, 0.18), mats.darkTimber);
    boardFrame.position.set(0, 2.35, 0);
    boardFrame.castShadow = true;
    signGroup.add(boardFrame);

    const frontFace = new THREE.Mesh(new THREE.PlaneGeometry(3.75, 1.8), mats.signpostFace);
    frontFace.position.set(0, 2.35, 0.1);
    signGroup.add(frontFace);

    const backFace = new THREE.Mesh(new THREE.PlaneGeometry(3.75, 1.8), mats.signpostFace);
    backFace.rotation.y = Math.PI;
    backFace.position.set(0, 2.35, -0.1);
    signGroup.add(backFace);

    const capRoof = new THREE.Mesh(new THREE.BoxGeometry(4.3, 0.28, 0.85), mats.terracottaRoof);
    capRoof.position.set(0, 3.45, 0);
    signGroup.add(capRoof);

    group.add(signGroup);
    colliders.push({
      minX: sx - 2.3,
      maxX: sx + 2.3,
      minZ: sz - 0.9,
      maxZ: sz + 0.9,
    });
  });

  return group;
}

/**
 * 5. Animated İzmir–Aydın 1882 Heritage Steam Train gliding past Tarihi Tren Garı
 */
export interface SteamTrainSystem {
  group: THREE.Group;
  update: (dt: number, elapsed: number) => void;
}

export function createSteamTrainSystem(mats: CityMaterialLibrary): SteamTrainSystem {
  const group = new THREE.Group();
  const trackZ = 77.1;

  const trainGroup = new THREE.Group();
  trainGroup.position.set(-76, 0.34, trackZ);
  group.add(trainGroup);

  const locoGreenMat = new THREE.MeshStandardMaterial({
    color: 0x264839,
    roughness: 0.42,
    metalness: 0.35,
  });
  const chassisMat = new THREE.MeshStandardMaterial({
    color: 0x232528,
    roughness: 0.55,
    metalness: 0.5,
  });
  const coachBodyMat = new THREE.MeshStandardMaterial({
    color: 0x9b4d33,
    roughness: 0.58,
  });
  const coachTrimMat = new THREE.MeshStandardMaterial({
    color: 0xe9dec8,
    roughness: 0.72,
  });
  const steamMat = new THREE.MeshBasicMaterial({
    color: 0xf8f3ea,
    transparent: true,
    opacity: 0.52,
  });

  const wheels: THREE.Mesh[] = [];
  const addWheelPair = (parent: THREE.Group, lx: number, radius: number) => {
    [-0.95, 0.95].forEach((lz) => {
      const wheel = new THREE.Mesh(
        new THREE.CylinderGeometry(radius, radius, 0.16, 12),
        mats.wroughtIron
      );
      wheel.rotation.x = Math.PI / 2;
      wheel.position.set(lx, radius, lz);
      wheel.castShadow = true;
      parent.add(wheel);
      wheels.push(wheel);
    });
  };

  // --- Locomotive (facing +X, centered near x = +9.5 relative to trainGroup) ---
  const locoGroup = new THREE.Group();
  locoGroup.position.set(8.5, 0, 0);
  trainGroup.add(locoGroup);

  const locoFrame = new THREE.Mesh(new THREE.BoxGeometry(6.8, 0.42, 2.05), chassisMat);
  locoFrame.position.set(0, 0.65, 0);
  locoFrame.castShadow = true;
  locoGroup.add(locoFrame);

  // Cylindrical Boiler + Smokebox
  const boiler = new THREE.Mesh(
    new THREE.CylinderGeometry(0.82, 0.82, 4.2, 16),
    locoGreenMat
  );
  boiler.rotation.z = Math.PI / 2;
  boiler.position.set(0.55, 1.65, 0);
  boiler.castShadow = true;
  locoGroup.add(boiler);

  const smokebox = new THREE.Mesh(
    new THREE.CylinderGeometry(0.84, 0.84, 1.15, 16),
    chassisMat
  );
  smokebox.rotation.z = Math.PI / 2;
  smokebox.position.set(2.55, 1.65, 0);
  smokebox.castShadow = true;
  locoGroup.add(smokebox);

  // Brass Boiler Bands & Steam Dome
  [-0.5, 0.65, 1.8].forEach((bx) => {
    const band = new THREE.Mesh(new THREE.CylinderGeometry(0.845, 0.845, 0.1, 16), mats.brass);
    band.rotation.z = Math.PI / 2;
    band.position.set(bx, 1.65, 0);
    locoGroup.add(band);
  });

  const steamDome = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.38, 0.58, 12), mats.brass);
  steamDome.position.set(0.65, 2.55, 0);
  locoGroup.add(steamDome);

  // Tall Smokestack Funnel + Flared Lip
  const funnel = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.19, 1.05, 12), chassisMat);
  funnel.position.set(2.55, 2.75, 0);
  funnel.castShadow = true;
  const funnelRim = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.24, 0.18, 12), mats.brass);
  funnelRim.position.set(2.55, 3.28, 0);
  locoGroup.add(funnel, funnelRim);

  // Front Brass Headlamp + Cowcatcher
  const headlamp = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.26, 10), mats.lampBulb);
  headlamp.rotation.z = Math.PI / 2;
  headlamp.position.set(3.22, 2.05, 0);
  locoGroup.add(headlamp);

  const cowcatcher = new THREE.Mesh(new THREE.ConeGeometry(0.92, 0.9, 4), chassisMat);
  cowcatcher.rotation.y = Math.PI / 4;
  cowcatcher.rotation.z = -Math.PI / 2;
  cowcatcher.position.set(3.5, 0.48, 0);
  locoGroup.add(cowcatcher);

  // Driver's Cab with Warm Lit Windows & Arched Roof
  const cab = new THREE.Mesh(new THREE.BoxGeometry(2.15, 2.25, 2.15), locoGreenMat);
  cab.position.set(-2.15, 1.85, 0);
  cab.castShadow = true;
  const cabRoof = new THREE.Mesh(new THREE.BoxGeometry(2.45, 0.18, 2.4), mats.darkTimber);
  cabRoof.position.set(-2.15, 3.04, 0);
  const cabWin = new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.72, 2.2), mats.windowLit);
  cabWin.position.set(-2.15, 2.25, 0);
  locoGroup.add(cab, cabRoof, cabWin);

  addWheelPair(locoGroup, -2.2, 0.5);
  addWheelPair(locoGroup, -0.4, 0.56);
  addWheelPair(locoGroup, 1.3, 0.56);
  addWheelPair(locoGroup, 2.65, 0.36);

  // --- Coal Tender ---
  const tenderGroup = new THREE.Group();
  tenderGroup.position.set(2.6, 0, 0);
  trainGroup.add(tenderGroup);

  const tenderBody = new THREE.Mesh(new THREE.BoxGeometry(3.6, 1.35, 1.98), locoGreenMat);
  tenderBody.position.set(0, 1.25, 0);
  tenderBody.castShadow = true;
  const coalMound = new THREE.Mesh(new THREE.BoxGeometry(2.8, 0.4, 1.55), chassisMat);
  coalMound.position.set(0, 1.98, 0);
  tenderGroup.add(tenderBody, coalMound);
  addWheelPair(tenderGroup, -1.0, 0.42);
  addWheelPair(tenderGroup, 1.0, 0.42);

  // --- Two Nostalgic Passenger Coaches ---
  [-4.2, -13.4].forEach((cx) => {
    const coach = new THREE.Group();
    coach.position.set(cx, 0, 0);
    trainGroup.add(coach);

    const chassis = new THREE.Mesh(new THREE.BoxGeometry(8.2, 0.34, 2.05), chassisMat);
    chassis.position.set(0, 0.62, 0);
    const body = new THREE.Mesh(new THREE.BoxGeometry(7.9, 1.95, 2.05), coachBodyMat);
    body.position.set(0, 1.72, 0);
    body.castShadow = true;
    const upperBand = new THREE.Mesh(new THREE.BoxGeometry(7.96, 0.24, 2.08), coachTrimMat);
    upperBand.position.set(0, 2.58, 0);
    const roof = new THREE.Mesh(new THREE.BoxGeometry(8.3, 0.32, 2.3), chassisMat);
    roof.position.set(0, 2.84, 0);
    roof.castShadow = true;
    const clerestory = new THREE.Mesh(new THREE.BoxGeometry(6.2, 0.24, 1.1), coachTrimMat);
    clerestory.position.set(0, 3.08, 0);
    coach.add(chassis, body, upperBand, roof, clerestory);

    [-2.7, -0.9, 0.9, 2.7].forEach((wx) => {
      const winStrip = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.78, 2.1), mats.windowLit);
      winStrip.position.set(wx, 1.86, 0);
      coach.add(winStrip);
    });

    addWheelPair(coach, -2.9, 0.4);
    addWheelPair(coach, -1.6, 0.4);
    addWheelPair(coach, 1.6, 0.4);
    addWheelPair(coach, 2.9, 0.4);
  });

  // --- Instanced Steam Puffs from Smokestack (zero per-frame alloc) ---
  const puffCount = 14;
  const puffGeo = new THREE.IcosahedronGeometry(0.34, 1);
  const puffMesh = new THREE.InstancedMesh(puffGeo, steamMat, puffCount);
  puffMesh.frustumCulled = false;
  group.add(puffMesh);

  const puffs = Array.from({ length: puffCount }, (_, i) => ({
    life: (i / puffCount) * 2.2,
    maxLife: 2.2,
    x: -76,
    y: 3.7,
    z: trackZ,
  }));
  const puffDummy = new THREE.Object3D();

  // Train journey state: cruise from West (-76) -> stop at platform (+2) for 6.5s -> depart East (+78) -> loop
  let trainX = -52;
  let phase: 'arriving' | 'dwelling' | 'departing' = 'arriving';
  let dwellTimer = 0;
  let speed = 6.8;
  let wheelAngle = 0;
  let puffSpawnAccum = 0;
  let nextPuffIdx = 0;

  return {
    group,
    update: (dt: number, elapsed: number) => {
      if (phase === 'arriving') {
        const distToStop = 2.0 - trainX;
        const targetSpeed = THREE.MathUtils.clamp(distToStop * 0.65, 1.2, 7.2);
        speed = THREE.MathUtils.damp(speed, targetSpeed, 2.8, dt);
        trainX += speed * dt;
        if (trainX >= 2.0) {
          trainX = 2.0;
          speed = 0;
          phase = 'dwelling';
          dwellTimer = 6.5;
        }
      } else if (phase === 'dwelling') {
        speed = THREE.MathUtils.damp(speed, 0, 5, dt);
        dwellTimer -= dt;
        if (dwellTimer <= 0) {
          phase = 'departing';
        }
      } else {
        speed = THREE.MathUtils.damp(speed, 8.2, 1.3, dt);
        trainX += speed * dt;
        if (trainX > 92) {
          trainX = -82;
          speed = 6.8;
          phase = 'arriving';
        }
      }

      trainGroup.position.x = trainX;
      // Subtle mechanical rail sway while rolling
      trainGroup.position.y = 0.34 + (speed > 0.2 ? Math.sin(elapsed * 11) * 0.014 : 0);

      wheelAngle -= (speed * dt) / 0.45;
      for (let i = 0; i < wheels.length; i++) {
        wheels[i].rotation.y = wheelAngle;
      }

      // Emit billowing white steam puffs from chimney top (locoGroup +8.5 + funnel +2.55)
      const funnelWorldX = trainX + 11.05;
      const puffRate = phase === 'dwelling' ? 0.38 : 0.16;
      puffSpawnAccum += dt;
      if (puffSpawnAccum >= puffRate) {
        puffSpawnAccum = 0;
        const p = puffs[nextPuffIdx];
        nextPuffIdx = (nextPuffIdx + 1) % puffCount;
        p.life = 0;
        p.x = funnelWorldX;
        p.y = 3.72;
        p.z = trackZ + (Math.sin(elapsed * 3.1) * 0.12);
      }

      for (let i = 0; i < puffCount; i++) {
        const p = puffs[i];
        p.life += dt;
        if (p.life >= p.maxLife) {
          puffDummy.position.set(0, -15, 0);
          puffDummy.scale.setScalar(0.01);
        } else {
          const t = p.life / p.maxLife;
          p.y += (1.7 + (1 - t) * 0.9) * dt;
          p.x -= (1.1 + speed * 0.25) * dt;
          const s = (0.48 + t * 1.65) * (1 - t * 0.35);
          puffDummy.position.set(p.x, p.y, p.z);
          puffDummy.scale.setScalar(Math.max(0.05, s));
        }
        puffDummy.updateMatrix();
        puffMesh.setMatrixAt(i, puffDummy.matrix);
      }
      puffMesh.instanceMatrix.needsUpdate = true;
    },
  };
}

/**
 * 6. Ambient Cozy Boulevard Cyclists & Aegean Scooters cruising Efeler
 */
export interface AmbientTrafficSystem {
  group: THREE.Group;
  update: (dt: number, elapsed: number) => void;
}

interface TrafficRider {
  group: THREE.Group;
  wheels: THREE.Mesh[];
  loopIndex: number;
  progress: number;
  speed: number;
  bobPhase: number;
}

const LOOP_CENTRAL: [number, number][] = [
  [-52, -20.2],
  [56, -20.2],
  [56, 46.2],
  [-52, 46.2],
];

const LOOP_NORTH: [number, number][] = [
  [-16, -94.2],
  [56, -94.2],
  [56, -23.8],
  [-16, -23.8],
];

function computeLoopLength(pts: [number, number][]): number {
  let total = 0;
  for (let i = 0; i < pts.length; i++) {
    const a = pts[i];
    const b = pts[(i + 1) % pts.length];
    total += Math.hypot(b[0] - a[0], b[1] - a[1]);
  }
  return total;
}

const LOOP_LENGTHS = [computeLoopLength(LOOP_CENTRAL), computeLoopLength(LOOP_NORTH)];

function sampleLoop(
  pts: [number, number][],
  totalLen: number,
  dist: number,
  out: { x: number; z: number; heading: number }
) {
  let rem = ((dist % totalLen) + totalLen) % totalLen;
  for (let i = 0; i < pts.length; i++) {
    const a = pts[i];
    const b = pts[(i + 1) % pts.length];
    const segLen = Math.hypot(b[0] - a[0], b[1] - a[1]);
    if (rem <= segLen) {
      const t = segLen > 0 ? rem / segLen : 0;
      out.x = a[0] + (b[0] - a[0]) * t;
      out.z = a[1] + (b[1] - a[1]) * t;
      out.heading = Math.atan2(-(b[0] - a[0]), -(b[1] - a[1]));
      return;
    }
    rem -= segLen;
  }
}

export function createAmbientTrafficSystem(mats: CityMaterialLibrary): AmbientTrafficSystem {
  const group = new THREE.Group();
  const riderColors = [0xc85a32, 0x3b6e8c, 0x5d8a48, 0xd4923f, 0x6e4555, 0x4c7b7d];
  const shirtColors = [0xf5ecdc, 0x586f4e, 0xd98a3f, 0x4b7496, 0xc96846, 0x7c5a44];
  const riders: TrafficRider[] = [];

  for (let i = 0; i < 8; i++) {
    const isScooter = i % 2 === 1;
    const loopIndex = i < 4 ? 0 : 1;
    const riderGroup = new THREE.Group();
    const bodyMat = new THREE.MeshStandardMaterial({
      color: riderColors[i % riderColors.length],
      roughness: 0.45,
    });
    const shirtMat = new THREE.MeshStandardMaterial({
      color: shirtColors[i % shirtColors.length],
      roughness: 0.78,
    });
    const skinMat = new THREE.MeshStandardMaterial({ color: 0xe6be9a, roughness: 0.72 });

    const wheels: THREE.Mesh[] = [];
    const wheelR = isScooter ? 0.24 : 0.32;
    [-0.55, 0.55].forEach((wz) => {
      const tire = new THREE.Mesh(
        new THREE.TorusGeometry(wheelR, isScooter ? 0.07 : 0.045, 7, 14),
        mats.wroughtIron
      );
      tire.rotation.y = Math.PI / 2;
      tire.position.set(0, wheelR, wz);
      tire.castShadow = true;
      riderGroup.add(tire);
      wheels.push(tire);
    });

    if (isScooter) {
      const deck = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.24, 1.05), bodyMat);
      deck.position.set(0, 0.44, 0.05);
      deck.castShadow = true;
      const apron = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.65, 0.22), bodyMat);
      apron.position.set(0, 0.72, -0.45);
      apron.rotation.x = 0.2;
      const lamp = new THREE.Mesh(new THREE.SphereGeometry(0.08, 8, 6), mats.lampBulb);
      lamp.position.set(0, 0.92, -0.58);
      riderGroup.add(deck, apron, lamp);
    } else {
      const frame = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.1, 1.15), bodyMat);
      frame.position.set(0, 0.56, 0);
      const basket = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.22, 0.26), mats.darkTimber);
      basket.position.set(0, 0.78, -0.52);
      riderGroup.add(frame, basket);
    }

    // Rider Torso & Head
    const torso = new THREE.Mesh(new THREE.CapsuleGeometry(0.15, 0.35, 4, 8), shirtMat);
    torso.position.set(0, 0.96, 0.1);
    torso.rotation.x = isScooter ? -0.1 : -0.22;
    torso.castShadow = true;
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.135, 10, 8), skinMat);
    head.position.set(0, 1.38, 0.04);
    const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.15, 0.09, 10), bodyMat);
    cap.position.set(0, 1.48, 0.04);
    riderGroup.add(torso, head, cap);

    group.add(riderGroup);
    riders.push({
      group: riderGroup,
      wheels,
      loopIndex,
      progress: ((i % 4) / 4) * LOOP_LENGTHS[loopIndex],
      speed: isScooter ? 6.4 : 4.7,
      bobPhase: i * 1.4,
    });
  }

  const sampleOut = { x: 0, z: 0, heading: 0 };

  return {
    group,
    update: (dt: number, elapsed: number) => {
      for (let i = 0; i < riders.length; i++) {
        const r = riders[i];
        const pts = r.loopIndex === 0 ? LOOP_CENTRAL : LOOP_NORTH;
        const len = LOOP_LENGTHS[r.loopIndex];
        r.progress = (r.progress + r.speed * dt) % len;
        sampleLoop(pts, len, r.progress, sampleOut);

        const groundY = getSurfaceHeightAt(sampleOut.x, sampleOut.z);
        const slopes = getSurfaceSlopeAngles(sampleOut.x, sampleOut.z, sampleOut.heading);

        r.group.position.set(
          sampleOut.x,
          groundY + Math.abs(Math.sin(elapsed * 5.2 + r.bobPhase)) * 0.025,
          sampleOut.z
        );
        r.group.rotation.order = 'YXZ';
        r.group.rotation.y = sampleOut.heading;
        r.group.rotation.x = slopes.pitch;
        for (let w = 0; w < r.wheels.length; w++) {
          r.wheels[w].rotation.x -= (r.speed * dt) / 0.28;
        }
      }
    },
  };
}

