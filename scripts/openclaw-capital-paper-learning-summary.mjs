import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

function defaultLearningRegistryPath(repoRoot) {
  return path.join(repoRoot, ".openclaw", "trading", "capital-paper-learning-registry.json");
}

function defaultLearningSummaryPath(repoRoot) {
  return path.join(repoRoot, ".openclaw", "trading", "capital-paper-learning-summary.json");
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

async function writeJsonWithSha(filePath, value) {
  const text = `${JSON.stringify(value, null, 2)}\n`;
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, text, "utf8");
  await fs.writeFile(`${filePath}.sha256`, `${sha256Text(text)}\n`, "ascii");
}

function numberOr(value, fallback = 0) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : fallback;
}

function stringOr(value, fallback = "") {
  return typeof value === "string" ? value : fallback;
}

function recommendationFromRegistry(registry) {
  const status = stringOr(registry?.status, "candidate");
  const counters = registry?.counters ?? {};
  const rules = registry?.rules ?? {};
  const consecutiveReadinessBlocks = numberOr(counters.consecutiveReadinessBlocks, 0);
  const consecutiveReadyCycles = numberOr(counters.consecutiveReadyCycles, 0);
  const blockAfter = numberOr(rules.blockAfterConsecutiveReadinessBlocks, 20);
  const minReadyCycles = numberOr(rules.minReadyCyclesForPaper, 20);
  const quoteAgeSeconds = numberOr(registry?.lastObservation?.quoteAgeSeconds, -1);

  if (status === "approved_paper") {
    return "等待下一筆新的 SKQuoteLib quote callback，然後重跑 paper loop 產生 paper intent。";
  }
  if (status === "approved_live") {
    return "保持 live 鎖定，先完成手動 arming 與 broker write 驗證。";
  }
  if (status === "blocked" || consecutiveReadinessBlocks >= blockAfter) {
    return `連續 blocked readiness 已達 ${consecutiveReadinessBlocks} 次，先修復 quote freshness / data source，再談 promotion。`;
  }
  if (consecutiveReadyCycles >= minReadyCycles) {
    return "paper-ready 門檻已接近，持續等待下一筆 fresh quote。";
  }
  if (quoteAgeSeconds >= 0 && quoteAgeSeconds <= 2) {
    return "quote freshness 已滿足門檻，等待下一次 trigger。";
  }
  return "維持 paper-only learning，等待新的 SKQuoteLib quote callback 後再評估。";
}

function buildCounts(registry) {
  const counters = registry?.counters ?? {};
  return {
    totalCycles: numberOr(counters.totalCycles, 0),
    paperIntents: numberOr(counters.paperIntents, 0),
    readinessBlocks: numberOr(counters.readinessBlocks, 0),
    quoteBlocks: numberOr(counters.quoteBlocks, 0),
    consecutiveReadinessBlocks: numberOr(counters.consecutiveReadinessBlocks, 0),
    consecutiveReadyCycles: numberOr(counters.consecutiveReadyCycles, 0),
  };
}

function buildExecutionSummary(registry) {
  const execution = registry?.lastObservation?.executionPlan ?? {};
  return {
    status: stringOr(execution.status, ""),
    signalPolicy: stringOr(execution.signalPolicy, ""),
    entry: {
      side: stringOr(execution.entry?.side, ""),
      style: stringOr(execution.entry?.style, ""),
      trigger: stringOr(execution.entry?.trigger, ""),
      referencePrice: stringOr(execution.entry?.referencePrice, ""),
      action: stringOr(execution.entry?.action, ""),
      price: registry?.lastObservation?.latestBid ?? "",
      ready: execution.entry?.ready === true,
    },
    exit: {
      side: stringOr(execution.exit?.side, ""),
      style: stringOr(execution.exit?.style, ""),
      trigger: stringOr(execution.exit?.trigger, ""),
      referencePrice: stringOr(execution.exit?.referencePrice, ""),
      action: stringOr(execution.exit?.action, ""),
      price: registry?.lastObservation?.latestAsk ?? "",
      ready: execution.exit?.ready === true,
    },
    actionSummary: stringOr(execution.actionSummary, ""),
    paperIntentCreated: execution.paperIntentCreated === true,
  };
}

