import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { mergeGeometries, mergeVertices } from 'three/addons/utils/BufferGeometryUtils.js';

export const SPARROW_PALETTE = {
  // Sparrow Plumage (Authentic Passer domesticus markings)
  sparrowChestnut: 0x7a3d24,
  sparrowCinnamon: 0x9c5533,
  sparrowWarmBack: 0x8c5035,
  sparrowWingTip: 0x302723,
  sparrowWingBar: 0xf2e8d8,
  sparrowBreast: 0xe3dacb,
  sparrowCheek: 0xf5efe4,
  sparrowBib: 0x242024,
  sparrowBeak: 0x2d282e,
  sparrowLeg: 0xad7b58,

  // Storybook Sky / FX Accents
  cloudWarmTop: 0xfffaf0,
  sunCore: 0xfff9e6,
  goldGlow: 0xf5be49,
  brassWarm: 0xd49e42,
  tulipCoral: 0xd95343,
  tulipYellow: 0xebbd3f,
  croissantGold: 0xd18936,
  croissantButter: 0xe6ab58,
  waterFoam: 0xdff0f2,

  // Gouache Architecture & Human Figures (from Sparrow Sim)
  wallCreamTrim: 0xebe1cf,
  wallLimestone: 0xd1c3ac,
  roofCopperPatina: 0x4e8779,
  shutterTeal: 0x42736b,
  shutterCobalt: 0x46668c,
  shutterOlive: 0x5b7553,
  windowGlass: 0x46657d,
  windowDeep: 0x2f4557,
  windowWarmLit: 0xf2c679,
  ironworkPlum: 0x252730,
  cobbleDark: 0x434752,
  woodWalnut: 0x543622,
  woodOak: 0x8f5e3b,
  woodBirch: 0xc49f74,
  awningCoral: 0xc95242,
  awningCream: 0xf0e7d8,
  awningMint: 0x45806d,
  awningCobalt: 0x3f6894,
  porcelainWhite: 0xf4eee4,
  apronCream: 0xede5d5,
  berryRuby: 0xc23644,
  coatRose: 0xad535d,
  coatMustard: 0xc7953e,
  coatSlate: 0x424a59,
  coatPeriwinkle: 0x4e688c,
  coatSage: 0x587d63,
  sakuraBlush: 0xeb9b88,
  lavenderSprig: 0x826ba6,
  leafSage: 0x5e8a4c,
} as const;

export interface PaintOptions {
  bottomAO?: number;
  topLift?: number;
  hueJitter?: number;
}

export interface LoftStation {
  t: number;
  xCenter?: number;
  offsetCenter?: number;
  rx: number;
  rPlus: number;
  rMinus: number;
  powerPlus?: number;
  powerMinus?: number;
  scallopLobes?: number;
  scallopAmp?: number;
  scallopPhase?: number;
}

export type LoftColorResolver =
  | number
  | ((
      pos: THREE.Vector3,
      norm: THREE.Vector3,
      stationU: number,
      outColor: THREE.Color
    ) => number | THREE.Color);

const _tmpColor = new THREE.Color();
const _baseColor = new THREE.Color();
const _mixColorA = new THREE.Color();
const _mixColorB = new THREE.Color();
const _aoTint = new THREE.Color(0x525b78);
const _topTint = new THREE.Color(0xfff9eb);
const _tmpPos = new THREE.Vector3();
const _tmpNorm = new THREE.Vector3();

export function smoothBand(edge0: number, edge1: number, x: number): number {
  const span = edge1 - edge0;
  if (Math.abs(span) < 1e-6) return x >= edge1 ? 1 : 0;
  const t = Math.max(0, Math.min(1, (x - edge0) / span));
  return t * t * (3 - 2 * t);
}

