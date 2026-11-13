import * as THREE from 'three';
import { ColliderBox, LandmarkDef } from '../types/game';
import { CityMaterialLibrary } from './materials';
import { createGableRoofGeometry, createHipRoofGeometry } from './roofGeometry';
import { getTerrainHeightAt, getWalkableSurfaceHeightAt } from './terrain';

export interface BuiltLandmark {
  def: LandmarkDef;
  group: THREE.Group;
  ringMesh: THREE.Mesh;
  colliders: ColliderBox[];
}

function addBoxCollider(
  list: ColliderBox[],
  cx: number,
  cz: number,
  w: number,
  d: number,
  topH?: number
) {
  list.push({
    minX: cx - w / 2,
    maxX: cx + w / 2,
    minZ: cz - d / 2,
    maxZ: cz + d / 2,
    maxY: topH !== undefined ? getTerrainHeightAt(cx, cz) + topH : undefined,
  });
}

function makeDiscoveryRing(x: number, z: number): THREE.Mesh {
  const geo = new THREE.RingGeometry(1.6, 2.05, 32);
  geo.rotateX(-Math.PI / 2);
  const mat = new THREE.MeshStandardMaterial({
    color: 0xe3a84f,
    emissive: new THREE.Color(0xe3a84f),
    emissiveIntensity: 0.65,
    roughness: 0.3,
    side: THREE.DoubleSide,
    polygonOffset: true,
    polygonOffsetFactor: -3,
  });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.set(x, getWalkableSurfaceHeightAt(x, z) + 0.08, z);
  return mesh;
}

/**
 * 1. Tralleis Antik Kenti — Üç Gözler (Roman Gymnasium Triple Arch)
 */
function buildTralleis(def: LandmarkDef, mats: CityMaterialLibrary): BuiltLandmark {
  const group = new THREE.Group();
  const [lx, , lz] = def.position;
  group.position.set(lx, 0, lz);

  const skirt = new THREE.Mesh(new THREE.BoxGeometry(17.4, 3.2, 9.4), mats.travertine);
  skirt.position.y = -1.55;
  skirt.receiveShadow = true;
  group.add(skirt);

  const base1 = new THREE.Mesh(new THREE.BoxGeometry(17, 0.6, 9), mats.travertine);
  base1.position.y = 0.3;
  base1.receiveShadow = true;
  base1.castShadow = true;
  group.add(base1);

  const base2 = new THREE.Mesh(new THREE.BoxGeometry(15.2, 0.5, 7.2), mats.travertine);
  base2.position.y = 0.85;
  base2.receiveShadow = true;
  group.add(base2);

  const wallW = 13.6;
  const wallH = 7.4;
  const shape = new THREE.Shape();
  shape.moveTo(-wallW / 2, 0);
  shape.lineTo(wallW / 2, 0);
  shape.lineTo(wallW / 2, wallH);
  shape.lineTo(-wallW / 2, wallH);
  shape.closePath();

  const archCenters = [-3.9, 0, 3.9];
  const archR = 1.25;
  const archSpringY = 3.4;

  archCenters.forEach((ax) => {
    const hole = new THREE.Path();
    hole.moveTo(ax - archR, 0);
    hole.lineTo(ax - archR, archSpringY);
    hole.absarc(ax, archSpringY, archR, Math.PI, 0, true);
    hole.lineTo(ax + archR, 0);
    hole.closePath();
    shape.holes.push(hole);
  });

  const archGeo = new THREE.ExtrudeGeometry(shape, {
    depth: 1.7,
    bevelEnabled: true,
    bevelThickness: 0.08,
    bevelSize: 0.06,
    bevelSegments: 2,
  });
  archGeo.translate(0, 0, -0.85);
  const archWall = new THREE.Mesh(archGeo, mats.travertine);
  archWall.position.y = 1.1;
  archWall.castShadow = true;
  archWall.receiveShadow = true;
  group.add(archWall);

  const cornice = new THREE.Mesh(new THREE.BoxGeometry(14.3, 0.55, 2.2), mats.travertine);
  cornice.position.y = 8.65;
  cornice.castShadow = true;
  group.add(cornice);

  const atticLeft = new THREE.Mesh(new THREE.BoxGeometry(4.8, 0.9, 1.5), mats.travertine);
  atticLeft.position.set(-3.4, 9.3, 0);
  atticLeft.castShadow = true;
  group.add(atticLeft);

  const atticRight = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.65, 1.5), mats.travertine);
  atticRight.position.set(3.8, 9.2, 0);
  atticRight.castShadow = true;
  group.add(atticRight);

  [-6.1, -1.95, 1.95, 6.1].forEach((px) => {
    const pilaster = new THREE.Mesh(new THREE.BoxGeometry(0.65, 7.2, 2.05), mats.creamPlaster);
    pilaster.position.set(px, 4.7, 0);
    pilaster.castShadow = true;
    group.add(pilaster);
  });

  [-6.4, 6.4].forEach((cx, idx) => {
    const colH = idx === 0 ? 4.4 : 3.2;
    const col = new THREE.Mesh(
      new THREE.CylinderGeometry(0.36, 0.42, colH, 12),
      mats.creamPlaster
    );
    col.position.set(cx, 1.1 + colH / 2, 2.4);
    col.castShadow = true;
    group.add(col);
  });

  const ringMesh = makeDiscoveryRing(lx, lz + 9.5);
  const colliders: ColliderBox[] = [];
  addBoxCollider(colliders, lx, lz, 17, 9, 9.2);

  return { def, group, ringMesh, colliders };
}

/**
 * 2. Bey Camii (Süleyman Bey Camii, 1683)
 */
