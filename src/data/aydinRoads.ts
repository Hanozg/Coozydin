import { SandboxRoadSurface } from '../types/game';

export interface RoadSegmentDef {
  id: string;
  name: string;
  surface: SandboxRoadSurface;
  width: number;
  hasCenterLine: boolean;
  hasSidewalk?: boolean;
  cornerRadius?: number;
  points: [number, number][];
}

export interface InternalRoadSegment extends RoadSegmentDef {
  hasSidewalk: boolean;
  cornerRadius: number;
  renderPoints: [number, number][];
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
}

export const TABAKHANE_BRIDGE_ZS = [-72, -30, -8, 30, 70] as const;
export const RAIL_TRACK_Z = 96.1;

const RAW_ROADS: RoadSegmentDef[] = [
  {
    id: 'istasyon-blv',
    name: 'İstasyon Bulvarı',
    surface: 'asphalt',
    width: 8.4,
    hasCenterLine: true,
    points: [
      [-152, 70],
      [-102, 70],
      [-58, 70],
      [-19, 70],
      [19, 70],
      [74, 70],
      [108, 58],
      [126, 58],
      [170, 55],
    ],
  },
  {
    id: 'cankaya-kemer-cd',
    name: 'Çankaya & Kemer Caddesi',
    surface: 'asphalt',
    width: 8.0,
    hasCenterLine: true,
    points: [
      [-192, -80],
      [-152, -76],
      [-128, -74],
      [-102, -72],
      [-58, -72],
      [-19, -72],
      [19, -72],
      [68, -72],
      [118, -72],
    ],
  },
  {
    id: 'yagcilar-cd',
    name: 'Yağcılar & Çarşı Caddesi',
    surface: 'cobble',
    width: 8.0,
    hasCenterLine: false,
    points: [
      [-58, 70],
      [-58, 38],
      [-58, 30],
      [-58, 11.5],
      [-58, -30],
      [-58, -72],
    ],
  },
  {
    id: 'gazi-bati',
    name: 'Batı Gazi Bulvarı (İzmir Yolu)',
    surface: 'asphalt',
    width: 8.4,
    hasCenterLine: true,
    points: [
      [-212, 14],
      [-188, 12],
      [-152, -2],
      [-102, -16],
      [-58, -30],
    ],
  },
  {
    id: 'gazi-carsi',
    name: 'Gazi Bulvarı (Tarihi Çarşı)',
    surface: 'cobble',
    width: 8.4,
    hasCenterLine: false,
    points: [
      [-58, -30],
      [-19, -30],
      [19, -30],
      [50, -30],
    ],
  },
  {
    id: 'gazi-dogu',
    name: 'Doğu Gazi Bulvarı (Denizli Yolu)',
    surface: 'asphalt',
    width: 8.4,
    hasCenterLine: true,
    points: [
      [50, -30],
      [74, -30],
      [108, -18],
      [126, -18],
      [176, -15],
    ],
  },
  {
    id: 'adnan-menderes-blv',
    name: 'Adnan Menderes Bulvarı',
    surface: 'asphalt',
    width: 8.4,
    hasCenterLine: true,
    points: [
      [-19, 70],
      [-19, 38],
      [-19, 11.5],
      [-19, -30],
      [-19, -72],
    ],
  },
  {
    id: 'hukumet-blv',
    name: 'Hükümet Bulvarı',
    surface: 'asphalt',
    width: 8.4,
    hasCenterLine: true,
    points: [
      [19, 70],
      [19, 38],
      [19, -8],
      [19, -30],
      [19, -72],
    ],
  },
  {
    id: 'ortamahalle-cd',
    name: 'Orta Mahalle & Tabakhane Doğu Cd.',
    surface: 'asphalt',
    width: 8.0,
    hasCenterLine: true,
    points: [
      [68, -72],
      [68, -30],
      [68, -8],
      [68, 10],
      [68, 30],
      [68, 70],
    ],
  },
  {
    id: 'korfez-mimarsinan-cd',
    name: 'Körfez & Mimar Sinan Caddesi',
    surface: 'asphalt',
    width: 8.0,
    hasCenterLine: true,
    points: [
      [-152, 70],
      [-152, -2],
      [-152, -76],
    ],
  },
  {
    id: 'ataturk-blv',
    name: 'Atatürk Bulvarı (Girne & Cumhuriyet)',
    surface: 'asphalt',
    width: 8.4,
    hasCenterLine: true,
    points: [
      [-102, 70],
      [-102, 30],
      [-102, 11.5],
      [-102, -20],
      [-120, -48],
      [-128, -74],
    ],
  },
  {
    id: 'dogu-blv',
    name: 'Doğu Çevre Bulvarı (Forum & Yedi Eylül)',
    surface: 'asphalt',
    width: 8.4,
    hasCenterLine: true,
    points: [
      [118, -72],
      [118, -18],
      [118, 10],
      [118, 58],
      [118, 84],
    ],
  },
  {
    id: 'sevgi-yolu',
    name: 'Sevgi Yolu (Güzelhisar)',
    surface: 'cobble',
    width: 7.8,
    hasCenterLine: false,
    points: [
      [-102, 11.5],
      [-58, 11.5],
      [-19, 11.5],
    ],
  },
  {
    id: 'cumhuriyet-cd',
    name: 'Cumhuriyet Caddesi',
    surface: 'asphalt',
    width: 8.2,
    hasCenterLine: true,
    points: [
      [-102, 30],
      [-58, 30],
    ],
  },
  {
    id: 'kibris-cd',
    name: 'Kıbrıs Caddesi',
    surface: 'asphalt',
    width: 8.2,
    hasCenterLine: true,
    points: [
      [-58, 38],
      [-19, 38],
      [19, 38],
      [42, 30],
      [59.5, 30],
      [68, 30],
    ],
  },
  {
    id: 'mesrutiyet-koprusu',
    name: 'Meşrutiyet & Tabakhane Köprüsü',
    surface: 'asphalt',
    width: 8.0,
    hasCenterLine: true,
    points: [
      [19, -8],
      [59.5, -8],
      [68, -8],
    ],
  },
  {
    id: 'forum-cd',
    name: 'Forum Aydın & Doğu Bulvarı Bağlantısı',
    surface: 'asphalt',
    width: 8.4,
    hasCenterLine: true,
    points: [
      [68, 10],
      [118, 10],
      [129.5, 10],
    ],
  },
  {
    id: 'magnesia-spur',
    name: 'Magnesia Antik Yolu',
    surface: 'cobble',
    width: 7.6,
    hasCenterLine: false,
    points: [
      [-188, 12],
      [-188, -1.5],
    ],
  },
  {
    id: 'tralleis-yokusu',
    name: 'Tralleis Yokuşu & Kalfaköy Yolu',
    surface: 'asphalt',
    width: 8.0,
    hasCenterLine: true,
    points: [
      [-19, -72],
      [-28, -88],
      [-58, -94],
      [-98, -96],
      [-134, -90],
      [-152, -76],
    ],
  },
  {
    id: 'aytepe-yokusu',
    name: 'Aytepe Üniversite Yokuşu',
    surface: 'asphalt',
    width: 8.4,
    hasCenterLine: true,
    points: [
      [19, -72],
      [32, -88],
      [68, -104],
      [78.5, -104],
    ],
  },
  // Bina & Meydan Bağlantı Yolları (ana bulvarlardan sonra eklenir; kesişimlerde otomatik kesilir)
  {
    id: 'tralleis-giris',
    name: 'Tralleis Antik Kenti Giriş Yolu',
    surface: 'cobble',
    width: 6.4,
    hasCenterLine: false,
    points: [
      [-58, -94],
      [-58, -103.5],
    ],
  },
  {
    id: 'ortamahalle-sokak',
    name: 'Orta Mahalle Taş Sokağı',
    surface: 'cobble',
    width: 7.2,
    hasCenterLine: false,
    points: [
      [68, -48],
      [82.0, -48],
    ],
  },
  {
    id: 'nasuhpasa-giris',
    name: 'Zincirli Han Kapısı Bağlantısı',
    surface: 'cobble',
    width: 7.4,
    hasCenterLine: false,
    points: [
      [19, -50],
      [30.2, -50],
    ],
  },
  {
    id: 'ramazanpasa-sokak',
    name: 'Ramazan Paşa Çarşı Sokağı',
    surface: 'cobble',
    width: 7.2,
    hasCenterLine: false,
    points: [
      [-38.5, -30],
      [-38.5, -44.0],
    ],
  },
  {
    id: 'cihanoglu-sokak',
    name: 'Cihanoğlu Külliyesi Sokağı',
    surface: 'cobble',
    width: 7.0,
    hasCenterLine: false,
    points: [
      [19, -51],
      [7.2, -51],
    ],
  },
  {
    id: 'yagcilarici-giris',
    name: 'Yağcılar İçi Arasta Geçidi',
    surface: 'cobble',
    width: 7.0,
    hasCenterLine: false,
    points: [
      [-58, -47],
      [-66.5, -47],
    ],
  },
  {
    id: 'belediye-baglanti',
    name: 'Büyükşehir Meydan Girişi',
    surface: 'cobble',
    width: 7.4,
    hasCenterLine: false,
    points: [
      [19, 10],
      [30.0, 10],
    ],
  },
  {
    id: 'meydan-kuzey',
    name: 'Kent Meydanı Kuzey Geçidi',
    surface: 'cobble',
    width: 8.4,
    hasCenterLine: false,
    points: [
      [0, -30],
      [0, -17.0],
    ],
  },
  {
    id: 'meydan-guney',
    name: 'Kent Meydanı Güney Geçidi',
    surface: 'cobble',
    width: 8.4,
    hasCenterLine: false,
    points: [
      [0, 38],
      [0, 25.5],
    ],
  },
  {
    id: 'tekstilpark-giris',
    name: 'Tekstil Park Giriş Yolu',
    surface: 'cobble',
    width: 7.4,
    hasCenterLine: false,
    points: [
      [68, 34],
      [80.5, 34],
    ],
  },
  {
    id: 'trengari-meydan',
    name: 'Tren Garı İstasyon Meydanı',
    surface: 'cobble',
    width: 10.0,
    hasCenterLine: false,
    points: [
      [0, 70],
      [0, 81.0],
    ],
  },
  {
    id: 'kipa-giris',
    name: 'Kipa AVM Otopark Bağlantısı',
    surface: 'asphalt',
    width: 8.0,
    hasCenterLine: false,
    points: [
      [-80, 30],
      [-80, 44.5],
    ],
  },
  {
    id: 'nevzatbicer-giris',
    name: 'Nevzat Biçer Parkı Girişi',
    surface: 'cobble',
    width: 6.4,
    hasCenterLine: false,
    points: [
      [-102, 14.4],
      [-113.8, 14.4],
    ],
  },
];

