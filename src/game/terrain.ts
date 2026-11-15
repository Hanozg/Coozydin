import { RAIL_TRACK_Z, sampleNearestRoad, TABAKHANE_BRIDGE_ZS } from '../data/aydinRoads';

function smoothstep(edge0: number, edge1: number, x: number): number {
  const t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}

/**
 * Tabakhane Deresi flows North-to-South right behind Aydın Büyükşehir Belediyesi (x ~ 49.5),
 * cutting down from the Aydın Dağları gorge (Tralleis–Aytepe pass) across Gazi Bulvarı
 * and separating Efeler Merkez (west) from Orta Mahalle & Meşrutiyet / Aytepe foothills (east).
 */
export function getTabakhaneCenterX(z: number): number {
  const meander = Math.sin(z * 0.03 + 0.3) * 0.9;
  const northBend = smoothstep(-58, -165, z) * -15.5;
  return 59.5 + meander + northBend;
}

export function getTabakhaneHalfWidth(): number {
  return 2.6;
}

interface PlateauSpec {
  x: number;
  z: number;
  rx: number;
  rz: number;
  targetY: number;
  strength: number;
}

/**
 * Courtyard & plaza terrace leveling so hillside monuments sit naturally on carved Aydın terraces
 * without floating corners even on steep Tralleis and Aytepe climbs.
 */
const LANDMARK_PLATEAUS: PlateauSpec[] = [
  { x: -58, z: -108, rx: 15.0, rz: 12.2, targetY: 10.1, strength: 0.94 }, // Tralleis Antik Kenti (~159 m rakım)
  { x: 92, z: -104, rx: 20.5, rz: 16.0, targetY: 11.8, strength: 0.94 }, // ADÜ Aytepe Kampüsü (~176 m rakım)
  { x: 92, z: -48, rx: 14.5, rz: 12.5, targetY: 3.45, strength: 0.9 }, // Orta Mahalle (~92 m rakım)
  { x: -38.5, z: -50, rx: 11.0, rz: 10.5, targetY: 2.75, strength: 0.88 }, // Ramazan Paşa Camii (~85 m rakım)
  { x: -76, z: -47, rx: 13.5, rz: 12.0, targetY: 2.4, strength: 0.9 }, // Yağcılar İçi Tarihi Çarşısı (~82 m rakım)
  { x: 0, z: -51, rx: 12.5, rz: 11.5, targetY: 2.8, strength: 0.88 }, // Cihanoğlu Külliyesi (~86 m rakım)
  { x: 38.5, z: -50, rx: 12.0, rz: 11.5, targetY: 2.75, strength: 0.88 }, // Nasuh Paşa Külliyesi (~85 m rakım)
  { x: -36, z: -2.5, rx: 10.5, rz: 10.5, targetY: 1.05, strength: 0.88 }, // Bey Camii (~68 m rakım)
  { x: -32, z: -16, rx: 8.8, rz: 8.8, targetY: 1.45, strength: 0.9 }, // Sıcak Yuvam (~72 m rakım)
  { x: -39.5, z: 11.5, rx: 16.0, rz: 8.0, targetY: 0.62, strength: 0.92 }, // Sevgi Yolu (~64 m rakım)
  { x: -188, z: -12, rx: 15.5, rz: 15.0, targetY: 2.05, strength: 0.9 }, // Magnesia Antik Kenti (~78 m rakım)
  { x: 0, z: 10, rx: 17.5, rz: 24.5, targetY: 0.55, strength: 0.96 }, // Atatürk Kent Meydanı (~64 m rakım)
  { x: 39, z: 10, rx: 13.0, rz: 11.5, targetY: 0.65, strength: 0.94 }, // Aydın Büyükşehir Binası (~64 m rakım)
  { x: -127, z: 14, rx: 17.5, rz: 14.5, targetY: 0.35, strength: 0.96 }, // Nevzat Biçer Parkı (~62 m rakım)
  { x: 93, z: 34, rx: 16.5, rz: 14.5, targetY: 0.45, strength: 0.95 }, // Tekstil Park (~62 m rakım)
  { x: 142, z: 10, rx: 16.5, rz: 14.5, targetY: 0.55, strength: 0.94 }, // Forum Aydın (~63 m rakım)
  { x: -80, z: 52, rx: 15.5, rz: 10.5, targetY: 0.15, strength: 0.96 }, // Kipa AVM (~59 m rakım)
  { x: 0, z: 85, rx: 18.0, rz: 11.5, targetY: 0.05, strength: 0.98 }, // Tarihi Tren Garı (~58 m rakım)
];

