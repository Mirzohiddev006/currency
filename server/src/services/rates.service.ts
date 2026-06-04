import { Bank, ExchangeRate } from "@prisma/client";
import { BANKS_SEED, PRIORITY_CURRENCIES } from "../config/banks";
import { logger } from "../config/logger";
import { cacheGetOrSet, cacheInvalidatePattern } from "../lib/cache";
import { NotFoundError } from "../lib/errors";
import { fetchCBURates } from "../scrapers/cbu.scraper";
import { scrapeAllBanks, scrapeBank } from "../scrapers/banks.scraper";
import { ratesRepository } from "../repositories";
import {
  BankCoverageSummary,
  BankBoard,
  BankBoardRow,
  BankDetails,
  CACHE_KEYS,
  CACHE_TTL,
  CBURateResponse,
  CurrencyDetails,
  CurrencyDetailsRow,
  CurrencySummary,
  RatesOverview,
  RefreshResult,
  TrendDirection,
} from "../types";

type LatestRateGroup = {
  bank: {
    id: string;
    code: string;
    name: string;
    nameUz: string;
    isCentral: boolean;
    website?: string | null;
    logoUrl?: string | null;
    isActive?: boolean;
  };
  rates: ExchangeRate[];
};

function average(values: number[]): number | null {
  if (values.length === 0) {
    return null;
  }

  return round(values.reduce((sum, value) => sum + value, 0) / values.length);
}

function isNumber(value: number | null | undefined): value is number {
  return typeof value === "number" && !Number.isNaN(value);
}

function round(value: number): number {
  return Number(value.toFixed(2));
}

