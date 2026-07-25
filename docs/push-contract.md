# Guardian App ↔ Backend Push Contract

This is the contract the **Go backend** must fulfill so the guardian app's
fall-alert flow works. The app is push-payload driven in v1: everything it
shows comes from the FCM message described here. (A proposed REST API for
later is at the bottom.)

## Overview

```
cane ──POST fall event──▶ Go backend ──FCM v1 send──▶ guardian phones
                                        (topic: sos-alerts)
```

- The backend sends through **Firebase Cloud Messaging (HTTP v1)** using the
  [Firebase Admin SDK for Go](https://firebase.google.com/docs/admin/setup#go)
  with a service account from the shared Firebase project.
- Delivery is to the **topic `sos-alerts`**. Every guardian phone subscribes to
  it at startup, so no device-token registry is needed yet. (When user accounts
  arrive, switch to per-token sends; the app already exposes its token on the
  Settings screen for testing.)

## The FCM message

```go
msg := &messaging.Message{
    Topic: "sos-alerts",
    Data: map[string]string{
        "type":      "fall_sos",
        "eventId":   eventID,                    // backend-generated, unique per fall
        "deviceId":  "cane-panion-01",
        "lat":       "14.599512",                // stringified decimal degrees
        "lon":       "120.984222",
        "createdAt": "2026-07-25T09:30:00Z",     // ISO 8601 UTC, time of ingest
    },
    Android: &messaging.AndroidConfig{
        Priority: "high",
    },
    APNS: &messaging.APNSConfig{
        Headers: map[string]string{
            "apns-priority":  "10",
            "apns-push-type": "alert",
        },
        Payload: &messaging.APNSPayload{
            Aps: &messaging.Aps{
                Alert: &messaging.ApsAlert{
                    Title: "FALL DETECTED",
                    Body:  "cane-panion-01 reported a fall",
                },
                Sound:             "default",
                ContentAvailable:  true,
                CustomData: map[string]interface{}{
                    "interruption-level": "time-sensitive",
                },
            },
        },
    },
}
```

### Rules (the app depends on these)

1. **All `Data` values are strings** — FCM requires it; the app parses
   `lat`/`lon` with `Number(...)`.
2. `type` must be exactly `"fall_sos"`; the app ignores other types.
3. `eventId` must be **unique and stable per fall** — the app dedupes on it
   (firmware retries up to 3× per fall, so the backend must not mint a new
   `eventId` per retry; dedupe upstream or derive the id from device+time).
4. **Android: data-only, no `notification` block.** The app renders its own
   alarm-style notification (high-importance channel, full-screen intent).
   Adding a `notification` block would make the OS render a default-priority
   one instead and break tap-routing from a quit state.
5. **iOS: the APNs alert block is required.** iOS won't reliably wake a quit
   app for data-only pushes. `interruption-level: time-sensitive` makes it
   break through Focus modes. True Critical Alerts (bypass silent switch) need
   a special Apple entitlement — future work.
6. `createdAt` is the backend's ingest time in UTC. The cane has no RTC; its
   payload only carries `uptime_ms`, so ingest time *is* the event time.

## What the cane sends the backend (for reference)

Current firmware (`cane-panion-firmware/app/src/sos_report.c`) POSTs:

```json
{"event":"fall_sos","device":"cane-panion-01","lat":14.599512,"lon":120.984222,"uptime_ms":123456}
```

Retries: 3 attempts, 3 s apart. It treats any response as success — reply
`200` quickly. (Coordinates are hardcoded until GNSS lands; with the
SIM7670G's built-in GNSS they become real.)

## Testing without the backend

See README "Test push runbook": Firebase console test-message to a device
token, or a `curl` to the FCM v1 endpoint with this exact payload.

## Proposed REST API (v2 — when history/ack move server-side)

Not required for v1. The app has a `GuardianApi` interface
(`src/api/client.ts`) ready to point at:

- `GET  /alerts?limit=50` → `[{ id, deviceId, type, lat, lon, createdAt, status, acknowledgedAt }]`
- `GET  /alerts/{id}` → same shape
- `POST /alerts/{id}/ack` → `{ acknowledgedBy?: string }` → updated alert
- Auth TBD (token per guardian account). Statuses: `active` → `acknowledged`.
