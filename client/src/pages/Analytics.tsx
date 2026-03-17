import { useEffect, useState } from 'react';
import { BarChart2, RefreshCw } from 'lucide-react';
import { api } from '../lib/api';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, Legend
} from 'recharts';

const COLORS = ['#6172f3', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

export default function Analytics() {
  const [data, setData] = useState<any>(null);
  const [days, setDays] = useState(7);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/admin/analytics?days=${days}`);
      setData(res.data.data);
    } catch {}
    setLoading(false);
  };

  useEffect(() => { load(); }, [days]);

  const requestsByDay = data
    ? Object.entries(data.requestsByDay || {}).sort().map(([date, count]) => ({
        date: date.slice(5), count,
      }))
    : [];

  const usersByDay = data
    ? Object.entries(data.usersByDay || {}).sort().map(([date, count]) => ({
        date: date.slice(5), count,
      }))
    : [];

  const commandsData = (data?.topCommands || []).slice(0, 8);

  return (
    <div className="p-6 space-y-6 animate-slide-up">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-display font-bold text-slate-100">Analitika</h1>
        <div className="flex items-center gap-3">
          {[7, 14, 30].map((d) => (
            <button key={d} onClick={() => setDays(d)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                days === d ? 'bg-primary-600 text-white' : 'bg-surface-800 text-slate-400 hover:text-slate-200 border border-surface-700'
              }`}
            >
              {d} kun
            </button>
          ))}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-4">
        <div className="stat-card">
          <p className="text-3xl font-display font-bold text-slate-100">
            {data?.totalRequests?.toLocaleString() || 0}
          </p>
          <p className="text-sm text-slate-400">Jami so'rovlar ({days} kun)</p>
        </div>
        <div className="stat-card">
          <p className="text-3xl font-display font-bold text-slate-100">
            {data?.totalNewUsers?.toLocaleString() || 0}
          </p>
          <p className="text-sm text-slate-400">Yangi foydalanuvchilar ({days} kun)</p>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Requests by day */}
        <div className="card p-6">
          <h2 className="font-display font-semibold text-slate-200 mb-4">Kunlik so'rovlar</h2>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={requestsByDay}>
              <XAxis dataKey="date" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '12px', color: '#e2e8f0' }}
              />
              <Bar dataKey="count" fill="#6172f3" radius={[4, 4, 0, 0]} name="So'rovlar" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* New users by day */}
        <div className="card p-6">
          <h2 className="font-display font-semibold text-slate-200 mb-4">Yangi foydalanuvchilar</h2>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={usersByDay}>
              <XAxis dataKey="date" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '12px', color: '#e2e8f0' }}
              />
              <Line type="monotone" dataKey="count" stroke="#10b981" strokeWidth={2} dot={{ fill: '#10b981', r: 3 }} name="Yangi users" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Top commands */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="card p-6">
          <h2 className="font-display font-semibold text-slate-200 mb-4">Top buyruqlar</h2>
          <div className="space-y-3">
            {commandsData.map((item: any, i: number) => (
              <div key={i} className="flex items-center gap-3">
                <span className="text-xs text-slate-500 w-5 font-mono">{i + 1}</span>
                <span className="font-mono text-sm text-slate-300 w-28 flex-shrink-0">{item.command}</span>
                <div className="flex-1 h-2 bg-surface-800 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${(item.count / commandsData[0]?.count) * 100}%`,
                      background: COLORS[i % COLORS.length],
                    }}
                  />
                </div>
                <span className="text-xs text-slate-400 font-mono w-10 text-right">{item.count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Pie chart of commands */}
        <div className="card p-6">
          <h2 className="font-display font-semibold text-slate-200 mb-4">Buyruqlar taqsimoti</h2>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={commandsData.slice(0, 6)}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={90}
                dataKey="count"
                nameKey="command"
              >
                {commandsData.slice(0, 6).map((_: any, index: number) => (
                  <Cell key={index} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '12px', color: '#e2e8f0' }}
              />
              <Legend wrapperStyle={{ color: '#94a3b8', fontSize: '12px' }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
