import path from "node:path";
import { fileURLToPath } from "node:url";
import { runCapitalPaperLearningSummary } from "./openclaw-capital-paper-learning-summary.mjs";

function parseArgs(argv) {
  const options = {
    repoRoot: process.cwd(),
    registryPath: "",
    reportPath: "",
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
    }
  }
  return options;
}

const invokedPath = process.argv[1] ? path.resolve(process.argv[1]) : "";
if (invokedPath === fileURLToPath(import.meta.url)) {
  const options = parseArgs(process.argv.slice(2));
  const result = await runCapitalPaperLearningSummary({
    ...options,
    writeState: true,
    json: false,
    silent: true,
  });
  const report = result.report;
  const registry = report.registry ?? {};
  const counts = registry.counters ?? {};
  const summary = report.summary ?? {};
  const isExactTrue = (value) => Object.is(value, true);
  const isExactFalse = (value) => Object.is(value, false);

  const failures = [];
  if (report.schema !== "openclaw.capital.paper-learning-summary.v1") {
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
  if (report.status !== registry.status) {
    failures.push("summary status must mirror registry status");
  }
  if (summary.totalCycles !== counts.totalCycles) {
    failures.push("cycle count mismatch");
  }
  if (summary.paperIntents !== counts.paperIntents) {
    failures.push("paper intent count mismatch");
  }
  if (summary.latestCycleId !== registry.lastObservation?.cycleId) {
    failures.push("latest cycle id mismatch");
  }
  if (
    typeof report.recommendation?.nextSafeTask !== "string" ||
    report.recommendation.nextSafeTask.length === 0
  ) {
    failures.push("missing next safe task");
  }
  if (failures.length > 0) {
    process.stderr.write(`capital paper learning summary check failed: ${failures.join(", ")}\n`);
    process.exitCode = 1;
  } else {
    process.stdout.write(
      [
        "CAPITAL_PAPER_LEARNING_SUMMARY_CHECK=OK",
        `status=${report.status}`,
        `paperEligible=${report.paperEligible}`,
        `nextSafeTask=${report.recommendation.nextSafeTask}`,
      ].join("\n") + "\n",
    );
  }
}