function buildBeyCamii(def: LandmarkDef, mats: CityMaterialLibrary): BuiltLandmark {
  const group = new THREE.Group();
  const [lx, , lz] = def.position;
  group.position.set(lx, 0, lz);

  const plinth = new THREE.Mesh(new THREE.BoxGeometry(13.5, 0.4, 14.5), mats.travertine);
  plinth.position.y = 0.2;
  plinth.receiveShadow = true;
  group.add(plinth);

  const hall = new THREE.Mesh(new THREE.BoxGeometry(8.6, 5.4, 8.6), mats.travertine);
  hall.position.set(0, 3.1, -1.2);
  hall.castShadow = true;
  hall.receiveShadow = true;
  group.add(hall);

  [-4.35, 4.35].forEach((wx) => {
    [-2.4, 0].forEach((wz) => {
      const win = new THREE.Mesh(new THREE.BoxGeometry(0.15, 2.0, 1.1), mats.windowLit);
      win.position.set(wx, 3.0, wz);
      group.add(win);
    });
  });

  const drum = new THREE.Mesh(new THREE.CylinderGeometry(3.55, 3.75, 1.5, 8), mats.travertine);
  drum.position.set(0, 6.5, -1.2);
  drum.castShadow = true;
  group.add(drum);

  const dome = new THREE.Mesh(
    new THREE.SphereGeometry(3.45, 24, 16, 0, Math.PI * 2, 0, Math.PI * 0.52),
    mats.leadDome
  );
  dome.position.set(0, 7.15, -1.2);
  dome.castShadow = true;
  group.add(dome);

  const alemStem = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.08, 1.1, 8), mats.brass);
  alemStem.position.set(0, 10.9, -1.2);
  group.add(alemStem);

  [-3.4, -1.15, 1.15, 3.4].forEach((cx) => {
    const col = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.25, 3.8, 10), mats.creamPlaster);
    col.position.set(cx, 2.3, 4.8);
    col.castShadow = true;
    group.add(col);
  });
  const porticoRoof = new THREE.Mesh(new THREE.BoxGeometry(7.8, 0.4, 2.4), mats.travertine);
  porticoRoof.position.set(0, 4.35, 4.1);
  porticoRoof.castShadow = true;
  group.add(porticoRoof);

  [-2.3, 0, 2.3].forEach((dx) => {
    const smDome = new THREE.Mesh(
      new THREE.SphereGeometry(1.05, 14, 10, 0, Math.PI * 2, 0, Math.PI * 0.5),
      mats.leadDome
    );
    smDome.position.set(dx, 4.55, 4.1);
    smDome.castShadow = true;
    group.add(smDome);
  });

  const minBase = new THREE.Mesh(new THREE.BoxGeometry(1.8, 4.6, 1.8), mats.travertine);
  minBase.position.set(-4.8, 2.7, 2.6);
  minBase.castShadow = true;
  group.add(minBase);

  const minShaft = new THREE.Mesh(new THREE.CylinderGeometry(0.62, 0.72, 8.2, 12), mats.travertine);
  minShaft.position.set(-4.8, 8.9, 2.6);
  minShaft.castShadow = true;
  group.add(minShaft);

  const serefe = new THREE.Mesh(new THREE.CylinderGeometry(1.05, 0.85, 0.48, 12), mats.creamPlaster);
  serefe.position.set(-4.8, 12.2, 2.6);
  group.add(serefe);

  const minUpper = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.54, 2.4, 12), mats.travertine);
  minUpper.position.set(-4.8, 13.6, 2.6);
  group.add(minUpper);

  const spire = new THREE.Mesh(new THREE.ConeGeometry(0.58, 3.0, 12), mats.leadDome);
  spire.position.set(-4.8, 16.3, 2.6);
  spire.castShadow = true;
  group.add(spire);

  const ringMesh = makeDiscoveryRing(lx - 10.5, lz + 4);
  const colliders: ColliderBox[] = [];
  addBoxCollider(colliders, lx, lz, 13.5, 14.5, 9.5);

  return { def, group, ringMesh, colliders };
}

/**
 * 3. Nasuh Paşa Külliyesi & Zincirli Han (1708)
 */
function buildNasuhPasa(def: LandmarkDef, mats: CityMaterialLibrary): BuiltLandmark {
  const group = new THREE.Group();
  const [lx, , lz] = def.position;
  group.position.set(lx, 0, lz);

  const yard = new THREE.Mesh(new THREE.BoxGeometry(17.5, 0.25, 15.5), mats.plaza);
  yard.position.y = 0.125;
  yard.receiveShadow = true;
  group.add(yard);

  const addWing = (x: number, z: number, w: number, d: number, h = 5.4) => {
    const wall = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mats.almasik);
    wall.position.set(x, h / 2 + 0.2, z);
    wall.castShadow = true;
    wall.receiveShadow = true;
    group.add(wall);

    const eave = new THREE.Mesh(new THREE.BoxGeometry(w + 0.55, 0.16, d + 0.55), mats.darkTimber);
    eave.position.set(x, h + 0.25, z);
    group.add(eave);

    const roof = new THREE.Mesh(
      createHipRoofGeometry(w + 0.6, d + 0.6, 1.35),
      mats.terracottaRoof
    );
    roof.position.set(x, h + 0.32, z);
    roof.castShadow = true;
    group.add(roof);
  };

  addWing(0, -6.2, 17.2, 3.0);
  addWing(0, 6.2, 17.2, 3.0);
  addWing(7.1, 0, 3.0, 9.6);
  addWing(-7.1, -3.2, 3.0, 4.0);
  addWing(-7.1, 3.2, 3.0, 4.0);

  const gateTop = new THREE.Mesh(new THREE.BoxGeometry(3.2, 2.5, 2.8), mats.travertine);
  gateTop.position.set(-7.1, 4.6, 0);
  gateTop.castShadow = true;
  group.add(gateTop);

  for (let x = -4.5; x <= 4.5; x += 2.25) {
    [-4.1, 4.1].forEach((z) => {
      const col = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.18, 3.0, 8), mats.creamPlaster);
      col.position.set(x, 1.7, z);
      group.add(col);
    });
  }

  const basin = new THREE.Mesh(new THREE.CylinderGeometry(2.1, 2.25, 0.75, 8), mats.travertine);
  basin.position.set(0, 0.6, 0);
  basin.castShadow = true;
  group.add(basin);

  const poolWater = new THREE.Mesh(new THREE.CylinderGeometry(1.75, 1.75, 0.15, 8), mats.water);
  poolWater.position.set(0, 0.96, 0);
  group.add(poolWater);

  for (let i = 0; i < 6; i++) {
    const a = (i * Math.PI * 2) / 6;
    const col = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.12, 2.1, 8), mats.creamPlaster);
    col.position.set(Math.cos(a) * 1.65, 2.0, Math.sin(a) * 1.65);
    group.add(col);
  }

  const sadirvanDome = new THREE.Mesh(new THREE.ConeGeometry(2.2, 1.4, 8), mats.leadDome);
  sadirvanDome.position.set(0, 3.7, 0);
  sadirvanDome.castShadow = true;
  group.add(sadirvanDome);

  const ringMesh = makeDiscoveryRing(lx - 11.8, lz);
  const colliders: ColliderBox[] = [];
  addBoxCollider(colliders, lx, lz, 17.5, 15.5, 6.8);

  return { def, group, ringMesh, colliders };
}

/**
 * 4. Ramazan Paşa Camii & Tarihi Çarşı (1595)
 */
