import {
  DistrictZone,
  ErrandDef,
  FurnitureStyleDef,
  GezginBadgeDef,
  HouseExteriorConfig,
  HouseExteriorStyle,
  LandmarkDef,
  LofiTrackId,
  RadioStationDef,
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
    district: 'Kalfaköy · Tralleis Tepesi',
    position: [-58, 0, -108],
    interactionRadius: 14,
    summary:
      'Antik Tralleis kentinin günümüze ulaşan en görkemli simgesi olan Üç Gözler, Roma dönemine ait büyük gymnasion yapısının anıtsal kemerli girişidir.',
    architectureNote:
      'Kesme traverten bloklardan inşa edilen üç yüksek yuvarlak kemer, profilli başlıklar ve üst friz kalıntıları Aydın ovasına kuzeybatı sırtından bakar.',
    rewardCoins: 40,
    doorPosition: [-58, -101.5],
  },
  {
    id: 'ramazanpasa',
    name: 'Ramazan Paşa Camii & Çarşısı',
    era: '1595 · Osmanlı Klasik Dönem',
    district: 'Hasanefendi – Ramazan Paşa Mah.',
    position: [-38.5, 0, -50],
    interactionRadius: 13,
    summary:
      'Aydın çarşı dokusunun merkezinde yer alan Ramazan Paşa Camii, çevresindeki cumbalı geleneksel evler ve eski esnaf sokaklarıyla kentin yaşayan hafızasıdır.',
    architectureNote:
      'Kare planlı harim, tek kubbeli örtü, kemerli son cemaat revakı ve kiremit çatılı çarşı dükkanlarıyla çevrili samimi bir avlu düzenine sahiptir.',
    rewardCoins: 30,
    doorPosition: [-38.5, -42.2],
  },
  {
    id: 'beycamii',
    name: 'Bey Camii (Süleyman Bey Camii)',
    era: '1683 · Osmanlı Dönemi',
    district: 'Hasanefendi – Ramazan Paşa Mah.',
    position: [-36, 0, -2.5],
    interactionRadius: 13,
    summary:
      'Üveys Paşa’nın torunu Süleyman Bey tarafından 17. yüzyılda yaptırılan cami, Sevgi Yolu ile Adnan Menderes Bulvarı arasındaki konumuyla Efeler silüetinin kalbindedir.',
    architectureNote:
      'Sekizgen kasnak üzerine oturan kurşun kaplı ana kubbe, üç küçük kubbeli son cemaat yeri ve tek şerefeli taş minaresiyle dikkat çeker.',
    rewardCoins: 30,
    doorPosition: [-36, 5.9],
  },
  {
    id: 'cihanoglu',
    name: 'Cihanoğlu Külliyesi & Kulesi',
    era: '1756 · Osmanlı Barok Etkili',
    district: 'Köprülü – Veysipaşa Mah. · Çankaya Cd.',
    position: [0, 0, -51],
    interactionRadius: 14,
    summary:
      'Bölgenin köklü ayan ailesi Cihanoğulları tarafından inşa edilen külliye; cami, medrese odaları, şadırvan ve savunma amaçlı tarihi taş kulesiyle eşsizdir.',
    architectureNote:
      'Dalgalı barok alınlıklar, avluyu saran sivri kemerli medrese revakları ve köşede yükselen mazgallı Cihanoğlu Kulesi özgün bir bütün oluşturur.',
    rewardCoins: 35,
    doorPosition: [9.5, -51],
  },
  {
    id: 'nasuhpasa',
    name: 'Nasuh Paşa Külliyesi (Zincirli Han)',
    era: '1708 · Osmanlı Han Mimarisi',
    district: 'Köprülü – Veysipaşa Mah.',
    position: [38.5, 0, -50],
    interactionRadius: 15,
    summary:
      'Sadrazam Nasuh Paşa’nın yaptırdığı külliye; iki katlı avlulu Zincirli Han, mescit, hamam ve ortasındaki şadırvanıyla kervan yollarının durak noktasıydı.',
    architectureNote:
      'Sıralı taş ve tuğladan oluşan almaşık duvar örgüsü, iki katlı revaklı iç avlu, alaturka kiremit çatı ve sekizgen şadırvan yapının kalbidir.',
    rewardCoins: 35,
    doorPosition: [30.5, -50],
  },
  {
    id: 'kentmeydani',
    name: 'Atatürk Kent Meydanı & Efeler Anıtı',
    era: 'Cumhuriyet Meydanı',
    district: 'Güzelhisar Mahallesi · Merkez',
    position: [0, 0, 10],
    interactionRadius: 24,
    summary:
      'Adnan Menderes Bulvarı ile Hükümet Bulvarı arasındaki büyük turkuaz havuz, Atatürk & Efeler Anıtı, belediye kafeleri ve geniş tören alanıyla kentin buluşma noktasıdır.',
    architectureNote:
      'Geometrik desenli dev turkuaz yansıtma havuzu, yeşil çatılı dairesel seyir adaları, dalgalanan Türk bayrağı, anıt kaidesi ve kuzeydeki geniş taş tören meydanından oluşur.',
    rewardCoins: 25,
  },
  {
    id: 'saribelediye',
    name: 'Aydın Büyükşehir Belediyesi Binası',
    era: 'Modern Kent Yönetimi · Cam Silindir',
    district: 'Güzelhisar Mahallesi · Hükümet Blv.',
    position: [39, 0, 10],
    interactionRadius: 15,
    summary:
      'Altın yansımalı eğrisel cam cephesi, kademeli üst kulesi, önündeki siyah basamaklı kaide üzerinde yükselen Atatürk Anıtı ve arkasındaki Tabakhane Deresi ile Efeler’in simge binasıdır.',
    architectureNote:
      'Geniş eğrisel bronz-altın alt baza, kademeli silindirik cam kule, üst taç yazıtı ve ön avludaki dört basamaklı siyah granit kaideli Atatürk heykeli modern Efeler silüetini tamamlar.',
    rewardCoins: 35,
    doorPosition: [35, 5.9],
  },
  {
    id: 'tekstilpark',
    name: 'Tekstil Park (Sümerbank Yerleşkesi)',
    era: '1950’ler Endüstri Mirası & Park',
    district: 'Orta Mahalle · Sümerbank / Doğu Blv.',
    position: [93, 0, 34],
    interactionRadius: 17,
    summary:
      'Eski Aydın Sümerbank Basma ve Tekstil Fabrikası alanının doğu bulvarında yemyeşil bir şehir parkına dönüştürülmesiyle oluşan Tekstil Park; yürüyüş yolları, göleti ve tuğla dokuma binalarıyla nefes alan bir vahadır.',
    architectureNote:
      'Testere dişli (sawtooth) çatılı kırmızı tuğla dokuma holü, tarihi fabrika bacası, geniş çim alanlar ve palmiyeli yürüyüş parkurları korunmuştur.',
    rewardCoins: 35,
    doorPosition: [79.8, 34],
  },
  {
    id: 'forumaydin',
    name: 'Forum Aydın Yaşam & AVM',
    era: 'Modern Ege Mimarisi',
    district: 'Yedi Eylül Mahallesi · Doğu Blv.',
    position: [142, 0, 10],
    interactionRadius: 17,
    summary:
      'Doğu Çevre Bulvarı ile Denizli Yolu aksında açık hava Ege sokakları konseptiyle tasarlanan Forum Aydın; palmiyeli avlusu, cam atriyum çatısı ve kafeleriyle günün her saatinde hareketlidir.',
    architectureNote:
      'Krem traverten ve terracotta cepheli iki katlı açık galeri kanatları, ortadaki serin süs havuzu ve yüksek cam kanopi ile bütünleşir.',
    rewardCoins: 30,
    doorPosition: [128.5, 10],
  },
  {
    id: 'trengari',
    name: 'Tarihi Aydın Tren Garı',
    era: '1882 · İzmir–Aydın Demiryolu',
    district: 'Kurtuluş Mahallesi · İstasyon',
    position: [0, 0, 85],
    interactionRadius: 15,
    summary:
      'Anadolu’nun en eski demiryolu hattı olan İzmir–Aydın demiryolunun tarihi duraklarından biri olan gar, İstasyon Bulvarı güneyindeki nostaljik peronu ve taş cephesiyle zamana direnir.',
    architectureNote:
      'Üçgen alınlıklı merkezi saat bölümü, yüksek kemerli pencereler, kırma kiremit çatı ve peronu örten dökme demir sundurma mimarinin ana unsurlarıdır.',
    rewardCoins: 35,
    doorPosition: [0, 79.5],
  },
  {
    id: 'ortamahalle',
    name: 'Orta Mahalle Tarihi Dokusu & Çeşmesi',
    era: '19. Yüzyıl · Geleneksel Efeler Mahallesi',
    district: 'Orta Mahalle · Tabakhane Doğu',
    position: [92, 0, -48],
    interactionRadius: 15,
    summary:
      'Tabakhane Deresi’nin doğu yakasında, taş köprülerle şehre bağlanan dik taş sokakları, asmalı pergolaları ve mahalle çeşmesiyle sıcacık komşuluk kültürünü yaşatır.',
    architectureNote:
      'Kemerli mermer mahalle çeşmesi, yokuş eteklerine oturan cumbalı ahşap karkas evler, alaturka kiremit çatılar ve üzüm asmalı avlu duvarları mahalle dokusunu korur.',
    rewardCoins: 35,
    doorPosition: [81, -48],
  },
  {
    id: 'universite',
    name: 'ADÜ Aytepe Üniversitesi Kampüsü',
    era: '1992 · Aydın Adnan Menderes Üniversitesi',
    district: 'Aytepe · ADÜ Kampüsü',
    position: [92, 0, -104],
    interactionRadius: 19,
    summary:
      'Orta Mahalle ve Tabakhane vadisinden kuzeydoğuya yokuş yukarı tırmanılarak ulaşılan Aytepe sırtlarındaki ADÜ yerleşkesi; taş giriş takı, rektörlük binası ve ovaya bakan çim amfisiyle kentin gençlik kalbidir.',
    architectureNote:
      'Eğimli Aytepe yamacına teraslanmış sütunlu rektörlük girişi, sekizgen tamburlu kubbeli kütüphane, geniş traverten yürüyüş aksları ve bisiklet park alanlarıyla ferah bir kampüs sunar.',
    rewardCoins: 45,
    doorPosition: [77.5, -104],
  },
  {
    id: 'magnesia',
    name: 'Magnesia Antik Kenti (Artemis Tapınağı)',
    era: 'MÖ 4. Yüzyıl · Hellenistik & Roma',
    district: 'Germencik · Magnesia Antik Yolu',
    position: [-188, 0, -12],
    interactionRadius: 18,
    summary:
      'Efeler’in batı İzmir Yolu uzantısındaki ilk büyük antik kent durağı olan Magnesia; Artemis Leukophryene Tapınağı’nın görkemli üçgen alınlıklı sütunlu cephesi, yan stoa kanatları ve mozaik agorasıyla Aydın tarihinin batı kapısıdır.',
    architectureNote:
      'Üç basamaklı mermer krepidoma üzerinde yükselen altı sütunlu İyon tapınak cephesi, yan sütun dizileri, menderes desenli mozaik halıları ve ön avluda ayakta kalan sütun tamburlarıyla inşa edilmiştir.',
    rewardCoins: 50,
    doorPosition: [-188, 1.0],
  },
  {
    id: 'nevzatbicerpark',
    name: 'Nevzat Biçer Parkı',
    era: 'Kent Parkı & Amfi · Cumhuriyet Mah.',
    district: 'Cumhuriyet Mahallesi',
    position: [-127, 0, 14],
    interactionRadius: 20,
    summary:
      'Atatürk Bulvarı ile Mimar Sinan – Körfez aksı arasında yer alan Cumhuriyet Mahallesi’ndeki Nevzat Biçer Parkı; süs havuzu, taş amfi tiyatrosu, spor sahası ve çimlerde gitar çalan gençleriyle Efeler’in en canlı yeşil buluşma noktasıdır.',
    architectureNote:
      'Geniş çim adalar arasına örülmüş traverten yürüyüş yolları, kademeli süs havuzu, yarım daire taş amfi oturma basamakları, pergola kafesi ve basketbol sahasıyla gerçekçi bir kent parkı düzeni sunar.',
    rewardCoins: 40,
    doorPosition: [-111.5, 14.4],
  },
  {
    id: 'kipaavm',
    name: 'Aydın Kipa AVM',
    era: 'Modern Alışveriş & Hipermarket · İstasyon Blv.',
    district: 'Cumhuriyet & Kurtuluş Sınırı',
    position: [-80, 0, 52],
    interactionRadius: 17,
    summary:
      'Cumhuriyet ve Kurtuluş sınırında, İstasyon Bulvarı ile Atatürk Bulvarı kavşağı yakınında konumlanan Aydın Kipa AVM; geniş hipermarket holü, cam giriş atriyumu ve otoparkıyla günlük kent yaşamının duraklarından biridir.',
    architectureNote:
      'Kıbrıs ve İstasyon Caddeleri arasına yerleşen geniş açık otopark avlusu, ikonik mavi-kırmızı cephe kuşaklı yatay ticari kütle ve cam giydirmeli ana giriş saçağıyla gerçek Efeler dokusunu yansıtır.',
    rewardCoins: 35,
    doorPosition: [-80, 42.5],
  },
  {
    id: 'sevgiyolu',
    name: 'Sevgi Yolu (Güzelhisar Yaya Caddesi)',
    era: 'Modern Yaya Caddesi & Kültür Aksı',
    district: 'Güzelhisar – Hasanefendi Mah.',
    position: [-39.5, 0, 11.5],
    interactionRadius: 15,
    summary:
      'Adnan Menderes Bulvarı ile Yağcılar Caddesi arasında uzanan Aydın’ın simge yaya caddesi; ışık kemerleri, sahafları, çiçekçileri ve akşam yürüyüşleriyle Efeler’in en sevilen buluşma aksıdır.',
    architectureNote:
      'Arnavut kaldırımlı yürüyüş ekseni, ferforje karşılama takları, ahşap pergola ışık dizileri, açık hava sahaf tezgahı ve oturma banklarıyla sıcak bir Ege yaya caddesi dokusu sunar.',
    rewardCoins: 30,
    doorPosition: [-39.5, 11.5],
  },
  {
    id: 'yagcilarici',
    name: 'Yağcılar İçi Tarihi Çarşısı',
    era: '19. Yüzyıl · Geleneksel Aydın Arastası',
    district: 'Cuma Mahallesi & Yağcılar İçi',
    position: [-76, 0, -47],
    interactionRadius: 16,
    summary:
      'Tarihi Gazi Bulvarı ile Çankaya Caddesi arasındaki köklü ticaret dokusu içinde yer alan Yağcılar İçi; zeytinyağı küpleri, baharatçı dükkanları, incir sepetleri ve taş arasta kemeriyle yaşayan bir Osmanlı çarşısıdır.',
    architectureNote:
      'İki paralel revaklı dükkan kanadı, çizgili esnaf tenteleri, taş giriş kapısı, orta avlu şadırvanı ve arnavut kaldırımlı çarşı geçidiyle özgün Aydın çarşı mimarisini yansıtır.',
    rewardCoins: 35,
    doorPosition: [-65.2, -47],
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
      'Aydın Büyükşehir Belediyesi’nden alınan Efeler fotoğraf albümünü Tekstil Park kültür salonuna ulaştırın.',
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
  {
    id: 'errand-magnesia',
    title: 'Magnesia Kazı Arşivi Defteri',
    fromLandmarkId: 'tralleis',
    toLandmarkId: 'magnesia',
    description:
      'Tralleis kazı alanından hazırlanan seramik envanter defterini batı yoluyla Magnesia Artemis Tapınağı önündeki kazı ekibine ulaştırın.',
    rewardCoins: 45,
  },
  {
    id: 'errand-nevzatbicer',
    title: 'Park Akustik Akşamı Çayı',
    fromLandmarkId: 'kentmeydani',
    toLandmarkId: 'nevzatbicerpark',
    description:
      'Kent Meydanı’ndan alınan taze demlenmiş termos çay ve kurabiyeleri Nevzat Biçer Parkı’nda gitar çalan gençlere götürün.',
    rewardCoins: 35,
  },
  {
    id: 'errand-kipa',
    title: 'İstasyon Market Alışveriş Listesi',
    fromLandmarkId: 'nevzatbicerpark',
    toLandmarkId: 'kipaavm',
    description:
      'Nevzat Biçer Parkı kafesinin taze meyve ve içecek siparişini İstasyon Caddesi üzerindeki Kipa AVM’den teslim alın.',
    rewardCoins: 35,
  },
  {
    id: 'errand-sevgiyolu',
    title: 'Sevgi Yolu Sahaflarına Eski Efeler Haritası',
    fromLandmarkId: 'ramazanpasa',
    toLandmarkId: 'sevgiyolu',
    description:
      'Ramazan Paşa Çarşısı’ndaki cilt atölyesinden çıkan antika Aydın albümünü Sevgi Yolu sahaf tezgahına ulaştırın.',
    rewardCoins: 30,
  },
  {
    id: 'errand-yagcilar',
    title: 'Soğuk Sıkım Zeytinyağı & İncir Sepeti',
    fromLandmarkId: 'yagcilarici',
    toLandmarkId: 'nasuhpasa',
    description:
      'Yağcılar İçi Çarşısı’ndan hazırlanan taş baskı zeytinyağı ve incir sepetini Zincirli Han avlusuna teslim edin.',
    rewardCoins: 35,
  },
];

