import { DistrictZone, ErrandDef, LandmarkDef, TimeOfDay, VehicleConfig } from '../types/game';

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

export const LANDMARKS: LandmarkDef[] = [
  {
    id: 'tralleis',
    name: 'Tralleis Antik Kenti — Üç Gözler',
    era: 'MS 2. Yüzyıl · Roma Dönemi',
    district: 'Kalfaköy Yamacı',
    position: [0, 0, -76],
    interactionRadius: 14,
    summary:
      'Antik Tralleis kentinin günümüze ulaşan en görkemli simgesi olan Üç Gözler, Roma dönemine ait büyük gymnasion yapısının anıtsal kemerli girişidir.',
    architectureNote:
      'Kesme traverten bloklardan inşa edilen üç yüksek yuvarlak kemer, profilli başlıklar ve üst friz kalıntıları Aydın ovasına kuzey yamaçtan bakar.',
    rewardCoins: 40,
  },
  {
    id: 'ramazanpasa',
    name: 'Ramazan Paşa Camii & Çarşısı',
    era: '1595 · Osmanlı Klasik Dönem',
    district: 'Tarihi Çarşı',
    position: [-36, 0, -36],
    interactionRadius: 13,
    summary:
      'Aydın çarşı dokusunun merkezinde yer alan Ramazan Paşa Camii, çevresindeki cumbalı geleneksel evler ve eski esnaf sokaklarıyla kentin yaşayan hafızasıdır.',
    architectureNote:
      'Kare planlı harim, tek kubbeli örtü, kemerli son cemaat revakı ve kiremit çatılı çarşı dükkanlarıyla çevrili samimi bir avlu düzenine sahiptir.',
    rewardCoins: 30,
    doorPosition: [-37.5, -31],
  },
  {
    id: 'beycamii',
    name: 'Bey Camii (Süleyman Bey Camii)',
    era: '1683 · Osmanlı Dönemi',
    district: 'Gazi Bulvarı',
    position: [36, 0, -36],
    interactionRadius: 13,
    summary:
      'Üveys Paşa’nın torunu Süleyman Bey tarafından 17. yüzyılda yaptırılan cami, zarif oranları ve yüksek minaresiyle Efeler silüetinin öne çıkan yapılarındandır.',
    architectureNote:
      'Sekizgen kasnak üzerine oturan kurşun kaplı ana kubbe, üç küçük kubbeli son cemaat yeri ve tek şerefeli taş minaresiyle dikkat çeker.',
    rewardCoins: 30,
    doorPosition: [36, -31],
  },
  {
    id: 'cihanoglu',
    name: 'Cihanoğlu Külliyesi & Kulesi',
    era: '1756 · Osmanlı Barok Etkili',
    district: 'Yağcılar İçi',
    position: [-72, 0, -6],
    interactionRadius: 14,
    summary:
      'Bölgenin köklü ayan ailesi Cihanoğulları tarafından inşa edilen külliye; cami, medrese odaları, şadırvan ve savunma amaçlı tarihi taş kulesiyle eşsizdir.',
    architectureNote:
      'Dalgalı barok alınlıklar, avluyu saran sivri kemerli medrese revakları ve köşede yükselen mazgallı Cihanoğlu Kulesi özgün bir bütün oluşturur.',
    rewardCoins: 35,
    doorPosition: [-64, -6],
  },
  {
    id: 'nasuhpasa',
    name: 'Nasuh Paşa Külliyesi (Zincirli Han)',
    era: '1708 · Osmanlı Han Mimarisi',
    district: 'Kemerköy / Merkez',
    position: [36, 0, -5],
    interactionRadius: 15,
    summary:
      'Sadrazam Nasuh Paşa’nın yaptırdığı külliye; iki katlı avlulu Zincirli Han, mescit, hamam ve ortasındaki şadırvanıyla kervan yollarının durak noktasıydı.',
    architectureNote:
      'Sıralı taş ve tuğladan oluşan almaşık duvar örgüsü, iki katlı revaklı iç avlu, alaturka kiremit çatı ve sekizgen şadırvan yapının kalbidir.',
    rewardCoins: 35,
    doorPosition: [28, -5],
  },
  {
    id: 'kentmeydani',
    name: 'Atatürk Kent Meydanı & Efeler Anıtı',
    era: 'Cumhuriyet Meydanı',
    district: 'Efeler Merkez',
    position: [0, 0, 12],
    interactionRadius: 18,
    summary:
      'Palmiyelerle bezeli Adnan Menderes Bulvarı’nın kalbindeki geniş meydan; yansıtma havuzları, Efeler Anıtı ve tam ortasında büyüyen Aydın İncir Ağacı ile buluşma noktasıdır.',
    architectureNote:
      'Geniş traverten dairesel meydan, iki kanatta yansıtma havuzları, oturma bankları, pergolalar ve bronz Efeler heykel kaidesi etrafında canlı bir kent yaşamı sunar.',
    rewardCoins: 25,
  },
  {
    id: 'saribelediye',
    name: 'Tarihi Sarı Belediye Binası',
    era: 'Cumhuriyet Dönemi · Simge Yapı',
    district: 'Hükümet & Meydan',
    position: [36, 0, 28],
    interactionRadius: 14,
    summary:
      'Sıcak hardal sarısı cephesi ve klasik taş detaylarıyla Efeler kent merkezinin en sevilen sivil mimari simgelerinden biridir.',
    architectureNote:
      'Sütunlu giriş sahanlığı, kemerli yüksek pencereler, simetrik alınlık saati ve kırma alaturka kiremit çatısıyla Aydın’ın sıcak tonunu taşır.',
    rewardCoins: 35,
    doorPosition: [28.5, 28],
  },
  {
    id: 'tekstilpark',
    name: 'Tekstil Park (Sümerbank Yerleşkesi)',
    era: '1950’ler Endüstri Mirası & Park',
    district: 'Batı Efeler',
    position: [-74, 0, 30],
    interactionRadius: 17,
    summary:
      'Eski Aydın Tekstil Fabrikası alanının yemyeşil bir şehir parkına dönüştürülmesiyle oluşan Tekstil Park; yürüyüş yolları, göleti ve tuğla dokuma binalarıyla nefes alan bir vahadır.',
    architectureNote:
      'Testere dişli (sawtooth) çatılı kırmızı tuğla dokuma holü, tarihi fabrika bacası, geniş çim alanlar ve palmiyeli yürüyüş parkurları korunmuştur.',
    rewardCoins: 35,
    doorPosition: [-66, 30],
  },
  {
    id: 'forumaydin',
    name: 'Forum Aydın Yaşam & AVM',
    era: 'Modern Ege Mimarisi',
    district: 'Doğu Bulvarı',
    position: [74, 0, 30],
    interactionRadius: 17,
    summary:
      'Açık hava Ege sokakları konseptiyle tasarlanan Forum Aydın; palmiyeli avlusu, cam atriyum çatısı ve kafeleriyle günün her saatinde hareketlidir.',
    architectureNote:
      'Krem traverten ve terracotta cepheli iki katlı açık galeri kanatları, ortadaki serin süs havuzu ve yüksek cam kanopi ile bütünleşir.',
    rewardCoins: 30,
    doorPosition: [65, 30],
  },
  {
    id: 'trengari',
    name: 'Tarihi Aydın Tren Garı',
    era: '1882 · İzmir–Aydın Demiryolu',
    district: 'İstasyon Meydanı',
    position: [0, 0, 66],
    interactionRadius: 15,
    summary:
      'Anadolu’nun en eski demiryolu hattı olan İzmir–Aydın demiryolunun tarihi duraklarından biri olan gar, nostaljik peronu ve taş cephesiyle zamana direnir.',
    architectureNote:
      'Üçgen alınlıklı merkezi saat bölümü, yüksek kemerli pencereler, kırma kiremit çatı ve peronu örten dökme demir sundurma mimarinin ana unsurlarıdır.',
    rewardCoins: 35,
    doorPosition: [0, 62],
  },
];

