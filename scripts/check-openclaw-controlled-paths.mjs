#!/usr/bin/env node

import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import process from "node:process";

function expandHome(input) {
  if (typeof input !== "string" || input.length === 0) {
    return input;
  }
  if (input === "~") {
    return os.homedir();
  }
  if (input.startsWith("~/") || input.startsWith("~\\")) {
    return path.join(os.homedir(), input.slice(2));
  }
  return input;
}

function normalizePath(input) {
  return path.resolve(expandHome(input));
}

function toPosix(value) {
  return value.split(path.sep).join("/");
}

function parseDotEnv(text) {
  const out = {};
  for (const rawLine of text.split(/\r?\n/u)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) {
      continue;
    }
    const equalsIndex = line.indexOf("=");
    if (equalsIndex === -1) {
      continue;
    }
    const key = line.slice(0, equalsIndex).trim();
    let value = line.slice(equalsIndex + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (key) {
      out[key] = value;
    }
  }
  return out;
}

function stripJsonBom(text) {
  return text.charCodeAt(0) === 0xfeff ? text.slice(1) : text;
}

async function readDotEnv(repoRoot) {
  const filePath = path.join(repoRoot, ".env");
  try {
    const content = await fs.readFile(filePath, "utf8");
    return parseDotEnv(content);
  } catch {
    return {};
  }
}

async function readNpmrc(repoRoot) {
  const filePath = path.join(repoRoot, ".npmrc");
  try {
    const content = await fs.readFile(filePath, "utf8");
    const out = {};
    for (const rawLine of content.split(/\r?\n/u)) {
      const line = rawLine.trim();
      if (!line || line.startsWith("#")) {
        continue;
      }
      const equalsIndex = line.indexOf("=");
      if (equalsIndex === -1) {
        continue;
      }
      const key = line.slice(0, equalsIndex).trim();
      const value = line.slice(equalsIndex + 1).trim();
      if (key) {
        out[key] = value;
      }
    }
    return out;
  } catch {
    return {};
  }
}

function readWorkspaceValue(config, repoRoot) {
  const workspace = config?.agents?.defaults?.workspace;
  const expectedWorkspace = path.resolve(repoRoot, ".openclaw", "workspace-dev");
  const resolvedWorkspace = typeof workspace === "string" ? normalizePath(workspace) : null;
  return {
    expectedWorkspace,
    resolvedWorkspace,
    workspace,
  };
}

function isInside(root, candidate) {
  const resolvedRoot = path.resolve(root);
  const resolvedCandidate = path.resolve(candidate);
  const relativePath = path.relative(resolvedRoot, resolvedCandidate);
  return relativePath === "" || (!relativePath.startsWith("..") && !path.isAbsolute(relativePath));
}

function summarizeChecks(checks) {
  const total = checks.length;
  const passed = checks.filter((check) => check.status === "pass").length;
  const failed = total - passed;
  return { total, passed, failed, ok: failed === 0 };
}

function formatHumanReport(report) {
  const lines = [
    "OpenClaw controlled paths",
    `Repo: ${report.repoRoot}`,
    `Config: ${report.configPath}`,
    `Summary: ${report.summary.passed}/${report.summary.total} passed, ${report.summary.failed} failed`,
  ];

  for (const check of report.checks) {
    const mark = check.status === "pass" ? "[PASS]" : "[FAIL]";
    lines.push(`${mark} ${check.id} - ${check.message}`);
  }

  return lines.join("\n");
}

function passCheck(id, message) {
  return { id, status: "pass", message };
}

function failCheck(id, message) {
  return { id, status: "fail", message };
}

function resolveOrNull(value) {
  if (typeof value !== "string" || value.length === 0) {
    return null;
  }
  return normalizePath(value);
}

