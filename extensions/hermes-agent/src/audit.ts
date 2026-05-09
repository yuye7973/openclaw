import { mkdir, writeFile } from "node:fs/promises";
import { relative, resolve } from "node:path";
import type { HermesApprovalRequest, HermesPlan } from "./task-package.js";

export type HermesWriteResult = {
  path: string;
  trace_id: string;
};

export type HermesApprovalWriteResult =
  | (HermesWriteResult & { approval_id: string; skipped?: false })
  | { skipped: true; reason: "approval_not_required"; trace_id: string };

export async function writeHermesAuditReport(params: {
  repoRoot: string;
  outputDir?: string;
  plan: HermesPlan;
}): Promise<HermesWriteResult> {
  const outputDir = ensureInsideWorkspace(params.repoRoot, params.outputDir ?? "reports/hermes-agent");
  await mkdir(outputDir, { recursive: true });
  const filePath = resolve(outputDir, `${params.plan.audit.trace_id}.json`);
  await writeFile(filePath, `${JSON.stringify(params.plan.audit, null, 2)}\n`, "utf8");
  return {
    path: filePath,
    trace_id: params.plan.audit.trace_id,
  };
}

export async function writeHermesApprovalRequest(params: {
  repoRoot: string;
  outputDir?: string;
  plan: HermesPlan;
}): Promise<HermesApprovalWriteResult> {
  if (!params.plan.approval_request) {
    return {
      skipped: true,
      reason: "approval_not_required",
      trace_id: params.plan.audit.trace_id,
    };
  }
  const outputDir = ensureInsideWorkspace(
    params.repoRoot,
    params.outputDir ?? "reports/hermes-agent/approvals",
  );
  await mkdir(outputDir, { recursive: true });
  const approvalRequest: HermesApprovalRequest = params.plan.approval_request;
  const filePath = resolve(outputDir, `${approvalRequest.approval_id.replace(/[:/\\]/g, "_")}.json`);
  await writeFile(filePath, `${JSON.stringify(approvalRequest, null, 2)}\n`, "utf8");
  return {
    path: filePath,
    trace_id: approvalRequest.trace_id,
    approval_id: approvalRequest.approval_id,
  };
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
