import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { SandboxTreeKind, SandboxTreeOverrideEntry, SeasonType } from '../types/game';
import { getTerrainHeightAt } from './terrain';

export interface TreePlacement {
  x: number;
  z: number;
  rotY: number;
  scale: number;
  heightScale: number;
  variant: number;
}

export interface ShrubPlacement {
  x: number;
  z: number;
  rotY: number;
  scale: number;
  variant: number;
}

export interface EditableTreeSlot {
  id: string;
  kind: SandboxTreeKind;
  label: string;
  index: number;
  x: number;
  z: number;
  rotY: number;
  scale: number;
  heightScale: number;
  variant: number;
  defaultX: number;
  defaultZ: number;
  defaultRotY: number;
  defaultScale: number;
  deleted: boolean;
  isCustom: boolean;
  liftY: number;
}

export interface SeasonalAtmosphereState {
  season: SeasonType;
  frostFactor: number; // 0..1 (winter + snow accumulation)
  wetFactor: number; // 0..1 (rain + storm wetness)
  windStrength: number; // 0.3..1.8
  lookX: number;
  lookZ: number;
}

export interface SeasonalFoliageSystem {
  group: THREE.Group;
  getTreeRaycastTargets: () => THREE.InstancedMesh[];
  getTreeByInstance: (kind: SandboxTreeKind, instanceId: number) => EditableTreeSlot | null;
  getTree: (id: string) => EditableTreeSlot | null;
  getAllTrees: () => EditableTreeSlot[];
  setTreeTransform: (
    id: string,
    x: number,
    z: number,
    rotY: number,
    scale: number,
    liftY?: number
  ) => EditableTreeSlot | null;
  setTreeDeleted: (id: string, deleted: boolean) => boolean;
  spawnCustomTree: (
    kind: SandboxTreeKind,
    x: number,
    z: number,
    scale?: number,
    rotY?: number,
    forcedId?: string
  ) => EditableTreeSlot | null;
  resetTree: (id: string) => boolean;
  resetAllTrees: () => void;
  exportTreeOverrides: () => SandboxTreeOverrideEntry[];
  hydrateTreeOverrides: (entries: SandboxTreeOverrideEntry[]) => void;
  update: (dt: number, elapsed: number, state: SeasonalAtmosphereState) => void;
  dispose: () => void;
}

function addVertexColorAttribute(geo: THREE.BufferGeometry, topHex: number, bottomHex: number): void {
  const pos = geo.attributes.position as THREE.BufferAttribute;
  let minY = Infinity;
  let maxY = -Infinity;
  for (let i = 0; i < pos.count; i++) {
    const y = pos.getY(i);
    if (y < minY) minY = y;
    if (y > maxY) maxY = y;
  }
  const span = Math.max(0.01, maxY - minY);
  const cTop = new THREE.Color(topHex);
  const cBot = new THREE.Color(bottomHex);
  const c = new THREE.Color();
  const colors = new Float32Array(pos.count * 3);
  for (let i = 0; i < pos.count; i++) {
    const t = THREE.MathUtils.clamp((pos.getY(i) - minY) / span, 0, 1);
    c.copy(cBot).lerp(cTop, t);
    colors[i * 3] = c.r;
    colors[i * 3 + 1] = c.g;
    colors[i * 3 + 2] = c.b;
  }
  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
}

function createOrientedCylinder(
  x0: number,
  y0: number,
  z0: number,
  x1: number,
  y1: number,
  z1: number,
  rBottom: number,
  rTop: number,
  radialSegments = 6
): THREE.BufferGeometry {
  const start = new THREE.Vector3(x0, y0, z0);
  const end = new THREE.Vector3(x1, y1, z1);
  const dir = new THREE.Vector3().subVectors(end, start);
  const len = dir.length();
  const geo = new THREE.CylinderGeometry(rTop, rBottom, len, radialSegments);
  geo.translate(0, len / 2, 0);
  const quat = new THREE.Quaternion().setFromUnitVectors(
    new THREE.Vector3(0, 1, 0),
    dir.clone().normalize()
  );
  geo.applyQuaternion(quat);
  geo.translate(start.x, start.y, start.z);
  return geo;
}

/**
 * Multi-forked storybook broadleaf trunk + spreading branches (matches baharagac.jpeg / agac1.jpeg)
 */
function createBranchingTreeSkeletonGeometry(): THREE.BufferGeometry {
  const parts: THREE.BufferGeometry[] = [];

  // Flared root collar + main trunk
  parts.push(createOrientedCylinder(0, 0, 0, 0, 1.85, 0, 0.34, 0.2, 8));
  parts.push(createOrientedCylinder(0.1, 0, 0.05, 0, 0.65, 0, 0.16, 0.08, 6));
  parts.push(createOrientedCylinder(-0.1, 0, -0.06, 0, 0.65, 0, 0.15, 0.08, 6));

  // 5 spreading primary boughs + forked twigs
  const boughs: [number, number, number, number, number][] = [
    [0.0, 1.05, 0.25, 3.05, 0.12],
    [1.25, 0.92, -0.55, 2.85, 0.1],
    [2.4, 1.15, 0.4, 3.15, 0.11],
    [3.55, 0.98, -0.35, 2.95, 0.1],
    [4.9, 1.05, 0.15, 3.35, 0.11],
  ];

  boughs.forEach(([ang, reach, xShift, topY, rBase], idx) => {
    const bx = Math.cos(ang) * reach * 0.65 + xShift * 0.2;
    const bz = Math.sin(ang) * reach * 0.65;
    const midY = 2.45 + (idx % 2) * 0.16;
    parts.push(createOrientedCylinder(0, 1.68, 0, bx, midY, bz, rBase, rBase * 0.62, 6));

    // Secondary fork A
    const angA = ang + 0.36;
    const ax = bx + Math.cos(angA) * 0.72;
    const az = bz + Math.sin(angA) * 0.72;
    parts.push(createOrientedCylinder(bx, midY, bz, ax, topY + 0.25, az, rBase * 0.62, 0.032, 5));

    // Secondary fork B
    const angB = ang - 0.42;
    const tx = bx + Math.cos(angB) * 0.64;
    const tz = bz + Math.sin(angB) * 0.64;
    parts.push(createOrientedCylinder(bx, midY, bz, tx, topY - 0.08, tz, rBase * 0.56, 0.028, 5));
  });

  // Central crown leader fork
  parts.push(createOrientedCylinder(0, 1.75, 0, 0.08, 3.55, -0.05, 0.11, 0.035, 6));

  const merged = mergeGeometries(parts);
  parts.forEach((p) => p.dispose());
  addVertexColorAttribute(merged, 0xffffff, 0xc7b9aa);
  return merged;
}

