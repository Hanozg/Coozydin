import * as THREE from 'three';

function makeCanvas(w = 256, h = 256): [HTMLCanvasElement, CanvasRenderingContext2D] {
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;
  return [canvas, ctx];
}

function finalizeTexture(
  canvas: HTMLCanvasElement,
  anisotropy: number,
  repeatX = 1,
  repeatY = 1,
  isColor = true
): THREE.CanvasTexture {
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(repeatX, repeatY);
  tex.anisotropy = anisotropy;
  if (isColor) {
    tex.colorSpace = THREE.SRGBColorSpace;
  }
  tex.needsUpdate = true;
  return tex;
}

export interface ProceduralTextureSet {
  asphalt: THREE.CanvasTexture;
  cobblestone: THREE.CanvasTexture;
  dirtRoad: THREE.CanvasTexture;
  gravelRoad: THREE.CanvasTexture;
  brickRoad: THREE.CanvasTexture;
  almasik: THREE.CanvasTexture;
  travertine: THREE.CanvasTexture;
  terracottaRoof: THREE.CanvasTexture;
  slateRoof: THREE.CanvasTexture;
  aegeanBlueRoof: THREE.CanvasTexture;
  plazaTile: THREE.CanvasTexture;
  grassGround: THREE.CanvasTexture;
  wheatField: THREE.CanvasTexture;
  lavenderField: THREE.CanvasTexture;
  dirtPath: THREE.CanvasTexture;
  stuccoGrain: THREE.CanvasTexture;
  stripedAwning: THREE.CanvasTexture;
  beachSand: THREE.CanvasTexture;
  seaWater: THREE.CanvasTexture;
  woodDeck: THREE.CanvasTexture;
  industrialBrick: THREE.CanvasTexture;
  ancientSignpost: THREE.CanvasTexture;
  contactShadow: THREE.CanvasTexture;
  dispose: () => void;
}

