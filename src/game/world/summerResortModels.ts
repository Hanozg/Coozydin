import * as THREE from 'three';
import { ColliderBox, SandboxCustomHouseSpec } from '../../types/game';
import { CityMaterialLibrary } from '../materials';
import { CustomHouseSpawnResult } from '../sandboxManager';
import { getTerrainHeightAt } from '../terrain';

interface ResortPalette {
  deepSea: THREE.MeshStandardMaterial;
  seaFoam: THREE.MeshStandardMaterial;
  turquoiseFabric: THREE.MeshStandardMaterial;
  coralFabric: THREE.MeshStandardMaterial;
  sunYellow: THREE.MeshStandardMaterial;
  creamFabric: THREE.MeshStandardMaterial;
  navyHull: THREE.MeshStandardMaterial;
  strawThatch: THREE.MeshStandardMaterial;
  strawDark: THREE.MeshStandardMaterial;
  rescueRed: THREE.MeshStandardMaterial;
  duneGrass: THREE.MeshStandardMaterial;
  courtLine: THREE.MeshStandardMaterial;
  netRope: THREE.MeshStandardMaterial;
  chromeSteel: THREE.MeshStandardMaterial;
  all: THREE.Material[];
}

const paletteCache = new WeakMap<CityMaterialLibrary, ResortPalette>();

function getResortPalette(
  mats: CityMaterialLibrary,
  localDisposables?: { dispose: () => void }[]
): ResortPalette {
  const cached = paletteCache.get(mats);
  if (cached) return cached;

  const deepSea = new THREE.MeshStandardMaterial({
    color: 0x0f5d7a,
    roughness: 0.45,
    metalness: 0.06,
  });
  const seaFoam = new THREE.MeshStandardMaterial({
    color: 0xf4fbff,
    roughness: 0.62,
    metalness: 0.02,
    transparent: true,
    opacity: 0.84,
    polygonOffset: true,
    polygonOffsetFactor: -2,
    polygonOffsetUnits: -2,
  });
  const turquoiseFabric = new THREE.MeshStandardMaterial({
    color: 0x269eb3,
    roughness: 0.86,
    metalness: 0.02,
  });
  const coralFabric = new THREE.MeshStandardMaterial({
    color: 0xe2684b,
    roughness: 0.86,
    metalness: 0.02,
  });
  const sunYellow = new THREE.MeshStandardMaterial({
    color: 0xf2bf49,
    roughness: 0.78,
    metalness: 0.04,
  });
  const creamFabric = new THREE.MeshStandardMaterial({
    color: 0xfaf3e3,
    roughness: 0.88,
    metalness: 0.01,
    side: THREE.DoubleSide,
  });
  const navyHull = new THREE.MeshStandardMaterial({
    color: 0x1e4366,
    roughness: 0.34,
    metalness: 0.14,
  });
  const strawThatch = new THREE.MeshStandardMaterial({
    color: 0xd9b36c,
    roughness: 0.94,
    metalness: 0.0,
  });
  const strawDark = new THREE.MeshStandardMaterial({
    color: 0xb68d4c,
    roughness: 0.95,
    metalness: 0.0,
  });
  const rescueRed = new THREE.MeshStandardMaterial({
    color: 0xd63c2b,
    roughness: 0.46,
    metalness: 0.08,
  });
  const duneGrass = new THREE.MeshStandardMaterial({
    color: 0x6f964e,
    roughness: 0.9,
    metalness: 0.0,
  });
  const courtLine = new THREE.MeshStandardMaterial({
    color: 0xfbf7ee,
    roughness: 0.72,
    metalness: 0.02,
    polygonOffset: true,
    polygonOffsetFactor: -2,
    polygonOffsetUnits: -2,
  });
  const netRope = new THREE.MeshStandardMaterial({
    color: 0xf5efe2,
    roughness: 0.85,
    metalness: 0.0,
  });
  const chromeSteel = new THREE.MeshStandardMaterial({
    color: 0xdde3e8,
    roughness: 0.22,
    metalness: 0.88,
  });

  const all: THREE.Material[] = [
    deepSea,
    seaFoam,
    turquoiseFabric,
    coralFabric,
    sunYellow,
    creamFabric,
    navyHull,
    strawThatch,
    strawDark,
    rescueRed,
    duneGrass,
    courtLine,
    netRope,
    chromeSteel,
  ];

  const palette: ResortPalette = {
    deepSea,
    seaFoam,
    turquoiseFabric,
    coralFabric,
    sunYellow,
    creamFabric,
    navyHull,
    strawThatch,
    strawDark,
    rescueRed,
    duneGrass,
    courtLine,
    netRope,
    chromeSteel,
    all,
  };

  paletteCache.set(mats, palette);
  if (localDisposables) {
    localDisposables.push({
      dispose: () => {
        all.forEach((m) => m.dispose());
      },
    });
  }
  return palette;
}

function makeRoundedRectShape(w: number, d: number, r: number): THREE.Shape {
  const hw = w * 0.5;
  const hd = d * 0.5;
  const cr = Math.min(r, hw * 0.8, hd * 0.8);
  const s = new THREE.Shape();
  s.moveTo(-hw + cr, -hd);
  s.lineTo(hw - cr, -hd);
  s.quadraticCurveTo(hw, -hd, hw, -hd + cr);
  s.lineTo(hw, hd - cr);
  s.quadraticCurveTo(hw, hd, hw - cr, hd);
  s.lineTo(-hw + cr, hd);
  s.quadraticCurveTo(-hw, hd, -hw, hd - cr);
  s.lineTo(-hw, -hd + cr);
  s.quadraticCurveTo(-hw, -hd, -hw + cr, -hd);
  return s;
}

