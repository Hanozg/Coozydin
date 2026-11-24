import * as THREE from 'three';
import { MuseumPbrMaterials } from './pbrTextures';
import { MuseumBoxCollider, MuseumCylinderCollider } from './ancientCityBuilder';

/**
 * Shared architectural builder toolkit passed to each city's dedicated monument builder.
 * Every monument uses composite multi-part PBR meshes with true walk-through openings,
 * accurate player collision boxes/cylinders, and spring-arm camera collision meshes.
 */
export interface CityBuildContext {
  root: THREE.Group;
  mats: MuseumPbrMaterials;
  isSoftwareGl: boolean;
  boxColliders: MuseumBoxCollider[];
  cylinderColliders: MuseumCylinderCollider[];
  cameraCollisionMeshes: THREE.Object3D[];
  trackGeo: <T extends THREE.BufferGeometry>(g: T) => T;
  trackMat: <T extends THREE.Material>(m: T) => T;
  addSolidBox: (
    w: number,
    h: number,
    d: number,
    x: number,
    y: number,
    z: number,
    mat: THREE.Material,
    collide?: boolean,
    camCollide?: boolean
  ) => THREE.Mesh;
  buildFlutedColumn: (
    cx: number,
    baseY: number,
    cz: number,
    height: number,
    broken?: boolean,
    radiusScale?: number,
    spiral?: boolean
  ) => void;
  addFallenDrum: (x: number, y: number, z: number, len: number, rotY: number) => void;
  addWalkthroughArch: (
    cx: number,
    springY: number,
    cz: number,
    halfSpan: number,
    openingR: number,
    spandrelH: number,
    depth: number,
    rotY?: number,
    mat?: THREE.Material
  ) => void;
}

/**
 * Helper: Builds a sculpted classical marble statue (Artemis, Aphrodite, or Scholar)
 * on an inscribed pedestal with contrapposto proportions and carved drapery.
 */
function addClassicalStatue(
  ctx: CityBuildContext,
  sx: number,
  sy: number,
  sz: number,
  rotY: number,
  withCrown = false
) {
  ctx.addSolidBox(1.55, 0.28, 1.55, sx, sy + 0.14, sz, ctx.mats.crackedMarble, true, true);
  ctx.addSolidBox(1.18, 0.96, 1.18, sx, sy + 0.76, sz, ctx.mats.inscriptionStone, true, true);
  ctx.addSolidBox(1.38, 0.18, 1.38, sx, sy + 1.32, sz, ctx.mats.carvedFrieze, false, true);

  const g = new THREE.Group();
  g.position.set(sx, sy + 1.41, sz);
  g.rotation.y = rotY;

  // Flowing pleated marble chiton robe
  const robe = new THREE.Mesh(
    ctx.trackGeo(new THREE.CylinderGeometry(0.18, 0.34, 1.05, 16)),
    ctx.mats.statueMarble
  );
  robe.position.y = 0.525;
  robe.castShadow = !ctx.isSoftwareGl;
  g.add(robe);

  // Draped torso & himation fold
  const torso = new THREE.Mesh(
    ctx.trackGeo(new THREE.CylinderGeometry(0.24, 0.19, 0.56, 16)),
    ctx.mats.statueMarble
  );
  torso.position.y = 1.16;
  torso.scale.set(1.08, 1, 0.78);
  torso.castShadow = !ctx.isSoftwareGl;
  g.add(torso);

  const shoulders = new THREE.Mesh(
    ctx.trackGeo(new THREE.SphereGeometry(0.24, 14, 12)),
    ctx.mats.statueMarble
  );
  shoulders.position.set(0, 1.38, 0);
  shoulders.scale.set(1.25, 0.56, 0.74);
  g.add(shoulders);

  const head = new THREE.Mesh(
    ctx.trackGeo(new THREE.SphereGeometry(0.135, 16, 14)),
    ctx.mats.statueMarble
  );
  head.position.set(0, 1.62, 0.02);
  head.castShadow = !ctx.isSoftwareGl;
  g.add(head);

  if (withCrown) {
    const crown = new THREE.Mesh(
      ctx.trackGeo(new THREE.CylinderGeometry(0.145, 0.12, 0.18, 14)),
      ctx.mats.carvedFrieze
    );
    crown.position.set(0, 1.77, 0.01);
    g.add(crown);
  }

  ctx.root.add(g);
}

/**
 * Helper: Adds a classical triangular temple pediment extruded in white marble.
 */
function addTriangularPediment(
  ctx: CityBuildContext,
  cx: number,
  baseY: number,
  cz: number,
  width: number,
  peakH: number,
  depth: number,
  mat: THREE.Material
) {
  const shape = new THREE.Shape();
  shape.moveTo(-width * 0.5, 0);
  shape.lineTo(width * 0.5, 0);
  shape.lineTo(0, peakH);
  shape.closePath();

  const geo = ctx.trackGeo(
    new THREE.ExtrudeGeometry(shape, {
      depth,
      bevelEnabled: true,
      bevelSegments: 2,
      bevelSize: 0.06,
      bevelThickness: 0.06,
    })
  );
  geo.translate(0, 0, -depth * 0.5);
  const pos = geo.attributes.position;
  const uv = geo.attributes.uv;
  for (let i = 0; i < pos.count; i++) {
    uv.setXY(i, pos.getX(i) * 0.25, pos.getY(i) * 0.25);
  }

  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.set(cx, baseY, cz);
  mesh.castShadow = !ctx.isSoftwareGl;
  mesh.receiveShadow = true;
  ctx.root.add(mesh);
  ctx.cameraCollisionMeshes.push(mesh);
}

