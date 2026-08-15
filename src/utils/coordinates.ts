import type { Coordinates } from '@/services/location/types';

/** ~1.1 km precision — safe for unmatched donor map display. */
export const APPROXIMATE_COORDINATE_DECIMALS = 2;

export const approximateCoordinate = (
  value: number,
  decimals = APPROXIMATE_COORDINATE_DECIMALS,
): number => {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
};

export const approximateCoordinates = (
  latitude: number,
  longitude: number,
  decimals = APPROXIMATE_COORDINATE_DECIMALS,
): Coordinates => ({
  latitude: approximateCoordinate(latitude, decimals),
  longitude: approximateCoordinate(longitude, decimals),
});

const isFiniteCoordinatePair = (
  latitude: number | null | undefined,
  longitude: number | null | undefined,
): boolean =>
  latitude != null &&
  longitude != null &&
  Number.isFinite(latitude) &&
  Number.isFinite(longitude) &&
  latitude >= -90 &&
  latitude <= 90 &&
  longitude >= -180 &&
  longitude <= 180;

export const hasValidCoordinates = (
  latitude: number | null | undefined,
  longitude: number | null | undefined,
): boolean => isFiniteCoordinatePair(latitude, longitude);

export const getValidCoordinates = (
  latitude: number | null | undefined,
  longitude: number | null | undefined,
): Coordinates | null => {
  if (!isFiniteCoordinatePair(latitude, longitude)) {
    return null;
  }

  return {
    latitude: latitude as number,
    longitude: longitude as number,
  };
};

export const formatApproximateCoordinates = (
  latitude: number | null,
  longitude: number | null,
): string => {
  const coordinates = getValidCoordinates(latitude, longitude);

  if (!coordinates) {
    return 'Location not shared';
  }

  return `Approx. ${approximateCoordinate(coordinates.latitude).toFixed(APPROXIMATE_COORDINATE_DECIMALS)}, ${approximateCoordinate(coordinates.longitude).toFixed(APPROXIMATE_COORDINATE_DECIMALS)}`;
};

export const formatExactCoordinates = (
  latitude: number | null,
  longitude: number | null,
): string => {
  const coordinates = getValidCoordinates(latitude, longitude);

  if (!coordinates) {
    return 'Location not shared';
  }

  return `${coordinates.latitude.toFixed(5)}, ${coordinates.longitude.toFixed(5)}`;
};

const EARTH_RADIUS_METERS = 6_371_000;

export const haversineDistanceMeters = (origin: Coordinates, destination: Coordinates): number => {
  const toRadians = (degrees: number) => (degrees * Math.PI) / 180;
  const latDelta = toRadians(destination.latitude - origin.latitude);
  const lonDelta = toRadians(destination.longitude - origin.longitude);
  const originLat = toRadians(origin.latitude);
  const destinationLat = toRadians(destination.latitude);

  const a =
    Math.sin(latDelta / 2) ** 2 +
    Math.cos(originLat) * Math.cos(destinationLat) * Math.sin(lonDelta / 2) ** 2;

  return EARTH_RADIUS_METERS * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

type RegionInput = {
  latitude: number;
  longitude: number;
};

/** Default map center — Ormoc / Leyte area (OpenStreetMap #map=18/11.052719/124.006913). */
export const DEFAULT_MAP_COORDINATES = {
  latitude: 11.052719,
  longitude: 124.006913,
} as const;

/** ~zoom 18 street-level viewport for the default center. */
export const DEFAULT_MAP_DELTA = 0.0035;

export const regionFromCoordinates = (
  coordinates: RegionInput[],
  paddingFactor = 1.4,
): {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
} => {
  if (coordinates.length === 0) {
    return {
      latitude: DEFAULT_MAP_COORDINATES.latitude,
      longitude: DEFAULT_MAP_COORDINATES.longitude,
      latitudeDelta: DEFAULT_MAP_DELTA,
      longitudeDelta: DEFAULT_MAP_DELTA,
    };
  }

  const latitudes = coordinates.map((point) => point.latitude);
  const longitudes = coordinates.map((point) => point.longitude);
  const minLat = Math.min(...latitudes);
  const maxLat = Math.max(...latitudes);
  const minLon = Math.min(...longitudes);
  const maxLon = Math.max(...longitudes);

  const latitudeDelta = Math.max((maxLat - minLat) * paddingFactor, 0.05);
  const longitudeDelta = Math.max((maxLon - minLon) * paddingFactor, 0.05);

  return {
    latitude: (minLat + maxLat) / 2,
    longitude: (minLon + maxLon) / 2,
    latitudeDelta,
    longitudeDelta,
  };
};
