import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import {
  readTelegramRuntimeStatusSnapshot,
  readTelegramRuntimeStatusSnapshotOrDefault,
} from "./runtime-status-snapshot-reader.js";

const tempDirs: string[] = [];

function createTempRepoRoot(): string {
  const repoRoot = fs.mkdtempSync(path.join(os.tmpdir(), "openclaw-telegram-status-reader-"));
  tempDirs.push(repoRoot);
  return repoRoot;
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

describe("readTelegramRuntimeStatusSnapshot", () => {
  it("maps service + telegram latest snapshots to summary input", () => {
    const repoRoot = createTempRepoRoot();
    const stateDir = path.join(repoRoot, "reports", "hermes-agent", "state");
    writeJson(path.join(stateDir, "openclaw-capital-service-status-latest.json"), {
      generatedAt: "2026-05-24T06:30:00.000Z",
      ready: false,
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
        pollState: "polling_active",
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
      generatedAt: "2026-05-24T06:31:00.000Z",
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
            nextSafeCommand: "sc:tr:audit / sc:tr:paperloop / sc:tr:assist",
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
      schema: "openclaw.controlled-task-runner.telegram-publish.report.v1",
      generatedAt: "2026-05-24T06:34:00.000Z",
      status: "dry_run_ok",
      errorCode: "OK",
      dryRun: true,
      dryRunNoSend: true,
      message: "快捷檢查=shortcutChecks=181 failed=0｜下一步指令=nextCommandShortRow=sc:tr:audit",
      commandErrorCode: "DRY_RUN_NO_SEND",
    });

    const snapshot = readTelegramRuntimeStatusSnapshot({ repoRoot });
    expect(snapshot).toEqual({
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
        quote: "disconnected",
        strategy: "idle",
        activePagePlan: {
          status: "operator_refresh_required",
          activePageSize: 64,
          energyCandidateCount: 3,
          paperStrategyEligibleRouteCount: 0,
          operatorActionRequired: true,
        },
        shortcuts: {
          status: "pass",
          checks: 181,
          failed: 0,
          machineLine:
            "shortcutChecks=181 failed=0 assistantClosure=39 okxClosure=13 fixtureCoverage=4 reportMachine=8 growthReason=assistant+okx+fixture+report-machine",
          nextCommand: "sc:tr:audit / sc:tr:paperloop / sc:tr:assist",
          nextCommandMachineLine:
            "nextCommandShortRow=sc:tr:audit/sc:tr:paperloop/sc:tr:assist gateVerified=true buttons=sc:tr:learn/sc:tr:audit/sc:tr:paperloop/sc:tr:assist",
          gateVerified: true,
        },
        publishDryRun: {
          status: "dry_run_ok",
          errorCode: "OK",
          dryRun: true,
          dryRunNoSend: true,
          commandErrorCode: "DRY_RUN_NO_SEND",
          messageHasShortcutChecks: true,
          messageHasNextCommand: true,
          generatedAtIso: "2026-05-24T06:34:00.000Z",
        },
      },
      updatedAtIso: "2026-05-24T06:30:00.000Z",
    });
  });

  it("maps trading shortcuts report into status snapshot", () => {
    const repoRoot = createTempRepoRoot();
    const stateDir = path.join(repoRoot, "reports", "hermes-agent", "state");
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

    const snapshot = readTelegramRuntimeStatusSnapshot({ repoRoot });

    expect(snapshot.trading?.shortcuts).toEqual({
      status: "pass",
      checks: 181,
      failed: 0,
      machineLine:
        "shortcutChecks=181 failed=0 assistantClosure=39 okxClosure=13 fixtureCoverage=4 reportMachine=8 growthReason=assistant+okx+fixture+report-machine",
      nextCommand: "sc:tr:audit / sc:tr:paperloop / sc:tr:assist",
      nextCommandMachineLine:
        "nextCommandShortRow=sc:tr:audit/sc:tr:paperloop/sc:tr:assist gateVerified=true buttons=sc:tr:learn/sc:tr:audit/sc:tr:paperloop/sc:tr:assist",
      gateVerified: true,
    });
    expect(snapshot.updatedAtIso).toBe("2026-05-24T06:33:00.000Z");
  });

  it("maps Telegram publish dry-run report into status snapshot", () => {
    const repoRoot = createTempRepoRoot();
    const stateDir = path.join(repoRoot, "reports", "hermes-agent", "state");
    writeJson(path.join(stateDir, "openclaw-controlled-task-runner-telegram-publish-latest.json"), {
      schema: "openclaw.controlled-task-runner.telegram-publish.report.v1",
      generatedAt: "2026-05-24T06:34:00.000Z",
      status: "dry_run_ok",
      errorCode: "OK",
      dryRun: true,
      dryRunNoSend: true,
      message: "快捷檢查=shortcutChecks=181 failed=0｜下一步指令=nextCommandShortRow=sc:tr:audit",
      commandErrorCode: "DRY_RUN_NO_SEND",
    });

    const snapshot = readTelegramRuntimeStatusSnapshot({ repoRoot });

    expect(snapshot.trading?.publishDryRun).toEqual({
      status: "dry_run_ok",
      errorCode: "OK",
      dryRun: true,
      dryRunNoSend: true,
      commandErrorCode: "DRY_RUN_NO_SEND",
      messageHasShortcutChecks: true,
      messageHasNextCommand: true,
      generatedAtIso: "2026-05-24T06:34:00.000Z",
    });
    expect(snapshot.updatedAtIso).toBe("2026-05-24T06:34:00.000Z");
  });

  it("maps TradingAgents summary report into status snapshot", () => {
    const repoRoot = createTempRepoRoot();
    const stateDir = path.join(repoRoot, "reports", "hermes-agent", "state");
    writeJson(path.join(stateDir, "openclaw-tradingagents-summary-latest.json"), {
      schema: "openclaw.tradingagents.summary.v1",
      generatedAt: "2026-05-25T18:26:50.755Z",
      status: "simulated_ready",
      runtime: {
        status: "ok",
        provider: "simulated",
        mode: "paper_signal_only",
        noOrderWrite: true,
        brokerWriteAttempted: false,
      },
      canAnalyzeNow: true,
      canUseOfficialTradingAgents: false,
      no_live_order_sent: true,
      brokerWriteAttempted: false,
      nextSafeTask: "run pnpm tradingagents:install only after explicit human approval",
    });

    const snapshot = readTelegramRuntimeStatusSnapshot({ repoRoot });

    expect(snapshot.trading?.tradingAgents).toEqual({
      status: "simulated_ready",
      provider: "simulated",
      mode: "paper_signal_only",
      canAnalyzeNow: true,
      canUseOfficialTradingAgents: false,
      noOrderWrite: true,
      noLiveOrderSent: true,
      brokerWriteAttempted: false,
      nextSafeTask: "run pnpm tradingagents:install only after explicit human approval",
    });
    expect(snapshot.updatedAtIso).toBe("2026-05-25T18:26:50.755Z");
  });

  it("maps operator refresh active-page status to summary input", () => {
    const repoRoot = createTempRepoRoot();
    const stateDir = path.join(repoRoot, "reports", "hermes-agent", "state");
    writeJson(path.join(stateDir, "openclaw-capital-active-page-refresh-plan-latest.json"), {
      generatedAt: "2026-05-24T06:31:00.000Z",
      status: "ready_for_operator_refresh",
      readOnly: true,
      liveTradingEnabled: false,
      writeTradingEnabled: false,
      sentOrder: false,
      activePage: {
        size: 64,
        energyContractCandidateCodes: ["CL2607", "CL2608"],
      },
      callbackGate: {
        paperStrategyEligibleRouteCount: 0,
      },
      controlledRefreshPlan: {
        operatorActionRequired: true,
      },
    });

    const snapshot = readTelegramRuntimeStatusSnapshot({ repoRoot });

    expect(snapshot.trading?.activePagePlan).toEqual({
      status: "operator_refresh_required",
      activePageSize: 64,
      energyCandidateCount: 2,
      paperStrategyEligibleRouteCount: 0,
      operatorActionRequired: true,
    });
    expect(snapshot.updatedAtIso).toBe("2026-05-24T06:31:00.000Z");
  });

  it("maps paper strategy gate active-page status to summary input", () => {
    const repoRoot = createTempRepoRoot();
    const stateDir = path.join(repoRoot, "reports", "hermes-agent", "state");
    writeJson(path.join(stateDir, "openclaw-capital-active-page-refresh-plan-latest.json"), {
      generatedAt: "2026-05-24T06:32:00.000Z",
      status: "paper_strategy_gate_ready",
      readOnly: true,
      liveTradingEnabled: false,
      writeTradingEnabled: false,
      sentOrder: false,
      activePage: {
        size: 64,
        energyContractCandidateCodes: ["CL2607", "CL2608", "NG2606"],
      },
      callbackGate: {
        paperStrategyEligibleRouteCount: 2,
      },
      controlledRefreshPlan: {
        operatorActionRequired: false,
      },
    });

    const snapshot = readTelegramRuntimeStatusSnapshot({ repoRoot });

    expect(snapshot.trading?.activePagePlan).toEqual({
      status: "paper_strategy_ready",
      activePageSize: 64,
      energyCandidateCount: 3,
      paperStrategyEligibleRouteCount: 2,
      operatorActionRequired: false,
    });
    expect(snapshot.updatedAtIso).toBe("2026-05-24T06:32:00.000Z");
  });

  it("maps blocked active-page status to summary input", () => {
    const repoRoot = createTempRepoRoot();
    const stateDir = path.join(repoRoot, "reports", "hermes-agent", "state");
    writeJson(path.join(stateDir, "openclaw-capital-active-page-refresh-plan-latest.json"), {
      generatedAt: "2026-05-24T06:33:00.000Z",
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

    const snapshot = readTelegramRuntimeStatusSnapshot({ repoRoot });

    expect(snapshot.trading?.activePagePlan).toEqual({
      status: "blocked",
      activePageSize: 64,
      energyCandidateCount: 0,
      paperStrategyEligibleRouteCount: 0,
      operatorActionRequired: false,
    });
    expect(snapshot.updatedAtIso).toBe("2026-05-24T06:33:00.000Z");
  });

  it("maps unknown active-page status to summary input", () => {
    const repoRoot = createTempRepoRoot();
    const stateDir = path.join(repoRoot, "reports", "hermes-agent", "state");
    writeJson(path.join(stateDir, "openclaw-capital-active-page-refresh-plan-latest.json"), {
      generatedAt: "2026-05-24T06:34:00.000Z",
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

    const snapshot = readTelegramRuntimeStatusSnapshot({ repoRoot });

    expect(snapshot.trading?.activePagePlan).toEqual({
      status: "unknown",
      activePageSize: 64,
      energyCandidateCount: 1,
      paperStrategyEligibleRouteCount: 0,
      operatorActionRequired: false,
    });
    expect(snapshot.updatedAtIso).toBe("2026-05-24T06:34:00.000Z");
  });

  it("returns fallback defaults when snapshot files are missing", () => {
    const repoRoot = createTempRepoRoot();
    const snapshot = readTelegramRuntimeStatusSnapshotOrDefault({ repoRoot });

    expect(snapshot.gateway.reachable).toBe(false);
    expect(snapshot.telegram.connected).toBe(false);
    expect(snapshot.telegram.transport).toBe("unknown");
    expect(snapshot.trading?.quote).toBe("unknown");
    expect(snapshot.trading?.strategy).toBe("unknown");
    expect(snapshot.updatedAtIso).toBeUndefined();
  });
});
