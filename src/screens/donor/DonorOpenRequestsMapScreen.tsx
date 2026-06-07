import { useCallback, useEffect, useMemo, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';

import { BloodRequestMapMarkerContent } from '@/components/map/BloodRequestMapMarkerContent';
import { MapStatePanel } from '@/components/map/MapStatePanel';
import { OpenStreetMapView } from '@/components/map/OpenStreetMapView';
import { mapStyles } from '@/components/map/styles';
import { PrimaryButton } from '@/components/common/PrimaryButton';
import { useForegroundLocation } from '@/hooks/useForegroundLocation';
import type { AppStackParamList } from '@/navigation/types';
import { authStyles } from '@/screens/auth/styles';
import { recipientStyles } from '@/screens/recipient/styles';
import { calculateRoute } from '@/services/maps/osm';
import {
  getOpenBloodRequestsFeed,
  type OpenBloodRequestFeedItem,
} from '@/services/supabase/openBloodRequestsFeed';
import {
  approximateCoordinates,
  hasValidCoordinates,
  haversineDistanceMeters,
  regionFromCoordinates,
} from '@/utils/coordinates';
import { formatDistance, formatTravelTime } from '@/utils/travelMetrics';

type Props = NativeStackScreenProps<AppStackParamList, 'DonorOpenRequestsMap'>;

type RouteMetrics = {
  distanceMeters: number;
  durationSeconds: number;
};

export function DonorOpenRequestsMapScreen({ navigation }: Props) {
  const [requests, setRequests] = useState<OpenBloodRequestFeedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null);
  const [routeMetrics, setRouteMetrics] = useState<RouteMetrics | null>(null);
  const [routeLoading, setRouteLoading] = useState(false);
  const [routeError, setRouteError] = useState<string | null>(null);

  const {
    coordinates: donorCoordinates,
    status: locationStatus,
    message: locationMessage,
    requestLocation,
  } = useForegroundLocation();

  const mappableRequests = useMemo(
    () =>
      requests.filter((request) =>
        hasValidCoordinates(request.latitude, request.longitude),
      ),
    [requests],
  );

  const selectedRequest = useMemo(
    () => mappableRequests.find((request) => request.id === selectedRequestId) ?? null,
    [mappableRequests, selectedRequestId],
  );

  const mapRegion = useMemo(() => {
    const points = mappableRequests.map((request) =>
      approximateCoordinates(request.latitude!, request.longitude!),
    );

    if (donorCoordinates) {
      points.push(donorCoordinates);
    }

    return regionFromCoordinates(points);
  }, [donorCoordinates, mappableRequests]);

  const mapMarkers = useMemo(
    () =>
      mappableRequests.map((request) => ({
        id: request.id,
        coordinates: approximateCoordinates(request.latitude!, request.longitude!),
        title: `${request.blood_type} · ${request.units_needed} unit${request.units_needed === 1 ? '' : 's'}`,
        description: 'Approximate request area',
      })),
    [mappableRequests],
  );

  const loadRequests = useCallback(async () => {
    setLoading(true);
    setError(null);

    const { data, error: fetchError } = await getOpenBloodRequestsFeed();

    if (fetchError) {
      setError(fetchError.message);
      setRequests([]);
    } else {
      setRequests(data ?? []);
    }

    setLoading(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadRequests();
      void requestLocation();
    }, [loadRequests, requestLocation]),
  );

  useEffect(() => {
    if (!selectedRequest || !donorCoordinates) {
      setRouteMetrics(null);
      setRouteError(null);
      setRouteLoading(false);
      return;
    }

    let cancelled = false;

    const loadRoute = async () => {
      setRouteLoading(true);
      setRouteError(null);

      try {
        const destination = approximateCoordinates(
          selectedRequest.latitude!,
          selectedRequest.longitude!,
        );
        const route = await calculateRoute(donorCoordinates, destination);

        if (!cancelled) {
          setRouteMetrics({
            distanceMeters: route.distanceMeters,
            durationSeconds: route.durationSeconds,
          });
        }
      } catch {
        if (!cancelled) {
          setRouteMetrics(null);
          setRouteError('Driving distance unavailable right now.');
        }
      } finally {
        if (!cancelled) {
          setRouteLoading(false);
        }
      }
    };

    void loadRoute();

    return () => {
      cancelled = true;
    };
  }, [donorCoordinates, selectedRequest]);

  const selectedDistanceLabel = useMemo(() => {
    if (!selectedRequest || !donorCoordinates) {
      return null;
    }

    if (routeMetrics) {
      return formatDistance(routeMetrics.distanceMeters);
    }

    if (routeLoading) {
      return 'Calculating driving distance…';
    }

    const destination = approximateCoordinates(
      selectedRequest.latitude!,
      selectedRequest.longitude!,
    );
    const straightLineDistance = haversineDistanceMeters(donorCoordinates, destination);

    return `${formatDistance(straightLineDistance)} (straight line)`;
  }, [donorCoordinates, routeLoading, routeMetrics, selectedRequest]);

  const selectedTravelTimeLabel = useMemo(() => {
    if (!routeMetrics) {
      return null;
    }

    return formatTravelTime(routeMetrics.durationSeconds);
  }, [routeMetrics]);

  if (loading) {
    return (
      <View style={recipientStyles.centerContent}>
        <ActivityIndicator color="#b91c1c" size="large" />
        <Text style={recipientStyles.subtitle}>Loading open requests map…</Text>
      </View>
    );
  }

  if (error && requests.length === 0) {
    return (
      <View style={recipientStyles.centerContent}>
        <MapStatePanel
          variant="inline"
          error
          message={error}
          primaryAction={{
            title: 'Try again',
            onPress: () => void loadRequests(),
          }}
          secondaryAction={{
            title: 'Back to list',
            onPress: () => navigation.navigate('DonorRequestFeed'),
          }}
          title="Unable to load map"
        />
      </View>
    );
  }

  if (requests.length === 0) {
    return (
      <View style={recipientStyles.centerContent}>
        <MapStatePanel
          variant="inline"
          message="There are no open blood requests right now. Check back later or view the list view."
          primaryAction={{
            title: 'Refresh map',
            onPress: () => void loadRequests(),
          }}
          secondaryAction={{
            title: 'Back to list',
            onPress: () => navigation.navigate('DonorRequestFeed'),
          }}
          title="No open requests"
        />
      </View>
    );
  }

  if (mappableRequests.length === 0) {
    return (
      <View style={recipientStyles.centerContent}>
        <MapStatePanel
          variant="inline"
          message="Open requests exist, but none include shareable coordinates yet."
          primaryAction={{
            title: 'Refresh map',
            onPress: () => void loadRequests(),
          }}
          secondaryAction={{
            title: 'View list',
            onPress: () => navigation.navigate('DonorRequestFeed'),
          }}
          title="No mapped locations"
        />
      </View>
    );
  }

  return (
    <View style={mapStyles.screen}>
      {locationStatus === 'denied' ||
      locationStatus === 'services_disabled' ||
      locationStatus === 'error' ? (
        <View style={mapStyles.permissionBanner}>
          <Text style={mapStyles.permissionText}>{locationMessage}</Text>
          <PrimaryButton
            title="Try location again"
            variant="secondary"
            onPress={() => void requestLocation()}
          />
        </View>
      ) : null}

      {error ? <Text style={[authStyles.error, { marginHorizontal: 12 }]}>{error}</Text> : null}

      <OpenStreetMapView
        markers={mapMarkers}
        region={mapRegion}
        selectedMarkerId={selectedRequestId}
        showsUserLocation={locationStatus === 'granted'}
        onMarkerPress={setSelectedRequestId}
      />

      {selectedRequest ? (
        <View style={mapStyles.overlayBottom}>
          <BloodRequestMapMarkerContent
            distanceLabel={selectedDistanceLabel}
            request={selectedRequest}
            travelTimeLabel={selectedTravelTimeLabel}
          />
          {routeError ? <Text style={authStyles.error}>{routeError}</Text> : null}
          <PrimaryButton
            title="View request details"
            onPress={() =>
              navigation.navigate('DonorRequestDetail', { requestId: selectedRequest.id })
            }
          />
          <Pressable onPress={() => setSelectedRequestId(null)}>
            <Text style={recipientStyles.meta}>Clear selection</Text>
          </Pressable>
        </View>
      ) : (
        <View style={mapStyles.overlayBottom}>
          <Text style={recipientStyles.eyebrow}>Open requests map</Text>
          <Text style={recipientStyles.subtitle}>
            Tap a marker to preview safe request details. Patient, hospital, and contact
            information stay hidden until you are matched.
          </Text>
          <PrimaryButton
            title="View list"
            variant="secondary"
            onPress={() => navigation.navigate('DonorRequestFeed')}
          />
        </View>
      )}
    </View>
  );
}
