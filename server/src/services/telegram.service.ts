import { Context, Markup, Telegraf } from 'telegraf';
import { env } from '../config/env';
import { logger } from '../config/logger';
import { userRepository } from '../repositories';
import {
  BankBoard,
  BankDetails,
  CurrencyDetails,
  CurrencySummary,
  TrendDirection,
} from '../types';
import { ratesService } from './rates.service';

const CURRENCIES = ['USD', 'EUR', 'RUB', 'GBP', 'CNY', 'JPY', 'KZT', 'TRY'];
const BANK_BOARD_CURRENCY = 'USD';
const BANK_PAGE_SIZE = 8;
const NOTIFY_DELAY_MS = 50;

let bot: Telegraf | null = null;

function trendIcon(trend: TrendDirection): string {
  if (trend === 'up') return '📈';
  if (trend === 'down') return '📉';
  return '➖';
}

function formatRate(value: number | null): string {
  if (value === null) {
    return '-';
  }

  return value.toLocaleString('uz-UZ', {
    minimumFractionDigits: value < 100 ? 2 : 0,
    maximumFractionDigits: 2,
  });
}

function formatDiff(summary: CurrencySummary): string {
  const sign = summary.diff > 0 ? '+' : '';
  return `${sign}${formatRate(summary.diff)}`;
}

function truncateLabel(value: string, limit = 24): string {
  return value.length > limit ? `${value.slice(0, limit - 1)}…` : value;
}

function mainInlineKeyboard(selectedCurrency?: string) {
  const buttons = CURRENCIES.map((currency) =>
    Markup.button.callback(
      selectedCurrency === currency ? `• ${currency}` : currency,
      `currency:${currency}`
    )
  );

  return Markup.inlineKeyboard(
    [
      buttons.slice(0, 3),
      buttons.slice(3, 6),
      buttons.slice(6, 8),
      [
        Markup.button.callback('Banklar', 'menu:banks'),
        Markup.button.callback('Markaziy bank', 'menu:overview'),
      ],
    ].filter((row) => row.length > 0)
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
    currentPage * BANK_PAGE_SIZE + BANK_PAGE_SIZE
  );

  const rows = [];
  for (let index = 0; index < pageBanks.length; index += 2) {
    rows.push(
      pageBanks.slice(index, index + 2).map((item) =>
        Markup.button.callback(
          truncateLabel(item.bank.nameUz),
          `bank:${item.bank.code}:${currentPage}`
        )
      )
    );
  }

  const navigation = [];
  if (currentPage > 0) {
    navigation.push(Markup.button.callback('‹ Oldingi', `banks:${currentPage - 1}`));
  }

  navigation.push(Markup.button.callback(`${currentPage + 1}/${totalPages}`, 'noop'));

  if (currentPage < totalPages - 1) {
    navigation.push(Markup.button.callback('Keyingi ›', `banks:${currentPage + 1}`));
  }

  rows.push(navigation);
  rows.push([
    Markup.button.callback('Yangilash', `banks:${currentPage}`),
    Markup.button.callback('Markaziy bank', 'menu:overview'),
  ]);

  return Markup.inlineKeyboard(rows.filter((row) => row.length > 0));
}

function bankDetailInlineKeyboard(page = 0) {
  return Markup.inlineKeyboard([
    [
      Markup.button.callback('‹ Banklar', `banks:${page}`),
      Markup.button.callback('Markaziy bank', 'menu:overview'),
    ],
  ]);
}

async function safeAnswerCbQuery(ctx: Context): Promise<void> {
  if ('callbackQuery' in ctx.update) {
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
  extra = mainInlineKeyboard()
): Promise<void> {
  const messageExtra = {
    parse_mode: 'HTML' as const,
    ...extra,
  };

  if ('callbackQuery' in ctx.update) {
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
      `${icon} <b>${currency.code}</b> ${formatRate(currency.cbRate)} so'm\n` +
      `   ${formatDiff(currency)} | qamrov ${currency.reportingBanks}/${currency.totalBanks} bank`
    );
  });

  return (
    `<b>Markaziy bank kurslari</b>\n` +
    `${currencies[0]?.date || ''}\n\n` +
    `${lines.join('\n\n')}\n\n` +
    `Valyutani tanlang yoki pastdagi "Banklar" tugmasi bilan USD boardni oching.`
  );
}

