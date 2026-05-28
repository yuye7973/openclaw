import { describe, expect, it } from "vitest";
import {
  buildTelegramMainMenuButtons,
  buildTelegramReturnMainMenuButtons,
  buildTelegramNativeCommandCallbackData,
  parseTelegramNativeCommandCallbackData,
} from "./bot-native-commands.js";

describe("telegram main menu buttons", () => {
  it("builds Chinese main menu buttons with tgcmd callbacks", () => {
    const buttons = buildTelegramMainMenuButtons();

    expect(buttons).toEqual([
      [{ text: "🛰 中控狀態", callback_data: "tgcmd:/status" }],
      [{ text: "📊 報價狀態", callback_data: "tgcmd:/quote status" }],
      [{ text: "🧭 交易總覽", callback_data: "tgcmd:/capital_status" }],
      [{ text: "🪙 OKX 狀態", callback_data: "tgcmd:/okx_status" }],
      [{ text: "🟢 模擬下單（買）", callback_data: "tgcmd:/quote simlive tx00 buy 1" }],
      [{ text: "🔥 真實下單（買）", callback_data: "tgcmd:/quote live cn0000 buy 1" }],
    ]);
  });

  it("builds return-main-menu button with /start callback", () => {
    const buttons = buildTelegramReturnMainMenuButtons();

    expect(buttons).toEqual([[{ text: "↩ 返回主選單", callback_data: "tgcmd:/start" }]]);
  });

  it("round-trips tgcmd callback payload parsing", () => {
    const callbackData = buildTelegramNativeCommandCallbackData("/capital_status");

    expect(callbackData).toBe("tgcmd:/capital_status");
    expect(parseTelegramNativeCommandCallbackData(callbackData)).toBe("/capital_status");
    expect(parseTelegramNativeCommandCallbackData("sc:tr:paper")).toBeNull();
    expect(parseTelegramNativeCommandCallbackData("")).toBeNull();
    expect(parseTelegramNativeCommandCallbackData(undefined)).toBeNull();
  });
});
