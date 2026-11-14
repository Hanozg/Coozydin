function smoothstep(edge0: number, edge1: number, x: number): number {
  const t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}

/**
 * Tabakhane Deresi flows North-to-South right behind Tarihi Sarı Belediye Binası (x = 36 -> rear x ~ 42.5),
 * separating the central Efeler boulevard / Kent Meydanı (west) from Orta Mahalle & ADÜ foothills (east).
 * North of Gazi Bulvarı (z < -42) it meanders gently toward the Tralleis–Aytepe valley.
 */
export function getTabakhaneCenterX(z: number): number {
  const meander = Math.sin(z * 0.036 + 0.4) * 0.85;
  const northBend = smoothstep(-46, -125, z) * -14.0;
  return 48.6 + meander + northBend;
}

export function getTabakhaneHalfWidth(): number {
  return 2.6;
}

/**
 * Base hillside elevation without the carved Tabakhane streambed.
 * - Flat Menderes plain in central & southern Efeler (z >= -24).
 * - Steady northern climb toward Orta Mahalle & Tralleis (z < -24).
 * - Prominent Aytepe University hill in the north-east (ADÜ Kampüsü at [78, -78]).
 * - Subtle natural rolling undulations in open hills & countryside.
 */
export function getBaseTerrainHeight(x: number, z: number): number {
  // 1. General northern foothill climb (Tralleis / Kalfaköy / Orta Mahalle ridge)
  const northSlope = smoothstep(-22, -112, z) * 5.2;

  // 2. Prominent Aytepe University hill (ADÜ Kampüsü sits high on the east-north plateau)
  const eastFactor = smoothstep(26, 74, x);
  const aytepeZFactor = smoothstep(-26, -78, z);
  const aytepeHill = eastFactor * aytepeZFactor * 4.4;

  // Gentle Orta Mahalle lower foothill terrace (east of Tabakhane Deresi, z in [-56, -24])
  const ortaFoothill = smoothstep(50, 68, x) * smoothstep(-20, -44, z) * (1 - smoothstep(-60, -82, z)) * 1.05;

  // 3. Soft organic rolling hilliness outside main flat boulevards ("engebeli doku")
  const flatCoreBlend =
    smoothstep(-18, -56, z) * 0.42 +
    smoothstep(86, 128, Math.abs(x)) * 0.85 +
    smoothstep(-96, -135, z) * 0.8;
  const rolling =
    (Math.sin(x * 0.052 + 0.35) * Math.cos(z * 0.048 - 0.2) +
      0.45 * Math.sin((x - z) * 0.085)) *
    0.48 *
    Math.min(1, flatCoreBlend);

  // Keep Southern Railway track corridor (z in [72, 83], x in [-90, 90]) level for smooth train travel
  const railMask =
    1 -
    smoothstep(85, 70, Math.abs(z - 77.1) * 8) *
      (1 - smoothstep(82, 102, Math.abs(x)));
  const safeRolling = rolling * Math.max(0.05, Math.min(1, railMask));

  // Level ADÜ main campus quad terrace subtly so buildings sit cleanly on the hilltop plateau
  const campusDist = Math.hypot((x - 78) / 17, (z + 78) / 14);
  const campusPlateauFactor = 1 - smoothstep(0.65, 1.35, campusDist);
  const rawHeight = northSlope + aytepeHill + ortaFoothill + safeRolling;
  const campusTargetHeight = 8.4;

  return rawHeight * (1 - campusPlateauFactor * 0.55) + campusTargetHeight * (campusPlateauFactor * 0.55);
}

/**
 * Full terrain height including the carved Tabakhane Deresi channel.
 */
export function getTerrainHeightAt(x: number, z: number): number {
  const base = getBaseTerrainHeight(x, z);
  const streamX = getTabakhaneCenterX(z);
  const distToStream = Math.abs(x - streamX);
  if (distToStream < 4.2) {
    const carve = (1 - smoothstep(2.0, 4.2, distToStream)) * 1.32;
    return base - carve;
  }
  return base;
}

/**
 * Drivable surface height: identical to terrain height except over Tabakhane Deresi road bridges
 * where roads arch gently over the flowing stream.
 */
const BRIDGE_Z_COORDS = [-96, -58, -22, 12, 48];

