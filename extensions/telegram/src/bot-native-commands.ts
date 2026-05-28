import { execFile } from "node:child_process";
import { randomUUID } from "node:crypto";
import path from "node:path";
import { promisify } from "node:util";
import type { Bot, Context } from "grammy";
import { resolveDefaultModelForAgent } from "openclaw/plugin-sdk/agent-runtime";
import { resolveChannelStreamingBlockEnabled } from "openclaw/plugin-sdk/channel-streaming";
import {
  resolveCommandAuthorization,
  resolveCommandAuthorizedFromAuthorizers,
  resolveNativeCommandSessionTargets,
} from "openclaw/plugin-sdk/command-auth-native";
import {
  buildCommandTextFromArgs,
  findCommandByNativeName,
  formatCommandArgMenuTitle,
  listNativeCommandSpecs,
  listNativeCommandSpecsForConfig,
  parseCommandArgs,
  resolveCommandArgMenu,
  resolveStoredModelOverride,
  type CommandArgs,
} from "openclaw/plugin-sdk/command-auth-native";
import type { OpenClawConfig } from "openclaw/plugin-sdk/config-types";
import type { ChannelGroupPolicy } from "openclaw/plugin-sdk/config-types";
import type {
  ReplyToMode,
  TelegramAccountConfig,
  TelegramDirectConfig,
  TelegramGroupConfig,
  TelegramTopicConfig,
} from "openclaw/plugin-sdk/config-types";
import { resolveMarkdownTableMode } from "openclaw/plugin-sdk/markdown-table-runtime";
import { resolveSendableOutboundReplyParts } from "openclaw/plugin-sdk/reply-payload";
import { resolveAgentRoute } from "openclaw/plugin-sdk/routing";
import { getRuntimeConfigSnapshot } from "openclaw/plugin-sdk/runtime-config-snapshot";
import { danger, logVerbose } from "openclaw/plugin-sdk/runtime-env";
import { getChildLogger } from "openclaw/plugin-sdk/runtime-env";
import type { RuntimeEnv } from "openclaw/plugin-sdk/runtime-env";
import {
  loadSessionStore,
  resolveAndPersistSessionFile,
  resolveSessionStoreEntry,
  resolveSessionTranscriptPathInDir,
  resolveStorePath,
} from "openclaw/plugin-sdk/session-store-runtime";
import {
  normalizeLowercaseStringOrEmpty,
  normalizeOptionalString,
} from "openclaw/plugin-sdk/text-runtime";
import { resolveTelegramAccount } from "./accounts.js";
import { withTelegramApiErrorLogging } from "./api-logging.js";
import { isSenderAllowed, normalizeDmAllowFromWithStore } from "./bot-access.js";
import type { TelegramBotDeps } from "./bot-deps.js";
import type { TelegramMediaRef } from "./bot-message-context.js";
import type { TelegramMessageContextOptions } from "./bot-message-context.types.js";
import {
  defaultTelegramNativeCommandDeps,
  type TelegramNativeCommandDeps,
} from "./bot-native-command-deps.runtime.js";
import {
  buildCappedTelegramMenuCommands,
  buildPluginTelegramMenuCommands,
  syncTelegramMenuCommands as syncTelegramMenuCommandsRuntime,
} from "./bot-native-command-menu.js";
import { TelegramUpdateKeyContext } from "./bot-updates.js";
import type { TelegramBotOptions } from "./bot.types.js";
import {
  buildTelegramRoutingTarget,
  buildTelegramThreadParams,
  buildSenderName,
  buildTelegramGroupFrom,
  extractTelegramForumFlag,
  resolveTelegramForumFlag,
  resolveTelegramGroupAllowFromContext,
  resolveTelegramThreadSpec,
  shouldUseTelegramDmThreadSession,
} from "./bot/helpers.js";
import type { TelegramContext, TelegramGetChat } from "./bot/types.js";
import type { TelegramInlineButtons } from "./button-types.js";
import {
  normalizeTelegramCommandName,
  resolveTelegramCustomCommands,
  TELEGRAM_COMMAND_NAME_PATTERN,
} from "./command-config.js";
import {
  resolveTelegramConversationBaseSessionKey,
  resolveTelegramConversationRoute,
} from "./conversation-route.js";
import { shouldSuppressLocalTelegramExecApprovalPrompt } from "./exec-approvals.js";
import type { TelegramTransport } from "./fetch.js";
import {
  evaluateTelegramGroupBaseAccess,
  evaluateTelegramGroupPolicyAccess,
} from "./group-access.js";
import { resolveTelegramGroupPromptSettings } from "./group-config-helpers.js";
import { buildInlineKeyboard } from "./inline-keyboard.js";
import { resolveOpenClawRepoRoot } from "./repo-root-runtime.js";
import { buildTelegramRuntimeStatusCommandPayload } from "./runtime-status-command-adapter.js";
import { recordSentMessage } from "./sent-message-cache.js";

const EMPTY_RESPONSE_FALLBACK = "這次沒有產生可回覆內容，請稍後再試。";
const TELEGRAM_NATIVE_COMMAND_CALLBACK_PREFIX = "tgcmd:";
export const TELEGRAM_MAIN_MENU_TEXT = "🏠 主選單\n\n請選擇要查看的功能：";
export const CAPITAL_QUOTE_TELEGRAM_COMMAND = {
  command: "quote",
  description: "查詢交易報價與狀態",
} as const;
export const CAPITAL_STATUS_TELEGRAM_COMMAND = {
  command: "capital_status",
  description: "查詢交易檢查清單總狀態",
} as const;
export const OKX_STATUS_TELEGRAM_COMMAND = {
  command: "okx_status",
  description: "查詢 OKX 交易就緒狀態",
} as const;
export const MENU_TELEGRAM_COMMAND = {
  command: "menu",
  description: "開啟中控主選單",
} as const;
const CAPITAL_QUOTE_REPLY_SCRIPT = path.join(
  "scripts",
  "openclaw-capital-quote-telegram-reply.mjs",
);
const CAPITAL_SERVICE_STATUS_SCRIPT = path.join("scripts", "openclaw-capital-service-status.mjs");
const CAPITAL_MASTER_FLOW_CHECKLIST_SCRIPT = path.join(
  "scripts",
  "openclaw-capital-master-flow-checklist.mjs",
);
const OKX_CURRENT_READINESS_SUMMARY_SCRIPT = path.join(
  "scripts",
  "openclaw-okx-current-readiness-summary.mjs",
);
const CAPITAL_TELEGRAM_SIMULATED_LIVE_ORDER_SCRIPT = path.join(
  "scripts",
  "openclaw-capital-telegram-simulated-live-order.mjs",
);
const CAPITAL_TELEGRAM_LIVE_ORDER_EXECUTE_SCRIPT = path.join(
  "scripts",
  "openclaw-capital-telegram-live-order-execute.mjs",
);
const CAPITAL_QUOTE_REPLY_TIMEOUT_MS = 45_000;
const CAPITAL_QUOTE_REPLY_MAX_BUFFER = 1024 * 1024;
const execFileAsync = promisify(execFile);

type TelegramNativeCommandContext = Context & { match?: string };
type TelegramChunkMode = ReturnType<
  typeof import("openclaw/plugin-sdk/reply-dispatch-runtime").resolveChunkMode
>;
type TelegramNativeReplyPayload = import("openclaw/plugin-sdk/reply-dispatch-runtime").ReplyPayload;
type TelegramNativeReplyChannelData = {
  buttons?: TelegramInlineButtons;
  pin?: boolean;
};
type TelegramResolvedGroupConfig = {
  groupConfig?: TelegramGroupConfig | TelegramDirectConfig;
  topicConfig?: TelegramTopicConfig;
};

type TelegramCommandAuthResult = {
  chatId: number;
  isGroup: boolean;
  isForum: boolean;
  resolvedThreadId?: number;
  senderId: string;
  senderUsername: string;
  groupConfig?: TelegramGroupConfig | TelegramDirectConfig;
  topicConfig?: TelegramTopicConfig;
  commandAuthorized: boolean;
  senderIsOwner: boolean;
};

type TelegramNativeCommandThreadContext = {
  chatId: number;
  isGroup: boolean;
  isForum: boolean;
  messageThreadId: number | undefined;
  threadSpec: ReturnType<typeof resolveTelegramThreadSpec>;
  threadParams: ReturnType<typeof buildTelegramThreadParams>;
};

let telegramNativeCommandDeliveryRuntimePromise:
  | Promise<typeof import("./bot-native-commands.delivery.runtime.js")>
  | undefined;

async function loadTelegramNativeCommandDeliveryRuntime() {
  telegramNativeCommandDeliveryRuntimePromise ??=
    import("./bot-native-commands.delivery.runtime.js");
  return await telegramNativeCommandDeliveryRuntimePromise;
}

let telegramNativeCommandRuntimePromise:
  | Promise<typeof import("./bot-native-commands.runtime.js")>
  | undefined;

async function loadTelegramNativeCommandRuntime() {
  telegramNativeCommandRuntimePromise ??= import("./bot-native-commands.runtime.js");
  return await telegramNativeCommandRuntimePromise;
}

function resolveTelegramProgressPlaceholder(command: {
  nativeProgressMessages?: Partial<Record<string, string>> & { default?: string };
}): string | null {
  const text =
    command.nativeProgressMessages?.telegram?.trim() ??
    command.nativeProgressMessages?.default?.trim();
  return text ? text : null;
}

