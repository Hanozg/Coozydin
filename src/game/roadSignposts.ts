import * as THREE from 'three';
import { ColliderBox } from '../types/game';
import { CityMaterialLibrary } from './materials';
import { PerchSystem } from './perchSystem';
import { getWalkableSurfaceHeightAt } from './terrain';

export type SignCategory = 'city' | 'historic' | 'home';
export type CompassDir = 'N' | 'S' | 'E' | 'W';

export interface ArrowBladeDef {
  label: string;
  dist?: string;
  dir: CompassDir;
  category: SignCategory;
}

export interface CornerSignpostDef {
  id: string;
  x: number;
  z: number;
  junctionTitle: string;
  blades: ArrowBladeDef[];
}

export interface GantryRow {
  arrow: '↑' | '←' | '→';
  label: string;
  dist?: string;
  category: SignCategory;
}

export interface GantrySignDef {
  id: string;
  poleX: number;
  poleZ: number;
  /** Direction the horizontal cantilever arm extends from the pole toward the roadway */
  armDir: CompassDir;
  roadTitle: string;
  /** Entries read by drivers facing the side visible from -armPerp (front) and +armPerp (back) */
  frontTitle: string;
  frontRows: GantryRow[];
  backTitle: string;
  backRows: GantryRow[];
  historicHeader?: boolean;
}

export interface RoadSignpostSystem {
  group: THREE.Group;
  dispose: () => void;
}

const DIRECTION_YAW: Record<CompassDir, number> = {
  E: 0,
  N: Math.PI / 2,
  W: Math.PI,
  S: -Math.PI / 2,
};

const PALETTE: Record<
  SignCategory,
  { bg: string; bgDark: string; border: string; text: string; pillBg: string; pillText: string }
> = {
  city: {
    bg: '#16528E',
    bgDark: '#0F3B68',
    border: '#F7FAFF',
    text: '#FFFFFF',
    pillBg: '#F4C967',
    pillText: '#1A2430',
  },
  historic: {
    bg: '#6D4224',
    bgDark: '#4F2E18',
    border: '#F7E3C6',
    text: '#FFF8EE',
    pillBg: '#E6AF58',
    pillText: '#2A180D',
  },
  home: {
    bg: '#2E6245',
    bgDark: '#204731',
    border: '#EFF5E4',
    text: '#FFFDF6',
    pillBg: '#EBD382',
    pillText: '#192E22',
  },
};

