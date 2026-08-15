import type { Coordinates } from '@/services/location/types';
import type { MapViewMode } from '@/constants/mapTiles';

export type MapRegion = {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
};

export type MapMarker = {
  id: string;
  coordinates: Coordinates;
  title: string;
  description?: string;
  pinColor?: string;
};

export type OpenStreetMapViewHandle = {
  zoomIn: () => void;
  zoomOut: () => void;
};

export type OpenStreetMapViewProps = {
  region: MapRegion;
  markers?: MapMarker[];
  /** When true with native MapLibre, shows the live GPS puck. */
  showsUserLocation?: boolean;
  /**
   * Explicit user coordinates for WebView/web maps (Expo Go),
   * which cannot use the native UserLocation module.
   */
  userCoordinates?: Coordinates | null;
  onMarkerPress?: (markerId: string) => void;
  onMapPress?: () => void;
  selectedMarkerId?: string | null;
  height?: number;
  fillContainer?: boolean;
  fullBleed?: boolean;
  focusToken?: number;
  mapMode?: MapViewMode;
  onMapModeChange?: (mode: MapViewMode) => void;
  showStyleToggle?: boolean;
  showAttribution?: boolean;
};
