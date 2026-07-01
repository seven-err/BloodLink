const CACHE_TTL_MS = 50 * 60 * 1000;

type CacheEntry = {
  expiresAt: number;
  url: string;
};

const avatarUrlCache = new Map<string, CacheEntry>();

export const getCachedAvatarUrl = (avatarPath: string) => {
  const entry = avatarUrlCache.get(avatarPath);

  if (!entry || entry.expiresAt <= Date.now()) {
    if (entry) {
      avatarUrlCache.delete(avatarPath);
    }

    return null;
  }

  return entry.url;
};

export const setCachedAvatarUrl = (avatarPath: string, url: string) => {
  avatarUrlCache.set(avatarPath, {
    expiresAt: Date.now() + CACHE_TTL_MS,
    url,
  });
};

export const clearCachedAvatarUrl = (avatarPath: string) => {
  avatarUrlCache.delete(avatarPath);
};
