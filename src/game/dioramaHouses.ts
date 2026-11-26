import * as THREE from 'three';
import { HouseExteriorConfig } from '../types/game';
import { CityMaterialLibrary } from './materials';
import { mergeStaticGroupMeshes } from './meshMerge';
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
  blossomMat?: THREE.Material,
  shutterMat?: THREE.Material,
  withJulietBalcony = false,
  ironMat?: THREE.Material,
  terracottaMat?: THREE.Material
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

  // Projecting stone lintel crest above the window (Sparrow Townhouse style)
  const lintel = new THREE.Mesh(new THREE.BoxGeometry(winW + 0.28, 0.1, 0.15), sillMat);
  lintel.position.set(0, winH / 2 + 0.08, 0.045);

  // Chunky projecting stone/timber sill
  const sill = new THREE.Mesh(new THREE.BoxGeometry(winW + 0.28, 0.11, 0.2), sillMat);
  sill.position.set(0, -winH / 2 - 0.07, 0.06);

  wg.add(outer, pane, vBar, hBar, lintel, sill);

  // Paired louvered wooden shutters (Sparrow Sim coastal/Mediterranean signature)
  if (shutterMat) {
    const shW = Math.max(0.24, winW * 0.31);
    const shH = winH + 0.04;
    [-1, 1].forEach((side) => {
      const shutter = new THREE.Mesh(new THREE.BoxGeometry(shW, shH, 0.06), shutterMat);
      shutter.position.set(side * (winW / 2 + shW / 2 + 0.1), 0, 0.035);
      wg.add(shutter);

      const topBar = new THREE.Mesh(new THREE.BoxGeometry(shW * 0.88, 0.045, 0.075), sillMat);
      topBar.position.set(shutter.position.x, shH * 0.22, 0.04);
      const botBar = new THREE.Mesh(new THREE.BoxGeometry(shW * 0.88, 0.045, 0.075), sillMat);
      botBar.position.set(shutter.position.x, -shH * 0.22, 0.04);
      wg.add(topBar, botBar);
    });
  }

  if (withFlowerBox && flowerBoxMat && blossomMat) {
    const potMat = terracottaMat ?? flowerBoxMat;
    const potBox = new THREE.Mesh(new THREE.BoxGeometry(winW + 0.22, 0.19, 0.24), potMat);
    potBox.position.set(0, -winH / 2 - 0.01, 0.14);
    const leafBed = new THREE.Mesh(new THREE.BoxGeometry(winW + 0.12, 0.12, 0.18), flowerBoxMat);
    leafBed.position.set(0, -winH / 2 + 0.1, 0.14);
    wg.add(potBox, leafBed);

    // Sculpted gouache tulip/geranium flower clusters along sill box
    const bloomCount = 3;
    for (let b = 0; b < bloomCount; b++) {
      const bx = ((b - (bloomCount - 1) / 2) * winW) / 3;
      const bloom = new THREE.Mesh(new THREE.IcosahedronGeometry(0.085, 0), blossomMat);
      bloom.position.set(bx, -winH / 2 + 0.2, 0.15);
      wg.add(bloom);
    }
  } else if (withJulietBalcony && ironMat) {
    // Wrought-iron Juliet balcony railing (Sparrow Townhouse alternating upper window motif)
    const railW = winW + 0.24;
    const topRail = new THREE.Mesh(new THREE.BoxGeometry(railW, 0.055, 0.055), ironMat);
    topRail.position.set(0, -winH / 2 + 0.36, 0.14);
    const botRail = new THREE.Mesh(new THREE.BoxGeometry(railW, 0.045, 0.05), ironMat);
    botRail.position.set(0, -winH / 2 + 0.02, 0.14);
    wg.add(topRail, botRail);

    const spindleCount = 5;
    for (let sp = 0; sp < spindleCount; sp++) {
      const sx = ((sp - (spindleCount - 1) / 2) * (railW - 0.12)) / (spindleCount - 1);
      const spindle = new THREE.Mesh(new THREE.BoxGeometry(0.032, 0.34, 0.032), ironMat);
      spindle.position.set(sx, -winH / 2 + 0.19, 0.14);
      wg.add(spindle);
    }
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
  const glass = new THREE.Mesh(
    new THREE.CylinderGeometry(radius * 0.92, radius * 0.92, 0.08, 14),
    paneMat
  );
  glass.rotation.x = Math.PI / 2;

  const crossV = new THREE.Mesh(new THREE.BoxGeometry(0.055, radius * 1.8, 0.1), frameMat);
  const crossH = new THREE.Mesh(new THREE.BoxGeometry(radius * 1.8, 0.055, 0.1), frameMat);

  cg.add(ring, glass, crossV, crossH);
  parent.add(cg);
}

