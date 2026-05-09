import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import {
  buildCapitalPaperAssistantState,
  readCapitalPaperAssistantState,
  writeCapitalPaperAssistantState,
} from "./openclaw-capital-paper-assistant-state.mjs";

async function writeJson(filePath, value) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

function baseQuoteStatus(status = "ready", overrides = {}) {
  return {
    schema: "openclaw.capital.quote-status.v1",
    generatedAt: "2026-05-06T19:00:00.000Z",
    provider: "capital",
    source: "BrokerDesk health dashboard",
    readOnly: true,
    loginAttempted: false,
    liveTradingEnabled: false,
    writeTradingEnabled: false,
    status,
    ready: status === "ready",
    reason: "fixture",
    strategyGate: {
      ready: status === "ready",
      status: status === "ready" ? "allow_read_only_strategy_context" : "deny_strategy_context",
      reason: "fixture",
    },
    guard: {
      active: false,
      lastCode: "",
      nextAllowedAt: "",
      ...overrides.guard,
    },
    quoteProof: {
      status: "confirmed",
      freshness: status === "stale" ? "stale" : "fresh",
      latestStock: "MXFFX999",
      latestStockName: "客小台現貨標的",
      freshnessStatus: status === "stale" ? "stale" : "fresh",
      freshnessAgeSeconds: status === "stale" ? 999999 : 60,
      maxFreshSeconds: 2,
      maxAllowedFreshAgeSeconds: 2,
      ...overrides.quoteProof,
    },
    completion: {
      queueCompleted: true,
      openClawReady: true,
      openClawCompleted: true,
      lastRunStatus: "subscription-window-accepted",
      quoteUniverseCount: 18404,
      distinctQuoteCodeCount: 14622,
      completionUniverseCount: 14622,
      completionBasis: "distinctQuoteCodeCount",
      nextStartIndex: 14622,
      ...overrides.completion,
    },
    monitors: {
      freshnessReady: status === "ready",
      mappingReady: true,
      classificationReady: true,
      allReadOnlyMonitorsReady: status === "ready",
      mappingFamilies: 409,
      classificationMappedRows: 14622,
      classificationDistinctQuoteCodes: 14622,
      ...overrides.monitors,
    },
    diagnostics: {
      bidAskUsable: status === "ready",
      blockers: status === "stale" ? ["freshness_stale", "bid_ask_not_usable"] : [],
      latestQuote: {
        receivedAt: "2026-05-06 19:00:00.000",
        eventSource: "SKQuoteLib.OnNotifyQuoteLONG",
        message: "fixture",
        stockNo: "MXFFX999",
        stockName: "客小台現貨標的",
        close: "4113885",
        bid: status === "stale" ? "0" : "4113880",
        ask: status === "stale" ? "0" : "4113881",
        qty: "3",
      },
      ...overrides.diagnostics,
    },
    nextSafeTask:
      status === "stale"
        ? "等待 BrokerDesk 寫入更新的 quote event；不要登入、不要推進 StartIndex。"
        : "維持 heartbeat 健康檢查，不重跑全商品。",
    files: {
      dashboard: "",
      sourceDashboardPath: "",
      freshnessState: "",
      productMappingState: "",
      domesticOverseasState: "",
      ...overrides.files,
    },
    ...overrides,
  };
}