/**
 * Multi-lobe illustrated broadleaf canopy cluster with sunlit vertex gradient
 */
function createBroadleafCrownGeometry(): THREE.BufferGeometry {
  const clusters: [number, number, number, number, number, number][] = [
    [0, 3.45, 0, 1.25, 0.96, 1.25],
    [-0.95, 2.95, 0.52, 0.92, 0.76, 0.92],
    [0.98, 3.02, -0.45, 0.94, 0.78, 0.94],
    [0.24, 2.95, 0.95, 0.9, 0.74, 0.9],
    [-0.42, 2.92, -0.88, 0.88, 0.74, 0.88],
    [-0.65, 3.72, -0.22, 0.82, 0.7, 0.82],
    [0.62, 3.75, 0.34, 0.8, 0.68, 0.8],
    [0.12, 4.18, -0.08, 0.76, 0.66, 0.76],
  ];

  const parts: THREE.BufferGeometry[] = clusters.map(([x, y, z, sx, sy, sz]) => {
    const g = new THREE.IcosahedronGeometry(1, 1);
    g.scale(sx, sy, sz);
    g.translate(x, y, z);
    return g;
  });

  const merged = mergeGeometries(parts);
  parts.forEach((p) => p.dispose());
  addVertexColorAttribute(merged, 0xffffff, 0xc8d0c4);
  return merged;
}

/**
 * Base stones around the trunk root collar
 */
function createBaseStonesGeometry(): THREE.BufferGeometry {
  const stones: [number, number, number, number, number, number][] = [
    [-0.45, 0.12, 0.32, 0.24, 0.16, 0.2],
    [0.42, 0.11, 0.28, 0.22, 0.14, 0.18],
    [0.05, 0.1, -0.44, 0.25, 0.14, 0.2],
    [-0.3, 0.08, -0.25, 0.16, 0.11, 0.15],
  ];
  const parts = stones.map(([x, y, z, sx, sy, sz]) => {
    const g = new THREE.IcosahedronGeometry(1, 0);
    g.scale(sx, sy, sz);
    g.translate(x, y, z);
    return g;
  });
  const merged = mergeGeometries(parts);
  parts.forEach((p) => p.dispose());
  return merged;
}

/**
 * Ground mound under broadleaf tree (grass tuft in spring/summer -> snow drift in winter)
 */
function createBaseMoundGeometry(): THREE.BufferGeometry {
  const g = new THREE.CylinderGeometry(0.95, 1.38, 0.22, 10);
  g.translate(0, 0.09, 0);
  return g;
}

/**
 * Winter snow caps along bare branches + 2 tiny perched crimson birds (baharagac.jpeg bottom-right)
 */
function createWinterBirdsGeometry(): THREE.BufferGeometry {
  const parts: THREE.BufferGeometry[] = [];
  const birdSpots: [number, number, number, number][] = [
    [-0.86, 3.04, 0.42, 0.5],
    [0.82, 2.86, -0.34, -0.8],
  ];

  birdSpots.forEach(([bx, by, bz, yaw]) => {
    const body = new THREE.SphereGeometry(0.11, 7, 6);
    body.scale(1.0, 0.92, 1.35);
    body.rotateY(yaw);
    body.translate(bx, by, bz);
    parts.push(body);

    const head = new THREE.SphereGeometry(0.068, 6, 5);
    head.translate(bx + Math.sin(yaw) * 0.09, by + 0.085, bz + Math.cos(yaw) * 0.09);
    parts.push(head);
  });

  const merged = mergeGeometries(parts);
  parts.forEach((p) => p.dispose());
  return merged;
}

/**
 * Low-Poly 3D Faceted Multi-Tiered Pine Crown (matches Screenshot_20261113_192554_Samsung Browser.jpg)
 */
function createLowPolyTieredPineCrownGeometry(): THREE.BufferGeometry {
  const tiers: { y: number; r: number; h: number; segs: number; rot: number; topCol: number; botCol: number }[] = [
    { y: 1.95, r: 1.65, h: 1.65, segs: 10, rot: 0.0, topCol: 0xdff0d8, botCol: 0x99b88e },
    { y: 2.95, r: 1.32, h: 1.5, segs: 9, rot: 0.35, topCol: 0xeaf6e2, botCol: 0xa6c69a },
    { y: 3.92, r: 0.98, h: 1.35, segs: 8, rot: 0.72, topCol: 0xf4fae8, botCol: 0xb6d6aa },
    { y: 4.82, r: 0.62, h: 1.15, segs: 7, rot: 0.2, topCol: 0xffffff, botCol: 0xcbe4be },
  ];

  const parts: THREE.BufferGeometry[] = [];
  tiers.forEach((t, tierIdx) => {
    const cone = new THREE.ConeGeometry(t.r, t.h, t.segs, 2, false);
    const pos = cone.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < pos.count; i++) {
      const vx = pos.getX(i);
      const vy = pos.getY(i);
      const vz = pos.getZ(i);
      const rad = Math.hypot(vx, vz);
      // Add crisp jagged asymmetric skirt spikes on the bottom rim of each pine tier
      if (vy < -t.h * 0.25 && rad > 0.15) {
        const ang = Math.atan2(vz, vx);
        const spoke = Math.round(((ang + Math.PI) / (Math.PI * 2)) * t.segs);
        const flare = spoke % 2 === 0 ? 1.14 : 0.87;
        const droop = spoke % 2 === 0 ? -0.14 : 0.06;
        pos.setX(i, vx * flare);
        pos.setZ(i, vz * flare);
        pos.setY(i, vy + droop);
      } else if (Math.abs(vy) < t.h * 0.22 && rad > 0.1) {
        const ang = Math.atan2(vz, vx);
        const wobble = 1.0 + Math.sin(ang * 3 + tierIdx) * 0.08;
        pos.setX(i, vx * wobble);
        pos.setZ(i, vz * wobble);
      }
    }
    cone.rotateY(t.rot);
    cone.translate(0, t.y, 0);
    const nonIndexed = cone.toNonIndexed();
    cone.dispose();
    nonIndexed.computeVertexNormals();
    addVertexColorAttribute(nonIndexed, t.topCol, t.botCol);
    parts.push(nonIndexed);
  });

  const merged = mergeGeometries(parts);
  parts.forEach((p) => p.dispose());
  return merged;
}

