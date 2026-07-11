# 📱 WearWise — Build for iOS

> **Status:** EAS CLI is already installed on this machine (`eas-cli/20.5.1`).
> Your Supabase env vars are already baked into [`eas.json`](eas.json).
> iOS build profiles (`ios-simulator`, `ios-preview`, `ios-production`) are already configured.

This guide explains how to build your WearWise app for **iOS** — for testing on the iOS Simulator, testing on a physical iPhone, and submitting to the App Store.

---

## 🧭 Build Profiles Overview

Three iOS build profiles are defined in [`eas.json`](eas.json):

| Profile              | Command                                     | Output             | Apple Account? | App Store? | Best For                       |
| -------------------- | ------------------------------------------- | ------------------ | -------------- | ---------- | ------------------------------ |
| **`ios-simulator`**  | `eas build -p ios --profile ios-simulator`  | `.app` (simulator) | ❌ No          | ❌ No      | Quick testing on Mac simulator |
| **`ios-preview`**    | `eas build -p ios --profile ios-preview`    | `.ipa` (device)    | ✅ Yes (free)  | ❌ No      | Testing on a physical iPhone   |
| **`ios-production`** | `eas build -p ios --profile ios-production` | `.ipa` (device)    | ✅ Yes (paid)  | ✅ Yes     | App Store submission           |

> **Start with `ios-simulator`** if you just want to test on your Mac — no Apple Developer account needed.

---

## ✅ Prerequisites

1. **EAS CLI** — already installed. Verify with:

   ```bash
   eas --version
   ```

   If missing: `npm install -g eas-cli`

