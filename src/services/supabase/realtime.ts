import type { RealtimeChannel } from '@supabase/supabase-js';

import {
  getOpenBloodRequestsFeed,
  type OpenBloodRequestFeedItem,
} from './openBloodRequestsFeed';
import { supabase } from './client';

type SubscriptionHandler<T> = (payload: T) => void;

export type OpenBloodRequestsFeedSubscription = {
  stop: () => void;
};

export const subscribeToUserNotifications = (
  userId: string,
  onChange: SubscriptionHandler<unknown>,
): RealtimeChannel =>
  supabase
    .channel(`notifications:user:${userId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${userId}`,
      },
      onChange,
    )
    .subscribe();

export const subscribeToDonorMatches = (
  donorId: string,
  onChange: SubscriptionHandler<unknown>,
): RealtimeChannel =>
  supabase
    .channel(`donor_matches:donor:${donorId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'donor_matches',
        filter: `donor_id=eq.${donorId}`,
      },
      onChange,
    )
    .subscribe();

const DEFAULT_OPEN_FEED_POLL_INTERVAL_MS = 30_000;

/**
 * Polls open_blood_requests_feed for donor-facing open request updates.
 *
 * Supabase Realtime cannot subscribe to views, and blood_requests postgres_changes
 * are not visible to unmatched donors under RLS. Polling the safe feed view is the
 * supported refresh strategy.
 */
export const subscribeToOpenBloodRequests = (
  onChange: SubscriptionHandler<OpenBloodRequestFeedItem[]>,
  options?: { intervalMs?: number; onError?: SubscriptionHandler<Error> },
): OpenBloodRequestsFeedSubscription => {
  const intervalMs = options?.intervalMs ?? DEFAULT_OPEN_FEED_POLL_INTERVAL_MS;
  let active = true;

  const fetchAndNotify = async () => {
    const { data, error } = await getOpenBloodRequestsFeed();

    if (!active) {
      return;
    }

    if (error) {
      options?.onError?.(new Error(error.message));
      return;
    }

    onChange(data ?? []);
  };

  void fetchAndNotify();
  const timer = setInterval(() => {
    void fetchAndNotify();
  }, intervalMs);

  return {
    stop: () => {
      active = false;
      clearInterval(timer);
    },
  };
};

export const unsubscribe = (channel: RealtimeChannel) =>
  supabase.removeChannel(channel);
