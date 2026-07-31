import React, { useState } from 'react';
import { View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { router } from 'expo-router';

import type { Route } from '@/api/routing';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { COLORS } from '@/constants';
import type { FallAlert } from '@/types/models';
import { formatDistance } from '@/utils/geo';
import { formatWhen } from '@/utils/formatWhen';

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

export function AlertDetailHeader({
  alert,
  place,
  straightLineMeters,
  navigating,
  route,
  routeFailed,
  hasGuardianLocation,
}: {
  alert: FallAlert;
  place?: string;
  straightLineMeters?: number;
  navigating: boolean;
  route?: Route;
  routeFailed: boolean;
  hasGuardianLocation: boolean;
}) {
  const [copied, setCopied] = useState(false);
  const navigateLabel = navigating
    ? routeStatusLabel({
        route,
        routeFailed,
        hasLocation: hasGuardianLocation,
      })
    : undefined;

  async function copyCoords() {
    await Clipboard.setStringAsync(`${alert.lat}, ${alert.lon}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  // Screen already sits under the stack header — don't add status-bar inset again
  // or this card can sit on top of the back control.
  return (
    <View className="absolute left-3 right-3 top-3 rounded-[10px] border border-border bg-background/95 p-3">
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
      {place ? (
        <Text variant="muted" className="mt-0.5 text-xs">
          {place}
        </Text>
      ) : null}
      <View className="mt-0.5 flex-row items-center gap-2">
        <Text variant="muted" className="shrink text-xs">
          {straightLineMeters !== undefined
            ? `${formatDistance(straightLineMeters)} away`
            : 'Waiting for GPS…'}
        </Text>
        <Button
          variant="ghost"
          size="sm"
          className="min-h-11 gap-1 px-2"
          onPress={copyCoords}
          accessibilityLabel={copied ? 'Copied coordinates' : 'Copy coordinates'}
        >
          <Ionicons
            name={copied ? 'checkmark' : 'copy-outline'}
            size={14}
            color={COLORS.muted}
          />
          <Text variant="muted" className="text-xs">
            {copied ? 'Copied' : 'Copy coordinates'}
          </Text>
        </Button>
      </View>
      {navigateLabel ? (
        <Text className="mt-1.5 text-sm font-bold text-destructive">{navigateLabel}</Text>
      ) : null}
    </View>
  );
}
