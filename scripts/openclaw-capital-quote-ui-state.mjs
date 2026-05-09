import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

function defaultEventPath(repoRoot) {
  return path.join(repoRoot, ".openclaw", "runtime-events", "capital-quote-latest.json");
}

function defaultOutputPath(repoRoot) {
  return path.join(repoRoot, ".openclaw", "ui", "capital-quote-ui-state.json");
}

function sha256Text(text) {
  return crypto.createHash("sha256").update(text).digest("hex").toUpperCase();
}

async function readJson(filePath) {
  try {
    return JSON.parse(await fs.readFile(filePath, "utf8"));
  } catch (error) {
    if (error?.code === "ENOENT") {
      throw new Error(`Capital quote runtime event not found: ${filePath}`, { cause: error });
    }
    throw new Error(
      `Invalid Capital quote runtime event JSON: ${filePath}: ${
        error instanceof Error ? error.message : String(error)
      }`,
      { cause: error },
    );
  }
}

function stringOr(value, fallback = "") {
  return typeof value === "string" ? value : fallback;
}

function numberOr(value, fallback) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : fallback;
}

function badgeForStatus(status) {
  switch (status) {
    case "ready":
      return {
        tone: "success",
        label: "群益報價 READY",
        title: "群益 read-only 報價可用",
        description: "OpenClaw 可把最新群益報價作為只讀策略上下文。",
      };
    case "stale":
      return {
        tone: "warning",
        label: "報價過期 STALE",
        title: "群益報價 freshness gate 未通過",
        description: "策略不得使用舊報價；請先刷新 read-only 監控狀態。",
      };
    case "blocked_1115":
      return {
        tone: "danger",
        label: "1115 冷卻中",
        title: "群益登入 cooldown active",
        description: "禁止登入、禁止推進 StartIndex，只能更新 cooldown/OpenClaw 狀態。",
      };
    case "blocked":
      return {
        tone: "danger",
        label: "報價阻塞 BLOCKED",
        title: "群益報價 guard active",
        description: "策略不得使用報價；必須先解除 guard 狀態。",
      };
    case "incomplete":
      return {
        tone: "warning",
        label: "報價未完成",
        title: "群益全商品輪替尚未完成",
        description: "只允許執行下一個 read-only window，不可啟用交易寫入。",
      };
    default:
      return {
        tone: "neutral",
        label: "報價待確認",
        title: "群益報價狀態未達 ready",
        description: "UI 只能顯示狀態，不可把報價交給策略使用。",
      };
  }
}

function operatorActionForStatus(status, nextSafeTask) {
  switch (status) {
    case "ready":
      return nextSafeTask || "維持 heartbeat 健康檢查，不重跑全商品。";
    case "stale":
      return "先執行 read-only freshness monitor，再重新產生 OpenClaw runtime event。";
    case "blocked_1115":
      return "等待 cooldown 到期；禁止 API 登入與 StartIndex 推進。";
    case "blocked":
      return "先查 guard/錯誤原因，只更新 OpenClaw 狀態。";
    case "incomplete":
      return "只執行一個 read-only market-aligned window，完成後更新事件。";
    default:
      return "先重新產生 quote status/event，再判定是否可供策略使用。";
  }
}