function buildRamazanPasa(def: LandmarkDef, mats: CityMaterialLibrary): BuiltLandmark {
  const group = new THREE.Group();
  const [lx, , lz] = def.position;
  group.position.set(lx, 0, lz);

  const base = new THREE.Mesh(new THREE.BoxGeometry(14, 0.35, 13), mats.cobble);
  base.position.y = 0.175;
  base.receiveShadow = true;
  group.add(base);

  const hall = new THREE.Mesh(new THREE.BoxGeometry(7.2, 4.6, 7.2), mats.almasik);
  hall.position.set(-1.5, 2.65, -1.2);
  hall.castShadow = true;
  group.add(hall);

  const dome = new THREE.Mesh(
    new THREE.SphereGeometry(3.0, 20, 14, 0, Math.PI * 2, 0, Math.PI * 0.52),
    mats.leadDome
  );
  dome.position.set(-1.5, 4.95, -1.2);
  dome.castShadow = true;
  group.add(dome);

  const minShaft = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.62, 10.5, 10), mats.travertine);
  minShaft.position.set(-5.6, 5.5, 1.8);
  minShaft.castShadow = true;
  group.add(minShaft);

  const minSpire = new THREE.Mesh(new THREE.ConeGeometry(0.52, 2.3, 10), mats.leadDome);
  minSpire.position.set(-5.6, 11.8, 1.8);
  group.add(minSpire);

  const shop = new THREE.Mesh(new THREE.BoxGeometry(4.2, 4.2, 6.4), mats.creamPlaster);
  shop.position.set(4.5, 2.4, -0.5);
  shop.castShadow = true;
  group.add(shop);

  const cumba = new THREE.Mesh(new THREE.BoxGeometry(4.5, 2.1, 2.8), mats.whitePlaster);
  cumba.position.set(4.5, 3.6, 2.9);
  cumba.castShadow = true;
  group.add(cumba);

  const shopRoof = new THREE.Mesh(new THREE.ConeGeometry(3.8, 1.8, 4), mats.terracottaRoof);
  shopRoof.rotation.y = Math.PI / 4;
  shopRoof.position.set(4.5, 5.4, 0.4);
  shopRoof.castShadow = true;
  group.add(shopRoof);

  const awningMat = new THREE.MeshStandardMaterial({ color: 0xb64b36, roughness: 0.75 });
  const awning = new THREE.Mesh(new THREE.BoxGeometry(4.2, 0.14, 1.8), awningMat);
  awning.position.set(4.5, 2.2, 3.4);
  awning.rotation.x = 0.25;
  group.add(awning);

  const ringMesh = makeDiscoveryRing(lx, lz + 9.2);
  const colliders: ColliderBox[] = [];
  addBoxCollider(colliders, lx, lz, 14, 13, 6.4);

  return { def, group, ringMesh, colliders };
}

/**
 * 5. Cihanoğlu Külliyesi & Kulesi (1756)
 */
function buildCihanoglu(def: LandmarkDef, mats: CityMaterialLibrary): BuiltLandmark {
  const group = new THREE.Group();
  const [lx, , lz] = def.position;
  group.position.set(lx, 0, lz);

  const plinth = new THREE.Mesh(new THREE.BoxGeometry(15, 0.4, 15), mats.travertine);
  plinth.position.y = 0.2;
  plinth.receiveShadow = true;
  group.add(plinth);

  const mosque = new THREE.Mesh(new THREE.BoxGeometry(7.0, 5.2, 7.0), mats.creamPlaster);
  mosque.position.set(-2.5, 3.0, -2.2);
  mosque.castShadow = true;
  group.add(mosque);

  const dome = new THREE.Mesh(
    new THREE.SphereGeometry(2.9, 18, 12, 0, Math.PI * 2, 0, Math.PI * 0.52),
    mats.leadDome
  );
  dome.position.set(-2.5, 5.6, -2.2);
  dome.castShadow = true;
  group.add(dome);

  const medrese = new THREE.Mesh(new THREE.BoxGeometry(11.5, 3.6, 3.4), mats.almasik);
  medrese.position.set(0.5, 2.2, 4.6);
  medrese.castShadow = true;
  group.add(medrese);

  const medRoof = new THREE.Mesh(
    createHipRoofGeometry(12.2, 4.1, 1.35),
    mats.terracottaRoof
  );
  medRoof.position.set(0.5, 4.0, 4.6);
  medRoof.castShadow = true;
  group.add(medRoof);

  const tower = new THREE.Mesh(new THREE.BoxGeometry(3.4, 11.2, 3.4), mats.travertine);
  tower.position.set(4.8, 6.0, -3.5);
  tower.castShadow = true;
  group.add(tower);

  const towerCrown = new THREE.Mesh(new THREE.BoxGeometry(4.0, 0.9, 4.0), mats.almasik);
  towerCrown.position.set(4.8, 11.8, -3.5);
  towerCrown.castShadow = true;
  group.add(towerCrown);

  const towerRoof = new THREE.Mesh(new THREE.ConeGeometry(2.9, 1.8, 4), mats.terracottaRoof);
  towerRoof.rotation.y = Math.PI / 4;
  towerRoof.position.set(4.8, 13.1, -3.5);
  group.add(towerRoof);

  const ringMesh = makeDiscoveryRing(lx + 11.2, lz + 1.5);
  const colliders: ColliderBox[] = [];
  addBoxCollider(colliders, lx, lz, 15, 15, 7.2);

  return { def, group, ringMesh, colliders };
}

/**
 * 6. Atatürk Kent Meydanı & Efeler Anıtı (Wide Lively Plaza)
 */