/**
 * 1:100 Aydın Topographic Height Model (without carved Tabakhane streambed):
 * - South & Central Efeler (z >= -8): Flat Büyük Menderes Ovası (~58–65 m ASL -> y = 0.0–0.7m).
 * - Historic Bazaar & East-West Transition (z in [-62, -8]): Steady northern climb (~70–95 m ASL).
 * - Tralleis Yokuşu & Kalfaköy Sırtı (z < -58): Authentic climb up to Tralleis ([-58, -108], ~159 m ASL)
 *   and continuing north into Kalfaköy ridge (y = 14–18m) & Aydın Dağları.
 * - Aytepe Tepesi / ADÜ Kampüsü (x > 52, z < -58): Steep Aytepe Üniversite Yokuşu rising to
 *   ~176 m ASL (y = 11.8m) on the north-eastern hilltop plateau.
 * - Northern Aydın Dağları Foothill Ramp (z < -136): Rises smoothly toward the mountain range backdrop.
 */
export function getBaseTerrainHeight(x: number, z: number): number {
  // 1. Gentle south-to-bazaar plain transition from Büyük Menderes Ovası (z = +18 -> z = -56)
  const bazaarRamp = smoothstep(18, -56, z) * 2.55;

  // 2. Authentic Tralleis & Kalfaköy northern hillside climb (Tralleis Yokuşu)
  const tralleisZClimb = smoothstep(-40, -108, z) * 7.1;
  const kalfakoyUpperClimb = smoothstep(-108, -172, z) * 6.8;
  // Soften far western Menderes plain beyond Kemer/Magnesia while keeping northern ridge intact
  const westRidgeTaper = 1 - smoothstep(-135, -245, x) * 0.42;

  // 3. Prominent Aytepe (ADÜ) eastern hilltop & Orta Mahalle foothill terrace
  const eastBankFactor = smoothstep(42, 84, x);
  const ortaTerrace =
    eastBankFactor *
    smoothstep(-16, -54, z) *
    (1 - smoothstep(-72, -114, z)) *
    1.15;

  const aytepeHillMask = smoothstep(52, 88, x) * smoothstep(-44, -104, z);
  const aytepeSummitLift = aytepeHillMask * 2.65;

  // 4. Aydın Dağları deep northern foothill rise beyond the upper city perimeter (z < -136)
  const northMountainSkirt = smoothstep(-136, -265, z) * 19.0 * westRidgeTaper;

  // 5. Western İzmir Yolu / Magnesia gentle foothill rise
  const magnesiaFoothill =
    smoothstep(-142, -192, x) * smoothstep(10, -52, z) * (1 - smoothstep(-86, -134, z)) * 1.35;

  // 6. Subtle organic Aegean earth undulations outside core flat avenues
  const westUrbanFlat =
    x < -55 && z > -20 && z < 98
      ? smoothstep(190, 232, -x)
      : smoothstep(125, 178, Math.abs(x));
  const openHillMask = Math.min(
    1,
    smoothstep(-34, -84, z) * 0.45 + westUrbanFlat * 0.85 + smoothstep(-128, -172, z) * 0.9
  );
  const rolling =
    (Math.sin(x * 0.042 + 0.35) * Math.cos(z * 0.039 - 0.2) +
      0.42 * Math.sin((x - z) * 0.07)) *
    0.45 *
    openHillMask;

  // Keep Southern Railway track corridor (z around RAIL_TRACK_Z = 96.1) flat near 0 for level tracks
  const railDistZ = Math.abs(z - RAIL_TRACK_Z);
  const railCorridorMask =
    (1 - smoothstep(3.5, 10.5, railDistZ)) * (1 - smoothstep(122, 164, Math.abs(x)));

  let rawHeight =
    (bazaarRamp +
      (tralleisZClimb + kalfakoyUpperClimb) * westRidgeTaper +
      ortaTerrace +
      aytepeSummitLift +
      magnesiaFoothill +
      northMountainSkirt +
      rolling) *
    (1 - railCorridorMask);

  // Subtle Tabakhane mountain valley notch in the high north so creek flows out of a natural gorge
  const streamDistNorth = Math.abs(x - getTabakhaneCenterX(z));
  const gorgeMask = smoothstep(-72, -165, z) * (1 - smoothstep(6, 24, streamDistNorth));
  rawHeight -= gorgeMask * 2.5;

  // 7. Smooth local terrace plateaus under historical & urban landmarks
  let totalWeight = 0;
  let weightedTarget = 0;
  for (let i = 0; i < LANDMARK_PLATEAUS.length; i++) {
    const p = LANDMARK_PLATEAUS[i];
    const dx = x - p.x;
    const dz = z - p.z;
    if (Math.abs(dx) > p.rx * 1.55 || Math.abs(dz) > p.rz * 1.55) continue;
    const d = Math.hypot(dx / p.rx, dz / p.rz);
    if (d < 1.55) {
      const w = (1 - smoothstep(0.65, 1.55, d)) * p.strength;
      if (w > 0.001) {
        totalWeight += w;
        weightedTarget += p.targetY * w;
      }
    }
  }

  if (totalWeight > 0.001) {
    const clampedWeight = Math.min(0.96, totalWeight);
    const avgTarget = weightedTarget / totalWeight;
    return rawHeight * (1 - clampedWeight) + avgTarget * clampedWeight;
  }

  return Math.max(0, rawHeight);
}