export function buildCapitalPaperLearningSummaryReport({ registry, registryPath, reportPath }) {
  const status = stringOr(registry?.status, "candidate");
  const counts = buildCounts(registry);
  const rules = registry?.rules ?? {};
  const lastObservation = registry?.lastObservation ?? {};
  const recommendation = recommendationFromRegistry(registry);
  const execution = buildExecutionSummary(registry);

  return {
    schema: "openclaw.capital.paper-learning-summary.v1",
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
    strategyName: stringOr(registry?.strategyName, ""),
    paperEligible: registry?.paperEligible === true,
    liveEligible: registry?.liveEligible === true,
    registry: {
      status,
      paperEligible: registry?.paperEligible === true,
      liveEligible: registry?.liveEligible === true,
      rules,
      counters: counts,
      lastObservation,
    },
    summary: {
      ...counts,
      minReadyCyclesForPaper: numberOr(rules.minReadyCyclesForPaper, 20),
      blockAfterConsecutiveReadinessBlocks: numberOr(
        rules.blockAfterConsecutiveReadinessBlocks,
        20,
      ),
      latestCycleId: stringOr(lastObservation.cycleId, ""),
      latestCycleStatus: stringOr(lastObservation.status, ""),
      latestReason: stringOr(lastObservation.reason, ""),
      latestQuoteAgeSeconds: numberOr(lastObservation.quoteAgeSeconds, -1),
      latestPaperIntentId: stringOr(lastObservation.paperIntentId, ""),
    },
    execution,
    recommendation: {
      nextSafeTask: recommendation,
    },
    files: {
      registryPath,
      reportPath,
    },
  };
}

export async function writeCapitalPaperLearningSummaryReport(report, reportPath) {
  await writeJsonWithSha(reportPath, report);
}

export async function runCapitalPaperLearningSummary(options = {}) {
  const repoRoot = path.resolve(options.repoRoot || process.cwd());
  const registryPath = path.resolve(options.registryPath || defaultLearningRegistryPath(repoRoot));
  const reportPath = path.resolve(options.reportPath || defaultLearningSummaryPath(repoRoot));
  const silent = options.silent === true;
  const registry =
    options.registry ?? (await readJson(registryPath, "Capital paper learning registry"));
  const report = buildCapitalPaperLearningSummaryReport({
    registry,
    registryPath,
    reportPath,
  });
  if (options.writeState) {
    await writeCapitalPaperLearningSummaryReport(report, reportPath);
  }
  const files = options.writeState ? { registryPath, reportPath } : { registryPath, reportPath };
  if (!silent && options.json) {
    process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
  } else if (!silent) {
    process.stdout.write(
      [
        "OpenClaw Capital paper learning summary",
        `status=${report.status}`,
        `paperEligible=${report.paperEligible}`,
        `liveEligible=${report.liveEligible}`,
        `nextSafeTask=${report.recommendation.nextSafeTask}`,
        options.writeState ? `report=${reportPath}` : "",
      ]
        .filter(Boolean)
        .join("\n") + "\n",
    );
  }
  return { report, files };
}

function parseArgs(argv) {
  const options = {
    repoRoot: process.cwd(),
    registryPath: "",
    reportPath: "",
    json: false,
    writeState: false,
  };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--repo-root") {
      options.repoRoot = argv[++index] ?? options.repoRoot;
    } else if (arg.startsWith("--repo-root=")) {
      options.repoRoot = arg.slice("--repo-root=".length);
    } else if (arg === "--registry") {
      options.registryPath = argv[++index] ?? options.registryPath;
    } else if (arg.startsWith("--registry=")) {
      options.registryPath = arg.slice("--registry=".length);
    } else if (arg === "--report") {
      options.reportPath = argv[++index] ?? options.reportPath;
    } else if (arg.startsWith("--report=")) {
      options.reportPath = arg.slice("--report=".length);
    } else if (arg === "--json") {
      options.json = true;
    } else if (arg === "--write-state") {
      options.writeState = true;
    }
  }
  return options;
}

const invokedPath = process.argv[1] ? path.resolve(process.argv[1]) : "";
if (invokedPath === fileURLToPath(import.meta.url)) {
  const options = parseArgs(process.argv.slice(2));
  runCapitalPaperLearningSummary(options).catch((error) => {
    process.stderr.write(
      `capital paper learning summary failed: ${error instanceof Error ? error.message : String(error)}\n`,
    );
    process.exitCode = 1;
  });
}
