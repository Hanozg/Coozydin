import * as THREE from 'three';
import { CityMaterialLibrary } from './materials';
import {
  createDioramaRoofSlabsGeometry,
  createGableBargeboardGeometry,
  createGableWallPrismGeometry,
} from './roofGeometry';

export interface DioramaHouseOptions {
  w: number;
  d: number;
  h: number;
  variant: number;
  mats: CityMaterialLibrary;
  wallMat: THREE.MeshStandardMaterial;
  lawnMat: THREE.MeshStandardMaterial;
  flowerBoxMat: THREE.MeshStandardMaterial;
  blossomMat: THREE.MeshStandardMaterial;
  isPlayerHome?: boolean;
}

export interface BuiltDioramaHouse {
  group: THREE.Group;
  chimneyTopLocal: [number, number, number];
}

function addMullionedWindow(
  parent: THREE.Group,
  x: number,
  y: number,
  z: number,
  winW: number,
  winH: number,
  rotY: number,
  frameMat: THREE.Material,
  paneMat: THREE.Material,
  sillMat: THREE.Material,
  withFlowerBox = false,
  flowerBoxMat?: THREE.Material,
  blossomMat?: THREE.Material
): void {
  const wg = new THREE.Group();
  wg.position.set(x, y, z);
  wg.rotation.y = rotY;

  const outer = new THREE.Mesh(new THREE.BoxGeometry(winW + 0.18, winH + 0.16, 0.1), frameMat);
  const pane = new THREE.Mesh(new THREE.BoxGeometry(winW, winH, 0.08), paneMat);
  pane.position.z = 0.025;

  // Crisp cross-mullion bars (pencere çıtaları)
  const vBar = new THREE.Mesh(new THREE.BoxGeometry(0.06, winH, 0.09), frameMat);
  vBar.position.z = 0.04;
  const hBar = new THREE.Mesh(new THREE.BoxGeometry(winW, 0.06, 0.09), frameMat);
  hBar.position.z = 0.04;

  // Chunky projecting stone/timber sill
  const sill = new THREE.Mesh(new THREE.BoxGeometry(winW + 0.28, 0.11, 0.2), sillMat);
  sill.position.set(0, -winH / 2 - 0.07, 0.06);

  wg.add(outer, pane, vBar, hBar, sill);

  if (withFlowerBox && flowerBoxMat && blossomMat) {
    const box = new THREE.Mesh(new THREE.BoxGeometry(winW + 0.2, 0.18, 0.24), flowerBoxMat);
    box.position.set(0, -winH / 2 - 0.01, 0.14);
    const flowers = new THREE.Mesh(new THREE.BoxGeometry(winW + 0.1, 0.14, 0.18), blossomMat);
    flowers.position.set(0, -winH / 2 + 0.12, 0.14);
    wg.add(box, flowers);
  }

  parent.add(wg);
}

function addCircularAtticWindow(
  parent: THREE.Group,
  x: number,
  y: number,
  z: number,
  radius: number,
  rotY: number,
  frameMat: THREE.Material,
  paneMat: THREE.Material
): void {
  const cg = new THREE.Group();
  cg.position.set(x, y, z);
  cg.rotation.y = rotY;

  const ring = new THREE.Mesh(new THREE.TorusGeometry(radius, 0.065, 8, 16), frameMat);
  const glass = new THREE.Mesh(new THREE.CylinderGeometry(radius * 0.92, radius * 0.92, 0.08, 14), paneMat);
  glass.rotation.x = Math.PI / 2;

  const crossV = new THREE.Mesh(new THREE.BoxGeometry(0.055, radius * 1.8, 0.1), frameMat);
  const crossH = new THREE.Mesh(new THREE.BoxGeometry(radius * 1.8, 0.055, 0.1), frameMat);

  cg.add(ring, glass, crossV, crossH);
  parent.add(cg);
}

