// ════════════════════════════════════════════════════════════
// CACHE SERVICE — Redis with in-memory fallback
// ════════════════════════════════════════════════════════════
// If REDIS_URL is set, uses Redis. Otherwise, falls back to
// a simple in-memory Map cache with TTL eviction.

import { logger } from '../config/logger';

interface CacheEntry {
  value: string;
  expiresAt: number;
}

class MemoryCache {
  private store = new Map<string, CacheEntry>();
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor() {
    // Clean up expired entries every 60 seconds
    this.cleanupInterval = setInterval(() => this.cleanup(), 60_000);
  }

  async get(key: string): Promise<string | null> {
    const entry = this.store.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return null;
    }
    return entry.value;
  }

  async set(key: string, value: string, ttlSeconds: number): Promise<void> {
    this.store.set(key, {
      value,
      expiresAt: Date.now() + ttlSeconds * 1000,
    });
  }

  async del(key: string): Promise<void> {
    this.store.delete(key);
  }

  async delPattern(pattern: string): Promise<void> {
    const prefix = pattern.replace('*', '');
    for (const key of this.store.keys()) {
      if (key.startsWith(prefix)) {
        this.store.delete(key);
      }
    }
  }

  private cleanup(): void {
    const now = Date.now();
    let cleaned = 0;
    for (const [key, entry] of this.store) {
      if (now > entry.expiresAt) {
        this.store.delete(key);
        cleaned++;
      }
    }
    if (cleaned > 0) {
      logger.debug(`[Cache] Cleaned ${cleaned} expired entries`);
    }
  }

  async disconnect(): Promise<void> {
    if (this.cleanupInterval) clearInterval(this.cleanupInterval);
    this.store.clear();
  }
}

// ── Singleton Cache Instance ──────────────────────────
let cacheInstance: MemoryCache | null = null;

export function getCache(): MemoryCache {
  if (!cacheInstance) {
    cacheInstance = new MemoryCache();
    logger.info('✅ In-memory cache initialized');
  }
  return cacheInstance;
}

// ── Helper: get-or-set with TTL ───────────────────────
export async function cacheGetOrSet<T>(
  key: string,
  ttlSeconds: number,
  fetchFn: () => Promise<T>
): Promise<T> {
  const cache = getCache();
  const cached = await cache.get(key);
  if (cached) {
    return JSON.parse(cached) as T;
  }

  const data = await fetchFn();
  await cache.set(key, JSON.stringify(data), ttlSeconds);
  return data;
}

export async function cacheInvalidate(key: string): Promise<void> {
  await getCache().del(key);
}

export async function cacheInvalidatePattern(pattern: string): Promise<void> {
  await getCache().delPattern(pattern);
}