/**
 * Helper: Adds an authentic East Mosaic Courtyard base + mosaic floor + low curbs.
 */
function addEastMosaicBase(ctx: CityBuildContext) {
  ctx.addSolidBox(21.0, 0.16, 23.4, 24.0, 0.075, -1.5, ctx.mats.crackedMarble, false, true);
  const mosaicGeo = ctx.trackGeo(new THREE.PlaneGeometry(12.2, 10.2));
  mosaicGeo.rotateX(-Math.PI / 2);
  const mosaicMesh = new THREE.Mesh(mosaicGeo, ctx.mats.floorMosaic);
  mosaicMesh.position.set(22.0, 0.162, -4.5);
  mosaicMesh.receiveShadow = true;
  ctx.root.add(mosaicMesh);
  ctx.addSolidBox(12.6, 0.12, 0.36, 22.0, 0.21, -9.75, ctx.mats.travertine, false, false);
  ctx.addSolidBox(12.6, 0.12, 0.36, 22.0, 0.21, 0.75, ctx.mats.travertine, false, false);
}

// ============================================================================
// 2. MAGNESIA ANTİK KENTİ — ARTEMİS LEUKOPHRYENE TAPINAĞI
// ============================================================================
export function buildMagnesiaStructures(ctx: CityBuildContext): [number, number, number, number][] {
  // CENTER: Grand Pseudodipteros Temple of Artemis Leukophryene (enterable!)
  // 3-stepped marble krepidoma (walkable smooth low height ~0.48m total)
  ctx.addSolidBox(17.4, 0.18, 15.4, 0, 0.09, 0, ctx.mats.crackedMarble, false, true);
  ctx.addSolidBox(16.2, 0.17, 14.2, 0, 0.26, 0, ctx.mats.crackedMarble, false, true);
  ctx.addSolidBox(15.0, 0.16, 13.0, 0, 0.42, 0, ctx.mats.crackedMarble, false, true);

  // Front (South, z=5.2) & Rear (North, z=-5.2) hexastyle Ionic columns (6 per side)
  const frontXs = [-6.4, -3.84, -1.28, 1.28, 3.84, 6.4];
  for (const x of frontXs) {
    ctx.buildFlutedColumn(x, 0.5, 5.2, 6.4, false, 1.12);
    ctx.buildFlutedColumn(x, 0.5, -5.2, 6.4, x === 6.4, 1.12);
  }
  // Flank columns (West & East sides)
  for (const z of [-1.75, 1.75]) {
    ctx.buildFlutedColumn(-6.4, 0.5, z, 6.4, false, 1.12);
    ctx.buildFlutedColumn(6.4, 0.5, z, 6.4, z === -1.75, 1.12);
  }

  // Carved Ionic Architrave & Amazonomakhia Frieze crowning front & sides
  ctx.addSolidBox(14.4, 0.92, 1.45, 0, 7.36, 5.2, ctx.mats.carvedFrieze, false, true);
  ctx.addSolidBox(11.4, 0.88, 1.4, -1.5, 7.34, -5.2, ctx.mats.carvedFrieze, false, true);
  ctx.addSolidBox(1.38, 0.88, 11.4, -6.4, 7.34, 0, ctx.mats.carvedFrieze, false, true);

  // Iconic Triangular Marble Pediment with corner acroteria on South Facade
  addTriangularPediment(ctx, 0, 7.82, 5.2, 14.8, 2.65, 1.35, ctx.mats.crackedMarble);
  ctx.addSolidBox(0.55, 0.72, 0.55, 0, 10.65, 5.2, ctx.mats.statueMarble, false, false);
  ctx.addSolidBox(0.42, 0.52, 0.42, -7.2, 8.1, 5.2, ctx.mats.statueMarble, false, false);
  ctx.addSolidBox(0.42, 0.52, 0.42, 7.2, 8.1, 5.2, ctx.mats.statueMarble, false, false);

  // Enterable Inner Cella Walls (wide 4.2m South doorway so player walks right inside!)
  ctx.addSolidBox(0.65, 4.8, 5.4, -3.4, 2.9, -0.2, ctx.mats.travertine, true, true);
  ctx.addSolidBox(0.65, 4.8, 5.4, 3.4, 2.9, -0.2, ctx.mats.travertine, true, true);
  ctx.addSolidBox(7.4, 4.8, 0.65, 0, 2.9, -2.8, ctx.mats.travertine, true, true);
  // Sculpted Artemis Leukophryene Cult Statue inside the open-sky cella!
  addClassicalStatue(ctx, 0, 0.5, -1.2, 0, true);

  // WEST WING: Sacred Agora & Great Altar of Artemis
  ctx.addSolidBox(21.4, 0.24, 25.4, -24.0, 0.12, -2.0, ctx.mats.crackedMarble, false, true);
  ctx.addSolidBox(20.0, 0.23, 24.0, -24.0, 0.34, -2.0, ctx.mats.crackedMarble, false, true);
  for (const z of [-11.5, -7.0, -2.5, 2.0, 6.5]) {
    ctx.buildFlutedColumn(-31.5, 0.45, z, 5.5, false);
  }
  ctx.addSolidBox(1.25, 0.88, 19.2, -31.5, 6.4, -2.5, ctx.mats.carvedFrieze, false, true);
  // Monumental Stepped Sacrificial Altar of Artemis at (-23, 0.45, -1.5)
  ctx.addSolidBox(4.8, 0.3, 3.8, -23.0, 0.6, -1.5, ctx.mats.crackedMarble, true, true);
  ctx.addSolidBox(3.6, 1.25, 2.4, -23.0, 1.38, -1.5, ctx.mats.carvedFrieze, true, true);
  ctx.addSolidBox(4.1, 0.28, 2.9, -23.0, 2.12, -1.5, ctx.mats.inscriptionStone, false, true);
  ctx.addSolidBox(0.85, 2.6, 0.85, -25.4, 1.75, -1.5, ctx.mats.crackedMarble, true, true);
  ctx.addSolidBox(0.85, 2.6, 0.85, -20.6, 1.75, -1.5, ctx.mats.crackedMarble, true, true);

  // EAST WING: Roman Bath Brick Arches & Mosaic Courtyard
  addEastMosaicBase(ctx);
  // Twin Roman Bath Brick Arches bordering the East side of the mosaic hall
  ctx.addSolidBox(1.8, 5.2, 2.0, 31.2, 2.75, -9.2, ctx.mats.romanBrick, true, true);
  ctx.addSolidBox(1.8, 5.2, 2.0, 31.2, 2.75, -3.2, ctx.mats.romanBrick, true, true);
  ctx.addSolidBox(1.8, 5.2, 2.0, 31.2, 2.75, 2.8, ctx.mats.romanBrick, true, true);
  ctx.addWalkthroughArch(31.2, 5.3, -6.2, 3.0, 2.0, 2.8, 1.7, Math.PI * 0.5, ctx.mats.romanBrick);
  ctx.addWalkthroughArch(31.2, 5.3, -0.2, 3.0, 2.0, 2.8, 1.7, Math.PI * 0.5, ctx.mats.romanBrick);
  ctx.addSolidBox(2.1, 0.72, 14.5, 31.2, 8.4, -3.2, ctx.mats.carvedFrieze, false, true);

  ctx.addFallenDrum(-14.5, 0, 11.2, 1.85, -0.4);
  ctx.addFallenDrum(13.2, 0, -13.5, 1.9, 0.62);

  return [
    [-3.8, 5.5, 2.2, 1.05],
    [0.0, 5.8, 1.5, 1.18],
    [3.8, 5.5, 2.2, 1.05],
    [-25.0, 4.6, -2.5, 0.85],
    [23.5, 4.6, -3.5, 0.92],
  ];
}

