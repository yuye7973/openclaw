import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { readCapitalQuoteStatus } from "./openclaw-capital-quote-status.mjs";

function defaultEventDir(repoRoot) {
  return path.join(repoRoot, ".openclaw", "runtime-events");
}

function sha256Text(text) {
  return crypto.createHash("sha256").update(text).digest("hex").toUpperCase();
}

function eventTypeForStatus(status) {
  switch (status) {
    case "ready":
      return "capital.quote.ready";
    case "stale":
      return "capital.quote.stale";
    case "blocked_1115":
      return "capital.quote.blocked_1115";
    case "blocked":
      return "capital.quote.blocked";
    case "incomplete":
      return "capital.quote.incomplete";
    default:
      return "capital.quote.degraded";
  }
}

export function buildCapitalQuoteRuntimeEvent(status) {
  const eventType = eventTypeForStatus(status.status);
  return {
    schema: "openclaw.runtime.event.v1",
    generatedAt: new Date().toISOString(),
    eventType,
    source: "capital-quotes",
    provider: "capital",
    severity:
      status.status === "ready"
        ? "info"
        : status.status === "stale" || status.status === "blocked_1115"
          ? "warning"
          : "notice",
    readOnly: true,
    loginAttempted: false,
    liveTradingEnabled: false,
    writeTradingEnabled: false,
    summary: {
      status: status.status,
      ready: status.ready,
      reason: status.reason,
      strategyGateReady: status.strategyGate?.ready === true,
      strategyGateStatus: status.strategyGate?.status ?? "",
      freshnessStatus: status.quoteProof?.freshnessStatus ?? "",
      freshnessAgeSeconds: status.quoteProof?.freshnessAgeSeconds ?? -1,
      latestStock: status.quoteProof?.latestStock ?? "",
      quoteProofStatus: status.quoteProof?.status ?? "",
      quoteProofFreshness: status.quoteProof?.freshness ?? "",
      allReadOnlyMonitorsReady: status.monitors?.allReadOnlyMonitorsReady === true,
      nextSafeTask: status.nextSafeTask ?? "",
    },
    data: status,
  };
}

export async function writeCapitalQuoteRuntimeEvent(event, eventDir) {
  await fs.mkdir(eventDir, { recursive: true });
  const latestPath = path.join(eventDir, "capital-quote-latest.json");
  const streamPath = path.join(eventDir, "capital-quote-events.jsonl");
  const eventWithFiles = {
    ...event,
    files: {
      latestPath,
      streamPath,
    },
  };
  const latestText = `${JSON.stringify(eventWithFiles, null, 2)}\n`;
  await fs.writeFile(latestPath, latestText, "utf8");
  await fs.writeFile(`${latestPath}.sha256`, `${sha256Text(latestText)}\n`, "ascii");
  await fs.appendFile(streamPath, `${JSON.stringify(eventWithFiles)}\n`, "utf8");
  return eventWithFiles.files;
}

function parseArgs(argv) {
  const options = {
    repoRoot: process.cwd(),
    dashboardPath: "",
    eventDir: "",
    json: false,
    requireReady: false,
  };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--repo-root") {
      options.repoRoot = argv[++index] ?? options.repoRoot;
    } else if (arg.startsWith("--repo-root=")) {
      options.repoRoot = arg.slice("--repo-root=".length);
    } else if (arg === "--dashboard") {
      options.dashboardPath = argv[++index] ?? options.dashboardPath;
    } else if (arg.startsWith("--dashboard=")) {
      options.dashboardPath = arg.slice("--dashboard=".length);
    } else if (arg === "--event-dir") {
      options.eventDir = argv[++index] ?? options.eventDir;
    } else if (arg.startsWith("--event-dir=")) {
      options.eventDir = arg.slice("--event-dir=".length);
    } else if (arg === "--json") {
      options.json = true;
    } else if (arg === "--require-ready") {
      options.requireReady = true;
    }
  }
  return options;
}

function formatSummary(event, paths) {
  return [
    "OpenClaw Capital quote runtime event",
    `eventType=${event.eventType}`,
    `status=${event.summary.status}`,
    `strategyGateReady=${event.summary.strategyGateReady}`,
    `freshness=${event.summary.freshnessStatus}`,
    `latestStock=${event.summary.latestStock || "N/A"}`,
    `latestEvent=${paths.latestPath}`,
    `eventStream=${paths.streamPath}`,
  ].join("\n");
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const repoRoot = path.resolve(options.repoRoot);
  const status = await readCapitalQuoteStatus({
    dashboardPath: options.dashboardPath || undefined,
  });
  const event = buildCapitalQuoteRuntimeEvent(status);
  const paths = await writeCapitalQuoteRuntimeEvent(
    event,
    path.resolve(options.eventDir || defaultEventDir(repoRoot)),
  );
  if (options.json) {
    process.stdout.write(`${JSON.stringify({ ...event, files: paths }, null, 2)}\n`);
  } else {
    process.stdout.write(`${formatSummary(event, paths)}\n`);
  }
  if (options.requireReady && !Object.is(event.summary.strategyGateReady, true)) {
    process.exitCode = 1;
  }
}

const invokedPath = process.argv[1] ? path.resolve(process.argv[1]) : "";
if (invokedPath === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    process.stderr.write(
      `capital quote runtime event failed: ${error instanceof Error ? error.message : String(error)}\n`,
    );
    process.exitCode = 1;
  });
}
