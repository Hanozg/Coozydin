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

function createKentMeydaniPoolTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 384;
  const ctx = canvas.getContext('2d')!;

  const grad = ctx.createLinearGradient(0, 0, 512, 384);
  grad.addColorStop(0, '#0ebde4');
  grad.addColorStop(0.5, '#19d2f2');
  grad.addColorStop(1, '#0eb6de');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 512, 384);

  // Subtle ceramic tile grid
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.14)';
  ctx.lineWidth = 1;
  for (let x = 0; x <= 512; x += 24) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, 384);
    ctx.stroke();
  }
  for (let y = 0; y <= 384; y += 24) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(512, y);
    ctx.stroke();
  }

  // Geometric circular star & compass motifs matching Aydın Kent Meydanı pool floor
  const drawMosaicCircle = (cx: number, cy: number, r: number) => {
    ctx.strokeStyle = 'rgba(9, 78, 108, 0.48)';
    ctx.lineWidth = 2.6;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(cx, cy, r * 0.62, 0, Math.PI * 2);
    ctx.stroke();

    for (let k = 0; k < 8; k++) {
      const a = (k * Math.PI) / 4;
      ctx.beginPath();
      ctx.moveTo(cx + Math.cos(a) * r * 0.16, cy + Math.sin(a) * r * 0.16);
      ctx.lineTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r);
      ctx.stroke();
    }
  };

  drawMosaicCircle(155, 192, 86);
  drawMosaicCircle(345, 180, 104);
  ctx.strokeStyle = 'rgba(10, 88, 120, 0.36)';
  ctx.lineWidth = 2.2;
  ctx.beginPath();
  ctx.moveTo(32, 310);
  ctx.lineTo(480, 68);
  ctx.moveTo(58, 72);
  ctx.lineTo(445, 320);
  ctx.stroke();

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function createTurkishFlagTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 320;
  canvas.height = 212;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#d61c26';
  ctx.fillRect(0, 0, 320, 212);

  // Subtle fabric fold shading
  const shade = ctx.createLinearGradient(0, 0, 320, 0);
  shade.addColorStop(0, 'rgba(0,0,0,0.08)');
  shade.addColorStop(0.35, 'rgba(255,255,255,0.08)');
  shade.addColorStop(0.7, 'rgba(0,0,0,0.10)');
  shade.addColorStop(1, 'rgba(255,255,255,0.05)');
  ctx.fillStyle = shade;
  ctx.fillRect(0, 0, 320, 212);

  // White Crescent
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(118, 106, 48, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#d61c26';
  ctx.beginPath();
  ctx.arc(131, 106, 38, 0, Math.PI * 2);
  ctx.fill();

  // White 5-Point Star
  ctx.fillStyle = '#ffffff';
  ctx.save();
  ctx.translate(182, 106);
  ctx.rotate(-Math.PI / 10);
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const rad = i % 2 === 0 ? 22 : 9;
    const a = (i * Math.PI) / 5;
    if (i === 0) ctx.moveTo(Math.cos(a) * rad, Math.sin(a) * rad);
    else ctx.lineTo(Math.cos(a) * rad, Math.sin(a) * rad);
  }
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function createStoreSignTexture(
  title: string,
  subtitle: string,
  bgHex: string,
  fgHex: string,
  accentHex: string
): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 144;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = bgHex;
  ctx.fillRect(0, 0, 512, 144);

  ctx.fillStyle = accentHex;
  ctx.fillRect(0, 0, 512, 14);
  ctx.fillRect(0, 130, 512, 14);

  ctx.fillStyle = fgHex;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = '900 54px "Plus Jakarta Sans", system-ui, sans-serif';
  ctx.fillText(title, 256, subtitle ? 60 : 74);

  if (subtitle) {
    ctx.font = '700 22px "Plus Jakarta Sans", system-ui, sans-serif';
    ctx.globalAlpha = 0.9;
    ctx.fillText(subtitle, 256, 105);
    ctx.globalAlpha = 1;
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function createBelediyeGlassTexture(variant: 'upper' | 'lower'): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = variant === 'upper' ? 256 : 160;
  const ctx = canvas.getContext('2d')!;

  const rows = variant === 'upper' ? 5 : 2;
  const cols = 22;
  const cellW = canvas.width / cols;
  const cellH = canvas.height / rows;

  const palette =
    variant === 'upper'
      ? ['#c4ab58', '#d7be68', '#989462', '#82875e', '#e3cb73', '#a69854']
      : ['#b57b1b', '#d99924', '#694414', '#ecba48', '#8f5e18', '#523410'];

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const idx = (r * 7 + c * 3 + (c % 2)) % palette.length;
      ctx.fillStyle = palette[idx];
      ctx.fillRect(c * cellW, r * cellH, cellW, cellH);

      // Sunset gold diagonal reflection sheen
      const sheen = ctx.createLinearGradient(
        c * cellW,
        r * cellH,
        (c + 1) * cellW,
        (r + 1) * cellH
      );
      const highlight =
        variant === 'lower' && c >= 7 && c <= 14
          ? 'rgba(255, 224, 128, 0.36)'
          : 'rgba(255, 232, 165, 0.16)';
      sheen.addColorStop(0, highlight);
      sheen.addColorStop(0.55, 'rgba(255, 210, 120, 0.02)');
      sheen.addColorStop(1, 'rgba(30, 22, 12, 0.18)');
      ctx.fillStyle = sheen;
      ctx.fillRect(c * cellW + 1, r * cellH + 1, cellW - 2, cellH - 2);

      // Occasional tilted ventilation pane accent (just like the photo)
      if (variant === 'upper' && (r === 2 || r === 3) && (c === 6 || c === 9 || c === 13 || c === 16)) {
        ctx.fillStyle = 'rgba(42, 30, 16, 0.72)';
        ctx.fillRect(c * cellW + 3, r * cellH + 4, cellW - 6, cellH - 8);
      }

      // Crisp curtain-wall mullion frame
      ctx.strokeStyle = variant === 'upper' ? 'rgba(66, 58, 38, 0.78)' : 'rgba(54, 34, 12, 0.85)';
      ctx.lineWidth = 2;
      ctx.strokeRect(c * cellW, r * cellH, cellW, cellH);
    }
    // Horizontal aluminum spandrel band between floors
    ctx.fillStyle = variant === 'upper' ? 'rgba(138, 124, 72, 0.75)' : 'rgba(72, 48, 18, 0.82)';
    ctx.fillRect(0, r * cellH, canvas.width, 3);
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.ClampToEdgeWrapping;
  return tex;
}

function createCurvedBelediyeSignTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 128;
  const ctx = canvas.getContext('2d')!;

  ctx.clearRect(0, 0, 1024, 128);
  ctx.fillStyle = 'rgba(48, 44, 34, 0.42)';
  ctx.fillRect(0, 26, 1024, 76);

  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = '800 50px "Plus Jakarta Sans", system-ui, sans-serif';
  ctx.fillStyle = 'rgba(18, 14, 8, 0.82)';
  ctx.fillText('T.C. AYDIN BÜYÜKŞEHİR BELEDİYESİ', 514, 67);
  ctx.fillStyle = '#f8f5ec';
  ctx.fillText('T.C. AYDIN BÜYÜKŞEHİR BELEDİYESİ', 512, 64);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/**
 * 6. Atatürk Kent Meydanı & Efeler Anıtı (Based on Real Aydın Atatürk Kent Meydanı Photo)
 * - Huge Turquoise Geometric Pool + Green Circular Island Decks + Towering Turkish Flag
 * - Atatürk & Efeler Monument directly across from the Pool
 * - Municipal Cafés (Belediye Kafeleri) with cream umbrellas right beside the Pool
 * - Large Open Paved Square featuring Burger King, Popeyes & Usta Döner
 */