/**
 * Full terrain height including the carved Tabakhane Deresi channel.
 */
export function getTerrainHeightAt(x: number, z: number): number {
  const base = getBaseTerrainHeight(x, z);
  const streamX = getTabakhaneCenterX(z);
  const distToStream = Math.abs(x - streamX);
  if (distToStream < 4.5) {
    const depth = 1.32 + smoothstep(-58, -145, z) * 0.45;
    const carve = (1 - smoothstep(2.0, 4.5, distToStream)) * depth;
    return base - carve;
  }
  return base;
}

/**
 * Drivable surface height: identical to terrain height except over Tabakhane Deresi road bridges
 * where roads arch gently over the flowing stream.
 */
export function getSurfaceHeightAt(x: number, z: number): number {
  const streamX = getTabakhaneCenterX(z);
  const distToStream = Math.abs(x - streamX);
  if (distToStream < 6.2) {
    for (let i = 0; i < TABAKHANE_BRIDGE_ZS.length; i++) {
      const bz = TABAKHANE_BRIDGE_ZS[i];
      const dz = Math.abs(z - bz);
      if (dz < 6.4) {
        const zBlend = 1 - smoothstep(5.6, 6.4, dz);
        const baseBank = getBaseTerrainHeight(x, z);
        const archLift = (1 - smoothstep(0.6, 5.9, distToStream)) * 0.64;
        const deckY = baseBank + archLift;
        if (zBlend >= 0.999) return deckY;
        const groundY = getTerrainHeightAt(x, z);
        return groundY + (deckY - groundY) * zBlend;
      }
    }
  }
  return getTerrainHeightAt(x, z);
}

/**
 * Water surface height of Tabakhane Deresi at z (flows downhill from Aytepe valley toward south).
 */
export function getTabakhaneWaterY(z: number): number {
  const streamX = getTabakhaneCenterX(z);
  return getBaseTerrainHeight(streamX, z) - 0.62;
}

/**
 * Computes longitudinal pitch (radians, positive = nose up) and lateral roll for a vehicle at (x, z, heading).
 */
export function getSurfaceSlopeAngles(
  x: number,
  z: number,
  heading: number
): { pitch: number; roll: number } {
  const fx = -Math.sin(heading);
  const fz = -Math.cos(heading);
  const rx = Math.cos(heading);
  const rz = -Math.sin(heading);

  const sample = 1.25;
  const hFront = getSurfaceHeightAt(x + fx * sample, z + fz * sample);
  const hBack = getSurfaceHeightAt(x - fx * sample, z - fz * sample);
  const hRight = getSurfaceHeightAt(x + rx * sample, z + rz * sample);
  const hLeft = getSurfaceHeightAt(x - rx * sample, z - rz * sample);

  const pitch = Math.atan2(hFront - hBack, sample * 2);
  const roll = Math.atan2(hLeft - hRight, sample * 2);
  return { pitch, roll };
}