function buildKentMeydani(def: LandmarkDef, mats: CityMaterialLibrary): BuiltLandmark {
  const group = new THREE.Group();
  const [lx, , lz] = def.position;
  group.position.set(lx, 0, lz);

  // Expansive Circular Plaza Floor (Wide & Spacious for Crowds + Living Fig Tree)
  const plazaDisc = new THREE.Mesh(new THREE.CylinderGeometry(15.6, 16.0, 0.24, 48), mats.plaza);
  plazaDisc.position.y = 0.12;
  plazaDisc.receiveShadow = true;
  group.add(plazaDisc);

  // Outer Stone Curb Ring
  const curbRing = new THREE.Mesh(
    new THREE.RingGeometry(15.2, 16.0, 48),
    mats.travertine
  );
  curbRing.rotation.x = -Math.PI / 2;
  curbRing.position.y = 0.25;
  group.add(curbRing);

  // Central Garden Lawn Ring + Sandy Park Paths (Storybook Park Look)
  const parkRingMat = new THREE.MeshStandardMaterial({ color: 0x8ea354, roughness: 0.92 });
  const parkLawnRing = new THREE.Mesh(
    new THREE.RingGeometry(5.6, 13.8, 40),
    parkRingMat
  );
  parkLawnRing.rotation.x = -Math.PI / 2;
  parkLawnRing.position.y = 0.255;
  parkLawnRing.receiveShadow = true;
  group.add(parkLawnRing);

  // Diagonal Warm Sandstone / Dirt Park Cross Paths
  [Math.PI * 0.25, -Math.PI * 0.25].forEach((ang) => {
    const pathStrip = new THREE.Mesh(new THREE.BoxGeometry(27.5, 0.04, 2.2), mats.dirtPath);
    pathStrip.position.y = 0.265;
    pathStrip.rotation.y = ang;
    pathStrip.receiveShadow = true;
    group.add(pathStrip);
  });

  // Reflecting Pools (West & East wings of the plaza) with Fountain Spouts
  [-9.5, 9.5].forEach((px) => {
    const rim = new THREE.Mesh(new THREE.BoxGeometry(4.0, 0.35, 7.6), mats.travertine);
    rim.position.set(px, 0.28, -1.0);
    rim.castShadow = true;
    group.add(rim);

    const pool = new THREE.Mesh(new THREE.BoxGeometry(3.4, 0.12, 7.0), mats.water);
    pool.position.set(px, 0.44, -1.0);
    group.add(pool);

    // Ornate Fountain Bowl
    const spoutPedestal = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.44, 0.75, 10), mats.travertine);
    spoutPedestal.position.set(px, 0.65, -1.0);
    const bowl = new THREE.Mesh(new THREE.CylinderGeometry(0.95, 0.4, 0.25, 12), mats.travertine);
    bowl.position.set(px, 1.05, -1.0);
    const waterJet = new THREE.Mesh(
      new THREE.CylinderGeometry(0.08, 0.24, 0.65, 8),
      new THREE.MeshStandardMaterial({ color: 0xd9f4fa, transparent: true, opacity: 0.72, roughness: 0.1 })
    );
    waterJet.position.set(px, 1.42, -1.0);
    group.add(spoutPedestal, bowl, waterJet);
  });

  // Cozy Wooden Octagonal Gazebo / Shade Pergola at Northern Plaza Edge
  const gazebo = new THREE.Group();
  gazebo.position.set(-7.5, 0.24, -10.8);
  const gBase = new THREE.Mesh(new THREE.CylinderGeometry(2.2, 2.4, 0.22, 8), mats.travertine);
  gBase.position.y = 0.11;
  gazebo.add(gBase);
  for (let i = 0; i < 6; i++) {
    const a = (i * Math.PI * 2) / 6;
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.09, 2.1, 6), mats.darkTimber);
    post.position.set(Math.cos(a) * 1.75, 1.15, Math.sin(a) * 1.75);
    post.castShadow = true;
    gazebo.add(post);
  }
  const gRoof = new THREE.Mesh(new THREE.ConeGeometry(2.55, 1.25, 8), mats.terracottaRoof);
  gRoof.position.y = 2.75;
  gRoof.castShadow = true;
  gazebo.add(gRoof);
  group.add(gazebo);

  // Wooden Shade Benches & Flower Beds
  [7.5].forEach((bx) => {
    const bench = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.45, 0.9), mats.darkTimber);
    bench.position.set(bx, 0.46, -10.5);
    bench.castShadow = true;
    group.add(bench);
  });
  const shrubMat = new THREE.MeshStandardMaterial({ color: 0x5d8542, roughness: 0.85 });
  const bloomMat = new THREE.MeshStandardMaterial({ color: 0xd96857, roughness: 0.78 });
  [
    [-11.8, -6.8],
    [11.8, -6.8],
    [-11.8, 5.2],
    [11.8, 5.2],
  ].forEach(([fx, fz]) => {
    const bush = new THREE.Mesh(new THREE.IcosahedronGeometry(0.75, 1), shrubMat);
    bush.scale.set(1.3, 0.75, 1.3);
    bush.position.set(fx, 0.55, fz);
    bush.castShadow = true;
    const flower = new THREE.Mesh(new THREE.IcosahedronGeometry(0.32, 1), bloomMat);
    flower.position.set(fx + 0.3, 0.85, fz - 0.2);
    group.add(bush, flower);
  });

  // Central Stepped Monument Plinth (shifted slightly north to z=-2 so Fig Tree shines at z=+9.5)
  const step1 = new THREE.Mesh(new THREE.CylinderGeometry(3.8, 4.1, 0.45, 16), mats.travertine);
  step1.position.set(0, 0.45, -2.5);
  group.add(step1);

  const pedestal = new THREE.Mesh(new THREE.BoxGeometry(2.8, 2.8, 2.8), mats.whitePlaster);
  pedestal.position.set(0, 2.05, -2.5);
  pedestal.castShadow = true;
  group.add(pedestal);

  const bronzeMat = new THREE.MeshStandardMaterial({
    color: 0x5d4b37,
    roughness: 0.32,
    metalness: 0.78,
  });

  const mainFigure = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.56, 2.6, 10), bronzeMat);
  mainFigure.position.set(0, 4.7, -2.5);
  mainFigure.castShadow = true;
  group.add(mainFigure);

  const head = new THREE.Mesh(new THREE.SphereGeometry(0.32, 12, 10), bronzeMat);
  head.position.set(0, 6.25, -2.5);
  group.add(head);

  [-1.05, 1.05].forEach((fx) => {
    const fig = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.38, 1.85, 8), bronzeMat);
    fig.position.set(fx, 4.3, -2.15);
    fig.castShadow = true;
    group.add(fig);
  });

  const plaque = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.85, 0.12), mats.brass);
  plaque.position.set(0, 2.1, -1.06);
  group.add(plaque);

  const ringMesh = makeDiscoveryRing(lx, lz + 15.2);
  const colliders: ColliderBox[] = [];
  addBoxCollider(colliders, lx, lz - 2.5, 7.6, 7.6, 6.6);
  addBoxCollider(colliders, lx - 9.5, lz - 1.0, 4.0, 7.6, 0.55);
  addBoxCollider(colliders, lx + 9.5, lz - 1.0, 4.0, 7.6, 0.55);

  return { def, group, ringMesh, colliders };
}

/**
 * 7. Tarihi Sarı Belediye Binası (Aydın'ın Simge Sarı Belediye Binası)
 */
