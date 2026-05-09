import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const REQUIRED_DIRECTORIES = [
  {
    id: "agents-skills",
    label: "Agent skills",
    candidates: [".agents/skills"],
  },
  {
    id: "skills",
    label: "Workspace skills",
    candidates: ["skills"],
  },
  {
    id: "extensions",
    label: "Bundled plugins",
    candidates: ["extensions"],
  },
  {
    id: "hooks",
    label: "Hooks runtime",
    candidates: ["hooks", "src/hooks"],
  },
  {
    id: "cron",
    label: "Cron runtime",
    candidates: ["cron", "src/cron"],
  },
  {
    id: "gateway",
    label: "Gateway runtime",
    candidates: ["gateway", "src/gateway"],
  },
  {
    id: "runtime",
    label: "Core runtime",
    candidates: ["runtime", "src/runtime"],
  },
];

const REQUIRED_FILES = [
  {
    id: "docs-autonomous-runtime",
    label: "Autonomous runtime doc",
    path: "docs/automation/autonomous-runtime.md",
  },
  {
    id: "docs-module-skill-inventory",
    label: "Module skill inventory doc",
    path: "docs/automation/module-skill-inventory.md",
  },
  {
    id: "script-autonomous-inventory",
    label: "Autonomous inventory gate script",
    path: "scripts/openclaw-autonomous-inventory.mjs",
  },
  {
    id: "script-openclaw-controlled-paths",
    label: "OpenClaw controlled paths check",
    path: "scripts/check-openclaw-controlled-paths.mjs",
  },
  {
    id: "runtime-source-indexer",
    label: "Runtime source indexer anchor",
    path: "runtime/skills/source_indexer/source_indexer.py",
  },
  {
    id: "tengyi-401-pdf-skill",
    label: "Tengyi 401 PDF trainer skill",
    path: "skills/tengyi-401-pdf-autonomous-trainer/SKILL.md",
  },
];

const REQUIRED_MANIFESTS = [
  {
    id: "migrate-hermes-manifest",
    label: "migrate-hermes manifest",
    path: "extensions/migrate-hermes/openclaw.plugin.json",
  },
];

function toRepoPath(filePath) {
  return filePath.split(path.sep).join("/");
}

async function readJsonFile(filePath) {
  const text = await fs.readFile(filePath, "utf8");
  return JSON.parse(text);
}

async function resolveExistingPath(repoRoot, candidates) {
  for (const candidate of candidates) {
    const absolutePath = path.join(repoRoot, candidate);
    try {
      const stats = await fs.stat(absolutePath);
      if (stats.isDirectory()) {
        return { candidate, absolutePath };
      }
    } catch {
      // Continue.
    }
  }
  return undefined;
}

async function collectDirectoryChecks(repoRoot) {
  const checks = [];
  for (const entry of REQUIRED_DIRECTORIES) {
    const resolved = await resolveExistingPath(repoRoot, entry.candidates);
    checks.push({
      id: entry.id,
      label: entry.label,
      kind: "directory",
      required: entry.candidates,
      status: resolved ? "pass" : "fail",
      resolvedPath: resolved ? toRepoPath(path.relative(repoRoot, resolved.absolutePath)) : null,
      message: resolved
        ? `Found at ${toRepoPath(path.relative(repoRoot, resolved.absolutePath))}`
        : `Missing required directory candidates: ${entry.candidates.join(", ")}`,
    });
  }
  return checks;
}

async function collectFileChecks(repoRoot) {
  const checks = [];
  for (const entry of REQUIRED_FILES) {
    const absolutePath = path.join(repoRoot, entry.path);
    try {
      const stats = await fs.stat(absolutePath);
      checks.push({
        id: entry.id,
        label: entry.label,
        kind: "file",
        required: [entry.path],
        status: stats.isFile() ? "pass" : "fail",
        resolvedPath: stats.isFile() ? entry.path : null,
        message: stats.isFile() ? "Found" : "Path exists but is not a file",
      });
    } catch {
      checks.push({
        id: entry.id,
        label: entry.label,
        kind: "file",
        required: [entry.path],
        status: "fail",
        resolvedPath: null,
        message: "Missing required file",
      });
    }
  }
  return checks;
}

