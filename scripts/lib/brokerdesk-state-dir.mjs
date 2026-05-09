import { existsSync, readdirSync, statSync } from "node:fs";
import path from "node:path";

const BROKERDESK_ROOT = "D:\\群益及元大API\\BrokerDesk";
const PORTABLE_STATE_DIR = path.join(BROKERDESK_ROOT, "dist", "BrokerDesk", "state");
const CANONICAL_STATE_DIR = path.join(BROKERDESK_ROOT, "state");
const STAGING_PREFIX = "dist-staging-";
const STATE_PROBE_FILES = [
  "capital_latest_quote_event.json",
  "background_quotes_status.json",
  "quote_status.json",
];

function stateDirScore(stateDir) {
  let score = 0;
  for (const fileName of STATE_PROBE_FILES) {
    const candidate = path.join(stateDir, fileName);
    if (!existsSync(candidate)) {
      continue;
    }
    try {
      score = Math.max(score, statSync(candidate).mtimeMs);
    } catch {
      // Ignore probe failures and keep the best known score.
    }
  }
  return score;
}

function latestBrokerDeskStagingStateDir(brokerDeskRoot = BROKERDESK_ROOT) {
  if (process.platform !== "win32" || !existsSync(brokerDeskRoot)) {
    return null;
  }

  let winner = null;
  for (const entry of readdirSync(brokerDeskRoot, { withFileTypes: true })) {
    if (!entry.isDirectory() || !entry.name.startsWith(STAGING_PREFIX)) {
      continue;
    }

    const stateDir = path.join(brokerDeskRoot, entry.name, "BrokerDesk", "state");
    if (!existsSync(stateDir)) {
      continue;
    }

    const score = stateDirScore(stateDir);
    if (!winner || score > winner.score) {
      winner = { path: stateDir, score };
    }
  }

  return winner?.path ?? null;
}

export function resolveBrokerDeskStateDir({ preferCanonical = false, brokerDeskRoot = BROKERDESK_ROOT } = {}) {
  if (process.env.OPENCLAW_CAPITAL_BROKERDESK_STATE_DIR) {
    return process.env.OPENCLAW_CAPITAL_BROKERDESK_STATE_DIR;
  }
  if (process.env.BROKERDESK_STATE_DIR) {
    return process.env.BROKERDESK_STATE_DIR;
  }
  if (process.platform === "win32") {
    const stagingDir = latestBrokerDeskStagingStateDir(brokerDeskRoot);
    if (stagingDir) {
      return stagingDir;
    }
    if (preferCanonical && existsSync(CANONICAL_STATE_DIR)) {
      return CANONICAL_STATE_DIR;
    }
    if (existsSync(PORTABLE_STATE_DIR)) {
      return PORTABLE_STATE_DIR;
    }
    return CANONICAL_STATE_DIR;
  }
  return path.resolve("BrokerDesk/state");
}
