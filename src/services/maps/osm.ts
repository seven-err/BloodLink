import { env } from '@/config/env';
import type {
  Coordinates,
  GeocodingResult,
  RouteResult,
} from '@/services/location/types';

type NominatimPlace = {
  display_name: string;
  lat: string;
  lon: string;
  boundingbox?: string[];
};

type OsrmRoute = {
  distance: number;
  duration: number;
  geometry?: string;
};

const jsonHeaders = {
  Accept: 'application/json',
  'User-Agent': env.osmUserAgent,
};

export const geocodeAddress = async (
  query: string,
): Promise<GeocodingResult[]> => {
  const url = new URL('/search', env.nominatimBaseUrl);
  url.searchParams.set('q', query);
  url.searchParams.set('format', 'jsonv2');
  url.searchParams.set('limit', '10');

  const response = await fetch(url.toString(), { headers: jsonHeaders });

  if (!response.ok) {
    throw new Error(`Nominatim geocoding failed: ${response.status}`);
  }

  const places = (await response.json()) as NominatimPlace[];

  return places.map((place) => ({
    displayName: place.display_name,
    coordinates: {
      latitude: Number(place.lat),
      longitude: Number(place.lon),
    },
    boundingBox: place.boundingbox,
    raw: place,
  }));
};

export const reverseGeocode = async ({
  latitude,
  longitude,
}: Coordinates): Promise<GeocodingResult> => {
  const url = new URL('/reverse', env.nominatimBaseUrl);
  url.searchParams.set('lat', String(latitude));
  url.searchParams.set('lon', String(longitude));
  url.searchParams.set('format', 'jsonv2');

  const response = await fetch(url.toString(), { headers: jsonHeaders });

  if (!response.ok) {
    throw new Error(`Nominatim reverse geocoding failed: ${response.status}`);
  }

  const place = (await response.json()) as NominatimPlace;

  return {
    displayName: place.display_name,
    coordinates: {
      latitude: Number(place.lat),
      longitude: Number(place.lon),
    },
    boundingBox: place.boundingbox,
    raw: place,
  };
};

export const calculateRoute = async (
  origin: Coordinates,
  destination: Coordinates,
): Promise<RouteResult> => {
  const coordinates = [
    `${origin.longitude},${origin.latitude}`,
    `${destination.longitude},${destination.latitude}`,
  ].join(';');
  const url = new URL(`/route/v1/driving/${coordinates}`, env.osrmBaseUrl);
  url.searchParams.set('overview', 'false');

  const response = await fetch(url.toString(), { headers: jsonHeaders });

  if (!response.ok) {
    throw new Error(`OSRM route calculation failed: ${response.status}`);
  }

  const body = (await response.json()) as { routes?: OsrmRoute[] };
  const route = body.routes?.[0];

  if (!route) {
    throw new Error('OSRM returned no route');
  }

  return {
    distanceMeters: route.distance,
    durationSeconds: route.duration,
    geometry: route.geometry,
    raw: route,
  };
};
