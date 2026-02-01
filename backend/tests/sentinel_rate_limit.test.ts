import { test, describe } from 'node:test';
import assert from 'node:assert';
import { buildApp } from '../src/buildApp';
import jwt from 'jsonwebtoken';
import { env } from '../src/config/env';

describe('Sentinel Rate Limit Verification', () => {
  const app = buildApp();

  test('GET /insights/summary enforces rate limit (10 req/min)', async () => {
    const token = jwt.sign({ userId: 'sentinel-test-user-secure' }, env.JWT_SECRET, { expiresIn: '1h' });

    // 10 requests should pass (or fail with 500, but not 429)
    for (let i = 0; i < 10; i++) {
      const response = await app.inject({
        method: 'GET',
        url: '/insights/summary',
        headers: { Authorization: `Bearer ${token}` }
      });
      assert.notStrictEqual(response.statusCode, 429, `Request ${i + 1} should not be rate limited`);
    }

    // 11th request should be blocked
    const response = await app.inject({
      method: 'GET',
      url: '/insights/summary',
      headers: { Authorization: `Bearer ${token}` }
    });
    assert.strictEqual(response.statusCode, 429, '11th request should be rate limited');
  });

  test('GET /users/me enforces rate limit (20 req/min)', async () => {
    // New user to start with fresh bucket
    const userToken = jwt.sign({ userId: 'user-me-test' }, env.JWT_SECRET, { expiresIn: '1h' });

    for (let i = 0; i < 20; i++) {
      const response = await app.inject({
        method: 'GET',
        url: '/users/me',
        headers: { Authorization: `Bearer ${userToken}` }
      });
      assert.notStrictEqual(response.statusCode, 429, `Request ${i + 1} should not be rate limited`);
    }

    const response = await app.inject({
      method: 'GET',
      url: '/users/me',
      headers: { Authorization: `Bearer ${userToken}` }
    });
    assert.strictEqual(response.statusCode, 429, '21st request should be rate limited');
  });

  test('GET /entries enforces rate limit (20 req/min)', async () => {
    const entryToken = jwt.sign({ userId: 'user-entry-test' }, env.JWT_SECRET, { expiresIn: '1h' });

    for (let i = 0; i < 20; i++) {
      const response = await app.inject({
        method: 'GET',
        url: '/entries',
        headers: { Authorization: `Bearer ${entryToken}` }
      });
      assert.notStrictEqual(response.statusCode, 429, `Request ${i + 1} should not be rate limited`);
    }

    const response = await app.inject({
      method: 'GET',
      url: '/entries',
      headers: { Authorization: `Bearer ${entryToken}` }
    });
    assert.strictEqual(response.statusCode, 429, '21st request should be rate limited');
  });
});
