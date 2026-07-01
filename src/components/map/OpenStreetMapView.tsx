import { useEffect, useMemo, useRef, useState } from 'react';
import { Platform, StyleSheet, Text, View, type DimensionValue } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE, type MapType, type Region } from 'react-native-maps';

import { MapStyleToggle } from '@/components/map/MapStyleToggle';
import { mapStyles } from '@/components/map/styles';
import { getMapAttribution, type MapViewMode } from '@/constants/mapTiles';
import type { Coordinates } from '@/services/location/types';

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
  mapMode?: MapViewMode;
  onMapModeChange?: (mode: MapViewMode) => void;
  showStyleToggle?: boolean;
};

const DEFAULT_MAP_HEIGHT = 280;

const getNativeMapType = (mapMode: MapViewMode): MapType => {
  if (mapMode === 'satellite') {
    return Platform.OS === 'ios' ? 'hybrid' : 'satellite';
  }

  return 'standard';
};

export function OpenStreetMapView({
  region,
  markers = [],
  showsUserLocation = false,
  onMarkerPress,
  selectedMarkerId = null,
  height = DEFAULT_MAP_HEIGHT,
  mapMode: mapModeProp,
  onMapModeChange,
  showStyleToggle = true,
}: OpenStreetMapViewProps) {
  const mapRef = useRef<MapView>(null);
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

  const mapStyle = useMemo(
    () => [styles.mapSurface, { height: mapHeight, width: '100%' as DimensionValue }],
    [mapHeight],
  );

  const nativeMapType = useMemo(() => getNativeMapType(mapMode), [mapMode]);

  useEffect(() => {
    mapRef.current?.animateToRegion(region, 280);
  }, [region]);

  return (
    <View style={containerStyle}>
      <MapView
        ref={mapRef}
        initialRegion={region}
        mapType={nativeMapType}
        provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
        rotateEnabled={false}
        pitchEnabled={false}
        scrollEnabled
        showsMyLocationButton={false}
        showsUserLocation={showsUserLocation}
        style={mapStyle}
        zoomEnabled
      >
        {markers.map((marker) => (
          <Marker
            key={marker.id}
            coordinate={marker.coordinates}
            description={marker.description}
            pinColor={marker.pinColor ?? (selectedMarkerId === marker.id ? '#b91c1c' : '#e50914')}
            title={marker.title}
            onPress={() => onMarkerPress?.(marker.id)}
          />
        ))}
      </MapView>

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

const styles = StyleSheet.create({
  mapSurface: {
    borderRadius: 16,
  },
});
