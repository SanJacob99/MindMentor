import { test, describe } from 'node:test';
import assert from 'node:assert';
import { buildApp } from '../src/buildApp';
import jwt from 'jsonwebtoken';
import { env } from '../src/config/env';

describe('Security Enhancements Rate Limiting', () => {
  const app = buildApp();
  const token = jwt.sign({ userId: 'test-user-security' }, env.JWT_SECRET, { expiresIn: '1h' });
  const preferencesPayload = {
    timezone: 'UTC',
    checkInEnabled: true
  };

  test('POST /users/preferences blocks after 10 requests per minute', async () => {
    // Send 10 allowed requests
    for (let i = 0; i < 10; i++) {
      const response = await app.inject({
        method: 'POST',
        url: '/users/preferences',
        headers: { Authorization: `Bearer ${token}` },
        payload: preferencesPayload
      });
      // DB connection might fail (500), but rate limit (429) happens before DB access.
      // So 500 is "success" in terms of bypassing rate limit.
      assert.notStrictEqual(response.statusCode, 429, `Request ${i + 1} should not be rate limited (status: ${response.statusCode})`);
    }

    // Send 11th request - should be blocked
    const response = await app.inject({
      method: 'POST',
      url: '/users/preferences',
      headers: { Authorization: `Bearer ${token}` },
      payload: preferencesPayload
    });

    assert.strictEqual(response.statusCode, 429, '11th request should be rate limited');
    const body = JSON.parse(response.body);
    assert.match(body.error, /Too many requests/i);
  });

  test('GET /recommendations/today blocks after 20 requests per minute', async () => {
    // Use a different user or wait? RateLimiter is in-memory per module instantiation.
    // However, buildApp creates a NEW fastify instance, but modules are cached by Node.
    // `const rateLimiter = new RateLimiter()` is at module top level.
    // So it persists across tests if the module is already loaded.
    // Using a different user ID ensures a clean slate.
    const token2 = jwt.sign({ userId: 'test-user-security-2' }, env.JWT_SECRET, { expiresIn: '1h' });

    for (let i = 0; i < 20; i++) {
      const response = await app.inject({
        method: 'GET',
        url: '/recommendations/today',
        headers: { Authorization: `Bearer ${token2}` }
      });
      assert.notStrictEqual(response.statusCode, 429, `Request ${i + 1} should not be rate limited`);
    }

    const response = await app.inject({
      method: 'GET',
      url: '/recommendations/today',
      headers: { Authorization: `Bearer ${token2}` }
    });

    assert.strictEqual(response.statusCode, 429, '21st request should be rate limited');
  });

  test('POST /recommendations/:id/feedback blocks after 20 requests per minute', async () => {
    const token3 = jwt.sign({ userId: 'test-user-security-3' }, env.JWT_SECRET, { expiresIn: '1h' });
    const feedbackPayload = { outcome: 'HELPED' };
    const fakeId = '00000000-0000-0000-0000-000000000000'; // Valid UUID format

    for (let i = 0; i < 20; i++) {
      const response = await app.inject({
        method: 'POST',
        url: `/recommendations/${fakeId}/feedback`,
        headers: { Authorization: `Bearer ${token3}` },
        payload: feedbackPayload
      });
      assert.notStrictEqual(response.statusCode, 429, `Request ${i + 1} should not be rate limited`);
    }

    const response = await app.inject({
      method: 'POST',
      url: `/recommendations/${fakeId}/feedback`,
      headers: { Authorization: `Bearer ${token3}` },
      payload: feedbackPayload
    });

    assert.strictEqual(response.statusCode, 429, '21st request should be rate limited');
  });
});
