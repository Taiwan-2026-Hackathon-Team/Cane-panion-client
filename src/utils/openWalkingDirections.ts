import { Linking, Platform } from 'react-native';

import type { LatLng } from '@/types/models';

function coordsParam(point: LatLng): string {
  return `${point.latitude},${point.longitude}`;
}

/**
 * Hand off walking directions to the platform maps app (Apple Maps on iOS,
 * Google Maps / browser on Android). Origin optional — if omitted, the maps
 * app uses the device's current location.
 */
export async function openWalkingDirections(
  destination: LatLng,
  origin?: LatLng,
): Promise<void> {
  const dest = coordsParam(destination);
  const url =
    Platform.OS === 'ios'
      ? origin
        ? `http://maps.apple.com/?saddr=${coordsParam(origin)}&daddr=${dest}&dirflg=w`
        : `http://maps.apple.com/?daddr=${dest}&dirflg=w`
      : origin
        ? `https://www.google.com/maps/dir/?api=1&origin=${coordsParam(origin)}&destination=${dest}&travelmode=walking`
        : `https://www.google.com/maps/dir/?api=1&destination=${dest}&travelmode=walking`;

  await Linking.openURL(url);
}
