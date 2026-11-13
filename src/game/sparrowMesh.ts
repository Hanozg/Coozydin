import * as THREE from 'three';
import {
  createStorybookMaterial,
  extrudeShape,
  loftOrganicHull,
  mergeParts,
  smoothBand,
  smoothSphere,
  SPARROW_PALETTE,
  taperedTube,
  transformGeo,
} from './sculptor';

export type BirdMode = 'perched' | 'grounded' | 'flying';

export interface SparrowPoseParams {
  mode: BirdMode;
  dt: number;
  elapsed: number;
  wingTuck?: number;
  peckPhase?: number;
  eatPhase?: number;
  verticalVel?: number;
  perchGrip?: number;
  perchArrival?: number;
  perchSettleOffset?: number;
  hopPhase: number;
  flapTimer: number;
  bankAngle: number;
  pitchAngle: number;
  chirpOpen: number;
  isBraking: boolean;
  headLookLocal: THREE.Vector2;
}

export interface AvianLegRig {
  hipPivot: THREE.Group;
  hockPivot: THREE.Group;
  footPivot: THREE.Group;
  frontToesPivot: THREE.Group;
  halluxPivot: THREE.Group;
}

interface HopKinematics {
  bodyY: number;
  hipX: number;
  hockX: number;
  footX: number;
  frontToesX: number;
  halluxX: number;
}

interface SolvedLegIK {
  hipX: number;
  hockX: number;
  footX: number;
}

const THIGH_LEN = Math.hypot(-0.046, 0.13);
const THIGH_PHI = Math.atan2(-0.046, 0.13);
const TARSUS_LEN = Math.hypot(0.07, 0.142);
const TARSUS_PHI = Math.atan2(0.07, 0.142);

const _hopK: HopKinematics = {
  bodyY: 0,
  hipX: 0,
  hockX: 0,
  footX: 0,
  frontToesX: 0,
  halluxX: 0,
};
const _ikScratchL: SolvedLegIK = { hipX: 0, hockX: 0, footX: 0 };
const _ikScratchR: SolvedLegIK = { hipX: 0, hockX: 0, footX: 0 };

const _cBreast = new THREE.Color(SPARROW_PALETTE.sparrowBreast);
const _cBelly = new THREE.Color(SPARROW_PALETTE.sparrowCheek);
const _cMantle = new THREE.Color(SPARROW_PALETTE.sparrowWarmBack);
const _cScapular = new THREE.Color(SPARROW_PALETTE.sparrowCinnamon);
const _cCrown = new THREE.Color(SPARROW_PALETTE.sparrowChestnut);
const _cCheek = new THREE.Color(SPARROW_PALETTE.sparrowCheek);
const _cBib = new THREE.Color(SPARROW_PALETTE.sparrowBib);
const _cLore = new THREE.Color(0x2b2322);
const _cBuff = new THREE.Color(SPARROW_PALETTE.sparrowCheek).lerp(
  new THREE.Color(SPARROW_PALETTE.sparrowCinnamon),
  0.52
);

interface CachedSparrowAssets {
  mat: THREE.MeshStandardMaterial;
  catchlightMat: THREE.MeshBasicMaterial;
  bodyGeo: THREE.BufferGeometry;
  headGeo: THREE.BufferGeometry;
  headDetailsGeo: THREE.BufferGeometry;
  catchlightGeo: THREE.BufferGeometry;
  upperBeakGeo: THREE.BufferGeometry;
  lowerBeakGeo: THREE.BufferGeometry;
  wingLeftInnerGeo: THREE.BufferGeometry;
  wingLeftOuterGeo: THREE.BufferGeometry;
  wingRightInnerGeo: THREE.BufferGeometry;
  wingRightOuterGeo: THREE.BufferGeometry;
  tailFeatherGeos: THREE.BufferGeometry[];
  thighGeo: THREE.BufferGeometry;
  tarsusGeo: THREE.BufferGeometry;
  footSoleGeo: THREE.BufferGeometry;
  leftFrontToesGeo: THREE.BufferGeometry;
  rightFrontToesGeo: THREE.BufferGeometry;
  halluxGeo: THREE.BufferGeometry;
}

let _cachedAssets: CachedSparrowAssets | null = null;

function buildWingGeometriesForSide(side: -1 | 1): {
  innerGeo: THREE.BufferGeometry;
  outerGeo: THREE.BufferGeometry;
} {
  const innerParts: THREE.BufferGeometry[] = [];

  const covertShape = new THREE.Shape();
  covertShape.moveTo(0, 0.032);
  covertShape.bezierCurveTo(side * 0.13, 0.042, side * 0.23, 0.022, side * 0.265, -0.034);
  covertShape.bezierCurveTo(side * 0.23, -0.125, side * 0.11, -0.152, 0, -0.125);
  covertShape.closePath();

  innerParts.push(
    transformGeo(
      extrudeShape(covertShape, 0.012, 0.005, SPARROW_PALETTE.sparrowWarmBack, 10, { topLift: 0.06 }),
      { rot: [Math.PI * 0.5, 0, 0], pos: [0, 0.004, 0] }
    )
  );

  const lesserShape = new THREE.Shape();
  lesserShape.moveTo(0, 0.03);
  lesserShape.bezierCurveTo(side * 0.09, 0.036, side * 0.17, 0.018, side * 0.18, -0.016);
  lesserShape.bezierCurveTo(side * 0.14, -0.055, side * 0.07, -0.064, 0, -0.042);
  lesserShape.closePath();
  innerParts.push(
    transformGeo(
      extrudeShape(lesserShape, 0.01, 0.004, SPARROW_PALETTE.sparrowCinnamon, 8, { topLift: 0.07 }),
      { rot: [Math.PI * 0.5 - 0.04, 0, 0], pos: [side * 0.018, 0.012, 0.008] }
    )
  );

  const barFeatherShape = new THREE.Shape();
  barFeatherShape.moveTo(0, 0.024);
  barFeatherShape.bezierCurveTo(0.02, 0.012, 0.02, -0.028, 0, -0.042);
  barFeatherShape.bezierCurveTo(-0.02, -0.028, -0.02, 0.012, 0, 0.024);

  for (let b = 0; b < 5; b++) {
    innerParts.push(
      transformGeo(
        extrudeShape(barFeatherShape, 0.007, 0.003, SPARROW_PALETTE.sparrowWingBar, 6, {
          bottomAO: 0.04,
          topLift: 0.09,
        }),
        {
          rot: [Math.PI * 0.5, 0, side * 0.18],
          pos: [side * (0.044 + b * 0.038), 0.013, -0.024 - b * 0.008],
        }
      )
    );
  }

  const innerGeo = mergeParts(innerParts);

  const primaryShape = new THREE.Shape();
  primaryShape.moveTo(0, 0.038);
  primaryShape.bezierCurveTo(side * 0.16, 0.045, side * 0.34, 0.02, side * 0.41, -0.02);
  primaryShape.bezierCurveTo(side * 0.35, -0.078, side * 0.16, -0.092, 0, -0.062);
  primaryShape.closePath();

  const outerParts: THREE.BufferGeometry[] = [];
  for (let f = 0; f < 7; f++) {
    const col = f % 2 === 1 ? SPARROW_PALETTE.sparrowCinnamon : SPARROW_PALETTE.sparrowWingTip;
    const scaleLen = 1.0 - f * 0.085;
    const feather = extrudeShape(primaryShape, 0.0075, 0.003, col, 8, { topLift: 0.05 });
    transformGeo(feather, {
      scale: [scaleLen, scaleLen, 1],
      rot: [Math.PI * 0.5, 0, side * f * 0.078],
      pos: [side * (0.034 - f * 0.012), -f * 0.0025, -0.006 - f * 0.033],
    });
    outerParts.push(feather);
  }

  const outerGeo = mergeParts(outerParts);
  return { innerGeo, outerGeo };
}

