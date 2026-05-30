// ════════════════════════════════════════════════════════════
// ERROR STATE — Reusable error display with retry
// ════════════════════════════════════════════════════════════

import { AlertCircle, RefreshCw } from 'lucide-react';

interface Props {
  message?: string;
  onRetry?: () => void;
}

export default function ErrorState({ message = 'Xatolik yuz berdi', onRetry }: Props) {
  return (
    <div className="flex items-center justify-center h-64">
      <div className="card p-8 flex flex-col items-center gap-4 max-w-sm text-center">
        <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20">
          <AlertCircle className="w-6 h-6 text-red-400" />
        </div>
        <div>
          <p className="font-medium text-slate-200">Xatolik</p>
          <p className="text-sm text-slate-400 mt-1">{message}</p>
        </div>
        {onRetry && (
          <button onClick={onRetry} className="btn-secondary text-sm">
            <RefreshCw className="w-4 h-4" />
            Qayta urinish
          </button>
        )}
      </div>
    </div>
  );
}