export const DISTRICT_ZONES: DistrictZone[] = [
  {
    id: 'magnesia-west',
    name: 'Germencik · Magnesia Antik Yolu',
    subtitle: 'Batı İzmir Yolu · Artemis Tapınağı',
    minX: -240,
    maxX: -152,
    minZ: -74,
    maxZ: 8,
  },
  {
    id: 'kemer-northwest',
    name: 'Kemer Mahallesi (Kuzeybatı Yamaç)',
    subtitle: 'Kemer Cd. & Mimar Sinan Kuzeyi',
    minX: -240,
    maxX: -102,
    minZ: -185,
    maxZ: -74,
  },
  {
    id: 'zafer-west',
    name: 'Zafer Mahallesi (Tralleis Batı Sırtı)',
    subtitle: 'Tralleis Yokuşu & Kalfaköy Batısı',
    minX: -102,
    maxX: -19,
    minZ: -185,
    maxZ: -72,
  },
  {
    id: 'tralleis-kalfakoy',
    name: 'Kalfaköy & Tralleis Tepesi',
    subtitle: 'Kuzey Sırtı (~155–205 m Rakım)',
    minX: -19,
    maxX: 46,
    minZ: -185,
    maxZ: -72,
  },
  {
    id: 'aytepe-adu',
    name: 'Aytepe · ADÜ Kampüsü (Tepe)',
    subtitle: 'Aytepe Yokuşu (~176 m Rakım)',
    minX: 46,
    maxX: 215,
    minZ: -185,
    maxZ: -72,
  },
  {
    id: 'orta-mahalle',
    name: 'Orta Mahalle (Tabakhane Doğu)',
    subtitle: 'Doğu Yamaç · Tarihi Taş Sokaklar',
    minX: 59,
    maxX: 215,
    minZ: -72,
    maxZ: -18,
  },
  {
    id: 'cuma-yagcilar',
    name: 'Cuma Mahallesi & Yağcılar İçi',
    subtitle: 'Batı Gazi Blv. & Yağcılar Çarşısı',
    minX: -152,
    maxX: -58,
    minZ: -74,
    maxZ: -16,
  },
  {
    id: 'hasanefendi-ramazanpasa',
    name: 'Hasanefendi – Ramazan Paşa Mah.',
    subtitle: 'Ramazan Paşa & Bey Camii · Sevgi Yolu',
    minX: -58,
    maxX: -19,
    minZ: -72,
    maxZ: 10,
  },
  {
    id: 'koprulu-veysipasa',
    name: 'Köprülü – Veysipaşa Mahallesi',
    subtitle: 'Cihanoğlu · Nasuh Paşa · Çankaya Cd.',
    minX: -19,
    maxX: 59,
    minZ: -72,
    maxZ: -20,
  },
  {
    id: 'mesrutiyet-east',
    name: 'Meşrutiyet Mahallesi',
    subtitle: 'Tabakhane Doğu & Doğu Gazi Blv.',
    minX: 59,
    maxX: 215,
    minZ: -18,
    maxZ: 10,
  },
  {
    id: 'efeler-girne',
    name: 'Efeler & Girne Mahallesi',
    subtitle: 'Batı Büyük Menderes Ovası · İzmir Yolu',
    minX: -240,
    maxX: -152,
    minZ: 8,
    maxZ: 96,
  },
  {
    id: 'cumhuriyet-mah',
    name: 'Cumhuriyet Mahallesi',
    subtitle: 'Nevzat Biçer Parkı · Atatürk Blv.',
    minX: -152,
    maxX: -58,
    minZ: -16,
    maxZ: 52,
  },
  {
    id: 'guzelhisar-merkez',
    name: 'Güzelhisar Mahallesi · Merkez',
    subtitle: 'Atatürk Kent Meydanı · Sevgi Yolu',
    minX: -58,
    maxX: 59,
    minZ: -20,
    maxZ: 52,
  },
  {
    id: 'yedi-eylul',
    name: 'Yedi Eylül Mahallesi · Doğu Blv.',
    subtitle: 'Tekstil Park (Sümerbank) & Forum Aydın',
    minX: 59,
    maxX: 215,
    minZ: 10,
    maxZ: 68,
  },
  {
    id: 'ilicabasi-south',
    name: 'Ilıcabaşı Mahallesi',
    subtitle: 'Demiryolu Güneyi · Menderes Ovası',
    minX: -240,
    maxX: 215,
    minZ: 96,
    maxZ: 165,
  },
  {
    id: 'kurtulus-station',
    name: 'Kurtuluş Mahallesi · İstasyon',
    subtitle: 'Tarihi Tren Garı · Kipa · İstasyon Blv.',
    minX: -152,
    maxX: 215,
    minZ: 52,
    maxZ: 96,
  },
];

