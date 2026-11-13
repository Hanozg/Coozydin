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
  almasik: THREE.CanvasTexture;
  travertine: THREE.CanvasTexture;
  terracottaRoof: THREE.CanvasTexture;
  plazaTile: THREE.CanvasTexture;
  grassGround: THREE.CanvasTexture;
  industrialBrick: THREE.CanvasTexture;
  ancientSignpost: THREE.CanvasTexture;
  contactShadow: THREE.CanvasTexture;
  dispose: () => void;
}

export function createProceduralTextures(maxAnisotropy: number): ProceduralTextureSet {
  const aniso = Math.max(1, Math.min(8, maxAnisotropy));

  // 1. Warm Mediterranean Asphalt
  const [asphCanvas, asphCtx] = makeCanvas(256, 256);
  asphCtx.fillStyle = '#3E4246';
  asphCtx.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 3200; i++) {
    const x = (i * 73) % 256;
    const y = (i * 137) % 256;
    const shade = 52 + ((i * 19) % 24);
    asphCtx.fillStyle = `rgb(${shade}, ${shade + 2}, ${shade + 4})`;
    asphCtx.fillRect(x, y, 2, 2);
  }
  const asphalt = finalizeTexture(asphCanvas, aniso, 1, 1, true);

  // 2. Cobblestone (Sevgi Yolu & Historic Bazaar)
  const [cobCanvas, cobCtx] = makeCanvas(256, 256);
  cobCtx.fillStyle = '#7E7467';
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
      const tone = 152 + ((r * 31 + c * 17) % 28);
      const warm = 8 + ((r + c) % 3) * 4;
      cobCtx.fillStyle = `rgb(${tone + warm}, ${tone}, ${tone - 10})`;
      cobCtx.beginPath();
      cobCtx.roundRect(x, y, cellW - 4, cellH - 4, 4);
      cobCtx.fill();
    }
  }
  const cobblestone = finalizeTexture(cobCanvas, aniso, 1, 1, true);

  // 3. Almaşık Duvar (Alternating Stone & Ottoman Brick - Nasuh Paşa Külliyesi)
  const [almCanvas, almCtx] = makeCanvas(256, 256);
  almCtx.fillStyle = '#C6B79E';
  almCtx.fillRect(0, 0, 256, 256);
  for (let y = 0; y < 256; y += 32) {
    for (let x = 0; x < 256; x += 48) {
      const v = 198 + ((x + y) % 18);
      almCtx.fillStyle = `rgb(${v}, ${v - 14}, ${v - 34})`;
      almCtx.fillRect(x + 1, y + 1, 46, 18);
    }
    almCtx.fillStyle = '#A85841';
    almCtx.fillRect(0, y + 20, 256, 5);
    almCtx.fillStyle = '#964C37';
    almCtx.fillRect(0, y + 26, 256, 5);
  }
  const almasik = finalizeTexture(almCanvas, aniso, 2, 2, true);

  // 4. Roman Travertine Ashlar (Tralleis Üç Gözler & Bey Camii)
  const [travCanvas, travCtx] = makeCanvas(256, 256);
  travCtx.fillStyle = '#BFB094';
  travCtx.fillRect(0, 0, 256, 256);
  for (let r = 0; r < 8; r++) {
    const y = r * 32;
    const shift = (r % 2) * 32;
    for (let c = -1; c < 5; c++) {
      const x = c * 64 + shift;
      const v = 205 + ((r * 23 + c * 41) % 20);
      travCtx.fillStyle = `rgb(${v}, ${v - 12}, ${v - 30})`;
      travCtx.fillRect(x + 1, y + 1, 62, 30);
    }
  }
  const travertine = finalizeTexture(travCanvas, aniso, 2, 2, true);

  // 5. Terracotta Roof Tiles (Alaturka Kiremit)
  const [roofCanvas, roofCtx] = makeCanvas(256, 256);
  roofCtx.fillStyle = '#B85A3B';
  roofCtx.fillRect(0, 0, 256, 256);
  for (let x = 0; x < 256; x += 16) {
    const shade = ((x * 13) % 24) - 12;
    roofCtx.fillStyle = `rgb(${188 + shade}, ${92 + shade}, ${62 + Math.floor(shade * 0.5)})`;
    roofCtx.fillRect(x, 0, 12, 256);
    roofCtx.fillStyle = 'rgba(40, 16, 10, 0.25)';
    roofCtx.fillRect(x + 12, 0, 4, 256);
  }
  for (let y = 0; y < 256; y += 32) {
    roofCtx.fillStyle = 'rgba(60, 25, 15, 0.18)';
    roofCtx.fillRect(0, y, 256, 3);
  }
  const terracottaRoof = finalizeTexture(roofCanvas, aniso, 2, 2, true);

  // 6. Kent Meydanı Plaza Stone Tiles
  const [plazaCanvas, plazaCtx] = makeCanvas(256, 256);
  plazaCtx.fillStyle = '#DDD2BF';
  plazaCtx.fillRect(0, 0, 256, 256);
  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 4; c++) {
      const isAccent = (r + c) % 2 === 0;
      plazaCtx.fillStyle = isAccent ? '#E6DCCB' : '#D5C8B3';
      plazaCtx.fillRect(c * 64 + 2, r * 64 + 2, 60, 60);
    }
  }
  const plazaTile = finalizeTexture(plazaCanvas, aniso, 4, 4, true);

  // 7. Olive-Green Aegean Terrain Ground
  const [grassCanvas, grassCtx] = makeCanvas(256, 256);
  grassCtx.fillStyle = '#809464';
  grassCtx.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 1600; i++) {
    const x = (i * 97) % 256;
    const y = (i * 53) % 256;
    const g = 135 + ((i * 29) % 25);
    grassCtx.fillStyle = `rgb(${g - 18}, ${g}, ${g - 42})`;
    grassCtx.fillRect(x, y, 3, 3);
  }
  const grassGround = finalizeTexture(grassCanvas, aniso, 24, 24, true);

  // 8. Tekstil Park Industrial Red Brick
  const [brickCanvas, brickCtx] = makeCanvas(256, 256);
  brickCtx.fillStyle = '#8A4837';
  brickCtx.fillRect(0, 0, 256, 256);
  for (let r = 0; r < 16; r++) {
    const y = r * 16;
    const shift = (r % 2) * 16;
    for (let c = -1; c < 9; c++) {
      const x = c * 32 + shift;
      const v = ((r * 19 + c * 31) % 22) - 11;
      brickCtx.fillStyle = `rgb(${164 + v}, ${78 + Math.floor(v * 0.5)}, ${56 + Math.floor(v * 0.4)})`;
      brickCtx.fillRect(x + 1, y + 1, 30, 14);
    }
  }
  const industrialBrick = finalizeTexture(brickCanvas, aniso, 3, 2, true);

  // 9. Ancient Cities "Çok Yakında" Tourist Signboard Texture
  const [signCanvas, signCtx] = makeCanvas(512, 256);
  signCtx.fillStyle = '#3B2C22';
  signCtx.fillRect(0, 0, 512, 256);
  signCtx.strokeStyle = '#D99B43';
  signCtx.lineWidth = 8;
  signCtx.strokeRect(12, 12, 488, 232);

  signCtx.fillStyle = '#F5EFE6';
  signCtx.textAlign = 'center';
  signCtx.font = 'bold 28px sans-serif';
  signCtx.fillText('AYDIN ANTİK KENTLERİ', 256, 68);

  signCtx.fillStyle = '#DFC9A6';
  signCtx.font = '20px sans-serif';
  signCtx.fillText('Nysa · Aphrodisias · Magnesia · Milet', 256, 114);

  signCtx.fillStyle = '#D99B43';
  signCtx.fillRect(86, 146, 340, 56);
  signCtx.fillStyle = '#1D1814';
  signCtx.font = 'bold 24px sans-serif';
  signCtx.fillText('ÇOK YAKINDA · YENİ ROTA!', 256, 182);

  const ancientSignpost = finalizeTexture(signCanvas, aniso, 1, 1, true);
  ancientSignpost.wrapS = THREE.ClampToEdgeWrapping;
  ancientSignpost.wrapT = THREE.ClampToEdgeWrapping;

  // 10. Soft Radial Contact Shadow
  const [shadCanvas, shadCtx] = makeCanvas(128, 128);
  const grad = shadCtx.createRadialGradient(64, 64, 8, 64, 64, 62);
  grad.addColorStop(0, 'rgba(18, 15, 12, 0.65)');
  grad.addColorStop(0.55, 'rgba(18, 15, 12, 0.28)');
  grad.addColorStop(1, 'rgba(18, 15, 12, 0)');
  shadCtx.fillStyle = grad;
  shadCtx.fillRect(0, 0, 128, 128);
  const contactShadow = new THREE.CanvasTexture(shadCanvas);
  contactShadow.needsUpdate = true;

  return {
    asphalt,
    cobblestone,
    almasik,
    travertine,
    terracottaRoof,
    plazaTile,
    grassGround,
    industrialBrick,
    ancientSignpost,
    contactShadow,
    dispose: () => {
      asphalt.dispose();
      cobblestone.dispose();
      almasik.dispose();
      travertine.dispose();
      terracottaRoof.dispose();
      plazaTile.dispose();
      grassGround.dispose();
      industrialBrick.dispose();
      ancientSignpost.dispose();
      contactShadow.dispose();
    },
  };
}