function baseLoopReport(status = "paper_intent_created", overrides = {}) {
  return {
    schema: "openclaw.capital.paper-automation-loop.v1",
    generatedAt: "2026-05-06T19:00:00.000Z",
    provider: "capital",
    mode: "paper",
    readOnlyQuoteOnly: true,
    loginAttempted: false,
    liveTradingEnabled: false,
    writeTradingEnabled: false,
    brokerOrderPathEnabled: false,
    hftLikeAutomation: true,
    status,
    pump: {
      status: "fresh",
      ready: true,
      quote: {
        stockNo: "MXFFX999",
        stockName: "客小台現貨標的",
        eventSource: "SKQuoteLib.OnNotifyQuoteLONG",
        receivedAt: "2026-05-06 19:00:00.000",
        ageSeconds: 1,
        freshness: "fresh",
        close: "4113885",
        bid: "4113880",
        ask: "4113881",
        qty: "3",
      },
    },
    architecture: {
      status: "passed",
      passed: 38,
      failed: 0,
      eventType: "capital.quote.ready",
      strategyGateReady: true,
    },
    readiness: {
      status: "ready",
      ready: true,
      failed: 0,
      quoteAgeSeconds: 1,
      maxQuoteAgeSeconds: 2,
      latestStock: "MXFFX999",
    },
    trading: {
      cycleId: "capital-paper-TEST",
      status,
      reason: "fixture",
      paperIntentCreated: status === "paper_intent_created",
      paperIntentId: status === "paper_intent_created" ? "capital-paper-TEST-intent" : "",
      quote: {
        stockNo: "MXFFX999",
        close: 41138.85,
        bid: 41138.8,
        ask: 41138.81,
        qty: 3,
      },
    },
    learning: {
      status: "candidate",
      paperEligible: false,
      liveEligible: false,
      counters: {
        totalCycles: 8,
        paperIntents: 1,
        readinessBlocks: 0,
        quoteBlocks: 0,
        consecutiveReadinessBlocks: 0,
        consecutiveReadyCycles: 1,
      },
    },
    files: {
      reportPath: "",
      streamPath: "",
      pumpReportPath: "",
      quoteStatePath: "",
      quoteStatusPath: "",
      runtimeEventPath: "",
      architectureReportPath: "",
      readinessPath: "",
      tradingCyclePath: "",
      paperIntentPath: "",
      learningRegistryPath: "",
      learningSummaryPath: "",
      ...overrides.files,
    },
    nextSafeTask:
      status === "paper_intent_created"
        ? "持續由 heartbeat 重跑 brokerdesk:paper-loop；累積 paper learning，不啟用真實下單。"
        : "維持 paper-only learning，等待新的 SKQuoteLib quote callback 後再評估。",
    ...overrides,
  };
}

function baseLearningSummary(status = "candidate", overrides = {}) {
  return {
    schema: "openclaw.capital.paper-learning-summary.v1",
    generatedAt: "2026-05-06T19:00:00.000Z",
    provider: "capital",
    mode: "paper",
    readOnlyQuoteOnly: true,
    loginAttempted: false,
    liveTradingEnabled: false,
    writeTradingEnabled: false,
    brokerOrderPathEnabled: false,
    hftLikeAutomation: true,
    status,
    strategyName: "capital-paper-microstructure-probe",
    paperEligible: false,
    liveEligible: false,
    registry: {
      status,
      paperEligible: false,
      liveEligible: false,
      rules: {
        status: "candidate",
        minReadyCyclesForPaper: 20,
        blockAfterConsecutiveReadinessBlocks: 20,
        promoteLiveAutomatically: false,
      },
      counters: {
        totalCycles: 8,
        paperIntents: 1,
        readinessBlocks: 0,
        quoteBlocks: 0,
        consecutiveReadinessBlocks: 0,
        consecutiveReadyCycles: 1,
      },
      lastObservation: {
        generatedAt: "2026-05-06T19:00:00.000Z",
        cycleId: "capital-paper-TEST",
        status: "paper_intent_created",
        reason: "fixture",
        latestStock: "MXFFX999",
        quoteAgeSeconds: 1,
        paperIntentId: "capital-paper-TEST-intent",
      },
    },
    summary: {
      totalCycles: 8,
      paperIntents: 1,
      readinessBlocks: 0,
      quoteBlocks: 0,
      consecutiveReadinessBlocks: 0,
      consecutiveReadyCycles: 1,
      minReadyCyclesForPaper: 20,
      blockAfterConsecutiveReadinessBlocks: 20,
      latestCycleId: "capital-paper-TEST",
      latestCycleStatus: "paper_intent_created",
      latestReason: "fixture",
      latestQuoteAgeSeconds: 1,
      latestPaperIntentId: "capital-paper-TEST-intent",
    },
    recommendation: {
      nextSafeTask: "持續由 heartbeat 重跑 brokerdesk:paper-loop；累積 paper learning，不啟用真實下單。",
    },
    files: {
      registryPath: "",
      reportPath: "",
      ...overrides.files,
    },
    ...overrides,
  };
}

