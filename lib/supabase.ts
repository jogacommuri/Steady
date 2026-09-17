import 'react-native-url-polyfill/auto';

import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  createClient,
  type Session,
  type SupabaseClient,
} from '@supabase/supabase-js';

/**
 * Supabase client for Phase 3 sync.
 *
 * Configuration comes from EXPO_PUBLIC_ env vars (see .env.example). When they
 * are absent the client is `null` and `isSupabaseConfigured` is false — the app
 * then runs exactly as it did in Phase 2 (local-only, no network), so the
 * scaffold is always runnable without a backend.
 */

const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(url && anonKey);

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(url as string, anonKey as string, {
      auth: {
        storage: AsyncStorage,
        autoRefreshToken: true,
        persistSession: true,
        // React Native has no URL-based auth callback.
        detectSessionInUrl: false,
      },
    })
  : null;

/**
 * Ensure we have a session before syncing. Defaults to anonymous (device) auth,
 * matching the v1 plan — good enough for single-device cloud backup + realtime.
 *
 * NOTE: anonymous auth mints a *distinct* user per device, so two devices will
 * NOT see each other's data. To sync a phone + tablet, sign both into the same
 * account with `signInWithEmail` (magic link) instead.
 */
export async function ensureSession(): Promise<Session | null> {
  if (!supabase) return null;

  const { data } = await supabase.auth.getSession();
  if (data.session) return data.session;

  const { data: signIn, error } = await supabase.auth.signInAnonymously();
  if (error) throw error;
  return signIn.session;
}

/** Send a magic-link sign-in email — the path to true cross-device sync. */
export async function signInWithEmail(email: string): Promise<void> {
  if (!supabase) throw new Error('Supabase is not configured');
  const { error } = await supabase.auth.signInWithOtp({ email });
  if (error) throw error;
}

export async function signOut(): Promise<void> {
  if (!supabase) return;
  await supabase.auth.signOut();
}