export function buildDioramaHouse(opts: DioramaHouseOptions): BuiltDioramaHouse {
  const { w, d, h, variant, mats, wallMat, lawnMat, flowerBoxMat, blossomMat, isPlayerHome } = opts;
  const house = new THREE.Group();

  // Pick roof & shutter palette across Sparrow Sim + Efeler gouache tones
  const roofStyle = variant % 3;
  const roofMat =
    roofStyle === 0
      ? mats.slateRoof
      : roofStyle === 1
        ? mats.aegeanBlueRoof
        : mats.terracottaRoof;
  const ridgeCapMat = roofStyle === 2 ? mats.terracottaRidge : mats.copperPatina;
  const shutterMat =
    variant % 3 === 0
      ? mats.shutterWood
      : variant % 3 === 1
        ? mats.shutterCobalt
        : mats.shutterOlive;
  const windowFrameMat = roofStyle === 2 ? mats.darkTimber : mats.wroughtIron;
  const ridgeAlongZ = variant % 2 === 0;
  const hasFence = variant % 2 === 0 || Boolean(isPlayerHome);

  // 1. Deep Retaining Foundation Plinth + Tactile Miniature Yard Pad (handles Aytepe / Tralleis slopes)
  const yardW = w + 1.35;
  const yardD = d + 2.05;
  const foundation = new THREE.Mesh(
    new THREE.BoxGeometry(yardW, 3.4, yardD),
    mats.limestonePlinth
  );
  foundation.position.set(0, -1.59, 0.45);
  foundation.receiveShadow = true;
  house.add(foundation);

  const yardLawn = new THREE.Mesh(
    new THREE.BoxGeometry(yardW - 0.12, 0.14, yardD - 0.12),
    lawnMat
  );
  yardLawn.position.set(0, 0.14, 0.45);
  yardLawn.receiveShadow = true;
  house.add(yardLawn);

  // 2. Main House Walls + Rusticated Limestone Base Trim + Corner Pilasters + Story Belt Cornices
  const body = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), wallMat);
  body.position.y = h / 2 + 0.2;
  body.castShadow = true;
  body.receiveShadow = true;
  house.add(body);

  const plinthBand = new THREE.Mesh(
    new THREE.BoxGeometry(w + 0.18, 0.42, d + 0.18),
    mats.limestonePlinth
  );
  plinthBand.position.y = 0.36;
  house.add(plinthBand);

  const midTrim = new THREE.Mesh(
    new THREE.BoxGeometry(w + 0.18, 0.14, d + 0.18),
    mats.whitePlaster
  );
  midTrim.position.y = h * 0.48 + 0.2;
  house.add(midTrim);

  // Dentil eave cornice crowning the upper wall under roof eaves
  const eaveCornice = new THREE.Mesh(
    new THREE.BoxGeometry(w + 0.26, 0.14, d + 0.26),
    mats.whitePlaster
  );
  eaveCornice.position.y = h + 0.15;
  house.add(eaveCornice);

  // Vertical Corner Pilaster Strips + Mid-Story Rusticated Stone Accent Blocks (TownhouseBuilder style)
  [-1, 1].forEach((sx) => {
    [-1, 1].forEach((sz) => {
      const px = sx * (w * 0.5 - 0.04);
      const pz = sz * (d * 0.5 - 0.04);
      const pilaster = new THREE.Mesh(
        new THREE.BoxGeometry(0.18, h - 0.08, 0.18),
        mats.whitePlaster
      );
      pilaster.position.set(px, h / 2 + 0.2, pz);
      house.add(pilaster);

      const accentBlock = new THREE.Mesh(
        new THREE.BoxGeometry(0.24, 0.32, 0.24),
        mats.whitePlaster
      );
      accentBlock.position.set(px, h * 0.26 + 0.2, pz);
      house.add(accentBlock);
    });
  });

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

  // 3. Thick Overhanging Roof Slabs + Copper Patina Ridge Cap + Crisp Cream Verge Bargeboards
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

  // Signature Sparrow Sim copper-patina / terracotta ridge beam along roof crest
  const ridgeCap = new THREE.Mesh(
    new THREE.BoxGeometry(
      ridgeAlongZ ? 0.28 : roofW + 0.04,
      0.16,
      ridgeAlongZ ? roofD + 0.04 : 0.28
    ),
    ridgeCapMat
  );
  ridgeCap.position.y = h + peakH + 0.26;
  house.add(ridgeCap);

  const bargeboard = new THREE.Mesh(
    createGableBargeboardGeometry(roofW, roofD, peakH, 0.18, ridgeAlongZ),
    mats.whitePlaster
  );
  bargeboard.position.y = h + 0.2;
  house.add(bargeboard);

  // 4. Sculptural Chimney + Stone Cap
  const chX = ridgeAlongZ ? w * 0.28 : w * 0.26;
  const chZ = ridgeAlongZ ? -d * 0.12 : -d * 0.18;
  const chY = h + peakH * 0.72 + 0.55;
  const chimneyMat = roofStyle === 0 ? mats.industrialBrick : mats.creamPlaster;
  const chimney = new THREE.Mesh(new THREE.BoxGeometry(0.62, 1.35, 0.62), chimneyMat);
  chimney.position.set(chX, chY, chZ);
  const chimneyCap = new THREE.Mesh(new THREE.BoxGeometry(0.76, 0.16, 0.76), mats.limestonePlinth);
  chimneyCap.position.set(chX, chY + 0.72, chZ);
  house.add(chimney, chimneyCap);

  // 5. Cross-Gable Dormer Window on Roof Slope
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
    mats.limestonePlinth
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
    const paver = new THREE.Mesh(new THREE.BoxGeometry(1.05, 0.06, 0.34), mats.limestonePlinth);
    paver.position.set(0, 0.225, d / 2 + porchD + pz);
    house.add(paver);
  });

  // Crisp Cream Porch Columns + Pitched Gable Porch Canopy
  const porchH = 2.15;
  const colPositions =
    porchW >= 3.4 ? [-porchW / 2 + 0.2, 0, porchW / 2 - 0.2] : [-porchW / 2 + 0.2, porchW / 2 - 0.2];
  colPositions.forEach((cx) => {
    const colBase = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.26, 0.28), mats.limestonePlinth);
    colBase.position.set(cx, 0.62, d / 2 + porchD - 0.2);
    const col = new THREE.Mesh(new THREE.BoxGeometry(0.18, porchH - 0.22, 0.18), mats.whitePlaster);
    col.position.set(cx, 0.52 + porchH / 2, d / 2 + porchD - 0.2);
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
  const porchLantern = new THREE.Mesh(new THREE.SphereGeometry(0.085, 10, 8), mats.lampBulb);
  porchLantern.position.set(doorX + 0.66, 2.02, d / 2 + 0.14);
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
      blossomMat,
      undefined,
      false,
      mats.wroughtIron,
      mats.terracottaRoof
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

  // 7. Upper Facade Windows with Louvered Shutters, Flowerboxes / Wrought-Iron Juliet Balconies
  const upperY = h * 0.72 + 0.22;
  if (ridgeAlongZ) {
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
      blossomMat,
      shutterMat,
      false,
      mats.wroughtIron,
      mats.terracottaRoof
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
    // Two symmetrical upper windows alternating flowerboxes & wrought-iron Juliet balconies
    [-w * 0.25, w * 0.25].forEach((wx, idx) => {
      const useFlowerbox = (variant + idx) % 2 === 0;
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
        useFlowerbox,
        flowerBoxMat,
        blossomMat,
        shutterMat,
        !useFlowerbox,
        mats.wroughtIron,
        mats.terracottaRoof
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

  // Side Facade Windows (East & West) with Louvered Shutters + Optional Striped Café Awning
  [-1, 1].forEach((side) => {
    const sx = side * (w / 2 + 0.04);
    const sRot = side > 0 ? Math.PI / 2 : -Math.PI / 2;
    [-d * 0.24, d * 0.24].forEach((sz, idx) => {
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
        mats.creamPlaster,
        false,
        undefined,
        undefined,
        shutterMat
      );
      if (h >= 4.4) {
        const useFlowerbox = (variant + idx + (side > 0 ? 1 : 0)) % 2 === 0;
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
          mats.creamPlaster,
          useFlowerbox,
          flowerBoxMat,
          blossomMat,
          shutterMat,
          !useFlowerbox,
          mats.wroughtIron,
          mats.terracottaRoof
        );
      }
    });
  });

  // Charming Sparrow Sim striped café awning over East side ground bay on corner variants
  if (variant % 3 === 1 && !isPlayerHome) {
    const awning = new THREE.Mesh(
      new THREE.BoxGeometry(0.66, 0.08, Math.min(d * 0.62, 2.5)),
      mats.stripedAwning
    );
    awning.position.set(w / 2 + 0.3, 2.34, 0);
    awning.rotation.z = -0.34;
    house.add(awning);
  }

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
      mats.creamPlaster,
      false,
      undefined,
      undefined,
      shutterMat
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
          house.add(picket);
        }
      } else {
        const post = new THREE.Mesh(
          new THREE.BoxGeometry(0.24, 0.62, 0.24),
          mats.limestonePlinth
        );
        post.position.set(endX, 0.5, fenceZ);
        const bar = new THREE.Mesh(new THREE.BoxGeometry(sideSpan, 0.38, 0.06), mats.wroughtIron);
        bar.position.set(midX, 0.44, fenceZ);
        house.add(post, bar);
      }
    });
  }
  mergeStaticGroupMeshes(house);
  return {
    group: house,
    chimneyTopLocal: [chX, chY + 0.85, chZ],
  };
}

