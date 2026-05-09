import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { handleHermesCommand } from "./src/commands.js";

export default definePluginEntry({
  id: "hermes-agent",
  name: "Hermes Agent",
  description: "Guarded task-package bridge for OpenClaw planning, review, approval, and audit loops.",
  register(api) {
    api.registerCommand({
      name: "hermes",
      description: "Create a guarded Hermes task package for review.",
      acceptsArgs: true,
      handler: handleHermesCommand,
    });

    api.registerCli(
      async ({ program }) => {
        const { registerHermesCli } = await import("./src/cli.js");
        registerHermesCli(program);
      },
      {
        descriptors: [
          {
            name: "hermes",
            description: "Create guarded Hermes task packages and approval requests",
            hasSubcommands: true,
          },
        ],
      },
    );
  },
});
