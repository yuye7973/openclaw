import fs from "node:fs";
import path from "node:path";
import type {
  TelegramQuoteState,
  TelegramActivePageRefreshState,
  TelegramPublishDryRunState,
  TelegramRuntimeStatusSummaryInput,
  TelegramRuntimeTransport,
  TelegramTradingShortcutsState,
  TelegramTradingAgentsState,
  TelegramStrategyState,
} from "./runtime-status-summary.js";

const DEFAULT_STATUS: TelegramRuntimeStatusSummaryInput = {
  gateway: {
    reachable: false,
  },
  telegram: {
    connected: false,
    transport: "unknown",
  },
  trading: {
    quote: "unknown",
    strategy: "unknown",
  },
};

export type ReadTelegramRuntimeStatusSnapshotOptions = {
  repoRoot?: string;
};

type JsonRecord = Record<string, unknown>;
type TelegramTradingStatus = NonNullable<TelegramRuntimeStatusSummaryInput["trading"]>;

const DEFAULT_TRADING_STATUS: TelegramTradingStatus = {
  quote: "unknown",
  strategy: "unknown",
};

function asRecord(value: unknown): JsonRecord | undefined {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return undefined;
  }
  return value as JsonRecord;
}

function asBoolean(value: unknown): boolean | undefined {
  return typeof value === "boolean" ? value : undefined;
}

function asNumber(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

function asString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : undefined;
}

function readJsonFile(filePath: string): JsonRecord | undefined {
  try {
    const raw = fs.readFileSync(filePath, "utf8");
    const parsed = JSON.parse(raw) as unknown;
    return asRecord(parsed);
  } catch {
    return undefined;
  }
}

function resolveTransport(telegramPoller: JsonRecord | undefined): TelegramRuntimeTransport {
  const pollingEnabled = asBoolean(telegramPoller?.pollingEnabled);
  if (pollingEnabled === true) {
    return "polling";
  }
  const pollState = asString(telegramPoller?.pollState)?.toLowerCase();
  if (pollState?.includes("webhook")) {
    return "webhook";
  }
  return "unknown";
}

function resolveQuoteState(quote: JsonRecord | undefined): TelegramQuoteState {
  if (asBoolean(quote?.ready) === true || asBoolean(quote?.capabilityReady) === true) {
    return "realtime";
  }
  const statusText = asString(quote?.status)?.toLowerCase() ?? "";
  if (statusText.includes("delayed")) {
    return "delayed";
  }
  if (
    statusText.includes("session_closed") ||
    statusText.includes("blocked") ||
    statusText.includes("stale")
  ) {
    return "disconnected";
  }
  return "unknown";
}

function resolveStrategyState(serviceStatus: JsonRecord | undefined): TelegramStrategyState {
  const orderMode = asRecord(serviceStatus?.orderMode);
  const liveOrders = asRecord(serviceStatus?.liveOrders);
  const liveTradingEnabled = asBoolean(serviceStatus?.liveTradingEnabled);

  if (asBoolean(orderMode?.ready) === false) {
    return "blocked";
  }
  if (liveTradingEnabled === true && asBoolean(liveOrders?.ready) === true) {
    return "running";
  }
  if (asBoolean(orderMode?.ready) === true) {
    return "idle";
  }
  return "unknown";
}

function resolveActivePageRefreshState(
  activePagePlan: JsonRecord | undefined,
): TelegramActivePageRefreshState {
  const status = asString(activePagePlan?.status);
  if (status === "ready_for_operator_refresh") {
    return "operator_refresh_required";
  }
  if (status === "paper_strategy_gate_ready") {
    return "paper_strategy_ready";
  }
  if (status === "blocked") {
    return "blocked";
  }
  return "unknown";
}

