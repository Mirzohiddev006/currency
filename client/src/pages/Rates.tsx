import { useEffect, useState } from 'react';
import {
  ArrowDownRight,
  ArrowUpRight,
  Building2,
  Landmark,
  Minus,
  RefreshCw,
  Search,
  Sparkles,
} from 'lucide-react';
import { api } from '../lib/api';
import type { CurrencyDetails, CurrencySummary, RatesOverview, TrendDirection } from '../types';

const FEATURED_CURRENCIES = ['USD', 'EUR', 'RUB', 'GBP', 'CNY', 'JPY', 'KZT', 'TRY'];
const DEFAULT_CURRENCY = 'USD';

function formatNumber(value: number | null, minimumFractionDigits = 0): string {
  if (value === null) {
    return '-';
  }

  return value.toLocaleString('uz-UZ', {
    minimumFractionDigits,
    maximumFractionDigits: 2,
  });
}

function trendMeta(trend: TrendDirection) {
  if (trend === 'up') {
    return {
      icon: ArrowUpRight,
      chip: 'bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-500/20',
      card: 'from-emerald-500/18 via-emerald-500/6 to-transparent',
      label: 'Oshgan',
    };
  }

  if (trend === 'down') {
    return {
      icon: ArrowDownRight,
      chip: 'bg-rose-500/15 text-rose-300 ring-1 ring-rose-500/20',
      card: 'from-rose-500/18 via-rose-500/6 to-transparent',
      label: 'Pasaygan',
    };
  }

  return {
    icon: Minus,
    chip: 'bg-slate-500/15 text-slate-300 ring-1 ring-slate-500/20',
    card: 'from-slate-500/16 via-slate-500/6 to-transparent',
    label: "O'zgarmagan",
  };
}

