import {
  DistrictZone,
  ErrandDef,
  FurnitureStyleDef,
  GezginBadgeDef,
  HouseExteriorConfig,
  HouseExteriorStyle,
  LandmarkDef,
  SeasonType,
  TimeOfDay,
  VehicleConfig,
  WeatherType,
} from '../types/game';

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
    position: [80, 0, 30],
    interactionRadius: 17,
    summary:
      'Açık hava Ege sokakları konseptiyle tasarlanan Forum Aydın; palmiyeli avlusu, cam atriyum çatısı ve kafeleriyle günün her saatinde hareketlidir.',
    architectureNote:
      'Krem traverten ve terracotta cepheli iki katlı açık galeri kanatları, ortadaki serin süs havuzu ve yüksek cam kanopi ile bütünleşir.',
    rewardCoins: 30,
    doorPosition: [71, 30],
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
  {
    id: 'ortamahalle',
    name: 'Orta Mahalle Tarihi Dokusu & Çeşmesi',
    era: '19. Yüzyıl · Geleneksel Efeler Mahallesi',
    district: 'Orta Mahalle · Tabakhane Karşısı',
    position: [76, 0, -40],
    interactionRadius: 15,
    summary:
      'Tarihi Sarı Belediye Binası arkasından akan Tabakhane Deresi’nin doğu yakasında, bulvardan taş köprülerle ayrılan taş sokakları, asmalı pergolaları ve mahalle çeşmesiyle sıcacık komşuluk kültürünü yaşatır.',
    architectureNote:
      'Kemerli mermer mahalle çeşmesi, yokuş eteklerine oturan cumbalı ahşap karkas evler, alaturka kiremit çatılar ve üzüm asmalı avlu duvarları mahalle dokusunu korur.',
    rewardCoins: 35,
    doorPosition: [65, -40],
  },
  {
    id: 'universite',
    name: 'ADÜ Aytepe Üniversitesi Kampüsü',
    era: '1992 · Aydın Adnan Menderes Üniversitesi',
    district: 'Aytepe Tepesi · Üniversite Bölgesi',
    position: [78, 0, -78],
    interactionRadius: 19,
    summary:
      'Orta Mahalle ve Tabakhane vadisinden yokuş yukarı tırmanılarak ulaşılan Aytepe sırtlarındaki ADÜ yerleşkesi; taş giriş takı, rektörlük binası, kubbeli kütüphanesi ve ovaya bakan çim amfisiyle kentin gençlik kalbidir.',
    architectureNote:
      'Eğimli Aytepe yamacına teraslanmış sütunlu rektörlük girişi, sekizgen tamburlu kubbeli kütüphane, geniş traverten yürüyüş aksları ve bisiklet park alanlarıyla ferah bir kampüs sunar.',
    rewardCoins: 45,
    doorPosition: [63.5, -78],
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
  {
    id: 'errand-ortamahalle',
    title: 'Orta Mahalle Taş Fırın Simidi',
    fromLandmarkId: 'ortamahalle',
    toLandmarkId: 'universite',
    description:
      'Orta Mahalle fırınından alınan çıtır susamlı simitleri ADÜ Aytepe Kampüsü kütüphane önündeki öğrencilere götürün.',
    rewardCoins: 35,
  },
  {
    id: 'errand-kampus',
    title: 'Kampüs Botanik İncir Fidanı',
    fromLandmarkId: 'universite',
    toLandmarkId: 'kentmeydani',
    description:
      'ADÜ Ziraat bahçesinde yetiştirilen özel incir fidanını Kent Meydanı’ndaki bahçıvanlara teslim edin.',
    rewardCoins: 40,
  },
];

