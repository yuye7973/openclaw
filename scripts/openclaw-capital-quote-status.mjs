import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { readCapitalQuoteState } from "./openclaw-capital-quote-reader.mjs";
import { resolveBrokerDeskStateDir } from "./lib/brokerdesk-state-dir.mjs";

function defaultDashboardPath() {
  if (process.env.OPENCLAW_CAPITAL_QUOTE_DASHBOARD_PATH) {
    return process.env.OPENCLAW_CAPITAL_QUOTE_DASHBOARD_PATH;
  }
  if (process.platform === "win32") {
    return "D:\\OpenClaw\\.openclaw\\quote\\capital-automation-health-dashboard.json";
  }
  return path.resolve(".openclaw/quote/capital-automation-health-dashboard.json");
}

function defaultBrokerDeskStateDir(preferCanonical = false) {
  return resolveBrokerDeskStateDir({ preferCanonical });
}

function defaultMarketRegistryPath() {
  return process.env.OPENCLAW_CAPITAL_MARKET_REGISTRY_PATH || "D:\\OpenClawData\\trading\\global_futures_market_registry.json";
}

function defaultStrategyPath(repoRoot) {
  return path.join(repoRoot, "config", "capital-paper-microstructure-strategy.json");
}

function defaultOutputPath(repoRoot) {
  return path.join(repoRoot, ".openclaw", "quote", "capital-quote-status.json");
}

function sha256Text(text) {
  return crypto.createHash("sha256").update(text).digest("hex").toUpperCase();
}

async function readJson(filePath) {
  try {
    return JSON.parse((await fs.readFile(filePath, "utf8")).replace(/^\uFEFF/, ""));
  } catch (error) {
    if (error?.code === "ENOENT" || error?.code === "EISDIR" || error?.code === "ENOTDIR") {
      return null;
    }
    throw new Error(
      `Invalid Capital quote dashboard JSON: ${filePath}: ${
        error instanceof Error ? error.message : String(error)
      }`,
      { cause: error },
    );
  }
}

async function readJsonIfExists(filePath) {
  try {
    return JSON.parse((await fs.readFile(filePath, "utf8")).replace(/^\uFEFF/, ""));
  } catch (error) {
    if (error?.code === "ENOENT" || error?.code === "EISDIR" || error?.code === "ENOTDIR") {
      return null;
    }
    throw error;
  }
}

function bool(value) {
  return value === true;
}

function numberOr(value, fallback) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : fallback;
}

function stringOr(value, fallback = "") {
  return typeof value === "string" ? value : fallback;
}

function normalizeMarketCode(value) {
  return typeof value === "string" ? value.trim().toUpperCase() : "";
}

function normalizeStockNo(value) {
  return typeof value === "string" ? value.trim().toUpperCase() : "";
}

function normalizeTargetStockNos(values) {
  const seen = new Set();
  const normalized = [];
  for (const value of Array.isArray(values) ? values : []) {
    const candidate = normalizeStockNo(value);
    if (!candidate || seen.has(candidate)) {
      continue;
    }
    seen.add(candidate);
    normalized.push(candidate);
  }
  return normalized;
}

