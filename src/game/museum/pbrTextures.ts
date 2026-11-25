import * as THREE from 'three';

export interface MuseumPbrMaterials {
  travertine: THREE.MeshStandardMaterial;
  travertineArch: THREE.MeshStandardMaterial;
  crackedMarble: THREE.MeshStandardMaterial;
  statueMarble: THREE.MeshStandardMaterial;
  carvedFrieze: THREE.MeshStandardMaterial;
  inscriptionStone: THREE.MeshStandardMaterial;
  stonePaving: THREE.MeshStandardMaterial;
  dirtPath: THREE.MeshStandardMaterial;
  floorMosaic: THREE.MeshStandardMaterial;
  cryptMasonry: THREE.MeshStandardMaterial;
  cryptFloor: THREE.MeshStandardMaterial;
  romanBrick: THREE.MeshStandardMaterial;
  terracotta: THREE.MeshStandardMaterial;
  agedBronze: THREE.MeshStandardMaterial;
  plinthGlass: THREE.MeshPhysicalMaterial;
  dustSpriteTexture: THREE.CanvasTexture;
  dispose: () => void;
}

// Deterministic fast value noise for organic stone weathering, veins, and moss
function hash2(x: number, y: number, seed: number): number {
  const n = Math.sin(x * 127.1 + y * 311.7 + seed * 74.7) * 43758.5453123;
  return n - Math.floor(n);
}

function smoothNoise(x: number, y: number, seed: number): number {
  const ix = Math.floor(x);
  const iy = Math.floor(y);
  const fx = x - ix;
  const fy = y - iy;
  const ux = fx * fx * (3 - 2 * fx);
  const uy = fy * fy * (3 - 2 * fy);
  const a = hash2(ix, iy, seed);
  const b = hash2(ix + 1, iy, seed);
  const c = hash2(ix, iy + 1, seed);
  const d = hash2(ix + 1, iy + 1, seed);
  return a + (b - a) * ux + (c - a) * uy + (a - b - c + d) * ux * uy;
}

function fbm(x: number, y: number, seed: number, octaves = 4): number {
  let sum = 0;
  let amp = 0.5;
  let freq = 1;
  for (let i = 0; i < octaves; i++) {
    sum += smoothNoise(x * freq, y * freq, seed + i * 19.3) * amp;
    freq *= 2.02;
    amp *= 0.5;
  }
  return sum;
}

// Tileable FBM via periodic domain wrapping
function tileableFbm(u: number, v: number, scale: number, seed: number, octaves = 4): number {
  // Sample 4 corners blended seamlessly across [0,1)
  const sx = u * scale;
  const sy = v * scale;
  const w1 = (1 - u) * (1 - v);
  const w2 = u * (1 - v);
  const w3 = (1 - u) * v;
  const w4 = u * v;
  return (
    fbm(sx, sy, seed, octaves) * w1 +
    fbm(sx - scale, sy, seed, octaves) * w2 +
    fbm(sx, sy - scale, seed, octaves) * w3 +
    fbm(sx - scale, sy - scale, seed, octaves) * w4
  );
}

interface GeneratedPbrSet {
  map: THREE.DataTexture;
  normalMap: THREE.DataTexture;
  roughnessMap: THREE.DataTexture;
  bumpMap: THREE.DataTexture;
}

/**
 * Converts a scalar heightfield [0..1] into a tangent-space normal map via Sobel derivative,
 * alongside paired albedo, roughness, and bump DataTextures.
 */