function buildFrontToesGeo(side: -1 | 1): THREE.BufferGeometry {
  const parts: THREE.BufferGeometry[] = [];
  const digitSpecs = [
    { angle: -0.38 + side * 0.015, len: 0.092 },
    { angle: side * 0.01, len: 0.116 },
    { angle: 0.38 + side * 0.015, len: 0.092 },
  ];
  for (let i = 0; i < digitSpecs.length; i++) {
    const d = digitSpecs[i];
    const sx = Math.sin(d.angle);
    const cz = Math.cos(d.angle);
    parts.push(
      taperedTube(
        [
          [0, 0, 0],
          [sx * d.len * 0.48, 0.003, cz * d.len * 0.48],
          [sx * d.len, -0.003, cz * d.len],
        ],
        0.0092,
        0.0062,
        SPARROW_PALETTE.sparrowLeg,
        8,
        6
      ),
      taperedTube(
        [
          [sx * d.len, -0.003, cz * d.len],
          [sx * (d.len + 0.015), -0.005, cz * (d.len + 0.015)],
          [sx * (d.len + 0.024), -0.008, cz * (d.len + 0.024)],
        ],
        0.0056,
        0.0018,
        0x242024,
        6,
        6
      )
    );
  }
  return mergeParts(parts);
}

function getOrBuildSparrowAssets(): CachedSparrowAssets {
  if (_cachedAssets) return _cachedAssets;

  const mat = createStorybookMaterial({ vertexColors: true, roughness: 0.84, metalness: 0.02 });
  const catchlightMat = new THREE.MeshBasicMaterial({ color: 0xffffff });

  const bodyGeo = loftOrganicHull(
    [
      { t: -0.43, offsetCenter: 0.042, rx: 0.022, rPlus: 0.018, rMinus: 0.018 },
      { t: -0.35, offsetCenter: 0.036, rx: 0.094, rPlus: 0.07, rMinus: 0.074, powerPlus: 0.9 },
      { t: -0.23, offsetCenter: 0.028, rx: 0.178, rPlus: 0.128, rMinus: 0.15, powerPlus: 0.88, powerMinus: 1.02 },
      { t: -0.09, offsetCenter: 0.03, rx: 0.24, rPlus: 0.16, rMinus: 0.21, powerPlus: 0.86, powerMinus: 1.06 },
      { t: 0.05, offsetCenter: 0.044, rx: 0.252, rPlus: 0.17, rMinus: 0.232, powerPlus: 0.88, powerMinus: 1.08 },
      { t: 0.16, offsetCenter: 0.078, rx: 0.216, rPlus: 0.154, rMinus: 0.184, powerPlus: 0.9, powerMinus: 1.04 },
      { t: 0.235, offsetCenter: 0.146, rx: 0.15, rPlus: 0.12, rMinus: 0.114 },
      { t: 0.268, offsetCenter: 0.186, rx: 0.064, rPlus: 0.054, rMinus: 0.05 },
    ],
    48,
    (pos, norm, _u, out) => {
      out.copy(_cBreast);
      // Belly highlight
      const bellyW = smoothBand(-0.02, -0.14, pos.y) * (1 - smoothBand(0.06, 0.2, Math.abs(pos.x)));
      out.lerp(_cBelly, bellyW * 0.72);
      // Dorsal cinnamon & chestnut mantle
      const backW = smoothBand(0.04, 0.14, pos.y + norm.y * 0.05) * (1 - smoothBand(0.21, 0.27, pos.z));
      out.lerp(_cMantle, backW * 0.92);
      const scapW = smoothBand(0.07, 0.16, Math.abs(pos.x)) * smoothBand(-0.02, 0.09, pos.y);
      out.lerp(_cScapular, scapW * 0.75);
      // Black male sparrow chest bib extending gently from throat onto upper breast
      const bibW =
        smoothBand(0.14, 0.25, pos.z) *
        smoothBand(0.02, 0.14, pos.y) *
        (1 - smoothBand(0.07, 0.135, Math.abs(pos.x)));
      out.lerp(_cBib, bibW * 0.94);
      return out;
    },
    { subdivideAxial: 5, bottomAO: 0.14, topLift: 0.06 }
  );

  const headGeo = loftOrganicHull(
    [
      { t: -0.192, offsetCenter: -0.016, rx: 0.046, rPlus: 0.046, rMinus: 0.046 },
      { t: -0.14, offsetCenter: -0.008, rx: 0.138, rPlus: 0.134, rMinus: 0.126, powerPlus: 0.88 },
      { t: -0.048, offsetCenter: 0.005, rx: 0.176, rPlus: 0.168, rMinus: 0.156, powerPlus: 0.86 },
      { t: 0.046, offsetCenter: 0.006, rx: 0.164, rPlus: 0.154, rMinus: 0.142, powerPlus: 0.88 },
      { t: 0.124, offsetCenter: -0.002, rx: 0.118, rPlus: 0.108, rMinus: 0.098 },
      { t: 0.178, offsetCenter: -0.004, rx: 0.048, rPlus: 0.044, rMinus: 0.038 },
    ],
    48,
    (pos, _norm, _u, out) => {
      out.copy(_cBreast);
      // Warm buff temples transitioning into chestnut crown & nape
      const cheekW =
        smoothBand(0.055, 0.115, Math.abs(pos.x)) *
        smoothBand(-0.09, 0.04, pos.y) *
        (1 - smoothBand(0.04, 0.1, pos.y));
      out.lerp(_cCheek, cheekW * 0.96);

      const crownW = smoothBand(0.032, 0.095, pos.y);
      out.lerp(_cCrown, crownW);

      // Chestnut post-ocular stripe & nape
      const napeW = smoothBand(-0.04, -0.14, pos.z) * smoothBand(-0.02, 0.05, pos.y);
      out.lerp(_cMantle, napeW * 0.85);
      const templeW =
        smoothBand(0.08, 0.13, Math.abs(pos.x)) *
        smoothBand(0.02, 0.06, pos.y) *
        smoothBand(-0.08, 0.02, pos.z);
      out.lerp(_cBuff, templeW * 0.65);

      // Dark lore / eye mask & throat bib
      const loreW =
        smoothBand(0.045, 0.14, pos.z) *
        smoothBand(0.0, 0.045, pos.y) *
        smoothBand(0.04, 0.11, Math.abs(pos.x));
      out.lerp(_cLore, loreW * 0.85);

      const bibW =
        smoothBand(-0.01, -0.11, pos.y) *
        smoothBand(0.02, 0.14, pos.z) *
        (1 - smoothBand(0.06, 0.11, Math.abs(pos.x)));
      out.lerp(_cBib, bibW * 0.96);
      return out;
    },
    { subdivideAxial: 5, bottomAO: 0.08, topLift: 0.06 }
  );

  const headDetailParts: THREE.BufferGeometry[] = [];
  const catchlightParts: THREE.BufferGeometry[] = [];
  const eyeRadius = 0.034;

  for (const sx of [-1, 1] as const) {
    const eyeYaw = -sx * 0.4;
    const eyeRoll = -sx * 0.1;
    const eyePos: [number, number, number] = [sx * 0.129, 0.034, 0.068];

    headDetailParts.push(
      transformGeo(
        smoothSphere(eyeRadius * 1.09, 0x2a1f1c, 20, 14, [0.72, 1.0, 1.0], {
          bottomAO: 0,
          topLift: 0.03,
        }),
        { rot: [0, eyeYaw, eyeRoll], pos: [sx * 0.125, 0.034, 0.066] }
      ),
      transformGeo(
        smoothSphere(eyeRadius * 1.02, 0x462b1c, 20, 14, [0.82, 1.0, 1.0], {
          bottomAO: 0,
          topLift: 0.04,
        }),
        { rot: [0, eyeYaw, eyeRoll], pos: [sx * 0.127, 0.034, 0.067] }
      ),
      transformGeo(
        smoothSphere(eyeRadius, 0x121016, 22, 16, [0.9, 1.0, 1.0], {
          bottomAO: 0,
          topLift: 0.0,
        }),
        { rot: [0, eyeYaw, eyeRoll], pos: eyePos }
      )
    );

    const rxC = eyeRadius * 0.9;
    const u1Len = Math.hypot(0.84, 0.4, 0.36);
    const u2Len = Math.hypot(0.88, -0.26, -0.34);
    const localCatchlights = mergeParts([
      transformGeo(smoothSphere(eyeRadius * 0.22, 0xffffff, 12, 8, [0.32, 0.94, 0.94]), {
        pos: [
          ((sx * 0.84) / u1Len) * rxC * 0.99,
          (0.4 / u1Len) * eyeRadius * 0.99,
          (0.36 / u1Len) * eyeRadius * 0.99,
        ],
      }),
      transformGeo(smoothSphere(eyeRadius * 0.1, 0xffffff, 8, 6, [0.32, 0.92, 0.92]), {
        pos: [
          ((sx * 0.88) / u2Len) * rxC * 0.99,
          (-0.26 / u2Len) * eyeRadius * 0.99,
          (-0.34 / u2Len) * eyeRadius * 0.99,
        ],
      }),
    ]);

    catchlightParts.push(
      transformGeo(localCatchlights, { rot: [0, eyeYaw, eyeRoll], pos: eyePos })
    );
  }

  const headDetailsGeo = mergeParts(headDetailParts);
  const catchlightGeo = mergeParts(catchlightParts);

  const bL = 0.132;
  const bW = 0.044;
  const bH = 0.038;
  const cBeakUpper = new THREE.Color(SPARROW_PALETTE.sparrowBeak);
  const cBeakLower = new THREE.Color(0x473e3c);
  const cHornBase = new THREE.Color(0x9a8570);

  const upperBeakGeo = loftOrganicHull(
    [
      { t: 0.0, offsetCenter: 0.0, rx: bW, rPlus: bH, rMinus: 0.004, powerPlus: 1.12 },
      { t: bL * 0.44, offsetCenter: -0.002, rx: bW * 0.7, rPlus: bH * 0.72, rMinus: 0.003, powerPlus: 1.16 },
      { t: bL * 0.8, offsetCenter: -0.008, rx: bW * 0.32, rPlus: bH * 0.34, rMinus: 0.002, powerPlus: 1.2 },
      { t: bL, offsetCenter: -0.013, rx: 0.003, rPlus: 0.003, rMinus: 0.002 },
    ],
    24,
    (pos, _n, u, out) => {
      out.copy(cBeakUpper);
      const baseHorn = (1.0 - smoothBand(0.05, 0.45, u)) * smoothBand(0.014, -0.002, pos.y);
      if (baseHorn > 0.001) out.lerp(cHornBase, baseHorn * 0.55);
      return out;
    },
    { subdivideAxial: 3, bottomAO: 0.07, topLift: 0.08 }
  );

  const lowerBeakGeo = loftOrganicHull(
    [
      { t: 0.0, offsetCenter: 0.0, rx: bW * 0.84, rPlus: 0.003, rMinus: bH * 0.68, powerMinus: 1.12 },
      { t: bL * 0.42, offsetCenter: 0.002, rx: bW * 0.56, rPlus: 0.002, rMinus: bH * 0.48, powerMinus: 1.15 },
      { t: bL * 0.84, offsetCenter: 0.003, rx: 0.003, rPlus: 0.002, rMinus: 0.003 },
    ],
    22,
    (_pos, _n, u, out) => {
      out.copy(cBeakLower);
      const baseHorn = 1.0 - smoothBand(0.08, 0.58, u);
      if (baseHorn > 0.001) out.lerp(cHornBase, baseHorn * 0.62);
      return out;
    },
    { subdivideAxial: 3, bottomAO: 0.12 }
  );

  const leftWings = buildWingGeometriesForSide(-1);
  const rightWings = buildWingGeometriesForSide(1);

  const tailFeatherShape = new THREE.Shape();
  tailFeatherShape.moveTo(0, 0.02);
  tailFeatherShape.bezierCurveTo(0.046, -0.08, 0.052, -0.3, 0.025, -0.45);
  tailFeatherShape.bezierCurveTo(0.0, -0.47, 0.0, -0.47, -0.025, -0.45);
  tailFeatherShape.bezierCurveTo(-0.052, -0.3, -0.046, -0.08, 0, 0.02);

  const tailFeatherGeos: THREE.BufferGeometry[] = [];
  for (let i = 0; i < 7; i++) {
    const absNorm = Math.abs(i - 3.0);
    const col = absNorm >= 2.0 ? SPARROW_PALETTE.sparrowWarmBack : SPARROW_PALETTE.sparrowWingTip;
    const lenScale = 0.94 + absNorm * 0.028;
    const fg = transformGeo(
      extrudeShape(tailFeatherShape, 0.012, 0.0055, col, 8, { topLift: 0.06 }),
      { scale: [1.0, lenScale, 1.0], rot: [Math.PI * 0.5, 0, 0], pos: [0, 0, -0.02] }
    );
    tailFeatherGeos.push(fg);
  }

  const thighGeo = loftOrganicHull(
    [
      { t: 0.02, offsetCenter: 0.004, rx: 0.034, rPlus: 0.036, rMinus: 0.034 },
      { t: -0.038, offsetCenter: -0.01, rx: 0.029, rPlus: 0.031, rMinus: 0.03 },
      { t: -0.092, offsetCenter: -0.028, rx: 0.021, rPlus: 0.022, rMinus: 0.022 },
      { t: -0.132, offsetCenter: -0.046, rx: 0.014, rPlus: 0.015, rMinus: 0.015 },
    ],
    14,
    (pos) => (pos.y < -0.088 ? SPARROW_PALETTE.sparrowLeg : SPARROW_PALETTE.sparrowBreast),
    { axis: 'y', bottomAO: 0.2, topLift: 0.0 }
  );

  const tarsusGeo = mergeParts([
    smoothSphere(0.016, SPARROW_PALETTE.sparrowLeg, 10, 8),
    taperedTube(
      [
        [0, 0, 0],
        [0, -0.072, 0.036],
        [0, -0.142, 0.07],
      ],
      0.0145,
      0.0115,
      SPARROW_PALETTE.sparrowLeg,
      10,
      8
    ),
  ]);

  const footSoleGeo = smoothSphere(0.015, SPARROW_PALETTE.sparrowLeg, 10, 8, [1.15, 0.75, 1.2]);
  const leftFrontToesGeo = buildFrontToesGeo(-1);
  const rightFrontToesGeo = buildFrontToesGeo(1);
  const halluxGeo = mergeParts([
    taperedTube(
      [
        [0, 0, 0],
        [0, 0.002, -0.036],
        [0, -0.003, -0.068],
      ],
      0.009,
      0.006,
      SPARROW_PALETTE.sparrowLeg,
      8,
      6
    ),
    taperedTube(
      [
        [0, -0.003, -0.068],
        [0, -0.005, -0.081],
        [0, -0.008, -0.09],
      ],
      0.0054,
      0.0018,
      0x242024,
      6,
      6
    ),
  ]);

  _cachedAssets = {
    mat,
    catchlightMat,
    bodyGeo,
    headGeo,
    headDetailsGeo,
    catchlightGeo,
    upperBeakGeo,
    lowerBeakGeo,
    wingLeftInnerGeo: leftWings.innerGeo,
    wingLeftOuterGeo: leftWings.outerGeo,
    wingRightInnerGeo: rightWings.innerGeo,
    wingRightOuterGeo: rightWings.outerGeo,
    tailFeatherGeos,
    thighGeo,
    tarsusGeo,
    footSoleGeo,
    leftFrontToesGeo,
    rightFrontToesGeo,
    halluxGeo,
  };
  return _cachedAssets;
}

