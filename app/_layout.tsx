import React, { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import { COLORS } from '../src/constants';
import {
  initForegroundMessaging,
  useNotificationNavigation,
} from '../src/notifications/handlers';

export default function RootLayout() {
  useEffect(() => initForegroundMessaging(), []);
  useNotificationNavigation();

  return (
    <>
      <StatusBar style="dark" />
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="alert/[eventId]"
          options={{
            title: 'Fall alert',
            headerStyle: { backgroundColor: COLORS.danger },
            headerTintColor: '#fff',
          }}
        />
        <Stack.Screen
          name="set-home"
          options={{ title: 'Set home location', presentation: 'modal' }}
        />
      </Stack>
    </>
  );
}