async function resolveTelegramCommandSessionFile(params: {
  cfg: OpenClawConfig;
  agentId: string;
  sessionKey: string;
  threadId?: string | number;
}): Promise<{ sessionId?: string; sessionFile?: string }> {
  const sessionKey = params.sessionKey.trim();
  if (!sessionKey) {
    return {};
  }
  try {
    const storePath = resolveStorePath(params.cfg.session?.store, { agentId: params.agentId });
    const store = loadSessionStore(storePath);
    const resolved = resolveSessionStoreEntry({ store, sessionKey });
    const sessionId = resolved.existing?.sessionId?.trim() || randomUUID();
    const sessionsDir = path.dirname(storePath);
    const fallbackSessionFile = resolveSessionTranscriptPathInDir(
      sessionId,
      sessionsDir,
      params.threadId,
    );
    const persisted = await resolveAndPersistSessionFile({
      sessionId,
      sessionKey: resolved.normalizedKey,
      sessionStore: store,
      storePath,
      sessionEntry: resolved.existing,
      agentId: params.agentId,
      sessionsDir,
      fallbackSessionFile,
    });
    return { sessionId, sessionFile: persisted.sessionFile };
  } catch {
    return {};
  }
}

function resolveTelegramCommandMenuModelContext(params: {
  cfg: OpenClawConfig;
  agentId: string;
  sessionKey: string;
}): { provider?: string; model?: string } {
  if (!params.sessionKey.trim()) {
    return {};
  }
  try {
    const storePath = resolveStorePath(params.cfg.session?.store, { agentId: params.agentId });
    const defaultModel = resolveDefaultModelForAgent({
      cfg: params.cfg,
      agentId: params.agentId,
    });
    const store = loadSessionStore(storePath);
    const entry = resolveSessionStoreEntry({ store, sessionKey: params.sessionKey }).existing;
    if (entry?.modelOverrideSource === "auto" && normalizeOptionalString(entry.modelOverride)) {
      return { provider: defaultModel.provider, model: defaultModel.model };
    }
    const override = resolveStoredModelOverride({
      sessionEntry: entry,
      sessionStore: store,
      sessionKey: params.sessionKey,
      defaultProvider: defaultModel.provider,
    });
    if (override?.model) {
      return {
        provider: override.provider || defaultModel.provider,
        model: override.model,
      };
    }
    const provider =
      normalizeOptionalString(entry?.providerOverride) ??
      normalizeOptionalString(entry?.modelProvider);
    const model =
      normalizeOptionalString(entry?.modelOverride) ?? normalizeOptionalString(entry?.model);
    return {
      ...(provider ? { provider } : {}),
      ...(model ? { model } : {}),
    };
  } catch {
    return {};
  }
}

function resolveTelegramNativeReplyChannelData(
  result: TelegramNativeReplyPayload,
): TelegramNativeReplyChannelData | undefined {
  return result.channelData?.telegram as TelegramNativeReplyChannelData | undefined;
}

function normalizeTelegramNativeReplyPayload(
  result: TelegramNativeReplyPayload | null | undefined,
): TelegramNativeReplyPayload {
  return result && typeof result === "object" ? result : {};
}

function hasRenderableTelegramNativeReplyPayload(result: TelegramNativeReplyPayload): boolean {
  return resolveSendableOutboundReplyParts(result).hasContent;
}

function readCapitalQuoteReplyText(value: unknown): string {
  if (!value || typeof value !== "object" || !("replyText" in value)) {
    return "";
  }
  const replyText = (value as { replyText?: unknown }).replyText;
  return typeof replyText === "string" ? replyText.trim() : "";
}

function formatCapitalQuoteCommandError(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error);
  return message.replace(/\s+/gu, " ").trim().slice(0, 240) || "未知錯誤";
}

function localizeCapitalReplyText(value: string): string {
  return value
    .replace(/paper-only/giu, "僅紙上模擬")
    .replace(/\bREADY\b/gu, "正常")
    .replace(/\bBLOCKED\b/gu, "阻擋")
    .replace(/\bunknown\b/giu, "未知")
    .replace(/\bsession_closed\b/giu, "收盤時段")
    .replace(/\bfresh matched\b/giu, "即時符合")
    .replace(/\bfresh callback\b/giu, "即時回呼")
    .replace(/\bstale\b/giu, "過期");
}

function normalizeCapitalStatusText(value: unknown): string {
  const normalized = normalizeOptionalString(value);
  return normalized ? normalized.replace(/\s+/gu, " ").trim() : "";
}

function localizeCapitalStatusReason(value: unknown): string {
  const normalized = normalizeCapitalStatusText(value);
  if (!normalized) {
    return "";
  }
  const exactMap: Record<string, string> = {
    allowLiveTrading_false: "未開啟真單權限",
    account_and_position_data_available: "帳戶與倉位資料可用",
    paper_only_ready: "紙上交易可用",
    session_closed: "收盤時段",
    blocked: "阻擋",
    ready: "正常",
  };
  const exact = exactMap[normalized];
  if (exact) {
    return exact;
  }
  return normalized
    .replace(/:READY\b/gu, ":正常")
    .replace(/:BLOCKED\b/gu, ":阻擋")
    .replace(/\bREADY\b/gu, "正常")
    .replace(/\bBLOCKED\b/gu, "阻擋");
}

function shortenCapitalStatusText(value: unknown, max = 72): string {
  const normalized = localizeCapitalStatusReason(value);
  if (!normalized) {
    return "";
  }
  return normalized.length > max ? `${normalized.slice(0, max - 1)}…` : normalized;
}

function resolveCapitalStatusSummaryLabel(value: unknown): string {
  const normalized = normalizeCapitalStatusText(value);
  if (!normalized) {
    return "未知";
  }
  if (
    normalized === "ready_safe" ||
    normalized === "completed" ||
    normalized === "pass" ||
    normalized === "passed" ||
    normalized === "ok" ||
    normalized === "ready"
  ) {
    return "正常";
  }
  if (
    normalized === "blocked_or_degraded" ||
    normalized === "incomplete_blocked" ||
    normalized === "blocked" ||
    normalized === "fail" ||
    normalized === "failed"
  ) {
    return "阻擋";
  }
  if (normalized === "partial") {
    return "部分";
  }
  if (normalized === "unfinished") {
    return "未完成";
  }
  return normalized;
}

function resolveCapitalStatusFlowLabel(value: unknown): string {
  const normalized = normalizeCapitalStatusText(value);
  if (normalized === "completed") {
    return "正常";
  }
  if (normalized === "partial") {
    return "部分";
  }
  if (normalized === "blocked") {
    return "阻擋";
  }
  if (normalized === "unfinished") {
    return "未完成";
  }
  return resolveCapitalStatusSummaryLabel(normalized);
}

function readCapitalStatusFlowLabel(checklist: Record<string, unknown>, flowId: string): string {
  const flows = checklist.flows;
  if (!Array.isArray(flows)) {
    return "未知";
  }
  for (const flow of flows) {
    if (!flow || typeof flow !== "object") {
      continue;
    }
    const flowRecord = flow as Record<string, unknown>;
    if (normalizeCapitalStatusText(flowRecord.id) !== flowId) {
      continue;
    }
    return resolveCapitalStatusFlowLabel(flowRecord.status);
  }
  return "未知";
}

function buildCapitalStatusSummaryReplyText(params: {
  serviceStatus: unknown;
  checklistStatus: unknown;
}): string {
  const service =
    params.serviceStatus && typeof params.serviceStatus === "object"
      ? (params.serviceStatus as Record<string, unknown>)
      : {};
  const checklist =
    params.checklistStatus && typeof params.checklistStatus === "object"
      ? (params.checklistStatus as Record<string, unknown>)
      : {};

  const quote =
    service.quote && typeof service.quote === "object"
      ? (service.quote as Record<string, unknown>)
      : {};
  const positionQuery =
    service.positionQuery && typeof service.positionQuery === "object"
      ? (service.positionQuery as Record<string, unknown>)
      : {};
  const paperTrading =
    service.paperTrading && typeof service.paperTrading === "object"
      ? (service.paperTrading as Record<string, unknown>)
      : {};
  const liveOrders =
    service.liveOrders && typeof service.liveOrders === "object"
      ? (service.liveOrders as Record<string, unknown>)
      : {};
  const orderMode =
    service.orderMode && typeof service.orderMode === "object"
      ? (service.orderMode as Record<string, unknown>)
      : {};

  const quoteReady = quote.ready === true;
  const queryReady = positionQuery.ready === true;
  const paperReady = paperTrading.ready === true;
  const liveReady = liveOrders.ready === true;
  const quotePart = quoteReady
    ? "正常"
    : `阻擋：${shortenCapitalStatusText(quote.reason || quote.status || "未知原因")}`;
  const queryPart = queryReady
    ? "正常"
    : `阻擋：${shortenCapitalStatusText(positionQuery.reason || positionQuery.status || "未知原因")}`;
  const orderModePart =
    shortenCapitalStatusText(orderMode.summary || orderMode.status, 84) || "未知";
  const orderPart = `模擬下單=${paperReady ? "正常" : "阻擋"}；真單=${liveReady ? "正常" : "封鎖"}；模式=${orderModePart}`;
  const reportPart = readCapitalStatusFlowLabel(checklist, "account-position-reply");
  const checklistPart = resolveCapitalStatusSummaryLabel(checklist.status || service.status);
  const nextSafeTask =
    shortenCapitalStatusText(checklist.nextSafeTask || service.nextSafeTask, 220) ||
    "先跑交易檢查清單查阻擋。";

  return [
    `[OpenClaw 交易總狀態] 清單=${checklistPart}｜報價=${quotePart}｜下單=${orderPart}｜回報=${reportPart}｜查詢=${queryPart}`,
    `下一步：${nextSafeTask}`,
  ].join("\n");
}

