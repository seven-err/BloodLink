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

export const getCurrentSession = () => supabase.auth.getSession();

export const getCurrentUser = () => supabase.auth.getUser();

export const signOut = () => supabase.auth.signOut();
