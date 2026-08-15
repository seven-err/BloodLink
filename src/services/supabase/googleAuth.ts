import { TurboModuleRegistry } from 'react-native';

import { env } from '@/config/env';

import { supabase } from './client';
import type { GoogleSignInResult } from './googleAuth.types';

export type { GoogleSignInResult } from './googleAuth.types';

type NativeGoogleSignInModule = typeof import('@react-native-google-signin/google-signin');

let configured = false;
let nativeModule: NativeGoogleSignInModule | null | undefined;

/** True when the native RNGoogleSignin TurboModule is linked in this binary. */
const isNativeGoogleSignInAvailable = () =>
  TurboModuleRegistry.get('RNGoogleSignin') != null;

const loadNativeGoogleSignIn = (): NativeGoogleSignInModule | null => {
  if (nativeModule !== undefined) {
    return nativeModule;
  }

  if (!isNativeGoogleSignInAvailable()) {
    nativeModule = null;
    return null;
  }

  // Lazy require so binaries without the module never hit getEnforcing at import time.
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  nativeModule = require('@react-native-google-signin/google-signin') as NativeGoogleSignInModule;
  return nativeModule;
};

const ensureGoogleSignInConfigured = (GoogleSignin: NativeGoogleSignInModule['GoogleSignin']) => {
  if (configured) {
    return;
  }

  if (!env.googleWebClientId) {
    throw new Error(
      'Missing EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID. Use the Web client ID from Google Cloud Console (required for the ID token).',
    );
  }

  GoogleSignin.configure({
    webClientId: env.googleWebClientId,
    iosClientId: env.googleIosClientId,
    offlineAccess: false,
  });

  configured = true;
};

/**
 * In-app Google account picker (native SDK).
 * Requires a development/production build with @react-native-google-signin linked —
 * not Expo Go and not an older APK built before the plugin was added.
 */
export const signInWithGooglePlatform = async (): Promise<GoogleSignInResult> => {
  const native = loadNativeGoogleSignIn();

  if (!native) {
    return {
      data: null,
      error: new Error(
        'In-app Google Sign-In is not in this app binary. Install a fresh development build (eas build -p android --profile development, or npx expo run:android), then open that app — not Expo Go.',
      ),
    };
  }

  const { GoogleSignin, isErrorWithCode, isSuccessResponse, statusCodes } = native;

  try {
    ensureGoogleSignInConfigured(GoogleSignin);
    await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });

    const response = await GoogleSignin.signIn();

    if (!isSuccessResponse(response)) {
      return { cancelled: true, data: null, error: null };
    }

    const idToken = response.data.idToken;

    if (!idToken) {
      return {
        data: null,
        error: new Error(
          'Google did not return an ID token. Set EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID to your Web client ID (not the Android/iOS client ID).',
        ),
      };
    }

    const sessionResult = await supabase.auth.signInWithIdToken({
      provider: 'google',
      token: idToken,
    });

    return {
      data: sessionResult.data,
      error: sessionResult.error ? new Error(sessionResult.error.message) : null,
    };
  } catch (error) {
    if (isErrorWithCode(error)) {
      if (error.code === statusCodes.SIGN_IN_CANCELLED) {
        return { cancelled: true, data: null, error: null };
      }

      if (error.code === statusCodes.IN_PROGRESS) {
        return { data: null, error: new Error('Google sign-in is already in progress.') };
      }

      if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        return {
          data: null,
          error: new Error('Google Play Services is missing or outdated on this device.'),
        };
      }

      if (
        error.code === 'DEVELOPER_ERROR' ||
        error.code === '10' ||
        (typeof error.message === 'string' &&
          error.message.toUpperCase().includes('DEVELOPER_ERROR'))
      ) {
        return {
          data: null,
          error: new Error(
            'Google Sign-In developer error: check that the Android OAuth client uses package com.sevenerr.BloodLink and the SHA-1 of this build’s signing key.',
          ),
        };
      }
    }

    const message =
      error instanceof Error ? error.message : 'Unable to sign in with Google.';
    return { data: null, error: new Error(message) };
  }
};

export const signOutGooglePlatform = async () => {
  const native = loadNativeGoogleSignIn();

  if (!native) {
    return;
  }

  try {
    ensureGoogleSignInConfigured(native.GoogleSignin);
    await native.GoogleSignin.signOut();
  } catch {
    // Best-effort; Supabase sign-out still proceeds.
  }
};
