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
export type SculptedFacialHair = 'none' | 'mustache' | 'goatee' | 'full_beard';

export interface SculptedHumanAppearance {
  skinHex: number;
  shirtHex: number;
  pantsHex: number;
  hairHex: number;
  scarfHex?: number;
  hatHex?: number;
  beltHex?: number;
  hairStyle: SculptedHairStyle;
  hatStyle: SculptedHatStyle;
  facialHair?: SculptedFacialHair;
  glasses?: boolean;
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
  goldTrim?: boolean,
  beltHex = 0x3b2c22
): THREE.BufferGeometry {
  const key = `${coatHex}_${scarfHex}_${apron ? 1 : 0}_${sashHex ?? -1}_${goldTrim ? 1 : 0}_${beltHex}`;
  const cached = _torsoGeoCache.get(key);
  if (cached) return cached;

  const coatC = new THREE.Color(coatHex);
  const coatDark = coatC.clone().multiplyScalar(0.84);
  const torsoStations: LoftStation[] = [
    { t: -0.28, rx: 0.04, rPlus: 0.04, rMinus: 0.04 },
    { t: -0.16, rx: 0.96, rPlus: 0.66, rMinus: 0.7 },
    { t: 0.42, rx: 0.9, rPlus: 0.62, rMinus: 0.65 },
    { t: 1.12, rx: 0.82, rPlus: 0.55, rMinus: 0.55, scallopLobes: 4, scallopAmp: 0.015 },
    { t: 2.08, rx: 1.0, rPlus: 0.69, rMinus: 0.62 },
    { t: 2.86, rx: 1.12, rPlus: 0.65, rMinus: 0.6 },
    { t: 3.22, rx: 0.8, rPlus: 0.48, rMinus: 0.48 },
    { t: 3.38, rx: 0.38, rPlus: 0.34, rMinus: 0.34 },
    { t: 3.44, rx: 0.03, rPlus: 0.03, rMinus: 0.03 },
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
        if (pos.z > 0.34 && pos.y > 2.1 && Math.abs(pos.x) < (pos.y - 2.02) * 0.34) {
          return scarfHex;
        }
        return torsoTmp.getHex();
      },
      { axis: 'y' }
    ),
    transformGeo(rcyl(0.46, 0.58, 0.36, scarfHex, 18), {
      pos: [0, 3.26, 0.04],
    }),
  ];

  // Layered shirt lapels / collar framing the neck
  for (const sx of [-1, 1] as const) {
    torsoParts.push(
      transformGeo(rbox(0.24, 0.56, 0.16, 0.05, coatDark.getHex()), {
        rot: [0.16, sx * -0.18, sx * -0.34],
        pos: [sx * 0.32, 2.94, 0.52],
      })
    );
  }

  // Waist belt + warm brass buckle (when not wearing traditional Efeler sash)
  if (sashHex === undefined && !apron) {
    torsoParts.push(
      transformGeo(rcyl(0.86, 0.9, 0.2, beltHex, 20), {
        scale: [1.0, 1.0, 0.72],
        pos: [0, 0.22, 0.0],
      }),
      transformGeo(rbox(0.26, 0.22, 0.12, 0.04, SPARROW_PALETTE.brassWarm), {
        pos: [0, 0.22, 0.64],
      })
    );
  }

  if (goldTrim) {
    // Traditional embroidered Cepken vest front trim for Efeler dancers
    for (const sx of [-1, 1] as const) {
      torsoParts.push(
        transformGeo(rbox(0.18, 1.85, 0.24, 0.05, SPARROW_PALETTE.brassWarm), {
          pos: [sx * 0.36, 1.82, 0.6],
          rot: [0, 0, sx * -0.06],
        })
      );
    }
  } else {
    for (let b = 0; b < 3; b++) {
      torsoParts.push(
        transformGeo(rcyl(0.06, 0.06, 0.05, SPARROW_PALETTE.brassWarm, 10), {
          rot: [Math.PI * 0.5, 0, 0],
          pos: [0, 0.78 + b * 0.62, 0.65],
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
        pos: [0, 1.25, 0.64],
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
  hatStyle: SculptedHatStyle,
  hatHex?: number,
  facialHair: SculptedFacialHair = 'none',
  glasses = false
): THREE.BufferGeometry {
  const key = `${skinHex}_${hairHex}_${hairStyle}_${hatStyle}_${hatHex ?? -1}_${facialHair}_${glasses ? 1 : 0}`;
  const cached = _headGeoCache.get(key);
  if (cached) return cached;

  const headParts: THREE.BufferGeometry[] = [];
  // Neck with natural taper
  headParts.push(
    transformGeo(rcyl(0.25, 0.31, 0.48, skinHex, 14), {
      pos: [0, 0.16, -0.02],
    })
  );

  const skinC = new THREE.Color(skinHex);
  const cheekBlush = new THREE.Color(SPARROW_PALETTE.awningCoral).lerp(skinC, 0.62);
  const jawShade = skinC.clone().multiplyScalar(0.91);
  const headTmp = new THREE.Color();
  const headStations: LoftStation[] = [
    { t: 0.3, rx: 0.05, rPlus: 0.05, rMinus: 0.05, offsetCenter: 0.09 },
    {
      t: 0.4,
      rx: 0.4,
      rPlus: 0.55,
      rMinus: 0.43,
      offsetCenter: 0.06,
      powerPlus: 0.88,
      powerMinus: 0.88,
    },
    {
      t: 0.68,
      rx: 0.64,
      rPlus: 0.74,
      rMinus: 0.66,
      offsetCenter: 0.03,
      powerPlus: 0.9,
      powerMinus: 0.9,
    },
    { t: 1.02, rx: 0.74, rPlus: 0.78, rMinus: 0.78 },
    { t: 1.38, rx: 0.72, rPlus: 0.76, rMinus: 0.82 },
    { t: 1.68, rx: 0.56, rPlus: 0.64, rMinus: 0.64, offsetCenter: -0.03 },
    { t: 1.84, rx: 0.24, rPlus: 0.28, rMinus: 0.28, offsetCenter: -0.04 },
    { t: 1.88, rx: 0.03, rPlus: 0.03, rMinus: 0.03, offsetCenter: -0.04 },
  ];
  headParts.push(
    loftOrganicHull(
      headStations,
      20,
      (pos) => {
        headTmp.copy(skinC);
        if (pos.z > 0.48 && pos.y > 0.76 && pos.y < 1.04 && Math.abs(pos.x) > 0.27) {
          headTmp.lerp(cheekBlush, 0.48);
        }
        if (pos.y < 0.52) headTmp.lerp(jawShade, 0.65);
        return headTmp.getHex();
      },
      { axis: 'y' }
    )
  );

  // Soft, natural human nose bridge & rounded tip
  headParts.push(
    transformGeo(smoothSphere(0.11, skinHex, 10, 8, [0.85, 1.35, 0.95]), {
      rot: [-0.24, 0, 0],
      pos: [0, 1.02, 0.77],
    }),
    transformGeo(smoothSphere(0.085, skinHex, 10, 8, [1.1, 0.82, 0.95]), {
      pos: [0, 0.91, 0.82],
    })
  );

  // Warm gentle human smile / lips
  const lipColor = new THREE.Color(0xc46e63).lerp(skinC, 0.42).getHex();
  const smileShape = new THREE.Shape();
  smileShape.moveTo(-0.17, 0.025);
  smileShape.quadraticCurveTo(0, -0.065, 0.17, 0.025);
  smileShape.quadraticCurveTo(0, -0.018, -0.17, 0.025);
  headParts.push(
    transformGeo(extrudeShape(smileShape, 0.045, 0.012, lipColor, 7), {
      rot: [0.14, 0, 0],
      pos: [0, 0.7, 0.72],
    })
  );

  // Ears, expressive layered human eyes (sclera + hazel/dark iris + pupil + catchlight + upper lid), and sculpted eyebrows
  const browShape = new THREE.Shape();
  browShape.moveTo(-0.15, -0.01);
  browShape.quadraticCurveTo(0, 0.055, 0.15, 0.01);
  browShape.quadraticCurveTo(0, 0.012, -0.15, -0.03);
  browShape.closePath();

  const earShape = new THREE.Shape();
  earShape.moveTo(0, 0.14);
  earShape.bezierCurveTo(0.11, 0.14, 0.12, -0.12, 0, -0.14);
  earShape.bezierCurveTo(-0.06, -0.1, -0.06, 0.1, 0, 0.14);

  const irisColor = new THREE.Color(hairHex).lerp(new THREE.Color(0x2d211b), 0.45).getHex();
  const lidColor = skinC.clone().multiplyScalar(0.84).getHex();

  for (const sx of [-1, 1] as const) {
    headParts.push(
      transformGeo(extrudeShape(earShape, 0.05, 0.018, skinHex, 6), {
        rot: [0, sx * 0.28, 0],
        pos: [sx * 0.73, 1.0, -0.02],
      }),
      // Sclera (warm ivory white of eye)
      transformGeo(rbox(0.21, 0.155, 0.08, 0.045, 0xf7f2ea), {
        rot: [0, sx * 0.16, 0],
        pos: [sx * 0.27, 1.12, 0.72],
      }),
      // Upper eyelid rim
      transformGeo(rbox(0.22, 0.042, 0.095, 0.018, lidColor), {
        rot: [0, sx * 0.16, sx * -0.04],
        pos: [sx * 0.27, 1.19, 0.73],
      }),
      // Iris
      transformGeo(smoothSphere(0.068, irisColor, 10, 8, [0.95, 1.1, 0.55]), {
        pos: [sx * 0.265, 1.115, 0.755],
      }),
      // Pupil
      transformGeo(smoothSphere(0.04, 0x181518, 8, 6, [0.95, 1.08, 0.5]), {
        pos: [sx * 0.265, 1.115, 0.772],
      }),
      // Catchlight highlight
      transformGeo(smoothSphere(0.022, 0xffffff, 6, 6, [1, 1, 0.6]), {
        pos: [sx * 0.265 + 0.025, 1.142, 0.786],
      }),
      // Sculpted eyebrow
      transformGeo(extrudeShape(browShape, 0.042, 0.012, hairHex, 5), {
        scale: [sx, 1, 1],
        rot: [0, sx * 0.18, sx * -0.05],
        pos: [sx * 0.28, 1.29, 0.74],
      })
    );
  }

  // Facial hair options for artisans, elders, and Efeler dancers
  if (facialHair === 'mustache' || facialHair === 'goatee' || facialHair === 'full_beard') {
    const stacheShape = new THREE.Shape();
    stacheShape.moveTo(-0.27, -0.04);
    stacheShape.quadraticCurveTo(-0.1, 0.075, 0, 0.045);
    stacheShape.quadraticCurveTo(0.1, 0.075, 0.27, -0.04);
    stacheShape.quadraticCurveTo(0.11, -0.015, 0, -0.02);
    stacheShape.quadraticCurveTo(-0.11, -0.015, -0.27, -0.04);
    headParts.push(
      transformGeo(extrudeShape(stacheShape, 0.07, 0.018, hairHex, 7), {
        rot: [-0.08, 0, 0],
        pos: [0, 0.79, 0.76],
      })
    );
  }
  if (facialHair === 'goatee') {
    headParts.push(
      transformGeo(smoothSphere(0.19, hairHex, 10, 8, [0.95, 1.15, 0.7]), {
        pos: [0, 0.51, 0.64],
      })
    );
  } else if (facialHair === 'full_beard') {
    const beardStations: LoftStation[] = [
      { t: 0.26, rx: 0.06, rPlus: 0.06, rMinus: 0.04, offsetCenter: 0.08 },
      { t: 0.42, rx: 0.44, rPlus: 0.62, rMinus: 0.22, offsetCenter: 0.1 },
      { t: 0.68, rx: 0.66, rPlus: 0.78, rMinus: 0.28, offsetCenter: 0.06 },
      { t: 0.88, rx: 0.68, rPlus: 0.22, rMinus: 0.18, offsetCenter: 0.08 },
      { t: 0.94, rx: 0.04, rPlus: 0.04, rMinus: 0.04 },
    ];
    headParts.push(loftOrganicHull(beardStations, 16, hairHex, { axis: 'y' }));
  }

  // Optional eyeglasses
  if (glasses) {
    const frameHex = 0x3b2c22;
    for (const sx of [-1, 1] as const) {
      headParts.push(
        transformGeo(rbox(0.28, 0.22, 0.04, 0.05, frameHex), {
          rot: [0, sx * 0.14, 0],
          pos: [sx * 0.27, 1.12, 0.82],
        }),
        transformGeo(rbox(0.21, 0.15, 0.05, 0.03, 0xd8ecf2), {
          rot: [0, sx * 0.14, 0],
          pos: [sx * 0.27, 1.12, 0.825],
        }),
        transformGeo(rbox(0.03, 0.035, 0.68, 0.01, frameHex), {
          pos: [sx * 0.66, 1.14, 0.42],
        })
      );
    }
    headParts.push(
      transformGeo(rbox(0.14, 0.035, 0.04, 0.01, frameHex), {
        pos: [0, 1.14, 0.84],
      })
    );
  }

  const resolvedHatHex = hatHex ?? SPARROW_PALETTE.wallCreamTrim;

  if (hatStyle === 'headscarf') {
    // Flowing sculpted headscarf framing face & neck
    const scarfCol = hatHex ?? SPARROW_PALETTE.wallCreamTrim;
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

  // Hats (respecting per-NPC hatHex when provided)
  if (hatStyle === 'sunhat') {
    const strawCol = hatHex ?? SPARROW_PALETTE.croissantButter;
    headParts.push(
      transformGeo(rcyl(1.48, 1.56, 0.11, strawCol, 24), {
        pos: [0, 1.68, 0],
      }),
      transformGeo(rcyl(0.74, 0.84, 0.52, strawCol, 20), {
        pos: [0, 1.96, 0],
      }),
      transformGeo(rcyl(0.8, 0.83, 0.13, SPARROW_PALETTE.awningCoral, 20), { pos: [0, 1.78, 0] })
    );
  } else if (hatStyle === 'chef_toque') {
    const chefCol = hatHex ?? SPARROW_PALETTE.porcelainWhite;
    headParts.push(
      transformGeo(rcyl(0.78, 0.75, 0.56, chefCol, 20), {
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
        chefCol,
        { axis: 'y' }
      )
    );
  } else if (hatStyle === 'beret') {
    const beretCol = hatHex ?? SPARROW_PALETTE.coatRose;
    headParts.push(
      loftOrganicHull(
        [
          { t: 1.68, rx: 0.76, rPlus: 0.76, rMinus: 0.76 },
          { t: 1.84, rx: 1.02, rPlus: 0.98, rMinus: 0.98, xCenter: 0.14 },
          { t: 2.02, rx: 0.56, rPlus: 0.54, rMinus: 0.54, xCenter: 0.18 },
          { t: 2.08, rx: 0.05, rPlus: 0.05, rMinus: 0.05, xCenter: 0.18 },
        ],
        18,
        beretCol,
        { axis: 'y' }
      )
    );
  } else if (hatStyle === 'fedora') {
    const fedCol = hatHex ?? SPARROW_PALETTE.coatMustard;
    headParts.push(
      transformGeo(rcyl(1.18, 1.24, 0.1, fedCol, 22), {
        pos: [0, 1.7, 0],
      }),
      transformGeo(rcyl(0.68, 0.8, 0.56, fedCol, 20), {
        pos: [0, 1.98, 0],
      }),
      transformGeo(rcyl(0.76, 0.79, 0.12, SPARROW_PALETTE.ironworkPlum, 20), {
        pos: [0, 1.79, 0],
      })
    );
  } else if (hatStyle === 'newsboy') {
    const capCol = hatHex ?? SPARROW_PALETTE.coatSlate;
    const capBrimCol = new THREE.Color(capCol).multiplyScalar(0.76).getHex();
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
        capCol,
        { axis: 'y' }
      ),
      transformGeo(rbox(0.96, 0.08, 0.46, 0.035, capBrimCol), {
        rot: [0.16, 0, 0],
        pos: [0, 1.64, 0.76],
      })
    );
  } else if (hatStyle === 'fes') {
    // Traditional crimson Efe Fez with dark tassel
    const fesCol = hatHex ?? 0x9e2b2b;
    headParts.push(
      transformGeo(rcyl(0.64, 0.78, 0.78, fesCol, 18), {
        pos: [0, 1.96, -0.02],
      }),
      transformGeo(rcyl(0.06, 0.09, 0.55, SPARROW_PALETTE.ironworkPlum, 8), {
        rot: [0.15, 0, 0.32],
        pos: [0.58, 1.98, -0.08],
      })
    );
  }
  void resolvedHatHex;

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
  updateWave: (
    near: boolean,
    dt: number,
    elapsed: number,
    seed?: number,
    lookYaw?: number
  ) => void;
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
      initial.goldTrim,
      initial.beltHex
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
    getCachedHeadGeometry(
      initial.skinHex,
      initial.hairHex,
      initial.hairStyle,
      initial.hatStyle,
      initial.hatHex,
      initial.facialHair,
      initial.glasses
    ),
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
    shoulder.add(upperMesh);

    const elbow = new THREE.Group();
    elbow.rotation.order = 'YXZ';
    elbow.position.set(side * 0.07, -1.24, 0);
    shoulder.add(elbow);

    const foreMesh = new THREE.Mesh(
      getCachedForeArmGeometry(side, sleeveHex, initial.skinHex),
      mat
    );
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
    hip.add(thighMesh);

    const knee = new THREE.Group();
    knee.position.set(0, -2.32, 0);
    hip.add(knee);

    const shinMesh = new THREE.Mesh(getCachedShinGeometry(initial.pantsHex), mat);
    knee.add(shinMesh);

    const ankle = new THREE.Group();
    ankle.position.set(0, -2.2, 0);
    knee.add(ankle);

    const shoeMesh = new THREE.Mesh(getCachedShoeGeometry(), mat);
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
      app.goldTrim,
      app.beltHex
    );
    headMesh.geometry = getCachedHeadGeometry(
      app.skinHex,
      app.hairHex,
      app.hairStyle,
      app.hatStyle,
      app.hatHex,
      app.facialHair,
      app.glasses
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

  let greetWaveClock = 0;
  let wasNear = false;

  const updateWave = (
    near: boolean,
    dt: number,
    elapsed: number,
    seed = 0,
    lookYaw?: number
  ) => {
    if (near && !wasNear) {
      greetWaveClock = 2.6;
    }
    wasNear = near;
    if (greetWaveClock > 0) {
      greetWaveClock = Math.max(0, greetWaveClock - dt);
    }

    const activeWave = near && greetWaveClock > 0;
    const targetTorsoYaw =
      near && lookYaw !== undefined ? THREE.MathUtils.clamp(lookYaw * 0.45, -0.55, 0.55) : 0;
    const idleLookYaw = Math.sin(elapsed * 0.65 + seed) * 0.16;
    const targetHeadYaw =
      near && lookYaw !== undefined
        ? THREE.MathUtils.clamp(lookYaw - targetTorsoYaw, -0.78, 0.78)
        : idleLookYaw;

    scaleGroup.rotation.y = THREE.MathUtils.damp(scaleGroup.rotation.y, baseYaw, 8, dt);
    scaleGroup.rotation.x = THREE.MathUtils.damp(scaleGroup.rotation.x, 0, 8, dt);
    scaleGroup.rotation.z = THREE.MathUtils.damp(scaleGroup.rotation.z, 0, 8, dt);
    scaleGroup.position.y = THREE.MathUtils.damp(scaleGroup.position.y, 0, 10, dt);

    torsoPivot.position.y = baseHipY + Math.sin(elapsed * 2.0 + seed) * 0.032;
    torsoPivot.rotation.x = THREE.MathUtils.damp(torsoPivot.rotation.x, near ? 0.03 : 0, 6, dt);
    torsoPivot.rotation.y = THREE.MathUtils.damp(torsoPivot.rotation.y, targetTorsoYaw, 6, dt);
    torsoPivot.rotation.z = THREE.MathUtils.damp(
      torsoPivot.rotation.z,
      Math.sin(elapsed * 0.9 + seed) * 0.018,
      6,
      dt
    );
    headPivot.rotation.x = THREE.MathUtils.damp(
      headPivot.rotation.x,
      near ? Math.sin(elapsed * 2.1 + seed) * 0.035 : Math.sin(elapsed * 1.1 + seed) * 0.025,
      6,
      dt
    );
    headPivot.rotation.y = THREE.MathUtils.damp(headPivot.rotation.y, targetHeadYaw, 6, dt);

    const waveTarget = activeWave
      ? 2.18 + Math.sin(elapsed * 6.8 + seed) * 0.34
      : near
        ? 0.2 + Math.sin(elapsed * 1.8 + seed) * 0.05
        : 0.08 + Math.sin(elapsed * 1.3 + seed) * 0.04;
    armR.shoulder.rotation.z = THREE.MathUtils.damp(armR.shoulder.rotation.z, waveTarget, 8, dt);
    armR.shoulder.rotation.x = THREE.MathUtils.damp(
      armR.shoulder.rotation.x,
      activeWave ? -0.22 : near ? -0.14 : Math.sin(elapsed * 1.1 + seed) * 0.03,
      8,
      dt
    );
    armR.elbow.rotation.z = THREE.MathUtils.damp(
      armR.elbow.rotation.z,
      activeWave ? -0.32 + Math.sin(elapsed * 6.8 + seed) * 0.18 : -0.06,
      8,
      dt
    );
    armR.elbow.rotation.x = THREE.MathUtils.damp(
      armR.elbow.rotation.x,
      near ? -0.36 : -0.16,
      8,
      dt
    );
    armL.shoulder.rotation.z = THREE.MathUtils.damp(armL.shoulder.rotation.z, -0.09, 8, dt);
    armL.shoulder.rotation.x = THREE.MathUtils.damp(
      armL.shoulder.rotation.x,
      Math.sin(elapsed * 1.1 + seed + 1.4) * 0.03,
      8,
      dt
    );
    armL.elbow.rotation.z = THREE.MathUtils.damp(armL.elbow.rotation.z, 0, 8, dt);
    armL.elbow.rotation.x = THREE.MathUtils.damp(armL.elbow.rotation.x, -0.18, 8, dt);

    legL.hip.rotation.x = THREE.MathUtils.damp(legL.hip.rotation.x, -0.02, 10, dt);
    legR.hip.rotation.x = THREE.MathUtils.damp(legR.hip.rotation.x, 0.02, 10, dt);
    legL.hip.rotation.z = THREE.MathUtils.damp(legL.hip.rotation.z, -0.02, 10, dt);
    legR.hip.rotation.z = THREE.MathUtils.damp(legR.hip.rotation.z, 0.02, 10, dt);
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
 * Articulated multi-part sculpted gouache geometries for high-density InstancedMesh town pedestrians.
 * Matching the player's sculpted avatar proportions with separate torso, swinging arms, striding legs,
 * warm skin-toned hands, and 4 distinct human head/hair variants.
 */
export interface ArticulatedPedestrianGeos {
  torsoGeo: THREE.BufferGeometry;
  legGeo: THREE.BufferGeometry;
  armGeo: THREE.BufferGeometry;
  handGeo: THREE.BufferGeometry;
  headGeos: [THREE.BufferGeometry, THREE.BufferGeometry, THREE.BufferGeometry, THREE.BufferGeometry];
}

export function createArticulatedPedestrianGeos(): ArticulatedPedestrianGeos {
  const s = SCULPTED_HUMAN_SCALE;

  // Neutral bright base torso so instanceColor cleanly tints jackets/shirts while preserving collar/belt contrast
  const torsoRaw = getCachedTorsoGeometry(0xf5f2eb, 0xe8e2d5, false, undefined, false, 0x5c5249)
    .clone();
  torsoRaw.userData = {};
  const torsoGeo = transformGeo(torsoRaw, {
    scale: [s, s, s],
  });

  // Hip-pivoted leg (thigh + calf + shoe) with sole resting cleanly at y = -4.95 * s (~ -0.752m)
  const legParts = [
    getCachedThighGeometry(0xf0eee9).clone(),
    transformGeo(getCachedShinGeometry(0xf0eee9).clone(), { pos: [0, -2.32, 0] }),
    transformGeo(getCachedShoeGeometry().clone(), { pos: [0, -4.52, 0] }),
  ];
  legParts.forEach((g) => {
    g.userData = {};
  });
  const legGeo = transformGeo(mergeParts(legParts), {
    scale: [s, s, s],
  });

  // Shoulder-pivoted sleeve (upper arm + bent forearm + cream cuff), leaving skin hands separate
  const sleeveRaw = mergeParts([
    transformGeo(rcyl(0.28, 0.28, 0.34, 0xf5f2eb, 12), { pos: [0, -0.06, 0] }),
    transformGeo(rcyl(0.27, 0.22, 1.24, 0xf5f2eb, 12), { pos: [0, -0.64, 0] }),
    transformGeo(rcyl(0.22, 0.19, 1.06, 0xf5f2eb, 12), { rot: [-0.24, 0, 0], pos: [0, -1.72, 0.13] }),
    transformGeo(rcyl(0.2, 0.2, 0.12, 0xe8e2d5, 10), { rot: [-0.24, 0, 0], pos: [0, -2.22, 0.25] }),
  ]);
  const armGeo = transformGeo(sleeveRaw, {
    scale: [s, s, s],
  });

  // Separate skin-tinted hand sphere/palm (instanceColor sets varied skin tones)
  const handGeo = transformGeo(rbox(0.23, 0.32, 0.28, 0.09, 0xffffff), {
    scale: [s, s, s],
  });

  // 4 distinct sculpted human head variants matching the player's face detail
  const buildHeadVariant = (
    skinHex: number,
    hairHex: number,
    hairStyle: SculptedHairStyle,
    hatStyle: SculptedHatStyle,
    hatHex?: number,
    facialHair: SculptedFacialHair = 'none'
  ) => {
    const cloned = getCachedHeadGeometry(
      skinHex,
      hairHex,
      hairStyle,
      hatStyle,
      hatHex,
      facialHair,
      false
    ).clone();
    cloned.userData = {};
    return transformGeo(cloned, { scale: [s, s, s] });
  };

  const headGeos: [
    THREE.BufferGeometry,
    THREE.BufferGeometry,
    THREE.BufferGeometry,
    THREE.BufferGeometry,
  ] = [
    buildHeadVariant(0xebc29f, 0x3b281e, 'short', 'none', undefined, 'none'),
    buildHeadVariant(0xf2ccb0, 0x5b3724, 'waves', 'none', undefined, 'none'),
    buildHeadVariant(0xdfb088, 0x281d18, 'bun', 'none', undefined, 'none'),
    buildHeadVariant(0xd7a379, 0x5c524b, 'short', 'newsboy', 0x485464, 'mustache'),
  ];

  return { torsoGeo, legGeo, armGeo, handGeo, headGeos };
}

export function createSculptedPedestrianGeos(): {
  bodyGeo: THREE.BufferGeometry;
  headGeo: THREE.BufferGeometry;
} {
  const art = createArticulatedPedestrianGeos();
  return { bodyGeo: art.torsoGeo, headGeo: art.headGeos[0] };
}
