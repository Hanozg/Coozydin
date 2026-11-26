import * as THREE from 'three';
import { RAIL_TRACK_Z, TABAKHANE_BRIDGE_ZS } from '../../data/aydinRoads';
import { ColliderBox } from '../../types/game';
import { CityMaterialLibrary } from '../materials';
import { mergeStaticGroupMeshes } from '../meshMerge';
import { PerchSystem } from '../perchSystem';
import { createGableRoofGeometry } from '../roofGeometry';
import {
  getBaseTerrainHeight,
  getTabakhaneCenterX,
  getTabakhaneHalfWidth,
  getTabakhaneWaterY,
  getTerrainHeightAt,
} from '../terrain';
import {
  createBridgeVaultSoffitGeometry,
  createStoneArchBridgeGeometry,
  createTerrainConformingPatch,
} from './geometryHelpers';

export interface TerrainAndStreamResult {
  terrainMat: THREE.MeshStandardMaterial;
  blockTurfMat: THREE.MeshStandardMaterial;
  hillMat: THREE.MeshStandardMaterial;
  updateStreamProps: (dt: number, elapsed: number, focusX: number, focusZ: number) => void;
}

export function buildTerrainAndStream(params: {
  group: THREE.Group;
  staticWorldGroup: THREE.Group;
  mats: CityMaterialLibrary;
  colliders: ColliderBox[];
  perches: PerchSystem;
  localDisposables: { dispose: () => void }[];
}): TerrainAndStreamResult {
  const { group, staticWorldGroup, mats, colliders, perches, localDisposables } = params;

  // 1. Sculpted 1:100 Aydın Efeler Horizon Terrain (non-uniform high-density grid across playable city + smooth mountain margins)
  const mapCityAxis = (u: number, focusMin: number, focusMax: number, outerHalf: number): number => {
    // u in [-1, 1]: reserve middle 80% of vertices for the playable city (~2.2m spacing) and outer 20% for horizon margins
    const edgeU = 0.8;
    if (u < -edgeU) {
      const t = (u + 1) / (1 - edgeU);
      return THREE.MathUtils.lerp(-outerHalf, focusMin, t * t * (3 - 2 * t));
    }
    if (u > edgeU) {
      const t = (u - edgeU) / (1 - edgeU);
      return THREE.MathUtils.lerp(focusMax, outerHalf, t * t * (3 - 2 * t));
    }
    const t = (u + edgeU) / (2 * edgeU);
    return THREE.MathUtils.lerp(focusMin, focusMax, t);
  };

  const terrainSegs = 220;
  const terrainGeo = new THREE.PlaneGeometry(760, 760, terrainSegs, terrainSegs);
  terrainGeo.rotateX(-Math.PI / 2);
  const tPos = terrainGeo.attributes.position as THREE.BufferAttribute;
  const tUv = terrainGeo.attributes.uv as THREE.BufferAttribute;
  const tColors = new Float32Array(tPos.count * 3);
  const cPlain = new THREE.Color(0x8ea658);
  const cFoothill = new THREE.Color(0xa49956);
  const cRidge = new THREE.Color(0x8a8364);
  const cPineFoot = new THREE.Color(0x5c7747);
  const cStreamBank = new THREE.Color(0x557043);
  const cTmp = new THREE.Color();

  for (let i = 0; i < tPos.count; i++) {
    const ux = tPos.getX(i) / 380;
    const uz = tPos.getZ(i) / 380;
    const wx = mapCityAxis(ux, -225, 205, 380);
    const wz = mapCityAxis(uz, -155, 130, 380);
    const wy = getTerrainHeightAt(wx, wz);
    tPos.setXYZ(i, wx, wy, wz);
    tUv.setXY(i, wx / 24, wz / 24);

    const hillT = THREE.MathUtils.clamp((wy - 0.8) / 6.5, 0, 1);
    const upperT = THREE.MathUtils.clamp((wy - 7.5) / 8.5, 0, 1);
    const pineT = THREE.MathUtils.clamp((wy - 14.0) / 14.0, 0, 1);

    cTmp.copy(cPlain).lerp(cFoothill, hillT);
    cTmp.lerp(cRidge, upperT * 0.65);
    cTmp.lerp(cPineFoot, pineT * 0.72);

    const streamDist = Math.abs(wx - getTabakhaneCenterX(wz));
    if (streamDist < 5.4) {
      const bankT = 1 - THREE.MathUtils.smoothstep(streamDist, 2.2, 5.4);
      cTmp.lerp(cStreamBank, bankT * 0.72);
    }
    tColors[i * 3] = cTmp.r;
    tColors[i * 3 + 1] = cTmp.g;
    tColors[i * 3 + 2] = cTmp.b;
  }
  terrainGeo.setAttribute('color', new THREE.BufferAttribute(tColors, 3));
  terrainGeo.computeVertexNormals();

  const terrainMat = mats.ground.clone();
  terrainMat.vertexColors = true;
  terrainMat.flatShading = false;
  localDisposables.push(terrainMat);

  const terrain = new THREE.Mesh(terrainGeo, terrainMat);
  terrain.receiveShadow = true;
  group.add(terrain);

  // 2. Terrain-Conforming Outer Golden Wheat & Lavender Countryside Fields
  const fieldPatches: [number, number, number, number, THREE.MeshStandardMaterial][] = [
    [188, 36, 56, 86, mats.wheatField],
    [188, -42, 54, 62, mats.lavenderField],
    [188, -102, 56, 52, mats.wheatField],
    [-212, 34, 42, 64, mats.wheatField],
    [-176, -98, 54, 38, mats.lavenderField],
    [-58, -142, 74, 28, mats.wheatField],
    [96, -142, 72, 28, mats.lavenderField],
    [-68, 128, 76, 36, mats.wheatField],
    [94, 128, 66, 36, mats.wheatField],
  ];
  fieldPatches.forEach(([fx, fz, fw, fd, mat]) => {
    const segX = Math.max(10, Math.ceil(fw / 3.5));
    const segZ = Math.max(10, Math.ceil(fd / 3.5));
    const patch = new THREE.Mesh(
      createTerrainConformingPatch(fx, fz, fw, fd, segX, segZ, 0.055, false),
      mat
    );
    patch.position.set(fx, 0, fz);
    patch.receiveShadow = true;
    staticWorldGroup.add(patch);
  });

  // Sculpted 3D Aydın Dağları + Güney Koçarlı-Çine & Batı Germencik Sırtları
  const hillMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    vertexColors: true,
    roughness: 0.93,
    metalness: 0.0,
    flatShading: true,
  });
  localDisposables.push(hillMat);

  const buildMountainMassif = (
    minX: number,
    maxX: number,
    minZ: number,
    maxZ: number,
    segsX: number,
    segsZ: number,
    heightFn: (x: number, z: number) => number,
    maxPeakRef: number
  ) => {
    const geo = new THREE.PlaneGeometry(maxX - minX, maxZ - minZ, segsX, segsZ);
    geo.rotateX(-Math.PI / 2);
    geo.translate((minX + maxX) / 2, 0, (minZ + maxZ) / 2);
    const pos = geo.attributes.position as THREE.BufferAttribute;
    const cols = new Float32Array(pos.count * 3);
    const cFoot = new THREE.Color(0x6c8249);
    const cSlope = new THREE.Color(0x556b43);
    const cRock = new THREE.Color(0x888172);
    const cSummit = new THREE.Color(0xa9a292);
    const cOut = new THREE.Color();

    for (let i = 0; i < pos.count; i++) {
      const mx = pos.getX(i);
      const mz = pos.getZ(i);
      const baseH = getBaseTerrainHeight(mx, mz);
      const ridgeH = Math.max(0, heightFn(mx, mz));
      const finalY = baseH - 0.8 + ridgeH;
      pos.setY(i, finalY);

      const t = THREE.MathUtils.clamp(ridgeH / maxPeakRef, 0, 1);
      if (t < 0.35) {
        cOut.copy(cFoot).lerp(cSlope, t / 0.35);
      } else if (t < 0.72) {
        cOut.copy(cSlope).lerp(cRock, (t - 0.35) / 0.37);
      } else {
        cOut.copy(cRock).lerp(cSummit, (t - 0.72) / 0.28);
      }
      cols[i * 3] = cOut.r;
      cols[i * 3 + 1] = cOut.g;
      cols[i * 3 + 2] = cOut.b;
    }
    geo.setAttribute('color', new THREE.BufferAttribute(cols, 3));
    geo.computeVertexNormals();
    const mesh = new THREE.Mesh(geo, hillMat);
    mesh.receiveShadow = true;
    mesh.castShadow = false;
    group.add(mesh);
  };

  buildMountainMassif(-360, 360, -340, -162, 68, 18, (mx, mz) => {
    const zT = THREE.MathUtils.clamp((-162 - mz) / 168, 0, 1);
    const zEnvelope = Math.sin(zT * Math.PI * 0.82) * Math.pow(zT, 0.75);
    const xEdgeFade = 1 - THREE.MathUtils.smoothstep(Math.abs(mx), 275, 360);
    const ridge1 = Math.sin(mx * 0.02 + 0.4) * 0.5 + 0.5;
    const ridge2 = Math.cos(mx * 0.044 - 1.1) * 0.5 + 0.5;
    const ridge3 = Math.sin((mx + mz * 0.6) * 0.072) * 0.5 + 0.5;
    const pasayaylaPeak = Math.exp(-Math.pow((mx - 58) / 75, 2)) * 22;
    const kalfakoyPeak = Math.exp(-Math.pow((mx + 56) / 62, 2)) * 16;
    const imamkoyPeak = Math.exp(-Math.pow((mx - 165) / 68, 2)) * 18;
    const tabakhaneGorge = Math.exp(-Math.pow((mx - 42) / 20, 2)) * 14 * (1 - zT * 0.45);
    const rawPeak = 24 + ridge1 * 18 + ridge2 * 11 + ridge3 * 6 + pasayaylaPeak + kalfakoyPeak + imamkoyPeak - tabakhaneGorge;
    return Math.max(0, rawPeak * zEnvelope * xEdgeFade);
  }, 66);

  buildMountainMassif(-350, 350, 185, 290, 44, 10, (mx, mz) => {
    const zT = THREE.MathUtils.clamp((mz - 185) / 100, 0, 1);
    const zEnv = Math.sin(zT * Math.PI * 0.88);
    const xFade = 1 - THREE.MathUtils.smoothstep(Math.abs(mx), 275, 350);
    const wave = (Math.sin(mx * 0.022 + 1.2) * 0.5 + 0.5) * 11 + (Math.cos(mx * 0.05) * 0.5 + 0.5) * 5;
    return Math.max(0, (8 + wave) * zEnv * xFade);
  }, 24);

  buildMountainMassif(-355, -238, -180, 185, 10, 26, (mx, mz) => {
    const xT = THREE.MathUtils.clamp((-238 - mx) / 112, 0, 1);
    const xEnv = Math.sin(xT * Math.PI * 0.85);
    const zFade = 1 - THREE.MathUtils.smoothstep(Math.abs(mz), 135, 185);
    const wave = (Math.sin(mz * 0.03) * 0.5 + 0.5) * 10 + (Math.cos(mz * 0.065) * 0.5 + 0.5) * 4;
    return Math.max(0, (7 + wave) * xEnv * zFade);
  }, 22);

  buildMountainMassif(208, 325, -180, 185, 10, 26, (mx, mz) => {
    const xT = THREE.MathUtils.clamp((mx - 208) / 112, 0, 1);
    const xEnv = Math.sin(xT * Math.PI * 0.85);
    const zFade = 1 - THREE.MathUtils.smoothstep(Math.abs(mz), 135, 185);
    const northSlopeBoost = THREE.MathUtils.smoothstep(45, -140, mz) * 10;
    const wave = (Math.sin(mz * 0.027 - 0.7) * 0.5 + 0.5) * 9;
    return Math.max(0, (6 + wave + northSlopeBoost) * xEnv * zFade);
  }, 28);

  // 3. Terrain-Conforming Urban Block Meadows (harmonized micro-grain + polygonOffset to eliminate terrain Z-fighting)
  const blockTurfMat = new THREE.MeshStandardMaterial({
    color: 0x91a85c,
    map: mats.grassMicroGrain,
    roughness: 0.93,
    metalness: 0.0,
    polygonOffset: true,
    polygonOffsetFactor: -1,
    polygonOffsetUnits: -1,
  });
  localDisposables.push(blockTurfMat);
  const blockZones: [number, number, number, number][] = [
    [-38.5, -51, 24, 28],
    [0, -51, 28, 28],
    [38.5, -51, 24, 28],
    [-38.5, -10, 24, 28],
    [93, -48, 34, 28],
    [93, -8, 34, 24],
    [0, 54, 28, 20],
    [38.5, 54, 24, 20],
    [-80, -6, 30, 26],
    [-80, -48, 30, 26],
    [-38.5, 25, 24, 14],
  ];
  blockZones.forEach(([bx, bz, bw, bd]) => {
    const segX = Math.max(8, Math.ceil(bw / 2.5));
    const segZ = Math.max(8, Math.ceil(bd / 2.5));
    const turf = new THREE.Mesh(
      createTerrainConformingPatch(bx, bz, bw, bd, segX, segZ, 0.042, false),
      blockTurfMat
    );
    turf.position.set(bx, 0, bz);
    turf.receiveShadow = true;
    staticWorldGroup.add(turf);
  });

  // 4. Real-World Tabakhane Deresi
  const streamZStart = -162;
  const streamZEnd = 136;
  const streamSegs = 68;
  const halfStreamW = getTabakhaneHalfWidth();

  const waterPos = new Float32Array((streamSegs + 1) * 2 * 3);
  const waterUvs = new Float32Array((streamSegs + 1) * 2 * 2);
  const waterIndices: number[] = [];

  for (let i = 0; i <= streamSegs; i++) {
    const t = i / streamSegs;
    const z = THREE.MathUtils.lerp(streamZStart, streamZEnd, t);
    const cx = getTabakhaneCenterX(z);
    const wy = getTabakhaneWaterY(z);
    const vIdx = i * 2;
    waterPos[vIdx * 3] = cx - halfStreamW;
    waterPos[vIdx * 3 + 1] = wy;
    waterPos[vIdx * 3 + 2] = z;
    waterPos[(vIdx + 1) * 3] = cx + halfStreamW;
    waterPos[(vIdx + 1) * 3 + 1] = wy;
    waterPos[(vIdx + 1) * 3 + 2] = z;

    waterUvs[vIdx * 2] = 0;
    waterUvs[vIdx * 2 + 1] = t * 18;
    waterUvs[(vIdx + 1) * 2] = 1;
    waterUvs[(vIdx + 1) * 2 + 1] = t * 18;

    if (i < streamSegs) {
      const a = vIdx;
      const b = vIdx + 1;
      const c = vIdx + 2;
      const d = vIdx + 3;
      waterIndices.push(a, c, b, b, c, d);
    }
  }
  const streamWaterGeo = new THREE.BufferGeometry();
  streamWaterGeo.setAttribute('position', new THREE.BufferAttribute(waterPos, 3));
  streamWaterGeo.setAttribute('uv', new THREE.BufferAttribute(waterUvs, 2));
  streamWaterGeo.setIndex(waterIndices);
  streamWaterGeo.computeVertexNormals();
  const streamWaterMesh = new THREE.Mesh(streamWaterGeo, mats.water);
  streamWaterMesh.receiveShadow = true;
  group.add(streamWaterMesh);

  // Continuous Left & Right Travertine Retaining Embankments + Stone Coping Caps
  [-1, 1].forEach((side) => {
    const bankOffset = side * (halfStreamW + 0.42);
    const capWidth = 0.92;
    const wallBottomDrop = 1.65;
    const wallTopRise = 0.24;

    const wPos = new Float32Array((streamSegs + 1) * 4 * 3);
    const wUvs = new Float32Array((streamSegs + 1) * 4 * 2);
    const wIndices: number[] = [];

    for (let i = 0; i <= streamSegs; i++) {
      const t = i / streamSegs;
      const z = THREE.MathUtils.lerp(streamZStart, streamZEnd, t);
      const bx = getTabakhaneCenterX(z) + bankOffset;
      const xIn = bx - (side * capWidth) / 2;
      const xOut = bx + (side * capWidth) / 2;
      const groundH = getBaseTerrainHeight(bx, z);
      let bridgeDip = 1;
      for (let b = 0; b < TABAKHANE_BRIDGE_ZS.length; b++) {
        const dz = Math.abs(z - TABAKHANE_BRIDGE_ZS[b]);
        if (dz < 6.4) {
          const smooth = dz <= 5.5 ? 0 : Math.min(1, (dz - 5.5) / 0.9);
          bridgeDip = Math.min(bridgeDip, smooth * smooth * (3 - 2 * smooth));
        }
      }
      const yTop = groundH + THREE.MathUtils.lerp(-0.04, wallTopRise, bridgeDip);
      const yBot = groundH - wallBottomDrop;

      const base = i * 4;
      const coords: [number, number, number][] =
        side < 0
          ? [
              [xOut, yBot, z],
              [xOut, yTop, z],
              [xIn, yTop, z],
              [xIn, yBot, z],
            ]
          : [
              [xIn, yBot, z],
              [xIn, yTop, z],
              [xOut, yTop, z],
              [xOut, yBot, z],
            ];
      for (let k = 0; k < 4; k++) {
        wPos[(base + k) * 3] = coords[k][0];
        wPos[(base + k) * 3 + 1] = coords[k][1];
        wPos[(base + k) * 3 + 2] = coords[k][2];
        wUvs[(base + k) * 2] = k / 3;
        wUvs[(base + k) * 2 + 1] = t * 24;
      }

      if (i < streamSegs) {
        const nBase = (i + 1) * 4;
        for (let k = 0; k < 3; k++) {
          const a = base + k;
          const b = base + k + 1;
          const c = nBase + k;
          const d = nBase + k + 1;
          wIndices.push(a, c, b, b, c, d);
        }
      }
    }

    const wallGeo = new THREE.BufferGeometry();
    wallGeo.setAttribute('position', new THREE.BufferAttribute(wPos, 3));
    wallGeo.setAttribute('uv', new THREE.BufferAttribute(wUvs, 2));
    wallGeo.setIndex(wIndices);
    wallGeo.computeVertexNormals();

    const wallMesh = new THREE.Mesh(wallGeo, mats.travertine);
    wallMesh.castShadow = false;
    wallMesh.receiveShadow = true;
    staticWorldGroup.add(wallMesh);
  });

  // Stone Arch Bridges ("Tabakhane Köprüleri")
  const bridgeParapetGeo = createStoneArchBridgeGeometry(0.54);
  bridgeParapetGeo.userData.isSharedGeo = true;
  localDisposables.push(bridgeParapetGeo);

  TABAKHANE_BRIDGE_ZS.forEach((bz) => {
    const cx = getTabakhaneCenterX(bz);
    const roadHalfW = bz === -72 || bz === -8 ? 4.0 : bz === 30 ? 4.1 : 4.2;
    const outerHalfW = roadHalfW + 1.3;
    const parapetZ = outerHalfW + 0.28;

    const baseLeft = getBaseTerrainHeight(cx - 5.8, bz);
    const baseRight = getBaseTerrainHeight(cx + 5.8, bz);
    const avgBaseY = (baseLeft + baseRight) * 0.5;
    const bankSlopeZ = Math.atan2(baseRight - baseLeft, 11.6);

    const bridgeGroup = new THREE.Group();
    bridgeGroup.position.set(cx, avgBaseY - 1.15, bz);
    bridgeGroup.rotation.z = bankSlopeZ;

    const soffitGeo = createBridgeVaultSoffitGeometry(outerHalfW * 2);
    localDisposables.push(soffitGeo);
    const soffitMesh = new THREE.Mesh(soffitGeo, mats.travertine);
    soffitMesh.castShadow = true;
    soffitMesh.receiveShadow = true;
    bridgeGroup.add(soffitMesh);

    [-parapetZ, parapetZ].forEach((pz) => {
      const archWall = new THREE.Mesh(bridgeParapetGeo, mats.travertine);
      archWall.position.set(0, 0, pz);
      archWall.castShadow = true;
      archWall.receiveShadow = true;
      bridgeGroup.add(archWall);

      colliders.push({
        minX: cx - 6.25,
        maxX: cx + 6.25,
        minZ: bz + pz - 0.36,
        maxZ: bz + pz + 0.36,
        maxY: avgBaseY + 1.35,
      });
    });

    [-5.95, 5.95].forEach((bxOff) => {
      [-parapetZ, parapetZ].forEach((pz) => {
        const post = new THREE.Mesh(new THREE.BoxGeometry(0.56, 0.78, 0.56), mats.creamPlaster);
        post.position.set(bxOff, 2.02, pz);
        bridgeGroup.add(post);

        const cap = new THREE.Mesh(new THREE.BoxGeometry(0.66, 0.14, 0.66), mats.travertine);
        cap.position.set(bxOff, 2.44, pz);
        bridgeGroup.add(cap);

        const lantern = new THREE.Mesh(new THREE.SphereGeometry(0.11, 10, 8), mats.lampBulb);
        lantern.position.set(bxOff, 2.61, pz);
        bridgeGroup.add(lantern);
      });
    });

    const deckPerchY = avgBaseY + 1.28;
    perches.addStaticSegment(
      `bridge_${bz}_n`,
      new THREE.Vector3(cx - 5.4, deckPerchY, bz - parapetZ),
      new THREE.Vector3(cx + 5.4, deckPerchY, bz - parapetZ),
      0.16,
      'stone'
    );
    perches.addStaticSegment(
      `bridge_${bz}_s`,
      new THREE.Vector3(cx - 5.4, deckPerchY, bz + parapetZ),
      new THREE.Vector3(cx + 5.4, deckPerchY, bz + parapetZ),
      0.16,
      'stone'
    );

    staticWorldGroup.add(bridgeGroup);
  });

  // Stone Railway Arch Bridge carrying İzmir–Aydın Demiryolu across Tabakhane Deresi
  const railStreamX = getTabakhaneCenterX(RAIL_TRACK_Z);
  const railBridgeBaseY = getBaseTerrainHeight(railStreamX, RAIL_TRACK_Z);
  const railBridgeDeck = new THREE.Mesh(new THREE.BoxGeometry(11.2, 0.36, 4.6), mats.travertine);
  railBridgeDeck.position.set(railStreamX, railBridgeBaseY - 0.13, RAIL_TRACK_Z);
  railBridgeDeck.castShadow = true;
  railBridgeDeck.receiveShadow = true;
  staticWorldGroup.add(railBridgeDeck);
  [-2.12, 2.12].forEach((rzOff) => {
    const railCurb = new THREE.Mesh(new THREE.BoxGeometry(11.2, 0.24, 0.34), mats.creamPlaster);
    railCurb.position.set(railStreamX, railBridgeBaseY + 0.14, RAIL_TRACK_Z + rzOff);
    staticWorldGroup.add(railCurb);
  });
  [-3.8, 3.8].forEach((pierX) => {
    const pier = new THREE.Mesh(new THREE.BoxGeometry(1.5, 1.6, 4.8), mats.travertine);
    pier.position.set(railStreamX + pierX, railBridgeBaseY - 0.88, RAIL_TRACK_Z);
    staticWorldGroup.add(pier);
  });

  // Waterfront Wooden Rowboat bobbing behind Sarı Belediye
  const boatZ = 48;
  const boatX = getTabakhaneCenterX(boatZ) - 0.75;
  const boatBaseY = getTabakhaneWaterY(boatZ) + 0.07;
  const boatGroup = new THREE.Group();
  boatGroup.position.set(boatX, boatBaseY, boatZ);
  boatGroup.rotation.y = 0.08;
  const hull = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.36, 2.75), mats.darkTimber);
  const bench = new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.08, 0.34), mats.creamPlaster);
  bench.position.y = 0.16;
  boatGroup.add(hull, bench);
  mergeStaticGroupMeshes(boatGroup);
  group.add(boatGroup);

  // Historic Stone Watermill on the West Bank of Tabakhane Deresi (z = 76)
  const millZ = 76;
  const millX = getTabakhaneCenterX(millZ) - 6.6;
  const millY = getTerrainHeightAt(millX, millZ);
  const millGroup = new THREE.Group();
  millGroup.position.set(millX, millY, millZ);
  const millStatic = new THREE.Group();
  const millSkirt = new THREE.Mesh(new THREE.BoxGeometry(6.4, 1.8, 5.4), mats.travertine);
  millSkirt.position.y = -0.85;
  millStatic.add(millSkirt);
  const millBase = new THREE.Mesh(new THREE.BoxGeometry(6.2, 4.2, 5.2), mats.travertine);
  millBase.position.y = 2.1;
  millBase.castShadow = true;
  millBase.receiveShadow = true;
  millStatic.add(millBase);
  const millRoof = new THREE.Mesh(createGableRoofGeometry(6.8, 5.8, 2.0), mats.terracottaRoof);
  millRoof.position.y = 4.18;
  millRoof.castShadow = true;
  millStatic.add(millRoof);
  const millChimney = new THREE.Mesh(new THREE.BoxGeometry(0.65, 1.3, 0.65), mats.industrialBrick);
  millChimney.position.set(-1.8, 5.5, -1.2);
  millStatic.add(millChimney);
  mergeStaticGroupMeshes(millStatic);
  millGroup.add(millStatic);

  const waterWheelPivot = new THREE.Group();
  waterWheelPivot.position.set(3.3, 1.25, 0);
  const wheelRim = new THREE.Mesh(new THREE.TorusGeometry(1.35, 0.12, 8, 16), mats.darkTimber);
  wheelRim.rotation.y = Math.PI / 2;
  waterWheelPivot.add(wheelRim);
  for (let i = 0; i < 6; i++) {
    const spoke = new THREE.Mesh(new THREE.BoxGeometry(0.28, 2.7, 0.14), mats.darkTimber);
    spoke.rotation.x = (i * Math.PI) / 6;
    waterWheelPivot.add(spoke);
  }
  mergeStaticGroupMeshes(waterWheelPivot);
  millGroup.add(waterWheelPivot);
  group.add(millGroup);
  colliders.push({
    minX: millX - 3.2,
    maxX: millX + 3.2,
    minZ: millZ - 2.7,
    maxZ: millZ + 2.7,
    maxY: millY + 5.2,
  });

  return {
    terrainMat,
    blockTurfMat,
    hillMat,
    updateStreamProps: (dt, elapsed, focusX, focusZ) => {
      const millDx = focusX - millX;
      const millDz = focusZ - millZ;
      if (millDx * millDx + millDz * millDz <= 9025) {
        waterWheelPivot.rotation.x -= dt * 1.15;
      }
      const boatDx = focusX - boatX;
      const boatDz = focusZ - boatZ;
      if (boatDx * boatDx + boatDz * boatDz <= 9025) {
        boatGroup.position.y = boatBaseY + Math.sin(elapsed * 1.5) * 0.04;
        boatGroup.rotation.z = Math.sin(elapsed * 1.1) * 0.03;
      }
    },
  };
}
