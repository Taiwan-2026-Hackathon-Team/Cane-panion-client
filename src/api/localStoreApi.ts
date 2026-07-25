import { acknowledgeAlert, getAlert, listAlerts } from '../store/alerts';
import type { GuardianApi } from './client';

/** v1 implementation: everything is served from the local push-fed store. */
export const localStoreApi: GuardianApi = {
  getAlerts: () => listAlerts(),
  getAlert: (id) => getAlert(id),
  // TODO: also POST /alerts/{id}/ack to the Go backend once it exists.
  acknowledgeAlert: (id) => acknowledgeAlert(id),
};
