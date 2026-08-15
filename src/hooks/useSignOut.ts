import { useCallback, useState } from 'react';

import { signOut } from '@/services/supabase/auth';
import { sanitizeAuthError } from '@/utils/authErrors';

export function useSignOut() {
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [signOutError, setSignOutError] = useState<string | null>(null);

  const clearSignOutError = useCallback(() => {
    setSignOutError(null);
  }, []);

  const cancelSignOut = useCallback(() => {
    if (signingOut) {
      return;
    }

    setConfirmVisible(false);
  }, [signingOut]);

  const performSignOut = useCallback(async () => {
    if (signingOut) {
      return;
    }

    setSigningOut(true);
    setSignOutError(null);

    try {
      const { error } = await signOut();

      if (error) {
        throw error;
      }

      setConfirmVisible(false);
    } catch (error) {
      setSignOutError(sanitizeAuthError(error, 'Unable to sign out. Please try again.'));
      setConfirmVisible(false);
    } finally {
      setSigningOut(false);
    }
  }, [signingOut]);

  const confirmSignOut = useCallback(() => {
    if (signingOut) {
      return;
    }

    setSignOutError(null);
    setConfirmVisible(true);
  }, [signingOut]);

  return {
    cancelSignOut,
    clearSignOutError,
    confirmSignOut,
    confirmVisible,
    performSignOut,
    signOutError,
    signingOut,
  };
}
