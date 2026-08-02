import React from 'react';
import { Platform, StyleSheet } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';

import type { FallAlert } from '../types/models';

/**
 * Full-bleed map centered on the fall location. Google on Android, Apple Maps
 * on iOS. Walking directions are handed off to the platform maps app via
 * Navigate — this preview only shows where the fall was reported.
 *
 * Android needs a real `android.config.googleMaps.apiKey` in app.json (rebuild
 * after changing it) or the preview map may stay blank.
 */
export function SosMap({ alert }: { alert: FallAlert }) {
  return (
    <MapView
      style={StyleSheet.absoluteFill}
      provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
      initialRegion={{
        latitude: alert.lat,
        longitude: alert.lon,
        latitudeDelta: 0.005,
        longitudeDelta: 0.005,
      }}
    >
      <Marker
        coordinate={{ latitude: alert.lat, longitude: alert.lon }}
        title="Fall detected"
        description={alert.deviceId}
        pinColor="red"
      />
    </MapView>
  );
}
