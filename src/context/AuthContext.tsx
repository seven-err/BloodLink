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

import { supabase } from '@/services/supabase/client';
import {
  getBloodbankVerification,
  type BloodbankVerification,
} from '@/services/supabase/bloodbankVerifications';
import { parseAuthCodeFromUrl, parseAuthTokensFromUrl } from '@/utils/authRedirect';
import { prefetchProfileAvatar } from '@/services/supabase/profileAvatar';
import {
  getProfile,
  isDonorRecipientProfileComplete,
  syncProfileFromAuthUser,
  type Profile,
} from '@/services/supabase/profiles';
import { sanitizeAuthError } from '@/utils/authErrors';

type AuthContextValue = {
  authError: string | null;
  authRetrying: boolean;
  bloodbankVerification: BloodbankVerification | null;
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
  const [profile, setProfile] = useState<Profile>(null);
  const [bloodbankVerification, setBloodbankVerification] =
    useState<BloodbankVerification | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);
  const [authRetrying, setAuthRetrying] = useState(false);
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
        return;
      }

      if (!options?.background) {
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
          const { data, error } = await getBloodbankVerification(resolvedProfile.id);

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
        setBloodbankVerification(null);
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
  }, []);

  useEffect(() => {
    if (initializing) {
      return;
    }

    void loadProfile(session);
  }, [initializing, loadProfile, session]);

  useEffect(() => {
    const activateSessionFromUrl = async (url: string | null) => {
      if (!url) {
        return;
      }

      const tokens = parseAuthTokensFromUrl(url);

      if (tokens) {
        await supabase.auth.setSession({
          access_token: tokens.accessToken,
          refresh_token: tokens.refreshToken,
        });
        return;
      }

      const code = parseAuthCodeFromUrl(url);

      if (code) {
        await supabase.auth.exchangeCodeForSession(code);
      }
    };

    void Linking.getInitialURL().then(activateSessionFromUrl);

    const subscription = Linking.addEventListener('url', ({ url }) => {
      void activateSessionFromUrl(url);
    });

    return () => subscription.remove();
  }, []);

  const profileComplete = useMemo(() => {
    if (!profile) {
      return false;
    }

    return isDonorRecipientProfileComplete(profile);
  }, [profile]);

  const value = useMemo(
    () => ({
      authError,
      authRetrying,
      bloodbankVerification,
      initializing,
      profile,
      profileComplete,
      profileLoading,
      refreshProfile,
      retryAuth,
      session,
    }),
    [
      authError,
      authRetrying,
      bloodbankVerification,
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
