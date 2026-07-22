import { useCallback, useEffect, useMemo, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { CompositeScreenProps } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Crosshair, RefreshCw, Search, Users } from 'lucide-react-native';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  Switch,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { NearbyDonorCard } from '@/components/donor/NearbyDonorCard';
import { Skeleton } from '@/components/common/Skeleton';
import { PrimaryButton } from '@/components/common/PrimaryButton';
import { OpenStreetMapView } from '@/components/map/OpenStreetMapView';
import { colors } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { useUserMode, type UserMode } from '@/context/UserModeContext';
import { useForegroundLocation } from '@/hooks/useForegroundLocation';
import type { AppTabParamList } from '@/navigation/AppTabNavigator';
import type { AppStackParamList } from '@/navigation/types';
import { nearbyDonorsMapStyles } from '@/screens/donor/nearbyDonorsMapStyles';
import {
  getNearbyMapDonors,
  type NearbyMapDonorItem,
} from '@/services/supabase/nearbyMapDonors';
import { setDonorMapVisibility } from '@/services/supabase/profiles';
import type { BloodType } from '@/types/database';
import { approximateCoordinates, regionFromCoordinates } from '@/utils/coordinates';
import { sanitizeProfileError } from '@/utils/profileErrors';

type Props = CompositeScreenProps<
  BottomTabScreenProps<AppTabParamList, 'Map'>,
  NativeStackScreenProps<AppStackParamList>
>;

const BLOOD_TYPES: BloodType[] = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
const RADIUS_OPTIONS = [5, 10, 25] as const;

type RadiusOption = (typeof RADIUS_OPTIONS)[number];

type MapScreenCopy = {
  emptyNoLocation: string;
  emptyNoResults: (radiusKm: number) => string;
  filterModalTitle: string;
  headerSubtitle: string;
  headerTitle: string;
  searchPlaceholder: string;
  sectionTitle: string;
  visibilityHelper: string;
};

const MAP_SCREEN_COPY: Record<UserMode, MapScreenCopy> = {
  donate: {
    headerTitle: 'Nearby Area',
    headerSubtitle: 'Browse donors on the map while you are available to help.',
    searchPlaceholder: 'Search nearby...',
    sectionTitle: 'Donors in Area',
    filterModalTitle: 'Filter nearby donors',
    emptyNoLocation:
      'Turn on location to explore donors near you and see approximate distances.',
    emptyNoResults: (radiusKm) =>
      `No donors match your filters within ${radiusKm} km. Try widening the radius or adjusting filters.`,
    visibilityHelper:
      'Opt in to appear as an approximate pin for others browsing nearby.',
  },
  request: {
    headerTitle: 'Nearby Donors',
    headerSubtitle: 'Find compatible donors near you for your blood request.',
    searchPlaceholder: 'Search donors...',
    sectionTitle: 'Available Donors',
    filterModalTitle: 'Filter donors',
    emptyNoLocation:
      'Turn on location to load nearby donors and distances from your position.',
    emptyNoResults: (radiusKm) =>
      `No donors match your filters within ${radiusKm} km. Try widening the radius or turning off the Available filter.`,
    visibilityHelper:
      'Verified donors can opt in to appear as an approximate pin nearby.',
  },
};

/** ~1° latitude ≈ 111 km — used so radius chips change map zoom. */
const KM_PER_DEGREE = 111;

const getMapHeight = (windowHeight: number) =>
  Math.round(Math.min(520, Math.max(380, windowHeight * 0.46)));

function NearbyDonorsMapSkeleton({
  mapHeight,
  topInset,
}: {
  mapHeight: number;
  topInset: number;
}) {
  return (
    <View style={nearbyDonorsMapStyles.screen}>
      <View style={[nearbyDonorsMapStyles.header, { paddingTop: topInset + 8 }]}>
        <Skeleton borderRadius={10} height={28} width="50%" />
        <Skeleton borderRadius={14} height={46} width="100%" />
        <Skeleton borderRadius={999} height={36} width="100%" />
      </View>
      <Skeleton borderRadius={0} height={mapHeight} width="100%" />
      <View style={nearbyDonorsMapStyles.listContent}>
        <Skeleton borderRadius={16} height={160} width="100%" />
      </View>
    </View>
  );
}

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

