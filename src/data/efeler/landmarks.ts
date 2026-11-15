import { LandmarkDef } from '../../types/game';

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

export const ANCIENT_SIGNPOST_POSITIONS: [number, number][] = [
  [-10.4, -36.2],
  [74.5, -0.4],
];

export const PLAYER_HOME_POS: [number, number] = [-32.0, -16.0];
export const PLAYER_HOME_DOOR_POS: [number, number] = [-26.5, -16.0];

export const UPCOMING_ANCIENT_CITIES = [
  'Nysa Antik Kenti (Sultanhisar)',
  'Alabanda & Alinda (Çine / Karpuzlu)',
  'Priene & Milet (Söke / Didim)',
  'Afrodisias Antik Kenti (Karacasu)',
  'Didyma Apollon Tapınağı (Didim)',
];
