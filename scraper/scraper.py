#!/usr/bin/env python3
"""
Currency-rate scraper (standalone Python).

Order of sources per bank (as requested):
  1) the bank's OWN website  (own-site parser, where one exists)
  2) bank.uz fallback        (https://bank.uz/uz/currency/bank/<slug>)
Own-site results take priority; bank.uz fills in anything missing.

Central Bank (CBU) rates come from the official JSON API and are stored as
cb_rate (buy/sell are null for CBU).

Writes into the SAME Postgres tables used by the Node app (Prisma schema):
  banks, exchange_rates, scrape_logs

Run:
  pip install -r requirements.txt
  export DATABASE_URL=postgres://user:pass@host:5432/dbname
  python scraper.py                 # scrape everything, write to DB
  python scraper.py --dry-run       # scrape, print rates, DO NOT touch DB
  python scraper.py --only nbu,tbcbank   # scrape just these bank codes
"""

import argparse
import os
import re
import sys
import time
import random
import string
from datetime import datetime

import requests
from bs4 import BeautifulSoup

try:
    from dotenv import load_dotenv
    load_dotenv()
except Exception:
    pass

from banks import (
    BANK_CATALOG,
    CURRENCY_NAME_CODE_MAP,
    PRIORITY_CURRENCIES,
)

BANK_UZ_BASE_URL = "https://bank.uz"
CBU_JSON_URL = "https://cbu.uz/uz/arkhiv-kursov-valyut/json/"
REQUEST_TIMEOUT = 25
USER_AGENT = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
    "(KHTML, like Gecko) Chrome/124.0 Safari/537.36"
)

# Suppress the insecure-request warning for apexbank (bad TLS chain)
try:
    import urllib3
    urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)
except Exception:
    pass


# ──────────────────────────────────────────────────────────────
# Small helpers
# ──────────────────────────────────────────────────────────────
def log(msg):
    print(f"[{datetime.now().strftime('%H:%M:%S')}] {msg}", flush=True)


def make_cuid():
    """Collision-resistant id string (DB column is just String/cuid)."""
    ts = format(int(time.time() * 1000), "x")
    rnd = "".join(random.choices(string.ascii_lowercase + string.digits, k=12))
    return ("c" + ts + rnd)[:25].ljust(25, "0")


def normalize_whitespace(value):
    return re.sub(r"\s+", " ", value or "").strip()


def parse_rate(value):
    norm = normalize_whitespace(value).replace(",", ".")
    norm = re.sub(r"[^\d.\-]", "", norm)
    if not norm or norm in ("-", "0", "0.00"):
        return None
    try:
        parsed = float(norm)
    except ValueError:
        return None
    return parsed if parsed > 0 else None


def parse_nominal(value):
    norm = re.sub(r"[^\d]", "", normalize_whitespace(value))
    try:
        n = int(norm)
    except ValueError:
        return 1
    return n if n > 0 else 1


def extract_currency_code(value):
    upper = (value or "").upper()
    matches = re.findall(r"\b[A-Z]{3}\b", upper)
    if matches:
        return matches[-1]
    fallback = re.sub(r"[^A-Z]", "", upper)
    return fallback[-3:] if len(fallback) >= 3 else None


def extract_currency_code_from_name(value):
    return CURRENCY_NAME_CODE_MAP.get(normalize_whitespace(value).lower())


def normalize_by_nominal(value, nominal):
    if value is None:
        return None
    return round(value / max(nominal, 1), 2)


def dedupe_rates(rates):
    """Keep first occurrence per (bank_code, code) — own-site wins over bank.uz."""
    seen = {}
    for r in rates:
        key = (r["bank_code"], r["code"])
        if key not in seen:
            seen[key] = r
    return list(seen.values())


def http_get(url, verify=True):
    resp = requests.get(
        url,
        headers={"User-Agent": USER_AGENT, "Accept-Language": "uz,ru,en"},
        timeout=REQUEST_TIMEOUT,
        verify=verify,
    )
    resp.raise_for_status()
    return resp


