import { useFocusEffect } from '@react-navigation/native';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { CompositeScreenProps } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AlertCircle, Bell, Clock, Plus, Users } from 'lucide-react-native';
import { useCallback, useMemo, useRef, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BloodTypeBadge } from '@/components/bloodRequest/BloodTypeBadge';
import { DonorStatCard } from '@/components/donor/DonorStatCard';
import { NearbyDonorFeedCard } from '@/components/recipient/NearbyDonorFeedCard';
import { Skeleton } from '@/components/common/Skeleton';
import { colors } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { useForegroundLocation } from '@/hooks/useForegroundLocation';
import type { RecipientTabParamList } from '@/navigation/RecipientTabNavigator';
import type { AppStackParamList } from '@/navigation/types';
import { recipientHomeStyles } from '@/screens/recipient/recipientHomeStyles';
import { getMyBloodRequests } from '@/services/supabase/bloodRequests';
import { listNotifications } from '@/services/supabase/notifications';
import {
  getNearbyMapDonors,
  type NearbyMapDonorItem,
} from '@/services/supabase/nearbyMapDonors';
import {
  getRecipientCanReceiveFromLabel,
  isDonorCompatibleWithRecipient,
} from '@/utils/bloodTypeCompatibility';
import { formatLastDonationLabel } from '@/utils/donorMapDisplay';
import { sanitizeProfileError } from '@/utils/profileErrors';

type Props = CompositeScreenProps<
  BottomTabScreenProps<RecipientTabParamList, 'RecipientHome'>,
  NativeStackScreenProps<AppStackParamList>
>;

const ACTIVE_REQUEST_STATUSES = new Set(['open', 'matched']);
const NEARBY_RADIUS_KM = 5;
const NEARBY_DONOR_PREVIEW_COUNT = 3;

const getFirstName = (fullName: string | null | undefined) => {
  const trimmed = fullName?.trim();
  if (!trimmed) {
    return null;
  }

  return trimmed.split(/\s+/)[0];
};

const getOriginCoordinates = (
  gpsCoordinates: { latitude: number; longitude: number } | null,
  profileLatitude: number | null | undefined,
  profileLongitude: number | null | undefined,
) => {
  if (gpsCoordinates) {
    return gpsCoordinates;
  }

  if (
    profileLatitude != null &&
    profileLongitude != null &&
    Number.isFinite(profileLatitude) &&
    Number.isFinite(profileLongitude)
  ) {
    return {
      latitude: profileLatitude,
      longitude: profileLongitude,
    };
  }

  return null;
};

const formatDistanceLabel = (distanceMeters: number) => {
  if (distanceMeters < 1000) {
    return `${Math.round(distanceMeters)} m`;
  }

  return `${(distanceMeters / 1000).toFixed(1)} km`;
};

