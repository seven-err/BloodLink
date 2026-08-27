import { appCache } from '@/utils/appCache';
import { getOpenBloodRequestsFeed } from '@/services/supabase/openBloodRequestsFeed';
import { listNotifications } from '@/services/supabase/notifications';
import { listConversations } from '@/services/supabase/messages';
import { getMyBloodRequests } from '@/services/supabase/bloodRequests';
import { listDonorVerifiableItems } from '@/services/supabase/donations';
import { getNearbyMapDonors } from '@/services/supabase/nearbyMapDonors';
import type { Profile } from '@/services/supabase/profiles';

/**
 * Silently prefetches essential app data in the background
 * so subsequent tab and screen transitions happen instantaneously with 0ms delay.
 */
export async function prefetchAppData(profile: Profile, userId: string): Promise<void> {
  if (!userId) return;

  const tasks: Promise<unknown>[] = [];

  // 1. Prefetch open blood requests feed (needed by Donor Home & Request Feed)
  tasks.push(
    appCache.prefetch(
      'feed:open_requests',
      async () => {
        const { data } = await getOpenBloodRequestsFeed();
        return data ?? [];
      },
      2 * 60 * 1000,
    ),
  );

  // 2. Prefetch notifications
  tasks.push(
    appCache.prefetch(
      `notifications:${userId}`,
      async () => {
        const { data } = await listNotifications();
        return data ?? [];
      },
      2 * 60 * 1000,
    ),
  );

  // 3. Prefetch chat conversations
  tasks.push(
    appCache.prefetch(
      `conversations:${userId}`,
      async () => {
        const { data } = await listConversations(userId);
        return data ?? [];
      },
      2 * 60 * 1000,
    ),
  );

  // 4. Role-specific prefetching
  if (profile?.role === 'donor') {
    tasks.push(
      appCache.prefetch(
        `donor:my_donations:${userId}`,
        async () => {
          const { data } = await listDonorVerifiableItems(userId);
          return data ?? [];
        },
        5 * 60 * 1000,
      ),
    );
  } else if (profile?.role === 'recipient') {
    tasks.push(
      appCache.prefetch(
        `recipient:my_requests:${userId}`,
        async () => {
          const { data } = await getMyBloodRequests(userId);
          return data ?? [];
        },
        2 * 60 * 1000,
      ),
    );
  }

  // 5. If user has coordinates, prefetch nearby donors
  if (
    profile?.latitude != null &&
    profile?.longitude != null &&
    Number.isFinite(profile.latitude) &&
    Number.isFinite(profile.longitude)
  ) {
    const lat = profile.latitude;
    const lng = profile.longitude;

    tasks.push(
      appCache.prefetch(
        `nearby_donors:home:${lat.toFixed(3)}_${lng.toFixed(3)}`,
        async () => {
          const { data } = await getNearbyMapDonors({
            originLatitude: lat,
            originLongitude: lng,
            radiusKm: 5,
            maxResults: 3,
          });
          return data ?? [];
        },
        3 * 60 * 1000,
      ),
    );
  }

  try {
    await Promise.allSettled(tasks);
  } catch {
    // Non-blocking background prefetch
  }
}
