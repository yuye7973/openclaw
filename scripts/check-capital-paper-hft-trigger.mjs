import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { runCapitalPaperHftTrigger } from "./openclaw-capital-paper-hft-trigger.mjs";

const quoteScripts = [
  "brokerdesk:quote:check",
  "brokerdesk:quote:read",
  "brokerdesk:quote:status",
  "brokerdesk:quote:status:check",
  "brokerdesk:quote:event",
  "brokerdesk:quote:event:check",
  "brokerdesk:quote:pump",
  "brokerdesk:quote:pump:check",
  "brokerdesk:quote:validate",
  "brokerdesk:quote:architecture",
  "brokerdesk:quote:architecture:check",
];

const architectureFiles = [
  "scripts/openclaw-capital-quote-reader.mjs",
  "scripts/check-capital-quote-reader.mjs",
  "scripts/openclaw-capital-quote-status.mjs",
  "scripts/check-capital-quote-status.mjs",
  "scripts/openclaw-capital-quote-pump.mjs",
  "scripts/check-capital-quote-pump.mjs",
  "scripts/openclaw-capital-quote-runtime-event.mjs",
  "scripts/check-capital-quote-runtime-event.mjs",
  "scripts/validate-capital-quote-state.mjs",
  "skills/capital-quotes/SKILL.md",
  "docs/automation/module-skill-inventory.md",
];

function pad(value, size = 2) {
  return String(value).padStart(size, "0");
}

function brokerDeskTimestamp(date, ageSeconds = 0) {
  const shifted = new Date(date.getTime() - ageSeconds * 1000);
  return `${shifted.getFullYear()}-${pad(shifted.getMonth() + 1)}-${pad(shifted.getDate())} ${pad(
    shifted.getHours(),
  )}:${pad(shifted.getMinutes())}:${pad(shifted.getSeconds())}.${pad(
    shifted.getMilliseconds(),
    3,
  )}`;
}

async function writeJson(filePath, value) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

async function writeText(filePath, value = "") {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, value, "utf8");
}

function baseStatus() {
  return {
    schema: "openclaw.capital.quote-status.v1",
    readOnly: true,
    loginAttempted: false,
    liveTradingEnabled: false,
    writeTradingEnabled: false,
    status: "ready",
    ready: true,
    strategyGate: { ready: true, status: "allow_read_only_strategy_context" },
    guard: { active: false, lastCode: "", nextAllowedAt: "" },
    quoteProof: {
      status: "confirmed",
      freshness: "fresh",
      latestStock: "MXFFX999",
      latestStockName: "客小台現貨標的",
      freshnessStatus: "fresh",
      freshnessAgeSeconds: 0,
    },
    completion: {
      queueCompleted: true,
      openClawReady: true,
      openClawCompleted: true,
      lastRunStatus: "subscription-window-accepted",
      quoteUniverseCount: 18404,
      distinctQuoteCodeCount: 14622,
      completionUniverseCount: 14622,
      completionBasis: "distinctQuoteCodeCount",
      nextStartIndex: 14622,
    },
    monitors: {
      freshnessReady: true,
      mappingReady: true,
      classificationReady: true,
      allReadOnlyMonitorsReady: true,
      mappingFamilies: 409,
      classificationMappedRows: 14622,
      classificationDistinctQuoteCodes: 14622,
    },
    files: {},
  };
}

async function writeBrokerDeskState(stateDir, receivedAt, overrides = {}) {
  await writeJson(path.join(stateDir, "openclaw_quote_bridge.json"), {
    status: "connected",
    overallReady: true,
    providers: { capital: { brokerActionRequired: false } },
    currentBlockingCode: "",
    quoteUniverseCount: 18404,
  });
  await writeJson(path.join(stateDir, "latest_quote_state.json"), {
    brokerActionRequired: false,
    currentBlockingCode: "",
    quoteUniverseCount: 18404,
  });
  const bid = overrides.bid ?? "4113880";
  const ask = overrides.ask ?? "4113881";
  const quoteEvent = {
    receivedAt,
    eventSource: "SKQuoteLib.OnNotifyQuoteLONG",
    stockNo: "MXFFX999",
    stockName: "客小台現貨標的",
    close: overrides.close ?? "4113885",
    bid,
    ask,
    qty: overrides.qty ?? "3",
    message: `收到群益報價事件: SKQuoteLib.OnNotifyQuoteLONG stockNo=MXFFX999 name=客小台現貨標的 close=4113885 bid=${bid} ask=${ask} qty=3 decimal=2`,
  };
  await writeJson(path.join(stateDir, "capital_latest_quote_event.json"), quoteEvent);
  await fs.writeFile(
    path.join(stateDir, "capital_quote_events.jsonl"),
    `${JSON.stringify(quoteEvent)}\n`,
  );
}

