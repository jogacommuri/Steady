import type { SQLiteDatabase } from 'expo-sqlite';

import { nowIso } from './dates';
import { estimateCalories, normalizeMealText } from './nutrition';
import { syncBus } from './syncBus';

export interface EnrichResult {
  filled: boolean;
  /** Set when `filled` is false — human-readable, safe to show in a toast. */
  reason?: string;
}

/**
 * Background, best-effort: fills in a meal's `calories` after it's already
 * saved (never blocks the save itself). Checks the local cache first, then
 * falls back to the nutrition API; a miss on both just leaves `calories`
 * NULL — same as if the user had skipped it.
 *
 * Reuses `syncBus`'s remote-change channel to tell mounted screens to
 * re-query, since this write happens outside their normal call path (the
 * same signal `useMeals`/etc. already listen for after a sync pull).
 */
export async function enrichMealCalories(db: SQLiteDatabase, mealId: string, text: string): Promise<EnrichResult> {
  const key = normalizeMealText(text);
  if (!key) return { filled: false, reason: 'empty meal text' };

  const cached = await db.getFirstAsync<{ calories: number }>(
    'SELECT calories FROM calorie_cache WHERE text_key = ?',
    [key]
  );

  let calories = cached?.calories ?? null;
  let reason: string | undefined;
  if (calories != null) {
    console.info(`[nutrition] cache hit for "${text}": ${calories} kcal`);
  } else {
    const estimate = await estimateCalories(text);
    calories = estimate.calories;
    reason = estimate.reason;
    if (calories != null) {
      console.info(`[nutrition] estimated "${text}": ${calories} kcal`);
      await db.runAsync(
        'INSERT OR REPLACE INTO calorie_cache (text_key, calories, cached_at) VALUES (?, ?, ?)',
        [key, calories, nowIso()]
      );
    }
  }
  if (calories == null) return { filled: false, reason };

  const result = await db.runAsync(
    'UPDATE meals SET calories = ?, updated_at = ?, pending_sync = 1 WHERE id = ? AND deleted_at IS NULL',
    [calories, nowIso(), mealId]
  );
  if (result.changes === 0) return { filled: false, reason: 'meal was deleted' };

  syncBus.emitLocalChange();
  syncBus.emitRemoteChange();
  return { filled: true };
}
