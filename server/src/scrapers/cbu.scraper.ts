// ════════════════════════════════════════════════════════════
// CBU SCRAPER — Central Bank of Uzbekistan API client
// ════════════════════════════════════════════════════════════

import { cbuHttpClient } from '../lib/http-client';
import { withRetry } from '../lib/retry';
import { logger } from '../config/logger';
import { PRIORITY_CURRENCIES } from '../config/banks';
import { CBURateResponse } from '../types';

export async function fetchCBURates(): Promise<CBURateResponse[]> {
  return withRetry(
    async () => {
      const response = await cbuHttpClient.get<CBURateResponse[]>(
        'https://cbu.uz/uz/arkhiv-kursov-valyut/json/'
      );

      if (!Array.isArray(response.data) || response.data.length === 0) {
        throw new Error('CBU API bo\'sh yoki noto\'g\'ri javob qaytardi');
      }

      return sortByPriority(response.data);
    },
    { maxRetries: 3, label: 'CBU API' }
  );
}

export async function fetchCBURateByDate(date: string): Promise<CBURateResponse[]> {
  return withRetry(
    async () => {
      const response = await cbuHttpClient.get<CBURateResponse[]>(
        `https://cbu.uz/uz/arkhiv-kursov-valyut/json/${date}/`
      );
      return response.data;
    },
    { maxRetries: 2, label: `CBU API (${date})` }
  );
}

function sortByPriority(rates: CBURateResponse[]): CBURateResponse[] {
  return rates.sort((a, b) => {
    const aIdx = PRIORITY_CURRENCIES.indexOf(a.Ccy);
    const bIdx = PRIORITY_CURRENCIES.indexOf(b.Ccy);
    if (aIdx !== -1 && bIdx !== -1) return aIdx - bIdx;
    if (aIdx !== -1) return -1;
    if (bIdx !== -1) return 1;
    return a.Ccy.localeCompare(b.Ccy);
  });
}
