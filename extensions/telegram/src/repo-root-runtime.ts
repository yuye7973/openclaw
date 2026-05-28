import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const OPENCLAW_REPO_MARKERS = ["package.json", "pnpm-workspace.yaml", "pnpm-lock.yaml"] as const;

const moduleDir = path.dirname(fileURLToPath(import.meta.url));
const SOURCE_CHECKOUT_REPO_ROOT = path.resolve(moduleDir, "..", "..", "..");
const DIST_CHECKOUT_REPO_ROOT = path.resolve(moduleDir, "..", "..", "..", "..");

function canReadFile(filePath: string): boolean {
  try {
    return fs.statSync(filePath).isFile();
  } catch {
    return false;
  }
}

function pushUniquePath(paths: string[], value: string | undefined): void {
  const normalized = value?.trim();
  if (!normalized) {
    return;
  }
  const resolved = path.resolve(normalized);
  if (!paths.includes(resolved)) {
    paths.push(resolved);
  }
}

function hasRepoMarkers(repoRoot: string): boolean {
  for (const marker of OPENCLAW_REPO_MARKERS) {
    if (!canReadFile(path.join(repoRoot, marker))) {
      return false;
    }
  }
  return true;
}

function resolveOpenClawHomeParent(): string | undefined {
  const openclawHome = process.env.OPENCLAW_HOME?.trim();
  if (!openclawHome) {
    return undefined;
  }
  return path.dirname(openclawHome);
}

export function resolveOpenClawRepoRoot(params: {
  preferredRoot?: string;
  requiredRelativePath: string;
}): string {
  const candidates: string[] = [];
  pushUniquePath(candidates, params.preferredRoot);
  pushUniquePath(candidates, process.env.OPENCLAW_REPO_ROOT);
  pushUniquePath(candidates, resolveOpenClawHomeParent());
  pushUniquePath(candidates, process.cwd());
  pushUniquePath(candidates, SOURCE_CHECKOUT_REPO_ROOT);
  pushUniquePath(candidates, DIST_CHECKOUT_REPO_ROOT);

  for (const candidate of candidates) {
    if (!hasRepoMarkers(candidate)) {
      continue;
    }
    if (canReadFile(path.join(candidate, params.requiredRelativePath))) {
      return candidate;
    }
  }

  for (const candidate of candidates) {
    if (canReadFile(path.join(candidate, params.requiredRelativePath))) {
      return candidate;
    }
  }

  return path.resolve(params.preferredRoot || process.env.OPENCLAW_REPO_ROOT || process.cwd());
}
