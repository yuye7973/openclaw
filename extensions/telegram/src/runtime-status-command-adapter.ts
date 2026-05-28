import fs from "node:fs";
import path from "node:path";
import type { TelegramInlineButtons } from "./button-types.js";
import { buildTelegramRuntimeStatusControllerReply } from "./runtime-status-controller.js";

const TELEGRAM_RUNTIME_STATUS_ALIAS_SET = new Set([
  "/status",
  "status",
  "狀態",
  "系統狀態",
  "中控狀態",
  "telegram狀態",
  "openclaw狀態",
  "交易狀態",
  "現在在做什麼",
  "現在做什麼",
  "下一步",
  "nexttask",
  "nextsafe",
  "nextsafetask",
]);
const OKX_CURRENT_READINESS_SUMMARY_RELATIVE_PATH =
  "reports/hermes-agent/state/openclaw-okx-current-readiness-summary-latest.json";

export type TelegramRuntimeStatusCommandAdapterInput = {
  commandText: string;
  preferredRepoRoot?: string;
  includeTradingButtons?: boolean;
  includeReturnMainMenu?: boolean;
};

export type TelegramRuntimeStatusCommandPayload = {
  replyText: string;
  buttons: TelegramInlineButtons;
  repoRoot: string;
  updatedAtIso?: string;
};

function normalizeCommandAlias(text: string): string {
  return text.trim().toLowerCase().replace(/\s+/g, "");
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function asString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function asBoolean(value: unknown): boolean | null {
  return typeof value === "boolean" ? value : null;
}

function shortenText(value: string, maxLen = 72): string {
  if (!value) {
    return "";
  }
  return value.length > maxLen ? `${value.slice(0, Math.max(0, maxLen - 1))}…` : value;
}

function buildOkxReadinessSummaryLine(report: unknown): string {
  const record = asRecord(report);
  const statusRaw = asString(record.status);
  const summary = shortenText(
    asString(record.summary_zh_tw) || asString(record.code) || statusRaw || "未知",
  );
  const blockers = Array.isArray(record.blockers)
    ? (record.blockers as unknown[]).map((item) => asString(item)).filter(Boolean)
    : [];
  const blockerText = blockers.length > 0 ? blockers.join("/") : "無";
  const safety = asRecord(record.safety);
  const noOrderWrite = asBoolean(safety.noOrderWrite);
  const noOrderWriteLabel = noOrderWrite === null ? "unknown" : noOrderWrite ? "true" : "false";
  const statusLabel =
    statusRaw === "ready_read_only"
      ? "可用"
      : statusRaw === "blocked"
        ? "阻擋"
        : statusRaw || "未知";
  return `[OpenClaw OKX 狀態] 狀態=${statusLabel}｜摘要=${summary || "未知"}｜阻擋=${blockerText}｜noOrderWrite=${noOrderWriteLabel}`;
}

function readOkxReadinessSummaryLine(repoRoot: string): string | null {
  const reportPath = path.join(repoRoot, OKX_CURRENT_READINESS_SUMMARY_RELATIVE_PATH);
  try {
    const raw = fs.readFileSync(reportPath, "utf8").replace(/^\uFEFF/u, "");
    return buildOkxReadinessSummaryLine(JSON.parse(raw) as unknown);
  } catch {
    return null;
  }
}

export function isTelegramRuntimeStatusCommand(text: string): boolean {
  if (typeof text !== "string") {
    return false;
  }
  const normalized = normalizeCommandAlias(text);
  return TELEGRAM_RUNTIME_STATUS_ALIAS_SET.has(normalized);
}

export function buildTelegramRuntimeStatusCommandPayload(
  input: TelegramRuntimeStatusCommandAdapterInput,
): TelegramRuntimeStatusCommandPayload | null {
  if (!isTelegramRuntimeStatusCommand(input.commandText)) {
    return null;
  }
  const reply = buildTelegramRuntimeStatusControllerReply({
    preferredRepoRoot: input.preferredRepoRoot,
    includeTradingButtons: input.includeTradingButtons,
    includeReturnMainMenu: input.includeReturnMainMenu,
  });
  const okxReadinessSummaryLine = readOkxReadinessSummaryLine(reply.repoRoot);
  return {
    replyText: okxReadinessSummaryLine ? `${reply.text}\n\n${okxReadinessSummaryLine}` : reply.text,
    buttons: reply.buttons,
    repoRoot: reply.repoRoot,
    updatedAtIso: reply.status.updatedAtIso,
  };
}
