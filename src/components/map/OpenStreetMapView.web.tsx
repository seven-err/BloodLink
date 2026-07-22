import { createElement, useMemo, useState, type CSSProperties } from 'react';
import { Text, View, type DimensionValue } from 'react-native';
import type { Region } from 'react-native-maps';

import { MapStyleToggle } from '@/components/map/MapStyleToggle';
import { mapStyles } from '@/components/map/styles';
import { getMapAttribution, type MapViewMode } from '@/constants/mapTiles';
import type { Coordinates } from '@/services/location/types';
import { buildLeafletMapSrcDoc } from '@/utils/leafletMapHtml';

export type MapMarker = {
  id: string;
  coordinates: Coordinates;
  title: string;
  description?: string;
  pinColor?: string;
};

type OpenStreetMapViewProps = {
  region: Region;
  markers?: MapMarker[];
  showsUserLocation?: boolean;
  onMarkerPress?: (markerId: string) => void;
  selectedMarkerId?: string | null;
  height?: number;
  /** Accepted for API parity with native; web remounts via region srcDoc. */
  focusToken?: number;
  mapMode?: MapViewMode;
  onMapModeChange?: (mode: MapViewMode) => void;
  showStyleToggle?: boolean;
};

const DEFAULT_MAP_HEIGHT = 280;

export function OpenStreetMapView({
  region,
  markers = [],
  selectedMarkerId = null,
  height = DEFAULT_MAP_HEIGHT,
  mapMode: mapModeProp,
  onMapModeChange,
  showStyleToggle = true,
}: OpenStreetMapViewProps) {
  const [internalMapMode, setInternalMapMode] = useState<MapViewMode>('standard');
  const mapMode = mapModeProp ?? internalMapMode;
  const mapHeight = Math.max(height, DEFAULT_MAP_HEIGHT);

  const setMapMode = (nextMode: MapViewMode) => {
    if (onMapModeChange) {
      onMapModeChange(nextMode);
      return;
    }

    setInternalMapMode(nextMode);
  };

  const toggleMapMode = () => {
    setMapMode(mapMode === 'satellite' ? 'standard' : 'satellite');
  };

  const containerStyle = useMemo(
    () => [mapStyles.mapContainer, { height: mapHeight, width: '100%' as DimensionValue }],
    [mapHeight],
  );

  const srcDoc = useMemo(
    () =>
      buildLeafletMapSrcDoc(
        region,
        markers.map((marker) => ({
          id: marker.id,
          latitude: marker.coordinates.latitude,
          longitude: marker.coordinates.longitude,
          title: marker.title,
          description: marker.description,
          pinColor: marker.pinColor,
        })),
        selectedMarkerId,
        mapMode,
      ),
    [mapMode, markers, region, selectedMarkerId],
  );

  const iframeStyle = useMemo<CSSProperties>(
    () => ({
      border: 0,
      display: 'block',
      height: mapHeight,
      width: '100%',
    }),
    [mapHeight],
  );

  return (
    <View style={containerStyle}>
      {createElement('iframe', {
        key: mapMode,
        srcDoc,
        style: iframeStyle,
        title: 'BloodLink map',
      })}

      {showStyleToggle ? (
        <View style={mapStyles.styleToggle}>
          <MapStyleToggle mapMode={mapMode} onToggle={toggleMapMode} />
        </View>
      ) : null}

      <View pointerEvents="none" style={mapStyles.attributionBar}>
        <Text style={mapStyles.attributionText}>{getMapAttribution(mapMode)}</Text>
      </View>
    </View>
  );
}