export const COZY_ERRANDS: ErrandDef[] = [
  {
    id: 'errand-incir',
    title: 'Taze Kuru İncir Paketi',
    fromLandmarkId: 'nasuhpasa',
    toLandmarkId: 'trengari',
    description:
      'Zincirli Han’dan özenle paketlenen Aydın incirlerini Tarihi Tren Garı’ndaki yolcu emanetine bırakın.',
    rewardCoins: 30,
  },
  {
    id: 'errand-pide',
    title: 'Sıcak Tahinli Pide',
    fromLandmarkId: 'ramazanpasa',
    toLandmarkId: 'kentmeydani',
    description:
      'Ramazan Paşa Çarşısı’ndaki taş fırından çıkan tahinli pideyi Atatürk Kent Meydanı’ndaki çay ocağına ulaştırın.',
    rewardCoins: 25,
  },
  {
    id: 'errand-belediye',
    title: 'Kent Arşivi Albümü',
    fromLandmarkId: 'saribelediye',
    toLandmarkId: 'tekstilpark',
    description:
      'Tarihi Sarı Belediye Binası’ndan alınan Efeler fotoğraf albümünü Tekstil Park kültür salonuna ulaştırın.',
    rewardCoins: 35,
  },
  {
    id: 'errand-kahve',
    title: 'Ege Zeytinyağlı Sabun',
    fromLandmarkId: 'beycamii',
    toLandmarkId: 'forumaydin',
    description:
      'Bey Camii civarındaki eski taş baskı atölyesinden çıkan hediyelik sabunları Forum Aydın avlusundaki butiğe bırakın.',
    rewardCoins: 30,
  },
];

