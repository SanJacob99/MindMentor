import { test, describe } from 'node:test';
import assert from 'node:assert';
import { buildApp } from '../src/buildApp';

describe('Security Headers', () => {
  test('GET /health returns security headers', async () => {
    const app = buildApp();

    // We don't need to listen, we can inject
    const response = await app.inject({
      method: 'GET',
      url: '/health'
    });

    assert.strictEqual(response.statusCode, 200);
    assert.strictEqual(response.headers['x-content-type-options'], 'nosniff');
    assert.strictEqual(response.headers['x-frame-options'], 'DENY');
    assert.strictEqual(response.headers['x-xss-protection'], '1; mode=block');
    assert.strictEqual(response.headers['strict-transport-security'], 'max-age=31536000; includeSubDomains');
    assert.strictEqual(response.headers['content-security-policy'], "default-src 'self'");
  });
});