export const DISTRICT_ZONES: DistrictZone[] = [
  {
    id: 'kalfakoy-west',
    name: 'Kalfaköy & Kuzey Yamaç',
    subtitle: 'Tralleis Yolu Batı',
    minX: -120,
    maxX: -18,
    minZ: -125,
    maxZ: -52,
  },
  {
    id: 'tralleis-ridge',
    name: 'Tralleis & Kalfaköy Yamacı',
    subtitle: 'Tralleis Yolu',
    minX: -18,
    maxX: 28,
    minZ: -125,
    maxZ: -52,
  },
  {
    id: 'universite-adu',
    name: 'ADÜ Aytepe Üniversitesi (Yokuş Yukarı)',
    subtitle: 'Aytepe Üniversite Yokuşu',
    minX: 28,
    maxX: 125,
    minZ: -125,
    maxZ: -56,
  },
  {
    id: 'orta-mahalle',
    name: 'Orta Mahalle (Tabakhane Doğu Yakası)',
    subtitle: 'Orta Mahalle & Tabakhane',
    minX: 47,
    maxX: 125,
    minZ: -56,
    maxZ: -16,
  },
  {
    id: 'historic-bazaar',
    name: 'Tarihi Çarşı & Yağcılar İçi',
    subtitle: 'Ramazan Paşa Sk.',
    minX: -120,
    maxX: -2,
    minZ: -52,
    maxZ: -2,
  },
  {
    id: 'kulliye-quarter',
    name: 'Bey Camii & Tabakhane Kenarı',
    subtitle: 'Gazi Bulvarı',
    minX: -2,
    maxX: 47,
    minZ: -52,
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
    subtitle: 'Doğu Bulvarı',
    minX: 54,
    maxX: 125,
    minZ: -16,
    maxZ: 42,
  },
  {
    id: 'kent-meydani',
    name: 'Efeler Merkez & Sarı Belediye',
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
    maxX: 125,
    minZ: 36,
    maxZ: 120,
  },
];

export const ROAD_X_COORDS = [-54, -18, 18, 58] as const;
export const ROAD_Z_COORDS = [-96, -58, -22, 12, 48] as const;

export const STREET_NAMES_X: Record<number, string> = {
  [-54]: 'Yağcılar & Tekstil Caddesi',
  [-18]: 'Sevgi Yolu',
  [18]: 'Hükümet Bulvarı',
  [58]: 'Doğu Bulvarı',
};

export const STREET_NAMES_Z: Record<number, string> = {
  [-96]: 'Aytepe Üniversite Bulvarı',
  [-58]: 'Tralleis Yolu',
  [-22]: 'Gazi Bulvarı',
  [12]: 'Adnan Menderes Blv.',
  [48]: 'İstasyon Caddesi',
};

export const ANCIENT_SIGNPOST_POSITIONS: [number, number][] = [
  [-27, -51],
  [64, 3],
];

export const PLAYER_HOME_POS: [number, number] = [-28, -4];
export const PLAYER_HOME_DOOR_POS: [number, number] = [-22.5, -4];

export const SEASON_OPTIONS: { id: SeasonType; label: string }[] = [
  { id: 'spring', label: 'İlkbahar' },
  { id: 'summer', label: 'Yaz' },
  { id: 'autumn', label: 'Sonbahar' },
  { id: 'winter', label: 'Kış' },
];

export const WEATHER_OPTIONS: { id: WeatherType; label: string }[] = [
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
  // Koltuk (armchair)
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

  // Pikap (turntable)
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

  // Kilim (rug)
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

  // Çay Sehpası (teatable)
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

  // Kitaplık (bookshelf)
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

  // Çalışma Masası (desk)
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

  // Saksı Bitkisi (plant)
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

  // Duvar Tablosu (wallart)
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
    skyColor: '#E8DFCE',
    fogColor: '#E8DFCE',
    sunColor: '#FFE8BF',
    sunIntensity: 1.95,
    sunPosition: [68, 54, 42],
    hemiSky: '#DCE8EE',
    hemiGround: '#9C8362',
    hemiIntensity: 0.78,
    lampOn: false,
    windowGlow: 0.1,
  },
  noon: {
    label: 'Öğle',
    skyColor: '#DCE8EC',
    fogColor: '#DCE8EC',
    sunColor: '#FFF5DE',
    sunIntensity: 2.1,
    sunPosition: [44, 82, 34],
    hemiSky: '#DDF0FA',
    hemiGround: '#A98E6E',
    hemiIntensity: 0.82,
    lampOn: false,
    windowGlow: 0.06,
  },
  golden: {
    label: 'Altın Saat',
    skyColor: '#EAD0AA',
    fogColor: '#E8CC9F',
    sunColor: '#FFC985',
    sunIntensity: 2.2,
    sunPosition: [-72, 36, 48],
    hemiSky: '#FFF0D4',
    hemiGround: '#8B6846',
    hemiIntensity: 0.78,
    lampOn: true,
    windowGlow: 0.55,
  },
  evening: {
    label: 'Akşam',
    skyColor: '#25293B',
    fogColor: '#262A3C',
    sunColor: '#98B2DF',
    sunIntensity: 0.72,
    sunPosition: [-50, 58, -40],
    hemiSky: '#4B5B82',
    hemiGround: '#332820',
    hemiIntensity: 0.56,
    lampOn: true,
    windowGlow: 1.15,
  },
};

