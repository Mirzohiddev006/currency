import { Context, Markup, Telegraf } from "telegraf";
import { env } from "../config/env";
import { logger } from "../config/logger";
import { userRepository } from "../repositories";
import {
  BankBoard,
  BankDetails,
  CurrencyDetails,
  CurrencySummary,
  TrendDirection,
} from "../types";
import { ratesService } from "./rates.service";

const CURRENCIES = ["USD", "EUR", "RUB", "GBP", "CNY", "JPY", "KZT", "TRY"];

const FLAGS: Record<string, string> = {
  USD: "🇺🇸",
  EUR: "🇪🇺",
  RUB: "🇷🇺",
  GBP: "🇬🇧",
  CNY: "🇨🇳",
  JPY: "🇯🇵",
  KZT: "🇰🇿",
  TRY: "🇹🇷",
};

const CURRENCY_NAMES: Record<string, string> = {
  USD: "Dollar",
  EUR: "Yevro",
  RUB: "Rubl",
  GBP: "Funt",
  CNY: "Yuan",
  JPY: "Yena",
  KZT: "Tenge",
  TRY: "Lira",
};

const LINE = "<code>━━━━━━━━━━━━━━━━━━</code>";

function flag(code: string): string {
  return FLAGS[code] || "💱";
}

const VIEW_RATES_BUTTON = "📊 Kurslar";
const CALC_BUTTON = "🧮 Kalkulyator";
const BANKS_BUTTON = "🏦 Banklar";
const CONTACT_BUTTON = "📱 Telefon raqamni ulashish";
const BANK_BOARD_CURRENCY = "USD";
const BANK_PAGE_SIZE = 8;
const NOTIFY_DELAY_MS = 50;
const BOT_CACHE_TTL_MS = 15_000;

let lastNewUserScrapeAt = 0;
const NEW_USER_SCRAPE_THROTTLE_MS = 10 * 60 * 1000; // 10 daqiqa

let bot: Telegraf | null = null;

type BotCacheEntry<T> = {
  expiresAt: number;
  value: T;
};

const boardCache = new Map<string, BotCacheEntry<BankBoard>>();
let overviewCache: BotCacheEntry<CurrencySummary[]> | null = null;

function getCachedValue<T>(entry: BotCacheEntry<T> | null): T | null {
  if (!entry || Date.now() > entry.expiresAt) {
    return null;
  }
  return entry.value;
}

function setCachedValue<T>(value: T): BotCacheEntry<T> {
  return { value, expiresAt: Date.now() + BOT_CACHE_TTL_MS };
}

function getCachedBoard(currency: string): BankBoard | null {
  const cached = boardCache.get(currency);
  return getCachedValue(cached || null);
}

function setCachedBoard(currency: string, board: BankBoard): void {
  boardCache.set(currency, setCachedValue(board));
}

function trendIcon(trend: TrendDirection): string {
  if (trend === "up") return "📈";
  if (trend === "down") return "📉";
  return "➖";
}

function formatRate(value: number | null): string {
  if (value === null) {
    return "-";
  }

  return value.toLocaleString("uz-UZ", {
    minimumFractionDigits: value < 100 ? 2 : 0,
    maximumFractionDigits: 2,
  });
}

function formatDiff(summary: CurrencySummary): string {
  const sign = summary.diff > 0 ? "+" : "";
  return `${sign}${formatRate(summary.diff)}`;
}

function truncateLabel(value: string, limit = 24): string {
  return value.length > limit ? `${value.slice(0, limit - 1)}…` : value;
}

function mainInlineKeyboard(selectedCurrency?: string) {
  const buttons = CURRENCIES.map((currency) =>
    Markup.button.callback(
      selectedCurrency === currency
        ? `• ${flag(currency)} ${currency}`
        : `${flag(currency)} ${currency}`,
      `currency:${currency}`,
    ),
  );

  return Markup.inlineKeyboard(
    [
      buttons.slice(0, 3),
      buttons.slice(3, 6),
      buttons.slice(6, 8),
      [
        Markup.button.callback("🏦 Banklar", "menu:banks"),
        Markup.button.callback("🏛 Markaziy bank", "menu:overview"),
      ],
    ].filter((row) => row.length > 0),
  );
}

function getDisplayableBoardBanks(board: BankBoard) {
  const reportingBanks = board.banks.filter((item) => item.hasRate);
  return reportingBanks.length > 0 ? reportingBanks : board.banks;
}

function bankBoardInlineKeyboard(board: BankBoard, page = 0) {
  const boardBanks = getDisplayableBoardBanks(board);
  const totalPages = Math.max(Math.ceil(boardBanks.length / BANK_PAGE_SIZE), 1);
  const currentPage = Math.min(Math.max(page, 0), totalPages - 1);
  const pageBanks = boardBanks.slice(
    currentPage * BANK_PAGE_SIZE,
    currentPage * BANK_PAGE_SIZE + BANK_PAGE_SIZE,
  );

  const rows = [];
  for (let index = 0; index < pageBanks.length; index += 2) {
    rows.push(
      pageBanks
        .slice(index, index + 2)
        .map((item) =>
          Markup.button.callback(
            truncateLabel(item.bank.nameUz),
            `bank:${item.bank.code}:${currentPage}`,
          ),
        ),
    );
  }

  const navigation = [];
  if (currentPage > 0) {
    navigation.push(
      Markup.button.callback("‹ Oldingi", `banks:${currentPage - 1}`),
    );
  }

  navigation.push(
    Markup.button.callback(`${currentPage + 1}/${totalPages}`, "noop"),
  );

  if (currentPage < totalPages - 1) {
    navigation.push(
      Markup.button.callback("Keyingi ›", `banks:${currentPage + 1}`),
    );
  }

  rows.push(navigation);
  rows.push([
    Markup.button.callback("Yangilash", `banks:${currentPage}`),
    Markup.button.callback("🏛 Markaziy bank", "menu:overview"),
  ]);

  return Markup.inlineKeyboard(rows.filter((row) => row.length > 0));
}

