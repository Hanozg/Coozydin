# Efeler: Aydın Yolları — Geliştirici ve VS Code Rehberi

Aydın Efeler ilçesinin tarihi dokusunu, sokaklarını ve 1:100 ölçekli topoğrafyasını keşfedebileceğiniz Three.js + React + Express tabanlı 3B şehir oyunu.

## VS Code ile Hızlı Başlangıç

1. Klasörü VS Code ile açın (`code .`).
2. Sağ altta çıkan **"Önerilen eklentileri yükle"** uyarısını onaylayın (ESLint, Prettier, Tailwind CSS, TypeScript yardımcıları).
3. Bağımlılıkları yükleyin:
   ```bash
   npm install
   ```
4. Ortam değişkenlerini ayarlayın (isteğe bağlı, sesli rehber ve gerçek harita için):
   ```bash
   cp .env.example .env
   ```
   `.env` dosyasına `GEMINI_API_KEY` ve `VITE_GOOGLE_MAPS_API_KEY` değerlerinizi girin.
5. Projeyi başlatın:
   - Terminalden: `npm run dev`
   - Veya VS Code içinden **`Ctrl+Shift+B`** (Varsayılan Görev: Geliştirme Sunucusu)
   - Veya **`F5`** ile doğrudan hata ayıklama modunda başlatın.
6. Tarayıcıda `http://localhost:3000` adresini açın. Yerelde `DISABLE_HMR` tanımlı olmadığı için dosya değişiklikleriniz anında tarayıcıya yansır (HMR aktif).

## Faydalı Komutlar ve VS Code Görevleri

| Komut | Açıklama |
| --- | --- |
| `npm run dev` | Express + Vite geliştirme sunucusunu 3000 portunda başlatır |
| `npm run lint` | TypeScript tür denetimi (`tsc --noEmit`) çalıştırır |
| `npm test` | Sunucu TTS önbellek birim testlerini çalıştırır (Node 24.12+) |
| `npm run check` | Tür denetimi + birim testlerini arka arkaya çalıştırır |
| `npm run build` | Üretim paketini (`dist/`) oluşturur |

## Modüler Klasör Yapısı (Nerede Ne Değiştirilir?)

- **`src/data/efeler/`**: Oyun verileri ve ayarlar
  - `landmarks.ts`: Tarihi yapılar, koordinatlar, açıklamalar ve Sesli Rehber metinleri
  - `errands.ts`: Teslimat görevleri ve mahalle diyalogları
  - `districts.ts`: Mahalle sınırları ve Efeler Bölge Radyosu istasyonları
  - `customization.ts`: Araç, ev cephesi, oda mobilyası ve avatar seçenekleri
  - `atmosphere.ts`: Mevsim, hava durumu ve güneş döngüsü ışık eğrileri
  - `progression.ts`: Efeler Gezgini rozetleri ve incir ağacı aşamaları
- **`src/game/landmarks/`**: 3B tarihi yapı kurucuları ve kayıt defteri (`index.ts` içindeki `LANDMARK_BUILDERS`)
- **`src/game/world/`**: 3B şehir oluşturucu (`terrainAndStream`, `roadNetwork`, `neighborhoodsAndProps`, `geometryHelpers`)
- **`src/components/hud/`**: Üst bilgi çubuğu, etkileşim butonları, çekmeceler ve alt kontrol paneli
- **`src/components/room/`**: Ev içi 3B sahne, karakter/evcil hayvan modelleri ve oda mağazası arayüzü
- **`src/components/canvas/`**: Ana 3B sahne yardımcıları (parçacıklar, atmosfer güncellemesi, kamera takibi)
- **`src/hooks/`**: Bulut ve yerel kayıt kalıcılığı (`useGamePersistence.ts`)
- **`server.ts` & `server/`**: Express API sunucusu ve TTS ses önbelleği
- **`tests/server/`**: Sunucu tarafı birim testleri
