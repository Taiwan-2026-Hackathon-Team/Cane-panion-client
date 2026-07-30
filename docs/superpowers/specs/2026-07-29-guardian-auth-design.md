# Guardian app login + session (design)

## Destination

Unauthenticated guardians see a login screen; after a successful login they land on Live Map with a JWT in secure storage. Protected API calls send `Authorization: Bearer <token>`. App start revalidates via `GET /api/v1/auth/me`.

## Decisions locked

- **UI kit:** React Native Reusables (shadcn-style for RN), used for the login screen first; existing StyleSheet screens stay as-is for this pass.
- **Post-login route:** `/(app)/(tabs)/live-map`
- **API base URL:** `EXPO_PUBLIC_API_URL` in `.env` (committed `.env.example`); not `localhost` on device/emulator host mapping — use the machine LAN IP + `:8080`.
- **Token storage:** `expo-secure-store` (not AsyncStorage).
- **Backend contract (current `canepanion-server` main):**
  - `POST /api/v1/auth/login` → `{ message, user, token }`
  - Errors → `{ success: false, message }`
  - `GET /api/v1/auth/me` (Bearer) → current user
  - `POST /api/v1/auth/logout` optional; always clear local token on logout
- **Missing-token handling:** Assume login `200` always includes `token` (backend ready). Treat absence as a failed login with a generic error only if it somehow happens.
- **Server state:** TanStack Query (`@tanstack/react-query`) for auth HTTP where it fits:
  - `useQuery` for `GET /auth/me` (session bootstrap / revalidation)
  - `useMutation` for login and logout
  - Thin `apiFetch` in `src/api/fetch.ts` on native `fetch` underneath (no axios/ky) — Query does not replace HTTP
  - Existing local alert hooks stay as-is this pass (not migrated to Query yet)

## Routing (option 2 — route groups + Expo Protected)

Folders organize auth vs app screens. The **gate** is Expo Router’s
[`Stack.Protected`](https://docs.expo.dev/router/advanced/protected/) in the
root layout (preferred over manual `<Redirect />` for SDK 53+ / our Expo 57).

```
app/
  _layout.tsx              # AuthProvider + QueryClient; Stack + Protected guards
  (auth)/
    _layout.tsx
    login.tsx              # email, password, submit, error
  (app)/
    _layout.tsx            # optional nested chrome; auth already gated at root
    (tabs)/                # existing tabs moved here
      _layout.tsx
      index.tsx            # Alerts
      live-map.tsx
      ...
    alert/[eventId].tsx
    set-home.tsx
```

Root navigator sketch:

```tsx
<Stack>
  <Stack.Protected guard={isLoggedIn}>
    <Stack.Screen name="(app)" options={{ headerShown: false }} />
  </Stack.Protected>
  <Stack.Protected guard={!isLoggedIn}>
    <Stack.Screen name="(auth)" options={{ headerShown: false }} />
  </Stack.Protected>
</Stack>
```

While session is still loading (token read / `useMeQuery` pending), keep splash
or defer rendering the Stack so the wrong group does not flash.

### Auth flow

1. Cold start → read token from SecureStore.
2. If token present → TanStack `useQuery(['auth','me'])` runs `GET /auth/me` (loading until settled).
3. No token or `/me` fails with 401 → guest → `Stack.Protected` exposes `(auth)` only; clear bad token on 401.
4. Login via `useMutation` → save token → invalidate/refetch `['auth','me']` → Expo flips guards → navigate/replace to `/(app)/(tabs)/live-map`.
5. Authenticated (`me` success) → `(app)` guard true (deep links into `alert/[…]` included).
6. Logout via `useMutation` (optional `POST /logout`) → clear token → remove `['auth','me']` query → `(auth)` again.

## Client modules

| Module | Responsibility |
|--------|----------------|
| `src/constants.ts` | Existing constants + `API_URL` from `EXPO_PUBLIC_API_URL` |
| `src/auth/tokenStorage.ts` | get/set/clear SecureStore JWT |
| `src/api/fetch.ts` | `apiFetch` on native `fetch` — JSON, Bearer, error `message` |
| `src/api/authApi.ts` | plain `login` / `me` / `logout` functions used by Query |
| `src/auth/queryKeys.ts` | e.g. `authKeys.me` |
| `src/auth/AuthProvider.tsx` | `QueryClientProvider` + session status for `Stack.Protected` |
| `src/auth/authMutations.ts` | `useLoginMutation`, `useLogoutMutation` |

`GuardianApi` / local alert store unchanged in this pass (still push/local; not on TanStack Query yet).

## UI

- Login: email + password + submit + inline error. Compose Reusables `Input` / `Button` (and Field patterns where the kit provides them).
- Keep Cane-panion danger/red accent via theme tokens where practical; do not restyle the whole app.
- Logout control on Settings.

## Out of scope

- Register / forgot-password screens (groups leave room for them later).
- Migrating Alerts/Map/etc. to Reusables.
- Wiring `GuardianApi` to Gin REST for alerts.
- Cookie-based web auth (mobile uses Bearer only).

## Test plan (manual)

1. Set `.env` `EXPO_PUBLIC_API_URL=http://<lan-ip>:8080`.
2. Cold start with no token → Login.
3. Wrong password → error `message` from API.
4. Valid login → token stored → Live Map.
5. Kill/relaunch app → `/me` succeeds → still on app (not bounced to login).
6. Logout → token cleared → Login.
7. (Optional) Invalid/expired token in SecureStore → `/me` 401 → Login.