2. **Expo account** — log in (free at [expo.dev/signup](https://expo.dev/signup)):

   ```bash
   cd WearWise/02_SourceCode/frontend
   eas login
   ```

3. **Your iOS bundle identifier** is `com.wearwise.app` (set in [`app.json`](app.json)).

4. **For physical-device or App Store builds only** — an Apple Developer account:
   - **Free Apple ID** (for `ios-preview`): Works for testing on your own devices (up to 3). The app expires after 7 days and must be rebuilt.
   - **Paid Apple Developer Program** ($99/year, for `ios-production`): Required for App Store submission and long-term device installs.

---

## 🅰️ Option 1 — Build for the iOS Simulator (No Apple Account Needed)

This builds a `.app` bundle that runs in the iOS Simulator on your Mac. **No Apple Developer account required.**

### Step 1 — Run the build

```bash
cd WearWise/02_SourceCode/frontend
eas build -p ios --profile ios-simulator
```

### Step 2 — Download and install to the simulator

When the build finishes, EAS gives you a download link. The easiest way to install it:

```bash
eas build:run -p ios
```

This automatically downloads the build and launches it in your iOS Simulator.

> **Note:** You need Xcode installed (from the Mac App Store, free) for the simulator to run. The simulator only runs on macOS.

---

## 🅱️ Option 2 — Build for a Physical iPhone (Ad Hoc / Internal)

This builds a `.ipa` that can be installed on registered iPhones for testing.

### Step 1 — Set up your Apple credentials

The first time you build for a physical device, EAS will prompt you for your Apple ID:

```bash
cd WearWise/02_SourceCode/frontend
eas build -p ios --profile ios-preview
```

You'll see prompts like:

```
✔ Generate a new Apple App ID? › (Y/n)
✔ Generate a new provisioning profile? › (Y/n)
```

**Type `Y` for both.** EAS handles all the certificates and provisioning profiles automatically using your Apple ID.

### Step 2 — Register your test device

Before the build, register the iPhone's UDID so the provisioning profile includes it:

```bash
eas device:create
```

This opens a web page on the iPhone (scan the QR code) that registers the device with your Apple account.

### Step 3 — Install on the iPhone

When the build completes, install it directly:

```bash
eas build:run -p ios
```

Or, open the build link on your iPhone's Safari browser and tap **Install**.

> **Important:** After installing, go to **Settings → General → VPN & Device Management** on the iPhone and **trust your developer certificate** before the app will launch.

> **Free Apple ID limitation:** Apps signed with a free Apple ID expire after **7 days**. Rebuild and reinstall to continue testing. A paid Apple Developer Program membership ($99/year) removes this limit.

---

## 🅱️‍➡️ Option 2B — Developer Builds for a Client's iPhone (You Don't Have an iPhone)

If you (the developer) don't have a physical iPhone but need to deliver an installable iOS build to your client, you can build the `.ipa` on your Mac and the client installs it on their iPhone remotely. The key requirement is that the **client's iPhone UDID must be registered** before the build, because ad-hoc provisioning profiles only include registered device UDIDs.

### How it works

```
You (developer, on your Mac)          Client (on their iPhone)
─────────────────────────────         ─────────────────────────
1. eas device:create
   → generates a registration link
   → send link to client ──────────→  2. opens link in Safari
                                      → installs profile
                                      → UDID registered ✅
3. eas build -p ios
   --profile ios-preview
   (uses YOUR free Apple ID)
   → build completes
   → send build link to client ─────→  4. opens build link in Safari
                                      → taps Install
                                      → trusts your certificate
                                      → app launches ✅
```

### Step 1 — Register the client's iPhone UDID

Run this on your Mac:

```bash
cd WearWise/02_SourceCode/frontend
eas device:create
```

1. Confirm the Expo account (`alibhai007`).
2. EAS generates a **device registration webpage link** and shows it in the terminal (plus a QR code).
3. **Send that link to your client** (via email, WhatsApp, etc.).
4. Ask the client to **open the link in Safari on their iPhone** and follow the prompts to install a short-lived configuration profile. This registers their iPhone's UDID with your Expo/Apple account.
5. Back in your terminal, give the device a name (e.g., "Client iPhone") and confirm.

> The client does **not** need an Apple Developer account or any technical setup — they just open a link on their phone.

### Step 2 — Build the IPA with your free Apple ID

```bash
cd WearWise/02_SourceCode/frontend
eas build -p ios --profile ios-preview
```

1. EAS prompts you to log in with **your Apple ID** (a free one works — no paid developer account needed).
2. When asked about credentials, choose **"Let EAS manage credentials"** (recommended).
3. Choose your **Personal Team** (the free one).
4. When asked which devices to include in the provisioning profile, make sure the client's device (registered in Step 1) is selected.
5. The build runs on EAS cloud servers (~10–15 minutes). When done, it prints an **install link + QR code**.

### Step 3 — Share the build with your client

Send the client the **build install link** from Step 2.

The client then:

1. Opens the link in **Safari on their iPhone**.
2. Taps **Install**.
3. The app icon appears on their home screen, but shows **"Untrusted Developer"** when opened.
4. To fix this: **Settings → General → VPN & Device Management → tap your (developer's) Apple ID → Trust**.
5. The app now launches normally. ✅

### Important notes for this workflow

- **7-day expiry:** Builds signed with a free Apple ID expire after 7 days. You'll need to rebuild and the client reinstalls. For permanent distribution, use a paid Apple Developer account ($99/year) with the `ios-production` profile + TestFlight.
- **Device limit:** Free Apple IDs allow up to **3 registered devices** per year. The client's iPhone counts as one.
- **The client never sees your Apple ID password** — you enter it only in your own terminal during the build. The client only sees your developer name in the "Trust" step.
- **Rebuilding:** Each time you update the code, just re-run Step 2 and send the client the new build link. The device UDID stays registered — no need to repeat Step 1.

---

## 🅲 Option 3 — Build for the App Store (Production)

This builds a production `.ipa` ready for App Store submission.

### Step 1 — Ensure you have a paid Apple Developer account

You need an active **Apple Developer Program** membership ($99/year) at [developer.apple.com](https://developer.apple.com/programs/).

### Step 2 — Build for production

```bash
cd WearWise/02_SourceCode/frontend
eas build -p ios --profile ios-production
```

EAS will use your Apple credentials to create a distribution certificate and App Store provisioning profile automatically.

### Step 3 — Submit to the App Store

After the build completes, submit it to App Store Connect:

```bash
eas submit -p ios --profile ios-production
```

You'll need:

- An **App Store Connect app record** (EAS can create this automatically).
- App metadata (name, description, screenshots, etc.) — set in App Store Connect.

Once submitted, log in to [App Store Connect](https://appstoreconnect.apple.com) to:

1. Add screenshots and app description.
2. Select the build you just submitted.
3. Submit for Apple's review (typically 1–3 days).

---

## 🔄 Updating the Build

Every time you change your code and want a new build:

```bash
# Simulator
eas build -p ios --profile ios-simulator

# Physical device
eas build -p ios --profile ios-preview

# App Store
eas build -p ios --profile ios-production
```

> **Tip:** Increment the `buildNumber` in [`app.json`](app.json) (`ios.buildNumber`) each time you submit a new version to App Store Connect. Apple rejects builds with a duplicate build number.

---

## 📋 Quick Reference — All Commands

```bash
# Log in to Expo (one-time)
eas login

# Build for iOS Simulator (no Apple account)
eas build -p ios --profile ios-simulator

# Run the last build in the simulator
eas build:run -p ios

# Register a physical test device
eas device:create

# Build for physical iPhone (free Apple ID)
eas build -p ios --profile ios-preview

# Build for App Store (paid Apple Developer)
eas build -p ios --profile ios-production

# Submit to App Store
eas submit -p ios --profile ios-production
```

---

## 🛠️ Troubleshooting

### "No profiles for 'com.wearwise.app' were found"

EAS will offer to generate them automatically. Type `Y` when prompted. This creates the Apple App ID, certificate, and provisioning profile for you.

### "You have reached the maximum number of registered devices"

Free Apple IDs allow up to 3 test devices per year. Use a paid Apple Developer account for more.

### App won't launch on iPhone after install

Go to **Settings → General → VPN & Device Management** → tap your developer profile → **Trust**. This is required for all non-App-Store installs.

### Build fails with code signing errors

Run `eas credentials` to inspect or reset your Apple credentials:

```bash
eas credentials --platform ios
```

### Simulator build won't run

Ensure Xcode is installed (Mac App Store) and the simulator is available:

```bash
xcrun simctl list devices
```

### Want to rebuild credentials from scratch

```bash
eas credentials --platform ios --clear
```

Then rebuild — EAS will regenerate everything.
