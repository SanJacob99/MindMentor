import { test, describe } from 'node:test';
import assert from 'node:assert';
import { buildApp } from '../src/buildApp';
import jwt from 'jsonwebtoken';
import { env } from '../src/config/env';

describe('Journal Entry Rate Limiting', () => {
  const app = buildApp();
  const token = jwt.sign({ userId: 'test-user-rate-limit' }, env.JWT_SECRET, { expiresIn: '1h' });
  const entryPayload = {
    mood: 7,
    stress: 3,
    energy: 6,
    text: 'Testing rate limits',
    tags: ['test']
  };

  test('POST /entries blocks after 10 requests per minute', async () => {
    // Send 10 allowed requests
    for (let i = 0; i < 10; i++) {
      const response = await app.inject({
        method: 'POST',
        url: '/entries',
        headers: { Authorization: `Bearer ${token}` },
        payload: entryPayload
      });
      // We expect 500 because DB is not connected/mocked, OR 201 if it was.
      // Crucially, we do NOT expect 429 yet.
      assert.notStrictEqual(response.statusCode, 429, `Request ${i + 1} should not be rate limited`);
    }

    // Send 11th request - should be blocked
    const response = await app.inject({
      method: 'POST',
      url: '/entries',
      headers: { Authorization: `Bearer ${token}` },
      payload: entryPayload
    });

    assert.strictEqual(response.statusCode, 429, '11th request should be rate limited');
    const body = JSON.parse(response.body);
    assert.match(body.error, /Too many requests/i);
  });
});