// ============================================================================
// 3. NYSA ANTİK KENTİ — 2 KATLI KÜTÜPHANE, GERONTİKON & VADİ KÖPRÜSÜ
// ============================================================================
export function buildNysaStructures(ctx: CityBuildContext): [number, number, number, number][] {
  // CENTER: Nysa Two-Story Arched Ancient Library (Enterable Reading Hall!)
  const libW = 14.8;
  const libD = 10.6;
  // Library marble floor plinth
  ctx.addSolidBox(libW + 1.2, 0.24, libD + 1.2, 0, 0.12, 0, ctx.mats.crackedMarble, false, true);
  // Front South Facade: 3 piers framing TWO tall walk-through reading hall archways!
  const fPiers = [-6.2, 0.0, 6.2];
  for (const px of fPiers) {
    ctx.addSolidBox(2.1, 5.2, 2.0, px, 2.84, 4.6, ctx.mats.travertine, true, true);
    ctx.addSolidBox(2.2, 0.45, 2.1, px, 3.3, 4.6, ctx.mats.romanBrick, false, true);
  }
  ctx.addWalkthroughArch(-3.1, 5.3, 4.6, 3.1, 2.05, 3.1, 1.85, 0, ctx.mats.travertineArch);
  ctx.addWalkthroughArch(3.1, 5.3, 4.6, 3.1, 2.05, 3.1, 1.85, 0, ctx.mats.travertineArch);
  // Second-story brick-and-travertine library attic with clerestory arches
  ctx.addSolidBox(15.0, 0.72, 2.25, 0, 8.72, 4.6, ctx.mats.carvedFrieze, false, true);
  ctx.addSolidBox(3.4, 3.1, 1.7, -5.6, 10.6, 4.6, ctx.mats.romanBrick, false, true);
  ctx.addSolidBox(2.6, 3.4, 1.7, 0.0, 10.75, 4.6, ctx.mats.travertine, false, true);
  ctx.addSolidBox(3.4, 2.8, 1.7, 5.6, 10.45, 4.6, ctx.mats.romanBrick, false, true);

  // Side & North Back Reading Hall Walls with recessed papyrus scroll niches!
  ctx.addSolidBox(1.2, 8.2, libD - 1.2, -6.9, 4.3, -0.3, ctx.mats.travertine, true, true);
  ctx.addSolidBox(1.2, 8.2, libD - 1.2, 6.9, 4.3, -0.3, ctx.mats.travertine, true, true);
  ctx.addSolidBox(libW, 8.6, 1.2, 0, 4.5, -5.0, ctx.mats.romanBrick, true, true);
  // Recessed carved marble manuscript niches lining the interior north wall
  for (const nx of [-4.4, -2.2, 0, 2.2, 4.4]) {
    ctx.addSolidBox(1.45, 2.2, 0.28, nx, 2.3, -4.3, ctx.mats.crackedMarble, false, false);
    ctx.addSolidBox(1.58, 0.24, 0.42, nx, 3.5, -4.24, ctx.mats.carvedFrieze, false, false);
    ctx.addSolidBox(1.45, 2.0, 0.28, nx, 5.6, -4.3, ctx.mats.crackedMarble, false, false);
  }
  // Central marble reading lectern inside the library hall
  ctx.addSolidBox(1.8, 1.05, 1.1, 0, 0.76, -1.0, ctx.mats.inscriptionStone, true, true);

  // WEST WING: Gerontikon (Council of Elders) — Semicircular Marble Odeon Steps
  ctx.addSolidBox(21.4, 0.24, 25.4, -24.0, 0.12, -2.0, ctx.mats.crackedMarble, false, true);
  ctx.addSolidBox(20.0, 0.23, 24.0, -24.0, 0.34, -2.0, ctx.mats.crackedMarble, false, true);
  for (let tier = 0; tier < 5; tier++) {
    const rIn = 3.2 + tier * 1.15;
    const rOut = rIn + 1.12;
    const s = new THREE.Shape();
    s.absarc(0, 0, rOut, Math.PI * 0.5, Math.PI * 1.5, false);
    s.absarc(0, 0, rIn, Math.PI * 1.5, Math.PI * 0.5, true);
    s.closePath();
    const g = ctx.trackGeo(new THREE.ExtrudeGeometry(s, { depth: 0.44 + tier * 0.38, bevelEnabled: false, curveSegments: 22 }));
    g.rotateX(-Math.PI / 2);
    const m = new THREE.Mesh(g, tier % 2 === 0 ? ctx.mats.crackedMarble : ctx.mats.travertine);
    m.position.set(-22.5, 0.45, -1.8);
    m.castShadow = !ctx.isSoftwareGl;
    m.receiveShadow = true;
    ctx.root.add(m);
    ctx.cameraCollisionMeshes.push(m);
  }
  // Speaker's inscribed rostrum & flanking columns of Gerontikon
  ctx.addSolidBox(1.6, 1.1, 2.6, -21.2, 1.0, -1.8, ctx.mats.inscriptionStone, true, true);
  ctx.buildFlutedColumn(-17.8, 0.45, -7.8, 5.2, false);
  ctx.buildFlutedColumn(-17.8, 0.45, 4.2, 5.2, false);

  // EAST WING: Nysa Canyon Bridge Arch & Strabo Memorial Terrace
  addEastMosaicBase(ctx);
  // Dramatic tall single-span Roman Valley Bridge Arch spanning across the East courtyard
  ctx.addSolidBox(2.4, 5.4, 3.0, 23.2, 2.85, -8.5, ctx.mats.travertine, true, true);
  ctx.addSolidBox(2.4, 5.4, 3.0, 23.2, 2.85, 1.5, ctx.mats.travertine, true, true);
  ctx.addWalkthroughArch(23.2, 5.4, -3.5, 5.0, 3.4, 3.5, 2.8, Math.PI * 0.5, ctx.mats.travertineArch);
  ctx.addSolidBox(3.1, 0.65, 12.6, 23.2, 9.2, -3.5, ctx.mats.carvedFrieze, false, true);
  // Strabo Geographer Inscribed Column Stele
  ctx.addSolidBox(1.3, 1.4, 1.3, 27.6, 0.85, 4.2, ctx.mats.inscriptionStone, true, true);
  ctx.addSolidBox(1.5, 0.24, 1.5, 27.6, 1.65, 4.2, ctx.mats.carvedFrieze, false, true);

  ctx.addFallenDrum(-14.2, 0, 10.6, 1.7, 0.35);
  ctx.addFallenDrum(13.6, 0, -13.0, 1.85, -0.5);

  return [
    [-3.1, 5.4, 2.2, 1.05],
    [3.1, 5.4, 2.2, 1.05],
    [-23.0, 4.5, -2.0, 0.85],
    [23.2, 5.2, -3.5, 1.1],
  ];
}

