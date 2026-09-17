# Supabase setup

One-time setup to turn on cloud backup and cross-device sync. Takes ~10 minutes.
You **do not create any API keys** — Supabase generates the one the app needs.
Nothing secret is stored in the app.

Skip all of this to run Steady local-only: with no `.env`, the app just uses
on-device SQLite (Phase 2 behaviour).

---

## 1. Create a project

1. Sign in at [supabase.com](https://supabase.com) → **New project**.
2. Pick a name, a strong database password (you won't need it for the app), and
   a region near you. The **free tier** is far more than a single-user tracker
   needs.
3. Wait for provisioning to finish (~2 min).

## 2. Copy the URL + key into `.env`

1. In the dashboard: **Project Settings** (gear icon) → **API**.
2. Copy these two values:

   | Dashboard field | `.env` variable |
   | --- | --- |
   | **Project URL** | `EXPO_PUBLIC_SUPABASE_URL` |
   | **anon** / **public** key — shown as **"Publishable key"** (`sb_publishable_…`) in newer projects | `EXPO_PUBLIC_SUPABASE_ANON_KEY` |

3. In the repo, copy the example env file and paste the values in:

   ```bash
   cp .env.example .env
   # then edit .env
   ```

   ```dotenv
   EXPO_PUBLIC_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
   EXPO_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_xxx   # or the anon/public key
   ```

> **Safe to ship.** The anon / publishable key is meant to live in client apps —
> it's public and every request is gated by row-level security (step 3).
>
> ⚠️ **Never** put the **`service_role`** (secret) key in the app. It bypasses
> RLS and is for server-side use only.

## 3. Run the schema

1. Dashboard → **SQL Editor** → **New query**.
2. Paste the entire contents of [`../supabase/schema.sql`](../supabase/schema.sql)
   and click **Run**.

This creates the `meals` / `weights` / `workouts` tables, owner-only row-level
security, and adds the tables to the realtime publication.

## 4. Auth settings (for the account / sync flow)

Under **Authentication**:

1. **Providers → Anonymous** — enable. (First launch signs in silently so
   there's no sign-in wall, and still gets cloud backup.)
2. **Providers → Email** — enable.
3. **Email Templates** — edit both **"Magic Link"** and **"Change Email
   Address"** so the message includes the **code token**, for example:

   ```
   Your Steady code: {{ .Token }}
   ```

   The app verifies a **6-digit code**, not a magic-link URL — a mobile app has
   no deep link to catch a clicked link. If a template only sends
   `{{ .ConfirmationURL }}`, users won't get a code to type.
4. *(Optional)* **Sign In / Providers → Email → "Secure email change"** — turn
   **off**. Otherwise linking an email asks to confirm both an old and a new
   address, which is awkward for an anonymous account that had no email before.

## 5. Run the app

```bash
npm start
```

The app signs in anonymously and starts syncing automatically. Add a meal on one
device, and it should appear in the Supabase **Table Editor → meals**.

---

## Using it across two devices

1. **Device A (first device):** open **Account & Sync** (the ⚙️ button in any
   tab header) → **Link email** → enter your email → type the 6-digit code.
2. **Device B:** open **Account & Sync** → **Join account** → enter the same
   email → type the 6-digit code. Both devices now share one account and sync.

## Verifying / troubleshooting

- **No code email arrives:** re-check step 4.3 — the template must include
  `{{ .Token }}`. Also check spam, and Authentication → **Rate limits** (the
  free SMTP has low limits; for real use, configure a custom SMTP provider).
- **Rows don't sync:** confirm the `.env` values, that step 3 ran without error,
  and that RLS policies exist (Table Editor → a table → **RLS** enabled).
- **`.env` changes not picked up:** stop and restart `npm start` — Expo reads
  `EXPO_PUBLIC_*` at bundler start.
- **Env vars only apply to `EXPO_PUBLIC_`-prefixed names** — that prefix is what
  exposes them to the app bundle.
