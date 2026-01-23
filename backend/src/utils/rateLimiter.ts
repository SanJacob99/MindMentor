
export class RateLimiter {
  private hits = new Map<string, { count: number; expiresAt: number }>();

  /**
   * Checks if a key is within the rate limit.
   * @param key Unique identifier (e.g., IP address)
   * @param limit Max requests allowed in the window
   * @param windowMs Time window in milliseconds
   * @returns true if allowed, false if limit exceeded
   */
  check(key: string, limit: number, windowMs: number): boolean {
    const now = Date.now();
    const record = this.hits.get(key);

    if (record) {
      // If window expired, reset
      if (now > record.expiresAt) {
        this.hits.set(key, { count: 1, expiresAt: now + windowMs });
        return true;
      }

      // Check limit
      if (record.count >= limit) {
        return false;
      }

      record.count++;
      return true;
    }

    // New record
    this.hits.set(key, { count: 1, expiresAt: now + windowMs });

    // Occasional cleanup to prevent memory leaks (1% chance on new entries)
    if (Math.random() < 0.01) {
      this.cleanup(now);
    }

    return true;
  }

  private cleanup(now: number) {
    for (const [k, v] of this.hits.entries()) {
      if (now > v.expiresAt) {
        this.hits.delete(k);
      }
    }
  }
}
