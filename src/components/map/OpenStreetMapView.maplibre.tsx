import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react';
import { StyleSheet, Text, View, type DimensionValue } from 'react-native';
import {
  Camera,
  Map,
  Marker,
  UserLocation,
  type CameraRef,
  type StyleSpecification,
} from '@maplibre/maplibre-react-native';

import { MapStyleToggle } from '@/components/map/MapStyleToggle';
import type {
  OpenStreetMapViewHandle,
  OpenStreetMapViewProps,
} from '@/components/map/types';
import { mapStyles } from '@/components/map/styles';
import { colors, radii } from '@/constants/theme';
import {
  getMapAttribution,
  getMapLibreStyle,
  regionToZoom,
  type MapViewMode,
} from '@/constants/mapTiles';

const DEFAULT_MAP_HEIGHT = 280;
const MIN_ZOOM = 4;
const MAX_ZOOM = 18;

/** Native MapLibre implementation — only load when MLRNCameraModule is available. */
export const OpenStreetMapView = forwardRef<OpenStreetMapViewHandle, OpenStreetMapViewProps>(
  function OpenStreetMapViewMapLibre(
    {
      region,
      markers = [],
      showsUserLocation = false,
      onMarkerPress,
      onMapPress,
      selectedMarkerId = null,
      height = DEFAULT_MAP_HEIGHT,
      fillContainer = false,
      fullBleed = false,
      focusToken = 0,
      mapMode: mapModeProp,
      onMapModeChange,
      showStyleToggle = true,
      showAttribution = false,
    },
    ref,
  ) {
    const cameraRef = useRef<CameraRef>(null);
    const zoomRef = useRef(regionToZoom(region.latitudeDelta));
    const [internalMapMode, setInternalMapMode] = useState<MapViewMode>('standard');
    const mapMode = mapModeProp ?? internalMapMode;
    const mapHeight = Math.max(height, DEFAULT_MAP_HEIGHT);
    const mapStyle = useMemo(
      () => getMapLibreStyle(mapMode) as string | StyleSpecification,
      [mapMode],
    );

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

    const zoomBy = (delta: number) => {
      const nextZoom = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, zoomRef.current + delta));
      zoomRef.current = nextZoom;
      cameraRef.current?.zoomTo(nextZoom, { duration: 220 });
    };

    useImperativeHandle(ref, () => ({
      zoomIn: () => zoomBy(1),
      zoomOut: () => zoomBy(-1),
    }));

    useEffect(() => {
      const nextZoom = regionToZoom(region.latitudeDelta);
      zoomRef.current = nextZoom;
      cameraRef.current?.easeTo({
        center: [region.longitude, region.latitude],
        zoom: nextZoom,
        duration: 280,
      });
    }, [focusToken, region.latitude, region.longitude, region.latitudeDelta]);

    const containerStyle = useMemo(
      () => [
        mapStyles.mapContainer,
        fullBleed ? mapStyles.mapContainerFullBleed : null,
        fillContainer
          ? StyleSheet.absoluteFill
          : { height: mapHeight, width: '100%' as DimensionValue },
      ],
      [fillContainer, fullBleed, mapHeight],
    );

    return (
      <View pointerEvents="box-none" style={containerStyle}>
        <Map
          attribution={showAttribution}
          compass={false}
          logo={false}
          mapStyle={mapStyle}
          style={fillContainer ? styles.mapFill : { height: mapHeight, width: '100%' }}
          touchPitch={false}
          touchRotate={false}
          onPress={onMapPress}
        >
          <Camera
            ref={cameraRef}
            initialViewState={{
              center: [region.longitude, region.latitude],
              zoom: regionToZoom(region.latitudeDelta),
            }}
            maxZoom={MAX_ZOOM}
            minZoom={MIN_ZOOM}
          />

          {showsUserLocation ? (
            <UserLocation accuracy animated heading minDisplacement={2} />
          ) : null}

          {markers.map((marker) => {
            const isSelected = selectedMarkerId === marker.id;
            const pinColor =
              marker.pinColor ?? (isSelected ? colors.primaryDark : colors.primary);

            return (
              <Marker
                key={marker.id}
                id={marker.id}
                lngLat={[marker.coordinates.longitude, marker.coordinates.latitude]}
                onPress={() => onMarkerPress?.(marker.id)}
              >
                <View
                  style={[
                    styles.markerDot,
                    {
                      backgroundColor: pinColor,
                      transform: [{ scale: isSelected ? 1.25 : 1 }],
                    },
                  ]}
                />
              </Marker>
            );
          })}
        </Map>

        {showStyleToggle ? (
          <View pointerEvents="box-none" style={mapStyles.styleToggle}>
            <MapStyleToggle mapMode={mapMode} onToggle={toggleMapMode} />
          </View>
        ) : null}

        {showAttribution ? (
          <View pointerEvents="none" style={mapStyles.attributionBar}>
            <Text style={mapStyles.attributionText}>{getMapAttribution(mapMode)}</Text>
          </View>
        ) : null}
      </View>
    );
  },
);

const styles = StyleSheet.create({
  mapFill: {
    ...StyleSheet.absoluteFill,
  },
  markerDot: {
    borderColor: colors.card,
    borderRadius: radii.pill,
    borderWidth: 2,
    height: 16,
    width: 16,
  },
});
