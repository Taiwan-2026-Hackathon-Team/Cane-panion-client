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

/** Live single alert. `ready` is false until the first load finishes. */
export function useAlert(id: string | undefined): {
  alert: FallAlert | undefined;
  ready: boolean;
} {
  const [alert, setAlert] = useState<FallAlert>();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!id) {
      setAlert(undefined);
      setReady(true);
      return;
    }
    setReady(false);
    const load = () => {
      getGuardianApi()
        .getAlert(id)
        .then((next) => {
          setAlert(next);
          setReady(true);
        })
        .catch(() => {
          setAlert(undefined);
          setReady(true);
        });
    };
    load();
    return subscribeToAlerts(load);
  }, [id]);

  return { alert, ready };
}
