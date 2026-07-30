import '../global.css';

import React, { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { PortalHost } from '@rn-primitives/portal';

import { AuthProvider, useAuth } from '../src/auth/AuthProvider';
import { COLORS } from '../src/constants';
import {
  initForegroundMessaging,
  useNotificationNavigation,
} from '../src/notifications/handlers';

function RootNavigator() {
  const {
    state: { status },
  } = useAuth();
  const isLoggedIn = status === 'authenticated';

  useEffect(() => initForegroundMessaging(), []);
  useNotificationNavigation();

  if (status === 'loading') {
    return (
      <View
        style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: COLORS.background,
        }}
      >
        <ActivityIndicator color={COLORS.danger} size="large" />
      </View>
    );
  }

  return (
    <>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Protected guard={isLoggedIn}>
          <Stack.Screen name="(app)" />
        </Stack.Protected>
        <Stack.Protected guard={!isLoggedIn}>
          <Stack.Screen name="(auth)" />
        </Stack.Protected>
      </Stack>
      <PortalHost />
    </>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <RootNavigator />
    </AuthProvider>
  );
}
