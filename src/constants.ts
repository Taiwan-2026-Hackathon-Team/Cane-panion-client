/** FCM topic every guardian phone subscribes to (see docs/push-contract.md). */
export const SOS_TOPIC = 'sos-alerts';

/** Android notification channel for fall alerts. */
export const SOS_CHANNEL_ID = 'sos';

/**
 * Phone number of the cane's SIM (it has cellular + speaker, so the guardian
 * can call the user directly). TODO: replace with the real SIM number; later
 * this becomes per-device data from the backend.
 */
export const CANE_PHONE_NUMBER = '+639170000000';

/** AsyncStorage key holding the persisted alert list. */
export const ALERTS_STORAGE_KEY = '@canepanion/alerts';

export const COLORS = {
  danger: '#d92b2b',
  dangerDark: '#a51f1f',
  ok: '#2b8a3e',
  muted: '#868e96',
  text: '#212529',
  background: '#ffffff',
  cardBorder: '#dee2e6',
};
