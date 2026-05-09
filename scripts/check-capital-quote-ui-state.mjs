import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import {
  buildCapitalQuoteUiState,
  readCapitalQuoteUiState,
  writeCapitalQuoteUiState,
} from "./openclaw-capital-quote-ui-state.mjs";

function sampleEvent(status, overrides = {}) {
  return {
    schema: "openclaw.runtime.event.v1",
    generatedAt: "2026-05-06T17:11:06.321Z",
    eventType: `capital.quote.${status}`,
    source: "capital-quotes",
    provider: "capital",
    readOnly: true,
    loginAttempted: false,
    liveTradingEnabled: false,
    writeTradingEnabled: false,
    summary: {
      status,
      ready: status === "ready",
      reason: "fixture",
      strategyGateReady: status === "ready",
      strategyGateStatus:
        status === "ready" ? "allow_read_only_strategy_context" : "deny_strategy_context",
      freshnessStatus: status === "stale" ? "stale" : "fresh",
      freshnessAgeSeconds: status === "stale" ? 999999 : 60,
      latestStock: "MXFFX999",
      quoteProofStatus: "confirmed",
      quoteProofFreshness: status === "stale" ? "stale" : "fresh",
      allReadOnlyMonitorsReady: status === "ready",
      nextSafeTask: "monitor only",
      ...overrides.summary,
    },
    files: {
      latestPath: "fixture-latest.json",
      streamPath: "fixture-events.jsonl",
      ...overrides.files,
    },
  };
}

const readyState = buildCapitalQuoteUiState(sampleEvent("ready"), {
  eventPath: "fixture-ready.json",
});
if (readyState.status !== "ready" || !Object.is(readyState.ready, true)) {
  throw new Error("ready event must produce ready UI state");
}
if (readyState.badge.tone !== "success" || !Object.is(readyState.action.strategyAllowed, true)) {
  throw new Error("ready UI state must allow read-only strategy context");
}
if (!Object.is(readyState.readOnly, true) || !Object.is(readyState.loginAttempted, false)) {
  throw new Error("UI state safety flags must stay read-only and no-login");
}

const staleState = buildCapitalQuoteUiState(sampleEvent("stale"));
if (staleState.badge.tone !== "warning" || !Object.is(staleState.action.strategyAllowed, false)) {
  throw new Error("stale UI state must warn and deny strategy context");
}

const blocked1115State = buildCapitalQuoteUiState(sampleEvent("blocked_1115"));
if (blocked1115State.badge.label !== "1115 冷卻中") {
  throw new Error("blocked_1115 UI state must expose the cooldown badge");
}
if (!blocked1115State.action.operatorAction.includes("禁止 API 登入")) {
  throw new Error("blocked_1115 UI action must forbid API login");
}

const tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), "openclaw-capital-quote-ui-"));
const eventPath = path.join(tempRoot, "capital-quote-latest.json");
await fs.writeFile(eventPath, `${JSON.stringify(sampleEvent("ready"), null, 2)}\n`, "utf8");
const readState = await readCapitalQuoteUiState({ repoRoot: tempRoot, eventPath });
if (readState.sourceEventPath !== eventPath) {
  throw new Error("read UI state must include sourceEventPath");
}

const outputPath = path.join(tempRoot, ".openclaw", "ui", "capital-quote-ui-state.json");
await writeCapitalQuoteUiState(readState, outputPath);
await fs.access(outputPath);
await fs.access(`${outputPath}.sha256`);
const outputState = JSON.parse(await fs.readFile(outputPath, "utf8"));
if (outputState.schema !== "openclaw.capital.quote-ui-state.v1") {
  throw new Error("written UI state schema mismatch");
}

process.stdout.write("CAPITAL_QUOTE_UI_STATE_CHECK=OK\n");
