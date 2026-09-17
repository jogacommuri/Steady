import type { SQLiteDatabase } from 'expo-sqlite';

import { supabase } from './supabase';

/**
 * Offline-first sync engine (Phase 3).
 *
 * Strategy: last-write-wins on `updated_at`.
 *  - push: every locally-changed row (`pending_sync = 1`) is upserted to
 *    Supabase, then its pending flag is cleared.
 *  - pull: rows changed remotely since our per-table cursor are fetched and
 *    applied locally, keeping whichever side has the newer `updated_at`.
 *  - realtime: a Postgres-changes subscription applies other devices' writes
 *    as they happen.
 *
 * Deletes are tombstones (`deleted_at`), so a delete on one device propagates
 * like any other update. Timestamps are normalised to ISO-Z on the way in so
 * local comparisons and ordering stay consistent regardless of how Postgres
 * formats them.
 */

type Row = Record<string, unknown>;

interface TableSpec {
  name: string;
  /** Columns synced in both directions (pending_sync stays local-only). */
  columns: readonly string[];
}

const TIMESTAMP_COLUMNS = ['created_at', 'updated_at', 'deleted_at'];
const PAGE = 500;

export const SYNC_TABLES: readonly TableSpec[] = [
  {
    name: 'meals',
    columns: ['id', 'date', 'meal_type', 'time', 'text', 'calories', 'created_at', 'updated_at', 'deleted_at'],
  },
  {
    name: 'weights',
    columns: ['id', 'date', 'value', 'note', 'created_at', 'updated_at', 'deleted_at'],
  },
  {
    name: 'workouts',
    columns: ['id', 'date', 'workout_type', 'duration', 'text', 'created_at', 'updated_at', 'deleted_at'],
  },
  {
    name: 'steps',
    columns: ['id', 'date', 'count', 'created_at', 'updated_at', 'deleted_at'],
  },
];

function toIsoOrNull(value: unknown): string | null {
  if (value == null) return null;
  const t = Date.parse(String(value));
  return Number.isNaN(t) ? null : new Date(t).toISOString();
}

function newer(remote: unknown, local: unknown): boolean {
  const r = Date.parse(String(remote));
  const l = Date.parse(String(local));
  if (Number.isNaN(r)) return false;
  if (Number.isNaN(l)) return true;
  return r > l;
}

export class SyncEngine {
  private userId: string | null = null;

  constructor(private readonly db: SQLiteDatabase) {}

  get enabled(): boolean {
    return Boolean(supabase && this.userId);
  }

  setUser(userId: string | null) {
    this.userId = userId;
  }

  /**
   * Called when the signed-in account changes (e.g. a second device joins an
   * existing account). Clears pull cursors and re-flags every local row for
   * push, so we pull the new account's full history and merge this device's
   * local entries into it.
   */
  async resetForNewUser(): Promise<void> {
    await this.db.runAsync("DELETE FROM sync_meta WHERE key LIKE 'cursor:%'");
    for (const t of SYNC_TABLES) {
      await this.db.runAsync(`UPDATE ${t.name} SET pending_sync = 1`);
    }
  }

  /** Push local changes, then pull remote ones. Returns rows applied locally. */
  async syncAll(): Promise<number> {
    if (!this.enabled) return 0;
    for (const t of SYNC_TABLES) {
      await this.pushTable(t);
    }
    let applied = 0;
    for (const t of SYNC_TABLES) {
      applied += await this.pullTable(t);
    }
    return applied;
  }

