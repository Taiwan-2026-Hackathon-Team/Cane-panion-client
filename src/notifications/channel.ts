import notifee, { AndroidImportance } from '@notifee/react-native';

import { SOS_CHANNEL_ID } from '../constants';

/**
 * High-importance Android channel for fall alerts. Idempotent — called from
 * both app startup and the background message handler, since a quit-state
 * push may arrive before the app has ever run.
 */
export async function ensureSosChannel(): Promise<string> {
  return notifee.createChannel({
    id: SOS_CHANNEL_ID,
    name: 'Fall alerts',
    importance: AndroidImportance.HIGH,
    sound: 'default',
    vibration: true,
    bypassDnd: true,
  });
}
