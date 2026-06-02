# Currency scraper (Python)

Standalone scraper that collects exchange rates for every bank and writes them
into the **same Postgres database** the Node app uses (Prisma tables `banks`,
`exchange_rates`, `scrape_logs`). It does not touch the Node code.

## How it sources rates

For each commercial bank, in order:

1. **The bank's own website** — used first when an own-site parser exists
   (currently `tbcbank`, `davrbank`, `apexbank`).
2. **bank.uz fallback** — `https://bank.uz/uz/currency/bank/<slug>` for any bank
   that has a `bank_uz_slug`.

Own-site results win when both sources return the same currency (dedupe keeps the
own-site row). The **Central Bank (CBU)** rates come from the official JSON API
(`https://cbu.uz/uz/arkhiv-kursov-valyut/json/`) and are stored as `cb_rate`.

## Setup

```bash
cd scraper
python -m venv .venv && source .venv/bin/activate   # optional
pip install -r requirements.txt
cp .env.example .env          # then edit DATABASE_URL
```

`DATABASE_URL` must point at the same Postgres your app uses. On Render, copy the
**External Database URL** from the Postgres dashboard. The `banks` table is
seeded by the Node app, but the scraper also upserts each bank, so it works even
on a fresh DB (as long as the Prisma schema/tables already exist).

## Run

```bash
# Test parsing only — no DB writes, prints sample rates:
python scraper.py --dry-run

# Scrape everything and write to DB:
python scraper.py

# Scrape just specific banks:
python scraper.py --only nbu,tbcbank,cbu
```

Exit code `0` = at least one bank succeeded, `2` = everything failed.

## Scheduling

Run it on a schedule (cron / Render Cron Job / Windows Task Scheduler), e.g. daily:

```cron
0 9 * * *  cd /path/to/scraper && /path/to/.venv/bin/python scraper.py >> scrape.log 2>&1
```

On Render you can add a **Cron Job** service pointing at this folder with build
command `pip install -r requirements.txt` and start command `python scraper.py`,
sharing the same `DATABASE_URL` env var.

## Adding an own-site parser for another bank

1. Add `"own_site": "<key>"` to that bank in `banks.py`.
2. Add `"<key>": (url, parser_fn, verify_tls)` to `OWN_SITE_SCRAPERS` in
   `scraper.py` and write a `parse_*_table(html)` function returning rows shaped
   like `{bank_code, currency, code, buy_rate, sell_rate}`.

The bank.uz fallback keeps working underneath, so a partial/own-site parser is
safe to add incrementally.

## Notes

- `apexbank` has a broken TLS chain, so its own-site request uses `verify=False`
  (the insecure-warning is suppressed). Everything else uses normal TLS.
- Rates are normalised per nominal on bank.uz (e.g. "per 1000 JPY" -> per 1).
- Each run deletes today's rows for a bank before inserting fresh ones, matching
  the Node app's behaviour, so re-running the same day is safe (idempotent).
- Site HTML can change over time; if a bank suddenly returns 0 rates, its parser
  selector likely needs updating. Run `--dry-run` to inspect.

## Bot bilan bog'lanish (MUHIM — kurslar botda chiqishi uchun)

Bot/backend kurslarni **bazadan** o'qiydi (`getRatesOverview`). Bot scraper bilan
to'g'ridan-to'g'ri gaplashmaydi — ular faqat **bir xil Postgres** orqali bog'lanadi.

Shuning uchun kurslar botda chiqishi uchun scraper **aynan botning `DATABASE_URL`i**
bilan ishlashi shart:

```bash
# Render Postgres'ning manzili bilan (External Database URL):
DATABASE_URL="postgres://currency:...@...frankfurt-postgres.render.com/currency_tracker" \
  python scraper.py
```

Bir marta ishlatib tekshiring — keyin botda /start → kurslar chiqadi.

### Avtomatik ishlashi (Render Cron Job)

Botning bazasi doim yangi turishi uchun scraperni jadval bo'yicha ishlating:

1. Render → New → **Cron Job**, shu reponi tanlang.
2. Root Directory: `scraper`
3. Build Command: `pip install -r requirements.txt`
4. Command: `python scraper.py`
5. Schedule: `0 * * * *` (har soatda) yoki `0 9,16 * * *` (09:00 va 16:00).
6. Environment → `DATABASE_URL` = Postgres'ning **Internal Database URL**'i
   (web service bilan bir xil baza).

Shundan keyin scraper har safar shu bazaga yozadi va bot avtomatik yangilanadi.
Hech qanday kod o'zgartirish kerak emas.

> Eslatma: backend ichidagi eski Node-scraper ham shu bazaga yozadi. Ikkalasi
> birga ishlasa zarari yo'q (idempotent — har run o'sha kungi qatorlarni
> almashtiradi). Agar faqat Python-scraper ishlashini xohlasangiz, Node
> scheduler'ini o'chirib qo'yish mumkin (so'rang — qilib beraman).
