import { MuseumExhibitDef } from '../types/game';

/**
 * Curated open-air museum exhibits for the 1:1 photorealistic Tralleis Ancient City
 * (Aydın, Efeler) exploration scene.
 */
export const MUSEUM_EXHIBITS: MuseumExhibitDef[] = [
  {
    id: 'tralleis_uc_gozler',
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
];

export const MUSEUM_EXHIBIT_MAP = new Map<string, MuseumExhibitDef>(
  MUSEUM_EXHIBITS.map((ex) => [ex.id, ex])
);
