import * as THREE from 'three';
import { ANCIENT_CITY_MAP, getExhibitsForCity } from '../../data/ancientMuseumData';
import { AncientCityId, MuseumExhibitDef, MuseumSurfaceType } from '../../types/game';
import {
  buildAlindaAlabandaStructures,
  buildAphrodisiasStructures,
  buildMagnesiaStructures,
  buildMiletDidymaStructures,
  buildNysaStructures,
  buildPrieneStructures,
  CityBuildContext,
} from './cityStructures';
import { MuseumPbrMaterials } from './pbrTextures';

export interface MuseumBoxCollider {
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
  minY: number;
  maxY: number;
}

export interface MuseumCylinderCollider {
  x: number;
  z: number;
  radius: number;
  minY: number;
  maxY: number;
}

export interface MuseumSurfaceSample {
  height: number;
  surfaceType: MuseumSurfaceType;
  cryptFactor: number; // 0 = bright open air, 1 = deep inside vaulted crypt
  zoneName: string;
}

export interface MuseumPlinthHandle {
  exhibit: MuseumExhibitDef;
  group: THREE.Group;
  haloMesh: THREE.Mesh;
  frameMat: THREE.MeshStandardMaterial;
}

export interface BuiltAncientCity {
  root: THREE.Group;
  boxColliders: MuseumBoxCollider[];
  cylinderColliders: MuseumCylinderCollider[];
  cameraCollisionMeshes: THREE.Object3D[];
  plinths: MuseumPlinthHandle[];
  updateAtmosphere: (
    elapsed: number,
    dt: number,
    playerPos: THREE.Vector3,
    nearbyExhibitId: string | null,
    discoveredIds: ReadonlySet<string>
  ) => void;
  dispose: () => void;
}

const THEATER_CX = 0;
const THEATER_CZ = -24;
const THEATER_ORCHESTRA_R = 9.0;
const THEATER_TIER_COUNT = 9;
const THEATER_TIER_DEPTH = 1.4;
const THEATER_TIER_RISE = 0.56;

/**
 * Computes exact walkable floor height, ground surface material, indoor crypt enclosure factor,
 * and active archaeological zone name at any (x, z) coordinate in the selected Aydın ancient city.
 */
export function sampleMuseumSurface(
  x: number,
  z: number,
  cityId: AncientCityId = 'tralleis'
): MuseumSurfaceSample {
  const city = ANCIENT_CITY_MAP.get(cityId);
  const cryptZone = city?.cryptZoneName ?? 'Tonozlu Yeraltı Mahzeni (Cryptoporticus)';
  const northZone = city?.northZoneName ?? 'Antik Tiyatro Basamakları (Cavea)';
  const westZone = city?.westZoneName ?? 'Sütunlu Agora & Stoa';
  const eastZone = city?.eastZoneName ?? 'Roma Mozaik Avlusu';
  const plazaZone = city?.plazaZoneName ?? 'Üç Gözler Anıtsal Meydanı';
  const defaultZone = city?.defaultZoneName ?? 'Tralleis Antik Kenti';

  // 1. Vaulted Underground Crypt / Oracle Tunnel / Cistern & descending stone staircase
  if (x >= -18.5 && x <= -9.5 && z >= 13.6 && z <= 36.4) {
    if (z <= 22.0) {
      const t = Math.max(0, Math.min(1, (z - 14.0) / 8.0));
      const height = -t * 3.6;
      const cryptFactor = Math.max(0, Math.min(1, (z - 17.5) / 5.2));
      return {
        height,
        surfaceType: cryptFactor > 0.35 ? 'crypt_stone' : 'stone',
        cryptFactor,
        zoneName: cryptFactor > 0.35 ? cryptZone : 'Yeraltı Geçit Basamakları',
      };
    }
    const cryptFactor = Math.max(0.78, Math.min(1.0, 0.78 + (z - 22.0) * 0.1));
    return {
      height: -3.6,
      surfaceType: 'crypt_stone',
      cryptFactor,
      zoneName: cryptZone,
    };
  }

  // 2. Ancient Amphitheater / Stadium / Hillside Theater (Cavea) semicircular marble steps
  if (z <= THEATER_CZ + 1.5) {
    const dx = x - THEATER_CX;
    const dz = z - THEATER_CZ;
    const dist = Math.sqrt(dx * dx + dz * dz);
    if (dz <= 0.5 && dist <= THEATER_ORCHESTRA_R) {
      return {
        height: 0.08,
        surfaceType: 'marble',
        cryptFactor: 0,
        zoneName: northZone,
      };
    }
    const maxCaveaR = THEATER_ORCHESTRA_R + THEATER_TIER_COUNT * THEATER_TIER_DEPTH;
    if (dz <= 0 && dist > THEATER_ORCHESTRA_R && dist <= maxCaveaR + 1.4) {
      const radialOffset = dist - THEATER_ORCHESTRA_R;
      const tierFloat = radialOffset / THEATER_TIER_DEPTH;
      const tierIdx = Math.min(THEATER_TIER_COUNT, Math.floor(tierFloat) + 1);
      const frac = tierFloat - Math.floor(tierFloat);
      const prevH = 0.08 + Math.max(0, tierIdx - 1) * THEATER_TIER_RISE;
      const nextH = 0.08 + tierIdx * THEATER_TIER_RISE;
      const height =
        tierIdx > THEATER_TIER_COUNT
          ? 0.08 + THEATER_TIER_COUNT * THEATER_TIER_RISE
          : frac < 0.18
            ? prevH + (nextH - prevH) * (frac / 0.18)
            : nextH;
      return {
        height,
        surfaceType: 'marble',
        cryptFactor: 0,
        zoneName: northZone,
      };
    }
  }

  // 3. West Archaeological Sanctuary / Agora / Council raised marble stylobate
  if (x >= -34.5 && x <= -13.5 && z >= -14.5 && z <= 10.5) {
    const edgeX = Math.min(x - -34.5, -13.5 - x);
    const edgeZ = Math.min(z - -14.5, 10.5 - z);
    const edge = Math.min(edgeX, edgeZ);
    const height = edge < 0.7 ? 0.22 : 0.45;
    return {
      height,
      surfaceType: 'marble',
      cryptFactor: 0,
      zoneName: westZone,
    };
  }

  // 4. East Roman Mosaic Courtyard / Bath / Aqueduct / Harbor Gate
  if (x >= 13.5 && x <= 34.5 && z >= -13.2 && z <= 10.2) {
    const onMosaicCarpet = x >= 16.0 && x <= 28.0 && z >= -9.5 && z <= 0.5;
    return {
      height: 0.15,
      surfaceType: onMosaicCarpet ? 'mosaic' : 'marble',
      cryptFactor: 0,
      zoneName: eastZone,
    };
  }

  // 5. Centerpiece Elevated Temple Krepidoma / Library / Tetrapylon / Agora Floor
  if (cityId === 'magnesia' && Math.abs(x) <= 8.7 && Math.abs(z) <= 7.7) {
    const edge = Math.min(8.7 - Math.abs(x), 7.7 - Math.abs(z));
    const height = edge < 0.6 ? 0.18 : edge < 1.2 ? 0.34 : 0.5;
    return { height, surfaceType: 'marble', cryptFactor: 0, zoneName: plazaZone };
  }
  if (cityId === 'priene' && Math.abs(x) <= 8.0 && Math.abs(z) <= 7.0) {
    const edge = Math.min(8.0 - Math.abs(x), 7.0 - Math.abs(z));
    const height = edge < 0.6 ? 0.2 : edge < 1.2 ? 0.4 : 0.56;
    return { height, surfaceType: 'marble', cryptFactor: 0, zoneName: plazaZone };
  }
  if (cityId === 'milet_didyma' && Math.abs(x) <= 9.2 && Math.abs(z) <= 8.2) {
    const edge = Math.min(9.2 - Math.abs(x), 8.2 - Math.abs(z));
    const height = edge < 0.7 ? 0.22 : 0.44;
    return { height, surfaceType: 'marble', cryptFactor: 0, zoneName: plazaZone };
  }
  if (cityId === 'nysa' && Math.abs(x) <= 8.0 && Math.abs(z) <= 5.9) {
    return { height: 0.24, surfaceType: 'marble', cryptFactor: 0, zoneName: plazaZone };
  }
  if (cityId === 'aphrodisias' && Math.abs(x) <= 7.4 && Math.abs(z) <= 5.7) {
    return { height: 0.24, surfaceType: 'marble', cryptFactor: 0, zoneName: plazaZone };
  }
  if (cityId === 'alinda_alabanda' && Math.abs(x) <= 11.5 && Math.abs(z) <= 4.7) {
    return { height: 0.24, surfaceType: 'stone', cryptFactor: 0, zoneName: plazaZone };
  }

  // 6. Central Monumental Plaza & Stone Processional Way
  if (Math.abs(x) <= 13.5 && z >= -24 && z <= 27) {
    return {
      height: 0,
      surfaceType: 'stone',
      cryptFactor: 0,
      zoneName: Math.abs(z) <= 9.5 ? plazaZone : `${city?.shortName ?? 'Antik'} Tören Yolu`,
    };
  }

  // 7. Outer Anatolian dirt & stone sanctuary trails
  return {
    height: 0,
    surfaceType: 'dirt',
    cryptFactor: 0,
    zoneName: defaultZone,
  };
}