function bankDetailInlineKeyboard(page = 0) {
  return Markup.inlineKeyboard([
    [
      Markup.button.callback("‹ Banklar", `banks:${page}`),
      Markup.button.callback("🏛 Markaziy bank", "menu:overview"),
    ],
  ]);
}

async function safeAnswerCbQuery(ctx: Context): Promise<void> {
  if ("callbackQuery" in ctx.update) {
    try {
      await ctx.answerCbQuery();
    } catch {
      return;
    }
  }
}

async function replyOrEdit(
  ctx: Context,
  text: string,
  extra = mainInlineKeyboard(),
): Promise<void> {
  const messageExtra = {
    parse_mode: "HTML" as const,
    ...extra,
  };

  if ("callbackQuery" in ctx.update) {
    try {
      await ctx.editMessageText(text, messageExtra);
    } catch {
      await ctx.reply(text, messageExtra);
    }

    await safeAnswerCbQuery(ctx);
    return;
  }

  await ctx.reply(text, messageExtra);
}

function formatOverviewMessage(currencies: CurrencySummary[]): string {
  const lines = currencies.slice(0, 8).map((currency) => {
    const icon = trendIcon(currency.trend);
    return (
      `${icon} ${flag(currency.code)} <b>${currency.code}</b> ${formatRate(currency.cbRate)} so'm\n` +
      `   ${formatDiff(currency)} | qamrov ${currency.reportingBanks}/${currency.totalBanks} bank`
    );
  });

  return (
    `🏛 <b>Markaziy bank kurslari</b>\n` +
    `${currencies[0]?.date || ""}\n\n` +
    `${lines.join("\n\n")}\n\n` +
    `Valyutani tanlang yoki «🏦 Banklar» tugmasini bosing.`
  );
}

function formatCurrencyMessage(
  currency: string,
  details: CurrencyDetails,
): string {
  const summary = details.summary;
  const marketRows = details.rows
    .filter((row) => !row.bank.isCentral && row.hasRate)
    .slice(0, 8);

  if (!summary) {
    return `<b>${currency}</b> uchun Markaziy bank ma'lumoti topilmadi.`;
  }

  const header =
    `${trendIcon(summary.trend)} ${flag(currency)} <b>${currency}</b> ${formatRate(summary.cbRate)} so'm\n` +
    `${summary.date} | o'zgarish ${formatDiff(summary)}\n` +
    `Qamrov: ${summary.reportingBanks}/${summary.totalBanks} bank\n` +
    `Eng yaxshi xarid: ${formatRate(summary.bestBuy)} | eng yaxshi sotish: ${formatRate(summary.bestSell)}`;

  const body = marketRows
    .map((row) => {
      const spread = row.spread !== null ? formatRate(row.spread) : "-";
      return (
        `• <b>${row.bank.nameUz}</b>\n` +
        `  Xarid ${formatRate(row.buyRate)} | Sotish ${formatRate(row.sellRate)} | Spread ${spread}`
      );
    })
    .join("\n\n");

  const missing =
    details.missingBanks.length > 0
      ? `\n\n<i>Hozircha kurs yo'q:</i> ${details.missingBanks.slice(0, 5).join(", ")}${details.missingBanks.length > 5 ? "..." : ""}`
      : "";

  return `${header}\n\n${body}${missing}`;
}

function formatBankBoardMessage(board: BankBoard): string {
  const boardBanks = getDisplayableBoardBanks(board);
  const lines = boardBanks.map((item, index) => {
    const statusIcon = item.hasRate ? "🟢" : "⚪";
    return (
      `${index + 1}. ${statusIcon} <b>${item.bank.nameUz}</b>\n` +
      `   Xarid ${formatRate(item.buyRate)} | Sotish ${formatRate(item.sellRate)} | ${item.availableCurrencies} ta valyuta`
    );
  });

  return (
    `<b>Bugungi ${board.currency} kurslari</b>\n` +
    `${board.date || ""}\n` +
    `Qamrov: ${board.reportingBanks}/${board.totalBanks} bank\n\n` +
    `${lines.join("\n\n")}\n\n` +
    `Istalgan bank tugmasini bosing, logo va mavjud valyutalar chiqadi.`
  );
}

