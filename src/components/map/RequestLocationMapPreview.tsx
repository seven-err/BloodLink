import { useMemo } from 'react';
import { Text, View } from 'react-native';

import { OpenStreetMapView } from '@/components/map/OpenStreetMapView';
import { recipientStyles } from '@/screens/recipient/styles';
import {
  approximateCoordinates,
  formatApproximateCoordinates,
  getValidCoordinates,
  regionFromCoordinates,
} from '@/utils/coordinates';

type RequestLocationMapPreviewProps = {
  latitude: number | null;
  longitude: number | null;
  approximate?: boolean;
  title?: string;
  subtitle?: string;
};

export function RequestLocationMapPreview({
  latitude,
  longitude,
  approximate = false,
  title = 'Request location',
  subtitle,
}: RequestLocationMapPreviewProps) {
  const displayCoordinates = useMemo(() => {
    const coordinates = getValidCoordinates(latitude, longitude);

    if (!coordinates) {
      return null;
    }

    return approximate ? approximateCoordinates(coordinates.latitude, coordinates.longitude) : coordinates;
  }, [approximate, latitude, longitude]);

  const region = useMemo(
    () =>
      displayCoordinates
        ? regionFromCoordinates([displayCoordinates], 1.2)
        : regionFromCoordinates([]),
    [displayCoordinates],
  );

  if (!displayCoordinates) {
    return (
      <View style={recipientStyles.card}>
        <Text style={recipientStyles.eyebrow}>Location</Text>
        <Text style={recipientStyles.title}>{title}</Text>
        <Text style={recipientStyles.subtitle}>
          {subtitle ?? 'No coordinates were saved for this request.'}
        </Text>
      </View>
    );
  }

  const coordinateLabel = approximate
    ? formatApproximateCoordinates(latitude, longitude)
    : `${displayCoordinates.latitude.toFixed(5)}, ${displayCoordinates.longitude.toFixed(5)}`;

  return (
    <View style={recipientStyles.card}>
      <Text style={recipientStyles.eyebrow}>Location</Text>
      <Text style={recipientStyles.title}>{title}</Text>
      <Text style={recipientStyles.subtitle}>
        {subtitle ??
          (approximate
            ? 'Approximate area only. Exact address and contact details stay hidden until you are matched.'
            : 'Preview of where this request was placed.')}
      </Text>
      <Text style={recipientStyles.meta}>{coordinateLabel}</Text>
      <OpenStreetMapView
        height={220}
        markers={[
          {
            id: 'request-location',
            coordinates: displayCoordinates,
            title,
            description: coordinateLabel,
          },
        ]}
        region={region}
      />
    </View>
  );
}