/**
 * Resolves 2D/3D player movement against all solid architectural colliders and map boundaries,
 * while permitting passage under arches, up theater stairs, and down into the vaulted crypt.
 */
export function resolveMuseumPlayerCollision(
  x: number,
  z: number,
  y: number,
  playerRadius: number,
  boxes: MuseumBoxCollider[],
  cylinders: MuseumCylinderCollider[]
): { x: number; z: number } {
  let px = Math.max(-44, Math.min(44, x));
  let pz = Math.max(-47, Math.min(39, z));

  const playerTop = y + 1.65;
  const playerBottom = y + 0.35; // Allows stepping smoothly onto steps <= 0.35m

  // Theater outer semicircular retaining wall clamp
  if (pz < THEATER_CZ) {
    const dx = px - THEATER_CX;
    const dz = pz - THEATER_CZ;
    const dist = Math.sqrt(dx * dx + dz * dz);
    const maxR = THEATER_ORCHESTRA_R + THEATER_TIER_COUNT * THEATER_TIER_DEPTH + 1.1;
    if (dist > maxR - playerRadius && dist < maxR + 2.4) {
      const inv = (maxR - playerRadius) / Math.max(0.001, dist);
      px = THEATER_CX + dx * inv;
      pz = THEATER_CZ + dz * inv;
    }
  }

  // Resolve box colliders (2 iterations for clean corners)
  for (let pass = 0; pass < 2; pass++) {
    for (let i = 0; i < boxes.length; i++) {
      const b = boxes[i];
      if (playerTop <= b.minY || playerBottom >= b.maxY) continue;
      const closestX = Math.max(b.minX, Math.min(px, b.maxX));
      const closestZ = Math.max(b.minZ, Math.min(pz, b.maxZ));
      const dx = px - closestX;
      const dz = pz - closestZ;
      const dSq = dx * dx + dz * dz;
      if (dSq < playerRadius * playerRadius) {
        if (dSq > 1e-6) {
          const d = Math.sqrt(dSq);
          const push = playerRadius - d;
          px += (dx / d) * push;
          pz += (dz / d) * push;
        } else {
          // Inside box fallback: push out along nearest face
          const penL = Math.abs(px - b.minX);
          const penR = Math.abs(b.maxX - px);
          const penN = Math.abs(pz - b.minZ);
          const penS = Math.abs(b.maxZ - pz);
          const m = Math.min(penL, penR, penN, penS);
          if (m === penL) px = b.minX - playerRadius;
          else if (m === penR) px = b.maxX + playerRadius;
          else if (m === penN) pz = b.minZ - playerRadius;
          else pz = b.maxZ + playerRadius;
        }
      }
    }

    // Resolve cylinder colliders (fluted columns, stele, pedestals)
    for (let i = 0; i < cylinders.length; i++) {
      const c = cylinders[i];
      if (playerTop <= c.minY || playerBottom >= c.maxY) continue;
      const dx = px - c.x;
      const dz = pz - c.z;
      const minDist = c.radius + playerRadius;
      const dSq = dx * dx + dz * dz;
      if (dSq < minDist * minDist && dSq > 1e-6) {
        const d = Math.sqrt(dSq);
        const push = minDist - d;
        px += (dx / d) * push;
        pz += (dz / d) * push;
      }
    }
  }

  return { x: px, z: pz };
}

/**
 * Custom GLSL volumetric light shaft shader for Golden Hour God Rays streaming through Üç Gözler
 * and the Agora colonnade. Uses Fresnel-like view-angle attenuation and soft dust shimmer.
 */
function createGodRayMaterial(colorHex: number): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uColor: { value: new THREE.Color(colorHex) },
      uOpacity: { value: 0.24 },
    },
    vertexShader: `
      varying vec2 vUv;
      varying vec3 vNormalView;
      varying vec3 vViewPos;
      void main() {
        vUv = uv;
        vNormalView = normalize(normalMatrix * normal);
        vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
        vViewPos = -mvPosition.xyz;
        gl_Position = projectionMatrix * mvPosition;
      }
    `,
    fragmentShader: `
      uniform float uTime;
      uniform vec3 uColor;
      uniform float uOpacity;
      varying vec2 vUv;
      varying vec3 vNormalView;
      varying vec3 vViewPos;
      void main() {
        vec3 viewDir = normalize(vViewPos);
        float edgeFade = pow(abs(dot(normalize(vNormalView), viewDir)), 1.35);
        float verticalFade = smoothstep(0.0, 0.28, vUv.y) * smoothstep(1.0, 0.14, vUv.y);
        float horizSoft = smoothstep(0.0, 0.22, vUv.x) * smoothstep(1.0, 0.78, vUv.x);
        float shimmer = 0.86 + 0.14 * sin(vUv.y * 12.0 - uTime * 0.65 + vUv.x * 5.0);
        float alpha = edgeFade * verticalFade * horizSoft * shimmer * uOpacity;
        gl_FragColor = vec4(uColor, alpha);
      }
    `,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    side: THREE.DoubleSide,
  });
}

function createExhibitPlaqueTexture(
  exhibit: MuseumExhibitDef,
  cityUpperName: string
): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 320;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.fillStyle = 'rgba(20, 17, 14, 0.82)';
    ctx.fillRect(0, 0, 512, 320);

    // Subtle amber-gold editorial border
    ctx.strokeStyle = 'rgba(229, 179, 98, 0.72)';
    ctx.lineWidth = 4;
    ctx.strokeRect(12, 12, 488, 296);

    ctx.fillStyle = '#E5B362';
    ctx.font = '600 20px system-ui, sans-serif';
    ctx.fillText(`${exhibit.catalogCode}  ·  ${cityUpperName} AÇIK HAVA MÜZESİ`, 34, 62);

    ctx.fillStyle = '#F7F0E4';
    ctx.font = '700 32px Georgia, serif';
    const titleWords = exhibit.title.split(' ');
    let line1 = '';
    let line2 = '';
    for (const w of titleWords) {
      if ((line1 + ' ' + w).trim().length <= 24) {
        line1 = (line1 + ' ' + w).trim();
      } else {
        line2 = (line2 + ' ' + w).trim();
      }
    }
    ctx.fillText(line1, 34, 124);
    if (line2) ctx.fillText(line2, 34, 166);

    ctx.fillStyle = 'rgba(229, 179, 98, 0.45)';
    ctx.fillRect(34, 188, 444, 2);

    ctx.fillStyle = '#D5C7B2';
    ctx.font = '500 20px system-ui, sans-serif';
    ctx.fillText(exhibit.period, 34, 226);

    ctx.fillStyle = '#F0C87A';
    ctx.font = '600 20px system-ui, sans-serif';
    ctx.fillText('[E] Yaklaş ve Hikayeyi İncele', 34, 274);
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  return tex;
}

/**
 * Builds the complete 1:1 photorealistic Aydın Ancient City & Open-Air Museum 3D environment
 * for any of the 7 Aydın ancient cities.
 */
