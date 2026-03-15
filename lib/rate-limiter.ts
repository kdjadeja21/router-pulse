/**
 * Simple in-memory per-UID rate limiter for Next.js API routes.
 *
 * Works within a single server process (warm Lambda / Node.js instance).
 * For multi-instance deployments, replace with Redis (e.g. Upstash).
 *
 * Usage:
 *   const allowed = rateLimiter.check(uid, 10_000); // 10s minimum gap
 *   if (!allowed) return 429 response;
 */

interface RateLimitEntry {
  lastCallAt: number;
  cachedResult?: unknown;
}

class RateLimiter {
  private readonly store = new Map<string, RateLimitEntry>();

  /**
   * Returns true if the request is allowed (enough time has passed since last call).
   * Returns false if the caller should be rate-limited.
   */
  check(key: string, minGapMs: number): boolean {
    const now = Date.now();
    const entry = this.store.get(key);

    if (entry && now - entry.lastCallAt < minGapMs) {
      return false;
    }

    this.store.set(key, { lastCallAt: now });
    return true;
  }

  /**
   * Returns true if allowed, and also stores a result to serve as a cached response.
   * Use getCached() to retrieve the last cached result for rate-limited callers.
   */
  checkAndCache(key: string, minGapMs: number, result?: unknown): boolean {
    const now = Date.now();
    const entry = this.store.get(key);

    if (entry && now - entry.lastCallAt < minGapMs) {
      return false;
    }

    this.store.set(key, { lastCallAt: now, cachedResult: result });
    return true;
  }

  getCached(key: string): unknown | undefined {
    return this.store.get(key)?.cachedResult;
  }

  updateCache(key: string, result: unknown): void {
    const entry = this.store.get(key);
    if (entry) {
      entry.cachedResult = result;
    }
  }

  /** Prune entries older than maxAgeMs to prevent unbounded memory growth. */
  prune(maxAgeMs: number = 5 * 60 * 1000): void {
    const now = Date.now();
    for (const [key, entry] of this.store) {
      if (now - entry.lastCallAt > maxAgeMs) {
        this.store.delete(key);
      }
    }
  }
}

export const usageRateLimiter = new RateLimiter();

// Prune stale entries every 5 minutes to prevent memory leaks in long-lived processes
if (typeof setInterval !== "undefined") {
  setInterval(() => usageRateLimiter.prune(), 5 * 60 * 1000);
}
