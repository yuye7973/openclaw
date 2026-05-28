import { describe, expect, it } from "vitest";
import { formatTelegramRuntimeStatusSummary } from "./runtime-status-summary.js";

describe("formatTelegramRuntimeStatusSummary", () => {
  it("renders a complete connected summary in Chinese", () => {
    const text = formatTelegramRuntimeStatusSummary({
      gateway: {
        reachable: true,
        bindHost: "127.0.0.1",
        port: 18789,
        pid: 52008,
      },
      telegram: {
        connected: true,
        transport: "polling",
        botUsername: "openclaw_bot",
      },
      trading: {
        quote: "realtime",
        strategy: "running",
      },
      updatedAtIso: "2026-05-24T06:30:00.000Z",
    });

    expect(text).toContain("🛰 OpenClaw Telegram 中控");
    expect(text).toContain("🧩 Gateway：🟢 在線（127.0.0.1:18789｜PID 52008）");
    expect(text).toContain("🤖 Bot：@openclaw_bot｜輪詢｜🟢 已連線");
    expect(text).toContain("📈 交易助手：報價=即時｜策略=執行中");
    expect(text).toContain("🕒 更新時間：2026-05-24 06:30:00 UTC");
  });

  it("renders fallback fields for unknown and disconnected states", () => {
    const text = formatTelegramRuntimeStatusSummary({
      gateway: {
        reachable: false,
      },
      telegram: {
        connected: false,
        transport: "unknown",
      },
      trading: {
        quote: "unknown",
        strategy: "blocked",
      },
    });

    expect(text).toContain("🧩 Gateway：🔴 離線（127.0.0.1）");
    expect(text).toContain("🤖 Bot：未設定｜未知｜🔴 未連線");
    expect(text).toContain("📈 交易助手：報價=未知｜策略=阻塞");
    expect(text).toContain("🕒 更新時間：未提供");
  });

  it("keeps non-ISO timestamp as raw text", () => {
    const text = formatTelegramRuntimeStatusSummary({
      gateway: {
        reachable: true,
      },
      telegram: {
        connected: true,
        transport: "webhook",
      },
      updatedAtIso: "today-now",
    });

    expect(text).toContain("🤖 Bot：未設定｜Webhook｜🟢 已連線");
    expect(text).toContain("🕒 更新時間：today-now");
  });

  it("renders paper strategy active-page state in Chinese", () => {
    const text = formatTelegramRuntimeStatusSummary({
      gateway: {
        reachable: true,
      },
      telegram: {
        connected: true,
        transport: "polling",
      },
      trading: {
        quote: "delayed",
        strategy: "idle",
        activePagePlan: {
          status: "paper_strategy_ready",
          activePageSize: 64,
          energyCandidateCount: 3,
          paperStrategyEligibleRouteCount: 2,
          operatorActionRequired: false,
        },
      },
    });

    expect(text).toContain("📦 ActivePage：紙上策略就緒｜active=64｜能源候選=3｜紙上候選=2");
    expect(text).not.toContain("Paper gate ready");
  });

  it("renders trading shortcuts closure and next command machine line", () => {
    const text = formatTelegramRuntimeStatusSummary({
      gateway: {
        reachable: true,
      },
      telegram: {
        connected: true,
        transport: "polling",
      },
      trading: {
        quote: "unknown",
        strategy: "idle",
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
    });

    expect(text).toContain("🧪 Trading Shortcuts：pass｜checks=181｜failed=0｜gate=✅");
    expect(text).toContain(
      "shortcutChecks=181 failed=0 assistantClosure=39 okxClosure=13 fixtureCoverage=4 reportMachine=8",
    );
    expect(text).toContain(
      "➡️ 下一步指令：nextCommandShortRow=sc:tr:audit/sc:tr:paperloop/sc:tr:assist gateVerified=true",
    );
  });

  it("renders Telegram publish dry-run readback", () => {
    const text = formatTelegramRuntimeStatusSummary({
      gateway: {
        reachable: true,
      },
      telegram: {
        connected: true,
        transport: "polling",
      },
      trading: {
        quote: "unknown",
        strategy: "idle",
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
    });

    expect(text).toContain("📣 推播 Dry-run：dry_run_ok｜error=OK｜noSend=✅｜cmd=DRY_RUN_NO_SEND");
    expect(text).toContain("payload=快捷檢查✅ 下一步指令✅");
  });

  it("renders TradingAgents paper bridge readback", () => {
    const text = formatTelegramRuntimeStatusSummary({
      gateway: {
        reachable: true,
      },
      telegram: {
        connected: true,
        transport: "polling",
      },
      trading: {
        quote: "unknown",
        strategy: "idle",
        tradingAgents: {
          status: "simulated_ready",
          provider: "simulated",
          mode: "paper_signal_only",
          canAnalyzeNow: true,
          canUseOfficialTradingAgents: false,
          noOrderWrite: true,
          noLiveOrderSent: true,
          brokerWriteAttempted: false,
          nextSafeTask: "run pnpm tradingagents:install only after explicit human approval",
        },
      },
    });

    expect(text).toContain(
      "🤖 TradingAgents：simulated_ready｜provider=simulated｜mode=paper_signal_only｜analyze=✅｜official=❌｜noOrder=✅",
    );
    expect(text).toContain(
      "next=run pnpm tradingagents:install only after explicit human approval",
    );
  });

  it("renders operator refresh active-page state in Chinese", () => {
    const text = formatTelegramRuntimeStatusSummary({
      gateway: {
        reachable: true,
      },
      telegram: {
        connected: true,
        transport: "polling",
      },
      trading: {
        quote: "delayed",
        strategy: "blocked",
        activePagePlan: {
          status: "operator_refresh_required",
          activePageSize: 64,
          energyCandidateCount: 4,
          paperStrategyEligibleRouteCount: 0,
          operatorActionRequired: true,
        },
      },
    });

    expect(text).toContain(
      "📦 ActivePage：待操作者刷新｜active=64｜能源候選=4｜紙上候選=0｜需要操作者刷新",
    );
  });

  it("renders unknown active-page state in Chinese", () => {
    const text = formatTelegramRuntimeStatusSummary({
      gateway: {
        reachable: true,
      },
      telegram: {
        connected: true,
        transport: "polling",
      },
      trading: {
        quote: "unknown",
        strategy: "unknown",
        activePagePlan: {
          status: "unknown",
          activePageSize: 64,
          energyCandidateCount: 1,
          paperStrategyEligibleRouteCount: 0,
          operatorActionRequired: false,
        },
      },
    });

    expect(text).toContain("📦 ActivePage：未知｜active=64｜能源候選=1｜紙上候選=0");
  });

  it("renders blocked active-page state in Chinese", () => {
    const text = formatTelegramRuntimeStatusSummary({
      gateway: {
        reachable: true,
      },
      telegram: {
        connected: true,
        transport: "polling",
      },
      trading: {
        quote: "disconnected",
        strategy: "blocked",
        activePagePlan: {
          status: "blocked",
          activePageSize: 64,
          energyCandidateCount: 0,
          paperStrategyEligibleRouteCount: 0,
          operatorActionRequired: false,
        },
      },
    });

    expect(text).toContain("📦 ActivePage：阻塞｜active=64｜能源候選=0｜紙上候選=0");
  });
});
