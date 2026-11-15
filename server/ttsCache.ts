import { Buffer } from 'node:buffer';

export interface CachedTtsAudio {
  audioBase64: string;
  mimeType: string;
}

const MAX_TTS_CACHE = 40;
const MAX_TTS_CACHE_BYTES = 32 * 1024 * 1024;

export class TtsAudioCache {
  private readonly cache = new Map<string, { audio: CachedTtsAudio; sizeBytes: number }>();
  private readonly pending = new Map<string, Promise<CachedTtsAudio | null>>();
  private readonly maxBytes: number;
  private cacheBytes = 0;

  constructor(maxBytes = MAX_TTS_CACHE_BYTES) {
    if (!Number.isSafeInteger(maxBytes) || maxBytes < 0) {
      throw new RangeError('The TTS cache byte budget must be a non-negative safe integer.');
    }
    this.maxBytes = maxBytes;
  }

  get(key: string): CachedTtsAudio | undefined {
    return this.cache.get(key)?.audio;
  }

  getOrGenerate(
    key: string,
    generate: () => Promise<CachedTtsAudio | null>,
  ): Promise<CachedTtsAudio | null> {
    const cached = this.get(key);
    if (cached) return Promise.resolve(cached);

    const pending = this.pending.get(key);
    if (pending) return pending;

    const request = Promise.resolve()
      .then(generate)
      .then((audio) => {
        if (audio) {
          const sizeBytes = Buffer.byteLength(key, 'utf8') +
            Buffer.byteLength(audio.audioBase64, 'utf8') +
            Buffer.byteLength(audio.mimeType, 'utf8');

          if (sizeBytes <= this.maxBytes) {
            while (this.cache.size >= MAX_TTS_CACHE || this.cacheBytes + sizeBytes > this.maxBytes) {
              const oldest = this.cache.entries().next().value;
              if (!oldest) break;
              this.cache.delete(oldest[0]);
              this.cacheBytes -= oldest[1].sizeBytes;
            }
            this.cache.set(key, { audio, sizeBytes });
            this.cacheBytes += sizeBytes;
          }
        }
        return audio;
      })
      .finally(() => {
        this.pending.delete(key);
      });

    this.pending.set(key, request);
    return request;
  }
}