export default function RatesPage() {
  const [overview, setOverview] = useState<RatesOverview | null>(null);
  const [currencyDetails, setCurrencyDetails] = useState<CurrencyDetails | null>(null);
  const [selectedCurrency, setSelectedCurrency] = useState(DEFAULT_CURRENCY);
  const [search, setSearch] = useState('');
  const [loadingOverview, setLoadingOverview] = useState(true);
  const [loadingDetails, setLoadingDetails] = useState(true);

  useEffect(() => {
    void Promise.all([loadOverview(), loadCurrencyDetails(DEFAULT_CURRENCY)]);
  }, []);

  const loadOverview = async () => {
    setLoadingOverview(true);
    try {
      const { data } = await api.get('/rates/overview');
      setOverview(data.data);
    } catch {
      setOverview(null);
    } finally {
      setLoadingOverview(false);
    }
  };

  const loadCurrencyDetails = async (code: string) => {
    setSelectedCurrency(code);
    setLoadingDetails(true);
    try {
      const { data } = await api.get(`/rates/${code}`);
      setCurrencyDetails(data.data);
    } catch {
      setCurrencyDetails(null);
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleRefresh = async () => {
    await Promise.all([loadOverview(), loadCurrencyDetails(selectedCurrency)]);
  };

  const filteredCurrencies = overview?.currencies.filter((currency) => {
    const needle = search.toLowerCase();
    return (
      currency.code.toLowerCase().includes(needle) ||
      currency.currency.toLowerCase().includes(needle)
    );
  }) || [];

  const selectedSummary = currencyDetails?.summary;
  const selectedTrend = selectedSummary ? trendMeta(selectedSummary.trend) : trendMeta('flat');
  const selectedRows = currencyDetails?.rows || [];
  const SelectedTrendIcon = selectedTrend.icon;

  return (
    <div className="animate-slide-up space-y-6 p-6">
      <section className="card overflow-hidden border-surface-700/70 bg-[radial-gradient(circle_at_top_left,_rgba(16,185,129,0.18),_transparent_36%),radial-gradient(circle_at_top_right,_rgba(245,158,11,0.16),_transparent_34%),linear-gradient(180deg,_rgba(15,23,42,0.98),_rgba(8,13,26,0.98))] p-6 md:p-8">
        <div className="flex flex-col gap-8 xl:flex-row xl:items-end xl:justify-between">
          <div className="max-w-2xl space-y-4">
            <span className="inline-flex w-fit items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-emerald-300">
              <Sparkles className="h-3.5 w-3.5" />
              Currency Intelligence
            </span>
            <div>
              <h1 className="font-display text-3xl font-bold tracking-tight text-slate-50 md:text-4xl">
                Barcha CBU kurslari va bank coverage bir joyda
              </h1>
              <p className="mt-3 max-w-xl text-sm leading-6 text-slate-300 md:text-base">
                Markaziy bankdagi har bir valyuta uchun nechta bank kurs berganini, eng yaxshi xarid
                va sotish nuqtalarini hamda trendni bir ekranda kuzatishingiz mumkin.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 md:min-w-[360px]">
            <div className="rounded-3xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm">
              <p className="text-xs uppercase tracking-[0.22em] text-slate-400">CBU valyutalari</p>
              <p className="mt-3 font-display text-3xl font-bold text-slate-50">
                {overview?.market.totalCurrencies || 0}
              </p>
            </div>
            <div className="rounded-3xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm">
              <p className="text-xs uppercase tracking-[0.22em] text-slate-400">Faol banklar</p>
              <p className="mt-3 font-display text-3xl font-bold text-slate-50">
                {overview?.market.reportingBanks || 0}/{overview?.market.commercialBanks || 0}
              </p>
            </div>
            <div className="rounded-3xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm">
              <p className="text-xs uppercase tracking-[0.22em] text-slate-400">Tanlangan valyuta</p>
              <p className="mt-3 font-display text-3xl font-bold text-slate-50">{selectedCurrency}</p>
            </div>
            <div className="rounded-3xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm">
              <p className="text-xs uppercase tracking-[0.22em] text-slate-400">Oxirgi snapshot</p>
              <p className="mt-3 text-sm font-medium text-slate-100">
                {selectedSummary?.date || overview?.currencies[0]?.date || '-'}
              </p>
            </div>
          </div>
        </div>

        <div className="mt-8 flex flex-wrap gap-2">
          {FEATURED_CURRENCIES.map((currency) => (
            <button
              key={currency}
              onClick={() => void loadCurrencyDetails(currency)}
              className={`rounded-full px-4 py-2 font-mono text-sm font-semibold transition-all ${
                selectedCurrency === currency
                  ? 'bg-slate-50 text-slate-900 shadow-lg shadow-emerald-500/10'
                  : 'border border-white/10 bg-white/5 text-slate-200 hover:border-emerald-400/30 hover:bg-white/10'
              }`}
            >
              {currency}
            </button>
          ))}

          <button onClick={() => void handleRefresh()} className="btn-secondary ml-auto">
            <RefreshCw className={`h-4 w-4 ${loadingOverview || loadingDetails ? 'animate-spin' : ''}`} />
            Yangilash
          </button>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.35fr_0.95fr]">
        <div className={`card overflow-hidden bg-gradient-to-br ${selectedTrend.card} p-6`}>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium ${selectedTrend.chip}`}>
                <SelectedTrendIcon className="h-3.5 w-3.5" />
                {selectedTrend.label}
              </div>
              <h2 className="mt-4 font-display text-3xl font-bold text-slate-50">
                {selectedSummary ? selectedSummary.code : selectedCurrency}
              </h2>
              <p className="mt-1 text-sm text-slate-400">
                {selectedSummary?.currency || 'Tanlangan valyuta uchun maʼlumot yuklanmoqda'}
              </p>
            </div>
            <div className="rounded-3xl border border-white/10 bg-slate-950/40 px-4 py-3 text-right">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500">MB kursi</p>
              <p className="mt-2 font-mono text-3xl font-semibold text-slate-50">
                {selectedSummary ? formatNumber(selectedSummary.cbRate, 2) : '-'}
              </p>
              <p className="mt-2 text-sm text-slate-300">
                {selectedSummary ? `${selectedSummary.diff > 0 ? '+' : ''}${formatNumber(selectedSummary.diff, 2)}` : '-'}
              </p>
            </div>
          </div>

          <div className="mt-8 grid gap-3 sm:grid-cols-3">
            <div className="rounded-3xl border border-white/10 bg-slate-950/35 p-4">
              <p className="text-xs uppercase tracking-[0.22em] text-slate-500">Eng yaxshi xarid</p>
              <p className="mt-3 font-mono text-2xl font-semibold text-emerald-300">
                {formatNumber(selectedSummary?.bestBuy ?? null)}
              </p>
            </div>
            <div className="rounded-3xl border border-white/10 bg-slate-950/35 p-4">
              <p className="text-xs uppercase tracking-[0.22em] text-slate-500">Eng yaxshi sotish</p>
              <p className="mt-3 font-mono text-2xl font-semibold text-amber-300">
                {formatNumber(selectedSummary?.bestSell ?? null)}
              </p>
            </div>
            <div className="rounded-3xl border border-white/10 bg-slate-950/35 p-4">
              <p className="text-xs uppercase tracking-[0.22em] text-slate-500">Coverage</p>
              <p className="mt-3 font-display text-2xl font-semibold text-slate-50">
                {selectedSummary ? `${selectedSummary.reportingBanks}/${selectedSummary.totalBanks}` : '-'}
              </p>
              <p className="mt-1 text-xs text-slate-400">
                {selectedSummary ? `${selectedSummary.coveragePercent}% bank` : 'Maʼlumot kutilmoqda'}
              </p>
            </div>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
          <div className="card p-5">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-3 text-emerald-300">
                <Landmark className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-slate-500">O'rtacha xarid</p>
                <p className="mt-1 font-mono text-2xl font-semibold text-slate-50">
                  {formatNumber(selectedSummary?.averageBuy ?? null)}
                </p>
              </div>
            </div>
          </div>

          <div className="card p-5">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl border border-amber-500/20 bg-amber-500/10 p-3 text-amber-300">
                <Building2 className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-slate-500">O'rtacha sotish</p>
                <p className="mt-1 font-mono text-2xl font-semibold text-slate-50">
                  {formatNumber(selectedSummary?.averageSell ?? null)}
                </p>
              </div>
            </div>
          </div>

          <div className="card p-5 sm:col-span-2 xl:col-span-1">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Kurs chiqmagan banklar</p>
            <p className="mt-3 text-sm leading-6 text-slate-300">
              {currencyDetails?.missingBanks.length
                ? currencyDetails.missingBanks.join(', ')
                : "Barcha faol banklardan kurs kelgan yoki ma'lumot hali yangilanmoqda."}
            </p>
          </div>
        </div>
      </section>

      <section className="card p-6">
        <div className="mb-5 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="font-display text-xl font-semibold text-slate-100">
              {selectedCurrency} bo'yicha bank taqqoslash
            </h2>
            <p className="mt-1 text-sm text-slate-400">
              Faol banklar kesimida mavjud kurslar va bo'sh coverage joylari.
            </p>
          </div>
          <span className="inline-flex w-fit rounded-full border border-surface-700 bg-surface-800/80 px-3 py-1 text-xs font-medium text-slate-300">
            {selectedRows.filter((row) => !row.bank.isCentral && row.hasRate).length} ta bank javob berdi
          </span>
        </div>

        {loadingDetails ? (
          <div className="flex h-48 items-center justify-center">
            <RefreshCw className="h-5 w-5 animate-spin text-slate-500" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-surface-800 text-left text-slate-500">
                  <th className="pb-3 pr-6">Bank</th>
                  <th className="pb-3 pr-6">Xarid</th>
                  <th className="pb-3 pr-6">Sotish</th>
                  <th className="pb-3 pr-6">Spread</th>
                  <th className="pb-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-800/60">
                {selectedRows.map((row) => (
                  <tr
                    key={row.bank.code}
                    className={`transition-colors hover:bg-surface-800/40 ${row.bank.isCentral ? 'bg-emerald-500/6' : ''}`}
                  >
                    <td className="py-3 pr-6">
                      <div className="flex items-center gap-3">
                        <div className={`rounded-2xl border px-2.5 py-1 font-mono text-xs ${
                          row.bank.isCentral
                            ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-300'
                            : 'border-surface-700 bg-surface-800 text-slate-400'
                        }`}>
                          {row.bank.code.toUpperCase().slice(0, 3)}
                        </div>
                        <div>
                          <p className="font-medium text-slate-200">{row.bank.nameUz}</p>
                          {row.bank.isCentral && <p className="text-xs text-slate-500">Markaziy bank</p>}
                        </div>
                      </div>
                    </td>
                    <td className="py-3 pr-6 font-mono text-emerald-300">{formatNumber(row.buyRate)}</td>
                    <td className="py-3 pr-6 font-mono text-amber-300">{formatNumber(row.sellRate)}</td>
                    <td className="py-3 pr-6 font-mono text-slate-300">{formatNumber(row.spread)}</td>
                    <td className="py-3">
                      {row.hasRate ? (
                        <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-300">
                          Yangilangan
                        </span>
                      ) : (
                        <span className="rounded-full bg-slate-500/10 px-3 py-1 text-xs font-medium text-slate-400">
                          Kutilmoqda
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="card p-6">
        <div className="mb-5 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="font-display text-xl font-semibold text-slate-100">
              Markaziy bankning barcha valyutalari
            </h2>
            <p className="mt-1 text-sm text-slate-400">
              CBU kursi, kunlik trend va qaysi valyuta nechta bankda borligi.
            </p>
          </div>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="USD, yuan, yen..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="input w-60 py-2.5 pl-9 text-sm"
            />
          </div>
        </div>

        {loadingOverview ? (
          <div className="flex h-40 items-center justify-center">
            <RefreshCw className="h-5 w-5 animate-spin text-slate-500" />
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
            {filteredCurrencies.map((currency) => {
              const meta = trendMeta(currency.trend);
              const Icon = meta.icon;

              return (
                <button
                  key={currency.code}
                  onClick={() => void loadCurrencyDetails(currency.code)}
                  className={`rounded-3xl border p-4 text-left transition-all ${
                    selectedCurrency === currency.code
                      ? 'border-emerald-400/30 bg-emerald-500/10 shadow-lg shadow-emerald-900/20'
                      : 'border-surface-800 bg-surface-900/90 hover:border-surface-700 hover:bg-surface-900'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-mono text-sm font-bold tracking-[0.16em] text-slate-200">
                        {currency.code}
                      </p>
                      <p className="mt-1 truncate text-xs text-slate-500">{currency.currency}</p>
                    </div>
                    <span className={`inline-flex rounded-full p-2 ${meta.chip}`}>
                      <Icon className="h-4 w-4" />
                    </span>
                  </div>

                  <p className="mt-5 font-mono text-2xl font-semibold text-slate-50">
                    {formatNumber(currency.cbRate, 2)}
                  </p>
                  <div className="mt-2 flex items-center justify-between text-xs text-slate-400">
                    <span>
                      {currency.diff > 0 ? '+' : ''}
                      {formatNumber(currency.diff, 2)}
                    </span>
                    <span>{currency.coveragePercent}% coverage</span>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </section>

      <section className="card p-6">
        <div className="mb-5 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="font-display text-xl font-semibold text-slate-100">Bank coverage leaderboard</h2>
            <p className="mt-1 text-sm text-slate-400">
              Har bir bank nechta valyuta kursini berayotganini ko'rsatadi.
            </p>
          </div>
          <span className="text-xs uppercase tracking-[0.2em] text-slate-500">
            {overview?.market.totalCurrencies || 0} ta CBU valyutasi asosida
          </span>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {(overview?.banks || []).map((bank) => (
            <article
              key={bank.bank.code}
              className="rounded-3xl border border-surface-800 bg-[linear-gradient(180deg,_rgba(15,23,42,0.95),_rgba(8,13,26,0.95))] p-5"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-display text-lg font-semibold text-slate-100">{bank.bank.nameUz}</p>
                  <p className="mt-1 text-xs uppercase tracking-[0.18em] text-slate-500">
                    {bank.ratesCount}/{bank.totalCurrencies} ta kurs
                  </p>
                </div>
                <span className="rounded-full border border-amber-500/20 bg-amber-500/10 px-3 py-1 text-xs font-medium text-amber-300">
                  {bank.coveragePercent}%
                </span>
              </div>

              <div className="mt-4 h-2 overflow-hidden rounded-full bg-surface-800">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-emerald-400 via-amber-300 to-amber-400"
                  style={{ width: `${bank.coveragePercent}%` }}
                />
              </div>

              <div className="mt-4 flex items-center justify-between text-xs text-slate-400">
                <span>Yo'q valyutalar: {bank.missingCurrencies}</span>
                <span>{bank.lastUpdated ? new Date(bank.lastUpdated).toLocaleDateString('uz-UZ') : '-'}</span>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                {bank.supportedCurrencies.slice(0, 6).map((currency) => (
                  <span
                    key={`${bank.bank.code}-${currency}`}
                    className="rounded-full border border-surface-700 bg-surface-800 px-2.5 py-1 font-mono text-[11px] text-slate-300"
                  >
                    {currency}
                  </span>
                ))}
                {bank.supportedCurrencies.length > 6 && (
                  <span className="rounded-full border border-surface-700 bg-surface-800 px-2.5 py-1 text-[11px] text-slate-500">
                    +{bank.supportedCurrencies.length - 6}
                  </span>
                )}
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