function buildKentMeydani(def: LandmarkDef, mats: CityMaterialLibrary): BuiltLandmark {
  const group = new THREE.Group();
  const [lx, , lz] = def.position;
  group.position.set(lx, 0, lz);

  // 1. Expansive Travertine Plaza Floor (x in [-13.0..+13.0], z in [-27.2..+15.8])
  const plazaSlab = new THREE.Mesh(new THREE.BoxGeometry(26.0, 0.24, 43.0), mats.plaza);
  plazaSlab.position.set(0, 0.12, -5.7);
  plazaSlab.receiveShadow = true;
  group.add(plazaSlab);

  // Travertine Outer Border Curbs
  const westCurb = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.27, 43.2), mats.travertine);
  westCurb.position.set(-13.0, 0.135, -5.7);
  const eastCurb = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.27, 43.2), mats.travertine);
  eastCurb.position.set(13.0, 0.135, -5.7);
  const northCurb = new THREE.Mesh(new THREE.BoxGeometry(26.6, 0.27, 0.6), mats.travertine);
  northCurb.position.set(0, 0.135, -27.2);
  const southCurb = new THREE.Mesh(new THREE.BoxGeometry(26.6, 0.27, 0.6), mats.travertine);
  southCurb.position.set(0, 0.135, 15.8);
  group.add(westCurb, eastCurb, northCurb, southCurb);

  // Open Event Square ("Büyük Boş Alan", local z in [-20.8..-8.4]) Stone Paving Bands
  for (let gz = -20.0; gz <= -9.0; gz += 3.6) {
    const band = new THREE.Mesh(new THREE.BoxGeometry(23.8, 0.02, 0.28), mats.travertine);
    band.position.set(0, 0.25, gz);
    band.receiveShadow = true;
    group.add(band);
  }
  [-7.8, 0, 7.8].forEach((gx) => {
    const strip = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.02, 12.0), mats.travertine);
    strip.position.set(gx, 0.25, -14.6);
    strip.receiveShadow = true;
    group.add(strip);
  });

  // Festive Red-and-White Pennant Strings across the Open Square (as in the reference photo)
  const cableMat = new THREE.MeshStandardMaterial({ color: 0x383c42, roughness: 0.55 });
  const redBannerMat = new THREE.MeshStandardMaterial({ color: 0xd63232, roughness: 0.6 });
  const creamBannerMat = new THREE.MeshStandardMaterial({ color: 0xf7efe2, roughness: 0.7 });
  [-18.2, -13.0].forEach((bz) => {
    [-12.2, 12.2].forEach((px) => {
      const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.08, 4.4, 8), mats.wroughtIron);
      pole.position.set(px, 2.42, bz);
      pole.castShadow = true;
      group.add(pole);
    });
    const wire = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 24.4, 6), cableMat);
    wire.rotation.z = Math.PI / 2;
    wire.position.set(0, 4.4, bz);
    group.add(wire);

    for (let k = -10.8; k <= 10.8; k += 1.35) {
      const flag = new THREE.Mesh(
        new THREE.ConeGeometry(0.22, 0.42, 3),
        Math.round(k * 2) % 2 === 0 ? redBannerMat : creamBannerMat
      );
      flag.rotation.x = Math.PI;
      flag.position.set(k, 4.18, bz);
      group.add(flag);
    }
  });

  // 2. Huge Turquoise Geometric Reflecting Pool ("Büyük Havuz", local [-2.3, 0, +0.6])
  const poolCX = -2.3;
  const poolCZ = 0.6;
  const poolW = 14.6;
  const poolD = 9.6;

  // Travertine Pool Coping Walls (North, South, West, East)
  const rimH = 0.26;
  const rimY = 0.35;
  const northRim = new THREE.Mesh(new THREE.BoxGeometry(poolW + 0.5, rimH, 0.45), mats.travertine);
  northRim.position.set(poolCX, rimY, poolCZ - poolD / 2);
  northRim.castShadow = true;
  const southRim = new THREE.Mesh(new THREE.BoxGeometry(poolW + 0.5, rimH, 0.45), mats.travertine);
  southRim.position.set(poolCX, rimY, poolCZ + poolD / 2);
  southRim.castShadow = true;
  const westRim = new THREE.Mesh(new THREE.BoxGeometry(0.45, rimH, poolD + 0.5), mats.travertine);
  westRim.position.set(poolCX - poolW / 2, rimY, poolCZ);
  westRim.castShadow = true;
  const eastRim = new THREE.Mesh(new THREE.BoxGeometry(0.45, rimH, poolD + 0.5), mats.travertine);
  eastRim.position.set(poolCX + poolW / 2, rimY, poolCZ);
  eastRim.castShadow = true;
  group.add(northRim, southRim, westRim, eastRim);

  // Turquoise Geometric Mosaic Pool Floor + Translucent Water Surface
  const mosaicMat = new THREE.MeshStandardMaterial({
    map: createKentMeydaniPoolTexture(),
    roughness: 0.32,
    metalness: 0.05,
  });
  const poolFloor = new THREE.Mesh(new THREE.PlaneGeometry(poolW - 0.3, poolD - 0.3), mosaicMat);
  poolFloor.rotation.x = -Math.PI / 2;
  poolFloor.position.set(poolCX, 0.36, poolCZ);
  poolFloor.receiveShadow = true;
  group.add(poolFloor);

  const waterSurfaceMat = new THREE.MeshStandardMaterial({
    color: 0x1fd8f7,
    transparent: true,
    opacity: 0.36,
    roughness: 0.08,
    metalness: 0.16,
  });
  const waterSurface = new THREE.Mesh(
    new THREE.PlaneGeometry(poolW - 0.32, poolD - 0.32),
    waterSurfaceMat
  );
  waterSurface.rotation.x = -Math.PI / 2;
  waterSurface.position.set(poolCX, 0.44, poolCZ);
  group.add(waterSurface);

  // Fountain Spray Jets inside the Turquoise Pool
  const jetMat = new THREE.MeshStandardMaterial({
    color: 0xe6fbff,
    transparent: true,
    opacity: 0.78,
    roughness: 0.1,
  });
  [-4.2, -1.2, 1.8].forEach((jx) => {
    const nozzle = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.22, 0.2, 10), mats.travertine);
    nozzle.position.set(jx, 0.45, poolCZ);
    const jet = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.22, 0.85, 8), jetMat);
    jet.position.set(jx, 0.92, poolCZ);
    group.add(nozzle, jet);
  });

  // Two Circular Green-Roofed Island Viewing Decks overlapping the Pool (matching photo)
  const islandGreenMat = new THREE.MeshStandardMaterial({ color: 0x5c8f3e, roughness: 0.88 });
  const buildPoolIsland = (ix: number, iz: number, rad: number) => {
    const isl = new THREE.Group();
    isl.position.set(ix, 0.24, iz);

    const base = new THREE.Mesh(new THREE.CylinderGeometry(rad, rad + 0.15, 0.36, 20), mats.travertine);
    base.position.y = 0.18;
    base.castShadow = true;
    base.receiveShadow = true;
    isl.add(base);

    for (let i = 0; i < 4; i++) {
      const a = (i * Math.PI) / 2 + Math.PI / 4;
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.08, 1.95, 6), mats.darkTimber);
      post.position.set(Math.cos(a) * (rad * 0.68), 1.25, Math.sin(a) * (rad * 0.68));
      post.castShadow = true;
      isl.add(post);
    }

    const fascia = new THREE.Mesh(
      new THREE.CylinderGeometry(rad + 0.12, rad + 0.12, 0.24, 24),
      mats.darkTimber
    );
    fascia.position.y = 2.25;
    fascia.castShadow = true;
    const roofTop = new THREE.Mesh(
      new THREE.CylinderGeometry(rad + 0.04, rad + 0.1, 0.14, 24),
      islandGreenMat
    );
    roofTop.position.y = 2.4;
    roofTop.receiveShadow = true;
    isl.add(fascia, roofTop);

    const bench = new THREE.Mesh(new THREE.BoxGeometry(rad * 1.0, 0.32, 0.55), mats.darkTimber);
    bench.position.set(0, 0.5, 0);
    isl.add(bench);

    group.add(isl);
  };
  buildPoolIsland(-7.8, 3.5, 2.05);
  buildPoolIsland(-8.0, -2.5, 1.65);

  // 3. Equestrian Atatürk Monument Directly Across from the Pool (Based on User's Reference Illustration)
  const monGroup = new THREE.Group();
  monGroup.position.set(8.8, 0.24, 0.6);
  monGroup.rotation.y = -Math.PI / 2; // Facing West directly across the turquoise pool

  // 3a. Outer Square Lawn Plot + Low Perimeter Stone-Post Railings
  const monLawnMat = new THREE.MeshStandardMaterial({ color: 0x76994b, roughness: 0.92 });
  const monLawn = new THREE.Mesh(new THREE.BoxGeometry(6.6, 0.08, 6.6), monLawnMat);
  monLawn.position.y = 0.04;
  monLawn.receiveShadow = true;
  monGroup.add(monLawn);

  const railPipeMat = new THREE.MeshStandardMaterial({ color: 0x5c6369, roughness: 0.5, metalness: 0.55 });
  const postOffsets = [-3.2, -1.6, 0, 1.6, 3.2];
  [
    { axis: 'x', fixed: -3.2 },
    { axis: 'x', fixed: 3.2 },
    { axis: 'z', fixed: -3.2 },
    { axis: 'z', fixed: 3.2 },
  ].forEach(({ axis, fixed }) => {
    const rail = new THREE.Mesh(
      axis === 'x' ? new THREE.BoxGeometry(0.05, 0.05, 6.4) : new THREE.BoxGeometry(6.4, 0.05, 0.05),
      railPipeMat
    );
    rail.position.set(axis === 'x' ? fixed : 0, 0.36, axis === 'z' ? fixed : 0);
    monGroup.add(rail);
    postOffsets.forEach((p) => {
      const post = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.42, 0.12), mats.travertine);
      post.position.set(axis === 'x' ? fixed : p, 0.21, axis === 'z' ? fixed : p);
      post.castShadow = true;
      monGroup.add(post);
    });
  });

  // 3b. Cruciform Stepped Travertine Base + 4 Corner Bushes + Ceremonial Stairs
  const crossArmA = new THREE.Mesh(new THREE.BoxGeometry(5.6, 0.22, 3.6), mats.travertine);
  crossArmA.position.y = 0.13;
  crossArmA.receiveShadow = true;
  const crossArmB = new THREE.Mesh(new THREE.BoxGeometry(3.6, 0.22, 5.6), mats.travertine);
  crossArmB.position.y = 0.13;
  crossArmB.receiveShadow = true;

  const midArmA = new THREE.Mesh(new THREE.BoxGeometry(4.6, 0.22, 2.8), mats.creamPlaster);
  midArmA.position.y = 0.35;
  midArmA.receiveShadow = true;
  const midArmB = new THREE.Mesh(new THREE.BoxGeometry(2.8, 0.22, 4.6), mats.creamPlaster);
  midArmB.position.y = 0.35;
  midArmB.receiveShadow = true;

  const upperDeck = new THREE.Mesh(new THREE.BoxGeometry(3.65, 0.22, 3.65), mats.travertine);
  upperDeck.position.y = 0.57;
  upperDeck.receiveShadow = true;
  monGroup.add(crossArmA, crossArmB, midArmA, midArmB, upperDeck);

  // 4 Corner Rounded Bushes on the Grass Square
  const bushMat = new THREE.MeshStandardMaterial({ color: 0x5c8b42, roughness: 0.88 });
  [
    [-2.25, -2.25],
    [2.25, -2.25],
    [-2.25, 2.25],
    [2.25, 2.25],
  ].forEach(([bx, bz]) => {
    const bush = new THREE.Mesh(new THREE.IcosahedronGeometry(0.36, 1), bushMat);
    bush.position.set(bx, 0.34, bz);
    bush.scale.set(1.05, 0.92, 1.05);
    bush.castShadow = true;
    monGroup.add(bush);
  });

  // Small Corner Turkish Flagpole on the Front Terrace Landing (matching the illustration)
  const monFlagGroup = new THREE.Group();
  monFlagGroup.position.set(1.65, 0.24, 2.35);
  const monMast = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.045, 2.25, 8), railPipeMat);
  monMast.position.y = 1.12;
  const monFlag = new THREE.Mesh(
    new THREE.PlaneGeometry(0.82, 0.54, 4, 2),
    new THREE.MeshStandardMaterial({
      map: createTurkishFlagTexture(),
      side: THREE.DoubleSide,
      roughness: 0.65,
    })
  );
  monFlag.position.set(0.42, 1.94, 0.02);
  monFlag.rotation.y = 0.15;
  monFlagGroup.add(monMast, monFlag);
  monGroup.add(monFlagGroup);

  // 3c. Tall Tapered Cream Ashlar Stone Pedestal
  const tierHeights = [0.58, 0.56, 0.56, 0.52];
  const tierWidths = [2.22, 2.04, 1.88, 1.72];
  const tierDepths = [2.42, 2.24, 2.08, 1.92];
  let curY = 0.68;
  tierHeights.forEach((h, idx) => {
    const mat = idx % 2 === 0 ? mats.creamPlaster : mats.travertine;
    const block = new THREE.Mesh(new THREE.BoxGeometry(tierWidths[idx], h, tierDepths[idx]), mat);
    block.position.y = curY + h / 2;
    block.castShadow = true;
    block.receiveShadow = true;
    monGroup.add(block);
    curY += h;
  });

  const pedCap = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.18, 2.15), mats.travertine);
  pedCap.position.y = curY + 0.09;
  pedCap.castShadow = true;
  monGroup.add(pedCap);

  const bronzeMat = new THREE.MeshStandardMaterial({
    color: 0x6b533b,
    roughness: 0.34,
    metalness: 0.72,
  });
  const darkBronzeMat = new THREE.MeshStandardMaterial({
    color: 0x4c3a29,
    roughness: 0.38,
    metalness: 0.7,
  });

  const statuePlinth = new THREE.Mesh(new THREE.BoxGeometry(1.36, 0.18, 2.12), darkBronzeMat);
  statuePlinth.position.y = curY + 0.27;
  statuePlinth.castShadow = true;
  monGroup.add(statuePlinth);

  // 3d. Flanking Bronze Soldiers & Citizens Around Pedestal Base
  const buildStandingFigure = (
    fx: number,
    fz: number,
    rotY: number,
    variant: 'soldier' | 'salute' | 'citizen'
  ) => {
    const fig = new THREE.Group();
    fig.position.set(fx, 0.68, fz);
    fig.rotation.y = rotY;

    const legs = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.15, 0.58, 8), bronzeMat);
    legs.position.y = 0.29;
    legs.castShadow = true;
    const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.14, 0.52, 8), bronzeMat);
    torso.position.y = 0.8;
    torso.castShadow = true;
    const fHead = new THREE.Mesh(new THREE.SphereGeometry(0.11, 10, 8), bronzeMat);
    fHead.position.y = 1.18;
    fig.add(legs, torso, fHead);

    if (variant === 'soldier') {
      const helmet = new THREE.Mesh(new THREE.SphereGeometry(0.125, 10, 6, 0, Math.PI * 2, 0, Math.PI * 0.55), darkBronzeMat);
      helmet.position.y = 1.21;
      const rifle = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.03, 0.92, 6), darkBronzeMat);
      rifle.position.set(0.16, 0.96, -0.05);
      rifle.rotation.z = -0.25;
      fig.add(helmet, rifle);
    } else if (variant === 'salute') {
      const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.11, 0.07, 8), darkBronzeMat);
      cap.position.y = 1.26;
      const raisedArm = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.045, 0.44, 6), bronzeMat);
      raisedArm.position.set(-0.2, 1.14, 0.06);
      raisedArm.rotation.z = 0.45;
      fig.add(cap, raisedArm);
    } else {
      const skirt = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.22, 0.62, 8), bronzeMat);
      skirt.position.y = 0.34;
      const scarf = new THREE.Mesh(new THREE.SphereGeometry(0.125, 8, 8), darkBronzeMat);
      scarf.position.set(0, 1.19, -0.02);
      fig.add(skirt, scarf);
    }
    monGroup.add(fig);
  };

  // Front & Back Soldier Plinths + Side Citizen/Officer Plinths
  [
    { px: 0, pz: 1.48 },
    { px: 0, pz: -1.48 },
    { px: 1.38, pz: 0 },
    { px: -1.38, pz: 0 },
  ].forEach(({ px, pz }) => {
    const ledge = new THREE.Mesh(new THREE.BoxGeometry(0.74, 0.36, 0.74), mats.travertine);
    ledge.position.set(px, 0.68, pz);
    ledge.castShadow = true;
    monGroup.add(ledge);
  });

  buildStandingFigure(0, 1.48, 0, 'soldier');
  buildStandingFigure(0, -1.48, Math.PI, 'soldier');
  buildStandingFigure(1.32, -0.15, Math.PI / 2, 'salute');
  buildStandingFigure(1.42, 0.2, Math.PI / 2, 'citizen');
  buildStandingFigure(-1.38, 0, -Math.PI / 2, 'soldier');

  // 3e. Heroic Bronze Equestrian Atatürk Statue atop the Pedestal (y = ~3.17 up to ~6.15)
  const eqBaseY = curY + 0.36;
  const eqGroup = new THREE.Group();
  eqGroup.position.set(0, eqBaseY, 0);

  // Horse Body (facing local +Z -> West toward pool)
  const horseBarrel = new THREE.Mesh(new THREE.CylinderGeometry(0.36, 0.38, 1.42, 12), bronzeMat);
  horseBarrel.rotation.x = Math.PI / 2;
  horseBarrel.position.set(0, 1.06, 0);
  horseBarrel.castShadow = true;
  const horseChest = new THREE.Mesh(new THREE.SphereGeometry(0.39, 12, 10), bronzeMat);
  horseChest.position.set(0, 1.08, 0.64);
  const horseRump = new THREE.Mesh(new THREE.SphereGeometry(0.38, 12, 10), bronzeMat);
  horseRump.position.set(0, 1.06, -0.62);
  eqGroup.add(horseBarrel, horseChest, horseRump);

  // Horse Arched Neck, Head, Ears & Flowing Tail
  const horseNeck = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.28, 0.78, 10), bronzeMat);
  horseNeck.position.set(0, 1.44, 0.84);
  horseNeck.rotation.x = 0.56;
  horseNeck.castShadow = true;
  const horseHead = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.24, 0.54), bronzeMat);
  horseHead.position.set(0, 1.72, 1.15);
  horseHead.rotation.x = 0.52;
  horseHead.castShadow = true;
  [-0.08, 0.08].forEach((ex) => {
    const ear = new THREE.Mesh(new THREE.ConeGeometry(0.045, 0.14, 6), bronzeMat);
    ear.position.set(ex, 1.9, 1.02);
    eqGroup.add(ear);
  });
  const tailUpper = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.12, 0.62, 8), darkBronzeMat);
  tailUpper.position.set(0, 1.06, -0.98);
  tailUpper.rotation.x = -0.52;
  const tailLower = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.09, 0.58, 8), darkBronzeMat);
  tailLower.position.set(0, 0.64, -1.14);
  tailLower.rotation.x = -0.14;
  eqGroup.add(horseNeck, horseHead, tailUpper, tailLower);

  // 3 Grounded Horse Legs + 1 Raised Front-Right Foreleg (exact pose from drawing)
  [
    { lx: -0.22, lz: -0.64, rx: 0.1 }, // Rear-left
    { lx: 0.22, lz: -0.64, rx: -0.08 }, // Rear-right
    { lx: -0.22, lz: 0.64, rx: -0.05 }, // Front-left grounded
  ].forEach(({ lx: legX, lz: legZ, rx }) => {
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.085, 0.065, 0.96, 8), bronzeMat);
    leg.position.set(legX, 0.5, legZ);
    leg.rotation.x = rx;
    leg.castShadow = true;
    const hoof = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.085, 0.1, 8), darkBronzeMat);
    hoof.position.set(legX, 0.05, legZ + rx * 0.45);
    eqGroup.add(leg, hoof);
  });
  // Raised Front-Right Foreleg (bent gracefully forward & up)
  const raisedUpper = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.075, 0.48, 8), bronzeMat);
  raisedUpper.position.set(0.22, 0.92, 0.78);
  raisedUpper.rotation.x = -0.95;
  const raisedLower = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.06, 0.42, 8), bronzeMat);
  raisedLower.position.set(0.22, 0.8, 1.06);
  raisedLower.rotation.x = 0.55;
  eqGroup.add(raisedUpper, raisedLower);

  // Saddle & Mounted Atatürk in Peaked Military Cap & Officer Uniform
  const saddle = new THREE.Mesh(new THREE.BoxGeometry(0.56, 0.16, 0.52), darkBronzeMat);
  saddle.position.set(0, 1.44, 0.05);
  const riderTorso = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.24, 0.72, 10), bronzeMat);
  riderTorso.position.set(0, 1.84, 0.04);
  riderTorso.castShadow = true;
  const riderShoulders = new THREE.Mesh(new THREE.BoxGeometry(0.54, 0.24, 0.26), bronzeMat);
  riderShoulders.position.set(0, 2.08, 0.04);
  const riderHead = new THREE.Mesh(new THREE.SphereGeometry(0.145, 12, 10), bronzeMat);
  riderHead.position.set(0, 2.34, 0.06);
  riderHead.castShadow = true;
  const officerCap = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.14, 0.1, 10), darkBronzeMat);
  officerCap.position.set(0, 2.46, 0.06);
  const capVisor = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.03, 0.12), darkBronzeMat);
  capVisor.position.set(0, 2.42, 0.18);
  const sword = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.012, 0.72, 6), darkBronzeMat);
  sword.position.set(0.28, 1.38, -0.06);
  sword.rotation.x = 0.55;
  eqGroup.add(saddle, riderTorso, riderShoulders, riderHead, officerCap, capVisor, sword);

  // Rider Boots & Arms holding the Reins
  [-0.3, 0.3].forEach((sx) => {
    const boot = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.065, 0.58, 8), darkBronzeMat);
    boot.position.set(sx, 1.24, 0.14);
    boot.rotation.z = sx > 0 ? -0.18 : 0.18;
    const armR = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.05, 0.52, 8), bronzeMat);
    armR.position.set(sx * 0.85, 1.86, 0.26);
    armR.rotation.x = -0.82;
    eqGroup.add(boot, armR);
  });

  monGroup.add(eqGroup);
  group.add(monGroup);

  // 4. Towering Silver Flagpole & Turkish Flag (near SE pool promenade, matching photo)
  const flagGroup = new THREE.Group();
  flagGroup.position.set(6.8, 0.24, 6.6);
  const flagBase = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.7, 0.38, 12), mats.travertine);
  flagBase.position.y = 0.19;
  const poleMat = new THREE.MeshStandardMaterial({ color: 0xd0d6de, metalness: 0.72, roughness: 0.28 });
  const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.15, 9.2, 10), poleMat);
  mast.position.y = 4.78;
  mast.castShadow = true;
  const finial = new THREE.Mesh(new THREE.SphereGeometry(0.16, 10, 8), mats.brass);
  finial.position.y = 9.45;
  const flagMat = new THREE.MeshStandardMaterial({
    map: createTurkishFlagTexture(),
    side: THREE.DoubleSide,
    roughness: 0.65,
  });
  const flagCloth = new THREE.Mesh(new THREE.PlaneGeometry(3.1, 2.05, 8, 2), flagMat);
  const fPos = flagCloth.geometry.attributes.position as THREE.BufferAttribute;
  for (let i = 0; i < fPos.count; i++) {
    const px = fPos.getX(i);
    const wave = Math.sin((px + 1.55) * 2.1) * 0.16;
    fPos.setZ(i, wave);
  }
  flagCloth.geometry.computeVertexNormals();
  flagCloth.position.set(-1.58, 8.2, 0.12);
  flagCloth.rotation.y = 0.22;
  flagCloth.castShadow = true;
  flagGroup.add(flagBase, mast, finial, flagCloth);
  group.add(flagGroup);

  // 5. Belediye Kafeleri Beside the Pool ("Havuzun Yanında Belediye Kafeleri", local z = -6.5)
  const glassMat = new THREE.MeshStandardMaterial({
    color: 0x3b4d59,
    emissive: new THREE.Color(0xf6cf88),
    emissiveIntensity: 0.42,
    roughness: 0.2,
    metalness: 0.3,
  });
  const umbrellaCreamMat = new THREE.MeshStandardMaterial({ color: 0xf4ebd9, roughness: 0.78 });

  const buildBelediyeCafe = (cx: number, cz: number, signLabel: string) => {
    const cafe = new THREE.Group();
    cafe.position.set(cx, 0.24, cz);

    const deck = new THREE.Mesh(new THREE.BoxGeometry(5.8, 0.16, 3.2), mats.darkTimber);
    deck.position.y = 0.08;
    deck.receiveShadow = true;
    cafe.add(deck);

    const body = new THREE.Mesh(new THREE.BoxGeometry(5.2, 2.45, 2.4), mats.creamPlaster);
    body.position.set(0, 1.38, -0.2);
    body.castShadow = true;
    body.receiveShadow = true;
    cafe.add(body);

    const counterGlass = new THREE.Mesh(new THREE.BoxGeometry(4.4, 1.65, 0.12), glassMat);
    counterGlass.position.set(0, 1.25, 1.02);
    cafe.add(counterGlass);

    // Timber Slatted Canopy + Pergola Overhang facing the pool (+Z)
    const canopy = new THREE.Mesh(new THREE.BoxGeometry(5.9, 0.22, 3.6), mats.darkTimber);
    canopy.position.set(0, 2.72, 0.3);
    canopy.castShadow = true;
    cafe.add(canopy);

    [-2.5, 2.5].forEach((px) => {
      const post = new THREE.Mesh(new THREE.BoxGeometry(0.14, 2.55, 0.14), mats.wroughtIron);
      post.position.set(px, 1.35, 1.85);
      post.castShadow = true;
      cafe.add(post);
    });

    // Illuminated Belediye Kafe Signboard
    const signMat = new THREE.MeshStandardMaterial({
      map: createStoreSignTexture(signLabel, 'AYDIN BÜYÜKŞEHİR', '#2f5238', '#faf2e2', '#e5b044'),
      roughness: 0.45,
    });
    const sign = new THREE.Mesh(new THREE.BoxGeometry(3.4, 0.62, 0.14), signMat);
    sign.position.set(0, 2.95, 2.08);
    cafe.add(sign);

    // Poolside Outdoor Tables with Cream Umbrellas (matching photo)
    [-1.7, 0, 1.7].forEach((tx) => {
      const table = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.42, 0.06, 10), mats.whitePlaster);
      table.position.set(tx, 0.72, 2.1);
      const tLeg = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.08, 0.66, 6), mats.wroughtIron);
      tLeg.position.set(tx, 0.38, 2.1);
      const uPole = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 2.15, 6), mats.wroughtIron);
      uPole.position.set(tx, 1.12, 2.1);
      const umbrella = new THREE.Mesh(new THREE.ConeGeometry(0.95, 0.42, 8), umbrellaCreamMat);
      umbrella.position.set(tx, 2.22, 2.1);
      umbrella.castShadow = true;
      cafe.add(table, tLeg, uPole, umbrella);
    });

    group.add(cafe);
  };
  buildBelediyeCafe(-6.3, -6.5, 'BELEDİYE KAFE');
  buildBelediyeCafe(0.9, -6.5, 'HALK KAFE');

  // 6. Food Court Pavilions Facing the Large Open Plaza ("Büyük Boş Alan İçerisinde Burger King, Popeyes, Usta Döner")
  const buildBrandPavilion = (
    px: number,
    pz: number,
    brandTitle: string,
    subtitle: string,
    wallHex: number,
    fasciaHex: number,
    signBgHex: string,
    signFgHex: string,
    signAccentHex: string,
    umbrellaHex: number
  ) => {
    const pav = new THREE.Group();
    pav.position.set(px, 0.24, pz);

    const plinth = new THREE.Mesh(new THREE.BoxGeometry(6.6, 0.2, 4.6), mats.travertine);
    plinth.position.y = 0.1;
    plinth.receiveShadow = true;
    pav.add(plinth);

    const wallMat = new THREE.MeshStandardMaterial({ color: wallHex, roughness: 0.72 });
    const body = new THREE.Mesh(new THREE.BoxGeometry(6.1, 2.9, 3.8), wallMat);
    body.position.set(0, 1.65, -0.2);
    body.castShadow = true;
    body.receiveShadow = true;
    pav.add(body);

    // Modern Front Glass Counter + Awning
    const frontGlass = new THREE.Mesh(new THREE.BoxGeometry(5.1, 1.9, 0.14), glassMat);
    frontGlass.position.set(0, 1.25, 1.72);
    pav.add(frontGlass);

    const fasciaMat = new THREE.MeshStandardMaterial({ color: fasciaHex, roughness: 0.48 });
    const canopy = new THREE.Mesh(new THREE.BoxGeometry(6.5, 0.42, 4.6), fasciaMat);
    canopy.position.set(0, 3.25, 0.1);
    canopy.castShadow = true;
    pav.add(canopy);

    const roofTop = new THREE.Mesh(new THREE.BoxGeometry(6.3, 0.25, 4.2), mats.slateRoof);
    roofTop.position.set(0, 3.55, 0.05);
    pav.add(roofTop);

    // Crisp Brand Signboard facing the Open Square (+Z)
    const signMat = new THREE.MeshStandardMaterial({
      map: createStoreSignTexture(brandTitle, subtitle, signBgHex, signFgHex, signAccentHex),
      roughness: 0.35,
    });
    const signBoard = new THREE.Mesh(new THREE.BoxGeometry(4.8, 1.05, 0.18), signMat);
    signBoard.position.set(0, 3.28, 2.42);
    pav.add(signBoard);

    // Two Outdoor Patio Tables & Brand-Colored Umbrellas on the Open Plaza Apron
    const umbMat = new THREE.MeshStandardMaterial({ color: umbrellaHex, roughness: 0.72 });
    [-1.7, 1.7].forEach((tx) => {
      const table = new THREE.Mesh(new THREE.CylinderGeometry(0.46, 0.46, 0.07, 10), mats.whitePlaster);
      table.position.set(tx, 0.74, 3.0);
      const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.08, 0.68, 6), mats.wroughtIron);
      leg.position.set(tx, 0.38, 3.0);
      const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 2.2, 6), mats.wroughtIron);
      pole.position.set(tx, 1.14, 3.0);
      const umb = new THREE.Mesh(new THREE.ConeGeometry(1.02, 0.45, 8), umbMat);
      umb.position.set(tx, 2.28, 3.0);
      umb.castShadow = true;
      pav.add(table, leg, pole, umb);
    });

    group.add(pav);
  };

  buildBrandPavilion(
    -7.8,
    -23.6,
    'BURGER KING',
    'ALEVI ATEŞİ',
    0x332b26,
    0xd95626,
    '#f5ebdc',
    '#d62300',
    '#f28b1d',
    0xd94826
  );

  buildBrandPavilion(
    0.0,
    -23.6,
    'POPEYES',
    'LOUISIANA KITCHEN',
    0xf5efe6,
    0xf26b1d,
    '#f26b1d',
    '#ffffff',
    '#b52a1c',
    0xf27d29
  );

  buildBrandPavilion(
    7.8,
    -23.6,
    'USTA DÖNER',
    'YAPRAK DÖNER',
    0x402421,
    0xb82424,
    '#b82424',
    '#faf2e2',
    '#e3a84f',
    0xc4342d
  );

  // 7. Foreground Photo Touches: Corner Shade Trees + Yellow Aydın Taxis
  const leafMat = new THREE.MeshStandardMaterial({ color: 0x568843, roughness: 0.85 });
  const barkMat = new THREE.MeshStandardMaterial({ color: 0x6f5742, roughness: 0.9 });
  [
    [-11.2, 4.4],
    [11.2, -5.8],
  ].forEach(([tx, tz]) => {
    const tGroup = new THREE.Group();
    tGroup.position.set(tx, 0.24, tz);
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.26, 2.0, 8), barkMat);
    trunk.position.y = 1.0;
    trunk.castShadow = true;
    const crown = new THREE.Mesh(new THREE.IcosahedronGeometry(1.55, 1), leafMat);
    crown.scale.set(1.1, 0.82, 1.1);
    crown.position.y = 2.65;
    crown.castShadow = true;
    tGroup.add(trunk, crown);
    group.add(tGroup);
  });

  // Two cute parked yellow Aydın Taxis on SW boulevard apron (from photo foreground)
  const taxiYellowMat = new THREE.MeshStandardMaterial({ color: 0xf0be26, roughness: 0.36 });
  const taxiGlassMat = new THREE.MeshStandardMaterial({ color: 0x2c3742, roughness: 0.2 });
  [
    [-10.4, 14.0],
    [-7.5, 14.3],
  ].forEach(([cx, cz]) => {
    const taxi = new THREE.Group();
    taxi.position.set(cx, 0.24, cz);
    taxi.rotation.y = 0.14;
    const body = new THREE.Mesh(new THREE.BoxGeometry(2.1, 0.56, 1.05), taxiYellowMat);
    body.position.y = 0.42;
    body.castShadow = true;
    const cab = new THREE.Mesh(new THREE.BoxGeometry(1.15, 0.44, 0.92), taxiYellowMat);
    cab.position.set(-0.08, 0.88, 0);
    const win = new THREE.Mesh(new THREE.BoxGeometry(1.05, 0.32, 0.96), taxiGlassMat);
    win.position.set(-0.08, 0.88, 0);
    const sign = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.14, 0.22), mats.lampBulb);
    sign.position.set(-0.08, 1.16, 0);
    taxi.add(body, cab, win, sign);
    group.add(taxi);
  });

  const ringMesh = makeDiscoveryRing(lx, lz + 15.2);
  const colliders: ColliderBox[] = [];
  // Pool rim collider
  addBoxCollider(colliders, lx + poolCX, lz + poolCZ, poolW + 0.4, poolD + 0.4, 0.55);
  // Monument statue plinth, stepped terrace & low perimeter fence collider
  addBoxCollider(colliders, lx + 8.8, lz + 0.6, 6.7, 6.7, 6.4);
  // Flagpole base collider
  addBoxCollider(colliders, lx + 6.8, lz + 6.6, 1.3, 1.3, 9.6);
  // Municipal Cafés colliders
  addBoxCollider(colliders, lx - 6.3, lz - 6.5, 5.9, 3.4, 3.2);
  addBoxCollider(colliders, lx + 0.9, lz - 6.5, 5.9, 3.4, 3.2);
  // Food Court Pavilions (Burger King, Popeyes, Usta Döner) colliders
  addBoxCollider(colliders, lx - 7.8, lz - 23.6, 6.6, 4.6, 3.8);
  addBoxCollider(colliders, lx, lz - 23.6, 6.6, 4.6, 3.8);
  addBoxCollider(colliders, lx + 7.8, lz - 23.6, 6.6, 4.6, 3.8);

  return { def, group, ringMesh, colliders };
}

