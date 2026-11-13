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
