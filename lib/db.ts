import type { SQLiteDatabase } from 'expo-sqlite';

/**
 * SQLite bootstrap. The schema mirrors the three planned Supabase tables and
 * keeps the columns the sync layer needs (id / created_at / updated_at).
 *
 * `migrate` is wired into <SQLiteProvider onInit={migrate}> in app/_layout.tsx
 * so it runs once on launch, before any screen queries the database.
 */

export const DATABASE_NAME = 'steady.db';

const TARGET_USER_VERSION = 2;

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

  // Future migrations append here, bumping `version` each step.

  if (version !== TARGET_USER_VERSION) {
    version = TARGET_USER_VERSION;
  }
  await db.execAsync(`PRAGMA user_version = ${version};`);
}
