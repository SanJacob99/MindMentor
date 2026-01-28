import { test, describe } from 'node:test';
import assert from 'node:assert';
import { buildApp } from '../src/buildApp';
import jwt from 'jsonwebtoken';
import { env } from '../src/config/env';

describe('Missing Input Limits Security', () => {
  const app = buildApp();
  const token = jwt.sign({ userId: 'some-uuid' }, env.JWT_SECRET, { expiresIn: '1h' });

  test('POST /users/preferences rejects overly long timezone', async () => {
    const longTimezone = 'a'.repeat(20000);

    const response = await app.inject({
      method: 'POST',
      url: '/users/preferences',
      headers: { Authorization: `Bearer ${token}` },
      payload: {
        timezone: longTimezone
      }
    });

    assert.strictEqual(response.statusCode, 400, `Expected 400 for huge timezone, got ${response.statusCode}`);
  });

  test('GET /entries rejects overly long "from" date', async () => {
    const longDate = 'a'.repeat(20000);

    const response = await app.inject({
      method: 'GET',
      url: `/entries?from=${longDate}`,
      headers: { Authorization: `Bearer ${token}` }
    });

    assert.strictEqual(response.statusCode, 400, `Expected 400 for huge date query, got ${response.statusCode}`);
  });

  test('POST /recommendations/:id/feedback rejects non-UUID id', async () => {
    const invalidId = 'not-a-uuid';

    const response = await app.inject({
      method: 'POST',
      url: `/recommendations/${invalidId}/feedback`,
      headers: { Authorization: `Bearer ${token}` },
      payload: {
        outcome: 'HELPED'
      }
    });

    assert.strictEqual(response.statusCode, 400, `Expected 400 for huge/invalid ID, got ${response.statusCode}`);
  });
});
