import { GezginBadgeDef } from '../../types/game';

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
