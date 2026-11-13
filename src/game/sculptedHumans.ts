import * as THREE from 'three';
import { AvatarConfig } from '../types/game';
import {
  createStorybookMaterial,
  extrudeShape,
  loftOrganicHull,
  LoftStation,
  mergeParts,
  rbox,
  rcyl,
  smoothSphere,
  SPARROW_PALETTE,
  transformGeo,
} from './sculptor';

export const SCULPTED_HUMAN_SCALE = 0.152;

function parseHexColor(hex: string | number): number {
  if (typeof hex === 'number') return hex;
  return Number.parseInt(hex.replace('#', ''), 16) || 0xffffff;
}

export function avatarConfigToAppearance(cfg: AvatarConfig): SculptedHumanAppearance {
  const hairStyle =
    cfg.hairStyle === 'long' ? 'waves' : cfg.hairStyle === 'bun' ? 'bun' : 'short';
  const hatStyle = cfg.hairStyle === 'kasket' ? 'newsboy' : 'none';
  return {
    skinHex: parseHexColor(cfg.skinColor),
    shirtHex: parseHexColor(cfg.shirtColor),
    pantsHex: parseHexColor(cfg.pantsColor),
    hairHex: parseHexColor(cfg.hairColor),
    scarfHex: SPARROW_PALETTE.wallCreamTrim,
    hairStyle,
    hatStyle,
  };
}

export type SculptedHairStyle = 'short' | 'bob' | 'waves' | 'bun';
export type SculptedHatStyle =
  | 'none'
  | 'newsboy'
  | 'chef_toque'
  | 'beret'
  | 'fedora'
  | 'sunhat'
  | 'headscarf'
  | 'fes';

export interface SculptedHumanAppearance {
  skinHex: number;
  shirtHex: number;
  pantsHex: number;
  hairHex: number;
  scarfHex?: number;
  hairStyle: SculptedHairStyle;
  hatStyle: SculptedHatStyle;
  apron?: boolean;
  sashHex?: number;
  goldTrim?: boolean;
  sleeveHex?: number;
}

export interface SculptedArmRig {
  shoulder: THREE.Group;
  elbow: THREE.Group;
  upperMesh: THREE.Mesh;
  foreMesh: THREE.Mesh;
}

export interface SculptedLegRig {
  hip: THREE.Group;
  knee: THREE.Group;
  ankle: THREE.Group;
  thighMesh: THREE.Mesh;
  shinMesh: THREE.Mesh;
}

let _sharedHumanMat: THREE.MeshStandardMaterial | null = null;
const _torsoGeoCache = new Map<string, THREE.BufferGeometry>();
const _headGeoCache = new Map<string, THREE.BufferGeometry>();
const _upperArmGeoCache = new Map<string, THREE.BufferGeometry>();
const _foreArmGeoCache = new Map<string, THREE.BufferGeometry>();
const _thighGeoCache = new Map<number, THREE.BufferGeometry>();
const _shinGeoCache = new Map<number, THREE.BufferGeometry>();
let _shoeGeo: THREE.BufferGeometry | null = null;

export function getSharedSculptedHumanMaterial(): THREE.MeshStandardMaterial {
  if (!_sharedHumanMat) {
    _sharedHumanMat = createStorybookMaterial({
      vertexColors: true,
      roughness: 0.82,
      metalness: 0.02,
    });
  }
  return _sharedHumanMat;
}

function getCachedTorsoGeometry(
  coatHex: number,
  scarfHex: number,
  apron: boolean,
  sashHex?: number,
  goldTrim?: boolean
): THREE.BufferGeometry {
  const key = `${coatHex}_${scarfHex}_${apron ? 1 : 0}_${sashHex ?? -1}_${goldTrim ? 1 : 0}`;
  const cached = _torsoGeoCache.get(key);
  if (cached) return cached;

  const coatC = new THREE.Color(coatHex);
  const coatDark = coatC.clone().multiplyScalar(0.84);
  const torsoStations: LoftStation[] = [
    { t: -0.26, rx: 0.04, rPlus: 0.04, rMinus: 0.04 },
    { t: -0.18, rx: 1.02, rPlus: 0.7, rMinus: 0.74 },
    { t: 0.42, rx: 0.98, rPlus: 0.66, rMinus: 0.7 },
    { t: 1.12, rx: 0.86, rPlus: 0.58, rMinus: 0.58, scallopLobes: 4, scallopAmp: 0.02 },
    { t: 2.05, rx: 1.02, rPlus: 0.72, rMinus: 0.64 },
    { t: 2.86, rx: 1.12, rPlus: 0.68, rMinus: 0.64 },
    { t: 3.22, rx: 0.84, rPlus: 0.52, rMinus: 0.52 },
    { t: 3.36, rx: 0.42, rPlus: 0.36, rMinus: 0.36 },
    { t: 3.4, rx: 0.03, rPlus: 0.03, rMinus: 0.03 },
  ];

  const torsoTmp = new THREE.Color();
  const torsoParts: THREE.BufferGeometry[] = [
    loftOrganicHull(
      torsoStations,
      20,
      (pos) => {
        torsoTmp.copy(coatC);
        if (pos.y < 0.35) torsoTmp.lerp(coatDark, 0.35);
        if (sashHex !== undefined && pos.y >= -0.02 && pos.y <= 0.58) {
          return sashHex;
        }
        if (pos.z > 0.38 && pos.y > 2.15 && Math.abs(pos.x) < (pos.y - 2.05) * 0.32) {
          return scarfHex;
        }
        return torsoTmp.getHex();
      },
      { axis: 'y' }
    ),
    transformGeo(rcyl(0.5, 0.62, 0.42, scarfHex, 18), {
      pos: [0, 3.28, 0.04],
    }),
  ];

  if (goldTrim) {
    // Traditional embroidered Cepken vest front trim for Efeler dancers
    for (const sx of [-1, 1] as const) {
      torsoParts.push(
        transformGeo(rbox(0.18, 1.85, 0.24, 0.05, SPARROW_PALETTE.brassWarm), {
          pos: [sx * 0.36, 1.82, 0.62],
          rot: [0, 0, sx * -0.06],
        })
      );
    }
  } else {
    for (let b = 0; b < 3; b++) {
      torsoParts.push(
        transformGeo(rcyl(0.065, 0.065, 0.05, SPARROW_PALETTE.brassWarm, 10), {
          rot: [Math.PI * 0.5, 0, 0],
          pos: [0, 0.78 + b * 0.62, 0.67],
        })
      );
    }
  }

  if (apron) {
    const apronBib = new THREE.Shape();
    apronBib.moveTo(-0.78, 1.35);
    apronBib.lineTo(0.78, 1.35);
    apronBib.quadraticCurveTo(0.92, -0.45, 0.84, -1.45);
    apronBib.lineTo(-0.84, -1.45);
    apronBib.quadraticCurveTo(-0.92, -0.45, -0.78, 1.35);
    torsoParts.push(
      transformGeo(extrudeShape(apronBib, 0.14, 0.04, SPARROW_PALETTE.apronCream, 8), {
        pos: [0, 1.25, 0.66],
      })
    );
  }

  const merged = mergeParts(torsoParts);
  merged.userData.isSharedHumanGeo = true;
  _torsoGeoCache.set(key, merged);
  return merged;
}