/**
 * True top walkable/drivable elevation including raised asphalt/cobble roadways,
 * sidewalk curbs, Atatürk Kent Meydanı plaza stone, and landmark courtyard plinths.
 */
export function getWalkableSurfaceHeightAt(x: number, z: number): number {
  const surfaceY = getSurfaceHeightAt(x, z);
  let y = surfaceY;

  // Polyline Aydın roads & sidewalks
  const roadSample = sampleNearestRoad(x, z, 8.0);
  if (roadSample.road) {
    const halfW = roadSample.road.width * 0.5;
    if (roadSample.dist <= halfW) {
      y = Math.max(y, surfaceY + (roadSample.road.surface === 'cobble' ? 0.145 : 0.132));
    } else if (roadSample.dist <= halfW + 1.35) {
      y = Math.max(y, surfaceY + (roadSample.road.surface === 'cobble' ? 0.105 : 0.095));
    }
  }

  // Atatürk Kent Meydanı Expanded Plaza, Pool Promenade & Open Event Square (center [0, 10])
  if (Math.abs(x) <= 13.8 && z >= -17.8 && z <= 26.4) {
    const meydanBase = getTerrainHeightAt(0, 10);
    const inner = Math.abs(x) <= 13.5 && z >= -17.2 && z <= 25.8;
    y = Math.max(y, meydanBase + (inner ? 0.26 : 0.245));
  }

  // Sıcak Yuvam Front Garden Walkway connecting [-28.5, -16] to Adnan Menderes Blv. [-24.2, -16]
  if (x >= -29.0 && x <= -24.2 && Math.abs(z + 16.0) <= 1.8) {
    y = Math.max(y, getTerrainHeightAt(-32, -16) + 0.11);
  }

  // Sevgi Yolu Pedestrian Promenade Aprons (flanking cobble roadway at [-39.5, 11.5])
  if (x >= -52.5 && x <= -26.5 && Math.abs(z - 11.5) <= 6.2) {
    y = Math.max(y, getTerrainHeightAt(-39.5, 11.5) + 0.115);
  }

  // Historic & Modern Landmark Courtyards / Terraces / Platforms
  if (Math.abs(x + 58) <= 8.5 && Math.abs(z + 108) <= 4.5) {
    // Tralleis Antik Kenti
    const b = getTerrainHeightAt(-58, -108);
    y = Math.max(y, b + (Math.abs(x + 58) <= 7.6 && Math.abs(z + 108) <= 3.6 ? 1.1 : 0.6));
  } else if (Math.abs(x + 36.0) <= 6.75 && Math.abs(z + 2.5) <= 7.25) {
    // Bey Camii
    y = Math.max(y, getTerrainHeightAt(-36.0, -2.5) + 0.4);
  } else if (Math.abs(x - 38.5) <= 8.75 && Math.abs(z + 50) <= 7.75) {
    // Nasuh Paşa Külliyesi
    y = Math.max(y, getTerrainHeightAt(38.5, -50) + 0.25);
  } else if (Math.abs(x + 38.5) <= 7.0 && Math.abs(z + 50) <= 6.5) {
    // Ramazan Paşa Camii
    y = Math.max(y, getTerrainHeightAt(-38.5, -50) + 0.35);
  } else if (Math.abs(x + 76) <= 10.2 && Math.abs(z + 47) <= 9.2) {
    // Yağcılar İçi Tarihi Çarşısı
    y = Math.max(y, getTerrainHeightAt(-76, -47) + 0.26);
  } else if (Math.abs(x) <= 7.5 && Math.abs(z + 51) <= 7.5) {
    // Cihanoğlu Külliyesi
    y = Math.max(y, getTerrainHeightAt(0, -51) + 0.4);
  } else if (x >= 29.8 && x <= 49.0 && Math.abs(z - 10) <= 8.4) {
    // Aydın Büyükşehir Belediyesi (Sarı Belediye)
    y = Math.max(y, getTerrainHeightAt(39, 10) + 0.42);
  } else if (Math.abs(x - 93) <= 13.0 && Math.abs(z - 34) <= 12.0) {
    // Tekstil Park
    const b = getTerrainHeightAt(93, 34);
    let top = b + 0.18;
    if (Math.abs(x - 93) <= 12.0 && Math.abs(z - 38.5) <= 1.6) top = b + 0.23;
    if (Math.abs(x - 97.5) <= 1.6 && Math.abs(z - 36.4) <= 1.0) top = b + 0.545;
    y = Math.max(y, top);
  } else if (Math.abs(x - 142) <= 13.0 && Math.abs(z - 10) <= 12.0) {
    // Forum Aydın
    y = Math.max(y, getTerrainHeightAt(142, 10) + 0.25);
  } else if (Math.abs(x) <= 14.0 && z >= 80.5 && z <= 94.5) {
    // Tarihi Tren Garı peron & platform
    y = Math.max(y, getTerrainHeightAt(0, 85) + 0.45);
  } else if (Math.abs(x) <= 120.5 && z >= RAIL_TRACK_Z - 1.8 && z <= RAIL_TRACK_Z + 1.8) {
    // Railway track bed
    y = Math.max(y, getTerrainHeightAt(0, 85) + 0.16);
  } else if (Math.abs(x - 92) <= 10.5 && Math.abs(z + 48) <= 9.5) {
    // Orta Mahalle
    y = Math.max(y, getTerrainHeightAt(92, -48) + 0.34);
  } else if (Math.abs(x - 92) <= 14.0 && Math.abs(z + 104) <= 12.0) {
    // ADÜ Aytepe Kampüsü
    const b = getTerrainHeightAt(92, -104);
    const onWalk =
      (Math.abs(x - 91) <= 13.0 && Math.abs(z + 104) <= 1.8) ||
      (Math.abs(x - 90.5) <= 1.8 && Math.abs(z + 104) <= 10.5);
    y = Math.max(y, b + (onWalk ? 0.27 : 0.22));
  } else if (Math.abs(x + 188) <= 11.2 && Math.abs(z + 12) <= 11.2) {
    // Magnesia Antik Kenti
    y = Math.max(y, getTerrainHeightAt(-188, -12) + 0.42);
  } else if (Math.abs(x + 127) <= 14.0 && Math.abs(z - 14) <= 12.0) {
    // Nevzat Biçer Parkı
    y = Math.max(y, getTerrainHeightAt(-127, 14) + 0.18);
  } else if (Math.abs(x + 80) <= 12.0 && Math.abs(z - 52) <= 8.0) {
    // Aydın Kipa AVM
    y = Math.max(y, getTerrainHeightAt(-80, 52) + 0.22);
  }

  return y;
}

