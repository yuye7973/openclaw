import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import {
  buildCapitalPaperHftReadinessReport,
  writeCapitalPaperHftReadinessReport,
} from "./openclaw-capital-paper-hft-readiness.mjs";

const architectureReport = {
  schema: "openclaw.capital.quote-architecture-report.v1",
  status: "passed",
  readOnlyArchitecture: true,
  loginAttempted: false,
  liveTradingEnabled: false,
  writeTradingEnabled: false,
};

function runtimeEvent(freshnessAgeSeconds = 1) {
  return {
    schema: "openclaw.runtime.event.v1",
    eventType: "capital.quote.ready",
    readOnly: true,
    loginAttempted: false,
    liveTradingEnabled: false,
    writeTradingEnabled: false,
    summary: {
      status: "ready",
      strategyGateReady: true,
      freshnessStatus: "fresh",
      freshnessAgeSeconds,
      latestStock: "MXFFX999",
    },
  };
}

const riskControls = {
  schema: "openclaw.capital.paper-hft-risk-controls.v1",
  mode: "paper",
  allowLiveTrading: false,
  writeBrokerOrders: false,
  requireManualLiveArm: true,
  requireQuoteArchitecturePassed: true,
  requireStrategyGateReady: true,
  requireFreshQuoteStatus: "fresh",
  maxDecisionQuoteAgeSeconds: 2,
  decisionLoopIntervalMs: 250,
  maxPaperIntentsPerSecond: 4,
  maxPaperIntentsPerMinute: 120,
  maxPositionContracts: 1,
  maxDailyPaperLossTwd: 3000,
  killSwitchRequired: true,
  paperLedgerRequired: true,
  allowedSymbols: ["MXFFX999"],
  blockedOrderTypes: ["market-live", "broker-live"],
};

const readyReport = buildCapitalPaperHftReadinessReport({
  architectureReport,
  runtimeEvent: runtimeEvent(1),
  riskControls,
});
if (readyReport.status !== "ready_paper_hft" || !Object.is(readyReport.ready, true)) {
  throw new Error("fresh read-only event should pass paper HFT readiness");
}
if (
  !Object.is(readyReport.liveTradingEnabled, false) ||
  !Object.is(readyReport.brokerOrderPathEnabled, false)
) {
  throw new Error("paper HFT readiness must keep live broker order path disabled");
}

const staleReport = buildCapitalPaperHftReadinessReport({
  architectureReport,
  runtimeEvent: runtimeEvent(10),
  riskControls,
});
if (staleReport.status !== "blocked_quote_not_realtime" || !Object.is(staleReport.ready, false)) {
  throw new Error("stale quote event must block HFT-like readiness");
}

const liveRiskReport = buildCapitalPaperHftReadinessReport({
  architectureReport,
  runtimeEvent: runtimeEvent(1),
  riskControls: {
    ...riskControls,
    allowLiveTrading: true,
  },
});
if (liveRiskReport.status !== "blocked_risk_controls") {
  throw new Error("live-enabled risk controls must block readiness");
}

const tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), "openclaw-capital-paper-hft-"));
const reportPath = path.join(tempRoot, "capital-paper-hft-readiness.json");
await writeCapitalPaperHftReadinessReport(readyReport, reportPath);
await fs.access(reportPath);
await fs.access(`${reportPath}.sha256`);
const writtenReport = JSON.parse(await fs.readFile(reportPath, "utf8"));
if (writtenReport.schema !== "openclaw.capital.paper-hft-readiness.v1") {
  throw new Error("written paper HFT readiness schema mismatch");
}

process.stdout.write("CAPITAL_PAPER_HFT_READINESS_CHECK=OK\n");