function buildPbrTextureSet(
  size: number,
  repeatX: number,
  repeatY: number,
  maxAnisotropy: number,
  normalStrength: number,
  sampler: (
    u: number,
    v: number,
    px: number,
    py: number
  ) => { r: number; g: number; b: number; height: number; roughness: number },
  allTextures: THREE.Texture[]
): GeneratedPbrSet {
  const count = size * size;
  const colorData = new Uint8Array(count * 4);
  const roughData = new Uint8Array(count * 4);
  const bumpData = new Uint8Array(count * 4);
  const heights = new Float32Array(count);

  for (let py = 0; py < size; py++) {
    const v = py / size;
    for (let px = 0; px < size; px++) {
      const u = px / size;
      const idx = py * size + px;
      const s = sampler(u, v, px, py);
      heights[idx] = s.height;

      const i4 = idx * 4;
      colorData[i4] = Math.max(0, Math.min(255, Math.round(s.r)));
      colorData[i4 + 1] = Math.max(0, Math.min(255, Math.round(s.g)));
      colorData[i4 + 2] = Math.max(0, Math.min(255, Math.round(s.b)));
      colorData[i4 + 3] = 255;

      const roughByte = Math.max(20, Math.min(250, Math.round(s.roughness * 255)));
      roughData[i4] = roughByte;
      roughData[i4 + 1] = roughByte;
      roughData[i4 + 2] = roughByte;
      roughData[i4 + 3] = 255;

      const bumpByte = Math.max(0, Math.min(255, Math.round(s.height * 255)));
      bumpData[i4] = bumpByte;
      bumpData[i4 + 1] = bumpByte;
      bumpData[i4 + 2] = bumpByte;
      bumpData[i4 + 3] = 255;
    }
  }

  // Sobel tangent-space normal map
  const normalData = new Uint8Array(count * 4);
  const at = (x: number, y: number) => heights[((y + size) % size) * size + ((x + size) % size)];

  for (let py = 0; py < size; py++) {
    for (let px = 0; px < size; px++) {
      const tl = at(px - 1, py - 1);
      const t = at(px, py - 1);
      const tr = at(px + 1, py - 1);
      const l = at(px - 1, py);
      const r = at(px + 1, py);
      const bl = at(px - 1, py + 1);
      const b = at(px, py + 1);
      const br = at(px + 1, py + 1);

      const dx = (tr + 2 * r + br - (tl + 2 * l + bl)) * normalStrength;
      const dy = (bl + 2 * b + br - (tl + 2 * t + tr)) * normalStrength;
      const dz = 1.0;
      const invLen = 1 / Math.sqrt(dx * dx + dy * dy + dz * dz);

      const i4 = (py * size + px) * 4;
      normalData[i4] = Math.round((-dx * invLen * 0.5 + 0.5) * 255);
      normalData[i4 + 1] = Math.round((-dy * invLen * 0.5 + 0.5) * 255);
      normalData[i4 + 2] = Math.round((dz * invLen * 0.5 + 0.5) * 255);
      normalData[i4 + 3] = 255;
    }
  }

  const configure = (tex: THREE.DataTexture, isColor: boolean) => {
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(repeatX, repeatY);
    tex.generateMipmaps = true;
    tex.minFilter = THREE.LinearMipmapLinearFilter;
    tex.magFilter = THREE.LinearFilter;
    tex.anisotropy = Math.min(8, maxAnisotropy);
    if (isColor) {
      tex.colorSpace = THREE.SRGBColorSpace;
    }
    tex.needsUpdate = true;
    allTextures.push(tex);
    return tex;
  };

  return {
    map: configure(new THREE.DataTexture(colorData, size, size), true),
    normalMap: configure(new THREE.DataTexture(normalData, size, size), false),
    roughnessMap: configure(new THREE.DataTexture(roughData, size, size), false),
    bumpMap: configure(new THREE.DataTexture(bumpData, size, size), false),
  };
}

function createDustSpriteTexture(allTextures: THREE.Texture[]): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    const grad = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    grad.addColorStop(0, 'rgba(255, 244, 214, 1)');
    grad.addColorStop(0.35, 'rgba(255, 226, 165, 0.72)');
    grad.addColorStop(0.7, 'rgba(255, 206, 132, 0.18)');
    grad.addColorStop(1, 'rgba(255, 200, 120, 0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 64, 64);
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  allTextures.push(tex);
  return tex;
}

