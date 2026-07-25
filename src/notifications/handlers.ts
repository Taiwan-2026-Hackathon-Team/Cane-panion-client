import { useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import notifee, {
  AndroidCategory,
  AndroidImportance,
  EventType,
} from '@notifee/react-native';
import {
  FirebaseMessagingTypes,
  getInitialNotification,
  getMessaging,
  onMessage,
  onNotificationOpenedApp,
  subscribeToTopic,
} from '@react-native-firebase/messaging';
import { router, useRootNavigationState } from 'expo-router';

import { SOS_CHANNEL_ID, SOS_TOPIC } from '../constants';
import { alertFromPushData, upsertAlert } from '../store/alerts';
import type { FallAlert } from '../types/models';
import { ensureSosChannel } from './channel';
import {
  consumePendingAlertNav,
  extractEventId,
  onPendingAlertNav,
  setPendingAlertNav,
} from './navigateFromNotification';

/**
 * Shared path for every incoming FCM message, foreground or background:
 * parse the data payload, persist the alert, display the alarm-style
 * notification. Must stay UI-free — the background handler runs headless.
 */
export async function handleRemoteMessage(
  message: FirebaseMessagingTypes.RemoteMessage,
): Promise<void> {
  const alert = alertFromPushData(message.data);
  if (!alert) return;
  const stored = await upsertAlert(alert);
  // On iOS the push contract carries an APNs alert block that the OS renders
  // itself — displaying again via Notifee would double-notify the guardian.
  if (Platform.OS === 'ios' && message.notification) return;
  await displaySosNotification(stored);
}

export async function displaySosNotification(alert: FallAlert): Promise<void> {
  await ensureSosChannel();
  await notifee.displayNotification({
    id: alert.id,
    title: 'FALL DETECTED',
    body: `${alert.deviceId} reported a fall. Tap to see the location.`,
    data: { eventId: alert.id },
    android: {
      channelId: SOS_CHANNEL_ID,
      importance: AndroidImportance.HIGH,
      category: AndroidCategory.ALARM,
      sound: 'default',
      vibrationPattern: [300, 500, 300, 500],
      pressAction: { id: 'default', launchActivity: 'default' },
      fullScreenAction: { id: 'default', launchActivity: 'default' },
      color: '#d92b2b',
    },
    ios: {
      sound: 'default',
      critical: false,
      interruptionLevel: 'timeSensitive',
    },
  });
}

/**
 * Wire foreground-side messaging once at root mount: permissions, topic
 * subscription, foreground messages, and warm-start notification presses.
 * Returns an unsubscribe for everything it registered.
 */
export function initForegroundMessaging(): () => void {
  const messaging = getMessaging();

  // Covers the iOS prompt and Android 13+ POST_NOTIFICATIONS in one call.
  notifee.requestPermission().catch(() => {});
  ensureSosChannel().catch(() => {});
  subscribeToTopic(messaging, SOS_TOPIC).catch(() => {});

  const unsubMessage = onMessage(messaging, handleRemoteMessage);

  // App was in background (not quit) and the user tapped the FCM notification.
  const unsubOpened = onNotificationOpenedApp(messaging, (message) => {
    const id = extractEventId(message.data);
    if (id) setPendingAlertNav(id);
  });

  // Notifee-rendered notifications pressed while the app is in memory.
  const unsubNotifee = notifee.onForegroundEvent(({ type, detail }) => {
    if (type === EventType.PRESS) {
      const id = extractEventId(detail.notification?.data);
      if (id) setPendingAlertNav(id);
    }
  });

  return () => {
    unsubMessage();
    unsubOpened();
    unsubNotifee();
  };
}

/**
 * Mounted once in the root layout. Drains pending notification navigation
 * once expo-router is actually ready, and checks both cold-start sources
 * (FCM-launched and Notifee-launched).
 */
export function useNotificationNavigation(): void {
  const navState = useRootNavigationState();
  const navReady = Boolean(navState?.key);
  const checkedInitial = useRef(false);

  useEffect(() => {
    if (!navReady) return;

    const drain = () => {
      const id = consumePendingAlertNav();
      if (id) router.push(`/alert/${id}`);
    };

    if (!checkedInitial.current) {
      checkedInitial.current = true;
      getInitialNotification(getMessaging())
        .then((message) => {
          const id = message && extractEventId(message.data);
          if (id) setPendingAlertNav(id);
        })
        .catch(() => {});
      notifee
        .getInitialNotification()
        .then((initial) => {
          const id = extractEventId(initial?.notification?.data);
          if (id) setPendingAlertNav(id);
        })
        .catch(() => {});
    }

    const unsub = onPendingAlertNav(drain);
    drain();
    return unsub;
  }, [navReady]);
}
