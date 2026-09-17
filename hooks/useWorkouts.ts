import { useCallback, useEffect, useState } from 'react';
import { useSQLiteContext } from 'expo-sqlite';

import { nowIso } from '@/lib/dates';
import { syncBus } from '@/lib/syncBus';
import type { Workout, WorkoutType } from '@/lib/types';
import { uuid } from '@/lib/uuid';

interface WorkoutRow {
  id: string;
  date: string;
  workout_type: string;
  duration: number;
  text: string;
  created_at: string;
  updated_at: string;
}

const toWorkout = (r: WorkoutRow): Workout => ({
  id: r.id,
  date: r.date,
  workoutType: r.workout_type as WorkoutType,
  duration: r.duration,
  text: r.text,
  createdAt: r.created_at,
  updatedAt: r.updated_at,
});

export interface NewWorkout {
  date: string;
  workoutType: WorkoutType;
  duration: number;
  text: string;
}

export function useWorkouts() {
  const db = useSQLiteContext();
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const rows = await db.getAllAsync<WorkoutRow>(
      `SELECT * FROM workouts
       WHERE deleted_at IS NULL
       ORDER BY date DESC, created_at DESC`
    );
    setWorkouts(rows.map(toWorkout));
    setLoading(false);
  }, [db]);

  useEffect(() => {
    refresh();
    return syncBus.onRemoteChange(refresh);
  }, [refresh]);

  const addWorkout = useCallback(
    async (input: NewWorkout) => {
      const ts = nowIso();
      await db.runAsync(
        `INSERT INTO workouts (id, date, workout_type, duration, text, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          uuid(),
          input.date,
          input.workoutType,
          input.duration,
          input.text.trim(),
          ts,
          ts,
        ]
      );
      syncBus.emitLocalChange();
      await refresh();
    },
    [db, refresh]
  );

  const removeWorkout = useCallback(
    async (id: string) => {
      const ts = nowIso();
      await db.runAsync(
        'UPDATE workouts SET deleted_at = ?, updated_at = ?, pending_sync = 1 WHERE id = ?',
        [ts, ts, id]
      );
      syncBus.emitLocalChange();
      await refresh();
    },
    [db, refresh]
  );

  return { workouts, loading, addWorkout, removeWorkout, refresh };
}