export function normalizeCapitalQuoteDashboard(dashboard, quoteState = null, options = {}) {
  const guardActive = bool(dashboard?.guard?.active ?? quoteState?.health?.brokerActionRequired);
  const queueCompleted = bool(
    dashboard?.readiness?.queueCompleted ?? dashboard?.brokerDeskQueue?.completed,
  );
  const openClawReady = bool(
    dashboard?.readiness?.openClawReady ?? dashboard?.openClawQueue?.ready,
  );
  const openClawCompleted = bool(
    dashboard?.readiness?.openClawCompleted ?? dashboard?.openClawQueue?.completed,
  );
  const freshnessReady = bool(dashboard?.readiness?.freshnessReady);
  const mappingReady = bool(dashboard?.readiness?.mappingReady);
  const classificationReady = bool(dashboard?.readiness?.classificationReady);
  const allReadOnlyMonitorsReady = bool(dashboard?.readiness?.allReadOnlyMonitorsReady);
  const freshnessStatus = stringOr(
    quoteState?.quoteEventFreshness,
    stringOr(dashboard?.quoteFreshness?.status, ""),
  );
  const freshnessAgeSeconds = numberOr(
    quoteState?.quoteEventAgeSeconds,
    numberOr(dashboard?.quoteFreshness?.ageSeconds, -1),
  );
  const maxFreshSeconds = numberOr(
    quoteState?.quoteEventFreshnessThresholdSeconds,
    numberOr(dashboard?.quoteFreshness?.maxFreshSeconds, 0),
  );
  const maxAllowedFreshAgeSeconds = numberOr(options.maxFreshAgeSeconds, maxFreshSeconds);
  const quoteProofStatus = stringOr(
    quoteState?.quoteProofStatus,
    stringOr(dashboard?.brokerDeskQueue?.quoteProofStatus, ""),
  );
  const quoteProofFreshness = stringOr(
    quoteState?.quoteEventFreshness,
    stringOr(dashboard?.brokerDeskQueue?.quoteProofFreshness, ""),
  );
  const lastCode = stringOr(dashboard?.guard?.lastCode, quoteState?.health?.currentBlockingCode);
  const lastRunStatus = stringOr(dashboard?.brokerDeskQueue?.lastRunStatus, "");
  const latestStock = stringOr(
    quoteState?.quote?.stockNo,
    stringOr(dashboard?.quoteFreshness?.latestStock, ""),
  );
  const latestStockName = stringOr(
    quoteState?.quote?.stockName,
    stringOr(dashboard?.quoteFreshness?.latestStockName, ""),
  );
  const bridgeReady = bool(quoteState?.health?.bridgeReady);
  const quoteReady = quoteState?.ready === true;

  let status = "degraded";
  let reason = "群益報價 dashboard 尚未達到完整 ready 條件。";
  if (guardActive || dashboard?.healthStatus === "cooldown") {
    status = lastCode === "1115" ? "blocked_1115" : "blocked";
    reason = "群益登入 guard/cooldown active；OpenClaw 不得登入或推進 StartIndex。";
  } else if (!queueCompleted) {
    status = "incomplete";
    reason = "群益全商品 read-only 報價輪替尚未完成。";
  } else if (freshnessStatus === "stale" || freshnessAgeSeconds > maxAllowedFreshAgeSeconds) {
    status = "stale";
    reason = "最新報價證明已超過 freshness gate；策略不得使用舊報價。";
  } else if (allReadOnlyMonitorsReady) {
    status = quoteReady && freshnessStatus === "fresh" ? "ready" : "stale";
    reason =
      status === "ready"
        ? "群益 read-only 報價、freshness、mapping、分類與 OpenClaw 狀態皆 ready。"
        : !bridgeReady
          ? "BrokerDesk bridge 尚未 connected 或 overallReady=false。"
          : "BrokerDesk quote state 尚未通過即時 freshness gate。";
  }

  const strategyGateReady = status === "ready" && freshnessStatus === "fresh" && quoteReady && bridgeReady;

  return {
    schema: "openclaw.capital.quote-status.v1",
    generatedAt: new Date().toISOString(),
    provider: "capital",
    source: quoteState ? "BrokerDesk quote state" : "BrokerDesk health dashboard",
    readOnly: true,
    loginAttempted: false,
    liveTradingEnabled: false,
    writeTradingEnabled: false,
    status,
    ready: status === "ready",
    reason,
    strategyGate: {
      ready: strategyGateReady,
      status: strategyGateReady ? "allow_read_only_strategy_context" : "deny_strategy_context",
      reason: strategyGateReady
        ? "freshness gate passed; quote state can be used as read-only strategy context."
        : reason,
    },
    guard: {
      active: guardActive,
      lastCode,
      nextAllowedAt: stringOr(dashboard?.guard?.nextAllowedAt, ""),
    },
        bridge: {
      status: stringOr(quoteState?.health?.bridgeStatus, stringOr(dashboard?.healthStatus, "")),
      ready: bridgeReady,
      overallReady: bool(quoteState?.health?.overallReady),
      quoteEventConfirmed: bool(quoteState?.health?.quoteEventConfirmed),
      lastHeartbeatAt: stringOr(quoteState?.health?.lastHeartbeatAt, ""),
      keepAliveUntil: stringOr(quoteState?.health?.keepAliveUntil, ""),
      brokerActionRequired: bool(quoteState?.health?.brokerActionRequired ?? dashboard?.guard?.active),
      currentBlockingCode: stringOr(
        quoteState?.health?.currentBlockingCode,
        stringOr(dashboard?.guard?.lastCode, ""),
      ),
      capitalAccountSet: bool(quoteState?.health?.capitalAccountSet),
      capitalAttempted: bool(quoteState?.health?.capitalAttempted),
      capitalMessage: stringOr(quoteState?.health?.capitalMessage, ""),
      lastLogin1115Historical: bool(
        quoteState?.health?.lastLogin1115Historical ?? dashboard?.health?.lastLogin1115Historical,
      ),
    },
    quoteProof: {
      status: quoteProofStatus,
      freshness: quoteProofFreshness,
      latestStock,
      latestStockName,
      freshnessStatus,
      freshnessAgeSeconds,
      maxFreshSeconds,
      maxAllowedFreshAgeSeconds,
    },
    completion: {
      queueCompleted,
      openClawReady,
      openClawCompleted,
      lastRunStatus,
      quoteUniverseCount: numberOr(dashboard?.brokerDeskQueue?.quoteUniverseCount, 0),
      distinctQuoteCodeCount: numberOr(dashboard?.brokerDeskQueue?.distinctQuoteCodeCount, 0),
      completionUniverseCount: numberOr(dashboard?.brokerDeskQueue?.completionUniverseCount, 0),
      completionBasis: stringOr(dashboard?.brokerDeskQueue?.completionBasis, ""),
      nextStartIndex: numberOr(dashboard?.brokerDeskQueue?.nextStartIndex, 0),
    },
    monitors: {
      freshnessReady,
      mappingReady,
      classificationReady,
      allReadOnlyMonitorsReady,
      mappingFamilies: numberOr(dashboard?.productMapping?.productFamilyRows, 0),
      classificationMappedRows: numberOr(
        dashboard?.domesticOverseasClassification?.mappingAppliedRows,
        0,
      ),
      classificationDistinctQuoteCodes: numberOr(
        dashboard?.domesticOverseasClassification?.distinctQuoteCodes,
        0,
      ),
    },
    nextSafeTask: stringOr(dashboard?.nextSafeTask, ""),
    files: {
      dashboard: stringOr(dashboard?.latestReports?.healthDashboard, ""),
      sourceDashboardPath: stringOr(options.dashboardPath, defaultDashboardPath()),
      sourceStateDir: stringOr(quoteState?.sourceStateDir, ""),
      freshnessState: stringOr(dashboard?.quoteFreshness?.path, ""),
      productMappingState: stringOr(dashboard?.productMapping?.path, ""),
      domesticOverseasState: stringOr(dashboard?.domesticOverseasClassification?.path, ""),
      latestQuoteEvent: stringOr(quoteState?.files?.latestQuoteEvent, ""),
      quoteEvents: stringOr(quoteState?.files?.quoteEvents, ""),
    },
    session: quoteState?.session ?? {
      marketSession: "",
      marketSessionLabel: "",
      tradingOpen: false,
    },
    quote: quoteState?.quote ?? {
      receivedAt: "",
      eventSource: "",
      stockNo: "",
      stockName: "",
      close: "",
      bid: "",
      ask: "",
      qty: "",
      message: "",
    },
    diagnostics: {
      selectedStock: quoteState?.selection ?? {
        targetStockNo: "",
        targetStockNos: [],
        marketCode: "",
        source: "",
        matched: false,
        selectedFromEventStream: false,
        latestOverallStockNo: "",
        latestOverallReceivedAt: "",
      },
      latestQuote: quoteState?.quote ?? {},
      bidAskUsable: quoteReady,
    },
  };
}

