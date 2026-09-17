/** Small date helpers shared across hooks, forms and the insights helpers. */

const DAY_MS = 86_400_000;

function isoFromDate(d: Date): string {
  const y = d.getFullYear();
  const m = `${d.getMonth() + 1}`.padStart(2, '0');
  const day = `${d.getDate()}`.padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** Local calendar day as YYYY-MM-DD. */
export function today(): string {
  return isoFromDate(new Date());
}

/** Local wall-clock time as HH:MM. */
export function nowTime(): string {
  const d = new Date();
  const h = `${d.getHours()}`.padStart(2, '0');
  const min = `${d.getMinutes()}`.padStart(2, '0');
  return `${h}:${min}`;
}

/** UTC timestamp for created_at / updated_at. */
export function nowIso(): string {
  return new Date().toISOString();
}

/** Parse a YYYY-MM-DD calendar day into a local Date at midnight. */
export function parseDay(date: string): Date {
  const [y, m, d] = date.split('-').map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
}

/** Offset a YYYY-MM-DD day by `n` days (may be negative). */
export function addDays(date: string, n: number): string {
  return isoFromDate(new Date(parseDay(date).getTime() + n * DAY_MS));
}

/** Human label for a YYYY-MM-DD date, e.g. "Tue, Sep 16". */
export function formatDay(date: string): string {
  const [y, m, d] = date.split('-').map(Number);
  if (!y || !m || !d) return date;
  return parseDay(date).toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}
