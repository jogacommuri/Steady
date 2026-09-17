import { useCallback, useEffect, useState } from 'react';
import { useSQLiteContext } from 'expo-sqlite';

import { nowIso } from '@/lib/dates';
import { syncBus } from '@/lib/syncBus';
import type { Meal, MealType } from '@/lib/types';
import { uuid } from '@/lib/uuid';

interface MealRow {
  id: string;
  date: string;
  meal_type: string;
  time: string;
  text: string;
  created_at: string;
  updated_at: string;
}

const toMeal = (r: MealRow): Meal => ({
  id: r.id,
  date: r.date,
  mealType: r.meal_type as MealType,
  time: r.time,
  text: r.text,
  createdAt: r.created_at,
  updatedAt: r.updated_at,
});

export interface NewMeal {
  date: string;
  mealType: MealType;
  time: string;
  text: string;
}

/**
 * Local-first meals data. Reads/writes hit SQLite directly, then refresh the
 * in-memory list. When Phase 3 sync arrives, writes here will also enqueue for
 * push — the screen API stays the same.
 */
export function useMeals() {
  const db = useSQLiteContext();
  const [meals, setMeals] = useState<Meal[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const rows = await db.getAllAsync<MealRow>(
      `SELECT * FROM meals
       WHERE deleted_at IS NULL
       ORDER BY date DESC, time DESC, created_at DESC`
    );
    setMeals(rows.map(toMeal));
    setLoading(false);
  }, [db]);

  useEffect(() => {
    refresh();
    // Re-query when the sync engine applies remote changes.
    return syncBus.onRemoteChange(refresh);
  }, [refresh]);

  const addMeal = useCallback(
    async (input: NewMeal) => {
      const ts = nowIso();
      await db.runAsync(
        `INSERT INTO meals (id, date, meal_type, time, text, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [uuid(), input.date, input.mealType, input.time, input.text.trim(), ts, ts]
      );
      syncBus.emitLocalChange();
      await refresh();
    },
    [db, refresh]
  );

  const removeMeal = useCallback(
    async (id: string) => {
      // Soft delete: tombstone so the deletion can sync to other devices.
      const ts = nowIso();
      await db.runAsync(
        'UPDATE meals SET deleted_at = ?, updated_at = ?, pending_sync = 1 WHERE id = ?',
        [ts, ts, id]
      );
      syncBus.emitLocalChange();
      await refresh();
    },
    [db, refresh]
  );

  return { meals, loading, addMeal, removeMeal, refresh };
}