export function createProceduralTextures(maxAnisotropy: number): ProceduralTextureSet {
  const aniso = Math.max(1, Math.min(8, maxAnisotropy));

  // 1. Cozy Charcoal-Slate Asphalt Boulevard Road
  const [asphCanvas, asphCtx] = makeCanvas(256, 256);
  asphCtx.fillStyle = '#4A5058';
  asphCtx.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 5000; i++) {
    const x = (i * 73) % 256;
    const y = (i * 137) % 256;
    const shade = 64 + ((i * 19) % 28);
    asphCtx.fillStyle = `rgb(${shade}, ${shade + 4}, ${shade + 9})`;
    asphCtx.fillRect(x, y, 2, 2);
  }
  asphCtx.strokeStyle = 'rgba(30, 34, 40, 0.22)';
  asphCtx.lineWidth = 1;
  for (let y = 0; y < 256; y += 32) {
    asphCtx.beginPath();
    asphCtx.moveTo(0, y);
    asphCtx.lineTo(256, y);
    asphCtx.stroke();
  }
  const asphalt = finalizeTexture(asphCanvas, aniso, 2, 2, true);

  // 2. Warm Aegean Travertine Cobblestone (Sevgi Yolu & Historic Bazaar)
  const [cobCanvas, cobCtx] = makeCanvas(256, 256);
  cobCtx.fillStyle = '#A08C74';
  cobCtx.fillRect(0, 0, 256, 256);
  const rows = 12;
  const cols = 8;
  const cellH = 256 / rows;
  const cellW = 256 / cols;
  for (let r = 0; r < rows; r++) {
    const offset = (r % 2) * (cellW * 0.5);
    for (let c = -1; c <= cols; c++) {
      const x = c * cellW + offset + 2;
      const y = r * cellH + 2;
      const tone = 198 + ((r * 31 + c * 17) % 26);
      const warm = 14 + ((r + c) % 3) * 4;
      cobCtx.fillStyle = `rgb(${tone + warm}, ${tone + 3}, ${tone - 18})`;
      cobCtx.beginPath();
      cobCtx.roundRect(x, y, cellW - 4, cellH - 4, 4);
      cobCtx.fill();
    }
  }
  const cobblestone = finalizeTexture(cobCanvas, aniso, 2, 2, true);

  // 2b. Sunlit Aydın Country Dirt Road (compacted wheel ruts + ochre earth & pebbles)
  const [dirtRdCanvas, dirtRdCtx] = makeCanvas(256, 256);
  dirtRdCtx.fillStyle = '#C29B6B';
  dirtRdCtx.fillRect(0, 0, 256, 256);
  // Subtle grassy-ochre shoulder tint along left/right edges (U=0 and U=1)
  const edgeGradL = dirtRdCtx.createLinearGradient(0, 0, 38, 0);
  edgeGradL.addColorStop(0, 'rgba(136, 134, 84, 0.42)');
  edgeGradL.addColorStop(1, 'rgba(136, 134, 84, 0)');
  dirtRdCtx.fillStyle = edgeGradL;
  dirtRdCtx.fillRect(0, 0, 38, 256);
  const edgeGradR = dirtRdCtx.createLinearGradient(256, 0, 218, 0);
  edgeGradR.addColorStop(0, 'rgba(136, 134, 84, 0.42)');
  edgeGradR.addColorStop(1, 'rgba(136, 134, 84, 0)');
  dirtRdCtx.fillStyle = edgeGradR;
  dirtRdCtx.fillRect(218, 0, 38, 256);
  // Compacted twin wheel tracks along the road length
  dirtRdCtx.fillStyle = 'rgba(132, 94, 56, 0.24)';
  dirtRdCtx.fillRect(58, 0, 36, 256);
  dirtRdCtx.fillRect(162, 0, 36, 256);
  dirtRdCtx.fillStyle = 'rgba(222, 194, 148, 0.22)';
  dirtRdCtx.fillRect(110, 0, 36, 256);
  for (let i = 0; i < 4200; i++) {
    const x = (i * 79) % 256;
    const y = (i * 131) % 256;
    const v = ((i * 23) % 34) - 17;
    dirtRdCtx.fillStyle = `rgb(${194 + v}, ${154 + Math.floor(v * 0.85)}, ${105 + Math.floor(v * 0.65)})`;
    dirtRdCtx.fillRect(x, y, 2, 2);
  }
  for (let i = 0; i < 180; i++) {
    const x = (i * 97 + 13) % 256;
    const y = (i * 53 + 7) % 256;
    const r = 1.2 + (i % 3) * 0.7;
    dirtRdCtx.fillStyle = i % 2 === 0 ? '#A58258' : '#D9BC90';
    dirtRdCtx.beginPath();
    dirtRdCtx.arc(x, y, r, 0, Math.PI * 2);
    dirtRdCtx.fill();
  }
  const dirtRoad = finalizeTexture(dirtRdCanvas, aniso, 1, 2, true);

  // 2c. Crushed Aegean Limestone Gravel Road (Stabilize / Çakıl)
  const [gravCanvas, gravCtx] = makeCanvas(256, 256);
  gravCtx.fillStyle = '#9D978C';
  gravCtx.fillRect(0, 0, 256, 256);
  gravCtx.fillStyle = 'rgba(118, 112, 102, 0.24)';
  gravCtx.fillRect(54, 0, 42, 256);
  gravCtx.fillRect(160, 0, 42, 256);
  for (let i = 0; i < 5500; i++) {
    const x = (i * 67) % 256;
    const y = (i * 149) % 256;
    const shade = 128 + ((i * 29) % 62);
    gravCtx.fillStyle = `rgb(${shade + 6}, ${shade + 2}, ${shade - 5})`;
    gravCtx.fillRect(x, y, 2 + (i % 2), 2);
  }
  for (let i = 0; i < 320; i++) {
    const x = (i * 109 + 17) % 256;
    const y = (i * 71 + 11) % 256;
    const r = 1.4 + (i % 3) * 0.75;
    gravCtx.fillStyle = i % 3 === 0 ? '#C9C2B6' : i % 3 === 1 ? '#7B756C' : '#B2ABA0';
    gravCtx.beginPath();
    gravCtx.arc(x, y, r, 0, Math.PI * 2);
    gravCtx.fill();
  }
  const gravelRoad = finalizeTexture(gravCanvas, aniso, 2, 2, true);

  // 2d. Interlocking Terracotta Paving Stones (Kırmızı Kilit Taşı)
  const [brkRdCanvas, brkRdCtx] = makeCanvas(256, 256);
  brkRdCtx.fillStyle = '#735748';
  brkRdCtx.fillRect(0, 0, 256, 256);
  const bRows = 16;
  const bCols = 8;
  const bH = 256 / bRows;
  const bW = 256 / bCols;
  for (let r = 0; r < bRows; r++) {
    const shift = (r % 2) * (bW * 0.5);
    for (let c = -1; c <= bCols; c++) {
      const x = c * bW + shift + 1.5;
      const y = r * bH + 1.5;
      const isAccent = (r + c) % 5 === 0;
      const v = ((r * 23 + c * 37) % 20) - 10;
      if (isAccent) {
        brkRdCtx.fillStyle = `rgb(${194 + v}, ${160 + Math.floor(v * 0.7)}, ${128 + Math.floor(v * 0.5)})`;
      } else {
        brkRdCtx.fillStyle = `rgb(${176 + v}, ${96 + Math.floor(v * 0.6)}, ${72 + Math.floor(v * 0.5)})`;
      }
      brkRdCtx.beginPath();
      brkRdCtx.roundRect(x, y, bW - 3, bH - 3, 2.5);
      brkRdCtx.fill();
    }
  }
  const brickRoad = finalizeTexture(brkRdCanvas, aniso, 2, 2, true);

  // 3. Almaşık Duvar (Alternating Stone & Ottoman Brick - Nasuh Paşa Külliyesi)
  const [almCanvas, almCtx] = makeCanvas(256, 256);
  almCtx.fillStyle = '#D7C6AB';
  almCtx.fillRect(0, 0, 256, 256);
  for (let y = 0; y < 256; y += 32) {
    for (let x = 0; x < 256; x += 48) {
      const v = 214 + ((x + y) % 18);
      almCtx.fillStyle = `rgb(${v}, ${v - 14}, ${v - 34})`;
      almCtx.fillRect(x + 1, y + 1, 46, 18);
    }
    almCtx.fillStyle = '#BD6446';
    almCtx.fillRect(0, y + 20, 256, 5);
    almCtx.fillStyle = '#A35239';
    almCtx.fillRect(0, y + 26, 256, 5);
  }
  const almasik = finalizeTexture(almCanvas, aniso, 2, 2, true);

  // 4. Sunlit Roman Travertine Ashlar (Tralleis Üç Gözler & Bey Camii)
  const [travCanvas, travCtx] = makeCanvas(256, 256);
  travCtx.fillStyle = '#D1C1A3';
  travCtx.fillRect(0, 0, 256, 256);
  for (let r = 0; r < 8; r++) {
    const y = r * 32;
    const shift = (r % 2) * 32;
    for (let c = -1; c < 5; c++) {
      const x = c * 64 + shift;
      const v = 220 + ((r * 23 + c * 41) % 20);
      travCtx.fillStyle = `rgb(${v}, ${v - 11}, ${v - 30})`;
      travCtx.fillRect(x + 1, y + 1, 62, 30);
    }
  }
  const travertine = finalizeTexture(travCanvas, aniso, 2, 2, true);

  // 5. Sunlit Storybook Terracotta Roof Tiles (Alaturka Kiremit)
  const [roofCanvas, roofCtx] = makeCanvas(256, 256);
  roofCtx.fillStyle = '#D26640';
  roofCtx.fillRect(0, 0, 256, 256);
  for (let x = 0; x < 256; x += 16) {
    const shade = ((x * 13) % 28) - 14;
    roofCtx.fillStyle = `rgb(${222 + shade}, ${110 + Math.floor(shade * 0.7)}, ${68 + Math.floor(shade * 0.4)})`;
    roofCtx.fillRect(x, 0, 11, 256);
    roofCtx.fillStyle = 'rgba(255, 228, 190, 0.28)';
    roofCtx.fillRect(x + 2, 0, 4, 256);
    roofCtx.fillStyle = 'rgba(72, 26, 14, 0.36)';
    roofCtx.fillRect(x + 11, 0, 5, 256);
  }
  for (let y = 0; y < 256; y += 28) {
    roofCtx.fillStyle = 'rgba(74, 28, 14, 0.26)';
    roofCtx.fillRect(0, y, 256, 3);
  }
  const terracottaRoof = finalizeTexture(roofCanvas, aniso, 3, 2, true);

  // 5b. Slate-Blue Zinc Storybook Accent Roof
  const [slateCanvas, slateCtx] = makeCanvas(256, 256);
  slateCtx.fillStyle = '#607B93';
  slateCtx.fillRect(0, 0, 256, 256);
  for (let x = 0; x < 256; x += 20) {
    const shade = ((x * 11) % 18) - 9;
    slateCtx.fillStyle = `rgb(${96 + shade}, ${122 + shade}, ${148 + shade})`;
    slateCtx.fillRect(x, 0, 16, 256);
    slateCtx.fillStyle = 'rgba(28, 38, 52, 0.28)';
    slateCtx.fillRect(x + 16, 0, 4, 256);
  }
  for (let y = 0; y < 256; y += 32) {
    slateCtx.fillStyle = 'rgba(225, 236, 246, 0.18)';
    slateCtx.fillRect(0, y, 256, 2);
  }
  const slateRoof = finalizeTexture(slateCanvas, aniso, 2, 2, true);

  // 5c. Aegean Blue-Teal Tiled Storybook Roof
  const [blueCanvas, blueCtx] = makeCanvas(256, 256);
  blueCtx.fillStyle = '#387A9E';
  blueCtx.fillRect(0, 0, 256, 256);
  for (let x = 0; x < 256; x += 16) {
    const shade = ((x * 9) % 18) - 9;
    blueCtx.fillStyle = `rgb(${54 + shade}, ${124 + shade}, ${160 + shade})`;
    blueCtx.fillRect(x, 0, 12, 256);
    blueCtx.fillStyle = 'rgba(200, 238, 255, 0.22)';
    blueCtx.fillRect(x + 2, 0, 4, 256);
    blueCtx.fillStyle = 'rgba(22, 48, 68, 0.28)';
    blueCtx.fillRect(x + 12, 0, 4, 256);
  }
  for (let y = 0; y < 256; y += 28) {
    blueCtx.fillStyle = 'rgba(18, 42, 60, 0.28)';
    blueCtx.fillRect(0, y, 256, 3);
  }
  const aegeanBlueRoof = finalizeTexture(blueCanvas, aniso, 3, 2, true);

  // 6. Kent Meydanı Warm Sandstone Plaza Tiles
  const [plazaCanvas, plazaCtx] = makeCanvas(256, 256);
  plazaCtx.fillStyle = '#E8DCC6';
  plazaCtx.fillRect(0, 0, 256, 256);
  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 4; c++) {
      const isAccent = (r + c) % 2 === 0;
      plazaCtx.fillStyle = isAccent ? '#F0E6D4' : '#E0D2BA';
      plazaCtx.fillRect(c * 64 + 2, r * 64 + 2, 60, 60);
    }
  }
  const plazaTile = finalizeTexture(plazaCanvas, aniso, 4, 4, true);

  // 7. Sun-Drenched Olive & Meadow Turf with Warm Dappled Grass
  const [grassCanvas, grassCtx] = makeCanvas(256, 256);
  grassCtx.fillStyle = '#92A45D';
  grassCtx.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 60; i++) {
    const cx = (i * 47) % 256;
    const cy = (i * 89) % 256;
    grassCtx.fillStyle = i % 2 === 0 ? 'rgba(176, 184, 96, 0.22)' : 'rgba(114, 138, 72, 0.22)';
    grassCtx.beginPath();
    grassCtx.arc(cx, cy, 14 + (i % 14), 0, Math.PI * 2);
    grassCtx.fill();
  }
  for (let i = 0; i < 2400; i++) {
    const x = (i * 97) % 256;
    const y = (i * 53) % 256;
    const g = 152 + ((i * 29) % 28);
    const warmShift = i % 4 === 0 ? 18 : 0;
    grassCtx.fillStyle = `rgb(${g - 12 + warmShift}, ${g}, ${g - 58})`;
    grassCtx.fillRect(x, y, 2, 3);
  }
  const grassGround = finalizeTexture(grassCanvas, aniso, 28, 28, true);

  // 7b. Golden Harvest Wheat Field Texture
  const [wheatCanvas, wheatCtx] = makeCanvas(256, 256);
  wheatCtx.fillStyle = '#CE9C4E';
  wheatCtx.fillRect(0, 0, 256, 256);
  for (let y = 0; y < 256; y += 8) {
    const shade = ((y * 7) % 22) - 11;
    wheatCtx.fillStyle = `rgb(${210 + shade}, ${156 + shade}, ${78 + Math.floor(shade * 0.5)})`;
    wheatCtx.fillRect(0, y, 256, 5);
    wheatCtx.fillStyle = 'rgba(138, 92, 36, 0.28)';
    wheatCtx.fillRect(0, y + 5, 256, 3);
  }
  for (let i = 0; i < 1000; i++) {
    wheatCtx.fillStyle = i % 2 === 0 ? 'rgba(248, 218, 142, 0.48)' : 'rgba(164, 114, 48, 0.35)';
    wheatCtx.fillRect((i * 61) % 256, (i * 43) % 256, 2, 4);
  }
  const wheatField = finalizeTexture(wheatCanvas, aniso, 6, 6, true);

  // 7c. Aegean Lavender / Wildflower Terrace Texture
  const [lavCanvas, lavCtx] = makeCanvas(256, 256);
  lavCtx.fillStyle = '#9E6CA8';
  lavCtx.fillRect(0, 0, 256, 256);
  for (let y = 0; y < 256; y += 12) {
    lavCtx.fillStyle = '#71834C';
    lavCtx.fillRect(0, y, 256, 3);
    lavCtx.fillStyle = y % 24 === 0 ? '#AE7ABA' : '#915E9F';
    lavCtx.fillRect(0, y + 3, 256, 9);
  }
  for (let i = 0; i < 800; i++) {
    lavCtx.fillStyle = i % 3 === 0 ? 'rgba(232, 198, 240, 0.5)' : 'rgba(105, 58, 120, 0.36)';
    lavCtx.fillRect((i * 83) % 256, (i * 37) % 256, 3, 3);
  }
  const lavenderField = finalizeTexture(lavCanvas, aniso, 5, 5, true);

  // 7d. Warm Sandy Park Dirt Footpath
  const [dirtCanvas, dirtCtx] = makeCanvas(128, 128);
  dirtCtx.fillStyle = '#D5BC94';
  dirtCtx.fillRect(0, 0, 128, 128);
  for (let i = 0; i < 900; i++) {
    const shade = 195 + ((i * 17) % 28);
    dirtCtx.fillStyle = `rgb(${shade + 18}, ${shade - 4}, ${shade - 36})`;
    dirtCtx.fillRect((i * 41) % 128, (i * 71) % 128, 2, 2);
  }
  const dirtPath = finalizeTexture(dirtCanvas, aniso, 3, 3, true);

  // 7e. Subtle Handcrafted Mediterranean Stucco Wall Micro-Grain (tinted by material.color)
  const [stuccoCanvas, stuccoCtx] = makeCanvas(128, 128);
  stuccoCtx.fillStyle = '#FFFFFF';
  stuccoCtx.fillRect(0, 0, 128, 128);
  for (let i = 0; i < 1400; i++) {
    const x = (i * 53) % 128;
    const y = (i * 97) % 128;
    const v = 238 + ((i * 13) % 18);
    stuccoCtx.fillStyle = `rgb(${v}, ${v - 2}, ${v - 5})`;
    stuccoCtx.fillRect(x, y, 2, 2);
  }
  stuccoCtx.fillStyle = 'rgba(120, 90, 60, 0.08)';
  stuccoCtx.fillRect(0, 122, 128, 6);
  const stuccoGrain = finalizeTexture(stuccoCanvas, aniso, 2, 2, true);

  // 7f. Striped Café Awning Canvas
  const [awnCanvas, awnCtx] = makeCanvas(128, 128);
  for (let x = 0; x < 128; x += 16) {
    awnCtx.fillStyle = (x / 16) % 2 === 0 ? '#FFFFFF' : '#FAF0DF';
    awnCtx.fillRect(x, 0, 8, 128);
    awnCtx.fillStyle = (x / 16) % 2 === 0 ? 'rgba(60, 35, 20, 0.22)' : 'rgba(60, 35, 20, 0.32)';
    awnCtx.fillRect(x + 8, 0, 8, 128);
  }
  const stripedAwning = finalizeTexture(awnCanvas, aniso, 2, 1, true);

  // 8. Tekstil Park Industrial Red Brick
  const [brickCanvas, brickCtx] = makeCanvas(256, 256);
  brickCtx.fillStyle = '#9E5440';
  brickCtx.fillRect(0, 0, 256, 256);
  for (let r = 0; r < 16; r++) {
    const y = r * 16;
    const shift = (r % 2) * 16;
    for (let c = -1; c < 9; c++) {
      const x = c * 32 + shift;
      const v = ((r * 19 + c * 31) % 22) - 11;
      brickCtx.fillStyle = `rgb(${180 + v}, ${90 + Math.floor(v * 0.5)}, ${64 + Math.floor(v * 0.4)})`;
      brickCtx.fillRect(x + 1, y + 1, 30, 14);
    }
  }
  const industrialBrick = finalizeTexture(brickCanvas, aniso, 3, 2, true);

  // 9. Ancient Cities "Çok Yakında" Tourist Signboard Texture
  const [signCanvas, signCtx] = makeCanvas(512, 256);
  signCtx.fillStyle = '#4A3423';
  signCtx.fillRect(0, 0, 512, 256);
  signCtx.strokeStyle = '#E0A44B';
  signCtx.lineWidth = 8;
  signCtx.strokeRect(12, 12, 488, 232);

  signCtx.fillStyle = '#FAF2E4';
  signCtx.textAlign = 'center';
  signCtx.font = 'bold 28px sans-serif';
  signCtx.fillText('AYDIN ANTİK KENTLERİ', 256, 68);

  signCtx.fillStyle = '#EAD4B0';
  signCtx.font = '20px sans-serif';
  signCtx.fillText('Nysa · Alabanda · Alinda · Didyma', 256, 114);

  signCtx.fillStyle = '#E0A44B';
  signCtx.fillRect(66, 146, 380, 56);
  signCtx.fillStyle = '#2A1D13';
  signCtx.font = 'bold 23px sans-serif';
  signCtx.fillText('MAGNESIA AÇILDI · BATI YOLU!', 256, 182);

  const ancientSignpost = finalizeTexture(signCanvas, aniso, 1, 1, true);
  ancientSignpost.wrapS = THREE.ClampToEdgeWrapping;
  ancientSignpost.wrapT = THREE.ClampToEdgeWrapping;

  // 10. Soft Radial Contact Shadow
  const [shadCanvas, shadCtx] = makeCanvas(128, 128);
  const grad = shadCtx.createRadialGradient(64, 64, 8, 64, 64, 62);
  grad.addColorStop(0, 'rgba(38, 24, 14, 0.58)');
  grad.addColorStop(0.55, 'rgba(38, 24, 14, 0.24)');
  grad.addColorStop(1, 'rgba(38, 24, 14, 0)');
  shadCtx.fillStyle = grad;
  shadCtx.fillRect(0, 0, 128, 128);
  const contactShadow = new THREE.CanvasTexture(shadCanvas);
  contactShadow.needsUpdate = true;

  // 11. Golden Aegean Beach Sand (wind ripples + fine quartz & shell flecks)
  const [sandCanvas, sandCtx] = makeCanvas(256, 256);
  sandCtx.fillStyle = '#EED49B';
  sandCtx.fillRect(0, 0, 256, 256);
  for (let y = 0; y < 256; y += 16) {
    const gradWave = sandCtx.createLinearGradient(0, y, 0, y + 16);
    gradWave.addColorStop(0, 'rgba(255, 245, 214, 0.24)');
    gradWave.addColorStop(0.5, 'rgba(210, 174, 114, 0.14)');
    gradWave.addColorStop(1, 'rgba(255, 245, 214, 0.24)');
    sandCtx.fillStyle = gradWave;
    sandCtx.fillRect(0, y, 256, 16);
  }
  for (let i = 0; i < 4200; i++) {
    const x = (i * 89) % 256;
    const y = (i * 151) % 256;
    const v = 212 + ((i * 23) % 36);
    sandCtx.fillStyle =
      i % 19 === 0
        ? 'rgba(255, 250, 238, 0.72)'
        : `rgb(${Math.min(252, v + 14)}, ${Math.min(236, v - 4)}, ${Math.max(122, v - 58)})`;
    sandCtx.fillRect(x, y, i % 13 === 0 ? 2 : 1, 1);
  }
  const beachSand = finalizeTexture(sandCanvas, aniso, 2, 2, true);

  // 12. Sunlit Aegean Turquoise Sea Water (caustic light ribbons & gentle foam shimmer)
  const [seaCanvas, seaCtx] = makeCanvas(256, 256);
  const seaGrad = seaCtx.createLinearGradient(0, 0, 0, 256);
  seaGrad.addColorStop(0, '#1893B6');
  seaGrad.addColorStop(0.5, '#25B1CE');
  seaGrad.addColorStop(1, '#3CC4D8');
  seaCtx.fillStyle = seaGrad;
  seaCtx.fillRect(0, 0, 256, 256);
  seaCtx.strokeStyle = 'rgba(185, 244, 252, 0.32)';
  seaCtx.lineWidth = 3;
  for (let row = 0; row < 10; row++) {
    const baseY = row * 26 + 12;
    seaCtx.beginPath();
    for (let x = 0; x <= 256; x += 16) {
      const wy = baseY + Math.sin((x / 256) * Math.PI * 4 + row * 1.1) * 5;
      if (x === 0) seaCtx.moveTo(x, wy);
      else seaCtx.lineTo(x, wy);
    }
    seaCtx.stroke();
  }
  for (let i = 0; i < 320; i++) {
    const x = (i * 67) % 256;
    const y = (i * 113) % 256;
    seaCtx.fillStyle =
      i % 5 === 0 ? 'rgba(240, 253, 255, 0.48)' : 'rgba(14, 118, 152, 0.22)';
    seaCtx.fillRect(x, y, 6 + (i % 7), 2);
  }
  const seaWater = finalizeTexture(seaCanvas, aniso, 2, 2, true);

  // 13. Sun-Bleached Teak Pier & Cabana Wood Deck
  const [deckCanvas, deckCtx] = makeCanvas(256, 256);
  deckCtx.fillStyle = '#B78554';
  deckCtx.fillRect(0, 0, 256, 256);
  const plankCount = 8;
  const plankH = 256 / plankCount;
  for (let p = 0; p < plankCount; p++) {
    const y = p * plankH;
    const shift = ((p * 29) % 18) - 9;
    deckCtx.fillStyle = `rgb(${182 + shift}, ${134 + shift}, ${86 + Math.round(shift * 0.7)})`;
    deckCtx.fillRect(0, y + 1, 256, plankH - 2);
    deckCtx.fillStyle = 'rgba(72, 46, 26, 0.45)';
    deckCtx.fillRect(0, y, 256, 2);
    // Subtle wood grain streaks
    deckCtx.fillStyle = 'rgba(105, 68, 38, 0.16)';
    for (let g = 0; g < 6; g++) {
      const gy = y + 4 + ((g * 5 + p * 3) % (plankH - 6));
      deckCtx.fillRect(0, gy, 256, 1);
    }
    // Plank joint seam
    const seamX = ((p * 97 + 42) % 220) + 18;
    deckCtx.fillStyle = 'rgba(66, 42, 22, 0.48)';
    deckCtx.fillRect(seamX, y, 2, plankH);
  }
  const woodDeck = finalizeTexture(deckCanvas, aniso, 2, 2, true);

  return {
    asphalt,
    cobblestone,
    dirtRoad,
    gravelRoad,
    brickRoad,
    almasik,
    travertine,
    terracottaRoof,
    slateRoof,
    aegeanBlueRoof,
    plazaTile,
    grassGround,
    wheatField,
    lavenderField,
    dirtPath,
    stuccoGrain,
    stripedAwning,
    beachSand,
    seaWater,
    woodDeck,
    industrialBrick,
    ancientSignpost,
    contactShadow,
    dispose: () => {
      asphalt.dispose();
      cobblestone.dispose();
      dirtRoad.dispose();
      gravelRoad.dispose();
      brickRoad.dispose();
      almasik.dispose();
      travertine.dispose();
      terracottaRoof.dispose();
      slateRoof.dispose();
      aegeanBlueRoof.dispose();
      plazaTile.dispose();
      grassGround.dispose();
      wheatField.dispose();
      lavenderField.dispose();
      dirtPath.dispose();
      stuccoGrain.dispose();
      stripedAwning.dispose();
      beachSand.dispose();
      seaWater.dispose();
      woodDeck.dispose();
      industrialBrick.dispose();
      ancientSignpost.dispose();
      contactShadow.dispose();
    },
  };
}
