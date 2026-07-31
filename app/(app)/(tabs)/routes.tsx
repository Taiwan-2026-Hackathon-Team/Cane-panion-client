import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { COLORS } from '@/constants';

export default function RoutesScreen() {
  return (
    <View style={styles.container}>
      <Ionicons name="navigate-outline" size={44} color={COLORS.muted} />
      <Text style={styles.title}>Route planner</Text>
      <Text style={styles.text}>
        Plan a route and push it to the cane for turn-by-turn guidance. Coming
        with the backend's routing support.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  title: { fontSize: 18, fontWeight: '700', color: COLORS.text, marginTop: 12 },
  text: { textAlign: 'center', color: COLORS.muted, marginTop: 8, lineHeight: 20 },
});