export function getSurfaceHeightAt(x: number, z: number): number {
  const streamX = getTabakhaneCenterX(z);
  const distToStream = Math.abs(x - streamX);
  if (distToStream < 5.2) {
    for (let i = 0; i < BRIDGE_Z_COORDS.length; i++) {
      const bz = BRIDGE_Z_COORDS[i];
      if (Math.abs(z - bz) < 5.0) {
        const baseBank = getBaseTerrainHeight(x, z);
        const archLift = (1 - smoothstep(0.4, 5.0, distToStream)) * 0.68;
        return baseBank + archLift;
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
  return getBaseTerrainHeight(streamX, z) - 0.58;
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

const ROAD_X_SURFACE = [-54, -18, 18, 58];
const ROAD_Z_SURFACE = [-96, -58, -22, 12, 48];

/**
 * True top walkable/drivable elevation including raised asphalt/cobble roadways,
 * sidewalk curbs, Atatürk Kent Meydanı plaza stone, and landmark courtyard plinths.
 * Geometry builders keep using getSurfaceHeightAt() to avoid double-adding offsets.
 */
export function getWalkableSurfaceHeightAt(x: number, z: number): number {
  const surfaceY = getSurfaceHeightAt(x, z);
  let y = surfaceY;

  // East-West avenues & curbs (z in [-110..72], x in [-97..105])
  if (x >= -97 && x <= 105 && z >= -111 && z <= 73) {
    for (let i = 0; i < ROAD_Z_SURFACE.length; i++) {
      const dz = Math.abs(z - ROAD_Z_SURFACE[i]);
      if (dz <= 4.2 && x >= -96 && x <= 104) {
        y = Math.max(y, surfaceY + 0.13);
      } else if (dz <= 5.5) {
        y = Math.max(y, surfaceY + 0.09);
      }
    }
    // North-South boulevards & curbs (render above E-W ribbons cleanly)
    for (let i = 0; i < ROAD_X_SURFACE.length; i++) {
      const dx = Math.abs(x - ROAD_X_SURFACE[i]);
      if (dx <= 4.2 && z >= -110 && z <= 72) {
        y = Math.max(y, surfaceY + 0.148);
      } else if (dx <= 5.5) {
        y = Math.max(y, surfaceY + 0.105);
      }
    }
  }

  // Western Magnesia Highway Extension along z = -22 (x in [-149..-96]) + Sanctuary Turnoff
  if (x >= -149 && x <= -95 && Math.abs(z + 22) <= 5.5) {
    y = Math.max(y, surfaceY + (Math.abs(z + 22) <= 4.2 && x >= -148 ? 0.13 : 0.09));
  }
  if (Math.abs(x + 132) <= 5.2 && z >= -29.5 && z <= -22) {
    y = Math.max(y, surfaceY + (Math.abs(x + 132) <= 4.0 ? 0.148 : 0.105));
  }

  // Atatürk Kent Meydanı Expanded Plaza, Pool Promenade & Open Event Square
  if (Math.abs(x) <= 13.4 && z >= -15.8 && z <= 28.4) {
    const meydanBase = getTerrainHeightAt(0, 12);
    const inner = Math.abs(x) <= 12.8 && z >= -15.2 && z <= 27.8;
    y = Math.max(y, meydanBase + (inner ? 0.26 : 0.245));
  }

  // Historic & Modern Landmark Courtyards / Terraces / Platforms
  if (Math.abs(x) <= 8.5 && Math.abs(z + 76) <= 4.5) {
    const b = getTerrainHeightAt(0, -76);
    y = Math.max(y, b + (Math.abs(x) <= 7.6 && Math.abs(z + 76) <= 3.6 ? 1.1 : 0.6));
  } else if (Math.abs(x - 36) <= 6.75 && Math.abs(z + 36) <= 7.25) {
    y = Math.max(y, getTerrainHeightAt(36, -36) + 0.4);
  } else if (Math.abs(x - 36) <= 8.75 && Math.abs(z + 5) <= 7.75) {
    y = Math.max(y, getTerrainHeightAt(36, -5) + 0.25);
  } else if (Math.abs(x + 36) <= 7.0 && Math.abs(z + 36) <= 6.5) {
    y = Math.max(y, getTerrainHeightAt(-36, -36) + 0.35);
  } else if (Math.abs(x + 72) <= 7.5 && Math.abs(z + 6) <= 7.5) {
    y = Math.max(y, getTerrainHeightAt(-72, -6) + 0.4);
  } else if (x >= 26.8 && x <= 46.0 && Math.abs(z - 28) <= 8.4) {
    y = Math.max(y, getTerrainHeightAt(36, 28) + 0.42);
  } else if (Math.abs(x + 74) <= 13.0 && Math.abs(z - 30) <= 12.0) {
    const b = getTerrainHeightAt(-74, 30);
    let top = b + 0.18;
    if (Math.abs(x + 74) <= 12.0 && Math.abs(z - 34.5) <= 1.6) top = b + 0.23;
    if (Math.abs(x + 69.5) <= 1.6 && Math.abs(z - 32.4) <= 1.0) top = b + 0.545;
    y = Math.max(y, top);
  } else if (Math.abs(x - 80) <= 13.0 && Math.abs(z - 30) <= 12.0) {
    y = Math.max(y, getTerrainHeightAt(80, 30) + 0.25);
  } else if (Math.abs(x) <= 14.0 && z >= 61.5 && z <= 75.5) {
    y = Math.max(y, getTerrainHeightAt(0, 66) + 0.45);
  } else if (Math.abs(x) <= 82.5 && z >= 75.3 && z <= 78.9) {
    y = Math.max(y, getTerrainHeightAt(0, 66) + 0.16);
  } else if (Math.abs(x - 76) <= 10.5 && Math.abs(z + 40) <= 9.5) {
    y = Math.max(y, getTerrainHeightAt(76, -40) + 0.34);
  } else if (Math.abs(x - 78) <= 14.0 && Math.abs(z + 78) <= 12.0) {
    const b = getTerrainHeightAt(78, -78);
    const onWalk =
      (Math.abs(x - 77) <= 13.0 && Math.abs(z + 78) <= 1.8) ||
      (Math.abs(x - 76.5) <= 1.8 && Math.abs(z + 78) <= 10.5);
    y = Math.max(y, b + (onWalk ? 0.27 : 0.22));
  } else if (Math.abs(x + 132) <= 11.2 && Math.abs(z + 40) <= 11.2) {
    y = Math.max(y, getTerrainHeightAt(-132, -40) + 0.42);
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
