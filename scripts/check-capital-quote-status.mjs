import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import {
  formatSummary,
  readCapitalQuoteStatus,
  writeCapitalQuoteStatus,
} from "./openclaw-capital-quote-status.mjs";

function buildQuoteEvent(receivedAt) {
  return {
    receivedAt,
    eventSource: "SKQuoteLib.OnNotifyQuoteLONG",
    stockNo: "TX00AM",
    stockName: "台指近",
    close: "4193700",
    bid: "4193600",
    ask: "4194400",
    qty: "65900",
    message:
      "收到群益報價事件: SKQuoteLib.OnNotifyQuoteLONG stockNo=TX00AM name=台指近 open=4212000 high=4234300 low=4153900 close=4193700 bid=4193600 ask=4194400 qty=65900 decimal=2",
  };
}

const tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), "openclaw-capital-quote-status-"));
const repoRoot = path.join(tempRoot, "repo");
const quoteDir = path.join(repoRoot, ".openclaw", "quote");
const stateDir = path.join(tempRoot, "BrokerDesk", "state");
await fs.mkdir(quoteDir, { recursive: true });
await fs.mkdir(stateDir, { recursive: true });

const dashboard = {
  schema: "brokerdesk.capital.automation-health-dashboard.v1",
  generatedAt: new Date().toISOString(),
  readOnly: true,
  liveTradingEnabled: false,
  writeTradingEnabled: false,
  healthStatus: "completed",
  guard: {
    active: false,
    nextAllowedAt: "",
    lastCode: "",
  },
  brokerDeskQueue: {
    completed: true,
    nextStartIndex: 14622,
    lastRunStatus: "subscription-window-accepted",
    quoteUniverseCount: 18404,
    distinctQuoteCodeCount: 14622,
    completionUniverseCount: 14622,
    completionBasis: "distinctQuoteCodeCount",
    quoteProofStatus: "confirmed",
    quoteProofFreshness: "fresh",
  },
  openClawQueue: {
    ready: true,
    completed: true,
  },
  quoteFreshness: {
    status: "fresh",
    latestStock: "MXFFX999",
    latestStockName: "客小台現貨標的",
    ageSeconds: 90,
    maxFreshSeconds: 14400,
  },
  productMapping: {
    ready: true,
    status: "completed",
    productFamilyRows: 409,
  },
  domesticOverseasClassification: {
    ready: true,
    status: "completed",
    mappingAppliedRows: 14622,
    distinctQuoteCodes: 14622,
  },
  readiness: {
    queueCompleted: true,
    openClawReady: true,
    openClawCompleted: true,
    freshnessReady: true,
    mappingReady: true,
    classificationReady: true,
    allReadOnlyMonitorsReady: true,
  },
  nextSafeTask: "只維持 heartbeat 健康檢查；不要重跑全商品。",
};

const dashboardPath = path.join(quoteDir, "capital-automation-health-dashboard.json");
await fs.writeFile(dashboardPath, `${JSON.stringify(dashboard, null, 2)}\n`, "utf8");

await fs.writeFile(
  path.join(stateDir, "background_quotes_status.json"),
  `${JSON.stringify({
    generatedAt: new Date().toISOString(),
    mode: "background-quotes",
    status: "holding",
    overallReady: true,
    brokerActionRequired: false,
    nextActionOwner: "none",
    nextAction: "keep alive",
    quoteUniverseCount: 18404,
    capital: { brokerActionRequired: false },
  }, null, 2)}
`,
  "utf8",
);
const bridge = {
  status: "connected",
  overallReady: true,
  providers: {
    capital: {
      brokerActionRequired: false,
    },
  },
  currentBlockingCode: "",
  quoteUniverseCount: 18404,
};
await fs.writeFile(
  path.join(stateDir, "openclaw_quote_bridge.json"),
  `${JSON.stringify(bridge, null, 2)}\n`,
  "utf8",
);

const freshReceivedAt = new Date().toISOString();
const freshEvent = buildQuoteEvent(freshReceivedAt);
await fs.writeFile(
  path.join(stateDir, "capital_latest_quote_event.json"),
  `${JSON.stringify(freshEvent, null, 2)}\n`,
  "utf8",
);
await fs.writeFile(
  path.join(stateDir, "capital_quote_events.jsonl"),
  `${JSON.stringify(freshEvent)}\n`,
  "utf8",
);

const status = await readCapitalQuoteStatus({
  dashboardPath,
  repoRoot,
  stateDir,
  maxFreshAgeSeconds: 300,
  marketCode: "TXF",
  targetStockNo: "TX00AM",
  targetStockNos: ["TX00AM", "TX00", "TXFR1"],
  quoteAliases: ["TX00AM", "TX00", "TXFR1", "TXF"],
});

