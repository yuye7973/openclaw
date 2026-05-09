import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { runCapitalPaperLearningSummary } from "./openclaw-capital-paper-learning-summary.mjs";

function defaultGatePath(repoRoot) {
  return path.join(repoRoot, ".openclaw", "trading", "capital-paper-promotion-gate.json");
}

function sha256Text(text) {
  return crypto.createHash("sha256").update(text).digest("hex").toUpperCase();
}

async function writeJsonWithSha(filePath, value) {
  const text = `${JSON.stringify(value, null, 2)}\n`;
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, text, "utf8");
  await fs.writeFile(`${filePath}.sha256`, `${sha256Text(text)}\n`, "ascii");
}

function stringOr(value, fallback = "") {
  return typeof value === "string" ? value : fallback;
}

function numberOr(value, fallback = 0) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : fallback;
}

function buildCapitalPaperPromotionGateReport({ learningSummary, summaryPath, reportPath }) {
  const registry = learningSummary.registry ?? {};
  const counters = learningSummary.summary ?? {};
  const status = stringOr(learningSummary.status, "candidate");
  const paperEligible = learningSummary.paperEligible === true;
  const liveEligible = learningSummary.liveEligible === true;
  const promoted = status === "approved_paper" && paperEligible;
  const readyCycles = numberOr(counters.consecutiveReadyCycles, 0);
  const minReadyCycles = numberOr(counters.minReadyCyclesForPaper, 20);
  const blockCount = numberOr(counters.consecutiveReadinessBlocks, 0);
  const blockLimit = numberOr(counters.blockAfterConsecutiveReadinessBlocks, 20);

  const checks = [
    {
      id: "promotion:summary-present",
      status: learningSummary != null ? "pass" : "fail",
      message: "Learning summary exists",
      evidence: {
        summaryPath,
      },
    },
    {
      id: "promotion:registry-linked",
      status: stringOr(learningSummary.files?.registryPath) ? "pass" : "fail",
      message: "Learning summary stays linked to the registry",
      evidence: {
        registryPath: learningSummary.files?.registryPath ?? "",
      },
    },
    {
      id: "promotion:paper-eligible",
      status: paperEligible ? "pass" : "fail",
      message: "Paper eligibility must be true before promotion",
      evidence: {
        paperEligible,
      },
    },
    {
      id: "promotion:status-approved-paper",
      status: status === "approved_paper" ? "pass" : "fail",
      message: "Registry status must be approved_paper before promotion",
      evidence: {
        status,
      },
    },
    {
      id: "promotion:ready-cycle-threshold",
      status: readyCycles >= minReadyCycles ? "pass" : "fail",
      message: "Consecutive ready cycles must satisfy the paper threshold",
      evidence: {
        consecutiveReadyCycles: readyCycles,
        minReadyCyclesForPaper: minReadyCycles,
      },
    },
    {
      id: "promotion:block-threshold",
      status: blockCount < blockLimit ? "pass" : "fail",
      message: "Consecutive readiness blocks must stay below the block threshold",
      evidence: {
        consecutiveReadinessBlocks: blockCount,
        blockAfterConsecutiveReadinessBlocks: blockLimit,
      },
    },
    {
      id: "promotion:live-still-blocked",
      status: liveEligible ? "fail" : "pass",
      message: "Live eligibility must stay blocked at paper promotion stage",
      evidence: {
        liveEligible,
      },
    },
    {
      id: "promotion:no-live-write",
      status:
        learningSummary.readOnlyQuoteOnly === true &&
        learningSummary.loginAttempted === false &&
        learningSummary.liveTradingEnabled === false &&
        learningSummary.writeTradingEnabled === false &&
        learningSummary.brokerOrderPathEnabled === false
          ? "pass"
          : "fail",
      message: "Promotion gate remains read-only and no-trading",
      evidence: {
        readOnlyQuoteOnly: learningSummary.readOnlyQuoteOnly,
        loginAttempted: learningSummary.loginAttempted,
        liveTradingEnabled: learningSummary.liveTradingEnabled,
        writeTradingEnabled: learningSummary.writeTradingEnabled,
        brokerOrderPathEnabled: learningSummary.brokerOrderPathEnabled,
      },
    },
  ];

  const passed = checks.filter((check) => check.status === "pass").length;
  const failed = checks.length - passed;
  const reportStatus = failed === 0 ? "passed" : "blocked";

  return {
    schema: "openclaw.capital.paper-promotion-gate.v1",
    generatedAt: new Date().toISOString(),
    provider: "capital",
    mode: "paper",
    readOnlyQuoteOnly: true,
    loginAttempted: false,
    liveTradingEnabled: false,
    writeTradingEnabled: false,
    brokerOrderPathEnabled: false,
    hftLikeAutomation: true,
    status: reportStatus,
    promoted,
    summary: {
      status,
      paperEligible,
      liveEligible,
      consecutiveReadyCycles: readyCycles,
      minReadyCyclesForPaper: minReadyCycles,
      consecutiveReadinessBlocks: blockCount,
      blockAfterConsecutiveReadinessBlocks: blockLimit,
      latestCycleId: stringOr(registry?.lastObservation?.cycleId, ""),
      latestReason: stringOr(registry?.lastObservation?.reason, ""),
      latestQuoteAgeSeconds: numberOr(registry?.lastObservation?.quoteAgeSeconds, -1),
    },
    recommendation: {
      nextSafeTask: promoted
        ? "進入 paper promotion review，確認可否由人工審查升級。"
        : stringOr(
            learningSummary.recommendation?.nextSafeTask,
            "等待下一筆 SKQuoteLib callback。",
          ),
    },
    checks,
    files: {
      summaryPath,
      reportPath,
      registryPath: learningSummary.files?.registryPath ?? "",
    },
  };
}

export async function runCapitalPaperPromotionGate(options = {}) {
  const repoRoot = path.resolve(options.repoRoot || process.cwd());
  const reportPath = path.resolve(options.reportPath || defaultGatePath(repoRoot));
  const result = await runCapitalPaperLearningSummary({
    repoRoot,
    registryPath: options.registryPath ?? "",
    reportPath: options.summaryPath ?? "",
    writeState: true,
    json: false,
    silent: true,
  });
  const learningSummary = result.report;
  const gate = buildCapitalPaperPromotionGateReport({
    learningSummary,
    summaryPath: learningSummary.files.reportPath,
    reportPath,
  });
  if (options.writeState) {
    await writeJsonWithSha(reportPath, gate);
  }
  return { report: gate, learningSummary };
}

function parseArgs(argv) {
  const options = {
    repoRoot: process.cwd(),
    summaryPath: "",
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
    } else if (arg === "--summary") {
      options.summaryPath = argv[++index] ?? options.summaryPath;
    } else if (arg.startsWith("--summary=")) {
      options.summaryPath = arg.slice("--summary=".length);
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
  runCapitalPaperPromotionGate(options)
    .then(({ report }) => {
      if (options.json) {
        process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
      } else {
        process.stdout.write(
          [
            "OpenClaw Capital paper promotion gate",
            `status=${report.status}`,
            `promoted=${report.promoted}`,
            `paperEligible=${report.summary.paperEligible}`,
            `nextSafeTask=${report.recommendation.nextSafeTask}`,
            options.writeState ? `report=${report.files.reportPath}` : "",
          ]
            .filter(Boolean)
            .join("\n") + "\n",
        );
      }
    })
    .catch((error) => {
      process.stderr.write(
        `capital paper promotion gate failed: ${error instanceof Error ? error.message : String(error)}\n`,
      );
      process.exitCode = 1;
    });
}
