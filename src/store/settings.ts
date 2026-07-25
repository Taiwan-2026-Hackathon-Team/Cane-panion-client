import AsyncStorage from '@react-native-async-storage/async-storage';

import type { LatLng } from '../types/models';

/**
 * Local-only guardian settings. UI-first for now: nothing here talks to the
 * backend — when it exists, saved places sync there (architecture: "Saved
 * places - home, work, and favorite destinations for quick route pushes").
 */

const HOME_KEY = '@canepanion/home-location';

/** Default map position for the picker before a home is set (Manila). */
export const HOME_PICKER_FALLBACK: LatLng = {
  latitude: 14.599512,
  longitude: 120.984222,
};

export async function getHomeLocation(): Promise<LatLng | undefined> {
  const raw = await AsyncStorage.getItem(HOME_KEY);
  if (!raw) return undefined;
  try {
    const parsed = JSON.parse(raw) as LatLng;
    if (
      Number.isFinite(parsed?.latitude) &&
      Number.isFinite(parsed?.longitude)
    ) {
      return parsed;
    }
  } catch {
    // fall through
  }
  return undefined;
}

export async function setHomeLocation(location: LatLng): Promise<void> {
  await AsyncStorage.setItem(HOME_KEY, JSON.stringify(location));
}
