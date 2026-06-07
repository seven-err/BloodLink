import { useMemo } from 'react';
import { Platform, Text, View } from 'react-native';
import MapView, { Marker, UrlTile, type Region } from 'react-native-maps';

import { mapStyles } from '@/components/map/styles';
import type { Coordinates } from '@/services/location/types';
import { formatApproximateCoordinates } from '@/utils/coordinates';

const OSM_TILE_URL = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';

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
};

export function OpenStreetMapView({
  region,
  markers = [],
  showsUserLocation = false,
  onMarkerPress,
  selectedMarkerId = null,
  height,
}: OpenStreetMapViewProps) {
  const containerStyle = useMemo(
    () => [mapStyles.mapContainer, height ? { height } : mapStyles.map],
    [height],
  );

  if (Platform.OS === 'web') {
    const firstMarker = markers[0];

    return (
      <View style={containerStyle}>
        <View style={mapStyles.mapFallback}>
          <Text style={mapStyles.calloutTitle}>Map preview unavailable on web</Text>
          <Text style={mapStyles.mapFallbackText}>
            {firstMarker
              ? `${firstMarker.title}${firstMarker.description ? ` · ${firstMarker.description}` : ''}`
              : 'Open this screen in the mobile app to view the OpenStreetMap view.'}
          </Text>
          {firstMarker ? (
            <Text style={mapStyles.mapFallbackText}>
              {formatApproximateCoordinates(
                firstMarker.coordinates.latitude,
                firstMarker.coordinates.longitude,
              )}
            </Text>
          ) : null}
        </View>
      </View>
    );
  }

  return (
    <View style={containerStyle}>
      <MapView
        initialRegion={region}
        showsUserLocation={showsUserLocation}
        style={mapStyles.map}
      >
        <UrlTile flipY={false} maximumZ={19} urlTemplate={OSM_TILE_URL} />
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
    </View>
  );
}
