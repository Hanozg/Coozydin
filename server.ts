import 'dotenv/config';
import express from 'express';
import path from 'path';
import { GoogleGenAI } from '@google/genai';
import { TtsAudioCache } from './server/ttsCache.ts';

const PORT = Number(process.env.PORT) || 3000;

let cachedAiClient: GoogleGenAI | null = null;
let cachedAiKey: string | undefined;

function getGeminiClient(apiKey: string): GoogleGenAI {
  if (!cachedAiClient || cachedAiKey !== apiKey) {
    cachedAiKey = apiKey;
    cachedAiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return cachedAiClient;
}

const ttsCache = new TtsAudioCache();

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '64kb' }));

  app.get('/api/health', (_req, res) => {
    res.json({ ok: true });
  });

  app.post('/api/tts', async (req, res) => {
    const rawText = typeof req.body?.text === 'string' ? req.body.text.trim() : '';
    const landmarkId = typeof req.body?.landmarkId === 'string' ? req.body.landmarkId.trim() : '';

    if (!rawText || rawText.length > 1400) {
      res.status(400).json({
        error: 'Geçerli bir anlatım metni gönderilmelidir.',
        code: 'INVALID_TEXT',
      });
      return;
    }

    const cacheKey = `${landmarkId}::${rawText}`;
    const cached = ttsCache.get(cacheKey);
    if (cached) {
      res.json(cached);
      return;
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      res.status(503).json({
        error: 'GEMINI_API_KEY sunucuda tanımlı değil.',
        code: 'MISSING_KEY',
      });
      return;
    }

    try {
      const payload = await ttsCache.getOrGenerate(cacheKey, async () => {
        const ai = getGeminiClient(apiKey);
        const response = await ai.models.generateContent({
          model: 'gemini-3.8-flash-lite-tts',
          contents: [
            {
              role: 'user',
              parts: [
                {
                  text: rawText,
                  speechMetadata: {
                    style:
                      'Warm, expressive, natural Turkish cultural tour guide speaking conversationally with authentic human warmth, gentle breathing pauses, and clear Turkish diction',
                  },
                },
              ],
            },
          ],
          config: {
            responseModalities: ['AUDIO'],
            speechConfig: {
              voiceConfig: {
                prebuiltVoiceConfig: { voiceName: 'Kore' },
              },
            },
          },
        });

        const inlineData = response.candidates?.[0]?.content?.parts?.[0]?.inlineData;
        const audioBase64 = inlineData?.data;
        if (!audioBase64) return null;

        return {
          audioBase64,
          mimeType: inlineData?.mimeType || 'audio/wav',
        };
      });

      if (!payload) {
        res.status(502).json({
          error: 'Ses verisi üretilemedi.',
          code: 'EMPTY_AUDIO',
        });
        return;
      }

      res.json(payload);
    } catch (err: unknown) {
      const errObj = err as { status?: number; message?: string };
      const status =
        typeof errObj?.status === 'number' && errObj.status >= 400 && errObj.status < 600
          ? errObj.status
          : 500;
      const message = errObj?.message || 'Sesli rehber üretimi sırasında bir hata oluştu.';
      console.error('[TTS Error]', status, message);
      res.status(status).json({
        error: message,
        code: 'TTS_FAILED',
      });
    }
  });

  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Efeler server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