export function createStorybookMaterial(opts?: {
  vertexColors?: boolean;
  color?: number;
  roughness?: number;
  metalness?: number;
  emissiveHex?: number;
  emissiveIntensity?: number;
}): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({
    color: opts?.vertexColors ? 0xffffff : (opts?.color ?? 0xffffff),
    vertexColors: opts?.vertexColors ?? true,
    roughness: opts?.roughness ?? 0.7,
    metalness: opts?.metalness ?? 0.03,
    flatShading: false,
    emissive: opts?.emissiveHex !== undefined ? new THREE.Color(opts.emissiveHex) : new THREE.Color(0x000000),
    emissiveIntensity: opts?.emissiveIntensity ?? 0,
  });
}

function signedPow(val: number, exp: number): number {
  if (exp === 1 || val === 0) return val;
  return Math.sign(val) * Math.pow(Math.abs(val), exp);
}

function evalNonUniformHermite(
  stations: LoftStation[],
  getter: (s: LoftStation) => number,
  i: number,
  f: number
): number {
  const n = stations.length;
  const v1 = getter(stations[i]);
  const v2 = getter(stations[i + 1]);
  const dt = stations[i + 1].t - stations[i].t;
  if (Math.abs(dt) < 1e-6) {
    return v1 + (v2 - v1) * f;
  }

  const slopeAt = (idx: number): number => {
    if (idx <= 0) {
      const d = stations[1].t - stations[0].t;
      return Math.abs(d) > 1e-6 ? (getter(stations[1]) - getter(stations[0])) / d : 0;
    }
    if (idx >= n - 1) {
      const d = stations[n - 1].t - stations[n - 2].t;
      return Math.abs(d) > 1e-6 ? (getter(stations[n - 1]) - getter(stations[n - 2])) / d : 0;
    }
    const dt0 = stations[idx].t - stations[idx - 1].t;
    const dt1 = stations[idx + 1].t - stations[idx].t;
    if (Math.abs(dt0) < 1e-6 || Math.abs(dt1) < 1e-6 || Math.abs(dt0 + dt1) < 1e-6) {
      return 0;
    }
    const d0 = (getter(stations[idx]) - getter(stations[idx - 1])) / dt0;
    const d1 = (getter(stations[idx + 1]) - getter(stations[idx])) / dt1;
    return (d0 * dt1 + d1 * dt0) / (dt0 + dt1);
  };

  const m1 = slopeAt(i) * dt;
  const m2 = slopeAt(i + 1) * dt;
  const f2 = f * f;
  const f3 = f2 * f;
  return (
    (2 * f3 - 3 * f2 + 1) * v1 +
    (f3 - 2 * f2 + f) * m1 +
    (-2 * f3 + 3 * f2) * v2 +
    (f3 - f2) * m2
  );
}

function subdivideLoftStations(stations: LoftStation[], subdiv: number): LoftStation[] {
  if (subdiv <= 1 || stations.length < 2) return stations;
  const n = stations.length;
  const out: LoftStation[] = [];
  for (let i = 0; i < n - 1; i++) {
    const s1 = stations[i];
    const s2 = stations[i + 1];
    for (let k = 0; k < subdiv; k++) {
      if (k === 0) {
        out.push(s1);
        continue;
      }
      const f = k / subdiv;
      out.push({
        t: s1.t + (s2.t - s1.t) * f,
        rx: Math.max(0.0005, evalNonUniformHermite(stations, (s) => s.rx, i, f)),
        rPlus: Math.max(0.0005, evalNonUniformHermite(stations, (s) => s.rPlus, i, f)),
        rMinus: Math.max(0.0005, evalNonUniformHermite(stations, (s) => s.rMinus, i, f)),
        xCenter: evalNonUniformHermite(stations, (s) => s.xCenter ?? 0, i, f),
        offsetCenter: evalNonUniformHermite(stations, (s) => s.offsetCenter ?? 0, i, f),
        powerPlus: Math.max(
          0.35,
          evalNonUniformHermite(stations, (s) => s.powerPlus ?? 1, i, f)
        ),
        powerMinus: Math.max(
          0.35,
          evalNonUniformHermite(stations, (s) => s.powerMinus ?? 1, i, f)
        ),
        scallopLobes: s1.scallopLobes ?? s2.scallopLobes,
        scallopAmp: (s1.scallopAmp ?? 0) * (1 - f) + (s2.scallopAmp ?? 0) * f,
        scallopPhase: (s1.scallopPhase ?? 0) * (1 - f) + (s2.scallopPhase ?? 0) * f,
      });
    }
  }
  out.push(stations[n - 1]);
  return out;
}