// ============================================================================
// 4. AFRODISIAS ANTİK KENTİ — TETRAPYLON, AFRODİT TAPINAĞI & SEBASTEION
// ============================================================================
export function buildAphrodisiasStructures(ctx: CityBuildContext): [number, number, number, number][] {
  // CENTER: Iconic UNESCO Afrodisias TETRAPYLON (4x4 paired spiral & fluted marble columns!)
  ctx.addSolidBox(14.8, 0.24, 11.4, 0, 0.12, 0, ctx.mats.crackedMarble, false, true);
  // 4 Clusters of 4 columns leaving a soaring 4.8m central ceremonial avenue + side aisles!
  const clusterOffsets: [number, number][] = [
    [-4.4, 2.6],
    [4.4, 2.6],
    [-4.4, -2.6],
    [4.4, -2.6],
  ];
  const subOffsets: [number, number][] = [
    [-1.15, -1.1],
    [1.15, -1.1],
    [-1.15, 1.1],
    [1.15, 1.1],
  ];
  clusterOffsets.forEach(([cx, cz], cIdx) => {
    // Cluster stepped marble plinth
    ctx.addSolidBox(3.5, 0.32, 3.4, cx, 0.4, cz, ctx.mats.crackedMarble, false, true);
    subOffsets.forEach(([ox, oz], sIdx) => {
      // Front-inner columns feature Afrodisias's famous SPIRAL fluted shafts!
      const isSpiral = (cIdx === 0 || cIdx === 1) && sIdx >= 2;
      ctx.buildFlutedColumn(cx + ox, 0.56, cz + oz, 6.2, false, 0.96, isSpiral);
    });
    // Crown entablature block over each 4-column cluster
    ctx.addSolidBox(3.8, 0.95, 3.6, cx, 7.22, cz, ctx.mats.carvedFrieze, false, true);
  });

  // Dramatic Broken Syrian Pediment Arch spanning the center of the Tetrapylon!
  ctx.addWalkthroughArch(0, 6.8, 2.6, 4.4, 2.9, 3.1, 1.8, 0, ctx.mats.crackedMarble);
  ctx.addWalkthroughArch(0, 6.8, -2.6, 4.4, 2.9, 3.1, 1.8, 0, ctx.mats.crackedMarble);
  // Sculpted relief frieze crest above the Tetrapylon arch
  ctx.addSolidBox(12.8, 0.62, 2.1, 0, 10.15, 2.6, ctx.mats.carvedFrieze, false, true);
  ctx.addSolidBox(12.8, 0.62, 2.1, 0, 10.15, -2.6, ctx.mats.carvedFrieze, false, true);
  // Decorative side architraves linking North & South clusters
  ctx.addSolidBox(3.4, 0.85, 7.8, -4.4, 7.22, 0, ctx.mats.carvedFrieze, false, true);
  ctx.addSolidBox(3.4, 0.85, 7.8, 4.4, 7.22, 0, ctx.mats.carvedFrieze, false, true);

  // WEST WING: Towering 14-Column Temple of Aphrodite + Cult Statue
  ctx.addSolidBox(21.4, 0.24, 25.4, -24.0, 0.12, -2.0, ctx.mats.crackedMarble, false, true);
  ctx.addSolidBox(20.0, 0.23, 24.0, -24.0, 0.34, -2.0, ctx.mats.crackedMarble, false, true);
  const aphZs = [-11.4, -7.8, -4.2, -0.6, 3.0, 6.6];
  for (let i = 0; i < aphZs.length; i++) {
    ctx.buildFlutedColumn(-31.2, 0.45, aphZs[i], 6.4, false, 1.05);
    ctx.buildFlutedColumn(-18.2, 0.45, aphZs[i], i === 4 ? 3.8 : 6.4, i === 4, 1.05);
  }
  ctx.buildFlutedColumn(-26.8, 0.45, -11.4, 6.4, false, 1.05);
  ctx.buildFlutedColumn(-22.5, 0.45, -11.4, 6.4, false, 1.05);
  ctx.addSolidBox(1.3, 0.9, 19.6, -31.2, 7.3, -2.4, ctx.mats.carvedFrieze, false, true);
  ctx.addSolidBox(14.4, 0.9, 1.3, -24.7, 7.3, -11.4, ctx.mats.carvedFrieze, false, true);
  addClassicalStatue(ctx, -24.6, 0.45, -2.0, 0.78, true);

  // EAST WING: Sebasteion Two-Story Relief Gallery & Sculpture Workshop
  addEastMosaicBase(ctx);
  // Two-story Sebasteion Relief Portico along East edge (x = 31.4)
  for (const z of [-10.0, -6.0, -2.0, 2.0, 6.0]) {
    ctx.buildFlutedColumn(30.4, 0.15, z, 4.4, false, 0.9);
  }
  ctx.addSolidBox(1.1, 0.72, 17.6, 30.4, 4.92, -2.0, ctx.mats.carvedFrieze, false, true);
  // Upper sculpted Sebasteion relief panel gallery
  for (const z of [-8.0, -4.0, 0.0, 4.0]) {
    ctx.addSolidBox(0.85, 2.5, 3.2, 31.2, 6.55, z, ctx.mats.inscriptionStone, false, true);
  }
  ctx.addSolidBox(1.3, 0.65, 17.6, 30.8, 8.1, -2.0, ctx.mats.carvedFrieze, false, true);
  // Sculptor's marble showcase statue in the workshop courtyard
  addClassicalStatue(ctx, 25.5, 0.15, -9.2, -2.2, false);

  ctx.addFallenDrum(-14.6, 0, 11.0, 1.8, -0.35);
  ctx.addFallenDrum(14.0, 0, -13.6, 1.9, 0.65);

  return [
    [0.0, 5.8, 0.0, 1.25],
    [-4.4, 5.4, 0.0, 0.9],
    [4.4, 5.4, 0.0, 0.9],
    [-25.0, 5.0, -3.5, 0.95],
    [24.5, 4.8, -2.5, 0.92],
  ];
}

