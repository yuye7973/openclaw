import fs from "node:fs/promises";
import path from "node:path";

const OFFICIAL_CAPITAL_QUOTE_EVENTS = new Set([
  "SKQuoteLib.OnNotifyQuote",
  "SKQuoteLib.OnNotifyTicks",
  "SKQuoteLib.OnNotifyBest5",
  "SKQuoteLib.OnNotifyQuoteLONG",
  "SKQuoteLib.OnNotifyTicksLONG",
  "SKQuoteLib.OnNotifyBest5LONG",
]);

function defaultStatePath(repoRoot) {
  return path.join(repoRoot, ".openclaw", "quote", "capital-quote-state.json");
}

function parseArgs(argv) {
  const options = {
    statePath: defaultStatePath(process.cwd()),
    json: false,
    requireFresh: false,
    allowBlocked: false,
    maxQuoteAgeSeconds: Number(process.env.OPENCLAW_CAPITAL_QUOTE_FRESH_SECONDS ?? 300),
  };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--json") {
      options.json = true;
    } else if (arg === "--require-fresh") {
      options.requireFresh = true;
    } else if (arg === "--allow-blocked") {
      options.allowBlocked = true;
    } else if (arg === "--max-quote-age-seconds") {
      options.maxQuoteAgeSeconds = Number(argv[++index] ?? options.maxQuoteAgeSeconds);
    } else if (arg.startsWith("--max-quote-age-seconds=")) {
      options.maxQuoteAgeSeconds = Number(arg.slice("--max-quote-age-seconds=".length));
    } else if (arg === "--state") {
      options.statePath = argv[++index] ?? options.statePath;
    } else if (arg.startsWith("--state=")) {
      options.statePath = arg.slice("--state=".length);
    }
  }
  return options;
}

function assertReadyState(state, options) {
  const failures = [];
  const blockedAllowed = options.allowBlocked && state?.status === "blocked";
  if (state?.schema !== "openclaw.capital.quote-reader.v1") {
    failures.push("schema must be openclaw.capital.quote-reader.v1");
  }
  if (state?.readOnly !== true) {
    failures.push("readOnly must be true");
  }
  if (state?.loginAttempted !== false) {
    failures.push("loginAttempted must be false");
  }
  if (state?.liveTradingEnabled !== false || state?.writeTradingEnabled !== false) {
    failures.push("liveTradingEnabled/writeTradingEnabled must be false");
  }
  if (state?.status !== "connected" && !blockedAllowed) {
    failures.push("status must be connected");
  }
  if (blockedAllowed && state?.ready !== false) {
    failures.push("ready must be false when --allow-blocked accepts a blocked quote state");
  } else if (!blockedAllowed && state?.ready !== true) {
    failures.push("ready must be true");
  }
  if (state?.quoteProofStatus !== "confirmed") {
    failures.push("quoteProofStatus must be confirmed");
  }
  if (!OFFICIAL_CAPITAL_QUOTE_EVENTS.has(state?.quote?.eventSource ?? "")) {
    failures.push("quote.eventSource must be an official SKQuoteLib.OnNotify* event");
  }
  if (!state?.quote?.stockNo) {
    failures.push("quote.stockNo is required");
  }
  if (state?.health?.bridgeReady !== true && !blockedAllowed) {
    failures.push("health.bridgeReady must be true");
  }
  if (blockedAllowed) {
    if (state?.health?.brokerActionRequired !== true) {
      failures.push("health.brokerActionRequired must be true for an allowed blocked quote state");
    }
    if (!state?.health?.currentBlockingCode) {
      failures.push("health.currentBlockingCode is required for an allowed blocked quote state");
    }
  } else {
    if (state?.health?.brokerActionRequired !== false) {
      failures.push("health.brokerActionRequired must be false");
    }
    if (state?.health?.currentBlockingCode) {
      failures.push("health.currentBlockingCode must be empty");
    }
  }
  if (Number(state?.health?.quoteUniverseCount ?? 0) <= 0) {
    failures.push("health.quoteUniverseCount must be > 0");
  }
  if (options.requireFresh) {
    if (!Number.isFinite(options.maxQuoteAgeSeconds) || options.maxQuoteAgeSeconds <= 0) {
      failures.push("--max-quote-age-seconds must be > 0 when --require-fresh is used");
    } else if (!Number.isFinite(Number(state?.quoteEventAgeSeconds))) {
      failures.push("quoteEventAgeSeconds is required when --require-fresh is used");
    } else if (Number(state.quoteEventAgeSeconds) > options.maxQuoteAgeSeconds) {
      failures.push(`quote event is stale: age ${state.quoteEventAgeSeconds}s > ${options.maxQuoteAgeSeconds}s`);
    }
  }
  return failures;
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const statePath = path.resolve(options.statePath);
  const state = JSON.parse(await fs.readFile(statePath, "utf8"));
  const failures = assertReadyState(state, options);
  const result = {
    schema: "openclaw.capital.quote-reader.validation.v1",
    generatedAt: new Date().toISOString(),
    statePath,
    status: failures.length === 0 ? "pass" : "fail",
    failures,
    ready: failures.length === 0,
    allowBlocked: options.allowBlocked,
    acceptedBlockedState: options.allowBlocked && state?.status === "blocked" && failures.length === 0,
    quote: {
      eventSource: state?.quote?.eventSource ?? "",
      stockNo: state?.quote?.stockNo ?? "",
      receivedAt: state?.quote?.receivedAt ?? "",
      ageSeconds: state?.quoteEventAgeSeconds ?? null,
      freshness: state?.quoteEventFreshness ?? "unknown",
    },
  };
  if (options.json) {
    process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
  } else {
    process.stdout.write(
      failures.length === 0
        ? `CAPITAL_QUOTE_STATE_VALIDATE=OK\nstatePath=${statePath}\neventSource=${result.quote.eventSource}\nstockNo=${result.quote.stockNo}\nquoteEventFreshness=${result.quote.freshness}\nquoteEventAgeSeconds=${result.quote.ageSeconds ?? ""}\n`
        : `CAPITAL_QUOTE_STATE_VALIDATE=FAIL\n${failures.map((failure) => `- ${failure}`).join("\n")}\n`,
    );
  }
  process.exitCode = failures.length === 0 ? 0 : 1;
}

main().catch((error) => {
  process.stderr.write(`capital quote state validation failed: ${error instanceof Error ? error.message : String(error)}\n`);
  process.exitCode = 1;
});
