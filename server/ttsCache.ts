export interface CachedTtsAudio {
  audioBase64: string;
  mimeType: string;
}

const MAX_TTS_CACHE = 40;

export class TtsAudioCache {
  private readonly cache = new Map<string, CachedTtsAudio>();
  private readonly pending = new Map<string, Promise<CachedTtsAudio | null>>();

  get(key: string): CachedTtsAudio | undefined {
    return this.cache.get(key);
  }

  getOrGenerate(
    key: string,
    generate: () => Promise<CachedTtsAudio | null>,
  ): Promise<CachedTtsAudio | null> {
    const cached = this.cache.get(key);
    if (cached) return Promise.resolve(cached);

    const pending = this.pending.get(key);
    if (pending) return pending;

    const request = Promise.resolve()
      .then(generate)
      .then((audio) => {
        if (audio) {
          if (this.cache.size >= MAX_TTS_CACHE) {
            const oldestKey = this.cache.keys().next().value;
            if (oldestKey !== undefined) this.cache.delete(oldestKey);
          }
          this.cache.set(key, audio);
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