async function collectManifestChecks(repoRoot) {
  const checks = [];
  for (const entry of REQUIRED_MANIFESTS) {
    const absolutePath = path.join(repoRoot, entry.path);
    try {
      const manifest = await readJsonFile(absolutePath);
      const providers = manifest?.contracts?.migrationProviders;
      const hasProvider = Array.isArray(providers) && providers.includes("hermes");
      const idMatches = manifest?.id === "migrate-hermes";
      if (!idMatches || !hasProvider) {
        checks.push({
          id: entry.id,
          label: entry.label,
          kind: "manifest",
          required: [entry.path],
          status: "fail",
          resolvedPath: entry.path,
          message:
            "Manifest must declare id=migrate-hermes and contracts.migrationProviders including hermes",
        });
      } else {
        checks.push({
          id: entry.id,
          label: entry.label,
          kind: "manifest",
          required: [entry.path],
          status: "pass",
          resolvedPath: entry.path,
          message: "Manifest contract is valid",
        });
      }
    } catch (error) {
      checks.push({
        id: entry.id,
        label: entry.label,
        kind: "manifest",
        required: [entry.path],
        status: "fail",
        resolvedPath: null,
        message: `Manifest read failed: ${error instanceof Error ? error.message : String(error)}`,
      });
    }
  }
  return checks;
}

function summarizeChecks(checks) {
  const total = checks.length;
  const passed = checks.filter((entry) => entry.status === "pass").length;
  const failed = total - passed;
  return {
    total,
    passed,
    failed,
    ok: failed === 0,
  };
}

function formatHumanReport(report) {
  const lines = [
    "OpenClaw autonomous inventory",
    `Repo: ${report.repoRoot}`,
    `Summary: ${report.summary.passed}/${report.summary.total} passed, ${report.summary.failed} failed`,
  ];

  for (const check of report.checks) {
    const mark = check.status === "pass" ? "[PASS]" : "[FAIL]";
    lines.push(`${mark} ${check.kind}:${check.id} - ${check.message}`);
  }

  return lines.join("\n");
}

export async function collectAutonomousInventory(repoRoot = process.cwd()) {
  const normalizedRoot = path.resolve(repoRoot);
  const checks = [
    ...(await collectDirectoryChecks(normalizedRoot)),
    ...(await collectFileChecks(normalizedRoot)),
    ...(await collectManifestChecks(normalizedRoot)),
  ];
  return {
    repoRoot: toRepoPath(normalizedRoot),
    generatedAt: new Date().toISOString(),
    checks,
    summary: summarizeChecks(checks),
  };
}

export async function runAutonomousInventoryCheck({
  argv = process.argv.slice(2),
  io = { stdout: process.stdout, stderr: process.stderr },
  repoRoot = process.cwd(),
} = {}) {
  const checkMode = argv.includes("--check");
  const jsonMode = argv.includes("--json");
  const report = await collectAutonomousInventory(repoRoot);

  if (jsonMode) {
    io.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
  } else {
    io.stdout.write(`${formatHumanReport(report)}\n`);
  }

  if (!checkMode) {
    return 0;
  }

  if (report.summary.ok) {
    io.stdout.write("autonomous inventory check passed\n");
    return 0;
  }

  io.stderr.write("autonomous inventory check failed\n");
  for (const check of report.checks) {
    if (check.status !== "fail") {
      continue;
    }
    io.stderr.write(`- ${check.kind}:${check.id} (${check.required.join(" | ")})\n`);
  }
  return 1;
}

const invokedPath = process.argv[1] ? path.resolve(process.argv[1]) : "";
const currentPath = fileURLToPath(import.meta.url);
if (invokedPath === currentPath) {
  runAutonomousInventoryCheck()
    .then((exitCode) => {
      process.exitCode = exitCode;
    })
    .catch((error) => {
      process.stderr.write(
        `autonomous inventory check crashed: ${error instanceof Error ? (error.stack ?? error.message) : String(error)}\n`,
      );
      process.exitCode = 1;
    });
}
