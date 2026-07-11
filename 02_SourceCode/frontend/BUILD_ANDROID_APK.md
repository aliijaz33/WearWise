# 📱 WearWise — Build & Share an Android APK

> **Status:** EAS CLI is already installed on this machine (`eas-cli/20.5.1`).
> Your Supabase env vars are already baked into [`eas.json`](eas.json).
> Skip straight to **Step 2** below (log in to Expo).

This guide explains how to turn your Expo app into a **shareable `.apk` file** that anyone can install on their Android phone (no computer, no Expo Go, no developer mode needed for the person receiving it).

There are **two methods**. Read the comparison, then follow the one that fits you.

---

## 🧭 Method Comparison

|                             | **Method A: EAS Build (Cloud)** ✅ Recommended | **Method B: Local Build** |
| --------------------------- | ---------------------------------------------- | ------------------------- |
| Builds where?               | Expo's cloud servers                           | Your own Mac              |
| Needs Android Studio / JDK? | ❌ No                                          | ✅ Yes (~5 GB download)   |
| Needs an Expo account?      | ✅ Yes (free)                                  | ❌ No                     |
| Speed                       | ~10–20 min (free tier queue)                   | ~5–15 min (once set up)   |
| Reliability                 | Very high (managed)                            | Can hit Gradle/SDK errors |
| Best for                    | Most people — easiest path                     | Offline / no account      |

> **Start with Method A.** Only use Method B if you hit issues with the cloud or want to avoid an account.

---

## ✅ Prerequisites (both methods)

