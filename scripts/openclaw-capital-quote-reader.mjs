import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { resolveBrokerDeskStateDir } from "./lib/brokerdesk-state-dir.mjs";

const OFFICIAL_CAPITAL_QUOTE_EVENTS = new Set([
  "SKQuoteLib.OnNotifyQuote",
  "SKQuoteLib.OnNotifyTicks",
  "SKQuoteLib.OnNotifyBest5",
  "SKQuoteLib.OnNotifyQuoteLONG",
  "SKQuoteLib.OnNotifyTicksLONG",
  "SKQuoteLib.OnNotifyBest5LONG",
]);

const DEFAULT_QUOTE_FRESHNESS_SECONDS = 2;
const DEFAULT_MARKET_REGISTRY_PATH = "D:\\OpenClawData\\trading\\global_futures_market_registry.json";
const CANONICAL_ONLY_MARKET_HINTS = new Set(["A50", "A50指熱2605", "OJO05", "FA5005"]);
const FALLBACK_MARKET_PROFILES = {
  A50: {
    marketCode: "A50",
    runtimeSymbol: "OJO05",
    productName: "A50指熱2605",
    venue: "SGX",
    assetClass: "equity index futures",
    quoteAdapter: "qyapi_x64",
    executionAdapter: "qyapi_x64",
    paperExecutable: true,
    liveExecutable: false,
    status: "paper_routable",
    notePath: "D:\\OpenClawData\\memory\\TRADE_LOGIC\\MARKET_PROFILE_A50.md",
    quoteAliases: ["A50", "A50指熱2605", "OJO05", "FA5005"],
    blockers: ["live_disabled"],
  },
};

function defaultBrokerDeskStateDir(preferCanonical = false) {
  return resolveBrokerDeskStateDir({ preferCanonical });
}

function quoteFreshnessThresholdSeconds() {
  const configured = Number(process.env.OPENCLAW_CAPITAL_QUOTE_FRESH_SECONDS ?? "");
  return Number.isFinite(configured) && configured > 0
    ? Math.floor(configured)
    : DEFAULT_QUOTE_FRESHNESS_SECONDS;
}

function defaultMarketRegistryPath() {
  return process.env.OPENCLAW_CAPITAL_MARKET_REGISTRY_PATH || DEFAULT_MARKET_REGISTRY_PATH;
}

function repoStatePath(repoRoot) {
  return path.join(repoRoot, ".openclaw", "quote", "capital-quote-state.json");
}

function sha256Text(text) {
  return crypto.createHash("sha256").update(text).digest("hex").toUpperCase();
}

async function readJsonIfExists(filePath) {
  try {
    return JSON.parse((await fs.readFile(filePath, "utf8")).replace(/^\uFEFF/, ""));
  } catch (error) {
    if (error && error.code === "ENOENT") {
      return null;
    }
    throw new Error(
      `Invalid JSON: ${filePath}: ${error instanceof Error ? error.message : String(error)}`,
      {
        cause: error,
      },
    );
  }
}

async function fileHashIfExists(filePath) {
  try {
    const content = await fs.readFile(filePath);
    return crypto.createHash("sha256").update(content).digest("hex").toUpperCase();
  } catch (error) {
    if (error && error.code === "ENOENT") {
      return "";
    }
    throw error;
  }
}

async function countJsonlLines(filePath) {
  try {
    const text = await fs.readFile(filePath, "utf8");
    return text.split(/\r?\n/).filter((line) => line.trim().length > 0).length;
  } catch (error) {
    if (error && error.code === "ENOENT") {
      return 0;
    }
    throw error;
  }
}

function normalizeBool(value) {
  return value === true;
}
function stringOr(value, fallback = "") {
  return typeof value === "string" ? value : fallback;
}


function parseBrokerDeskTimestamp(value) {
  if (typeof value !== "string" || value.trim().length === 0) {
    return null;
  }
  const match = /^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2}):(\d{2})(?:\.(\d{1,3}))?$/.exec(
    value.trim(),
  );
  if (match) {
    const [, year, month, day, hour, minute, second, millisecond = "0"] = match;
    return new Date(
      Number(year),
      Number(month) - 1,
      Number(day),
      Number(hour),
      Number(minute),
      Number(second),
      Number(millisecond.padEnd(3, "0")),
    );
  }
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function quoteEventAgeSeconds(receivedAt) {
  const received = parseBrokerDeskTimestamp(receivedAt);
  if (!received) {
    return null;
  }
  return Math.max(0, Math.floor((Date.now() - received.getTime()) / 1000));
}