function buildOkxReadinessSummaryReplyText(statusReport: unknown): string {
  const report =
    statusReport && typeof statusReport === "object"
      ? (statusReport as Record<string, unknown>)
      : {};
  const normalizedStatus = normalizeCapitalStatusText(report.status);
  const summaryText = shortenCapitalStatusText(
    report.summary_zh_tw || report.code || report.status || "未知",
    120,
  );
  const blockers = Array.isArray(report.blockers)
    ? report.blockers
        .map((value) => shortenCapitalStatusText(value, 48))
        .filter((value) => value.length > 0)
    : [];
  const safety =
    report.safety && typeof report.safety === "object"
      ? (report.safety as Record<string, unknown>)
      : {};
  const noOrderWriteValue =
    typeof safety.noOrderWrite === "boolean" ? (safety.noOrderWrite ? "true" : "false") : "unknown";
  const statusLabel =
    normalizedStatus === "ready_read_only" ||
    normalizedStatus === "pass" ||
    normalizedStatus === "passed"
      ? "正常"
      : normalizedStatus === "blocked"
        ? "阻擋"
        : resolveCapitalStatusSummaryLabel(normalizedStatus);
  const blockerText = blockers.length > 0 ? blockers.join("、") : "none";
  return `[OpenClaw OKX 狀態] 狀態=${statusLabel}｜摘要=${summaryText || "未知"}｜阻擋=${blockerText}｜noOrderWrite=${noOrderWriteValue}`;
}

async function buildOkxStatusTelegramReplyFromScript(params: {
  repoRoot?: string;
}): Promise<string> {
  const repoRoot = resolveOpenClawRepoRoot({
    preferredRoot: params.repoRoot,
    requiredRelativePath: OKX_CURRENT_READINESS_SUMMARY_SCRIPT,
  });
  const scriptPath = path.join(repoRoot, OKX_CURRENT_READINESS_SUMMARY_SCRIPT);
  const failedReplyText = "[OpenClaw OKX 狀態] 封鎖：OKX readiness 檢查失敗";
  try {
    const result = await execFileAsync(process.execPath, [scriptPath, "--json"], {
      cwd: repoRoot,
      timeout: CAPITAL_QUOTE_REPLY_TIMEOUT_MS,
      windowsHide: true,
      maxBuffer: CAPITAL_QUOTE_REPLY_MAX_BUFFER,
    });
    const statusReport = JSON.parse(result.stdout || "{}") as unknown;
    return buildOkxReadinessSummaryReplyText(statusReport);
  } catch (error) {
    return `${failedReplyText}｜原因=${formatCapitalQuoteCommandError(error)}｜noOrderWrite=unknown`;
  }
}

async function buildCapitalStatusTelegramReplyFromScript(params: {
  repoRoot?: string;
}): Promise<string> {
  const repoRoot = resolveOpenClawRepoRoot({
    preferredRoot: params.repoRoot,
    requiredRelativePath: CAPITAL_SERVICE_STATUS_SCRIPT,
  });
  const serviceScriptPath = path.join(repoRoot, CAPITAL_SERVICE_STATUS_SCRIPT);
  const checklistScriptPath = path.join(repoRoot, CAPITAL_MASTER_FLOW_CHECKLIST_SCRIPT);
  const failedReplyText = "[OpenClaw 交易總狀態] 封鎖：總狀態檢查失敗";
  try {
    const [serviceResult, checklistResult] = await Promise.all([
      execFileAsync(process.execPath, [serviceScriptPath, "--json"], {
        cwd: repoRoot,
        timeout: CAPITAL_QUOTE_REPLY_TIMEOUT_MS,
        windowsHide: true,
        maxBuffer: CAPITAL_QUOTE_REPLY_MAX_BUFFER,
      }),
      execFileAsync(process.execPath, [checklistScriptPath, "--json"], {
        cwd: repoRoot,
        timeout: CAPITAL_QUOTE_REPLY_TIMEOUT_MS,
        windowsHide: true,
        maxBuffer: CAPITAL_QUOTE_REPLY_MAX_BUFFER,
      }),
    ]);
    const serviceStatus = JSON.parse(serviceResult.stdout || "{}") as unknown;
    const checklistStatus = JSON.parse(checklistResult.stdout || "{}") as unknown;
    const capitalSummary = buildCapitalStatusSummaryReplyText({
      serviceStatus,
      checklistStatus,
    });
    const okxSummary = await buildOkxStatusTelegramReplyFromScript({ repoRoot });
    return `${capitalSummary}\n${okxSummary}`;
  } catch (error) {
    const okxSummary = await buildOkxStatusTelegramReplyFromScript({ repoRoot });
    return `${failedReplyText}｜原因=${formatCapitalQuoteCommandError(error)}｜真單=封鎖（僅紙上模擬）\n${okxSummary}`;
  }
}

function isCapitalSimulatedLiveOrderQuery(query: string): boolean {
  return /(?:模擬真單|模擬下單|simulated[-_\s]?live|simlive|paper[-_\s]?live|paper[-_\s]?(?:buy|sell))/iu.test(
    query,
  );
}

function isCapitalLiveOrderExecuteQuery(query: string): boolean {
  return /(?:真實下單|真單下單|live[-_\s]?order|live[-_\s]?(?:buy|sell)|(?:^|\s)live(?:\s|$))/iu.test(
    query,
  );
}

export function buildTelegramMainMenuButtons(): TelegramInlineButtons {
  const toCallback = (command: string) => buildTelegramNativeCommandCallbackData(command);
  return [
    [{ text: "🛰 中控狀態", callback_data: toCallback("/status") }],
    [{ text: "📊 報價狀態", callback_data: toCallback("/quote status") }],
    [{ text: "🧭 交易總覽", callback_data: toCallback("/capital_status") }],
    [{ text: "🪙 OKX 狀態", callback_data: toCallback("/okx_status") }],
    [{ text: "🟢 模擬下單（買）", callback_data: toCallback("/quote simlive tx00 buy 1") }],
    [{ text: "🔥 真實下單（買）", callback_data: toCallback("/quote live cn0000 buy 1") }],
  ];
}

export function buildTelegramReturnMainMenuButtons(): TelegramInlineButtons {
  return [
    [
      {
        text: "↩ 返回主選單",
        callback_data: buildTelegramNativeCommandCallbackData("/start"),
      },
    ],
  ];
}

function buildCapitalQuoteNativeCommandButtons(match?: string): TelegramInlineButtons {
  const trimmedMatch = match?.trim();
  const refreshQuery = trimmedMatch && trimmedMatch.length > 0 ? trimmedMatch : "status";
  const toCallback = (command: string) => buildTelegramNativeCommandCallbackData(command);
  return [
    [
      { text: "🔄 刷新報價", callback_data: toCallback(`/quote ${refreshQuery}`) },
      { text: "📊 報價狀態", callback_data: toCallback("/quote status") },
    ],
    [
      { text: "🛰 中控狀態", callback_data: toCallback("/status") },
      { text: "🧭 交易總覽", callback_data: toCallback("/capital_status") },
    ],
    [
      { text: "🪙 OKX 狀態", callback_data: toCallback("/okx_status") },
      { text: "📡 入口自檢", callback_data: toCallback("/quote telegram") },
    ],
    [
      { text: "🟢 模擬下單（買）", callback_data: toCallback("/quote simlive tx00 buy 1") },
      { text: "🔴 模擬下單（賣）", callback_data: toCallback("/quote simlive tx00 sell 1") },
    ],
    [
      { text: "🔥 真實下單（買）", callback_data: toCallback("/quote live cn0000 buy 1") },
      { text: "🧯 真實下單（賣）", callback_data: toCallback("/quote live cn0000 sell 1") },
    ],
    [
      { text: "✅ 真實平多", callback_data: toCallback("/quote live cn0000 close_long 1") },
      { text: "✅ 真實平空", callback_data: toCallback("/quote live cn0000 close_short 1") },
    ],
    [
      { text: "🟡 人工審查", callback_data: toCallback("/quote semi") },
      { text: "✅ 同意下單", callback_data: toCallback("/quote semi approve") },
    ],
    [
      { text: "⛔ 拒絕下單", callback_data: toCallback("/quote semi reject") },
      { text: "↩ 返回主選單", callback_data: toCallback("/start") },
    ],
    [{ text: "📈 台指近", callback_data: toCallback("/quote tx00am") }],
  ];
}

function buildCapitalStatusNativeCommandButtons(): TelegramInlineButtons {
  const toCallback = (command: string) => buildTelegramNativeCommandCallbackData(command);
  return [
    [
      { text: "🔄 刷新總狀態", callback_data: toCallback("/capital_status") },
      { text: "📊 查看報價詳情", callback_data: toCallback("/quote status") },
    ],
    [
      { text: "🛰 中控狀態", callback_data: toCallback("/status") },
      { text: "🪙 OKX 狀態", callback_data: toCallback("/okx_status") },
    ],
    [
      { text: "🟢 模擬下單（買）", callback_data: toCallback("/quote simlive tx00 buy 1") },
      { text: "🔴 模擬下單（賣）", callback_data: toCallback("/quote simlive tx00 sell 1") },
    ],
    [
      { text: "🔥 真實下單（買）", callback_data: toCallback("/quote live cn0000 buy 1") },
      { text: "🧯 真實下單（賣）", callback_data: toCallback("/quote live cn0000 sell 1") },
    ],
    [
      { text: "✅ 真實平多", callback_data: toCallback("/quote live cn0000 close_long 1") },
      { text: "✅ 真實平空", callback_data: toCallback("/quote live cn0000 close_short 1") },
    ],
    [
      { text: "🟡 人工審查", callback_data: toCallback("/quote semi") },
      { text: "↩ 返回主選單", callback_data: toCallback("/start") },
    ],
  ];
}