1. **Your Supabase env vars are already configured** in [`eas.json`](eas.json) under each build profile's `env` block. These get baked into the APK at build time, so the installed app can talk to your Supabase backend with no extra setup.
2. **Your Android package** is `com.wearwise.app` (set in [`app.json`](app.json)).
3. **An Expo account** (only for Method A) — free at [expo.dev](https://expo.dev/signup).

---

## 🅰️ Method A — EAS Build (Cloud) ✅ Recommended

EAS Build compiles your app on Expo's servers and hands you a download link for the `.apk`. You don't need Android Studio or any Android tooling installed.

### Step 1 — Install the EAS CLI

```bash
cd WearWise/02_SourceCode/frontend
npm install -g eas-cli
```

> If `npm install -g` fails with a permissions error on macOS, use:
>
> ```bash
> sudo npm install -g eas-cli
> ```

### Step 2 — Log in to your Expo account

```bash
eas login
```

Enter the email + password of your Expo account (create one first at [expo.dev/signup](https://expo.dev/signup) if you don't have one).

### Step 3 — Link this project to your Expo account (first time only)

```bash
eas init
```

This creates a project on Expo's servers and **fills in the empty `projectId`** in [`app.json`](app.json) (`expo.extra.eas.projectId`). You only do this once. If it asks to create a new project, say **Yes**.

### Step 4 — Build the APK

```bash
eas build --platform android --profile preview
```

What this does:

- `--platform android` → Android only
- `--profile preview` → uses the `preview` profile in [`eas.json`](eas.json), which is set to `buildType: "apk"` and `distribution: "internal"` (perfect for sharing/test installs)

The terminal will print a **build dashboard URL**. You can watch progress there. When it finishes (~10–20 min on the free tier), you'll get a **download link** for `wearwise.apk`.

### Step 5 — Download & install the APK

1. Click the download link (or run `eas build --status` to find it again).
2. Save the `.apk` file.
3. **To install on your own phone:** transfer the `.apk` to your phone (Google Drive, WhatsApp, email, USB, etc.), open it, and allow "Install from unknown sources" when Android prompts you.
4. **To share with others:** send them the `.apk` file (or the download link). They install it the same way.

> 💡 **Tip:** The download link from EAS is public — anyone with the link can download the APK. Great for sharing with testers.

### Rebuilding later

Any time you change code and want a fresh APK, just re-run Step 4. Bump `versionCode` in [`app.json`](app.json) (`expo.android.versionCode`) if you want Android to treat it as an update.

---

## 🅱️ Method B — Local Build (on your Mac)

Use this only if you can't/won't use EAS cloud. It builds the APK directly on your machine.

### Step 1 — Install Java JDK 17

```bash
brew install --cask temurin@17
```

Verify:

```bash
/usr/libexec/java_home -V
```

You should see JDK 17 listed.

### Step 2 — Set `JAVA_HOME` (add to your `~/.zshrc`)

```bash
echo 'export JAVA_HOME=$(/usr/libexec/java_home -v 17)' >> ~/.zshrc
source ~/.zshrc
```

### Step 3 — Install Android Studio (for the Android SDK)

Download from [developer.android.com/studio](https://developer.android.com/studio) and install. Open it once and let it download the **Android SDK** (it does this automatically on first launch).

Then set Android env vars (add to `~/.zshrc`):

```bash
echo 'export ANDROID_HOME=$HOME/Library/Android/sdk' >> ~/.zshrc
echo 'export PATH=$PATH:$ANDROID_HOME/emulator' >> ~/.zshrc
echo 'export PATH=$PATH:$ANDROID_HOME/platform-tools' >> ~/.zshrc
source ~/.zshrc
```

### Step 4 — Generate the native Android project

```bash
cd WearWise/02_SourceCode/frontend
npx expo prebuild --platform android
```

This creates an `android/` folder with the full native project.

### Step 5 — Build the APK

```bash
cd android
./gradlew assembleRelease
```

When it finishes, the APK is at:

```
android/app/build/outputs/apk/release/app-release.apk
```

> ⚠️ If you hit a signing error, you may need to generate a debug keystore. For testing, you can build a debug APK instead: `./gradlew assembleDebug` → output at `android/app/build/outputs/apk/debug/app-debug.apk`.

### Step 6 — Install & share

Same as Method A, Step 5 — transfer the `.apk` to a phone and install.

---

## 📲 How to install the APK on an Android phone

Once you have the `.apk` file on the phone (via download link, Drive, WhatsApp, USB, etc.):

1. **Open the `.apk` file** (tap it in Files app or the download notification).
2. Android will warn: _"For your security, your phone is not allowed to install unknown apps from this source."_
3. Tap **Settings** → enable **"Allow from this source"**.
4. Go back → tap **Install**.
5. Open **WearWise** from the app drawer. Sign up / log in. It's connected to your Supabase backend automatically (the URL + key are baked in).

> The person installing does **NOT** need Expo Go, a developer account, or a computer. Just the `.apk` file.

---

## 🔄 Updating the shared app later

1. Make your code changes.
2. Bump the version in [`app.json`](app.json):
   - `expo.version` (e.g. `"1.0.0"` → `"1.0.1"`)
   - `expo.android.versionCode` (e.g. `1` → `2`) — **Android uses this to detect updates**
3. Rebuild (Method A Step 4, or Method B Step 5).
4. Share the new `.apk`. Installing it over the old one keeps the user's data (same package name + signing key).

---

## 🧪 Quick reference — most common command

Once set up (Method A), the only command you'll repeat is:

```bash
cd WearWise/02_SourceCode/frontend
eas build --platform android --profile preview
```

Watch the printed URL → download the `.apk` → share it. Done.

---

## ❓ Troubleshooting

| Problem                                      | Fix                                                                                                                        |
| -------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| `eas login` fails                            | Create an account at expo.dev/signup first                                                                                 |
| `eas init` says project not found            | Answer **Yes** when asked to create a new project                                                                          |
| Build fails with "projectId not set"         | Run `eas init` (Step 3) — it fills `app.json`                                                                              |
| APK installs but shows blank / can't connect | The Supabase env vars weren't baked in. Confirm they're in [`eas.json`](eas.json) `env` block (they are, as of this guide) |
| Free-tier build queue is long                | Wait, or upgrade to a paid Expo plan for priority                                                                          |
| `./gradlew` permission denied (Method B)     | Run `chmod +x android/gradlew`                                                                                             |
| Local build: SDK not found                   | Open Android Studio → SDK Manager → install Android SDK 34                                                                 |