export const TIME_PHASE_ANCHORS: Record<TimeOfDay, number> = {
  morning: 0.0,
  noon: 0.28,
  golden: 0.58,
  evening: 0.82,
};

const SOLAR_KEYFRAMES: { phase: number; mood: LightingMood }[] = [
  { phase: 0.0, mood: TIME_MOODS.morning },
  { phase: 0.28, mood: TIME_MOODS.noon },
  { phase: 0.58, mood: TIME_MOODS.golden },
  { phase: 0.82, mood: TIME_MOODS.evening },
  { phase: 1.0, mood: TIME_MOODS.morning },
];

export function getTimeOfDayFromPhase(phase: number): TimeOfDay {
  const p = ((phase % 1) + 1) % 1;
  if (p < 0.14 || p >= 0.94) return 'morning';
  if (p < 0.44) return 'noon';
  if (p < 0.71) return 'golden';
  return 'evening';
}

export function getSolarClockLabel(phase: number): string {
  // Map phase 0.0 = 07:00 -> 0.28 = 13:45 -> 0.58 = 18:15 -> 0.82 = 22:30 -> 1.0 = 07:00
  const p = ((phase % 1) + 1) % 1;
  const totalMinutes = Math.round((7 * 60 + p * 24 * 60) % (24 * 60));
  const hh = String(Math.floor(totalMinutes / 60)).padStart(2, '0');
  const mm = String(totalMinutes % 60).padStart(2, '0');
  return `${hh}:${mm}`;
}

export interface SampledSolarMood {
  a: LightingMood;
  b: LightingMood;
  t: number;
  sunIntensity: number;
  hemiIntensity: number;
  windowGlow: number;
  lampLevel: number;
  sunPos: [number, number, number];
}

export function sampleSolarCurve(phase: number, out: SampledSolarMood): void {
  const p = ((phase % 1) + 1) % 1;
  let k0 = SOLAR_KEYFRAMES[0];
  let k1 = SOLAR_KEYFRAMES[1];
  for (let i = 0; i < SOLAR_KEYFRAMES.length - 1; i++) {
    if (p >= SOLAR_KEYFRAMES[i].phase && p <= SOLAR_KEYFRAMES[i + 1].phase) {
      k0 = SOLAR_KEYFRAMES[i];
      k1 = SOLAR_KEYFRAMES[i + 1];
      break;
    }
  }
  const span = Math.max(0.0001, k1.phase - k0.phase);
  const rawT = (p - k0.phase) / span;
  const t = rawT * rawT * (3 - 2 * rawT);

  out.a = k0.mood;
  out.b = k1.mood;
  out.t = t;
  out.sunIntensity = k0.mood.sunIntensity + (k1.mood.sunIntensity - k0.mood.sunIntensity) * t;
  out.hemiIntensity = k0.mood.hemiIntensity + (k1.mood.hemiIntensity - k0.mood.hemiIntensity) * t;
  out.windowGlow = k0.mood.windowGlow + (k1.mood.windowGlow - k0.mood.windowGlow) * t;
  const lamp0 = k0.mood.lampOn ? 1 : 0;
  const lamp1 = k1.mood.lampOn ? 1 : 0;
  out.lampLevel = lamp0 + (lamp1 - lamp0) * t;
  out.sunPos[0] = k0.mood.sunPosition[0] + (k1.mood.sunPosition[0] - k0.mood.sunPosition[0]) * t;
  out.sunPos[1] = k0.mood.sunPosition[1] + (k1.mood.sunPosition[1] - k0.mood.sunPosition[1]) * t;
  out.sunPos[2] = k0.mood.sunPosition[2] + (k1.mood.sunPosition[2] - k0.mood.sunPosition[2]) * t;
}

export function pickAutoWeatherForCycle(phase: number, season: SeasonType, roll: number): WeatherType {
  const p = ((phase % 1) + 1) % 1;
  if (season === 'winter') {
    if (roll < 0.48) return 'snow';
    if (roll < 0.68 && p > 0.65) return 'storm';
    return 'clear';
  }
  if (season === 'autumn') {
    if (roll < 0.36) return 'rain';
    if (roll < 0.5 && p > 0.52) return 'storm';
    return 'clear';
  }
  if (season === 'spring') {
    if (roll < 0.28 && p > 0.2 && p < 0.72) return 'rain';
    return 'clear';
  }
  // Summer: mostly sunny/golden, rare brief afternoon shower
  if (roll < 0.14 && p > 0.35 && p < 0.62) return 'rain';
  return 'clear';
}

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

