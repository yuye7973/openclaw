import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { buildTelegramRuntimeStatusControllerReply } from "./runtime-status-controller.js";

const tempDirs: string[] = [];

function createTempRepoRoot(): string {
  const repoRoot = fs.mkdtempSync(path.join(os.tmpdir(), "openclaw-telegram-status-controller-"));
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

describe("buildTelegramRuntimeStatusControllerReply", () => {
  it("reads snapshots and builds Chinese runtime status reply", () => {
    const repoRoot = createTempRepoRoot();
    writeRepoMarkers(repoRoot);
    const stateDir = path.join(repoRoot, "reports", "hermes-agent", "state");
    writeJson(path.join(stateDir, "openclaw-capital-service-status-latest.json"), {
      generatedAt: "2026-05-24T06:30:00.000Z",
      liveTradingEnabled: true,
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
        ready: true,
        capabilityReady: true,
        status: "fresh",
      },
      orderMode: {
        ready: true,
      },
      liveOrders: {
        ready: true,
      },
    });
    writeJson(path.join(stateDir, "openclaw-controlled-task-runner-telegram-latest.json"), {
      botUsername: "openclaw_bot",
    });
    writeJson(path.join(stateDir, "openclaw-telegram-trading-shortcuts-latest.json"), {
      generatedAt: "2026-05-24T06:31:00.000Z",
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
      generatedAt: "2026-05-24T06:32:00.000Z",
      status: "dry_run_ok",
      errorCode: "OK",
      dryRun: true,
      dryRunNoSend: true,
      message: "快捷檢查=shortcutChecks=181 failed=0｜下一步指令=nextCommandShortRow=sc:tr:audit",
      commandErrorCode: "DRY_RUN_NO_SEND",
    });

    const reply = buildTelegramRuntimeStatusControllerReply({
      preferredRepoRoot: repoRoot,
    });

    expect(reply.repoRoot).toBe(path.resolve(repoRoot));
    expect(reply.status.gateway.reachable).toBe(true);
    expect(reply.status.telegram.connected).toBe(true);
    expect(reply.status.trading?.quote).toBe("realtime");
    expect(reply.status.trading?.strategy).toBe("running");
    expect(reply.status.trading?.shortcuts?.checks).toBe(181);
    expect(reply.status.trading?.shortcuts?.gateVerified).toBe(true);
    expect(reply.status.trading?.publishDryRun?.status).toBe("dry_run_ok");
    expect(reply.status.trading?.publishDryRun?.messageHasNextCommand).toBe(true);
    expect(reply.status.trading?.activePagePlan).toBeUndefined();
    expect(reply.text).toContain("🛰 OpenClaw Telegram 中控");
    expect(reply.text).toContain("🧩 Gateway：🟢 在線（127.0.0.1:18789｜PID 52008）");
    expect(reply.text).toContain("🤖 Bot：@openclaw_bot｜輪詢｜🟢 已連線");
    expect(reply.text).toContain("🧪 Trading Shortcuts：pass｜checks=181｜failed=0｜gate=✅");
    expect(reply.text).toContain("➡️ 下一步指令：nextCommandShortRow=sc:tr:audit");
    expect(reply.text).toContain(
      "📣 推播 Dry-run：dry_run_ok｜error=OK｜noSend=✅｜cmd=DRY_RUN_NO_SEND",
    );
    expect(reply.text).not.toContain("ActivePage");
    expect(reply.buttons.flat().some((button) => button.callback_data === "tgcmd:/status")).toBe(
      true,
    );
  });

  it("includes active-page refresh state when the latest plan exists", () => {
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

    const reply = buildTelegramRuntimeStatusControllerReply({
      preferredRepoRoot: repoRoot,
    });

    expect(reply.status.trading?.activePagePlan).toEqual({
      status: "operator_refresh_required",
      activePageSize: 64,
      energyCandidateCount: 3,
      paperStrategyEligibleRouteCount: 0,
      operatorActionRequired: true,
    });
    expect(reply.text).toContain(
      "📦 ActivePage：待操作者刷新｜active=64｜能源候選=3｜紙上候選=0｜需要操作者刷新",
    );
  });

  it("includes blocked active-page state when the latest plan is blocked", () => {
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

    const reply = buildTelegramRuntimeStatusControllerReply({
      preferredRepoRoot: repoRoot,
    });

    expect(reply.status.trading?.activePagePlan).toEqual({
      status: "blocked",
      activePageSize: 64,
      energyCandidateCount: 0,
      paperStrategyEligibleRouteCount: 0,
      operatorActionRequired: false,
    });
    expect(reply.text).toContain("📦 ActivePage：阻塞｜active=64｜能源候選=0｜紙上候選=0");
  });

  it("includes unknown active-page state when the latest plan status is unexpected", () => {
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

    const reply = buildTelegramRuntimeStatusControllerReply({
      preferredRepoRoot: repoRoot,
    });

    expect(reply.status.trading?.activePagePlan).toEqual({
      status: "unknown",
      activePageSize: 64,
      energyCandidateCount: 1,
      paperStrategyEligibleRouteCount: 0,
      operatorActionRequired: false,
    });
    expect(reply.text).toContain("📦 ActivePage：未知｜active=64｜能源候選=1｜紙上候選=0");
  });

  it("falls back to unknown status when state snapshots are missing", () => {
    const repoRoot = createTempRepoRoot();
    writeRepoMarkers(repoRoot);

    const reply = buildTelegramRuntimeStatusControllerReply({
      preferredRepoRoot: repoRoot,
      includeTradingButtons: false,
      includeReturnMainMenu: false,
    });

    expect(reply.status.gateway.reachable).toBe(false);
    expect(reply.status.telegram.connected).toBe(false);
    expect(reply.status.telegram.transport).toBe("unknown");
    expect(reply.status.trading?.quote).toBe("unknown");
    expect(reply.status.trading?.strategy).toBe("unknown");
    expect(reply.text).toContain("🧩 Gateway：🔴 離線");
    expect(reply.text).toContain("🤖 Bot：未設定｜未知｜🔴 未連線");
    expect(reply.text).toContain("🕒 更新時間：未提供");
    const flattened = reply.buttons.flat();
    expect(flattened.some((button) => button.callback_data === "tgcmd:/status")).toBe(true);
    expect(flattened.some((button) => button.text.includes("模擬下單"))).toBe(false);
  });
});
