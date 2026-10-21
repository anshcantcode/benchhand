# Benchhand for Android

Approve, reject and edit your teammates' actions from your phone, give them tasks, and run routines, while Benchhand keeps running on your computer.

The phone talks only to your own computer, over [Tailscale](https://tailscale.com). Nothing goes through a server of ours.

## What it does

- **Waiting**: every action waiting on you, drawn on one clock: grey while the teammate worked, green while it has waited for you. Open one to see exactly what will be sent and how the teammate got there. You can edit the values before approving.
- **Team**: who is working, who is waiting on you, and **Give a task** to any teammate.
- **Routines**: turn routines on or off, see when they run next, or **Run now**.
- **Settings**: notifications (with a lock-screen preview), confirm approvals with fingerprint or screen lock, unpair.

Rejecting never stops a run. Nothing is sent, the teammate is told you said no, and it carries on without it.

## Pair a phone

1. Install Tailscale on the computer and the phone, and sign in to the same account on both.
2. On the computer: **Benchhand → Preferences → Phone → Pair a phone**.
3. On the phone: open Benchhand, tap **Scan the code** and point it at the QR code. You can also copy the pairing code and paste it.

The pairing key is stored encrypted with the Android Keystore. The computer keeps only its hash. **Pair a new phone** on the computer revokes the old key.

## Build

You need JDK 17 or newer and the Android SDK (Android Studio installs both).

```bash
cd mobile/android
./gradlew assembleDebug
```

The APK is written to `app/build/outputs/apk/debug/app-debug.apk`. To install it on a phone connected with USB debugging:

```bash
./gradlew installDebug
```

`./gradlew assembleRelease` builds a minified release. That build is signed with the debug key, so replace `signingConfig` in `app/build.gradle.kts` with your own key before publishing it anywhere.

## Notes

- With the app closed, Android checks for new actions about every 15 minutes. That is the shortest interval Android allows for background work. With the app open, it refreshes every 10 seconds.
- The connection is plain HTTP inside Tailscale's encrypted tunnel. The computer refuses anything that does not come from a Tailscale address.
- Requires Android 8.0 (API 26) or newer.
- Typeface: Public Sans, under the SIL Open Font License (`app/PUBLIC_SANS_OFL.txt`).
