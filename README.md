# If you need any help/assistance in future you can contact me directly via:

# Email: aliijaz6511@gmail.com

# WhatsApp: +923403975893

# WearWise 👕✨

A cross-platform **smart wardrobe & outfit recommendation** mobile app built with **React Native (Expo)** and **Supabase**. Users photograph their clothing, tag items by category/occasion/color, and the app generates outfit suggestions using a rule-based recommendation engine — no AI required.

Built for both **Android** and **iOS** from a single codebase.

---

## 📱 Features

| Area                      | Description                                                                                      |
| ------------------------- | ------------------------------------------------------------------------------------------------ |
| **Auth**                  | Email/password sign-up & login via Supabase Auth, persistent sessions                            |
| **Wardrobe**              | Add items with a photo (camera or gallery), tag category, type, color, occasions, season & notes |
| **6 Fixed Categories**    | Tops, Bottoms, Dresses, Shoes, Bags, Accessories                                                 |
| **Outfit Creator**        | Pick an occasion (+ optional weather & style preferences) to generate an outfit                  |
| **Recommendation Engine** | Rule-based scoring: occasion match, weather suitability, style alignment, color harmony          |
| **Outfit Result**         | View the generated outfit with rationale, regenerate, or save it                                 |
| **Saved Outfits**         | Browse & filter saved outfits by occasion, reopen to view, favorite (heart), delete              |
| **Profile**               | Edit display name, avatar, measurements & default preferences, view stats, sign out              |
| **Item Detail**           | Full read-only view of any item with edit & delete actions                                       |
| **Help & Support**        | Contact form that stores messages for admin review                                               |
| **Custom Splash Screen**  | Animated pulse/heartbeat logo on app launch                                                      |

---

## 🗂 Project Structure