function getCachedHeadGeometry(
  skinHex: number,
  hairHex: number,
  hairStyle: SculptedHairStyle,
  hatStyle: SculptedHatStyle
): THREE.BufferGeometry {
  const key = `${skinHex}_${hairHex}_${hairStyle}_${hatStyle}`;
  const cached = _headGeoCache.get(key);
  if (cached) return cached;

  const headParts: THREE.BufferGeometry[] = [];
  headParts.push(
    transformGeo(rcyl(0.27, 0.32, 0.48, skinHex, 14), {
      pos: [0, 0.16, -0.02],
    })
  );

  const skinC = new THREE.Color(skinHex);
  const cheekBlush = new THREE.Color(SPARROW_PALETTE.awningCoral).lerp(skinC, 0.58);
  const headTmp = new THREE.Color();
  const headStations: LoftStation[] = [
    { t: 0.3, rx: 0.05, rPlus: 0.05, rMinus: 0.05, offsetCenter: 0.08 },
    {
      t: 0.4,
      rx: 0.44,
      rPlus: 0.56,
      rMinus: 0.44,
      offsetCenter: 0.05,
      powerPlus: 0.86,
      powerMinus: 0.86,
    },
    {
      t: 0.68,
      rx: 0.68,
      rPlus: 0.76,
      rMinus: 0.68,
      offsetCenter: 0.02,
      powerPlus: 0.88,
      powerMinus: 0.88,
    },
    { t: 1.02, rx: 0.76, rPlus: 0.8, rMinus: 0.8 },
    { t: 1.38, rx: 0.74, rPlus: 0.78, rMinus: 0.84 },
    { t: 1.68, rx: 0.58, rPlus: 0.66, rMinus: 0.66, offsetCenter: -0.03 },
    { t: 1.84, rx: 0.24, rPlus: 0.28, rMinus: 0.28, offsetCenter: -0.04 },
    { t: 1.88, rx: 0.03, rPlus: 0.03, rMinus: 0.03, offsetCenter: -0.04 },
  ];
  headParts.push(
    loftOrganicHull(
      headStations,
      20,
      (pos) => {
        headTmp.copy(skinC);
        if (pos.z > 0.48 && pos.y > 0.72 && pos.y < 1.06 && Math.abs(pos.x) > 0.26) {
          headTmp.lerp(cheekBlush, 0.52);
        }
        if (pos.y < 0.52) headTmp.multiplyScalar(0.92);
        return headTmp.getHex();
      },
      { axis: 'y' }
    )
  );

  // Wedge nose
  const noseShape = new THREE.Shape();
  noseShape.moveTo(0, 0.2);
  noseShape.lineTo(0.22, -0.1);
  noseShape.quadraticCurveTo(0.06, -0.15, 0, -0.12);
  noseShape.closePath();
  headParts.push(
    transformGeo(extrudeShape(noseShape, 0.13, 0.035, skinHex, 5), {
      rot: [0, -Math.PI * 0.5, 0],
      pos: [0, 1.04, 0.76],
    })
  );

  // Ears, glossy plum-black eyes, and sculpted eyebrows
  const browShape = new THREE.Shape();
  browShape.moveTo(-0.14, 0);
  browShape.quadraticCurveTo(0, 0.055, 0.14, 0.01);
  browShape.quadraticCurveTo(0, 0.015, -0.14, -0.025);
  browShape.closePath();

  const earShape = new THREE.Shape();
  earShape.moveTo(0, 0.14);
  earShape.bezierCurveTo(0.11, 0.14, 0.12, -0.12, 0, -0.14);
  earShape.bezierCurveTo(-0.06, -0.1, -0.06, 0.1, 0, 0.14);

  for (const sx of [-1, 1] as const) {
    headParts.push(
      transformGeo(extrudeShape(earShape, 0.05, 0.018, skinHex, 6), {
        rot: [0, sx * 0.28, 0],
        pos: [sx * 0.74, 1.02, -0.02],
      }),
      transformGeo(rbox(0.13, 0.16, 0.09, 0.045, SPARROW_PALETTE.ironworkPlum), {
        pos: [sx * 0.28, 1.12, 0.75],
      }),
      transformGeo(extrudeShape(browShape, 0.04, 0.012, hairHex, 5), {
        scale: [sx, 1, 1],
        rot: [0, sx * 0.18, sx * -0.06],
        pos: [sx * 0.29, 1.28, 0.75],
      })
    );
  }

  if (hatStyle === 'headscarf') {
    // Flowing sculpted headscarf framing face & neck
    const scarfCol = SPARROW_PALETTE.wallCreamTrim;
    const shawlStations: LoftStation[] = [
      { t: 0.18, rx: 0.78, rPlus: 0.42, rMinus: 0.92, offsetCenter: -0.18 },
      { t: 0.72, rx: 0.84, rPlus: 0.34, rMinus: 0.96, offsetCenter: -0.14 },
      { t: 1.24, rx: 0.88, rPlus: 0.72, rMinus: 0.96, offsetCenter: -0.08 },
      { t: 1.66, rx: 0.8, rPlus: 0.82, rMinus: 0.88, offsetCenter: -0.03 },
      { t: 1.94, rx: 0.46, rPlus: 0.52, rMinus: 0.52, offsetCenter: -0.02 },
      { t: 2.02, rx: 0.04, rPlus: 0.04, rMinus: 0.04 },
    ];
    headParts.push(loftOrganicHull(shawlStations, 20, scarfCol, { axis: 'y' }));
  } else {
    // Sculpted hair crown + bangs + style silhouettes
    const hairCrownStations: LoftStation[] = [
      {
        t: 0.72,
        rx: 0.68,
        rPlus: 0.18,
        rMinus: 0.84,
        offsetCenter: -0.12,
        scallopLobes: 7,
        scallopAmp: 0.04,
      },
      {
        t: 1.14,
        rx: 0.81,
        rPlus: 0.56,
        rMinus: 0.88,
        offsetCenter: -0.06,
        scallopLobes: 7,
        scallopAmp: 0.035,
      },
      {
        t: 1.54,
        rx: 0.78,
        rPlus: 0.78,
        rMinus: 0.86,
        offsetCenter: -0.02,
        scallopLobes: 6,
        scallopAmp: 0.03,
      },
      { t: 1.84, rx: 0.52, rPlus: 0.58, rMinus: 0.58, offsetCenter: -0.02 },
      { t: 1.94, rx: 0.04, rPlus: 0.04, rMinus: 0.04, offsetCenter: -0.02 },
    ];
    headParts.push(loftOrganicHull(hairCrownStations, 18, hairHex, { axis: 'y' }));

    const bangShape = new THREE.Shape();
    bangShape.moveTo(-0.56, 0.08);
    bangShape.quadraticCurveTo(0.05, 0.22, 0.58, 0.04);
    bangShape.quadraticCurveTo(0.18, -0.12, -0.56, 0.08);
    headParts.push(
      transformGeo(extrudeShape(bangShape, 0.18, 0.05, hairHex, 7), {
        rot: [0.28, 0, -0.08],
        pos: [0, 1.54, 0.68],
      })
    );

    if (hairStyle === 'bun') {
      headParts.push(
        transformGeo(rcyl(0.32, 0.36, 0.36, hairHex, 14), {
          rot: [Math.PI * 0.42, 0, 0],
          pos: [0, 1.38, -0.92],
        })
      );
    } else if (hairStyle === 'bob' || hairStyle === 'waves') {
      const lockLen = hairStyle === 'waves' ? 0.78 : 0.48;
      for (const sx of [-1, 1] as const) {
        headParts.push(
          transformGeo(rbox(0.24, lockLen, 0.56, 0.08, hairHex), {
            rot: [0.06, 0, sx * -0.08],
            pos: [sx * 0.74, 0.84, -0.1],
          })
        );
      }
      if (hairStyle === 'waves') {
        headParts.push(
          transformGeo(rbox(1.34, 0.88, 0.38, 0.12, hairHex), {
            rot: [0.1, 0, 0],
            pos: [0, 0.76, -0.68],
          })
        );
      }
    }
  }

  // Hats
  if (hatStyle === 'sunhat') {
    headParts.push(
      transformGeo(rcyl(1.48, 1.56, 0.11, SPARROW_PALETTE.croissantButter, 24), {
        pos: [0, 1.68, 0],
      }),
      transformGeo(rcyl(0.74, 0.84, 0.52, SPARROW_PALETTE.croissantButter, 20), {
        pos: [0, 1.96, 0],
      }),
      transformGeo(rcyl(0.8, 0.83, 0.13, SPARROW_PALETTE.awningCoral, 20), { pos: [0, 1.78, 0] })
    );
  } else if (hatStyle === 'chef_toque') {
    headParts.push(
      transformGeo(rcyl(0.78, 0.75, 0.56, SPARROW_PALETTE.porcelainWhite, 20), {
        pos: [0, 1.88, 0],
      }),
      loftOrganicHull(
        [
          { t: 2.08, rx: 0.76, rPlus: 0.76, rMinus: 0.76, scallopLobes: 8, scallopAmp: 0.05 },
          { t: 2.48, rx: 0.98, rPlus: 0.98, rMinus: 0.98, scallopLobes: 8, scallopAmp: 0.07 },
          { t: 2.74, rx: 0.62, rPlus: 0.62, rMinus: 0.62, scallopLobes: 8, scallopAmp: 0.04 },
          { t: 2.82, rx: 0.04, rPlus: 0.04, rMinus: 0.04 },
        ],
        20,
        SPARROW_PALETTE.porcelainWhite,
        { axis: 'y' }
      )
    );
  } else if (hatStyle === 'beret') {
    headParts.push(
      loftOrganicHull(
        [
          { t: 1.68, rx: 0.76, rPlus: 0.76, rMinus: 0.76 },
          { t: 1.84, rx: 1.02, rPlus: 0.98, rMinus: 0.98, xCenter: 0.14 },
          { t: 2.02, rx: 0.56, rPlus: 0.54, rMinus: 0.54, xCenter: 0.18 },
          { t: 2.08, rx: 0.05, rPlus: 0.05, rMinus: 0.05, xCenter: 0.18 },
        ],
        18,
        SPARROW_PALETTE.coatRose,
        { axis: 'y' }
      )
    );
  } else if (hatStyle === 'fedora') {
    headParts.push(
      transformGeo(rcyl(1.18, 1.24, 0.1, SPARROW_PALETTE.coatMustard, 22), {
        pos: [0, 1.7, 0],
      }),
      transformGeo(rcyl(0.68, 0.8, 0.56, SPARROW_PALETTE.coatMustard, 20), {
        pos: [0, 1.98, 0],
      }),
      transformGeo(rcyl(0.76, 0.79, 0.12, SPARROW_PALETTE.ironworkPlum, 20), {
        pos: [0, 1.79, 0],
      })
    );
  } else if (hatStyle === 'newsboy') {
    headParts.push(
      loftOrganicHull(
        [
          { t: 1.62, rx: 0.78, rPlus: 0.84, rMinus: 0.84, offsetCenter: 0.04 },
          {
            t: 1.82,
            rx: 0.88,
            rPlus: 0.92,
            rMinus: 0.92,
            offsetCenter: 0.06,
            scallopLobes: 6,
            scallopAmp: 0.03,
          },
          { t: 1.98, rx: 0.34, rPlus: 0.36, rMinus: 0.36, offsetCenter: 0.02 },
          { t: 2.02, rx: 0.05, rPlus: 0.05, rMinus: 0.05 },
        ],
        18,
        SPARROW_PALETTE.coatSlate,
        { axis: 'y' }
      ),
      transformGeo(rbox(0.96, 0.08, 0.46, 0.035, SPARROW_PALETTE.cobbleDark), {
        rot: [0.16, 0, 0],
        pos: [0, 1.64, 0.76],
      })
    );
  } else if (hatStyle === 'fes') {
    // Traditional crimson Efe Fez with dark tassel
    headParts.push(
      transformGeo(rcyl(0.64, 0.78, 0.78, 0x9e2b2b, 18), {
        pos: [0, 1.96, -0.02],
      }),
      transformGeo(rcyl(0.06, 0.09, 0.55, SPARROW_PALETTE.ironworkPlum, 8), {
        rot: [0.15, 0, 0.32],
        pos: [0.58, 1.98, -0.08],
      })
    );
  }

  const merged = mergeParts(headParts);
  merged.userData.isSharedHumanGeo = true;
  _headGeoCache.set(key, merged);
  return merged;
}