function makeCollider(
  sx: number,
  sz: number,
  rotY: number,
  localCx: number,
  localCz: number,
  halfW: number,
  halfD: number,
  maxY: number
): ColliderBox {
  const cosR = Math.cos(rotY);
  const sinR = Math.sin(rotY);
  const wx = sx + localCx * cosR + localCz * sinR;
  const wz = sz - localCx * sinR + localCz * cosR;
  const effHW = Math.abs(halfW * cosR) + Math.abs(halfD * sinR);
  const effHD = Math.abs(halfW * sinR) + Math.abs(halfD * cosR);
  return {
    minX: wx - effHW,
    maxX: wx + effHW,
    minZ: wz - effHD,
    maxZ: wz + effHD,
    maxY,
  };
}

function addShadowMesh(
  parent: THREE.Object3D,
  geo: THREE.BufferGeometry,
  mat: THREE.Material,
  x: number,
  y: number,
  z: number,
  cast = true,
  receive = true
): THREE.Mesh {
  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.set(x, y, z);
  mesh.castShadow = cast;
  mesh.receiveShadow = receive;
  parent.add(mesh);
  return mesh;
}

function buildSeaCove(
  group: THREE.Group,
  mats: CityMaterialLibrary,
  pal: ResortPalette
): void {
  // 1. Golden sand cove apron (rounded oval footprint, flat walkable)
  const baseShape = makeRoundedRectShape(16.0, 12.0, 4.2);
  const sandGeo = new THREE.ExtrudeGeometry(baseShape, {
    depth: 0.14,
    bevelEnabled: true,
    bevelThickness: 0.04,
    bevelSize: 0.14,
    bevelSegments: 2,
  });
  sandGeo.rotateX(Math.PI / 2);
  addShadowMesh(group, sandGeo, mats.beachSand, 0, 0.16, 0, false, true);

  // 2. Deep Aegean seabed beneath the turquoise sea bay
  const bayShape = makeRoundedRectShape(14.4, 7.6, 3.2);
  const seabedGeo = new THREE.ShapeGeometry(bayShape, 18);
  seabedGeo.rotateX(-Math.PI / 2);
  addShadowMesh(group, seabedGeo, pal.deepSea, 0, 0.18, -1.7, false, true);

  // 3. Translucent turquoise Aegean sea water surface
  const waterGeo = new THREE.ShapeGeometry(bayShape, 18);
  waterGeo.rotateX(-Math.PI / 2);
  addShadowMesh(group, waterGeo, mats.seaWater, 0, 0.24, -1.7, false, true);

  // 4. Scalloped white sea-foam shoreline wave strips
  for (let i = 0; i < 4; i++) {
    const fw = 3.2 + (i % 2) * 0.7;
    const fx = -4.5 + i * 3.0;
    const fz = 1.95 + (i % 2 === 0 ? 0.18 : -0.14);
    const foamGeo = new THREE.CapsuleGeometry(0.18, fw, 4, 8);
    foamGeo.rotateZ(Math.PI / 2);
    foamGeo.scale(1, 0.18, 1);
    addShadowMesh(group, foamGeo, pal.seaFoam, fx, 0.26, fz, false, false);
  }

  // 5. Coastal Aegean limestone boulders framing both ends of the cove
  const rocks: [number, number, number, number][] = [
    [-6.6, 0.35, -3.2, 1.05],
    [-7.1, 0.24, -1.8, 0.72],
    [-6.4, 0.22, 1.4, 0.65],
    [6.5, 0.38, -2.8, 1.15],
    [7.0, 0.25, -1.3, 0.75],
    [6.2, 0.22, 1.6, 0.6],
  ];
  for (const [rx, ry, rz, rs] of rocks) {
    const rGeo = new THREE.DodecahedronGeometry(rs, 1);
    rGeo.scale(1.15, 0.58, 0.92);
    const rock = addShadowMesh(group, rGeo, mats.travertine, rx, ry, rz, true, true);
    rock.rotation.y = rx * 0.7 + rz;
  }

  // 6. Floating swim-zone buoys & safety rope line
  const buoyPositions: [number, number][] = [
    [-3.6, -3.4],
    [0.0, -3.8],
    [3.6, -3.4],
  ];
  for (const [bx, bz] of buoyPositions) {
    addShadowMesh(
      group,
      new THREE.SphereGeometry(0.24, 12, 10),
      pal.coralFabric,
      bx,
      0.34,
      bz,
      true,
      false
    );
    addShadowMesh(
      group,
      new THREE.TorusGeometry(0.23, 0.045, 6, 14),
      pal.creamFabric,
      bx,
      0.36,
      bz,
      false,
      false
    ).rotation.x = Math.PI / 2;
  }
  const ropePts = [
    new THREE.Vector3(-3.6, 0.3, -3.4),
    new THREE.Vector3(0.0, 0.29, -3.8),
    new THREE.Vector3(3.6, 0.3, -3.4),
  ];
  const ropeCurve = new THREE.CatmullRomCurve3(ropePts);
  addShadowMesh(
    group,
    new THREE.TubeGeometry(ropeCurve, 18, 0.03, 6, false),
    pal.creamFabric,
    0,
    0,
    0,
    false,
    false
  );
}