function formatBankDetailMessage(details: BankDetails): string {
  const header =
    `<b>${details.bank.nameUz}</b>\n` +
    `USD xarid ${formatRate(details.summary.usdBuyRate)} | sotish ${formatRate(details.summary.usdSellRate)}\n` +
    `Valyutalar soni: ${details.summary.currencyCount}\n` +
    `${details.summary.lastUpdated ? `Yangilangan: ${details.summary.lastUpdated}` : ""}`;

  const currencies = details.currencies
    .map(
      (currency) =>
        `• <b>${currency.code}</b> ${currency.currency}\n` +
        `  Xarid ${formatRate(currency.buyRate)} | Sotish ${formatRate(currency.sellRate)} | MB ${formatRate(currency.cbRate)}`,
    )
    .join("\n\n");

  return `${header}\n\n${currencies}`;
}

export function isTelegramBotConfigured(): boolean {
  return Boolean(env.TELEGRAM_BOT_TOKEN?.trim());
}

export function getBot(): Telegraf {
  if (!isTelegramBotConfigured()) {
    throw new Error("Telegram bot token is not configured");
  }

  if (!bot) {
    bot = new Telegraf(env.TELEGRAM_BOT_TOKEN!);
    registerHandlers(bot);
  }

  return bot;
}

export async function startBot(): Promise<void> {
  if (!isTelegramBotConfigured()) {
    logger.warn(
      "Telegram bot is disabled because TELEGRAM_BOT_TOKEN is missing",
    );
    return;
  }

  const botInstance = getBot();

  try {
    // Prefer webhook mode. On Render free tier this is essential: when the
    // instance is woken by an incoming Telegram update (POST /api/bot/webhook),
    // polling would have already missed messages during sleep. Render injects
    // RENDER_EXTERNAL_URL automatically, so webhook works with no manual env.
    const webhookBase =
      env.TELEGRAM_WEBHOOK_URL || process.env.RENDER_EXTERNAL_URL;
    if (webhookBase) {
      const url = `${webhookBase.replace(/\/$/, "")}/api/bot/webhook`;
      await botInstance.telegram.setWebhook(url);
      logger.info(`Telegram webhook configured: ${url}`);
      return;
    }

    await botInstance.launch();
    logger.info("Telegram bot started in polling mode");
  } catch (error) {
    logger.error("Bot start error:", error);
  }
}

export async function stopBot(): Promise<void> {
  if (!bot) {
    return;
  }

  bot.stop("SIGTERM");
  logger.info("Telegram bot stopped");
}

function mainReplyKeyboard() {
  return Markup.keyboard([
    [VIEW_RATES_BUTTON, CALC_BUTTON],
    [BANKS_BUTTON],
  ]).resize();
}

function contactRequestKeyboard() {
  return Markup.keyboard([[Markup.button.contactRequest(CONTACT_BUTTON)]])
    .resize()
    .oneTime();
}

async function promptForContact(ctx: Context, name: string): Promise<void> {
  await ctx.reply(
    `👋 Assalomu alaykum, <b>${name}</b>!\n\n` +
      `💱 <b>Valyuta Tracker</b>'ga xush kelibsiz — O'zbekiston banklarining eng so'nggi kurslari shu yerda.\n\n` +
      `Davom etish uchun pastdagi 📱 tugmani bosib telefon raqamingizni ulashing.\n` +
      `<i>Raqamingiz faqat kurs xabarlari uchun ishlatiladi.</i>`,
    {
      parse_mode: "HTML",
      ...contactRequestKeyboard(),
    },
  );
}

async function userHasPhone(ctx: Context): Promise<boolean> {
  if (!ctx.from) return false;
  try {
    const user = await userRepository.findByTelegramId(BigInt(ctx.from.id));
    return Boolean(user?.phone);
  } catch {
    return false;
  }
}

