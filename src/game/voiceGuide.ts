import { LandmarkDef } from '../types/game';

/**
 * Warm, conversational Turkish cultural tour-guide scripts for each Efeler landmark.
 */
const LANDMARK_HISTORICAL_FACTS: Record<string, string> = {
  tralleis:
    'Şu an Tralleis Antik Kenti’nin görkemli Üç Gözler kalıntılarının önündesiniz. Milattan Sonra 2. yüzyıldan kalma bu anıtsal kemerler, antik kentin büyük gymnasion yapısının günümüze ulaşan en etkileyici parçasıdır. Üstelik dünyadaki en eski tam müzik yazıtı olan Seikilos Ağıtı da bu topraklarda keşfedilmiştir.',
  ramazanpasa:
    'Burası Ramazan Paşa Camii ve Tarihi Çarşı. 1595 yılında inşa edilen bu Osmanlı klasik dönem camisi, yüzyıllardır Aydın’ın esnaf ve ticaret kültürünün tam kalbinde yer alıyor. Çevresindeki sokaklar hâlâ eski çarşı ruhunu yaşatıyor.',
  beycamii:
    'Karşınızda 1683 yılında Üveys Paşa’nın torunu Süleyman Bey tarafından yaptırılan Bey Camii yer alıyor. Sekizgen kasnaklı kurşun kubbesi ve gökyüzüne uzanan zarif taş minaresiyle, Efeler silüetinin en sevilen tarihi yapılarından biridir.',
  cihanoglu:
    'Cihanoğlu Külliyesi ve Kulesi’ne hoş geldiniz. 1756 yılında bölgenin köklü ayan ailesi Cihanoğulları tarafından yaptırılan bu yapı; barok etkili süslemeleri, medrese avlusu ve köşedeki savunma amaçlı tarihi taş kulesiyle Ege’de benzersiz bir mimari sunar.',
  nasuhpasa:
    'Burası 1708 tarihli Nasuh Paşa Külliyesi, halk arasındaki adıyla Zincirli Han. İki katlı revaklı iç avlusu ve ortasındaki şadırvanıyla, geçmişte Ege kervan yollarından geçen yolcuların soluklandığı en önemli duraklardan biriydi.',
  kentmeydani:
    'Efeler’in kalbi Atatürk Kent Meydanı’ndasınız. Adnan Menderes Bulvarı üzerindeki bu geniş meydan, yansıtma havuzu ve kurtuluş ruhunu simgeleyen Atatürk ve Efeler Anıtı ile şehrin en canlı buluşma noktasıdır.',
  saribelediye:
    'Önünde durduğunuz yapı Aydın Büyükşehir Belediyesi Binası. Altın yansımalı eğrisel cam cephesi ve ön avlusundaki Atatürk Anıtı ile modern Efeler’in simgesidir. Hemen arkasından ise kentin tarihi su hattı Tabakhane Deresi akar.',
  tekstilpark:
    'Burası Tekstil Park, yani eski Aydın Sümerbank Tekstil Fabrikası yerleşkesi. 1950’lerde kurulan bu önemli Cumhuriyet dönemi sanayi mirası, kırmızı tuğlalı dokuma holleri ve tarihi bacası korunarak yemyeşil bir şehir parkına dönüştürülmüştür.',
  forumaydin:
    'Forum Aydın Yaşam Merkezi’ndesiniz. Geleneksel Ege sokakları ve açık avlu mimarisinden esinlenerek tasarlanan bu merkez, palmiyeli yürüyüş yollarıyla kentin modern günlük yaşamına ev sahipliği yapıyor.',
  trengari:
    'Karşınızda 1882 yılında açılan Tarihi Aydın Tren Garı var. Anadolu’nun ilk demiryolu hattı olan İzmir-Aydın demiryolu üzerinde yer alan gar, kesme taş cephesi ve nostaljik peron sundurmasıyla bir buçuk asırlık bir mirası yaşatıyor.',
  ortamahalle:
    'Tabakhane Deresi’nin doğu yakasındaki Orta Mahalle’desiniz. 19. yüzyıldan bugüne uzanan taş sokakları, cumbalı ahşap evleri ve kemerli mahalle çeşmesiyle geleneksel Aydın komşuluk kültürünün en sıcak örneklerini burada görebilirsiniz.',
  universite:
    'Aydın ovasına hakim Aytepe sırtlarındaki Aydın Adnan Menderes Üniversitesi kampüsündesiniz. 1992 yılında kurulan üniversite, kubbeli kütüphanesi ve geniş yeşil alanlarıyla şehre genç ve dinamik bir soluk kazandırıyor.',
  magnesia:
    'Efeler’in batı kapısı Magnesia Antik Kenti’ne ulaştınız. Milattan Önce 4. yüzyılda kurulan bu kent, antik dünyanın ünlü mimarı Hermogenes’in tasarladığı görkemli Artemis Leukophryene Tapınağı ile tarih sahnesinde özel bir yere sahiptir.',
  nevzatbicerpark:
    'Cumhuriyet Mahallesi’ndeki Nevzat Biçer Parkı’ndasınız. Eski meyan kökü fabrikası alanından dönüştürülen bu geniş kent parkı; taş amfi tiyatrosu, süs havuzu ve müzikle buluşan yeşil çim alanlarıyla Aydınlıların gözde nefes alma durağıdır.',
  kipaavm:
    'İstasyon Bulvarı üzerinde, Tarihi Tren Garı’nın hemen batısındaki Aydın Kipa AVM önündesiniz. Cumhuriyet Mahallesi ve istasyon çevresinin günlük buluşma ve alışveriş noktalarından biridir.',
  sevgiyolu:
    'Aydın Efeler’in en sevilen yaya ve kültür aksı Sevgi Yolu’ndasınız. Güzelhisar ile Hasanefendi mahallelerini birbirine bağlayan bu hareketli cadde; sahafları, çiçekçileri, kafeleri ve akşamları ışıldayan taklarıyla Aydınlıların günlük buluşma rotasıdır.',
  yagcilarici:
    'Tarihi Yağcılar İçi Çarşısı’na hoş geldiniz. Yüzyıllardır Aydın’ın zeytinyağı tüccarlarına, baharatçılarına, bakırcılarına ve yöresel incir dükkanlarına ev sahipliği yapan bu geleneksel arasta, Efeler esnaf kültürünün yaşayan kalbidir.',
};