/**
 * Smoothly rounds interior polyline corners using tangent-clamped quadratic Bézier fillets
 * while preserving the user's original control points non-destructively.
 */
export function roundPolylineCorners(
  rawPoints: [number, number][],
  cornerRadius: number
): [number, number][] {
  const n = rawPoints.length;
  if (n < 3 || cornerRadius <= 0.1) {
    return rawPoints.map(([px, pz]) => [px, pz]);
  }

  const out: [number, number][] = [[rawPoints[0][0], rawPoints[0][1]]];

  for (let i = 1; i < n - 1; i++) {
    const [px, pz] = rawPoints[i - 1];
    const [cx, cz] = rawPoints[i];
    const [nx, nz] = rawPoints[i + 1];

    const vInX = px - cx;
    const vInZ = pz - cz;
    const lenIn = Math.hypot(vInX, vInZ);

    const vOutX = nx - cx;
    const vOutZ = nz - cz;
    const lenOut = Math.hypot(vOutX, vOutZ);

    if (lenIn < 0.6 || lenOut < 0.6) {
      out.push([cx, cz]);
      continue;
    }

    const uInX = vInX / lenIn;
    const uInZ = vInZ / lenIn;
    const uOutX = vOutX / lenOut;
    const uOutZ = vOutZ / lenOut;

    const dot = uInX * uOutX + uInZ * uOutZ;
    // Nearly straight (~180°) or hairpin fold: keep crisp vertex
    if (dot < -0.994 || dot > 0.992) {
      out.push([cx, cz]);
      continue;
    }

    // Limit trim to 44% of either adjacent segment so neighboring fillets never collide
    const trim = Math.min(cornerRadius, lenIn * 0.44, lenOut * 0.44);
    if (trim < 0.35) {
      out.push([cx, cz]);
      continue;
    }

    const t0x = cx + uInX * trim;
    const t0z = cz + uInZ * trim;
    const t1x = cx + uOutX * trim;
    const t1z = cz + uOutZ * trim;

    const subSteps = Math.max(3, Math.min(9, Math.round(trim * 0.9)));
    for (let s = 0; s <= subSteps; s++) {
      const t = s / subSteps;
      const omt = 1 - t;
      const bx = omt * omt * t0x + 2 * omt * t * cx + t * t * t1x;
      const bz = omt * omt * t0z + 2 * omt * t * cz + t * t * t1z;
      const prevOut = out[out.length - 1];
      if (!prevOut || Math.hypot(bx - prevOut[0], bz - prevOut[1]) > 0.12) {
        out.push([bx, bz]);
      }
    }
  }

  const last = rawPoints[n - 1];
  const prevOut = out[out.length - 1];
  if (!prevOut || Math.hypot(last[0] - prevOut[0], last[1] - prevOut[1]) > 0.08) {
    out.push([last[0], last[1]]);
  } else {
    out[out.length - 1] = [last[0], last[1]];
  }

  return out;
}

