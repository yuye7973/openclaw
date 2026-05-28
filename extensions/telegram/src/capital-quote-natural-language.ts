import { execFile } from "node:child_process";
import path from "node:path";
import { promisify } from "node:util";
import { resolveOpenClawRepoRoot } from "./repo-root-runtime.js";

const execFileAsync = promisify(execFile);

const CAPITAL_QUOTE_REPLY_SCRIPT = path.join(
  "scripts",
  "openclaw-capital-quote-telegram-reply.mjs",
);
const CAPITAL_SIMULATED_LIVE_ORDER_SCRIPT = path.join(
  "scripts",
  "openclaw-capital-telegram-simulated-live-order.mjs",
);
const CAPITAL_QUOTE_REPLY_TIMEOUT_MS = 45_000;
const CAPITAL_QUOTE_REPLY_MAX_BUFFER = 1024 * 1024;
const QUOTE_INTENT_RE = /(報價|即時價|最新價|目前價|現在價|價位|點位|價格|報$)/u;
const TRADING_ASSIST_INTENT_RE =
  /(自動交易|交易助手|模擬下單|模擬真單|下單|進場|出場|平倉|加碼|減碼|加倉|減倉|加空|補空|回補|做多|做空|買入|賣出)/u;
const RISK_GUIDANCE_INTENT_RE =
  /(停損|停利|止損|止盈|stop[-_\s]?loss|take[-_\s]?profit|\bSL\b|\bTP\b)/iu;
const ORDER_SIDE_BUY_RE = /(補空|回補|cover|buy\s*to\s*cover)/iu;
const ORDER_SIDE_SELL_RE = /(空|賣|sell|short|出場|平倉|減碼|減倉)/iu;
const ORDER_QUANTITY_WITH_UNIT_RE = /(\d+)\s*(?:口|張|qty|lot)/iu;
const ORDER_QUANTITY_FALLBACK_RE = /(?:^|\s)(\d+)(?:\s|$)/iu;

const PRODUCT_PATTERNS: ReadonlyArray<{ symbol: string; pattern: RegExp }> = [
  { symbol: "A50", pattern: /(A50|CN0000|OJO05|FA5005|富時中國|新加坡A50)/iu },
  {
    symbol: "TXF current-month",
    pattern:
      /(台指期當月|台指當月|台指本月|台指當期|TXF當月|TXF本月|TXF當期|TXF\s+CURRENT[-_\s]*MONTH)/iu,
  },
  {
    symbol: "TXF next-month",
    pattern:
      /(台指期下個月|台指下個月|台指下月|台指次月|TXF下個月|TXF下月|TXF次月|TXF\s+NEXT[-_\s]*MONTH)/iu,
  },
  { symbol: "TX00", pattern: /(台指近|台指期|台指|TX00AM|TX00PM|TX00|TXF)/iu },
  { symbol: "TX05AM", pattern: /(台指05|TX05AM|TX05PM|TX05)/iu },
  { symbol: "TE00AM", pattern: /(電指近|電指|TE00AM|TE00PM|TE00)/iu },
  { symbol: "XE0000AM", pattern: /(歐元近|歐元|XE0000AM|XE0000PM|XE0000)/iu },
  { symbol: "CD0000", pattern: /(加幣熱|加幣|CD0000|6C)/iu },
  { symbol: "MCL0000", pattern: /(微輕原油|MCL0000|MCL熱|(?:^|[^A-Z0-9])MCL(?:[^A-Z0-9]|$))/iu },
  { symbol: "CL0000", pattern: /(原油期貨|輕原油|原油|WTI|CRUDE|CL0000|CL熱|CL)/iu },
  { symbol: "BZ0000", pattern: /(布蘭特油|布蘭特|BRENT|BZ0000|BZ熱|BZ)/iu },
  {
    symbol: "GC0000",
    pattern: /(黃金期貨|黃金|GOLD|GC0000|MGC0000|1OZ0000|GC熱|(?:^|[^A-Z0-9])GC(?:[^A-Z0-9]|$))/iu,
  },
  {
    symbol: "ES0000",
    pattern: /(標普期貨|標普|S&P|SP500|ES0000|MES0000|ES熱|(?:^|[^A-Z0-9])ES(?:[^A-Z0-9]|$))/iu,
  },
  {
    symbol: "NQ0000",
    pattern:
      /(那指期貨|那斯達克|納斯達克|小那|NASDAQ|NQ0000|MNQ0000|NQ熱|(?:^|[^A-Z0-9])NQ(?:[^A-Z0-9]|$))/iu,
  },
];

type CapitalQuoteNaturalLanguageMatch = {
  mode: "quote" | "simulated_live_order" | "risk_guidance";
  query: string;
  symbol: string;
  simulatedLiveOrderText?: string;
};

function readReplyText(value: unknown): string {
  if (!value || typeof value !== "object" || !("replyText" in value)) {
    return "";
  }
  const replyText = (value as { replyText?: unknown }).replyText;
  return typeof replyText === "string" ? replyText.trim() : "";
}

function formatQuoteError(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error);
  return message.replace(/\s+/gu, " ").trim().slice(0, 240) || "unknown_error";
}

function resolveSimulatedLiveOrderSymbol(symbol: string): string | null {
  if (symbol === "A50") {
    return "A50";
  }
  if (
    symbol === "TX00" ||
    symbol === "TX05AM" ||
    symbol === "TXF current-month" ||
    symbol === "TXF next-month"
  ) {
    return "TX00";
  }
  if (symbol === "CL0000") {
    return "CL0000";
  }
  if (symbol === "MCL0000") {
    return "MCL0000";
  }
  return null;
}

