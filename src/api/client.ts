import type { FallAlert } from '../types/models';

/**
 * Boundary to the Go backend (built by the software team — not in this repo).
 * v1 ships with LocalStoreApi only: alerts arrive via FCM push and live in
 * AsyncStorage. When the backend exposes its REST API, add a GoBackendApi
 * implementing this same interface (proposed shape in docs/push-contract.md)
 * and swap it in `getGuardianApi` — no screen changes needed.
 */
export interface GuardianApi {
  getAlerts(): Promise<FallAlert[]>;
  getAlert(id: string): Promise<FallAlert | undefined>;
  markAlertSeen(id: string): Promise<FallAlert | undefined>;
}

import { localStoreApi } from './localStoreApi';

export function getGuardianApi(): GuardianApi {
  // TODO: return a GoBackendApi once the backend's REST API is live.
  return localStoreApi;
}
