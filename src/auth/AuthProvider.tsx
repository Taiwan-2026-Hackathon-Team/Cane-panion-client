import React, { createContext, useCallback, useContext, useMemo } from 'react';
import { QueryClient, QueryClientProvider, useQuery } from '@tanstack/react-query';

import { getUser, type AuthUser } from '../api/authApi';
import { isHTTPError } from '../api/fetch';
import { authKeys } from './queryKeys';
import { clearAuthToken, getAuthToken, setAuthToken } from './tokenStorage';

export type AuthStatus = 'loading' | 'authenticated' | 'guest';

type AuthState = {
  status: AuthStatus;
  user: AuthUser | null;
  token: string | null;
};

type AuthActions = {
  establishSession: (token: string, user: AuthUser) => Promise<void>;
  clearSession: () => Promise<void>;
};

type AuthContextValue = {
  state: AuthState;
  actions: AuthActions;
};

const AuthContext = createContext<AuthContextValue | null>(null);

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      staleTime: 60_000,
    },
  },
});

function isUnauthorized(error: unknown): boolean {
  return isHTTPError(error) && error.response.status === 401;
}

async function dropLocalSession() {
  // Update Query first so the gate flips even if SecureStore I/O fails.
  queryClient.setQueryData(authKeys.token(), null);
  queryClient.removeQueries({ queryKey: authKeys.user() });
  await clearAuthToken();
}

async function fetchUser(): Promise<AuthUser> {
  try {
    return await getUser();
  } catch (error) {
    if (isUnauthorized(error)) {
      await dropLocalSession();
    }
    throw error;
  }
}

function AuthSessionProvider({ children }: { children: React.ReactNode }) {
  const tokenQuery = useQuery({
    queryKey: authKeys.token(),
    queryFn: getAuthToken,
    staleTime: Infinity,
  });

  const token = tokenQuery.data ?? null;

  const userQuery = useQuery({
    queryKey: authKeys.user(),
    queryFn: fetchUser,
    enabled: tokenQuery.isFetched && !!token,
  });

  const clearSession = useCallback(dropLocalSession, []);

  const establishSession = useCallback(async (nextToken: string, user: AuthUser) => {
    queryClient.setQueryData(authKeys.user(), user);
    await setAuthToken(nextToken);
    queryClient.setQueryData(authKeys.token(), nextToken);
  }, []);

  // Have user data, or the user request failed but we still have a token (e.g. offline).
  // Never gate on isFetching — background refetch must not unmount the Stack.
  let status: AuthStatus;
  if (!tokenQuery.isFetched) status = 'loading';
  else if (!token) status = 'guest';
  else if (userQuery.data != null || userQuery.isError) status = 'authenticated';
  else status = 'loading';

  const value = useMemo<AuthContextValue>(
    () => ({
      state: {
        status,
        user: userQuery.data ?? null,
        token,
      },
      actions: {
        establishSession,
        clearSession,
      },
    }),
    [status, userQuery.data, token, establishSession, clearSession],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthSessionProvider>{children}</AuthSessionProvider>
    </QueryClientProvider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return ctx;
}
