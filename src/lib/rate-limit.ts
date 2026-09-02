/**
 * In-memory sliding window. Portable (no Cloudflare Rate Limiting API).
 * Per-isolate; good enough to blunt brute-force and comment spam.
 */
type Bucket = { count: number; reset: number };

const buckets = new Map<string, Bucket>();

export function rateLimit(key: string, limit = 20, windowMs = 60_000) {
  const now = Date.now();
  const current = buckets.get(key);
  if (!current || current.reset < now) {
    buckets.set(key, { count: 1, reset: now + windowMs });
    return { ok: true, remaining: limit - 1 };
  }
  if (current.count >= limit) {
    return { ok: false, remaining: 0, retryAfter: Math.ceil((current.reset - now) / 1000) };
  }
  current.count += 1;
  return { ok: true, remaining: limit - current.count };
}

export function clientKey(request: Request, scope: string) {
  const forwarded = request.headers.get("cf-connecting-ip") || request.headers.get("x-forwarded-for") || "";
  const ip = forwarded.split(",")[0]?.trim() || "unknown";
  return `${scope}:${ip}`;
}
