# Steady — React Native Architecture Plan

2026-09-16

Plan for rebuilding the Steady app (meals, weight, workouts tracking) as a
native React Native app, replacing the current web-based Claude artifact.

## Goals & scope

- Native iOS/Android app for the existing meals, weight, and workout tracker
- Data survives outside the Claude artifact viewer and syncs across devices
  (phone + tablet)
- Offline-capable: logging a meal or weight entry works without signal, syncs
  when back online
- Installable from the App Store / Play Store, or side-loaded for personal use
  first
- Out of scope for v1: HealthKit/Google Fit integration, notifications,
  multi-user accounts — flagged as v2 candidates

## Tech stack

| Layer | Choice | Why |
| --- | --- | --- |
| Framework | React Native + Expo (managed workflow) | Fastest path from the existing React-shaped UI; Expo handles native builds, OTA updates, and store submission tooling |
| Navigation | Expo Router (file-based, bottom tabs) | Matches the current Meals / Weight / Workouts tab layout |
| State | React hooks per tracker (Context/Zustand if it grows) | App is small — avoid Redux overhead |
| Local storage | SQLite (expo-sqlite) | Real offline-first querying/sorting, unlike key-value AsyncStorage |
| Backend / sync | Supabase (Postgres + realtime + auth) | Free tier covers one-user usage; Firebase is the alternative |
| Styling | StyleSheet + shared design tokens | Keeps the sage/clay/plum/gold palette portable; NativeWind optional later |
| Charts (v2) | Victory Native or react-native-svg-charts | For weight trend lines later |

## Architecture

```mermaid
flowchart TD
  UI[RN Screens<br/>Meals / Weight / Workouts] --> Hooks[Data hooks<br/>useMeals, useWeights, useWorkouts]
  Hooks --> Local[(Local SQLite<br/>offline cache)]
  Hooks --> Sync[Sync layer]
  Sync <--> Remote[(Supabase<br/>Postgres + Realtime)]
  Remote --> Auth[Supabase Auth]
```

Screens read and write through hooks, which always hit local SQLite first
(instant UI, works offline). A background sync layer pushes local changes to
Supabase and pulls remote changes down, reconciling by `updated_at` timestamp
on conflict.

## Data model & sync

Three tables mirroring the artifact's collections:

- `meals` (date, meal_type, time, text)
- `weights` (date, value, note)
- `workouts` (date, workout_type, duration, text)

Each row gets a UUID, `created_at`, and `updated_at`.

**Sync strategy:** offline-first, last-write-wins on `updated_at`. Writes go to
local SQLite immediately and queue for sync; a background task pushes queued
writes to Supabase on reconnect and subscribes to Supabase Realtime for changes
made on other devices. This avoids build-your-own-conflict-resolution
complexity for a single-user app.

## Project structure

```
app/
  index.tsx           redirect → Meals
  _layout.tsx         SQLiteProvider + migrations
  (tabs)/
    _layout.tsx       bottom tab navigator
    meals.tsx
    weight.tsx
    workouts.tsx
components/
  MealRow.tsx, WeightRow.tsx, WorkoutRow.tsx
  EntryForm.tsx       shared form primitives
  ui.tsx              Card, Chip, EmptyState, DeleteButton
hooks/
  useMeals.ts, useWeights.ts, useWorkouts.ts
lib/
  db.ts               SQLite setup + migrations
  types.ts            row shapes
  dates.ts, uuid.ts   helpers
  sync.ts             Supabase push/pull  (Phase 3)
  supabase.ts         client config       (Phase 3)
theme/
  colors.ts           sage/clay/plum/gold tokens, light + dark
  useTheme.ts
```

## Build phases

| Phase | Scope | Status |
| --- | --- | --- |
| 1. Scaffold | Expo app, tab navigation, static UI ported from the artifact | ✅ done |
| 2. Local-only | SQLite CRUD for meals/weights/workouts; fully usable offline | ✅ done |
| 3. Backend | Supabase project, auth, push/pull sync | ⬜ next |
| 4. Polish | Weight trend chart, delta indicators, empty states, dark mode | 🔶 partial (deltas, empty states, dark mode done) |
| 5. Ship | EAS Build, TestFlight/internal track, then store submission | ⬜ |

## Cost & store

- Expo/EAS Build: free tier covers occasional personal builds
- Supabase: free tier (500MB DB, 50k MAU) far exceeds a single-user tracker
- Apple Developer Program: $99/year, only if publishing to the App Store
- Google Play: $25 one-time, only if publishing to Play Store
- Side-loading (TestFlight / Android APK) avoids both store fees for personal use

## Open questions

- [ ] Personal use only, or App Store distribution eventually?
- [ ] Single device, or sync across your own phone + tablet?
- [ ] Keep Supabase, or prefer Firebase given any existing familiarity?