export function createMuseumPbrMaterials(
  maxAnisotropy: number,
  isSoftwareGl: boolean
): MuseumPbrMaterials {
  const allTextures: THREE.Texture[] = [];
  const allMaterials: THREE.Material[] = [];
  const texSize = isSoftwareGl ? 192 : 256;

  const track = <T extends THREE.Material>(m: T): T => {
    allMaterials.push(m);
    return m;
  };

  // 1. Weathered Aydın Travertine Ashlar with moss crevices & sedimentary pores
  const travSet = buildPbrTextureSet(
    texSize,
    2,
    2,
    maxAnisotropy,
    2.8,
    (u, v) => {
      const rows = 5;
      const cols = 3;
      const row = Math.floor(v * rows);
      const staggeredU = (u * cols + (row % 2) * 0.5) % cols;
      const fu = staggeredU - Math.floor(staggeredU);
      const fv = v * rows - row;
      const blockSeed = row * 17 + Math.floor(staggeredU) * 31;

      const edgeDist = Math.min(fu, 1 - fu, fv, 1 - fv);
      const mortarMask = edgeDist < 0.045 ? 1 - edgeDist / 0.045 : 0;
      const bevel = Math.min(1, edgeDist / 0.11);

      const strata = tileableFbm(u * 1.4, v * 5.2, 6, 11, 4);
      const pores = tileableFbm(u, v, 22, 37, 3);
      const pitMask = pores < 0.28 ? (0.28 - pores) * 2.2 : 0;
      const mossNoise = tileableFbm(u, v, 8, 91, 4);
      const moss =
        Math.max(0, Math.min(1, (mortarMask * 1.15 + (1 - bevel) * 0.45) * (mossNoise - 0.36) * 2.8));

      const blockTint = (hash2(blockSeed, 3, 7) - 0.5) * 24;
      let r = 204 + blockTint + (strata - 0.5) * 32 - pitMask * 38;
      let g = 183 + blockTint * 0.9 + (strata - 0.5) * 28 - pitMask * 34;
      let b = 148 + blockTint * 0.75 + (strata - 0.5) * 22 - pitMask * 28;

      // Dark weathered mortar line
      r = r * (1 - mortarMask * 0.45) + 84 * (mortarMask * 0.45);
      g = g * (1 - mortarMask * 0.45) + 75 * (mortarMask * 0.45);
      b = b * (1 - mortarMask * 0.45) + 61 * (mortarMask * 0.45);

      // Olive/sage Mediterranean moss in stone joints
      r = r * (1 - moss) + 76 * moss;
      g = g * (1 - moss) + 96 * moss;
      b = b * (1 - moss) + 52 * moss;

      const height = Math.max(
        0,
        Math.min(1, 0.74 * bevel + strata * 0.18 - mortarMask * 0.55 - pitMask * 0.25 + moss * 0.08)
      );
      const roughness = Math.min(0.98, 0.72 + mortarMask * 0.2 + pitMask * 0.18 + moss * 0.12);
      return { r, g, b, height, roughness };
    },
    allTextures
  );

  const travertine = track(
    new THREE.MeshStandardMaterial({
      map: travSet.map,
      normalMap: travSet.normalMap,
      normalScale: new THREE.Vector2(1.15, 1.15),
      roughnessMap: travSet.roughnessMap,
      roughness: 0.92,
      metalness: 0.02,
      bumpMap: travSet.bumpMap,
      bumpScale: 0.04,
    })
  );

  const travertineArch = track(
    new THREE.MeshStandardMaterial({
      map: travSet.map,
      normalMap: travSet.normalMap,
      normalScale: new THREE.Vector2(1.25, 1.25),
      roughnessMap: travSet.roughnessMap,
      roughness: 0.88,
      metalness: 0.03,
      color: new THREE.Color(0xf4e8d4),
    })
  );

  // 2. Cracked Antique Anatolian Marble (veins, hairline cracks, satin weathered sheen)
  const marbleSet = buildPbrTextureSet(
    texSize,
    2,
    2,
    maxAnisotropy,
    2.2,
    (u, v) => {
      const n1 = tileableFbm(u, v, 5, 101, 4);
      const n2 = tileableFbm(u * 2, v * 2, 10, 137, 3);
      const veinWave = Math.sin((u * 3.5 + v * 2.2 + n1 * 2.4) * Math.PI * 2);
      const vein = Math.pow(1 - Math.abs(veinWave), 6);

      // Sharp hairline fracture cracks
      const crackField = Math.abs(tileableFbm(u * 1.2, v * 1.2, 6, 211, 4) - 0.5);
      const crack = crackField < 0.014 ? 1 - crackField / 0.014 : 0;

      // Subtle slab joint
      const slabEdge = Math.min(
        Math.abs(u - 0.5),
        Math.abs(v - 0.5),
        u,
        1 - u,
        v,
        1 - v
      );
      const seam = slabEdge < 0.012 ? 1 - slabEdge / 0.012 : 0;

      let r = 236 - n2 * 18 - vein * 34 - crack * 82 - seam * 55;
      let g = 228 - n2 * 18 - vein * 32 - crack * 76 - seam * 52;
      let b = 212 - n2 * 16 - vein * 26 - crack * 66 - seam * 46;

      // Golden warm mineral patina
      const patina = Math.max(0, n1 - 0.58) * 1.4;
      r += patina * 12;
      g += patina * 4;
      b -= patina * 16;

      const height = Math.max(0, 0.82 + n2 * 0.08 - crack * 0.55 - seam * 0.42);
      const roughness = Math.min(0.95, 0.34 + n2 * 0.22 + crack * 0.45 + seam * 0.35);
      return { r, g, b, height, roughness };
    },
    allTextures
  );

  const crackedMarble = track(
    new THREE.MeshStandardMaterial({
      map: marbleSet.map,
      normalMap: marbleSet.normalMap,
      normalScale: new THREE.Vector2(0.85, 0.85),
      roughnessMap: marbleSet.roughnessMap,
      roughness: 0.72,
      metalness: 0.04,
      envMapIntensity: 0.85,
    })
  );

  const statueMarble = track(
    new THREE.MeshStandardMaterial({
      map: marbleSet.map,
      normalMap: marbleSet.normalMap,
      normalScale: new THREE.Vector2(0.45, 0.45),
      roughnessMap: marbleSet.roughnessMap,
      roughness: 0.52,
      metalness: 0.3,
      flatShading: false,
      color: new THREE.Color(0xf7f1e6),
      envMapIntensity: 1.05,
    })
  );

  // 3. Carved Relief Frieze (Meander + Ovolo Egg-and-Dart + Dentils)
  const friezeSet = buildPbrTextureSet(
    texSize,
    3,
    1,
    maxAnisotropy,
    3.6,
    (u, v) => {
      const weather = tileableFbm(u, v, 8, 307, 4);
      let relief = 0.45;

      // Top & bottom molded cornice bands
      if (v < 0.14 || v > 0.86) {
        relief = 0.86;
      } else if (v >= 0.14 && v < 0.28) {
        // Dentil blocks
        const dentil = Math.floor(u * 16) % 2 === 0 ? 0.82 : 0.35;
        relief = dentil;
      } else if (v >= 0.28 && v < 0.74) {
        // Classical Aegean meander / egg-and-dart motif
        const cellU = (u * 8) % 1;
        const cellV = (v - 0.28) / 0.46;
        const dx = (cellU - 0.5) * 2;
        const dy = (cellV - 0.5) * 2;
        const oval = 1 - Math.sqrt(dx * dx * 1.15 + dy * dy * 1.1);
        const frame =
          Math.abs(cellU - 0.5) > 0.42 || Math.abs(cellV - 0.5) > 0.4 ? 0.78 : 0.32;
        relief = Math.max(frame, oval > 0.08 ? 0.55 + Math.min(0.4, oval * 0.65) : 0.32);
      } else {
        // Lower beaded astragal
        const bead = Math.sin(u * Math.PI * 32) * 0.5 + 0.5;
        relief = 0.52 + bead * 0.32;
      }

      const shade = 0.78 + relief * 0.26 - (weather - 0.5) * 0.16;
      const r = 224 * shade;
      const g = 207 * shade;
      const b = 176 * shade;
      return {
        r,
        g,
        b,
        height: Math.max(0, Math.min(1, relief + (weather - 0.5) * 0.12)),
        roughness: 0.66 + (1 - relief) * 0.24,
      };
    },
    allTextures
  );

  const carvedFrieze = track(
    new THREE.MeshStandardMaterial({
      map: friezeSet.map,
      normalMap: friezeSet.normalMap,
      normalScale: new THREE.Vector2(1.45, 1.45),
      roughnessMap: friezeSet.roughnessMap,
      roughness: 0.78,
      metalness: 0.03,
    })
  );

  // 4. Inscribed Epigraphic Marble / Stone (Seikilos Stele & Altars)
  const inscriptionSet = buildPbrTextureSet(
    texSize,
    1,
    1,
    maxAnisotropy,
    3.2,
    (u, v) => {
      const grain = tileableFbm(u, v, 9, 419, 4);
      let carve = 0;

      // Decorative horizontal epigraphic guide bands + glyph chisels
      const linePos = v * 12;
      const lineIdx = Math.floor(linePos);
      const lineFrac = linePos - lineIdx;
      if (lineIdx >= 2 && lineIdx <= 9 && u > 0.1 && u < 0.9) {
        const glyphCol = Math.floor(u * 26);
        const gx = (u * 26) - glyphCol;
        const seed = hash2(glyphCol, lineIdx, 521);
        if (seed > 0.18 && lineFrac > 0.22 && lineFrac < 0.72) {
          // Chiseled Greek-inspired strokes (verticals, bars, diagonals)
          const strokeV = Math.abs(gx - 0.25) < 0.12 || (seed > 0.55 && Math.abs(gx - 0.72) < 0.12);
          const strokeH =
            (seed > 0.35 && Math.abs(lineFrac - 0.28) < 0.09) ||
            (seed > 0.65 && Math.abs(lineFrac - 0.5) < 0.08);
          if (strokeV || strokeH) {
            carve = 0.85;
          }
        }
      }
      // Top & bottom border groove
      if (Math.abs(v - 0.12) < 0.015 || Math.abs(v - 0.88) < 0.015) {
        carve = 0.9;
      }

      const r = 228 - grain * 24 - carve * 74;
      const g = 218 - grain * 22 - carve * 70;
      const b = 198 - grain * 18 - carve * 62;
      return {
        r,
        g,
        b,
        height: Math.max(0, 0.82 + (grain - 0.5) * 0.12 - carve * 0.6),
        roughness: 0.45 + grain * 0.22 + carve * 0.35,
      };
    },
    allTextures
  );

  const inscriptionStone = track(
    new THREE.MeshStandardMaterial({
      map: inscriptionSet.map,
      normalMap: inscriptionSet.normalMap,
      normalScale: new THREE.Vector2(1.3, 1.3),
      roughnessMap: inscriptionSet.roughnessMap,
      roughness: 0.65,
      metalness: 0.04,
    })
  );

  // 5. Ancient Roman Polygonal Stone Paving with dusty earth & moss seams
  const pavingSet = buildPbrTextureSet(
    texSize,
    12,
    12,
    maxAnisotropy,
    2.9,
    (u, v) => {
      const cells = 5;
      const gx = u * cells;
      const gy = v * cells;
      const ix = Math.floor(gx);
      const iy = Math.floor(gy);

      // Periodic Voronoi cell distance for irregular Roman flagstones
      let minDist = 99;
      let secondDist = 99;
      let cellId = 0;

      for (let oy = -1; oy <= 1; oy++) {
        for (let ox = -1; ox <= 1; ox++) {
          const cx = ((ix + ox) % cells + cells) % cells;
          const cy = ((iy + oy) % cells + cells) % cells;
          const px = ix + ox + 0.18 + hash2(cx, cy, 601) * 0.64;
          const py = iy + oy + 0.18 + hash2(cx, cy, 613) * 0.64;
          const dx = gx - px;
          const dy = gy - py;
          const d = Math.sqrt(dx * dx + dy * dy);
          if (d < minDist) {
            secondDist = minDist;
            minDist = d;
            cellId = cx * 13 + cy * 29;
          } else if (d < secondDist) {
            secondDist = d;
          }
        }
      }

      const border = secondDist - minDist;
      const joint = border < 0.075 ? 1 - border / 0.075 : 0;
      const stoneVar = (hash2(cellId, 5, 631) - 0.5) * 34;
      const grain = tileableFbm(u, v, 14, 653, 3);
      const mossNoise = tileableFbm(u, v, 6, 677, 3);
      const moss = Math.max(0, Math.min(1, joint * (mossNoise - 0.42) * 3.0));

      let r = 186 + stoneVar + (grain - 0.5) * 26;
      let g = 171 + stoneVar * 0.92 + (grain - 0.5) * 24;
      let b = 144 + stoneVar * 0.8 + (grain - 0.5) * 20;

      // Earthy joint fill
      r = r * (1 - joint * 0.58) + 126 * (joint * 0.58);
      g = g * (1 - joint * 0.58) + 105 * (joint * 0.58);
      b = b * (1 - joint * 0.58) + 78 * (joint * 0.58);

      // Olive moss tufts
      r = r * (1 - moss) + 79 * moss;
      g = g * (1 - moss) + 98 * moss;
      b = b * (1 - moss) + 52 * moss;

      const height = Math.max(0, 0.78 + (grain - 0.5) * 0.12 - joint * 0.52);
      const roughness = Math.min(0.98, 0.7 + joint * 0.24 + (grain - 0.5) * 0.14);
      return { r, g, b, height, roughness };
    },
    allTextures
  );

  const stonePaving = track(
    new THREE.MeshStandardMaterial({
      map: pavingSet.map,
      normalMap: pavingSet.normalMap,
      normalScale: new THREE.Vector2(1.1, 1.1),
      roughnessMap: pavingSet.roughnessMap,
      roughness: 0.9,
      metalness: 0.02,
    })
  );

  // 6. Sun-baked Anatolian Dirt & Gravel Path
  const dirtSet = buildPbrTextureSet(
    texSize,
    18,
    18,
    maxAnisotropy,
    2.1,
    (u, v) => {
      const base = tileableFbm(u, v, 8, 709, 4);
      const pebbles = tileableFbm(u, v, 28, 733, 3);
      const dryGrass = tileableFbm(u, v, 11, 757, 3);
      const pebblePeak = pebbles > 0.68 ? (pebbles - 0.68) * 2.5 : 0;
      const grassPatch = dryGrass > 0.64 ? (dryGrass - 0.64) * 1.9 : 0;

      let r = 166 + (base - 0.5) * 34 + pebblePeak * 34;
      let g = 136 + (base - 0.5) * 28 + pebblePeak * 28;
      let b = 98 + (base - 0.5) * 22 + pebblePeak * 22;

      r = r * (1 - grassPatch * 0.45) + 112 * (grassPatch * 0.45);
      g = g * (1 - grassPatch * 0.45) + 118 * (grassPatch * 0.45);
      b = b * (1 - grassPatch * 0.45) + 68 * (grassPatch * 0.45);

      return {
        r,
        g,
        b,
        height: Math.max(0, Math.min(1, 0.48 + base * 0.28 + pebblePeak * 0.35)),
        roughness: 0.94,
      };
    },
    allTextures
  );

  const dirtPath = track(
    new THREE.MeshStandardMaterial({
      map: dirtSet.map,
      normalMap: dirtSet.normalMap,
      normalScale: new THREE.Vector2(0.95, 0.95),
      roughnessMap: dirtSet.roughnessMap,
      roughness: 0.96,
      metalness: 0.0,
    })
  );

  // 7. Aegean Geometric Roman Floor Mosaic (Tessera tiles, terracotta + Aegean navy + ivory + ochre)
  const mosaicSet = buildPbrTextureSet(
    texSize,
    2,
    2,
    maxAnisotropy,
    2.4,
    (u, v) => {
      const tiles = 32;
      const tx = u * tiles;
      const ty = v * tiles;
      const fx = tx - Math.floor(tx);
      const fy = ty - Math.floor(ty);
      const groutDist = Math.min(fx, 1 - fx, fy, 1 - fy);
      const grout = groutDist < 0.1 ? 1 - groutDist / 0.1 : 0;

      const tileSeed = hash2(Math.floor(tx), Math.floor(ty), 809);
      const wear = tileableFbm(u, v, 7, 827, 3);

      // Geometric border + octagonal star medallion pattern
      const du = Math.abs(u - 0.5) * 2;
      const dv = Math.abs(v - 0.5) * 2;
      const maxD = Math.max(du, dv);
      const radial = Math.sqrt(du * du + dv * dv);
      const diag = Math.abs(du - dv);

      let r = 228;
      let g = 213;
      let b = 184; // Warm ivory limestone tessera

      if (maxD > 0.86 || (maxD > 0.72 && maxD < 0.78)) {
        // Deep Aegean navy frame
        r = 46;
        g = 62;
        b = 84;
      } else if (maxD >= 0.78 && maxD <= 0.86) {
        // Terracotta meander stripe
        const meander = (Math.floor(u * 16) + Math.floor(v * 16)) % 2 === 0;
        if (meander) {
          r = 176;
          g = 86;
          b = 54;
        } else {
          r = 212;
          g = 166;
          b = 98;
        }
      } else if (radial < 0.52) {
        // Central rosette / star
        const angle = Math.atan2(v - 0.5, u - 0.5);
        const petals = Math.cos(angle * 8) * 0.14 + 0.34;
        if (radial < 0.14) {
          r = 186;
          g = 94;
          b = 58;
        } else if (radial < petals) {
          r = diag < 0.08 ? 48 : 206;
          g = diag < 0.08 ? 64 : 154;
          b = diag < 0.08 ? 84 : 84;
        } else if (Math.abs(radial - 0.48) < 0.04) {
          r = 56;
          g = 72;
          b = 92;
        }
      } else {
        // Diamond lattice corners
        const diamond = Math.abs(((u * 8) % 1) - 0.5) + Math.abs(((v * 8) % 1) - 0.5);
        if (diamond < 0.28) {
          r = 172;
          g = 88;
          b = 58;
        } else if (diamond > 0.62) {
          r = 112;
          g = 122;
          b = 84;
        }
      }

      // Subtle per-tessera variation & age wear
      const jitter = (tileSeed - 0.5) * 22;
      r = r + jitter - (wear - 0.5) * 22;
      g = g + jitter * 0.9 - (wear - 0.5) * 20;
      b = b + jitter * 0.8 - (wear - 0.5) * 16;

      // Sandy lime grout between tesserae
      r = r * (1 - grout * 0.6) + 158 * (grout * 0.6);
      g = g * (1 - grout * 0.6) + 145 * (grout * 0.6);
      b = b * (1 - grout * 0.6) + 122 * (grout * 0.6);

      return {
        r,
        g,
        b,
        height: 0.78 - grout * 0.45 + (tileSeed - 0.5) * 0.14,
        roughness: 0.46 + grout * 0.42 + wear * 0.18,
      };
    },
    allTextures
  );

  const floorMosaic = track(
    new THREE.MeshStandardMaterial({
      map: mosaicSet.map,
      normalMap: mosaicSet.normalMap,
      normalScale: new THREE.Vector2(0.9, 0.9),
      roughnessMap: mosaicSet.roughnessMap,
      roughness: 0.62,
      metalness: 0.04,
      envMapIntensity: 0.85,
    })
  );

  // 8. Dark Damp Vaulted Crypt Stone Masonry
  const cryptSet = buildPbrTextureSet(
    texSize,
    3,
    2,
    maxAnisotropy,
    3.1,
    (u, v) => {
      const rows = 6;
      const cols = 4;
      const row = Math.floor(v * rows);
      const su = (u * cols + (row % 2) * 0.5) % cols;
      const fu = su - Math.floor(su);
      const fv = v * rows - row;
      const edge = Math.min(fu, 1 - fu, fv, 1 - fv);
      const mortar = edge < 0.05 ? 1 - edge / 0.05 : 0;

      const damp = tileableFbm(u, v, 6, 907, 4);
      const grain = tileableFbm(u, v, 16, 929, 3);
      const blockVar = (hash2(Math.floor(su), row, 947) - 0.5) * 26;

      let r = 104 + blockVar + (grain - 0.5) * 22 - damp * 24;
      let g = 96 + blockVar * 0.95 + (grain - 0.5) * 20 - damp * 22;
      let b = 85 + blockVar * 0.9 + (grain - 0.5) * 18 - damp * 16;

      r = r * (1 - mortar * 0.55) + 46 * (mortar * 0.55);
      g = g * (1 - mortar * 0.55) + 42 * (mortar * 0.55);
      b = b * (1 - mortar * 0.55) + 38 * (mortar * 0.55);

      return {
        r,
        g,
        b,
        height: Math.max(0, 0.72 + (grain - 0.5) * 0.16 - mortar * 0.55),
        roughness: Math.max(0.32, 0.84 - damp * 0.36 + mortar * 0.15),
      };
    },
    allTextures
  );

  const cryptMasonry = track(
    new THREE.MeshStandardMaterial({
      map: cryptSet.map,
      normalMap: cryptSet.normalMap,
      normalScale: new THREE.Vector2(1.3, 1.3),
      roughnessMap: cryptSet.roughnessMap,
      roughness: 0.82,
      metalness: 0.05,
    })
  );

  const cryptFloor = track(
    new THREE.MeshStandardMaterial({
      map: cryptSet.map,
      normalMap: cryptSet.normalMap,
      normalScale: new THREE.Vector2(1.0, 1.0),
      roughnessMap: cryptSet.roughnessMap,
      roughness: 0.68,
      metalness: 0.06,
      color: new THREE.Color(0x9a9082),
    })
  );

  // 9. Ancient Roman Terracotta Brick Courses (characteristic of Tralleis Üç Gözler!)
  const brickSet = buildPbrTextureSet(
    texSize,
    3,
    3,
    maxAnisotropy,
    2.6,
    (u, v) => {
      const rows = 10;
      const cols = 4;
      const row = Math.floor(v * rows);
      const su = (u * cols + (row % 2) * 0.5) % cols;
      const fu = su - Math.floor(su);
      const fv = v * rows - row;
      const mortarH = fv < 0.16 || fv > 0.84 ? 1 : 0;
      const mortarV = fu < 0.05 || fu > 0.95 ? 1 : 0;
      const mortar = Math.max(mortarH, mortarV);
      const wear = tileableFbm(u, v, 10, 971, 3);
      const brickTint = (hash2(Math.floor(su), row, 983) - 0.5) * 30;

      let r = 176 + brickTint + (wear - 0.5) * 20;
      let g = 104 + brickTint * 0.6 + (wear - 0.5) * 16;
      let b = 74 + brickTint * 0.4 + (wear - 0.5) * 12;

      if (mortar > 0) {
        r = 182 + (wear - 0.5) * 20;
        g = 166 + (wear - 0.5) * 18;
        b = 138 + (wear - 0.5) * 16;
      }

      return {
        r,
        g,
        b,
        height: mortar > 0 ? 0.35 + wear * 0.12 : 0.78 + wear * 0.14,
        roughness: mortar > 0 ? 0.94 : 0.82,
      };
    },
    allTextures
  );

  const romanBrick = track(
    new THREE.MeshStandardMaterial({
      map: brickSet.map,
      normalMap: brickSet.normalMap,
      normalScale: new THREE.Vector2(1.1, 1.1),
      roughnessMap: brickSet.roughnessMap,
      roughness: 0.88,
      metalness: 0.02,
    })
  );

  const terracotta = track(
    new THREE.MeshStandardMaterial({
      color: new THREE.Color(0xb86643),
      roughness: 0.7,
      metalness: 0.04,
      flatShading: false,
      normalMap: brickSet.normalMap,
      normalScale: new THREE.Vector2(0.35, 0.35),
    })
  );

  const agedBronze = track(
    new THREE.MeshStandardMaterial({
      color: new THREE.Color(0x6d563c),
      roughness: 0.52,
      metalness: 0.3,
      flatShading: false,
      envMapIntensity: 1.1,
    })
  );

  const plinthGlass = track(
    new THREE.MeshPhysicalMaterial({
      color: new THREE.Color(0xeef6fa),
      roughness: 0.14,
      metalness: 0.06,
      transparent: true,
      opacity: 0.44,
      ior: 1.48,
      clearcoat: 0.8,
      clearcoatRoughness: 0.12,
      side: THREE.DoubleSide,
    })
  );

  const dustSpriteTexture = createDustSpriteTexture(allTextures);

  return {
    travertine,
    travertineArch,
    crackedMarble,
    statueMarble,
    carvedFrieze,
    inscriptionStone,
    stonePaving,
    dirtPath,
    floorMosaic,
    cryptMasonry,
    cryptFloor,
    romanBrick,
    terracotta,
    agedBronze,
    plinthGlass,
    dustSpriteTexture,
    dispose: () => {
      for (const t of allTextures) t.dispose();
      for (const m of allMaterials) m.dispose();
    },
  };
}
