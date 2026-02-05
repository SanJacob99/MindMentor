import { scrypt, randomBytes, createHash, timingSafeEqual } from 'crypto';
import { promisify } from 'util';

const scryptAsync = promisify(scrypt);

// Legacy hash for backward compatibility (Unsalted SHA-256)
function legacyHash(password: string): string {
  return createHash('sha256').update(password).digest('hex');
}

/**
 * Hashes a password using scrypt with a random salt.
 * Returns format: "salt:hash" (hex encoded)
 */
export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString('hex');
  // scrypt(password, salt, keylen)
  const derivedKey = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${salt}:${derivedKey.toString('hex')}`;
}

/**
 * Verifies a password against a stored hash.
 * Supports both legacy (unsalted SHA-256) and new (scrypt) formats.
 */
export async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
  if (storedHash.includes(':')) {
    const [salt, key] = storedHash.split(':');
    if (!salt || !key) return false;

    try {
      const derivedKey = (await scryptAsync(password, salt, 64)) as Buffer;
      const keyBuffer = Buffer.from(key, 'hex');

      if (derivedKey.length !== keyBuffer.length) return false;
      return timingSafeEqual(derivedKey, keyBuffer);
    } catch (error) {
      return false;
    }
  } else {
    // Fallback to legacy check
    const computedHash = legacyHash(password);

    // Use default encoding (UTF-8) to treat hashes as opaque strings.
    // This is safer than 'hex' decoding which might produce empty buffers for invalid inputs.
    const computedBuffer = Buffer.from(computedHash);
    const storedBuffer = Buffer.from(storedHash);

    // timingSafeEqual requires buffers of the same length
    if (computedBuffer.length !== storedBuffer.length) {
      return false;
    }

    return timingSafeEqual(computedBuffer, storedBuffer);
  }
}