function collectEnvChecks({ env, expectedConfigPath, expectedHome, expectedStateDir }) {
  const checks = [];
  const envEntries = [
    ["OPENCLAW_HOME", env.OPENCLAW_HOME, expectedHome],
    ["OPENCLAW_STATE_DIR", env.OPENCLAW_STATE_DIR, expectedStateDir],
    ["OPENCLAW_CONFIG_PATH", env.OPENCLAW_CONFIG_PATH, expectedConfigPath],
  ];

  for (const [id, actual, expected] of envEntries) {
    const normalized = resolveOrNull(actual);
    checks.push(
      normalized === expected
        ? passCheck(id, `${id} fixed to ${toPosix(expected)}`)
        : normalized
          ? failCheck(id, `${id} must be ${toPosix(expected)} but is ${toPosix(normalized)}`)
          : failCheck(id, `${id} is missing`),
    );
  }

  return checks;
}

function collectNpmChecks(npmrc, expectedPrefix, expectedCache) {
  const checks = [];
  const prefix = resolveOrNull(npmrc.prefix);
  const cache = resolveOrNull(npmrc.cache);

  checks.push(
    prefix === expectedPrefix
      ? passCheck("npm-prefix", `npm prefix fixed to ${toPosix(expectedPrefix)}`)
      : prefix
        ? failCheck(
            "npm-prefix",
            `npm prefix must be ${toPosix(expectedPrefix)} but is ${toPosix(prefix)}`,
          )
        : failCheck("npm-prefix", "npm prefix is missing"),
  );

  checks.push(
    cache === expectedCache
      ? passCheck("npm-cache", `npm cache fixed to ${toPosix(expectedCache)}`)
      : cache
        ? failCheck(
            "npm-cache",
            `npm cache must be ${toPosix(expectedCache)} but is ${toPosix(cache)}`,
          )
        : failCheck("npm-cache", "npm cache is missing"),
  );

  return checks;
}

function collectWorkspaceChecks(config, repoRoot) {
  const checks = [];
  const defaultWorkspaceInfo = readWorkspaceValue(config, repoRoot);
  const defaultsWorkspace = config?.agents?.defaults?.workspace;

  checks.push(
    typeof defaultsWorkspace === "string" &&
      defaultWorkspaceInfo.resolvedWorkspace === defaultWorkspaceInfo.expectedWorkspace
      ? passCheck(
          "default-workspace",
          `Default workspace fixed to ${toPosix(defaultWorkspaceInfo.expectedWorkspace)}`,
        )
      : typeof defaultsWorkspace === "string"
        ? failCheck(
            "default-workspace",
            `Default workspace must be ${toPosix(defaultWorkspaceInfo.expectedWorkspace)} but is ${toPosix(defaultWorkspaceInfo.resolvedWorkspace ?? defaultsWorkspace)}`,
          )
        : failCheck("default-workspace", "Default workspace is missing or invalid"),
  );

  const configuredAgents = Array.isArray(config?.agents?.list) ? config.agents.list : [];
  if (configuredAgents.length === 0) {
    checks.push(failCheck("agent-workspaces", "No configured agent workspaces were found"));
    return checks;
  }

  const expectedWorkspace = defaultWorkspaceInfo.expectedWorkspace;
  const mismatches = [];
  for (const agent of configuredAgents) {
    const workspace = typeof agent?.workspace === "string" ? normalizePath(agent.workspace) : null;
    if (workspace !== expectedWorkspace) {
      mismatches.push({
        id: typeof agent?.id === "string" ? agent.id : "<unknown>",
        workspace: workspace ?? "<missing>",
      });
    }
  }

  if (mismatches.length === 0) {
    checks.push(
      passCheck(
        "agent-workspaces",
        `All configured agent workspaces fixed to ${toPosix(expectedWorkspace)}`,
      ),
    );
  } else {
    checks.push(
      failCheck(
        "agent-workspaces",
        `Workspace drift detected: ${mismatches.map((entry) => `${entry.id}=${toPosix(entry.workspace)}`).join(", ")}`,
      ),
    );
  }

  checks.push(
    isInside(repoRoot, expectedWorkspace)
      ? passCheck(
          "workspace-root-drive",
          `Workspace root stays inside repo root ${toPosix(path.resolve(repoRoot))}`,
        )
      : failCheck(
          "workspace-root-drive",
          `Workspace root must stay inside repo root ${toPosix(path.resolve(repoRoot))}`,
        ),
  );

  return checks;
}

