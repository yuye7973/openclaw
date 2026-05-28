export type TelegramRuntimeTransport = "polling" | "webhook" | "unknown";
export type TelegramQuoteState = "realtime" | "delayed" | "disconnected" | "unknown";
export type TelegramStrategyState = "running" | "idle" | "blocked" | "unknown";
export type TelegramActivePageRefreshState =
  | "operator_refresh_required"
  | "paper_strategy_ready"
  | "blocked"
  | "unknown";

export type TelegramTradingShortcutsState = {
  status?: string;
  checks?: number;
  failed?: number;
  machineLine?: string;
  nextCommand?: string;
  nextCommandMachineLine?: string;
  gateVerified?: boolean;
};

export type TelegramPublishDryRunState = {
  status?: string;
  errorCode?: string;
  dryRun?: boolean;
  dryRunNoSend?: boolean;
  commandErrorCode?: string;
  messageHasShortcutChecks?: boolean;
  messageHasNextCommand?: boolean;
  generatedAtIso?: string;
};

export type TelegramTradingAgentsState = {
  status?: string;
  provider?: string;
  mode?: string;
  canAnalyzeNow?: boolean;
  canUseOfficialTradingAgents?: boolean;
  noOrderWrite?: boolean;
  noLiveOrderSent?: boolean;
  brokerWriteAttempted?: boolean;
  nextSafeTask?: string;
};

export type TelegramRuntimeStatusSummaryInput = {
  gateway: {
    reachable: boolean;
    bindHost?: string;
    port?: number;
    pid?: number;
  };
  telegram: {
    connected: boolean;
    transport: TelegramRuntimeTransport;
    botUsername?: string;
  };
  trading?: {
    quote: TelegramQuoteState;
    strategy: TelegramStrategyState;
    activePagePlan?: {
      status: TelegramActivePageRefreshState;
      activePageSize?: number;
      energyCandidateCount?: number;
      paperStrategyEligibleRouteCount?: number;
      operatorActionRequired?: boolean;
    };
    shortcuts?: TelegramTradingShortcutsState;
    publishDryRun?: TelegramPublishDryRunState;
    tradingAgents?: TelegramTradingAgentsState;
  };
  updatedAtIso?: string;
};

function mapTransportLabel(value: TelegramRuntimeTransport): string {
  switch (value) {
    case "polling":
      return "輪詢";
    case "webhook":
      return "Webhook";
    default:
      return "未知";
  }
}

function mapQuoteLabel(value: TelegramQuoteState): string {
  switch (value) {
    case "realtime":
      return "即時";
    case "delayed":
      return "延遲";
    case "disconnected":
      return "中斷";
    default:
      return "未知";
  }
}

function mapStrategyLabel(value: TelegramStrategyState): string {
  switch (value) {
    case "running":
      return "執行中";
    case "idle":
      return "待命";
    case "blocked":
      return "阻塞";
    default:
      return "未知";
  }
}

function mapActivePageRefreshLabel(value: TelegramActivePageRefreshState): string {
  switch (value) {
    case "operator_refresh_required":
      return "待操作者刷新";
    case "paper_strategy_ready":
      return "紙上策略就緒";
    case "blocked":
      return "阻塞";
    default:
      return "未知";
  }
}

function formatGatewayEndpoint(bindHost?: string, port?: number): string {
  const host = bindHost && bindHost.trim().length > 0 ? bindHost.trim() : "127.0.0.1";
  if (typeof port === "number" && Number.isFinite(port) && port > 0) {
    return `${host}:${port}`;
  }
  return host;
}

function formatUpdatedAt(iso?: string): string {
  if (!iso) {
    return "未提供";
  }
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return iso;
  }
  const parts = [
    `${date.getUTCFullYear()}`,
    `${date.getUTCMonth() + 1}`.padStart(2, "0"),
    `${date.getUTCDate()}`.padStart(2, "0"),
  ];
  const time = [
    `${date.getUTCHours()}`.padStart(2, "0"),
    `${date.getUTCMinutes()}`.padStart(2, "0"),
    `${date.getUTCSeconds()}`.padStart(2, "0"),
  ];
  return `${parts.join("-")} ${time.join(":")} UTC`;
}

function formatOptionalNumber(value: number | undefined): string {
  return typeof value === "number" && Number.isFinite(value) ? String(value) : "?";
}

function formatOptionalStatus(value: string | undefined): string {
  return value && value.trim().length > 0 ? value.trim() : "unknown";
}

function formatBooleanBadge(value: boolean | undefined): string {
  if (value === true) {
    return "✅";
  }
  if (value === false) {
    return "❌";
  }
  return "未知";
}