```
WearWise/
├── 01_Builds/                  # Compiled APK / IPA build outputs (gitignored)
├── 02_SourceCode/
│   ├── backend/
│   │   └── supabase/
│   │       └── migrations/
│   │           ├── 0001_init.sql                 # Initial schema: profiles, wardrobe_items, saved_outfits, storage, RLS
│   │           ├── 0002_profile_extras.sql       # profile_picture_url, measurements, notification_enabled
│   │           ├── 0003_saved_outfit_extras.sql  # saved_outfits.name + is_favorite
│   │           ├── 0004_admin_messages.sql       # admin messages table (Help & Support)
│   │           └── WEARWISE_COMPLETE_SCHEMA.sql  # ⭐ Consolidated idempotent schema (run THIS for fresh installs)
│   └── frontend/               # Expo React Native app
│       ├── app.json            # Expo config (app name, icons, permissions, EAS projectId)
│       ├── eas.json            # EAS Build profiles (Android + iOS)
│       ├── babel.config.js
│       ├── index.ts            # App entry point
│       ├── metro.config.js
│       ├── package.json
│       ├── tsconfig.json
│       ├── BUILD_ANDROID_APK.md  # Detailed Android build guide
│       ├── BUILD_IOS.md          # Detailed iOS build guide
│       ├── assets/
│       │   ├── images/          # logo, icon, splash, adaptive-icon
│       │   └── icons/
│       └── src/
│           ├── components/
│           │   ├── cards/       # ItemCard, OutfitCard
│           │   └── ui/          # Button, Input, Card, Chip, Screen, Header,
│           │                   # EmptyState, Loading, CategoryIcon, Toast, SplashScreen
│           ├── constants/       # Categories, occasions, weather, styles, colors
│           ├── context/         # AuthContext, WardrobeContext, SavedOutfitsContext
│           ├── navigation/      # RootNavigator, RootStack, AuthStack, MainTabs, types
│           ├── screens/
│           │   ├── auth/        # Welcome, Login, Signup
│           │   └── main/        # Home, Wardrobe, Creator, OutfitResult, Saved,
│           │                   # Favorites, Profile, AddItem, ItemDetail,
│           │                   # MyMeasurements, MyPreferences, ReminderSettings, HelpSupport
│           ├── services/        # supabase client, auth, wardrobe, savedOutfits,
│           │                   # outfitGenerator, adminService
│           ├── theme/           # colors, spacing, radius, typography, shadows
│           └── types/           # Domain TypeScript interfaces
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** ≥ 18
- **npm** (or yarn / pnpm)
- **Expo CLI** (installed automatically via dependencies)
- **EAS CLI** (for building standalone APK/IPA): `npm install -g eas-cli`
- **Android Studio** + an Android emulator (optional, for Android testing)
- **Xcode** + iOS Simulator (optional, for iOS testing, macOS only)
- A **Supabase** project (free tier works)

---

### 1. Backend — Set up Supabase

1. Create a new project at [supabase.com](https://supabase.com).
2. Open the **SQL Editor** in your Supabase dashboard.
3. Copy the entire contents of [`02_SourceCode/backend/supabase/migrations/WEARWISE_COMPLETE_SCHEMA.sql`](02_SourceCode/backend/supabase/migrations/WEARWISE_COMPLETE_SCHEMA.sql) and run it.
   - This is the **consolidated, idempotent** schema file — it creates everything in one go and is safe to re-run.
   - Creates tables: `profiles`, `wardrobe_items`, `saved_outfits`, `admin`.
   - Enables **Row Level Security** with owner-only policies on all tables.
   - Creates the `item-photos` and `avatars` **storage buckets** (public) with per-user folder policies.
   - Adds triggers to auto-create a profile on signup and keep `updated_at` fresh.
4. Go to **Project Settings → API** and copy your **Project URL** and **anon public key**.

> 💡 You can also run the migration locally with the Supabase CLI:
>
> ```bash
> cd 02_SourceCode/backend
> supabase db push
> ```

---

### 2. Frontend — Configure environment variables

Create a `.env` file inside `02_SourceCode/frontend/`:

```env
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_KEY=your-anon-public-key
```

> Expo exposes env vars prefixed with `EXPO_PUBLIC_` to the app at build/runtime.
>
> The Supabase **anon key** is safe to ship in the client app — Row Level Security protects all data.

---

### 3. Install dependencies

```bash
cd 02_SourceCode/frontend
npm install
```

---

### 4. Start the development server

```bash
npm start
```

This launches the **Expo DevTools** in your terminal. From there you can:

- Press **`a`** to open in the **Android emulator** (make sure Android Studio + an AVD are running).
- Press **`i`** to open in the **iOS Simulator** (macOS + Xcode required).
- Press **`w`** to open in a **web browser** (limited support — camera/photo features may differ).
- Or scan the **QR code** with the **Expo Go** app on a physical device.

---

### 5. Type-check (optional)

```bash
npm run tsc
```

---

## 🔧 Environment Variables

| Variable                   | Where to set                  | Description                   |
| -------------------------- | ----------------------------- | ----------------------------- |
| `EXPO_PUBLIC_SUPABASE_URL` | `02_SourceCode/frontend/.env` | Your Supabase project URL     |
| `EXPO_PUBLIC_SUPABASE_KEY` | `02_SourceCode/frontend/.env` | Your Supabase anon public key |

These same variables are also embedded in the EAS build profiles in [`eas.json`](02_SourceCode/frontend/eas.json) so that production builds always include the correct backend credentials.

---

## 📦 Building Standalone Apps (APK / IPA)

The project uses **EAS Build** (Expo Application Services) to produce installable binaries. Builds run on Expo's cloud servers — no local Android Studio or Xcode setup required for the build itself.

### Install the EAS CLI (one-time)

```bash
npm install -g eas-cli
eas login
```

### Build profiles

Defined in [`02_SourceCode/frontend/eas.json`](02_SourceCode/frontend/eas.json):

| Profile          | Platform | Output | Distribution | Apple account needed? |
| ---------------- | -------- | ------ | ------------ | --------------------- |
| `preview`        | Android  | `.apk` | Internal     | ❌ No                 |
| `production`     | Android  | `.apk` | Store-ready  | ❌ No                 |
| `ios-preview`    | iOS      | `.ipa` | Internal     | Free Apple ID ✅      |
| `ios-production` | iOS      | `.ipa` | Store-ready  | Paid Apple Developer  |

### Build an Android APK (no Apple account needed)

```bash
cd 02_SourceCode/frontend
eas build --platform android --profile preview
```

When the build finishes, EAS gives you a link + QR code. Open the link on an Android phone to install the `.apk` directly (allow "Install from unknown sources" if prompted).

### Build an iOS IPA (free Apple ID)

```bash
cd 02_SourceCode/frontend
eas build --platform ios --profile ios-preview
```

On first run, EAS will prompt you to log in with your Apple ID and choose your Apple Team. A **free Apple ID** works — no paid $99/year developer account required.

> ⚠️ **Free Apple ID limitation:** Builds signed with a free Apple ID expire after **7 days** and can only be installed on devices whose UDID is registered. To register a device, run `eas device:create` and open the generated link on the iPhone. For permanent distribution (TestFlight / App Store), a paid Apple Developer Program membership ($99/year) is required.

For full step-by-step guides, see:

- [`BUILD_ANDROID_APK.md`](02_SourceCode/frontend/BUILD_ANDROID_APK.md)
- [`BUILD_IOS.md`](02_SourceCode/frontend/BUILD_IOS.md)

---

## 🧭 App Navigation Flow

```
RootNavigator
├── SplashScreen (animated logo, 2s min + wait for auth)
├── AuthStack (unauthenticated)
│   ├── Welcome
│   ├── Login
│   └── Signup
└── RootStack (authenticated)
    └── MainTabs
        ├── Home          ← greeting, stats, today's suggestion, recent items
        ├── Wardrobe      ← filterable grid by category & occasion, add item FAB
        ├── Creator       ← pick occasion/weather/style → generate outfit
        ├── Saved         ← filterable saved outfits, favorite, reopen or delete
        └── Profile       ← edit name, avatar, measurements & preferences, sign out
    + Pushed screens:
        ├── AddItem       ← add or edit a wardrobe item
        ├── OutfitResult  ← view generated outfit, regenerate, save
        ├── ItemDetail    ← full item view with edit/delete
        ├── Creator       ← standalone outfit creator
        ├── MyMeasurements
        ├── MyPreferences
        ├── ReminderSettings
        └── HelpSupport
