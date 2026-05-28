import type { OpenClawConfig } from "openclaw/plugin-sdk/config-types";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { TELEGRAM_MAIN_MENU_TEXT } from "./bot-native-commands.js";
import {
  answerCallbackQuerySpy,
  commandSpy,
  dispatchReplyWithBufferedBlockDispatcher,
  getLoadConfigMock,
  getOnHandler,
  replySpy,
  sendMessageSpy,
  telegramBotDepsForTest,
  telegramBotRuntimeForTest,
} from "./bot.create-telegram-bot.test-harness.js";

const execFileMock = vi.hoisted(() =>
  vi.fn((...args: unknown[]) => {
    const callback = args.at(-1);
    if (typeof callback === "function") {
      (callback as (error: Error) => void)(new Error("mock-exec-fail"));
    }
    return undefined;
  }),
);

vi.mock("node:child_process", async (importOriginal) => {
  const actual = await importOriginal<typeof import("node:child_process")>();
  return {
    ...actual,
    execFile: execFileMock,
  };
});

let createTelegramBotBase: typeof import("./bot-core.js").createTelegramBotCore;
let setTelegramBotRuntimeForTest: typeof import("./bot-core.js").setTelegramBotRuntimeForTest;
let createTelegramBot: (
  opts: import("./bot.types.js").TelegramBotOptions,
) => ReturnType<typeof import("./bot-core.js").createTelegramBotCore>;

const loadConfig = getLoadConfigMock();

function buildNativeMenuConfig(): OpenClawConfig {
  return {
    commands: { native: true, text: false },
    channels: {
      telegram: {
        dmPolicy: "open",
        allowFrom: ["*"],
      },
    },
  };
}

function buildRestrictedCommandConfig(): OpenClawConfig {
  return {
    ...buildNativeMenuConfig(),
    commands: {
      native: true,
      text: false,
      allowFrom: {
        telegram: ["12345"],
      },
    },
  };
}

function extractReplyContext(call: unknown): {
  CommandSource?: string;
  BodyForCommands?: string;
  CommandBody?: string;
} {
  const [ctx] = (call as unknown[]) ?? [];
  return (ctx ?? {}) as {
    CommandSource?: string;
    BodyForCommands?: string;
    CommandBody?: string;
  };
}

function collectCallbackData(options: unknown): string[] {
  const rows = (
    options as {
      reply_markup?: {
        inline_keyboard?: Array<Array<{ callback_data?: string }>>;
      };
    }
  )?.reply_markup?.inline_keyboard;
  if (!rows) {
    return [];
  }
  return rows.flatMap((row) => row.map((button) => button.callback_data ?? "").filter(Boolean));
}

