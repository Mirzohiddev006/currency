import { cn } from '../../lib/utils';

type BadgeVariant = 'success' | 'warning' | 'error' | 'neutral' | 'up' | 'down' | 'flat';

interface BadgeProps {
  variant?: BadgeVariant;
  children: React.ReactNode;
  className?: string;
}

export function Badge({ variant = 'neutral', children, className }: BadgeProps) {
  const variants: Record<BadgeVariant, string> = {
    success: 'bg-emerald-100 text-emerald-700 border border-emerald-200',
    warning: 'bg-amber-100 text-amber-700 border border-amber-200',
    error: 'bg-red-100 text-red-700 border border-red-200',
    neutral: 'bg-slate-100 text-slate-600 border border-slate-200',
    up: 'bg-emerald-100 text-emerald-700 border border-emerald-200',
    down: 'bg-red-100 text-red-600 border border-red-200',
    flat: 'bg-slate-100 text-slate-500 border border-slate-200',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium',
        variants[variant],
        className
      )}
    >
      {children}
    </span>
  );
}
