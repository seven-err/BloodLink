import type { Session } from '@supabase/supabase-js';
import * as Linking from 'expo-linking';
import {
  createContext,
  type PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Platform } from 'react-native';

import { supabase } from '@/services/supabase/client';
import {
  getBloodbankVerification,
  type BloodbankVerification,
} from '@/services/supabase/bloodbankVerifications';
import { prefetchProfileAvatar } from '@/services/supabase/profileAvatar';
import {
  getProfile,
  isDonorRecipientProfileComplete,
  syncProfileFromAuthUser,
  type Profile,
} from '@/services/supabase/profiles';
import { sanitizeAuthError } from '@/utils/authErrors';
import { appCache } from '@/utils/appCache';
import { prefetchAppData } from '@/utils/prefetchAppData';
import {
  clearAuthParamsFromBrowserUrl,
  isEmailConfirmationRedirect,
  parseAuthCodeFromUrl,
  parseAuthErrorFromUrl,
  parseAuthTokensFromUrl,
  parseTokenHashFromUrl,
  resetBrowserPathAfterEmailConfirmation,
} from '@/utils/authRedirect';

type AuthContextValue = {
  acknowledgeEmailConfirmation: () => void;
  authError: string | null;
  authRetrying: boolean;
  bloodbankVerification: BloodbankVerification | null;
  emailJustConfirmed: boolean;
  initializing: boolean;
  profileLoading: boolean;
  session: Session | null;
  profile: Profile;
  profileComplete: boolean;
  refreshProfile: () => Promise<void>;
  retryAuth: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: PropsWithChildren) {
  const [initializing, setInitializing] = useState(true);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile>(() => appCache.getSync<Profile>('auth:profile') ?? null);
  const [bloodbankVerification, setBloodbankVerification] =
    useState<BloodbankVerification | null>(
      () => appCache.getSync<BloodbankVerification>('auth:bloodbank_verification') ?? null,
    );
  const [authError, setAuthError] = useState<string | null>(null);
  const [authRetrying, setAuthRetrying] = useState(false);
  const [emailJustConfirmed, setEmailJustConfirmed] = useState(false);
  const [profileLoading, setProfileLoading] = useState(false);
  const mountedRef = useRef(false);
  const profileRequestIdRef = useRef(0);

  const loadProfile = useCallback(
    async (activeSession: Session | null, options?: { background?: boolean }) => {
      const requestId = profileRequestIdRef.current + 1;
      profileRequestIdRef.current = requestId;
      const applyProfileState = (update: () => void) => {
        if (mountedRef.current && requestId === profileRequestIdRef.current) {
          update();
        }
      };

      if (!activeSession?.user.id) {
        applyProfileState(() => {
          setProfile(null);
          setBloodbankVerification(null);
          setAuthError(null);
          setProfileLoading(false);
        });
        appCache.invalidate('auth:');
        return;
      }

      if (!options?.background && !appCache.getSync('auth:profile')) {
        applyProfileState(() => {
          setProfileLoading(true);
        });
      }

      try {
        const { data: syncedProfile, error: syncError } = await syncProfileFromAuthUser(
          activeSession.user,
        );

        if (syncError) {
          throw syncError;
        }

        let resolvedProfile = syncedProfile;

        if (!resolvedProfile) {
          const { data, error } = await getProfile(activeSession.user.id);

          if (error) {
            throw error;
          }

          resolvedProfile = data;
        }

        let verification: BloodbankVerification | null = null;

        if (resolvedProfile?.role === 'bloodbank') {
          const { data, error } = await getBloodbankVerification(activeSession.user.id);

          if (error) {
            throw error;
          }

          verification = (data as BloodbankVerification | null) ?? null;
        }

        applyProfileState(() => {
          setProfile(resolvedProfile);
          setBloodbankVerification(verification);
          setAuthError(null);
          setProfileLoading(false);
        });

        if (resolvedProfile) {
          appCache.setSync('auth:profile', resolvedProfile, 24 * 60 * 60 * 1000);
        }
        if (verification) {
          appCache.setSync('auth:bloodbank_verification', verification, 24 * 60 * 60 * 1000);
        }
        if (resolvedProfile && activeSession?.user.id) {
          void prefetchAppData(resolvedProfile, activeSession.user.id);
        }

        if (resolvedProfile?.avatar_path) {
          void prefetchProfileAvatar(resolvedProfile.avatar_path);
        }
      } catch (error) {
        applyProfileState(() => {
          setProfile(null);
          setBloodbankVerification(null);
          setAuthError(sanitizeAuthError(error, 'Unable to load your profile.'));
          setProfileLoading(false);
        });
      }
    },
    [],
  );

  const refreshProfile = useCallback(async () => {
    await loadProfile(session, { background: true });
  }, [loadProfile, session]);

  const acknowledgeEmailConfirmation = useCallback(() => {
    resetBrowserPathAfterEmailConfirmation();
    setEmailJustConfirmed(false);
  }, []);

  const retryAuth = useCallback(async () => {
    if (authRetrying) {
      return;
    }

    setAuthRetrying(true);
    setAuthError(null);

    try {
      const { data, error } = await supabase.auth.getSession();

      if (error) {
        throw error;
      }

      if (!mountedRef.current) {
        return;
      }

      setSession(data.session);
      await loadProfile(data.session);
    } catch (error) {
      if (mountedRef.current) {
        setSession(null);
        setProfile(null);
        setAuthError(sanitizeAuthError(error, 'Unable to start the app.'));
      }
    } finally {
      if (mountedRef.current) {
        setAuthRetrying(false);
      }
    }
  }, [authRetrying, loadProfile]);

  useEffect(() => {
    mountedRef.current = true;

    const initializeAuth = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();

        if (error) {
          throw error;
        }

        if (!mountedRef.current) {
          return;
        }

        setSession(data.session);
      } catch (error) {
        if (mountedRef.current) {
          setSession(null);
          setProfile(null);
          setBloodbankVerification(null);
          setAuthError(sanitizeAuthError(error, 'Unable to initialize auth.'));
        }
      } finally {
        if (mountedRef.current) {
          setInitializing(false);
        }
      }
    };

    void initializeAuth();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (!mountedRef.current) {
        return;
      }

      setSession(nextSession);
      setInitializing(false);

      if (nextSession) {
        void loadProfile(nextSession);
      } else {
        setProfile(null);
        setBloodbankVerification(null);
        setAuthError(null);
        setProfileLoading(false);
      }
    });

    return () => {
      mountedRef.current = false;
      profileRequestIdRef.current += 1;
      subscription.unsubscribe();
    };
  }, [loadProfile]);

  useEffect(() => {
    if (initializing) {
      return;
    }

    void loadProfile(session);
  }, [initializing, loadProfile, session]);

  useEffect(() => {
    const hasActiveSession = async () => {
      const { data } = await supabase.auth.getSession();
      return Boolean(data.session);
    };

    const activateSessionFromUrl = async (url: string | null) => {
      if (!url) {
        return;
      }

      if (parseAuthErrorFromUrl(url)) {
        return;
      }

      const showEmailConfirmed = isEmailConfirmationRedirect(url);
      const tokens = parseAuthTokensFromUrl(url);
      let activated = false;

      if (tokens) {
        const { error } = await supabase.auth.setSession({
          access_token: tokens.accessToken,
          refresh_token: tokens.refreshToken,
        });
        activated = !error;
      } else {
        const tokenHashData = parseTokenHashFromUrl(url);
        const code = parseAuthCodeFromUrl(url);

        if (tokenHashData) {
          const { error } = await supabase.auth.verifyOtp({
            token_hash: tokenHashData.tokenHash,
            type: tokenHashData.type,
          });
          activated = error ? await hasActiveSession() : true;
        } else if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          // detectSessionInUrl may already have exchanged the code on web.
          activated = error ? await hasActiveSession() : true;
        } else if (showEmailConfirmed) {
          activated = await hasActiveSession();
        }
      }

      if (!activated) {
        return;
      }

      clearAuthParamsFromBrowserUrl();

      if (showEmailConfirmed && mountedRef.current) {
        setEmailJustConfirmed(true);
      }
    };

    const resolveInitialUrl = async () => {
      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        return window.location.href;
      }

      return Linking.getInitialURL();
    };

    void resolveInitialUrl().then(activateSessionFromUrl);

    const subscription = Linking.addEventListener('url', ({ url }) => {
      void activateSessionFromUrl(url);
    });

    return () => subscription.remove();
  }, []);

  // Web PKCE: detectSessionInUrl may finish after the first URL pass.
  useEffect(() => {
    if (!session || Platform.OS !== 'web' || typeof window === 'undefined') {
      return;
    }

    if (!isEmailConfirmationRedirect(window.location.href)) {
      return;
    }

    clearAuthParamsFromBrowserUrl();
    setEmailJustConfirmed(true);
  }, [session]);

  useEffect(() => {
    if (!session && emailJustConfirmed) {
      setEmailJustConfirmed(false);
    }
  }, [emailJustConfirmed, session]);

  const profileComplete = useMemo(() => {
    if (!profile) {
      return false;
    }

    if (profile.role === 'bloodbank') {
      return Boolean(bloodbankVerification);
    }

    return isDonorRecipientProfileComplete(profile);
  }, [profile, bloodbankVerification]);

  const value = useMemo(
    () => ({
      acknowledgeEmailConfirmation,
      authError,
      authRetrying,
      bloodbankVerification,
      emailJustConfirmed,
      initializing,
      profile,
      profileComplete,
      profileLoading,
      refreshProfile,
      retryAuth,
      session,
    }),
    [
      acknowledgeEmailConfirmation,
      authError,
      authRetrying,
      bloodbankVerification,
      emailJustConfirmed,
      initializing,
      profile,
      profileComplete,
      profileLoading,
      refreshProfile,
      retryAuth,
      session,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }

  return context;
};
