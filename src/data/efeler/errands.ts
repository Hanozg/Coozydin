import { ErrandDef } from '../../types/game';

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