export function paintGeometry(
  geo: THREE.BufferGeometry,
  hex: number,
  opts?: PaintOptions
): THREE.BufferGeometry {
  const work = geo.index ? geo.clone() : mergeVertices(geo, 1e-4);
  if (!work.getAttribute('normal')) work.computeVertexNormals();
  const pos = work.getAttribute('position') as THREE.BufferAttribute;
  const norm = work.getAttribute('normal') as THREE.BufferAttribute;

  let minY = Infinity;
  let maxY = -Infinity;
  for (let i = 0; i < pos.count; i++) {
    const y = pos.getY(i);
    if (y < minY) minY = y;
    if (y > maxY) maxY = y;
  }
  const ySpan = Math.max(1e-4, maxY - minY);

  _baseColor.setHex(hex);
  if (opts?.hueJitter) {
    _baseColor.offsetHSL(opts.hueJitter, 0, opts.hueJitter * 0.4);
  }
  const bottomAO = opts?.bottomAO ?? 0.14;
  const topLift = opts?.topLift ?? 0.06;

  const colors = new Float32Array(pos.count * 3);
  for (let i = 0; i < pos.count; i++) {
    const yFrac = Math.max(0, Math.min(1, (pos.getY(i) - minY) / ySpan));
    const ny = norm ? norm.getY(i) : 0;

    _tmpColor.copy(_baseColor);
    const ao = (1.0 - yFrac) * (1.0 - yFrac) * bottomAO;
    if (ao > 0.001) {
      _mixColorA.copy(_tmpColor).lerp(_aoTint, Math.min(0.65, ao * 1.45));
      _tmpColor.lerp(_mixColorA, 0.72);
    }

    const lift = Math.max(0, yFrac * 0.55 + Math.max(0, ny) * 0.45) * topLift;
    if (lift > 0.001) {
      _mixColorB.copy(_tmpColor).lerp(_topTint, Math.min(0.5, lift));
      _tmpColor.copy(_mixColorB);
    }

    colors[i * 3] = _tmpColor.r;
    colors[i * 3 + 1] = _tmpColor.g;
    colors[i * 3 + 2] = _tmpColor.b;
  }
  work.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  return work;
}

