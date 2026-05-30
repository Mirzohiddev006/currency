import { startTransition, useEffect, useMemo, useState } from 'react';
import {
  ArrowDownRight,
  ArrowUpRight,
  Building2,
  ExternalLink,
  RefreshCw,
  Search,
  Sparkles,
  WalletCards,
  Waves,
} from 'lucide-react';
import { api } from '../lib/api';
import type { BankBoard, BankBoardRow, BankDetails } from '../types';

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

function bankInitials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((chunk) => chunk[0]?.toUpperCase() || '')
    .join('');
}

function BankLogo({
  src,
  name,
  className,
  imageClassName,
  textClassName,
}: {
  src?: string | null;
  name: string;
  className: string;
  imageClassName?: string;
  textClassName?: string;
}) {
  const [imageFailed, setImageFailed] = useState(false);
  const initials = bankInitials(name);

  useEffect(() => {
    setImageFailed(false);
  }, [src]);

  return (
    <div className={className}>
      {src && !imageFailed ? (
        <img
          src={src}
          alt={name}
          className={imageClassName || 'h-full w-full object-contain'}
          onError={() => setImageFailed(true)}
        />
      ) : (
        <span className={textClassName || 'font-display text-lg font-semibold text-slate-100'}>
          {initials || 'BK'}
        </span>
      )}
    </div>
  );
}

