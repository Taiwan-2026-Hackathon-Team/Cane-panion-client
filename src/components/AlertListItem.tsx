import React from 'react';
import { Pressable, View } from 'react-native';
import { router } from 'expo-router';

import { Text } from '@/components/ui/text';
import { cn } from '@/lib/utils';
import { formatWhen } from '@/utils/formatWhen';
import type { AlertStatus } from '@/types/models';

export function AlertListItem({
  id,
  deviceId,
  createdAt,
  status,
}: {
  id: string;
  deviceId: string;
  createdAt: string;
  status: AlertStatus;
}) {
  return (
    <Pressable
      onPress={() => router.push(`/alert/${id}`)}
      className="flex-row border-b border-border bg-background active:opacity-60"
    >
      <View className="w-1 items-stretch py-3">
        <View className={cn('flex-1', status === 'active' && 'bg-destructive')} />
      </View>
      <View className="flex-1 px-3 py-3">
        <Text className="text-[15px] font-semibold text-foreground">Fall — {deviceId}</Text>
        <Text variant="muted" className="mt-0.5">
          {formatWhen(createdAt)}
        </Text>
      </View>
    </Pressable>
  );
}