export function loftOrganicHull(
  rawStations: LoftStation[],
  radialSegments: number,
  colorResolver: LoftColorResolver,
  opts?: PaintOptions & {
    axis?: 'z' | 'y';
    closeEnd?: boolean;
    subdivideAxial?: number;
  }
): THREE.BufferGeometry {
  const axis = opts?.axis ?? 'z';
  const closeEnd = opts?.closeEnd ?? true;
  const stations = subdivideLoftStations(rawStations, opts?.subdivideAxial ?? 1);
  const rings = stations.length;
  const cols = radialSegments;
  const vertCount = rings * cols;

  const positions = new Float32Array(vertCount * 3);
  const stationUs = new Float32Array(vertCount);

  for (let r = 0; r < rings; r++) {
    const st = stations[r];
    const u = rings > 1 ? r / (rings - 1) : 0.5;
    const xc = st.xCenter ?? 0;
    const oc = st.offsetCenter ?? 0;
    const pPlus = st.powerPlus ?? 1.0;
    const pMinus = st.powerMinus ?? 1.0;
    const lobes = st.scallopLobes ?? 0;
    const amp = st.scallopAmp ?? 0;
    const phase = st.scallopPhase ?? 0;

    for (let c = 0; c < cols; c++) {
      const theta = (c / cols) * Math.PI * 2;
      const cosT = Math.cos(theta);
      const sinT = Math.sin(theta);

      const scallop = lobes > 0 ? 1.0 + amp * Math.sin(lobes * theta + phase) : 1.0;
      const isPlus = sinT >= 0;
      const exp = isPlus ? pPlus : pMinus;
      const radOrtho = isPlus ? st.rPlus : st.rMinus;

      const lx = xc + signedPow(cosT, exp) * st.rx * scallop;
      const lo = oc + signedPow(sinT, exp) * radOrtho * scallop;

      const idx = r * cols + c;
      if (axis === 'z') {
        positions[idx * 3] = lx;
        positions[idx * 3 + 1] = lo;
        positions[idx * 3 + 2] = st.t;
      } else {
        positions[idx * 3] = lx;
        positions[idx * 3 + 1] = st.t;
        positions[idx * 3 + 2] = lo;
      }
      stationUs[idx] = u;
    }
  }

  const s0 = stations[0];
  const sN = stations[rings - 1];
  const windZPos = (axis === 'z') === sN.t >= s0.t;

  const indices: number[] = [];
  for (let r = 0; r < rings - 1; r++) {
    const rowA = r * cols;
    const rowB = (r + 1) * cols;
    for (let c = 0; c < cols; c++) {
      const cn = (c + 1) % cols;
      const a = rowA + c;
      const b = rowA + cn;
      const d = rowB + c;
      const e = rowB + cn;

      if (windZPos) {
        indices.push(a, b, d, b, e, d);
      } else {
        indices.push(a, d, b, b, d, e);
      }
    }
  }

  const extraCaps = closeEnd ? 2 : 1;
  const fullPositions = new Float32Array((vertCount + extraCaps) * 3);
  fullPositions.set(positions, 0);

  const startCapIdx = vertCount;
  if (axis === 'z') {
    fullPositions[startCapIdx * 3] = s0.xCenter ?? 0;
    fullPositions[startCapIdx * 3 + 1] = s0.offsetCenter ?? 0;
    fullPositions[startCapIdx * 3 + 2] = s0.t;
  } else {
    fullPositions[startCapIdx * 3] = s0.xCenter ?? 0;
    fullPositions[startCapIdx * 3 + 1] = s0.t;
    fullPositions[startCapIdx * 3 + 2] = s0.offsetCenter ?? 0;
  }
  for (let c = 0; c < cols; c++) {
    const cn = (c + 1) % cols;
    if (windZPos) indices.push(startCapIdx, cn, c);
    else indices.push(startCapIdx, c, cn);
  }

  if (closeEnd) {
    const endCapIdx = vertCount + 1;
    if (axis === 'z') {
      fullPositions[endCapIdx * 3] = sN.xCenter ?? 0;
      fullPositions[endCapIdx * 3 + 1] = sN.offsetCenter ?? 0;
      fullPositions[endCapIdx * 3 + 2] = sN.t;
    } else {
      fullPositions[endCapIdx * 3] = sN.xCenter ?? 0;
      fullPositions[endCapIdx * 3 + 1] = sN.t;
      fullPositions[endCapIdx * 3 + 2] = sN.offsetCenter ?? 0;
    }
    const lastRow = (rings - 1) * cols;
    for (let c = 0; c < cols; c++) {
      const cn = (c + 1) % cols;
      if (windZPos) indices.push(endCapIdx, lastRow + c, lastRow + cn);
      else indices.push(endCapIdx, lastRow + cn, lastRow + c);
    }
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(fullPositions, 3));
  geo.setIndex(indices);
  geo.computeVertexNormals();

  const totalVerts = fullPositions.length / 3;
  const norm = geo.getAttribute('normal') as THREE.BufferAttribute;
  let minY = Infinity;
  let maxY = -Infinity;
  for (let i = 0; i < totalVerts; i++) {
    const y = fullPositions[i * 3 + 1];
    if (y < minY) minY = y;
    if (y > maxY) maxY = y;
  }
  const ySpan = Math.max(1e-4, maxY - minY);
  const bottomAO = opts?.bottomAO ?? 0.12;
  const topLift = opts?.topLift ?? 0.05;

  const colors = new Float32Array(totalVerts * 3);
  for (let i = 0; i < totalVerts; i++) {
    _tmpPos.set(fullPositions[i * 3], fullPositions[i * 3 + 1], fullPositions[i * 3 + 2]);
    _tmpNorm.set(norm.getX(i), norm.getY(i), norm.getZ(i));
    const u = i < vertCount ? stationUs[i] : i === startCapIdx ? 0 : 1;

    if (typeof colorResolver === 'number') {
      _tmpColor.setHex(colorResolver);
    } else {
      const res = colorResolver(_tmpPos, _tmpNorm, u, _baseColor);
      if (typeof res === 'number') _tmpColor.setHex(res);
      else _tmpColor.copy(res);
    }

    const yFrac = Math.max(0, Math.min(1, (_tmpPos.y - minY) / ySpan));
    const ao = (1.0 - yFrac) * (1.0 - yFrac) * bottomAO;
    if (ao > 0.001) {
      _mixColorA.copy(_tmpColor).lerp(_aoTint, Math.min(0.55, ao * 1.35));
      _tmpColor.lerp(_mixColorA, 0.68);
    }
    const lift = Math.max(0, yFrac * 0.5 + Math.max(0, _tmpNorm.y) * 0.5) * topLift;
    if (lift > 0.001) {
      _tmpColor.lerp(_topTint, Math.min(0.42, lift));
    }

    colors[i * 3] = _tmpColor.r;
    colors[i * 3 + 1] = _tmpColor.g;
    colors[i * 3 + 2] = _tmpColor.b;
  }
  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  return geo;
}