function deriveTaipeiMarketSession(date = new Date()) {
  const taipeiNow = new Date(date.getTime() + 8 * 60 * 60 * 1000);
  const totalMinutes = taipeiNow.getUTCHours() * 60 + taipeiNow.getUTCMinutes();
  if (totalMinutes >= 15 * 60 || totalMinutes < 5 * 60) {
    return { marketSession: "night", marketSessionLabel: "夜盤", tradingOpen: true };
  }
  if (totalMinutes >= 8 * 60 + 45 && totalMinutes < 13 * 60 + 45) {
    return { marketSession: "day", marketSessionLabel: "日盤", tradingOpen: true };
  }
  return { marketSession: "closed", marketSessionLabel: "休市", tradingOpen: false };
}

function normalizeBridgeState(bridge, backgroundStatus, latestState) {
  const brokerActionRequired = normalizeBool(
    backgroundStatus?.brokerActionRequired ??
      bridge?.providers?.capital?.brokerActionRequired ??
      latestState?.brokerActionRequired,
  );
  return {
    status:
      typeof backgroundStatus?.status === "string"
        ? backgroundStatus.status
        : typeof bridge?.status === "string"
          ? bridge.status
          : "missing",
    overallReady:
        typeof backgroundStatus?.overallReady === "boolean"
          ? backgroundStatus.overallReady
          : normalizeBool(bridge?.overallReady),
      quoteEventConfirmed: normalizeBool(
        backgroundStatus?.capital?.quoteEventConfirmed ??
          bridge?.quoteEventConfirmed ??
          latestState?.quoteEventConfirmed,
      ),
    providers: {
      capital: {
        brokerActionRequired,
      },
    },
    brokerActionRequired,
    currentBlockingCode:
      typeof backgroundStatus?.currentBlockingCode === "string"
        ? backgroundStatus.currentBlockingCode
        : typeof bridge?.currentBlockingCode === "string"
          ? bridge.currentBlockingCode
          : typeof latestState?.currentBlockingCode === "string"
            ? latestState.currentBlockingCode
            : "",
    quoteUniverseCount: Number(
        backgroundStatus?.quoteUniverseCount ?? bridge?.quoteUniverseCount ?? latestState?.quoteUniverseCount ?? 0,
      ),
      lastHeartbeatAt:
        typeof backgroundStatus?.lastHeartbeatAt === "string"
          ? backgroundStatus.lastHeartbeatAt
          : typeof bridge?.lastHeartbeatAt === "string"
            ? bridge.lastHeartbeatAt
            : typeof latestState?.lastHeartbeatAt === "string"
              ? latestState.lastHeartbeatAt
              : "",
      keepAliveUntil:
        typeof backgroundStatus?.keepAliveUntil === "string"
          ? backgroundStatus.keepAliveUntil
          : typeof bridge?.keepAliveUntil === "string"
            ? bridge.keepAliveUntil
            : typeof latestState?.keepAliveUntil === "string"
              ? latestState.keepAliveUntil
              : "",
      capitalAccountSet: normalizeBool(
        backgroundStatus?.capital?.accountSet ?? bridge?.capital?.accountSet ?? latestState?.capitalAccountSet,
      ),
      capitalAttempted: normalizeBool(
        backgroundStatus?.capital?.attempted ?? bridge?.capital?.attempted ?? latestState?.capitalAttempted,
      ),
      capitalMessage:
        typeof backgroundStatus?.capital?.message === "string"
          ? backgroundStatus.capital.message
          : typeof bridge?.capital?.message === "string"
            ? bridge.capital.message
            : typeof latestState?.capitalMessage === "string"
              ? latestState.capitalMessage
              : "",
      lastLogin1115Historical: normalizeBool(
        backgroundStatus?.lastLogin1115Historical ??
          bridge?.lastLogin1115Historical ??
          latestState?.lastLogin1115Historical,
      ),};
}

function normalizeStockNo(value) {
  return typeof value === "string" ? value.trim().toUpperCase() : "";
}

function normalizeTargetStockNos(values) {
  const seen = new Set();
  const normalized = [];
  for (const value of values) {
    const candidate = normalizeStockNo(value);
    if (!candidate || seen.has(candidate)) {
      continue;
    }
    seen.add(candidate);
    normalized.push(candidate);
  }
  return normalized;
}

function normalizeMarketCode(value) {
  return typeof value === "string" ? value.trim().toUpperCase() : "";
}

