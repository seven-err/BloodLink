import type { Database } from '@/types/database';

import { supabase } from './client';

export type NotificationPreferences =
  Database['public']['Tables']['notification_preferences']['Row'];

export type NotificationPreferenceUpdates = {
  push_enabled?: boolean;
  emergency_alerts?: boolean;
  message_notifications?: boolean;
};

const DEFAULT_PREFERENCES = {
  push_enabled: true,
  emergency_alerts: true,
  message_notifications: true,
} as const;

export const getNotificationPreferences = async (userId: string) => {
  const existing = await supabase
    .from('notification_preferences')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  if (existing.error) {
    return existing;
  }

  if (existing.data) {
    return existing;
  }

  return supabase
    .from('notification_preferences')
    .upsert(
      {
        user_id: userId,
        ...DEFAULT_PREFERENCES,
      },
      { onConflict: 'user_id' },
    )
    .select('*')
    .single();
};

export const updateNotificationPreferences = (
  userId: string,
  updates: NotificationPreferenceUpdates,
) =>
  supabase
    .from('notification_preferences')
    .upsert(
      {
        user_id: userId,
        ...DEFAULT_PREFERENCES,
        ...updates,
      },
      { onConflict: 'user_id' },
    )
    .select('*')
    .single();

export type PushPlatform = 'ios' | 'android' | 'web';

export const upsertPushToken = (userId: string, token: string, platform: PushPlatform) =>
  supabase.from('push_tokens').upsert(
    {
      user_id: userId,
      token,
      platform,
    },
    { onConflict: 'token' },
  );

export const deletePushToken = (token: string) =>
  supabase.from('push_tokens').delete().eq('token', token);

export const deleteUserPushTokens = (userId: string) =>
  supabase.from('push_tokens').delete().eq('user_id', userId);