function buildSariBelediye(def: LandmarkDef, mats: CityMaterialLibrary): BuiltLandmark {
  const group = new THREE.Group();
  const [lx, , lz] = def.position;
  group.position.set(lx, 0, lz);

  // Travertine Front Courtyard & Steps
  const terrace = new THREE.Mesh(new THREE.BoxGeometry(16, 0.45, 14), mats.plaza);
  terrace.position.y = 0.225;
  terrace.receiveShadow = true;
  group.add(terrace);

  // Main Mustard-Yellow Two-Story Building
  const mainBody = new THREE.Mesh(new THREE.BoxGeometry(11.6, 6.4, 9.8), mats.mustardYellow);
  mainBody.position.set(0.8, 3.65, 0);
  mainBody.castShadow = true;
  mainBody.receiveShadow = true;
  group.add(mainBody);

  // Cream Corner Pilasters & Horizontal Cornice Band
  const belt = new THREE.Mesh(new THREE.BoxGeometry(12.0, 0.3, 10.2), mats.creamPlaster);
  belt.position.set(0.8, 3.6, 0);
  group.add(belt);

  const topCornice = new THREE.Mesh(new THREE.BoxGeometry(12.2, 0.4, 10.4), mats.creamPlaster);
  topCornice.position.set(0.8, 6.95, 0);
  group.add(topCornice);

  // Symmetrical Pitched Terracotta Hip Roof with Timber Eave
  const eaveBand = new THREE.Mesh(new THREE.BoxGeometry(12.6, 0.18, 10.8), mats.darkTimber);
  eaveBand.position.set(0.8, 7.22, 0);
  group.add(eaveBand);

  const roof = new THREE.Mesh(
    createHipRoofGeometry(12.8, 11.0, 2.55),
    mats.terracottaRoof
  );
  roof.position.set(0.8, 7.3, 0);
  roof.castShadow = true;
  group.add(roof);

  const belediyeRidge = new THREE.Mesh(new THREE.BoxGeometry(5.8, 0.22, 0.24), mats.terracottaRidge);
  belediyeRidge.position.set(0.8, 9.88, 0);
  group.add(belediyeRidge);

  // Western Entrance Portico facing Hükümet Bulvarı (-X)
  const porticoRoof = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.4, 4.8), mats.creamPlaster);
  porticoRoof.position.set(-6.0, 3.6, 0);
  porticoRoof.castShadow = true;
  group.add(porticoRoof);

  [-1.9, -0.7, 0.7, 1.9].forEach((pz) => {
    const col = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.22, 3.2, 10), mats.whitePlaster);
    col.position.set(-6.8, 2.0, pz);
    col.castShadow = true;
    group.add(col);
  });

  // Balcony & Triangular Municipal Pediment with Clock
  const pediment = new THREE.Mesh(new THREE.ConeGeometry(2.5, 1.8, 4), mats.mustardYellow);
  pediment.rotation.y = Math.PI / 4;
  pediment.position.set(-5.0, 7.6, 0);
  group.add(pediment);

  const clock = new THREE.Mesh(new THREE.CylinderGeometry(0.52, 0.52, 0.18, 16), mats.brass);
  clock.rotation.z = Math.PI / 2;
  clock.position.set(-5.2, 6.2, 0);
  group.add(clock);

  // Tall Arched Windows on West, North & South Facades
  [-3.2, -1.6, 1.6, 3.2].forEach((wz) => {
    [2.1, 5.1].forEach((wy) => {
      const win = new THREE.Mesh(new THREE.BoxGeometry(0.14, 1.65, 0.95), mats.windowLit);
      win.position.set(-5.02, wy, wz);
      group.add(win);
    });
  });

  // Dark Timber Entrance Door
  const door = new THREE.Mesh(new THREE.BoxGeometry(0.2, 2.4, 1.6), mats.darkTimber);
  door.position.set(-5.02, 1.65, 0);
  group.add(door);

  const ringMesh = makeDiscoveryRing(lx - 10.5, lz);
  const colliders: ColliderBox[] = [];
  addBoxCollider(colliders, lx + 0.5, lz, 14, 12, 9.6);

  return { def, group, ringMesh, colliders };
}

/**
 * 8. Tekstil Park (Tarihi Sümerbank Tekstil Fabrikası & Parkı)
 */
function buildTekstilPark(def: LandmarkDef, mats: CityMaterialLibrary): BuiltLandmark {
  const group = new THREE.Group();
  const [lx, , lz] = def.position;
  group.position.set(lx, 0, lz);

  // Lush Green Park Base & Stone Walkways
  const lawnMat = new THREE.MeshStandardMaterial({ color: 0x6b8c4e, roughness: 0.92 });
  const lawn = new THREE.Mesh(new THREE.BoxGeometry(26, 0.18, 24), lawnMat);
  lawn.position.y = 0.09;
  lawn.receiveShadow = true;
  group.add(lawn);

  const path = new THREE.Mesh(new THREE.BoxGeometry(24, 0.22, 3.2), mats.plaza);
  path.position.set(0, 0.12, 4.5);
  path.receiveShadow = true;
  group.add(path);

  // Iconic Red-Brick Sawtooth Textile Weaving Hall
  const hall = new THREE.Mesh(new THREE.BoxGeometry(15.5, 4.4, 9.2), mats.industrialBrick);
  hall.position.set(-1.5, 2.35, -3.5);
  hall.castShadow = true;
  hall.receiveShadow = true;
  group.add(hall);

  // 4 Sawtooth Roof Bays
  for (let i = 0; i < 4; i++) {
    const sx = -7.2 + i * 3.8;
    const saw = new THREE.Mesh(new THREE.BoxGeometry(3.5, 1.4, 9.4), mats.terracottaRoof);
    saw.position.set(sx, 5.0, -3.5);
    saw.rotation.z = 0.34;
    saw.castShadow = true;
    group.add(saw);
  }

  // Historic Tall Factory Brick Chimney
  const chimneyBase = new THREE.Mesh(new THREE.BoxGeometry(2.4, 3.2, 2.4), mats.industrialBrick);
  chimneyBase.position.set(8.8, 1.7, -5.2);
  chimneyBase.castShadow = true;
  group.add(chimneyBase);

  const chimneyShaft = new THREE.Mesh(
    new THREE.CylinderGeometry(0.62, 1.05, 12.5, 12),
    mats.industrialBrick
  );
  chimneyShaft.position.set(8.8, 9.2, -5.2);
  chimneyShaft.castShadow = true;
  group.add(chimneyShaft);

  // Tranquil Park Pond & Wooden Deck
  const pondRim = new THREE.Mesh(new THREE.CylinderGeometry(4.4, 4.6, 0.3, 24), mats.travertine);
  pondRim.position.set(4.5, 0.2, 6.2);
  group.add(pondRim);

  const pondWater = new THREE.Mesh(new THREE.CylinderGeometry(4.0, 4.0, 0.12, 24), mats.water);
  pondWater.position.set(4.5, 0.34, 6.2);
  group.add(pondWater);

  const deck = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.25, 2.0), mats.darkTimber);
  deck.position.set(4.5, 0.42, 2.4);
  group.add(deck);

  const ringMesh = makeDiscoveryRing(lx + 14.5, lz);
  const colliders: ColliderBox[] = [];
  addBoxCollider(colliders, lx - 1.5, lz - 3.5, 15.5, 9.2, 5.8);
  addBoxCollider(colliders, lx + 8.8, lz - 5.2, 2.4, 2.4, 15.5);
  addBoxCollider(colliders, lx + 4.5, lz + 6.2, 8.2, 8.2, 0.45);

  return { def, group, ringMesh, colliders };
}

/**
 * 9. Forum Aydın Yaşam & AVM (Open-Air Lifestyle Mall)
 */