function buildSandBeach(
  group: THREE.Group,
  mats: CityMaterialLibrary,
  pal: ResortPalette
): void {
  // 1. Sculpted golden Aegean sand pad
  const padShape = makeRoundedRectShape(12.0, 10.0, 2.8);
  const sandGeo = new THREE.ExtrudeGeometry(padShape, {
    depth: 0.14,
    bevelEnabled: true,
    bevelThickness: 0.04,
    bevelSize: 0.14,
    bevelSegments: 2,
  });
  sandGeo.rotateX(Math.PI / 2);
  addShadowMesh(group, sandGeo, mats.beachSand, 0, 0.16, 0, false, true);

  // 2. Wooden slat boardwalk entry walkway
  for (let i = 0; i < 8; i++) {
    addShadowMesh(
      group,
      new THREE.BoxGeometry(1.7, 0.06, 0.34),
      mats.woodDeck,
      0,
      0.21,
      4.5 - i * 0.44,
      true,
      true
    );
  }

  // 3. Two woven beach towels spread on the sand
  const towelA = addShadowMesh(
    group,
    new THREE.BoxGeometry(1.25, 0.035, 2.15),
    pal.turquoiseFabric,
    -2.9,
    0.2,
    -0.8,
    false,
    true
  );
  towelA.rotation.y = 0.16;
  const stripeA = addShadowMesh(
    group,
    new THREE.BoxGeometry(1.26, 0.04, 0.32),
    pal.creamFabric,
    -2.9,
    0.205,
    -0.8,
    false,
    true
  );
  stripeA.rotation.y = 0.16;

  const towelB = addShadowMesh(
    group,
    new THREE.BoxGeometry(1.25, 0.035, 2.15),
    pal.coralFabric,
    3.1,
    0.2,
    -1.1,
    false,
    true
  );
  towelB.rotation.y = -0.22;
  const stripeB = addShadowMesh(
    group,
    new THREE.BoxGeometry(1.26, 0.04, 0.32),
    pal.sunYellow,
    3.1,
    0.205,
    -1.1,
    false,
    true
  );
  stripeB.rotation.y = -0.22;

  // 4. Beach ball resting on the sand
  addShadowMesh(
    group,
    new THREE.SphereGeometry(0.28, 14, 12),
    pal.sunYellow,
    -1.1,
    0.45,
    -1.9,
    true,
    false
  );
  addShadowMesh(
    group,
    new THREE.TorusGeometry(0.26, 0.055, 8, 16),
    pal.coralFabric,
    -1.1,
    0.45,
    -1.9,
    false,
    false
  );

  // 5. Coastal dune tufts & sea shells on outer sand edges
  const tufts: [number, number][] = [
    [-4.6, 3.4],
    [-4.9, 2.6],
    [4.7, 3.2],
    [4.4, -3.5],
    [-4.5, -3.4],
  ];
  for (const [tx, tz] of tufts) {
    for (let b = 0; b < 4; b++) {
      const blade = addShadowMesh(
        group,
        new THREE.ConeGeometry(0.12, 0.65, 5),
        pal.duneGrass,
        tx + Math.cos(b * 1.6) * 0.18,
        0.44,
        tz + Math.sin(b * 1.6) * 0.18,
        true,
        false
      );
      blade.rotation.z = Math.cos(b * 1.6) * 0.28;
      blade.rotation.x = Math.sin(b * 1.6) * 0.24;
    }
  }
}

function buildSunLoungers(
  group: THREE.Group,
  mats: CityMaterialLibrary,
  pal: ResortPalette,
  sx: number,
  sz: number,
  rotY: number,
  gy: number
): ColliderBox[] {
  // 1. Subtle sand plinth beneath lounger set
  const padGeo = new THREE.CylinderGeometry(2.75, 2.95, 0.08, 22);
  padGeo.scale(1.06, 1, 0.82);
  addShadowMesh(group, padGeo, mats.beachSand, 0, 0.04, 0, false, true);

  // 2. Two reclining resort sun loungers
  const loungerSpecs: { x: number; mat: THREE.Material }[] = [
    { x: -1.45, mat: pal.turquoiseFabric },
    { x: 1.45, mat: pal.coralFabric },
  ];
  for (const l of loungerSpecs) {
    const bed = new THREE.Group();
    bed.position.set(l.x, 0.08, 0.15);

    // Legs (4)
    for (const lx of [-0.36, 0.36]) {
      for (const lz of [-0.88, 0.78]) {
        addShadowMesh(
          bed,
          new THREE.BoxGeometry(0.08, 0.34, 0.08),
          mats.darkTimber,
          lx,
          0.17,
          lz
        );
      }
    }
    // Teak horizontal frame
    addShadowMesh(bed, new THREE.BoxGeometry(0.92, 0.09, 1.45), mats.woodDeck, 0, 0.34, 0.26);
    // Cream cushion
    addShadowMesh(bed, new THREE.BoxGeometry(0.82, 0.08, 1.36), pal.creamFabric, 0, 0.42, 0.26);
    // Reclined backrest + cushion
    const backFrame = addShadowMesh(
      bed,
      new THREE.BoxGeometry(0.92, 0.09, 0.78),
      mats.woodDeck,
      0,
      0.58,
      -0.74
    );
    backFrame.rotation.x = 0.62;
    const backCush = addShadowMesh(
      bed,
      new THREE.BoxGeometry(0.82, 0.08, 0.72),
      pal.creamFabric,
      0,
      0.64,
      -0.7
    );
    backCush.rotation.x = 0.62;
    // Draped colorful beach towel
    addShadowMesh(bed, new THREE.BoxGeometry(0.76, 0.04, 0.96), l.mat, 0, 0.47, 0.42);
    // Rolled head pillow
    const pillow = addShadowMesh(
      bed,
      new THREE.CylinderGeometry(0.08, 0.08, 0.54, 10),
      l.mat,
      0,
      0.84,
      -0.88
    );
    pillow.rotation.z = Math.PI / 2;

    group.add(bed);
  }

  // 3. Central teak side table + 2 chilled summer drinks
  addShadowMesh(group, new THREE.CylinderGeometry(0.42, 0.42, 0.06, 16), mats.woodDeck, 0, 0.56, 0.05);
  addShadowMesh(group, new THREE.CylinderGeometry(0.06, 0.08, 0.52, 10), mats.darkTimber, 0, 0.28, 0.05);
  addShadowMesh(group, new THREE.CylinderGeometry(0.28, 0.32, 0.05, 14), mats.darkTimber, 0, 0.09, 0.05);
  addShadowMesh(group, new THREE.CylinderGeometry(0.06, 0.045, 0.16, 10), pal.sunYellow, -0.14, 0.67, 0.12);
  addShadowMesh(group, new THREE.CylinderGeometry(0.06, 0.045, 0.16, 10), pal.coralFabric, 0.15, 0.67, -0.04);

  // 4. Tall octagonal beach umbrella with alternating turquoise & cream panels
  const umb = new THREE.Group();
  umb.position.set(0, 0.08, -0.58);
  umb.rotation.z = 0.08;
  addShadowMesh(umb, new THREE.CylinderGeometry(0.045, 0.05, 2.65, 10), mats.woodDeck, 0, 1.32, 0);
  // Multi-panel striped umbrella dome
  const canopy = new THREE.Group();
  canopy.position.set(0, 2.52, 0);
  const segCount = 8;
  const segAngle = (Math.PI * 2) / segCount;
  for (let i = 0; i < segCount; i++) {
    const wedgeGeo = new THREE.ConeGeometry(
      1.68,
      0.56,
      1,
      1,
      true,
      i * segAngle,
      segAngle
    );
    const panelMat = i % 2 === 0 ? pal.turquoiseFabric : pal.creamFabric;
    const panel = new THREE.Mesh(wedgeGeo, panelMat);
    panel.castShadow = true;
    panel.receiveShadow = true;
    canopy.add(panel);
  }
  // Scalloped underside rim + brass top finial
  addShadowMesh(canopy, new THREE.CylinderGeometry(1.66, 1.7, 0.12, 16, 1, true), pal.creamFabric, 0, -0.32, 0, false, false);
  addShadowMesh(canopy, new THREE.SphereGeometry(0.09, 10, 8), mats.brass, 0, 0.32, 0);
  umb.add(canopy);
  group.add(umb);

  return [makeCollider(sx, sz, rotY, 0, 0, 2.3, 1.7, gy + 2.8)];
}