# ──────────────────────────────────────────────────────────────
# Own-site parsers (ported from server/src/scrapers/banks.scraper.ts)
# ──────────────────────────────────────────────────────────────
def parse_tbc_table(html):
    soup = BeautifulSoup(html, "html.parser")
    rates = []
    for row in soup.select("table tr"):
        cells = row.find_all(["th", "td"])
        if len(cells) < 5:
            continue
        code = extract_currency_code(cells[0].get_text())
        if not code:
            continue
        sell = parse_rate(cells[3].get_text())
        buy = parse_rate(cells[4].get_text())
        if buy or sell:
            rates.append({"bank_code": "tbcbank", "currency": code,
                          "code": code, "buy_rate": buy, "sell_rate": sell})
    return dedupe_rates(rates)


def parse_davr_table(html):
    soup = BeautifulSoup(html, "html.parser")
    rates = []
    for row in soup.select("table tr"):
        cells = row.find_all(["th", "td"])
        if len(cells) < 4:
            continue
        img = cells[0].find("img")
        label = normalize_whitespace(img.get("alt") if img else "") \
            or normalize_whitespace(cells[0].get_text())
        code = extract_currency_code_from_name(label)
        if not code:
            continue
        sell = parse_rate(cells[2].get_text())
        buy = parse_rate(cells[3].get_text())
        if buy or sell:
            rates.append({"bank_code": "davrbank", "currency": label,
                          "code": code, "buy_rate": buy, "sell_rate": sell})
    return dedupe_rates(rates)


def parse_apex_table(html):
    soup = BeautifulSoup(html, "html.parser")
    rates = []
    for row in soup.select("table tr"):
        cells = row.find_all(["th", "td"])
        if len(cells) < 3:
            continue
        code = extract_currency_code(cells[0].get_text())
        if not code:
            continue
        buy = parse_rate(cells[1].get_text().split("-")[0])
        sell = parse_rate(cells[2].get_text().split("-")[0])
        if buy or sell:
            currency = normalize_whitespace(cells[0].get_text()).replace(code, "").strip() or code
            rates.append({"bank_code": "apexbank", "currency": currency,
                          "code": code, "buy_rate": buy, "sell_rate": sell})
    return dedupe_rates(rates)


OWN_SITE_SCRAPERS = {
    "tbc": ("https://tbcbank.uz/uz/currency/", parse_tbc_table, True),
    "davr": ("https://davrbank.uz/uz/exchange-rate", parse_davr_table, True),
    # apexbank has a broken TLS chain -> verify=False
    "apex": ("https://www.apexbank.uz/about/exchange-rates/", parse_apex_table, False),
}


# ── Generic own-site parser (USD/EUR/RUB focus) ──────────────
# Many bank sites share a [Valyuta | Sotib olish | Sotish | MB kursi] layout.
# We only need USD/EUR/RUB from own sites; bank.uz fills the rest.
WANTED_OWN = {"USD", "EUR", "RUB"}
_BUY_RE = re.compile(r"sotib|xarid|\u043f\u043e\u043a\u0443\u043f\u043a|buy|olish", re.I)
_SELL_RE = re.compile(r"sotish|\u043f\u0440\u043e\u0434\u0430\u0436|sell", re.I)
_CB_RE = re.compile(r"\bmb\b|markaziy|\u0446\u0431|o.zb", re.I)
_NUMTOK = re.compile(r"\d[\d  .,]*")
# Sane UZS ranges per 1 unit — guards against mis-read columns/cells.
_SANITY = {"USD": (10000, 14000), "EUR": (11000, 16500), "RUB": (60, 260)}

# Confirmed static-HTML rate pages (own site). JS-rendered banks are not here
# and fall through to the bank.uz fallback automatically.
OWN_SITE_GENERIC = {
    "ipotekabank": ("https://ipotekabank.uz/uz/currency", True),
    "trustbank": ("https://trustbank.uz/uz", True),
    "aloqabank": ("https://aloqabank.uz/uz", True),
    "aab": ("https://aab.uz/uz", True),
    "mkbank": ("https://mkbank.uz/uz", True),
    "garantbank": ("https://garantbank.uz/uz/exchange-rates", True),
}


def _in_range(code, value):
    lo, hi = _SANITY[code]
    return value is not None and lo <= value <= hi