function RecipientHomeSkeleton({ topInset }: { topInset: number }) {
  return (
    <View style={recipientHomeStyles.screen}>
      <View style={[recipientHomeStyles.header, { paddingTop: topInset + 8 }]}>
        <Skeleton height={28} width="55%" />
        <Skeleton height={16} style={{ marginTop: 8 }} width="30%" />
      </View>
      <View style={[recipientHomeStyles.scrollContent, { paddingTop: 24 }]}>
        <Skeleton borderRadius={16} height={160} width="100%" />
        <Skeleton borderRadius={16} height={120} width="100%" />
        <View style={recipientHomeStyles.statRow}>
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

export function RecipientHomeScreen({ navigation }: Props) {
  const { top: topInset } = useSafeAreaInsets();
  const { profile, session } = useAuth();
  const [initialLoading, setInitialLoading] = useState(true);
  const hasLoadedOnceRef = useRef(false);
  const [activeRequestCount, setActiveRequestCount] = useState(0);
  const [nearbyDonors, setNearbyDonors] = useState<NearbyMapDonorItem[]>([]);
  const [hasUnreadNotifications, setHasUnreadNotifications] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const { coordinates: gpsCoordinates } = useForegroundLocation();

  const firstName = getFirstName(profile?.full_name);

  const originCoordinates = useMemo(
    () => getOriginCoordinates(gpsCoordinates, profile?.latitude, profile?.longitude),
    [gpsCoordinates, profile?.latitude, profile?.longitude],
  );

  const nearbyDonorPreview = useMemo(() => {
    const compatibleDonors = nearbyDonors.filter((donor) => {
      if (!profile?.blood_type) {
        return true;
      }

      return isDonorCompatibleWithRecipient(donor.bloodType, profile.blood_type);
    });

    return [...compatibleDonors]
      .sort((left, right) => {
        if (left.isAvailable !== right.isAvailable) {
          return left.isAvailable ? -1 : 1;
        }

        return left.distanceMeters - right.distanceMeters;
      })
      .slice(0, NEARBY_DONOR_PREVIEW_COUNT)
      .map((donor) => ({
        ...donor,
        distanceLabel: formatDistanceLabel(donor.distanceMeters),
        timeLabel: formatLastDonationLabel(donor.lastDonationAt).replace('Last donation: ', ''),
      }));
  }, [nearbyDonors, profile?.blood_type]);

  const loadHomeData = useCallback(async () => {
    if (!session?.user.id) {
      setInitialLoading(false);
      return;
    }

    if (!hasLoadedOnceRef.current) {
      setInitialLoading(true);
    }

    setLoadError(null);

    try {
      const [requestsResult, notificationsResult] = await Promise.all([
        getMyBloodRequests(session.user.id),
        listNotifications(),
      ]);

      if (requestsResult.error) {
        throw requestsResult.error;
      }

      if (notificationsResult.error) {
        throw notificationsResult.error;
      }

      const requests = requestsResult.data ?? [];
      setActiveRequestCount(
        requests.filter((request) => ACTIVE_REQUEST_STATUSES.has(request.status)).length,
      );
      setHasUnreadNotifications(
        (notificationsResult.data ?? []).some((notification) => notification.read_at === null),
      );

      if (originCoordinates) {
        const { data, error: donorsError } = await getNearbyMapDonors({
          originLatitude: originCoordinates.latitude,
          originLongitude: originCoordinates.longitude,
          radiusKm: NEARBY_RADIUS_KM,
          maxResults: 50,
          availableOnly: false,
        });

        if (donorsError) {
          throw donorsError;
        }

        setNearbyDonors(data ?? []);
      } else {
        setNearbyDonors([]);
      }
    } catch (error) {
      setLoadError(sanitizeProfileError(error, 'Unable to load recipient home data.'));
    } finally {
      setInitialLoading(false);
      hasLoadedOnceRef.current = true;
    }
  }, [originCoordinates, session?.user.id]);

  useFocusEffect(
    useCallback(() => {
      void loadHomeData();
    }, [loadHomeData]),
  );

  const openDonorDetail = (donor: NearbyMapDonorItem) => {
    navigation.getParent()?.navigate('NearbyDonorDetail', { donor });
  };

  if (initialLoading && !hasLoadedOnceRef.current) {
    return <RecipientHomeSkeleton topInset={topInset} />;
  }

  return (
    <View style={recipientHomeStyles.screen}>
      <View style={[recipientHomeStyles.header, { paddingTop: topInset + 8 }]}>
        <View style={recipientHomeStyles.headerRow}>
          <View>
            <Text style={recipientHomeStyles.greeting}>
              {firstName ? `Hello, ${firstName}` : 'Hello'}
            </Text>
            <Text style={recipientHomeStyles.roleLabel}>Recipient</Text>
          </View>
          <Pressable
            accessibilityLabel="Open notifications"
            accessibilityRole="button"
            style={recipientHomeStyles.iconButton}
            onPress={() => navigation.getParent()?.navigate('Notifications')}
          >
            <Bell color={colors.foreground} size={20} />
            {hasUnreadNotifications ? <View style={recipientHomeStyles.notificationDot} /> : null}
          </Pressable>
        </View>
      </View>

      <ScrollView contentContainerStyle={recipientHomeStyles.scrollContent}>
        <View style={recipientHomeStyles.emergencyCard}>
          <View style={recipientHomeStyles.emergencyHeader}>
            <View style={{ flex: 1, gap: 6 }}>
              <Text style={recipientHomeStyles.emergencyTitle}>Emergency Request</Text>
              <Text style={recipientHomeStyles.emergencySubtitle}>
                Create a blood request instantly
              </Text>
            </View>
            <AlertCircle color={colors.primaryForeground} size={24} />
          </View>
          <Pressable
            accessibilityRole="button"
            style={({ pressed }) => [
              recipientHomeStyles.emergencyButton,
              pressed ? { opacity: 0.92 } : null,
            ]}
            onPress={() => navigation.getParent()?.navigate('CreateBloodRequest')}
          >
            <Plus color={colors.primary} size={18} />
            <Text style={recipientHomeStyles.emergencyButtonText}>Create Blood Request</Text>
          </Pressable>
        </View>

        {profile?.blood_type ? (
          <View style={recipientHomeStyles.bloodTypeCard}>
            <Text style={recipientHomeStyles.bloodTypeLabel}>Your Blood Type</Text>
            <View style={recipientHomeStyles.bloodTypeRow}>
              <BloodTypeBadge bloodType={profile.blood_type} size="lg" />
              <View style={{ flex: 1, gap: 4 }}>
                <Text style={recipientHomeStyles.bloodTypeLabel}>Can receive from</Text>
                <Text style={recipientHomeStyles.bloodTypeMeta}>
                  {getRecipientCanReceiveFromLabel(profile.blood_type)}
                </Text>
              </View>
            </View>
            <View style={recipientHomeStyles.bloodTypeFooter}>
              <View />
              <Pressable
                accessibilityRole="button"
                onPress={() => navigation.navigate('AppProfile')}
              >
                <Text style={recipientHomeStyles.linkText}>View Details</Text>
              </Pressable>
            </View>
          </View>
        ) : null}

        <View style={recipientHomeStyles.statRow}>
          <DonorStatCard
            icon={<Users color={colors.primary} size={20} />}
            label="Active Requests"
            subtext="Being processed"
            subtextColor={colors.info}
            value={String(activeRequestCount)}
          />
          <DonorStatCard
            icon={<Clock color={colors.primary} size={20} />}
            label="Nearby Donors"
            subtext={`within ${NEARBY_RADIUS_KM} km`}
            value={String(nearbyDonors.length)}
          />
        </View>

        {loadError ? <Text style={recipientHomeStyles.errorText}>{loadError}</Text> : null}

        <View style={recipientHomeStyles.sectionHeader}>
          <Text style={recipientHomeStyles.sectionTitle}>Available Donors Nearby</Text>
          <Pressable
            accessibilityRole="button"
            style={recipientHomeStyles.viewAllButton}
            onPress={() => navigation.navigate('RecipientMap')}
          >
            <Text style={recipientHomeStyles.linkText}>View All</Text>
          </Pressable>
        </View>

        <View style={recipientHomeStyles.donorList}>
          {!originCoordinates ? (
            <View style={recipientHomeStyles.bloodTypeCard}>
              <Text style={recipientHomeStyles.bloodTypeMeta}>
                Turn on location to see compatible donors near you.
              </Text>
            </View>
          ) : nearbyDonorPreview.length === 0 ? (
            <View style={recipientHomeStyles.bloodTypeCard}>
              <Text style={recipientHomeStyles.bloodTypeMeta}>
                No compatible donors nearby right now. Try again later or browse the map.
              </Text>
            </View>
          ) : (
            nearbyDonorPreview.map((donor) => (
              <NearbyDonorFeedCard
                key={donor.donorId}
                bloodType={donor.bloodType}
                distanceLabel={donor.distanceLabel}
                isAvailable={donor.isAvailable}
                name={donor.fullName}
                timeLabel={donor.timeLabel}
                onDetails={() => openDonorDetail(donor)}
                onRespond={() => openDonorDetail(donor)}
              />
            ))
          )}
        </View>
      </ScrollView>
    </View>
  );
}
