import { Linking, Platform } from 'react-native';

type LocationParams = {
  latitude: number;
  longitude: number;
  label?: string;
};

/**
  Opens native turn-by-turn map directions to the specified coordinates.
  - Android: Google Maps direction URL with fallback to geo: URI scheme
  - iOS: Apple Maps / Google Maps URL
  - Web: Google Maps direction URL
 */
export async function openMapDirections({ latitude, longitude, label = 'Location' }: LocationParams): Promise<void> {
  const encodedLabel = encodeURIComponent(label);

  const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`;
  const appleMapsUrl = `https://maps.apple.com/?daddr=${latitude},${longitude}&dirflg=d`;
  const geoUrl = `geo:${latitude},${longitude}?q=${latitude},${longitude}(${encodedLabel})`;

  try {
    if (Platform.OS === 'ios') {
      const canOpenApple = await Linking.canOpenURL(appleMapsUrl);
      if (canOpenApple) {
        await Linking.openURL(appleMapsUrl);
        return;
      }
    } else if (Platform.OS === 'android') {
      const canOpenGeo = await Linking.canOpenURL(geoUrl);
      if (canOpenGeo) {
        await Linking.openURL(geoUrl);
        return;
      }
    }

    // Default web / fallback
    await Linking.openURL(googleMapsUrl);
  } catch (error) {
    console.warn('[mapDirections] Failed to launch map directions:', error);
    // Final fallback attempt
    await Linking.openURL(googleMapsUrl);
  }
}