export const EFELER_GEZGINI_BADGES: GezginBadgeDef[] = [
  // Tarihi Yapı (Landmark) Efeler Gezgini Rozetleri
  {
    id: 'badge-landmark-tralleis',
    category: 'landmark',
    targetId: 'tralleis',
    title: 'Efeler Gezgini: Üç Gözler Kaşifi',
    subtitle: 'Tralleis Antik Kenti',
    description: 'Roma dönemi gymnasion kemerlerine kadar uzanan antik rotayı keşfettiniz.',
    icon: '🏛️',
    accentColor: '#C85A32',
  },
  {
    id: 'badge-landmark-ramazanpasa',
    category: 'landmark',
    targetId: 'ramazanpasa',
    title: 'Efeler Gezgini: Tarihi Çarşı Müdavimi',
    subtitle: 'Ramazan Paşa Camii & Çarşısı',
    description: 'Cumbalı sokaklar ve tarihi çarşının kalbindeki avluyu ziyaret ettiniz.',
    icon: '🕌',
    accentColor: '#9E542E',
  },
  {
    id: 'badge-landmark-beycamii',
    category: 'landmark',
    targetId: 'beycamii',
    title: 'Efeler Gezgini: Gazi Bulvarı Gölgesi',
    subtitle: 'Bey Camii (1683)',
    description: 'Süleyman Bey’in zarif taş minareli mirasını yakından gördünüz.',
    icon: '🌙',
    accentColor: '#3B6E8C',
  },
  {
    id: 'badge-landmark-cihanoglu',
    category: 'landmark',
    targetId: 'cihanoglu',
    title: 'Efeler Gezgini: Taş Kule Gözcüsü',
    subtitle: 'Cihanoğlu Külliyesi & Kulesi',
    description: 'Yağcılar İçi’ndeki barok alınlıklı külliyeyi ve savunma kulesini keşfettiniz.',
    icon: '🏰',
    accentColor: '#7A543E',
  },
  {
    id: 'badge-landmark-nasuhpasa',
    category: 'landmark',
    targetId: 'nasuhpasa',
    title: 'Efeler Gezgini: Kervan Hanı Yolcusu',
    subtitle: 'Nasuh Paşa Külliyesi (Zincirli Han)',
    description: 'İki katlı revaklı avluyu ve sekizgen şadırvanı ziyaret ettiniz.',
    icon: '🗝️',
    accentColor: '#B8742F',
  },
  {
    id: 'badge-landmark-kentmeydani',
    category: 'landmark',
    targetId: 'kentmeydani',
    title: 'Efeler Gezgini: Meydanın Efesi',
    subtitle: 'Atatürk Kent Meydanı',
    description: 'Efeler Anıtı ve Ulu Aydın İnciri’nin gölgesindeki meydanı keşfettiniz.',
    icon: '🌳',
    accentColor: '#5D8A48',
  },
  {
    id: 'badge-landmark-saribelediye',
    category: 'landmark',
    targetId: 'saribelediye',
    title: 'Efeler Gezgini: Sarı Konak Tarihçisi',
    subtitle: 'Tarihi Sarı Belediye Binası',
    description: 'Hardal sarısı Cumhuriyet dönemi sivil mimari simgesini keşfettiniz.',
    icon: '🕰️',
    accentColor: '#D4923F',
  },
  {
    id: 'badge-landmark-tekstilpark',
    category: 'landmark',
    targetId: 'tekstilpark',
    title: 'Efeler Gezgini: Dokuma Parkı Gezgini',
    subtitle: 'Tekstil Park (Sümerbank)',
    description: 'Kırmızı tuğlalı dokuma holü ve yeşil yürüyüş parkurunu keşfettiniz.',
    icon: '🧵',
    accentColor: '#A63A3A',
  },
  {
    id: 'badge-landmark-forumaydin',
    category: 'landmark',
    targetId: 'forumaydin',
    title: 'Efeler Gezgini: Palmiyeli Avlu Dostu',
    subtitle: 'Forum Aydın Yaşam & AVM',
    description: 'Modern Ege avlusu ve cam atriyum çarşısını ziyaret ettiniz.',
    icon: '🌴',
    accentColor: '#4E7B6D',
  },
  {
    id: 'badge-landmark-trengari',
    category: 'landmark',
    targetId: 'trengari',
    title: 'Efeler Gezgini: 1882 Rayların İzinde',
    subtitle: 'Tarihi Aydın Tren Garı',
    description: 'İzmir–Aydın demiryolunun nostaljik taş peronunu keşfettiniz.',
    icon: '🚂',
    accentColor: '#3A4A5E',
  },
  {
    id: 'badge-landmark-ortamahalle',
    category: 'landmark',
    targetId: 'ortamahalle',
    title: 'Efeler Gezgini: Taş Köprü Komşusu',
    subtitle: 'Orta Mahalle & Çeşmesi',
    description: 'Tabakhane Deresi kıyısındaki asmalı sokakları ve mahalle çeşmesini keşfettiniz.',
    icon: '⛲',
    accentColor: '#5B7C8D',
  },
  {
    id: 'badge-landmark-universite',
    category: 'landmark',
    targetId: 'universite',
    title: 'Efeler Gezgini: Aytepe Zirve Kaşifi',
    subtitle: 'ADÜ Aytepe Kampüsü',
    description: 'Aytepe yokuşunu aşıp kubbeli kütüphane ve ovaya bakan kampüse ulaştınız.',
    icon: '🎓',
    accentColor: '#6E4555',
  },

  // Sakin Görev (Errand) Efeler Gezgini Rozetleri
  {
    id: 'badge-errand-incir',
    category: 'errand',
    targetId: 'errand-incir',
    title: 'Efeler Gezgini: İncir Kuryesi',
    subtitle: 'Görev · Zincirli Han → Tren Garı',
    description: 'Taze kuru incir paketini Tarihi Tren Garı emanetine güvenle ulaştırdınız.',
    icon: '🧺',
    accentColor: '#8F5624',
  },
  {
    id: 'badge-errand-pide',
    category: 'errand',
    targetId: 'errand-pide',
    title: 'Efeler Gezgini: Tahinli Pide Ustası',
    subtitle: 'Görev · Ramazan Paşa → Kent Meydanı',
    description: 'Taş fırından çıkan sıcak tahinli pideyi Kent Meydanı çay ocağına teslim ettiniz.',
    icon: '🫓',
    accentColor: '#C85A32',
  },
  {
    id: 'badge-errand-belediye',
    category: 'errand',
    targetId: 'errand-belediye',
    title: 'Efeler Gezgini: Kent Arşivcisi',
    subtitle: 'Görev · Sarı Belediye → Tekstil Park',
    description: 'Efeler fotoğraf albümünü Tekstil Park kültür salonuna eksiksiz teslim ettiniz.',
    icon: '🎞️',
    accentColor: '#D4923F',
  },
  {
    id: 'badge-errand-kahve',
    category: 'errand',
    targetId: 'errand-kahve',
    title: 'Efeler Gezgini: Zeytinyağı Elçisi',
    subtitle: 'Görev · Bey Camii → Forum Aydın',
    description: 'Taş baskı atölyesinden çıkan Ege zeytinyağlı sabunlarını butik avluya ulaştırdınız.',
    icon: '🫒',
    accentColor: '#5D8A48',
  },
  {
    id: 'badge-errand-ortamahalle',
    category: 'errand',
    targetId: 'errand-ortamahalle',
    title: 'Efeler Gezgini: Aytepe Simitçisi',
    subtitle: 'Görev · Orta Mahalle → ADÜ Kampüs',
    description: 'Orta Mahalle fırınının çıtır simitlerini Aytepe’deki öğrencilere yetiştirdiniz.',
    icon: '🥨',
    accentColor: '#B8742F',
  },
  {
    id: 'badge-errand-kampus',
    category: 'errand',
    targetId: 'errand-kampus',
    title: 'Efeler Gezgini: İncir Fidanı Taşıyıcısı',
    subtitle: 'Görev · ADÜ Kampüs → Kent Meydanı',
    description: 'Ziraat bahçesinden alınan özel incir fidanını Kent Meydanı’na ulaştırdınız.',
    icon: '🌱',
    accentColor: '#4B743B',
  },
];

export function getGezginRank(unlockedCount: number, totalCount: number): {
  title: string;
  nextMilestone: number;
} {
  if (unlockedCount >= totalCount && totalCount > 0) {
    return { title: 'Baş Efeler Gezgini', nextMilestone: totalCount };
  }
  if (unlockedCount >= 12) {
    return { title: 'Usta Aydın Seyyahı', nextMilestone: totalCount };
  }
  if (unlockedCount >= 6) {
    return { title: 'Efeler Gezgini', nextMilestone: 12 };
  }
  if (unlockedCount >= 1) {
    return { title: 'Efeler Kaşifi', nextMilestone: 6 };
  }
  return { title: 'Yeni Yolcu', nextMilestone: 1 };
}
