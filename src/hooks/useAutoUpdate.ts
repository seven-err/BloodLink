import { useEffect, useRef } from 'react';
import * as Updates from 'expo-updates';

/**
 * Applies a pending EAS Update in the background after initial render.
 */
export function useAutoUpdate() {
  const appliedRef = useRef(false);

  useEffect(() => {
    if (!Updates.isEnabled || __DEV__ || appliedRef.current) {
      return;
    }

    const checkAndApply = async () => {
      try {
        const update = await Updates.checkForUpdateAsync();
        if (update.isAvailable) {
          await Updates.fetchUpdateAsync();
          appliedRef.current = true;
          await Updates.reloadAsync();
        }
      } catch {
        // Non-fatal: ignore update network errors during boot
      }
    };

    const timer = setTimeout(() => {
      void checkAndApply();
    }, 2000);

    return () => clearTimeout(timer);
  }, []);
}

