/**
 * Best-effort calorie estimation for a free-text meal description, via API
 * Ninjas' natural-language Nutrition endpoint (https://api-ninjas.com/api/nutrition
 * — the successor to CalorieNinjas). Opt-in: only called when both a key is
 * configured (EXPO_PUBLIC_NUTRITION_API_KEY) and the user has turned on
 * "Estimate calories automatically" on the Goals screen (or run the Meals
 * tab's manual backfill).
 *
 * This never throws — callers get `{ calories: null, reason }` on any
 * failure (missing config, bad text, network error, empty result), which
 * `enrichMealCalories` treats exactly like "not estimated yet" (same as a
 * manually-skipped entry) but the backfill flow surfaces `reason` in its
 * toast, so a bad key or a rate limit is visible without console access.
 */

const API_KEY = process.env.EXPO_PUBLIC_NUTRITION_API_KEY;
const ENDPOINT = 'https://api.api-ninjas.com/v1/nutrition';

export const isNutritionApiConfigured = Boolean(API_KEY);

interface NutritionItem {
  calories?: number;
}

export interface CalorieEstimate {
  calories: number | null;
  /** Set whenever `calories` is null — human-readable, safe to show in a toast. */
  reason?: string;
}

export async function estimateCalories(text: string): Promise<CalorieEstimate> {
  const query = text.trim();
  if (!API_KEY) return { calories: null, reason: 'no API key configured' };
  if (!query) return { calories: null, reason: 'empty meal text' };

  try {
    const res = await fetch(`${ENDPOINT}?query=${encodeURIComponent(query)}`, {
      headers: { 'X-Api-Key': API_KEY },
    });
    if (!res.ok) {
      const reason = `HTTP ${res.status} ${res.statusText}`;
      console.warn(`[nutrition] ${reason} for query: "${query}"`);
      return { calories: null, reason };
    }

    const items = (await res.json()) as NutritionItem[];
    if (!Array.isArray(items) || items.length === 0) {
      console.warn(`[nutrition] no items returned for query: "${query}"`);
      return { calories: null, reason: 'no items returned' };
    }

    const total = items.reduce((sum, item) => sum + (typeof item.calories === 'number' ? item.calories : 0), 0);
    if (total <= 0) {
      console.warn(`[nutrition] items returned but no calorie data for query: "${query}"`, items);
      return { calories: null, reason: 'no calorie data in matched items' };
    }
    return { calories: Math.round(total) };
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
