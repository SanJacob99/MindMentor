import { test, describe } from 'node:test';
import assert from 'node:assert';
import { buildApp } from '../src/buildApp';

describe('Trust Proxy Vulnerability', () => {
  const app = buildApp();
  const payload = {
    email: 'test@example.com',
    password: 'password123'
  };

  test('X-Forwarded-For bypasses rate limit when trustProxy is true', async () => {
    // 1. Exhaust limit for IP 1 (limit is 5)
    // We use unique emails to avoid 409 Conflict if DB is actually running
    for (let i = 0; i < 5; i++) {
        const res = await app.inject({
            method: 'POST',
            url: '/auth/signup',
            headers: { 'X-Forwarded-For': '10.0.0.1' },
            payload: { ...payload, email: `test${i}@example.com` }
        });
        // We expect anything BUT 429 (likely 500 if no DB, or 201/409)
        assert.notStrictEqual(res.statusCode, 429, `Req ${i} blocked unexpectedly`);
    }

    // 2. Confirm IP 1 is blocked (6th request)
    const blockedRes = await app.inject({
        method: 'POST',
        url: '/auth/signup',
        headers: { 'X-Forwarded-For': '10.0.0.1' },
        payload
    });
    assert.strictEqual(blockedRes.statusCode, 429, 'IP 1 should be blocked');

    // 3. Try IP 2 (spoofed)
    // Vulnerable behavior: request.ip becomes '10.0.0.2', which is fresh.
    // Secure behavior: request.ip remains connection IP (mocked 127.0.0.1), which is shared with previous requests (so should be blocked).
    const bypassRes = await app.inject({
        method: 'POST',
        url: '/auth/signup',
        headers: { 'X-Forwarded-For': '10.0.0.2' },
        payload
    });

    // Vulnerability FIXED: request.ip remains connection IP, so it shares the limit with previous requests.
    // Should be blocked (429).
    assert.strictEqual(bypassRes.statusCode, 429, 'Fix Verification: IP Spoofing should NOT bypass rate limit');
  });
});