export async function collectOpenClawControlledPaths({
  repoRoot = process.cwd(),
  configPath,
} = {}) {
  const normalizedRepoRoot = path.resolve(repoRoot);
  const repoEnv = await readDotEnv(normalizedRepoRoot);
  const npmrc = await readNpmrc(normalizedRepoRoot);
  const effectiveEnv = {
    ...process.env,
    ...repoEnv,
  };

  const expectedHome = path.resolve(normalizedRepoRoot, ".openclaw");
  const expectedStateDir = expectedHome;
  const expectedConfigPath = path.resolve(normalizedRepoRoot, ".openclaw", "openclaw.json");
  const normalizedConfigPath = normalizePath(
    configPath ?? effectiveEnv.OPENCLAW_CONFIG_PATH ?? expectedConfigPath,
  );

  const checks = [
    ...collectEnvChecks({
      env: effectiveEnv,
      expectedConfigPath,
      expectedHome,
      expectedStateDir,
    }),
    ...collectNpmChecks(
      npmrc,
      path.resolve(normalizedRepoRoot, ".npm-global"),
      path.resolve(normalizedRepoRoot, ".npm-cache"),
    ),
  ];

  let config;
  try {
    const raw = await fs.readFile(normalizedConfigPath, "utf8");
    config = JSON.parse(stripJsonBom(raw));
    checks.push(passCheck("config-present", `Loaded ${toPosix(normalizedConfigPath)}`));
  } catch (error) {
    checks.push(
      failCheck(
        "config-present",
        `Unable to read config: ${error instanceof Error ? error.message : String(error)}`,
      ),
    );
    return {
      repoRoot: toPosix(normalizedRepoRoot),
      configPath: toPosix(normalizedConfigPath),
      generatedAt: new Date().toISOString(),
      checks,
      summary: summarizeChecks(checks),
    };
  }

  checks.push(...collectWorkspaceChecks(config, normalizedRepoRoot));

  return {
    repoRoot: toPosix(normalizedRepoRoot),
    configPath: toPosix(normalizedConfigPath),
    generatedAt: new Date().toISOString(),
    checks,
    summary: summarizeChecks(checks),
  };
}

export async function runOpenClawControlledPathsCheck({
  argv = process.argv.slice(2),
  io = { stdout: process.stdout, stderr: process.stderr },
  repoRoot = process.cwd(),
  configPath,
} = {}) {
  const checkMode = argv.includes("--check");
  const jsonMode = argv.includes("--json");

  for (let index = 0; index < argv.length; index += 1) {
    const current = argv[index];
    if (current === "--repo-root" && typeof argv[index + 1] === "string") {
      repoRoot = argv[index + 1];
      index += 1;
      continue;
    }
    if (current === "--config-path" && typeof argv[index + 1] === "string") {
      configPath = argv[index + 1];
      index += 1;
    }
  }

  const report = await collectOpenClawControlledPaths({ repoRoot, configPath });

  if (jsonMode) {
    io.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
  } else {
    io.stdout.write(`${formatHumanReport(report)}\n`);
  }

  if (!checkMode) {
    return 0;
  }

  if (report.summary.ok) {
    io.stdout.write("openclaw controlled paths check passed\n");
    return 0;
  }

  io.stderr.write("openclaw controlled paths check failed\n");
  for (const check of report.checks) {
    if (check.status === "fail") {
      io.stderr.write(`- ${check.id}\n`);
    }
  }
  return 1;
}

if (import.meta.main) {
  const exitCode = await runOpenClawControlledPathsCheck();
  process.exitCode = exitCode;
}