export class SparrowMesh {
  public readonly root = new THREE.Group();
  public readonly bodyPivot = new THREE.Group();
  public readonly headPivot = new THREE.Group();
  public readonly upperBeakPivot = new THREE.Group();
  public readonly lowerBeakPivot = new THREE.Group();
  public readonly wingLeftInner = new THREE.Group();
  public readonly wingLeftOuter = new THREE.Group();
  public readonly wingRightInner = new THREE.Group();
  public readonly wingRightOuter = new THREE.Group();
  public readonly wingTipLeft = new THREE.Object3D();
  public readonly wingTipRight = new THREE.Object3D();
  public readonly tailPivot = new THREE.Group();

  private readonly bodyMesh: THREE.Mesh;
  private readonly tailFeathers: THREE.Mesh[] = [];
  private readonly leftLegRig: AvianLegRig;
  private readonly rightLegRig: AvianLegRig;

  constructor(scale = 1.0) {
    const assets = getOrBuildSparrowAssets();
    this.root.scale.setScalar(scale);

    this.bodyPivot.rotation.order = 'YXZ';
    this.root.add(this.bodyPivot);

    this.bodyMesh = new THREE.Mesh(assets.bodyGeo, assets.mat);
    this.bodyMesh.castShadow = true;
    this.bodyMesh.receiveShadow = true;
    this.bodyPivot.add(this.bodyMesh);

    this.headPivot.position.set(0, 0.208, 0.184);
    this.bodyPivot.add(this.headPivot);

    const headMesh = new THREE.Mesh(assets.headGeo, assets.mat);
    headMesh.castShadow = true;
    headMesh.receiveShadow = true;
    this.headPivot.add(headMesh);

    const headDetails = new THREE.Mesh(assets.headDetailsGeo, assets.mat);
    this.headPivot.add(headDetails);

    const catchlightMesh = new THREE.Mesh(assets.catchlightGeo, assets.catchlightMat);
    this.headPivot.add(catchlightMesh);

    this.upperBeakPivot.position.set(0, 0.007, 0.158);
    this.lowerBeakPivot.position.set(0, -0.007, 0.153);
    this.headPivot.add(this.upperBeakPivot, this.lowerBeakPivot);

    const upperBeak = new THREE.Mesh(assets.upperBeakGeo, assets.mat);
    upperBeak.castShadow = true;
    const lowerBeak = new THREE.Mesh(assets.lowerBeakGeo, assets.mat);
    this.upperBeakPivot.add(upperBeak);
    this.lowerBeakPivot.add(lowerBeak);

    this.attachWing(
      -1,
      this.wingLeftInner,
      this.wingLeftOuter,
      this.wingTipLeft,
      assets.wingLeftInnerGeo,
      assets.wingLeftOuterGeo,
      assets.mat
    );
    this.attachWing(
      1,
      this.wingRightInner,
      this.wingRightOuter,
      this.wingTipRight,
      assets.wingRightInnerGeo,
      assets.wingRightOuterGeo,
      assets.mat
    );

    this.tailPivot.position.set(0, 0.042, -0.355);
    this.bodyPivot.add(this.tailPivot);
    for (let i = 0; i < 7; i++) {
      const norm = i - 3.0;
      const fm = new THREE.Mesh(assets.tailFeatherGeos[i], assets.mat);
      fm.castShadow = i % 2 === 1;
      fm.rotation.y = norm * 0.042;
      fm.position.y = -Math.abs(norm) * 0.003;
      this.tailPivot.add(fm);
      this.tailFeathers.push(fm);
    }

    this.leftLegRig = this.attachArticulatedLeg(-1, assets, assets.leftFrontToesGeo);
    this.rightLegRig = this.attachArticulatedLeg(1, assets, assets.rightFrontToesGeo);
  }

