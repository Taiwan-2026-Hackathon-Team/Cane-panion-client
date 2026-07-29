# Running the guardian app on Linux (Android)

`expo prebuild` fails on a fresh clone because `app.json` points at two Firebase
config files that are gitignored (they're per-developer downloads from the
Firebase console). Neither file is in the repo.

We don't have a real Firebase project wired up yet — push is the only thing that
needs it, and everything is hardcoded/local right now. So use the checked-in
placeholders. The app builds and runs; only push delivery is dead.

## Setup

```bash
npm install --legacy-peer-deps
cp google-services.example.json google-services.json
npx expo prebuild -p android
npx expo run:android
```

On Linux, `-p android` matters — bare `expo prebuild` also runs the iOS mods,
which need `GoogleService-Info.plist`. (If you want it anyway:
`cp GoogleService-Info.example.plist GoogleService-Info.plist`.)

You need the Android SDK + an emulator or a USB device for `run:android`.
Android Studio, or `sdkmanager` if you'd rather stay on the CLI.

## Notifee Maven repo (required for Android builds)

`@notifee/react-native` depends on `app.notifee:core`, which is **not** on
Maven Central — it ships as a local Maven repo under
`node_modules/@notifee/react-native/android/libs`. Without pointing Gradle at
that path, `expo run:android` fails with:

```text
Could not find any matches for app.notifee:core:+
```

This is already wired in `app.json` via `expo-build-properties` →
`android.extraMavenRepos` (the community Expo workaround; Notifee's
[install docs](https://notifee.app/react-native/docs/installation) mention an
Expo plugin, but v9.1.8 does not ship one). Path is relative to `android/`:

```json
"extraMavenRepos": [
  "../../node_modules/@notifee/react-native/android/libs"
]
```

Don't delete that entry. After a clean `expo prebuild -p android` it is
re-applied into `android/build.gradle` automatically.

Sources:

- Expo `extraMavenRepos` API:
  [BuildProperties (SDK 57)](https://docs.expo.dev/versions/v57.0.0/sdk/build-properties/#pluginconfigtypeandroid)
- Notifee + Expo resolution of `app.notifee:core:+`:
  [invertase/notifee#941](https://github.com/invertase/notifee/issues/941),
  [invertase/notifee#1262](https://github.com/invertase/notifee/issues/1262)

## What works and what doesn't

Works: the whole UI, in-app navigation, the map, the home picker, the cane
camera tab, alert list and detail screens.

The fall-alert flow works too, via **Alerts tab → "Simulate fall (dev)"**
(dev builds only). It injects an alert through the identical code path a real
push takes — `alertFromPushData` → `upsertAlert` → `displaySosNotification` — so
the notification, tap-to-navigate, map pin, acknowledge, and persisted history
all behave for real. Notifee renders notifications locally and doesn't need
Firebase.

Doesn't work: **pushes arriving over the network.** v1 has no REST fallback —
real alerts come only via FCM (`src/api/client.ts`), so with a placeholder
config nothing lands from outside. Settings → Developer shows the FCM token as
`unavailable`; that's expected, not a bug. Every Firebase call is
`.catch()`-wrapped so nothing crashes.

Also unset: `app.json` has `REPLACE_WITH_ANDROID_MAPS_API_KEY` for Google Maps.
The map renders blank/grey on Android without a real key. iOS doesn't need one,
which is why it hasn't come up before.

## When we get a real Firebase project

Register both apps under `com.dandiaz.canepanion`, download the real
`google-services.json` and `GoogleService-Info.plist` over the copies, and
re-run prebuild. The Go server has to publish to the **same** project — it sends
to topic `sos-alerts` (`SOS_TOPIC` in `src/constants.ts`), so the project ID and
sender ID must match on both sides. The placeholders say
`cane-panion-placeholder`; if you ever see that in a build, it's not connected.

Don't commit the real files — they stay gitignored. Only the `.example.` ones
are tracked.
