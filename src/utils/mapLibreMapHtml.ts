import {
  getMapLibreStyle,
  regionToZoom,
  type MapViewMode,
} from '@/constants/mapTiles';

type MapLibreMarker = {
  id: string;
  latitude: number;
  longitude: number;
  title: string;
  description?: string;
  pinColor?: string;
};

type MapLibreRegion = {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
};

const MIN_ZOOM = 4;
const MAX_ZOOM = 18;

type MapLibreUserLocation = {
  latitude: number;
  longitude: number;
} | null;

export const buildMapLibreMapHtml = (
  region: MapLibreRegion,
  markers: MapLibreMarker[],
  selectedMarkerId: string | null = null,
  mapMode: MapViewMode = 'standard',
  userLocation: MapLibreUserLocation = null,
) => {
  const zoom = regionToZoom(region.latitudeDelta);
  const markersJson = JSON.stringify(
    markers.map((marker) => ({
      ...marker,
      selected: marker.id === selectedMarkerId,
    })),
  );
  const styleJson = JSON.stringify(getMapLibreStyle(mapMode));
  const userLocationJson = JSON.stringify(userLocation);

  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
    <link rel="stylesheet" href="https://unpkg.com/maplibre-gl@4.7.1/dist/maplibre-gl.css" />
    <style>
      html, body, #map { margin: 0; height: 100%; width: 100%; background: #e5e7eb; }
      .maplibregl-ctrl-attrib { display: none; }
      .maplibregl-ctrl-top-right { display: none; }
      .marker-dot {
        width: 14px;
        height: 14px;
        border-radius: 999px;
        border: 2px solid #fff;
        box-shadow: 0 1px 4px rgba(0,0,0,.35);
        cursor: pointer;
      }
      .user-location {
        position: relative;
        width: 18px;
        height: 18px;
      }
      .user-location-pulse {
        position: absolute;
        inset: -8px;
        border-radius: 999px;
        background: rgba(59, 130, 246, 0.28);
        animation: user-pulse 1.8s ease-out infinite;
      }
      .user-location-dot {
        position: absolute;
        inset: 0;
        border-radius: 999px;
        background: #3b82f6;
        border: 2.5px solid #fff;
        box-shadow: 0 1px 6px rgba(30, 64, 175, 0.45);
      }
      @keyframes user-pulse {
        0% { transform: scale(0.7); opacity: 0.85; }
        100% { transform: scale(1.55); opacity: 0; }
      }
    </style>
  </head>
  <body>
    <div id="map"></div>
    <script src="https://unpkg.com/maplibre-gl@4.7.1/dist/maplibre-gl.js"></script>
    <script>
      const region = ${JSON.stringify(region)};
      const markers = ${markersJson};
      const zoom = ${zoom};
      const style = ${styleJson};
      const userLocation = ${userLocationJson};
      const minZoom = ${MIN_ZOOM};
      const maxZoom = ${MAX_ZOOM};

      function post(payload) {
        try {
          if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
            window.ReactNativeWebView.postMessage(JSON.stringify(payload));
          }
        } catch (e) {}
      }

      const map = new maplibregl.Map({
        container: 'map',
        style: style,
        center: [region.longitude, region.latitude],
        zoom: zoom,
        minZoom: minZoom,
        maxZoom: maxZoom,
        attributionControl: false,
      });

      window.__bloodlinkZoom = function(delta) {
        const next = Math.min(maxZoom, Math.max(minZoom, map.getZoom() + delta));
        map.easeTo({ zoom: next, duration: 220 });
      };

      map.on('click', function() {
        post({ type: 'mapPress' });
      });

      markers.forEach(function(marker) {
        const color = marker.pinColor || (marker.selected ? '#b91c1c' : '#dc2626');
        const el = document.createElement('div');
        el.className = 'marker-dot';
        el.style.background = color;
        if (marker.selected) {
          el.style.transform = 'scale(1.25)';
        }
        el.addEventListener('click', function(event) {
          event.stopPropagation();
          post({ type: 'markerPress', id: marker.id });
        });
        new maplibregl.Marker({ element: el })
          .setLngLat([marker.longitude, marker.latitude])
          .addTo(map);
      });

      if (userLocation && Number.isFinite(userLocation.latitude) && Number.isFinite(userLocation.longitude)) {
        const el = document.createElement('div');
        el.className = 'user-location';
        el.setAttribute('aria-label', 'Your location');
        const pulse = document.createElement('div');
        pulse.className = 'user-location-pulse';
        const dot = document.createElement('div');
        dot.className = 'user-location-dot';
        el.appendChild(pulse);
        el.appendChild(dot);
        new maplibregl.Marker({ element: el, anchor: 'center' })
          .setLngLat([userLocation.longitude, userLocation.latitude])
          .addTo(map);
      }
    </script>
  </body>
</html>`;
};

export const buildMapLibreMapSrcDoc = (
  region: MapLibreRegion,
  markers: MapLibreMarker[],
  selectedMarkerId: string | null = null,
  mapMode: MapViewMode = 'standard',
  userLocation: MapLibreUserLocation = null,
) => buildMapLibreMapHtml(region, markers, selectedMarkerId, mapMode, userLocation);
