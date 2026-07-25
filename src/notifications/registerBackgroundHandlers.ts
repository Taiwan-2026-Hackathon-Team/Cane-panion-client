import notifee, { EventType } from '@notifee/react-native';
import {
  getMessaging,
  setBackgroundMessageHandler,
} from '@react-native-firebase/messaging';

import { handleRemoteMessage } from './handlers';
import {
  extractEventId,
  setPendingAlertNav,
} from './navigateFromNotification';

/**
 * Quit/background-state registration. This module is imported from index.ts
 * BEFORE 'expo-router/entry' — moving these calls into a component means
 * quit-state pushes are silently dropped.
 */
setBackgroundMessageHandler(getMessaging(), handleRemoteMessage);

notifee.onBackgroundEvent(async ({ type, detail }) => {
  if (type === EventType.PRESS) {
    const id = extractEventId(detail.notification?.data);
    if (id) setPendingAlertNav(id);
  }
});
