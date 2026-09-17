/**
 * Row shapes for the three trackers. These mirror the Supabase tables planned
 * for Phase 3 — every row carries a UUID plus created_at / updated_at so the
 * last-write-wins sync layer has what it needs.
 *
 * Timestamps are ISO-8601 strings (UTC). `date` is a calendar day, `YYYY-MM-DD`.
 */

export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';

export interface Meal {
  id: string;
  date: string; // YYYY-MM-DD
  mealType: MealType;
  time: string; // HH:MM
  text: string;
  /** Null = not estimated (yet) — never treat as 0 in an average. */
  calories: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface Weight {
  id: string;
  date: string; // YYYY-MM-DD
  value: number; // always kg — see lib/units.ts for display conversion
  note: string;
  createdAt: string;
  updatedAt: string;
}

export type WeightUnit = 'kg' | 'lb';

export type WorkoutType =
  | 'cardio'
  | 'strength'
  | 'mobility'
  | 'walk'
  | 'other';

export interface Workout {
  id: string;
  date: string; // YYYY-MM-DD
  workoutType: WorkoutType;
  duration: number; // minutes
  text: string;
  createdAt: string;
  updatedAt: string;
}

export const MEAL_TYPES: MealType[] = [
  'breakfast',
  'lunch',
  'dinner',
  'snack',
];

export const WORKOUT_TYPES: WorkoutType[] = [
  'cardio',
  'strength',
  'mobility',
  'walk',
  'other',
];

/**
 * Targets + display preferences, edited on the Goals screen. Device-local
 * (see `lib/db.ts` — no Supabase table yet), a single row rather than a
 * synced collection. `targetWeight` is always kg, regardless of `weightUnit`.
 */
export interface Goals {
  targetWeight: number; // kg
  workoutsPerWeek: number;
  minutesPerWeek: number;
  mealsPerDay: number;
  weightUnit: WeightUnit;
  /** Opt-in: estimate a meal's calories via the nutrition API when none was entered manually. */
  autoCalories: boolean;
}
