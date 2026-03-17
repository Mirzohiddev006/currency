export function cn(...classes: (string | undefined | false | null)[]): string {
  return classes.filter(Boolean).join(' ');
}

export function formatRate(value: number | null, decimals = 2): string {
  if (value === null || value === undefined) return '—';
  return value.toLocaleString('uz-UZ', {
    minimumFractionDigits: value < 100 ? decimals : 0,
    maximumFractionDigits: decimals,
  });
}

export function formatDiff(diff: number): string {
  const sign = diff > 0 ? '+' : '';
  return `${sign}${formatRate(diff)}`;
}

export function formatDate(date: string | null): string {
  if (!date) return '—';
  try {
    return new Intl.DateTimeFormat('uz-UZ', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(date));
  } catch {
    return date;
  }
}

export function formatDateShort(date: string | null): string {
  if (!date) return '—';
  try {
    return new Intl.DateTimeFormat('uz-UZ', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(new Date(date));
  } catch {
    return date;
  }
}

export function trendIcon(trend: 'up' | 'down' | 'flat'): string {
  if (trend === 'up') return '↑';
  if (trend === 'down') return '↓';
  return '→';
}

export function getSpreadColor(spread: number | null): string {
  if (spread === null) return 'text-slate-400';
  if (spread <= 50) return 'text-emerald-600';
  if (spread <= 150) return 'text-amber-600';
  return 'text-red-500';
}

export function getCoverageColor(percent: number): string {
  if (percent >= 80) return 'bg-emerald-500';
  if (percent >= 50) return 'bg-amber-400';
  return 'bg-red-400';
}