const CORNER_SIGNPOSTS: CornerSignpostDef[] = [
  {
    id: 'menderes_hukumet',
    x: 23.5,
    z: 6.4,
    junctionTitle: 'MENDERES × HÜKÜMET BLV.',
    blades: [
      { label: 'KENT MEYDANI · SEVGİ YOLU', dir: 'W', category: 'city' },
      { label: 'AYDIN BÜYÜKŞEHİR · GAR', dir: 'S', category: 'city' },
      { label: 'FORUM AYDIN · DOĞU BLV.', dir: 'E', category: 'city' },
      { label: 'NASUH PAŞA · TRALLEIS', dir: 'N', category: 'historic' },
    ],
  },
  {
    id: 'menderes_sevgi',
    x: -23.5,
    z: 17.6,
    junctionTitle: 'MENDERES × SEVGİ YOLU',
    blades: [
      { label: 'KENT MEYDANI · BÜYÜKŞEHİR', dir: 'E', category: 'city' },
      { label: 'TEKSTİL PARK · CİHANOĞLU', dir: 'W', category: 'city' },
      { label: 'SICAK YUVAM · RAMAZAN PAŞA', dir: 'N', category: 'home' },
      { label: 'TARİHİ TREN GARI', dir: 'S', category: 'city' },
    ],
  },
  {
    id: 'menderes_yagcilar',
    x: -48.6,
    z: 6.6,
    junctionTitle: 'MENDERES × YAĞCILAR CD.',
    blades: [
      { label: 'NEVZAT BİÇER · TEKSTİL PARK', dir: 'W', category: 'city' },
      { label: 'KENT MEYDANI · SEVGİ YOLU', dir: 'E', category: 'city' },
      { label: 'GAZİ BLV. · MAGNESİA YOLU', dir: 'N', category: 'historic' },
      { label: 'KİPA AVM · İSTASYON CD.', dir: 'S', category: 'city' },
    ],
  },
  {
    id: 'menderes_korfez',
    x: -90.4,
    z: 6.6,
    junctionTitle: 'MENDERES × KÖRFEZ CD.',
    blades: [
      { label: 'NEVZAT BİÇER PARKI · AMFİ', dist: '14m', dir: 'W', category: 'city' },
      { label: 'KİPA AVM · İSTASYON BLV.', dir: 'S', category: 'city' },
      { label: 'TEKSTİL PARK · KENT MEYDANI', dir: 'E', category: 'city' },
      { label: 'MAGNESİA ANTİK YOLU', dir: 'N', category: 'historic' },
    ],
  },
  {
    id: 'menderes_dogu',
    x: 63.5,
    z: 6.6,
    junctionTitle: 'MENDERES × DOĞU BLV.',
    blades: [
      { label: 'FORUM AYDIN AVM', dir: 'S', category: 'city' },
      { label: 'ORTA MAHALLE · ADÜ AYTEPE', dir: 'N', category: 'city' },
      { label: 'KENT MEYDANI · BÜYÜKŞEHİR', dir: 'W', category: 'city' },
      { label: 'NASUH PAŞA KÜLLİYESİ', dir: 'W', category: 'historic' },
    ],
  },
  {
    id: 'gazi_hukumet',
    x: 23.5,
    z: -27.4,
    junctionTitle: 'GAZİ BLV. × HÜKÜMET BLV.',
    blades: [
      { label: 'TRALLEİS ÜÇ GÖZLER', dir: 'N', category: 'historic' },
      { label: 'BEY CAMİİ · ORTA MAHALLE', dir: 'E', category: 'historic' },
      { label: 'RAMAZAN PAŞA · MAGNESİA', dir: 'W', category: 'historic' },
      { label: 'NASUH PAŞA · KENT MEYDANI', dir: 'S', category: 'city' },
    ],
  },
  {
    id: 'gazi_sevgi',
    x: -23.5,
    z: -16.6,
    junctionTitle: 'GAZİ BLV. × SEVGİ YOLU',
    blades: [
      { label: 'MAGNESİA ANTİK KENTİ', dist: '110m', dir: 'W', category: 'historic' },
      { label: 'RAMAZAN PAŞA · CİHANOĞLU', dir: 'W', category: 'historic' },
      { label: 'TRALLEİS ANTİK KENTİ', dir: 'N', category: 'historic' },
      { label: 'SICAK YUVAM · MEYDAN', dir: 'S', category: 'home' },
    ],
  },
  {
    id: 'gazi_yagcilar',
    x: -48.6,
    z: -27.4,
    junctionTitle: 'GAZİ BLV. × YAĞCILAR CD.',
    blades: [
      { label: 'MAGNESİA ARTEMİS TAPINAĞI', dist: '80m', dir: 'W', category: 'historic' },
      { label: 'RAMAZAN PAŞA · BEY CAMİİ', dir: 'E', category: 'historic' },
      { label: 'CİHANOĞLU · TEKSTİL PARK', dir: 'S', category: 'city' },
      { label: 'KALFAKÖY · TRALLEİS', dir: 'N', category: 'historic' },
    ],
  },
  {
    id: 'magnesia_turnoff',
    x: -126.4,
    z: -27.6,
    junctionTitle: 'BATI YOLU × MAGNESİA',
    blades: [
      { label: 'MAGNESİA ANTİK KENTİ', dist: '12m', dir: 'N', category: 'historic' },
      { label: 'EFELER MERKEZ · GAZİ BLV.', dir: 'E', category: 'city' },
      { label: 'GERMENCİK YOLU', dir: 'W', category: 'city' },
    ],
  },
  {
    id: 'tralleis_sevgi',
    x: -12.6,
    z: -63.4,
    junctionTitle: 'TRALLEİS YOLU × SEVGİ',
    blades: [
      { label: 'TRALLEİS ÜÇ GÖZLER', dist: '18m', dir: 'E', category: 'historic' },
      { label: 'SEVGİ YOLU · MEYDAN', dir: 'S', category: 'city' },
      { label: 'KALFAKÖY · MAGNESİA YOLU', dir: 'W', category: 'historic' },
      { label: 'ADÜ AYTEPE ÜNİVERSİTESİ', dir: 'E', category: 'city' },
    ],
  },
  {
    id: 'tralleis_dogu',
    x: 52.6,
    z: -52.6,
    junctionTitle: 'TRALLEİS YOLU × DOĞU BLV.',
    blades: [
      { label: 'ADÜ AYTEPE KAMPÜSÜ', dir: 'N', category: 'city' },
      { label: 'ORTA MAHALLE · ÇEŞME', dir: 'E', category: 'city' },
      { label: 'TRALLEİS ÜÇ GÖZLER', dir: 'W', category: 'historic' },
      { label: 'FORUM AYDIN · DOĞU BLV.', dir: 'S', category: 'city' },
    ],
  },
  {
    id: 'aytepe_dogu',
    x: 52.6,
    z: -90.6,
    junctionTitle: 'AYTEPE BLV. × DOĞU BLV.',
    blades: [
      { label: 'ADÜ KAMPÜS GİRİŞİ', dist: '15m', dir: 'E', category: 'city' },
      { label: 'ORTA MAHALLE · FORUM', dir: 'S', category: 'city' },
      { label: 'TRALLEİS · KALFAKÖY', dir: 'W', category: 'historic' },
    ],
  },
  {
    id: 'istasyon_hukumet',
    x: 23.5,
    z: 42.6,
    junctionTitle: 'İSTASYON CD. × HÜKÜMET',
    blades: [
      { label: 'TARİHİ AYDIN TREN GARI', dir: 'W', category: 'city' },
      { label: 'BÜYÜKŞEHİR · KENT MEYDANI', dir: 'N', category: 'city' },
      { label: 'FORUM AYDIN · DOĞU BLV.', dir: 'E', category: 'city' },
    ],
  },
  {
    id: 'istasyon_sevgi',
    x: -23.5,
    z: 53.4,
    junctionTitle: 'İSTASYON CD. × SEVGİ YOLU',
    blades: [
      { label: 'TARİHİ AYDIN TREN GARI', dir: 'E', category: 'city' },
      { label: 'SEVGİ YOLU · KENT MEYDANI', dir: 'N', category: 'city' },
      { label: 'KİPA AVM · NEVZAT BİÇER', dir: 'W', category: 'city' },
    ],
  },
  {
    id: 'istasyon_korfez',
    x: -90.4,
    z: 42.6,
    junctionTitle: 'İSTASYON CD. × KÖRFEZ',
    blades: [
      { label: 'AYDIN KİPA AVM', dist: '16m', dir: 'E', category: 'city' },
      { label: 'NEVZAT BİÇER PARKI', dist: '18m', dir: 'N', category: 'city' },
      { label: 'TARİHİ AYDIN TREN GARI', dir: 'E', category: 'city' },
    ],
  },
];

