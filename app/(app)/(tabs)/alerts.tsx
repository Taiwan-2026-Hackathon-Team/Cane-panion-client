import React from 'react';
import {
  Alert as RNAlert,
  Pressable,
  SectionList,
  type SectionListData,
  View,
} from 'react-native';

import { Text } from '@/components/ui/text';
import { AlertListItem } from '@/components/AlertListItem';
import { useAlerts } from '@/hooks/useAlerts';
import { clearHistory, partitionAlerts } from '@/store/alerts';
import type { FallAlert } from '@/types/models';

type AlertSectionKey = 'active' | 'history';

type AlertSection = {
  key: AlertSectionKey;
  title: string;
  data: FallAlert[];
};

const listStyle = { flex: 1 } as const;
const contentContainerStyle = { paddingBottom: 40, paddingHorizontal: 16 } as const;

function keyExtractor(item: FallAlert) {
  return item.id;
}

function renderItem({ item }: { item: FallAlert }) {
  return (
    <AlertListItem
      id={item.id}
      deviceId={item.deviceId}
      createdAt={item.createdAt}
      status={item.status}
    />
  );
}

function confirmClearHistory() {
  RNAlert.alert(
    'Clear history?',
    'Remove all seen fall alerts from this device. Active alerts stay.',
    [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Clear',
        style: 'destructive',
        onPress: () => {
          clearHistory().catch(() => {});
        },
      },
    ],
  );
}

function renderSectionHeader({
  section,
}: {
  section: SectionListData<FallAlert, AlertSection>;
}) {
  return (
    <View className="flex-row items-center justify-between border-b border-border bg-background px-1 pb-2 pt-5">
      <Text variant="muted" className="text-xs font-medium uppercase tracking-wide">
        {section.title}
      </Text>
      {section.key === 'history' ? (
        <Pressable
          onPress={confirmClearHistory}
          accessibilityRole="button"
          accessibilityLabel="Clear history"
          hitSlop={8}
          className="min-h-11 min-w-11 items-end justify-center px-1 active:opacity-50"
        >
          <Text className="text-xs font-semibold tracking-wide text-destructive">Clear</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

export default function AlertsScreen() {
  const { alerts } = useAlerts();
  const { active, history } = partitionAlerts(alerts);
  const sections: AlertSection[] = [
    ...(active.length > 0 ? [{ key: 'active' as const, title: 'Active', data: active }] : []),
    ...(history.length > 0
      ? [{ key: 'history' as const, title: 'History', data: history }]
      : []),
  ];

  if (sections.length === 0) {
    return (
      <View className="flex-1 items-center bg-background px-10 pt-24">
        <Text className="text-base font-semibold text-foreground">No fall alerts</Text>
        <Text variant="muted" className="mt-2 text-center leading-5">
          When the cane detects a fall, the alert appears here and as a push notification.
        </Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-background">
      <SectionList
        style={listStyle}
        sections={sections}
        keyExtractor={keyExtractor}
        stickySectionHeadersEnabled={false}
        contentContainerStyle={contentContainerStyle}
        renderSectionHeader={renderSectionHeader}
        renderItem={renderItem}
      />
    </View>
  );
}
