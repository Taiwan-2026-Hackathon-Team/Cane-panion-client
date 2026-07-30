import React, {
  createContext,
  Suspense,
  use,
  useCallback,
  useContext,
  useMemo,
  useSyncExternalStore,
  type ReactNode,
} from 'react';
import { QueryClient, QueryClientProvider, useQuery } from '@tanstack/react-query';

import { getUser, type AuthUser } from '../api/authApi';
import { isHTTPError } from '../api/fetch';
import { authKeys } from './queryKeys';
import {
  clearAuthToken,
  getAuthToken,
  hydrateAuthToken,
  setAuthToken,
  subscribeAuthToken,
} from './tokenStorage';

export type AuthStatus = 'loading' | 'authenticated' | 'guest';

type AuthState = {
  status: AuthStatus;
  user: AuthUser | null;
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

async function dropLocalSession(): Promise<void> {
  await clearAuthToken();
  queryClient.removeQueries({ queryKey: authKeys.user() });
}

function AuthSessionProvider({ children }: { children: React.ReactNode }) {
  // Suspense until SecureStore has been copied into the memory-first token store.
  use(hydrateAuthToken());
  const token = useSyncExternalStore(subscribeAuthToken, getAuthToken, getAuthToken);

  const clearSession = useCallback(dropLocalSession, []);

  const establishSession = useCallback(async (nextToken: string, user: AuthUser) => {
    // setAuthToken writes memory first so ky and the gate agree before persist finishes.
    await setAuthToken(nextToken);
    queryClient.setQueryData(authKeys.user(), user);
  }, []);

  const userQuery = useQuery({
    queryKey: authKeys.user(),
    queryFn: async () => {
      try {
        return await getUser();
      } catch (error) {
        if (isUnauthorized(error)) {
          await dropLocalSession();
        }
        throw error;
      }
    },
    enabled: !!token,
  });

  // Have user data, or the user request failed but we still have a token (e.g. offline).
  // Never gate on isFetching — background refetch must not unmount the Stack.
  let status: AuthStatus;
  if (!token) status = 'guest';
  else if (userQuery.data != null || userQuery.isError) status = 'authenticated';
  else status = 'loading';

  const value = useMemo<AuthContextValue>(
    () => ({
      state: {
        status,
        user: userQuery.data ?? null,
      },
      actions: {
        establishSession,
        clearSession,
      },
    }),
    [status, userQuery.data, establishSession, clearSession],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function AuthProvider({
  children,
  fallback,
}: {
  children: React.ReactNode;
  /** Shown while the JWT hydrates from SecureStore (Suspense). */
  fallback: ReactNode;
}) {
  return (
    <QueryClientProvider client={queryClient}>
      <Suspense fallback={fallback}>
        <AuthSessionProvider>{children}</AuthSessionProvider>
      </Suspense>
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