function normalizeDate(value: Date | string | null | undefined): Date | null {
  if (!value) {
    return null;
  }

  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function toIsoString(value: Date | string | null | undefined): string | null {
  return normalizeDate(value)?.toISOString() || null;
}

function toTimestamp(value: Date | string | null | undefined): number | null {
  return normalizeDate(value)?.getTime() || null;
}

function normalizeCbuRate(rate: CBURateResponse) {
  const nominal = Number.parseInt(rate.Nominal, 10) || 1;

  return {
    code: rate.Ccy,
    currency: rate.CcyNm_UZ || rate.CcyNm_EN,
    cbRate: round(Number.parseFloat(rate.Rate) / nominal),
    diff: round(Number.parseFloat(rate.Diff) / nominal),
    nominal,
    date: rate.Date,
  };
}

function getTrend(diff: number): TrendDirection {
  if (diff > 0) return "up";
  if (diff < 0) return "down";
  return "flat";
}

function getSpread(
  buyRate: number | null,
  sellRate: number | null,
): number | null {
  if (!isNumber(buyRate) || !isNumber(sellRate)) {
    return null;
  }

  return round(sellRate - buyRate);
}

function getCoveragePercent(
  reportingBanks: number,
  totalBanks: number,
): number {
  if (totalBanks === 0) {
    return 0;
  }

  return round((reportingBanks / totalBanks) * 100);
}

function getLatestTimestamp(groups: LatestRateGroup[]): string | null {
  const timestamps = groups
    .flatMap((group) => group.rates)
    .map((rate) => toTimestamp(rate.date))
    .filter(isNumber);

  if (timestamps.length === 0) {
    return null;
  }

  return new Date(Math.max(...timestamps)).toISOString();
}

function compareCurrencyPriority(left: string, right: string): number {
  const leftIndex = PRIORITY_CURRENCIES.indexOf(left);
  const rightIndex = PRIORITY_CURRENCIES.indexOf(right);

  if (leftIndex !== -1 || rightIndex !== -1) {
    if (leftIndex === -1) return 1;
    if (rightIndex === -1) return -1;
    return leftIndex - rightIndex;
  }

  return left.localeCompare(right);
}

export class RatesService {
  async ensureBanksExist(): Promise<void> {
    for (const bank of BANKS_SEED) {
      await ratesRepository.upsertBank(bank);
    }

    logger.info("Banks seeded or verified");
  }

  async refreshAllRates(): Promise<RefreshResult> {
    const globalStart = Date.now();
    const errors: string[] = [];
    let cbuRatesCount = 0;

    logger.info("Starting full rates refresh");

    try {
      const cbuRates = await fetchCBURates();
      const cbuBank = await ratesRepository.getBankByCode("cbu");

      if (cbuBank) {
        const now = new Date();
        await ratesRepository.deleteTodaysRates(cbuBank.id);
        await ratesRepository.createManyRates(
          cbuRates.map((rate) => ({
            bankId: cbuBank.id,
            currency: rate.CcyNm_UZ || rate.CcyNm_EN,
            code: rate.Ccy,
            cbRate:
              Number.parseFloat(rate.Rate) /
              (Number.parseInt(rate.Nominal, 10) || 1),
            buyRate: null,
            sellRate: null,
            date: now,
          })),
        );

        await ratesRepository.createScrapeLog({
          bankCode: "cbu",
          status: "SUCCESS",
          ratesCount: cbuRates.length,
          duration: Date.now() - globalStart,
        });

        cbuRatesCount = cbuRates.length;
        logger.info(`CBU saved ${cbuRates.length} rates`);
      }
    } catch (error: any) {
      errors.push(`CBU: ${error.message}`);
      await ratesRepository.createScrapeLog({
        bankCode: "cbu",
        status: "FAILED",
        message: error.message,
      });
      logger.error("CBU fetch failed:", error);
    }

    const bankResults = await scrapeAllBanks();
    const processedResults = [];

    for (const result of bankResults) {
      const { bankCode, rates, success, duration } = result;
      const bank = await ratesRepository.getBankByCode(bankCode);

      if (!bank) {
        logger.warn(`Bank not found in DB: ${bankCode}`);
        continue;
      }

      if (!success || rates.length === 0) {
        await ratesRepository.createScrapeLog({
          bankCode,
          status: "FAILED",
          message: result.error || "No rates returned",
          duration,
        });
        processedResults.push({ ...result, rates: [], success: false });
        errors.push(`${bankCode}: scraping failed`);
        continue;
      }

      try {
        const now = new Date();
        if (result.logoUrl && result.logoUrl !== bank.logoUrl) {
          await ratesRepository.updateBankLogo(bank.id, result.logoUrl);
        }

        await ratesRepository.deleteTodaysRates(bank.id);
        await ratesRepository.createManyRates(
          rates.map((rate) => ({
            bankId: bank.id,
            currency: rate.currency,
            code: rate.code,
            buyRate: rate.buyRate,
            sellRate: rate.sellRate,
            date: now,
          })),
        );

        await ratesRepository.createScrapeLog({
          bankCode,
          status: "SUCCESS",
          ratesCount: rates.length,
          duration,
        });

        processedResults.push(result);
        logger.info(`${bankCode} saved ${rates.length} rates`);
      } catch (dbError: any) {
        errors.push(`${bankCode} DB: ${dbError.message}`);
        processedResults.push({ ...result, rates: [], success: false });
      }
    }

    await cacheInvalidatePattern("rates:");

    const totalDuration = Date.now() - globalStart;
    logger.info(`Rates refresh complete in ${totalDuration}ms`);

    return {
      success: errors.length === 0,
      cbuRates: cbuRatesCount,
      bankResults: processedResults,
      totalDuration,
      errors,
    };
  }

  async refreshBankRates(
    bankCode: string,
  ): Promise<RefreshResult["bankResults"][number]> {
    const bank = await ratesRepository.getBankByCode(bankCode);
    if (!bank) {
      throw new NotFoundError("Bank");
    }

    const result = await scrapeBank(bankCode);

    if (!result.success || result.rates.length === 0) {
      await ratesRepository.createScrapeLog({
        bankCode,
        status: "FAILED",
        message: result.error || "No rates returned",
        duration: result.duration,
      });

      return result;
    }

    try {
      const now = new Date();

      if (result.logoUrl && result.logoUrl !== bank.logoUrl) {
        await ratesRepository.updateBankLogo(bank.id, result.logoUrl);
      }

      await ratesRepository.deleteTodaysRates(bank.id);
      await ratesRepository.createManyRates(
        result.rates.map((rate) => ({
          bankId: bank.id,
          currency: rate.currency,
          code: rate.code,
          buyRate: rate.buyRate,
          sellRate: rate.sellRate,
          date: now,
        })),
      );

      await ratesRepository.createScrapeLog({
        bankCode,
        status: "SUCCESS",
        ratesCount: result.rates.length,
        duration: result.duration,
      });

      await cacheInvalidatePattern("rates:");

      return result;
    } catch (error: any) {
      await ratesRepository.createScrapeLog({
        bankCode,
        status: "FAILED",
        message: error.message,
        duration: result.duration,
      });

      return {
        ...result,
        success: false,
        rates: [],
        error: error.message,
      };
    }
  }

  async getLatestRates(currency?: string): Promise<LatestRateGroup[]> {
    const cacheKey = currency
      ? CACHE_KEYS.LATEST_RATES_BY_CURRENCY(currency)
      : CACHE_KEYS.LATEST_RATES;

    return cacheGetOrSet(cacheKey, CACHE_TTL.RATES, async () => {
      const banks = await ratesRepository.getActiveBanks();
      const result: LatestRateGroup[] = [];

      for (const bank of banks) {
        const rates = await ratesRepository.getLatestRatesForBank(
          bank.id,
          currency,
        );
        if (rates.length > 0) {
          result.push({
            bank: {
              id: bank.id,
              code: bank.code,
              name: bank.name,
              nameUz: bank.nameUz,
              website: bank.website,
              logoUrl: bank.logoUrl,
              isCentral: bank.isCentral,
              isActive: bank.isActive,
            },
            rates,
          });
        }
      }

      return result;
    });
  }

  async getRatesForCurrency(code: string) {
    return cacheGetOrSet(CACHE_KEYS.CURRENCY_RATES(code), CACHE_TTL.RATES, () =>
      ratesRepository.getCurrencyRatesToday(code),
    );
  }

  async getRatesOverview(): Promise<RatesOverview> {
    return cacheGetOrSet(
      CACHE_KEYS.RATES_OVERVIEW,
      CACHE_TTL.RATES,
      async () => {
        const [groups, cbuRates, activeBanks] = await Promise.all([
          this.getLatestRates(),
          this.getLatestCBUSnapshot(),
          ratesRepository.getActiveBanks(),
        ]);

        const commercialBanks = activeBanks.filter((bank) => !bank.isCentral);
        const totalCommercialBanks = commercialBanks.length;
        const totalCurrencies = cbuRates.length;
        const groupsByBankCode = new Map(
          groups
            .filter((group) => !group.bank.isCentral)
            .map((group) => [group.bank.code, group]),
        );

        const currencies = cbuRates.map((rate) => {
          const offers = commercialBanks
            .map((bank) => {
              const group = groupsByBankCode.get(bank.code);
              const bankRate = group?.rates.find(
                (item) => item.code === rate.Ccy,
              );
              if (!bankRate) {
                return null;
              }

              return {
                buyRate: bankRate.buyRate,
                sellRate: bankRate.sellRate,
              };
            })
            .filter(Boolean) as Array<{
            buyRate: number | null;
            sellRate: number | null;
          }>;

          return this.buildCurrencySummary(rate, offers, totalCommercialBanks);
        });

        const banks = commercialBanks
          .map((bank) =>
            this.buildBankCoverageSummary(
              bank,
              groupsByBankCode.get(bank.code),
              totalCurrencies,
            ),
          )
          .sort(
            (left, right) =>
              right.coveragePercent - left.coveragePercent ||
              left.bank.nameUz.localeCompare(right.bank.nameUz),
          );

        return {
          market: {
            totalCurrencies,
            totalBanks: activeBanks.length,
            commercialBanks: totalCommercialBanks,
            reportingBanks: banks.filter((bank) => bank.ratesCount > 0).length,
            lastUpdated: getLatestTimestamp(groups),
          },
          currencies,
          banks,
        };
      },
    );
  }

  async getCurrencyDetails(code: string): Promise<CurrencyDetails> {
    const normalizedCode = code.toUpperCase();

    return cacheGetOrSet(
      CACHE_KEYS.CURRENCY_DETAILS(normalizedCode),
      CACHE_TTL.RATES,
      async () => {
        const [banks, rows, cbuRates] = await Promise.all([
          ratesRepository.getActiveBanks(),
          this.getRatesForCurrency(normalizedCode),
          this.getLatestCBUSnapshot(),
        ]);

        const cbuRate =
          cbuRates.find((rate) => rate.Ccy === normalizedCode) || null;
        const rowsByBankId = new Map(rows.map((row) => [row.bankId, row]));
        const commercialBanks = banks.filter((bank) => !bank.isCentral);

        const detailRows: CurrencyDetailsRow[] = banks
          .sort(
            (left, right) =>
              Number(right.isCentral) - Number(left.isCentral) ||
              left.nameUz.localeCompare(right.nameUz),
          )
          .map((bank) => {
            const row = rowsByBankId.get(bank.id);
            const hasRate = bank.isCentral
              ? Boolean(cbuRate || row)
              : Boolean(row);

            return {
              bank: {
                id: bank.id,
                code: bank.code,
                name: bank.name,
                nameUz: bank.nameUz,
                isCentral: bank.isCentral,
              },
              buyRate: row?.buyRate ?? null,
              sellRate: row?.sellRate ?? null,
              cbRate: bank.isCentral
                ? (row?.cbRate ??
                  (cbuRate ? normalizeCbuRate(cbuRate).cbRate : null))
                : cbuRate
                  ? normalizeCbuRate(cbuRate).cbRate
                  : (row?.cbRate ?? null),
              spread: getSpread(row?.buyRate ?? null, row?.sellRate ?? null),
              hasRate,
              date: toIsoString(row?.date),
            };
          });

        const reportingRows = detailRows.filter(
          (row) => !row.bank.isCentral && row.hasRate,
        );
        const summary = cbuRate
          ? this.buildCurrencySummary(
              cbuRate,
              reportingRows.map((row) => ({
                buyRate: row.buyRate,
                sellRate: row.sellRate,
              })),
              commercialBanks.length,
            )
          : null;

        return {
          summary,
          rows: detailRows,
          missingBanks: detailRows
            .filter((row) => !row.bank.isCentral && !row.hasRate)
            .map((row) => row.bank.nameUz),
        };
      },
    );
  }

  async getBankBoard(currencyCode = "USD"): Promise<BankBoard> {
    const normalizedCode = currencyCode.toUpperCase();

    return cacheGetOrSet(
      CACHE_KEYS.BANK_BOARD(normalizedCode),
      CACHE_TTL.RATES,
      async () => {
        const [banks, rows, cbuRates, groups] = await Promise.all([
          ratesRepository.getActiveBanks(),
          this.getRatesForCurrency(normalizedCode),
          this.getLatestCBUSnapshot(),
          this.getLatestRates(),
        ]);

        const commercialBanks = banks.filter((bank) => !bank.isCentral);
        const rowsByBankId = new Map(
          rows
            .filter((row) => !row.bank.isCentral)
            .map((row) => [row.bankId, row]),
        );
        const groupsByBankCode = new Map(
          groups
            .filter((group) => !group.bank.isCentral)
            .map((group) => [group.bank.code, group]),
        );
        const cbuRate = cbuRates.find((rate) => rate.Ccy === normalizedCode);
        const normalizedCbuRate = cbuRate ? normalizeCbuRate(cbuRate) : null;

        const boardRows: BankBoardRow[] = commercialBanks
          .map((bank) => {
            const row = rowsByBankId.get(bank.id);
            const latestGroup = groupsByBankCode.get(bank.code);

            return {
              bank: {
                id: bank.id,
                code: bank.code,
                name: bank.name,
                nameUz: bank.nameUz,
                website: bank.website,
                logoUrl: bank.logoUrl,
                isCentral: bank.isCentral,
                isActive: bank.isActive,
              },
              buyRate: row?.buyRate ?? null,
              sellRate: row?.sellRate ?? null,
              cbRate: normalizedCbuRate?.cbRate ?? row?.cbRate ?? null,
              spread: getSpread(row?.buyRate ?? null, row?.sellRate ?? null),
              hasRate: Boolean(row),
              availableCurrencies: latestGroup?.rates.length || 0,
              lastUpdated: toIsoString(row?.date),
            };
          })
          .sort(
            (left, right) =>
              Number(right.hasRate) - Number(left.hasRate) ||
              right.availableCurrencies - left.availableCurrencies ||
              left.bank.nameUz.localeCompare(right.bank.nameUz),
          );

        return {
          currency: normalizedCode,
          date: normalizedCbuRate?.date || getLatestTimestamp(groups),
          totalBanks: commercialBanks.length,
          reportingBanks: boardRows.filter((row) => row.hasRate).length,
          missingBanks: boardRows
            .filter((row) => !row.hasRate)
            .map((row) => row.bank.nameUz),
          banks: boardRows,
        };
      },
    );
  }

  async getBankDetails(bankCode: string): Promise<BankDetails | null> {
    const normalizedBankCode = bankCode.toLowerCase();

    return cacheGetOrSet(
      CACHE_KEYS.BANK_DETAILS(normalizedBankCode),
      CACHE_TTL.RATES,
      async () => {
        const bank = await ratesRepository.getBankByCode(normalizedBankCode);
        if (!bank) {
          return null;
        }

        const [rates, cbuRates] = await Promise.all([
          ratesRepository.getLatestRatesForBank(bank.id),
          this.getLatestCBUSnapshot(),
        ]);

        const cbuByCode = new Map(
          cbuRates.map((rate) => [rate.Ccy, normalizeCbuRate(rate)]),
        );
        const currencies = [...rates]
          .sort(
            (left, right) =>
              compareCurrencyPriority(left.code, right.code) ||
              left.currency.localeCompare(right.currency),
          )
          .map((rate) => {
            const cbuRate = cbuByCode.get(rate.code);

            return {
              code: rate.code,
              currency: rate.currency,
              buyRate: rate.buyRate,
              sellRate: rate.sellRate,
              cbRate: cbuRate?.cbRate ?? rate.cbRate ?? null,
              spread: getSpread(rate.buyRate, rate.sellRate),
              lastUpdated: toIsoString(rate.date),
            };
          });

        const usdRate = currencies.find((rate) => rate.code === "USD");
        const lastUpdated =
          currencies
            .map((rate) => rate.lastUpdated)
            .filter(Boolean)
            .sort()
            .reverse()[0] || null;

        return {
          bank: {
            id: bank.id,
            code: bank.code,
            name: bank.name,
            nameUz: bank.nameUz,
            website: bank.website,
            logoUrl: bank.logoUrl,
            isCentral: bank.isCentral,
            isActive: bank.isActive,
          },
          summary: {
            currencyCount: currencies.length,
            lastUpdated,
            usdBuyRate: usdRate?.buyRate ?? null,
            usdSellRate: usdRate?.sellRate ?? null,
            usdSpread: usdRate?.spread ?? null,
          },
          currencies,
        };
      },
    );
  }

  async getRateHistory(bankCode: string, currencyCode: string, days: number) {
    const bank = await ratesRepository.getBankByCode(bankCode);
    if (!bank) return [];

    return cacheGetOrSet(
      CACHE_KEYS.RATE_HISTORY(bankCode, currencyCode, days),
      CACHE_TTL.HISTORY,
      () => ratesRepository.getRateHistory(bank.id, currencyCode, days),
    );
  }

  private async getLatestCBUSnapshot(): Promise<CBURateResponse[]> {
    try {
      return await cacheGetOrSet(CACHE_KEYS.CBU_SNAPSHOT, CACHE_TTL.RATES, () =>
        fetchCBURates(),
      );
    } catch (error: any) {
      logger.warn(
        `CBU API unavailable, falling back to database snapshot: ${error.message}`,
      );

      const cbuBank = await ratesRepository.getBankByCode("cbu");
      if (!cbuBank) {
        throw error;
      }

      const latestRates = await ratesRepository.getLatestRatesForBank(cbuBank.id);
      const fallbackSnapshot = latestRates
        .filter((rate) => rate.cbRate !== null)
        .map((rate) => ({
          id: rate.id,
          Code: rate.code,
          Ccy: rate.code,
          CcyNm_RU: rate.currency,
          CcyNm_UZ: rate.currency,
          CcyNm_UZC: rate.currency,
          CcyNm_EN: rate.currency,
          Nominal: "1",
          Rate: String(rate.cbRate),
          Diff: "0",
          Date: rate.date.toISOString(),
        }));

      if (fallbackSnapshot.length === 0) {
        throw error;
      }

      return fallbackSnapshot;
    }
  }

  private buildCurrencySummary(
    cbuRate: CBURateResponse,
    rows: Array<{ buyRate: number | null; sellRate: number | null }>,
    totalBanks: number,
  ): CurrencySummary {
    const normalized = normalizeCbuRate(cbuRate);
    const buyRates = rows.map((row) => row.buyRate).filter(isNumber);
    const sellRates = rows.map((row) => row.sellRate).filter(isNumber);
    const reportingBanks = rows.length;

    return {
      ...normalized,
      trend: getTrend(normalized.diff),
      reportingBanks,
      totalBanks,
      missingBanks: Math.max(totalBanks - reportingBanks, 0),
      coveragePercent: getCoveragePercent(reportingBanks, totalBanks),
      bestBuy: buyRates.length > 0 ? Math.max(...buyRates) : null,
      bestSell: sellRates.length > 0 ? Math.min(...sellRates) : null,
      averageBuy: average(buyRates),
      averageSell: average(sellRates),
    };
  }

  private buildBankCoverageSummary(
    bank: Bank,
    group: LatestRateGroup | undefined,
    totalCurrencies: number,
  ): BankCoverageSummary {
    const rates = group?.rates || [];
    const ratesCount = rates.length;
    const lastUpdated = rates
      .map((rate) => toTimestamp(rate.date))
      .filter(isNumber)
      .sort((left, right) => right - left)[0];

    return {
      bank: {
        id: bank.id,
        code: bank.code,
        name: bank.name,
        nameUz: bank.nameUz,
        website: bank.website,
        logoUrl: bank.logoUrl,
        isCentral: bank.isCentral,
        isActive: bank.isActive,
      },
      ratesCount,
      totalCurrencies,
      missingCurrencies: Math.max(totalCurrencies - ratesCount, 0),
      coveragePercent: getCoveragePercent(ratesCount, totalCurrencies),
      supportedCurrencies: rates
        .map((rate) => rate.code)
        .sort(compareCurrencyPriority),
      lastUpdated: lastUpdated ? new Date(lastUpdated).toISOString() : null,
    };
  }
}

export const ratesService = new RatesService();
