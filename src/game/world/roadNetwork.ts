import * as THREE from 'three';
import { AYDIN_ROAD_SEGMENTS, sampleNearestRoad } from '../../data/aydinRoads';
import { CityMaterialLibrary } from '../materials';
import { getSurfaceHeightAt, getSurfaceSlopeAngles } from '../terrain';

const SIDEWALK_WIDTH = 1.3;
const CURB_OFFSET = 0.092;
const ROAD_SURFACE_OFFSET = 0.136;

interface PlacedRoadEdge {
  ax: number;
  az: number;
  bx: number;
  bz: number;
  halfW: number;
  outerHalfW: number;
}

interface ClippedSubPolyline {
  points: [number, number][];
  startSlope: number;
  endSlope: number;
}

function clipPolylineAgainstPlacedRoads(
  rawPts: [number, number][],
  placed: PlacedRoadEdge[],
  useOuterSidewalk: boolean
): ClippedSubPolyline[] {
  interface CutSpan {
    t0: number;
    t1: number;
    slope0: number;
    slope1: number;
  }
  interface ActiveEdgeSpan {
    p0: [number, number];
    p1: [number, number];
    startSlope: number;
    endSlope: number;
    touchesStart: boolean;
    touchesEnd: boolean;
  }

  const edgeSpans: ActiveEdgeSpan[][] = [];

  for (let e = 0; e < rawPts.length - 1; e++) {
    const [ax, az] = rawPts[e];
    const [bx, bz] = rawPts[e + 1];
    const dx = bx - ax;
    const dz = bz - az;
    const segLen = Math.hypot(dx, dz);
    if (segLen < 0.25) {
      edgeSpans.push([]);
      continue;
    }

    const ux = dx / segLen;
    const uz = dz / segLen;
    const nx = -uz;
    const nz = ux;

    const cuts: CutSpan[] = [];
    for (let p = 0; p < placed.length; p++) {
      const obs = placed[p];
      const odx = obs.bx - obs.ax;
      const odz = obs.bz - obs.az;
      const obsLen = Math.hypot(odx, odz);
      if (obsLen < 0.2) continue;

      const vx = odx / obsLen;
      const vz = odz / obsLen;
      const onx = -vz;
      const onz = vx;

      const denom = ux * onx + uz * onz;
      if (Math.abs(denom) < 0.18) continue;

      const crossUV = ux * vz - uz * vx;
      if (Math.abs(crossUV) < 1e-5) continue;

      const dxAC = obs.ax - ax;
      const dzAC = obs.az - az;
      const tHit = (dxAC * vz - dzAC * vx) / crossUV;
      const sHit = (dxAC * uz - dzAC * ux) / crossUV;

      if (sHit < -0.25 || sHit > obsLen + 0.25) continue;
      if (tHit < -0.6 || tHit > segLen + 0.6) continue;

      const rObs = useOuterSidewalk ? obs.outerHalfW : obs.halfW;
      const halfSpan = rObs / Math.abs(denom);
      const slope = THREE.MathUtils.clamp(-(nx * onx + nz * onz) / denom, -1.15, 1.15);

      cuts.push({
        t0: tHit - halfSpan,
        t1: tHit + halfSpan,
        slope0: slope,
        slope1: slope,
      });
    }

    cuts.sort((a, b) => a.t0 - b.t0);
    const merged: CutSpan[] = [];
    for (let c = 0; c < cuts.length; c++) {
      const cur = cuts[c];
      if (merged.length === 0 || cur.t0 > merged[merged.length - 1].t1 + 0.05) {
        merged.push({ ...cur });
      } else {
        const prev = merged[merged.length - 1];
        if (cur.t1 > prev.t1) {
          prev.t1 = cur.t1;
          prev.slope1 = cur.slope1;
        }
      }
    }

    const active: ActiveEdgeSpan[] = [];
    let cursor = 0;
    let cursorSlope = 0;

    for (let c = 0; c < merged.length; c++) {
      const cut = merged[c];
      const endT = Math.min(segLen, cut.t0);
      if (endT - cursor > 0.35) {
        active.push({
          p0: [ax + ux * cursor, az + uz * cursor],
          p1: [ax + ux * endT, az + uz * endT],
          startSlope: cursorSlope,
          endSlope: cut.slope0,
          touchesStart: cursor <= 1e-4,
          touchesEnd: endT >= segLen - 1e-4,
        });
      }
      if (cut.t1 > cursor) {
        cursor = cut.t1;
        cursorSlope = cut.slope1;
      }
    }

    if (segLen - cursor > 0.35) {
      active.push({
        p0: [ax + ux * cursor, az + uz * cursor],
        p1: [bx, bz],
        startSlope: cursorSlope,
        endSlope: 0,
        touchesStart: cursor <= 1e-4,
        touchesEnd: true,
      });
    }

    edgeSpans.push(active);
  }

  // Chain consecutive full-junction spans back into continuous mitered polylines
  const chains: ClippedSubPolyline[] = [];
  let currentChain: ClippedSubPolyline | null = null;

  for (let e = 0; e < edgeSpans.length; e++) {
    const spans = edgeSpans[e];
    if (spans.length === 0) {
      if (currentChain) {
        chains.push(currentChain);
        currentChain = null;
      }
      continue;
    }

    for (let s = 0; s < spans.length; s++) {
      const sp = spans[s];
      if (s === 0 && sp.touchesStart && currentChain) {
        currentChain.points.push(sp.p1);
        currentChain.endSlope = sp.endSlope;
        if (!sp.touchesEnd) {
          chains.push(currentChain);
          currentChain = null;
        }
      } else {
        if (currentChain) {
          chains.push(currentChain);
          currentChain = null;
        }
        const newChain: ClippedSubPolyline = {
          points: [sp.p0, sp.p1],
          startSlope: sp.startSlope,
          endSlope: sp.endSlope,
        };
        if (sp.touchesEnd && s === spans.length - 1) {
          currentChain = newChain;
        } else {
          chains.push(newChain);
        }
      }
    }
  }
  if (currentChain) chains.push(currentChain);
  return chains;
}