function shouldPreferCanonicalBrokerDeskStateDir(options) {
  const candidates = [];
  if (typeof options?.marketCode === "string") {
    candidates.push(options.marketCode);
  }
  if (typeof options?.targetStockNo === "string") {
    candidates.push(options.targetStockNo);
  }
  if (Array.isArray(options?.targetStockNos)) {
    candidates.push(...options.targetStockNos);
  }
  if (Array.isArray(options?.quoteAliases)) {
    candidates.push(...options.quoteAliases);
  }
  for (const value of candidates) {
    const candidate = normalizeStockNo(value);
    if (CANONICAL_ONLY_MARKET_HINTS.has(candidate)) {
      return true;
    }
  }
  return false;
}

async function readMarketRegistry(filePath) {
  try {
    return JSON.parse(await fs.readFile(filePath, "utf8"));
  } catch (error) {
    if (error && error.code === "ENOENT") {
      return null;
    }
    throw new Error(
      `Invalid market registry JSON: ${filePath}: ${
        error instanceof Error ? error.message : String(error)
      }`,
      {
        cause: error,
      },
    );
  }
}

function resolveQuoteTargetNos({
  targetStockNo,
  targetStockNos,
  quoteAliases,
  marketCode,
  marketRegistry,
}) {
  const candidates = [];
  if (Array.isArray(targetStockNos)) {
    candidates.push(...targetStockNos);
  }
  if (Array.isArray(quoteAliases)) {
    candidates.push(...quoteAliases);
  }
  if (targetStockNo) {
    candidates.push(targetStockNo);
  }
  const normalizedMarketCode = normalizeMarketCode(marketCode);
  const marketProfile = normalizedMarketCode
    ? marketRegistry?.markets?.[normalizedMarketCode] ??
      FALLBACK_MARKET_PROFILES[normalizedMarketCode] ??
      null
    : null;
  if (marketProfile) {
    if (Array.isArray(marketProfile.quoteAliases)) {
      candidates.push(...marketProfile.quoteAliases);
    }
    candidates.push(marketProfile.runtimeSymbol);
    candidates.push(marketProfile.marketCode);
  }
  return {
    targetStockNos: normalizeTargetStockNos(candidates),
    marketCode: normalizedMarketCode,
    marketProfile,
  };
}

function eventMatchesAnyTarget(event, targetStockNosSet) {
  return targetStockNosSet.has(normalizeStockNo(event?.stockNo));
}

async function selectLatestQuoteEvent({ latestEvent, eventStreamPath, targetStockNos }) {
  const normalizedTargetStockNos = normalizeTargetStockNos(targetStockNos ?? []);
  const normalizedTargetStockNosSet = new Set(normalizedTargetStockNos);
  const normalizedLatestStockNo = normalizeStockNo(latestEvent?.stockNo);

  if (normalizedTargetStockNos.length === 0) {
    return {
      selectedEvent: latestEvent ?? null,
      selectedFromEventStream: false,
      targetStockNo: "",
      targetStockNos: [],
      matched: latestEvent != null,
      source: latestEvent ? "latest_event" : "missing",
      reason: latestEvent ? "latest quote event" : "latest quote event missing",
    };
  }

  if (normalizedTargetStockNosSet.has(normalizedLatestStockNo)) {
    return {
      selectedEvent: latestEvent ?? null,
      selectedFromEventStream: false,
      targetStockNo: normalizedLatestStockNo,
      targetStockNos: normalizedTargetStockNos,
      matched: latestEvent != null,
      source: latestEvent ? "latest_event" : "missing",
      reason: latestEvent ? "latest quote event matches target stock" : "latest quote event missing",
    };
  }

  try {
    const text = await fs.readFile(eventStreamPath, "utf8");
    const lines = text.split(/\r?\n/);
    for (let index = lines.length - 1; index >= 0; index -= 1) {
      const line = lines[index].trim();
      if (!line) {
        continue;
      }
      let event;
      try {
        event = JSON.parse(line);
      } catch {
        continue;
      }
      if (!OFFICIAL_CAPITAL_QUOTE_EVENTS.has(event?.eventSource)) {
        continue;
      }
      if (!eventMatchesAnyTarget(event, normalizedTargetStockNosSet)) {
        continue;
      }
      return {
        selectedEvent: event,
        selectedFromEventStream: true,
        targetStockNo: normalizeStockNo(event?.stockNo),
        targetStockNos: normalizedTargetStockNos,
        matched: true,
        source: "event_stream",
        reason: "matched target stockNo from quote event stream",
      };
    }
  } catch (error) {
    if (error && error.code !== "ENOENT") {
      throw error;
    }
  }

  return {
    selectedEvent: null,
    selectedFromEventStream: true,
    targetStockNo: normalizedTargetStockNos[0] ?? "",
    targetStockNos: normalizedTargetStockNos,
    matched: false,
    source: "event_stream",
    reason: "target stockNo not found in official quote event stream",
  };
}

