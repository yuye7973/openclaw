import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { readCapitalQuoteState, writeCapitalQuoteState } from "./openclaw-capital-quote-reader.mjs";

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

const tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), "openclaw-capital-quote-reader-"));
const stateDir = path.join(tempRoot, "BrokerDesk", "state");
const repoRoot = path.join(tempRoot, "repo");
await fs.mkdir(stateDir, { recursive: true });
await fs.mkdir(repoRoot, { recursive: true });

const bridge = {
  schema: "brokerdesk.openclaw.quote-bridge.v1",
  status: "connected",
  overallReady: true,
  quoteUniverseCount: 18404,
  currentBlockingCode: "",
  lastLogin1115Historical: true,
  providers: {
    capital: {
      brokerActionRequired: false,
      blockingCode: "",
    },
  },
};
const latest = {
  status: "connected",
  overallReady: true,
  brokerActionRequired: false,
  currentBlockingCode: "",
  quoteUniverseCount: 18404,
};
const targetEvent = {
  schema: "brokerdesk.capital.quote-event.v1",
  provider: "capital",
  receivedAt: brokerDeskTimestamp(new Date(), 1),
  eventSource: "SKQuoteLib.OnNotifyQuoteLONG",
  message:
    "收到群益報價事件: SKQuoteLib.OnNotifyQuoteLONG stockNo=TX00 name=台指近 close=4234000 bid=4234100 ask=4234600 qty=59461 decimal=2",
  stockNo: "TX00",
  stockName: "台指近",
  close: "4234000",
  bid: "4234100",
  ask: "4234600",
  qty: "59461",
};
const noiseEvent = {
  schema: "brokerdesk.capital.quote-event.v1",
  provider: "capital",
  receivedAt: brokerDeskTimestamp(new Date(), 0),
  eventSource: "SKQuoteLib.OnNotifyQuoteLONG",
  message:
    "收到群益報價事件: SKQuoteLib.OnNotifyQuoteLONG stockNo=TX12AM name=台指12 close=4299000 bid=4297000 ask=4299000 qty=18 decimal=2",
  stockNo: "TX12AM",
  stockName: "台指12",
  close: "4299000",
  bid: "4297000",
  ask: "4299000",
  qty: "18",
};
const a50Event = {
  schema: "brokerdesk.capital.quote-event.v1",
  provider: "capital",
  receivedAt: brokerDeskTimestamp(new Date(), 2),
  eventSource: "SKQuoteLib.OnNotifyQuoteLONG",
  message:
    "收到群益報價事件: SKQuoteLib.OnNotifyQuoteLONG stockNo=OJO05 name=FA5005 close=1570100 bid=1570000 ask=1570200 qty=9833 decimal=2",
  stockNo: "OJO05",
  stockName: "FA5005",
  close: "1570100",
  bid: "1570000",
  ask: "1570200",
  qty: "9833",
};

await fs.writeFile(path.join(stateDir, "openclaw_quote_bridge.json"), `${JSON.stringify(bridge, null, 2)}\n`);
await fs.writeFile(path.join(stateDir, "latest_quote_state.json"), `${JSON.stringify(latest, null, 2)}\n`);
await fs.writeFile(
  path.join(stateDir, "capital_latest_quote_event.json"),
  `${JSON.stringify(noiseEvent, null, 2)}\n`,
);
await fs.writeFile(
  path.join(stateDir, "capital_quote_events.jsonl"),
  `${JSON.stringify(targetEvent)}\n${JSON.stringify(a50Event)}\n${JSON.stringify(noiseEvent)}\n`,
);

