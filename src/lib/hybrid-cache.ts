const CACHE_TTL_MS = 15 * 60 * 1000;

type CacheValue<T> = {
  value: T;
  expiresAt: number;
};

const memoryCache = new Map<string, CacheValue<unknown>>();

export function getHybridCache<T>(key: string): T | null {
  const hit = memoryCache.get(key);
  if (!hit) return null;
  if (Date.now() > hit.expiresAt) {
    memoryCache.delete(key);
    return null;
  }
  return hit.value as T;
}

export function setHybridCache<T>(key: string, value: T) {
  memoryCache.set(key, {
    value,
    expiresAt: Date.now() + CACHE_TTL_MS,
  });
}
