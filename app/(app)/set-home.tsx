import React, { useEffect, useRef, useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { router } from 'expo-router';
import MapView, { PROVIDER_GOOGLE, type Region } from 'react-native-maps';

import type { LatLng } from '../../src/types/models';
import { COLORS } from '../../src/constants';
import {
  getHomeLocation,
  HOME_PICKER_FALLBACK,
  setHomeLocation,
} from '../../src/store/settings';

const PICKER_DELTA = 0.004;

function toRegion(c: LatLng): Region {
  return {
    latitude: c.latitude,
    longitude: c.longitude,
    latitudeDelta: PICKER_DELTA,
    longitudeDelta: PICKER_DELTA,
  };
}

/**
 * Home-location picker: pan the map so the fixed center pin sits on the
 * house, then save. Local-only for now — syncs to the backend later.
 */
export default function SetHomeScreen() {
  const mapRef = useRef<MapView>(null);
  const [center, setCenter] = useState<LatLng>();
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getHomeLocation().then((home) => {
      const start = home ?? HOME_PICKER_FALLBACK;
      setCenter(start);
      mapRef.current?.animateToRegion(toRegion(start), 300);
    });
  }, []);

  async function useCurrentLocation() {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') return;
    const pos = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });
    mapRef.current?.animateToRegion(
      toRegion({ latitude: pos.coords.latitude, longitude: pos.coords.longitude }),
      500,
    );
  }

  async function save() {
    if (!center || saving) return;
    setSaving(true);
    await setHomeLocation(center);
    router.back();
  }

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={StyleSheet.absoluteFill}
        provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
        initialRegion={toRegion(HOME_PICKER_FALLBACK)}
        onRegionChangeComplete={(region) =>
          setCenter({ latitude: region.latitude, longitude: region.longitude })
        }
      />

      {/* Fixed center pin; the map moves underneath it. */}
      <View pointerEvents="none" style={styles.pinWrap}>
        <Ionicons name="home" size={34} color={COLORS.danger} style={styles.pin} />
        <View style={styles.pinDot} />
      </View>

      <View style={styles.hint}>
        <Text style={styles.hintText}>
          Move the map until the pin sits on the house
        </Text>
        {center && (
          <Text style={styles.coords}>
            {center.latitude.toFixed(6)}, {center.longitude.toFixed(6)}
          </Text>
        )}
      </View>

      <View style={styles.footer}>
        <Pressable style={[styles.button, styles.secondary]} onPress={useCurrentLocation}>
          <Ionicons name="locate" size={18} color={COLORS.text} />
          <Text style={styles.secondaryText}>Use current location</Text>
        </Pressable>
        <Pressable
          style={[styles.button, styles.primary, saving && styles.disabled]}
          onPress={save}
        >
          <Ionicons name="checkmark" size={18} color="#fff" />
          <Text style={styles.primaryText}>{saving ? 'Saving…' : 'Save home'}</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  pinWrap: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Lift the glyph so its visual tip points at the map center.
  pin: { marginBottom: 30, textShadowColor: 'rgba(0,0,0,0.3)', textShadowRadius: 4 },
  pinDot: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.danger,
  },
  hint: {
    position: 'absolute',
    top: 12,
    left: 12,
    right: 12,
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: 10,
    padding: 12,
    alignItems: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: COLORS.cardBorder,
  },
  hintText: { fontWeight: '600', color: COLORS.text },
  coords: { marginTop: 4, fontSize: 12, color: COLORS.muted },
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
  primary: { backgroundColor: COLORS.danger },
  primaryText: { fontWeight: '700', color: '#fff' },
  secondary: { backgroundColor: '#fff', borderWidth: 1, borderColor: COLORS.cardBorder },
  secondaryText: { fontWeight: '600', color: COLORS.text },
  disabled: { opacity: 0.6 },
});
