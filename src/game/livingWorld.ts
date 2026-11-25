import * as THREE from 'three';
import { RAIL_TRACK_Z } from '../data/aydinRoads';
import { ANCIENT_SIGNPOST_POSITIONS, LANDMARKS } from '../data/efelerData';
import { ColliderBox, SeasonType } from '../types/game';
import { CityMaterialLibrary } from './materials';
import { mergeStaticGroupMeshes } from './meshMerge';
import {
  createArticulatedPedestrianGeos,
  createSculptedHumanRig,
  SCULPTED_HUMAN_SCALE,
  SculptedHumanRig,
} from './sculptedHumans';
import { getTerrainHeightAt, getWalkableSlopeAngles, getWalkableSurfaceHeightAt } from './terrain';

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
  group.position.set(0, getTerrainHeightAt(0, 19.8), 19.8);

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
    const puff = new THREE.Mesh(new THREE.IcosahedronGeometry(r, 1), leafMat);
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
  let figColorSettleTimer = 4.0;
  let lastFigStateKey = '';

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
      if (Math.abs(currentScale - targetScale) > 0.002) {
        currentScale = THREE.MathUtils.damp(currentScale, targetScale, 3.2, dt);
        treeScaleGroup.scale.setScalar(currentScale);
      }
      const sway = Math.sin(elapsed * (1.1 + windStrength * 0.35)) * (0.012 * windStrength);
      treeScaleGroup.rotation.z = sway;

      const stateKey = `${season}_${Math.round(frostFactor * 40)}_${Math.round(coins / 10)}`;
      if (stateKey !== lastFigStateKey) {
        lastFigStateKey = stateKey;
        figColorSettleTimer = 4.5;
      }

      if (figColorSettleTimer > 0) {
        figColorSettleTimer = Math.max(0, figColorSettleTimer - dt);
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
        _figBaseColor
          .copy(_figBarkBase)
          .lerp(_figBarkWinter, Math.max(season === 'winter' ? 0.5 : 0, frostFactor * 0.6));
        barkMat.color.lerp(_figBaseColor, Math.min(1, dt * 2.0));

        const unlockedFigs =
          season === 'winter' ? 0 : Math.floor(THREE.MathUtils.clamp((coins - 20) / 10, 0, 16));
        figMeshes.forEach((fm, idx) => {
          const target = idx < unlockedFigs ? 1 : 0.001;
          const s = THREE.MathUtils.damp(fm.scale.x, target, 4, dt);
          fm.scale.setScalar(s);
        });
      }
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
  plazaZone: 'north' | 'south';
  doorId: string | null;
  state: 'walking' | 'entering' | 'inside' | 'exiting';
  timer: number;
  scale: number;
  phaseOffset: number;
  groundY: number;
  hiddenWritten?: boolean;
}

export interface PedestrianSystem {
  group: THREE.Group;
  update: (dt: number, elapsed: number, focusX?: number, focusZ?: number) => void;
}

const CLOTHING_PALETTE = [
  0xc95242, 0x4e688c, 0xc7953e, 0x587d63, 0xad535d, 0x424a59, 0x826ba6, 0x6b4b38, 0x3b6e8c,
  0xd68c45, 0x4e7a6d, 0x7d4c5c,
];

const PANTS_PALETTE = [0x2e3b46, 0x3c322a, 0x424a59, 0x465242, 0x353238, 0x574b40];
const HEAD_SKIN_PALETTE = [0xebc29f, 0xf2ccb0, 0xdfb088, 0xd7a379];

