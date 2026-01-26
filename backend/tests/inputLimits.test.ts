import { test, describe } from 'node:test';
import assert from 'node:assert';
import { buildApp } from '../src/buildApp';
import jwt from 'jsonwebtoken';
import { env } from '../src/config/env';

describe('Input Limits Security', () => {
  const app = buildApp();

  test('POST /auth/signup rejects overly long password', async () => {
    // Generate a long password (e.g. 200 chars)
    const longPassword = 'a'.repeat(200);

    const response = await app.inject({
      method: 'POST',
      url: '/auth/signup',
      payload: {
        email: 'test@example.com',
        password: longPassword
      }
    });

    // We expect 400 Bad Request when the fix is applied.
    // Currently (before fix), it might be 200 (if DB works) or 500 (if DB fails) or 409 (if user exists).
    // The test asserts what we WANT.
    assert.strictEqual(response.statusCode, 400, `Expected 400, got ${response.statusCode}`);
  });

  test('POST /entries rejects overly long text', async () => {
    // Forge a token to bypass auth middleware
    const token = jwt.sign({ userId: 'some-uuid' }, env.JWT_SECRET, { expiresIn: '1h' });

    const longText = 'a'.repeat(20000); // 20k chars

    const response = await app.inject({
      method: 'POST',
      url: '/entries',
      headers: {
        Authorization: `Bearer ${token}`
      },
      payload: {
        mood: 5,
        stress: 5,
        energy: 5,
        text: longText
      }
    });

    assert.strictEqual(response.statusCode, 400, `Expected 400, got ${response.statusCode}`);
  });

  test('POST /entries rejects too many tags', async () => {
    const token = jwt.sign({ userId: 'some-uuid' }, env.JWT_SECRET, { expiresIn: '1h' });

    const manyTags = Array(50).fill('tag'); // 50 tags

    const response = await app.inject({
      method: 'POST',
      url: '/entries',
      headers: {
        Authorization: `Bearer ${token}`
      },
      payload: {
        mood: 5,
        stress: 5,
        energy: 5,
        tags: manyTags
      }
    });

    assert.strictEqual(response.statusCode, 400, `Expected 400, got ${response.statusCode}`);
  });
});
