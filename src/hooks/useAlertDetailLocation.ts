import { useEffect, useState } from 'react';
import * as Location from 'expo-location';

import type { LatLng } from '@/types/models';
import { formatPlace } from '@/utils/formatPlace';

const FIX_TIMEOUT_MS = 6000;

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
 * Place label + guardian GPS for the alert detail screen.
 * Last-known paints immediately; a timed current fix refreshes distance /
 * optional maps origin. Emulators that hang on getCurrentPosition time out.
 */
export function useAlertDetailLocation(placeAt?: LatLng): {
  guardianLocation?: LatLng;
  place?: string;
} {
  const [guardianLocation, setGuardianLocation] = useState<LatLng>();
  const [place, setPlace] = useState<string>();

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
      if (cancelled || !granted) return;

      try {
        const last = await Location.getLastKnownPositionAsync();
        if (!cancelled && last) setGuardianLocation(coordsFrom(last));
      } catch {
        // Continue to current fix.
      }

      const current = await getCurrentPositionOrTimeout();
      if (!cancelled && current) setGuardianLocation(coordsFrom(current));
    })();

    return () => {
      cancelled = true;
    };
  }, [placeAt?.latitude, placeAt?.longitude]);

  return { guardianLocation, place };
}
