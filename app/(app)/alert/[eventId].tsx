import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert as RNAlert,
  Linking,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import type { Route } from '@/api/routing';
import { getGuardianApi } from '@/api/client';
import { AlertDetailHeader } from '@/components/AlertDetailHeader';
import { SosMap } from '@/components/SosMap';
import { CANE_PHONE_NUMBER, COLORS } from '@/constants';
import { useAlert } from '@/hooks/useAlerts';
import { useGuardianLocation } from '@/hooks/useGuardianLocation';
import { useRoute } from '@/hooks/useRoute';
import { distanceMeters, formatDistance } from '@/utils/geo';

// The OSRM demo server's duration is car-profile; estimate walking at ~5 km/h.
function formatWalkEta(routeMeters: number): string {
  const min = Math.max(1, Math.round(routeMeters / 83));
  return min < 60 ? `${min} min` : `${Math.floor(min / 60)} h ${min % 60} min`;
}

function routeStatusLabel({
  route,
  routeFailed,
  hasLocation,
}: {
  route?: Route;
  routeFailed: boolean;
  hasLocation: boolean;
}): string {
  if (route) {
    return `${formatDistance(route.distanceMeters)} · ${formatWalkEta(route.distanceMeters)} walk`;
  }
  if (!hasLocation) return 'Getting your location…';
  if (routeFailed) return 'Route unavailable';
  return 'Finding route…';
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
  const fallLocation = alert
    ? { latitude: alert.lat, longitude: alert.lon }
    : undefined;
  const { location, place } = useGuardianLocation({
    placeAt: fallLocation,
    watch: navigating,
    onDenied: () => {
      setNavigating(false);
      RNAlert.alert(
        'Location needed',
        'Allow location access to navigate to the fall location.',
      );
    },
  });
  const { route, failed: routeFailed } = useRoute(
    navigating ? location : undefined,
    fallLocation,
  );

  // Fresh alert → leave Navigate mode; viewing marks it seen.
  useEffect(() => {
    setNavigating(false);
    if (eventId) getGuardianApi().markAlertSeen(eventId).catch(() => {});
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

  const straightLineMeters = location
    ? distanceMeters(location, { latitude: alert.lat, longitude: alert.lon })
    : undefined;

  return (
    <View className="flex-1">
      <SosMap
        alert={alert}
        userLocation={navigating ? location : undefined}
        routeCoords={route?.coords}
        showStraightLineFallback={routeFailed}
      />

      <AlertDetailHeader
        alert={alert}
        place={place}
        straightLineMeters={straightLineMeters}
        routeStatusLabel={
          navigating
            ? routeStatusLabel({
                route,
                routeFailed,
                hasLocation: location !== undefined,
              })
            : undefined
        }
        topInset={insets.top}
      />

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