// ============================================================================
// 5. PRİENE ANTİK KENTİ — ATHENA POLİAS TAPINAĞI & BULEUTERİON
// ============================================================================
export function buildPrieneStructures(ctx: CityBuildContext): [number, number, number, number][] {
  // CENTER: Pytheos's Soaring Ionic Temple of Athena Polias
  ctx.addSolidBox(16.0, 0.2, 14.0, 0, 0.1, 0, ctx.mats.crackedMarble, false, true);
  ctx.addSolidBox(14.8, 0.2, 12.8, 0, 0.3, 0, ctx.mats.crackedMarble, false, true);
  ctx.addSolidBox(13.6, 0.18, 11.6, 0, 0.48, 0, ctx.mats.crackedMarble, false, true);

  // 5 Iconic towering intact columns on front/flanks + picturesque broken shafts (authentic Priene!)
  const pFrontXs = [-5.4, -2.7, 0, 2.7, 5.4];
  pFrontXs.forEach((x, idx) => {
    const broken = idx === 4;
    ctx.buildFlutedColumn(x, 0.56, 4.6, broken ? 4.2 : 7.4, broken, 1.06);
    ctx.buildFlutedColumn(x, 0.56, -4.6, idx >= 3 ? 3.5 : 7.4, idx >= 3, 1.06);
  });
  ctx.buildFlutedColumn(-5.4, 0.56, 0, 7.4, false, 1.06);
  ctx.buildFlutedColumn(5.4, 0.56, 0, 3.8, true, 1.06);

  // Crisp coffered Ionic architrave crowning the intact columns
  ctx.addSolidBox(10.0, 0.95, 1.38, -1.4, 8.44, 4.6, ctx.mats.carvedFrieze, false, true);
  ctx.addSolidBox(1.38, 0.95, 10.6, -5.4, 8.44, 0, ctx.mats.carvedFrieze, false, true);
  // Enterable Athena cella shrine walls & statue
  ctx.addSolidBox(0.6, 4.2, 4.6, -2.8, 2.66, -0.5, ctx.mats.crackedMarble, true, true);
  ctx.addSolidBox(0.6, 4.2, 4.6, 2.8, 2.66, -0.5, ctx.mats.crackedMarble, true, true);
  addClassicalStatue(ctx, 0, 0.56, -1.8, 0, true);

  // WEST WING: Square-Plan Priene Buleuterion (3-Sided Stepped Assembly + Central Altar)
  ctx.addSolidBox(21.4, 0.24, 25.4, -24.0, 0.12, -2.0, ctx.mats.crackedMarble, false, true);
  ctx.addSolidBox(20.0, 0.23, 24.0, -24.0, 0.34, -2.0, ctx.mats.crackedMarble, false, true);
  // 3-sided square stepped seating banks (North, West, South) facing East toward the speaker!
  for (let t = 0; t < 5; t++) {
    const h = 0.42 + t * 0.42;
    // West back seating bank
    ctx.addSolidBox(1.15, h, 14.0 - t * 0.4, -26.8 - t * 1.15, 0.45 + h * 0.5, -2.0, ctx.mats.crackedMarble, true, true);
    // North wing seating bank
    ctx.addSolidBox(9.2, h, 1.15, -23.5, 0.45 + h * 0.5, -7.2 - t * 1.1, ctx.mats.travertine, true, true);
    // South wing seating bank
    ctx.addSolidBox(9.2, h, 1.15, -23.5, 0.45 + h * 0.5, 3.2 + t * 1.1, ctx.mats.travertine, true, true);
  }
  // Central Sacred Hearth Altar in the middle of the Buleuterion floor
  ctx.addSolidBox(1.65, 1.15, 1.65, -22.8, 1.02, -2.0, ctx.mats.inscriptionStone, true, true);
  ctx.addSolidBox(1.9, 0.24, 1.9, -22.8, 1.72, -2.0, ctx.mats.carvedFrieze, false, true);

  // EAST WING: Hippodamian Grid Marble Street, Sacred Stoa & Alexander Dedication Stele
  addEastMosaicBase(ctx);
  for (const z of [-10.5, -6.5, -2.5, 1.5, 5.5]) {
    ctx.buildFlutedColumn(31.8, 0.15, z, 5.4, false, 0.95);
  }
  ctx.addSolidBox(1.2, 0.85, 17.6, 31.8, 5.95, -2.5, ctx.mats.carvedFrieze, false, true);
  // Alexander the Great Marble Dedication Stele
  ctx.addSolidBox(1.4, 2.2, 0.6, 25.4, 1.25, 3.8, ctx.mats.inscriptionStone, true, true);
  ctx.addSolidBox(1.65, 0.28, 0.8, 25.4, 2.48, 3.8, ctx.mats.carvedFrieze, false, true);

  // Dramatic Mykale (Samsun Dağı) Cliff Wall towering behind Priene to the far North-West
  ctx.addSolidBox(36, 22, 10, -28, 10, -56, ctx.mats.travertine, false, false);
  ctx.addSolidBox(34, 25, 10, 22, 11.5, -58, ctx.mats.travertine, false, false);

  ctx.addFallenDrum(-14.2, 0, 10.2, 1.8, 0.48);
  ctx.addFallenDrum(13.5, 0, -13.2, 1.95, -0.6);

  return [
    [-2.7, 5.9, 1.5, 1.1],
    [1.2, 5.9, 1.5, 1.1],
    [-22.8, 4.6, -2.0, 0.88],
    [24.0, 4.6, -3.0, 0.9],
  ];
}