async function buildCapitalQuoteTelegramReplyFromScript(params: {
  match?: string;
  repoRoot?: string;
}): Promise<string> {
  const repoRoot = resolveOpenClawRepoRoot({
    preferredRoot: params.repoRoot,
    requiredRelativePath: CAPITAL_QUOTE_REPLY_SCRIPT,
  });
  const query = `/quote ${params.match?.trim() || "status"}`.trim();
  const simulatedLiveQuery = query.replace(/^\/quote\s*/iu, "").trim();
  const liveOrderQuery = query.replace(/^\/quote\s*/iu, "").trim();
  const simulatedLiveOrder = isCapitalSimulatedLiveOrderQuery(simulatedLiveQuery);
  const executeLiveOrder = !simulatedLiveOrder && isCapitalLiveOrderExecuteQuery(liveOrderQuery);
  const scriptPath = path.join(
    repoRoot,
    simulatedLiveOrder
      ? CAPITAL_TELEGRAM_SIMULATED_LIVE_ORDER_SCRIPT
      : executeLiveOrder
        ? CAPITAL_TELEGRAM_LIVE_ORDER_EXECUTE_SCRIPT
        : CAPITAL_QUOTE_REPLY_SCRIPT,
  );
  const scriptArgs = simulatedLiveOrder
    ? [scriptPath, "--text", simulatedLiveQuery || "simlive tx00 buy 1", "--write-state", "--json"]
    : executeLiveOrder
      ? [scriptPath, "--text", liveOrderQuery || "live cn0000 buy 1", "--write-state", "--json"]
      : [scriptPath, "--query", query, "--write-state", "--json"];
  const fallbackReplyText = simulatedLiveOrder
    ? "[OpenClaw 模擬真單] 封鎖：未產生模擬下單回覆｜真單=封鎖（僅紙上模擬）"
    : executeLiveOrder
      ? "[OpenClaw 真實下單] 封鎖：未產生真實下單回覆｜請先檢查 /capital_status"
      : "[OpenClaw 報價] 封鎖：未產生報價回覆｜不可回舊價｜真單=封鎖（風控未開啟）";
  const failedReplyText = simulatedLiveOrder
    ? "[OpenClaw 模擬真單] 封鎖：模擬下單產生器失敗"
    : executeLiveOrder
      ? "[OpenClaw 真實下單] 封鎖：真實下單執行器失敗"
      : "[OpenClaw 報價] 封鎖：報價產生器失敗";
  try {
    const { stdout } = await execFileAsync(process.execPath, scriptArgs, {
      cwd: repoRoot,
      timeout: CAPITAL_QUOTE_REPLY_TIMEOUT_MS,
      windowsHide: true,
      maxBuffer: CAPITAL_QUOTE_REPLY_MAX_BUFFER,
    });
    const parsed = JSON.parse(stdout || "{}") as unknown;
    return localizeCapitalReplyText(readCapitalQuoteReplyText(parsed) || fallbackReplyText);
  } catch (error) {
    return (
      failedReplyText +
      `｜原因=${formatCapitalQuoteCommandError(error)}` +
      (simulatedLiveOrder
        ? "｜真單=封鎖（僅紙上模擬）"
        : executeLiveOrder
          ? "｜請先檢查 /capital_status"
          : "｜不可回舊價｜真單=封鎖（風控未開啟）")
    );
  }
}

function isEditableTelegramProgressResult(result: TelegramNativeReplyPayload): boolean {
  const telegramData = resolveTelegramNativeReplyChannelData(result);
  return Boolean(
    typeof result.text === "string" &&
    result.text.trim() &&
    !result.mediaUrl &&
    (!result.mediaUrls || result.mediaUrls.length === 0) &&
    !result.interactive &&
    !result.btw &&
    telegramData?.pin !== true,
  );
}

async function cleanupTelegramProgressPlaceholder(params: {
  bot: Bot;
  chatId: number;
  progressMessageId?: number;
  runtime: RuntimeEnv;
}): Promise<void> {
  const progressMessageId = params.progressMessageId;
  if (progressMessageId == null) {
    return;
  }
  try {
    await withTelegramApiErrorLogging({
      operation: "deleteMessage",
      runtime: params.runtime,
      fn: () => params.bot.api.deleteMessage(params.chatId, progressMessageId),
    });
  } catch {
    // Best-effort cleanup before fallback or suppression exits.
  }
}

async function resolveTelegramNativeCommandThreadContext(params: {
  msg: NonNullable<TelegramNativeCommandContext["message"]>;
  bot: Bot;
}): Promise<TelegramNativeCommandThreadContext> {
  const { msg, bot } = params;
  const chatId = msg.chat.id;
  const isGroup = msg.chat.type === "group" || msg.chat.type === "supergroup";
  const messageThreadId = (msg as { message_thread_id?: number }).message_thread_id;
  const getChat =
    typeof bot.api.getChat === "function"
      ? (bot.api.getChat.bind(bot.api) as TelegramGetChat)
      : undefined;
  const isForum = await resolveTelegramForumFlag({
    chatId,
    chatType: msg.chat.type,
    isGroup,
    isForum: extractTelegramForumFlag(msg.chat),
    getChat,
  });
  const threadSpec = resolveTelegramThreadSpec({
    isGroup,
    isForum,
    messageThreadId,
  });
  return {
    chatId,
    isGroup,
    isForum,
    messageThreadId,
    threadSpec,
    threadParams: buildTelegramThreadParams(threadSpec),
  };
}

export type RegisterTelegramHandlerParams = {
  cfg: OpenClawConfig;
  accountId: string;
  bot: Bot;
  mediaMaxBytes: number;
  opts: TelegramBotOptions;
  telegramTransport?: TelegramTransport;
  runtime: RuntimeEnv;
  telegramCfg: TelegramAccountConfig;
  telegramDeps: TelegramBotDeps;
  allowFrom?: Array<string | number>;
  groupAllowFrom?: Array<string | number>;
  resolveGroupPolicy: (chatId: string | number) => ChannelGroupPolicy;
  resolveTelegramGroupConfig: (
    chatId: string | number,
    messageThreadId?: number,
  ) => TelegramResolvedGroupConfig;
  shouldSkipUpdate: (ctx: TelegramUpdateKeyContext) => boolean;
  processMessage: (
    ctx: TelegramContext,
    allMedia: TelegramMediaRef[],
    storeAllowFrom: string[],
    options?: TelegramMessageContextOptions,
    replyMedia?: TelegramMediaRef[],
  ) => Promise<void>;
  logger: ReturnType<typeof getChildLogger>;
};

export function buildTelegramNativeCommandCallbackData(commandText: string): string {
  return `${TELEGRAM_NATIVE_COMMAND_CALLBACK_PREFIX}${commandText}`;
}

export function parseTelegramNativeCommandCallbackData(data?: string | null): string | null {
  if (!data) {
    return null;
  }
  const trimmed = data.trim();
  if (!trimmed.startsWith(TELEGRAM_NATIVE_COMMAND_CALLBACK_PREFIX)) {
    return null;
  }
  const commandText = trimmed.slice(TELEGRAM_NATIVE_COMMAND_CALLBACK_PREFIX.length).trim();
  return commandText.startsWith("/") ? commandText : null;
}

export function resolveTelegramNativeCommandDisableBlockStreaming(
  telegramCfg: TelegramAccountConfig,
): boolean | undefined {
  const blockStreamingEnabled = resolveChannelStreamingBlockEnabled(telegramCfg);
  return typeof blockStreamingEnabled === "boolean" ? !blockStreamingEnabled : undefined;
}

export type RegisterTelegramNativeCommandsParams = {
  bot: Bot;
  cfg: OpenClawConfig;
  runtime: RuntimeEnv;
  accountId: string;
  telegramCfg: TelegramAccountConfig;
  allowFrom?: Array<string | number>;
  groupAllowFrom?: Array<string | number>;
  replyToMode: ReplyToMode;
  textLimit: number;
  useAccessGroups: boolean;
  nativeEnabled: boolean;
  nativeSkillsEnabled: boolean;
  nativeDisabledExplicit: boolean;
  resolveGroupPolicy: (chatId: string | number) => ChannelGroupPolicy;
  resolveTelegramGroupConfig: (
    chatId: string | number,
    messageThreadId?: number,
  ) => TelegramResolvedGroupConfig;
  shouldSkipUpdate: (ctx: TelegramUpdateKeyContext) => boolean;
  telegramDeps?: TelegramNativeCommandDeps;
  opts: { token: string };
};

