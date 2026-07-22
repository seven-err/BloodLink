import { useFocusEffect } from '@react-navigation/native';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { CompositeScreenProps } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useCallback, useMemo, useRef, useState } from 'react';
import { Bell, Clock, Droplet, Users } from 'lucide-react-native';
import { Pressable, RefreshControl, ScrollView, Switch, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BloodTypeBadge } from '@/components/bloodRequest/BloodTypeBadge';
import { DonorStatCard } from '@/components/donor/DonorStatCard';
import { UrgentRequestCard } from '@/components/donor/UrgentRequestCard';
import { ModeToggle } from '@/components/common/ModeToggle';
import { PrimaryButton } from '@/components/common/PrimaryButton';
import { Skeleton } from '@/components/common/Skeleton';
import { HemieFloatingButton } from '@/components/hemie/HemieFloatingButton';
import { colors } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import type { AppTabParamList } from '@/navigation/AppTabNavigator';
import type { AppStackParamList } from '@/navigation/types';
import { donorHomeStyles } from '@/screens/donor/donorHomeStyles';
import { listDonorVerifiableItems } from '@/services/supabase/donations';
import { listNotifications } from '@/services/supabase/notifications';
import {
  getOpenBloodRequestsFeed,
  type OpenBloodRequestFeedItem,
} from '@/services/supabase/openBloodRequestsFeed';
import {
  isDonorVerificationActive,
  setDonorAvailability,
} from '@/services/supabase/profiles';
import { canDonorEnableAvailability } from '@/utils/donorAvailability';
import { getBloodTypeCompatibilityLabel } from '@/utils/bloodTypeCompatibility';
import { haversineDistanceMeters } from '@/utils/coordinates';
import { countDonationsThisYear, getDaysUntilNextEligible } from '@/utils/donorDonationStats';
import { formatRelativeTime } from '@/utils/relativeTime';
import { sanitizeProfileError } from '@/utils/profileErrors';

type Props = CompositeScreenProps<
  BottomTabScreenProps<AppTabParamList, 'Home'>,
  NativeStackScreenProps<AppStackParamList>
>;

const URGENCY_PRIORITY = {
  critical: 0,
  urgent: 1,
  normal: 2,
} as const;

const getFirstName = (fullName: string | null | undefined) => {
  const trimmed = fullName?.trim();
  if (!trimmed) {
    return null;
  }

  return trimmed.split(/\s+/)[0];
};

function DonorHomeSkeleton({ topInset }: { topInset: number }) {
  return (
    <View style={donorHomeStyles.screen}>
      <View style={[donorHomeStyles.header, { paddingTop: topInset + 8 }]}>
        <View style={donorHomeStyles.headerRow}>
          <View style={{ flex: 1, gap: 8 }}>
            <Skeleton height={28} width="70%" />
            <Skeleton height={16} width="40%" />
          </View>
          <Skeleton borderRadius={999} height={40} width={40} />
        </View>
        <Skeleton borderRadius={999} height={42} style={donorHomeStyles.modeToggleRow} width="100%" />
      </View>
      <View style={[donorHomeStyles.scrollContent, { paddingTop: 24 }]}>
        <Skeleton borderRadius={16} height={76} width="100%" />
        <Skeleton borderRadius={16} height={120} width="100%" />
        <View style={donorHomeStyles.statRow}>
          <Skeleton borderRadius={16} height={120} style={{ flex: 1 }} />
          <Skeleton borderRadius={16} height={120} style={{ flex: 1 }} />
        </View>
        <Skeleton borderRadius={16} height={24} width="60%" />
        <Skeleton borderRadius={16} height={150} width="100%" />
        <Skeleton borderRadius={16} height={150} width="100%" />
      </View>
    </View>
  );
}

