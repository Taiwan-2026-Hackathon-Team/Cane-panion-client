import type { LocationGeocodedAddress } from 'expo-location';

/**
 * Turn an OS reverse-geocode result into a short display string.
 * Never falls back to raw coordinates.
 */
export function formatPlace(address: LocationGeocodedAddress): string | undefined {
  if (address.formattedAddress) return address.formattedAddress;

  const street = [address.streetNumber, address.street].filter(Boolean).join(' ');
  const locality =
    address.city ??
    address.district ??
    address.subregion ??
    address.name ??
    address.region;
  const parts = [street || undefined, locality ?? undefined].filter(
    (part): part is string => Boolean(part),
  );
  return parts.length > 0 ? parts.join(', ') : undefined;
}