function buildForumAvm(def: LandmarkDef, mats: CityMaterialLibrary): BuiltLandmark {
  const group = new THREE.Group();
  const [lx, , lz] = def.position;
  group.position.set(lx, 0, lz);

  // Wide Travertine Lifestyle Mall Courtyard
  const deck = new THREE.Mesh(new THREE.BoxGeometry(26, 0.25, 24), mats.plaza);
  deck.position.y = 0.125;
  deck.receiveShadow = true;
  group.add(deck);

  // North & South Two-Story Retail Wings
  [-7.2, 7.2].forEach((wz) => {
    const wing = new THREE.Mesh(new THREE.BoxGeometry(22, 5.8, 5.6), mats.creamPlaster);
    wing.position.set(0, 3.05, wz);
    wing.castShadow = true;
    wing.receiveShadow = true;
    group.add(wing);

    const trim = new THREE.Mesh(
      createHipRoofGeometry(22.6, 6.2, 1.35),
      mats.terracottaRoof
    );
    trim.position.set(0, 5.95, wz);
    trim.castShadow = true;
    group.add(trim);

    // Shopfront glass bays
    for (let sx = -8; sx <= 8; sx += 4) {
      const glass = new THREE.Mesh(new THREE.BoxGeometry(2.8, 2.2, 0.16), mats.windowLit);
      glass.position.set(sx, 1.6, wz > 0 ? wz - 2.82 : wz + 2.82);
      group.add(glass);
    }
  });

  // East Main Anchor Pavilion
  const eastWing = new THREE.Mesh(new THREE.BoxGeometry(5.6, 6.6, 18.0), mats.peachPlaster);
  eastWing.position.set(8.6, 3.45, 0);
  eastWing.castShadow = true;
  group.add(eastWing);

  // Glass Atrium Canopy over Central Promenade
  const canopy = new THREE.Mesh(new THREE.BoxGeometry(15.5, 0.22, 8.8), mats.glassAtrium);
  canopy.position.set(-1.0, 5.4, 0);
  group.add(canopy);

  // Central Ornamental Courtyard Fountain
  const fRim = new THREE.Mesh(new THREE.CylinderGeometry(2.6, 2.8, 0.4, 16), mats.travertine);
  fRim.position.set(-1.5, 0.35, 0);
  group.add(fRim);

  const fWater = new THREE.Mesh(new THREE.CylinderGeometry(2.2, 2.2, 0.12, 16), mats.water);
  fWater.position.set(-1.5, 0.54, 0);
  group.add(fWater);

  // Outdoor Café Umbrellas
  const umbrellaMat = new THREE.MeshStandardMaterial({ color: 0xc97b36, roughness: 0.7 });
  [-6.5, -6.5, 2.8, 2.8].forEach((ux, i) => {
    const uz = i % 2 === 0 ? -2.6 : 2.6;
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 2.2, 6), mats.wroughtIron);
    pole.position.set(ux, 1.3, uz);
    group.add(pole);
    const cap = new THREE.Mesh(new THREE.ConeGeometry(1.15, 0.55, 8), umbrellaMat);
    cap.position.set(ux, 2.5, uz);
    cap.castShadow = true;
    group.add(cap);
  });

  const ringMesh = makeDiscoveryRing(lx - 14.5, lz);
  const colliders: ColliderBox[] = [];
  addBoxCollider(colliders, lx, lz - 7.2, 22, 5.6, 7.2);
  addBoxCollider(colliders, lx, lz + 7.2, 22, 5.6, 7.2);
  addBoxCollider(colliders, lx + 8.6, lz, 5.6, 18.0, 6.8);

  return { def, group, ringMesh, colliders };
}

/**
 * 10. Tarihi Aydın Tren Garı (1882)
 */
function buildTrenGari(def: LandmarkDef, mats: CityMaterialLibrary): BuiltLandmark {
  const group = new THREE.Group();
  const [lx, , lz] = def.position;
  group.position.set(lx, 0, lz);

  const platform = new THREE.Mesh(new THREE.BoxGeometry(28, 0.45, 14), mats.plaza);
  platform.position.set(0, 0.225, 2.5);
  platform.receiveShadow = true;
  group.add(platform);

  const mainWing = new THREE.Mesh(new THREE.BoxGeometry(20, 5.2, 6.2), mats.creamPlaster);
  mainWing.position.set(0, 3.05, -0.5);
  mainWing.castShadow = true;
  mainWing.receiveShadow = true;
  group.add(mainWing);

  const centerBay = new THREE.Mesh(new THREE.BoxGeometry(6.2, 6.6, 6.8), mats.whitePlaster);
  centerBay.position.set(0, 3.75, -0.5);
  centerBay.castShadow = true;
  group.add(centerBay);

  const clockFace = new THREE.Mesh(new THREE.CylinderGeometry(0.68, 0.68, 0.18, 16), mats.brass);
  clockFace.rotation.x = Math.PI / 2;
  clockFace.position.set(0, 5.8, -3.95);
  group.add(clockFace);

  const wingRoof = new THREE.Mesh(
    createGableRoofGeometry(21.0, 7.0, 2.2),
    mats.terracottaRoof
  );
  wingRoof.position.set(0, 5.65, -0.5);
  wingRoof.castShadow = true;
  group.add(wingRoof);

  const centerRoof = new THREE.Mesh(
    createHipRoofGeometry(7.0, 7.6, 2.4),
    mats.terracottaRoof
  );
  centerRoof.position.set(0, 7.05, -0.5);
  centerRoof.castShadow = true;
  group.add(centerRoof);

  [-7.5, -5.0, 5.0, 7.5].forEach((wx) => {
    [-3.62, 2.62].forEach((wz) => {
      const win = new THREE.Mesh(new THREE.BoxGeometry(1.15, 2.3, 0.14), mats.windowLit);
      win.position.set(wx, 2.8, wz);
      group.add(win);
    });
  });

  const canopy = new THREE.Mesh(new THREE.BoxGeometry(22, 0.2, 4.2), mats.wroughtIron);
  canopy.position.set(0, 3.8, 4.6);
  canopy.castShadow = true;
  group.add(canopy);

  [-9, -4.5, 0, 4.5, 9].forEach((cx) => {
    const col = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.14, 3.4, 8), mats.wroughtIron);
    col.position.set(cx, 2.1, 6.2);
    group.add(col);
  });

  const railZ1 = 10.4;
  const railZ2 = 11.8;
  // Gravel Ballast Bed under Railway Tracks
  const ballast = new THREE.Mesh(new THREE.BoxGeometry(165, 0.16, 3.6), mats.dirtPath);
  ballast.position.set(0, 0.08, (railZ1 + railZ2) / 2);
  ballast.receiveShadow = true;
  group.add(ballast);

  [railZ1, railZ2].forEach((rz) => {
    const rail = new THREE.Mesh(new THREE.BoxGeometry(165, 0.16, 0.16), mats.railSteel);
    rail.position.set(0, 0.25, rz);
    group.add(rail);
  });

  for (let tx = -76; tx <= 76; tx += 2.2) {
    const sleeper = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.12, 2.3), mats.darkTimber);
    sleeper.position.set(tx, 0.14, (railZ1 + railZ2) / 2);
    group.add(sleeper);
  }

  const ringMesh = makeDiscoveryRing(lx, lz - 7.5);
  const colliders: ColliderBox[] = [];
  addBoxCollider(colliders, lx, lz + 1.5, 22, 13, 8.6);

  return { def, group, ringMesh, colliders };
}

/**
 * 11. Orta Mahalle Tarihi Dokusu, Mahalle Çeşmesi & Taş Kahvehane
 */
