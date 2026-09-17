import type { SQLiteDatabase } from 'expo-sqlite';

/**
 * SQLite bootstrap. The schema mirrors the three planned Supabase tables and
 * keeps the columns the sync layer needs (id / created_at / updated_at).
 *
 * `migrate` is wired into <SQLiteProvider onInit={migrate}> in app/_layout.tsx
 * so it runs once on launch, before any screen queries the database.
 */

export const DATABASE_NAME = 'steady.db';

const TARGET_USER_VERSION = 6;

export async function migrate(db: SQLiteDatabase): Promise<void> {
  await db.execAsync('PRAGMA journal_mode = WAL;');
  await db.execAsync('PRAGMA foreign_keys = ON;');

  const row = await db.getFirstAsync<{ user_version: number }>(
    'PRAGMA user_version;'
  );
  let version = row?.user_version ?? 0;

  if (version < 1) {
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS meals (
        id         TEXT PRIMARY KEY NOT NULL,
        date       TEXT NOT NULL,
        meal_type  TEXT NOT NULL,
        time       TEXT NOT NULL,
        text       TEXT NOT NULL DEFAULT '',
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_meals_date ON meals (date);

      CREATE TABLE IF NOT EXISTS weights (
        id         TEXT PRIMARY KEY NOT NULL,
        date       TEXT NOT NULL,
        value      REAL NOT NULL,
        note       TEXT NOT NULL DEFAULT '',
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_weights_date ON weights (date);

      CREATE TABLE IF NOT EXISTS workouts (
        id           TEXT PRIMARY KEY NOT NULL,
        date         TEXT NOT NULL,
        workout_type TEXT NOT NULL,
        duration     INTEGER NOT NULL DEFAULT 0,
        text         TEXT NOT NULL DEFAULT '',
        created_at   TEXT NOT NULL,
        updated_at   TEXT NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_workouts_date ON workouts (date);
    `);
    version = 1;
  }

  if (version < 2) {
    // Phase 3 sync support. Deletes become tombstones (deleted_at) so they can
    // propagate to other devices; pending_sync = 1 marks a row as needing a
    // push. Existing rows default to pending so the first sync backs them up.
    for (const table of ['meals', 'weights', 'workouts']) {
      await db.execAsync(`
        ALTER TABLE ${table} ADD COLUMN deleted_at TEXT;
        ALTER TABLE ${table} ADD COLUMN pending_sync INTEGER NOT NULL DEFAULT 1;
        CREATE INDEX IF NOT EXISTS idx_${table}_pending ON ${table} (pending_sync);
        CREATE INDEX IF NOT EXISTS idx_${table}_updated ON ${table} (updated_at);
      `);
    }
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS sync_meta (
        key   TEXT PRIMARY KEY NOT NULL,
        value TEXT
      );
    `);
    version = 2;
  }

  if (version < 3) {
    // Goals (target weight / workouts-per-week / minutes-per-week /
    // meals-per-day) are a single row, kept device-local: there's no Supabase
    // table for them yet, so unlike the trackers above they don't go through
    // pending_sync / the sync engine. Seeded once with the prototype's
    // defaults; the Goals screen only ever updates this one row.
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS goals (
        id                 TEXT PRIMARY KEY NOT NULL,
        target_weight      REAL NOT NULL,
        workouts_per_week  INTEGER NOT NULL,
        minutes_per_week   INTEGER NOT NULL,
        meals_per_day      INTEGER NOT NULL,
        updated_at         TEXT NOT NULL
      );
    `);
    await db.runAsync(
      `INSERT OR IGNORE INTO goals (id, target_weight, workouts_per_week, minutes_per_week, meals_per_day, updated_at)
       VALUES ('local', 74, 4, 150, 3, ?)`,
      [new Date().toISOString()]
    );
    version = 3;
  }

  if (version < 4) {
    // Display-unit preference for weight (kg/lb). Weight rows themselves stay
    // in kg always — this only affects how they're formatted and how new
    // entries are parsed. Lives on the same device-local `goals` row.
    await db.execAsync(
      `ALTER TABLE goals ADD COLUMN weight_unit TEXT NOT NULL DEFAULT 'kg';`
    );
    version = 4;
  }

  if (version < 5) {
    // Calorie estimation. `calories` is nullable — NULL means "not estimated
    // yet", not zero, so averages can exclude it rather than treating it as a
    // real 0. It's a normal synced column (unlike `goals`), so a manual or
    // background-filled value backs up and shows up on other devices too.
    // `calorie_cache` avoids re-querying the nutrition API for repeat meal
    // text (e.g. "coffee" logged daily) — local-only, never synced.
    // `auto_calories` (on the device-local `goals` row) is the opt-in toggle.
    await db.execAsync(`
      ALTER TABLE meals ADD COLUMN calories REAL;

      CREATE TABLE IF NOT EXISTS calorie_cache (
        text_key   TEXT PRIMARY KEY NOT NULL,
        calories   REAL NOT NULL,
        cached_at  TEXT NOT NULL
      );

      ALTER TABLE goals ADD COLUMN auto_calories INTEGER NOT NULL DEFAULT 0;
    `);
    version = 5;
  }

  if (version < 6) {
    // Manual step entries — one row per day (a re-entry for the same date
    // updates that row rather than adding a second one; see
    // hooks/useSteps.ts). No HealthKit/native step-counter integration yet
    // (Expo Go can't host that; parked for a future phase) — this is
    // type-in-your-own-count, synced like meals/weights/workouts.
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS steps (
        id           TEXT PRIMARY KEY NOT NULL,
        date         TEXT NOT NULL,
        count        INTEGER NOT NULL,
        created_at   TEXT NOT NULL,
        updated_at   TEXT NOT NULL,
        deleted_at   TEXT,
        pending_sync INTEGER NOT NULL DEFAULT 1
      );
      CREATE UNIQUE INDEX IF NOT EXISTS idx_steps_date ON steps (date) WHERE deleted_at IS NULL;
      CREATE INDEX IF NOT EXISTS idx_steps_pending ON steps (pending_sync);
      CREATE INDEX IF NOT EXISTS idx_steps_updated ON steps (updated_at);
    `);
    version = 6;
  }

  // Future migrations append here, bumping `version` each step.

  if (version !== TARGET_USER_VERSION) {
    version = TARGET_USER_VERSION;
  }
  await db.execAsync(`PRAGMA user_version = ${version};`);
}
