import { test, describe } from 'node:test';
import assert from 'node:assert';
import { RateLimiter } from '../src/utils/rateLimiter';

describe('RateLimiter', () => {
  test('allows requests within limit', () => {
    const limiter = new RateLimiter();
    assert.strictEqual(limiter.check('ip1', 2, 1000), true);
    assert.strictEqual(limiter.check('ip1', 2, 1000), true);
  });

  test('blocks requests exceeding limit', () => {
    const limiter = new RateLimiter();
    limiter.check('ip2', 2, 1000); // 1
    limiter.check('ip2', 2, 1000); // 2
    assert.strictEqual(limiter.check('ip2', 2, 1000), false, 'Should block 3rd request'); // 3 (blocked)
  });

  test('resets after window expires', async () => {
    const limiter = new RateLimiter();
    limiter.check('ip3', 1, 100); // 1, limit 1
    assert.strictEqual(limiter.check('ip3', 1, 100), false, 'Should block immediate 2nd request'); // Blocked

    // Wait for window to expire
    await new Promise(resolve => setTimeout(resolve, 150));

    assert.strictEqual(limiter.check('ip3', 1, 100), true, 'Should allow after reset'); // Allowed again
  });

  test('tracks different keys separately', () => {
    const limiter = new RateLimiter();
    limiter.check('ip4', 1, 1000);
    assert.strictEqual(limiter.check('ip4', 1, 1000), false);

    // Different IP should be allowed
    assert.strictEqual(limiter.check('ip5', 1, 1000), true);
  });
});
