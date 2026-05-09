import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { OpenClawConfig } from "openclaw/plugin-sdk/config-types";
import { describe, expect, it, vi } from "vitest";
import {
  buildHermesModelDecision,
  writeHermesModelDecisionArtifact,
  writeHermesModelDecisionCoverageReportArtifact,
  writeHermesModelDecisionHandoffPlanArtifact,
  writeHermesModelDecisionHandoffIntakeCoverageReportArtifact,
  writeHermesModelDecisionIntakeActivationPreflightReportArtifact,
  writeHermesModelDecisionIntakeActivationPreflightCoverageReportArtifact,
  writeHermesModelDecisionIntakeActivationFinalReadinessSummaryReportArtifact,
  writeHermesModelDecisionIntakeActivationFinalReadinessSummaryCoverageReportArtifact,
  writeHermesModelDecisionIntakeActivationExecutionManifestProposalReportArtifact,
  writeHermesModelDecisionIntakeActivationExecutionManifestProposalCoverageReportArtifact,
  writeHermesModelDecisionIntakeActivationExecutionManifestFinalReadinessSummaryReportArtifact,
  writeHermesModelDecisionIntakeActivationExecutionManifestFinalReadinessSummaryCoverageReportArtifact,
  writeHermesModelDecisionIntakeActivationExecutionManifestNextSafeTaskDecisionReportArtifact,
  writeHermesModelDecisionIntakeActivationExecutionManifestNextSafeTaskDecisionCoverageReportArtifact,
  writeHermesModelDecisionIntakeActivationExecutionManifestActivationReadinessDeltaReportArtifact,
  writeHermesModelDecisionIntakeReleaseSummaryCoverageReportArtifact,
  writeHermesModelDecisionIntakeReleaseSummaryReportArtifact,
  type HermesModelDecisionRuntime,
} from "./model-decision.js";

const FIXED_NOW = new Date("2026-05-06T11:30:00.000Z");
const TEST_CFG = {} as OpenClawConfig;