export async function readCapitalQuoteStatus(options = {}) {
  const dashboardPath = path.resolve(
    typeof options.dashboardPath === "string" && options.dashboardPath.trim().length > 0
      ? options.dashboardPath
      : defaultDashboardPath(),
  );
  const dashboard = (await readJson(dashboardPath)) ?? {};
  const repoRoot = path.resolve(options.repoRoot ?? process.cwd());
  const strategyPath = path.resolve(
    typeof options.strategyPath === "string" && options.strategyPath.trim().length > 0
      ? options.strategyPath
      : defaultStrategyPath(repoRoot),
  );
  const strategy = await readJsonIfExists(strategyPath);
  const resolvedMarketCode = (() => {
    const optionMarketCode = normalizeMarketCode(options.marketCode);
    if (optionMarketCode) {
      return optionMarketCode;
    }
    return stringOr(strategy?.marketCode, stringOr(strategy?.symbol, ""));
  })();
  const resolvedTargetStockNo = (() => {
    const optionTargetStockNo = normalizeStockNo(options.targetStockNo);
    if (optionTargetStockNo) {
      return optionTargetStockNo;
    }
    return stringOr(strategy?.targetStockNo, stringOr(strategy?.symbol, ""));
  })();
  const resolvedTargetStockNos = (() => {
    const optionTargets = Array.isArray(options.targetStockNos)
      ? normalizeTargetStockNos(options.targetStockNos)
      : [];
    if (optionTargets.length > 0) {
      return optionTargets;
    }
    if (Array.isArray(strategy?.targetStockNos) && strategy.targetStockNos.length > 0) {
      return normalizeTargetStockNos(strategy.targetStockNos);
    }
    return resolvedTargetStockNo ? [resolvedTargetStockNo] : [];
  })();
  const resolvedQuoteAliases = (() => {
    const optionAliases = Array.isArray(options.quoteAliases)
      ? normalizeTargetStockNos(options.quoteAliases)
      : [];
    if (optionAliases.length > 0) {
      return optionAliases;
    }
    if (Array.isArray(strategy?.quoteAliases) && strategy.quoteAliases.length > 0) {
      return normalizeTargetStockNos(strategy.quoteAliases);
    }
    return resolvedTargetStockNos;
  })();
  const stateDir = path.resolve(
    typeof options.stateDir === "string" && options.stateDir.trim().length > 0
      ? options.stateDir
      : defaultBrokerDeskStateDir(resolvedMarketCode === "A50"),
  );
  const quoteState = await readCapitalQuoteState({
    repoRoot,
    stateDir,
    targetStockNo: resolvedTargetStockNo,
    targetStockNos: resolvedTargetStockNos,
    quoteAliases: resolvedQuoteAliases,
    marketCode: resolvedMarketCode,
    marketRegistryPath: options.marketRegistryPath ?? defaultMarketRegistryPath(),
  });
  return normalizeCapitalQuoteDashboard(dashboard, quoteState, {
    ...options,
    dashboardPath,
    strategyPath,
    stateDir,
    marketCode: resolvedMarketCode,
    targetStockNo: resolvedTargetStockNo,
    targetStockNos: resolvedTargetStockNos,
    quoteAliases: resolvedQuoteAliases,
  });
}

