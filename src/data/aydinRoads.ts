export interface RoadSegmentDef {
  id: string;
  name: string;
  surface: 'asphalt' | 'cobble';
  width: number;
  hasCenterLine: boolean;
  points: [number, number][];
}

export interface InternalRoadSegment extends RoadSegmentDef {
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

export const AYDIN_ROAD_SEGMENTS: InternalRoadSegment[] = RAW_ROADS.map((road) => {
  let minX = Infinity;
  let maxX = -Infinity;
  let minZ = Infinity;
  let maxZ = -Infinity;
  for (let i = 0; i < road.points.length; i++) {
    const [px, pz] = road.points[i];
    if (px < minX) minX = px;
    if (px > maxX) maxX = px;
    if (pz < minZ) minZ = pz;
    if (pz > maxZ) maxZ = pz;
  }
  const pad = road.width * 0.5 + 3.2;
  return {
    ...road,
    minX: minX - pad,
    maxX: maxX + pad,
    minZ: minZ - pad,
    maxZ: maxZ + pad,
  };
});

export interface RoadSampleResult {
  dist: number;
  road: InternalRoadSegment | null;
}

/**
 * Fast polyline distance query with per-road AABB rejection.
 * Safe to invoke every animation frame in getWalkableSurfaceHeightAt.
 */
export function sampleNearestRoad(x: number, z: number, maxSearchDist = 12): RoadSampleResult {
  let bestDistSq = maxSearchDist * maxSearchDist;
  let bestRoad: InternalRoadSegment | null = null;

  for (let i = 0; i < AYDIN_ROAD_SEGMENTS.length; i++) {
    const road = AYDIN_ROAD_SEGMENTS[i];
    if (x < road.minX || x > road.maxX || z < road.minZ || z > road.maxZ) {
      continue;
    }
    const pts = road.points;
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
