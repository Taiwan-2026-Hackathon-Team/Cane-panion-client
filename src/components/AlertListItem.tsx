import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { COLORS } from '../constants';
import type { FallAlert } from '../types/models';
import { StatusPill } from './StatusPill';

export function formatWhen(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleString();
}

export function AlertListItem({
  alert,
  onPress,
}: {
  alert: FallAlert;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.row, pressed && styles.pressed]}>
      <View style={styles.info}>
        <Text style={styles.title}>Fall — {alert.deviceId}</Text>
        <Text style={styles.subtitle}>{formatWhen(alert.createdAt)}</Text>
        <Text style={styles.coords}>
          {alert.lat.toFixed(6)}, {alert.lon.toFixed(6)}
        </Text>
      </View>
      <StatusPill status={alert.status} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.cardBorder,
    backgroundColor: COLORS.background,
  },
  pressed: { opacity: 0.6 },
  info: { flex: 1, marginRight: 10 },
  title: { fontSize: 15, fontWeight: '600', color: COLORS.text },
  subtitle: { fontSize: 13, color: COLORS.muted, marginTop: 2 },
  coords: { fontSize: 12, color: COLORS.muted, marginTop: 2, fontVariant: ['tabular-nums'] },
});