function buildBeachVolleyball(
  group: THREE.Group,
  mats: CityMaterialLibrary,
  pal: ResortPalette,
  sx: number,
  sz: number,
  rotY: number,
  gy: number
): ColliderBox[] {
  const courtW = 13.6;
  const courtD = 8.2;

  // 1. Deep golden sand court bed
  addShadowMesh(group, new THREE.BoxGeometry(courtW, 0.16, courtD), mats.beachSand, 0, 0.08, 0, false, true);

  // 2. Timber perimeter retaining beams
  addShadowMesh(group, new THREE.BoxGeometry(courtW + 0.36, 0.22, 0.2), mats.woodDeck, 0, 0.11, -courtD * 0.5 - 0.08);
  addShadowMesh(group, new THREE.BoxGeometry(courtW + 0.36, 0.22, 0.2), mats.woodDeck, 0, 0.11, courtD * 0.5 + 0.08);
  addShadowMesh(group, new THREE.BoxGeometry(0.2, 0.22, courtD + 0.16), mats.woodDeck, -courtW * 0.5 - 0.08, 0.11, 0);
  addShadowMesh(group, new THREE.BoxGeometry(0.2, 0.22, courtD + 0.16), mats.woodDeck, courtW * 0.5 + 0.08, 0.11, 0);

  // 3. Crisp white boundary court tape lines
  const playW = 11.4;
  const playD = 6.2;
  const lineY = 0.18;
  addShadowMesh(group, new THREE.BoxGeometry(playW, 0.02, 0.12), pal.courtLine, 0, lineY, -playD * 0.5, false, false);
  addShadowMesh(group, new THREE.BoxGeometry(playW, 0.02, 0.12), pal.courtLine, 0, lineY, playD * 0.5, false, false);
  addShadowMesh(group, new THREE.BoxGeometry(0.12, 0.02, playD), pal.courtLine, -playW * 0.5, lineY, 0, false, false);
  addShadowMesh(group, new THREE.BoxGeometry(0.12, 0.02, playD), pal.courtLine, playW * 0.5, lineY, 0, false, false);
  addShadowMesh(group, new THREE.BoxGeometry(0.09, 0.02, playD), pal.courtLine, 0, lineY, 0, false, false);

  // 4. Two painted net poles with guy-lines
  const postZ = 3.55;
  for (const s of [-1, 1]) {
    addShadowMesh(group, new THREE.CylinderGeometry(0.09, 0.1, 2.75, 12), pal.rescueRed, 0, 1.44, s * postZ);
    addShadowMesh(group, new THREE.CylinderGeometry(0.12, 0.12, 0.22, 12), pal.creamFabric, 0, 2.78, s * postZ);
    // Angled tension rope
    const guy = addShadowMesh(
      group,
      new THREE.CylinderGeometry(0.018, 0.018, 2.7, 6),
      pal.netRope,
      0,
      1.35,
      s * (postZ + 0.42),
      false,
      false
    );
    guy.rotation.x = s * 0.34;
  }

  // 5. Volleyball net (top/bottom white tapes + crisscross 3D mesh lines)
  const netLen = postZ * 2 - 0.16;
  const netBot = 1.48;
  const netTop = 2.48;
  addShadowMesh(group, new THREE.BoxGeometry(0.05, 0.1, netLen), pal.courtLine, 0, netTop, 0, true, false);
  addShadowMesh(group, new THREE.BoxGeometry(0.04, 0.06, netLen), pal.courtLine, 0, netBot, 0, false, false);
  // Vertical & horizontal net cords
  for (let i = 0; i <= 14; i++) {
    const nz = -netLen * 0.5 + (i / 14) * netLen;
    addShadowMesh(
      group,
      new THREE.BoxGeometry(0.018, netTop - netBot, 0.018),
      pal.netRope,
      0,
      (netTop + netBot) * 0.5,
      nz,
      false,
      false
    );
  }
  for (let r = 1; r <= 3; r++) {
    const ny = netBot + (r / 4) * (netTop - netBot);
    addShadowMesh(group, new THREE.BoxGeometry(0.018, 0.018, netLen), pal.netRope, 0, ny, 0, false, false);
  }

  // 6. Colorful beach volleyball resting on the court
  addShadowMesh(group, new THREE.SphereGeometry(0.24, 14, 12), pal.sunYellow, 2.1, 0.4, 0.9, true, false);
  const band = addShadowMesh(group, new THREE.TorusGeometry(0.225, 0.042, 6, 14), pal.turquoiseFabric, 2.1, 0.4, 0.9, false, false);
  band.rotation.y = 0.7;

  // 7. Wooden referee stand & scoreboard on the sideline
  const refX = 0.0;
  const refZ = -postZ - 0.85;
  addShadowMesh(group, new THREE.BoxGeometry(0.75, 0.08, 0.75), mats.woodDeck, refX, 1.35, refZ);
  for (const lx of [-0.3, 0.3]) {
    for (const lz of [-0.3, 0.3]) {
      addShadowMesh(group, new THREE.BoxGeometry(0.08, 1.45, 0.08), mats.darkTimber, refX + lx, 0.72, refZ + lz);
    }
  }
  addShadowMesh(group, new THREE.BoxGeometry(0.68, 0.48, 0.08), pal.navyHull, refX, 1.82, refZ - 0.3);
  addShadowMesh(group, new THREE.BoxGeometry(0.24, 0.32, 0.09), pal.creamFabric, refX - 0.16, 1.82, refZ - 0.29);
  addShadowMesh(group, new THREE.BoxGeometry(0.24, 0.32, 0.09), pal.sunYellow, refX + 0.16, 1.82, refZ - 0.29);

  // Only net posts + referee stand block collision so players can run across the sand!
  return [
    makeCollider(sx, sz, rotY, 0, postZ, 0.4, 0.4, gy + 2.8),
    makeCollider(sx, sz, rotY, 0, -postZ - 0.45, 0.65, 0.95, gy + 2.8),
  ];
}

