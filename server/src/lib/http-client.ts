// ════════════════════════════════════════════════════════════
// HTTP CLIENT — Shared axios instance with consistent config
// ════════════════════════════════════════════════════════════

import https from "https";
import axios from "axios";

const scraperAgent = new https.Agent({
  keepAlive: true,
  maxSockets: 20,
});

export const scraperHttpClient = axios.create({
  timeout: 45000,
  httpsAgent: scraperAgent,
  headers: {
    "User-Agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "uz,en-US;q=0.9",
  },
});

export const cbuHttpClient = axios.create({
  timeout: 15000,
  headers: {
    "User-Agent": "Mozilla/5.0 (compatible; CurrencyTracker/1.0)",
    Accept: "application/json",
  },
});