function buildReaderState({
  stateDir,
  bridge,
  latestState,
  latestEvent,
  selectedEvent,
  selection,
  eventCount,
  latestEventHash,
  eventStreamHash,
}) {
  const bridgeReady = normalizeBool(bridge?.overallReady);
  const bridgeStatus = typeof bridge?.status === "string" ? bridge.status : "missing";
  const eventSource = typeof selectedEvent?.eventSource === "string" ? selectedEvent.eventSource : "";
  const quoteEventOfficial = OFFICIAL_CAPITAL_QUOTE_EVENTS.has(eventSource);
  const ageSeconds = quoteEventAgeSeconds(selectedEvent?.receivedAt);
  const freshnessThresholdSeconds = quoteFreshnessThresholdSeconds();
  const session = deriveTaipeiMarketSession();
  const quoteEventFreshness =
    ageSeconds === null ? "unknown" : ageSeconds <= freshnessThresholdSeconds ? "fresh" : "stale";
  const brokerActionRequired = normalizeBool(
    bridge?.providers?.capital?.brokerActionRequired ?? latestState?.brokerActionRequired,
  );
  const currentBlockingCode =
    typeof bridge?.currentBlockingCode === "string"
      ? bridge.currentBlockingCode
      : typeof latestState?.currentBlockingCode === "string"
        ? latestState.currentBlockingCode
        : "";
  const quoteEventReady = quoteEventOfficial && quoteEventFreshness === "fresh";
  const ready =
    quoteEventReady && bridgeReady && !brokerActionRequired && !currentBlockingCode;
  const status = ready ? "connected" : bridgeStatus === "missing" ? "missing" : "blocked";
  const reason = ready
    ? "群益報價事件已由 OpenClaw reader 收取；目前沒有 active blocking code。"
    : !quoteEventOfficial
      ? "尚未收取指定 stockNo 的官方 SKQuoteLib 報價事件。"
      : !bridgeReady
        ? "報價事件存在，但 BrokerDesk bridge 尚未 connected 或 overallReady=false."
        : !quoteEventReady
        ? "報價事件存在，但 freshness 尚未達到即時門檻。"
        : brokerActionRequired || currentBlockingCode
          ? "報價事件存在，但 BrokerDesk bridge 仍標示 brokerActionRequired 或 currentBlockingCode。"
          : "BrokerDesk bridge 尚未 connected.";
  return {
    schema: "openclaw.capital.quote-reader.v1",
    generatedAt: new Date().toISOString(),
    provider: "capital",
    source: "BrokerDesk",
    sourceStateDir: stateDir,
    readOnly: true,
    loginAttempted: false,
    liveTradingEnabled: false,
    writeTradingEnabled: false,
    status,
    ready,
    reason,
    quoteProofStatus: quoteEventOfficial ? "confirmed" : "not_confirmed",
    quoteEventCount: eventCount,
    quoteEventAgeSeconds: ageSeconds,
    quoteEventFreshness,
    quoteEventFreshnessThresholdSeconds: freshnessThresholdSeconds,
    quote: {
      receivedAt: selectedEvent?.receivedAt ?? "",
      eventSource,
      stockNo: selectedEvent?.stockNo ?? "",
      stockName: selectedEvent?.stockName ?? "",
      close: selectedEvent?.close ?? "",
      bid: selectedEvent?.bid ?? "",
      ask: selectedEvent?.ask ?? "",
      qty: selectedEvent?.qty ?? "",
      message: selectedEvent?.message ?? "",
    },
    selection: {
      targetStockNo: selection?.targetStockNo ?? "",
      targetStockNos: Array.isArray(selection?.targetStockNos) ? selection.targetStockNos : [],
      marketCode: selection?.marketCode ?? "",
      source: selection?.source ?? "",
      matched: selection?.matched === true,
      selectedFromEventStream: selection?.selectedFromEventStream === true,
      latestOverallStockNo: latestEvent?.stockNo ?? "",
      latestOverallReceivedAt: latestEvent?.receivedAt ?? "",
    },
    session,
    health: {
      bridgeStatus,
      bridgeReady,
      brokerActionRequired,
      currentBlockingCode,
      quoteUniverseCount: Number(
        bridge?.quoteUniverseCount ?? latestState?.quoteUniverseCount ?? 0,
      ),
      overallReady: normalizeBool(bridge?.overallReady),
      quoteEventConfirmed: normalizeBool(bridge?.quoteEventConfirmed),
      lastHeartbeatAt: stringOr(bridge?.lastHeartbeatAt, ""),
      keepAliveUntil: stringOr(bridge?.keepAliveUntil, ""),
      capitalAccountSet: normalizeBool(bridge?.capitalAccountSet),
      capitalAttempted: normalizeBool(bridge?.capitalAttempted),
      capitalMessage: stringOr(bridge?.capitalMessage, ""),
      lastLogin1115Historical: normalizeBool(
        bridge?.lastLogin1115Historical ?? latestState?.lastLogin1115Historical,
      ),
    },
    files: {
      openClawQuoteBridge: path.join(stateDir, "openclaw_quote_bridge.json"),
      latestQuoteState: path.join(stateDir, "latest_quote_state.json"),
      latestQuoteEvent: path.join(stateDir, "capital_latest_quote_event.json"),
      quoteEvents: path.join(stateDir, "capital_quote_events.jsonl"),
      latestQuoteEventSha256: latestEventHash,
      quoteEventsSha256: eventStreamHash,
    },
  };
}