function createLowPolyPineTrunkGeometry(): THREE.BufferGeometry {
  const geo = new THREE.CylinderGeometry(0.18, 0.4, 1.55, 7);
  geo.translate(0, 0.77, 0);
  const nonIndexed = geo.toNonIndexed();
  geo.dispose();
  nonIndexed.computeVertexNormals();
  return nonIndexed;
}

const SEASON_BROADLEAF_PALETTES: Record<SeasonType, number[]> = {
  spring: [0xf7b9ce, 0xfbe1ea, 0xf29eb9, 0x8cc85a, 0xf6c9d7, 0x9cd26a],
  summer: [0x5a9742, 0x6ca94f, 0x4b8539, 0x7eb85c, 0x609c46],
  autumn: [0xe6842c, 0xf1ac3c, 0xc95322, 0xe89731, 0xd86927],
  winter: [0xdbe6ef, 0xdbe6ef, 0xdbe6ef, 0xdbe6ef, 0xdbe6ef],
};

const SEASON_PINE_PALETTES: Record<SeasonType, number[]> = {
  spring: [0x6bb847, 0x5aa63d, 0x7ac354],
  summer: [0x589d3e, 0x4b8c35, 0x69ac49],
  autumn: [0x4c7e3b, 0x5c8942, 0xc77e32],
  winter: [0xc3ded8, 0xd5e9e7, 0x8db6aa],
};

const SEASON_SHRUB_PALETTES: Record<SeasonType, number[]> = {
  spring: [0x76b050, 0xf2a5be, 0x89bf5e, 0xf7cbd9],
  summer: [0x639143, 0x76a451, 0xc46b89, 0xd88e47],
  autumn: [0xd97d34, 0xc45828, 0x8e8342, 0xe3a53f],
  winter: [0x9cb3ad, 0xcfe0e4, 0x849c96, 0xdae6ea],
};

const SEASON_PALM_PALETTES: Record<SeasonType, number[]> = {
  spring: [0x6ca34a, 0x7db357],
  summer: [0x628f44, 0x769f50],
  autumn: [0x768d46, 0x929446],
  winter: [0x8ea99a, 0xa8c0b6],
};