function resolveTradingShortcutsState(
  tradingShortcutsReport: JsonRecord | undefined,
): TelegramTradingShortcutsState | undefined {
  const summary = asRecord(tradingShortcutsReport?.summary);
  if (!summary) {
    return undefined;
  }
  const shortcutCheckCountClosure = asRecord(summary.shortcutCheckCountClosure);
  const assistantClosure = asRecord(summary.assistantClosure);
  const assistantLearningHint = asRecord(assistantClosure?.assistantLearningHint);
  const nextCommandShortRow = asRecord(assistantLearningHint?.nextCommandShortRow);
  return {
    status: asString(tradingShortcutsReport?.status),
    checks: asNumber(summary.checks),
    failed: asNumber(summary.failed),
    machineLine: asString(shortcutCheckCountClosure?.machineLine),
    nextCommand:
      asString(nextCommandShortRow?.command) ?? asString(assistantLearningHint?.nextSafeCommand),
    nextCommandMachineLine: asString(nextCommandShortRow?.machineLine),
    gateVerified: asBoolean(nextCommandShortRow?.gateVerified),
  };
}

function resolvePublishDryRunState(
  publishReport: JsonRecord | undefined,
): TelegramPublishDryRunState | undefined {
  if (!publishReport) {
    return undefined;
  }
  const message = asString(publishReport.message);
  return {
    status: asString(publishReport.status),
    errorCode: asString(publishReport.errorCode),
    dryRun: asBoolean(publishReport.dryRun),
    dryRunNoSend: asBoolean(publishReport.dryRunNoSend),
    commandErrorCode: asString(publishReport.commandErrorCode),
    messageHasShortcutChecks: message?.includes("shortcutChecks="),
    messageHasNextCommand: message?.includes("nextCommandShortRow="),
    generatedAtIso: asString(publishReport.generatedAt),
  };
}

function resolveTradingAgentsState(
  tradingAgentsReport: JsonRecord | undefined,
): TelegramTradingAgentsState | undefined {
  if (!tradingAgentsReport) {
    return undefined;
  }
  const runtime = asRecord(tradingAgentsReport.runtime);
  return {
    status: asString(tradingAgentsReport.status),
    provider: asString(runtime?.provider),
    mode: asString(runtime?.mode),
    canAnalyzeNow: asBoolean(tradingAgentsReport.canAnalyzeNow),
    canUseOfficialTradingAgents: asBoolean(tradingAgentsReport.canUseOfficialTradingAgents),
    noOrderWrite: asBoolean(runtime?.noOrderWrite),
    noLiveOrderSent: asBoolean(tradingAgentsReport.no_live_order_sent),
    brokerWriteAttempted:
      asBoolean(tradingAgentsReport.brokerWriteAttempted) ??
      asBoolean(runtime?.brokerWriteAttempted),
    nextSafeTask: asString(tradingAgentsReport.nextSafeTask),
  };
}