export async function writeCapitalQuoteStatus(status, outputPath) {
  const text = `${JSON.stringify(status, null, 2)}\n`;
  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  await fs.writeFile(outputPath, text, "utf8");
  await fs.writeFile(`${outputPath}.sha256`, `${sha256Text(text)}\n`, "ascii");
  return outputPath;
}

function parseArgs(argv) {
  const options = {
    dashboardPath: defaultDashboardPath(),
    repoRoot: process.cwd(),
    stateDir: "",
    strategyPath: "",
    output: "",
    writeState: false,
    json: false,
    requireReady: false,
    maxFreshAgeSeconds: undefined,
    targetStockNo: "",
    targetStockNos: [],
    quoteAliases: [],
    marketCode: "",
    marketRegistryPath: defaultMarketRegistryPath(),
  };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--dashboard") {
      options.dashboardPath = argv[++index] ?? options.dashboardPath;
    } else if (arg.startsWith("--dashboard=")) {
      options.dashboardPath = arg.slice("--dashboard=".length);
    } else if (arg === "--repo-root") {
      options.repoRoot = argv[++index] ?? options.repoRoot;
    } else if (arg.startsWith("--repo-root=")) {
      options.repoRoot = arg.slice("--repo-root=".length);
    } else if (arg === "--state-dir") {
      options.stateDir = argv[++index] ?? options.stateDir;
    } else if (arg.startsWith("--state-dir=")) {
      options.stateDir = arg.slice("--state-dir=".length);
    } else if (arg === "--strategy") {
      options.strategyPath = argv[++index] ?? options.strategyPath;
    } else if (arg.startsWith("--strategy=")) {
      options.strategyPath = arg.slice("--strategy=".length);
    } else if (arg === "--stock-no" || arg === "--target-stock-no") {
      options.targetStockNo = argv[++index] ?? options.targetStockNo;
    } else if (arg.startsWith("--stock-no=")) {
      options.targetStockNo = arg.slice("--stock-no=".length);
    } else if (arg.startsWith("--target-stock-no=")) {
      options.targetStockNo = arg.slice("--target-stock-no=".length);
    } else if (arg === "--target-stock-nos") {
      options.targetStockNos = String(argv[++index] ?? "")
        .split(",")
        .map((value) => value.trim())
        .filter(Boolean);
    } else if (arg.startsWith("--target-stock-nos=")) {
      options.targetStockNos = arg
        .slice("--target-stock-nos=".length)
        .split(",")
        .map((value) => value.trim())
        .filter(Boolean);
    } else if (arg === "--quote-aliases") {
      options.quoteAliases = String(argv[++index] ?? "")
        .split(",")
        .map((value) => value.trim())
        .filter(Boolean);
    } else if (arg.startsWith("--quote-aliases=")) {
      options.quoteAliases = arg
        .slice("--quote-aliases=".length)
        .split(",")
        .map((value) => value.trim())
        .filter(Boolean);
    } else if (arg === "--market-code") {
      options.marketCode = argv[++index] ?? options.marketCode;
    } else if (arg.startsWith("--market-code=")) {
      options.marketCode = arg.slice("--market-code=".length);
    } else if (arg === "--market-registry") {
      options.marketRegistryPath = argv[++index] ?? options.marketRegistryPath;
    } else if (arg.startsWith("--market-registry=")) {
      options.marketRegistryPath = arg.slice("--market-registry=".length);
    } else if (arg === "--output") {
      options.output = argv[++index] ?? options.output;
    } else if (arg.startsWith("--output=")) {
      options.output = arg.slice("--output=".length);
    } else if (arg === "--write-state") {
      options.writeState = true;
    } else if (arg === "--json") {
      options.json = true;
    } else if (arg === "--require-ready") {
      options.requireReady = true;
    } else if (arg === "--max-fresh-age-seconds") {
      options.maxFreshAgeSeconds = Number(argv[++index] ?? "");
    } else if (arg.startsWith("--max-fresh-age-seconds=")) {
      options.maxFreshAgeSeconds = Number(arg.slice("--max-fresh-age-seconds=".length));
    }
  }
  return options;
}

