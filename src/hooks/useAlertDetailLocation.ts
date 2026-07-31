import { useEffect, useRef, useState } from 'react';
import * as Location from 'expo-location';

import type { LatLng } from '@/types/models';
import { formatPlace } from '@/utils/formatPlace';

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
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (cancelled) return;
      if (status !== 'granted') return;

      // Publish distance as soon as GPS returns; don't wait on place lookup.
      const fixPromise = Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      }).then((current) => {
        if (!cancelled) {
          setGuardianLocation({
            latitude: current.coords.latitude,
            longitude: current.coords.longitude,
          });
        }
      });

      const placePromise = Location.reverseGeocodeAsync(target)
        .then((results) => {
          if (cancelled) return;
          const first = results[0];
          setPlace(first ? formatPlace(first) : undefined);
        })
        .catch(() => {
          if (!cancelled) setPlace(undefined);
        });

      await Promise.allSettled([fixPromise, placePromise]);
    })();

    return () => {
      cancelled = true;
    };
  }, [placeAt?.latitude, placeAt?.longitude]);

  // Job 2: Navigate — live watch; denial surfaces via onDenied.
  useEffect(() => {
    if (!watch) {
      sub.current?.remove();
      sub.current = null;
      return;
    }

    let cancelled = false;
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (cancelled) return;
      if (status !== 'granted') {
        onDeniedRef.current?.();
        return;
      }

      try {
        const current = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        if (!cancelled) {
          setGuardianLocation({
            latitude: current.coords.latitude,
            longitude: current.coords.longitude,
          });
        }
      } catch {
        // Watch below may still deliver a fix.
      }
      if (cancelled) return;

      sub.current = await Location.watchPositionAsync(
        { accuracy: Location.Accuracy.Balanced, distanceInterval: 5 },
        (pos) => {
          setGuardianLocation({
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
          });
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
