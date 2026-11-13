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
      shutter.castShadow = true;
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
    new THREE.BoxGeometry(yardW, 2.3, yardD),
    mats.limestonePlinth
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
    paver.position.set(0, 0.21, d / 2 + porchD + pz);
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
    awning.castShadow = true;
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
          picket.castShadow = true;
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

  return {
    group: house,
    chimneyTopLocal: [chX, chY + 0.85, chZ],
  };
}
