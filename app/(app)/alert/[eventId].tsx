import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert as RNAlert,
  Linking,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { getGuardianApi } from '@/api/client';
import { SosMap } from '@/components/SosMap';
import { CANE_PHONE_NUMBER, COLORS } from '@/constants';
import { useAlert } from '@/hooks/useAlerts';
import {
  distanceMeters,
  formatDistance,
  useGuardianLocation,
} from '@/hooks/useGuardianLocation';
import { useRoute } from '@/hooks/useRoute';
import { formatWhen } from '@/utils/formatWhen';

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
  const insets = useSafeAreaInsets();
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

  // Viewing the alert marks it seen.
  useEffect(() => {
    if (eventId) getGuardianApi().acknowledgeAlert(eventId).catch(() => {});
  }, [eventId]);

  if (!alert) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator size="large" color={COLORS.danger} />
        <Text variant="muted" className="mt-2.5">
          Loading alert…
        </Text>
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
    <View className="flex-1">
      <SosMap
        alert={alert}
        userLocation={navigating ? location : undefined}
        routeCoords={route?.coords}
        showStraightLineFallback={routeFailed}
      />

      <View
        className="absolute left-3 right-3 rounded-[10px] border border-border bg-background/95 p-3"
        style={{ top: insets.top + 12 }}
      >
        <View className="flex-row items-center justify-between">
          <Text className="text-base font-bold text-foreground">Fall — {alert.deviceId}</Text>
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8 rounded-full border-destructive"
            onPress={() => router.push('/camera')}
          >
            <Ionicons name="videocam" size={18} color={COLORS.danger} />
          </Button>
        </View>
        <Text className="mt-1 text-[13px] text-foreground">{formatWhen(alert.createdAt)}</Text>
        <Text variant="muted" className="mt-0.5 text-xs">
          {alert.lat.toFixed(6)}, {alert.lon.toFixed(6)}
        </Text>
        {navigating && (
          <Text className="mt-1.5 text-sm font-bold text-destructive">{distanceLabel}</Text>
        )}
      </View>

      <View
        className="absolute left-3 right-3 flex-row gap-2.5"
        style={{ bottom: insets.bottom + 24 }}
      >
        <Button
          className="h-auto flex-1 rounded-[10px] py-3.5"
          style={{ backgroundColor: COLORS.ok }}
          onPress={callCane}
        >
          <Ionicons name="call" size={18} color="#fff" />
          <Text className="font-bold text-white">Call</Text>
        </Button>
        <Button
          variant={navigating ? 'outline' : 'destructive'}
          className="h-auto flex-1 rounded-[10px] py-3.5"
          onPress={() => setNavigating((v) => !v)}
        >
          <Ionicons
            name="navigate"
            size={18}
            color={navigating ? COLORS.danger : '#fff'}
          />
          <Text className={navigating ? 'font-bold text-destructive' : 'font-bold text-white'}>
            {navigating ? 'Stop' : 'Navigate'}
          </Text>
        </Button>
      </View>
    </View>
  );
}