export function formatSummary(status, outputPath) {
  return [
    "OpenClaw Capital quote status",
    `status=${status.status}`,
    `ready=${status.ready}`,
    `bridge=${status.bridge?.status || "N/A"}${status.bridge?.ready ? ":ready" : ""}${status.bridge?.overallReady === true ? ":overall" : ""}${status.bridge?.quoteEventConfirmed === true ? ":confirmed" : ""}`,
    `heartbeatAt=${status.bridge?.lastHeartbeatAt || "N/A"}`,
    `keepAliveUntil=${status.bridge?.keepAliveUntil || "N/A"}`,
    `strategyGate=${status.strategyGate.status}`,
    `quoteProof=${status.quoteProof.status}/${status.quoteProof.freshness}`,
    `freshness=${status.quoteProof.freshnessStatus}`,
    `age=${status.quoteProof.freshnessAgeSeconds}`,
    `freshQuote=${status.quoteProof.freshnessStatus === "fresh" ? "yes" : "no"}`,
    `currentQuote=${status.quoteProof.freshnessStatus === "fresh" ? status.quoteProof.latestStock || "N/A" : "NONE"}`,
    `latestQuote=${status.quoteProof.latestStock || "N/A"}`,
    `session=${status.session?.marketSessionLabel || "N/A"}`,
    `receivedAt=${status.quote?.receivedAt || "N/A"}`,
    outputPath ? `stateFile=${outputPath}` : "",
  ]
    .filter(Boolean)
    .join(" ");
}async function main() {
  const options = parseArgs(process.argv.slice(2));
  const status = await readCapitalQuoteStatus(options);
  const outputPath = options.writeState
    ? await writeCapitalQuoteStatus(
        status,
        path.resolve(options.output || defaultOutputPath(path.resolve(options.repoRoot))),
      )
    : "";

  if (options.json) {
    process.stdout.write(`${JSON.stringify({ ...status, outputPath }, null, 2)}\n`);
  } else {
    process.stdout.write(`${formatSummary(status, outputPath)}\n`);
  }

  if (options.requireReady && !status.ready) {
    process.exitCode = 1;
  }
}

const invokedPath = process.argv[1] ? path.resolve(process.argv[1]) : "";
if (invokedPath === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    process.stderr.write(
      `capital quote status failed: ${error instanceof Error ? error.message : String(error)}\n`,
    );
    process.exitCode = 1;
  });
}
