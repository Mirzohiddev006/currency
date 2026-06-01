import https from "https";
import * as cheerio from "cheerio";
import { BANK_ALIAS_MAP, BANK_UZ_BANKS } from "../config/banks";
import { logger } from "../config/logger";
import { scraperHttpClient } from "../lib/http-client";
import { withRetry } from "../lib/retry";
import { BankRateResult, ScrapeResult } from "../types";

const BANK_UZ_BASE_URL = "https://bank.uz";
const KURS_UZ_SUPPORTED_CURRENCIES = ["USD", "RUB"];
const KURS_UZ_CACHE_TTL_MS = 10 * 60 * 1000;
const insecureHttpsAgent = new https.Agent({ rejectUnauthorized: false });
const CURRENCY_NAME_CODE_MAP: Record<string, string> = {
  "aqsh dollari": "USD",
  "shveytsariya franki": "CHF",
  "yapon yenasi": "JPY",
  "funt sterling": "GBP",
  yevro: "EUR",
};

type ScrapedBankPayload = {
  rates: BankRateResult[];
  logoUrl?: string | null;
};

let kursUzCache: { fetchedAt: number; rates: BankRateResult[] } | null = null;
let kursUzPromise: Promise<BankRateResult[]> | null = null;

function normalizeWhitespace(value: string | undefined): string {
  return (value || "").replace(/\s+/g, " ").trim();
}

