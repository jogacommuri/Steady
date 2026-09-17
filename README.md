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

## Getting started

```bash
npm install
npm start        # then press i (iOS), a (Android), or w (web)
```

Requires [Node 18+](https://nodejs.org) and the
[Expo tooling](https://docs.expo.dev/get-started/set-up-your-environment/)
(`npm start` uses the bundled `expo` CLI). On a phone, install **Expo Go** and
scan the QR code.

### Useful scripts

| Command | What it does |
| --- | --- |
| `npm start` | Start the Metro dev server |
| `npm run ios` / `npm run android` / `npm run web` | Launch a platform target |
| `npm run typecheck` | `tsc --noEmit` type check |
| `npm run lint` | Expo lint |

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

Three tables — `meals`, `weights`, `workouts` — each row carrying a UUID plus
`created_at` / `updated_at`, so the planned last-write-wins Supabase sync has
what it needs. See `lib/db.ts` for the schema and `lib/types.ts` for the row
shapes.

## Notes

- Data is stored **on-device** in SQLite and works fully offline. Cloud backup
  and cross-device sync are opt-in via Supabase — see
  [Sync setup](#sync-setup-optional).
- Weight is stored in **kg** for now; a unit preference is a Phase 4 candidate.
