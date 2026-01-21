import { test, describe } from 'node:test';
import assert from 'node:assert';
import { hashPassword, verifyPassword } from '../src/utils/password';
import crypto from 'crypto';

describe('Password Hashing', () => {
  test('legacy SHA-256 hash verification', async () => {
    const legacyPwd = 'legacyPassword';
    const legacyHash = crypto.createHash('sha256').update(legacyPwd).digest('hex');

    const isValid = await verifyPassword(legacyPwd, legacyHash);
    assert.strictEqual(isValid, true, 'Legacy password should verify');
  });

  test('new scrypt hash generation and verification', async () => {
    const newPwd = 'securePassword!';
    const newHash = await hashPassword(newPwd);

    assert.ok(newHash.includes(':'), 'New hash should contain salt separator');

    const isValid = await verifyPassword(newPwd, newHash);
    assert.strictEqual(isValid, true, 'New password should verify');
  });

  test('invalid password rejection', async () => {
    const newPwd = 'securePassword!';
    const newHash = await hashPassword(newPwd);

    const isValid = await verifyPassword('wrong', newHash);
    assert.strictEqual(isValid, false, 'Invalid password should be rejected');
  });
});
