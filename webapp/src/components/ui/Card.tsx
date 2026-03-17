import { cn } from '../../lib/utils';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  hoverable?: boolean;
}

export function Card({ children, className, onClick, hoverable }: CardProps) {
  return (
    <div
      onClick={onClick}
      className={cn(
        'bg-white rounded-xl border border-slate-200/80 shadow-sm',
        hoverable &&
          'cursor-pointer hover:border-emerald-300 hover:shadow-md transition-all duration-200',
        className
      )}
    >
      {children}
    </div>
  );
}
