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

const getUrlSearchParams = (url: string) => {
  const hashIndex = url.indexOf('#');
  const queryIndex = url.indexOf('?');
  const params = new URLSearchParams();

  if (queryIndex >= 0) {
    const queryEnd = hashIndex >= 0 && hashIndex > queryIndex ? hashIndex : url.length;
    const query = new URLSearchParams(url.slice(queryIndex + 1, queryEnd));
    query.forEach((value, key) => params.set(key, value));
  }

  if (hashIndex >= 0) {
    const hash = new URLSearchParams(url.slice(hashIndex + 1));
    hash.forEach((value, key) => params.set(key, value));
  }

  return params;
};

export const parseAuthTokensFromUrl = (url: string) => {
  const params = getUrlSearchParams(url);
  const accessToken = params.get('access_token');
  const refreshToken = params.get('refresh_token');

  if (accessToken && refreshToken) {
    return { accessToken, refreshToken };
  }

  return null;
};

/** PKCE auth code from OAuth redirect (query or hash). */
export const parseAuthCodeFromUrl = (url: string) => {
  const code = getUrlSearchParams(url).get('code');
  return code && code.length > 0 ? code : null;
};

export const getDefaultWebRedirect = () => DEFAULT_WEB_REDIRECT;
