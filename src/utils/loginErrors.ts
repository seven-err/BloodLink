export const getLoginErrorMessage = (message: string) => {
  const normalized = message.trim().toLowerCase();

  if (normalized.includes('email not confirmed')) {
    return 'Confirm your email before logging in. Check your inbox for the verification link, then try again.';
  }

  if (normalized.includes('invalid login credentials')) {
    return 'Incorrect email or password. Please try again.';
  }

  if (normalized.includes('email logins are disabled')) {
    return 'Email login is temporarily unavailable. Please try again later or contact support.';
  }

  if (
    normalized.includes('not in this app binary') ||
    normalized.includes('development build') ||
    normalized.includes('expo go')
  ) {
    return 'In-app Google Sign-In needs a rebuilt BloodLink app. Install a new development build, then open that app (not Expo Go).';
  }

  if (normalized.includes('developer error') || normalized.includes('sha-1')) {
    return 'Google Sign-In is misconfigured for this build. Add this app’s SHA-1 fingerprint to the Android OAuth client in Google Cloud Console (package com.sevenerr.BloodLink).';
  }

  if (
    normalized.includes('missing expo_public_google_web_client_id') ||
    normalized.includes('google_web_client_id')
  ) {
    return 'Google Sign-In is not configured. Add EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID to your .env file.';
  }

  if (
    normalized.includes('provider is not enabled') ||
    normalized.includes('unsupported provider') ||
    normalized.includes('validation_failed')
  ) {
    return 'Google sign-in is not enabled yet. Ask an admin to enable the Google provider in Supabase Auth.';
  }

  if (
    normalized.includes('redirect_uri_mismatch') ||
    normalized.includes('redirect url') ||
    normalized.includes('redirect_to')
  ) {
    return 'Google sign-in redirect is misconfigured. Add bloodlink://auth/callback (and your web origin) under Supabase Auth URL configuration.';
  }

  if (normalized.includes('access_denied') || normalized.includes('user cancelled')) {
    return 'Google sign-in was cancelled.';
  }

  if (
    normalized.includes('native module is null') ||
    normalized.includes('asyncstorageerror') ||
    normalized.includes('auto refresh tick failed')
  ) {
    return 'We could not save your session on this device. Restart the app and try again. If this keeps happening, reinstall the Expo Go app or run npm install in the project.';
  }

  return message;
};