  private async pushTable(t: TableSpec): Promise<void> {
    if (!supabase || !this.userId) return;
    const cols = t.columns.join(', ');

    // Loop so a large backlog drains in PAGE-sized batches.
    for (;;) {
      const rows = await this.db.getAllAsync<Row>(
        `SELECT ${cols} FROM ${t.name} WHERE pending_sync = 1 LIMIT ${PAGE}`
      );
      if (rows.length === 0) return;

      const payload = rows.map((r) => ({ ...r, user_id: this.userId }));
      const { error } = await supabase
        .from(t.name)
        .upsert(payload, { onConflict: 'id' });
      if (error) throw error;

      // Clear the flag only for rows unchanged since we read them, so an edit
      // made mid-push isn't silently marked as synced.
      for (const r of rows) {
        await this.db.runAsync(
          `UPDATE ${t.name} SET pending_sync = 0 WHERE id = ? AND updated_at = ?`,
          [r.id as string, r.updated_at as string]
        );
      }

      if (rows.length < PAGE) return;
    }
  }

  private async pullTable(t: TableSpec): Promise<number> {
    if (!supabase || !this.userId) return 0;
    let cursor = await this.getCursor(t.name);
    let applied = 0;

    for (;;) {
      let query = supabase
        .from(t.name)
        .select(t.columns.join(','))
        .order('updated_at', { ascending: true })
        .limit(PAGE);
      if (cursor) query = query.gt('updated_at', cursor);

      const { data, error } = await query;
      if (error) throw error;
      const rows = (data ?? []) as unknown as Row[];
      if (rows.length === 0) break;

      for (const row of rows) {
        if (await this.applyRemoteRow(t, row)) applied += 1;
        cursor = String(row.updated_at);
      }
      // rows is non-empty here, so cursor was just assigned a string.
      await this.setCursor(t.name, cursor as string);

      if (rows.length < PAGE) break;
    }
    return applied;
  }

  /** Apply one remote row locally if it wins the last-write-wins comparison. */
  async applyRemoteRow(t: TableSpec, row: Row): Promise<boolean> {
    if (!row.id) return false;
    const local = await this.db.getFirstAsync<{ updated_at: string }>(
      `SELECT updated_at FROM ${t.name} WHERE id = ?`,
      [row.id as string]
    );
    if (local && !newer(row.updated_at, local.updated_at)) return false;

    const values = t.columns.map((c) =>
      TIMESTAMP_COLUMNS.includes(c) ? toIsoOrNull(row[c]) : (row[c] ?? null)
    );
    const placeholders = t.columns.map(() => '?').join(', ');
    await this.db.runAsync(
      `INSERT OR REPLACE INTO ${t.name} (${t.columns.join(', ')}, pending_sync)
       VALUES (${placeholders}, 0)`,
      values as (string | number | null)[]
    );
    return true;
  }

  /** Subscribe to other devices' writes; `onApplied` fires after each local change. */
  subscribeRealtime(onApplied: () => void): () => void {
    if (!supabase || !this.userId) return () => {};
    const client = supabase;
    const channel = client.channel('steady-sync');

    // The postgres_changes `.on` overloads are awkward to satisfy under strict
    // mode; a narrow local shape keeps the handler typed without fighting them.
    const on = channel.on.bind(channel) as unknown as (
      type: 'postgres_changes',
      filter: Record<string, unknown>,
      cb: (payload: { new?: Row }) => void
    ) => typeof channel;

    for (const t of SYNC_TABLES) {
      on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: t.name,
          filter: `user_id=eq.${this.userId}`,
        },
        (payload) => {
          const row = payload.new;
          if (!row?.id) return;
          void (async () => {
            try {
              if (await this.applyRemoteRow(t, row)) onApplied();
            } catch {
              // Realtime is best-effort; the next full sync reconciles.
            }
          })();
        }
      );
    }

    channel.subscribe();
    return () => {
      client.removeChannel(channel);
    };
  }

  private async getCursor(table: string): Promise<string | null> {
    const row = await this.db.getFirstAsync<{ value: string }>(
      'SELECT value FROM sync_meta WHERE key = ?',
      [`cursor:${table}`]
    );
    return row?.value ?? null;
  }

  private async setCursor(table: string, value: string): Promise<void> {
    await this.db.runAsync(
      `INSERT INTO sync_meta (key, value) VALUES (?, ?)
       ON CONFLICT(key) DO UPDATE SET value = excluded.value`,
      [`cursor:${table}`, value]
    );
  }
}
