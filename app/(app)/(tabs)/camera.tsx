import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { COLORS } from '@/constants';

type FeedState = 'connecting' | 'snapshot' | 'refreshing';

/**
 * Guardian view of the cane's camera. Hardcoded/simulated for now: the real
 * feed arrives via the backend (cane uploads snapshots, backend serves them —
 * see architecture_8.docx). The UX is snapshot-first: Cat-1 uplink and the
 * ESP32 can't sustain live video, so the guardian sees the latest photo and
 * can request a fresh one.
 */
export default function CameraScreen() {
  const [state, setState] = useState<FeedState>('connecting');
  const [takenAt, setTakenAt] = useState<Date>();

  useEffect(() => {
    const t = setTimeout(() => {
      setState('snapshot');
      setTakenAt(new Date());
    }, 1500);
    return () => clearTimeout(t);
  }, []);

  const requestSnapshot = useCallback(() => {
    if (state !== 'snapshot') return;
    setState('refreshing');
    setTimeout(() => {
      setState('snapshot');
      setTakenAt(new Date());
    }, 1200);
  }, [state]);

  const busy = state !== 'snapshot';

  return (
    <View style={styles.container}>
      {/* 4:3 viewport matching the OV2640's aspect */}
      <View style={styles.viewport}>
        {state === 'connecting' ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color="#fff" />
            <Text style={styles.viewportText}>Connecting to cane…</Text>
          </View>
        ) : (
          <View style={styles.center}>
            <Ionicons name="videocam-outline" size={56} color="#5a5a5a" />
            <Text style={styles.simLabel}>SIMULATED PREVIEW</Text>
            <Text style={styles.viewportText}>
              The live snapshot appears here once the backend serves the
              cane's camera.
            </Text>
          </View>
        )}
        {state === 'refreshing' && (
          <View style={styles.refreshOverlay}>
            <ActivityIndicator color="#fff" />
            <Text style={styles.refreshText}>Requesting snapshot…</Text>
          </View>
        )}
        {takenAt && (
          <View style={styles.stamp}>
            <Ionicons name="camera" size={12} color="#fff" />
            <Text style={styles.stampText}>
              Snapshot · {takenAt.toLocaleTimeString()}
            </Text>
          </View>
        )}
      </View>

      <View style={styles.privacyNote}>
        <Ionicons name="volume-high" size={16} color={COLORS.muted} />
        <Text style={styles.privacyText}>
          The cane announces aloud when the guardian views the camera, so the
          user always knows.
        </Text>
      </View>

      <View style={styles.controls}>
        <Pressable
          style={[styles.primaryButton, busy && styles.disabled]}
          onPress={requestSnapshot}
        >
          <Ionicons name="refresh" size={18} color="#fff" />
          <Text style={styles.primaryText}>Request new snapshot</Text>
        </Pressable>
        <View style={styles.liveChip}>
          <Ionicons name="radio-outline" size={14} color={COLORS.muted} />
          <Text style={styles.liveChipText}>Live stream — coming with backend</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#111' },
  viewport: {
    aspectRatio: 4 / 3,
    marginHorizontal: 12,
    marginTop: 12,
    borderRadius: 12,
    backgroundColor: '#1d1d1d',
    borderWidth: 1,
    borderColor: '#333',
    overflow: 'hidden',
    justifyContent: 'center',
  },
  center: { alignItems: 'center', padding: 24, gap: 8 },
  simLabel: {
    color: '#8a8a8a',
    fontWeight: '800',
    fontSize: 11,
    letterSpacing: 2,
  },
  viewportText: { color: '#9a9a9a', textAlign: 'center', lineHeight: 19 },
  refreshOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  refreshText: { color: '#fff', fontWeight: '600' },
  stamp: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(0,0,0,0.65)',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  stampText: { color: '#fff', fontSize: 11, fontVariant: ['tabular-nums'] },
  privacyNote: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginHorizontal: 12,
    marginTop: 12,
    padding: 10,
    borderRadius: 8,
    backgroundColor: '#1d1d1d',
  },
  privacyText: { color: COLORS.muted, flex: 1, fontSize: 12, lineHeight: 17 },
  controls: { marginTop: 'auto', padding: 12, gap: 10 },
  primaryButton: {
    flexDirection: 'row',
    gap: 8,
    backgroundColor: COLORS.danger,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryText: { color: '#fff', fontWeight: '700' },
  disabled: { opacity: 0.5 },
  liveChip: {
    flexDirection: 'row',
    gap: 6,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  liveChipText: { color: COLORS.muted, fontSize: 12 },
});