export function resolveCapitalQuoteNaturalLanguageMatch(
  text: string,
): CapitalQuoteNaturalLanguageMatch | null {
  const raw = text.trim();
  if (!raw) {
    return null;
  }
  if (raw.startsWith("/")) {
    return null;
  }
  const quoteIntent = QUOTE_INTENT_RE.test(raw);
  const tradingIntent = TRADING_ASSIST_INTENT_RE.test(raw);
  const riskIntent = RISK_GUIDANCE_INTENT_RE.test(raw);
  if (!quoteIntent && !tradingIntent && !riskIntent) {
    return null;
  }
  const product = PRODUCT_PATTERNS.find((entry) => entry.pattern.test(raw));
  if (!product) {
    return null;
  }
  if (riskIntent) {
    return {
      mode: "risk_guidance",
      query: `/quote ${product.symbol}`,
      symbol: product.symbol,
    };
  }
  if (tradingIntent && !quoteIntent) {
    const orderSymbol = resolveSimulatedLiveOrderSymbol(product.symbol);
    if (orderSymbol) {
      const sideText = ORDER_SIDE_BUY_RE.test(raw)
        ? "多"
        : ORDER_SIDE_SELL_RE.test(raw)
          ? "空"
          : "多";
      const quantityMatch =
        raw.match(ORDER_QUANTITY_WITH_UNIT_RE) ?? raw.match(ORDER_QUANTITY_FALLBACK_RE);
      const quantityParsed = quantityMatch
        ? Number.parseInt(quantityMatch[1] || "", 10)
        : Number.NaN;
      const quantity =
        Number.isFinite(quantityParsed) && quantityParsed > 0 ? Math.max(1, quantityParsed) : 1;
      return {
        mode: "simulated_live_order",
        query: `/quote ${product.symbol}`,
        symbol: product.symbol,
        simulatedLiveOrderText: `模擬真單 ${orderSymbol} ${sideText} ${quantity}口`,
      };
    }
  }
  return {
    mode: "quote",
    query: `/quote ${product.symbol}`,
    symbol: product.symbol,
  };
}

export async function buildCapitalQuoteNaturalLanguageReplyText(params: {
  text: string;
  repoRoot?: string;
}): Promise<string | null> {
  const match = resolveCapitalQuoteNaturalLanguageMatch(params.text);
  if (!match) {
    return null;
  }
  if (match.mode === "risk_guidance") {
    const hasStopLoss = /(停損|止損|stop[-_\s]?loss|\bSL\b)/iu.test(params.text);
    const hasTakeProfit = /(停利|止盈|take[-_\s]?profit|\bTP\b)/iu.test(params.text);
    const target = hasStopLoss && hasTakeProfit ? "停損/停利" : hasStopLoss ? "停損" : "停利";
    return (
      `[OpenClaw 風控提示] 已收到 ${match.symbol} ${target} 設定需求。` +
      "目前 Telegram 快速通道僅提供模擬建議，真單維持封鎖。請先查看策略狀態與模擬回報再決策。"
    );
  }
  try {
    const requiredRelativePath =
      match.mode === "simulated_live_order"
        ? CAPITAL_SIMULATED_LIVE_ORDER_SCRIPT
        : CAPITAL_QUOTE_REPLY_SCRIPT;
    const repoRoot = resolveOpenClawRepoRoot({
      preferredRoot: params.repoRoot,
      requiredRelativePath,
    });
    const scriptPath = path.join(repoRoot, requiredRelativePath);
    const reportableStatePath = process.env.OPENCLAW_CAPITAL_QUOTE_REPORTABLE_STATE?.trim();
    const noRefresh = process.env.OPENCLAW_CAPITAL_QUOTE_NO_REFRESH === "1";
    const args =
      match.mode === "simulated_live_order"
        ? [
            scriptPath,
            "--text",
            match.simulatedLiveOrderText || "模擬真單 TX00 多 1口",
            "--write-state",
            "--json",
          ]
        : [scriptPath, "--query", match.query, "--write-state", "--json"];
    if (match.mode === "quote") {
      if (reportableStatePath) {
        args.push("--reportable-state", reportableStatePath);
      }
      if (noRefresh) {
        args.push("--no-refresh");
      }
    }
    const { stdout } = await execFileAsync(process.execPath, args, {
      cwd: repoRoot,
      timeout: CAPITAL_QUOTE_REPLY_TIMEOUT_MS,
      windowsHide: true,
      maxBuffer: CAPITAL_QUOTE_REPLY_MAX_BUFFER,
    });
    const parsed = JSON.parse(stdout || "{}") as unknown;
    return (
      readReplyText(parsed) ||
      (match.mode === "simulated_live_order"
        ? "[OpenClaw 模擬真單] 封鎖：未產生模擬下單回覆｜真單=封鎖（僅紙上模擬）"
        : "[OpenClaw 報價] 封鎖：未產生報價回覆｜不可回舊價｜真單=封鎖（風控未開啟）")
    );
  } catch (error) {
    if (match.mode === "simulated_live_order") {
      return (
        "[OpenClaw 模擬真單] 封鎖：模擬下單產生器失敗" +
        `｜原因=${formatQuoteError(error)}` +
        "｜真單=封鎖（僅紙上模擬）"
      );
    }
    return (
      "[OpenClaw 報價] 封鎖：報價產生器失敗" +
      `｜原因=${formatQuoteError(error)}` +
      "｜不可回舊價｜真單=封鎖（風控未開啟）"
    );
  }
}