function getCachedUpperArmGeometry(side: -1 | 1, sleeveHex: number): THREE.BufferGeometry {
  const key = `${side}_${sleeveHex}`;
  const cached = _upperArmGeoCache.get(key);
  if (cached) return cached;

  const upperParts: THREE.BufferGeometry[] = [
    transformGeo(rcyl(0.28, 0.3, 0.34, sleeveHex, 14), {
      pos: [0, -0.06, 0],
    }),
    transformGeo(rcyl(0.28, 0.24, 1.24, sleeveHex, 14), {
      rot: [0, 0, side * -0.05],
      pos: [side * 0.04, -0.64, 0],
    }),
  ];
  const merged = mergeParts(upperParts);
  merged.userData.isSharedHumanGeo = true;
  _upperArmGeoCache.set(key, merged);
  return merged;
}

function getCachedForeArmGeometry(
  side: -1 | 1,
  sleeveHex: number,
  skinHex: number
): THREE.BufferGeometry {
  const key = `${side}_${sleeveHex}_${skinHex}`;
  const cached = _foreArmGeoCache.get(key);
  if (cached) return cached;

  const foreParts: THREE.BufferGeometry[] = [
    transformGeo(rcyl(0.23, 0.23, 0.24, sleeveHex, 14), { pos: [0, -0.02, 0] }),
    transformGeo(rcyl(0.23, 0.19, 1.08, sleeveHex, 14), {
      pos: [0, -0.54, 0.02],
    }),
    transformGeo(rcyl(0.2, 0.2, 0.12, SPARROW_PALETTE.wallCreamTrim, 12), {
      pos: [0, -1.06, 0.02],
    }),
    transformGeo(rbox(0.24, 0.34, 0.3, 0.09, skinHex), {
      pos: [0, -1.26, 0.05],
    }),
    transformGeo(rbox(0.11, 0.18, 0.14, 0.045, skinHex), {
      rot: [0.35, 0, side * -0.35],
      pos: [-side * 0.09, -1.2, 0.18],
    }),
  ];
  const merged = mergeParts(foreParts);
  merged.userData.isSharedHumanGeo = true;
  _foreArmGeoCache.set(key, merged);
  return merged;
}

