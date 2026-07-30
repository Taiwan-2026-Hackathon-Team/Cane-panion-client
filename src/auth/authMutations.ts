import { useMutation } from '@tanstack/react-query';

import { login, logout } from '../api/authApi';
import { useAuth } from './AuthProvider';

export function useLoginMutation() {
  const {
    actions: { establishSession },
  } = useAuth();

  return useMutation({
    mutationFn: login,
    onSuccess: async (data) => {
      await establishSession(data.token, data.user);
    },
  });
}

export function useLogoutMutation() {
  const {
    actions: { clearSession },
  } = useAuth();

  return useMutation({
    mutationFn: logout,
    // Clear local session whether the server revoke succeeds or fails.
    onSettled: async () => {
      await clearSession();
    },
  });
}