function basePromotionGate(status = "blocked", overrides = {}) {
  return {
    schema: "openclaw.capital.paper-promotion-gate.v1",
    generatedAt: "2026-05-06T19:00:00.000Z",
    provider: "capital",
    mode: "paper",
    readOnlyQuoteOnly: true,
    loginAttempted: false,
    liveTradingEnabled: false,
    writeTradingEnabled: false,
    brokerOrderPathEnabled: false,
    hftLikeAutomation: true,
    status,
    promoted: false,
    summary: {
      status: "candidate",
      paperEligible: false,
      liveEligible: false,
      consecutiveReadyCycles: 1,
      minReadyCyclesForPaper: 20,
      consecutiveReadinessBlocks: 0,
      blockAfterConsecutiveReadinessBlocks: 20,
      latestCycleId: "capital-paper-TEST",
      latestReason: "fixture",
      latestQuoteAgeSeconds: 1,
      ...overrides.summary,
    },
    recommendation: {
      nextSafeTask: "維持 paper-only learning，等待新的 SKQuoteLib quote callback 後再評估。",
      ...overrides.recommendation,
    },
    checks: [
      {
        id: "promotion:summary-present",
        status: "pass",
        message: "Learning summary exists",
        evidence: { summaryPath: "fixture" },
      },
    ],
    files: {
      summaryPath: "",
      reportPath: "",
      registryPath: "",
      ...overrides.files,
    },
    ...overrides,
  };
}

function baseCronCheck(status = "passed", overrides = {}) {
  return {
    schema: "openclaw.capital.paper-cron-job-check.v1",
    generatedAt: "2026-05-06T19:00:00.000Z",
    status,
    readOnly: true,
    loginAttempted: false,
    liveTradingEnabled: false,
    writeTradingEnabled: false,
    brokerOrderPathEnabled: false,
    summary: {
      passed: 16,
      failed: 0,
      jobId: "fixture",
      enabled: true,
      nextRunAtMs: 1778093962521,
      nextRunAt: "2026-05-06T18:59:22.521Z",
      due: false,
      lastRunStatus: "ok",
      triggerStatus: "idle_duplicate_quote",
      quoteIsNew: false,
      quoteFresh: true,
      quoteAgeSeconds: 11175,
      bidAskUsable: false,
      burstStatus: "",
      paperIntents: 1,
      reason: "fixture",
      ...overrides.summary,
    },
    checks: [
      {
        id: "cron:single-job",
        status: "pass",
        message: "Exactly one Capital paper HFT trigger cron job exists",
        evidence: { count: 1, jobIds: ["fixture"] },
      },
    ],
    files: {
      jobsPath: "",
      statePath: "",
      triggerReportPath: "",
      reportPath: "",
      ...overrides.files,
    },
    nextSafeTask: "等待下一筆新的 SKQuoteLib quote callback，再查 trigger report 是否執行 burst。",
    ...overrides,
  };
}

const tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), "openclaw-capital-paper-assistant-"));
const quoteStatusPath = path.join(tempRoot, ".openclaw", "quote", "capital-quote-status.json");
const loopReportPath = path.join(
  tempRoot,
  ".openclaw",
  "trading",
  "capital-paper-automation-loop-latest.json",
);
const learningSummaryPath = path.join(
  tempRoot,
  ".openclaw",
  "trading",
  "capital-paper-learning-summary.json",
);
const promotionGatePath = path.join(
  tempRoot,
  ".openclaw",
  "trading",
  "capital-paper-promotion-gate.json",
);
const cronCheckPath = path.join(
  tempRoot,
  ".openclaw",
  "trading",
  "capital-paper-cron-job-check.json",
);