function buildOrtaMahalle(def: LandmarkDef, mats: CityMaterialLibrary): BuiltLandmark {
  const group = new THREE.Group();
  const [lx, , lz] = def.position;
  group.position.set(lx, 0, lz);

  // Cobblestone Hillside Terrace Courtyard + Retaining Stone Skirt
  const terraceSkirt = new THREE.Mesh(new THREE.BoxGeometry(21.6, 2.8, 19.6), mats.travertine);
  terraceSkirt.position.y = -1.35;
  terraceSkirt.receiveShadow = true;
  group.add(terraceSkirt);

  const courtyard = new THREE.Mesh(new THREE.BoxGeometry(21, 0.34, 19), mats.cobble);
  courtyard.position.y = 0.17;
  courtyard.receiveShadow = true;
  group.add(courtyard);

  const curb = new THREE.Mesh(new THREE.BoxGeometry(21.6, 0.24, 19.6), mats.travertine);
  curb.position.y = 0.12;
  group.add(curb);

  // Historic Stone Bakery & Neighborhood Kahvehane (West-North Side)
  const cafeBody = new THREE.Mesh(new THREE.BoxGeometry(7.6, 4.8, 6.4), mats.ochrePlaster);
  cafeBody.position.set(-4.6, 2.7, -3.8);
  cafeBody.castShadow = true;
  cafeBody.receiveShadow = true;
  group.add(cafeBody);

  const cafeCumba = new THREE.Mesh(new THREE.BoxGeometry(8.1, 2.2, 6.9), mats.whitePlaster);
  cafeCumba.position.set(-4.6, 4.1, -3.8);
  cafeCumba.castShadow = true;
  group.add(cafeCumba);

  const cafeRoof = new THREE.Mesh(
    createGableRoofGeometry(8.6, 7.4, 2.1),
    mats.terracottaRoof
  );
  cafeRoof.position.set(-4.6, 5.2, -3.8);
  cafeRoof.castShadow = true;
  group.add(cafeRoof);

  const ovenChimney = new THREE.Mesh(
    new THREE.BoxGeometry(0.95, 2.2, 0.95),
    mats.industrialBrick
  );
  ovenChimney.position.set(-7.2, 6.2, -5.2);
  ovenChimney.castShadow = true;
  group.add(ovenChimney);

  const awningMat = new THREE.MeshStandardMaterial({
    color: 0xb64b36,
    map: mats.stripedAwningMap,
    roughness: 0.78,
  });
  const cafeAwning = new THREE.Mesh(new THREE.BoxGeometry(6.8, 0.14, 1.8), awningMat);
  cafeAwning.position.set(-4.6, 2.55, 0.25);
  cafeAwning.rotation.x = 0.24;
  cafeAwning.castShadow = true;
  group.add(cafeAwning);

  [-6.8, -4.6, -2.4].forEach((wx) => {
    const win = new THREE.Mesh(new THREE.BoxGeometry(1.0, 1.05, 0.14), mats.windowLit);
    win.position.set(wx, 4.1, -0.32);
    group.add(win);
  });

  // Outdoor Wooden Kahvehane Tables & Low Tabure Stools
  [-6.2, -3.0].forEach((tx) => {
    const tableTop = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.55, 0.08, 12), mats.darkTimber);
    tableTop.position.set(tx, 0.75, 2.4);
    tableTop.castShadow = true;
    const tableLeg = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.1, 0.55, 8), mats.darkTimber);
    tableLeg.position.set(tx, 0.45, 2.4);
    group.add(tableTop, tableLeg);

    [-0.75, 0.75].forEach((sx) => {
      const stool = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.36, 0.34), mats.creamPlaster);
      stool.position.set(tx + sx, 0.42, 2.4);
      group.add(stool);
    });
  });

  // Traditional Carved Marble Mahalle Çeşmesi (East Pavilion)
  const cesmeWall = new THREE.Mesh(new THREE.BoxGeometry(2.6, 3.6, 1.2), mats.travertine);
  cesmeWall.position.set(4.5, 2.0, -2.2);
  cesmeWall.castShadow = true;
  group.add(cesmeWall);

  const cesmeArch = new THREE.Mesh(new THREE.BoxGeometry(1.5, 2.1, 1.32), mats.creamPlaster);
  cesmeArch.position.set(4.5, 1.45, -2.2);
  group.add(cesmeArch);

  const cesmeCap = new THREE.Mesh(new THREE.ConeGeometry(2.0, 0.9, 4), mats.terracottaRoof);
  cesmeCap.rotation.y = Math.PI / 4;
  cesmeCap.position.set(4.5, 4.25, -2.2);
  cesmeCap.castShadow = true;
  group.add(cesmeCap);

  const trough = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.55, 1.15), mats.travertine);
  trough.position.set(4.5, 0.55, -1.1);
  const troughWater = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.14, 0.8), mats.water);
  troughWater.position.set(4.5, 0.78, -1.1);
  group.add(trough, troughWater);

  // Grapevine Wooden Pergola Arbor (South-East Terrace)
  const vineMat = new THREE.MeshStandardMaterial({ color: 0x5d8a48, roughness: 0.84 });
  const pergola = new THREE.Group();
  pergola.position.set(4.2, 0.28, 4.8);
  [-2.6, 2.6].forEach((px) => {
    [-1.4, 1.4].forEach((pz) => {
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.1, 2.6, 8), mats.darkTimber);
      post.position.set(px, 1.3, pz);
      post.castShadow = true;
      pergola.add(post);
    });
  });
  for (let bx = -2.6; bx <= 2.6; bx += 1.3) {
    const beam = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.16, 3.4), mats.darkTimber);
    beam.position.set(bx, 2.65, 0);
    pergola.add(beam);
  }
  const vineCanopy = new THREE.Mesh(new THREE.BoxGeometry(5.6, 0.24, 3.2), vineMat);
  vineCanopy.position.set(0, 2.82, 0);
  vineCanopy.castShadow = true;
  pergola.add(vineCanopy);
  group.add(pergola);

  const ringMesh = makeDiscoveryRing(lx - 12.2, lz);
  const colliders: ColliderBox[] = [];
  addBoxCollider(colliders, lx - 4.6, lz - 3.8, 7.6, 6.4, 7.2);
  addBoxCollider(colliders, lx + 4.5, lz - 1.8, 2.8, 2.4, 4.4);

  return { def, group, ringMesh, colliders };
}

/**
 * 12. ADÜ — Aydın Adnan Menderes Üniversitesi Aytepe Kampüsü
 */
