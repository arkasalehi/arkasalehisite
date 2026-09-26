/**
 * Isolate-local TTL cache. Works on Node and Cloudflare Workers
 * (per-isolate; not a global CDN cache). Swap the Map for KV later
 * without changing call sites.
 */
type Entry<T> = { value: T; exp: number };

const MAX_KEYS = 50;
const store = new Map<string, Entry<unknown>>();

function evictExpired(now: number) {
  for (const [key, entry] of store) {
    if (entry.exp <= now) store.delete(key);
  }
}

function evictOldest() {
  const first = store.keys().next().value;
  if (first !== undefined) store.delete(first);
}

export async function cached<T>(key: string, ttlMs: number, fn: () => Promise<T>): Promise<T> {
  const now = Date.now();
  if (store.size > MAX_KEYS) evictExpired(now);
  const hit = store.get(key) as Entry<T> | undefined;
  if (hit && hit.exp > now) return hit.value;
  const value = await fn();
  if (store.size >= MAX_KEYS) {
    evictExpired(Date.now());
    if (store.size >= MAX_KEYS) evictOldest();
  }
  store.set(key, { value, exp: Date.now() + ttlMs });
  return value;
}

export function invalidateCache(prefix?: string) {
  if (!prefix) {
    store.clear();
    return;
  }
  for (const key of store.keys()) {
    if (key.startsWith(prefix)) store.delete(key);
  }
}
