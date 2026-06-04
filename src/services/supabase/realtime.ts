import type { RealtimeChannel } from '@supabase/supabase-js';

import { supabase } from './client';

type SubscriptionHandler<T> = (payload: T) => void;

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

export const subscribeToOpenBloodRequests = (
  onChange: SubscriptionHandler<unknown>,
): RealtimeChannel =>
  supabase
    .channel('blood_requests:open')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'blood_requests',
        filter: 'status=eq.open',
      },
      onChange,
    )
    .subscribe();

export const unsubscribe = (channel: RealtimeChannel) =>
  supabase.removeChannel(channel);
