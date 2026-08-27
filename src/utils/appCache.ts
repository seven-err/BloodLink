import AsyncStorage from '@react-native-async-storage/async-storage';

type CacheEntry<T> = {
  data: T;
  timestamp: number;
  ttlMs: number;
};

const CACHE_STORAGE_PREFIX = 'bloodlink_app_cache:';
const DEFAULT_TTL_MS = 5 * 60 * 1000; // 5 minutes default TTL for background freshness

class AppCache {
  private memoryCache = new Map<string, CacheEntry<unknown>>();
  private hydrated = false;
  private hydrationPromise: Promise<void> | null = null;
  private pendingPersistTimeouts = new Map<string, ReturnType<typeof setTimeout>>();

  constructor() {
    void this.hydrate();
  }

  /**
   * Hydrates in-memory cache from persistent AsyncStorage on startup.
   */
  public async hydrate(): Promise<void> {
    if (this.hydrated) {
      return;
    }

    if (this.hydrationPromise) {
      return this.hydrationPromise;
    }

    this.hydrationPromise = (async () => {
      try {
        const allKeys = await AsyncStorage.getAllKeys();
        const cacheKeys = allKeys.filter((k) => k.startsWith(CACHE_STORAGE_PREFIX));

        if (cacheKeys.length === 0) {
          this.hydrated = true;
          return;
        }

        const keyPairs = await AsyncStorage.multiGet(cacheKeys);

        for (const [storageKey, rawValue] of keyPairs) {
          if (!rawValue) continue;
          try {
            const entry = JSON.parse(rawValue) as CacheEntry<unknown>;
            const cacheKey = storageKey.slice(CACHE_STORAGE_PREFIX.length);

            // Retain entries in memory so screens can display stale data immediately
            // Stale entries will trigger a background revalidation when accessed.
            if (entry && typeof entry === 'object' && 'data' in entry) {
              this.memoryCache.set(cacheKey, entry);
            }
          } catch {
            // Ignore malformed cache entry
          }
        }
      } catch (err) {
        console.warn('AppCache hydration error:', err);
      } finally {
        this.hydrated = true;
      }
    })();

    return this.hydrationPromise;
  }

  /**
   * Synchronously retrieves cached data for 0ms instant render.
   */
  public getSync<T>(key: string): T | undefined {
    const entry = this.memoryCache.get(key) as CacheEntry<T> | undefined;
    if (!entry) {
      return undefined;
    }

    return entry.data;
  }

  /**
   * Checks if data is fresh according to its TTL.
   */
  public isFresh(key: string): boolean {
    const entry = this.memoryCache.get(key);
    if (!entry) {
      return false;
    }

    return Date.now() - entry.timestamp < entry.ttlMs;
  }

  /**
   * Checks if cache contains any data (fresh or stale) for instant rendering.
   */
  public has(key: string): boolean {
    return this.memoryCache.has(key);
  }

  /**
   * Synchronously saves data into memory cache and asynchronously schedules persistence to disk.
   */
  public setSync<T>(key: string, data: T, ttlMs: number = DEFAULT_TTL_MS): void {
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      ttlMs,
    };

    this.memoryCache.set(key, entry as CacheEntry<unknown>);

    // Debounce disk write to avoid blocking UI during rapid updates
    const existingTimeout = this.pendingPersistTimeouts.get(key);
    if (existingTimeout) {
      clearTimeout(existingTimeout);
    }

    const timeout = setTimeout(() => {
      this.pendingPersistTimeouts.delete(key);
      void AsyncStorage.setItem(
        `${CACHE_STORAGE_PREFIX}${key}`,
        JSON.stringify(entry),
      ).catch((err) => console.warn(`Failed to persist cache key ${key}:`, err));
    }, 150);

    this.pendingPersistTimeouts.set(key, timeout);
  }

  /**
   * Invalidates a specific key or keys starting with prefix.
   */
  public invalidate(prefixOrKey: string): void {
    const keysToRemove: string[] = [];

    for (const key of this.memoryCache.keys()) {
      if (key === prefixOrKey || key.startsWith(prefixOrKey)) {
        keysToRemove.push(key);
      }
    }

    for (const key of keysToRemove) {
      this.memoryCache.delete(key);
      const storageKey = `${CACHE_STORAGE_PREFIX}${key}`;
      void AsyncStorage.removeItem(storageKey).catch(() => {});
    }
  }

  /**
   * Prefetches data in background if not already fresh.
   */
  public async prefetch<T>(
    key: string,
    fetcher: () => Promise<T>,
    ttlMs: number = DEFAULT_TTL_MS,
  ): Promise<T | undefined> {
    if (this.isFresh(key)) {
      return this.getSync<T>(key);
    }

    try {
      const data = await fetcher();
      if (data !== undefined && data !== null) {
        this.setSync(key, data, ttlMs);
      }
      return data;
    } catch {
      return this.getSync<T>(key);
    }
  }

  /**
   * Clears all cached memory and storage entries.
   */
  public async clear(): Promise<void> {
    this.memoryCache.clear();
    try {
      const allKeys = await AsyncStorage.getAllKeys();
      const cacheKeys = allKeys.filter((k) => k.startsWith(CACHE_STORAGE_PREFIX));
      if (cacheKeys.length > 0) {
        await AsyncStorage.multiRemove(cacheKeys);
      }
    } catch {
      // Ignore
    }
  }
}

export const appCache = new AppCache();
