# Server cache tests

Requires Node.js 24.12 or later. Run from the repository root:

```bash
node --test tests/server/tts-cache.test.mjs
```

These tests use fake audio and generators; no dependencies, credentials, or live
Gemini calls are needed.

The TTS cache shares concurrent generation for identical keys within one server
process. Completed results retain the existing FIFO eviction policy and are
limited to 40 entries and a default 32 MiB UTF-8 data budget. The budget counts
each entry's key, base64 audio, and MIME type without decoding the audio. The
constructor accepts an alternate byte budget, which tests use for small fixtures.

An entry larger than the whole budget is returned to all waiting callers without
being cached or evicting existing entries. Failures and empty results are not
cached and can be retried.

The data budget does not measure JavaScript object overhead, active generations,
HTTP responses, or total process memory. The default is an initial storage budget;
production memory and cache-hit measurements should guide later tuning. Each
server process has its own cache and budget.
