import { useEffect, useState } from 'react';
import { Activity, Building2, CheckCircle, RefreshCw, Users, XCircle, Zap } from 'lucide-react';
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { formatDistanceToNow } from 'date-fns';
import { api } from '../lib/api';

interface Stats {
  users: { total: number; active: number; newToday: number };
  requests: { today: number };
  banks: { total: number; active: number };
  lastUpdate: string | null;
  scrapeLogs: {
    bankCode: string;
    status: string;
    createdAt: string;
    ratesCount?: number;
    duration?: number;
  }[];
}

interface Analytics {
  requestsByDay: Record<string, number>;
  usersByDay: Record<string, number>;
  topCommands: { command: string; count: number }[];
}

interface StatCardProps {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  sub?: string;
  color?: 'primary' | 'emerald' | 'amber' | 'sky';
}

function StatCard({ icon: Icon, label, value, sub, color = 'primary' }: StatCardProps) {
  const colors: Record<NonNullable<StatCardProps['color']>, string> = {
    primary: 'border-primary-600/20 bg-primary-600/15 text-primary-400',
    emerald: 'border-emerald-600/20 bg-emerald-600/15 text-emerald-400',
    amber: 'border-amber-600/20 bg-amber-600/15 text-amber-400',
    sky: 'border-sky-600/20 bg-sky-600/15 text-sky-400',
  };

  return (
    <div className="stat-card">
      <div className="flex items-start justify-between">
        <div className={`rounded-xl border p-2.5 ${colors[color]}`}>
          <Icon className="h-5 w-5" />
        </div>
        {sub && (
          <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs text-emerald-400">
            {sub}
          </span>
        )}
      </div>
      <div>
        <p className="text-3xl font-display font-bold text-slate-100">{value}</p>
        <p className="mt-0.5 text-sm text-slate-400">{label}</p>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [refreshMsg, setRefreshMsg] = useState('');
  const [loading, setLoading] = useState(true);

  const loadStats = async () => {
    try {
      const [statsRes, analyticsRes] = await Promise.all([
        api.get('/admin/stats'),
        api.get('/admin/analytics?days=7'),
      ]);

      setStats(statsRes.data.data);
      setAnalytics(analyticsRes.data.data);
    } catch {
      setStats(null);
      setAnalytics(null);
    }

    setLoading(false);
  };

  useEffect(() => {
    loadStats();
    const interval = setInterval(loadStats, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    setRefreshMsg('');

    try {
      const { data } = await api.post('/admin/refresh');
      setRefreshMsg(data.message);
      setTimeout(loadStats, 5000);
    } catch (err: any) {
      setRefreshMsg(err.response?.data?.message || 'Xatolik yuz berdi');
    }

    setRefreshing(false);
  };

  const chartData = analytics
    ? Object.entries(analytics.requestsByDay || {})
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([date, count]) => ({
          date: date.slice(5),
          requests: count,
          users: (analytics.usersByDay || {})[date] || 0,
        }))
    : [];

  const topCommands = analytics?.topCommands || [];

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="flex items-center gap-3 text-slate-400">
          <RefreshCw className="h-5 w-5 animate-spin" />
          <span>Yuklanmoqda...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-slide-up space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-slate-100">Dashboard</h1>
          <p className="mt-0.5 text-sm text-slate-400">
            {stats?.lastUpdate
              ? `Oxirgi yangilanish: ${formatDistanceToNow(new Date(stats.lastUpdate), { addSuffix: true })}`
              : 'Hali yangilanmagan'}
          </p>
        </div>

        <div className="flex flex-col items-end gap-2">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="btn-primary glow px-6 py-3 text-base"
          >
            <RefreshCw className={`h-5 w-5 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? 'Yangilanmoqda...' : 'Kurslarni yangilash'}
          </button>
          {refreshMsg && <p className="animate-fade-in text-xs text-emerald-400">{refreshMsg}</p>}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon={Users}
          label="Jami foydalanuvchilar"
          value={stats?.users.total.toLocaleString() || '0'}
          sub={stats?.users.newToday ? `+${stats.users.newToday} bugun` : undefined}
          color="primary"
        />
        <StatCard
          icon={Activity}
          label="Faol foydalanuvchilar"
          value={stats?.users.active.toLocaleString() || '0'}
          color="emerald"
        />
        <StatCard
          icon={Zap}
          label="Bugungi so'rovlar"
          value={stats?.requests.today.toLocaleString() || '0'}
          color="amber"
        />
        <StatCard
          icon={Building2}
          label="Faol banklar"
          value={`${stats?.banks.active || 0}/${stats?.banks.total || 0}`}
          color="sky"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="card p-6 lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display font-semibold text-slate-200">So'rovlar (7 kun)</h2>
            <span className="badge-success">Jonli</span>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="reqGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6172f3" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#6172f3" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="userGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="date" tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{
                  background: '#1e293b',
                  border: '1px solid #334155',
                  borderRadius: '12px',
                  color: '#e2e8f0',
                }}
                itemStyle={{ color: '#e2e8f0' }}
              />
              <Area type="monotone" dataKey="requests" stroke="#6172f3" fill="url(#reqGrad)" strokeWidth={2} name="So'rovlar" />
              <Area type="monotone" dataKey="users" stroke="#10b981" fill="url(#userGrad)" strokeWidth={2} name="Yangi users" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="card p-6">
          <h2 className="mb-4 font-display font-semibold text-slate-200">Top buyruqlar</h2>
          <div className="space-y-3">
            {topCommands.slice(0, 6).map((item, index) => (
              <div key={`${item.command}-${index}`} className="flex items-center gap-3">
                <span className="w-4 text-xs text-slate-500">{index + 1}</span>
                <div className="flex-1">
                  <div className="mb-1 flex items-center justify-between">
                    <span className="font-mono text-sm text-slate-300">{item.command}</span>
                    <span className="text-xs text-slate-400">{item.count}</span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-surface-800">
                    <div
                      className="h-full rounded-full bg-primary-600"
                      style={{ width: `${(item.count / (topCommands[0]?.count || 1)) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="card p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display font-semibold text-slate-200">So'nggi scraping loglari</h2>
          <span className="text-xs text-slate-500">{stats?.scrapeLogs?.length || 0} ta log</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-surface-800 text-left text-slate-500">
                <th className="pb-3 pr-4">Bank</th>
                <th className="pb-3 pr-4">Status</th>
                <th className="pb-3 pr-4">Kurslar</th>
                <th className="pb-3 pr-4">Davomiylik</th>
                <th className="pb-3">Vaqt</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-800">
              {(stats?.scrapeLogs || []).slice(0, 10).map((log, index) => (
                <tr key={`${log.bankCode}-${index}`} className="transition-colors hover:bg-surface-800/50">
                  <td className="py-3 pr-4">
                    <span className="font-mono text-slate-300">{log.bankCode}</span>
                  </td>
                  <td className="py-3 pr-4">
                    {log.status === 'SUCCESS' ? (
                      <span className="badge-success flex w-fit items-center gap-1">
                        <CheckCircle className="h-3 w-3" /> Muvaffaqiyat
                      </span>
                    ) : (
                      <span className="badge-error flex w-fit items-center gap-1">
                        <XCircle className="h-3 w-3" /> Xatolik
                      </span>
                    )}
                  </td>
                  <td className="py-3 pr-4 font-mono text-slate-300">{log.ratesCount || '-'}</td>
                  <td className="py-3 pr-4 font-mono text-xs text-slate-400">
                    {log.duration ? `${log.duration}ms` : '-'}
                  </td>
                  <td className="py-3 text-xs text-slate-500">
                    {formatDistanceToNow(new Date(log.createdAt), { addSuffix: true })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