const GANTRY_SIGNS: GantrySignDef[] = [
  {
    id: 'gantry_menderes_west',
    poleX: -34,
    poleZ: 17.5,
    armDir: 'N',
    roadTitle: 'ADNAN MENDERES BLV.',
    // Front faces -X (drivers heading East toward Kent Meydanı)
    frontTitle: 'ADNAN MENDERES BLV. · DOĞU YÖNÜ',
    frontRows: [
      { arrow: '↑', label: 'KENT MEYDANI · BÜYÜKŞEHİR', dist: '35m', category: 'city' },
      { arrow: '←', label: 'SEVGİ YOLU · RAMAZAN PAŞA', category: 'historic' },
      { arrow: '→', label: 'TARİHİ AYDIN TREN GARI', category: 'city' },
    ],
    // Back faces +X (drivers heading West toward Tekstil Park & Nevzat Biçer)
    backTitle: 'ADNAN MENDERES BLV. · BATI YÖNÜ',
    backRows: [
      { arrow: '↑', label: 'NEVZAT BİÇER · TEKSTİL PARK', dist: '40m', category: 'city' },
      { arrow: '→', label: 'SICAK YUVAM · MAGNESİA', category: 'home' },
      { arrow: '←', label: 'KİPA AVM · İSTASYON BLV.', category: 'city' },
    ],
  },
  {
    id: 'gantry_menderes_east',
    poleX: 31.5,
    poleZ: 6.5,
    armDir: 'S',
    roadTitle: 'ADNAN MENDERES BLV.',
    // armDir is S (+Z), so front faces -X (heading East) and back faces +X (heading West)
    frontTitle: 'ADNAN MENDERES BLV. · DOĞU YÖNÜ',
    frontRows: [
      { arrow: '↑', label: 'FORUM AYDIN · DOĞU BLV.', dist: '45m', category: 'city' },
      { arrow: '←', label: 'ORTA MAHALLE · ADÜ AYTEPE', category: 'city' },
      { arrow: '→', label: 'AYDIN BÜYÜKŞEHİR BELEDİYESİ', category: 'city' },
    ],
    backTitle: 'ADNAN MENDERES BLV. · MERKEZ',
    backRows: [
      { arrow: '↑', label: 'KENT MEYDANI · SEVGİ YOLU', dist: '30m', category: 'city' },
      { arrow: '→', label: 'NASUH PAŞA · TRALLEİS', category: 'historic' },
      { arrow: '←', label: 'TARİHİ AYDIN TREN GARI', category: 'city' },
    ],
  },
  {
    id: 'gantry_gazi_magnesia',
    poleX: -86,
    poleZ: -16.5,
    armDir: 'N',
    roadTitle: 'GAZİ BLV. · MAGNESİA YOLU',
    historicHeader: true,
    // Front faces -X (heading East back into Efeler)
    frontTitle: 'EFELER MERKEZ YÖNÜ',
    frontRows: [
      { arrow: '↑', label: 'RAMAZAN PAŞA · BEY CAMİİ', dist: '50m', category: 'historic' },
      { arrow: '→', label: 'CİHANOĞLU · TEKSTİL PARK', category: 'city' },
      { arrow: '←', label: 'TRALLEİS ÜÇ GÖZLER', category: 'historic' },
    ],
    // Back faces +X (heading West toward Magnesia)
    backTitle: 'BATI ANTİK KENT ROTASI',
    backRows: [
      { arrow: '↑', label: 'MAGNESİA ANTİK KENTİ', dist: '45m', category: 'historic' },
      { arrow: '→', label: 'ARTEMİS TAPINAĞI · MOZAİKLER', category: 'historic' },
      { arrow: '←', label: 'GERMENCİK YOLU', category: 'city' },
    ],
  },
  {
    id: 'gantry_hukumet_south',
    poleX: 23.5,
    poleZ: 34,
    armDir: 'W',
    roadTitle: 'HÜKÜMET BULVARI',
    // Road is N-S; front faces +Z (heading North), back faces -Z (heading South)
    frontTitle: 'HÜKÜMET BLV. · KUZEY YÖNÜ',
    frontRows: [
      { arrow: '↑', label: 'KENT MEYDANI · NASUH PAŞA', dist: '25m', category: 'city' },
      { arrow: '→', label: 'AYDIN BÜYÜKŞEHİR BELEDİYESİ', category: 'city' },
      { arrow: '←', label: 'SEVGİ YOLU · TEKSTİL PARK', category: 'city' },
    ],
    backTitle: 'HÜKÜMET BLV. · GÜNEY YÖNÜ',
    backRows: [
      { arrow: '↑', label: 'İSTASYON CD. · TREN GARI', dist: '32m', category: 'city' },
      { arrow: '←', label: 'FORUM AYDIN AVM', category: 'city' },
      { arrow: '→', label: 'TARİHİ TREN GARI PERONU', category: 'city' },
    ],
  },
  {
    id: 'gantry_dogu_adu',
    poleX: 52.5,
    poleZ: -72,
    armDir: 'E',
    roadTitle: 'DOĞU BLV. · AYTEPE YOKUŞU',
    // Road is N-S; front faces +Z (heading North to ADÜ), back faces -Z (heading South)
    frontTitle: 'AYTEPE ÜNİVERSİTE YOKUŞU',
    frontRows: [
      { arrow: '↑', label: 'ADÜ AYTEPE KAMPÜSÜ', dist: '24m', category: 'city' },
      { arrow: '→', label: 'REKTÖRLÜK · KÜTÜPHANE', category: 'city' },
      { arrow: '←', label: 'TRALLEİS ÜÇ GÖZLER', category: 'historic' },
    ],
    backTitle: 'DOĞU BULVARI · MERKEZ YÖNÜ',
    backRows: [
      { arrow: '↑', label: 'ORTA MAHALLE · FORUM AYDIN', dist: '30m', category: 'city' },
      { arrow: '→', label: 'TRALLEİS YOLU · SEVGİ YOLU', category: 'historic' },
      { arrow: '←', label: 'ORTA MAHALLE ÇEŞMESİ', category: 'city' },
    ],
  },
  {
    id: 'gantry_sevgi_north',
    poleX: -12.5,
    poleZ: -40,
    armDir: 'W',
    roadTitle: 'SEVGİ YOLU · KUZEY',
    // Road is N-S; front faces +Z (heading North to Tralleis), back faces -Z (heading South to Kent Meydanı)
    frontTitle: 'SEVGİ YOLU · TRALLEİS YÖNÜ',
    frontRows: [
      { arrow: '↑', label: 'TRALLEİS ANTİK KENTİ', dist: '36m', category: 'historic' },
      { arrow: '←', label: 'RAMAZAN PAŞA · MAGNESİA', category: 'historic' },
      { arrow: '→', label: 'BEY CAMİİ · ADÜ AYTEPE', category: 'historic' },
    ],
    backTitle: 'SEVGİ YOLU · MERKEZ YÖNÜ',
    backRows: [
      { arrow: '↑', label: 'KENT MEYDANI · TREN GARI', dist: '50m', category: 'city' },
      { arrow: '→', label: 'SICAK YUVAM · CİHANOĞLU', category: 'home' },
      { arrow: '←', label: 'NASUH PAŞA · BÜYÜKŞEHİR', category: 'city' },
    ],
  },
];