def parse_generic_own_site(html, bank_code, only=WANTED_OWN):
    """Extract USD/EUR/RUB buy/sell from a static HTML rate table.
    Uses header keywords when available, then falls back to scanning
    non-CB numeric cells, and finally validates against sane ranges."""
    soup = BeautifulSoup(html, "html.parser")
    for tbl in soup.find_all("table"):
        rows = tbl.find_all("tr")
        if len(rows) < 2:
            continue
        hdr = [c.get_text(" ", strip=True) for c in rows[0].find_all(["th", "td"])]
        buy_i = next((i for i, h in enumerate(hdr) if _BUY_RE.search(h)), None)
        sell_i = next((i for i, h in enumerate(hdr) if _SELL_RE.search(h)), None)
        cb_i = next((i for i, h in enumerate(hdr) if _CB_RE.search(h)), None)
        out = []
        for tr in rows[1:]:
            cells = [c.get_text(" ", strip=True) for c in tr.find_all(["th", "td"])]
            if len(cells) < 2:
                continue
            code = extract_currency_code(cells[0])
            if code not in only:
                continue
            buy = sell = None
            if buy_i is not None and sell_i is not None and max(buy_i, sell_i) < len(cells):
                buy = parse_rate(cells[buy_i])
                sell = parse_rate(cells[sell_i])
            if not (_in_range(code, buy) and _in_range(code, sell)):
                cand = []
                for i, c in enumerate(cells):
                    if i == 0 or i == cb_i:
                        continue
                    for tok in _NUMTOK.findall(c):
                        v = parse_rate(tok)
                        if _in_range(code, v):
                            cand.append(v)
                if len(cand) >= 2:
                    buy, sell = cand[0], cand[1]
            if _in_range(code, buy) and _in_range(code, sell):
                if buy > sell:
                    buy, sell = sell, buy
                out.append({"bank_code": bank_code, "currency": code,
                            "code": code, "buy_rate": buy, "sell_rate": sell})
        out = dedupe_rates(out)
        if out:
            return out
    return []


def scrape_own_site(bank):
    code = bank["code"]
    # 1) Custom parser (tbc/davr/apex) when configured
    key = bank.get("own_site")
    if key and key in OWN_SITE_SCRAPERS:
        url, parser, verify = OWN_SITE_SCRAPERS[key]
        try:
            resp = http_get(url, verify=verify)
            rates = parser(resp.text)
            log(f"    own-site {code}: {len(rates)} rates from {url}")
            return rates
        except Exception as exc:
            log(f"    own-site {code} FAILED: {exc}")
            return []
    # 2) Generic static-table parser (USD/EUR/RUB)
    if code in OWN_SITE_GENERIC:
        url, verify = OWN_SITE_GENERIC[code]
        try:
            resp = http_get(url, verify=verify)
            rates = parse_generic_own_site(resp.text, code)
            log(f"    own-site {code}: {len(rates)} rates from {url}")
            return rates
        except Exception as exc:
            log(f"    own-site {code} FAILED: {exc}")
            return []
    return []


# ──────────────────────────────────────────────────────────────
# bank.uz fallback parser
# ──────────────────────────────────────────────────────────────
def parse_bank_uz_detail(html, bank_code):
    soup = BeautifulSoup(html, "html.parser")
    rates = []
    rows = soup.select(".table-kurs .row")
    for row in rows[1:]:  # skip header row
        cells = [c for c in row.find_all(recursive=False)]
        if len(cells) < 6:
            continue
        code = extract_currency_code(cells[0].get_text())
        if not code:
            continue
        nominal = parse_nominal(cells[1].get_text())
        currency = normalize_whitespace(
            re.sub(r"^Valyuta\s*", "", cells[2].get_text(), flags=re.I)
        ) or code
        buy = normalize_by_nominal(parse_rate(cells[3].get_text()), nominal)
        sell = normalize_by_nominal(parse_rate(cells[4].get_text()), nominal)
        if buy or sell:
            rates.append({"bank_code": bank_code, "currency": currency,
                          "code": code, "buy_rate": buy, "sell_rate": sell})
    return dedupe_rates(rates)


def scrape_bank_uz(bank):
    slug = bank.get("bank_uz_slug")
    if not slug:
        return []
    url = f"{BANK_UZ_BASE_URL}/uz/currency/bank/{slug}"
    try:
        resp = http_get(url)
        rates = parse_bank_uz_detail(resp.text, bank["code"])
        log(f"    bank.uz {bank['code']}: {len(rates)} rates from {url}")
        return rates
    except Exception as exc:
        log(f"    bank.uz {bank['code']} FAILED: {exc}")
        return []


