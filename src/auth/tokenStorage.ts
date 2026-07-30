import * as SecureStore from 'expo-secure-store';

import { AUTH_TOKEN_KEY } from '../constants';

/**
 * Memory-first JWT store. SecureStore is persistence only.
 * React (useSyncExternalStore) and ky both read sync via getAuthToken() so the
 * auth gate and Bearer header never disagree. Do not put the token in TanStack
 * Query — useQuery is only for GET /me.
 */
let memoryToken: string | null | undefined;
let hydratePromise: Promise<string | null> | null = null;
const listeners = new Set<() => void>();

function notify(): void {
  for (const listener of listeners) {
    listener();
  }
}

function writeMemory(token: string | null): void {
  memoryToken = token;
  notify();
}

/** Sync read for the auth gate and HTTP Bearer header. Null until hydrated. */
export function getAuthToken(): string | null {
  return memoryToken ?? null;
}

export function subscribeAuthToken(onStoreChange: () => void): () => void {
  listeners.add(onStoreChange);
  return () => {
    listeners.delete(onStoreChange);
  };
}

/**
 * Cold-start: load SecureStore into memory once. Safe to call from use().
 * Always returns the same promise instance — a fresh Promise.resolve() each
 * render makes React treat it as uncached and LogBox-errors.
 */
export function hydrateAuthToken(): Promise<string | null> {
  if (!hydratePromise) {
    hydratePromise = SecureStore.getItemAsync(AUTH_TOKEN_KEY)
      .catch(() => null)
      .then((stored) => {
        // Login may have won the race; don't clobber memory.
        if (memoryToken === undefined) {
          writeMemory(stored);
        }
        return getAuthToken();
      });
  }
  return hydratePromise;
}

export async function setAuthToken(token: string): Promise<void> {
  writeMemory(token);
  await SecureStore.setItemAsync(AUTH_TOKEN_KEY, token);
}

export async function clearAuthToken(): Promise<void> {
  writeMemory(null);
  try {
    await SecureStore.deleteItemAsync(AUTH_TOKEN_KEY);
  } catch {
    // Memory already cleared; gate/HTTP see guest even if delete fails.
  }
}
