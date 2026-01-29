import { test, describe, mock, before, after } from 'node:test';
import assert from 'node:assert';
import prisma from '../src/utils/db';
import * as passwordUtils from '../src/utils/password';
import { buildApp } from '../src/buildApp';

describe('Login Timing Attack Mitigation', () => {
  let originalFindUnique: any;
  let originalVerifyPassword: any;
  let mockSuccess = false;

  before(() => {
    // Stub Prisma (Singleton)
    originalFindUnique = prisma.user.findUnique;
    prisma.user.findUnique = mock.fn(async () => null) as any;

    // Stub verifyPassword
    // In CommonJS (ts-node default), exports are mutable.
    originalVerifyPassword = passwordUtils.verifyPassword;

    try {
        // Create the mock
        const mockedVerify = mock.fn(async (pwd: string, hash: string) => {
            await new Promise(resolve => setTimeout(resolve, 100));
            return false;
        });

        // Attempt to overwrite
        // @ts-ignore
        passwordUtils.verifyPassword = mockedVerify;

        // Verify it stuck
        if (passwordUtils.verifyPassword === mockedVerify) {
            mockSuccess = true;
        }
    } catch (e) {
        console.warn("Could not stub verifyPassword:", e);
    }
  });

  after(() => {
    // Restore
    if (originalFindUnique) prisma.user.findUnique = originalFindUnique;
    if (mockSuccess && originalVerifyPassword) {
         try {
            // @ts-ignore
            passwordUtils.verifyPassword = originalVerifyPassword;
         } catch (e) {}
    }
  });

  test('verifyPassword is called when user is not found', async (t) => {
    if (!mockSuccess) {
        t.skip('Could not mock verifyPassword (likely ESM restrictions)');
        return;
    }

    const app = buildApp();
    const start = Date.now();

    const response = await app.inject({
      method: 'POST',
      url: '/auth/login',
      payload: {
        email: 'nonexistent@example.com',
        password: 'password'
      }
    });

    const duration = Date.now() - start;

    assert.strictEqual(response.statusCode, 401);

    // Check call count
    const mockedFn = passwordUtils.verifyPassword as any;
    assert.strictEqual(mockedFn.mock.calls.length, 1, 'verifyPassword should be called even if user not found');

    // Check timing
    assert.ok(duration >= 90, `Request took ${duration}ms, expected >= 90ms`);
  });
});