export function getWalkableSlopeAngles(
  x: number,
  z: number,
  heading: number
): { pitch: number; roll: number } {
  const fx = -Math.sin(heading);
  const fz = -Math.cos(heading);
  const rx = Math.cos(heading);
  const rz = -Math.sin(heading);

  const sample = 1.25;
  const hFront = getWalkableSurfaceHeightAt(x + fx * sample, z + fz * sample);
  const hBack = getWalkableSurfaceHeightAt(x - fx * sample, z - fz * sample);
  const hRight = getWalkableSurfaceHeightAt(x + rx * sample, z + rz * sample);
  const hLeft = getWalkableSurfaceHeightAt(x - rx * sample, z - rz * sample);

  const pitch = Math.atan2(hFront - hBack, sample * 2);
  const roll = Math.atan2(hLeft - hRight, sample * 2);
  return { pitch, roll };
}

/**
 * Converts 1:100 game surface elevation into real Aydın Efeler altitude above sea level (meters).
 * Büyük Menderes Ovası (~58 m) -> Güzelhisar / Kent Meydanı (~64 m) -> Çarşı (~84 m)
 * -> Orta Mahalle (~92 m) -> Tralleis (~150 m) -> ADÜ Aytepe (~172 m) -> Kalfaköy (~200+ m).
 */
export function getRealElevationMeters(x: number, z: number): number {
  return Math.max(54, Math.round(58 + getSurfaceHeightAt(x, z) * 10));
}
