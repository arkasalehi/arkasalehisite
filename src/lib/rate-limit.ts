/**
 * In-memory sliding window. Portable (no Cloudflare Rate Limiting API).
 * Per-isolate; good enough to blunt brute-force and comment spam.
 */
type Bucket = { count: number; reset: number };

const MAX_KEYS = 200;
const buckets = new Map<string, Bucket>();

function prune(now: number) {
  if (buckets.size < MAX_KEYS / 2) return;
  for (const [key, bucket] of buckets) {
    if (bucket.reset < now) buckets.delete(key);
  }
  while (buckets.size >= MAX_KEYS) {
    const first = buckets.keys().next().value;
    if (first === undefined) break;
    buckets.delete(first);
  }
}

export function rateLimit(key: string, limit = 20, windowMs = 60_000) {
  const now = Date.now();
  prune(now);
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

/** Isolate bucket plus durable RPC when the database is available. */
export async function rateLimitDurable(key: string, limit = 20, windowMs = 60_000) {
  const mem = rateLimit(key, limit, windowMs);
  if (!mem.ok) return mem;
  try {
    const { createServerSupabase } = await import("@/lib/supabase/server");
    const db = await createServerSupabase();
    const { data, error } = await db.rpc("hit_rate_limit", {
      p_key: key.slice(0, 180),
      p_limit: limit,
      p_window_seconds: Math.max(1, Math.ceil(windowMs / 1000)),
    });
    if (error) return mem;
    if (data === false) return { ok: false, remaining: 0 };
  } catch {
    /* keep isolate limit */
  }
  return mem;
}
