import { describe, expect, it } from "vitest";
import { buildTelegramRuntimeStatusReply } from "./runtime-status-reply.js";

function buildBaseStatus() {
  return {
    gateway: {
      reachable: true,
      bindHost: "127.0.0.1",
      port: 18789,
      pid: 52008,
    },
    telegram: {
      connected: true,
      transport: "polling" as const,
      botUsername: "openclaw_bot",
    },
    trading: {
      quote: "realtime" as const,
      strategy: "running" as const,
    },
    updatedAtIso: "2026-05-24T06:30:00.000Z",
  };
}

describe("buildTelegramRuntimeStatusReply", () => {
  it("builds Chinese status text with default action buttons", () => {
    const reply = buildTelegramRuntimeStatusReply({
      status: buildBaseStatus(),
    });

    expect(reply.text).toContain("🛰 OpenClaw Telegram 中控");
    expect(reply.text).toContain("🧩 Gateway：🟢 在線（127.0.0.1:18789｜PID 52008）");
    expect(reply.text).toContain("📈 交易助手：報價=即時｜策略=執行中");
    expect(reply.buttons).toEqual(
      expect.arrayContaining([
        expect.arrayContaining([
          expect.objectContaining({ text: "🔄 重新整理", callback_data: "tgcmd:/status" }),
          expect.objectContaining({
            text: "📊 報價狀態",
            callback_data: "tgcmd:/quote status",
          }),
        ]),
        [
          expect.objectContaining({ text: "🧭 交易總覽", callback_data: "tgcmd:/capital_status" }),
          expect.objectContaining({ text: "🪙 OKX 狀態", callback_data: "tgcmd:/okx_status" }),
        ],
        [
          expect.objectContaining({
            text: "🟢 模擬下單（買）",
            callback_data: "tgcmd:/quote simlive tx00 buy 1",
          }),
          expect.objectContaining({
            text: "🔴 模擬下單（賣）",
            callback_data: "tgcmd:/quote simlive tx00 sell 1",
          }),
        ],
        [expect.objectContaining({ text: "↩ 返回主選單", callback_data: "tgcmd:/start" })],
      ]),
    );
  });

  it("can hide trading shortcuts and return-to-main button", () => {
    const reply = buildTelegramRuntimeStatusReply({
      status: buildBaseStatus(),
      includeTradingButtons: false,
      includeReturnMainMenu: false,
    });

    const flattened = reply.buttons.flat();
    expect(flattened.some((button) => button.text.includes("模擬下單"))).toBe(false);
    expect(flattened.some((button) => button.text.includes("返回主選單"))).toBe(false);
    expect(flattened.some((button) => button.callback_data === "tgcmd:/status")).toBe(true);
    expect(flattened.some((button) => button.callback_data === "tgcmd:/capital_status")).toBe(true);
    expect(flattened.some((button) => button.callback_data === "tgcmd:/okx_status")).toBe(true);
  });

  it("includes active-page operator refresh state in runtime status text", () => {
    const status = buildBaseStatus();
    const reply = buildTelegramRuntimeStatusReply({
      status: {
        ...status,
        trading: {
          ...status.trading,
          activePagePlan: {
            status: "operator_refresh_required",
            activePageSize: 64,
            energyCandidateCount: 15,
            paperStrategyEligibleRouteCount: 0,
            operatorActionRequired: true,
          },
        },
      },
    });

    expect(reply.text).toContain(
      "📦 ActivePage：待操作者刷新｜active=64｜能源候選=15｜紙上候選=0｜需要操作者刷新",
    );
  });

  it("includes active-page blocked state in runtime status text", () => {
    const status = buildBaseStatus();
    const reply = buildTelegramRuntimeStatusReply({
      status: {
        ...status,
        trading: {
          ...status.trading,
          strategy: "blocked",
          activePagePlan: {
            status: "blocked",
            activePageSize: 64,
            energyCandidateCount: 0,
            paperStrategyEligibleRouteCount: 0,
            operatorActionRequired: false,
          },
        },
      },
    });

    expect(reply.text).toContain("📦 ActivePage：阻塞｜active=64｜能源候選=0｜紙上候選=0");
  });

  it("includes active-page unknown state in runtime status text", () => {
    const status = buildBaseStatus();
    const reply = buildTelegramRuntimeStatusReply({
      status: {
        ...status,
        trading: {
          ...status.trading,
          strategy: "unknown",
          activePagePlan: {
            status: "unknown",
            activePageSize: 64,
            energyCandidateCount: 1,
            paperStrategyEligibleRouteCount: 0,
            operatorActionRequired: false,
          },
        },
      },
    });

    expect(reply.text).toContain("📦 ActivePage：未知｜active=64｜能源候選=1｜紙上候選=0");
  });

  it("includes trading shortcut machine lines in runtime status text", () => {
    const status = buildBaseStatus();
    const reply = buildTelegramRuntimeStatusReply({
      status: {
        ...status,
        trading: {
          ...status.trading,
          shortcuts: {
            status: "pass",
            checks: 181,
            failed: 0,
            gateVerified: true,
            machineLine:
              "shortcutChecks=181 failed=0 assistantClosure=39 okxClosure=13 fixtureCoverage=4 reportMachine=8 growthReason=assistant+okx+fixture+report-machine",
            nextCommandMachineLine:
              "nextCommandShortRow=sc:tr:audit/sc:tr:paperloop/sc:tr:assist gateVerified=true buttons=sc:tr:learn/sc:tr:audit/sc:tr:paperloop/sc:tr:assist",
          },
        },
      },
    });

    expect(reply.text).toContain("🧪 Trading Shortcuts：pass｜checks=181｜failed=0｜gate=✅");
    expect(reply.text).toContain("shortcutChecks=181 failed=0 assistantClosure=39");
    expect(reply.text).toContain("➡️ 下一步指令：nextCommandShortRow=sc:tr:audit");
  });

  it("includes Telegram publish dry-run readback in runtime status text", () => {
    const status = buildBaseStatus();
    const reply = buildTelegramRuntimeStatusReply({
      status: {
        ...status,
        trading: {
          ...status.trading,
          publishDryRun: {
            status: "dry_run_ok",
            errorCode: "OK",
            dryRun: true,
            dryRunNoSend: true,
            commandErrorCode: "DRY_RUN_NO_SEND",
            messageHasShortcutChecks: true,
            messageHasNextCommand: true,
          },
        },
      },
    });

    expect(reply.text).toContain(
      "📣 推播 Dry-run：dry_run_ok｜error=OK｜noSend=✅｜cmd=DRY_RUN_NO_SEND",
    );
    expect(reply.text).toContain("payload=快捷檢查✅ 下一步指令✅");
  });
});
