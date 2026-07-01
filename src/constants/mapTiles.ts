import { env } from '@/config/env';

export type MapViewMode = 'standard' | 'satellite';

/** Carto/OSM street tiles — allowed for app use (not tile.openstreetmap.org). */
export const MAP_TILE_URL =
  process.env.EXPO_PUBLIC_MAP_TILE_URL ??
  'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png';

export const MAP_TILE_ATTRIBUTION = `© OpenStreetMap contributors · CARTO · ${env.osmUserAgent}`;

/** Esri World Imagery — satellite tiles for web Leaflet. */
export const SATELLITE_TILE_URL =
  process.env.EXPO_PUBLIC_SATELLITE_TILE_URL ??
  'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';

export const SATELLITE_TILE_ATTRIBUTION = `© Esri · ${env.osmUserAgent}`;

export const getMapAttribution = (mapMode: MapViewMode) =>
  mapMode === 'satellite' ? SATELLITE_TILE_ATTRIBUTION : MAP_TILE_ATTRIBUTION;