export function transformGeo(
  geo: THREE.BufferGeometry,
  opts: {
    pos?: [number, number, number];
    rot?: [number, number, number];
    scale?: [number, number, number];
  }
): THREE.BufferGeometry {
  const m = new THREE.Matrix4();
  const q = new THREE.Quaternion().setFromEuler(
    new THREE.Euler(opts.rot?.[0] ?? 0, opts.rot?.[1] ?? 0, opts.rot?.[2] ?? 0)
  );
  m.compose(
    new THREE.Vector3(opts.pos?.[0] ?? 0, opts.pos?.[1] ?? 0, opts.pos?.[2] ?? 0),
    q,
    new THREE.Vector3(opts.scale?.[0] ?? 1, opts.scale?.[1] ?? 1, opts.scale?.[2] ?? 1)
  );
  geo.applyMatrix4(m);
  return geo;
}

export function rbox(
  w: number,
  h: number,
  d: number,
  radius: number,
  hex: number,
  segments = 3,
  paintOpts?: PaintOptions
): THREE.BufferGeometry {
  const safeR = Math.min(radius, w * 0.48, h * 0.48, d * 0.48);
  const raw = new RoundedBoxGeometry(w, h, d, segments, safeR);
  const painted = paintGeometry(raw, hex, paintOpts);
  raw.dispose();
  return painted;
}

export function rcyl(
  rTop: number,
  rBottom: number,
  height: number,
  hex: number,
  radialSegments = 20,
  paintOpts?: PaintOptions
): THREE.BufferGeometry {
  const raw = new THREE.CylinderGeometry(rTop, rBottom, height, radialSegments, 1);
  const painted = paintGeometry(raw, hex, paintOpts);
  raw.dispose();
  return painted;
}

export function capsule(
  radius: number,
  length: number,
  hex: number,
  capSegments = 8,
  radialSegments = 18,
  paintOpts?: PaintOptions
): THREE.BufferGeometry {
  const raw = new THREE.CapsuleGeometry(radius, length, capSegments, radialSegments);
  const painted = paintGeometry(raw, hex, paintOpts);
  raw.dispose();
  return painted;
}

export function lathe(
  profile: Array<[number, number]>,
  hex: number,
  segments = 24,
  paintOpts?: PaintOptions
): THREE.BufferGeometry {
  const pts = profile.map(([r, y]) => new THREE.Vector2(Math.max(0.0005, r), y));
  const raw = new THREE.LatheGeometry(pts, segments);
  raw.computeVertexNormals();
  const painted = paintGeometry(raw, hex, paintOpts);
  raw.dispose();
  return painted;
}

