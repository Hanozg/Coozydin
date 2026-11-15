import * as THREE from 'three';
import { ColliderBox, LandmarkDef } from '../../types/game';
import { CityMaterialLibrary } from '../materials';
import { addBoxCollider, BuiltLandmark, makeDiscoveryRing } from './shared';

/**
 * 1. Tralleis Antik Kenti — Üç Gözler (Roman Gymnasium Triple Arch)
 */
export function buildTralleis(def: LandmarkDef, mats: CityMaterialLibrary): BuiltLandmark {
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

  // South stepped travertine apron meeting Tralleis Yokuşu approach spur cleanly
  const southStep = new THREE.Mesh(new THREE.BoxGeometry(6.8, 0.34, 1.3), mats.travertine);
  southStep.position.set(0, 0.17, 5.05);
  southStep.receiveShadow = true;
  group.add(southStep);

  const ringMesh = makeDiscoveryRing(lx, lz + 6.6);
  const colliders: ColliderBox[] = [];
  addBoxCollider(colliders, lx, lz, 17, 9, 9.2);

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
export function buildMagnesia(def: LandmarkDef, mats: CityMaterialLibrary): BuiltLandmark {
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