function formatCurrencyMessage(currency: string, details: CurrencyDetails): string {
  const summary = details.summary;
  const marketRows = details.rows.filter((row) => !row.bank.isCentral && row.hasRate).slice(0, 8);

  if (!summary) {
    return `<b>${currency}</b> uchun Markaziy bank ma'lumoti topilmadi.`;
  }

  const header =
    `${trendIcon(summary.trend)} <b>${currency}</b> ${formatRate(summary.cbRate)} so'm\n` +
    `${summary.date} | o'zgarish ${formatDiff(summary)}\n` +
    `Qamrov: ${summary.reportingBanks}/${summary.totalBanks} bank\n` +
    `Eng yaxshi xarid: ${formatRate(summary.bestBuy)} | eng yaxshi sotish: ${formatRate(summary.bestSell)}`;

  const body = marketRows
    .map((row) => {
      const spread = row.spread !== null ? formatRate(row.spread) : '-';
      return (
        `• <b>${row.bank.nameUz}</b>\n` +
        `  Xarid ${formatRate(row.buyRate)} | Sotish ${formatRate(row.sellRate)} | Spread ${spread}`
      );
    })
    .join('\n\n');

  const missing =
    details.missingBanks.length > 0
      ? `\n\n<i>Hozircha kurs yo'q:</i> ${details.missingBanks.slice(0, 5).join(', ')}${details.missingBanks.length > 5 ? '...' : ''}`
      : '';

  return `${header}\n\n${body}${missing}`;
}

function formatBankBoardMessage(board: BankBoard): string {
  const boardBanks = getDisplayableBoardBanks(board);
  const lines = boardBanks.map((item, index) => {
    const statusIcon = item.hasRate ? '🟢' : '⚪';
    return (
      `${index + 1}. ${statusIcon} <b>${item.bank.nameUz}</b>\n` +
      `   Xarid ${formatRate(item.buyRate)} | Sotish ${formatRate(item.sellRate)} | ${item.availableCurrencies} ta valyuta`
    );
  });

  return (
    `<b>Bugungi ${board.currency} kurslari</b>\n` +
    `${board.date || ''}\n` +
    `Qamrov: ${board.reportingBanks}/${board.totalBanks} bank\n\n` +
    `${lines.join('\n\n')}\n\n` +
    `Istalgan bank tugmasini bosing, logo va mavjud valyutalar chiqadi.`
  );
}

function formatBankDetailMessage(details: BankDetails): string {
  const header =
    `<b>${details.bank.nameUz}</b>\n` +
    `USD xarid ${formatRate(details.summary.usdBuyRate)} | sotish ${formatRate(details.summary.usdSellRate)}\n` +
    `Valyutalar soni: ${details.summary.currencyCount}\n` +
    `${details.summary.lastUpdated ? `Yangilangan: ${details.summary.lastUpdated}` : ''}`;

  const currencies = details.currencies
    .map(
      (currency) =>
        `• <b>${currency.code}</b> ${currency.currency}\n` +
        `  Xarid ${formatRate(currency.buyRate)} | Sotish ${formatRate(currency.sellRate)} | MB ${formatRate(currency.cbRate)}`
    )
    .join('\n\n');

  return `${header}\n\n${currencies}`;
}

export function isTelegramBotConfigured(): boolean {
  return Boolean(env.TELEGRAM_BOT_TOKEN?.trim());
}

export function getBot(): Telegraf {
  if (!isTelegramBotConfigured()) {
    throw new Error('Telegram bot token is not configured');
  }

  if (!bot) {
    bot = new Telegraf(env.TELEGRAM_BOT_TOKEN!);
    registerHandlers(bot);
  }

  return bot;
}

