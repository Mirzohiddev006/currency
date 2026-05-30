import { NavLink, useNavigate } from 'react-router-dom';
import {
  BarChart2,
  Banknote,
  Building2,
  LayoutDashboard,
  LogOut,
  ScrollText,
  TrendingUp,
  Users,
} from 'lucide-react';
import { useAuthStore } from '../../hooks/useAuth';

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/rates', icon: TrendingUp, label: 'Kurslar' },
  { to: '/banks', icon: Building2, label: 'Banklar' },
  { to: '/users', icon: Users, label: 'Foydalanuvchilar' },
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
    <aside className="sticky top-0 flex h-screen w-72 flex-shrink-0 flex-col border-r border-surface-800 bg-[linear-gradient(180deg,_rgba(8,13,26,0.98),_rgba(15,23,42,0.98))]">
      <div className="border-b border-surface-800 p-6">
        <div className="rounded-3xl border border-white/10 bg-[radial-gradient(circle_at_top_left,_rgba(245,158,11,0.18),_transparent_35%),radial-gradient(circle_at_bottom_right,_rgba(14,165,233,0.14),_transparent_34%),rgba(15,23,42,0.72)] p-5">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-amber-500/20 bg-amber-500/10 text-amber-300">
              <Banknote className="h-6 w-6" />
            </div>
            <div>
              <p className="font-display text-lg font-semibold text-slate-50">Currency Tracker</p>
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Admin cockpit</p>
            </div>
          </div>
          <p className="mt-4 text-sm leading-6 text-slate-300">
            Bot, scraper va web panelni bitta nazorat markazidan boshqaring.
          </p>
        </div>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto p-4">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `group flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition-all ${
                isActive
                  ? 'border border-amber-500/20 bg-amber-500/10 text-amber-300 shadow-lg shadow-amber-950/10'
                  : 'border border-transparent text-slate-400 hover:border-surface-700 hover:bg-surface-900/70 hover:text-slate-200'
              }`
            }
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-current/10 bg-current/5">
              <Icon className="h-4 w-4 flex-shrink-0" />
            </div>
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="border-t border-surface-800 p-4">
        <div className="rounded-3xl border border-surface-800 bg-surface-900/70 p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-sky-500/10 text-sm font-semibold text-sky-300">
              {admin?.name?.[0]?.toUpperCase() || 'A'}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium text-slate-200">{admin?.name}</p>
              <p className="truncate text-xs text-slate-500">{admin?.email}</p>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl border border-rose-500/15 bg-rose-500/8 px-4 py-2.5 text-sm font-medium text-rose-300 transition-all hover:border-rose-500/25 hover:bg-rose-500/12"
          >
            <LogOut className="h-4 w-4" />
            Chiqish
          </button>
        </div>
      </div>
    </aside>
  );
}
