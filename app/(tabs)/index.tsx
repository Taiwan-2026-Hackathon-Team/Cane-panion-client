import React from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';

import { AlertListItem } from '../../src/components/AlertListItem';
import { COLORS } from '../../src/constants';
import { useAlerts } from '../../src/hooks/useAlerts';
import { alertFromPushData, upsertAlert } from '../../src/store/alerts';
import { displaySosNotification } from '../../src/notifications/handlers';

/** Dev-only: inject a fake fall through the exact same path a push takes. */
async function simulateFall() {
  const alert = alertFromPushData({
    type: 'fall_sos',
    eventId: `sim-${Date.now()}`,
    deviceId: 'cane-panion-01',
    lat: '14.599512',
    lon: '120.984222',
    createdAt: new Date().toISOString(),
  });
  if (alert) {
    await upsertAlert(alert);
    await displaySosNotification(alert);
  }
}

export default function AlertsScreen() {
  const { alerts } = useAlerts();
  const active = alerts.filter((a) => a.status === 'active');

  return (
    <View style={styles.container}>
      {active.length > 0 && (
        <Pressable
          style={styles.banner}
          onPress={() => router.push(`/alert/${active[0].id}`)}
        >
          <Text style={styles.bannerTitle}>
            {active.length === 1 ? 'ACTIVE FALL ALERT' : `${active.length} ACTIVE FALL ALERTS`}
          </Text>
          <Text style={styles.bannerSubtitle}>
            {active[0].deviceId} — tap to view location
          </Text>
        </Pressable>
      )}

      <FlatList
        data={alerts}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <AlertListItem alert={item} onPress={() => router.push(`/alert/${item.id}`)} />
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>No fall alerts</Text>
            <Text style={styles.emptyText}>
              When the cane detects a fall, the alert appears here and as a push
              notification.
            </Text>
          </View>
        }
      />

      {__DEV__ && (
        <Pressable style={styles.devButton} onPress={simulateFall}>
          <Text style={styles.devButtonText}>Simulate fall (dev)</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  banner: { backgroundColor: COLORS.danger, padding: 14 },
  bannerTitle: { color: '#fff', fontWeight: '800', fontSize: 15 },
  bannerSubtitle: { color: '#ffd6d6', marginTop: 2, fontSize: 13 },
  empty: { alignItems: 'center', padding: 40, marginTop: 60 },
  emptyTitle: { fontSize: 17, fontWeight: '600', color: COLORS.text },
  emptyText: { textAlign: 'center', color: COLORS.muted, marginTop: 8, lineHeight: 20 },
  devButton: {
    margin: 14,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    alignItems: 'center',
  },
  devButtonText: { color: COLORS.muted, fontWeight: '600' },
});