function buildWoodenPier(
  group: THREE.Group,
  mats: CityMaterialLibrary,
  pal: ResortPalette,
  sx: number,
  sz: number,
  rotY: number,
  gy: number
): ColliderBox[] {
  const pierW = 4.0;
  const pierL = 11.4;
  const deckY = 0.62;

  // 1. Main sunlit teak deck surface
  addShadowMesh(group, new THREE.BoxGeometry(pierW, 0.16, pierL), mats.woodDeck, 0, deckY, 0, true, true);
  // Longitudinal side trim beams
  addShadowMesh(group, new THREE.BoxGeometry(0.16, 0.22, pierL + 0.1), mats.darkTimber, -pierW * 0.5, deckY - 0.02, 0);
  addShadowMesh(group, new THREE.BoxGeometry(0.16, 0.22, pierL + 0.1), mats.darkTimber, pierW * 0.5, deckY - 0.02, 0);

  // 2. Stepped wooden entrance ramp on the south shore end
  const ramp = addShadowMesh(
    group,
    new THREE.BoxGeometry(3.4, 0.12, 1.45),
    mats.woodDeck,
    0,
    deckY * 0.5,
    pierL * 0.5 + 0.58
  );
  ramp.rotation.x = 0.39;

  // 3. Twelve timber pilings & rope mooring bollards along both sides
  const zStops = [-5.0, -2.5, 0.0, 2.5, 5.0];
  for (const pz of zStops) {
    for (const side of [-1, 1]) {
      const px = side * (pierW * 0.5 - 0.18);
      addShadowMesh(group, new THREE.CylinderGeometry(0.16, 0.18, deckY + 0.58, 10), mats.darkTimber, px, (deckY + 0.58) * 0.5, pz);
      addShadowMesh(group, new THREE.CylinderGeometry(0.2, 0.2, 0.08, 10), mats.brass, px, deckY + 0.58, pz);
    }
  }

  // Draped hemp rope connecting bollards on left and right sides
  for (const side of [-1, 1]) {
    const rx = side * (pierW * 0.5 - 0.18);
    for (let i = 0; i < zStops.length - 1; i++) {
      const za = zStops[i];
      const zb = zStops[i + 1];
      const ropeCurve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(rx, deckY + 0.44, za),
        new THREE.Vector3(rx, deckY + 0.26, (za + zb) * 0.5),
        new THREE.Vector3(rx, deckY + 0.44, zb),
      ]);
      addShadowMesh(
        group,
        new THREE.TubeGeometry(ropeCurve, 10, 0.035, 6, false),
        pal.strawThatch,
        0,
        0,
        0,
        false,
        false
      );
    }
  }

  // 4. Two warm harbor brass lanterns at the front tip
  for (const side of [-1, 1]) {
    const lx = side * (pierW * 0.5 - 0.18);
    addShadowMesh(group, new THREE.CylinderGeometry(0.14, 0.14, 0.24, 8), mats.lampBulb, lx, deckY + 0.72, -5.0, false, false);
    addShadowMesh(group, new THREE.ConeGeometry(0.22, 0.14, 8), mats.brass, lx, deckY + 0.9, -5.0);
  }

  // 5. Stainless steel swimming ladder at the front edge
  const ladZ = -pierL * 0.5 - 0.08;
  for (const lx of [-0.34, 0.34]) {
    addShadowMesh(group, new THREE.CylinderGeometry(0.032, 0.032, 1.15, 8), pal.chromeSteel, lx, deckY - 0.05, ladZ);
    const arch = addShadowMesh(group, new THREE.TorusGeometry(0.18, 0.032, 8, 12, Math.PI), pal.chromeSteel, lx, deckY + 0.52, ladZ + 0.18);
    arch.rotation.y = Math.PI / 2;
  }
  for (let r = 0; r < 3; r++) {
    const rung = addShadowMesh(
      group,
      new THREE.CylinderGeometry(0.025, 0.025, 0.68, 8),
      pal.chromeSteel,
      0,
      0.16 + r * 0.26,
      ladZ
    );
    rung.rotation.z = Math.PI / 2;
  }

  // 6. Seaside teak bench near the pier middle
  addShadowMesh(group, new THREE.BoxGeometry(0.62, 0.08, 1.9), mats.woodDeck, -1.25, deckY + 0.42, -1.2);
  addShadowMesh(group, new THREE.BoxGeometry(0.1, 0.38, 0.1), mats.darkTimber, -1.25, deckY + 0.22, -1.95);
  addShadowMesh(group, new THREE.BoxGeometry(0.1, 0.38, 0.1), mats.darkTimber, -1.25, deckY + 0.22, -0.45);

  return [
    makeCollider(sx, sz, rotY, -1.35, -1.2, 0.45, 1.0, gy + 1.4),
    makeCollider(sx, sz, rotY, 0, -5.2, 1.8, 0.5, gy + 1.6),
  ];
}

