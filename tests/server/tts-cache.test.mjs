import assert from 'node:assert/strict';
import { test } from 'node:test';
import { TtsAudioCache } from '../../server/ttsCache.ts';

const audio = { audioBase64: 'dGVzdA==', mimeType: 'audio/wav' };

test('ten concurrent requests for the same key generate audio once', async () => {
  const cache = new TtsAudioCache();
  const gate = Promise.withResolvers();
  let calls = 0;
  const generate = async () => {
    calls += 1;
    return gate.promise;
  };
  const requests = Array.from({ length: 10 }, () => cache.getOrGenerate('same', generate));
  await Promise.resolve();
  assert.equal(calls, 1);
  gate.resolve(audio);
  assert.deepEqual(await Promise.all(requests), Array(10).fill(audio));
});

test('a cached result does not generate audio again', async () => {
  const cache = new TtsAudioCache();
  await cache.getOrGenerate('cached', async () => audio);
  const result = await cache.getOrGenerate('cached', async () => {
    assert.fail('A cached result must not call the generator');
  });
  assert.deepEqual(result, audio);
  assert.deepEqual(cache.get('cached'), audio);
});

test('different keys can generate concurrently', async () => {
  const cache = new TtsAudioCache();
  const gate = Promise.withResolvers();
  let calls = 0;
  const generate = async () => { calls += 1; return gate.promise; };
  const first = cache.getOrGenerate('first', generate);
  const second = cache.getOrGenerate('second', generate);
  await Promise.resolve();
  assert.equal(calls, 2);
  gate.resolve(audio);
  await Promise.all([first, second]);
});

test('a shared failure is released so the next request can retry', async () => {
  const cache = new TtsAudioCache();
  const gate = Promise.withResolvers();
  const requests = [
    cache.getOrGenerate('retry', () => gate.promise),
    cache.getOrGenerate('retry', () => gate.promise),
  ];
  const outcomes = Promise.allSettled(requests);
  gate.reject(new Error('upstream failed'));
  for (const result of await outcomes) {
    assert.equal(result.status, 'rejected');
    assert.equal(result.reason.message, 'upstream failed');
  }
  assert.equal(cache.get('retry'), undefined);
  assert.deepEqual(await cache.getOrGenerate('retry', async () => audio), audio);
});

test('empty audio is not cached and can be retried', async () => {
  const cache = new TtsAudioCache();
  assert.equal(await cache.getOrGenerate('empty', async () => null), null);
  assert.equal(cache.get('empty'), undefined);
  assert.deepEqual(await cache.getOrGenerate('empty', async () => audio), audio);
});

test('the existing forty-entry eviction limit is retained', async () => {
  const cache = new TtsAudioCache();
  for (let index = 0; index < 41; index += 1) {
    await cache.getOrGenerate(String(index), async () => audio);
  }
  assert.equal(cache.get('0'), undefined);
  assert.deepEqual(cache.get('1'), audio);
  assert.deepEqual(cache.get('40'), audio);
});

test('the default budget returns a large response without retaining it', async () => {
  const cache = new TtsAudioCache();
  await cache.getOrGenerate('small', async () => audio);
  const largeAudio = { ...audio, audioBase64: 'A'.repeat(32 * 1024 * 1024) };
  assert.equal(await cache.getOrGenerate('large', async () => largeAudio), largeAudio);
  assert.equal(cache.get('large'), undefined);
  assert.deepEqual(cache.get('small'), audio);
});

test('an entry fits at the exact byte limit but not one byte over it', async () => {
  // One-byte key + eight-byte base64 data + nine-byte MIME type = 18 bytes.
  const exact = new TtsAudioCache(18);
  await exact.getOrGenerate('a', async () => audio);
  assert.deepEqual(exact.get('a'), audio);

  const tooSmall = new TtsAudioCache(17);
  assert.deepEqual(await tooSmall.getOrGenerate('a', async () => audio), audio);
  assert.equal(tooSmall.get('a'), undefined);
});

test('byte pressure evicts enough oldest entries and releases their budget', async () => {
  const cache = new TtsAudioCache(72);
  for (const key of ['a', 'b', 'c', 'd']) {
    await cache.getOrGenerate(key, async () => audio);
  }
  const largerAudio = { ...audio, audioBase64: 'A'.repeat(32) };
  await cache.getOrGenerate('e', async () => largerAudio);
  for (const key of ['a', 'b', 'c']) assert.equal(cache.get(key), undefined);
  assert.deepEqual(cache.get('d'), audio);
  assert.deepEqual(cache.get('e'), largerAudio);

  await cache.getOrGenerate('f', async () => audio);
  assert.equal(cache.get('d'), undefined);
  assert.deepEqual(cache.get('e'), largerAudio);
  assert.deepEqual(cache.get('f'), audio);
});

test('oversized concurrent responses are shared without flushing cached audio', async () => {
  const cache = new TtsAudioCache(64);
  await cache.getOrGenerate('small', async () => audio);
  const largeAudio = { ...audio, audioBase64: 'A'.repeat(64) };
  const gate = Promise.withResolvers();
  let calls = 0;
  const generate = async () => { calls += 1; return gate.promise; };
  const requests = Array.from({ length: 10 }, () => cache.getOrGenerate('large', generate));
  await Promise.resolve();
  assert.equal(calls, 1);
  gate.resolve(largeAudio);
  assert.deepEqual(await Promise.all(requests), Array(10).fill(largeAudio));
  assert.equal(cache.get('large'), undefined);
  assert.deepEqual(cache.get('small'), audio);

  await cache.getOrGenerate('large', generate);
  assert.equal(calls, 2);
});

test('UTF-8 cache keys count toward the byte budget', async () => {
  const cache = new TtsAudioCache(18);
  await cache.getOrGenerate('a', async () => audio);
  await cache.getOrGenerate('ı', async () => audio);
  assert.equal(cache.get('ı'), undefined);
  assert.deepEqual(cache.get('a'), audio);
});