export async function startBot(): Promise<void> {
  if (!isTelegramBotConfigured()) {
    logger.warn('Telegram bot is disabled because TELEGRAM_BOT_TOKEN is missing');
    return;
  }

  const botInstance = getBot();

  try {
    // Prefer webhook mode. On Render free tier this is essential: when the
    // instance is woken by an incoming Telegram update (POST /api/bot/webhook),
    // polling would have already missed messages during sleep. Render injects
    // RENDER_EXTERNAL_URL automatically, so webhook works with no manual env.
    const webhookBase = env.TELEGRAM_WEBHOOK_URL || process.env.RENDER_EXTERNAL_URL;
    if (webhookBase) {
      const url = `${webhookBase.replace(/\/$/, '')}/api/bot/webhook`;
      await botInstance.telegram.setWebhook(url);
      logger.info(`Telegram webhook configured: ${url}`);
      return;
    }

    await botInstance.launch();
    logger.info('Telegram bot started in polling mode');
  } catch (error) {
    logger.error('Bot start error:', error);
  }
}

export async function stopBot(): Promise<void> {
  if (!bot) {
    return;
  }

  bot.stop('SIGTERM');
  logger.info('Telegram bot stopped');
}

function registerHandlers(botInstance: Telegraf): void {
  botInstance.start(async (ctx) => {
    await trackUser(ctx, '/start');
    const name = ctx.from?.first_name || 'Foydalanuvchi';

    await ctx.reply(
      `Salom, ${name}!\n\n` +
        `<b>Valyuta Tracker</b>\n` +
        `Default holatda 30 ta bankning bugungi USD kursini ko'rsataman.\n` +
        `Valyuta kesimini ko'rish uchun /rates, banklar uchun /banks yuboring.`,
      {
        parse_mode: 'HTML',
        ...Markup.keyboard([
          ['USD', 'EUR', 'RUB'],
          ['GBP', 'CNY', 'JPY'],
          ['/banks', '/rates'],
          ['/help'],
        ]).resize(),
      }
    );

    await sendBankBoard(ctx);
  });

  botInstance.command('banks', async (ctx) => {
    await trackUser(ctx, '/banks');
    await sendBankBoard(ctx);
  });

  botInstance.command('rates', async (ctx) => {
    await trackUser(ctx, '/rates');
    await sendOverview(ctx);
  });

  botInstance.command('help', async (ctx) => {
    await trackUser(ctx, '/help');
    await replyOrEdit(
      ctx,
      `<b>Buyruqlar</b>\n\n` +
        `/banks - 30 ta bankning bugungi USD kursi\n` +
        `/rates - Markaziy bank kurslari va trendlar\n` +
        `/usd, /eur, /rub - banklar kesimidagi kurslar\n` +
        `/help - yordam\n\n` +
        `Bank tugmasini bossangiz, logo va mavjud valyutalar chiqadi.`
    );
  });

  for (const currency of CURRENCIES) {
    botInstance.command(currency.toLowerCase(), async (ctx) => {
      await trackUser(ctx, `/${currency.toLowerCase()}`);
      await sendCurrencyDetails(ctx, currency);
    });

    botInstance.hears(currency, async (ctx) => {
      await trackUser(ctx, `${currency} button`);
      await sendCurrencyDetails(ctx, currency);
    });
  }

  botInstance.action(/^currency:([A-Z]{3})$/, async (ctx) => {
    const currency = ctx.match[1];
    await trackUser(ctx, `currency:${currency}`);
    await sendCurrencyDetails(ctx, currency);
  });

  botInstance.action(/^banks:(\d+)$/, async (ctx) => {
    const page = Number.parseInt(ctx.match[1], 10) || 0;
    await trackUser(ctx, `banks:${page}`);
    await sendBankBoard(ctx, page);
  });

  botInstance.action(/^bank:([a-z0-9-]+):(\d+)$/, async (ctx) => {
    const bankCode = ctx.match[1];
    const page = Number.parseInt(ctx.match[2], 10) || 0;
    await trackUser(ctx, `bank:${bankCode}`);
    await sendBankDetails(ctx, bankCode, page);
  });

  botInstance.action('menu:overview', async (ctx) => {
    await trackUser(ctx, 'menu:overview');
    await sendOverview(ctx);
  });

  botInstance.action('menu:banks', async (ctx) => {
    await trackUser(ctx, 'menu:banks');
    await sendBankBoard(ctx);
  });

  botInstance.action('noop', async (ctx) => {
    await safeAnswerCbQuery(ctx);
  });

  botInstance.on('text', async (ctx) => {
    const text = ctx.message.text.toUpperCase().trim();
    if (CURRENCIES.includes(text)) {
      await trackUser(ctx, text);
      await sendCurrencyDetails(ctx, text);
      return;
    }

    if (text === '/BANKS' || text === 'BANKLAR') {
      await trackUser(ctx, text);
      await sendBankBoard(ctx);
    }
  });
}

