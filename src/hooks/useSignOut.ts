import { useCallback, useState } from 'react';
import { Alert } from 'react-native';

import { signOut } from '@/services/supabase/auth';
import { sanitizeAuthError } from '@/utils/authErrors';

export function useSignOut() {
  const [signingOut, setSigningOut] = useState(false);
  const [signOutError, setSignOutError] = useState<string | null>(null);

  const clearSignOutError = useCallback(() => {
    setSignOutError(null);
  }, []);

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
    } catch (error) {
      setSignOutError(sanitizeAuthError(error, 'Unable to sign out. Please try again.'));
    } finally {
      setSigningOut(false);
    }
  }, [signingOut]);

  const confirmSignOut = useCallback(() => {
    Alert.alert('Sign out?', 'You will need to sign in again to access BloodLink.', [
      { style: 'cancel', text: 'Cancel' },
      {
        style: 'destructive',
        text: 'Sign out',
        onPress: () => {
          void performSignOut();
        },
      },
    ]);
  }, [performSignOut]);

  return {
    clearSignOutError,
    confirmSignOut,
    performSignOut,
    signOutError,
    signingOut,
  };
}
