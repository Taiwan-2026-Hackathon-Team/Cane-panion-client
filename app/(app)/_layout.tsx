import { Stack } from 'expo-router';

import { COLORS } from '@/constants';

export default function AppLayout() {
  return (
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
  );
}
