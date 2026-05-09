import fs from "node:fs/promises";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  collectOpenClawControlledPaths,
  runOpenClawControlledPathsCheck,
} from "../../scripts/check-openclaw-controlled-paths.mjs";
import { createScriptTestHarness } from "./test-helpers.js";

const { createTempDir } = createScriptTestHarness();

async function writeTextFile(filePath: string, content: string): Promise<void> {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, content, "utf8");
}

function buildConfig(workspace: string, agentWorkspace = workspace) {
  return {
    gateway: {
      mode: "local",
      bind: "loopback",
      auth: {
        mode: "token",
        token: "test-token",
      },
      port: 18789,
    },
    agents: {
      defaults: {
        workspace,
      },
      list: [
        {
          id: "dev",
          default: true,
          workspace: agentWorkspace,
        },
      ],
    },
  };
}

async function createControlledPathsFixture(
  rootDir: string,
  options: { agentWorkspace?: string } = {},
): Promise<void> {
  const homeDir = path.join(rootDir, ".openclaw");
  const workspace = path.join(homeDir, "workspace-dev");
  const agentWorkspace = options.agentWorkspace ?? workspace;

  await writeTextFile(
    path.join(rootDir, ".env"),
    [
      `OPENCLAW_HOME=${homeDir}`,
      `OPENCLAW_STATE_DIR=${homeDir}`,
      `OPENCLAW_CONFIG_PATH=${path.join(homeDir, "openclaw.json")}`,
    ].join("\n"),
  );
  await writeTextFile(
    path.join(rootDir, ".npmrc"),
    [
      "node-linker=hoisted",
      `prefix=${path.join(rootDir, ".npm-global").replace(/\\/g, "/")}`,
      `cache=${path.join(rootDir, ".npm-cache").replace(/\\/g, "/")}`,
    ].join("\n"),
  );
  await writeTextFile(
    path.join(homeDir, "openclaw.json"),
    `${JSON.stringify(buildConfig(workspace, agentWorkspace), null, 2)}\n`,
  );
}

describe("check-openclaw-controlled-paths", () => {
  it("passes when OpenClaw-controlled workspaces stay on D", async () => {
    const rootDir = createTempDir("openclaw-controlled-paths-pass-");
    await createControlledPathsFixture(rootDir);

    const report = await collectOpenClawControlledPaths({ repoRoot: rootDir });

    expect(report.summary.ok).toBe(true);
    expect(report.summary.failed).toBe(0);
  });

  it("fails when a configured workspace drifts to C", async () => {
    const rootDir = createTempDir("openclaw-controlled-paths-fail-");
    await createControlledPathsFixture(rootDir, {
      agentWorkspace: "C:\\Users\\user\\OpenClaw",
    });

    const report = await collectOpenClawControlledPaths({ repoRoot: rootDir });
    const agentWorkspacesCheck = report.checks.find((entry) => entry.id === "agent-workspaces");

    expect(report.summary.ok).toBe(false);
    expect(agentWorkspacesCheck?.status).toBe("fail");
  });

  it("returns non-zero in --check mode when the config cannot be read", async () => {
    const rootDir = createTempDir("openclaw-controlled-paths-missing-");
    await writeTextFile(
      path.join(rootDir, ".env"),
      [
        `OPENCLAW_HOME=${path.join(rootDir, ".openclaw")}`,
        `OPENCLAW_STATE_DIR=${path.join(rootDir, ".openclaw")}`,
        `OPENCLAW_CONFIG_PATH=${path.join(rootDir, ".openclaw", "missing.json")}`,
      ].join("\n"),
    );
    await writeTextFile(
      path.join(rootDir, ".npmrc"),
      [
        "node-linker=hoisted",
        `prefix=${path.join(rootDir, ".npm-global").replace(/\\/g, "/")}`,
        `cache=${path.join(rootDir, ".npm-cache").replace(/\\/g, "/")}`,
      ].join("\n"),
    );

    const stdout: string[] = [];
    const stderr: string[] = [];

    const exitCode = await runOpenClawControlledPathsCheck({
      argv: ["--check"],
      repoRoot: rootDir,
      io: {
        stdout: { write: (text: string) => stdout.push(text) },
        stderr: { write: (text: string) => stderr.push(text) },
      },
    });

    expect(exitCode).toBe(1);
    expect(stderr.join("")).toContain("openclaw controlled paths check failed");
    expect(stdout.join("")).toContain("OpenClaw controlled paths");
  });
});
