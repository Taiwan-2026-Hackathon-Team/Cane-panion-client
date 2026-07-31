import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert as RNAlert,
  BackHandler,
  Linking,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams } from 'expo-router';

import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { getGuardianApi } from '@/api/client';
import { AlertDetailHeader } from '@/components/AlertDetailHeader';
import { SosMap } from '@/components/SosMap';
import { CANE_PHONE_NUMBER, COLORS } from '@/constants';
import { useAlert } from '@/hooks/useAlerts';
import { useAlertDetailLocation } from '@/hooks/useAlertDetailLocation';
import { useRoute } from '@/hooks/useRoute';
import { distanceMeters } from '@/utils/geo';
import { leaveAlertDetail } from '@/utils/leaveAlertDetail';

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
  const fallLocation = alert
    ? { latitude: alert.lat, longitude: alert.lon }
    : undefined;
  const { guardianLocation, place } = useAlertDetailLocation({
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
    navigating ? guardianLocation : undefined,
    fallLocation,
  );

  // Fresh alert → leave Navigate mode; viewing marks it seen.
  useEffect(() => {
    setNavigating(false);
    if (eventId) getGuardianApi().markAlertSeen(eventId).catch(() => {});
  }, [eventId]);

  // Android MapView often swallows the system back button.
  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      leaveAlertDetail();
      return true;
    });
    return () => sub.remove();
  }, []);

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

  const straightLineMeters =
    guardianLocation && fallLocation
      ? distanceMeters(guardianLocation, fallLocation)
      : undefined;

  return (
    <View className="flex-1 overflow-hidden">
      <SosMap
        alert={alert}
        userLocation={navigating ? guardianLocation : undefined}
        routeCoords={route?.coords}
        showStraightLineFallback={routeFailed}
      />

      <AlertDetailHeader
        alert={alert}
        place={place}
        straightLineMeters={straightLineMeters}
        navigating={navigating}
        route={route}
        routeFailed={routeFailed}
        hasGuardianLocation={guardianLocation !== undefined}
      />

      <View className="absolute bottom-6 left-3 right-3 flex-row gap-2.5">
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