function buildInternalRoad(road: RoadSegmentDef): InternalRoadSegment {
  const pts: [number, number][] = road.points.map(([px, pz]) => [px, pz]);
  const cornerRadius = Math.max(0, Math.min(20, road.cornerRadius ?? 0));
  const hasSidewalk = road.hasSidewalk !== false;
  const renderPoints = roundPolylineCorners(pts, cornerRadius);

  let minX = Infinity;
  let maxX = -Infinity;
  let minZ = Infinity;
  let maxZ = -Infinity;
  for (let i = 0; i < renderPoints.length; i++) {
    const [px, pz] = renderPoints[i];
    if (px < minX) minX = px;
    if (px > maxX) maxX = px;
    if (pz < minZ) minZ = pz;
    if (pz > maxZ) maxZ = pz;
  }
  const pad = road.width * 0.5 + 3.2;
  return {
    id: road.id,
    name: road.name,
    surface: road.surface,
    width: road.width,
    hasCenterLine: road.hasCenterLine,
    hasSidewalk,
    cornerRadius,
    points: pts,
    renderPoints,
    minX: minX - pad,
    maxX: maxX + pad,
    minZ: minZ - pad,
    maxZ: maxZ + pad,
  };
}

export const AYDIN_ROAD_SEGMENTS: InternalRoadSegment[] = RAW_ROADS.map(buildInternalRoad);