function buildBeachCabana(
  group: THREE.Group,
  mats: CityMaterialLibrary,
  pal: ResortPalette,
  sx: number,
  sz: number,
  rotY: number,
  gy: number
): ColliderBox[] {
  // 1. Raised teak cabana deck + front step
  addShadowMesh(group, new THREE.BoxGeometry(6.0, 0.26, 5.0), mats.woodDeck, 0, 0.13, 0);
  addShadowMesh(group, new THREE.BoxGeometry(2.6, 0.14, 0.55), mats.woodDeck, 0, 0.07, 2.75);

  // 2. Four sturdy timber corner posts + top eaves frame
  for (const px of [-2.65, 2.65]) {
    for (const pz of [-2.15, 2.15]) {
      addShadowMesh(group, new THREE.CylinderGeometry(0.12, 0.14, 2.95, 10), mats.darkTimber, px, 1.72, pz);
    }
  }
  addShadowMesh(group, new THREE.BoxGeometry(5.6, 0.14, 0.14), mats.darkTimber, 0, 3.16, -2.15);
  addShadowMesh(group, new THREE.BoxGeometry(5.6, 0.14, 0.14), mats.darkTimber, 0, 3.16, 2.15);
  addShadowMesh(group, new THREE.BoxGeometry(0.14, 0.14, 4.5), mats.darkTimber, -2.65, 3.16, 0);
  addShadowMesh(group, new THREE.BoxGeometry(0.14, 0.14, 4.5), mats.darkTimber, 2.65, 3.16, 0);

  // 3. Layered woven-straw thatched hip roof
  const lowerThatch = addShadowMesh(group, new THREE.ConeGeometry(4.45, 1.15, 4), pal.strawDark, 0, 3.68, 0);
  lowerThatch.rotation.y = Math.PI / 4;
  lowerThatch.scale.set(1.08, 1, 0.92);
  const upperThatch = addShadowMesh(group, new THREE.ConeGeometry(3.6, 1.18, 4), pal.strawThatch, 0, 4.22, 0);
  upperThatch.rotation.y = Math.PI / 4;
  upperThatch.scale.set(1.06, 1, 0.9);
  // Roof peak bamboo finial
  addShadowMesh(group, new THREE.CylinderGeometry(0.08, 0.12, 0.45, 8), mats.darkTimber, 0, 4.92, 0);

  // 4. Coastal turquoise tiled beach bar counter + teak top
  addShadowMesh(group, new THREE.BoxGeometry(3.6, 1.02, 0.78), pal.turquoiseFabric, 0, 0.77, 0.55);
  addShadowMesh(group, new THREE.BoxGeometry(3.85, 0.1, 0.96), mats.woodDeck, 0, 1.32, 0.55);
  // Back shelf unit with summer drinks & fruit basket
  addShadowMesh(group, new THREE.BoxGeometry(3.4, 1.35, 0.48), mats.creamPlaster, 0, 0.94, -1.65);
  addShadowMesh(group, new THREE.BoxGeometry(3.5, 0.08, 0.56), mats.woodDeck, 0, 1.65, -1.65);
  for (let i = 0; i < 4; i++) {
    addShadowMesh(
      group,
      new THREE.CylinderGeometry(0.07, 0.08, 0.28, 8),
      i % 2 === 0 ? pal.coralFabric : pal.sunYellow,
      -1.0 + i * 0.65,
      1.52,
      0.55
    );
  }

  // 5. Three woven barstools in front of the counter
  for (const bx of [-1.15, 0, 1.15]) {
    addShadowMesh(group, new THREE.CylinderGeometry(0.24, 0.22, 0.08, 12), pal.strawThatch, bx, 0.96, 1.48);
    addShadowMesh(group, new THREE.CylinderGeometry(0.045, 0.06, 0.7, 8), mats.darkTimber, bx, 0.6, 1.48);
  }

  // 6. Tied-back cream linen side curtains + glowing warm string bulbs
  for (const cx of [-2.52, 2.52]) {
    addShadowMesh(group, new THREE.CylinderGeometry(0.18, 0.26, 2.75, 10), pal.creamFabric, cx, 1.66, 2.02);
  }
  for (let i = 0; i < 5; i++) {
    addShadowMesh(group, new THREE.SphereGeometry(0.075, 8, 8), mats.lampBulb, -2.0 + i * 1.0, 3.04, 2.15, false, false);
  }

  return [makeCollider(sx, sz, rotY, 0, 0, 3.05, 2.55, gy + 5.1)];
}

