import {
  FurnitureStyleDef,
  HouseExteriorConfig,
  HouseExteriorStyle,
  VehicleConfig,
} from '../../types/game';

export const PAINT_SWATCHES = [
  { id: 'olive', name: 'Zeytin Yeşili', hex: '#586F4E' },
  { id: 'fig', name: 'Aydın İnciri', hex: '#6E4555' },
  { id: 'cream', name: 'Efeler Krem', hex: '#E6D9C2' },
  { id: 'aegean', name: 'Ege Mavisi', hex: '#3B6E8C' },
  { id: 'pomegranate', name: 'Nar Kırmızısı', hex: '#A63A3A' },
  { id: 'amber', name: 'Gün Batımı', hex: '#C97B36' },
  { id: 'anthracite', name: 'Kömür Grisi', hex: '#34383B' },
] as const;

export const ACCENT_SWATCHES = [
  { id: 'brass', name: 'Pirinç', hex: '#D4A857' },
  { id: 'leather', name: 'Taba Deri', hex: '#8F5632' },
  { id: 'ivory', name: 'Fildişi', hex: '#F3ECE0' },
  { id: 'chrome', name: 'Krom', hex: '#C8CFD6' },
] as const;

export const DEFAULT_VEHICLE_CONFIG: VehicleConfig = {
  type: 'car',
  color: '#586F4E',
  finish: 'gloss',
  accentColor: '#D4A857',
  hasAccessory: true,
  hasStripe: true,
};

export const ROOM_WALL_SWATCHES = [
  { id: 'warm-cream', name: 'Sıcak Krem', hex: '#EADEC9' },
  { id: 'sage', name: 'Zeytin Adaçayı', hex: '#C6D1BC' },
  { id: 'terracotta', name: 'Ege Kiremit', hex: '#D8A990' },
  { id: 'twilight', name: 'Gece Laciverti', hex: '#55657A' },
] as const;

export const FURNITURE_CATALOG: {
  id: 'armchair' | 'desk' | 'bookshelf' | 'rug' | 'plant' | 'turntable' | 'teatable' | 'wallart';
  label: string;
}[] = [
  { id: 'armchair', label: 'Okuma Koltuğu' },
  { id: 'desk', label: 'Çalışma Masası & Ajanda' },
  { id: 'bookshelf', label: 'Ahşap Kitaplık' },
  { id: 'rug', label: 'Dokuma Kilim' },
  { id: 'plant', label: 'Zeytin Saksısı' },
  { id: 'turntable', label: 'Pikap & Lo-Fi Köşesi' },
  { id: 'teatable', label: 'Çay Tepsisi Sehpası' },
  { id: 'wallart', label: 'Tralleis Tablosu' },
];

export const AVATAR_SKIN_SWATCHES = [
  { id: 'fair', name: 'Açık Buğday', hex: '#F2D2B6' },
  { id: 'warm', name: 'Ege Buğdayı', hex: '#E0B28D' },
  { id: 'bronze', name: 'Zeytin Bronz', hex: '#C28A60' },
  { id: 'deep', name: 'Koyu Kahve', hex: '#8A5A3C' },
] as const;

export const AVATAR_SHIRT_SWATCHES = [
  { id: 'terracotta', name: 'Kiremit', hex: '#C85A32' },
  { id: 'olive', name: 'Zeytin', hex: '#5D8A48' },
  { id: 'aegean', name: 'Ege Mavisi', hex: '#3B6E8C' },
  { id: 'ochre', name: 'Sarı', hex: '#D4923F' },
  { id: 'cream', name: 'Krem', hex: '#EAE0CC' },
  { id: 'plum', name: 'İncir Moru', hex: '#6E4555' },
] as const;

export const AVATAR_HAIR_STYLES: { id: 'kasket' | 'short' | 'long' | 'bun'; label: string }[] = [
  { id: 'kasket', label: 'Efeler Kasketi' },
  { id: 'short', label: 'Kısa Saç' },
  { id: 'long', label: 'Uzun Dalgalı' },
  { id: 'bun', label: 'Topuz' },
];

export const DEFAULT_AVATAR_CONFIG = {
  skinColor: '#E0B28D',
  shirtColor: '#C85A32',
  pantsColor: '#3B4D5E',
  hairStyle: 'kasket' as const,
  hairColor: '#3A281E',
};