```

---

## 🎨 Design System

The app uses a centralized theme in [`src/theme/theme.ts`](02_SourceCode/frontend/src/theme/theme.ts):

- **Primary brand color:** `#5D38F5` (violet/purple)
- **Gradient backgrounds:** purple gradient on auth screens
- **Light background:** `#FFFFFF`
- **Rounded cards** with soft purple-tinted shadows
- **6 category colors** reused across cards, chips, and icons
- Consistent **spacing**, **radius**, and **typography** scales

---

## 🧠 Outfit Recommendation Engine

The generator lives in [`src/services/outfitGenerator.ts`](02_SourceCode/frontend/src/services/outfitGenerator.ts). It is **rule-based** (no AI):

1. **Filter** items to those tagged with the chosen occasion (plus compatible occasions).
2. **Score** each item by:
   - Occasion match (exact or compatible)
   - Weather suitability (e.g. cold → sweaters/boots)
   - Style alignment (e.g. minimalist → solid neutrals)
   - Color harmony bonus
3. **Rank** items per category by score, with a small random shuffle for variety.
4. **Compose** the outfit:
   - **Top + Bottom** _or_ **Dress** (required)
   - **Shoes** (required)
   - **Bag** (optional, when compatible)
   - **Accessories** (at least one, when compatible)
5. **Build a rationale** explaining the choices.
6. **Regenerate** re-runs the engine (with optional previous outfit to avoid repeats).

---

## 🔒 Security

- **Row Level Security (RLS)** is enabled on every table — users can only read/write their own data.
- **Storage policies** restrict uploads to the authenticated user's folder (`user_id/...`).
- Auth sessions are persisted via `expo-secure-store`.
- The Supabase **anon key** is safe to ship in the client (RLS protects the data).

---

## 📦 Key Dependencies

| Package                                                     | Purpose                           |
| ----------------------------------------------------------- | --------------------------------- |
| `expo` ~51                                                  | Expo SDK                          |
| `react-native` 0.74.5                                       | Cross-platform UI                 |
| `@supabase/supabase-js`                                     | Backend (auth, db, storage)       |
| `@react-navigation/native` + `native-stack` + `bottom-tabs` | Navigation                        |
| `expo-image-picker`                                         | Photo upload (camera + gallery)   |
| `expo-secure-store`                                         | Persistent auth sessions          |
| `expo-image`                                                | Fast image rendering              |
| `expo-linear-gradient`                                      | Gradient backgrounds              |
| `react-native-reanimated`                                   | Animations (splash, heartbeat)    |
| `@expo/vector-icons`                                        | Ionicons / MaterialCommunityIcons |
| `react-native-safe-area-context`                            | Notch / safe area handling        |

---

## 🛠 Scripts

| Command           | Description                     |
| ----------------- | ------------------------------- |
| `npm start`       | Start Expo dev server           |
| `npm run android` | Start + open Android emulator   |
| `npm run ios`     | Start + open iOS Simulator      |
| `npm run web`     | Start + open web                |
| `npm run tsc`     | TypeScript type-check (no emit) |

---

## 📲 Deliverables Checklist

This project is delivered with the following:

| #   | Deliverable                  | Status       | Location / Notes                                                                                                                                                                                                                       |
| --- | ---------------------------- | ------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | **Android app build (.apk)** | ✅ Ready     | Built via `eas build --platform android --profile preview`. Installs on any Android device without a paid developer account.                                                                                                           |
| 2   | **iOS app build (.ipa)**     | ✅ Buildable | Built via `eas build --platform ios --profile ios-preview` using a free Apple ID. Installs via ad-hoc distribution (device UDID must be registered). For TestFlight, use `ios-production` profile with a paid Apple Developer account. |
| 3   | **Full source code**         | ✅ Included  | `02_SourceCode/` contains complete frontend + backend (Supabase migrations).                                                                                                                                                           |
| 4   | **README.md**                | ✅ This file | Setup instructions, environment variables, run & build guide.                                                                                                                                                                          |

---

## 📝 Notes

- The app is configured for **portrait** orientation and **light** user interface style.
- iOS camera/photo permissions and Android storage permissions are declared in [`app.json`](02_SourceCode/frontend/app.json).
- App identifiers: `com.wearwise.app` (both Android package and iOS bundle identifier).
- The Supabase backend is already provisioned and configured — the env variables in `eas.json` point to the live project.

---

## 📄 License

Proprietary — built for the WearWise client project.
