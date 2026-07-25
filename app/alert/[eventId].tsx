import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert as RNAlert,
  Linking,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';

import { getGuardianApi } from '../../src/api/client';
import { formatWhen } from '../../src/components/AlertListItem';
import { SosMap } from '../../src/components/SosMap';
import { StatusPill } from '../../src/components/StatusPill';
import { CANE_PHONE_NUMBER, COLORS } from '../../src/constants';
import { useAlert } from '../../src/hooks/useAlerts';
import {
  distanceMeters,
  formatDistance,
  useGuardianLocation,
} from '../../src/hooks/useGuardianLocation';
import { useRoute } from '../../src/hooks/useRoute';

// The OSRM demo server's duration is car-profile; estimate walking at ~5 km/h.
function formatWalkEta(routeMeters: number): string {
  const min = Math.max(1, Math.round(routeMeters / 83));
  return min < 60 ? `${min} min` : `${Math.floor(min / 60)} h ${min % 60} min`;
}

function callCane() {
  Linking.openURL(`tel:${CANE_PHONE_NUMBER}`).catch(() => {
    RNAlert.alert(
      'Cannot place call',
      `This device cannot dial ${CANE_PHONE_NUMBER}. Use a phone to call the cane.`,
    );
  });
}

export default function AlertScreen() {
  const { eventId } = useLocalSearchParams<{ eventId: string }>();
  const alert = useAlert(eventId);
  const [navigating, setNavigating] = useState(false);
  const { location } = useGuardianLocation(navigating, () => {
    setNavigating(false);
    RNAlert.alert(
      'Location needed',
      'Allow location access to navigate to the fall location.',
    );
  });
  const { route, failed: routeFailed } = useRoute(
    navigating && alert ? location : undefined,
    { latitude: alert?.lat ?? 0, longitude: alert?.lon ?? 0 },
  );

  // Viewing the alert marks it seen — this is what clears the red banner.
  useEffect(() => {
    if (eventId) getGuardianApi().acknowledgeAlert(eventId).catch(() => {});
  }, [eventId]);

  if (!alert) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={COLORS.danger} />
        <Text style={styles.loadingText}>Loading alert…</Text>
      </View>
    );
  }

  const straightLine =
    location &&
    distanceMeters(location, { latitude: alert.lat, longitude: alert.lon });
  const distanceLabel = route
    ? `${formatDistance(route.distanceMeters)} · ${formatWalkEta(route.distanceMeters)} walk`
    : location === undefined
      ? 'Getting your location…'
      : routeFailed && straightLine !== undefined
        ? `${formatDistance(straightLine)} away (straight line)`
        : 'Finding route…';

  return (
    <View style={styles.container}>
      <SosMap
        alert={alert}
        userLocation={navigating ? location : undefined}
        routeCoords={route?.coords}
        showStraightLineFallback={routeFailed}
      />

      <View style={styles.header}>
        <View style={styles.headerRow}>
          <Text style={styles.headerTitle}>Fall — {alert.deviceId}</Text>
          <View style={styles.headerActions}>
            <Pressable
              style={styles.cameraButton}
              onPress={() => router.push('/camera')}
              hitSlop={8}
            >
              <Ionicons name="videocam" size={18} color={COLORS.danger} />
            </Pressable>
            <StatusPill status={alert.status} />
          </View>
        </View>
        <Text style={styles.headerTime}>{formatWhen(alert.createdAt)}</Text>
        <Text style={styles.headerCoords}>
          {alert.lat.toFixed(6)}, {alert.lon.toFixed(6)}
        </Text>
        {navigating && <Text style={styles.distance}>{distanceLabel}</Text>}
      </View>

      <View style={styles.footer}>
        <Pressable style={[styles.button, styles.callButton]} onPress={callCane}>
          <Ionicons name="call" size={18} color="#fff" />
          <Text style={styles.callButtonText}>Call</Text>
        </Pressable>
        <Pressable
          style={[styles.button, navigating ? styles.navButtonActive : styles.navButton]}
          onPress={() => setNavigating((v) => !v)}
        >
          <Ionicons name="navigate" size={18} color={navigating ? COLORS.danger : '#fff'} />
          <Text style={navigating ? styles.navButtonActiveText : styles.navButtonText}>
            {navigating ? 'Stop' : 'Navigate'}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  loadingText: { marginTop: 10, color: COLORS.muted },
  header: {
    position: 'absolute',
    top: 12,
    left: 12,
    right: 12,
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: 10,
    padding: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: COLORS.cardBorder,
  },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  cameraButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.danger,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: { fontSize: 16, fontWeight: '700', color: COLORS.text },
  headerTime: { marginTop: 4, color: COLORS.text, fontSize: 13 },
  headerCoords: { marginTop: 2, color: COLORS.muted, fontSize: 12 },
  distance: { marginTop: 6, color: COLORS.danger, fontWeight: '700', fontSize: 14 },
  footer: {
    position: 'absolute',
    bottom: 24,
    left: 12,
    right: 12,
    flexDirection: 'row',
    gap: 10,
  },
  button: {
    flex: 1,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  callButton: { backgroundColor: COLORS.ok },
  callButtonText: { fontWeight: '700', color: '#fff' },
  navButton: { backgroundColor: COLORS.danger },
  navButtonText: { fontWeight: '700', color: '#fff' },
  navButtonActive: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: COLORS.danger,
  },
  navButtonActiveText: { fontWeight: '700', color: COLORS.danger },
});
