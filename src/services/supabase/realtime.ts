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

export type MessageConversationSubscriptionContext = {
  bloodRequestId: string;
  donorMatchId: string;
};

export type MessagesSubscription = {
  stop: () => void;
};

const DEFAULT_MESSAGES_POLL_INTERVAL_MS = 30_000;

/**
 * Subscribes to message changes for a blood-request conversation.
 * Realtime respects RLS; polling refetches as a safe fallback.
 */
export const subscribeToMessages = (
  context: MessageConversationSubscriptionContext,
  onChange: SubscriptionHandler<unknown>,
  options?: { intervalMs?: number; onError?: SubscriptionHandler<Error> },
): MessagesSubscription => {
  const intervalMs = options?.intervalMs ?? DEFAULT_MESSAGES_POLL_INTERVAL_MS;

  const channel = supabase
    .channel(`messages:request:${context.bloodRequestId}:match:${context.donorMatchId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'messages',
        filter: `blood_request_id=eq.${context.bloodRequestId}`,
      },
      onChange,
    )
    .subscribe();

  const timer = setInterval(onChange, intervalMs);

  return {
    stop: () => {
      clearInterval(timer);
      supabase.removeChannel(channel);
    },
  };
};

export const unsubscribe = (channel: RealtimeChannel) =>
  supabase.removeChannel(channel);
