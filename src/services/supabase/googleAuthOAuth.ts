import { makeRedirectUri } from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import { Platform } from 'react-native';

import {
  getOAuthAuthRedirectUrl,
  parseAuthCodeFromUrl,
  parseAuthErrorFromUrl,
  parseAuthTokensFromUrl,
} from '@/utils/authRedirect';

import { supabase } from './client';
import type { GoogleSignInResult } from './googleAuth.types';

WebBrowser.maybeCompleteAuthSession();

const getOAuthRedirectUrl = () => {
  if (Platform.OS === 'web') {
    return getOAuthAuthRedirectUrl();
  }

  return makeRedirectUri({
    path: 'auth/callback',
    scheme: 'bloodlink',
  });
};

/** Browser-based Google OAuth (web, Expo Go, or builds without native Google Sign-In). */
export const signInWithGoogleOAuth = async (): Promise<GoogleSignInResult> => {
  const redirectTo = getOAuthRedirectUrl();

  if (__DEV__) {
    console.info('[auth] Google OAuth redirectTo:', redirectTo);
  }

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo,
      skipBrowserRedirect: true,
      queryParams: {
        access_type: 'offline',
        prompt: 'select_account',
      },
    },
  });

  if (error) {
    return { data: null, error: new Error(error.message) };
  }

  if (!data.url) {
    return { data: null, error: new Error('Unable to start Google sign-in.') };
  }

  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    window.location.assign(data.url);
    return { data: null, error: null };
  }

  try {
    await WebBrowser.warmUpAsync();
  } catch {
    // Best-effort; auth still works without warm-up.
  }

  const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);

  try {
    await WebBrowser.coolDownAsync();
  } catch {
    // Best-effort cleanup.
  }

  if (result.type === 'cancel' || result.type === 'dismiss') {
    return { cancelled: true, data: null, error: null };
  }

  if (result.type !== 'success' || !('url' in result) || !result.url) {
    return { data: null, error: new Error('Google sign-in did not complete.') };
  }

  const oauthError = parseAuthErrorFromUrl(result.url);

  if (oauthError) {
    return { data: null, error: new Error(oauthError) };
  }

  const tokens = parseAuthTokensFromUrl(result.url);

  if (tokens) {
    const sessionResult = await supabase.auth.setSession({
      access_token: tokens.accessToken,
      refresh_token: tokens.refreshToken,
    });

    return {
      data: sessionResult.data,
      error: sessionResult.error ? new Error(sessionResult.error.message) : null,
    };
  }

  const code = parseAuthCodeFromUrl(result.url);

  if (code) {
    const sessionResult = await supabase.auth.exchangeCodeForSession(code);

    return {
      data: sessionResult.data,
      error: sessionResult.error ? new Error(sessionResult.error.message) : null,
    };
  }

  return {
    data: null,
    error: new Error('Google sign-in did not return a valid session.'),
  };
};
