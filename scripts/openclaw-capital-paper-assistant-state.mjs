import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

function defaultQuoteStatusPath(repoRoot) {
  return path.join(repoRoot, ".openclaw", "quote", "capital-quote-status.json");
}

function defaultLoopReportPath(repoRoot) {
  return path.join(repoRoot, ".openclaw", "trading", "capital-paper-automation-loop-latest.json");
}

function defaultLearningSummaryPath(repoRoot) {
  return path.join(repoRoot, ".openclaw", "trading", "capital-paper-learning-summary.json");
}

function defaultPromotionGatePath(repoRoot) {
  return path.join(repoRoot, ".openclaw", "trading", "capital-paper-promotion-gate.json");
}

function defaultCronCheckPath(repoRoot) {
  return path.join(repoRoot, ".openclaw", "trading", "capital-paper-cron-job-check.json");
}

function defaultTickDiagnosticPath(repoRoot) {
  return path.join(repoRoot, ".openclaw", "quote", "capital-tick-diagnostic.json");
}

function defaultStartupStatePath(repoRoot) {
  return path.join(repoRoot, ".openclaw", "ui", "auto-trading-watch-startup-state.json");
}

function defaultServiceStatePath(repoRoot) {
  return path.join(repoRoot, ".openclaw", "service", "auto-trading-watch-service.json");
}

function defaultOutputPath(repoRoot) {
  return path.join(repoRoot, ".openclaw", "ui", "capital-paper-assistant-state.json");
}

function sha256Text(text) {
  return crypto.createHash("sha256").update(text).digest("hex").toUpperCase();
}

async function readJson(filePath, label) {
  try {
    return JSON.parse(await fs.readFile(filePath, "utf8"));
  } catch (error) {
    if (error?.code === "ENOENT") {
      throw new Error(`${label} not found: ${filePath}`, { cause: error });
    }
    throw new Error(
      `Invalid ${label} JSON: ${filePath}: ${
        error instanceof Error ? error.message : String(error)
      }`,
      { cause: error },
    );
  }
}

async function readOptionalJson(filePath, fallback) {
  try {
    return JSON.parse(await fs.readFile(filePath, "utf8"));
  } catch (error) {
    if (error?.code === "ENOENT") {
      return fallback;
    }
    throw error;
  }
}

async function writeJsonWithSha(filePath, value) {
  const text = `${JSON.stringify(value, null, 2)}\n`;
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, text, "utf8");
  await fs.writeFile(`${filePath}.sha256`, `${sha256Text(text)}\n`, "ascii");
}

function bool(value) {
  return value === true;
}

function numberOr(value, fallback = 0) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : fallback;
}

function stringOr(value, fallback = "") {
  return typeof value === "string" ? value : fallback;
}

function badgeForStatus(status) {
  switch (status) {
    case "blocked_1115":
      return {
        tone: "danger",
        label: "1115 冷卻中",
        title: "類高頻自動交易助手 cooldown active",
        description: "禁止登入、禁止推進 StartIndex，只更新 OpenClaw 狀態。",
      };
    case "blocked_quote_stale":
      return {
        tone: "warning",
        label: "報價過期 STALE",
        title: "類高頻自動交易助手 freshness gate 未通過",
        description: "等待新的 SKQuoteLib quote callback，不要使用舊報價。",
      };
    case "blocked_quote_incomplete":
      return {
        tone: "warning",
        label: "報價未完成",
        title: "類高頻自動交易助手輪替尚未完成",
        description: "只允許執行一個 read-only market-aligned window。",
      };
    case "blocked_quote_guard":
      return {
        tone: "danger",
        label: "報價阻塞 BLOCKED",
        title: "類高頻自動交易助手 guard active",
        description: "先查 guard / 錯誤原因，只更新 OpenClaw 狀態。",
      };
    case "paper_intent_created":
      return {
        tone: "success",
        label: "紙上擬態已產生",
        title: "類高頻自動交易助手 paper intent created",
        description: "已產生 paper intent，維持 paper-only loop，不啟用真實下單。",
      };
    case "paper_promotion_review":
      return {
        tone: "success",
        label: "可進 promotion review",
        title: "類高頻自動交易助手 promotion review ready",
        description: "已達 paper promotion review 門檻，保持 read-only。",
      };
    case "paper_ready":
      return {
        tone: "success",
        label: "類高頻助手就緒",
        title: "類高頻自動交易助手 ready",
        description: "類高頻自動交易助手可持續運行，維持 heartbeat 檢查。",
      };
    default:
      return {
        tone: "neutral",
        label: "類高頻 learning 中",
        title: "類高頻自動交易學習",
        description: "維持 paper-only learning，等待新的 SKQuoteLib quote callback 後再評估。",
      };
  }
}