export function buildAncientCity(
  cityId: AncientCityId,
  mats: MuseumPbrMaterials,
  isSoftwareGl: boolean
): BuiltAncientCity {
  const cityDef = ANCIENT_CITY_MAP.get(cityId) ?? ANCIENT_CITY_MAP.get('tralleis')!;
  const cityExhibits = getExhibitsForCity(cityId);
  const root = new THREE.Group();
  const boxColliders: MuseumBoxCollider[] = [];
  const cylinderColliders: MuseumCylinderCollider[] = [];
  const cameraCollisionMeshes: THREE.Object3D[] = [];
  const ownedGeos: THREE.BufferGeometry[] = [];
  const ownedMats: THREE.Material[] = [];
  const ownedTex: THREE.Texture[] = [];
  const plinths: MuseumPlinthHandle[] = [];

  const trackGeo = <T extends THREE.BufferGeometry>(g: T): T => {
    ownedGeos.push(g);
    return g;
  };
  const trackMat = <T extends THREE.Material>(m: T): T => {
    ownedMats.push(m);
    return m;
  };

  const addSolidBox = (
    w: number,
    h: number,
    d: number,
    x: number,
    y: number,
    z: number,
    mat: THREE.Material,
    collide = true,
    camCollide = true
  ): THREE.Mesh => {
    const geo = trackGeo(new THREE.BoxGeometry(w, h, d));
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(x, y, z);
    mesh.castShadow = !isSoftwareGl;
    mesh.receiveShadow = true;
    root.add(mesh);
    if (collide) {
      boxColliders.push({
        minX: x - w * 0.5,
        maxX: x + w * 0.5,
        minZ: z - d * 0.5,
        maxZ: z + d * 0.5,
        minY: y - h * 0.5,
        maxY: y + h * 0.5,
      });
    }
    if (camCollide) {
      cameraCollisionMeshes.push(mesh);
    }
    return mesh;
  };

  // ============================================================================
  // 1. GROUND TERRAIN, PAVING, DIRT SANCTUARY & DISTANT AYDIN RIDGES
  // ============================================================================
  // Outer sun-baked Anatolian soil plane (with cutout avoided by placing crypt stair opening cleanly below)
  // Build ground out of 4 clean panels around the crypt pit (x: -18.5..-9.5, z: 14.0..36.0)
  // so there is ZERO z-fighting and a real physical downward shaft into the underground crypt!
  const addGroundSlab = (
    minX: number,
    maxX: number,
    minZ: number,
    maxZ: number,
    y: number,
    mat: THREE.Material
  ) => {
    const w = maxX - minX;
    const d = maxZ - minZ;
    const geo = trackGeo(new THREE.PlaneGeometry(w, d));
    geo.rotateX(-Math.PI / 2);
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set((minX + maxX) * 0.5, y, (minZ + maxZ) * 0.5);
    mesh.receiveShadow = true;
    root.add(mesh);
  };

  // Outer dirt terrain panels leaving an open stairwell shaft at x: [-18.5, -9.5], z: [14.0, 22.0]
  addGroundSlab(-110, 110, -110, 14.0, -0.04, mats.dirtPath); // Everything north of crypt stairs
  addGroundSlab(-110, -18.5, 14.0, 110, -0.04, mats.dirtPath); // West of crypt
  addGroundSlab(-9.5, 110, 14.0, 110, -0.04, mats.dirtPath); // East of crypt
  addGroundSlab(-18.5, -9.5, 36.0, 110, -0.04, mats.dirtPath); // South of crypt

  // Central Monumental Roman Flagstone Plaza (Üç Gözler & Processional Way)
  addGroundSlab(-13.5, 13.5, -24.0, 27.0, 0.0, mats.stonePaving);

  // Connecting stone paths to West Agora & East Mosaic Courtyard
  addGroundSlab(-16.0, -13.5, -6.0, 6.0, 0.01, mats.stonePaving);
  addGroundSlab(13.5, 16.0, -6.0, 6.0, 0.01, mats.stonePaving);
  // Path leading to crypt entrance stairs
  addGroundSlab(-17.5, -9.5, 6.0, 14.0, 0.01, mats.stonePaving);

  // Distant Aydın / Mesogis mountain ridges encircling the horizon
  const ridgeMat = trackMat(
    new THREE.MeshStandardMaterial({
      color: 0x8b765f,
      roughness: 0.96,
      metalness: 0.0,
    })
  );
  for (let i = 0; i < 16; i++) {
    const angle = (i / 16) * Math.PI * 2;
    const dist = 86 + (i % 3) * 14;
    const radius = 24 + (i % 4) * 9;
    const height = 14 + ((i * 7) % 16);
    const hillGeo = trackGeo(new THREE.ConeGeometry(radius, height, 7));
    const hill = new THREE.Mesh(hillGeo, ridgeMat);
    hill.position.set(Math.cos(angle) * dist, height * 0.42 - 1, Math.sin(angle) * dist);
    hill.scale.set(1.5, 1, 1.15);
    root.add(hill);
  }

  // Shared architectural primitive helpers available to all 7 Aydın ancient cities
  const buildFlutedColumn = (
    cx: number,
    baseY: number,
    cz: number,
    height: number,
    broken = false,
    radiusScale = 1.0,
    spiral = false
  ) => {
    const g = new THREE.Group();
    g.position.set(cx, baseY, cz);

    const plinth = new THREE.Mesh(
      trackGeo(new THREE.BoxGeometry(1.18 * radiusScale, 0.26, 1.18 * radiusScale)),
      mats.crackedMarble
    );
    plinth.position.y = 0.13;
    plinth.receiveShadow = true;
    plinth.castShadow = !isSoftwareGl;
    g.add(plinth);

    // Classical Attic column base (double torus + scotia) via LatheGeometry
    const baseProfile = [
      new THREE.Vector2(0.56 * radiusScale, 0.0),
      new THREE.Vector2(0.58 * radiusScale, 0.045),
      new THREE.Vector2(0.52 * radiusScale, 0.095),
      new THREE.Vector2(0.46 * radiusScale, 0.145),
      new THREE.Vector2(0.51 * radiusScale, 0.195),
      new THREE.Vector2(0.46 * radiusScale, 0.24),
    ];
    const baseGeo = trackGeo(new THREE.LatheGeometry(baseProfile, 24));
    baseGeo.computeVertexNormals();
    const torus = new THREE.Mesh(baseGeo, mats.crackedMarble);
    torus.position.y = 0.26;
    torus.castShadow = !isSoftwareGl;
    torus.receiveShadow = true;
    g.add(torus);

    const shaftH = Math.max(1.2, height - 0.9);
    const shaftGeo = trackGeo(
      new THREE.CylinderGeometry(
        (broken ? 0.42 : 0.39) * radiusScale,
        0.46 * radiusScale,
        shaftH,
        24,
        spiral ? 14 : 1
      )
    );
    if (spiral) {
      // Twist vertices helically for Afrodisias Tetrapylon spiral-fluted marble shafts
      const posAttr = shaftGeo.attributes.position as THREE.BufferAttribute;
      for (let i = 0; i < posAttr.count; i++) {
        const vx = posAttr.getX(i);
        const vy = posAttr.getY(i);
        const vz = posAttr.getZ(i);
        const r = Math.hypot(vx, vz);
        if (r > 0.01) {
          const theta = Math.atan2(vz, vx);
          const wave = 1 + Math.sin(theta * 8 + vy * 2.8) * 0.045;
          posAttr.setX(i, vx * wave);
          posAttr.setZ(i, vz * wave);
        }
      }
      shaftGeo.computeVertexNormals();
    }

    const shaft = new THREE.Mesh(shaftGeo, mats.crackedMarble);
    shaft.position.y = 0.5 + shaftH * 0.5;
    shaft.castShadow = !isSoftwareGl;
    shaft.receiveShadow = true;
    g.add(shaft);
    cameraCollisionMeshes.push(shaft);

    if (!broken) {
      // Sculpted echinus / Corinthian bell capital via LatheGeometry
      const capProfile = [
        new THREE.Vector2(0.39 * radiusScale, 0.0),
        new THREE.Vector2(0.43 * radiusScale, 0.05),
        new THREE.Vector2(0.41 * radiusScale, 0.12),
        new THREE.Vector2(0.48 * radiusScale, 0.24),
        new THREE.Vector2(0.58 * radiusScale, 0.34),
      ];
      const capGeo = trackGeo(new THREE.LatheGeometry(capProfile, 24));
      capGeo.computeVertexNormals();
      const cap = new THREE.Mesh(capGeo, mats.carvedFrieze);
      cap.position.y = 0.5 + shaftH;
      cap.castShadow = !isSoftwareGl;
      cap.receiveShadow = true;
      g.add(cap);

      const abacus = new THREE.Mesh(
        trackGeo(new THREE.BoxGeometry(1.18 * radiusScale, 0.18, 1.18 * radiusScale)),
        mats.carvedFrieze
      );
      abacus.position.y = 0.5 + shaftH + 0.42;
      abacus.castShadow = !isSoftwareGl;
      abacus.receiveShadow = true;
      g.add(abacus);
    }

    root.add(g);
    cylinderColliders.push({
      x: cx,
      z: cz,
      radius: 0.58 * radiusScale,
      minY: baseY,
      maxY: baseY + height,
    });
  };

  const addFallenDrum = (x: number, y: number, z: number, len: number, rotY: number) => {
    const drum = new THREE.Mesh(
      trackGeo(new THREE.CylinderGeometry(0.42, 0.44, len, 14)),
      mats.crackedMarble
    );
    drum.position.set(x, y + 0.42, z);
    drum.rotation.z = Math.PI * 0.5;
    drum.rotation.y = rotY;
    drum.castShadow = !isSoftwareGl;
    drum.receiveShadow = true;
    root.add(drum);
    cameraCollisionMeshes.push(drum);
    cylinderColliders.push({
      x,
      z,
      radius: Math.max(0.55, len * 0.42),
      minY: y,
      maxY: y + 0.9,
    });
  };

  const addWalkthroughArch = (
    cx: number,
    springY: number,
    cz: number,
    halfSpan: number,
    openingR: number,
    spandrelH: number,
    depth: number,
    rotY = 0,
    mat: THREE.Material = mats.travertineArch
  ) => {
    const shape = new THREE.Shape();
    shape.moveTo(-halfSpan, 0);
    shape.lineTo(-openingR, 0);
    shape.absarc(0, 0, openingR, Math.PI, 0, true);
    shape.lineTo(halfSpan, 0);
    shape.lineTo(halfSpan, spandrelH);
    shape.lineTo(-halfSpan, spandrelH);
    shape.closePath();

    const geo = trackGeo(
      new THREE.ExtrudeGeometry(shape, {
        depth,
        bevelEnabled: true,
        bevelSegments: 2,
        steps: 1,
        bevelSize: 0.07,
        bevelThickness: 0.07,
        curveSegments: 18,
      })
    );
    geo.translate(0, 0, -depth * 0.5);
    const pos = geo.attributes.position;
    const uv = geo.attributes.uv;
    for (let i = 0; i < pos.count; i++) {
      uv.setXY(i, pos.getX(i) * 0.22, pos.getY(i) * 0.22);
    }

    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(cx, springY, cz);
    mesh.rotation.y = rotY;
    mesh.castShadow = !isSoftwareGl;
    mesh.receiveShadow = true;
    root.add(mesh);
    cameraCollisionMeshes.push(mesh);
  };

  // ============================================================================
  // 2–4. CITY-SPECIFIC CENTERPIECE, WEST SANCTUARY & EAST ARCHAEOLOGICAL WING
  // ============================================================================
  let rayPlacements: [number, number, number, number][] = [
    [-7.0, 5.2, -1.8, 1.0],
    [0.0, 5.4, -1.8, 1.12],
    [7.0, 5.2, -1.8, 1.0],
    [-25.5, 4.4, -5.5, 0.82],
    [-20.5, 4.4, 1.5, 0.76],
    [22.5, 4.2, -3.5, 0.85],
  ];

  const cityCtx: CityBuildContext = {
    root,
    mats,
    isSoftwareGl,
    boxColliders,
    cylinderColliders,
    cameraCollisionMeshes,
    trackGeo,
    trackMat,
    addSolidBox,
    buildFlutedColumn,
    addFallenDrum,
    addWalkthroughArch,
  };

  if (cityId === 'tralleis') {
  // ÜÇ GÖZLER (TRALLEIS MONUMENTAL TRIPLE ARCHES) — ENTERABLE CENTERPIECE
  const pierXs = [-10.5, -3.5, 3.5, 10.5];
  const pierW = 2.4;
  const pierD = 3.4;
  const archSpringY = 6.2;

  for (let i = 0; i < pierXs.length; i++) {
    const px = pierXs[i];
    // Stepped monumental base plinth
    addSolidBox(pierW + 0.7, 0.65, pierD + 0.7, px, 0.325, 0, mats.travertine, true, true);
    // Main ashlar travertine pier shaft
    addSolidBox(pierW, archSpringY - 0.65, pierD, px, 0.65 + (archSpringY - 0.65) * 0.5, 0, mats.travertine, true, true);
    // Roman brick structural banding course (signature Tralleis opus mixtum!)
    addSolidBox(pierW + 0.12, 0.42, pierD + 0.12, px, 3.6, 0, mats.romanBrick, false, true);
    // Molded impost capital where the arch springs
    addSolidBox(pierW + 0.46, 0.48, pierD + 0.46, px, archSpringY, 0, mats.carvedFrieze, false, true);
    // Recessed sculptural niche trim on south & north pier faces
    addSolidBox(0.95, 2.2, 0.18, px, 2.2, pierD * 0.5 + 0.05, mats.crackedMarble, false, false);
    addSolidBox(0.95, 2.2, 0.18, px, 2.2, -pierD * 0.5 - 0.05, mats.crackedMarble, false, false);
  }

  // Build 3 TRUE walk-through curved arch spandrels between piers using ExtrudeGeometry!
  const archSpanCenters = [-7.0, 0.0, 7.0];
  const archHalfSpan = 3.5; // Pier center-to-center = 7.0m
  const archOpeningR = 2.3; // Clear opening width = 4.6m!
  const spandrelTopH = 4.6; // From y=6.2 up to y=10.8

  const archShape = new THREE.Shape();
  archShape.moveTo(-archHalfSpan, 0);
  archShape.lineTo(-archOpeningR, 0);
  // Semicircular opening curve from left (-R, 0) up over (0, R) to right (+R, 0)
  archShape.absarc(0, 0, archOpeningR, Math.PI, 0, true);
  archShape.lineTo(archHalfSpan, 0);
  archShape.lineTo(archHalfSpan, spandrelTopH);
  archShape.lineTo(-archHalfSpan, spandrelTopH);
  archShape.closePath();

  const archExtrudeGeo = trackGeo(
    new THREE.ExtrudeGeometry(archShape, {
      depth: pierD - 0.2,
      bevelEnabled: true,
      bevelSegments: 2,
      steps: 1,
      bevelSize: 0.08,
      bevelThickness: 0.08,
      curveSegments: 20,
    })
  );
  archExtrudeGeo.translate(0, 0, -(pierD - 0.2) * 0.5);
  // Normalize UVs for travertine scale
  const archPos = archExtrudeGeo.attributes.position;
  const archUv = archExtrudeGeo.attributes.uv;
  for (let i = 0; i < archPos.count; i++) {
    archUv.setXY(i, archPos.getX(i) * 0.22, archPos.getY(i) * 0.22);
  }

  for (const cx of archSpanCenters) {
    const archMesh = new THREE.Mesh(archExtrudeGeo, mats.travertineArch);
    archMesh.position.set(cx, archSpringY, 0);
    archMesh.castShadow = !isSoftwareGl;
    archMesh.receiveShadow = true;
    root.add(archMesh);
    cameraCollisionMeshes.push(archMesh);

    // Carved stone archivolts (keystone accents around arch rim)
    for (let k = 0; k < 11; k++) {
      const ang = (k / 10) * Math.PI;
      const vx = cx + Math.cos(ang) * (archOpeningR + 0.16);
      const vy = archSpringY + Math.sin(ang) * (archOpeningR + 0.16);
      const vGeo = trackGeo(new THREE.BoxGeometry(0.42, 0.56, pierD + 0.12));
      const vMesh = new THREE.Mesh(vGeo, k === 5 ? mats.crackedMarble : mats.romanBrick);
      vMesh.position.set(vx, vy, 0);
      vMesh.rotation.z = ang - Math.PI * 0.5;
      vMesh.castShadow = !isSoftwareGl;
      vMesh.receiveShadow = true;
      root.add(vMesh);
    }
  }

  // Upper carved relief frieze, broken Roman attic story & weathered ruin silhouette on Üç Gözler
  addSolidBox(23.8, 0.85, pierD + 0.35, 0, 11.2, 0, mats.carvedFrieze, false, true);
  // Ruined upper brickwork crest (asymmetric historic Tralleis silhouette)
  addSolidBox(8.6, 2.4, 2.4, -5.8, 12.8, 0, mats.romanBrick, false, true);
  addSolidBox(7.2, 3.1, 2.4, 0.8, 13.15, 0, mats.travertine, false, true);
  addSolidBox(5.4, 1.7, 2.3, 8.2, 12.45, 0, mats.romanBrick, false, true);
  // Upper window arch silhouette cutout accents
  addSolidBox(2.2, 0.55, 2.8, 0.8, 14.9, 0, mats.carvedFrieze, false, false);

  // ============================================================================
  // 3. COLONNADED AGORA & STOA (WEST TERRACE) + EPHEBOS STATUE
  // ============================================================================
  // Two-stepped marble stylobate platform
  addSolidBox(21.4, 0.24, 25.4, -24.0, 0.12, -2.0, mats.crackedMarble, false, true);
  addSolidBox(20.0, 0.23, 24.0, -24.0, 0.34, -2.0, mats.crackedMarble, false, true);

  // West Stoa back colonnade row (x = -31.5)
  const stoaZs = [-11.5, -7.0, -2.5, 2.0, 6.5];
  for (let i = 0; i < stoaZs.length; i++) {
    buildFlutedColumn(-31.5, 0.45, stoaZs[i], i === 4 ? 3.4 : 5.4, i === 4);
  }
  // Carved architrave + frieze spanning the intact columns
  addSolidBox(1.25, 0.88, 14.8, -31.5, 0.45 + 5.9, -4.75, mats.carvedFrieze, false, true);

  // North Agora colonnade row (z = -11.5)
  buildFlutedColumn(-26.5, 0.45, -11.5, 5.4, false);
  buildFlutedColumn(-21.5, 0.45, -11.5, 5.4, false);
  buildFlutedColumn(-16.5, 0.45, -11.5, 3.8, true);
  addSolidBox(11.4, 0.86, 1.25, -26.5, 0.45 + 5.9, -11.5, mats.carvedFrieze, false, true);

  // Front Stoa flanking columns
  buildFlutedColumn(-16.5, 0.45, 7.2, 5.4, false);
  buildFlutedColumn(-25.5, 0.45, 7.2, 2.9, true);

  // Fallen broken fluted column drums scattered naturally around the Agora edge
  addFallenDrum(-24.2, 0.45, -4.2, 1.65, 0.45);
  addFallenDrum(-14.6, 0.0, 11.4, 1.8, -0.35);
  addFallenDrum(12.2, 0.0, -14.2, 1.9, 0.72);
  addFallenDrum(-10.8, 0.0, -12.5, 1.5, -0.58);

  // Sculpted Genç Atlet (Ephebos) Marble Statue on inscribed pedestal at (-22, 0.45, 2)
  {
    const sx = -22;
    const sy = 0.45;
    const sz = 2;
    // Inscribed marble pedestal
    addSolidBox(1.5, 0.28, 1.5, sx, sy + 0.14, sz, mats.crackedMarble, true, true);
    addSolidBox(1.15, 0.92, 1.15, sx, sy + 0.74, sz, mats.inscriptionStone, true, true);
    addSolidBox(1.36, 0.18, 1.36, sx, sy + 1.28, sz, mats.carvedFrieze, false, true);

    // Classical draped Ephebos figure leaning calmly beside a sculpted marble support pillar
    const statGroup = new THREE.Group();
    statGroup.position.set(sx, sy + 1.37, sz);
    statGroup.rotation.y = 0.65;
    const addEphebosPart = (geo: THREE.BufferGeometry) => {
      const m = new THREE.Mesh(trackGeo(geo), mats.statueMarble);
      m.castShadow = !isSoftwareGl;
      m.receiveShadow = true;
      statGroup.add(m);
      return m;
    };

    // Sculpted LatheGeometry marble support column with base & molded capital
    const pillarProfile = [
      new THREE.Vector2(0.19, 0.0),
      new THREE.Vector2(0.17, 0.08),
      new THREE.Vector2(0.145, 0.16),
      new THREE.Vector2(0.13, 0.92),
      new THREE.Vector2(0.175, 1.0),
      new THREE.Vector2(0.18, 1.06),
      new THREE.Vector2(0.0, 1.06),
    ];
    const supportPillarGeo = new THREE.LatheGeometry(pillarProfile, 24);
    supportPillarGeo.computeVertexNormals();
    const supportPillar = addEphebosPart(supportPillarGeo);
    supportPillar.position.set(-0.26, 0.0, -0.05);

    // Contrapposto sculpted CapsuleGeometry legs with knee joints & feet
    const thighGeo = new THREE.CapsuleGeometry(0.082, 0.28, 8, 18);
    const shinGeo = new THREE.CapsuleGeometry(0.066, 0.28, 8, 18);
    const jointGeo = new THREE.SphereGeometry(0.072, 16, 12);

    const thighL = addEphebosPart(thighGeo);
    thighL.position.set(-0.08, 0.56, 0.02);
    const kneeL = addEphebosPart(jointGeo);
    kneeL.position.set(-0.08, 0.39, 0.03);
    const shinL = addEphebosPart(shinGeo);
    shinL.position.set(-0.08, 0.21, 0.02);

    const thighR = addEphebosPart(thighGeo);
    thighR.position.set(0.1, 0.56, 0.05);
    thighR.rotation.z = -0.1;
    const kneeR = addEphebosPart(jointGeo);
    kneeR.position.set(0.125, 0.38, 0.07);
    const shinR = addEphebosPart(shinGeo);
    shinR.position.set(0.135, 0.2, 0.05);
    shinR.rotation.z = -0.06;

    // Draped athlete cloak (chlamys) sculpted with LatheGeometry + TubeGeometry folds
    const cloakProfile = [
      new THREE.Vector2(0.22, 0.0),
      new THREE.Vector2(0.24, 0.22),
      new THREE.Vector2(0.205, 0.44),
      new THREE.Vector2(0.245, 0.68),
      new THREE.Vector2(0.21, 0.78),
    ];
    const cloakGeo = new THREE.LatheGeometry(cloakProfile, 26);
    cloakGeo.computeVertexNormals();
    const cloak = addEphebosPart(cloakGeo);
    cloak.position.set(0.0, 0.62, 0.02);
    cloak.scale.set(1.06, 1.0, 0.78);

    const drapeCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0.2, 1.24, 0.08),
      new THREE.Vector3(0.02, 1.05, 0.18),
      new THREE.Vector3(-0.22, 1.06, 0.08),
      new THREE.Vector3(-0.28, 0.72, 0.04),
    ]);
    addEphebosPart(new THREE.TubeGeometry(drapeCurve, 22, 0.058, 14, false));

    // Softened shoulders & folded meditative CapsuleGeometry arms
    const shoulders = addEphebosPart(new THREE.SphereGeometry(0.24, 22, 16));
    shoulders.position.set(0, 1.25, 0.01);
    shoulders.scale.set(1.22, 0.62, 0.76);

    const armGeo = new THREE.CapsuleGeometry(0.052, 0.26, 8, 16);
    const armL = addEphebosPart(armGeo);
    armL.position.set(-0.22, 1.12, 0.06);
    armL.rotation.set(-0.35, 0, 0.28);
    const armR = addEphebosPart(armGeo);
    armR.position.set(0.16, 1.06, 0.14);
    armR.rotation.set(-0.75, 0, -0.45);

    // Tapered LatheGeometry neck & classical curly-haired head tilted gently downward
    const neckGeo = new THREE.LatheGeometry(
      [
        new THREE.Vector2(0.082, 0.0),
        new THREE.Vector2(0.066, 0.06),
        new THREE.Vector2(0.07, 0.115),
      ],
      20
    );
    neckGeo.computeVertexNormals();
    const neck = addEphebosPart(neckGeo);
    neck.position.set(0.01, 1.32, 0.02);

    const head = addEphebosPart(new THREE.SphereGeometry(0.138, 24, 18));
    head.scale.set(0.94, 1.07, 1.0);
    head.position.set(0.02, 1.49, 0.04);
    head.rotation.x = 0.18;

    const curlCrownCurve = new THREE.CatmullRomCurve3(
      [
        new THREE.Vector3(-0.11, 1.54, 0.08),
        new THREE.Vector3(0.02, 1.59, 0.14),
        new THREE.Vector3(0.14, 1.54, 0.06),
        new THREE.Vector3(0.11, 1.5, -0.07),
        new THREE.Vector3(-0.08, 1.5, -0.07),
      ],
      true
    );
    addEphebosPart(new THREE.TubeGeometry(curlCrownCurve, 24, 0.032, 10, true));

    root.add(statGroup);
  }

  // ============================================================================
  // 4. ROMAN MOSAIC COURTYARD, SEIKILOS STELE & KARYA ALTAR (EAST SANCTUARY)
  // ============================================================================
  // Marble courtyard terrace base
  addSolidBox(21.0, 0.16, 23.4, 24.0, 0.075, -1.5, mats.crackedMarble, false, true);

  // Grand Aegean Geometric Tessera Mosaic Floor
  const mosaicGeo = trackGeo(new THREE.PlaneGeometry(12.2, 10.2));
  mosaicGeo.rotateX(-Math.PI / 2);
  const mosaicMesh = new THREE.Mesh(mosaicGeo, mats.floorMosaic);
  mosaicMesh.position.set(22.0, 0.162, -4.5);
  mosaicMesh.receiveShadow = true;
  root.add(mosaicMesh);

  // Low decorative marble curb framing the mosaic (walkable low trim, non-blocking)
  addSolidBox(12.6, 0.12, 0.36, 22.0, 0.21, -9.75, mats.travertine, false, false);
  addSolidBox(12.6, 0.12, 0.36, 22.0, 0.21, 0.75, mats.travertine, false, false);

  // East sanctuary Corinthian colonnade
  const eastColZs = [-10.8, -6.2, -1.6, 3.0, 7.6];
  for (let i = 0; i < eastColZs.length; i++) {
    buildFlutedColumn(32.0, 0.15, eastColZs[i], i === 1 || i === 4 ? 3.5 : 5.2, i === 1 || i === 4);
  }
  addSolidBox(1.18, 0.82, 5.6, 32.0, 0.15 + 5.68, 0.7, mats.carvedFrieze, false, true);

  // Seikilos Epitaph Column Stele at (22.5, 0.15, 2.5)
  {
    const kx = 22.5;
    const ky = 0.15;
    const kz = 2.5;
    addSolidBox(1.22, 0.28, 1.22, kx, ky + 0.14, kz, mats.crackedMarble, true, true);
    const steleBase = new THREE.Mesh(
      trackGeo(new THREE.CylinderGeometry(0.32, 0.42, 0.22, 20)),
      mats.crackedMarble
    );
    steleBase.position.set(kx, ky + 0.39, kz);
    root.add(steleBase);

    // Inscribed cylindrical column carrying the oldest complete song in history
    const steleShaft = new THREE.Mesh(
      trackGeo(new THREE.CylinderGeometry(0.25, 0.27, 1.32, 24)),
      mats.inscriptionStone
    );
    steleShaft.position.set(kx, ky + 1.16, kz);
    steleShaft.castShadow = !isSoftwareGl;
    steleShaft.receiveShadow = true;
    root.add(steleShaft);
    cameraCollisionMeshes.push(steleShaft);

    const steleCrown = new THREE.Mesh(
      trackGeo(new THREE.CylinderGeometry(0.34, 0.25, 0.2, 20)),
      mats.carvedFrieze
    );
    steleCrown.position.set(kx, ky + 1.9, kz);
    root.add(steleCrown);

    cylinderColliders.push({ x: kx, z: kz, radius: 0.65, minY: ky, maxY: ky + 2.2 });
  }

  // Karya & Menderes Inscribed Marble Altar at (26.8, 0.15, -9.8)
  {
    const ax = 26.8;
    const ay = 0.15;
    const az = -9.8;
    addSolidBox(1.55, 0.26, 1.35, ax, ay + 0.13, az, mats.travertine, true, true);
    addSolidBox(1.18, 1.08, 0.98, ax, ay + 0.8, az, mats.inscriptionStone, true, true);
    addSolidBox(1.42, 0.26, 1.22, ax, ay + 1.44, az, mats.carvedFrieze, false, true);
    // Corner horned acroteria
    addSolidBox(0.24, 0.26, 0.24, ax - 0.56, ay + 1.66, az - 0.46, mats.statueMarble, false, false);
    addSolidBox(0.24, 0.26, 0.24, ax + 0.56, ay + 1.66, az - 0.46, mats.statueMarble, false, false);
    addSolidBox(0.24, 0.26, 0.24, ax - 0.56, ay + 1.66, az + 0.46, mats.statueMarble, false, false);
    addSolidBox(0.24, 0.26, 0.24, ax + 0.56, ay + 1.66, az + 0.46, mats.statueMarble, false, false);
  }
  } else if (cityId === 'magnesia') {
    rayPlacements = buildMagnesiaStructures(cityCtx);
  } else if (cityId === 'nysa') {
    rayPlacements = buildNysaStructures(cityCtx);
  } else if (cityId === 'aphrodisias') {
    rayPlacements = buildAphrodisiasStructures(cityCtx);
  } else if (cityId === 'priene') {
    rayPlacements = buildPrieneStructures(cityCtx);
  } else if (cityId === 'milet_didyma') {
    rayPlacements = buildMiletDidymaStructures(cityCtx);
  } else if (cityId === 'alinda_alabanda') {
    rayPlacements = buildAlindaAlabandaStructures(cityCtx);
  }

  // ============================================================================
  // 5. ANCIENT AMPHITHEATER (CAVEA) STEPS — WALKABLE SEMICIRCULAR TIERS
  // ============================================================================
  {
    // Semicircular marble orchestra floor
    const orchGeo = trackGeo(new THREE.CylinderGeometry(THEATER_ORCHESTRA_R, THEATER_ORCHESTRA_R, 0.16, 36, 1, false, Math.PI * 0.5, Math.PI));
    const orchMesh = new THREE.Mesh(orchGeo, mats.crackedMarble);
    orchMesh.position.set(THEATER_CX, 0.0, THEATER_CZ);
    orchMesh.receiveShadow = true;
    root.add(orchMesh);

    // Low semicircular marble orchestra floor disc
    const discGeo = trackGeo(new THREE.CircleGeometry(THEATER_ORCHESTRA_R, 36, 0, Math.PI));
    discGeo.rotateX(-Math.PI / 2);
    const discMesh = new THREE.Mesh(discGeo, mats.crackedMarble);
    discMesh.position.set(THEATER_CX, 0.085, THEATER_CZ);
    discMesh.receiveShadow = true;
    root.add(discMesh);

    // 9 walkable stepped marble seating tiers (built as semicircular ring extrusions!)
    for (let t = 0; t < THEATER_TIER_COUNT; t++) {
      const innerR = THEATER_ORCHESTRA_R + t * THEATER_TIER_DEPTH;
      const outerR = innerR + THEATER_TIER_DEPTH + 0.06;
      const topY = 0.08 + (t + 1) * THEATER_TIER_RISE;
      const tierH = THEATER_TIER_RISE + 0.35;

      const ringShape = new THREE.Shape();
      // Shape in XY -> after rotateX(-PI/2), +X is +X, +Y becomes -Z (north!)
      ringShape.absarc(0, 0, outerR, 0, Math.PI, false);
      ringShape.lineTo(-innerR, 0);
      ringShape.absarc(0, 0, innerR, Math.PI, 0, true);
      ringShape.closePath();

      const ringGeo = trackGeo(
        new THREE.ExtrudeGeometry(ringShape, {
          depth: tierH,
          bevelEnabled: false,
          curveSegments: 32,
        })
      );
      ringGeo.rotateX(-Math.PI / 2);
      // Scale UVs for crisp marble slab seams
      const rPos = ringGeo.attributes.position;
      const rUv = ringGeo.attributes.uv;
      for (let k = 0; k < rPos.count; k++) {
        rUv.setXY(k, rPos.getX(k) * 0.28, rPos.getZ(k) * 0.28 + rPos.getY(k) * 0.4);
      }

      const tierMesh = new THREE.Mesh(ringGeo, t % 3 === 2 ? mats.travertine : mats.crackedMarble);
      tierMesh.position.set(THEATER_CX, topY - tierH, THEATER_CZ);
      tierMesh.castShadow = !isSoftwareGl;
      tierMesh.receiveShadow = true;
      root.add(tierMesh);
      cameraCollisionMeshes.push(tierMesh);
    }

    // Outer semicircular travertine retaining wall crowning the top tier
    const crownInnerR = THEATER_ORCHESTRA_R + THEATER_TIER_COUNT * THEATER_TIER_DEPTH;
    const crownOuterR = crownInnerR + 1.5;
    const crownShape = new THREE.Shape();
    crownShape.absarc(0, 0, crownOuterR, 0, Math.PI, false);
    crownShape.lineTo(-crownInnerR, 0);
    crownShape.absarc(0, 0, crownInnerR, Math.PI, 0, true);
    crownShape.closePath();

    const crownGeo = trackGeo(
      new THREE.ExtrudeGeometry(crownShape, {
        depth: 6.8,
        bevelEnabled: false,
        curveSegments: 32,
      })
    );
    crownGeo.rotateX(-Math.PI / 2);
    const crownMesh = new THREE.Mesh(crownGeo, mats.travertine);
    crownMesh.position.set(THEATER_CX, 0, THEATER_CZ);
    crownMesh.castShadow = !isSoftwareGl;
    crownMesh.receiveShadow = true;
    root.add(crownMesh);
    cameraCollisionMeshes.push(crownMesh);

    // Low ruined proskenion stage blocks flanking the south edge of orchestra
    addSolidBox(3.4, 1.35, 1.2, -10.5, 0.675, THEATER_CZ + 0.4, mats.travertine, true, true);
    addSolidBox(3.4, 1.35, 1.2, 10.5, 0.675, THEATER_CZ + 0.4, mats.travertine, true, true);
  }

  // ============================================================================
  // 6. ENTERABLE VAULTED UNDERGROUND CRYPT (CRYPTOPORTICUS) — AUTO-TORCH ZONE
  // ============================================================================
  {
    const cryptCenterX = -14.0;
    const stairStartZ = 14.0;
    const stairEndZ = 22.0;
    const chamberEndZ = 36.0;
    const chamberFloorY = -3.6;
    const chamberW = 8.4; // x: -18.2 to -9.8

    // 14 carved travertine descending steps from y=0 (z=14) down to y=-3.6 (z=22)
    const stepCount = 14;
    const stepDepth = (stairEndZ - stairStartZ) / stepCount;
    const stepRise = Math.abs(chamberFloorY) / stepCount;
    for (let s = 0; s < stepCount; s++) {
      const sz = stairStartZ + (s + 0.5) * stepDepth;
      const sy = -(s + 1) * stepRise;
      const stepGeo = trackGeo(new THREE.BoxGeometry(5.6, stepRise + 0.25, stepDepth + 0.08));
      const stepMesh = new THREE.Mesh(stepGeo, s > 7 ? mats.cryptFloor : mats.travertine);
      stepMesh.position.set(cryptCenterX, sy - 0.12, sz);
      stepMesh.receiveShadow = true;
      root.add(stepMesh);
    }

    // Stairway flanking stone retaining walls (prevent walking off sides into void)
    addSolidBox(1.1, 4.9, 8.6, -17.3, -1.2, 18.0, mats.travertine, true, true);
    addSolidBox(1.1, 4.9, 8.6, -10.7, -1.2, 18.0, mats.travertine, true, true);

    // Monumental lintel archway portal marking the entrance into the dark vaulted crypt
    addSolidBox(1.3, 3.1, 1.4, -17.3, 1.45, 14.3, mats.travertine, true, true);
    addSolidBox(1.3, 3.1, 1.4, -10.7, 1.45, 14.3, mats.travertine, true, true);
    addSolidBox(8.2, 0.85, 1.6, cryptCenterX, 3.15, 14.3, mats.carvedFrieze, false, true);

    // Crypt Chamber Stone Floor
    const cryptFloorGeo = trackGeo(new THREE.BoxGeometry(chamberW + 0.8, 0.4, chamberEndZ - stairEndZ + 0.8));
    const cryptFloorMesh = new THREE.Mesh(cryptFloorGeo, mats.cryptFloor);
    cryptFloorMesh.position.set(cryptCenterX, chamberFloorY - 0.2, (stairEndZ + chamberEndZ) * 0.5);
    cryptFloorMesh.receiveShadow = true;
    root.add(cryptFloorMesh);
    cameraCollisionMeshes.push(cryptFloorMesh);

    // Crypt Thick Side Walls & Back Wall (full enclosure so outside sun cannot bleed in)
    addSolidBox(0.9, 5.2, chamberEndZ - stairEndZ + 1.0, -18.5, chamberFloorY + 2.4, 29.0, mats.cryptMasonry, true, true);
    addSolidBox(0.9, 5.2, chamberEndZ - stairEndZ + 1.0, -9.5, chamberFloorY + 2.4, 29.0, mats.cryptMasonry, true, true);
    addSolidBox(chamberW + 1.4, 5.6, 1.0, cryptCenterX, chamberFloorY + 2.6, chamberEndZ + 0.4, mats.cryptMasonry, true, true);

    // Front bulkhead above the staircase entrance (blocks sky glare as you step inside!)
    addSolidBox(chamberW + 1.2, 3.2, 1.2, cryptCenterX, 0.45, stairEndZ + 0.2, mats.cryptMasonry, false, true);

    // True Barrel-Vaulted Stone Ceiling (inner cylinder + outer earthen/travertine mound cover)
    const vaultRadius = chamberW * 0.5 + 0.25;
    const vaultLen = chamberEndZ - stairEndZ + 0.8;
    const vaultGeo = trackGeo(
      new THREE.CylinderGeometry(vaultRadius, vaultRadius, vaultLen, 20, 1, true, 0, Math.PI)
    );
    vaultGeo.rotateZ(Math.PI * 0.5);
    vaultGeo.rotateY(Math.PI * 0.5);
    const vaultMat = trackMat(mats.cryptMasonry.clone());
    vaultMat.side = THREE.DoubleSide;
    const vaultMesh = new THREE.Mesh(vaultGeo, vaultMat);
    vaultMesh.position.set(cryptCenterX, chamberFloorY + 1.9, (stairEndZ + chamberEndZ) * 0.5);
    vaultMesh.receiveShadow = true;
    root.add(vaultMesh);
    cameraCollisionMeshes.push(vaultMesh);

    // Outer ancient stone terrace mound roof covering the crypt cleanly from above
    addSolidBox(chamberW + 2.2, 1.6, vaultLen + 0.6, cryptCenterX, 0.72, (stairEndZ + chamberEndZ) * 0.5, mats.travertine, true, true);

    // 4 Carved Stone Transverse Vault Ribs inside the crypt
    for (let r = 0; r < 4; r++) {
      const rz = stairEndZ + 2.2 + r * 3.4;
      const ribGeo = trackGeo(new THREE.TorusGeometry(vaultRadius - 0.18, 0.24, 10, 20, Math.PI));
      const rib = new THREE.Mesh(ribGeo, mats.travertine);
      rib.position.set(cryptCenterX, chamberFloorY + 1.9, rz);
      rib.receiveShadow = true;
      root.add(rib);
    }

    // Recessed wall niches holding authentic LatheGeometry + TubeGeometry terracotta Roman Amphorae
    const amphoraProfile = [
      new THREE.Vector2(0.04, 0.0),
      new THREE.Vector2(0.075, 0.08),
      new THREE.Vector2(0.175, 0.28),
      new THREE.Vector2(0.225, 0.48),
      new THREE.Vector2(0.195, 0.64),
      new THREE.Vector2(0.1, 0.74),
      new THREE.Vector2(0.082, 0.87),
      new THREE.Vector2(0.118, 0.92),
      new THREE.Vector2(0.105, 0.95),
      new THREE.Vector2(0.072, 0.92),
    ];
    const amphoraGeo = trackGeo(new THREE.LatheGeometry(amphoraProfile, 24));
    amphoraGeo.computeVertexNormals();
    const handleCurveL = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-0.18, 0.63, 0),
      new THREE.Vector3(-0.23, 0.76, 0),
      new THREE.Vector3(-0.18, 0.87, 0),
      new THREE.Vector3(-0.09, 0.86, 0),
    ]);
    const handleGeoL = trackGeo(new THREE.TubeGeometry(handleCurveL, 14, 0.018, 10, false));
    const handleCurveR = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0.18, 0.63, 0),
      new THREE.Vector3(0.23, 0.76, 0),
      new THREE.Vector3(0.18, 0.87, 0),
      new THREE.Vector3(0.09, 0.86, 0),
    ]);
    const handleGeoR = trackGeo(new THREE.TubeGeometry(handleCurveR, 14, 0.018, 10, false));

    const addAmphora = (ax: number, ay: number, az: number, tilt = 0) => {
      const g = new THREE.Group();
      g.position.set(ax, ay, az);
      g.rotation.z = tilt;
      const vessel = new THREE.Mesh(amphoraGeo, mats.terracotta);
      vessel.castShadow = !isSoftwareGl;
      vessel.receiveShadow = true;
      const hL = new THREE.Mesh(handleGeoL, mats.terracotta);
      hL.castShadow = !isSoftwareGl;
      hL.receiveShadow = true;
      const hR = new THREE.Mesh(handleGeoR, mats.terracotta);
      hR.castShadow = !isSoftwareGl;
      hR.receiveShadow = true;
      g.add(vessel, hL, hR);
      root.add(g);
    };

    addAmphora(-17.4, chamberFloorY, 25.5, 0.06);
    addAmphora(-17.2, chamberFloorY, 26.4, -0.04);
    addAmphora(-17.5, chamberFloorY, 31.2, 0.12);
    addAmphora(-10.6, chamberFloorY, 31.8, -0.08);
    addAmphora(-16.9, chamberFloorY, 34.4, 0.0);

    // Hidden Inscribed Tralleis Crypt Stele illuminated against the back wall
    addSolidBox(2.2, 2.1, 0.45, cryptCenterX, chamberFloorY + 1.15, chamberEndZ - 0.55, mats.inscriptionStone, true, true);
    addSolidBox(2.5, 0.28, 0.65, cryptCenterX, chamberFloorY + 2.32, chamberEndZ - 0.55, mats.carvedFrieze, false, true);
    // Faint warm oil-lamp ember glow inside the crypt back niche (gives atmospheric lure without ruining darkness)
    const cryptLureLight = new THREE.PointLight(0xff8c38, 1.8, 7.5, 2);
    cryptLureLight.position.set(cryptCenterX, chamberFloorY + 2.0, chamberEndZ - 1.5);
    root.add(cryptLureLight);
  }

  // ============================================================================
  // 7. SOUTH PROPYLON ENTRANCE GATE & MEDITERRANEAN OLIVE / CYPRESS FLORA
  // ============================================================================
  addSolidBox(1.8, 4.6, 1.8, -4.8, 2.3, 25.5, mats.travertine, true, true);
  addSolidBox(1.8, 4.6, 1.8, 4.8, 2.3, 25.5, mats.travertine, true, true);
  addSolidBox(2.2, 0.5, 2.2, -4.8, 4.85, 25.5, mats.carvedFrieze, false, true);
  addSolidBox(2.2, 0.5, 2.2, 4.8, 4.85, 25.5, mats.carvedFrieze, false, true);

  // Mediterranean Italian Cypresses & gnarled Olive trees swaying softly in the wind
  const swayingFoliage: { mesh: THREE.Object3D; baseRotZ: number; phase: number; amp: number }[] = [];
  const cypressMat = trackMat(
    new THREE.MeshStandardMaterial({ color: 0x3b4e33, roughness: 0.9, metalness: 0.0 })
  );
  const oliveLeafMat = trackMat(
    new THREE.MeshStandardMaterial({ color: 0x677a52, roughness: 0.88, metalness: 0.0 })
  );
  const trunkMat = trackMat(
    new THREE.MeshStandardMaterial({ color: 0x5c4734, roughness: 0.94, metalness: 0.0 })
  );

  const cypressCoords: [number, number, number][] = [
    [-38, 0, -18],
    [-40, 0, -4],
    [-36, 0, 14],
    [38, 0, -15],
    [40, 0, 4],
    [35, 0, 18],
    [-26, 0, -34],
    [26, 0, -34],
    [-16, 0, -46],
    [18, 0, -45],
    [14, 0, 28],
    [-25, 0, 30],
  ];
  const cypressGeo = trackGeo(new THREE.ConeGeometry(1.15, 7.6, 9));
  const trunkGeo = trackGeo(new THREE.CylinderGeometry(0.18, 0.28, 1.8, 7));

  cypressCoords.forEach(([tx, ty, tz], idx) => {
    const g = new THREE.Group();
    g.position.set(tx, ty, tz);
    const trunk = new THREE.Mesh(trunkGeo, trunkMat);
    trunk.position.y = 0.9;
    g.add(trunk);

    const crown = new THREE.Mesh(cypressGeo, cypressMat);
    const s = 0.85 + (idx % 3) * 0.22;
    crown.scale.set(s, s, s);
    crown.position.y = 1.4 + 3.6 * s;
    crown.castShadow = !isSoftwareGl;
    g.add(crown);

    root.add(g);
    swayingFoliage.push({ mesh: crown, baseRotZ: 0, phase: idx * 1.1, amp: 0.025 });
    cylinderColliders.push({ x: tx, z: tz, radius: 0.65, minY: ty, maxY: ty + 6 });
  });

  // Gnarled Aydın Olive Trees near the ruins perimeter
  const oliveCoords: [number, number, number][] = [
    [-17, 0, -21],
    [17, 0, -20],
    [-35, 0, 22],
    [32, 0, 22],
    [12, 0, 21],
  ];
  const oliveCanopyGeo = trackGeo(new THREE.DodecahedronGeometry(2.1, 1));
  oliveCoords.forEach(([ox, oy, oz], idx) => {
    const g = new THREE.Group();
    g.position.set(ox, oy, oz);
    const trunk = new THREE.Mesh(trackGeo(new THREE.CylinderGeometry(0.24, 0.42, 2.2, 8)), trunkMat);
    trunk.position.y = 1.1;
    trunk.rotation.z = 0.08 * (idx % 2 === 0 ? 1 : -1);
    g.add(trunk);

    const canopy = new THREE.Mesh(oliveCanopyGeo, oliveLeafMat);
    canopy.position.set(0, 3.0, 0);
    canopy.scale.set(1.35, 0.72, 1.2);
    canopy.castShadow = !isSoftwareGl;
    g.add(canopy);
    root.add(g);
    swayingFoliage.push({ mesh: canopy, baseRotZ: 0, phase: idx * 1.7 + 0.4, amp: 0.018 });
    cylinderColliders.push({ x: ox, z: oz, radius: 0.6, minY: oy, maxY: oy + 3.5 });
  });

  // Dry golden Mediterranean grass tufts around stone seams (wind-swaying InstancedMesh)
  const tuftGeo = trackGeo(new THREE.ConeGeometry(0.18, 0.55, 5));
  tuftGeo.translate(0, 0.27, 0);
  const tuftMat = trackMat(
    new THREE.MeshStandardMaterial({ color: 0x9b8b55, roughness: 0.92, metalness: 0.0 })
  );
  const tuftPositions: [number, number, number][] = [
    [-12.2, 0, 2.8], [-11.8, 0, -2.5], [11.9, 0, 2.3], [12.3, 0, -2.1],
    [-4.9, 0, 1.9], [4.9, 0, -1.8], [-14.2, 0, 12.1], [-9.2, 0, 13.4],
    [14.2, 0, 11.2], [15.5, 0, -13.8], [-14.5, 0, -14.8], [-27, 0, 11.8],
    [29, 0, 11.5], [-8.2, 0, 24.5], [7.8, 0, 24.8], [-22, 0, 16.5],
    [22, 0, 16.0], [-33, 0, -15.5], [33, 0, -14.5], [-19, 0, -24.0],
  ];
  tuftPositions.forEach(([gx, gy, gz], idx) => {
    const tuft = new THREE.Mesh(tuftGeo, tuftMat);
    tuft.position.set(gx, gy, gz);
    tuft.scale.setScalar(0.75 + (idx % 3) * 0.28);
    root.add(tuft);
    swayingFoliage.push({ mesh: tuft, baseRotZ: 0, phase: idx * 0.8, amp: 0.09 });
  });

  // ============================================================================
  // 8. INTERACTIVE GLASS-STYLED MUSEUM INFORMATION PLINTHS (PER-CITY EXHIBITS)
  // ============================================================================
  const haloGeo = trackGeo(new THREE.RingGeometry(0.55, 0.78, 28));
  haloGeo.rotateX(-Math.PI / 2);
  const cityUpperName = cityDef.shortName.toLocaleUpperCase('tr-TR');

  for (const exhibit of cityExhibits) {
    const [sx, , sz] = exhibit.standPosition;
    const surf = sampleMuseumSurface(sx, sz, cityId);
    const sy = surf.height;

    const stand = new THREE.Group();
    stand.position.set(sx, sy, sz);
    stand.rotation.y = exhibit.standRotationY;

    // Brushed antique bronze pedestal base & slender stem
    const base = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.54, 0.08, 0.42)), mats.agedBronze);
    base.position.y = 0.04;
    base.castShadow = !isSoftwareGl;
    stand.add(base);

    const stem = new THREE.Mesh(trackGeo(new THREE.CylinderGeometry(0.036, 0.048, 0.94, 12)), mats.agedBronze);
    stem.position.y = 0.52;
    stem.castShadow = !isSoftwareGl;
    stand.add(stem);

    // Tilted museum glass info panel + illuminated brass trim frame
    const panelPivot = new THREE.Group();
    panelPivot.position.set(0, 1.04, 0.03);
    panelPivot.rotation.x = -0.46;

    const frameMat = trackMat(
      new THREE.MeshStandardMaterial({
        color: 0x9b7a49,
        emissive: 0x3b260b,
        emissiveIntensity: 0.25,
        roughness: 0.36,
        metalness: 0.82,
      })
    );

    const frame = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.76, 0.5, 0.03)), frameMat);
    panelPivot.add(frame);

    const glassPlate = new THREE.Mesh(
      trackGeo(new THREE.BoxGeometry(0.84, 0.58, 0.016)),
      mats.plinthGlass
    );
    glassPlate.position.z = -0.012;
    panelPivot.add(glassPlate);

    const plaqueTex = createExhibitPlaqueTexture(exhibit, cityUpperName);
    ownedTex.push(plaqueTex);
    const plaqueMat = trackMat(
      new THREE.MeshStandardMaterial({
        map: plaqueTex,
        emissive: 0xffe4b3,
        emissiveMap: plaqueTex,
        emissiveIntensity: 0.28,
        roughness: 0.28,
        metalness: 0.08,
      })
    );
    const plaque = new THREE.Mesh(trackGeo(new THREE.PlaneGeometry(0.7, 0.44)), plaqueMat);
    plaque.position.z = 0.018;
    panelPivot.add(plaque);

    stand.add(panelPivot);

    // Subtle ground highlight ring (activates smoothly when player approaches)
    const haloMat = trackMat(
      new THREE.MeshBasicMaterial({
        color: 0xe8b96a,
        transparent: true,
        opacity: 0.16,
        depthWrite: false,
      })
    );
    const haloMesh = new THREE.Mesh(haloGeo, haloMat);
    haloMesh.position.y = 0.025;
    stand.add(haloMesh);

    root.add(stand);
    plinths.push({ exhibit, group: stand, haloMesh, frameMat });
    cylinderColliders.push({ x: sx, z: sz, radius: 0.36, minY: sy, maxY: sy + 1.3 });
  }

  // ============================================================================
  // 9. VOLUMETRIC GOLDEN HOUR GOD RAYS & FLOATING DUST MOTES
  // ============================================================================
  const godRayMat = trackMat(createGodRayMaterial(cityDef.skyTheme.godRayHex));
  const godRayGeo = trackGeo(new THREE.CylinderGeometry(1.4, 3.2, 16.5, 14, 1, true));

  for (const [rx, ry, rz, scale] of rayPlacements) {
    const ray = new THREE.Mesh(godRayGeo, godRayMat);
    ray.position.set(rx + 2.8, ry, rz - 2.4);
    ray.scale.set(scale, 1.0, scale * 0.72);
    ray.rotation.set(-0.56, 0.35, -0.46);
    ray.renderOrder = 4;
    root.add(ray);
  }

  // Floating Golden Hour dust motes drifting lazily in sunbeams
  const dustCount = isSoftwareGl ? 180 : 420;
  const dustPositions = new Float32Array(dustCount * 3);
  const dustSeeds = new Float32Array(dustCount);
  for (let i = 0; i < dustCount; i++) {
    dustPositions[i * 3] = (Math.random() - 0.5) * 76;
    dustPositions[i * 3 + 1] = 0.5 + Math.random() * 9.5;
    dustPositions[i * 3 + 2] = (Math.random() - 0.5) * 76;
    dustSeeds[i] = Math.random() * Math.PI * 2;
  }
  const dustGeo = trackGeo(new THREE.BufferGeometry());
  dustGeo.setAttribute('position', new THREE.BufferAttribute(dustPositions, 3));
  const dustMat = trackMat(
    new THREE.PointsMaterial({
      size: 0.19,
      map: mats.dustSpriteTexture,
      transparent: true,
      opacity: 0.62,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      color: 0xffe4aa,
    })
  );
  const dustPoints = new THREE.Points(dustGeo, dustMat);
  root.add(dustPoints);

  const updateAtmosphere = (
    elapsed: number,
    dt: number,
    playerPos: THREE.Vector3,
    nearbyExhibitId: string | null,
    discoveredIds: ReadonlySet<string>
  ) => {
    godRayMat.uniforms.uTime.value = elapsed;

    // Gentle Mediterranean breeze swaying cypresses, olive canopies, and grass tufts
    for (let i = 0; i < swayingFoliage.length; i++) {
      const f = swayingFoliage[i];
      f.mesh.rotation.z =
        f.baseRotZ + Math.sin(elapsed * 1.15 + f.phase) * f.amp + Math.sin(elapsed * 2.3 + f.phase) * f.amp * 0.35;
    }

    // Drift golden dust motes lazily around the sanctuary
    const posAttr = dustGeo.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < dustCount; i++) {
      const seed = dustSeeds[i];
      let x = posAttr.getX(i) + (0.14 + Math.sin(elapsed * 0.35 + seed) * 0.08) * dt;
      let y = posAttr.getY(i) + Math.sin(elapsed * 0.55 + seed * 1.7) * 0.09 * dt;
      let z = posAttr.getZ(i) + Math.cos(elapsed * 0.28 + seed) * 0.07 * dt;
      if (x > 38) x = -38;
      if (y < 0.4) y = 9.5;
      if (y > 10.0) y = 0.5;
      if (z > 38) z = -38;
      if (z < -38) z = 38;
      posAttr.setXYZ(i, x, y, z);
    }
    posAttr.needsUpdate = true;

    // Update museum plinth halos (subtle calm glow when player approaches, emerald tint when discovered)
    for (let i = 0; i < plinths.length; i++) {
      const p = plinths[i];
      const isNear = p.exhibit.id === nearbyExhibitId;
      const isDisc = discoveredIds.has(p.exhibit.id);
      const dist = playerPos.distanceTo(p.group.position);
      const proximity = Math.max(0, 1 - dist / 14);
      const haloMat = p.haloMesh.material as THREE.MeshBasicMaterial;
      haloMat.color.setHex(isNear ? 0xffd27a : isDisc ? 0x7db36b : 0xd8a85e);
      haloMat.opacity = isNear ? 0.58 : 0.12 + proximity * 0.18;
      p.frameMat.emissiveIntensity = isNear ? 0.72 : 0.2 + proximity * 0.16;
    }
  };

  return {
    root,
    boxColliders,
    cylinderColliders,
    cameraCollisionMeshes,
    plinths,
    updateAtmosphere,
    dispose: () => {
      for (const g of ownedGeos) g.dispose();
      for (const m of ownedMats) m.dispose();
      for (const t of ownedTex) t.dispose();
    },
  };
}