  private attachWing(
    side: -1 | 1,
    innerGroup: THREE.Group,
    outerGroup: THREE.Group,
    tipAnchor: THREE.Object3D,
    innerGeo: THREE.BufferGeometry,
    outerGeo: THREE.BufferGeometry,
    mat: THREE.MeshStandardMaterial
  ): void {
    innerGroup.rotation.order = 'YXZ';
    innerGroup.position.set(side * 0.136, 0.068, 0.028);
    this.bodyPivot.add(innerGroup);

    const innerMesh = new THREE.Mesh(innerGeo, mat);
    innerMesh.castShadow = true;
    innerGroup.add(innerMesh);

    outerGroup.position.set(side * 0.22, 0, -0.016);
    innerGroup.add(outerGroup);

    const outerMesh = new THREE.Mesh(outerGeo, mat);
    outerMesh.castShadow = true;
    outerGroup.add(outerMesh);

    tipAnchor.position.set(side * 0.4, 0, -0.05);
    outerGroup.add(tipAnchor);
  }

  private attachArticulatedLeg(
    side: -1 | 1,
    assets: CachedSparrowAssets,
    frontToesGeo: THREE.BufferGeometry
  ): AvianLegRig {
    const hipPivot = new THREE.Group();
    hipPivot.position.set(side * 0.088, -0.095, -0.026);
    this.bodyPivot.add(hipPivot);

    const thighMesh = new THREE.Mesh(assets.thighGeo, assets.mat);
    hipPivot.add(thighMesh);

    const hockPivot = new THREE.Group();
    hockPivot.position.set(0, -0.13, -0.046);
    hipPivot.add(hockPivot);

    const tarsusMesh = new THREE.Mesh(assets.tarsusGeo, assets.mat);
    hockPivot.add(tarsusMesh);

    const footPivot = new THREE.Group();
    footPivot.position.set(0, -0.142, 0.07);
    hockPivot.add(footPivot);

    const soleMesh = new THREE.Mesh(assets.footSoleGeo, assets.mat);
    footPivot.add(soleMesh);

    const frontToesPivot = new THREE.Group();
    frontToesPivot.position.set(0, -0.004, 0.008);
    footPivot.add(frontToesPivot);
    frontToesPivot.add(new THREE.Mesh(frontToesGeo, assets.mat));

    const halluxPivot = new THREE.Group();
    halluxPivot.position.set(0, -0.004, -0.008);
    footPivot.add(halluxPivot);
    halluxPivot.add(new THREE.Mesh(assets.halluxGeo, assets.mat));

    return { hipPivot, hockPivot, footPivot, frontToesPivot, halluxPivot };
  }

