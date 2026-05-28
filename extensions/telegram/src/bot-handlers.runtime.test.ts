import { describe, expect, it } from "vitest";
import {
  buildTelegramInboundDebounceConversationKey,
  buildTelegramInboundDebounceKey,
} from "./bot-handlers.debounce-key.js";
import { canBypassModelForQuote, hasTelegramBotMention } from "./bot-handlers.quote-bypass.js";

describe("buildTelegramInboundDebounceKey", () => {
  it("uses the resolved account id instead of literal default when provided", () => {
    expect(
      buildTelegramInboundDebounceKey({
        accountId: "work",
        conversationKey: "12345",
        senderId: "67890",
        debounceLane: "default",
      }),
    ).toBe("telegram:work:12345:67890:default");
  });

  it("falls back to literal default only when account id is actually absent", () => {
    expect(
      buildTelegramInboundDebounceKey({
        accountId: undefined,
        conversationKey: "12345",
        senderId: "67890",
        debounceLane: "forward",
      }),
    ).toBe("telegram:default:12345:67890:forward");
  });

  it("keeps direct topic thread ids in the conversation key", () => {
    const topic100 = buildTelegramInboundDebounceConversationKey({ chatId: 7, threadId: 100 });
    const topic200 = buildTelegramInboundDebounceConversationKey({ chatId: 7, threadId: 200 });

    expect(topic100).toBe("7:topic:100");
    expect(topic200).toBe("7:topic:200");
    expect(
      buildTelegramInboundDebounceKey({
        accountId: "default",
        conversationKey: topic100,
        senderId: "42",
        debounceLane: "default",
      }),
    ).not.toBe(
      buildTelegramInboundDebounceKey({
        accountId: "default",
        conversationKey: topic200,
        senderId: "42",
        debounceLane: "default",
      }),
    );
  });

  it("uses the chat id as the conversation key when no thread is present", () => {
    expect(buildTelegramInboundDebounceConversationKey({ chatId: 7 })).toBe("7");
  });
});

describe("quote bypass policy", () => {
  it("detects explicit bot mention in group text", () => {
    expect(hasTelegramBotMention("請 @OpenClawBot 幫我看 A50 報價", "OpenClawBot")).toBe(true);
    expect(hasTelegramBotMention("請 @openclawbot 幫我看 A50 報價", "OpenClawBot")).toBe(true);
    expect(hasTelegramBotMention("請幫我看 A50 報價", "OpenClawBot")).toBe(false);
  });

  it("allows bypass in direct chat for non-command text", () => {
    expect(
      canBypassModelForQuote("A50 現在報價", {
        chat: { type: "private" },
      } as never),
    ).toBe(true);
  });

  it("blocks slash-command text from bypass", () => {
    expect(
      canBypassModelForQuote("/quote A50", {
        chat: { type: "private" },
      } as never),
    ).toBe(false);
  });

  it("requires mention when message comes from group chat", () => {
    expect(
      canBypassModelForQuote(
        "A50 現在報價",
        {
          chat: { type: "group" },
        } as never,
        "OpenClawBot",
      ),
    ).toBe(false);
    expect(
      canBypassModelForQuote(
        "@OpenClawBot A50 現在報價",
        {
          chat: { type: "group" },
        } as never,
        "OpenClawBot",
      ),
    ).toBe(true);
  });
});