export function DonorHomeScreen({ navigation }: Props) {
  const { top: topInset } = useSafeAreaInsets();
  const { profile, refreshProfile, session } = useAuth();
  const [initialLoading, setInitialLoading] = useState(true);
  const hasLoadedOnceRef = useRef(false);
  const [requests, setRequests] = useState<OpenBloodRequestFeedItem[]>([]);
  const [totalDonations, setTotalDonations] = useState(0);
  const [donationsThisYear, setDonationsThisYear] = useState(0);
  const [hasUnreadNotifications, setHasUnreadNotifications] = useState(false);
  const [verificationActive, setVerificationActive] = useState(false);
  const [availabilityLoading, setAvailabilityLoading] = useState(false);
  const [availabilityError, setAvailabilityError] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [availabilityOverride, setAvailabilityOverride] = useState<boolean | null>(null);

  const firstName = getFirstName(profile?.full_name);
  const canEnableAvailability = canDonorEnableAvailability(profile, verificationActive);
  const isAvailable = availabilityOverride ?? profile?.is_available ?? false;
  const daysUntilEligible = getDaysUntilNextEligible(profile?.last_donation_at);

  const urgentRequests = useMemo(() => {
    const donorCoordinates =
      profile?.latitude != null &&
      profile?.longitude != null &&
      Number.isFinite(profile.latitude) &&
      Number.isFinite(profile.longitude)
        ? { latitude: profile.latitude, longitude: profile.longitude }
        : null;

    return [...requests]
      .sort((left, right) => {
        const urgencyDiff = URGENCY_PRIORITY[left.urgency] - URGENCY_PRIORITY[right.urgency];
        if (urgencyDiff !== 0) {
          return urgencyDiff;
        }

        return new Date(right.created_at).getTime() - new Date(left.created_at).getTime();
      })
      .slice(0, 3)
      .map((request) => {
        const distanceMeters =
          donorCoordinates &&
          request.latitude != null &&
          request.longitude != null
            ? haversineDistanceMeters(donorCoordinates, {
                latitude: request.latitude,
                longitude: request.longitude,
              })
            : null;

        const distanceLabel =
          distanceMeters == null
            ? 'Nearby'
            : distanceMeters < 1000
              ? `${Math.round(distanceMeters)} m`
              : `${(distanceMeters / 1000).toFixed(1)} km`;

        return {
          ...request,
          distanceLabel,
          timeLabel: formatRelativeTime(request.created_at),
          title: `${request.blood_type} blood request`,
        };
      });
  }, [profile?.latitude, profile?.longitude, requests]);

  const loadHomeData = useCallback(async (isRefresh = false) => {
    if (!session?.user.id) {
      setInitialLoading(false);
      return;
    }

    if (isRefresh) {
      setRefreshing(true);
    } else if (!hasLoadedOnceRef.current) {
      setInitialLoading(true);
    }

    setLoadError(null);

    try {
      const [
        requestsResult,
        donationsResult,
        notificationsResult,
        verificationResult,
      ] = await Promise.all([
        getOpenBloodRequestsFeed(),
        listDonorVerifiableItems(session.user.id),
        listNotifications(),
        isDonorVerificationActive(session.user.id),
      ]);

      if (requestsResult.error) {
        throw requestsResult.error;
      }

      if (donationsResult.error) {
        throw donationsResult.error;
      }

      if (notificationsResult.error) {
        throw notificationsResult.error;
      }

      if (verificationResult.error) {
        throw verificationResult.error;
      }

      setRequests(requestsResult.data ?? []);
      setVerificationActive(Boolean(verificationResult.data));

      const completedDonations = (donationsResult.data ?? []).filter(
        (item) => item.donationStatus === 'completed' || item.matchStatus === 'completed',
      );
      setTotalDonations(completedDonations.length);
      setDonationsThisYear(
        countDonationsThisYear(
          completedDonations
            .map((item) => item.completedAt ?? item.createdAt)
            .filter((value): value is string => Boolean(value)),
        ),
      );

      setHasUnreadNotifications(
        (notificationsResult.data ?? []).some((notification) => notification.read_at === null),
      );
    } catch (error) {
      setLoadError(sanitizeProfileError(error, 'Unable to load donor home data.'));
    } finally {
      setInitialLoading(false);
      setRefreshing(false);
      hasLoadedOnceRef.current = true;
    }
  }, [session?.user.id]);

  useFocusEffect(
    useCallback(() => {
      void loadHomeData();
    }, [loadHomeData]),
  );

  const handleAvailabilityToggle = async (nextValue: boolean) => {
    if (!session?.user.id || availabilityLoading) {
      return;
    }

    if (nextValue && !canEnableAvailability) {
      setAvailabilityError(
        'Complete your donor profile (blood type, birthdate, and weight) before turning on availability.',
      );
      setAvailabilityOverride(null);
      return;
    }

    setAvailabilityLoading(true);
    setAvailabilityError(null);
    setAvailabilityOverride(nextValue);

    try {
      const { error: updateError } = await setDonorAvailability(session.user.id, nextValue);

      if (updateError) {
        throw updateError;
      }

      await refreshProfile();
      setAvailabilityOverride(null);
    } catch (toggleError) {
      setAvailabilityOverride(null);
      setAvailabilityError(
        sanitizeProfileError(toggleError, 'Unable to update availability. Please try again.'),
      );
    } finally {
      setAvailabilityLoading(false);
    }
  };

  if (initialLoading && !hasLoadedOnceRef.current) {
    return <DonorHomeSkeleton topInset={topInset} />;
  }

  return (
    <View style={donorHomeStyles.screen}>
      <View style={[donorHomeStyles.header, { paddingTop: topInset + 8 }]}>
        <View style={donorHomeStyles.headerRow}>
          <View>
            <Text style={donorHomeStyles.greeting}>
              {firstName ? `Hello, ${firstName}` : 'Hello'}
            </Text>
            <Text style={donorHomeStyles.roleLabel}>Donor</Text>
          </View>
          <Pressable
            accessibilityLabel="Open notifications"
            accessibilityRole="button"
            style={donorHomeStyles.iconButton}
            onPress={() => navigation.getParent()?.navigate('Notifications')}
          >
            <Bell color={colors.foreground} size={20} />
            {hasUnreadNotifications ? <View style={donorHomeStyles.notificationDot} /> : null}
          </Pressable>
        </View>
        <View style={donorHomeStyles.modeToggleRow}>
          <ModeToggle showHint />
        </View>
      </View>

      <ScrollView
        contentContainerStyle={donorHomeStyles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => void loadHomeData(true)} />
        }
      >
        <View style={donorHomeStyles.availabilityCard}>
          <View style={donorHomeStyles.availabilityIcon}>
            <Droplet color={colors.mutedLight} size={22} />
          </View>
          <View style={donorHomeStyles.availabilityCopy}>
            <Text style={donorHomeStyles.availabilityTitle}>Donation Availability</Text>
            <Text style={donorHomeStyles.availabilityStatus}>
              {isAvailable ? 'Available' : 'Unavailable'}
            </Text>
          </View>
          <Switch
            accessibilityLabel="Donation availability"
            accessibilityState={{ checked: isAvailable, disabled: availabilityLoading }}
            disabled={availabilityLoading}
            thumbColor={colors.primaryForeground}
            trackColor={{ false: colors.border, true: colors.primary }}
            value={isAvailable}
            onValueChange={(value) => {
              void handleAvailabilityToggle(value);
            }}
          />
        </View>
        {!canEnableAvailability && !isAvailable ? (
          <Text style={donorHomeStyles.availabilityHint}>
            Complete your donor profile to enable donation availability.
          </Text>
        ) : null}
        {availabilityError ? (
          <Text style={donorHomeStyles.availabilityError}>{availabilityError}</Text>
        ) : null}
        {loadError ? (
          <View style={donorHomeStyles.loadErrorCard}>
            <Text style={donorHomeStyles.availabilityError}>{loadError}</Text>
            <PrimaryButton title="Try again" onPress={() => void loadHomeData()} />
          </View>
        ) : null}

        {profile?.blood_type ? (
          <View style={donorHomeStyles.bloodTypeCard}>
            <Text style={donorHomeStyles.bloodTypeLabel}>Your Blood Type</Text>
            <View style={donorHomeStyles.bloodTypeRow}>
              <BloodTypeBadge bloodType={profile.blood_type} size="lg" />
              <View style={{ flex: 1, gap: 4 }}>
                <Text style={donorHomeStyles.bloodTypeLabel}>Compatible with</Text>
                <Text style={donorHomeStyles.bloodTypeMeta}>
                  {getBloodTypeCompatibilityLabel(profile.blood_type)}
                </Text>
              </View>
            </View>
            <View style={donorHomeStyles.bloodTypeFooter}>
              <View />
              <Pressable
                accessibilityLabel="View profile details"
                accessibilityRole="button"
                onPress={() => navigation.navigate('AppProfile')}
              >
                <Text style={donorHomeStyles.linkText}>View Details</Text>
              </Pressable>
            </View>
          </View>
        ) : null}

        <View style={donorHomeStyles.statRow}>
          <DonorStatCard
            icon={<Users color={colors.primary} size={20} />}
            label="Total Donations"
            subtext={donationsThisYear > 0 ? `+${donationsThisYear} this year` : 'No donations yet'}
            subtextColor={donationsThisYear > 0 ? colors.success : colors.mutedLight}
            value={String(totalDonations)}
          />
          <DonorStatCard
            icon={<Clock color={colors.primary} size={20} />}
            label="Next Eligible"
            subtext="days remaining"
            value={daysUntilEligible == null ? '—' : String(daysUntilEligible)}
          />
        </View>

        <View style={donorHomeStyles.sectionHeader}>
          <Text style={donorHomeStyles.sectionTitle}>Urgent Requests Nearby</Text>
          <Pressable
            accessibilityLabel="View all blood requests"
            accessibilityRole="button"
            style={donorHomeStyles.viewAllButton}
            onPress={() => navigation.navigate('Requests')}
          >
            <Text style={donorHomeStyles.linkText}>View All</Text>
          </Pressable>
        </View>

        <View style={donorHomeStyles.urgentList}>
          {urgentRequests.length === 0 ? (
            <View style={donorHomeStyles.bloodTypeCard}>
              <Text style={donorHomeStyles.bloodTypeMeta}>
                No urgent requests nearby right now. Pull down to refresh or browse all open
                requests.
              </Text>
            </View>
          ) : (
            urgentRequests.map((request) => (
              <UrgentRequestCard
                key={request.id}
                bloodType={request.blood_type}
                distanceLabel={request.distanceLabel}
                timeLabel={request.timeLabel}
                title={request.title}
                urgency={request.urgency}
                onPress={() =>
                  navigation
                    .getParent()
                    ?.navigate('DonorRequestDetail', { requestId: request.id })
                }
              />
            ))
          )}
        </View>
      </ScrollView>

      <HemieFloatingButton onPress={() => navigation.getParent()?.navigate('HemieAI')} />
    </View>
  );
}
