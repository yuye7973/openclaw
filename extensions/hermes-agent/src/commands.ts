import type { PluginCommandContext, PluginCommandResult } from "openclaw/plugin-sdk/plugin-entry";
import { buildHermesPlan } from "./task-package.js";

export async function handleHermesCommand(ctx: PluginCommandContext): Promise<PluginCommandResult> {
  const args = ctx.args?.trim() ?? "";
  if (!args || args === "help" || args === "--help") {
    return {
      text: [
        "Hermes Agent creates guarded task packages.",
        "",
        "Usage:",
        "/hermes plan <request>",
        "",
        "This command is dry-run only. High-risk requests produce an approval request.",
      ].join("\n"),
    };
  }

  const request = args.toLowerCase().startsWith("plan ") ? args.slice(5).trim() : args;
  const plan = buildHermesPlan(request);
  return {
    text: JSON.stringify(plan, null, 2),
  };
}
