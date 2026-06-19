/**
 * Best-effort in-memory rate limiter.
 *
 * NOTE: state lives in the Node process, so in a serverless / multi-instance
 * deployment this only limits per-instance. It is a soft anti-abuse layer for
 * public endpoints (resident lookup, voting) — the real guarantees come from
 * the DB checks in those handlers. Good enough for a boutique building.
 */
interface Hit {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, Hit>();

/**
 * Returns { allowed, remaining, retryAfter }.
 * @param key    unique bucket key (e.g. `vote:${ipHash}`)
 * @param limit  max hits per window
 * @param windowMs window length in ms
 */
export function rateLimit(key: string, limit: number, windowMs: number) {
  const now = Date.now();
  const hit = buckets.get(key);

  if (!hit || now >= hit.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: limit - 1, retryAfter: 0 };
  }

  hit.count += 1;
  if (hit.count > limit) {
    return { allowed: false, remaining: 0, retryAfter: Math.ceil((hit.resetAt - now) / 1000) };
  }
  return { allowed: true, remaining: limit - hit.count, retryAfter: 0 };
}

// Opportunistic cleanup so the Map doesn't grow unbounded on long-lived instances.
export function sweepRateLimitBuckets() {
  const now = Date.now();
  for (const [key, hit] of buckets) {
    if (now >= hit.resetAt) buckets.delete(key);
  }
}
