import React, { useEffect, useRef } from 'react';
import { Platform, StyleSheet } from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';

import { COLORS } from '../constants';
import type { FallAlert, LatLng } from '../types/models';

/**
 * Full-bleed map centered on the fall location. Google on Android, Apple Maps
 * on iOS. When the guardian's position is provided (navigate mode), shows it
 * with a straight route line to the fall pin and keeps both in frame.
 */
export function SosMap({
  alert,
  userLocation,
  routeCoords,
  showStraightLineFallback = false,
}: {
  alert: FallAlert;
  userLocation?: LatLng;
  /** Road-following path from the guardian to the fall pin. */
  routeCoords?: LatLng[];
  /** Draw a dashed straight line — only set when road routing failed. */
  showStraightLineFallback?: boolean;
}) {
  const mapRef = useRef<MapView>(null);
  const fallCoord: LatLng = { latitude: alert.lat, longitude: alert.lon };

  useEffect(() => {
    if (userLocation) {
      const frame =
        routeCoords && routeCoords.length >= 2
          ? routeCoords
          : [fallCoord, userLocation];
      mapRef.current?.fitToCoordinates(frame, {
        edgePadding: { top: 140, bottom: 140, left: 60, right: 60 },
        animated: true,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userLocation?.latitude, userLocation?.longitude, routeCoords]);

  return (
    <MapView
      ref={mapRef}
      style={StyleSheet.absoluteFill}
      provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
      showsUserLocation={Boolean(userLocation)}
      initialRegion={{
        latitude: alert.lat,
        longitude: alert.lon,
        latitudeDelta: 0.005,
        longitudeDelta: 0.005,
      }}
    >
      <Marker coordinate={fallCoord} title="Fall detected" description={alert.deviceId} pinColor="red" />
      {userLocation && routeCoords && routeCoords.length >= 2 && (
        <Polyline coordinates={routeCoords} strokeColor={COLORS.danger} strokeWidth={4} />
      )}
      {userLocation && !routeCoords && showStraightLineFallback && (
        <Polyline
          coordinates={[userLocation, fallCoord]}
          geodesic
          strokeColor={COLORS.danger}
          strokeWidth={4}
          lineDashPattern={[8, 6]}
        />
      )}
    </MapView>
  );
}
