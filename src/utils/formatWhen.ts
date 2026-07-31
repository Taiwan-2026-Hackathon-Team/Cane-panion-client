const dateTimeFormatter = new Intl.DateTimeFormat();

/** Locale date/time string for an ISO timestamp; returns the raw string if invalid. */
export function formatWhen(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return dateTimeFormatter.format(date);
}