function determineStatus({ quoteStatus, loopReport, learningSummary, promotionGate, cronCheck }) {
  const quoteState = stringOr(quoteStatus?.status, "degraded");
  if (bool(quoteStatus?.guard?.active) && stringOr(quoteStatus?.guard?.lastCode, "") === "1115") {
    return "blocked_1115";
  }
  if (quoteState === "stale") {
    return "blocked_quote_stale";
  }
  if (quoteState === "incomplete") {
    return "blocked_quote_incomplete";
  }
  if (quoteState === "blocked") {
    return "blocked_quote_guard";
  }
  if (stringOr(loopReport?.status, "") === "paper_intent_created") {
    return "paper_intent_created";
  }
  if (bool(promotionGate?.promoted) || stringOr(learningSummary?.status, "") === "approved_paper") {
    return "paper_promotion_review";
  }
  if (
    quoteStatus?.ready === true &&
    bool(quoteStatus?.monitors?.allReadOnlyMonitorsReady) &&
    stringOr(cronCheck?.status, "") === "passed"
  ) {
    return "paper_ready";
  }
  return "paper_learning";
}

function operatorActionForStatus(status, sources) {
  switch (status) {
    case "blocked_1115":
      return sources.quoteStatus?.nextSafeTask || "等待 guard cooldown 到期；禁止登入與 StartIndex 推進。";
    case "blocked_quote_stale": {
      const blockers = Array.isArray(sources.quoteStatus?.diagnostics?.blockers)
        ? sources.quoteStatus.diagnostics.blockers
        : [];
      const blockerText = blockers.length > 0 ? `（${blockers.join("、")}）` : "";
      return `等待新的 SKQuoteLib quote callback；不要登入、不要推進 StartIndex。${blockerText}`;
    }
    case "blocked_quote_incomplete":
      return sources.quoteStatus?.nextSafeTask || "只執行一個 read-only market-aligned window。";
    case "blocked_quote_guard":
      return sources.quoteStatus?.nextSafeTask || "先查 guard / 錯誤原因，只更新 OpenClaw 狀態。";
    case "paper_intent_created":
      return (
        sources.loopReport?.nextSafeTask ||
        "持續由 heartbeat 重跑 brokerdesk:paper-loop；累積 paper learning，不啟用真實下單。"
      );
    case "paper_promotion_review":
      return (
        sources.promotionGate?.recommendation?.nextSafeTask ||
        "進入 paper promotion review，確認可否由人工審查升級。"
      );
    case "paper_ready":
      return sources.quoteStatus?.nextSafeTask || "維持 heartbeat 健康檢查，不重跑全商品。";
    default:
      return (
        sources.learningSummary?.recommendation?.nextSafeTask ||
        sources.quoteStatus?.nextSafeTask ||
        "維持 paper-only learning，等待新的 SKQuoteLib quote callback 後再評估。"
      );
  }
}

function chooseNextSafeTask(status, sources) {
  switch (status) {
    case "blocked_1115":
    case "blocked_quote_stale":
    case "blocked_quote_incomplete":
    case "blocked_quote_guard":
      return (
        sources.quoteStatus?.nextSafeTask ||
        sources.loopReport?.nextSafeTask ||
        "等待新的 SKQuoteLib quote callback，不要登入、不要推進 StartIndex。"
      );
    case "paper_intent_created":
      return (
        sources.loopReport?.nextSafeTask ||
        sources.learningSummary?.recommendation?.nextSafeTask ||
        "持續由 heartbeat 重跑 brokerdesk:paper-loop。"
      );
    case "paper_promotion_review":
      return (
        sources.promotionGate?.recommendation?.nextSafeTask ||
        sources.learningSummary?.recommendation?.nextSafeTask ||
        "進入 paper promotion review。"
      );
    case "paper_ready":
      return sources.quoteStatus?.nextSafeTask || "維持 heartbeat 健康檢查，不重跑全商品。";
    default:
      return (
        sources.learningSummary?.recommendation?.nextSafeTask ||
        sources.quoteStatus?.nextSafeTask ||
        "維持 paper-only learning，等待新的 SKQuoteLib quote callback 後再評估。"
      );
  }
}