export const DEFAULT_COZY_ROOM_STATE = {
  wallColor: '#EADEC9',
  floorTone: 'oak' as const,
  lampOn: true,
  petType: 'both' as const,
  petAffection: 3,
  avatarPlaced: true,
  avatarConfig: DEFAULT_AVATAR_CONFIG,
  furniture: [
    { id: 'armchair' as const, enabled: true, slotIndex: 0, styleId: 'classic' },
    { id: 'desk' as const, enabled: true, slotIndex: 0, styleId: 'classic' },
    { id: 'bookshelf' as const, enabled: true, slotIndex: 0, styleId: 'classic' },
    { id: 'rug' as const, enabled: true, slotIndex: 0, styleId: 'classic' },
    { id: 'plant' as const, enabled: true, slotIndex: 0, styleId: 'classic' },
    { id: 'turntable' as const, enabled: true, slotIndex: 0, styleId: 'classic' },
    { id: 'teatable' as const, enabled: true, slotIndex: 0, styleId: 'classic' },
    { id: 'wallart' as const, enabled: true, slotIndex: 0, styleId: 'classic' },
  ],
};

export const HOUSE_STYLE_OPTIONS: {
  id: HouseExteriorStyle;
  name: string;
  subtitle: string;
  defaultWall: string;
  defaultRoof: string;
  defaultTrim: string;
}[] = [
  {
    id: 'cottage_villa',
    name: 'Kır Villası',
    subtitle: 'Dik arduvaz çatı, taş baca, çatı penceresi ve beyaz bahçe çiti',
    defaultWall: '#F4EAD8',
    defaultRoof: '#3E4652',
    defaultTrim: '#F4EAD8',
  },
  {
    id: 'modern_gable',
    name: 'Modern İkiz Çatılı',
    subtitle: 'Çapraz kırma çatı, köşe taş sütunlar ve ikili veranda',
    defaultWall: '#EFE5D3',
    defaultRoof: '#454C56',
    defaultTrim: '#F4EAD8',
  },
  {
    id: 'aegean_veranda',
    name: 'Ege Verandalı Ev',
    subtitle: 'Mavi çatı, geniş ahşap veranda ve bahçe oturma köşesi',
    defaultWall: '#F4EAD8',
    defaultRoof: '#3B6F8C',
    defaultTrim: '#F4EAD8',
  },
  {
    id: 'twin_cottage',
    name: 'İkiz Bahçeli Konak',
    subtitle: 'Yan yana ikiz çatı hacimleri, dairesel camlar ve çiçeklikler',
    defaultWall: '#C5D4B8',
    defaultRoof: '#434A54',
    defaultTrim: '#F4EAD8',
  },
];

export const HOUSE_WALL_SWATCHES = [
  { id: 'ivory', name: 'Fildişi Krem', hex: '#F4EAD8' },
  { id: 'sand', name: 'Aydın Beji', hex: '#E6D6BC' },
  { id: 'sage', name: 'Zeytin Adaçayı', hex: '#B2C49C' },
  { id: 'aegean_sky', name: 'Ege Mavisi', hex: '#94B5C9' },
  { id: 'peach', name: 'Şeftali Sıva', hex: '#E8AF8F' },
  { id: 'terracotta', name: 'Kiremit', hex: '#D47D60' },
  { id: 'ochre', name: 'Hardal Sarısı', hex: '#E2AF4D' },
  { id: 'lavender', name: 'Lavanta Gri', hex: '#C6C2D4' },
] as const;

export const HOUSE_ROOF_SWATCHES = [
  { id: 'slate', name: 'Arduvaz Gri', hex: '#3E4652' },
  { id: 'aegean_blue', name: 'Ege Mavi Çatı', hex: '#3B6F8C' },
  { id: 'terracotta', name: 'Alaturka Kiremit', hex: '#B64C2E' },
  { id: 'copper', name: 'Bakır Yeşili', hex: '#4E7B6D' },
  { id: 'walnut', name: 'Koyu Ceviz', hex: '#5D4033' },
] as const;

export const HOUSE_TRIM_SWATCHES = [
  { id: 'white', name: 'Kireç Beyazı', hex: '#F4EAD8' },
  { id: 'cream', name: 'Sıcak Krem', hex: '#E6D4B5' },
  { id: 'timber', name: 'Koyu Ahşap', hex: '#593D29' },
  { id: 'iron', name: 'Antrasit', hex: '#2F343D' },
] as const;

