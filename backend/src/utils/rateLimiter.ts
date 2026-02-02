
export class RateLimiter {
  private static readonly MAX_HITS = 10000;
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
    // Security: Enforce max size to prevent DoS (Memory exhaustion)
    if (this.hits.size >= RateLimiter.MAX_HITS) {
      // Evict oldest entry (FIFO) to maintain fixed memory footprint
      // This is O(1) and prevents the map from growing unbounded
      const oldestKey = this.hits.keys().next().value;
      if (oldestKey) {
        this.hits.delete(oldestKey);
      }
    }

    this.hits.set(key, { count: 1, expiresAt: now + windowMs });

    // Occasional cleanup to remove expired entries (1% chance)
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
