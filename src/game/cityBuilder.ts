import * as THREE from 'three';
import {
  DEFAULT_HOUSE_EXTERIOR,
  LANDMARKS,
  PLAYER_HOME_DOOR_POS,
  PLAYER_HOME_POS,
  ROAD_X_COORDS,
  ROAD_Z_COORDS,
} from '../data/efelerData';
import { ColliderBox, HouseExteriorConfig } from '../types/game';
import { buildCustomPlayerHouse, buildDioramaHouse, BuiltCustomPlayerHouse } from './dioramaHouses';
import { buildAllLandmarks, BuiltLandmark } from './landmarks';
import {
  createBeyCamiiLokmaStand,
  createLibraryAndVendor,
  createStreetMusiciansZeybek,
  LibraryVendorRig,
  LokmaStandRig,
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
import { PerchSystem } from './perchSystem';
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
  buildingNpcs: BuildingNpcSystem;
  foliage: SeasonalFoliageSystem;
  homeRingMesh: THREE.Mesh;
  interactiveClickables: THREE.Object3D[];
  perches: PerchSystem;
  crumbSpots: Array<[number, number, number]>;
  updatePlayerHomeExterior: (config: HouseExteriorConfig) => void;
  update: (dt: number, elapsed: number) => void;
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
  const halfW = w / 2 + 5.2;
  const halfD = d / 2 + 5.2;
  for (const rx of ROAD_X_COORDS) {
    if (Math.abs(x - rx) < halfW) return true;
  }
  for (const rz of ROAD_Z_COORDS) {
    if (Math.abs(z - rz) < halfD) return true;
  }
  if (Math.abs(x - getTabakhaneCenterX(z)) < w / 2 + getTabakhaneHalfWidth() + 2.2) {
    return true;
  }
  return false;
}

