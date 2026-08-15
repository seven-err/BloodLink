import * as Location from 'expo-location';
import { useCallback, useState } from 'react';

import { getHighAccuracyPosition } from '@/services/location/getHighAccuracyPosition';
import type { Coordinates } from '@/services/location/types';

export type ForegroundLocationStatus =
  | 'idle'
  | 'requesting'
  | 'granted'
  | 'denied'
  | 'services_disabled'
  | 'error';

export type ForegroundLocationState = {
  coordinates: Coordinates | null;
  accuracyMeters: number | null;
  status: ForegroundLocationStatus;
  message: string | null;
  canAskAgain: boolean;
};

const initialState: ForegroundLocationState = {
  coordinates: null,
  accuracyMeters: null,
  status: 'idle',
  message: null,
  canAskAgain: true,
};

export const useForegroundLocation = () => {
  const [state, setState] = useState<ForegroundLocationState>(initialState);

  const requestLocation = useCallback(async () => {
    setState((current) => ({
      ...current,
      status: 'requesting',
      message: null,
    }));

    try {
      const permission = await Location.requestForegroundPermissionsAsync();

      if (!permission.granted) {
        const message =
          permission.canAskAgain === false
            ? 'Location permission is disabled. Enable it in device settings to see distances from your position.'
            : 'Location permission denied. You can still browse requests without distance estimates.';

        setState({
          coordinates: null,
          accuracyMeters: null,
          status: 'denied',
          message,
          canAskAgain: permission.canAskAgain,
        });
        return null;
      }

      const servicesEnabled = await Location.hasServicesEnabledAsync();

      if (!servicesEnabled) {
        setState({
          coordinates: null,
          accuracyMeters: null,
          status: 'services_disabled',
          message: 'Location services are off. Enable them to see distances from your position.',
          canAskAgain: permission.canAskAgain,
        });
        return null;
      }

      const currentPosition = await getHighAccuracyPosition();

      const coordinates = {
        latitude: currentPosition.coords.latitude,
        longitude: currentPosition.coords.longitude,
      };

      setState({
        coordinates,
        accuracyMeters: currentPosition.coords.accuracy ?? null,
        status: 'granted',
        message: null,
        canAskAgain: permission.canAskAgain,
      });

      return coordinates;
    } catch {
      setState({
        coordinates: null,
        accuracyMeters: null,
        status: 'error',
        message: 'Unable to read an accurate GPS fix. Move outdoors with a clear sky view, then try again.',
        canAskAgain: true,
      });
      return null;
    }
  }, []);

  const resetLocation = useCallback(() => {
    setState(initialState);
  }, []);

  return {
    ...state,
    requestLocation,
    resetLocation,
  };
};