await writeJson(quoteStatusPath, baseQuoteStatus("ready"));
await writeJson(loopReportPath, baseLoopReport("paper_intent_created"));
await writeJson(learningSummaryPath, baseLearningSummary("candidate"));
await writeJson(promotionGatePath, basePromotionGate("blocked"));
await writeJson(cronCheckPath, baseCronCheck("passed"));

const fresh = await readCapitalPaperAssistantState({ repoRoot: tempRoot });
if (fresh.report.schema !== "openclaw.capital.paper-assistant-state.v1") {
  throw new Error(`unexpected schema: ${fresh.report.schema}`);
}
if (!Object.is(fresh.report.ready, true)) {
  throw new Error(`expected ready assistant state, got ${JSON.stringify(fresh.report)}`);
}
if (fresh.report.status !== "paper_intent_created") {
  throw new Error(`expected paper_intent_created status, got ${fresh.report.status}`);
}
if (!fresh.report.recommendation.nextSafeTask.includes("paper-loop")) {
  throw new Error("assistant recommendation must keep paper loop running");
}
if (
  !Object.is(fresh.report.readOnlyQuoteOnly, true) ||
  !Object.is(fresh.report.loginAttempted, false) ||
  !Object.is(fresh.report.liveTradingEnabled, false) ||
  !Object.is(fresh.report.writeTradingEnabled, false) ||
  !Object.is(fresh.report.brokerOrderPathEnabled, false)
) {
  throw new Error("assistant state must stay read-only and no-trading");
}

const outputPath = path.join(tempRoot, ".openclaw", "ui", "capital-paper-assistant-state.json");
await writeCapitalPaperAssistantState(fresh.report, outputPath);
await fs.access(outputPath);
await fs.access(`${outputPath}.sha256`);

await writeJson(quoteStatusPath, baseQuoteStatus("stale"));
const stale = await readCapitalPaperAssistantState({ repoRoot: tempRoot });
if (stale.report.status !== "blocked_quote_stale") {
  throw new Error(`expected stale quote blocking, got ${stale.report.status}`);
}
if (stale.report.ready) {
  throw new Error("stale assistant state must not be ready");
}
if (!stale.report.assistant.operatorAction.includes("SKQuoteLib quote callback")) {
  throw new Error("stale operator action must point to quote callback refresh");
}
if (!Array.isArray(stale.report.assistant.entrypoints)) {
  throw new Error("stale assistant state must expose entrypoints");
}
if (!stale.report.assistant.entrypoints.includes("pnpm brokerdesk:auto-trading")) {
  throw new Error("stale assistant state must expose auto-trading entrypoint");
}
if (!stale.report.assistant.entrypoints.includes("pnpm brokerdesk:auto-trading-loop")) {
  throw new Error("stale assistant state must expose auto-trading-loop entrypoint");
}
if (!Array.isArray(stale.report.quote.diagnostics.blockers)) {
  throw new Error("stale assistant state must expose quote blockers");
}
if (!stale.report.quote.diagnostics.blockers.includes("freshness_stale")) {
  throw new Error("stale assistant state must flag freshness_stale blocker");
}
if (!stale.report.quote.diagnostics.blockers.includes("bid_ask_not_usable")) {
  throw new Error("stale assistant state must flag bid_ask_not_usable blocker");
}

const built = buildCapitalPaperAssistantState({
  quoteStatus: baseQuoteStatus("ready"),
  loopReport: baseLoopReport("paper_intent_created"),
  learningSummary: baseLearningSummary("candidate"),
  promotionGate: basePromotionGate("blocked"),
  cronCheck: baseCronCheck("passed"),
});
if (built.summary.quoteStatus !== "ready" || built.summary.cronStatus !== "passed") {
  throw new Error("assistant summary must expose source gate statuses");
}

process.stdout.write("CAPITAL_PAPER_ASSISTANT_STATE_CHECK=OK\n");



