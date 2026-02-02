import { test, describe } from 'node:test';
import assert from 'node:assert';
import { RateLimiter } from '../src/utils/rateLimiter';

describe('RateLimiter DoS Protection', () => {
  test('RateLimiter should cap memory usage under attack', () => {
    const limiter = new RateLimiter();
    const MAX_HITS = 10000;

    // Simulate DoS: 15,000 unique IPs
    for (let i = 0; i < 15000; i++) {
      limiter.check(`ip-${i}`, 10, 60000);
    }

    const currentSize = (limiter as any).hits.size;
    console.log(`Current RateLimiter size: ${currentSize}`);

    // This assertion should fail before the fix, and pass after.
    assert.ok(currentSize <= MAX_HITS, `RateLimiter size ${currentSize} exceeded max ${MAX_HITS}`);
  });
});
