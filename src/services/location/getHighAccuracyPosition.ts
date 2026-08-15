import * as Location from 'expo-location';

/** Prefer fixes within this radius (meters). */
export const TARGET_ACCURACY_METERS = 20;
const WATCH_TIMEOUT_MS = 20_000;
const SINGLE_READ_TIMEOUT_MS = 15_000;

const accuracyOf = (position: Location.LocationObject) =>
  position.coords.accuracy ?? Number.POSITIVE_INFINITY;

const isBetterFix = (
  candidate: Location.LocationObject,
  current: Location.LocationObject | null,
) => current == null || accuracyOf(candidate) < accuracyOf(current);

const withTimeout = async <T,>(promise: Promise<T>, timeoutMs: number): Promise<T> => {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;

  try {
    return await Promise.race([
      promise,
      new Promise<T>((_, reject) => {
        timeoutId = setTimeout(() => reject(new Error('Location request timed out.')), timeoutMs);
      }),
    ]);
  } finally {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
  }
};

const readSingleHighAccuracyFix = () =>
  withTimeout(
    Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.BestForNavigation,
      mayShowUserSettingsDialog: true,
    }),
    SINGLE_READ_TIMEOUT_MS,
  );

const watchHighAccuracyPosition = (): Promise<Location.LocationObject> =>
  new Promise((resolve, reject) => {
    let best: Location.LocationObject | null = null;
    let subscription: { remove: () => void } | null = null;
    let settled = false;

    const cleanup = () => {
      subscription?.remove();
      subscription = null;
    };

    const finish = (result: Location.LocationObject | null, error?: Error) => {
      if (settled) {
        return;
      }

      settled = true;
      clearTimeout(timeoutId);
      cleanup();

      if (result) {
        resolve(result);
        return;
      }

      reject(error ?? new Error('Unable to read an accurate GPS fix.'));
    };

    const timeoutId = setTimeout(() => {
      if (best) {
        finish(best);
        return;
      }

      finish(null, new Error('Location request timed out.'));
    }, WATCH_TIMEOUT_MS);

    void Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.BestForNavigation,
        timeInterval: 1_000,
        distanceInterval: 0,
        mayShowUserSettingsDialog: true,
      },
      (positionUpdate) => {
        if (isBetterFix(positionUpdate, best)) {
          best = positionUpdate;
        }

        if (accuracyOf(positionUpdate) <= TARGET_ACCURACY_METERS) {
          finish(positionUpdate);
        }
      },
    )
      .then((activeSubscription) => {
        if (settled) {
          activeSubscription.remove();
          return;
        }

        subscription = activeSubscription;
      })
      .catch((error: unknown) => {
        finish(
          null,
          error instanceof Error ? error : new Error('Unable to start high-accuracy GPS.'),
        );
      });
  });

/**
 * Reads the device GPS using BestForNavigation and keeps sampling until
 * accuracy is within TARGET_ACCURACY_METERS, or until the watch times out
 * (then returns the best sample seen). Does not fall back to low / cached fixes.
 */
export const getHighAccuracyPosition = async (): Promise<Location.LocationObject> => {
  try {
    return await watchHighAccuracyPosition();
  } catch {
    // Final attempt: one BestForNavigation read (never Balanced / Low / last-known).
    return readSingleHighAccuracyFix();
  }
};
