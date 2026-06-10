import * as Linking from 'expo-linking';
import { Platform } from 'react-native';

import { env } from '@/config/env';

const DEFAULT_WEB_REDIRECT = 'http://localhost:8081';

/** Redirect URL passed to Supabase email confirmation / magic links. */
export const getAuthRedirectUrl = () => {
  if (env.authRedirectUrl) {
    return env.authRedirectUrl;
  }

  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    return window.location.origin;
  }

  return Linking.createURL('auth/callback');
};

export const parseAuthTokensFromUrl = (url: string) => {
  const hashIndex = url.indexOf('#');

  if (hashIndex >= 0) {
    const hashParams = new URLSearchParams(url.slice(hashIndex + 1));
    const accessToken = hashParams.get('access_token');
    const refreshToken = hashParams.get('refresh_token');

    if (accessToken && refreshToken) {
      return { accessToken, refreshToken };
    }
  }

  const queryIndex = url.indexOf('?');

  if (queryIndex >= 0) {
    const queryParams = new URLSearchParams(url.slice(queryIndex + 1));
    const accessToken = queryParams.get('access_token');
    const refreshToken = queryParams.get('refresh_token');

    if (accessToken && refreshToken) {
      return { accessToken, refreshToken };
    }
  }

  return null;
};

export const getDefaultWebRedirect = () => DEFAULT_WEB_REDIRECT;
