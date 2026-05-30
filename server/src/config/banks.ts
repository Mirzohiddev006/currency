import { BankSeedData } from '../types';

export interface BankCatalogEntry extends BankSeedData {
  bankUzSlug?: string;
  kursUzAliases?: string[];
}

export const BANK_CATALOG: BankCatalogEntry[] = [
  {
    code: 'cbu',
    name: 'Central Bank of Uzbekistan',
    nameUz: "O'zbekiston Markaziy banki",
    website: 'https://cbu.uz',
    logoUrl: 'https://cbu.uz/favicon.ico',
    isCentral: true,
  },
  {
    code: 'agrobank',
    name: 'Agrobank',
    nameUz: 'Agrobank',
    website: 'https://agrobank.uz',
    bankUzSlug: 'agrobank',
    kursUzAliases: ['agrobank'],
  },
  {
    code: 'aloqabank',
    name: 'Aloqabank',
    nameUz: 'Aloqabank',
    website: 'https://aloqabank.uz',
    bankUzSlug: 'aloqabank',
    kursUzAliases: ['aloqabank'],
  },
  {
    code: 'anorbank',
    name: 'Anorbank',
    nameUz: 'Anorbank',
    website: 'https://anorbank.uz',
    bankUzSlug: 'anor-bank',
    kursUzAliases: ['anorbank'],
  },
  {
    code: 'apexbank',
    name: 'Apex Bank',
    nameUz: 'Apex Bank',
    website: 'https://www.apexbank.uz',
    logoUrl: 'https://www.apexbank.uz/favicon.ico',
  },
  {
    code: 'aab',
    name: 'Asia Alliance Bank',
    nameUz: 'Asia Alliance Bank',
    website: 'https://aab.uz',
    bankUzSlug: 'asia-alliance-bank',
    kursUzAliases: ['aab'],
  },
  {
    code: 'asakabank',
    name: 'Asaka Bank',
    nameUz: 'Asakabank',
    website: 'https://asakabank.uz',
    bankUzSlug: 'asaka-bank',
    kursUzAliases: ['asakabank'],
  },
  {
    code: 'brb',
    name: 'BRB',
    nameUz: 'BRB',
    website: 'https://brb.uz',
    bankUzSlug: 'qishloq-qurilish-bank',
    kursUzAliases: ['qqb'],
  },
  {
    code: 'davrbank',
    name: 'Davr Bank',
    nameUz: 'Davr Bank',
    website: 'https://davrbank.uz',
    logoUrl: 'https://davrbank.uz/favicon.ico',
    kursUzAliases: ['davrbank'],
  },
  {
    code: 'garantbank',
    name: 'Garant Bank',
    nameUz: 'Garant Bank',
    website: 'https://garantbank.uz',
    bankUzSlug: 'savdogar-bank',
    kursUzAliases: ['garantbank'],
  },
  {
    code: 'hamkorbank',
    name: 'Hamkorbank',
    nameUz: 'Hamkorbank',
    website: 'https://hamkorbank.uz',
    bankUzSlug: 'hamkorbank',
    kursUzAliases: ['hamkorbank', 'hamkor'],
  },
  {
    code: 'hayotbank',
    name: 'Hayot Bank',
    nameUz: 'Hayot Bank',
    website: 'https://hayotbank.uz',
    bankUzSlug: 'hayot-bank',
  },
  {
    code: 'infinbank',
    name: 'Infinbank',
    nameUz: 'Infinbank',
    website: 'https://infinbank.com',
    bankUzSlug: 'invest-finance-bank',
    kursUzAliases: ['infinbank'],
  },
  {
    code: 'ipakyulibank',
    name: 'Ipak Yuli Bank',
    nameUz: 'Ipak Yuli Bank',
    website: 'https://ipakyulibank.uz',
    bankUzSlug: 'ipakyulibank',
    kursUzAliases: ['ipakyulibank'],
  },
  {
    code: 'ipotekabank',
    name: 'Ipoteka Bank',
    nameUz: 'Ipoteka bank',
    website: 'https://ipotekabank.uz',
    bankUzSlug: 'ipoteka-bank',
    kursUzAliases: ['ipotekabank'],
  },
  {
    code: 'kapitalbank',
    name: 'Kapitalbank',
    nameUz: 'Kapitalbank',
    website: 'https://kapitalbank.uz',
    bankUzSlug: 'kapitalbank',
    kursUzAliases: ['kapitalbank'],
  },
  {
    code: 'mkbank',
    name: 'MKBank',
    nameUz: 'MKBank',
    website: 'https://mkbank.uz',
    bankUzSlug: 'mikrokreditbank',
    kursUzAliases: ['mkbank'],
  },
  {
    code: 'nbu',
    name: 'National Bank of Uzbekistan',
    nameUz: "O'zbekiston Milliy banki",
    website: 'https://nbu.uz',
    bankUzSlug: 'nbu',
    kursUzAliases: ['nbu'],
  },
  {
    code: 'octobank',
    name: 'Octobank',
    nameUz: 'Octobank',
    website: 'https://octobank.uz',
    bankUzSlug: 'ravnaq-bank',
    kursUzAliases: ['ravnaqbank'],
  },
  {
    code: 'ofb',
    name: 'Orient Finans Bank',
    nameUz: 'Orient Finans Bank',
    website: 'https://ofb.uz',
    bankUzSlug: 'orient-finans-bank',
    kursUzAliases: ['ofb'],
  },
  {
    code: 'poytaxtbank',
    name: 'Poytaxt Bank',
    nameUz: 'Poytaxt bank',
    website: 'https://poytaxtbank.uz',
    bankUzSlug: 'poytaxtbank',
  },
  {
    code: 'saderatbank',
    name: 'Saderat Bank',
    nameUz: 'Saderat Bank',
    website: 'https://saderatbank.uz',
    bankUzSlug: 'saderat-bank-tashkent',
    kursUzAliases: ['saderatbank'],
  },
  {
    code: 'tbcbank',
    name: 'TBC Bank Uzbekistan',
    nameUz: 'TBC Bank Uzbekistan',
    website: 'https://tbcbank.uz',
    logoUrl: 'https://tbcbank.uz/favicon.ico',
    kursUzAliases: ['tbcbank', 'tbc'],
  },
  {
    code: 'tengebank',
    name: 'Tenge Bank',
    nameUz: 'Tenge Bank',
    website: 'https://tengebank.uz',
    bankUzSlug: 'tenge-bank',
    kursUzAliases: ['tengebank'],
  },
  {
    code: 'trustbank',
    name: 'Trustbank',
    nameUz: 'Trustbank',
    website: 'https://trustbank.uz',
    bankUzSlug: 'trastbank',
    kursUzAliases: ['trustbank'],
  },
  {
    code: 'turonbank',
    name: 'Turonbank',
    nameUz: 'Turon bank',
    website: 'https://turonbank.uz',
    bankUzSlug: 'turonbank',
    kursUzAliases: ['turonbank'],
  },
  {
    code: 'universalbank',
    name: 'Universal Bank',
    nameUz: 'Universal bank',
    website: 'https://universalbank.uz',
    bankUzSlug: 'universalbank',
    kursUzAliases: ['universalbank'],
  },
  {
    code: 'uzkdbbank',
    name: 'KDB Bank Uzbekistan',
    nameUz: 'KDB Bank Uzbekistan',
    website: 'https://kdb.uz',
    bankUzSlug: 'uzkdb-bank',
  },
  {
    code: 'uzpromstroybank',
    name: 'Uzsanoatqurilishbank',
    nameUz: "O'zsanoatqurilishbank",
    website: 'https://sqb.uz',
    bankUzSlug: 'sanoat-qurilish-bank',
    kursUzAliases: ['sqb', 'uzpromstroybank', 'uzpsb'],
  },
  {
    code: 'uzumbank',
    name: 'Uzum Bank',
    nameUz: 'Uzum Bank',
    website: 'https://uzumbank.uz',
    logoUrl: 'https://uzumbank.uz/favicon.ico',
    kursUzAliases: ['uzumbank'],
  },
  {
    code: 'xalqbank',
    name: 'Xalq Bank',
    nameUz: 'Xalq Banki',
    website: 'https://xb.uz',
    bankUzSlug: 'xalq-bank',
    kursUzAliases: ['xalqbank', 'xalq'],
  },
  {
    code: 'ziraatbank',
    name: 'Ziraat Bank Uzbekistan',
    nameUz: 'Ziraat Bank',
    website: 'https://ziraatbank.uz',
    bankUzSlug: 'ziraat-bank-uzbekistan',
    kursUzAliases: ['ziraatbank'],
  },
];

export const BANKS_SEED: BankSeedData[] = BANK_CATALOG.map(
  ({ bankUzSlug: _bankUzSlug, kursUzAliases: _kursUzAliases, ...bank }) => bank
);

export const BANK_UZ_BANKS = BANK_CATALOG.filter(
  (bank): bank is BankCatalogEntry & { bankUzSlug: string } => Boolean(bank.bankUzSlug)
);

export const BANK_ALIAS_MAP: Record<string, string> = Object.fromEntries(
  BANK_CATALOG.flatMap((bank) => {
    const aliases = new Set<string>([
      bank.code.toLowerCase(),
      ...(bank.bankUzSlug ? [bank.bankUzSlug.toLowerCase()] : []),
      ...((bank.kursUzAliases || []).map((alias) => alias.toLowerCase())),
    ]);

    return [...aliases].map((alias) => [alias, bank.code]);
  })
);

export const PRIORITY_CURRENCIES = ['USD', 'EUR', 'RUB', 'GBP', 'CNY', 'JPY', 'KZT', 'KGS', 'TRY', 'AED'];
