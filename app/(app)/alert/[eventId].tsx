import React, { useEffect } from 'react';
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
import { distanceMeters } from '@/utils/geo';
import { leaveAlertDetail } from '@/utils/leaveAlertDetail';
import { openWalkingDirections } from '@/utils/openWalkingDirections';

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
  const { alert, ready } = useAlert(eventId);
  const fallLocation = alert
    ? { latitude: alert.lat, longitude: alert.lon }
    : undefined;
  const { guardianLocation, place } = useAlertDetailLocation(fallLocation);

  // Viewing marks the alert seen.
  useEffect(() => {
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

  if (!ready) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator size="large" color={COLORS.danger} />
        <Text variant="muted" className="mt-2.5">
          Loading alert…
        </Text>
      </View>
    );
  }

  if (!alert) {
    return (
      <View className="flex-1 items-center justify-center bg-background px-10">
        <Text className="text-base font-semibold text-foreground">Alert not found</Text>
        <Text variant="muted" className="mt-2 text-center leading-5">
          This alert was removed from history or is no longer available.
        </Text>
        <Button
          variant="outline"
          className="mt-6"
          onPress={leaveAlertDetail}
          accessibilityLabel="Back to alerts"
        >
          <Text className="font-semibold">Back to alerts</Text>
        </Button>
      </View>
    );
  }

  const straightLineMeters =
    guardianLocation && fallLocation
      ? distanceMeters(guardianLocation, fallLocation)
      : undefined;

  function navigateToFall() {
    if (!fallLocation) return;
    openWalkingDirections(fallLocation, guardianLocation).catch(() => {
      RNAlert.alert(
        'Cannot open maps',
        'No maps app is available to show walking directions to the fall.',
      );
    });
  }

  return (
    <View className="flex-1 overflow-hidden">
      <SosMap alert={alert} />

      <AlertDetailHeader
        alert={alert}
        place={place}
        straightLineMeters={straightLineMeters}
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
          variant="destructive"
          className="h-auto flex-1 rounded-[10px] py-3.5"
          onPress={navigateToFall}
        >
          <Ionicons name="navigate" size={18} color="#fff" />
          <Text className="font-bold text-white">Navigate</Text>
        </Button>
      </View>
    </View>
  );
}
