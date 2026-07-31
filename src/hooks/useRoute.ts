import { useEffect, useRef, useState } from 'react';

import { fetchRoute, type Route } from '../api/routing';
import type { LatLng } from '../types/models';
import { distanceMeters } from '@/utils/geo';

/** Refetch the road route only after the guardian moved this far. */
const REFETCH_AFTER_M = 25;

/**
 * Road route from the guardian's moving position to the fall location.
 * `route` stays undefined while loading; `failed` turns true only when
 * routing errored — that's the callers' cue to fall back to a straight
 * line (never drawn just because the route hasn't arrived yet).
 *
 * GPS updates do NOT cancel an in-flight fetch (a slow response must still
 * land while the guardian is moving); staleness is handled by a generation
 * counter that only advances when navigation stops or the hook unmounts.
 */
export function useRoute(
  from: LatLng | undefined,
  to: LatLng | undefined,
): { route?: Route; failed: boolean } {
  const [route, setRoute] = useState<Route>();
  const [failed, setFailed] = useState(false);
  const lastOrigin = useRef<LatLng>(null);
  const inFlight = useRef(false);
  const generation = useRef(0);

  useEffect(() => {
    return () => {
      generation.current += 1;
    };
  }, []);

  useEffect(() => {
    if (!from || !to) {
      generation.current += 1;
      inFlight.current = false;
      lastOrigin.current = null;
      setRoute(undefined);
      setFailed(false);
      return;
    }
    if (inFlight.current) return;
    if (lastOrigin.current && distanceMeters(lastOrigin.current, from) < REFETCH_AFTER_M) {
      return;
    }

    const gen = generation.current;
    const origin = from;
    const destination = to;
    inFlight.current = true;
    fetchRoute(origin, destination)
      .then((r) => {
        if (gen !== generation.current) return;
        inFlight.current = false;
        lastOrigin.current = origin;
        setRoute(r);
        setFailed(false);
      })
      .catch(() => {
        if (gen !== generation.current) return;
        inFlight.current = false;
        // Keep showing the previous route on a refetch hiccup; only report
        // failure when there is nothing to show at all.
        setRoute((prev) => {
          if (!prev) setFailed(true);
          return prev;
        });
      });
  }, [from?.latitude, from?.longitude, to?.latitude, to?.longitude]); // eslint-disable-line react-hooks/exhaustive-deps

  return { route, failed };
}
