import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { COLORS } from '../constants';
import type { AlertStatus } from '../types/models';

export function StatusPill({ status }: { status: AlertStatus }) {
  const active = status === 'active';
  return (
    <View style={[styles.pill, { backgroundColor: active ? COLORS.danger : COLORS.ok }]}>
      <Text style={styles.label}>{active ? 'ACTIVE' : 'SEEN'}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 3,
    alignSelf: 'flex-start',
  },
  label: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});
