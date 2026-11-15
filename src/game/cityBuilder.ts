import * as THREE from 'three';
import {
  AYDIN_ROAD_SEGMENTS,
  RAIL_TRACK_Z,
  sampleNearestRoad,
  TABAKHANE_BRIDGE_ZS,
} from '../data/aydinRoads';
import {
  DEFAULT_HOUSE_EXTERIOR,
  LANDMARKS,
  PLAYER_HOME_DOOR_POS,
  PLAYER_HOME_POS,
} from '../data/efelerData';
import { ColliderBox, HouseExteriorConfig } from '../types/game';
import { buildCustomPlayerHouse, buildDioramaHouse, BuiltCustomPlayerHouse } from './dioramaHouses';
import { buildAllLandmarks, BuiltLandmark } from './landmarks';
import {
  createBeyCamiiLokmaStand,
  createLibraryAndVendor,
  createParkGuitarYouthGroup,
  createStreetMusiciansZeybek,
  LibraryVendorRig,
  LokmaStandRig,
  ParkGuitarYouthRig,
  StreetMusiciansRig,
} from './interactions3d';
import {
  AmbientTrafficSystem,
  buildAncientCitiesSignposts,
  createAmbientTrafficSystem,
  createLivingFigTree,
  createPedestrianSystem,
  createSteamTrainSystem,
  createTrafficLightSystem,
  LivingFigTree,
  PedestrianSystem,
  SteamTrainSystem,
  TrafficLightSystem,
} from './livingWorld';
import { CityMaterialLibrary } from './materials';
import { BuildingNpcSystem, createBuildingNpcSystem } from './cityNpcs';
import { mergeStaticGroupMeshes } from './meshMerge';
import { PerchSystem } from './perchSystem';
import { buildMainRoadSignposts } from './roadSignposts';
import { createGableRoofGeometry } from './roofGeometry';
import {
  createSeasonalFoliageSystem,
  SeasonalAtmosphereState,
  SeasonalFoliageSystem,
  ShrubPlacement,
  TreePlacement,
} from './seasonalFoliage';
import {
  getBaseTerrainHeight,
  getSurfaceHeightAt,
  getSurfaceSlopeAngles,
  getTabakhaneCenterX,
  getTabakhaneHalfWidth,
  getTabakhaneWaterY,
  getTerrainHeightAt,
  getWalkableSurfaceHeightAt,
} from './terrain';

export interface BuiltCity {
  group: THREE.Group;
  landmarks: BuiltLandmark[];
  colliders: ColliderBox[];
  figTree: LivingFigTree;
  pedestrians: PedestrianSystem;
  trafficLights: TrafficLightSystem;
  steamTrain: SteamTrainSystem;
  ambientTraffic: AmbientTrafficSystem;
  musicians: StreetMusiciansRig;
  libraryVendor: LibraryVendorRig;
  lokmaStand: LokmaStandRig;
  parkGuitarBand: ParkGuitarYouthRig;
  buildingNpcs: BuildingNpcSystem;
  foliage: SeasonalFoliageSystem;
  homeRingMesh: THREE.Mesh;
  interactiveClickables: THREE.Object3D[];
  perches: PerchSystem;
  crumbSpots: Array<[number, number, number]>;
  updatePlayerHomeExterior: (config: HouseExteriorConfig) => void;
  update: (dt: number, elapsed: number, focusX?: number, focusZ?: number) => void;
  updateAtmosphere: (dt: number, elapsed: number, state: SeasonalAtmosphereState) => void;
  dispose: () => void;
}

function overlapsAny(
  x: number,
  z: number,
  w: number,
  d: number,
  existing: ColliderBox[],
  margin = 2.0
): boolean {
  const minX = x - w / 2 - margin;
  const maxX = x + w / 2 + margin;
  const minZ = z - d / 2 - margin;
  const maxZ = z + d / 2 + margin;
  for (const b of existing) {
    if (minX < b.maxX && maxX > b.minX && minZ < b.maxZ && maxZ > b.minZ) {
      return true;
    }
  }
  return false;
}

function nearRoad(x: number, z: number, w: number, d: number): boolean {
  const sample = sampleNearestRoad(x, z, 12);
  if (sample.road && sample.dist < sample.road.width * 0.5 + Math.max(w, d) * 0.5 + 2.0) {
    return true;
  }
  if (Math.abs(x - getTabakhaneCenterX(z)) < w / 2 + getTabakhaneHalfWidth() + 2.2) {
    return true;
  }
  if (Math.abs(z - RAIL_TRACK_Z) < d / 2 + 2.5) {
    return true;
  }
  return false;
}


function createTerrainConformingPatch(
  cx: number,
  cz: number,
  width: number,
  depth: number,
  segsX: number,
  segsZ: number,
  yOffset: number,
  useBase = true
): THREE.BufferGeometry {
  const geo = new THREE.PlaneGeometry(width, depth, segsX, segsZ);
  geo.rotateX(-Math.PI / 2);
  const pos = geo.attributes.position as THREE.BufferAttribute;
  for (let i = 0; i < pos.count; i++) {
    const wx = cx + pos.getX(i);
    const wz = cz + pos.getZ(i);
    const wy = (useBase ? getBaseTerrainHeight(wx, wz) : getTerrainHeightAt(wx, wz)) + yOffset;
    pos.setY(i, wy);
  }
  geo.computeVertexNormals();
  return geo;
}

function createStoneArchBridgeGeometry(depth = 0.54): THREE.BufferGeometry {
  const shape = new THREE.Shape();
  shape.moveTo(-6.2, 0);
  shape.lineTo(-2.75, 0);
  shape.absellipse(0, 0, 2.75, 1.38, Math.PI, 0, true, 0);
  shape.lineTo(6.2, 0);
  shape.lineTo(6.2, 1.85);
  shape.quadraticCurveTo(0, 2.99, -6.2, 1.85);
  shape.closePath();

  const geo = new THREE.ExtrudeGeometry(shape, {
    depth,
    bevelEnabled: true,
    bevelThickness: 0.04,
    bevelSize: 0.04,
    bevelSegments: 2,
  });
  geo.translate(0, 0, -depth / 2);
  return geo;
}

function createBridgeVaultSoffitGeometry(spanWidth: number): THREE.BufferGeometry {
  const shape = new THREE.Shape();
  shape.moveTo(-5.8, 0);
  shape.lineTo(-2.75, 0);
  shape.absellipse(0, 0, 2.75, 1.38, Math.PI, 0, true, 0);
  shape.lineTo(5.8, 0);
  shape.lineTo(5.8, 1.04);
  shape.quadraticCurveTo(0, 2.2, -5.8, 1.04);
  shape.closePath();

  const geo = new THREE.ExtrudeGeometry(shape, {
    depth: spanWidth,
    bevelEnabled: false,
  });
  geo.translate(0, 0, -spanWidth / 2);
  return geo;
}