export function createPedestrianSystem(): PedestrianSystem {
  const group = new THREE.Group();
  const count = 64;

  const { torsoGeo, legGeo, armGeo, handGeo, headGeos } = createArticulatedPedestrianGeos();
  const sharedMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    vertexColors: true,
    roughness: 0.7,
    metalness: 0.04,
    flatShading: false,
  });

  const torsoInst = new THREE.InstancedMesh(torsoGeo, sharedMat, count);
  torsoInst.castShadow = true;
  torsoInst.receiveShadow = true;
  torsoInst.frustumCulled = false;

  const legLInst = new THREE.InstancedMesh(legGeo, sharedMat, count);
  legLInst.castShadow = true;
  legLInst.receiveShadow = true;
  legLInst.frustumCulled = false;

  const legRInst = new THREE.InstancedMesh(legGeo, sharedMat, count);
  legRInst.castShadow = true;
  legRInst.receiveShadow = true;
  legRInst.frustumCulled = false;

  const armLInst = new THREE.InstancedMesh(armGeo, sharedMat, count);
  armLInst.castShadow = true;
  armLInst.receiveShadow = true;
  armLInst.frustumCulled = false;

  const armRInst = new THREE.InstancedMesh(armGeo, sharedMat, count);
  armRInst.castShadow = true;
  armRInst.receiveShadow = true;
  armRInst.frustumCulled = false;

  const handsInst = new THREE.InstancedMesh(handGeo, sharedMat, count * 2);
  handsInst.castShadow = true;
  handsInst.receiveShadow = true;
  handsInst.frustumCulled = false;

  const variantCount = headGeos.length; // 4
  const perVariant = count / variantCount; // 16
  const headInsts = headGeos.map((geo) => {
    const inst = new THREE.InstancedMesh(geo, sharedMat, perVariant);
    inst.castShadow = true;
    inst.receiveShadow = true;
    inst.frustumCulled = false;
    return inst;
  });

  const colorTmp = new THREE.Color();
  const doorLandmarks = LANDMARKS.filter((l) => l.doorPosition);

  const pickPlazaPoint = (zone: 'north' | 'south'): [number, number] => {
    if (zone === 'north') {
      // Large open paved event plaza south of north perimeter & north of Belediye Kafeleri
      const px = (Math.random() - 0.5) * 21.6; // [-10.8, 10.8]
      const pz = -9.6 + Math.random() * 10.4; // [-9.6, +0.8]
      return [px, pz];
    }
    // Southern promenade south of the turquoise pool & monument (around Fig Tree & Zeybek)
    for (let attempt = 0; attempt < 8; attempt++) {
      const px = (Math.random() - 0.5) * 21.6; // [-10.8, 10.8]
      const pz = 16.8 + Math.random() * 6.8; // [16.8, 23.6]
      if (
        Math.hypot(px, pz - 19.8) > 2.6 &&
        Math.hypot(px + 8.2, pz - 18.6) > 2.3 &&
        Math.hypot(px - 8.8, pz - 20.8) > 2.2
      ) {
        return [px, pz];
      }
    }
    return [3.6, 20.4];
  };

  const streetWaypoints: [number, number][] = [
    [-19, -15],
    [-19, 2],
    [-19, 24],
    [-19, 52],
    [-19, -52],
    [-58, -50],
    [-64, -47],
    [-39.5, 11.5],
    [-58, 11.5],
    [19, 24],
    [19, -4],
    [19, -30],
    [19, -52],
    [68, -48],
    [76, -48],
    [68, -82],
    [74, -82],
    [25, 10],
    [68, 22],
    [74, 24],
    [-58, 30],
    [-76, 30],
    [0, 70],
    [-102, 11.5],
    [118, 10],
  ];

  const agents: WalkerAgent[] = [];

  for (let i = 0; i < count; i++) {
    const shirtHex = CLOTHING_PALETTE[i % CLOTHING_PALETTE.length];
    const pantsHex = PANTS_PALETTE[(i * 3 + 1) % PANTS_PALETTE.length];
    const skinHex = HEAD_SKIN_PALETTE[i % HEAD_SKIN_PALETTE.length];

    colorTmp.setHex(shirtHex);
    torsoInst.setColorAt(i, colorTmp);
    armLInst.setColorAt(i, colorTmp);
    armRInst.setColorAt(i, colorTmp);

    colorTmp.setHex(pantsHex);
    legLInst.setColorAt(i, colorTmp);
    legRInst.setColorAt(i, colorTmp);

    colorTmp.setHex(skinHex);
    handsInst.setColorAt(i * 2, colorTmp);
    handsInst.setColorAt(i * 2 + 1, colorTmp);

    const isPlaza = i < 34; // Dense lively crowd in Atatürk Kent Meydanı!
    if (isPlaza) {
      const plazaZone: 'north' | 'south' = i < 20 ? 'north' : 'south';
      const [sx, sz] = pickPlazaPoint(plazaZone);
      const [tx, tz] = pickPlazaPoint(plazaZone);
      agents.push({
        x: sx,
        z: sz,
        targetX: tx,
        targetZ: tz,
        speed: 1.05 + Math.random() * 0.55,
        isPlazaWalker: true,
        plazaZone,
        doorId: null,
        state: 'walking',
        timer: Math.random() * 2,
        scale: 1,
        phaseOffset: Math.random() * Math.PI * 2,
        groundY: getWalkableSurfaceHeightAt(sx, sz),
      });
    } else {
      const doorLm = doorLandmarks[i % doorLandmarks.length];
      const [dx, dz] = doorLm.doorPosition!;
      const wp = streetWaypoints[(i * 3) % streetWaypoints.length];
      const startAtDoor = i % 2 === 0;
      const sx = startAtDoor ? dx + (Math.random() - 0.5) * 2 : wp[0];
      const sz = startAtDoor ? dz + (Math.random() - 0.5) * 2 : wp[1];
      agents.push({
        x: sx,
        z: sz,
        targetX: dx,
        targetZ: dz,
        speed: 1.15 + Math.random() * 0.5,
        isPlazaWalker: false,
        plazaZone: 'north',
        doorId: doorLm.id,
        state: 'walking',
        timer: 0,
        scale: 1,
        phaseOffset: Math.random() * Math.PI * 2,
        groundY: getWalkableSurfaceHeightAt(sx, sz),
      });
    }
  }

  [torsoInst, armLInst, armRInst, legLInst, legRInst, handsInst].forEach((inst) => {
    if (inst.instanceColor) inst.instanceColor.needsUpdate = true;
    inst.computeBoundingSphere();
    group.add(inst);
  });
  headInsts.forEach((hInst) => {
    hInst.computeBoundingSphere();
    group.add(hInst);
  });

  const S = SCULPTED_HUMAN_SCALE;
  const _rootMat = new THREE.Matrix4();
  const _partMat = new THREE.Matrix4();
  const _armWorldMat = new THREE.Matrix4();
  const _handLocalMat = new THREE.Matrix4();
  const _outMat = new THREE.Matrix4();
  const _pos = new THREE.Vector3();
  const _quat = new THREE.Quaternion();
  const _euler = new THREE.Euler(0, 0, 0, 'YXZ');
  const _scale = new THREE.Vector3(1, 1, 1);

  _handLocalMat.makeTranslation(0, -2.42 * S, 0.3 * S);

  let pedAccum = 0.04;
  let pedStepCount = 0;

  return {
    group,
    update: (dt: number, elapsed: number, focusX = 0, focusZ = 0) => {
      pedAccum += dt;
      if (pedAccum < 0.032) return;
      const stepDt = pedAccum;
      pedAccum = 0;
      pedStepCount++;

      for (let i = 0; i < count; i++) {
        const a = agents[i];

        if (a.state === 'inside') {
          a.timer -= stepDt;
          a.scale = 0.001;
          if (a.timer <= 0) {
            a.state = 'exiting';
            a.hiddenWritten = false;
            const wp = streetWaypoints[Math.floor(Math.random() * streetWaypoints.length)];
            a.targetX = wp[0];
            a.targetZ = wp[1];
          } else if (a.hiddenWritten) {
            continue;
          } else {
            a.hiddenWritten = true;
          }
        } else if (a.state === 'entering') {
          a.hiddenWritten = false;
          a.scale = Math.max(0.001, a.scale - stepDt * 2.5);
          if (a.scale <= 0.02) {
            a.state = 'inside';
            a.timer = 2.5 + Math.random() * 3.5;
          }
        } else if (a.state === 'exiting') {
          a.hiddenWritten = false;
          a.scale = Math.min(1, a.scale + stepDt * 2.5);
          if (a.scale >= 0.99) {
            a.scale = 1;
            a.state = 'walking';
          }
        } else {
          a.hiddenWritten = false;
          // Walking slowly & peacefully
          const dx = a.targetX - a.x;
          const dz = a.targetZ - a.z;
          const dist = Math.hypot(dx, dz);

          if (dist < 0.6) {
            if (a.isPlazaWalker) {
              a.timer -= stepDt;
              if (a.timer <= 0) {
                const [nx, nz] = pickPlazaPoint(a.plazaZone);
                a.targetX = nx;
                a.targetZ = nz;
                a.timer = 1.0 + Math.random() * 2.5;
              }
            } else if (a.doorId) {
              a.state = 'entering';
              a.doorId = null;
            } else {
              const nextDoor =
                doorLandmarks[Math.floor(Math.random() * doorLandmarks.length)];
              a.doorId = nextDoor.id;
              a.targetX = nextDoor.doorPosition![0];
              a.targetZ = nextDoor.doorPosition![1];
            }
          } else {
            const step = Math.min(dist, a.speed * stepDt);
            a.x += (dx / dist) * step;
            a.z += (dz / dist) * step;
            const dFocusSq = (a.x - focusX) * (a.x - focusX) + (a.z - focusZ) * (a.z - focusZ);
            if (!a.isPlazaWalker && (dFocusSq < 5625 ? (pedStepCount + i) % 2 === 0 : (pedStepCount + i) % 6 === 0)) {
              a.groundY = getWalkableSurfaceHeightAt(a.x, a.z);
            }
          }
        }

        const isMoving =
          a.state === 'walking' && Math.hypot(a.targetX - a.x, a.targetZ - a.z) > 0.6;
        const walkPhase = elapsed * (a.speed * 4.4) + a.phaseOffset;
        const bob = isMoving ? Math.abs(Math.sin(walkPhase)) * 0.045 : 0;
        const heightMod = 0.96 + ((i % 5) - 2) * 0.025;
        const effScale = a.scale * heightMod;
        const yaw = Math.atan2(a.targetX - a.x, a.targetZ - a.z);

        // Root transform
        _pos.set(a.x, a.groundY + bob, a.z);
        _euler.set(0, yaw, 0);
        _quat.setFromEuler(_euler);
        _scale.set(effScale, effScale, effScale);
        _rootMat.compose(_pos, _quat, _scale);

        // Torso (subtle natural counter-twist while walking, breathing while standing)
        const torsoYaw = isMoving ? Math.sin(walkPhase) * 0.065 : 0;
        const breathY = isMoving ? 0 : Math.sin(elapsed * 2.1 + a.phaseOffset) * 0.008;
        _pos.set(0, 4.95 * S + breathY, 0);
        _euler.set(0, torsoYaw, 0);
        _quat.setFromEuler(_euler);
        _scale.set(1, 1, 1);
        _partMat.compose(_pos, _quat, _scale);
        _outMat.multiplyMatrices(_rootMat, _partMat);
        torsoInst.setMatrixAt(i, _outMat);

        // Head (looks smoothly around when paused, faces forward when walking)
        const headLookY = isMoving
          ? -torsoYaw * 0.5
          : Math.sin(elapsed * 0.85 + a.phaseOffset) * 0.24;
        const headNodX = isMoving ? 0 : Math.sin(elapsed * 1.4 + a.phaseOffset) * 0.04;
        _pos.set(0, (4.95 + 3.48) * S + breathY, 0.04 * S);
        _euler.set(headNodX, torsoYaw + headLookY, 0);
        _quat.setFromEuler(_euler);
        _partMat.compose(_pos, _quat, _scale);
        _outMat.multiplyMatrices(_rootMat, _partMat);
        const variantIdx = i % variantCount;
        const slotIdx = (i / variantCount) | 0;
        headInsts[variantIdx].setMatrixAt(slotIdx, _outMat);

        // Left & Right Legs (hip-pivoted natural stride)
        const legSwing = isMoving ? Math.sin(walkPhase) * 0.44 : 0;
        _pos.set(-0.46 * S, 4.95 * S, 0);
        _euler.set(legSwing, 0, 0);
        _quat.setFromEuler(_euler);
        _partMat.compose(_pos, _quat, _scale);
        _outMat.multiplyMatrices(_rootMat, _partMat);
        legLInst.setMatrixAt(i, _outMat);

        _pos.set(0.46 * S, 4.95 * S, 0);
        _euler.set(-legSwing, 0, 0);
        _quat.setFromEuler(_euler);
        _partMat.compose(_pos, _quat, _scale);
        _outMat.multiplyMatrices(_rootMat, _partMat);
        legRInst.setMatrixAt(i, _outMat);

        // Left & Right Arms + Skin Hands attached at cuff
        const armSwing = isMoving ? -Math.sin(walkPhase) * 0.38 : Math.sin(elapsed * 1.3 + a.phaseOffset) * 0.03;
        _pos.set(-1.18 * S, (4.95 + 3.04) * S + breathY, 0.02 * S);
        _euler.set(armSwing, torsoYaw, -0.09);
        _quat.setFromEuler(_euler);
        _partMat.compose(_pos, _quat, _scale);
        _armWorldMat.multiplyMatrices(_rootMat, _partMat);
        armLInst.setMatrixAt(i, _armWorldMat);
        _outMat.multiplyMatrices(_armWorldMat, _handLocalMat);
        handsInst.setMatrixAt(i * 2, _outMat);

        _pos.set(1.18 * S, (4.95 + 3.04) * S + breathY, 0.02 * S);
        _euler.set(-armSwing, torsoYaw, 0.09);
        _quat.setFromEuler(_euler);
        _partMat.compose(_pos, _quat, _scale);
        _armWorldMat.multiplyMatrices(_rootMat, _partMat);
        armRInst.setMatrixAt(i, _armWorldMat);
        _outMat.multiplyMatrices(_armWorldMat, _handLocalMat);
        handsInst.setMatrixAt(i * 2 + 1, _outMat);
      }

      torsoInst.instanceMatrix.needsUpdate = true;
      legLInst.instanceMatrix.needsUpdate = true;
      legRInst.instanceMatrix.needsUpdate = true;
      armLInst.instanceMatrix.needsUpdate = true;
      armRInst.instanceMatrix.needsUpdate = true;
      handsInst.instanceMatrix.needsUpdate = true;
      for (let v = 0; v < variantCount; v++) {
        headInsts[v].instanceMatrix.needsUpdate = true;
      }
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
    [-58, 30],
    [-19, 11.5],
    [19, 38],
    [-19, 38],
    [19, -30],
    [-19, -30],
    [19, 70],
    [-19, 70],
    [68, -30],
    [68, 10],
    [118, 10],
    [19, -72],
    [-19, -72],
    [-102, 11.5],
    [-102, 70],
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

  const totalPoles = intersections.length * 2;
  const halfPoles = intersections.length;
  const poleGeo = new THREE.CylinderGeometry(0.07, 0.09, 3.1, 8);
  poleGeo.translate(0, 1.55, 0);
  const housingGeo = new THREE.BoxGeometry(0.32, 0.88, 0.28);
  housingGeo.translate(0, 3.1, 0);
  const bulbGeo = new THREE.SphereGeometry(0.085, 8, 6);

  const poleInst = new THREE.InstancedMesh(poleGeo, mats.wroughtIron, totalPoles);
  const housingInst = new THREE.InstancedMesh(housingGeo, mats.wroughtIron, totalPoles);
  const redNSInst = new THREE.InstancedMesh(bulbGeo, redMatNS, halfPoles);
  const amberNSInst = new THREE.InstancedMesh(bulbGeo, amberMatNS, halfPoles);
  const greenNSInst = new THREE.InstancedMesh(bulbGeo, greenMatNS, halfPoles);
  const redEWInst = new THREE.InstancedMesh(bulbGeo, redMatEW, halfPoles);
  const amberEWInst = new THREE.InstancedMesh(bulbGeo, amberMatEW, halfPoles);
  const greenEWInst = new THREE.InstancedMesh(bulbGeo, greenMatEW, halfPoles);

  const dummy = new THREE.Object3D();
  const bulbDummy = new THREE.Object3D();

  intersections.forEach(([ix, iz], idx) => {
    const corners: [number, number, boolean][] = [
      [ix + 5.0, iz + 5.0, true], // faces N-S traffic
      [ix - 5.0, iz - 5.0, false], // faces E-W traffic
    ];

    corners.forEach(([px, pz, isNS], cIdx) => {
      const py = getWalkableSurfaceHeightAt(px, pz);
      const yaw = isNS ? 0 : Math.PI / 2;
      const poleSlot = idx * 2 + cIdx;

      dummy.position.set(px, py, pz);
      dummy.rotation.set(0, yaw, 0);
      dummy.scale.setScalar(1);
      dummy.updateMatrix();
      poleInst.setMatrixAt(poleSlot, dummy.matrix);
      housingInst.setMatrixAt(poleSlot, dummy.matrix);

      const fwdX = Math.sin(yaw) * 0.14;
      const fwdZ = Math.cos(yaw) * 0.14;
      const rInst = isNS ? redNSInst : redEWInst;
      const aInst = isNS ? amberNSInst : amberEWInst;
      const gInst = isNS ? greenNSInst : greenEWInst;

      bulbDummy.rotation.set(0, 0, 0);
      bulbDummy.scale.setScalar(1);
      bulbDummy.position.set(px + fwdX, py + 3.36, pz + fwdZ);
      bulbDummy.updateMatrix();
      rInst.setMatrixAt(idx, bulbDummy.matrix);

      bulbDummy.position.set(px + fwdX, py + 3.1, pz + fwdZ);
      bulbDummy.updateMatrix();
      aInst.setMatrixAt(idx, bulbDummy.matrix);

      bulbDummy.position.set(px + fwdX, py + 2.84, pz + fwdZ);
      bulbDummy.updateMatrix();
      gInst.setMatrixAt(idx, bulbDummy.matrix);
    });
  });

  [poleInst, housingInst, redNSInst, amberNSInst, greenNSInst, redEWInst, amberEWInst, greenEWInst].forEach(
    (inst) => {
      inst.instanceMatrix.needsUpdate = true;
      inst.computeBoundingSphere();
      group.add(inst);
    }
  );

  let lastTrafficBucket = -1;
  return {
    group,
    update: (elapsed: number) => {
      const cycle = elapsed % 12;
      const bucket = cycle < 5 ? 0 : cycle < 6 ? 1 : cycle < 11 ? 2 : 3;
      if (bucket === lastTrafficBucket) return;
      lastTrafficBucket = bucket;
      // 0: NS Green, EW Red | 1: NS Amber, EW Red | 2: NS Red, EW Green | 3: NS Red, EW Amber
      greenMatNS.emissiveIntensity = bucket === 0 ? 1.8 : 0.05;
      amberMatNS.emissiveIntensity = bucket === 1 ? 1.8 : 0.05;
      redMatNS.emissiveIntensity = bucket >= 2 ? 1.8 : 0.05;

      redMatEW.emissiveIntensity = bucket < 2 ? 1.8 : 0.05;
      greenMatEW.emissiveIntensity = bucket === 2 ? 1.8 : 0.05;
      amberMatEW.emissiveIntensity = bucket === 3 ? 1.8 : 0.05;
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
    signGroup.position.set(sx, getWalkableSurfaceHeightAt(sx, sz), sz);
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

    mergeStaticGroupMeshes(signGroup);
    group.add(signGroup);
    const halfX = idx === 1 ? 0.9 : 2.3;
    const halfZ = idx === 1 ? 2.3 : 0.9;
    colliders.push({
      minX: sx - halfX,
      maxX: sx + halfX,
      minZ: sz - halfZ,
      maxZ: sz + halfZ,
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
  const trackZ = RAIL_TRACK_Z;

  const trainGroup = new THREE.Group();
  trainGroup.position.set(-108, 0.34, trackZ);
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

  const wheels: THREE.Group[] = [];
  const addWheelPair = (parent: THREE.Group, lx: number, radius: number) => {
    [-0.95, 0.95].forEach((lz) => {
      const wheelPivot = new THREE.Group();
      wheelPivot.position.set(lx, radius, lz);

      const wheel = new THREE.Mesh(
        new THREE.CylinderGeometry(radius, radius, 0.16, 12),
        mats.wroughtIron
      );
      wheel.rotation.x = Math.PI / 2;
      wheelPivot.add(wheel);

      const spokeBar = new THREE.Mesh(
        new THREE.BoxGeometry(radius * 1.55, radius * 0.16, 0.19),
        mats.brass
      );
      wheelPivot.add(spokeBar);

      const spokeCross = new THREE.Mesh(
        new THREE.BoxGeometry(radius * 0.16, radius * 1.55, 0.19),
        mats.brass
      );
      wheelPivot.add(spokeCross);

      mergeStaticGroupMeshes(wheelPivot);
      parent.add(wheelPivot);
      wheels.push(wheelPivot);
    });
  };

  // --- Locomotive (facing +X, centered near x = +9.5 relative to trainGroup) ---
  const locoGroup = new THREE.Group();
  locoGroup.position.set(8.5, 0, 0);
  trainGroup.add(locoGroup);
  const locoStatic = new THREE.Group();

  const locoFrame = new THREE.Mesh(new THREE.BoxGeometry(6.8, 0.42, 2.05), chassisMat);
  locoFrame.position.set(0, 0.65, 0);
  locoFrame.castShadow = true;
  locoStatic.add(locoFrame);

  // Cylindrical Boiler + Smokebox
  const boiler = new THREE.Mesh(
    new THREE.CylinderGeometry(0.82, 0.82, 4.2, 16),
    locoGreenMat
  );
  boiler.rotation.z = Math.PI / 2;
  boiler.position.set(0.55, 1.65, 0);
  boiler.castShadow = true;
  locoStatic.add(boiler);

  const smokebox = new THREE.Mesh(
    new THREE.CylinderGeometry(0.84, 0.84, 1.15, 16),
    chassisMat
  );
  smokebox.rotation.z = Math.PI / 2;
  smokebox.position.set(2.55, 1.65, 0);
  smokebox.castShadow = true;
  locoStatic.add(smokebox);

  // Brass Boiler Bands & Steam Dome
  [-0.5, 0.65, 1.8].forEach((bx) => {
    const band = new THREE.Mesh(new THREE.CylinderGeometry(0.845, 0.845, 0.1, 16), mats.brass);
    band.rotation.z = Math.PI / 2;
    band.position.set(bx, 1.65, 0);
    locoStatic.add(band);
  });

  const steamDome = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.38, 0.58, 12), mats.brass);
  steamDome.position.set(0.65, 2.55, 0);
  locoStatic.add(steamDome);

  // Tall Smokestack Funnel + Flared Lip
  const funnel = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.19, 1.05, 12), chassisMat);
  funnel.position.set(2.55, 2.75, 0);
  const funnelRim = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.24, 0.18, 12), mats.brass);
  funnelRim.position.set(2.55, 3.28, 0);
  locoStatic.add(funnel, funnelRim);

  // Front Brass Headlamp + Cowcatcher
  const headlamp = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.26, 10), mats.lampBulb);
  headlamp.rotation.z = Math.PI / 2;
  headlamp.position.set(3.22, 2.05, 0);
  locoStatic.add(headlamp);

  const cowcatcher = new THREE.Mesh(new THREE.ConeGeometry(0.92, 0.9, 4), chassisMat);
  cowcatcher.rotation.y = Math.PI / 4;
  cowcatcher.rotation.z = -Math.PI / 2;
  cowcatcher.position.set(3.5, 0.48, 0);
  locoStatic.add(cowcatcher);

  // Driver's Cab with Warm Lit Windows & Arched Roof
  const cab = new THREE.Mesh(new THREE.BoxGeometry(2.15, 2.25, 2.15), locoGreenMat);
  cab.position.set(-2.15, 1.85, 0);
  cab.castShadow = true;
  const cabRoof = new THREE.Mesh(new THREE.BoxGeometry(2.45, 0.18, 2.4), mats.darkTimber);
  cabRoof.position.set(-2.15, 3.04, 0);
  const cabWin = new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.72, 2.2), mats.windowLit);
  cabWin.position.set(-2.15, 2.25, 0);
  locoStatic.add(cab, cabRoof, cabWin);

  mergeStaticGroupMeshes(locoStatic);
  locoGroup.add(locoStatic);

  addWheelPair(locoGroup, -2.2, 0.5);
  addWheelPair(locoGroup, -0.4, 0.56);
  addWheelPair(locoGroup, 1.3, 0.56);
  addWheelPair(locoGroup, 2.65, 0.36);

  // --- Coal Tender ---
  const tenderGroup = new THREE.Group();
  tenderGroup.position.set(2.6, 0, 0);
  trainGroup.add(tenderGroup);
  const tenderStatic = new THREE.Group();

  const tenderBody = new THREE.Mesh(new THREE.BoxGeometry(3.6, 1.35, 1.98), locoGreenMat);
  tenderBody.position.set(0, 1.25, 0);
  tenderBody.castShadow = true;
  const coalMound = new THREE.Mesh(new THREE.BoxGeometry(2.8, 0.4, 1.55), chassisMat);
  coalMound.position.set(0, 1.98, 0);
  tenderStatic.add(tenderBody, coalMound);
  mergeStaticGroupMeshes(tenderStatic);
  tenderGroup.add(tenderStatic);
  addWheelPair(tenderGroup, -1.0, 0.42);
  addWheelPair(tenderGroup, 1.0, 0.42);

  // --- Two Nostalgic Passenger Coaches ---
  [-4.2, -13.4].forEach((cx) => {
    const coach = new THREE.Group();
    coach.position.set(cx, 0, 0);
    trainGroup.add(coach);
    const coachStatic = new THREE.Group();

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
    coachStatic.add(chassis, body, upperBand, roof, clerestory);

    [-2.7, -0.9, 0.9, 2.7].forEach((wx) => {
      const winStrip = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.78, 2.1), mats.windowLit);
      winStrip.position.set(wx, 1.86, 0);
      coachStatic.add(winStrip);
    });
    mergeStaticGroupMeshes(coachStatic);
    coach.add(coachStatic);

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
    x: -108,
    y: 3.7,
    z: trackZ,
  }));
  const puffDummy = new THREE.Object3D();

  // Train journey state: cruise from West (-108) -> stop at platform (+2) for 6.5s -> depart East (+124) -> loop
  let trainX = -78;
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
        if (trainX > 124) {
          trainX = -112;
          speed = 6.8;
          phase = 'arriving';
        }
      }

      trainGroup.position.x = trainX;
      // Subtle mechanical rail bounce keeping flange clear atop 0.33 steel rail head
      trainGroup.position.y =
        0.335 + (speed > 0.2 ? Math.abs(Math.sin(elapsed * 11)) * 0.012 : 0);

      wheelAngle -= (speed * dt) / 0.48;
      for (let i = 0; i < wheels.length; i++) {
        wheels[i].rotation.z = wheelAngle;
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
  update: (dt: number, elapsed: number, focusX?: number, focusZ?: number) => void;
}