export function buildCapitalQuoteUiState(event, options = {}) {
  const status = stringOr(event?.summary?.status, "degraded");
  const badge = badgeForStatus(status);
  const strategyAllowed = status === "ready" && event?.summary?.strategyGateReady === true;
  return {
    schema: "openclaw.capital.quote-ui-state.v1",
    generatedAt: new Date().toISOString(),
    source: "capital-quote-runtime-event",
    sourceEventPath: stringOr(options.eventPath, ""),
    eventType: stringOr(event?.eventType, ""),
    readOnly: true,
    loginAttempted: false,
    liveTradingEnabled: false,
    writeTradingEnabled: false,
    status,
    ready: strategyAllowed,
    badge,
    quote: {
      latestStock: stringOr(event?.summary?.latestStock, ""),
      freshnessStatus: stringOr(event?.summary?.freshnessStatus, ""),
      freshnessAgeSeconds: numberOr(event?.summary?.freshnessAgeSeconds, -1),
      quoteProofStatus: stringOr(event?.summary?.quoteProofStatus, ""),
      quoteProofFreshness: stringOr(event?.summary?.quoteProofFreshness, ""),
      allReadOnlyMonitorsReady: event?.summary?.allReadOnlyMonitorsReady === true,
    },
    strategyGate: {
      ready: strategyAllowed,
      status: strategyAllowed ? "allow_read_only_strategy_context" : "deny_strategy_context",
      reason: stringOr(event?.summary?.reason, badge.description),
    },
    action: {
      strategyAllowed,
      operatorAction: operatorActionForStatus(status, stringOr(event?.summary?.nextSafeTask, "")),
      nextSafeTask: stringOr(event?.summary?.nextSafeTask, ""),
    },
    files: {
      latestEvent: stringOr(event?.files?.latestPath, stringOr(options.eventPath, "")),
      eventStream: stringOr(event?.files?.streamPath, ""),
    },
  };
}

export async function readCapitalQuoteUiState(options = {}) {
  const repoRoot = path.resolve(options.repoRoot ?? process.cwd());
  const eventPath = path.resolve(options.eventPath ?? defaultEventPath(repoRoot));
  const event = await readJson(eventPath);
  return buildCapitalQuoteUiState(event, { eventPath });
}

export async function writeCapitalQuoteUiState(uiState, outputPath) {
  const text = `${JSON.stringify(uiState, null, 2)}\n`;
  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  await fs.writeFile(outputPath, text, "utf8");
  await fs.writeFile(`${outputPath}.sha256`, `${sha256Text(text)}\n`, "ascii");
  return outputPath;
}

function parseArgs(argv) {
  const options = {
    repoRoot: process.cwd(),
    eventPath: "",
    output: "",
    writeState: false,
    json: false,
    requireReady: false,
  };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--repo-root") {
      options.repoRoot = argv[++index] ?? options.repoRoot;
    } else if (arg.startsWith("--repo-root=")) {
      options.repoRoot = arg.slice("--repo-root=".length);
    } else if (arg === "--event") {
      options.eventPath = argv[++index] ?? options.eventPath;
    } else if (arg.startsWith("--event=")) {
      options.eventPath = arg.slice("--event=".length);
    } else if (arg === "--output") {
      options.output = argv[++index] ?? options.output;
    } else if (arg.startsWith("--output=")) {
      options.output = arg.slice("--output=".length);
    } else if (arg === "--write-state") {
      options.writeState = true;
    } else if (arg === "--json") {
      options.json = true;
    } else if (arg === "--require-ready") {
      options.requireReady = true;
    }
  }
  return options;
}

function formatSummary(uiState, outputPath) {
  return [
    "OpenClaw Capital quote UI state",
    `status=${uiState.status}`,
    `badge=${uiState.badge.label}`,
    `tone=${uiState.badge.tone}`,
    `strategyAllowed=${uiState.action.strategyAllowed}`,
    `latestStock=${uiState.quote.latestStock || "N/A"}`,
    outputPath ? `uiStateFile=${outputPath}` : "",
  ]
    .filter(Boolean)
    .join("\n");
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const repoRoot = path.resolve(options.repoRoot);
  const uiState = await readCapitalQuoteUiState({
    repoRoot,
    eventPath: options.eventPath || undefined,
  });
  const outputPath = options.writeState
    ? await writeCapitalQuoteUiState(
        uiState,
        path.resolve(options.output || defaultOutputPath(repoRoot)),
      )
    : "";

  if (options.json) {
    process.stdout.write(`${JSON.stringify({ ...uiState, outputPath }, null, 2)}\n`);
  } else {
    process.stdout.write(`${formatSummary(uiState, outputPath)}\n`);
  }

  if (options.requireReady && !uiState.ready) {
    process.exitCode = 1;
  }
}

const invokedPath = process.argv[1] ? path.resolve(process.argv[1]) : "";
if (invokedPath === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    process.stderr.write(
      `capital quote UI state failed: ${error instanceof Error ? error.message : String(error)}\n`,
    );
    process.exitCode = 1;
  });
}
