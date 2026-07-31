export interface LatLng {
  latitude: number;
  longitude: number;
}

export type AlertStatus = 'active' | 'seen';

/**
 * A fall SOS event as the guardian app knows it. In v1 every field is
 * populated from the FCM data payload (see docs/push-contract.md); once the
 * Go backend exposes a REST API this same shape is what GET /alerts returns.
 */
export interface FallAlert {
  /** Backend event id; falls back to `${deviceId}-${createdAt}` when absent. */
  id: string;
  deviceId: string;
  type: 'fall_sos';
  lat: number;
  lon: number;
  /** When the backend ingested the fall (ISO 8601). */
  createdAt: string;
  /** When this phone received the push (ISO 8601). */
  receivedAt: string;
  status: AlertStatus;
  /** When the guardian opened/viewed the alert (ISO 8601). */
  seenAt?: string;
}

/** The FCM data payload contract — every value arrives as a string. */
export interface FallAlertPushData {
  type: string;
  eventId?: string;
  deviceId?: string;
  lat?: string;
  lon?: string;
  createdAt?: string;
}
