import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { COLORS } from '@/constants';

export default function LiveMapScreen() {
  return (
    <View style={styles.container}>
      <Ionicons name="map-outline" size={44} color={COLORS.muted} />
      <Text style={styles.title}>Live location</Text>
      <Text style={styles.text}>
        A live map of the cane's position will appear here once the backend
        streams location updates.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  title: { fontSize: 18, fontWeight: '700', color: COLORS.text, marginTop: 12 },
  text: { textAlign: 'center', color: COLORS.muted, marginTop: 8, lineHeight: 20 },
});
