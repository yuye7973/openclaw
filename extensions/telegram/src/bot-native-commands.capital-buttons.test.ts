import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import {
  createCommandBot,
  createNativeCommandTestParams,
  createPrivateCommandContext,
  resetNativeCommandMenuMocks,
} from "./bot-native-commands.menu-test-support.js";
import { resetTelegramForumFlagCacheForTest } from "./bot/helpers.js";

const tempDirs: string[] = [];

function createTempRepoRoot(): string {
  const repoRoot = fs.mkdtempSync(path.join(os.tmpdir(), "openclaw-telegram-native-status-"));
  tempDirs.push(repoRoot);
  return repoRoot;
}

function writeRepoMarkers(repoRoot: string): void {
  const markerFiles = ["package.json", "pnpm-workspace.yaml", "pnpm-lock.yaml"];
  for (const marker of markerFiles) {
    fs.writeFileSync(path.join(repoRoot, marker), "{}\n", "utf8");
  }
}

function writeJson(filePath: string, value: unknown): void {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(value, null, 2), "utf8");
}

function readInlineKeyboardMatrix(
  sendMessage: ReturnType<typeof createCommandBot>["sendMessage"],
  callIndex = 0,
): Array<Array<{ text: string; callback_data: string }>> {
  const replyMarkup = sendMessage.mock.calls[callIndex]?.[2]?.reply_markup as
    | { inline_keyboard?: Array<Array<{ text?: string; callback_data?: string }>> }
    | undefined;
  const rows = replyMarkup?.inline_keyboard ?? [];
  return rows.map((row) =>
    row.map((button) => ({
      text: button.text ?? "",
      callback_data: button.callback_data ?? "",
    })),
  );
}

const execFilePromisifiedMock = vi.hoisted(() =>
  vi.fn(async (_nodePath: string, args: string[]) => {
    const joined = Array.isArray(args) ? args.join(" ") : "";
    if (joined.includes("openclaw-capital-master-flow-checklist.mjs")) {
      return {
        stdout: JSON.stringify({
          status: "ready",
          flows: {},
        }),
        stderr: "",
      };
    }
    if (joined.includes("openclaw-capital-quote-status.mjs")) {
      return {
        stdout: JSON.stringify({
          status: "ready",
          quote: {
            ready: true,
            status: "quote_ok",
          },
          order: {
            paperReady: true,
            liveReady: false,
          },
        }),
        stderr: "",
      };
    }
    if (joined.includes("openclaw-capital-telegram-simulated-live-order.mjs")) {
      return {
        stdout: JSON.stringify({
          replyText: "[OpenClaw 模擬真單] 測試回覆｜真單=封鎖（僅紙上模擬）",
        }),
        stderr: "",
      };
    }
    if (joined.includes("openclaw-capital-telegram-live-order-execute.mjs")) {
      return {
        stdout: JSON.stringify({
          replyText: "[OpenClaw 真實下單] 測試回覆｜status=live_order_dispatched",
        }),
        stderr: "",
      };
    }
    if (joined.includes("openclaw-capital-quote-telegram-reply.mjs")) {
      return {
        stdout: JSON.stringify({
          replyText: "[OpenClaw 報價] 測試回覆",
        }),
        stderr: "",
      };
    }
    if (joined.includes("openclaw-okx-current-readiness-summary.mjs")) {
      return {
        stdout: JSON.stringify({
          status: "blocked",
          code: "okx_current_readiness_blocked",
          summary_zh_tw: "OKX current-readiness 阻擋：market_snapshot_scheduler_not_ready。",
          blockers: ["market_snapshot_scheduler_not_ready"],
          safety: { noOrderWrite: true },
        }),
        stderr: "",
      };
    }
    return {
      stdout: JSON.stringify({
        replyText: "[OpenClaw 報價] 測試回覆",
      }),
      stderr: "",
    };
  }),
);
const execFileMock = vi.hoisted(() => {
  const fn = vi.fn();
  Reflect.set(fn, Symbol.for("nodejs.util.promisify.custom"), execFilePromisifiedMock);
  return fn;
});

vi.mock("node:child_process", () => ({
  execFile: execFileMock,
}));

