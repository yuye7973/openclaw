import { mkdir, readFile, writeFile } from "node:fs/promises";
import { relative, resolve } from "node:path";

export type HermesLearningStatus = "success" | "failure";

export type HermesLearningRecord = {
  trace_id: string;
  status: HermesLearningStatus;
  summary: string;
  created_at: string;
  tags: string[];
};

export type HermesLearningState = {
  version: 1;
  success_patterns: HermesLearningRecord[];
  failure_patterns: HermesLearningRecord[];
  updated_at: string;
};

export async function appendHermesLearningRecord(params: {
  repoRoot: string;
  stateDir?: string;
  traceId: string;
  status: HermesLearningStatus;
  summary: string;
  tags?: string[];
  now?: Date;
}): Promise<{ path: string; record: HermesLearningRecord }> {
  const now = params.now ?? new Date();
  const statePath = resolveLearningStatePath(params.repoRoot, params.stateDir);
  await mkdir(resolve(statePath, ".."), { recursive: true });

  const current = await readLearningState(statePath);
  const record: HermesLearningRecord = {
    trace_id: params.traceId,
    status: params.status,
    summary: params.summary.trim(),
    created_at: now.toISOString(),
    tags: (params.tags ?? []).map((tag) => tag.trim()).filter(Boolean),
  };

  const next: HermesLearningState = {
    ...current,
    success_patterns:
      params.status === "success"
        ? trimRecords([...current.success_patterns, record])
        : current.success_patterns,
    failure_patterns:
      params.status === "failure"
        ? trimRecords([...current.failure_patterns, record])
        : current.failure_patterns,
    updated_at: now.toISOString(),
  };

  await writeFile(statePath, `${JSON.stringify(next, null, 2)}\n`, "utf8");
  return { path: statePath, record };
}

export function resolveLearningStatePath(repoRoot: string, stateDir = "reports/hermes-agent/state") {
  const outputDir = ensureInsideWorkspace(repoRoot, stateDir);
  return resolve(outputDir, "learning-state.json");
}

async function readLearningState(statePath: string): Promise<HermesLearningState> {
  try {
    const raw = await readFile(statePath, "utf8");
    const parsed = JSON.parse(raw) as HermesLearningState;
    if (parsed && parsed.version === 1) {
      return {
        version: 1,
        success_patterns: Array.isArray(parsed.success_patterns) ? parsed.success_patterns : [],
        failure_patterns: Array.isArray(parsed.failure_patterns) ? parsed.failure_patterns : [],
        updated_at: typeof parsed.updated_at === "string" ? parsed.updated_at : new Date(0).toISOString(),
      };
    }
  } catch {
    // ignore and return initial state
  }

  return {
    version: 1,
    success_patterns: [],
    failure_patterns: [],
    updated_at: new Date(0).toISOString(),
  };
}

function trimRecords(records: HermesLearningRecord[]): HermesLearningRecord[] {
  const MAX = 200;
  return records.length <= MAX ? records : records.slice(records.length - MAX);
}

function ensureInsideWorkspace(repoRoot: string, outputDir: string): string {
  const resolvedRoot = resolve(repoRoot);
  const resolvedOutput = resolve(resolvedRoot, outputDir);
  const relativePath = relative(resolvedRoot, resolvedOutput);
  if (relativePath === "" || (!relativePath.startsWith("..") && !relativePath.includes(":"))) {
    return resolvedOutput;
  }
  throw new Error(`Hermes output directory must stay inside the workspace: ${outputDir}`);
}