function createArrowBladeGeometry(length = 2.76, height = 0.44, depth = 0.06): THREE.BufferGeometry {
  const halfL = length / 2;
  const shoulderX = halfL - 0.38;
  const halfH = height / 2;

  const shape = new THREE.Shape();
  shape.moveTo(-halfL, -halfH);
  shape.lineTo(shoulderX, -halfH);
  shape.lineTo(halfL, 0);
  shape.lineTo(shoulderX, halfH);
  shape.lineTo(-halfL, halfH);
  shape.closePath();

  const geo = new THREE.ExtrudeGeometry(shape, {
    depth,
    bevelEnabled: true,
    bevelThickness: 0.012,
    bevelSize: 0.012,
    bevelSegments: 1,
  });
  geo.translate(0, 0, -depth / 2);
  return geo;
}

function createBladeTexture(
  label: string,
  dist: string | undefined,
  category: SignCategory,
  side: 'front' | 'back'
): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 96;
  const ctx = canvas.getContext('2d')!;
  const pal = PALETTE[category];

  const grad = ctx.createLinearGradient(0, 0, 0, 96);
  grad.addColorStop(0, pal.bg);
  grad.addColorStop(1, pal.bgDark);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 512, 96);

  ctx.strokeStyle = pal.border;
  ctx.lineWidth = 4;
  ctx.strokeRect(5, 5, 502, 86);

  // Draw crisp arrow chevron pointing toward the 3D tip
  const drawChevron = (cx: number, pointRight: boolean) => {
    ctx.fillStyle = pal.pillBg;
    ctx.beginPath();
    if (pointRight) {
      ctx.moveTo(cx - 18, 25);
      ctx.lineTo(cx + 18, 48);
      ctx.lineTo(cx - 18, 71);
      ctx.lineTo(cx - 8, 48);
    } else {
      ctx.moveTo(cx + 18, 25);
      ctx.lineTo(cx - 18, 48);
      ctx.lineTo(cx + 18, 71);
      ctx.lineTo(cx + 8, 48);
    }
    ctx.closePath();
    ctx.fill();
  };

  ctx.textBaseline = 'middle';
  if (side === 'front') {
    // +Z face: left = tail (-X), right = tip (+X)
    drawChevron(472, true);
    let maxTextW = 415;
    if (dist) {
      ctx.fillStyle = pal.pillBg;
      ctx.beginPath();
      ctx.roundRect(356, 26, 82, 44, 10);
      ctx.fill();
      ctx.fillStyle = pal.pillText;
      ctx.font = 'bold 24px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(dist, 397, 49);
      maxTextW = 324;
    }
    ctx.fillStyle = pal.text;
    ctx.font = 'bold 30px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(label, 24, 49, maxTextW);
  } else {
    // -Z face (rotated PI): left = tip (+X), right = tail (-X)
    drawChevron(40, false);
    let maxTextW = 415;
    if (dist) {
      ctx.fillStyle = pal.pillBg;
      ctx.beginPath();
      ctx.roundRect(408, 26, 82, 44, 10);
      ctx.fill();
      ctx.fillStyle = pal.pillText;
      ctx.font = 'bold 24px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(dist, 449, 49);
      maxTextW = 314;
    }
    ctx.fillStyle = pal.text;
    ctx.font = 'bold 30px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(label, 78, 49, maxTextW);
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  tex.wrapS = THREE.ClampToEdgeWrapping;
  tex.wrapT = THREE.ClampToEdgeWrapping;
  tex.needsUpdate = true;
  return tex;
}