function buildControlSummary({
  quoteStatus,
  loopReport,
  learningSummary,
  promotionGate,
  cronCheck,
  tickDiagnostic,
  status,
  ready,
}) {
  return {
    quoteStatus: stringOr(quoteStatus?.status, ""),
    loopStatus: stringOr(loopReport?.status, ""),
    learningStatus: stringOr(learningSummary?.status, ""),
    promotionStatus: stringOr(promotionGate?.status, ""),
    cronStatus: stringOr(cronCheck?.status, ""),
    quoteFreshnessStatus: stringOr(quoteStatus?.quoteProof?.freshnessStatus, ""),
    quoteAgeSeconds: numberOr(quoteStatus?.quoteProof?.freshnessAgeSeconds, -1),
    latestStock: stringOr(quoteStatus?.quoteProof?.latestStock, ""),
    nextStartIndex: numberOr(quoteStatus?.completion?.nextStartIndex, 0),
    paperIntents: numberOr(
      learningSummary?.summary?.paperIntents ?? loopReport?.learning?.counters?.paperIntents,
      0,
    ),
    consecutiveReadyCycles: numberOr(learningSummary?.summary?.consecutiveReadyCycles, 0),
    consecutiveReadinessBlocks: numberOr(
      learningSummary?.summary?.consecutiveReadinessBlocks,
      0,
    ),
    paperEligible: bool(learningSummary?.paperEligible),
    promoted: bool(promotionGate?.promoted),
    allReadOnlyMonitorsReady: bool(quoteStatus?.monitors?.allReadOnlyMonitorsReady),
    quoteReady: bool(quoteStatus?.ready),
    cronDue: bool(cronCheck?.summary?.due),
    tickStatus: stringOr(tickDiagnostic?.status, ""),
    tickMonitorRunning: bool(tickDiagnostic?.tick?.monitorRunning),
    tickRealtimeRunning: bool(tickDiagnostic?.tick?.realtimeRunning),
    assistantReady: ready,
    assistantStatus: status,
    entrySide: stringOr(learningSummary?.execution?.entry?.side, ""),
    exitSide: stringOr(learningSummary?.execution?.exit?.side, ""),
    entryAction: stringOr(learningSummary?.execution?.entry?.action, ""),
    exitAction: stringOr(learningSummary?.execution?.exit?.action, ""),
  };
}