export function readTelegramRuntimeStatusSnapshot(
  options: ReadTelegramRuntimeStatusSnapshotOptions = {},
): TelegramRuntimeStatusSummaryInput {
  const repoRoot = path.resolve(options.repoRoot || process.cwd());
  const stateDir = path.join(repoRoot, "reports", "hermes-agent", "state");
  const serviceStatusPath = path.join(stateDir, "openclaw-capital-service-status-latest.json");
  const runnerTelegramPath = path.join(
    stateDir,
    "openclaw-controlled-task-runner-telegram-latest.json",
  );
  const activePageRefreshPlanPath = path.join(
    stateDir,
    "openclaw-capital-active-page-refresh-plan-latest.json",
  );
  const tradingShortcutsPath = path.join(
    stateDir,
    "openclaw-telegram-trading-shortcuts-latest.json",
  );
  const publishReportPath = path.join(
    stateDir,
    "openclaw-controlled-task-runner-telegram-publish-latest.json",
  );
  const tradingAgentsReportPath = path.join(stateDir, "openclaw-tradingagents-summary-latest.json");

  const serviceStatus = readJsonFile(serviceStatusPath);
  const runnerTelegram = readJsonFile(runnerTelegramPath);
  const activePageRefreshPlan = readJsonFile(activePageRefreshPlanPath);
  const tradingShortcutsReport = readJsonFile(tradingShortcutsPath);
  const publishReport = readJsonFile(publishReportPath);
  const tradingAgentsReport = readJsonFile(tradingAgentsReportPath);

  const serviceRecord = asRecord(serviceStatus?.service);
  const telegramPoller = asRecord(serviceStatus?.telegramPoller);
  const quote = asRecord(serviceStatus?.quote);
  const activePage = asRecord(activePageRefreshPlan?.activePage);
  const callbackGate = asRecord(activePageRefreshPlan?.callbackGate);
  const controlledRefreshPlan = asRecord(activePageRefreshPlan?.controlledRefreshPlan);

  const gatewayReady = asBoolean(serviceRecord?.ready) ?? asBoolean(serviceStatus?.ready) ?? false;
  const gatewayPidAlive = asBoolean(serviceRecord?.pidAlive);
  const gatewayReachable = gatewayReady && gatewayPidAlive !== false;

  const botConnected =
    (asBoolean(telegramPoller?.ready) ?? false) && asBoolean(telegramPoller?.available) !== false;
  const tradingShortcutsState = resolveTradingShortcutsState(tradingShortcutsReport);
  const publishDryRunState = resolvePublishDryRunState(publishReport);
  const tradingAgentsState = resolveTradingAgentsState(tradingAgentsReport);

  return {
    gateway: {
      reachable: gatewayReachable,
      bindHost: asString(serviceRecord?.host),
      port: asNumber(serviceRecord?.port),
      pid: asNumber(serviceRecord?.pid),
    },
    telegram: {
      connected: botConnected,
      transport: resolveTransport(telegramPoller),
      botUsername: asString(runnerTelegram?.botUsername),
    },
    trading: {
      quote: resolveQuoteState(quote),
      strategy: resolveStrategyState(serviceStatus),
      ...(activePageRefreshPlan
        ? {
            activePagePlan: {
              status: resolveActivePageRefreshState(activePageRefreshPlan),
              activePageSize: asNumber(activePage?.size),
              energyCandidateCount: Array.isArray(activePage?.energyContractCandidateCodes)
                ? activePage.energyContractCandidateCodes.length
                : undefined,
              paperStrategyEligibleRouteCount: asNumber(
                callbackGate?.paperStrategyEligibleRouteCount,
              ),
              operatorActionRequired: asBoolean(controlledRefreshPlan?.operatorActionRequired),
            },
          }
        : {}),
      ...(tradingShortcutsState
        ? {
            shortcuts: tradingShortcutsState,
          }
        : {}),
      ...(publishDryRunState
        ? {
            publishDryRun: publishDryRunState,
          }
        : {}),
      ...(tradingAgentsState
        ? {
            tradingAgents: tradingAgentsState,
          }
        : {}),
    },
    updatedAtIso:
      asString(serviceStatus?.generatedAt) ??
      asString(serviceRecord?.statusGeneratedAt) ??
      asString(activePageRefreshPlan?.generatedAt) ??
      asString(publishReport?.generatedAt) ??
      asString(tradingAgentsReport?.generatedAt) ??
      asString(tradingShortcutsReport?.generatedAt) ??
      asString(runnerTelegram?.generatedAt),
  };
}

export function readTelegramRuntimeStatusSnapshotOrDefault(
  options: ReadTelegramRuntimeStatusSnapshotOptions = {},
): TelegramRuntimeStatusSummaryInput {
  const snapshot = readTelegramRuntimeStatusSnapshot(options);
  return {
    gateway: {
      ...DEFAULT_STATUS.gateway,
      ...snapshot.gateway,
    },
    telegram: {
      ...DEFAULT_STATUS.telegram,
      ...snapshot.telegram,
    },
    trading: {
      ...DEFAULT_TRADING_STATUS,
      ...snapshot.trading,
    },
    updatedAtIso: snapshot.updatedAtIso,
  };
}