export function smoothSphere(
  radius: number,
  hex: number,
  widthSegments = 24,
  heightSegments = 16,
  scale?: [number, number, number],
  paintOpts?: PaintOptions
): THREE.BufferGeometry {
  const raw = new THREE.SphereGeometry(radius, widthSegments, heightSegments);
  if (scale) {
    const [sx, sy, sz] = scale;
    const pos = raw.getAttribute('position') as THREE.BufferAttribute;
    const norm = raw.getAttribute('normal') as THREE.BufferAttribute;
    const invX = (1 / Math.max(1e-5, Math.abs(sx))) * Math.sign(sx || 1);
    const invY = (1 / Math.max(1e-5, Math.abs(sy))) * Math.sign(sy || 1);
    const invZ = (1 / Math.max(1e-5, Math.abs(sz))) * Math.sign(sz || 1);
    for (let i = 0; i < pos.count; i++) {
      pos.setXYZ(i, pos.getX(i) * sx, pos.getY(i) * sy, pos.getZ(i) * sz);
      const nx = norm.getX(i) * invX;
      const ny = norm.getY(i) * invY;
      const nz = norm.getZ(i) * invZ;
      const len = Math.hypot(nx, ny, nz) || 1;
      norm.setXYZ(i, nx / len, ny / len, nz / len);
    }
    pos.needsUpdate = true;
    norm.needsUpdate = true;
  }
  const painted = paintGeometry(raw, hex, paintOpts);
  raw.dispose();
  return painted;
}

export function extrudeShape(
  shape: THREE.Shape,
  depth: number,
  bevelSize: number,
  hex: number,
  curveSegments = 10,
  paintOpts?: PaintOptions
): THREE.BufferGeometry {
  const raw = new THREE.ExtrudeGeometry(shape, {
    depth,
    bevelEnabled: bevelSize > 0,
    bevelThickness: bevelSize,
    bevelSize,
    bevelSegments: 3,
    curveSegments,
  });
  raw.center();
  const painted = paintGeometry(raw, hex, paintOpts);
  raw.dispose();
  return painted;
}

export function tube(
  points: Array<[number, number, number]>,
  radius: number,
  hex: number,
  tubularSegments = 20,
  radialSegments = 8,
  closed = false,
  paintOpts?: PaintOptions
): THREE.BufferGeometry {
  let cleanPts = points;
  if (closed && points.length > 2) {
    const first = points[0];
    const last = points[points.length - 1];
    if (
      Math.hypot(first[0] - last[0], first[1] - last[1], first[2] - last[2]) < 1e-4
    ) {
      cleanPts = points.slice(0, -1);
    }
  }
  const curve = new THREE.CatmullRomCurve3(
    cleanPts.map(([x, y, z]) => new THREE.Vector3(x, y, z)),
    closed
  );
  const raw = new THREE.TubeGeometry(curve, tubularSegments, radius, radialSegments, closed);
  const painted = paintGeometry(raw, hex, paintOpts);
  raw.dispose();
  return painted;
}

