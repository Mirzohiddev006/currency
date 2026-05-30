import { useEffect, useState } from 'react';
import { ScrollText, RefreshCw, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { api } from '../lib/api';
import { formatDistanceToNow, format } from 'date-fns';

export default function Logs() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/admin/logs?limit=100');
      setLogs(data.data);
    } catch {}
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const grouped = logs.reduce((acc: Record<string, any[]>, log) => {
    const day = log.createdAt.slice(0, 10);
    acc[day] = acc[day] || [];
    acc[day].push(log);
    return acc;
  }, {});

  return (
    <div className="p-6 space-y-6 animate-slide-up">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-display font-bold text-slate-100">Scraping Loglari</h1>
        <button onClick={load} className="btn-secondary">
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Yangilash
        </button>
      </div>

      <div className="space-y-6">
        {Object.entries(grouped)
          .sort(([a], [b]) => b.localeCompare(a))
          .map(([day, dayLogs]) => {
            const success = dayLogs.filter((l) => l.status === 'SUCCESS').length;
            const failed = dayLogs.filter((l) => l.status !== 'SUCCESS').length;

            return (
              <div key={day}>
                <div className="flex items-center gap-3 mb-3">
                  <p className="text-sm font-medium text-slate-400">{format(new Date(day), 'dd MMMM yyyy')}</p>
                  <div className="flex items-center gap-2">
                    <span className="badge-success">{success} muvaffaqiyat</span>
                    {failed > 0 && <span className="badge-error">{failed} xatolik</span>}
                  </div>
                </div>

                <div className="card divide-y divide-surface-800">
                  {dayLogs.map((log, i) => (
                    <div key={i} className="flex items-center gap-4 p-4 hover:bg-surface-800/40 transition-colors">
                      <div className="flex-shrink-0">
                        {log.status === 'SUCCESS' ? (
                          <CheckCircle className="w-4 h-4 text-emerald-400" />
                        ) : log.status === 'PARTIAL' ? (
                          <AlertCircle className="w-4 h-4 text-amber-400" />
                        ) : (
                          <XCircle className="w-4 h-4 text-red-400" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3">
                          <span className="font-mono text-sm text-slate-200">{log.bankCode}</span>
                          {log.ratesCount && (
                            <span className="text-xs text-slate-500">{log.ratesCount} kurs</span>
                          )}
                          {log.duration && (
                            <span className="text-xs text-slate-500 font-mono">{log.duration}ms</span>
                          )}
                        </div>
                        {log.message && (
                          <p className="text-xs text-red-400 mt-0.5 truncate">{log.message}</p>
                        )}
                      </div>
                      <span className="text-xs text-slate-500 flex-shrink-0">
                        {format(new Date(log.createdAt), 'HH:mm:ss')}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
      </div>
    </div>
  );
}