async function resolveTelegramCommandAuth(params: {
  msg: NonNullable<TelegramNativeCommandContext["message"]>;
  bot: Bot;
  cfg: OpenClawConfig;
  accountId: string;
  telegramCfg: TelegramAccountConfig;
  readChannelAllowFromStore: TelegramBotDeps["readChannelAllowFromStore"];
  allowFrom?: Array<string | number>;
  groupAllowFrom?: Array<string | number>;
  useAccessGroups: boolean;
  resolveGroupPolicy: (chatId: string | number) => ChannelGroupPolicy;
  resolveTelegramGroupConfig: (
    chatId: string | number,
    messageThreadId?: number,
  ) => TelegramResolvedGroupConfig;
  requireAuth: boolean;
}): Promise<TelegramCommandAuthResult | null> {
  const {
    msg,
    bot,
    cfg,
    accountId,
    telegramCfg,
    readChannelAllowFromStore,
    allowFrom,
    groupAllowFrom,
    useAccessGroups,
    resolveGroupPolicy,
    resolveTelegramGroupConfig,
    requireAuth,
  } = params;
  const { chatId, isGroup, isForum, messageThreadId, threadParams } =
    await resolveTelegramNativeCommandThreadContext({ msg, bot });
  const groupAllowContext = await resolveTelegramGroupAllowFromContext({
    chatId,
    accountId,
    isGroup,
    isForum,
    messageThreadId,
    groupAllowFrom,
    readChannelAllowFromStore,
    resolveTelegramGroupConfig,
  });
  const {
    resolvedThreadId,
    dmThreadId,
    storeAllowFrom,
    groupConfig,
    topicConfig,
    groupAllowOverride,
    effectiveGroupAllow,
    hasGroupAllowOverride,
  } = groupAllowContext;
  // Use direct config dmPolicy override if available for DMs
  const effectiveDmPolicy =
    !isGroup && groupConfig && "dmPolicy" in groupConfig
      ? (groupConfig.dmPolicy ?? telegramCfg.dmPolicy ?? "pairing")
      : (telegramCfg.dmPolicy ?? "pairing");
  const requireTopic =
    !isGroup && groupConfig && "requireTopic" in groupConfig ? groupConfig.requireTopic : undefined;
  if (!isGroup && requireTopic === true && dmThreadId == null) {
    logVerbose(`Blocked telegram command in DM ${chatId}: requireTopic=true but no topic present`);
    return null;
  }
  // For DMs, prefer per-DM/topic allowFrom (groupAllowOverride) over account-level allowFrom
  const dmAllowFrom = groupAllowOverride ?? allowFrom;
  const senderId = msg.from?.id ? String(msg.from.id) : "";
  const senderUsername = msg.from?.username ?? "";
  const commandsAllowFrom = cfg.commands?.allowFrom;
  const commandsAllowFromConfigured =
    commandsAllowFrom != null &&
    typeof commandsAllowFrom === "object" &&
    (Array.isArray(commandsAllowFrom.telegram) || Array.isArray(commandsAllowFrom["*"]));
  const commandsAllowFromAccess = commandsAllowFromConfigured
    ? resolveCommandAuthorization({
        ctx: {
          Provider: "telegram",
          Surface: "telegram",
          OriginatingChannel: "telegram",
          AccountId: accountId,
          ChatType: isGroup ? "group" : "direct",
          From: isGroup ? buildTelegramGroupFrom(chatId, resolvedThreadId) : `telegram:${chatId}`,
          SenderId: senderId || undefined,
          SenderUsername: senderUsername || undefined,
        },
        cfg,
        // commands.allowFrom is the only auth source when configured.
        commandAuthorized: false,
      })
    : null;
  const ownerAccess = resolveCommandAuthorization({
    ctx: {
      Provider: "telegram",
      Surface: "telegram",
      OriginatingChannel: "telegram",
      AccountId: accountId,
      ChatType: isGroup ? "group" : "direct",
      From: isGroup ? buildTelegramGroupFrom(chatId, resolvedThreadId) : `telegram:${chatId}`,
      SenderId: senderId || undefined,
      SenderUsername: senderUsername || undefined,
    },
    cfg,
    commandAuthorized: false,
  });

  const sendAuthMessage = async (text: string) => {
    await withTelegramApiErrorLogging({
      operation: "sendMessage",
      fn: () => bot.api.sendMessage(chatId, text, threadParams ?? {}),
    });
    return null;
  };
  const rejectNotAuthorized = async () => {
    return await sendAuthMessage("你沒有權限使用這個指令。");
  };

  const baseAccess = evaluateTelegramGroupBaseAccess({
    isGroup,
    groupConfig,
    topicConfig,
    hasGroupAllowOverride,
    effectiveGroupAllow,
    senderId,
    senderUsername,
    enforceAllowOverride: requireAuth,
    requireSenderForAllowOverride: true,
  });
  if (!baseAccess.allowed) {
    if (baseAccess.reason === "group-disabled") {
      return await sendAuthMessage("此群組已停用指令。");
    }
    if (baseAccess.reason === "topic-disabled") {
      return await sendAuthMessage("此話題已停用指令。");
    }
    return await rejectNotAuthorized();
  }

  const policyAccess = evaluateTelegramGroupPolicyAccess({
    isGroup,
    chatId,
    cfg,
    telegramCfg,
    topicConfig,
    groupConfig,
    effectiveGroupAllow,
    senderId,
    senderUsername,
    resolveGroupPolicy,
    enforcePolicy: useAccessGroups,
    useTopicAndGroupOverrides: false,
    enforceAllowlistAuthorization: requireAuth && !commandsAllowFromConfigured,
    allowEmptyAllowlistEntries: true,
    requireSenderForAllowlistAuthorization: true,
    checkChatAllowlist: useAccessGroups,
  });
  if (!policyAccess.allowed) {
    if (policyAccess.reason === "group-policy-disabled") {
      return await sendAuthMessage("此群組目前已停用 Telegram 指令。");
    }
    if (
      policyAccess.reason === "group-policy-allowlist-no-sender" ||
      policyAccess.reason === "group-policy-allowlist-unauthorized"
    ) {
      return await rejectNotAuthorized();
    }
    if (policyAccess.reason === "group-chat-not-allowed") {
      return await sendAuthMessage("此群組不在允許清單中。");
    }
  }

  const dmAllow = normalizeDmAllowFromWithStore({
    allowFrom: dmAllowFrom,
    storeAllowFrom: isGroup ? [] : storeAllowFrom,
    dmPolicy: effectiveDmPolicy,
  });
  const senderAllowed = isSenderAllowed({
    allow: dmAllow,
    senderId,
    senderUsername,
  });
  const groupSenderAllowed = isGroup
    ? isSenderAllowed({ allow: effectiveGroupAllow, senderId, senderUsername })
    : false;
  const ownerAuthorizerConfigured = ownerAccess.senderIsOwner || ownerAccess.ownerList.length > 0;
  const commandAuthorized = commandsAllowFromConfigured
    ? Boolean(commandsAllowFromAccess?.isAuthorizedSender)
    : resolveCommandAuthorizedFromAuthorizers({
        useAccessGroups,
        authorizers: [
          { configured: dmAllow.hasEntries, allowed: senderAllowed },
          ...(isGroup
            ? [{ configured: effectiveGroupAllow.hasEntries, allowed: groupSenderAllowed }]
            : []),
          {
            configured: ownerAuthorizerConfigured,
            allowed: ownerAccess.senderIsOwner,
          },
        ],
        modeWhenAccessGroupsOff: "configured",
      });
  if (requireAuth && !commandAuthorized) {
    return await rejectNotAuthorized();
  }

  return {
    chatId,
    isGroup,
    isForum,
    resolvedThreadId,
    senderId,
    senderUsername,
    groupConfig,
    topicConfig,
    commandAuthorized,
    senderIsOwner: ownerAccess.senderIsOwner,
  };
}