export function buildDioramaHouse(opts: DioramaHouseOptions): BuiltDioramaHouse {
  const { w, d, h, variant, mats, wallMat, lawnMat, flowerBoxMat, blossomMat, isPlayerHome } = opts;
  const house = new THREE.Group();

  // Pick roof material across Charcoal Slate, Aegean Blue-Slate, and Warm Terracotta (matching all 5 refs)
  const roofStyle = variant % 3;
  const roofMat =
    roofStyle === 0
      ? mats.slateRoof
      : roofStyle === 1
        ? mats.aegeanBlueRoof
        : mats.terracottaRoof;
  const windowFrameMat = roofStyle === 2 ? mats.darkTimber : mats.wroughtIron;
  const ridgeAlongZ = variant % 2 === 0;
  const hasFence = variant % 2 === 0 || Boolean(isPlayerHome);

  // 1. Deep Retaining Foundation Plinth + Tactile Miniature Yard Pad (handles Aytepe / Tralleis slopes)
  const yardW = w + 1.35;
  const yardD = d + 2.05;
  const foundation = new THREE.Mesh(
    new THREE.BoxGeometry(yardW, 2.3, yardD),
    mats.travertine
  );
  foundation.position.set(0, -1.04, 0.45);
  foundation.receiveShadow = true;
  house.add(foundation);

  const yardLawn = new THREE.Mesh(
    new THREE.BoxGeometry(yardW - 0.12, 0.14, yardD - 0.12),
    lawnMat
  );
  yardLawn.position.set(0, 0.14, 0.45);
  yardLawn.receiveShadow = true;
  house.add(yardLawn);

  // 2. Main House Walls + Stone Water-Table Base Trim + Gable Plaster Triangle
  const body = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), wallMat);
  body.position.y = h / 2 + 0.2;
  body.castShadow = true;
  body.receiveShadow = true;
  house.add(body);

  const plinthBand = new THREE.Mesh(
    new THREE.BoxGeometry(w + 0.14, 0.34, d + 0.14),
    mats.travertine
  );
  plinthBand.position.y = 0.32;
  house.add(plinthBand);

  const midTrim = new THREE.Mesh(
    new THREE.BoxGeometry(w + 0.16, 0.14, d + 0.16),
    mats.whitePlaster
  );
  midTrim.position.y = h * 0.48 + 0.2;
  house.add(midTrim);

  // Steep pitched gable triangle rising from top of walls
  const peakH = Math.max(1.9, (ridgeAlongZ ? w : d) * 0.42 + (variant % 2) * 0.25);
  const gablePrism = new THREE.Mesh(
    createGableWallPrismGeometry(w, d, peakH, ridgeAlongZ),
    wallMat
  );
  gablePrism.position.y = h + 0.2;
  gablePrism.castShadow = true;
  gablePrism.receiveShadow = true;
  house.add(gablePrism);

  // 3. Thick Overhanging Roof Slabs + Crisp White/Cream Verge Bargeboards
  const roofW = w + 0.92;
  const roofD = d + 0.92;
  const roofSlabs = new THREE.Mesh(
    createDioramaRoofSlabsGeometry(roofW, roofD, peakH, 0.17, ridgeAlongZ),
    roofMat
  );
  roofSlabs.position.y = h + 0.22;
  roofSlabs.castShadow = true;
  roofSlabs.receiveShadow = true;
  house.add(roofSlabs);

  const bargeboard = new THREE.Mesh(
    createGableBargeboardGeometry(roofW, roofD, peakH, 0.18, ridgeAlongZ),
    mats.whitePlaster
  );
  bargeboard.position.y = h + 0.2;
  bargeboard.castShadow = true;
  house.add(bargeboard);

  // 4. Sculptural Chimney + Stone Cap
  const chX = ridgeAlongZ ? w * 0.28 : w * 0.26;
  const chZ = ridgeAlongZ ? -d * 0.12 : -d * 0.18;
  const chY = h + peakH * 0.72 + 0.55;
  const chimneyMat = roofStyle === 0 ? mats.industrialBrick : mats.creamPlaster;
  const chimney = new THREE.Mesh(new THREE.BoxGeometry(0.62, 1.35, 0.62), chimneyMat);
  chimney.position.set(chX, chY, chZ);
  chimney.castShadow = true;
  const chimneyCap = new THREE.Mesh(new THREE.BoxGeometry(0.76, 0.16, 0.76), mats.travertine);
  chimneyCap.position.set(chX, chY + 0.72, chZ);
  house.add(chimney, chimneyCap);

  // 5. Cross-Gable Dormer Window on Roof Slope (especially iconic on ridgeAlongZ=false & variant%3!==2)
  if (!ridgeAlongZ || variant % 3 === 1) {
    const dormW = 1.65;
    const dormD = 1.45;
    const dormH = 1.05;
    const dormPeak = 0.72;
    const dormX = ridgeAlongZ ? w * 0.24 : 0;
    const dormZ = ridgeAlongZ ? 0.1 : d * 0.22;
    const dormY = ridgeAlongZ ? h + peakH * 0.36 : h + peakH * 0.38;

    const dormGroup = new THREE.Group();
    dormGroup.position.set(dormX, dormY, dormZ);
    if (ridgeAlongZ) dormGroup.rotation.y = Math.PI / 2;

    const dormBody = new THREE.Mesh(new THREE.BoxGeometry(dormW, dormH, dormD), wallMat);
    dormBody.position.y = dormH / 2;
    dormBody.castShadow = true;
    const dormGable = new THREE.Mesh(
      createGableWallPrismGeometry(dormW, dormD, dormPeak, true),
      wallMat
    );
    dormGable.position.y = dormH;
    const dormRoof = new THREE.Mesh(
      createDioramaRoofSlabsGeometry(dormW + 0.42, dormD + 0.38, dormPeak, 0.12, true),
      roofMat
    );
    dormRoof.position.y = dormH + 0.02;
    dormRoof.castShadow = true;
    const dormBarge = new THREE.Mesh(
      createGableBargeboardGeometry(dormW + 0.42, dormD + 0.38, dormPeak, 0.13, true),
      mats.whitePlaster
    );
    dormBarge.position.y = dormH + 0.01;
    dormGroup.add(dormBody, dormGable, dormRoof, dormBarge);

    addMullionedWindow(
      dormGroup,
      0,
      dormH * 0.56,
      dormD / 2 + 0.02,
      0.72,
      0.72,
      0,
      windowFrameMat,
      mats.windowLit,
      mats.creamPlaster
    );
    house.add(dormGroup);
  }

  // 6. Front Covered Columned Porch / Veranda + Pitched Mini-Gable Canopy + Wide Steps
  const porchW = Math.min(w * 0.78, 4.4);
  const porchD = 1.38;
  const porchZ = d / 2 + porchD / 2;
  const porchDeck = new THREE.Mesh(
    new THREE.BoxGeometry(porchW, 0.36, porchD),
    mats.travertine
  );
  porchDeck.position.set(0, 0.34, porchZ);
  porchDeck.receiveShadow = true;
  house.add(porchDeck);

  // 3 Wide Front Steps + Garden Stepping Stones
  for (let s = 0; s < 3; s++) {
    const step = new THREE.Mesh(
      new THREE.BoxGeometry(Math.min(2.1, porchW * 0.58), 0.13, 0.34),
      mats.creamPlaster
    );
    step.position.set(0, 0.42 - s * 0.12, d / 2 + porchD + 0.14 + s * 0.28);
    step.receiveShadow = true;
    house.add(step);
  }
  [1.1, 1.6].forEach((pz) => {
    const paver = new THREE.Mesh(new THREE.BoxGeometry(1.05, 0.06, 0.34), mats.travertine);
    paver.position.set(0, 0.21, d / 2 + porchD + pz);
    house.add(paver);
  });

  // Crisp White Porch Columns + Pitched Gable Porch Canopy
  const porchH = 2.15;
  const colPositions =
    porchW >= 3.4 ? [-porchW / 2 + 0.2, 0, porchW / 2 - 0.2] : [-porchW / 2 + 0.2, porchW / 2 - 0.2];
  colPositions.forEach((cx) => {
    const colBase = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.26, 0.28), mats.travertine);
    colBase.position.set(cx, 0.62, d / 2 + porchD - 0.2);
    const col = new THREE.Mesh(new THREE.BoxGeometry(0.18, porchH - 0.22, 0.18), mats.whitePlaster);
    col.position.set(cx, 0.52 + porchH / 2, d / 2 + porchD - 0.2);
    col.castShadow = true;
    house.add(colBase, col);
  });

  const porchPeak = 0.85;
  const porchGableWall = new THREE.Mesh(
    createGableWallPrismGeometry(porchW + 0.1, porchD + 0.15, porchPeak, true),
    mats.creamPlaster
  );
  porchGableWall.position.set(0, 0.52 + porchH, porchZ);
  const porchRoof = new THREE.Mesh(
    createDioramaRoofSlabsGeometry(porchW + 0.56, porchD + 0.48, porchPeak, 0.13, true),
    roofMat
  );
  porchRoof.position.set(0, 0.54 + porchH, porchZ + 0.06);
  porchRoof.castShadow = true;
  const porchBarge = new THREE.Mesh(
    createGableBargeboardGeometry(porchW + 0.56, porchD + 0.48, porchPeak, 0.14, true),
    mats.whitePlaster
  );
  porchBarge.position.set(0, 0.52 + porchH, porchZ + 0.06);
  house.add(porchGableWall, porchRoof, porchBarge);

  // Recessed Warm Wooden Front Door + Porch Lantern + Potted Entry Plants
  const doorX = porchW >= 3.4 ? -porchW * 0.22 : 0;
  const doorFrame = new THREE.Mesh(new THREE.BoxGeometry(1.12, 1.85, 0.12), mats.whitePlaster);
  doorFrame.position.set(doorX, 1.4, d / 2 + 0.03);
  const doorLeaf = new THREE.Mesh(new THREE.BoxGeometry(0.88, 1.68, 0.14), mats.darkTimber);
  doorLeaf.position.set(doorX, 1.34, d / 2 + 0.05);
  const doorKnob = new THREE.Mesh(new THREE.SphereGeometry(0.055, 6, 6), mats.brass);
  doorKnob.position.set(doorX + 0.28, 1.32, d / 2 + 0.14);
  const porchLantern = new THREE.Mesh(new THREE.SphereGeometry(0.13, 8, 6), mats.lampBulb);
  porchLantern.position.set(doorX + 0.66, 2.02, d / 2 + 0.16);
  house.add(doorFrame, doorLeaf, doorKnob, porchLantern);

  if (porchW >= 3.4) {
    // Cozy front parlor bay window beside the front door under the veranda
    addMullionedWindow(
      house,
      porchW * 0.24,
      1.52,
      d / 2 + 0.04,
      1.08,
      1.02,
      0,
      windowFrameMat,
      mats.windowLit,
      mats.creamPlaster,
      true,
      flowerBoxMat,
      blossomMat
    );
  }

  // Potted porch planters flanking the stairs
  [-porchW / 2 - 0.35, porchW / 2 + 0.35].forEach((px) => {
    const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.14, 0.32, 7), mats.terracottaRoof);
    pot.position.set(px, 0.35, d / 2 + 0.45);
    const bush = new THREE.Mesh(new THREE.IcosahedronGeometry(0.26, 1), flowerBoxMat);
    bush.position.set(px, 0.62, d / 2 + 0.45);
    house.add(pot, bush);
  });

  // 7. Upper Facade Windows, Circular Attic Porthole & Side Windows
  const upperY = h * 0.72 + 0.22;
  if (ridgeAlongZ) {
    // Upper center window + circular porthole window inside the front plaster gable
    addMullionedWindow(
      house,
      0,
      upperY,
      d / 2 + 0.04,
      1.18,
      1.08,
      0,
      windowFrameMat,
      mats.windowLit,
      mats.creamPlaster,
      true,
      flowerBoxMat,
      blossomMat
    );
    addCircularAtticWindow(
      house,
      0,
      h + peakH * 0.5 + 0.16,
      d / 2 + 0.04,
      0.34,
      0,
      mats.whitePlaster,
      mats.windowLit
    );
    addCircularAtticWindow(
      house,
      0,
      h + peakH * 0.5 + 0.16,
      -d / 2 - 0.04,
      0.32,
      Math.PI,
      mats.whitePlaster,
      mats.windowLit
    );
  } else {
    // Two symmetrical upper windows on front facade + attic portholes on West/East gables
    [-w * 0.25, w * 0.25].forEach((wx) => {
      addMullionedWindow(
        house,
        wx,
        upperY,
        d / 2 + 0.04,
        0.96,
        0.98,
        0,
        windowFrameMat,
        mats.windowLit,
        mats.creamPlaster,
        variant % 2 === 0,
        flowerBoxMat,
        blossomMat
      );
    });
    [-1, 1].forEach((side) => {
      addCircularAtticWindow(
        house,
        side * (w / 2 + 0.04),
        h + peakH * 0.46 + 0.16,
        0,
        0.34,
        side > 0 ? Math.PI / 2 : -Math.PI / 2,
        mats.whitePlaster,
        mats.windowLit
      );
    });
  }

  // Side Facade Windows (East & West) + Back Windows
  [-1, 1].forEach((side) => {
    const sx = side * (w / 2 + 0.04);
    const sRot = side > 0 ? Math.PI / 2 : -Math.PI / 2;
    [-d * 0.24, d * 0.24].forEach((sz) => {
      addMullionedWindow(
        house,
        sx,
        1.52,
        sz,
        0.86,
        0.96,
        sRot,
        windowFrameMat,
        mats.windowLit,
        mats.creamPlaster
      );
      if (h >= 4.4) {
        addMullionedWindow(
          house,
          sx,
          upperY,
          sz,
          0.82,
          0.9,
          sRot,
          windowFrameMat,
          mats.windowLit,
          mats.creamPlaster
        );
      }
    });
  });

  [-w * 0.24, w * 0.24].forEach((bx) => {
    addMullionedWindow(
      house,
      bx,
      upperY,
      -d / 2 - 0.04,
      0.88,
      0.92,
      Math.PI,
      windowFrameMat,
      mats.windowLit,
      mats.creamPlaster
    );
  });

  // 8. Low White Picket Fence or Wrought-Iron Courtyard Railings along Front Yard Corners
  const fenceZ = d / 2 + porchD + 0.42;
  const gapHalf = Math.min(1.25, porchW * 0.34);
  const sideSpan = yardW / 2 - 0.2 - gapHalf;
  if (sideSpan > 0.45) {
    [-1, 1].forEach((side) => {
      const startX = side * gapHalf;
      const endX = side * (yardW / 2 - 0.22);
      const midX = (startX + endX) / 2;
      if (hasFence) {
        // White picket fence rails + pickets
        const rail = new THREE.Mesh(
          new THREE.BoxGeometry(sideSpan, 0.08, 0.06),
          mats.whitePlaster
        );
        rail.position.set(midX, 0.5, fenceZ);
        house.add(rail);
        const picketCount = Math.max(3, Math.floor(sideSpan / 0.32));
        for (let p = 0; p < picketCount; p++) {
          const t = picketCount > 1 ? p / (picketCount - 1) : 0.5;
          const px = THREE.MathUtils.lerp(startX, endX, t);
          const picket = new THREE.Mesh(
            new THREE.BoxGeometry(0.11, 0.52, 0.07),
            mats.whitePlaster
          );
          picket.position.set(px, 0.45, fenceZ);
          picket.castShadow = true;
          house.add(picket);
        }
      } else {
        // Wrought-iron low courtyard railing with stone corner post (pngtree-3d-house style)
        const post = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.62, 0.24), mats.travertine);
        post.position.set(endX, 0.5, fenceZ);
        const bar = new THREE.Mesh(new THREE.BoxGeometry(sideSpan, 0.38, 0.06), mats.wroughtIron);
        bar.position.set(midX, 0.44, fenceZ);
        house.add(post, bar);
      }
    });
  }

  return {
    group: house,
    chimneyTopLocal: [chX, chY + 0.85, chZ],
  };
}
