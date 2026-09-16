/** Small date helpers shared across hooks and forms. */

/** Local calendar day as YYYY-MM-DD. */
export function today(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = `${d.getMonth() + 1}`.padStart(2, '0');
  const day = `${d.getDate()}`.padStart(2, '0');
  return `${y}-${m}-${day}`;
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

/** Human label for a YYYY-MM-DD date, e.g. "Tue, Sep 16". */
export function formatDay(date: string): string {
  const [y, m, d] = date.split('-').map(Number);
  if (!y || !m || !d) return date;
  const dt = new Date(y, m - 1, d);
  return dt.toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}
