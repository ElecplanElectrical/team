const cache = new Map();

export async function withCache(key, ttlMs, loader) {
  const now = Date.now();
  const existing = cache.get(key);
  if (existing && existing.expiresAt > now) return existing.value;
  const value = await loader();
  cache.set(key, { value, expiresAt: now + ttlMs });
  return value;
}

export function clearCache(prefix = '') {
  for (const key of cache.keys()) {
    if (!prefix || key.startsWith(prefix)) cache.delete(key);
  }
}

export function cacheStatus() {
  const now = Date.now();
  return [...cache.entries()].map(([key, entry]) => ({ key, expiresInMs: Math.max(0, entry.expiresAt - now) }));
}