export function buildEfelerCity(
  mats: CityMaterialLibrary,
  initialHouseExterior: HouseExteriorConfig = DEFAULT_HOUSE_EXTERIOR
): BuiltCity {
  const group = new THREE.Group();
  const staticWorldGroup = new THREE.Group();
  group.add(staticWorldGroup);
  const colliders: ColliderBox[] = [];
  const perches = new PerchSystem();
  const crumbSpots: Array<[number, number, number]> = [];
  const localDisposables: { dispose: () => void }[] = [];

  const registerHousePerches = (
    idPrefix: string,
    cx: number,
    gy: number,
    cz: number,
    w: number,
    d: number,
    h: number,
    variant: number,
    rotY = 0
  ) => {
    const ridgeAlongZ = variant % 2 === 0;
    const peakH = Math.max(1.9, (ridgeAlongZ ? w : d) * 0.42 + (variant % 2) * 0.25);
    const ridgeY = gy + h + 0.22 + peakH + 0.14;
    const cosR = Math.cos(rotY);
    const sinR = Math.sin(rotY);
    const toWorld = (lx: number, wy: number, lz: number) =>
      new THREE.Vector3(cx + lx * cosR + lz * sinR, wy, cz - lx * sinR + lz * cosR);

    if (ridgeAlongZ) {
      perches.addStaticSegment(
        `${idPrefix}_ridge`,
        toWorld(0, ridgeY, -d * 0.48),
        toWorld(0, ridgeY, d * 0.48),
        0.16,
        'stone'
      );
    } else {
      perches.addStaticSegment(
        `${idPrefix}_ridge`,
        toWorld(-w * 0.48, ridgeY, 0),
        toWorld(w * 0.48, ridgeY, 0),
        0.16,
        'stone'
      );
    }

    // Front porch eave ridge perch
    const porchW = Math.min(w * 0.78, 4.4);
    const porchZ = d / 2 + 0.75;
    const porchY = gy + 0.54 + 2.15 + 0.85 + 0.12;
    perches.addStaticSegment(
      `${idPrefix}_porch`,
      toWorld(-porchW * 0.42, porchY, porchZ),
      toWorld(porchW * 0.42, porchY, porchZ),
      0.13,
      'wood'
    );
    return peakH;
  };

  // 1. Sculpted 1:100 Aydın Efeler Horizon Terrain (Büyük Menderes Ovası -> Tralleis & Aytepe Yokuşları -> Aydın Dağları Etekleri)
  const terrainGeo = new THREE.PlaneGeometry(760, 760, 104, 104);
  terrainGeo.rotateX(-Math.PI / 2);
  const tPos = terrainGeo.attributes.position as THREE.BufferAttribute;
  const tColors = new Float32Array(tPos.count * 3);
  const cPlain = new THREE.Color(0x8ea35a);
  const cFoothill = new THREE.Color(0xa69857);
  const cRidge = new THREE.Color(0x8a8364);
  const cPineFoot = new THREE.Color(0x5b7646);
  const cStreamBank = new THREE.Color(0x536d41);
  const cTmp = new THREE.Color();

  for (let i = 0; i < tPos.count; i++) {
    const wx = tPos.getX(i);
    const wz = tPos.getZ(i);
    const wy = getTerrainHeightAt(wx, wz);
    tPos.setY(i, wy);

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
    const patch = new THREE.Mesh(
      createTerrainConformingPatch(fx, fz, fw, fd, 8, 8, 0.032, false),
      mat
    );
    patch.position.set(fx, 0, fz);
    patch.receiveShadow = true;
    staticWorldGroup.add(patch);
  });

  // Sculpted 3D Aydın Dağları (Kuzey: Paşayaylası / İmamköy / Kalfaköy Sıradağları) + Güney Koçarlı-Çine & Batı Germencik Sırtları
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

  // Northern Aydın Dağları (Paşayaylası ~1750m, Cevizli, İmamköy, Kalfaköy Sırtları with Tabakhane Boğazı canyon pass)
  buildMountainMassif(-360, 360, -340, -162, 68, 18, (mx, mz) => {
    const zT = THREE.MathUtils.clamp((-162 - mz) / 168, 0, 1);
    const zEnvelope = Math.sin(zT * Math.PI * 0.82) * Math.pow(zT, 0.75);
    const xEdgeFade = 1 - THREE.MathUtils.smoothstep(Math.abs(mx), 275, 360);
    // Multi-harmonic peaks: Paşayaylası east-center summit + Kalfaköy ridge + Cevizli west peaks
    const ridge1 = Math.sin(mx * 0.02 + 0.4) * 0.5 + 0.5;
    const ridge2 = Math.cos(mx * 0.044 - 1.1) * 0.5 + 0.5;
    const ridge3 = Math.sin((mx + mz * 0.6) * 0.072) * 0.5 + 0.5;
    const pasayaylaPeak = Math.exp(-Math.pow((mx - 58) / 75, 2)) * 22;
    const kalfakoyPeak = Math.exp(-Math.pow((mx + 56) / 62, 2)) * 16;
    const imamkoyPeak = Math.exp(-Math.pow((mx - 165) / 68, 2)) * 18;
    // Carve natural Tabakhane Deresi Boğazı gorge around x ~ 42
    const tabakhaneGorge = Math.exp(-Math.pow((mx - 42) / 20, 2)) * 14 * (1 - zT * 0.45);
    const rawPeak = 24 + ridge1 * 18 + ridge2 * 11 + ridge3 * 6 + pasayaylaPeak + kalfakoyPeak + imamkoyPeak - tabakhaneGorge;
    return Math.max(0, rawPeak * zEnvelope * xEdgeFade);
  }, 66);

  // Southern Koçarlı / Madran / Çine Horizon Silhouettes beyond Büyük Menderes Ovası
  buildMountainMassif(-350, 350, 185, 290, 44, 10, (mx, mz) => {
    const zT = THREE.MathUtils.clamp((mz - 185) / 100, 0, 1);
    const zEnv = Math.sin(zT * Math.PI * 0.88);
    const xFade = 1 - THREE.MathUtils.smoothstep(Math.abs(mx), 275, 350);
    const wave = (Math.sin(mx * 0.022 + 1.2) * 0.5 + 0.5) * 11 + (Math.cos(mx * 0.05) * 0.5 + 0.5) * 5;
    return Math.max(0, (8 + wave) * zEnv * xFade);
  }, 24);

  // Western Germencik / İncirliova Foothills & Eastern Sultanhisar Hills
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

  // 3. Terrain-Conforming Urban Block Meadows
  const blockTurfMat = new THREE.MeshStandardMaterial({ color: 0x99ab62, roughness: 0.92 });
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
    const turf = new THREE.Mesh(
      createTerrainConformingPatch(bx, bz, bw, bd, 6, 6, 0.024, true),
      blockTurfMat
    );
    turf.position.set(bx, 0, bz);
    turf.receiveShadow = true;
    staticWorldGroup.add(turf);
  });

  // 4. Real-World Tabakhane Deresi (behind Tarihi Sarı Belediye Binası, separating Orta Mahalle & ADÜ foothills from Merkez Bulvarı)
  const streamZStart = -162;
  const streamZEnd = 136;
  const streamSegs = 68;
  const halfStreamW = getTabakhaneHalfWidth();

  // Continuous downhill water surface ribbon
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

  // Continuous Left & Right Travertine Retaining Embankments + Stone Coping Caps along Tabakhane Deresi
  [-1, 1].forEach((side) => {
    const bankOffset = side * (halfStreamW + 0.42);
    const capWidth = 0.92;
    const wallBottomDrop = 1.65;
    const wallTopRise = 0.24;

    // 4 vertices per cross-section: [innerBottom, innerTop, outerTop, outerBottom]
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
      // Lower embankment coping seamlessly under bridge road/sidewalk decks so coping never pokes through
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

  // Stone Arch Bridges ("Tabakhane Köprüleri") on every E–W Boulevard crossing Tabakhane Deresi
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

    // Solid vaulted stone arch underside spanning across full road + sidewalk width
    const soffitGeo = createBridgeVaultSoffitGeometry(outerHalfW * 2);
    localDisposables.push(soffitGeo);
    const soffitMesh = new THREE.Mesh(soffitGeo, mats.travertine);
    soffitMesh.castShadow = true;
    soffitMesh.receiveShadow = true;
    bridgeGroup.add(soffitMesh);

    // North & South sculpted stone arch parapets positioned cleanly outside both sidewalks
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

    // Bridge corner stone bollards & warm bridge lanterns seated flush on parapet ends
    [-5.95, 5.95].forEach((bxOff) => {
      [-parapetZ, parapetZ].forEach((pz) => {
        const post = new THREE.Mesh(new THREE.BoxGeometry(0.56, 0.78, 0.56), mats.creamPlaster);
        post.position.set(bxOff, 2.02, pz);
        bridgeGroup.add(post);

        const cap = new THREE.Mesh(new THREE.BoxGeometry(0.66, 0.14, 0.66), mats.travertine);
        cap.position.set(bxOff, 2.44, pz);
        bridgeGroup.add(cap);

        const lantern = new THREE.Mesh(new THREE.SphereGeometry(0.16, 8, 6), mats.lampBulb);
        lantern.position.set(bxOff, 2.66, pz);
        bridgeGroup.add(lantern);
      });
    });

    // Bridge parapet perches for Sparrow
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

  // Waterfront Wooden Rowboat bobbing behind Sarı Belediye on Tabakhane Deresi
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

  // Shared seasonal palette & diorama house materials (used by hillside cottage, Sıcak Yuvam & townhouses)
  const plasterMats = [
    mats.creamPlaster,
    mats.peachPlaster,
    mats.terracottaPlaster,
    mats.ochrePlaster,
    mats.sagePlaster,
    mats.skyBluePlaster,
    mats.whitePlaster,
  ];
  const yardLawnMat = new THREE.MeshStandardMaterial({ color: 0x8ca854, roughness: 0.9 });
  const flowerBoxMat = new THREE.MeshStandardMaterial({ color: 0x5d8242, roughness: 0.85 });
  const blossomMat = new THREE.MeshStandardMaterial({ color: 0xd9614a, roughness: 0.76 });
  localDisposables.push(yardLawnMat, flowerBoxMat, blossomMat);
  const chimneyOrigins: [number, number, number][] = [];

  // Cozy Hillside Farmhouse above Orta Mahalle Foothills (East)
  const cottageX = 134;
  const cottageZ = -64;
  const cottageY = getTerrainHeightAt(cottageX, cottageZ);
  const builtCottage = buildDioramaHouse({
    w: 5.8,
    d: 4.6,
    h: 3.6,
    variant: 2,
    mats,
    wallMat: mats.creamPlaster,
    lawnMat: yardLawnMat,
    flowerBoxMat,
    blossomMat,
  });
  builtCottage.group.position.set(cottageX, cottageY, cottageZ);
  builtCottage.group.rotation.y = 0.22;
  group.add(builtCottage.group);
  const cottagePeak = registerHousePerches(
    'cottage',
    cottageX,
    cottageY,
    cottageZ,
    5.8,
    4.6,
    3.6,
    2,
    0.22
  );
  colliders.push({
    minX: cottageX - 3.1,
    maxX: cottageX + 3.1,
    minZ: cottageZ - 2.6,
    maxZ: cottageZ + 2.6,
    maxY: cottageY + 3.6 + 0.22 + cottagePeak + 0.14,
    roof: {
      cx: cottageX,
      cz: cottageZ,
      halfW: 5.8 / 2 + 0.25,
      halfD: 4.6 / 2 + 0.25,
      wallTopY: cottageY + 3.6 + 0.22,
      peakH: cottagePeak + 0.12,
      ridgeAlongZ: true,
      rotY: 0.22,
    },
  });

  // 5. Terrain-Conforming 1:100 Aydın Polyline Road Network (Zero-Overlap Seam-Clipped Ribbons)
  const SIDEWALK_WIDTH = 1.3;
  const CURB_OFFSET = 0.092;
  const ROAD_SURFACE_OFFSET = 0.136;

  interface PlacedRoadEdge {
    ax: number;
    az: number;
    bx: number;
    bz: number;
    halfW: number;
    outerHalfW: number;
  }

  interface ClippedSubPolyline {
    points: [number, number][];
    startSlope: number;
    endSlope: number;
  }

  const clipPolylineAgainstPlacedRoads = (
    rawPts: [number, number][],
    placed: PlacedRoadEdge[],
    useOuterSidewalk: boolean
  ): ClippedSubPolyline[] => {
    interface CutSpan {
      t0: number;
      t1: number;
      slope0: number;
      slope1: number;
    }
    interface ActiveEdgeSpan {
      p0: [number, number];
      p1: [number, number];
      startSlope: number;
      endSlope: number;
      touchesStart: boolean;
      touchesEnd: boolean;
    }

    const edgeSpans: ActiveEdgeSpan[][] = [];

    for (let e = 0; e < rawPts.length - 1; e++) {
      const [ax, az] = rawPts[e];
      const [bx, bz] = rawPts[e + 1];
      const dx = bx - ax;
      const dz = bz - az;
      const segLen = Math.hypot(dx, dz);
      if (segLen < 0.25) {
        edgeSpans.push([]);
        continue;
      }

      const ux = dx / segLen;
      const uz = dz / segLen;
      const nx = -uz;
      const nz = ux;

      const cuts: CutSpan[] = [];
      for (let p = 0; p < placed.length; p++) {
        const obs = placed[p];
        const odx = obs.bx - obs.ax;
        const odz = obs.bz - obs.az;
        const obsLen = Math.hypot(odx, odz);
        if (obsLen < 0.2) continue;

        const vx = odx / obsLen;
        const vz = odz / obsLen;
        const onx = -vz;
        const onz = vx;

        const denom = ux * onx + uz * onz;
        if (Math.abs(denom) < 0.18) continue;

        const crossUV = ux * vz - uz * vx;
        if (Math.abs(crossUV) < 1e-5) continue;

        const dxAC = obs.ax - ax;
        const dzAC = obs.az - az;
        const tHit = (dxAC * vz - dzAC * vx) / crossUV;
        const sHit = (dxAC * uz - dzAC * ux) / crossUV;

        if (sHit < -0.25 || sHit > obsLen + 0.25) continue;
        if (tHit < -0.6 || tHit > segLen + 0.6) continue;

        const rObs = useOuterSidewalk ? obs.outerHalfW : obs.halfW;
        const halfSpan = rObs / Math.abs(denom);
        const slope = THREE.MathUtils.clamp(-(nx * onx + nz * onz) / denom, -1.15, 1.15);

        cuts.push({
          t0: tHit - halfSpan,
          t1: tHit + halfSpan,
          slope0: slope,
          slope1: slope,
        });
      }

      cuts.sort((a, b) => a.t0 - b.t0);
      const merged: CutSpan[] = [];
      for (let c = 0; c < cuts.length; c++) {
        const cur = cuts[c];
        if (merged.length === 0 || cur.t0 > merged[merged.length - 1].t1 + 0.05) {
          merged.push({ ...cur });
        } else {
          const prev = merged[merged.length - 1];
          if (cur.t1 > prev.t1) {
            prev.t1 = cur.t1;
            prev.slope1 = cur.slope1;
          }
        }
      }

      const active: ActiveEdgeSpan[] = [];
      let cursor = 0;
      let cursorSlope = 0;

      for (let c = 0; c < merged.length; c++) {
        const cut = merged[c];
        const endT = Math.min(segLen, cut.t0);
        if (endT - cursor > 0.35) {
          active.push({
            p0: [ax + ux * cursor, az + uz * cursor],
            p1: [ax + ux * endT, az + uz * endT],
            startSlope: cursorSlope,
            endSlope: cut.slope0,
            touchesStart: cursor <= 1e-4,
            touchesEnd: endT >= segLen - 1e-4,
          });
        }
        if (cut.t1 > cursor) {
          cursor = cut.t1;
          cursorSlope = cut.slope1;
        }
      }

      if (segLen - cursor > 0.35) {
        active.push({
          p0: [ax + ux * cursor, az + uz * cursor],
          p1: [bx, bz],
          startSlope: cursorSlope,
          endSlope: 0,
          touchesStart: cursor <= 1e-4,
          touchesEnd: true,
        });
      }

      edgeSpans.push(active);
    }

    // Chain consecutive full-junction spans back into continuous mitered polylines
    const chains: ClippedSubPolyline[] = [];
    let currentChain: ClippedSubPolyline | null = null;

    for (let e = 0; e < edgeSpans.length; e++) {
      const spans = edgeSpans[e];
      if (spans.length === 0) {
        if (currentChain) {
          chains.push(currentChain);
          currentChain = null;
        }
        continue;
      }

      for (let s = 0; s < spans.length; s++) {
        const sp = spans[s];
        if (s === 0 && sp.touchesStart && currentChain) {
          currentChain.points.push(sp.p1);
          currentChain.endSlope = sp.endSlope;
          if (!sp.touchesEnd) {
            chains.push(currentChain);
            currentChain = null;
          }
        } else {
          if (currentChain) {
            chains.push(currentChain);
            currentChain = null;
          }
          const newChain: ClippedSubPolyline = {
            points: [sp.p0, sp.p1],
            startSlope: sp.startSlope,
            endSlope: sp.endSlope,
          };
          if (sp.touchesEnd && s === spans.length - 1) {
            currentChain = newChain;
          } else {
            chains.push(newChain);
          }
        }
      }
    }
    if (currentChain) chains.push(currentChain);
    return chains;
  };

  const createMiteredStripGeometry = (
    poly: ClippedSubPolyline,
    lateralMin: number,
    lateralMax: number,
    segsAcross: number,
    yOffset: number
  ): THREE.BufferGeometry => {
    const pts = poly.points;
    const nPts = pts.length;
    const edgeDirs: [number, number][] = [];
    const edgeNormals: [number, number][] = [];
    const edgeLens: number[] = [];

    for (let i = 0; i < nPts - 1; i++) {
      const dx = pts[i + 1][0] - pts[i][0];
      const dz = pts[i + 1][1] - pts[i][1];
      const len = Math.hypot(dx, dz) || 1;
      const ux = dx / len;
      const uz = dz / len;
      edgeDirs.push([ux, uz]);
      edgeNormals.push([-uz, ux]);
      edgeLens.push(len);
    }

    // Miter normal at each polyline vertex
    const vertexMiters: [number, number][] = [];
    for (let i = 0; i < nPts; i++) {
      if (i === 0) {
        vertexMiters.push(edgeNormals[0]);
      } else if (i === nPts - 1) {
        vertexMiters.push(edgeNormals[nPts - 2]);
      } else {
        const [n0x, n0z] = edgeNormals[i - 1];
        const [n1x, n1z] = edgeNormals[i];
        const bx = n0x + n1x;
        const bz = n0z + n1z;
        const bLen = Math.hypot(bx, bz);
        if (bLen < 1e-4) {
          vertexMiters.push(edgeNormals[i]);
        } else {
          const mx = bx / bLen;
          const mz = bz / bLen;
          const cosHalf = Math.max(0.62, mx * n0x + mz * n0z);
          vertexMiters.push([mx / cosHalf, mz / cosHalf]);
        }
      }
    }

    interface StripRow {
      cx: number;
      cz: number;
      ux: number;
      uz: number;
      nx: number;
      nz: number;
      skew: number;
      distAlong: number;
    }

    const rows: StripRow[] = [];
    let accumDist = 0;
    const totalLen = edgeLens.reduce((acc, v) => acc + v, 0);

    for (let e = 0; e < nPts - 1; e++) {
      const [ax, az] = pts[e];
      const [bx, bz] = pts[e + 1];
      const [ux, uz] = edgeDirs[e];
      const [m0x, m0z] = vertexMiters[e];
      const [m1x, m1z] = vertexMiters[e + 1];
      const segLen = edgeLens[e];
      const steps = Math.max(2, Math.round(segLen / 1.4));

      const startIdx = e === 0 ? 0 : 1;
      for (let s = startIdx; s <= steps; s++) {
        const f = s / steps;
        const cx = ax + (bx - ax) * f;
        const cz = az + (bz - az) * f;
        const dist = accumDist + segLen * f;

        // Smoothly interpolate lateral cross-section vector from start miter to end miter
        const nx = m0x + (m1x - m0x) * f;
        const nz = m0z + (m1z - m0z) * f;

        let skew = 0;
        const fadeDist = Math.min(segLen * 0.45, 3.6);
        if (e === 0 && poly.startSlope !== 0 && dist < fadeDist) {
          skew += poly.startSlope * (1 - dist / fadeDist);
        }
        const remFromEnd = totalLen - dist;
        if (e === nPts - 2 && poly.endSlope !== 0 && remFromEnd < fadeDist) {
          skew += poly.endSlope * (1 - remFromEnd / fadeDist);
        }

        rows.push({ cx, cz, ux, uz, nx, nz, skew, distAlong: dist });
      }
      accumDist += segLen;
    }

    const cols = segsAcross + 1;
    const positions = new Float32Array(rows.length * cols * 3);
    const uvs = new Float32Array(rows.length * cols * 2);
    const indices: number[] = [];

    for (let r = 0; r < rows.length; r++) {
      const row = rows[r];
      for (let c = 0; c < cols; c++) {
        const uFrac = c / segsAcross;
        const wCoord = lateralMin + (lateralMax - lateralMin) * uFrac;
        const alongShift = wCoord * row.skew;
        const wx = row.cx + row.nx * wCoord + row.ux * alongShift;
        const wz = row.cz + row.nz * wCoord + row.uz * alongShift;
        const wy = getSurfaceHeightAt(wx, wz) + yOffset;

        const idx = r * cols + c;
        positions[idx * 3] = wx;
        positions[idx * 3 + 1] = wy;
        positions[idx * 3 + 2] = wz;
        uvs[idx * 2] = uFrac;
        uvs[idx * 2 + 1] = row.distAlong / 10;
      }
    }

    for (let r = 0; r < rows.length - 1; r++) {
      for (let c = 0; c < segsAcross; c++) {
        const a = r * cols + c;
        const b = a + 1;
        const cIdx = (r + 1) * cols + c;
        const d = cIdx + 1;
        indices.push(a, b, cIdx, b, d, cIdx);
      }
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
    geo.setIndex(indices);
    geo.computeVertexNormals();
    return geo;
  };

  const placedRoadEdges: PlacedRoadEdge[] = [];
  const dashGeo = new THREE.PlaneGeometry(0.22, 3.0);
  dashGeo.userData.isSharedGeo = true;
  const ewStripeGeo = new THREE.PlaneGeometry(0.55, 2.0);
  ewStripeGeo.userData.isSharedGeo = true;
  const nsStripeGeo = new THREE.PlaneGeometry(2.0, 0.55);
  nsStripeGeo.userData.isSharedGeo = true;
  localDisposables.push(dashGeo, ewStripeGeo, nsStripeGeo);

  AYDIN_ROAD_SEGMENTS.forEach((road) => {
    const roadMat = road.surface === 'cobble' ? mats.cobble : mats.asphalt;
    const halfW = road.width * 0.5;
    const outerHalfW = halfW + SIDEWALK_WIDTH;

    // Extend free L-corner tips cleanly so outer corner squares are complete
    const basePts: [number, number][] = road.points.map(([px, pz]) => [px, pz]);
    if (road.id === 'istasyon-blv') {
      basePts[0] = [-156, 70];
    } else if (road.id === 'cankaya-kemer-cd') {
      basePts[basePts.length - 1] = [122.2, -72];
    }

    // 1. Road deck sub-polylines clipped flush at higher-priority crossing road curbs
    const roadChains = clipPolylineAgainstPlacedRoads(basePts, placedRoadEdges, false);
    roadChains.forEach((chain) => {
      const roadMesh = new THREE.Mesh(
        createMiteredStripGeometry(chain, -halfW, halfW, 4, ROAD_SURFACE_OFFSET),
        roadMat
      );
      roadMesh.receiveShadow = true;
      staticWorldGroup.add(roadMesh);

      // Dashed centerlines only along clear spans between intersections
      if (road.hasCenterLine) {
        for (let i = 0; i < chain.points.length - 1; i++) {
          const [ax, az] = chain.points[i];
          const [bx, bz] = chain.points[i + 1];
          const dx = bx - ax;
          const dz = bz - az;
          const segLen = Math.hypot(dx, dz);
          if (segLen < 8.5) continue;
          const ux = dx / segLen;
          const uz = dz / segLen;
          const yaw = Math.atan2(dx, dz);
          for (let d = 4.2; d <= segLen - 4.2; d += 6.4) {
            const cx = ax + ux * d;
            const cz = az + uz * d;
            if (Math.abs(cx) < 16 && cz > -18 && cz < 28) continue;
            const dy = getSurfaceHeightAt(cx, cz) + ROAD_SURFACE_OFFSET + 0.028;
            const slopes = getSurfaceSlopeAngles(cx, cz, yaw + Math.PI);
            const dash = new THREE.Mesh(dashGeo, mats.roadStripe);
            dash.rotation.order = 'YXZ';
            dash.rotation.set(-Math.PI / 2 + slopes.pitch, yaw, slopes.roll);
            dash.position.set(cx, dy, cz);
            staticWorldGroup.add(dash);
          }
        }
      }
    });

    // 2. Left & Right sidewalk flanking strips clipped cleanly at crossing outer sidewalk edges
    const sidewalkChains = clipPolylineAgainstPlacedRoads(basePts, placedRoadEdges, true);
    sidewalkChains.forEach((chain) => {
      const leftCurb = new THREE.Mesh(
        createMiteredStripGeometry(chain, halfW, outerHalfW, 2, CURB_OFFSET),
        mats.sidewalk
      );
      leftCurb.receiveShadow = true;
      const rightCurb = new THREE.Mesh(
        createMiteredStripGeometry(chain, -outerHalfW, -halfW, 2, CURB_OFFSET),
        mats.sidewalk
      );
      rightCurb.receiveShadow = true;
      staticWorldGroup.add(leftCurb, rightCurb);
    });

    // Register actually placed road edges so lower-priority roads clip cleanly against them
    roadChains.forEach((chain) => {
      for (let i = 0; i < chain.points.length - 1; i++) {
        placedRoadEdges.push({
          ax: chain.points[i][0],
          az: chain.points[i][1],
          bx: chain.points[i + 1][0],
          bz: chain.points[i + 1][1],
          halfW,
          outerHalfW,
        });
      }
    });
  });

  // Zebra crosswalks placed strictly on verified road arms entering major intersections
  const crosswalkIntersections: [number, number][] = [
    [-19, 38],
    [19, 38],
    [19, -30],
    [-19, -30],
    [-58, 30],
    [-102, 11.5],
    [68, 10],
    [118, 10],
    [-19, 70],
    [19, 70],
    [68, -30],
  ];
  crosswalkIntersections.forEach(([ix, iz]) => {
    const armS = sampleNearestRoad(ix, iz + 5.6, 1.5);
    if (armS.road && armS.dist < 1.2) {
      const slopes = getSurfaceSlopeAngles(ix, iz + 5.6, 0);
      for (let s = -2.6; s <= 2.6; s += 1.3) {
        const stripeEW = new THREE.Mesh(ewStripeGeo, mats.roadStripe);
        stripeEW.rotation.set(-Math.PI / 2 + slopes.pitch, 0, slopes.roll);
        stripeEW.position.set(ix + s, getSurfaceHeightAt(ix + s, iz + 5.6) + ROAD_SURFACE_OFFSET + 0.028, iz + 5.6);
        staticWorldGroup.add(stripeEW);
      }
    }
    const armE = sampleNearestRoad(ix + 5.6, iz, 1.5);
    if (armE.road && armE.dist < 1.2) {
      const slopes = getSurfaceSlopeAngles(ix + 5.6, iz, 0);
      for (let s = -2.6; s <= 2.6; s += 1.3) {
        const stripeNS = new THREE.Mesh(nsStripeGeo, mats.roadStripe);
        stripeNS.rotation.set(-Math.PI / 2 + slopes.pitch, 0, slopes.roll);
        stripeNS.position.set(ix + 5.6, getSurfaceHeightAt(ix + 5.6, iz + s) + ROAD_SURFACE_OFFSET + 0.028, iz + s);
        staticWorldGroup.add(stripeNS);
      }
    }
  });

  // 6. Authentic Historical & Modern Efeler Landmarks
  const landmarks = buildAllLandmarks(LANDMARKS, mats);
  landmarks.forEach((lm) => {
    group.add(lm.group);
    group.add(lm.ringMesh);
    colliders.push(...lm.colliders);
  });

  // 7. Living World Additions: Growing Fig Tree, Pedestrians, Traffic Lights, Ancient Signposts
  const figTree = createLivingFigTree(mats);
  group.add(figTree.group);
  colliders.push({ minX: -2.7, maxX: 2.7, minZ: 17.1, maxZ: 22.5 });

  const pedestrians = createPedestrianSystem();
  group.add(pedestrians.group);

  const trafficLights = createTrafficLightSystem(mats);
  group.add(trafficLights.group);

  const steamTrain = createSteamTrainSystem(mats);
  group.add(steamTrain.group);

  const ambientTraffic = createAmbientTrafficSystem(mats);
  group.add(ambientTraffic.group);

  const signposts = buildAncientCitiesSignposts(mats, colliders);
  group.add(signposts);

  const mainRoadSignposts = buildMainRoadSignposts(mats, colliders, perches);
  group.add(mainRoadSignposts.group);
  localDisposables.push(mainRoadSignposts);

  const musicians = createStreetMusiciansZeybek(mats);
  group.add(musicians.group);

  const libraryVendor = createLibraryAndVendor(mats, colliders);
  group.add(libraryVendor.group);

  const lokmaStand = createBeyCamiiLokmaStand(mats, colliders);
  group.add(lokmaStand.group);

  const parkGuitarBand = createParkGuitarYouthGroup(mats, colliders);
  group.add(parkGuitarBand.group);

  const buildingNpcs = createBuildingNpcSystem(mats, colliders);
  group.add(buildingNpcs.group);

  // Player's Own House ("Sıcak Yuvam") facing Sevgi Yolu (+X) — Customizable 4-Style Villa
  const [hx, hz] = PLAYER_HOME_POS;
  const homeY = getTerrainHeightAt(hx, hz);
  let builtHome: BuiltCustomPlayerHouse = buildCustomPlayerHouse({
    config: initialHouseExterior,
    mats,
    lawnMat: yardLawnMat,
    flowerBoxMat,
    blossomMat,
  });
  builtHome.group.position.set(hx, homeY, hz);
  builtHome.group.rotation.y = Math.PI / 2;
  group.add(builtHome.group);
  const homePeak = registerHousePerches('player_home', hx, homeY, hz, 6.0, 5.4, 4.4, 0, Math.PI / 2);
  const homeChimneyIndex = chimneyOrigins.length;
  chimneyOrigins.push([
    hx + builtHome.chimneyTopLocal[2],
    homeY + builtHome.chimneyTopLocal[1],
    hz - builtHome.chimneyTopLocal[0],
  ]);
  colliders.push({
    minX: hx - 3.0,
    maxX: hx + 4.0,
    minZ: hz - 3.2,
    maxZ: hz + 3.2,
    maxY: homeY + 4.4 + 0.22 + homePeak + 0.14,
    roof: {
      cx: hx,
      cz: hz,
      halfW: 6.0 / 2 + 0.3,
      halfD: 5.4 / 2 + 0.3,
      wallTopY: homeY + 4.4 + 0.22,
      peakH: homePeak + 0.12,
      ridgeAlongZ: true,
      rotY: Math.PI / 2,
    },
  });
  crumbSpots.push([hx + 3.6, homeY + 3.85, hz]);

  const homeRingMesh = new THREE.Mesh(
    new THREE.RingGeometry(1.15, 1.55, 32),
    new THREE.MeshStandardMaterial({
      color: 0x61b88a,
      emissive: 0x4ba877,
      emissiveIntensity: 0.85,
      side: THREE.DoubleSide,
      roughness: 0.4,
      polygonOffset: true,
      polygonOffsetFactor: -3,
    })
  );
  homeRingMesh.rotation.x = -Math.PI / 2;
  homeRingMesh.position.set(
    PLAYER_HOME_DOOR_POS[0],
    getWalkableSurfaceHeightAt(PLAYER_HOME_DOOR_POS[0], PLAYER_HOME_DOOR_POS[1]) + 0.08,
    PLAYER_HOME_DOOR_POS[1]
  );
  group.add(homeRingMesh);

  // Stone garden walkway connecting Sıcak Yuvam front door to Adnan Menderes Blv. sidewalk
  const homeWalkway = new THREE.Mesh(new THREE.BoxGeometry(4.8, 0.22, 3.4), mats.cobble);
  homeWalkway.position.set(-26.6, homeY + 0.01, hz);
  homeWalkway.receiveShadow = true;
  staticWorldGroup.add(homeWalkway);
  const homeWalkBorder = new THREE.Mesh(new THREE.BoxGeometry(4.9, 0.16, 3.7), mats.travertine);
  homeWalkBorder.position.set(-26.6, homeY - 0.01, hz);
  staticWorldGroup.add(homeWalkBorder);

  mergeStaticGroupMeshes(staticWorldGroup);

  const interactiveClickables: THREE.Object3D[] = [
    musicians.clickTarget,
    libraryVendor.clickTarget,
    lokmaStand.clickTarget,
    parkGuitarBand.clickTarget,
    ...buildingNpcs.clickTargets,
  ];

  // 8. Miniature 3D Diorama Houses (overhanging pitched roofs, white bargeboards, columned porches, steps & yard fences)
  const addTownhouse = (
    x: number,
    z: number,
    w: number,
    d: number,
    h: number,
    variant: number,
    rotY = 0
  ) => {
    if (nearRoad(x, z, w, d) || overlapsAny(x, z, w, d, colliders, 1.8)) return;

    const gy = getTerrainHeightAt(x, z);
    const wallMat = plasterMats[variant % plasterMats.length];
    const built = buildDioramaHouse({
      w,
      d,
      h,
      variant,
      mats,
      wallMat,
      lawnMat: yardLawnMat,
      flowerBoxMat,
      blossomMat,
    });
    built.group.position.set(x, gy, z);
    built.group.rotation.y = rotY;
    group.add(built.group);

    if (chimneyOrigins.length < 18 && variant % 2 === 0) {
      const cosR = Math.cos(rotY);
      const sinR = Math.sin(rotY);
      const [cx, cy, cz] = built.chimneyTopLocal;
      chimneyOrigins.push([
        x + cx * cosR + cz * sinR,
        gy + cy,
        z - cx * sinR + cz * cosR,
      ]);
    }

    const peakH = registerHousePerches(`house_${x}_${z}`, x, gy, z, w, d, h, variant, rotY);

    colliders.push({
      minX: x - w / 2 - 0.3,
      maxX: x + w / 2 + 0.3,
      minZ: z - d / 2 - 0.3,
      maxZ: z + d / 2 + 1.0,
      maxY: gy + h + 0.22 + peakH + 0.14,
      roof: {
        cx: x,
        cz: z,
        halfW: w / 2 + 0.28,
        halfD: d / 2 + 0.28,
        wallTopY: gy + h + 0.22,
        peakH: peakH + 0.12,
        ridgeAlongZ: variant % 2 === 0,
        rotY,
      },
    });
    if (variant % 4 === 1) {
      crumbSpots.push([x, gy + h + peakH + 0.65, z]);
    }
  };

  // Dense Mediterranean Townhouse Clusters aligned cleanly inside widened real Efeler city blocks
  const blockCenters: [number, number, number, number][] = [
    // Hasanefendi – Ramazan Paşa (between Yağcılar -58 and Adnan Menderes -19)
    [-48, -3, 6.0, 5.2],
    [-48, -16, 5.8, 5.0],
    [-48, -39, 5.8, 5.0],
    [-29, -40, 5.8, 5.0],
    [-29, -58, 6.0, 5.2],
    [-48, -58, 6.0, 5.2],
    [-49, 25, 6.0, 5.2],
    [-29, 25, 5.8, 5.0],
    [-48, 52, 6.2, 5.4],
    [-31, 52, 6.2, 5.2],
    // Köprülü – Veysipaşa (between Adnan Menderes -19 and Hükümet +19)
    [-10, -40, 6.2, 5.4],
    [10, -40, 6.2, 5.4],
    [-10, -60, 6.0, 5.2],
    [10, -60, 6.0, 5.2],
    [-10, 54, 6.4, 5.4],
    [0, 54, 6.0, 5.2],
    [10, 54, 6.4, 5.4],
    // Güzelhisar & Köprülü East (between Hükümet +19 and Tabakhane Deresi ~59.5)
    [38, -60, 6.0, 5.2],
    [28, -40, 5.6, 4.8],
    [42, -16, 6.0, 5.2],
    [30, -16, 5.8, 5.0],
    [30, 54, 6.2, 5.2],
    [42, 54, 6.0, 5.2],
    [30, 24, 5.8, 5.0],
    // Zafer, Kalfaköy & Aytepe Slope Houses
    [-78, -82, 6.2, 5.4],
    [-78, -104, 6.0, 5.2],
    [-42, -82, 5.8, 5.0],
    [-12, -84, 5.8, 5.0],
    [48, -84, 6.2, 5.4],
    [48, -104, 6.0, 5.2],
    [108, -84, 6.2, 5.2],
    [108, -98, 6.0, 5.0],
    // Cuma / Yağcılar İçi & Cumhuriyet North
    [-92, -38, 6.4, 5.6],
    [-92, -54, 6.2, 5.4],
    [-76, -62, 6.0, 5.2],
    [-90, -2, 6.2, 5.4],
    [-72, -2, 6.0, 5.2],
    [-90, 20, 6.2, 5.4],
    [-72, 20, 6.0, 5.2],
    [-132, -32, 6.2, 5.4],
    [-132, -48, 6.2, 5.4],
    // Orta Mahalle, Meşrutiyet & Yedi Eylül (East of Tabakhane)
    [78, -4, 6.4, 5.4],
    [92, -4, 6.2, 5.2],
    [106, -4, 6.0, 5.2],
    [108, -48, 6.4, 5.4],
    [108, -34, 6.2, 5.4],
    [78, -18, 6.2, 5.2],
    [134, -36, 6.4, 5.4],
    [134, 34, 6.4, 5.4],
    // Kurtuluş South (below İstasyon Blv z = 70)
    [-40, 82, 6.8, 5.6],
    [-64, 82, 6.4, 5.4],
    [38, 82, 6.6, 5.6],
    [54, 82, 6.2, 5.4],
    [84, 76, 6.4, 5.4],
  ];

  blockCenters.forEach(([bx, bz, bw, bd], idx) => {
    const h = 4.3 + ((idx * 17) % 4) * 1.1;
    addTownhouse(bx, bz, bw, bd, h, idx);
  });

  // 9. Cozy Chimney Smoke Puffs (subtle animated warmth)
  const smokeGeo = new THREE.IcosahedronGeometry(0.28, 1);
  const smokeMat = new THREE.MeshBasicMaterial({
    color: 0xf7efe2,
    transparent: true,
    opacity: 0.36,
  });
  localDisposables.push(smokeMat);
  const smokeCount = chimneyOrigins.length * 2;
  const smokeMesh = new THREE.InstancedMesh(smokeGeo, smokeMat, Math.max(1, smokeCount));
  smokeMesh.frustumCulled = false;
  group.add(smokeMesh);
  const smokeDummy = new THREE.Object3D();

  // 10. Seasonal Branching Broadleaf Trees, Faceted Low-Poly Tiered Pines, Palms & Shrubs
  const dummy = new THREE.Object3D();

  const canPlaceFoliage = (
    x: number,
    z: number,
    clearance = 1.25,
    avoidMeydan = true
  ): boolean => {
    const roadSample = sampleNearestRoad(x, z, 10);
    if (roadSample.road && roadSample.dist < roadSample.road.width * 0.5 + 1.1 + clearance) {
      return false;
    }
    if (Math.abs(x - getTabakhaneCenterX(z)) < getTabakhaneHalfWidth() + 1.2 + clearance) {
      return false;
    }
    if (Math.abs(z - RAIL_TRACK_Z) < 2.8) return false;
    if (Math.hypot(x - PLAYER_HOME_DOOR_POS[0], z - PLAYER_HOME_DOOR_POS[1]) < 4.2) {
      return false;
    }
    for (const lm of LANDMARKS) {
      if (lm.doorPosition) {
        if (Math.hypot(x - lm.doorPosition[0], z - lm.doorPosition[1]) < 3.6) return false;
      }
    }
    if (avoidMeydan && Math.abs(x) < 14.2 && z > -18.5 && z < 27.0) return false;
    if (Math.abs(x + 39.5) < 14.0 && Math.abs(z - 11.5) < 7.5) return false;
    if (Math.abs(x + 76) < 12.0 && Math.abs(z + 47) < 10.5) return false;
    if (Math.abs(x + 188) < 13.0 && Math.abs(z + 12) < 13.0) return false;
    if (Math.abs(x + 127) < 16.5 && Math.abs(z - 14) < 14.5) return false;
    if (Math.abs(x + 80) < 14.0 && Math.abs(z - 52) < 10.0) return false;
    if (Math.abs(x - 93) < 15.5 && Math.abs(z - 34) < 14.0) return false;
    if (Math.abs(x - 142) < 15.5 && Math.abs(z - 10) < 14.0) return false;
    if (Math.abs(x - 92) < 13.0 && Math.abs(z + 48) < 11.5) return false;
    if (Math.abs(x - 92) < 16.5 && Math.abs(z + 104) < 14.5) return false;
    if (overlapsAny(x, z, clearance * 2, clearance * 2, colliders, 0.7)) return false;
    return true;
  };

  // 10a. Washingtonia Palm Trees aligned symmetrically along Boulevard Sidewalks
  const rawPalms: [number, number][] = [];
  // Along Cumhuriyet (z = 30), Kıbrıs Cd. (z = 38) + İstasyon Blv. (z = 70)
  [-142, -124, -108, -88, -72, -48, -32, -10, 0, 10, 30, 44, 78, 92, 106].forEach((px) => {
    rawPalms.push([px, 31.8], [px, 44.2], [px, 63.6]);
  });
  // Along Sevgi Yolu & Atatürk Kent Meydanı flanks
  [-92, -74, -50, -28].forEach((px) => {
    rawPalms.push([px, 5.2], [px, 17.8]);
  });
  // Along Doğu Blv. (x = 118) & Forum Cd. (z = 10)
  [-58, -36, -6, 22, 42].forEach((pz) => {
    rawPalms.push([111.8, pz], [124.2, pz]);
  });
  rawPalms.push(
    [-12.2, 0.5],
    [12.2, 0.5],
    [-12.2, 20.5],
    [12.2, 20.5],
    [78, 16.2],
    [94, 16.2],
    [108, 16.2]
  );

  const palmSpots: TreePlacement[] = rawPalms
    .filter(([x, z]) => canPlaceFoliage(x, z, 0.9, false))
    .map(([x, z], i) => ({
      x,
      z,
      rotY: (i * 1.1) % (Math.PI * 2),
      scale: 0.92 + ((i * 19) % 24) * 0.01,
      heightScale: 1,
      variant: i,
    }));

  // 10b. Multi-Forked Seasonal Broadleaf Trees (Spring Blossoms / Summer Green / Autumn Amber / Winter Bare)
  const rawBroadleaf: [number, number][] = [];
  for (let oz = -104; oz <= 86; oz += 14) {
    const sx = getTabakhaneCenterX(oz);
    rawBroadleaf.push([sx - 5.2, oz], [sx + 5.2, oz], [126.5, oz - 2], [-142.5, oz]);
  }
  // Clean uniform Adnan Menderes Blv. & Hükümet Blv. avenue tree lines
  [-62, -44, -16, 24, 52, 80].forEach((oz) => {
    rawBroadleaf.push([-24.6, oz], [-13.4, oz], [13.4, oz], [24.6, oz]);
  });
  rawBroadleaf.push(
    [-64, -84],
    [-42, -80],
    [76, -58],
    [106, -58],
    [-112, 42],
    [-92, 38],
    [-112, 20],
    [-10, 52],
    [10, 52],
    [32, -44],
    [-28, -44],
    [74, -112],
    [108, -112],
    [30, -56],
    [-62, -56],
    [-112, -12],
    [-138, -12],
    [-162, -12],
    [-198, 2],
    [-164, -28]
  );

  const broadleafSpots: TreePlacement[] = rawBroadleaf
    .filter(([x, z]) => canPlaceFoliage(x, z, 1.35, true))
    .map(([x, z], i) => ({
      x,
      z,
      rotY: (i * 0.9) % (Math.PI * 2),
      scale: 0.88 + ((i * 23) % 30) * 0.01,
      heightScale: 0.96 + (i % 3) * 0.08,
      variant: i,
    }));

  // 10c. Low-Poly 3D Faceted Tiered Pine Trees on Aytepe / Tralleis Foothills, Campuses & Parks
  const rawPines: [number, number][] = [];
  for (let ox = -142; ox <= 140; ox += 14) {
    for (let oz = -140; oz <= -122; oz += 10) {
      rawPines.push([ox + ((oz * 3) % 2), oz]);
    }
  }
  for (let oz = -104; oz <= 80; oz += 15) {
    rawPines.push([-164.5, oz + 3], [164.5, oz]);
  }
  rawPines.push(
    [-14, -92],
    [14, -92],
    [46, -60],
    [76, -84],
    [112, -84],
    [-72, -112],
    [-42, -112],
    [112, -104],
    [52, -84],
    [-112, 54],
    [-86, 58]
  );

  const pineSpots: TreePlacement[] = rawPines
    .filter(([x, z]) => canPlaceFoliage(x, z, 1.25, true))
    .map(([x, z], i) => ({
      x,
      z,
      rotY: (i * 1.37) % (Math.PI * 2),
      scale: 0.94 + (i % 4) * 0.11,
      heightScale: 0.98 + (i % 3) * 0.1,
      variant: i,
    }));

  // 10d. Seasonal Flowering Shrubs & Bushes along Sidewalks, Tabakhane Banks & Parks
  const rawShrubs: [number, number][] = [];
  [-110, -88, -68, -46, -28, 28, 46, 76, 98].forEach((sx) => {
    rawShrubs.push([sx, 5.2], [sx, 17.8], [sx, -80.5]);
  });
  [-102, -84, -48, -14, 24, 48, 78].forEach((sz) => {
    rawShrubs.push([getTabakhaneCenterX(sz) - 4.4, sz], [-13.2, sz]);
  });
  const shrubSpots: ShrubPlacement[] = rawShrubs
    .filter(([x, z]) => canPlaceFoliage(x, z, 0.65, true))
    .map(([x, z], i) => ({
      x,
      z,
      rotY: i * 0.8,
      scale: 0.85 + (i % 4) * 0.14,
      variant: i,
    }));

  const foliage = createSeasonalFoliageSystem(
    broadleafSpots,
    pineSpots,
    palmSpots,
    shrubSpots
  );
  group.add(foliage.group);

  // 10e. Street Lamps along Real Aydın Boulevards (clear of intersections & Tabakhane Bridges)
  const lampCoords: [number, number][] = [];
  const isNearRoadJunction = (px: number, pz: number, ownRoadId: string): boolean => {
    for (let r = 0; r < AYDIN_ROAD_SEGMENTS.length; r++) {
      const other = AYDIN_ROAD_SEGMENTS[r];
      const opts = other.points;
      for (let v = 0; v < opts.length; v++) {
        if (Math.hypot(px - opts[v][0], pz - opts[v][1]) < 6.4) return true;
      }
      if (other.id === ownRoadId) continue;
      for (let k = 0; k < opts.length - 1; k++) {
        const [ax, az] = opts[k];
        const [bx, bz] = opts[k + 1];
        const abx = bx - ax;
        const abz = bz - az;
        const lsq = abx * abx + abz * abz;
        const t = lsq > 1e-6 ? Math.max(0, Math.min(1, ((px - ax) * abx + (pz - az) * abz) / lsq)) : 0;
        const dist = Math.hypot(px - (ax + abx * t), pz - (az + abz * t));
        if (dist < other.width * 0.5 + 1.0) return true;
      }
    }
    return false;
  };

  AYDIN_ROAD_SEGMENTS.forEach((road) => {
    const pts = road.points;
    const halfW = road.width * 0.5;
    for (let i = 0; i < pts.length - 1; i++) {
      const [ax, az] = pts[i];
      const [bx, bz] = pts[i + 1];
      const dx = bx - ax;
      const dz = bz - az;
      const segLen = Math.hypot(dx, dz);
      if (segLen < 14) continue;
      const ux = dx / segLen;
      const uz = dz / segLen;
      const nx = -uz;
      const nz = ux;
      for (let d = 9.0; d <= segLen - 9.0; d += 17.5) {
        const lx = ax + ux * d + nx * (halfW + 0.85);
        const lz = az + uz * d + nz * (halfW + 0.85);
        if (Math.abs(lx) < 15.2 && lz > -18.5 && lz < 27.5) continue;
        if (Math.abs(lx + 39.5) < 13.0 && Math.abs(lz - 11.5) < 6.5) continue;
        if (Math.abs(lx - getTabakhaneCenterX(lz)) < 6.6) continue;
        if (Math.abs(lz - RAIL_TRACK_Z) < 3.0) continue;
        if (isNearRoadJunction(lx, lz, road.id)) continue;
        if (overlapsAny(lx, lz, 0.8, 0.8, colliders, 0.4)) continue;
        lampCoords.push([lx, lz]);
      }
    }
  });
  const poleGeo = new THREE.CylinderGeometry(0.08, 0.11, 4.0, 8);
  poleGeo.translate(0, 2.0, 0);
  const poleInst = new THREE.InstancedMesh(poleGeo, mats.wroughtIron, Math.max(1, lampCoords.length));

  const bulbGeo = new THREE.SphereGeometry(0.24, 10, 8);
  bulbGeo.translate(0, 4.1, 0);
  const bulbInst = new THREE.InstancedMesh(bulbGeo, mats.lampBulb, Math.max(1, lampCoords.length));

  lampCoords.forEach(([x, z], i) => {
    const sy = getWalkableSurfaceHeightAt(x, z);
    dummy.position.set(x, sy, z);
    dummy.rotation.set(0, 0, 0);
    dummy.scale.set(1, 1, 1);
    dummy.updateMatrix();
    poleInst.setMatrixAt(i, dummy.matrix);
    bulbInst.setMatrixAt(i, dummy.matrix);
    perches.addStaticSegment(
      `lamp_${i}`,
      new THREE.Vector3(x - 0.32, sy + 4.32, z),
      new THREE.Vector3(x + 0.32, sy + 4.32, z),
      0.14,
      'metal'
    );
  });
  poleInst.instanceMatrix.needsUpdate = true;
  bulbInst.instanceMatrix.needsUpdate = true;
  poleInst.computeBoundingSphere();
  bulbInst.computeBoundingSphere();
  group.add(poleInst, bulbInst);

  // Broadleaf tree canopy perches + Kent Meydanı / Tabakhane / landmark crumb treats
  broadleafSpots.forEach((t, idx) => {
    const ty = getSurfaceHeightAt(t.x, t.z) + 3.9 * t.heightScale;
    perches.addStaticSegment(
      `tree_${idx}`,
      new THREE.Vector3(t.x - 1.1, ty, t.z),
      new THREE.Vector3(t.x + 1.1, ty, t.z),
      0.22,
      'foliage'
    );
  });

  // Curated rooftop, bridge, and plaza golden sesame & fig crumb spots
  crumbSpots.push(
    [8.8, getTerrainHeightAt(8.8, 10.6) + 6.7, 10.6], // Kent Meydanı Anıt Heykeli üstü
    [-7.8, getTerrainHeightAt(-7.8, 13.5) + 2.9, 13.5], // Kent Meydanı Havuz Yeşil Adası
    [0, getTerrainHeightAt(0, -13.6) + 4.2, -13.6], // Kent Meydanı Kuzey Teras Çatısı
    [-39.5, getTerrainHeightAt(-39.5, 11.5) + 3.85, 11.5], // Sevgi Yolu Işıklı Pergola üstü
    [-76, getTerrainHeightAt(-76, -47) + 2.8, -47], // Yağcılar İçi Tarihi Çarşı Şadırvanı
    [getTabakhaneCenterX(30), getSurfaceHeightAt(getTabakhaneCenterX(30), 30) + 1.85, 30 + 4.3], // Tabakhane Köprüsü
    [getTabakhaneCenterX(-30), getSurfaceHeightAt(getTabakhaneCenterX(-30), -30) + 1.85, -30 - 4.3], // Gazi Blv. Köprüsü
    [getTabakhaneCenterX(-72), getSurfaceHeightAt(getTabakhaneCenterX(-72), -72) + 1.85, -72 + 4.3], // Kuzey Köprüsü
    [36.7, getTerrainHeightAt(36.7, 10) + 10.8, 10], // Aydın Büyükşehir Belediyesi çatısı
    [-36.0, getTerrainHeightAt(-36.0, -2.5) + 10.2, -2.5], // Bey Camii üstü
    [-58, getTerrainHeightAt(-58, -108) + 9.8, -108], // Tralleis Üç Gözler kemer üstü
    [92, getTerrainHeightAt(92, -48) + 3.4, -48 + 4.8], // Orta Mahalle asma çardağı
    [0, getTerrainHeightAt(0, 85) + 9.2, 86.5], // Tarihi Tren Garı çatısı
    [96, getTerrainHeightAt(96, -104) + 10.1, -98.2], // ADÜ Kütüphane kubbesi
    [-188, getTerrainHeightAt(-188, -17.7) + 8.9, -17.7], // Magnesia Artemis Tapınağı alınlığı
    [-113.4, getTerrainHeightAt(-127, 14) + 4.4, 14.4], // Nevzat Biçer Parkı Giriş Takı
    [-80, getTerrainHeightAt(-80, 52) + 7.2, 54.8] // Aydın Kipa AVM çatısı
  );
  const magY = getTerrainHeightAt(-188, -12);
  perches.addStaticSegment(
    'magnesia_temple_ridge',
    new THREE.Vector3(-192.5, magY + 8.35, -17.7),
    new THREE.Vector3(-183.5, magY + 8.35, -17.7),
    0.18,
    'stone'
  );

  // 10f. Warm Cozy Pergola String Lights over Kent Meydanı Belediye Kafeleri & Orta Mahalle
  const garlandPoints: [number, number, number][] = [];
  [-6.3, 0.9].forEach((cafeX) => {
    for (let dx = -2.3; dx <= 2.3; dx += 1.15) {
      const gx = cafeX + dx;
      const gz = 5.45;
      garlandPoints.push([gx, getTerrainHeightAt(gx, gz) + 2.95, gz]);
    }
    const baseY = getTerrainHeightAt(cafeX, 3.5);
    perches.addStaticSegment(
      `belediye_kafe_${cafeX}`,
      new THREE.Vector3(cafeX - 2.6, baseY + 3.08, 5.3),
      new THREE.Vector3(cafeX + 2.6, baseY + 3.08, 5.3),
      0.16,
      'wood'
    );
  });
  const ortaBaseY = getTerrainHeightAt(92, -48);
  for (let gx = -2.2; gx <= 2.2; gx += 1.1) {
    garlandPoints.push([92 + 4.2 + gx, ortaBaseY + 3.05, -48 + 4.8 + 1.4]);
  }
  perches.addStaticSegment(
    'orta_pergola',
    new THREE.Vector3(92 + 1.8, ortaBaseY + 3.12, -48 + 4.8),
    new THREE.Vector3(92 + 6.6, ortaBaseY + 3.12, -48 + 4.8),
    0.16,
    'wood'
  );
  const garlandGeo = new THREE.SphereGeometry(0.11, 8, 6);
  const garlandInst = new THREE.InstancedMesh(garlandGeo, mats.lampBulb, garlandPoints.length);
  garlandPoints.forEach(([x, y, z], i) => {
    dummy.position.set(x, y, z);
    dummy.rotation.set(0, 0, 0);
    dummy.scale.setScalar(1);
    dummy.updateMatrix();
    garlandInst.setMatrixAt(i, dummy.matrix);
  });
  garlandInst.instanceMatrix.needsUpdate = true;
  garlandInst.computeBoundingSphere();
  group.add(garlandInst);

  // 10g. Peaceful Gliding White Doves high above Kent Meydanı, Tralleis & ADÜ Aytepe Campus
  const birdCount = 9;
  const birdGeo = new THREE.BoxGeometry(0.56, 0.08, 0.22);
  const birdMat = new THREE.MeshBasicMaterial({ color: 0xfbf6ea });
  localDisposables.push(birdMat);
  const birdInst = new THREE.InstancedMesh(birdGeo, birdMat, birdCount);
  birdInst.frustumCulled = false;
  group.add(birdInst);
  const birdCenters: [number, number, number][] = [
    [0, getTerrainHeightAt(0, 10) + 15.5, 10],
    [-58, getTerrainHeightAt(-58, -108) + 15.5, -108],
    [92, getTerrainHeightAt(92, -104) + 15.5, -104],
  ];
  const birdDummy = new THREE.Object3D();

  const _snowSurfaceTint = new THREE.Color(0xeef5fc);
  const _whiteTint = new THREE.Color(0xffffff);
  const _autumnGrassTint = new THREE.Color(0xcfb573);
  const _springGrassTint = new THREE.Color(0xf2fbe8);
  const _terracottaSnowTint = new THREE.Color(0xeae6e1);
  const _slateSnowTint = new THREE.Color(0xcbd9e6);
  const _blueSnowTint = new THREE.Color(0xc2d8e8);
  const _turfSummer = new THREE.Color(0x99ab62);
  const _turfAutumn = new THREE.Color(0xb89a56);
  const _turfSpring = new THREE.Color(0x95b864);
  const _turfWinter = new THREE.Color(0xdfe8ef);
  const _yardSummer = new THREE.Color(0x8ca854);
  const _yardAutumn = new THREE.Color(0xb2904a);
  const _yardSpring = new THREE.Color(0x8ebd5e);
  const _mountainBaseTint = new THREE.Color(0xffffff);
  const _mountainAutumnTint = new THREE.Color(0xdec08a);
  const _mountainWinterTint = new THREE.Color(0xeef5fc);
  const _blossomSpring = new THREE.Color(0xf49ebb);
  const _blossomSummer = new THREE.Color(0xd9614a);
  const _blossomAutumn = new THREE.Color(0xe59732);
  const _blossomWinter = new THREE.Color(0xeef4f8);
  const _targetColor = new THREE.Color();

  return {
    group,
    landmarks,
    colliders,
    figTree,
    pedestrians,
    trafficLights,
    steamTrain,
    ambientTraffic,
    musicians,
    libraryVendor,
    lokmaStand,
    parkGuitarBand,
    buildingNpcs,
    foliage,
    homeRingMesh,
    interactiveClickables,
    perches,
    crumbSpots,
    updatePlayerHomeExterior: (nextConfig: HouseExteriorConfig) => {
      group.remove(builtHome.group);
      builtHome.dispose();
      builtHome = buildCustomPlayerHouse({
        config: nextConfig,
        mats,
        lawnMat: yardLawnMat,
        flowerBoxMat,
        blossomMat,
      });
      builtHome.group.position.set(hx, homeY, hz);
      builtHome.group.rotation.y = Math.PI / 2;
      group.add(builtHome.group);
      chimneyOrigins[homeChimneyIndex] = [
        hx + builtHome.chimneyTopLocal[2],
        homeY + builtHome.chimneyTopLocal[1],
        hz - builtHome.chimneyTopLocal[0],
      ];
    },
    update: (() => {
      let cityFxAccum = 0.032;
      return (dt: number, elapsed: number, focusX = 0, focusZ = 0) => {
        steamTrain.update(dt, elapsed);
        ambientTraffic.update(dt, elapsed, focusX, focusZ);

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

        cityFxAccum += dt;
        if (cityFxAccum >= 0.032) {
          cityFxAccum = 0;
          for (let i = 0; i < smokeCount; i++) {
            const origin = chimneyOrigins[Math.floor(i / 2)];
            const phase = (elapsed * 0.45 + i * 0.37) % 1;
            smokeDummy.position.set(
              origin[0] + Math.sin(elapsed * 1.2 + i) * 0.25 + phase * 0.8,
              origin[1] + phase * 2.8,
              origin[2] + phase * 0.35
            );
            const s = (0.55 + phase * 1.15) * (1 - phase * 0.45);
            smokeDummy.scale.setScalar(Math.max(0.05, s));
            smokeDummy.updateMatrix();
            smokeMesh.setMatrixAt(i, smokeDummy.matrix);
          }
          smokeMesh.instanceMatrix.needsUpdate = true;

          for (let i = 0; i < birdCount; i++) {
            const c = birdCenters[i % birdCenters.length];
            const ang = elapsed * 0.35 + i * 1.7;
            const rad = 7.5 + (i % 3) * 3.2;
            birdDummy.position.set(
              c[0] + Math.cos(ang) * rad,
              c[1] + Math.sin(elapsed * 2.2 + i) * 0.55,
              c[2] + Math.sin(ang) * rad
            );
            birdDummy.rotation.set(0, -ang, Math.sin(elapsed * 7 + i) * 0.28);
            birdDummy.scale.setScalar(1);
            birdDummy.updateMatrix();
            birdInst.setMatrixAt(i, birdDummy.matrix);
          }
          birdInst.instanceMatrix.needsUpdate = true;
        }
      };
    })(),
    updateAtmosphere: (() => {
      let lastAtmosKey = '';
      let atmosSettleTimer = 4.0;
      return (dt: number, elapsed: number, state: SeasonalAtmosphereState) => {
        foliage.update(dt, elapsed, state);

        const atmosKey = `${state.season}|${Math.round(state.frostFactor * 40)}|${Math.round(state.wetFactor * 40)}`;
        if (atmosKey !== lastAtmosKey) {
          lastAtmosKey = atmosKey;
          atmosSettleTimer = 3.5;
        } else {
          atmosSettleTimer = Math.max(0, atmosSettleTimer - dt);
        }

        if (atmosSettleTimer <= 0) return;

        const lerpRate = Math.min(1, dt * 1.4);
        const snowTintT = THREE.MathUtils.clamp(
          Math.max(state.season === 'winter' ? 0.65 : 0, state.frostFactor),
          0,
          1
        );

        // Grass, Urban Turf & Horizon Hills shift gradually across seasons + snow
        _targetColor
          .copy(state.season === 'spring' ? _springGrassTint : state.season === 'autumn' ? _autumnGrassTint : _whiteTint)
          .lerp(_snowSurfaceTint, snowTintT * 0.85);
        terrainMat.color.lerp(_targetColor, lerpRate);

        _targetColor
          .copy(state.season === 'spring' ? _turfSpring : state.season === 'autumn' ? _turfAutumn : _turfSummer)
          .lerp(_turfWinter, snowTintT * 0.86);
        blockTurfMat.color.lerp(_targetColor, lerpRate);

        _targetColor
          .copy(state.season === 'spring' ? _yardSpring : state.season === 'autumn' ? _yardAutumn : _yardSummer)
          .lerp(_turfWinter, snowTintT * 0.88);
        yardLawnMat.color.lerp(_targetColor, lerpRate);

        _targetColor
          .copy(state.season === 'autumn' ? _mountainAutumnTint : _mountainBaseTint)
          .lerp(_mountainWinterTint, snowTintT * 0.88);
        hillMat.color.lerp(_targetColor, lerpRate);

        // Townhouse Window Flower Boxes respond to season
        _targetColor.copy(
          state.season === 'spring'
            ? _blossomSpring
            : state.season === 'autumn'
              ? _blossomAutumn
              : state.season === 'winter'
                ? _blossomWinter
                : _blossomSummer
        );
        if (state.frostFactor > 0.1) _targetColor.lerp(_blossomWinter, state.frostFactor * 0.7);
        blossomMat.color.lerp(_targetColor, lerpRate);

        // Diorama Roofs catch winter frost/snow & rain wet sheen
        _targetColor.copy(_whiteTint).lerp(_terracottaSnowTint, snowTintT * 0.68);
        mats.terracottaRoof.color.lerp(_targetColor, lerpRate);
        _targetColor.copy(_whiteTint).lerp(_slateSnowTint, snowTintT * 0.65);
        mats.slateRoof.color.lerp(_targetColor, lerpRate);
        _targetColor.copy(_whiteTint).lerp(_blueSnowTint, snowTintT * 0.65);
        mats.aegeanBlueRoof.color.lerp(_targetColor, lerpRate);

        const wetGlossDrop = state.wetFactor * 0.34;
        mats.terracottaRoof.roughness = THREE.MathUtils.damp(
          mats.terracottaRoof.roughness,
          0.74 - wetGlossDrop,
          2.5,
          dt
        );
        mats.slateRoof.roughness = THREE.MathUtils.damp(
          mats.slateRoof.roughness,
          0.66 - wetGlossDrop,
          2.5,
          dt
        );
        mats.aegeanBlueRoof.roughness = THREE.MathUtils.damp(
          mats.aegeanBlueRoof.roughness,
          0.62 - wetGlossDrop,
          2.5,
          dt
        );
        mats.asphalt.roughness = THREE.MathUtils.damp(
          mats.asphalt.roughness,
          0.88 - state.wetFactor * 0.42,
          2.5,
          dt
        );
        mats.cobble.roughness = THREE.MathUtils.damp(
          mats.cobble.roughness,
          0.84 - state.wetFactor * 0.36,
          2.5,
          dt
        );
        mats.sidewalk.roughness = THREE.MathUtils.damp(
          mats.sidewalk.roughness,
          0.84 - state.wetFactor * 0.32,
          2.5,
          dt
        );
      };
    })(),
    dispose: () => {
      group.traverse((obj) => {
        if ((obj as THREE.Mesh).isMesh) {
          const geo = (obj as THREE.Mesh).geometry;
          if (!geo.userData?.isSharedHumanGeo) {
            geo.dispose();
          }
        }
      });
      builtHome.dispose();
      foliage.dispose();
      localDisposables.forEach((d) => d.dispose());
    },
  };
}
