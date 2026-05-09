import fs from "node:fs/promises";
import path from "node:path";

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function stripBom(text) {
  return text.replace(/^\uFEFF/, "");
}

async function readJsonWithRetry(filePath, label, attempts = 5, delayMs = 100) {
  let lastError;
  for (let index = 0; index < attempts; index += 1) {
    try {
      const text = await fs.readFile(filePath, "utf8");
      return JSON.parse(stripBom(text));
    } catch (error) {
      lastError = error;
      if (index < attempts - 1) {
        await sleep(delayMs);
      }
    }
  }
  throw new Error(`${label} not readable: ${filePath}`, { cause: lastError });
}

async function readTextWithRetry(filePath, label, attempts = 5, delayMs = 100) {
  let lastError;
  for (let index = 0; index < attempts; index += 1) {
    try {
      return await fs.readFile(filePath, "utf8");
    } catch (error) {
      lastError = error;
      if (index < attempts - 1) {
        await sleep(delayMs);
      }
    }
  }
  throw new Error(`${label} not readable: ${filePath}`, { cause: lastError });
}

async function main() {
  const repoRoot = process.cwd();
  const servicePath = path.join(repoRoot, ".openclaw", "service", "auto-trading-watch-service.json");
  const pidPath = path.join(repoRoot, ".openclaw", "service", "auto-trading-watch-service.pid");
  const service = await readJsonWithRetry(servicePath, "auto trading watch service");
  const pidText = await readTextWithRetry(pidPath, "auto trading watch pid");
  const pid = Number(pidText.trim());

  if (service.schema !== "openclaw.auto-trading-watch-service.v1") {
    throw new Error(`unexpected daemon schema: ${service.schema}`);
  }
  if (service.status !== "running") {
    throw new Error(`daemon is not running: ${service.status}`);
  }
  if (!Number.isInteger(pid) || pid <= 0) {
    throw new Error(`invalid daemon pid: ${pidText}`);
  }
  if (service.pid !== pid) {
    throw new Error(`pid mismatch: ${service.pid} != ${pid}`);
  }
  if (service.watchScript !== path.join(repoRoot, "scripts", "openclaw-auto-trading-watch.mjs")) {
    throw new Error(`unexpected daemon watch script: ${service.watchScript}`);
  }

  process.stdout.write("AUTO_TRADING_WATCH_DAEMON_CHECK=OK\n");
}

await main().catch((error) => {
  process.stderr.write(
    `auto-trading watch daemon check failed: ${error instanceof Error ? error.message : String(error)}\n`,
  );
  process.exitCode = 1;
});