function getCachedThighGeometry(trouserHex: number): THREE.BufferGeometry {
  const cached = _thighGeoCache.get(trouserHex);
  if (cached) return cached;

  const thighParts: THREE.BufferGeometry[] = [
    transformGeo(rcyl(0.38, 0.38, 0.32, trouserHex, 14), {
      pos: [0, -0.06, 0],
    }),
    transformGeo(rcyl(0.38, 0.3, 2.28, trouserHex, 14), {
      pos: [0, -1.16, 0],
    }),
  ];
  const merged = mergeParts(thighParts);
  merged.userData.isSharedHumanGeo = true;
  _thighGeoCache.set(trouserHex, merged);
  return merged;
}

function getCachedShinGeometry(trouserHex: number): THREE.BufferGeometry {
  const cached = _shinGeoCache.get(trouserHex);
  if (cached) return cached;

  const shinStations: LoftStation[] = [
    { t: -2.2, rx: 0.2, rPlus: 0.21, rMinus: 0.21 },
    { t: -1.65, rx: 0.24, rPlus: 0.25, rMinus: 0.25, offsetCenter: -0.02 },
    { t: -0.78, rx: 0.31, rPlus: 0.28, rMinus: 0.38, offsetCenter: -0.03 },
    { t: -0.12, rx: 0.29, rPlus: 0.3, rMinus: 0.3 },
    { t: 0.1, rx: 0.27, rPlus: 0.28, rMinus: 0.28 },
    { t: 0.16, rx: 0.04, rPlus: 0.04, rMinus: 0.04 },
  ];
  const geo = loftOrganicHull(shinStations, 14, trouserHex, { axis: 'y' });
  geo.userData.isSharedHumanGeo = true;
  _shinGeoCache.set(trouserHex, geo);
  return geo;
}

function getCachedShoeGeometry(): THREE.BufferGeometry {
  if (!_shoeGeo) {
    const shoeStations: LoftStation[] = [
      { t: -0.34, rx: 0.04, rPlus: 0.04, rMinus: 0.04, offsetCenter: -0.22 },
      {
        t: -0.28,
        rx: 0.25,
        rPlus: 0.22,
        rMinus: 0.22,
        offsetCenter: -0.21,
        powerPlus: 0.68,
        powerMinus: 0.68,
      },
      {
        t: 0.06,
        rx: 0.27,
        rPlus: 0.23,
        rMinus: 0.23,
        offsetCenter: -0.2,
        powerPlus: 0.68,
        powerMinus: 0.68,
      },
      {
        t: 0.48,
        rx: 0.29,
        rPlus: 0.18,
        rMinus: 0.18,
        offsetCenter: -0.25,
        powerPlus: 0.68,
        powerMinus: 0.68,
      },
      {
        t: 0.82,
        rx: 0.22,
        rPlus: 0.13,
        rMinus: 0.13,
        offsetCenter: -0.29,
        powerPlus: 0.72,
        powerMinus: 0.72,
      },
      { t: 0.9, rx: 0.04, rPlus: 0.04, rMinus: 0.04, offsetCenter: -0.31 },
    ];
    _shoeGeo = loftOrganicHull(
      shoeStations,
      14,
      (pos) => (pos.y < -0.33 ? SPARROW_PALETTE.cobbleDark : SPARROW_PALETTE.ironworkPlum),
      { axis: 'z' }
    );
    _shoeGeo.userData.isSharedHumanGeo = true;
  }
  return _shoeGeo;
}

export function poseSculptedLeg(leg: SculptedLegRig, phi: number): void {
  const s = Math.sin(phi);
  const c = Math.cos(phi);
  leg.hip.rotation.x = s >= 0 ? -0.46 * s : -0.38 * s;
  const swingPeak = Math.max(0, c);
  const pushOffBend = Math.max(0, -s) * Math.max(0, c + 0.35);
  const stanceCushion = Math.max(0, -c) * 0.11;
  leg.knee.rotation.x =
    0.06 + Math.pow(swingPeak, 1.35) * 0.84 + pushOffBend * 0.22 + stanceCushion;
  const heelStrike = Math.max(0, s);
  const toeOff = Math.max(0, -s);
  leg.ankle.rotation.x = -0.24 * Math.pow(heelStrike, 1.6) + 0.3 * Math.pow(toeOff, 1.4);
}

export interface SculptedHumanRig {
  root: THREE.Group;
  scaleGroup: THREE.Group;
  torsoPivot: THREE.Group;
  headPivot: THREE.Group;
  armL: SculptedArmRig;
  armR: SculptedArmRig;
  legL: SculptedLegRig;
  legR: SculptedLegRig;
  rightHandMount: THREE.Group;
  applyAppearance: (app: SculptedHumanAppearance) => void;
  updateWalk: (speed: number, dt: number, elapsed: number, holdingTreat?: boolean) => void;
  updateZeybek: (dt: number, elapsed: number, danceTime: number, phaseOffset?: number) => void;
  updateWave: (near: boolean, dt: number, elapsed: number, seed?: number) => void;
  updateSit: (dt: number, elapsed: number, teaSipAmount?: number) => void;
}