export const registerTelegramNativeCommands = ({
  bot,
  cfg,
  runtime,
  accountId,
  telegramCfg,
  allowFrom,
  groupAllowFrom,
  replyToMode,
  textLimit,
  useAccessGroups,
  nativeEnabled,
  nativeSkillsEnabled,
  nativeDisabledExplicit,
  resolveGroupPolicy,
  resolveTelegramGroupConfig,
  shouldSkipUpdate,
  telegramDeps = defaultTelegramNativeCommandDeps,
  opts,
}: RegisterTelegramNativeCommandsParams) => {
  const boundRoute =
    nativeEnabled && nativeSkillsEnabled
      ? resolveAgentRoute({ cfg, channel: "telegram", accountId })
      : null;
  if (nativeEnabled && nativeSkillsEnabled && !boundRoute) {
    runtime.log?.(
      "nativeSkillsEnabled is true but no agent route is bound for this Telegram account; skill commands will not appear in the native menu.",
    );
  }
  const skillCommands =
    nativeEnabled && nativeSkillsEnabled && boundRoute
      ? telegramDeps.listSkillCommandsForAgents({
          cfg,
          agentIds: [boundRoute.agentId],
        })
      : [];
  const nativeCommands = nativeEnabled
    ? listNativeCommandSpecsForConfig(cfg, {
        skillCommands,
        provider: "telegram",
      })
    : [];
  const capitalStatusCommands = nativeEnabled
    ? [
        CAPITAL_QUOTE_TELEGRAM_COMMAND,
        CAPITAL_STATUS_TELEGRAM_COMMAND,
        OKX_STATUS_TELEGRAM_COMMAND,
        MENU_TELEGRAM_COMMAND,
      ]
    : [];
  const reservedCommands = new Set(
    listNativeCommandSpecs().map((command) => normalizeTelegramCommandName(command.name)),
  );
  for (const command of capitalStatusCommands) {
    reservedCommands.add(command.command);
  }
  for (const command of skillCommands) {
    reservedCommands.add(normalizeLowercaseStringOrEmpty(command.name));
  }
  const customResolution = resolveTelegramCustomCommands({
    commands: telegramCfg.customCommands,
    reservedCommands,
  });
  for (const issue of customResolution.issues) {
    runtime.error?.(danger(issue.message));
  }
  const customCommands = customResolution.commands;
  const pluginCommandSpecs =
    (
      telegramDeps.getPluginCommandSpecs ?? defaultTelegramNativeCommandDeps.getPluginCommandSpecs
    )?.("telegram") ?? [];
  const existingCommands = new Set(
    [
      ...capitalStatusCommands.map((command) => command.command),
      ...nativeCommands.map((command) => normalizeTelegramCommandName(command.name)),
      ...customCommands.map((command) => command.command),
    ].map((command) => normalizeLowercaseStringOrEmpty(command)),
  );
  const pluginCatalog = buildPluginTelegramMenuCommands({
    specs: pluginCommandSpecs,
    existingCommands,
  });
  for (const issue of pluginCatalog.issues) {
    runtime.error?.(danger(issue));
  }
  const loadFreshRuntimeConfig = (): OpenClawConfig => telegramDeps.getRuntimeConfig();
  const resolveFreshTelegramConfig = (runtimeCfg: OpenClawConfig): TelegramAccountConfig => {
    try {
      return resolveTelegramAccount({
        cfg: runtimeCfg,
        accountId,
      }).config;
    } catch (error) {
      logVerbose(
        `telegram native command: failed to load fresh account config for ${accountId}; using startup snapshot: ${String(error)}`,
      );
      return telegramCfg;
    }
  };
  const allCommandsFull: Array<{ command: string; description: string }> = [
    ...capitalStatusCommands,
    ...nativeCommands
      .map((command) => {
        const normalized = normalizeTelegramCommandName(command.name);
        if (!TELEGRAM_COMMAND_NAME_PATTERN.test(normalized)) {
          runtime.error?.(
            danger(
              `Native command "${command.name}" is invalid for Telegram (resolved to "${normalized}"). Skipping.`,
            ),
          );
          return null;
        }
        return {
          command: normalized,
          description: command.description,
        };
      })
      .filter((cmd): cmd is { command: string; description: string } => cmd !== null),
    ...(nativeEnabled ? pluginCatalog.commands : []),
    ...customCommands,
  ];
  const {
    commandsToRegister,
    totalCommands,
    maxCommands,
    overflowCount,
    maxTotalChars,
    descriptionTrimmed,
    textBudgetDropCount,
  } = buildCappedTelegramMenuCommands({
    allCommands: allCommandsFull,
  });
  if (overflowCount > 0) {
    runtime.log?.(
      `Telegram limits bots to ${maxCommands} commands. ` +
        `${totalCommands} configured; registering first ${maxCommands}. ` +
        `Use channels.telegram.commands.native: false to disable, or reduce plugin/skill/custom commands.`,
    );
  }
  if (descriptionTrimmed) {
    runtime.log?.(
      `Telegram menu text exceeded the conservative ${maxTotalChars}-character payload budget; shortening descriptions to keep ${commandsToRegister.length} commands visible.`,
    );
  }
  if (textBudgetDropCount > 0) {
    runtime.log?.(
      `Telegram menu text still exceeded the conservative ${maxTotalChars}-character payload budget after shortening descriptions; registering first ${commandsToRegister.length} commands.`,
    );
  }
  const syncTelegramMenuCommands =
    telegramDeps.syncTelegramMenuCommands ?? syncTelegramMenuCommandsRuntime;
  // Telegram only limits the setMyCommands payload (menu entries).
  // Keep hidden commands callable by registering handlers for the full catalog.
  syncTelegramMenuCommands({
    bot,
    runtime,
    commandsToRegister,
    accountId,
    botIdentity: opts.token,
  });

  const resolveCommandRuntimeContext = async (params: {
    msg: NonNullable<TelegramNativeCommandContext["message"]>;
    runtimeCfg: OpenClawConfig;
    isGroup: boolean;
    isForum: boolean;
    resolvedThreadId?: number;
    senderId?: string;
    topicAgentId?: string;
  }): Promise<{
    chatId: number;
    threadSpec: ReturnType<typeof resolveTelegramThreadSpec>;
    route: ReturnType<typeof resolveTelegramConversationRoute>["route"];
    mediaLocalRoots: readonly string[] | undefined;
    tableMode: ReturnType<typeof resolveMarkdownTableMode>;
    chunkMode: TelegramChunkMode;
  } | null> => {
    const { msg, runtimeCfg, isGroup, isForum, resolvedThreadId, senderId, topicAgentId } = params;
    const chatId = msg.chat.id;
    const messageThreadId = (msg as { message_thread_id?: number }).message_thread_id;
    const threadSpec = resolveTelegramThreadSpec({
      isGroup,
      isForum,
      messageThreadId: resolvedThreadId ?? messageThreadId,
    });
    let { route, configuredBinding } = resolveTelegramConversationRoute({
      cfg: runtimeCfg,
      accountId,
      chatId,
      isGroup,
      resolvedThreadId,
      replyThreadId: threadSpec.id,
      senderId,
      topicAgentId,
    });
    const nativeCommandRuntime = await loadTelegramNativeCommandRuntime();
    if (configuredBinding) {
      const ensured = await nativeCommandRuntime.ensureConfiguredBindingRouteReady({
        cfg: runtimeCfg,
        bindingResolution: configuredBinding,
      });
      if (!ensured.ok) {
        logVerbose(
          `telegram native command: configured ACP binding unavailable for topic ${configuredBinding.record.conversation.conversationId}: ${ensured.error}`,
        );
        await withTelegramApiErrorLogging({
          operation: "sendMessage",
          runtime,
          fn: () =>
            bot.api.sendMessage(
              chatId,
              "目前無法使用已設定的 ACP 綁定，請稍後再試。",
              buildTelegramThreadParams(threadSpec) ?? {},
            ),
        });
        return null;
      }
    }
    const mediaLocalRoots = nativeCommandRuntime.getAgentScopedMediaLocalRoots(
      runtimeCfg,
      route.agentId,
    );
    const tableMode = resolveMarkdownTableMode({
      cfg: runtimeCfg,
      channel: "telegram",
      accountId: route.accountId,
    });
    const chunkMode = nativeCommandRuntime.resolveChunkMode(
      runtimeCfg,
      "telegram",
      route.accountId,
    );
    return { chatId, threadSpec, route, mediaLocalRoots, tableMode, chunkMode };
  };
  const buildCommandDeliveryBaseOptions = (params: {
    cfg: OpenClawConfig;
    chatId: string | number;
    accountId: string;
    sessionKeyForInternalHooks?: string;
    policySessionKey?: string;
    mirrorIsGroup?: boolean;
    mirrorGroupId?: string;
    mediaLocalRoots?: readonly string[];
    threadSpec: ReturnType<typeof resolveTelegramThreadSpec>;
    tableMode: ReturnType<typeof resolveMarkdownTableMode>;
    chunkMode: TelegramChunkMode;
    linkPreview?: boolean;
  }) => ({
    cfg: params.cfg,
    chatId: String(params.chatId),
    accountId: params.accountId,
    sessionKeyForInternalHooks: params.sessionKeyForInternalHooks,
    policySessionKey: params.policySessionKey,
    mirrorIsGroup: params.mirrorIsGroup,
    mirrorGroupId: params.mirrorGroupId,
    token: opts.token,
    runtime,
    bot,
    mediaLocalRoots: params.mediaLocalRoots,
    replyToMode,
    textLimit,
    thread: params.threadSpec,
    tableMode: params.tableMode,
    chunkMode: params.chunkMode,
    linkPreview: params.linkPreview,
  });

  if (commandsToRegister.length > 0 || pluginCatalog.commands.length > 0) {
    if (nativeEnabled) {
      bot.command(
        CAPITAL_QUOTE_TELEGRAM_COMMAND.command,
        async (ctx: TelegramNativeCommandContext) => {
          const msg = ctx.message;
          if (!msg) {
            return;
          }
          if (shouldSkipUpdate(ctx)) {
            return;
          }
          const runtimeCfg = loadFreshRuntimeConfig();
          const runtimeTelegramCfg = resolveFreshTelegramConfig(runtimeCfg);
          const auth = await resolveTelegramCommandAuth({
            msg,
            bot,
            cfg: runtimeCfg,
            accountId,
            telegramCfg: runtimeTelegramCfg,
            readChannelAllowFromStore: telegramDeps.readChannelAllowFromStore,
            allowFrom,
            groupAllowFrom,
            useAccessGroups,
            resolveGroupPolicy,
            resolveTelegramGroupConfig,
            requireAuth: true,
          });
          if (!auth) {
            return;
          }
          const { chatId, threadParams } = await resolveTelegramNativeCommandThreadContext({
            msg,
            bot,
          });
          const replyText = await buildCapitalQuoteTelegramReplyFromScript({
            match: ctx.match,
            repoRoot: process.env.OPENCLAW_REPO_ROOT || process.cwd(),
          });
          const replyMarkup = buildInlineKeyboard(buildCapitalQuoteNativeCommandButtons(ctx.match));
          await withTelegramApiErrorLogging({
            operation: "sendMessage",
            runtime,
            fn: () =>
              bot.api.sendMessage(chatId, replyText, {
                ...(replyMarkup ? { reply_markup: replyMarkup } : {}),
                ...threadParams,
              }),
          });
        },
      );
      bot.command(
        CAPITAL_STATUS_TELEGRAM_COMMAND.command,
        async (ctx: TelegramNativeCommandContext) => {
          const msg = ctx.message;
          if (!msg) {
            return;
          }
          if (shouldSkipUpdate(ctx)) {
            return;
          }
          const runtimeCfg = loadFreshRuntimeConfig();
          const runtimeTelegramCfg = resolveFreshTelegramConfig(runtimeCfg);
          const auth = await resolveTelegramCommandAuth({
            msg,
            bot,
            cfg: runtimeCfg,
            accountId,
            telegramCfg: runtimeTelegramCfg,
            readChannelAllowFromStore: telegramDeps.readChannelAllowFromStore,
            allowFrom,
            groupAllowFrom,
            useAccessGroups,
            resolveGroupPolicy,
            resolveTelegramGroupConfig,
            requireAuth: true,
          });
          if (!auth) {
            return;
          }
          const { chatId, threadParams } = await resolveTelegramNativeCommandThreadContext({
            msg,
            bot,
          });
          const replyText = await buildCapitalStatusTelegramReplyFromScript({
            repoRoot: process.env.OPENCLAW_REPO_ROOT || process.cwd(),
          });
          const replyMarkup = buildInlineKeyboard(buildCapitalStatusNativeCommandButtons());
          await withTelegramApiErrorLogging({
            operation: "sendMessage",
            runtime,
            fn: () =>
              bot.api.sendMessage(chatId, replyText, {
                ...(replyMarkup ? { reply_markup: replyMarkup } : {}),
                ...threadParams,
              }),
          });
        },
      );
      bot.command(
        OKX_STATUS_TELEGRAM_COMMAND.command,
        async (ctx: TelegramNativeCommandContext) => {
          const msg = ctx.message;
          if (!msg) {
            return;
          }
          if (shouldSkipUpdate(ctx)) {
            return;
          }
          const runtimeCfg = loadFreshRuntimeConfig();
          const runtimeTelegramCfg = resolveFreshTelegramConfig(runtimeCfg);
          const auth = await resolveTelegramCommandAuth({
            msg,
            bot,
            cfg: runtimeCfg,
            accountId,
            telegramCfg: runtimeTelegramCfg,
            readChannelAllowFromStore: telegramDeps.readChannelAllowFromStore,
            allowFrom,
            groupAllowFrom,
            useAccessGroups,
            resolveGroupPolicy,
            resolveTelegramGroupConfig,
            requireAuth: true,
          });
          if (!auth) {
            return;
          }
          const { chatId, threadParams } = await resolveTelegramNativeCommandThreadContext({
            msg,
            bot,
          });
          const replyText = await buildOkxStatusTelegramReplyFromScript({
            repoRoot: process.env.OPENCLAW_REPO_ROOT || process.cwd(),
          });
          const replyMarkup = buildInlineKeyboard(buildCapitalStatusNativeCommandButtons());
          await withTelegramApiErrorLogging({
            operation: "sendMessage",
            runtime,
            fn: () =>
              bot.api.sendMessage(chatId, replyText, {
                ...(replyMarkup ? { reply_markup: replyMarkup } : {}),
                ...threadParams,
              }),
          });
        },
      );
      bot.command(MENU_TELEGRAM_COMMAND.command, async (ctx: TelegramNativeCommandContext) => {
        const msg = ctx.message;
        if (!msg) {
          return;
        }
        if (shouldSkipUpdate(ctx)) {
          return;
        }
        const runtimeCfg = loadFreshRuntimeConfig();
        const runtimeTelegramCfg = resolveFreshTelegramConfig(runtimeCfg);
        const auth = await resolveTelegramCommandAuth({
          msg,
          bot,
          cfg: runtimeCfg,
          accountId,
          telegramCfg: runtimeTelegramCfg,
          readChannelAllowFromStore: telegramDeps.readChannelAllowFromStore,
          allowFrom,
          groupAllowFrom,
          useAccessGroups,
          resolveGroupPolicy,
          resolveTelegramGroupConfig,
          requireAuth: true,
        });
        if (!auth) {
          return;
        }
        const { chatId, threadParams } = await resolveTelegramNativeCommandThreadContext({
          msg,
          bot,
        });
        const replyMarkup = buildInlineKeyboard(buildTelegramMainMenuButtons());
        await withTelegramApiErrorLogging({
          operation: "sendMessage",
          runtime,
          fn: () =>
            bot.api.sendMessage(chatId, TELEGRAM_MAIN_MENU_TEXT, {
              ...(replyMarkup ? { reply_markup: replyMarkup } : {}),
              ...threadParams,
            }),
        });
      });
    }
    for (const command of nativeCommands) {
      const normalizedCommandName = normalizeTelegramCommandName(command.name);
      bot.command(normalizedCommandName, async (ctx: TelegramNativeCommandContext) => {
        const msg = ctx.message;
        if (!msg) {
          return;
        }
        if (shouldSkipUpdate(ctx)) {
          return;
        }
        const runtimeCfg = loadFreshRuntimeConfig();
        const runtimeTelegramCfg = resolveFreshTelegramConfig(runtimeCfg);
        const auth = await resolveTelegramCommandAuth({
          msg,
          bot,
          cfg: runtimeCfg,
          accountId,
          telegramCfg: runtimeTelegramCfg,
          readChannelAllowFromStore: telegramDeps.readChannelAllowFromStore,
          allowFrom,
          groupAllowFrom,
          useAccessGroups,
          resolveGroupPolicy,
          resolveTelegramGroupConfig,
          requireAuth: true,
        });
        if (!auth) {
          return;
        }
        const {
          chatId,
          isGroup,
          isForum,
          resolvedThreadId,
          senderId,
          senderUsername,
          groupConfig,
          topicConfig,
          commandAuthorized,
        } = auth;
        if (normalizedCommandName === "status") {
          const statusPayload = buildTelegramRuntimeStatusCommandPayload({
            commandText: "/status",
            preferredRepoRoot: process.env.OPENCLAW_REPO_ROOT || process.cwd(),
            includeTradingButtons: true,
            includeReturnMainMenu: true,
          });
          if (statusPayload) {
            const { threadParams } = await resolveTelegramNativeCommandThreadContext({
              msg,
              bot,
            });
            const replyMarkup = buildInlineKeyboard(statusPayload.buttons);
            await withTelegramApiErrorLogging({
              operation: "sendMessage",
              runtime,
              fn: () =>
                bot.api.sendMessage(chatId, statusPayload.replyText, {
                  ...(replyMarkup ? { reply_markup: replyMarkup } : {}),
                  ...threadParams,
                }),
            });
            return;
          }
        }
        const runtimeContext = await resolveCommandRuntimeContext({
          msg,
          runtimeCfg,
          isGroup,
          isForum,
          resolvedThreadId,
          senderId,
          topicAgentId: topicConfig?.agentId,
        });
        if (!runtimeContext) {
          return;
        }
        const { threadSpec, route, mediaLocalRoots, tableMode, chunkMode } = runtimeContext;
        const threadParams = buildTelegramThreadParams(threadSpec) ?? {};
        const originatingTo = buildTelegramRoutingTarget(chatId, threadSpec);
        const executionCfg = getRuntimeConfigSnapshot() ?? cfg;

        const commandDefinition = findCommandByNativeName(command.name, "telegram");
        const rawText = ctx.match?.trim() ?? "";
        const commandArgs = commandDefinition
          ? parseCommandArgs(commandDefinition, rawText)
          : rawText
            ? ({ raw: rawText } satisfies CommandArgs)
            : undefined;
        const prompt = commandDefinition
          ? buildCommandTextFromArgs(commandDefinition, commandArgs)
          : rawText
            ? `/${command.name} ${rawText}`
            : `/${command.name}`;
        let cachedTargetSessionKey: string | undefined;
        let cachedNativeCommandRuntime:
          | Awaited<ReturnType<typeof loadTelegramNativeCommandRuntime>>
          | undefined;
        const resolveNativeCommandRuntime = async () => {
          cachedNativeCommandRuntime ??= await loadTelegramNativeCommandRuntime();
          return cachedNativeCommandRuntime;
        };
        const resolveTargetSessionKey = async (): Promise<string> => {
          if (cachedTargetSessionKey) {
            return cachedTargetSessionKey;
          }
          const baseSessionKey = resolveTelegramConversationBaseSessionKey({
            cfg: runtimeCfg,
            route,
            chatId,
            isGroup,
            senderId,
          });
          const dmThreadId = threadSpec.scope === "dm" ? threadSpec.id : undefined;
          const directConfig = !isGroup
            ? (groupConfig as TelegramDirectConfig | undefined)
            : undefined;
          const threadKeys =
            shouldUseTelegramDmThreadSession({
              dmThreadId,
              accountConfig: runtimeTelegramCfg,
              directConfig,
              topicConfig,
            }) && dmThreadId != null
              ? (await resolveNativeCommandRuntime()).resolveThreadSessionKeys({
                  baseSessionKey,
                  threadId: `${chatId}:${dmThreadId}`,
                })
              : null;
          cachedTargetSessionKey = threadKeys?.sessionKey ?? baseSessionKey;
          return cachedTargetSessionKey;
        };
        const menuNeedsModelContext =
          commandDefinition?.argsMenu &&
          !(commandArgs?.raw && !commandArgs.values) &&
          commandDefinition.args?.some(
            (arg) => typeof arg.choices === "function" && commandArgs?.values?.[arg.name] == null,
          );
        const menuModelContext =
          commandDefinition && menuNeedsModelContext
            ? resolveTelegramCommandMenuModelContext({
                cfg: runtimeCfg,
                agentId: route.agentId,
                sessionKey: await resolveTargetSessionKey(),
              })
            : {};
        const menu = commandDefinition
          ? resolveCommandArgMenu({
              command: commandDefinition,
              args: commandArgs,
              cfg: runtimeCfg,
              ...menuModelContext,
            })
          : null;
        if (menu && commandDefinition) {
          const title = formatCommandArgMenuTitle({ command: commandDefinition, menu });
          const rows: Array<Array<{ text: string; callback_data: string }>> = [];
          for (let i = 0; i < menu.choices.length; i += 2) {
            const slice = menu.choices.slice(i, i + 2);
            rows.push(
              slice.map((choice) => {
                const args: CommandArgs = {
                  values: { [menu.arg.name]: choice.value },
                };
                return {
                  text: choice.label,
                  callback_data: buildTelegramNativeCommandCallbackData(
                    buildCommandTextFromArgs(commandDefinition, args),
                  ),
                };
              }),
            );
          }
          const replyMarkup = buildInlineKeyboard(rows);
          await withTelegramApiErrorLogging({
            operation: "sendMessage",
            runtime,
            fn: () =>
              bot.api.sendMessage(chatId, title, {
                ...(replyMarkup ? { reply_markup: replyMarkup } : {}),
                ...threadParams,
              }),
          });
          return;
        }
        const nativeCommandRuntime = await resolveNativeCommandRuntime();
        const sessionKey = await resolveTargetSessionKey();
        const { skillFilter, groupSystemPrompt } = resolveTelegramGroupPromptSettings({
          groupConfig,
          topicConfig,
        });
        const { sessionKey: commandSessionKey, commandTargetSessionKey } =
          resolveNativeCommandSessionTargets({
            agentId: route.agentId,
            sessionPrefix: "telegram:slash",
            userId: String(senderId || chatId),
            targetSessionKey: sessionKey,
          });
        const deliveryBaseOptions = buildCommandDeliveryBaseOptions({
          cfg: executionCfg,
          chatId,
          accountId: route.accountId,
          sessionKeyForInternalHooks: commandSessionKey,
          policySessionKey: commandTargetSessionKey,
          mirrorIsGroup: isGroup,
          mirrorGroupId: isGroup ? String(chatId) : undefined,
          mediaLocalRoots,
          threadSpec,
          tableMode,
          chunkMode,
          linkPreview: runtimeTelegramCfg.linkPreview,
        });
        const conversationLabel = isGroup
          ? msg.chat.title
            ? `${msg.chat.title} id:${chatId}`
            : `group:${chatId}`
          : (buildSenderName(msg) ?? String(senderId || chatId));
        const ctxPayload = nativeCommandRuntime.finalizeInboundContext({
          Body: prompt,
          BodyForAgent: prompt,
          RawBody: prompt,
          CommandBody: prompt,
          CommandArgs: commandArgs,
          From: isGroup ? buildTelegramGroupFrom(chatId, resolvedThreadId) : `telegram:${chatId}`,
          To: `slash:${senderId || chatId}`,
          ChatType: isGroup ? "group" : "direct",
          ConversationLabel: conversationLabel,
          GroupSubject: isGroup ? (msg.chat.title ?? undefined) : undefined,
          GroupSystemPrompt: isGroup || (!isGroup && groupConfig) ? groupSystemPrompt : undefined,
          SenderName: buildSenderName(msg),
          SenderId: senderId || undefined,
          SenderUsername: senderUsername || undefined,
          Surface: "telegram",
          Provider: "telegram",
          MessageSid: String(msg.message_id),
          Timestamp: msg.date ? msg.date * 1000 : undefined,
          WasMentioned: true,
          CommandAuthorized: commandAuthorized,
          CommandSource: "native" as const,
          SessionKey: commandSessionKey,
          AccountId: route.accountId,
          CommandTargetSessionKey: commandTargetSessionKey,
          MessageThreadId: threadSpec.id,
          IsForum: isForum,
          // Originating context for sub-agent announce routing
          OriginatingChannel: "telegram" as const,
          OriginatingTo: originatingTo,
        });
        await nativeCommandRuntime.recordInboundSessionMetaSafe({
          cfg: executionCfg,
          agentId: route.agentId,
          sessionKey: commandTargetSessionKey,
          ctx: ctxPayload,
          onError: (err) =>
            runtime.error?.(danger(`telegram slash: failed updating session meta: ${String(err)}`)),
        });

        const disableBlockStreaming =
          resolveTelegramNativeCommandDisableBlockStreaming(runtimeTelegramCfg);
        const deliveryState = {
          delivered: false,
          skippedNonSilent: 0,
        };

        const { createChannelMessageReplyPipeline, deliverReplies } =
          await loadTelegramNativeCommandDeliveryRuntime();
        const { onModelSelected, ...replyPipeline } = createChannelMessageReplyPipeline({
          cfg: executionCfg,
          agentId: route.agentId,
          channel: "telegram",
          accountId: route.accountId,
        });

        await telegramDeps.dispatchReplyWithBufferedBlockDispatcher({
          ctx: ctxPayload,
          cfg: executionCfg,
          dispatcherOptions: {
            ...replyPipeline,
            beforeDeliver: async (payload) => payload,
            deliver: async (payload, _info) => {
              if (
                shouldSuppressLocalTelegramExecApprovalPrompt({
                  cfg: executionCfg,
                  accountId: route.accountId,
                  payload,
                })
              ) {
                deliveryState.delivered = true;
                return;
              }
              const result = await deliverReplies({
                replies: [
                  payload.replyToId
                    ? payload
                    : {
                        ...payload,
                        replyToId: String(msg.message_id),
                      },
                ],
                ...deliveryBaseOptions,
                silent: runtimeTelegramCfg.silentErrorReplies === true && payload.isError === true,
              });
              if (result.delivered) {
                deliveryState.delivered = true;
              }
            },
            onSkip: (_payload, info) => {
              if (info.reason !== "silent") {
                deliveryState.skippedNonSilent += 1;
              }
            },
            onError: (err, info) => {
              runtime.error?.(danger(`telegram slash ${info.kind} reply failed: ${String(err)}`));
            },
          },
          replyOptions: {
            skillFilter,
            disableBlockStreaming,
            onModelSelected,
          },
        });
        if (!deliveryState.delivered && deliveryState.skippedNonSilent > 0) {
          await deliverReplies({
            replies: [{ text: EMPTY_RESPONSE_FALLBACK }],
            ...deliveryBaseOptions,
          });
        }
      });
    }

    for (const pluginCommand of pluginCatalog.commands) {
      bot.command(pluginCommand.command, async (ctx: TelegramNativeCommandContext) => {
        const msg = ctx.message;
        if (!msg) {
          return;
        }
        if (shouldSkipUpdate(ctx)) {
          return;
        }
        const chatId = msg.chat.id;
        const runtimeCfg = loadFreshRuntimeConfig();
        const runtimeTelegramCfg = resolveFreshTelegramConfig(runtimeCfg);
        const { threadParams } = await resolveTelegramNativeCommandThreadContext({ msg, bot });
        const rawText = ctx.match?.trim() ?? "";
        const commandBody = `/${pluginCommand.command}${rawText ? ` ${rawText}` : ""}`;
        const nativeCommandRuntime = await loadTelegramNativeCommandRuntime();
        const match = nativeCommandRuntime.matchPluginCommand(commandBody);
        if (!match) {
          await withTelegramApiErrorLogging({
            operation: "sendMessage",
            runtime,
            fn: () => bot.api.sendMessage(chatId, "找不到這個指令。", threadParams ?? {}),
          });
          return;
        }
        const auth = await resolveTelegramCommandAuth({
          msg,
          bot,
          cfg: runtimeCfg,
          accountId,
          telegramCfg: runtimeTelegramCfg,
          readChannelAllowFromStore: telegramDeps.readChannelAllowFromStore,
          allowFrom,
          groupAllowFrom,
          useAccessGroups,
          resolveGroupPolicy,
          resolveTelegramGroupConfig,
          requireAuth: match.command.requireAuth !== false,
        });
        if (!auth) {
          return;
        }
        const { senderId, commandAuthorized, senderIsOwner, isGroup, isForum, resolvedThreadId } =
          auth;
        const runtimeContext = await resolveCommandRuntimeContext({
          msg,
          runtimeCfg,
          isGroup,
          isForum,
          resolvedThreadId,
          senderId,
          topicAgentId: auth.topicConfig?.agentId,
        });
        if (!runtimeContext) {
          return;
        }
        const { threadSpec, route, mediaLocalRoots, tableMode, chunkMode } = runtimeContext;
        const deliveryBaseOptions = buildCommandDeliveryBaseOptions({
          cfg: runtimeCfg,
          chatId,
          accountId: route.accountId,
          sessionKeyForInternalHooks: route.sessionKey,
          policySessionKey: route.sessionKey,
          mirrorIsGroup: isGroup,
          mirrorGroupId: isGroup ? String(chatId) : undefined,
          mediaLocalRoots,
          threadSpec,
          tableMode,
          chunkMode,
          linkPreview: runtimeTelegramCfg.linkPreview,
        });
        const from = isGroup ? buildTelegramGroupFrom(chatId, threadSpec.id) : `telegram:${chatId}`;
        const to = `telegram:${chatId}`;
        const { deliverReplies, emitTelegramMessageSentHooks } =
          await loadTelegramNativeCommandDeliveryRuntime();
        let progressMessageId: number | undefined;
        const progressPlaceholder = resolveTelegramProgressPlaceholder(match.command);

        if (progressPlaceholder) {
          try {
            const sent = await withTelegramApiErrorLogging({
              operation: "sendMessage",
              runtime,
              fn: () =>
                bot.api.sendMessage(
                  chatId,
                  progressPlaceholder,
                  buildTelegramThreadParams(threadSpec),
                ),
            });
            const maybeMessageId = (sent as { message_id?: unknown } | undefined)?.message_id;
            if (typeof maybeMessageId === "number") {
              progressMessageId = maybeMessageId;
            }
          } catch {
            // Fall back to the normal final reply path if the placeholder send fails.
          }
        }

        const sessionFileContext = await resolveTelegramCommandSessionFile({
          cfg: runtimeCfg,
          agentId: route.agentId,
          sessionKey: route.sessionKey,
          threadId: threadSpec.id,
        });

        const result = normalizeTelegramNativeReplyPayload(
          await nativeCommandRuntime.executePluginCommand({
            command: match.command,
            args: match.args,
            senderId,
            channel: "telegram",
            isAuthorizedSender: commandAuthorized,
            senderIsOwner,
            sessionKey: route.sessionKey,
            sessionId: sessionFileContext.sessionId,
            sessionFile: sessionFileContext.sessionFile,
            commandBody,
            config: runtimeCfg,
            from,
            to,
            accountId,
            messageThreadId: threadSpec.id,
          }),
        );

        if (
          shouldSuppressLocalTelegramExecApprovalPrompt({
            cfg: runtimeCfg,
            accountId: route.accountId,
            payload: result,
          })
        ) {
          await cleanupTelegramProgressPlaceholder({
            bot,
            chatId,
            progressMessageId,
            runtime,
          });
          return;
        }

        const deliverableResult = hasRenderableTelegramNativeReplyPayload(result)
          ? result
          : { text: EMPTY_RESPONSE_FALLBACK };
        const progressResultText =
          typeof deliverableResult.text === "string" && deliverableResult.text.trim().length > 0
            ? deliverableResult.text
            : null;
        const telegramResultData = resolveTelegramNativeReplyChannelData(deliverableResult);
        if (
          progressMessageId != null &&
          telegramDeps.editMessageTelegram &&
          progressResultText &&
          isEditableTelegramProgressResult(deliverableResult)
        ) {
          try {
            await telegramDeps.editMessageTelegram(chatId, progressMessageId, progressResultText, {
              cfg: runtimeCfg,
              accountId: route.accountId,
              textMode: "markdown",
              linkPreview: runtimeTelegramCfg.linkPreview,
              buttons: telegramResultData?.buttons,
            });
            recordSentMessage(chatId, progressMessageId, runtimeCfg);
            emitTelegramMessageSentHooks({
              sessionKeyForInternalHooks: route.sessionKey,
              chatId: String(chatId),
              accountId: route.accountId,
              content: progressResultText,
              success: true,
              messageId: progressMessageId,
              isGroup,
              groupId: isGroup ? String(chatId) : undefined,
            });
            return;
          } catch {
            // Fall through to cleanup + normal delivered reply if editing fails.
          }
        }
        await cleanupTelegramProgressPlaceholder({
          bot,
          chatId,
          progressMessageId,
          runtime,
        });
        await deliverReplies({
          replies: [deliverableResult],
          ...deliveryBaseOptions,
          silent:
            runtimeTelegramCfg.silentErrorReplies === true && deliverableResult.isError === true,
        });
      });
    }
  } else if (nativeDisabledExplicit) {
    withTelegramApiErrorLogging({
      operation: "setMyCommands",
      runtime,
      fn: () => bot.api.setMyCommands([]),
    }).catch(() => {});
    withTelegramApiErrorLogging({
      operation: "setMyCommands(all_group_chats)",
      runtime,
      fn: () => bot.api.setMyCommands([], { scope: { type: "all_group_chats" } }),
    }).catch(() => {});
  }
};
