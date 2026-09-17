import type { SQLiteDatabase } from 'expo-sqlite';

import { nowIso } from './dates';
import { estimateCalories, normalizeMealText } from './nutrition';
import { syncBus } from './syncBus';

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
export async function enrichMealCalories(db: SQLiteDatabase, mealId: string, text: string): Promise<void> {
  const key = normalizeMealText(text);
  if (!key) return;

  const cached = await db.getFirstAsync<{ calories: number }>(
    'SELECT calories FROM calorie_cache WHERE text_key = ?',
    [key]
  );

  let calories = cached?.calories ?? null;
  if (calories != null) {
    console.info(`[nutrition] cache hit for "${text}": ${calories} kcal`);
  } else {
    calories = await estimateCalories(text);
    if (calories != null) {
      console.info(`[nutrition] estimated "${text}": ${calories} kcal`);
      await db.runAsync(
        'INSERT OR REPLACE INTO calorie_cache (text_key, calories, cached_at) VALUES (?, ?, ?)',
        [key, calories, nowIso()]
      );
    }
  }
  if (calories == null) return;

  const result = await db.runAsync(
    'UPDATE meals SET calories = ?, updated_at = ?, pending_sync = 1 WHERE id = ? AND deleted_at IS NULL',
    [calories, nowIso(), mealId]
  );
  if (result.changes === 0) return; // meal was deleted before the estimate came back

  syncBus.emitLocalChange();
  syncBus.emitRemoteChange();
}
