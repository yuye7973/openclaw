import type { Message } from "grammy/types";

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function hasTelegramBotMention(text: string, botUsername?: string): boolean {
  const username = botUsername?.trim();
  return Boolean(
    username && new RegExp(`(?:^|\\s)@${escapeRegExp(username)}(?:\\b|\\s|$)`, "iu").test(text),
  );
}

export function canBypassModelForQuote(
  text: string,
  msg: Pick<Message, "chat">,
  botUsername?: string,
): boolean {
  if (text.trim().startsWith("/")) {
    return false;
  }
  const isGroup = msg.chat.type === "group" || msg.chat.type === "supergroup";
  return !isGroup || hasTelegramBotMention(text, botUsername);
}
