import * as Location from 'expo-location';
import { useCallback, useState } from 'react';

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
  status: ForegroundLocationStatus;
  message: string | null;
  canAskAgain: boolean;
};

const initialState: ForegroundLocationState = {
  coordinates: null,
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
          status: 'services_disabled',
          message: 'Location services are off. Enable them to see distances from your position.',
          canAskAgain: permission.canAskAgain,
        });
        return null;
      }

      const currentPosition = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const coordinates = {
        latitude: currentPosition.coords.latitude,
        longitude: currentPosition.coords.longitude,
      };

      setState({
        coordinates,
        status: 'granted',
        message: null,
        canAskAgain: permission.canAskAgain,
      });

      return coordinates;
    } catch {
      setState({
        coordinates: null,
        status: 'error',
        message: 'Unable to read your location. You can still browse requests on the map.',
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