interface TrafficRider {
  group: THREE.Group;
  wheels: THREE.Group[];
  wheelR: number;
  loopIndex: number;
  progress: number;
  heading: number;
  speed: number;
  bobPhase: number;
  isScooter: boolean;
  riderRig: SculptedHumanRig;
  lastPitch: number;
}

const LOOP_CENTRAL: [number, number][] = [
  [-102, -16],
  [-58, -30],
  [19, -30],
  [68, -30],
  [68, 30],
  [42, 30],
  [19, 38],
  [-19, 38],
  [-58, 38],
  [-58, 30],
  [-102, 30],
];

const LOOP_NORTH: [number, number][] = [
  [-19, -72],
  [19, -72],
  [68, -72],
  [68, -30],
  [19, -30],
  [-19, -30],
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
  const shirtColors = [0xf5ecdc, 0x586f4e, 0xd98a3f, 0x4b7496, 0xc96846, 0x7c5a44, 0x424a59, 0xad535d];
  const skinColors = [0xebc29f, 0xdfb088, 0xf2ccb0, 0xd7a379];
  const hairColors = [0x3b281e, 0x563928, 0x261c17, 0x61554e];
  const riders: TrafficRider[] = [];
  const initOut = { x: 0, z: 0, heading: 0 };

  // Shared vehicle part geometries across all 8 riders
  const scooterTireGeo = new THREE.TorusGeometry(0.24, 0.07, 7, 14);
  const bikeTireGeo = new THREE.TorusGeometry(0.32, 0.045, 7, 14);
  const scooterHubGeo = new THREE.BoxGeometry(0.06, 0.36, 0.04);
  const bikeHubGeo = new THREE.BoxGeometry(0.06, 0.48, 0.04);
  const deckGeo = new THREE.BoxGeometry(0.36, 0.24, 1.05);
  const apronGeo = new THREE.BoxGeometry(0.34, 0.65, 0.22);
  const scooterLampGeo = new THREE.SphereGeometry(0.08, 8, 6);
  const scooterBarGeo = new THREE.CylinderGeometry(0.025, 0.025, 0.52, 8);
  const frameGeo = new THREE.BoxGeometry(0.08, 0.1, 1.15);
  const seatPostGeo = new THREE.CylinderGeometry(0.03, 0.03, 0.32, 6);
  const bikeBarGeo = new THREE.CylinderGeometry(0.022, 0.022, 0.48, 8);
  const basketGeo = new THREE.BoxGeometry(0.3, 0.22, 0.26);

  for (let i = 0; i < 8; i++) {
    const isScooter = i % 2 === 1;
    const loopIndex = i < 4 ? 0 : 1;
    const riderGroup = new THREE.Group();
    const bodyMat = new THREE.MeshStandardMaterial({
      color: riderColors[i % riderColors.length],
      roughness: 0.45,
    });

    const wheels: THREE.Group[] = [];
    const wheelR = isScooter ? 0.24 : 0.32;
    [-0.55, 0.55].forEach((wz) => {
      const wheelPivot = new THREE.Group();
      wheelPivot.position.set(0, wheelR, wz);

      const tire = new THREE.Mesh(
        isScooter ? scooterTireGeo : bikeTireGeo,
        mats.wroughtIron
      );
      tire.rotation.y = Math.PI / 2;
      wheelPivot.add(tire);

      const hub = new THREE.Mesh(
        isScooter ? scooterHubGeo : bikeHubGeo,
        mats.brass
      );
      wheelPivot.add(hub);

      riderGroup.add(wheelPivot);
      wheels.push(wheelPivot);
    });

    if (isScooter) {
      const deck = new THREE.Mesh(deckGeo, bodyMat);
      deck.position.set(0, 0.44, 0.05);
      const apron = new THREE.Mesh(apronGeo, bodyMat);
      apron.position.set(0, 0.72, -0.45);
      apron.rotation.x = 0.2;
      const lamp = new THREE.Mesh(scooterLampGeo, mats.lampBulb);
      lamp.position.set(0, 0.92, -0.58);
      const handlebar = new THREE.Mesh(scooterBarGeo, mats.wroughtIron);
      handlebar.rotation.z = Math.PI / 2;
      handlebar.position.set(0, 0.98, -0.42);
      riderGroup.add(deck, apron, lamp, handlebar);
    } else {
      const frame = new THREE.Mesh(frameGeo, bodyMat);
      frame.position.set(0, 0.56, 0);
      const seatPost = new THREE.Mesh(seatPostGeo, mats.wroughtIron);
      seatPost.position.set(0, 0.68, 0.14);
      const handlebar = new THREE.Mesh(bikeBarGeo, mats.wroughtIron);
      handlebar.rotation.z = Math.PI / 2;
      handlebar.position.set(0, 0.96, -0.4);
      const basket = new THREE.Mesh(basketGeo, mats.darkTimber);
      basket.position.set(0, 0.78, -0.52);
      riderGroup.add(frame, seatPost, handlebar, basket);
    }

    // Articulated Sculpted Human Rider (matching player's sculpted human avatar style)
    const riderRig = createSculptedHumanRig(
      {
        skinHex: skinColors[i % skinColors.length],
        shirtHex: shirtColors[i % shirtColors.length],
        pantsHex: 0x2e3b46,
        hairHex: hairColors[i % hairColors.length],
        hatHex: riderColors[i % riderColors.length],
        hairStyle: i % 3 === 0 ? 'waves' : 'short',
        hatStyle: isScooter ? 'beret' : i % 2 === 0 ? 'newsboy' : 'none',
        facialHair: i % 4 === 3 ? 'mustache' : 'none',
      },
      { scale: 0.132, forwardIsNegZ: true, castShadow: 'full' }
    );
    riderRig.root.position.set(0, isScooter ? 0.3 : 0.34, 0.14);
    // Seated posture gripping handlebars
    riderRig.torsoPivot.rotation.x = isScooter ? 0.14 : 0.28;
    riderRig.armL.shoulder.rotation.x = -0.85;
    riderRig.armR.shoulder.rotation.x = -0.85;
    riderRig.armL.shoulder.rotation.z = -0.18;
    riderRig.armR.shoulder.rotation.z = 0.18;
    riderRig.armL.elbow.rotation.x = -0.35;
    riderRig.armR.elbow.rotation.x = -0.35;
    if (isScooter) {
      riderRig.scaleGroup.position.y = -1.65;
      riderRig.legL.hip.rotation.x = -1.18;
      riderRig.legR.hip.rotation.x = -1.18;
      riderRig.legL.knee.rotation.x = 1.25;
      riderRig.legR.knee.rotation.x = 1.25;
    } else {
      riderRig.scaleGroup.position.y = -1.35;
    }
    riderGroup.add(riderRig.root);

    const startProgress = ((i % 4) / 4) * LOOP_LENGTHS[loopIndex];
    sampleLoop(loopIndex === 0 ? LOOP_CENTRAL : LOOP_NORTH, LOOP_LENGTHS[loopIndex], startProgress, initOut);

    group.add(riderGroup);
    riders.push({
      group: riderGroup,
      wheels,
      wheelR,
      loopIndex,
      progress: startProgress,
      heading: initOut.heading,
      speed: isScooter ? 6.4 : 4.7,
      bobPhase: i * 1.4,
      isScooter,
      riderRig,
      lastPitch: 0,
    });
  }

  const sampleOut = { x: 0, z: 0, heading: 0 };
  let stepCounter = 0;

  return {
    group,
    update: (dt: number, elapsed: number, focusX = 0, focusZ = 0) => {
      stepCounter += 1;
      for (let i = 0; i < riders.length; i++) {
        const r = riders[i];
        const pts = r.loopIndex === 0 ? LOOP_CENTRAL : LOOP_NORTH;
        const len = LOOP_LENGTHS[r.loopIndex];
        r.progress = (r.progress + r.speed * dt) % len;
        sampleLoop(pts, len, r.progress, sampleOut);

        const fdx = sampleOut.x - focusX;
        const fdz = sampleOut.z - focusZ;
        const focusDistSq = fdx * fdx + fdz * fdz;
        if (focusDistSq > 8100) {
          if (r.group.visible) r.group.visible = false;
          r.heading = sampleOut.heading;
          continue;
        }
        if (!r.group.visible) r.group.visible = true;

        let hDiff = sampleOut.heading - r.heading;
        while (hDiff > Math.PI) hDiff -= Math.PI * 2;
        while (hDiff < -Math.PI) hDiff += Math.PI * 2;
        r.heading += hDiff * Math.min(1, dt * 8.5);

        const groundY = getWalkableSurfaceHeightAt(sampleOut.x, sampleOut.z);
        if ((stepCounter + i) % 2 === 0 || focusDistSq < 1600) {
          r.lastPitch = getWalkableSlopeAngles(sampleOut.x, sampleOut.z, r.heading).pitch;
        }

        r.group.position.set(
          sampleOut.x,
          groundY + Math.abs(Math.sin(elapsed * 5.2 + r.bobPhase)) * 0.018,
          sampleOut.z
        );
        r.group.rotation.order = 'YXZ';
        r.group.rotation.y = r.heading;
        r.group.rotation.x = r.lastPitch;

        // Subtle head look & bicycle pedaling leg kinematics
        r.riderRig.headPivot.rotation.y = Math.sin(elapsed * 0.9 + r.bobPhase) * 0.14;
        if (!r.isScooter) {
          const pedalPhi = (r.progress / r.wheelR) * 0.85;
          const sL = Math.sin(pedalPhi);
          const sR = Math.sin(pedalPhi + Math.PI);
          r.riderRig.legL.hip.rotation.x = -0.92 + sL * 0.36;
          r.riderRig.legR.hip.rotation.x = -0.92 + sR * 0.36;
          r.riderRig.legL.knee.rotation.x = 1.02 - sL * 0.42;
          r.riderRig.legR.knee.rotation.x = 1.02 - sR * 0.42;
        }

        for (let w = 0; w < r.wheels.length; w++) {
          r.wheels[w].rotation.x -= (r.speed * dt) / r.wheelR;
        }
      }
    },
  };
}