# ──────────────────────────────────────────────────────────────
# CBU central-bank rates (official JSON API)
# ──────────────────────────────────────────────────────────────
def fetch_cbu_rates():
    resp = http_get(CBU_JSON_URL)
    data = resp.json()
    if not isinstance(data, list) or not data:
        raise RuntimeError("CBU API returned empty/invalid payload")

    def sort_key(item):
        ccy = item.get("Ccy", "")
        idx = PRIORITY_CURRENCIES.index(ccy) if ccy in PRIORITY_CURRENCIES else 999
        return (idx, ccy)

    out = []
    for item in sorted(data, key=sort_key):
        nominal = parse_nominal(item.get("Nominal", "1"))
        try:
            raw = str(item.get("Rate", "")).replace(" ", "").replace("\u00a0", "").replace(",", ".")
            cb = float(raw) / max(nominal, 1)
        except (ValueError, TypeError):
            continue
        out.append({
            "code": item.get("Ccy"),
            "currency": item.get("CcyNm_UZ") or item.get("CcyNm_EN") or item.get("Ccy"),
            "cb_rate": round(cb, 2),
        })
    return out


# ──────────────────────────────────────────────────────────────
# Postgres writer
# ──────────────────────────────────────────────────────────────
class Database:
    def __init__(self, dsn):
        import psycopg2
        self.conn = psycopg2.connect(dsn)
        self.conn.autocommit = False

    def close(self):
        try:
            self.conn.close()
        except Exception:
            pass

    def upsert_bank(self, bank):
        now = datetime.now()
        with self.conn.cursor() as cur:
            cur.execute(
                """
                INSERT INTO banks (id, code, name, name_uz, website, logo_url,
                                   is_active, is_central, created_at, updated_at)
                VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)
                ON CONFLICT (code) DO UPDATE SET
                    name = EXCLUDED.name,
                    name_uz = EXCLUDED.name_uz,
                    website = EXCLUDED.website,
                    is_central = EXCLUDED.is_central,
                    updated_at = EXCLUDED.updated_at
                RETURNING id
                """,
                (make_cuid(), bank["code"], bank["name"], bank["name_uz"],
                 bank.get("website"), bank.get("logo_url"), True,
                 bool(bank.get("is_central", False)), now, now),
            )
            return cur.fetchone()[0]

    def get_bank_id(self, code):
        with self.conn.cursor() as cur:
            cur.execute("SELECT id FROM banks WHERE code = %s", (code,))
            row = cur.fetchone()
            return row[0] if row else None

    def replace_today_rates(self, bank_id, rows, run_ts):
        """Delete today's rows for this bank, then insert fresh ones.
        Mirrors the Node app (deleteTodaysRates + createMany)."""
        start_of_day = run_ts.replace(hour=0, minute=0, second=0, microsecond=0)
        with self.conn.cursor() as cur:
            cur.execute(
                "DELETE FROM exchange_rates WHERE bank_id = %s AND date >= %s",
                (bank_id, start_of_day),
            )
            for r in rows:
                cur.execute(
                    """
                    INSERT INTO exchange_rates
                        (id, bank_id, currency, code, buy_rate, sell_rate,
                         cb_rate, date, created_at)
                    VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s)
                    ON CONFLICT (bank_id, code, date) DO UPDATE SET
                        buy_rate = EXCLUDED.buy_rate,
                        sell_rate = EXCLUDED.sell_rate,
                        cb_rate = EXCLUDED.cb_rate,
                        currency = EXCLUDED.currency
                    """,
                    (make_cuid(), bank_id, r["currency"], r["code"],
                     r.get("buy_rate"), r.get("sell_rate"), r.get("cb_rate"),
                     run_ts, run_ts),
                )

    def write_scrape_log(self, bank_code, status, message, duration_ms, rates_count):
        with self.conn.cursor() as cur:
            cur.execute(
                """
                INSERT INTO scrape_logs
                    (id, bank_code, status, message, duration, rates_count, created_at)
                VALUES (%s,%s,%s::"ScrapeStatus",%s,%s,%s,%s)
                """,
                (make_cuid(), bank_code, status, message, duration_ms,
                 rates_count, datetime.now()),
            )

    def commit(self):
        self.conn.commit()

    def rollback(self):
        self.conn.rollback()