let registerTelegramNativeCommands: typeof import("./bot-native-commands.js").registerTelegramNativeCommands;
let parseTelegramNativeCommandCallbackData: typeof import("./bot-native-commands.js").parseTelegramNativeCommandCallbackData;

describe("capital native command buttons", () => {
  beforeAll(async () => {
    ({ registerTelegramNativeCommands, parseTelegramNativeCommandCallbackData } =
      await import("./bot-native-commands.js"));
  });

  beforeEach(() => {
    resetTelegramForumFlagCacheForTest();
    resetNativeCommandMenuMocks();
    execFilePromisifiedMock.mockClear();
    execFileMock.mockClear();
  });

  afterEach(() => {
    for (const dir of tempDirs.splice(0)) {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });

  it("keeps /quote status refresh callback and shortcuts on quote command", async () => {
    const { bot, commandHandlers, sendMessage } = createCommandBot();
    registerTelegramNativeCommands({
      ...createNativeCommandTestParams({}, { bot }),
    });

    const handler = commandHandlers.get("quote");
    expect(handler).toBeTruthy();
    await handler?.(createPrivateCommandContext({ match: "status" }));

    expect(sendMessage).toHaveBeenCalledTimes(1);
    const replyMarkup = sendMessage.mock.calls[0]?.[2]?.reply_markup as
      | { inline_keyboard?: Array<Array<{ callback_data?: string }>> }
      | undefined;
    const callbacks = replyMarkup?.inline_keyboard
      ?.flat()
      .map((button) => button.callback_data)
      .filter((value): value is string => typeof value === "string");
    expect(callbacks).toEqual(
      expect.arrayContaining([
        "tgcmd:/quote status",
        "tgcmd:/status",
        "tgcmd:/capital_status",
        "tgcmd:/okx_status",
        "tgcmd:/quote telegram",
        "tgcmd:/quote simlive tx00 buy 1",
        "tgcmd:/quote simlive tx00 sell 1",
        "tgcmd:/quote live cn0000 close_long 1",
        "tgcmd:/quote live cn0000 close_short 1",
        "tgcmd:/start",
      ]),
    );
  });

  it("opens unified main menu from /menu command", async () => {
    const { bot, commandHandlers, sendMessage } = createCommandBot();
    registerTelegramNativeCommands({
      ...createNativeCommandTestParams({}, { bot }),
    });

    const handler = commandHandlers.get("menu");
    expect(handler).toBeTruthy();
    await handler?.(createPrivateCommandContext());

    expect(sendMessage).toHaveBeenCalledTimes(1);
    const messageText = String(sendMessage.mock.calls[0]?.[1] ?? "");
    expect(messageText).toBe("🏠 主選單\n\n請選擇要查看的功能：");

    const rows = readInlineKeyboardMatrix(sendMessage, 0);
    expect(rows).toEqual([
      [{ text: "🛰 中控狀態", callback_data: "tgcmd:/status" }],
      [{ text: "📊 報價狀態", callback_data: "tgcmd:/quote status" }],
      [{ text: "🧭 交易總覽", callback_data: "tgcmd:/capital_status" }],
      [{ text: "🪙 OKX 狀態", callback_data: "tgcmd:/okx_status" }],
      [{ text: "🟢 模擬下單（買）", callback_data: "tgcmd:/quote simlive tx00 buy 1" }],
      [{ text: "🔥 真實下單（買）", callback_data: "tgcmd:/quote live cn0000 buy 1" }],
    ]);
  });

  it("keeps capital status to quote-status jump callback on /capital_status", async () => {
    const { bot, commandHandlers, sendMessage } = createCommandBot();
    registerTelegramNativeCommands({
      ...createNativeCommandTestParams({}, { bot }),
    });

    const handler = commandHandlers.get("capital_status");
    expect(handler).toBeTruthy();
    await handler?.(createPrivateCommandContext());

    expect(sendMessage).toHaveBeenCalledTimes(1);
    const replyMarkup = sendMessage.mock.calls[0]?.[2]?.reply_markup as
      | { inline_keyboard?: Array<Array<{ callback_data?: string }>> }
      | undefined;
    const callbacks = replyMarkup?.inline_keyboard
      ?.flat()
      .map((button) => button.callback_data)
      .filter((value): value is string => typeof value === "string");
    expect(callbacks).toEqual(
      expect.arrayContaining([
        "tgcmd:/capital_status",
        "tgcmd:/quote status",
        "tgcmd:/status",
        "tgcmd:/okx_status",
        "tgcmd:/quote simlive tx00 buy 1",
        "tgcmd:/quote simlive tx00 sell 1",
        "tgcmd:/quote semi",
        "tgcmd:/quote live cn0000 close_long 1",
        "tgcmd:/quote live cn0000 close_short 1",
      ]),
    );
  });

  it("locks unified panel button layout order for /quote /capital_status /status", async () => {
    const previousRepoRoot = process.env.OPENCLAW_REPO_ROOT;
    const repoRoot = createTempRepoRoot();
    writeRepoMarkers(repoRoot);
    const stateDir = path.join(repoRoot, "reports", "hermes-agent", "state");
    writeJson(path.join(stateDir, "openclaw-capital-service-status-latest.json"), {
      generatedAt: "2026-05-24T06:30:00.000Z",
      liveTradingEnabled: false,
      service: {
        ready: true,
        pidAlive: true,
        pid: 52008,
        host: "127.0.0.1",
        port: 18789,
      },
      telegramPoller: {
        available: true,
        ready: true,
        pollingEnabled: true,
      },
      quote: {
        ready: false,
        capabilityReady: false,
        status: "session_closed",
      },
      orderMode: {
        ready: true,
      },
      liveOrders: {
        ready: false,
      },
    });
    process.env.OPENCLAW_REPO_ROOT = repoRoot;

    const { bot, commandHandlers, sendMessage } = createCommandBot();
    registerTelegramNativeCommands({
      ...createNativeCommandTestParams({}, { bot }),
    });

    try {
      await commandHandlers.get("quote")?.(createPrivateCommandContext({ match: "status" }));
      await commandHandlers.get("capital_status")?.(createPrivateCommandContext());
      await commandHandlers.get("status")?.(createPrivateCommandContext());
    } finally {
      if (previousRepoRoot === undefined) {
        delete process.env.OPENCLAW_REPO_ROOT;
      } else {
        process.env.OPENCLAW_REPO_ROOT = previousRepoRoot;
      }
    }

    const quoteRows = readInlineKeyboardMatrix(sendMessage, 0);
    const capitalRows = readInlineKeyboardMatrix(sendMessage, 1);
    const statusRows = readInlineKeyboardMatrix(sendMessage, 2);

    expect(quoteRows).toEqual([
      [
        { text: "🔄 刷新報價", callback_data: "tgcmd:/quote status" },
        { text: "📊 報價狀態", callback_data: "tgcmd:/quote status" },
      ],
      [
        { text: "🛰 中控狀態", callback_data: "tgcmd:/status" },
        { text: "🧭 交易總覽", callback_data: "tgcmd:/capital_status" },
      ],
      [
        { text: "🪙 OKX 狀態", callback_data: "tgcmd:/okx_status" },
        { text: "📡 入口自檢", callback_data: "tgcmd:/quote telegram" },
      ],
      [
        { text: "🟢 模擬下單（買）", callback_data: "tgcmd:/quote simlive tx00 buy 1" },
        { text: "🔴 模擬下單（賣）", callback_data: "tgcmd:/quote simlive tx00 sell 1" },
      ],
      [
        { text: "🔥 真實下單（買）", callback_data: "tgcmd:/quote live cn0000 buy 1" },
        { text: "🧯 真實下單（賣）", callback_data: "tgcmd:/quote live cn0000 sell 1" },
      ],
      [
        { text: "✅ 真實平多", callback_data: "tgcmd:/quote live cn0000 close_long 1" },
        { text: "✅ 真實平空", callback_data: "tgcmd:/quote live cn0000 close_short 1" },
      ],
      [
        { text: "🟡 人工審查", callback_data: "tgcmd:/quote semi" },
        { text: "✅ 同意下單", callback_data: "tgcmd:/quote semi approve" },
      ],
      [
        { text: "⛔ 拒絕下單", callback_data: "tgcmd:/quote semi reject" },
        { text: "↩ 返回主選單", callback_data: "tgcmd:/start" },
      ],
      [{ text: "📈 台指近", callback_data: "tgcmd:/quote tx00am" }],
    ]);

    expect(capitalRows).toEqual([
      [
        { text: "🔄 刷新總狀態", callback_data: "tgcmd:/capital_status" },
        { text: "📊 查看報價詳情", callback_data: "tgcmd:/quote status" },
      ],
      [
        { text: "🛰 中控狀態", callback_data: "tgcmd:/status" },
        { text: "🪙 OKX 狀態", callback_data: "tgcmd:/okx_status" },
      ],
      [
        { text: "🟢 模擬下單（買）", callback_data: "tgcmd:/quote simlive tx00 buy 1" },
        { text: "🔴 模擬下單（賣）", callback_data: "tgcmd:/quote simlive tx00 sell 1" },
      ],
      [
        { text: "🔥 真實下單（買）", callback_data: "tgcmd:/quote live cn0000 buy 1" },
        { text: "🧯 真實下單（賣）", callback_data: "tgcmd:/quote live cn0000 sell 1" },
      ],
      [
        { text: "✅ 真實平多", callback_data: "tgcmd:/quote live cn0000 close_long 1" },
        { text: "✅ 真實平空", callback_data: "tgcmd:/quote live cn0000 close_short 1" },
      ],
      [
        { text: "🟡 人工審查", callback_data: "tgcmd:/quote semi" },
        { text: "↩ 返回主選單", callback_data: "tgcmd:/start" },
      ],
    ]);

    expect(statusRows).toEqual([
      [
        { text: "🔄 重新整理", callback_data: "tgcmd:/status" },
        { text: "📊 報價狀態", callback_data: "tgcmd:/quote status" },
      ],
      [
        { text: "🧭 交易總覽", callback_data: "tgcmd:/capital_status" },
        { text: "🪙 OKX 狀態", callback_data: "tgcmd:/okx_status" },
      ],
      [
        { text: "🟢 模擬下單（買）", callback_data: "tgcmd:/quote simlive tx00 buy 1" },
        { text: "🔴 模擬下單（賣）", callback_data: "tgcmd:/quote simlive tx00 sell 1" },
      ],
      [{ text: "📦 持倉摘要", callback_data: "tgcmd:/quote positions" }],
      [{ text: "↩ 返回主選單", callback_data: "tgcmd:/start" }],
    ]);
  });

  it("returns non-empty simulated-live response for /quote simlive callback action", async () => {
    const { bot, commandHandlers, sendMessage } = createCommandBot();
    registerTelegramNativeCommands({
      ...createNativeCommandTestParams({}, { bot }),
    });

    const handler = commandHandlers.get("quote");
    expect(handler).toBeTruthy();
    await handler?.(createPrivateCommandContext({ match: "simlive tx00 buy 1" }));

    expect(sendMessage).toHaveBeenCalledTimes(1);
    const messageText = String(sendMessage.mock.calls[0]?.[1] ?? "");
    expect(messageText.trim().length).toBeGreaterThan(0);
    expect(messageText).toContain("[OpenClaw 模擬真單]");
    const firstCallArgs = execFilePromisifiedMock.mock.calls[0]?.[1] as string[] | undefined;
    expect(firstCallArgs?.join(" ")).toContain(
      "openclaw-capital-telegram-simulated-live-order.mjs",
    );
  });

  it("returns non-empty review response for /quote semi callback action", async () => {
    const { bot, commandHandlers, sendMessage } = createCommandBot();
    registerTelegramNativeCommands({
      ...createNativeCommandTestParams({}, { bot }),
    });

    const handler = commandHandlers.get("quote");
    expect(handler).toBeTruthy();
    await handler?.(createPrivateCommandContext({ match: "semi" }));

    expect(sendMessage).toHaveBeenCalledTimes(1);
    const messageText = String(sendMessage.mock.calls[0]?.[1] ?? "");
    expect(messageText.trim().length).toBeGreaterThan(0);
    expect(messageText).toContain("[OpenClaw 報價]");
    const firstCallArgs = execFilePromisifiedMock.mock.calls[0]?.[1] as string[] | undefined;
    expect(firstCallArgs?.join(" ")).toContain("openclaw-capital-quote-telegram-reply.mjs");
  });

  it("returns non-empty live execute response for /quote live callback action", async () => {
    const { bot, commandHandlers, sendMessage } = createCommandBot();
    registerTelegramNativeCommands({
      ...createNativeCommandTestParams({}, { bot }),
    });

    const handler = commandHandlers.get("quote");
    expect(handler).toBeTruthy();
    await handler?.(createPrivateCommandContext({ match: "live cn0000 buy 1" }));

    expect(sendMessage).toHaveBeenCalledTimes(1);
    const messageText = String(sendMessage.mock.calls[0]?.[1] ?? "");
    expect(messageText.trim().length).toBeGreaterThan(0);
    expect(messageText).toContain("[OpenClaw 真實下單]");
    const firstCallArgs = execFilePromisifiedMock.mock.calls[0]?.[1] as string[] | undefined;
    expect(firstCallArgs?.join(" ")).toContain("openclaw-capital-telegram-live-order-execute.mjs");
  });

  it("returns non-empty live close response for /quote live close callback action", async () => {
    const { bot, commandHandlers, sendMessage } = createCommandBot();
    registerTelegramNativeCommands({
      ...createNativeCommandTestParams({}, { bot }),
    });

    const handler = commandHandlers.get("quote");
    expect(handler).toBeTruthy();
    await handler?.(createPrivateCommandContext({ match: "live cn0000 close_long 1" }));

    expect(sendMessage).toHaveBeenCalledTimes(1);
    const messageText = String(sendMessage.mock.calls[0]?.[1] ?? "");
    expect(messageText.trim().length).toBeGreaterThan(0);
    expect(messageText).toContain("[OpenClaw 真實下單]");
    const firstCallArgs = execFilePromisifiedMock.mock.calls[0]?.[1] as string[] | undefined;
    expect(firstCallArgs?.join(" ")).toContain("openclaw-capital-telegram-live-order-execute.mjs");
  });

  it("maps tgcmd quote callback to /quote status and returns non-empty reply", async () => {
    const { bot, commandHandlers, sendMessage } = createCommandBot();
    registerTelegramNativeCommands({
      ...createNativeCommandTestParams({}, { bot }),
    });

    const parsed = parseTelegramNativeCommandCallbackData("tgcmd:/quote status");
    expect(parsed).toBe("/quote status");
    const [commandName, ...rest] = (parsed ?? "").replace(/^\//u, "").split(/\s+/u);
    const match = rest.join(" ").trim();
    const handler = commandHandlers.get(commandName);
    expect(handler).toBeTruthy();

    await handler?.(createPrivateCommandContext({ match }));

    expect(sendMessage).toHaveBeenCalledTimes(1);
    const messageText = String(sendMessage.mock.calls[0]?.[1] ?? "");
    expect(messageText.trim().length).toBeGreaterThan(0);
    expect(messageText).toContain("[OpenClaw");
    expect(messageText).not.toContain("處理你的請求時發生錯誤");
  });

  it("maps tgcmd capital status callback to /capital_status and returns non-empty reply", async () => {
    const { bot, commandHandlers, sendMessage } = createCommandBot();
    registerTelegramNativeCommands({
      ...createNativeCommandTestParams({}, { bot }),
    });

    const parsed = parseTelegramNativeCommandCallbackData("tgcmd:/capital_status");
    expect(parsed).toBe("/capital_status");
    const [commandName, ...rest] = (parsed ?? "").replace(/^\//u, "").split(/\s+/u);
    const match = rest.join(" ").trim();
    const handler = commandHandlers.get(commandName);
    expect(handler).toBeTruthy();

    await handler?.(createPrivateCommandContext({ match }));

    expect(sendMessage).toHaveBeenCalledTimes(1);
    const messageText = String(sendMessage.mock.calls[0]?.[1] ?? "");
    expect(messageText.trim().length).toBeGreaterThan(0);
    expect(messageText).toContain("[OpenClaw");
    expect(messageText).toContain("交易總狀態");
    expect(messageText).toContain("清單=");
    expect(messageText).toContain("報價=");
    expect(messageText).toContain("下單=");
    expect(messageText).toContain("回報=");
    expect(messageText).toContain("查詢=");
    expect(messageText).toContain("下一步：");
    expect(messageText).toContain("[OpenClaw OKX 狀態]");
    expect(messageText).toContain("noOrderWrite=true");
    expect(messageText).not.toContain("處理你的請求時發生錯誤");
  });

  it("maps tgcmd okx status callback to /okx_status and returns non-empty reply", async () => {
    const { bot, commandHandlers, sendMessage } = createCommandBot();
    registerTelegramNativeCommands({
      ...createNativeCommandTestParams({}, { bot }),
    });

    const parsed = parseTelegramNativeCommandCallbackData("tgcmd:/okx_status");
    expect(parsed).toBe("/okx_status");
    const [commandName, ...rest] = (parsed ?? "").replace(/^\//u, "").split(/\s+/u);
    const match = rest.join(" ").trim();
    const handler = commandHandlers.get(commandName);
    expect(handler).toBeTruthy();

    await handler?.(createPrivateCommandContext({ match }));

    expect(sendMessage).toHaveBeenCalledTimes(1);
    const messageText = String(sendMessage.mock.calls[0]?.[1] ?? "");
    expect(messageText.trim().length).toBeGreaterThan(0);
    expect(messageText).toContain("[OpenClaw OKX 狀態]");
    expect(messageText).toContain("noOrderWrite=true");
    expect(messageText).not.toContain("處理你的請求時發生錯誤");
  });

  it("maps tgcmd status callback to /status and returns Chinese control-surface reply", async () => {
    const previousRepoRoot = process.env.OPENCLAW_REPO_ROOT;
    const repoRoot = createTempRepoRoot();
    writeRepoMarkers(repoRoot);
    const stateDir = path.join(repoRoot, "reports", "hermes-agent", "state");
    writeJson(path.join(stateDir, "openclaw-capital-service-status-latest.json"), {
      generatedAt: "2026-05-24T06:30:00.000Z",
      liveTradingEnabled: false,
      service: {
        ready: true,
        pidAlive: true,
        pid: 52008,
        host: "127.0.0.1",
        port: 18789,
      },
      telegramPoller: {
        available: true,
        ready: true,
        pollingEnabled: true,
      },
      quote: {
        ready: false,
        capabilityReady: false,
        status: "session_closed",
      },
      orderMode: {
        ready: true,
      },
      liveOrders: {
        ready: false,
      },
    });
    writeJson(path.join(stateDir, "openclaw-controlled-task-runner-telegram-latest.json"), {
      botUsername: "openclaw_bot",
    });
    writeJson(path.join(stateDir, "openclaw-capital-active-page-refresh-plan-latest.json"), {
      generatedAt: "2026-05-24T06:32:00.000Z",
      status: "ready_for_operator_refresh",
      readOnly: true,
      liveTradingEnabled: false,
      writeTradingEnabled: false,
      sentOrder: false,
      activePage: {
        size: 64,
        energyContractCandidateCodes: ["CL2607", "CL2608", "NG2606"],
      },
      callbackGate: {
        paperStrategyEligibleRouteCount: 0,
      },
      controlledRefreshPlan: {
        operatorActionRequired: true,
      },
    });
    writeJson(path.join(stateDir, "openclaw-telegram-trading-shortcuts-latest.json"), {
      generatedAt: "2026-05-24T06:33:00.000Z",
      status: "pass",
      summary: {
        checks: 181,
        failed: 0,
        shortcutCheckCountClosure: {
          machineLine:
            "shortcutChecks=181 failed=0 assistantClosure=39 okxClosure=13 fixtureCoverage=4 reportMachine=8 growthReason=assistant+okx+fixture+report-machine",
        },
        assistantClosure: {
          assistantLearningHint: {
            nextCommandShortRow: {
              command: "sc:tr:audit / sc:tr:paperloop / sc:tr:assist",
              gateVerified: true,
              machineLine:
                "nextCommandShortRow=sc:tr:audit/sc:tr:paperloop/sc:tr:assist gateVerified=true buttons=sc:tr:learn/sc:tr:audit/sc:tr:paperloop/sc:tr:assist",
            },
          },
        },
      },
    });
    writeJson(path.join(stateDir, "openclaw-controlled-task-runner-telegram-publish-latest.json"), {
      generatedAt: "2026-05-24T06:34:00.000Z",
      status: "dry_run_ok",
      errorCode: "OK",
      dryRun: true,
      dryRunNoSend: true,
      message: "快捷檢查=shortcutChecks=181 failed=0｜下一步指令=nextCommandShortRow=sc:tr:audit",
      commandErrorCode: "DRY_RUN_NO_SEND",
    });
    writeJson(path.join(stateDir, "openclaw-okx-current-readiness-summary-latest.json"), {
      status: "ready_read_only",
      summary_zh_tw: "OKX current-readiness 可讀：全部通過。",
      blockers: [],
      safety: {
        noOrderWrite: true,
      },
    });
    process.env.OPENCLAW_REPO_ROOT = repoRoot;
    const { bot, commandHandlers, sendMessage } = createCommandBot();
    registerTelegramNativeCommands({
      ...createNativeCommandTestParams({}, { bot }),
    });

    const parsed = parseTelegramNativeCommandCallbackData("tgcmd:/status");
    expect(parsed).toBe("/status");
    const [commandName, ...rest] = (parsed ?? "").replace(/^\//u, "").split(/\s+/u);
    const match = rest.join(" ").trim();
    const handler = commandHandlers.get(commandName);
    expect(handler).toBeTruthy();

    try {
      await handler?.(createPrivateCommandContext({ match }));
    } finally {
      if (previousRepoRoot === undefined) {
        delete process.env.OPENCLAW_REPO_ROOT;
      } else {
        process.env.OPENCLAW_REPO_ROOT = previousRepoRoot;
      }
    }

    expect(sendMessage).toHaveBeenCalledTimes(1);
    const messageText = String(sendMessage.mock.calls[0]?.[1] ?? "");
    expect(messageText.trim().length).toBeGreaterThan(0);
    expect(messageText).toContain("OpenClaw Telegram 中控");
    expect(messageText).toContain("🧩 Gateway：");
    expect(messageText).toContain("🤖 Bot：");
    expect(messageText).toContain("📈 交易助手：");
    expect(messageText).toContain(
      "📦 ActivePage：待操作者刷新｜active=64｜能源候選=3｜紙上候選=0｜需要操作者刷新",
    );
    expect(messageText).toContain("🧪 Trading Shortcuts：pass｜checks=181｜failed=0｜gate=✅");
    expect(messageText).toContain("shortcutChecks=181 failed=0 assistantClosure=39");
    expect(messageText).toContain("➡️ 下一步指令：nextCommandShortRow=sc:tr:audit");
    expect(messageText).toContain(
      "📣 推播 Dry-run：dry_run_ok｜error=OK｜noSend=✅｜cmd=DRY_RUN_NO_SEND",
    );
    expect(messageText).toContain("[OpenClaw OKX 狀態]");
    expect(messageText).toContain("noOrderWrite=true");
    expect(messageText).toContain("🕒 更新時間：");
    expect(messageText).not.toContain("處理你的請求時發生錯誤");

    const replyMarkup = sendMessage.mock.calls[0]?.[2]?.reply_markup as
      | { inline_keyboard?: Array<Array<{ text?: string; callback_data?: string }>> }
      | undefined;
    const flattenedButtons = replyMarkup?.inline_keyboard?.flat() ?? [];
    const callbacks = flattenedButtons
      .map((button) => button.callback_data)
      .filter((value): value is string => typeof value === "string");
    const buttonTexts = flattenedButtons
      .map((button) => button.text)
      .filter((value): value is string => typeof value === "string");
    expect(callbacks).toEqual(
      expect.arrayContaining([
        "tgcmd:/status",
        "tgcmd:/quote status",
        "tgcmd:/capital_status",
        "tgcmd:/okx_status",
      ]),
    );
    expect(buttonTexts).toEqual(
      expect.arrayContaining([
        "🔄 重新整理",
        "📊 報價狀態",
        "🧭 交易總覽",
        "🪙 OKX 狀態",
        "🟢 模擬下單（買）",
        "↩ 返回主選單",
      ]),
    );
  });
});