async function sendOverview(ctx: Context): Promise<void> {
  try {
    const overview = await ratesService.getRatesOverview();
    await replyOrEdit(ctx, formatOverviewMessage(overview.currencies), mainInlineKeyboard());
  } catch (error) {
    logger.error('sendOverview error:', error);
    await replyOrEdit(ctx, "Kurslarni olishda xatolik yuz berdi. Birozdan keyin qayta urinib ko'ring.");
  }
}

async function sendCurrencyDetails(ctx: Context, currency: string): Promise<void> {
  try {
    const details = await ratesService.getCurrencyDetails(currency);
    await replyOrEdit(ctx, formatCurrencyMessage(currency, details), mainInlineKeyboard(currency));
  } catch (error) {
    logger.error('sendCurrencyDetails error:', error);
    await replyOrEdit(ctx, 'Xatolik yuz berdi.');
  }
}

async function sendBankBoard(ctx: Context, page = 0): Promise<void> {
  try {
    const board = await ratesService.getBankBoard(BANK_BOARD_CURRENCY);
    await replyOrEdit(ctx, formatBankBoardMessage(board), bankBoardInlineKeyboard(board, page));
  } catch (error) {
    logger.error('sendBankBoard error:', error);
    await replyOrEdit(ctx, "Banklar bo'yicha ma'lumotni olishda xatolik yuz berdi.");
  }
}

async function sendBankDetails(ctx: Context, bankCode: string, page = 0): Promise<void> {
  try {
    const details = await ratesService.getBankDetails(bankCode);
    if (!details) {
      await safeAnswerCbQuery(ctx);
      await ctx.reply("Tanlangan bank topilmadi.");
      return;
    }

    const text = formatBankDetailMessage(details);
    const extra = {
      parse_mode: 'HTML' as const,
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
    logger.error('sendBankDetails error:', error);
    await safeAnswerCbQuery(ctx);
    await ctx.reply('Bank detailini olishda xatolik yuz berdi.');
  }
}

async function trackUser(ctx: Context, command: string): Promise<void> {
  if (!ctx.from) {
    return;
  }

  try {
    const telegramId = BigInt(ctx.from.id);

    await userRepository.upsertByTelegramId({
      telegramId,
      username: ctx.from.username,
      firstName: ctx.from.first_name,
      lastName: ctx.from.last_name,
    });

    const user = await userRepository.findByTelegramId(telegramId);
    if (user) {
      await userRepository.logRequest(user.id, command);
    }
  } catch (error) {
    logger.error('trackUser error:', error);
  }
}

export async function notifyUsersAboutRates(): Promise<void> {
  if (!isTelegramBotConfigured()) {
    return;
  }

  const botInstance = getBot();
  const users = await userRepository.getActiveUsers();

  let board: BankBoard;
  try {
    board = await ratesService.getBankBoard('USD');
  } catch (error) {
    logger.error('Failed to build USD board for notifications:', error);
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
            `   Xarid ${formatRate(b.buyRate)} | Sotish ${formatRate(b.sellRate)} so'm`
        )
        .join('\n')
    : 'Banklardan hozircha kurs ma\'lumoti yo\'q.';

  // Bugungi sana (Toshkent vaqti) — DD.MM.YYYY
  const todayStr = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Tashkent',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
    .format(new Date())
    .replace(/\//g, '.');

  // CBU har kuni yangi kurs e'lon qilmaydi. board.date — kursning rasmiy
  // sanasi; agar bugungidan farq qilsa, qavs ichida ko'rsatamiz.
  const isCbDate = /^\d{2}\.\d{2}\.\d{4}$/.test(board.date || '');
  const cbDateNote =
    isCbDate && board.date !== todayStr ? ` (${board.date} dagi rasmiy kurs)` : '';

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
        parse_mode: 'HTML',
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