if (status.schema !== "openclaw.capital.quote-status.v1") {
  throw new Error(`unexpected schema: ${status.schema}`);
}
if (status.status !== "ready" || !Object.is(status.ready, true)) {
  throw new Error(`expected ready status, got ${JSON.stringify(status)}`);
}
if (!Object.is(status.bridge.ready, true) || !["connected", "holding"].includes(status.bridge.status)) {
  throw new Error(`expected bridge ready/connected/holding, got ${JSON.stringify(status.bridge)}`);
}
if (!Object.is(status.strategyGate.ready, true)) {
  throw new Error(`expected strategy gate ready, got ${JSON.stringify(status.strategyGate)}`);
}
if (status.source !== "BrokerDesk quote state") {
  throw new Error(`expected BrokerDesk quote state source, got ${status.source}`);
}
if (status.quoteProof.latestStock !== "TX00AM") {
  throw new Error(`expected quote proof stock TX00AM, got ${status.quoteProof.latestStock}`);
}
if (status.session.marketSessionLabel !== "夜盤" && status.session.marketSessionLabel !== "日盤") {
  throw new Error(`unexpected session label: ${status.session.marketSessionLabel}`);
}
if (
  !Object.is(status.readOnly, true) ||
  !Object.is(status.loginAttempted, false) ||
  !Object.is(status.liveTradingEnabled, false)
) {
  throw new Error("safety flags must stay read-only and no-login");
}
if (status.monitors.mappingFamilies !== 409) {
  throw new Error(`unexpected mapping family count: ${status.monitors.mappingFamilies}`);
}
if (status.monitors.classificationMappedRows !== 14622) {
  throw new Error(
    `unexpected classification mapped rows: ${status.monitors.classificationMappedRows}`,
  );
}
if (status.diagnostics.selectedStock.latestOverallStockNo !== "TX00AM") {
  throw new Error(
    `expected latest overall stock TX00AM, got ${status.diagnostics.selectedStock.latestOverallStockNo}`,
  );
}

const output = path.join(quoteDir, "capital-quote-status.json");
const freshSummary = formatSummary(status, output);
if (!freshSummary.includes("freshQuote=yes") || !freshSummary.includes("currentQuote=TX00AM")) {
  throw new Error(`expected fresh summary to expose current quote, got ${freshSummary}`);
}
await writeCapitalQuoteStatus(status, output);
await fs.access(output);
await fs.access(`${output}.sha256`);

const staleEvent = buildQuoteEvent(new Date(Date.now() - 10 * 60 * 1000).toISOString());
await fs.writeFile(
  path.join(stateDir, "capital_latest_quote_event.json"),
  `${JSON.stringify(staleEvent, null, 2)}\n`,
  "utf8",
);
await fs.writeFile(
  path.join(stateDir, "capital_quote_events.jsonl"),
  `${JSON.stringify(staleEvent)}\n`,
  "utf8",
);

const stale = await readCapitalQuoteStatus({
  dashboardPath,
  repoRoot,
  stateDir,
  maxFreshAgeSeconds: 300,
  marketCode: "TXF",
  targetStockNo: "TX00AM",
  targetStockNos: ["TX00AM", "TX00", "TXFR1"],
  quoteAliases: ["TX00AM", "TX00", "TXFR1", "TXF"],
});
if (stale.status !== "stale" || !Object.is(stale.strategyGate.ready, false)) {
  throw new Error(`expected stale strategy gate denial, got ${JSON.stringify(stale)}`);
}
if (!Object.is(stale.bridge.ready, true) || !["connected", "holding"].includes(stale.bridge.status)) {
  throw new Error(
    `expected bridge still ready on stale quote, got ${JSON.stringify(stale.bridge)}`,
  );
}
if (stale.quoteProof.latestStock !== "TX00AM") {
  throw new Error(`expected stale quote proof stock TX00AM, got ${stale.quoteProof.latestStock}`);
}
if (stale.source !== "BrokerDesk quote state") {
  throw new Error(`expected BrokerDesk quote state source on stale refresh, got ${stale.source}`);
}
const staleSummary = formatSummary(stale, output);
if (!staleSummary.includes("freshQuote=no") || !staleSummary.includes("currentQuote=NONE")) {
  throw new Error(`expected stale summary to hide current quote, got ${staleSummary}`);
}

await fs.writeFile(
  path.join(stateDir, "background_quotes_status.json"),
  `${JSON.stringify({
    generatedAt: new Date().toISOString(),
    mode: "background-quotes",
    status: "holding",
    overallReady: false,
    brokerActionRequired: true,
    nextActionOwner: "capital",
    nextAction: "bridge blocked",
    quoteUniverseCount: 18404,
    capital: { brokerActionRequired: true },
  }, null, 2)}
`,
  "utf8",
);
await fs.writeFile(
  path.join(stateDir, "openclaw_quote_bridge.json"),
  `${JSON.stringify({
    status: "blocked",
    overallReady: false,
    providers: { capital: { brokerActionRequired: true } },
    currentBlockingCode: "bridge_not_ready",
    quoteUniverseCount: 18404,
  }, null, 2)}
`,
  "utf8",
);
await fs.writeFile(
  path.join(stateDir, "capital_latest_quote_event.json"),
  `${JSON.stringify(freshEvent, null, 2)}
`,
  "utf8",
);
await fs.writeFile(
  path.join(stateDir, "capital_quote_events.jsonl"),
  `${JSON.stringify(freshEvent)}
`,
  "utf8",
);
const bridgeBlocked = await readCapitalQuoteStatus({
  dashboardPath,
  repoRoot,
  stateDir,
  maxFreshAgeSeconds: 300,
  marketCode: "TXF",
  targetStockNo: "TX00AM",
  targetStockNos: ["TX00AM", "TX00", "TXFR1"],
  quoteAliases: ["TX00AM", "TX00", "TXFR1", "TXF"],
});
if (bridgeBlocked.status === "ready" || Object.is(bridgeBlocked.ready, true)) {
  throw new Error(`expected bridge-blocked status, got ${JSON.stringify(bridgeBlocked)}`);
}
if (bridgeBlocked.bridge.ready || !["blocked", "holding"].includes(bridgeBlocked.bridge.status)) {
  throw new Error(`expected bridge blocked, got ${JSON.stringify(bridgeBlocked.bridge)}`);
}
if (!bridgeBlocked.reason.includes("bridge")) {
  throw new Error(`expected bridge reason, got ${bridgeBlocked.reason}`);
}

process.stdout.write("CAPITAL_QUOTE_STATUS_CHECK=OK\n");
