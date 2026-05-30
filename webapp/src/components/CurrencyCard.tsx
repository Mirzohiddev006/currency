import { ArrowUpRight, ArrowDownRight, Minus, ChevronRight } from 'lucide-react';
import { Badge } from './ui/Badge';
import { Card } from './ui/Card';
import { formatRate, formatDiff, getCoverageColor } from '../lib/utils';
import type { CurrencySummary, TrendDirection } from '../types';

interface CurrencyCardProps {
  currency: CurrencySummary;
  onOpen: (code: string) => void;
}

function TrendBadge({ trend, diff }: { trend: TrendDirection; diff: number }) {
  if (trend === 'up') {
    return (
      <Badge variant="up">
        <ArrowUpRight className="w-3 h-3" />
        {formatDiff(diff)}
      </Badge>
    );
  }
  if (trend === 'down') {
    return (
      <Badge variant="down">
        <ArrowDownRight className="w-3 h-3" />
        {formatDiff(diff)}
      </Badge>
    );
  }
  return (
    <Badge variant="flat">
      <Minus className="w-3 h-3" />
      {formatDiff(diff)}
    </Badge>
  );
}

export function CurrencyCard({ currency, onOpen }: CurrencyCardProps) {
  const coverageColor = getCoverageColor(currency.coveragePercent);

  return (
    <Card hoverable className="p-5 flex flex-col gap-4 group">
      {/* Header: code + name + trend */}
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-2xl font-bold text-slate-800 tracking-tight">
              {currency.code}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5 leading-snug line-clamp-1">
            {currency.currency}
          </p>
        </div>
        <TrendBadge trend={currency.trend} diff={currency.diff} />
      </div>

      {/* CBU Rate */}
      <div>
        <p className="text-xs text-slate-400 font-medium uppercase tracking-wider mb-0.5">
          CBU kursi
        </p>
        <p className="text-3xl font-bold text-slate-900 tabular-nums leading-none">
          {formatRate(currency.cbRate, 2)}
        </p>
        {currency.nominal > 1 && (
          <p className="text-xs text-slate-400 mt-0.5">
            {currency.nominal} {currency.code} uchun
          </p>
        )}
      </div>

      {/* Best Buy / Best Sell */}
      <div className="grid grid-cols-2 gap-2">
        <div className="bg-emerald-50/60 rounded-lg px-3 py-2">
          <p className="text-xs text-slate-500 font-medium">Eng yaxshi xarid</p>
          <p className="text-sm font-bold text-emerald-700 tabular-nums mt-0.5">
            {currency.bestBuy !== null ? formatRate(currency.bestBuy, 2) : '—'}
          </p>
        </div>
        <div className="bg-slate-50 rounded-lg px-3 py-2">
          <p className="text-xs text-slate-500 font-medium">Eng yaxshi sotish</p>
          <p className="text-sm font-bold text-slate-700 tabular-nums mt-0.5">
            {currency.bestSell !== null ? formatRate(currency.bestSell, 2) : '—'}
          </p>
        </div>
      </div>

      {/* Coverage bar */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs text-slate-500">
            {currency.reportingBanks}/{currency.totalBanks} bank hisoboti
          </span>
          <span className="text-xs font-medium text-slate-600">
            {currency.coveragePercent}%
          </span>
        </div>
        <div className="coverage-bar">
          <div
            className={`coverage-fill ${coverageColor}`}
            style={{ width: `${Math.min(currency.coveragePercent, 100)}%` }}
          />
        </div>
      </div>

      {/* Open button */}
      <button
        onClick={() => onOpen(currency.code)}
        className="w-full flex items-center justify-center gap-1.5 py-2 px-4 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-sm font-medium rounded-lg transition-colors duration-200 shadow-sm group-hover:shadow-emerald-200 group-hover:shadow-md"
      >
        Ko'proq ko'rish
        <ChevronRight className="w-4 h-4" />
      </button>
    </Card>
  );
}
