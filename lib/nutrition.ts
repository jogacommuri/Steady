/**
 * Best-effort calorie estimation for a free-text meal description, via API
 * Ninjas' natural-language Nutrition endpoint (https://api-ninjas.com/api/nutrition
 * — the successor to CalorieNinjas). Opt-in: only called when both a key is
 * configured (EXPO_PUBLIC_NUTRITION_API_KEY) and the user has turned on
 * "Estimate calories automatically" on the Goals screen.
 *
 * This never throws — callers get `null` on any failure (missing config, bad
 * text, network error, empty result) and treat that exactly like "not
 * estimated yet", same as a manually-skipped entry.
 */

const API_KEY = process.env.EXPO_PUBLIC_NUTRITION_API_KEY;
const ENDPOINT = 'https://api.api-ninjas.com/v1/nutrition';

export const isNutritionApiConfigured = Boolean(API_KEY);

interface NutritionItem {
  calories?: number;
}

export async function estimateCalories(text: string): Promise<number | null> {
  const query = text.trim();
  if (!API_KEY || !query) return null;

  try {
    const res = await fetch(`${ENDPOINT}?query=${encodeURIComponent(query)}`, {
      headers: { 'X-Api-Key': API_KEY },
    });
    if (!res.ok) return null;

    const items = (await res.json()) as NutritionItem[];
    if (!Array.isArray(items) || items.length === 0) return null;

    const total = items.reduce((sum, item) => sum + (typeof item.calories === 'number' ? item.calories : 0), 0);
    return total > 0 ? Math.round(total) : null;
  } catch {
    return null;
  }
}

/** Cache key — casing/whitespace shouldn't cause a distinct (and billable) API lookup. */
export function normalizeMealText(text: string): string {
  return text.trim().toLowerCase().replace(/\s+/g, ' ');
}
