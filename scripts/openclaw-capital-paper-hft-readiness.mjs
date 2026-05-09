import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

function defaultArchitectureReportPath(repoRoot) {
  return path.join(repoRoot, ".openclaw", "quote", "capital-quote-architecture-report.json");
}

function defaultEventPath(repoRoot) {
  return path.join(repoRoot, ".openclaw", "runtime-events", "capital-quote-latest.json");
}

function defaultRiskConfigPath(repoRoot) {
  return path.join(repoRoot, "config", "capital-paper-hft-risk-controls.json");
}

function defaultOutputPath(repoRoot) {
  return path.join(repoRoot, ".openclaw", "trading", "capital-paper-hft-readiness.json");
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

function numberOr(value, fallback) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : fallback;
}

function stringOr(value, fallback = "") {
  return typeof value === "string" ? value : fallback;
}

function arrayIncludes(array, value) {
  if (!Array.isArray(array)) {
    return false;
  }

  return array.some((item) => {
    if (typeof item !== "string") {
      return false;
    }
    if (item === value) {
      return true;
    }
    if (item.endsWith("*")) {
      return value.startsWith(item.slice(0, -1));
    }
    return false;
  });
}

function addGate(gates, id, passed, message, evidence = {}) {
  gates.push({
    id,
    status: passed ? "pass" : "fail",
    message,
    evidence,
  });
}

function validateRiskControls(riskControls, gates) {
  addGate(
    gates,
    "risk:schema",
    riskControls?.schema === "openclaw.capital.paper-hft-risk-controls.v1",
    "Risk controls schema is stable",
    { schema: riskControls?.schema ?? "" },
  );
  addGate(
    gates,
    "risk:mode",
    riskControls?.mode === "paper",
    "Automation mode must stay paper-only",
    {
      mode: riskControls?.mode ?? "",
    },
  );
  addGate(
    gates,
    "risk:live-disabled",
    riskControls?.allowLiveTrading === false &&
      riskControls?.writeBrokerOrders === false &&
      riskControls?.requireManualLiveArm === true,
    "Live trading and broker writes must stay disabled",
    {
      allowLiveTrading: riskControls?.allowLiveTrading,
      writeBrokerOrders: riskControls?.writeBrokerOrders,
      requireManualLiveArm: riskControls?.requireManualLiveArm,
    },
  );
  addGate(
    gates,
    "risk:quote-architecture-required",
    riskControls?.requireQuoteArchitecturePassed === true,
    "Quote architecture gate must be required",
  );
  addGate(
    gates,
    "risk:strategy-gate-required",
    riskControls?.requireStrategyGateReady === true,
    "Strategy gate must be required",
  );
  addGate(
    gates,
    "risk:kill-switch",
    riskControls?.killSwitchRequired === true,
    "Kill switch must be required",
  );
  addGate(
    gates,
    "risk:paper-ledger",
    riskControls?.paperLedgerRequired === true,
    "Paper ledger must be required",
  );
  const intervalMs = numberOr(riskControls?.decisionLoopIntervalMs, 0);
  addGate(
    gates,
    "risk:decision-loop-interval",
    intervalMs >= 100,
    "Decision loop interval must avoid unbounded CPU/API spinning",
    { decisionLoopIntervalMs: intervalMs },
  );
  const maxIntentsPerSecond = numberOr(riskControls?.maxPaperIntentsPerSecond, 0);
  addGate(
    gates,
    "risk:intent-rate-second",
    maxIntentsPerSecond > 0 && maxIntentsPerSecond <= 10,
    "Paper intent rate must be bounded",
    { maxPaperIntentsPerSecond: maxIntentsPerSecond },
  );
  const maxPositionContracts = numberOr(riskControls?.maxPositionContracts, 0);
  addGate(
    gates,
    "risk:max-position",
    maxPositionContracts > 0 && maxPositionContracts <= 1,
    "Paper position size must be bounded to one contract until live write path is separately verified",
    { maxPositionContracts },
  );
}

