import { forwardRef, useMemo } from 'react';

import type {
  MapMarker,
  MapRegion,
  OpenStreetMapViewHandle,
  OpenStreetMapViewProps,
} from '@/components/map/types';
import { OpenStreetMapView as WebViewMap } from '@/components/map/OpenStreetMapView.webview';
import { canUseNativeMapLibre } from '@/utils/canUseNativeMapLibre';

export type { MapMarker, MapRegion, OpenStreetMapViewHandle };

type MapComponent = typeof WebViewMap;

/**
 * Prefer native MapLibre in custom/dev builds.
 * Fall back to MapLibre GL JS in a WebView for Expo Go (no MLRNCameraModule).
 * Resolve lazily so auth/welcome never evaluates the native package at import time.
 */
function resolveMapComponent(): MapComponent {
  // Release APKs were crashing when native MapLibre initialized; keep WebView in
  // production until the native path is verified on device. Dev builds can still
  // use native MapLibre when the TurboModule is linked.
  if (!__DEV__ || !canUseNativeMapLibre()) {
    return WebViewMap;
  }

  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    return require('./OpenStreetMapView.maplibre').OpenStreetMapView as MapComponent;
  } catch (error) {
    console.warn('[map] Native MapLibre failed to load; using WebView fallback.', error);
    return WebViewMap;
  }
}

export const OpenStreetMapView = forwardRef<OpenStreetMapViewHandle, OpenStreetMapViewProps>(
  function OpenStreetMapView(props, ref) {
    const ResolvedMap = useMemo(() => resolveMapComponent(), []);
    return <ResolvedMap {...props} ref={ref} />;
  },
);
