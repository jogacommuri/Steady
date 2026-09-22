# Steady

A small, offline-first health tracker for **meals**, **weight**, and
**workouts** — rebuilt as a native iOS/Android app with React Native + Expo,
replacing the original web artifact.

The full plan lives in [`docs/architecture.md`](docs/architecture.md).

## Status

- ✅ **Phase 1 — Scaffold:** Expo Router app, three bottom tabs, design tokens
  (sage / clay / plum / gold, light + dark).
- ✅ **Phase 2 — Local-only:** SQLite CRUD for all three trackers. The app is
  fully usable offline — every entry is written to a local database and read
  back instantly. No backend required yet.
- ✅ **Phase 3 — Backend/sync:** offline-first Supabase sync (`lib/sync.ts`,
  `lib/supabase.ts`, `components/SyncProvider.tsx`) — last-write-wins push/pull
  plus realtime. **Optional:** with no Supabase env vars set, the app still
  runs exactly as Phase 2 (local-only). See [Sync setup](#sync-setup-optional).
- ✅ **Phase 4 — Modernist reskin:** the sage/clay/plum/gold tokens are gone,
  replaced by the Modernist design system (Archivo, red accent, square
  corners, hard 2px rules — see `theme/colors.ts`, `theme/typography.ts`).
  Four new screens were added: **Today** (now the default tab — summary
  cards, goal progress bars, today's log, quick-add), **Day detail**,
  **Goals** (target weight / workouts / minutes / meals, stored locally —
  see `hooks/useGoals.ts`), and **Progress** (streak, consistency, 35-day
  grid). Log entry moved out of the tracker tabs into its own screen
  (`app/add.tsx`), opened from the tab bar's "+" (the single entry point —
  an earlier Today-only quick-add row that did the same thing was removed).
  **Known trim:** Goals are device-local only (no Supabase table yet) —
  unlike meals/weights/workouts they don't sync across devices.
- ✅ **Phase 5 — Calorie estimation (opt-in):** meals carry an optional
  `calories` field. Type one in yourself, or turn on "Estimate calories
  automatically" on the Goals screen to have it filled in the background —
  never blocks the save — via a Supabase Edge Function
  (`supabase/functions/estimate-calories`) that proxies to OpenAI
  (`gpt-4o-mini` by default, overridable via the `OPENAI_MODEL` secret); the
  OpenAI key is a Supabase secret, never shipped in the app. A local
  cache (`calorie_cache`) avoids repeat lookups for the same text. Off by
  default; see [Supabase setup, step 6](docs/supabase-setup.md) to turn it
  on. The Meals tab shows a daily-average headline plus a per-meal-type
  breakdown, both excluding entries with no known calories rather than
  treating them as 0, plus a manual "Estimate now" backfill for meals logged
  before this was set up. See `lib/nutrition.ts`, `lib/calorieEnrichment.ts`,
  `supabase/functions/estimate-calories/index.ts`.
  **Also tried and rejected:** API Ninjas' free tier gates the `calories`
  field itself behind a paid plan; a structured food-database API
  (calorieapi.com) needs precise gram quantities the app never collects.
- ✅ **Phase 6 — Meal photo ID (opt-in):** on the meal entry form, "Camera" /
  "Photo library" buttons send a resized/compressed photo (client-side via
  `expo-image-manipulator`) to a second Edge Function
  (`supabase/functions/identify-meal-photo`), which proxies the same way to
  OpenAI's vision input and returns a short description + calorie estimate
  that fill the meal text and calories fields. Same opt-in model as calorie
  estimation — per-tap here rather than a background toggle — and the same
  `OPENAI_API_KEY` secret, no new key to configure. See
  [Supabase setup, step 6](docs/supabase-setup.md), `lib/mealPhoto.ts`,
  `supabase/functions/identify-meal-photo/index.ts`.

## Getting started

```bash
npm install
npm start        # then press i (iOS), a (Android), or w (web)
```

Built on **Expo SDK 57** (React Native 0.86). Requires
[Node 20+](https://nodejs.org) and the
[Expo tooling](https://docs.expo.dev/get-started/set-up-your-environment/)
(`npm start` uses the bundled `expo` CLI). On a phone, install a current
**Expo Go** (it supports the latest SDKs) and scan the QR code.

### Useful scripts

| Command | What it does |
| --- | --- |
| `npm start` | Start the Metro dev server |
| `npm run ios` / `npm run android` / `npm run web` | Launch a platform target |
| `npm run typecheck` | `tsc --noEmit` type check |
| `npm run lint` | Expo lint |
| `npm run prebuild:ios` | Generate the native `ios/` project (for a standalone build — see below) |

### Running as a standalone app (no dev server needed)

`npm start` + Expo Go is for development only — close the dev server and the
app stops working. To install a real, standalone build on your iPhone that
runs on its own (and unlocks native modules Expo Go can't host), see
[docs/build-ios-local.md](docs/build-ios-local.md) — a free path using your
own Apple ID and a local Xcode build (installs directly via cable; Apple's
free signing needs renewing roughly weekly). EAS Build is the paid
alternative ($99/yr Apple Developer Program) for wireless installs and no
renewal step — not set up in this repo yet.

## Project layout

```
app/         screens + navigation (Expo Router, file-based)
components/   row + form UI, shared primitives
hooks/        useMeals / useWeights / useWorkouts (local-first data)
lib/          SQLite setup, types, date/uuid helpers
theme/        colour tokens + useTheme()
docs/         architecture plan
```

## Sync setup (optional)

The app is local-first and runs with no backend. To turn on cloud backup and
cross-device sync, follow the step-by-step
[**Supabase setup guide**](docs/supabase-setup.md) — in short:

1. Create a free project at [supabase.com](https://supabase.com).
2. Copy your Project URL + anon (publishable) key into `.env` (from
   `.env.example`). You don't create any keys — Supabase generates them.
3. Run [`supabase/schema.sql`](supabase/schema.sql) in the SQL editor
   (tables, row-level security, realtime).
4. Enable anonymous + email auth and set the email templates to send a
   **6-digit code** (details in the setup guide).
5. Restart `npm start` — the app signs in anonymously and syncs automatically.

Sync is last-write-wins on `updated_at`: local writes queue and push (debounced,
and on reconnect/foreground), remote changes pull down and via realtime, and
deletes propagate as tombstones.

**Accounts (Account & Sync screen — the ⚙️ button in any tab header):** the app
starts with a zero-friction anonymous account that backs up *this* device. To
share data across devices, **link an email** on the first device, then **join**
that account with the same email (a 6-digit code) on the other device. See
[`docs/architecture.md`](docs/architecture.md#phase-3--how-sync-works) for the
full design.

## Data model

Three synced tables — `meals`, `weights`, `workouts` — each row carrying a
UUID plus `created_at` / `updated_at` for last-write-wins Supabase sync. A
fourth table, `goals`, holds the single-row target-weight/workouts/minutes/
meals record from the Goals screen; it's local-only (no `user_id`, no
Supabase counterpart yet). See `lib/db.ts` for the schema and `lib/types.ts`
for the row shapes.

## Notes

- Data is stored **on-device** in SQLite and works fully offline. Cloud backup
  and cross-device sync are opt-in via Supabase — see
  [Sync setup](#sync-setup-optional).
- Weight is always stored in **kg**; a kg/lb display toggle (Weight tab, next
  to the current reading) converts for display and for new entries. The
  preference lives on the same device-local `goals` row. See `lib/units.ts`.
