import type { LatLng } from '../types/models';

export interface Route {
  /** Road-following path from guardian to fall location. */
  coords: LatLng[];
  distanceMeters: number;
  durationSec: number;
}

/**
 * Road routing via the public OSRM demo server (OpenStreetMap data, no API
 * key, no SLA — fine for development). Per the architecture, the real Google
 * Directions calls belong on the Go backend; when its routing endpoint
 * exists, swap the implementation here and nothing else changes.
 */
export async function fetchRoute(from: LatLng, to: LatLng): Promise<Route> {
  const url =
    `https://router.project-osrm.org/route/v1/foot/` +
    `${from.longitude},${from.latitude};${to.longitude},${to.latitude}` +
    `?overview=full&geometries=geojson`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);
  try {
    const res = await fetch(url, { signal: controller.signal });
    if (!res.ok) throw new Error(`OSRM ${res.status}`);
    const json = await res.json();
    const route = json?.routes?.[0];
    const line: [number, number][] = route?.geometry?.coordinates;
    if (!route || !Array.isArray(line) || line.length < 2) {
      throw new Error('OSRM returned no route');
    }
    return {
      coords: line.map(([lon, lat]) => ({ latitude: lat, longitude: lon })),
      distanceMeters: route.distance,
      durationSec: route.duration,
    };
  } finally {
    clearTimeout(timeout);
  }
}
