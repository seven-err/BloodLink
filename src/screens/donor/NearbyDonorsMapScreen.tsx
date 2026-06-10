import { useCallback, useEffect, useMemo, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { CompositeScreenProps } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Crosshair, Search, Users } from 'lucide-react-native';
import {
  Modal,
  Pressable,
  ScrollView,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { NearbyDonorCard } from '@/components/donor/NearbyDonorCard';
import { Skeleton } from '@/components/common/Skeleton';
import { PrimaryButton } from '@/components/common/PrimaryButton';
import { OpenStreetMapView } from '@/components/map/OpenStreetMapView';
import { colors } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { useForegroundLocation } from '@/hooks/useForegroundLocation';
import type { DonorTabParamList } from '@/navigation/DonorTabNavigator';
import type { RecipientTabParamList } from '@/navigation/RecipientTabNavigator';
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

type TabProps = CompositeScreenProps<
  | BottomTabScreenProps<DonorTabParamList, 'DonorOpenRequestsMap'>
  | BottomTabScreenProps<RecipientTabParamList, 'RecipientMap'>,
  NativeStackScreenProps<AppStackParamList>
>;

type StackProps = NativeStackScreenProps<AppStackParamList, 'NearbyDonorsMap'>;

type Props = TabProps | StackProps;

const BLOOD_TYPES: BloodType[] = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
const RADIUS_OPTIONS = [5, 10, 25] as const;

type RadiusOption = (typeof RADIUS_OPTIONS)[number];

function NearbyDonorsMapSkeleton({ topInset }: { topInset: number }) {
  return (
    <View style={nearbyDonorsMapStyles.screen}>
      <View style={[nearbyDonorsMapStyles.header, { paddingTop: topInset + 8 }]}>
        <Skeleton borderRadius={10} height={28} width="50%" />
        <Skeleton borderRadius={14} height={48} width="100%" />
        <Skeleton borderRadius={999} height={38} width="100%" />
      </View>
      <Skeleton borderRadius={16} height={280} style={{ marginHorizontal: 24, marginTop: 16 }} />
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
  const { profile, refreshProfile, session } = useAuth();
  const [donors, setDonors] = useState<NearbyMapDonorItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [bloodTypeFilter, setBloodTypeFilter] = useState<BloodType | null>(null);
  const [availableOnly, setAvailableOnly] = useState(false);
  const [radiusKm, setRadiusKm] = useState<RadiusOption>(5);
  const [selectedDonorId, setSelectedDonorId] = useState<string | null>(null);
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [mapVisibilityLoading, setMapVisibilityLoading] = useState(false);
  const [mapVisibilityError, setMapVisibilityError] = useState<string | null>(null);

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

  const loadDonors = useCallback(async () => {
    if (!originCoordinates) {
      setDonors([]);
      setLoading(false);
      return;
    }

    setLoading(true);
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
  }, [availableOnly, bloodTypeFilter, originCoordinates, radiusKm]);

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

    return regionFromCoordinates(points);
  }, [originCoordinates, visibleDonors]);

  const mapMarkers = useMemo(
    () =>
      visibleDonors.map((donor) => ({
        id: donor.donorId,
        coordinates: approximateCoordinates(donor.latitude, donor.longitude),
        title: donor.fullName,
        description: `${donor.bloodType} · ${donor.isAvailable ? 'Available' : 'Unavailable'}`,
        pinColor: donor.isAvailable ? '#10b981' : '#dc2626',
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

  const handleRadiusChipPress = () => {
    const currentIndex = RADIUS_OPTIONS.indexOf(radiusKm);
    const nextRadius = RADIUS_OPTIONS[(currentIndex + 1) % RADIUS_OPTIONS.length];
    setRadiusKm(nextRadius);
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
        void loadDonors();
      }
    }

    setMapVisibilityLoading(false);
  };

  const isDonor = profile?.role === 'donor';
  const showMapVisibilityCard = isDonor;

  if (loading && !originCoordinates) {
    return <NearbyDonorsMapSkeleton topInset={topInset} />;
  }

  return (
    <View style={nearbyDonorsMapStyles.screen}>
      <View style={[nearbyDonorsMapStyles.header, { paddingTop: topInset + 8 }]}>
          <Text style={nearbyDonorsMapStyles.headerTitle}>Nearby Donors</Text>

          <View style={nearbyDonorsMapStyles.searchRow}>
            <View style={nearbyDonorsMapStyles.searchShell}>
              <Search color={colors.muted} size={18} strokeWidth={2} />
              <TextInput
                placeholder="Search donors..."
                placeholderTextColor={colors.mutedLight}
                style={nearbyDonorsMapStyles.searchInput}
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
            </View>
            <Pressable
              accessibilityLabel="Use current location"
              accessibilityRole="button"
              style={({ pressed }) => [
                nearbyDonorsMapStyles.currentLocationButton,
                pressed ? nearbyDonorsMapStyles.currentLocationButtonPressed : null,
              ]}
              onPress={() => void requestLocation().then(() => loadDonors())}
            >
              <Crosshair color={colors.primaryForeground} size={20} strokeWidth={2.25} />
            </Pressable>
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

            <Pressable
              style={nearbyDonorsMapStyles.chip}
              onPress={handleRadiusChipPress}
            >
              <Text style={nearbyDonorsMapStyles.chipLabel}>{radiusKm} km radius</Text>
            </Pressable>
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
              <Text style={nearbyDonorsMapStyles.visibilityTitle}>Show me on the map</Text>
              <Switch
                disabled={mapVisibilityLoading}
                thumbColor={colors.card}
                trackColor={{ false: colors.border, true: colors.primary }}
                value={profile?.visible_on_map ?? false}
                onValueChange={(value) => void handleMapVisibilityToggle(value)}
              />
            </View>
            <Text style={nearbyDonorsMapStyles.visibilityCopy}>
              Verified donors can opt in to appear as an approximate pin for recipients and other
              donors browsing nearby.
            </Text>
            {mapVisibilityError ? (
              <Text style={nearbyDonorsMapStyles.errorText}>{mapVisibilityError}</Text>
            ) : null}
          </View>
        ) : null}

      <View style={nearbyDonorsMapStyles.mapSection}>
        {loading ? (
          <Skeleton borderRadius={16} height={280} width="100%" />
        ) : (
          <View style={nearbyDonorsMapStyles.mapWrapper}>
            <OpenStreetMapView
              height={280}
              markers={mapMarkers}
              region={mapRegion}
              selectedMarkerId={selectedDonorId}
              showsUserLocation={locationStatus === 'granted'}
              onMarkerPress={setSelectedDonorId}
            />

            <View style={nearbyDonorsMapStyles.mapSummaryCard}>
              <View style={nearbyDonorsMapStyles.mapSummaryRow}>
                <Users color={colors.primary} size={18} strokeWidth={2} />
                <Text style={nearbyDonorsMapStyles.mapSummaryLabel}>
                  {visibleDonors.length} donor{visibleDonors.length === 1 ? '' : 's'} nearby
                </Text>
              </View>
              <Text style={nearbyDonorsMapStyles.mapSummaryStat}>
                {availableCount} available
              </Text>
            </View>
          </View>
        )}
      </View>

      <ScrollView
        contentContainerStyle={nearbyDonorsMapStyles.listContent}
        keyboardShouldPersistTaps="handled"
        style={nearbyDonorsMapStyles.listScroll}
      >
        <View>
          <View style={nearbyDonorsMapStyles.donorSectionHeader}>
            <Text style={nearbyDonorsMapStyles.donorSectionTitle}>Available Donors</Text>
            <Pressable accessibilityRole="button" onPress={() => setFilterModalVisible(true)}>
              <Text style={nearbyDonorsMapStyles.filterLink}>Filter</Text>
            </Pressable>
          </View>

          {error ? <Text style={nearbyDonorsMapStyles.errorText}>{error}</Text> : null}

          {!originCoordinates ? (
            <View style={nearbyDonorsMapStyles.emptyCard}>
              <Text style={nearbyDonorsMapStyles.emptyText}>
                Turn on location to load nearby donors and distances from your position.
              </Text>
            </View>
          ) : loading ? (
            <Skeleton borderRadius={16} height={160} width="100%" />
          ) : visibleDonors.length === 0 ? (
            <View style={nearbyDonorsMapStyles.emptyCard}>
              <Text style={nearbyDonorsMapStyles.emptyText}>
                No donors match your filters within {radiusKm} km. Try widening the radius or
                turning off the Available filter.
              </Text>
              <PrimaryButton title="Refresh map" onPress={() => void loadDonors()} />
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
            <Text style={nearbyDonorsMapStyles.donorSectionTitle}>Filter donors</Text>
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
                      bloodTypeFilter === bloodType ? nearbyDonorsMapStyles.chipLabelActive : null,
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

            <PrimaryButton
              title="Apply filters"
              onPress={() => {
                setFilterModalVisible(false);
                void loadDonors();
              }}
            />
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}
