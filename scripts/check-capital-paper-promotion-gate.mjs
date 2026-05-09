import path from "node:path";
import { fileURLToPath } from "node:url";
import { runCapitalPaperPromotionGate } from "./openclaw-capital-paper-promotion-gate.mjs";

function parseArgs(argv) {
  const options = {
    repoRoot: process.cwd(),
    summaryPath: "",
    reportPath: "",
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
    }
  }
  return options;
}

const invokedPath = process.argv[1] ? path.resolve(process.argv[1]) : "";
if (invokedPath === fileURLToPath(import.meta.url)) {
  const options = parseArgs(process.argv.slice(2));
  const result = await runCapitalPaperPromotionGate({
    ...options,
    writeState: true,
  });
  const report = result.report;
  const summary = report.summary ?? {};
  const isExactTrue = (value) => Object.is(value, true);
  const isExactFalse = (value) => Object.is(value, false);
  const failures = [];

  if (report.schema !== "openclaw.capital.paper-promotion-gate.v1") {
    failures.push("schema mismatch");
  }
  if (
    !isExactTrue(report.readOnlyQuoteOnly) ||
    !isExactFalse(report.loginAttempted) ||
    !isExactFalse(report.liveTradingEnabled) ||
    !isExactFalse(report.writeTradingEnabled) ||
    !isExactFalse(report.brokerOrderPathEnabled)
  ) {
    failures.push("safety flags not locked");
  }
  if (report.promoted && report.status !== "passed") {
    failures.push("promoted gate must pass");
  }
  if (!Number.isFinite(summary.consecutiveReadyCycles)) {
    failures.push("ready cycle summary missing");
  }
  if (
    typeof report.recommendation?.nextSafeTask !== "string" ||
    report.recommendation.nextSafeTask.length === 0
  ) {
    failures.push("missing next safe task");
  }

  if (failures.length > 0) {
    process.stderr.write(`capital paper promotion gate check failed: ${failures.join(", ")}\n`);
    process.exitCode = 1;
  } else {
    process.stdout.write(
      [
        "CAPITAL_PAPER_PROMOTION_GATE_CHECK=OK",
        `status=${report.status}`,
        `promoted=${report.promoted}`,
        `nextSafeTask=${report.recommendation.nextSafeTask}`,
      ].join("\n") + "\n",
    );
  }
}
