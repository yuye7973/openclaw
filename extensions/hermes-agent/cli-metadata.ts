import { definePluginEntry } from "openclaw/plugin-sdk/core";

export default definePluginEntry({
  id: "hermes-agent",
  name: "Hermes Agent",
  description: "Guarded task-package bridge for OpenClaw planning, review, approval, and audit loops.",
  register(api) {
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
