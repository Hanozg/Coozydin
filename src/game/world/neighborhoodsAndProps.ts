import * as THREE from 'three';
import { AYDIN_ROAD_SEGMENTS, RAIL_TRACK_Z, sampleNearestRoad } from '../../data/aydinRoads';
import { LANDMARKS, PLAYER_HOME_DOOR_POS, PLAYER_HOME_POS } from '../../data/efelerData';
import { ColliderBox, HouseExteriorConfig } from '../../types/game';
import { buildCustomPlayerHouse, buildDioramaHouse, BuiltCustomPlayerHouse } from '../dioramaHouses';
import { CityMaterialLibrary } from '../materials';
import { PerchSystem } from '../perchSystem';
import { SandboxManager } from '../sandboxManager';
import {
  createSeasonalFoliageSystem,
  SeasonalFoliageSystem,
  ShrubPlacement,
  TreePlacement,
} from '../seasonalFoliage';
import {
  getBuildingPadHeight,
  getSurfaceHeightAt,
  getTabakhaneCenterX,
  getTabakhaneHalfWidth,
  getTerrainHeightAt,
  getWalkableSurfaceHeightAt,
} from '../terrain';
import { nearRoad, overlapsAny, registerHousePerches } from './geometryHelpers';
import { buildSummerResortModel } from './summerResortModels';

export interface NeighborhoodsAndPropsResult {
  foliage: SeasonalFoliageSystem;
  homeRingMesh: THREE.Mesh;
  yardLawnMat: THREE.MeshStandardMaterial;
  blossomMat: THREE.MeshStandardMaterial;
  updatePlayerHomeExterior: (config: HouseExteriorConfig) => void;
  updateDynamicProps: (dt: number, elapsed: number) => void;
  dispose: () => void;
}

