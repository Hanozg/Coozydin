export interface EvolutionEntry {
  id: string;
  dayNumber: number;
  date: string; // YYYY-MM-DD
  title: string;
  category: 'Harita & Mimari' | 'Yaşam & Etkileşim' | 'Görsel & Atmosfer' | 'Ev & Araç';
  summary: string;
  highlights: string[];
  landmarkId?: string;
}

/**
 * Efeler: Aydın Yolları — Günlük Otomatik Gelişim & Şehir Kronolojisi.
 * Her gün en az bir kez çalışan otomatik gelişim döngüsü yeni eklenen
 * özellikleri burada tarih sırasıyla (en yeni en üstte) kayıt altına alır.
 */
export const DAILY_EVOLUTION_LOG: EvolutionEntry[] = [
  {
    id: 'evo-day-4-aytepe-tabakhane',
    dayNumber: 4,
    date: '2026-11-13',
    title: 'Aytepe Yokuşu & Tabakhane Deresi Gerçek Coğrafyası',
    category: 'Harita & Mimari',
    summary:
      'Efeler haritası artık gerçek topoğrafyaya kavuştu: kuzeye ve ADÜ Aytepe Kampüsü’ne doğru yokuş yukarı yükselen engebeli arazi ile Tarihi Sarı Belediye arkasından akıp Orta Mahalle’yi bulvardan ayıran Tabakhane Deresi oyuna işlendi.',
    highlights: [
      'Merkez ovadan kuzeye, Tralleis yamacına ve ADÜ Aytepe tepesine doğru tırmanan 3B engebeli yükseklik haritası eklendi.',
      'Tabakhane Deresi gerçek haritadaki gibi Tarihi Sarı Belediye ve Nasuh Paşa Külliyesi arkasından akacak şekilde yeniden konumlandırıldı.',
      'Orta Mahalle ve doğu yakasını merkeze bağlayan kemerli taş Tabakhane Köprüleri ile demiryolu köprüsü inşa edildi.',
      'Araç sürüşüne yokuş eğimine göre burun kalkması, yatış ve hafif tırmanma direnci fiziği eklendi.',
    ],
    landmarkId: 'universite',
  },
  {
    id: 'evo-day-3-steam-train',
    dayNumber: 3,
    date: '2026-11-13',
    title: 'İzmir–Aydın Buharlı Treni & Bulvar Bisikletlileri',
    category: 'Yaşam & Etkileşim',
    summary:
      'Tarihi Aydın Tren Garı rayları artık canlı: 1882 hatırasını yaşatan buharlı lokomotif perona yanaşıp buhar savuruyor, Efeler bulvarlarında ise bisikletli ve scooterlı şehir sakinleri turluyor.',
    highlights: [
      'Pirinç kazanlı, hareketli tekerlekli ve bacasından beyaz buhar çıkaran İzmir–Aydın buharlı treni eklendi.',
      'Tren Garı peronunda kısa süreli duraklama ve yumuşak kalkış döngüsü kuruldu.',
      'Bulvar hatlarında sakin tempoda ilerleyen AI bisikletli ve Ege scooter sürücüleri eklendi.',
      'Keşif Defteri içine şehrin günlük büyümesini takip eden Gelişim Günlüğü sekmesi eklendi.',
    ],
    landmarkId: 'trengari',
  },
  {
    id: 'evo-day-2-orta-mahalle-adu',
    dayNumber: 2,
    date: '2026-11-12',
    title: 'Orta Mahalle, ADÜ Aytepe Kampüsü & İnteraktif Evim',
    category: 'Harita & Mimari',
    summary:
      'Kuzey aksı Aytepe Üniversite Bulvarı ile genişletildi; Orta Mahalle çeşmesi, ADÜ yerleşkesi ve ev içinde yürüyüp eşya yerleştirebileceğiniz avatar sistemi eklendi.',
    highlights: [
      'Orta Mahalle taş kahvehane, asmalı pergola ve mermer mahalle çeşmesi inşa edildi.',
      'ADÜ Aytepe Üniversitesi giriş takı, rektörlük, kubbeli kütüphane ve öğrenci amfisi eklendi.',
      'Sıcak Yuvam içinde özelleştirilebilir 3B avatar, yürüme, koltuğa oturma ve serbest eşya yerleştirme eklendi.',
      'Tüm bulvar palmiyeleri ve zeytin ağaçları kavşak/kapı önlerinden temizlenerek hizalandı.',
    ],
    landmarkId: 'universite',
  },
  {
    id: 'evo-day-1-living-efeler',
    dayNumber: 1,
    date: '2026-11-11',
    title: 'Zeybek Meydanı, Hayır Lokması & Sıcak Yuvam Temeli',
    category: 'Görsel & Atmosfer',
    summary:
      'Atatürk Kent Meydanı’nda büyüyen Aydın incir ağacı, sokak müzisyenleriyle zeybek gösterisi, Bey Camii hayır lokması, hava durumu efektleri ve Lo-Fi ses motoru kuruldu.',
    highlights: [
      'İncir puanıyla büyüyüp meyve veren Kent Meydanı incir ağacı eklendi.',
      'Zeybek çalan sokak müzisyenleri, kütüphane önü mendil satıcısı ve Bey Camii lokma standı eklendi.',
      'Yağmur, kar ve fırtına hava seçenekleriyle senkronize prosedürel Lo-Fi müzik kanalları eklendi.',
      'Aydın gerçek haritası (Google Maps Platform) ve mobil dokunmatik sürüş kontrolleri eklendi.',
    ],
    landmarkId: 'kentmeydani',
  },
];

export const UPCOMING_EVOLUTION_IDEAS: string[] = [
  'Zafer Meydanı & Aydın Arkeoloji Müzesi açık hava lahit bahçesi',
  'Kemer & Girne Bulvarı Cumartesi İncir–Zeytin Üretici Pazarı tezgahları',
  'Menderes Kanalı boyunca kuğular, su fenerleri ve akşam yakamozu',
  'Tralleis Antik Kenti sütunlu agora ve antik tiyatro basamakları genişlemesi',
  'Sıcak Yuvam için duvar saati, zeytin dalı vazosu, kilim desenleri ve balkondan Efeler manzarası',
  'Aydın Antik Kentleri Faz 2: Nysa Antik Kenti (Sultanhisar) bağ yolu kapısı',
];