describe("telegram native command callbacks", () => {
  beforeAll(async () => {
    ({ createTelegramBotCore: createTelegramBotBase, setTelegramBotRuntimeForTest } =
      await import("./bot-core.js"));
  });

  beforeEach(() => {
    setTelegramBotRuntimeForTest(
      telegramBotRuntimeForTest as unknown as Parameters<typeof setTelegramBotRuntimeForTest>[0],
    );
    createTelegramBot = (opts) =>
      createTelegramBotBase({
        ...opts,
        telegramDeps: telegramBotDepsForTest,
      });
    loadConfig.mockReturnValue(buildNativeMenuConfig());
  });

  it("handles tgcmd:/quote status callback with quote action buttons", async () => {
    sendMessageSpy.mockClear();
    replySpy.mockClear();

    createTelegramBot({
      token: "tok",
      config: buildNativeMenuConfig(),
    });

    const callbackHandler = getOnHandler("callback_query");
    await callbackHandler({
      callbackQuery: {
        id: "cbq-quote-status",
        data: "tgcmd:/quote status",
        from: { id: 9, first_name: "Ada", username: "ada_bot" },
        message: {
          chat: { id: 1234, type: "private" },
          date: 1736380800,
          message_id: 41,
          text: "主選單",
        },
      },
      me: { username: "openclaw_bot" },
      getFile: async () => ({ download: async () => new Uint8Array() }),
    });

    expect(answerCallbackQuerySpy).toHaveBeenCalledWith("cbq-quote-status");
    expect(replySpy).toHaveBeenCalledTimes(1);
    const replyContext = extractReplyContext(replySpy.mock.calls[0]);
    expect(replyContext.CommandSource).toBe("native");
    expect(replyContext.BodyForCommands).toBe("/quote status");
    expect(replyContext.CommandBody).toBe("/quote status");
    expect(sendMessageSpy.mock.calls.some((call) => call[1] === "你沒有權限使用這個指令。")).toBe(
      false,
    );
  });

  it("handles tgcmd:/capital_status callback with status action buttons", async () => {
    sendMessageSpy.mockClear();
    replySpy.mockClear();

    createTelegramBot({
      token: "tok",
      config: buildNativeMenuConfig(),
    });

    const callbackHandler = getOnHandler("callback_query");
    await callbackHandler({
      callbackQuery: {
        id: "cbq-capital-status",
        data: "tgcmd:/capital_status",
        from: { id: 9, first_name: "Ada", username: "ada_bot" },
        message: {
          chat: { id: 1234, type: "private" },
          date: 1736380800,
          message_id: 42,
          text: "主選單",
        },
      },
      me: { username: "openclaw_bot" },
      getFile: async () => ({ download: async () => new Uint8Array() }),
    });

    expect(answerCallbackQuerySpy).toHaveBeenCalledWith("cbq-capital-status");
    expect(replySpy).toHaveBeenCalledTimes(1);
    const replyContext = extractReplyContext(replySpy.mock.calls[0]);
    expect(replyContext.CommandSource).toBe("native");
    expect(replyContext.BodyForCommands).toBe("/capital_status");
    expect(replyContext.CommandBody).toBe("/capital_status");
    expect(sendMessageSpy.mock.calls.some((call) => call[1] === "你沒有權限使用這個指令。")).toBe(
      false,
    );
  });

  it("keeps generic fallback reply with return-main-menu when tgcmd callback processing fails", async () => {
    sendMessageSpy.mockClear();
    replySpy.mockClear();
    dispatchReplyWithBufferedBlockDispatcher.mockRejectedValueOnce(
      new Error("dispatcher exploded"),
    );

    createTelegramBot({
      token: "tok",
      config: buildNativeMenuConfig(),
    });

    const callbackHandler = getOnHandler("callback_query");
    await expect(
      callbackHandler({
        callbackQuery: {
          id: "cbq-quote-status-fail",
          data: "tgcmd:/quote status",
          from: { id: 9, first_name: "Ada", username: "ada_bot" },
          message: {
            chat: { id: 1234, type: "private" },
            date: 1736380800,
            message_id: 43,
            text: "主選單",
          },
        },
        me: { username: "openclaw_bot" },
        getFile: async () => ({ download: async () => new Uint8Array() }),
      }),
    ).resolves.toBeUndefined();

    expect(answerCallbackQuerySpy).toHaveBeenCalledWith("cbq-quote-status-fail");
    expect(sendMessageSpy).toHaveBeenCalledWith(
      "1234",
      "處理你的請求時發生錯誤，請稍後再試。",
      expect.objectContaining({
        parse_mode: "HTML",
        reply_markup: {
          inline_keyboard: [[{ text: "↩ 返回主選單", callback_data: "tgcmd:/start" }]],
        },
      }),
    );
  });

  it("closes the main-menu callback loop from /start to quote/status and back to /start", async () => {
    sendMessageSpy.mockClear();
    replySpy.mockClear();
    answerCallbackQuerySpy.mockClear();

    createTelegramBot({
      token: "tok",
      config: buildNativeMenuConfig(),
    });

    const callbackHandler = getOnHandler("callback_query");

    await callbackHandler({
      callbackQuery: {
        id: "cbq-loop-start-1",
        data: "tgcmd:/start",
        from: { id: 9, first_name: "Ada", username: "ada_bot" },
        message: {
          chat: { id: 1234, type: "private" },
          date: 1736380800,
          message_id: 51,
          text: "控制面板",
        },
      },
      me: { username: "openclaw_bot" },
      getFile: async () => ({ download: async () => new Uint8Array() }),
    });

    const firstMenuCall = sendMessageSpy.mock.calls.find(
      (call) => call[0] === 1234 && typeof call[1] === "string" && call[1].includes("主選單"),
    );
    expect(firstMenuCall).toBeDefined();
    const firstMenuCallbacks = collectCallbackData(firstMenuCall?.[2]);
    expect(firstMenuCallbacks).toContain("tgcmd:/quote status");
    expect(firstMenuCallbacks).toContain("tgcmd:/capital_status");

    await callbackHandler({
      callbackQuery: {
        id: "cbq-loop-quote",
        data: "tgcmd:/quote status",
        from: { id: 9, first_name: "Ada", username: "ada_bot" },
        message: {
          chat: { id: 1234, type: "private" },
          date: 1736380801,
          message_id: 52,
          text: "主選單",
        },
      },
      me: { username: "openclaw_bot" },
      getFile: async () => ({ download: async () => new Uint8Array() }),
    });

    await callbackHandler({
      callbackQuery: {
        id: "cbq-loop-capital",
        data: "tgcmd:/capital_status",
        from: { id: 9, first_name: "Ada", username: "ada_bot" },
        message: {
          chat: { id: 1234, type: "private" },
          date: 1736380802,
          message_id: 53,
          text: "主選單",
        },
      },
      me: { username: "openclaw_bot" },
      getFile: async () => ({ download: async () => new Uint8Array() }),
    });

    await callbackHandler({
      callbackQuery: {
        id: "cbq-loop-start-2",
        data: "tgcmd:/start",
        from: { id: 9, first_name: "Ada", username: "ada_bot" },
        message: {
          chat: { id: 1234, type: "private" },
          date: 1736380803,
          message_id: 54,
          text: "交易狀態",
        },
      },
      me: { username: "openclaw_bot" },
      getFile: async () => ({ download: async () => new Uint8Array() }),
    });

    expect(answerCallbackQuerySpy).toHaveBeenCalledWith("cbq-loop-start-1");
    expect(answerCallbackQuerySpy).toHaveBeenCalledWith("cbq-loop-quote");
    expect(answerCallbackQuerySpy).toHaveBeenCalledWith("cbq-loop-capital");
    expect(answerCallbackQuerySpy).toHaveBeenCalledWith("cbq-loop-start-2");

    const commandBodies = replySpy.mock.calls
      .map((call) => extractReplyContext(call).BodyForCommands)
      .filter((value): value is string => typeof value === "string");
    expect(commandBodies).toContain("/quote status");
    expect(commandBodies).toContain("/capital_status");

    const menuCalls = sendMessageSpy.mock.calls.filter(
      (call) => call[0] === 1234 && typeof call[1] === "string" && call[1].includes("主選單"),
    );
    expect(menuCalls.length).toBeGreaterThanOrEqual(2);
  });

  it("keeps exact /start menu text and unified control callbacks", async () => {
    sendMessageSpy.mockClear();
    answerCallbackQuerySpy.mockClear();

    createTelegramBot({
      token: "tok",
      config: buildNativeMenuConfig(),
    });

    const callbackHandler = getOnHandler("callback_query");
    await callbackHandler({
      callbackQuery: {
        id: "cbq-menu-exact",
        data: "tgcmd:/start",
        from: { id: 9, first_name: "Ada", username: "ada_bot" },
        message: {
          chat: { id: 1234, type: "private" },
          date: 1736380800,
          message_id: 61,
          text: "任意訊息",
        },
      },
      me: { username: "openclaw_bot" },
      getFile: async () => ({ download: async () => new Uint8Array() }),
    });

    expect(answerCallbackQuerySpy).toHaveBeenCalledWith("cbq-menu-exact");
    expect(sendMessageSpy).toHaveBeenCalledTimes(1);
    const call = sendMessageSpy.mock.calls[0];
    expect(call?.[0]).toBe(1234);
    expect(call?.[1]).toBe(TELEGRAM_MAIN_MENU_TEXT);
    expect(call?.[2]).toEqual(
      expect.objectContaining({
        reply_markup: {
          inline_keyboard: [
            [{ text: "🛰 中控狀態", callback_data: "tgcmd:/status" }],
            [{ text: "📊 報價狀態", callback_data: "tgcmd:/quote status" }],
            [{ text: "🧭 交易總覽", callback_data: "tgcmd:/capital_status" }],
            [{ text: "🪙 OKX 狀態", callback_data: "tgcmd:/okx_status" }],
            [{ text: "🟢 模擬下單（買）", callback_data: "tgcmd:/quote simlive tx00 buy 1" }],
            [{ text: "🔥 真實下單（買）", callback_data: "tgcmd:/quote live cn0000 buy 1" }],
          ],
        },
      }),
    );
  });

  it("opens the same main menu for tgcmd:/menu callback", async () => {
    sendMessageSpy.mockClear();
    answerCallbackQuerySpy.mockClear();

    createTelegramBot({
      token: "tok",
      config: buildNativeMenuConfig(),
    });

    const callbackHandler = getOnHandler("callback_query");
    await callbackHandler({
      callbackQuery: {
        id: "cbq-menu-alias",
        data: "tgcmd:/menu",
        from: { id: 9, first_name: "Ada", username: "ada_bot" },
        message: {
          chat: { id: 1234, type: "private" },
          date: 1736380800,
          message_id: 63,
          text: "任意訊息",
        },
      },
      me: { username: "openclaw_bot" },
      getFile: async () => ({ download: async () => new Uint8Array() }),
    });

    expect(answerCallbackQuerySpy).toHaveBeenCalledWith("cbq-menu-alias");
    expect(sendMessageSpy).toHaveBeenCalledTimes(1);
    const call = sendMessageSpy.mock.calls[0];
    expect(call?.[0]).toBe(1234);
    expect(call?.[1]).toBe(TELEGRAM_MAIN_MENU_TEXT);
    const menuCallbacks = collectCallbackData(call?.[2]);
    expect(menuCallbacks).toContain("tgcmd:/status");
    expect(menuCallbacks).toContain("tgcmd:/quote status");
    expect(menuCallbacks).toContain("tgcmd:/capital_status");
    expect(menuCallbacks).toContain("tgcmd:/okx_status");
  });

  it("keeps Chinese quote fallback content and action callbacks when quote script fails", async () => {
    sendMessageSpy.mockClear();
    commandSpy.mockClear();

    createTelegramBot({
      token: "tok",
      config: buildNativeMenuConfig(),
    });

    const quoteHandler = commandSpy.mock.calls.find((call) => call[0] === "quote")?.[1] as
      | ((ctx: Record<string, unknown>) => Promise<void>)
      | undefined;
    if (!quoteHandler) {
      throw new Error("quote command handler missing");
    }

    await quoteHandler({
      message: {
        chat: { id: 1234, type: "private" },
        from: { id: 9, username: "ada_bot" },
        text: "/quote status",
        date: 1736380800,
        message_id: 71,
      },
      match: "status",
    });

    expect(sendMessageSpy).toHaveBeenCalledTimes(1);
    const call = sendMessageSpy.mock.calls[0];
    const text = String(call?.[1] ?? "");
    expect(text).toContain("[OpenClaw 報價] 封鎖：報價產生器失敗");
    expect(text).toContain("不可回舊價");
    expect(text).toContain("真單=封鎖");
    const callbackData = collectCallbackData(call?.[2]);
    expect(callbackData).toContain("tgcmd:/quote status");
    expect(callbackData).toContain("tgcmd:/quote simlive tx00 buy 1");
  });

  it("keeps Chinese capital-status fallback content and action callbacks when status script fails", async () => {
    sendMessageSpy.mockClear();
    commandSpy.mockClear();

    createTelegramBot({
      token: "tok",
      config: buildNativeMenuConfig(),
    });

    const statusHandler = commandSpy.mock.calls.find(
      (call) => call[0] === "capital_status",
    )?.[1] as ((ctx: Record<string, unknown>) => Promise<void>) | undefined;
    if (!statusHandler) {
      throw new Error("capital_status command handler missing");
    }

    await statusHandler({
      message: {
        chat: { id: 1234, type: "private" },
        from: { id: 9, username: "ada_bot" },
        text: "/capital_status",
        date: 1736380800,
        message_id: 72,
      },
      match: "",
    });

    expect(sendMessageSpy).toHaveBeenCalledTimes(1);
    const call = sendMessageSpy.mock.calls[0];
    const text = String(call?.[1] ?? "");
    expect(text).toContain("[OpenClaw 交易總狀態] 封鎖：總狀態檢查失敗");
    expect(text).toContain("真單=封鎖（僅紙上模擬）");
    const callbackData = collectCallbackData(call?.[2]);
    expect(callbackData).toContain("tgcmd:/capital_status");
    expect(callbackData).toContain("tgcmd:/quote status");
  });

  it("replies not-authorized for unauthorized tgcmd:/quote status", async () => {
    sendMessageSpy.mockClear();
    replySpy.mockClear();

    createTelegramBot({
      token: "tok",
      config: buildRestrictedCommandConfig(),
    });

    const callbackHandler = getOnHandler("callback_query");
    await callbackHandler({
      callbackQuery: {
        id: "cbq-quote-unauthorized",
        data: "tgcmd:/quote status",
        from: { id: 9, first_name: "Ada", username: "ada_bot" },
        message: {
          chat: { id: 1234, type: "private" },
          date: 1736380800,
          message_id: 81,
          text: "主選單",
        },
      },
      me: { username: "openclaw_bot" },
      getFile: async () => ({ download: async () => new Uint8Array() }),
    });

    expect(answerCallbackQuerySpy).toHaveBeenCalledWith("cbq-quote-unauthorized");
    expect(sendMessageSpy).toHaveBeenCalledTimes(1);
    expect(sendMessageSpy.mock.calls[0]?.[0]).toBe(1234);
    expect(sendMessageSpy.mock.calls[0]?.[1]).toBe("你沒有權限使用這個指令。");
    const quoteUnauthorizedCallbacks = collectCallbackData(sendMessageSpy.mock.calls[0]?.[2]);
    expect(quoteUnauthorizedCallbacks).toContain("tgcmd:/start");
    expect(replySpy).not.toHaveBeenCalled();
  });

  it("replies not-authorized for unauthorized tgcmd:/capital_status", async () => {
    sendMessageSpy.mockClear();
    replySpy.mockClear();

    createTelegramBot({
      token: "tok",
      config: buildRestrictedCommandConfig(),
    });

    const callbackHandler = getOnHandler("callback_query");
    await callbackHandler({
      callbackQuery: {
        id: "cbq-capital-unauthorized",
        data: "tgcmd:/capital_status",
        from: { id: 9, first_name: "Ada", username: "ada_bot" },
        message: {
          chat: { id: 1234, type: "private" },
          date: 1736380800,
          message_id: 82,
          text: "主選單",
        },
      },
      me: { username: "openclaw_bot" },
      getFile: async () => ({ download: async () => new Uint8Array() }),
    });

    expect(answerCallbackQuerySpy).toHaveBeenCalledWith("cbq-capital-unauthorized");
    expect(sendMessageSpy).toHaveBeenCalledTimes(1);
    expect(sendMessageSpy.mock.calls[0]?.[0]).toBe(1234);
    expect(sendMessageSpy.mock.calls[0]?.[1]).toBe("你沒有權限使用這個指令。");
    const capitalUnauthorizedCallbacks = collectCallbackData(sendMessageSpy.mock.calls[0]?.[2]);
    expect(capitalUnauthorizedCallbacks).toContain("tgcmd:/start");
    expect(replySpy).not.toHaveBeenCalled();
  });

  it("still returns main menu after unauthorized tgcmd callback when user taps /start", async () => {
    sendMessageSpy.mockClear();
    replySpy.mockClear();
    answerCallbackQuerySpy.mockClear();

    createTelegramBot({
      token: "tok",
      config: buildRestrictedCommandConfig(),
    });

    const callbackHandler = getOnHandler("callback_query");
    await callbackHandler({
      callbackQuery: {
        id: "cbq-unauth-then-start-1",
        data: "tgcmd:/quote status",
        from: { id: 9, first_name: "Ada", username: "ada_bot" },
        message: {
          chat: { id: 1234, type: "private" },
          date: 1736380800,
          message_id: 91,
          text: "主選單",
        },
      },
      me: { username: "openclaw_bot" },
      getFile: async () => ({ download: async () => new Uint8Array() }),
    });

    await callbackHandler({
      callbackQuery: {
        id: "cbq-unauth-then-start-2",
        data: "tgcmd:/start",
        from: { id: 9, first_name: "Ada", username: "ada_bot" },
        message: {
          chat: { id: 1234, type: "private" },
          date: 1736380801,
          message_id: 92,
          text: "錯誤提示",
        },
      },
      me: { username: "openclaw_bot" },
      getFile: async () => ({ download: async () => new Uint8Array() }),
    });

    expect(answerCallbackQuerySpy).toHaveBeenCalledWith("cbq-unauth-then-start-1");
    expect(answerCallbackQuerySpy).toHaveBeenCalledWith("cbq-unauth-then-start-2");

    expect(sendMessageSpy).toHaveBeenCalledTimes(2);
    expect(sendMessageSpy.mock.calls[0]?.[0]).toBe(1234);
    expect(sendMessageSpy.mock.calls[0]?.[1]).toBe("你沒有權限使用這個指令。");
    const unauthorizedCallbacks = collectCallbackData(sendMessageSpy.mock.calls[0]?.[2]);
    expect(unauthorizedCallbacks).toContain("tgcmd:/start");
    expect(sendMessageSpy.mock.calls[1]?.[0]).toBe(1234);
    expect(sendMessageSpy.mock.calls[1]?.[1]).toBe(TELEGRAM_MAIN_MENU_TEXT);
    const startCallbacks = collectCallbackData(sendMessageSpy.mock.calls[1]?.[2]);
    expect(startCallbacks).toContain("tgcmd:/quote status");
    expect(startCallbacks).toContain("tgcmd:/capital_status");
  });
});