function createIntersectionHeaderTexture(title: string): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 88;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#142A3E';
  ctx.fillRect(0, 0, 512, 88);

  ctx.strokeStyle = '#E0A44B';
  ctx.lineWidth = 5;
  ctx.strokeRect(5, 5, 502, 78);

  ctx.fillStyle = '#FFF6E5';
  ctx.font = 'bold 28px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(title, 256, 45, 476);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  tex.wrapS = THREE.ClampToEdgeWrapping;
  tex.wrapT = THREE.ClampToEdgeWrapping;
  tex.needsUpdate = true;
  return tex;
}

function createGantryBoardTexture(
  title: string,
  rows: GantryRow[],
  historicHeader = false
): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 640;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#0F253A';
  ctx.fillRect(0, 0, 640, 256);

  // Top Header Strip
  ctx.fillStyle = historicHeader ? '#5E361B' : '#14385C';
  ctx.fillRect(0, 0, 640, 56);
  ctx.fillStyle = '#E6B257';
  ctx.fillRect(0, 54, 640, 4);

  ctx.fillStyle = '#FFF6E6';
  ctx.font = 'bold 26px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(title, 320, 29, 608);

  // Outer Frame
  ctx.strokeStyle = '#E6EEF7';
  ctx.lineWidth = 6;
  ctx.strokeRect(3, 3, 634, 250);

  // 3 Color-Coded Direction Rows
  const rowH = 58;
  const startY = 66;
  rows.slice(0, 3).forEach((row, idx) => {
    const ry = startY + idx * (rowH + 4);
    const pal = PALETTE[row.category];

    ctx.fillStyle = pal.bg;
    ctx.beginPath();
    ctx.roundRect(14, ry, 612, rowH, 8);
    ctx.fill();

    ctx.strokeStyle = 'rgba(255,255,255,0.45)';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Arrow badge on left
    ctx.fillStyle = pal.pillBg;
    ctx.beginPath();
    ctx.roundRect(22, ry + 8, 48, 42, 7);
    ctx.fill();

    ctx.fillStyle = pal.pillText;
    ctx.font = 'bold 34px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(row.arrow, 46, ry + 31);

    // Destination text
    ctx.fillStyle = pal.text;
    ctx.font = 'bold 27px sans-serif';
    ctx.textAlign = 'left';
    const maxW = row.dist ? 448 : 532;
    ctx.fillText(row.label, 84, ry + 30, maxW);

    if (row.dist) {
      ctx.fillStyle = pal.pillBg;
      ctx.beginPath();
      ctx.roundRect(542, ry + 11, 74, 36, 7);
      ctx.fill();
      ctx.fillStyle = pal.pillText;
      ctx.font = 'bold 21px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(row.dist, 579, ry + 30);
    }
  });

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  tex.wrapS = THREE.ClampToEdgeWrapping;
  tex.wrapT = THREE.ClampToEdgeWrapping;
  tex.needsUpdate = true;
  return tex;
}