export function buildNeighborhoodsAndProps(params: {
  group: THREE.Group;
  staticWorldGroup: THREE.Group;
  mats: CityMaterialLibrary;
  colliders: ColliderBox[];
  perches: PerchSystem;
  crumbSpots: Array<[number, number, number]>;
  initialHouseExterior: HouseExteriorConfig;
  localDisposables: { dispose: () => void }[];
  sandbox?: SandboxManager;
}): NeighborhoodsAndPropsResult {
  const {
    group,
    staticWorldGroup,
    mats,
    colliders,
    perches,
    crumbSpots,
    initialHouseExterior,
    localDisposables,
    sandbox,
  } = params;

  const plasterMats = [
    mats.creamPlaster,
    mats.peachPlaster,
    mats.terracottaPlaster,
    mats.ochrePlaster,
    mats.sagePlaster,
    mats.skyBluePlaster,
    mats.whitePlaster,
  ];
  const yardLawnMat = new THREE.MeshStandardMaterial({
    color: 0x88a454,
    map: mats.grassMicroGrain,
    roughness: 0.91,
    metalness: 0.0,
  });
  const flowerBoxMat = new THREE.MeshStandardMaterial({ color: 0x5d8242, roughness: 0.85 });
  const blossomMat = new THREE.MeshStandardMaterial({ color: 0xd9614a, roughness: 0.76 });
  localDisposables.push(yardLawnMat, flowerBoxMat, blossomMat);
  const chimneyOrigins: [number, number, number][] = [];

  // Cozy Hillside Farmhouse above Orta Mahalle Foothills (East)
  const cottageX = 134;
  const cottageZ = -64;
  const cottageY = getBuildingPadHeight(cottageX, cottageZ, (5.8 + 1.35) * 0.5, (4.6 + 2.05) * 0.5);
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
    perches,
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
  const cottageCollider: ColliderBox = {
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
  };
  colliders.push(cottageCollider);
  sandbox?.registerBuilding({
    id: 'house:cottage',
    label: 'Orta Mahalle Bağ Evi',
    category: 'house',
    group: builtCottage.group,
    x: cottageX,
    z: cottageZ,
    rotY: 0.22,
    colliders: [cottageCollider],
    footprintW: 6.2,
    footprintD: 5.2,
  });

  // Player's Own House ("Sıcak Yuvam") facing Sevgi Yolu (+X)
  const [hx, hz] = PLAYER_HOME_POS;
  const homeY = getBuildingPadHeight(hx, hz, 3.7, 3.7);
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
  const homePeak = registerHousePerches(perches, 'player_home', hx, homeY, hz, 6.0, 5.4, 4.4, 0, Math.PI / 2);
  const homeChimneyIndex = chimneyOrigins.length;
  chimneyOrigins.push([
    hx + builtHome.chimneyTopLocal[2],
    homeY + builtHome.chimneyTopLocal[1],
    hz - builtHome.chimneyTopLocal[0],
  ]);
  const homeCollider: ColliderBox = {
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
  };
  colliders.push(homeCollider);
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

  sandbox?.registerBuilding({
    id: 'player_home',
    label: 'Sıcak Yuvam (Evim)',
    category: 'player_home',
    group: builtHome.group,
    x: hx,
    z: hz,
    rotY: Math.PI / 2,
    colliders: [homeCollider],
    ringMesh: homeRingMesh,
    footprintW: 6.8,
    footprintD: 6.4,
  });

  // Stone garden walkway connecting Sıcak Yuvam front door to Adnan Menderes Blv. sidewalk
  const homeWalkway = new THREE.Mesh(new THREE.BoxGeometry(4.8, 0.5, 3.4), mats.cobble);
  homeWalkway.position.set(-26.6, homeY - 0.13, hz);
  homeWalkway.receiveShadow = true;
  staticWorldGroup.add(homeWalkway);
  const homeWalkBorder = new THREE.Mesh(new THREE.BoxGeometry(4.9, 0.46, 3.7), mats.travertine);
  homeWalkBorder.position.set(-26.6, homeY - 0.16, hz);
  staticWorldGroup.add(homeWalkBorder);

  // Miniature 3D Diorama Houses
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

    const gy = getBuildingPadHeight(x, z, (w + 1.35) * 0.5, (d + 2.05) * 0.5);
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

    const peakH = registerHousePerches(perches, `house_${x}_${z}`, x, gy, z, w, d, h, variant, rotY);

    const houseCollider: ColliderBox = {
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
    };
    colliders.push(houseCollider);
    sandbox?.registerBuilding({
      id: `house:${variant}`,
      label: `Efeler Konağı #${variant + 1}`,
      category: 'house',
      group: built.group,
      x,
      z,
      rotY,
      colliders: [houseCollider],
      footprintW: w + 0.6,
      footprintD: d + 1.3,
    });
    if (variant % 4 === 1) {
      crumbSpots.push([x, gy + h + peakH + 0.65, z]);
    }
  };

  sandbox?.setCustomHouseFactory((spec, sx, sz, sRotY) => {
    if (spec.kind && spec.kind !== 'house') {
      return buildSummerResortModel(spec, mats, sx, sz, sRotY, localDisposables);
    }
    const gy = getBuildingPadHeight(sx, sz, (spec.w + 1.35) * 0.5, (spec.d + 2.05) * 0.5);
    const wallMat = plasterMats[spec.variant % plasterMats.length];
    const built = buildDioramaHouse({
      w: spec.w,
      d: spec.d,
      h: spec.h,
      variant: spec.variant,
      mats,
      wallMat,
      lawnMat: yardLawnMat,
      flowerBoxMat,
      blossomMat,
    });
    built.group.position.set(sx, gy, sz);
    built.group.rotation.y = sRotY;

    const peakH = Math.max(1.3, Math.min(spec.w, spec.d) * 0.34);
    const cosR = Math.cos(sRotY);
    const sinR = Math.sin(sRotY);
    const hw = spec.w / 2 + 0.3;
    const hd = spec.d / 2 + 0.5;
    const effHW = Math.abs(hw * cosR) + Math.abs(hd * sinR);
    const effHD = Math.abs(hw * sinR) + Math.abs(hd * cosR);

    const collider: ColliderBox = {
      minX: sx - effHW,
      maxX: sx + effHW,
      minZ: sz - effHD,
      maxZ: sz + effHD,
      maxY: gy + spec.h + 0.22 + peakH + 0.14,
      roof: {
        cx: sx,
        cz: sz,
        halfW: spec.w / 2 + 0.28,
        halfD: spec.d / 2 + 0.28,
        wallTopY: gy + spec.h + 0.22,
        peakH: peakH + 0.12,
        ridgeAlongZ: spec.variant % 2 === 0,
        rotY: sRotY,
      },
    };
    return {
      group: built.group,
      colliders: [collider],
      footprintW: spec.w + 0.6,
      footprintD: spec.d + 1.0,
    };
  });

  const blockCenters: [number, number, number, number][] = [
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
    [-10, -40, 6.2, 5.4],
    [10, -40, 6.2, 5.4],
    [-10, -60, 6.0, 5.2],
    [10, -60, 6.0, 5.2],
    [-10, 54, 6.4, 5.4],
    [0, 54, 6.0, 5.2],
    [10, 54, 6.4, 5.4],
    [38, -60, 6.0, 5.2],
    [28, -40, 5.6, 4.8],
    [42, -16, 6.0, 5.2],
    [30, -16, 5.8, 5.0],
    [30, 54, 6.2, 5.2],
    [42, 54, 6.0, 5.2],
    [30, 24, 5.8, 5.0],
    [-78, -82, 6.2, 5.4],
    [-78, -104, 6.0, 5.2],
    [-42, -82, 5.8, 5.0],
    [-12, -84, 5.8, 5.0],
    [48, -84, 6.2, 5.4],
    [48, -104, 6.0, 5.2],
    [108, -84, 6.2, 5.2],
    [108, -98, 6.0, 5.0],
    [-92, -38, 6.4, 5.6],
    [-92, -54, 6.2, 5.4],
    [-76, -62, 6.0, 5.2],
    [-90, -2, 6.2, 5.4],
    [-72, -2, 6.0, 5.2],
    [-90, 20, 6.2, 5.4],
    [-72, 20, 6.0, 5.2],
    [-132, -32, 6.2, 5.4],
    [-132, -48, 6.2, 5.4],
    [78, -4, 6.4, 5.4],
    [92, -4, 6.2, 5.2],
    [106, -4, 6.0, 5.2],
    [108, -48, 6.4, 5.4],
    [108, -34, 6.2, 5.4],
    [78, -18, 6.2, 5.2],
    [134, -36, 6.4, 5.4],
    [134, 34, 6.4, 5.4],
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

  // Cozy Chimney Smoke Puffs
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

  // Seasonal Foliage & Street Props
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

  const rawPalms: [number, number][] = [];
  [-142, -124, -108, -88, -72, -48, -32, -10, 0, 10, 30, 44, 78, 92, 106].forEach((px) => {
    rawPalms.push([px, 31.8], [px, 44.2], [px, 63.6]);
  });
  [-92, -74, -50, -28].forEach((px) => {
    rawPalms.push([px, 5.2], [px, 17.8]);
  });
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

  const rawBroadleaf: [number, number][] = [];
  for (let oz = -104; oz <= 86; oz += 14) {
    const sx = getTabakhaneCenterX(oz);
    rawBroadleaf.push([sx - 5.2, oz], [sx + 5.2, oz], [126.5, oz - 2], [-142.5, oz]);
  }
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

  // Street Lamps along Real Aydın Boulevards
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
  const poleGeo = new THREE.CylinderGeometry(0.058, 0.085, 3.85, 10);
  poleGeo.translate(0, 1.925, 0);
  const poleInst = new THREE.InstancedMesh(poleGeo, mats.wroughtIron, Math.max(1, lampCoords.length));

  const bulbGeo = new THREE.SphereGeometry(0.15, 12, 10);
  bulbGeo.translate(0, 3.94, 0);
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
      new THREE.Vector3(x - 0.28, sy + 4.1, z),
      new THREE.Vector3(x + 0.28, sy + 4.1, z),
      0.14,
      'metal'
    );
  });
  poleInst.instanceMatrix.needsUpdate = true;
  bulbInst.instanceMatrix.needsUpdate = true;
  poleInst.computeBoundingSphere();
  bulbInst.computeBoundingSphere();
  group.add(poleInst, bulbInst);

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

  crumbSpots.push(
    [8.8, getTerrainHeightAt(8.8, 10.6) + 6.7, 10.6],
    [-7.8, getTerrainHeightAt(-7.8, 13.5) + 2.9, 13.5],
    [0, getTerrainHeightAt(0, -13.6) + 4.2, -13.6],
    [-39.5, getTerrainHeightAt(-39.5, 11.5) + 3.85, 11.5],
    [-76, getTerrainHeightAt(-76, -47) + 2.8, -47],
    [getTabakhaneCenterX(30), getSurfaceHeightAt(getTabakhaneCenterX(30), 30) + 1.85, 30 + 4.3],
    [getTabakhaneCenterX(-30), getSurfaceHeightAt(getTabakhaneCenterX(-30), -30) + 1.85, -30 - 4.3],
    [getTabakhaneCenterX(-72), getSurfaceHeightAt(getTabakhaneCenterX(-72), -72) + 1.85, -72 + 4.3],
    [36.7, getTerrainHeightAt(36.7, 10) + 10.8, 10],
    [-36.0, getTerrainHeightAt(-36.0, -2.5) + 10.2, -2.5],
    [-58, getTerrainHeightAt(-58, -108) + 9.8, -108],
    [92, getTerrainHeightAt(92, -48) + 3.4, -48 + 4.8],
    [0, getTerrainHeightAt(0, 85) + 9.2, 86.5],
    [96, getTerrainHeightAt(96, -104) + 10.1, -98.2],
    [-188, getTerrainHeightAt(-188, -17.7) + 8.9, -17.7],
    [-113.4, getTerrainHeightAt(-127, 14) + 4.4, 14.4],
    [-80, getTerrainHeightAt(-80, 52) + 7.2, 54.8]
  );
  const magY = getTerrainHeightAt(-188, -12);
  perches.addStaticSegment(
    'magnesia_temple_ridge',
    new THREE.Vector3(-192.5, magY + 8.35, -17.7),
    new THREE.Vector3(-183.5, magY + 8.35, -17.7),
    0.18,
    'stone'
  );

  // Warm Cozy Pergola String Lights over Kent Meydanı Belediye Kafeleri & Orta Mahalle
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

  // Peaceful Gliding White Doves
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

  let fxAccum = 0.032;

  return {
    foliage,
    homeRingMesh,
    yardLawnMat,
    blossomMat,
    updatePlayerHomeExterior: (nextConfig: HouseExteriorConfig) => {
      const liveTransform = sandbox?.getBuildingTransform('player_home');
      const curX = liveTransform ? liveTransform.x : hx;
      const curZ = liveTransform ? liveTransform.z : hz;
      const curRotY = liveTransform ? liveTransform.rotY : Math.PI / 2;
      const curY = getBuildingPadHeight(curX, curZ, 3.7, 3.7);

      group.remove(builtHome.group);
      builtHome.dispose();
      builtHome = buildCustomPlayerHouse({
        config: nextConfig,
        mats,
        lawnMat: yardLawnMat,
        flowerBoxMat,
        blossomMat,
      });
      builtHome.group.position.set(curX, curY, curZ);
      builtHome.group.rotation.y = curRotY;
      group.add(builtHome.group);
      sandbox?.rebindBuildingGroup('player_home', builtHome.group);

      const cosR = Math.cos(curRotY);
      const sinR = Math.sin(curRotY);
      const [cx, cy, cz] = builtHome.chimneyTopLocal;
      chimneyOrigins[homeChimneyIndex] = [
        curX + cx * cosR + cz * sinR,
        curY + cy,
        curZ - cx * sinR + cz * cosR,
      ];
    },
    updateDynamicProps: (dt, elapsed) => {
      fxAccum += dt;
      if (fxAccum >= 0.032) {
        fxAccum = 0;
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
    },
    dispose: () => {
      builtHome.dispose();
      foliage.dispose();
    },
  };
}