# ──────────────────────────────────────────────────────────────
# Orchestration
# ──────────────────────────────────────────────────────────────
def scrape_one_bank(bank):
    """Own-site first, then bank.uz fallback. Returns (rates, source_label)."""
    own = scrape_own_site(bank)
    fallback = scrape_bank_uz(bank)
    merged = dedupe_rates(own + fallback)  # own-site entries win on dedupe
    if own and fallback:
        source = "own-site+bank.uz"
    elif own:
        source = "own-site"
    elif fallback:
        source = "bank.uz"
    else:
        source = "none"
    return merged, source


def main():
    parser = argparse.ArgumentParser(description="Currency-rate scraper")
    parser.add_argument("--dry-run", action="store_true",
                        help="scrape and print, do not write to DB")
    parser.add_argument("--only", default="",
                        help="comma-separated bank codes to scrape")
    args = parser.parse_args()

    only = {c.strip() for c in args.only.split(",") if c.strip()}
    catalog = [b for b in BANK_CATALOG if not only or b["code"] in only]

    db = None
    if not args.dry_run:
        dsn = os.environ.get("DATABASE_URL")
        if not dsn:
            log("ERROR: DATABASE_URL is not set. Use --dry-run to test parsing.")
            sys.exit(1)
        db = Database(dsn)

    run_ts = datetime.now()
    total_ok = 0
    total_fail = 0

    try:
        for bank in catalog:
            t0 = time.time()
            code = bank["code"]

            # ── Central bank: official JSON API ──
            if bank.get("is_central"):
                try:
                    cbu = fetch_cbu_rates()
                    rows = [{"currency": r["currency"], "code": r["code"],
                             "buy_rate": None, "sell_rate": None,
                             "cb_rate": r["cb_rate"]} for r in cbu]
                    log(f"{code}: {len(rows)} CBU rates")
                    if db:
                        db.upsert_bank(bank)
                        bid = db.get_bank_id(code)
                        db.replace_today_rates(bid, rows, run_ts)
                        db.write_scrape_log(code, "SUCCESS", None,
                                            int((time.time() - t0) * 1000), len(rows))
                        db.commit()
                    total_ok += 1
                except Exception as exc:
                    log(f"{code}: FAILED — {exc}")
                    if db:
                        db.rollback()
                        try:
                            db.write_scrape_log(code, "FAILED", str(exc)[:480],
                                                int((time.time() - t0) * 1000), 0)
                            db.commit()
                        except Exception:
                            db.rollback()
                    total_fail += 1
                continue

            # ── Commercial banks: own-site then bank.uz ──
            log(f"{code}: scraping…")
            rates, source = scrape_one_bank(bank)
            rows = [{"currency": r["currency"], "code": r["code"],
                     "buy_rate": r.get("buy_rate"), "sell_rate": r.get("sell_rate"),
                     "cb_rate": None} for r in rates]

            if not rows:
                log(f"{code}: no rates ({source})")
                if db:
                    db.rollback()
                    try:
                        db.upsert_bank(bank)
                        db.write_scrape_log(code, "FAILED", "No rates returned",
                                            int((time.time() - t0) * 1000), 0)
                        db.commit()
                    except Exception:
                        db.rollback()
                total_fail += 1
                continue

            log(f"{code}: {len(rows)} rates  [{source}]")
            if db:
                try:
                    db.upsert_bank(bank)
                    bid = db.get_bank_id(code)
                    db.replace_today_rates(bid, rows, run_ts)
                    db.write_scrape_log(code, "SUCCESS", source,
                                        int((time.time() - t0) * 1000), len(rows))
                    db.commit()
                except Exception as exc:
                    log(f"{code}: DB write FAILED — {exc}")
                    db.rollback()
                    total_fail += 1
                    continue
            total_ok += 1

            if args.dry_run:
                for r in rows[:8]:
                    log(f"      {r['code']:4} buy={r['buy_rate']} sell={r['sell_rate']}")
    finally:
        if db:
            db.close()

    log(f"DONE — ok={total_ok} fail={total_fail} dry_run={args.dry_run}")
    if total_ok == 0:
        sys.exit(2)


if __name__ == "__main__":
    main()