export const DEFAULT_HOUSE_EXTERIOR: HouseExteriorConfig = {
  style: 'cottage_villa',
  wallColor: '#F4EAD8',
  roofColor: '#3E4652',
  trimColor: '#F4EAD8',
};

export const PROFILE_AVATAR_EMOJIS = ['🏡', '🐦', '🫒', '☕', '🌿', '🎺', '🎨', '🚲'] as const;

export const FURNITURE_STYLE_SHOP: FurnitureStyleDef[] = [
  {
    key: 'armchair:classic',
    furnitureId: 'armchair',
    styleId: 'classic',
    name: 'Kiremit Berjer',
    description: 'Sıcak kiremit döşemeli klasik okuma koltuğu.',
    priceLokma: 0,
    accentHex: '#9B4F3A',
  },
  {
    key: 'armchair:mustard_velvet',
    furnitureId: 'armchair',
    styleId: 'mustard_velvet',
    name: 'Hardal Kadife & Puf',
    description: 'Pirinç ayaklı kadife koltuk ve uyumlu ayak pufu.',
    priceLokma: 1,
    accentHex: '#D4923F',
  },
  {
    key: 'armchair:ege_rattan',
    furnitureId: 'armchair',
    styleId: 'ege_rattan',
    name: 'Ege Hasır Sedir',
    description: 'Çıtalı ahşap iskeletli ve mavi minderli ferah tasarım.',
    priceLokma: 2,
    accentHex: '#3B6E8C',
  },
  {
    key: 'armchair:emerald_lounge',
    furnitureId: 'armchair',
    styleId: 'emerald_lounge',
    name: 'Zümrüt Konak Koltuğu',
    description: 'Derin zümrüt yeşili kapitone ve yan battaniye.',
    priceLokma: 3,
    accentHex: '#3E6B52',
  },
  {
    key: 'turntable:classic',
    furnitureId: 'turntable',
    styleId: 'classic',
    name: 'Ceviz Pikap Kabini',
    description: 'Sade ahşap kabinli klasik vinil pikap.',
    priceLokma: 0,
    accentHex: '#735036',
  },
  {
    key: 'turntable:retro_cream',
    furnitureId: 'turntable',
    styleId: 'retro_cream',
    name: 'Nostaljik Gramofon',
    description: 'Krem gövdeli, pirinç borulu antika gramofon köşesi.',
    priceLokma: 1,
    accentHex: '#D4A857',
  },
  {
    key: 'turntable:vinyl_console',
    furnitureId: 'turntable',
    styleId: 'vinyl_console',
    name: 'Plak Arşiv Konsolu',
    description: 'Çift hoparlörlü ve alt bölmeli geniş plak dolabı.',
    priceLokma: 2,
    accentHex: '#B64C2E',
  },
  {
    key: 'turntable:neon_synth',
    furnitureId: 'turntable',
    styleId: 'neon_synth',
    name: 'Gece Lo-Fi Hi-Fi',
    description: 'Lacivert stüdyo amfisi, ikiz monitör ve sıcak ambiyans ışığı.',
    priceLokma: 3,
    accentHex: '#3B6E8C',
  },
  {
    key: 'rug:classic',
    furnitureId: 'rug',
    styleId: 'classic',
    name: 'Ege Kilimi',
    description: 'Kiremit ve krem çerçeveli geleneksel dokuma halı.',
    priceLokma: 0,
    accentHex: '#9E4738',
  },
  {
    key: 'rug:aegean_round',
    furnitureId: 'rug',
    styleId: 'aegean_round',
    name: 'Yuvarlak Hasır & Çivit',
    description: 'İç içe halkalı hasır ve çivit mavisi yuvarlak halı.',
    priceLokma: 1,
    accentHex: '#4E7B6D',
  },
  {
    key: 'rug:anatolian_navy',
    furnitureId: 'rug',
    styleId: 'anatolian_navy',
    name: 'Yörük Lacivert Halı',
    description: 'Lacivert zeminli, altın geometrik motifli dokuma.',
    priceLokma: 2,
    accentHex: '#2E435A',
  },
  {
    key: 'teatable:classic',
    furnitureId: 'teatable',
    styleId: 'classic',
    name: 'Bakır Tepsili Sehpa',
    description: 'Yuvarlak ahşap sehpa üzerinde ince belli çay ve demlik.',
    priceLokma: 0,
    accentHex: '#D4A857',
  },
  {
    key: 'teatable:marble_coffee',
    furnitureId: 'teatable',
    styleId: 'marble_coffee',
    name: 'Mermer Kahve Sehpası',
    description: 'Pirinç ayaklı beyaz mermer tabla, fincan ve lokumluk.',
    priceLokma: 1,
    accentHex: '#EAE2D3',
  },
  {
    key: 'teatable:floor_sofra',
    furnitureId: 'teatable',
    styleId: 'floor_sofra',
    name: 'Aydın Semaver Sofrası',
    description: 'Kırmızı bakır semaverli ve kete tabaklı geniş ahşap sofra.',
    priceLokma: 2,
    accentHex: '#B85432',
  },
  {
    key: 'bookshelf:classic',
    furnitureId: 'bookshelf',
    styleId: 'classic',
    name: 'Meşe Kitaplık',
    description: 'Üç raflı klasik ahşap kitaplık.',
    priceLokma: 0,
    accentHex: '#735036',
  },
  {
    key: 'bookshelf:library_arch',
    furnitureId: 'bookshelf',
    styleId: 'library_arch',
    name: 'Kemerli Krem Kütüphane',
    description: 'Kemer taçlı krem dolap ve sıcak raf aydınlatması.',
    priceLokma: 2,
    accentHex: '#EADEC9',
  },
  {
    key: 'bookshelf:plant_shelf',
    furnitureId: 'bookshelf',
    styleId: 'plant_shelf',
    name: 'Sarmaşıklı Bohem Raf',
    description: 'Açık raflı, sarkan sarmaşıklı ve seramik vazolu kitaplık.',
    priceLokma: 2,
    accentHex: '#5D8A48',
  },
  {
    key: 'desk:classic',
    furnitureId: 'desk',
    styleId: 'classic',
    name: 'Klasik Meşe Masa',
    description: 'Ajanda ve pirinç lambalı sıcak çalışma masası.',
    priceLokma: 0,
    accentHex: '#735036',
  },
  {
    key: 'desk:architect_draft',
    furnitureId: 'desk',
    styleId: 'architect_draft',
    name: 'Mimar Çizim Masası',
    description: 'Çekmeceli açık meşe masa ve yeşil kütüphane lambası.',
    priceLokma: 2,
    accentHex: '#3E6B52',
  },
  {
    key: 'plant:classic',
    furnitureId: 'plant',
    styleId: 'classic',
    name: 'Zeytin Fidanı',
    description: 'Toprak saksıda minyatür Ege zeytin ağacı.',
    priceLokma: 0,
    accentHex: '#677E56',
  },
  {
    key: 'plant:fig_ceramic',
    furnitureId: 'plant',
    styleId: 'fig_ceramic',
    name: 'Çini Saksıda İncir',
    description: 'Mavi-beyaz desenli seramik saksıda meyveli incir fidanı.',
    priceLokma: 1,
    accentHex: '#3B6E8C',
  },
  {
    key: 'plant:monstera_wicker',
    furnitureId: 'plant',
    styleId: 'monstera_wicker',
    name: 'Hasır Sepetli Çiçek',
    description: 'Örgü hasır sepette büyük yapraklı tropikal salon bitkisi.',
    priceLokma: 2,
    accentHex: '#8E6B47',
  },
  {
    key: 'wallart:classic',
    furnitureId: 'wallart',
    styleId: 'classic',
    name: 'Tralleis Tablosu',
    description: 'Üç Gözler silüetli sıcak yağlıboya tablo.',
    priceLokma: 0,
    accentHex: '#B88154',
  },
  {
    key: 'wallart:aydin_mosaic',
    furnitureId: 'wallart',
    styleId: 'aydin_mosaic',
    name: 'Ege Çini Pano',
    description: 'Turkuaz ve kobalt çini motifli üçlü duvar panosu.',
    priceLokma: 1,
    accentHex: '#2C6F7E',
  },
  {
    key: 'wallart:sunburst_mirror',
    furnitureId: 'wallart',
    styleId: 'sunburst_mirror',
    name: 'Pirinç Güneş Ayna',
    description: 'Yuvarlak pirinç çerçeveli güneş ışını duvar aynası.',
    priceLokma: 2,
    accentHex: '#D4A857',
  },
];

export const DEFAULT_UNLOCKED_FURNITURE_STYLES: string[] = FURNITURE_STYLE_SHOP
  .filter((s) => s.priceLokma === 0)
  .map((s) => s.key);