export function buildCapitalPaperAssistantState({
  quoteStatus = {},
  loopReport = {},
  learningSummary = {},
  promotionGate = {},
  cronCheck = {},
  tickDiagnostic = {},
  files = {},
}) {
  const status = determineStatus({
    quoteStatus,
    loopReport,
    learningSummary,
    promotionGate,
    cronCheck,
    tickDiagnostic,
  });
  const badge = badgeForStatus(status);
  const ready =
    quoteStatus?.ready === true &&
    bool(quoteStatus?.monitors?.allReadOnlyMonitorsReady) &&
    stringOr(cronCheck?.status, "") === "passed";
  const nextSafeTask = chooseNextSafeTask(status, {
    quoteStatus,
    loopReport,
    learningSummary,
      promotionGate,
      cronCheck,
      tickDiagnostic,
    });

  return {
    schema: "openclaw.capital.paper-assistant-state.v1",
    generatedAt: new Date().toISOString(),
    provider: "capital",
    mode: "paper",
    readOnlyQuoteOnly: true,
    loginAttempted: false,
    liveTradingEnabled: false,
    writeTradingEnabled: false,
    brokerOrderPathEnabled: false,
    hftLikeAutomation: true,
    status,
    ready,
    badge,
    assistant: {
      name: "類高頻自動交易助手",
      title: badge.title,
      description: badge.description,
      operatorAction: operatorActionForStatus(status, {
        quoteStatus,
        loopReport,
        learningSummary,
        promotionGate,
        cronCheck,
      }),
      entrypoints: [
        "pnpm brokerdesk:auto-trading",
        "pnpm brokerdesk:auto-trading-loop",
        "pnpm brokerdesk:auto-trading-watch",
        "pnpm brokerdesk:auto-trading-watch:daemon",
        "pnpm brokerdesk:auto-trading-watch:daemon-check",
        "pnpm brokerdesk:auto-trading-watch:startup-install",
        "pnpm brokerdesk:auto-trading-watch:startup-check",
      ],
    },
    execution: {
      status: stringOr(learningSummary?.execution?.status, ""),
      signalPolicy: stringOr(learningSummary?.execution?.signalPolicy, ""),
      entry: {
        side: stringOr(learningSummary?.execution?.entry?.side, ""),
        style: stringOr(learningSummary?.execution?.entry?.style, ""),
        trigger: stringOr(learningSummary?.execution?.entry?.trigger, ""),
        referencePrice: stringOr(learningSummary?.execution?.entry?.referencePrice, ""),
        action: stringOr(learningSummary?.execution?.entry?.action, ""),
        price: numberOr(learningSummary?.execution?.entry?.price, -1),
        ready: bool(learningSummary?.execution?.entry?.ready),
      },
      exit: {
        side: stringOr(learningSummary?.execution?.exit?.side, ""),
        style: stringOr(learningSummary?.execution?.exit?.style, ""),
        trigger: stringOr(learningSummary?.execution?.exit?.trigger, ""),
        referencePrice: stringOr(learningSummary?.execution?.exit?.referencePrice, ""),
        action: stringOr(learningSummary?.execution?.exit?.action, ""),
        price: numberOr(learningSummary?.execution?.exit?.price, -1),
        ready: bool(learningSummary?.execution?.exit?.ready),
      },
      actionSummary: stringOr(learningSummary?.execution?.actionSummary, ""),
      paperIntentCreated: bool(learningSummary?.execution?.paperIntentCreated),
    },
    summary: buildControlSummary({
      quoteStatus,
      loopReport,
      learningSummary,
      promotionGate,
      cronCheck,
      tickDiagnostic,
      status,
      ready,
    }),
    quote: {
      status: stringOr(quoteStatus?.status, ""),
      ready: bool(quoteStatus?.ready),
      freshnessStatus: stringOr(quoteStatus?.quoteProof?.freshnessStatus, ""),
      freshnessAgeSeconds: numberOr(quoteStatus?.quoteProof?.freshnessAgeSeconds, -1),
      latestStock: stringOr(quoteStatus?.quoteProof?.latestStock, ""),
      latestStockName: stringOr(quoteStatus?.quoteProof?.latestStockName, ""),
      allReadOnlyMonitorsReady: bool(quoteStatus?.monitors?.allReadOnlyMonitorsReady),
      nextStartIndex: numberOr(quoteStatus?.completion?.nextStartIndex, 0),
      guardActive: bool(quoteStatus?.guard?.active),
      guardCode: stringOr(quoteStatus?.guard?.lastCode, ""),
      diagnostics: {
        bidAskUsable: bool(quoteStatus?.diagnostics?.bidAskUsable),
        blockers: Array.isArray(quoteStatus?.diagnostics?.blockers)
          ? quoteStatus.diagnostics.blockers
          : [],
        latestQuote: quoteStatus?.diagnostics?.latestQuote ?? {},
      },
    },
    loop: {
      status: stringOr(loopReport?.status, ""),
      ready: bool(loopReport?.readiness?.ready),
      paperIntentCreated: bool(loopReport?.trading?.paperIntentCreated),
      paperIntentId: stringOr(loopReport?.trading?.paperIntentId, ""),
      nextSafeTask: stringOr(loopReport?.nextSafeTask, ""),
    },
    learning: {
      status: stringOr(learningSummary?.status, ""),
      paperEligible: bool(learningSummary?.paperEligible),
      liveEligible: bool(learningSummary?.liveEligible),
      consecutiveReadyCycles: numberOr(learningSummary?.summary?.consecutiveReadyCycles, 0),
      consecutiveReadinessBlocks: numberOr(
        learningSummary?.summary?.consecutiveReadinessBlocks,
        0,
      ),
      nextSafeTask: stringOr(learningSummary?.recommendation?.nextSafeTask, ""),
    },
    promotion: {
      status: stringOr(promotionGate?.status, ""),
      promoted: bool(promotionGate?.promoted),
      nextSafeTask: stringOr(promotionGate?.recommendation?.nextSafeTask, ""),
    },
    cron: {
      status: stringOr(cronCheck?.status, ""),
      enabled: bool(cronCheck?.summary?.enabled),
      due: bool(cronCheck?.summary?.due),
      lastRunStatus: stringOr(cronCheck?.summary?.lastRunStatus, ""),
      nextSafeTask: stringOr(cronCheck?.nextSafeTask, ""),
    },
    tick: {
      status: stringOr(tickDiagnostic?.status, ""),
      monitorRunning: bool(tickDiagnostic?.tick?.monitorRunning),
      realtimeRunning: bool(tickDiagnostic?.tick?.realtimeRunning),
      latestCallbackAt: stringOr(tickDiagnostic?.latestCallback?.receivedAt, ""),
      latestCallbackSource: stringOr(tickDiagnostic?.latestCallback?.eventSource, ""),
      latestCallbackBid: stringOr(tickDiagnostic?.latestCallback?.bid, ""),
      latestCallbackAsk: stringOr(tickDiagnostic?.latestCallback?.ask, ""),
      nextSafeTask: stringOr(tickDiagnostic?.recommendation?.nextSafeTask, ""),
    },
    recommendation: {
      nextSafeTask,
    },
    files: {
      quoteStatusPath: stringOr(files.quoteStatusPath, ""),
      loopReportPath: stringOr(files.loopReportPath, ""),
      learningSummaryPath: stringOr(files.learningSummaryPath, ""),
      promotionGatePath: stringOr(files.promotionGatePath, ""),
      cronCheckPath: stringOr(files.cronCheckPath, ""),
      tickDiagnosticPath: stringOr(files.tickDiagnosticPath, ""),
      startupStatePath: stringOr(files.startupStatePath, ""),
      serviceStatePath: stringOr(files.serviceStatePath, ""),
      reportPath: stringOr(files.reportPath, ""),
    },
  };
}

