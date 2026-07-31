import { Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Stack } from 'expo-router';

import { COLORS } from '@/constants';
import { leaveAlertDetail } from '@/utils/leaveAlertDetail';

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
          // Always show a back control — the default is hidden when the stack
          // has nowhere to pop (e.g. opened from a notification).
          headerLeftContainerStyle: styles.backContainer,
          headerLeft: () => (
            <Pressable
              onPress={leaveAlertDetail}
              hitSlop={12}
              accessibilityRole="button"
              accessibilityLabel="Go back"
              style={styles.backButton}
            >
              <Ionicons name="arrow-back" size={22} color="#fff" />
            </Pressable>
          ),
        }}
      />
      <Stack.Screen
        name="set-home"
        options={{ title: 'Set home location', presentation: 'modal' }}
      />
    </Stack>
  );
}

const styles = StyleSheet.create({
  backContainer: { paddingLeft: 8 },
  backButton: { paddingVertical: 8, paddingRight: 12 },
});