export const DISTRICT_ZONES: DistrictZone[] = [
  {
    id: 'tralleis-ridge',
    name: 'Tralleis & Kalfaköy Yamacı',
    subtitle: 'Tralleis Yolu',
    minX: -120,
    maxX: 120,
    minZ: -120,
    maxZ: -44,
  },
  {
    id: 'historic-bazaar',
    name: 'Tarihi Çarşı & Yağcılar İçi',
    subtitle: 'Ramazan Paşa Sk.',
    minX: -120,
    maxX: -2,
    minZ: -44,
    maxZ: -2,
  },
  {
    id: 'kulliye-quarter',
    name: 'Bey Camii & Külliye Mahallesi',
    subtitle: 'Gazi Bulvarı',
    minX: -2,
    maxX: 120,
    minZ: -44,
    maxZ: -2,
  },
  {
    id: 'tekstil-west',
    name: 'Tekstil Park & Batı Efeler',
    subtitle: 'Tekstil Park Bulvarı',
    minX: -120,
    maxX: -54,
    minZ: -2,
    maxZ: 42,
  },
  {
    id: 'forum-east',
    name: 'Forum Aydın & Doğu Bulvarı',
    subtitle: 'Adnan Menderes Blv. Doğu',
    minX: 54,
    maxX: 120,
    minZ: -2,
    maxZ: 42,
  },
  {
    id: 'kent-meydani',
    name: 'Efeler Merkez & Kent Meydanı',
    subtitle: 'Adnan Menderes Blv.',
    minX: -54,
    maxX: 54,
    minZ: -2,
    maxZ: 36,
  },
  {
    id: 'station-quarter',
    name: 'İstasyon & Gar Çevresi',
    subtitle: 'İstasyon Caddesi',
    minX: -120,
    maxX: 120,
    minZ: 36,
    maxZ: 120,
  },
];

export const ROAD_X_COORDS = [-54, -18, 18, 54] as const;
export const ROAD_Z_COORDS = [-58, -22, 12, 48] as const;

export const STREET_NAMES_X: Record<number, string> = {
  [-54]: 'Yağcılar & Tekstil Caddesi',
  [-18]: 'Sevgi Yolu',
  [18]: 'Hükümet Bulvarı',
  [54]: 'Doğu Bulvarı',
};

export const STREET_NAMES_Z: Record<number, string> = {
  [-58]: 'Tralleis Yolu',
  [-22]: 'Gazi Bulvarı',
  [12]: 'Adnan Menderes Blv.',
  [48]: 'İstasyon Caddesi',
};

export const ANCIENT_SIGNPOST_POSITIONS: [number, number][] = [
  [-27, -51],
  [58, 3],
];

export const PLAYER_HOME_POS: [number, number] = [-28, -4];
export const PLAYER_HOME_DOOR_POS: [number, number] = [-22.5, -4];

export const WEATHER_OPTIONS: { id: 'clear' | 'rain' | 'snow' | 'storm'; label: string }[] = [
  { id: 'clear', label: 'Açık' },
  { id: 'rain', label: 'Yağmur' },
  { id: 'snow', label: 'Kar' },
  { id: 'storm', label: 'Fırtına' },
];