export interface CustomPlayerHouseOptions {
  config: HouseExteriorConfig;
  mats: CityMaterialLibrary;
  lawnMat: THREE.MeshStandardMaterial;
  flowerBoxMat: THREE.MeshStandardMaterial;
  blossomMat: THREE.MeshStandardMaterial;
}

export interface BuiltCustomPlayerHouse extends BuiltDioramaHouse {
  dispose: () => void;
}

export function buildCustomPlayerHouse(opts: CustomPlayerHouseOptions): BuiltCustomPlayerHouse {
  const { config, mats, lawnMat, flowerBoxMat, blossomMat } = opts;
  const customMats: THREE.Material[] = [];

  const wallMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color(config.wallColor),
    map: mats.creamPlaster.map,
    roughness: 0.84,
    metalness: 0.02,
  });
  const roofMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color(config.roofColor),
    map: mats.slateRoof.map,
    roughness: 0.66,
    metalness: 0.08,
  });
  const trimMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color(config.trimColor),
    roughness: 0.78,
    metalness: 0.03,
  });
  const secondaryWallMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color(config.wallColor).offsetHSL(0.02, -0.04, -0.06),
    map: mats.creamPlaster.map,
    roughness: 0.85,
    metalness: 0.02,
  });
  const timberDeckMat = new THREE.MeshStandardMaterial({
    color: 0xa77a4f,
    roughness: 0.8,
    metalness: 0.02,
  });
  const accentFrameMat = new THREE.MeshStandardMaterial({
    color: 0x3b444f,
    roughness: 0.55,
    metalness: 0.12,
  });
  customMats.push(wallMat, roofMat, trimMat, secondaryWallMat, timberDeckMat, accentFrameMat);

  const house = new THREE.Group();
  const w = 6.0;
  const d = 5.2;
  const h = 4.35;
  const yardW = w + 1.45;
  const yardD = d + 2.25;

  // Shared Yard Foundation + Lawn
  const foundation = new THREE.Mesh(
    new THREE.BoxGeometry(yardW, 3.4, yardD),
    mats.limestonePlinth
  );
  foundation.position.set(0, -1.59, 0.48);
  foundation.receiveShadow = true;
  house.add(foundation);

  const yardLawn = new THREE.Mesh(
    new THREE.BoxGeometry(yardW - 0.14, 0.14, yardD - 0.14),
    lawnMat
  );
  yardLawn.position.set(0, 0.14, 0.48);
  yardLawn.receiveShadow = true;
  house.add(yardLawn);

  let chimneyTopLocal: [number, number, number] = [1.8, 7.6, -0.6];

  if (config.style === 'modern_gable') {
    // Style 2: Modern Cross-Gable House with Corner Pilasters, Dual Porches & Stone Pavers
    const mainW = 5.4;
    const mainD = 4.4;
    const mainH = 4.25;
    const wingW = 2.65;
    const wingD = 2.35;
    const wingH = 3.95;

    const mainBody = new THREE.Mesh(new THREE.BoxGeometry(mainW, mainH, mainD), wallMat);
    mainBody.position.set(-0.25, mainH / 2 + 0.2, -0.25);
    mainBody.castShadow = true;
    mainBody.receiveShadow = true;
    house.add(mainBody);

    const wingBody = new THREE.Mesh(new THREE.BoxGeometry(wingW, wingH, wingD), wallMat);
    wingBody.position.set(1.15, wingH / 2 + 0.2, 1.55);
    wingBody.castShadow = true;
    wingBody.receiveShadow = true;
    house.add(wingBody);

    // Rusticated Plinth + Corner Pilasters
    const mainPlinth = new THREE.Mesh(
      new THREE.BoxGeometry(mainW + 0.18, 0.42, mainD + 0.18),
      mats.limestonePlinth
    );
    mainPlinth.position.set(-0.25, 0.36, -0.25);
    const wingPlinth = new THREE.Mesh(
      new THREE.BoxGeometry(wingW + 0.18, 0.42, wingD + 0.18),
      mats.limestonePlinth
    );
    wingPlinth.position.set(1.15, 0.36, 1.55);
    house.add(mainPlinth, wingPlinth);

    [
      [-0.25 - mainW / 2, -0.25 - mainD / 2],
      [-0.25 + mainW / 2, -0.25 - mainD / 2],
      [-0.25 - mainW / 2, -0.25 + mainD / 2],
      [1.15 - wingW / 2, 1.55 + wingD / 2],
      [1.15 + wingW / 2, 1.55 + wingD / 2],
    ].forEach(([px, pz]) => {
      const pil = new THREE.Mesh(new THREE.BoxGeometry(0.22, mainH, 0.22), trimMat);
      pil.position.set(px, mainH / 2 + 0.2, pz);
      house.add(pil);
    });

    // Main Gable (ridge along X) + Wing Cross-Gable (ridge along Z)
    const mainPeak = 2.05;
    const mainGable = new THREE.Mesh(
      createGableWallPrismGeometry(mainW, mainD, mainPeak, false),
      wallMat
    );
    mainGable.position.set(-0.25, mainH + 0.2, -0.25);
    const mainRoof = new THREE.Mesh(
      createDioramaRoofSlabsGeometry(mainW + 0.85, mainD + 0.85, mainPeak, 0.16, false),
      roofMat
    );
    mainRoof.position.set(-0.25, mainH + 0.22, -0.25);
    mainRoof.castShadow = true;
    const mainBarge = new THREE.Mesh(
      createGableBargeboardGeometry(mainW + 0.85, mainD + 0.85, mainPeak, 0.16, false),
      trimMat
    );
    mainBarge.position.set(-0.25, mainH + 0.2, -0.25);
    house.add(mainGable, mainRoof, mainBarge);

    const wingPeak = 1.45;
    const wingGable = new THREE.Mesh(
      createGableWallPrismGeometry(wingW, wingD + 0.5, wingPeak, true),
      wallMat
    );
    wingGable.position.set(1.15, wingH + 0.2, 1.3);
    const wingRoof = new THREE.Mesh(
      createDioramaRoofSlabsGeometry(wingW + 0.72, wingD + 0.95, wingPeak, 0.15, true),
      roofMat
    );
    wingRoof.position.set(1.15, wingH + 0.22, 1.32);
    wingRoof.castShadow = true;
    const wingBarge = new THREE.Mesh(
      createGableBargeboardGeometry(wingW + 0.72, wingD + 0.95, wingPeak, 0.15, true),
      trimMat
    );
    wingBarge.position.set(1.15, wingH + 0.2, 1.32);
    house.add(wingGable, wingRoof, wingBarge);

    // Chimney
    const chX = -1.7;
    const chZ = -1.2;
    const chY = mainH + mainPeak * 0.65 + 0.55;
    const chim = new THREE.Mesh(new THREE.BoxGeometry(0.58, 1.3, 0.58), trimMat);
    chim.position.set(chX, chY, chZ);
    const chimCap = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.15, 0.72), mats.limestonePlinth);
    chimCap.position.set(chX, chY + 0.7, chZ);
    house.add(chim, chimCap);
    chimneyTopLocal = [chX, chY + 0.85, chZ];

    // Covered Side/Front Porch under recessed nook
    const porchW = 2.6;
    const porchD = 1.45;
    const porchX = -1.45;
    const porchZ = 2.3;
    const porchDeck = new THREE.Mesh(
      new THREE.BoxGeometry(porchW, 0.34, porchD),
      mats.limestonePlinth
    );
    porchDeck.position.set(porchX, 0.34, porchZ);
    house.add(porchDeck);

    [-porchW / 2 + 0.2, porchW / 2 - 0.2].forEach((cx) => {
      const col = new THREE.Mesh(new THREE.BoxGeometry(0.2, 2.2, 0.2), trimMat);
      col.position.set(porchX + cx, 1.55, porchZ + porchD / 2 - 0.18);
      house.add(col);
    });
    const porchRoof = new THREE.Mesh(
      createDioramaRoofSlabsGeometry(porchW + 0.45, porchD + 0.4, 0.68, 0.12, true),
      roofMat
    );
    porchRoof.position.set(porchX, 2.65, porchZ);
    house.add(porchRoof);

    // Door + Windows + Stepping Pavers
    const door = new THREE.Mesh(new THREE.BoxGeometry(0.92, 1.72, 0.14), mats.darkTimber);
    door.position.set(porchX + 0.15, 1.35, 1.96);
    const doorFrame = new THREE.Mesh(new THREE.BoxGeometry(1.12, 1.88, 0.1), trimMat);
    doorFrame.position.set(porchX + 0.15, 1.4, 1.94);
    house.add(doorFrame, door);

    addMullionedWindow(house, 1.15, 1.58, 2.75, 1.18, 1.1, 0, accentFrameMat, mats.windowLit, trimMat);
    addMullionedWindow(house, 1.15, 3.15, 2.75, 1.05, 0.98, 0, accentFrameMat, mats.windowLit, trimMat);
    addMullionedWindow(house, -1.45, 3.22, 1.98, 1.02, 0.94, 0, accentFrameMat, mats.windowLit, trimMat);
    addMullionedWindow(house, -2.96, 1.65, -0.25, 1.0, 1.05, -Math.PI / 2, accentFrameMat, mats.windowLit, trimMat);
    addMullionedWindow(house, 2.48, 1.65, 0.25, 1.0, 1.05, Math.PI / 2, accentFrameMat, mats.windowLit, trimMat);

    for (let s = 0; s < 3; s++) {
      const paver = new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.08, 0.42), mats.limestonePlinth);
      paver.position.set(porchX, 0.22, 3.1 + s * 0.56);
      house.add(paver);
    }
  } else if (config.style === 'aegean_veranda') {
    // Style 3: Aegean Veranda Cottage with Full-Width Deck, Tapered Columns, Dormer & Side Patio
    const body = new THREE.Mesh(new THREE.BoxGeometry(w, h, d * 0.88), wallMat);
    body.position.set(0, h / 2 + 0.2, -0.35);
    body.castShadow = true;
    body.receiveShadow = true;
    house.add(body);

    const plinth = new THREE.Mesh(
      new THREE.BoxGeometry(w + 0.16, 0.4, d * 0.88 + 0.16),
      mats.limestonePlinth
    );
    plinth.position.set(0, 0.36, -0.35);
    house.add(plinth);

    const peakH = 2.25;
    const gable = new THREE.Mesh(
      createGableWallPrismGeometry(w, d * 0.88, peakH, false),
      wallMat
    );
    gable.position.set(0, h + 0.2, -0.35);
    const roofSlabs = new THREE.Mesh(
      createDioramaRoofSlabsGeometry(w + 0.95, d * 0.88 + 0.95, peakH, 0.17, false),
      roofMat
    );
    roofSlabs.position.set(0, h + 0.22, -0.35);
    roofSlabs.castShadow = true;
    const barge = new THREE.Mesh(
      createGableBargeboardGeometry(w + 0.95, d * 0.88 + 0.95, peakH, 0.17, false),
      trimMat
    );
    barge.position.set(0, h + 0.2, -0.35);
    house.add(gable, roofSlabs, barge);

    // Centered Front Roof Dormer
    const dormBody = new THREE.Mesh(new THREE.BoxGeometry(1.75, 1.15, 1.5), wallMat);
    dormBody.position.set(0, h + 0.95, 0.85);
    const dormGable = new THREE.Mesh(
      createGableWallPrismGeometry(1.75, 1.5, 0.78, true),
      wallMat
    );
    dormGable.position.set(0, h + 1.52, 0.85);
    const dormRoof = new THREE.Mesh(
      createDioramaRoofSlabsGeometry(2.15, 1.85, 0.78, 0.12, true),
      roofMat
    );
    dormRoof.position.set(0, h + 1.54, 0.88);
    house.add(dormBody, dormGable, dormRoof);
    addMullionedWindow(house, 0, h + 1.0, 1.62, 0.88, 0.78, 0, trimMat, mats.windowLit, trimMat);

    // Chimney
    const chX = -w * 0.3;
    const chZ = -0.8;
    const chY = h + peakH * 0.7 + 0.55;
    const chim = new THREE.Mesh(new THREE.BoxGeometry(0.58, 1.3, 0.58), wallMat);
    chim.position.set(chX, chY, chZ);
    const chimCap = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.15, 0.72), trimMat);
    chimCap.position.set(chX, chY + 0.7, chZ);
    house.add(chim, chimCap);
    chimneyTopLocal = [chX, chY + 0.85, chZ];

    // Full-Width Front Timber Veranda Deck + 4 Tapered Columns + Shed Roof
    const verW = w + 0.25;
    const verD = 1.65;
    const verZ = d * 0.44 - 0.35 + verD / 2;
    const verDeck = new THREE.Mesh(new THREE.BoxGeometry(verW, 0.32, verD), timberDeckMat);
    verDeck.position.set(0, 0.32, verZ);
    verDeck.receiveShadow = true;
    house.add(verDeck);

    // Wide Steps
    for (let s = 0; s < 3; s++) {
      const step = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.12, 0.32), timberDeckMat);
      step.position.set(0, 0.38 - s * 0.1, verZ + verD / 2 + 0.14 + s * 0.26);
      house.add(step);
    }

    [-2.75, -1.05, 1.05, 2.75].forEach((cx) => {
      const plinthCol = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.45, 0.32), mats.limestonePlinth);
      plinthCol.position.set(cx, 0.68, verZ + verD / 2 - 0.18);
      const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.12, 1.85, 8), trimMat);
      shaft.position.set(cx, 1.75, verZ + verD / 2 - 0.18);
      house.add(plinthCol, shaft);
    });

    const verRoof = new THREE.Mesh(
      new THREE.BoxGeometry(verW + 0.45, 0.14, verD + 0.35),
      roofMat
    );
    verRoof.position.set(0, 2.72, verZ + 0.05);
    verRoof.rotation.x = 0.24;
    house.add(verRoof);

    // Front Door + Parlor Windows
    const door = new THREE.Mesh(new THREE.BoxGeometry(0.92, 1.75, 0.12), mats.darkTimber);
    door.position.set(0, 1.36, d * 0.44 - 0.35 + 0.04);
    const doorFrame = new THREE.Mesh(new THREE.BoxGeometry(1.14, 1.9, 0.1), trimMat);
    doorFrame.position.set(0, 1.4, d * 0.44 - 0.35 + 0.02);
    house.add(doorFrame, door);

    [-1.85, 1.85].forEach((wx) => {
      addMullionedWindow(
        house,
        wx,
        1.55,
        d * 0.44 - 0.35 + 0.04,
        1.05,
        1.05,
        0,
        trimMat,
        mats.windowLit,
        trimMat,
        true,
        flowerBoxMat,
        blossomMat
      );
    });
    [-1, 1].forEach((side) => {
      addMullionedWindow(
        house,
        side * (w / 2 + 0.03),
        1.65,
        -0.35,
        1.05,
        1.05,
        side > 0 ? Math.PI / 2 : -Math.PI / 2,
        trimMat,
        mats.windowLit,
        trimMat
      );
    });

    // Side Lawn Garden Bench + Coffee Table
    const benchSeat = new THREE.Mesh(new THREE.BoxGeometry(1.05, 0.22, 0.56), timberDeckMat);
    benchSeat.position.set(2.15, 0.36, 3.2);
    const benchCushion = new THREE.Mesh(new THREE.BoxGeometry(0.96, 0.14, 0.48), trimMat);
    benchCushion.position.set(2.15, 0.5, 3.2);
    const patioTable = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.28, 0.42), timberDeckMat);
    patioTable.position.set(1.15, 0.32, 3.25);
    house.add(benchSeat, benchCushion, patioTable);
  } else if (config.style === 'twin_cottage') {
    // Style 4: Twin Side-by-Side Attached Gables with Circular Attic Windows & Flower Boxes
    const leftW = 3.05;
    const rightW = 2.95;
    const twinD = 5.1;
    const leftH = 4.25;
    const rightH = 4.45;

    const leftBody = new THREE.Mesh(new THREE.BoxGeometry(leftW, leftH, twinD), wallMat);
    leftBody.position.set(-1.5, leftH / 2 + 0.2, -0.1);
    leftBody.castShadow = true;
    leftBody.receiveShadow = true;
    const rightBody = new THREE.Mesh(
      new THREE.BoxGeometry(rightW, rightH, twinD - 0.3),
      secondaryWallMat
    );
    rightBody.position.set(1.5, rightH / 2 + 0.2, -0.25);
    rightBody.castShadow = true;
    rightBody.receiveShadow = true;
    house.add(leftBody, rightBody);

    const plinth = new THREE.Mesh(
      new THREE.BoxGeometry(6.15, 0.42, twinD + 0.15),
      mats.limestonePlinth
    );
    plinth.position.set(0, 0.36, -0.12);
    house.add(plinth);

    const peakL = 2.05;
    const peakR = 2.15;
    [
      { cx: -1.5, bw: leftW, bd: twinD, bh: leftH, cz: -0.1, peak: peakL, m: wallMat },
      { cx: 1.5, bw: rightW, bd: twinD - 0.3, bh: rightH, cz: -0.25, peak: peakR, m: secondaryWallMat },
    ].forEach((b) => {
      const g = new THREE.Mesh(createGableWallPrismGeometry(b.bw, b.bd, b.peak, true), b.m);
      g.position.set(b.cx, b.bh + 0.2, b.cz);
      const r = new THREE.Mesh(
        createDioramaRoofSlabsGeometry(b.bw + 0.45, b.bd + 0.72, b.peak, 0.15, true),
        roofMat
      );
      r.position.set(b.cx, b.bh + 0.22, b.cz);
      r.castShadow = true;
      const bg = new THREE.Mesh(
        createGableBargeboardGeometry(b.bw + 0.45, b.bd + 0.72, b.peak, 0.15, true),
        trimMat
      );
      bg.position.set(b.cx, b.bh + 0.2, b.cz);
      house.add(g, r, bg);

      addCircularAtticWindow(
        house,
        b.cx,
        b.bh + b.peak * 0.48 + 0.2,
        b.cz + b.bd / 2 + 0.04,
        0.32,
        0,
        trimMat,
        mats.windowLit
      );
    });

    // Chimney between twins
    const chX = 0.0;
    const chZ = -1.2;
    const chY = rightH + peakR * 0.65 + 0.5;
    const chim = new THREE.Mesh(new THREE.BoxGeometry(0.56, 1.25, 0.56), trimMat);
    chim.position.set(chX, chY, chZ);
    const chimCap = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.14, 0.7), mats.limestonePlinth);
    chimCap.position.set(chX, chY + 0.68, chZ);
    house.add(chim, chimCap);
    chimneyTopLocal = [chX, chY + 0.85, chZ];

    // Twin Front Wooden Deck + Steps
    const deck = new THREE.Mesh(new THREE.BoxGeometry(5.5, 0.34, 1.35), timberDeckMat);
    deck.position.set(0, 0.33, 2.95);
    deck.receiveShadow = true;
    house.add(deck);
    for (let s = 0; s < 3; s++) {
      const step = new THREE.Mesh(new THREE.BoxGeometry(1.75, 0.11, 0.3), timberDeckMat);
      step.position.set(-1.35, 0.38 - s * 0.1, 3.66 + s * 0.25);
      house.add(step);
    }

    const door = new THREE.Mesh(new THREE.BoxGeometry(0.88, 1.72, 0.12), mats.darkTimber);
    door.position.set(-1.5, 1.35, 2.48);
    const doorFrame = new THREE.Mesh(new THREE.BoxGeometry(1.06, 1.86, 0.1), trimMat);
    doorFrame.position.set(-1.5, 1.4, 2.46);
    house.add(doorFrame, door);

    addMullionedWindow(
      house,
      1.5,
      1.55,
      2.34,
      1.2,
      1.05,
      0,
      trimMat,
      mats.windowLit,
      trimMat,
      true,
      flowerBoxMat,
      blossomMat
    );
    addMullionedWindow(
      house,
      -1.5,
      3.15,
      2.48,
      1.08,
      0.98,
      0,
      trimMat,
      mats.windowLit,
      trimMat,
      true,
      flowerBoxMat,
      blossomMat
    );
    addMullionedWindow(
      house,
      1.5,
      3.25,
      2.34,
      1.08,
      0.98,
      0,
      trimMat,
      mats.windowLit,
      trimMat,
      true,
      flowerBoxMat,
      blossomMat
    );

    // Side Windows & Lush Garden Shrubs
    [-1, 1].forEach((side) => {
      addMullionedWindow(
        house,
        side * 3.04,
        1.65,
        -0.1,
        0.95,
        0.95,
        side > 0 ? Math.PI / 2 : -Math.PI / 2,
        trimMat,
        mats.windowLit,
        trimMat
      );
      const bush = new THREE.Mesh(new THREE.IcosahedronGeometry(0.42, 1), flowerBoxMat);
      bush.position.set(side * 2.95, 0.55, 3.45);
      house.add(bush);
    });
  } else {
    // Style 1: 'cottage_villa' (Classic Steep Pitched Roof, Side Chimney, Front Dormer, Porch + White Picket Fence)
    const body = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), wallMat);
    body.position.set(0, h / 2 + 0.2, 0);
    body.castShadow = true;
    body.receiveShadow = true;
    house.add(body);

    const plinthBand = new THREE.Mesh(
      new THREE.BoxGeometry(w + 0.18, 0.42, d + 0.18),
      mats.limestonePlinth
    );
    plinthBand.position.y = 0.36;
    const midTrim = new THREE.Mesh(new THREE.BoxGeometry(w + 0.18, 0.14, d + 0.18), trimMat);
    midTrim.position.y = h * 0.48 + 0.2;
    const eaveCornice = new THREE.Mesh(new THREE.BoxGeometry(w + 0.26, 0.14, d + 0.26), trimMat);
    eaveCornice.position.y = h + 0.15;
    house.add(plinthBand, midTrim, eaveCornice);

    [-1, 1].forEach((sx) => {
      [-1, 1].forEach((sz) => {
        const pil = new THREE.Mesh(new THREE.BoxGeometry(0.18, h - 0.08, 0.18), trimMat);
        pil.position.set(sx * (w * 0.5 - 0.04), h / 2 + 0.2, sz * (d * 0.5 - 0.04));
        house.add(pil);
      });
    });

    const peakH = 2.45;
    const gablePrism = new THREE.Mesh(
      createGableWallPrismGeometry(w, d, peakH, true),
      wallMat
    );
    gablePrism.position.y = h + 0.2;
    const roofSlabs = new THREE.Mesh(
      createDioramaRoofSlabsGeometry(w + 0.92, d + 0.92, peakH, 0.17, true),
      roofMat
    );
    roofSlabs.position.y = h + 0.22;
    roofSlabs.castShadow = true;
    const bargeboard = new THREE.Mesh(
      createGableBargeboardGeometry(w + 0.92, d + 0.92, peakH, 0.18, true),
      trimMat
    );
    bargeboard.position.y = h + 0.2;
    house.add(gablePrism, roofSlabs, bargeboard);

    // Tall Chimney
    const chX = w * 0.3;
    const chZ = -d * 0.14;
    const chY = h + peakH * 0.72 + 0.58;
    const chimney = new THREE.Mesh(new THREE.BoxGeometry(0.64, 1.45, 0.64), mats.industrialBrick);
    chimney.position.set(chX, chY, chZ);
    const chimneyCap = new THREE.Mesh(new THREE.BoxGeometry(0.78, 0.16, 0.78), mats.limestonePlinth);
    chimneyCap.position.set(chX, chY + 0.76, chZ);
    house.add(chimney, chimneyCap);
    chimneyTopLocal = [chX, chY + 0.9, chZ];

    // Dormer on East/Side Roof Slope
    const dormGroup = new THREE.Group();
    dormGroup.position.set(-w * 0.25, h + peakH * 0.35, 0.15);
    dormGroup.rotation.y = -Math.PI / 2;
    const dormBody = new THREE.Mesh(new THREE.BoxGeometry(1.55, 1.0, 1.4), wallMat);
    dormBody.position.y = 0.5;
    const dormGable = new THREE.Mesh(
      createGableWallPrismGeometry(1.55, 1.4, 0.7, true),
      wallMat
    );
    dormGable.position.y = 1.0;
    const dormRoof = new THREE.Mesh(
      createDioramaRoofSlabsGeometry(1.95, 1.75, 0.7, 0.12, true),
      roofMat
    );
    dormRoof.position.y = 1.02;
    dormGroup.add(dormBody, dormGable, dormRoof);
    addMullionedWindow(dormGroup, 0, 0.55, 0.72, 0.7, 0.7, 0, accentFrameMat, mats.windowLit, trimMat);
    house.add(dormGroup);

    // Columned Front Porch + Steps
    const porchW = 4.2;
    const porchD = 1.38;
    const porchZ = d / 2 + porchD / 2;
    const porchDeck = new THREE.Mesh(
      new THREE.BoxGeometry(porchW, 0.36, porchD),
      mats.limestonePlinth
    );
    porchDeck.position.set(0, 0.34, porchZ);
    house.add(porchDeck);

    for (let s = 0; s < 3; s++) {
      const step = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.13, 0.34), trimMat);
      step.position.set(0, 0.42 - s * 0.12, d / 2 + porchD + 0.14 + s * 0.28);
      house.add(step);
    }

    [-porchW / 2 + 0.22, 0, porchW / 2 - 0.22].forEach((cx) => {
      const col = new THREE.Mesh(new THREE.BoxGeometry(0.18, 2.0, 0.18), trimMat);
      col.position.set(cx, 1.56, d / 2 + porchD - 0.2);
      house.add(col);
    });
    const porchGable = new THREE.Mesh(
      createGableWallPrismGeometry(porchW + 0.1, porchD + 0.15, 0.85, true),
      trimMat
    );
    porchGable.position.set(0, 2.66, porchZ);
    const porchRoof = new THREE.Mesh(
      createDioramaRoofSlabsGeometry(porchW + 0.55, porchD + 0.48, 0.85, 0.13, true),
      roofMat
    );
    porchRoof.position.set(0, 2.68, porchZ + 0.06);
    const porchBarge = new THREE.Mesh(
      createGableBargeboardGeometry(porchW + 0.55, porchD + 0.48, 0.85, 0.14, true),
      trimMat
    );
    porchBarge.position.set(0, 2.66, porchZ + 0.06);
    house.add(porchGable, porchRoof, porchBarge);

    // Front Door & Bay Window
    const doorFrame = new THREE.Mesh(new THREE.BoxGeometry(1.12, 1.85, 0.12), trimMat);
    doorFrame.position.set(-0.92, 1.4, d / 2 + 0.03);
    const doorLeaf = new THREE.Mesh(new THREE.BoxGeometry(0.88, 1.68, 0.14), mats.darkTimber);
    doorLeaf.position.set(-0.92, 1.34, d / 2 + 0.05);
    const porchLantern = new THREE.Mesh(new THREE.SphereGeometry(0.085, 10, 8), mats.lampBulb);
    porchLantern.position.set(-0.26, 2.02, d / 2 + 0.14);
    house.add(doorFrame, doorLeaf, porchLantern);

    addMullionedWindow(
      house,
      1.02,
      1.52,
      d / 2 + 0.04,
      1.08,
      1.02,
      0,
      accentFrameMat,
      mats.windowLit,
      trimMat,
      true,
      flowerBoxMat,
      blossomMat
    );
    addMullionedWindow(
      house,
      0,
      h * 0.72 + 0.22,
      d / 2 + 0.04,
      1.18,
      1.08,
      0,
      accentFrameMat,
      mats.windowLit,
      trimMat,
      true,
      flowerBoxMat,
      blossomMat,
      mats.shutterWood
    );
    addCircularAtticWindow(
      house,
      0,
      h + peakH * 0.5 + 0.16,
      d / 2 + 0.04,
      0.34,
      0,
      trimMat,
      mats.windowLit
    );

    [-1, 1].forEach((side) => {
      [-d * 0.24, d * 0.24].forEach((sz) => {
        addMullionedWindow(
          house,
          side * (w / 2 + 0.04),
          1.52,
          sz,
          0.86,
          0.96,
          side > 0 ? Math.PI / 2 : -Math.PI / 2,
          accentFrameMat,
          mats.windowLit,
          trimMat,
          false,
          undefined,
          undefined,
          mats.shutterWood
        );
      });
    });

    // White Picket Fence
    const fenceZ = d / 2 + porchD + 0.42;
    [-1, 1].forEach((side) => {
      const startX = side * 1.25;
      const endX = side * (yardW / 2 - 0.22);
      const midX = (startX + endX) / 2;
      const rail = new THREE.Mesh(
        new THREE.BoxGeometry(Math.abs(endX - startX), 0.08, 0.06),
        trimMat
      );
      rail.position.set(midX, 0.5, fenceZ);
      house.add(rail);
      for (let p = 0; p < 6; p++) {
        const px = THREE.MathUtils.lerp(startX, endX, p / 5);
        const picket = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.52, 0.07), trimMat);
        picket.position.set(px, 0.45, fenceZ);
        house.add(picket);
      }
    });
  }

  mergeStaticGroupMeshes(house);
  return {
    group: house,
    chimneyTopLocal,
    dispose: () => {
      house.traverse((obj) => {
        if ((obj as THREE.Mesh).isMesh) {
          (obj as THREE.Mesh).geometry.dispose();
        }
      });
      customMats.forEach((m) => m.dispose());
    },
  };
}