export function createSculptedHumanRig(
  initial: SculptedHumanAppearance,
  opts?: {
    scale?: number;
    forwardIsNegZ?: boolean;
    contactShadowTex?: THREE.Texture;
  }
): SculptedHumanRig {
  const mat = getSharedSculptedHumanMaterial();
  const humanScale = opts?.scale ?? SCULPTED_HUMAN_SCALE;
  const root = new THREE.Group();

  if (opts?.contactShadowTex) {
    const shadowPlane = new THREE.Mesh(
      new THREE.PlaneGeometry(1.15, 1.15),
      new THREE.MeshBasicMaterial({
        map: opts.contactShadowTex,
        transparent: true,
        opacity: 0.48,
        depthWrite: false,
      })
    );
    shadowPlane.rotation.x = -Math.PI / 2;
    shadowPlane.position.y = 0.02;
    root.add(shadowPlane);
  }

  const scaleGroup = new THREE.Group();
  scaleGroup.scale.setScalar(humanScale);
  scaleGroup.rotation.order = 'YXZ';
  const baseYaw = opts?.forwardIsNegZ ? Math.PI : 0;
  scaleGroup.rotation.y = baseYaw;
  root.add(scaleGroup);

  const baseHipY = 4.95;
  const torsoPivot = new THREE.Group();
  torsoPivot.position.set(0, baseHipY, 0);
  torsoPivot.rotation.order = 'YXZ';
  scaleGroup.add(torsoPivot);

  const scarfHex = initial.scarfHex ?? SPARROW_PALETTE.wallCreamTrim;
  const sleeveHex = initial.sleeveHex ?? initial.shirtHex;

  const torsoMesh = new THREE.Mesh(
    getCachedTorsoGeometry(
      initial.shirtHex,
      scarfHex,
      Boolean(initial.apron),
      initial.sashHex,
      initial.goldTrim
    ),
    mat
  );
  torsoMesh.castShadow = true;
  torsoMesh.receiveShadow = true;
  torsoPivot.add(torsoMesh);

  const headPivot = new THREE.Group();
  headPivot.position.set(0, 3.48, 0.04);
  torsoPivot.add(headPivot);

  const headMesh = new THREE.Mesh(
    getCachedHeadGeometry(initial.skinHex, initial.hairHex, initial.hairStyle, initial.hatStyle),
    mat
  );
  headMesh.castShadow = true;
  headMesh.receiveShadow = true;
  headPivot.add(headMesh);

  const makeArm = (side: -1 | 1): SculptedArmRig => {
    const shoulder = new THREE.Group();
    shoulder.rotation.order = 'YXZ';
    shoulder.position.set(side * 1.18, 3.04, 0.02);

    const upperMesh = new THREE.Mesh(getCachedUpperArmGeometry(side, sleeveHex), mat);
    upperMesh.castShadow = true;
    shoulder.add(upperMesh);

    const elbow = new THREE.Group();
    elbow.rotation.order = 'YXZ';
    elbow.position.set(side * 0.07, -1.24, 0);
    shoulder.add(elbow);

    const foreMesh = new THREE.Mesh(
      getCachedForeArmGeometry(side, sleeveHex, initial.skinHex),
      mat
    );
    foreMesh.castShadow = true;
    elbow.add(foreMesh);

    torsoPivot.add(shoulder);
    return { shoulder, elbow, upperMesh, foreMesh };
  };

  const armL = makeArm(-1);
  const armR = makeArm(1);

  const rightHandMount = new THREE.Group();
  rightHandMount.position.set(0, -1.28, 0.16);
  // Inverse scale so world-sized treat props stay full size on scaled hand
  rightHandMount.scale.setScalar(1 / humanScale);
  armR.elbow.add(rightHandMount);

  const makeLeg = (side: -1 | 1): SculptedLegRig => {
    const hip = new THREE.Group();
    hip.rotation.order = 'YXZ';
    hip.position.set(side * 0.46, baseHipY, 0);

    const thighMesh = new THREE.Mesh(getCachedThighGeometry(initial.pantsHex), mat);
    thighMesh.castShadow = true;
    hip.add(thighMesh);

    const knee = new THREE.Group();
    knee.position.set(0, -2.32, 0);
    hip.add(knee);

    const shinMesh = new THREE.Mesh(getCachedShinGeometry(initial.pantsHex), mat);
    shinMesh.castShadow = true;
    knee.add(shinMesh);

    const ankle = new THREE.Group();
    ankle.position.set(0, -2.2, 0);
    knee.add(ankle);

    const shoeMesh = new THREE.Mesh(getCachedShoeGeometry(), mat);
    shoeMesh.castShadow = true;
    ankle.add(shoeMesh);

    scaleGroup.add(hip);
    return { hip, knee, ankle, thighMesh, shinMesh };
  };

  const legL = makeLeg(-1);
  const legR = makeLeg(1);

  const applyAppearance = (app: SculptedHumanAppearance) => {
    const sHex = app.scarfHex ?? SPARROW_PALETTE.wallCreamTrim;
    const slHex = app.sleeveHex ?? app.shirtHex;
    torsoMesh.geometry = getCachedTorsoGeometry(
      app.shirtHex,
      sHex,
      Boolean(app.apron),
      app.sashHex,
      app.goldTrim
    );
    headMesh.geometry = getCachedHeadGeometry(
      app.skinHex,
      app.hairHex,
      app.hairStyle,
      app.hatStyle
    );
    armL.upperMesh.geometry = getCachedUpperArmGeometry(-1, slHex);
    armR.upperMesh.geometry = getCachedUpperArmGeometry(1, slHex);
    armL.foreMesh.geometry = getCachedForeArmGeometry(-1, slHex, app.skinHex);
    armR.foreMesh.geometry = getCachedForeArmGeometry(1, slHex, app.skinHex);
    legL.thighMesh.geometry = getCachedThighGeometry(app.pantsHex);
    legR.thighMesh.geometry = getCachedThighGeometry(app.pantsHex);
    legL.shinMesh.geometry = getCachedShinGeometry(app.pantsHex);
    legR.shinMesh.geometry = getCachedShinGeometry(app.pantsHex);
  };

  let walkPhase = 0;

  const getLegMinFootY = (leg: SculptedLegRig): number => {
    const hX = leg.hip.rotation.x;
    const hZ = leg.hip.rotation.z;
    const kX = leg.knee.rotation.x;
    const aX = leg.ankle.rotation.x;
    const totalX = hX + kX + aX;
    const cosTotal = Math.cos(totalX);
    const sinTotal = Math.sin(totalX);
    const ankleY = -2.32 * Math.cos(hX) - 2.2 * Math.cos(hX + kX);
    // Check heel (z=-0.28), ball (z=0.48), and toe tip (z=0.82) along shoe sole
    const yHeel = ankleY + -0.43 * cosTotal - -0.28 * sinTotal;
    const yBall = ankleY + -0.43 * cosTotal - 0.48 * sinTotal;
    const yToe = ankleY + -0.42 * cosTotal - 0.82 * sinTotal;
    const lowestRelHip = Math.min(yHeel, yBall, yToe);
    return baseHipY + Math.cos(hZ) * lowestRelHip;
  };

  const getLowestFootY = (): number => Math.min(getLegMinFootY(legL), getLegMinFootY(legR));

  const updateWalk = (speed: number, dt: number, elapsed: number, holdingTreat = false) => {
    scaleGroup.rotation.y = THREE.MathUtils.damp(scaleGroup.rotation.y, baseYaw, 8, dt);
    scaleGroup.rotation.x = THREE.MathUtils.damp(scaleGroup.rotation.x, 0, 8, dt);
    scaleGroup.rotation.z = THREE.MathUtils.damp(scaleGroup.rotation.z, 0, 8, dt);

    torsoPivot.position.y = THREE.MathUtils.damp(torsoPivot.position.y, baseHipY, 12, dt);
    torsoPivot.rotation.x = THREE.MathUtils.damp(torsoPivot.rotation.x, 0, 8, dt);
    torsoPivot.rotation.z = THREE.MathUtils.damp(torsoPivot.rotation.z, 0, 8, dt);
    headPivot.rotation.y = THREE.MathUtils.damp(headPivot.rotation.y, 0, 8, dt);
    headPivot.rotation.x = THREE.MathUtils.damp(headPivot.rotation.x, 0, 8, dt);
    armL.shoulder.rotation.z = THREE.MathUtils.damp(armL.shoulder.rotation.z, -0.08, 10, dt);
    armR.shoulder.rotation.z = THREE.MathUtils.damp(armR.shoulder.rotation.z, 0.08, 10, dt);
    armL.elbow.rotation.z = THREE.MathUtils.damp(armL.elbow.rotation.z, 0, 10, dt);
    armR.elbow.rotation.z = THREE.MathUtils.damp(armR.elbow.rotation.z, 0, 10, dt);
    legL.hip.rotation.z = THREE.MathUtils.damp(legL.hip.rotation.z, 0, 10, dt);
    legR.hip.rotation.z = THREE.MathUtils.damp(legR.hip.rotation.z, 0, 10, dt);

    const absSpeed = Math.abs(speed);
    if (absSpeed > 0.18) {
      walkPhase += dt * Math.max(4.5, absSpeed * 2.1);
      poseSculptedLeg(legL, walkPhase);
      poseSculptedLeg(legR, walkPhase + Math.PI);

      const swing = Math.sin(walkPhase) * Math.min(0.62, absSpeed * 0.12);
      armL.shoulder.rotation.x = -swing * 0.72;
      armL.elbow.rotation.x = -0.18 - Math.max(0, swing) * 0.25;

      if (holdingTreat) {
        armR.shoulder.rotation.x = -0.34 + swing * 0.12;
        armR.elbow.rotation.x = -0.68;
      } else {
        armR.shoulder.rotation.x = swing * 0.72;
        armR.elbow.rotation.x = -0.18 - Math.max(0, -swing) * 0.25;
      }

      // Keep torso joined cleanly to pelvis while planting lowest stance sole on ground
      torsoPivot.position.y = baseHipY + Math.abs(Math.sin(walkPhase)) * 0.04;
      torsoPivot.rotation.y = Math.sin(walkPhase) * 0.06;
      const targetRootY = -getLowestFootY() + Math.abs(Math.sin(walkPhase)) * 0.03;
      scaleGroup.position.y = THREE.MathUtils.damp(scaleGroup.position.y, targetRootY, 16, dt);
    } else {
      legL.hip.rotation.x = THREE.MathUtils.damp(legL.hip.rotation.x, 0, 10, dt);
      legR.hip.rotation.x = THREE.MathUtils.damp(legR.hip.rotation.x, 0, 10, dt);
      legL.knee.rotation.x = THREE.MathUtils.damp(legL.knee.rotation.x, 0.04, 10, dt);
      legR.knee.rotation.x = THREE.MathUtils.damp(legR.knee.rotation.x, 0.04, 10, dt);
      legL.ankle.rotation.x = THREE.MathUtils.damp(legL.ankle.rotation.x, 0, 10, dt);
      legR.ankle.rotation.x = THREE.MathUtils.damp(legR.ankle.rotation.x, 0, 10, dt);

      armL.shoulder.rotation.x = THREE.MathUtils.damp(armL.shoulder.rotation.x, 0, 10, dt);
      armL.elbow.rotation.x = THREE.MathUtils.damp(armL.elbow.rotation.x, -0.14, 10, dt);
      armR.shoulder.rotation.x = THREE.MathUtils.damp(
        armR.shoulder.rotation.x,
        holdingTreat ? -0.34 : 0,
        10,
        dt
      );
      armR.elbow.rotation.x = THREE.MathUtils.damp(
        armR.elbow.rotation.x,
        holdingTreat ? -0.68 : -0.14,
        10,
        dt
      );
      torsoPivot.position.y = baseHipY + Math.sin(elapsed * 2.2) * 0.03;
      torsoPivot.rotation.y = THREE.MathUtils.damp(torsoPivot.rotation.y, 0, 8, dt);
      scaleGroup.position.y = THREE.MathUtils.damp(scaleGroup.position.y, -getLowestFootY(), 12, dt);
    }
  };

  // Expressive 9/8 Aydın Zeybek choreography with articulated elbow wings & ground-planted knee dips
  const updateZeybek = (dt: number, elapsed: number, danceTime: number, phaseOffset = 0) => {
    const barSec = 2.52;
    const tShifted = danceTime + phaseOffset;
    const barIdx = Math.floor(tShifted / barSec);
    const u = (tShifted % barSec) / barSec;
    const leadSign = barIdx % 2 === 0 ? 1 : -1;

    let dip = 0;
    if (u >= 0.42 && u <= 0.72) {
      dip = Math.sin(((u - 0.42) / 0.3) * Math.PI);
    }
    let kneeLift = 0;
    if (u < 0.4) {
      kneeLift = Math.sin((u / 0.4) * Math.PI);
    }

    scaleGroup.rotation.x = THREE.MathUtils.damp(scaleGroup.rotation.x, 0, 8, dt);
    scaleGroup.rotation.y = THREE.MathUtils.damp(
      scaleGroup.rotation.y,
      baseYaw + leadSign * (0.42 * Math.sin(u * Math.PI)),
      6.5,
      dt
    );
    scaleGroup.rotation.z = THREE.MathUtils.damp(
      scaleGroup.rotation.z,
      leadSign * 0.07 * Math.sin(u * Math.PI),
      8,
      dt
    );

    torsoPivot.position.y = THREE.MathUtils.damp(torsoPivot.position.y, baseHipY, 10, dt);
    torsoPivot.rotation.x = THREE.MathUtils.damp(
      torsoPivot.rotation.x,
      0.14 * dip - 0.05 * kneeLift,
      8,
      dt
    );
    torsoPivot.rotation.y = THREE.MathUtils.damp(
      torsoPivot.rotation.y,
      leadSign * 0.18 * Math.sin(u * Math.PI),
      8,
      dt
    );
    torsoPivot.rotation.z = THREE.MathUtils.damp(torsoPivot.rotation.z, 0, 8, dt);
    headPivot.rotation.x = THREE.MathUtils.damp(headPivot.rotation.x, -0.08 * dip, 8, dt);
    headPivot.rotation.y = THREE.MathUtils.damp(headPivot.rotation.y, 0, 8, dt);

    // Eagle-wing shoulders + softly curved elbows framing the stance
    const wingLift = 1.48 - 0.26 * dip + Math.sin(elapsed * 3.55) * 0.11;
    const armFwd = -0.14 - 0.22 * dip + Math.sin(elapsed * 2.4) * 0.07;
    armL.shoulder.rotation.z = THREE.MathUtils.damp(armL.shoulder.rotation.z, -wingLift, 9, dt);
    armR.shoulder.rotation.z = THREE.MathUtils.damp(armR.shoulder.rotation.z, wingLift, 9, dt);
    armL.shoulder.rotation.x = THREE.MathUtils.damp(armL.shoulder.rotation.x, armFwd, 9, dt);
    armR.shoulder.rotation.x = THREE.MathUtils.damp(armR.shoulder.rotation.x, armFwd, 9, dt);
    armL.elbow.rotation.z = THREE.MathUtils.damp(
      armL.elbow.rotation.z,
      0.28 + 0.12 * dip,
      9,
      dt
    );
    armR.elbow.rotation.z = THREE.MathUtils.damp(
      armR.elbow.rotation.z,
      -0.28 - 0.12 * dip,
      9,
      dt
    );
    armL.elbow.rotation.x = THREE.MathUtils.damp(armL.elbow.rotation.x, -0.24, 9, dt);
    armR.elbow.rotation.x = THREE.MathUtils.damp(armR.elbow.rotation.x, -0.24, 9, dt);

    // Articulated 3-joint legs: proud knee lift -> deep kneeling lunge on Diz Vurma
    const leadHip = -0.68 * kneeLift - 0.92 * dip;
    const leadKnee = 1.05 * kneeLift + 1.42 * dip;
    const leadAnkle = -0.5 * dip - 0.22 * kneeLift;
    const trailHip = 0.24 * dip + 0.12 * kneeLift;
    const trailKnee = 0.92 * dip + 0.06 * (1 - dip);
    const trailAnkle = -0.35 * dip;

    if (leadSign > 0) {
      legL.hip.rotation.x = THREE.MathUtils.damp(legL.hip.rotation.x, leadHip, 10, dt);
      legL.knee.rotation.x = THREE.MathUtils.damp(legL.knee.rotation.x, leadKnee, 10, dt);
      legL.ankle.rotation.x = THREE.MathUtils.damp(legL.ankle.rotation.x, leadAnkle, 10, dt);
      legR.hip.rotation.x = THREE.MathUtils.damp(legR.hip.rotation.x, trailHip, 10, dt);
      legR.knee.rotation.x = THREE.MathUtils.damp(legR.knee.rotation.x, trailKnee, 10, dt);
      legR.ankle.rotation.x = THREE.MathUtils.damp(legR.ankle.rotation.x, trailAnkle, 10, dt);
    } else {
      legR.hip.rotation.x = THREE.MathUtils.damp(legR.hip.rotation.x, leadHip, 10, dt);
      legR.knee.rotation.x = THREE.MathUtils.damp(legR.knee.rotation.x, leadKnee, 10, dt);
      legR.ankle.rotation.x = THREE.MathUtils.damp(legR.ankle.rotation.x, leadAnkle, 10, dt);
      legL.hip.rotation.x = THREE.MathUtils.damp(legL.hip.rotation.x, trailHip, 10, dt);
      legL.knee.rotation.x = THREE.MathUtils.damp(legL.knee.rotation.x, trailKnee, 10, dt);
      legL.ankle.rotation.x = THREE.MathUtils.damp(legL.ankle.rotation.x, trailAnkle, 10, dt);
    }
    legL.hip.rotation.z = THREE.MathUtils.damp(legL.hip.rotation.z, -0.08 * dip, 10, dt);
    legR.hip.rotation.z = THREE.MathUtils.damp(legR.hip.rotation.z, 0.08 * dip, 10, dt);

    // Exact FK grounding so the planted shoe rests cleanly on the stone plaza without piercing
    const plantedY = -getLowestFootY();
    scaleGroup.position.y = THREE.MathUtils.damp(scaleGroup.position.y, plantedY, 16, dt);
  };

  const updateWave = (near: boolean, dt: number, elapsed: number, seed = 0) => {
    scaleGroup.rotation.y = THREE.MathUtils.damp(scaleGroup.rotation.y, baseYaw, 8, dt);
    scaleGroup.rotation.x = THREE.MathUtils.damp(scaleGroup.rotation.x, 0, 8, dt);
    scaleGroup.rotation.z = THREE.MathUtils.damp(scaleGroup.rotation.z, 0, 8, dt);
    scaleGroup.position.y = THREE.MathUtils.damp(scaleGroup.position.y, 0, 10, dt);

    torsoPivot.position.y = baseHipY + Math.sin(elapsed * 2.0 + seed) * 0.03;
    torsoPivot.rotation.x = THREE.MathUtils.damp(torsoPivot.rotation.x, 0, 8, dt);
    torsoPivot.rotation.y = THREE.MathUtils.damp(torsoPivot.rotation.y, 0, 8, dt);
    torsoPivot.rotation.z = THREE.MathUtils.damp(torsoPivot.rotation.z, 0, 8, dt);
    headPivot.rotation.x = THREE.MathUtils.damp(
      headPivot.rotation.x,
      near ? Math.sin(elapsed * 2.4 + seed) * 0.04 : 0,
      8,
      dt
    );

    const waveTarget = near
      ? 2.25 + Math.sin(elapsed * 7.2 + seed) * 0.36
      : 0.08 + Math.sin(elapsed * 1.4 + seed) * 0.05;
    armR.shoulder.rotation.z = THREE.MathUtils.damp(armR.shoulder.rotation.z, waveTarget, 8, dt);
    armR.shoulder.rotation.x = THREE.MathUtils.damp(armR.shoulder.rotation.x, near ? -0.22 : 0, 8, dt);
    armR.elbow.rotation.z = THREE.MathUtils.damp(
      armR.elbow.rotation.z,
      near ? -0.35 + Math.sin(elapsed * 7.2 + seed) * 0.2 : -0.08,
      8,
      dt
    );
    armR.elbow.rotation.x = THREE.MathUtils.damp(armR.elbow.rotation.x, -0.14, 8, dt);
    armL.shoulder.rotation.z = THREE.MathUtils.damp(armL.shoulder.rotation.z, -0.08, 8, dt);
    armL.shoulder.rotation.x = THREE.MathUtils.damp(armL.shoulder.rotation.x, 0, 8, dt);
    armL.elbow.rotation.z = THREE.MathUtils.damp(armL.elbow.rotation.z, 0, 8, dt);
    armL.elbow.rotation.x = THREE.MathUtils.damp(armL.elbow.rotation.x, -0.14, 8, dt);

    legL.hip.rotation.x = THREE.MathUtils.damp(legL.hip.rotation.x, 0, 10, dt);
    legR.hip.rotation.x = THREE.MathUtils.damp(legR.hip.rotation.x, 0, 10, dt);
    legL.hip.rotation.z = THREE.MathUtils.damp(legL.hip.rotation.z, 0, 10, dt);
    legR.hip.rotation.z = THREE.MathUtils.damp(legR.hip.rotation.z, 0, 10, dt);
    legL.knee.rotation.x = THREE.MathUtils.damp(legL.knee.rotation.x, 0.04, 10, dt);
    legR.knee.rotation.x = THREE.MathUtils.damp(legR.knee.rotation.x, 0.04, 10, dt);
    legL.ankle.rotation.x = THREE.MathUtils.damp(legL.ankle.rotation.x, 0, 10, dt);
    legR.ankle.rotation.x = THREE.MathUtils.damp(legR.ankle.rotation.x, 0, 10, dt);
  };

  const updateSit = (dt: number, elapsed: number, teaSipAmount = 0) => {
    scaleGroup.position.y = THREE.MathUtils.damp(scaleGroup.position.y, -1.72, 10, dt);
    scaleGroup.rotation.y = THREE.MathUtils.damp(scaleGroup.rotation.y, baseYaw, 10, dt);
    scaleGroup.rotation.x = THREE.MathUtils.damp(scaleGroup.rotation.x, 0, 10, dt);
    scaleGroup.rotation.z = THREE.MathUtils.damp(scaleGroup.rotation.z, 0, 10, dt);
    torsoPivot.position.y = THREE.MathUtils.damp(torsoPivot.position.y, baseHipY, 10, dt);
    torsoPivot.rotation.x = THREE.MathUtils.damp(torsoPivot.rotation.x, 0.04, 10, dt);
    torsoPivot.rotation.y = THREE.MathUtils.damp(torsoPivot.rotation.y, 0, 10, dt);
    torsoPivot.rotation.z = THREE.MathUtils.damp(torsoPivot.rotation.z, 0, 10, dt);
    legL.hip.rotation.x = THREE.MathUtils.damp(legL.hip.rotation.x, -1.35, 10, dt);
    legR.hip.rotation.x = THREE.MathUtils.damp(legR.hip.rotation.x, -1.35, 10, dt);
    legL.hip.rotation.z = THREE.MathUtils.damp(legL.hip.rotation.z, -0.05, 10, dt);
    legR.hip.rotation.z = THREE.MathUtils.damp(legR.hip.rotation.z, 0.05, 10, dt);
    legL.knee.rotation.x = THREE.MathUtils.damp(legL.knee.rotation.x, 1.32, 10, dt);
    legR.knee.rotation.x = THREE.MathUtils.damp(legR.knee.rotation.x, 1.32, 10, dt);
    legL.ankle.rotation.x = THREE.MathUtils.damp(legL.ankle.rotation.x, 0, 10, dt);
    legR.ankle.rotation.x = THREE.MathUtils.damp(legR.ankle.rotation.x, 0, 10, dt);
    armL.shoulder.rotation.z = THREE.MathUtils.damp(armL.shoulder.rotation.z, -0.1, 10, dt);
    armR.shoulder.rotation.z = THREE.MathUtils.damp(armR.shoulder.rotation.z, 0.1, 10, dt);
    armL.elbow.rotation.z = THREE.MathUtils.damp(armL.elbow.rotation.z, 0, 10, dt);
    armR.elbow.rotation.z = THREE.MathUtils.damp(armR.elbow.rotation.z, 0, 10, dt);
    armL.shoulder.rotation.x = THREE.MathUtils.damp(armL.shoulder.rotation.x, -0.35, 10, dt);
    armL.elbow.rotation.x = THREE.MathUtils.damp(armL.elbow.rotation.x, -0.55, 10, dt);
    armR.shoulder.rotation.x = THREE.MathUtils.damp(
      armR.shoulder.rotation.x,
      -0.38 - Math.sin(teaSipAmount * Math.PI) * 0.65,
      10,
      dt
    );
    armR.elbow.rotation.x = THREE.MathUtils.damp(
      armR.elbow.rotation.x,
      -0.65 - Math.sin(teaSipAmount * Math.PI) * 0.45,
      10,
      dt
    );
    headPivot.rotation.x = THREE.MathUtils.damp(
      headPivot.rotation.x,
      Math.sin(elapsed * 1.4) * 0.03,
      8,
      dt
    );
    headPivot.rotation.y = THREE.MathUtils.damp(headPivot.rotation.y, 0, 8, dt);
  };

  return {
    root,
    scaleGroup,
    torsoPivot,
    headPivot,
    armL,
    armR,
    legL,
    legR,
    rightHandMount,
    applyAppearance,
    updateWalk,
    updateZeybek,
    updateWave,
    updateSit,
  };
}