function createTerrainConformingRibbon(
  x0: number,
  z0: number,
  x1: number,
  z1: number,
  width: number,
  segsAlong: number,
  segsAcross: number,
  yOffset: number,
  useSurface = true
): THREE.BufferGeometry {
  const dx = x1 - x0;
  const dz = z1 - z0;
  const len = Math.hypot(dx, dz) || 1;
  const ux = dx / len;
  const uz = dz / len;
  const px = -uz;
  const pz = ux;

  const cols = segsAcross + 1;
  const rows = segsAlong + 1;
  const positions = new Float32Array(rows * cols * 3);
  const uvs = new Float32Array(rows * cols * 2);
  const indices: number[] = [];

  for (let r = 0; r < rows; r++) {
    const tAlong = r / segsAlong;
    const cx = x0 + dx * tAlong;
    const cz = z0 + dz * tAlong;
    for (let c = 0; c < cols; c++) {
      const tAcross = c / segsAcross - 0.5;
      const wx = cx + px * width * tAcross;
      const wz = cz + pz * width * tAcross;
      const wy = (useSurface ? getSurfaceHeightAt(wx, wz) : getBaseTerrainHeight(wx, wz)) + yOffset;
      const idx = r * cols + c;
      positions[idx * 3] = wx;
      positions[idx * 3 + 1] = wy;
      positions[idx * 3 + 2] = wz;
      uvs[idx * 2] = c / segsAcross;
      uvs[idx * 2 + 1] = (tAlong * len) / 10;
    }
  }

  for (let r = 0; r < segsAlong; r++) {
    for (let c = 0; c < segsAcross; c++) {
      const a = r * cols + c;
      const b = a + 1;
      const cIdx = (r + 1) * cols + c;
      const d = cIdx + 1;
      // (a -> b) x (a -> cIdx) = p x u = +Y upward normal
      indices.push(a, b, cIdx, b, d, cIdx);
    }
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geo.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
  geo.setIndex(indices);
  geo.computeVertexNormals();
  return geo;
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

function createStoneArchBridgeGeometry(): THREE.BufferGeometry {
  const shape = new THREE.Shape();
  shape.moveTo(-10.5, 0);
  shape.lineTo(-4.8, 0);
  shape.absarc(0, 0.15, 4.8, Math.PI, 0, true);
  shape.lineTo(10.5, 0);
  shape.lineTo(10.5, 1.05);
  shape.quadraticCurveTo(0, 3.2, -10.5, 1.05);
  shape.closePath();

  const geo = new THREE.ExtrudeGeometry(shape, {
    depth: 4.8,
    bevelEnabled: true,
    bevelThickness: 0.08,
    bevelSize: 0.08,
    bevelSegments: 2,
  });
  geo.translate(0, 0, -2.4);
  return geo;
}

export function buildEfelerCity(
  mats: CityMaterialLibrary,
  initialHouseExterior: HouseExteriorConfig = DEFAULT_HOUSE_EXTERIOR
): BuiltCity {
  const group = new THREE.Group();
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

  // 1. Sculpted 3D Horizon Terrain (Flat Efeler Plain -> Northern Foothills -> ADÜ Aytepe Hill + Tabakhane Channel)
  const terrainGeo = new THREE.PlaneGeometry(520, 520, 160, 160);
  terrainGeo.rotateX(-Math.PI / 2);
  const tPos = terrainGeo.attributes.position as THREE.BufferAttribute;
  const tColors = new Float32Array(tPos.count * 3);
  const cLow = new THREE.Color(0x90a35c);
  const cHill = new THREE.Color(0xa69d58);
  const cStreamBank = new THREE.Color(0x5c7244);
  const cTmp = new THREE.Color();

  for (let i = 0; i < tPos.count; i++) {
    const wx = tPos.getX(i);
    const wz = tPos.getZ(i);
    const wy = getTerrainHeightAt(wx, wz);
    tPos.setY(i, wy);

    const hillT = THREE.MathUtils.clamp((wy - 0.8) / 7.2, 0, 1);
    cTmp.copy(cLow).lerp(cHill, hillT);
    const streamDist = Math.abs(wx - getTabakhaneCenterX(wz));
    if (streamDist < 5.0) {
      const bankT = 1 - THREE.MathUtils.smoothstep(streamDist, 2.2, 5.0);
      cTmp.lerp(cStreamBank, bankT * 0.65);
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
    [138, 36, 46, 76, mats.wheatField],
    [138, -34, 44, 52, mats.lavenderField],
    [138, -84, 46, 44, mats.wheatField],
    [-130, 14, 46, 74, mats.wheatField],
    [-128, -56, 42, 56, mats.lavenderField],
    [-58, -124, 64, 24, mats.wheatField],
    [76, -124, 62, 24, mats.lavenderField],
    [-56, 98, 66, 32, mats.wheatField],
    [80, 98, 52, 32, mats.wheatField],
  ];
  fieldPatches.forEach(([fx, fz, fw, fd, mat]) => {
    const patch = new THREE.Mesh(
      createTerrainConformingPatch(fx, fz, fw, fd, 14, 14, 0.032, false),
      mat
    );
    patch.position.set(fx, 0, fz);
    patch.receiveShadow = true;
    group.add(patch);
  });

  // Gentle Distant Horizon Foothills (Aytepe / Paşayaylası Backdrop)
  const hillMat = new THREE.MeshStandardMaterial({
    color: 0x829555,
    roughness: 0.92,
    metalness: 0.0,
  });
  localDisposables.push(hillMat);
  const hillConfigs: [number, number, number, number, number][] = [
    [-95, -148, 58, 22, 42],
    [-35, -154, 65, 28, 45],
    [35, -150, 62, 25, 44],
    [98, -144, 56, 24, 42],
    [-160, -52, 42, 14, 52],
    [164, -52, 42, 16, 52],
    [146, 65, 36, 5.5, 34],
    [-142, 62, 34, 5.0, 34],
  ];
  hillConfigs.forEach(([hx, hz, rx, ry, rz]) => {
    const hillGeo = new THREE.SphereGeometry(1, 22, 14, 0, Math.PI * 2, 0, Math.PI * 0.5);
    const hill = new THREE.Mesh(hillGeo, hillMat);
    hill.position.set(hx, getBaseTerrainHeight(hx, hz) - 1.2, hz);
    hill.scale.set(rx, ry, rz);
    hill.receiveShadow = true;
    group.add(hill);
  });

  // 3. Terrain-Conforming Urban Block Meadows
  const blockTurfMat = new THREE.MeshStandardMaterial({ color: 0x99ab62, roughness: 0.92 });
  localDisposables.push(blockTurfMat);
  const blockZones: [number, number, number, number][] = [
    [-36, -77, 23, 22],
    [0, -77, 23, 22],
    [-36, -40, 23, 23],
    [0, -40, 23, 23],
    [34, -40, 19, 23],
    [-36, -5, 23, 21],
    [-36, 30, 23, 23],
    [34, 30, 19, 23],
    [76, -5, 24, 21],
  ];
  blockZones.forEach(([bx, bz, bw, bd]) => {
    const turf = new THREE.Mesh(
      createTerrainConformingPatch(bx, bz, bw, bd, 8, 8, 0.024, true),
      blockTurfMat
    );
    turf.position.set(bx, 0, bz);
    turf.receiveShadow = true;
    group.add(turf);
  });

  // 4. Real-World Tabakhane Deresi (behind Tarihi Sarı Belediye Binası, separating Orta Mahalle & ADÜ foothills from Merkez Bulvarı)
  const streamZStart = -126;
  const streamZEnd = 110;
  const streamSegs = 92;
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
      const yTop = groundH + wallTopRise;
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
    wallMesh.castShadow = true;
    wallMesh.receiveShadow = true;
    group.add(wallMesh);
  });

  // Stone Arch Bridges ("Tabakhane Köprüleri") on every E–W Boulevard crossing Tabakhane Deresi
  [-96, -58, -22, 12, 48].forEach((bz) => {
    const cx = getTabakhaneCenterX(bz);
    const baseY = getBaseTerrainHeight(cx, bz);
    const bridgeGroup = new THREE.Group();
    bridgeGroup.position.set(cx, baseY - 0.88, bz);

    // North & South sculpted stone arch parapets flanking the drivable arched roadway
    [-4.3, 4.3].forEach((pz) => {
      const archWall = new THREE.Mesh(createStoneArchBridgeGeometry(), mats.travertine);
      archWall.scale.set(0.56, 0.72, 0.22);
      archWall.position.set(0, 0, pz);
      archWall.castShadow = true;
      archWall.receiveShadow = true;
      bridgeGroup.add(archWall);
    });

    // Bridge corner stone bollards & warm bridge lanterns
    [-4.9, 4.9].forEach((bxOff) => {
      [-4.35, 4.35].forEach((pz) => {
        const post = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.85, 0.45), mats.creamPlaster);
        post.position.set(bxOff, 1.32, pz);
        post.castShadow = true;
        bridgeGroup.add(post);

        const lantern = new THREE.Mesh(new THREE.SphereGeometry(0.14, 8, 6), mats.lampBulb);
        lantern.position.set(bxOff, 1.84, pz);
        bridgeGroup.add(lantern);
      });
    });

    // Bridge parapet perches for Sparrow
    const deckY = baseY + 1.38;
    perches.addStaticSegment(
      `bridge_${bz}_n`,
      new THREE.Vector3(cx - 4.8, deckY, bz - 4.3),
      new THREE.Vector3(cx + 4.8, deckY, bz - 4.3),
      0.16,
      'stone'
    );
    perches.addStaticSegment(
      `bridge_${bz}_s`,
      new THREE.Vector3(cx - 4.8, deckY, bz + 4.3),
      new THREE.Vector3(cx + 4.8, deckY, bz + 4.3),
      0.16,
      'stone'
    );

    group.add(bridgeGroup);
  });

  // Stone Railway Arch Bridge carrying İzmir–Aydın Demiryolu across Tabakhane Deresi at z = 77.1
  const railStreamX = getTabakhaneCenterX(77.1);
  const railBridgeBaseY = getBaseTerrainHeight(railStreamX, 77.1);
  const railBridgeDeck = new THREE.Mesh(new THREE.BoxGeometry(10.5, 0.34, 4.4), mats.travertine);
  railBridgeDeck.position.set(railStreamX, railBridgeBaseY - 0.08, 77.1);
  railBridgeDeck.castShadow = true;
  railBridgeDeck.receiveShadow = true;
  group.add(railBridgeDeck);
  [-3.8, 3.8].forEach((pierX) => {
    const pier = new THREE.Mesh(new THREE.BoxGeometry(1.4, 1.5, 4.6), mats.travertine);
    pier.position.set(railStreamX + pierX, railBridgeBaseY - 0.82, 77.1);
    pier.castShadow = true;
    group.add(pier);
  });

  // Waterfront Wooden Rowboat bobbing behind Sarı Belediye on Tabakhane Deresi
  const boatZ = 34;
  const boatX = getTabakhaneCenterX(boatZ) - 0.75;
  const boatBaseY = getTabakhaneWaterY(boatZ) + 0.07;
  const boatGroup = new THREE.Group();
  boatGroup.position.set(boatX, boatBaseY, boatZ);
  boatGroup.rotation.y = 0.08;
  const hull = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.36, 2.75), mats.darkTimber);
  hull.castShadow = true;
  const bench = new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.08, 0.34), mats.creamPlaster);
  bench.position.y = 0.16;
  boatGroup.add(hull, bench);
  group.add(boatGroup);

  // Historic Stone Watermill on the West Bank of Tabakhane Deresi (z = 59)
  const millZ = 59;
  const millX = getTabakhaneCenterX(millZ) - 6.6;
  const millY = getTerrainHeightAt(millX, millZ);
  const millGroup = new THREE.Group();
  millGroup.position.set(millX, millY, millZ);
  const millSkirt = new THREE.Mesh(new THREE.BoxGeometry(6.4, 1.8, 5.4), mats.travertine);
  millSkirt.position.y = -0.85;
  millGroup.add(millSkirt);
  const millBase = new THREE.Mesh(new THREE.BoxGeometry(6.2, 4.2, 5.2), mats.travertine);
  millBase.position.y = 2.1;
  millBase.castShadow = true;
  millBase.receiveShadow = true;
  millGroup.add(millBase);
  const millRoof = new THREE.Mesh(createGableRoofGeometry(6.8, 5.8, 2.0), mats.terracottaRoof);
  millRoof.position.y = 4.18;
  millRoof.castShadow = true;
  millGroup.add(millRoof);
  const millChimney = new THREE.Mesh(new THREE.BoxGeometry(0.65, 1.3, 0.65), mats.industrialBrick);
  millChimney.position.set(-1.8, 5.5, -1.2);
  millGroup.add(millChimney);

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
  const cottageX = 104;
  const cottageZ = -52;
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

  // 5. Terrain-Conforming Mediterranean Road Network + Bridge Arches + Zebra Crosswalks
  const roadW = 8.4;
  const roadMinX = -96;
  const roadMaxX = 104;
  const roadMinZ = -110;
  const roadMaxZ = 72;

  ROAD_Z_COORDS.forEach((rz) => {
    const isBazaar = rz === -22;
    const curb = new THREE.Mesh(
      createTerrainConformingRibbon(roadMinX - 1, rz, roadMaxX + 1, rz, roadW + 2.6, 104, 4, 0.09, true),
      mats.sidewalk
    );
    curb.receiveShadow = true;
    group.add(curb);

    const roadMesh = new THREE.Mesh(
      createTerrainConformingRibbon(roadMinX, rz, roadMaxX, rz, roadW, 104, 4, 0.13, true),
      isBazaar ? mats.cobble : mats.asphalt
    );
    roadMesh.receiveShadow = true;
    group.add(roadMesh);

    if (!isBazaar) {
      for (let dx = -90; dx <= 96; dx += 6.5) {
        if (Math.abs(dx) < 17 && rz === 12) continue;
        const dy = getSurfaceHeightAt(dx, rz) + 0.165;
        const slopes = getSurfaceSlopeAngles(dx, rz, -Math.PI / 2);
        const dash = new THREE.Mesh(new THREE.PlaneGeometry(3.0, 0.22), mats.roadStripe);
        dash.rotation.order = 'YXZ';
        dash.rotation.set(-Math.PI / 2 + slopes.roll, 0, -slopes.pitch);
        dash.position.set(dx, dy, rz);
        group.add(dash);
      }
    }
  });

  ROAD_X_COORDS.forEach((rx) => {
    const isSevgiYolu = rx === -18;
    const curb = new THREE.Mesh(
      createTerrainConformingRibbon(rx, roadMinZ - 1, rx, roadMaxZ + 1, roadW + 2.6, 104, 4, 0.105, true),
      mats.sidewalk
    );
    curb.receiveShadow = true;
    group.add(curb);

    const roadMesh = new THREE.Mesh(
      createTerrainConformingRibbon(rx, roadMinZ, rx, roadMaxZ, roadW, 104, 4, 0.148, true),
      isSevgiYolu ? mats.cobble : mats.asphalt
    );
    roadMesh.receiveShadow = true;
    group.add(roadMesh);

    if (!isSevgiYolu) {
      for (let dz = -104; dz <= 64; dz += 6.5) {
        const dy = getSurfaceHeightAt(rx, dz) + 0.175;
        const slopes = getSurfaceSlopeAngles(rx, dz, 0);
        const dash = new THREE.Mesh(new THREE.PlaneGeometry(0.22, 3.0), mats.roadStripe);
        dash.rotation.order = 'YXZ';
        dash.rotation.set(-Math.PI / 2 + slopes.pitch, 0, slopes.roll);
        dash.position.set(rx, dy, dz);
        group.add(dash);
      }
    }
  });

  ROAD_X_COORDS.forEach((rx) => {
    ROAD_Z_COORDS.forEach((rz) => {
      const slopes = getSurfaceSlopeAngles(rx, rz, 0);
      for (let s = -2.6; s <= 2.6; s += 1.3) {
        const stripeEW = new THREE.Mesh(new THREE.PlaneGeometry(0.55, 2.0), mats.roadStripe);
        stripeEW.rotation.set(-Math.PI / 2 + slopes.pitch, 0, slopes.roll);
        stripeEW.position.set(rx + s, getSurfaceHeightAt(rx + s, rz + 5.1) + 0.182, rz + 5.1);
        group.add(stripeEW);

        const stripeNS = new THREE.Mesh(new THREE.PlaneGeometry(2.0, 0.55), mats.roadStripe);
        stripeNS.rotation.set(-Math.PI / 2 + slopes.pitch, 0, slopes.roll);
        stripeNS.position.set(rx + 5.1, getSurfaceHeightAt(rx + 5.1, rz + s) + 0.182, rz + s);
        group.add(stripeNS);
      }
    });
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
  colliders.push({ minX: -2.7, maxX: 2.7, minZ: 19.1, maxZ: 24.5 });

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

  const musicians = createStreetMusiciansZeybek(mats);
  group.add(musicians.group);

  const libraryVendor = createLibraryAndVendor(mats, colliders);
  group.add(libraryVendor.group);

  const lokmaStand = createBeyCamiiLokmaStand(mats, colliders);
  group.add(lokmaStand.group);

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

  const interactiveClickables: THREE.Object3D[] = [
    musicians.clickTarget,
    libraryVendor.clickTarget,
    lokmaStand.clickTarget,
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

  // Dense Mediterranean Townhouse Clusters + Orta Mahalle East-Bank & Aytepe Hillside Rows
  const blockCenters: [number, number, number, number][] = [
    // Block between Yağcılar (-54) and Sevgi Yolu (-18)
    [-42, -2, 6.4, 5.6],
    [-42, -10, 5.8, 5.2],
    [-31, -12, 5.8, 5.0],
    [-42, 27, 6.4, 5.6],
    [-42, 35, 6.0, 5.2],
    [-30, 38, 6.2, 5.0],
    // Block between Sevgi Yolu (-18) and Hükümet Blv (+18)
    [-7, -33, 6.2, 5.6],
    [1, -33, 5.8, 5.4],
    [9, -33, 6.2, 5.6],
    [-7, -45, 6.0, 5.2],
    [2, -45, 5.8, 5.0],
    [9, -45, 6.0, 5.2],
    [-7, 34, 6.6, 5.4],
    [2, 34, 5.6, 5.2],
    [9, 34, 6.4, 5.4],
    // Block between Hükümet Blv (+18) and Tabakhane Deresi (~48.6)
    [38, -46, 6.0, 5.4],
    [28, -46, 5.8, 5.2],
    [28, 39, 6.2, 5.0],
    [38, 39, 5.8, 5.0],
    // Kalfaköy, Tralleis Ridge & ADÜ Slope Houses
    [-68, -72, 6.2, 5.4],
    [-68, -83, 6.0, 5.2],
    [-44, -67, 5.6, 4.8],
    [-28, -67, 5.6, 4.8],
    [42, -72, 6.4, 5.4],
    [42, -83, 6.2, 5.2],
    [97, -72, 6.2, 5.2],
    [97, -84, 6.0, 5.0],
    // Orta Mahalle & Doğu Bulvarı East-Bank Neighborhood Houses
    [68, -4, 6.4, 5.6],
    [77, -4, 6.0, 5.2],
    [92, -45, 6.2, 5.4],
    [92, -35, 6.2, 5.4],
    [92, -11, 6.2, 5.4],
    [92, -2, 6.2, 5.4],
    [92, 5, 6.0, 5.2],
    [-70, -35, 6.4, 5.6],
    [-70, -45, 6.0, 5.2],
    [-34, 64, 7.2, 5.8],
    [-44, 64, 6.4, 5.4],
    [28, 64, 6.6, 5.6],
    [-70, 58, 6.4, 5.4],
    [70, 58, 6.4, 5.4],
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
    for (const rx of ROAD_X_COORDS) {
      if (Math.abs(x - rx) < 4.5 + clearance) return false;
    }
    for (const rz of ROAD_Z_COORDS) {
      if (Math.abs(z - rz) < 4.5 + clearance) return false;
    }
    if (Math.abs(x - getTabakhaneCenterX(z)) < getTabakhaneHalfWidth() + 1.2 + clearance) {
      return false;
    }
    if (z > 74.0 && z < 80.5) return false;
    if (Math.hypot(x - PLAYER_HOME_DOOR_POS[0], z - PLAYER_HOME_DOOR_POS[1]) < 4.2) {
      return false;
    }
    for (const lm of LANDMARKS) {
      if (lm.doorPosition) {
        if (Math.hypot(x - lm.doorPosition[0], z - lm.doorPosition[1]) < 3.6) return false;
      }
    }
    if (avoidMeydan && Math.hypot(x, z - 12) < 16.4) return false;
    if (overlapsAny(x, z, clearance * 2, clearance * 2, colliders, 0.7)) return false;
    return true;
  };

  // 10a. Washingtonia Palm Trees aligned symmetrically along Boulevard Sidewalks
  const rawPalms: [number, number][] = [];
  const meydanRowX = [-82, -72, -63, -45, -36, -27, 27, 36, 44, 65, 74, 84];
  meydanRowX.forEach((px) => {
    rawPalms.push([px, 6.0], [px, 18.0]);
  });
  [-80, -68, -45, -31, 31, 43, 68, 80].forEach((px) => {
    rawPalms.push([px, 42.0]);
  });
  [27, 36, 65, 74, 84].forEach((px) => {
    rawPalms.push([px, -90.0]);
  });
  [-45, -31, 45, 65, 78].forEach((px) => {
    rawPalms.push([px, -102.0]);
  });
  rawPalms.push(
    [-12.2, 2.2],
    [12.2, 2.2],
    [-12.2, 21.8],
    [12.2, 21.8],
    [64, 22],
    [64, 38],
    [-60, 22],
    [-60, 38]
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

  // 10b. Multi-Forked Seasonal Broadleaf Trees (Spring Blossoms / Summer Green / Autumn Amber / Winter Bare + Red Birds)
  const rawBroadleaf: [number, number][] = [];
  for (let oz = -84; oz <= 68; oz += 12) {
    const sx = getTabakhaneCenterX(oz);
    rawBroadleaf.push([sx - 5.4, oz], [102.5, oz - 2], [-94.5, oz]);
  }
  // Clean uniform Sevgi Yolu tree line (avoids intersections & Sıcak Yuvam doorway at z = -4)
  [-48, -32, -12, 26, 38, 60].forEach((oz) => {
    rawBroadleaf.push([-23.8, oz], [-12.2, oz]);
  });
  rawBroadleaf.push(
    [-48, -68],
    [65, -51],
    [89, -51],
    [-83, 38],
    [-76, 39],
    [-84, 22],
    [-12, 38],
    [12, 38],
    [28, -36],
    [-28, -36],
    [65, -89],
    [95, -89],
    [27, -42],
    [-45, -42],
    [-81, -14],
    [64, -50],
    [94, -50]
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
  for (let ox = -92; ox <= 98; ox += 11) {
    for (let oz = -118; oz <= -104; oz += 10) {
      rawPines.push([ox + ((oz * 3) % 2), oz]);
    }
  }
  for (let oz = -86; oz <= 64; oz += 14) {
    rawPines.push([-106.5, oz + 3], [110.5, oz]);
  }
  rawPines.push(
    [-11, -76],
    [11, -76],
    [43, -42],
    [64, -67],
    [94, -67],
    [-48, -86],
    [-25, -86],
    [95, -67],
    [48, -68],
    [-86, 44],
    [-64, 44]
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
  [-78, -66, -42, -30, 30, 41, 66, 78].forEach((sx) => {
    rawShrubs.push([sx, 5.5], [sx, 18.5], [sx, -90.8]);
  });
  [-86, -72, -40, -10, 26, 38, 62].forEach((sz) => {
    rawShrubs.push([getTabakhaneCenterX(sz) - 4.4, sz], [-12.2, sz]);
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

  // 10e. Street Lamps along Boulevards (cleanly clear of intersections & Tabakhane Bridges)
  const lampCoords: [number, number][] = [];
  ROAD_Z_COORDS.forEach((rz) => {
    [-72, -36, 0, 36, 76, 94].forEach((lx) => {
      if (Math.abs(lx) < 16 && rz === 12) return;
      if (ROAD_X_COORDS.some((rx) => Math.abs(lx - rx) < 6.0)) return;
      const lz = rz - 5.1;
      if (Math.abs(lx - getTabakhaneCenterX(lz)) < 5.0) return;
      lampCoords.push([lx, lz]);
    });
  });
  const poleGeo = new THREE.CylinderGeometry(0.08, 0.11, 4.0, 8);
  poleGeo.translate(0, 2.0, 0);
  const poleInst = new THREE.InstancedMesh(poleGeo, mats.wroughtIron, lampCoords.length);

  const bulbGeo = new THREE.SphereGeometry(0.24, 10, 8);
  bulbGeo.translate(0, 4.1, 0);
  const bulbInst = new THREE.InstancedMesh(bulbGeo, mats.lampBulb, lampCoords.length);

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
    [0, getTerrainHeightAt(0, 12) + 6.9, 9.5], // Kent Meydanı Anıtı üstü
    [-9.5, getTerrainHeightAt(-9.5, 11) + 1.55, 11], // Kent Meydanı Batı Havuz
    [9.5, getTerrainHeightAt(9.5, 11) + 1.55, 11], // Kent Meydanı Doğu Havuz
    [getTabakhaneCenterX(12), getSurfaceHeightAt(getTabakhaneCenterX(12), 12) + 1.85, 12 + 4.3], // Merkez Köprü
    [getTabakhaneCenterX(-22), getSurfaceHeightAt(getTabakhaneCenterX(-22), -22) + 1.85, -22 - 4.3], // Çarşı Köprüsü
    [getTabakhaneCenterX(-58), getSurfaceHeightAt(getTabakhaneCenterX(-58), -58) + 1.85, -58 + 4.3], // Kuzey Köprüsü
    [18, getTerrainHeightAt(18, -14) + 10.2, -14], // Tarihi Sarı Belediye çatısı
    [-38, getTerrainHeightAt(-38, -22) + 10.2, -22], // Bey Camii üstü
    [0, getTerrainHeightAt(0, -80) + 9.8, -80], // Tralleis Üç Gözler kemer üstü
    [76, getTerrainHeightAt(76, -40) + 3.4, -40 + 4.8], // Orta Mahalle asma çardağı
    [-54, getTerrainHeightAt(-54, 48) + 9.2, 49.5], // Tarihi Tren Garı çatısı
    [82, getTerrainHeightAt(82, -80) + 10.1, -74.2] // ADÜ Kütüphane kubbesi
  );

  // 10f. Warm Cozy Pergola String Lights in Kent Meydanı & Orta Mahalle (east of Tabakhane)
  const garlandPoints: [number, number, number][] = [];
  for (let i = 0; i < 6; i++) {
    const a = (i * Math.PI * 2) / 6;
    const gx = -7.5 + Math.cos(a) * 1.85;
    const gz = 1.2 + Math.sin(a) * 1.85;
    garlandPoints.push([gx, getTerrainHeightAt(gx, gz) + 2.32, gz]);
  }
  const ortaBaseY = getTerrainHeightAt(76, -40);
  for (let gx = -2.2; gx <= 2.2; gx += 1.1) {
    garlandPoints.push([76 + 4.2 + gx, ortaBaseY + 3.05, -40 + 4.8 + 1.4]);
  }
  perches.addStaticSegment(
    'orta_pergola',
    new THREE.Vector3(76 + 1.8, ortaBaseY + 3.12, -40 + 4.8),
    new THREE.Vector3(76 + 6.6, ortaBaseY + 3.12, -40 + 4.8),
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
    [0, getTerrainHeightAt(0, 12) + 15.5, 12],
    [0, getTerrainHeightAt(0, -76) + 15.5, -76],
    [78, getTerrainHeightAt(78, -78) + 15.5, -78],
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
  const _hillBase = new THREE.Color(0x829555);
  const _hillAutumn = new THREE.Color(0xa68c52);
  const _hillWinter = new THREE.Color(0xdbe6ee);
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
    update: (dt: number, elapsed: number) => {
      steamTrain.update(dt, elapsed);
      ambientTraffic.update(dt, elapsed);
      waterWheelPivot.rotation.x -= dt * 1.15;
      boatGroup.position.y = boatBaseY + Math.sin(elapsed * 1.5) * 0.04;
      boatGroup.rotation.z = Math.sin(elapsed * 1.1) * 0.03;

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
    },
    updateAtmosphere: (dt: number, elapsed: number, state: SeasonalAtmosphereState) => {
      foliage.update(dt, elapsed, state);

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
        .copy(state.season === 'autumn' ? _hillAutumn : _hillBase)
        .lerp(_hillWinter, snowTintT * 0.84);
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
    },
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
