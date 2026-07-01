import type { Database } from '@/types/database';

import { supabase } from './client';

export type OpenBloodRequestFeedItem =
  Database['public']['Views']['open_blood_requests_feed']['Row'];

/** Safe columns exposed to unmatched donors via open_blood_requests_feed. */
const OPEN_BLOOD_REQUESTS_FEED_COLUMNS =
  'id,blood_type,units_needed,urgency,needed_at,hospital_name,address,latitude,longitude,created_at,updated_at' as const;

export const getOpenBloodRequestsFeed = () =>
  supabase
    .from('open_blood_requests_feed')
    .select(OPEN_BLOOD_REQUESTS_FEED_COLUMNS)
    .order('created_at', { ascending: false });

export const getOpenBloodRequestById = (requestId: string) =>
  supabase
    .from('open_blood_requests_feed')
    .select(OPEN_BLOOD_REQUESTS_FEED_COLUMNS)
    .eq('id', requestId)
    .maybeSingle();
