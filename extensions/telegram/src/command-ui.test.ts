import { describe, expect, it } from "vitest";
import { buildCommandsPaginationKeyboard } from "./command-ui.js";

describe("telegram command ui", () => {
  it("adds agent id to command pagination callback data when provided", () => {
    const keyboard = buildCommandsPaginationKeyboard(2, 3, "agent-main");
    expect(keyboard[0]).toEqual([
      { text: "◀ 上一頁", callback_data: "commands_page_1:agent-main" },
      { text: "2/3", callback_data: "commands_page_noop:agent-main" },
      { text: "下一頁 ▶", callback_data: "commands_page_3:agent-main" },
    ]);
  });

  it("trims agent id before composing pagination callback data", () => {
    const keyboard = buildCommandsPaginationKeyboard(2, 3, "  agent-main  ");
    expect(keyboard[0]).toEqual([
      { text: "◀ 上一頁", callback_data: "commands_page_1:agent-main" },
      { text: "2/3", callback_data: "commands_page_noop:agent-main" },
      { text: "下一頁 ▶", callback_data: "commands_page_3:agent-main" },
    ]);
  });
});
