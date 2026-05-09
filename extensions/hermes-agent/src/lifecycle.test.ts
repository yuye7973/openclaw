import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  buildHermesDeploymentPlan,
  buildHermesTaskFlowSkeleton,
  validateHermesTaskFlowSkeletonArtifact,
  writeHermesTaskFlowRegistryNoopWriteArtifact,
  writeHermesTaskFlowRegistryOperatorApprovalRequestArtifact,
  writeHermesTaskFlowRegistryRollbackContractCoverageReportArtifact,
  writeHermesTaskFlowRegistryFinalWriterReadinessSummaryArtifact,
  writeHermesTaskFlowRegistryRealWriterImplementationPlanArtifact,
  writeHermesTaskFlowRegistryRealWriterImplementationPlanCoverageReportArtifact,
  writeHermesTaskFlowRegistryRealWriterApiContractFixtureArtifact,
  writeHermesTaskFlowRegistryRealWriterApiContractCoverageReportArtifact,
  writeHermesTaskFlowRegistryRealWriterPromotionPreflightReportArtifact,
  writeHermesTaskFlowRegistryRealWriterPromotionPreflightCoverageReportArtifact,
  writeHermesTaskFlowRegistryRealWriterFinalReadinessLockReportArtifact,
  writeHermesTaskFlowRegistryRealWriterActivationApprovalTokenFixtureArtifact,
  writeHermesTaskFlowRegistryRealWriterActivationApprovalTokenCoverageReportArtifact,
  writeHermesTaskFlowRegistryRealWriterActivationApprovalPreflightReportArtifact,
  writeHermesTaskFlowRegistryRealWriterActivationApprovalPreflightCoverageReportArtifact,
  writeHermesTaskFlowRegistryRealWriterActivationFinalReadinessLockReportArtifact,
  writeHermesTaskFlowRegistryRealWriterActivationFinalReadinessLockCoverageReportArtifact,
  writeHermesTaskFlowRegistryRealWriterActivationReleaseChecklistReportArtifact,
  writeHermesTaskFlowRegistryRealWriterActivationReleaseChecklistCoverageReportArtifact,
  writeHermesTaskFlowRegistryRealWriterActivationOperatorHandoffPacketArtifact,
  writeHermesTaskFlowRegistryRealWriterActivationOperatorHandoffPacketCoverageReportArtifact,
  writeHermesTaskFlowRegistryRealWriterActivationFinalSafetySummaryArtifact,
  writeHermesTaskFlowRegistryRealWriterActivationFinalSafetySummaryCoverageReportArtifact,
  writeHermesTaskFlowRegistryNextSafeTaskProposerFixtureArtifact,
  writeHermesTaskFlowRegistryNextSafeTaskProposerFixtureCoverageReportArtifact,
  writeHermesTaskFlowRegistryTaskDialoguerFixtureArtifact,
  writeHermesTaskFlowRegistryTaskDialoguerFixtureCoverageReportArtifact,
  writeHermesTaskFlowRegistryTaskDialoguerHandoffPackageArtifact,
  writeHermesTaskFlowRegistryTaskDialoguerReasoningPolicyArtifact,
  writeHermesTaskFlowRegistryTaskDialoguerReasoningPolicyCoverageReportArtifact,
  runHermesTaskFlowRegistryControlledDialogueExecutorDryRunArtifact,
  writeHermesTaskFlowRegistryTaskDialoguerStatusSummaryCoverageReportArtifact,
  writeHermesTaskFlowRegistryTaskDialoguerStatusSummaryReportArtifact,
  writeHermesTaskFlowRegistryControlledExecutorIntakeValidatorArtifact,
  writeHermesTaskFlowRegistryControlledExecutorIntakeCoverageReportArtifact,
  writeHermesTaskFlowRegistryControlledExecutorIntakeReleaseSummaryReportArtifact,
  writeHermesTaskFlowRegistryControlledExecutorApprovalPreflightReportArtifact,
  writeHermesTaskFlowRegistryControlledExecutorApprovalPreflightCoverageReportArtifact,
  writeHermesTaskFlowRegistryControlledExecutorFinalReadinessLockReportArtifact,
  writeHermesTaskFlowRegistryControlledExecutorFinalReadinessLockCoverageReportArtifact,
  writeHermesTaskFlowRegistryControlledExecutorActivationReleaseChecklistReportArtifact,
  writeHermesTaskFlowRegistryControlledExecutorActivationReleaseChecklistCoverageReportArtifact,
  writeHermesTaskFlowRegistryControlledExecutorActivationOperatorHandoffPacketReportArtifact,
  writeHermesTaskFlowRegistryControlledExecutorActivationOperatorHandoffPacketCoverageReportArtifact,
  writeHermesTaskFlowRegistryControlledExecutorActivationFinalSafetySummaryReportArtifact,
  writeHermesTaskFlowRegistryControlledExecutorActivationFinalSafetySummaryCoverageReportArtifact,
  writeHermesTaskFlowRegistryControlledExecutorActivationNextSafeTaskDecisionReportArtifact,
  writeHermesTaskFlowRegistryControlledExecutorActivationExecutionManifestProposalReportArtifact,
  writeHermesTaskFlowRegistryControlledExecutorActivationExecutionManifestProposalCoverageReportArtifact,
  writeHermesTaskFlowRegistryControlledExecutorActivationExecutionManifestFinalReadinessSummaryReportArtifact,
  writeHermesTaskFlowRegistryControlledExecutorActivationMemoryLayerSandwichLoopReportArtifact,
  writeHermesTaskFlowRegistryControlledExecutorActivationMemoryLayerSandwichLoopDryRunReportArtifact,
  writeHermesTaskFlowRegistryControlledExecutorActivationGodmodeSafetyLockReportArtifact,
  writeHermesTaskFlowRegistryControlledExecutorActivationGodmodeSafetyLockCoverageReportArtifact,
  writeHermesTaskFlowRegistryControlledExecutorActivationRedTeamSandboxBoundaryPlanArtifact,
  writeHermesTaskFlowRegistryControlledExecutorActivationRedTeamSandboxBoundaryPlanCoverageReportArtifact,
  writeHermesTaskFlowRegistryControlledExecutorActivationRedTeamSandboxOperatorApprovalChallengeFixtureArtifact,
  writeHermesTaskFlowRegistryControlledExecutorActivationRedTeamSandboxOperatorApprovalChallengeCoverageReportArtifact,
  writeHermesTaskFlowRegistryControlledExecutorActivationRedTeamSandboxFinalSafetySummaryReportArtifact,
  writeHermesTaskFlowRegistryControlledExecutorActivationRedTeamSandboxFinalSafetySummaryCoverageReportArtifact,
  writeHermesTaskFlowRegistryControlledExecutorActivationRedTeamSandboxOperatorHandoffPacketArtifact,
  writeHermesTaskFlowRegistryRollbackContractFixtureArtifact,
  writeHermesTaskFlowRegistryPromotionPreflightReportArtifact,
  writeHermesTaskFlowRegistryContractCoverageReportArtifact,
  writeHermesTaskFlowRegistryWriterContractFixtureArtifact,
  writeHermesTaskFlowRegistryApprovalTokenValidationArtifact,
  writeHermesTaskFlowRegistryNoopWriterApplyArtifact,
  writeHermesTaskFlowRegistryOperatorApprovalValidationArtifact,
  writeHermesTaskFlowRegistryPreviewDiffArtifact,
  writeHermesTaskFlowRegistryReadAdapterArtifact,
  writeHermesTaskFlowRegistrySnapshotArtifact,
  writeHermesTaskFlowRegistryPromotionGateArtifact,
  writeHermesTaskFlowRegistryStagingArtifact,
  writeHermesTaskFlowRegistryWriterReviewArtifact,
  writeHermesTaskFlowSkeletonArtifact,
} from "./deployment-plan.js";
import { appendHermesLearningRecord } from "./learning.js";
import { runHermesPromotionGate } from "./promotion.js";

describe("Hermes deployment plan", () => {
  it("defines a sequential role handoff without parallel model execution", () => {
    const plan = buildHermesDeploymentPlan({
      request: "connect Hermes and OpenClaw as a controlled self-improvement loop",
      currentModel: "ollama/qwen3:14b",
      now: new Date("2026-05-07T12:00:00.000Z"),
    });

    expect(plan.schema).toBe("openclaw.hermes.deployment_plan.v1");
    expect(plan.dry_run).toBe(true);
    expect(plan.mode).toBe("sequential_handoff");
    expect(plan.handoff_order).toEqual([
      "hermes_planner",
      "worker_coder",
      "verifier",
      "memory_summarizer",
    ]);
    expect(plan.roles.every((role) => role.first_model === "ollama/qwen3:14b")).toBe(true);
    expect(plan.resource_policy).toContain("Run one local model role at a time.");
    expect(plan.forbidden_actions).toContain("Do not create a second OpenClaw project.");
  });

  it("creates a dry-run Task Flow skeleton for the role handoff", () => {
    const flow = buildHermesTaskFlowSkeleton({
      request: "connect Hermes and OpenClaw as a controlled self-improvement loop",
      currentModel: "ollama/qwen3:14b",
      now: new Date("2026-05-07T12:00:00.000Z"),
    });

    expect(flow.schema).toBe("openclaw.hermes.taskflow_skeleton.v1");
    expect(flow.flow_id).toBe("hermes-flow-20260507T120000");
    expect(flow.status).toBe("planned");
    expect(flow.steps.map((step) => step.id)).toEqual(flow.deployment_plan.handoff_order);
    expect(flow.steps.every((step) => step.blocks_parallel_model_runs)).toBe(true);
    expect(flow.gates).toHaveLength(4);
  });

  it("writes the Task Flow skeleton artifact inside the workspace", async () => {
    const repoRoot = await mkdtemp(join(tmpdir(), "hermes-flow-"));
    try {
      const artifact = await writeHermesTaskFlowSkeletonArtifact({
        repoRoot,
        outputDir: "reports/hermes-agent/state",
        request: "connect Hermes and OpenClaw as a controlled self-improvement loop",
        currentModel: "ollama/qwen3:14b",
        now: new Date("2026-05-07T12:00:00.000Z"),
      });
      const body = JSON.parse(await readFile(artifact.path, "utf8")) as {
        schema: string;
        flow_id: string;
      };

      expect(body.schema).toBe("openclaw.hermes.taskflow_skeleton.v1");
      expect(body.flow_id).toBe(artifact.skeleton.flow_id);
      expect(artifact.path).toContain("reports");
    } finally {
      await rm(repoRoot, { recursive: true, force: true });
    }
  });

  it("validates a persisted Task Flow skeleton artifact before registry promotion", async () => {
    const repoRoot = await mkdtemp(join(tmpdir(), "hermes-flow-"));
    try {
      const artifact = await writeHermesTaskFlowSkeletonArtifact({
        repoRoot,
        outputDir: "reports/hermes-agent/state",
        request: "connect Hermes and OpenClaw as a controlled self-improvement loop",
        currentModel: "ollama/qwen3:14b",
        now: new Date("2026-05-07T12:00:00.000Z"),
      });
      const validation = await validateHermesTaskFlowSkeletonArtifact({
        repoRoot,
        artifactPath: artifact.path,
        now: new Date("2026-05-07T12:01:00.000Z"),
      });

      expect(validation.schema).toBe("openclaw.hermes.taskflow_skeleton.validation.v1");
      expect(validation.status).toBe("pass");
      expect(validation.ready_for_registry).toBe(true);
      expect(validation.flow_id).toBe(artifact.skeleton.flow_id);
    } finally {
      await rm(repoRoot, { recursive: true, force: true });
    }
  });

  it("fails validation for malformed Task Flow skeleton artifacts", async () => {
    const repoRoot = await mkdtemp(join(tmpdir(), "hermes-flow-"));
    try {
      const artifactPath = join(repoRoot, "bad-skeleton.json");
      await writeFile(artifactPath, "{}\n", "utf8");

      const validation = await validateHermesTaskFlowSkeletonArtifact({
        repoRoot,
        artifactPath,
      });

      expect(validation.status).toBe("fail");
      expect(validation.ready_for_registry).toBe(false);
      expect(validation.failures).toContain(
        "schema must equal openclaw.hermes.taskflow_skeleton.v1",
      );
    } finally {
      await rm(repoRoot, { recursive: true, force: true });
    }
  });

  it("rejects Task Flow skeleton artifact paths outside the workspace", async () => {
    const repoRoot = await mkdtemp(join(tmpdir(), "hermes-flow-"));
    try {
      await expect(
        writeHermesTaskFlowSkeletonArtifact({
          repoRoot,
          outputDir: "../outside",
        }),
      ).rejects.toThrow("inside the workspace");
    } finally {
      await rm(repoRoot, { recursive: true, force: true });
    }
  });

  it("rejects Task Flow skeleton validation paths outside the workspace", async () => {
    const repoRoot = await mkdtemp(join(tmpdir(), "hermes-flow-"));
    try {
      await expect(
        validateHermesTaskFlowSkeletonArtifact({
          repoRoot,
          artifactPath: join(tmpdir(), "outside-skeleton.json"),
        }),
      ).rejects.toThrow("inside the workspace");
    } finally {
      await rm(repoRoot, { recursive: true, force: true });
    }
  });

  it("writes a dry-run Task Flow registry staging artifact without executing the flow", async () => {
    const repoRoot = await mkdtemp(join(tmpdir(), "hermes-flow-"));
    try {
      const skeletonArtifact = await writeHermesTaskFlowSkeletonArtifact({
        repoRoot,
        outputDir: "reports/hermes-agent/state",
        request: "connect Hermes and OpenClaw as a controlled self-improvement loop",
        currentModel: "ollama/qwen3:14b",
        now: new Date("2026-05-07T12:00:00.000Z"),
      });
      const staging = await writeHermesTaskFlowRegistryStagingArtifact({
        repoRoot,
        artifactPath: skeletonArtifact.path,
        now: new Date("2026-05-07T12:02:00.000Z"),
      });
      const body = JSON.parse(await readFile(staging.path, "utf8")) as {
        schema: string;
        flow_id: string;
        taskflow_registry_write: boolean;
        worker_execution: boolean;
        model_invoked: boolean;
      };

      expect(body.schema).toBe("openclaw.hermes.taskflow_registry_staging.v1");
      expect(body.flow_id).toBe(skeletonArtifact.skeleton.flow_id);
      expect(body.taskflow_registry_write).toBe(false);
      expect(body.worker_execution).toBe(false);
      expect(body.model_invoked).toBe(false);
    } finally {
      await rm(repoRoot, { recursive: true, force: true });
    }
  });

  it("rejects malformed Task Flow skeleton artifacts before registry staging", async () => {
    const repoRoot = await mkdtemp(join(tmpdir(), "hermes-flow-"));
    try {
      const artifactPath = join(repoRoot, "bad-skeleton.json");
      await writeFile(artifactPath, "{}\n", "utf8");

      await expect(
        writeHermesTaskFlowRegistryStagingArtifact({
          repoRoot,
          artifactPath,
        }),
      ).rejects.toThrow("must pass validation");
    } finally {
      await rm(repoRoot, { recursive: true, force: true });
    }
  });

  it("writes a registry promotion gate that keeps real registry writes disabled", async () => {
    const repoRoot = await mkdtemp(join(tmpdir(), "hermes-flow-"));
    try {
      const skeletonArtifact = await writeHermesTaskFlowSkeletonArtifact({
        repoRoot,
        outputDir: "reports/hermes-agent/state",
        request: "connect Hermes and OpenClaw as a controlled self-improvement loop",
        currentModel: "ollama/qwen3:14b",
        now: new Date("2026-05-07T12:00:00.000Z"),
      });
      const staging = await writeHermesTaskFlowRegistryStagingArtifact({
        repoRoot,
        artifactPath: skeletonArtifact.path,
        now: new Date("2026-05-07T12:02:00.000Z"),
      });
      const gate = await writeHermesTaskFlowRegistryPromotionGateArtifact({
        repoRoot,
        stagingPath: staging.path,
        now: new Date("2026-05-07T12:03:00.000Z"),
      });
      const body = JSON.parse(await readFile(gate.path, "utf8")) as {
        schema: string;
        status: string;
        flow_id: string;
        registry_write_allowed: boolean;
        operator_approval_required: boolean;
        validation_status: string;
        taskflow_registry_write: boolean;
        worker_execution: boolean;
        model_invoked: boolean;
      };

      expect(body.schema).toBe("openclaw.hermes.taskflow_registry_promotion_gate.v1");
      expect(body.status).toBe("manual_approval_required");
      expect(body.flow_id).toBe(skeletonArtifact.skeleton.flow_id);
      expect(body.registry_write_allowed).toBe(false);
      expect(body.operator_approval_required).toBe(true);
      expect(body.validation_status).toBe("pass");
      expect(body.taskflow_registry_write).toBe(false);
      expect(body.worker_execution).toBe(false);
      expect(body.model_invoked).toBe(false);
    } finally {
      await rm(repoRoot, { recursive: true, force: true });
    }
  });

  it("blocks registry promotion for malformed staging artifacts", async () => {
    const repoRoot = await mkdtemp(join(tmpdir(), "hermes-flow-"));
    try {
      const stagingPath = join(repoRoot, "bad-staging.json");
      await writeFile(stagingPath, "{}\n", "utf8");

      const gate = await writeHermesTaskFlowRegistryPromotionGateArtifact({
        repoRoot,
        stagingPath,
      });

      expect(gate.gate.status).toBe("blocked");
      expect(gate.gate.registry_write_allowed).toBe(false);
      expect(gate.gate.failures).toContain(
        "schema must equal openclaw.hermes.taskflow_registry_staging.v1",
      );
    } finally {
      await rm(repoRoot, { recursive: true, force: true });
    }
  });

  it("writes a no-op registry writer artifact without touching the real registry", async () => {
    const repoRoot = await mkdtemp(join(tmpdir(), "hermes-flow-"));
    try {
      const skeletonArtifact = await writeHermesTaskFlowSkeletonArtifact({
        repoRoot,
        outputDir: "reports/hermes-agent/state",
        request: "connect Hermes and OpenClaw as a controlled self-improvement loop",
        currentModel: "ollama/qwen3:14b",
        now: new Date("2026-05-07T12:00:00.000Z"),
      });
      const staging = await writeHermesTaskFlowRegistryStagingArtifact({
        repoRoot,
        artifactPath: skeletonArtifact.path,
        now: new Date("2026-05-07T12:02:00.000Z"),
      });
      const gate = await writeHermesTaskFlowRegistryPromotionGateArtifact({
        repoRoot,
        stagingPath: staging.path,
        now: new Date("2026-05-07T12:03:00.000Z"),
      });
      const noopWrite = await writeHermesTaskFlowRegistryNoopWriteArtifact({
        repoRoot,
        gatePath: gate.path,
        now: new Date("2026-05-07T12:04:00.000Z"),
      });
      const body = JSON.parse(await readFile(noopWrite.path, "utf8")) as {
        schema: string;
        adapter_mode: string;
        status: string;
        flow_id: string;
        taskflow_registry_write: boolean;
        sqlite_write: boolean;
        worker_execution: boolean;
        model_invoked: boolean;
        validation_status: string;
      };

      expect(body.schema).toBe("openclaw.hermes.taskflow_registry_noop_write.v1");
      expect(body.adapter_mode).toBe("noop");
      expect(body.status).toBe("noop_recorded");
      expect(body.flow_id).toBe(skeletonArtifact.skeleton.flow_id);
      expect(body.taskflow_registry_write).toBe(false);
      expect(body.sqlite_write).toBe(false);
      expect(body.worker_execution).toBe(false);
      expect(body.model_invoked).toBe(false);
      expect(body.validation_status).toBe("pass");
    } finally {
      await rm(repoRoot, { recursive: true, force: true });
    }
  });

  it("blocks no-op registry writes when the promotion gate is invalid", async () => {
    const repoRoot = await mkdtemp(join(tmpdir(), "hermes-flow-"));
    try {
      const gatePath = join(repoRoot, "bad-gate.json");
      await writeFile(gatePath, "{}\n", "utf8");

      const noopWrite = await writeHermesTaskFlowRegistryNoopWriteArtifact({
        repoRoot,
        gatePath,
      });

      expect(noopWrite.record.status).toBe("blocked");
      expect(noopWrite.record.taskflow_registry_write).toBe(false);
      expect(noopWrite.record.sqlite_write).toBe(false);
      expect(noopWrite.record.failures).toContain(
        "schema must equal openclaw.hermes.taskflow_registry_promotion_gate.v1",
      );
    } finally {
      await rm(repoRoot, { recursive: true, force: true });
    }
  });

  it("writes a read-only registry preview diff from the no-op writer artifact", async () => {
    const repoRoot = await mkdtemp(join(tmpdir(), "hermes-flow-"));
    try {
      const skeletonArtifact = await writeHermesTaskFlowSkeletonArtifact({
        repoRoot,
        outputDir: "reports/hermes-agent/state",
        request: "connect Hermes and OpenClaw as a controlled self-improvement loop",
        currentModel: "ollama/qwen3:14b",
        now: new Date("2026-05-07T12:00:00.000Z"),
      });
      const staging = await writeHermesTaskFlowRegistryStagingArtifact({
        repoRoot,
        artifactPath: skeletonArtifact.path,
        now: new Date("2026-05-07T12:02:00.000Z"),
      });
      const gate = await writeHermesTaskFlowRegistryPromotionGateArtifact({
        repoRoot,
        stagingPath: staging.path,
        now: new Date("2026-05-07T12:03:00.000Z"),
      });
      const noopWrite = await writeHermesTaskFlowRegistryNoopWriteArtifact({
        repoRoot,
        gatePath: gate.path,
        now: new Date("2026-05-07T12:04:00.000Z"),
      });
      const preview = await writeHermesTaskFlowRegistryPreviewDiffArtifact({
        repoRoot,
        noopWritePath: noopWrite.path,
        now: new Date("2026-05-07T12:05:00.000Z"),
      });
      const body = JSON.parse(await readFile(preview.path, "utf8")) as {
        schema: string;
        read_only: boolean;
        status: string;
        flow_id: string;
        taskflow_registry_write: boolean;
        sqlite_write: boolean;
        worker_execution: boolean;
        model_invoked: boolean;
        diff: Array<{ op: string; flow_id: string }>;
      };

      expect(body.schema).toBe("openclaw.hermes.taskflow_registry_preview_diff.v1");
      expect(body.read_only).toBe(true);
      expect(body.status).toBe("preview_ready");
      expect(body.flow_id).toBe(skeletonArtifact.skeleton.flow_id);
      expect(body.taskflow_registry_write).toBe(false);
      expect(body.sqlite_write).toBe(false);
      expect(body.worker_execution).toBe(false);
      expect(body.model_invoked).toBe(false);
      expect(body.diff).toEqual([
        {
          op: "preview_create_or_update_flow",
          flow_id: skeletonArtifact.skeleton.flow_id,
          sync_mode: "managed",
          registry_target: "task_flow_registry",
        },
      ]);
    } finally {
      await rm(repoRoot, { recursive: true, force: true });
    }
  });

  it("blocks preview diff when the no-op writer artifact is invalid", async () => {
    const repoRoot = await mkdtemp(join(tmpdir(), "hermes-flow-"));
    try {
      const noopPath = join(repoRoot, "bad-noop.json");
      await writeFile(noopPath, "{}\n", "utf8");

      const preview = await writeHermesTaskFlowRegistryPreviewDiffArtifact({
        repoRoot,
        noopWritePath: noopPath,
      });

      expect(preview.preview.status).toBe("blocked");
      expect(preview.preview.taskflow_registry_write).toBe(false);
      expect(preview.preview.sqlite_write).toBe(false);
      expect(preview.preview.diff).toEqual([]);
      expect(preview.preview.failures).toContain(
        "schema must equal openclaw.hermes.taskflow_registry_noop_write.v1",
      );
    } finally {
      await rm(repoRoot, { recursive: true, force: true });
    }
  });

  it("writes a pending operator approval request without approving registry writes", async () => {
    const repoRoot = await mkdtemp(join(tmpdir(), "hermes-flow-"));
    try {
      const skeletonArtifact = await writeHermesTaskFlowSkeletonArtifact({
        repoRoot,
        outputDir: "reports/hermes-agent/state",
        request: "connect Hermes and OpenClaw as a controlled self-improvement loop",
        currentModel: "ollama/qwen3:14b",
        now: new Date("2026-05-07T12:00:00.000Z"),
      });
      const staging = await writeHermesTaskFlowRegistryStagingArtifact({
        repoRoot,
        artifactPath: skeletonArtifact.path,
        now: new Date("2026-05-07T12:02:00.000Z"),
      });
      const gate = await writeHermesTaskFlowRegistryPromotionGateArtifact({
        repoRoot,
        stagingPath: staging.path,
        now: new Date("2026-05-07T12:03:00.000Z"),
      });
      const noopWrite = await writeHermesTaskFlowRegistryNoopWriteArtifact({
        repoRoot,
        gatePath: gate.path,
        now: new Date("2026-05-07T12:04:00.000Z"),
      });
      const preview = await writeHermesTaskFlowRegistryPreviewDiffArtifact({
        repoRoot,
        noopWritePath: noopWrite.path,
        now: new Date("2026-05-07T12:05:00.000Z"),
      });
      const approval = await writeHermesTaskFlowRegistryOperatorApprovalRequestArtifact({
        repoRoot,
        previewPath: preview.path,
        now: new Date("2026-05-07T12:06:00.000Z"),
      });
      const body = JSON.parse(await readFile(approval.path, "utf8")) as {
        schema: string;
        approval_state: string;
        flow_id: string;
        requires_operator_approval: boolean;
        operator_approved: boolean;
        approval_token_saved: boolean;
        taskflow_registry_write: boolean;
        sqlite_write: boolean;
        worker_execution: boolean;
        model_invoked: boolean;
        validation_status: string;
      };

      expect(body.schema).toBe("openclaw.hermes.taskflow_registry_operator_approval.v1");
      expect(body.approval_state).toBe("pending");
      expect(body.flow_id).toBe(skeletonArtifact.skeleton.flow_id);
      expect(body.requires_operator_approval).toBe(true);
      expect(body.operator_approved).toBe(false);
      expect(body.approval_token_saved).toBe(false);
      expect(body.taskflow_registry_write).toBe(false);
      expect(body.sqlite_write).toBe(false);
      expect(body.worker_execution).toBe(false);
      expect(body.model_invoked).toBe(false);
      expect(body.validation_status).toBe("pass");
    } finally {
      await rm(repoRoot, { recursive: true, force: true });
    }
  });

  it("blocks operator approval requests when the preview diff is invalid", async () => {
    const repoRoot = await mkdtemp(join(tmpdir(), "hermes-flow-"));
    try {
      const previewPath = join(repoRoot, "bad-preview.json");
      await writeFile(previewPath, "{}\n", "utf8");

      const approval = await writeHermesTaskFlowRegistryOperatorApprovalRequestArtifact({
        repoRoot,
        previewPath,
      });

      expect(approval.request.approval_state).toBe("blocked");
      expect(approval.request.taskflow_registry_write).toBe(false);
      expect(approval.request.sqlite_write).toBe(false);
      expect(approval.request.operator_approved).toBe(false);
      expect(approval.request.failures).toContain(
        "schema must equal openclaw.hermes.taskflow_registry_preview_diff.v1",
      );
    } finally {
      await rm(repoRoot, { recursive: true, force: true });
    }
  });
  it("writes an approval validation artifact without enabling registry writes", async () => {
    const repoRoot = await mkdtemp(join(tmpdir(), "hermes-flow-"));
    try {
      const skeletonArtifact = await writeHermesTaskFlowSkeletonArtifact({
        repoRoot,
        outputDir: "reports/hermes-agent/state",
        request: "connect Hermes and OpenClaw as a controlled self-improvement loop",
        currentModel: "ollama/qwen3:14b",
        now: new Date("2026-05-07T12:00:00.000Z"),
      });
      const staging = await writeHermesTaskFlowRegistryStagingArtifact({
        repoRoot,
        artifactPath: skeletonArtifact.path,
        now: new Date("2026-05-07T12:02:00.000Z"),
      });
      const gate = await writeHermesTaskFlowRegistryPromotionGateArtifact({
        repoRoot,
        stagingPath: staging.path,
        now: new Date("2026-05-07T12:03:00.000Z"),
      });
      const noopWrite = await writeHermesTaskFlowRegistryNoopWriteArtifact({
        repoRoot,
        gatePath: gate.path,
        now: new Date("2026-05-07T12:04:00.000Z"),
      });
      const preview = await writeHermesTaskFlowRegistryPreviewDiffArtifact({
        repoRoot,
        noopWritePath: noopWrite.path,
        now: new Date("2026-05-07T12:05:00.000Z"),
      });
      const approval = await writeHermesTaskFlowRegistryOperatorApprovalRequestArtifact({
        repoRoot,
        previewPath: preview.path,
        now: new Date("2026-05-07T12:06:00.000Z"),
      });
      const validation = await writeHermesTaskFlowRegistryOperatorApprovalValidationArtifact({
        repoRoot,
        approvalPath: approval.path,
        now: new Date("2026-05-07T12:07:00.000Z"),
      });
      const body = JSON.parse(await readFile(validation.path, "utf8")) as {
        schema: string;
        status: string;
        flow_id: string;
        ready_for_registry_adapter_review: boolean;
        registry_write_allowed: boolean;
        operator_approved: boolean;
        taskflow_registry_write: boolean;
        sqlite_write: boolean;
        worker_execution: boolean;
        model_invoked: boolean;
      };

      expect(body.schema).toBe("openclaw.hermes.taskflow_registry_operator_approval.validation.v1");
      expect(body.status).toBe("pass");
      expect(body.flow_id).toBe(skeletonArtifact.skeleton.flow_id);
      expect(body.ready_for_registry_adapter_review).toBe(true);
      expect(body.registry_write_allowed).toBe(false);
      expect(body.operator_approved).toBe(false);
      expect(body.taskflow_registry_write).toBe(false);
      expect(body.sqlite_write).toBe(false);
      expect(body.worker_execution).toBe(false);
      expect(body.model_invoked).toBe(false);
    } finally {
      await rm(repoRoot, { recursive: true, force: true });
    }
  });

  it("fails approval validation when the approval artifact is invalid", async () => {
    const repoRoot = await mkdtemp(join(tmpdir(), "hermes-flow-"));
    try {
      const approvalPath = join(repoRoot, "bad-approval.json");
      await writeFile(approvalPath, "{}\n", "utf8");

      const validation = await writeHermesTaskFlowRegistryOperatorApprovalValidationArtifact({
        repoRoot,
        approvalPath,
      });

      expect(validation.validation.status).toBe("fail");
      expect(validation.validation.ready_for_registry_adapter_review).toBe(false);
      expect(validation.validation.registry_write_allowed).toBe(false);
      expect(validation.validation.operator_approved).toBe(false);
      expect(validation.validation.taskflow_registry_write).toBe(false);
      expect(validation.validation.sqlite_write).toBe(false);
      expect(validation.validation.failures).toContain(
        "schema must equal openclaw.hermes.taskflow_registry_operator_approval.v1",
      );
    } finally {
      await rm(repoRoot, { recursive: true, force: true });
    }
  });

  it("normalizes OpenClaw Task Flow list JSON into a read-only snapshot artifact", async () => {
    const repoRoot = await mkdtemp(join(tmpdir(), "hermes-flow-"));
    try {
      const sourcePath = join(repoRoot, "taskflow-list.json");
      await writeFile(
        sourcePath,
        JSON.stringify({
          count: 1,
          flows: [
            {
              flowId: "hermes-flow-20260507T120000",
              syncMode: "managed",
              revision: 2,
              status: "running",
              goal: "Hermes controlled loop",
              controllerId: "hermes-agent",
              currentStep: "verifier",
              updatedAt: 1_777_777_777,
            },
          ],
        }),
        "utf8",
      );

      const snapshot = await writeHermesTaskFlowRegistrySnapshotArtifact({
        repoRoot,
        taskFlowListJsonPath: sourcePath,
        flowIdHint: "hermes-flow-20260507T120000",
        now: new Date("2026-05-07T12:08:00.000Z"),
      });

      expect(snapshot.snapshot.schema).toBe("openclaw.hermes.taskflow_registry_snapshot.v1");
      expect(snapshot.snapshot.status).toBe("snapshot_ready");
      expect(snapshot.snapshot.read_only).toBe(true);
      expect(snapshot.snapshot.sqlite_read).toBe(false);
      expect(snapshot.snapshot.taskflow_registry_write).toBe(false);
      expect(snapshot.snapshot.count).toBe(1);
      expect(snapshot.snapshot.flows[0]).toMatchObject({
        flowId: "hermes-flow-20260507T120000",
        flow_id: "hermes-flow-20260507T120000",
        revision: 2,
        status: "running",
      });
    } finally {
      await rm(repoRoot, { recursive: true, force: true });
    }
  });

  it("feeds the normalized registry snapshot into the read adapter", async () => {
    const repoRoot = await mkdtemp(join(tmpdir(), "hermes-flow-"));
    try {
      const approvalValidation = await buildApprovalValidationFixture(repoRoot);
      const sourcePath = join(repoRoot, "taskflow-list.json");
      await writeFile(
        sourcePath,
        JSON.stringify({ flows: [{ flowId: approvalValidation.validation.flow_id, revision: 3 }] }),
        "utf8",
      );
      const snapshot = await writeHermesTaskFlowRegistrySnapshotArtifact({
        repoRoot,
        taskFlowListJsonPath: sourcePath,
        flowIdHint: approvalValidation.validation.flow_id,
      });

      const report = await writeHermesTaskFlowRegistryReadAdapterArtifact({
        repoRoot,
        approvalValidationPath: approvalValidation.path,
        registrySnapshotPath: snapshot.path,
      });

      expect(report.report.registry_snapshot_artifact).toBe(snapshot.path);
      expect(report.report.registry_snapshot_read).toBe(true);
      expect(report.report.current_registry_state.source).toBe("snapshot_artifact");
      expect(report.report.current_registry_state.flow_state).toBe("present");
      expect(report.report.current_registry_state.revision).toBe(3);
      expect(report.report.comparison.op).toBe("would_update_flow");
      expect(report.report.taskflow_registry_write).toBe(false);
      expect(report.report.sqlite_write).toBe(false);
    } finally {
      await rm(repoRoot, { recursive: true, force: true });
    }
  });
  it("writes a read-only registry adapter report without reading SQLite", async () => {
    const repoRoot = await mkdtemp(join(tmpdir(), "hermes-flow-"));
    try {
      const approvalValidation = await buildApprovalValidationFixture(repoRoot);

      const report = await writeHermesTaskFlowRegistryReadAdapterArtifact({
        repoRoot,
        approvalValidationPath: approvalValidation.path,
        now: new Date("2026-05-07T12:08:00.000Z"),
      });

      expect(report.report.schema).toBe("openclaw.hermes.taskflow_registry_read_adapter.v1");
      expect(report.report.status).toBe("compared");
      expect(report.report.registry_snapshot_read).toBe(false);
      expect(report.report.sqlite_read).toBe(false);
      expect(report.report.taskflow_registry_write).toBe(false);
      expect(report.report.sqlite_write).toBe(false);
      expect(report.report.worker_execution).toBe(false);
      expect(report.report.model_invoked).toBe(false);
      expect(report.report.current_registry_state.source).toBe("not_loaded");
      expect(report.report.comparison.op).toBe("snapshot_not_provided");
    } finally {
      await rm(repoRoot, { recursive: true, force: true });
    }
  });

  it("compares an artifact registry snapshot without enabling writes", async () => {
    const repoRoot = await mkdtemp(join(tmpdir(), "hermes-flow-"));
    try {
      const approvalValidation = await buildApprovalValidationFixture(repoRoot);
      const snapshotPath = join(repoRoot, "taskflow-registry-snapshot.json");
      await writeFile(
        snapshotPath,
        JSON.stringify({
          flows: [
            { flowId: approvalValidation.validation.flow_id, revision: 7, status: "running" },
          ],
        }),
        "utf8",
      );

      const report = await writeHermesTaskFlowRegistryReadAdapterArtifact({
        repoRoot,
        approvalValidationPath: approvalValidation.path,
        registrySnapshotPath: snapshotPath,
      });

      expect(report.report.registry_snapshot_read).toBe(true);
      expect(report.report.current_registry_state.source).toBe("snapshot_artifact");
      expect(report.report.current_registry_state.flow_state).toBe("present");
      expect(report.report.current_registry_state.revision).toBe(7);
      expect(report.report.current_registry_state.status).toBe("running");
      expect(report.report.comparison.op).toBe("would_update_flow");
      expect(report.report.taskflow_registry_write).toBe(false);
      expect(report.report.sqlite_write).toBe(false);
    } finally {
      await rm(repoRoot, { recursive: true, force: true });
    }
  });

  it("writes a review-only registry writer gate from the read adapter", async () => {
    const repoRoot = await mkdtemp(join(tmpdir(), "hermes-flow-"));
    try {
      const approvalValidation = await buildApprovalValidationFixture(repoRoot);
      const snapshotPath = join(repoRoot, "taskflow-registry-snapshot.json");
      await writeFile(
        snapshotPath,
        JSON.stringify({ flows: [{ flowId: approvalValidation.validation.flow_id, revision: 3 }] }),
        "utf8",
      );
      const readAdapter = await writeHermesTaskFlowRegistryReadAdapterArtifact({
        repoRoot,
        approvalValidationPath: approvalValidation.path,
        registrySnapshotPath: snapshotPath,
      });

      const review = await writeHermesTaskFlowRegistryWriterReviewArtifact({
        repoRoot,
        readAdapterPath: readAdapter.path,
        now: new Date("2026-05-07T12:09:00.000Z"),
      });

      expect(review.review.schema).toBe("openclaw.hermes.taskflow_registry_writer_review.v1");
      expect(review.review.status).toBe("manual_approval_required");
      expect(review.review.operation).toBe("update");
      expect(review.review.proposed_write).toMatchObject({
        flow_id: approvalValidation.validation.flow_id,
        operation: "update",
        expected_current_state: "present",
      });
      expect(review.review.taskflow_registry_write).toBe(false);
      expect(review.review.sqlite_write).toBe(false);
      expect(review.review.worker_execution).toBe(false);
      expect(review.review.model_invoked).toBe(false);
    } finally {
      await rm(repoRoot, { recursive: true, force: true });
    }
  });

  it("writes a final no-op apply gate from the writer review", async () => {
    const repoRoot = await mkdtemp(join(tmpdir(), "hermes-flow-"));
    try {
      const approvalValidation = await buildApprovalValidationFixture(repoRoot);
      const snapshotPath = join(repoRoot, "taskflow-registry-snapshot.json");
      await writeFile(snapshotPath, JSON.stringify({ flows: [] }), "utf8");
      const readAdapter = await writeHermesTaskFlowRegistryReadAdapterArtifact({
        repoRoot,
        approvalValidationPath: approvalValidation.path,
        registrySnapshotPath: snapshotPath,
      });
      const review = await writeHermesTaskFlowRegistryWriterReviewArtifact({
        repoRoot,
        readAdapterPath: readAdapter.path,
      });

      const apply = await writeHermesTaskFlowRegistryNoopWriterApplyArtifact({
        repoRoot,
        writerReviewPath: review.path,
        now: new Date("2026-05-07T12:10:00.000Z"),
      });

      expect(apply.apply.schema).toBe("openclaw.hermes.taskflow_registry_noop_writer_apply.v1");
      expect(apply.apply.status).toBe("noop_applied");
      expect(apply.apply.operation).toBe("create");
      expect(apply.apply.would_apply).toMatchObject({
        flow_id: approvalValidation.validation.flow_id,
        operation: "create",
        expected_current_state: "missing",
      });
      expect(apply.apply.taskflow_registry_write).toBe(false);
      expect(apply.apply.sqlite_write).toBe(false);
      expect(apply.apply.worker_execution).toBe(false);
      expect(apply.apply.model_invoked).toBe(false);
    } finally {
      await rm(repoRoot, { recursive: true, force: true });
    }
  });

  it("blocks no-op apply when the writer review is invalid", async () => {
    const repoRoot = await mkdtemp(join(tmpdir(), "hermes-flow-"));
    try {
      const writerReviewPath = join(repoRoot, "bad-writer-review.json");
      await writeFile(writerReviewPath, "{}\n", "utf8");

      const apply = await writeHermesTaskFlowRegistryNoopWriterApplyArtifact({
        repoRoot,
        writerReviewPath,
      });

      expect(apply.apply.status).toBe("blocked");
      expect(apply.apply.operation).toBe("blocked");
      expect(apply.apply.would_apply).toBeNull();
      expect(apply.apply.taskflow_registry_write).toBe(false);
      expect(apply.apply.sqlite_write).toBe(false);
      expect(apply.apply.failures).toContain(
        "schema must equal openclaw.hermes.taskflow_registry_writer_review.v1",
      );
    } finally {
      await rm(repoRoot, { recursive: true, force: true });
    }
  });

  it("validates an approval token challenge without enabling registry writes", async () => {
    const repoRoot = await mkdtemp(join(tmpdir(), "hermes-flow-"));
    try {
      const approvalValidation = await buildApprovalValidationFixture(repoRoot);
      const snapshotPath = join(repoRoot, "taskflow-registry-snapshot.json");
      await writeFile(snapshotPath, JSON.stringify({ flows: [] }), "utf8");
      const readAdapter = await writeHermesTaskFlowRegistryReadAdapterArtifact({
        repoRoot,
        approvalValidationPath: approvalValidation.path,
        registrySnapshotPath: snapshotPath,
      });
      const review = await writeHermesTaskFlowRegistryWriterReviewArtifact({
        repoRoot,
        readAdapterPath: readAdapter.path,
      });
      const apply = await writeHermesTaskFlowRegistryNoopWriterApplyArtifact({
        repoRoot,
        writerReviewPath: review.path,
      });
      const token =
        "approve:" + approvalValidation.validation.flow_id + ":create:taskflow-registry";

      const validation = await writeHermesTaskFlowRegistryApprovalTokenValidationArtifact({
        repoRoot,
        noopApplyPath: apply.path,
        token,
        now: new Date("2026-05-07T12:11:00.000Z"),
      });

      expect(validation.validation.schema).toBe(
        "openclaw.hermes.taskflow_registry_approval_token_validation.v1",
      );
      expect(validation.validation.status).toBe("token_validated");
      expect(validation.validation.approval_token_valid).toBe(true);
      expect(validation.validation.approval_token_saved).toBe(false);
      expect(validation.validation.operator_approved).toBe(false);
      expect(validation.validation.registry_write_allowed).toBe(false);
      expect(validation.validation.taskflow_registry_write).toBe(false);
      expect(validation.validation.sqlite_write).toBe(false);
      expect(validation.validation.worker_execution).toBe(false);
      expect(validation.validation.model_invoked).toBe(false);
      expect(validation.validation.token_fingerprint).toHaveLength(64);
      expect(JSON.stringify(validation.validation)).not.toContain(token);
    } finally {
      await rm(repoRoot, { recursive: true, force: true });
    }
  });

  it("blocks approval token validation when the token is wrong", async () => {
    const repoRoot = await mkdtemp(join(tmpdir(), "hermes-flow-"));
    try {
      const approvalValidation = await buildApprovalValidationFixture(repoRoot);
      const snapshotPath = join(repoRoot, "taskflow-registry-snapshot.json");
      await writeFile(snapshotPath, JSON.stringify({ flows: [] }), "utf8");
      const readAdapter = await writeHermesTaskFlowRegistryReadAdapterArtifact({
        repoRoot,
        approvalValidationPath: approvalValidation.path,
        registrySnapshotPath: snapshotPath,
      });
      const review = await writeHermesTaskFlowRegistryWriterReviewArtifact({
        repoRoot,
        readAdapterPath: readAdapter.path,
      });
      const apply = await writeHermesTaskFlowRegistryNoopWriterApplyArtifact({
        repoRoot,
        writerReviewPath: review.path,
      });

      const validation = await writeHermesTaskFlowRegistryApprovalTokenValidationArtifact({
        repoRoot,
        noopApplyPath: apply.path,
        token: "wrong-token",
      });

      expect(validation.validation.status).toBe("blocked");
      expect(validation.validation.approval_token_valid).toBe(false);
      expect(validation.validation.registry_write_allowed).toBe(false);
      expect(validation.validation.taskflow_registry_write).toBe(false);
      expect(validation.validation.failures).toContain(
        "approval token does not match the expected Task Flow registry challenge",
      );
    } finally {
      await rm(repoRoot, { recursive: true, force: true });
    }
  });

  it("writes a dry-run writer contract fixture from token validation", async () => {
    const repoRoot = await mkdtemp(join(tmpdir(), "hermes-flow-"));
    try {
      const approvalValidation = await buildApprovalValidationFixture(repoRoot);
      const snapshotPath = join(repoRoot, "taskflow-registry-snapshot.json");
      await writeFile(snapshotPath, JSON.stringify({ flows: [] }), "utf8");
      const readAdapter = await writeHermesTaskFlowRegistryReadAdapterArtifact({
        repoRoot,
        approvalValidationPath: approvalValidation.path,
        registrySnapshotPath: snapshotPath,
      });
      const review = await writeHermesTaskFlowRegistryWriterReviewArtifact({
        repoRoot,
        readAdapterPath: readAdapter.path,
      });
      const apply = await writeHermesTaskFlowRegistryNoopWriterApplyArtifact({
        repoRoot,
        writerReviewPath: review.path,
      });
      const token =
        "approve:" + approvalValidation.validation.flow_id + ":create:taskflow-registry";
      const tokenValidation = await writeHermesTaskFlowRegistryApprovalTokenValidationArtifact({
        repoRoot,
        noopApplyPath: apply.path,
        token,
      });

      const fixture = await writeHermesTaskFlowRegistryWriterContractFixtureArtifact({
        repoRoot,
        approvalTokenValidationPath: tokenValidation.path,
        now: new Date("2026-05-07T12:12:00.000Z"),
      });

      expect(fixture.fixture.schema).toBe(
        "openclaw.hermes.taskflow_registry_writer_contract_fixture.v1",
      );
      expect(fixture.fixture.status).toBe("contract_ready");
      expect(fixture.fixture.approval_token_validated).toBe(true);
      expect(fixture.fixture.operator_approved).toBe(false);
      expect(fixture.fixture.registry_write_allowed).toBe(false);
      expect(fixture.fixture.taskflow_registry_write).toBe(false);
      expect(fixture.fixture.sqlite_write).toBe(false);
      expect(fixture.fixture.worker_execution).toBe(false);
      expect(fixture.fixture.model_invoked).toBe(false);
      expect(fixture.fixture.writer_contract).toMatchObject({
        flow_id: approvalValidation.validation.flow_id,
        operation: "create",
        expected_current_state: "missing",
        commit_strategy: "disabled",
        taskflow_registry_write: false,
        sqlite_write: false,
      });
    } finally {
      await rm(repoRoot, { recursive: true, force: true });
    }
  });

  it("blocks writer contract fixture when token validation is invalid", async () => {
    const repoRoot = await mkdtemp(join(tmpdir(), "hermes-flow-"));
    try {
      const validationPath = join(repoRoot, "bad-token-validation.json");
      await writeFile(validationPath, "{}\n", "utf8");

      const fixture = await writeHermesTaskFlowRegistryWriterContractFixtureArtifact({
        repoRoot,
        approvalTokenValidationPath: validationPath,
      });

      expect(fixture.fixture.status).toBe("blocked");
      expect(fixture.fixture.writer_contract).toBeNull();
      expect(fixture.fixture.registry_write_allowed).toBe(false);
      expect(fixture.fixture.taskflow_registry_write).toBe(false);
      expect(fixture.fixture.sqlite_write).toBe(false);
      expect(fixture.fixture.failures).toContain(
        "schema must equal openclaw.hermes.taskflow_registry_approval_token_validation.v1",
      );
    } finally {
      await rm(repoRoot, { recursive: true, force: true });
    }
  });

  it("writes a read-only contract coverage report from writer contract fixture", async () => {
    const repoRoot = await mkdtemp(join(tmpdir(), "hermes-flow-"));
    try {
      const fixture = await buildWriterContractFixture(repoRoot);

      const report = await writeHermesTaskFlowRegistryContractCoverageReportArtifact({
        repoRoot,
        writerContractFixturePath: fixture.path,
        now: new Date("2026-05-07T12:13:00.000Z"),
      });
      const persisted = JSON.parse(await readFile(report.path, "utf8"));

      expect(report.report.schema).toBe(
        "openclaw.hermes.taskflow_registry_contract_coverage_report.v1",
      );
      expect(report.report.status).toBe("coverage_pass");
      expect(report.report.read_only).toBe(true);
      expect(report.report.validation_status).toBe("pass");
      expect(report.report.failures).toEqual([]);
      expect(report.report.coverage.required_fields_passed).toBe(true);
      expect(report.report.coverage.safety_flags_passed).toBe(true);
      expect(report.report.coverage.coverage_ratio).toBe(1);
      expect(report.report.registry_write_allowed).toBe(false);
      expect(report.report.taskflow_registry_write).toBe(false);
      expect(report.report.sqlite_write).toBe(false);
      expect(report.report.worker_execution).toBe(false);
      expect(report.report.model_invoked).toBe(false);
      expect(persisted.status).toBe("coverage_pass");
    } finally {
      await rm(repoRoot, { recursive: true, force: true });
    }
  });

  it("blocks contract coverage report when writer contract fixture is invalid", async () => {
    const repoRoot = await mkdtemp(join(tmpdir(), "hermes-flow-"));
    try {
      const fixturePath = join(repoRoot, "bad-writer-contract-fixture.json");
      await writeFile(fixturePath, "{}\n", "utf8");

      const report = await writeHermesTaskFlowRegistryContractCoverageReportArtifact({
        repoRoot,
        writerContractFixturePath: fixturePath,
      });

      expect(report.report.status).toBe("blocked");
      expect(report.report.operation).toBe("blocked");
      expect(report.report.validation_status).toBe("fail");
      expect(report.report.coverage.required_fields_passed).toBe(false);
      expect(report.report.coverage.safety_flags_passed).toBe(false);
      expect(report.report.coverage.coverage_ratio).toBe(0);
      expect(report.report.registry_write_allowed).toBe(false);
      expect(report.report.taskflow_registry_write).toBe(false);
      expect(report.report.sqlite_write).toBe(false);
      expect(report.report.failures).toContain(
        "schema must equal openclaw.hermes.taskflow_registry_writer_contract_fixture.v1",
      );
    } finally {
      await rm(repoRoot, { recursive: true, force: true });
    }
  });
  it("writes a read-only promotion preflight report from green contract coverage", async () => {
    const repoRoot = await mkdtemp(join(tmpdir(), "hermes-flow-"));
    try {
      const fixture = await buildWriterContractFixture(repoRoot);
      const coverage = await writeHermesTaskFlowRegistryContractCoverageReportArtifact({
        repoRoot,
        writerContractFixturePath: fixture.path,
        now: new Date("2026-05-07T12:13:00.000Z"),
      });

      const preflight = await writeHermesTaskFlowRegistryPromotionPreflightReportArtifact({
        repoRoot,
        contractCoverageReportPath: coverage.path,
        now: new Date("2026-05-07T12:14:00.000Z"),
      });
      const persisted = JSON.parse(await readFile(preflight.path, "utf8"));

      expect(preflight.report.schema).toBe(
        "openclaw.hermes.taskflow_registry_promotion_preflight_report.v1",
      );
      expect(preflight.report.status).toBe("preflight_pass");
      expect(preflight.report.read_only).toBe(true);
      expect(preflight.report.validation_status).toBe("pass");
      expect(preflight.report.failures).toEqual([]);
      expect(preflight.report.promotion_readiness.coverage_status).toBe("coverage_pass");
      expect(preflight.report.promotion_readiness.coverage_ratio).toBe(1);
      expect(preflight.report.promotion_readiness.required_fields_passed).toBe(true);
      expect(preflight.report.promotion_readiness.safety_flags_passed).toBe(true);
      expect(preflight.report.promotion_readiness.all_writes_disabled).toBe(true);
      expect(preflight.report.promotion_readiness.real_writer_allowed).toBe(false);
      expect(preflight.report.operator_approved).toBe(false);
      expect(preflight.report.registry_write_allowed).toBe(false);
      expect(preflight.report.taskflow_registry_write).toBe(false);
      expect(preflight.report.sqlite_write).toBe(false);
      expect(preflight.report.worker_execution).toBe(false);
      expect(preflight.report.model_invoked).toBe(false);
      expect(persisted.status).toBe("preflight_pass");
    } finally {
      await rm(repoRoot, { recursive: true, force: true });
    }
  });

  it("blocks promotion preflight when contract coverage is invalid", async () => {
    const repoRoot = await mkdtemp(join(tmpdir(), "hermes-flow-"));
    try {
      const coveragePath = join(repoRoot, "bad-contract-coverage-report.json");
      await writeFile(coveragePath, "{}\n", "utf8");

      const preflight = await writeHermesTaskFlowRegistryPromotionPreflightReportArtifact({
        repoRoot,
        contractCoverageReportPath: coveragePath,
      });

      expect(preflight.report.status).toBe("blocked");
      expect(preflight.report.operation).toBe("blocked");
      expect(preflight.report.validation_status).toBe("fail");
      expect(preflight.report.promotion_readiness.coverage_status).toBe("unknown");
      expect(preflight.report.promotion_readiness.coverage_ratio).toBe(0);
      expect(preflight.report.promotion_readiness.all_writes_disabled).toBe(false);
      expect(preflight.report.promotion_readiness.real_writer_allowed).toBe(false);
      expect(preflight.report.registry_write_allowed).toBe(false);
      expect(preflight.report.taskflow_registry_write).toBe(false);
      expect(preflight.report.sqlite_write).toBe(false);
      expect(preflight.report.failures).toContain(
        "schema must equal openclaw.hermes.taskflow_registry_contract_coverage_report.v1",
      );
    } finally {
      await rm(repoRoot, { recursive: true, force: true });
    }
  });
  it("writes a dry-run rollback contract fixture from promotion preflight", async () => {
    const repoRoot = await mkdtemp(join(tmpdir(), "hermes-flow-"));
    try {
      const preflight = await buildPromotionPreflightReport(repoRoot);

      const fixture = await writeHermesTaskFlowRegistryRollbackContractFixtureArtifact({
        repoRoot,
        promotionPreflightReportPath: preflight.path,
        now: new Date("2026-05-07T12:15:00.000Z"),
      });
      const persisted = JSON.parse(await readFile(fixture.path, "utf8"));

      expect(fixture.fixture.schema).toBe(
        "openclaw.hermes.taskflow_registry_rollback_contract_fixture.v1",
      );
      expect(fixture.fixture.status).toBe("rollback_ready");
      expect(fixture.fixture.operation).toBe("create");
      expect(fixture.fixture.validation_status).toBe("pass");
      expect(fixture.fixture.failures).toEqual([]);
      expect(fixture.fixture.rollback_contract).toMatchObject({
        flow_id: preflight.report.flow_id,
        registry_target: "task_flow_registry",
        original_operation: "create",
        rollback_operation: "delete_created_flow",
        rollback_trigger: "manual_after_failed_validation",
        commit_strategy: "disabled",
        taskflow_registry_write: false,
        sqlite_write: false,
        requires_operator_review: true,
        restore_source: "none_create_would_delete",
      });
      expect(fixture.fixture.operator_approved).toBe(false);
      expect(fixture.fixture.registry_write_allowed).toBe(false);
      expect(fixture.fixture.taskflow_registry_write).toBe(false);
      expect(fixture.fixture.sqlite_write).toBe(false);
      expect(fixture.fixture.worker_execution).toBe(false);
      expect(fixture.fixture.model_invoked).toBe(false);
      expect(persisted.status).toBe("rollback_ready");
    } finally {
      await rm(repoRoot, { recursive: true, force: true });
    }
  });

  it("blocks rollback contract fixture when promotion preflight is invalid", async () => {
    const repoRoot = await mkdtemp(join(tmpdir(), "hermes-flow-"));
    try {
      const preflightPath = join(repoRoot, "bad-promotion-preflight-report.json");
      await writeFile(preflightPath, "{}\n", "utf8");

      const fixture = await writeHermesTaskFlowRegistryRollbackContractFixtureArtifact({
        repoRoot,
        promotionPreflightReportPath: preflightPath,
      });

      expect(fixture.fixture.status).toBe("blocked");
      expect(fixture.fixture.operation).toBe("blocked");
      expect(fixture.fixture.validation_status).toBe("fail");
      expect(fixture.fixture.rollback_contract).toBeNull();
      expect(fixture.fixture.registry_write_allowed).toBe(false);
      expect(fixture.fixture.taskflow_registry_write).toBe(false);
      expect(fixture.fixture.sqlite_write).toBe(false);
      expect(fixture.fixture.failures).toContain(
        "schema must equal openclaw.hermes.taskflow_registry_promotion_preflight_report.v1",
      );
    } finally {
      await rm(repoRoot, { recursive: true, force: true });
    }
  });
  it("writes a read-only rollback contract coverage report from rollback fixture", async () => {
    const repoRoot = await mkdtemp(join(tmpdir(), "hermes-flow-"));
    try {
      const fixture = await buildRollbackContractFixture(repoRoot);

      const report = await writeHermesTaskFlowRegistryRollbackContractCoverageReportArtifact({
        repoRoot,
        rollbackContractFixturePath: fixture.path,
        now: new Date("2026-05-07T12:16:00.000Z"),
      });
      const persisted = JSON.parse(await readFile(report.path, "utf8"));

      expect(report.report.schema).toBe(
        "openclaw.hermes.taskflow_registry_rollback_contract_coverage_report.v1",
      );
      expect(report.report.status).toBe("coverage_pass");
      expect(report.report.operation).toBe("create");
      expect(report.report.validation_status).toBe("pass");
      expect(report.report.failures).toEqual([]);
      expect(report.report.coverage.required_fields_passed).toBe(true);
      expect(report.report.coverage.safety_flags_passed).toBe(true);
      expect(report.report.coverage.coverage_ratio).toBe(1);
      expect(report.report.operator_approved).toBe(false);
      expect(report.report.registry_write_allowed).toBe(false);
      expect(report.report.taskflow_registry_write).toBe(false);
      expect(report.report.sqlite_write).toBe(false);
      expect(report.report.worker_execution).toBe(false);
      expect(report.report.model_invoked).toBe(false);
      expect(persisted.status).toBe("coverage_pass");
    } finally {
      await rm(repoRoot, { recursive: true, force: true });
    }
  });

  it("blocks rollback contract coverage report when rollback fixture is invalid", async () => {
    const repoRoot = await mkdtemp(join(tmpdir(), "hermes-flow-"));
    try {
      const fixturePath = join(repoRoot, "bad-rollback-contract-fixture.json");
      await writeFile(fixturePath, "{}\n", "utf8");

      const report = await writeHermesTaskFlowRegistryRollbackContractCoverageReportArtifact({
        repoRoot,
        rollbackContractFixturePath: fixturePath,
      });

      expect(report.report.status).toBe("blocked");
      expect(report.report.operation).toBe("blocked");
      expect(report.report.validation_status).toBe("fail");
      expect(report.report.coverage.required_fields_passed).toBe(false);
      expect(report.report.coverage.safety_flags_passed).toBe(false);
      expect(report.report.coverage.coverage_ratio).toBe(0);
      expect(report.report.registry_write_allowed).toBe(false);
      expect(report.report.taskflow_registry_write).toBe(false);
      expect(report.report.sqlite_write).toBe(false);
      expect(report.report.failures).toContain(
        "schema must equal openclaw.hermes.taskflow_registry_rollback_contract_fixture.v1",
      );
    } finally {
      await rm(repoRoot, { recursive: true, force: true });
    }
  });
  it("writes a read-only final writer readiness summary from rollback coverage", async () => {
    const repoRoot = await mkdtemp(join(tmpdir(), "hermes-flow-"));
    try {
      const coverage = await buildRollbackContractCoverageReport(repoRoot);

      const summary = await writeHermesTaskFlowRegistryFinalWriterReadinessSummaryArtifact({
        repoRoot,
        rollbackContractCoverageReportPath: coverage.path,
        now: new Date("2026-05-07T12:17:00.000Z"),
      });
      const persisted = JSON.parse(await readFile(summary.path, "utf8"));

      expect(summary.summary.schema).toBe(
        "openclaw.hermes.taskflow_registry_final_writer_readiness_summary.v1",
      );
      expect(summary.summary.status).toBe("readiness_pass");
      expect(summary.summary.operation).toBe("create");
      expect(summary.summary.validation_status).toBe("pass");
      expect(summary.summary.failures).toEqual([]);
      expect(summary.summary.readiness.writer_contract_coverage_green).toBe(true);
      expect(summary.summary.readiness.promotion_preflight_green).toBe(true);
      expect(summary.summary.readiness.rollback_contract_coverage_green).toBe(true);
      expect(summary.summary.readiness.all_writes_disabled).toBe(true);
      expect(summary.summary.readiness.real_writer_allowed).toBe(false);
      expect(summary.summary.registry_write_allowed).toBe(false);
      expect(summary.summary.taskflow_registry_write).toBe(false);
      expect(summary.summary.sqlite_write).toBe(false);
      expect(summary.summary.worker_execution).toBe(false);
      expect(summary.summary.model_invoked).toBe(false);
      expect(persisted.status).toBe("readiness_pass");
    } finally {
      await rm(repoRoot, { recursive: true, force: true });
    }
  });

  it("blocks final writer readiness summary when rollback coverage is invalid", async () => {
    const repoRoot = await mkdtemp(join(tmpdir(), "hermes-flow-"));
    try {
      const reportPath = join(repoRoot, "bad-rollback-coverage-report.json");
      await writeFile(reportPath, "{}\n", "utf8");

      const summary = await writeHermesTaskFlowRegistryFinalWriterReadinessSummaryArtifact({
        repoRoot,
        rollbackContractCoverageReportPath: reportPath,
      });

      expect(summary.summary.status).toBe("blocked");
      expect(summary.summary.operation).toBe("blocked");
      expect(summary.summary.validation_status).toBe("fail");
      expect(summary.summary.readiness.writer_contract_coverage_green).toBe(false);
      expect(summary.summary.readiness.promotion_preflight_green).toBe(false);
      expect(summary.summary.readiness.rollback_contract_coverage_green).toBe(false);
      expect(summary.summary.readiness.all_writes_disabled).toBe(false);
      expect(summary.summary.readiness.real_writer_allowed).toBe(false);
      expect(summary.summary.registry_write_allowed).toBe(false);
      expect(summary.summary.taskflow_registry_write).toBe(false);
      expect(summary.summary.sqlite_write).toBe(false);
      expect(summary.summary.failures).toContain(
        "schema must equal openclaw.hermes.taskflow_registry_rollback_contract_coverage_report.v1",
      );
    } finally {
      await rm(repoRoot, { recursive: true, force: true });
    }
  });
  it("writes a dry-run real writer implementation plan from final readiness", async () => {
    const repoRoot = await mkdtemp(join(tmpdir(), "hermes-flow-"));
    try {
      const readiness = await buildFinalWriterReadinessSummary(repoRoot);

      const plan = await writeHermesTaskFlowRegistryRealWriterImplementationPlanArtifact({
        repoRoot,
        finalWriterReadinessSummaryPath: readiness.path,
        now: new Date("2026-05-07T12:18:00.000Z"),
      });
      const persisted = JSON.parse(await readFile(plan.path, "utf8"));

      expect(plan.plan.schema).toBe(
        "openclaw.hermes.taskflow_registry_real_writer_implementation_plan.v1",
      );
      expect(plan.plan.status).toBe("plan_ready");
      expect(plan.plan.operation).toBe("create");
      expect(plan.plan.validation_status).toBe("pass");
      expect(plan.plan.failures).toEqual([]);
      expect(plan.plan.implementation_plan?.mode).toBe("dry_run_plan_only");
      expect(plan.plan.guardrail_checklist.every((check) => check.passed)).toBe(true);
      expect(plan.plan.real_writer_allowed).toBe(false);
      expect(plan.plan.registry_write_allowed).toBe(false);
      expect(plan.plan.taskflow_registry_write).toBe(false);
      expect(plan.plan.sqlite_write).toBe(false);
      expect(plan.plan.worker_execution).toBe(false);
      expect(plan.plan.model_invoked).toBe(false);
      expect(persisted.status).toBe("plan_ready");
    } finally {
      await rm(repoRoot, { recursive: true, force: true });
    }
  });

  it("blocks real writer implementation plan when final readiness is invalid", async () => {
    const repoRoot = await mkdtemp(join(tmpdir(), "hermes-flow-"));
    try {
      const summaryPath = join(repoRoot, "bad-final-writer-readiness-summary.json");
      await writeFile(summaryPath, "{}\n", "utf8");

      const plan = await writeHermesTaskFlowRegistryRealWriterImplementationPlanArtifact({
        repoRoot,
        finalWriterReadinessSummaryPath: summaryPath,
      });

      expect(plan.plan.status).toBe("blocked");
      expect(plan.plan.operation).toBe("blocked");
      expect(plan.plan.validation_status).toBe("fail");
      expect(plan.plan.implementation_plan).toBeNull();
      expect(plan.plan.real_writer_allowed).toBe(false);
      expect(plan.plan.registry_write_allowed).toBe(false);
      expect(plan.plan.taskflow_registry_write).toBe(false);
      expect(plan.plan.sqlite_write).toBe(false);
      expect(plan.plan.failures).toContain(
        "schema must equal openclaw.hermes.taskflow_registry_final_writer_readiness_summary.v1",
      );
    } finally {
      await rm(repoRoot, { recursive: true, force: true });
    }
  });
  it("writes a read-only real writer implementation plan coverage report", async () => {
    const repoRoot = await mkdtemp(join(tmpdir(), "hermes-flow-"));
    try {
      const implementationPlan = await buildRealWriterImplementationPlan(repoRoot);

      const report =
        await writeHermesTaskFlowRegistryRealWriterImplementationPlanCoverageReportArtifact({
          repoRoot,
          realWriterImplementationPlanPath: implementationPlan.path,
          now: new Date("2026-05-07T12:19:00.000Z"),
        });
      const persisted = JSON.parse(await readFile(report.path, "utf8"));

      expect(report.report.schema).toBe(
        "openclaw.hermes.taskflow_registry_real_writer_implementation_plan_coverage_report.v1",
      );
      expect(report.report.status).toBe("coverage_pass");
      expect(report.report.operation).toBe("create");
      expect(report.report.validation_status).toBe("pass");
      expect(report.report.failures).toEqual([]);
      expect(report.report.coverage.implementation_plan_complete).toBe(true);
      expect(report.report.coverage.guardrail_checklist_complete).toBe(true);
      expect(report.report.coverage.required_validation_complete).toBe(true);
      expect(report.report.coverage.rollback_path_present).toBe(true);
      expect(report.report.coverage.all_writes_disabled).toBe(true);
      expect(report.report.coverage.coverage_ratio).toBe(1);
      expect(report.report.real_writer_allowed).toBe(false);
      expect(report.report.registry_write_allowed).toBe(false);
      expect(report.report.taskflow_registry_write).toBe(false);
      expect(report.report.sqlite_write).toBe(false);
      expect(report.report.worker_execution).toBe(false);
      expect(report.report.model_invoked).toBe(false);
      expect(persisted.status).toBe("coverage_pass");
    } finally {
      await rm(repoRoot, { recursive: true, force: true });
    }
  });

  it("blocks real writer implementation plan coverage when plan is invalid", async () => {
    const repoRoot = await mkdtemp(join(tmpdir(), "hermes-flow-"));
    try {
      const planPath = join(repoRoot, "bad-real-writer-implementation-plan.json");
      await writeFile(planPath, "{}\n", "utf8");

      const report =
        await writeHermesTaskFlowRegistryRealWriterImplementationPlanCoverageReportArtifact({
          repoRoot,
          realWriterImplementationPlanPath: planPath,
        });

      expect(report.report.status).toBe("blocked");
      expect(report.report.operation).toBe("blocked");
      expect(report.report.validation_status).toBe("fail");
      expect(report.report.coverage.implementation_plan_complete).toBe(false);
      expect(report.report.coverage.guardrail_checklist_complete).toBe(false);
      expect(report.report.coverage.required_validation_complete).toBe(false);
      expect(report.report.coverage.rollback_path_present).toBe(false);
      expect(report.report.coverage.all_writes_disabled).toBe(false);
      expect(report.report.coverage.coverage_ratio).toBe(0);
      expect(report.report.real_writer_allowed).toBe(false);
      expect(report.report.registry_write_allowed).toBe(false);
      expect(report.report.taskflow_registry_write).toBe(false);
      expect(report.report.sqlite_write).toBe(false);
      expect(report.report.failures).toContain(
        "schema must equal openclaw.hermes.taskflow_registry_real_writer_implementation_plan.v1",
      );
    } finally {
      await rm(repoRoot, { recursive: true, force: true });
    }
  });
  it("writes a dry-run real writer API contract fixture", async () => {
    const repoRoot = await mkdtemp(join(tmpdir(), "hermes-flow-"));
    try {
      const coverage = await buildRealWriterImplementationPlanCoverageReport(repoRoot);

      const fixture = await writeHermesTaskFlowRegistryRealWriterApiContractFixtureArtifact({
        repoRoot,
        realWriterImplementationPlanCoverageReportPath: coverage.path,
        now: new Date("2026-05-07T12:20:00.000Z"),
      });
      const persisted = JSON.parse(await readFile(fixture.path, "utf8"));

      expect(fixture.fixture.schema).toBe(
        "openclaw.hermes.taskflow_registry_real_writer_api_contract_fixture.v1",
      );
      expect(fixture.fixture.status).toBe("contract_ready");
      expect(fixture.fixture.operation).toBe("create");
      expect(fixture.fixture.validation_status).toBe("pass");
      expect(fixture.fixture.failures).toEqual([]);
      expect(fixture.fixture.api_contract?.target).toBe("task_flow_registry_writer");
      expect(fixture.fixture.api_contract?.commit_strategy).toBe("disabled");
      expect(fixture.fixture.api_contract?.approval_token_boundary.operator_approved).toBe(false);
      expect(fixture.fixture.api_contract?.rollback_precondition.must_pass_before_commit).toBe(
        true,
      );
      expect(fixture.fixture.api_contract?.taskflow_registry_write).toBe(false);
      expect(fixture.fixture.api_contract?.sqlite_write).toBe(false);
      expect(fixture.fixture.real_writer_allowed).toBe(false);
      expect(fixture.fixture.registry_write_allowed).toBe(false);
      expect(fixture.fixture.taskflow_registry_write).toBe(false);
      expect(fixture.fixture.sqlite_write).toBe(false);
      expect(fixture.fixture.worker_execution).toBe(false);
      expect(fixture.fixture.model_invoked).toBe(false);
      expect(persisted.status).toBe("contract_ready");
    } finally {
      await rm(repoRoot, { recursive: true, force: true });
    }
  });

  it("blocks real writer API contract fixture when plan coverage is invalid", async () => {
    const repoRoot = await mkdtemp(join(tmpdir(), "hermes-flow-"));
    try {
      const coveragePath = join(repoRoot, "bad-real-writer-plan-coverage-report.json");
      await writeFile(coveragePath, "{}\n", "utf8");

      const fixture = await writeHermesTaskFlowRegistryRealWriterApiContractFixtureArtifact({
        repoRoot,
        realWriterImplementationPlanCoverageReportPath: coveragePath,
      });

      expect(fixture.fixture.status).toBe("blocked");
      expect(fixture.fixture.operation).toBe("blocked");
      expect(fixture.fixture.validation_status).toBe("fail");
      expect(fixture.fixture.api_contract).toBeNull();
      expect(fixture.fixture.real_writer_allowed).toBe(false);
      expect(fixture.fixture.registry_write_allowed).toBe(false);
      expect(fixture.fixture.taskflow_registry_write).toBe(false);
      expect(fixture.fixture.sqlite_write).toBe(false);
      expect(fixture.fixture.failures).toContain(
        "schema must equal openclaw.hermes.taskflow_registry_real_writer_implementation_plan_coverage_report.v1",
      );
    } finally {
      await rm(repoRoot, { recursive: true, force: true });
    }
  });
  it("writes a read-only real writer API contract coverage report", async () => {
    const repoRoot = await mkdtemp(join(tmpdir(), "hermes-flow-"));
    try {
      const fixture = await buildRealWriterApiContractFixture(repoRoot);

      const report = await writeHermesTaskFlowRegistryRealWriterApiContractCoverageReportArtifact({
        repoRoot,
        realWriterApiContractFixturePath: fixture.path,
        now: new Date("2026-05-07T12:21:00.000Z"),
      });
      const persisted = JSON.parse(await readFile(report.path, "utf8"));

      expect(report.report.schema).toBe(
        "openclaw.hermes.taskflow_registry_real_writer_api_contract_coverage_report.v1",
      );
      expect(report.report.status).toBe("coverage_pass");
      expect(report.report.operation).toBe("create");
      expect(report.report.validation_status).toBe("pass");
      expect(report.report.failures).toEqual([]);
      expect(report.report.coverage.api_contract_complete).toBe(true);
      expect(report.report.coverage.input_schema_complete).toBe(true);
      expect(report.report.coverage.output_schema_complete).toBe(true);
      expect(report.report.coverage.approval_token_boundary_complete).toBe(true);
      expect(report.report.coverage.rollback_precondition_complete).toBe(true);
      expect(report.report.coverage.disabled_commit_strategy).toBe(true);
      expect(report.report.coverage.all_writes_disabled).toBe(true);
      expect(report.report.coverage.coverage_ratio).toBe(1);
      expect(report.report.operator_approved).toBe(false);
      expect(report.report.real_writer_allowed).toBe(false);
      expect(report.report.registry_write_allowed).toBe(false);
      expect(report.report.taskflow_registry_write).toBe(false);
      expect(report.report.sqlite_write).toBe(false);
      expect(report.report.worker_execution).toBe(false);
      expect(report.report.model_invoked).toBe(false);
      expect(persisted.status).toBe("coverage_pass");
    } finally {
      await rm(repoRoot, { recursive: true, force: true });
    }
  });

  it("blocks real writer API contract coverage report when fixture is invalid", async () => {
    const repoRoot = await mkdtemp(join(tmpdir(), "hermes-flow-"));
    try {
      const fixturePath = join(repoRoot, "bad-real-writer-api-contract-fixture.json");
      await writeFile(fixturePath, "{}\n", "utf8");

      const report = await writeHermesTaskFlowRegistryRealWriterApiContractCoverageReportArtifact({
        repoRoot,
        realWriterApiContractFixturePath: fixturePath,
      });

      expect(report.report.status).toBe("blocked");
      expect(report.report.operation).toBe("blocked");
      expect(report.report.validation_status).toBe("fail");
      expect(report.report.coverage.api_contract_complete).toBe(false);
      expect(report.report.coverage.all_writes_disabled).toBe(false);
      expect(report.report.real_writer_allowed).toBe(false);
      expect(report.report.registry_write_allowed).toBe(false);
      expect(report.report.taskflow_registry_write).toBe(false);
      expect(report.report.sqlite_write).toBe(false);
      expect(report.report.failures).toContain(
        "schema must equal openclaw.hermes.taskflow_registry_real_writer_api_contract_fixture.v1",
      );
    } finally {
      await rm(repoRoot, { recursive: true, force: true });
    }
  });
  it("writes a read-only real writer promotion preflight report", async () => {
    const repoRoot = await mkdtemp(join(tmpdir(), "hermes-flow-"));
    try {
      const coverage = await buildRealWriterApiContractCoverageReport(repoRoot);

      const report = await writeHermesTaskFlowRegistryRealWriterPromotionPreflightReportArtifact({
        repoRoot,
        realWriterApiContractCoverageReportPath: coverage.path,
        now: new Date("2026-05-07T12:22:00.000Z"),
      });
      const persisted = JSON.parse(await readFile(report.path, "utf8"));

      expect(report.report.schema).toBe(
        "openclaw.hermes.taskflow_registry_real_writer_promotion_preflight_report.v1",
      );
      expect(report.report.status).toBe("preflight_pass");
      expect(report.report.operation).toBe("create");
      expect(report.report.validation_status).toBe("pass");
      expect(report.report.failures).toEqual([]);
      expect(report.report.preflight.api_contract_coverage_green).toBe(true);
      expect(report.report.preflight.operator_approval_boundary_locked).toBe(true);
      expect(report.report.preflight.rollback_precondition_present).toBe(true);
      expect(report.report.preflight.disabled_commit_strategy_locked).toBe(true);
      expect(report.report.preflight.all_writes_disabled).toBe(true);
      expect(report.report.preflight.preflight_ratio).toBe(1);
      expect(report.report.operator_approved).toBe(false);
      expect(report.report.real_writer_allowed).toBe(false);
      expect(report.report.registry_write_allowed).toBe(false);
      expect(report.report.taskflow_registry_write).toBe(false);
      expect(report.report.sqlite_write).toBe(false);
      expect(report.report.worker_execution).toBe(false);
      expect(report.report.model_invoked).toBe(false);
      expect(persisted.status).toBe("preflight_pass");
    } finally {
      await rm(repoRoot, { recursive: true, force: true });
    }
  });

  it("blocks real writer promotion preflight when API contract coverage is invalid", async () => {
    const repoRoot = await mkdtemp(join(tmpdir(), "hermes-flow-"));
    try {
      const coveragePath = join(repoRoot, "bad-real-writer-api-contract-coverage-report.json");
      await writeFile(coveragePath, "{}\n", "utf8");

      const report = await writeHermesTaskFlowRegistryRealWriterPromotionPreflightReportArtifact({
        repoRoot,
        realWriterApiContractCoverageReportPath: coveragePath,
      });

      expect(report.report.status).toBe("blocked");
      expect(report.report.operation).toBe("blocked");
      expect(report.report.validation_status).toBe("fail");
      expect(report.report.preflight.api_contract_coverage_green).toBe(false);
      expect(report.report.preflight.all_writes_disabled).toBe(false);
      expect(report.report.real_writer_allowed).toBe(false);
      expect(report.report.registry_write_allowed).toBe(false);
      expect(report.report.taskflow_registry_write).toBe(false);
      expect(report.report.sqlite_write).toBe(false);
      expect(report.report.failures).toContain(
        "schema must equal openclaw.hermes.taskflow_registry_real_writer_api_contract_coverage_report.v1",
      );
    } finally {
      await rm(repoRoot, { recursive: true, force: true });
    }
  });
  it("writes a read-only real writer promotion preflight coverage report", async () => {
    const repoRoot = await mkdtemp(join(tmpdir(), "hermes-flow-"));
    try {
      const preflight = await buildRealWriterPromotionPreflightReport(repoRoot);

      const report =
        await writeHermesTaskFlowRegistryRealWriterPromotionPreflightCoverageReportArtifact({
          repoRoot,
          realWriterPromotionPreflightReportPath: preflight.path,
          now: new Date("2026-05-07T12:23:00.000Z"),
        });
      const persisted = JSON.parse(await readFile(report.path, "utf8"));

      expect(report.report.schema).toBe(
        "openclaw.hermes.taskflow_registry_real_writer_promotion_preflight_coverage_report.v1",
      );
      expect(report.report.status).toBe("coverage_pass");
      expect(report.report.operation).toBe("create");
      expect(report.report.validation_status).toBe("pass");
      expect(report.report.failures).toEqual([]);
      expect(report.report.coverage.promotion_preflight_green).toBe(true);
      expect(report.report.coverage.api_contract_coverage_green).toBe(true);
      expect(report.report.coverage.operator_approval_boundary_locked).toBe(true);
      expect(report.report.coverage.rollback_precondition_present).toBe(true);
      expect(report.report.coverage.disabled_commit_strategy_locked).toBe(true);
      expect(report.report.coverage.all_writes_disabled).toBe(true);
      expect(report.report.coverage.coverage_ratio).toBe(1);
      expect(report.report.operator_approved).toBe(false);
      expect(report.report.real_writer_allowed).toBe(false);
      expect(report.report.registry_write_allowed).toBe(false);
      expect(report.report.taskflow_registry_write).toBe(false);
      expect(report.report.sqlite_write).toBe(false);
      expect(report.report.worker_execution).toBe(false);
      expect(report.report.model_invoked).toBe(false);
      expect(persisted.status).toBe("coverage_pass");
    } finally {
      await rm(repoRoot, { recursive: true, force: true });
    }
  });

  it("writes a read-only real writer final readiness lock report", async () => {
    const repoRoot = await mkdtemp(join(tmpdir(), "hermes-flow-"));
    try {
      const coverage = await buildRealWriterPromotionPreflightCoverageReport(repoRoot);

      const report = await writeHermesTaskFlowRegistryRealWriterFinalReadinessLockReportArtifact({
        repoRoot,
        realWriterPromotionPreflightCoverageReportPath: coverage.path,
        now: new Date("2026-05-07T12:24:00.000Z"),
      });
      const persisted = JSON.parse(await readFile(report.path, "utf8"));

      expect(report.report.schema).toBe(
        "openclaw.hermes.taskflow_registry_real_writer_final_readiness_lock_report.v1",
      );
      expect(report.report.status).toBe("lock_pass");
      expect(report.report.operation).toBe("create");
      expect(report.report.validation_status).toBe("pass");
      expect(report.report.failures).toEqual([]);
      expect(report.report.lock.promotion_preflight_coverage_green).toBe(true);
      expect(report.report.lock.api_contract_coverage_green).toBe(true);
      expect(report.report.lock.operator_approval_boundary_locked).toBe(true);
      expect(report.report.lock.rollback_precondition_present).toBe(true);
      expect(report.report.lock.disabled_commit_strategy_locked).toBe(true);
      expect(report.report.lock.all_writes_disabled).toBe(true);
      expect(report.report.lock.lock_ratio).toBe(1);
      expect(report.report.operator_approved).toBe(false);
      expect(report.report.real_writer_allowed).toBe(false);
      expect(report.report.registry_write_allowed).toBe(false);
      expect(report.report.taskflow_registry_write).toBe(false);
      expect(report.report.sqlite_write).toBe(false);
      expect(report.report.worker_execution).toBe(false);
      expect(report.report.model_invoked).toBe(false);
      expect(persisted.status).toBe("lock_pass");
    } finally {
      await rm(repoRoot, { recursive: true, force: true });
    }
  });

  it("writes a dry-run real writer activation approval token fixture", async () => {
    const repoRoot = await mkdtemp(join(tmpdir(), "hermes-flow-"));
    try {
      const lockReport = await buildRealWriterFinalReadinessLockReport(repoRoot);

      const fixture =
        await writeHermesTaskFlowRegistryRealWriterActivationApprovalTokenFixtureArtifact({
          repoRoot,
          realWriterFinalReadinessLockReportPath: lockReport.path,
          now: new Date("2026-05-07T12:25:00.000Z"),
        });
      const persisted = JSON.parse(await readFile(fixture.path, "utf8"));

      expect(fixture.fixture.schema).toBe(
        "openclaw.hermes.taskflow_registry_real_writer_activation_approval_token_fixture.v1",
      );
      expect(fixture.fixture.status).toBe("fixture_ready");
      expect(fixture.fixture.operation).toBe("create");
      expect(fixture.fixture.validation_status).toBe("pass");
      expect(fixture.fixture.failures).toEqual([]);
      expect(fixture.fixture.approval_token_boundary.challenge).toContain(
        "APPROVE HERMES REAL WRITER",
      );
      expect(fixture.fixture.approval_token_boundary.fingerprint_algorithm).toBe("sha256");
      expect(fixture.fixture.approval_token_boundary.raw_token_persisted).toBe(false);
      expect(fixture.fixture.approval_token_boundary.operator_approved).toBe(false);
      expect(fixture.fixture.approval_token_boundary.approval_required_before_real_writer).toBe(
        true,
      );
      expect(fixture.fixture.approval_token_boundary.token_storage_policy).toBe("fingerprint_only");
      expect(fixture.fixture.preconditions.final_readiness_lock_green).toBe(true);
      expect(fixture.fixture.preconditions.promotion_preflight_coverage_green).toBe(true);
      expect(fixture.fixture.preconditions.all_writes_disabled).toBe(true);
      expect(fixture.fixture.operator_approved).toBe(false);
      expect(fixture.fixture.real_writer_allowed).toBe(false);
      expect(fixture.fixture.registry_write_allowed).toBe(false);
      expect(fixture.fixture.taskflow_registry_write).toBe(false);
      expect(fixture.fixture.sqlite_write).toBe(false);
      expect(fixture.fixture.worker_execution).toBe(false);
      expect(fixture.fixture.model_invoked).toBe(false);
      expect(persisted.status).toBe("fixture_ready");
    } finally {
      await rm(repoRoot, { recursive: true, force: true });
    }
  });

  it("writes a read-only real writer activation approval token coverage report", async () => {
    const repoRoot = await mkdtemp(join(tmpdir(), "hermes-flow-"));
    try {
      const fixture = await buildRealWriterActivationApprovalTokenFixture(repoRoot);

      const report =
        await writeHermesTaskFlowRegistryRealWriterActivationApprovalTokenCoverageReportArtifact({
          repoRoot,
          realWriterActivationApprovalTokenFixturePath: fixture.path,
          now: new Date("2026-05-07T12:26:00.000Z"),
        });
      const persisted = JSON.parse(await readFile(report.path, "utf8"));

      expect(report.report.schema).toBe(
        "openclaw.hermes.taskflow_registry_real_writer_activation_approval_token_coverage_report.v1",
      );
      expect(report.report.status).toBe("coverage_pass");
      expect(report.report.operation).toBe("create");
      expect(report.report.validation_status).toBe("pass");
      expect(report.report.failures).toEqual([]);
      expect(report.report.coverage.challenge_present).toBe(true);
      expect(report.report.coverage.fingerprint_present).toBe(true);
      expect(report.report.coverage.fingerprint_algorithm_locked).toBe(true);
      expect(report.report.coverage.raw_token_not_persisted).toBe(true);
      expect(report.report.coverage.operator_approval_boundary_locked).toBe(true);
      expect(report.report.coverage.fixture_not_operator_approval).toBe(true);
      expect(report.report.coverage.approval_required_before_real_writer).toBe(true);
      expect(report.report.coverage.all_writes_disabled).toBe(true);
      expect(report.report.coverage.coverage_ratio).toBe(1);
      expect(report.report.approval_token_fixture_can_activate_writer).toBe(false);
      expect(report.report.operator_approved).toBe(false);
      expect(report.report.real_writer_allowed).toBe(false);
      expect(report.report.registry_write_allowed).toBe(false);
      expect(report.report.taskflow_registry_write).toBe(false);
      expect(report.report.sqlite_write).toBe(false);
      expect(report.report.worker_execution).toBe(false);
      expect(report.report.model_invoked).toBe(false);
      expect(persisted.status).toBe("coverage_pass");
    } finally {
      await rm(repoRoot, { recursive: true, force: true });
    }
  });

  it("blocks real writer activation approval token coverage when fixture is invalid", async () => {
    const repoRoot = await mkdtemp(join(tmpdir(), "hermes-flow-"));
    try {
      const fixturePath = join(repoRoot, "bad-real-writer-activation-approval-token-fixture.json");
      await writeFile(fixturePath, "{}\n", "utf8");

      const report =
        await writeHermesTaskFlowRegistryRealWriterActivationApprovalTokenCoverageReportArtifact({
          repoRoot,
          realWriterActivationApprovalTokenFixturePath: fixturePath,
        });

      expect(report.report.status).toBe("blocked");
      expect(report.report.operation).toBe("blocked");
      expect(report.report.validation_status).toBe("fail");
      expect(report.report.coverage.challenge_present).toBe(false);
      expect(report.report.coverage.raw_token_not_persisted).toBe(false);
      expect(report.report.coverage.fixture_not_operator_approval).toBe(false);
      expect(report.report.approval_token_fixture_can_activate_writer).toBe(false);
      expect(report.report.real_writer_allowed).toBe(false);
      expect(report.report.registry_write_allowed).toBe(false);
      expect(report.report.taskflow_registry_write).toBe(false);
      expect(report.report.sqlite_write).toBe(false);
      expect(report.report.failures).toContain(
        "schema must equal openclaw.hermes.taskflow_registry_real_writer_activation_approval_token_fixture.v1",
      );
    } finally {
      await rm(repoRoot, { recursive: true, force: true });
    }
  });

  it("writes a read-only real writer activation approval preflight report", async () => {
    const repoRoot = await mkdtemp(join(tmpdir(), "hermes-flow-"));
    try {
      const coverage = await buildRealWriterActivationApprovalTokenCoverageReport(repoRoot);

      const report =
        await writeHermesTaskFlowRegistryRealWriterActivationApprovalPreflightReportArtifact({
          repoRoot,
          realWriterActivationApprovalTokenCoverageReportPath: coverage.path,
          now: new Date("2026-05-07T12:27:00.000Z"),
        });
      const persisted = JSON.parse(await readFile(report.path, "utf8"));

      expect(report.report.schema).toBe(
        "openclaw.hermes.taskflow_registry_real_writer_activation_approval_preflight_report.v1",
      );
      expect(report.report.status).toBe("preflight_pass");
      expect(report.report.operation).toBe("create");
      expect(report.report.validation_status).toBe("pass");
      expect(report.report.failures).toEqual([]);
      expect(report.report.preflight.approval_token_coverage_green).toBe(true);
      expect(report.report.preflight.fixture_not_operator_approval).toBe(true);
      expect(report.report.preflight.operator_approval_boundary_locked).toBe(true);
      expect(report.report.preflight.raw_token_not_persisted).toBe(true);
      expect(report.report.preflight.rollback_precondition_present).toBe(true);
      expect(report.report.preflight.disabled_commit_strategy_locked).toBe(true);
      expect(report.report.preflight.all_writes_disabled).toBe(true);
      expect(report.report.preflight.preflight_ratio).toBe(1);
      expect(report.report.approval_token_fixture_can_activate_writer).toBe(false);
      expect(report.report.operator_approved).toBe(false);
      expect(report.report.real_writer_allowed).toBe(false);
      expect(report.report.registry_write_allowed).toBe(false);
      expect(report.report.taskflow_registry_write).toBe(false);
      expect(report.report.sqlite_write).toBe(false);
      expect(report.report.worker_execution).toBe(false);
      expect(report.report.model_invoked).toBe(false);
      expect(persisted.status).toBe("preflight_pass");
    } finally {
      await rm(repoRoot, { recursive: true, force: true });
    }
  });

  it("blocks real writer activation approval preflight when coverage is invalid", async () => {
    const repoRoot = await mkdtemp(join(tmpdir(), "hermes-flow-"));
    try {
      const coveragePath = join(
        repoRoot,
        "bad-real-writer-activation-approval-token-coverage-report.json",
      );
      await writeFile(coveragePath, "{}\n", "utf8");

      const report =
        await writeHermesTaskFlowRegistryRealWriterActivationApprovalPreflightReportArtifact({
          repoRoot,
          realWriterActivationApprovalTokenCoverageReportPath: coveragePath,
        });

      expect(report.report.status).toBe("blocked");
      expect(report.report.operation).toBe("blocked");
      expect(report.report.validation_status).toBe("fail");
      expect(report.report.preflight.approval_token_coverage_green).toBe(false);
      expect(report.report.preflight.rollback_precondition_present).toBe(false);
      expect(report.report.preflight.disabled_commit_strategy_locked).toBe(false);
      expect(report.report.approval_token_fixture_can_activate_writer).toBe(false);
      expect(report.report.real_writer_allowed).toBe(false);
      expect(report.report.registry_write_allowed).toBe(false);
      expect(report.report.taskflow_registry_write).toBe(false);
      expect(report.report.sqlite_write).toBe(false);
      expect(report.report.failures).toContain(
        "schema must equal openclaw.hermes.taskflow_registry_real_writer_activation_approval_token_coverage_report.v1",
      );
    } finally {
      await rm(repoRoot, { recursive: true, force: true });
    }
  });

  it("writes a read-only real writer activation approval preflight coverage report", async () => {
    const repoRoot = await mkdtemp(join(tmpdir(), "hermes-flow-"));
    try {
      const preflight = await buildRealWriterActivationApprovalPreflightReport(repoRoot);

      const report =
        await writeHermesTaskFlowRegistryRealWriterActivationApprovalPreflightCoverageReportArtifact(
          {
            repoRoot,
            realWriterActivationApprovalPreflightReportPath: preflight.path,
            now: new Date("2026-05-07T12:28:00.000Z"),
          },
        );
      const persisted = JSON.parse(await readFile(report.path, "utf8"));

      expect(report.report.schema).toBe(
        "openclaw.hermes.taskflow_registry_real_writer_activation_approval_preflight_coverage_report.v1",
      );
      expect(report.report.status).toBe("coverage_pass");
      expect(report.report.operation).toBe("create");
      expect(report.report.validation_status).toBe("pass");
      expect(report.report.failures).toEqual([]);
      expect(report.report.coverage.approval_preflight_green).toBe(true);
      expect(report.report.coverage.approval_token_coverage_green).toBe(true);
      expect(report.report.coverage.fixture_not_operator_approval).toBe(true);
      expect(report.report.coverage.operator_approval_boundary_locked).toBe(true);
      expect(report.report.coverage.raw_token_not_persisted).toBe(true);
      expect(report.report.coverage.rollback_precondition_present).toBe(true);
      expect(report.report.coverage.disabled_commit_strategy_locked).toBe(true);
      expect(report.report.coverage.all_writes_disabled).toBe(true);
      expect(report.report.coverage.coverage_ratio).toBe(1);
      expect(report.report.approval_token_fixture_can_activate_writer).toBe(false);
      expect(report.report.operator_approved).toBe(false);
      expect(report.report.real_writer_allowed).toBe(false);
      expect(report.report.registry_write_allowed).toBe(false);
      expect(report.report.taskflow_registry_write).toBe(false);
      expect(report.report.sqlite_write).toBe(false);
      expect(report.report.worker_execution).toBe(false);
      expect(report.report.model_invoked).toBe(false);
      expect(persisted.status).toBe("coverage_pass");
    } finally {
      await rm(repoRoot, { recursive: true, force: true });
    }
  });

  it("blocks real writer activation approval preflight coverage when preflight is invalid", async () => {
    const repoRoot = await mkdtemp(join(tmpdir(), "hermes-flow-"));
    try {
      const preflightPath = join(
        repoRoot,
        "bad-real-writer-activation-approval-preflight-report.json",
      );
      await writeFile(preflightPath, "{}\n", "utf8");

      const report =
        await writeHermesTaskFlowRegistryRealWriterActivationApprovalPreflightCoverageReportArtifact(
          {
            repoRoot,
            realWriterActivationApprovalPreflightReportPath: preflightPath,
          },
        );

      expect(report.report.status).toBe("blocked");
      expect(report.report.operation).toBe("blocked");
      expect(report.report.validation_status).toBe("fail");
      expect(report.report.coverage.approval_preflight_green).toBe(false);
      expect(report.report.coverage.approval_token_coverage_green).toBe(false);
      expect(report.report.coverage.rollback_precondition_present).toBe(false);
      expect(report.report.coverage.disabled_commit_strategy_locked).toBe(false);
      expect(report.report.approval_token_fixture_can_activate_writer).toBe(false);
      expect(report.report.real_writer_allowed).toBe(false);
      expect(report.report.registry_write_allowed).toBe(false);
      expect(report.report.taskflow_registry_write).toBe(false);
      expect(report.report.sqlite_write).toBe(false);
      expect(report.report.failures).toContain(
        "schema must equal openclaw.hermes.taskflow_registry_real_writer_activation_approval_preflight_report.v1",
      );
    } finally {
      await rm(repoRoot, { recursive: true, force: true });
    }
  });

  it("writes a read-only real writer activation final readiness lock report", async () => {
    const repoRoot = await mkdtemp(join(tmpdir(), "hermes-flow-"));
    try {
      const coverage = await buildRealWriterActivationApprovalPreflightCoverageReport(repoRoot);

      const report =
        await writeHermesTaskFlowRegistryRealWriterActivationFinalReadinessLockReportArtifact({
          repoRoot,
          realWriterActivationApprovalPreflightCoverageReportPath: coverage.path,
          now: new Date("2026-05-07T12:29:00.000Z"),
        });
      const persisted = JSON.parse(await readFile(report.path, "utf8"));

      expect(report.report.schema).toBe(
        "openclaw.hermes.taskflow_registry_real_writer_activation_final_readiness_lock_report.v1",
      );
      expect(report.report.status).toBe("lock_pass");
      expect(report.report.operation).toBe("create");
      expect(report.report.validation_status).toBe("pass");
      expect(report.report.failures).toEqual([]);
      expect(report.report.lock.activation_approval_preflight_coverage_green).toBe(true);
      expect(report.report.lock.approval_preflight_green).toBe(true);
      expect(report.report.lock.approval_token_coverage_green).toBe(true);
      expect(report.report.lock.fixture_not_operator_approval).toBe(true);
      expect(report.report.lock.operator_approval_boundary_locked).toBe(true);
      expect(report.report.lock.raw_token_not_persisted).toBe(true);
      expect(report.report.lock.rollback_precondition_present).toBe(true);
      expect(report.report.lock.disabled_commit_strategy_locked).toBe(true);
      expect(report.report.lock.all_writes_disabled).toBe(true);
      expect(report.report.lock.lock_ratio).toBe(1);
      expect(report.report.approval_token_fixture_can_activate_writer).toBe(false);
      expect(report.report.operator_approved).toBe(false);
      expect(report.report.real_writer_allowed).toBe(false);
      expect(report.report.registry_write_allowed).toBe(false);
      expect(report.report.taskflow_registry_write).toBe(false);
      expect(report.report.sqlite_write).toBe(false);
      expect(report.report.worker_execution).toBe(false);
      expect(report.report.model_invoked).toBe(false);
      expect(persisted.status).toBe("lock_pass");
    } finally {
      await rm(repoRoot, { recursive: true, force: true });
    }
  });

  it("blocks real writer activation final readiness lock when coverage is invalid", async () => {
    const repoRoot = await mkdtemp(join(tmpdir(), "hermes-flow-"));
    try {
      const coveragePath = join(
        repoRoot,
        "bad-real-writer-activation-approval-preflight-coverage-report.json",
      );
      await writeFile(coveragePath, "{}\n", "utf8");

      const report =
        await writeHermesTaskFlowRegistryRealWriterActivationFinalReadinessLockReportArtifact({
          repoRoot,
          realWriterActivationApprovalPreflightCoverageReportPath: coveragePath,
        });

      expect(report.report.status).toBe("blocked");
      expect(report.report.operation).toBe("blocked");
      expect(report.report.validation_status).toBe("fail");
      expect(report.report.lock.activation_approval_preflight_coverage_green).toBe(false);
      expect(report.report.lock.approval_preflight_green).toBe(false);
      expect(report.report.lock.approval_token_coverage_green).toBe(false);
      expect(report.report.lock.rollback_precondition_present).toBe(false);
      expect(report.report.lock.disabled_commit_strategy_locked).toBe(false);
      expect(report.report.approval_token_fixture_can_activate_writer).toBe(false);
      expect(report.report.real_writer_allowed).toBe(false);
      expect(report.report.registry_write_allowed).toBe(false);
      expect(report.report.taskflow_registry_write).toBe(false);
      expect(report.report.sqlite_write).toBe(false);
      expect(report.report.failures).toContain(
        "schema must equal openclaw.hermes.taskflow_registry_real_writer_activation_approval_preflight_coverage_report.v1",
      );
    } finally {
      await rm(repoRoot, { recursive: true, force: true });
    }
  });
  it("writes a read-only real writer activation final readiness lock coverage report", async () => {
    const repoRoot = await mkdtemp(join(tmpdir(), "hermes-flow-"));
    try {
      const lock = await buildRealWriterActivationFinalReadinessLockReport(repoRoot);

      const report =
        await writeHermesTaskFlowRegistryRealWriterActivationFinalReadinessLockCoverageReportArtifact(
          {
            repoRoot,
            realWriterActivationFinalReadinessLockReportPath: lock.path,
            now: new Date("2026-05-07T12:30:00.000Z"),
          },
        );
      const persisted = JSON.parse(await readFile(report.path, "utf8"));

      expect(report.report.schema).toBe(
        "openclaw.hermes.taskflow_registry_real_writer_activation_final_readiness_lock_coverage_report.v1",
      );
      expect(report.report.status).toBe("coverage_pass");
      expect(report.report.operation).toBe("create");
      expect(report.report.validation_status).toBe("pass");
      expect(report.report.failures).toEqual([]);
      expect(report.report.coverage.activation_final_readiness_lock_green).toBe(true);
      expect(report.report.coverage.activation_approval_preflight_coverage_green).toBe(true);
      expect(report.report.coverage.approval_preflight_green).toBe(true);
      expect(report.report.coverage.approval_token_coverage_green).toBe(true);
      expect(report.report.coverage.fixture_not_operator_approval).toBe(true);
      expect(report.report.coverage.operator_approval_boundary_locked).toBe(true);
      expect(report.report.coverage.raw_token_not_persisted).toBe(true);
      expect(report.report.coverage.rollback_precondition_present).toBe(true);
      expect(report.report.coverage.disabled_commit_strategy_locked).toBe(true);
      expect(report.report.coverage.all_writes_disabled).toBe(true);
      expect(report.report.coverage.coverage_ratio).toBe(1);
      expect(report.report.approval_token_fixture_can_activate_writer).toBe(false);
      expect(report.report.operator_approved).toBe(false);
      expect(report.report.real_writer_allowed).toBe(false);
      expect(report.report.registry_write_allowed).toBe(false);
      expect(report.report.taskflow_registry_write).toBe(false);
      expect(report.report.sqlite_write).toBe(false);
      expect(report.report.worker_execution).toBe(false);
      expect(report.report.model_invoked).toBe(false);
      expect(persisted.status).toBe("coverage_pass");
    } finally {
      await rm(repoRoot, { recursive: true, force: true });
    }
  });

  it("blocks real writer activation final readiness lock coverage when lock is invalid", async () => {
    const repoRoot = await mkdtemp(join(tmpdir(), "hermes-flow-"));
    try {
      const lockPath = join(
        repoRoot,
        "bad-real-writer-activation-final-readiness-lock-report.json",
      );
      await writeFile(lockPath, "{}\n", "utf8");

      const report =
        await writeHermesTaskFlowRegistryRealWriterActivationFinalReadinessLockCoverageReportArtifact(
          {
            repoRoot,
            realWriterActivationFinalReadinessLockReportPath: lockPath,
          },
        );

      expect(report.report.status).toBe("blocked");
      expect(report.report.operation).toBe("blocked");
      expect(report.report.validation_status).toBe("fail");
      expect(report.report.coverage.activation_final_readiness_lock_green).toBe(false);
      expect(report.report.coverage.activation_approval_preflight_coverage_green).toBe(false);
      expect(report.report.coverage.approval_preflight_green).toBe(false);
      expect(report.report.coverage.approval_token_coverage_green).toBe(false);
      expect(report.report.coverage.rollback_precondition_present).toBe(false);
      expect(report.report.coverage.disabled_commit_strategy_locked).toBe(false);
      expect(report.report.approval_token_fixture_can_activate_writer).toBe(false);
      expect(report.report.real_writer_allowed).toBe(false);
      expect(report.report.registry_write_allowed).toBe(false);
      expect(report.report.taskflow_registry_write).toBe(false);
      expect(report.report.sqlite_write).toBe(false);
      expect(report.report.failures).toContain(
        "schema must equal openclaw.hermes.taskflow_registry_real_writer_activation_final_readiness_lock_report.v1",
      );
    } finally {
      await rm(repoRoot, { recursive: true, force: true });
    }
  });
  it("writes a read-only real writer activation release checklist report", async () => {
    const repoRoot = await mkdtemp(join(tmpdir(), "hermes-flow-"));
    try {
      const coverage = await buildRealWriterActivationFinalReadinessLockCoverageReport(repoRoot);

      const report =
        await writeHermesTaskFlowRegistryRealWriterActivationReleaseChecklistReportArtifact({
          repoRoot,
          realWriterActivationFinalReadinessLockCoverageReportPath: coverage.path,
          now: new Date("2026-05-07T12:31:00.000Z"),
        });
      const persisted = JSON.parse(await readFile(report.path, "utf8"));

      expect(report.report.schema).toBe(
        "openclaw.hermes.taskflow_registry_real_writer_activation_release_checklist_report.v1",
      );
      expect(report.report.status).toBe("checklist_pass");
      expect(report.report.operation).toBe("create");
      expect(report.report.validation_status).toBe("pass");
      expect(report.report.failures).toEqual([]);
      expect(report.report.checklist.final_readiness_lock_coverage_green).toBe(true);
      expect(report.report.checklist.activation_final_readiness_lock_green).toBe(true);
      expect(report.report.checklist.activation_approval_preflight_coverage_green).toBe(true);
      expect(report.report.checklist.approval_preflight_green).toBe(true);
      expect(report.report.checklist.approval_token_coverage_green).toBe(true);
      expect(report.report.checklist.fixture_not_operator_approval).toBe(true);
      expect(report.report.checklist.operator_approval_boundary_locked).toBe(true);
      expect(report.report.checklist.raw_token_not_persisted).toBe(true);
      expect(report.report.checklist.rollback_precondition_present).toBe(true);
      expect(report.report.checklist.disabled_commit_strategy_locked).toBe(true);
      expect(report.report.checklist.all_writes_disabled).toBe(true);
      expect(report.report.checklist.release_checklist_ratio).toBe(1);
      expect(report.report.approval_token_fixture_can_activate_writer).toBe(false);
      expect(report.report.operator_approved).toBe(false);
      expect(report.report.real_writer_allowed).toBe(false);
      expect(report.report.registry_write_allowed).toBe(false);
      expect(report.report.taskflow_registry_write).toBe(false);
      expect(report.report.sqlite_write).toBe(false);
      expect(report.report.worker_execution).toBe(false);
      expect(report.report.model_invoked).toBe(false);
      expect(persisted.status).toBe("checklist_pass");
    } finally {
      await rm(repoRoot, { recursive: true, force: true });
    }
  });

  it("blocks real writer activation release checklist when final readiness coverage is invalid", async () => {
    const repoRoot = await mkdtemp(join(tmpdir(), "hermes-flow-"));
    try {
      const coveragePath = join(
        repoRoot,
        "bad-real-writer-activation-final-readiness-lock-coverage-report.json",
      );
      await writeFile(coveragePath, "{}\n", "utf8");

      const report =
        await writeHermesTaskFlowRegistryRealWriterActivationReleaseChecklistReportArtifact({
          repoRoot,
          realWriterActivationFinalReadinessLockCoverageReportPath: coveragePath,
        });

      expect(report.report.status).toBe("blocked");
      expect(report.report.operation).toBe("blocked");
      expect(report.report.validation_status).toBe("fail");
      expect(report.report.checklist.final_readiness_lock_coverage_green).toBe(false);
      expect(report.report.checklist.activation_final_readiness_lock_green).toBe(false);
      expect(report.report.checklist.activation_approval_preflight_coverage_green).toBe(false);
      expect(report.report.checklist.approval_token_coverage_green).toBe(false);
      expect(report.report.checklist.rollback_precondition_present).toBe(false);
      expect(report.report.checklist.disabled_commit_strategy_locked).toBe(false);
      expect(report.report.approval_token_fixture_can_activate_writer).toBe(false);
      expect(report.report.real_writer_allowed).toBe(false);
      expect(report.report.registry_write_allowed).toBe(false);
      expect(report.report.taskflow_registry_write).toBe(false);
      expect(report.report.sqlite_write).toBe(false);
      expect(report.report.failures).toContain(
        "schema must equal openclaw.hermes.taskflow_registry_real_writer_activation_final_readiness_lock_coverage_report.v1",
      );
    } finally {
      await rm(repoRoot, { recursive: true, force: true });
    }
  });

  it("writes a read-only real writer activation release checklist coverage report", async () => {
    const repoRoot = await mkdtemp(join(tmpdir(), "hermes-flow-"));
    try {
      const checklist = await buildRealWriterActivationReleaseChecklistReport(repoRoot);

      const report =
        await writeHermesTaskFlowRegistryRealWriterActivationReleaseChecklistCoverageReportArtifact(
          {
            repoRoot,
            realWriterActivationReleaseChecklistReportPath: checklist.path,
            now: new Date("2026-05-07T12:32:00.000Z"),
          },
        );
      const persisted = JSON.parse(await readFile(report.path, "utf8"));

      expect(report.report.schema).toBe(
        "openclaw.hermes.taskflow_registry_real_writer_activation_release_checklist_coverage_report.v1",
      );
      expect(report.report.status).toBe("coverage_pass");
      expect(report.report.operation).toBe("create");
      expect(report.report.validation_status).toBe("pass");
      expect(report.report.failures).toEqual([]);
      expect(report.report.coverage.release_checklist_green).toBe(true);
      expect(report.report.coverage.final_readiness_lock_coverage_green).toBe(true);
      expect(report.report.coverage.activation_final_readiness_lock_green).toBe(true);
      expect(report.report.coverage.activation_approval_preflight_coverage_green).toBe(true);
      expect(report.report.coverage.approval_preflight_green).toBe(true);
      expect(report.report.coverage.approval_token_coverage_green).toBe(true);
      expect(report.report.coverage.fixture_not_operator_approval).toBe(true);
      expect(report.report.coverage.operator_approval_boundary_locked).toBe(true);
      expect(report.report.coverage.raw_token_not_persisted).toBe(true);
      expect(report.report.coverage.rollback_precondition_present).toBe(true);
      expect(report.report.coverage.disabled_commit_strategy_locked).toBe(true);
      expect(report.report.coverage.all_writes_disabled).toBe(true);
      expect(report.report.coverage.coverage_ratio).toBe(1);
      expect(report.report.approval_token_fixture_can_activate_writer).toBe(false);
      expect(report.report.operator_approved).toBe(false);
      expect(report.report.real_writer_allowed).toBe(false);
      expect(report.report.registry_write_allowed).toBe(false);
      expect(report.report.taskflow_registry_write).toBe(false);
      expect(report.report.sqlite_write).toBe(false);
      expect(report.report.worker_execution).toBe(false);
      expect(report.report.model_invoked).toBe(false);
      expect(persisted.status).toBe("coverage_pass");
    } finally {
      await rm(repoRoot, { recursive: true, force: true });
    }
  });

  it("blocks real writer activation release checklist coverage when checklist is invalid", async () => {
    const repoRoot = await mkdtemp(join(tmpdir(), "hermes-flow-"));
    try {
      const checklistPath = join(
        repoRoot,
        "bad-real-writer-activation-release-checklist-report.json",
      );
      await writeFile(checklistPath, "{}\n", "utf8");

      const report =
        await writeHermesTaskFlowRegistryRealWriterActivationReleaseChecklistCoverageReportArtifact(
          {
            repoRoot,
            realWriterActivationReleaseChecklistReportPath: checklistPath,
          },
        );

      expect(report.report.status).toBe("blocked");
      expect(report.report.operation).toBe("blocked");
      expect(report.report.validation_status).toBe("fail");
      expect(report.report.coverage.release_checklist_green).toBe(false);
      expect(report.report.coverage.final_readiness_lock_coverage_green).toBe(false);
      expect(report.report.coverage.activation_final_readiness_lock_green).toBe(false);
      expect(report.report.coverage.approval_token_coverage_green).toBe(false);
      expect(report.report.coverage.rollback_precondition_present).toBe(false);
      expect(report.report.coverage.disabled_commit_strategy_locked).toBe(false);
      expect(report.report.approval_token_fixture_can_activate_writer).toBe(false);
      expect(report.report.real_writer_allowed).toBe(false);
      expect(report.report.registry_write_allowed).toBe(false);
      expect(report.report.taskflow_registry_write).toBe(false);
      expect(report.report.sqlite_write).toBe(false);
      expect(report.report.failures).toContain(
        "schema must equal openclaw.hermes.taskflow_registry_real_writer_activation_release_checklist_report.v1",
      );
    } finally {
      await rm(repoRoot, { recursive: true, force: true });
    }
  });

  it("writes a dry-run real writer activation operator handoff packet", async () => {
    const repoRoot = await mkdtemp(join(tmpdir(), "hermes-flow-"));
    try {
      const coverage = await buildRealWriterActivationReleaseChecklistCoverageReport(repoRoot);

      const packet =
        await writeHermesTaskFlowRegistryRealWriterActivationOperatorHandoffPacketArtifact({
          repoRoot,
          realWriterActivationReleaseChecklistCoverageReportPath: coverage.path,
          now: new Date("2026-05-07T12:33:00.000Z"),
        });
      const persisted = JSON.parse(await readFile(packet.path, "utf8"));

      expect(packet.packet.schema).toBe(
        "openclaw.hermes.taskflow_registry_real_writer_activation_operator_handoff_packet.v1",
      );
      expect(packet.packet.status).toBe("packet_ready");
      expect(packet.packet.operation).toBe("create");
      expect(packet.packet.validation_status).toBe("pass");
      expect(packet.packet.failures).toEqual([]);
      expect(packet.packet.operator_handoff.required_reviewers).toEqual(["operator", "maintainer"]);
      expect(packet.packet.operator_handoff.review_checklist.length).toBeGreaterThan(0);
      expect(packet.packet.operator_handoff.approval_challenge_reference.required).toBe(true);
      expect(packet.packet.operator_handoff.approval_challenge_reference.raw_token_persisted).toBe(
        false,
      );
      expect(packet.packet.operator_handoff.approval_challenge_reference.operator_approved).toBe(
        false,
      );
      expect(
        packet.packet.operator_handoff.approval_challenge_reference.packet_can_activate_writer,
      ).toBe(false);
      expect(
        packet.packet.operator_handoff.rollback_precondition_reference
          .rollback_precondition_present,
      ).toBe(true);
      expect(
        packet.packet.operator_handoff.disabled_commit_strategy_confirmation
          .disabled_commit_strategy_locked,
      ).toBe(true);
      expect(packet.packet.operator_handoff.release_checklist_coverage_green).toBe(true);
      expect(packet.packet.operator_handoff.release_checklist_green).toBe(true);
      expect(packet.packet.operator_handoff.final_readiness_lock_coverage_green).toBe(true);
      expect(packet.packet.operator_handoff.approval_token_coverage_green).toBe(true);
      expect(packet.packet.operator_handoff.fixture_not_operator_approval).toBe(true);
      expect(packet.packet.operator_handoff.all_writes_disabled).toBe(true);
      expect(packet.packet.operator_handoff.handoff_packet_ratio).toBe(1);
      expect(packet.packet.approval_token_fixture_can_activate_writer).toBe(false);
      expect(packet.packet.operator_approved).toBe(false);
      expect(packet.packet.real_writer_allowed).toBe(false);
      expect(packet.packet.registry_write_allowed).toBe(false);
      expect(packet.packet.taskflow_registry_write).toBe(false);
      expect(packet.packet.sqlite_write).toBe(false);
      expect(packet.packet.worker_execution).toBe(false);
      expect(packet.packet.model_invoked).toBe(false);
      expect(persisted.status).toBe("packet_ready");
    } finally {
      await rm(repoRoot, { recursive: true, force: true });
    }
  });

  it("blocks real writer activation operator handoff packet when checklist coverage is invalid", async () => {
    const repoRoot = await mkdtemp(join(tmpdir(), "hermes-flow-"));
    try {
      const coveragePath = join(
        repoRoot,
        "bad-real-writer-activation-release-checklist-coverage-report.json",
      );
      await writeFile(coveragePath, "{}\n", "utf8");

      const packet =
        await writeHermesTaskFlowRegistryRealWriterActivationOperatorHandoffPacketArtifact({
          repoRoot,
          realWriterActivationReleaseChecklistCoverageReportPath: coveragePath,
        });

      expect(packet.packet.status).toBe("blocked");
      expect(packet.packet.operation).toBe("blocked");
      expect(packet.packet.validation_status).toBe("fail");
      expect(packet.packet.operator_handoff.release_checklist_coverage_green).toBe(false);
      expect(packet.packet.operator_handoff.release_checklist_green).toBe(false);
      expect(packet.packet.operator_handoff.final_readiness_lock_coverage_green).toBe(false);
      expect(packet.packet.operator_handoff.approval_token_coverage_green).toBe(false);
      expect(packet.packet.operator_handoff.all_writes_disabled).toBe(false);
      expect(packet.packet.operator_handoff.approval_challenge_reference.operator_approved).toBe(
        false,
      );
      expect(packet.packet.approval_token_fixture_can_activate_writer).toBe(false);
      expect(packet.packet.real_writer_allowed).toBe(false);
      expect(packet.packet.registry_write_allowed).toBe(false);
      expect(packet.packet.taskflow_registry_write).toBe(false);
      expect(packet.packet.sqlite_write).toBe(false);
      expect(packet.packet.failures).toContain(
        "schema must equal openclaw.hermes.taskflow_registry_real_writer_activation_release_checklist_coverage_report.v1",
      );
    } finally {
      await rm(repoRoot, { recursive: true, force: true });
    }
  });

  it("writes a read-only real writer activation operator handoff packet coverage report", async () => {
    const repoRoot = await mkdtemp(join(tmpdir(), "hermes-flow-"));
    try {
      const packet = await buildRealWriterActivationOperatorHandoffPacket(repoRoot);

      const report =
        await writeHermesTaskFlowRegistryRealWriterActivationOperatorHandoffPacketCoverageReportArtifact(
          {
            repoRoot,
            realWriterActivationOperatorHandoffPacketPath: packet.path,
            now: new Date("2026-05-07T12:34:00.000Z"),
          },
        );
      const persisted = JSON.parse(await readFile(report.path, "utf8"));

      expect(report.report.schema).toBe(
        "openclaw.hermes.taskflow_registry_real_writer_activation_operator_handoff_packet_coverage_report.v1",
      );
      expect(report.report.status).toBe("coverage_pass");
      expect(report.report.operation).toBe("create");
      expect(report.report.validation_status).toBe("pass");
      expect(report.report.failures).toEqual([]);
      expect(report.report.coverage.handoff_packet_ready).toBe(true);
      expect(report.report.coverage.review_checklist_complete).toBe(true);
      expect(report.report.coverage.approval_challenge_reference_complete).toBe(true);
      expect(report.report.coverage.approval_challenge_not_operator_approval).toBe(true);
      expect(report.report.coverage.operator_approval_boundary_locked).toBe(true);
      expect(report.report.coverage.raw_token_not_persisted).toBe(true);
      expect(report.report.coverage.rollback_precondition_reference_present).toBe(true);
      expect(report.report.coverage.disabled_commit_strategy_confirmation_locked).toBe(true);
      expect(report.report.coverage.all_writes_disabled).toBe(true);
      expect(report.report.coverage.coverage_ratio).toBe(1);
      expect(report.report.approval_token_fixture_can_activate_writer).toBe(false);
      expect(report.report.operator_approved).toBe(false);
      expect(report.report.real_writer_allowed).toBe(false);
      expect(report.report.registry_write_allowed).toBe(false);
      expect(report.report.taskflow_registry_write).toBe(false);
      expect(report.report.sqlite_write).toBe(false);
      expect(report.report.worker_execution).toBe(false);
      expect(report.report.model_invoked).toBe(false);
      expect(persisted.status).toBe("coverage_pass");
    } finally {
      await rm(repoRoot, { recursive: true, force: true });
    }
  });

  it("blocks real writer activation operator handoff packet coverage when packet is invalid", async () => {
    const repoRoot = await mkdtemp(join(tmpdir(), "hermes-flow-"));
    try {
      const packetPath = join(repoRoot, "bad-real-writer-activation-operator-handoff-packet.json");
      await writeFile(packetPath, "{}\n", "utf8");

      const report =
        await writeHermesTaskFlowRegistryRealWriterActivationOperatorHandoffPacketCoverageReportArtifact(
          {
            repoRoot,
            realWriterActivationOperatorHandoffPacketPath: packetPath,
          },
        );

      expect(report.report.status).toBe("blocked");
      expect(report.report.operation).toBe("blocked");
      expect(report.report.validation_status).toBe("fail");
      expect(report.report.coverage.handoff_packet_ready).toBe(false);
      expect(report.report.coverage.review_checklist_complete).toBe(false);
      expect(report.report.coverage.approval_challenge_reference_complete).toBe(false);
      expect(report.report.coverage.approval_challenge_not_operator_approval).toBe(false);
      expect(report.report.coverage.rollback_precondition_reference_present).toBe(false);
      expect(report.report.coverage.disabled_commit_strategy_confirmation_locked).toBe(false);
      expect(report.report.approval_token_fixture_can_activate_writer).toBe(false);
      expect(report.report.real_writer_allowed).toBe(false);
      expect(report.report.registry_write_allowed).toBe(false);
      expect(report.report.taskflow_registry_write).toBe(false);
      expect(report.report.sqlite_write).toBe(false);
      expect(report.report.failures).toContain(
        "schema must equal openclaw.hermes.taskflow_registry_real_writer_activation_operator_handoff_packet.v1",
      );
    } finally {
      await rm(repoRoot, { recursive: true, force: true });
    }
  });

  it("writes a read-only real writer activation final safety summary", async () => {
    const repoRoot = await mkdtemp(join(tmpdir(), "hermes-flow-"));
    try {
      const coverage = await buildRealWriterActivationOperatorHandoffPacketCoverageReport(repoRoot);

      const summary =
        await writeHermesTaskFlowRegistryRealWriterActivationFinalSafetySummaryArtifact({
          repoRoot,
          realWriterActivationOperatorHandoffPacketCoverageReportPath: coverage.path,
          now: new Date("2026-05-07T12:35:00.000Z"),
        });
      const persisted = JSON.parse(await readFile(summary.path, "utf8"));

      expect(summary.summary.schema).toBe(
        "openclaw.hermes.taskflow_registry_real_writer_activation_final_safety_summary.v1",
      );
      expect(summary.summary.status).toBe("summary_ready");
      expect(summary.summary.operation).toBe("create");
      expect(summary.summary.validation_status).toBe("pass");
      expect(summary.summary.failures).toEqual([]);
      expect(summary.summary.summary.release_checklist_coverage_green).toBe(true);
      expect(summary.summary.summary.operator_handoff_packet_coverage_green).toBe(true);
      expect(summary.summary.summary.approval_challenge_boundary_green).toBe(true);
      expect(summary.summary.summary.rollback_precondition_reference_green).toBe(true);
      expect(summary.summary.summary.disabled_commit_strategy_confirmation_green).toBe(true);
      expect(summary.summary.summary.all_writes_disabled).toBe(true);
      expect(summary.summary.summary.final_safety_ratio).toBe(1);
      expect(summary.summary.operator_approved).toBe(false);
      expect(summary.summary.real_writer_allowed).toBe(false);
      expect(summary.summary.registry_write_allowed).toBe(false);
      expect(summary.summary.taskflow_registry_write).toBe(false);
      expect(summary.summary.sqlite_write).toBe(false);
      expect(summary.summary.worker_execution).toBe(false);
      expect(summary.summary.model_invoked).toBe(false);
      expect(persisted.status).toBe("summary_ready");
    } finally {
      await rm(repoRoot, { recursive: true, force: true });
    }
  });

  it("blocks real writer activation final safety summary when coverage is invalid", async () => {
    const repoRoot = await mkdtemp(join(tmpdir(), "hermes-flow-"));
    try {
      const coveragePath = join(
        repoRoot,
        "bad-real-writer-activation-operator-handoff-packet-coverage-report.json",
      );
      await writeFile(coveragePath, "{}\n", "utf8");

      const summary =
        await writeHermesTaskFlowRegistryRealWriterActivationFinalSafetySummaryArtifact({
          repoRoot,
          realWriterActivationOperatorHandoffPacketCoverageReportPath: coveragePath,
        });

      expect(summary.summary.status).toBe("blocked");
      expect(summary.summary.operation).toBe("blocked");
      expect(summary.summary.validation_status).toBe("fail");
      expect(summary.summary.summary.release_checklist_coverage_green).toBe(false);
      expect(summary.summary.summary.operator_handoff_packet_coverage_green).toBe(false);
      expect(summary.summary.summary.approval_challenge_boundary_green).toBe(false);
      expect(summary.summary.summary.rollback_precondition_reference_green).toBe(false);
      expect(summary.summary.summary.disabled_commit_strategy_confirmation_green).toBe(false);
      expect(summary.summary.summary.all_writes_disabled).toBe(false);
      expect(summary.summary.registry_write_allowed).toBe(false);
      expect(summary.summary.taskflow_registry_write).toBe(false);
      expect(summary.summary.sqlite_write).toBe(false);
      expect(summary.summary.failures).toContain(
        "schema must equal openclaw.hermes.taskflow_registry_real_writer_activation_operator_handoff_packet_coverage_report.v1",
      );
    } finally {
      await rm(repoRoot, { recursive: true, force: true });
    }
  });

  it("writes a read-only real writer activation final safety summary coverage report", async () => {
    const repoRoot = await mkdtemp(join(tmpdir(), "hermes-flow-"));
    try {
      const summary = await buildRealWriterActivationFinalSafetySummary(repoRoot);

      const report =
        await writeHermesTaskFlowRegistryRealWriterActivationFinalSafetySummaryCoverageReportArtifact(
          {
            repoRoot,
            realWriterActivationFinalSafetySummaryPath: summary.path,
            now: new Date("2026-05-07T12:36:00.000Z"),
          },
        );
      const persisted = JSON.parse(await readFile(report.path, "utf8"));

      expect(report.report.schema).toBe(
        "openclaw.hermes.taskflow_registry_real_writer_activation_final_safety_summary_coverage_report.v1",
      );
      expect(report.report.status).toBe("coverage_pass");
      expect(report.report.operation).toBe("create");
      expect(report.report.validation_status).toBe("pass");
      expect(report.report.failures).toEqual([]);
      expect(report.report.coverage.final_safety_summary_ready).toBe(true);
      expect(report.report.coverage.release_checklist_coverage_green).toBe(true);
      expect(report.report.coverage.operator_handoff_packet_coverage_green).toBe(true);
      expect(report.report.coverage.approval_challenge_boundary_green).toBe(true);
      expect(report.report.coverage.rollback_precondition_reference_green).toBe(true);
      expect(report.report.coverage.disabled_commit_strategy_confirmation_green).toBe(true);
      expect(report.report.coverage.operator_approval_boundary_locked).toBe(true);
      expect(report.report.coverage.all_writes_disabled).toBe(true);
      expect(report.report.coverage.coverage_ratio).toBe(1);
      expect(report.report.operator_approved).toBe(false);
      expect(report.report.real_writer_allowed).toBe(false);
      expect(report.report.registry_write_allowed).toBe(false);
      expect(report.report.taskflow_registry_write).toBe(false);
      expect(report.report.sqlite_write).toBe(false);
      expect(report.report.worker_execution).toBe(false);
      expect(report.report.model_invoked).toBe(false);
      expect(persisted.status).toBe("coverage_pass");
    } finally {
      await rm(repoRoot, { recursive: true, force: true });
    }
  });

  it("blocks real writer activation final safety summary coverage when summary is invalid", async () => {
    const repoRoot = await mkdtemp(join(tmpdir(), "hermes-flow-"));
    try {
      const summaryPath = join(repoRoot, "bad-real-writer-activation-final-safety-summary.json");
      await writeFile(summaryPath, "{}\n", "utf8");

      const report =
        await writeHermesTaskFlowRegistryRealWriterActivationFinalSafetySummaryCoverageReportArtifact(
          {
            repoRoot,
            realWriterActivationFinalSafetySummaryPath: summaryPath,
          },
        );

      expect(report.report.status).toBe("blocked");
      expect(report.report.operation).toBe("blocked");
      expect(report.report.validation_status).toBe("fail");
      expect(report.report.coverage.final_safety_summary_ready).toBe(false);
      expect(report.report.coverage.release_checklist_coverage_green).toBe(false);
      expect(report.report.coverage.operator_handoff_packet_coverage_green).toBe(false);
      expect(report.report.coverage.approval_challenge_boundary_green).toBe(false);
      expect(report.report.coverage.rollback_precondition_reference_green).toBe(false);
      expect(report.report.coverage.disabled_commit_strategy_confirmation_green).toBe(false);
      expect(report.report.coverage.operator_approval_boundary_locked).toBe(false);
      expect(report.report.coverage.all_writes_disabled).toBe(false);
      expect(report.report.registry_write_allowed).toBe(false);
      expect(report.report.taskflow_registry_write).toBe(false);
      expect(report.report.sqlite_write).toBe(false);
      expect(report.report.failures).toContain(
        "schema must equal openclaw.hermes.taskflow_registry_real_writer_activation_final_safety_summary.v1",
      );
    } finally {
      await rm(repoRoot, { recursive: true, force: true });
    }
  });

  it("writes a dry-run next safe task proposer fixture", async () => {
    const repoRoot = await mkdtemp(join(tmpdir(), "hermes-flow-"));
    try {
      const coverageReport =
        await buildRealWriterActivationFinalSafetySummaryCoverageReport(repoRoot);

      const fixture = await writeHermesTaskFlowRegistryNextSafeTaskProposerFixtureArtifact({
        repoRoot,
        realWriterActivationFinalSafetySummaryCoverageReportPath: coverageReport.path,
        now: new Date("2026-05-07T12:37:00.000Z"),
      });
      const persisted = JSON.parse(await readFile(fixture.path, "utf8"));

      expect(fixture.fixture.schema).toBe(
        "openclaw.hermes.taskflow_registry_next_safe_task_proposer_fixture.v1",
      );
      expect(fixture.fixture.status).toBe("fixture_ready");
      expect(fixture.fixture.operation).toBe("create");
      expect(fixture.fixture.validation_status).toBe("pass");
      expect(fixture.fixture.failures).toEqual([]);
      expect(fixture.fixture.model_decision_boundary.may_reference_hermes_model_decision).toBe(
        true,
      );
      expect(fixture.fixture.model_decision_boundary.model_invocation_allowed).toBe(false);
      expect(fixture.fixture.model_decision_boundary.model_invoked).toBe(false);
      expect(fixture.fixture.preconditions.final_safety_summary_coverage_green).toBe(true);
      expect(fixture.fixture.preconditions.final_safety_summary_ready).toBe(true);
      expect(fixture.fixture.preconditions.release_checklist_coverage_green).toBe(true);
      expect(fixture.fixture.preconditions.operator_handoff_packet_coverage_green).toBe(true);
      expect(fixture.fixture.preconditions.approval_challenge_boundary_green).toBe(true);
      expect(fixture.fixture.preconditions.rollback_precondition_reference_green).toBe(true);
      expect(fixture.fixture.preconditions.disabled_commit_strategy_confirmation_green).toBe(true);
      expect(fixture.fixture.preconditions.operator_approval_boundary_locked).toBe(true);
      expect(fixture.fixture.preconditions.all_writes_disabled).toBe(true);
      expect(fixture.fixture.proposed_next_task.proposal_fingerprint).toMatch(/^[a-f0-9]{64}$/);
      expect(fixture.fixture.operator_approved).toBe(false);
      expect(fixture.fixture.real_writer_allowed).toBe(false);
      expect(fixture.fixture.registry_write_allowed).toBe(false);
      expect(fixture.fixture.taskflow_registry_write).toBe(false);
      expect(fixture.fixture.sqlite_write).toBe(false);
      expect(fixture.fixture.worker_execution).toBe(false);
      expect(fixture.fixture.model_invoked).toBe(false);
      expect(persisted.status).toBe("fixture_ready");
    } finally {
      await rm(repoRoot, { recursive: true, force: true });
    }
  });

  it("blocks next safe task proposer fixture when final safety coverage is invalid", async () => {
    const repoRoot = await mkdtemp(join(tmpdir(), "hermes-flow-"));
    try {
      const coveragePath = join(repoRoot, "bad-final-safety-summary-coverage-report.json");
      await writeFile(coveragePath, "{}\n", "utf8");

      const fixture = await writeHermesTaskFlowRegistryNextSafeTaskProposerFixtureArtifact({
        repoRoot,
        realWriterActivationFinalSafetySummaryCoverageReportPath: coveragePath,
      });

      expect(fixture.fixture.status).toBe("blocked");
      expect(fixture.fixture.operation).toBe("blocked");
      expect(fixture.fixture.validation_status).toBe("fail");
      expect(fixture.fixture.model_decision_boundary.model_invocation_allowed).toBe(false);
      expect(fixture.fixture.model_decision_boundary.model_invoked).toBe(false);
      expect(fixture.fixture.preconditions.final_safety_summary_coverage_green).toBe(false);
      expect(fixture.fixture.preconditions.all_writes_disabled).toBe(false);
      expect(fixture.fixture.registry_write_allowed).toBe(false);
      expect(fixture.fixture.taskflow_registry_write).toBe(false);
      expect(fixture.fixture.sqlite_write).toBe(false);
      expect(fixture.fixture.worker_execution).toBe(false);
      expect(fixture.fixture.model_invoked).toBe(false);
      expect(fixture.fixture.failures).toContain(
        "schema must equal openclaw.hermes.taskflow_registry_real_writer_activation_final_safety_summary_coverage_report.v1",
      );
    } finally {
      await rm(repoRoot, { recursive: true, force: true });
    }
  });

  it("writes a read-only next safe task proposer fixture coverage report", async () => {
    const repoRoot = await mkdtemp(join(tmpdir(), "hermes-flow-"));
    try {
      const fixture = await buildNextSafeTaskProposerFixture(repoRoot);

      const report =
        await writeHermesTaskFlowRegistryNextSafeTaskProposerFixtureCoverageReportArtifact({
          repoRoot,
          nextSafeTaskProposerFixturePath: fixture.path,
          now: new Date("2026-05-07T12:38:00.000Z"),
        });
      const persisted = JSON.parse(await readFile(report.path, "utf8"));

      expect(report.report.schema).toBe(
        "openclaw.hermes.taskflow_registry_next_safe_task_proposer_fixture_coverage_report.v1",
      );
      expect(report.report.status).toBe("coverage_pass");
      expect(report.report.operation).toBe("create");
      expect(report.report.validation_status).toBe("pass");
      expect(report.report.failures).toEqual([]);
      expect(report.report.coverage.proposer_fixture_ready).toBe(true);
      expect(report.report.coverage.model_decision_reference_only).toBe(true);
      expect(report.report.coverage.operator_approval_boundary_locked).toBe(true);
      expect(report.report.coverage.proposed_next_task_complete).toBe(true);
      expect(report.report.coverage.proposal_fingerprint_present).toBe(true);
      expect(report.report.coverage.all_writes_disabled).toBe(true);
      expect(report.report.coverage.coverage_ratio).toBe(1);
      expect(report.report.operator_approved).toBe(false);
      expect(report.report.real_writer_allowed).toBe(false);
      expect(report.report.registry_write_allowed).toBe(false);
      expect(report.report.taskflow_registry_write).toBe(false);
      expect(report.report.sqlite_write).toBe(false);
      expect(report.report.worker_execution).toBe(false);
      expect(report.report.model_invoked).toBe(false);
      expect(persisted.status).toBe("coverage_pass");
    } finally {
      await rm(repoRoot, { recursive: true, force: true });
    }
  });

  it("blocks next safe task proposer fixture coverage when fixture is invalid", async () => {
    const repoRoot = await mkdtemp(join(tmpdir(), "hermes-flow-"));
    try {
      const fixturePath = join(repoRoot, "bad-next-safe-task-proposer-fixture.json");
      await writeFile(fixturePath, "{}\n", "utf8");

      const report =
        await writeHermesTaskFlowRegistryNextSafeTaskProposerFixtureCoverageReportArtifact({
          repoRoot,
          nextSafeTaskProposerFixturePath: fixturePath,
        });

      expect(report.report.status).toBe("blocked");
      expect(report.report.operation).toBe("blocked");
      expect(report.report.validation_status).toBe("fail");
      expect(report.report.coverage.proposer_fixture_ready).toBe(false);
      expect(report.report.coverage.model_decision_reference_only).toBe(false);
      expect(report.report.coverage.all_writes_disabled).toBe(false);
      expect(report.report.registry_write_allowed).toBe(false);
      expect(report.report.taskflow_registry_write).toBe(false);
      expect(report.report.sqlite_write).toBe(false);
      expect(report.report.worker_execution).toBe(false);
      expect(report.report.model_invoked).toBe(false);
      expect(report.report.failures).toContain(
        "schema must equal openclaw.hermes.taskflow_registry_next_safe_task_proposer_fixture.v1",
      );
    } finally {
      await rm(repoRoot, { recursive: true, force: true });
    }
  });

  it("writes a dry-run task dialoguer fixture", async () => {
    const repoRoot = await mkdtemp(join(tmpdir(), "hermes-flow-"));
    try {
      const coverage = await buildNextSafeTaskProposerFixtureCoverageReport(repoRoot);

      const fixture = await writeHermesTaskFlowRegistryTaskDialoguerFixtureArtifact({
        repoRoot,
        nextSafeTaskProposerFixtureCoverageReportPath: coverage.path,
        now: new Date("2026-05-07T12:39:00.000Z"),
      });
      const persisted = JSON.parse(await readFile(fixture.path, "utf8"));

      expect(fixture.fixture.schema).toBe(
        "openclaw.hermes.taskflow_registry_task_dialoguer_fixture.v1",
      );
      expect(fixture.fixture.status).toBe("fixture_ready");
      expect(fixture.fixture.dialogue_only).toBe(true);
      expect(fixture.fixture.execution_allowed).toBe(false);
      expect(fixture.fixture.operation).toBe("create");
      expect(fixture.fixture.validation_status).toBe("pass");
      expect(fixture.fixture.failures).toEqual([]);
      expect(fixture.fixture.dialogue.participants).toEqual([
        "hermes_planner",
        "openclaw_guardrail",
        "operator_review",
      ]);
      expect(fixture.fixture.dialogue.turns).toHaveLength(3);
      expect(fixture.fixture.dialogue.model_invocation_allowed).toBe(false);
      expect(fixture.fixture.dialogue.model_invoked).toBe(false);
      expect(fixture.fixture.dialogue.registry_write_allowed).toBe(false);
      expect(fixture.fixture.dialogue.sqlite_write_allowed).toBe(false);
      expect(fixture.fixture.dialogue.worker_execution_allowed).toBe(false);
      expect(fixture.fixture.selected_next_task.mode).toBe("read_only_summary");
      expect(fixture.fixture.selected_next_task.blocked_until_operator_approval).toBe(true);
      expect(fixture.fixture.preconditions.proposer_fixture_coverage_green).toBe(true);
      expect(fixture.fixture.preconditions.model_decision_reference_only).toBe(true);
      expect(fixture.fixture.preconditions.operator_approval_boundary_locked).toBe(true);
      expect(fixture.fixture.preconditions.all_writes_disabled).toBe(true);
      expect(fixture.fixture.operator_approved).toBe(false);
      expect(fixture.fixture.real_writer_allowed).toBe(false);
      expect(fixture.fixture.registry_write_allowed).toBe(false);
      expect(fixture.fixture.taskflow_registry_write).toBe(false);
      expect(fixture.fixture.sqlite_write).toBe(false);
      expect(fixture.fixture.worker_execution).toBe(false);
      expect(fixture.fixture.model_invoked).toBe(false);
      expect(persisted.status).toBe("fixture_ready");
    } finally {
      await rm(repoRoot, { recursive: true, force: true });
    }
  });

  it("blocks task dialoguer fixture when proposer coverage is invalid", async () => {
    const repoRoot = await mkdtemp(join(tmpdir(), "hermes-flow-"));
    try {
      const coveragePath = join(repoRoot, "bad-next-safe-task-proposer-coverage-report.json");
      await writeFile(coveragePath, "{}\n", "utf8");

      const fixture = await writeHermesTaskFlowRegistryTaskDialoguerFixtureArtifact({
        repoRoot,
        nextSafeTaskProposerFixtureCoverageReportPath: coveragePath,
      });

      expect(fixture.fixture.status).toBe("blocked");
      expect(fixture.fixture.dialogue_only).toBe(true);
      expect(fixture.fixture.execution_allowed).toBe(false);
      expect(fixture.fixture.operation).toBe("blocked");
      expect(fixture.fixture.validation_status).toBe("fail");
      expect(fixture.fixture.dialogue.model_invocation_allowed).toBe(false);
      expect(fixture.fixture.dialogue.model_invoked).toBe(false);
      expect(fixture.fixture.preconditions.proposer_fixture_coverage_green).toBe(false);
      expect(fixture.fixture.preconditions.all_writes_disabled).toBe(false);
      expect(fixture.fixture.registry_write_allowed).toBe(false);
      expect(fixture.fixture.taskflow_registry_write).toBe(false);
      expect(fixture.fixture.sqlite_write).toBe(false);
      expect(fixture.fixture.worker_execution).toBe(false);
      expect(fixture.fixture.model_invoked).toBe(false);
      expect(fixture.fixture.failures).toContain(
        "schema must equal openclaw.hermes.taskflow_registry_next_safe_task_proposer_fixture_coverage_report.v1",
      );
    } finally {
      await rm(repoRoot, { recursive: true, force: true });
    }
  });

  it("writes a read-only task dialoguer fixture coverage report", async () => {
    const repoRoot = await mkdtemp(join(tmpdir(), "hermes-flow-"));
    try {
      const coverage = await buildNextSafeTaskProposerFixtureCoverageReport(repoRoot);
      const fixture = await writeHermesTaskFlowRegistryTaskDialoguerFixtureArtifact({
        repoRoot,
        nextSafeTaskProposerFixtureCoverageReportPath: coverage.path,
        now: new Date("2026-05-07T12:39:00.000Z"),
      });

      const report = await writeHermesTaskFlowRegistryTaskDialoguerFixtureCoverageReportArtifact({
        repoRoot,
        taskDialoguerFixturePath: fixture.path,
        now: new Date("2026-05-07T12:40:00.000Z"),
      });
      const persisted = JSON.parse(await readFile(report.path, "utf8"));

      expect(report.report.schema).toBe(
        "openclaw.hermes.taskflow_registry_task_dialoguer_fixture_coverage_report.v1",
      );
      expect(report.report.status).toBe("coverage_pass");
      expect(report.report.operation).toBe("create");
      expect(report.report.validation_status).toBe("pass");
      expect(report.report.failures).toEqual([]);
      expect(report.report.coverage.task_dialoguer_fixture_ready).toBe(true);
      expect(report.report.coverage.dialogue_only_locked).toBe(true);
      expect(report.report.coverage.execution_disabled).toBe(true);
      expect(report.report.coverage.operator_approval_boundary_locked).toBe(true);
      expect(report.report.coverage.all_writes_disabled).toBe(true);
      expect(report.report.coverage.model_invocation_disabled).toBe(true);
      expect(report.report.coverage.coverage_ratio).toBe(1);
      expect(report.report.operator_approved).toBe(false);
      expect(report.report.real_writer_allowed).toBe(false);
      expect(report.report.registry_write_allowed).toBe(false);
      expect(report.report.taskflow_registry_write).toBe(false);
      expect(report.report.sqlite_write).toBe(false);
      expect(report.report.worker_execution).toBe(false);
      expect(report.report.model_invoked).toBe(false);
      expect(persisted.status).toBe("coverage_pass");
    } finally {
      await rm(repoRoot, { recursive: true, force: true });
    }
  });

  it("blocks task dialoguer fixture coverage when fixture is executable", async () => {
    const repoRoot = await mkdtemp(join(tmpdir(), "hermes-flow-"));
    try {
      const coverage = await buildNextSafeTaskProposerFixtureCoverageReport(repoRoot);
      const fixture = await writeHermesTaskFlowRegistryTaskDialoguerFixtureArtifact({
        repoRoot,
        nextSafeTaskProposerFixtureCoverageReportPath: coverage.path,
      });
      const executableFixturePath = join(repoRoot, "bad-task-dialoguer-fixture.json");
      const executableFixture = JSON.parse(await readFile(fixture.path, "utf8"));
      executableFixture.execution_allowed = true;
      await writeFile(
        executableFixturePath,
        JSON.stringify(executableFixture, null, 2) + "\n",
        "utf8",
      );

      const report = await writeHermesTaskFlowRegistryTaskDialoguerFixtureCoverageReportArtifact({
        repoRoot,
        taskDialoguerFixturePath: executableFixturePath,
      });

      expect(report.report.status).toBe("blocked");
      expect(report.report.operation).toBe("blocked");
      expect(report.report.validation_status).toBe("fail");
      expect(report.report.coverage.dialogue_only_locked).toBe(false);
      expect(report.report.coverage.execution_disabled).toBe(false);
      expect(report.report.registry_write_allowed).toBe(false);
      expect(report.report.taskflow_registry_write).toBe(false);
      expect(report.report.sqlite_write).toBe(false);
      expect(report.report.worker_execution).toBe(false);
      expect(report.report.model_invoked).toBe(false);
      expect(report.report.failures).toContain("execution_allowed must equal false");
    } finally {
      await rm(repoRoot, { recursive: true, force: true });
    }
  });

  it("writes a dry-run task dialoguer handoff package for the controlled execution loop", async () => {
    const repoRoot = await mkdtemp(join(tmpdir(), "hermes-flow-"));
    try {
      const proposerCoverage = await buildNextSafeTaskProposerFixtureCoverageReport(repoRoot);
      const fixture = await writeHermesTaskFlowRegistryTaskDialoguerFixtureArtifact({
        repoRoot,
        nextSafeTaskProposerFixtureCoverageReportPath: proposerCoverage.path,
        now: new Date("2026-05-07T12:39:00.000Z"),
      });
      const coverage = await writeHermesTaskFlowRegistryTaskDialoguerFixtureCoverageReportArtifact({
        repoRoot,
        taskDialoguerFixturePath: fixture.path,
        now: new Date("2026-05-07T12:40:00.000Z"),
      });

      const handoff = await writeHermesTaskFlowRegistryTaskDialoguerHandoffPackageArtifact({
        repoRoot,
        taskDialoguerFixtureCoverageReportPath: coverage.path,
        now: new Date("2026-05-07T12:41:00.000Z"),
      });
      const persisted = JSON.parse(await readFile(handoff.path, "utf8"));

      expect(handoff.package.schema).toBe(
        "openclaw.hermes.taskflow_registry_task_dialoguer_handoff_package.v1",
      );
      expect(handoff.package.status).toBe("handoff_ready");
      expect(handoff.package.operation).toBe("create");
      expect(handoff.package.validation_status).toBe("pass");
      expect(handoff.package.failures).toEqual([]);
      expect(handoff.package.dialogue_to_execution_loop.dialogue_coverage_green).toBe(true);
      expect(handoff.package.dialogue_to_execution_loop.handoff_to_controlled_executor).toBe(true);
      expect(handoff.package.dialogue_to_execution_loop.execution_started).toBe(false);
      expect(handoff.package.dialogue_to_execution_loop.phases.map((phase) => phase.name)).toEqual([
        "dialogue",
        "package",
        "approval",
        "controlled_execution",
        "verification",
        "feedback",
      ]);
      expect(handoff.package.execution_request.requested_executor).toBe(
        "openclaw_controlled_executor",
      );
      expect(handoff.package.execution_request.execution_mode).toBe("pending_operator_approval");
      expect(handoff.package.execution_request.execution_started).toBe(false);
      expect(handoff.package.loop_closure.verifier_required).toBe(true);
      expect(handoff.package.loop_closure.feedback_required).toBe(true);
      expect(handoff.package.operator_approved).toBe(false);
      expect(handoff.package.registry_write_allowed).toBe(false);
      expect(handoff.package.taskflow_registry_write).toBe(false);
      expect(handoff.package.sqlite_write).toBe(false);
      expect(handoff.package.worker_execution).toBe(false);
      expect(handoff.package.model_invoked).toBe(false);
      expect(persisted.status).toBe("handoff_ready");
    } finally {
      await rm(repoRoot, { recursive: true, force: true });
    }
  });

  it("blocks task dialoguer handoff package when coverage is invalid", async () => {
    const repoRoot = await mkdtemp(join(tmpdir(), "hermes-flow-"));
    try {
      const coveragePath = join(repoRoot, "bad-task-dialoguer-coverage-report.json");
      await writeFile(coveragePath, "{}\n", "utf8");

      const handoff = await writeHermesTaskFlowRegistryTaskDialoguerHandoffPackageArtifact({
        repoRoot,
        taskDialoguerFixtureCoverageReportPath: coveragePath,
      });

      expect(handoff.package.status).toBe("blocked");
      expect(handoff.package.operation).toBe("blocked");
      expect(handoff.package.validation_status).toBe("fail");
      expect(handoff.package.dialogue_to_execution_loop.dialogue_coverage_green).toBe(false);
      expect(handoff.package.dialogue_to_execution_loop.execution_started).toBe(false);
      expect(handoff.package.execution_request.execution_started).toBe(false);
      expect(handoff.package.operator_approved).toBe(false);
      expect(handoff.package.registry_write_allowed).toBe(false);
      expect(handoff.package.taskflow_registry_write).toBe(false);
      expect(handoff.package.sqlite_write).toBe(false);
      expect(handoff.package.worker_execution).toBe(false);
      expect(handoff.package.model_invoked).toBe(false);
      expect(handoff.package.failures).toContain(
        "schema must equal openclaw.hermes.taskflow_registry_task_dialoguer_fixture_coverage_report.v1",
      );
    } finally {
      await rm(repoRoot, { recursive: true, force: true });
    }
  });

  it("writes a read-only task dialoguer reasoning policy without invoking execution", async () => {
    const repoRoot = await mkdtemp(join(tmpdir(), "hermes-flow-"));
    try {
      const proposerCoverage = await buildNextSafeTaskProposerFixtureCoverageReport(repoRoot);
      const fixture = await writeHermesTaskFlowRegistryTaskDialoguerFixtureArtifact({
        repoRoot,
        nextSafeTaskProposerFixtureCoverageReportPath: proposerCoverage.path,
        now: new Date("2026-05-07T12:39:00.000Z"),
      });
      const coverage = await writeHermesTaskFlowRegistryTaskDialoguerFixtureCoverageReportArtifact({
        repoRoot,
        taskDialoguerFixturePath: fixture.path,
        now: new Date("2026-05-07T12:40:00.000Z"),
      });
      const handoff = await writeHermesTaskFlowRegistryTaskDialoguerHandoffPackageArtifact({
        repoRoot,
        taskDialoguerFixtureCoverageReportPath: coverage.path,
        now: new Date("2026-05-07T12:41:00.000Z"),
      });

      const policy = await writeHermesTaskFlowRegistryTaskDialoguerReasoningPolicyArtifact({
        repoRoot,
        taskDialoguerHandoffPackagePath: handoff.path,
        now: new Date("2026-05-07T12:42:00.000Z"),
      });
      const persisted = JSON.parse(await readFile(policy.path, "utf8"));

      expect(policy.policy.schema).toBe(
        "openclaw.hermes.taskflow_registry_task_dialoguer_reasoning_policy.v1",
      );
      expect(policy.policy.status).toBe("policy_ready");
      expect(policy.policy.operation).toBe("create");
      expect(policy.policy.validation_status).toBe("pass");
      expect(policy.policy.failures).toEqual([]);
      expect(policy.policy.reasoning_policy.risk_classification.map((risk) => risk.class)).toEqual([
        "read_only",
        "dry_run",
        "approval_required",
        "blocked",
      ]);
      expect(policy.policy.reasoning_policy.next_safe_task_selection.one_task_per_round).toBe(true);
      expect(
        policy.policy.reasoning_policy.next_safe_task_selection.must_reference_existing_artifact,
      ).toBe(true);
      expect(
        policy.policy.reasoning_policy.approval_gate_decision.approval_required_before_execution,
      ).toBe(true);
      expect(
        policy.policy.reasoning_policy.approval_gate_decision.dialogue_or_policy_is_never_approval,
      ).toBe(true);
      expect(policy.policy.reasoning_policy.handoff_rules.handoff_to_controlled_executor).toBe(
        true,
      );
      expect(policy.policy.reasoning_policy.handoff_rules.executor_invocation_allowed).toBe(false);
      expect(policy.policy.reasoning_policy.handoff_rules.execution_started).toBe(false);
      expect(policy.policy.reasoning_policy.feedback_loop.verifier_required).toBe(true);
      expect(policy.policy.reasoning_policy.feedback_loop.learning_update_required).toBe(true);
      expect(policy.policy.reasoning_policy.feedback_loop.next_dialogue_required).toBe(true);
      expect(policy.policy.operator_approved).toBe(false);
      expect(policy.policy.registry_write_allowed).toBe(false);
      expect(policy.policy.taskflow_registry_write).toBe(false);
      expect(policy.policy.sqlite_write).toBe(false);
      expect(policy.policy.worker_execution).toBe(false);
      expect(policy.policy.model_invoked).toBe(false);
      expect(persisted.status).toBe("policy_ready");
    } finally {
      await rm(repoRoot, { recursive: true, force: true });
    }
  });

  it("blocks task dialoguer reasoning policy when handoff package is invalid", async () => {
    const repoRoot = await mkdtemp(join(tmpdir(), "hermes-flow-"));
    try {
      const handoffPath = join(repoRoot, "bad-task-dialoguer-handoff-package.json");
      await writeFile(handoffPath, "{}\n", "utf8");

      const policy = await writeHermesTaskFlowRegistryTaskDialoguerReasoningPolicyArtifact({
        repoRoot,
        taskDialoguerHandoffPackagePath: handoffPath,
      });

      expect(policy.policy.status).toBe("blocked");
      expect(policy.policy.operation).toBe("blocked");
      expect(policy.policy.validation_status).toBe("fail");
      expect(policy.policy.operator_approved).toBe(false);
      expect(policy.policy.registry_write_allowed).toBe(false);
      expect(policy.policy.taskflow_registry_write).toBe(false);
      expect(policy.policy.sqlite_write).toBe(false);
      expect(policy.policy.worker_execution).toBe(false);
      expect(policy.policy.model_invoked).toBe(false);
      expect(policy.policy.failures).toContain(
        "schema must equal openclaw.hermes.taskflow_registry_task_dialoguer_handoff_package.v1",
      );
    } finally {
      await rm(repoRoot, { recursive: true, force: true });
    }
  });

  it("writes a read-only task dialoguer reasoning policy coverage report", async () => {
    const repoRoot = await mkdtemp(join(tmpdir(), "hermes-flow-"));
    try {
      const proposerCoverage = await buildNextSafeTaskProposerFixtureCoverageReport(repoRoot);
      const fixture = await writeHermesTaskFlowRegistryTaskDialoguerFixtureArtifact({
        repoRoot,
        nextSafeTaskProposerFixtureCoverageReportPath: proposerCoverage.path,
        now: new Date("2026-05-07T12:39:00.000Z"),
      });
      const fixtureCoverage =
        await writeHermesTaskFlowRegistryTaskDialoguerFixtureCoverageReportArtifact({
          repoRoot,
          taskDialoguerFixturePath: fixture.path,
          now: new Date("2026-05-07T12:40:00.000Z"),
        });
      const handoff = await writeHermesTaskFlowRegistryTaskDialoguerHandoffPackageArtifact({
        repoRoot,
        taskDialoguerFixtureCoverageReportPath: fixtureCoverage.path,
        now: new Date("2026-05-07T12:41:00.000Z"),
      });
      const policy = await writeHermesTaskFlowRegistryTaskDialoguerReasoningPolicyArtifact({
        repoRoot,
        taskDialoguerHandoffPackagePath: handoff.path,
        now: new Date("2026-05-07T12:42:00.000Z"),
      });

      const report =
        await writeHermesTaskFlowRegistryTaskDialoguerReasoningPolicyCoverageReportArtifact({
          repoRoot,
          taskDialoguerReasoningPolicyPath: policy.path,
          now: new Date("2026-05-07T12:43:00.000Z"),
        });
      const persisted = JSON.parse(await readFile(report.path, "utf8"));

      expect(report.report.schema).toBe(
        "openclaw.hermes.taskflow_registry_task_dialoguer_reasoning_policy_coverage_report.v1",
      );
      expect(report.report.status).toBe("coverage_pass");
      expect(report.report.operation).toBe("create");
      expect(report.report.validation_status).toBe("pass");
      expect(report.report.failures).toEqual([]);
      expect(report.report.coverage.policy_ready).toBe(true);
      expect(report.report.coverage.goal_understanding_rule_present).toBe(true);
      expect(report.report.coverage.risk_classes_complete).toBe(true);
      expect(report.report.coverage.next_safe_task_selection_locked).toBe(true);
      expect(report.report.coverage.approval_gate_locked).toBe(true);
      expect(report.report.coverage.handoff_rules_locked).toBe(true);
      expect(report.report.coverage.feedback_loop_complete).toBe(true);
      expect(report.report.coverage.all_writes_disabled).toBe(true);
      expect(report.report.coverage.model_invocation_disabled).toBe(true);
      expect(report.report.coverage.coverage_ratio).toBe(1);
      expect(report.report.operator_approved).toBe(false);
      expect(report.report.registry_write_allowed).toBe(false);
      expect(report.report.taskflow_registry_write).toBe(false);
      expect(report.report.sqlite_write).toBe(false);
      expect(report.report.worker_execution).toBe(false);
      expect(report.report.model_invoked).toBe(false);
      expect(persisted.status).toBe("coverage_pass");
    } finally {
      await rm(repoRoot, { recursive: true, force: true });
    }
  });

  it("blocks task dialoguer reasoning policy coverage when policy is invalid", async () => {
    const repoRoot = await mkdtemp(join(tmpdir(), "hermes-flow-"));
    try {
      const policyPath = join(repoRoot, "bad-task-dialoguer-reasoning-policy.json");
      await writeFile(policyPath, "{}\n", "utf8");

      const report =
        await writeHermesTaskFlowRegistryTaskDialoguerReasoningPolicyCoverageReportArtifact({
          repoRoot,
          taskDialoguerReasoningPolicyPath: policyPath,
        });

      expect(report.report.status).toBe("blocked");
      expect(report.report.operation).toBe("blocked");
      expect(report.report.validation_status).toBe("fail");
      expect(report.report.coverage.policy_ready).toBe(false);
      expect(report.report.coverage.risk_classes_complete).toBe(false);
      expect(report.report.coverage.next_safe_task_selection_locked).toBe(false);
      expect(report.report.coverage.approval_gate_locked).toBe(false);
      expect(report.report.coverage.handoff_rules_locked).toBe(false);
      expect(report.report.coverage.feedback_loop_complete).toBe(false);
      expect(report.report.operator_approved).toBe(false);
      expect(report.report.registry_write_allowed).toBe(false);
      expect(report.report.taskflow_registry_write).toBe(false);
      expect(report.report.sqlite_write).toBe(false);
      expect(report.report.worker_execution).toBe(false);
      expect(report.report.model_invoked).toBe(false);
      expect(report.report.failures).toContain(
        "schema must equal openclaw.hermes.taskflow_registry_task_dialoguer_reasoning_policy.v1",
      );
    } finally {
      await rm(repoRoot, { recursive: true, force: true });
    }
  });

  it("writes a read-only task dialoguer status summary report", async () => {
    const repoRoot = await mkdtemp(join(tmpdir(), "hermes-flow-"));
    try {
      const proposerCoverage = await buildNextSafeTaskProposerFixtureCoverageReport(repoRoot);
      const fixture = await writeHermesTaskFlowRegistryTaskDialoguerFixtureArtifact({
        repoRoot,
        nextSafeTaskProposerFixtureCoverageReportPath: proposerCoverage.path,
        now: new Date("2026-05-07T15:30:00.000Z"),
      });
      const fixtureCoverage =
        await writeHermesTaskFlowRegistryTaskDialoguerFixtureCoverageReportArtifact({
          repoRoot,
          taskDialoguerFixturePath: fixture.path,
          now: new Date("2026-05-07T15:31:00.000Z"),
        });
      const handoff = await writeHermesTaskFlowRegistryTaskDialoguerHandoffPackageArtifact({
        repoRoot,
        taskDialoguerFixtureCoverageReportPath: fixtureCoverage.path,
        now: new Date("2026-05-07T15:32:00.000Z"),
      });
      const policy = await writeHermesTaskFlowRegistryTaskDialoguerReasoningPolicyArtifact({
        repoRoot,
        taskDialoguerHandoffPackagePath: handoff.path,
        now: new Date("2026-05-07T15:33:00.000Z"),
      });
      const policyCoverage =
        await writeHermesTaskFlowRegistryTaskDialoguerReasoningPolicyCoverageReportArtifact({
          repoRoot,
          taskDialoguerReasoningPolicyPath: policy.path,
          now: new Date("2026-05-07T15:34:00.000Z"),
        });

      const summary = await writeHermesTaskFlowRegistryTaskDialoguerStatusSummaryReportArtifact({
        repoRoot,
        taskDialoguerReasoningPolicyCoverageReportPath: policyCoverage.path,
        now: new Date("2026-05-07T15:35:00.000Z"),
      });
      const persisted = JSON.parse(await readFile(summary.path, "utf8"));

      expect(summary.report.schema).toBe(
        "openclaw.hermes.taskflow_registry_task_dialoguer_status_summary_report.v1",
      );
      expect(summary.report.status).toBe("summary_ready");
      expect(summary.report.operation).toBe("create");
      expect(summary.report.validation_status).toBe("pass");
      expect(summary.report.failures).toEqual([]);
      expect(summary.report.summary.fixture_ready).toBe(true);
      expect(summary.report.summary.fixture_coverage_green).toBe(true);
      expect(summary.report.summary.handoff_ready).toBe(true);
      expect(summary.report.summary.reasoning_policy_ready).toBe(true);
      expect(summary.report.summary.reasoning_policy_coverage_green).toBe(true);
      expect(summary.report.summary.dialogue_only_locked).toBe(true);
      expect(summary.report.summary.execution_disabled).toBe(true);
      expect(summary.report.summary.approval_gate_locked).toBe(true);
      expect(summary.report.summary.handoff_rules_locked).toBe(true);
      expect(summary.report.summary.feedback_loop_complete).toBe(true);
      expect(summary.report.summary.all_writes_disabled).toBe(true);
      expect(summary.report.summary.model_invocation_disabled).toBe(true);
      expect(summary.report.summary.operator_approval_still_false).toBe(true);
      expect(summary.report.summary.execution_started_still_false).toBe(true);
      expect(summary.report.summary.summary_ratio).toBe(1);
      expect(summary.report.operator_approved).toBe(false);
      expect(summary.report.execution_started).toBe(false);
      expect(summary.report.registry_write_allowed).toBe(false);
      expect(summary.report.taskflow_registry_write).toBe(false);
      expect(summary.report.sqlite_write).toBe(false);
      expect(summary.report.worker_execution).toBe(false);
      expect(summary.report.model_invoked).toBe(false);
      expect(persisted.status).toBe("summary_ready");
    } finally {
      await rm(repoRoot, { recursive: true, force: true });
    }
  });

  it("writes a read-only task dialoguer status summary coverage report", async () => {
    const repoRoot = await mkdtemp(join(tmpdir(), "hermes-flow-"));
    try {
      const summary = await buildTaskDialoguerStatusSummaryReport(repoRoot);
      const summaryCoverage =
        await writeHermesTaskFlowRegistryTaskDialoguerStatusSummaryCoverageReportArtifact({
          repoRoot,
          taskDialoguerStatusSummaryPath: summary.path,
          now: new Date("2026-05-07T15:36:00.000Z"),
        });
      const persisted = JSON.parse(await readFile(summaryCoverage.path, "utf8"));

      expect(summaryCoverage.report.schema).toBe(
        "openclaw.hermes.taskflow_registry_task_dialoguer_status_summary_coverage_report.v1",
      );
      expect(summaryCoverage.report.status).toBe("coverage_pass");
      expect(summaryCoverage.report.operation).toBe("create");
      expect(summaryCoverage.report.validation_status).toBe("pass");
      expect(summaryCoverage.report.failures).toEqual([]);
      expect(summaryCoverage.report.coverage.status_summary_ready).toBe(true);
      expect(summaryCoverage.report.coverage.summary_ratio_complete).toBe(true);
      expect(summaryCoverage.report.coverage.fixture_ready).toBe(true);
      expect(summaryCoverage.report.coverage.fixture_coverage_green).toBe(true);
      expect(summaryCoverage.report.coverage.handoff_ready).toBe(true);
      expect(summaryCoverage.report.coverage.reasoning_policy_ready).toBe(true);
      expect(summaryCoverage.report.coverage.reasoning_policy_coverage_green).toBe(true);
      expect(summaryCoverage.report.coverage.dialogue_only_locked).toBe(true);
      expect(summaryCoverage.report.coverage.execution_disabled).toBe(true);
      expect(summaryCoverage.report.coverage.approval_gate_locked).toBe(true);
      expect(summaryCoverage.report.coverage.handoff_rules_locked).toBe(true);
      expect(summaryCoverage.report.coverage.feedback_loop_complete).toBe(true);
      expect(summaryCoverage.report.coverage.all_writes_disabled).toBe(true);
      expect(summaryCoverage.report.coverage.model_invocation_disabled).toBe(true);
      expect(summaryCoverage.report.coverage.operator_approval_still_false).toBe(true);
      expect(summaryCoverage.report.coverage.execution_started_still_false).toBe(true);
      expect(summaryCoverage.report.coverage.coverage_ratio).toBe(1);
      expect(summaryCoverage.report.operator_approved).toBe(false);
      expect(summaryCoverage.report.execution_started).toBe(false);
      expect(summaryCoverage.report.real_writer_allowed).toBe(false);
      expect(summaryCoverage.report.registry_write_allowed).toBe(false);
      expect(summaryCoverage.report.taskflow_registry_write).toBe(false);
      expect(summaryCoverage.report.sqlite_write).toBe(false);
      expect(summaryCoverage.report.worker_execution).toBe(false);
      expect(summaryCoverage.report.model_invoked).toBe(false);
      expect(persisted.status).toBe("coverage_pass");
    } finally {
      await rm(repoRoot, { recursive: true, force: true });
    }
  });

  it("blocks task dialoguer status summary when reasoning policy coverage is invalid", async () => {});

  it("blocks task dialoguer status summary when reasoning policy coverage is invalid", async () => {
    const repoRoot = await mkdtemp(join(tmpdir(), "hermes-flow-"));
    try {
      const reportPath = join(repoRoot, "bad-task-dialoguer-reasoning-policy-coverage-report.json");
      await writeFile(reportPath, "{}\n", "utf8");

      const summary = await writeHermesTaskFlowRegistryTaskDialoguerStatusSummaryReportArtifact({
        repoRoot,
        taskDialoguerReasoningPolicyCoverageReportPath: reportPath,
      });

      expect(summary.report.status).toBe("blocked");
      expect(summary.report.operation).toBe("blocked");
      expect(summary.report.validation_status).toBe("fail");
      expect(summary.report.summary.fixture_ready).toBe(false);
      expect(summary.report.summary.fixture_coverage_green).toBe(false);
      expect(summary.report.summary.handoff_ready).toBe(false);
      expect(summary.report.summary.reasoning_policy_ready).toBe(false);
      expect(summary.report.summary.reasoning_policy_coverage_green).toBe(false);
      expect(summary.report.summary.dialogue_only_locked).toBe(false);
      expect(summary.report.summary.execution_disabled).toBe(false);
      expect(summary.report.summary.all_writes_disabled).toBe(false);
      expect(summary.report.summary.model_invocation_disabled).toBe(false);
      expect(summary.report.summary.operator_approval_still_false).toBe(false);
      expect(summary.report.summary.execution_started_still_false).toBe(true);
      expect(summary.report.operator_approved).toBe(false);
      expect(summary.report.execution_started).toBe(false);
      expect(summary.report.registry_write_allowed).toBe(false);
      expect(summary.report.taskflow_registry_write).toBe(false);
      expect(summary.report.sqlite_write).toBe(false);
      expect(summary.report.worker_execution).toBe(false);
      expect(summary.report.model_invoked).toBe(false);
      expect(summary.report.failures).toContain(
        "schema must equal openclaw.hermes.taskflow_registry_task_dialoguer_reasoning_policy_coverage_report.v1",
      );
    } finally {
      await rm(repoRoot, { recursive: true, force: true });
    }
  });

  it("blocks task dialoguer status summary coverage when summary is invalid", async () => {
    const repoRoot = await mkdtemp(join(tmpdir(), "hermes-flow-"));
    try {
      const reportPath = join(repoRoot, "bad-task-dialoguer-status-summary-report.json");
      await writeFile(reportPath, "{}\n", "utf8");

      const summaryCoverage =
        await writeHermesTaskFlowRegistryTaskDialoguerStatusSummaryCoverageReportArtifact({
          repoRoot,
          taskDialoguerStatusSummaryPath: reportPath,
        });

      expect(summaryCoverage.report.status).toBe("blocked");
      expect(summaryCoverage.report.operation).toBe("blocked");
      expect(summaryCoverage.report.validation_status).toBe("fail");
      expect(summaryCoverage.report.coverage.status_summary_ready).toBe(false);
      expect(summaryCoverage.report.coverage.summary_ratio_complete).toBe(false);
      expect(summaryCoverage.report.coverage.fixture_ready).toBe(false);
      expect(summaryCoverage.report.coverage.fixture_coverage_green).toBe(false);
      expect(summaryCoverage.report.coverage.handoff_ready).toBe(false);
      expect(summaryCoverage.report.coverage.reasoning_policy_ready).toBe(false);
      expect(summaryCoverage.report.coverage.reasoning_policy_coverage_green).toBe(false);
      expect(summaryCoverage.report.coverage.dialogue_only_locked).toBe(false);
      expect(summaryCoverage.report.coverage.execution_disabled).toBe(false);
      expect(summaryCoverage.report.coverage.approval_gate_locked).toBe(false);
      expect(summaryCoverage.report.coverage.handoff_rules_locked).toBe(false);
      expect(summaryCoverage.report.coverage.feedback_loop_complete).toBe(false);
      expect(summaryCoverage.report.coverage.all_writes_disabled).toBe(false);
      expect(summaryCoverage.report.coverage.model_invocation_disabled).toBe(false);
      expect(summaryCoverage.report.coverage.operator_approval_still_false).toBe(false);
      expect(summaryCoverage.report.coverage.execution_started_still_false).toBe(false);
      expect(summaryCoverage.report.coverage.coverage_ratio).toBe(0);
      expect(summaryCoverage.report.operator_approved).toBe(false);
      expect(summaryCoverage.report.execution_started).toBe(false);
      expect(summaryCoverage.report.real_writer_allowed).toBe(false);
      expect(summaryCoverage.report.registry_write_allowed).toBe(false);
      expect(summaryCoverage.report.taskflow_registry_write).toBe(false);
      expect(summaryCoverage.report.sqlite_write).toBe(false);
      expect(summaryCoverage.report.worker_execution).toBe(false);
      expect(summaryCoverage.report.model_invoked).toBe(false);
      expect(summaryCoverage.report.failures).toContain(
        "schema must equal openclaw.hermes.taskflow_registry_task_dialoguer_status_summary_report.v1",
      );
    } finally {
      await rm(repoRoot, { recursive: true, force: true });
    }
  });

  it("starts a read-only OpenClaw Hermes controlled dialogue executor dry run", async () => {
    const repoRoot = await mkdtemp(join(tmpdir(), "hermes-flow-"));
    try {
      const summary = await buildTaskDialoguerStatusSummaryReport(repoRoot);
      const summaryCoverage =
        await writeHermesTaskFlowRegistryTaskDialoguerStatusSummaryCoverageReportArtifact({
          repoRoot,
          taskDialoguerStatusSummaryPath: summary.path,
          now: new Date("2026-05-07T12:45:00.000Z"),
        });

      const session = await runHermesTaskFlowRegistryControlledDialogueExecutorDryRunArtifact({
        repoRoot,
        taskDialoguerStatusSummaryCoverageReportPath: summaryCoverage.path,
        now: new Date("2026-05-07T12:46:00.000Z"),
      });
      const persisted = JSON.parse(await readFile(session.path, "utf8"));

      expect(session.session.schema).toBe(
        "openclaw.hermes.taskflow_registry_controlled_dialogue_executor_dry_run.v1",
      );
      expect(session.session.status).toBe("dialogue_started");
      expect(session.session.operation).toBe("create");
      expect(session.session.validation_status).toBe("pass");
      expect(session.session.failures).toEqual([]);
      expect(session.session.dialogue_started).toBe(true);
      expect(session.session.execution_started).toBe(false);
      expect(session.session.dialogue_session.openclaw_to_hermes_started).toBe(true);
      expect(session.session.dialogue_session.hermes_to_openclaw_started).toBe(true);
      expect(session.session.dialogue_session.turns).toHaveLength(2);
      expect(session.session.dialogue_session.flow_steps.length).toBeGreaterThanOrEqual(5);
      expect(session.session.dialogue_session.optimization_steps.length).toBeGreaterThanOrEqual(6);
      expect(session.session.dialogue_session.guardrails.approval_required).toBe(true);
      expect(session.session.dialogue_session.guardrails.execution_start_allowed).toBe(false);
      expect(session.session.dialogue_session.guardrails.registry_write_allowed).toBe(false);
      expect(session.session.dialogue_session.guardrails.sqlite_write).toBe(false);
      expect(session.session.dialogue_session.guardrails.worker_execution).toBe(false);
      expect(session.session.dialogue_session.guardrails.model_invocation).toBe(false);
      expect(session.session.dialogue_session.next_decision.risk_level).toBe("low");
      expect(session.session.operator_approved).toBe(false);
      expect(session.session.registry_write_allowed).toBe(false);
      expect(session.session.taskflow_registry_write).toBe(false);
      expect(session.session.sqlite_write).toBe(false);
      expect(session.session.worker_execution).toBe(false);
      expect(session.session.model_invoked).toBe(false);
      expect(persisted.status).toBe("dialogue_started");
    } finally {
      await rm(repoRoot, { recursive: true, force: true });
    }
  });

  it("blocks controlled dialogue executor dry run when summary coverage is invalid", async () => {
    const repoRoot = await mkdtemp(join(tmpdir(), "hermes-flow-"));
    try {
      const reportPath = join(repoRoot, "bad-task-dialoguer-status-summary-coverage-report.json");
      await writeFile(reportPath, "{}\n", "utf8");

      const session = await runHermesTaskFlowRegistryControlledDialogueExecutorDryRunArtifact({
        repoRoot,
        taskDialoguerStatusSummaryCoverageReportPath: reportPath,
      });

      expect(session.session.status).toBe("blocked");
      expect(session.session.operation).toBe("blocked");
      expect(session.session.validation_status).toBe("fail");
      expect(session.session.dialogue_session.openclaw_to_hermes_started).toBe(false);
      expect(session.session.dialogue_session.hermes_to_openclaw_started).toBe(false);
      expect(session.session.execution_started).toBe(false);
      expect(session.session.operator_approved).toBe(false);
      expect(session.session.registry_write_allowed).toBe(false);
      expect(session.session.taskflow_registry_write).toBe(false);
      expect(session.session.sqlite_write).toBe(false);
      expect(session.session.worker_execution).toBe(false);
      expect(session.session.model_invoked).toBe(false);
      expect(session.session.failures).toContain(
        "schema must equal openclaw.hermes.taskflow_registry_task_dialoguer_status_summary_coverage_report.v1",
      );
    } finally {
      await rm(repoRoot, { recursive: true, force: true });
    }
  });

  it("writes a read-only controlled executor intake validator", async () => {});
  it("writes a read-only controlled executor intake validator", async () => {
    const repoRoot = await mkdtemp(join(tmpdir(), "hermes-flow-"));
    try {
      const proposerCoverage = await buildNextSafeTaskProposerFixtureCoverageReport(repoRoot);
      const fixture = await writeHermesTaskFlowRegistryTaskDialoguerFixtureArtifact({
        repoRoot,
        nextSafeTaskProposerFixtureCoverageReportPath: proposerCoverage.path,
        now: new Date("2026-05-07T12:39:00.000Z"),
      });
      const fixtureCoverage =
        await writeHermesTaskFlowRegistryTaskDialoguerFixtureCoverageReportArtifact({
          repoRoot,
          taskDialoguerFixturePath: fixture.path,
          now: new Date("2026-05-07T12:40:00.000Z"),
        });
      const handoff = await writeHermesTaskFlowRegistryTaskDialoguerHandoffPackageArtifact({
        repoRoot,
        taskDialoguerFixtureCoverageReportPath: fixtureCoverage.path,
        now: new Date("2026-05-07T12:41:00.000Z"),
      });
      const policy = await writeHermesTaskFlowRegistryTaskDialoguerReasoningPolicyArtifact({
        repoRoot,
        taskDialoguerHandoffPackagePath: handoff.path,
        now: new Date("2026-05-07T12:42:00.000Z"),
      });
      const policyCoverage =
        await writeHermesTaskFlowRegistryTaskDialoguerReasoningPolicyCoverageReportArtifact({
          repoRoot,
          taskDialoguerReasoningPolicyPath: policy.path,
          now: new Date("2026-05-07T12:43:00.000Z"),
        });

      const validator = await writeHermesTaskFlowRegistryControlledExecutorIntakeValidatorArtifact({
        repoRoot,
        taskDialoguerReasoningPolicyCoverageReportPath: policyCoverage.path,
        now: new Date("2026-05-07T12:44:00.000Z"),
      });
      const persisted = JSON.parse(await readFile(validator.path, "utf8"));

      expect(validator.validator.schema).toBe(
        "openclaw.hermes.taskflow_registry_controlled_executor_intake_validator.v1",
      );
      expect(validator.validator.status).toBe("intake_ready");
      expect(validator.validator.operation).toBe("create");
      expect(validator.validator.validation_status).toBe("pass");
      expect(validator.validator.failures).toEqual([]);
      expect(validator.validator.intake_preconditions.reasoning_policy_coverage_green).toBe(true);
      expect(validator.validator.intake_preconditions.policy_ready).toBe(true);
      expect(validator.validator.intake_preconditions.approval_gate_locked).toBe(true);
      expect(validator.validator.intake_preconditions.handoff_rules_locked).toBe(true);
      expect(validator.validator.intake_preconditions.all_writes_disabled).toBe(true);
      expect(validator.validator.intake_preconditions.model_invocation_disabled).toBe(true);
      expect(validator.validator.intake_preconditions.coverage_ratio).toBe(1);
      expect(validator.validator.intake_boundary.requested_executor).toBe(
        "openclaw_controlled_executor",
      );
      expect(validator.validator.intake_boundary.operator_approval_required).toBe(true);
      expect(validator.validator.intake_boundary.operator_approved).toBe(false);
      expect(validator.validator.intake_boundary.execution_started).toBe(false);
      expect(validator.validator.intake_boundary.execution_allowed).toBe(false);
      expect(validator.validator.operator_approved).toBe(false);
      expect(validator.validator.registry_write_allowed).toBe(false);
      expect(validator.validator.taskflow_registry_write).toBe(false);
      expect(validator.validator.sqlite_write).toBe(false);
      expect(validator.validator.worker_execution).toBe(false);
      expect(validator.validator.model_invoked).toBe(false);
      expect(persisted.status).toBe("intake_ready");
    } finally {
      await rm(repoRoot, { recursive: true, force: true });
    }
  });

  it("blocks controlled executor intake validator when reasoning policy coverage is invalid", async () => {
    const repoRoot = await mkdtemp(join(tmpdir(), "hermes-flow-"));
    try {
      const reportPath = join(repoRoot, "bad-task-dialoguer-reasoning-policy-coverage-report.json");
      await writeFile(reportPath, "{}\n", "utf8");

      const validator = await writeHermesTaskFlowRegistryControlledExecutorIntakeValidatorArtifact({
        repoRoot,
        taskDialoguerReasoningPolicyCoverageReportPath: reportPath,
      });

      expect(validator.validator.status).toBe("blocked");
      expect(validator.validator.operation).toBe("blocked");
      expect(validator.validator.validation_status).toBe("fail");
      expect(validator.validator.intake_preconditions.reasoning_policy_coverage_green).toBe(false);
      expect(validator.validator.intake_preconditions.policy_ready).toBe(false);
      expect(validator.validator.intake_preconditions.approval_gate_locked).toBe(false);
      expect(validator.validator.intake_preconditions.handoff_rules_locked).toBe(false);
      expect(validator.validator.intake_preconditions.all_writes_disabled).toBe(false);
      expect(validator.validator.intake_preconditions.model_invocation_disabled).toBe(false);
      expect(validator.validator.operator_approved).toBe(false);
      expect(validator.validator.registry_write_allowed).toBe(false);
      expect(validator.validator.taskflow_registry_write).toBe(false);
      expect(validator.validator.sqlite_write).toBe(false);
      expect(validator.validator.worker_execution).toBe(false);
      expect(validator.validator.model_invoked).toBe(false);
      expect(validator.validator.failures).toContain(
        "schema must equal openclaw.hermes.taskflow_registry_task_dialoguer_reasoning_policy_coverage_report.v1",
      );
    } finally {
      await rm(repoRoot, { recursive: true, force: true });
    }
  });

  it("writes a read-only controlled executor intake coverage report", async () => {
    const repoRoot = await mkdtemp(join(tmpdir(), "hermes-flow-"));
    try {
      const proposerCoverage = await buildNextSafeTaskProposerFixtureCoverageReport(repoRoot);
      const fixture = await writeHermesTaskFlowRegistryTaskDialoguerFixtureArtifact({
        repoRoot,
        nextSafeTaskProposerFixtureCoverageReportPath: proposerCoverage.path,
        now: new Date("2026-05-07T12:39:00.000Z"),
      });
      const fixtureCoverage =
        await writeHermesTaskFlowRegistryTaskDialoguerFixtureCoverageReportArtifact({
          repoRoot,
          taskDialoguerFixturePath: fixture.path,
          now: new Date("2026-05-07T12:40:00.000Z"),
        });
      const handoff = await writeHermesTaskFlowRegistryTaskDialoguerHandoffPackageArtifact({
        repoRoot,
        taskDialoguerFixtureCoverageReportPath: fixtureCoverage.path,
        now: new Date("2026-05-07T12:41:00.000Z"),
      });
      const policy = await writeHermesTaskFlowRegistryTaskDialoguerReasoningPolicyArtifact({
        repoRoot,
        taskDialoguerHandoffPackagePath: handoff.path,
        now: new Date("2026-05-07T12:42:00.000Z"),
      });
      const policyCoverage =
        await writeHermesTaskFlowRegistryTaskDialoguerReasoningPolicyCoverageReportArtifact({
          repoRoot,
          taskDialoguerReasoningPolicyPath: policy.path,
          now: new Date("2026-05-07T12:43:00.000Z"),
        });
      const intakeValidator =
        await writeHermesTaskFlowRegistryControlledExecutorIntakeValidatorArtifact({
          repoRoot,
          taskDialoguerReasoningPolicyCoverageReportPath: policyCoverage.path,
          now: new Date("2026-05-07T12:44:00.000Z"),
        });

      const coverage =
        await writeHermesTaskFlowRegistryControlledExecutorIntakeCoverageReportArtifact({
          repoRoot,
          controlledExecutorIntakeValidatorPath: intakeValidator.path,
          now: new Date("2026-05-07T12:45:00.000Z"),
        });
      const persisted = JSON.parse(await readFile(coverage.path, "utf8"));

      expect(coverage.report.schema).toBe(
        "openclaw.hermes.taskflow_registry_controlled_executor_intake_coverage_report.v1",
      );
      expect(coverage.report.status).toBe("coverage_pass");
      expect(coverage.report.operation).toBe("create");
      expect(coverage.report.validation_status).toBe("pass");
      expect(coverage.report.failures).toEqual([]);
      expect(coverage.report.coverage.intake_ready).toBe(true);
      expect(coverage.report.coverage.intake_preconditions_complete).toBe(true);
      expect(coverage.report.coverage.intake_boundary_locked).toBe(true);
      expect(coverage.report.coverage.operator_approval_still_false).toBe(true);
      expect(coverage.report.coverage.execution_started_still_false).toBe(true);
      expect(coverage.report.coverage.all_writes_disabled).toBe(true);
      expect(coverage.report.coverage.model_invocation_disabled).toBe(true);
      expect(coverage.report.coverage.coverage_ratio).toBe(1);
      expect(coverage.report.operator_approved).toBe(false);
      expect(coverage.report.registry_write_allowed).toBe(false);
      expect(coverage.report.taskflow_registry_write).toBe(false);
      expect(coverage.report.sqlite_write).toBe(false);
      expect(coverage.report.worker_execution).toBe(false);
      expect(coverage.report.model_invoked).toBe(false);
      expect(persisted.status).toBe("coverage_pass");
    } finally {
      await rm(repoRoot, { recursive: true, force: true });
    }
  });

  it("blocks controlled executor intake coverage report when intake validator is invalid", async () => {
    const repoRoot = await mkdtemp(join(tmpdir(), "hermes-flow-"));
    try {
      const validatorPath = join(repoRoot, "bad-controlled-executor-intake-validator.json");
      await writeFile(validatorPath, "{}\n", "utf8");

      const coverage =
        await writeHermesTaskFlowRegistryControlledExecutorIntakeCoverageReportArtifact({
          repoRoot,
          controlledExecutorIntakeValidatorPath: validatorPath,
        });

      expect(coverage.report.status).toBe("blocked");
      expect(coverage.report.operation).toBe("blocked");
      expect(coverage.report.validation_status).toBe("fail");
      expect(coverage.report.coverage.intake_ready).toBe(false);
      expect(coverage.report.coverage.intake_preconditions_complete).toBe(false);
      expect(coverage.report.coverage.intake_boundary_locked).toBe(false);
      expect(coverage.report.coverage.operator_approval_still_false).toBe(false);
      expect(coverage.report.coverage.execution_started_still_false).toBe(false);
      expect(coverage.report.coverage.all_writes_disabled).toBe(false);
      expect(coverage.report.coverage.model_invocation_disabled).toBe(false);
      expect(coverage.report.operator_approved).toBe(false);
      expect(coverage.report.registry_write_allowed).toBe(false);
      expect(coverage.report.taskflow_registry_write).toBe(false);
      expect(coverage.report.sqlite_write).toBe(false);
      expect(coverage.report.worker_execution).toBe(false);
      expect(coverage.report.model_invoked).toBe(false);
      expect(coverage.report.failures).toContain(
        "schema must equal openclaw.hermes.taskflow_registry_controlled_executor_intake_validator.v1",
      );
    } finally {
      await rm(repoRoot, { recursive: true, force: true });
    }
  });

  it("writes a read-only controlled executor intake release summary report", async () => {
    const repoRoot = await mkdtemp(join(tmpdir(), "hermes-flow-"));
    try {
      const proposerCoverage = await buildNextSafeTaskProposerFixtureCoverageReport(repoRoot);
      const fixture = await writeHermesTaskFlowRegistryTaskDialoguerFixtureArtifact({
        repoRoot,
        nextSafeTaskProposerFixtureCoverageReportPath: proposerCoverage.path,
        now: new Date("2026-05-07T12:46:00.000Z"),
      });
      const fixtureCoverage =
        await writeHermesTaskFlowRegistryTaskDialoguerFixtureCoverageReportArtifact({
          repoRoot,
          taskDialoguerFixturePath: fixture.path,
          now: new Date("2026-05-07T12:47:00.000Z"),
        });
      const handoff = await writeHermesTaskFlowRegistryTaskDialoguerHandoffPackageArtifact({
        repoRoot,
        taskDialoguerFixtureCoverageReportPath: fixtureCoverage.path,
        now: new Date("2026-05-07T12:48:00.000Z"),
      });
      const policy = await writeHermesTaskFlowRegistryTaskDialoguerReasoningPolicyArtifact({
        repoRoot,
        taskDialoguerHandoffPackagePath: handoff.path,
        now: new Date("2026-05-07T12:49:00.000Z"),
      });
      const policyCoverage =
        await writeHermesTaskFlowRegistryTaskDialoguerReasoningPolicyCoverageReportArtifact({
          repoRoot,
          taskDialoguerReasoningPolicyPath: policy.path,
          now: new Date("2026-05-07T12:50:00.000Z"),
        });
      const intakeValidator =
        await writeHermesTaskFlowRegistryControlledExecutorIntakeValidatorArtifact({
          repoRoot,
          taskDialoguerReasoningPolicyCoverageReportPath: policyCoverage.path,
          now: new Date("2026-05-07T12:51:00.000Z"),
        });
      const intakeCoverage =
        await writeHermesTaskFlowRegistryControlledExecutorIntakeCoverageReportArtifact({
          repoRoot,
          controlledExecutorIntakeValidatorPath: intakeValidator.path,
          now: new Date("2026-05-07T12:52:00.000Z"),
        });

      const summary =
        await writeHermesTaskFlowRegistryControlledExecutorIntakeReleaseSummaryReportArtifact({
          repoRoot,
          controlledExecutorIntakeCoverageReportPath: intakeCoverage.path,
          now: new Date("2026-05-07T12:53:00.000Z"),
        });
      const persisted = JSON.parse(await readFile(summary.path, "utf8"));

      expect(summary.report.schema).toBe(
        "openclaw.hermes.taskflow_registry_controlled_executor_intake_release_summary_report.v1",
      );
      expect(summary.report.status).toBe("summary_pass");
      expect(summary.report.operation).toBe("create");
      expect(summary.report.validation_status).toBe("pass");
      expect(summary.report.failures).toEqual([]);
      expect(summary.report.summary.intake_coverage_green).toBe(true);
      expect(summary.report.summary.intake_preconditions_still_complete).toBe(true);
      expect(summary.report.summary.intake_boundary_still_locked).toBe(true);
      expect(summary.report.summary.operator_approval_still_false).toBe(true);
      expect(summary.report.summary.execution_started_still_false).toBe(true);
      expect(summary.report.summary.all_writes_disabled).toBe(true);
      expect(summary.report.summary.model_invocation_disabled).toBe(true);
      expect(summary.report.summary.coverage_ratio).toBe(1);
      expect(summary.report.operator_approved).toBe(false);
      expect(summary.report.registry_write_allowed).toBe(false);
      expect(summary.report.taskflow_registry_write).toBe(false);
      expect(summary.report.sqlite_write).toBe(false);
      expect(summary.report.worker_execution).toBe(false);
      expect(summary.report.model_invoked).toBe(false);
      expect(persisted.status).toBe("summary_pass");
    } finally {
      await rm(repoRoot, { recursive: true, force: true });
    }
  });

  it("blocks controlled executor intake release summary report when intake coverage report is invalid", async () => {
    const repoRoot = await mkdtemp(join(tmpdir(), "hermes-flow-"));
    try {
      const coveragePath = join(repoRoot, "bad-controlled-executor-intake-coverage-report.json");
      await writeFile(coveragePath, "{}\n", "utf8");

      const summary =
        await writeHermesTaskFlowRegistryControlledExecutorIntakeReleaseSummaryReportArtifact({
          repoRoot,
          controlledExecutorIntakeCoverageReportPath: coveragePath,
        });

      expect(summary.report.status).toBe("blocked");
      expect(summary.report.operation).toBe("blocked");
      expect(summary.report.validation_status).toBe("fail");
      expect(summary.report.summary.intake_coverage_green).toBe(false);
      expect(summary.report.summary.intake_preconditions_still_complete).toBe(false);
      expect(summary.report.summary.intake_boundary_still_locked).toBe(false);
      expect(summary.report.summary.operator_approval_still_false).toBe(false);
      expect(summary.report.summary.execution_started_still_false).toBe(false);
      expect(summary.report.summary.all_writes_disabled).toBe(false);
      expect(summary.report.summary.model_invocation_disabled).toBe(false);
      expect(summary.report.operator_approved).toBe(false);
      expect(summary.report.registry_write_allowed).toBe(false);
      expect(summary.report.taskflow_registry_write).toBe(false);
      expect(summary.report.sqlite_write).toBe(false);
      expect(summary.report.worker_execution).toBe(false);
      expect(summary.report.model_invoked).toBe(false);
      expect(summary.report.failures).toContain(
        "schema must equal openclaw.hermes.taskflow_registry_controlled_executor_intake_coverage_report.v1",
      );
    } finally {
      await rm(repoRoot, { recursive: true, force: true });
    }
  });

  it("writes a read-only controlled executor approval preflight report", async () => {
    const repoRoot = await mkdtemp(join(tmpdir(), "hermes-flow-"));
    try {
      const proposerCoverage = await buildNextSafeTaskProposerFixtureCoverageReport(repoRoot);
      const fixture = await writeHermesTaskFlowRegistryTaskDialoguerFixtureArtifact({
        repoRoot,
        nextSafeTaskProposerFixtureCoverageReportPath: proposerCoverage.path,
        now: new Date("2026-05-07T12:54:00.000Z"),
      });
      const fixtureCoverage =
        await writeHermesTaskFlowRegistryTaskDialoguerFixtureCoverageReportArtifact({
          repoRoot,
          taskDialoguerFixturePath: fixture.path,
          now: new Date("2026-05-07T12:55:00.000Z"),
        });
      const handoff = await writeHermesTaskFlowRegistryTaskDialoguerHandoffPackageArtifact({
        repoRoot,
        taskDialoguerFixtureCoverageReportPath: fixtureCoverage.path,
        now: new Date("2026-05-07T12:56:00.000Z"),
      });
      const policy = await writeHermesTaskFlowRegistryTaskDialoguerReasoningPolicyArtifact({
        repoRoot,
        taskDialoguerHandoffPackagePath: handoff.path,
        now: new Date("2026-05-07T12:57:00.000Z"),
      });
      const policyCoverage =
        await writeHermesTaskFlowRegistryTaskDialoguerReasoningPolicyCoverageReportArtifact({
          repoRoot,
          taskDialoguerReasoningPolicyPath: policy.path,
          now: new Date("2026-05-07T12:58:00.000Z"),
        });
      const intakeValidator =
        await writeHermesTaskFlowRegistryControlledExecutorIntakeValidatorArtifact({
          repoRoot,
          taskDialoguerReasoningPolicyCoverageReportPath: policyCoverage.path,
          now: new Date("2026-05-07T12:59:00.000Z"),
        });
      const intakeCoverage =
        await writeHermesTaskFlowRegistryControlledExecutorIntakeCoverageReportArtifact({
          repoRoot,
          controlledExecutorIntakeValidatorPath: intakeValidator.path,
          now: new Date("2026-05-07T13:00:00.000Z"),
        });
      const intakeReleaseSummary =
        await writeHermesTaskFlowRegistryControlledExecutorIntakeReleaseSummaryReportArtifact({
          repoRoot,
          controlledExecutorIntakeCoverageReportPath: intakeCoverage.path,
          now: new Date("2026-05-07T13:01:00.000Z"),
        });

      const preflight =
        await writeHermesTaskFlowRegistryControlledExecutorApprovalPreflightReportArtifact({
          repoRoot,
          controlledExecutorIntakeReleaseSummaryReportPath: intakeReleaseSummary.path,
          now: new Date("2026-05-07T13:02:00.000Z"),
        });
      const persisted = JSON.parse(await readFile(preflight.path, "utf8"));

      expect(preflight.report.schema).toBe(
        "openclaw.hermes.taskflow_registry_controlled_executor_approval_preflight_report.v1",
      );
      expect(preflight.report.status).toBe("preflight_pass");
      expect(preflight.report.operation).toBe("create");
      expect(preflight.report.validation_status).toBe("pass");
      expect(preflight.report.failures).toEqual([]);
      expect(preflight.report.preflight.intake_release_summary_green).toBe(true);
      expect(preflight.report.preflight.intake_coverage_green).toBe(true);
      expect(preflight.report.preflight.intake_preconditions_still_complete).toBe(true);
      expect(preflight.report.preflight.intake_boundary_still_locked).toBe(true);
      expect(preflight.report.preflight.operator_approval_still_false).toBe(true);
      expect(preflight.report.preflight.execution_started_still_false).toBe(true);
      expect(preflight.report.preflight.all_writes_disabled).toBe(true);
      expect(preflight.report.preflight.model_invocation_disabled).toBe(true);
      expect(preflight.report.preflight.coverage_ratio).toBe(1);
      expect(preflight.report.operator_approved).toBe(false);
      expect(preflight.report.registry_write_allowed).toBe(false);
      expect(preflight.report.taskflow_registry_write).toBe(false);
      expect(preflight.report.sqlite_write).toBe(false);
      expect(preflight.report.worker_execution).toBe(false);
      expect(preflight.report.model_invoked).toBe(false);
      expect(persisted.status).toBe("preflight_pass");
    } finally {
      await rm(repoRoot, { recursive: true, force: true });
    }
  });

  it("blocks controlled executor approval preflight report when intake release summary report is invalid", async () => {
    const repoRoot = await mkdtemp(join(tmpdir(), "hermes-flow-"));
    try {
      const summaryPath = join(
        repoRoot,
        "bad-controlled-executor-intake-release-summary-report.json",
      );
      await writeFile(summaryPath, "{}\n", "utf8");

      const preflight =
        await writeHermesTaskFlowRegistryControlledExecutorApprovalPreflightReportArtifact({
          repoRoot,
          controlledExecutorIntakeReleaseSummaryReportPath: summaryPath,
        });

      expect(preflight.report.status).toBe("blocked");
      expect(preflight.report.operation).toBe("blocked");
      expect(preflight.report.validation_status).toBe("fail");
      expect(preflight.report.preflight.intake_release_summary_green).toBe(false);
      expect(preflight.report.preflight.intake_coverage_green).toBe(false);
      expect(preflight.report.preflight.intake_preconditions_still_complete).toBe(false);
      expect(preflight.report.preflight.intake_boundary_still_locked).toBe(false);
      expect(preflight.report.preflight.operator_approval_still_false).toBe(false);
      expect(preflight.report.preflight.execution_started_still_false).toBe(false);
      expect(preflight.report.preflight.all_writes_disabled).toBe(false);
      expect(preflight.report.preflight.model_invocation_disabled).toBe(false);
      expect(preflight.report.operator_approved).toBe(false);
      expect(preflight.report.registry_write_allowed).toBe(false);
      expect(preflight.report.taskflow_registry_write).toBe(false);
      expect(preflight.report.sqlite_write).toBe(false);
      expect(preflight.report.worker_execution).toBe(false);
      expect(preflight.report.model_invoked).toBe(false);
      expect(preflight.report.failures).toContain(
        "schema must equal openclaw.hermes.taskflow_registry_controlled_executor_intake_release_summary_report.v1",
      );
    } finally {
      await rm(repoRoot, { recursive: true, force: true });
    }
  });

  it("writes a read-only controlled executor approval preflight coverage report", async () => {
    const repoRoot = await mkdtemp(join(tmpdir(), "hermes-flow-"));
    try {
      const proposerCoverage = await buildNextSafeTaskProposerFixtureCoverageReport(repoRoot);
      const fixture = await writeHermesTaskFlowRegistryTaskDialoguerFixtureArtifact({
        repoRoot,
        nextSafeTaskProposerFixtureCoverageReportPath: proposerCoverage.path,
        now: new Date("2026-05-07T13:03:00.000Z"),
      });
      const fixtureCoverage =
        await writeHermesTaskFlowRegistryTaskDialoguerFixtureCoverageReportArtifact({
          repoRoot,
          taskDialoguerFixturePath: fixture.path,
          now: new Date("2026-05-07T13:04:00.000Z"),
        });
      const handoff = await writeHermesTaskFlowRegistryTaskDialoguerHandoffPackageArtifact({
        repoRoot,
        taskDialoguerFixtureCoverageReportPath: fixtureCoverage.path,
        now: new Date("2026-05-07T13:05:00.000Z"),
      });
      const policy = await writeHermesTaskFlowRegistryTaskDialoguerReasoningPolicyArtifact({
        repoRoot,
        taskDialoguerHandoffPackagePath: handoff.path,
        now: new Date("2026-05-07T13:06:00.000Z"),
      });
      const policyCoverage =
        await writeHermesTaskFlowRegistryTaskDialoguerReasoningPolicyCoverageReportArtifact({
          repoRoot,
          taskDialoguerReasoningPolicyPath: policy.path,
          now: new Date("2026-05-07T13:07:00.000Z"),
        });
      const intakeValidator =
        await writeHermesTaskFlowRegistryControlledExecutorIntakeValidatorArtifact({
          repoRoot,
          taskDialoguerReasoningPolicyCoverageReportPath: policyCoverage.path,
          now: new Date("2026-05-07T13:08:00.000Z"),
        });
      const intakeCoverage =
        await writeHermesTaskFlowRegistryControlledExecutorIntakeCoverageReportArtifact({
          repoRoot,
          controlledExecutorIntakeValidatorPath: intakeValidator.path,
          now: new Date("2026-05-07T13:09:00.000Z"),
        });
      const intakeReleaseSummary =
        await writeHermesTaskFlowRegistryControlledExecutorIntakeReleaseSummaryReportArtifact({
          repoRoot,
          controlledExecutorIntakeCoverageReportPath: intakeCoverage.path,
          now: new Date("2026-05-07T13:10:00.000Z"),
        });
      const preflight =
        await writeHermesTaskFlowRegistryControlledExecutorApprovalPreflightReportArtifact({
          repoRoot,
          controlledExecutorIntakeReleaseSummaryReportPath: intakeReleaseSummary.path,
          now: new Date("2026-05-07T13:11:00.000Z"),
        });

      const coverage =
        await writeHermesTaskFlowRegistryControlledExecutorApprovalPreflightCoverageReportArtifact({
          repoRoot,
          controlledExecutorApprovalPreflightReportPath: preflight.path,
          now: new Date("2026-05-07T13:12:00.000Z"),
        });
      const persisted = JSON.parse(await readFile(coverage.path, "utf8"));

      expect(coverage.report.schema).toBe(
        "openclaw.hermes.taskflow_registry_controlled_executor_approval_preflight_coverage_report.v1",
      );
      expect(coverage.report.status).toBe("coverage_pass");
      expect(coverage.report.operation).toBe("create");
      expect(coverage.report.validation_status).toBe("pass");
      expect(coverage.report.failures).toEqual([]);
      expect(coverage.report.coverage.approval_preflight_green).toBe(true);
      expect(coverage.report.coverage.intake_release_summary_green).toBe(true);
      expect(coverage.report.coverage.intake_coverage_green).toBe(true);
      expect(coverage.report.coverage.intake_preconditions_still_complete).toBe(true);
      expect(coverage.report.coverage.intake_boundary_still_locked).toBe(true);
      expect(coverage.report.coverage.operator_approval_still_false).toBe(true);
      expect(coverage.report.coverage.execution_started_still_false).toBe(true);
      expect(coverage.report.coverage.all_writes_disabled).toBe(true);
      expect(coverage.report.coverage.model_invocation_disabled).toBe(true);
      expect(coverage.report.coverage.coverage_ratio).toBe(1);
      expect(coverage.report.operator_approved).toBe(false);
      expect(coverage.report.registry_write_allowed).toBe(false);
      expect(coverage.report.taskflow_registry_write).toBe(false);
      expect(coverage.report.sqlite_write).toBe(false);
      expect(coverage.report.worker_execution).toBe(false);
      expect(coverage.report.model_invoked).toBe(false);
      expect(persisted.status).toBe("coverage_pass");
    } finally {
      await rm(repoRoot, { recursive: true, force: true });
    }
  });

  it("blocks controlled executor approval preflight coverage report when preflight report is invalid", async () => {
    const repoRoot = await mkdtemp(join(tmpdir(), "hermes-flow-"));
    try {
      const preflightPath = join(
        repoRoot,
        "bad-controlled-executor-approval-preflight-report.json",
      );
      await writeFile(preflightPath, "{}\n", "utf8");

      const coverage =
        await writeHermesTaskFlowRegistryControlledExecutorApprovalPreflightCoverageReportArtifact({
          repoRoot,
          controlledExecutorApprovalPreflightReportPath: preflightPath,
        });

      expect(coverage.report.status).toBe("blocked");
      expect(coverage.report.operation).toBe("blocked");
      expect(coverage.report.validation_status).toBe("fail");
      expect(coverage.report.coverage.approval_preflight_green).toBe(false);
      expect(coverage.report.coverage.intake_release_summary_green).toBe(false);
      expect(coverage.report.coverage.intake_coverage_green).toBe(false);
      expect(coverage.report.coverage.intake_preconditions_still_complete).toBe(false);
      expect(coverage.report.coverage.intake_boundary_still_locked).toBe(false);
      expect(coverage.report.coverage.operator_approval_still_false).toBe(false);
      expect(coverage.report.coverage.execution_started_still_false).toBe(false);
      expect(coverage.report.coverage.all_writes_disabled).toBe(false);
      expect(coverage.report.coverage.model_invocation_disabled).toBe(false);
      expect(coverage.report.operator_approved).toBe(false);
      expect(coverage.report.registry_write_allowed).toBe(false);
      expect(coverage.report.taskflow_registry_write).toBe(false);
      expect(coverage.report.sqlite_write).toBe(false);
      expect(coverage.report.worker_execution).toBe(false);
      expect(coverage.report.model_invoked).toBe(false);
      expect(coverage.report.failures).toContain(
        "schema must equal openclaw.hermes.taskflow_registry_controlled_executor_approval_preflight_report.v1",
      );
    } finally {
      await rm(repoRoot, { recursive: true, force: true });
    }
  });

  it("writes a read-only controlled executor final readiness lock report", async () => {
    const repoRoot = await mkdtemp(join(tmpdir(), "hermes-flow-"));
    try {
      const proposerCoverage = await buildNextSafeTaskProposerFixtureCoverageReport(repoRoot);
      const fixture = await writeHermesTaskFlowRegistryTaskDialoguerFixtureArtifact({
        repoRoot,
        nextSafeTaskProposerFixtureCoverageReportPath: proposerCoverage.path,
        now: new Date("2026-05-07T13:13:00.000Z"),
      });
      const fixtureCoverage =
        await writeHermesTaskFlowRegistryTaskDialoguerFixtureCoverageReportArtifact({
          repoRoot,
          taskDialoguerFixturePath: fixture.path,
          now: new Date("2026-05-07T13:14:00.000Z"),
        });
      const handoff = await writeHermesTaskFlowRegistryTaskDialoguerHandoffPackageArtifact({
        repoRoot,
        taskDialoguerFixtureCoverageReportPath: fixtureCoverage.path,
        now: new Date("2026-05-07T13:15:00.000Z"),
      });
      const policy = await writeHermesTaskFlowRegistryTaskDialoguerReasoningPolicyArtifact({
        repoRoot,
        taskDialoguerHandoffPackagePath: handoff.path,
        now: new Date("2026-05-07T13:16:00.000Z"),
      });
      const policyCoverage =
        await writeHermesTaskFlowRegistryTaskDialoguerReasoningPolicyCoverageReportArtifact({
          repoRoot,
          taskDialoguerReasoningPolicyPath: policy.path,
          now: new Date("2026-05-07T13:17:00.000Z"),
        });
      const intakeValidator =
        await writeHermesTaskFlowRegistryControlledExecutorIntakeValidatorArtifact({
          repoRoot,
          taskDialoguerReasoningPolicyCoverageReportPath: policyCoverage.path,
          now: new Date("2026-05-07T13:18:00.000Z"),
        });
      const intakeCoverage =
        await writeHermesTaskFlowRegistryControlledExecutorIntakeCoverageReportArtifact({
          repoRoot,
          controlledExecutorIntakeValidatorPath: intakeValidator.path,
          now: new Date("2026-05-07T13:19:00.000Z"),
        });
      const intakeReleaseSummary =
        await writeHermesTaskFlowRegistryControlledExecutorIntakeReleaseSummaryReportArtifact({
          repoRoot,
          controlledExecutorIntakeCoverageReportPath: intakeCoverage.path,
          now: new Date("2026-05-07T13:20:00.000Z"),
        });
      const preflight =
        await writeHermesTaskFlowRegistryControlledExecutorApprovalPreflightReportArtifact({
          repoRoot,
          controlledExecutorIntakeReleaseSummaryReportPath: intakeReleaseSummary.path,
          now: new Date("2026-05-07T13:21:00.000Z"),
        });
      const preflightCoverage =
        await writeHermesTaskFlowRegistryControlledExecutorApprovalPreflightCoverageReportArtifact({
          repoRoot,
          controlledExecutorApprovalPreflightReportPath: preflight.path,
          now: new Date("2026-05-07T13:22:00.000Z"),
        });

      const lock =
        await writeHermesTaskFlowRegistryControlledExecutorFinalReadinessLockReportArtifact({
          repoRoot,
          controlledExecutorApprovalPreflightCoverageReportPath: preflightCoverage.path,
          now: new Date("2026-05-07T13:23:00.000Z"),
        });
      const persisted = JSON.parse(await readFile(lock.path, "utf8"));

      expect(lock.report.schema).toBe(
        "openclaw.hermes.taskflow_registry_controlled_executor_final_readiness_lock_report.v1",
      );
      expect(lock.report.status).toBe("lock_pass");
      expect(lock.report.operation).toBe("create");
      expect(lock.report.validation_status).toBe("pass");
      expect(lock.report.failures).toEqual([]);
      expect(lock.report.lock.approval_preflight_coverage_green).toBe(true);
      expect(lock.report.lock.approval_preflight_green).toBe(true);
      expect(lock.report.lock.intake_release_summary_green).toBe(true);
      expect(lock.report.lock.intake_coverage_green).toBe(true);
      expect(lock.report.lock.intake_preconditions_still_complete).toBe(true);
      expect(lock.report.lock.intake_boundary_still_locked).toBe(true);
      expect(lock.report.lock.operator_approval_still_false).toBe(true);
      expect(lock.report.lock.execution_started_still_false).toBe(true);
      expect(lock.report.lock.all_writes_disabled).toBe(true);
      expect(lock.report.lock.model_invocation_disabled).toBe(true);
      expect(lock.report.lock.coverage_ratio).toBe(1);
      expect(lock.report.operator_approved).toBe(false);
      expect(lock.report.registry_write_allowed).toBe(false);
      expect(lock.report.taskflow_registry_write).toBe(false);
      expect(lock.report.sqlite_write).toBe(false);
      expect(lock.report.worker_execution).toBe(false);
      expect(lock.report.model_invoked).toBe(false);
      expect(persisted.status).toBe("lock_pass");
    } finally {
      await rm(repoRoot, { recursive: true, force: true });
    }
  });

  it("blocks controlled executor final readiness lock report when preflight coverage report is invalid", async () => {
    const repoRoot = await mkdtemp(join(tmpdir(), "hermes-flow-"));
    try {
      const coveragePath = join(
        repoRoot,
        "bad-controlled-executor-approval-preflight-coverage-report.json",
      );
      await writeFile(coveragePath, "{}\n", "utf8");

      const lock =
        await writeHermesTaskFlowRegistryControlledExecutorFinalReadinessLockReportArtifact({
          repoRoot,
          controlledExecutorApprovalPreflightCoverageReportPath: coveragePath,
        });

      expect(lock.report.status).toBe("blocked");
      expect(lock.report.operation).toBe("blocked");
      expect(lock.report.validation_status).toBe("fail");
      expect(lock.report.lock.approval_preflight_coverage_green).toBe(false);
      expect(lock.report.lock.approval_preflight_green).toBe(false);
      expect(lock.report.lock.intake_release_summary_green).toBe(false);
      expect(lock.report.lock.intake_coverage_green).toBe(false);
      expect(lock.report.lock.intake_preconditions_still_complete).toBe(false);
      expect(lock.report.lock.intake_boundary_still_locked).toBe(false);
      expect(lock.report.lock.operator_approval_still_false).toBe(false);
      expect(lock.report.lock.execution_started_still_false).toBe(false);
      expect(lock.report.lock.all_writes_disabled).toBe(false);
      expect(lock.report.lock.model_invocation_disabled).toBe(false);
      expect(lock.report.operator_approved).toBe(false);
      expect(lock.report.registry_write_allowed).toBe(false);
      expect(lock.report.taskflow_registry_write).toBe(false);
      expect(lock.report.sqlite_write).toBe(false);
      expect(lock.report.worker_execution).toBe(false);
      expect(lock.report.model_invoked).toBe(false);
      expect(lock.report.failures).toContain(
        "schema must equal openclaw.hermes.taskflow_registry_controlled_executor_approval_preflight_coverage_report.v1",
      );
    } finally {
      await rm(repoRoot, { recursive: true, force: true });
    }
  });

  it("writes a read-only controlled executor final readiness lock coverage report", async () => {
    const repoRoot = await mkdtemp(join(tmpdir(), "hermes-flow-"));
    try {
      const proposerCoverage = await buildNextSafeTaskProposerFixtureCoverageReport(repoRoot);
      const fixture = await writeHermesTaskFlowRegistryTaskDialoguerFixtureArtifact({
        repoRoot,
        nextSafeTaskProposerFixtureCoverageReportPath: proposerCoverage.path,
        now: new Date("2026-05-07T13:24:00.000Z"),
      });
      const fixtureCoverage =
        await writeHermesTaskFlowRegistryTaskDialoguerFixtureCoverageReportArtifact({
          repoRoot,
          taskDialoguerFixturePath: fixture.path,
          now: new Date("2026-05-07T13:25:00.000Z"),
        });
      const handoff = await writeHermesTaskFlowRegistryTaskDialoguerHandoffPackageArtifact({
        repoRoot,
        taskDialoguerFixtureCoverageReportPath: fixtureCoverage.path,
        now: new Date("2026-05-07T13:26:00.000Z"),
      });
      const policy = await writeHermesTaskFlowRegistryTaskDialoguerReasoningPolicyArtifact({
        repoRoot,
        taskDialoguerHandoffPackagePath: handoff.path,
        now: new Date("2026-05-07T13:27:00.000Z"),
      });
      const policyCoverage =
        await writeHermesTaskFlowRegistryTaskDialoguerReasoningPolicyCoverageReportArtifact({
          repoRoot,
          taskDialoguerReasoningPolicyPath: policy.path,
          now: new Date("2026-05-07T13:28:00.000Z"),
        });
      const intakeValidator =
        await writeHermesTaskFlowRegistryControlledExecutorIntakeValidatorArtifact({
          repoRoot,
          taskDialoguerReasoningPolicyCoverageReportPath: policyCoverage.path,
          now: new Date("2026-05-07T13:29:00.000Z"),
        });
      const intakeCoverage =
        await writeHermesTaskFlowRegistryControlledExecutorIntakeCoverageReportArtifact({
          repoRoot,
          controlledExecutorIntakeValidatorPath: intakeValidator.path,
          now: new Date("2026-05-07T13:30:00.000Z"),
        });
      const intakeReleaseSummary =
        await writeHermesTaskFlowRegistryControlledExecutorIntakeReleaseSummaryReportArtifact({
          repoRoot,
          controlledExecutorIntakeCoverageReportPath: intakeCoverage.path,
          now: new Date("2026-05-07T13:31:00.000Z"),
        });
      const preflight =
        await writeHermesTaskFlowRegistryControlledExecutorApprovalPreflightReportArtifact({
          repoRoot,
          controlledExecutorIntakeReleaseSummaryReportPath: intakeReleaseSummary.path,
          now: new Date("2026-05-07T13:32:00.000Z"),
        });
      const preflightCoverage =
        await writeHermesTaskFlowRegistryControlledExecutorApprovalPreflightCoverageReportArtifact({
          repoRoot,
          controlledExecutorApprovalPreflightReportPath: preflight.path,
          now: new Date("2026-05-07T13:33:00.000Z"),
        });
      const finalLock =
        await writeHermesTaskFlowRegistryControlledExecutorFinalReadinessLockReportArtifact({
          repoRoot,
          controlledExecutorApprovalPreflightCoverageReportPath: preflightCoverage.path,
          now: new Date("2026-05-07T13:34:00.000Z"),
        });

      const coverage =
        await writeHermesTaskFlowRegistryControlledExecutorFinalReadinessLockCoverageReportArtifact(
          {
            repoRoot,
            controlledExecutorFinalReadinessLockReportPath: finalLock.path,
            now: new Date("2026-05-07T13:35:00.000Z"),
          },
        );
      const persisted = JSON.parse(await readFile(coverage.path, "utf8"));

      expect(coverage.report.schema).toBe(
        "openclaw.hermes.taskflow_registry_controlled_executor_final_readiness_lock_coverage_report.v1",
      );
      expect(coverage.report.status).toBe("coverage_pass");
      expect(coverage.report.operation).toBe("create");
      expect(coverage.report.validation_status).toBe("pass");
      expect(coverage.report.failures).toEqual([]);
      expect(coverage.report.coverage.final_readiness_lock_green).toBe(true);
      expect(coverage.report.coverage.approval_preflight_coverage_green).toBe(true);
      expect(coverage.report.coverage.approval_preflight_green).toBe(true);
      expect(coverage.report.coverage.intake_release_summary_green).toBe(true);
      expect(coverage.report.coverage.intake_coverage_green).toBe(true);
      expect(coverage.report.coverage.intake_preconditions_still_complete).toBe(true);
      expect(coverage.report.coverage.intake_boundary_still_locked).toBe(true);
      expect(coverage.report.coverage.operator_approval_still_false).toBe(true);
      expect(coverage.report.coverage.execution_started_still_false).toBe(true);
      expect(coverage.report.coverage.all_writes_disabled).toBe(true);
      expect(coverage.report.coverage.model_invocation_disabled).toBe(true);
      expect(coverage.report.coverage.coverage_ratio).toBe(1);
      expect(coverage.report.operator_approved).toBe(false);
      expect(coverage.report.registry_write_allowed).toBe(false);
      expect(coverage.report.taskflow_registry_write).toBe(false);
      expect(coverage.report.sqlite_write).toBe(false);
      expect(coverage.report.worker_execution).toBe(false);
      expect(coverage.report.model_invoked).toBe(false);
      expect(persisted.status).toBe("coverage_pass");
    } finally {
      await rm(repoRoot, { recursive: true, force: true });
    }
  });

  it("blocks controlled executor final readiness lock coverage report when final lock report is invalid", async () => {
    const repoRoot = await mkdtemp(join(tmpdir(), "hermes-flow-"));
    try {
      const lockPath = join(repoRoot, "bad-controlled-executor-final-readiness-lock-report.json");
      await writeFile(lockPath, "{}\n", "utf8");

      const coverage =
        await writeHermesTaskFlowRegistryControlledExecutorFinalReadinessLockCoverageReportArtifact(
          {
            repoRoot,
            controlledExecutorFinalReadinessLockReportPath: lockPath,
          },
        );

      expect(coverage.report.status).toBe("blocked");
      expect(coverage.report.operation).toBe("blocked");
      expect(coverage.report.validation_status).toBe("fail");
      expect(coverage.report.coverage.final_readiness_lock_green).toBe(false);
      expect(coverage.report.coverage.approval_preflight_coverage_green).toBe(false);
      expect(coverage.report.coverage.approval_preflight_green).toBe(false);
      expect(coverage.report.coverage.intake_release_summary_green).toBe(false);
      expect(coverage.report.coverage.intake_coverage_green).toBe(false);
      expect(coverage.report.coverage.intake_preconditions_still_complete).toBe(false);
      expect(coverage.report.coverage.intake_boundary_still_locked).toBe(false);
      expect(coverage.report.coverage.operator_approval_still_false).toBe(false);
      expect(coverage.report.coverage.execution_started_still_false).toBe(false);
      expect(coverage.report.coverage.all_writes_disabled).toBe(false);
      expect(coverage.report.coverage.model_invocation_disabled).toBe(false);
      expect(coverage.report.operator_approved).toBe(false);
      expect(coverage.report.registry_write_allowed).toBe(false);
      expect(coverage.report.taskflow_registry_write).toBe(false);
      expect(coverage.report.sqlite_write).toBe(false);
      expect(coverage.report.worker_execution).toBe(false);
      expect(coverage.report.model_invoked).toBe(false);
      expect(coverage.report.failures).toContain(
        "schema must equal openclaw.hermes.taskflow_registry_controlled_executor_final_readiness_lock_report.v1",
      );
    } finally {
      await rm(repoRoot, { recursive: true, force: true });
    }
  });

  it("writes a read-only controlled executor activation release checklist report", async () => {
    const repoRoot = await mkdtemp(join(tmpdir(), "hermes-flow-"));
    try {
      const proposerCoverage = await buildNextSafeTaskProposerFixtureCoverageReport(repoRoot);
      const fixture = await writeHermesTaskFlowRegistryTaskDialoguerFixtureArtifact({
        repoRoot,
        nextSafeTaskProposerFixtureCoverageReportPath: proposerCoverage.path,
        now: new Date("2026-05-07T13:36:00.000Z"),
      });
      const fixtureCoverage =
        await writeHermesTaskFlowRegistryTaskDialoguerFixtureCoverageReportArtifact({
          repoRoot,
          taskDialoguerFixturePath: fixture.path,
          now: new Date("2026-05-07T13:37:00.000Z"),
        });
      const handoff = await writeHermesTaskFlowRegistryTaskDialoguerHandoffPackageArtifact({
        repoRoot,
        taskDialoguerFixtureCoverageReportPath: fixtureCoverage.path,
        now: new Date("2026-05-07T13:38:00.000Z"),
      });
      const policy = await writeHermesTaskFlowRegistryTaskDialoguerReasoningPolicyArtifact({
        repoRoot,
        taskDialoguerHandoffPackagePath: handoff.path,
        now: new Date("2026-05-07T13:39:00.000Z"),
      });
      const policyCoverage =
        await writeHermesTaskFlowRegistryTaskDialoguerReasoningPolicyCoverageReportArtifact({
          repoRoot,
          taskDialoguerReasoningPolicyPath: policy.path,
          now: new Date("2026-05-07T13:40:00.000Z"),
        });
      const intakeValidator =
        await writeHermesTaskFlowRegistryControlledExecutorIntakeValidatorArtifact({
          repoRoot,
          taskDialoguerReasoningPolicyCoverageReportPath: policyCoverage.path,
          now: new Date("2026-05-07T13:41:00.000Z"),
        });
      const intakeCoverage =
        await writeHermesTaskFlowRegistryControlledExecutorIntakeCoverageReportArtifact({
          repoRoot,
          controlledExecutorIntakeValidatorPath: intakeValidator.path,
          now: new Date("2026-05-07T13:42:00.000Z"),
        });
      const intakeReleaseSummary =
        await writeHermesTaskFlowRegistryControlledExecutorIntakeReleaseSummaryReportArtifact({
          repoRoot,
          controlledExecutorIntakeCoverageReportPath: intakeCoverage.path,
          now: new Date("2026-05-07T13:43:00.000Z"),
        });
      const preflight =
        await writeHermesTaskFlowRegistryControlledExecutorApprovalPreflightReportArtifact({
          repoRoot,
          controlledExecutorIntakeReleaseSummaryReportPath: intakeReleaseSummary.path,
          now: new Date("2026-05-07T13:44:00.000Z"),
        });
      const preflightCoverage =
        await writeHermesTaskFlowRegistryControlledExecutorApprovalPreflightCoverageReportArtifact({
          repoRoot,
          controlledExecutorApprovalPreflightReportPath: preflight.path,
          now: new Date("2026-05-07T13:45:00.000Z"),
        });
      const finalLock =
        await writeHermesTaskFlowRegistryControlledExecutorFinalReadinessLockReportArtifact({
          repoRoot,
          controlledExecutorApprovalPreflightCoverageReportPath: preflightCoverage.path,
          now: new Date("2026-05-07T13:46:00.000Z"),
        });
      const finalLockCoverage =
        await writeHermesTaskFlowRegistryControlledExecutorFinalReadinessLockCoverageReportArtifact(
          {
            repoRoot,
            controlledExecutorFinalReadinessLockReportPath: finalLock.path,
            now: new Date("2026-05-07T13:47:00.000Z"),
          },
        );

      const checklist =
        await writeHermesTaskFlowRegistryControlledExecutorActivationReleaseChecklistReportArtifact(
          {
            repoRoot,
            controlledExecutorFinalReadinessLockCoverageReportPath: finalLockCoverage.path,
            now: new Date("2026-05-07T13:48:00.000Z"),
          },
        );
      const persisted = JSON.parse(await readFile(checklist.path, "utf8"));

      expect(checklist.report.schema).toBe(
        "openclaw.hermes.taskflow_registry_controlled_executor_activation_release_checklist_report.v1",
      );
      expect(checklist.report.status).toBe("checklist_pass");
      expect(checklist.report.operation).toBe("create");
      expect(checklist.report.validation_status).toBe("pass");
      expect(checklist.report.failures).toEqual([]);
      expect(checklist.report.checklist.final_readiness_lock_coverage_green).toBe(true);
      expect(checklist.report.checklist.final_readiness_lock_green).toBe(true);
      expect(checklist.report.checklist.approval_preflight_coverage_green).toBe(true);
      expect(checklist.report.checklist.approval_preflight_green).toBe(true);
      expect(checklist.report.checklist.intake_release_summary_green).toBe(true);
      expect(checklist.report.checklist.intake_coverage_green).toBe(true);
      expect(checklist.report.checklist.intake_preconditions_still_complete).toBe(true);
      expect(checklist.report.checklist.intake_boundary_still_locked).toBe(true);
      expect(checklist.report.checklist.operator_approval_still_false).toBe(true);
      expect(checklist.report.checklist.execution_started_still_false).toBe(true);
      expect(checklist.report.checklist.all_writes_disabled).toBe(true);
      expect(checklist.report.checklist.model_invocation_disabled).toBe(true);
      expect(checklist.report.checklist.release_checklist_ratio).toBe(1);
      expect(checklist.report.operator_approved).toBe(false);
      expect(checklist.report.real_writer_allowed).toBe(false);
      expect(checklist.report.registry_write_allowed).toBe(false);
      expect(checklist.report.taskflow_registry_write).toBe(false);
      expect(checklist.report.sqlite_write).toBe(false);
      expect(checklist.report.worker_execution).toBe(false);
      expect(checklist.report.model_invoked).toBe(false);
      expect(persisted.status).toBe("checklist_pass");
    } finally {
      await rm(repoRoot, { recursive: true, force: true });
    }
  });

  it("blocks controlled executor activation release checklist report when final lock coverage report is invalid", async () => {
    const repoRoot = await mkdtemp(join(tmpdir(), "hermes-flow-"));
    try {
      const coveragePath = join(
        repoRoot,
        "bad-controlled-executor-final-readiness-lock-coverage-report.json",
      );
      await writeFile(coveragePath, "{}\n", "utf8");

      const checklist =
        await writeHermesTaskFlowRegistryControlledExecutorActivationReleaseChecklistReportArtifact(
          {
            repoRoot,
            controlledExecutorFinalReadinessLockCoverageReportPath: coveragePath,
          },
        );

      expect(checklist.report.status).toBe("blocked");
      expect(checklist.report.operation).toBe("blocked");
      expect(checklist.report.validation_status).toBe("fail");
      expect(checklist.report.checklist.final_readiness_lock_coverage_green).toBe(false);
      expect(checklist.report.checklist.final_readiness_lock_green).toBe(false);
      expect(checklist.report.checklist.approval_preflight_coverage_green).toBe(false);
      expect(checklist.report.checklist.approval_preflight_green).toBe(false);
      expect(checklist.report.checklist.intake_release_summary_green).toBe(false);
      expect(checklist.report.checklist.intake_coverage_green).toBe(false);
      expect(checklist.report.checklist.intake_preconditions_still_complete).toBe(false);
      expect(checklist.report.checklist.intake_boundary_still_locked).toBe(false);
      expect(checklist.report.checklist.operator_approval_still_false).toBe(false);
      expect(checklist.report.checklist.execution_started_still_false).toBe(false);
      expect(checklist.report.checklist.all_writes_disabled).toBe(false);
      expect(checklist.report.checklist.model_invocation_disabled).toBe(false);
      expect(checklist.report.checklist.release_checklist_ratio).toBe(0);
      expect(checklist.report.operator_approved).toBe(false);
      expect(checklist.report.real_writer_allowed).toBe(false);
      expect(checklist.report.registry_write_allowed).toBe(false);
      expect(checklist.report.taskflow_registry_write).toBe(false);
      expect(checklist.report.sqlite_write).toBe(false);
      expect(checklist.report.worker_execution).toBe(false);
      expect(checklist.report.model_invoked).toBe(false);
      expect(checklist.report.failures).toContain(
        "schema must equal openclaw.hermes.taskflow_registry_controlled_executor_final_readiness_lock_coverage_report.v1",
      );
    } finally {
      await rm(repoRoot, { recursive: true, force: true });
    }
  });

  it("writes a read-only controlled executor activation release checklist coverage report", async () => {
    const repoRoot = await mkdtemp(join(tmpdir(), "hermes-flow-"));
    try {
      const coverage =
        await buildControlledExecutorActivationReleaseChecklistCoverageReport(repoRoot);
      const persisted = JSON.parse(await readFile(coverage.path, "utf8"));

      expect(coverage.report.schema).toBe(
        "openclaw.hermes.taskflow_registry_controlled_executor_activation_release_checklist_coverage_report.v1",
      );
      expect(coverage.report.status).toBe("coverage_pass");
      expect(coverage.report.operation).toBe("create");
      expect(coverage.report.validation_status).toBe("pass");
      expect(coverage.report.failures).toEqual([]);
      expect(coverage.report.coverage.release_checklist_green).toBe(true);
      expect(coverage.report.coverage.final_readiness_lock_coverage_green).toBe(true);
      expect(coverage.report.coverage.final_readiness_lock_green).toBe(true);
      expect(coverage.report.coverage.approval_preflight_coverage_green).toBe(true);
      expect(coverage.report.coverage.approval_preflight_green).toBe(true);
      expect(coverage.report.coverage.intake_release_summary_green).toBe(true);
      expect(coverage.report.coverage.intake_coverage_green).toBe(true);
      expect(coverage.report.coverage.intake_preconditions_still_complete).toBe(true);
      expect(coverage.report.coverage.intake_boundary_still_locked).toBe(true);
      expect(coverage.report.coverage.operator_approval_still_false).toBe(true);
      expect(coverage.report.coverage.execution_started_still_false).toBe(true);
      expect(coverage.report.coverage.all_writes_disabled).toBe(true);
      expect(coverage.report.coverage.model_invocation_disabled).toBe(true);
      expect(coverage.report.coverage.coverage_ratio).toBe(1);
      expect(coverage.report.operator_approved).toBe(false);
      expect(coverage.report.real_writer_allowed).toBe(false);
      expect(coverage.report.registry_write_allowed).toBe(false);
      expect(coverage.report.taskflow_registry_write).toBe(false);
      expect(coverage.report.sqlite_write).toBe(false);
      expect(coverage.report.worker_execution).toBe(false);
      expect(coverage.report.model_invoked).toBe(false);
      expect(persisted.status).toBe("coverage_pass");
    } finally {
      await rm(repoRoot, { recursive: true, force: true });
    }
  });

  it("blocks controlled executor activation release checklist coverage report when checklist report is invalid", async () => {
    const repoRoot = await mkdtemp(join(tmpdir(), "hermes-flow-"));
    try {
      const checklistPath = join(
        repoRoot,
        "bad-controlled-executor-activation-release-checklist-report.json",
      );
      await writeFile(checklistPath, "{}\n", "utf8");

      const coverage =
        await writeHermesTaskFlowRegistryControlledExecutorActivationReleaseChecklistCoverageReportArtifact(
          {
            repoRoot,
            controlledExecutorActivationReleaseChecklistReportPath: checklistPath,
          },
        );

      expect(coverage.report.status).toBe("blocked");
      expect(coverage.report.operation).toBe("blocked");
      expect(coverage.report.validation_status).toBe("fail");
      expect(coverage.report.coverage.release_checklist_green).toBe(false);
      expect(coverage.report.coverage.final_readiness_lock_coverage_green).toBe(false);
      expect(coverage.report.coverage.final_readiness_lock_green).toBe(false);
      expect(coverage.report.coverage.approval_preflight_coverage_green).toBe(false);
      expect(coverage.report.coverage.approval_preflight_green).toBe(false);
      expect(coverage.report.coverage.intake_release_summary_green).toBe(false);
      expect(coverage.report.coverage.intake_coverage_green).toBe(false);
      expect(coverage.report.coverage.intake_preconditions_still_complete).toBe(false);
      expect(coverage.report.coverage.intake_boundary_still_locked).toBe(false);
      expect(coverage.report.coverage.operator_approval_still_false).toBe(false);
      expect(coverage.report.coverage.execution_started_still_false).toBe(false);
      expect(coverage.report.coverage.all_writes_disabled).toBe(false);
      expect(coverage.report.coverage.model_invocation_disabled).toBe(false);
      expect(coverage.report.coverage.coverage_ratio).toBe(0);
      expect(coverage.report.operator_approved).toBe(false);
      expect(coverage.report.real_writer_allowed).toBe(false);
      expect(coverage.report.registry_write_allowed).toBe(false);
      expect(coverage.report.taskflow_registry_write).toBe(false);
      expect(coverage.report.sqlite_write).toBe(false);
      expect(coverage.report.worker_execution).toBe(false);
      expect(coverage.report.model_invoked).toBe(false);
      expect(coverage.report.failures).toContain(
        "schema must equal openclaw.hermes.taskflow_registry_controlled_executor_activation_release_checklist_report.v1",
      );
    } finally {
      await rm(repoRoot, { recursive: true, force: true });
    }
  });

  it("writes a read-only controlled executor activation operator handoff packet report", async () => {
    const repoRoot = await mkdtemp(join(tmpdir(), "hermes-flow-"));
    try {
      const handoff = await buildControlledExecutorActivationOperatorHandoffPacketReport(repoRoot);
      const persisted = JSON.parse(await readFile(handoff.path, "utf8"));

      expect(handoff.report.schema).toBe(
        "openclaw.hermes.taskflow_registry_controlled_executor_activation_operator_handoff_packet_report.v1",
      );
      expect(handoff.report.status).toBe("handoff_ready");
      expect(handoff.report.operation).toBe("create");
      expect(handoff.report.validation_status).toBe("pass");
      expect(handoff.report.failures).toEqual([]);
      expect(handoff.report.operator_handoff.release_checklist_coverage_green).toBe(true);
      expect(handoff.report.operator_handoff.release_checklist_green).toBe(true);
      expect(handoff.report.operator_handoff.final_readiness_lock_coverage_green).toBe(true);
      expect(handoff.report.operator_handoff.final_readiness_lock_green).toBe(true);
      expect(handoff.report.operator_handoff.approval_preflight_coverage_green).toBe(true);
      expect(handoff.report.operator_handoff.approval_preflight_green).toBe(true);
      expect(handoff.report.operator_handoff.intake_release_summary_green).toBe(true);
      expect(handoff.report.operator_handoff.intake_coverage_green).toBe(true);
      expect(handoff.report.operator_handoff.intake_preconditions_still_complete).toBe(true);
      expect(handoff.report.operator_handoff.intake_boundary_still_locked).toBe(true);
      expect(handoff.report.operator_handoff.operator_approval_still_false).toBe(true);
      expect(handoff.report.operator_handoff.execution_started_still_false).toBe(true);
      expect(handoff.report.operator_handoff.all_writes_disabled).toBe(true);
      expect(handoff.report.operator_handoff.model_invocation_disabled).toBe(true);
      expect(handoff.report.operator_handoff.handoff_packet_ratio).toBe(1);
      expect(handoff.report.operator_approved).toBe(false);
      expect(handoff.report.real_writer_allowed).toBe(false);
      expect(handoff.report.registry_write_allowed).toBe(false);
      expect(handoff.report.taskflow_registry_write).toBe(false);
      expect(handoff.report.sqlite_write).toBe(false);
      expect(handoff.report.worker_execution).toBe(false);
      expect(handoff.report.model_invoked).toBe(false);
      expect(handoff.report.next_safe_task).toContain("operator handoff packet coverage report");
      expect(persisted.status).toBe("handoff_ready");
    } finally {
      await rm(repoRoot, { recursive: true, force: true });
    }
  });

  it("blocks controlled executor activation operator handoff packet report when checklist coverage report is invalid", async () => {
    const repoRoot = await mkdtemp(join(tmpdir(), "hermes-flow-"));
    try {
      const coveragePath = join(
        repoRoot,
        "bad-controlled-executor-activation-release-checklist-coverage-report.json",
      );
      await writeFile(coveragePath, "{}\n", "utf8");

      const handoff =
        await writeHermesTaskFlowRegistryControlledExecutorActivationOperatorHandoffPacketReportArtifact(
          {
            repoRoot,
            controlledExecutorActivationReleaseChecklistCoverageReportPath: coveragePath,
          },
        );

      expect(handoff.report.status).toBe("blocked");
      expect(handoff.report.operation).toBe("blocked");
      expect(handoff.report.validation_status).toBe("fail");
      expect(handoff.report.operator_handoff.release_checklist_coverage_green).toBe(false);
      expect(handoff.report.operator_handoff.release_checklist_green).toBe(false);
      expect(handoff.report.operator_handoff.final_readiness_lock_coverage_green).toBe(false);
      expect(handoff.report.operator_handoff.final_readiness_lock_green).toBe(false);
      expect(handoff.report.operator_handoff.approval_preflight_coverage_green).toBe(false);
      expect(handoff.report.operator_handoff.approval_preflight_green).toBe(false);
      expect(handoff.report.operator_handoff.intake_release_summary_green).toBe(false);
      expect(handoff.report.operator_handoff.intake_coverage_green).toBe(false);
      expect(handoff.report.operator_handoff.intake_preconditions_still_complete).toBe(false);
      expect(handoff.report.operator_handoff.intake_boundary_still_locked).toBe(false);
      expect(handoff.report.operator_handoff.operator_approval_still_false).toBe(false);
      expect(handoff.report.operator_handoff.execution_started_still_false).toBe(false);
      expect(handoff.report.operator_handoff.all_writes_disabled).toBe(false);
      expect(handoff.report.operator_handoff.model_invocation_disabled).toBe(false);
      expect(handoff.report.operator_handoff.handoff_packet_ratio).toBe(0);
      expect(handoff.report.operator_approved).toBe(false);
      expect(handoff.report.real_writer_allowed).toBe(false);
      expect(handoff.report.registry_write_allowed).toBe(false);
      expect(handoff.report.taskflow_registry_write).toBe(false);
      expect(handoff.report.sqlite_write).toBe(false);
      expect(handoff.report.worker_execution).toBe(false);
      expect(handoff.report.model_invoked).toBe(false);
      expect(handoff.report.failures).toContain(
        "schema must equal openclaw.hermes.taskflow_registry_controlled_executor_activation_release_checklist_coverage_report.v1",
      );
    } finally {
      await rm(repoRoot, { recursive: true, force: true });
    }
  });

  it("writes a read-only controlled executor activation operator handoff packet coverage report", async () => {
    const repoRoot = await mkdtemp(join(tmpdir(), "hermes-flow-"));
    try {
      const coverage =
        await buildControlledExecutorActivationOperatorHandoffPacketCoverageReport(repoRoot);
      const persisted = JSON.parse(await readFile(coverage.path, "utf8"));

      expect(coverage.report.schema).toBe(
        "openclaw.hermes.taskflow_registry_controlled_executor_activation_operator_handoff_packet_coverage_report.v1",
      );
      expect(coverage.report.status).toBe("coverage_pass");
      expect(coverage.report.operation).toBe("create");
      expect(coverage.report.validation_status).toBe("pass");
      expect(coverage.report.failures).toEqual([]);
      expect(coverage.report.coverage.handoff_packet_ready).toBe(true);
      expect(coverage.report.coverage.release_checklist_coverage_green).toBe(true);
      expect(coverage.report.coverage.release_checklist_green).toBe(true);
      expect(coverage.report.coverage.final_readiness_lock_coverage_green).toBe(true);
      expect(coverage.report.coverage.final_readiness_lock_green).toBe(true);
      expect(coverage.report.coverage.approval_preflight_coverage_green).toBe(true);
      expect(coverage.report.coverage.approval_preflight_green).toBe(true);
      expect(coverage.report.coverage.intake_release_summary_green).toBe(true);
      expect(coverage.report.coverage.intake_coverage_green).toBe(true);
      expect(coverage.report.coverage.intake_preconditions_still_complete).toBe(true);
      expect(coverage.report.coverage.intake_boundary_still_locked).toBe(true);
      expect(coverage.report.coverage.operator_approval_still_false).toBe(true);
      expect(coverage.report.coverage.execution_started_still_false).toBe(true);
      expect(coverage.report.coverage.all_writes_disabled).toBe(true);
      expect(coverage.report.coverage.model_invocation_disabled).toBe(true);
      expect(coverage.report.coverage.coverage_ratio).toBe(1);
      expect(coverage.report.operator_approved).toBe(false);
      expect(coverage.report.real_writer_allowed).toBe(false);
      expect(coverage.report.registry_write_allowed).toBe(false);
      expect(coverage.report.taskflow_registry_write).toBe(false);
      expect(coverage.report.sqlite_write).toBe(false);
      expect(coverage.report.worker_execution).toBe(false);
      expect(coverage.report.model_invoked).toBe(false);
      expect(coverage.report.next_safe_task).toContain("activation final safety summary report");
      expect(persisted.status).toBe("coverage_pass");
    } finally {
      await rm(repoRoot, { recursive: true, force: true });
    }
  });

  it("blocks controlled executor activation operator handoff packet coverage report when handoff packet report is invalid", async () => {
    const repoRoot = await mkdtemp(join(tmpdir(), "hermes-flow-"));
    try {
      const handoffPath = join(
        repoRoot,
        "bad-controlled-executor-activation-operator-handoff-packet-report.json",
      );
      await writeFile(handoffPath, "{}\n", "utf8");

      const coverage =
        await writeHermesTaskFlowRegistryControlledExecutorActivationOperatorHandoffPacketCoverageReportArtifact(
          {
            repoRoot,
            controlledExecutorActivationOperatorHandoffPacketReportPath: handoffPath,
          },
        );

      expect(coverage.report.status).toBe("blocked");
      expect(coverage.report.operation).toBe("blocked");
      expect(coverage.report.validation_status).toBe("fail");
      expect(coverage.report.coverage.handoff_packet_ready).toBe(false);
      expect(coverage.report.coverage.release_checklist_coverage_green).toBe(false);
      expect(coverage.report.coverage.release_checklist_green).toBe(false);
      expect(coverage.report.coverage.final_readiness_lock_coverage_green).toBe(false);
      expect(coverage.report.coverage.final_readiness_lock_green).toBe(false);
      expect(coverage.report.coverage.approval_preflight_coverage_green).toBe(false);
      expect(coverage.report.coverage.approval_preflight_green).toBe(false);
      expect(coverage.report.coverage.intake_release_summary_green).toBe(false);
      expect(coverage.report.coverage.intake_coverage_green).toBe(false);
      expect(coverage.report.coverage.intake_preconditions_still_complete).toBe(false);
      expect(coverage.report.coverage.intake_boundary_still_locked).toBe(false);
      expect(coverage.report.coverage.operator_approval_still_false).toBe(false);
      expect(coverage.report.coverage.execution_started_still_false).toBe(false);
      expect(coverage.report.coverage.all_writes_disabled).toBe(false);
      expect(coverage.report.coverage.model_invocation_disabled).toBe(false);
      expect(coverage.report.coverage.coverage_ratio).toBe(0);
      expect(coverage.report.operator_approved).toBe(false);
      expect(coverage.report.real_writer_allowed).toBe(false);
      expect(coverage.report.registry_write_allowed).toBe(false);
      expect(coverage.report.taskflow_registry_write).toBe(false);
      expect(coverage.report.sqlite_write).toBe(false);
      expect(coverage.report.worker_execution).toBe(false);
      expect(coverage.report.model_invoked).toBe(false);
      expect(coverage.report.failures).toContain(
        "schema must equal openclaw.hermes.taskflow_registry_controlled_executor_activation_operator_handoff_packet_report.v1",
      );
    } finally {
      await rm(repoRoot, { recursive: true, force: true });
    }
  });

  it("writes a read-only controlled executor activation final safety summary report", async () => {
    const repoRoot = await mkdtemp(join(tmpdir(), "hermes-flow-"));
    try {
      const summary = await buildControlledExecutorActivationFinalSafetySummaryReport(repoRoot);
      const persisted = JSON.parse(await readFile(summary.path, "utf8"));

      expect(summary.summary.schema).toBe(
        "openclaw.hermes.taskflow_registry_controlled_executor_activation_final_safety_summary_report.v1",
      );
      expect(summary.summary.status).toBe("summary_ready");
      expect(summary.summary.operation).toBe("create");
      expect(summary.summary.validation_status).toBe("pass");
      expect(summary.summary.failures).toEqual([]);
      expect(summary.summary.summary.operator_handoff_packet_coverage_green).toBe(true);
      expect(summary.summary.summary.activation_operator_handoff_packet_ready).toBe(true);
      expect(summary.summary.summary.activation_release_checklist_coverage_green).toBe(true);
      expect(summary.summary.summary.activation_release_checklist_green).toBe(true);
      expect(summary.summary.summary.final_readiness_lock_coverage_green).toBe(true);
      expect(summary.summary.summary.final_readiness_lock_green).toBe(true);
      expect(summary.summary.summary.approval_preflight_coverage_green).toBe(true);
      expect(summary.summary.summary.approval_preflight_green).toBe(true);
      expect(summary.summary.summary.intake_release_summary_green).toBe(true);
      expect(summary.summary.summary.intake_coverage_green).toBe(true);
      expect(summary.summary.summary.intake_preconditions_still_complete).toBe(true);
      expect(summary.summary.summary.intake_boundary_still_locked).toBe(true);
      expect(summary.summary.summary.operator_approval_still_false).toBe(true);
      expect(summary.summary.summary.execution_started_still_false).toBe(true);
      expect(summary.summary.summary.all_writes_disabled).toBe(true);
      expect(summary.summary.summary.model_invocation_disabled).toBe(true);
      expect(summary.summary.summary.final_safety_ratio).toBe(1);
      expect(summary.summary.operator_approved).toBe(false);
      expect(summary.summary.real_writer_allowed).toBe(false);
      expect(summary.summary.registry_write_allowed).toBe(false);
      expect(summary.summary.taskflow_registry_write).toBe(false);
      expect(summary.summary.sqlite_write).toBe(false);
      expect(summary.summary.worker_execution).toBe(false);
      expect(summary.summary.model_invoked).toBe(false);
      expect(summary.summary.next_safe_task).toContain("final safety summary coverage report");
      expect(persisted.status).toBe("summary_ready");
    } finally {
      await rm(repoRoot, { recursive: true, force: true });
    }
  });

  it("blocks controlled executor activation final safety summary report when handoff packet coverage report is invalid", async () => {
    const repoRoot = await mkdtemp(join(tmpdir(), "hermes-flow-"));
    try {
      const coveragePath = join(
        repoRoot,
        "bad-controlled-executor-activation-operator-handoff-packet-coverage-report.json",
      );
      await writeFile(coveragePath, "{}\n", "utf8");

      const summary =
        await writeHermesTaskFlowRegistryControlledExecutorActivationFinalSafetySummaryReportArtifact(
          {
            repoRoot,
            controlledExecutorActivationOperatorHandoffPacketCoverageReportPath: coveragePath,
          },
        );

      expect(summary.summary.status).toBe("blocked");
      expect(summary.summary.operation).toBe("blocked");
      expect(summary.summary.validation_status).toBe("fail");
      expect(summary.summary.summary.operator_handoff_packet_coverage_green).toBe(false);
      expect(summary.summary.summary.activation_operator_handoff_packet_ready).toBe(false);
      expect(summary.summary.summary.activation_release_checklist_coverage_green).toBe(false);
      expect(summary.summary.summary.activation_release_checklist_green).toBe(false);
      expect(summary.summary.summary.final_readiness_lock_coverage_green).toBe(false);
      expect(summary.summary.summary.final_readiness_lock_green).toBe(false);
      expect(summary.summary.summary.approval_preflight_coverage_green).toBe(false);
      expect(summary.summary.summary.approval_preflight_green).toBe(false);
      expect(summary.summary.summary.intake_release_summary_green).toBe(false);
      expect(summary.summary.summary.intake_coverage_green).toBe(false);
      expect(summary.summary.summary.intake_preconditions_still_complete).toBe(false);
      expect(summary.summary.summary.intake_boundary_still_locked).toBe(false);
      expect(summary.summary.summary.operator_approval_still_false).toBe(false);
      expect(summary.summary.summary.execution_started_still_false).toBe(false);
      expect(summary.summary.summary.all_writes_disabled).toBe(false);
      expect(summary.summary.summary.model_invocation_disabled).toBe(false);
      expect(summary.summary.summary.final_safety_ratio).toBe(0);
      expect(summary.summary.operator_approved).toBe(false);
      expect(summary.summary.real_writer_allowed).toBe(false);
      expect(summary.summary.registry_write_allowed).toBe(false);
      expect(summary.summary.taskflow_registry_write).toBe(false);
      expect(summary.summary.sqlite_write).toBe(false);
      expect(summary.summary.worker_execution).toBe(false);
      expect(summary.summary.model_invoked).toBe(false);
      expect(summary.summary.failures).toContain(
        "schema must equal openclaw.hermes.taskflow_registry_controlled_executor_activation_operator_handoff_packet_coverage_report.v1",
      );
    } finally {
      await rm(repoRoot, { recursive: true, force: true });
    }
  });

  it("writes a read-only controlled executor activation final safety summary coverage report", async () => {
    const repoRoot = await mkdtemp(join(tmpdir(), "hermes-flow-"));
    try {
      const coverage =
        await buildControlledExecutorActivationFinalSafetySummaryCoverageReport(repoRoot);
      const persisted = JSON.parse(await readFile(coverage.path, "utf8"));

      expect(coverage.report.schema).toBe(
        "openclaw.hermes.taskflow_registry_controlled_executor_activation_final_safety_summary_coverage_report.v1",
      );
      expect(coverage.report.status).toBe("coverage_pass");
      expect(coverage.report.operation).toBe("create");
      expect(coverage.report.validation_status).toBe("pass");
      expect(coverage.report.failures).toEqual([]);
      expect(coverage.report.coverage.final_safety_summary_ready).toBe(true);
      expect(coverage.report.coverage.operator_handoff_packet_coverage_green).toBe(true);
      expect(coverage.report.coverage.activation_operator_handoff_packet_ready).toBe(true);
      expect(coverage.report.coverage.activation_release_checklist_coverage_green).toBe(true);
      expect(coverage.report.coverage.activation_release_checklist_green).toBe(true);
      expect(coverage.report.coverage.final_readiness_lock_coverage_green).toBe(true);
      expect(coverage.report.coverage.final_readiness_lock_green).toBe(true);
      expect(coverage.report.coverage.approval_preflight_coverage_green).toBe(true);
      expect(coverage.report.coverage.approval_preflight_green).toBe(true);
      expect(coverage.report.coverage.intake_release_summary_green).toBe(true);
      expect(coverage.report.coverage.intake_coverage_green).toBe(true);
      expect(coverage.report.coverage.intake_preconditions_still_complete).toBe(true);
      expect(coverage.report.coverage.intake_boundary_still_locked).toBe(true);
      expect(coverage.report.coverage.operator_approval_still_false).toBe(true);
      expect(coverage.report.coverage.execution_started_still_false).toBe(true);
      expect(coverage.report.coverage.all_writes_disabled).toBe(true);
      expect(coverage.report.coverage.model_invocation_disabled).toBe(true);
      expect(coverage.report.coverage.coverage_ratio).toBe(1);
      expect(coverage.report.operator_approved).toBe(false);
      expect(coverage.report.real_writer_allowed).toBe(false);
      expect(coverage.report.registry_write_allowed).toBe(false);
      expect(coverage.report.taskflow_registry_write).toBe(false);
      expect(coverage.report.sqlite_write).toBe(false);
      expect(coverage.report.worker_execution).toBe(false);
      expect(coverage.report.model_invoked).toBe(false);
      expect(coverage.report.next_safe_task).toContain("next-safe-task decision report");
      expect(persisted.status).toBe("coverage_pass");
    } finally {
      await rm(repoRoot, { recursive: true, force: true });
    }
  });

  it("blocks controlled executor activation final safety summary coverage report when summary is invalid", async () => {
    const repoRoot = await mkdtemp(join(tmpdir(), "hermes-flow-"));
    try {
      const summaryPath = join(
        repoRoot,
        "bad-controlled-executor-activation-final-safety-summary-report.json",
      );
      await writeFile(summaryPath, "{}\n", "utf8");

      const coverage =
        await writeHermesTaskFlowRegistryControlledExecutorActivationFinalSafetySummaryCoverageReportArtifact(
          {
            repoRoot,
            controlledExecutorActivationFinalSafetySummaryReportPath: summaryPath,
          },
        );

      expect(coverage.report.status).toBe("blocked");
      expect(coverage.report.operation).toBe("blocked");
      expect(coverage.report.validation_status).toBe("fail");
      expect(coverage.report.coverage.final_safety_summary_ready).toBe(false);
      expect(coverage.report.coverage.operator_handoff_packet_coverage_green).toBe(false);
      expect(coverage.report.coverage.activation_operator_handoff_packet_ready).toBe(false);
      expect(coverage.report.coverage.activation_release_checklist_coverage_green).toBe(false);
      expect(coverage.report.coverage.activation_release_checklist_green).toBe(false);
      expect(coverage.report.coverage.final_readiness_lock_coverage_green).toBe(false);
      expect(coverage.report.coverage.final_readiness_lock_green).toBe(false);
      expect(coverage.report.coverage.approval_preflight_coverage_green).toBe(false);
      expect(coverage.report.coverage.approval_preflight_green).toBe(false);
      expect(coverage.report.coverage.intake_release_summary_green).toBe(false);
      expect(coverage.report.coverage.intake_coverage_green).toBe(false);
      expect(coverage.report.coverage.intake_preconditions_still_complete).toBe(false);
      expect(coverage.report.coverage.intake_boundary_still_locked).toBe(false);
      expect(coverage.report.coverage.operator_approval_still_false).toBe(false);
      expect(coverage.report.coverage.execution_started_still_false).toBe(false);
      expect(coverage.report.coverage.all_writes_disabled).toBe(false);
      expect(coverage.report.coverage.model_invocation_disabled).toBe(false);
      expect(coverage.report.coverage.coverage_ratio).toBe(0);
      expect(coverage.report.operator_approved).toBe(false);
      expect(coverage.report.real_writer_allowed).toBe(false);
      expect(coverage.report.registry_write_allowed).toBe(false);
      expect(coverage.report.taskflow_registry_write).toBe(false);
      expect(coverage.report.sqlite_write).toBe(false);
      expect(coverage.report.worker_execution).toBe(false);
      expect(coverage.report.model_invoked).toBe(false);
      expect(coverage.report.failures).toContain(
        "schema must equal openclaw.hermes.taskflow_registry_controlled_executor_activation_final_safety_summary_report.v1",
      );
    } finally {
      await rm(repoRoot, { recursive: true, force: true });
    }
  });

  it("writes a read-only controlled executor activation next-safe-task decision report", async () => {
    const repoRoot = await mkdtemp(join(tmpdir(), "hermes-flow-"));
    try {
      const decision = await buildControlledExecutorActivationNextSafeTaskDecisionReport(repoRoot);
      const persisted = JSON.parse(await readFile(decision.path, "utf8"));

      expect(decision.report.schema).toBe(
        "openclaw.hermes.taskflow_registry_controlled_executor_activation_next_safe_task_decision_report.v1",
      );
      expect(decision.report.status).toBe("decision_ready");
      expect(decision.report.operation).toBe("create");
      expect(decision.report.validation_status).toBe("pass");
      expect(decision.report.failures).toEqual([]);
      expect(decision.report.decision.recommended_next_task).toContain(
        "execution manifest proposal",
      );
      expect(decision.report.decision.reason).toContain("safest extension");
      expect(decision.report.decision.risk_level).toBe("low");
      expect(decision.report.decision.prerequisites.length).toBeGreaterThan(0);
      expect(decision.report.decision.operator_approval_still_false).toBe(true);
      expect(decision.report.decision.execution_started_still_false).toBe(true);
      expect(decision.report.decision.all_writes_disabled).toBe(true);
      expect(decision.report.decision.model_invocation_disabled).toBe(true);
      expect(decision.report.decision.decision_ratio).toBe(1);
      expect(decision.report.operator_approved).toBe(false);
      expect(decision.report.real_writer_allowed).toBe(false);
      expect(decision.report.registry_write_allowed).toBe(false);
      expect(decision.report.taskflow_registry_write).toBe(false);
      expect(decision.report.sqlite_write).toBe(false);
      expect(decision.report.worker_execution).toBe(false);
      expect(decision.report.model_invoked).toBe(false);
      expect(decision.report.next_safe_task).toContain("execution-manifest proposal report");
      expect(persisted.status).toBe("decision_ready");
    } finally {
      await rm(repoRoot, { recursive: true, force: true });
    }
  });

  it("blocks controlled executor activation next-safe-task decision report when coverage is invalid", async () => {
    const repoRoot = await mkdtemp(join(tmpdir(), "hermes-flow-"));
    try {
      const coveragePath = join(
        repoRoot,
        "bad-controlled-executor-activation-final-safety-summary-coverage-report.json",
      );
      await writeFile(coveragePath, "{}\n", "utf8");

      const decision =
        await writeHermesTaskFlowRegistryControlledExecutorActivationNextSafeTaskDecisionReportArtifact(
          {
            repoRoot,
            controlledExecutorActivationFinalSafetySummaryCoverageReportPath: coveragePath,
          },
        );

      expect(decision.report.status).toBe("blocked");
      expect(decision.report.operation).toBe("blocked");
      expect(decision.report.validation_status).toBe("fail");
      expect(decision.report.decision.operator_approval_still_false).toBe(false);
      expect(decision.report.decision.execution_started_still_false).toBe(false);
      expect(decision.report.decision.all_writes_disabled).toBe(false);
      expect(decision.report.decision.model_invocation_disabled).toBe(false);
      expect(decision.report.decision.decision_ratio).toBe(0);
      expect(decision.report.operator_approved).toBe(false);
      expect(decision.report.real_writer_allowed).toBe(false);
      expect(decision.report.registry_write_allowed).toBe(false);
      expect(decision.report.taskflow_registry_write).toBe(false);
      expect(decision.report.sqlite_write).toBe(false);
      expect(decision.report.worker_execution).toBe(false);
      expect(decision.report.model_invoked).toBe(false);
      expect(decision.report.failures).toContain(
        "schema must equal openclaw.hermes.taskflow_registry_controlled_executor_activation_final_safety_summary_coverage_report.v1",
      );
    } finally {
      await rm(repoRoot, { recursive: true, force: true });
    }
  });

  it("writes a read-only controlled executor activation execution-manifest proposal report", async () => {
    const repoRoot = await mkdtemp(join(tmpdir(), "hermes-flow-"));
    try {
      const proposal =
        await buildControlledExecutorActivationExecutionManifestProposalReport(repoRoot);
      const persisted = JSON.parse(await readFile(proposal.path, "utf8"));

      expect(proposal.report.schema).toBe(
        "openclaw.hermes.taskflow_registry_controlled_executor_activation_execution_manifest_proposal_report.v1",
      );
      expect(proposal.report.status).toBe("proposal_ready");
      expect(proposal.report.operation).toBe("create");
      expect(proposal.report.validation_status).toBe("pass");
      expect(proposal.report.failures).toEqual([]);
      expect(proposal.report.manifest.approval_required).toBe(true);
      expect(proposal.report.manifest.execution_start_allowed).toBe(false);
      expect(proposal.report.manifest.required_validation.length).toBeGreaterThan(0);
      expect(proposal.report.manifest.registry_write_disabled).toBe(true);
      expect(proposal.report.manifest.sqlite_write_disabled).toBe(true);
      expect(proposal.report.manifest.worker_execution_disabled).toBe(true);
      expect(proposal.report.manifest.model_invocation_disabled).toBe(true);
      expect(proposal.report.manifest.proposal_ratio).toBe(1);
      expect(proposal.report.operator_approved).toBe(false);
      expect(proposal.report.execution_started).toBe(false);
      expect(proposal.report.real_writer_allowed).toBe(false);
      expect(proposal.report.registry_write_allowed).toBe(false);
      expect(proposal.report.taskflow_registry_write).toBe(false);
      expect(proposal.report.sqlite_write).toBe(false);
      expect(proposal.report.worker_execution).toBe(false);
      expect(proposal.report.model_invoked).toBe(false);
      expect(proposal.report.next_safe_task).toContain("proposal coverage report");
      expect(persisted.status).toBe("proposal_ready");
    } finally {
      await rm(repoRoot, { recursive: true, force: true });
    }
  });

  it("blocks controlled executor activation execution-manifest proposal when decision report is invalid", async () => {
    const repoRoot = await mkdtemp(join(tmpdir(), "hermes-flow-"));
    try {
      const decisionPath = join(
        repoRoot,
        "bad-controlled-executor-activation-next-safe-task-decision-report.json",
      );
      await writeFile(decisionPath, "{}\n", "utf8");

      const proposal =
        await writeHermesTaskFlowRegistryControlledExecutorActivationExecutionManifestProposalReportArtifact(
          {
            repoRoot,
            controlledExecutorActivationNextSafeTaskDecisionReportPath: decisionPath,
          },
        );

      expect(proposal.report.status).toBe("blocked");
      expect(proposal.report.operation).toBe("blocked");
      expect(proposal.report.validation_status).toBe("fail");
      expect(proposal.report.manifest.execution_start_allowed).toBe(false);
      expect(proposal.report.manifest.registry_write_disabled).toBe(false);
      expect(proposal.report.manifest.sqlite_write_disabled).toBe(false);
      expect(proposal.report.manifest.worker_execution_disabled).toBe(false);
      expect(proposal.report.manifest.model_invocation_disabled).toBe(false);
      expect(proposal.report.manifest.proposal_ratio).toBe(0);
      expect(proposal.report.operator_approved).toBe(false);
      expect(proposal.report.execution_started).toBe(false);
      expect(proposal.report.real_writer_allowed).toBe(false);
      expect(proposal.report.registry_write_allowed).toBe(false);
      expect(proposal.report.taskflow_registry_write).toBe(false);
      expect(proposal.report.sqlite_write).toBe(false);
      expect(proposal.report.worker_execution).toBe(false);
      expect(proposal.report.model_invoked).toBe(false);
      expect(proposal.report.failures).toContain(
        "schema must equal openclaw.hermes.taskflow_registry_controlled_executor_activation_next_safe_task_decision_report.v1",
      );
    } finally {
      await rm(repoRoot, { recursive: true, force: true });
    }
  });
  it("writes a read-only controlled executor activation execution-manifest proposal coverage report", async () => {
    const repoRoot = await mkdtemp(join(tmpdir(), "hermes-flow-"));
    try {
      const coverage =
        await buildControlledExecutorActivationExecutionManifestProposalCoverageReport(repoRoot);
      const persisted = JSON.parse(await readFile(coverage.path, "utf8"));

      expect(coverage.report.schema).toBe(
        "openclaw.hermes.taskflow_registry_controlled_executor_activation_execution_manifest_proposal_coverage_report.v1",
      );
      expect(coverage.report.status).toBe("coverage_pass");
      expect(coverage.report.operation).toBe("create");
      expect(coverage.report.validation_status).toBe("pass");
      expect(coverage.report.failures).toEqual([]);
      expect(coverage.report.coverage.required_fields_checked.length).toBeGreaterThan(0);
      expect(coverage.report.coverage.safety_flags_checked.length).toBeGreaterThan(0);
      expect(coverage.report.coverage.proposal_ready).toBe(true);
      expect(coverage.report.coverage.approval_required).toBe(true);
      expect(coverage.report.coverage.execution_start_allowed_false).toBe(true);
      expect(coverage.report.coverage.operator_approval_still_false).toBe(true);
      expect(coverage.report.coverage.execution_started_still_false).toBe(true);
      expect(coverage.report.coverage.rollback_precondition_present).toBe(true);
      expect(coverage.report.coverage.required_validation_complete).toBe(true);
      expect(coverage.report.coverage.registry_write_disabled).toBe(true);
      expect(coverage.report.coverage.sqlite_write_disabled).toBe(true);
      expect(coverage.report.coverage.worker_execution_disabled).toBe(true);
      expect(coverage.report.coverage.model_invocation_disabled).toBe(true);
      expect(coverage.report.coverage.coverage_ratio).toBe(1);
      expect(coverage.report.operator_approved).toBe(false);
      expect(coverage.report.execution_started).toBe(false);
      expect(coverage.report.real_writer_allowed).toBe(false);
      expect(coverage.report.registry_write_allowed).toBe(false);
      expect(coverage.report.taskflow_registry_write).toBe(false);
      expect(coverage.report.sqlite_write).toBe(false);
      expect(coverage.report.worker_execution).toBe(false);
      expect(coverage.report.model_invoked).toBe(false);
      expect(coverage.report.next_safe_task).toContain("final readiness summary report");
      expect(persisted.status).toBe("coverage_pass");
    } finally {
      await rm(repoRoot, { recursive: true, force: true });
    }
  });

  it("blocks controlled executor activation execution-manifest proposal coverage when proposal report is invalid", async () => {
    const repoRoot = await mkdtemp(join(tmpdir(), "hermes-flow-"));
    try {
      const proposalPath = join(
        repoRoot,
        "bad-controlled-executor-activation-execution-manifest-proposal-report.json",
      );
      await writeFile(proposalPath, "{}\n", "utf8");

      const coverage =
        await writeHermesTaskFlowRegistryControlledExecutorActivationExecutionManifestProposalCoverageReportArtifact(
          {
            repoRoot,
            controlledExecutorActivationExecutionManifestProposalReportPath: proposalPath,
          },
        );

      expect(coverage.report.status).toBe("blocked");
      expect(coverage.report.operation).toBe("blocked");
      expect(coverage.report.validation_status).toBe("fail");
      expect(coverage.report.coverage.proposal_ready).toBe(false);
      expect(coverage.report.coverage.approval_required).toBe(false);
      expect(coverage.report.coverage.execution_start_allowed_false).toBe(false);
      expect(coverage.report.coverage.operator_approval_still_false).toBe(false);
      expect(coverage.report.coverage.execution_started_still_false).toBe(false);
      expect(coverage.report.coverage.rollback_precondition_present).toBe(false);
      expect(coverage.report.coverage.required_validation_complete).toBe(false);
      expect(coverage.report.coverage.registry_write_disabled).toBe(false);
      expect(coverage.report.coverage.sqlite_write_disabled).toBe(false);
      expect(coverage.report.coverage.worker_execution_disabled).toBe(false);
      expect(coverage.report.coverage.model_invocation_disabled).toBe(false);
      expect(coverage.report.coverage.coverage_ratio).toBe(0);
      expect(coverage.report.operator_approved).toBe(false);
      expect(coverage.report.execution_started).toBe(false);
      expect(coverage.report.real_writer_allowed).toBe(false);
      expect(coverage.report.registry_write_allowed).toBe(false);
      expect(coverage.report.taskflow_registry_write).toBe(false);
      expect(coverage.report.sqlite_write).toBe(false);
      expect(coverage.report.worker_execution).toBe(false);
      expect(coverage.report.model_invoked).toBe(false);
      expect(coverage.report.failures).toContain(
        "schema must equal openclaw.hermes.taskflow_registry_controlled_executor_activation_execution_manifest_proposal_report.v1",
      );
    } finally {
      await rm(repoRoot, { recursive: true, force: true });
    }
  });
  it("writes a read-only controlled executor activation execution-manifest final readiness summary report", async () => {
    const repoRoot = await mkdtemp(join(tmpdir(), "hermes-flow-"));
    try {
      const summary =
        await buildControlledExecutorActivationExecutionManifestFinalReadinessSummaryReport(
          repoRoot,
        );
      const persisted = JSON.parse(await readFile(summary.path, "utf8"));

      expect(summary.report.schema).toBe(
        "openclaw.hermes.taskflow_registry_controlled_executor_activation_execution_manifest_final_readiness_summary_report.v1",
      );
      expect(summary.report.status).toBe("summary_ready");
      expect(summary.report.operation).toBe("create");
      expect(summary.report.validation_status).toBe("pass");
      expect(summary.report.failures).toEqual([]);
      expect(summary.report.summary.proposal_coverage_green).toBe(true);
      expect(summary.report.summary.proposal_ready).toBe(true);
      expect(summary.report.summary.approval_required).toBe(true);
      expect(summary.report.summary.execution_start_allowed_false).toBe(true);
      expect(summary.report.summary.operator_approval_still_false).toBe(true);
      expect(summary.report.summary.execution_started_still_false).toBe(true);
      expect(summary.report.summary.rollback_precondition_present).toBe(true);
      expect(summary.report.summary.required_validation_complete).toBe(true);
      expect(summary.report.summary.registry_write_disabled).toBe(true);
      expect(summary.report.summary.sqlite_write_disabled).toBe(true);
      expect(summary.report.summary.worker_execution_disabled).toBe(true);
      expect(summary.report.summary.model_invocation_disabled).toBe(true);
      expect(summary.report.summary.final_readiness_ratio).toBe(1);
      expect(summary.report.operator_approved).toBe(false);
      expect(summary.report.execution_started).toBe(false);
      expect(summary.report.real_writer_allowed).toBe(false);
      expect(summary.report.registry_write_allowed).toBe(false);
      expect(summary.report.taskflow_registry_write).toBe(false);
      expect(summary.report.sqlite_write).toBe(false);
      expect(summary.report.worker_execution).toBe(false);
      expect(summary.report.model_invoked).toBe(false);
      expect(summary.report.next_safe_task).toContain("final readiness summary coverage report");
      expect(persisted.status).toBe("summary_ready");
    } finally {
      await rm(repoRoot, { recursive: true, force: true });
    }
  });

  it("blocks controlled executor activation execution-manifest final readiness summary when proposal coverage is invalid", async () => {
    const repoRoot = await mkdtemp(join(tmpdir(), "hermes-flow-"));
    try {
      const coveragePath = join(
        repoRoot,
        "bad-controlled-executor-activation-execution-manifest-proposal-coverage-report.json",
      );
      await writeFile(coveragePath, "{}\n", "utf8");

      const summary =
        await writeHermesTaskFlowRegistryControlledExecutorActivationExecutionManifestFinalReadinessSummaryReportArtifact(
          {
            repoRoot,
            controlledExecutorActivationExecutionManifestProposalCoverageReportPath: coveragePath,
          },
        );

      expect(summary.report.status).toBe("blocked");
      expect(summary.report.operation).toBe("blocked");
      expect(summary.report.validation_status).toBe("fail");
      expect(summary.report.summary.proposal_coverage_green).toBe(false);
      expect(summary.report.summary.proposal_ready).toBe(false);
      expect(summary.report.summary.approval_required).toBe(false);
      expect(summary.report.summary.execution_start_allowed_false).toBe(false);
      expect(summary.report.summary.operator_approval_still_false).toBe(false);
      expect(summary.report.summary.execution_started_still_false).toBe(false);
      expect(summary.report.summary.rollback_precondition_present).toBe(false);
      expect(summary.report.summary.required_validation_complete).toBe(false);
      expect(summary.report.summary.registry_write_disabled).toBe(false);
      expect(summary.report.summary.sqlite_write_disabled).toBe(false);
      expect(summary.report.summary.worker_execution_disabled).toBe(false);
      expect(summary.report.summary.model_invocation_disabled).toBe(false);
      expect(summary.report.summary.final_readiness_ratio).toBe(0);
      expect(summary.report.operator_approved).toBe(false);
      expect(summary.report.execution_started).toBe(false);
      expect(summary.report.real_writer_allowed).toBe(false);
      expect(summary.report.registry_write_allowed).toBe(false);
      expect(summary.report.taskflow_registry_write).toBe(false);
      expect(summary.report.sqlite_write).toBe(false);
      expect(summary.report.worker_execution).toBe(false);
      expect(summary.report.model_invoked).toBe(false);
      expect(summary.report.failures).toContain(
        "schema must equal openclaw.hermes.taskflow_registry_controlled_executor_activation_execution_manifest_proposal_coverage_report.v1",
      );
    } finally {
      await rm(repoRoot, { recursive: true, force: true });
    }
  });
  it("writes a read-only controlled executor activation memory layer sandwich loop report", async () => {
    const repoRoot = await mkdtemp(join(tmpdir(), "hermes-flow-"));
    try {
      const loop = await buildControlledExecutorActivationMemoryLayerSandwichLoopReport(repoRoot);
      const persisted = JSON.parse(await readFile(loop.path, "utf8"));

      expect(loop.report.schema).toBe(
        "openclaw.hermes.taskflow_registry_controlled_executor_activation_memory_layer_sandwich_loop_report.v1",
      );
      expect(loop.report.status).toBe("loop_ready");
      expect(loop.report.operation).toBe("create");
      expect(loop.report.validation_status).toBe("pass");
      expect(loop.report.failures).toEqual([]);
      expect(loop.report.memory_loop.loop_name).toBe(
        "observe_retrieve_reason_validate_store_candidate_recall_compare_next_task",
      );
      expect(loop.report.memory_loop.observation_layer_ready).toBe(true);
      expect(loop.report.memory_loop.retrieval_layer_required).toBe(true);
      expect(loop.report.memory_loop.reasoning_layer_policy_only).toBe(true);
      expect(loop.report.memory_loop.candidate_memory_write_only_after_approval).toBe(true);
      expect(loop.report.memory_loop.memory_write_allowed).toBe(false);
      expect(loop.report.memory_loop.recall_validation_required).toBe(true);
      expect(loop.report.memory_loop.feedback_loop_closed).toBe(true);
      expect(loop.report.memory_loop.loop_ratio).toBe(1);
      expect(loop.report.sandwich_model.top_layer).toBe("openclaw_guardrail_controller");
      expect(loop.report.sandwich_model.middle_layer).toBe("hermes_planner_memory_decision");
      expect(loop.report.sandwich_model.bottom_layer).toBe("verifier_recall_feedback");
      expect(loop.report.sandwich_model.planner_to_memory_to_verifier).toBe(true);
      expect(loop.report.sandwich_model.dual_model_parallel_allowed).toBe(false);
      expect(loop.report.sandwich_model.model_invocation_allowed).toBe(false);
      expect(loop.report.sandwich_model.model_invocation_reference_only).toBe(true);
      expect(loop.report.sandwich_model.sandwich_ratio).toBe(1);
      expect(loop.report.operator_approved).toBe(false);
      expect(loop.report.execution_started).toBe(false);
      expect(loop.report.real_writer_allowed).toBe(false);
      expect(loop.report.registry_write_allowed).toBe(false);
      expect(loop.report.taskflow_registry_write).toBe(false);
      expect(loop.report.sqlite_write).toBe(false);
      expect(loop.report.worker_execution).toBe(false);
      expect(loop.report.model_invoked).toBe(false);
      expect(loop.report.memory_write).toBe(false);
      expect(loop.report.next_safe_task).toContain("memory layer sandwich loop coverage report");
      expect(persisted.status).toBe("loop_ready");
    } finally {
      await rm(repoRoot, { recursive: true, force: true });
    }
  });

  it("blocks controlled executor activation memory layer sandwich loop when final readiness summary is invalid", async () => {
    const repoRoot = await mkdtemp(join(tmpdir(), "hermes-flow-"));
    try {
      const summaryPath = join(
        repoRoot,
        "bad-controlled-executor-activation-execution-manifest-final-readiness-summary-report.json",
      );
      await writeFile(summaryPath, "{}\n", "utf8");

      const loop =
        await writeHermesTaskFlowRegistryControlledExecutorActivationMemoryLayerSandwichLoopReportArtifact(
          {
            repoRoot,
            controlledExecutorActivationExecutionManifestFinalReadinessSummaryReportPath:
              summaryPath,
          },
        );

      expect(loop.report.status).toBe("blocked");
      expect(loop.report.operation).toBe("blocked");
      expect(loop.report.validation_status).toBe("fail");
      expect(loop.report.memory_loop.observation_layer_ready).toBe(false);
      expect(loop.report.memory_loop.retrieval_layer_required).toBe(false);
      expect(loop.report.memory_loop.reasoning_layer_policy_only).toBe(false);
      expect(loop.report.memory_loop.candidate_memory_write_only_after_approval).toBe(false);
      expect(loop.report.memory_loop.memory_write_allowed).toBe(false);
      expect(loop.report.memory_loop.recall_validation_required).toBe(false);
      expect(loop.report.memory_loop.feedback_loop_closed).toBe(false);
      expect(loop.report.memory_loop.loop_ratio).toBe(0);
      expect(loop.report.sandwich_model.planner_to_memory_to_verifier).toBe(false);
      expect(loop.report.sandwich_model.dual_model_parallel_allowed).toBe(false);
      expect(loop.report.sandwich_model.model_invocation_allowed).toBe(false);
      expect(loop.report.sandwich_model.model_invocation_reference_only).toBe(false);
      expect(loop.report.sandwich_model.sandwich_ratio).toBe(0);
      expect(loop.report.operator_approved).toBe(false);
      expect(loop.report.execution_started).toBe(false);
      expect(loop.report.real_writer_allowed).toBe(false);
      expect(loop.report.registry_write_allowed).toBe(false);
      expect(loop.report.taskflow_registry_write).toBe(false);
      expect(loop.report.sqlite_write).toBe(false);
      expect(loop.report.worker_execution).toBe(false);
      expect(loop.report.model_invoked).toBe(false);
      expect(loop.report.memory_write).toBe(false);
      expect(loop.report.failures).toContain(
        "schema must equal openclaw.hermes.taskflow_registry_controlled_executor_activation_execution_manifest_final_readiness_summary_report.v1",
      );
    } finally {
      await rm(repoRoot, { recursive: true, force: true });
    }
  });
  it("runs a controlled memory layer sandwich loop dry-run to closed-loop completion", async () => {
    const repoRoot = await mkdtemp(join(tmpdir(), "hermes-flow-"));
    try {
      const run =
        await buildControlledExecutorActivationMemoryLayerSandwichLoopDryRunReport(repoRoot);
      const persisted = JSON.parse(await readFile(run.path, "utf8"));

      expect(run.report.schema).toBe(
        "openclaw.hermes.taskflow_registry_controlled_executor_activation_memory_layer_sandwich_loop_dry_run_report.v1",
      );
      expect(run.report.status).toBe("closed_loop_complete");
      expect(run.report.operation).toBe("create");
      expect(run.report.validation_status).toBe("pass");
      expect(run.report.failures).toEqual([]);
      expect(run.report.run.run_mode).toBe("dry_run_controlled_activation");
      expect(run.report.run.started).toBe(true);
      expect(run.report.run.completed).toBe(true);
      expect(run.report.run.observe_phase_complete).toBe(true);
      expect(run.report.run.retrieve_phase_complete).toBe(true);
      expect(run.report.run.reason_phase_complete).toBe(true);
      expect(run.report.run.validate_phase_complete).toBe(true);
      expect(run.report.run.store_candidate_phase_blocked_until_approval).toBe(true);
      expect(run.report.run.recall_phase_complete).toBe(true);
      expect(run.report.run.compare_phase_complete).toBe(true);
      expect(run.report.run.next_task_phase_complete).toBe(true);
      expect(run.report.run.completion_ratio).toBe(1);
      expect(run.report.sandwich_runtime.top_guardrail_checked).toBe(true);
      expect(run.report.sandwich_runtime.middle_planner_memory_checked).toBe(true);
      expect(run.report.sandwich_runtime.bottom_verifier_recall_checked).toBe(true);
      expect(run.report.sandwich_runtime.model_invocation_reference_only).toBe(true);
      expect(run.report.sandwich_runtime.runtime_ratio).toBe(1);
      expect(run.report.operator_approved).toBe(false);
      expect(run.report.execution_started).toBe(false);
      expect(run.report.real_writer_allowed).toBe(false);
      expect(run.report.registry_write_allowed).toBe(false);
      expect(run.report.taskflow_registry_write).toBe(false);
      expect(run.report.sqlite_write).toBe(false);
      expect(run.report.worker_execution).toBe(false);
      expect(run.report.model_invoked).toBe(false);
      expect(run.report.memory_write).toBe(false);
      expect(run.report.next_safe_task).toContain("dry-run closed-loop run coverage report");
      expect(persisted.status).toBe("closed_loop_complete");
    } finally {
      await rm(repoRoot, { recursive: true, force: true });
    }
  });

  it("blocks controlled memory layer sandwich loop dry-run when loop report is invalid", async () => {
    const repoRoot = await mkdtemp(join(tmpdir(), "hermes-flow-"));
    try {
      const loopPath = join(
        repoRoot,
        "bad-controlled-executor-activation-memory-layer-sandwich-loop-report.json",
      );
      await writeFile(loopPath, "{}\n", "utf8");

      const run =
        await writeHermesTaskFlowRegistryControlledExecutorActivationMemoryLayerSandwichLoopDryRunReportArtifact(
          {
            repoRoot,
            controlledExecutorActivationMemoryLayerSandwichLoopReportPath: loopPath,
          },
        );

      expect(run.report.status).toBe("blocked");
      expect(run.report.operation).toBe("blocked");
      expect(run.report.validation_status).toBe("fail");
      expect(run.report.run.started).toBe(false);
      expect(run.report.run.completed).toBe(false);
      expect(run.report.run.completion_ratio).toBe(0);
      expect(run.report.sandwich_runtime.runtime_ratio).toBe(0);
      expect(run.report.operator_approved).toBe(false);
      expect(run.report.execution_started).toBe(false);
      expect(run.report.real_writer_allowed).toBe(false);
      expect(run.report.registry_write_allowed).toBe(false);
      expect(run.report.taskflow_registry_write).toBe(false);
      expect(run.report.sqlite_write).toBe(false);
      expect(run.report.worker_execution).toBe(false);
      expect(run.report.model_invoked).toBe(false);
      expect(run.report.memory_write).toBe(false);
      expect(run.report.failures).toContain(
        "schema must equal openclaw.hermes.taskflow_registry_controlled_executor_activation_memory_layer_sandwich_loop_report.v1",
      );
    } finally {
      await rm(repoRoot, { recursive: true, force: true });
    }
  });
  it("locks Hermes godmode behind a read-only safety report", async () => {
    const repoRoot = await mkdtemp(join(tmpdir(), "hermes-flow-"));
    try {
      const lock = await buildControlledExecutorActivationGodmodeSafetyLockReport(repoRoot);
      const persisted = JSON.parse(await readFile(lock.path, "utf8"));

      expect(lock.report.schema).toBe(
        "openclaw.hermes.taskflow_registry_controlled_executor_activation_godmode_safety_lock_report.v1",
      );
      expect(lock.report.status).toBe("locked");
      expect(lock.report.operation).toBe("create");
      expect(lock.report.validation_status).toBe("pass");
      expect(lock.report.failures).toEqual([]);
      expect(lock.report.requested_mode).toBe("hermes_godmode");
      expect(lock.report.official_skill_path).toBe("skills/red-teaming/godmode/");
      expect(lock.report.official_capability_classification).toBe("jailbreak_prompt_api_level");
      expect(lock.report.safe_substitute).toBe("direct_hermes_model_with_openclaw_guardrails");
      expect(lock.report.godmode_activation_allowed).toBe(false);
      expect(lock.report.auto_jailbreak_allowed).toBe(false);
      expect(lock.report.hermes_config_write_allowed).toBe(false);
      expect(lock.report.hermes_prefill_write_allowed).toBe(false);
      expect(lock.report.operator_approved).toBe(false);
      expect(lock.report.execution_started).toBe(false);
      expect(lock.report.real_writer_allowed).toBe(false);
      expect(lock.report.registry_write_allowed).toBe(false);
      expect(lock.report.taskflow_registry_write).toBe(false);
      expect(lock.report.sqlite_write).toBe(false);
      expect(lock.report.worker_execution).toBe(false);
      expect(lock.report.model_invoked).toBe(false);
      expect(lock.report.memory_write).toBe(false);
      expect(lock.report.hermes_config_write).toBe(false);
      expect(lock.report.hermes_prefill_write).toBe(false);
      expect(lock.report.blocked_actions).toContain("running Hermes godmode auto_jailbreak");
      expect(lock.report.next_safe_task).toContain("godmode safety lock coverage report");
      expect(persisted.status).toBe("locked");
    } finally {
      await rm(repoRoot, { recursive: true, force: true });
    }
  });

  it("blocks Hermes godmode safety lock when dry-run report is invalid", async () => {
    const repoRoot = await mkdtemp(join(tmpdir(), "hermes-flow-"));
    try {
      const dryRunPath = join(
        repoRoot,
        "bad-controlled-executor-activation-memory-layer-sandwich-loop-dry-run-report.json",
      );
      await writeFile(dryRunPath, "{}\n", "utf8");

      const lock =
        await writeHermesTaskFlowRegistryControlledExecutorActivationGodmodeSafetyLockReportArtifact(
          {
            repoRoot,
            controlledExecutorActivationMemoryLayerSandwichLoopDryRunReportPath: dryRunPath,
          },
        );

      expect(lock.report.status).toBe("blocked");
      expect(lock.report.operation).toBe("blocked");
      expect(lock.report.validation_status).toBe("fail");
      expect(lock.report.godmode_activation_allowed).toBe(false);
      expect(lock.report.auto_jailbreak_allowed).toBe(false);
      expect(lock.report.hermes_config_write).toBe(false);
      expect(lock.report.hermes_prefill_write).toBe(false);
      expect(lock.report.model_invoked).toBe(false);
      expect(lock.report.memory_write).toBe(false);
      expect(lock.report.failures).toContain(
        "schema must equal openclaw.hermes.taskflow_registry_controlled_executor_activation_memory_layer_sandwich_loop_dry_run_report.v1",
      );
    } finally {
      await rm(repoRoot, { recursive: true, force: true });
    }
  });
  it("writes a read-only Hermes godmode safety lock coverage report", async () => {
    const repoRoot = await mkdtemp(join(tmpdir(), "hermes-flow-"));
    try {
      const coverage =
        await buildControlledExecutorActivationGodmodeSafetyLockCoverageReport(repoRoot);
      const persisted = JSON.parse(await readFile(coverage.path, "utf8"));

      expect(coverage.report.schema).toBe(
        "openclaw.hermes.taskflow_registry_controlled_executor_activation_godmode_safety_lock_coverage_report.v1",
      );
      expect(coverage.report.status).toBe("coverage_pass");
      expect(coverage.report.operation).toBe("create");
      expect(coverage.report.validation_status).toBe("pass");
      expect(coverage.report.failures).toEqual([]);
      expect(coverage.report.coverage.godmode_safety_lock_locked).toBe(true);
      expect(coverage.report.coverage.official_skill_path_complete).toBe(true);
      expect(coverage.report.coverage.official_capability_classification_locked).toBe(true);
      expect(coverage.report.coverage.safe_substitute_present).toBe(true);
      expect(coverage.report.coverage.godmode_activation_disabled).toBe(true);
      expect(coverage.report.coverage.auto_jailbreak_disabled).toBe(true);
      expect(coverage.report.coverage.hermes_config_write_disabled).toBe(true);
      expect(coverage.report.coverage.hermes_prefill_write_disabled).toBe(true);
      expect(coverage.report.coverage.operator_approval_still_false).toBe(true);
      expect(coverage.report.coverage.execution_started_still_false).toBe(true);
      expect(coverage.report.coverage.registry_write_disabled).toBe(true);
      expect(coverage.report.coverage.sqlite_write_disabled).toBe(true);
      expect(coverage.report.coverage.worker_execution_disabled).toBe(true);
      expect(coverage.report.coverage.model_invocation_disabled).toBe(true);
      expect(coverage.report.coverage.memory_write_disabled).toBe(true);
      expect(coverage.report.coverage.hermes_config_write_still_false).toBe(true);
      expect(coverage.report.coverage.hermes_prefill_write_still_false).toBe(true);
      expect(coverage.report.coverage.coverage_ratio).toBe(1);
      expect(coverage.report.operator_approved).toBe(false);
      expect(coverage.report.execution_started).toBe(false);
      expect(coverage.report.taskflow_registry_write).toBe(false);
      expect(coverage.report.sqlite_write).toBe(false);
      expect(coverage.report.worker_execution).toBe(false);
      expect(coverage.report.model_invoked).toBe(false);
      expect(coverage.report.memory_write).toBe(false);
      expect(coverage.report.hermes_config_write).toBe(false);
      expect(coverage.report.hermes_prefill_write).toBe(false);
      expect(coverage.report.next_safe_task).toContain("red-team-only sandbox boundary plan");
      expect(persisted.status).toBe("coverage_pass");
    } finally {
      await rm(repoRoot, { recursive: true, force: true });
    }
  });

  it("blocks Hermes godmode safety lock coverage when lock report is invalid", async () => {
    const repoRoot = await mkdtemp(join(tmpdir(), "hermes-flow-"));
    try {
      const lockPath = join(
        repoRoot,
        "bad-controlled-executor-activation-godmode-safety-lock-report.json",
      );
      await writeFile(lockPath, "{}\n", "utf8");

      const coverage =
        await writeHermesTaskFlowRegistryControlledExecutorActivationGodmodeSafetyLockCoverageReportArtifact(
          {
            repoRoot,
            controlledExecutorActivationGodmodeSafetyLockReportPath: lockPath,
          },
        );

      expect(coverage.report.status).toBe("blocked");
      expect(coverage.report.operation).toBe("blocked");
      expect(coverage.report.validation_status).toBe("fail");
      expect(coverage.report.coverage.coverage_ratio).toBe(0);
      expect(coverage.report.coverage.godmode_activation_disabled).toBe(false);
      expect(coverage.report.hermes_config_write).toBe(false);
      expect(coverage.report.hermes_prefill_write).toBe(false);
      expect(coverage.report.model_invoked).toBe(false);
      expect(coverage.report.memory_write).toBe(false);
      expect(coverage.report.failures).toContain(
        "schema must equal openclaw.hermes.taskflow_registry_controlled_executor_activation_godmode_safety_lock_report.v1",
      );
    } finally {
      await rm(repoRoot, { recursive: true, force: true });
    }
  });
  it("writes a read-only red-team-only sandbox boundary plan", async () => {
    const repoRoot = await mkdtemp(join(tmpdir(), "hermes-flow-"));
    try {
      const plan = await buildControlledExecutorActivationRedTeamSandboxBoundaryPlan(repoRoot);
      const persisted = JSON.parse(await readFile(plan.path, "utf8"));

      expect(plan.plan.schema).toBe(
        "openclaw.hermes.taskflow_registry_controlled_executor_activation_red_team_sandbox_boundary_plan.v1",
      );
      expect(plan.plan.status).toBe("plan_ready");
      expect(plan.plan.operation).toBe("create");
      expect(plan.plan.validation_status).toBe("pass");
      expect(plan.plan.failures).toEqual([]);
      expect(plan.plan.boundary.plan_mode).toBe("red_team_only_sandbox_boundary");
      expect(plan.plan.boundary.godmode_coverage_pass).toBe(true);
      expect(plan.plan.boundary.isolation_required).toBe(true);
      expect(plan.plan.boundary.approval_gate_required).toBe(true);
      expect(plan.plan.boundary.rollback_path_required).toBe(true);
      expect(plan.plan.boundary.validation_checklist_complete).toBe(true);
      expect(plan.plan.boundary.godmode_activation_disabled).toBe(true);
      expect(plan.plan.boundary.auto_jailbreak_disabled).toBe(true);
      expect(plan.plan.boundary.hermes_config_write_disabled).toBe(true);
      expect(plan.plan.boundary.hermes_prefill_write_disabled).toBe(true);
      expect(plan.plan.boundary.registry_write_disabled).toBe(true);
      expect(plan.plan.boundary.sqlite_write_disabled).toBe(true);
      expect(plan.plan.boundary.worker_execution_disabled).toBe(true);
      expect(plan.plan.boundary.model_invocation_disabled).toBe(true);
      expect(plan.plan.boundary.memory_write_disabled).toBe(true);
      expect(plan.plan.boundary.boundary_ratio).toBe(1);
      expect(plan.plan.sandbox_boundary.length).toBeGreaterThan(0);
      expect(plan.plan.approval_gate.length).toBeGreaterThan(0);
      expect(plan.plan.validation_checklist.length).toBeGreaterThan(0);
      expect(plan.plan.operator_approved).toBe(false);
      expect(plan.plan.execution_started).toBe(false);
      expect(plan.plan.taskflow_registry_write).toBe(false);
      expect(plan.plan.sqlite_write).toBe(false);
      expect(plan.plan.worker_execution).toBe(false);
      expect(plan.plan.model_invoked).toBe(false);
      expect(plan.plan.memory_write).toBe(false);
      expect(plan.plan.hermes_config_write).toBe(false);
      expect(plan.plan.hermes_prefill_write).toBe(false);
      expect(plan.plan.next_safe_task).toContain("red-team-only sandbox boundary plan coverage");
      expect(persisted.status).toBe("plan_ready");
    } finally {
      await rm(repoRoot, { recursive: true, force: true });
    }
  });

  it("blocks red-team-only sandbox boundary plan when godmode coverage is invalid", async () => {
    const repoRoot = await mkdtemp(join(tmpdir(), "hermes-flow-"));
    try {
      const coveragePath = join(
        repoRoot,
        "bad-controlled-executor-activation-godmode-safety-lock-coverage-report.json",
      );
      await writeFile(coveragePath, "{}\n", "utf8");

      const plan =
        await writeHermesTaskFlowRegistryControlledExecutorActivationRedTeamSandboxBoundaryPlanArtifact(
          {
            repoRoot,
            controlledExecutorActivationGodmodeSafetyLockCoverageReportPath: coveragePath,
          },
        );

      expect(plan.plan.status).toBe("blocked");
      expect(plan.plan.operation).toBe("blocked");
      expect(plan.plan.validation_status).toBe("fail");
      expect(plan.plan.boundary.godmode_coverage_pass).toBe(false);
      expect(plan.plan.boundary.boundary_ratio).toBe(0);
      expect(plan.plan.operator_approved).toBe(false);
      expect(plan.plan.execution_started).toBe(false);
      expect(plan.plan.model_invoked).toBe(false);
      expect(plan.plan.memory_write).toBe(false);
      expect(plan.plan.hermes_config_write).toBe(false);
      expect(plan.plan.hermes_prefill_write).toBe(false);
      expect(plan.plan.failures).toContain(
        "schema must equal openclaw.hermes.taskflow_registry_controlled_executor_activation_godmode_safety_lock_coverage_report.v1",
      );
    } finally {
      await rm(repoRoot, { recursive: true, force: true });
    }
  });
  it("writes a read-only red-team-only sandbox boundary plan coverage report", async () => {
    const repoRoot = await mkdtemp(join(tmpdir(), "hermes-flow-"));
    try {
      const coverage =
        await buildControlledExecutorActivationRedTeamSandboxBoundaryPlanCoverageReport(repoRoot);
      const persisted = JSON.parse(await readFile(coverage.path, "utf8"));

      expect(coverage.report.schema).toBe(
        "openclaw.hermes.taskflow_registry_controlled_executor_activation_red_team_sandbox_boundary_plan_coverage_report.v1",
      );
      expect(coverage.report.status).toBe("coverage_pass");
      expect(coverage.report.operation).toBe("create");
      expect(coverage.report.validation_status).toBe("pass");
      expect(coverage.report.failures).toEqual([]);
      expect(coverage.report.coverage.sandbox_boundary_plan_ready).toBe(true);
      expect(coverage.report.coverage.boundary_ratio_complete).toBe(true);
      expect(coverage.report.coverage.godmode_coverage_pass).toBe(true);
      expect(coverage.report.coverage.godmode_activation_disabled).toBe(true);
      expect(coverage.report.coverage.auto_jailbreak_disabled).toBe(true);
      expect(coverage.report.coverage.approval_gate_required).toBe(true);
      expect(coverage.report.coverage.rollback_path_required).toBe(true);
      expect(coverage.report.coverage.validation_checklist_complete).toBe(true);
      expect(coverage.report.coverage.operator_approval_still_false).toBe(true);
      expect(coverage.report.coverage.execution_started_still_false).toBe(true);
      expect(coverage.report.coverage.registry_write_disabled).toBe(true);
      expect(coverage.report.coverage.sqlite_write_disabled).toBe(true);
      expect(coverage.report.coverage.worker_execution_disabled).toBe(true);
      expect(coverage.report.coverage.model_invocation_disabled).toBe(true);
      expect(coverage.report.coverage.memory_write_disabled).toBe(true);
      expect(coverage.report.coverage.hermes_config_write_disabled).toBe(true);
      expect(coverage.report.coverage.hermes_prefill_write_disabled).toBe(true);
      expect(coverage.report.coverage.coverage_ratio).toBe(1);
      expect(coverage.report.operator_approved).toBe(false);
      expect(coverage.report.execution_started).toBe(false);
      expect(coverage.report.taskflow_registry_write).toBe(false);
      expect(coverage.report.sqlite_write).toBe(false);
      expect(coverage.report.worker_execution).toBe(false);
      expect(coverage.report.model_invoked).toBe(false);
      expect(coverage.report.memory_write).toBe(false);
      expect(coverage.report.hermes_config_write).toBe(false);
      expect(coverage.report.hermes_prefill_write).toBe(false);
      expect(coverage.report.next_safe_task).toContain("sandbox operator approval challenge");
      expect(persisted.status).toBe("coverage_pass");
    } finally {
      await rm(repoRoot, { recursive: true, force: true });
    }
  });

  it("blocks red-team-only sandbox boundary plan coverage when plan is invalid", async () => {
    const repoRoot = await mkdtemp(join(tmpdir(), "hermes-flow-"));
    try {
      const planPath = join(
        repoRoot,
        "bad-controlled-executor-activation-red-team-sandbox-boundary-plan.json",
      );
      await writeFile(planPath, "{}\n", "utf8");

      const coverage =
        await writeHermesTaskFlowRegistryControlledExecutorActivationRedTeamSandboxBoundaryPlanCoverageReportArtifact(
          {
            repoRoot,
            controlledExecutorActivationRedTeamSandboxBoundaryPlanPath: planPath,
          },
        );

      expect(coverage.report.status).toBe("blocked");
      expect(coverage.report.operation).toBe("blocked");
      expect(coverage.report.validation_status).toBe("fail");
      expect(coverage.report.coverage.sandbox_boundary_plan_ready).toBe(false);
      expect(coverage.report.coverage.coverage_ratio).toBe(0);
      expect(coverage.report.operator_approved).toBe(false);
      expect(coverage.report.execution_started).toBe(false);
      expect(coverage.report.model_invoked).toBe(false);
      expect(coverage.report.memory_write).toBe(false);
      expect(coverage.report.hermes_config_write).toBe(false);
      expect(coverage.report.hermes_prefill_write).toBe(false);
      expect(coverage.report.failures).toContain(
        "schema must equal openclaw.hermes.taskflow_registry_controlled_executor_activation_red_team_sandbox_boundary_plan.v1",
      );
    } finally {
      await rm(repoRoot, { recursive: true, force: true });
    }
  });
  it("writes a read-only red-team-only sandbox operator approval challenge fixture", async () => {
    const repoRoot = await mkdtemp(join(tmpdir(), "hermes-flow-"));
    try {
      const fixture =
        await buildControlledExecutorActivationRedTeamSandboxOperatorApprovalChallengeFixture(
          repoRoot,
        );
      const persisted = JSON.parse(await readFile(fixture.path, "utf8"));

      expect(fixture.fixture.schema).toBe(
        "openclaw.hermes.taskflow_registry_controlled_executor_activation_red_team_sandbox_operator_approval_challenge_fixture.v1",
      );
      expect(fixture.fixture.status).toBe("fixture_ready");
      expect(fixture.fixture.operation).toBe("create");
      expect(fixture.fixture.validation_status).toBe("pass");
      expect(fixture.fixture.failures).toEqual([]);
      expect(fixture.fixture.challenge.challenge_mode).toBe("manual_approval_challenge_only");
      expect(fixture.fixture.challenge.boundary_coverage_pass).toBe(true);
      expect(fixture.fixture.challenge.coverage_ratio_complete).toBe(true);
      expect(fixture.fixture.challenge.sandbox_boundary_plan_ready).toBe(true);
      expect(fixture.fixture.challenge.godmode_activation_disabled).toBe(true);
      expect(fixture.fixture.challenge.auto_jailbreak_disabled).toBe(true);
      expect(fixture.fixture.challenge.approval_challenge_present).toBe(true);
      expect(fixture.fixture.challenge.fingerprint_present).toBe(true);
      expect(fixture.fixture.challenge.rollback_acknowledgement_required).toBe(true);
      expect(fixture.fixture.challenge.fixture_is_not_approval).toBe(true);
      expect(fixture.fixture.challenge.challenge_ratio).toBe(1);
      expect(fixture.fixture.approval_challenge.challenge_id).toContain("manual-approval:");
      expect(fixture.fixture.approval_challenge.fingerprint).toMatch(/^[a-f0-9]{64}$/);
      expect(fixture.fixture.approval_challenge.required_acknowledgements.length).toBeGreaterThan(
        0,
      );
      expect(fixture.fixture.operator_approved).toBe(false);
      expect(fixture.fixture.execution_started).toBe(false);
      expect(fixture.fixture.taskflow_registry_write).toBe(false);
      expect(fixture.fixture.sqlite_write).toBe(false);
      expect(fixture.fixture.worker_execution).toBe(false);
      expect(fixture.fixture.model_invoked).toBe(false);
      expect(fixture.fixture.memory_write).toBe(false);
      expect(fixture.fixture.hermes_config_write).toBe(false);
      expect(fixture.fixture.hermes_prefill_write).toBe(false);
      expect(fixture.fixture.next_safe_task).toContain("approval challenge coverage report");
      expect(persisted.status).toBe("fixture_ready");
    } finally {
      await rm(repoRoot, { recursive: true, force: true });
    }
  });

  it("blocks red-team-only sandbox operator approval challenge fixture when coverage is invalid", async () => {
    const repoRoot = await mkdtemp(join(tmpdir(), "hermes-flow-"));
    try {
      const coveragePath = join(
        repoRoot,
        "bad-controlled-executor-activation-red-team-sandbox-boundary-plan-coverage-report.json",
      );
      await writeFile(coveragePath, "{}\n", "utf8");

      const fixture =
        await writeHermesTaskFlowRegistryControlledExecutorActivationRedTeamSandboxOperatorApprovalChallengeFixtureArtifact(
          {
            repoRoot,
            controlledExecutorActivationRedTeamSandboxBoundaryPlanCoverageReportPath: coveragePath,
          },
        );

      expect(fixture.fixture.status).toBe("blocked");
      expect(fixture.fixture.operation).toBe("blocked");
      expect(fixture.fixture.validation_status).toBe("fail");
      expect(fixture.fixture.challenge.boundary_coverage_pass).toBe(false);
      expect(fixture.fixture.challenge.challenge_ratio).toBe(0);
      expect(fixture.fixture.operator_approved).toBe(false);
      expect(fixture.fixture.execution_started).toBe(false);
      expect(fixture.fixture.model_invoked).toBe(false);
      expect(fixture.fixture.memory_write).toBe(false);
      expect(fixture.fixture.hermes_config_write).toBe(false);
      expect(fixture.fixture.hermes_prefill_write).toBe(false);
      expect(fixture.fixture.failures).toContain(
        "schema must equal openclaw.hermes.taskflow_registry_controlled_executor_activation_red_team_sandbox_boundary_plan_coverage_report.v1",
      );
    } finally {
      await rm(repoRoot, { recursive: true, force: true });
    }
  });

  it("writes a read-only red-team-only sandbox operator approval challenge coverage report", async () => {
    const repoRoot = await mkdtemp(join(tmpdir(), "hermes-flow-"));
    try {
      const coverage =
        await buildControlledExecutorActivationRedTeamSandboxOperatorApprovalChallengeCoverageReport(
          repoRoot,
        );
      const persisted = JSON.parse(await readFile(coverage.path, "utf8"));

      expect(coverage.report.schema).toBe(
        "openclaw.hermes.taskflow_registry_controlled_executor_activation_red_team_sandbox_operator_approval_challenge_coverage_report.v1",
      );
      expect(coverage.report.status).toBe("coverage_pass");
      expect(coverage.report.operation).toBe("create");
      expect(coverage.report.validation_status).toBe("pass");
      expect(coverage.report.failures).toEqual([]);
      expect(coverage.report.coverage.approval_challenge_fixture_ready).toBe(true);
      expect(coverage.report.coverage.challenge_ratio_complete).toBe(true);
      expect(coverage.report.coverage.fixture_is_not_approval).toBe(true);
      expect(coverage.report.coverage.approval_challenge_present).toBe(true);
      expect(coverage.report.coverage.fingerprint_present).toBe(true);
      expect(coverage.report.coverage.rollback_acknowledgement_required).toBe(true);
      expect(coverage.report.coverage.operator_approval_still_false).toBe(true);
      expect(coverage.report.coverage.execution_started_still_false).toBe(true);
      expect(coverage.report.coverage.registry_write_disabled).toBe(true);
      expect(coverage.report.coverage.sqlite_write_disabled).toBe(true);
      expect(coverage.report.coverage.worker_execution_disabled).toBe(true);
      expect(coverage.report.coverage.model_invocation_disabled).toBe(true);
      expect(coverage.report.coverage.memory_write_disabled).toBe(true);
      expect(coverage.report.coverage.hermes_config_write_disabled).toBe(true);
      expect(coverage.report.coverage.hermes_prefill_write_disabled).toBe(true);
      expect(coverage.report.coverage.coverage_ratio).toBe(1);
      expect(coverage.report.operator_approved).toBe(false);
      expect(coverage.report.execution_started).toBe(false);
      expect(coverage.report.taskflow_registry_write).toBe(false);
      expect(coverage.report.sqlite_write).toBe(false);
      expect(coverage.report.worker_execution).toBe(false);
      expect(coverage.report.model_invoked).toBe(false);
      expect(coverage.report.memory_write).toBe(false);
      expect(coverage.report.hermes_config_write).toBe(false);
      expect(coverage.report.hermes_prefill_write).toBe(false);
      expect(coverage.report.next_safe_task).toContain("final safety summary");
      expect(persisted.status).toBe("coverage_pass");
    } finally {
      await rm(repoRoot, { recursive: true, force: true });
    }
  });

  it("blocks red-team-only sandbox operator approval challenge coverage when fixture is invalid", async () => {
    const repoRoot = await mkdtemp(join(tmpdir(), "hermes-flow-"));
    try {
      const fixturePath = join(
        repoRoot,
        "bad-controlled-executor-activation-red-team-sandbox-operator-approval-challenge-fixture.json",
      );
      await writeFile(fixturePath, "{}\n", "utf8");

      const coverage =
        await writeHermesTaskFlowRegistryControlledExecutorActivationRedTeamSandboxOperatorApprovalChallengeCoverageReportArtifact(
          {
            repoRoot,
            controlledExecutorActivationRedTeamSandboxOperatorApprovalChallengeFixturePath:
              fixturePath,
          },
        );

      expect(coverage.report.status).toBe("blocked");
      expect(coverage.report.operation).toBe("blocked");
      expect(coverage.report.validation_status).toBe("fail");
      expect(coverage.report.coverage.approval_challenge_fixture_ready).toBe(false);
      expect(coverage.report.coverage.coverage_ratio).toBe(0);
      expect(coverage.report.operator_approved).toBe(false);
      expect(coverage.report.execution_started).toBe(false);
      expect(coverage.report.model_invoked).toBe(false);
      expect(coverage.report.memory_write).toBe(false);
      expect(coverage.report.hermes_config_write).toBe(false);
      expect(coverage.report.hermes_prefill_write).toBe(false);
      expect(coverage.report.failures).toContain(
        "schema must equal openclaw.hermes.taskflow_registry_controlled_executor_activation_red_team_sandbox_operator_approval_challenge_fixture.v1",
      );
    } finally {
      await rm(repoRoot, { recursive: true, force: true });
    }
  });
  it("writes a read-only red-team-only sandbox final safety summary report", async () => {
    const repoRoot = await mkdtemp(join(tmpdir(), "hermes-flow-"));
    try {
      const summary =
        await buildControlledExecutorActivationRedTeamSandboxFinalSafetySummaryReport(repoRoot);
      const persisted = JSON.parse(await readFile(summary.path, "utf8"));

      expect(summary.report.schema).toBe(
        "openclaw.hermes.taskflow_registry_controlled_executor_activation_red_team_sandbox_final_safety_summary_report.v1",
      );
      expect(summary.report.status).toBe("summary_ready");
      expect(summary.report.operation).toBe("create");
      expect(summary.report.validation_status).toBe("pass");
      expect(summary.report.failures).toEqual([]);
      expect(summary.report.summary.approval_challenge_coverage_pass).toBe(true);
      expect(summary.report.summary.coverage_ratio_complete).toBe(true);
      expect(summary.report.summary.fixture_is_not_approval).toBe(true);
      expect(summary.report.summary.approval_challenge_present).toBe(true);
      expect(summary.report.summary.fingerprint_present).toBe(true);
      expect(summary.report.summary.rollback_acknowledgement_required).toBe(true);
      expect(summary.report.summary.operator_approval_still_false).toBe(true);
      expect(summary.report.summary.execution_started_still_false).toBe(true);
      expect(summary.report.summary.registry_write_disabled).toBe(true);
      expect(summary.report.summary.sqlite_write_disabled).toBe(true);
      expect(summary.report.summary.worker_execution_disabled).toBe(true);
      expect(summary.report.summary.model_invocation_disabled).toBe(true);
      expect(summary.report.summary.memory_write_disabled).toBe(true);
      expect(summary.report.summary.hermes_config_write_disabled).toBe(true);
      expect(summary.report.summary.hermes_prefill_write_disabled).toBe(true);
      expect(summary.report.summary.summary_ratio).toBe(1);
      expect(summary.report.operator_approved).toBe(false);
      expect(summary.report.execution_started).toBe(false);
      expect(summary.report.taskflow_registry_write).toBe(false);
      expect(summary.report.sqlite_write).toBe(false);
      expect(summary.report.worker_execution).toBe(false);
      expect(summary.report.model_invoked).toBe(false);
      expect(summary.report.memory_write).toBe(false);
      expect(summary.report.hermes_config_write).toBe(false);
      expect(summary.report.hermes_prefill_write).toBe(false);
      expect(summary.report.next_safe_task).toContain("final safety summary coverage");
      expect(persisted.status).toBe("summary_ready");
    } finally {
      await rm(repoRoot, { recursive: true, force: true });
    }
  });

  it("blocks red-team-only sandbox final safety summary when approval challenge coverage is invalid", async () => {
    const repoRoot = await mkdtemp(join(tmpdir(), "hermes-flow-"));
    try {
      const coveragePath = join(
        repoRoot,
        "bad-controlled-executor-activation-red-team-sandbox-operator-approval-challenge-coverage-report.json",
      );
      await writeFile(coveragePath, "{}\n", "utf8");

      const summary =
        await writeHermesTaskFlowRegistryControlledExecutorActivationRedTeamSandboxFinalSafetySummaryReportArtifact(
          {
            repoRoot,
            controlledExecutorActivationRedTeamSandboxOperatorApprovalChallengeCoverageReportPath:
              coveragePath,
          },
        );

      expect(summary.report.status).toBe("blocked");
      expect(summary.report.operation).toBe("blocked");
      expect(summary.report.validation_status).toBe("fail");
      expect(summary.report.summary.approval_challenge_coverage_pass).toBe(false);
      expect(summary.report.summary.summary_ratio).toBe(0);
      expect(summary.report.operator_approved).toBe(false);
      expect(summary.report.execution_started).toBe(false);
      expect(summary.report.model_invoked).toBe(false);
      expect(summary.report.memory_write).toBe(false);
      expect(summary.report.hermes_config_write).toBe(false);
      expect(summary.report.hermes_prefill_write).toBe(false);
      expect(summary.report.failures).toContain(
        "schema must equal openclaw.hermes.taskflow_registry_controlled_executor_activation_red_team_sandbox_operator_approval_challenge_coverage_report.v1",
      );
    } finally {
      await rm(repoRoot, { recursive: true, force: true });
    }
  });
  it("writes a read-only red-team-only sandbox final safety summary coverage report", async () => {
    const repoRoot = await mkdtemp(join(tmpdir(), "hermes-flow-"));
    try {
      const coverage =
        await buildControlledExecutorActivationRedTeamSandboxFinalSafetySummaryCoverageReport(
          repoRoot,
        );
      const persisted = JSON.parse(await readFile(coverage.path, "utf8"));

      expect(coverage.report.schema).toBe(
        "openclaw.hermes.taskflow_registry_controlled_executor_activation_red_team_sandbox_final_safety_summary_coverage_report.v1",
      );
      expect(coverage.report.status).toBe("coverage_pass");
      expect(coverage.report.operation).toBe("create");
      expect(coverage.report.validation_status).toBe("pass");
      expect(coverage.report.failures).toEqual([]);
      expect(coverage.report.coverage.final_safety_summary_ready).toBe(true);
      expect(coverage.report.coverage.summary_ratio_complete).toBe(true);
      expect(coverage.report.coverage.approval_challenge_coverage_pass).toBe(true);
      expect(coverage.report.coverage.fixture_is_not_approval).toBe(true);
      expect(coverage.report.coverage.approval_challenge_present).toBe(true);
      expect(coverage.report.coverage.fingerprint_present).toBe(true);
      expect(coverage.report.coverage.rollback_acknowledgement_required).toBe(true);
      expect(coverage.report.coverage.operator_approval_still_false).toBe(true);
      expect(coverage.report.coverage.execution_started_still_false).toBe(true);
      expect(coverage.report.coverage.registry_write_disabled).toBe(true);
      expect(coverage.report.coverage.sqlite_write_disabled).toBe(true);
      expect(coverage.report.coverage.worker_execution_disabled).toBe(true);
      expect(coverage.report.coverage.model_invocation_disabled).toBe(true);
      expect(coverage.report.coverage.memory_write_disabled).toBe(true);
      expect(coverage.report.coverage.hermes_config_write_disabled).toBe(true);
      expect(coverage.report.coverage.hermes_prefill_write_disabled).toBe(true);
      expect(coverage.report.coverage.coverage_ratio).toBe(1);
      expect(coverage.report.operator_approved).toBe(false);
      expect(coverage.report.execution_started).toBe(false);
      expect(coverage.report.taskflow_registry_write).toBe(false);
      expect(coverage.report.sqlite_write).toBe(false);
      expect(coverage.report.worker_execution).toBe(false);
      expect(coverage.report.model_invoked).toBe(false);
      expect(coverage.report.memory_write).toBe(false);
      expect(coverage.report.hermes_config_write).toBe(false);
      expect(coverage.report.hermes_prefill_write).toBe(false);
      expect(coverage.report.next_safe_task).toContain("operator handoff packet");
      expect(persisted.status).toBe("coverage_pass");
    } finally {
      await rm(repoRoot, { recursive: true, force: true });
    }
  });

  it("blocks red-team-only sandbox final safety summary coverage when summary is invalid", async () => {
    const repoRoot = await mkdtemp(join(tmpdir(), "hermes-flow-"));
    try {
      const summaryPath = join(
        repoRoot,
        "bad-controlled-executor-activation-red-team-sandbox-final-safety-summary-report.json",
      );
      await writeFile(summaryPath, "{}\n", "utf8");

      const coverage =
        await writeHermesTaskFlowRegistryControlledExecutorActivationRedTeamSandboxFinalSafetySummaryCoverageReportArtifact(
          {
            repoRoot,
            controlledExecutorActivationRedTeamSandboxFinalSafetySummaryReportPath: summaryPath,
          },
        );

      expect(coverage.report.status).toBe("blocked");
      expect(coverage.report.operation).toBe("blocked");
      expect(coverage.report.validation_status).toBe("fail");
      expect(coverage.report.coverage.final_safety_summary_ready).toBe(false);
      expect(coverage.report.coverage.coverage_ratio).toBe(0);
      expect(coverage.report.operator_approved).toBe(false);
      expect(coverage.report.execution_started).toBe(false);
      expect(coverage.report.model_invoked).toBe(false);
      expect(coverage.report.memory_write).toBe(false);
      expect(coverage.report.hermes_config_write).toBe(false);
      expect(coverage.report.hermes_prefill_write).toBe(false);
      expect(coverage.report.failures).toContain(
        "schema must equal openclaw.hermes.taskflow_registry_controlled_executor_activation_red_team_sandbox_final_safety_summary_report.v1",
      );
    } finally {
      await rm(repoRoot, { recursive: true, force: true });
    }
  });
  it("writes a read-only red-team-only sandbox operator handoff packet", async () => {
    const repoRoot = await mkdtemp(join(tmpdir(), "hermes-flow-"));
    try {
      const packet =
        await buildControlledExecutorActivationRedTeamSandboxOperatorHandoffPacket(repoRoot);
      const persisted = JSON.parse(await readFile(packet.path, "utf8"));

      expect(packet.packet.schema).toBe(
        "openclaw.hermes.taskflow_registry_controlled_executor_activation_red_team_sandbox_operator_handoff_packet.v1",
      );
      expect(packet.packet.status).toBe("handoff_ready");
      expect(packet.packet.operation).toBe("create");
      expect(packet.packet.validation_status).toBe("pass");
      expect(packet.packet.failures).toEqual([]);
      expect(packet.packet.handoff.final_safety_summary_coverage_pass).toBe(true);
      expect(packet.packet.handoff.coverage_ratio_complete).toBe(true);
      expect(packet.packet.handoff.final_safety_summary_ready).toBe(true);
      expect(packet.packet.handoff.summary_ratio_complete).toBe(true);
      expect(packet.packet.handoff.approval_challenge_coverage_pass).toBe(true);
      expect(packet.packet.handoff.fixture_is_not_approval).toBe(true);
      expect(packet.packet.handoff.manual_review_checklist.length).toBeGreaterThan(0);
      expect(packet.packet.handoff.approval_challenge_reference).toContain("approval challenge");
      expect(packet.packet.handoff.rollback_acknowledgement).toContain("rollback");
      expect(packet.packet.handoff.disabled_path_confirmation).toContain(
        "model invocation disabled",
      );
      expect(packet.packet.handoff.packet_is_not_approval).toBe(true);
      expect(packet.packet.handoff.operator_approval_still_false).toBe(true);
      expect(packet.packet.handoff.execution_started_still_false).toBe(true);
      expect(packet.packet.handoff.registry_write_disabled).toBe(true);
      expect(packet.packet.handoff.sqlite_write_disabled).toBe(true);
      expect(packet.packet.handoff.worker_execution_disabled).toBe(true);
      expect(packet.packet.handoff.model_invocation_disabled).toBe(true);
      expect(packet.packet.handoff.memory_write_disabled).toBe(true);
      expect(packet.packet.handoff.hermes_config_write_disabled).toBe(true);
      expect(packet.packet.handoff.hermes_prefill_write_disabled).toBe(true);
      expect(packet.packet.handoff.handoff_ratio).toBe(1);
      expect(packet.packet.operator_approved).toBe(false);
      expect(packet.packet.execution_started).toBe(false);
      expect(packet.packet.taskflow_registry_write).toBe(false);
      expect(packet.packet.sqlite_write).toBe(false);
      expect(packet.packet.worker_execution).toBe(false);
      expect(packet.packet.model_invoked).toBe(false);
      expect(packet.packet.memory_write).toBe(false);
      expect(packet.packet.hermes_config_write).toBe(false);
      expect(packet.packet.hermes_prefill_write).toBe(false);
      expect(packet.packet.next_safe_task).toContain("handoff packet coverage");
      expect(persisted.status).toBe("handoff_ready");
    } finally {
      await rm(repoRoot, { recursive: true, force: true });
    }
  });

  it("blocks red-team-only sandbox operator handoff packet when coverage is invalid", async () => {
    const repoRoot = await mkdtemp(join(tmpdir(), "hermes-flow-"));
    try {
      const coveragePath = join(
        repoRoot,
        "bad-controlled-executor-activation-red-team-sandbox-final-safety-summary-coverage-report.json",
      );
      await writeFile(coveragePath, "{}\n", "utf8");

      const packet =
        await writeHermesTaskFlowRegistryControlledExecutorActivationRedTeamSandboxOperatorHandoffPacketArtifact(
          {
            repoRoot,
            controlledExecutorActivationRedTeamSandboxFinalSafetySummaryCoverageReportPath:
              coveragePath,
          },
        );

      expect(packet.packet.status).toBe("blocked");
      expect(packet.packet.operation).toBe("blocked");
      expect(packet.packet.validation_status).toBe("fail");
      expect(packet.packet.handoff.final_safety_summary_coverage_pass).toBe(false);
      expect(packet.packet.handoff.handoff_ratio).toBe(0);
      expect(packet.packet.operator_approved).toBe(false);
      expect(packet.packet.execution_started).toBe(false);
      expect(packet.packet.model_invoked).toBe(false);
      expect(packet.packet.memory_write).toBe(false);
      expect(packet.packet.hermes_config_write).toBe(false);
      expect(packet.packet.hermes_prefill_write).toBe(false);
      expect(packet.packet.failures).toContain(
        "schema must equal openclaw.hermes.taskflow_registry_controlled_executor_activation_red_team_sandbox_final_safety_summary_coverage_report.v1",
      );
    } finally {
      await rm(repoRoot, { recursive: true, force: true });
    }
  });
  it("blocks real writer activation approval token fixture when lock is invalid", async () => {
    const repoRoot = await mkdtemp(join(tmpdir(), "hermes-flow-"));
    try {
      const lockPath = join(repoRoot, "bad-real-writer-final-readiness-lock-report.json");
      await writeFile(lockPath, "{}\n", "utf8");

      const fixture =
        await writeHermesTaskFlowRegistryRealWriterActivationApprovalTokenFixtureArtifact({
          repoRoot,
          realWriterFinalReadinessLockReportPath: lockPath,
        });

      expect(fixture.fixture.status).toBe("blocked");
      expect(fixture.fixture.operation).toBe("blocked");
      expect(fixture.fixture.validation_status).toBe("fail");
      expect(fixture.fixture.preconditions.final_readiness_lock_green).toBe(false);
      expect(fixture.fixture.preconditions.all_writes_disabled).toBe(false);
      expect(fixture.fixture.approval_token_boundary.raw_token_persisted).toBe(false);
      expect(fixture.fixture.real_writer_allowed).toBe(false);
      expect(fixture.fixture.registry_write_allowed).toBe(false);
      expect(fixture.fixture.taskflow_registry_write).toBe(false);
      expect(fixture.fixture.sqlite_write).toBe(false);
      expect(fixture.fixture.failures).toContain(
        "schema must equal openclaw.hermes.taskflow_registry_real_writer_final_readiness_lock_report.v1",
      );
    } finally {
      await rm(repoRoot, { recursive: true, force: true });
    }
  });

  it("blocks real writer final readiness lock when coverage is invalid", async () => {
    const repoRoot = await mkdtemp(join(tmpdir(), "hermes-flow-"));
    try {
      const coveragePath = join(
        repoRoot,
        "bad-real-writer-promotion-preflight-coverage-report.json",
      );
      await writeFile(coveragePath, "{}\n", "utf8");

      const report = await writeHermesTaskFlowRegistryRealWriterFinalReadinessLockReportArtifact({
        repoRoot,
        realWriterPromotionPreflightCoverageReportPath: coveragePath,
      });

      expect(report.report.status).toBe("blocked");
      expect(report.report.operation).toBe("blocked");
      expect(report.report.validation_status).toBe("fail");
      expect(report.report.lock.promotion_preflight_coverage_green).toBe(false);
      expect(report.report.lock.all_writes_disabled).toBe(false);
      expect(report.report.real_writer_allowed).toBe(false);
      expect(report.report.registry_write_allowed).toBe(false);
      expect(report.report.taskflow_registry_write).toBe(false);
      expect(report.report.sqlite_write).toBe(false);
      expect(report.report.failures).toContain(
        "schema must equal openclaw.hermes.taskflow_registry_real_writer_promotion_preflight_coverage_report.v1",
      );
    } finally {
      await rm(repoRoot, { recursive: true, force: true });
    }
  });

  it("blocks real writer promotion preflight coverage when preflight is invalid", async () => {
    const repoRoot = await mkdtemp(join(tmpdir(), "hermes-flow-"));
    try {
      const preflightPath = join(repoRoot, "bad-real-writer-promotion-preflight-report.json");
      await writeFile(preflightPath, "{}\n", "utf8");

      const report =
        await writeHermesTaskFlowRegistryRealWriterPromotionPreflightCoverageReportArtifact({
          repoRoot,
          realWriterPromotionPreflightReportPath: preflightPath,
        });

      expect(report.report.status).toBe("blocked");
      expect(report.report.operation).toBe("blocked");
      expect(report.report.validation_status).toBe("fail");
      expect(report.report.coverage.promotion_preflight_green).toBe(false);
      expect(report.report.coverage.all_writes_disabled).toBe(false);
      expect(report.report.real_writer_allowed).toBe(false);
      expect(report.report.registry_write_allowed).toBe(false);
      expect(report.report.taskflow_registry_write).toBe(false);
      expect(report.report.sqlite_write).toBe(false);
      expect(report.report.failures).toContain(
        "schema must equal openclaw.hermes.taskflow_registry_real_writer_promotion_preflight_report.v1",
      );
    } finally {
      await rm(repoRoot, { recursive: true, force: true });
    }
  });
  it("blocks registry writer review when the read adapter has no snapshot", async () => {
    const repoRoot = await mkdtemp(join(tmpdir(), "hermes-flow-"));
    try {
      const approvalValidation = await buildApprovalValidationFixture(repoRoot);
      const readAdapter = await writeHermesTaskFlowRegistryReadAdapterArtifact({
        repoRoot,
        approvalValidationPath: approvalValidation.path,
      });

      const review = await writeHermesTaskFlowRegistryWriterReviewArtifact({
        repoRoot,
        readAdapterPath: readAdapter.path,
      });

      expect(review.review.status).toBe("blocked");
      expect(review.review.operation).toBe("blocked");
      expect(review.review.proposed_write).toBeNull();
      expect(review.review.taskflow_registry_write).toBe(false);
      expect(review.review.sqlite_write).toBe(false);
      expect(review.review.failures).toContain(
        "registry writer review requires a read adapter with registry_snapshot_read=true",
      );
    } finally {
      await rm(repoRoot, { recursive: true, force: true });
    }
  });
  it("blocks registry read adapter reports when approval validation is invalid", async () => {
    const repoRoot = await mkdtemp(join(tmpdir(), "hermes-flow-"));
    try {
      const validationPath = join(repoRoot, "bad-validation.json");
      await writeFile(validationPath, "{}\n", "utf8");

      const report = await writeHermesTaskFlowRegistryReadAdapterArtifact({
        repoRoot,
        approvalValidationPath: validationPath,
      });

      expect(report.report.status).toBe("blocked");
      expect(report.report.taskflow_registry_write).toBe(false);
      expect(report.report.sqlite_write).toBe(false);
      expect(report.report.comparison.op).toBe("blocked");
      expect(report.report.failures).toContain(
        "schema must equal openclaw.hermes.taskflow_registry_operator_approval.validation.v1",
      );
    } finally {
      await rm(repoRoot, { recursive: true, force: true });
    }
  });
});

describe("Hermes learning state", () => {
  it("appends success and failure records", async () => {
    const repoRoot = await mkdtemp(join(tmpdir(), "hermes-learn-"));
    try {
      const first = await appendHermesLearningRecord({
        repoRoot,
        traceId: "trace-success",
        status: "success",
        summary: "guarded patch passed",
        tags: ["patch", "guarded"],
      });
      const second = await appendHermesLearningRecord({
        repoRoot,
        traceId: "trace-failure",
        status: "failure",
        summary: "test timeout",
      });

      const body = JSON.parse(await readFile(first.path, "utf8")) as {
        success_patterns: unknown[];
        failure_patterns: unknown[];
      };

      expect(first.record.status).toBe("success");
      expect(second.record.status).toBe("failure");
      expect(body.success_patterns.length).toBe(1);
      expect(body.failure_patterns.length).toBe(1);
    } finally {
      await rm(repoRoot, { recursive: true, force: true });
    }
  });
});

describe("Hermes promotion gate", () => {
  it("promotes when validation commands pass", async () => {
    const repoRoot = await mkdtemp(join(tmpdir(), "hermes-promote-"));
    try {
      const promoted = await runHermesPromotionGate({
        repoRoot,
        traceId: "trace-promote",
        validationCommands: ["Write-Output ok"],
        timeoutMs: 20_000,
      });

      expect(promoted.result.validation_passed).toBe(true);
      expect(promoted.result.to).toBe("promoted");
    } finally {
      await rm(repoRoot, { recursive: true, force: true });
    }
  });

  it("rolls back when a validation command fails", async () => {
    const repoRoot = await mkdtemp(join(tmpdir(), "hermes-promote-"));
    try {
      const rolledBack = await runHermesPromotionGate({
        repoRoot,
        traceId: "trace-rollback",
        validationCommands: ["exit 1"],
        timeoutMs: 20_000,
      });

      expect(rolledBack.result.validation_passed).toBe(false);
      expect(rolledBack.result.to).toBe("rolled_back");
      expect(rolledBack.result.rollback_required).toBe(true);
    } finally {
      await rm(repoRoot, { recursive: true, force: true });
    }
  });
});

async function buildRollbackContractFixture(repoRoot: string) {
  const preflight = await buildPromotionPreflightReport(repoRoot);
  return writeHermesTaskFlowRegistryRollbackContractFixtureArtifact({
    repoRoot,
    promotionPreflightReportPath: preflight.path,
    now: new Date("2026-05-07T12:15:00.000Z"),
  });
}
async function buildRollbackContractCoverageReport(repoRoot: string) {
  const fixture = await buildRollbackContractFixture(repoRoot);
  return writeHermesTaskFlowRegistryRollbackContractCoverageReportArtifact({
    repoRoot,
    rollbackContractFixturePath: fixture.path,
    now: new Date("2026-05-07T12:16:00.000Z"),
  });
}
async function buildFinalWriterReadinessSummary(repoRoot: string) {
  const coverage = await buildRollbackContractCoverageReport(repoRoot);
  return writeHermesTaskFlowRegistryFinalWriterReadinessSummaryArtifact({
    repoRoot,
    rollbackContractCoverageReportPath: coverage.path,
    now: new Date("2026-05-07T12:17:00.000Z"),
  });
}
async function buildRealWriterImplementationPlan(repoRoot: string) {
  const readiness = await buildFinalWriterReadinessSummary(repoRoot);
  return writeHermesTaskFlowRegistryRealWriterImplementationPlanArtifact({
    repoRoot,
    finalWriterReadinessSummaryPath: readiness.path,
    now: new Date("2026-05-07T12:18:00.000Z"),
  });
}
async function buildRealWriterImplementationPlanCoverageReport(repoRoot: string) {
  const implementationPlan = await buildRealWriterImplementationPlan(repoRoot);
  return writeHermesTaskFlowRegistryRealWriterImplementationPlanCoverageReportArtifact({
    repoRoot,
    realWriterImplementationPlanPath: implementationPlan.path,
    now: new Date("2026-05-07T12:19:00.000Z"),
  });
}
async function buildRealWriterApiContractFixture(repoRoot: string) {
  const coverage = await buildRealWriterImplementationPlanCoverageReport(repoRoot);
  return writeHermesTaskFlowRegistryRealWriterApiContractFixtureArtifact({
    repoRoot,
    realWriterImplementationPlanCoverageReportPath: coverage.path,
    now: new Date("2026-05-07T12:20:00.000Z"),
  });
}
async function buildRealWriterApiContractCoverageReport(repoRoot: string) {
  const fixture = await buildRealWriterApiContractFixture(repoRoot);
  return writeHermesTaskFlowRegistryRealWriterApiContractCoverageReportArtifact({
    repoRoot,
    realWriterApiContractFixturePath: fixture.path,
    now: new Date("2026-05-07T12:21:00.000Z"),
  });
}
async function buildRealWriterActivationOperatorHandoffPacket(repoRoot: string) {
  const coverage = await buildRealWriterActivationReleaseChecklistCoverageReport(repoRoot);
  return writeHermesTaskFlowRegistryRealWriterActivationOperatorHandoffPacketArtifact({
    repoRoot,
    realWriterActivationReleaseChecklistCoverageReportPath: coverage.path,
    now: new Date("2026-05-07T12:33:00.000Z"),
  });
}
async function buildControlledExecutorFinalReadinessLockCoverageReport(repoRoot: string) {
  const proposerCoverage = await buildNextSafeTaskProposerFixtureCoverageReport(repoRoot);
  const fixture = await writeHermesTaskFlowRegistryTaskDialoguerFixtureArtifact({
    repoRoot,
    nextSafeTaskProposerFixtureCoverageReportPath: proposerCoverage.path,
    now: new Date("2026-05-07T13:24:00.000Z"),
  });
  const fixtureCoverage =
    await writeHermesTaskFlowRegistryTaskDialoguerFixtureCoverageReportArtifact({
      repoRoot,
      taskDialoguerFixturePath: fixture.path,
      now: new Date("2026-05-07T13:25:00.000Z"),
    });
  const handoff = await writeHermesTaskFlowRegistryTaskDialoguerHandoffPackageArtifact({
    repoRoot,
    taskDialoguerFixtureCoverageReportPath: fixtureCoverage.path,
    now: new Date("2026-05-07T13:26:00.000Z"),
  });
  const policy = await writeHermesTaskFlowRegistryTaskDialoguerReasoningPolicyArtifact({
    repoRoot,
    taskDialoguerHandoffPackagePath: handoff.path,
    now: new Date("2026-05-07T13:27:00.000Z"),
  });
  const policyCoverage =
    await writeHermesTaskFlowRegistryTaskDialoguerReasoningPolicyCoverageReportArtifact({
      repoRoot,
      taskDialoguerReasoningPolicyPath: policy.path,
      now: new Date("2026-05-07T13:28:00.000Z"),
    });
  const intakeValidator =
    await writeHermesTaskFlowRegistryControlledExecutorIntakeValidatorArtifact({
      repoRoot,
      taskDialoguerReasoningPolicyCoverageReportPath: policyCoverage.path,
      now: new Date("2026-05-07T13:29:00.000Z"),
    });
  const intakeCoverage =
    await writeHermesTaskFlowRegistryControlledExecutorIntakeCoverageReportArtifact({
      repoRoot,
      controlledExecutorIntakeValidatorPath: intakeValidator.path,
      now: new Date("2026-05-07T13:30:00.000Z"),
    });
  const intakeReleaseSummary =
    await writeHermesTaskFlowRegistryControlledExecutorIntakeReleaseSummaryReportArtifact({
      repoRoot,
      controlledExecutorIntakeCoverageReportPath: intakeCoverage.path,
      now: new Date("2026-05-07T13:31:00.000Z"),
    });
  const preflight =
    await writeHermesTaskFlowRegistryControlledExecutorApprovalPreflightReportArtifact({
      repoRoot,
      controlledExecutorIntakeReleaseSummaryReportPath: intakeReleaseSummary.path,
      now: new Date("2026-05-07T13:32:00.000Z"),
    });
  const preflightCoverage =
    await writeHermesTaskFlowRegistryControlledExecutorApprovalPreflightCoverageReportArtifact({
      repoRoot,
      controlledExecutorApprovalPreflightReportPath: preflight.path,
      now: new Date("2026-05-07T13:33:00.000Z"),
    });
  const finalLock =
    await writeHermesTaskFlowRegistryControlledExecutorFinalReadinessLockReportArtifact({
      repoRoot,
      controlledExecutorApprovalPreflightCoverageReportPath: preflightCoverage.path,
      now: new Date("2026-05-07T13:34:00.000Z"),
    });
  return writeHermesTaskFlowRegistryControlledExecutorFinalReadinessLockCoverageReportArtifact({
    repoRoot,
    controlledExecutorFinalReadinessLockReportPath: finalLock.path,
    now: new Date("2026-05-07T13:35:00.000Z"),
  });
}
async function buildControlledExecutorActivationReleaseChecklistReport(repoRoot: string) {
  const coverage = await buildControlledExecutorFinalReadinessLockCoverageReport(repoRoot);
  return writeHermesTaskFlowRegistryControlledExecutorActivationReleaseChecklistReportArtifact({
    repoRoot,
    controlledExecutorFinalReadinessLockCoverageReportPath: coverage.path,
    now: new Date("2026-05-07T13:48:00.000Z"),
  });
}
async function buildControlledExecutorActivationReleaseChecklistCoverageReport(repoRoot: string) {
  const report = await buildControlledExecutorActivationReleaseChecklistReport(repoRoot);
  return writeHermesTaskFlowRegistryControlledExecutorActivationReleaseChecklistCoverageReportArtifact(
    {
      repoRoot,
      controlledExecutorActivationReleaseChecklistReportPath: report.path,
      now: new Date("2026-05-07T13:49:00.000Z"),
    },
  );
}
async function buildControlledExecutorActivationOperatorHandoffPacketReport(repoRoot: string) {
  const coverage = await buildControlledExecutorActivationReleaseChecklistCoverageReport(repoRoot);
  return writeHermesTaskFlowRegistryControlledExecutorActivationOperatorHandoffPacketReportArtifact(
    {
      repoRoot,
      controlledExecutorActivationReleaseChecklistCoverageReportPath: coverage.path,
      now: new Date("2026-05-07T13:50:00.000Z"),
    },
  );
}
async function buildControlledExecutorActivationOperatorHandoffPacketCoverageReport(
  repoRoot: string,
) {
  const report = await buildControlledExecutorActivationOperatorHandoffPacketReport(repoRoot);
  return writeHermesTaskFlowRegistryControlledExecutorActivationOperatorHandoffPacketCoverageReportArtifact(
    {
      repoRoot,
      controlledExecutorActivationOperatorHandoffPacketReportPath: report.path,
      now: new Date("2026-05-07T13:51:00.000Z"),
    },
  );
}
async function buildControlledExecutorActivationFinalSafetySummaryReport(repoRoot: string) {
  const coverage =
    await buildControlledExecutorActivationOperatorHandoffPacketCoverageReport(repoRoot);
  return writeHermesTaskFlowRegistryControlledExecutorActivationFinalSafetySummaryReportArtifact({
    repoRoot,
    controlledExecutorActivationOperatorHandoffPacketCoverageReportPath: coverage.path,
    now: new Date("2026-05-07T13:52:00.000Z"),
  });
}
async function buildControlledExecutorActivationFinalSafetySummaryCoverageReport(repoRoot: string) {
  const summary = await buildControlledExecutorActivationFinalSafetySummaryReport(repoRoot);
  return writeHermesTaskFlowRegistryControlledExecutorActivationFinalSafetySummaryCoverageReportArtifact(
    {
      repoRoot,
      controlledExecutorActivationFinalSafetySummaryReportPath: summary.path,
      now: new Date("2026-05-07T13:53:00.000Z"),
    },
  );
}
async function buildControlledExecutorActivationNextSafeTaskDecisionReport(repoRoot: string) {
  const coverage =
    await buildControlledExecutorActivationFinalSafetySummaryCoverageReport(repoRoot);
  return writeHermesTaskFlowRegistryControlledExecutorActivationNextSafeTaskDecisionReportArtifact({
    repoRoot,
    controlledExecutorActivationFinalSafetySummaryCoverageReportPath: coverage.path,
    now: new Date("2026-05-07T13:54:00.000Z"),
  });
}
async function buildControlledExecutorActivationExecutionManifestProposalReport(repoRoot: string) {
  const decision = await buildControlledExecutorActivationNextSafeTaskDecisionReport(repoRoot);
  return writeHermesTaskFlowRegistryControlledExecutorActivationExecutionManifestProposalReportArtifact(
    {
      repoRoot,
      controlledExecutorActivationNextSafeTaskDecisionReportPath: decision.path,
      now: new Date("2026-05-07T13:55:00.000Z"),
    },
  );
}
async function buildControlledExecutorActivationExecutionManifestProposalCoverageReport(
  repoRoot: string,
) {
  const proposal = await buildControlledExecutorActivationExecutionManifestProposalReport(repoRoot);
  return writeHermesTaskFlowRegistryControlledExecutorActivationExecutionManifestProposalCoverageReportArtifact(
    {
      repoRoot,
      controlledExecutorActivationExecutionManifestProposalReportPath: proposal.path,
      now: new Date("2026-05-07T13:56:00.000Z"),
    },
  );
}
async function buildControlledExecutorActivationExecutionManifestFinalReadinessSummaryReport(
  repoRoot: string,
) {
  const coverage =
    await buildControlledExecutorActivationExecutionManifestProposalCoverageReport(repoRoot);
  return writeHermesTaskFlowRegistryControlledExecutorActivationExecutionManifestFinalReadinessSummaryReportArtifact(
    {
      repoRoot,
      controlledExecutorActivationExecutionManifestProposalCoverageReportPath: coverage.path,
      now: new Date("2026-05-07T13:57:00.000Z"),
    },
  );
}
async function buildControlledExecutorActivationMemoryLayerSandwichLoopReport(repoRoot: string) {
  const summary =
    await buildControlledExecutorActivationExecutionManifestFinalReadinessSummaryReport(repoRoot);
  return writeHermesTaskFlowRegistryControlledExecutorActivationMemoryLayerSandwichLoopReportArtifact(
    {
      repoRoot,
      controlledExecutorActivationExecutionManifestFinalReadinessSummaryReportPath: summary.path,
      now: new Date("2026-05-07T13:58:00.000Z"),
    },
  );
}
async function buildControlledExecutorActivationMemoryLayerSandwichLoopDryRunReport(
  repoRoot: string,
) {
  const loop = await buildControlledExecutorActivationMemoryLayerSandwichLoopReport(repoRoot);
  return writeHermesTaskFlowRegistryControlledExecutorActivationMemoryLayerSandwichLoopDryRunReportArtifact(
    {
      repoRoot,
      controlledExecutorActivationMemoryLayerSandwichLoopReportPath: loop.path,
      now: new Date("2026-05-07T13:59:00.000Z"),
    },
  );
}
async function buildControlledExecutorActivationGodmodeSafetyLockReport(repoRoot: string) {
  const dryRun =
    await buildControlledExecutorActivationMemoryLayerSandwichLoopDryRunReport(repoRoot);
  return writeHermesTaskFlowRegistryControlledExecutorActivationGodmodeSafetyLockReportArtifact({
    repoRoot,
    controlledExecutorActivationMemoryLayerSandwichLoopDryRunReportPath: dryRun.path,
    now: new Date("2026-05-07T14:00:00.000Z"),
  });
}
async function buildControlledExecutorActivationGodmodeSafetyLockCoverageReport(repoRoot: string) {
  const lock = await buildControlledExecutorActivationGodmodeSafetyLockReport(repoRoot);
  return writeHermesTaskFlowRegistryControlledExecutorActivationGodmodeSafetyLockCoverageReportArtifact(
    {
      repoRoot,
      controlledExecutorActivationGodmodeSafetyLockReportPath: lock.path,
      now: new Date("2026-05-07T14:01:00.000Z"),
    },
  );
}
async function buildControlledExecutorActivationRedTeamSandboxBoundaryPlan(repoRoot: string) {
  const coverage = await buildControlledExecutorActivationGodmodeSafetyLockCoverageReport(repoRoot);
  return writeHermesTaskFlowRegistryControlledExecutorActivationRedTeamSandboxBoundaryPlanArtifact({
    repoRoot,
    controlledExecutorActivationGodmodeSafetyLockCoverageReportPath: coverage.path,
    now: new Date("2026-05-07T14:02:00.000Z"),
  });
}
async function buildControlledExecutorActivationRedTeamSandboxBoundaryPlanCoverageReport(
  repoRoot: string,
) {
  const plan = await buildControlledExecutorActivationRedTeamSandboxBoundaryPlan(repoRoot);
  return writeHermesTaskFlowRegistryControlledExecutorActivationRedTeamSandboxBoundaryPlanCoverageReportArtifact(
    {
      repoRoot,
      controlledExecutorActivationRedTeamSandboxBoundaryPlanPath: plan.path,
      now: new Date("2026-05-07T14:03:00.000Z"),
    },
  );
}
async function buildControlledExecutorActivationRedTeamSandboxOperatorApprovalChallengeFixture(
  repoRoot: string,
) {
  const coverage =
    await buildControlledExecutorActivationRedTeamSandboxBoundaryPlanCoverageReport(repoRoot);
  return writeHermesTaskFlowRegistryControlledExecutorActivationRedTeamSandboxOperatorApprovalChallengeFixtureArtifact(
    {
      repoRoot,
      controlledExecutorActivationRedTeamSandboxBoundaryPlanCoverageReportPath: coverage.path,
      now: new Date("2026-05-07T14:04:00.000Z"),
    },
  );
}
async function buildControlledExecutorActivationRedTeamSandboxOperatorApprovalChallengeCoverageReport(
  repoRoot: string,
) {
  const fixture =
    await buildControlledExecutorActivationRedTeamSandboxOperatorApprovalChallengeFixture(repoRoot);
  return writeHermesTaskFlowRegistryControlledExecutorActivationRedTeamSandboxOperatorApprovalChallengeCoverageReportArtifact(
    {
      repoRoot,
      controlledExecutorActivationRedTeamSandboxOperatorApprovalChallengeFixturePath: fixture.path,
      now: new Date("2026-05-07T14:05:00.000Z"),
    },
  );
}
async function buildControlledExecutorActivationRedTeamSandboxFinalSafetySummaryReport(
  repoRoot: string,
) {
  const coverage =
    await buildControlledExecutorActivationRedTeamSandboxOperatorApprovalChallengeCoverageReport(
      repoRoot,
    );
  return writeHermesTaskFlowRegistryControlledExecutorActivationRedTeamSandboxFinalSafetySummaryReportArtifact(
    {
      repoRoot,
      controlledExecutorActivationRedTeamSandboxOperatorApprovalChallengeCoverageReportPath:
        coverage.path,
      now: new Date("2026-05-07T14:06:00.000Z"),
    },
  );
}
async function buildControlledExecutorActivationRedTeamSandboxFinalSafetySummaryCoverageReport(
  repoRoot: string,
) {
  const summary =
    await buildControlledExecutorActivationRedTeamSandboxFinalSafetySummaryReport(repoRoot);
  return writeHermesTaskFlowRegistryControlledExecutorActivationRedTeamSandboxFinalSafetySummaryCoverageReportArtifact(
    {
      repoRoot,
      controlledExecutorActivationRedTeamSandboxFinalSafetySummaryReportPath: summary.path,
      now: new Date("2026-05-07T14:07:00.000Z"),
    },
  );
}
async function buildControlledExecutorActivationRedTeamSandboxOperatorHandoffPacket(
  repoRoot: string,
) {
  const coverage =
    await buildControlledExecutorActivationRedTeamSandboxFinalSafetySummaryCoverageReport(repoRoot);
  return writeHermesTaskFlowRegistryControlledExecutorActivationRedTeamSandboxOperatorHandoffPacketArtifact(
    {
      repoRoot,
      controlledExecutorActivationRedTeamSandboxFinalSafetySummaryCoverageReportPath: coverage.path,
      now: new Date("2026-05-07T14:08:00.000Z"),
    },
  );
}
async function buildRealWriterActivationOperatorHandoffPacketCoverageReport(repoRoot: string) {
  const packet = await buildRealWriterActivationOperatorHandoffPacket(repoRoot);
  return writeHermesTaskFlowRegistryRealWriterActivationOperatorHandoffPacketCoverageReportArtifact(
    {
      repoRoot,
      realWriterActivationOperatorHandoffPacketPath: packet.path,
      now: new Date("2026-05-07T12:34:00.000Z"),
    },
  );
}
async function buildRealWriterActivationFinalSafetySummary(repoRoot: string) {
  const coverage = await buildRealWriterActivationOperatorHandoffPacketCoverageReport(repoRoot);
  return writeHermesTaskFlowRegistryRealWriterActivationFinalSafetySummaryArtifact({
    repoRoot,
    realWriterActivationOperatorHandoffPacketCoverageReportPath: coverage.path,
    now: new Date("2026-05-07T12:35:00.000Z"),
  });
}
async function buildRealWriterActivationFinalSafetySummaryCoverageReport(repoRoot: string) {
  const summary = await buildRealWriterActivationFinalSafetySummary(repoRoot);
  return writeHermesTaskFlowRegistryRealWriterActivationFinalSafetySummaryCoverageReportArtifact({
    repoRoot,
    realWriterActivationFinalSafetySummaryPath: summary.path,
    now: new Date("2026-05-07T12:36:00.000Z"),
  });
}
async function buildNextSafeTaskProposerFixtureCoverageReport(repoRoot: string) {
  const fixture = await buildNextSafeTaskProposerFixture(repoRoot);
  return writeHermesTaskFlowRegistryNextSafeTaskProposerFixtureCoverageReportArtifact({
    repoRoot,
    nextSafeTaskProposerFixturePath: fixture.path,
    now: new Date("2026-05-07T12:38:00.000Z"),
  });
}
async function buildTaskDialoguerStatusSummaryReport(repoRoot: string) {
  const proposerCoverage = await buildNextSafeTaskProposerFixtureCoverageReport(repoRoot);
  const fixture = await writeHermesTaskFlowRegistryTaskDialoguerFixtureArtifact({
    repoRoot,
    nextSafeTaskProposerFixtureCoverageReportPath: proposerCoverage.path,
    now: new Date("2026-05-07T15:30:00.000Z"),
  });
  const fixtureCoverage =
    await writeHermesTaskFlowRegistryTaskDialoguerFixtureCoverageReportArtifact({
      repoRoot,
      taskDialoguerFixturePath: fixture.path,
      now: new Date("2026-05-07T15:31:00.000Z"),
    });
  const handoff = await writeHermesTaskFlowRegistryTaskDialoguerHandoffPackageArtifact({
    repoRoot,
    taskDialoguerFixtureCoverageReportPath: fixtureCoverage.path,
    now: new Date("2026-05-07T15:32:00.000Z"),
  });
  const policy = await writeHermesTaskFlowRegistryTaskDialoguerReasoningPolicyArtifact({
    repoRoot,
    taskDialoguerHandoffPackagePath: handoff.path,
    now: new Date("2026-05-07T15:33:00.000Z"),
  });
  const policyCoverage =
    await writeHermesTaskFlowRegistryTaskDialoguerReasoningPolicyCoverageReportArtifact({
      repoRoot,
      taskDialoguerReasoningPolicyPath: policy.path,
      now: new Date("2026-05-07T15:34:00.000Z"),
    });

  return writeHermesTaskFlowRegistryTaskDialoguerStatusSummaryReportArtifact({
    repoRoot,
    taskDialoguerReasoningPolicyCoverageReportPath: policyCoverage.path,
    now: new Date("2026-05-07T15:35:00.000Z"),
  });
}
async function buildNextSafeTaskProposerFixture(repoRoot: string) {
  const coverage = await buildRealWriterActivationFinalSafetySummaryCoverageReport(repoRoot);
  return writeHermesTaskFlowRegistryNextSafeTaskProposerFixtureArtifact({
    repoRoot,
    realWriterActivationFinalSafetySummaryCoverageReportPath: coverage.path,
    now: new Date("2026-05-07T12:37:00.000Z"),
  });
}
async function buildRealWriterActivationReleaseChecklistCoverageReport(repoRoot: string) {
  const checklist = await buildRealWriterActivationReleaseChecklistReport(repoRoot);
  return writeHermesTaskFlowRegistryRealWriterActivationReleaseChecklistCoverageReportArtifact({
    repoRoot,
    realWriterActivationReleaseChecklistReportPath: checklist.path,
    now: new Date("2026-05-07T12:32:00.000Z"),
  });
}
async function buildRealWriterActivationReleaseChecklistReport(repoRoot: string) {
  const coverage = await buildRealWriterActivationFinalReadinessLockCoverageReport(repoRoot);
  return writeHermesTaskFlowRegistryRealWriterActivationReleaseChecklistReportArtifact({
    repoRoot,
    realWriterActivationFinalReadinessLockCoverageReportPath: coverage.path,
    now: new Date("2026-05-07T12:31:00.000Z"),
  });
}
async function buildRealWriterActivationFinalReadinessLockCoverageReport(repoRoot: string) {
  const lock = await buildRealWriterActivationFinalReadinessLockReport(repoRoot);
  return writeHermesTaskFlowRegistryRealWriterActivationFinalReadinessLockCoverageReportArtifact({
    repoRoot,
    realWriterActivationFinalReadinessLockReportPath: lock.path,
    now: new Date("2026-05-07T12:30:00.000Z"),
  });
}
async function buildRealWriterActivationFinalReadinessLockReport(repoRoot: string) {
  const coverage = await buildRealWriterActivationApprovalPreflightCoverageReport(repoRoot);
  return writeHermesTaskFlowRegistryRealWriterActivationFinalReadinessLockReportArtifact({
    repoRoot,
    realWriterActivationApprovalPreflightCoverageReportPath: coverage.path,
    now: new Date("2026-05-07T12:29:00.000Z"),
  });
}
async function buildRealWriterActivationApprovalPreflightCoverageReport(repoRoot: string) {
  const preflight = await buildRealWriterActivationApprovalPreflightReport(repoRoot);
  return writeHermesTaskFlowRegistryRealWriterActivationApprovalPreflightCoverageReportArtifact({
    repoRoot,
    realWriterActivationApprovalPreflightReportPath: preflight.path,
    now: new Date("2026-05-07T12:28:00.000Z"),
  });
}
async function buildRealWriterActivationApprovalPreflightReport(repoRoot: string) {
  const coverage = await buildRealWriterActivationApprovalTokenCoverageReport(repoRoot);
  return writeHermesTaskFlowRegistryRealWriterActivationApprovalPreflightReportArtifact({
    repoRoot,
    realWriterActivationApprovalTokenCoverageReportPath: coverage.path,
    now: new Date("2026-05-07T12:27:00.000Z"),
  });
}
async function buildRealWriterActivationApprovalTokenCoverageReport(repoRoot: string) {
  const fixture = await buildRealWriterActivationApprovalTokenFixture(repoRoot);
  return writeHermesTaskFlowRegistryRealWriterActivationApprovalTokenCoverageReportArtifact({
    repoRoot,
    realWriterActivationApprovalTokenFixturePath: fixture.path,
    now: new Date("2026-05-07T12:26:00.000Z"),
  });
}
async function buildRealWriterActivationApprovalTokenFixture(repoRoot: string) {
  const lockReport = await buildRealWriterFinalReadinessLockReport(repoRoot);
  return writeHermesTaskFlowRegistryRealWriterActivationApprovalTokenFixtureArtifact({
    repoRoot,
    realWriterFinalReadinessLockReportPath: lockReport.path,
    now: new Date("2026-05-07T12:25:00.000Z"),
  });
}
async function buildRealWriterFinalReadinessLockReport(repoRoot: string) {
  const coverage = await buildRealWriterPromotionPreflightCoverageReport(repoRoot);
  return writeHermesTaskFlowRegistryRealWriterFinalReadinessLockReportArtifact({
    repoRoot,
    realWriterPromotionPreflightCoverageReportPath: coverage.path,
    now: new Date("2026-05-07T12:24:00.000Z"),
  });
}
async function buildRealWriterPromotionPreflightCoverageReport(repoRoot: string) {
  const preflight = await buildRealWriterPromotionPreflightReport(repoRoot);
  return writeHermesTaskFlowRegistryRealWriterPromotionPreflightCoverageReportArtifact({
    repoRoot,
    realWriterPromotionPreflightReportPath: preflight.path,
    now: new Date("2026-05-07T12:23:00.000Z"),
  });
}
async function buildRealWriterPromotionPreflightReport(repoRoot: string) {
  const coverage = await buildRealWriterApiContractCoverageReport(repoRoot);
  return writeHermesTaskFlowRegistryRealWriterPromotionPreflightReportArtifact({
    repoRoot,
    realWriterApiContractCoverageReportPath: coverage.path,
    now: new Date("2026-05-07T12:22:00.000Z"),
  });
}
async function buildPromotionPreflightReport(repoRoot: string) {
  const fixture = await buildWriterContractFixture(repoRoot);
  const coverage = await writeHermesTaskFlowRegistryContractCoverageReportArtifact({
    repoRoot,
    writerContractFixturePath: fixture.path,
    now: new Date("2026-05-07T12:13:00.000Z"),
  });
  return writeHermesTaskFlowRegistryPromotionPreflightReportArtifact({
    repoRoot,
    contractCoverageReportPath: coverage.path,
    now: new Date("2026-05-07T12:14:00.000Z"),
  });
}
async function buildWriterContractFixture(repoRoot: string) {
  const approvalValidation = await buildApprovalValidationFixture(repoRoot);
  const snapshotPath = join(repoRoot, "taskflow-registry-snapshot.json");
  await writeFile(snapshotPath, JSON.stringify({ flows: [] }), "utf8");
  const readAdapter = await writeHermesTaskFlowRegistryReadAdapterArtifact({
    repoRoot,
    approvalValidationPath: approvalValidation.path,
    registrySnapshotPath: snapshotPath,
  });
  const review = await writeHermesTaskFlowRegistryWriterReviewArtifact({
    repoRoot,
    readAdapterPath: readAdapter.path,
  });
  const apply = await writeHermesTaskFlowRegistryNoopWriterApplyArtifact({
    repoRoot,
    writerReviewPath: review.path,
  });
  const token = "approve:" + approvalValidation.validation.flow_id + ":create:taskflow-registry";
  const tokenValidation = await writeHermesTaskFlowRegistryApprovalTokenValidationArtifact({
    repoRoot,
    noopApplyPath: apply.path,
    token,
  });
  return writeHermesTaskFlowRegistryWriterContractFixtureArtifact({
    repoRoot,
    approvalTokenValidationPath: tokenValidation.path,
    now: new Date("2026-05-07T12:12:00.000Z"),
  });
}
async function buildApprovalValidationFixture(repoRoot: string) {
  const skeletonArtifact = await writeHermesTaskFlowSkeletonArtifact({
    repoRoot,
    outputDir: "reports/hermes-agent/state",
    request: "connect Hermes and OpenClaw as a controlled self-improvement loop",
    currentModel: "ollama/qwen3:14b",
    now: new Date("2026-05-07T12:00:00.000Z"),
  });
  const staging = await writeHermesTaskFlowRegistryStagingArtifact({
    repoRoot,
    artifactPath: skeletonArtifact.path,
    now: new Date("2026-05-07T12:02:00.000Z"),
  });
  const gate = await writeHermesTaskFlowRegistryPromotionGateArtifact({
    repoRoot,
    stagingPath: staging.path,
    now: new Date("2026-05-07T12:03:00.000Z"),
  });
  const noopWrite = await writeHermesTaskFlowRegistryNoopWriteArtifact({
    repoRoot,
    gatePath: gate.path,
    now: new Date("2026-05-07T12:04:00.000Z"),
  });
  const preview = await writeHermesTaskFlowRegistryPreviewDiffArtifact({
    repoRoot,
    noopWritePath: noopWrite.path,
    now: new Date("2026-05-07T12:05:00.000Z"),
  });
  const approval = await writeHermesTaskFlowRegistryOperatorApprovalRequestArtifact({
    repoRoot,
    previewPath: preview.path,
    now: new Date("2026-05-07T12:06:00.000Z"),
  });
  return writeHermesTaskFlowRegistryOperatorApprovalValidationArtifact({
    repoRoot,
    approvalPath: approval.path,
    now: new Date("2026-05-07T12:07:00.000Z"),
  });
}
