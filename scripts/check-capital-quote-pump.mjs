import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { runCapitalQuotePump } from "./openclaw-capital-quote-pump.mjs";

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

function baseStatus() {
  return {
    schema: "openclaw.capital.quote-status.v1",
    readOnly: true,
    loginAttempted: false,
    liveTradingEnabled: false,
    writeTradingEnabled: false,
    status: "ready",
    ready: true,
    strategyGate: {
      ready: true,
      status: "allow_read_only_strategy_context",
    },
    guard: {
      active: false,
      lastCode: "",
      nextAllowedAt: "",
    },
    quoteProof: {
      status: "confirmed",
      freshness: "fresh",
      latestStock: "TX00AM",
      latestStockName: "台指近",
      freshnessStatus: "fresh",
      freshnessAgeSeconds: 1,
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

async function writeBrokerDeskState(stateDir, targetReceivedAt, noiseReceivedAt) {
  await fs.mkdir(stateDir, { recursive: true });
  await fs.writeFile(
    path.join(stateDir, "openclaw_quote_bridge.json"),
    `${JSON.stringify(
      {
        status: "connected",
        overallReady: true,
        providers: {
          capital: {
            brokerActionRequired: false,
          },
        },
        currentBlockingCode: "",
        quoteUniverseCount: 18404,
      },
      null,
      2,
    )}\n`,
    "utf8",
  );
  await fs.writeFile(
    path.join(stateDir, "latest_quote_state.json"),
    `${JSON.stringify(
      {
        brokerActionRequired: false,
        currentBlockingCode: "",
        quoteUniverseCount: 18404,
      },
      null,
      2,
    )}\n`,
    "utf8",
  );
  const quoteEvent = {
    receivedAt: targetReceivedAt,
    eventSource: "SKQuoteLib.OnNotifyQuoteLONG",
    stockNo: "TX00",
    stockName: "台指近",
    close: "4234000",
    bid: "4234100",
    ask: "4234600",
    qty: "59461",
    message:
      "收到群益報價事件: SKQuoteLib.OnNotifyQuoteLONG stockNo=TX00 name=台指近 close=4234000 bid=4234100 ask=4234600 qty=59461 decimal=2",
  };
  const noiseEvent = {
    receivedAt: noiseReceivedAt,
    eventSource: "SKQuoteLib.OnNotifyQuoteLONG",
    stockNo: "TX12AM",
    stockName: "台指12",
    close: "4299000",
    bid: "4297000",
    ask: "4299000",
    qty: "18",
    message:
      "收到群益報價事件: SKQuoteLib.OnNotifyQuoteLONG stockNo=TX12AM name=台指12 close=4299000 bid=4297000 ask=4299000 qty=18 decimal=2",
  };
  await fs.writeFile(
    path.join(stateDir, "capital_latest_quote_event.json"),
    `${JSON.stringify(noiseEvent, null, 2)}\n`,
    "utf8",
  );
  await fs.writeFile(
    path.join(stateDir, "capital_quote_events.jsonl"),
    `${JSON.stringify(quoteEvent)}\n${JSON.stringify(noiseEvent)}\n`,
    "utf8",
  );
}

async function runFixture(ageSeconds) {
  const repoRoot = await fs.mkdtemp(path.join(os.tmpdir(), "openclaw-capital-pump-"));
  const stateDir = path.join(repoRoot, "BrokerDesk", "state");
  const statusPath = path.join(repoRoot, ".openclaw", "quote", "capital-quote-status.json");
  const riskConfigPath = path.join(repoRoot, "config", "capital-paper-hft-risk-controls.json");
  await fs.mkdir(path.dirname(statusPath), { recursive: true });
  await fs.mkdir(path.dirname(riskConfigPath), { recursive: true });
  await fs.writeFile(statusPath, `${JSON.stringify(baseStatus(), null, 2)}\n`, "utf8");
  await fs.writeFile(
    riskConfigPath,
    `${JSON.stringify(
      {
        schema: "openclaw.capital.paper-hft-risk-controls.v1",
        maxDecisionQuoteAgeSeconds: 2,
      },
      null,
      2,
    )}\n`,
    "utf8",
  );
  await writeBrokerDeskState(
    stateDir,
    brokerDeskTimestamp(new Date(), ageSeconds),
    brokerDeskTimestamp(new Date(), Math.max(0, ageSeconds - 1)),
  );
  return runCapitalQuotePump({
    repoRoot,
    stateDir,
    marketCode: "TXF",
  });
}

const fresh = await runFixture(1);
if (fresh.report.status !== "ready" || fresh.event.eventType !== "capital.quote.ready") {
  throw new Error("fresh BrokerDesk quote event should pump ready runtime event");
}
if (fresh.status.quoteProof.freshnessAgeSeconds > 2) {
  throw new Error("fresh pumped status should respect max quote age");
}
if (
  !Object.is(fresh.report.loginAttempted, false) ||
  !Object.is(fresh.report.writeTradingEnabled, false)
) {
  throw new Error("quote pump must stay no-login and no-trading");
}

const stale = await runFixture(10);
if (stale.report.status !== "stale" || stale.event.eventType !== "capital.quote.stale") {
  throw new Error("stale BrokerDesk quote event should pump stale runtime event");
}
if (!Object.is(stale.status.strategyGate.ready, false)) {
  throw new Error("stale pump status must deny strategy gate");
}

const staleAgain = await runCapitalQuotePump({
  repoRoot: path.dirname(path.dirname(path.dirname(stale.report.files.statusPath))),
  stateDir: stale.readerState.sourceStateDir,
});
if (staleAgain.report.status !== "stale" || staleAgain.event.eventType !== "capital.quote.stale") {
  throw new Error("re-running a stale pumped status must stay stale, not generic blocked");
}

process.stdout.write("CAPITAL_QUOTE_PUMP_CHECK=OK\n");
