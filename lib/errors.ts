/**
 * Extracts a human-readable message from whatever a catch block sees. Real
 * `Error` instances aren't the only shape that shows up here — notably,
 * supabase-js's postgrest client returns a plain `{ message, details, hint,
 * code }` object (not a `PostgrestError` instance) when the underlying
 * `fetch` itself fails — network down, timeout, DNS — rather than the
 * request completing with an HTTP response. `instanceof Error` is false for
 * that shape, so `e instanceof Error ? e.message : String(e)` silently
 * collapses it to the literal string "[object Object]" — which is exactly
 * what showed up in the Account screen's "Sync isn't working" toast on a
 * flaky connection.
 */
export function errorMessage(e: unknown): string {
  if (e instanceof Error) return e.message;
  if (e && typeof e === 'object' && typeof (e as { message?: unknown }).message === 'string') {
    return (e as { message: string }).message;
  }
  return String(e);
}