  private applyLegJointPose(
    rig: AvianLegRig,
    dt: number,
    rate: number,
    hipX: number,
    hockX: number,
    footX: number,
    frontToesX: number,
    halluxX: number,
    hipZ = 0
  ): void {
    const a = Math.min(1, dt * rate);
    rig.hipPivot.position.y += (-0.095 - rig.hipPivot.position.y) * a;
    rig.hipPivot.rotation.x += (hipX - rig.hipPivot.rotation.x) * a;
    rig.hipPivot.rotation.z += (hipZ - rig.hipPivot.rotation.z) * a;
    rig.hockPivot.rotation.x += (hockX - rig.hockPivot.rotation.x) * a;
    rig.footPivot.rotation.x += (footX - rig.footPivot.rotation.x) * a;
    rig.footPivot.rotation.z -= rig.footPivot.rotation.z * a;
    rig.frontToesPivot.rotation.x += (frontToesX - rig.frontToesPivot.rotation.x) * a;
    rig.halluxPivot.rotation.x += (halluxX - rig.halluxPivot.rotation.x) * a;
  }

  private solvePlantedLegIK(
    rig: AvianLegRig,
    targetFootY: number,
    targetFootZ: number,
    out: SolvedLegIK
  ): SolvedLegIK {
    const localHipX = rig.hipPivot.position.x;
    const localHipY = -0.095;
    const localHipZ = rig.hipPivot.position.z;
    const rz = this.bodyPivot.rotation.z;
    const rx = this.bodyPivot.rotation.x;
    const hyAfterZ = localHipX * Math.sin(rz) + localHipY * Math.cos(rz);
    const cosX = Math.cos(rx);
    const sinX = Math.sin(rx);

    const hipRootY = this.bodyPivot.position.y + hyAfterZ * cosX - localHipZ * sinX;
    const hipRootZ = this.bodyPivot.position.z + hyAfterZ * sinX + localHipZ * cosX;

    const u = targetFootZ - hipRootZ;
    const v = hipRootY - targetFootY;
    const minD = Math.abs(THIGH_LEN - TARSUS_LEN) + 0.002;
    const maxD = THIGH_LEN + TARSUS_LEN - 0.0008;
    const d = Math.max(minD, Math.min(maxD, Math.hypot(u, v)));

    const gamma = Math.atan2(u, v);
    const cosB1 = Math.max(
      -1,
      Math.min(1, (THIGH_LEN * THIGH_LEN + d * d - TARSUS_LEN * TARSUS_LEN) / (2 * THIGH_LEN * d))
    );
    const cosB12 = Math.max(
      -1,
      Math.min(
        1,
        (THIGH_LEN * THIGH_LEN + TARSUS_LEN * TARSUS_LEN - d * d) / (2 * THIGH_LEN * TARSUS_LEN)
      )
    );

    const alpha1 = gamma - Math.acos(cosB1);
    const alpha2 = alpha1 + (Math.PI - Math.acos(cosB12));
    const theta1 = THIGH_PHI - alpha1;
    const theta2 = TARSUS_PHI - alpha2;

    out.hipX = theta1 - rx;
    out.hockX = theta2 - theta1;
    out.footX = -theta2;
    return out;
  }

