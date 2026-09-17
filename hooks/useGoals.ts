import { useCallback, useEffect, useState } from 'react';
import { useSQLiteContext } from 'expo-sqlite';

import { nowIso } from '@/lib/dates';
import type { Goals, WeightUnit } from '@/lib/types';

interface GoalsRow {
  target_weight: number;
  workouts_per_week: number;
  minutes_per_week: number;
  meals_per_day: number;
  weight_unit: WeightUnit;
}

const DEFAULT_GOALS: Goals = {
  targetWeight: 74,
  workoutsPerWeek: 4,
  minutesPerWeek: 150,
  mealsPerDay: 3,
  weightUnit: 'kg',
};

const toGoals = (r: GoalsRow): Goals => ({
  targetWeight: r.target_weight,
  workoutsPerWeek: r.workouts_per_week,
  minutesPerWeek: r.minutes_per_week,
  mealsPerDay: r.meals_per_day,
  weightUnit: r.weight_unit === 'lb' ? 'lb' : 'kg',
});

/** Device-local targets + display preferences — see the `goals` migration in `lib/db.ts`. */
export function useGoals() {
  const db = useSQLiteContext();
  const [goals, setGoals] = useState<Goals>(DEFAULT_GOALS);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const row = await db.getFirstAsync<GoalsRow>(
      'SELECT target_weight, workouts_per_week, minutes_per_week, meals_per_day, weight_unit FROM goals WHERE id = ?',
      ['local']
    );
    if (row) setGoals(toGoals(row));
    setLoading(false);
  }, [db]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const saveGoals = useCallback(
    async (next: Goals) => {
      await db.runAsync(
        `UPDATE goals
         SET target_weight = ?, workouts_per_week = ?, minutes_per_week = ?, meals_per_day = ?, weight_unit = ?, updated_at = ?
         WHERE id = 'local'`,
        [next.targetWeight, next.workoutsPerWeek, next.minutesPerWeek, next.mealsPerDay, next.weightUnit, nowIso()]
      );
      setGoals(next);
    },
    [db]
  );

  return { goals, loading, saveGoals };
}
