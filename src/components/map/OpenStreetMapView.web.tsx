import {
  createElement,
  forwardRef,
  useImperativeHandle,
  useMemo,
  useState,
  type CSSProperties,
} from 'react';
import { Text, View, type DimensionValue } from 'react-native';

import { MapStyleToggle } from '@/components/map/MapStyleToggle';
import type {
  MapMarker,
  MapRegion,
  OpenStreetMapViewHandle,
  OpenStreetMapViewProps,
} from '@/components/map/types';
import { mapStyles } from '@/components/map/styles';
import { getMapAttribution, type MapViewMode } from '@/constants/mapTiles';
import { buildMapLibreMapSrcDoc } from '@/utils/mapLibreMapHtml';

export type { MapMarker, MapRegion, OpenStreetMapViewHandle };

const DEFAULT_MAP_HEIGHT = 280;

export const OpenStreetMapView = forwardRef<OpenStreetMapViewHandle, OpenStreetMapViewProps>(
  function OpenStreetMapViewWeb(
    {
      region,
      markers = [],
      showsUserLocation = false,
      userCoordinates = null,
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
    const [internalMapMode, setInternalMapMode] = useState<MapViewMode>('standard');
    const mapMode = mapModeProp ?? internalMapMode;
    const mapHeight = Math.max(height, DEFAULT_MAP_HEIGHT);

    // Web iframe has no inject API; zoom controls are a no-op on web.
    useImperativeHandle(ref, () => ({
      zoomIn: () => undefined,
      zoomOut: () => undefined,
    }));

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
      () => [
        mapStyles.mapContainer,
        fullBleed ? mapStyles.mapContainerFullBleed : null,
        fillContainer
          ? { flex: 1, width: '100%' as DimensionValue }
          : { height: mapHeight, width: '100%' as DimensionValue },
      ],
      [fillContainer, fullBleed, mapHeight],
    );

    const resolvedUserLocation = useMemo(() => {
      if (
        !showsUserLocation ||
        !userCoordinates ||
        !Number.isFinite(userCoordinates.latitude) ||
        !Number.isFinite(userCoordinates.longitude)
      ) {
        return null;
      }

      return {
        latitude: userCoordinates.latitude,
        longitude: userCoordinates.longitude,
      };
    }, [showsUserLocation, userCoordinates]);

    const srcDoc = useMemo(
      () =>
        buildMapLibreMapSrcDoc(
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
          resolvedUserLocation,
        ),
      [mapMode, markers, region, resolvedUserLocation, selectedMarkerId],
    );

    const iframeStyle = useMemo<CSSProperties>(
      () => ({
        border: 0,
        display: 'block',
        height: fillContainer ? '100%' : mapHeight,
        width: '100%',
      }),
      [fillContainer, mapHeight],
    );

    return (
      <View style={containerStyle}>
        {createElement('iframe', {
          key: `${mapMode}-${focusToken}`,
          srcDoc,
          style: iframeStyle,
          title: 'BloodLink map',
        })}

        {showStyleToggle ? (
          <View style={mapStyles.styleToggle}>
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