export default function BanksPage() {
  const [board, setBoard] = useState<BankBoard | null>(null);
  const [details, setDetails] = useState<BankDetails | null>(null);
  const [search, setSearch] = useState('');
  const [selectedBankCode, setSelectedBankCode] = useState<string | null>(null);
  const [loadingBoard, setLoadingBoard] = useState(true);
  const [loadingDetails, setLoadingDetails] = useState(true);

  useEffect(() => {
    void loadBoard();
  }, []);

  useEffect(() => {
    if (!selectedBankCode) {
      return;
    }

    void loadDetails(selectedBankCode);
  }, [selectedBankCode]);

  const loadBoard = async (preferredCode?: string) => {
    setLoadingBoard(true);

    try {
      const { data } = await api.get('/banks', {
        params: { currency: DEFAULT_CURRENCY },
      });

      const nextBoard: BankBoard = data.data;
      setBoard(nextBoard);
      setSelectedBankCode((current) => {
        if (preferredCode && nextBoard.banks.some((bank) => bank.bank.code === preferredCode)) {
          return preferredCode;
        }

        if (current && nextBoard.banks.some((bank) => bank.bank.code === current)) {
          return current;
        }

        return nextBoard.banks.find((bank) => bank.hasRate)?.bank.code || nextBoard.banks[0]?.bank.code || null;
      });
    } catch {
      setBoard(null);
      setSelectedBankCode(null);
    } finally {
      setLoadingBoard(false);
    }
  };

  const loadDetails = async (bankCode: string) => {
    setLoadingDetails(true);

    try {
      const { data } = await api.get(`/banks/${bankCode}`);
      setDetails(data.data);
    } catch {
      setDetails(null);
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleSelectBank = (bankCode: string) => {
    startTransition(() => {
      setSelectedBankCode(bankCode);
    });
  };

  const filteredBanks = useMemo(() => {
    const needle = search.toLowerCase().trim();
    if (!needle) {
      return board?.banks || [];
    }

    return (board?.banks || []).filter((item) => {
      const haystack = `${item.bank.name} ${item.bank.nameUz} ${item.bank.code}`.toLowerCase();
      return haystack.includes(needle);
    });
  }, [board?.banks, search]);

  const selectedBoardRow =
    board?.banks.find((item) => item.bank.code === selectedBankCode) || filteredBanks[0] || null;

  return (
    <div className="animate-slide-up space-y-6 p-6">
      <section className="card overflow-hidden border-surface-700/70 bg-[radial-gradient(circle_at_top_left,_rgba(14,165,233,0.18),_transparent_32%),radial-gradient(circle_at_top_right,_rgba(245,158,11,0.16),_transparent_34%),linear-gradient(180deg,_rgba(15,23,42,0.98),_rgba(8,13,26,0.98))] p-6 md:p-8">
        <div className="flex flex-col gap-8 xl:flex-row xl:items-end xl:justify-between">
          <div className="max-w-3xl space-y-4">
            <span className="inline-flex w-fit items-center gap-2 rounded-full border border-sky-400/20 bg-sky-400/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-sky-300">
              <Sparkles className="h-3.5 w-3.5" />
              Bank Atlas
            </span>
            <div>
              <h1 className="font-display text-3xl font-bold tracking-tight text-slate-50 md:text-4xl">
                O'zbekistondagi 30 ta bankning bugungi dollar kursi
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300 md:text-base">
                Sahifa ochilishi bilan kamida 30 ta bankning bugungi USD kursi ko'rinadi. Istalgan
                bankni bossangiz, rasmi va o'sha bankdagi mavjud valyutalarning joriy holati darhol
                yon panelda chiqadi.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 md:min-w-[360px]">
            <div className="rounded-3xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Banklar</p>
              <p className="mt-3 font-display text-3xl font-bold text-slate-50">
                {board?.totalBanks || 0}
              </p>
            </div>
            <div className="rounded-3xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Kurs berganlar</p>
              <p className="mt-3 font-display text-3xl font-bold text-slate-50">
                {board?.reportingBanks || 0}/{board?.totalBanks || 0}
              </p>
            </div>
            <div className="rounded-3xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Standart valyuta</p>
              <p className="mt-3 font-display text-3xl font-bold text-slate-50">
                {board?.currency || DEFAULT_CURRENCY}
              </p>
            </div>
            <div className="rounded-3xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Tanlangan bank</p>
              <p className="mt-3 text-sm font-medium leading-5 text-slate-100">
                {selectedBoardRow?.bank.nameUz || 'Bank tanlanmagan'}
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-5 xl:grid-cols-[1.05fr_0.95fr]">
        <div className="card overflow-hidden p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/15 bg-amber-500/10 px-3 py-1 text-xs font-medium uppercase tracking-[0.2em] text-amber-300">
                <Waves className="h-3.5 w-3.5" />
                Bugungi USD board
              </div>
              <h2 className="mt-4 font-display text-2xl font-semibold text-slate-50">
                Banklar ro'yxati
              </h2>
              <p className="mt-2 text-sm text-slate-400">
                Default holatda barcha banklarning dollar xarid va sotish kursi.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Bank qidiring..."
                  className="input w-full py-2.5 pl-9 text-sm sm:w-60"
                />
              </div>

              <button onClick={() => void loadBoard(selectedBankCode || undefined)} className="btn-secondary">
                <RefreshCw className={`h-4 w-4 ${loadingBoard ? 'animate-spin' : ''}`} />
                Yangilash
              </button>
            </div>
          </div>

          <div className="mt-5 flex items-center justify-between rounded-3xl border border-surface-800 bg-surface-950/45 px-4 py-3 text-xs text-slate-400">
            <span>
              {board?.date ? `${board.date} holatiga ko'ra` : "Bugungi ma'lumot yangilanmoqda"}
            </span>
            <span>{filteredBanks.length} ta bank ko'rinyapti</span>
          </div>

          {loadingBoard ? (
            <div className="flex h-80 items-center justify-center">
              <RefreshCw className="h-5 w-5 animate-spin text-slate-500" />
            </div>
          ) : (
            <div className="mt-5 max-h-[calc(100vh-270px)] space-y-3 overflow-y-auto pr-1">
              {filteredBanks.map((item) => {
                const isSelected = item.bank.code === selectedBankCode;

                return (
                  <button
                    key={item.bank.code}
                    onClick={() => handleSelectBank(item.bank.code)}
                    className={`w-full rounded-[28px] border p-4 text-left transition-all ${
                      isSelected
                        ? 'border-sky-400/30 bg-[linear-gradient(135deg,_rgba(14,165,233,0.16),_rgba(245,158,11,0.10))] shadow-[0_24px_80px_-52px_rgba(56,189,248,0.45)]'
                        : 'border-surface-800 bg-surface-900/85 hover:border-surface-700 hover:bg-surface-900'
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      <BankLogo
                        src={item.bank.logoUrl}
                        name={item.bank.nameUz}
                        className={`flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-3xl border ${
                          isSelected
                            ? 'border-white/20 bg-white/10'
                            : 'border-surface-700 bg-surface-950/60'
                        }`}
                        imageClassName="h-10 w-10 object-contain"
                        textClassName="font-display text-lg font-semibold text-slate-100"
                      />

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="truncate font-display text-lg font-semibold text-slate-100">
                            {item.bank.nameUz}
                          </p>
                          <span className="rounded-full border border-surface-700 bg-surface-950/65 px-2.5 py-1 font-mono text-[11px] text-slate-400">
                            {item.bank.code.toUpperCase()}
                          </span>
                          {item.hasRate ? (
                            <span className="rounded-full bg-emerald-500/10 px-2.5 py-1 text-[11px] font-medium text-emerald-300">
                              Faol
                            </span>
                          ) : (
                            <span className="rounded-full bg-slate-500/10 px-2.5 py-1 text-[11px] font-medium text-slate-400">
                              Kutilmoqda
                            </span>
                          )}
                        </div>

                        <div className="mt-4 grid gap-3 sm:grid-cols-3">
                          <div className="rounded-2xl border border-surface-800 bg-surface-950/55 p-3">
                            <p className="text-[11px] uppercase tracking-[0.18em] text-slate-500">Xarid</p>
                            <p className="mt-2 font-mono text-xl font-semibold text-emerald-300">
                              {formatNumber(item.buyRate)}
                            </p>
                          </div>
                          <div className="rounded-2xl border border-surface-800 bg-surface-950/55 p-3">
                            <p className="text-[11px] uppercase tracking-[0.18em] text-slate-500">Sotish</p>
                            <p className="mt-2 font-mono text-xl font-semibold text-amber-300">
                              {formatNumber(item.sellRate)}
                            </p>
                          </div>
                          <div className="rounded-2xl border border-surface-800 bg-surface-950/55 p-3">
                            <p className="text-[11px] uppercase tracking-[0.18em] text-slate-500">Valyuta soni</p>
                            <p className="mt-2 font-display text-xl font-semibold text-slate-50">
                              {item.availableCurrencies}
                            </p>
                          </div>
                        </div>

                        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400">
                          <span>
                            Spread: <span className="font-mono text-slate-300">{formatNumber(item.spread)}</span>
                          </span>
                          <span>
                            {item.lastUpdated
                              ? new Date(item.lastUpdated).toLocaleString('uz-UZ')
                              : "Bugungi kurs hali kelmagan"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}

              {!filteredBanks.length && (
                <div className="rounded-3xl border border-dashed border-surface-700 bg-surface-950/40 px-6 py-10 text-center text-sm text-slate-400">
                  Qidiruv bo'yicha bank topilmadi.
                </div>
              )}
            </div>
          )}
        </div>

        <div className="card overflow-hidden border-surface-800 bg-[radial-gradient(circle_at_top_right,_rgba(14,165,233,0.14),_transparent_32%),linear-gradient(180deg,_rgba(15,23,42,0.98),_rgba(8,13,26,0.98))] p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/15 bg-emerald-500/10 px-3 py-1 text-xs font-medium uppercase tracking-[0.2em] text-emerald-300">
                <WalletCards className="h-3.5 w-3.5" />
                Bank detail
              </div>
              <h2 className="mt-4 font-display text-2xl font-semibold text-slate-50">
                {details?.bank.nameUz || selectedBoardRow?.bank.nameUz || 'Bank tanlang'}
              </h2>
              <p className="mt-2 text-sm text-slate-400">
                Bankning rasmi va hozir mavjud barcha valyutalari.
              </p>
            </div>
            {details?.bank.website && (
              <a
                href={details.bank.website}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-full border border-surface-700 bg-surface-950/55 px-3 py-2 text-xs font-medium text-slate-300 transition-colors hover:border-sky-400/25 hover:text-sky-300"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                Sayt
              </a>
            )}
          </div>

          <div className="mt-6 rounded-[32px] border border-white/10 bg-white/5 p-5">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-center">
              <BankLogo
                src={details?.bank.logoUrl || selectedBoardRow?.bank.logoUrl}
                name={details?.bank.nameUz || selectedBoardRow?.bank.nameUz || 'Bank'}
                className="flex h-28 w-28 items-center justify-center rounded-[32px] border border-white/10 bg-slate-950/55"
                imageClassName="h-16 w-16 object-contain"
                textClassName="font-display text-3xl font-bold text-slate-100"
              />

              <div className="grid flex-1 gap-3 sm:grid-cols-3">
                <div className="rounded-3xl border border-white/10 bg-slate-950/40 p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-500">USD xarid</p>
                  <p className="mt-3 font-mono text-2xl font-semibold text-emerald-300">
                    {formatNumber(details?.summary.usdBuyRate ?? selectedBoardRow?.buyRate ?? null)}
                  </p>
                </div>
                <div className="rounded-3xl border border-white/10 bg-slate-950/40 p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-500">USD sotish</p>
                  <p className="mt-3 font-mono text-2xl font-semibold text-amber-300">
                    {formatNumber(details?.summary.usdSellRate ?? selectedBoardRow?.sellRate ?? null)}
                  </p>
                </div>
                <div className="rounded-3xl border border-white/10 bg-slate-950/40 p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Valyutalar</p>
                  <p className="mt-3 font-display text-2xl font-semibold text-slate-50">
                    {details?.summary.currencyCount ?? selectedBoardRow?.availableCurrencies ?? 0}
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-3xl border border-surface-800 bg-surface-950/45 px-4 py-3 text-xs text-slate-400">
              <span>
                {details?.summary.lastUpdated
                  ? `Yangilangan: ${new Date(details.summary.lastUpdated).toLocaleString('uz-UZ')}`
                  : "Yangilanish vaqti yo'q"}
              </span>
              <span>
                USD spread:{' '}
                <span className="font-mono text-slate-200">
                  {formatNumber(details?.summary.usdSpread ?? selectedBoardRow?.spread ?? null)}
                </span>
              </span>
            </div>
          </div>

          {loadingDetails ? (
            <div className="flex h-72 items-center justify-center">
              <RefreshCw className="h-5 w-5 animate-spin text-slate-500" />
            </div>
          ) : details ? (
            <div className="mt-6 space-y-3">
              <div className="flex items-center justify-between text-xs uppercase tracking-[0.2em] text-slate-500">
                <span>Mavjud valyutalar</span>
                <span>{details.currencies.length} ta</span>
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                {details.currencies.map((currency) => (
                  <article
                    key={`${details.bank.code}-${currency.code}`}
                    className="rounded-[26px] border border-surface-800 bg-surface-950/45 p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-mono text-sm font-bold tracking-[0.18em] text-slate-200">
                          {currency.code}
                        </p>
                        <p className="mt-1 text-xs leading-5 text-slate-400">{currency.currency}</p>
                      </div>
                      <span className="rounded-full border border-surface-700 bg-surface-900 px-2.5 py-1 text-[11px] text-slate-400">
                        MB {formatNumber(currency.cbRate, 2)}
                      </span>
                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-3">
                      <div className="rounded-2xl border border-emerald-500/12 bg-emerald-500/8 p-3">
                        <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-emerald-300">
                          <ArrowDownRight className="h-3.5 w-3.5" />
                          Xarid
                        </div>
                        <p className="mt-2 font-mono text-lg font-semibold text-emerald-200">
                          {formatNumber(currency.buyRate)}
                        </p>
                      </div>
                      <div className="rounded-2xl border border-amber-500/12 bg-amber-500/8 p-3">
                        <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-amber-300">
                          <ArrowUpRight className="h-3.5 w-3.5" />
                          Sotish
                        </div>
                        <p className="mt-2 font-mono text-lg font-semibold text-amber-200">
                          {formatNumber(currency.sellRate)}
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 flex items-center justify-between text-xs text-slate-400">
                      <span>
                        Spread <span className="font-mono text-slate-300">{formatNumber(currency.spread)}</span>
                      </span>
                      <span>
                        {currency.lastUpdated
                          ? new Date(currency.lastUpdated).toLocaleDateString('uz-UZ')
                          : '-'}
                      </span>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          ) : (
            <div className="mt-6 rounded-3xl border border-dashed border-surface-700 bg-surface-950/40 px-6 py-12 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-surface-700 bg-surface-900 text-slate-400">
                <Building2 className="h-6 w-6" />
              </div>
              <p className="mt-4 text-sm text-slate-400">
                Bank detaili yuklanmadi. Boshqa bankni tanlab yoki qayta yangilab ko'ring.
              </p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
