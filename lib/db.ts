import type { SQLiteDatabase } from 'expo-sqlite';

/**
 * SQLite bootstrap. The schema mirrors the three planned Supabase tables and
 * keeps the columns the sync layer needs (id / created_at / updated_at).
 *
 * `migrate` is wired into <SQLiteProvider onInit={migrate}> in app/_layout.tsx
 * so it runs once on launch, before any screen queries the database.
 */

export const DATABASE_NAME = 'steady.db';

const TARGET_USER_VERSION = 1;

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

  // Future migrations append here, bumping `version` each step, e.g. a
  // `sync_queue` table when Phase 3 lands.

  if (version !== TARGET_USER_VERSION) {
    version = TARGET_USER_VERSION;
  }
  await db.execAsync(`PRAGMA user_version = ${version};`);
}
