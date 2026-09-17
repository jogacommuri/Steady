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
 * so the first launch has zero sign-in friction and still gets cloud backup.
 *
 * Anonymous auth mints a *distinct* user per device. To share data across a
 * phone + tablet, the account is made permanent by linking an email
 * (`linkEmail` on the first device) and joined on the other device
 * (`sendSignInCode` + `verifyCode`). See the Account screen (app/account.tsx).
 */
export async function ensureSession(): Promise<Session | null> {
  if (!supabase) return null;

  const { data } = await supabase.auth.getSession();
  if (data.session) return data.session;

  const { data: signIn, error } = await supabase.auth.signInAnonymously();
  if (error) throw error;
  return signIn.session;
}

/**
 * Snapshot of the signed-in account, surfaced to the UI via SyncProvider.
 * `isAnonymous` means device-only backup; once `email` is set and confirmed,
 * the same account can be joined from another device.
 */
export interface AccountInfo {
  configured: boolean;
  loading: boolean;
  userId: string | null;
  email: string | null;
  isAnonymous: boolean;
}

/**
 * Attach an email to the current (anonymous) account, keeping the same user id
 * so no data has to migrate. Supabase emails a confirmation code; pass it to
 * `verifyCode(email, code, 'link')`.
 *
 * Requires "Secure email change" to be configured in Supabase, and the email
 * templates to send a code (`{{ .Token }}`) rather than only a magic link — see
 * supabase/schema.sql.
 */
export async function linkEmail(email: string): Promise<void> {
  if (!supabase) throw new Error('Supabase is not configured');
  const { error } = await supabase.auth.updateUser({ email: email.trim() });
  if (error) throw error;
}

/** Email a sign-in code to join an existing account from another device. */
export async function sendSignInCode(email: string): Promise<void> {
  if (!supabase) throw new Error('Supabase is not configured');
  const { error } = await supabase.auth.signInWithOtp({
    email: email.trim(),
    // The account already exists (created when the first device linked email).
    options: { shouldCreateUser: false },
  });
  if (error) throw error;
}

/**
 * Verify an emailed code. `kind: 'link'` confirms an email just attached to
 * this account; `kind: 'signin'` completes joining an account from a new device.
 */
export async function verifyCode(
  email: string,
  token: string,
  kind: 'link' | 'signin'
): Promise<void> {
  if (!supabase) throw new Error('Supabase is not configured');
  const { error } = await supabase.auth.verifyOtp({
    email: email.trim(),
    token: token.trim(),
    type: kind === 'link' ? 'email_change' : 'email',
  });
  if (error) throw error;
}

export async function signOut(): Promise<void> {
  if (!supabase) return;
  await supabase.auth.signOut();
}