export function NearbyDonorsMapScreen({ navigation }: Props) {
  const { top: topInset } = useSafeAreaInsets();
  const { height: windowHeight } = useWindowDimensions();
  const mapHeight = getMapHeight(windowHeight);
  const { profile, refreshProfile, session } = useAuth();
  const { mode } = useUserMode();
  const copy = MAP_SCREEN_COPY[mode];
  const [donors, setDonors] = useState<NearbyMapDonorItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [bloodTypeFilter, setBloodTypeFilter] = useState<BloodType | null>(null);
  const [availableOnly, setAvailableOnly] = useState(false);
  const [radiusKm, setRadiusKm] = useState<RadiusOption>(10);
  const [selectedDonorId, setSelectedDonorId] = useState<string | null>(null);
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [mapVisibilityLoading, setMapVisibilityLoading] = useState(false);
  const [mapVisibilityError, setMapVisibilityError] = useState<string | null>(null);
  const [regionNonce, setRegionNonce] = useState(0);

  const {
    coordinates: gpsCoordinates,
    status: locationStatus,
    message: locationMessage,
    requestLocation,
  } = useForegroundLocation();

  const originCoordinates = useMemo(
    () => getOriginCoordinates(gpsCoordinates, profile?.latitude, profile?.longitude),
    [gpsCoordinates, profile?.latitude, profile?.longitude],
  );

  const loadDonors = useCallback(
    async (options?: { silent?: boolean }) => {
      if (!originCoordinates) {
        setDonors([]);
        setLoading(false);
        return;
      }

      if (!options?.silent) {
        setLoading(true);
      }
      setError(null);

      const { data, error: fetchError } = await getNearbyMapDonors({
        originLatitude: originCoordinates.latitude,
        originLongitude: originCoordinates.longitude,
        radiusKm,
        bloodType: bloodTypeFilter,
        availableOnly,
      });

      if (fetchError) {
        setError(fetchError.message);
        setDonors([]);
      } else {
        setDonors(data ?? []);
      }

      setLoading(false);
    },
    [availableOnly, bloodTypeFilter, originCoordinates, radiusKm],
  );

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    setError(null);
    await requestLocation();
    await loadDonors({ silent: true });
    setRegionNonce((current) => current + 1);
    setRefreshing(false);
  }, [loadDonors, requestLocation]);

  const handleRecenter = useCallback(async () => {
    await requestLocation();
    setRegionNonce((current) => current + 1);
  }, [requestLocation]);

  useFocusEffect(
    useCallback(() => {
      void requestLocation();
    }, [requestLocation]),
  );

  useEffect(() => {
    if (originCoordinates) {
      void loadDonors();
      return;
    }

    if (locationStatus !== 'requesting' && locationStatus !== 'idle') {
      setLoading(false);
    }
  }, [availableOnly, bloodTypeFilter, loadDonors, locationStatus, originCoordinates, radiusKm]);

  const visibleDonors = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();

    return donors
      .filter((donor) => {
        if (!normalizedQuery) {
          return true;
        }

        const haystack = [donor.fullName, donor.bloodType].join(' ').toLowerCase();
        return haystack.includes(normalizedQuery);
      })
      .sort((left, right) => left.distanceMeters - right.distanceMeters);
  }, [donors, searchQuery]);

  const mapRegion = useMemo(() => {
    const points = visibleDonors.map((donor) =>
      approximateCoordinates(donor.latitude, donor.longitude),
    );

    if (originCoordinates) {
      points.push(originCoordinates);
    }

    const fitted = regionFromCoordinates(points);
    const radiusDelta = Math.max((radiusKm / KM_PER_DEGREE) * 2.2, 0.04);

    // Keep zoom practical for the selected search radius even with few pins.
    return {
      ...fitted,
      latitude: originCoordinates?.latitude ?? fitted.latitude,
      longitude: originCoordinates?.longitude ?? fitted.longitude,
      latitudeDelta: Math.max(fitted.latitudeDelta, radiusDelta),
      longitudeDelta: Math.max(fitted.longitudeDelta, radiusDelta),
    };
  }, [originCoordinates, radiusKm, visibleDonors]);

  const mapMarkers = useMemo(
    () =>
      visibleDonors.map((donor) => ({
        id: donor.donorId,
        coordinates: approximateCoordinates(donor.latitude, donor.longitude),
        title: donor.fullName,
        description: `${donor.bloodType} · ${donor.isAvailable ? 'Available' : 'Unavailable'}`,
        pinColor: donor.isAvailable ? colors.success : colors.primary,
      })),
    [visibleDonors],
  );

  const availableCount = useMemo(
    () => visibleDonors.filter((donor) => donor.isAvailable).length,
    [visibleDonors],
  );

  const openDonorDetail = (donor: NearbyMapDonorItem) => {
    navigation.getParent()?.navigate('NearbyDonorDetail', { donor });
  };

  const handleMapVisibilityToggle = async (visibleOnMap: boolean) => {
    if (!session?.user.id || mapVisibilityLoading) {
      return;
    }

    setMapVisibilityLoading(true);
    setMapVisibilityError(null);

    let latitude = profile?.latitude ?? null;
    let longitude = profile?.longitude ?? null;

    if (visibleOnMap) {
      if (gpsCoordinates) {
        latitude = gpsCoordinates.latitude;
        longitude = gpsCoordinates.longitude;
      }

      if (
        latitude == null ||
        longitude == null ||
        !Number.isFinite(latitude) ||
        !Number.isFinite(longitude)
      ) {
        setMapVisibilityError(
          'Turn on location first so BloodLink can place your approximate pin on the map.',
        );
        setMapVisibilityLoading(false);
        return;
      }
    }

    const { error: updateError } = await setDonorMapVisibility({
      userId: session.user.id,
      visibleOnMap,
      latitude,
      longitude,
    });

    if (updateError) {
      setMapVisibilityError(
        sanitizeProfileError(updateError, 'Unable to update map visibility. Please try again.'),
      );
    } else {
      await refreshProfile();
      if (visibleOnMap) {
        void loadDonors({ silent: true });
      }
    }

    setMapVisibilityLoading(false);
  };

  const isDonor = profile?.role === 'donor';
  const showMapVisibilityCard = isDonor && mode === 'donate';
  const isMapBusy = loading || refreshing;
  const showInitialSkeleton = loading && !originCoordinates && locationStatus === 'requesting';

  if (showInitialSkeleton) {
    return <NearbyDonorsMapSkeleton mapHeight={mapHeight} topInset={topInset} />;
  }

  return (
    <View style={nearbyDonorsMapStyles.screen}>
      <View style={[nearbyDonorsMapStyles.header, { paddingTop: topInset + 8 }]}>
        <View style={nearbyDonorsMapStyles.headerTitleBlock}>
          <Text style={nearbyDonorsMapStyles.headerTitle}>{copy.headerTitle}</Text>
          <Text style={nearbyDonorsMapStyles.headerSubtitle}>{copy.headerSubtitle}</Text>
        </View>

        <View style={nearbyDonorsMapStyles.searchRow}>
          <View style={nearbyDonorsMapStyles.searchShell}>
            <Search color={colors.muted} size={18} strokeWidth={2} />
            <TextInput
              placeholder={copy.searchPlaceholder}
              placeholderTextColor={colors.mutedLight}
              style={nearbyDonorsMapStyles.searchInput}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
        </View>

        <ScrollView
          horizontal
          contentContainerStyle={nearbyDonorsMapStyles.chipRow}
          showsHorizontalScrollIndicator={false}
          style={nearbyDonorsMapStyles.chipScroll}
        >
          <Pressable
            style={[
              nearbyDonorsMapStyles.chip,
              bloodTypeFilter === null ? nearbyDonorsMapStyles.chipActive : null,
            ]}
            onPress={() => setBloodTypeFilter(null)}
          >
            <Text
              style={[
                nearbyDonorsMapStyles.chipLabel,
                bloodTypeFilter === null ? nearbyDonorsMapStyles.chipLabelActive : null,
              ]}
            >
              All Types
            </Text>
          </Pressable>

          <Pressable
            style={[
              nearbyDonorsMapStyles.chip,
              availableOnly ? nearbyDonorsMapStyles.chipActive : null,
            ]}
            onPress={() => setAvailableOnly((current) => !current)}
          >
            <Text
              style={[
                nearbyDonorsMapStyles.chipLabel,
                availableOnly ? nearbyDonorsMapStyles.chipLabelActive : null,
              ]}
            >
              Available
            </Text>
          </Pressable>

          {RADIUS_OPTIONS.map((option) => (
            <Pressable
              key={option}
              style={[
                nearbyDonorsMapStyles.chip,
                radiusKm === option ? nearbyDonorsMapStyles.chipActive : null,
              ]}
              onPress={() => setRadiusKm(option)}
            >
              <Text
                style={[
                  nearbyDonorsMapStyles.chipLabel,
                  radiusKm === option ? nearbyDonorsMapStyles.chipLabelActive : null,
                ]}
              >
                {option} km
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      {locationStatus === 'denied' ||
      locationStatus === 'services_disabled' ||
      locationStatus === 'error' ? (
        <View style={nearbyDonorsMapStyles.permissionBanner}>
          <Text style={nearbyDonorsMapStyles.permissionText}>{locationMessage}</Text>
          <PrimaryButton
            title="Enable location"
            variant="secondary"
            onPress={() => void requestLocation()}
          />
        </View>
      ) : null}

      {showMapVisibilityCard ? (
        <View style={nearbyDonorsMapStyles.visibilityCard}>
          <View style={nearbyDonorsMapStyles.visibilityRow}>
            <View style={{ flex: 1, paddingRight: 12 }}>
              <Text style={nearbyDonorsMapStyles.visibilityTitle}>Show me on the map</Text>
              <Text style={nearbyDonorsMapStyles.visibilityCopy}>{copy.visibilityHelper}</Text>
            </View>
            <Switch
              disabled={mapVisibilityLoading}
              thumbColor={colors.card}
              trackColor={{ false: colors.border, true: colors.primary }}
              value={profile?.visible_on_map ?? false}
              onValueChange={(value) => void handleMapVisibilityToggle(value)}
            />
          </View>
          {mapVisibilityError ? (
            <Text style={nearbyDonorsMapStyles.errorText}>{mapVisibilityError}</Text>
          ) : null}
        </View>
      ) : null}

      <View style={[nearbyDonorsMapStyles.mapSection, { height: mapHeight }]}>
        <View style={[nearbyDonorsMapStyles.mapWrapper, { height: mapHeight }]}>
          {originCoordinates ? (
            <OpenStreetMapView
              focusToken={regionNonce}
              height={mapHeight}
              markers={mapMarkers}
              region={mapRegion}
              selectedMarkerId={selectedDonorId}
              showsUserLocation={locationStatus === 'granted'}
              onMarkerPress={setSelectedDonorId}
            />
          ) : (
            <View
              style={[
                nearbyDonorsMapStyles.emptyCard,
                {
                  flex: 1,
                  justifyContent: 'center',
                  margin: 24,
                },
              ]}
            >
              <Text style={nearbyDonorsMapStyles.emptyText}>{copy.emptyNoLocation}</Text>
              <PrimaryButton title="Enable location" onPress={() => void requestLocation()} />
            </View>
          )}

          {originCoordinates ? (
            <>
              <View style={nearbyDonorsMapStyles.mapControls}>
                <Pressable
                  accessibilityLabel="Refresh map and donor list"
                  accessibilityRole="button"
                  disabled={isMapBusy}
                  style={({ pressed }) => [
                    nearbyDonorsMapStyles.mapControlButton,
                    pressed || isMapBusy ? nearbyDonorsMapStyles.mapControlButtonPressed : null,
                  ]}
                  onPress={() => void handleRefresh()}
                >
                  {refreshing ? (
                    <ActivityIndicator color={colors.primary} size="small" />
                  ) : (
                    <RefreshCw color={colors.foreground} size={20} strokeWidth={2.25} />
                  )}
                </Pressable>

                <Pressable
                  accessibilityLabel="Recenter map on my location"
                  accessibilityRole="button"
                  style={({ pressed }) => [
                    nearbyDonorsMapStyles.mapControlButton,
                    pressed ? nearbyDonorsMapStyles.mapControlButtonPressed : null,
                  ]}
                  onPress={() => void handleRecenter()}
                >
                  <Crosshair color={colors.foreground} size={20} strokeWidth={2.25} />
                </Pressable>
              </View>

              {loading && !refreshing ? (
                <View style={nearbyDonorsMapStyles.mapLoadingBadge}>
                  <ActivityIndicator color={colors.primary} size="small" />
                  <Text style={nearbyDonorsMapStyles.mapLoadingText}>Updating…</Text>
                </View>
              ) : null}

              <View style={nearbyDonorsMapStyles.mapSummaryCard}>
                <View style={nearbyDonorsMapStyles.mapSummaryRow}>
                  <Users color={colors.primary} size={18} strokeWidth={2} />
                  <Text style={nearbyDonorsMapStyles.mapSummaryLabel}>
                    {visibleDonors.length} donor{visibleDonors.length === 1 ? '' : 's'} · {radiusKm}{' '}
                    km
                  </Text>
                </View>
                <Text
                  style={
                    availableCount > 0
                      ? nearbyDonorsMapStyles.mapSummaryStat
                      : nearbyDonorsMapStyles.mapSummaryStatMuted
                  }
                >
                  {availableCount} available
                </Text>
              </View>
            </>
          ) : null}
        </View>
      </View>

      <ScrollView
        contentContainerStyle={nearbyDonorsMapStyles.listContent}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl
            colors={[colors.primary]}
            refreshing={refreshing}
            tintColor={colors.primary}
            onRefresh={() => void handleRefresh()}
          />
        }
        style={nearbyDonorsMapStyles.listScroll}
      >
        <View>
          <View style={nearbyDonorsMapStyles.donorSectionHeader}>
            <Text style={nearbyDonorsMapStyles.donorSectionTitle}>{copy.sectionTitle}</Text>
            <Pressable accessibilityRole="button" onPress={() => setFilterModalVisible(true)}>
              <Text style={nearbyDonorsMapStyles.filterLink}>Filter</Text>
            </Pressable>
          </View>

          {error ? <Text style={nearbyDonorsMapStyles.errorText}>{error}</Text> : null}

          {!originCoordinates ? (
            <View style={nearbyDonorsMapStyles.emptyCard}>
              <Text style={nearbyDonorsMapStyles.emptyText}>{copy.emptyNoLocation}</Text>
            </View>
          ) : loading && donors.length === 0 ? (
            <Skeleton borderRadius={16} height={160} width="100%" />
          ) : visibleDonors.length === 0 ? (
            <View style={nearbyDonorsMapStyles.emptyCard}>
              <Text style={nearbyDonorsMapStyles.emptyText}>
                {copy.emptyNoResults(radiusKm)}
              </Text>
              <PrimaryButton title="Refresh map" onPress={() => void handleRefresh()} />
            </View>
          ) : (
            <View style={nearbyDonorsMapStyles.donorList}>
              {visibleDonors.map((donor) => (
                <NearbyDonorCard
                  key={donor.donorId}
                  donor={donor}
                  selected={selectedDonorId === donor.donorId}
                  onPress={() => {
                    setSelectedDonorId(donor.donorId);
                    openDonorDetail(donor);
                  }}
                />
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      <Modal
        animationType="slide"
        transparent
        visible={filterModalVisible}
        onRequestClose={() => setFilterModalVisible(false)}
      >
        <Pressable
          style={{
            backgroundColor: 'rgba(0,0,0,0.35)',
            flex: 1,
            justifyContent: 'flex-end',
          }}
          onPress={() => setFilterModalVisible(false)}
        >
          <Pressable
            style={{
              backgroundColor: colors.card,
              borderTopLeftRadius: 24,
              borderTopRightRadius: 24,
              gap: 16,
              padding: 24,
            }}
            onPress={(event) => event.stopPropagation()}
          >
            <Text style={nearbyDonorsMapStyles.donorSectionTitle}>{copy.filterModalTitle}</Text>
            <Text style={nearbyDonorsMapStyles.visibilityCopy}>Blood type</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              <Pressable
                style={[
                  nearbyDonorsMapStyles.chip,
                  bloodTypeFilter === null ? nearbyDonorsMapStyles.chipActive : null,
                ]}
                onPress={() => setBloodTypeFilter(null)}
              >
                <Text
                  style={[
                    nearbyDonorsMapStyles.chipLabel,
                    bloodTypeFilter === null ? nearbyDonorsMapStyles.chipLabelActive : null,
                  ]}
                >
                  All Types
                </Text>
              </Pressable>
              {BLOOD_TYPES.map((bloodType) => (
                <Pressable
                  key={bloodType}
                  style={[
                    nearbyDonorsMapStyles.chip,
                    bloodTypeFilter === bloodType ? nearbyDonorsMapStyles.chipActive : null,
                  ]}
                  onPress={() => setBloodTypeFilter(bloodType)}
                >
                  <Text
                    style={[
                      nearbyDonorsMapStyles.chipLabel,
                      bloodTypeFilter === bloodType
                        ? nearbyDonorsMapStyles.chipLabelActive
                        : null,
                    ]}
                  >
                    {bloodType}
                  </Text>
                </Pressable>
              ))}
            </View>

            <View style={nearbyDonorsMapStyles.visibilityRow}>
              <Text style={nearbyDonorsMapStyles.visibilityTitle}>Available only</Text>
              <Switch
                thumbColor={colors.card}
                trackColor={{ false: colors.border, true: colors.primary }}
                value={availableOnly}
                onValueChange={setAvailableOnly}
              />
            </View>

            <Text style={nearbyDonorsMapStyles.visibilityCopy}>Search radius</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {RADIUS_OPTIONS.map((option) => (
                <Pressable
                  key={option}
                  style={[
                    nearbyDonorsMapStyles.chip,
                    radiusKm === option ? nearbyDonorsMapStyles.chipActive : null,
                  ]}
                  onPress={() => setRadiusKm(option)}
                >
                  <Text
                    style={[
                      nearbyDonorsMapStyles.chipLabel,
                      radiusKm === option ? nearbyDonorsMapStyles.chipLabelActive : null,
                    ]}
                  >
                    {option} km
                  </Text>
                </Pressable>
              ))}
            </View>

            <PrimaryButton
              title="Apply filters"
              onPress={() => {
                setFilterModalVisible(false);
                void loadDonors({ silent: true });
              }}
            />
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}
