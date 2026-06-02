import { BankSeedData } from '../types';

export interface BankCatalogEntry extends BankSeedData {
  bankUzSlug?: string;
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
  },
  {
    code: 'aloqabank',
    name: 'Aloqabank',
    nameUz: 'Aloqabank',
    website: 'https://aloqabank.uz',
    bankUzSlug: 'aloqabank',
  },
  {
    code: 'anorbank',
    name: 'Anorbank',
    nameUz: 'Anorbank',
    website: 'https://anorbank.uz',
    bankUzSlug: 'anor-bank',
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
  },
  {
    code: 'asakabank',
    name: 'Asaka Bank',
    nameUz: 'Asakabank',
    website: 'https://asakabank.uz',
    bankUzSlug: 'asaka-bank',
  },
  {
    code: 'brb',
    name: 'BRB',
    nameUz: 'BRB',
    website: 'https://brb.uz',
    bankUzSlug: 'qishloq-qurilish-bank',
  },
  {
    code: 'davrbank',
    name: 'Davr Bank',
    nameUz: 'Davr Bank',
    website: 'https://davrbank.uz',
    logoUrl: 'https://davrbank.uz/favicon.ico',
  },
  {
    code: 'garantbank',
    name: 'Garant Bank',
    nameUz: 'Garant Bank',
    website: 'https://garantbank.uz',
    bankUzSlug: 'savdogar-bank',
  },
  {
    code: 'hamkorbank',
    name: 'Hamkorbank',
    nameUz: 'Hamkorbank',
    website: 'https://hamkorbank.uz',
    bankUzSlug: 'hamkorbank',
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
  },
  {
    code: 'ipakyulibank',
    name: 'Ipak Yuli Bank',
    nameUz: 'Ipak Yuli Bank',
    website: 'https://ipakyulibank.uz',
    bankUzSlug: 'ipakyulibank',
  },
  {
    code: 'ipotekabank',
    name: 'Ipoteka Bank',
    nameUz: 'Ipoteka bank',
    website: 'https://ipotekabank.uz',
    bankUzSlug: 'ipoteka-bank',
  },
  {
    code: 'kapitalbank',
    name: 'Kapitalbank',
    nameUz: 'Kapitalbank',
    website: 'https://kapitalbank.uz',
    bankUzSlug: 'kapitalbank',
  },
  {
    code: 'mkbank',
    name: 'MKBank',
    nameUz: 'MKBank',
    website: 'https://mkbank.uz',
    bankUzSlug: 'mikrokreditbank',
  },
  {
    code: 'nbu',
    name: 'National Bank of Uzbekistan',
    nameUz: "O'zbekiston Milliy banki",
    website: 'https://nbu.uz',
    bankUzSlug: 'nbu',
  },
  {
    code: 'octobank',
    name: 'Octobank',
    nameUz: 'Octobank',
    website: 'https://octobank.uz',
    bankUzSlug: 'ravnaq-bank',
  },
  {
    code: 'ofb',
    name: 'Orient Finans Bank',
    nameUz: 'Orient Finans Bank',
    website: 'https://ofb.uz',
    bankUzSlug: 'orient-finans-bank',
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
  },
  {
    code: 'tbcbank',
    name: 'TBC Bank Uzbekistan',
    nameUz: 'TBC Bank Uzbekistan',
    website: 'https://tbcbank.uz',
    logoUrl: 'https://tbcbank.uz/favicon.ico',
  },
  {
    code: 'tengebank',
    name: 'Tenge Bank',
    nameUz: 'Tenge Bank',
    website: 'https://tengebank.uz',
    bankUzSlug: 'tenge-bank',
  },
  {
    code: 'trustbank',
    name: 'Trustbank',
    nameUz: 'Trustbank',
    website: 'https://trustbank.uz',
    bankUzSlug: 'trastbank',
  },
  {
    code: 'turonbank',
    name: 'Turonbank',
    nameUz: 'Turon bank',
    website: 'https://turonbank.uz',
    bankUzSlug: 'turonbank',
  },
  {
    code: 'universalbank',
    name: 'Universal Bank',
    nameUz: 'Universal bank',
    website: 'https://universalbank.uz',
    bankUzSlug: 'universalbank',
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
  },
  {
    code: 'xalqbank',
    name: 'Xalq Bank',
    nameUz: 'Xalq Banki',
    website: 'https://xb.uz',
    bankUzSlug: 'xalq-bank',
  },
  {
    code: 'ziraatbank',
    name: 'Ziraat Bank Uzbekistan',
    nameUz: 'Ziraat Bank',
    website: 'https://ziraatbank.uz',
    bankUzSlug: 'ziraat-bank-uzbekistan',
  },
];

export const BANKS_SEED: BankSeedData[] = BANK_CATALOG.map(
  ({ bankUzSlug: _bankUzSlug, ...bank }) => bank
);

export const BANK_UZ_BANKS = BANK_CATALOG.filter(
  (bank): bank is BankCatalogEntry & { bankUzSlug: string } => Boolean(bank.bankUzSlug)
);

export const PRIORITY_CURRENCIES = ['USD', 'EUR', 'RUB', 'GBP', 'CNY', 'JPY', 'KZT', 'KGS', 'TRY', 'AED'];