  private computeHopKinematics(phase: number, out: HopKinematics): HopKinematics {
    if (phase <= 0.005) {
      out.bodyY = 0;
      out.hipX = 0;
      out.hockX = 0;
      out.footX = 0;
      out.frontToesX = 0;
      out.halluxX = 0;
      return out;
    }
    if (phase < 0.18) {
      const u = Math.sin((phase / 0.18) * Math.PI * 0.5);
      out.bodyY = -0.016 * u;
      out.hipX = -0.22 * u;
      out.hockX = -0.36 * u;
      out.footX = 0.64 * u;
      out.frontToesX = -0.04 * u;
      out.halluxX = 0.03 * u;
      return out;
    }
    if (phase < 0.36) {
      const u = (phase - 0.18) / 0.18;
      out.bodyY = -0.016 * (1 - u) + 0.19 * u;
      out.hipX = -0.22 * (1 - u) + 0.36 * u;
      out.hockX = -0.36 * (1 - u) + 0.42 * u;
      out.footX = 0.64 * (1 - u) + 0.46 * u;
      out.frontToesX = 0.32 * u;
      out.halluxX = -0.24 * u;
      return out;
    }
    if (phase < 0.68) {
      const u = Math.sin(((phase - 0.36) / 0.32) * Math.PI);
      const lin = (phase - 0.36) / 0.32;
      out.bodyY = 0.19 + 0.065 * u - 0.04 * lin;
      out.hipX = 0.36 * (1 - lin) - 0.48 * lin;
      out.hockX = 0.42 * (1 - u) - 0.62 * u;
      out.footX = 0.46 * (1 - u) + 0.52 * u;
      out.frontToesX = 0.32 * (1 - lin) - 0.14 * lin;
      out.halluxX = -0.24 * (1 - lin) + 0.08 * lin;
      return out;
    }
    const u = (phase - 0.68) / 0.32;
    const cushion = Math.sin(u * Math.PI);
    out.bodyY = 0.15 * (1 - u) - 0.022 * cushion;
    out.hipX = -0.48 * (1 - u) - 0.24 * cushion;
    out.hockX = -0.36 * cushion;
    out.footX = 0.56 * cushion;
    out.frontToesX = -0.14 * (1 - u);
    out.halluxX = 0.08 * (1 - u);
    return out;
  }