function registerHandlers(botInstance: Telegraf): void {
  // ── Telefon raqami darvozasi ─────────────────────────────
  // /start va kontakt ulashishdan tashqari barcha interaktsiyalar
  // telefon raqami ulashilgan bo'lishini talab qiladi.
  botInstance.use(async (ctx, next) => {
    // Inline query telefon darvozasidan o'tkazilmaydi (boshqa chatlarda ishlaydi).
    if ("inline_query" in ctx.update) {
      return next();
    }
    const msg = ctx.message;
    const isStart =
      !!msg &&
      "text" in msg &&
      typeof msg.text === "string" &&
      msg.text.startsWith("/start");
    const isContact = !!msg && "contact" in msg;

    if (isStart || isContact || !ctx.from) {
      return next();
    }

    if (!(await userHasPhone(ctx))) {
      await safeAnswerCbQuery(ctx);
      await promptForContact(ctx, ctx.from.first_name || "Foydalanuvchi");
      return;
    }

    return next();
  });

  botInstance.start(async (ctx) => {
    const isNewUser = ctx.from
      ? !(await userRepository.findByTelegramId(BigInt(ctx.from.id)))
      : false;
    await trackUser(ctx, "/start");
    const name = ctx.from?.first_name || "Foydalanuvchi";

    // Telefon raqami hali yo'q bo'lsa — avval uni so'raymiz.
    if (!(await userHasPhone(ctx))) {
      await promptForContact(ctx, name);
      if (isNewUser) {
        void maybeRefreshForNewUser();
      }
      return;
    }

    await ctx.reply(
      `👋 Assalomu alaykum, <b>${name}</b>!\n\n` +
        `💱 <b>Valyuta Tracker</b>\n` +
        `${LINE}\n` +
        `📊  Eng yaxshi bank kurslari\n` +
        `🧮  Valyuta kalkulyatori\n` +
        `🏦  30+ bank kesimi\n` +
        `🔔  Kunlik kurs xabarlari\n\n` +
        `Boshlash uchun pastdagi tugmalardan foydalaning 👇`,
      {
        parse_mode: "HTML",
        ...mainReplyKeyboard(),
      },
    );

    await sendTopRates(ctx, "USD");

    if (isNewUser) {
      void maybeRefreshForNewUser();
    }
  });

  // ── Kontakt (telefon raqami) ulashildi ───────────────────
  botInstance.on("contact", async (ctx) => {
    const contact = ctx.message?.contact;
    if (!ctx.from || !contact) return;

    // Foydalanuvchi faqat o'z raqamini ulashishi mumkin.
    if (contact.user_id && contact.user_id !== ctx.from.id) {
      await ctx.reply(
        `Iltimos, o'zingizning raqamingizni ulashing — pastdagi «${CONTACT_BUTTON}» tugmasi orqali.`,
        contactRequestKeyboard(),
      );
      return;
    }

    await trackUser(ctx, "share_contact");
    try {
      await userRepository.setPhone(BigInt(ctx.from.id), contact.phone_number);
    } catch (error) {
      logger.error("setPhone error:", error);
    }

    const name = ctx.from.first_name || "Foydalanuvchi";
    await ctx.reply(
      `✅ Rahmat, <b>${name}</b>! Hammasi tayyor.\n\n` +
        `Endi pastdagi tugmalar orqali kurslar, kalkulyator va banklardan foydalanishingiz mumkin 👇`,
      mainReplyKeyboard(),
    );
    await sendTopRates(ctx, "USD");
  });

  botInstance.command("banks", async (ctx) => {
    void trackUser(ctx, "/banks");
    await sendBankBoard(ctx);
  });

  botInstance.command("rates", async (ctx) => {
    void trackUser(ctx, "/rates");
    await sendOverview(ctx);
  });

  botInstance.command("help", async (ctx) => {
    void trackUser(ctx, "/help");
    await replyOrEdit(
      ctx,
      `<b>Buyruqlar</b>\n\n` +
        `/banks - 30 ta bankning bugungi USD kursi\n` +
        `/rates - Markaziy bank kurslari va trendlar\n` +
        `/usd, /eur, /rub - banklar kesimidagi kurslar\n` +
        `/help - yordam\n\n` +
        `Pastdagi «${VIEW_RATES_BUTTON}» tugmasi orqali Markaziy bank kursini ko'rasiz.`,
    );
  });

  botInstance.hears(VIEW_RATES_BUTTON, async (ctx) => {
    void trackUser(ctx, "view_rates_button");
    await sendTopRates(ctx, "USD");
  });

  botInstance.hears(CALC_BUTTON, async (ctx) => {
    void trackUser(ctx, "calc_button");
    await ctx.reply(CALC_HINT, { parse_mode: "HTML" });
  });

  botInstance.hears(BANKS_BUTTON, async (ctx) => {
    void trackUser(ctx, "banks_button");
    await sendBankBoard(ctx);
  });

  for (const currency of CURRENCIES) {
    botInstance.command(currency.toLowerCase(), async (ctx) => {
      void trackUser(ctx, `/${currency.toLowerCase()}`);
      await sendTopRates(ctx, currency);
    });

    botInstance.hears(currency, async (ctx) => {
      void trackUser(ctx, `${currency} button`);
      await sendTopRates(ctx, currency);
    });
  }

  botInstance.action(/^currency:([A-Z]{3})$/, async (ctx) => {
    void safeAnswerCbQuery(ctx);
    const currency = ctx.match[1];
    void trackUser(ctx, `currency:${currency}`);
    await sendTopRates(ctx, currency);
  });

  botInstance.action(/^banks:(\d+)$/, async (ctx) => {
    void safeAnswerCbQuery(ctx);
    const page = Number.parseInt(ctx.match[1], 10) || 0;
    void trackUser(ctx, `banks:${page}`);
    await sendBankBoard(ctx, page);
  });

  botInstance.action(/^bank:([a-z0-9-]+):(\d+)$/, async (ctx) => {
    void safeAnswerCbQuery(ctx);
    const bankCode = ctx.match[1];
    const page = Number.parseInt(ctx.match[2], 10) || 0;
    void trackUser(ctx, `bank:${bankCode}`);
    await sendBankDetails(ctx, bankCode, page);
  });

  botInstance.action("menu:overview", async (ctx) => {
    void safeAnswerCbQuery(ctx);
    void trackUser(ctx, "menu:overview");
    await sendOverview(ctx);
  });

  botInstance.action("menu:banks", async (ctx) => {
    void safeAnswerCbQuery(ctx);
    void trackUser(ctx, "menu:banks");
    await sendBankBoard(ctx);
  });

  botInstance.action(/^top:([A-Z]{3})$/, async (ctx) => {
    void safeAnswerCbQuery(ctx);
    const currency = ctx.match[1];
    void trackUser(ctx, `top:${currency}`);
    await sendTopRates(ctx, currency);
  });

  botInstance.action("calc", async (ctx) => {
    void safeAnswerCbQuery(ctx);
    void trackUser(ctx, "calc:open");
    await ctx.reply(CALC_HINT, { parse_mode: "HTML" });
  });

  botInstance.action("digest:toggle", async (ctx) => {
    if (!ctx.from) return;
    void safeAnswerCbQuery(ctx);
    const enabled = !(await getDigestState(ctx));
    try {
      await userRepository.setDailyDigest(BigInt(ctx.from.id), enabled);
    } catch (error) {
      logger.error("setDailyDigest error:", error);
    }
    void trackUser(ctx, `digest:${enabled ? "on" : "off"}`);
    try {
      await ctx.answerCbQuery(
        enabled ? "🔔 Kunlik xabar yoqildi" : "🔕 Kunlik xabar o'chirildi",
      );
    } catch {
      // ignore
    }
    await sendTopRates(ctx, "USD");
  });

  botInstance.action("noop", async (ctx) => {
    await safeAnswerCbQuery(ctx);
  });

  botInstance.on("text", async (ctx) => {
    const raw = ctx.message.text.trim();
    const text = raw.toUpperCase();
    if (CURRENCIES.includes(text)) {
      void trackUser(ctx, text);
      await sendTopRates(ctx, text);
      return;
    }

    if (text === "/BANKS" || text === "BANKLAR") {
      void trackUser(ctx, text);
      await sendBankBoard(ctx);
      return;
    }

    // Kalkulyator: "100 USD", "100$", "1000000 som" ...
    const calc = parseCalcQuery(raw);
    if (calc) {
      void trackUser(ctx, "calc");
      await handleCalc(ctx, calc.amount, calc.code);
    }
  });

  // ── Inline rejim — istalgan chatda @bot USD ───────────────
  botInstance.on("inline_query", async (ctx) => {
    try {
      const board = await ratesService.getBankBoard("USD");
      const text = formatTopRatesMessage(board, "USD");
      const cbRate = board.banks.find((b) => b.cbRate !== null)?.cbRate ?? null;
      await ctx.answerInlineQuery(
        [
          {
            type: "article",
            id: "usd-top",
            title: "💵 USD kursi — eng yaxshi banklar",
            description: cbRate
              ? `Markaziy bank: ${formatRate(cbRate)} so'm`
              : "Dollar kursi",
            input_message_content: {
              message_text: text,
              parse_mode: "HTML",
            },
          },
        ],
        { cache_time: 60 },
      );
    } catch (error) {
      logger.error("inline_query error:", error);
    }
  });
}

