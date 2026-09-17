import { useCallback, useEffect, useState } from 'react';
import { useSQLiteContext } from 'expo-sqlite';

import { nowIso } from '@/lib/dates';
import { syncBus } from '@/lib/syncBus';
import type { Weight } from '@/lib/types';
import { uuid } from '@/lib/uuid';

interface WeightRow {
  id: string;
  date: string;
  value: number;
  note: string;
  created_at: string;
  updated_at: string;
}

const toWeight = (r: WeightRow): Weight => ({
  id: r.id,
  date: r.date,
  value: r.value,
  note: r.note,
  createdAt: r.created_at,
  updatedAt: r.updated_at,
});

export interface NewWeight {
  date: string;
  value: number;
  note: string;
}

export function useWeights() {
  const db = useSQLiteContext();
  const [weights, setWeights] = useState<Weight[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const rows = await db.getAllAsync<WeightRow>(
      `SELECT * FROM weights
       WHERE deleted_at IS NULL
       ORDER BY date DESC, created_at DESC`
    );
    setWeights(rows.map(toWeight));
    setLoading(false);
  }, [db]);

  useEffect(() => {
    refresh();
    return syncBus.onRemoteChange(refresh);
  }, [refresh]);

  const addWeight = useCallback(
    async (input: NewWeight) => {
      const ts = nowIso();
      await db.runAsync(
        `INSERT INTO weights (id, date, value, note, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [uuid(), input.date, input.value, input.note.trim(), ts, ts]
      );
      syncBus.emitLocalChange();
      await refresh();
    },
    [db, refresh]
  );

  const removeWeight = useCallback(
    async (id: string) => {
      const ts = nowIso();
      await db.runAsync(
        'UPDATE weights SET deleted_at = ?, updated_at = ?, pending_sync = 1 WHERE id = ?',
        [ts, ts, id]
      );
      syncBus.emitLocalChange();
      await refresh();
    },
    [db, refresh]
  );

  /** Signed change from the previous (older) entry, newest first. */
  const latestDelta = useCallback((): number | null => {
    if (weights.length < 2) return null;
    return weights[0].value - weights[1].value;
  }, [weights]);

  return { weights, loading, addWeight, removeWeight, refresh, latestDelta };
}