/**
 * 7. Aydın Büyükşehir Belediyesi Binası (Based on Real Golden Glass Curved Building & Atatürk Monument Photo)
 * - Stepped circular black granite pedestal with bronze Atatürk statue facing Hükümet Bulvarı (-X)
 * - Tall left-foreground silver flagpole with Turkish flag
 * - Sweeping 2-story amber-bronze mirror glass curved lower podium
 * - Tall cylindrical golden-amber curtain-wall tower with staggered stepped upper bays
 * - Open crown parapet with curved "T.C. AYDIN BÜYÜKŞEHİR BELEDİYESİ" illuminated sign
 */
function buildSariBelediye(def: LandmarkDef, mats: CityMaterialLibrary): BuiltLandmark {
  const group = new THREE.Group();
  const [lx, , lz] = def.position;
  group.position.set(lx, 0, lz);

  // 1. Travertine Municipal Plaza Terrace & Front Steps facing Hükümet Bulvarı (-X)
  const terrace = new THREE.Mesh(new THREE.BoxGeometry(19.2, 0.42, 16.8), mats.plaza);
  terrace.position.set(0.4, 0.21, 0);
  terrace.receiveShadow = true;
  group.add(terrace);

  const westStep1 = new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.22, 9.2), mats.travertine);
  westStep1.position.set(-9.45, 0.11, 0);
  westStep1.receiveShadow = true;
  group.add(westStep1);

  // Perimeter Dark Metal Railings along front terrace flanks (matching photo's left balustrade)
  [-6.4, 6.4].forEach((rz) => {
    const railTop = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.08, 3.8), mats.wroughtIron);
    railTop.position.set(-9.05, 1.02, rz);
    const railMid = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.05, 3.8), mats.wroughtIron);
    railMid.position.set(-9.05, 0.72, rz);
    group.add(railTop, railMid);
    [-1.7, 0, 1.7].forEach((pz) => {
      const post = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.62, 0.08), mats.wroughtIron);
      post.position.set(-9.05, 0.72, rz + pz);
      group.add(post);
    });
  });

  // Building center shifted slightly east (x = +2.2) so front plaza & statue sit proudly on west side
  const bldgX = 2.2;
  const bldgGroup = new THREE.Group();
  bldgGroup.position.set(bldgX, 0.42, 0);

  const champagneGoldMat = new THREE.MeshStandardMaterial({
    color: 0xd9b868,
    roughness: 0.34,
    metalness: 0.56,
  });
  const warmStoneMat = new THREE.MeshStandardMaterial({
    color: 0xddd2bd,
    roughness: 0.76,
  });
  const lowerGlassMat = new THREE.MeshStandardMaterial({
    map: createBelediyeGlassTexture('lower'),
    color: 0xffd578,
    emissive: new THREE.Color(0x523208),
    emissiveIntensity: 0.32,
    roughness: 0.14,
    metalness: 0.72,
  });
  const upperGlassMat = new THREE.MeshStandardMaterial({
    map: createBelediyeGlassTexture('upper'),
    color: 0xf4df92,
    emissive: new THREE.Color(0x3b2f10),
    emissiveIntensity: 0.2,
    roughness: 0.2,
    metalness: 0.64,
  });

  // 2. Wide Curved 2-Story Amber-Bronze Mirror Glass Podium (Zemin & 1. Kat)
  const podiumBase = new THREE.Mesh(
    new THREE.CylinderGeometry(7.32, 7.36, 0.46, 36, 1, false, Math.PI * 0.9, Math.PI * 1.2),
    mats.travertine
  );
  podiumBase.position.y = 0.23;
  bldgGroup.add(podiumBase);

  const podiumGlass = new THREE.Mesh(
    new THREE.CylinderGeometry(7.22, 7.22, 3.1, 36, 1, false, Math.PI * 0.92, Math.PI * 1.16),
    lowerGlassMat
  );
  podiumGlass.position.y = 2.0;
  podiumGlass.castShadow = true;
  podiumGlass.receiveShadow = true;
  bldgGroup.add(podiumGlass);

  // Dark bronze roof coping on top of the wide lower podium
  const podiumRoof = new THREE.Mesh(
    new THREE.CylinderGeometry(7.36, 7.34, 0.26, 36, 1, false, Math.PI * 0.9, Math.PI * 1.2),
    mats.wroughtIron
  );
  podiumRoof.position.y = 3.62;
  podiumRoof.castShadow = true;
  bldgGroup.add(podiumRoof);

  // Front-North Glass Entrance Canopy & Illuminated Vestibule (matches doorPosition [30.6, 23.8])
  const entranceCanopy = new THREE.Mesh(new THREE.BoxGeometry(2.8, 0.22, 3.2), mats.wroughtIron);
  entranceCanopy.position.set(-5.8, 2.35, -4.1);
  entranceCanopy.rotation.y = -0.58;
  entranceCanopy.castShadow = true;
  const entranceGlow = new THREE.Mesh(new THREE.BoxGeometry(0.18, 2.05, 2.4), mats.windowLit);
  entranceGlow.position.set(-5.35, 1.25, -4.1);
  entranceGlow.rotation.y = -0.58;
  bldgGroup.add(entranceCanopy, entranceGlow);

  // Rear Service Core & Tall Golden Elevator Wings (left-rear & right-rear towers visible in photo)
  const rearCore = new THREE.Mesh(new THREE.BoxGeometry(5.6, 3.65, 13.6), warmStoneMat);
  rearCore.position.set(2.8, 1.825, 0);
  rearCore.castShadow = true;
  rearCore.receiveShadow = true;
  bldgGroup.add(rearCore);

  [-4.4, 4.4].forEach((tz) => {
    const tower = new THREE.Mesh(new THREE.BoxGeometry(3.4, 10.1, 2.6), champagneGoldMat);
    tower.position.set(2.5, 5.05, tz);
    tower.castShadow = true;
    tower.receiveShadow = true;
    bldgGroup.add(tower);
  });

  // 3. Tall Cylindrical Golden-Amber Curtain-Wall Upper Tower (3–7. Katlar)
  const upperDrum = new THREE.Mesh(new THREE.CylinderGeometry(4.62, 4.62, 6.2, 36), upperGlassMat);
  upperDrum.position.y = 6.75;
  upperDrum.castShadow = true;
  upperDrum.receiveShadow = true;
  bldgGroup.add(upperDrum);

  // Stepped Staggered Curtain-Wall Relief Tiers on Front Arc (matching photo's layered facade geometry!)
  const upperSteppedTier = new THREE.Mesh(
    new THREE.CylinderGeometry(4.86, 4.86, 2.35, 28, 1, false, Math.PI * 1.06, Math.PI * 0.72),
    upperGlassMat
  );
  upperSteppedTier.position.y = 8.45;
  upperSteppedTier.castShadow = true;
  bldgGroup.add(upperSteppedTier);

  const rightSteppedBay = new THREE.Mesh(
    new THREE.CylinderGeometry(4.84, 4.84, 3.7, 24, 1, false, Math.PI * 1.48, Math.PI * 0.42),
    upperGlassMat
  );
  rightSteppedBay.position.y = 6.95;
  rightSteppedBay.castShadow = true;
  bldgGroup.add(rightSteppedBay);

  // Upper Roof Slab + Open Parapet Frame (matching the rectangular sky-cutout slots along roof edge)
  const topSlab = new THREE.Mesh(new THREE.CylinderGeometry(4.88, 4.88, 0.28, 36), champagneGoldMat);
  topSlab.position.y = 9.85;
  bldgGroup.add(topSlab);

  const crownBeam = new THREE.Mesh(
    new THREE.CylinderGeometry(4.92, 4.92, 0.36, 36, 1, true, Math.PI * 0.95, Math.PI * 1.1),
    champagneGoldMat
  );
  crownBeam.material = champagneGoldMat.clone();
  crownBeam.material.side = THREE.DoubleSide;
  crownBeam.position.y = 10.62;
  bldgGroup.add(crownBeam);

  for (let i = 0; i <= 8; i++) {
    const theta = Math.PI * 0.98 + (i / 8) * Math.PI * 1.04;
    const pillar = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.65, 0.24), champagneGoldMat);
    pillar.position.set(Math.sin(theta) * 4.85, 10.22, Math.cos(theta) * 4.85);
    pillar.rotation.y = theta;
    bldgGroup.add(pillar);
  }

  // Curved "T.C. AYDIN BÜYÜKŞEHİR BELEDİYESİ" Illuminated Sign on Top Front Arc
  const signArcMat = new THREE.MeshStandardMaterial({
    map: createCurvedBelediyeSignTexture(),
    transparent: true,
    emissive: new THREE.Color(0xfff4d6),
    emissiveIntensity: 0.45,
    roughness: 0.32,
  });
  const curvedSign = new THREE.Mesh(
    new THREE.CylinderGeometry(5.05, 5.05, 0.64, 28, 1, true, Math.PI * 1.12, Math.PI * 0.76),
    signArcMat
  );
  curvedSign.position.y = 10.34;
  bldgGroup.add(curvedSign);

  group.add(bldgGroup);

  // 4. Stepped Circular Black Granite Pedestal & Bronze Atatürk Statue directly in front (-X)
  const monGroup = new THREE.Group();
  monGroup.position.set(-6.5, 0.42, 0);
  monGroup.rotation.y = -Math.PI / 2; // Facing West toward Hükümet Bulvarı

  const blackGraniteMat = new THREE.MeshStandardMaterial({
    color: 0x16181c,
    roughness: 0.24,
    metalness: 0.34,
  });
  const stepRadii = [2.45, 2.08, 1.72, 1.38];
  stepRadii.forEach((rad, idx) => {
    const step = new THREE.Mesh(new THREE.CylinderGeometry(rad, rad + 0.04, 0.24, 28), blackGraniteMat);
    step.position.y = 0.12 + idx * 0.24;
    step.castShadow = true;
    step.receiveShadow = true;
    monGroup.add(step);
  });

  const subPlinth = new THREE.Mesh(new THREE.BoxGeometry(1.05, 0.22, 1.05), blackGraniteMat);
  subPlinth.position.y = 1.07;
  monGroup.add(subPlinth);

  // Two small ground uplights on the black granite tier (matching photo)
  [-1.08, 1.08].forEach((ux) => {
    const uplight = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.14, 0.2), mats.wroughtIron);
    uplight.position.set(ux, 1.02, 0.78);
    uplight.rotation.x = -0.45;
    monGroup.add(uplight);
  });

  // Standing Bronze Atatürk Statue with Cape & Hat/Scroll (matching photo silhouette)
  const bronzeMat = new THREE.MeshStandardMaterial({
    color: 0x4b3828,
    roughness: 0.36,
    metalness: 0.72,
  });
  const legs = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.28, 1.05, 10), bronzeMat);
  legs.position.set(0, 1.7, 0);
  legs.castShadow = true;
  const coat = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.44, 1.35, 12), bronzeMat);
  coat.position.set(0, 2.15, -0.05);
  coat.castShadow = true;
  const shoulders = new THREE.Mesh(new THREE.BoxGeometry(0.76, 0.44, 0.36), bronzeMat);
  shoulders.position.set(0, 2.7, -0.02);
  shoulders.castShadow = true;
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.21, 12, 10), bronzeMat);
  head.position.set(0, 3.16, 0.02);
  head.castShadow = true;
  const rightArm = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.09, 0.62, 8), bronzeMat);
  rightArm.position.set(-0.34, 2.42, 0.18);
  rightArm.rotation.set(-0.55, 0, -0.35);
  const heldHat = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.18, 0.22, 10), bronzeMat);
  heldHat.position.set(-0.46, 2.26, 0.34);
  heldHat.rotation.z = 0.65;
  monGroup.add(legs, coat, shoulders, head, rightArm, heldHat);
  group.add(monGroup);

  // 5. Left Foreground Silver Flagpole with Turkish Flag (left side of photo)
  const flagGroup = new THREE.Group();
  flagGroup.position.set(-7.6, 0.42, 5.8);
  const poleMat = new THREE.MeshStandardMaterial({ color: 0xd0d6de, metalness: 0.72, roughness: 0.28 });
  const poleBase = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.3, 0.28, 12), mats.travertine);
  poleBase.position.y = 0.14;
  const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.11, 8.2, 10), poleMat);
  mast.position.y = 4.24;
  mast.castShadow = true;
  const finial = new THREE.Mesh(new THREE.SphereGeometry(0.13, 10, 8), mats.brass);
  finial.position.y = 8.4;
  const flagMat = new THREE.MeshStandardMaterial({
    map: createTurkishFlagTexture(),
    side: THREE.DoubleSide,
    roughness: 0.65,
  });
  const flagCloth = new THREE.Mesh(new THREE.PlaneGeometry(2.35, 1.56, 8, 2), flagMat);
  const fPos = flagCloth.geometry.attributes.position as THREE.BufferAttribute;
  for (let i = 0; i < fPos.count; i++) {
    const px = fPos.getX(i);
    fPos.setZ(i, Math.sin((px + 1.18) * 2.2) * 0.13);
  }
  flagCloth.geometry.computeVertexNormals();
  flagCloth.position.set(1.18, 7.25, 0.1);
  flagCloth.rotation.y = 0.18;
  flagCloth.castShadow = true;
  flagGroup.add(poleBase, mast, finial, flagCloth);
  group.add(flagGroup);

  const ringMesh = makeDiscoveryRing(lx - 11.0, lz);
  const colliders: ColliderBox[] = [];
  // Curved glass podium & upper tower collider
  addBoxCollider(colliders, lx + bldgX - 0.5, lz, 13.8, 14.2, 11.0);
  // Front circular Atatürk monument pedestal collider
  addBoxCollider(colliders, lx - 6.5, lz, 4.9, 4.9, 4.0);
  // Left flagpole base collider
  addBoxCollider(colliders, lx - 7.6, lz + 5.8, 0.9, 0.9, 8.6);

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

function createMagnesiaMosaicTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  // Warm Hellenistic marble flagstone base
  ctx.fillStyle = '#e5d5bc';
  ctx.fillRect(0, 0, 512, 512);

  const slabSize = 64;
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const shade = ((r * 5 + c * 7) % 3) - 1;
      ctx.fillStyle = shade > 0 ? '#eadbc4' : shade < 0 ? '#dcc9ab' : '#e3d2b6';
      ctx.fillRect(c * slabSize + 1, r * slabSize + 1, slabSize - 2, slabSize - 2);
      ctx.strokeStyle = 'rgba(130, 108, 82, 0.42)';
      ctx.lineWidth = 2;
      ctx.strokeRect(c * slabSize, r * slabSize, slabSize, slabSize);
    }
  }

  // Helper to draw Greco-Roman geometric mosaic carpet (matching MAGNESIA reference tile)
  const drawMosaicCarpet = (x: number, y: number, w: number, h: number, hasCenterStar: boolean) => {
    ctx.fillStyle = '#f2e6d2';
    ctx.fillRect(x, y, w, h);
    ctx.strokeStyle = '#5a4432';
    ctx.lineWidth = 6;
    ctx.strokeRect(x + 4, y + 4, w - 8, h - 8);

    // Meander / Greek-key dotted border band
    ctx.strokeStyle = '#9c623d';
    ctx.lineWidth = 4;
    ctx.setLineDash([8, 6]);
    ctx.strokeRect(x + 14, y + 14, w - 28, h - 28);
    ctx.setLineDash([]);

    ctx.strokeStyle = '#4e3c2d';
    ctx.lineWidth = 3;
    ctx.strokeRect(x + 24, y + 24, w - 48, h - 48);

    if (hasCenterStar) {
      const cx = x + w / 2;
      const cy = y + h / 2;
      ctx.fillStyle = '#c88d52';
      ctx.beginPath();
      ctx.moveTo(cx, cy - 36);
      ctx.lineTo(cx + 36, cy);
      ctx.lineTo(cx, cy + 36);
      ctx.lineTo(cx - 36, cy);
      ctx.closePath();
      ctx.fill();

      ctx.strokeStyle = '#4e3c2d';
      ctx.lineWidth = 3;
      ctx.stroke();

      ctx.fillStyle = '#6f8564';
      ctx.beginPath();
      ctx.arc(cx, cy, 16, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.strokeStyle = '#8b6340';
      ctx.lineWidth = 2;
      for (let gx = x + 32; gx < x + w - 28; gx += 16) {
        for (let gy = y + 32; gy < y + h - 28; gy += 16) {
          ctx.strokeRect(gx, gy, 10, 10);
        }
      }
    }
  };

  // Main central agora mosaic & left side framed mosaic carpet
  drawMosaicCarpet(186, 272, 148, 148, true);
  drawMosaicCarpet(54, 286, 102, 118, false);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/**
 * 13. Magnesia Antik Kenti (Artemis Tapınağı & Mozaikli Agora — Western Expansion)
 */
function buildMagnesia(def: LandmarkDef, mats: CityMaterialLibrary): BuiltLandmark {
  const group = new THREE.Group();
  const [lx, , lz] = def.position;
  group.position.set(lx, 0, lz);

  const marbleMat = new THREE.MeshStandardMaterial({ color: 0xebe0cd, roughness: 0.72 });
  const warmStoneMat = new THREE.MeshStandardMaterial({ color: 0xd6c4a8, roughness: 0.8 });

  // Retaining plinth skirt so sanctuary sits rock-solid on gentle western slope
  const skirt = new THREE.Mesh(new THREE.BoxGeometry(22.6, 2.4, 22.6), mats.travertine);
  skirt.position.y = -1.15;
  skirt.receiveShadow = true;
  group.add(skirt);

  // Broad Agora Marble Base + Inlaid Geometric Mosaic Pavement
  const agoraSlab = new THREE.Mesh(new THREE.BoxGeometry(22.0, 0.42, 22.0), warmStoneMat);
  agoraSlab.position.y = 0.21;
  agoraSlab.receiveShadow = true;
  group.add(agoraSlab);

  const mosaicMat = new THREE.MeshStandardMaterial({
    map: createMagnesiaMosaicTexture(),
    roughness: 0.62,
  });
  const mosaicFloor = new THREE.Mesh(new THREE.PlaneGeometry(21.2, 21.2), mosaicMat);
  mosaicFloor.rotation.x = -Math.PI / 2;
  mosaicFloor.position.y = 0.43;
  mosaicFloor.receiveShadow = true;
  group.add(mosaicFloor);

  // Reusable Classical Ionic Column Builder
  const addIonicColumn = (cx: number, baseY: number, cz: number, height: number, broken = false) => {
    const col = new THREE.Group();
    col.position.set(cx, baseY, cz);

    const plinth = new THREE.Mesh(new THREE.BoxGeometry(0.68, 0.2, 0.68), marbleMat);
    plinth.position.y = 0.1;
    const torus = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.34, 0.14, 12), marbleMat);
    torus.position.y = 0.26;
    const shaftH = Math.max(0.6, height - (broken ? 0.32 : 0.64));
    const shaft = new THREE.Mesh(
      new THREE.CylinderGeometry(broken ? 0.24 : 0.21, 0.26, shaftH, 14),
      marbleMat
    );
    shaft.position.y = 0.32 + shaftH / 2;
    shaft.castShadow = true;
    shaft.receiveShadow = true;
    col.add(plinth, torus, shaft);

    if (!broken) {
      const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.27, 0.22, 0.16, 12), marbleMat);
      neck.position.y = 0.32 + shaftH + 0.08;
      const volute = new THREE.Mesh(new THREE.BoxGeometry(0.66, 0.16, 0.48), marbleMat);
      volute.position.y = 0.32 + shaftH + 0.22;
      volute.castShadow = true;
      col.add(neck, volute);
    }

    group.add(col);
  };

  // 1. Temple of Artemis Leukophryene (North side of Mosaic Agora, facing +Z)
  const templeZ = -5.8;
  [
    { w: 13.6, h: 0.24, d: 7.4, y: 0.54 },
    { w: 12.6, h: 0.24, d: 6.6, y: 0.78 },
    { w: 11.6, h: 0.26, d: 5.8, y: 1.03 },
  ].forEach((step) => {
    const sMesh = new THREE.Mesh(new THREE.BoxGeometry(step.w, step.h, step.d), mats.travertine);
    sMesh.position.set(0, step.y, templeZ);
    sMesh.castShadow = true;
    sMesh.receiveShadow = true;
    group.add(sMesh);
  });

  // Grand Front Staircase Apron Descending onto Agora
  [0, 1, 2].forEach((si) => {
    const stair = new THREE.Mesh(
      new THREE.BoxGeometry(6.4 - si * 0.4, 0.22, 1.35 - si * 0.35),
      mats.creamPlaster
    );
    stair.position.set(0, 0.53 + si * 0.22, templeZ + 3.45 - si * 0.32);
    stair.receiveShadow = true;
    group.add(stair);
  });

  const stylobateTopY = 1.16;
  const frontColXs = [-4.3, -2.58, -0.86, 0.86, 2.58, 4.3];
  frontColXs.forEach((cx) => {
    addIonicColumn(cx, stylobateTopY, templeZ + 2.15, 4.35, false);
  });
  [-4.3, -1.6, 1.6, 4.3].forEach((cx) => {
    addIonicColumn(cx, stylobateTopY, templeZ - 1.9, 4.35, false);
  });

  // Temple Cella Inner Wall Ruins (subtle authentic depth behind the colonnade)
  const cellaWall = new THREE.Mesh(new THREE.BoxGeometry(6.8, 3.1, 1.9), warmStoneMat);
  cellaWall.position.set(0, stylobateTopY + 1.55, templeZ - 0.55);
  cellaWall.castShadow = true;
  group.add(cellaWall);

  // Architrave, Carved Frieze & Triangular Greek Pediment + Terracotta Roof
  const entablatureY = stylobateTopY + 4.35;
  const architrave = new THREE.Mesh(new THREE.BoxGeometry(10.0, 0.58, 4.7), marbleMat);
  architrave.position.set(0, entablatureY + 0.29, templeZ + 0.12);
  architrave.castShadow = true;
  group.add(architrave);

  const friezeBand = new THREE.Mesh(new THREE.BoxGeometry(9.8, 0.34, 4.55), warmStoneMat);
  friezeBand.position.set(0, entablatureY + 0.72, templeZ + 0.12);
  group.add(friezeBand);

  const pedShape = new THREE.Shape();
  pedShape.moveTo(-5.15, 0);
  pedShape.lineTo(5.15, 0);
  pedShape.lineTo(0, 1.75);
  pedShape.closePath();
  const pedGeo = new THREE.ExtrudeGeometry(pedShape, {
    depth: 4.75,
    bevelEnabled: true,
    bevelThickness: 0.06,
    bevelSize: 0.05,
    bevelSegments: 2,
  });
  pedGeo.translate(0, 0, -2.375);
  const pediment = new THREE.Mesh(pedGeo, marbleMat);
  pediment.position.set(0, entablatureY + 0.88, templeZ + 0.12);
  pediment.castShadow = true;
  group.add(pediment);

  // Pitched Terracotta Roof Planes over Pediment (matching MAGNESIA illustration)
  [-1, 1].forEach((side) => {
    const slope = new THREE.Mesh(new THREE.BoxGeometry(5.55, 0.16, 4.95), mats.terracottaRoof);
    slope.position.set(side * 2.58, entablatureY + 1.82, templeZ + 0.12);
    slope.rotation.z = -side * 0.33;
    slope.castShadow = true;
    group.add(slope);
  });
  const acroterion = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.22, 0.45, 8), marbleMat);
  acroterion.position.set(0, entablatureY + 2.86, templeZ + 2.48);
  group.add(acroterion);

  // 2. Flanking Stoa Colonnade Wings (left & right of the Temple, matching MAGNESIA tile)
  [-1, 1].forEach((side) => {
    const wingX = side * 7.8;
    const wingBase = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.42, 5.8), mats.travertine);
    wingBase.position.set(wingX, 0.63, -4.6);
    wingBase.receiveShadow = true;
    group.add(wingBase);

    [-6.6, -4.6, -2.6].forEach((wz) => {
      addIonicColumn(wingX, 0.84, wz, 3.85, false);
    });
    const wingLint = new THREE.Mesh(new THREE.BoxGeometry(1.15, 0.46, 4.9), marbleMat);
    wingLint.position.set(wingX, 4.92, -4.6);
    wingLint.castShadow = true;
    group.add(wingLint);
  });

  // 3. Foreground Standing & Broken Columns + Fallen Drum on Mosaic Agora
  addIonicColumn(-6.5, 0.42, 3.8, 3.55, false);
  addIonicColumn(6.6, 0.42, 3.6, 3.85, false);
  addIonicColumn(3.8, 0.42, 6.4, 2.05, true);
  addIonicColumn(-4.2, 0.42, 7.2, 1.55, true);

  const fallenDrum = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.24, 0.95, 12), marbleMat);
  fallenDrum.rotation.z = Math.PI / 2;
  fallenDrum.rotation.y = 0.55;
  fallenDrum.position.set(-1.8, 0.66, 7.4);
  fallenDrum.castShadow = true;
  group.add(fallenDrum);

  // 4. Mediterranean Olive Trees Framing the Sanctuary Entrance
  const oliveLeafMat = new THREE.MeshStandardMaterial({ color: 0x6c8754, roughness: 0.88 });
  const oliveTrunkMat = new THREE.MeshStandardMaterial({ color: 0x6b533e, roughness: 0.92 });
  [
    [-10.1, 8.8],
    [10.1, 8.8],
    [-10.2, -9.2],
    [10.2, -9.2],
  ].forEach(([tx, tz]) => {
    const t = new THREE.Group();
    t.position.set(tx, 0.42, tz);
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.2, 1.45, 7), oliveTrunkMat);
    trunk.position.y = 0.72;
    trunk.castShadow = true;
    const crown = new THREE.Mesh(new THREE.IcosahedronGeometry(1.05, 1), oliveLeafMat);
    crown.scale.set(1.1, 0.78, 1.1);
    crown.position.y = 1.9;
    crown.castShadow = true;
    t.add(trunk, crown);
    group.add(t);
  });

  const ringMesh = makeDiscoveryRing(lx, lz + 13.5);
  const colliders: ColliderBox[] = [];
  addBoxCollider(colliders, lx, lz + templeZ, 13.4, 7.2, 8.4);
  addBoxCollider(colliders, lx - 7.8, lz - 4.6, 2.5, 5.8, 5.2);
  addBoxCollider(colliders, lx + 7.8, lz - 4.6, 2.5, 5.8, 5.2);
  addBoxCollider(colliders, lx - 6.5, lz + 3.8, 1.0, 1.0, 4.0);
  addBoxCollider(colliders, lx + 6.6, lz + 3.6, 1.0, 1.0, 4.2);
  addBoxCollider(colliders, lx + 3.8, lz + 6.4, 0.9, 0.9, 2.5);
  addBoxCollider(colliders, lx - 4.2, lz + 7.2, 0.9, 0.9, 2.0);

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
      case 'magnesia':
        built = buildMagnesia(def, mats);
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