// ============================================================================
// 6. MİLET & DİDYMA — DEV APOLLON SÜTUN ORMANI & MEDUSA KABARTMASI
// ============================================================================
export function buildMiletDidymaStructures(ctx: CityBuildContext): [number, number, number, number][] {
  // CENTER: Colossal Didyma Temple of Apollo — Double-Row Giant Column Forest + Medusa Block!
  ctx.addSolidBox(18.4, 0.22, 16.4, 0, 0.11, 0, ctx.mats.crackedMarble, false, true);
  ctx.addSolidBox(17.0, 0.22, 15.0, 0, 0.32, 0, ctx.mats.crackedMarble, false, true);

  // Colossal 8.4m tall double-row Dipteros Ionic columns framing the open-air sky court!
  const outerXs = [-7.2, -3.6, 3.6, 7.2];
  for (const x of outerXs) {
    ctx.buildFlutedColumn(x, 0.44, 4.8, 8.4, false, 1.28);
    ctx.buildFlutedColumn(x, 0.44, 0.6, 8.4, x === 7.2, 1.28);
    ctx.buildFlutedColumn(x, 0.44, -4.4, x === -7.2 || x === 7.2 ? 4.8 : 8.4, x === -7.2 || x === 7.2, 1.28);
  }
  // Monumental entablatures spanning the towering double colonnade flanks
  ctx.addSolidBox(5.2, 1.05, 5.8, -5.4, 9.36, 2.7, ctx.mats.carvedFrieze, false, true);
  ctx.addSolidBox(5.2, 1.05, 1.6, 5.4, 9.36, 4.8, ctx.mats.carvedFrieze, false, true);
  ctx.addSolidBox(9.2, 1.05, 1.6, 0, 9.36, -4.4, ctx.mats.carvedFrieze, false, true);

  // ICONIC SCULPTED MEDUSA GORGON RELIEF BLOCK at (0, 0.44, 7.6)
  {
    const mx = 0;
    const my = 0.44;
    const mz = 7.6;
    // Heavy fallen carved marble frieze block resting at a slight dramatic angle
    ctx.addSolidBox(2.5, 0.34, 1.7, mx, my + 0.17, mz, ctx.mats.travertine, true, true);
    const block = ctx.addSolidBox(2.15, 1.65, 1.1, mx, my + 1.15, mz, ctx.mats.statueMarble, true, true);
    block.rotation.z = 0.04;

    // Sculpted Gorgon face + serpent hair relief crowning the front (+Z) face!
    const medusaGroup = new THREE.Group();
    medusaGroup.position.set(mx, my + 1.18, mz + 0.56);
    const face = new THREE.Mesh(
      ctx.trackGeo(new THREE.SphereGeometry(0.46, 18, 16)),
      ctx.mats.statueMarble
    );
    face.scale.set(0.95, 1.12, 0.42);
    face.castShadow = !ctx.isSoftwareGl;
    medusaGroup.add(face);

    // Sculpted radiating serpentine curls & acanthus frieze frame around Medusa's face
    for (let k = 0; k < 12; k++) {
      const ang = (k / 12) * Math.PI * 2;
      const curl = new THREE.Mesh(
        ctx.trackGeo(new THREE.TorusGeometry(0.14, 0.045, 8, 12, Math.PI * 1.4)),
        ctx.mats.carvedFrieze
      );
      curl.position.set(Math.cos(ang) * 0.52, Math.sin(ang) * 0.56, -0.02);
      curl.rotation.z = ang + 0.5;
      medusaGroup.add(curl);
    }
    ctx.root.add(medusaGroup);
  }

  // WEST WING: Faustina Baths & River God Maeander Pavilion
  ctx.addSolidBox(21.4, 0.24, 25.4, -24.0, 0.12, -2.0, ctx.mats.crackedMarble, false, true);
  ctx.addSolidBox(20.0, 0.23, 24.0, -24.0, 0.34, -2.0, ctx.mats.crackedMarble, false, true);
  // Arched Thermae wall on the West edge
  ctx.addSolidBox(2.0, 5.2, 2.2, -31.2, 2.95, -7.2, ctx.mats.travertine, true, true);
  ctx.addSolidBox(2.0, 5.2, 2.2, -31.2, 2.95, -1.2, ctx.mats.travertine, true, true);
  ctx.addSolidBox(2.0, 5.2, 2.2, -31.2, 2.95, 4.8, ctx.mats.travertine, true, true);
  ctx.addWalkthroughArch(-31.2, 5.4, -4.2, 3.0, 2.0, 2.8, 1.9, Math.PI * 0.5, ctx.mats.travertineArch);
  ctx.addWalkthroughArch(-31.2, 5.4, 1.8, 3.0, 2.0, 2.8, 1.9, Math.PI * 0.5, ctx.mats.travertineArch);
  // Marble Thermal Basin & Maeander River God Monument
  ctx.addSolidBox(5.2, 0.55, 3.4, -23.0, 0.72, -1.8, ctx.mats.crackedMarble, true, true);
  const waterMat = ctx.trackMat(
    new THREE.MeshStandardMaterial({ color: 0x3f7b85, roughness: 0.14, metalness: 0.15 })
  );
  ctx.addSolidBox(4.4, 0.1, 2.6, -23.0, 0.96, -1.8, waterMat, false, false);
  addClassicalStatue(ctx, -23.0, 0.95, -2.8, 0.3, false);

  // EAST WING: Miletus Sacred Way Harbor Gate & Philosophers' Sundial Stele
  addEastMosaicBase(ctx);
  // Twin-Arched Miletus Harbor Gate
  ctx.addSolidBox(2.0, 5.0, 2.2, 30.8, 2.65, -7.5, ctx.mats.crackedMarble, true, true);
  ctx.addSolidBox(2.0, 5.0, 2.2, 30.8, 2.65, -1.5, ctx.mats.crackedMarble, true, true);
  ctx.addSolidBox(2.0, 5.0, 2.2, 30.8, 2.65, 4.5, ctx.mats.crackedMarble, true, true);
  ctx.addWalkthroughArch(30.8, 5.1, -4.5, 3.0, 2.0, 2.7, 1.9, Math.PI * 0.5, ctx.mats.crackedMarble);
  ctx.addWalkthroughArch(30.8, 5.1, 1.5, 3.0, 2.0, 2.7, 1.9, Math.PI * 0.5, ctx.mats.crackedMarble);
  // Anaximander & Thales Marble Sundial Monument
  ctx.addSolidBox(1.5, 1.25, 1.5, 22.8, 0.78, 3.6, ctx.mats.inscriptionStone, true, true);
  const gnomon = new THREE.Mesh(
    ctx.trackGeo(new THREE.ConeGeometry(0.12, 0.9, 10)),
    ctx.mats.agedBronze
  );
  gnomon.position.set(22.8, 1.85, 3.6);
  ctx.root.add(gnomon);

  ctx.addFallenDrum(-14.0, 0, 10.8, 2.0, 0.42);
  ctx.addFallenDrum(14.2, 0, -13.0, 2.1, -0.52);

  return [
    [-3.6, 6.2, 2.0, 1.18],
    [0.0, 6.2, 1.0, 1.25],
    [3.6, 6.2, 2.0, 1.18],
    [-25.5, 4.8, -1.5, 0.92],
    [24.5, 4.8, -2.5, 0.92],
  ];
}

