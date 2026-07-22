import Constants, { ExecutionEnvironment } from 'expo-constants';
import { Platform } from 'react-native';

import {
  deleteUserPushTokens,
  upsertPushToken,
  type PushPlatform,
} from '@/services/supabase/notificationPreferences';

const resolvePlatform = (): PushPlatform => {
  if (Platform.OS === 'ios') {
    return 'ios';
  }

  if (Platform.OS === 'android') {
    return 'android';
  }

  return 'web';
};

/** Expo Go (store client) cannot register Android remote push since SDK 53. */
export const isExpoGoClient = () =>
  Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

/** True when this binary can register Expo remote push tokens. */
export const isRemotePushSupported = () => {
  if (Platform.OS === 'web') {
    return false;
  }

  return !isExpoGoClient();
};

/**
 * Registers an Expo push token when the user has push enabled.
 * Skips loading `expo-notifications` in Expo Go to avoid SDK 53+ warnings.
 */
export const syncPushRegistration = async (userId: string, pushEnabled: boolean) => {
  if (!pushEnabled) {
    await deleteUserPushTokens(userId);
    return { error: null as Error | null, skippedInExpoGo: false };
  }

  if (!isRemotePushSupported()) {
    return {
      error: null as Error | null,
      skippedInExpoGo: isExpoGoClient(),
    };
  }

  // Dynamic import keeps Expo Go from loading expo-notifications at all.
  const Notifications = await import('expo-notifications');

  const permission = await Notifications.getPermissionsAsync();
  let status = permission.status;

  if (status !== 'granted') {
    const requested = await Notifications.requestPermissionsAsync();
    status = requested.status;
  }

  if (status !== 'granted') {
    return {
      error: new Error('Push notification permission was denied on this device.'),
      skippedInExpoGo: false,
    };
  }

  try {
    const pushToken = await Notifications.getExpoPushTokenAsync();
    const { error } = await upsertPushToken(userId, pushToken.data, resolvePlatform());

    if (error) {
      return { error: new Error(error.message), skippedInExpoGo: false };
    }

    return { error: null as Error | null, skippedInExpoGo: false };
  } catch (error) {
    return {
      error:
        error instanceof Error
          ? error
          : new Error('Unable to register for push notifications on this device.'),
      skippedInExpoGo: false,
    };
  }
};