export function createSeasonalFoliageSystem(
  broadleafSpots: TreePlacement[],
  pineSpots: TreePlacement[],
  palmSpots: TreePlacement[],
  shrubSpots: ShrubPlacement[]
): SeasonalFoliageSystem {
  const group = new THREE.Group();
  const disposables: { dispose: () => void }[] = [];

  // --- 1. Multi-Forked Seasonal Broadleaf Trees ---
  const trunkGeo = createBranchingTreeSkeletonGeometry();
  const trunkMat = new THREE.MeshStandardMaterial({
    color: 0x6b4b32,
    vertexColors: true,
    roughness: 0.92,
  });
  const crownGeo = createBroadleafCrownGeometry();
  const crownMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    vertexColors: true,
    roughness: 0.84,
  });
  const stoneGeo = createBaseStonesGeometry();
  const stoneMat = new THREE.MeshStandardMaterial({ color: 0xb9aa94, roughness: 0.92 });
  const moundGeo = createBaseMoundGeometry();
  const moundMat = new THREE.MeshStandardMaterial({ color: 0x7fa352, roughness: 0.92 });
  const birdGeo = createWinterBirdsGeometry();
  const birdMat = new THREE.MeshStandardMaterial({ color: 0xd6392e, roughness: 0.65 });

  disposables.push(
    trunkGeo,
    trunkMat,
    crownGeo,
    crownMat,
    stoneGeo,
    stoneMat,
    moundGeo,
    moundMat,
    birdGeo,
    birdMat
  );

  const EXTRA_TREE_CAPACITY = 80;
  const MAP_RAYCAST_SPHERE = new THREE.Sphere(new THREE.Vector3(0, 12, 0), 460);

  const blCap = Math.max(1, broadleafSpots.length + EXTRA_TREE_CAPACITY);
  const blTrunks = new THREE.InstancedMesh(trunkGeo, trunkMat, blCap);
  const blCrowns = new THREE.InstancedMesh(crownGeo, crownMat, blCap);
  const blStones = new THREE.InstancedMesh(stoneGeo, stoneMat, blCap);
  const blMounds = new THREE.InstancedMesh(moundGeo, moundMat, blCap);
  const blBirds = new THREE.InstancedMesh(birdGeo, birdMat, blCap);

  blTrunks.count = broadleafSpots.length;
  blCrowns.count = broadleafSpots.length;
  blStones.count = broadleafSpots.length;
  blMounds.count = broadleafSpots.length;
  blBirds.count = broadleafSpots.length;
  blTrunks.userData.sandboxTreeKind = 'broadleaf';
  blCrowns.userData.sandboxTreeKind = 'broadleaf';

  blTrunks.castShadow = false;
  blTrunks.receiveShadow = true;
  blCrowns.castShadow = true;
  blCrowns.receiveShadow = true;
  blStones.receiveShadow = true;
  blMounds.receiveShadow = true;

  const dummy = new THREE.Object3D();
  const broadleafBaseY: number[] = [];
  const treeSlotMap = new Map<string, EditableTreeSlot>();
  const blSlots: EditableTreeSlot[] = [];
  const pineSlots: EditableTreeSlot[] = [];
  const palmSlots: EditableTreeSlot[] = [];

  broadleafSpots.forEach((spot, i) => {
    const gy = getTerrainHeightAt(spot.x, spot.z);
    broadleafBaseY.push(gy);
    const slot: EditableTreeSlot = {
      id: `tree:broadleaf:${i}`,
      kind: 'broadleaf',
      label: `Çınar / Zeytin Ağacı #${i + 1}`,
      index: i,
      x: spot.x,
      z: spot.z,
      rotY: spot.rotY,
      scale: spot.scale,
      heightScale: spot.heightScale,
      variant: spot.variant,
      defaultX: spot.x,
      defaultZ: spot.z,
      defaultRotY: spot.rotY,
      defaultScale: spot.scale,
      deleted: false,
      isCustom: false,
      liftY: 0,
    };
    blSlots.push(slot);
    treeSlotMap.set(slot.id, slot);
    dummy.position.set(spot.x, gy, spot.z);
    dummy.rotation.set(0, spot.rotY, 0);
    dummy.scale.set(spot.scale, spot.scale * spot.heightScale, spot.scale);
    dummy.updateMatrix();
    blTrunks.setMatrixAt(i, dummy.matrix);
    blCrowns.setMatrixAt(i, dummy.matrix);
    blStones.setMatrixAt(i, dummy.matrix);
    blMounds.setMatrixAt(i, dummy.matrix);
    blBirds.setMatrixAt(i, dummy.matrix);
  });

  [blTrunks, blCrowns, blStones, blMounds, blBirds].forEach((inst) => {
    inst.frustumCulled = false;
    inst.boundingSphere = MAP_RAYCAST_SPHERE;
    inst.instanceMatrix.needsUpdate = true;
    group.add(inst);
  });

  // --- 2. Low-Poly 3D Faceted Tiered Pines (Screenshot_20261113_192554 style) ---
  const pineTrunkGeo = createLowPolyPineTrunkGeometry();
  const pineTrunkMat = new THREE.MeshStandardMaterial({
    color: 0x8e5232,
    roughness: 0.88,
    flatShading: true,
  });
  const pineCrownGeo = createLowPolyTieredPineCrownGeometry();
  const pineCrownMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    vertexColors: true,
    roughness: 0.78,
    flatShading: true,
  });
  disposables.push(pineTrunkGeo, pineTrunkMat, pineCrownGeo, pineCrownMat);

  const pCap = Math.max(1, pineSpots.length + EXTRA_TREE_CAPACITY);
  const pineTrunks = new THREE.InstancedMesh(pineTrunkGeo, pineTrunkMat, pCap);
  const pineCrowns = new THREE.InstancedMesh(pineCrownGeo, pineCrownMat, pCap);
  pineTrunks.count = pineSpots.length;
  pineCrowns.count = pineSpots.length;
  pineTrunks.userData.sandboxTreeKind = 'pine';
  pineCrowns.userData.sandboxTreeKind = 'pine';
  pineTrunks.castShadow = false;
  pineCrowns.castShadow = true;
  pineCrowns.receiveShadow = true;

  const pineBaseY: number[] = [];
  pineSpots.forEach((spot, i) => {
    const gy = getTerrainHeightAt(spot.x, spot.z);
    pineBaseY.push(gy);
    const slot: EditableTreeSlot = {
      id: `tree:pine:${i}`,
      kind: 'pine',
      label: `Fıstık Çamı #${i + 1}`,
      index: i,
      x: spot.x,
      z: spot.z,
      rotY: spot.rotY,
      scale: spot.scale,
      heightScale: spot.heightScale,
      variant: spot.variant,
      defaultX: spot.x,
      defaultZ: spot.z,
      defaultRotY: spot.rotY,
      defaultScale: spot.scale,
      deleted: false,
      isCustom: false,
      liftY: 0,
    };
    pineSlots.push(slot);
    treeSlotMap.set(slot.id, slot);
    dummy.position.set(spot.x, gy, spot.z);
    dummy.rotation.set(0, spot.rotY, 0);
    dummy.scale.set(spot.scale, spot.scale * spot.heightScale, spot.scale);
    dummy.updateMatrix();
    pineTrunks.setMatrixAt(i, dummy.matrix);
    pineCrowns.setMatrixAt(i, dummy.matrix);
  });
  [pineTrunks, pineCrowns].forEach((inst) => {
    inst.frustumCulled = false;
    inst.boundingSphere = MAP_RAYCAST_SPHERE;
    inst.instanceMatrix.needsUpdate = true;
    group.add(inst);
  });

  // --- 3. Boulevard Palms ---
  const palmParts: THREE.BufferGeometry[] = [];
  const frondCount = 8;
  for (let i = 0; i < frondCount; i++) {
    const angle = (i * Math.PI * 2) / frondCount;
    const blade = new THREE.BoxGeometry(0.46, 0.1, 2.45);
    blade.translate(0, 0, 1.18);
    blade.rotateX(0.32);
    blade.rotateY(angle);
    blade.translate(0, 5.5, 0);
    palmParts.push(blade);

    const topBlade = new THREE.BoxGeometry(0.34, 0.08, 1.7);
    topBlade.translate(0, 0, 0.82);
    topBlade.rotateX(-0.18);
    topBlade.rotateY(angle + 0.35);
    topBlade.translate(0, 5.66, 0);
    palmParts.push(topBlade);
  }
  const palmCrownGeo = mergeGeometries(palmParts);
  palmParts.forEach((p) => p.dispose());
  const palmTrunkGeo = new THREE.CylinderGeometry(0.16, 0.28, 5.4, 8);
  palmTrunkGeo.translate(0, 2.7, 0);
  const palmTrunkMat = new THREE.MeshStandardMaterial({ color: 0x826549, roughness: 0.9 });
  const palmCrownMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.72 });
  disposables.push(palmCrownGeo, palmTrunkGeo, palmTrunkMat, palmCrownMat);

  const palmCap = Math.max(1, palmSpots.length + EXTRA_TREE_CAPACITY);
  const palmTrunks = new THREE.InstancedMesh(palmTrunkGeo, palmTrunkMat, palmCap);
  const palmCrowns = new THREE.InstancedMesh(palmCrownGeo, palmCrownMat, palmCap);
  palmTrunks.count = palmSpots.length;
  palmCrowns.count = palmSpots.length;
  palmTrunks.userData.sandboxTreeKind = 'palm';
  palmCrowns.userData.sandboxTreeKind = 'palm';
  palmTrunks.castShadow = false;
  palmCrowns.castShadow = true;

  const palmBaseY: number[] = [];
  palmSpots.forEach((spot, i) => {
    const gy = getTerrainHeightAt(spot.x, spot.z);
    palmBaseY.push(gy);
    const slot: EditableTreeSlot = {
      id: `tree:palm:${i}`,
      kind: 'palm',
      label: `Bulvar Palmiyesi #${i + 1}`,
      index: i,
      x: spot.x,
      z: spot.z,
      rotY: spot.rotY,
      scale: spot.scale,
      heightScale: spot.heightScale,
      variant: spot.variant,
      defaultX: spot.x,
      defaultZ: spot.z,
      defaultRotY: spot.rotY,
      defaultScale: spot.scale,
      deleted: false,
      isCustom: false,
      liftY: 0,
    };
    palmSlots.push(slot);
    treeSlotMap.set(slot.id, slot);
    dummy.position.set(spot.x, gy, spot.z);
    dummy.rotation.set(0, spot.rotY, 0);
    dummy.scale.setScalar(spot.scale);
    dummy.updateMatrix();
    palmTrunks.setMatrixAt(i, dummy.matrix);
    palmCrowns.setMatrixAt(i, dummy.matrix);
  });
  [palmTrunks, palmCrowns].forEach((inst) => {
    inst.frustumCulled = false;
    inst.boundingSphere = MAP_RAYCAST_SPHERE;
    inst.instanceMatrix.needsUpdate = true;
    group.add(inst);
  });

  // --- 4. Seasonal Flowering Shrubs ---
  const shrubGeo = new THREE.IcosahedronGeometry(0.55, 1);
  shrubGeo.scale(1.25, 0.78, 1.25);
  shrubGeo.translate(0, 0.35, 0);
  const shrubMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.86 });
  disposables.push(shrubGeo, shrubMat);

  const sCount = Math.max(1, shrubSpots.length);
  const shrubInst = new THREE.InstancedMesh(shrubGeo, shrubMat, sCount);
  shrubInst.castShadow = false;
  shrubSpots.forEach((spot, i) => {
    dummy.position.set(spot.x, getTerrainHeightAt(spot.x, spot.z), spot.z);
    dummy.rotation.set(0, spot.rotY, 0);
    dummy.scale.setScalar(spot.scale);
    dummy.updateMatrix();
    shrubInst.setMatrixAt(i, dummy.matrix);
  });
  shrubInst.instanceMatrix.needsUpdate = true;
  shrubInst.computeBoundingSphere();
  group.add(shrubInst);

  // --- 5. Floating Seasonal Petals (Spring) & Falling Leaves (Autumn) ---
  const driftCount = 36;
  const driftGeo = new THREE.PlaneGeometry(0.24, 0.16);
  const driftMat = new THREE.MeshBasicMaterial({
    color: 0xffffff,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.85,
  });
  disposables.push(driftGeo, driftMat);
  const driftMesh = new THREE.InstancedMesh(driftGeo, driftMat, driftCount);
  driftMesh.frustumCulled = false;
  group.add(driftMesh);

  const driftParticles = Array.from({ length: driftCount }, (_, i) => ({
    ox: (Math.random() - 0.5) * 64,
    y: 1.5 + Math.random() * 14,
    oz: (Math.random() - 0.5) * 64,
    speed: 0.65 + Math.random() * 0.65,
    phase: i * 0.73,
  }));

  // Smoothly interpolated seasonal weights (zero per-frame alloc)
  const seasonW = { spring: 1, summer: 0, autumn: 0, winter: 0 };
  const cSpr = new THREE.Color();
  const cSum = new THREE.Color();
  const cAut = new THREE.Color();
  const cWin = new THREE.Color();
  const cFrost = new THREE.Color(0xeef5fb);
  const cBarkNormal = new THREE.Color(0x6b4b32);
  const cBarkWinter = new THREE.Color(0x8c8782);
  const cMoundGreen = new THREE.Color(0x7ca34e);
  const cMoundAutumn = new THREE.Color(0xc47e36);
  const cMoundSnow = new THREE.Color(0xf2f7fc);
  const cTmp = new THREE.Color();
  const petalPalette = [0xf8b9ce, 0xfde2ec, 0xf29cb8];
  const leafPalette = [0xe57a25, 0xf2aa3b, 0xc74d20];

  const blendSeasonalColor = (
    palettes: Record<SeasonType, number[]>,
    idx: number,
    frost: number,
    out: THREE.Color
  ) => {
    const pSpr = palettes.spring;
    const pSum = palettes.summer;
    const pAut = palettes.autumn;
    const pWin = palettes.winter;
    cSpr.setHex(pSpr[idx % pSpr.length]);
    cSum.setHex(pSum[idx % pSum.length]);
    cAut.setHex(pAut[idx % pAut.length]);
    cWin.setHex(pWin[idx % pWin.length]);
    out.setRGB(
      cSpr.r * seasonW.spring + cSum.r * seasonW.summer + cAut.r * seasonW.autumn + cWin.r * seasonW.winter,
      cSpr.g * seasonW.spring + cSum.g * seasonW.summer + cAut.g * seasonW.autumn + cWin.g * seasonW.winter,
      cSpr.b * seasonW.spring + cSum.b * seasonW.summer + cAut.b * seasonW.autumn + cWin.b * seasonW.winter
    );
    if (frost > 0.01) {
      out.lerp(cFrost, frost * 0.52);
    }
  };

  let prevSnowMode = -1;
  let swayAccum = 1; // Trigger update on first frame
  let colorsDirty = true;
  let lastSpringW = -1;
  let lastSummerW = -1;
  let lastAutumnW = -1;
  let lastWinterW = -1;
  let lastFrost = -1;
  let customTreeSeq = 1;

  const syncSlotMatrix = (slot: EditableTreeSlot) => {
    if (slot.deleted) {
      dummy.position.set(0, -999, 0);
      dummy.rotation.set(0, 0, 0);
      dummy.scale.set(0, 0, 0);
      dummy.updateMatrix();
    } else {
      const gy = getTerrainHeightAt(slot.x, slot.z);
      if (slot.kind === 'broadleaf') broadleafBaseY[slot.index] = gy;
      else if (slot.kind === 'pine') pineBaseY[slot.index] = gy;
      else palmBaseY[slot.index] = gy;

      dummy.position.set(slot.x, gy + slot.liftY, slot.z);
      dummy.rotation.set(0, slot.rotY, 0);
      if (slot.kind === 'palm') {
        dummy.scale.setScalar(slot.scale);
      } else {
        dummy.scale.set(slot.scale, slot.scale * slot.heightScale, slot.scale);
      }
      dummy.updateMatrix();
    }

    if (slot.kind === 'broadleaf') {
      blTrunks.setMatrixAt(slot.index, dummy.matrix);
      blCrowns.setMatrixAt(slot.index, dummy.matrix);
      blStones.setMatrixAt(slot.index, dummy.matrix);
      blMounds.setMatrixAt(slot.index, dummy.matrix);
      blBirds.setMatrixAt(slot.index, dummy.matrix);
      blTrunks.instanceMatrix.needsUpdate = true;
      blCrowns.instanceMatrix.needsUpdate = true;
      blStones.instanceMatrix.needsUpdate = true;
      blMounds.instanceMatrix.needsUpdate = true;
      blBirds.instanceMatrix.needsUpdate = true;
    } else if (slot.kind === 'pine') {
      pineTrunks.setMatrixAt(slot.index, dummy.matrix);
      pineCrowns.setMatrixAt(slot.index, dummy.matrix);
      pineTrunks.instanceMatrix.needsUpdate = true;
      pineCrowns.instanceMatrix.needsUpdate = true;
    } else {
      palmTrunks.setMatrixAt(slot.index, dummy.matrix);
      palmCrowns.setMatrixAt(slot.index, dummy.matrix);
      palmTrunks.instanceMatrix.needsUpdate = true;
      palmCrowns.instanceMatrix.needsUpdate = true;
    }
  };

  const spawnCustomTree = (
    kind: SandboxTreeKind,
    x: number,
    z: number,
    scale = 1.0,
    rotY = 0,
    forcedId?: string
  ): EditableTreeSlot | null => {
    const cx = THREE.MathUtils.clamp(x, -216, 190);
    const cz = THREE.MathUtils.clamp(z, -134, 106);
    const sc = THREE.MathUtils.clamp(scale, 0.5, 2.2);

    const arr = kind === 'broadleaf' ? blSlots : kind === 'pine' ? pineSlots : palmSlots;
    const cap = kind === 'broadleaf' ? blCap : kind === 'pine' ? pCap : palmCap;
    const baseYArr = kind === 'broadleaf' ? broadleafBaseY : kind === 'pine' ? pineBaseY : palmBaseY;

    // Reuse a previously deleted custom slot if capacity is full
    let slotIndex = arr.length;
    if (slotIndex >= cap) {
      const reusable = arr.find((s) => s.isCustom && s.deleted);
      if (!reusable) return null;
      treeSlotMap.delete(reusable.id);
      slotIndex = reusable.index;
    }

    const id = forcedId ?? `custom_tree_${kind}_${Date.now().toString(36)}_${customTreeSeq++}`;
    const label =
      kind === 'broadleaf'
        ? 'Eklenen Çınar / Zeytin'
        : kind === 'pine'
          ? 'Eklenen Fıstık Çamı'
          : 'Eklenen Bulvar Palmiyesi';

    const slot: EditableTreeSlot = {
      id,
      kind,
      label,
      index: slotIndex,
      x: cx,
      z: cz,
      rotY,
      scale: sc,
      heightScale: kind === 'palm' ? 1 : 1.02,
      variant: slotIndex,
      defaultX: cx,
      defaultZ: cz,
      defaultRotY: rotY,
      defaultScale: sc,
      deleted: false,
      isCustom: true,
      liftY: 0,
    };

    if (slotIndex === arr.length) {
      arr.push(slot);
      baseYArr.push(getTerrainHeightAt(cx, cz));
      if (kind === 'broadleaf') {
        blTrunks.count = arr.length;
        blCrowns.count = arr.length;
        blStones.count = arr.length;
        blMounds.count = arr.length;
        blBirds.count = arr.length;
      } else if (kind === 'pine') {
        pineTrunks.count = arr.length;
        pineCrowns.count = arr.length;
      } else {
        palmTrunks.count = arr.length;
        palmCrowns.count = arr.length;
      }
    } else {
      arr[slotIndex] = slot;
    }

    treeSlotMap.set(id, slot);
    syncSlotMatrix(slot);
    colorsDirty = true;
    return slot;
  };

  const isSlotEdited = (s: EditableTreeSlot): boolean => {
    if (s.isCustom) return !s.deleted;
    if (s.deleted) return true;
    return (
      Math.hypot(s.x - s.defaultX, s.z - s.defaultZ) > 0.15 ||
      Math.abs(s.scale - s.defaultScale) > 0.03 ||
      Math.abs(s.rotY - s.defaultRotY) > 0.05
    );
  };

  return {
    group,
    getTreeRaycastTargets: () => [
      blCrowns,
      blTrunks,
      pineCrowns,
      pineTrunks,
      palmCrowns,
      palmTrunks,
    ],
    getTreeByInstance: (kind, instanceId) => {
      const arr = kind === 'broadleaf' ? blSlots : kind === 'pine' ? pineSlots : palmSlots;
      const slot = arr[instanceId];
      if (!slot || slot.deleted) return null;
      return slot;
    },
    getTree: (id) => treeSlotMap.get(id) ?? null,
    getAllTrees: () => [...blSlots, ...pineSlots, ...palmSlots],
    setTreeTransform: (id, x, z, rotY, scale, liftY = 0) => {
      const slot = treeSlotMap.get(id);
      if (!slot || slot.deleted) return null;
      slot.x = THREE.MathUtils.clamp(x, -216, 190);
      slot.z = THREE.MathUtils.clamp(z, -134, 106);
      slot.rotY = rotY;
      slot.scale = THREE.MathUtils.clamp(scale, 0.5, 2.2);
      slot.liftY = liftY;
      syncSlotMatrix(slot);
      return slot;
    },
    setTreeDeleted: (id, deleted) => {
      const slot = treeSlotMap.get(id);
      if (!slot) return false;
      slot.deleted = deleted;
      slot.liftY = 0;
      syncSlotMatrix(slot);
      if (!deleted) colorsDirty = true;
      return true;
    },
    spawnCustomTree,
    resetTree: (id) => {
      const slot = treeSlotMap.get(id);
      if (!slot) return false;
      if (slot.isCustom) {
        slot.deleted = true;
        slot.liftY = 0;
        syncSlotMatrix(slot);
        return true;
      }
      slot.x = slot.defaultX;
      slot.z = slot.defaultZ;
      slot.rotY = slot.defaultRotY;
      slot.scale = slot.defaultScale;
      slot.deleted = false;
      slot.liftY = 0;
      syncSlotMatrix(slot);
      colorsDirty = true;
      return true;
    },
    resetAllTrees: () => {
      treeSlotMap.forEach((slot) => {
        if (slot.isCustom) {
          slot.deleted = true;
        } else {
          slot.x = slot.defaultX;
          slot.z = slot.defaultZ;
          slot.rotY = slot.defaultRotY;
          slot.scale = slot.defaultScale;
          slot.deleted = false;
        }
        slot.liftY = 0;
        syncSlotMatrix(slot);
      });
      colorsDirty = true;
    },
    exportTreeOverrides: () => {
      const out: SandboxTreeOverrideEntry[] = [];
      treeSlotMap.forEach((slot) => {
        if (!isSlotEdited(slot)) return;
        out.push({
          id: slot.id,
          kind: slot.kind,
          x: Math.round(slot.x * 100) / 100,
          z: Math.round(slot.z * 100) / 100,
          rotY: Math.round(slot.rotY * 1000) / 1000,
          scale: Math.round(slot.scale * 100) / 100,
          deleted: slot.deleted || undefined,
          isCustom: slot.isCustom || undefined,
        });
      });
      return out;
    },
    hydrateTreeOverrides: (entries) => {
      for (const entry of entries) {
        if (!entry || typeof entry.id !== 'string') continue;
        const existing = treeSlotMap.get(entry.id);
        if (existing) {
          existing.x = THREE.MathUtils.clamp(entry.x, -216, 190);
          existing.z = THREE.MathUtils.clamp(entry.z, -134, 106);
          existing.rotY = entry.rotY;
          existing.scale = THREE.MathUtils.clamp(entry.scale, 0.5, 2.2);
          existing.deleted = Boolean(entry.deleted);
          existing.liftY = 0;
          syncSlotMatrix(existing);
        } else if (entry.isCustom && !entry.deleted) {
          spawnCustomTree(entry.kind, entry.x, entry.z, entry.scale, entry.rotY, entry.id);
        }
      }
      colorsDirty = true;
    },
    update: (dt: number, elapsed: number, state: SeasonalAtmosphereState) => {
      const rate = Math.min(1, dt * 1.4);
      seasonW.spring = THREE.MathUtils.lerp(seasonW.spring, state.season === 'spring' ? 1 : 0, rate);
      seasonW.summer = THREE.MathUtils.lerp(seasonW.summer, state.season === 'summer' ? 1 : 0, rate);
      seasonW.autumn = THREE.MathUtils.lerp(seasonW.autumn, state.season === 'autumn' ? 1 : 0, rate);
      seasonW.winter = THREE.MathUtils.lerp(seasonW.winter, state.season === 'winter' ? 1 : 0, rate);

      const leafPresence = THREE.MathUtils.clamp(1 - seasonW.winter * 1.08, 0, 1);
      const winterBirdPresence = THREE.MathUtils.smoothstep(seasonW.winter, 0.35, 0.92);
      const snowBlend = THREE.MathUtils.clamp(Math.max(seasonW.winter * 0.92, state.frostFactor), 0, 1);

      if (
        Math.abs(seasonW.spring - lastSpringW) > 0.006 ||
        Math.abs(seasonW.summer - lastSummerW) > 0.006 ||
        Math.abs(seasonW.autumn - lastAutumnW) > 0.006 ||
        Math.abs(seasonW.winter - lastWinterW) > 0.006 ||
        Math.abs(state.frostFactor - lastFrost) > 0.008
      ) {
        colorsDirty = true;
        lastSpringW = seasonW.spring;
        lastSummerW = seasonW.summer;
        lastAutumnW = seasonW.autumn;
        lastWinterW = seasonW.winter;
        lastFrost = state.frostFactor;
      }

      if (colorsDirty) {
        trunkMat.color.copy(cBarkNormal).lerp(cBarkWinter, snowBlend * 0.72);
        moundMat.color
          .copy(cMoundGreen)
          .lerp(cMoundAutumn, seasonW.autumn * 0.85)
          .lerp(cMoundSnow, snowBlend);
      }

      swayAccum += dt;
      const shouldUpdateMatrices = swayAccum >= 0.08 || colorsDirty;
      if (shouldUpdateMatrices) {
        swayAccum = 0;

        const showCrowns = leafPresence > 0.03;
        const showBirds = winterBirdPresence > 0.03;
        blCrowns.visible = showCrowns;
        blBirds.visible = showBirds;
        const maxSwayDistSq = 95 * 95;
        let blMoved = colorsDirty;
        let pineMoved = colorsDirty;
        let palmMoved = colorsDirty;

        for (let i = 0; i < blSlots.length; i++) {
          const spot = blSlots[i];
          if (spot.deleted) continue;
          const dx = spot.x - state.lookX;
          const dz = spot.z - state.lookZ;
          if (!colorsDirty && dx * dx + dz * dz > maxSwayDistSq) continue;
          const gy = broadleafBaseY[i] + spot.liftY;
          const swayZ = Math.sin(elapsed * (1.2 + state.windStrength * 0.45) + i * 0.7) * 0.025 * state.windStrength;
          const swayX = Math.cos(elapsed * 1.05 + i * 1.1) * 0.018 * state.windStrength;

          if (showCrowns) {
            const crownS = spot.scale * Math.max(0.001, leafPresence);
            dummy.position.set(spot.x, gy, spot.z);
            dummy.rotation.set(swayX, spot.rotY, swayZ);
            dummy.scale.set(crownS, crownS * spot.heightScale, crownS);
            dummy.updateMatrix();
            blCrowns.setMatrixAt(i, dummy.matrix);
            blMoved = true;
          }

          if (showBirds) {
            const birdS = spot.scale * Math.max(0.001, winterBirdPresence);
            dummy.position.set(spot.x, gy, spot.z);
            dummy.rotation.set(swayX, spot.rotY, swayZ);
            dummy.scale.set(birdS, birdS * spot.heightScale, birdS);
            dummy.updateMatrix();
            blBirds.setMatrixAt(i, dummy.matrix);
            blMoved = true;
          }

          if (colorsDirty) {
            blendSeasonalColor(SEASON_BROADLEAF_PALETTES, spot.variant, state.frostFactor * 0.7, cTmp);
            blCrowns.setColorAt(i, cTmp);
          }
        }
        if (showCrowns && blMoved) blCrowns.instanceMatrix.needsUpdate = true;
        if (showBirds && blMoved) blBirds.instanceMatrix.needsUpdate = true;
        if (colorsDirty && blCrowns.instanceColor) blCrowns.instanceColor.needsUpdate = true;

        for (let i = 0; i < pineSlots.length; i++) {
          const spot = pineSlots[i];
          if (spot.deleted) continue;
          const dx = spot.x - state.lookX;
          const dz = spot.z - state.lookZ;
          if (!colorsDirty && dx * dx + dz * dz > maxSwayDistSq) continue;
          const gy = pineBaseY[i] + spot.liftY;
          const swayZ = Math.sin(elapsed * 1.4 + i * 0.9) * 0.022 * state.windStrength;
          dummy.position.set(spot.x, gy, spot.z);
          dummy.rotation.set(0, spot.rotY, swayZ);
          dummy.scale.set(spot.scale, spot.scale * spot.heightScale, spot.scale);
          dummy.updateMatrix();
          pineCrowns.setMatrixAt(i, dummy.matrix);
          pineMoved = true;

          if (colorsDirty) {
            blendSeasonalColor(SEASON_PINE_PALETTES, spot.variant, state.frostFactor * 0.68, cTmp);
            pineCrowns.setColorAt(i, cTmp);
          }
        }
        if (pineMoved) pineCrowns.instanceMatrix.needsUpdate = true;
        if (colorsDirty && pineCrowns.instanceColor) pineCrowns.instanceColor.needsUpdate = true;

        for (let i = 0; i < palmSlots.length; i++) {
          const spot = palmSlots[i];
          if (spot.deleted) continue;
          const dx = spot.x - state.lookX;
          const dz = spot.z - state.lookZ;
          if (!colorsDirty && dx * dx + dz * dz > maxSwayDistSq) continue;
          const gy = palmBaseY[i] + spot.liftY;
          const swayZ = Math.sin(elapsed * 1.5 + i * 0.6) * 0.03 * state.windStrength;
          dummy.position.set(spot.x, gy, spot.z);
          dummy.rotation.set(0, spot.rotY, swayZ);
          dummy.scale.setScalar(spot.scale);
          dummy.updateMatrix();
          palmCrowns.setMatrixAt(i, dummy.matrix);
          palmMoved = true;

          if (colorsDirty) {
            blendSeasonalColor(SEASON_PALM_PALETTES, spot.variant, state.frostFactor * 0.45, cTmp);
            palmCrowns.setColorAt(i, cTmp);
          }
        }
        if (palmMoved) palmCrowns.instanceMatrix.needsUpdate = true;
        if (colorsDirty && palmCrowns.instanceColor) palmCrowns.instanceColor.needsUpdate = true;

        if (colorsDirty) {
          for (let i = 0; i < shrubSpots.length; i++) {
            blendSeasonalColor(SEASON_SHRUB_PALETTES, shrubSpots[i].variant, state.frostFactor * 0.72, cTmp);
            shrubInst.setColorAt(i, cTmp);
          }
          if (shrubInst.instanceColor) shrubInst.instanceColor.needsUpdate = true;
          colorsDirty = false;
        }
      }

      // Floating Spring Blossom Petals & Autumn Falling Leaves
      const particleWeight = Math.max(seasonW.spring, seasonW.autumn);
      const isAutumnMode = seasonW.autumn > seasonW.spring ? 1 : 0;
      if (particleWeight > 0.12 && state.frostFactor < 0.6) {
        driftMesh.visible = true;
        driftMat.opacity = 0.84 * particleWeight * (1 - state.frostFactor * 0.8);
        const baseGroundY = getTerrainHeightAt(state.lookX, state.lookZ);
        for (let i = 0; i < driftCount; i++) {
          const p = driftParticles[i];
          p.y -= (0.8 + p.speed * 0.65) * dt;
          p.ox += (Math.sin(elapsed * 1.2 + p.phase) * 0.9 + state.windStrength * 0.6) * dt;
          if (p.y < 0.25) {
            p.y = 11 + (i % 5) * 1.4;
            p.ox = (Math.random() - 0.5) * 62;
            p.oz = (Math.random() - 0.5) * 62;
          }
          const wx = state.lookX + p.ox;
          const wz = state.lookZ + p.oz;
          dummy.position.set(wx, baseGroundY + p.y, wz);
          dummy.rotation.set(
            elapsed * 1.8 + p.phase,
            elapsed * 1.3 + p.phase,
            Math.sin(elapsed * 2.1 + p.phase) * 0.8
          );
          const s = isAutumnMode ? 1.2 : 0.95;
          dummy.scale.setScalar(s);
          dummy.updateMatrix();
          driftMesh.setMatrixAt(i, dummy.matrix);

          if (prevSnowMode !== isAutumnMode) {
            cTmp.setHex(
              isAutumnMode
                ? leafPalette[i % leafPalette.length]
                : petalPalette[i % petalPalette.length]
            );
            driftMesh.setColorAt(i, cTmp);
          }
        }
        driftMesh.instanceMatrix.needsUpdate = true;
        if (prevSnowMode !== isAutumnMode && driftMesh.instanceColor) {
          driftMesh.instanceColor.needsUpdate = true;
        }
        prevSnowMode = isAutumnMode;
      } else {
        driftMesh.visible = false;
      }
    },
    dispose: () => {
      disposables.forEach((d) => d.dispose());
    },
  };
}