export function taperedTube(
  points: Array<[number, number, number]>,
  rStart: number,
  rEnd: number,
  hex: number,
  tubularSegments = 16,
  radialSegments = 8,
  paintOpts?: PaintOptions
): THREE.BufferGeometry {
  const curve = new THREE.CatmullRomCurve3(
    points.map(([x, y, z]) => new THREE.Vector3(x, y, z))
  );
  const frames = curve.computeFrenetFrames(tubularSegments, false);
  const vertCount = (tubularSegments + 1) * radialSegments;
  const positions = new Float32Array(vertCount * 3);
  const pt = new THREE.Vector3();
  const normal = new THREE.Vector3();

  for (let i = 0; i <= tubularSegments; i++) {
    const u = i / tubularSegments;
    const rad = rStart + (rEnd - rStart) * u;
    curve.getPointAt(u, pt);
    const N = frames.normals[i];
    const B = frames.binormals[i];

    for (let j = 0; j < radialSegments; j++) {
      const v = (j / radialSegments) * Math.PI * 2;
      const cosV = -Math.cos(v);
      const sinV = Math.sin(v);
      normal.set(
        cosV * N.x + sinV * B.x,
        cosV * N.y + sinV * B.y,
        cosV * N.z + sinV * B.z
      );
      const idx = i * radialSegments + j;
      positions[idx * 3] = pt.x + rad * normal.x;
      positions[idx * 3 + 1] = pt.y + rad * normal.y;
      positions[idx * 3 + 2] = pt.z + rad * normal.z;
    }
  }

  const indices: number[] = [];
  for (let i = 0; i < tubularSegments; i++) {
    const rA = i * radialSegments;
    const rB = (i + 1) * radialSegments;
    for (let j = 0; j < radialSegments; j++) {
      const jn = (j + 1) % radialSegments;
      indices.push(rA + j, rB + j, rA + jn, rA + jn, rB + j, rB + jn);
    }
  }

  const raw = new THREE.BufferGeometry();
  raw.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  raw.setIndex(indices);
  raw.computeVertexNormals();
  const painted = paintGeometry(raw, hex, paintOpts);
  raw.dispose();
  return painted;
}

export function mergeParts(parts: THREE.BufferGeometry[]): THREE.BufferGeometry {
  if (parts.length === 0) {
    return rbox(0.1, 0.1, 0.1, 0.02, 0xffffff);
  }
  if (parts.length === 1) {
    return parts[0];
  }
  const indexed = parts.map((p) => {
    const g = p.index ? p : mergeVertices(p, 1e-4);
    if (!g.getAttribute('normal')) {
      g.computeVertexNormals();
    }
    return g;
  });

  // Ensure every geometry shares the exact same attribute keys (e.g. drop uv if any part lacks uv)
  const firstKeys = Object.keys(indexed[0].attributes);
  const commonKeys = new Set(
    firstKeys.filter((attr) => indexed.every((g) => Boolean(g.getAttribute(attr))))
  );
  for (let i = 0; i < indexed.length; i++) {
    const g = indexed[i];
    for (const attr of Object.keys(g.attributes)) {
      if (!commonKeys.has(attr)) {
        g.deleteAttribute(attr);
      }
    }
  }

  const allIndexed = indexed.every((g) => g.index !== null);
  const normalized = allIndexed
    ? indexed
    : indexed.map((g) => (g.index ? g.toNonIndexed() : g));

  const merged = mergeGeometries(normalized, false);
  for (let i = 0; i < parts.length; i++) {
    if (normalized[i] !== indexed[i]) normalized[i].dispose();
    if (indexed[i] !== parts[i]) indexed[i].dispose();
    parts[i].dispose();
  }
  if (!merged) {
    throw new Error('Failed to merge sculpted geometry parts');
  }
  return merged;
}

export function buildCloudClusterGeometry(scale = 1.0): THREE.BufferGeometry {
  const puffs: THREE.BufferGeometry[] = [];
  const specs: Array<[number, number, number, number, number, number]> = [
    [0, 0.25, 0, 2.4, 1.35, 1.65],
    [-1.7, -0.05, 0.2, 1.7, 1.05, 1.35],
    [1.8, -0.1, -0.15, 1.85, 1.1, 1.4],
    [-0.6, 0.85, -0.25, 1.45, 1.0, 1.2],
    [0.95, 0.72, 0.28, 1.35, 0.95, 1.15],
  ];
  for (let i = 0; i < specs.length; i++) {
    const [x, y, z, rx, ry, rz] = specs[i];
    const puff = smoothSphere(scale, SPARROW_PALETTE.cloudWarmTop, 16, 12, [rx, ry, rz], {
      bottomAO: 0.09,
      topLift: 0.05,
    });
    transformGeo(puff, { pos: [x * scale, y * scale, z * scale] });
    puffs.push(puff);
  }
  return mergeParts(puffs);
}
