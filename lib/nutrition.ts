/**
 * Best-effort calorie estimation for a free-text meal description. This
 * calls a Supabase Edge Function (supabase/functions/estimate-calories),
 * which proxies to Claude — the Anthropic API key lives server-side as a
 * Supabase secret and never ships in the app bundle. Opt-in: only called
 * when the user has turned on "Estimate calories automatically" on the
 * Goals screen (or run the Meals tab's manual backfill).
 *
 * This never throws — callers get `{ calories: null, reason }` on any
 * failure (Supabase not configured, function not deployed, network error,
 * empty result), which `enrichMealCalories` treats exactly like "not
 * estimated yet" (same as a manually-skipped entry) but the backfill flow
 * surfaces `reason` in its toast, so a misconfigured setup is visible
 * without console access.
 */

import { isSupabaseConfigured, supabase } from './supabase';

export const isNutritionApiConfigured = isSupabaseConfigured;

export interface CalorieEstimate {
  calories: number | null;
  /** Set whenever `calories` is null — human-readable, safe to show in a toast. */
  reason?: string;
}

interface EstimateCaloriesResponse {
  calories?: number | null;
  reason?: string;
}

export async function estimateCalories(text: string): Promise<CalorieEstimate> {
  const query = text.trim();
  if (!supabase) return { calories: null, reason: 'Supabase is not configured' };
  if (!query) return { calories: null, reason: 'empty meal text' };

  try {
    const { data, error } = await supabase.functions.invoke<EstimateCaloriesResponse>(
      'estimate-calories',
      { body: { text: query } }
    );
    if (error) {
      console.warn(`[nutrition] edge function error for "${query}":`, error.message);
      return { calories: null, reason: error.message };
    }
    const calories = typeof data?.calories === 'number' ? data.calories : null;
    if (calories == null) {
      const reason = data?.reason ?? 'no estimate returned';
      console.warn(`[nutrition] no estimate for "${query}": ${reason}`);
      return { calories: null, reason };
    }
    console.info(`[nutrition] estimated "${query}": ${calories} kcal`);
    return { calories };
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    console.warn('[nutrition] request failed:', message);
    return { calories: null, reason: `network error: ${message}` };
  }
}

/** Cache key — casing/whitespace shouldn't cause a distinct (and billable) API lookup. */
export function normalizeMealText(text: string): string {
  return text.trim().toLowerCase().replace(/\s+/g, ' ');
}
