import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import {
  buildCapitalQuoteRuntimeEvent,
  writeCapitalQuoteRuntimeEvent,
} from "./openclaw-capital-quote-runtime-event.mjs";

const tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), "openclaw-capital-quote-event-"));
const eventDir = path.join(tempRoot, ".openclaw", "runtime-events");

const readyStatus = {
  status: "ready",
  ready: true,
  reason: "ready",
  readOnly: true,
  loginAttempted: false,
  liveTradingEnabled: false,
  writeTradingEnabled: false,
  strategyGate: {
    ready: true,
    status: "allow_read_only_strategy_context",
  },
  quoteProof: {
    status: "confirmed",
    freshness: "fresh",
    freshnessStatus: "fresh",
    freshnessAgeSeconds: 60,
    latestStock: "MXFFX999",
  },
  monitors: {
    allReadOnlyMonitorsReady: true,
  },
  nextSafeTask: "monitor only",
};

const readyEvent = buildCapitalQuoteRuntimeEvent(readyStatus);
if (readyEvent.eventType !== "capital.quote.ready") {
  throw new Error(`unexpected ready event type: ${readyEvent.eventType}`);
}
if (!Object.is(readyEvent.summary.strategyGateReady, true)) {
  throw new Error("expected ready strategy gate");
}
if (!Object.is(readyEvent.readOnly, true) || !Object.is(readyEvent.loginAttempted, false)) {
  throw new Error("event safety flags must stay read-only and no-login");
}

const paths = await writeCapitalQuoteRuntimeEvent(readyEvent, eventDir);
await fs.access(paths.latestPath);
await fs.access(`${paths.latestPath}.sha256`);
const latestEvent = JSON.parse(await fs.readFile(paths.latestPath, "utf8"));
if (latestEvent.files?.latestPath !== paths.latestPath) {
  throw new Error("latest event must include its own latestPath");
}
if (latestEvent.files?.streamPath !== paths.streamPath) {
  throw new Error("latest event must include its own streamPath");
}
const streamText = await fs.readFile(paths.streamPath, "utf8");
if (!streamText.includes("capital.quote.ready")) {
  throw new Error("expected ready event in JSONL stream");
}

const staleEvent = buildCapitalQuoteRuntimeEvent({
  ...readyStatus,
  status: "stale",
  ready: false,
  strategyGate: {
    ready: false,
    status: "deny_strategy_context",
  },
  quoteProof: {
    ...readyStatus.quoteProof,
    freshnessStatus: "stale",
    freshnessAgeSeconds: 999999,
  },
});
if (staleEvent.eventType !== "capital.quote.stale") {
  throw new Error(`unexpected stale event type: ${staleEvent.eventType}`);
}
if (!Object.is(staleEvent.summary.strategyGateReady, false)) {
  throw new Error("expected stale strategy gate denial");
}

const blocked1115Event = buildCapitalQuoteRuntimeEvent({
  ...readyStatus,
  status: "blocked_1115",
  ready: false,
  strategyGate: {
    ready: false,
    status: "deny_strategy_context",
  },
});
if (blocked1115Event.eventType !== "capital.quote.blocked_1115") {
  throw new Error(`unexpected blocked_1115 event type: ${blocked1115Event.eventType}`);
}

process.stdout.write("CAPITAL_QUOTE_RUNTIME_EVENT_CHECK=OK\n");
