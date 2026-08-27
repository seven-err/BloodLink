import { useCallback, useEffect, useRef, useState } from 'react';
import { appCache } from '@/utils/appCache';

export type UseCachedDataOptions<T> = {
  key: string;
  fetcher: () => Promise<T>;
  ttlMs?: number;
  enabled?: boolean;
  initialData?: T;
  revalidateOnFocus?: boolean;
  onSuccess?: (data: T) => void;
  onError?: (error: Error) => void;
};

export type UseCachedDataResult<T> = {
  data: T | undefined;
  loading: boolean;
  refreshing: boolean;
  error: Error | null;
  refetch: (options?: { silent?: boolean }) => Promise<T | undefined>;
  setData: (updater: T | ((prev: T | undefined) => T)) => void;
  isStale: boolean;
};

export function useCachedData<T>({
  key,
  fetcher,
  ttlMs,
  enabled = true,
  initialData,
  onSuccess,
  onError,
}: UseCachedDataOptions<T>): UseCachedDataResult<T> {
  const cached = appCache.getSync<T>(key);
  const resolvedInitialData = cached ?? initialData;

  const [data, setDataState] = useState<T | undefined>(resolvedInitialData);
  // If we have cached data or initialData, we start with loading = false for instant 0ms rendering!
  const [loading, setLoading] = useState<boolean>(() => enabled && resolvedInitialData === undefined);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);

  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;

  const onSuccessRef = useRef(onSuccess);
  onSuccessRef.current = onSuccess;

  const onErrorRef = useRef(onError);
  onErrorRef.current = onError;

  const requestSeqRef = useRef(0);

  const executeFetch = useCallback(
    async (options?: { silent?: boolean }): Promise<T | undefined> => {
      if (!enabled) {
        return undefined;
      }

      const seq = ++requestSeqRef.current;

      if (options?.silent) {
        // Silent background revalidation - do not change loading or refreshing
      } else if (data !== undefined) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError(null);

      try {
        const freshData = await fetcherRef.current();

        if (seq !== requestSeqRef.current) {
          return undefined;
        }

        if (freshData !== undefined) {
          appCache.setSync(key, freshData, ttlMs);
          setDataState(freshData);
          onSuccessRef.current?.(freshData);
        }

        return freshData;
      } catch (err) {
        if (seq === requestSeqRef.current) {
          const resolvedError = err instanceof Error ? err : new Error(String(err));
          setError(resolvedError);
          onErrorRef.current?.(resolvedError);
        }
        return undefined;
      } finally {
        if (seq === requestSeqRef.current) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    },
    [enabled, data, key, ttlMs],
  );

  useEffect(() => {
    if (!enabled) {
      return;
    }

    // Check if we need to hydrate or re-read from cache
    const currentCached = appCache.getSync<T>(key);
    if (currentCached !== undefined && data === undefined) {
      setDataState(currentCached);
      setLoading(false);
    }

    // Background revalidate if stale or empty
    const fresh = appCache.isFresh(key);
    if (!fresh || currentCached === undefined) {
      void executeFetch({ silent: currentCached !== undefined });
    }
  }, [key, enabled, executeFetch, data]);

  const setData = useCallback(
    (updater: T | ((prev: T | undefined) => T)) => {
      setDataState((prev) => {
        const next = typeof updater === 'function' ? (updater as (prev: T | undefined) => T)(prev) : updater;
        if (next !== undefined) {
          appCache.setSync(key, next, ttlMs);
        }
        return next;
      });
    },
    [key, ttlMs],
  );

  return {
    data,
    loading,
    refreshing,
    error,
    refetch: executeFetch,
    setData,
    isStale: !appCache.isFresh(key),
  };
}