export function buildCapitalPaperHftReadinessReport(inputs, options = {}) {
  const { architectureReport, runtimeEvent, riskControls } = inputs;
  const gates = [];
  validateRiskControls(riskControls, gates);

  addGate(
    gates,
    "architecture:passed",
    architectureReport?.status === "passed",
    "Quote architecture gate must pass before paper HFT automation",
    { status: architectureReport?.status ?? "" },
  );
  addGate(
    gates,
    "architecture:read-only",
    architectureReport?.readOnlyArchitecture === true &&
      architectureReport?.loginAttempted === false &&
      architectureReport?.liveTradingEnabled === false &&
      architectureReport?.writeTradingEnabled === false,
    "Quote architecture must remain read-only and no-login/no-trading",
  );

  const quoteStatus = stringOr(runtimeEvent?.summary?.status, "");
  const quoteFreshness = stringOr(runtimeEvent?.summary?.freshnessStatus, "");
  const quoteAgeSeconds = numberOr(
    runtimeEvent?.summary?.freshnessAgeSeconds,
    Number.POSITIVE_INFINITY,
  );
  const maxQuoteAgeSeconds = numberOr(riskControls?.maxDecisionQuoteAgeSeconds, 0);
  const latestStock = stringOr(runtimeEvent?.summary?.latestStock, "");

  addGate(
    gates,
    "quote:event-ready",
    runtimeEvent?.eventType === "capital.quote.ready",
    "Runtime event must be capital.quote.ready",
    {
      eventType: runtimeEvent?.eventType ?? "",
    },
  );
  addGate(
    gates,
    "quote:strategy-gate",
    runtimeEvent?.summary?.strategyGateReady === true,
    "Runtime event strategy gate must be ready",
  );
  addGate(
    gates,
    "quote:freshness-status",
    quoteFreshness === riskControls?.requireFreshQuoteStatus,
    "Quote freshness status must satisfy risk controls",
    {
      quoteFreshness,
      required: riskControls?.requireFreshQuoteStatus ?? "",
    },
  );
  addGate(
    gates,
    "quote:hft-age",
    quoteAgeSeconds <= maxQuoteAgeSeconds,
    "Quote event must be realtime enough for HFT-like paper decisions",
    { quoteAgeSeconds, maxQuoteAgeSeconds },
  );
  addGate(
    gates,
    "quote:allowed-symbol",
    arrayIncludes(riskControls?.allowedSymbols, latestStock),
    "Latest quote symbol must be explicitly allowed",
    { latestStock, allowedSymbols: riskControls?.allowedSymbols ?? [] },
  );
  addGate(
    gates,
    "event:safety",
    runtimeEvent?.readOnly === true &&
      runtimeEvent?.loginAttempted === false &&
      runtimeEvent?.liveTradingEnabled === false &&
      runtimeEvent?.writeTradingEnabled === false,
    "Runtime event safety flags must remain read-only and no-login/no-trading",
  );

  const failedGates = gates.filter((gate) => gate.status !== "pass");
  const ready = failedGates.length === 0;
  const status = ready
    ? "ready_paper_hft"
    : failedGates.some((gate) => gate.id === "quote:hft-age")
      ? "blocked_quote_not_realtime"
      : failedGates.some((gate) => gate.id.startsWith("risk:"))
        ? "blocked_risk_controls"
        : "blocked";

  return {
    schema: "openclaw.capital.paper-hft-readiness.v1",
    generatedAt: new Date().toISOString(),
    status,
    ready,
    mode: "paper",
    hftLikeAutomation: true,
    readOnlyQuoteOnly: true,
    loginAttempted: false,
    liveTradingEnabled: false,
    writeTradingEnabled: false,
    brokerOrderPathEnabled: false,
    summary: {
      passed: gates.length - failedGates.length,
      failed: failedGates.length,
      quoteStatus,
      quoteFreshness,
      quoteAgeSeconds: Number.isFinite(quoteAgeSeconds) ? quoteAgeSeconds : -1,
      maxQuoteAgeSeconds,
      latestStock,
      decisionLoopIntervalMs: numberOr(riskControls?.decisionLoopIntervalMs, 0),
      maxPaperIntentsPerSecond: numberOr(riskControls?.maxPaperIntentsPerSecond, 0),
      maxPaperIntentsPerMinute: numberOr(riskControls?.maxPaperIntentsPerMinute, 0),
      maxPositionContracts: numberOr(riskControls?.maxPositionContracts, 0),
    },
    automationPlan: {
      input: "capital.quote.ready runtime event",
      cadence: "event-driven paper decision loop",
      orderMode: "paper-intent-only",
      liveOrderPolicy:
        "locked; requires separate broker write adapter verification and manual arming",
      denialPolicy: "deny strategy use when any gate fails",
    },
    gates,
    files: {
      architectureReportPath: stringOr(options.architectureReportPath, ""),
      eventPath: stringOr(options.eventPath, ""),
      riskConfigPath: stringOr(options.riskConfigPath, ""),
      outputPath: stringOr(options.outputPath, ""),
    },
    nextSafeTask: ready
      ? "建立 paper intent ledger 與決策 loop dry-run；仍不得啟用 broker 寫入。"
      : "先讓報價 runtime event 達到 HFT freshness gate，再產生 paper intent ledger。",
  };
}

