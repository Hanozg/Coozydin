import { AncientCityDef, AncientCityId, MuseumExhibitDef } from '../types/game';

/**
 * All 7 enterable 1:1 photorealistic Aydın Ancient Cities & Open-Air Museums.
 */
export const ANCIENT_CITIES: AncientCityDef[] = [
  {
    id: 'tralleis',
    name: 'Tralleis Antik Kenti',
    shortName: 'Tralleis',
    district: 'Efeler · Kalfaköy Sırtları',
    era: 'MÖ 4. Yüzyıl – MS 3. Yüzyıl',
    tagline: 'Üç Gözler Kemerleri, Sütunlu Agora & Seikilos Steli',
    description:
      'Aydın’ın hemen kuzey yamacında yükselen Tralleis; anıtsal Üç Gözler gymnasium kemerleri, Genç Atlet (Ephebos) heykeli, dünyanın en eski eksiksiz müzik notası Seikilos steli, antik tiyatrosu ve tonozlu yeraltı mahzeniyle Efeler’in kadim kalbidir.',
    landmarkId: 'tralleis',
    spawnPos: [0, 0, 14.5],
    spawnYaw: Math.PI,
    defaultZoneName: 'Tralleis Antik Kenti',
    plazaZoneName: 'Üç Gözler Anıtsal Meydanı',
    westZoneName: 'Sütunlu Agora & Stoa',
    eastZoneName: 'Roma Mozaik Avlusu',
    northZoneName: 'Antik Tiyatro Basamakları (Cavea)',
    cryptZoneName: 'Tonozlu Yeraltı Mahzeni (Cryptoporticus)',
    skyTheme: {
      zenithHex: 0x4b6e98,
      horizonHex: 0xf0b574,
      groundHex: 0xa67c52,
      fogHex: 0xd9b388,
      fogDensity: 0.0082,
      sunColorHex: 0xffbd72,
      sunIntensity: 2.85,
      sunPos: [-44, 28, 30],
      hemiSkyHex: 0xffe4be,
      hemiGroundHex: 0x6f543b,
      godRayHex: 0xffd28c,
    },
  },
  {
    id: 'magnesia',
    name: 'Magnesia Antik Kenti',
    shortName: 'Magnesia',
    district: 'Germencik · Tekin Mahallesi',
    era: 'MÖ 4. Yüzyıl · Hermogenes’in Başyapıtı',
    tagline: 'Artemis Leukophryene Tapınağı, Kutsal Agora & Stadyum',
    description:
      'Ünlü mimar Hermogenes’in pseudodipteros planıyla antik mimarlığa damga vurduğu Magnesia; beyaz mermer Artemis Tapınağı, kutsal tören agorası, kabartmalı sunakları ve iyi korunmuş antik stadyumuyla Menderes ovasının batı kapısıdır.',
    landmarkId: 'magnesia',
    spawnPos: [0, 0, 15.5],
    spawnYaw: Math.PI,
    defaultZoneName: 'Magnesia Antik Kenti',
    plazaZoneName: 'Artemis Leukophryene Kutsal Alanı',
    westZoneName: 'Kutsal Agora & Tören Sunağı',
    eastZoneName: 'Roma Hamamı & Mozaik Avlusu',
    northZoneName: 'Magnesia Stadyumu & Theatron',
    cryptZoneName: 'Artemis Tapınağı Tonozlu Hazine Mahzeni',
    skyTheme: {
      zenithHex: 0x466d9b,
      horizonHex: 0xf2bf7e,
      groundHex: 0x9f7951,
      fogHex: 0xdfbc90,
      fogDensity: 0.0078,
      sunColorHex: 0xffc67d,
      sunIntensity: 2.9,
      sunPos: [-48, 30, 26],
      hemiSkyHex: 0xffe8c7,
      hemiGroundHex: 0x6c533c,
      godRayHex: 0xffd899,
    },
  },
  {
    id: 'nysa',
    name: 'Nysa Antik Kenti',
    shortName: 'Nysa',
    district: 'Sultanhisar · Zeytinlik Vadisi',
    era: 'MÖ 3. Yüzyıl – MS 2. Yüzyıl · Strabon’un Kenti',
    tagline: 'Antik Kütüphane, Gerontikon Meclisi & Vadi Tüneli',
    description:
      'Antik çağın büyük coğrafyacısı Strabon’un eğitim gördüğü Nysa; iki katlı kemerli kütüphanesi, yarım daire mermer Gerontikon (Yaşlılar Meclisi), vadiyi aşan Roma köprüsü ve altından su geçen tonozlu tüneliyle bir bilim kentidir.',
    spawnPos: [0, 0, 15.2],
    spawnYaw: Math.PI,
    defaultZoneName: 'Nysa Antik Kenti',
    plazaZoneName: 'Nysa Antik Kütüphane Meydanı',
    westZoneName: 'Gerontikon (Yaşlılar Meclisi)',
    eastZoneName: 'Vadi Köprüsü & Strabon Terası',
    northZoneName: 'Nysa Büyük Antik Tiyatrosu',
    cryptZoneName: 'Nysa Vadisi Tonozlu Yeraltı Su Tüneli',
    skyTheme: {
      zenithHex: 0x446888,
      horizonHex: 0xe6af72,
      groundHex: 0x866c4b,
      fogHex: 0xcfad84,
      fogDensity: 0.0086,
      sunColorHex: 0xffb76b,
      sunIntensity: 2.78,
      sunPos: [-40, 26, 34],
      hemiSkyHex: 0xfbe0ba,
      hemiGroundHex: 0x5c5239,
      godRayHex: 0xffcf84,
    },
  },
  {
    id: 'aphrodisias',
    name: 'Afrodisias Antik Kenti',
    shortName: 'Afrodisias',
    district: 'Karacasu · Geyre (UNESCO Dünya Mirası)',
    era: 'MÖ 2. Yüzyıl – MS 5. Yüzyıl · Mermer & Heykel Kenti',
    tagline: 'Tetrapylon Kapısı, Afrodit Tapınağı & Sebasteion',
    description:
      'UNESCO Dünya Mirası Afrodisias; kıvrımlı yivli sütunlarıyla ünlü anıtsal Tetrapylon kapısı, göğe yükselen Afrodit Tapınağı, kabartmalı Sebasteion galerisi ve dünyaca ünlü heykeltıraşlık okuluyla Anadolu’nun en zarif mermer kentidir.',
    spawnPos: [0, 0, 15.8],
    spawnYaw: Math.PI,
    defaultZoneName: 'Afrodisias Antik Kenti',
    plazaZoneName: 'Tetrapylon Anıtsal Geçidi',
    westZoneName: 'Afrodit Tapınağı Kutsal Alanı',
    eastZoneName: 'Sebasteion & Heykeltıraşlık Atölyesi',
    northZoneName: 'Afrodisias Antik Stadyumu',
    cryptZoneName: 'Tonozlu Mermer Heykel Atölyesi Mahzeni',
    skyTheme: {
      zenithHex: 0x4e6c96,
      horizonHex: 0xf4be86,
      groundHex: 0xa4805c,
      fogHex: 0xe2be98,
      fogDensity: 0.0076,
      sunColorHex: 0xffc785,
      sunIntensity: 2.95,
      sunPos: [-46, 29, 28],
      hemiSkyHex: 0xfff0d6,
      hemiGroundHex: 0x735b44,
      godRayHex: 0xffe0a8,
    },
  },
  {
    id: 'priene',
    name: 'Priene Antik Kenti',
    shortName: 'Priene',
    district: 'Söke · Güllübahçe · Samsun Dağı Eteği',
    era: 'MÖ 4. Yüzyıl · Hellenistik Izgara Kent Planı',
    tagline: 'Athena Polias Tapınağı, Buleuterion & Hellenistik Tiyatro',
    description:
      'Mykale (Samsun) Dağı’nın sarp kayalıklarına yaslanan Priene; mimar Pytheos’un Athena Polias Tapınağı, kare planlı basamaklı Buleuterion meclisi, Hippodamos’un kusursuz ızgara caddeleri ve mermer onur koltuklu tiyatrosuyla eşsizdir.',
    spawnPos: [0, 0, 15.4],
    spawnYaw: Math.PI,
    defaultZoneName: 'Priene Antik Kenti',
    plazaZoneName: 'Athena Polias Tapınak Terası',
    westZoneName: 'Buleuterion (Kent Meclisi)',
    eastZoneName: 'Hippodamos Caddesi & Kutsal Stoa',
    northZoneName: 'Priene Hellenistik Tiyatrosu',
    cryptZoneName: 'Kaya Tonozlu Sarnıç & Gizli Geçit',
    skyTheme: {
      zenithHex: 0x3e5e8a,
      horizonHex: 0xe9a669,
      groundHex: 0x8f6b4b,
      fogHex: 0xd4a980,
      fogDensity: 0.0085,
      sunColorHex: 0xffb366,
      sunIntensity: 2.82,
      sunPos: [-50, 24, 24],
      hemiSkyHex: 0xf9dcb7,
      hemiGroundHex: 0x624d39,
      godRayHex: 0xffc97d,
    },
  },
  {
    id: 'milet_didyma',
    name: 'Milet & Didyma Kutsal Alanı',
    shortName: 'Milet & Didyma',
    district: 'Didim · Balat & Yenihisar',
    era: 'MÖ 6. Yüzyıl – MS 2. Yüzyıl · Filozoflar & Kehanet Yolu',
    tagline: 'Apollon Tapınağı, Medusa Kabartması & Kehanet Tüneli',
    description:
      'Thales ve Anaximandros’un doğduğu Milet ile Kutsal Yol’un ulaştığı Didyma Apollon Kehanet Merkezi; dev çift sıralı sütun ormanı, anıtsal Medusa başı kabartması, Faustina Hamamı ve karanlık tonozlu kehanet tüneliyle Ege’nin efsanesidir.',
    spawnPos: [0, 0, 16.0],
    spawnYaw: Math.PI,
    defaultZoneName: 'Milet & Didyma Kutsal Alanı',
    plazaZoneName: 'Didyma Apollon Tapınağı & Medusa Avlusu',
    westZoneName: 'Faustina Hamamı & Menderes Salonu',
    eastZoneName: 'Milet Kutsal Yol & Liman Kapısı',
    northZoneName: 'Milet Büyük Antik Tiyatrosu',
    cryptZoneName: 'Didyma Karanlık Kehanet Tüneli (Adyton)',
    skyTheme: {
      zenithHex: 0x3d6a9c,
      horizonHex: 0xf2bd80,
      groundHex: 0x9b7a54,
      fogHex: 0xdcb890,
      fogDensity: 0.0079,
      sunColorHex: 0xffc478,
      sunIntensity: 2.92,
      sunPos: [-46, 27, 32],
      hemiSkyHex: 0xffe6c4,
      hemiGroundHex: 0x6b5742,
      godRayHex: 0xffd794,
    },
  },
  {
    id: 'alinda_alabanda',
    name: 'Alinda & Alabanda Antik Kentleri',
    shortName: 'Alinda & Alabanda',
    district: 'Karpuzlu & Çine · Karya Dağları',
    era: 'MÖ 4. Yüzyıl – MS 2. Yüzyıl · Karya Kraliçesi Ada',
    tagline: '3 Katlı Alinda Agorası, Su Kemeri & Apollon Tapınağı',
    description:
      'Karya Kraliçesi Ada’nın Büyük İskender’i karşıladığı Alinda’nın üç katlı dev pazar binası, su kemerleri ve Alabanda’nın Apollon İsotimos Tapınağı; güney Aydın’ın granit kayalıklarında yükselen görkemli Karya mirasıdır.',
    spawnPos: [0, 0, 15.2],
    spawnYaw: Math.PI,
    defaultZoneName: 'Alinda & Alabanda',
    plazaZoneName: 'Alinda 3 Katlı Anıtsal Agora Meydanı',
    westZoneName: 'Alabanda Apollon İsotimos Kutsal Alanı',
    eastZoneName: 'Karya Su Kemeri & Mozaik Avlusu',
    northZoneName: 'Karya Yamaç Antik Tiyatrosu',
    cryptZoneName: 'Kaya Tonozlu Karya Hazine & Zeytinyağı Mahzeni',
    skyTheme: {
      zenithHex: 0x4b6489,
      horizonHex: 0xeaa96b,
      groundHex: 0x8e6949,
      fogHex: 0xd2a87f,
      fogDensity: 0.0084,
      sunColorHex: 0xffb569,
      sunIntensity: 2.8,
      sunPos: [-42, 25, 30],
      hemiSkyHex: 0xf8ddb8,
      hemiGroundHex: 0x634b38,
      godRayHex: 0xffcc82,
    },
  },
];

