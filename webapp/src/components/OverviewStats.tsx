import { BarChart3, Building2, CheckCircle2, Clock } from 'lucide-react';
import { formatDate } from '../lib/utils';
import type { RatesOverview } from '../types';

interface OverviewStatsProps {
  market: RatesOverview['market'];
}

interface StatItem {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  subtext?: string;
  accent: string;
  iconBg: string;
}

export function OverviewStats({ market }: OverviewStatsProps) {
  const coveragePercent =
    market.totalBanks > 0
      ? Math.round((market.reportingBanks / market.totalBanks) * 100)
      : 0;

  const stats: StatItem[] = [
    {
      label: 'Valyutalar',
      value: market.totalCurrencies,
      icon: <BarChart3 className="w-5 h-5" />,
      subtext: 'kuzatilmoqda',
      accent: 'text-emerald-600',
      iconBg: 'bg-emerald-50 text-emerald-600',
    },
    {
      label: 'Hisobot bergan',
      value: `${market.reportingBanks}/${market.totalBanks}`,
      icon: <CheckCircle2 className="w-5 h-5" />,
      subtext: `${coveragePercent}% qamrov`,
      accent: 'text-blue-600',
      iconBg: 'bg-blue-50 text-blue-600',
    },
    {
      label: 'Jami banklar',
      value: market.totalBanks,
      icon: <Building2 className="w-5 h-5" />,
      subtext: `${market.commercialBanks} tijorat`,
      accent: 'text-violet-600',
      iconBg: 'bg-violet-50 text-violet-600',
    },
    {
      label: 'Oxirgi yangilanish',
      value: market.lastUpdated ? formatDate(market.lastUpdated).split(' ')[0] : '—',
      icon: <Clock className="w-5 h-5" />,
      subtext: market.lastUpdated
        ? formatDate(market.lastUpdated).split(' ').slice(1).join(' ')
        : 'Ma\'lumot yo\'q',
      accent: 'text-amber-600',
      iconBg: 'bg-amber-50 text-amber-600',
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-2">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className="bg-white rounded-xl border border-slate-200/80 shadow-sm p-4 flex items-start gap-3"
        >
          <div
            className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${stat.iconBg}`}
          >
            {stat.icon}
          </div>
          <div className="min-w-0">
            <p className="text-xs text-slate-500 font-medium truncate">{stat.label}</p>
            <p className={`text-xl font-bold leading-tight mt-0.5 ${stat.accent} tabular-nums`}>
              {stat.value}
            </p>
            {stat.subtext && (
              <p className="text-xs text-slate-400 mt-0.5 truncate">{stat.subtext}</p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