// ── Top kurslar (USD asosiy) + kalkulyator ────────────────
const RATE_CURRENCIES = ["USD", "EUR", "RUB"];

const CALC_SYMBOLS: Record<string, string> = {
  $: "USD",
  "€": "EUR",
  "₽": "RUB",
};

const CALC_HINT =
  "🧮 <b>Kalkulyator</b>\n" +
  LINE +
  "\n" +
  "Summani yozing — men eng yaxshi kursda hisoblayman:\n\n" +
  "💵  <code>100 USD</code>  yoki  <code>100$</code>\n" +
  "💶  <code>50 EUR</code>\n" +
  "💴  <code>5000 RUB</code>\n" +
  "💰  <code>1000000</code>  → dollar/yevro/rublda\n\n" +
  "Shunchaki yozib yuboring 👇";

function topRatesKeyboard(currency: string, digestOn: boolean) {
  const curRow = RATE_CURRENCIES.map((c) =>
    Markup.button.callback(
      c === currency ? `• ${flag(c)} ${c}` : `${flag(c)} ${c}`,
      `top:${c}`,
    ),
  );
  return Markup.inlineKeyboard([
    curRow,
    [
      Markup.button.callback("🧮 Kalkulyator", "calc"),
      Markup.button.callback(
        digestOn ? "🔔 Kunlik xabar: ON" : "🔕 Kunlik xabar: OFF",
        "digest:toggle",
      ),
    ],
    [
      Markup.button.callback("🏦 Banklar", "menu:banks"),
      Markup.button.callback("🏛 Markaziy bank", "menu:overview"),
    ],
  ]);
}

function formatTopRatesMessage(board: BankBoard, currency: string): string {
  const reporting = board.banks.filter((b) => b.hasRate);
  const cbRate = board.banks.find((b) => b.cbRate !== null)?.cbRate ?? null;
  const name = CURRENCY_NAMES[currency] || currency;
  const medals = ["🥇", "🥈", "🥉"];

  const bestBuy = reporting
    .filter((b) => b.buyRate !== null)
    .sort((a, b) => (b.buyRate as number) - (a.buyRate as number))
    .slice(0, 3);
  const bestSell = reporting
    .filter((b) => b.sellRate !== null)
    .sort((a, b) => (a.sellRate as number) - (b.sellRate as number))
    .slice(0, 3);

  const buyLines = bestBuy.length
    ? bestBuy
        .map(
          (b, i) =>
            `${medals[i]} ${b.bank.nameUz} — <b>${formatRate(b.buyRate)}</b>`,
        )
        .join("\n")
    : "   Ma'lumot yo'q";
  const sellLines = bestSell.length
    ? bestSell
        .map(
          (b, i) =>
            `${medals[i]} ${b.bank.nameUz} — <b>${formatRate(b.sellRate)}</b>`,
        )
        .join("\n")
    : "   Ma'lumot yo'q";

  return (
    `${flag(currency)} <b>${name} · ${currency}</b>\n` +
    `${LINE}\n` +
    `🏛 Markaziy bank:  <b>${formatRate(cbRate)}</b> so'm\n` +
    `📅 ${board.date || ""}\n\n` +
    `📈 <b>Sotib olish</b> — eng baland\n${buyLines}\n\n` +
    `📉 <b>Sotish</b> — eng arzon\n${sellLines}\n\n` +
    `🏦 ${board.reportingBanks} ta bank · narxlar so'mda`
  );
}

