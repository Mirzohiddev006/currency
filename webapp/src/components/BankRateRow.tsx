import { CheckCircle2, XCircle } from 'lucide-react';
import { formatRate, getSpreadColor } from '../lib/utils';
import type { CurrencyDetailsRow } from '../types';

interface BankRateRowProps {
  row: CurrencyDetailsRow;
  index: number;
}

export function BankRateRow({ row, index }: BankRateRowProps) {
  const isCentral = row.bank.isCentral;

  return (
    <tr
      className={`
        border-b border-slate-100 last:border-0 transition-colors duration-150
        ${isCentral ? 'bg-emerald-50/50' : index % 2 === 0 ? 'bg-white' : 'bg-slate-50/40'}
        hover:bg-emerald-50/30
      `}
    >
      {/* Bank name */}
      <td className="py-3 pl-4 pr-2">
        <div className="flex items-center gap-2">
          <div className="min-w-0">
            <p
              className={`text-sm font-medium truncate max-w-[150px] ${
                isCentral ? 'text-emerald-700' : 'text-slate-700'
              }`}
              title={row.bank.nameUz || row.bank.name}
            >
              {row.bank.nameUz || row.bank.name}
            </p>
            {isCentral && (
              <span className="inline-block text-[10px] font-semibold text-emerald-600 bg-emerald-100 border border-emerald-200 px-1.5 py-0 rounded-full mt-0.5">
                CBU
              </span>
            )}
          </div>
        </div>
      </td>

      {/* Buy rate */}
      <td className="py-3 px-2 text-right">
        {row.buyRate !== null ? (
          <span className="text-sm font-semibold text-emerald-700 tabular-nums">
            {formatRate(row.buyRate, 2)}
          </span>
        ) : (
          <span className="text-sm text-slate-300">—</span>
        )}
      </td>

      {/* Sell rate */}
      <td className="py-3 px-2 text-right">
        {row.sellRate !== null ? (
          <span className="text-sm font-semibold text-slate-700 tabular-nums">
            {formatRate(row.sellRate, 2)}
          </span>
        ) : (
          <span className="text-sm text-slate-300">—</span>
        )}
      </td>

      {/* Spread */}
      <td className="py-3 px-2 text-right">
        <span
          className={`text-sm font-medium tabular-nums ${getSpreadColor(row.spread)}`}
        >
          {row.spread !== null ? formatRate(row.spread, 2) : '—'}
        </span>
      </td>

      {/* Has rate indicator */}
      <td className="py-3 pl-2 pr-4 text-center">
        {row.hasRate ? (
          <CheckCircle2 className="w-4 h-4 text-emerald-500 mx-auto" />
        ) : (
          <XCircle className="w-4 h-4 text-slate-300 mx-auto" />
        )}
      </td>
    </tr>
  );
}
