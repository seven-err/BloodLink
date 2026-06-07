import type { Session } from '@supabase/supabase-js';
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
  getProfile,
  isProfileComplete,
  type Profile,
} from '@/services/supabase/profiles';

type AuthContextValue = {
  authError: string | null;
  initializing: boolean;
  session: Session | null;
  profile: Profile;
  profileComplete: boolean;
  refreshProfile: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const getErrorMessage = (error: unknown, fallback: string) =>
  error instanceof Error ? error.message : fallback;

export function AuthProvider({ children }: PropsWithChildren) {
  const [initializing, setInitializing] = useState(true);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile>(null);
  const [authError, setAuthError] = useState<string | null>(null);
  const mountedRef = useRef(false);
  const profileRequestIdRef = useRef(0);

  const loadProfile = useCallback(async (activeSession: Session | null) => {
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
        setAuthError(null);
      });
      return;
    }

    try {
      const { data, error } = await getProfile(activeSession.user.id);

      if (error) {
        throw error;
      }

      applyProfileState(() => {
        setProfile(data);
        setAuthError(null);
      });
    } catch (error) {
      applyProfileState(() => {
        setProfile(null);
        setAuthError(getErrorMessage(error, 'Unable to load your profile.'));
      });
    }
  }, []);

  const refreshProfile = useCallback(async () => {
    await loadProfile(session);
  }, [loadProfile, session]);

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
        await loadProfile(data.session);
      } catch (error) {
        if (mountedRef.current) {
          setSession(null);
          setProfile(null);
          setAuthError(getErrorMessage(error, 'Unable to initialize auth.'));
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
      const applySession = async () => {
        if (!mountedRef.current) {
          return;
        }

        try {
          setSession(nextSession);
          await loadProfile(nextSession);
        } finally {
          if (mountedRef.current) {
            setInitializing(false);
          }
        }
      };

      void applySession();
    });

    return () => {
      mountedRef.current = false;
      profileRequestIdRef.current += 1;
      subscription.unsubscribe();
    };
  }, [loadProfile]);

  const value = useMemo(
    () => ({
      authError,
      initializing,
      profile,
      profileComplete: isProfileComplete(profile),
      refreshProfile,
      session,
    }),
    [authError, initializing, profile, refreshProfile, session],
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
