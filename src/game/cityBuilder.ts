import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import {
  LANDMARKS,
  PLAYER_HOME_DOOR_POS,
  PLAYER_HOME_POS,
  ROAD_X_COORDS,
  ROAD_Z_COORDS,
} from '../data/efelerData';
import { ColliderBox } from '../types/game';
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
  buildAncientCitiesSignposts,
  createLivingFigTree,
  createPedestrianSystem,
  createTrafficLightSystem,
  LivingFigTree,
  PedestrianSystem,
  TrafficLightSystem,
} from './livingWorld';
import { CityMaterialLibrary } from './materials';

export interface BuiltCity {
  group: THREE.Group;
  landmarks: BuiltLandmark[];
  colliders: ColliderBox[];
  figTree: LivingFigTree;
  pedestrians: PedestrianSystem;
  trafficLights: TrafficLightSystem;
  musicians: StreetMusiciansRig;
  libraryVendor: LibraryVendorRig;
  lokmaStand: LokmaStandRig;
  homeRingMesh: THREE.Mesh;
  interactiveClickables: THREE.Object3D[];
  dispose: () => void;
}

function overlapsAny(
  x: number,
  z: number,
  w: number,
  d: number,
  existing: ColliderBox[],
  margin = 2.6
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

function createPalmCrownGeometry(): THREE.BufferGeometry {
  const parts: THREE.BufferGeometry[] = [];
  const frondCount = 7;
  for (let i = 0; i < frondCount; i++) {
    const angle = (i * Math.PI * 2) / frondCount;
    const blade = new THREE.BoxGeometry(0.46, 0.1, 2.35);
    blade.translate(0, 0, 1.15);
    blade.rotateX(0.32); // Graceful downward arch
    blade.rotateY(angle);
    blade.translate(0, 5.5, 0);
    parts.push(blade);

    // Secondary upper frond tuft
    const topBlade = new THREE.BoxGeometry(0.36, 0.08, 1.65);
    topBlade.translate(0, 0, 0.8);
    topBlade.rotateX(-0.18);
    topBlade.rotateY(angle + 0.35);
    topBlade.translate(0, 5.65, 0);
    parts.push(topBlade);
  }
  const merged = mergeGeometries(parts);
  parts.forEach((p) => p.dispose());
  return merged;
}

export function buildEfelerCity(mats: CityMaterialLibrary): BuiltCity {
  const group = new THREE.Group();
  const colliders: ColliderBox[] = [];

  // 1. Continuous Horizon Terrain
  const terrain = new THREE.Mesh(new THREE.PlaneGeometry(480, 480), mats.ground);
  terrain.rotation.x = -Math.PI / 2;
  terrain.position.y = 0;
  terrain.receiveShadow = true;
  group.add(terrain);

  // 2. Northern Aydın Mountain Foothills (Kalfaköy / Paşa Yaylası ridge)
  const hillMat = new THREE.MeshStandardMaterial({
    color: 0x6f8454,
    roughness: 0.92,
    metalness: 0.0,
  });
  const hillConfigs: [number, number, number, number, number][] = [
    [-95, -135, 58, 22, 42],
    [-35, -142, 65, 28, 45],
    [35, -138, 62, 25, 44],
    [98, -132, 54, 20, 40],
    [-145, -50, 42, 14, 52],
    [145, -45, 42, 13, 52],
  ];
  hillConfigs.forEach(([hx, hz, rx, ry, rz]) => {
    const hillGeo = new THREE.SphereGeometry(1, 20, 14, 0, Math.PI * 2, 0, Math.PI * 0.5);
    const hill = new THREE.Mesh(hillGeo, hillMat);
    hill.position.set(hx, -0.5, hz);
    hill.scale.set(rx, ry, rz);
    hill.receiveShadow = true;
    group.add(hill);
  });

  // 3. Realistic Road Network + Sidewalk Curbs + Zebra Crosswalks + Kent Meydanı Roundabout
  const roadW = 8.4;
  const roadSpan = 190;

  // East-West Boulevards
  ROAD_Z_COORDS.forEach((rz) => {
    const isBazaar = rz === -22;
    // Sidewalk apron underneath boulevard edges
    const curb = new THREE.Mesh(new THREE.PlaneGeometry(roadSpan + 2, roadW + 2.4), mats.sidewalk);
    curb.rotation.x = -Math.PI / 2;
    curb.position.set(0, 0.018, rz);
    curb.receiveShadow = true;
    group.add(curb);

    const roadMesh = new THREE.Mesh(
      new THREE.PlaneGeometry(roadSpan, roadW),
      isBazaar ? mats.cobble : mats.asphalt
    );
    roadMesh.rotation.x = -Math.PI / 2;
    roadMesh.position.set(0, 0.032, rz);
    roadMesh.receiveShadow = true;
    group.add(roadMesh);

    if (!isBazaar) {
      for (let dx = -88; dx <= 88; dx += 6.5) {
        if (Math.abs(dx) < 17 && rz === 12) continue;
        const dash = new THREE.Mesh(new THREE.PlaneGeometry(3.0, 0.22), mats.roadStripe);
        dash.rotation.x = -Math.PI / 2;
        dash.position.set(dx, 0.048, rz);
        group.add(dash);
      }
    }
  });

  // North-South Avenues
  ROAD_X_COORDS.forEach((rx) => {
    const isSevgiYolu = rx === -18;
    const curb = new THREE.Mesh(new THREE.PlaneGeometry(roadW + 2.4, 150), mats.sidewalk);
    curb.rotation.x = -Math.PI / 2;
    curb.position.set(rx, 0.02, -4);
    curb.receiveShadow = true;
    group.add(curb);

    const roadMesh = new THREE.Mesh(
      new THREE.PlaneGeometry(roadW, 148),
      isSevgiYolu ? mats.cobble : mats.asphalt
    );
    roadMesh.rotation.x = -Math.PI / 2;
    roadMesh.position.set(rx, 0.036, -4);
    roadMesh.receiveShadow = true;
    group.add(roadMesh);

    if (!isSevgiYolu) {
      for (let dz = -70; dz <= 60; dz += 6.5) {
        const dash = new THREE.Mesh(new THREE.PlaneGeometry(0.22, 3.0), mats.roadStripe);
        dash.rotation.x = -Math.PI / 2;
        dash.position.set(rx, 0.05, dz);
        group.add(dash);
      }
    }
  });

  // Zebra Crosswalks at Major Intersections
  ROAD_X_COORDS.forEach((rx) => {
    ROAD_Z_COORDS.forEach((rz) => {
      for (let s = -2.6; s <= 2.6; s += 1.3) {
        const stripeEW = new THREE.Mesh(new THREE.PlaneGeometry(0.55, 2.0), mats.roadStripe);
        stripeEW.rotation.x = -Math.PI / 2;
        stripeEW.position.set(rx + s, 0.052, rz + 5.1);
        group.add(stripeEW);

        const stripeNS = new THREE.Mesh(new THREE.PlaneGeometry(2.0, 0.55), mats.roadStripe);
        stripeNS.rotation.x = -Math.PI / 2;
        stripeNS.position.set(rx + 5.1, 0.052, rz + s);
        group.add(stripeNS);
      }
    });
  });

  // 4. Authentic Historical & Modern Efeler Landmarks
  const landmarks = buildAllLandmarks(LANDMARKS, mats);
  landmarks.forEach((lm) => {
    group.add(lm.group);
    group.add(lm.ringMesh);
    colliders.push(...lm.colliders);
  });

  // 5. Living World Additions: Growing Fig Tree, Pedestrians, Traffic Lights, Ancient Signposts
  const figTree = createLivingFigTree(mats);
  group.add(figTree.group);
  colliders.push({ minX: -2.7, maxX: 2.7, minZ: 19.1, maxZ: 24.5 });

  const pedestrians = createPedestrianSystem();
  group.add(pedestrians.group);

  const trafficLights = createTrafficLightSystem(mats);
  group.add(trafficLights.group);

  const signposts = buildAncientCitiesSignposts(mats, colliders);
  group.add(signposts);

  // Interactive Street Encounters: Zeybek Musicians, Library & Mendil Vendor, Bey Camii Lokma Stand
  const musicians = createStreetMusiciansZeybek(mats);
  group.add(musicians.group);

  const libraryVendor = createLibraryAndVendor(mats, colliders);
  group.add(libraryVendor.group);

  const lokmaStand = createBeyCamiiLokmaStand(mats, colliders);
  group.add(lokmaStand.group);

  // Player's Own House ("Sıcak Yuvam") facing Sevgi Yolu
  const [hx, hz] = PLAYER_HOME_POS;
  const homeGroup = new THREE.Group();
  homeGroup.position.set(hx, 0, hz);

  const hPlinth = new THREE.Mesh(new THREE.BoxGeometry(7.2, 0.4, 6.2), mats.travertine);
  hPlinth.position.y = 0.2;
  hPlinth.receiveShadow = true;
  homeGroup.add(hPlinth);

  const hBody = new THREE.Mesh(new THREE.BoxGeometry(6.4, 4.6, 5.4), mats.creamPlaster);
  hBody.position.y = 2.5;
  hBody.castShadow = true;
  hBody.receiveShadow = true;
  homeGroup.add(hBody);

  const hCumba = new THREE.Mesh(new THREE.BoxGeometry(6.9, 2.0, 5.8), mats.whitePlaster);
  hCumba.position.y = 3.9;
  hCumba.castShadow = true;
  homeGroup.add(hCumba);

  const hRoof = new THREE.Mesh(new THREE.BoxGeometry(7.3, 0.9, 6.3), mats.terracottaRoof);
  hRoof.position.y = 5.35;
  hRoof.castShadow = true;
  homeGroup.add(hRoof);

  const hChimney = new THREE.Mesh(new THREE.BoxGeometry(0.6, 1.1, 0.6), mats.industrialBrick);
  hChimney.position.set(-1.8, 6.0, -1.4);
  homeGroup.add(hChimney);

  // Wooden Porch & Door facing East (+X toward Sevgi Yolu)
  const hPorch = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.26, 3.2), mats.darkTimber);
  hPorch.position.set(3.8, 0.13, 0);
  homeGroup.add(hPorch);

  const hDoor = new THREE.Mesh(new THREE.BoxGeometry(0.14, 2.0, 1.1), mats.darkTimber);
  hDoor.position.set(3.22, 1.2, 0);
  homeGroup.add(hDoor);

  const hLantern = new THREE.Mesh(new THREE.SphereGeometry(0.22, 10, 8), mats.lampBulb);
  hLantern.position.set(3.55, 2.55, 0.85);
  homeGroup.add(hLantern);

  // Cozy Upper Windows on East & South faces
  [-1.3, 1.3].forEach((wz) => {
    const winE = new THREE.Mesh(new THREE.BoxGeometry(0.14, 1.05, 0.95), mats.windowLit);
    winE.position.set(3.48, 3.9, wz);
    homeGroup.add(winE);
  });
  [-1.5, 1.5].forEach((wx) => {
    const winS = new THREE.Mesh(new THREE.BoxGeometry(0.95, 1.05, 0.14), mats.windowLit);
    winS.position.set(wx, 3.9, 2.93);
    homeGroup.add(winS);
  });

  // Potted Olive Tree by the Porch
  const hPot = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.24, 0.45, 8), mats.terracottaRoof);
  hPot.position.set(3.9, 0.45, -1.25);
  const hLeaves = new THREE.Mesh(
    new THREE.IcosahedronGeometry(0.55, 1),
    new THREE.MeshStandardMaterial({ color: 0x677e56, roughness: 0.85 })
  );
  hLeaves.position.set(3.9, 1.15, -1.25);
  homeGroup.add(hPot, hLeaves);

  group.add(homeGroup);
  colliders.push({
    minX: hx - 3.6,
    maxX: hx + 3.6,
    minZ: hz - 3.1,
    maxZ: hz + 3.1,
  });

  const homeRingMesh = new THREE.Mesh(
    new THREE.RingGeometry(1.15, 1.55, 32),
    new THREE.MeshStandardMaterial({
      color: 0x61b88a,
      emissive: 0x4ba877,
      emissiveIntensity: 0.85,
      side: THREE.DoubleSide,
      roughness: 0.4,
    })
  );
  homeRingMesh.rotation.x = -Math.PI / 2;
  homeRingMesh.position.set(PLAYER_HOME_DOOR_POS[0], 0.08, PLAYER_HOME_DOOR_POS[1]);
  group.add(homeRingMesh);

  const interactiveClickables: THREE.Object3D[] = [
    musicians.clickTarget,
    libraryVendor.clickTarget,
    lokmaStand.clickTarget,
  ];

  // 6. Richer Traditional & Modern Aydın Neighborhood Buildings
  const plasterMats = [mats.creamPlaster, mats.whitePlaster, mats.peachPlaster];
  const awningColors = [0xb64b36, 0x3b6e8c, 0x586f4e, 0xc98a3b];
  const awningMats = awningColors.map(
    (c) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.8 })
  );

  const addTownhouse = (
    x: number,
    z: number,
    w: number,
    d: number,
    h: number,
    variant: number
  ) => {
    if (overlapsAny(x, z, w, d, colliders, 2.4)) return;

    const house = new THREE.Group();
    house.position.set(x, 0, z);

    // Stone Plinth Foundation
    const plinth = new THREE.Mesh(new THREE.BoxGeometry(w + 0.25, 0.35, d + 0.25), mats.travertine);
    plinth.position.y = 0.175;
    house.add(plinth);

    const wallMat = plasterMats[variant % plasterMats.length];
    const body = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), wallMat);
    body.position.y = h / 2 + 0.2;
    body.castShadow = true;
    body.receiveShadow = true;
    house.add(body);

    // Traditional Cumba / Upper Balcony
    if (h >= 4.2 && variant % 2 === 0) {
      const cumba = new THREE.Mesh(new THREE.BoxGeometry(w + 0.5, h * 0.44, d + 0.5), wallMat);
      cumba.position.y = h * 0.76 + 0.2;
      cumba.castShadow = true;
      house.add(cumba);
    }

    // Terracotta Pitched Hip Roof + Brick Chimney
    const roof = new THREE.Mesh(new THREE.BoxGeometry(w + 0.75, 0.8, d + 0.75), mats.terracottaRoof);
    roof.position.y = h + 0.55;
    roof.castShadow = true;
    house.add(roof);

    const chimney = new THREE.Mesh(new THREE.BoxGeometry(0.55, 1.0, 0.55), mats.industrialBrick);
    chimney.position.set(w * 0.26, h + 1.1, -d * 0.2);
    house.add(chimney);

    // Warm Windows + Ground Shopfront
    const winW = w * 0.22;
    const winGeo = new THREE.BoxGeometry(winW, 0.95, 0.12);
    [-w * 0.24, w * 0.24].forEach((wx) => {
      const wf = new THREE.Mesh(winGeo, mats.windowLit);
      wf.position.set(wx, h * 0.68 + 0.2, d / 2 + 0.05);
      house.add(wf);

      const wb = new THREE.Mesh(winGeo, mats.windowLit);
      wb.position.set(wx, h * 0.68 + 0.2, -d / 2 - 0.05);
      house.add(wb);
    });

    if (variant % 2 === 1) {
      const shopGlass = new THREE.Mesh(new THREE.BoxGeometry(w * 0.62, 1.45, 0.14), mats.windowLit);
      shopGlass.position.set(0, 1.2, d / 2 + 0.05);
      house.add(shopGlass);
    }

    if (variant % 3 === 0) {
      const awning = new THREE.Mesh(
        new THREE.BoxGeometry(w * 0.82, 0.14, 1.4),
        awningMats[variant % awningMats.length]
      );
      awning.position.set(0, 2.2, d / 2 + 0.65);
      awning.rotation.x = 0.24;
      house.add(awning);
    }

    group.add(house);
    colliders.push({
      minX: x - w / 2,
      maxX: x + w / 2,
      minZ: z - d / 2,
      maxZ: z + d / 2,
    });
  };

  const blockCenters: [number, number, number, number][] = [
    // Block between Yağcılar (-54) and Sevgi Yolu (-18) ([-28, -4] is Player Home, [-28, 28] is Kütüphane!)
    [-42, -3, 6.4, 5.8],
    [-41, -11, 5.6, 5.2],
    [-42, 28, 6.6, 5.8],
    [-42, 37, 6.2, 5.2],
    [-28, 37, 6.0, 5.2],
    // Block between Sevgi Yolu (-18) and Hükümet Blv (+18)
    [-6, -34, 6.4, 5.8],
    [8, -34, 6.4, 5.8],
    [-6, -45, 6.0, 5.2],
    [8, -45, 6.0, 5.2],
    [-7, 34, 6.8, 5.4],
    [7, 34, 6.8, 5.4],
    // Block between Hükümet Blv (+18) and Doğu Blv (+54)
    [43, -46, 6.0, 5.4],
    [32, 39, 6.2, 5.0],
    // Outer Neighborhood Edges
    [70, -34, 6.6, 5.8],
    [70, -6, 6.6, 5.8],
    [-70, -36, 6.4, 5.6],
    [-34, 64, 7.2, 5.8],
    [36, 64, 7.2, 5.8],
  ];

  blockCenters.forEach(([bx, bz, bw, bd], idx) => {
    const h = 4.1 + ((idx * 17) % 4) * 1.15;
    addTownhouse(bx, bz, bw, bd, h, idx);
  });

  // 7. InstancedMesh Foliage — True Arching Boulevard Palms + Olive & Fig Groves + Cypresses
  const dummy = new THREE.Object3D();
  const colorTmp = new THREE.Color();

  // 7a. True Washingtonia Palm Trees along Adnan Menderes Blv., İstasyon Cad., Kent Meydanı, Forum & Tekstil Park
  const palmPositions: [number, number][] = [];
  for (let px = -86; px <= 86; px += 11) {
    if (Math.abs(px) < 17) continue; // Keep Kent Meydanı open
    palmPositions.push([px, 6.2], [px, 17.8]); // Adnan Menderes Blv. Palm Line!
  }
  // İstasyon Caddesi Palm Line
  for (let px = -76; px <= 76; px += 16) {
    if (Math.abs(px - 18) < 7 || Math.abs(px + 18) < 7) continue;
    palmPositions.push([px, 42.2]);
  }
  // Framing Kent Meydanı, Forum Aydın & Tekstil Park
  palmPositions.push(
    [-15.5, 1.5],
    [15.5, 1.5],
    [-15.5, 22.5],
    [15.5, 22.5],
    [60, 22],
    [60, 38],
    [-60, 22],
    [-60, 38]
  );

  const palmTrunkGeo = new THREE.CylinderGeometry(0.16, 0.28, 5.4, 8);
  palmTrunkGeo.translate(0, 2.7, 0);
  const palmTrunkMat = new THREE.MeshStandardMaterial({ color: 0x7c6148, roughness: 0.9 });
  const palmTrunks = new THREE.InstancedMesh(palmTrunkGeo, palmTrunkMat, palmPositions.length);
  palmTrunks.castShadow = true;

  const palmCrownGeo = createPalmCrownGeometry();
  const palmCrownMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.72 });
  const palmCrowns = new THREE.InstancedMesh(palmCrownGeo, palmCrownMat, palmPositions.length);
  palmCrowns.castShadow = true;

  palmPositions.forEach(([x, z], i) => {
    const s = 0.92 + ((i * 19) % 24) * 0.01;
    dummy.position.set(x, 0, z);
    dummy.rotation.set(0, (i * 1.1) % (Math.PI * 2), 0);
    dummy.scale.set(s, s, s);
    dummy.updateMatrix();
    palmTrunks.setMatrixAt(i, dummy.matrix);
    palmCrowns.setMatrixAt(i, dummy.matrix);
    colorTmp.setHex(i % 2 === 0 ? 0x558444 : 0x67934d);
    palmCrowns.setColorAt(i, colorTmp);
  });
  palmTrunks.instanceMatrix.needsUpdate = true;
  palmCrowns.instanceMatrix.needsUpdate = true;
  if (palmCrowns.instanceColor) palmCrowns.instanceColor.needsUpdate = true;
  palmTrunks.computeBoundingSphere();
  palmCrowns.computeBoundingSphere();
  group.add(palmTrunks, palmCrowns);

  // 7b. Olive & Fig Orchards (Zeytin & İncir Ağaçları) + Tekstil Park Trees
  const olivePositions: [number, number][] = [];
  for (let ox = -92; ox <= 92; ox += 11) {
    for (let oz = -98; oz <= -66; oz += 11) {
      if (Math.abs(ox) < 16 && oz > -88 && oz < -66) continue;
      if (!overlapsAny(ox, oz, 2.5, 2.5, colliders, 1.5)) {
        olivePositions.push([ox + ((oz * 7) % 3), oz + ((ox * 5) % 3)]);
      }
    }
  }
  for (let oz = -45; oz <= 65; oz += 15) {
    olivePositions.push([-94, oz], [94, oz - 4]);
  }
  // Sevgi Yolu shady trees
  for (let oz = -14; oz <= 42; oz += 11) {
    if (Math.abs(oz - 12) > 8) {
      olivePositions.push([-23.5, oz], [-12.5, oz]);
    }
  }
  // Tekstil Park lawn shade trees
  olivePositions.push([-83, 38], [-76, 39], [-84, 22]);

  const oliveTrunkGeo = new THREE.CylinderGeometry(0.18, 0.26, 2.2, 7);
  oliveTrunkGeo.translate(0, 1.1, 0);
  const oliveTrunkMat = new THREE.MeshStandardMaterial({ color: 0x654c38, roughness: 0.92 });
  const oliveTrunks = new THREE.InstancedMesh(oliveTrunkGeo, oliveTrunkMat, olivePositions.length);
  oliveTrunks.castShadow = true;

  const oliveCrownGeo = new THREE.IcosahedronGeometry(1.75, 1);
  oliveCrownGeo.scale(1.15, 0.82, 1.15);
  oliveCrownGeo.translate(0, 2.9, 0);
  const oliveCrownMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.82 });
  const oliveCrowns = new THREE.InstancedMesh(oliveCrownGeo, oliveCrownMat, olivePositions.length);
  oliveCrowns.castShadow = true;

  olivePositions.forEach(([x, z], i) => {
    const s = 0.85 + ((i * 23) % 30) * 0.01;
    dummy.position.set(x, 0, z);
    dummy.rotation.set(0, (i * 0.9) % (Math.PI * 2), 0);
    dummy.scale.set(s, s, s);
    dummy.updateMatrix();
    oliveTrunks.setMatrixAt(i, dummy.matrix);
    oliveCrowns.setMatrixAt(i, dummy.matrix);
    colorTmp.setHex(i % 3 === 0 ? 0x677e56 : i % 3 === 1 ? 0x778d66 : 0x577445);
    oliveCrowns.setColorAt(i, colorTmp);
  });
  oliveTrunks.instanceMatrix.needsUpdate = true;
  oliveCrowns.instanceMatrix.needsUpdate = true;
  if (oliveCrowns.instanceColor) oliveCrowns.instanceColor.needsUpdate = true;
  oliveTrunks.computeBoundingSphere();
  oliveCrowns.computeBoundingSphere();
  group.add(oliveTrunks, oliveCrowns);

  // 7c. Mediterranean Cypresses (Selvi)
  const cypressCoords: [number, number][] = [
    [-12, -76],
    [12, -76],
    [27, -42],
    [45, -42],
    [-45, -42],
    [-81, -14],
    [48, -12],
  ];
  const cypGeo = new THREE.ConeGeometry(0.85, 6.2, 8);
  cypGeo.translate(0, 3.4, 0);
  const cypMat = new THREE.MeshStandardMaterial({ color: 0x3b593c, roughness: 0.86 });
  const cypInst = new THREE.InstancedMesh(cypGeo, cypMat, cypressCoords.length);
  cypInst.castShadow = true;
  cypressCoords.forEach(([x, z], i) => {
    dummy.position.set(x, 0, z);
    dummy.rotation.set(0, 0, 0);
    dummy.scale.setScalar(0.95 + (i % 3) * 0.12);
    dummy.updateMatrix();
    cypInst.setMatrixAt(i, dummy.matrix);
  });
  cypInst.instanceMatrix.needsUpdate = true;
  cypInst.computeBoundingSphere();
  group.add(cypInst);

  // 7d. Street Lamps along Boulevards
  const lampCoords: [number, number][] = [];
  ROAD_Z_COORDS.forEach((rz) => {
    for (let lx = -72; lx <= 72; lx += 24) {
      if (Math.abs(lx) < 16 && rz === 12) continue;
      lampCoords.push([lx, rz - 5.1]);
    }
  });
  const poleGeo = new THREE.CylinderGeometry(0.08, 0.11, 4.0, 8);
  poleGeo.translate(0, 2.0, 0);
  const poleInst = new THREE.InstancedMesh(poleGeo, mats.wroughtIron, lampCoords.length);

  const bulbGeo = new THREE.SphereGeometry(0.24, 10, 8);
  bulbGeo.translate(0, 4.1, 0);
  const bulbInst = new THREE.InstancedMesh(bulbGeo, mats.lampBulb, lampCoords.length);

  lampCoords.forEach(([x, z], i) => {
    dummy.position.set(x, 0, z);
    dummy.rotation.set(0, 0, 0);
    dummy.scale.set(1, 1, 1);
    dummy.updateMatrix();
    poleInst.setMatrixAt(i, dummy.matrix);
    bulbInst.setMatrixAt(i, dummy.matrix);
  });
  poleInst.instanceMatrix.needsUpdate = true;
  bulbInst.instanceMatrix.needsUpdate = true;
  poleInst.computeBoundingSphere();
  bulbInst.computeBoundingSphere();
  group.add(poleInst, bulbInst);

  return {
    group,
    landmarks,
    colliders,
    figTree,
    pedestrians,
    trafficLights,
    musicians,
    libraryVendor,
    lokmaStand,
    homeRingMesh,
    interactiveClickables,
    dispose: () => {
      group.traverse((obj) => {
        if ((obj as THREE.Mesh).isMesh) {
          (obj as THREE.Mesh).geometry.dispose();
        }
      });
    },
  };
}
