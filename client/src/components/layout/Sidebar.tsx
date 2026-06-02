import { NavLink, useNavigate } from 'react-router-dom';
import {
  BarChart2,
  Banknote,
  Building2,
  LayoutDashboard,
  LogOut,
  ScrollText,
  Send,
  TrendingUp,
  Users,
} from 'lucide-react';
import { useAuthStore } from '../../hooks/useAuth';

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/rates', icon: TrendingUp, label: 'Kurslar' },
  { to: '/banks', icon: Building2, label: 'Banklar' },
  { to: '/users', icon: Users, label: 'Foydalanuvchilar' },
  { to: '/broadcast', icon: Send, label: 'Xabar yuborish' },
  { to: '/analytics', icon: BarChart2, label: 'Analitika' },
  { to: '/logs', icon: ScrollText, label: 'Loglar' },
];

export default function Sidebar() {
  const { admin, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <aside className="sticky top-0 flex h-screen w-60 flex-shrink-0 flex-col border-r border-surface-800 bg-[linear-gradient(180deg,_rgba(8,13,26,0.98),_rgba(15,23,42,0.98))]">
      <div className="flex items-center gap-3 border-b border-surface-800 px-4 py-4">
        <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl border border-amber-500/20 bg-amber-500/10 text-amber-300">
          <Banknote className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <p className="truncate font-display text-base font-semibold text-slate-50">
            Currency Tracker
          </p>
          <p className="text-[10px] uppercase tracking-[0.18em] text-slate-500">Admin</p>
        </div>
      </div>

      <nav className="flex-1 space-y-0.5 overflow-y-auto p-3">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all ${
                isActive
                  ? 'bg-amber-500/10 text-amber-300'
                  : 'text-slate-400 hover:bg-surface-900/70 hover:text-slate-200'
              }`
            }
          >
            <Icon className="h-[18px] w-[18px] flex-shrink-0" />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="border-t border-surface-800 p-3">
        <div className="flex items-center gap-3 rounded-xl px-2 py-2">
          <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-sky-500/10 text-sm font-semibold text-sky-300">
            {admin?.name?.[0]?.toUpperCase() || 'A'}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-slate-200">{admin?.name}</p>
            <p className="truncate text-xs text-slate-500">{admin?.email}</p>
          </div>
          <button
            onClick={handleLogout}
            title="Chiqish"
            className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg border border-rose-500/15 bg-rose-500/8 text-rose-300 transition-all hover:border-rose-500/25 hover:bg-rose-500/12"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
