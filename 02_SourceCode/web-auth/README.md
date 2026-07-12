# WearWise Auth Pages (Netlify)

Static web pages that handle **email verification** and **password reset** for the WearWise mobile app. Hosted on Netlify (free tier).

## Pages

| File                  | Purpose                                                                                          |
| --------------------- | ------------------------------------------------------------------------------------------------ |
| `index.html`          | Email verification confirmation — shows "Email Verified!" after the user clicks the signup link. |
| `reset-password.html` | Password reset form — lets the user set a new password after clicking the reset link.            |
| `config.js`           | Supabase URL + publishable key (shared by both pages).                                           |
| `styles.css`          | Shared brand-matched styles.                                                                     |

## How it works

1. The mobile app calls Supabase with `emailRedirectTo` / `redirectTo` pointing to these pages.
2. Supabase sends an email with a verification link.
3. The user clicks the link → Supabase verifies the token server-side → redirects to the page with session tokens in the URL hash (`#access_token=...`).
4. The page reads the hash (implicit flow) and either shows a confirmation or a password form.

## Deploy to Netlify

### Option A — Drag & drop (fastest)

1. Go to [app.netlify.com/drop](https://app.netlify.com/drop).
2. Drag this entire `web-auth` folder into the page.
3. Netlify gives you a URL like `https://random-name-123.netlify.app`.
4. (Optional) Rename the site: Site Settings → Change site name → e.g. `wearwise-auth` → URL becomes `https://wearwise-auth.netlify.app`.

### Option B — Git deploy

1. Push this folder to a GitHub repo (or connect the repo).
2. In Netlify: Add new site → Import from Git → select the repo.
3. Build command: _(leave empty)_ — Publish directory: `web-auth` (or the repo root if this is the only folder).

## After deploying — 2 steps

### Step 1 — Update the mobile app

Open `WearWise/02_SourceCode/frontend/src/services/authService.ts` and set `AUTH_SITE_URL` to your Netlify URL:

```typescript
const AUTH_SITE_URL = 'https://wearwise-auth.netlify.app';
```

Then rebuild the app (`eas build --profile development --platform android`).

### Step 2 — Add redirect URLs in Supabase

Go to **Supabase Dashboard → Authentication → URL Configuration** and add these to **Redirect URLs**:

```
https://wearwise-auth.netlify.app/
https://wearwise-auth.netlify.app/reset-password
```

(Replace `wearwise-auth` with your actual Netlify site name.)

Click **Save**. That's it — email verification and password reset now work through the web pages.

## Testing

1. In the app, sign up → check email → click verify link → opens `index.html` → "Email Verified!"
2. In the app, forgot password → check email → click reset link → opens `reset-password.html` → enter new password → "Password Updated!"
3. Log in to the app with the new password.