const state = await readCapitalQuoteState({ repoRoot, stateDir, marketCode: "TXF" });
if (!state.ready) {
  throw new Error(`expected ready=true, got ${JSON.stringify(state)}`);
}
if (state.status !== "connected") {
  throw new Error(`expected connected, got ${state.status}`);
}
if (state.quote.eventSource !== "SKQuoteLib.OnNotifyQuoteLONG") {
  throw new Error(`unexpected event source: ${state.quote.eventSource}`);
}
if (state.quote.stockNo !== "TX00") {
  throw new Error(`unexpected stockNo: ${state.quote.stockNo}`);
}
if (state.selection?.targetStockNo !== "TX00") {
  throw new Error(`unexpected targetStockNo: ${state.selection?.targetStockNo}`);
}
if (state.selection?.marketCode !== "TXF") {
  throw new Error(`unexpected marketCode: ${state.selection?.marketCode}`);
}
if (!Array.isArray(state.selection?.targetStockNos) || !state.selection.targetStockNos.includes("TXF")) {
  throw new Error(`unexpected TXF alias coverage: ${JSON.stringify(state.selection?.targetStockNos)}`);
}
if (!Array.isArray(state.selection?.targetStockNos) || !state.selection.targetStockNos.includes("TX00")) {
  throw new Error(`unexpected targetStockNos: ${JSON.stringify(state.selection?.targetStockNos)}`);
}
if (!Number.isFinite(state.quoteEventAgeSeconds)) {
  throw new Error(`expected numeric quoteEventAgeSeconds, got ${state.quoteEventAgeSeconds}`);
}
if (!["fresh", "stale"].includes(state.quoteEventFreshness)) {
  throw new Error(`unexpected quoteEventFreshness: ${state.quoteEventFreshness}`);
}
if (state.quoteEventFreshnessThresholdSeconds !== 300) {
  throw new Error(`unexpected quoteEventFreshnessThresholdSeconds: ${state.quoteEventFreshnessThresholdSeconds}`);
}

const a50State = await readCapitalQuoteState({ repoRoot, stateDir, marketCode: "A50" });
if (!a50State.ready) {
  throw new Error(`expected A50 ready=true, got ${JSON.stringify(a50State)}`);
}
if (a50State.selection?.marketCode !== "A50") {
  throw new Error(`unexpected A50 marketCode: ${a50State.selection?.marketCode}`);
}
if (a50State.quote.stockNo !== "OJO05") {
  throw new Error(`unexpected A50 stockNo: ${a50State.quote.stockNo}`);
}
if (a50State.selection?.targetStockNo !== "OJO05") {
  throw new Error(`unexpected A50 targetStockNo: ${a50State.selection?.targetStockNo}`);
}
if (!Array.isArray(a50State.selection?.targetStockNos) || !a50State.selection.targetStockNos.includes("A50")) {
  throw new Error(`unexpected A50 targetStockNos: ${JSON.stringify(a50State.selection?.targetStockNos)}`);
}
if (!Array.isArray(a50State.selection?.targetStockNos) || !a50State.selection.targetStockNos.includes("FA5005")) {
  throw new Error(`unexpected FA5005 targetStockNos: ${JSON.stringify(a50State.selection?.targetStockNos)}`);
}
if (!Array.isArray(a50State.selection?.targetStockNos) || !a50State.selection.targetStockNos.includes("OJO05")) {
  throw new Error(`unexpected OJO05 targetStockNos: ${JSON.stringify(a50State.selection?.targetStockNos)}`);
}

const liveA50State = await readCapitalQuoteState({ repoRoot, marketCode: "A50" });
if (liveA50State.sourceStateDir !== "D:\\群益及元大API\\BrokerDesk\\state") {
  throw new Error(`unexpected live A50 sourceStateDir: ${liveA50State.sourceStateDir}`);
}
if (liveA50State.selection?.targetStockNo !== "OJO05") {
  throw new Error(`unexpected live A50 targetStockNo: ${liveA50State.selection?.targetStockNo}`);
}
if (liveA50State.quote.stockNo !== "OJO05") {
  throw new Error(`unexpected live A50 stockNo: ${liveA50State.quote.stockNo}`);
}
if (!liveA50State.selection?.matched) {
  throw new Error(`expected live A50 matched=true, got ${JSON.stringify(liveA50State.selection)}`);
}

const output = path.join(repoRoot, ".openclaw", "quote", "capital-quote-state.json");
await writeCapitalQuoteState(state, output);
await fs.access(output);
await fs.access(`${output}.sha256`);

process.stdout.write("CAPITAL_QUOTE_READER_CHECK=OK\n");
