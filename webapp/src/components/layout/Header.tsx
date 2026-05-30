import { TrendingUp, Clock, Building2, Activity } from 'lucide-react';
import { formatDate } from '../../lib/utils';
import type { RatesOverview } from '../../types';

interface HeaderProps {
  overview?: RatesOverview;
}

export function Header({ overview }: HeaderProps) {
  return (
    <header className="bg-white/80 backdrop-blur-md border-b border-slate-200/80 sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center shadow-sm">
              <TrendingUp className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-800 leading-none">
                Valyuta Kurslari
              </h1>
              <p className="text-xs text-slate-500 leading-none mt-0.5">
                O'zbekiston banklari
              </p>
            </div>
          </div>

          {/* Market Stats */}
          {overview && (
            <div className="hidden sm:flex items-center gap-4">
              <div className="flex items-center gap-1.5 text-sm text-slate-600">
                <Building2 className="w-4 h-4 text-emerald-500" />
                <span className="font-medium text-slate-800">
                  {overview.market.reportingBanks}
                </span>
                <span className="text-slate-400">/</span>
                <span>{overview.market.totalBanks}</span>
                <span className="text-slate-500 hidden md:inline">bank</span>
              </div>

              <div className="w-px h-4 bg-slate-200" />

              <div className="flex items-center gap-1.5 text-sm text-slate-600">
                <Activity className="w-4 h-4 text-emerald-500" />
                <span className="font-medium text-slate-800">
                  {overview.market.totalCurrencies}
                </span>
                <span className="text-slate-500 hidden md:inline">valyuta</span>
              </div>

              {overview.market.lastUpdated && (
                <>
                  <div className="w-px h-4 bg-slate-200" />
                  <div className="hidden lg:flex items-center gap-1.5 text-xs text-slate-500">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{formatDate(overview.market.lastUpdated)}</span>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Mobile: live indicator */}
          <div className="sm:hidden flex items-center gap-1.5">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            <span className="text-xs text-slate-500">Jonli</span>
          </div>
        </div>
      </div>
    </header>
  );
}
