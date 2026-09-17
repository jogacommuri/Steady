/**
 * Derived-data helpers shared by Today, Day detail, Weight and Progress —
 * ported from the Claude Design prototype's `renderVals()`. Pure functions
 * over the three trackers' rows plus a reference date, so screens can stay
 * thin.
 */

import { addDays, formatDay } from './dates';
import { MEAL_TYPES, type Meal, type MealType, type Weight, type WeightUnit, type Workout } from './types';
import { formatWeight } from './units';

const DAY_MS = 86_400_000;

export interface LogEntry {
  id: string;
  time: string;
  kind: string;
  text: string;
  /** Which token the kind label + accent bar use. */
  tone: 'accent' | 'ink' | 'muted';
}

function hasDay(
  date: string,
  meals: readonly Meal[],
  weights: readonly Weight[],
  workouts: readonly Workout[]
): boolean {
  return (
    meals.some((m) => m.date === date) ||
    workouts.some((w) => w.date === date) ||
    weights.some((w) => w.date === date)
  );
}

export { hasDay as hasActivity };

/** Consecutive days with any entry, walking backward from `refDate`. */
export function computeStreak(
  refDate: string,
  meals: readonly Meal[],
  weights: readonly Weight[],
  workouts: readonly Workout[]
): number {
  let streak = 0;
  for (let i = 0; i < 400; i += 1) {
    const d = addDays(refDate, -i);
    if (!hasDay(d, meals, weights, workouts)) break;
    streak += 1;
  }
  return streak;
}

/** The `count` days ending on (and including) `refDate`, oldest first. */
export function lastNDays(refDate: string, count: number): string[] {
  return Array.from({ length: count }, (_, i) => addDays(refDate, -(count - 1 - i)));
}

/** % of the last 35 days (incl. today) with at least one entry. */
export function computeConsistency(
  refDate: string,
  meals: readonly Meal[],
  weights: readonly Weight[],
  workouts: readonly Workout[]
): number {
  const days = lastNDays(refDate, 35);
  const logged = days.filter((d) => hasDay(d, meals, weights, workouts)).length;
  return Math.round((logged / days.length) * 100);
}

/** True if `date` falls in the `n`-day window ending `weeksAgo` full weeks back. */
function inWindow(date: string, refDate: string, n: number, weeksAgo = 0): boolean {
  const t = Date.parse(date);
  const end = Date.parse(refDate) - weeksAgo * 7 * DAY_MS;
  return t <= end && t > end - n * DAY_MS;
}

export function weekMinutes(
  workouts: readonly Workout[],
  refDate: string,
  weeksAgo = 0
): number {
  return workouts
    .filter((w) => inWindow(w.date, refDate, 7, weeksAgo))
    .reduce((sum, w) => sum + w.duration, 0);
}

export function weekWorkoutCount(
  workouts: readonly Workout[],
  refDate: string,
  weeksAgo = 0
): number {
  return workouts.filter((w) => inWindow(w.date, refDate, 7, weeksAgo)).length;
}

export interface WeekBar {
  minutes: number;
  label: string;
  isCurrent: boolean;
}

/** Minutes per week for the current week plus the 4 before it, oldest first. */
export function last5WeekTotals(workouts: readonly Workout[], refDate: string): WeekBar[] {
  return [4, 3, 2, 1, 0].map((weeksAgo) => ({
    minutes: weekMinutes(workouts, refDate, weeksAgo),
    label: weeksAgo === 0 ? 'This wk' : `${weeksAgo} wk ago`,
    isCurrent: weeksAgo === 0,
  }));
}

/** One day's activity, chronological — weight first (pinned 07:00), then meals, then workouts. */
export function buildDayLog(
  date: string,
  meals: readonly Meal[],
  weights: readonly Weight[],
  workouts: readonly Workout[],
  weightUnit: WeightUnit = 'kg'
): LogEntry[] {
  const rows: LogEntry[] = [
    ...weights
      .filter((w) => w.date === date)
      .map((w) => ({
        id: w.id,
        time: '07:00',
        kind: 'Weight',
        text: `${formatWeight(w.value, weightUnit)} ${weightUnit}${w.note ? ` · ${w.note}` : ''}`,
        tone: 'accent' as const,
      })),
    ...meals
      .filter((m) => m.date === date)
      .map((m) => ({
        id: m.id,
        time: m.time,
        kind: m.mealType,
        text: m.text,
        tone: 'ink' as const,
      })),
    ...workouts
      .filter((w) => w.date === date)
      .map((w) => ({
        id: w.id,
        time: '18:00',
        kind: w.workoutType,
        text: `${w.duration} min${w.text ? ` · ${w.text}` : ''}`,
        tone: 'muted' as const,
      })),
  ];
  return rows.sort((a, b) => (a.time < b.time ? -1 : a.time > b.time ? 1 : 0));
}

export interface WeightPoint {
  date: string;
  value: number;
  label: string;
}

/** Weigh-ins in the trailing `days` window (default 21), oldest first. */
export function weightTrend(
  weights: readonly Weight[],
  refDate: string,
  days = 21
): WeightPoint[] {
  return weights
    .filter((w) => inWindow(w.date, refDate, days))
    .slice()
    .sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0))
    .map((w) => ({ date: w.date, value: w.value, label: formatDay(w.date) }));
}

export type DayFullness = 'full' | 'partial' | 'none';

/** "Full" = 2+ meals and (a workout or a weigh-in); "partial" = something; "none" = nothing. */
export function dayFullness(
  date: string,
  meals: readonly Meal[],
  weights: readonly Weight[],
  workouts: readonly Workout[]
): DayFullness {
  const mealCount = meals.filter((m) => m.date === date).length;
  const other = workouts.some((w) => w.date === date) || weights.some((w) => w.date === date);
  if (mealCount >= 2 && other) return 'full';
  if (hasDay(date, meals, weights, workouts)) return 'partial';
  return 'none';
}

/** A day's total calories from meals that have an estimate; `hasData` is false if none of that day's meals do. */
export function dailyCalorieTotals(
  meals: readonly Meal[],
  days: readonly string[]
): { date: string; total: number; hasData: boolean }[] {
  return days.map((date) => {
    const known = meals.filter((m) => m.date === date && m.calories != null);
    return {
      date,
      total: known.reduce((sum, m) => sum + (m.calories ?? 0), 0),
      hasData: known.length > 0,
    };
  });
}

/**
 * Average daily calorie total across `days`, counting only days that have at
 * least one meal with a known calorie value — a day with zero logged/known
 * calories is "no data", not "0 kcal", so it doesn't drag the average down.
 * `null` if nothing in the window has an estimate yet.
 */
export function averageDailyCalories(meals: readonly Meal[], days: readonly string[]): number | null {
  const known = dailyCalorieTotals(meals, days).filter((d) => d.hasData);
  if (known.length === 0) return null;
  return Math.round(known.reduce((sum, d) => sum + d.total, 0) / known.length);
}

/** Average calories per entry, broken down by meal type, over `days`. `null` per type with no estimates yet. */
export function averageCaloriesByMealType(
  meals: readonly Meal[],
  days: readonly string[]
): Record<MealType, number | null> {
  const daySet = new Set(days);
  const result = {} as Record<MealType, number | null>;
  for (const type of MEAL_TYPES) {
    const known = meals.filter((m) => m.mealType === type && m.calories != null && daySet.has(m.date));
    result[type] = known.length ? Math.round(known.reduce((sum, m) => sum + (m.calories ?? 0), 0) / known.length) : null;
  }
  return result;
}