function buildUniversite(def: LandmarkDef, mats: CityMaterialLibrary): BuiltLandmark {
  const group = new THREE.Group();
  const [lx, , lz] = def.position;
  group.position.set(lx, 0, lz);

  // Wide Campus Green Lawn, Retaining Hill Skirt & Travertine Quad Paths
  const campusSkirt = new THREE.Mesh(new THREE.BoxGeometry(28.4, 3.6, 24.4), mats.travertine);
  campusSkirt.position.y = -1.75;
  campusSkirt.receiveShadow = true;
  group.add(campusSkirt);

  const lawnMat = new THREE.MeshStandardMaterial({ color: 0x6f964e, roughness: 0.9 });
  const campusBase = new THREE.Mesh(new THREE.BoxGeometry(28, 0.22, 24), lawnMat);
  campusBase.position.y = 0.11;
  campusBase.receiveShadow = true;
  group.add(campusBase);

  const quadWalkEW = new THREE.Mesh(new THREE.BoxGeometry(26, 0.26, 3.6), mats.plaza);
  quadWalkEW.position.set(-1.0, 0.14, 0);
  quadWalkEW.receiveShadow = true;
  const quadWalkNS = new THREE.Mesh(new THREE.BoxGeometry(3.6, 0.26, 21), mats.plaza);
  quadWalkNS.position.set(-1.5, 0.14, 0);
  quadWalkNS.receiveShadow = true;
  group.add(quadWalkEW, quadWalkNS);

  // Monumental ADÜ Campus Stone Entrance Archway (West Side facing Doğu Bulvarı)
  [-3.2, 3.2].forEach((az) => {
    const pillar = new THREE.Mesh(new THREE.BoxGeometry(1.5, 5.2, 1.5), mats.travertine);
    pillar.position.set(-12.5, 2.7, az);
    pillar.castShadow = true;
    group.add(pillar);
  });
  const archLintel = new THREE.Mesh(new THREE.BoxGeometry(1.7, 1.2, 8.6), mats.creamPlaster);
  archLintel.position.set(-12.5, 5.6, 0);
  archLintel.castShadow = true;
  const crestPlate = new THREE.Mesh(new THREE.BoxGeometry(1.85, 0.72, 3.6), mats.brass);
  crestPlate.position.set(-12.5, 5.65, 0);
  group.add(archLintel, crestPlate);

  // Classical Campus Rectorate & Faculty Building (North-East)
  const rectorate = new THREE.Mesh(new THREE.BoxGeometry(14.5, 6.2, 7.6), mats.creamPlaster);
  rectorate.position.set(3.2, 3.3, -6.4);
  rectorate.castShadow = true;
  rectorate.receiveShadow = true;
  group.add(rectorate);

  const rectorateRoof = new THREE.Mesh(
    createHipRoofGeometry(15.2, 8.3, 2.2),
    mats.terracottaRoof
  );
  rectorateRoof.position.set(3.2, 6.4, -6.4);
  rectorateRoof.castShadow = true;
  group.add(rectorateRoof);

  // Portico Columns & Flag Pole
  [-3.4, -1.1, 1.1, 3.4].forEach((cx) => {
    const col = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.25, 4.2, 10), mats.whitePlaster);
    col.position.set(3.2 + cx, 2.3, -2.1);
    col.castShadow = true;
    group.add(col);
  });
  const porticoCap = new THREE.Mesh(new THREE.BoxGeometry(8.2, 0.45, 1.8), mats.travertine);
  porticoCap.position.set(3.2, 4.55, -2.1);
  group.add(porticoCap);

  [-2.5, 0, 2.5, 5.0, 7.5].forEach((wx) => {
    [2.1, 4.8].forEach((wy) => {
      const win = new THREE.Mesh(new THREE.BoxGeometry(1.05, 1.25, 0.14), mats.windowLit);
      win.position.set(wx, wy, -2.56);
      group.add(win);
    });
  });

  // Domed Central Campus Library (South-East)
  const libBase = new THREE.Mesh(new THREE.CylinderGeometry(4.4, 4.7, 4.6, 8), mats.peachPlaster);
  libBase.position.set(5.6, 2.5, 5.8);
  libBase.castShadow = true;
  libBase.receiveShadow = true;
  group.add(libBase);

  const libGlassDrum = new THREE.Mesh(
    new THREE.CylinderGeometry(3.6, 3.6, 1.4, 16),
    mats.glassAtrium
  );
  libGlassDrum.position.set(5.6, 5.4, 5.8);
  group.add(libGlassDrum);

  const libDome = new THREE.Mesh(
    new THREE.SphereGeometry(3.55, 22, 14, 0, Math.PI * 2, 0, Math.PI * 0.52),
    mats.leadDome
  );
  libDome.position.set(5.6, 6.0, 5.8);
  libDome.castShadow = true;
  group.add(libDome);

  // Outdoor Stepped Student Amphitheater (South-West Lawn)
  for (let tier = 0; tier < 3; tier++) {
    const step = new THREE.Mesh(
      new THREE.CylinderGeometry(3.8 - tier * 0.9, 4.0 - tier * 0.9, 0.35, 12, 1, false, 0, Math.PI),
      mats.travertine
    );
    step.position.set(-5.2, 0.35 + tier * 0.32, 6.8);
    step.rotation.y = Math.PI * 0.25;
    step.receiveShadow = true;
    group.add(step);
  }

  // Campus Bicycle Parking Rack
  for (let b = 0; b < 3; b++) {
    const hoop = new THREE.Mesh(new THREE.TorusGeometry(0.45, 0.05, 6, 12, Math.PI), mats.wroughtIron);
    hoop.position.set(-8.0 + b * 1.1, 0.24, -4.6);
    group.add(hoop);
  }

  const ringMesh = makeDiscoveryRing(lx - 15.5, lz);
  const colliders: ColliderBox[] = [];
  addBoxCollider(colliders, lx + 3.2, lz - 6.4, 14.5, 7.6, 8.4);
  addBoxCollider(colliders, lx + 5.6, lz + 5.8, 8.8, 8.8, 9.4);
  addBoxCollider(colliders, lx - 12.5, lz - 3.2, 1.7, 1.7, 5.6);
  addBoxCollider(colliders, lx - 12.5, lz + 3.2, 1.7, 1.7, 5.6);

  return { def, group, ringMesh, colliders };
}

export function buildAllLandmarks(
  defs: LandmarkDef[],
  mats: CityMaterialLibrary
): BuiltLandmark[] {
  return defs.map((def) => {
    let built: BuiltLandmark;
    switch (def.id) {
      case 'tralleis':
        built = buildTralleis(def, mats);
        break;
      case 'beycamii':
        built = buildBeyCamii(def, mats);
        break;
      case 'nasuhpasa':
        built = buildNasuhPasa(def, mats);
        break;
      case 'ramazanpasa':
        built = buildRamazanPasa(def, mats);
        break;
      case 'cihanoglu':
        built = buildCihanoglu(def, mats);
        break;
      case 'kentmeydani':
        built = buildKentMeydani(def, mats);
        break;
      case 'saribelediye':
        built = buildSariBelediye(def, mats);
        break;
      case 'tekstilpark':
        built = buildTekstilPark(def, mats);
        break;
      case 'forumaydin':
        built = buildForumAvm(def, mats);
        break;
      case 'trengari':
        built = buildTrenGari(def, mats);
        break;
      case 'ortamahalle':
        built = buildOrtaMahalle(def, mats);
        break;
      case 'universite':
        built = buildUniversite(def, mats);
        break;
      default:
        built = buildKentMeydani(def, mats);
        break;
    }
    const [lx, , lz] = def.position;
    built.group.position.y = getTerrainHeightAt(lx, lz);
    return built;
  });
}