export async function writeCapitalPaperAssistantState(report, reportPath) {
  await writeJsonWithSha(reportPath, report);
}

export async function readCapitalPaperAssistantState(options = {}) {
  const repoRoot = path.resolve(options.repoRoot || process.cwd());
  const quoteStatusPath = path.resolve(
    options.quoteStatusPath || defaultQuoteStatusPath(repoRoot),
  );
  const loopReportPath = path.resolve(options.loopReportPath || defaultLoopReportPath(repoRoot));
  const learningSummaryPath = path.resolve(
    options.learningSummaryPath || defaultLearningSummaryPath(repoRoot),
  );
  const promotionGatePath = path.resolve(
    options.promotionGatePath || defaultPromotionGatePath(repoRoot),
  );
  const cronCheckPath = path.resolve(options.cronCheckPath || defaultCronCheckPath(repoRoot));
  const tickDiagnosticPath = path.resolve(
    options.tickDiagnosticPath || defaultTickDiagnosticPath(repoRoot),
  );
  const startupStatePath = path.resolve(
    options.startupStatePath || defaultStartupStatePath(repoRoot),
  );
  const serviceStatePath = path.resolve(
    options.serviceStatePath || defaultServiceStatePath(repoRoot),
  );
  const reportPath = path.resolve(options.reportPath || defaultOutputPath(repoRoot));

  const [quoteStatus, loopReport, learningSummary, promotionGate, cronCheck, tickDiagnostic] =
    await Promise.all([
    readJson(quoteStatusPath, "Capital quote status"),
    readJson(loopReportPath, "Capital paper automation loop"),
    readJson(learningSummaryPath, "Capital paper learning summary"),
    readOptionalJson(promotionGatePath, {}),
    readOptionalJson(cronCheckPath, {}),
      readOptionalJson(tickDiagnosticPath, {}),
    ]);

  const report = buildCapitalPaperAssistantState({
    quoteStatus,
    loopReport,
    learningSummary,
    promotionGate,
    cronCheck,
    tickDiagnostic,
    files: {
      quoteStatusPath,
      loopReportPath,
      learningSummaryPath,
      promotionGatePath,
      cronCheckPath,
      tickDiagnosticPath,
      startupStatePath,
      serviceStatePath,
      reportPath,
    },
  });

  return {
    report,
    files: {
      quoteStatusPath,
      loopReportPath,
      learningSummaryPath,
      promotionGatePath,
      cronCheckPath,
      tickDiagnosticPath,
      startupStatePath,
      serviceStatePath,
      reportPath,
    },
  };
}

