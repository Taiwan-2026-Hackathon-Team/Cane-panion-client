import React from 'react';
import type { ColorValue } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';

import { COLORS } from '../../../src/constants';

type IconName = keyof typeof Ionicons.glyphMap;

function icon(name: IconName) {
  return ({ color, size }: { color: ColorValue; size: number }) => (
    <Ionicons name={name} color={color} size={size} />
  );
}

export default function TabsLayout() {
  return (
    <Tabs screenOptions={{ tabBarActiveTintColor: COLORS.danger }}>
      {/* `index` is Live Map so Stack.Protected lands here after login. */}
      <Tabs.Screen
        name="index"
        options={{ title: 'Live Map', tabBarIcon: icon('map') }}
      />
      <Tabs.Screen
        name="alerts"
        options={{ title: 'Alerts', tabBarIcon: icon('warning') }}
      />
      <Tabs.Screen
        name="camera"
        options={{
          title: 'Camera',
          tabBarIcon: icon('videocam'),
          headerTitle: 'Cane Camera',
          headerStyle: { backgroundColor: '#111' },
          headerTintColor: '#fff',
        }}
      />
      <Tabs.Screen
        name="routes"
        options={{ title: 'Routes', tabBarIcon: icon('navigate') }}
      />
      <Tabs.Screen
        name="settings"
        options={{ title: 'Cane Settings', tabBarIcon: icon('settings') }}
      />
    </Tabs>
  );
}
