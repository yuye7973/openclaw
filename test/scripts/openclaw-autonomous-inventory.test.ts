import fs from "node:fs/promises";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  collectAutonomousInventory,
  runAutonomousInventoryCheck,
} from "../../scripts/openclaw-autonomous-inventory.mjs";
import { createScriptTestHarness } from "./test-helpers.js";

const { createTempDir } = createScriptTestHarness();

async function writeFile(rootDir: string, relativePath: string, content: string): Promise<void> {
  const filePath = path.join(rootDir, relativePath);
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, content, "utf8");
}

async function createPassingFixture(rootDir: string): Promise<void> {
  for (const relativeDir of [
    ".agents/skills",
    "skills",
    "skills/tengyi-401-pdf-autonomous-trainer",
    "extensions/migrate-hermes",
    "src/hooks",
    "src/cron",
    "src/gateway",
    "runtime",
    "runtime/skills/source_indexer",
  ]) {
    await fs.mkdir(path.join(rootDir, relativeDir), { recursive: true });
  }

  await writeFile(rootDir, "docs/automation/autonomous-runtime.md", "# runtime\n");
  await writeFile(rootDir, "docs/automation/module-skill-inventory.md", "# inventory\n");
  await writeFile(rootDir, "scripts/openclaw-autonomous-inventory.mjs", "export {};\n");
  await writeFile(
    rootDir,
    "scripts/check-openclaw-controlled-paths.mjs",
    "export {};\n",
  );
  await writeFile(
    rootDir,
    "runtime/skills/source_indexer/source_indexer.py",
    "def collect_runtime_surface():\n    return {'status': 'available'}\n",
  );
  await writeFile(
    rootDir,
    "skills/tengyi-401-pdf-autonomous-trainer/SKILL.md",
    "---\nname: tengyi-401-pdf-autonomous-trainer\ndescription: Train 401 PDF workflows.\n---\n",
  );
  await writeFile(
    rootDir,
    "extensions/migrate-hermes/openclaw.plugin.json",
    JSON.stringify(
      {
        id: "migrate-hermes",
        contracts: { migrationProviders: ["hermes"] },
      },
      null,
      2,
    ),
  );
}

describe("openclaw-autonomous-inventory", () => {
  it("passes when required autonomous paths and manifest are present", async () => {
    const rootDir = createTempDir("openclaw-autonomous-inventory-pass-");
    await createPassingFixture(rootDir);

    const report = await collectAutonomousInventory(rootDir);

    expect(report.summary.ok).toBe(true);
    expect(report.summary.failed).toBe(0);
  });

  it("fails when autonomous docs are missing", async () => {
    const rootDir = createTempDir("openclaw-autonomous-inventory-doc-missing-");
    await createPassingFixture(rootDir);
    await fs.rm(path.join(rootDir, "docs/automation/autonomous-runtime.md"));

    const report = await collectAutonomousInventory(rootDir);
    const runtimeDocCheck = report.checks.find((entry) => entry.id === "docs-autonomous-runtime");

    expect(report.summary.ok).toBe(false);
    expect(runtimeDocCheck?.status).toBe("fail");
  });

  it("fails when the runtime anchor is missing", async () => {
    const rootDir = createTempDir("openclaw-autonomous-inventory-runtime-missing-");
    await createPassingFixture(rootDir);
    await fs.rm(path.join(rootDir, "runtime/skills/source_indexer/source_indexer.py"));

    const report = await collectAutonomousInventory(rootDir);
    const runtimeAnchorCheck = report.checks.find((entry) => entry.id === "runtime-source-indexer");

    expect(report.summary.ok).toBe(false);
    expect(runtimeAnchorCheck?.status).toBe("fail");
  });

  it("fails when the Tengyi 401 PDF skill is missing", async () => {
    const rootDir = createTempDir("openclaw-autonomous-inventory-skill-missing-");
    await createPassingFixture(rootDir);
    await fs.rm(path.join(rootDir, "skills/tengyi-401-pdf-autonomous-trainer/SKILL.md"));

    const report = await collectAutonomousInventory(rootDir);
    const skillCheck = report.checks.find((entry) => entry.id === "tengyi-401-pdf-skill");

    expect(report.summary.ok).toBe(false);
    expect(skillCheck?.status).toBe("fail");
  });

  it("fails when the controlled-paths check script is missing", async () => {
    const rootDir = createTempDir("openclaw-autonomous-inventory-controlled-paths-missing-");
    await createPassingFixture(rootDir);
    await fs.rm(path.join(rootDir, "scripts/check-openclaw-controlled-paths.mjs"));

    const report = await collectAutonomousInventory(rootDir);
    const controlledPathsCheck = report.checks.find(
      (entry) => entry.id === "script-openclaw-controlled-paths",
    );

    expect(report.summary.ok).toBe(false);
    expect(controlledPathsCheck?.status).toBe("fail");
  });

  it("returns non-zero in --check mode when required items are missing", async () => {
    const rootDir = createTempDir("openclaw-autonomous-inventory-check-fail-");
    await fs.mkdir(path.join(rootDir, "extensions"), { recursive: true });
    const stdout: string[] = [];
    const stderr: string[] = [];

    const exitCode = await runAutonomousInventoryCheck({
      argv: ["--check"],
      repoRoot: rootDir,
      io: {
        stdout: { write: (text: string) => stdout.push(text) },
        stderr: { write: (text: string) => stderr.push(text) },
      },
    });

    expect(exitCode).toBe(1);
    expect(stderr.join("")).toContain("autonomous inventory check failed");
    expect(stdout.join("")).toContain("OpenClaw autonomous inventory");
  });
});
