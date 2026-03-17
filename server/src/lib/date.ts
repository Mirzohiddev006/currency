// ════════════════════════════════════════════════════════════
// DATE UTILITIES — Reusable date helpers
// ════════════════════════════════════════════════════════════

export function startOfDay(date: Date = new Date()): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function daysAgo(days: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d;
}

export function formatDateKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}
