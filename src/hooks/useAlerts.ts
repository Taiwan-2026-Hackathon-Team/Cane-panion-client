import { useCallback, useEffect, useState } from 'react';

import { getGuardianApi } from '../api/client';
import { subscribeToAlerts } from '../store/alerts';
import type { FallAlert } from '../types/models';

/** Live list of alerts — refreshes whenever the store changes (e.g. a push arrives). */
export function useAlerts(): { alerts: FallAlert[]; reload: () => void } {
  const [alerts, setAlerts] = useState<FallAlert[]>([]);

  const reload = useCallback(() => {
    getGuardianApi().getAlerts().then(setAlerts).catch(() => {});
  }, []);

  useEffect(() => {
    reload();
    return subscribeToAlerts(reload);
  }, [reload]);

  return { alerts, reload };
}

export function useAlert(id: string | undefined): FallAlert | undefined {
  const [alert, setAlert] = useState<FallAlert>();

  useEffect(() => {
    if (!id) return;
    const load = () => {
      getGuardianApi().getAlert(id).then(setAlert).catch(() => {});
    };
    load();
    return subscribeToAlerts(load);
  }, [id]);

  return alert;
}
