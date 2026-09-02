/**
 * Isolate-local TTL cache. Works on Node and Cloudflare Workers
 * (per-isolate; not a global CDN cache). Swap the Map for KV later
 * without changing call sites.
 */
type Entry<T> = { value: T; exp: number };

const store = new Map<string, Entry<unknown>>();

export async function cached<T>(key: string, ttlMs: number, fn: () => Promise<T>): Promise<T> {
  const hit = store.get(key) as Entry<T> | undefined;
  if (hit && hit.exp > Date.now()) return hit.value;
  const value = await fn();
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
