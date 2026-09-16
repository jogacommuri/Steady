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
- ⬜ **Phase 3 — Backend/sync:** Supabase push/pull (`lib/sync.ts`,
  `lib/supabase.ts`) — not started.

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

## Data model

Three tables — `meals`, `weights`, `workouts` — each row carrying a UUID plus
`created_at` / `updated_at`, so the planned last-write-wins Supabase sync has
what it needs. See `lib/db.ts` for the schema and `lib/types.ts` for the row
shapes.

## Notes

- All data is currently stored **only on-device** in SQLite. It survives app
  restarts but is not yet backed up or synced across devices — that arrives in
  Phase 3.
- Weight is stored in **kg** for now; a unit preference is a Phase 4 candidate.
