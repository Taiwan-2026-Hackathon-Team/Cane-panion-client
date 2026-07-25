# Cane-panion Guardian App

React Native (Expo) companion app for the Cane-panion smart cane. Guardians
receive a push notification when the cane detects a fall and see the location
on a map, with alert history and acknowledge.

- System design: `../cane-panion-firmware/architecture_7.docx`
- Backend contract (for the Go team): [`docs/push-contract.md`](docs/push-contract.md)
- The backend itself is **not** in this repo — it's built by the software team.

## Architecture (v1)

- **Push-payload driven**: the FCM data message carries the whole fall event.
  Alerts are persisted locally (AsyncStorage) so history works before the
  backend has a REST API.
- `src/api/client.ts` — `GuardianApi` interface; local-store implementation
  now, Go-backend implementation later without touching screens.
- `index.ts` — custom entry that registers the FCM **background handler**
  before `expo-router/entry`. Don't move that code into a component: quit-state
  pushes would be dropped.
- `src/notifications/` — channel setup, message handling, tap → `alert/[eventId]`
  navigation (including cold start).

## One-time setup

This app uses native Firebase modules — **it cannot run in Expo Go**; you need
a dev build (`expo prebuild` + `run:android` / `run:ios`).

### 1. Firebase project

1. [console.firebase.google.com](https://console.firebase.google.com) → create
   project (e.g. `cane-panion`).
2. Add an **Android app** with package `com.dandiaz.canepanion` → download
   `google-services.json` into the repo root (gitignored).
3. Add an **iOS app** with bundle id `com.dandiaz.canepanion` → download
   `GoogleService-Info.plist` into the repo root (gitignored).
4. iOS push only: in Apple Developer, create an **APNs Auth Key** (.p8) and
   upload it under Firebase → Project settings → Cloud Messaging (needs a paid
   Apple developer account).
5. Share the Firebase project with the backend team — their Go server sends
   FCM through it (Project settings → Service accounts → generate key).

### 2. Google Maps key (Android only; iOS uses Apple Maps)

1. In Google Cloud console (same project): enable **Maps SDK for Android**.
2. Create an API key; restrict it to Android apps with package
   `com.dandiaz.canepanion` and your keystore SHA-1
   (`cd android && ./gradlew signingReport` after prebuild — add debug **and**
   release SHA-1s).
3. Replace `REPLACE_WITH_ANDROID_MAPS_API_KEY` in `app.json`.

### 3. Build and run

```sh
npm install
npx expo prebuild            # generates android/ and ios/ (gitignored)
npx expo run:android         # physical device, or emulator WITH Google Play image
npx expo run:ios --device    # physical iPhone (push does not work in simulator)
```

## Test push runbook (no backend needed)

**UI only:** dev builds show a "Simulate fall (dev)" button on the Alerts tab —
injects a fake alert through the same code path a push takes.

**Real push, single device:** Firebase console → Cloud Messaging → *New
campaign* → *Send test message* → paste the device token shown on the app's
**Cane Settings → Developer** section. Add the custom data keys from
`docs/push-contract.md` (`type=fall_sos`, `eventId=test-1`,
`deviceId=cane-panion-01`, `lat=14.599512`, `lon=120.984222`,
`createdAt=2026-07-25T09:30:00Z`).

**Real push, topic + exact payload** (what the backend will actually send):

```sh
TOKEN=$(gcloud auth print-access-token)   # gcloud auth login with an account on the Firebase project
PROJECT_ID=cane-panion                     # your Firebase project id
curl -s -X POST "https://fcm.googleapis.com/v1/projects/$PROJECT_ID/messages:send" \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{
    "message": {
      "topic": "sos-alerts",
      "data": {
        "type": "fall_sos",
        "eventId": "test-'"$(date +%s)"'",
        "deviceId": "cane-panion-01",
        "lat": "14.599512",
        "lon": "120.984222",
        "createdAt": "'"$(date -u +%Y-%m-%dT%H:%M:%SZ)"'"
      },
      "android": { "priority": "HIGH" },
      "apns": {
        "headers": { "apns-priority": "10", "apns-push-type": "alert" },
        "payload": {
          "aps": {
            "alert": { "title": "FALL DETECTED", "body": "cane-panion-01 reported a fall" },
            "sound": "default",
            "interruption-level": "time-sensitive",
            "content-available": 1
          }
        }
      }
    }
  }'
```

**Full check:** kill the app, lock the phone, send the push → alarm-style
notification appears → tap → map opens with the pin → Acknowledge → relaunch
the app → the alert is still in history, acknowledged.

## Gotchas

- **Never Expo Go** — native Firebase + static frameworks (iOS) require a dev
  build.
- Force-stopped Android apps (app info → Force stop) receive **no** FCM at all;
  that's OS behavior. OEM battery savers (Xiaomi/Samsung) can delay pushes —
  exempt the app from battery optimization on test phones.
- Android emulators need a **Google Play** system image for FCM.
- FCM data values are strings; the app parses lat/lon.
- Firebase console "test message" targets a *token*, not the topic — that's why
  the Settings screen shows the token.