export function getDefaultRoadDefs(): RoadSegmentDef[] {
  return RAW_ROADS.map((r) => ({
    ...r,
    hasSidewalk: r.hasSidewalk !== false,
    cornerRadius: r.cornerRadius ?? 0,
    points: r.points.map(([px, pz]) => [px, pz] as [number, number]),
  }));
}

export function getDefaultRoadDef(id: string): RoadSegmentDef | null {
  const found = RAW_ROADS.find((r) => r.id === id);
  if (!found) return null;
  return {
    ...found,
    hasSidewalk: found.hasSidewalk !== false,
    cornerRadius: found.cornerRadius ?? 0,
    points: found.points.map(([px, pz]) => [px, pz] as [number, number]),
  };
}

export function setLiveRoadSegments(nextDefs: RoadSegmentDef[]): void {
  AYDIN_ROAD_SEGMENTS.length = 0;
  for (let i = 0; i < nextDefs.length; i++) {
    if (nextDefs[i].points.length >= 2) {
      AYDIN_ROAD_SEGMENTS.push(buildInternalRoad(nextDefs[i]));
    }
  }
}

export function resetLiveRoadSegments(): void {
  setLiveRoadSegments(RAW_ROADS);
}

export interface RoadSampleResult {
  dist: number;
  road: InternalRoadSegment | null;
}

/**
 * Fast polyline distance query with per-road AABB rejection.
 * Queries the rounded renderPoints so driving elevation and road picking follow curved corners.
 */
export function sampleNearestRoad(x: number, z: number, maxSearchDist = 12): RoadSampleResult {
  let bestDistSq = maxSearchDist * maxSearchDist;
  let bestRoad: InternalRoadSegment | null = null;

  for (let i = 0; i < AYDIN_ROAD_SEGMENTS.length; i++) {
    const road = AYDIN_ROAD_SEGMENTS[i];
    if (x < road.minX || x > road.maxX || z < road.minZ || z > road.maxZ) {
      continue;
    }
    const pts = road.renderPoints;
    for (let j = 0; j < pts.length - 1; j++) {
      const ax = pts[j][0];
      const az = pts[j][1];
      const bx = pts[j + 1][0];
      const bz = pts[j + 1][1];
      const abx = bx - ax;
      const abz = bz - az;
      const abLenSq = abx * abx + abz * abz;
      let t = abLenSq > 1e-6 ? ((x - ax) * abx + (z - az) * abz) / abLenSq : 0;
      if (t < 0) t = 0;
      else if (t > 1) t = 1;
      const cx = ax + abx * t;
      const cz = az + abz * t;
      const dx = x - cx;
      const dz = z - cz;
      const dSq = dx * dx + dz * dz;
      if (dSq < bestDistSq) {
        bestDistSq = dSq;
        bestRoad = road;
      }
    }
  }

  return {
    dist: bestRoad ? Math.sqrt(bestDistSq) : Infinity,
    road: bestRoad,
  };
}
