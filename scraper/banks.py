"""Bank catalog — ported from server/src/config/banks.ts.

Each entry:
  code        : internal bank code (matches DB banks.code, also Prisma seed)
  name        : English name
  name_uz     : Uzbek name
  website     : official site
  is_central  : True only for CBU
  logo_url    : optional favicon
  bank_uz_slug: slug on bank.uz/uz/currency/bank/<slug> (fallback source)
  own_site    : optional own-website scraper key ('tbc' | 'davr' | 'apex')
                These banks are scraped from their OWN site first.
"""

BANK_CATALOG = [
    {"code": "cbu", "name": "Central Bank of Uzbekistan",
     "name_uz": "O'zbekiston Markaziy banki", "website": "https://cbu.uz",
     "logo_url": "https://cbu.uz/favicon.ico", "is_central": True},

    {"code": "agrobank", "name": "Agrobank", "name_uz": "Agrobank",
     "website": "https://agrobank.uz", "bank_uz_slug": "agrobank"},
    {"code": "aloqabank", "name": "Aloqabank", "name_uz": "Aloqabank",
     "website": "https://aloqabank.uz", "bank_uz_slug": "aloqabank"},
    {"code": "anorbank", "name": "Anorbank", "name_uz": "Anorbank",
     "website": "https://anorbank.uz", "bank_uz_slug": "anor-bank"},
    {"code": "apexbank", "name": "Apex Bank", "name_uz": "Apex Bank",
     "website": "https://www.apexbank.uz",
     "logo_url": "https://www.apexbank.uz/favicon.ico", "own_site": "apex"},
    {"code": "aab", "name": "Asia Alliance Bank", "name_uz": "Asia Alliance Bank",
     "website": "https://aab.uz", "bank_uz_slug": "asia-alliance-bank"},
    {"code": "asakabank", "name": "Asaka Bank", "name_uz": "Asakabank",
     "website": "https://asakabank.uz", "bank_uz_slug": "asaka-bank"},
    {"code": "brb", "name": "BRB", "name_uz": "BRB",
     "website": "https://brb.uz", "bank_uz_slug": "qishloq-qurilish-bank"},
    {"code": "davrbank", "name": "Davr Bank", "name_uz": "Davr Bank",
     "website": "https://davrbank.uz",
     "logo_url": "https://davrbank.uz/favicon.ico", "own_site": "davr"},
    {"code": "garantbank", "name": "Garant Bank", "name_uz": "Garant Bank",
     "website": "https://garantbank.uz", "bank_uz_slug": "savdogar-bank"},
    {"code": "hamkorbank", "name": "Hamkorbank", "name_uz": "Hamkorbank",
     "website": "https://hamkorbank.uz", "bank_uz_slug": "hamkorbank"},
    {"code": "hayotbank", "name": "Hayot Bank", "name_uz": "Hayot Bank",
     "website": "https://hayotbank.uz", "bank_uz_slug": "hayot-bank"},
    {"code": "infinbank", "name": "Infinbank", "name_uz": "Infinbank",
     "website": "https://infinbank.com", "bank_uz_slug": "invest-finance-bank"},
    {"code": "ipakyulibank", "name": "Ipak Yuli Bank", "name_uz": "Ipak Yuli Bank",
     "website": "https://ipakyulibank.uz", "bank_uz_slug": "ipakyulibank"},
    {"code": "ipotekabank", "name": "Ipoteka Bank", "name_uz": "Ipoteka bank",
     "website": "https://ipotekabank.uz", "bank_uz_slug": "ipoteka-bank"},
    {"code": "kapitalbank", "name": "Kapitalbank", "name_uz": "Kapitalbank",
     "website": "https://kapitalbank.uz", "bank_uz_slug": "kapitalbank"},
    {"code": "mkbank", "name": "MKBank", "name_uz": "MKBank",
     "website": "https://mkbank.uz", "bank_uz_slug": "mikrokreditbank"},
    {"code": "nbu", "name": "National Bank of Uzbekistan",
     "name_uz": "O'zbekiston Milliy banki", "website": "https://nbu.uz",
     "bank_uz_slug": "nbu"},
    {"code": "octobank", "name": "Octobank", "name_uz": "Octobank",
     "website": "https://octobank.uz", "bank_uz_slug": "ravnaq-bank"},
    {"code": "ofb", "name": "Orient Finans Bank", "name_uz": "Orient Finans Bank",
     "website": "https://ofb.uz", "bank_uz_slug": "orient-finans-bank"},
    {"code": "poytaxtbank", "name": "Poytaxt Bank", "name_uz": "Poytaxt bank",
     "website": "https://poytaxtbank.uz", "bank_uz_slug": "poytaxtbank"},
    {"code": "saderatbank", "name": "Saderat Bank", "name_uz": "Saderat Bank",
     "website": "https://saderatbank.uz", "bank_uz_slug": "saderat-bank-tashkent"},
    {"code": "tbcbank", "name": "TBC Bank Uzbekistan", "name_uz": "TBC Bank Uzbekistan",
     "website": "https://tbcbank.uz",
     "logo_url": "https://tbcbank.uz/favicon.ico", "own_site": "tbc"},
    {"code": "tengebank", "name": "Tenge Bank", "name_uz": "Tenge Bank",
     "website": "https://tengebank.uz", "bank_uz_slug": "tenge-bank"},
    {"code": "trustbank", "name": "Trustbank", "name_uz": "Trustbank",
     "website": "https://trustbank.uz", "bank_uz_slug": "trastbank"},
    {"code": "turonbank", "name": "Turonbank", "name_uz": "Turon bank",
     "website": "https://turonbank.uz", "bank_uz_slug": "turonbank"},
    {"code": "universalbank", "name": "Universal Bank", "name_uz": "Universal bank",
     "website": "https://universalbank.uz", "bank_uz_slug": "universalbank"},
    {"code": "uzkdbbank", "name": "KDB Bank Uzbekistan", "name_uz": "KDB Bank Uzbekistan",
     "website": "https://kdb.uz", "bank_uz_slug": "uzkdb-bank"},
    {"code": "uzpromstroybank", "name": "Uzsanoatqurilishbank",
     "name_uz": "O'zsanoatqurilishbank", "website": "https://sqb.uz",
     "bank_uz_slug": "sanoat-qurilish-bank"},
    {"code": "xalqbank", "name": "Xalq Bank", "name_uz": "Xalq Banki",
     "website": "https://xb.uz", "bank_uz_slug": "xalq-bank"},
    {"code": "ziraatbank", "name": "Ziraat Bank Uzbekistan", "name_uz": "Ziraat Bank",
     "website": "https://ziraatbank.uz", "bank_uz_slug": "ziraat-bank-uzbekistan"},
]

# Currency-name -> ISO code (used by davrbank own-site parser, which shows names)
CURRENCY_NAME_CODE_MAP = {
    "aqsh dollari": "USD",
    "shveytsariya franki": "CHF",
    "yapon yenasi": "JPY",
    "funt sterling": "GBP",
    "yevro": "EUR",
}

PRIORITY_CURRENCIES = ["USD", "EUR", "RUB", "GBP", "CNY", "JPY", "KZT", "KGS", "TRY", "AED"]