async function getDigestState(ctx: Context): Promise<boolean> {
  if (!ctx.from) return true;
  try {
    const user = await userRepository.findByTelegramId(BigInt(ctx.from.id));
    return user?.dailyDigest ?? true;
  } catch {
    return true;
  }
}

async function sendTopRates(ctx: Context, currency = "USD"): Promise<void> {
  try {
    const cachedBoard = getCachedBoard(currency);
    const [board, digestOn] = await Promise.all([
      cachedBoard
        ? Promise.resolve(cachedBoard)
        : ratesService.getBankBoard(currency),
      getDigestState(ctx),
    ]);
    if (!cachedBoard) {
      setCachedBoard(currency, board);
    }
    await replyOrEdit(
      ctx,
      formatTopRatesMessage(board, currency),
      topRatesKeyboard(currency, digestOn),
    );
  } catch (error) {
    logger.error("sendTopRates error:", error);
    await replyOrEdit(
      ctx,
      "Kurslarni olishda xatolik yuz berdi. Birozdan keyin qayta urinib ko'ring.",
    );
  }
}

function parseCalcQuery(raw: string): { amount: number; code: string } | null {
  const text = raw.trim();
  const match = text.match(/^([\d  .,]+)\s*([a-z$€₽']*)\s*$/i);
  if (!match) return null;

  let numRaw = match[1].replace(/[\s ]/g, "");
  if (numRaw.includes(",") && numRaw.includes(".")) {
    numRaw = numRaw.replace(/,/g, "");
  } else {
    numRaw = numRaw.replace(",", ".");
  }
  const amount = Number.parseFloat(numRaw);
  if (!Number.isFinite(amount) || amount <= 0) return null;

  let token = (match[2] || "").trim();
  if (CALC_SYMBOLS[token]) token = CALC_SYMBOLS[token];
  token = token.toUpperCase().replace(/'/g, "");

  if (token === "" || ["SUM", "SOM", "UZS", "СУМ"].includes(token)) {
    return { amount, code: "UZS" };
  }
  if (token === "RUBL" || token === "РУБ") token = "RUB";
  // Istalgan 3 harfli valyuta kodi (CBU 74 valyuta) — mavjudligini handleCalc tekshiradi
  if (/^[A-Z]{3}$/.test(token)) return { amount, code: token };
  return null;
}

async function handleCalc(
  ctx: Context,
  amount: number,
  code: string,
): Promise<void> {
  try {
    if (code === "UZS") {
      const lines: string[] = [];
      for (const cur of RATE_CURRENCIES) {
        const details = await ratesService.getCurrencyDetails(cur);
        const cb = details.summary?.cbRate ?? null;
        if (cb) {
          const converted = (amount / cb).toLocaleString("uz-UZ", {
            maximumFractionDigits: 2,
          });
          lines.push(`${flag(cur)}  <b>${converted}</b> ${cur}`);
        }
      }
      await ctx.reply(
        `🧮 <b>Kalkulyator</b>\n${LINE}\n` +
          `💰 <b>${formatRate(amount)}</b> so'm =\n\n${lines.join("\n")}\n\n` +
          `<i>🏛 Markaziy bank kursi bo'yicha</i>`,
        { parse_mode: "HTML" },
      );
      return;
    }

    const cachedBoard = getCachedBoard(code);
    const board = cachedBoard ?? (await ratesService.getBankBoard(code));
    if (!cachedBoard) {
      setCachedBoard(code, board);
    }
    const reporting = board.banks.filter((b) => b.hasRate);
    const cb = board.banks.find((b) => b.cbRate !== null)?.cbRate ?? null;
    const bestBuyBank = reporting
      .filter((b) => b.buyRate !== null)
      .sort((a, b) => (b.buyRate as number) - (a.buyRate as number))[0];
    const bestSellBank = reporting
      .filter((b) => b.sellRate !== null)
      .sort((a, b) => (a.sellRate as number) - (b.sellRate as number))[0];

    const parts: string[] = [];
    if (cb) {
      parts.push(
        `🏛 <b>Markaziy bank</b>\n     ${formatRate(amount * cb)} so'm`,
      );
    }
    if (bestSellBank) {
      parts.push(
        `🛒 <b>Sotib olsangiz</b> · ${bestSellBank.bank.nameUz}\n` +
          `     ${formatRate(amount * (bestSellBank.sellRate as number))} so'm`,
      );
    }
    if (bestBuyBank) {
      parts.push(
        `💸 <b>Sotsangiz</b> · ${bestBuyBank.bank.nameUz}\n` +
          `     ${formatRate(amount * (bestBuyBank.buyRate as number))} so'm`,
      );
    }

    if (parts.length === 0) {
      await ctx.reply(`${code} uchun hozircha kurs ma'lumoti yo'q.`, {
        parse_mode: "HTML",
      });
      return;
    }

    const amountStr = amount.toLocaleString("uz-UZ", {
      maximumFractionDigits: 2,
    });
    await ctx.reply(
      `🧮 <b>Kalkulyator</b>\n${LINE}\n` +
        `${flag(code)} <b>${amountStr} ${code}</b> =\n\n${parts.join("\n\n")}`,
      { parse_mode: "HTML" },
    );
  } catch (error) {
    logger.error("handleCalc error:", error);
    await ctx.reply("Hisoblashda xatolik yuz berdi.");
  }
}

async function sendOverview(ctx: Context): Promise<void> {
  try {
    const cachedOverview = getCachedValue(overviewCache);
    const overviewCurrencies = cachedOverview
      ? cachedOverview
      : (await ratesService.getRatesOverview()).currencies;
    if (!cachedOverview) {
      overviewCache = setCachedValue(overviewCurrencies);
    }
    await replyOrEdit(
      ctx,
      formatOverviewMessage(overviewCurrencies),
      mainInlineKeyboard(),
    );
  } catch (error) {
    logger.error("sendOverview error:", error);
    await replyOrEdit(
      ctx,
      "Kurslarni olishda xatolik yuz berdi. Birozdan keyin qayta urinib ko'ring.",
    );
  }
}

async function sendCurrencyDetails(
  ctx: Context,
  currency: string,
): Promise<void> {
  try {
    const details = await ratesService.getCurrencyDetails(currency);
    await replyOrEdit(
      ctx,
      formatCurrencyMessage(currency, details),
      mainInlineKeyboard(currency),
    );
  } catch (error) {
    logger.error("sendCurrencyDetails error:", error);
    await replyOrEdit(ctx, "Xatolik yuz berdi.");
  }
}

async function sendBankBoard(ctx: Context, page = 0): Promise<void> {
  try {
    const cachedBoard = getCachedBoard(BANK_BOARD_CURRENCY);
    const board =
      cachedBoard ?? (await ratesService.getBankBoard(BANK_BOARD_CURRENCY));
    if (!cachedBoard) {
      setCachedBoard(BANK_BOARD_CURRENCY, board);
    }
    await replyOrEdit(
      ctx,
      formatBankBoardMessage(board),
      bankBoardInlineKeyboard(board, page),
    );
  } catch (error) {
    logger.error("sendBankBoard error:", error);
    await replyOrEdit(
      ctx,
      "Banklar bo'yicha ma'lumotni olishda xatolik yuz berdi.",
    );
  }
}

async function sendBankDetails(
  ctx: Context,
  bankCode: string,
  page = 0,
): Promise<void> {
  try {
    const details = await ratesService.getBankDetails(bankCode);
    if (!details) {
      await safeAnswerCbQuery(ctx);
      await ctx.reply("Tanlangan bank topilmadi.");
      return;
    }

    const text = formatBankDetailMessage(details);
    const extra = {
      parse_mode: "HTML" as const,
      ...bankDetailInlineKeyboard(page),
    };

    await safeAnswerCbQuery(ctx);

    if (details.bank.logoUrl) {
      await ctx.replyWithPhoto(details.bank.logoUrl, {
        caption: text,
        ...extra,
      });
      return;
    }

    await ctx.reply(text, extra);
  } catch (error) {
    logger.error("sendBankDetails error:", error);
    await safeAnswerCbQuery(ctx);
    await ctx.reply("Bank detailini olishda xatolik yuz berdi.");
  }
}

async function trackUser(ctx: Context, command: string): Promise<void> {
  if (!ctx.from) {
    return;
  }
  const from = ctx.from;
  // Foydalanuvchi yozuvi va so'rov logi FONDA bajariladi — javobni kechiktirmaydi.
  void (async () => {
    try {
      const user = await userRepository.upsertByTelegramId({
        telegramId: BigInt(from.id),
        username: from.username,
        firstName: from.first_name,
        lastName: from.last_name,
      });
      await userRepository.logRequest(user.id, command);
    } catch (error) {
      logger.error("trackUser error:", error);
    }
  })();
}

// Yangi foydalanuvchi /start bosganda fon rejimida kurslarni yangilaymiz.
// Ko'p user bir vaqtda qo'shilsa scraper'ni urmaslik uchun throttle bor.
async function maybeRefreshForNewUser(): Promise<void> {
  const now = Date.now();
  if (now - lastNewUserScrapeAt < NEW_USER_SCRAPE_THROTTLE_MS) {
    return;
  }
  lastNewUserScrapeAt = now;
  try {
    logger.info("🆕 New user joined — running background rates refresh");
    const r = await ratesService.refreshAllRates();
    logger.info(
      `🆕 New-user refresh done. CBU: ${r.cbuRates}, banks: ${r.bankResults.length}`,
    );
  } catch (error) {
    logger.error("New-user refresh failed:", error);
  }
}

export async function notifyUsersAboutRates(): Promise<void> {
  if (!isTelegramBotConfigured()) {
    return;
  }

  const botInstance = getBot();
  const users = await userRepository.getDigestSubscribers();

  let board: BankBoard;
  try {
    board = await ratesService.getBankBoard("USD");
  } catch (error) {
    logger.error("Failed to build USD board for notifications:", error);
    return;
  }

  // Markaziy bank USD kursi
  const cbRate = board.banks.find((b) => b.cbRate !== null)?.cbRate ?? null;

  // Eng yirik 5 ta hisobot bergan bank (kursi mavjudlari)
  const topBanks = board.banks.filter((b) => b.hasRate).slice(0, 5);

  const bankLines = topBanks.length
    ? topBanks
        .map(
          (b, i) =>
            `${i + 1}. <b>${b.bank.nameUz}</b>\n` +
            `   Xarid ${formatRate(b.buyRate)} | Sotish ${formatRate(b.sellRate)} so'm`,
        )
        .join("\n")
    : "Banklardan hozircha kurs ma'lumoti yo'q.";

  // Bugungi sana (Toshkent vaqti) — DD.MM.YYYY
  const todayStr = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Tashkent",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  })
    .format(new Date())
    .replace(/\//g, ".");

  // CBU har kuni yangi kurs e'lon qilmaydi. board.date — kursning rasmiy
  // sanasi; agar bugungidan farq qilsa, qavs ichida ko'rsatamiz.
  const isCbDate = /^\d{2}\.\d{2}\.\d{4}$/.test(board.date || "");
  const cbDateNote =
    isCbDate && board.date !== todayStr
      ? ` (${board.date} dagi rasmiy kurs)`
      : "";

  const text =
    `\u{1F4B5} <b>Dollar (USD) kursi</b>\n` +
    `\u{1F4C5} ${todayStr}\n\n` +
    `\u{1F3E6} <b>Markaziy bank:</b> ${formatRate(cbRate)} so'm${cbDateNote}\n\n` +
    `\u{1F4CA} <b>Eng yirik 5 bank:</b>\n` +
    bankLines;

  let successCount = 0;

  for (const user of users) {
    try {
      await botInstance.telegram.sendMessage(Number(user.telegramId), text, {
        parse_mode: "HTML",
        ...mainInlineKeyboard(),
      });
      successCount++;
      await new Promise((resolve) => setTimeout(resolve, NOTIFY_DELAY_MS));
    } catch {
      await userRepository.deactivateUser(user.id);
    }
  }

  logger.info(`Telegram notifications sent: ${successCount}/${users.length}`);
}

export interface BroadcastResult {
  total: number;
  sent: number;
  failed: number;
}

export interface BroadcastMedia {
  imageUrl?: string;
  fileBase64?: string;
  fileName?: string;
  mimeType?: string;
}

// Admin panel orqali barcha faol foydalanuvchilarga xabar yuborish.
// Matn ixtiyoriy; rasm URL yoki yuklangan fayl (base64) qo'shilishi mumkin.
// Yuklangan fayl bir marta yuklanadi, keyin file_id qayta ishlatiladi (tezlik uchun).
export async function broadcastToUsers(
  text: string,
  media?: BroadcastMedia,
): Promise<BroadcastResult> {
  if (!isTelegramBotConfigured()) {
    throw new Error("Telegram bot is not configured");
  }

  const botInstance = getBot();
  const users = await userRepository.getActiveUsers();

  let sent = 0;
  let failed = 0;
  const rawCaption = text?.trim() || "";
  const hasMedia = Boolean(media?.fileBase64 || media?.imageUrl);
  // Media uchun caption limiti 1024 belgi (Telegram cheklovi).
  const caption = hasMedia
    ? rawCaption
      ? rawCaption.slice(0, 1024)
      : undefined
    : rawCaption || undefined;

  const buffer = media?.fileBase64
    ? Buffer.from(media.fileBase64, "base64")
    : null;
  const isImage = (media?.mimeType || "").startsWith("image/");
  const fileName = media?.fileName || "file";
  let cachedFileId: string | null = null;

  for (const user of users) {
    const chatId = Number(user.telegramId);
    try {
      if (buffer) {
        if (isImage) {
          const input: any = cachedFileId ?? { source: buffer };
          const msg = await botInstance.telegram.sendPhoto(chatId, input, {
            caption,
            parse_mode: "HTML",
          });
          if (!cachedFileId && "photo" in msg && msg.photo.length) {
            cachedFileId = msg.photo[msg.photo.length - 1].file_id;
          }
        } else {
          const input: any = cachedFileId ?? {
            source: buffer,
            filename: fileName,
          };
          const msg = await botInstance.telegram.sendDocument(chatId, input, {
            caption,
            parse_mode: "HTML",
          });
          if (!cachedFileId && "document" in msg && msg.document) {
            cachedFileId = msg.document.file_id;
          }
        }
      } else if (media?.imageUrl) {
        await botInstance.telegram.sendPhoto(chatId, media.imageUrl, {
          caption,
          parse_mode: "HTML",
        });
      } else {
        await botInstance.telegram.sendMessage(chatId, caption || "", {
          parse_mode: "HTML",
        });
      }
      sent++;
      await new Promise((resolve) => setTimeout(resolve, NOTIFY_DELAY_MS));
    } catch (error) {
      failed++;
      // Bloklagan / o'chirgan foydalanuvchilarni faolsizlantiramiz
      try {
        await userRepository.deactivateUser(user.id);
      } catch {
        // ignore
      }
    }
  }

  logger.info(
    `📣 Broadcast done: ${sent} sent, ${failed} failed / ${users.length} total`,
  );
  return { total: users.length, sent, failed };
}
