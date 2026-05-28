import { describe, expect, it } from "vitest";
import { buildTelegramInteractiveButtons } from "./button-types.js";
import { describeTelegramInteractiveButtonBehavior } from "./button-types.test-helpers.js";

describeTelegramInteractiveButtonBehavior();

describe("buildTelegramInteractiveButtons callback limits", () => {
  it("drops buttons whose callback payload exceeds Telegram limits", () => {
    expect(
      buildTelegramInteractiveButtons({
        blocks: [
          {
            type: "buttons",
            buttons: [
              { label: "Keep", value: "ok" },
              { label: "Drop", value: `x${"y".repeat(80)}` },
            ],
          },
        ],
      }),
    ).toEqual([[{ text: "Keep", callback_data: "ok", style: undefined }]]);
  });

  it("trims labels and drops whitespace-only labels", () => {
    expect(
      buildTelegramInteractiveButtons({
        blocks: [
          {
            type: "buttons",
            buttons: [
              { label: "  刷新報價  ", value: "quote:refresh" },
              { label: "   ", value: "quote:noop" },
            ],
          },
        ],
      }),
    ).toEqual([[{ text: "刷新報價", callback_data: "quote:refresh", style: undefined }]]);
  });

  it("removes zero-width chars from labels before rendering", () => {
    expect(
      buildTelegramInteractiveButtons({
        blocks: [
          {
            type: "buttons",
            buttons: [
              { label: "\u200B\u200D刷新報價\uFEFF", value: "quote:refresh" },
              { label: "\u200B\u200D\uFEFF", value: "quote:noop" },
            ],
          },
        ],
      }),
    ).toEqual([[{ text: "刷新報價", callback_data: "quote:refresh", style: undefined }]]);
  });
});
