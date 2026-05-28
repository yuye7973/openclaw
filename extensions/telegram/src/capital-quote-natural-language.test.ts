import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

const resolveOpenClawRepoRootMock = vi.hoisted(() => vi.fn(() => "D:/OpenClaw"));
const execFilePromisifiedMock = vi.hoisted(() => vi.fn());
const execFileMock = vi.hoisted(() => {
  const fn = vi.fn();
  Reflect.set(fn, Symbol.for("nodejs.util.promisify.custom"), execFilePromisifiedMock);
  return fn;
});

vi.mock("node:child_process", () => ({
  execFile: execFileMock,
}));

vi.mock("./repo-root-runtime.js", () => ({
  resolveOpenClawRepoRoot: resolveOpenClawRepoRootMock,
}));

let resolveCapitalQuoteNaturalLanguageMatch: typeof import("./capital-quote-natural-language.js").resolveCapitalQuoteNaturalLanguageMatch;
let buildCapitalQuoteNaturalLanguageReplyText: typeof import("./capital-quote-natural-language.js").buildCapitalQuoteNaturalLanguageReplyText;

describe("capital quote natural language", () => {
  beforeAll(async () => {
    ({ resolveCapitalQuoteNaturalLanguageMatch, buildCapitalQuoteNaturalLanguageReplyText } =
      await import("./capital-quote-natural-language.js"));
  });

  beforeEach(() => {
    execFilePromisifiedMock.mockReset();
    execFileMock.mockClear();
    resolveOpenClawRepoRootMock.mockClear();
    delete process.env.OPENCLAW_CAPITAL_QUOTE_REPORTABLE_STATE;
    delete process.env.OPENCLAW_CAPITAL_QUOTE_NO_REFRESH;
  });

  it("resolves natural-language quote request into /quote command", () => {
    expect(resolveCapitalQuoteNaturalLanguageMatch("幫我看一下A50現在報價")).toEqual({
      mode: "quote",
      query: "/quote A50",
      symbol: "A50",
    });
    expect(resolveCapitalQuoteNaturalLanguageMatch("台指現在價多少")).toEqual({
      mode: "quote",
      query: "/quote TX00",
      symbol: "TX00",
    });
    expect(resolveCapitalQuoteNaturalLanguageMatch("/quote tx00")).toBeNull();
    expect(resolveCapitalQuoteNaturalLanguageMatch("只是聊天")).toBeNull();
    expect(resolveCapitalQuoteNaturalLanguageMatch("黃金現在報價是多少")).toEqual({
      mode: "quote",
      query: "/quote GC0000",
      symbol: "GC0000",
    });
    expect(resolveCapitalQuoteNaturalLanguageMatch("原油現在價位")).toEqual({
      mode: "quote",
      query: "/quote CL0000",
      symbol: "CL0000",
    });
    expect(resolveCapitalQuoteNaturalLanguageMatch("富時中國最新價")).toEqual({
      mode: "quote",
      query: "/quote A50",
      symbol: "A50",
    });
    expect(resolveCapitalQuoteNaturalLanguageMatch("小那現在價位")).toEqual({
      mode: "quote",
      query: "/quote NQ0000",
      symbol: "NQ0000",
    });
    expect(resolveCapitalQuoteNaturalLanguageMatch("標普期貨報價")).toEqual({
      mode: "quote",
      query: "/quote ES0000",
      symbol: "ES0000",
    });
    expect(resolveCapitalQuoteNaturalLanguageMatch("自動交易A50指")).toEqual({
      mode: "simulated_live_order",
      query: "/quote A50",
      symbol: "A50",
      simulatedLiveOrderText: "模擬真單 A50 多 1口",
    });
    expect(resolveCapitalQuoteNaturalLanguageMatch("幫我下單台指")).toEqual({
      mode: "simulated_live_order",
      query: "/quote TX00",
      symbol: "TX00",
      simulatedLiveOrderText: "模擬真單 TX00 多 1口",
    });
    expect(resolveCapitalQuoteNaturalLanguageMatch("幫我做空A50 3口")).toEqual({
      mode: "simulated_live_order",
      query: "/quote A50",
      symbol: "A50",
      simulatedLiveOrderText: "模擬真單 A50 空 3口",
    });
    expect(resolveCapitalQuoteNaturalLanguageMatch("幫我平倉A50 2口")).toEqual({
      mode: "simulated_live_order",
      query: "/quote A50",
      symbol: "A50",
      simulatedLiveOrderText: "模擬真單 A50 空 2口",
    });
    expect(resolveCapitalQuoteNaturalLanguageMatch("台指當月下單做空3口")).toEqual({
      mode: "simulated_live_order",
      query: "/quote TXF current-month",
      symbol: "TXF current-month",
      simulatedLiveOrderText: "模擬真單 TX00 空 3口",
    });
    expect(resolveCapitalQuoteNaturalLanguageMatch("幫我加碼台指2口")).toEqual({
      mode: "simulated_live_order",
      query: "/quote TX00",
      symbol: "TX00",
      simulatedLiveOrderText: "模擬真單 TX00 多 2口",
    });
    expect(resolveCapitalQuoteNaturalLanguageMatch("幫我減碼台指2口")).toEqual({
      mode: "simulated_live_order",
      query: "/quote TX00",
      symbol: "TX00",
      simulatedLiveOrderText: "模擬真單 TX00 空 2口",
    });
    expect(resolveCapitalQuoteNaturalLanguageMatch("幫我加倉台指2口")).toEqual({
      mode: "simulated_live_order",
      query: "/quote TX00",
      symbol: "TX00",
      simulatedLiveOrderText: "模擬真單 TX00 多 2口",
    });
    expect(resolveCapitalQuoteNaturalLanguageMatch("幫我減倉台指2口")).toEqual({
      mode: "simulated_live_order",
      query: "/quote TX00",
      symbol: "TX00",
      simulatedLiveOrderText: "模擬真單 TX00 空 2口",
    });
    expect(resolveCapitalQuoteNaturalLanguageMatch("幫我加空台指2口")).toEqual({
      mode: "simulated_live_order",
      query: "/quote TX00",
      symbol: "TX00",
      simulatedLiveOrderText: "模擬真單 TX00 空 2口",
    });
    expect(resolveCapitalQuoteNaturalLanguageMatch("幫我回補台指2口")).toEqual({
      mode: "simulated_live_order",
      query: "/quote TX00",
      symbol: "TX00",
      simulatedLiveOrderText: "模擬真單 TX00 多 2口",
    });
    expect(resolveCapitalQuoteNaturalLanguageMatch("幫我設台指停損")).toEqual({
      mode: "risk_guidance",
      query: "/quote TX00",
      symbol: "TX00",
    });
    expect(resolveCapitalQuoteNaturalLanguageMatch("A50 停利設多少好")).toEqual({
      mode: "risk_guidance",
      query: "/quote A50",
      symbol: "A50",
    });
    expect(resolveCapitalQuoteNaturalLanguageMatch("我在研究A50策略")).toBeNull();
  });

  it("builds quote reply text from quote generator output", async () => {
    execFilePromisifiedMock.mockResolvedValueOnce({
      stdout: JSON.stringify({
        replyText: "[OpenClaw 報價] 台指近 TX00AM｜狀態=即時",
      }),
      stderr: "",
    });

    const reply = await buildCapitalQuoteNaturalLanguageReplyText({
      text: "台指現在價多少",
      repoRoot: "D:/OpenClaw",
    });

    expect(reply).toBe("[OpenClaw 報價] 台指近 TX00AM｜狀態=即時");
    const [resolveRepoRootInput] = resolveOpenClawRepoRootMock.mock.calls[0] ?? [];
    expect(resolveRepoRootInput).toMatchObject({
      preferredRoot: "D:/OpenClaw",
    });
    expect(String(resolveRepoRootInput?.requiredRelativePath)).toContain(
      "openclaw-capital-quote-telegram-reply.mjs",
    );
    expect(execFilePromisifiedMock).toHaveBeenCalledTimes(1);
    const [nodePath, args, options] = execFilePromisifiedMock.mock.calls[0] ?? [];
    expect(nodePath).toBe(process.execPath);
    expect(Array.isArray(args)).toBe(true);
    expect(String(args?.[0])).toContain("openclaw-capital-quote-telegram-reply.mjs");
    expect(args).toEqual(
      expect.arrayContaining(["--query", "/quote TX00", "--write-state", "--json"]),
    );
    expect(options).toMatchObject({
      cwd: "D:/OpenClaw",
      timeout: 45_000,
      windowsHide: true,
      maxBuffer: 1024 * 1024,
    });
  });

  it("routes trading intent text to simulated-live order script", async () => {
    execFilePromisifiedMock.mockResolvedValueOnce({
      stdout: JSON.stringify({
        replyText:
          "[OpenClaw 模擬真單] 已接收 Telegram 模擬真單｜商品=CN0000｜路由=paper-simulated｜真單=封鎖｜sentOrder=false",
      }),
      stderr: "",
    });

    const reply = await buildCapitalQuoteNaturalLanguageReplyText({
      text: "自動交易A50指",
      repoRoot: "D:/OpenClaw",
    });

    expect(reply).toContain("[OpenClaw 模擬真單] 已接收 Telegram 模擬真單");
    expect(execFilePromisifiedMock).toHaveBeenCalledTimes(1);
    const [nodePath, args, options] = execFilePromisifiedMock.mock.calls[0] ?? [];
    expect(nodePath).toBe(process.execPath);
    expect(args).toEqual(
      expect.arrayContaining(["--text", "模擬真單 A50 多 1口", "--write-state", "--json"]),
    );
    expect(String(args?.[0])).toContain("openclaw-capital-telegram-simulated-live-order.mjs");
    expect(options).toMatchObject({
      cwd: "D:/OpenClaw",
      timeout: 45_000,
      windowsHide: true,
      maxBuffer: 1024 * 1024,
    });
  });

  it("returns risk guidance reply for stop-loss/take-profit intent without running scripts", async () => {
    const reply = await buildCapitalQuoteNaturalLanguageReplyText({
      text: "幫我設台指停損",
      repoRoot: "D:/OpenClaw",
    });
    expect(reply).toContain("[OpenClaw 風控提示]");
    expect(reply).toContain("TX00");
    expect(reply).toContain("停損");
    expect(execFilePromisifiedMock).not.toHaveBeenCalled();
    expect(resolveOpenClawRepoRootMock).not.toHaveBeenCalled();
  });

  it("trims replyText before returning quote reply", async () => {
    execFilePromisifiedMock.mockResolvedValueOnce({
      stdout: JSON.stringify({
        replyText: "  [OpenClaw 報價] 台指近 TX00AM｜狀態=即時  \n",
      }),
      stderr: "",
    });

    const reply = await buildCapitalQuoteNaturalLanguageReplyText({
      text: "台指現在價多少",
      repoRoot: "D:/OpenClaw",
    });

    expect(reply).toBe("[OpenClaw 報價] 台指近 TX00AM｜狀態=即時");
  });

  it("returns blocked fallback when quote generator throws", async () => {
    execFilePromisifiedMock.mockRejectedValueOnce(new Error("spawn timeout"));
    const reply = await buildCapitalQuoteNaturalLanguageReplyText({
      text: "A50 現在價位",
      repoRoot: "D:/OpenClaw",
    });

    expect(reply).toContain("[OpenClaw 報價] 封鎖：報價產生器失敗");
    expect(reply).toContain("spawn timeout");
    expect(reply).toContain("真單=封鎖（風控未開啟）");
  });

  it("returns blocked fallback when repo root resolver throws", async () => {
    resolveOpenClawRepoRootMock.mockImplementationOnce(() => {
      throw new Error("repo_root_unavailable");
    });

    const reply = await buildCapitalQuoteNaturalLanguageReplyText({
      text: "A50 現在價位",
      repoRoot: "D:/OpenClaw",
    });

    expect(reply).toContain("[OpenClaw 報價] 封鎖：報價產生器失敗");
    expect(reply).toContain("repo_root_unavailable");
  });

  it("normalizes whitespace inside error message before fallback reply", async () => {
    execFilePromisifiedMock.mockRejectedValueOnce(new Error("spawn \n   timeout \t failed"));
    const reply = await buildCapitalQuoteNaturalLanguageReplyText({
      text: "A50 現在價位",
      repoRoot: "D:/OpenClaw",
    });

    expect(reply).toContain("原因=spawn timeout failed");
  });

  it("returns blocked fallback when quote generator output misses replyText", async () => {
    execFilePromisifiedMock.mockResolvedValueOnce({
      stdout: JSON.stringify({
        status: "ok",
      }),
      stderr: "",
    });

    const reply = await buildCapitalQuoteNaturalLanguageReplyText({
      text: "台指報價",
      repoRoot: "D:/OpenClaw",
    });

    expect(reply).toBe("[OpenClaw 報價] 封鎖：未產生報價回覆｜不可回舊價｜真單=封鎖（風控未開啟）");
  });

  it("returns null and skips quote generator for non-quote text", async () => {
    const reply = await buildCapitalQuoteNaturalLanguageReplyText({
      text: "今天心情很好",
      repoRoot: "D:/OpenClaw",
    });

    expect(reply).toBeNull();
    expect(resolveOpenClawRepoRootMock).not.toHaveBeenCalled();
    expect(execFilePromisifiedMock).not.toHaveBeenCalled();
  });

  it("returns null and skips quote generator for slash command input", async () => {
    const reply = await buildCapitalQuoteNaturalLanguageReplyText({
      text: "/quote tx00",
      repoRoot: "D:/OpenClaw",
    });

    expect(reply).toBeNull();
    expect(resolveOpenClawRepoRootMock).not.toHaveBeenCalled();
    expect(execFilePromisifiedMock).not.toHaveBeenCalled();
  });

  it("passes reportable-state and no-refresh flags when env is enabled", async () => {
    process.env.OPENCLAW_CAPITAL_QUOTE_REPORTABLE_STATE = "D:/OpenClaw/reports/state.json";
    process.env.OPENCLAW_CAPITAL_QUOTE_NO_REFRESH = "1";
    execFilePromisifiedMock.mockResolvedValueOnce({
      stdout: JSON.stringify({
        replyText: "[OpenClaw 報價] A50指熱2605 CN0000｜狀態=即時",
      }),
      stderr: "",
    });

    const reply = await buildCapitalQuoteNaturalLanguageReplyText({
      text: "A50 報價",
      repoRoot: "D:/OpenClaw",
    });

    expect(reply).toContain("[OpenClaw 報價] A50指熱2605 CN0000｜狀態=即時");
    const [, args] = execFilePromisifiedMock.mock.calls[0] ?? [];
    expect(args).toEqual(
      expect.arrayContaining([
        "--reportable-state",
        "D:/OpenClaw/reports/state.json",
        "--no-refresh",
      ]),
    );
  });

  it("passes trimmed reportable-state path into quote generator args", async () => {
    process.env.OPENCLAW_CAPITAL_QUOTE_REPORTABLE_STATE = "  D:/OpenClaw/reports/trimmed.json  ";
    execFilePromisifiedMock.mockResolvedValueOnce({
      stdout: JSON.stringify({
        replyText: "[OpenClaw 報價] 台指近 TX00AM｜狀態=即時",
      }),
      stderr: "",
    });

    await buildCapitalQuoteNaturalLanguageReplyText({
      text: "台指報價",
      repoRoot: "D:/OpenClaw",
    });

    const [, args] = execFilePromisifiedMock.mock.calls[0] ?? [];
    const reportableStateFlagIndex = args.indexOf("--reportable-state");
    expect(reportableStateFlagIndex).toBeGreaterThan(-1);
    expect(args[reportableStateFlagIndex + 1]).toBe("D:/OpenClaw/reports/trimmed.json");
  });

  it("passes only no-refresh flag when refresh disabling env is enabled alone", async () => {
    process.env.OPENCLAW_CAPITAL_QUOTE_NO_REFRESH = "1";
    execFilePromisifiedMock.mockResolvedValueOnce({
      stdout: JSON.stringify({
        replyText: "[OpenClaw 報價] A50指熱2605 CN0000｜狀態=即時",
      }),
      stderr: "",
    });

    await buildCapitalQuoteNaturalLanguageReplyText({
      text: "A50 報價",
      repoRoot: "D:/OpenClaw",
    });

    const [, args] = execFilePromisifiedMock.mock.calls[0] ?? [];
    expect(args).toContain("--no-refresh");
    expect(args).not.toContain("--reportable-state");
  });

  it("does not pass optional flags when env values are blank or disabled", async () => {
    process.env.OPENCLAW_CAPITAL_QUOTE_REPORTABLE_STATE = "   ";
    process.env.OPENCLAW_CAPITAL_QUOTE_NO_REFRESH = "0";
    execFilePromisifiedMock.mockResolvedValueOnce({
      stdout: JSON.stringify({
        replyText: "[OpenClaw 報價] 台指近 TX00AM｜狀態=即時",
      }),
      stderr: "",
    });

    const reply = await buildCapitalQuoteNaturalLanguageReplyText({
      text: "台指報價",
      repoRoot: "D:/OpenClaw",
    });

    expect(reply).toContain("[OpenClaw 報價] 台指近 TX00AM｜狀態=即時");
    const [, args] = execFilePromisifiedMock.mock.calls[0] ?? [];
    expect(args).not.toContain("--reportable-state");
    expect(args).not.toContain("--no-refresh");
  });

  it("returns blocked fallback when quote generator stdout is invalid json", async () => {
    execFilePromisifiedMock.mockResolvedValueOnce({
      stdout: "{not-json",
      stderr: "",
    });

    const reply = await buildCapitalQuoteNaturalLanguageReplyText({
      text: "A50 報價",
      repoRoot: "D:/OpenClaw",
    });

    expect(reply).toContain("[OpenClaw 報價] 封鎖：報價產生器失敗");
    expect(reply).toContain("真單=封鎖（風控未開啟）");
  });
});
