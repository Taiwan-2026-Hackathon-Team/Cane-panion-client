import React from 'react';
import { View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { COLORS } from '@/constants';
import type { FallAlert } from '@/types/models';
import { formatDistance } from '@/utils/geo';
import { formatWhen } from '@/utils/formatWhen';

export function AlertDetailHeader({
  alert,
  place,
  straightLineMeters,
  routeStatusLabel,
  topInset,
}: {
  alert: FallAlert;
  place?: string;
  straightLineMeters?: number;
  routeStatusLabel?: string;
  topInset: number;
}) {
  return (
    <View
      className="absolute left-3 right-3 rounded-[10px] border border-border bg-background/95 p-3"
      style={{ top: topInset + 12 }}
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
      {place ? (
        <Text variant="muted" className="mt-0.5 text-xs">
          {place}
        </Text>
      ) : null}
      {straightLineMeters !== undefined ? (
        <Text variant="muted" className="mt-0.5 text-xs">
          {formatDistance(straightLineMeters)} away
        </Text>
      ) : null}
      {routeStatusLabel ? (
        <Text className="mt-1.5 text-sm font-bold text-destructive">{routeStatusLabel}</Text>
      ) : null}
    </View>
  );
}