export function buildMainRoadSignposts(
  mats: CityMaterialLibrary,
  colliders: ColliderBox[],
  perches: PerchSystem
): RoadSignpostSystem {
  const group = new THREE.Group();
  const disposables: { dispose: () => void }[] = [];

  const poleSteelMat = new THREE.MeshStandardMaterial({
    color: 0x3b4856,
    roughness: 0.42,
    metalness: 0.62,
  });
  const collarBrassMat = new THREE.MeshStandardMaterial({
    color: 0xd6a64c,
    roughness: 0.36,
    metalness: 0.72,
  });
  const frameBackMat = new THREE.MeshStandardMaterial({
    color: 0x26313d,
    roughness: 0.52,
    metalness: 0.35,
  });
  disposables.push(poleSteelMat, collarBrassMat, frameBackMat);

  const bladeGeo = createArrowBladeGeometry(2.76, 0.44, 0.06);
  const bladeFaceGeo = new THREE.PlaneGeometry(2.22, 0.36);
  const headerBoxGeo = new THREE.BoxGeometry(2.26, 0.42, 0.08);
  const headerFaceGeo = new THREE.PlaneGeometry(2.14, 0.36);
  const plinthGeo = new THREE.CylinderGeometry(0.32, 0.38, 0.42, 8);
  const flangeGeo = new THREE.CylinderGeometry(0.18, 0.22, 0.14, 10);
  const cornerPoleGeo = new THREE.CylinderGeometry(0.085, 0.105, 4.1, 10);
  const finialGeo = new THREE.SphereGeometry(0.14, 10, 8);
  disposables.push(
    bladeGeo,
    bladeFaceGeo,
    headerBoxGeo,
    headerFaceGeo,
    plinthGeo,
    flangeGeo,
    cornerPoleGeo,
    finialGeo
  );

  // 1. Multi-Blade 3D Directional Signposts at Major Intersections
  CORNER_SIGNPOSTS.forEach((def) => {
    const signGroup = new THREE.Group();
    const groundY = getWalkableSurfaceHeightAt(def.x, def.z);
    signGroup.position.set(def.x, groundY, def.z);

    // Stone pedestal plinth + base flange + steel pole + brass finial
    const plinth = new THREE.Mesh(plinthGeo, mats.travertine);
    plinth.position.y = 0.21;
    plinth.castShadow = true;
    plinth.receiveShadow = true;

    const flange = new THREE.Mesh(flangeGeo, collarBrassMat);
    flange.position.y = 0.46;

    const pole = new THREE.Mesh(cornerPoleGeo, poleSteelMat);
    pole.position.y = 2.45;
    pole.castShadow = true;

    const finial = new THREE.Mesh(finialGeo, collarBrassMat);
    finial.position.y = 4.55;

    signGroup.add(plinth, flange, pole, finial);

    // Top Street / Intersection Name Header Plaque (double-sided along +Z / -Z and tilted slightly for isometric readability)
    const headerGroup = new THREE.Group();
    headerGroup.position.y = 4.22;
    headerGroup.rotation.y = Math.PI / 4;
    const headerBody = new THREE.Mesh(headerBoxGeo, frameBackMat);
    headerBody.castShadow = true;
    const headerTex = createIntersectionHeaderTexture(def.junctionTitle);
    const headerFaceMat = new THREE.MeshStandardMaterial({
      map: headerTex,
      roughness: 0.45,
      metalness: 0.08,
    });
    disposables.push(headerTex, headerFaceMat);

    const hFront = new THREE.Mesh(headerFaceGeo, headerFaceMat);
    hFront.position.z = 0.044;
    const hBack = new THREE.Mesh(headerFaceGeo, headerFaceMat);
    hBack.rotation.y = Math.PI;
    hBack.position.z = -0.044;
    headerGroup.add(headerBody, hFront, hBack);
    signGroup.add(headerGroup);

    // Stacked 3D Arrow Blades pointing toward each destination
    def.blades.forEach((blade, bIdx) => {
      const bladeGroup = new THREE.Group();
      const yPos = 3.68 - bIdx * 0.51;
      bladeGroup.position.set(0, yPos, 0);
      bladeGroup.rotation.y = DIRECTION_YAW[blade.dir];

      const ring = new THREE.Mesh(
        new THREE.CylinderGeometry(0.115, 0.115, 0.14, 10),
        collarBrassMat
      );
      bladeGroup.add(ring);

      const bladeOffset = 1.05;
      const plankHolder = new THREE.Group();
      plankHolder.position.x = bladeOffset;

      const plankMesh = new THREE.Mesh(bladeGeo, frameBackMat);
      plankMesh.castShadow = true;
      plankHolder.add(plankMesh);

      const frontTex = createBladeTexture(blade.label, blade.dist, blade.category, 'front');
      const backTex = createBladeTexture(blade.label, blade.dist, blade.category, 'back');
      const frontMat = new THREE.MeshStandardMaterial({
        map: frontTex,
        roughness: 0.44,
        metalness: 0.06,
      });
      const backMat = new THREE.MeshStandardMaterial({
        map: backTex,
        roughness: 0.44,
        metalness: 0.06,
      });
      disposables.push(frontTex, backTex, frontMat, backMat);

      const frontPlane = new THREE.Mesh(bladeFaceGeo, frontMat);
      frontPlane.position.set(-0.14, 0, 0.044);

      const backPlane = new THREE.Mesh(bladeFaceGeo, backMat);
      backPlane.rotation.y = Math.PI;
      backPlane.position.set(-0.14, 0, -0.044);

      plankHolder.add(frontPlane, backPlane);
      bladeGroup.add(plankHolder);
      signGroup.add(bladeGroup);
    });

    group.add(signGroup);

    colliders.push({
      minX: def.x - 0.36,
      maxX: def.x + 0.36,
      minZ: def.z - 0.36,
      maxZ: def.z + 0.36,
      maxY: groundY + 4.6,
    });
  });

  // 2. High-Clearance Arterial Cantilever Gantry Signs over Main Boulevards
  const gantryPlinthGeo = new THREE.BoxGeometry(0.95, 0.56, 0.95);
  const gantryMastGeo = new THREE.CylinderGeometry(0.14, 0.18, 5.55, 12);
  const gantryArmGeo = new THREE.CylinderGeometry(0.1, 0.12, 4.15, 10);
  const gantryBoardGeo = new THREE.BoxGeometry(3.6, 1.44, 0.14);
  const gantryFaceGeo = new THREE.PlaneGeometry(3.48, 1.34);
  disposables.push(gantryPlinthGeo, gantryMastGeo, gantryArmGeo, gantryBoardGeo, gantryFaceGeo);

  GANTRY_SIGNS.forEach((g) => {
    const gantryGroup = new THREE.Group();
    const groundY = getWalkableSurfaceHeightAt(g.poleX, g.poleZ);
    gantryGroup.position.set(g.poleX, groundY, g.poleZ);
    // Rotate local +X arm to point along g.armDir over the road
    gantryGroup.rotation.y = DIRECTION_YAW[g.armDir];

    const plinth = new THREE.Mesh(gantryPlinthGeo, mats.travertine);
    plinth.position.y = 0.28;
    plinth.castShadow = true;
    plinth.receiveShadow = true;

    const mast = new THREE.Mesh(gantryMastGeo, poleSteelMat);
    mast.position.y = 3.05;
    mast.castShadow = true;

    const arm = new THREE.Mesh(gantryArmGeo, poleSteelMat);
    arm.rotation.z = -Math.PI / 2;
    arm.position.set(2.05, 5.45, 0);
    arm.castShadow = true;

    const gusset = new THREE.Mesh(
      new THREE.BoxGeometry(1.55, 0.12, 0.12),
      collarBrassMat
    );
    gusset.position.set(0.68, 4.82, 0);
    gusset.rotation.z = 0.66;

    const armTipCap = new THREE.Mesh(finialGeo, collarBrassMat);
    armTipCap.position.set(4.15, 5.45, 0);

    // Overhead Boulevard Directory Board (bottom at y = 4.02m — completely clear of vehicles & pedestrians)
    const boardGroup = new THREE.Group();
    boardGroup.position.set(2.35, 4.74, 0);

    const boardMesh = new THREE.Mesh(gantryBoardGeo, frameBackMat);
    boardMesh.castShadow = true;

    const frontTex = createGantryBoardTexture(g.frontTitle, g.frontRows, g.historicHeader);
    const backTex = createGantryBoardTexture(g.backTitle, g.backRows, g.historicHeader);
    const frontMat = new THREE.MeshStandardMaterial({
      map: frontTex,
      roughness: 0.42,
      metalness: 0.06,
    });
    const backMat = new THREE.MeshStandardMaterial({
      map: backTex,
      roughness: 0.42,
      metalness: 0.06,
    });
    disposables.push(frontTex, backTex, frontMat, backMat);

    // Orient board face normals perpendicular to the road direction:
    // If armDir is N or S (road runs E-W), local +Z points along W/E road traffic!
    // Wait: let's check front/back orientation carefully!
    // When g.armDir === 'N' (rotY = +PI/2): local +Z maps to +X (East), local -Z maps to -X (West)!
    // When g.armDir === 'S' (rotY = -PI/2): local +Z maps to -X (West), local -Z maps to +X (East)!
    // When g.armDir === 'W' (rotY = PI): local +Z maps to -Z (North), local -Z maps to +Z (South)!
    // When g.armDir === 'E' (rotY = 0): local +Z maps to +Z (South), local -Z maps to -Z (North)!
    const flipFaces = g.armDir === 'N' || g.armDir === 'W';

    const frontPlane = new THREE.Mesh(gantryFaceGeo, flipFaces ? backMat : frontMat);
    frontPlane.position.z = 0.076;

    const backPlane = new THREE.Mesh(gantryFaceGeo, flipFaces ? frontMat : backMat);
    backPlane.rotation.y = Math.PI;
    backPlane.position.z = -0.076;

    // Two vertical hanger brackets clamping the board to the overhead steel arm
    [-1.1, 1.1].forEach((bx) => {
      const bracket = new THREE.Mesh(
        new THREE.BoxGeometry(0.11, 0.36, 0.18),
        collarBrassMat
      );
      bracket.position.set(bx, 0.72, 0);
      boardGroup.add(bracket);
    });

    boardGroup.add(boardMesh, frontPlane, backPlane);
    gantryGroup.add(plinth, mast, arm, gusset, armTipCap, boardGroup);
    group.add(gantryGroup);

    // Sparrow perch along top of cantilever arm
    const yaw = DIRECTION_YAW[g.armDir];
    const cosY = Math.cos(yaw);
    const sinY = Math.sin(yaw);
    const toWorld = (lx: number, ly: number) =>
      new THREE.Vector3(g.poleX + lx * cosY, groundY + ly, g.poleZ - lx * sinY);
    perches.addStaticSegment(
      `gantry_${g.id}`,
      toWorld(0.35, 5.56),
      toWorld(3.95, 5.56),
      0.11,
      'metal'
    );

    colliders.push({
      minX: g.poleX - 0.5,
      maxX: g.poleX + 0.5,
      minZ: g.poleZ - 0.5,
      maxZ: g.poleZ + 0.5,
      maxY: groundY + 5.6,
    });
  });

  return {
    group,
    dispose: () => {
      disposables.forEach((d) => d.dispose());
    },
  };
}