export const ANCIENT_CITY_MAP = new Map<AncientCityId, AncientCityDef>(
  ANCIENT_CITIES.map((city) => [city.id, city])
);

/**
 * Curated open-air museum exhibits across ALL 7 Aydın Ancient Cities (38 exhibits total).
 * All original 8 Tralleis exhibit IDs are preserved verbatim for backward save compatibility.
 */
export const MUSEUM_EXHIBITS: MuseumExhibitDef[] = [
  // ============================================================================
  // 1. TRALLEIS ANTİK KENTİ (8 ESER)
  // ============================================================================
  {
    id: 'tralleis_uc_gozler',
    cityId: 'tralleis',
    catalogCode: 'TRL-01',
    title: 'Üç Gözler Anıtsal Kemerleri',
    subtitle: 'Tralleis Roma Gymnasiumu Ana Cephesi',
    period: 'MS 2. Yüzyıl · Roma İmparatorluk Dönemi',
    zone: 'Üç Gözler Anıtsal Meydanı',
    material: 'Aydın Traverteni, Horasan Harcı ve Roma Tuğlası',
    dimensions: 'Yükseklik ~16,5 m · Açıklık 3 Beşik Kemer',
    position: [0, 0, 0],
    standPosition: [4.6, 0, 6.2],
    standRotationY: -0.35,
    focusCameraPos: [7.8, 3.1, 13.6],
    focusLookAt: [0, 4.9, 0],
    shortDescription:
      'Tralleis’in simgesi hâline gelen Üç Gözler, antik kentin görkemli gymnasium kompleksinden ayakta kalan üç kemerli anıtsal yapıdır.',
    historicalStory:
      'Aydın’ın hemen kuzey yamacında yükselen Tralleis Antik Kenti, Hellenistik dönemden Roma çağına dek Ege’nin en varlıklı kültür, eğitim ve sanat merkezlerinden biriydi. Halk arasında “Üç Gözler” adıyla anılan bu dev kemerler, gençlerin beden eğitimi ve felsefe dersi aldığı büyük Roma Gymnasiumu’nun güney cephesini oluşturur. İmparator Augustus dönemindeki büyük depremden sonra yeniden güçlendirilerek yüzyıllara meydan okumuştur.',
    architecturalNote:
      'Masif kesme traverten ayaklar üzerine oturan üç yüksek beşik kemer, üst kat nişleri ve tuğla-taş almaşık örgü tekniğiyle Aydın’da günümüze ulaşan en anıtsal Roma strüktürüdür.',
    voiceNarrationText:
      'Karşınızda Aydın’ın kadim simgesi Tralleis Üç Gözler Kemerleri bulunuyor. Milattan Sonra 2. yüzyılda inşa edilen bu görkemli yapı, antik kentin büyük gymnasium kompleksinin ana cephesidir. Altından geçerken yüzyıllardır aşınmış Aydın travertenlerinin üzerindeki yosun dokularını ve ikindi güneşinin kemerlerden süzülen ışık huzmelerini izleyebilirsiniz.',
    rewardCoins: 35,
  },
  {
    id: 'tralleis_ephebos',
    cityId: 'tralleis',
    catalogCode: 'TRL-02',
    title: 'Genç Atlet Heykeli (Ephebos)',
    subtitle: 'Tralleis Heykeltıraşlık Okulu Başyapıtı',
    period: 'MS 1. Yüzyıl · Erken İmparatorluk Dönemi',
    zone: 'Sütunlu Agora & Stoa',
    material: 'İnce Taneli Beyaz Anadolu Mermeri',
    dimensions: 'Yükseklik 148 cm · Mermer Kaide 92 cm',
    position: [-22, 0.45, 2],
    standPosition: [-18.8, 0.45, 4.1],
    standRotationY: 0.72,
    focusCameraPos: [-17.4, 2.25, 5.8],
    focusLookAt: [-22, 2.05, 2],
    shortDescription:
      'Gymnasiumda dinlenen genç bir atleti betimleyen ve Tralleis heykeltıraşlık okulunun zarafetini yansıtan ünlü mermer heykel.',
    historicalStory:
      '1902 yılındaki Tralleis kazılarında gün yüzüne çıkarılan Genç Atlet (Ephebos) heykeli, pelerinine sarınmış hâlde bir sütuna yaslanıp dinlenen genç bir sporcuyu betimler. Tralleis, antik çağda özellikle yontu sanatında ün salmış; buradan yetişen ustalar Roma ve Rodos’a dek uzanan anıtsal heykellere imza atmıştır. Heykelin sakin duruşu ve derin kıvrımlı mermer işçiliği antik Ege estetiğinin zirvelerindendir.',
    architecturalNote:
      'Yivli İyonik sütunların çevrelediği yükseltilmiş agora stoa platformu üzerinde, kılcal çatlaklı mermer kaidesiyle altın saat ışığını yumuşakça yansıtır.',
    voiceNarrationText:
      'Şu an Sütunlu Agora içinde, Tralleis heykeltıraşlık okulunun dünyaca tanınan eseri Genç Atlet, yani Ephebos heykelinin önündesiniz. Milattan Sonra 1. yüzyıla tarihlenen bu mermer başyapıt, yarış sonrası pelerinine sarınarak dinlenen bir gencin huzurlu dinginliğini yansıtır.',
    rewardCoins: 35,
  },
  {
    id: 'tralleis_agora_stoa',
    cityId: 'tralleis',
    catalogCode: 'TRL-03',
    title: 'Sütunlu Agora ve Ticaret Stoası',
    subtitle: 'Hellenistik & Roma Kent Meydanı Revakları',
    period: 'MÖ 2. – MS 2. Yüzyıl',
    zone: 'Sütunlu Agora & Stoa',
    material: 'Yivli Mermer Sütunlar ve Kabartmalı Friz Blokları',
    dimensions: 'Stoa Uzunluğu 24 m · Sütun Yüksekliği 5,4 m',
    position: [-23, 0.45, -7.5],
    standPosition: [-17.5, 0.45, -5.6],
    standRotationY: 1.15,
    focusCameraPos: [-14.2, 2.8, -1.8],
    focusLookAt: [-23.5, 2.8, -7.5],
    shortDescription:
      'Tralleis vatandaşlarının ticaret, felsefe ve şehir meclisi buluşmalarına ev sahipliği yapan gölgeli mermer sütunlu galeri.',
    historicalStory:
      'Menderes ovasının bereketli tarım ve tekstil ürünleri yüzyıllar boyunca Tralleis Agorası’nda el değiştirdi. Güneşten ve kış yağmurlarından koruyan uzun sütunlu stoa galerileri, yalnızca dükkanlara değil; retorik hocalarının öğrencileriyle tartıştığı açık hava dersliklerine de ev sahipliği yapıyordu. Yere devrilmiş yivli sütun tamburları, bölgenin tarih boyunca geçirdiği büyük Menderes depremlerinin sessiz tanıklarıdır.',
    architecturalNote:
      'İki basamaklı mermer stylobat üzerine dizilmiş yivli gövdeler, volütlü başlıklar ve ovolo-meander kabartmalı arşitrav kirişleriyle klasik Anadolu-İyon düzenini yansıtır.',
    voiceNarrationText:
      'Tralleis Sütunlu Agorası ve Ticaret Stoası’ndasınız. İki bin yıl önce bu mermer revakların gölgesinde zeytinyağı tüccarları, çömlek ustaları ve felsefe öğrencileri bir araya gelirdi. Zemin boyunca uzanan kırık sütun tamburları, antik kentin geçirdiği büyük depremlerin izlerini günümüze taşır.',
    rewardCoins: 35,
  },
  {
    id: 'tralleis_seikilos',
    cityId: 'tralleis',
    catalogCode: 'TRL-04',
    title: 'Seikilos Mezar Steli ve Ezgisi',
    subtitle: 'Dünyanın En Eski Eksiksiz Müzik Notası',
    period: 'MS 1. – 2. Yüzyıl · Tralleis',
    zone: 'Roma Mozaik Avlusu',
    material: 'Silindirik Beyaz Mermer Sütun Stel',
    dimensions: 'Yükseklik 162 cm · Çap 38 cm',
    position: [22.5, 0.15, 2.5],
    standPosition: [19.4, 0.15, 4.4],
    standRotationY: -0.68,
    focusCameraPos: [18.5, 2.05, 5.7],
    focusLookAt: [22.5, 1.65, 2.5],
    shortDescription:
      'Aydın’da bulunan ve üzerinde hem sözleri hem antik Yunan müzik notaları eksiksiz korunmuş dünyadaki en eski besteyi taşıyan mermer stel.',
    historicalStory:
      '1883 yılında Aydın-İzmir demiryolu inşaatı sırasında Tralleis yakınlarında bulunan bu silindirik mermer stel, Seikilos’un eşi Euterpe anısına dikilmiştir. Gövdesine kazınmış dizeler yalnızca bir şiir değil, harflerin üzerine işlenmiş antik vokal notasyon işaretleriyle eksiksiz bir müzik parçasıdır. Yazıt insanlığa iki bin yıl öncesinden seslenir: “Yaşadığın sürece parla, hiç üzülme; hayat kısadır ve zaman bedelini ister.”',
    architecturalNote:
      'İnce perdahlı silindirik mermer gövde üzerine derin oyulmuş epigrafik bantlar ve antik nota işaretleri, eğik ikindi ışığında kabartma gölgesiyle belirginleşir.',
    voiceNarrationText:
      'Önünde durduğunuz bu zarif mermer sütun, müzik tarihinin en değerli keşiflerinden Seikilos Mezar Steli’dir. Aydın topraklarında bulunan bu yazıt, sözleri ve notaları eksiksiz günümüze ulaşan dünyanın en eski şarkısını taşır: Yaşadığın sürece parla, hiç üzülme; çünkü hayat kısadır.',
    rewardCoins: 35,
  },
  {
    id: 'tralleis_mosaic',
    cityId: 'tralleis',
    catalogCode: 'TRL-05',
    title: 'Ege Geometrik Yer Mozaiği',
    subtitle: 'Roma Avlu ve Hamam Tessera Döşemesi',
    period: 'MS 2. – 3. Yüzyıl · Roma Dönemi',
    zone: 'Roma Mozaik Avlusu',
    material: 'Doğal Renkli Mermer, Terracotta ve Kireçtaşı Tesseralar',
    dimensions: '11,5 m × 9,5 m Mozaik Halı Alanı',
    position: [22, 0.08, -4.5],
    standPosition: [16.2, 0.08, -1.8],
    standRotationY: -1.1,
    focusCameraPos: [15.4, 3.6, 1.5],
    focusLookAt: [22.2, 0.15, -4.5],
    shortDescription:
      'Binlerce el kesimi renkli taş küpçüğün örgü, dalga ve sekizgen yıldız motifleriyle birleştiği antik Roma avlu mozaiği.',
    historicalStory:
      'Tralleis’in varlıklı Roma hamamları ve sütunlu villaları, boya yerine doğal renkli Anadolu taşlarının milimetrik kesilmesiyle hazırlanan mozaik halılarla kaplanırdı. Menderes nehrinin kıvrımlarını simgeleyen meander bordürleri, terracotta kırmızısı, zeytin koyusu ve Aydın traverteninin sıcak krem tonlarıyla birleşerek iki bin yıl boyunca solmayan bir zemin sanatı oluşturmuştur.',
    architecturalNote:
      'Kireç harçlı alt tabaka üzerine dizilen küçük tessera taşları, mikro yüzey pürüzlülüğü ve taş aralarındaki ince derz dokusuyla mermer yürüyüş bordürleriyle çerçevelenir.',
    voiceNarrationText:
      'Ayaklarınızın altında uzanan Ege Geometrik Yer Mozaiği, Milattan Sonra 2. ve 3. yüzyıllarda binlerce renkli doğal taşın sabırla dizilmesiyle oluşturulmuştur. Kenarlardaki kıvrımlı meander desenleri, Aydın ovasına hayat veren Büyük Menderes Nehri’nin antik sanat dilindeki simgesidir.',
    rewardCoins: 35,
  },
  {
    id: 'tralleis_theater',
    cityId: 'tralleis',
    catalogCode: 'TRL-06',
    title: 'Tralleis Antik Tiyatrosu (Cavea)',
    subtitle: 'Yamaç Mermer Oturma Sıraları ve Orkestra',
    period: 'MÖ 2. Yüzyıl (Hellenistik) · MS 1. Yüzyıl (Roma Onarımı)',
    zone: 'Antik Tiyatro Basamakları',
    material: 'Kademeli Beyaz Mermer Basamaklar ve Traverten Temel',
    dimensions: 'Yarım Daire Cavea · Tırmanılabilir 9 Kademe Sıra',
    position: [0, 0.2, -31],
    standPosition: [-6.8, 0.1, -21.5],
    standRotationY: 0.45,
    focusCameraPos: [-10.5, 4.8, -17.5],
    focusLookAt: [0, 2.4, -34],
    shortDescription:
      'Kuzey yamacına yaslanan, basamaklarından tırmanıldığında tüm Üç Gözler ve Aydın silüetine hakim olan antik tiyatro.',
    historicalStory:
      'Doğal arazi eğiminden ustalıkla yararlanılarak Mesogis (Aydın) Dağları’nın eteğine oyulan Tralleis Tiyatrosu, antik çağda binlerce izleyiciyi tragedya, komedya ve müzik yarışmalarında ağırlıyordu. Orkestra çemberinde fısıldanan bir sözün en üst mermer sıradan duyulabilmesi için basamak eğimleri ve taş yüzey açıları hassas bir akustik geometriyle tasarlanmıştır.',
    architecturalNote:
      'Yarım daire mermer orkestra çevresinde yükselen 9 yürüyebilir cavea basamağı ve ışınsal merdiven akslarıyla tam ölçekli tırmanılabilir antik tiyatro yapısı.',
    voiceNarrationText:
      'Kuzey yamacında yükselen Tralleis Antik Tiyatrosu’nun mermer basamaklarındasınız. Hellenistik dönemde yamaca yaslanarak kurulan bu tiyatro, eşsiz akustiğiyle binlerce izleyiciye tiyatro oyunları ve müzik dinletileri sunardı. En üst basamağa çıkıp altın saat ışığındaki Üç Gözler manzarasını izleyebilirsiniz.',
    rewardCoins: 35,
  },
  {
    id: 'tralleis_crypt',
    cityId: 'tralleis',
    catalogCode: 'TRL-07',
    title: 'Tonozlu Yeraltı Mahzeni (Cryptoporticus)',
    subtitle: 'Beşik Tonozlu Alt Geçit ve Gizli Yazıt Galerisi',
    period: 'MS 2. Yüzyıl · Roma Mühendislik Yapısı',
    zone: 'Tonozlu Yeraltı Mahzeni',
    material: 'Kemerli Kesme Traverten ve Sıkıştırılmış Taş Döşeme',
    dimensions: 'Uzunluk 18 m · Tonoz Yüksekliği 4,2 m · Derinlik -3,6 m',
    position: [-14, -3.6, 29.5],
    standPosition: [-11.4, -3.6, 26.8],
    standRotationY: 0.55,
    focusCameraPos: [-9.2, -1.9, 25.0],
    focusLookAt: [-14.2, -2.3, 30.8],
    shortDescription:
      'Taş basamaklarla inilen, depremlere dayanıklı beşik tonozlu karanlık yeraltı galerisi; duvar nişlerinde antik amforalar ve gizli yazıt barındırır.',
    historicalStory:
      'Büyük Roma gymnasium ve tapınak teraslarının altına inşa edilen tonozlu mahzenler (cryptoporticus), hem yukarıdaki dev yapıyı deprem yüklerine karşı destekler hem de yaz sıcağında serin kalan gizli geçiş ve depo galerileri olarak kullanılırdı. Buradaki taş nişlerde Menderes zeytinyağı ve şaraplarının saklandığı pişmiş toprak amforalar ile yapı ustalarının bıraktığı adak yazıtları korunmuştur.',
    architecturalNote:
      'Kalın kesme taş duvarlar üzerinde kesintisiz yarım daire beşik tonoz, kaburga kemerler ve derin yankılı kapalı taş akustiği; girişte otomatik yanan meşale/el feneriyle aydınlanır.',
    voiceNarrationText:
      'Şu an Tralleis’in taş basamaklarla inilen tonozlu yeraltı mahzenindesiniz. Roma mühendisleri bu kemerli galerileri hem üstteki anıtsal terası depremlere karşı güçlendirmek hem de serin depo ve gizli geçit alanı yaratmak için inşa etmişti. Adımlarınızın taş tonozlarda yankılandığını ve elinizdeki ışığın duvar nişlerindeki antik amforaları aydınlattığını fark edeceksiniz.',
    rewardCoins: 35,
  },
  {
    id: 'tralleis_karya_altar',
    cityId: 'tralleis',
    catalogCode: 'TRL-08',
    title: 'Karya & Menderes Yazıtlı Sunağı',
    subtitle: 'Epigrafik Adak Taşı ve Friz Kabartması',
    period: 'MÖ 1. – MS 1. Yüzyıl · Geç Hellenistik / Erken Roma',
    zone: 'Roma Mozaik Avlusu',
    material: 'Oyma Damarlı Beyaz Mermer ve Traverten Kaide',
    dimensions: 'Yükseklik 145 cm · Genişlik 118 cm',
    position: [26.8, 0.15, -9.8],
    standPosition: [24.2, 0.15, -7.8],
    standRotationY: -2.4,
    focusCameraPos: [22.8, 1.9, -6.5],
    focusLookAt: [26.8, 1.3, -9.8],
    shortDescription:
      'Tralleis halkının bereketli Menderes ovası ve kentin koruyucu tanrıları adına diktiği kabartmalı yazıt sunağı.',
    historicalStory:
      'Karya ile İyonya kültürlerinin kesişim noktasında yer alan Tralleis’te kent meclisi (Boule) ve halk (Demos), alınan önemli kararları ve şükran adaklarını mermer sunaklara kazıyarak meydanlara yerleştirirdi. Bu sunaktaki girland ve rozet kabartmaları, Aydın topraklarının incir, zeytin ve buğday bereketine duyulan kadim minneti simgeler.',
    architecturalNote:
      'Üst kornişte dentil ve yumurta-ok profilleri, gövdede derin yontulmuş yazıt satırları ve köşelerde aşınmış akroter başlıkları barındırır.',
    voiceNarrationText:
      'Karya ve Menderes Yazıtlı Sunağı’nın önündesiniz. Antik Tralleis kent meclisi ve halkı, bereketli Aydın ovasına duydukları şükranı bu tür kabartmalı mermer adak taşlarına kazıyarak ölümsüzleştirirdi. Sağ tık veya V tuşuyla yakınlaşarak taş yüzeyindeki ince oyma dokusunu inceleyebilirsiniz.',
    rewardCoins: 35,
  },

  // ============================================================================
  // 2. MAGNESIA ANTİK KENTİ (5 ESER)
  // ============================================================================
  {
    id: 'magnesia_artemis_temple',
    cityId: 'magnesia',
    catalogCode: 'MGN-01',
    title: 'Artemis Leukophryene Tapınağı',
    subtitle: 'Mimar Hermogenes’in Pseudodipteros Başyapıtı',
    period: 'MÖ 2. Yüzyıl · Hellenistik Dönem',
    zone: 'Artemis Leukophryene Kutsal Alanı',
    material: 'Beyaz Anadolu Mermeri ve Kademeli Krepidoma',
    dimensions: '6×4 Yivli İyonik Sütun Cephesi · Üçgen Alınlık',
    position: [0, 0.5, 0],
    standPosition: [5.4, 0, 8.8],
    standRotationY: -0.4,
    focusCameraPos: [9.5, 3.8, 16.5],
    focusLookAt: [0, 4.4, 0],
    shortDescription:
      'Antik mimarlık kuramcısı Hermogenes’in tasarladığı, Anadolu’nun en büyük dördüncü İyon tapınağı ve girilebilir kutsal cellası.',
    historicalStory:
      '“Ak Kaşlı Artemis” (Artemis Leukophryene) onuruna inşa edilen bu görkemli mermer tapınak, Roma mimarı Vitruvius’un bile övgüyle anlattığı büyük usta Hermogenes’in başyapıtıdır. İç sütun sırasını kaldırarak yarattığı geniş yürüyüş galerisi (pseudodipteros), tapınağa hem ferahlık hem de eşsiz bir ışık-gölge derinliği kazandırmıştır. Her dört yılda bir düzenlenen Leukophryena şenliklerinde tüm Ege dünyası bu mermer basamaklarda toplanırdı.',
    architecturalNote:
      'Üç basamaklı mermer krepidoma, yivli İyonik sütunlar, Amazonomakhia frizli arşitrav ve üçgen alınlığın ardında girilebilir iç kutsal oda (cella) yer alır.',
    voiceNarrationText:
      'Karşınızda Menderes ovasının incisi Magnesia Artemis Leukophryene Tapınağı bulunuyor. Milattan Önce 2. yüzyılda büyük mimar Hermogenes tarafından tasarlanan bu mermer başyapıt, geniş sütunlu galerisi ve üçgen alınlığıyla İyon mimarisinin zirvesidir. Basamaklardan çıkıp kutsal cella odasının içine yürüyebilirsiniz.',
    rewardCoins: 40,
  },
  {
    id: 'magnesia_sacred_agora',
    cityId: 'magnesia',
    catalogCode: 'MGN-02',
    title: 'Kutsal Agora ve Artemis Sunağı',
    subtitle: 'Tören Meydanı ve Kabartmalı Mermer Sunak',
    period: 'MÖ 2. Yüzyıl · Hellenistik',
    zone: 'Kutsal Agora & Tören Sunağı',
    material: 'Oyma Mermer Bloklar ve İyonik Stoa Sütunları',
    dimensions: 'Sunak Genişliği 4,2 m · Çevrili Mermer Platform',
    position: [-23, 0.45, -1.5],
    standPosition: [-17.6, 0.45, 2.2],
    standRotationY: 0.78,
    focusCameraPos: [-15.2, 2.7, 5.8],
    focusLookAt: [-23.5, 2.0, -1.5],
    shortDescription:
      'Artemis şenliklerinde yüzlerce kentin elçilerinin ağırlanıp adak sunduğu sütunlu kutsal agora ve büyük mermer sunak.',
    historicalStory:
      'Magnesia Kutsal Agorası, ticari bir meydandan öte tüm Helen dünyasından gelen resmi elçilik heyetlerinin ağırlandığı kutsal bir diplomasi alanıydı. Tapınağın hemen batısında yükselen anıtsal sunak etrafında dualar okunur, mermer stoa duvarlarına kentler arası barış ve dokunulmazlık (asylia) kararları kazınırdı.',
    architecturalNote:
      'Yükseltilmiş iki kademeli mermer platform, sütunlu stoa revakı ve kabartmalı kornişli anıtsal tören sunağından oluşur.',
    voiceNarrationText:
      'Magnesia Kutsal Agorası ve Artemis Sunağı’nın önündesiniz. Antik çağda Anadolu’nun dört bir yanından gelen elçiler burada ağırlanır, kentler arasındaki barış ve kutsal dokunulmazlık antlaşmaları bu mermer revakların duvarlarına kazınırdı.',
    rewardCoins: 40,
  },
  {
    id: 'magnesia_bath_mosaic',
    cityId: 'magnesia',
    catalogCode: 'MGN-03',
    title: 'Roma Hamamı ve Lethaios Mozaiği',
    subtitle: 'Tuğla Kemerli Hamam Avlusu ve Tessera Halısı',
    period: 'MS 2. – 3. Yüzyıl · Roma Dönemi',
    zone: 'Roma Hamamı & Mozaik Avlusu',
    material: 'Doğal Renkli Mermer Tesseralar ve Roma Tuğlası',
    dimensions: '12 m × 10 m Mozaik Zemin · Kemerli Hamam Duvarı',
    position: [22.5, 0.15, -3.5],
    standPosition: [16.5, 0.15, -0.5],
    standRotationY: -1.1,
    focusCameraPos: [15.5, 3.6, 3.2],
    focusLookAt: [22.5, 0.8, -4.0],
    shortDescription:
      'Magnesia’nın sporcuları ve gezginlerini ağırlayan kemerli Roma hamamı ve geometrik taş mozaikli avlu zemini.',
    historicalStory:
      'Büyük Menderes’in kolu Lethaios Çayı’ndan gelen temiz sularla beslenen Magnesia Roma Hamamları, sıcak su (caldarium) ve soğuk su (frigidarium) salonlarıyla kentin sosyal buluşma noktasıydı. Zeminlerdeki geometrik tessera mozaikleri, hem suya dayanıklı bir yüzey hem de kentin sanatsal zenginliğini gösteren bir şölen sunardı.',
    architecturalNote:
      'Almaşık tuğla-taş kemerli duvar kalıntıları, mermer yürüyüş bordürleri ve ince derzli renkli taş mozaik döşemesiyle korunmuştur.',
    voiceNarrationText:
      'Magnesia Roma Hamamı ve Lethaios Mozaik Avlusu’ndasınız. Lethaios çayından getirilen sularla ısınan bu görkemli hamam, antik kentin sporcuları ve yolcuları için dinlenme durağıydı. Adımlarınızın altında iki bin yıllık renkli taş tesseraların dokusunu duyabilirsiniz.',
    rewardCoins: 40,
  },
  {
    id: 'magnesia_stadium',
    cityId: 'magnesia',
    catalogCode: 'MGN-04',
    title: 'Magnesia Stadyumu ve Theatron',
    subtitle: 'Kabartmalı Mermer Seyirci Basamakları',
    period: 'MS 1. – 3. Yüzyıl · Roma İmparatorluk Dönemi',
    zone: 'Magnesia Stadyumu & Theatron',
    material: 'Yontulmuş Mermer Oturma Blokları',
    dimensions: '9 Tırmanılabilir Kademe · 30.000 Kişilik Antik Miras',
    position: [0, 0.2, -31],
    standPosition: [-6.8, 0.1, -21.5],
    standRotationY: 0.45,
    focusCameraPos: [-10.5, 4.8, -17.5],
    focusLookAt: [0, 2.4, -34],
    shortDescription:
      'Anadolu’nun en iyi korunmuş mermer stadyumlarından ilham alan, atletizm ve müzik yarışmalarının izlendiği tırmanılabilir basamaklar.',
    historicalStory:
      'Magnesia’nın ünlü stadyumu, koşu, güreş ve disk atma yarışmaları için 30 bine yakın seyirciyi ağırlayabilen eşsiz bir mermer yapıydı. Oturma basamaklarının ayak kısımlarına kazınmış gladyatör, atlet ve lonca yazıtları, hangi esnaf grubunun hangi sırada oturduğunu bugün bile belgelemektedir.',
    architecturalNote:
      'Yarım daire sphendone kıvrımında yükselen kademeli mermer basamaklar, yürüyerek zirvesine çıkılabilecek şekilde hassas basamak yükseltisiyle kurgulanmıştır.',
    voiceNarrationText:
      'Magnesia Stadyumu ve Theatron basamaklarındasınız. Antik çağda Leukophryena oyunları sırasında on binlerce izleyici bu mermer sıralardan atletizm yarışlarını izlerdi. Basamakları tırmandığınızda Artemis Tapınağı’nın tüm cephesini yüksekten görebilirsiniz.',
    rewardCoins: 40,
  },
  {
    id: 'magnesia_crypt',
    cityId: 'magnesia',
    catalogCode: 'MGN-05',
    title: 'Artemis Tapınağı Tonozlu Hazine Mahzeni',
    subtitle: 'Yeraltı Adak Deposu ve Kutsal Arşiv Galerisi',
    period: 'MÖ 2. – MS 2. Yüzyıl',
    zone: 'Artemis Tapınağı Tonozlu Hazine Mahzeni',
    material: 'Kesme Traverten Beşik Tonoz ve Kaburga Kemerler',
    dimensions: 'Derinlik -3,6 m · Uzunluk 18 m Tonozlu Galeri',
    position: [-14, -3.6, 29.5],
    standPosition: [-11.4, -3.6, 26.8],
    standRotationY: 0.55,
    focusCameraPos: [-9.2, -1.9, 25.0],
    focusLookAt: [-14.2, -2.3, 30.8],
    shortDescription:
      'Kutsal alana sunulan değerli adakların, zeytinyağı amforalarının ve kent kararlarının saklandığı karanlık tonozlu yeraltı mahzeni.',
    historicalStory:
      'Büyük Artemis Tapınağı yalnızca bir ibadet merkezi değil, aynı zamanda Magnesia’nın güvenli devlet hazinesiydi. Taş basamaklarla inilen bu beşik tonozlu yeraltı odasında kutsal tören kapları, Menderes zeytinyağı dolu mühürlü amforalar ve kentin diplomatik arşiv yazıtları korunurdu.',
    architecturalNote:
      'Dış güneş ışığından tamamen yalıtılmış kesme taş beşik tonoz; içeri adım atıldığında otomatik yanan meşale veya el feneri ile nişlerdeki amforalar ortaya çıkar.',
    voiceNarrationText:
      'Artemis Tapınağı’nın altındaki tonozlu hazine mahzenindesiniz. Antik çağda büyük tapınaklar aynı zamanda kentin en güvenli hazine ve arşiv mekanlarıydı. F tuşuyla elinizdeki antik meşale ve arkeolog el feneri arasında geçiş yaparak taş duvarlardaki yazıtları inceleyebilirsiniz.',
    rewardCoins: 40,
  },

  // ============================================================================
  // 3. NYSA ANTİK KENTİ (5 ESER)
  // ============================================================================
  {
    id: 'nysa_library',
    cityId: 'nysa',
    catalogCode: 'NYS-01',
    title: 'Nysa İki Katlı Antik Kütüphanesi',
    subtitle: 'Anadolu’nun En İyi Korunmuş 2. Antik Kütüphanesi',
    period: 'MS 2. Yüzyıl · Roma İmparatorluk Dönemi',
    zone: 'Nysa Antik Kütüphane Meydanı',
    material: 'Traverten Kesme Taş, Roma Tuğlası ve Mermer Nişler',
    dimensions: 'İki Katlı Kemerli Okuma Salonu · 16 Rulo Nişi',
    position: [0, 0, 0],
    standPosition: [5.4, 0, 7.6],
    standRotationY: -0.42,
    focusCameraPos: [9.0, 3.4, 15.2],
    focusLookAt: [0, 4.4, 0],
    shortDescription:
      'Efes Celsus Kütüphanesi’nden sonra Anadolu’da en iyi korunmuş antik kütüphane; kemerli cephesinden içeri girilip rulo nişleri gezilebilir.',
    historicalStory:
      'Ünlü coğrafyacı Strabon’un eğitim aldığı Nysa, antik çağda bir üniversite ve felsefe kentiydi. MS 130 civarında inşa edilen iki katlı kütüphane, duvarların içine yerleştirilen ahşap dolaplı nişlerde binlerce papirüs ve parşömen rulosunu nemden koruyan çift duvarlı mühendislik sistemiyle saklardı.',
    architecturalNote:
      'Çift kemerli anıtsal giriş cephesi, üst kat pencere kemerleri ve iç mekânda derin oyulmuş yazma eser nişleriyle tam girilebilir antik yapıdır.',
    voiceNarrationText:
      'Karşınızda Anadolu’nun Efes Celsus’tan sonra en iyi korunmuş antik kütüphanesi olan Nysa Kütüphanesi yükseliyor. Büyük coğrafyacı Strabon’un gençliğinde ders gördüğü bu kentin okuma salonuna kemerlerin altından girerek papirüs rulolarının saklandığı taş nişleri yakından görebilirsiniz.',
    rewardCoins: 40,
  },
  {
    id: 'nysa_gerontikon',
    cityId: 'nysa',
    catalogCode: 'NYS-02',
    title: 'Gerontikon (Yaşlılar Meclisi)',
    subtitle: 'Mermer Basamaklı Kent Senatosu ve Odeon',
    period: 'MS 2. Yüzyıl · Antoninler Dönemi',
    zone: 'Gerontikon (Yaşlılar Meclisi)',
    material: 'Beyaz Mermer Oturma Sıraları ve İyonik Sütunlar',
    dimensions: 'Yarım Daire 700 Kişilik Meclis · Mermer Kürsü',
    position: [-23, 0.45, -1.5],
    standPosition: [-17.5, 0.45, 3.2],
    standRotationY: 0.72,
    focusCameraPos: [-14.8, 2.9, 6.2],
    focusLookAt: [-23.5, 2.1, -2.0],
    shortDescription:
      'Nysa’nın bilge meclis üyelerinin (Gerousia) toplanıp kent kararları aldığı ve müzik dinletileri düzenlediği zarif mermer yapı.',
    historicalStory:
      'Strabon’un “Gerontikon” adıyla tarif ettiği bu yapı, Nysa’nın deneyimli vatandaşlarından oluşan meclisin toplantı salonuydu. Mermer oturma sıraları, akustik sahne duvarı ve süslü konuşmacı kürsüsüyle hem demokratik tartışmalara hem de şiir ve lir dinletilerine ev sahipliği yapardı.',
    architecturalNote:
      'Yükseltilmiş mermer platform üzerinde yarım daire basamaklı meclis sıraları, ön kürsü ve çevreleyen yivli sütun dizisiyle kurgulanmıştır.',
    voiceNarrationText:
      'Nysa’nın ünlü Gerontikon, yani Yaşlılar Meclisi yapısındasınız. Kentin bilge yöneticileri bu yarım daire mermer sıralarda toplanarak yasaları tartışır, akşamları ise bu kusursuz akustikli salonda müzik dinletileri düzenlenirdi.',
    rewardCoins: 40,
  },
  {
    id: 'nysa_bridge_strabo',
    cityId: 'nysa',
    catalogCode: 'NYS-03',
    title: 'Nysa Vadi Köprüsü ve Strabon Yazıtı',
    subtitle: 'İki Yakayı Birleştiren Roma Kemeri ve Mozaik Teras',
    period: 'MS 1. – 2. Yüzyıl · Roma Mühendisliği',
    zone: 'Vadi Köprüsü & Strabon Terası',
    material: 'Kesme Traverten Kemer ve Renkli Tessera Mozaiği',
    dimensions: 'Kemer Açıklığı 6,8 m · Strabon Anıt Steli',
    position: [22.5, 0.15, -2.5],
    standPosition: [17.4, 0.15, 2.4],
    standRotationY: -0.75,
    focusCameraPos: [16.2, 2.9, 6.2],
    focusLookAt: [23.0, 2.3, -3.0],
    shortDescription:
      'Kenti ikiye bölen derin dere vadisini aşan anıtsal Roma köprü kemeri ve ünlü coğrafyacı Strabon anısına dikilmiş yazıt steli.',
    historicalStory:
      'Nysa, derin bir akarsu vadisinin iki dik yamacına kurulduğu için antik çağda “ikiz kent” olarak anılırdı. Roma mühendisleri bu iki yakayı dev taş kemerler ve köprülerle birbirine bağlayarak şehircilik tarihinin en cesur mühendislik örneklerinden birini yarattı.',
    architecturalNote:
      'Geniş açıklıklı kesme taş köprü kemeri, kilit taşı vurgusu, zemin mozaiği ve epigrafik Strabon anıt sütunu bir arada sergilenir.',
    voiceNarrationText:
      'Nysa’nın iki yakasını birbirine bağlayan anıtsal Vadi Köprüsü kemeri ve Strabon Terası’ndasınız. Coğrafyanın babası sayılan Strabon, eserinde Nysa’nın bu derin vadi üzerindeki köprülerini ve zeytin kokulu teraslarını hayranlıkla anlatmıştır.',
    rewardCoins: 40,
  },
  {
    id: 'nysa_theater',
    cityId: 'nysa',
    catalogCode: 'NYS-04',
    title: 'Nysa Büyük Antik Tiyatrosu',
    subtitle: 'Dionysos Kabartmalı Sahne ve Yamaç Caveası',
    period: 'MÖ 1. – MS 2. Yüzyıl · Hellenistik & Roma',
    zone: 'Nysa Büyük Antik Tiyatrosu',
    material: 'Kademeli Beyaz Mermer ve Traverten Destek Kemerleri',
    dimensions: '12.000 Kişilik Miras · 9 Tırmanılabilir Sıra',
    position: [0, 0.2, -31],
    standPosition: [-6.8, 0.1, -21.5],
    standRotationY: 0.45,
    focusCameraPos: [-10.5, 4.8, -17.5],
    focusLookAt: [0, 2.4, -34],
    shortDescription:
      'Zeytin ağaçlarıyla çevrili vadiye bakan, Dionysos frizleriyle ünlü muhteşem akustikli yamaç tiyatrosu.',
    historicalStory:
      'Nysa Tiyatrosu, sahne binasının podyumunu süsleyen ve şarap-tiyatro tanrısı Dionysos’un yaşamını anlatan olağanüstü mermer friz kabartmalarıyla arkeoloji dünyasında eşsiz bir yere sahiptir. Basamaklarından yükseldikçe Aydın’ın Sultanhisar sırtlarına hâkim ferah bir manzara açılır.',
    architecturalNote:
      'Yarım daire mermer orkestra ve 9 kademeli yürüyebilir oturma sırası, ikindi ışığında keskin gölge ritimleri oluşturur.',
    voiceNarrationText:
      'Nysa Büyük Antik Tiyatrosu’nun mermer basamaklarındasınız. Sahne podyumundaki Dionysos kabartmalarıyla ünlenen bu tiyatro, on iki bin kişilik kapasitesiyle bölgenin en canlı kültür sahnesiydi.',
    rewardCoins: 40,
  },
  {
    id: 'nysa_valley_tunnel',
    cityId: 'nysa',
    catalogCode: 'NYS-05',
    title: 'Nysa Vadisi Tonozlu Yeraltı Tüneli',
    subtitle: '115 Metrelik Antik Akarsu ve Geçit Tonozu',
    period: 'MS 1. – 2. Yüzyıl · Roma Hidrolik Mühendisliği',
    zone: 'Nysa Vadisi Tonozlu Yeraltı Su Tüneli',
    material: 'Devasa Kemerli Kesme Taş Beşik Tonoz',
    dimensions: 'Derinlik -3,6 m · Akustik Yankılı Taş Tünel',
    position: [-14, -3.6, 29.5],
    standPosition: [-11.4, -3.6, 26.8],
    standRotationY: 0.55,
    focusCameraPos: [-9.2, -1.9, 25.0],
    focusLookAt: [-14.2, -2.3, 30.8],
    shortDescription:
      'Antik dünyanın en uzun tonozlu akarsu tünellerinden biri olan Nysa yeraltı tüneli; su damlası yankıları ve otomatik meşale ışığıyla keşfedilir.',
    historicalStory:
      'Nysa stadyumunun ve kent meydanının tam altından geçen bu dev tonozlu tünel, kış sellerini şehrin altından güvenle geçirip yukarıda düz bir meydan oluşturmak için inşa edildi. Roma mühendisliğinin su yönetimi konusundaki ustalığını iki bin yıldır ayakta tutmaktadır.',
    architecturalNote:
      'Kaburga kemerli nemli taş tonoz, derin kapalı mekân yankısı ve duvar nişlerindeki antik seramik amforalarla otantik bir yeraltı keşfi sunar.',
    voiceNarrationText:
      'Şu an Nysa’nın efsanevi tonozlu yeraltı tünelindesiniz. Roma mühendisleri kentin içinden geçen dereyi bu dev taş tonozun içine alarak üstüne stadyum ve meydanlar inşa etmişti. Nemli taşlarda yankılanan adımlarınızı ve su damlası seslerini dinleyebilirsiniz.',
    rewardCoins: 40,
  },

  // ============================================================================
  // 4. AFRODISIAS ANTİK KENTİ (5 ESER)
  // ============================================================================
  {
    id: 'aphrodisias_tetrapylon',
    cityId: 'aphrodisias',
    catalogCode: 'AFR-01',
    title: 'Tetrapylon Anıtsal Tören Kapısı',
    subtitle: 'UNESCO Dünya Mirası · 16 Sütunlu Mermer Geçit',
    period: 'MS 2. Yüzyıl · Antoninler Dönemi',
    zone: 'Tetrapylon Anıtsal Geçidi',
    material: 'Karacasu Beyaz ve Mavi Damarlı Mermeri',
    dimensions: '4×4 Sütun Kümesi · Kırık Suriye Alınlığı Kemeri',
    position: [0, 0, 0],
    standPosition: [5.2, 0, 7.2],
    standRotationY: -0.38,
    focusCameraPos: [8.8, 3.3, 14.8],
    focusLookAt: [0, 4.6, 0],
    shortDescription:
      'Afrodisias’ın dünya çapındaki simgesi; spiral yivli mermer sütunları ve kırık kemerli alınlığıyla Afrodit kutsal alanının tören kapısı.',
    historicalStory:
      'MS 200 yıllarında Afrodit Tapınağı’na giden kutsal yolu taçlandırmak için yapılan Tetrapylon, dört ayrı dörtlü sütun grubundan (toplam 16 sütun) oluşur. Spiral yivli sütun gövdeleri, av sahneleri ve bitkisel kıvrımlarla bezeli frizleri, Afrodisias heykeltıraşlarının mermeri dantel gibi işleyen ustalığını sergiler.',
    architecturalNote:
      'Dört köşedeki dörder sütun grubunun taşıdığı kemerli kırık alınlık altından yürüyerek geçilebilir; ikindi güneşi mermer yivlerde güçlü ışık huzmeleri oluşturur.',
    voiceNarrationText:
      'Karşınızda UNESCO Dünya Mirası Afrodisias’ın başyapıtı Tetrapylon duruyor. On altı yüksek mermer sütun ve ortadaki kemerli alınlık, antik çağda hacıları Afrodit Tapınağı’na karşılayan en zarif tören kapısıydı. Altından yürüyerek mermer oymaların altın saat ışıltısını yakından izleyebilirsiniz.',
    rewardCoins: 45,
  },
  {
    id: 'aphrodisias_aphrodite_temple',
    cityId: 'aphrodisias',
    catalogCode: 'AFR-02',
    title: 'Afrodit Tapınağı Kutsal Alanı',
    subtitle: 'Yükselen 14 İyonik Sütun ve Afrodit Heykeli',
    period: 'MÖ 1. – MS 2. Yüzyıl · Roma Dönemi',
    zone: 'Afrodit Tapınağı Kutsal Alanı',
    material: 'Parlak Babadağ Mermeri',
    dimensions: 'Sütun Yüksekliği 6,2 m · Kutsal Mermer Platform',
    position: [-23, 0.45, -1.5],
    standPosition: [-17.4, 0.45, 3.6],
    standRotationY: 0.72,
    focusCameraPos: [-14.8, 2.8, 6.8],
    focusLookAt: [-23.2, 2.8, -1.8],
    shortDescription:
      'Kente adını veren Aşk ve Bereket Tanrıçası Afrodit’in binlerce yıl boyunca hac merkezi olmuş mermer sütunlu tapınağı.',
    historicalStory:
      'Afrodisias’ın kalbinde yükselen Afrodit Tapınağı, Julius Caesar ve İmparator Augustus’un özel himayesi altındaydı. Tapınağın koruyucu tanrıçası Afrodit, Anadolu’nun kadim bereket ana tanrıçası geleneğini sürdürürdü; yüksek beyaz mermer sütunları bugün hâlâ Karacasu gökyüzüne uzanır.',
    architecturalNote:
      'İki basamaklı beyaz mermer stylobat üzerinde yükselen yüksek yivli sütun dizisi, kabartmalı arşitrav ve ortadaki heykelli kaideyle tasarlanmıştır.',
    voiceNarrationText:
      'Kente adını veren Afrodit Tapınağı’nın kutsal alanındasınız. Roma imparatorlarının dahi özel vergi muafiyeti tanıdığı bu mermer tapınak, antik dünyanın en saygın hac merkezlerinden biriydi.',
    rewardCoins: 45,
  },
  {
    id: 'aphrodisias_sebasteion',
    cityId: 'aphrodisias',
    catalogCode: 'AFR-03',
    title: 'Sebasteion Kabartma Galerisi & Heykel Okulu',
    subtitle: 'Mitolojik Kabartmalar ve Mermer Yontu Geleneği',
    period: 'MS 1. Yüzyıl · Julio-Claudian Dönemi',
    zone: 'Sebasteion & Heykeltıraşlık Atölyesi',
    material: 'Yüksek Kabartmalı Afrodisias Mermeri ve Mozaik',
    dimensions: 'İki Katlı Revak Cephesi · Heykel Kaidesi',
    position: [22.5, 0.15, -3.0],
    standPosition: [17.2, 0.15, 2.8],
    standRotationY: -0.78,
    focusCameraPos: [16.0, 2.8, 6.0],
    focusLookAt: [23.2, 2.2, -3.5],
    shortDescription:
      'İmparatorluk mitolojisini mermer panellere işleyen Sebasteion galerisi ve dünyaca ünlü Afrodisias heykel okulunun sergi avlusu.',
    historicalStory:
      'Babadağ’ın eteklerindeki zengin mermer ocaklarına yalnızca iki kilometre uzaklıkta kurulan Afrodisias, Akdeniz dünyasının en seçkin heykeltıraşlık okulunu yetiştirdi. Sebasteion’un sütun aralarını süsleyen iki yüze yakın kabartma paneli, Yunan mitolojisi ile Roma tarihini canlı bir taş tiyatrosu gibi anlatır.',
    architecturalNote:
      'İki katlı kabartmalı friz duvarı, mozaik avlu halısı ve tamamlanmamış yontu mermer bloklarıyla canlı bir antik heykel okulu atmosferi kurar.',
    voiceNarrationText:
      'Sebasteion Kabartma Galerisi ve Afrodisias Heykel Okulu avlusundasınız. Yakındaki Babadağ ocaklarından çıkarılan saf mermerler burada usta ellerde hayat bulur, Roma’ya kadar tüm Akdeniz kentlerine gönderilirdi.',
    rewardCoins: 45,
  },
  {
    id: 'aphrodisias_stadium',
    cityId: 'aphrodisias',
    catalogCode: 'AFR-04',
    title: 'Afrodisias Antik Stadyumu',
    subtitle: 'Dünyanın En İyi Korunmuş Antik Stadyumu',
    period: 'MS 1. Yüzyıl · Roma İmparatorluk Dönemi',
    zone: 'Afrodisias Antik Stadyumu',
    material: 'Kademeli Beyaz Mermer Oturma Sıraları',
    dimensions: '270 m Uzunluk Mirası · 9 Tırmanılabilir Mermer Sıra',
    position: [0, 0.2, -31],
    standPosition: [-6.8, 0.1, -21.5],
    standRotationY: 0.45,
    focusCameraPos: [-10.5, 4.8, -17.5],
    focusLookAt: [0, 2.4, -34],
    shortDescription:
      'Antik dünyadan günümüze neredeyse eksiksiz ulaşan, otuz bin seyircilik dev mermer stadyumun tırmanılabilir basamakları.',
    historicalStory:
      'Afrodisias Stadyumu, her iki ucu yarım daire şeklinde kapanan nadir planıyla hem atletizm müsabakalarına hem de festival törenlerine ev sahipliği yaptı. Mermer sıraların üzerindeki esnaf ve kent konseyi koltuk yazıtları, antik sosyal yaşamın canlı izlerini taşır.',
    architecturalNote:
      'Geniş mermer arena zemini çevresinde yükselen kademeli cavea basamakları, üst sıradan tüm Tetrapylon ve Tapınak eksenini seyretme imkânı verir.',
    voiceNarrationText:
      'Dünyanın en iyi korunmuş antik stadyumlarından Afrodisias Stadyumu’nun basamaklarındasınız. Otuz bin kişinin aynı anda yarışları izlediği bu beyaz mermer sıralara tırmanarak güneşin mermer üzerindeki parlaklığını görebilirsiniz.',
    rewardCoins: 45,
  },
  {
    id: 'aphrodisias_crypt',
    cityId: 'aphrodisias',
    catalogCode: 'AFR-05',
    title: 'Tonozlu Heykel Atölyesi & Mermer Mahzeni',
    subtitle: 'Yeraltı Yontu Deposu ve Epigrafi Galerisi',
    period: 'MS 2. – 4. Yüzyıl · Geç Roma',
    zone: 'Tonozlu Mermer Heykel Atölyesi Mahzeni',
    material: 'Kesme Traverten & Mermer Kemerli Beşik Tonoz',
    dimensions: 'Derinlik -3,6 m · Yankılı Yeraltı Galerisi',
    position: [-14, -3.6, 29.5],
    standPosition: [-11.4, -3.6, 26.8],
    standRotationY: 0.55,
    focusCameraPos: [-9.2, -1.9, 25.0],
    focusLookAt: [-14.2, -2.3, 30.8],
    shortDescription:
      'Usta heykeltıraşların ince perdah ve koruma için mermer yazıtları, büstleri ve yağ amforalarını sakladığı serin tonozlu mahzen.',
    historicalStory:
      'Afrodisias heykel okulu ustaları, tamamlanan portre heykellerini ve imparatorluk fermanlarını taşıyan yazıtları güneşten ve depremlerden korumak için tonozlu alt galerilerde muhafaza ederdi. Mahzenin dip duvarındaki yazıt blokları, kentin sanatçı loncalarının gururlu imzalarını taşır.',
    architecturalNote:
      'Taş basamaklarla inilen kapalı beşik tonozlu oda; karanlıkta otomatik yanan antik meşale veya el feneri ile mermer kabartmaların gölgelerini belirginleştirir.',
    voiceNarrationText:
      'Afrodisias’ın tonozlu heykel atölyesi mahzenindesiniz. Mermer ustaları değerli yazıtları ve sipariş heykelleri bu serin yeraltı galerisinde saklardı. Meşale ışığında taş duvarlardaki keski izlerini inceleyebilirsiniz.',
    rewardCoins: 45,
  },

  // ============================================================================
  // 5. PRİENE ANTİK KENTİ (5 ESER)
  // ============================================================================
  {
    id: 'priene_athena_temple',
    cityId: 'priene',
    catalogCode: 'PRN-01',
    title: 'Athena Polias Tapınağı',
    subtitle: 'Mimar Pytheos’un Klasik İyon Başyapıtı',
    period: 'MÖ 340 · Geç Klasik / Erken Hellenistik',
    zone: 'Athena Polias Tapınak Terası',
    material: 'İnce Yivli Samsun Dağı Mermeri',
    dimensions: '6 Sütunlu İyonik Cephe · Yükseklik 11,5 m Oran',
    position: [0, 0.5, 0],
    standPosition: [5.4, 0, 8.6],
    standRotationY: -0.4,
    focusCameraPos: [9.4, 3.9, 16.0],
    focusLookAt: [0, 4.6, 0],
    shortDescription:
      'Büyük İskender’in inşasına adak sunduğu, sarp Mykale kayalığının önünde yükselen kusursuz oranlı Athena Polias Tapınağı.',
    historicalStory:
      'Halikarnassos Mozolesi’nin mimarı Pytheos tarafından tasarlanan Priene Athena Polias Tapınağı, İyon mimarisinin ders kitabı sayılan en zarif örneğidir. MÖ 334’te Anadolu seferine çıkan Büyük İskender, tapınağın tamamlanması için bağışta bulunmuş ve adı anta duvarına mermer harflerle kazınmıştır.',
    architecturalNote:
      'Yüksek kaideli altı yivli İyon sütunu, diş kesimli kornişli arşitravı ve sarp kayalık fonuyla altın saat ışığında heykelsi bir silüet çizer.',
    voiceNarrationText:
      'Karşınızda Samsun Dağı’nın sarp kayalıklarına yaslanan Priene Athena Polias Tapınağı yükseliyor. Büyük usta Pytheos’un tasarladığı ve Büyük İskender’in adını mermerine kazıttığı bu tapınak, İyon mimarisinin en kusursuz oranlarına sahiptir.',
    rewardCoins: 40,
  },
  {
    id: 'priene_buleuterion',
    cityId: 'priene',
    catalogCode: 'PRN-02',
    title: 'Priene Buleuterion (Kent Meclisi)',
    subtitle: 'Kare Planlı Mermer Demokrasi Salonu ve Sunak',
    period: 'MÖ 2. Yüzyıl · Hellenistik Dönem',
    zone: 'Buleuterion (Kent Meclisi)',
    material: 'Kesme Mermer Basamaklar ve Kabartmalı Merkez Sunak',
    dimensions: 'Üç Yönlü Basamaklı Meclis · 640 Kişilik Miras',
    position: [-23, 0.45, -1.5],
    standPosition: [-17.4, 0.45, 3.4],
    standRotationY: 0.76,
    focusCameraPos: [-14.8, 3.0, 6.4],
    focusLookAt: [-23.5, 1.8, -1.5],
    shortDescription:
      'Antik çağdan günümüze en iyi korunarak ulaşan, üç kenarı basamaklı kare planlı kent meclisi ve ortasındaki kutsal sunak.',
    historicalStory:
      'Priene Buleuterionu, antik Yunan kent devletlerinin demokratik meclis mimarisini en berrak biçimde gösteren yapıdır. Üç kenar boyunca yükselen taş sıralarda oturan meclis üyeleri, salonun tam ortasındaki mermer sunakta yemin ederek kent yasalarını oylardı.',
    architecturalNote:
      'U biçiminde yükselen üç yönlü mermer meclis sıraları ve merkezdeki kabartmalı adak sunağıyla doğrudan içine girilip gezilebilir.',
    voiceNarrationText:
      'Antik dünyanın en iyi korunmuş meclis yapılarından Priene Buleuterionu’ndasınız. İki bin yıl önce Priene vatandaşları bu üç yönlü taş basamaklarda oturarak, tam ortadaki mermer sunağın çevresinde kent kararlarını tartışırdı.',
    rewardCoins: 40,
  },
  {
    id: 'priene_hippodamos_street',
    cityId: 'priene',
    catalogCode: 'PRN-03',
    title: 'Hippodamos Izgara Caddesi ve İskender Yazıtı',
    subtitle: 'İlk Modern Kent Planlaması ve Kutsal Stoa',
    period: 'MÖ 4. – 2. Yüzyıl · Hellenistik Şehircilik',
    zone: 'Hippodamos Caddesi & Kutsal Stoa',
    material: 'Mermer Cadde Döşemesi, Mozaik ve Epigrafik Stel',
    dimensions: '90° Dik Kesişen Cadde Aksı · Kutsal Stoa Revakı',
    position: [22.5, 0.15, -2.5],
    standPosition: [17.0, 0.15, 2.2],
    standRotationY: -0.78,
    focusCameraPos: [15.8, 2.9, 5.8],
    focusLookAt: [22.5, 1.5, -2.8],
    shortDescription:
      'Miletli şehir plancısı Hippodamos’un dik açılı ızgara sisteminin en kusursuz örneği olan mermer cadde, mozaik avlu ve adak yazıtı.',
    historicalStory:
      'Sarp bir dağ yamacına kurulmasına karşın Priene’nin tüm cadde ve sokakları pusula yönlerine göre birbirini tam doksan dereceyle keser. Yağmur suyu kanalları, temiz taş kaldırımları ve Kutsal Stoa revaklarıyla Priene, “antik çağın en düzenli kenti” unvanını kazanmıştır.',
    architecturalNote:
      'Düzgün kesme mermer sokak aksları, doğu sütunlu stoa ve Büyük İskender adak yazıtı steli ile Hellenistik şehir düzenini yaşatır.',
    voiceNarrationText:
      'Hippodamos’un ünlü ızgara planıyla tasarlanan Priene mermer caddesindesiniz. Sarp bir dağ yamacında bile tüm sokakların tam doksan derecelik açıyla kesişmesi, antik Ege şehirciliğinin benzersiz bir zaferidir.',
    rewardCoins: 40,
  },
  {
    id: 'priene_theater',
    cityId: 'priene',
    catalogCode: 'PRN-04',
    title: 'Priene Hellenistik Tiyatrosu',
    subtitle: 'Aslan Ayaklı Mermer Onur Koltukları (Proedria)',
    period: 'MÖ 300 · Erken Hellenistik Dönem',
    zone: 'Priene Hellenistik Tiyatrosu',
    material: 'Oyma Mermer Basamaklar ve Onur Koltukları',
    dimensions: '6.500 Kişilik Miras · 9 Tırmanılabilir Sıra',
    position: [0, 0.2, -31],
    standPosition: [-6.8, 0.1, -21.5],
    standRotationY: 0.45,
    focusCameraPos: [-10.5, 4.8, -17.5],
    focusLookAt: [0, 2.4, -34],
    shortDescription:
      'Ön sırasında kentin ileri gelenleri için oyulmuş beş zarif mermer onur koltuğu bulunan, saf Hellenistik üsluptaki yamaç tiyatrosu.',
    historicalStory:
      'Roma döneminde büyük değişikliklere uğramadan özgün Hellenistik formunu koruyan ender tiyatrolardan biri olan Priene Tiyatrosu, orkestra kenarındaki arkalıklı mermer onur koltukları (proedria) ve tam ortasındaki Dionysos sunağıyla ünlüdür.',
    architecturalNote:
      'Sade ve akıcı Hellenistik yarım daire mermer cavea, en üst basamaktan Menderes deltasını ve Athena Tapınağı’nı panoramik olarak gösterir.',
    voiceNarrationText:
      'Priene’nin saf Hellenistik üslubunu koruyan eşsiz tiyatrosundasınız. Orkestra kenarındaki mermer onur koltukları, iki bin üç yüz yıl önce kentin baş rahipleri ve yargıçları için tek parça mermerden oyulmuştu.',
    rewardCoins: 40,
  },
  {
    id: 'priene_cistern_crypt',
    cityId: 'priene',
    catalogCode: 'PRN-05',
    title: 'Kaya Tonozlu Sarnıç ve Gizli Geçit',
    subtitle: 'Mykale Kayalığına Oyulmuş Yeraltı Su Deposu',
    period: 'MÖ 3. – MS 1. Yüzyıl',
    zone: 'Kaya Tonozlu Sarnıç & Gizli Geçit',
    material: 'Su Geçirmez Horasan Sıvalı Kesme Taş Tonoz',
    dimensions: 'Derinlik -3,6 m · Serin Yeraltı Sarnıcı',
    position: [-14, -3.6, 29.5],
    standPosition: [-11.4, -3.6, 26.8],
    standRotationY: 0.55,
    focusCameraPos: [-9.2, -1.9, 25.0],
    focusLookAt: [-14.2, -2.3, 30.8],
    shortDescription:
      'Dağ kaynaklarından gelen kar sularını yaz kuraklığı için saklayan, taş basamaklarla inilen yankılı yeraltı sarnıcı ve geçit.',
    historicalStory:
      'Mykale Dağı’nın yamaçlarına kurulan Priene, kesintisiz temiz su sağlamak için pişmiş toprak borularla getirdiği dağ sularını yeraltındaki tonozlu taş sarnıçlarda dinlendirirdi. Kuşatma zamanlarında aynı zamanda gizli sığınak işlevi gören bu galeri serinliğini yıl boyu korurdu.',
    architecturalNote:
      'Beşik tonozlu taş tavan, kaburga kemerler ve amfora nişleriyle su damlası yankılarının duyulduğu karanlık yeraltı mekânıdır.',
    voiceNarrationText:
      'Priene’nin Samsun Dağı kaynak sularını biriktirdiği kaya tonozlu yeraltı sarnıcındasınız. Taş duvarların serinliğini ve karanlık tonozda yankılanan su damlalarını meşale ışığınızla keşfedebilirsiniz.',
    rewardCoins: 40,
  },

  // ============================================================================
  // 6. MİLET & DİDYMA KUTSAL ALANI (5 ESER)
  // ============================================================================
  {
    id: 'didyma_apollo_temple',
    cityId: 'milet_didyma',
    catalogCode: 'DML-01',
    title: 'Didyma Apollon Tapınağı',
    subtitle: 'Dev Çift Sıralı Sütun Ormanı ve Kehanet Merkezi',
    period: 'MÖ 4. – MS 2. Yüzyıl · İyonya’nın En Büyük Tapınağı',
    zone: 'Didyma Apollon Tapınağı & Medusa Avlusu',
    material: 'Devasa Yivli Beyaz Mermer Sütunlar',
    dimensions: 'Çift Sıralı Dipteros · Yükseklik 19,5 m Antik Miras',
    position: [0, 0.5, 0],
    standPosition: [5.6, 0, 8.8],
    standRotationY: -0.38,
    focusCameraPos: [10.0, 4.0, 17.2],
    focusLookAt: [0, 4.8, 0],
    shortDescription:
      'Antik dünyanın en büyük üçüncü tapınağı olan Didyma Apollon Kehanet Merkezi’nin göğe uzanan çift sıralı mermer sütun ormanı.',
    historicalStory:
      'Milet’ten başlayan 16 kilometrelik Kutsal Yol’un ulaştığı Didyma Apollon Tapınağı, Delfi’den sonra antik çağın en saygın kehanet merkeziydi. 122 dev sütundan oluşan çift sıralı dipteros planı öylesine muazzamdı ki, çatısı asla kapatılamamış; iç avlu doğrudan Ege gökyüzüne açık (hypaethral) bırakılmıştır.',
    architecturalNote:
      'Çift sıralı dev yivli sütunların oluşturduğu mermer koridorlar arasında yürüyebilir, altın saat güneşinin sütunlar arasından süzülen ışık huzmelerini izleyebilirsiniz.',
    voiceNarrationText:
      'Karşınızda antik Ege’nin en görkemli kehanet merkezi Didyma Apollon Tapınağı’nın dev mermer sütun ormanı yükseliyor. Gökyüzüne açık iç avlusu ve devasa çift sıralı sütunlarıyla bu kutsal yapı, yüzyıllar boyunca kralların ve filozofların kehanet aradığı yerdi.',
    rewardCoins: 45,
  },
  {
    id: 'didyma_medusa_relief',
    cityId: 'milet_didyma',
    catalogCode: 'DML-02',
    title: 'Anıtsal Medusa Başı Kabartması',
    subtitle: 'Tapınağı Kötülüklerden Koruyan Mermer Friz Bloğu',
    period: 'MS 2. Yüzyıl · Hadrianus Dönemi',
    zone: 'Didyma Apollon Tapınağı & Medusa Avlusu',
    material: 'Tek Parça Oyma Beyaz Anadolu Mermeri',
    dimensions: 'Yükseklik 185 cm · Genişlik 210 cm Friz Bloğu',
    position: [0, 0.5, 7.6],
    standPosition: [-3.8, 0, 10.6],
    standRotationY: 0.58,
    focusCameraPos: [-4.6, 2.2, 12.6],
    focusLookAt: [0, 1.85, 7.6],
    shortDescription:
      'Didyma Apollon Tapınağı’nın frizinden düşerek günümüze ulaşan ve Aydın’ın dünya çapındaki arkeolojik simgesi hâline gelen dev Medusa kabartması.',
    historicalStory:
      'Antik inançta yılan saçlı Medusa başı (Gorgoneion), kutsal yapıları kötülüklerden ve düşman bakışlarından koruyan güçlü bir tılsım olarak tapınak frizlerine işlenirdi. Didyma’daki bu zarif ve hüzünlü yüz ifadesine sahip dev mermer Medusa bloğu, geç Roma dönemindeki büyük depremle ön avluya düşmüş ve bugün kentin en ikonik eseri olmuştur.',
    architecturalNote:
      'Derin oyma yılan saç bukleleri ve mermer akantus yapraklarıyla çevrili Medusa kabartması, eğik ikindi ışığında güçlü heykelsi derinlik kazanır.',
    voiceNarrationText:
      'Aydın’ın dünyaca ünlü arkeolojik simgesi Didyma Medusa Kabartması’nın önündesiniz. Tapınağın üst frizini kötülüklerden korumak için tek parça beyaz mermerden oyulan bu başyapıt, V tuşu veya sağ tık ile yakınlaşarak inceleyebileceğiniz ince detaylar barındırır.',
    rewardCoins: 45,
  },
  {
    id: 'milet_faustina_baths',
    cityId: 'milet_didyma',
    catalogCode: 'DML-03',
    title: 'Faustina Hamamı ve Menderes Salonu',
    subtitle: 'İmparatoriçe Faustina’nın Hediyesi ve Nehir Tanrısı',
    period: 'MS 164 · İmparator Marcus Aurelius Dönemi',
    zone: 'Faustina Hamamı & Menderes Salonu',
    material: 'Kesme Taş Kemerler, Mermer Havuz ve Heykel Kaidesi',
    dimensions: 'Kemerli Hamam Salonu · Mermer Sütunlu Avlu',
    position: [-23, 0.45, -1.5],
    standPosition: [-17.4, 0.45, 3.4],
    standRotationY: 0.72,
    focusCameraPos: [-14.8, 2.8, 6.4],
    focusLookAt: [-23.2, 2.2, -1.5],
    shortDescription:
      'İmparatoriçe Genç Faustina’nın Milet’e armağan ettiği, Menderes Nehri tanrısı heykeliyle süslü görkemli Roma hamamı.',
    historicalStory:
      'Roma İmparatoru Marcus Aurelius’un eşi Genç Faustina’nın Milet ziyaretinin ardından kente armağan ettiği bu büyük hamam kompleksi, spor avlusu (palaestra), sıcak su kubbeleri ve uzanan Büyük Menderes Nehri Tanrısı (Maiandros) heykeliyle Aydın’ın en görkemli Roma yapılarındandır.',
    architecturalNote:
      'Kemerli taş-tuğla duvarlar, mermer sütunlu avlu ve nehir tanrısı havuz kaidesiyle bütünleşir.',
    voiceNarrationText:
      'Milet’in ünlü Faustina Hamamı ve Menderes Salonu’ndasınız. İmparatoriçe Faustina’nın kente armağan ettiği bu görkemli hamamın havuzunu bir zamanlar Büyük Menderes Nehri’ni simgeleyen mermer tanrı heykeli süslerdi.',
    rewardCoins: 45,
  },
  {
    id: 'milet_philosophers_harbor',
    cityId: 'milet_didyma',
    catalogCode: 'DML-04',
    title: 'Milet Kutsal Yol, Liman Kapısı ve Filozoflar',
    subtitle: 'Thales, Anaximandros ve Bilimin Doğuşu',
    period: 'MÖ 6. Yüzyıl – MS 2. Yüzyıl · İyonya Aydınlanması',
    zone: 'Milet Kutsal Yol & Liman Kapısı',
    material: 'Mermer Kemerli Liman Kapısı, Mozaik ve Güneş Saati',
    dimensions: 'İkiz Kemerli Kapı · Filozoflar Yazıt Steli',
    position: [22.5, 0.15, -2.5],
    standPosition: [17.0, 0.15, 2.6],
    standRotationY: -0.78,
    focusCameraPos: [15.8, 2.9, 6.2],
    focusLookAt: [22.8, 2.2, -3.0],
    shortDescription:
      'İnsanlık tarihinde felsefe ve bilimin doğduğu Milet liman meydanı; güneş tutulmasını hesaplayan Thales ve ilk dünya haritasını çizen Anaximandros anısına.',
    historicalStory:
      'MÖ 6. yüzyılda dört büyük limanıyla Akdeniz ticaretine yön veren Milet, doğa olaylarını mitoloji yerine akıl ve gözlemle açıklayan ilk düşünürleri yetiştirdi. Thales geometrinin ve astronominin temellerini attı; öğrencisi Anaximandros ilk dünya haritasını ve güneş saatini (gnomon) Milet meydanında tanıttı.',
    architecturalNote:
      'Kemerli mermer liman kapısı, geometrik mozaik meydan ve antik astronomi güneş saati anıtı bir arada sunulur.',
    voiceNarrationText:
      'Bilim ve felsefenin doğduğu Milet Kutsal Yolu ve Liman Kapısı’ndasınız. İki bin altı yüz yıl önce Thales bu limanlarda güneş tutulmasını hesapladı; Anaximandros ise ilk dünya haritasını bu topraklarda çizdi.',
    rewardCoins: 45,
  },
  {
    id: 'didyma_oracle_tunnel',
    cityId: 'milet_didyma',
    catalogCode: 'DML-05',
    title: 'Didyma Karanlık Kehanet Tüneli (Adyton)',
    subtitle: 'Kâhinlerin Kutsal Pınara İndiği Tonozlu Geçit',
    period: 'MÖ 3. Yüzyıl · Hellenistik Kehanet Mühendisliği',
    zone: 'Didyma Karanlık Kehanet Tüneli (Adyton)',
    material: 'Kusursuz Kesme Mermer Beşik Tonoz',
    dimensions: 'Derinlik -3,6 m · 21 m Eğimli Kehanet Koridoru',
    position: [-14, -3.6, 29.5],
    standPosition: [-11.4, -3.6, 26.8],
    standRotationY: 0.55,
    focusCameraPos: [-9.2, -1.9, 25.0],
    focusLookAt: [-14.2, -2.3, 30.8],
    shortDescription:
      'Didyma Apollon Tapınağı’nın ünlü karanlık tonozlu kehanet tüneli; basamaklardan inerken meşaleniz otomatik yanar ve kehanet yazıtı görünür.',
    historicalStory:
      'Didyma’da kehanet arayan ziyaretçiler, tapınağın aydınlık sütunlu girişinden ayrılıp karanlık, dar ve yankılı taş tonozlu tünellerden aşağı inerek kutsal pınarın bulunduğu Adyton avlusuna ulaşırdı. Aydınlıktan gizemli karanlığa yapılan bu mimari geçiş, kâhinin (Pythia) sözlerine derin bir büyü katmak için özellikle tasarlanmıştı.',
    architecturalNote:
      'Kusursuz kilitli kesme taş beşik tonoz ve kaburga kemerler; karanlıkta otomatik yanan meşale/el feneriyle antik kehanet atmosferini yaşatır.',
    voiceNarrationText:
      'Didyma’nın efsanevi Karanlık Kehanet Tüneli’ndesiniz. Antik çağda Apollon’un kehanetini duymak isteyen yolcular bu yankılı taş tonozdan geçerek kutsal pınara inerdi. Elinizdeki meşalenin titreşen ışığında antik kehanet yazıtını okuyabilirsiniz.',
    rewardCoins: 45,
  },

  // ============================================================================
  // 7. ALİNDA & ALABANDA ANTİK KENTLERİ (5 ESER)
  // ============================================================================
  {
    id: 'alinda_agora_building',
    cityId: 'alinda_alabanda',
    catalogCode: 'ALN-01',
    title: 'Alinda 3 Katlı Anıtsal Agora Binası',
    subtitle: 'Anadolu’nun En Görkemli Hellenistik Pazar Yapısı',
    period: 'MÖ 3. – 2. Yüzyıl · Hellenistik Karya',
    zone: 'Alinda 3 Katlı Anıtsal Agora Meydanı',
    material: 'Masif Kesme Karya Graniti ve Traverten Bloklar',
    dimensions: 'Üç Katlı Taş Cephe · Girilebilir Kemerli Çarşı Holü',
    position: [0, 0, 0],
    standPosition: [5.4, 0, 7.6],
    standRotationY: -0.4,
    focusCameraPos: [9.4, 3.8, 16.0],
    focusLookAt: [0, 4.6, 0],
    shortDescription:
      'Karya Kraliçesi Ada’nın sürgün başkenti Alinda’nın neredeyse tüm yüksekliğiyle ayakta duran üç katlı dev kesme taş pazar binası.',
    historicalStory:
      'Karpuzlu sırtlarında yükselen Alinda, Karya Kraliçesi Ada’nın Büyük İskender’i evlat edinip Karya tahtını geri kazandığı tarihi kaledir. Kenti taçlandıran üç katlı dev agora binası, alt katta taş kemerli ticaret dükkanları, üst katlarda ise geniş kapalı pazar galerisiyle Hellenistik mühendisliğin harikalarındandır.',
    architecturalNote:
      'Harçsız kenetlenen dev bossajlı taş bloklar, üç girilebilir kemerli alt çarşı geçidi ve üst kat mazgal pencereleriyle Alinda’nın otantik silüetini sunar.',
    voiceNarrationText:
      'Karşınızda Karya Kraliçesi Ada’nın başkenti Alinda’nın üç katlı anıtsal Agora Binası yükseliyor. İki bin iki yüz yıl önce harçsız kesme taş bloklarla kurulan bu dev pazar yapısının alt kat kemerlerinden içeri yürüyebilirsiniz.',
    rewardCoins: 40,
  },
  {
    id: 'alabanda_apollo_isotimos',
    cityId: 'alinda_alabanda',
    catalogCode: 'ALN-02',
    title: 'Alabanda Apollon İsotimos Tapınağı',
    subtitle: 'Karya’nın En Zengin Kentinin İyonik Tapınağı',
    period: 'MÖ 2. Yüzyıl · Mimar Hermogenes Okulu',
    zone: 'Alabanda Apollon İsotimos Kutsal Alanı',
    material: 'Beyaz Mermer Sütunlar ve Karya Granit Kaidesi',
    dimensions: 'Sütunlu Tapınak Terası · Kraliçe Ada Anıt Kaidesi',
    position: [-23, 0.45, -1.5],
    standPosition: [-17.4, 0.45, 3.4],
    standRotationY: 0.72,
    focusCameraPos: [-14.8, 2.8, 6.4],
    focusLookAt: [-23.2, 2.4, -1.5],
    shortDescription:
      'Çine ovasında parlayan Alabanda’nın, yine büyük mimar Hermogenes tarafından tasarlanan zarif Apollon İsotimos Tapınağı ve adak alanı.',
    historicalStory:
      'Karya dilinde “At Yarışı Zaferi” anlamına gelen Alabanda, antik çağda kırmızı lal taşları (garnet) ve neşeli şenlikleriyle ünlenmişti. Kentin en görkemli tapınağı olan Apollon İsotimos, Magnesia’nın mimarı Hermogenes’in estetik ilkeleriyle inşa edilerek Karya’nın sanat düzeyini tüm Roma’ya tanıtmıştır.',
    architecturalNote:
      'Yükseltilmiş mermer platform üzerinde yükselen İyonik sütunlar, kabartmalı arşitrav ve Kraliçe Ada onur kaidesinden oluşur.',
    voiceNarrationText:
      'Alabanda Apollon İsotimos Kutsal Alanı’ndasınız. Karya dilinde at yarışı zaferi anlamına gelen Alabanda, antik çağda hem ünlü mimar Hermogenes’in bu tapınağı hem de müzik ve edebiyat ustalarıyla tanınırdı.',
    rewardCoins: 40,
  },
  {
    id: 'alinda_aqueduct_mosaic',
    cityId: 'alinda_alabanda',
    catalogCode: 'ALN-03',
    title: 'Alinda Antik Su Kemeri ve Mozaik Avlusu',
    subtitle: 'Karya Dağlarından Gelen Kemerli Su Yolu',
    period: 'MS 1. – 2. Yüzyıl · Roma Dönemi',
    zone: 'Karya Su Kemeri & Mozaik Avlusu',
    material: 'Kesme Traverten Su Kemeri ve Renkli Mozaik',
    dimensions: 'Çift Kemerli Su Yolu · Yükseklik 9,2 m',
    position: [22.5, 0.15, -2.5],
    standPosition: [17.0, 0.15, 2.4],
    standRotationY: -0.78,
    focusCameraPos: [15.8, 3.2, 6.2],
    focusLookAt: [22.8, 2.8, -2.8],
    shortDescription:
      'Alinda’nın yüksek akropolüne dağ kaynaklarından su taşıyan anıtsal çift kemerli Roma su kemeri ve zeytin-bereket mozaikli avlu.',
    historicalStory:
      'Yüksek granit tepelere kurulu Alinda’nın su ihtiyacını karşılamak için inşa edilen anıtsal Roma su kemeri, vadiler boyunca uzanan zarif taş kemerleriyle bugün bile Karpuzlu silüetine damgasını vurur. Hemen altındaki mozaik avlu ve sunak, bereketli Karya zeytinliklerinin şükran noktasıydı.',
    architecturalNote:
      'Yüksek taş ayaklar üzerinde yükselen çift beşik kemer, üst su kanalı oluğu ve renkli tessera mozaikli avlu zeminiyle bütünleşir.',
    voiceNarrationText:
      'Alinda Antik Su Kemeri ve Karya Mozaik Avlusu’ndasınız. Dağ kaynaklarından gelen berrak suyu kentin zirvesine taşıyan bu yüksek taş kemerler, altın saat güneşinde uzun gölgeler düşürerek iki bin yıllık mühendisliği gözler önüne serer.',
    rewardCoins: 40,
  },
  {
    id: 'alinda_carian_theater',
    cityId: 'alinda_alabanda',
    catalogCode: 'ALN-04',
    title: 'Karya Yamaç Antik Tiyatrosu',
    subtitle: 'Granit Destekli Hellenistik Oturma Sıraları',
    period: 'MÖ 2. Yüzyıl · Hellenistik Karya',
    zone: 'Karya Yamaç Antik Tiyatrosu',
    material: 'Yontulmuş Karya Taşı ve Mermer Basamaklar',
    dimensions: '35 Sıralı Antik Miras · 9 Tırmanılabilir Kademe',
    position: [0, 0.2, -31],
    standPosition: [-6.8, 0.1, -21.5],
    standRotationY: 0.45,
    focusCameraPos: [-10.5, 4.8, -17.5],
    focusLookAt: [0, 2.4, -34],
    shortDescription:
      'Alinda’nın tepesinden Karpuzlu ovasına bakan, tonozlu giriş kapılarıyla ünlü kusursuz korunmuş Hellenistik Karya tiyatrosu.',
    historicalStory:
      'Alinda ve Alabanda tiyatroları, güney Aydın’ın karakteristik granit ve mermer işçiliğini birleştirir. Eğimli kayalığa oturan bu taş basamaklar, hem antik oyunların sergilendiği hem de halk meclislerinin toplandığı görkemli bir açık hava salonuydu.',
    architecturalNote:
      'Yarım daire taş orkestra ve tırmanılabilir 9 kademeli oturma sırası, zirveden üç katlı Alinda Agorası’nın tüm ihtişamını sergiler.',
    voiceNarrationText:
      'Karya’nın en iyi korunmuş tiyatrolarından Alinda Yamaç Tiyatrosu’ndasınız. Basamakları tırmanıp en üst sıraya ulaştığınızda güney Aydın’ın granit dağları ve anıtsal Agora Binası karşınızda uzanacaktır.',
    rewardCoins: 40,
  },
  {
    id: 'alinda_royal_crypt',
    cityId: 'alinda_alabanda',
    catalogCode: 'ALN-05',
    title: 'Kaya Tonozlu Karya Hazine & Zeytinyağı Mahzeni',
    subtitle: 'Kraliçe Ada Dönemi Yeraltı Depo ve Yazıt Odası',
    period: 'MÖ 4. – MS 2. Yüzyıl · Karya Mirası',
    zone: 'Kaya Tonozlu Karya Hazine & Zeytinyağı Mahzeni',
    material: 'Masif Kesme Karya Taşı Beşik Tonoz',
    dimensions: 'Derinlik -3,6 m · Amforalı Yeraltı Mahzeni',
    position: [-14, -3.6, 29.5],
    standPosition: [-11.4, -3.6, 26.8],
    standRotationY: 0.55,
    focusCameraPos: [-9.2, -1.9, 25.0],
    focusLookAt: [-14.2, -2.3, 30.8],
    shortDescription:
      'Karya zeytinyağı amforalarının ve kent hazinesinin saklandığı, taş basamaklarla inilen serin ve yankılı yeraltı tonozu.',
    historicalStory:
      'Alinda ve Alabanda’nın verimli yamaçlarında üretilen altın renkli zeytinyağı ve şaraplar, yüksek yaz sıcağından korunmak üzere agoranın altındaki bu kalın tonozlu taş mahzenlerde depolanırdı. Duvar nişlerindeki pişmiş toprak amforalar ve Karya yazıtı, bölgenin kadim ticaret ağını yansıtır.',
    architecturalNote:
      'Kalın kesme taş kemerli tonoz; merdivenlerden indiğinizde meşale veya el feneriniz otomatik olarak devreye girerek karanlık odayı aydınlatır.',
    voiceNarrationText:
      'Karya’nın tonozlu hazine ve zeytinyağı mahzenindesiniz. Karpuzlu ve Çine’nin kadim zeytinliklerinden elde edilen yağlar bu serin taş tonozun altındaki amforalarda saklanırdı. F tuşuyla meşale ve el feneri arasında geçiş yapabilirsiniz.',
    rewardCoins: 40,
  },
];

export const MUSEUM_EXHIBIT_MAP = new Map<string, MuseumExhibitDef>(
  MUSEUM_EXHIBITS.map((ex) => [ex.id, ex])
);

export function getExhibitsForCity(cityId: AncientCityId): MuseumExhibitDef[] {
  return MUSEUM_EXHIBITS.filter((ex) => ex.cityId === cityId);
}

export function getAncientCityByLandmarkId(landmarkId: string | undefined): AncientCityDef | null {
  if (!landmarkId) return null;
  return ANCIENT_CITIES.find((c) => c.landmarkId === landmarkId) ?? null;
}