export async function readCapitalQuoteState(options = {}) {
  const explicitStateDir =
    typeof options.stateDir === "string" && options.stateDir.trim().length > 0
      ? options.stateDir
      : "";
  const stateDir = path.resolve(
    explicitStateDir || defaultBrokerDeskStateDir(shouldPreferCanonicalBrokerDeskStateDir(options)),
  );
  const marketRegistryPath = path.resolve(
    options.marketRegistryPath && String(options.marketRegistryPath).trim().length > 0
      ? options.marketRegistryPath
      : defaultMarketRegistryPath(),
  );
  const marketRegistry = await readMarketRegistry(marketRegistryPath);
  const resolvedTargets = resolveQuoteTargetNos({
    targetStockNo: options.targetStockNo ?? process.env.OPENCLAW_CAPITAL_TARGET_STOCK_NO ?? "",
    targetStockNos: options.targetStockNos ?? [],
    quoteAliases: options.quoteAliases ?? [],
    marketCode: options.marketCode ?? process.env.OPENCLAW_CAPITAL_MARKET_CODE ?? "",
    marketRegistry,
  });
  const bridgePath = path.join(stateDir, "openclaw_quote_bridge.json");
  const backgroundStatusPath = path.join(stateDir, "background_quotes_status.json");
  const latestStatePath = path.join(stateDir, "latest_quote_state.json");
  const latestEventPath = path.join(stateDir, "capital_latest_quote_event.json");
  const eventStreamPath = path.join(stateDir, "capital_quote_events.jsonl");
  const [bridge, backgroundStatus, latestState, latestEvent, eventCount, latestEventHash, eventStreamHash] =
    await Promise.all([
      readJsonIfExists(bridgePath),
      readJsonIfExists(backgroundStatusPath),
      readJsonIfExists(latestStatePath),
      readJsonIfExists(latestEventPath),
      countJsonlLines(eventStreamPath),
      fileHashIfExists(latestEventPath),
      fileHashIfExists(eventStreamPath),
  ]);
  const selection = await selectLatestQuoteEvent({
    latestEvent,
    eventStreamPath,
    targetStockNos: resolvedTargets.targetStockNos,
  });
  selection.marketCode = resolvedTargets.marketCode;
  selection.targetStockNos = resolvedTargets.targetStockNos;
  return buildReaderState({
    stateDir,
    bridge: normalizeBridgeState(bridge, backgroundStatus, latestState),
    latestState,
    latestEvent,
    selectedEvent: selection.selectedEvent,
    selection,
    eventCount,
    latestEventHash,
    eventStreamHash,
  });
}

export async function writeCapitalQuoteState(state, outputPath) {
  const text = `${JSON.stringify(state, null, 2)}\n`;
  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  await fs.writeFile(outputPath, text, "utf8");
  await fs.writeFile(`${outputPath}.sha256`, `${sha256Text(text)}\n`, "ascii");
  return outputPath;
}

