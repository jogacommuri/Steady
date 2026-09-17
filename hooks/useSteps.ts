import { useCallback, useEffect, useState } from 'react';
import { useSQLiteContext } from 'expo-sqlite';

import { nowIso } from '@/lib/dates';
import { syncBus } from '@/lib/syncBus';
import type { Steps } from '@/lib/types';
import { uuid } from '@/lib/uuid';

interface StepsRow {
  id: string;
  date: string;
  count: number;
  created_at: string;
  updated_at: string;
}

const toSteps = (r: StepsRow): Steps => ({
  id: r.id,
  date: r.date,
  count: r.count,
  createdAt: r.created_at,
  updatedAt: r.updated_at,
});

/**
 * Manual daily step totals — one row per date. No HealthKit integration yet
 * (parked for a future phase); `setSteps` upserts by date so re-entering the
 * same day updates it instead of creating a duplicate.
 */
export function useSteps() {
  const db = useSQLiteContext();
  const [steps, setStepsList] = useState<Steps[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const rows = await db.getAllAsync<StepsRow>(
      `SELECT * FROM steps
       WHERE deleted_at IS NULL
       ORDER BY date DESC`
    );
    setStepsList(rows.map(toSteps));
    setLoading(false);
  }, [db]);

  useEffect(() => {
    refresh();
    return syncBus.onRemoteChange(refresh);
  }, [refresh]);

  const setSteps = useCallback(
    async (date: string, count: number) => {
      const ts = nowIso();
      const existing = await db.getFirstAsync<{ id: string }>(
        'SELECT id FROM steps WHERE date = ? AND deleted_at IS NULL',
        [date]
      );
      if (existing) {
        await db.runAsync(
          'UPDATE steps SET count = ?, updated_at = ?, pending_sync = 1 WHERE id = ?',
          [count, ts, existing.id]
        );
      } else {
        await db.runAsync(
          'INSERT INTO steps (id, date, count, created_at, updated_at) VALUES (?, ?, ?, ?, ?)',
          [uuid(), date, count, ts, ts]
        );
      }
      syncBus.emitLocalChange();
      await refresh();
    },
    [db, refresh]
  );

  const removeSteps = useCallback(
    async (id: string) => {
      const ts = nowIso();
      await db.runAsync(
        'UPDATE steps SET deleted_at = ?, updated_at = ?, pending_sync = 1 WHERE id = ?',
        [ts, ts, id]
      );
      syncBus.emitLocalChange();
      await refresh();
    },
    [db, refresh]
  );

  return { steps, loading, setSteps, removeSteps, refresh };
}