async function writeMinimalRepo(repoRoot) {
  const scripts = Object.fromEntries(
    quoteScripts.map((script) => [script, "node placeholder.mjs"]),
  );
  await writeJson(path.join(repoRoot, "package.json"), { scripts });
  for (const relativePath of architectureFiles) {
    if (relativePath === "skills/capital-quotes/SKILL.md") {
      await writeText(
        path.join(repoRoot, relativePath),
        [
          "Does not log in to 群益.",
          "Does not place orders.",
          "Does not read or store account passwords",
          "Treats stale, blocked, incomplete, or cooldown states as strategy-gate denial.",
          "Emits a runtime event",
        ].join("\n"),
      );
    } else {
      await writeText(path.join(repoRoot, relativePath), "");
    }
  }
  await writeJson(path.join(repoRoot, "config", "capital-paper-hft-risk-controls.json"), {
    schema: "openclaw.capital.paper-hft-risk-controls.v1",
    mode: "paper",
    allowLiveTrading: false,
    writeBrokerOrders: false,
    requireManualLiveArm: true,
    requireQuoteArchitecturePassed: true,
    requireStrategyGateReady: true,
    requireFreshQuoteStatus: "fresh",
    maxDecisionQuoteAgeSeconds: 2,
    decisionLoopIntervalMs: 100,
    maxPaperIntentsPerSecond: 4,
    maxPaperIntentsPerMinute: 120,
    maxPositionContracts: 1,
    killSwitchRequired: true,
    paperLedgerRequired: true,
    allowedSymbols: ["MXFFX999"],
  });
  await writeJson(path.join(repoRoot, "config", "capital-paper-microstructure-strategy.json"), {
    schema: "openclaw.capital.paper-microstructure-strategy.v1",
    strategyName: "capital-paper-microstructure-probe",
    mode: "paper",
    enabled: true,
    allowLiveTrading: false,
    writeBrokerOrders: false,
    symbol: "MXFFX999",
    quantity: 1,
    maxSpreadTicks: 4,
    tickSize: 1,
    intentTtlMs: 750,
    signalPolicy: "passive_bid_probe",
    requirePositiveBidAsk: true,
    learning: {
      status: "candidate",
      minReadyCyclesForPaper: 2,
      blockAfterConsecutiveReadinessBlocks: 2,
      promoteLiveAutomatically: false,
    },
  });
  await writeJson(
    path.join(repoRoot, ".openclaw", "quote", "capital-quote-status.json"),
    baseStatus(),
  );
}

async function runFixture({ ageSeconds = 0, quoteOverrides = {} } = {}) {
  const repoRoot = await fs.mkdtemp(path.join(os.tmpdir(), "openclaw-capital-hft-trigger-"));
  const stateDir = path.join(repoRoot, "BrokerDesk", "state");
  await writeMinimalRepo(repoRoot);
  await writeBrokerDeskState(stateDir, brokerDeskTimestamp(new Date(), ageSeconds), quoteOverrides);
  const options = {
    repoRoot,
    stateDir,
    intervalMs: 100,
    maxCycles: 2,
    maxDurationMs: 1_000,
  };
  return { repoRoot, stateDir, options };
}

const freshFixture = await runFixture();
const fresh = await runCapitalPaperHftTrigger(freshFixture.options);
if (fresh.status !== "burst_executed" || fresh.burst?.paperIntents !== 2) {
  throw new Error(`fresh trigger should execute burst with two paper intents, got ${fresh.status}`);
}
const isExplicitFalse = (value) => Object.is(value, false);
if (
  !isExplicitFalse(fresh.loginAttempted) ||
  !isExplicitFalse(fresh.liveTradingEnabled) ||
  !isExplicitFalse(fresh.writeTradingEnabled) ||
  !isExplicitFalse(fresh.brokerOrderPathEnabled)
) {
  throw new Error("HFT trigger must remain no-login and no-trading");
}

const duplicate = await runCapitalPaperHftTrigger(freshFixture.options);
if (duplicate.status !== "idle_duplicate_quote" || duplicate.burst) {
  throw new Error("duplicate quote should not re-run burst");
}

const staleFixture = await runFixture({ ageSeconds: 10 });
const stale = await runCapitalPaperHftTrigger(staleFixture.options);
if (stale.status !== "blocked_quote_not_actionable" || stale.burst) {
  throw new Error("stale quote should be handled without burst");
}

const invalidBidAskFixture = await runFixture({ quoteOverrides: { bid: "0", ask: "0" } });
const invalidBidAsk = await runCapitalPaperHftTrigger(invalidBidAskFixture.options);
if (invalidBidAsk.status !== "blocked_quote_not_actionable" || invalidBidAsk.burst) {
  throw new Error("invalid bid/ask quote should be handled without burst");
}

process.stdout.write("CAPITAL_PAPER_HFT_TRIGGER_CHECK=OK\n");