describe("Hermes model decisions", () => {
  it("uses the configured OpenClaw model runtime and parses decision JSON", async () => {
    const runtime = createRuntime({
      text: JSON.stringify({
        summary: "Safe bounded fix.",
        action_plan: ["Inspect Hermes.", "Patch the smallest model seam."],
        validation_commands: ["pnpm test extensions/hermes-agent/src/model-decision.test.ts"],
        risk_notes: ["Dry-run only."],
      }),
    });

    const decision = await buildHermesModelDecision({
      request: "fix Hermes model routing",
      now: FIXED_NOW,
      runtime,
    });

    expect(decision.schema).toBe("openclaw.hermes.model_decision.v1");
    expect(decision.provider).toBe("ollama");
    expect(decision.model).toBe("qwen3:14b");
    expect(decision.agent_id).toBe("dev");
    expect(decision.model_invoked).toBe(true);
    expect(decision.parsed_model_json).toBe(true);
    expect(decision.decision.action_plan).toEqual([
      "Inspect Hermes.",
      "Patch the smallest model seam.",
    ]);
    expect(runtime.prepareSimpleCompletionModelForAgent).toHaveBeenCalledWith(
      expect.objectContaining({
        agentId: "dev",
        allowMissingApiKeyModes: ["aws-sdk"],
        skipPiDiscovery: true,
      }),
    );
  });

  it("keeps trading and payment requests behind deterministic approval gates", async () => {
    const runtime = createRuntime({
      text: JSON.stringify({
        summary: "Review only.",
        action_plan: ["Do not execute the order."],
        validation_commands: ["git diff --check"],
        risk_notes: ["Human approval required."],
      }),
    });

    const decision = await buildHermesModelDecision({
      request: "place a trade order",
      now: FIXED_NOW,
      runtime,
    });

    expect(decision.risk_class).toBe("trading_payment");
    expect(decision.approval_required).toBe(true);
    expect(decision.approval_request?.required_approver).toBe("human");
    expect(decision.envelope.target_agent).toBe("risk-reviewer");
  });

  it("falls back to the deterministic task package when the model returns prose", async () => {
    const runtime = createRuntime({ text: "Inspect the request and run the targeted test." });

    const decision = await buildHermesModelDecision({
      request: "inspect Hermes docs",
      now: FIXED_NOW,
      runtime,
    });

    expect(decision.parsed_model_json).toBe(false);
    expect(decision.decision.summary).toBe("Inspect the request and run the targeted test.");
    expect(decision.decision.action_plan).toEqual(decision.task_package.concrete_steps);
    expect(decision.decision.validation_commands).toEqual(
      decision.task_package.validation_commands,
    );
  });

  it("normalizes provider JSON that returns summary as a string array", async () => {
    const runtime = createRuntime({
      text: JSON.stringify({
        summary: ["Confirmed read-only boundary.", "No execution."],
        action_plan: ["Inspect docs."],
        validation_commands: ["git diff --check"],
        risk_notes: ["Dry-run only."],
      }),
    });

    const decision = await buildHermesModelDecision({
      request: "inspect Hermes docs",
      now: FIXED_NOW,
      runtime,
    });

    expect(decision.parsed_model_json).toBe(true);
    expect(decision.decision.summary).toBe("Confirmed read-only boundary. No execution.");
  });

  it("rejects codex on the local simple-completion transport", async () => {
    const runtime = createRuntime({ text: "unused", provider: "codex", modelId: "gpt-5.5" });

    await expect(
      buildHermesModelDecision({
        request: "inspect Hermes docs",
        now: FIXED_NOW,
        runtime,
      }),
    ).rejects.toThrow("Codex app-server agent runtime");
  });

  it("writes a model-backed dialogue decision artifact", async () => {
    const repoRoot = await mkdtemp(join(tmpdir(), "hermes-model-decision-"));
    try {
      const runtime = createRuntime({
        text: JSON.stringify({
          summary: "Dialogue started.",
          action_plan: ["Open controlled dialogue.", "Report next safe task."],
          validation_commands: ["git diff --check"],
          risk_notes: [
            "registry writes disabled",
            "SQLite writes disabled",
            "worker execution disabled",
            "live actions disabled",
          ],
        }),
      });

      const artifact = await writeHermesModelDecisionArtifact({
        repoRoot,
        request: "start OpenClaw Hermes model dialogue",
        now: FIXED_NOW,
        runtime,
      });
      const persisted = JSON.parse(await readFile(artifact.path, "utf8"));

      expect(artifact.path.endsWith("-model-backed-dialogue-decision.json")).toBe(true);
      expect(artifact.decision.model_invoked).toBe(true);
      expect(artifact.decision.parsed_model_json).toBe(true);
      expect(artifact.decision.provider).toBe("ollama");
      expect(persisted.model_invoked).toBe(true);
      expect(persisted.decision.risk_notes).toContain("registry writes disabled");
      expect(persisted.decision.risk_notes).toContain("SQLite writes disabled");
      expect(persisted.decision.risk_notes).toContain("worker execution disabled");
      expect(persisted.decision.risk_notes).toContain("live actions disabled");
    } finally {
      await rm(repoRoot, { recursive: true, force: true });
    }
  });

  it("writes a read-only model-backed dialogue decision coverage report", async () => {
    const repoRoot = await mkdtemp(join(tmpdir(), "hermes-model-decision-coverage-"));
    try {
      const runtime = createRuntime({
        text: JSON.stringify({
          summary: "Dialogue started.",
          action_plan: ["Open controlled dialogue.", "Report next safe task."],
          validation_commands: ["git diff --check"],
          risk_notes: [
            "registry writes disabled",
            "SQLite writes disabled",
            "worker execution disabled",
            "live actions disabled",
          ],
        }),
      });

      const decisionArtifact = await writeHermesModelDecisionArtifact({
        repoRoot,
        request: "start OpenClaw Hermes model dialogue",
        now: FIXED_NOW,
        runtime,
      });
      const coverageArtifact = await writeHermesModelDecisionCoverageReportArtifact({
        repoRoot,
        modelDecisionPath: decisionArtifact.path,
        now: FIXED_NOW,
      });
      const persisted = JSON.parse(await readFile(coverageArtifact.path, "utf8"));

      expect(
        coverageArtifact.path.endsWith("-model-backed-dialogue-decision-coverage-report.json"),
      ).toBe(true);
      expect(coverageArtifact.report.schema).toBe(
        "openclaw.hermes.model_decision_coverage_report.v1",
      );
      expect(coverageArtifact.report.status).toBe("coverage_pass");
      expect(coverageArtifact.report.validation_status).toBe("pass");
      expect(coverageArtifact.report.model_invoked).toBe(false);
      expect(coverageArtifact.report.registry_write_allowed).toBe(false);
      expect(coverageArtifact.report.sqlite_write).toBe(false);
      expect(coverageArtifact.report.worker_execution).toBe(false);
      expect(coverageArtifact.report.live_actions_enabled).toBe(false);
      expect(coverageArtifact.report.coverage.coverage_ratio).toBe(1);
      expect(coverageArtifact.report.coverage.source_model_invoked).toBe(true);
      expect(coverageArtifact.report.coverage.registry_writes_disabled).toBe(true);
      expect(persisted.status).toBe("coverage_pass");
      expect(persisted.coverage.coverage_ratio).toBe(1);
    } finally {
      await rm(repoRoot, { recursive: true, force: true });
    }
  });

  it("blocks incomplete model-backed dialogue decision coverage", async () => {
    const repoRoot = await mkdtemp(join(tmpdir(), "hermes-model-decision-blocked-"));
    try {
      const badArtifact = join(repoRoot, "bad-model-backed-dialogue-decision.json");
      await writeFile(
        badArtifact,
        JSON.stringify({
          schema: "wrong",
          model_invoked: false,
          decision: {
            risk_notes: ["registry writes disabled"],
          },
        }) + "\n",
        "utf8",
      );

      const coverageArtifact = await writeHermesModelDecisionCoverageReportArtifact({
        repoRoot,
        modelDecisionPath: badArtifact,
        now: FIXED_NOW,
      });

      expect(coverageArtifact.report.status).toBe("blocked");
      expect(coverageArtifact.report.validation_status).toBe("fail");
      expect(coverageArtifact.report.model_invoked).toBe(false);
      expect(coverageArtifact.report.coverage.source_model_invoked).toBe(false);
      expect(coverageArtifact.report.coverage.coverage_ratio).toBeLessThan(1);
      expect(coverageArtifact.report.failures).toContain(
        "schema must equal openclaw.hermes.model_decision.v1",
      );
    } finally {
      await rm(repoRoot, { recursive: true, force: true });
    }
  });
  it("writes a read-only model-backed dialogue decision handoff plan", async () => {
    const repoRoot = await mkdtemp(join(tmpdir(), "hermes-model-decision-handoff-"));
    try {
      const runtime = createRuntime({
        text: JSON.stringify({
          summary: "Dialogue started.",
          action_plan: ["Open controlled dialogue.", "Report next safe task."],
          validation_commands: ["git diff --check"],
          risk_notes: [
            "registry writes disabled",
            "SQLite writes disabled",
            "worker execution disabled",
            "live actions disabled",
          ],
        }),
      });

      const decisionArtifact = await writeHermesModelDecisionArtifact({
        repoRoot,
        request: "start OpenClaw Hermes model dialogue",
        now: FIXED_NOW,
        runtime,
      });
      const coverageArtifact = await writeHermesModelDecisionCoverageReportArtifact({
        repoRoot,
        modelDecisionPath: decisionArtifact.path,
        now: FIXED_NOW,
      });
      const handoffArtifact = await writeHermesModelDecisionHandoffPlanArtifact({
        repoRoot,
        modelDecisionCoverageReportPath: coverageArtifact.path,
        now: FIXED_NOW,
      });
      const persisted = JSON.parse(await readFile(handoffArtifact.path, "utf8"));

      expect(
        handoffArtifact.path.endsWith("-model-backed-dialogue-decision-handoff-plan.json"),
      ).toBe(true);
      expect(handoffArtifact.plan.schema).toBe("openclaw.hermes.model_decision_handoff_plan.v1");
      expect(handoffArtifact.plan.status).toBe("handoff_ready");
      expect(handoffArtifact.plan.validation_status).toBe("pass");
      expect(handoffArtifact.plan.handoff.context_type).toBe("controlled_executor_intake_context");
      expect(handoffArtifact.plan.handoff.model_dialogue_coverage_pass).toBe(true);
      expect(handoffArtifact.plan.handoff.intake_context_only).toBe(true);
      expect(handoffArtifact.plan.handoff.operator_approval_granted).toBe(false);
      expect(handoffArtifact.plan.handoff.execution_start_allowed).toBe(false);
      expect(handoffArtifact.plan.handoff.registry_writer_allowed).toBe(false);
      expect(handoffArtifact.plan.handoff.sqlite_writer_allowed).toBe(false);
      expect(handoffArtifact.plan.handoff.worker_execution_allowed).toBe(false);
      expect(handoffArtifact.plan.handoff.model_caller_allowed).toBe(false);
      expect(handoffArtifact.plan.handoff.live_actions_allowed).toBe(false);
      expect(handoffArtifact.plan.handoff.handoff_ratio).toBe(1);
      expect(handoffArtifact.plan.operator_approved).toBe(false);
      expect(handoffArtifact.plan.execution_started).toBe(false);
      expect(handoffArtifact.plan.model_invoked).toBe(false);
      expect(persisted.status).toBe("handoff_ready");
      expect(persisted.handoff.handoff_ratio).toBe(1);
    } finally {
      await rm(repoRoot, { recursive: true, force: true });
    }
  });

  it("blocks model-backed dialogue handoff when coverage is incomplete", async () => {
    const repoRoot = await mkdtemp(join(tmpdir(), "hermes-model-decision-handoff-blocked-"));
    try {
      const badCoverage = join(repoRoot, "bad-model-backed-dialogue-decision-coverage-report.json");
      await writeFile(
        badCoverage,
        JSON.stringify({
          schema: "openclaw.hermes.model_decision_coverage_report.v1",
          dry_run: true,
          read_only: true,
          trace_id: "bad-trace",
          source_model_decision: "reports/hermes-agent/state/bad.json",
          status: "blocked",
          validation_status: "fail",
          failures: ["bad coverage"],
          coverage: {
            coverage_ratio: 0,
          },
          registry_write_allowed: false,
          taskflow_registry_write: false,
          sqlite_write: false,
          worker_execution: false,
          model_invoked: false,
          live_actions_enabled: false,
          blocked_actions: ["blocked"],
          rollback_path: "discard",
          next_safe_task: "fix coverage",
        }) + "\n",
        "utf8",
      );

      const handoffArtifact = await writeHermesModelDecisionHandoffPlanArtifact({
        repoRoot,
        modelDecisionCoverageReportPath: badCoverage,
        now: FIXED_NOW,
      });

      expect(handoffArtifact.plan.status).toBe("blocked");
      expect(handoffArtifact.plan.validation_status).toBe("fail");
      expect(handoffArtifact.plan.handoff.model_dialogue_coverage_pass).toBe(false);
      expect(handoffArtifact.plan.handoff.handoff_ratio).toBeLessThan(1);
      expect(handoffArtifact.plan.operator_approved).toBe(false);
      expect(handoffArtifact.plan.execution_started).toBe(false);
      expect(handoffArtifact.plan.model_invoked).toBe(false);
      expect(handoffArtifact.plan.failures.length).toBeGreaterThan(0);
    } finally {
      await rm(repoRoot, { recursive: true, force: true });
    }
  });
  it("writes a read-only model-backed dialogue handoff intake coverage report", async () => {
    const repoRoot = await mkdtemp(join(tmpdir(), "hermes-model-decision-intake-coverage-"));
    try {
      const runtime = createRuntime({
        text: JSON.stringify({
          summary: "Dialogue started.",
          action_plan: ["Open controlled dialogue.", "Report next safe task."],
          validation_commands: ["git diff --check"],
          risk_notes: [
            "registry writes disabled",
            "SQLite writes disabled",
            "worker execution disabled",
            "live actions disabled",
          ],
        }),
      });

      const decisionArtifact = await writeHermesModelDecisionArtifact({
        repoRoot,
        request: "start OpenClaw Hermes model dialogue",
        now: FIXED_NOW,
        runtime,
      });
      const coverageArtifact = await writeHermesModelDecisionCoverageReportArtifact({
        repoRoot,
        modelDecisionPath: decisionArtifact.path,
        now: FIXED_NOW,
      });
      const handoffArtifact = await writeHermesModelDecisionHandoffPlanArtifact({
        repoRoot,
        modelDecisionCoverageReportPath: coverageArtifact.path,
        now: FIXED_NOW,
      });
      const intakeCoverageArtifact =
        await writeHermesModelDecisionHandoffIntakeCoverageReportArtifact({
          repoRoot,
          handoffPlanPath: handoffArtifact.path,
          now: FIXED_NOW,
        });
      const persisted = JSON.parse(await readFile(intakeCoverageArtifact.path, "utf8"));

      expect(
        intakeCoverageArtifact.path.endsWith(
          "-model-backed-dialogue-handoff-intake-coverage-report.json",
        ),
      ).toBe(true);
      expect(intakeCoverageArtifact.report.schema).toBe(
        "openclaw.hermes.model_decision_handoff_intake_coverage_report.v1",
      );
      expect(intakeCoverageArtifact.report.status).toBe("coverage_pass");
      expect(intakeCoverageArtifact.report.validation_status).toBe("pass");
      expect(intakeCoverageArtifact.report.coverage.handoff_ready).toBe(true);
      expect(intakeCoverageArtifact.report.coverage.controlled_executor_intake_context).toBe(true);
      expect(intakeCoverageArtifact.report.coverage.intake_context_only).toBe(true);
      expect(intakeCoverageArtifact.report.coverage.operator_approval_false).toBe(true);
      expect(intakeCoverageArtifact.report.coverage.execution_started_false).toBe(true);
      expect(intakeCoverageArtifact.report.coverage.registry_writes_disabled).toBe(true);
      expect(intakeCoverageArtifact.report.coverage.sqlite_writes_disabled).toBe(true);
      expect(intakeCoverageArtifact.report.coverage.worker_execution_disabled).toBe(true);
      expect(intakeCoverageArtifact.report.coverage.model_invocation_disabled).toBe(true);
      expect(intakeCoverageArtifact.report.coverage.live_actions_disabled).toBe(true);
      expect(intakeCoverageArtifact.report.coverage.coverage_ratio).toBe(1);
      expect(intakeCoverageArtifact.report.operator_approved).toBe(false);
      expect(intakeCoverageArtifact.report.execution_started).toBe(false);
      expect(intakeCoverageArtifact.report.model_invoked).toBe(false);
      expect(persisted.status).toBe("coverage_pass");
      expect(persisted.coverage.coverage_ratio).toBe(1);
    } finally {
      await rm(repoRoot, { recursive: true, force: true });
    }
  });

  it("blocks intake coverage when the model-backed dialogue handoff is incomplete", async () => {
    const repoRoot = await mkdtemp(join(tmpdir(), "hermes-model-decision-intake-blocked-"));
    try {
      const badHandoff = join(repoRoot, "bad-model-backed-dialogue-decision-handoff-plan.json");
      await writeFile(
        badHandoff,
        JSON.stringify({
          schema: "openclaw.hermes.model_decision_handoff_plan.v1",
          dry_run: true,
          read_only: true,
          trace_id: "bad-trace",
          source_coverage_report: "reports/hermes-agent/state/bad-coverage.json",
          source_model_decision: "reports/hermes-agent/state/bad-decision.json",
          status: "blocked",
          validation_status: "fail",
          failures: ["bad handoff"],
          handoff: {
            context_type: "controlled_executor_intake_context",
            handoff_ratio: 0,
          },
          operator_approved: false,
          execution_started: false,
          registry_write_allowed: false,
          taskflow_registry_write: false,
          sqlite_write: false,
          worker_execution: false,
          model_invoked: false,
          live_actions_enabled: false,
          blocked_actions: ["blocked"],
          rollback_path: "discard",
          next_safe_task: "fix handoff",
        }) + "\n",
        "utf8",
      );

      const intakeCoverageArtifact =
        await writeHermesModelDecisionHandoffIntakeCoverageReportArtifact({
          repoRoot,
          handoffPlanPath: badHandoff,
          now: FIXED_NOW,
        });

      expect(intakeCoverageArtifact.report.status).toBe("blocked");
      expect(intakeCoverageArtifact.report.validation_status).toBe("fail");
      expect(intakeCoverageArtifact.report.coverage.handoff_ready).toBe(false);
      expect(intakeCoverageArtifact.report.coverage.coverage_ratio).toBeLessThan(1);
      expect(intakeCoverageArtifact.report.operator_approved).toBe(false);
      expect(intakeCoverageArtifact.report.execution_started).toBe(false);
      expect(intakeCoverageArtifact.report.model_invoked).toBe(false);
      expect(intakeCoverageArtifact.report.failures.length).toBeGreaterThan(0);
    } finally {
      await rm(repoRoot, { recursive: true, force: true });
    }
  });

  it("writes a read-only model-backed dialogue intake release summary report", async () => {
    const repoRoot = await mkdtemp(join(tmpdir(), "hermes-model-decision-intake-release-summary-"));
    try {
      const runtime = createRuntime({
        text: JSON.stringify({
          summary: "Dialogue started.",
          action_plan: ["Open controlled dialogue.", "Report next safe task."],
          validation_commands: ["git diff --check"],
          risk_notes: [
            "registry writes disabled",
            "SQLite writes disabled",
            "worker execution disabled",
            "live actions disabled",
          ],
        }),
      });

      const decisionArtifact = await writeHermesModelDecisionArtifact({
        repoRoot,
        request: "start OpenClaw Hermes model dialogue",
        now: FIXED_NOW,
        runtime,
      });
      const coverageArtifact = await writeHermesModelDecisionCoverageReportArtifact({
        repoRoot,
        modelDecisionPath: decisionArtifact.path,
        now: FIXED_NOW,
      });
      const handoffArtifact = await writeHermesModelDecisionHandoffPlanArtifact({
        repoRoot,
        modelDecisionCoverageReportPath: coverageArtifact.path,
        now: FIXED_NOW,
      });
      const intakeCoverageArtifact =
        await writeHermesModelDecisionHandoffIntakeCoverageReportArtifact({
          repoRoot,
          handoffPlanPath: handoffArtifact.path,
          now: FIXED_NOW,
        });
      const releaseSummaryArtifact =
        await writeHermesModelDecisionIntakeReleaseSummaryReportArtifact({
          repoRoot,
          intakeCoverageReportPath: intakeCoverageArtifact.path,
          now: FIXED_NOW,
        });
      const persisted = JSON.parse(await readFile(releaseSummaryArtifact.path, "utf8"));

      expect(
        releaseSummaryArtifact.path.endsWith(
          "-model-backed-dialogue-intake-release-summary-report.json",
        ),
      ).toBe(true);
      expect(releaseSummaryArtifact.report.schema).toBe(
        "openclaw.hermes.model_decision_intake_release_summary_report.v1",
      );
      expect(releaseSummaryArtifact.report.status).toBe("summary_ready");
      expect(releaseSummaryArtifact.report.validation_status).toBe("pass");
      expect(releaseSummaryArtifact.report.summary.intake_coverage_green).toBe(true);
      expect(releaseSummaryArtifact.report.summary.handoff_ready).toBe(true);
      expect(releaseSummaryArtifact.report.summary.controlled_executor_intake_context).toBe(true);
      expect(releaseSummaryArtifact.report.summary.intake_context_only).toBe(true);
      expect(releaseSummaryArtifact.report.summary.operator_approval_false).toBe(true);
      expect(releaseSummaryArtifact.report.summary.execution_started_false).toBe(true);
      expect(releaseSummaryArtifact.report.summary.registry_writes_disabled).toBe(true);
      expect(releaseSummaryArtifact.report.summary.sqlite_writes_disabled).toBe(true);
      expect(releaseSummaryArtifact.report.summary.worker_execution_disabled).toBe(true);
      expect(releaseSummaryArtifact.report.summary.model_invocation_disabled).toBe(true);
      expect(releaseSummaryArtifact.report.summary.live_actions_disabled).toBe(true);
      expect(releaseSummaryArtifact.report.summary.summary_ratio).toBe(1);
      expect(releaseSummaryArtifact.report.operator_approved).toBe(false);
      expect(releaseSummaryArtifact.report.execution_started).toBe(false);
      expect(releaseSummaryArtifact.report.model_invoked).toBe(false);
      expect(persisted.status).toBe("summary_ready");
      expect(persisted.summary.summary_ratio).toBe(1);
    } finally {
      await rm(repoRoot, { recursive: true, force: true });
    }
  });

  it("blocks intake release summary when intake coverage is incomplete", async () => {
    const repoRoot = await mkdtemp(
      join(tmpdir(), "hermes-model-decision-intake-release-summary-blocked-"),
    );
    try {
      const badCoverage = join(
        repoRoot,
        "bad-model-backed-dialogue-handoff-intake-coverage-report.json",
      );
      await writeFile(
        badCoverage,
        JSON.stringify({
          schema: "openclaw.hermes.model_decision_handoff_intake_coverage_report.v1",
          dry_run: true,
          read_only: true,
          source_handoff_plan: "reports/hermes-agent/state/bad-handoff.json",
          trace_id: "bad-trace",
          status: "blocked",
          validation_status: "fail",
          failures: ["bad intake coverage"],
          coverage: {
            handoff_ready: false,
            controlled_executor_intake_context: true,
            intake_context_only: true,
            operator_approval_false: true,
            execution_started_false: true,
            registry_writes_disabled: true,
            sqlite_writes_disabled: true,
            worker_execution_disabled: true,
            model_invocation_disabled: true,
            live_actions_disabled: true,
            coverage_ratio: 0.9,
          },
          operator_approved: false,
          execution_started: false,
          registry_write_allowed: false,
          taskflow_registry_write: false,
          sqlite_write: false,
          worker_execution: false,
          model_invoked: false,
          live_actions_enabled: false,
          blocked_actions: ["blocked"],
          rollback_path: "discard",
          next_safe_task: "fix intake coverage",
        }) + "\n",
        "utf8",
      );

      const releaseSummaryArtifact =
        await writeHermesModelDecisionIntakeReleaseSummaryReportArtifact({
          repoRoot,
          intakeCoverageReportPath: badCoverage,
          now: FIXED_NOW,
        });

      expect(releaseSummaryArtifact.report.status).toBe("blocked");
      expect(releaseSummaryArtifact.report.validation_status).toBe("fail");
      expect(releaseSummaryArtifact.report.summary.intake_coverage_green).toBe(false);
      expect(releaseSummaryArtifact.report.summary.summary_ratio).toBeLessThan(1);
      expect(releaseSummaryArtifact.report.operator_approved).toBe(false);
      expect(releaseSummaryArtifact.report.execution_started).toBe(false);
      expect(releaseSummaryArtifact.report.model_invoked).toBe(false);
      expect(releaseSummaryArtifact.report.failures.length).toBeGreaterThan(0);
    } finally {
      await rm(repoRoot, { recursive: true, force: true });
    }
  });
  it("writes a read-only model-backed dialogue intake release summary coverage report", async () => {
    const repoRoot = await mkdtemp(
      join(tmpdir(), "hermes-model-decision-intake-release-summary-coverage-"),
    );
    try {
      const runtime = createRuntime({
        text: JSON.stringify({
          summary: "Dialogue started.",
          action_plan: ["Open controlled dialogue.", "Report next safe task."],
          validation_commands: ["git diff --check"],
          risk_notes: [
            "registry writes disabled",
            "SQLite writes disabled",
            "worker execution disabled",
            "live actions disabled",
          ],
        }),
      });

      const decisionArtifact = await writeHermesModelDecisionArtifact({
        repoRoot,
        request: "start OpenClaw Hermes model dialogue",
        now: FIXED_NOW,
        runtime,
      });
      const coverageArtifact = await writeHermesModelDecisionCoverageReportArtifact({
        repoRoot,
        modelDecisionPath: decisionArtifact.path,
        now: FIXED_NOW,
      });
      const handoffArtifact = await writeHermesModelDecisionHandoffPlanArtifact({
        repoRoot,
        modelDecisionCoverageReportPath: coverageArtifact.path,
        now: FIXED_NOW,
      });
      const intakeCoverageArtifact =
        await writeHermesModelDecisionHandoffIntakeCoverageReportArtifact({
          repoRoot,
          handoffPlanPath: handoffArtifact.path,
          now: FIXED_NOW,
        });
      const releaseSummaryArtifact =
        await writeHermesModelDecisionIntakeReleaseSummaryReportArtifact({
          repoRoot,
          intakeCoverageReportPath: intakeCoverageArtifact.path,
          now: FIXED_NOW,
        });
      const coverageReportArtifact =
        await writeHermesModelDecisionIntakeReleaseSummaryCoverageReportArtifact({
          repoRoot,
          releaseSummaryReportPath: releaseSummaryArtifact.path,
          now: FIXED_NOW,
        });
      const persisted = JSON.parse(await readFile(coverageReportArtifact.path, "utf8"));

      expect(
        coverageReportArtifact.path.endsWith(
          "-model-backed-dialogue-intake-release-summary-coverage-report.json",
        ),
      ).toBe(true);
      expect(coverageReportArtifact.report.schema).toBe(
        "openclaw.hermes.model_decision_intake_release_summary_coverage_report.v1",
      );
      expect(coverageReportArtifact.report.status).toBe("coverage_pass");
      expect(coverageReportArtifact.report.validation_status).toBe("pass");
      expect(coverageReportArtifact.report.coverage.release_summary_ready).toBe(true);
      expect(coverageReportArtifact.report.coverage.intake_coverage_green).toBe(true);
      expect(coverageReportArtifact.report.coverage.handoff_ready).toBe(true);
      expect(
        coverageReportArtifact.report.coverage.controlled_executor_intake_context_boundary,
      ).toBe(true);
      expect(coverageReportArtifact.report.coverage.release_summary_not_approval).toBe(true);
      expect(coverageReportArtifact.report.coverage.coverage_report_not_executor).toBe(true);
      expect(coverageReportArtifact.report.coverage.coverage_ratio).toBe(1);
      expect(coverageReportArtifact.report.operator_approved).toBe(false);
      expect(coverageReportArtifact.report.execution_started).toBe(false);
      expect(coverageReportArtifact.report.model_invoked).toBe(false);
      expect(persisted.status).toBe("coverage_pass");
      expect(persisted.coverage.coverage_ratio).toBe(1);
    } finally {
      await rm(repoRoot, { recursive: true, force: true });
    }
  });

  it("blocks intake release summary coverage when release summary is incomplete", async () => {
    const repoRoot = await mkdtemp(
      join(tmpdir(), "hermes-model-decision-intake-release-summary-coverage-blocked-"),
    );
    try {
      const badSummary = join(
        repoRoot,
        "bad-model-backed-dialogue-intake-release-summary-report.json",
      );
      await writeFile(
        badSummary,
        JSON.stringify({
          schema: "openclaw.hermes.model_decision_intake_release_summary_report.v1",
          dry_run: true,
          read_only: true,
          source_intake_coverage_report: "reports/hermes-agent/state/bad-intake.json",
          source_handoff_plan: "reports/hermes-agent/state/bad-handoff.json",
          trace_id: "bad-trace",
          status: "blocked",
          validation_status: "fail",
          failures: ["bad release summary"],
          summary: {
            intake_coverage_green: false,
            handoff_ready: true,
            controlled_executor_intake_context: true,
            intake_context_only: true,
            operator_approval_false: true,
            execution_started_false: true,
            registry_writes_disabled: true,
            sqlite_writes_disabled: true,
            worker_execution_disabled: true,
            model_invocation_disabled: true,
            live_actions_disabled: true,
            summary_ratio: 0.9,
          },
          operator_approved: false,
          execution_started: false,
          registry_write_allowed: false,
          taskflow_registry_write: false,
          sqlite_write: false,
          worker_execution: false,
          model_invoked: false,
          live_actions_enabled: false,
          blocked_actions: ["blocked"],
          rollback_path: "discard",
          next_safe_task: "fix release summary",
        }) + "\n",
        "utf8",
      );

      const coverageReportArtifact =
        await writeHermesModelDecisionIntakeReleaseSummaryCoverageReportArtifact({
          repoRoot,
          releaseSummaryReportPath: badSummary,
          now: FIXED_NOW,
        });

      expect(coverageReportArtifact.report.status).toBe("blocked");
      expect(coverageReportArtifact.report.validation_status).toBe("fail");
      expect(coverageReportArtifact.report.coverage.release_summary_ready).toBe(false);
      expect(coverageReportArtifact.report.coverage.coverage_ratio).toBeLessThan(1);
      expect(coverageReportArtifact.report.operator_approved).toBe(false);
      expect(coverageReportArtifact.report.execution_started).toBe(false);
      expect(coverageReportArtifact.report.model_invoked).toBe(false);
      expect(coverageReportArtifact.report.failures.length).toBeGreaterThan(0);
    } finally {
      await rm(repoRoot, { recursive: true, force: true });
    }
  });

  it("writes a read-only model-backed dialogue controlled executor intake activation preflight report", async () => {
    const repoRoot = await mkdtemp(
      join(tmpdir(), "hermes-model-decision-intake-activation-preflight-"),
    );
    try {
      const runtime = createRuntime({
        text: JSON.stringify({
          summary: "Dialogue started.",
          action_plan: ["Open controlled dialogue.", "Report next safe task."],
          validation_commands: ["git diff --check"],
          risk_notes: [
            "registry writes disabled",
            "SQLite writes disabled",
            "worker execution disabled",
            "live actions disabled",
          ],
        }),
      });

      const decisionArtifact = await writeHermesModelDecisionArtifact({
        repoRoot,
        request: "start OpenClaw Hermes model dialogue",
        now: FIXED_NOW,
        runtime,
      });
      const decisionCoverageArtifact = await writeHermesModelDecisionCoverageReportArtifact({
        repoRoot,
        modelDecisionPath: decisionArtifact.path,
        now: FIXED_NOW,
      });
      const handoffArtifact = await writeHermesModelDecisionHandoffPlanArtifact({
        repoRoot,
        modelDecisionCoverageReportPath: decisionCoverageArtifact.path,
        now: FIXED_NOW,
      });
      const intakeCoverageArtifact =
        await writeHermesModelDecisionHandoffIntakeCoverageReportArtifact({
          repoRoot,
          handoffPlanPath: handoffArtifact.path,
          now: FIXED_NOW,
        });
      const releaseSummaryArtifact =
        await writeHermesModelDecisionIntakeReleaseSummaryReportArtifact({
          repoRoot,
          intakeCoverageReportPath: intakeCoverageArtifact.path,
          now: FIXED_NOW,
        });
      const releaseSummaryCoverageArtifact =
        await writeHermesModelDecisionIntakeReleaseSummaryCoverageReportArtifact({
          repoRoot,
          releaseSummaryReportPath: releaseSummaryArtifact.path,
          now: FIXED_NOW,
        });
      const preflightArtifact =
        await writeHermesModelDecisionIntakeActivationPreflightReportArtifact({
          repoRoot,
          releaseSummaryCoverageReportPath: releaseSummaryCoverageArtifact.path,
          now: FIXED_NOW,
        });
      const persisted = JSON.parse(await readFile(preflightArtifact.path, "utf8"));

      expect(
        preflightArtifact.path.endsWith(
          "-model-backed-dialogue-controlled-executor-intake-activation-preflight-report.json",
        ),
      ).toBe(true);
      expect(preflightArtifact.report.schema).toBe(
        "openclaw.hermes.model_decision_intake_activation_preflight_report.v1",
      );
      expect(preflightArtifact.report.status).toBe("preflight_pass");
      expect(preflightArtifact.report.validation_status).toBe("pass");
      expect(preflightArtifact.report.preflight.release_summary_coverage_green).toBe(true);
      expect(preflightArtifact.report.preflight.release_summary_ready).toBe(true);
      expect(preflightArtifact.report.preflight.intake_coverage_green).toBe(true);
      expect(preflightArtifact.report.preflight.handoff_ready).toBe(true);
      expect(preflightArtifact.report.preflight.controlled_executor_intake_context_boundary).toBe(
        true,
      );
      expect(preflightArtifact.report.preflight.operator_approval_false).toBe(true);
      expect(preflightArtifact.report.preflight.execution_started_false).toBe(true);
      expect(preflightArtifact.report.preflight.registry_writes_disabled).toBe(true);
      expect(preflightArtifact.report.preflight.sqlite_writes_disabled).toBe(true);
      expect(preflightArtifact.report.preflight.worker_execution_disabled).toBe(true);
      expect(preflightArtifact.report.preflight.model_invocation_disabled).toBe(true);
      expect(preflightArtifact.report.preflight.live_actions_disabled).toBe(true);
      expect(preflightArtifact.report.preflight.preflight_ratio).toBe(1);
      expect(preflightArtifact.report.operator_approved).toBe(false);
      expect(preflightArtifact.report.execution_started).toBe(false);
      expect(preflightArtifact.report.model_invoked).toBe(false);
      expect(persisted.status).toBe("preflight_pass");
      expect(persisted.preflight.preflight_ratio).toBe(1);
    } finally {
      await rm(repoRoot, { recursive: true, force: true });
    }
  });

  it("blocks intake activation preflight when release summary coverage is incomplete", async () => {
    const repoRoot = await mkdtemp(
      join(tmpdir(), "hermes-model-decision-intake-activation-preflight-blocked-"),
    );
    try {
      const badCoverage = join(
        repoRoot,
        "bad-model-backed-dialogue-intake-release-summary-coverage-report.json",
      );
      await writeFile(
        badCoverage,
        JSON.stringify({
          schema: "openclaw.hermes.model_decision_intake_release_summary_coverage_report.v1",
          dry_run: true,
          read_only: true,
          source_release_summary_report: "reports/hermes-agent/state/bad-summary.json",
          source_intake_coverage_report: "reports/hermes-agent/state/bad-intake.json",
          source_handoff_plan: "reports/hermes-agent/state/bad-handoff.json",
          trace_id: "bad-trace",
          status: "blocked",
          validation_status: "fail",
          failures: ["bad release summary coverage"],
          coverage: {
            release_summary_ready: false,
            intake_coverage_green: true,
            handoff_ready: true,
            controlled_executor_intake_context_boundary: true,
            intake_context_only: true,
            operator_approval_false: true,
            execution_started_false: true,
            registry_writes_disabled: true,
            sqlite_writes_disabled: true,
            worker_execution_disabled: true,
            model_invocation_disabled: true,
            live_actions_disabled: true,
            release_summary_not_approval: true,
            coverage_report_not_executor: true,
            coverage_ratio: 0.95,
          },
          operator_approved: false,
          execution_started: false,
          registry_write_allowed: false,
          taskflow_registry_write: false,
          sqlite_write: false,
          worker_execution: false,
          model_invoked: false,
          live_actions_enabled: false,
          blocked_actions: ["blocked"],
          rollback_path: "discard",
          next_safe_task: "fix release summary coverage",
        }) + "\n",
        "utf8",
      );

      const preflightArtifact =
        await writeHermesModelDecisionIntakeActivationPreflightReportArtifact({
          repoRoot,
          releaseSummaryCoverageReportPath: badCoverage,
          now: FIXED_NOW,
        });

      expect(preflightArtifact.report.status).toBe("blocked");
      expect(preflightArtifact.report.validation_status).toBe("fail");
      expect(preflightArtifact.report.preflight.release_summary_coverage_green).toBe(false);
      expect(preflightArtifact.report.preflight.preflight_ratio).toBeLessThan(1);
      expect(preflightArtifact.report.operator_approved).toBe(false);
      expect(preflightArtifact.report.execution_started).toBe(false);
      expect(preflightArtifact.report.model_invoked).toBe(false);
      expect(preflightArtifact.report.failures.length).toBeGreaterThan(0);
    } finally {
      await rm(repoRoot, { recursive: true, force: true });
    }
  });
  it("writes a read-only model-backed dialogue controlled executor intake activation preflight coverage report", async () => {
    const repoRoot = await mkdtemp(
      join(tmpdir(), "hermes-model-decision-intake-activation-preflight-coverage-"),
    );
    try {
      const runtime = createRuntime({
        text: JSON.stringify({
          summary: "Dialogue started.",
          action_plan: ["Open controlled dialogue.", "Report next safe task."],
          validation_commands: ["git diff --check"],
          risk_notes: [
            "registry writes disabled",
            "SQLite writes disabled",
            "worker execution disabled",
            "live actions disabled",
          ],
        }),
      });

      const decisionArtifact = await writeHermesModelDecisionArtifact({
        repoRoot,
        request: "start OpenClaw Hermes model dialogue",
        now: FIXED_NOW,
        runtime,
      });
      const decisionCoverageArtifact = await writeHermesModelDecisionCoverageReportArtifact({
        repoRoot,
        modelDecisionPath: decisionArtifact.path,
        now: FIXED_NOW,
      });
      const handoffArtifact = await writeHermesModelDecisionHandoffPlanArtifact({
        repoRoot,
        modelDecisionCoverageReportPath: decisionCoverageArtifact.path,
        now: FIXED_NOW,
      });
      const intakeCoverageArtifact =
        await writeHermesModelDecisionHandoffIntakeCoverageReportArtifact({
          repoRoot,
          handoffPlanPath: handoffArtifact.path,
          now: FIXED_NOW,
        });
      const releaseSummaryArtifact =
        await writeHermesModelDecisionIntakeReleaseSummaryReportArtifact({
          repoRoot,
          intakeCoverageReportPath: intakeCoverageArtifact.path,
          now: FIXED_NOW,
        });
      const releaseSummaryCoverageArtifact =
        await writeHermesModelDecisionIntakeReleaseSummaryCoverageReportArtifact({
          repoRoot,
          releaseSummaryReportPath: releaseSummaryArtifact.path,
          now: FIXED_NOW,
        });
      const preflightArtifact =
        await writeHermesModelDecisionIntakeActivationPreflightReportArtifact({
          repoRoot,
          releaseSummaryCoverageReportPath: releaseSummaryCoverageArtifact.path,
          now: FIXED_NOW,
        });
      const coverageArtifact =
        await writeHermesModelDecisionIntakeActivationPreflightCoverageReportArtifact({
          repoRoot,
          preflightReportPath: preflightArtifact.path,
          now: FIXED_NOW,
        });
      const persisted = JSON.parse(await readFile(coverageArtifact.path, "utf8"));

      expect(
        coverageArtifact.path.endsWith(
          "-model-backed-dialogue-controlled-executor-intake-activation-preflight-coverage-report.json",
        ),
      ).toBe(true);
      expect(coverageArtifact.report.schema).toBe(
        "openclaw.hermes.model_decision_intake_activation_preflight_coverage_report.v1",
      );
      expect(coverageArtifact.report.status).toBe("coverage_pass");
      expect(coverageArtifact.report.validation_status).toBe("pass");
      expect(coverageArtifact.report.coverage.intake_activation_preflight_green).toBe(true);
      expect(coverageArtifact.report.coverage.release_summary_coverage_green).toBe(true);
      expect(coverageArtifact.report.coverage.release_summary_ready).toBe(true);
      expect(coverageArtifact.report.coverage.intake_coverage_green).toBe(true);
      expect(coverageArtifact.report.coverage.handoff_ready).toBe(true);
      expect(
        coverageArtifact.report.coverage.controlled_executor_intake_context_boundary,
      ).toBe(true);
      expect(coverageArtifact.report.coverage.operator_approval_false).toBe(true);
      expect(coverageArtifact.report.coverage.execution_started_false).toBe(true);
      expect(coverageArtifact.report.coverage.registry_writes_disabled).toBe(true);
      expect(coverageArtifact.report.coverage.sqlite_writes_disabled).toBe(true);
      expect(coverageArtifact.report.coverage.worker_execution_disabled).toBe(true);
      expect(coverageArtifact.report.coverage.model_invocation_disabled).toBe(true);
      expect(coverageArtifact.report.coverage.live_actions_disabled).toBe(true);
      expect(coverageArtifact.report.coverage.preflight_report_not_approval).toBe(true);
      expect(coverageArtifact.report.coverage.coverage_report_not_executor).toBe(true);
      expect(coverageArtifact.report.coverage.coverage_ratio).toBe(1);
      expect(coverageArtifact.report.operator_approved).toBe(false);
      expect(coverageArtifact.report.execution_started).toBe(false);
      expect(coverageArtifact.report.model_invoked).toBe(false);
      expect(persisted.status).toBe("coverage_pass");
      expect(persisted.coverage.coverage_ratio).toBe(1);
    } finally {
      await rm(repoRoot, { recursive: true, force: true });
    }
  });

  it("blocks intake activation preflight coverage when intake activation preflight is incomplete", async () => {
    const repoRoot = await mkdtemp(
      join(tmpdir(), "hermes-model-decision-intake-activation-preflight-coverage-blocked-"),
    );
    try {
      const badPreflight = join(
        repoRoot,
        "bad-model-backed-dialogue-controlled-executor-intake-activation-preflight-report.json",
      );
      await writeFile(
        badPreflight,
        JSON.stringify({
          schema: "openclaw.hermes.model_decision_intake_activation_preflight_report.v1",
          dry_run: true,
          read_only: true,
          source_release_summary_coverage_report:
            "reports/hermes-agent/state/bad-release-summary-coverage.json",
          source_release_summary_report: "reports/hermes-agent/state/bad-release-summary.json",
          source_intake_coverage_report: "reports/hermes-agent/state/bad-intake-coverage.json",
          source_handoff_plan: "reports/hermes-agent/state/bad-handoff-plan.json",
          trace_id: "bad-trace",
          status: "blocked",
          validation_status: "fail",
          failures: ["bad preflight"],
          preflight: {
            release_summary_coverage_green: false,
            release_summary_ready: true,
            intake_coverage_green: true,
            handoff_ready: true,
            controlled_executor_intake_context_boundary: true,
            operator_approval_false: true,
            execution_started_false: true,
            registry_writes_disabled: true,
            sqlite_writes_disabled: true,
            worker_execution_disabled: true,
            model_invocation_disabled: true,
            live_actions_disabled: true,
            preflight_ratio: 0.95,
          },
          operator_approved: false,
          execution_started: false,
          registry_write_allowed: false,
          taskflow_registry_write: false,
          sqlite_write: false,
          worker_execution: false,
          model_invoked: false,
          live_actions_enabled: false,
          blocked_actions: ["blocked"],
          rollback_path: "discard",
          next_safe_task: "fix intake activation preflight",
        }) + "\n",
        "utf8",
      );

      const coverageArtifact =
        await writeHermesModelDecisionIntakeActivationPreflightCoverageReportArtifact({
          repoRoot,
          preflightReportPath: badPreflight,
          now: FIXED_NOW,
        });

      expect(coverageArtifact.report.status).toBe("blocked");
      expect(coverageArtifact.report.validation_status).toBe("fail");
      expect(coverageArtifact.report.coverage.intake_activation_preflight_green).toBe(false);
      expect(coverageArtifact.report.coverage.coverage_ratio).toBeLessThan(1);
      expect(coverageArtifact.report.operator_approved).toBe(false);
      expect(coverageArtifact.report.execution_started).toBe(false);
      expect(coverageArtifact.report.model_invoked).toBe(false);
      expect(coverageArtifact.report.failures.length).toBeGreaterThan(0);
    } finally {
      await rm(repoRoot, { recursive: true, force: true });
    }
  });
  it("writes a read-only model-backed dialogue controlled executor intake activation final readiness summary report", async () => {
    const repoRoot = await mkdtemp(
      join(tmpdir(), "hermes-model-decision-intake-activation-final-readiness-summary-"),
    );
    try {
      const runtime = createRuntime({
        text: JSON.stringify({
          summary: "Dialogue started.",
          action_plan: ["Open controlled dialogue.", "Report next safe task."],
          validation_commands: ["git diff --check"],
          risk_notes: [
            "registry writes disabled",
            "SQLite writes disabled",
            "worker execution disabled",
            "live actions disabled",
          ],
        }),
      });

      const decisionArtifact = await writeHermesModelDecisionArtifact({
        repoRoot,
        request: "start OpenClaw Hermes model dialogue",
        now: FIXED_NOW,
        runtime,
      });
      const decisionCoverageArtifact = await writeHermesModelDecisionCoverageReportArtifact({
        repoRoot,
        modelDecisionPath: decisionArtifact.path,
        now: FIXED_NOW,
      });
      const handoffArtifact = await writeHermesModelDecisionHandoffPlanArtifact({
        repoRoot,
        modelDecisionCoverageReportPath: decisionCoverageArtifact.path,
        now: FIXED_NOW,
      });
      const intakeCoverageArtifact =
        await writeHermesModelDecisionHandoffIntakeCoverageReportArtifact({
          repoRoot,
          handoffPlanPath: handoffArtifact.path,
          now: FIXED_NOW,
        });
      const releaseSummaryArtifact =
        await writeHermesModelDecisionIntakeReleaseSummaryReportArtifact({
          repoRoot,
          intakeCoverageReportPath: intakeCoverageArtifact.path,
          now: FIXED_NOW,
        });
      const releaseSummaryCoverageArtifact =
        await writeHermesModelDecisionIntakeReleaseSummaryCoverageReportArtifact({
          repoRoot,
          releaseSummaryReportPath: releaseSummaryArtifact.path,
          now: FIXED_NOW,
        });
      const preflightArtifact =
        await writeHermesModelDecisionIntakeActivationPreflightReportArtifact({
          repoRoot,
          releaseSummaryCoverageReportPath: releaseSummaryCoverageArtifact.path,
          now: FIXED_NOW,
        });
      const preflightCoverageArtifact =
        await writeHermesModelDecisionIntakeActivationPreflightCoverageReportArtifact({
          repoRoot,
          preflightReportPath: preflightArtifact.path,
          now: FIXED_NOW,
        });
      const summaryArtifact =
        await writeHermesModelDecisionIntakeActivationFinalReadinessSummaryReportArtifact({
          repoRoot,
          preflightCoverageReportPath: preflightCoverageArtifact.path,
          now: FIXED_NOW,
        });
      const persisted = JSON.parse(await readFile(summaryArtifact.path, "utf8"));

      expect(
        summaryArtifact.path.endsWith(
          "-model-backed-dialogue-controlled-executor-intake-activation-final-readiness-summary-report.json",
        ),
      ).toBe(true);
      expect(summaryArtifact.report.schema).toBe(
        "openclaw.hermes.model_decision_intake_activation_final_readiness_summary_report.v1",
      );
      expect(summaryArtifact.report.status).toBe("summary_ready");
      expect(summaryArtifact.report.validation_status).toBe("pass");
      expect(summaryArtifact.report.summary.intake_activation_preflight_coverage_green).toBe(true);
      expect(summaryArtifact.report.summary.intake_activation_preflight_green).toBe(true);
      expect(summaryArtifact.report.summary.release_summary_coverage_green).toBe(true);
      expect(summaryArtifact.report.summary.release_summary_ready).toBe(true);
      expect(summaryArtifact.report.summary.intake_coverage_green).toBe(true);
      expect(summaryArtifact.report.summary.handoff_ready).toBe(true);
      expect(
        summaryArtifact.report.summary.controlled_executor_intake_context_boundary,
      ).toBe(true);
      expect(summaryArtifact.report.summary.operator_approval_false).toBe(true);
      expect(summaryArtifact.report.summary.execution_started_false).toBe(true);
      expect(summaryArtifact.report.summary.registry_writes_disabled).toBe(true);
      expect(summaryArtifact.report.summary.sqlite_writes_disabled).toBe(true);
      expect(summaryArtifact.report.summary.worker_execution_disabled).toBe(true);
      expect(summaryArtifact.report.summary.model_invocation_disabled).toBe(true);
      expect(summaryArtifact.report.summary.live_actions_disabled).toBe(true);
      expect(summaryArtifact.report.summary.final_readiness_summary_not_approval).toBe(true);
      expect(summaryArtifact.report.summary.summary_report_not_executor).toBe(true);
      expect(summaryArtifact.report.summary.summary_ratio).toBe(1);
      expect(summaryArtifact.report.operator_approved).toBe(false);
      expect(summaryArtifact.report.execution_started).toBe(false);
      expect(summaryArtifact.report.model_invoked).toBe(false);
      expect(persisted.status).toBe("summary_ready");
      expect(persisted.summary.summary_ratio).toBe(1);
    } finally {
      await rm(repoRoot, { recursive: true, force: true });
    }
  });

  it("blocks intake activation final readiness summary when intake activation preflight coverage is incomplete", async () => {
    const repoRoot = await mkdtemp(
      join(tmpdir(), "hermes-model-decision-intake-activation-final-readiness-summary-blocked-"),
    );
    try {
      const badCoverage = join(
        repoRoot,
        "bad-model-backed-dialogue-controlled-executor-intake-activation-preflight-coverage-report.json",
      );
      await writeFile(
        badCoverage,
        JSON.stringify({
          schema: "openclaw.hermes.model_decision_intake_activation_preflight_coverage_report.v1",
          dry_run: true,
          read_only: true,
          source_preflight_report: "reports/hermes-agent/state/bad-preflight-report.json",
          source_release_summary_coverage_report:
            "reports/hermes-agent/state/bad-release-summary-coverage.json",
          source_release_summary_report: "reports/hermes-agent/state/bad-release-summary.json",
          source_intake_coverage_report: "reports/hermes-agent/state/bad-intake-coverage.json",
          source_handoff_plan: "reports/hermes-agent/state/bad-handoff-plan.json",
          trace_id: "bad-trace",
          status: "blocked",
          validation_status: "fail",
          failures: ["bad preflight coverage"],
          coverage: {
            intake_activation_preflight_green: false,
            release_summary_coverage_green: true,
            release_summary_ready: true,
            intake_coverage_green: true,
            handoff_ready: true,
            controlled_executor_intake_context_boundary: true,
            operator_approval_false: true,
            execution_started_false: true,
            registry_writes_disabled: true,
            sqlite_writes_disabled: true,
            worker_execution_disabled: true,
            model_invocation_disabled: true,
            live_actions_disabled: true,
            preflight_report_not_approval: true,
            coverage_report_not_executor: true,
            coverage_ratio: 0.95,
          },
          operator_approved: false,
          execution_started: false,
          registry_write_allowed: false,
          taskflow_registry_write: false,
          sqlite_write: false,
          worker_execution: false,
          model_invoked: false,
          live_actions_enabled: false,
          blocked_actions: ["blocked"],
          rollback_path: "discard",
          next_safe_task: "fix preflight coverage",
        }) + "\n",
        "utf8",
      );

      const summaryArtifact =
        await writeHermesModelDecisionIntakeActivationFinalReadinessSummaryReportArtifact({
          repoRoot,
          preflightCoverageReportPath: badCoverage,
          now: FIXED_NOW,
        });

      expect(summaryArtifact.report.status).toBe("blocked");
      expect(summaryArtifact.report.validation_status).toBe("fail");
      expect(summaryArtifact.report.summary.intake_activation_preflight_coverage_green).toBe(false);
      expect(summaryArtifact.report.summary.summary_ratio).toBeLessThan(1);
      expect(summaryArtifact.report.operator_approved).toBe(false);
      expect(summaryArtifact.report.execution_started).toBe(false);
      expect(summaryArtifact.report.model_invoked).toBe(false);
      expect(summaryArtifact.report.failures.length).toBeGreaterThan(0);
    } finally {
      await rm(repoRoot, { recursive: true, force: true });
    }
  });
  it("writes a read-only model-backed dialogue controlled executor intake activation final readiness summary coverage report", async () => {
    const repoRoot = await mkdtemp(
      join(tmpdir(), "hermes-model-decision-intake-activation-final-readiness-summary-coverage-"),
    );
    try {
      const runtime = createRuntime({
        text: JSON.stringify({
          summary: "Dialogue started.",
          action_plan: ["Open controlled dialogue.", "Report next safe task."],
          validation_commands: ["git diff --check"],
          risk_notes: [
            "registry writes disabled",
            "SQLite writes disabled",
            "worker execution disabled",
            "live actions disabled",
          ],
        }),
      });

      const decisionArtifact = await writeHermesModelDecisionArtifact({
        repoRoot,
        request: "start OpenClaw Hermes model dialogue",
        now: FIXED_NOW,
        runtime,
      });
      const decisionCoverageArtifact = await writeHermesModelDecisionCoverageReportArtifact({
        repoRoot,
        modelDecisionPath: decisionArtifact.path,
        now: FIXED_NOW,
      });
      const handoffArtifact = await writeHermesModelDecisionHandoffPlanArtifact({
        repoRoot,
        modelDecisionCoverageReportPath: decisionCoverageArtifact.path,
        now: FIXED_NOW,
      });
      const intakeCoverageArtifact =
        await writeHermesModelDecisionHandoffIntakeCoverageReportArtifact({
          repoRoot,
          handoffPlanPath: handoffArtifact.path,
          now: FIXED_NOW,
        });
      const releaseSummaryArtifact =
        await writeHermesModelDecisionIntakeReleaseSummaryReportArtifact({
          repoRoot,
          intakeCoverageReportPath: intakeCoverageArtifact.path,
          now: FIXED_NOW,
        });
      const releaseSummaryCoverageArtifact =
        await writeHermesModelDecisionIntakeReleaseSummaryCoverageReportArtifact({
          repoRoot,
          releaseSummaryReportPath: releaseSummaryArtifact.path,
          now: FIXED_NOW,
        });
      const preflightArtifact =
        await writeHermesModelDecisionIntakeActivationPreflightReportArtifact({
          repoRoot,
          releaseSummaryCoverageReportPath: releaseSummaryCoverageArtifact.path,
          now: FIXED_NOW,
        });
      const preflightCoverageArtifact =
        await writeHermesModelDecisionIntakeActivationPreflightCoverageReportArtifact({
          repoRoot,
          preflightReportPath: preflightArtifact.path,
          now: FIXED_NOW,
        });
      const summaryArtifact =
        await writeHermesModelDecisionIntakeActivationFinalReadinessSummaryReportArtifact({
          repoRoot,
          preflightCoverageReportPath: preflightCoverageArtifact.path,
          now: FIXED_NOW,
        });
      const coverageArtifact =
        await writeHermesModelDecisionIntakeActivationFinalReadinessSummaryCoverageReportArtifact({
          repoRoot,
          finalReadinessSummaryReportPath: summaryArtifact.path,
          now: FIXED_NOW,
        });
      const persisted = JSON.parse(await readFile(coverageArtifact.path, "utf8"));

      expect(
        coverageArtifact.path.endsWith(
          "-model-backed-dialogue-controlled-executor-intake-activation-final-readiness-summary-coverage-report.json",
        ),
      ).toBe(true);
      expect(coverageArtifact.report.schema).toBe(
        "openclaw.hermes.model_decision_intake_activation_final_readiness_summary_coverage_report.v1",
      );
      expect(coverageArtifact.report.status).toBe("coverage_pass");
      expect(coverageArtifact.report.validation_status).toBe("pass");
      expect(coverageArtifact.report.coverage.final_readiness_summary_ready).toBe(true);
      expect(coverageArtifact.report.coverage.summary_ratio_complete).toBe(true);
      expect(coverageArtifact.report.coverage.intake_activation_preflight_coverage_green).toBe(true);
      expect(coverageArtifact.report.coverage.intake_activation_preflight_green).toBe(true);
      expect(coverageArtifact.report.coverage.release_summary_coverage_green).toBe(true);
      expect(coverageArtifact.report.coverage.release_summary_ready).toBe(true);
      expect(coverageArtifact.report.coverage.intake_coverage_green).toBe(true);
      expect(coverageArtifact.report.coverage.handoff_ready).toBe(true);
      expect(
        coverageArtifact.report.coverage.controlled_executor_intake_context_boundary,
      ).toBe(true);
      expect(coverageArtifact.report.coverage.operator_approval_false).toBe(true);
      expect(coverageArtifact.report.coverage.execution_started_false).toBe(true);
      expect(coverageArtifact.report.coverage.registry_writes_disabled).toBe(true);
      expect(coverageArtifact.report.coverage.sqlite_writes_disabled).toBe(true);
      expect(coverageArtifact.report.coverage.worker_execution_disabled).toBe(true);
      expect(coverageArtifact.report.coverage.model_invocation_disabled).toBe(true);
      expect(coverageArtifact.report.coverage.live_actions_disabled).toBe(true);
      expect(coverageArtifact.report.coverage.final_readiness_summary_not_approval).toBe(true);
      expect(coverageArtifact.report.coverage.coverage_report_not_executor).toBe(true);
      expect(coverageArtifact.report.coverage.coverage_ratio).toBe(1);
      expect(coverageArtifact.report.operator_approved).toBe(false);
      expect(coverageArtifact.report.execution_started).toBe(false);
      expect(coverageArtifact.report.model_invoked).toBe(false);
      expect(persisted.status).toBe("coverage_pass");
      expect(persisted.coverage.coverage_ratio).toBe(1);
    } finally {
      await rm(repoRoot, { recursive: true, force: true });
    }
  });

  it("blocks intake activation final readiness summary coverage when final readiness summary is incomplete", async () => {
    const repoRoot = await mkdtemp(
      join(tmpdir(), "hermes-model-decision-intake-activation-final-readiness-summary-coverage-blocked-"),
    );
    try {
      const badSummary = join(
        repoRoot,
        "bad-model-backed-dialogue-controlled-executor-intake-activation-final-readiness-summary-report.json",
      );
      await writeFile(
        badSummary,
        JSON.stringify({
          schema: "openclaw.hermes.model_decision_intake_activation_final_readiness_summary_report.v1",
          dry_run: true,
          read_only: true,
          source_preflight_coverage_report:
            "reports/hermes-agent/state/bad-preflight-coverage-report.json",
          source_preflight_report: "reports/hermes-agent/state/bad-preflight-report.json",
          source_release_summary_coverage_report:
            "reports/hermes-agent/state/bad-release-summary-coverage-report.json",
          source_release_summary_report: "reports/hermes-agent/state/bad-release-summary-report.json",
          source_intake_coverage_report: "reports/hermes-agent/state/bad-intake-coverage-report.json",
          source_handoff_plan: "reports/hermes-agent/state/bad-handoff-plan.json",
          trace_id: "bad-trace",
          status: "blocked",
          validation_status: "fail",
          failures: ["bad final readiness summary"],
          summary: {
            intake_activation_preflight_coverage_green: false,
            intake_activation_preflight_green: true,
            release_summary_coverage_green: true,
            release_summary_ready: true,
            intake_coverage_green: true,
            handoff_ready: true,
            controlled_executor_intake_context_boundary: true,
            operator_approval_false: true,
            execution_started_false: true,
            registry_writes_disabled: true,
            sqlite_writes_disabled: true,
            worker_execution_disabled: true,
            model_invocation_disabled: true,
            live_actions_disabled: true,
            final_readiness_summary_not_approval: true,
            summary_report_not_executor: true,
            summary_ratio: 0.95,
          },
          operator_approved: false,
          execution_started: false,
          registry_write_allowed: false,
          taskflow_registry_write: false,
          sqlite_write: false,
          worker_execution: false,
          model_invoked: false,
          live_actions_enabled: false,
          blocked_actions: ["blocked"],
          rollback_path: "discard",
          next_safe_task: "fix final readiness summary",
        }) + "\n",
        "utf8",
      );

      const coverageArtifact =
        await writeHermesModelDecisionIntakeActivationFinalReadinessSummaryCoverageReportArtifact({
          repoRoot,
          finalReadinessSummaryReportPath: badSummary,
          now: FIXED_NOW,
        });

      expect(coverageArtifact.report.status).toBe("blocked");
      expect(coverageArtifact.report.validation_status).toBe("fail");
      expect(coverageArtifact.report.coverage.final_readiness_summary_ready).toBe(false);
      expect(coverageArtifact.report.coverage.coverage_ratio).toBeLessThan(1);
      expect(coverageArtifact.report.operator_approved).toBe(false);
      expect(coverageArtifact.report.execution_started).toBe(false);
      expect(coverageArtifact.report.model_invoked).toBe(false);
      expect(coverageArtifact.report.failures.length).toBeGreaterThan(0);
    } finally {
      await rm(repoRoot, { recursive: true, force: true });
    }
  });
  it("writes a read-only model-backed dialogue controlled executor intake activation execution-manifest proposal report", async () => {
    const repoRoot = await mkdtemp(
      join(tmpdir(), "hermes-model-decision-intake-activation-execution-manifest-proposal-"),
    );
    try {
      const runtime = createRuntime({
        text: JSON.stringify({
          summary: "Dialogue started.",
          action_plan: ["Open controlled dialogue.", "Report next safe task."],
          validation_commands: ["git diff --check"],
          risk_notes: [
            "registry writes disabled",
            "SQLite writes disabled",
            "worker execution disabled",
            "live actions disabled",
          ],
        }),
      });

      const decisionArtifact = await writeHermesModelDecisionArtifact({
        repoRoot,
        request: "start OpenClaw Hermes model dialogue",
        now: FIXED_NOW,
        runtime,
      });
      const decisionCoverageArtifact = await writeHermesModelDecisionCoverageReportArtifact({
        repoRoot,
        modelDecisionPath: decisionArtifact.path,
        now: FIXED_NOW,
      });
      const handoffArtifact = await writeHermesModelDecisionHandoffPlanArtifact({
        repoRoot,
        modelDecisionCoverageReportPath: decisionCoverageArtifact.path,
        now: FIXED_NOW,
      });
      const intakeCoverageArtifact = await writeHermesModelDecisionHandoffIntakeCoverageReportArtifact({
        repoRoot,
        handoffPlanPath: handoffArtifact.path,
        now: FIXED_NOW,
      });
      const releaseSummaryArtifact = await writeHermesModelDecisionIntakeReleaseSummaryReportArtifact({
        repoRoot,
        intakeCoverageReportPath: intakeCoverageArtifact.path,
        now: FIXED_NOW,
      });
      const releaseSummaryCoverageArtifact =
        await writeHermesModelDecisionIntakeReleaseSummaryCoverageReportArtifact({
          repoRoot,
          releaseSummaryReportPath: releaseSummaryArtifact.path,
          now: FIXED_NOW,
        });
      const preflightArtifact = await writeHermesModelDecisionIntakeActivationPreflightReportArtifact({
        repoRoot,
        releaseSummaryCoverageReportPath: releaseSummaryCoverageArtifact.path,
        now: FIXED_NOW,
      });
      const preflightCoverageArtifact =
        await writeHermesModelDecisionIntakeActivationPreflightCoverageReportArtifact({
          repoRoot,
          preflightReportPath: preflightArtifact.path,
          now: FIXED_NOW,
        });
      const summaryArtifact =
        await writeHermesModelDecisionIntakeActivationFinalReadinessSummaryReportArtifact({
          repoRoot,
          preflightCoverageReportPath: preflightCoverageArtifact.path,
          now: FIXED_NOW,
        });
      const summaryCoverageArtifact =
        await writeHermesModelDecisionIntakeActivationFinalReadinessSummaryCoverageReportArtifact({
          repoRoot,
          finalReadinessSummaryReportPath: summaryArtifact.path,
          now: FIXED_NOW,
        });
      const proposalArtifact =
        await writeHermesModelDecisionIntakeActivationExecutionManifestProposalReportArtifact({
          repoRoot,
          finalReadinessSummaryCoverageReportPath: summaryCoverageArtifact.path,
          now: FIXED_NOW,
        });
      const persisted = JSON.parse(await readFile(proposalArtifact.path, "utf8"));

      expect(
        proposalArtifact.path.endsWith(
          "-model-backed-dialogue-controlled-executor-intake-activation-execution-manifest-proposal-report.json",
        ),
      ).toBe(true);
      expect(proposalArtifact.report.schema).toBe(
        "openclaw.hermes.model_decision_intake_activation_execution_manifest_proposal_report.v1",
      );
      expect(proposalArtifact.report.status).toBe("proposal_ready");
      expect(proposalArtifact.report.validation_status).toBe("pass");
      expect(proposalArtifact.report.proposal.final_readiness_summary_coverage_green).toBe(true);
      expect(proposalArtifact.report.proposal.final_readiness_summary_ready).toBe(true);
      expect(proposalArtifact.report.proposal.summary_ratio_complete).toBe(true);
      expect(proposalArtifact.report.proposal.approval_required_true).toBe(true);
      expect(proposalArtifact.report.proposal.execution_start_allowed_false).toBe(true);
      expect(proposalArtifact.report.proposal.operator_approval_false).toBe(true);
      expect(proposalArtifact.report.proposal.execution_started_false).toBe(true);
      expect(proposalArtifact.report.proposal.rollback_precondition_present).toBe(true);
      expect(proposalArtifact.report.proposal.required_validation_checklist_complete).toBe(true);
      expect(proposalArtifact.report.proposal.registry_writes_disabled).toBe(true);
      expect(proposalArtifact.report.proposal.sqlite_writes_disabled).toBe(true);
      expect(proposalArtifact.report.proposal.worker_execution_disabled).toBe(true);
      expect(proposalArtifact.report.proposal.model_invocation_disabled).toBe(true);
      expect(proposalArtifact.report.proposal.live_actions_disabled).toBe(true);
      expect(proposalArtifact.report.proposal.proposal_report_not_approval).toBe(true);
      expect(proposalArtifact.report.proposal.proposal_ratio).toBe(1);
      expect(proposalArtifact.report.approval_required).toBe(true);
      expect(proposalArtifact.report.execution_start_allowed).toBe(false);
      expect(proposalArtifact.report.operator_approved).toBe(false);
      expect(proposalArtifact.report.execution_started).toBe(false);
      expect(proposalArtifact.report.model_invoked).toBe(false);
      expect(persisted.status).toBe("proposal_ready");
      expect(persisted.proposal.proposal_ratio).toBe(1);
    } finally {
      await rm(repoRoot, { recursive: true, force: true });
    }
  });

  it("blocks intake activation execution-manifest proposal when final readiness summary coverage is incomplete", async () => {
    const repoRoot = await mkdtemp(
      join(tmpdir(), "hermes-model-decision-intake-activation-execution-manifest-proposal-blocked-"),
    );
    try {
      const badCoverage = join(
        repoRoot,
        "bad-model-backed-dialogue-controlled-executor-intake-activation-final-readiness-summary-coverage-report.json",
      );
      await writeFile(
        badCoverage,
        JSON.stringify({
          schema: "openclaw.hermes.model_decision_intake_activation_final_readiness_summary_coverage_report.v1",
          dry_run: true,
          read_only: true,
          source_final_readiness_summary_report:
            "reports/hermes-agent/state/bad-final-readiness-summary-report.json",
          source_preflight_coverage_report:
            "reports/hermes-agent/state/bad-preflight-coverage-report.json",
          source_preflight_report: "reports/hermes-agent/state/bad-preflight-report.json",
          source_release_summary_coverage_report:
            "reports/hermes-agent/state/bad-release-summary-coverage-report.json",
          source_release_summary_report: "reports/hermes-agent/state/bad-release-summary-report.json",
          source_intake_coverage_report: "reports/hermes-agent/state/bad-intake-coverage-report.json",
          source_handoff_plan: "reports/hermes-agent/state/bad-handoff-plan.json",
          trace_id: "bad-trace",
          status: "blocked",
          validation_status: "fail",
          failures: ["bad final readiness summary coverage"],
          coverage: {
            final_readiness_summary_ready: false,
            summary_ratio_complete: false,
            intake_activation_preflight_coverage_green: true,
            intake_activation_preflight_green: true,
            release_summary_coverage_green: true,
            release_summary_ready: true,
            intake_coverage_green: true,
            handoff_ready: true,
            controlled_executor_intake_context_boundary: true,
            operator_approval_false: true,
            execution_started_false: true,
            registry_writes_disabled: true,
            sqlite_writes_disabled: true,
            worker_execution_disabled: true,
            model_invocation_disabled: true,
            live_actions_disabled: true,
            final_readiness_summary_not_approval: true,
            coverage_report_not_executor: true,
            coverage_ratio: 0.95,
          },
          operator_approved: false,
          execution_started: false,
          registry_write_allowed: false,
          taskflow_registry_write: false,
          sqlite_write: false,
          worker_execution: false,
          model_invoked: false,
          live_actions_enabled: false,
          blocked_actions: ["blocked"],
          rollback_path: "discard",
          next_safe_task: "fix final readiness summary coverage",
        }) + "\n",
        "utf8",
      );

      const proposalArtifact =
        await writeHermesModelDecisionIntakeActivationExecutionManifestProposalReportArtifact({
          repoRoot,
          finalReadinessSummaryCoverageReportPath: badCoverage,
          now: FIXED_NOW,
        });

      expect(proposalArtifact.report.status).toBe("blocked");
      expect(proposalArtifact.report.validation_status).toBe("fail");
      expect(proposalArtifact.report.proposal.final_readiness_summary_coverage_green).toBe(false);
      expect(proposalArtifact.report.proposal.proposal_ratio).toBeLessThan(1);
      expect(proposalArtifact.report.approval_required).toBe(true);
      expect(proposalArtifact.report.execution_start_allowed).toBe(false);
      expect(proposalArtifact.report.operator_approved).toBe(false);
      expect(proposalArtifact.report.execution_started).toBe(false);
      expect(proposalArtifact.report.model_invoked).toBe(false);
      expect(proposalArtifact.report.failures.length).toBeGreaterThan(0);
    } finally {
      await rm(repoRoot, { recursive: true, force: true });
    }
  });
  it("writes a read-only model-backed dialogue controlled executor intake activation execution-manifest proposal coverage report", async () => {
    const repoRoot = await mkdtemp(
      join(tmpdir(), "hermes-model-decision-intake-activation-execution-manifest-proposal-coverage-"),
    );
    try {
      const runtime = createRuntime({
        text: JSON.stringify({
          summary: "Dialogue started.",
          action_plan: ["Open controlled dialogue.", "Report next safe task."],
          validation_commands: ["git diff --check"],
          risk_notes: [
            "registry writes disabled",
            "SQLite writes disabled",
            "worker execution disabled",
            "live actions disabled",
          ],
        }),
      });

      const decisionArtifact = await writeHermesModelDecisionArtifact({
        repoRoot,
        request: "start OpenClaw Hermes model dialogue",
        now: FIXED_NOW,
        runtime,
      });
      const decisionCoverageArtifact = await writeHermesModelDecisionCoverageReportArtifact({
        repoRoot,
        modelDecisionPath: decisionArtifact.path,
        now: FIXED_NOW,
      });
      const handoffArtifact = await writeHermesModelDecisionHandoffPlanArtifact({
        repoRoot,
        modelDecisionCoverageReportPath: decisionCoverageArtifact.path,
        now: FIXED_NOW,
      });
      const intakeCoverageArtifact = await writeHermesModelDecisionHandoffIntakeCoverageReportArtifact({
        repoRoot,
        handoffPlanPath: handoffArtifact.path,
        now: FIXED_NOW,
      });
      const releaseSummaryArtifact = await writeHermesModelDecisionIntakeReleaseSummaryReportArtifact({
        repoRoot,
        intakeCoverageReportPath: intakeCoverageArtifact.path,
        now: FIXED_NOW,
      });
      const releaseSummaryCoverageArtifact =
        await writeHermesModelDecisionIntakeReleaseSummaryCoverageReportArtifact({
          repoRoot,
          releaseSummaryReportPath: releaseSummaryArtifact.path,
          now: FIXED_NOW,
        });
      const preflightArtifact = await writeHermesModelDecisionIntakeActivationPreflightReportArtifact({
        repoRoot,
        releaseSummaryCoverageReportPath: releaseSummaryCoverageArtifact.path,
        now: FIXED_NOW,
      });
      const preflightCoverageArtifact =
        await writeHermesModelDecisionIntakeActivationPreflightCoverageReportArtifact({
          repoRoot,
          preflightReportPath: preflightArtifact.path,
          now: FIXED_NOW,
        });
      const summaryArtifact =
        await writeHermesModelDecisionIntakeActivationFinalReadinessSummaryReportArtifact({
          repoRoot,
          preflightCoverageReportPath: preflightCoverageArtifact.path,
          now: FIXED_NOW,
        });
      const summaryCoverageArtifact =
        await writeHermesModelDecisionIntakeActivationFinalReadinessSummaryCoverageReportArtifact({
          repoRoot,
          finalReadinessSummaryReportPath: summaryArtifact.path,
          now: FIXED_NOW,
        });
      const proposalArtifact =
        await writeHermesModelDecisionIntakeActivationExecutionManifestProposalReportArtifact({
          repoRoot,
          finalReadinessSummaryCoverageReportPath: summaryCoverageArtifact.path,
          now: FIXED_NOW,
        });
      const coverageArtifact =
        await writeHermesModelDecisionIntakeActivationExecutionManifestProposalCoverageReportArtifact({
          repoRoot,
          executionManifestProposalReportPath: proposalArtifact.path,
          now: FIXED_NOW,
        });
      const persisted = JSON.parse(await readFile(coverageArtifact.path, "utf8"));

      expect(
        coverageArtifact.path.endsWith(
          "-model-backed-dialogue-controlled-executor-intake-activation-execution-manifest-proposal-coverage-report.json",
        ),
      ).toBe(true);
      expect(coverageArtifact.report.schema).toBe(
        "openclaw.hermes.model_decision_intake_activation_execution_manifest_proposal_coverage_report.v1",
      );
      expect(coverageArtifact.report.status).toBe("coverage_pass");
      expect(coverageArtifact.report.validation_status).toBe("pass");
      expect(coverageArtifact.report.coverage.proposal_ready).toBe(true);
      expect(coverageArtifact.report.coverage.proposal_ratio_complete).toBe(true);
      expect(coverageArtifact.report.coverage.approval_required_true).toBe(true);
      expect(coverageArtifact.report.coverage.execution_start_allowed_false).toBe(true);
      expect(coverageArtifact.report.coverage.operator_approval_false).toBe(true);
      expect(coverageArtifact.report.coverage.execution_started_false).toBe(true);
      expect(coverageArtifact.report.coverage.rollback_precondition_present).toBe(true);
      expect(coverageArtifact.report.coverage.required_validation_checklist_complete).toBe(true);
      expect(coverageArtifact.report.coverage.registry_writes_disabled).toBe(true);
      expect(coverageArtifact.report.coverage.sqlite_writes_disabled).toBe(true);
      expect(coverageArtifact.report.coverage.worker_execution_disabled).toBe(true);
      expect(coverageArtifact.report.coverage.model_invocation_disabled).toBe(true);
      expect(coverageArtifact.report.coverage.live_actions_disabled).toBe(true);
      expect(coverageArtifact.report.coverage.coverage_report_not_approval).toBe(true);
      expect(coverageArtifact.report.coverage.coverage_ratio).toBe(1);
      expect(coverageArtifact.report.approval_required).toBe(true);
      expect(coverageArtifact.report.execution_start_allowed).toBe(false);
      expect(coverageArtifact.report.operator_approved).toBe(false);
      expect(coverageArtifact.report.execution_started).toBe(false);
      expect(coverageArtifact.report.model_invoked).toBe(false);
      expect(persisted.status).toBe("coverage_pass");
      expect(persisted.coverage.coverage_ratio).toBe(1);
    } finally {
      await rm(repoRoot, { recursive: true, force: true });
    }
  });

  it("blocks intake activation execution-manifest proposal coverage when proposal is incomplete", async () => {
    const repoRoot = await mkdtemp(
      join(tmpdir(), "hermes-model-decision-intake-activation-execution-manifest-proposal-coverage-blocked-"),
    );
    try {
      const badProposal = join(
        repoRoot,
        "bad-model-backed-dialogue-controlled-executor-intake-activation-execution-manifest-proposal-report.json",
      );
      await writeFile(
        badProposal,
        JSON.stringify({
          schema: "openclaw.hermes.model_decision_intake_activation_execution_manifest_proposal_report.v1",
          dry_run: true,
          read_only: true,
          source_final_readiness_summary_coverage_report:
            "reports/hermes-agent/state/bad-final-readiness-summary-coverage-report.json",
          source_final_readiness_summary_report:
            "reports/hermes-agent/state/bad-final-readiness-summary-report.json",
          source_preflight_coverage_report:
            "reports/hermes-agent/state/bad-preflight-coverage-report.json",
          source_preflight_report: "reports/hermes-agent/state/bad-preflight-report.json",
          source_release_summary_coverage_report:
            "reports/hermes-agent/state/bad-release-summary-coverage-report.json",
          source_release_summary_report: "reports/hermes-agent/state/bad-release-summary-report.json",
          source_intake_coverage_report: "reports/hermes-agent/state/bad-intake-coverage-report.json",
          source_handoff_plan: "reports/hermes-agent/state/bad-handoff-plan.json",
          trace_id: "bad-trace",
          status: "blocked",
          validation_status: "fail",
          failures: ["bad proposal"],
          required_validation_checklist: ["check"],
          rollback_precondition: "rollback",
          proposal: {
            final_readiness_summary_coverage_green: false,
            final_readiness_summary_ready: true,
            summary_ratio_complete: true,
            intake_activation_preflight_coverage_green: true,
            intake_activation_preflight_green: true,
            release_summary_coverage_green: true,
            release_summary_ready: true,
            intake_coverage_green: true,
            handoff_ready: true,
            controlled_executor_intake_context_boundary: true,
            approval_required_true: true,
            execution_start_allowed_false: true,
            operator_approval_false: true,
            execution_started_false: true,
            rollback_precondition_present: true,
            required_validation_checklist_complete: true,
            registry_writes_disabled: true,
            sqlite_writes_disabled: true,
            worker_execution_disabled: true,
            model_invocation_disabled: true,
            live_actions_disabled: true,
            proposal_report_not_approval: true,
            proposal_ratio: 0.9,
          },
          approval_required: true,
          execution_start_allowed: false,
          operator_approved: false,
          execution_started: false,
          registry_write_allowed: false,
          taskflow_registry_write: false,
          sqlite_write: false,
          worker_execution: false,
          model_invoked: false,
          live_actions_enabled: false,
          blocked_actions: ["blocked"],
          rollback_path: "discard",
          next_safe_task: "fix proposal",
        }) + "\n",
        "utf8",
      );

      const coverageArtifact =
        await writeHermesModelDecisionIntakeActivationExecutionManifestProposalCoverageReportArtifact({
          repoRoot,
          executionManifestProposalReportPath: badProposal,
          now: FIXED_NOW,
        });

      expect(coverageArtifact.report.status).toBe("blocked");
      expect(coverageArtifact.report.validation_status).toBe("fail");
      expect(coverageArtifact.report.coverage.proposal_ready).toBe(false);
      expect(coverageArtifact.report.coverage.coverage_ratio).toBeLessThan(1);
      expect(coverageArtifact.report.approval_required).toBe(true);
      expect(coverageArtifact.report.execution_start_allowed).toBe(false);
      expect(coverageArtifact.report.operator_approved).toBe(false);
      expect(coverageArtifact.report.execution_started).toBe(false);
      expect(coverageArtifact.report.model_invoked).toBe(false);
      expect(coverageArtifact.report.failures.length).toBeGreaterThan(0);
    } finally {
      await rm(repoRoot, { recursive: true, force: true });
    }
  });
  it("writes a read-only model-backed dialogue controlled executor intake activation execution-manifest final readiness summary report", async () => {
    const repoRoot = await mkdtemp(
      join(tmpdir(), "hermes-model-decision-intake-activation-execution-manifest-final-readiness-summary-"),
    );
    try {
      const runtime = createRuntime({
        text: JSON.stringify({
          summary: "Dialogue started.",
          action_plan: ["Open controlled dialogue.", "Report next safe task."],
          validation_commands: ["git diff --check"],
          risk_notes: [
            "registry writes disabled",
            "SQLite writes disabled",
            "worker execution disabled",
            "live actions disabled",
          ],
        }),
      });

      const decisionArtifact = await writeHermesModelDecisionArtifact({
        repoRoot,
        request: "start OpenClaw Hermes model dialogue",
        now: FIXED_NOW,
        runtime,
      });
      const decisionCoverageArtifact = await writeHermesModelDecisionCoverageReportArtifact({
        repoRoot,
        modelDecisionPath: decisionArtifact.path,
        now: FIXED_NOW,
      });
      const handoffArtifact = await writeHermesModelDecisionHandoffPlanArtifact({
        repoRoot,
        modelDecisionCoverageReportPath: decisionCoverageArtifact.path,
        now: FIXED_NOW,
      });
      const intakeCoverageArtifact = await writeHermesModelDecisionHandoffIntakeCoverageReportArtifact({
        repoRoot,
        handoffPlanPath: handoffArtifact.path,
        now: FIXED_NOW,
      });
      const releaseSummaryArtifact = await writeHermesModelDecisionIntakeReleaseSummaryReportArtifact({
        repoRoot,
        intakeCoverageReportPath: intakeCoverageArtifact.path,
        now: FIXED_NOW,
      });
      const releaseSummaryCoverageArtifact =
        await writeHermesModelDecisionIntakeReleaseSummaryCoverageReportArtifact({
          repoRoot,
          releaseSummaryReportPath: releaseSummaryArtifact.path,
          now: FIXED_NOW,
        });
      const preflightArtifact = await writeHermesModelDecisionIntakeActivationPreflightReportArtifact({
        repoRoot,
        releaseSummaryCoverageReportPath: releaseSummaryCoverageArtifact.path,
        now: FIXED_NOW,
      });
      const preflightCoverageArtifact =
        await writeHermesModelDecisionIntakeActivationPreflightCoverageReportArtifact({
          repoRoot,
          preflightReportPath: preflightArtifact.path,
          now: FIXED_NOW,
        });
      const summaryArtifact =
        await writeHermesModelDecisionIntakeActivationFinalReadinessSummaryReportArtifact({
          repoRoot,
          preflightCoverageReportPath: preflightCoverageArtifact.path,
          now: FIXED_NOW,
        });
      const summaryCoverageArtifact =
        await writeHermesModelDecisionIntakeActivationFinalReadinessSummaryCoverageReportArtifact({
          repoRoot,
          finalReadinessSummaryReportPath: summaryArtifact.path,
          now: FIXED_NOW,
        });
      const proposalArtifact =
        await writeHermesModelDecisionIntakeActivationExecutionManifestProposalReportArtifact({
          repoRoot,
          finalReadinessSummaryCoverageReportPath: summaryCoverageArtifact.path,
          now: FIXED_NOW,
        });
      const proposalCoverageArtifact =
        await writeHermesModelDecisionIntakeActivationExecutionManifestProposalCoverageReportArtifact({
          repoRoot,
          executionManifestProposalReportPath: proposalArtifact.path,
          now: FIXED_NOW,
        });
      const finalSummaryArtifact =
        await writeHermesModelDecisionIntakeActivationExecutionManifestFinalReadinessSummaryReportArtifact({
          repoRoot,
          executionManifestProposalCoverageReportPath: proposalCoverageArtifact.path,
          now: FIXED_NOW,
        });
      const persisted = JSON.parse(await readFile(finalSummaryArtifact.path, "utf8"));

      expect(
        finalSummaryArtifact.path.endsWith(
          "-model-backed-dialogue-controlled-executor-intake-activation-execution-manifest-final-readiness-summary-report.json",
        ),
      ).toBe(true);
      expect(finalSummaryArtifact.report.schema).toBe(
        "openclaw.hermes.model_decision_intake_activation_execution_manifest_final_readiness_summary_report.v1",
      );
      expect(finalSummaryArtifact.report.status).toBe("summary_ready");
      expect(finalSummaryArtifact.report.validation_status).toBe("pass");
      expect(finalSummaryArtifact.report.summary.proposal_coverage_green).toBe(true);
      expect(finalSummaryArtifact.report.summary.proposal_ready).toBe(true);
      expect(finalSummaryArtifact.report.summary.proposal_ratio_complete).toBe(true);
      expect(finalSummaryArtifact.report.summary.approval_required_true).toBe(true);
      expect(finalSummaryArtifact.report.summary.execution_start_allowed_false).toBe(true);
      expect(finalSummaryArtifact.report.summary.operator_approval_false).toBe(true);
      expect(finalSummaryArtifact.report.summary.execution_started_false).toBe(true);
      expect(finalSummaryArtifact.report.summary.rollback_precondition_present).toBe(true);
      expect(finalSummaryArtifact.report.summary.required_validation_checklist_complete).toBe(true);
      expect(finalSummaryArtifact.report.summary.registry_writes_disabled).toBe(true);
      expect(finalSummaryArtifact.report.summary.sqlite_writes_disabled).toBe(true);
      expect(finalSummaryArtifact.report.summary.worker_execution_disabled).toBe(true);
      expect(finalSummaryArtifact.report.summary.model_invocation_disabled).toBe(true);
      expect(finalSummaryArtifact.report.summary.live_actions_disabled).toBe(true);
      expect(finalSummaryArtifact.report.summary.summary_report_not_approval).toBe(true);
      expect(finalSummaryArtifact.report.summary.summary_ratio).toBe(1);
      expect(finalSummaryArtifact.report.approval_required).toBe(true);
      expect(finalSummaryArtifact.report.execution_start_allowed).toBe(false);
      expect(finalSummaryArtifact.report.operator_approved).toBe(false);
      expect(finalSummaryArtifact.report.execution_started).toBe(false);
      expect(finalSummaryArtifact.report.model_invoked).toBe(false);
      expect(persisted.status).toBe("summary_ready");
      expect(persisted.summary.summary_ratio).toBe(1);
    } finally {
      await rm(repoRoot, { recursive: true, force: true });
    }
  });

  it("blocks intake activation execution-manifest final readiness summary when proposal coverage is incomplete", async () => {
    const repoRoot = await mkdtemp(
      join(tmpdir(), "hermes-model-decision-intake-activation-execution-manifest-final-readiness-summary-blocked-"),
    );
    try {
      const badCoverage = join(
        repoRoot,
        "bad-model-backed-dialogue-controlled-executor-intake-activation-execution-manifest-proposal-coverage-report.json",
      );
      await writeFile(
        badCoverage,
        JSON.stringify({
          schema: "openclaw.hermes.model_decision_intake_activation_execution_manifest_proposal_coverage_report.v1",
          dry_run: true,
          read_only: true,
          source_execution_manifest_proposal_report:
            "reports/hermes-agent/state/bad-execution-manifest-proposal-report.json",
          source_final_readiness_summary_coverage_report:
            "reports/hermes-agent/state/bad-final-readiness-summary-coverage-report.json",
          source_final_readiness_summary_report:
            "reports/hermes-agent/state/bad-final-readiness-summary-report.json",
          source_preflight_coverage_report:
            "reports/hermes-agent/state/bad-preflight-coverage-report.json",
          source_preflight_report: "reports/hermes-agent/state/bad-preflight-report.json",
          source_release_summary_coverage_report:
            "reports/hermes-agent/state/bad-release-summary-coverage-report.json",
          source_release_summary_report: "reports/hermes-agent/state/bad-release-summary-report.json",
          source_intake_coverage_report: "reports/hermes-agent/state/bad-intake-coverage-report.json",
          source_handoff_plan: "reports/hermes-agent/state/bad-handoff-plan.json",
          trace_id: "bad-trace",
          status: "blocked",
          validation_status: "fail",
          failures: ["bad coverage"],
          coverage: {
            proposal_ready: false,
            proposal_ratio_complete: false,
            approval_required_true: true,
            execution_start_allowed_false: true,
            operator_approval_false: true,
            execution_started_false: true,
            rollback_precondition_present: true,
            required_validation_checklist_complete: true,
            registry_writes_disabled: true,
            sqlite_writes_disabled: true,
            worker_execution_disabled: true,
            model_invocation_disabled: true,
            live_actions_disabled: true,
            coverage_report_not_approval: true,
            coverage_ratio: 0.9,
          },
          approval_required: true,
          execution_start_allowed: false,
          operator_approved: false,
          execution_started: false,
          registry_write_allowed: false,
          taskflow_registry_write: false,
          sqlite_write: false,
          worker_execution: false,
          model_invoked: false,
          live_actions_enabled: false,
          blocked_actions: ["blocked"],
          rollback_path: "discard",
          next_safe_task: "fix coverage",
        }) + "\n",
        "utf8",
      );

      const finalSummaryArtifact =
        await writeHermesModelDecisionIntakeActivationExecutionManifestFinalReadinessSummaryReportArtifact({
          repoRoot,
          executionManifestProposalCoverageReportPath: badCoverage,
          now: FIXED_NOW,
        });

      expect(finalSummaryArtifact.report.status).toBe("blocked");
      expect(finalSummaryArtifact.report.validation_status).toBe("fail");
      expect(finalSummaryArtifact.report.summary.proposal_coverage_green).toBe(false);
      expect(finalSummaryArtifact.report.summary.summary_ratio).toBeLessThan(1);
      expect(finalSummaryArtifact.report.approval_required).toBe(true);
      expect(finalSummaryArtifact.report.execution_start_allowed).toBe(false);
      expect(finalSummaryArtifact.report.operator_approved).toBe(false);
      expect(finalSummaryArtifact.report.execution_started).toBe(false);
      expect(finalSummaryArtifact.report.model_invoked).toBe(false);
      expect(finalSummaryArtifact.report.failures.length).toBeGreaterThan(0);
    } finally {
      await rm(repoRoot, { recursive: true, force: true });
    }
  });

  it("writes a read-only model-backed dialogue controlled executor intake activation execution-manifest final readiness summary coverage report", async () => {
    const repoRoot = await mkdtemp(
      join(
        tmpdir(),
        "hermes-model-decision-intake-activation-execution-manifest-final-readiness-summary-coverage-",
      ),
    );
    try {
      const summaryPath = join(
        repoRoot,
        "model-backed-dialogue-controlled-executor-intake-activation-execution-manifest-final-readiness-summary-report.json",
      );
      await writeFile(
        summaryPath,
        JSON.stringify({
          schema: "openclaw.hermes.model_decision_intake_activation_execution_manifest_final_readiness_summary_report.v1",
          created_at: FIXED_NOW.toISOString(),
          dry_run: true,
          read_only: true,
          source_execution_manifest_proposal_coverage_report:
            "reports/hermes-agent/state/proposal-coverage-report.json",
          source_execution_manifest_proposal_report:
            "reports/hermes-agent/state/proposal-report.json",
          source_final_readiness_summary_coverage_report:
            "reports/hermes-agent/state/final-readiness-summary-coverage-report.json",
          source_final_readiness_summary_report:
            "reports/hermes-agent/state/final-readiness-summary-report.json",
          source_preflight_coverage_report:
            "reports/hermes-agent/state/preflight-coverage-report.json",
          source_preflight_report: "reports/hermes-agent/state/preflight-report.json",
          source_release_summary_coverage_report:
            "reports/hermes-agent/state/release-summary-coverage-report.json",
          source_release_summary_report: "reports/hermes-agent/state/release-summary-report.json",
          source_intake_coverage_report: "reports/hermes-agent/state/intake-coverage-report.json",
          source_handoff_plan: "reports/hermes-agent/state/handoff-plan.json",
          trace_id: "test-trace",
          status: "summary_ready",
          validation_status: "pass",
          failures: [],
          summary: {
            proposal_coverage_green: true,
            proposal_ready: true,
            proposal_ratio_complete: true,
            approval_required_true: true,
            execution_start_allowed_false: true,
            operator_approval_false: true,
            execution_started_false: true,
            rollback_precondition_present: true,
            required_validation_checklist_complete: true,
            registry_writes_disabled: true,
            sqlite_writes_disabled: true,
            worker_execution_disabled: true,
            model_invocation_disabled: true,
            live_actions_disabled: true,
            summary_report_not_approval: true,
            summary_ratio: 1,
          },
          approval_required: true,
          execution_start_allowed: false,
          operator_approved: false,
          execution_started: false,
          registry_write_allowed: false,
          taskflow_registry_write: false,
          sqlite_write: false,
          worker_execution: false,
          model_invoked: false,
          live_actions_enabled: false,
          blocked_actions: ["blocked"],
          rollback_path: "discard",
          next_safe_task: "next",
        }) + "\n",
        "utf8",
      );

      const coverageArtifact =
        await writeHermesModelDecisionIntakeActivationExecutionManifestFinalReadinessSummaryCoverageReportArtifact(
          {
            repoRoot,
            executionManifestFinalReadinessSummaryReportPath: summaryPath,
            now: FIXED_NOW,
          },
        );
      const persisted = JSON.parse(await readFile(coverageArtifact.path, "utf8"));

      expect(
        coverageArtifact.path.endsWith(
          "-model-backed-dialogue-controlled-executor-intake-activation-execution-manifest-final-readiness-summary-coverage-report.json",
        ),
      ).toBe(true);
      expect(coverageArtifact.report.schema).toBe(
        "openclaw.hermes.model_decision_intake_activation_execution_manifest_final_readiness_summary_coverage_report.v1",
      );
      expect(coverageArtifact.report.status).toBe("coverage_pass");
      expect(coverageArtifact.report.validation_status).toBe("pass");
      expect(coverageArtifact.report.coverage.final_readiness_summary_ready).toBe(true);
      expect(coverageArtifact.report.coverage.summary_ratio_complete).toBe(true);
      expect(coverageArtifact.report.coverage.proposal_coverage_green).toBe(true);
      expect(coverageArtifact.report.coverage.proposal_ready).toBe(true);
      expect(coverageArtifact.report.coverage.proposal_ratio_complete).toBe(true);
      expect(coverageArtifact.report.coverage.approval_required_true).toBe(true);
      expect(coverageArtifact.report.coverage.execution_start_allowed_false).toBe(true);
      expect(coverageArtifact.report.coverage.operator_approval_false).toBe(true);
      expect(coverageArtifact.report.coverage.execution_started_false).toBe(true);
      expect(coverageArtifact.report.coverage.rollback_precondition_present).toBe(true);
      expect(coverageArtifact.report.coverage.required_validation_checklist_complete).toBe(true);
      expect(coverageArtifact.report.coverage.registry_writes_disabled).toBe(true);
      expect(coverageArtifact.report.coverage.sqlite_writes_disabled).toBe(true);
      expect(coverageArtifact.report.coverage.worker_execution_disabled).toBe(true);
      expect(coverageArtifact.report.coverage.model_invocation_disabled).toBe(true);
      expect(coverageArtifact.report.coverage.live_actions_disabled).toBe(true);
      expect(coverageArtifact.report.coverage.coverage_report_not_approval).toBe(true);
      expect(coverageArtifact.report.coverage.coverage_ratio).toBe(1);
      expect(coverageArtifact.report.approval_required).toBe(true);
      expect(coverageArtifact.report.execution_start_allowed).toBe(false);
      expect(coverageArtifact.report.operator_approved).toBe(false);
      expect(coverageArtifact.report.execution_started).toBe(false);
      expect(coverageArtifact.report.model_invoked).toBe(false);
      expect(persisted.status).toBe("coverage_pass");
      expect(persisted.coverage.coverage_ratio).toBe(1);
    } finally {
      await rm(repoRoot, { recursive: true, force: true });
    }
  });

  it("blocks intake activation execution-manifest final readiness summary coverage when final readiness summary is incomplete", async () => {
    const repoRoot = await mkdtemp(
      join(
        tmpdir(),
        "hermes-model-decision-intake-activation-execution-manifest-final-readiness-summary-coverage-blocked-",
      ),
    );
    try {
      const badSummary = join(
        repoRoot,
        "bad-model-backed-dialogue-controlled-executor-intake-activation-execution-manifest-final-readiness-summary-report.json",
      );
      await writeFile(
        badSummary,
        JSON.stringify({
          schema: "openclaw.hermes.model_decision_intake_activation_execution_manifest_final_readiness_summary_report.v1",
          created_at: FIXED_NOW.toISOString(),
          dry_run: true,
          read_only: true,
          source_execution_manifest_proposal_coverage_report:
            "reports/hermes-agent/state/bad-proposal-coverage-report.json",
          source_execution_manifest_proposal_report:
            "reports/hermes-agent/state/bad-proposal-report.json",
          source_final_readiness_summary_coverage_report:
            "reports/hermes-agent/state/bad-final-readiness-summary-coverage-report.json",
          source_final_readiness_summary_report:
            "reports/hermes-agent/state/bad-final-readiness-summary-report.json",
          source_preflight_coverage_report:
            "reports/hermes-agent/state/bad-preflight-coverage-report.json",
          source_preflight_report: "reports/hermes-agent/state/bad-preflight-report.json",
          source_release_summary_coverage_report:
            "reports/hermes-agent/state/bad-release-summary-coverage-report.json",
          source_release_summary_report: "reports/hermes-agent/state/bad-release-summary-report.json",
          source_intake_coverage_report: "reports/hermes-agent/state/bad-intake-coverage-report.json",
          source_handoff_plan: "reports/hermes-agent/state/bad-handoff-plan.json",
          trace_id: "bad-trace",
          status: "blocked",
          validation_status: "fail",
          failures: ["bad summary"],
          summary: {
            proposal_coverage_green: false,
            proposal_ready: true,
            proposal_ratio_complete: true,
            approval_required_true: true,
            execution_start_allowed_false: true,
            operator_approval_false: true,
            execution_started_false: true,
            rollback_precondition_present: true,
            required_validation_checklist_complete: true,
            registry_writes_disabled: true,
            sqlite_writes_disabled: true,
            worker_execution_disabled: true,
            model_invocation_disabled: true,
            live_actions_disabled: true,
            summary_report_not_approval: true,
            summary_ratio: 0.9,
          },
          approval_required: true,
          execution_start_allowed: false,
          operator_approved: false,
          execution_started: false,
          registry_write_allowed: false,
          taskflow_registry_write: false,
          sqlite_write: false,
          worker_execution: false,
          model_invoked: false,
          live_actions_enabled: false,
          blocked_actions: ["blocked"],
          rollback_path: "discard",
          next_safe_task: "fix summary",
        }) + "\n",
        "utf8",
      );

      const coverageArtifact =
        await writeHermesModelDecisionIntakeActivationExecutionManifestFinalReadinessSummaryCoverageReportArtifact(
          {
            repoRoot,
            executionManifestFinalReadinessSummaryReportPath: badSummary,
            now: FIXED_NOW,
          },
        );

      expect(coverageArtifact.report.status).toBe("blocked");
      expect(coverageArtifact.report.validation_status).toBe("fail");
      expect(coverageArtifact.report.coverage.final_readiness_summary_ready).toBe(false);
      expect(coverageArtifact.report.coverage.coverage_ratio).toBeLessThan(1);
      expect(coverageArtifact.report.approval_required).toBe(true);
      expect(coverageArtifact.report.execution_start_allowed).toBe(false);
      expect(coverageArtifact.report.operator_approved).toBe(false);
      expect(coverageArtifact.report.execution_started).toBe(false);
      expect(coverageArtifact.report.model_invoked).toBe(false);
      expect(coverageArtifact.report.failures.length).toBeGreaterThan(0);
    } finally {
      await rm(repoRoot, { recursive: true, force: true });
    }
  });


  it("writes a read-only model-backed dialogue controlled executor intake activation execution-manifest next-safe-task decision report", async () => {
    const repoRoot = await mkdtemp(
      join(
        tmpdir(),
        "hermes-model-decision-intake-activation-execution-manifest-next-safe-task-decision-",
      ),
    );
    try {
      const coveragePath = join(
        repoRoot,
        "model-backed-dialogue-controlled-executor-intake-activation-execution-manifest-final-readiness-summary-coverage-report.json",
      );
      await writeFile(
        coveragePath,
        JSON.stringify({
          schema: "openclaw.hermes.model_decision_intake_activation_execution_manifest_final_readiness_summary_coverage_report.v1",
          created_at: FIXED_NOW.toISOString(),
          dry_run: true,
          read_only: true,
          source_execution_manifest_final_readiness_summary_report:
            "reports/hermes-agent/state/final-readiness-summary-report.json",
          source_execution_manifest_proposal_coverage_report:
            "reports/hermes-agent/state/proposal-coverage-report.json",
          source_execution_manifest_proposal_report:
            "reports/hermes-agent/state/proposal-report.json",
          source_final_readiness_summary_coverage_report:
            "reports/hermes-agent/state/final-readiness-summary-coverage-report.json",
          source_final_readiness_summary_report:
            "reports/hermes-agent/state/final-readiness-summary-report.json",
          source_preflight_coverage_report: "reports/hermes-agent/state/preflight-coverage-report.json",
          source_preflight_report: "reports/hermes-agent/state/preflight-report.json",
          source_release_summary_coverage_report:
            "reports/hermes-agent/state/release-summary-coverage-report.json",
          source_release_summary_report: "reports/hermes-agent/state/release-summary-report.json",
          source_intake_coverage_report: "reports/hermes-agent/state/intake-coverage-report.json",
          source_handoff_plan: "reports/hermes-agent/state/handoff-plan.json",
          trace_id: "test-trace",
          status: "coverage_pass",
          validation_status: "pass",
          failures: [],
          coverage: {
            final_readiness_summary_ready: true,
            summary_ratio_complete: true,
            proposal_coverage_green: true,
            proposal_ready: true,
            proposal_ratio_complete: true,
            approval_required_true: true,
            execution_start_allowed_false: true,
            operator_approval_false: true,
            execution_started_false: true,
            rollback_precondition_present: true,
            required_validation_checklist_complete: true,
            registry_writes_disabled: true,
            sqlite_writes_disabled: true,
            worker_execution_disabled: true,
            model_invocation_disabled: true,
            live_actions_disabled: true,
            coverage_report_not_approval: true,
            coverage_ratio: 1,
          },
          approval_required: true,
          execution_start_allowed: false,
          operator_approved: false,
          execution_started: false,
          registry_write_allowed: false,
          taskflow_registry_write: false,
          sqlite_write: false,
          worker_execution: false,
          model_invoked: false,
          live_actions_enabled: false,
          blocked_actions: ["blocked"],
          rollback_path: "discard",
          next_safe_task: "next",
        }) + "\n",
        "utf8",
      );

      const artifact =
        await writeHermesModelDecisionIntakeActivationExecutionManifestNextSafeTaskDecisionReportArtifact(
          {
            repoRoot,
            executionManifestFinalReadinessSummaryCoverageReportPath: coveragePath,
            now: FIXED_NOW,
          },
        );
      const persisted = JSON.parse(await readFile(artifact.path, "utf8"));

      expect(
        artifact.path.endsWith(
          "-model-backed-dialogue-controlled-executor-intake-activation-execution-manifest-next-safe-task-decision-report.json",
        ),
      ).toBe(true);
      expect(artifact.report.schema).toBe(
        "openclaw.hermes.model_decision_intake_activation_execution_manifest_next_safe_task_decision_report.v1",
      );
      expect(artifact.report.status).toBe("decision_ready");
      expect(artifact.report.validation_status).toBe("pass");
      expect(artifact.report.decision.risk_level).toBe("low");
      expect(artifact.report.decision.boundary_enforced).toBe(true);
      expect(artifact.report.decision.required_preconditions.length).toBeGreaterThan(0);
      expect(artifact.report.approval_required).toBe(true);
      expect(artifact.report.execution_start_allowed).toBe(false);
      expect(artifact.report.operator_approved).toBe(false);
      expect(artifact.report.execution_started).toBe(false);
      expect(artifact.report.registry_write_allowed).toBe(false);
      expect(artifact.report.taskflow_registry_write).toBe(false);
      expect(artifact.report.sqlite_write).toBe(false);
      expect(artifact.report.worker_execution).toBe(false);
      expect(artifact.report.model_invoked).toBe(false);
      expect(artifact.report.live_actions_enabled).toBe(false);
      expect(persisted.status).toBe("decision_ready");
      expect(persisted.decision.boundary_enforced).toBe(true);
    } finally {
      await rm(repoRoot, { recursive: true, force: true });
    }
  });

  it("blocks intake activation execution-manifest next-safe-task decision when final readiness summary coverage is incomplete", async () => {
    const repoRoot = await mkdtemp(
      join(
        tmpdir(),
        "hermes-model-decision-intake-activation-execution-manifest-next-safe-task-decision-blocked-",
      ),
    );
    try {
      const badCoveragePath = join(
        repoRoot,
        "bad-model-backed-dialogue-controlled-executor-intake-activation-execution-manifest-final-readiness-summary-coverage-report.json",
      );
      await writeFile(
        badCoveragePath,
        JSON.stringify({
          schema: "openclaw.hermes.model_decision_intake_activation_execution_manifest_final_readiness_summary_coverage_report.v1",
          created_at: FIXED_NOW.toISOString(),
          dry_run: true,
          read_only: true,
          source_execution_manifest_final_readiness_summary_report:
            "reports/hermes-agent/state/final-readiness-summary-report.json",
          source_execution_manifest_proposal_coverage_report:
            "reports/hermes-agent/state/proposal-coverage-report.json",
          source_execution_manifest_proposal_report:
            "reports/hermes-agent/state/proposal-report.json",
          source_final_readiness_summary_coverage_report:
            "reports/hermes-agent/state/final-readiness-summary-coverage-report.json",
          source_final_readiness_summary_report:
            "reports/hermes-agent/state/final-readiness-summary-report.json",
          source_preflight_coverage_report: "reports/hermes-agent/state/preflight-coverage-report.json",
          source_preflight_report: "reports/hermes-agent/state/preflight-report.json",
          source_release_summary_coverage_report:
            "reports/hermes-agent/state/release-summary-coverage-report.json",
          source_release_summary_report: "reports/hermes-agent/state/release-summary-report.json",
          source_intake_coverage_report: "reports/hermes-agent/state/intake-coverage-report.json",
          source_handoff_plan: "reports/hermes-agent/state/handoff-plan.json",
          trace_id: "bad-trace",
          status: "blocked",
          validation_status: "fail",
          failures: ["bad coverage"],
          coverage: {
            final_readiness_summary_ready: false,
            summary_ratio_complete: false,
            proposal_coverage_green: true,
            proposal_ready: true,
            proposal_ratio_complete: true,
            approval_required_true: true,
            execution_start_allowed_false: true,
            operator_approval_false: true,
            execution_started_false: true,
            rollback_precondition_present: true,
            required_validation_checklist_complete: true,
            registry_writes_disabled: true,
            sqlite_writes_disabled: true,
            worker_execution_disabled: true,
            model_invocation_disabled: true,
            live_actions_disabled: true,
            coverage_report_not_approval: true,
            coverage_ratio: 0.8,
          },
          approval_required: true,
          execution_start_allowed: false,
          operator_approved: false,
          execution_started: false,
          registry_write_allowed: false,
          taskflow_registry_write: false,
          sqlite_write: false,
          worker_execution: false,
          model_invoked: false,
          live_actions_enabled: false,
          blocked_actions: ["blocked"],
          rollback_path: "discard",
          next_safe_task: "fix",
        }) + "\n",
        "utf8",
      );

      const artifact =
        await writeHermesModelDecisionIntakeActivationExecutionManifestNextSafeTaskDecisionReportArtifact(
          {
            repoRoot,
            executionManifestFinalReadinessSummaryCoverageReportPath: badCoveragePath,
            now: FIXED_NOW,
          },
        );

      expect(artifact.report.status).toBe("blocked");
      expect(artifact.report.validation_status).toBe("fail");
      expect(artifact.report.decision.boundary_enforced).toBe(true);
      expect(artifact.report.failures.length).toBeGreaterThan(0);
      expect(artifact.report.execution_started).toBe(false);
      expect(artifact.report.model_invoked).toBe(false);
    } finally {
      await rm(repoRoot, { recursive: true, force: true });
    }
  });


  it("writes a read-only model-backed dialogue controlled executor intake activation execution-manifest next-safe-task decision coverage report", async () => {
    const repoRoot = await mkdtemp(
      join(
        tmpdir(),
        "hermes-model-decision-intake-activation-execution-manifest-next-safe-task-decision-coverage-",
      ),
    );
    try {
      const decisionPath = join(
        repoRoot,
        "model-backed-dialogue-controlled-executor-intake-activation-execution-manifest-next-safe-task-decision-report.json",
      );
      await writeFile(
        decisionPath,
        JSON.stringify({
          schema: "openclaw.hermes.model_decision_intake_activation_execution_manifest_next_safe_task_decision_report.v1",
          created_at: FIXED_NOW.toISOString(),
          dry_run: true,
          read_only: true,
          source_execution_manifest_final_readiness_summary_coverage_report:
            "reports/hermes-agent/state/final-readiness-summary-coverage-report.json",
          source_execution_manifest_final_readiness_summary_report:
            "reports/hermes-agent/state/final-readiness-summary-report.json",
          source_execution_manifest_proposal_coverage_report:
            "reports/hermes-agent/state/proposal-coverage-report.json",
          source_execution_manifest_proposal_report:
            "reports/hermes-agent/state/proposal-report.json",
          source_final_readiness_summary_coverage_report:
            "reports/hermes-agent/state/final-readiness-summary-coverage-report.json",
          source_final_readiness_summary_report:
            "reports/hermes-agent/state/final-readiness-summary-report.json",
          source_preflight_coverage_report: "reports/hermes-agent/state/preflight-coverage-report.json",
          source_preflight_report: "reports/hermes-agent/state/preflight-report.json",
          source_release_summary_coverage_report:
            "reports/hermes-agent/state/release-summary-coverage-report.json",
          source_release_summary_report: "reports/hermes-agent/state/release-summary-report.json",
          source_intake_coverage_report: "reports/hermes-agent/state/intake-coverage-report.json",
          source_handoff_plan: "reports/hermes-agent/state/handoff-plan.json",
          trace_id: "test-trace",
          status: "decision_ready",
          validation_status: "pass",
          failures: [],
          decision: {
            next_task: "next",
            reason: "reason",
            risk_level: "low",
            required_preconditions: ["p1"],
            boundary_enforced: true,
          },
          approval_required: true,
          execution_start_allowed: false,
          operator_approved: false,
          execution_started: false,
          registry_write_allowed: false,
          taskflow_registry_write: false,
          sqlite_write: false,
          worker_execution: false,
          model_invoked: false,
          live_actions_enabled: false,
          blocked_actions: ["blocked"],
          rollback_path: "discard",
          next_safe_task: "next",
        }) + "\n",
        "utf8",
      );

      const artifact =
        await writeHermesModelDecisionIntakeActivationExecutionManifestNextSafeTaskDecisionCoverageReportArtifact(
          {
            repoRoot,
            executionManifestNextSafeTaskDecisionReportPath: decisionPath,
            now: FIXED_NOW,
          },
        );
      const persisted = JSON.parse(await readFile(artifact.path, "utf8"));

      expect(
        artifact.path.endsWith(
          "-model-backed-dialogue-controlled-executor-intake-activation-execution-manifest-next-safe-task-decision-coverage-report.json",
        ),
      ).toBe(true);
      expect(artifact.report.schema).toBe(
        "openclaw.hermes.model_decision_intake_activation_execution_manifest_next_safe_task_decision_coverage_report.v1",
      );
      expect(artifact.report.status).toBe("coverage_pass");
      expect(artifact.report.validation_status).toBe("pass");
      expect(artifact.report.coverage.decision_ready).toBe(true);
      expect(artifact.report.coverage.risk_level_low).toBe(true);
      expect(artifact.report.coverage.boundary_enforced).toBe(true);
      expect(artifact.report.coverage.approval_required_true).toBe(true);
      expect(artifact.report.coverage.execution_start_allowed_false).toBe(true);
      expect(artifact.report.coverage.operator_approval_false).toBe(true);
      expect(artifact.report.coverage.execution_started_false).toBe(true);
      expect(artifact.report.coverage.registry_writes_disabled).toBe(true);
      expect(artifact.report.coverage.sqlite_writes_disabled).toBe(true);
      expect(artifact.report.coverage.worker_execution_disabled).toBe(true);
      expect(artifact.report.coverage.model_invocation_disabled).toBe(true);
      expect(artifact.report.coverage.live_actions_disabled).toBe(true);
      expect(artifact.report.coverage.required_preconditions_present).toBe(true);
      expect(artifact.report.coverage.coverage_report_not_approval).toBe(true);
      expect(artifact.report.coverage.coverage_ratio).toBe(1);
      expect(artifact.report.approval_required).toBe(true);
      expect(artifact.report.execution_start_allowed).toBe(false);
      expect(artifact.report.operator_approved).toBe(false);
      expect(artifact.report.execution_started).toBe(false);
      expect(artifact.report.model_invoked).toBe(false);
      expect(persisted.status).toBe("coverage_pass");
    } finally {
      await rm(repoRoot, { recursive: true, force: true });
    }
  });

  it("blocks intake activation execution-manifest next-safe-task decision coverage when decision is incomplete", async () => {
    const repoRoot = await mkdtemp(
      join(
        tmpdir(),
        "hermes-model-decision-intake-activation-execution-manifest-next-safe-task-decision-coverage-blocked-",
      ),
    );
    try {
      const badDecisionPath = join(
        repoRoot,
        "bad-model-backed-dialogue-controlled-executor-intake-activation-execution-manifest-next-safe-task-decision-report.json",
      );
      await writeFile(
        badDecisionPath,
        JSON.stringify({
          schema: "openclaw.hermes.model_decision_intake_activation_execution_manifest_next_safe_task_decision_report.v1",
          created_at: FIXED_NOW.toISOString(),
          dry_run: true,
          read_only: true,
          source_execution_manifest_final_readiness_summary_coverage_report:
            "reports/hermes-agent/state/final-readiness-summary-coverage-report.json",
          source_execution_manifest_final_readiness_summary_report:
            "reports/hermes-agent/state/final-readiness-summary-report.json",
          source_execution_manifest_proposal_coverage_report:
            "reports/hermes-agent/state/proposal-coverage-report.json",
          source_execution_manifest_proposal_report:
            "reports/hermes-agent/state/proposal-report.json",
          source_final_readiness_summary_coverage_report:
            "reports/hermes-agent/state/final-readiness-summary-coverage-report.json",
          source_final_readiness_summary_report:
            "reports/hermes-agent/state/final-readiness-summary-report.json",
          source_preflight_coverage_report: "reports/hermes-agent/state/preflight-coverage-report.json",
          source_preflight_report: "reports/hermes-agent/state/preflight-report.json",
          source_release_summary_coverage_report:
            "reports/hermes-agent/state/release-summary-coverage-report.json",
          source_release_summary_report: "reports/hermes-agent/state/release-summary-report.json",
          source_intake_coverage_report: "reports/hermes-agent/state/intake-coverage-report.json",
          source_handoff_plan: "reports/hermes-agent/state/handoff-plan.json",
          trace_id: "bad-trace",
          status: "blocked",
          validation_status: "fail",
          failures: ["bad decision"],
          decision: {
            next_task: "",
            reason: "reason",
            risk_level: "medium",
            required_preconditions: [],
            boundary_enforced: false,
          },
          approval_required: true,
          execution_start_allowed: false,
          operator_approved: false,
          execution_started: false,
          registry_write_allowed: false,
          taskflow_registry_write: false,
          sqlite_write: false,
          worker_execution: false,
          model_invoked: false,
          live_actions_enabled: false,
          blocked_actions: ["blocked"],
          rollback_path: "discard",
          next_safe_task: "fix",
        }) + "\n",
        "utf8",
      );

      const artifact =
        await writeHermesModelDecisionIntakeActivationExecutionManifestNextSafeTaskDecisionCoverageReportArtifact(
          {
            repoRoot,
            executionManifestNextSafeTaskDecisionReportPath: badDecisionPath,
            now: FIXED_NOW,
          },
        );

      expect(artifact.report.status).toBe("blocked");
      expect(artifact.report.validation_status).toBe("fail");
      expect(artifact.report.coverage.decision_ready).toBe(false);
      expect(artifact.report.coverage.coverage_ratio).toBeLessThan(1);
      expect(artifact.report.failures.length).toBeGreaterThan(0);
      expect(artifact.report.execution_started).toBe(false);
      expect(artifact.report.model_invoked).toBe(false);
    } finally {
      await rm(repoRoot, { recursive: true, force: true });
    }
  });

  it("writes a read-only model-backed dialogue controlled executor intake activation execution-manifest activation-readiness delta report", async () => {
    const repoRoot = await mkdtemp(
      join(
        tmpdir(),
        "hermes-model-decision-intake-activation-execution-manifest-activation-readiness-delta-",
      ),
    );
    try {
      const coveragePath = join(
        repoRoot,
        "model-backed-dialogue-controlled-executor-intake-activation-execution-manifest-next-safe-task-decision-coverage-report.json",
      );
      await writeFile(
        coveragePath,
        JSON.stringify({
          schema: "openclaw.hermes.model_decision_intake_activation_execution_manifest_next_safe_task_decision_coverage_report.v1",
          created_at: FIXED_NOW.toISOString(),
          dry_run: true,
          read_only: true,
          source_execution_manifest_next_safe_task_decision_report:
            "reports/hermes-agent/state/next-safe-task-decision-report.json",
          source_execution_manifest_final_readiness_summary_coverage_report:
            "reports/hermes-agent/state/final-readiness-summary-coverage-report.json",
          source_execution_manifest_final_readiness_summary_report:
            "reports/hermes-agent/state/final-readiness-summary-report.json",
          source_execution_manifest_proposal_coverage_report:
            "reports/hermes-agent/state/proposal-coverage-report.json",
          source_execution_manifest_proposal_report:
            "reports/hermes-agent/state/proposal-report.json",
          source_final_readiness_summary_coverage_report:
            "reports/hermes-agent/state/final-readiness-summary-coverage-report.json",
          source_final_readiness_summary_report:
            "reports/hermes-agent/state/final-readiness-summary-report.json",
          source_preflight_coverage_report: "reports/hermes-agent/state/preflight-coverage-report.json",
          source_preflight_report: "reports/hermes-agent/state/preflight-report.json",
          source_release_summary_coverage_report:
            "reports/hermes-agent/state/release-summary-coverage-report.json",
          source_release_summary_report: "reports/hermes-agent/state/release-summary-report.json",
          source_intake_coverage_report: "reports/hermes-agent/state/intake-coverage-report.json",
          source_handoff_plan: "reports/hermes-agent/state/handoff-plan.json",
          trace_id: "test-trace",
          status: "coverage_pass",
          validation_status: "pass",
          failures: [],
          coverage: {
            decision_ready: true,
            risk_level_low: true,
            boundary_enforced: true,
            approval_required_true: true,
            execution_start_allowed_false: true,
            operator_approval_false: true,
            execution_started_false: true,
            registry_writes_disabled: true,
            sqlite_writes_disabled: true,
            worker_execution_disabled: true,
            model_invocation_disabled: true,
            live_actions_disabled: true,
            required_preconditions_present: true,
            coverage_report_not_approval: true,
            coverage_ratio: 1,
          },
          approval_required: true,
          execution_start_allowed: false,
          operator_approved: false,
          execution_started: false,
          registry_write_allowed: false,
          taskflow_registry_write: false,
          sqlite_write: false,
          worker_execution: false,
          model_invoked: false,
          live_actions_enabled: false,
          blocked_actions: ["blocked"],
          rollback_path: "discard",
          next_safe_task: "next",
        }) + "\n",
        "utf8",
      );

      const artifact =
        await writeHermesModelDecisionIntakeActivationExecutionManifestActivationReadinessDeltaReportArtifact(
          {
            repoRoot,
            executionManifestNextSafeTaskDecisionCoverageReportPath: coveragePath,
            now: FIXED_NOW,
          },
        );
      const persisted = JSON.parse(await readFile(artifact.path, "utf8"));

      expect(
        artifact.path.endsWith(
          "-model-backed-dialogue-controlled-executor-intake-activation-execution-manifest-activation-readiness-delta-report.json",
        ),
      ).toBe(true);
      expect(artifact.report.schema).toBe(
        "openclaw.hermes.model_decision_intake_activation_execution_manifest_activation_readiness_delta_report.v1",
      );
      expect(artifact.report.status).toBe("delta_ready");
      expect(artifact.report.validation_status).toBe("pass");
      expect(artifact.report.delta.decision_coverage_green).toBe(true);
      expect(artifact.report.delta.decision_ready).toBe(true);
      expect(artifact.report.delta.risk_level_low).toBe(true);
      expect(artifact.report.delta.boundary_enforced).toBe(true);
      expect(artifact.report.delta.approval_required_true).toBe(true);
      expect(artifact.report.delta.execution_start_allowed_false).toBe(true);
      expect(artifact.report.delta.operator_approval_false).toBe(true);
      expect(artifact.report.delta.execution_started_false).toBe(true);
      expect(artifact.report.delta.registry_writes_disabled).toBe(true);
      expect(artifact.report.delta.sqlite_writes_disabled).toBe(true);
      expect(artifact.report.delta.worker_execution_disabled).toBe(true);
      expect(artifact.report.delta.model_invocation_disabled).toBe(true);
      expect(artifact.report.delta.live_actions_disabled).toBe(true);
      expect(artifact.report.delta.delta_report_not_approval).toBe(true);
      expect(artifact.report.delta.delta_ratio).toBe(1);
      expect(artifact.report.approval_required).toBe(true);
      expect(artifact.report.execution_start_allowed).toBe(false);
      expect(artifact.report.operator_approved).toBe(false);
      expect(artifact.report.execution_started).toBe(false);
      expect(artifact.report.model_invoked).toBe(false);
      expect(persisted.status).toBe("delta_ready");
    } finally {
      await rm(repoRoot, { recursive: true, force: true });
    }
  });

  it("blocks intake activation execution-manifest activation-readiness delta when decision coverage is incomplete", async () => {
    const repoRoot = await mkdtemp(
      join(
        tmpdir(),
        "hermes-model-decision-intake-activation-execution-manifest-activation-readiness-delta-blocked-",
      ),
    );
    try {
      const badCoveragePath = join(
        repoRoot,
        "bad-model-backed-dialogue-controlled-executor-intake-activation-execution-manifest-next-safe-task-decision-coverage-report.json",
      );
      await writeFile(
        badCoveragePath,
        JSON.stringify({
          schema: "openclaw.hermes.model_decision_intake_activation_execution_manifest_next_safe_task_decision_coverage_report.v1",
          created_at: FIXED_NOW.toISOString(),
          dry_run: true,
          read_only: true,
          source_execution_manifest_next_safe_task_decision_report:
            "reports/hermes-agent/state/next-safe-task-decision-report.json",
          source_execution_manifest_final_readiness_summary_coverage_report:
            "reports/hermes-agent/state/final-readiness-summary-coverage-report.json",
          source_execution_manifest_final_readiness_summary_report:
            "reports/hermes-agent/state/final-readiness-summary-report.json",
          source_execution_manifest_proposal_coverage_report:
            "reports/hermes-agent/state/proposal-coverage-report.json",
          source_execution_manifest_proposal_report:
            "reports/hermes-agent/state/proposal-report.json",
          source_final_readiness_summary_coverage_report:
            "reports/hermes-agent/state/final-readiness-summary-coverage-report.json",
          source_final_readiness_summary_report:
            "reports/hermes-agent/state/final-readiness-summary-report.json",
          source_preflight_coverage_report: "reports/hermes-agent/state/preflight-coverage-report.json",
          source_preflight_report: "reports/hermes-agent/state/preflight-report.json",
          source_release_summary_coverage_report:
            "reports/hermes-agent/state/release-summary-coverage-report.json",
          source_release_summary_report: "reports/hermes-agent/state/release-summary-report.json",
          source_intake_coverage_report: "reports/hermes-agent/state/intake-coverage-report.json",
          source_handoff_plan: "reports/hermes-agent/state/handoff-plan.json",
          trace_id: "bad-trace",
          status: "blocked",
          validation_status: "fail",
          failures: ["bad decision coverage"],
          coverage: {
            decision_ready: false,
            risk_level_low: false,
            boundary_enforced: false,
            approval_required_true: true,
            execution_start_allowed_false: true,
            operator_approval_false: true,
            execution_started_false: true,
            registry_writes_disabled: true,
            sqlite_writes_disabled: true,
            worker_execution_disabled: true,
            model_invocation_disabled: true,
            live_actions_disabled: true,
            required_preconditions_present: false,
            coverage_report_not_approval: true,
            coverage_ratio: 0.8,
          },
          approval_required: true,
          execution_start_allowed: false,
          operator_approved: false,
          execution_started: false,
          registry_write_allowed: false,
          taskflow_registry_write: false,
          sqlite_write: false,
          worker_execution: false,
          model_invoked: false,
          live_actions_enabled: false,
          blocked_actions: ["blocked"],
          rollback_path: "discard",
          next_safe_task: "fix",
        }) + "\n",
        "utf8",
      );

      const artifact =
        await writeHermesModelDecisionIntakeActivationExecutionManifestActivationReadinessDeltaReportArtifact(
          {
            repoRoot,
            executionManifestNextSafeTaskDecisionCoverageReportPath: badCoveragePath,
            now: FIXED_NOW,
          },
        );

      expect(artifact.report.status).toBe("blocked");
      expect(artifact.report.validation_status).toBe("fail");
      expect(artifact.report.delta.decision_coverage_green).toBe(false);
      expect(artifact.report.delta.delta_ratio).toBeLessThan(1);
      expect(artifact.report.failures.length).toBeGreaterThan(0);
      expect(artifact.report.execution_started).toBe(false);
      expect(artifact.report.model_invoked).toBe(false);
    } finally {
      await rm(repoRoot, { recursive: true, force: true });
    }
  });


});

function createRuntime(params: {
  text: string;
  provider?: string;
  modelId?: string;
}): HermesModelDecisionRuntime {
  const provider = params.provider ?? "ollama";
  const modelId = params.modelId ?? "qwen3:14b";
  return {
    getRuntimeConfig: () => TEST_CFG,
    resolveDefaultAgentId: () => "dev",
    prepareSimpleCompletionModelForAgent: vi.fn(async () => ({
      selection: {
        provider,
        modelId,
        agentDir: "agents/dev",
      },
      model: {
        provider,
        id: modelId,
        maxTokens: 4096,
      },
      auth: {
        apiKey: "test",
      },
    })) as unknown as HermesModelDecisionRuntime["prepareSimpleCompletionModelForAgent"],
    completeWithPreparedSimpleCompletionModel: vi.fn(async () => ({
      content: [
        {
          type: "text",
          text: params.text,
        },
      ],
    })) as unknown as HermesModelDecisionRuntime["completeWithPreparedSimpleCompletionModel"],
  };
}

















