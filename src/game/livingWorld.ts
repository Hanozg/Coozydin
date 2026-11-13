import * as THREE from 'three';
import { ANCIENT_SIGNPOST_POSITIONS, LANDMARKS } from '../data/efelerData';
import { ColliderBox } from '../types/game';
import { CityMaterialLibrary } from './materials';

/**
 * 1. Growing Fig Tree in the Heart of Kent Meydanı (scales with İncir Puanı)
 */
export interface LivingFigTree {
  group: THREE.Group;
  update: (dt: number, coins: number, elapsed: number) => void;
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

  // Lush Broad Fig Canopy Clusters
  const leafColors = [0x4c7a42, 0x5c8b4d, 0x436d39, 0x679452, 0x538246];
  const canopyOffsets: [number, number, number, number][] = [
    [0, 3.65, 0, 1.65],
    [-1.2, 3.15, 0.7, 1.28],
    [1.25, 3.2, 0.65, 1.26],
    [0.8, 3.15, -1.15, 1.24],
    [-0.95, 3.1, -1.05, 1.22],
  ];
  canopyOffsets.forEach(([cx, cy, cz, r], i) => {
    const leafMat = new THREE.MeshStandardMaterial({
      color: leafColors[i % leafColors.length],
      roughness: 0.8,
    });
    const puff = new THREE.Mesh(new THREE.IcosahedronGeometry(r, 1), leafMat);
    puff.scale.set(1.18, 0.78, 1.18);
    puff.position.set(cx, cy, cz);
    puff.castShadow = true;
    treeScaleGroup.add(puff);
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

  return {
    group,
    update: (dt: number, coins: number, elapsed: number) => {
      // Smoothly grow from sapling (0.42) up to monumental fig tree (1.42) as coins reach 200+
      const targetScale = 0.42 + THREE.MathUtils.clamp(coins / 200, 0, 1) * 1.0;
      currentScale = THREE.MathUtils.damp(currentScale, targetScale, 3.2, dt);
      const sway = Math.sin(elapsed * 1.1) * 0.015;
      treeScaleGroup.scale.setScalar(currentScale);
      treeScaleGroup.rotation.z = sway;

      // Reveal figs gradually starting from 30 coins
      const unlockedFigs = Math.floor(THREE.MathUtils.clamp((coins - 20) / 10, 0, 16));
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
  0xd99b43, 0x3b6e8c, 0xb64b36, 0x586f4e, 0xe6d9c2, 0x7c4d6b, 0xc97b36, 0x4c7b7d,
];

export function createPedestrianSystem(): PedestrianSystem {
  const group = new THREE.Group();
  const count = 64;

  const bodyGeo = new THREE.CapsuleGeometry(0.16, 0.34, 4, 8);
  bodyGeo.translate(0, 0.34, 0);
  const bodyMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.78 });
  const bodyInst = new THREE.InstancedMesh(bodyGeo, bodyMat, count);
  bodyInst.castShadow = true;
  bodyInst.frustumCulled = false;

  const headGeo = new THREE.SphereGeometry(0.135, 10, 8);
  headGeo.translate(0, 0.74, 0);
  const headMat = new THREE.MeshStandardMaterial({ color: 0xefd0b4, roughness: 0.72 });
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
    [18, 26],
    [18, -4],
    [18, -30],
    [28, 12],
    [-28, 12],
    [54, 18],
    [60, 30],
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

        dummy.position.set(a.x, bob, a.z);
        dummy.scale.setScalar(a.scale);
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
    [54, 12],
    [18, -22],
    [18, 48],
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
      poleGroup.position.set(px, 0, pz);
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
    signGroup.position.set(sx, 0, sz);
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
