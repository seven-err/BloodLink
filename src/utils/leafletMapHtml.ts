import {
  getMapAttribution,
  MAP_TILE_URL,
  SATELLITE_TILE_URL,
  type MapViewMode,
} from '@/constants/mapTiles';

type LeafletMarker = {
  id: string;
  latitude: number;
  longitude: number;
  title: string;
  description?: string;
  pinColor?: string;
};

type LeafletRegion = {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
};

const regionToZoom = (latitudeDelta: number) => {
  const safeDelta = Math.max(latitudeDelta, 0.01);
  return Math.min(18, Math.max(4, Math.round(Math.log2(360 / safeDelta) - 1)));
};

export const buildLeafletMapHtml = (
  region: LeafletRegion,
  markers: LeafletMarker[],
  selectedMarkerId: string | null = null,
  mapMode: MapViewMode = 'standard',
) => {
  const zoom = regionToZoom(region.latitudeDelta);
  const markersJson = JSON.stringify(
    markers.map((marker) => ({
      ...marker,
      selected: marker.id === selectedMarkerId,
    })),
  );
  const tileUrl = mapMode === 'satellite' ? SATELLITE_TILE_URL : MAP_TILE_URL;
  const attribution = getMapAttribution(mapMode);
  const tileOptions =
    mapMode === 'satellite'
      ? `{ maxZoom: 19, attribution: ${JSON.stringify(attribution)} }`
      : `{ subdomains: 'abcd', maxZoom: 20, attribution: ${JSON.stringify(attribution)} }`;

  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
    <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
    <style>
      html, body, #map { margin: 0; height: 100%; width: 100%; background: #e5e7eb; }
      .leaflet-control-attribution { font-size: 10px; }
    </style>
  </head>
  <body>
    <div id="map"></div>
    <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
    <script>
      const region = ${JSON.stringify(region)};
      const markers = ${markersJson};
      const zoom = ${zoom};
      const map = L.map('map', { zoomControl: true, attributionControl: true }).setView(
        [region.latitude, region.longitude],
        zoom,
      );

      L.tileLayer(${JSON.stringify(tileUrl)}, ${tileOptions}).addTo(map);

      const bounds = [];
      markers.forEach((marker) => {
        const color = marker.pinColor || (marker.selected ? '#b91c1c' : '#dc2626');
        const icon = L.divIcon({
          className: '',
          html: '<div style="width:14px;height:14px;border-radius:999px;background:' + color + ';border:2px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,.35);"></div>',
          iconSize: [14, 14],
          iconAnchor: [7, 7],
        });
        const leafletMarker = L.marker([marker.latitude, marker.longitude], { icon }).addTo(map);
        const label = marker.description
          ? marker.title + ' · ' + marker.description
          : marker.title;
        leafletMarker.bindPopup(label);
        bounds.push([marker.latitude, marker.longitude]);
      });

      if (bounds.length > 0) {
        map.fitBounds(bounds, { padding: [28, 28], maxZoom: Math.max(zoom, 14) });
      }
    </script>
  </body>
</html>`;
};

export const buildLeafletMapSrcDoc = (
  region: LeafletRegion,
  markers: LeafletMarker[],
  selectedMarkerId: string | null = null,
  mapMode: MapViewMode = 'standard',
) => buildLeafletMapHtml(region, markers, selectedMarkerId, mapMode);
