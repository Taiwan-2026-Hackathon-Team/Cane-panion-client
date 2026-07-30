import { useEffect, useRef, useState } from 'react';
import * as Location from 'expo-location';

import type { LatLng } from '../types/models';

/**
 * Watches the guardian's position while `enabled`. Returns undefined until a
 * fix arrives. Each enable attempt re-requests permission; a denial is
 * reported once per attempt through `onDenied` (never latched, so granting
 * permission in OS settings and retrying just works).
 */
export function useGuardianLocation(
  enabled: boolean,
  onDenied?: () => void,
): { location?: LatLng } {
  const [location, setLocation] = useState<LatLng>();
  const sub = useRef<Location.LocationSubscription>(null);
  const onDeniedRef = useRef(onDenied);
  onDeniedRef.current = onDenied;

  useEffect(() => {
    if (!enabled) {
      sub.current?.remove();
      sub.current = null;
      setLocation(undefined);
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
      // Initial fix so a stationary device/emulator isn't stuck waiting for
      // distanceInterval movement before the first watch callback.
      try {
        const current = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        if (!cancelled) {
          setLocation({
            latitude: current.coords.latitude,
            longitude: current.coords.longitude,
          });
        }
      } catch {
        // Watch below may still deliver a fix; leave location undefined for now.
      }
      if (cancelled) return;
      sub.current = await Location.watchPositionAsync(
        { accuracy: Location.Accuracy.Balanced, distanceInterval: 5 },
        (pos) => {
          setLocation({
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
  }, [enabled]);

  return { location };
}

/** Great-circle distance in meters. */
export function distanceMeters(a: LatLng, b: LatLng): number {
  const R = 6371000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.latitude - a.latitude);
  const dLon = toRad(b.longitude - a.longitude);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.latitude)) * Math.cos(toRad(b.latitude)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

export function formatDistance(meters: number): string {
  return meters < 1000 ? `${Math.round(meters)} m` : `${(meters / 1000).toFixed(1)} km`;
}
