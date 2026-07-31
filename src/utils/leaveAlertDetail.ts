import { router } from 'expo-router';

/** Leave fall detail — back if possible, otherwise Alerts tab. */
export function leaveAlertDetail() {
  if (router.canGoBack()) router.back();
  else router.replace('/alerts');
}
