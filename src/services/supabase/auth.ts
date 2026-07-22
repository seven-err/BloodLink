import type { User } from '@supabase/supabase-js';
import { makeRedirectUri } from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import { Platform } from 'react-native';

import {
  getAuthRedirectUrl,
  parseAuthCodeFromUrl,
  parseAuthTokensFromUrl,
} from '@/utils/authRedirect';

import { supabase } from './client';

WebBrowser.maybeCompleteAuthSession();

const getOAuthRedirectUrl = () => {
  if (Platform.OS === 'web') {
    return getAuthRedirectUrl();
  }

  return makeRedirectUri({
    path: 'auth/callback',
    scheme: 'bloodlink',
  });
};

export const signUpWithEmail = (
  email: string,
  password: string,
  fullName: string,
  phone?: string,
) =>
  supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
        phone,
      },
      emailRedirectTo: getAuthRedirectUrl(),
    },
  });

/** True when Supabase accepted signup but did not create a new user (email already registered). */
export const isDuplicateEmailSignup = (user: User | null) =>
  Boolean(user && user.identities?.length === 0);

export const getSignupErrorMessage = (message: string) => {
  const normalized = message.toLowerCase();

  if (
    normalized.includes('database error saving new user') ||
    normalized.includes('profiles_phone_key')
  ) {
    return 'This mobile number is already linked to another account. Log in with that account, or use a different number.';
  }

  return message;
};

export const resendSignupConfirmation = (email: string) =>
  supabase.auth.resend({
    type: 'signup',
    email,
    options: {
      emailRedirectTo: getAuthRedirectUrl(),
    },
  });

export const signInWithEmail = (email: string, password: string) =>
  supabase.auth.signInWithPassword({ email, password });

export type GoogleSignInResult = {
  cancelled?: boolean;
  data: Awaited<ReturnType<typeof supabase.auth.setSession>>['data'] | null;
  error: Error | null;
};

/** Opens Google OAuth via Supabase + system browser. Requires Google provider enabled in Supabase. */
export const signInWithGoogle = async (): Promise<GoogleSignInResult> => {
  const redirectTo = getOAuthRedirectUrl();

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

  const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);

  if (result.type === 'cancel' || result.type === 'dismiss') {
    return { cancelled: true, data: null, error: null };
  }

  if (result.type !== 'success' || !('url' in result) || !result.url) {
    return { data: null, error: new Error('Google sign-in did not complete.') };
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

export const requestPhoneOtp = (phone: string) =>
  supabase.auth.signInWithOtp({
    phone,
    options: {
      data: {
        phone,
      },
    },
  });

export const verifyPhoneOtp = (phone: string, token: string) =>
  supabase.auth.verifyOtp({
    phone,
    token,
    type: 'sms',
  });

const DEV_PHONE_AUTH_PASSWORD = 'BloodLinkPhoneBypass!';

const phoneToDevEmail = (phone: string) => {
  const digits = phone.replace(/\D/g, '');
  return `phone+${digits}@bloodlink.app`;
};

/** Temporary bypass while SMS OTP is not configured. Creates or signs in a dev account. */
export const bypassPhoneAuth = async (phone: string) => {
  const email = phoneToDevEmail(phone);

  const signInResult = await supabase.auth.signInWithPassword({
    email,
    password: DEV_PHONE_AUTH_PASSWORD,
  });

  if (signInResult.data.session) {
    return signInResult;
  }

  const signUpResult = await supabase.auth.signUp({
    email,
    password: DEV_PHONE_AUTH_PASSWORD,
    options: {
      data: {
        phone,
      },
    },
  });

  if (signUpResult.data.session) {
    return signUpResult;
  }

  return signInResult.error ? signInResult : signUpResult;
};

export const getCurrentSession = () => supabase.auth.getSession();

export const getCurrentUser = () => supabase.auth.getUser();

export const signOut = () => supabase.auth.signOut();

export const updateAccountEmail = (email: string) =>
  supabase.auth.updateUser({
    email: email.trim(),
  });

export const updateAccountMetadata = (data: { full_name?: string; phone?: string | null }) =>
  supabase.auth.updateUser({
    data: {
      ...(data.full_name !== undefined ? { full_name: data.full_name } : {}),
      ...(data.phone !== undefined ? { phone: data.phone } : {}),
    },
  });

const DUPLICATE_PHONE_PATTERN = /profiles_phone_key|duplicate key.*phone/i;

export const getAccountUpdateErrorMessage = (message: string) => {
  if (DUPLICATE_PHONE_PATTERN.test(message)) {
    return 'This phone number is already linked to another account.';
  }

  if (message.toLowerCase().includes('email change requires reauthentication')) {
    return 'For security, sign out and sign in again before changing your email.';
  }

  return message;
};
