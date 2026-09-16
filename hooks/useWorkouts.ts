import { useCallback, useEffect, useState } from 'react';
import { useSQLiteContext } from 'expo-sqlite';

import { nowIso } from '@/lib/dates';
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
      'SELECT * FROM workouts ORDER BY date DESC, created_at DESC'
    );
    setWorkouts(rows.map(toWorkout));
    setLoading(false);
  }, [db]);

  useEffect(() => {
    refresh();
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
      await refresh();
    },
    [db, refresh]
  );

  const removeWorkout = useCallback(
    async (id: string) => {
      await db.runAsync('DELETE FROM workouts WHERE id = ?', [id]);
      await refresh();
    },
    [db, refresh]
  );

  return { workouts, loading, addWorkout, removeWorkout, refresh };
}