export async function runCapitalPaperAssistantState(options = {}) {
  const repoRoot = path.resolve(options.repoRoot || process.cwd());
  const reportPath = path.resolve(options.reportPath || defaultOutputPath(repoRoot));
  const result = await readCapitalPaperAssistantState({
    ...options,
    repoRoot,
    reportPath,
  });
  if (options.writeState) {
    await writeCapitalPaperAssistantState(result.report, reportPath);
  }
  if (!options.silent) {
    if (options.json) {
      process.stdout.write(`${JSON.stringify(result.report, null, 2)}\n`);
    } else {
      process.stdout.write(
        [
    "OpenClaw 類高頻自動交易助手 state",
          `status=${result.report.status}`,
          `ready=${result.report.ready}`,
          `badge=${result.report.badge.label}`,
          `nextSafeTask=${result.report.recommendation.nextSafeTask}`,
          options.writeState ? `report=${reportPath}` : "",
        ]
          .filter(Boolean)
          .join("\n") + "\n",
      );
    }
  }
  return result;
}

function parseArgs(argv) {
  const options = {
    repoRoot: process.cwd(),
    quoteStatusPath: "",
    loopReportPath: "",
    learningSummaryPath: "",
    promotionGatePath: "",
    cronCheckPath: "",
    reportPath: "",
    json: false,
    writeState: false,
    silent: false,
    requireReady: false,
  };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--repo-root") {
      options.repoRoot = argv[++index] ?? options.repoRoot;
    } else if (arg.startsWith("--repo-root=")) {
      options.repoRoot = arg.slice("--repo-root=".length);
    } else if (arg === "--quote-status") {
      options.quoteStatusPath = argv[++index] ?? options.quoteStatusPath;
    } else if (arg.startsWith("--quote-status=")) {
      options.quoteStatusPath = arg.slice("--quote-status=".length);
    } else if (arg === "--loop-report") {
      options.loopReportPath = argv[++index] ?? options.loopReportPath;
    } else if (arg.startsWith("--loop-report=")) {
      options.loopReportPath = arg.slice("--loop-report=".length);
    } else if (arg === "--learning-summary") {
      options.learningSummaryPath = argv[++index] ?? options.learningSummaryPath;
    } else if (arg.startsWith("--learning-summary=")) {
      options.learningSummaryPath = arg.slice("--learning-summary=".length);
    } else if (arg === "--promotion-gate") {
      options.promotionGatePath = argv[++index] ?? options.promotionGatePath;
    } else if (arg.startsWith("--promotion-gate=")) {
      options.promotionGatePath = arg.slice("--promotion-gate=".length);
    } else if (arg === "--cron-check") {
      options.cronCheckPath = argv[++index] ?? options.cronCheckPath;
    } else if (arg.startsWith("--cron-check=")) {
      options.cronCheckPath = arg.slice("--cron-check=".length);
    } else if (arg === "--report") {
      options.reportPath = argv[++index] ?? options.reportPath;
    } else if (arg.startsWith("--report=")) {
      options.reportPath = arg.slice("--report=".length);
    } else if (arg === "--json") {
      options.json = true;
    } else if (arg === "--write-state") {
      options.writeState = true;
    } else if (arg === "--silent") {
      options.silent = true;
    } else if (arg === "--require-ready") {
      options.requireReady = true;
    }
  }
  return options;
}

const invokedPath = process.argv[1] ? path.resolve(process.argv[1]) : "";
if (invokedPath === fileURLToPath(import.meta.url)) {
  const options = parseArgs(process.argv.slice(2));
  runCapitalPaperAssistantState(options)
    .then(({ report }) => {
      if (options.requireReady && !report.ready) {
        process.exitCode = 1;
      }
    })
    .catch((error) => {
      process.stderr.write(
      `capital 類高頻自動交易助手 state failed: ${
        error instanceof Error ? error.message : String(error)
      }\n`,
      );
      process.exitCode = 1;
    });
}







