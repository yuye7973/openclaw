import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import {
  buildCapitalQuoteArchitectureReport,
  writeCapitalQuoteArchitectureReport,
} from "./openclaw-capital-quote-architecture.mjs";

function readyStatus() {
  return {
    schema: "openclaw.capital.quote-status.v1",
    readOnly: true,
    loginAttempted: false,
    liveTradingEnabled: false,
    writeTradingEnabled: false,
    status: "ready",
    strategyGate: {
      ready: true,
      status: "allow_read_only_strategy_context",
    },
    quoteProof: {
      latestStock: "MXFFX999",
    },
  };
}

function readyEvent(status = "ready") {
  return {
    schema: "openclaw.runtime.event.v1",
    eventType: status === "ready" ? "capital.quote.ready" : `capital.quote.${status}`,
    readOnly: true,
    loginAttempted: false,
    liveTradingEnabled: false,
    writeTradingEnabled: false,
    summary: {
      status,
      strategyGateReady: status === "ready",
      latestStock: "MXFFX999",
    },
  };
}

const repoReport = await buildCapitalQuoteArchitectureReport({
  repoRoot: process.cwd(),
  requireGeneratedState: false,
});
if (repoReport.status !== "passed") {
  throw new Error(
    `repo architecture report failed: ${repoReport.checks
      .filter((check) => check.status !== "pass")
      .map((check) => check.id)
      .join(", ")}`,
  );
}

const tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), "openclaw-capital-quote-architecture-"));
const statusPath = path.join(tempRoot, "capital-quote-status.json");
const eventPath = path.join(tempRoot, "capital-quote-latest.json");
await fs.writeFile(statusPath, `${JSON.stringify(readyStatus(), null, 2)}\n`, "utf8");
await fs.writeFile(eventPath, `${JSON.stringify(readyEvent(), null, 2)}\n`, "utf8");

const matchingReport = await buildCapitalQuoteArchitectureReport({
  repoRoot: process.cwd(),
  statusPath,
  eventPath,
  requireGeneratedState: true,
});
if (matchingReport.status !== "passed") {
  throw new Error("matching generated quote state should pass architecture gate");
}

await fs.writeFile(eventPath, `${JSON.stringify(readyEvent("stale"), null, 2)}\n`, "utf8");
const mismatchedReport = await buildCapitalQuoteArchitectureReport({
  repoRoot: process.cwd(),
  statusPath,
  eventPath,
  requireGeneratedState: true,
});
if (mismatchedReport.status !== "failed") {
  throw new Error("mismatched generated quote state should fail architecture gate");
}

const reportPath = path.join(tempRoot, "capital-quote-architecture-report.json");
await writeCapitalQuoteArchitectureReport(matchingReport, reportPath);
await fs.access(reportPath);
await fs.access(`${reportPath}.sha256`);

process.stdout.write("CAPITAL_QUOTE_ARCHITECTURE_CHECK=OK\n");
