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
