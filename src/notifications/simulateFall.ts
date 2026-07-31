import * as Location from 'expo-location';

import { displaySosNotification } from '@/notifications/handlers';
import { alertFromPushData, upsertAlert } from '@/store/alerts';

/** Manila fallback when the emulator has no GPS fix yet. */
const FALLBACK_FALL = { lat: '14.599512', lon: '120.984222' };

/**
 * Dev-only: inject a fake fall through the exact same path a push takes.
 * Prefers the emulator's current mock GPS so distance/Navigate stay nearby.
 */
export async function simulateFall(): Promise<void> {
  let lat = FALLBACK_FALL.lat;
  let lon = FALLBACK_FALL.lon;
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status === 'granted') {
      const pos = await Location.getLastKnownPositionAsync();
      if (pos) {
        // Slight offset so the guardian isn't exactly on top of the fall pin.
        lat = (pos.coords.latitude + 0.002).toFixed(6);
        lon = (pos.coords.longitude + 0.002).toFixed(6);
      }
    }
  } catch {
    // Keep Manila fallback.
  }

  const alert = alertFromPushData({
    type: 'fall_sos',
    eventId: `sim-${Date.now()}`,
    deviceId: 'cane-panion-01',
    lat,
    lon,
    createdAt: new Date().toISOString(),
  });
  if (alert) {
    await upsertAlert(alert);
    await displaySosNotification(alert);
  }
}
