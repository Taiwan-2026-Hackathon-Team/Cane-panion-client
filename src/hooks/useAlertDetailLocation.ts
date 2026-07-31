import { useEffect, useRef, useState } from 'react';
import * as Location from 'expo-location';

import type { LatLng } from '@/types/models';
import { formatPlace } from '@/utils/formatPlace';

const FIX_TIMEOUT_MS = 6000;
const WATCH_SUBSCRIBE_TIMEOUT_MS = 5000;

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
      Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
        mayShowUserSettingsDialog: true,
      }),
      new Promise<null>((resolve) => {
        setTimeout(() => resolve(null), FIX_TIMEOUT_MS);
      }),
    ]);
  } catch {
    return null;
  }
}

/**
 * Location + place for the alert detail screen.
 *
 * Guardian GPS: last-known (immediate paint) + timed current fix + live watch.
 * Emulators often hang on subscribe/fix — those paths time out so the UI
 * still progresses; a working mock location updates distance when callbacks land.
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
  const onDeniedRef = useRef(onDenied);
  onDeniedRef.current = onDenied;
  const subRef = useRef<Location.LocationSubscription | null>(null);

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

  useEffect(() => {
    if (!placeAt) return;

    let cancelled = false;

    (async () => {
      const granted = await ensureForegroundPermission();
      if (cancelled) return;
      if (!granted) {
        if (watch) onDeniedRef.current?.();
        return;
      }

      // Immediate paint — may be stale until a live fix arrives.
      try {
        const last = await Location.getLastKnownPositionAsync();
        if (!cancelled && last) setGuardianLocation(coordsFrom(last));
      } catch {
        // Continue.
      }

      void getCurrentPositionOrTimeout().then((current) => {
        if (!cancelled && current) setGuardianLocation(coordsFrom(current));
      });

      try {
        const sub = await Promise.race([
          Location.watchPositionAsync(
            {
              accuracy: Location.Accuracy.Balanced,
              distanceInterval: watch ? 5 : 1,
              timeInterval: watch ? 2000 : 1000,
              mayShowUserSettingsDialog: true,
            },
            (pos) => {
              setGuardianLocation(coordsFrom(pos));
            },
          ),
          new Promise<null>((resolve) => {
            setTimeout(() => resolve(null), WATCH_SUBSCRIBE_TIMEOUT_MS);
          }),
        ]);
        if (cancelled) {
          sub?.remove();
          return;
        }
        if (sub) subRef.current = sub;
      } catch {
        // Live watch unavailable; last-known / one-shot may still have painted.
      }
    })();

    return () => {
      cancelled = true;
      subRef.current?.remove();
      subRef.current = null;
    };
  }, [placeAt?.latitude, placeAt?.longitude, watch]);

  return { guardianLocation, place };
}
