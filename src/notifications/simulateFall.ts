import { displaySosNotification } from '@/notifications/handlers';
import { alertFromPushData, upsertAlert } from '@/store/alerts';

/** Dev-only: inject a fake fall through the exact same path a push takes. */
export async function simulateFall(): Promise<void> {
  const alert = alertFromPushData({
    type: 'fall_sos',
    eventId: `sim-${Date.now()}`,
    deviceId: 'cane-panion-01',
    lat: '14.599512',
    lon: '120.984222',
    createdAt: new Date().toISOString(),
  });
  if (alert) {
    await upsertAlert(alert);
    await displaySosNotification(alert);
  }
}
