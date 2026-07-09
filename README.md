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
| **Saved Outfits**         | Browse & filter saved outfits by occasion, reopen to view, delete                                |
| **Profile**               | Edit display name & default preferences, view wardrobe breakdown & saved-outfit stats, sign out  |
| **Item Detail**           | Full read-only view of any item with edit & delete actions                                       |

---

## 🗂 Project Structure

```
WearWise/
├── 01_Builds/                  # Compiled APK / IPA build outputs (gitignored)
│   ├── android/
│   └── ios/
├── 02_SourceCode/
│   ├── backend/
│   │   └── supabase/
│   │       ├── migrations/
│   │       │   └── 0001_init.sql   # Full DB schema: tables, RLS, storage, triggers
│   │       └── seed/               # (optional) seed data
│   └── frontend/                   # Expo React Native app
│       ├── app.json
│       ├── babel.config.js
│       ├── index.ts                # App entry point
│       ├── metro.config.js
│       ├── package.json
│       ├── tsconfig.json
│       ├── .env                    # EXPO_PUBLIC_SUPABASE_URL / KEY
│       ├── assets/images/logo.png
│       └── src/
│           ├── components/
│           │   ├── cards/          # ItemCard, OutfitCard
│           │   ├── forms/          # (form helpers)
│           │   └── ui/             # Button, Input, Card, Chip, Screen, Header,
│           │                       # EmptyState, Loading, CategoryIcon, Toast
│           ├── constants/          # Categories, occasions, weather, styles, colors
│           ├── context/            # AuthContext, WardrobeContext, SavedOutfitsContext
│           ├── navigation/         # RootStack, AuthStack, MainTabs, types
│           ├── screens/
│           │   ├── auth/           # Welcome, Login, Signup
│           │   └── main/           # Home, Wardrobe, Creator, OutfitResult,
│           │                       # Saved, Profile, AddItem, ItemDetail
│           ├── services/           # supabase client, auth, wardrobe, savedOutfits,
│           │                       # outfitGenerator
│           ├── theme/              # colors, spacing, radius, typography, shadows
│           ├── types/              # Domain TypeScript interfaces
│           └── utils/
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** ≥ 18
- **npm** (or yarn / pnpm)
- **Expo CLI** (installed automatically via dependencies)
- **Android Studio** + an Android emulator (for Android testing)
- **Xcode** + iOS Simulator (for iOS testing, macOS only)
- A **Supabase** project (free tier works)

### 1. Backend — Set up Supabase

1. Create a new project at [supabase.com](https://supabase.com).
2. Open the **SQL Editor** in your Supabase dashboard.
3. Copy the entire contents of [`02_SourceCode/backend/supabase/migrations/0001_init.sql`](02_SourceCode/backend/supabase/migrations/0001_init.sql) and run it.
   - This creates the `profiles`, `wardrobe_items`, and `saved_outfits` tables.
   - Enables **Row Level Security** with owner-only policies.
   - Creates the `item-photos` **storage bucket** (public) with per-user folder policies.
   - Adds triggers to auto-create a profile on signup and keep `updated_at` fresh.
4. Go to **Project Settings → API** and copy your **Project URL** and **anon public key**.

> 💡 You can also run the migration locally with the Supabase CLI:
>
> ```bash
> cd 02_SourceCode/backend
> supabase db push
> ```

### 2. Frontend — Configure environment

Create a `.env` file inside `02_SourceCode/frontend/` (it already exists with placeholders — replace the values with your own):

```env
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_KEY=your-anon-public-key
```

> Expo exposes env vars prefixed with `EXPO_PUBLIC_` to the app at build/runtime.

### 3. Install dependencies

```bash
cd 02_SourceCode/frontend
npm install
```

### 4. Start the development server

```bash
npm start
```

This launches the **Expo DevTools** in your terminal. From there you can:

- Press **`a`** to open in the **Android emulator** (make sure Android Studio + an AVD are running).
- Press **`i`** to open in the **iOS Simulator** (macOS + Xcode required).
- Press **`w`** to open in a **web browser** (limited support — camera/photo features may differ).
- Or scan the **QR code** with the **Expo Go** app on a physical device.

### 5. Type-check (optional)

```bash
npm run tsc
```

---

## 🧭 App Navigation Flow

```
RootStack
├── AuthStack (unauthenticated)
│   ├── Welcome
│   ├── Login
│   └── Signup
└── Main (authenticated) ── MainTabs
    ├── Home          ← greeting, stats, quick generate, recent items, recent outfits
    ├── Wardrobe      ← filterable grid by category & occasion, add item FAB
    ├── Creator       ← pick occasion/weather/style → generate outfit
    ├── Saved         ← filterable saved outfits, reopen or delete
    └── Profile       ← edit name & preferences, stats, sign out
    + Modal/Pushed screens:
        ├── AddItem      ← add or edit a wardrobe item (modal)
        ├── OutfitResult ← view generated outfit, regenerate, save
        └── ItemDetail   ← full item view with edit/delete
```

---

## 🎨 Design System

The app uses a centralized theme in [`src/theme/theme.ts`](02_SourceCode/frontend/src/theme/theme.ts):

- **Primary brand color:** `#7C5CE0` (violet/purple)
- **Light, airy background:** `#FAF8FF`
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

## 📝 Notes

- The logo in `assets/images/logo.png` is a **placeholder**. Replace it with the client's final logo when provided.
- Sample screens / final UI polish will be adjusted once the client shares design references.
- The app is configured for **portrait** orientation and **light** user interface style.
- iOS camera/photo permissions and Android storage permissions are declared in `app.json`.

---

## 📄 License

Proprietary — built for the WearWise client project.