function buildLifeguardTower(
  group: THREE.Group,
  mats: CityMaterialLibrary,
  pal: ResortPalette,
  sx: number,
  sz: number,
  rotY: number,
  gy: number
): ColliderBox[] {
  // 1. Small sand mound base
  addShadowMesh(group, new THREE.CylinderGeometry(2.15, 2.35, 0.08, 18), mats.beachSand, 0, 0.04, 0, false, true);

  // 2. Four angled timber stilts raising watch deck to y = 2.05
  const legPos: [number, number][] = [
    [-1.08, -1.08],
    [1.08, -1.08],
    [-1.08, 1.08],
    [1.08, 1.08],
  ];
  for (const [lx, lz] of legPos) {
    const stilt = addShadowMesh(group, new THREE.BoxGeometry(0.14, 2.2, 0.14), mats.woodDeck, lx * 0.88, 1.08, lz * 0.88);
    stilt.rotation.z = lx > 0 ? 0.12 : -0.12;
    stilt.rotation.x = lz > 0 ? -0.12 : 0.12;
  }
  // X cross-bracing on left and right sides
  for (const sxSide of [-0.94, 0.94]) {
    const braceA = addShadowMesh(group, new THREE.BoxGeometry(0.06, 2.25, 0.08), mats.whitePlaster, sxSide, 1.06, 0);
    braceA.rotation.x = 0.74;
    const braceB = addShadowMesh(group, new THREE.BoxGeometry(0.06, 2.25, 0.08), mats.whitePlaster, sxSide, 1.06, 0);
    braceB.rotation.x = -0.74;
  }

  // 3. Elevated observation deck + white safety railings
  const deckY = 2.12;
  addShadowMesh(group, new THREE.BoxGeometry(2.35, 0.14, 2.35), mats.woodDeck, 0, deckY, 0);
  // Corner upper posts
  for (const [ux, uz] of [
    [-1.05, -1.05],
    [1.05, -1.05],
    [-1.05, 1.05],
    [1.05, 1.05],
  ]) {
    addShadowMesh(group, new THREE.BoxGeometry(0.1, 1.85, 0.1), mats.whitePlaster, ux, deckY + 0.96, uz);
  }
  // Safety railing panels (back, left, right, half-front)
  addShadowMesh(group, new THREE.BoxGeometry(2.2, 0.1, 0.08), mats.whitePlaster, 0, deckY + 0.82, -1.05);
  addShadowMesh(group, new THREE.BoxGeometry(0.08, 0.1, 2.2), mats.whitePlaster, -1.05, deckY + 0.82, 0);
  addShadowMesh(group, new THREE.BoxGeometry(0.08, 0.1, 2.2), mats.whitePlaster, 1.05, deckY + 0.82, 0);
  addShadowMesh(group, new THREE.BoxGeometry(2.2, 0.45, 0.08), pal.rescueRed, 0, deckY + 0.35, -1.05);

  // 4. Striped coastal sun canopy roof
  const roof = addShadowMesh(group, new THREE.ConeGeometry(2.05, 0.88, 4), mats.stripedAwning, 0, deckY + 2.3, 0);
  roof.rotation.y = Math.PI / 4;

  // 5. Slanted wooden front ladder with rungs
  const ladderGroup = new THREE.Group();
  ladderGroup.position.set(0, 1.08, 1.48);
  ladderGroup.rotation.x = -0.32;
  addShadowMesh(ladderGroup, new THREE.BoxGeometry(0.08, 2.32, 0.08), mats.woodDeck, -0.34, 0, 0);
  addShadowMesh(ladderGroup, new THREE.BoxGeometry(0.08, 2.32, 0.08), mats.woodDeck, 0.34, 0, 0);
  for (let i = 0; i < 6; i++) {
    addShadowMesh(ladderGroup, new THREE.BoxGeometry(0.7, 0.055, 0.06), mats.whitePlaster, 0, -0.92 + i * 0.36, 0);
  }
  group.add(ladderGroup);

  // 6. Red-and-white lifebuoy ring mounted on rail + rescue surfboard + red flag
  addShadowMesh(group, new THREE.TorusGeometry(0.32, 0.095, 10, 18), pal.rescueRed, 0.52, deckY + 0.45, 1.12);
  addShadowMesh(group, new THREE.BoxGeometry(0.14, 0.14, 0.22), pal.creamFabric, 0.52, deckY + 0.77, 1.12);
  addShadowMesh(group, new THREE.BoxGeometry(0.14, 0.14, 0.22), pal.creamFabric, 0.52, deckY + 0.13, 1.12);

  // Rescue surfboard leaning on the side
  const boardGeo = new THREE.CapsuleGeometry(0.24, 1.35, 6, 12);
  boardGeo.scale(1, 1, 0.24);
  const board = addShadowMesh(group, boardGeo, pal.sunYellow, -1.28, 0.96, 0.22);
  board.rotation.z = -0.26;
  board.rotation.y = 0.2;

  // Flagpole & red coastal safety flag
  addShadowMesh(group, new THREE.CylinderGeometry(0.03, 0.03, 1.25, 8), pal.chromeSteel, 1.05, deckY + 2.45, -1.05);
  addShadowMesh(group, new THREE.BoxGeometry(0.68, 0.38, 0.03), pal.rescueRed, 1.4, deckY + 2.86, -1.05);

  return [makeCollider(sx, sz, rotY, 0, 0.1, 1.55, 1.65, gy + 5.0)];
}

