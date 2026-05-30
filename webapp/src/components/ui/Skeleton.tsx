import { cn } from '../../lib/utils';

interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      className={cn(
        'relative overflow-hidden bg-slate-100 rounded-lg',
        'before:absolute before:inset-0',
        'before:bg-gradient-to-r before:from-transparent before:via-emerald-50/60 before:to-transparent',
        'before:animate-[shimmer_2s_linear_infinite]',
        'before:bg-[length:200%_100%]',
        className
      )}
    />
  );
}

export function CurrencyCardSkeleton() {
  return (
    <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm p-5 space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <Skeleton className="h-7 w-16 rounded-lg" />
          <Skeleton className="h-4 w-24 rounded" />
        </div>
        <Skeleton className="h-6 w-14 rounded-full" />
      </div>
      {/* Rate */}
      <div className="space-y-1">
        <Skeleton className="h-9 w-32 rounded-lg" />
        <Skeleton className="h-4 w-20 rounded" />
      </div>
      {/* Buy/Sell */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Skeleton className="h-3 w-10 rounded" />
          <Skeleton className="h-5 w-20 rounded" />
        </div>
        <div className="space-y-1.5">
          <Skeleton className="h-3 w-10 rounded" />
          <Skeleton className="h-5 w-20 rounded" />
        </div>
      </div>
      {/* Coverage */}
      <div className="space-y-1.5">
        <Skeleton className="h-3 w-24 rounded" />
        <Skeleton className="h-1.5 w-full rounded-full" />
      </div>
      {/* Button */}
      <Skeleton className="h-9 w-full rounded-lg" />
    </div>
  );
}