let activeToken = 0;
let activeAudio: HTMLAudioElement | null = null;
let activeAbortController: AbortController | null = null;
const audioBlobUrlCache = new Map<string, string>();

export function isVoiceGuideSupported(): boolean {
  return typeof window !== 'undefined';
}

export function isWebSpeechSupported(): boolean {
  return (
    typeof window !== 'undefined' &&
    'speechSynthesis' in window &&
    typeof SpeechSynthesisUtterance !== 'undefined'
  );
}

export function buildLandmarkNarration(landmark: LandmarkDef): string {
  const curated = LANDMARK_HISTORICAL_FACTS[landmark.id];
  if (curated) return curated;
  return `${landmark.name}. ${landmark.era}. ${landmark.summary}`;
}

function pickBestTurkishVoice(): SpeechSynthesisVoice | null {
  if (!isWebSpeechSupported()) return null;
  const voices = window.speechSynthesis.getVoices();
  if (!voices || voices.length === 0) return null;

  const trVoices = voices.filter((v) => v.lang.toLowerCase().startsWith('tr'));
  if (trVoices.length === 0) return null;

  // Prefer natural/neural/Google voices over robotic default voices when falling back
  const natural = trVoices.find((v) =>
    /natural|neural|google|wavenet|online|emel|ahmet/i.test(v.name)
  );
  if (natural) return natural;
  return trVoices.find((v) => v.lang.toLowerCase() === 'tr-tr') ?? trVoices[0];
}

function base64ToBlobUrl(base64: string, mimeType: string): string {
  const binary = window.atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  const blob = new Blob([bytes], { type: mimeType || 'audio/wav' });
  return URL.createObjectURL(blob);
}

export function stopVoiceGuide(): void {
  activeToken += 1;
  if (activeAbortController) {
    activeAbortController.abort();
    activeAbortController = null;
  }
  if (activeAudio) {
    try {
      activeAudio.pause();
      activeAudio.currentTime = 0;
      activeAudio.onended = null;
      activeAudio.onerror = null;
      activeAudio.onplay = null;
    } catch {
      // Ignore cleanup errors
    }
    activeAudio = null;
  }
  if (isWebSpeechSupported()) {
    try {
      window.speechSynthesis.cancel();
    } catch {
      // Ignore speechSynthesis cancel errors
    }
  }
}

export interface NarrateLandmarkCallbacks {
  onLoading?: () => void;
  onStart?: () => void;
  onEnd?: () => void;
  onFallbackNotice?: (msg: string) => void;
  onError?: (reason: 'unsupported' | 'failed') => void;
}