function buildSailboatAndSurf(
  group: THREE.Group,
  mats: CityMaterialLibrary,
  pal: ResortPalette,
  sx: number,
  sz: number,
  rotY: number,
  gy: number
): ColliderBox[] {
  // 1. Subtle shallow shore cradle (sand + turquoise edge)
  const cradleGeo = new THREE.CylinderGeometry(2.85, 3.05, 0.08, 22);
  cradleGeo.scale(1.12, 1, 0.78);
  addShadowMesh(group, cradleGeo, mats.beachSand, 0, 0.04, 0, false, true);

  // 2. Sculpted Aegean day-sailer boat
  const boat = new THREE.Group();
  boat.position.set(-0.7, 0.14, 0);
  boat.rotation.y = 0.18;

  // Pointed hull shape extruded vertically
  const hullShape = new THREE.Shape();
  hullShape.moveTo(0, -2.15);
  hullShape.quadraticCurveTo(0.92, -0.9, 0.82, 1.45);
  hullShape.lineTo(0.55, 1.85);
  hullShape.lineTo(-0.55, 1.85);
  hullShape.lineTo(-0.82, 1.45);
  hullShape.quadraticCurveTo(-0.92, -0.9, 0, -2.15);

  const hullGeo = new THREE.ExtrudeGeometry(hullShape, {
    depth: 0.52,
    bevelEnabled: true,
    bevelThickness: 0.08,
    bevelSize: 0.07,
    bevelSegments: 2,
  });
  hullGeo.rotateX(Math.PI / 2);
  addShadowMesh(boat, hullGeo, pal.creamFabric, 0, 0.62, 0);

  // Navy blue waterline stripe hull lower band
  const trimGeo = new THREE.ExtrudeGeometry(hullShape, {
    depth: 0.18,
    bevelEnabled: false,
  });
  trimGeo.rotateX(Math.PI / 2);
  trimGeo.scale(1.02, 1, 1.02);
  addShadowMesh(boat, trimGeo, pal.navyHull, 0, 0.3, 0);

  // Teak cockpit deck & bench
  addShadowMesh(boat, new THREE.BoxGeometry(1.15, 0.1, 1.95), mats.woodDeck, 0, 0.64, 0.25);
  addShadowMesh(boat, new THREE.BoxGeometry(1.12, 0.12, 0.36), mats.darkTimber, 0, 0.74, 0.92);

  // Tall aluminum mast + horizontal boom
  addShadowMesh(boat, new THREE.CylinderGeometry(0.045, 0.055, 4.35, 10), pal.chromeSteel, 0, 2.75, -0.22);
  const boom = addShadowMesh(boat, new THREE.CylinderGeometry(0.035, 0.035, 1.95, 8), pal.chromeSteel, 0, 1.24, 0.72);
  boom.rotation.x = Math.PI / 2;

  // Billowing triangular cream mainsail
  const mainSailShape = new THREE.Shape();
  mainSailShape.moveTo(0, 0);
  mainSailShape.lineTo(1.88, 0.05);
  mainSailShape.quadraticCurveTo(1.05, 1.85, 0, 3.42);
  mainSailShape.closePath();
  const mainSailGeo = new THREE.ExtrudeGeometry(mainSailShape, {
    depth: 0.04,
    bevelEnabled: false,
  });
  mainSailGeo.rotateY(-Math.PI / 2);
  const mainSail = addShadowMesh(boat, mainSailGeo, pal.creamFabric, 0.02, 1.28, -0.18);
  mainSail.rotation.y = 0.14;

  // Front jib sail (turquoise accent)
  const jibShape = new THREE.Shape();
  jibShape.moveTo(0, 0);
  jibShape.lineTo(-1.32, 0.04);
  jibShape.quadraticCurveTo(-0.55, 1.45, 0, 2.85);
  jibShape.closePath();
  const jibGeo = new THREE.ExtrudeGeometry(jibShape, { depth: 0.035, bevelEnabled: false });
  jibGeo.rotateY(-Math.PI / 2);
  const jib = addShadowMesh(boat, jibGeo, pal.turquoiseFabric, -0.02, 1.28, -0.26);
  jib.rotation.y = -0.12;

  // Masthead coral pennant
  addShadowMesh(boat, new THREE.BoxGeometry(0.03, 0.22, 0.56), pal.coralFabric, 0, 4.86, 0.06);
  group.add(boat);

  // 3. Wooden surfboard rack with two colorful surfboards beside the boat
  const rack = new THREE.Group();
  rack.position.set(1.85, 0.08, 0.25);
  rack.rotation.y = -0.28;
  addShadowMesh(rack, new THREE.BoxGeometry(1.35, 0.1, 0.7), mats.woodDeck, 0, 0.06, 0);
  for (const rx of [-0.56, 0.56]) {
    addShadowMesh(rack, new THREE.BoxGeometry(0.08, 1.25, 0.08), mats.darkTimber, rx, 0.65, -0.24);
  }
  addShadowMesh(rack, new THREE.BoxGeometry(1.22, 0.08, 0.08), mats.darkTimber, 0, 1.12, -0.24);

  const surfColors = [pal.coralFabric, pal.turquoiseFabric];
  surfColors.forEach((mat, idx) => {
    const sGeo = new THREE.CapsuleGeometry(0.24, 1.38, 6, 12);
    sGeo.scale(1, 1, 0.22);
    const sb = addShadowMesh(rack, sGeo, mat, -0.28 + idx * 0.56, 1.02, -0.02);
    sb.rotation.x = -0.16;
    const stripeGeo = new THREE.BoxGeometry(0.11, 1.56, 0.12);
    const st = addShadowMesh(rack, stripeGeo, pal.sunYellow, -0.28 + idx * 0.56, 1.02, 0.0);
    st.rotation.x = -0.16;
  });
  group.add(rack);

  return [makeCollider(sx, sz, rotY, 0, 0, 2.7, 1.9, gy + 4.9)];
}

export function buildSummerResortModel(
  spec: SandboxCustomHouseSpec,
  mats: CityMaterialLibrary,
  sx: number,
  sz: number,
  sRotY: number,
  localDisposables?: { dispose: () => void }[]
): CustomHouseSpawnResult {
  const pal = getResortPalette(mats, localDisposables);
  const gy = getTerrainHeightAt(sx, sz);
  const group = new THREE.Group();
  group.position.set(sx, gy, sz);
  group.rotation.y = sRotY;

  let colliders: ColliderBox[] = [];
  let hitProxyHeight: number | undefined;

  switch (spec.kind) {
    case 'sea_cove':
      buildSeaCove(group, mats, pal);
      hitProxyHeight = 0.45;
      break;
    case 'sand_beach':
      buildSandBeach(group, mats, pal);
      hitProxyHeight = 0.45;
      break;
    case 'sun_loungers':
      colliders = buildSunLoungers(group, mats, pal, sx, sz, sRotY, gy);
      hitProxyHeight = 2.6;
      break;
    case 'beach_volleyball':
      colliders = buildBeachVolleyball(group, mats, pal, sx, sz, sRotY, gy);
      hitProxyHeight = 2.4;
      break;
    case 'wooden_pier':
      colliders = buildWoodenPier(group, mats, pal, sx, sz, sRotY, gy);
      hitProxyHeight = 1.4;
      break;
    case 'beach_cabana':
      colliders = buildBeachCabana(group, mats, pal, sx, sz, sRotY, gy);
      hitProxyHeight = 4.6;
      break;
    case 'lifeguard_tower':
      colliders = buildLifeguardTower(group, mats, pal, sx, sz, sRotY, gy);
      hitProxyHeight = 4.8;
      break;
    case 'sailboat_surf':
      colliders = buildSailboatAndSurf(group, mats, pal, sx, sz, sRotY, gy);
      hitProxyHeight = 4.5;
      break;
    default:
      buildSandBeach(group, mats, pal);
      hitProxyHeight = 0.45;
      break;
  }

  return {
    group,
    colliders,
    footprintW: spec.w,
    footprintD: spec.d,
    hitProxyHeight,
  };
}
