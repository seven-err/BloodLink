import { useCallback, useState } from 'react';

import { signInWithGoogle } from '@/services/supabase/auth';
import { getLoginErrorMessage } from '@/utils/loginErrors';

type UseGoogleSignInOptions = {
  /** When true, the Google action is blocked (e.g. another auth request is in flight). */
  disabled?: boolean;
};

export const useGoogleSignIn = (options?: UseGoogleSignInOptions) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const signIn = useCallback(async () => {
    if (loading || options?.disabled) {
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const result = await signInWithGoogle();

      if (result.cancelled) {
        return;
      }

      if (result.error) {
        setError(getLoginErrorMessage(result.error.message));
      }
    } catch (googleError) {
      setError(
        googleError instanceof Error ? googleError.message : 'Unable to sign in with Google.',
      );
    } finally {
      setLoading(false);
    }
  }, [loading, options?.disabled]);

  return {
    error,
    loading,
    setError,
    signIn,
  };
};