function createMiteredStripGeometry(
  poly: ClippedSubPolyline,
  lateralMin: number,
  lateralMax: number,
  segsAcross: number,
  yOffset: number
): THREE.BufferGeometry {
  const pts = poly.points;
  const nPts = pts.length;
  const edgeDirs: [number, number][] = [];
  const edgeNormals: [number, number][] = [];
  const edgeLens: number[] = [];

  for (let i = 0; i < nPts - 1; i++) {
    const dx = pts[i + 1][0] - pts[i][0];
    const dz = pts[i + 1][1] - pts[i][1];
    const len = Math.hypot(dx, dz) || 1;
    const ux = dx / len;
    const uz = dz / len;
    edgeDirs.push([ux, uz]);
    edgeNormals.push([-uz, ux]);
    edgeLens.push(len);
  }

  const vertexMiters: [number, number][] = [];
  for (let i = 0; i < nPts; i++) {
    if (i === 0) {
      vertexMiters.push(edgeNormals[0]);
    } else if (i === nPts - 1) {
      vertexMiters.push(edgeNormals[nPts - 2]);
    } else {
      const [n0x, n0z] = edgeNormals[i - 1];
      const [n1x, n1z] = edgeNormals[i];
      const bx = n0x + n1x;
      const bz = n0z + n1z;
      const bLen = Math.hypot(bx, bz);
      if (bLen < 1e-4) {
        vertexMiters.push(edgeNormals[i]);
      } else {
        const mx = bx / bLen;
        const mz = bz / bLen;
        const cosHalf = Math.max(0.62, mx * n0x + mz * n0z);
        vertexMiters.push([mx / cosHalf, mz / cosHalf]);
      }
    }
  }

  interface StripRow {
    cx: number;
    cz: number;
    ux: number;
    uz: number;
    nx: number;
    nz: number;
    skew: number;
    distAlong: number;
  }

  const rows: StripRow[] = [];
  let accumDist = 0;
  const totalLen = edgeLens.reduce((acc, v) => acc + v, 0);

  for (let e = 0; e < nPts - 1; e++) {
    const [ax, az] = pts[e];
    const [bx, bz] = pts[e + 1];
    const [ux, uz] = edgeDirs[e];
    const [m0x, m0z] = vertexMiters[e];
    const [m1x, m1z] = vertexMiters[e + 1];
    const segLen = edgeLens[e];
    const steps = Math.max(2, Math.round(segLen / 1.4));

    const startIdx = e === 0 ? 0 : 1;
    for (let s = startIdx; s <= steps; s++) {
      const f = s / steps;
      const cx = ax + (bx - ax) * f;
      const cz = az + (bz - az) * f;
      const dist = accumDist + segLen * f;

      const nx = m0x + (m1x - m0x) * f;
      const nz = m0z + (m1z - m0z) * f;

      let skew = 0;
      const fadeDist = Math.min(segLen * 0.45, 3.6);
      if (e === 0 && poly.startSlope !== 0 && dist < fadeDist) {
        skew += poly.startSlope * (1 - dist / fadeDist);
      }
      const remFromEnd = totalLen - dist;
      if (e === nPts - 2 && poly.endSlope !== 0 && remFromEnd < fadeDist) {
        skew += poly.endSlope * (1 - remFromEnd / fadeDist);
      }

      rows.push({ cx, cz, ux, uz, nx, nz, skew, distAlong: dist });
    }
    accumDist += segLen;
  }

  const cols = segsAcross + 1;
  const positions = new Float32Array(rows.length * cols * 3);
  const uvs = new Float32Array(rows.length * cols * 2);
  const indices: number[] = [];

  for (let r = 0; r < rows.length; r++) {
    const row = rows[r];
    for (let c = 0; c < cols; c++) {
      const uFrac = c / segsAcross;
      const wCoord = lateralMin + (lateralMax - lateralMin) * uFrac;
      const alongShift = wCoord * row.skew;
      const wx = row.cx + row.nx * wCoord + row.ux * alongShift;
      const wz = row.cz + row.nz * wCoord + row.uz * alongShift;
      const wy = getSurfaceHeightAt(wx, wz) + yOffset;

      const idx = r * cols + c;
      positions[idx * 3] = wx;
      positions[idx * 3 + 1] = wy;
      positions[idx * 3 + 2] = wz;
      uvs[idx * 2] = uFrac;
      uvs[idx * 2 + 1] = row.distAlong / 10;
    }
  }

  for (let r = 0; r < rows.length - 1; r++) {
    for (let c = 0; c < segsAcross; c++) {
      const a = r * cols + c;
      const b = a + 1;
      const cIdx = (r + 1) * cols + c;
      const d = cIdx + 1;
      indices.push(a, b, cIdx, b, d, cIdx);
    }
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geo.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
  geo.setIndex(indices);
  geo.computeVertexNormals();
  return geo;
}

export function buildRoadNetwork(params: {
  staticWorldGroup: THREE.Group;
  mats: CityMaterialLibrary;
  localDisposables: { dispose: () => void }[];
}): void {
  const { staticWorldGroup, mats, localDisposables } = params;

  const placedRoadEdges: PlacedRoadEdge[] = [];
  const dashGeo = new THREE.PlaneGeometry(0.22, 3.0);
  dashGeo.userData.isSharedGeo = true;
  const ewStripeGeo = new THREE.PlaneGeometry(0.55, 2.0);
  ewStripeGeo.userData.isSharedGeo = true;
  const nsStripeGeo = new THREE.PlaneGeometry(2.0, 0.55);
  nsStripeGeo.userData.isSharedGeo = true;
  localDisposables.push(dashGeo, ewStripeGeo, nsStripeGeo);

  AYDIN_ROAD_SEGMENTS.forEach((road) => {
    const roadMat = road.surface === 'cobble' ? mats.cobble : mats.asphalt;
    const halfW = road.width * 0.5;
    const outerHalfW = halfW + SIDEWALK_WIDTH;

    const basePts: [number, number][] = road.points.map(([px, pz]) => [px, pz]);
    if (road.id === 'istasyon-blv') {
      basePts[0] = [-156, 70];
    } else if (road.id === 'cankaya-kemer-cd') {
      basePts[basePts.length - 1] = [122.2, -72];
    }

    const roadChains = clipPolylineAgainstPlacedRoads(basePts, placedRoadEdges, false);
    roadChains.forEach((chain) => {
      const roadMesh = new THREE.Mesh(
        createMiteredStripGeometry(chain, -halfW, halfW, 4, ROAD_SURFACE_OFFSET),
        roadMat
      );
      roadMesh.receiveShadow = true;
      staticWorldGroup.add(roadMesh);

      if (road.hasCenterLine) {
        for (let i = 0; i < chain.points.length - 1; i++) {
          const [ax, az] = chain.points[i];
          const [bx, bz] = chain.points[i + 1];
          const dx = bx - ax;
          const dz = bz - az;
          const segLen = Math.hypot(dx, dz);
          if (segLen < 8.5) continue;
          const ux = dx / segLen;
          const uz = dz / segLen;
          const yaw = Math.atan2(dx, dz);
          for (let d = 4.2; d <= segLen - 4.2; d += 6.4) {
            const cx = ax + ux * d;
            const cz = az + uz * d;
            if (Math.abs(cx) < 16 && cz > -18 && cz < 28) continue;
            const dy = getSurfaceHeightAt(cx, cz) + ROAD_SURFACE_OFFSET + 0.028;
            const slopes = getSurfaceSlopeAngles(cx, cz, yaw + Math.PI);
            const dash = new THREE.Mesh(dashGeo, mats.roadStripe);
            dash.rotation.order = 'YXZ';
            dash.rotation.set(-Math.PI / 2 + slopes.pitch, yaw, slopes.roll);
            dash.position.set(cx, dy, cz);
            staticWorldGroup.add(dash);
          }
        }
      }
    });

    const sidewalkChains = clipPolylineAgainstPlacedRoads(basePts, placedRoadEdges, true);
    sidewalkChains.forEach((chain) => {
      const leftCurb = new THREE.Mesh(
        createMiteredStripGeometry(chain, halfW, outerHalfW, 2, CURB_OFFSET),
        mats.sidewalk
      );
      leftCurb.receiveShadow = true;
      const rightCurb = new THREE.Mesh(
        createMiteredStripGeometry(chain, -outerHalfW, -halfW, 2, CURB_OFFSET),
        mats.sidewalk
      );
      rightCurb.receiveShadow = true;
      staticWorldGroup.add(leftCurb, rightCurb);
    });

    roadChains.forEach((chain) => {
      for (let i = 0; i < chain.points.length - 1; i++) {
        placedRoadEdges.push({
          ax: chain.points[i][0],
          az: chain.points[i][1],
          bx: chain.points[i + 1][0],
          bz: chain.points[i + 1][1],
          halfW,
          outerHalfW,
        });
      }
    });
  });

  const crosswalkIntersections: [number, number][] = [
    [-19, 38],
    [19, 38],
    [19, -30],
    [-19, -30],
    [-58, 30],
    [-102, 11.5],
    [68, 10],
    [118, 10],
    [-19, 70],
    [19, 70],
    [68, -30],
  ];
  crosswalkIntersections.forEach(([ix, iz]) => {
    const armS = sampleNearestRoad(ix, iz + 5.6, 1.5);
    if (armS.road && armS.dist < 1.2) {
      const slopes = getSurfaceSlopeAngles(ix, iz + 5.6, 0);
      for (let s = -2.6; s <= 2.6; s += 1.3) {
        const stripeEW = new THREE.Mesh(ewStripeGeo, mats.roadStripe);
        stripeEW.rotation.set(-Math.PI / 2 + slopes.pitch, 0, slopes.roll);
        stripeEW.position.set(ix + s, getSurfaceHeightAt(ix + s, iz + 5.6) + ROAD_SURFACE_OFFSET + 0.028, iz + 5.6);
        staticWorldGroup.add(stripeEW);
      }
    }
    const armE = sampleNearestRoad(ix + 5.6, iz, 1.5);
    if (armE.road && armE.dist < 1.2) {
      const slopes = getSurfaceSlopeAngles(ix + 5.6, iz, 0);
      for (let s = -2.6; s <= 2.6; s += 1.3) {
        const stripeNS = new THREE.Mesh(nsStripeGeo, mats.roadStripe);
        stripeNS.rotation.set(-Math.PI / 2 + slopes.pitch, 0, slopes.roll);
        stripeNS.position.set(ix + 5.6, getSurfaceHeightAt(ix + 5.6, iz + s) + ROAD_SURFACE_OFFSET + 0.028, iz + s);
        staticWorldGroup.add(stripeNS);
      }
    }
  });
}
