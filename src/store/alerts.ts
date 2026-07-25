import AsyncStorage from '@react-native-async-storage/async-storage';

import { ALERTS_STORAGE_KEY } from '../constants';
import type { FallAlert, FallAlertPushData } from '../types/models';

/**
 * AsyncStorage-backed alert store. This is the single write path for alerts:
 * the FCM background handler (index.ts), the foreground handler and the UI
 * all go through here, so history survives restarts and works before the Go
 * backend has a history endpoint.
 */

const MAX_ALERTS = 200;

/**
 * All mutations are chained through this promise so concurrent writers (two
 * near-simultaneous pushes, or a push racing an acknowledge) never interleave
 * their read-modify-write and drop an alert.
 */
let writeQueue: Promise<unknown> = Promise.resolve();

function serialized<T>(op: () => Promise<T>): Promise<T> {
  const run = writeQueue.then(op, op);
  writeQueue = run.catch(() => {});
  return run;
}

type Listener = () => void;
const listeners = new Set<Listener>();

/** UI screens subscribe so a foreground push updates the list in place. */
export function subscribeToAlerts(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function notify() {
  listeners.forEach((l) => l());
}

export async function listAlerts(): Promise<FallAlert[]> {
  const raw = await AsyncStorage.getItem(ALERTS_STORAGE_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as FallAlert[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export async function getAlert(id: string): Promise<FallAlert | undefined> {
  const alerts = await listAlerts();
  return alerts.find((a) => a.id === id);
}

async function saveAlerts(alerts: FallAlert[]): Promise<void> {
  await AsyncStorage.setItem(
    ALERTS_STORAGE_KEY,
    JSON.stringify(alerts.slice(0, MAX_ALERTS)),
  );
  notify();
}

/**
 * Parse an FCM data payload into a FallAlert. Returns undefined when the
 * payload is not a fall SOS or is missing coordinates.
 */
export function alertFromPushData(
  data: Record<string, string | object> | undefined,
): FallAlert | undefined {
  if (!data || data.type !== 'fall_sos') return undefined;
  const d = data as unknown as FallAlertPushData;
  const lat = Number(d.lat);
  const lon = Number(d.lon);
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return undefined;

  const deviceId = d.deviceId ?? 'unknown-cane';
  const createdAt = d.createdAt ?? new Date().toISOString();
  return {
    id: d.eventId ?? `${deviceId}-${createdAt}`,
    deviceId,
    type: 'fall_sos',
    lat,
    lon,
    createdAt,
    receivedAt: new Date().toISOString(),
    status: 'active',
  };
}

/** Insert a new alert, or return the stored one when the push is a duplicate. */
export function upsertAlert(alert: FallAlert): Promise<FallAlert> {
  return serialized(async () => {
    const alerts = await listAlerts();
    const existing = alerts.find((a) => a.id === alert.id);
    if (existing) return existing;
    await saveAlerts([alert, ...alerts]);
    return alert;
  });
}

export function acknowledgeAlert(id: string): Promise<FallAlert | undefined> {
  return serialized(async () => {
    const alerts = await listAlerts();
    const target = alerts.find((a) => a.id === id);
    if (!target || target.status === 'acknowledged') return target;
    target.status = 'acknowledged';
    target.acknowledgedAt = new Date().toISOString();
    await saveAlerts(alerts);
    return target;
  });
}

export async function activeAlerts(): Promise<FallAlert[]> {
  return (await listAlerts()).filter((a) => a.status === 'active');
}