export async function readCapitalPaperHftReadinessReport(options = {}) {
  const repoRoot = path.resolve(options.repoRoot ?? process.cwd());
  const architectureReportPath = path.resolve(
    options.architectureReportPath ?? defaultArchitectureReportPath(repoRoot),
  );
  const eventPath = path.resolve(options.eventPath ?? defaultEventPath(repoRoot));
  const riskConfigPath = path.resolve(options.riskConfigPath ?? defaultRiskConfigPath(repoRoot));
  const [architectureReport, runtimeEvent, riskControls] = await Promise.all([
    readJson(architectureReportPath, "Capital quote architecture report"),
    readJson(eventPath, "Capital quote runtime event"),
    readJson(riskConfigPath, "Capital paper HFT risk controls"),
  ]);
  return buildCapitalPaperHftReadinessReport(
    { architectureReport, runtimeEvent, riskControls },
    {
      architectureReportPath,
      eventPath,
      riskConfigPath,
      outputPath: path.resolve(options.outputPath ?? defaultOutputPath(repoRoot)),
    },
  );
}

export async function writeCapitalPaperHftReadinessReport(report, outputPath) {
  const text = `${JSON.stringify(report, null, 2)}\n`;
  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  await fs.writeFile(outputPath, text, "utf8");
  await fs.writeFile(`${outputPath}.sha256`, `${sha256Text(text)}\n`, "ascii");
  return outputPath;
}

function parseArgs(argv) {
  const options = {
    repoRoot: process.cwd(),
    architectureReportPath: "",
    eventPath: "",
    riskConfigPath: "",
    outputPath: "",
    writeState: false,
    json: false,
    requireReady: false,
  };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--repo-root") {
      options.repoRoot = argv[++index] ?? options.repoRoot;
    } else if (arg.startsWith("--repo-root=")) {
      options.repoRoot = arg.slice("--repo-root=".length);
    } else if (arg === "--architecture-report") {
      options.architectureReportPath = argv[++index] ?? options.architectureReportPath;
    } else if (arg.startsWith("--architecture-report=")) {
      options.architectureReportPath = arg.slice("--architecture-report=".length);
    } else if (arg === "--event") {
      options.eventPath = argv[++index] ?? options.eventPath;
    } else if (arg.startsWith("--event=")) {
      options.eventPath = arg.slice("--event=".length);
    } else if (arg === "--risk-config") {
      options.riskConfigPath = argv[++index] ?? options.riskConfigPath;
    } else if (arg.startsWith("--risk-config=")) {
      options.riskConfigPath = arg.slice("--risk-config=".length);
    } else if (arg === "--output") {
      options.outputPath = argv[++index] ?? options.outputPath;
    } else if (arg.startsWith("--output=")) {
      options.outputPath = arg.slice("--output=".length);
    } else if (arg === "--write-state") {
      options.writeState = true;
    } else if (arg === "--json") {
      options.json = true;
    } else if (arg === "--require-ready") {
      options.requireReady = true;
    }
  }
  return options;
}

function formatSummary(report, outputPath) {
  return [
    "OpenClaw Capital paper HFT readiness",
    `status=${report.status}`,
    `ready=${report.ready}`,
    `passed=${report.summary.passed}`,
    `failed=${report.summary.failed}`,
    `quoteAgeSeconds=${report.summary.quoteAgeSeconds}`,
    `maxQuoteAgeSeconds=${report.summary.maxQuoteAgeSeconds}`,
    `latestStock=${report.summary.latestStock || "N/A"}`,
    outputPath ? `report=${outputPath}` : "",
  ]
    .filter(Boolean)
    .join("\n");
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const repoRoot = path.resolve(options.repoRoot);
  const outputPath = path.resolve(options.outputPath || defaultOutputPath(repoRoot));
  const report = await readCapitalPaperHftReadinessReport({
    repoRoot,
    architectureReportPath: options.architectureReportPath || undefined,
    eventPath: options.eventPath || undefined,
    riskConfigPath: options.riskConfigPath || undefined,
    outputPath,
  });
  const writtenPath = options.writeState
    ? await writeCapitalPaperHftReadinessReport(report, outputPath)
    : "";

  if (options.json) {
    process.stdout.write(`${JSON.stringify({ ...report, outputPath: writtenPath }, null, 2)}\n`);
  } else {
    process.stdout.write(`${formatSummary(report, writtenPath)}\n`);
  }

  if (options.requireReady && !report.ready) {
    process.exitCode = 1;
  }
}

const invokedPath = process.argv[1] ? path.resolve(process.argv[1]) : "";
if (invokedPath === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    process.stderr.write(
      `capital paper HFT readiness failed: ${error instanceof Error ? error.message : String(error)}\n`,
    );
    process.exitCode = 1;
  });
}