export const ANCIENT_SIGNPOST_POSITIONS: [number, number][] = [
  [-10.4, -36.2],
  [74.5, -0.4],
];

export const PLAYER_HOME_POS: [number, number] = [-32.0, -16.0];
export const PLAYER_HOME_DOOR_POS: [number, number] = [-26.5, -16.0];

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

export const RADIO_STATIONS: RadioStationDef[] = [
  {
    id: 'aegean',
    frequency: '92.4 FM',
    label: 'Ege Akşamı Lo-Fi',
    region: 'Kent Meydanı & Sevgi Yolu',
    mood: 'Ilık Ege meltemi, sıcak Rhodes akorları ve akşam çayı huzuru.',
    bpmLabel: '65 BPM · Sıcak Rhodes',
    accentColor: '#C85A32',
    matchingDistricts: [
      'Güzelhisar Mahallesi · Merkez',
      'Cumhuriyet Mahallesi',
      'Efeler & Girne Mahallesi',
      'Yedi Eylül Mahallesi · Doğu Blv.',
      'Meşrutiyet Mahallesi',
    ],
  },
  {
    id: 'bazaar_oud',
    frequency: '95.8 FM',
    label: 'Çarşı Nostaljisi',
    region: 'Tarihi Çarşı & Nasuh Paşa',
    mood: 'Hicaz esintili akustik ud tınıları ve taş han avlusu dinginliği.',
    bpmLabel: '72 BPM · Hicaz Akustik',
    accentColor: '#A96B2B',
    matchingDistricts: [
      'Hasanefendi – Ramazan Paşa Mah.',
      'Köprülü – Veysipaşa Mahallesi',
      'Cuma Mahallesi & Yağcılar İçi',
    ],
  },
  {
    id: 'tralleis_echo',
    frequency: '98.2 FM',
    label: 'Antik Mermer Yankısı',
    region: 'Tralleis & Magnesia Antik',
    mood: 'Antik sütunlar ve zeytinlikler arasında süzülen dingin ambiyans.',
    bpmLabel: '58 BPM · Antik Ambient',
    accentColor: '#7A543E',
    matchingDistricts: [
      'Germencik · Magnesia Antik Yolu',
      'Kemer Mahallesi (Kuzeybatı Yamaç)',
      'Zafer Mahallesi (Tralleis Batı Sırtı)',
      'Kalfaköy & Tralleis Tepesi',
    ],
  },
  {
    id: 'aytepe_campus',
    frequency: '101.6 FM',
    label: 'Aytepe Kampüs Beats',
    region: 'ADÜ Aytepe Üniversitesi',
    mood: 'Tepe manzarasında ders ve keşif için ritmik kampüs chillhop.',
    bpmLabel: '96 BPM · Kampüs Chillhop',
    accentColor: '#4E7D4A',
    matchingDistricts: ['Aytepe · ADÜ Kampüsü (Tepe)'],
  },
  {
    id: 'rainy_piano',
    frequency: '103.5 FM',
    label: 'Tabakhane Dere Piyanosu',
    region: 'Orta Mahalle & Dere Boyu',
    mood: 'Su sesi ve taş köprülerle uyumlu yumuşak keçe piyano melodileri.',
    bpmLabel: '56 BPM · Keçe Piyano',
    accentColor: '#3B6E8C',
    matchingDistricts: ['Orta Mahalle (Tabakhane Doğu)'],
  },
  {
    id: 'night_lofi',
    frequency: '106.0 FM',
    label: 'Gece Kahvesi Lo-Fi',
    region: 'Kurtuluş & İstasyon Blv.',
    mood: 'Tarihi tren garı ışıkları altında caz fırçalı gece ritimleri.',
    bpmLabel: '88 BPM · Caz Lo-Fi',
    accentColor: '#5B4570',
    matchingDistricts: ['Kurtuluş Mahallesi · İstasyon', 'Ilıcabaşı Mahallesi'],
  },
  {
    id: 'ambient_only',
    frequency: 'DOĞA',
    label: 'Sadece Efeler Doğası',
    region: 'Tüm Efeler',
    mood: 'Radyo kapalı — yalnızca kuş cıvıltıları, rüzgar ve dere sesi.',
    bpmLabel: 'Doğal Ambiyans',
    accentColor: '#6B5038',
    matchingDistricts: [],
  },
];

