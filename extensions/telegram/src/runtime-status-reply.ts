import type { TelegramInlineButtons } from "./button-types.js";
import {
  formatTelegramRuntimeStatusSummary,
  type TelegramRuntimeStatusSummaryInput,
} from "./runtime-status-summary.js";

export type TelegramRuntimeStatusReply = {
  text: string;
  buttons: TelegramInlineButtons;
};

export type BuildTelegramRuntimeStatusReplyInput = {
  status: TelegramRuntimeStatusSummaryInput;
  includeTradingButtons?: boolean;
  includeReturnMainMenu?: boolean;
};

function buildStatusButtons(params: {
  includeTradingButtons: boolean;
  includeReturnMainMenu: boolean;
}): TelegramInlineButtons {
  const rows: Array<
    Array<{
      text: string;
      callback_data: string;
    }>
  > = [
    [
      { text: "🔄 重新整理", callback_data: "tgcmd:/status" },
      { text: "📊 報價狀態", callback_data: "tgcmd:/quote status" },
    ],
    [
      { text: "🧭 交易總覽", callback_data: "tgcmd:/capital_status" },
      { text: "🪙 OKX 狀態", callback_data: "tgcmd:/okx_status" },
    ],
  ];

  if (params.includeTradingButtons) {
    rows.push(
      [
        { text: "🟢 模擬下單（買）", callback_data: "tgcmd:/quote simlive tx00 buy 1" },
        { text: "🔴 模擬下單（賣）", callback_data: "tgcmd:/quote simlive tx00 sell 1" },
      ],
      [{ text: "📦 持倉摘要", callback_data: "tgcmd:/quote positions" }],
    );
  }

  if (params.includeReturnMainMenu) {
    rows.push([{ text: "↩ 返回主選單", callback_data: "tgcmd:/start" }]);
  }

  return rows;
}

export function buildTelegramRuntimeStatusReply(
  input: BuildTelegramRuntimeStatusReplyInput,
): TelegramRuntimeStatusReply {
  const includeTradingButtons = input.includeTradingButtons !== false;
  const includeReturnMainMenu = input.includeReturnMainMenu !== false;
  return {
    text: formatTelegramRuntimeStatusSummary(input.status),
    buttons: buildStatusButtons({
      includeTradingButtons,
      includeReturnMainMenu,
    }),
  };
}
