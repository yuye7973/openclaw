import { mkdtemp, readFile, rm } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { describe, expect, it } from "vitest";
import { writeHermesApprovalRequest, writeHermesAuditReport } from "./audit.js";
import { buildHermesPlan, classifyHermesRisk, isApprovalRequired } from "./task-package.js";

const FIXED_NOW = new Date("2026-05-05T22:18:58.000Z");

describe("Hermes task packages", () => {
  it("creates a dry-run local-write package without approval", () => {
    const plan = buildHermesPlan("create a guarded OpenClaw module", FIXED_NOW);

    expect(plan.audit.dry_run).toBe(true);
    expect(plan.audit.trace_id).toMatch(/^hermes-20260505221858-[a-f0-9]{8}$/);
    expect(plan.task_package.risk_class).toBe("local_write");
    expect(plan.task_package.approval_required).toBe(false);
    expect(plan.envelope.target_agent).toBe("openclaw-runtime");
    expect(plan.approval_request).toBeUndefined();
  });

  it("requires approval for trading or payment requests", () => {
    const plan = buildHermesPlan("create a bridge that can place a trade order", FIXED_NOW);

    expect(plan.task_package.risk_class).toBe("trading_payment");
    expect(plan.task_package.approval_required).toBe(true);
    expect(plan.envelope.target_agent).toBe("risk-reviewer");
    expect(plan.approval_request?.approval_id).toBe(`${plan.audit.trace_id}:approval`);
    expect(plan.approval_request?.required_approver).toBe("human");
  });

  it("classifies credential requests as approval gated", () => {
    expect(classifyHermesRisk("write an API key into config")).toBe("credential");
    expect(isApprovalRequired("credential")).toBe(true);
  });

  it("rejects empty requests", () => {
    expect(() => buildHermesPlan("   ", FIXED_NOW)).toThrow("Hermes request is required");
  });
});

describe("Hermes local reports", () => {
  it("writes audit reports inside the workspace", async () => {
    const repoRoot = await mkdtemp(join(tmpdir(), "hermes-repo-"));
    try {
      const plan = buildHermesPlan("inspect OpenClaw docs", FIXED_NOW);
      const report = await writeHermesAuditReport({
        repoRoot,
        outputDir: "reports/hermes",
        plan,
      });
      const body = JSON.parse(await readFile(report.path, "utf8")) as { trace_id: string };
      expect(body.trace_id).toBe(plan.audit.trace_id);
    } finally {
      await rm(repoRoot, { force: true, recursive: true });
    }
  });

  it("writes approval reports only when approval is required", async () => {
    const repoRoot = await mkdtemp(join(tmpdir(), "hermes-repo-"));
    try {
      const readOnlyPlan = buildHermesPlan("inspect OpenClaw docs", FIXED_NOW);
      await expect(
        writeHermesApprovalRequest({
          repoRoot,
          outputDir: "approvals",
          plan: readOnlyPlan,
        }),
      ).resolves.toEqual({
        skipped: true,
        reason: "approval_not_required",
        trace_id: readOnlyPlan.audit.trace_id,
      });

      const highRiskPlan = buildHermesPlan("deploy via webhook", FIXED_NOW);
      const report = await writeHermesApprovalRequest({
        repoRoot,
        outputDir: "approvals",
        plan: highRiskPlan,
      });
      expect(report).toMatchObject({
        approval_id: highRiskPlan.approval_request?.approval_id,
        trace_id: highRiskPlan.audit.trace_id,
      });
    } finally {
      await rm(repoRoot, { force: true, recursive: true });
    }
  });

  it("rejects report directories outside the workspace", async () => {
    const repoRoot = await mkdtemp(join(tmpdir(), "hermes-repo-"));
    try {
      const plan = buildHermesPlan("inspect OpenClaw docs", FIXED_NOW);
      await expect(
        writeHermesAuditReport({
          repoRoot,
          outputDir: "../outside",
          plan,
        }),
      ).rejects.toThrow("inside the workspace");
    } finally {
      await rm(repoRoot, { force: true, recursive: true });
    }
  });
});