export const LOFI_TRACKS: { id: 'aegean' | 'rainy_piano' | 'night_lofi' | 'ambient_only'; label: string }[] = [
  { id: 'aegean', label: 'Ege Akşamı Lo-Fi' },
  { id: 'rainy_piano', label: 'Yağmurlu Piyano' },
  { id: 'night_lofi', label: 'Gece Kahvesi Lo-Fi' },
  { id: 'ambient_only', label: 'Sadece Doğa Sesi' },
];

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

export const DEFAULT_COZY_ROOM_STATE = {
  wallColor: '#EADEC9',
  floorTone: 'oak' as const,
  lampOn: true,
  petType: 'both' as const,
  petAffection: 3,
  furniture: [
    { id: 'armchair' as const, enabled: true, slotIndex: 0 },
    { id: 'desk' as const, enabled: true, slotIndex: 0 },
    { id: 'bookshelf' as const, enabled: true, slotIndex: 0 },
    { id: 'rug' as const, enabled: true, slotIndex: 0 },
    { id: 'plant' as const, enabled: true, slotIndex: 0 },
    { id: 'turntable' as const, enabled: true, slotIndex: 0 },
    { id: 'teatable' as const, enabled: true, slotIndex: 0 },
    { id: 'wallart' as const, enabled: true, slotIndex: 0 },
  ],
};

export const UPCOMING_ANCIENT_CITIES = [
  'Nysa Antik Kenti (Sultanhisar)',
  'Aphrodisias Antik Kenti (Karacasu)',
  'Magnesia ad Maeandrum (Germencik)',
  'Miletos & Priene (Didim / Söke)',
  'Alinda & Alabanda (Karpuzlu / Çine)',
];

export interface LightingMood {
  label: string;
  skyColor: string;
  fogColor: string;
  sunColor: string;
  sunIntensity: number;
  sunPosition: [number, number, number];
  hemiSky: string;
  hemiGround: string;
  hemiIntensity: number;
  lampOn: boolean;
  windowGlow: number;
}

export const TIME_MOODS: Record<TimeOfDay, LightingMood> = {
  morning: {
    label: 'Sabah',
    skyColor: '#D9E5EC',
    fogColor: '#DCE6EA',
    sunColor: '#FFF0D6',
    sunIntensity: 1.75,
    sunPosition: [70, 62, 45],
    hemiSky: '#B8D8EE',
    hemiGround: '#8C7A62',
    hemiIntensity: 0.72,
    lampOn: false,
    windowGlow: 0.08,
  },
  noon: {
    label: 'Öğle',
    skyColor: '#CFE2EE',
    fogColor: '#D6E4EB',
    sunColor: '#FFF9EC',
    sunIntensity: 2.05,
    sunPosition: [45, 95, 35],
    hemiSky: '#CBE5F6',
    hemiGround: '#9E8B70',
    hemiIntensity: 0.78,
    lampOn: false,
    windowGlow: 0.04,
  },
  golden: {
    label: 'Altın Saat',
    skyColor: '#E8C59B',
    fogColor: '#E5BF95',
    sunColor: '#FFB86C',
    sunIntensity: 1.95,
    sunPosition: [-80, 34, 52],
    hemiSky: '#F0B684',
    hemiGround: '#6B5344',
    hemiIntensity: 0.65,
    lampOn: true,
    windowGlow: 0.65,
  },
  evening: {
    label: 'Akşam',
    skyColor: '#23283A',
    fogColor: '#24293B',
    sunColor: '#8CA7D6',
    sunIntensity: 0.65,
    sunPosition: [-50, 58, -40],
    hemiSky: '#44547A',
    hemiGround: '#2A231E',
    hemiIntensity: 0.52,
    lampOn: true,
    windowGlow: 1.15,
  },
};

export function getFigTreeStage(coins: number): {
  label: string;
  progress: number;
  figCount: number;
} {
  if (coins >= 160) {
    return { label: 'Ulu Aydın İnciri (Meyveli)', progress: 1, figCount: 16 };
  }
  if (coins >= 90) {
    return { label: 'Gür Dallı İncir Ağacı', progress: 0.78, figCount: 10 };
  }
  if (coins >= 35) {
    return { label: 'Genç İncir Ağacı', progress: 0.55, figCount: 4 };
  }
  return { label: 'Taze İncir Fidanı', progress: 0.34, figCount: 0 };
}
