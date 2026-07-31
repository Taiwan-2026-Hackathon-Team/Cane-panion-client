import { useEffect, useRef, useState } from 'react';
import * as Location from 'expo-location';

import type { LatLng } from '@/types/models';
import { formatPlace } from '@/utils/formatPlace';

/** Don't let a hung GPS fix block Navigate / place lookup forever. */
const FIX_TIMEOUT_MS = 8000;

async function ensureForegroundPermission(): Promise<boolean> {
  const current = await Location.getForegroundPermissionsAsync();
  if (current.status === 'granted') return true;
  const requested = await Location.requestForegroundPermissionsAsync();
  return requested.status === 'granted';
}

function coordsFrom(pos: Location.LocationObject): LatLng {
  return {
    latitude: pos.coords.latitude,
    longitude: pos.coords.longitude,
  };
}

async function getCurrentPositionOrTimeout(): Promise<Location.LocationObject | null> {
  try {
    return await Promise.race([
      Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }),
      new Promise<null>((resolve) => {
        setTimeout(() => resolve(null), FIX_TIMEOUT_MS);
      }),
    ]);
  } catch {
    return null;
  }
}

/** Last-known (fast) then timed current fix. Never throws. */
async function seedGuardianLocation(
  setLocation: (loc: LatLng) => void,
  isCancelled: () => boolean,
): Promise<void> {
  try {
    const last = await Location.getLastKnownPositionAsync();
    if (isCancelled()) return;
    if (last) setLocation(coordsFrom(last));
  } catch {
    // Fall through to a live fix.
  }

  const current = await getCurrentPositionOrTimeout();
  if (isCancelled() || !current) return;
  setLocation(coordsFrom(current));
}

/**
 * Location + place for the alert detail screen:
 * - Quiet open (`placeAt`): ask permission, one position fix, reverse-geocode the fall.
 *   Denial is silent (header just omits place/distance).
 * - Navigate (`watch`): live GPS updates. Denial calls `onDenied` (in-app dialog).
 *   Stopping watch removes the subscription but keeps the last fix for header distance.
 */
export function useAlertDetailLocation({
  placeAt,
  watch,
  onDenied,
}: {
  placeAt?: LatLng;
  watch: boolean;
  onDenied?: () => void;
}): { guardianLocation?: LatLng; place?: string } {
  const [guardianLocation, setGuardianLocation] = useState<LatLng>();
  const [place, setPlace] = useState<string>();
  const sub = useRef<Location.LocationSubscription>(null);
  const onDeniedRef = useRef(onDenied);
  onDeniedRef.current = onDenied;

  // Job 1: quiet open — permission + one-shot fix + place lookup.
  useEffect(() => {
    if (!placeAt) {
      setPlace(undefined);
      return;
    }

    const target = placeAt;
    let cancelled = false;
    setPlace(undefined);
    (async () => {
      const granted = await ensureForegroundPermission();
      if (cancelled || !granted) return;

      // GPS and place lookup are independent; don't wait on a hung fix for either.
      void seedGuardianLocation(setGuardianLocation, () => cancelled);

      try {
        const results = await Location.reverseGeocodeAsync(target);
        if (cancelled) return;
        const first = results[0];
        setPlace(first ? formatPlace(first) : undefined);
      } catch {
        if (!cancelled) setPlace(undefined);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [placeAt?.latitude, placeAt?.longitude]);

  // Job 2: Navigate — start the watch immediately; seed a fix in parallel.
  useEffect(() => {
    if (!watch) {
      sub.current?.remove();
      sub.current = null;
      return;
    }

    let cancelled = false;
    (async () => {
      const granted = await ensureForegroundPermission();
      if (cancelled) return;
      if (!granted) {
        onDeniedRef.current?.();
        return;
      }

      // Never await a one-shot fix before watching — getCurrentPosition can hang
      // (common on Android emulators without a mock location).
      void seedGuardianLocation(setGuardianLocation, () => cancelled);

      sub.current = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.Balanced,
          distanceInterval: 5,
          // Android: also tick while stationary so we aren't stuck until movement.
          timeInterval: 2000,
        },
        (pos) => {
          setGuardianLocation(coordsFrom(pos));
        },
      );
      if (cancelled) {
        sub.current?.remove();
        sub.current = null;
      }
    })();

    return () => {
      cancelled = true;
      sub.current?.remove();
      sub.current = null;
    };
  }, [watch]);

  return { guardianLocation, place };
}