function parseArgs(argv) {
  const options = {
    json: false,
    writeState: false,
    repoRoot: process.cwd(),
    stateDir: "",
    targetStockNo: "",
    targetStockNos: [],
    quoteAliases: [],
    marketCode: "",
    marketRegistryPath: defaultMarketRegistryPath(),
    output: "",
  };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--json") {
      options.json = true;
    } else if (arg === "--write-state") {
      options.writeState = true;
    } else if (arg === "--repo-root") {
      options.repoRoot = argv[++index] ?? options.repoRoot;
    } else if (arg.startsWith("--repo-root=")) {
      options.repoRoot = arg.slice("--repo-root=".length);
    } else if (arg === "--state-dir") {
      options.stateDir = argv[++index] ?? options.stateDir;
    } else if (arg.startsWith("--state-dir=")) {
      options.stateDir = arg.slice("--state-dir=".length);
    } else if (arg === "--stock-no" || arg === "--target-stock-no") {
      options.targetStockNo = argv[++index] ?? options.targetStockNo;
    } else if (arg.startsWith("--stock-no=")) {
      options.targetStockNo = arg.slice("--stock-no=".length);
    } else if (arg.startsWith("--target-stock-no=")) {
      options.targetStockNo = arg.slice("--target-stock-no=".length);
    } else if (arg === "--target-stock-nos") {
      options.targetStockNos = String(argv[++index] ?? "")
        .split(",")
        .map((value) => value.trim())
        .filter(Boolean);
    } else if (arg.startsWith("--target-stock-nos=")) {
      options.targetStockNos = arg
        .slice("--target-stock-nos=".length)
        .split(",")
        .map((value) => value.trim())
        .filter(Boolean);
    } else if (arg === "--quote-aliases") {
      options.quoteAliases = String(argv[++index] ?? "")
        .split(",")
        .map((value) => value.trim())
        .filter(Boolean);
    } else if (arg.startsWith("--quote-aliases=")) {
      options.quoteAliases = arg
        .slice("--quote-aliases=".length)
        .split(",")
        .map((value) => value.trim())
        .filter(Boolean);
    } else if (arg === "--market-code") {
      options.marketCode = argv[++index] ?? options.marketCode;
    } else if (arg.startsWith("--market-code=")) {
      options.marketCode = arg.slice("--market-code=".length);
    } else if (arg === "--market-registry") {
      options.marketRegistryPath = argv[++index] ?? options.marketRegistryPath;
    } else if (arg.startsWith("--market-registry=")) {
      options.marketRegistryPath = arg.slice("--market-registry=".length);
    } else if (arg === "--output") {
      options.output = argv[++index] ?? options.output;
    } else if (arg.startsWith("--output=")) {
      options.output = arg.slice("--output=".length);
    }
  }
  return options;
}

function formatSummary(state, outputPath) {
  return [
    "OpenClaw Capital quote reader",
    `status=${state.status}`,
    `ready=${state.ready}`,
    `quoteProofStatus=${state.quoteProofStatus}`,
    `eventSource=${state.quote.eventSource || "N/A"}`,
    `stockNo=${state.quote.stockNo || "N/A"}`,
    `targetStockNo=${state.selection?.targetStockNo || ""}`,
    `marketCode=${state.selection?.marketCode || ""}`,
    `targetStockNos=${Array.isArray(state.selection?.targetStockNos) ? state.selection.targetStockNos.join(",") : ""}`,
    `session=${state.session?.marketSessionLabel || "N/A"}`,
    `brokerActionRequired=${state.health.brokerActionRequired}`,
    `currentBlockingCode=${state.health.currentBlockingCode || ""}`,
    outputPath ? `stateFile=${outputPath}` : "",
  ]
    .filter(Boolean)
    .join("\n");
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const state = await readCapitalQuoteState(options);
  const outputPath = options.writeState
    ? await writeCapitalQuoteState(
        state,
        path.resolve(options.output || repoStatePath(path.resolve(options.repoRoot))),
      )
    : "";
  if (options.json) {
    process.stdout.write(`${JSON.stringify({ ...state, outputPath }, null, 2)}\n`);
    return;
  }
  process.stdout.write(`${formatSummary(state, outputPath)}\n`);
}

const invokedPath = process.argv[1] ? path.resolve(process.argv[1]) : "";
if (invokedPath === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    process.stderr.write(
      `capital quote reader failed: ${error instanceof Error ? error.message : String(error)}\n`,
    );
    process.exitCode = 1;
  });
}
