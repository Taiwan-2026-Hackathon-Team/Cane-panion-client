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

function AuthLoading() {
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

function RootNavigator() {
  const {
    state: { status },
  } = useAuth();
  const isLoggedIn = status === 'authenticated';

  useEffect(() => initForegroundMessaging(), []);
  useNotificationNavigation();

  // Token hydrate suspends in AuthProvider; this covers GET /me after a token exists.
  if (status === 'loading') {
    return <AuthLoading />;
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
    <AuthProvider fallback={<AuthLoading />}>
      <RootNavigator />
    </AuthProvider>
  );
}