export function formatTelegramRuntimeStatusSummary(
  input: TelegramRuntimeStatusSummaryInput,
): string {
  const gatewayState = input.gateway.reachable ? "🟢 在線" : "🔴 離線";
  const gatewayEndpoint = formatGatewayEndpoint(input.gateway.bindHost, input.gateway.port);
  const gatewayPid =
    typeof input.gateway.pid === "number" && Number.isFinite(input.gateway.pid)
      ? `｜PID ${input.gateway.pid}`
      : "";

  const botName =
    input.telegram.botUsername && input.telegram.botUsername.trim().length > 0
      ? `@${input.telegram.botUsername.replace(/^@+/, "")}`
      : "未設定";
  const botConnect = input.telegram.connected ? "🟢 已連線" : "🔴 未連線";
  const botTransport = mapTransportLabel(input.telegram.transport);

  const lines = [
    "🛰 OpenClaw Telegram 中控",
    `🧩 Gateway：${gatewayState}（${gatewayEndpoint}${gatewayPid}）`,
    `🤖 Bot：${botName}｜${botTransport}｜${botConnect}`,
  ];

  if (input.trading) {
    lines.push(
      `📈 交易助手：報價=${mapQuoteLabel(input.trading.quote)}｜策略=${mapStrategyLabel(input.trading.strategy)}`,
    );
    if (input.trading.activePagePlan) {
      const activePage = input.trading.activePagePlan;
      const activeSize =
        typeof activePage.activePageSize === "number" ? String(activePage.activePageSize) : "?";
      const energyCandidates =
        typeof activePage.energyCandidateCount === "number"
          ? String(activePage.energyCandidateCount)
          : "?";
      const paperEligible =
        typeof activePage.paperStrategyEligibleRouteCount === "number"
          ? String(activePage.paperStrategyEligibleRouteCount)
          : "?";
      const operatorGate = activePage.operatorActionRequired ? "｜需要操作者刷新" : "";
      lines.push(
        `📦 ActivePage：${mapActivePageRefreshLabel(activePage.status)}｜active=${activeSize}｜能源候選=${energyCandidates}｜紙上候選=${paperEligible}${operatorGate}`,
      );
    }
    if (input.trading.shortcuts) {
      const shortcuts = input.trading.shortcuts;
      const gateVerified = shortcuts.gateVerified === true ? "✅" : "未知";
      lines.push(
        `🧪 Trading Shortcuts：${formatOptionalStatus(shortcuts.status)}｜checks=${formatOptionalNumber(
          shortcuts.checks,
        )}｜failed=${formatOptionalNumber(shortcuts.failed)}｜gate=${gateVerified}`,
      );
      if (shortcuts.machineLine) {
        lines.push(`   ${shortcuts.machineLine}`);
      }
      if (shortcuts.nextCommandMachineLine) {
        lines.push(`➡️ 下一步指令：${shortcuts.nextCommandMachineLine}`);
      } else if (shortcuts.nextCommand) {
        lines.push(`➡️ 下一步指令：${shortcuts.nextCommand}`);
      }
    }
    if (input.trading.publishDryRun) {
      const publish = input.trading.publishDryRun;
      lines.push(
        `📣 推播 Dry-run：${formatOptionalStatus(publish.status)}｜error=${formatOptionalStatus(
          publish.errorCode,
        )}｜noSend=${formatBooleanBadge(publish.dryRunNoSend)}｜cmd=${formatOptionalStatus(
          publish.commandErrorCode,
        )}`,
      );
      lines.push(
        `   payload=快捷檢查${formatBooleanBadge(
          publish.messageHasShortcutChecks,
        )} 下一步指令${formatBooleanBadge(publish.messageHasNextCommand)}`,
      );
    }
    if (input.trading.tradingAgents) {
      const tradingAgents = input.trading.tradingAgents;
      const noOrderContract =
        tradingAgents.noOrderWrite === true &&
        tradingAgents.noLiveOrderSent === true &&
        tradingAgents.brokerWriteAttempted === false;
      lines.push(
        `🤖 TradingAgents：${formatOptionalStatus(
          tradingAgents.status,
        )}｜provider=${formatOptionalStatus(tradingAgents.provider)}｜mode=${formatOptionalStatus(
          tradingAgents.mode,
        )}｜analyze=${formatBooleanBadge(
          tradingAgents.canAnalyzeNow,
        )}｜official=${formatBooleanBadge(
          tradingAgents.canUseOfficialTradingAgents,
        )}｜noOrder=${formatBooleanBadge(noOrderContract)}`,
      );
      if (tradingAgents.nextSafeTask) {
        lines.push(`   next=${tradingAgents.nextSafeTask}`);
      }
    }
  }

  lines.push(`🕒 更新時間：${formatUpdatedAt(input.updatedAtIso)}`);
  return lines.join("\n");
}
