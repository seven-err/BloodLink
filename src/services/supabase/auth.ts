import type { User } from '@supabase/supabase-js';

import { getAuthRedirectUrl } from '@/utils/authRedirect';

import { supabase } from './client';

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
