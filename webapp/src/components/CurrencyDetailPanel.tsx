import {
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  TrendingUp,
  TrendingDown,
  AlertCircle,
} from 'lucide-react';
import { Badge } from './ui/Badge';
import { Skeleton } from './ui/Skeleton';
import { ErrorState } from './ui/ErrorState';
import { BankRateRow } from './BankRateRow';
import { useCurrencyDetails } from '../hooks/useCurrencyData';
import { formatRate, formatDiff, formatDate, getCoverageColor } from '../lib/utils';
import type { TrendDirection } from '../types';

interface CurrencyDetailPanelProps {
  currencyCode: string;
}

function TrendIndicator({ trend }: { trend: TrendDirection }) {
  if (trend === 'up') {
    return (
      <div className="flex items-center gap-1 text-emerald-600">
        <TrendingUp className="w-4 h-4" />
        <span className="text-xs font-medium">O'sdi</span>
      </div>
    );
  }
  if (trend === 'down') {
    return (
      <div className="flex items-center gap-1 text-red-500">
        <TrendingDown className="w-4 h-4" />
        <span className="text-xs font-medium">Tushdi</span>
      </div>
    );
  }
  return (
    <div className="flex items-center gap-1 text-slate-500">
      <Minus className="w-4 h-4" />
      <span className="text-xs font-medium">O'zgarmadi</span>
    </div>
  );
}

function DiffBadge({ diff, trend }: { diff: number; trend: TrendDirection }) {
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

function LoadingSkeleton() {
  return (
    <div className="p-6 space-y-6">
      {/* Summary header */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-24 rounded-lg" />
          <Skeleton className="h-6 w-16 rounded-full" />
        </div>
        <Skeleton className="h-4 w-36 rounded" />
      </div>

      {/* Rate cards grid */}
      <div className="grid grid-cols-2 gap-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="bg-slate-50 rounded-xl p-3 space-y-2">
            <Skeleton className="h-3 w-20 rounded" />
            <Skeleton className="h-7 w-28 rounded" />
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="space-y-2">
        <Skeleton className="h-4 w-24 rounded" />
        <div className="space-y-1">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full rounded-lg" />
          ))}
        </div>
      </div>
    </div>
  );
}

