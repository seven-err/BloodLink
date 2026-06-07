import type { Database } from '@/types/database';

import { supabase } from './client';

export type AppNotification = Database['public']['Tables']['notifications']['Row'];

export const listNotifications = () =>
  supabase.from('notifications').select('*').order('created_at', { ascending: false });

export const markNotificationRead = (id: string) =>
  supabase
    .from('notifications')
    .update({ read_at: new Date().toISOString() })
    .eq('id', id)
    .is('read_at', null);

export const markAllNotificationsRead = () =>
  supabase
    .from('notifications')
    .update({ read_at: new Date().toISOString() })
    .is('read_at', null);