  public updatePose(p: SparrowPoseParams): void {
    const dt = Math.min(0.05, p.dt);
    const peck = Math.max(0, Math.min(1, p.peckPhase ?? 0));
    const peckU = 1.0 - peck;
    const peckStrike =
      peck > 0.001
        ? peckU < 0.36
          ? Math.sin((peckU / 0.36) * Math.PI * 0.5)
          : Math.max(0, Math.cos(((peckU - 0.36) / 0.64) * Math.PI * 0.5))
        : 0;
    const peckBillOpen = peck > 0.001 && peckU < 0.32 ? Math.sin((peckU / 0.32) * Math.PI) * 0.55 : 0;

    const eat = Math.max(0, Math.min(1, p.eatPhase ?? 0));
    const eatU = 1.0 - eat;
    const eatDip =
      eat > 0.001
        ? eatU < 0.52
          ? Math.sin((eatU / 0.52) * Math.PI)
          : Math.sin(((eatU - 0.52) / 0.48) * Math.PI) * 0.28
        : 0;
    const eatChew = eat > 0.001 ? Math.abs(Math.sin(eatU * Math.PI * 5.8)) * (1 - eatU * 0.35) * 0.52 : 0;

    const beakGap = Math.max(p.chirpOpen * 0.44, peckBillOpen, eatChew);
    this.upperBeakPivot.rotation.x = -beakGap * 0.62;
    this.lowerBeakPivot.rotation.x = beakGap * 0.84;

    const vy = p.verticalVel ?? 0;
    const descent =
      p.mode === 'flying' && !p.isBraking
        ? Math.max(0, Math.min(1, Math.max((-vy - 0.35) / 10.5, Math.max(0, p.pitchAngle - 0.05) * 1.1)))
        : 0;

    const idleTilt =
      p.mode !== 'flying' ? Math.sin(p.elapsed * 2.4) * 0.06 + Math.sin(p.elapsed * 6.1) * 0.02 : 0;

    this.headPivot.position.set(
      0,
      0.208 - peckStrike * 0.032 - eatDip * 0.072,
      0.184 + peckStrike * 0.092 + eatDip * 0.105
    );
    const targetHeadPitch = p.headLookLocal.y - descent * 0.34 + peckStrike * 0.32 + eatDip * 0.58;
    this.headPivot.rotation.y += (p.headLookLocal.x - this.headPivot.rotation.y) * Math.min(1, dt * 14);
    this.headPivot.rotation.x += (targetHeadPitch - this.headPivot.rotation.x) * Math.min(1, dt * 18);
    this.headPivot.rotation.z = idleTilt + p.bankAngle * 0.22;

    if (p.mode === 'flying') {
      this.bodyPivot.rotation.z += (p.bankAngle * 0.68 - this.bodyPivot.rotation.z) * Math.min(1, dt * 10);
      const targetPitch = p.isBraking ? -0.46 : p.pitchAngle * 0.78 + descent * 0.16 + peckStrike * 0.26;
      this.bodyPivot.rotation.x += (targetPitch - this.bodyPivot.rotation.x) * Math.min(1, dt * 11);
      this.bodyPivot.position.y = 0;
      this.bodyPivot.position.z = peckStrike * 0.085;

      const tuck = p.wingTuck ?? 0;
      const wingLerp = Math.min(1, dt * 18);

      if (tuck > 0.55 && !p.isBraking && descent < 0.18 && p.flapTimer <= 0) {
        const boundRipple = Math.sin(p.elapsed * 22.0) * 0.035;
        this.wingLeftInner.rotation.x += (-0.44 - this.wingLeftInner.rotation.x) * wingLerp;
        this.wingLeftInner.rotation.y += (-1.38 + boundRipple - this.wingLeftInner.rotation.y) * wingLerp;
        this.wingLeftInner.rotation.z += (0.15 - this.wingLeftInner.rotation.z) * wingLerp;

        this.wingRightInner.rotation.x += (-0.44 - this.wingRightInner.rotation.x) * wingLerp;
        this.wingRightInner.rotation.y += (1.38 - boundRipple - this.wingRightInner.rotation.y) * wingLerp;
        this.wingRightInner.rotation.z += (-0.15 - this.wingRightInner.rotation.z) * wingLerp;

        this.wingLeftOuter.rotation.set(0, -0.22, 0.04);
        this.wingRightOuter.rotation.set(0, 0.22, -0.04);
      } else {
        let stroke = 0;
        let outerFlex = 0;
        let sweepBack = 0;
        let outerSweep = 0;
        let wingPitch = 0.07;

        if (p.flapTimer > 0) {
          const flutterHz = p.elapsed * Math.PI * 2.0 * 15.2;
          stroke = Math.sin(flutterHz) * 0.94;
          outerFlex = Math.cos(flutterHz) * 0.44;
          sweepBack = descent * 0.22;
        } else if (p.isBraking) {
          stroke = 0.32 + Math.sin(p.elapsed * 32) * 0.48;
          outerFlex = 0.26;
          wingPitch = 0.48;
        } else if (descent > 0.04) {
          const windHz = 24.0 + descent * 14.0;
          stroke = 0.18 + descent * 0.36 + Math.sin(p.elapsed * windHz) * (0.068 + descent * 0.125);
          outerFlex = -0.06 + descent * 0.24 + Math.cos(p.elapsed * windHz) * (0.085 + descent * 0.14);
          sweepBack = descent * 0.74;
          outerSweep = descent * 0.44;
          wingPitch = 0.06 - descent * 0.22;
        } else {
          stroke = 0.14 + Math.sin(p.elapsed * 12.5) * 0.055;
          outerFlex = -0.08 + Math.cos(p.elapsed * 12.5) * 0.05;
        }

        this.wingLeftInner.rotation.set(wingPitch, 0.05 - sweepBack, -stroke);
        this.wingRightInner.rotation.set(wingPitch, -0.05 + sweepBack, stroke);
        this.wingLeftOuter.rotation.set(0, -outerSweep, -outerFlex);
        this.wingRightOuter.rotation.set(0, outerSweep, outerFlex);
      }

      const fanSpread = p.isBraking
        ? 0.14
        : descent > 0.08
          ? 0.072 + descent * 0.065 + Math.abs(p.bankAngle) * 0.04
          : tuck > 0.55
            ? 0.028
            : 0.065 + Math.abs(p.bankAngle) * 0.04;
      this.tailPivot.rotation.x = p.isBraking ? -0.44 : -0.05 - p.pitchAngle * 0.26 - descent * 0.2;
      this.tailPivot.rotation.z = -p.bankAngle * 0.28;
      for (let i = 0; i < this.tailFeathers.length; i++) {
        this.tailFeathers[i].rotation.y = (i - 3.0) * fanSpread;
      }

      if (p.isBraking) {
        this.applyLegJointPose(this.leftLegRig, dt, 16, -0.42, 0.22, 0.1, -0.34, 0.22, -0.08);
        this.applyLegJointPose(this.rightLegRig, dt, 16, -0.42, 0.22, 0.1, -0.34, 0.22, 0.08);
      } else {
        this.applyLegJointPose(this.leftLegRig, dt, 15, -0.58, -1.08, 1.15, 0.92, -0.82, 0.04);
        this.applyLegJointPose(this.rightLegRig, dt, 15, -0.58, -1.08, 1.15, 0.92, -0.82, -0.04);
      }
      return;
    }

    // Grounded Hop / Perched Grip
    const breathe = Math.sin(p.elapsed * 3.4) * 0.015 + Math.sin(p.elapsed * 1.7) * 0.004;
    const settleOffset = p.perchSettleOffset ?? 0;
    const arrival = Math.max(0, Math.min(1, p.perchArrival ?? 0));
    const peckPitch = peckStrike * 0.38 + eatDip * 0.52;
    this.bodyPivot.position.z = peckStrike * 0.095 + eatDip * 0.085;

    if (p.hopPhase > 0.005) {
      const hopK = this.computeHopKinematics(p.hopPhase, _hopK);
      this.bodyPivot.position.y = hopK.bodyY + breathe - peckStrike * 0.025 - eatDip * 0.042;
      this.bodyPivot.rotation.z *= 0.82;
      const pitchShift = p.hopPhase < 0.2 ? 0.08 : p.hopPhase < 0.65 ? -0.18 : 0.05;
      this.bodyPivot.rotation.x +=
        (-0.08 + pitchShift + peckPitch - this.bodyPivot.rotation.x) * Math.min(1, dt * 18);

      this.applyLegJointPose(
        this.leftLegRig,
        dt,
        28,
        hopK.hipX,
        hopK.hockX,
        hopK.footX,
        hopK.frontToesX,
        hopK.halluxX,
        -0.03
      );
      this.applyLegJointPose(
        this.rightLegRig,
        dt,
        28,
        hopK.hipX * 0.97,
        hopK.hockX * 0.97,
        hopK.footX,
        hopK.frontToesX,
        hopK.halluxX,
        0.03
      );
    } else if (p.mode === 'perched') {
      const grip = Math.max(0, Math.min(1, p.perchGrip ?? 0.85));
      const frontCurl = 0.08 + grip * 0.56;
      const halluxCurl = -0.05 - grip * 0.54;
      const perchedFootY = -0.095 - 0.25;
      const perchedFootZ = -0.026 + 0.114 + grip * 0.017;

      const targetBodyY = -0.026 + breathe + settleOffset - peckStrike * 0.026 - eatDip * 0.036;
      if (arrival > 0.001) {
        const u = 1.0 - arrival;
        const settleIn = smoothBand(0.15, 1.0, u);
        this.bodyPivot.position.y = targetBodyY * settleIn;
        this.bodyPivot.rotation.z = p.bankAngle * 0.62 * (1.0 - settleIn);
        const flarePitch = p.pitchAngle * 0.72 * (1.0 - settleIn) + (-0.09 + peckPitch) * settleIn;
        this.bodyPivot.rotation.x += (flarePitch - this.bodyPivot.rotation.x) * Math.min(1, dt * 26);
      } else {
        this.bodyPivot.position.y += (targetBodyY - this.bodyPivot.position.y) * Math.min(1, dt * 24);
        this.bodyPivot.rotation.z = 0;
        this.bodyPivot.rotation.x += (-0.09 + peckPitch - this.bodyPivot.rotation.x) * Math.min(1, dt * 24);
      }

      const ikL = this.solvePlantedLegIK(this.leftLegRig, perchedFootY, perchedFootZ, _ikScratchL);
      const ikR = this.solvePlantedLegIK(this.rightLegRig, perchedFootY, perchedFootZ, _ikScratchR);
      const toeLerp = Math.min(1, dt * 32);

      [this.leftLegRig, this.rightLegRig].forEach((rig, idx) => {
        const ik = idx === 0 ? ikL : ikR;
        rig.hipPivot.position.y = -0.095;
        rig.hipPivot.rotation.x = ik.hipX;
        rig.hipPivot.rotation.z = 0;
        rig.hockPivot.rotation.x = ik.hockX;
        rig.footPivot.rotation.x = ik.footX;
        rig.footPivot.rotation.z = 0;
        rig.frontToesPivot.rotation.x += (frontCurl - rig.frontToesPivot.rotation.x) * toeLerp;
        rig.halluxPivot.rotation.x += (halluxCurl - rig.halluxPivot.rotation.x) * toeLerp;
      });
    } else {
      const targetBodyY = -0.028 + breathe + settleOffset - peckStrike * 0.026 - eatDip * 0.038;
      this.bodyPivot.position.y += (targetBodyY - this.bodyPivot.position.y) * Math.min(1, dt * 22);
      this.bodyPivot.rotation.z *= 0.85;
      this.bodyPivot.rotation.x += (-0.08 + peckPitch - this.bodyPivot.rotation.x) * Math.min(1, dt * 22);

      const ikL = this.solvePlantedLegIK(this.leftLegRig, -0.348, 0.086, _ikScratchL);
      const ikR = this.solvePlantedLegIK(this.rightLegRig, -0.348, 0.086, _ikScratchR);
      const toeLerp = Math.min(1, dt * 32);

      [this.leftLegRig, this.rightLegRig].forEach((rig, idx) => {
        const ik = idx === 0 ? ikL : ikR;
        rig.hipPivot.position.y = -0.095;
        rig.hipPivot.rotation.x = ik.hipX;
        rig.hipPivot.rotation.z = 0;
        rig.hockPivot.rotation.x = ik.hockX;
        rig.footPivot.rotation.x = ik.footX;
        rig.footPivot.rotation.z = 0;
        rig.frontToesPivot.rotation.x += (0 - rig.frontToesPivot.rotation.x) * toeLerp;
        rig.halluxPivot.rotation.x += (0 - rig.halluxPivot.rotation.x) * toeLerp;
      });
    }

    // Folded wings when perched or grounded (plus celebratory flutter during hop / perch arrival)
    const wingLerp = Math.min(1, dt * 16);
    if (p.mode === 'perched' && arrival > 0.05) {
      const flutter = Math.sin(p.elapsed * 32.0) * 0.44 * arrival;
      this.wingLeftInner.rotation.x = 0.22 * arrival;
      this.wingLeftInner.rotation.y = -0.58 * (1 - arrival);
      this.wingLeftInner.rotation.z = -0.26 * arrival - flutter;
      this.wingRightInner.rotation.x = 0.22 * arrival;
      this.wingRightInner.rotation.y = 0.58 * (1 - arrival);
      this.wingRightInner.rotation.z = 0.26 * arrival + flutter;
      this.wingLeftOuter.rotation.set(0, -0.1, 0);
      this.wingRightOuter.rotation.set(0, 0.1, 0);
    } else if (p.hopPhase > 0.08 && p.hopPhase < 0.72) {
      const flick = Math.sin(((p.hopPhase - 0.08) / 0.64) * Math.PI) * 0.42;
      this.wingLeftInner.rotation.set(-0.22, -1.04 + flick * 0.6, 0.12 - flick);
      this.wingRightInner.rotation.set(-0.22, 1.04 - flick * 0.6, -0.12 + flick);
      this.wingLeftOuter.rotation.set(0, -0.2, 0.06);
      this.wingRightOuter.rotation.set(0, 0.2, -0.06);
    } else {
      const chirpBoost = p.chirpOpen * 0.12;
      this.wingLeftInner.rotation.x += (-0.34 - this.wingLeftInner.rotation.x) * wingLerp;
      this.wingLeftInner.rotation.y += (-1.38 + chirpBoost - this.wingLeftInner.rotation.y) * wingLerp;
      this.wingLeftInner.rotation.z += (0.14 - this.wingLeftInner.rotation.z) * wingLerp;

      this.wingRightInner.rotation.x += (-0.34 - this.wingRightInner.rotation.x) * wingLerp;
      this.wingRightInner.rotation.y += (1.38 - chirpBoost - this.wingRightInner.rotation.y) * wingLerp;
      this.wingRightInner.rotation.z += (-0.14 - this.wingRightInner.rotation.z) * wingLerp;

      this.wingLeftOuter.rotation.set(0, -0.24, 0.04);
      this.wingRightOuter.rotation.set(0, 0.24, -0.04);
    }

    const tailFlick =
      Math.sin(p.elapsed * 3.1) * 0.04 + p.chirpOpen * 0.16 + (p.hopPhase > 0.1 ? 0.14 : 0);
    this.tailPivot.rotation.x = 0.2 + tailFlick;
    this.tailPivot.rotation.z = 0;
    const restFan = 0.03 + p.chirpOpen * 0.032;
    for (let i = 0; i < this.tailFeathers.length; i++) {
      this.tailFeathers[i].rotation.y = (i - 3.0) * restFan;
    }
  }
}