export const LOFI_TRACKS: { id: LofiTrackId; label: string }[] = RADIO_STATIONS.map((s) => ({
  id: s.id,
  label: `${s.frequency === 'DOĞA' ? '' : `${s.frequency} · `}${s.label}`,
}));

export function getRadioStationForDistrict(districtName: string): RadioStationDef {
  return (
    RADIO_STATIONS.find((s) => s.matchingDistricts.includes(districtName)) ?? RADIO_STATIONS[0]
  );
}

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
  'Alabanda & Alinda (Çine / Karpuzlu)',
  'Priene & Milet (Söke / Didim)',
  'Afrodisias Antik Kenti (Karacasu)',
  'Didyma Apollon Tapınağı (Didim)',
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
    title: 'Efeler Gezgini: Büyükşehir Kaşifi',
    subtitle: 'Aydın Büyükşehir Belediyesi',
    description: 'Altın yansımalı cam kule ve önündeki Atatürk Anıtı’nı keşfettiniz.',
    icon: '🏛️',
    accentColor: '#D4A843',
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
  {
    id: 'badge-landmark-magnesia',
    category: 'landmark',
    targetId: 'magnesia',
    title: 'Efeler Gezgini: Artemis Tapınağı Seyyahı',
    subtitle: 'Magnesia Antik Kenti',
    description: 'Batı yolundan büyüyen haritada Artemis Tapınağı ve mozaik agorayı keşfettiniz.',
    icon: '🏛️',
    accentColor: '#C99A5B',
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
    subtitle: 'Görev · Büyükşehir → Tekstil Park',
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
  {
    id: 'badge-errand-magnesia',
    category: 'errand',
    targetId: 'errand-magnesia',
    title: 'Efeler Gezgini: Antik Kent Arkeoloğu',
    subtitle: 'Görev · Tralleis → Magnesia',
    description: 'Kazı envanter defterini batı yolu üzerinden Magnesia Artemis Tapınağı’na ulaştırdınız.',
    icon: '📜',
    accentColor: '#C99A5B',
  },
  {
    id: 'badge-landmark-nevzatbicerpark',
    category: 'landmark',
    targetId: 'nevzatbicerpark',
    title: 'Efeler Gezgini: Parkın Akustik Dostu',
    subtitle: 'Nevzat Biçer Parkı',
    description: 'Amfi tiyatrosu, süs havuzu ve gitar çalan gençleriyle Nevzat Biçer Parkı’nı keşfettiniz.',
    icon: '🎸',
    accentColor: '#4E8752',
  },
  {
    id: 'badge-landmark-kipaavm',
    category: 'landmark',
    targetId: 'kipaavm',
    title: 'Efeler Gezgini: İstasyon Bulvarı Müdavimi',
    subtitle: 'Aydın Kipa AVM',
    description: 'Cumhuriyet Mahallesi İstasyon Caddesi’ndeki Kipa AVM meydanını ziyaret ettiniz.',
    icon: '🛍️',
    accentColor: '#15549A',
  },
  {
    id: 'badge-errand-nevzatbicer',
    category: 'errand',
    targetId: 'errand-nevzatbicer',
    title: 'Efeler Gezgini: Park Akustiği Ortağı',
    subtitle: 'Görev · Kent Meydanı → Nevzat Biçer Parkı',
    description: 'Nevzat Biçer Parkı’nda gitar çalan gençlere sıcak çay ve kurabiyeleri ulaştırdınız.',
    icon: '🫖',
    accentColor: '#4E8752',
  },
  {
    id: 'badge-errand-kipa',
    category: 'errand',
    targetId: 'errand-kipa',
    title: 'Efeler Gezgini: İstasyon Alışverişçisi',
    subtitle: 'Görev · Nevzat Biçer Parkı → Kipa AVM',
    description: 'Park kafesinin market siparişini İstasyon Bulvarı Kipa AVM’den teslim aldınız.',
    icon: '🛒',
    accentColor: '#15549A',
  },
  {
    id: 'badge-landmark-sevgiyolu',
    category: 'landmark',
    targetId: 'sevgiyolu',
    title: 'Efeler Gezgini: Sevgi Yolu Yürüyüşçüsü',
    subtitle: 'Sevgi Yolu (Güzelhisar)',
    description: 'Işık kemerleri, sahaflar ve çiçekçilerle bezeli Sevgi Yolu aksını keşfettiniz.',
    icon: '✨',
    accentColor: '#C85A32',
  },
  {
    id: 'badge-landmark-yagcilarici',
    category: 'landmark',
    targetId: 'yagcilarici',
    title: 'Efeler Gezgini: Arasta Esnaf Dostu',
    subtitle: 'Yağcılar İçi Tarihi Çarşısı',
    description: 'Zeytinyağı küpleri ve baharat kokulu tarihi Yağcılar İçi çarşısını keşfettiniz.',
    icon: '🫒',
    accentColor: '#7A8243',
  },
  {
    id: 'badge-errand-sevgiyolu',
    category: 'errand',
    targetId: 'errand-sevgiyolu',
    title: 'Efeler Gezgini: Sahaf Koleksiyoneri',
    subtitle: 'Görev · Ramazan Paşa → Sevgi Yolu',
    description: 'Antika Aydın Efeler albümünü Sevgi Yolu sahaf tezgahına güvenle teslim ettiniz.',
    icon: '📚',
    accentColor: '#A65D57',
  },
  {
    id: 'badge-errand-yagcilar',
    category: 'errand',
    targetId: 'errand-yagcilar',
    title: 'Efeler Gezgini: Tarihi Arasta Kuryesi',
    subtitle: 'Görev · Yağcılar İçi → Zincirli Han',
    description: 'Soğuk sıkım zeytinyağı ve incir sepetini Yağcılar İçi’nden Zincirli Han avlusuna ulaştırdınız.',
    icon: '🏺',
    accentColor: '#6D7A4E',
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
