// ════════════════════════════════════════════════════════════
// LOADING SPINNER — Reusable loading indicator
// ════════════════════════════════════════════════════════════

import { RefreshCw } from 'lucide-react';

interface Props {
  message?: string;
  className?: string;
}

export default function LoadingSpinner({ message = 'Yuklanmoqda...', className = '' }: Props) {
  return (
    <div className={`flex items-center justify-center h-64 ${className}`}>
      <div className="flex flex-col items-center gap-3">
        <RefreshCw className="w-6 h-6 animate-spin text-primary-400" />
        <span className="text-sm text-slate-400">{message}</span>
      </div>
    </div>
  );
}
