import { env } from '@/config/env';

export type MapViewMode = 'standard' | 'satellite';

/**
 * Free OSM vector style for MapLibre (OpenFreeMap — OpenStreetMap data).
 * @see https://openfreemap.org
 */
export const MAPLIBRE_STREETS_STYLE_URL =
  process.env.EXPO_PUBLIC_MAPLIBRE_STYLE_URL ??
  'https://tiles.openfreemap.org/styles/liberty';

/** Esri World Imagery raster template (OSM has no official satellite layer). */
const ESRI_SATELLITE_TILE_URL =
  process.env.EXPO_PUBLIC_SATELLITE_TILE_URL ??
  'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';

const normalizeTileUrl = (url: string) => url.replace('{s}', 'a').replace('{r}', '');

/** Inline MapLibre style for satellite raster tiles. */
export const MAPLIBRE_SATELLITE_STYLE = {
  version: 8 as const,
  name: 'BloodLink Satellite',
  sources: {
    satellite: {
      type: 'raster' as const,
      tiles: [normalizeTileUrl(ESRI_SATELLITE_TILE_URL)],
      tileSize: 256,
      attribution: '© Esri',
      maxzoom: 19,
    },
  },
  layers: [
    {
      id: 'satellite',
      type: 'raster' as const,
      source: 'satellite',
    },
  ],
};

export const getMapLibreStyle = (mapMode: MapViewMode): string | typeof MAPLIBRE_SATELLITE_STYLE => {
  if (mapMode === 'satellite') {
    return MAPLIBRE_SATELLITE_STYLE;
  }

  return MAPLIBRE_STREETS_STYLE_URL;
};

/** Raster fallback helpers (web Leaflet / legacy). */
export const getMapTileUrl = (mapMode: MapViewMode): string => {
  if (mapMode === 'satellite') {
    return normalizeTileUrl(ESRI_SATELLITE_TILE_URL);
  }

  return normalizeTileUrl(
    process.env.EXPO_PUBLIC_MAP_TILE_URL ??
      'https://a.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png',
  );
};

export const MAP_TILE_ATTRIBUTION = `© OpenStreetMap contributors · OpenFreeMap · ${env.osmUserAgent}`;
export const SATELLITE_TILE_ATTRIBUTION = `© Esri · ${env.osmUserAgent}`;

export const getMapAttribution = (mapMode: MapViewMode) =>
  mapMode === 'satellite' ? SATELLITE_TILE_ATTRIBUTION : MAP_TILE_ATTRIBUTION;

export const getNativeTileUrlTemplate = (mapMode: MapViewMode) => getMapTileUrl(mapMode);

/** Convert a latitudeDelta viewport into an approximate MapLibre zoom. */
export const regionToZoom = (latitudeDelta: number) => {
  const safeDelta = Math.max(latitudeDelta, 0.0005);
  return Math.min(18, Math.max(4, Math.log2(360 / safeDelta) - 1));
};