/**
 * Lightweight 2-part sculpted gouache geometries for high-density InstancedMesh town pedestrians.
 */
export function createSculptedPedestrianGeos(): {
  bodyGeo: THREE.BufferGeometry;
  headGeo: THREE.BufferGeometry;
} {
  // Coat + legs + scarf silhouette (neutral white/silver vertex color so instance color tints the coat)
  const coatParts: THREE.BufferGeometry[] = [
    loftOrganicHull(
      [
        { t: 0.16, rx: 0.15, rPlus: 0.12, rMinus: 0.12 },
        { t: 0.44, rx: 0.17, rPlus: 0.13, rMinus: 0.13 },
        { t: 0.68, rx: 0.16, rPlus: 0.12, rMinus: 0.12 },
        { t: 0.86, rx: 0.18, rPlus: 0.13, rMinus: 0.12 },
        { t: 0.94, rx: 0.12, rPlus: 0.1, rMinus: 0.1 },
        { t: 0.96, rx: 0.02, rPlus: 0.02, rMinus: 0.02 },
      ],
      14,
      0xf6f2ea,
      { axis: 'y', bottomAO: 0.18, topLift: 0.06 }
    ),
    // Shoes
    transformGeo(smoothSphere(0.055, 0x5c534c, 8, 6, [1.0, 0.7, 1.45]), {
      pos: [-0.065, 0.04, 0.02],
    }),
    transformGeo(smoothSphere(0.055, 0x5c534c, 8, 6, [1.0, 0.7, 1.45]), {
      pos: [0.065, 0.04, 0.02],
    }),
    // Soft arms
    transformGeo(rcyl(0.042, 0.036, 0.34, 0xf2ede4, 10), {
      pos: [-0.19, 0.68, 0],
      rot: [0, 0, -0.14],
    }),
    transformGeo(rcyl(0.042, 0.036, 0.34, 0xf2ede4, 10), {
      pos: [0.19, 0.68, 0],
      rot: [0, 0, 0.14],
    }),
  ];
  const bodyGeo = mergeParts(coatParts);

  // Sculpted head + hair cap + eyes (clone so shared cache entry stays unscaled/undisposed)
  const clonedHead = getCachedHeadGeometry(0xedd0b4, 0x3b2a22, 'short', 'none').clone();
  clonedHead.userData = {};
  const headGeo = transformGeo(clonedHead, {
    scale: [0.16, 0.16, 0.16],
    pos: [0, 0.94, 0],
  });

  return { bodyGeo, headGeo };
}