export function CurrencyDetailPanel({ currencyCode }: CurrencyDetailPanelProps) {
  const { data, isLoading, isError, refetch } = useCurrencyDetails(currencyCode);

  if (isLoading) {
    return <LoadingSkeleton />;
  }

  if (isError || !data) {
    return (
      <ErrorState
        onRetry={refetch}
        description="Valyuta ma'lumotlarini yuklashda xatolik. Qayta urinib ko'ring."
        className="py-20"
      />
    );
  }

  const { data: details } = data;
  const summary = details.summary;
  const rows = details.rows ?? [];
  const missingBanks = details.missingBanks ?? [];

  const activeBanks = rows.filter((r) => r.hasRate);
  const coverageColor = summary ? getCoverageColor(summary.coveragePercent) : 'bg-slate-300';

  return (
    <div className="animate-[fadeIn_0.2s_ease-in-out]">
      {/* Currency Header */}
      {summary && (
        <div className="px-6 py-5 bg-gradient-to-r from-emerald-50/80 to-white border-b border-slate-100">
          <div className="flex items-start justify-between mb-1">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-3xl font-bold text-slate-900">{summary.code}</span>
                <DiffBadge diff={summary.diff} trend={summary.trend} />
              </div>
              <p className="text-sm text-slate-500 mt-0.5">{summary.currency}</p>
            </div>
            <TrendIndicator trend={summary.trend} />
          </div>
          <p className="text-xs text-slate-400 mt-2 flex items-center gap-1">
            <span>Sana:</span>
            <span className="font-medium text-slate-500">{formatDate(summary.date)}</span>
          </p>
        </div>
      )}

      <div className="px-6 py-5 space-y-6">
        {/* Summary Stats */}
        {summary && (
          <section>
            <h3 className="section-title">Asosiy ko'rsatkichlar</h3>
            <div className="grid grid-cols-2 gap-2.5">
              {/* CBU Rate */}
              <div className="col-span-2 bg-emerald-600 rounded-xl p-4 text-white">
                <p className="text-xs font-medium text-emerald-200 uppercase tracking-wider">
                  CBU rasmiy kursi
                </p>
                <p className="text-3xl font-bold tabular-nums mt-1">
                  {formatRate(summary.cbRate, 2)}
                </p>
                {summary.nominal > 1 && (
                  <p className="text-xs text-emerald-200 mt-0.5">
                    {summary.nominal} {summary.code} uchun UZS
                  </p>
                )}
              </div>

              {/* Best Buy */}
              <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-3">
                <p className="rate-label">Eng yaxshi xarid</p>
                <p className="text-xl font-bold text-emerald-700 tabular-nums mt-1">
                  {formatRate(summary.bestBuy, 2)}
                </p>
              </div>

              {/* Best Sell */}
              <div className="bg-slate-50 border border-slate-100 rounded-xl p-3">
                <p className="rate-label">Eng yaxshi sotish</p>
                <p className="text-xl font-bold text-slate-700 tabular-nums mt-1">
                  {formatRate(summary.bestSell, 2)}
                </p>
              </div>

              {/* Average Buy */}
              <div className="bg-white border border-slate-200 rounded-xl p-3">
                <p className="rate-label">O'rtacha xarid</p>
                <p className="text-lg font-bold text-emerald-600 tabular-nums mt-1">
                  {formatRate(summary.averageBuy, 2)}
                </p>
              </div>

              {/* Average Sell */}
              <div className="bg-white border border-slate-200 rounded-xl p-3">
                <p className="rate-label">O'rtacha sotish</p>
                <p className="text-lg font-bold text-slate-700 tabular-nums mt-1">
                  {formatRate(summary.averageSell, 2)}
                </p>
              </div>
            </div>
          </section>
        )}

        {/* Quick Stats Row */}
        {summary && (
          <section>
            <h3 className="section-title">Statistika</h3>
            <div className="grid grid-cols-2 gap-2">
              <div className="flex items-center justify-between bg-white border border-slate-200 rounded-lg px-3 py-2.5">
                <span className="text-xs text-slate-500">Nominal</span>
                <span className="text-sm font-semibold text-slate-700 tabular-nums">
                  {summary.nominal}
                </span>
              </div>
              <div className="flex items-center justify-between bg-white border border-slate-200 rounded-lg px-3 py-2.5">
                <span className="text-xs text-slate-500">O'zgarish</span>
                <DiffBadge diff={summary.diff} trend={summary.trend} />
              </div>
              <div className="flex items-center justify-between bg-white border border-slate-200 rounded-lg px-3 py-2.5">
                <span className="text-xs text-slate-500">Hisobot bergan</span>
                <span className="text-sm font-semibold text-slate-700">
                  {summary.reportingBanks}/{summary.totalBanks}
                </span>
              </div>
              <div className="flex items-center justify-between bg-white border border-slate-200 rounded-lg px-3 py-2.5">
                <span className="text-xs text-slate-500">Qamrov</span>
                <span className="text-sm font-semibold text-slate-700">
                  {summary.coveragePercent}%
                </span>
              </div>
            </div>

            {/* Coverage bar */}
            <div className="mt-3">
              <div className="coverage-bar">
                <div
                  className={`coverage-fill ${coverageColor}`}
                  style={{ width: `${Math.min(summary.coveragePercent, 100)}%` }}
                />
              </div>
            </div>
          </section>
        )}

        {/* Bank Rates Table */}
        {rows.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-3">
              <h3 className="section-title mb-0">Bank kurslari</h3>
              <span className="text-xs text-slate-400 font-medium">
                {activeBanks.length} ta faol
              </span>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200">
                      <th className="py-2.5 pl-4 pr-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                        Bank
                      </th>
                      <th className="py-2.5 px-2 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">
                        Xarid
                      </th>
                      <th className="py-2.5 px-2 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">
                        Sotish
                      </th>
                      <th className="py-2.5 px-2 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">
                        Spread
                      </th>
                      <th className="py-2.5 pl-2 pr-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-center">
                        <span className="sr-only">Holat</span>✓
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row, index) => (
                      <BankRateRow key={row.bank.id} row={row} index={index} />
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        )}

        {/* Missing Banks */}
        {missingBanks.length > 0 && (
          <section>
            <div className="flex items-center gap-2 mb-3">
              <h3 className="section-title mb-0">Ma'lumot bermagan</h3>
              <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-xs text-slate-400">{missingBanks.length} ta</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {missingBanks.map((bank) => (
                <span
                  key={bank}
                  className="inline-block text-xs text-slate-400 bg-slate-100 border border-slate-200 rounded-full px-2.5 py-1"
                >
                  {bank}
                </span>
              ))}
            </div>
          </section>
        )}

        {/* Empty state */}
        {rows.length === 0 && (
          <div className="text-center py-8">
            <p className="text-sm text-slate-500">
              Bu valyuta uchun bank ma'lumotlari mavjud emas
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
