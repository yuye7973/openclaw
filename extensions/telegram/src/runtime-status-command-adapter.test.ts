import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import {
  buildTelegramRuntimeStatusCommandPayload,
  isTelegramRuntimeStatusCommand,
} from "./runtime-status-command-adapter.js";

const tempDirs: string[] = [];

function createTempRepoRoot(): string {
  const repoRoot = fs.mkdtempSync(path.join(os.tmpdir(), "openclaw-telegram-status-adapter-"));
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

afterEach(() => {
  for (const dir of tempDirs.splice(0)) {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

describe("isTelegramRuntimeStatusCommand", () => {
  it("accepts slash command and Chinese aliases", () => {
    expect(isTelegramRuntimeStatusCommand("/status")).toBe(true);
    expect(isTelegramRuntimeStatusCommand("status")).toBe(true);
    expect(isTelegramRuntimeStatusCommand("狀態")).toBe(true);
    expect(isTelegramRuntimeStatusCommand(" 中控狀態 ")).toBe(true);
    expect(isTelegramRuntimeStatusCommand("telegram狀態")).toBe(true);
    expect(isTelegramRuntimeStatusCommand("現在在做什麼")).toBe(true);
    expect(isTelegramRuntimeStatusCommand("下一步")).toBe(true);
    expect(isTelegramRuntimeStatusCommand("Next task")).toBe(true);
    expect(isTelegramRuntimeStatusCommand("next safe")).toBe(true);
    expect(isTelegramRuntimeStatusCommand(" NEXT   SAFE ")).toBe(true);
    expect(isTelegramRuntimeStatusCommand("next safe task")).toBe(true);
    expect(isTelegramRuntimeStatusCommand(" NEXT   SAFE   TASK ")).toBe(true);
  });

  it("rejects unrelated commands", () => {
    expect(isTelegramRuntimeStatusCommand("/start")).toBe(false);
    expect(isTelegramRuntimeStatusCommand("報價")).toBe(false);
  });
});

describe("buildTelegramRuntimeStatusCommandPayload", () => {
  it("returns null when command is not status-like", () => {
    const payload = buildTelegramRuntimeStatusCommandPayload({
      commandText: "/start",
    });
    expect(payload).toBeNull();
  });

  it("builds the same status payload from next-task natural language aliases", () => {
    const repoRoot = createTempRepoRoot();
    writeRepoMarkers(repoRoot);
    const stateDir = path.join(repoRoot, "reports", "hermes-agent", "state");
    writeJson(path.join(stateDir, "openclaw-capital-service-status-latest.json"), {
      generatedAt: "2026-05-24T06:29:00.000Z",
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
    writeJson(path.join(stateDir, "openclaw-okx-current-readiness-summary-latest.json"), {
      status: "blocked",
      summary_zh_tw: "OKX current-readiness 阻擋：market_snapshot_scheduler_not_ready。",
      blockers: ["market_snapshot_scheduler_not_ready"],
      safety: {
        noOrderWrite: true,
      },
    });

    const statusPayload = buildTelegramRuntimeStatusCommandPayload({
      commandText: "/status",
      preferredRepoRoot: repoRoot,
      includeTradingButtons: false,
      includeReturnMainMenu: false,
    });

    expect(statusPayload).not.toBeNull();
    for (const commandText of [
      "狀態",
      "下一步",
      "系統狀態",
      "中控狀態",
      "現在在做什麼",
      "telegram狀態",
      "交易狀態",
      "openclaw狀態",
      "Next task",
      "next safe",
      "next safe task",
    ]) {
      const payload = buildTelegramRuntimeStatusCommandPayload({
        commandText,
        preferredRepoRoot: repoRoot,
        includeTradingButtons: false,
        includeReturnMainMenu: false,
      });

      expect(payload).not.toBeNull();
      expect(payload?.repoRoot).toBe(statusPayload?.repoRoot);
      expect(payload?.replyText).toBe(statusPayload?.replyText);
      expect(payload?.replyText).toContain("[OpenClaw OKX 狀態]");
      expect(payload?.updatedAtIso).toBe("2026-05-24T06:29:00.000Z");
      expect(payload?.buttons).toEqual(statusPayload?.buttons);
    }
  });

  it("builds status payload from snapshot reports", () => {
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

    const payload = buildTelegramRuntimeStatusCommandPayload({
      commandText: "狀態",
      preferredRepoRoot: repoRoot,
      includeTradingButtons: true,
      includeReturnMainMenu: true,
    });

    expect(payload).not.toBeNull();
    expect(payload?.repoRoot).toBe(path.resolve(repoRoot));
    expect(payload?.replyText).toContain("🛰 OpenClaw Telegram 中控");
    expect(payload?.replyText).toContain("🤖 Bot：@openclaw_bot｜輪詢｜🟢 已連線");
    expect(payload?.replyText).toContain(
      "📦 ActivePage：待操作者刷新｜active=64｜能源候選=3｜紙上候選=0｜需要操作者刷新",
    );
    expect(payload?.replyText).toContain(
      "🧪 Trading Shortcuts：pass｜checks=181｜failed=0｜gate=✅",
    );
    expect(payload?.replyText).toContain("shortcutChecks=181 failed=0 assistantClosure=39");
    expect(payload?.replyText).toContain("➡️ 下一步指令：nextCommandShortRow=sc:tr:audit");
    expect(payload?.replyText).toContain(
      "📣 推播 Dry-run：dry_run_ok｜error=OK｜noSend=✅｜cmd=DRY_RUN_NO_SEND",
    );
    expect(payload?.replyText).toContain("payload=快捷檢查✅ 下一步指令✅");
    expect(payload?.replyText).toContain("[OpenClaw OKX 狀態]");
    expect(payload?.replyText).toContain("noOrderWrite=true");
    expect(payload?.updatedAtIso).toBe("2026-05-24T06:30:00.000Z");
    expect(payload?.buttons.flat().some((button) => button.callback_data === "tgcmd:/status")).toBe(
      true,
    );
  });

  it("builds blocked active-page status payload from status callback command", () => {
    const repoRoot = createTempRepoRoot();
    writeRepoMarkers(repoRoot);
    const stateDir = path.join(repoRoot, "reports", "hermes-agent", "state");
    writeJson(path.join(stateDir, "openclaw-capital-service-status-latest.json"), {
      generatedAt: "2026-05-24T06:35:00.000Z",
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
        status: "blocked",
      },
      orderMode: {
        ready: false,
      },
      liveOrders: {
        ready: false,
      },
    });
    writeJson(path.join(stateDir, "openclaw-capital-active-page-refresh-plan-latest.json"), {
      generatedAt: "2026-05-24T06:36:00.000Z",
      status: "blocked",
      readOnly: true,
      liveTradingEnabled: false,
      writeTradingEnabled: false,
      sentOrder: false,
      activePage: {
        size: 64,
        energyContractCandidateCodes: [],
      },
      callbackGate: {
        paperStrategyEligibleRouteCount: 0,
      },
      controlledRefreshPlan: {
        operatorActionRequired: false,
      },
    });

    const payload = buildTelegramRuntimeStatusCommandPayload({
      commandText: "/status",
      preferredRepoRoot: repoRoot,
      includeTradingButtons: true,
      includeReturnMainMenu: true,
    });

    expect(payload).not.toBeNull();
    expect(payload?.repoRoot).toBe(path.resolve(repoRoot));
    expect(payload?.replyText).toContain("📦 ActivePage：阻塞｜active=64｜能源候選=0｜紙上候選=0");
    expect(payload?.updatedAtIso).toBe("2026-05-24T06:35:00.000Z");
    expect(payload?.buttons.flat().some((button) => button.callback_data === "tgcmd:/status")).toBe(
      true,
    );
  });

  it("builds unknown active-page status payload from status callback command", () => {
    const repoRoot = createTempRepoRoot();
    writeRepoMarkers(repoRoot);
    const stateDir = path.join(repoRoot, "reports", "hermes-agent", "state");
    writeJson(path.join(stateDir, "openclaw-capital-service-status-latest.json"), {
      generatedAt: "2026-05-24T06:37:00.000Z",
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
        status: "stale",
      },
      orderMode: {
        ready: true,
      },
      liveOrders: {
        ready: false,
      },
    });
    writeJson(path.join(stateDir, "openclaw-capital-active-page-refresh-plan-latest.json"), {
      generatedAt: "2026-05-24T06:38:00.000Z",
      status: "unexpected_new_status",
      readOnly: true,
      liveTradingEnabled: false,
      writeTradingEnabled: false,
      sentOrder: false,
      activePage: {
        size: 64,
        energyContractCandidateCodes: ["CL2607"],
      },
      callbackGate: {
        paperStrategyEligibleRouteCount: 0,
      },
      controlledRefreshPlan: {
        operatorActionRequired: false,
      },
    });

    const payload = buildTelegramRuntimeStatusCommandPayload({
      commandText: "/status",
      preferredRepoRoot: repoRoot,
      includeTradingButtons: true,
      includeReturnMainMenu: true,
    });

    expect(payload).not.toBeNull();
    expect(payload?.repoRoot).toBe(path.resolve(repoRoot));
    expect(payload?.replyText).toContain("📦 ActivePage：未知｜active=64｜能源候選=1｜紙上候選=0");
    expect(payload?.updatedAtIso).toBe("2026-05-24T06:37:00.000Z");
    expect(payload?.buttons.flat().some((button) => button.callback_data === "tgcmd:/status")).toBe(
      true,
    );
  });
});
