/**
 * Best-effort meal identification from a photo. Calls a Supabase Edge
 * Function (supabase/functions/identify-meal-photo), which proxies to
 * OpenAI's vision endpoint — the API key lives server-side as a Supabase
 * secret and never ships in the app bundle. This is opt-in per use: it only
 * runs when the person taps the camera/photo button on the meal form, never
 * in the background.
 *
 * This never throws — callers get `{ text: null, calories: null, reason }`
 * on any failure (Supabase not configured, function not deployed, network
 * error, no food recognized), so a misconfigured setup is visible in a
 * toast without console access, same pattern as lib/nutrition.ts.
 */

import { isSupabaseConfigured, supabase } from './supabase';

export const isMealPhotoApiConfigured = isSupabaseConfigured;

export interface MealPhotoResult {
  text: string | null;
  calories: number | null;
  /** Set whenever `text` is null — human-readable, safe to show in a toast. */
  reason?: string;
}

interface IdentifyMealPhotoResponse {
  text?: string | null;
  calories?: number | null;
  reason?: string;
}

export async function identifyMealPhoto(base64: string, mimeType = 'image/jpeg'): Promise<MealPhotoResult> {
  if (!supabase) return { text: null, calories: null, reason: 'Supabase is not configured' };
  if (!base64) return { text: null, calories: null, reason: 'no image captured' };

  try {
    const { data, error } = await supabase.functions.invoke<IdentifyMealPhotoResponse>(
      'identify-meal-photo',
      { body: { image: base64, mimeType } }
    );
    if (error) {
      console.warn('[mealPhoto] edge function error:', error.message);
      return { text: null, calories: null, reason: error.message };
    }
    const text = typeof data?.text === 'string' && data.text.trim() ? data.text.trim() : null;
    if (text == null) {
      const reason = data?.reason ?? 'no food recognized in photo';
      console.warn('[mealPhoto] no result:', reason);
      return { text: null, calories: null, reason };
    }
    const calories = typeof data?.calories === 'number' ? data.calories : null;
    console.info(`[mealPhoto] identified "${text}": ${calories ?? 'no'} kcal`);
    return { text, calories };
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    console.warn('[mealPhoto] request failed:', message);
    return { text: null, calories: null, reason: `network error: ${message}` };
  }
}
