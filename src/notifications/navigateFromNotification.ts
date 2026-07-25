/**
 * Single funnel for "a notification wants to open alert/[eventId]".
 *
 * Press events can fire before expo-router has mounted (cold start from a
 * quit-state notification), so instead of navigating directly this module
 * parks the target event id; useNotificationNavigation (handlers.ts) drains
 * it once the root navigator is ready.
 */

type PendingListener = () => void;

/**
 * A single cold-start press can surface through more than one API (the
 * onBackgroundEvent PRESS handler AND getInitialNotification), so an id
 * that was just navigated to is ignored for a short window.
 */
const DEDUPE_WINDOW_MS = 5000;

let pendingEventId: string | null = null;
let listener: PendingListener | null = null;
let lastConsumed: { id: string; at: number } | null = null;

export function extractEventId(
  data: Record<string, unknown> | undefined | null,
): string | undefined {
  const id = data?.eventId;
  return typeof id === 'string' && id.length > 0 ? id : undefined;
}

export function setPendingAlertNav(eventId: string): void {
  if (
    lastConsumed &&
    lastConsumed.id === eventId &&
    Date.now() - lastConsumed.at < DEDUPE_WINDOW_MS
  ) {
    return;
  }
  pendingEventId = eventId;
  listener?.();
}

export function consumePendingAlertNav(): string | null {
  const id = pendingEventId;
  pendingEventId = null;
  if (id) lastConsumed = { id, at: Date.now() };
  return id;
}

export function onPendingAlertNav(l: PendingListener): () => void {
  listener = l;
  return () => {
    if (listener === l) listener = null;
  };
}
