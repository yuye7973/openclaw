#!/usr/bin/env node
import crypto from "node:crypto";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const STARTUP_VBS_NAME = "OpenClaw Auto Trading Watch.vbs";

function defaultStartupDir() {
  if (process.env.OPENCLAW_AUTO_TRADING_STARTUP_DIR) {
    return process.env.OPENCLAW_AUTO_TRADING_STARTUP_DIR;
  }
  if (process.platform === "win32") {
    const appData = process.env.APPDATA || path.join(os.homedir(), "AppData", "Roaming");
    return path.join(appData, "Microsoft", "Windows", "Start Menu", "Programs", "Startup");
  }
  return path.join(process.cwd(), ".openclaw", "startup");
}

function defaultStatePath(repoRoot) {
  return path.join(repoRoot, ".openclaw", "ui", "auto-trading-watch-startup-state.json");
}

function sha256Text(text) {
  return crypto.createHash("sha256").update(text).digest("hex").toUpperCase();
}

function escapeVbsString(value) {
  return value.replaceAll('"', '""');
}

function buildLaunchCommand(launcherPath) {
  const powershellPath = path.join(
    process.env.SystemRoot || "C:\\Windows",
    "System32",
    "WindowsPowerShell",
    "v1.0",
    "powershell.exe",
  );
  return `"${powershellPath}" -NoProfile -WindowStyle Hidden -ExecutionPolicy Bypass -File "${launcherPath}"`;
}

function buildVbsText(command) {
  return [
    'Set shell = CreateObject("WScript.Shell")',
    `shell.Run "${escapeVbsString(command)}", 0, False`,
    "",
  ].join("\r\n");
}

async function writeJsonWithSha(filePath, value) {
  const text = `${JSON.stringify(value, null, 2)}\n`;
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, text, "utf8");
  await fs.writeFile(`${filePath}.sha256`, `${sha256Text(text)}\n`, "ascii");
}

async function readJson(filePath, label) {
  try {
    return JSON.parse(await fs.readFile(filePath, "utf8"));
  } catch (error) {
    throw new Error(`${label} not readable: ${filePath}`, { cause: error });
  }
}

function parseArgs(argv) {
  const options = {
    repoRoot: process.cwd(),
    startupDir: "",
    install: false,
    uninstall: false,
    check: false,
    preview: false,
    json: false,
    writeState: true,
  };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--repo-root") {
      options.repoRoot = argv[++index] ?? options.repoRoot;
    } else if (arg.startsWith("--repo-root=")) {
      options.repoRoot = arg.slice("--repo-root=".length);
    } else if (arg === "--startup-dir") {
      options.startupDir = argv[++index] ?? options.startupDir;
    } else if (arg.startsWith("--startup-dir=")) {
      options.startupDir = arg.slice("--startup-dir=".length);
    } else if (arg === "--install") {
      options.install = true;
    } else if (arg === "--uninstall") {
      options.uninstall = true;
    } else if (arg === "--check") {
      options.check = true;
    } else if (arg === "--preview") {
      options.preview = true;
    } else if (arg === "--json") {
      options.json = true;
    } else if (arg === "--no-write-state") {
      options.writeState = false;
    }
  }
  return options;
}

function formatHuman(plan) {
  return [
    "[auto-trading-watch-startup]",
    `status=${plan.status}`,
    `startupDir=${plan.startupDir}`,
    `vbs=${plan.vbsPath}`,
    `launcher=${plan.launcherPath}`,
    `mode=${plan.mode}`,
    `nextSafeTask=${plan.nextSafeTask}`,
  ].join(" ");
}

async function runAutoTradingWatchStartup(options = {}) {
  const repoRoot = path.resolve(options.repoRoot ?? process.cwd());
  const launcherPath = path.join(repoRoot, "scripts", "openclaw-auto-trading-watch-launch.ps1");
  const startupDir = path.resolve(options.startupDir || defaultStartupDir());
  const vbsPath = path.join(startupDir, STARTUP_VBS_NAME);
  const command = buildLaunchCommand(launcherPath);
  const vbsText = buildVbsText(command);
  const mode = options.uninstall ? "uninstall" : options.install ? "install" : options.check ? "check" : "preview";
  const plan = {
    schema: "openclaw.auto-trading-watch-startup.v1",
    generatedAt: new Date().toISOString(),
    repoRoot,
    startupDir,
    launcherPath,
    vbsPath,
    command,
    vbsSha256: sha256Text(vbsText),
    mode,
    status: mode,
    nextSafeTask:
      mode === "install"
        ? "Keep the Startup-folder launcher in place and wait for new SKQuoteLib callbacks."
        : mode === "uninstall"
          ? "Remove the Startup-folder launcher only if the daemon is no longer needed."
          : "Preview or check the Startup-folder launcher plan.",
  };

  if (options.writeState) {
    await writeJsonWithSha(defaultStatePath(repoRoot), plan);
  }

  if (mode === "check") {
    const saved = await readJson(defaultStatePath(repoRoot), "auto trading startup state");
    if (saved.schema !== "openclaw.auto-trading-watch-startup.v1") {
      throw new Error(`unexpected startup schema: ${saved.schema}`);
    }
    if (saved.launcherPath !== launcherPath) {
      throw new Error(`startup launcher mismatch: ${saved.launcherPath} != ${launcherPath}`);
    }
    if (saved.vbsPath !== vbsPath) {
      throw new Error(`startup vbs mismatch: ${saved.vbsPath} != ${vbsPath}`);
    }
    if (saved.command !== command) {
      throw new Error("startup command mismatch");
    }
    if (saved.vbsSha256 !== plan.vbsSha256) {
      throw new Error("startup VBS hash mismatch");
    }
    if (options.json) {
      process.stdout.write(`${JSON.stringify({ plan, saved }, null, 2)}\n`);
    } else {
      process.stdout.write(`${formatHuman(plan)}\n`);
    }
    process.stdout.write("AUTO_TRADING_WATCH_STARTUP_CHECK=OK\n");
    return { plan, saved };
  }

  if (options.json) {
    process.stdout.write(`${JSON.stringify(plan, null, 2)}\n`);
  } else {
    process.stdout.write(`${formatHuman(plan)}\n`);
  }

  if (mode === "preview") {
    return plan;
  }

  if (process.platform !== "win32") {
    throw new Error("Startup installation is only supported on Windows.");
  }

  await fs.mkdir(startupDir, { recursive: true });
  if (mode === "uninstall") {
    await fs.rm(vbsPath, { force: true });
    return { plan, removed: true };
  }

  await fs.writeFile(vbsPath, vbsText, "utf8");
  return { plan, installed: true };
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  await runAutoTradingWatchStartup(options);
}

const invokedPath = process.argv[1] ? path.resolve(process.argv[1]) : "";
if (invokedPath === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    process.stderr.write(
      `auto-trading watch startup failed: ${error instanceof Error ? error.message : String(error)}\n`,
    );
    process.exitCode = 1;
  });
}

export { runAutoTradingWatchStartup };
