import React, { useCallback, useEffect, useState } from 'react';
import { Pressable, ScrollView, Share, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getMessaging, getToken } from '@react-native-firebase/messaging';
import { router, useFocusEffect } from 'expo-router';

import type { LatLng } from '../../../src/types/models';
import { COLORS, SOS_TOPIC } from '../../../src/constants';
import { getHomeLocation } from '../../../src/store/settings';
import { useAuth } from '@/src/auth/AuthProvider';
import { useLogoutMutation } from '@/src/auth/authMutations';

const FUTURE_SETTINGS = [
  ['Haptic intensity', 'Buzz strength per motor'],
  ['Audio', 'Volume, speech rate, verbosity'],
  ['Sonar sensitivity', 'Obstacle alert distance'],
  ['Fall detection', 'Sensitivity and “are you okay?” grace period'],
] as const;

export default function SettingsScreen() {
  const [token, setToken] = useState<string>();
  const [home, setHome] = useState<LatLng>();
  const {
    state: { user },
  } = useAuth();
  const logoutMutation = useLogoutMutation();

  useEffect(() => {
    getToken(getMessaging()).then(setToken).catch(() => setToken('unavailable'));
  }, []);

  useFocusEffect(
    useCallback(() => {
      getHomeLocation().then(setHome);
    }, []),
  );

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.sectionTitle}>Account</Text>
      <Text style={styles.sectionNote}>{user?.username ?? 'Signed in'}</Text>
      <Pressable
        style={[styles.logoutButton, logoutMutation.isPending && styles.logoutDisabled]}
        disabled={logoutMutation.isPending}
        onPress={() => logoutMutation.mutate()}
      >
        <Text style={styles.logoutButtonText}>
          {logoutMutation.isPending ? 'Signing out…' : 'Sign out'}
        </Text>
      </Pressable>

      <Text style={styles.sectionTitle}>Saved places</Text>
      <Text style={styles.sectionNote}>
        Places you can send to the cane for quick navigation.
      </Text>
      <Pressable style={styles.row} onPress={() => router.push('/set-home')}>
        <Ionicons name="home" size={20} color={COLORS.danger} style={styles.rowIcon} />
        <View style={styles.rowText}>
          <Text style={styles.rowTitle}>Home</Text>
          <Text style={styles.rowDesc}>
            {home
              ? `${home.latitude.toFixed(6)}, ${home.longitude.toFixed(6)}`
              : 'Not set — tap to place on the map'}
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color={COLORS.muted} />
      </Pressable>
      <Text style={styles.sectionTitle}>Cane settings</Text>
      <Text style={styles.sectionNote}>
        Adjust how the cane feels and sounds. Coming soon.
      </Text>
      {FUTURE_SETTINGS.map(([name, desc]) => (
        <View key={name} style={styles.row}>
          <View style={styles.rowText}>
            <Text style={styles.rowTitle}>{name}</Text>
            <Text style={styles.rowDesc}>{desc}</Text>
          </View>
          <Text style={styles.soon}>soon</Text>
        </View>
      ))}

      <Text style={styles.sectionTitle}>Developer</Text>
      <Text style={styles.sectionNote}>
        Subscribed to topic “{SOS_TOPIC}”. Use this device token to send a test
        push from the Firebase console.
      </Text>
      <View style={styles.tokenBox}>
        <Text selectable style={styles.token}>
          {token ?? 'Loading token…'}
        </Text>
      </View>
      {token && token !== 'unavailable' && (
        <Pressable style={styles.shareButton} onPress={() => Share.share({ message: token })}>
          <Text style={styles.shareButtonText}>Share token</Text>
        </Pressable>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: 16, paddingBottom: 40 },
  sectionTitle: { fontSize: 17, fontWeight: '700', color: COLORS.text, marginTop: 16 },
  sectionNote: { color: COLORS.muted, marginTop: 4, marginBottom: 8, lineHeight: 19 },
  logoutButton: {
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    backgroundColor: COLORS.danger,
  },
  logoutDisabled: { opacity: 0.6 },
  logoutButtonText: { color: '#fff', fontWeight: '700' },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.cardBorder,
  },
  rowIcon: { marginRight: 12 },
  rowText: { flex: 1 },
  rowTitle: { fontSize: 15, fontWeight: '600', color: COLORS.text },
  rowDesc: { fontSize: 13, color: COLORS.muted, marginTop: 2 },
  soon: { color: COLORS.muted, fontSize: 12, fontStyle: 'italic' },
  tokenBox: {
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    borderRadius: 8,
    padding: 10,
    backgroundColor: '#f8f9fa',
  },
  token: { fontSize: 11, color: COLORS.text, fontFamily: 'Courier' },
  shareButton: {
    marginTop: 10,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  shareButtonText: { fontWeight: '600', color: COLORS.text },
});