// ============================================================================
// 7. ALİNDA & ALABANDA — 3 KATLI ALİNDA AGORASI & KARYA SU KEMERİ
// ============================================================================
export function buildAlindaAlabandaStructures(ctx: CityBuildContext): [number, number, number, number][] {
  // CENTER: Massive 3-Story Alinda Hellenistic Agora Market Building (Enterable Ground Arcade!)
  const w = 22.0;
  const d = 8.4;
  ctx.addSolidBox(w + 1.0, 0.24, d + 1.0, 0, 0.12, 0, ctx.mats.travertine, false, true);

  // Ground-Floor South & North Pier Arcades (3 wide walk-through market bays!)
  const bayPiers = [-9.6, -3.2, 3.2, 9.6];
  for (const px of bayPiers) {
    ctx.addSolidBox(2.0, 4.4, 1.8, px, 2.4, 3.4, ctx.mats.travertine, true, true);
    ctx.addSolidBox(2.0, 4.4, 1.8, px, 2.4, -3.4, ctx.mats.travertine, true, true);
  }
  for (const cx of [-6.4, 0.0, 6.4]) {
    ctx.addWalkthroughArch(cx, 4.4, 3.4, 3.2, 2.15, 2.4, 1.7, 0, ctx.mats.travertineArch);
    ctx.addWalkthroughArch(cx, 4.4, -3.4, 3.2, 2.15, 2.4, 1.7, 0, ctx.mats.travertineArch);
  }
  // End Walls closing West & East flanks (with wide open central passage)
  ctx.addSolidBox(1.5, 11.2, 8.2, -10.3, 5.8, 0, ctx.mats.travertine, true, true);
  ctx.addSolidBox(1.5, 11.2, 8.2, 10.3, 5.8, 0, ctx.mats.travertine, true, true);

  // Story 2 & Story 3 Massive Carian Ashlar Facade with rhythmic market slit windows!
  ctx.addSolidBox(w + 0.6, 0.68, 2.0, 0, 7.15, 3.4, ctx.mats.carvedFrieze, false, true);
  ctx.addSolidBox(w + 0.6, 0.68, 2.0, 0, 7.15, -3.4, ctx.mats.carvedFrieze, false, true);
  // Second story lintel piers creating authentic Alinda window bays
  for (const wx of [-8.8, -5.2, -1.8, 1.8, 5.2, 8.8]) {
    ctx.addSolidBox(1.9, 2.8, 1.5, wx, 8.9, 3.4, ctx.mats.travertine, false, true);
    ctx.addSolidBox(1.9, 2.8, 1.5, wx, 8.9, -3.4, ctx.mats.travertine, false, true);
  }
  // Third story crown frieze & weathered Carian parapet
  ctx.addSolidBox(w + 0.4, 0.82, 1.85, 0, 10.7, 3.4, ctx.mats.carvedFrieze, false, true);
  ctx.addSolidBox(14.5, 1.9, 1.45, -2.5, 12.05, 3.4, ctx.mats.travertine, false, true);
  ctx.addSolidBox(w + 0.4, 0.82, 1.85, 0, 10.7, -3.4, ctx.mats.carvedFrieze, false, true);

  // WEST WING: Alabanda Temple of Apollo Isotimos & Queen Ada Memorial Sanctuary
  ctx.addSolidBox(21.4, 0.24, 25.4, -24.0, 0.12, -2.0, ctx.mats.crackedMarble, false, true);
  ctx.addSolidBox(20.0, 0.23, 24.0, -24.0, 0.34, -2.0, ctx.mats.crackedMarble, false, true);
  for (const z of [-10.8, -6.4, -2.0, 2.4, 6.8]) {
    ctx.buildFlutedColumn(-31.2, 0.45, z, z === 6.8 ? 3.8 : 5.8, z === 6.8, 1.05);
  }
  ctx.buildFlutedColumn(-26.2, 0.45, -10.8, 5.8, false, 1.05);
  ctx.buildFlutedColumn(-21.2, 0.45, -10.8, 5.8, false, 1.05);
  ctx.addSolidBox(1.28, 0.88, 15.2, -31.2, 6.72, -4.2, ctx.mats.carvedFrieze, false, true);
  ctx.addSolidBox(11.8, 0.88, 1.28, -26.2, 6.72, -10.8, ctx.mats.carvedFrieze, false, true);
  // Queen Ada Memorial Marble Statue
  addClassicalStatue(ctx, -23.5, 0.45, -1.8, 0.72, true);

  // EAST WING: Soaring Twin-Arch Alinda Roman Aqueduct & Mosaic Courtyard
  addEastMosaicBase(ctx);
  // Tall Aqueduct Piers & Twin Semicircular Arches
  ctx.addSolidBox(2.2, 6.6, 2.4, 29.5, 3.45, -9.5, ctx.mats.travertine, true, true);
  ctx.addSolidBox(2.2, 6.6, 2.4, 29.5, 3.45, -2.5, ctx.mats.travertine, true, true);
  ctx.addSolidBox(2.2, 6.6, 2.4, 29.5, 3.45, 4.5, ctx.mats.travertine, true, true);
  ctx.addWalkthroughArch(29.5, 6.6, -6.0, 3.5, 2.35, 3.0, 2.1, Math.PI * 0.5, ctx.mats.travertineArch);
  ctx.addWalkthroughArch(29.5, 6.6, 1.0, 3.5, 2.35, 3.0, 2.1, Math.PI * 0.5, ctx.mats.travertineArch);
  // Upper stone water conduit channel running along the top of the aqueduct
  ctx.addSolidBox(2.5, 0.9, 17.5, 29.5, 10.0, -2.5, ctx.mats.carvedFrieze, false, true);

  ctx.addFallenDrum(-14.4, 0, 10.5, 1.75, -0.45);
  ctx.addFallenDrum(14.5, 0, -13.2, 1.9, 0.55);

  return [
    [-6.4, 5.2, 0.5, 1.0],
    [0.0, 5.5, 0.5, 1.15],
    [6.4, 5.2, 0.5, 1.0],
    [-25.0, 4.8, -3.0, 0.9],
    [25.5, 5.6, -2.5, 1.05],
  ];
}