function parseRate(value: string | undefined): number | null {
  const normalized = normalizeWhitespace(value)
    .replace(/,/g, ".")
    .replace(/[^\d.-]/g, "");

  if (
    !normalized ||
    normalized === "-" ||
    normalized === "0" ||
    normalized === "0.00"
  ) {
    return null;
  }

  const parsed = Number.parseFloat(normalized);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

function parseNominal(value: string | undefined): number {
  const normalized = normalizeWhitespace(value).replace(/[^\d]/g, "");
  const parsed = Number.parseInt(normalized, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
}

function extractCurrencyCode(value: string): string | null {
  const matches = value.toUpperCase().match(/\b[A-Z]{3}\b/g);
  if (matches && matches.length > 0) {
    return matches[matches.length - 1];
  }

  const fallback = value.toUpperCase().replace(/[^A-Z]/g, "");
  return fallback.length >= 3 ? fallback.slice(-3) : null;
}

function extractCurrencyCodeFromName(value: string): string | null {
  const normalized = normalizeWhitespace(value).toLowerCase();
  return CURRENCY_NAME_CODE_MAP[normalized] || null;
}

function normalizeBankUzCurrencyLabel(value: string, code: string): string {
  const normalized = normalizeWhitespace(value).replace(/^Valyuta\s*/i, "");
  return normalized || code;
}

function toAbsoluteUrl(url: string | undefined): string | null {
  if (!url) {
    return null;
  }

  if (/^https?:\/\//i.test(url)) {
    return url;
  }

  return `${BANK_UZ_BASE_URL}${url.startsWith("/") ? url : `/${url}`}`;
}

function normalizeByNominal(
  value: number | null,
  nominal: number,
): number | null {
  if (value === null) {
    return null;
  }

  return Number((value / Math.max(nominal, 1)).toFixed(2));
}

function dedupeRates(rates: BankRateResult[]): BankRateResult[] {
  const uniqueRates = new Map<string, BankRateResult>();

  for (const rate of rates) {
    const key = `${rate.bankCode}:${rate.code}`;
    if (!uniqueRates.has(key)) {
      uniqueRates.set(key, rate);
    }
  }

  return [...uniqueRates.values()];
}

function mergeRates(
  primary: BankRateResult[],
  fallback: BankRateResult[],
): BankRateResult[] {
  return dedupeRates([...primary, ...fallback]);
}

function parseTbcTable(html: string): BankRateResult[] {
  const $ = cheerio.load(html);
  const rates: BankRateResult[] = [];

  $("table tr").each((_, row) => {
    const cells = $(row).find("th,td");
    if (cells.length < 5) {
      return;
    }

    const code = extractCurrencyCode($(cells[0]).text());
    if (!code) {
      return;
    }

    const sellRate = parseRate($(cells[3]).text());
    const buyRate = parseRate($(cells[4]).text());

    if (buyRate || sellRate) {
      rates.push({
        bankCode: "tbcbank",
        currency: code,
        code,
        buyRate,
        sellRate,
      });
    }
  });

  return dedupeRates(rates);
}

function parseDavrbankTable(html: string): BankRateResult[] {
  const $ = cheerio.load(html);
  const rates: BankRateResult[] = [];

  $("table tr").each((_, row) => {
    const cells = $(row).find("th,td");
    if (cells.length < 4) {
      return;
    }

    const currencyLabel =
      normalizeWhitespace($(cells[0]).find("img").attr("alt")) ||
      normalizeWhitespace($(cells[0]).text());
    const code = extractCurrencyCodeFromName(currencyLabel);
    if (!code) {
      return;
    }

    const sellRate = parseRate($(cells[2]).text());
    const buyRate = parseRate($(cells[3]).text());

    if (buyRate || sellRate) {
      rates.push({
        bankCode: "davrbank",
        currency: currencyLabel,
        code,
        buyRate,
        sellRate,
      });
    }
  });

  return dedupeRates(rates);
}

function parseApexTable(html: string): BankRateResult[] {
  const $ = cheerio.load(html);
  const rates: BankRateResult[] = [];

  $("table tr").each((_, row) => {
    const cells = $(row).find("th,td");
    if (cells.length < 3) {
      return;
    }

    const code = extractCurrencyCode($(cells[0]).text());
    if (!code) {
      return;
    }

    const buyRate = parseRate($(cells[1]).text().split("-")[0]);
    const sellRate = parseRate($(cells[2]).text().split("-")[0]);

    if (buyRate || sellRate) {
      rates.push({
        bankCode: "apexbank",
        currency:
          normalizeWhitespace($(cells[0]).text()).replace(code, "").trim() ||
          code,
        code,
        buyRate,
        sellRate,
      });
    }
  });

  return dedupeRates(rates);
}

function parseBankUzDetail(html: string, bankCode: string): ScrapedBankPayload {
  const $ = cheerio.load(html);
  const rates: BankRateResult[] = [];
  const logoUrl =
    toAbsoluteUrl($(".left-about-bank-top img").first().attr("src")) ||
    toAbsoluteUrl($(".left-about-bank img").first().attr("src"));

  $(".table-kurs .row")
    .slice(1)
    .each((_, row) => {
      const cells = $(row).children();
      if (cells.length < 6) {
        return;
      }

      const code = extractCurrencyCode($(cells[0]).text());
      if (!code) {
        return;
      }

      const nominal = parseNominal($(cells[1]).text());
      const currency = normalizeBankUzCurrencyLabel($(cells[2]).text(), code);
      const buyRate = normalizeByNominal(
        parseRate($(cells[3]).text()),
        nominal,
      );
      const sellRate = normalizeByNominal(
        parseRate($(cells[4]).text()),
        nominal,
      );

      if (buyRate || sellRate) {
        rates.push({
          bankCode,
          currency,
          code,
          buyRate,
          sellRate,
        });
      }
    });

  return {
    rates: dedupeRates(rates),
    logoUrl,
  };
}

async function fetchKursUzRates(): Promise<BankRateResult[]> {
  if (
    kursUzCache &&
    Date.now() - kursUzCache.fetchedAt < KURS_UZ_CACHE_TTL_MS
  ) {
    return kursUzCache.rates;
  }

  if (!kursUzPromise) {
    kursUzPromise = (async () => {
      const responses = await Promise.all(
        KURS_UZ_SUPPORTED_CURRENCIES.map(async (currency) => {
          const response = await scraperHttpClient.get(
            `https://kurs.uz/ru/data/currencies?by_bank=all&by_currency=${currency}&sort_by=bank`,
          );

          const $ = cheerio.load(
            `<table><tbody>${response.data}</tbody></table>`,
          );
          const rows: BankRateResult[] = [];

          $("tr").each((_, row) => {
            const cells = $(row).find("td");
            if (cells.length < 3) {
              return;
            }

            const href = $(cells[0]).find("a").attr("href") || "";
            const slugFromHref = href.match(/\/banks\/([^/]+)\//)?.[1];
            const slugFromValue =
              $(cells[0]).find("[data-value]").attr("data-value") ||
              normalizeWhitespace($(cells[0]).text())
                .toLowerCase()
                .replace(/\s+/g, "");
            const bankCode =
              (slugFromHref && BANK_ALIAS_MAP[slugFromHref.toLowerCase()]) ||
              BANK_ALIAS_MAP[slugFromValue.toLowerCase()];

            if (!bankCode) {
              return;
            }

            const buyRate = parseRate($(cells[1]).text());
            const sellRate = parseRate($(cells[2]).text());

            if (buyRate || sellRate) {
              rows.push({
                bankCode,
                currency,
                code: currency,
                buyRate,
                sellRate,
              });
            }
          });

          return rows;
        }),
      );

      const rates = dedupeRates(responses.flat());
      kursUzCache = {
        fetchedAt: Date.now(),
        rates,
      };

      return rates;
    })().finally(() => {
      kursUzPromise = null;
    });
  }

  return kursUzPromise;
}

async function getKursUzRatesForBank(
  bankCode: string,
): Promise<BankRateResult[]> {
  const rates = await fetchKursUzRates();
  return rates.filter((rate) => rate.bankCode === bankCode);
}

async function scrapeWithFallback(
  bankCode: string,
  primaryScraper?: () => Promise<ScrapedBankPayload>,
): Promise<ScrapedBankPayload> {
  let primary: ScrapedBankPayload = { rates: [] };

  if (primaryScraper) {
    try {
      primary = await primaryScraper();
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      logger.warn(`[Scraper] ${bankCode} primary source failed: ${message}`);
    }
  }

  const fallbackRates = await getKursUzRatesForBank(bankCode);
  return {
    logoUrl: primary.logoUrl ?? null,
    rates: mergeRates(primary.rates, fallbackRates),
  };
}

async function scrapeBankWithRetry(
  bankCode: string,
  scraper: () => Promise<ScrapedBankPayload>,
): Promise<ScrapedBankPayload> {
  return withRetry(scraper, {
    maxRetries: 2,
    baseDelayMs: 2000,
    label: bankCode,
  });
}

async function scrapeBankUzBank(
  bankCode: string,
  slug: string,
): Promise<ScrapedBankPayload> {
  return scrapeWithFallback(bankCode, async () => {
    const { data } = await scraperHttpClient.get(
      `${BANK_UZ_BASE_URL}/uz/currency/bank/${slug}`,
    );
    return parseBankUzDetail(data, bankCode);
  });
}

async function scrapeTbcBank(): Promise<ScrapedBankPayload> {
  return scrapeWithFallback("tbcbank", async () => {
    const { data } = await scraperHttpClient.get(
      "https://tbcbank.uz/uz/currency/",
    );
    return {
      rates: parseTbcTable(data),
      logoUrl: "https://tbcbank.uz/favicon.ico",
    };
  });
}

async function scrapeDavrbank(): Promise<ScrapedBankPayload> {
  return scrapeWithFallback("davrbank", async () => {
    const { data } = await scraperHttpClient.get(
      "https://davrbank.uz/uz/exchange-rate",
    );
    return {
      rates: parseDavrbankTable(data),
      logoUrl: "https://davrbank.uz/favicon.ico",
    };
  });
}

async function scrapeApexBank(): Promise<ScrapedBankPayload> {
  return scrapeWithFallback("apexbank", async () => {
    const { data } = await scraperHttpClient.get(
      "https://www.apexbank.uz/about/exchange-rates/",
      {
        httpsAgent: insecureHttpsAgent,
      },
    );

    return {
      rates: parseApexTable(data),
      logoUrl: "https://www.apexbank.uz/favicon.ico",
    };
  });
}

async function scrapeKursOnlyBank(
  bankCode: string,
): Promise<ScrapedBankPayload> {
  return {
    rates: await getKursUzRatesForBank(bankCode),
  };
}

export const BANK_SCRAPERS: Record<string, () => Promise<ScrapedBankPayload>> =
  {
    ...Object.fromEntries(
      BANK_UZ_BANKS.map((bank) => [
        bank.code,
        () => scrapeBankUzBank(bank.code, bank.bankUzSlug),
      ]),
    ),
    apexbank: scrapeApexBank,
    tbcbank: scrapeTbcBank,
    davrbank: scrapeDavrbank,
    uzumbank: () => scrapeKursOnlyBank("uzumbank"),
  };

export async function scrapeBank(bankCode: string): Promise<ScrapeResult> {
  const scraper = BANK_SCRAPERS[bankCode];
  if (!scraper) {
    throw new Error(`Scraper not found for bank: ${bankCode}`);
  }

  const startedAt = Date.now();

  try {
    const { rates, logoUrl } = await scrapeBankWithRetry(bankCode, scraper);
    return {
      bankCode,
      rates,
      success: rates.length > 0,
      duration: Date.now() - startedAt,
      logoUrl,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logger.error(`[Scraper] ${bankCode} failed after retries: ${message}`);
    return {
      bankCode,
      rates: [],
      success: false,
      duration: Date.now() - startedAt,
      error: message,
      logoUrl: null,
    };
  }
}

export async function scrapeAllBanks(): Promise<ScrapeResult[]> {
  const results = await Promise.allSettled(
    Object.entries(BANK_SCRAPERS).map(async ([bankCode, scraper]) => {
      const startedAt = Date.now();

      try {
        const { rates, logoUrl } = await scrapeBankWithRetry(bankCode, scraper);
        return {
          bankCode,
          rates,
          success: rates.length > 0,
          duration: Date.now() - startedAt,
          logoUrl,
        };
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        logger.error(`[Scraper] ${bankCode} failed after retries: ${message}`);
        return {
          bankCode,
          rates: [],
          success: false,
          duration: Date.now() - startedAt,
          error: message,
          logoUrl: null,
        };
      }
    }),
  );

  return results.map((result) =>
    result.status === "fulfilled"
      ? result.value
      : {
          bankCode: "unknown",
          rates: [],
          success: false,
          duration: 0,
          error: "Promise rejected",
          logoUrl: null,
        },
  );
}