function speakWithWebSpeechFallback(
  landmark: LandmarkDef,
  token: number,
  callbacks?: NarrateLandmarkCallbacks
): boolean {
  if (!isWebSpeechSupported()) {
    if (token === activeToken) {
      callbacks?.onError?.('unsupported');
    }
    return false;
  }

  try {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(buildLandmarkNarration(landmark));
    utterance.lang = 'tr-TR';
    utterance.rate = 0.96;
    utterance.pitch = 1.02;
    utterance.volume = 1.0;

    const voice = pickBestTurkishVoice();
    if (voice) {
      utterance.voice = voice;
    }

    let settled = false;
    const settleEnd = () => {
      if (settled || token !== activeToken) return;
      settled = true;
      callbacks?.onEnd?.();
    };

    utterance.onstart = () => {
      if (token !== activeToken) return;
      callbacks?.onStart?.();
    };
    utterance.onend = settleEnd;
    utterance.onerror = (event) => {
      if (settled || token !== activeToken) return;
      settled = true;
      const errType = (event as SpeechSynthesisErrorEvent | undefined)?.error;
      if (errType === 'canceled' || errType === 'interrupted') {
        callbacks?.onEnd?.();
      } else {
        callbacks?.onError?.('failed');
      }
    };

    callbacks?.onStart?.();
    window.speechSynthesis.speak(utterance);
    if (window.speechSynthesis.paused) {
      window.speechSynthesis.resume();
    }
    return true;
  } catch {
    if (token === activeToken) {
      callbacks?.onError?.('failed');
    }
    return false;
  }
}

export async function narrateLandmark(
  landmark: LandmarkDef,
  callbacks?: NarrateLandmarkCallbacks
): Promise<boolean> {
  if (!isVoiceGuideSupported()) {
    callbacks?.onError?.('unsupported');
    return false;
  }

  stopVoiceGuide();
  const token = ++activeToken;
  const text = buildLandmarkNarration(landmark);
  const cacheKey = `${landmark.id}::${text}`;

  const playUrl = async (objectUrl: string) => {
    if (token !== activeToken) return false;
    const audio = new Audio(objectUrl);
    audio.volume = 0.96;
    activeAudio = audio;

    audio.onended = () => {
      if (token !== activeToken) return;
      activeAudio = null;
      callbacks?.onEnd?.();
    };
    audio.onerror = () => {
      if (token !== activeToken) return;
      activeAudio = null;
      callbacks?.onError?.('failed');
    };

    try {
      await audio.play();
      if (token !== activeToken) {
        audio.pause();
        return false;
      }
      callbacks?.onStart?.();
      return true;
    } catch {
      if (token === activeToken) {
        activeAudio = null;
        callbacks?.onError?.('failed');
      }
      return false;
    }
  };

  const cachedUrl = audioBlobUrlCache.get(cacheKey);
  if (cachedUrl) {
    return playUrl(cachedUrl);
  }

  callbacks?.onLoading?.();

  const controller = new AbortController();
  activeAbortController = controller;

  try {
    const res = await fetch('/api/tts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ landmarkId: landmark.id, text }),
      signal: controller.signal,
    });

    if (token !== activeToken) return false;

    if (!res.ok) {
      const errData = (await res.json().catch(() => ({}))) as {
        error?: string;
        code?: string;
      };
      if (res.status === 503 && errData.code === 'MISSING_KEY' && isWebSpeechSupported()) {
        callbacks?.onFallbackNotice?.(
          'Doğal ses için sunucu API anahtarı henüz ayarlı değil, cihaz sesi kullanılıyor.'
        );
        return speakWithWebSpeechFallback(landmark, token, callbacks);
      }
      if (isWebSpeechSupported() && res.status >= 500) {
        callbacks?.onFallbackNotice?.('Sesli Rehber geçici olarak cihaz sesiyle çalınıyor.');
        return speakWithWebSpeechFallback(landmark, token, callbacks);
      }
      callbacks?.onError?.('failed');
      return false;
    }

    const data = (await res.json()) as { audioBase64?: string; mimeType?: string };
    if (token !== activeToken) return false;

    if (!data.audioBase64) {
      if (isWebSpeechSupported()) {
        return speakWithWebSpeechFallback(landmark, token, callbacks);
      }
      callbacks?.onError?.('failed');
      return false;
    }

    const objectUrl = base64ToBlobUrl(data.audioBase64, data.mimeType || 'audio/wav');
    audioBlobUrlCache.set(cacheKey, objectUrl);
    return playUrl(objectUrl);
  } catch (err: unknown) {
    if ((err as { name?: string })?.name === 'AbortError' || token !== activeToken) {
      return false;
    }
    if (isWebSpeechSupported()) {
      callbacks?.onFallbackNotice?.('Bağlantı nedeniyle cihaz sesiyle devam ediliyor.');
      return speakWithWebSpeechFallback(landmark, token, callbacks);
    }
    callbacks?.onError?.('failed');
    return false;
  } finally {
    if (activeAbortController === controller) {
      activeAbortController = null;
    }
  }
}
