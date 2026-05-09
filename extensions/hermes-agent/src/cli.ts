import process from "node:process";
import type { Command } from "commander";
import { writeHermesApprovalRequest, writeHermesAuditReport } from "./audit.js";
import {
  buildHermesDeploymentPlan,
  buildHermesTaskFlowSkeleton,
  validateHermesTaskFlowSkeletonArtifact,
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
  writeHermesTaskFlowRegistryNoopWriteArtifact,
  writeHermesTaskFlowRegistryOperatorApprovalRequestArtifact,
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
} from "./model-decision.js";
import { runHermesPromotionGate } from "./promotion.js";
import { buildHermesPlan } from "./task-package.js";

type HermesPlanCliOptions = {
  writeAudit?: boolean;
  auditDir?: string;
  writeApproval?: boolean;
  approvalDir?: string;
};

type HermesDecideCliOptions = {
  agent?: string;
  model?: string;
  maxTokens?: string;
  outputDir?: string;
};

type HermesReportModelBackedDialogueDecisionCoverageOptions = {
  outputDir?: string;
};

type HermesPlanModelBackedDialogueDecisionHandoffOptions = {
  outputDir?: string;
};

type HermesReportModelBackedDialogueHandoffIntakeCoverageOptions = {
  outputDir?: string;
};

type HermesReportModelBackedDialogueIntakeReleaseSummaryOptions = {
  outputDir?: string;
};

type HermesReportModelBackedDialogueIntakeReleaseSummaryCoverageOptions = {
  outputDir?: string;
};

type HermesPreflightModelBackedDialogueControlledExecutorIntakeActivationOptions = {
  outputDir?: string;
};

type HermesReportModelBackedDialogueControlledExecutorIntakeActivationPreflightCoverageOptions = {
  outputDir?: string;
};

type HermesReportModelBackedDialogueControlledExecutorIntakeActivationFinalReadinessSummaryOptions = {
  outputDir?: string;
};

type HermesReportModelBackedDialogueControlledExecutorIntakeActivationFinalReadinessSummaryCoverageOptions = {
  outputDir?: string;
};

type HermesReportModelBackedDialogueControlledExecutorIntakeActivationExecutionManifestProposalOptions = {
  outputDir?: string;
};

type HermesReportModelBackedDialogueControlledExecutorIntakeActivationExecutionManifestProposalCoverageOptions = {
  outputDir?: string;
};

type HermesReportModelBackedDialogueControlledExecutorIntakeActivationExecutionManifestFinalReadinessSummaryOptions = {
  outputDir?: string;
};

type HermesReportModelBackedDialogueControlledExecutorIntakeActivationExecutionManifestFinalReadinessSummaryCoverageOptions = {
  outputDir?: string;
};

type HermesReportModelBackedDialogueControlledExecutorIntakeActivationExecutionManifestNextSafeTaskDecisionOptions = {
  outputDir?: string;
};

type HermesReportModelBackedDialogueControlledExecutorIntakeActivationExecutionManifestNextSafeTaskDecisionCoverageOptions = {
  outputDir?: string;
};

type HermesReportModelBackedDialogueControlledExecutorIntakeActivationExecutionManifestActivationReadinessDeltaOptions = {
  outputDir?: string;
};

type HermesDeployPlanOptions = {
  model?: string;
  taskflowSkeleton?: boolean;
  writeTaskflowSkeleton?: boolean;
  taskflowOutputDir?: string;
};

type HermesLearnOptions = {
  traceId: string;
  status: "success" | "failure";
  summary: string;
  tags?: string;
  stateDir?: string;
};

type HermesPromoteOptions = {
  traceId: string;
  validate: string[];
  timeoutMs?: string;
  outputDir?: string;
};

type HermesStageTaskFlowRegistryOptions = {
  outputDir?: string;
};

type HermesGateTaskFlowRegistryOptions = {
  outputDir?: string;
};

type HermesNoopWriteTaskFlowRegistryOptions = {
  outputDir?: string;
};

type HermesPreviewTaskFlowRegistryDiffOptions = {
  outputDir?: string;
};

type HermesRequestTaskFlowRegistryApprovalOptions = {
  outputDir?: string;
};
type HermesValidateTaskFlowRegistryApprovalOptions = {
  outputDir?: string;
};

type HermesReadTaskFlowRegistryDryRunOptions = {
  outputDir?: string;
  registrySnapshot?: string;
};

type HermesSnapshotTaskFlowRegistryDryRunOptions = {
  outputDir?: string;
  flowId?: string;
};

type HermesReviewTaskFlowRegistryWriteOptions = {
  outputDir?: string;
};

type HermesWriteTaskFlowRegistryWriterContractFixtureOptions = {
  outputDir?: string;
};

type HermesReportTaskFlowRegistryContractCoverageOptions = {
  outputDir?: string;
};

type HermesPreflightTaskFlowRegistryPromotionOptions = {
  outputDir?: string;
};

type HermesWriteTaskFlowRegistryRollbackContractFixtureOptions = {
  outputDir?: string;
};

type HermesReportTaskFlowRegistryRollbackContractCoverageOptions = {
  outputDir?: string;
};

type HermesSummarizeTaskFlowRegistryFinalWriterReadinessOptions = {
  outputDir?: string;
};
type HermesPlanTaskFlowRegistryRealWriterImplementationOptions = {
  outputDir?: string;
};
type HermesReportTaskFlowRegistryRealWriterImplementationPlanCoverageOptions = {
  outputDir?: string;
};
type HermesWriteTaskFlowRegistryRealWriterApiContractFixtureOptions = {
  outputDir?: string;
};
type HermesReportTaskFlowRegistryRealWriterApiContractCoverageOptions = {
  outputDir?: string;
};
type HermesPreflightTaskFlowRegistryRealWriterPromotionOptions = {
  outputDir?: string;
};
type HermesReportTaskFlowRegistryRealWriterPromotionPreflightCoverageOptions = {
  outputDir?: string;
};
type HermesReportTaskFlowRegistryRealWriterFinalReadinessLockOptions = {
  outputDir?: string;
};
type HermesWriteTaskFlowRegistryRealWriterActivationApprovalTokenFixtureOptions = {
  outputDir?: string;
};
type HermesReportTaskFlowRegistryRealWriterActivationApprovalTokenCoverageOptions = {
  outputDir?: string;
};
type HermesPreflightTaskFlowRegistryRealWriterActivationApprovalOptions = {
  outputDir?: string;
};
type HermesReportTaskFlowRegistryRealWriterActivationApprovalPreflightCoverageOptions = {
  outputDir?: string;
};
type HermesReportTaskFlowRegistryRealWriterActivationFinalReadinessLockOptions = {
  outputDir?: string;
};
type HermesReportTaskFlowRegistryRealWriterActivationFinalReadinessLockCoverageOptions = {
  outputDir?: string;
};

type HermesReportTaskFlowRegistryRealWriterActivationReleaseChecklistOptions = {
  outputDir?: string;
};
type HermesReportTaskFlowRegistryRealWriterActivationReleaseChecklistCoverageOptions = {
  outputDir?: string;
};
type HermesWriteTaskFlowRegistryRealWriterActivationOperatorHandoffPacketOptions = {
  outputDir?: string;
};
type HermesReportTaskFlowRegistryRealWriterActivationOperatorHandoffPacketCoverageOptions = {
  outputDir?: string;
};
type HermesReportTaskFlowRegistryRealWriterActivationFinalSafetySummaryOptions = {
  outputDir?: string;
};
type HermesReportTaskFlowRegistryRealWriterActivationFinalSafetySummaryCoverageOptions = {
  outputDir?: string;
};
type HermesWriteTaskFlowRegistryNextSafeTaskProposerFixtureOptions = {
  outputDir?: string;
};
type HermesReportTaskFlowRegistryNextSafeTaskProposerFixtureCoverageOptions = {
  outputDir?: string;
};
type HermesWriteTaskFlowRegistryTaskDialoguerFixtureOptions = {
  outputDir?: string;
};
type HermesReportTaskFlowRegistryTaskDialoguerFixtureCoverageOptions = {
  outputDir?: string;
};
type HermesWriteTaskFlowRegistryTaskDialoguerHandoffPackageOptions = {
  outputDir?: string;
};
type HermesWriteTaskFlowRegistryTaskDialoguerReasoningPolicyOptions = {
  outputDir?: string;
};
type HermesReportTaskFlowRegistryTaskDialoguerReasoningPolicyCoverageOptions = {
  outputDir?: string;
};
type HermesReportTaskFlowRegistryTaskDialoguerStatusSummaryCoverageOptions = {
  outputDir?: string;
};
type HermesRunTaskFlowRegistryControlledDialogueExecutorDryRunOptions = {
  outputDir?: string;
};
type HermesReportTaskFlowRegistryTaskDialoguerStatusSummaryOptions = {
  outputDir?: string;
};
type HermesWriteTaskFlowRegistryControlledExecutorIntakeValidatorOptions = {
  outputDir?: string;
};
type HermesReportTaskFlowRegistryControlledExecutorIntakeCoverageOptions = {
  outputDir?: string;
};
type HermesReportTaskFlowRegistryControlledExecutorIntakeReleaseSummaryOptions = {
  outputDir?: string;
};
type HermesPreflightTaskFlowRegistryControlledExecutorApprovalOptions = {
  outputDir?: string;
};
type HermesReportTaskFlowRegistryControlledExecutorApprovalPreflightCoverageOptions = {
  outputDir?: string;
};
type HermesReportTaskFlowRegistryControlledExecutorFinalReadinessLockOptions = {
  outputDir?: string;
};
type HermesReportTaskFlowRegistryControlledExecutorFinalReadinessLockCoverageOptions = {
  outputDir?: string;
};
type HermesReportTaskFlowRegistryControlledExecutorActivationReleaseChecklistOptions = {
  outputDir?: string;
};
type HermesReportTaskFlowRegistryControlledExecutorActivationReleaseChecklistCoverageOptions = {
  outputDir?: string;
};
type HermesReportTaskFlowRegistryControlledExecutorActivationOperatorHandoffPacketOptions = {
  outputDir?: string;
};
type HermesReportTaskFlowRegistryControlledExecutorActivationOperatorHandoffPacketCoverageOptions =
  {
    outputDir?: string;
  };
type HermesReportTaskFlowRegistryControlledExecutorActivationFinalSafetySummaryOptions = {
  outputDir?: string;
};
type HermesReportTaskFlowRegistryControlledExecutorActivationFinalSafetySummaryCoverageOptions = {
  outputDir?: string;
};
type HermesReportTaskFlowRegistryControlledExecutorActivationNextSafeTaskDecisionOptions = {
  outputDir?: string;
};
type HermesReportTaskFlowRegistryControlledExecutorActivationExecutionManifestProposalOptions = {
  outputDir?: string;
};
type HermesReportTaskFlowRegistryControlledExecutorActivationExecutionManifestProposalCoverageOptions =
  {
    outputDir?: string;
  };
type HermesReportTaskFlowRegistryControlledExecutorActivationExecutionManifestFinalReadinessSummaryOptions =
  {
    outputDir?: string;
  };
type HermesReportTaskFlowRegistryControlledExecutorActivationMemoryLayerSandwichLoopOptions = {
  outputDir?: string;
};
type HermesRunTaskFlowRegistryControlledExecutorActivationMemoryLayerSandwichLoopDryRunOptions = {
  outputDir?: string;
};
type HermesReportTaskFlowRegistryControlledExecutorActivationGodmodeSafetyLockOptions = {
  outputDir?: string;
};
type HermesReportTaskFlowRegistryControlledExecutorActivationGodmodeSafetyLockCoverageOptions = {
  outputDir?: string;
};
type HermesPlanTaskFlowRegistryControlledExecutorActivationRedTeamSandboxBoundaryOptions = {
  outputDir?: string;
};
type HermesReportTaskFlowRegistryControlledExecutorActivationRedTeamSandboxBoundaryCoverageOptions =
  {
    outputDir?: string;
  };
type HermesWriteTaskFlowRegistryControlledExecutorActivationRedTeamSandboxOperatorApprovalChallengeOptions =
  {
    outputDir?: string;
  };
type HermesReportTaskFlowRegistryControlledExecutorActivationRedTeamSandboxOperatorApprovalChallengeCoverageOptions =
  {
    outputDir?: string;
  };
type HermesReportTaskFlowRegistryControlledExecutorActivationRedTeamSandboxFinalSafetySummaryOptions =
  {
    outputDir?: string;
  };
type HermesReportTaskFlowRegistryControlledExecutorActivationRedTeamSandboxFinalSafetySummaryCoverageOptions =
  {
    outputDir?: string;
  };
type HermesReportTaskFlowRegistryControlledExecutorActivationRedTeamSandboxOperatorHandoffPacketOptions =
  {
    outputDir?: string;
  };
type HermesValidateTaskFlowRegistryApprovalTokenOptions = {
  outputDir?: string;
  token?: string;
};

type HermesApplyTaskFlowRegistryNoopOptions = {
  outputDir?: string;
};

export function registerHermesCli(program: Command): void {
  const hermes = program
    .command("hermes")
    .description("Create guarded Hermes task packages and approval requests");

  hermes
    .command("plan")
    .description("Create a dry-run Hermes task package")
    .argument("<request...>", "Request to convert into a Hermes task package")
    .option("--write-audit", "Write a local audit report under the workspace")
    .option("--audit-dir <dir>", "Workspace-relative audit output directory")
    .option("--write-approval", "Write a high-risk approval request under the workspace")
    .option("--approval-dir <dir>", "Workspace-relative approval output directory")
    .action(async (requestParts: string[], options: HermesPlanCliOptions) => {
      const request = requestParts.join(" ");
      const plan = buildHermesPlan(request);
      const result: {
        plan: ReturnType<typeof buildHermesPlan>;
        audit_report?: Awaited<ReturnType<typeof writeHermesAuditReport>>;
        approval_report?: Awaited<ReturnType<typeof writeHermesApprovalRequest>>;
      } = { plan };

      if (options.writeAudit) {
        result.audit_report = await writeHermesAuditReport({
          repoRoot: process.cwd(),
          outputDir: options.auditDir,
          plan,
        });
      }

      if (options.writeApproval) {
        result.approval_report = await writeHermesApprovalRequest({
          repoRoot: process.cwd(),
          outputDir: options.approvalDir,
          plan,
        });
      }

      process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
    });

  hermes
    .command("decide")
    .description("Run the configured OpenClaw model for a dry-run Hermes decision")
    .argument("<request...>", "Request to convert into a model-backed Hermes decision")
    .option("--agent <id>", "OpenClaw agent id to resolve model/auth from")
    .option("--model <provider/model>", "Optional OpenClaw provider/model override")
    .option("--max-tokens <n>", "Maximum tokens for the model decision")
    .option("--output-dir <dir>", "Workspace-relative model decision artifact output directory")
    .action(async (requestParts: string[], options: HermesDecideCliOptions) => {
      const request = requestParts.join(" ");
      const params = {
        request,
        agentId: options.agent,
        modelRef: options.model,
        maxTokens: parseOptionalPositiveInteger("--max-tokens", options.maxTokens),
      };
      const result = options.outputDir
        ? await writeHermesModelDecisionArtifact({
            ...params,
            repoRoot: process.cwd(),
            outputDir: options.outputDir,
          })
        : await buildHermesModelDecision(params);
      process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
    });

  hermes
    .command("report-model-backed-dialogue-decision-coverage")
    .description("Write a read-only coverage report for a model-backed Hermes dialogue decision")
    .argument(
      "<model-backed-dialogue-decision>",
      "Workspace-relative or absolute model-backed dialogue decision artifact path",
    )
    .option(
      "--output-dir <dir>",
      "Workspace-relative model-backed dialogue decision coverage output directory",
    )
    .action(
      async (
        modelDecisionPath: string,
        options: HermesReportModelBackedDialogueDecisionCoverageOptions,
      ) => {
        const result = await writeHermesModelDecisionCoverageReportArtifact({
          repoRoot: process.cwd(),
          modelDecisionPath,
          outputDir: options.outputDir,
        });
        process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
        process.exitCode = result.report.status === "coverage_pass" ? 0 : 1;
      },
    );

  hermes
    .command("plan-model-backed-dialogue-decision-handoff")
    .description("Write a read-only handoff plan for covered model-backed Hermes dialogue")
    .argument(
      "<model-backed-dialogue-decision-coverage-report>",
      "Workspace-relative or absolute model-backed dialogue decision coverage report path",
    )
    .option(
      "--output-dir <dir>",
      "Workspace-relative model-backed dialogue decision handoff output directory",
    )
    .action(
      async (
        modelDecisionCoverageReportPath: string,
        options: HermesPlanModelBackedDialogueDecisionHandoffOptions,
      ) => {
        const result = await writeHermesModelDecisionHandoffPlanArtifact({
          repoRoot: process.cwd(),
          modelDecisionCoverageReportPath,
          outputDir: options.outputDir,
        });
        process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
        process.exitCode = result.plan.status === "handoff_ready" ? 0 : 1;
      },
    );
  hermes
    .command("report-model-backed-dialogue-handoff-intake-coverage")
    .description(
      "Write a read-only intake coverage report for a model-backed dialogue handoff plan",
    )
    .argument(
      "<model-backed-dialogue-decision-handoff-plan>",
      "Workspace-relative or absolute model-backed dialogue decision handoff plan path",
    )
    .option(
      "--output-dir <dir>",
      "Workspace-relative model-backed dialogue handoff intake coverage output directory",
    )
    .action(
      async (
        handoffPlanPath: string,
        options: HermesReportModelBackedDialogueHandoffIntakeCoverageOptions,
      ) => {
        const result = await writeHermesModelDecisionHandoffIntakeCoverageReportArtifact({
          repoRoot: process.cwd(),
          handoffPlanPath,
          outputDir: options.outputDir,
        });
        process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
        process.exitCode = result.report.status === "coverage_pass" ? 0 : 1;
      },
    );
  hermes
    .command("report-model-backed-dialogue-intake-release-summary")
    .description("Write a read-only release summary for model-backed dialogue intake coverage")
    .argument(
      "<model-backed-dialogue-handoff-intake-coverage-report>",
      "Workspace-relative or absolute model-backed dialogue handoff intake coverage report path",
    )
    .option(
      "--output-dir <dir>",
      "Workspace-relative model-backed dialogue intake release summary output directory",
    )
    .action(
      async (
        intakeCoverageReportPath: string,
        options: HermesReportModelBackedDialogueIntakeReleaseSummaryOptions,
      ) => {
        const result = await writeHermesModelDecisionIntakeReleaseSummaryReportArtifact({
          repoRoot: process.cwd(),
          intakeCoverageReportPath,
          outputDir: options.outputDir,
        });
        process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
        process.exitCode = result.report.status === "summary_ready" ? 0 : 1;
      },
    );
  hermes
    .command("report-model-backed-dialogue-intake-release-summary-coverage")
    .description(
      "Write a read-only coverage report for a model-backed dialogue intake release summary",
    )
    .argument(
      "<model-backed-dialogue-intake-release-summary-report>",
      "Workspace-relative or absolute model-backed dialogue intake release summary report path",
    )
    .option(
      "--output-dir <dir>",
      "Workspace-relative model-backed dialogue intake release summary coverage output directory",
    )
    .action(
      async (
        releaseSummaryReportPath: string,
        options: HermesReportModelBackedDialogueIntakeReleaseSummaryCoverageOptions,
      ) => {
        const result = await writeHermesModelDecisionIntakeReleaseSummaryCoverageReportArtifact({
          repoRoot: process.cwd(),
          releaseSummaryReportPath,
          outputDir: options.outputDir,
        });
        process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
        process.exitCode = result.report.status === "coverage_pass" ? 0 : 1;
      },
    );
  hermes
    .command("preflight-model-backed-dialogue-controlled-executor-intake-activation")
    .description(
      "Write a read-only preflight report for model-backed dialogue controlled executor intake activation",
    )
    .argument(
      "<model-backed-dialogue-intake-release-summary-coverage-report>",
      "Workspace-relative or absolute model-backed dialogue intake release summary coverage report path",
    )
    .option(
      "--output-dir <dir>",
      "Workspace-relative model-backed dialogue controlled executor intake activation preflight output directory",
    )
    .action(
      async (
        releaseSummaryCoverageReportPath: string,
        options: HermesPreflightModelBackedDialogueControlledExecutorIntakeActivationOptions,
      ) => {
        const result = await writeHermesModelDecisionIntakeActivationPreflightReportArtifact({
          repoRoot: process.cwd(),
          releaseSummaryCoverageReportPath,
          outputDir: options.outputDir,
        });
        process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
        process.exitCode = result.report.status === "preflight_pass" ? 0 : 1;
      },
    );
  hermes
    .command("report-model-backed-dialogue-controlled-executor-intake-activation-preflight-coverage")
    .description(
      "Write a read-only coverage report for model-backed dialogue controlled executor intake activation preflight",
    )
    .argument(
      "<model-backed-dialogue-controlled-executor-intake-activation-preflight-report>",
      "Workspace-relative or absolute model-backed dialogue controlled executor intake activation preflight report path",
    )
    .option(
      "--output-dir <dir>",
      "Workspace-relative model-backed dialogue controlled executor intake activation preflight coverage output directory",
    )
    .action(
      async (
        preflightReportPath: string,
        options: HermesReportModelBackedDialogueControlledExecutorIntakeActivationPreflightCoverageOptions,
      ) => {
        const result =
          await writeHermesModelDecisionIntakeActivationPreflightCoverageReportArtifact({
            repoRoot: process.cwd(),
            preflightReportPath,
            outputDir: options.outputDir,
          });
        process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
        process.exitCode = result.report.status === "coverage_pass" ? 0 : 1;
      },
    );
  hermes
    .command("report-model-backed-dialogue-controlled-executor-intake-activation-final-readiness-summary")
    .description(
      "Write a read-only final readiness summary report for model-backed dialogue controlled executor intake activation",
    )
    .argument(
      "<model-backed-dialogue-controlled-executor-intake-activation-preflight-coverage-report>",
      "Workspace-relative or absolute model-backed dialogue controlled executor intake activation preflight coverage report path",
    )
    .option(
      "--output-dir <dir>",
      "Workspace-relative model-backed dialogue controlled executor intake activation final readiness summary output directory",
    )
    .action(
      async (
        preflightCoverageReportPath: string,
        options: HermesReportModelBackedDialogueControlledExecutorIntakeActivationFinalReadinessSummaryOptions,
      ) => {
        const result =
          await writeHermesModelDecisionIntakeActivationFinalReadinessSummaryReportArtifact({
            repoRoot: process.cwd(),
            preflightCoverageReportPath,
            outputDir: options.outputDir,
          });
        process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
        process.exitCode = result.report.status === "summary_ready" ? 0 : 1;
      },
    );
  hermes
    .command("report-model-backed-dialogue-controlled-executor-intake-activation-final-readiness-summary-coverage")
    .description(
      "Write a read-only coverage report for model-backed dialogue controlled executor intake activation final readiness summary",
    )
    .argument(
      "<model-backed-dialogue-controlled-executor-intake-activation-final-readiness-summary-report>",
      "Workspace-relative or absolute model-backed dialogue controlled executor intake activation final readiness summary report path",
    )
    .option(
      "--output-dir <dir>",
      "Workspace-relative model-backed dialogue controlled executor intake activation final readiness summary coverage output directory",
    )
    .action(
      async (
        finalReadinessSummaryReportPath: string,
        options: HermesReportModelBackedDialogueControlledExecutorIntakeActivationFinalReadinessSummaryCoverageOptions,
      ) => {
        const result =
          await writeHermesModelDecisionIntakeActivationFinalReadinessSummaryCoverageReportArtifact({
            repoRoot: process.cwd(),
            finalReadinessSummaryReportPath,
            outputDir: options.outputDir,
          });
        process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
        process.exitCode = result.report.status === "coverage_pass" ? 0 : 1;
      },
    );
  hermes
    .command("report-model-backed-dialogue-controlled-executor-intake-activation-execution-manifest-proposal")
    .description(
      "Write a read-only execution-manifest proposal report for model-backed dialogue controlled executor intake activation",
    )
    .argument(
      "<model-backed-dialogue-controlled-executor-intake-activation-final-readiness-summary-coverage-report>",
      "Workspace-relative or absolute model-backed dialogue controlled executor intake activation final readiness summary coverage report path",
    )
    .option(
      "--output-dir <dir>",
      "Workspace-relative model-backed dialogue controlled executor intake activation execution-manifest proposal output directory",
    )
    .action(
      async (
        finalReadinessSummaryCoverageReportPath: string,
        options: HermesReportModelBackedDialogueControlledExecutorIntakeActivationExecutionManifestProposalOptions,
      ) => {
        const result =
          await writeHermesModelDecisionIntakeActivationExecutionManifestProposalReportArtifact({
            repoRoot: process.cwd(),
            finalReadinessSummaryCoverageReportPath,
            outputDir: options.outputDir,
          });
        process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
        process.exitCode = result.report.status === "proposal_ready" ? 0 : 1;
      },
    );
  hermes
    .command("report-model-backed-dialogue-controlled-executor-intake-activation-execution-manifest-proposal-coverage")
    .description(
      "Write a read-only coverage report for model-backed dialogue controlled executor intake activation execution-manifest proposal",
    )
    .argument(
      "<model-backed-dialogue-controlled-executor-intake-activation-execution-manifest-proposal-report>",
      "Workspace-relative or absolute model-backed dialogue controlled executor intake activation execution-manifest proposal report path",
    )
    .option(
      "--output-dir <dir>",
      "Workspace-relative model-backed dialogue controlled executor intake activation execution-manifest proposal coverage output directory",
    )
    .action(
      async (
        executionManifestProposalReportPath: string,
        options: HermesReportModelBackedDialogueControlledExecutorIntakeActivationExecutionManifestProposalCoverageOptions,
      ) => {
        const result =
          await writeHermesModelDecisionIntakeActivationExecutionManifestProposalCoverageReportArtifact({
            repoRoot: process.cwd(),
            executionManifestProposalReportPath,
            outputDir: options.outputDir,
          });
        process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
        process.exitCode = result.report.status === "coverage_pass" ? 0 : 1;
      },
    );
  hermes
    .command("report-model-backed-dialogue-controlled-executor-intake-activation-execution-manifest-final-readiness-summary")
    .description(
      "Write a read-only final readiness summary report for model-backed dialogue controlled executor intake activation execution-manifest",
    )
    .argument(
      "<model-backed-dialogue-controlled-executor-intake-activation-execution-manifest-proposal-coverage-report>",
      "Workspace-relative or absolute model-backed dialogue controlled executor intake activation execution-manifest proposal coverage report path",
    )
    .option(
      "--output-dir <dir>",
      "Workspace-relative model-backed dialogue controlled executor intake activation execution-manifest final readiness summary output directory",
    )
    .action(
      async (
        executionManifestProposalCoverageReportPath: string,
        options: HermesReportModelBackedDialogueControlledExecutorIntakeActivationExecutionManifestFinalReadinessSummaryOptions,
      ) => {
        const result =
          await writeHermesModelDecisionIntakeActivationExecutionManifestFinalReadinessSummaryReportArtifact({
            repoRoot: process.cwd(),
            executionManifestProposalCoverageReportPath,
            outputDir: options.outputDir,
          });
        process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
        process.exitCode = result.report.status === "summary_ready" ? 0 : 1;
      },
    );

  hermes
    .command(
      "report-model-backed-dialogue-controlled-executor-intake-activation-execution-manifest-final-readiness-summary-coverage",
    )
    .description(
      "Write a read-only coverage report for model-backed dialogue controlled executor intake activation execution-manifest final readiness summary",
    )
    .argument(
      "<model-backed-dialogue-controlled-executor-intake-activation-execution-manifest-final-readiness-summary-report>",
      "Workspace-relative or absolute model-backed dialogue controlled executor intake activation execution-manifest final readiness summary report path",
    )
    .option(
      "--output-dir <dir>",
      "Workspace-relative model-backed dialogue controlled executor intake activation execution-manifest final readiness summary coverage output directory",
    )
    .action(
      async (
        executionManifestFinalReadinessSummaryReportPath: string,
        options: HermesReportModelBackedDialogueControlledExecutorIntakeActivationExecutionManifestFinalReadinessSummaryCoverageOptions,
      ) => {
        const result =
          await writeHermesModelDecisionIntakeActivationExecutionManifestFinalReadinessSummaryCoverageReportArtifact(
            {
              repoRoot: process.cwd(),
              executionManifestFinalReadinessSummaryReportPath,
              outputDir: options.outputDir,
            },
          );
        process.stdout.write(JSON.stringify(result, null, 2) + "\n");
        process.exitCode = result.report.status === "coverage_pass" ? 0 : 1;
      },
    );


  hermes
    .command(
      "report-model-backed-dialogue-controlled-executor-intake-activation-execution-manifest-next-safe-task-decision",
    )
    .description(
      "Write a read-only next-safe-task decision report for model-backed dialogue controlled executor intake activation execution-manifest",
    )
    .argument(
      "<model-backed-dialogue-controlled-executor-intake-activation-execution-manifest-final-readiness-summary-coverage-report>",
      "Workspace-relative or absolute model-backed dialogue controlled executor intake activation execution-manifest final readiness summary coverage report path",
    )
    .option(
      "--output-dir <dir>",
      "Workspace-relative model-backed dialogue controlled executor intake activation execution-manifest next-safe-task decision output directory",
    )
    .action(
      async (
        executionManifestFinalReadinessSummaryCoverageReportPath: string,
        options: HermesReportModelBackedDialogueControlledExecutorIntakeActivationExecutionManifestNextSafeTaskDecisionOptions,
      ) => {
        const result =
          await writeHermesModelDecisionIntakeActivationExecutionManifestNextSafeTaskDecisionReportArtifact(
            {
              repoRoot: process.cwd(),
              executionManifestFinalReadinessSummaryCoverageReportPath,
              outputDir: options.outputDir,
            },
          );
        process.stdout.write(JSON.stringify(result, null, 2) + "\n");
        process.exitCode = result.report.status === "decision_ready" ? 0 : 1;
      },
    );


  hermes
    .command(
      "report-model-backed-dialogue-controlled-executor-intake-activation-execution-manifest-next-safe-task-decision-coverage",
    )
    .description(
      "Write a read-only coverage report for model-backed dialogue controlled executor intake activation execution-manifest next-safe-task decision",
    )
    .argument(
      "<model-backed-dialogue-controlled-executor-intake-activation-execution-manifest-next-safe-task-decision-report>",
      "Workspace-relative or absolute model-backed dialogue controlled executor intake activation execution-manifest next-safe-task decision report path",
    )
    .option(
      "--output-dir <dir>",
      "Workspace-relative model-backed dialogue controlled executor intake activation execution-manifest next-safe-task decision coverage output directory",
    )
    .action(
      async (
        executionManifestNextSafeTaskDecisionReportPath: string,
        options: HermesReportModelBackedDialogueControlledExecutorIntakeActivationExecutionManifestNextSafeTaskDecisionCoverageOptions,
      ) => {
        const result =
          await writeHermesModelDecisionIntakeActivationExecutionManifestNextSafeTaskDecisionCoverageReportArtifact(
            {
              repoRoot: process.cwd(),
              executionManifestNextSafeTaskDecisionReportPath,
              outputDir: options.outputDir,
            },
          );
        process.stdout.write(JSON.stringify(result, null, 2) + "\n");
        process.exitCode = result.report.status === "coverage_pass" ? 0 : 1;
      },
    );

  hermes
    .command(
      "report-model-backed-dialogue-controlled-executor-intake-activation-execution-manifest-activation-readiness-delta",
    )
    .description(
      "Write a read-only activation-readiness delta report for model-backed dialogue controlled executor intake activation execution-manifest",
    )
    .argument(
      "<model-backed-dialogue-controlled-executor-intake-activation-execution-manifest-next-safe-task-decision-coverage-report>",
      "Workspace-relative or absolute model-backed dialogue controlled executor intake activation execution-manifest next-safe-task decision coverage report path",
    )
    .option(
      "--output-dir <dir>",
      "Workspace-relative model-backed dialogue controlled executor intake activation execution-manifest activation-readiness delta output directory",
    )
    .action(
      async (
        executionManifestNextSafeTaskDecisionCoverageReportPath: string,
        options: HermesReportModelBackedDialogueControlledExecutorIntakeActivationExecutionManifestActivationReadinessDeltaOptions,
      ) => {
        const result =
          await writeHermesModelDecisionIntakeActivationExecutionManifestActivationReadinessDeltaReportArtifact(
            {
              repoRoot: process.cwd(),
              executionManifestNextSafeTaskDecisionCoverageReportPath,
              outputDir: options.outputDir,
            },
          );
        process.stdout.write(JSON.stringify(result, null, 2) + "\n");
        process.exitCode = result.report.status === "delta_ready" ? 0 : 1;
      },
    );

  hermes
    .command("deploy-plan")
    .description("Create a dry-run Hermes role deployment plan")
    .argument("[request...]", "Optional deployment goal")
    .option("--model <provider/model>", "Current local model used before role-specific model split")
    .option("--taskflow-skeleton", "Return a dry-run Task Flow skeleton for the role handoff")
    .option("--write-taskflow-skeleton", "Write the dry-run Task Flow skeleton artifact")
    .option("--taskflow-output-dir <dir>", "Workspace-relative skeleton artifact output directory")
    .action(async (requestParts: string[] | undefined, options: HermesDeployPlanOptions) => {
      const request = requestParts?.join(" ");
      const result = options.writeTaskflowSkeleton
        ? await writeHermesTaskFlowSkeletonArtifact({
            repoRoot: process.cwd(),
            outputDir: options.taskflowOutputDir,
            request,
            currentModel: options.model,
          })
        : options.taskflowSkeleton
          ? buildHermesTaskFlowSkeleton({
              request,
              currentModel: options.model,
            })
          : buildHermesDeploymentPlan({
              request,
              currentModel: options.model,
            });
      process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
    });

  hermes
    .command("validate-taskflow-skeleton")
    .description("Validate a persisted dry-run Hermes Task Flow skeleton artifact")
    .argument("<artifact>", "Workspace-relative or absolute skeleton artifact path")
    .action(async (artifactPath: string) => {
      const result = await validateHermesTaskFlowSkeletonArtifact({
        repoRoot: process.cwd(),
        artifactPath,
      });
      process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
      process.exitCode = result.status === "pass" ? 0 : 1;
    });

  hermes
    .command("stage-taskflow-registry")
    .description("Write a dry-run Hermes Task Flow registry staging artifact")
    .argument("<artifact>", "Workspace-relative or absolute skeleton artifact path")
    .option("--output-dir <dir>", "Workspace-relative staging output directory")
    .action(async (artifactPath: string, options: HermesStageTaskFlowRegistryOptions) => {
      const result = await writeHermesTaskFlowRegistryStagingArtifact({
        repoRoot: process.cwd(),
        artifactPath,
        outputDir: options.outputDir,
      });
      process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
    });

  hermes
    .command("gate-taskflow-registry")
    .description("Write an explicit dry-run Task Flow registry promotion gate")
    .argument("<staging-artifact>", "Workspace-relative or absolute staging artifact path")
    .option("--output-dir <dir>", "Workspace-relative gate output directory")
    .action(async (stagingPath: string, options: HermesGateTaskFlowRegistryOptions) => {
      const result = await writeHermesTaskFlowRegistryPromotionGateArtifact({
        repoRoot: process.cwd(),
        stagingPath,
        outputDir: options.outputDir,
      });
      process.stdout.write(JSON.stringify(result, null, 2) + "\n");
    });

  hermes
    .command("write-taskflow-registry-noop")
    .description("Write a no-op Task Flow registry writer adapter artifact")
    .argument("<promotion-gate>", "Workspace-relative or absolute promotion gate artifact path")
    .option("--output-dir <dir>", "Workspace-relative no-op writer output directory")
    .action(async (gatePath: string, options: HermesNoopWriteTaskFlowRegistryOptions) => {
      const result = await writeHermesTaskFlowRegistryNoopWriteArtifact({
        repoRoot: process.cwd(),
        gatePath,
        outputDir: options.outputDir,
      });
      process.stdout.write(JSON.stringify(result, null, 2) + "\n");
    });

  hermes
    .command("preview-taskflow-registry-diff")
    .description("Write a read-only Task Flow registry preview diff artifact")
    .argument("<noop-write>", "Workspace-relative or absolute no-op writer artifact path")
    .option("--output-dir <dir>", "Workspace-relative preview diff output directory")
    .action(async (noopWritePath: string, options: HermesPreviewTaskFlowRegistryDiffOptions) => {
      const result = await writeHermesTaskFlowRegistryPreviewDiffArtifact({
        repoRoot: process.cwd(),
        noopWritePath,
        outputDir: options.outputDir,
      });
      process.stdout.write(JSON.stringify(result, null, 2) + "\n");
    });

  hermes
    .command("request-taskflow-registry-approval")
    .description("Write a pending operator approval artifact for a registry preview diff")
    .argument("<preview-diff>", "Workspace-relative or absolute preview diff artifact path")
    .option("--output-dir <dir>", "Workspace-relative approval request output directory")
    .action(async (previewPath: string, options: HermesRequestTaskFlowRegistryApprovalOptions) => {
      const result = await writeHermesTaskFlowRegistryOperatorApprovalRequestArtifact({
        repoRoot: process.cwd(),
        previewPath,
        outputDir: options.outputDir,
      });
      process.stdout.write(JSON.stringify(result, null, 2) + "\n");
    });
  hermes
    .command("validate-taskflow-registry-approval")
    .description("Validate a pending operator approval artifact without enabling writes")
    .argument("<operator-approval>", "Workspace-relative or absolute operator approval path")
    .option("--output-dir <dir>", "Workspace-relative validation artifact output directory")
    .action(
      async (approvalPath: string, options: HermesValidateTaskFlowRegistryApprovalOptions) => {
        const result = await writeHermesTaskFlowRegistryOperatorApprovalValidationArtifact({
          repoRoot: process.cwd(),
          approvalPath,
          outputDir: options.outputDir,
        });
        process.stdout.write(JSON.stringify(result, null, 2) + "\n");
        process.exitCode = result.validation.status === "pass" ? 0 : 1;
      },
    );

  hermes
    .command("snapshot-taskflow-registry-dry-run")
    .description("Normalize an OpenClaw Task Flow list JSON export into a read-only snapshot")
    .argument(
      "[taskflow-list-json]",
      "Workspace-relative JSON file from `openclaw tasks flow list --json`",
    )
    .option("--flow-id <id>", "Optional flow id hint for naming and comparison")
    .option("--output-dir <dir>", "Workspace-relative snapshot output directory")
    .action(
      async (
        taskFlowListJsonPath: string | undefined,
        options: HermesSnapshotTaskFlowRegistryDryRunOptions,
      ) => {
        const result = await writeHermesTaskFlowRegistrySnapshotArtifact({
          repoRoot: process.cwd(),
          taskFlowListJsonPath,
          flowIdHint: options.flowId,
          outputDir: options.outputDir,
        });
        process.stdout.write(JSON.stringify(result, null, 2) + "\n");
        process.exitCode = result.snapshot.status === "snapshot_ready" ? 0 : 1;
      },
    );
  hermes
    .command("read-taskflow-registry-dry-run")
    .description("Read a Task Flow registry snapshot for dry-run comparison without writes")
    .argument(
      "<approval-validation>",
      "Workspace-relative or absolute approval validation artifact path",
    )
    .option("--registry-snapshot <path>", "Workspace-relative registry snapshot JSON path")
    .option("--output-dir <dir>", "Workspace-relative read adapter output directory")
    .action(
      async (approvalValidationPath: string, options: HermesReadTaskFlowRegistryDryRunOptions) => {
        const result = await writeHermesTaskFlowRegistryReadAdapterArtifact({
          repoRoot: process.cwd(),
          approvalValidationPath,
          registrySnapshotPath: options.registrySnapshot,
          outputDir: options.outputDir,
        });
        process.stdout.write(JSON.stringify(result, null, 2) + "\n");
        process.exitCode = result.report.status === "compared" ? 0 : 1;
      },
    );

  hermes
    .command("review-taskflow-registry-write")
    .description("Write a review-only gate for a future Task Flow registry writer")
    .argument("<read-adapter>", "Workspace-relative or absolute read adapter artifact path")
    .option("--output-dir <dir>", "Workspace-relative writer review output directory")
    .action(async (readAdapterPath: string, options: HermesReviewTaskFlowRegistryWriteOptions) => {
      const result = await writeHermesTaskFlowRegistryWriterReviewArtifact({
        repoRoot: process.cwd(),
        readAdapterPath,
        outputDir: options.outputDir,
      });
      process.stdout.write(JSON.stringify(result, null, 2) + "\n");
      process.exitCode = result.review.status === "manual_approval_required" ? 0 : 1;
    });

  hermes
    .command("apply-taskflow-registry-noop")
    .description("Write a final no-op apply gate for a reviewed Task Flow registry write")
    .argument("<writer-review>", "Workspace-relative or absolute writer review artifact path")
    .option("--output-dir <dir>", "Workspace-relative no-op apply output directory")
    .action(async (writerReviewPath: string, options: HermesApplyTaskFlowRegistryNoopOptions) => {
      const result = await writeHermesTaskFlowRegistryNoopWriterApplyArtifact({
        repoRoot: process.cwd(),
        writerReviewPath,
        outputDir: options.outputDir,
      });
      process.stdout.write(JSON.stringify(result, null, 2) + "\n");
      process.exitCode = result.apply.status === "noop_applied" ? 0 : 1;
    });

  hermes
    .command("validate-taskflow-registry-approval-token")
    .description("Validate an explicit approval token challenge without enabling registry writes")
    .argument("<noop-apply>", "Workspace-relative or absolute no-op apply artifact path")
    .option("--token <token>", "Operator approval token challenge to validate")
    .option("--output-dir <dir>", "Workspace-relative approval token validation output directory")
    .action(
      async (
        noopApplyPath: string,
        options: HermesValidateTaskFlowRegistryApprovalTokenOptions,
      ) => {
        const result = await writeHermesTaskFlowRegistryApprovalTokenValidationArtifact({
          repoRoot: process.cwd(),
          noopApplyPath,
          token: options.token,
          outputDir: options.outputDir,
        });
        process.stdout.write(JSON.stringify(result, null, 2) + "\n");
        process.exitCode = result.validation.status === "token_validated" ? 0 : 1;
      },
    );

  hermes
    .command("write-taskflow-registry-writer-contract-fixture")
    .description("Write a dry-run writer contract fixture from approval token validation")
    .argument(
      "<approval-token-validation>",
      "Workspace-relative or absolute approval token validation artifact path",
    )
    .option("--output-dir <dir>", "Workspace-relative writer contract fixture output directory")
    .action(
      async (
        approvalTokenValidationPath: string,
        options: HermesWriteTaskFlowRegistryWriterContractFixtureOptions,
      ) => {
        const result = await writeHermesTaskFlowRegistryWriterContractFixtureArtifact({
          repoRoot: process.cwd(),
          approvalTokenValidationPath,
          outputDir: options.outputDir,
        });
        process.stdout.write(JSON.stringify(result, null, 2) + "\n");
        process.exitCode = result.fixture.status === "contract_ready" ? 0 : 1;
      },
    );

  hermes
    .command("report-taskflow-registry-contract-coverage")
    .description("Write a read-only coverage report for the dry-run writer contract fixture")
    .argument(
      "<writer-contract-fixture>",
      "Workspace-relative or absolute writer contract fixture artifact path",
    )
    .option("--output-dir <dir>", "Workspace-relative contract coverage report output directory")
    .action(
      async (
        writerContractFixturePath: string,
        options: HermesReportTaskFlowRegistryContractCoverageOptions,
      ) => {
        const result = await writeHermesTaskFlowRegistryContractCoverageReportArtifact({
          repoRoot: process.cwd(),
          writerContractFixturePath,
          outputDir: options.outputDir,
        });
        process.stdout.write(JSON.stringify(result, null, 2) + "\n");
        process.exitCode = result.report.status === "coverage_pass" ? 0 : 1;
      },
    );
  hermes
    .command("preflight-taskflow-registry-promotion")
    .description("Write a read-only promotion preflight report from contract coverage")
    .argument(
      "<contract-coverage-report>",
      "Workspace-relative or absolute contract coverage report artifact path",
    )
    .option("--output-dir <dir>", "Workspace-relative promotion preflight output directory")
    .action(
      async (
        contractCoverageReportPath: string,
        options: HermesPreflightTaskFlowRegistryPromotionOptions,
      ) => {
        const result = await writeHermesTaskFlowRegistryPromotionPreflightReportArtifact({
          repoRoot: process.cwd(),
          contractCoverageReportPath,
          outputDir: options.outputDir,
        });
        process.stdout.write(JSON.stringify(result, null, 2) + "\n");
        process.exitCode = result.report.status === "preflight_pass" ? 0 : 1;
      },
    );
  hermes
    .command("write-taskflow-registry-rollback-contract-fixture")
    .description("Write a dry-run rollback contract fixture from promotion preflight")
    .argument(
      "<promotion-preflight-report>",
      "Workspace-relative or absolute promotion preflight report artifact path",
    )
    .option("--output-dir <dir>", "Workspace-relative rollback contract fixture output directory")
    .action(
      async (
        promotionPreflightReportPath: string,
        options: HermesWriteTaskFlowRegistryRollbackContractFixtureOptions,
      ) => {
        const result = await writeHermesTaskFlowRegistryRollbackContractFixtureArtifact({
          repoRoot: process.cwd(),
          promotionPreflightReportPath,
          outputDir: options.outputDir,
        });
        process.stdout.write(JSON.stringify(result, null, 2) + "\n");
        process.exitCode = result.fixture.status === "rollback_ready" ? 0 : 1;
      },
    );
  hermes
    .command("report-taskflow-registry-rollback-contract-coverage")
    .description("Write a read-only coverage report for the rollback contract fixture")
    .argument(
      "<rollback-contract-fixture>",
      "Workspace-relative or absolute rollback contract fixture artifact path",
    )
    .option(
      "--output-dir <dir>",
      "Workspace-relative rollback contract coverage report output directory",
    )
    .action(
      async (
        rollbackContractFixturePath: string,
        options: HermesReportTaskFlowRegistryRollbackContractCoverageOptions,
      ) => {
        const result = await writeHermesTaskFlowRegistryRollbackContractCoverageReportArtifact({
          repoRoot: process.cwd(),
          rollbackContractFixturePath,
          outputDir: options.outputDir,
        });
        process.stdout.write(JSON.stringify(result, null, 2) + "\n");
        process.exitCode = result.report.status === "coverage_pass" ? 0 : 1;
      },
    );
  hermes
    .command("summarize-taskflow-registry-final-writer-readiness")
    .description("Write a read-only final writer readiness summary from rollback coverage")
    .argument(
      "<rollback-contract-coverage-report>",
      "Workspace-relative or absolute rollback contract coverage report path",
    )
    .option(
      "--output-dir <dir>",
      "Workspace-relative final writer readiness summary output directory",
    )
    .action(
      async (
        rollbackContractCoverageReportPath: string,
        options: HermesSummarizeTaskFlowRegistryFinalWriterReadinessOptions,
      ) => {
        const result = await writeHermesTaskFlowRegistryFinalWriterReadinessSummaryArtifact({
          repoRoot: process.cwd(),
          rollbackContractCoverageReportPath,
          outputDir: options.outputDir,
        });
        process.stdout.write(JSON.stringify(result, null, 2) + "\n");
        process.exitCode = result.summary.status === "readiness_pass" ? 0 : 1;
      },
    );
  hermes
    .command("plan-taskflow-registry-real-writer-implementation")
    .description("Write a dry-run real writer implementation plan without enabling writes")
    .argument(
      "<final-writer-readiness-summary>",
      "Workspace-relative or absolute final writer readiness summary path",
    )
    .option(
      "--output-dir <dir>",
      "Workspace-relative real writer implementation plan output directory",
    )
    .action(
      async (
        finalWriterReadinessSummaryPath: string,
        options: HermesPlanTaskFlowRegistryRealWriterImplementationOptions,
      ) => {
        const result = await writeHermesTaskFlowRegistryRealWriterImplementationPlanArtifact({
          repoRoot: process.cwd(),
          finalWriterReadinessSummaryPath,
          outputDir: options.outputDir,
        });
        process.stdout.write(JSON.stringify(result, null, 2) + "\n");
        process.exitCode = result.plan.status === "plan_ready" ? 0 : 1;
      },
    );
  hermes
    .command("report-taskflow-registry-real-writer-implementation-plan-coverage")
    .description("Write a read-only coverage report for the real writer implementation plan")
    .argument(
      "<real-writer-implementation-plan>",
      "Workspace-relative or absolute real writer implementation plan path",
    )
    .option(
      "--output-dir <dir>",
      "Workspace-relative real writer plan coverage report output directory",
    )
    .action(
      async (
        realWriterImplementationPlanPath: string,
        options: HermesReportTaskFlowRegistryRealWriterImplementationPlanCoverageOptions,
      ) => {
        const result =
          await writeHermesTaskFlowRegistryRealWriterImplementationPlanCoverageReportArtifact({
            repoRoot: process.cwd(),
            realWriterImplementationPlanPath,
            outputDir: options.outputDir,
          });
        process.stdout.write(JSON.stringify(result, null, 2) + "\n");
        process.exitCode = result.report.status === "coverage_pass" ? 0 : 1;
      },
    );
  hermes
    .command("write-taskflow-registry-real-writer-api-contract-fixture")
    .description("Write a dry-run API contract fixture for a future real Task Flow registry writer")
    .argument(
      "<real-writer-implementation-plan-coverage-report>",
      "Workspace-relative or absolute real writer implementation plan coverage report path",
    )
    .option(
      "--output-dir <dir>",
      "Workspace-relative real writer API contract fixture output directory",
    )
    .action(
      async (
        realWriterImplementationPlanCoverageReportPath: string,
        options: HermesWriteTaskFlowRegistryRealWriterApiContractFixtureOptions,
      ) => {
        const result = await writeHermesTaskFlowRegistryRealWriterApiContractFixtureArtifact({
          repoRoot: process.cwd(),
          realWriterImplementationPlanCoverageReportPath,
          outputDir: options.outputDir,
        });
        process.stdout.write(JSON.stringify(result, null, 2) + "\n");
        process.exitCode = result.fixture.status === "contract_ready" ? 0 : 1;
      },
    );
  hermes
    .command("report-taskflow-registry-real-writer-api-contract-coverage")
    .description("Write a read-only coverage report for the real writer API contract fixture")
    .argument(
      "<real-writer-api-contract-fixture>",
      "Workspace-relative or absolute real writer API contract fixture path",
    )
    .option(
      "--output-dir <dir>",
      "Workspace-relative real writer API contract coverage report output directory",
    )
    .action(
      async (
        realWriterApiContractFixturePath: string,
        options: HermesReportTaskFlowRegistryRealWriterApiContractCoverageOptions,
      ) => {
        const result = await writeHermesTaskFlowRegistryRealWriterApiContractCoverageReportArtifact(
          {
            repoRoot: process.cwd(),
            realWriterApiContractFixturePath,
            outputDir: options.outputDir,
          },
        );
        process.stdout.write(JSON.stringify(result, null, 2) + "\n");
        process.exitCode = result.report.status === "coverage_pass" ? 0 : 1;
      },
    );
  hermes
    .command("preflight-taskflow-registry-real-writer-promotion")
    .description(
      "Write a read-only promotion preflight report for the real writer API contract coverage",
    )
    .argument(
      "<real-writer-api-contract-coverage-report>",
      "Workspace-relative or absolute real writer API contract coverage report path",
    )
    .option(
      "--output-dir <dir>",
      "Workspace-relative real writer promotion preflight report output directory",
    )
    .action(
      async (
        realWriterApiContractCoverageReportPath: string,
        options: HermesPreflightTaskFlowRegistryRealWriterPromotionOptions,
      ) => {
        const result = await writeHermesTaskFlowRegistryRealWriterPromotionPreflightReportArtifact({
          repoRoot: process.cwd(),
          realWriterApiContractCoverageReportPath,
          outputDir: options.outputDir,
        });
        process.stdout.write(JSON.stringify(result, null, 2) + "\n");
        process.exitCode = result.report.status === "preflight_pass" ? 0 : 1;
      },
    );
  hermes
    .command("report-taskflow-registry-real-writer-promotion-preflight-coverage")
    .description("Write a read-only coverage report for the real writer promotion preflight")
    .argument(
      "<real-writer-promotion-preflight-report>",
      "Workspace-relative or absolute real writer promotion preflight report path",
    )
    .option(
      "--output-dir <dir>",
      "Workspace-relative real writer promotion preflight coverage report output directory",
    )
    .action(
      async (
        realWriterPromotionPreflightReportPath: string,
        options: HermesReportTaskFlowRegistryRealWriterPromotionPreflightCoverageOptions,
      ) => {
        const result =
          await writeHermesTaskFlowRegistryRealWriterPromotionPreflightCoverageReportArtifact({
            repoRoot: process.cwd(),
            realWriterPromotionPreflightReportPath,
            outputDir: options.outputDir,
          });
        process.stdout.write(JSON.stringify(result, null, 2) + "\n");
        process.exitCode = result.report.status === "coverage_pass" ? 0 : 1;
      },
    );
  hermes
    .command("report-taskflow-registry-real-writer-final-readiness-lock")
    .description("Write a read-only final readiness lock report for the real writer path")
    .argument(
      "<real-writer-promotion-preflight-coverage-report>",
      "Workspace-relative or absolute real writer promotion preflight coverage report path",
    )
    .option(
      "--output-dir <dir>",
      "Workspace-relative real writer final readiness lock report output directory",
    )
    .action(
      async (
        realWriterPromotionPreflightCoverageReportPath: string,
        options: HermesReportTaskFlowRegistryRealWriterFinalReadinessLockOptions,
      ) => {
        const result = await writeHermesTaskFlowRegistryRealWriterFinalReadinessLockReportArtifact({
          repoRoot: process.cwd(),
          realWriterPromotionPreflightCoverageReportPath,
          outputDir: options.outputDir,
        });
        process.stdout.write(JSON.stringify(result, null, 2) + "\n");
        process.exitCode = result.report.status === "lock_pass" ? 0 : 1;
      },
    );
  hermes
    .command("write-taskflow-registry-real-writer-activation-approval-token-fixture")
    .description("Write a dry-run activation approval token fixture for the real writer path")
    .argument(
      "<real-writer-final-readiness-lock-report>",
      "Workspace-relative or absolute real writer final readiness lock report path",
    )
    .option(
      "--output-dir <dir>",
      "Workspace-relative activation approval token fixture output directory",
    )
    .action(
      async (
        realWriterFinalReadinessLockReportPath: string,
        options: HermesWriteTaskFlowRegistryRealWriterActivationApprovalTokenFixtureOptions,
      ) => {
        const result =
          await writeHermesTaskFlowRegistryRealWriterActivationApprovalTokenFixtureArtifact({
            repoRoot: process.cwd(),
            realWriterFinalReadinessLockReportPath,
            outputDir: options.outputDir,
          });
        process.stdout.write(JSON.stringify(result, null, 2) + "\n");
        process.exitCode = result.fixture.status === "fixture_ready" ? 0 : 1;
      },
    );
  hermes
    .command("report-taskflow-registry-real-writer-activation-approval-token-coverage")
    .description("Write a read-only coverage report for the activation approval token fixture")
    .argument(
      "<real-writer-activation-approval-token-fixture>",
      "Workspace-relative or absolute real writer activation approval token fixture path",
    )
    .option(
      "--output-dir <dir>",
      "Workspace-relative activation approval token coverage report output directory",
    )
    .action(
      async (
        realWriterActivationApprovalTokenFixturePath: string,
        options: HermesReportTaskFlowRegistryRealWriterActivationApprovalTokenCoverageOptions,
      ) => {
        const result =
          await writeHermesTaskFlowRegistryRealWriterActivationApprovalTokenCoverageReportArtifact({
            repoRoot: process.cwd(),
            realWriterActivationApprovalTokenFixturePath,
            outputDir: options.outputDir,
          });
        process.stdout.write(JSON.stringify(result, null, 2) + "\n");
        process.exitCode = result.report.status === "coverage_pass" ? 0 : 1;
      },
    );
  hermes
    .command("preflight-taskflow-registry-real-writer-activation-approval")
    .description(
      "Write a read-only preflight report for the real writer activation approval boundary",
    )
    .argument(
      "<real-writer-activation-approval-token-coverage-report>",
      "Workspace-relative or absolute real writer activation approval token coverage report path",
    )
    .option(
      "--output-dir <dir>",
      "Workspace-relative activation approval preflight report output directory",
    )
    .action(
      async (
        realWriterActivationApprovalTokenCoverageReportPath: string,
        options: HermesPreflightTaskFlowRegistryRealWriterActivationApprovalOptions,
      ) => {
        const result =
          await writeHermesTaskFlowRegistryRealWriterActivationApprovalPreflightReportArtifact({
            repoRoot: process.cwd(),
            realWriterActivationApprovalTokenCoverageReportPath,
            outputDir: options.outputDir,
          });
        process.stdout.write(JSON.stringify(result, null, 2) + "\n");
        process.exitCode = result.report.status === "preflight_pass" ? 0 : 1;
      },
    );
  hermes
    .command("report-taskflow-registry-real-writer-activation-approval-preflight-coverage")
    .description(
      "Write a read-only coverage report for the real writer activation approval preflight",
    )
    .argument(
      "<real-writer-activation-approval-preflight-report>",
      "Workspace-relative or absolute real writer activation approval preflight report path",
    )
    .option(
      "--output-dir <dir>",
      "Workspace-relative activation approval preflight coverage report output directory",
    )
    .action(
      async (
        realWriterActivationApprovalPreflightReportPath: string,
        options: HermesReportTaskFlowRegistryRealWriterActivationApprovalPreflightCoverageOptions,
      ) => {
        const result =
          await writeHermesTaskFlowRegistryRealWriterActivationApprovalPreflightCoverageReportArtifact(
            {
              repoRoot: process.cwd(),
              realWriterActivationApprovalPreflightReportPath,
              outputDir: options.outputDir,
            },
          );
        process.stdout.write(JSON.stringify(result, null, 2) + "\n");
        process.exitCode = result.report.status === "coverage_pass" ? 0 : 1;
      },
    );
  hermes
    .command("report-taskflow-registry-real-writer-activation-final-readiness-lock")
    .description(
      "Write a read-only final readiness lock report for the real writer activation boundary",
    )
    .argument(
      "<real-writer-activation-approval-preflight-coverage-report>",
      "Workspace-relative or absolute real writer activation approval preflight coverage report path",
    )
    .option(
      "--output-dir <dir>",
      "Workspace-relative activation final readiness lock report output directory",
    )
    .action(
      async (
        realWriterActivationApprovalPreflightCoverageReportPath: string,
        options: HermesReportTaskFlowRegistryRealWriterActivationFinalReadinessLockOptions,
      ) => {
        const result =
          await writeHermesTaskFlowRegistryRealWriterActivationFinalReadinessLockReportArtifact({
            repoRoot: process.cwd(),
            realWriterActivationApprovalPreflightCoverageReportPath,
            outputDir: options.outputDir,
          });
        process.stdout.write(JSON.stringify(result, null, 2) + "\n");
        process.exitCode = result.report.status === "lock_pass" ? 0 : 1;
      },
    );
  hermes
    .command("report-taskflow-registry-real-writer-activation-final-readiness-lock-coverage")
    .description(
      "Write a read-only coverage report for the real writer activation final readiness lock",
    )
    .argument(
      "<real-writer-activation-final-readiness-lock-report>",
      "Workspace-relative or absolute real writer activation final readiness lock report path",
    )
    .option(
      "--output-dir <dir>",
      "Workspace-relative activation final readiness lock coverage report output directory",
    )
    .action(
      async (
        realWriterActivationFinalReadinessLockReportPath: string,
        options: HermesReportTaskFlowRegistryRealWriterActivationFinalReadinessLockCoverageOptions,
      ) => {
        const result =
          await writeHermesTaskFlowRegistryRealWriterActivationFinalReadinessLockCoverageReportArtifact(
            {
              repoRoot: process.cwd(),
              realWriterActivationFinalReadinessLockReportPath,
              outputDir: options.outputDir,
            },
          );
        process.stdout.write(JSON.stringify(result, null, 2) + "\n");
        process.exitCode = result.report.status === "coverage_pass" ? 0 : 1;
      },
    );
  hermes
    .command("report-taskflow-registry-real-writer-activation-release-checklist")
    .description(
      "Write a read-only release checklist report for the real writer activation boundary",
    )
    .argument(
      "<real-writer-activation-final-readiness-lock-coverage-report>",
      "Workspace-relative or absolute real writer activation final readiness lock coverage report path",
    )
    .option(
      "--output-dir <dir>",
      "Workspace-relative activation release checklist report output directory",
    )
    .action(
      async (
        realWriterActivationFinalReadinessLockCoverageReportPath: string,
        options: HermesReportTaskFlowRegistryRealWriterActivationReleaseChecklistOptions,
      ) => {
        const result =
          await writeHermesTaskFlowRegistryRealWriterActivationReleaseChecklistReportArtifact({
            repoRoot: process.cwd(),
            realWriterActivationFinalReadinessLockCoverageReportPath,
            outputDir: options.outputDir,
          });
        process.stdout.write(JSON.stringify(result, null, 2) + "\n");
        process.exitCode = result.report.status === "checklist_pass" ? 0 : 1;
      },
    );
  hermes
    .command("report-taskflow-registry-real-writer-activation-release-checklist-coverage")
    .description(
      "Write a read-only coverage report for the real writer activation release checklist",
    )
    .argument(
      "<real-writer-activation-release-checklist-report>",
      "Workspace-relative or absolute real writer activation release checklist report path",
    )
    .option(
      "--output-dir <dir>",
      "Workspace-relative activation release checklist coverage report output directory",
    )
    .action(
      async (
        realWriterActivationReleaseChecklistReportPath: string,
        options: HermesReportTaskFlowRegistryRealWriterActivationReleaseChecklistCoverageOptions,
      ) => {
        const result =
          await writeHermesTaskFlowRegistryRealWriterActivationReleaseChecklistCoverageReportArtifact(
            {
              repoRoot: process.cwd(),
              realWriterActivationReleaseChecklistReportPath,
              outputDir: options.outputDir,
            },
          );
        process.stdout.write(JSON.stringify(result, null, 2) + "\n");
        process.exitCode = result.report.status === "coverage_pass" ? 0 : 1;
      },
    );
  hermes
    .command("write-taskflow-registry-real-writer-activation-operator-handoff-packet")
    .description("Write a dry-run operator handoff packet for the real writer activation boundary")
    .argument(
      "<real-writer-activation-release-checklist-coverage-report>",
      "Workspace-relative or absolute real writer activation release checklist coverage report path",
    )
    .option(
      "--output-dir <dir>",
      "Workspace-relative activation operator handoff packet output directory",
    )
    .action(
      async (
        realWriterActivationReleaseChecklistCoverageReportPath: string,
        options: HermesWriteTaskFlowRegistryRealWriterActivationOperatorHandoffPacketOptions,
      ) => {
        const result =
          await writeHermesTaskFlowRegistryRealWriterActivationOperatorHandoffPacketArtifact({
            repoRoot: process.cwd(),
            realWriterActivationReleaseChecklistCoverageReportPath,
            outputDir: options.outputDir,
          });
        process.stdout.write(JSON.stringify(result, null, 2) + "\n");
        process.exitCode = result.packet.status === "packet_ready" ? 0 : 1;
      },
    );
  hermes
    .command("report-taskflow-registry-real-writer-activation-operator-handoff-packet-coverage")
    .description(
      "Write a read-only coverage report for the real writer activation operator handoff packet",
    )
    .argument(
      "<real-writer-activation-operator-handoff-packet>",
      "Workspace-relative or absolute real writer activation operator handoff packet path",
    )
    .option(
      "--output-dir <dir>",
      "Workspace-relative activation operator handoff packet coverage report output directory",
    )
    .action(
      async (
        realWriterActivationOperatorHandoffPacketPath: string,
        options: HermesReportTaskFlowRegistryRealWriterActivationOperatorHandoffPacketCoverageOptions,
      ) => {
        const result =
          await writeHermesTaskFlowRegistryRealWriterActivationOperatorHandoffPacketCoverageReportArtifact(
            {
              repoRoot: process.cwd(),
              realWriterActivationOperatorHandoffPacketPath,
              outputDir: options.outputDir,
            },
          );
        process.stdout.write(JSON.stringify(result, null, 2) + "\n");
        process.exitCode = result.report.status === "coverage_pass" ? 0 : 1;
      },
    );
  hermes
    .command("report-taskflow-registry-real-writer-activation-final-safety-summary")
    .description("Write a read-only final safety summary for the real writer activation boundary")
    .argument(
      "<real-writer-activation-operator-handoff-packet-coverage-report>",
      "Workspace-relative or absolute real writer activation operator handoff packet coverage report path",
    )
    .option(
      "--output-dir <dir>",
      "Workspace-relative activation final safety summary output directory",
    )
    .action(
      async (
        realWriterActivationOperatorHandoffPacketCoverageReportPath: string,
        options: HermesReportTaskFlowRegistryRealWriterActivationFinalSafetySummaryOptions,
      ) => {
        const result =
          await writeHermesTaskFlowRegistryRealWriterActivationFinalSafetySummaryArtifact({
            repoRoot: process.cwd(),
            realWriterActivationOperatorHandoffPacketCoverageReportPath,
            outputDir: options.outputDir,
          });
        process.stdout.write(JSON.stringify(result, null, 2) + "\n");
        process.exitCode = result.summary.status === "summary_ready" ? 0 : 1;
      },
    );
  hermes
    .command("report-taskflow-registry-real-writer-activation-final-safety-summary-coverage")
    .description(
      "Write a read-only coverage report for the real writer activation final safety summary",
    )
    .argument(
      "<real-writer-activation-final-safety-summary>",
      "Workspace-relative or absolute real writer activation final safety summary path",
    )
    .option(
      "--output-dir <dir>",
      "Workspace-relative activation final safety summary coverage report output directory",
    )
    .action(
      async (
        realWriterActivationFinalSafetySummaryPath: string,
        options: HermesReportTaskFlowRegistryRealWriterActivationFinalSafetySummaryCoverageOptions,
      ) => {
        const result =
          await writeHermesTaskFlowRegistryRealWriterActivationFinalSafetySummaryCoverageReportArtifact(
            {
              repoRoot: process.cwd(),
              realWriterActivationFinalSafetySummaryPath,
              outputDir: options.outputDir,
            },
          );
        process.stdout.write(JSON.stringify(result, null, 2) + "\n");
        process.exitCode = result.report.status === "coverage_pass" ? 0 : 1;
      },
    );
  hermes
    .command("write-taskflow-registry-next-safe-task-proposer-fixture")
    .description(
      "Write a dry-run next safe task proposer fixture without registry, SQLite, worker, or model execution",
    )
    .argument(
      "<real-writer-activation-final-safety-summary-coverage-report>",
      "Workspace-relative or absolute real writer activation final safety summary coverage report path",
    )
    .option(
      "--output-dir <dir>",
      "Workspace-relative next safe task proposer fixture output directory",
    )
    .action(
      async (
        realWriterActivationFinalSafetySummaryCoverageReportPath: string,
        options: HermesWriteTaskFlowRegistryNextSafeTaskProposerFixtureOptions,
      ) => {
        const result = await writeHermesTaskFlowRegistryNextSafeTaskProposerFixtureArtifact({
          repoRoot: process.cwd(),
          realWriterActivationFinalSafetySummaryCoverageReportPath,
          outputDir: options.outputDir,
        });
        process.stdout.write(JSON.stringify(result, null, 2) + "\n");
        process.exitCode = result.fixture.status === "fixture_ready" ? 0 : 1;
      },
    );
  hermes
    .command("report-taskflow-registry-next-safe-task-proposer-fixture-coverage")
    .description("Write a read-only coverage report for the next safe task proposer fixture")
    .argument(
      "<next-safe-task-proposer-fixture>",
      "Workspace-relative or absolute next safe task proposer fixture path",
    )
    .option(
      "--output-dir <dir>",
      "Workspace-relative next safe task proposer fixture coverage output directory",
    )
    .action(
      async (
        nextSafeTaskProposerFixturePath: string,
        options: HermesReportTaskFlowRegistryNextSafeTaskProposerFixtureCoverageOptions,
      ) => {
        const result =
          await writeHermesTaskFlowRegistryNextSafeTaskProposerFixtureCoverageReportArtifact({
            repoRoot: process.cwd(),
            nextSafeTaskProposerFixturePath,
            outputDir: options.outputDir,
          });
        process.stdout.write(JSON.stringify(result, null, 2) + "\n");
        process.exitCode = result.report.status === "coverage_pass" ? 0 : 1;
      },
    );
  hermes
    .command("write-taskflow-registry-task-dialoguer-fixture")
    .description("Write a dry-run task dialoguer fixture from next safe task proposer coverage")
    .argument(
      "<next-safe-task-proposer-fixture-coverage-report>",
      "Workspace-relative or absolute next safe task proposer fixture coverage report path",
    )
    .option("--output-dir <dir>", "Workspace-relative task dialoguer fixture output directory")
    .action(
      async (
        nextSafeTaskProposerFixtureCoverageReportPath: string,
        options: HermesWriteTaskFlowRegistryTaskDialoguerFixtureOptions,
      ) => {
        const result = await writeHermesTaskFlowRegistryTaskDialoguerFixtureArtifact({
          repoRoot: process.cwd(),
          nextSafeTaskProposerFixtureCoverageReportPath,
          outputDir: options.outputDir,
        });
        process.stdout.write(JSON.stringify(result, null, 2) + "\n");
        process.exitCode = result.fixture.status === "fixture_ready" ? 0 : 1;
      },
    );
  hermes
    .command("report-taskflow-registry-task-dialoguer-fixture-coverage")
    .description(
      "Write a read-only task dialoguer coverage report proving the dialogue cannot execute",
    )
    .argument(
      "<task-dialoguer-fixture>",
      "Workspace-relative or absolute task dialoguer fixture path",
    )
    .option("--output-dir <dir>", "Workspace-relative task dialoguer coverage output directory")
    .action(
      async (
        taskDialoguerFixturePath: string,
        options: HermesReportTaskFlowRegistryTaskDialoguerFixtureCoverageOptions,
      ) => {
        const result = await writeHermesTaskFlowRegistryTaskDialoguerFixtureCoverageReportArtifact({
          repoRoot: process.cwd(),
          taskDialoguerFixturePath,
          outputDir: options.outputDir,
        });
        process.stdout.write(JSON.stringify(result, null, 2) + "\n");
        process.exitCode = result.report.status === "coverage_pass" ? 0 : 1;
      },
    );
  hermes
    .command("write-taskflow-registry-task-dialoguer-handoff-package")
    .description(
      "Write a dry-run handoff package from the task dialoguer into a controlled executor loop",
    )
    .argument(
      "<task-dialoguer-fixture-coverage-report>",
      "Workspace-relative or absolute task dialoguer fixture coverage report path",
    )
    .option("--output-dir <dir>", "Workspace-relative task dialoguer handoff output directory")
    .action(
      async (
        taskDialoguerFixtureCoverageReportPath: string,
        options: HermesWriteTaskFlowRegistryTaskDialoguerHandoffPackageOptions,
      ) => {
        const result = await writeHermesTaskFlowRegistryTaskDialoguerHandoffPackageArtifact({
          repoRoot: process.cwd(),
          taskDialoguerFixtureCoverageReportPath,
          outputDir: options.outputDir,
        });
        process.stdout.write(JSON.stringify(result, null, 2) + "\n");
        process.exitCode = result.package.status === "handoff_ready" ? 0 : 1;
      },
    );
  hermes
    .command("write-taskflow-registry-task-dialoguer-reasoning-policy")
    .description("Write a read-only reasoning policy for the Hermes/OpenClaw task dialoguer")
    .argument(
      "<task-dialoguer-handoff-package>",
      "Workspace-relative or absolute task dialoguer handoff package path",
    )
    .option(
      "--output-dir <dir>",
      "Workspace-relative task dialoguer reasoning policy output directory",
    )
    .action(
      async (
        taskDialoguerHandoffPackagePath: string,
        options: HermesWriteTaskFlowRegistryTaskDialoguerReasoningPolicyOptions,
      ) => {
        const result = await writeHermesTaskFlowRegistryTaskDialoguerReasoningPolicyArtifact({
          repoRoot: process.cwd(),
          taskDialoguerHandoffPackagePath,
          outputDir: options.outputDir,
        });
        process.stdout.write(JSON.stringify(result, null, 2) + "\n");
        process.exitCode = result.policy.status === "policy_ready" ? 0 : 1;
      },
    );
  hermes
    .command("report-taskflow-registry-task-dialoguer-reasoning-policy-coverage")
    .description("Write a read-only coverage report for the task dialoguer reasoning policy")
    .argument(
      "<task-dialoguer-reasoning-policy>",
      "Workspace-relative or absolute task dialoguer reasoning policy path",
    )
    .option(
      "--output-dir <dir>",
      "Workspace-relative task dialoguer reasoning policy coverage output directory",
    )
    .action(
      async (
        taskDialoguerReasoningPolicyPath: string,
        options: HermesReportTaskFlowRegistryTaskDialoguerReasoningPolicyCoverageOptions,
      ) => {
        const result =
          await writeHermesTaskFlowRegistryTaskDialoguerReasoningPolicyCoverageReportArtifact({
            repoRoot: process.cwd(),
            taskDialoguerReasoningPolicyPath,
            outputDir: options.outputDir,
          });
        process.stdout.write(JSON.stringify(result, null, 2) + "\n");
        process.exitCode = result.report.status === "coverage_pass" ? 0 : 1;
      },
    );
  hermes
    .command("report-taskflow-registry-task-dialoguer-status-summary")
    .description("Write a read-only status summary report for the task dialoguer chain")
    .argument(
      "<task-dialoguer-reasoning-policy-coverage-report>",
      "Workspace-relative or absolute task dialoguer reasoning policy coverage report path",
    )
    .option(
      "--output-dir <dir>",
      "Workspace-relative task dialoguer status summary output directory",
    )
    .action(
      async (
        taskDialoguerReasoningPolicyCoverageReportPath: string,
        options: HermesReportTaskFlowRegistryTaskDialoguerStatusSummaryOptions,
      ) => {
        const result = await writeHermesTaskFlowRegistryTaskDialoguerStatusSummaryReportArtifact({
          repoRoot: process.cwd(),
          taskDialoguerReasoningPolicyCoverageReportPath,
          outputDir: options.outputDir,
        });
        process.stdout.write(JSON.stringify(result, null, 2) + "\n");
        process.exitCode = result.report.status === "summary_ready" ? 0 : 1;
      },
    );
  hermes
    .command("report-taskflow-registry-task-dialoguer-status-summary-coverage")
    .description("Write a read-only status summary coverage report for the task dialoguer chain")
    .argument(
      "<task-dialoguer-status-summary-report>",
      "Workspace-relative or absolute task dialoguer status summary report path",
    )
    .option(
      "--output-dir <dir>",
      "Workspace-relative task dialoguer status summary coverage output directory",
    )
    .action(
      async (
        taskDialoguerStatusSummaryPath: string,
        options: HermesReportTaskFlowRegistryTaskDialoguerStatusSummaryCoverageOptions,
      ) => {
        const result =
          await writeHermesTaskFlowRegistryTaskDialoguerStatusSummaryCoverageReportArtifact({
            repoRoot: process.cwd(),
            taskDialoguerStatusSummaryPath,
            outputDir: options.outputDir,
          });
        process.stdout.write(JSON.stringify(result, null, 2) + "\n");
        process.exitCode = result.report.status === "coverage_pass" ? 0 : 1;
      },
    );
  hermes
    .command("run-taskflow-registry-controlled-dialogue-executor-dry-run")
    .description("Start a read-only OpenClaw/Hermes controlled dialogue executor dry run")
    .argument(
      "<task-dialoguer-status-summary-coverage-report>",
      "Workspace-relative or absolute task dialoguer status summary coverage report path",
    )
    .option(
      "--output-dir <dir>",
      "Workspace-relative controlled dialogue executor dry-run output directory",
    )
    .action(
      async (
        taskDialoguerStatusSummaryCoverageReportPath: string,
        options: HermesRunTaskFlowRegistryControlledDialogueExecutorDryRunOptions,
      ) => {
        const result = await runHermesTaskFlowRegistryControlledDialogueExecutorDryRunArtifact({
          repoRoot: process.cwd(),
          taskDialoguerStatusSummaryCoverageReportPath,
          outputDir: options.outputDir,
        });
        process.stdout.write(JSON.stringify(result, null, 2) + "\n");
        process.exitCode = result.session.status === "dialogue_started" ? 0 : 1;
      },
    );
  hermes
    .command("write-taskflow-registry-controlled-executor-intake-validator")
    .description(
      "Write a read-only controlled executor intake validator from reasoning policy coverage",
    )
    .argument(
      "<task-dialoguer-reasoning-policy-coverage-report>",
      "Workspace-relative or absolute task dialoguer reasoning policy coverage report path",
    )
    .option(
      "--output-dir <dir>",
      "Workspace-relative controlled executor intake validator output directory",
    )
    .action(
      async (
        taskDialoguerReasoningPolicyCoverageReportPath: string,
        options: HermesWriteTaskFlowRegistryControlledExecutorIntakeValidatorOptions,
      ) => {
        const result = await writeHermesTaskFlowRegistryControlledExecutorIntakeValidatorArtifact({
          repoRoot: process.cwd(),
          taskDialoguerReasoningPolicyCoverageReportPath,
          outputDir: options.outputDir,
        });
        process.stdout.write(JSON.stringify(result, null, 2) + "\n");
        process.exitCode = result.validator.status === "intake_ready" ? 0 : 1;
      },
    );
  hermes
    .command("report-taskflow-registry-controlled-executor-intake-coverage")
    .description("Write a read-only controlled executor intake coverage report")
    .argument(
      "<controlled-executor-intake-validator>",
      "Workspace-relative or absolute controlled executor intake validator path",
    )
    .option(
      "--output-dir <dir>",
      "Workspace-relative controlled executor intake coverage output directory",
    )
    .action(
      async (
        controlledExecutorIntakeValidatorPath: string,
        options: HermesReportTaskFlowRegistryControlledExecutorIntakeCoverageOptions,
      ) => {
        const result =
          await writeHermesTaskFlowRegistryControlledExecutorIntakeCoverageReportArtifact({
            repoRoot: process.cwd(),
            controlledExecutorIntakeValidatorPath,
            outputDir: options.outputDir,
          });
        process.stdout.write(JSON.stringify(result, null, 2) + "\n");
        process.exitCode = result.report.status === "coverage_pass" ? 0 : 1;
      },
    );
  hermes
    .command("report-taskflow-registry-controlled-executor-intake-release-summary")
    .description("Write a read-only controlled executor intake release summary report")
    .argument(
      "<controlled-executor-intake-coverage-report>",
      "Workspace-relative or absolute controlled executor intake coverage report path",
    )
    .option(
      "--output-dir <dir>",
      "Workspace-relative controlled executor intake release summary output directory",
    )
    .action(
      async (
        controlledExecutorIntakeCoverageReportPath: string,
        options: HermesReportTaskFlowRegistryControlledExecutorIntakeReleaseSummaryOptions,
      ) => {
        const result =
          await writeHermesTaskFlowRegistryControlledExecutorIntakeReleaseSummaryReportArtifact({
            repoRoot: process.cwd(),
            controlledExecutorIntakeCoverageReportPath,
            outputDir: options.outputDir,
          });
        process.stdout.write(JSON.stringify(result, null, 2) + "\n");
        process.exitCode = result.report.status === "summary_pass" ? 0 : 1;
      },
    );
  hermes
    .command("preflight-taskflow-registry-controlled-executor-approval")
    .description("Write a read-only controlled executor approval preflight report")
    .argument(
      "<controlled-executor-intake-release-summary-report>",
      "Workspace-relative or absolute controlled executor intake release summary report path",
    )
    .option(
      "--output-dir <dir>",
      "Workspace-relative controlled executor approval preflight output directory",
    )
    .action(
      async (
        controlledExecutorIntakeReleaseSummaryReportPath: string,
        options: HermesPreflightTaskFlowRegistryControlledExecutorApprovalOptions,
      ) => {
        const result =
          await writeHermesTaskFlowRegistryControlledExecutorApprovalPreflightReportArtifact({
            repoRoot: process.cwd(),
            controlledExecutorIntakeReleaseSummaryReportPath,
            outputDir: options.outputDir,
          });
        process.stdout.write(JSON.stringify(result, null, 2) + "\n");
        process.exitCode = result.report.status === "preflight_pass" ? 0 : 1;
      },
    );
  hermes
    .command("report-taskflow-registry-controlled-executor-approval-preflight-coverage")
    .description("Write a read-only controlled executor approval preflight coverage report")
    .argument(
      "<controlled-executor-approval-preflight-report>",
      "Workspace-relative or absolute controlled executor approval preflight report path",
    )
    .option(
      "--output-dir <dir>",
      "Workspace-relative controlled executor approval preflight coverage output directory",
    )
    .action(
      async (
        controlledExecutorApprovalPreflightReportPath: string,
        options: HermesReportTaskFlowRegistryControlledExecutorApprovalPreflightCoverageOptions,
      ) => {
        const result =
          await writeHermesTaskFlowRegistryControlledExecutorApprovalPreflightCoverageReportArtifact(
            {
              repoRoot: process.cwd(),
              controlledExecutorApprovalPreflightReportPath,
              outputDir: options.outputDir,
            },
          );
        process.stdout.write(JSON.stringify(result, null, 2) + "\n");
        process.exitCode = result.report.status === "coverage_pass" ? 0 : 1;
      },
    );
  hermes
    .command("report-taskflow-registry-controlled-executor-final-readiness-lock")
    .description("Write a read-only controlled executor final readiness lock report")
    .argument(
      "<controlled-executor-approval-preflight-coverage-report>",
      "Workspace-relative or absolute controlled executor approval preflight coverage report path",
    )
    .option(
      "--output-dir <dir>",
      "Workspace-relative controlled executor final readiness lock output directory",
    )
    .action(
      async (
        controlledExecutorApprovalPreflightCoverageReportPath: string,
        options: HermesReportTaskFlowRegistryControlledExecutorFinalReadinessLockOptions,
      ) => {
        const result =
          await writeHermesTaskFlowRegistryControlledExecutorFinalReadinessLockReportArtifact({
            repoRoot: process.cwd(),
            controlledExecutorApprovalPreflightCoverageReportPath,
            outputDir: options.outputDir,
          });
        process.stdout.write(JSON.stringify(result, null, 2) + "\n");
        process.exitCode = result.report.status === "lock_pass" ? 0 : 1;
      },
    );
  hermes
    .command("report-taskflow-registry-controlled-executor-final-readiness-lock-coverage")
    .description("Write a read-only controlled executor final readiness lock coverage report")
    .argument(
      "<controlled-executor-final-readiness-lock-report>",
      "Workspace-relative or absolute controlled executor final readiness lock report path",
    )
    .option(
      "--output-dir <dir>",
      "Workspace-relative controlled executor final readiness lock coverage output directory",
    )
    .action(
      async (
        controlledExecutorFinalReadinessLockReportPath: string,
        options: HermesReportTaskFlowRegistryControlledExecutorFinalReadinessLockCoverageOptions,
      ) => {
        const result =
          await writeHermesTaskFlowRegistryControlledExecutorFinalReadinessLockCoverageReportArtifact(
            {
              repoRoot: process.cwd(),
              controlledExecutorFinalReadinessLockReportPath,
              outputDir: options.outputDir,
            },
          );
        process.stdout.write(JSON.stringify(result, null, 2) + "\n");
        process.exitCode = result.report.status === "coverage_pass" ? 0 : 1;
      },
    );
  hermes
    .command("report-taskflow-registry-controlled-executor-activation-release-checklist")
    .description("Write a read-only controlled executor activation release checklist report")
    .argument(
      "<controlled-executor-final-readiness-lock-coverage-report>",
      "Workspace-relative or absolute controlled executor final readiness lock coverage report path",
    )
    .option(
      "--output-dir <dir>",
      "Workspace-relative controlled executor activation release checklist output directory",
    )
    .action(
      async (
        controlledExecutorFinalReadinessLockCoverageReportPath: string,
        options: HermesReportTaskFlowRegistryControlledExecutorActivationReleaseChecklistOptions,
      ) => {
        const result =
          await writeHermesTaskFlowRegistryControlledExecutorActivationReleaseChecklistReportArtifact(
            {
              repoRoot: process.cwd(),
              controlledExecutorFinalReadinessLockCoverageReportPath,
              outputDir: options.outputDir,
            },
          );
        process.stdout.write(JSON.stringify(result, null, 2) + "\n");
        process.exitCode = result.report.status === "checklist_pass" ? 0 : 1;
      },
    );
  hermes
    .command("report-taskflow-registry-controlled-executor-activation-release-checklist-coverage")
    .description(
      "Write a read-only controlled executor activation release checklist coverage report",
    )
    .argument(
      "<controlled-executor-activation-release-checklist-report>",
      "Workspace-relative or absolute controlled executor activation release checklist report path",
    )
    .option(
      "--output-dir <dir>",
      "Workspace-relative controlled executor activation release checklist coverage output directory",
    )
    .action(
      async (
        controlledExecutorActivationReleaseChecklistReportPath: string,
        options: HermesReportTaskFlowRegistryControlledExecutorActivationReleaseChecklistCoverageOptions,
      ) => {
        const result =
          await writeHermesTaskFlowRegistryControlledExecutorActivationReleaseChecklistCoverageReportArtifact(
            {
              repoRoot: process.cwd(),
              controlledExecutorActivationReleaseChecklistReportPath,
              outputDir: options.outputDir,
            },
          );
        process.stdout.write(JSON.stringify(result, null, 2) + "\n");
        process.exitCode = result.report.status === "coverage_pass" ? 0 : 1;
      },
    );
  hermes
    .command("report-taskflow-registry-controlled-executor-activation-operator-handoff-packet")
    .description("Write a read-only controlled executor activation operator handoff packet report")
    .argument(
      "<controlled-executor-activation-release-checklist-coverage-report>",
      "Workspace-relative or absolute controlled executor activation release checklist coverage report path",
    )
    .option(
      "--output-dir <dir>",
      "Workspace-relative controlled executor activation operator handoff packet output directory",
    )
    .action(
      async (
        controlledExecutorActivationReleaseChecklistCoverageReportPath: string,
        options: HermesReportTaskFlowRegistryControlledExecutorActivationOperatorHandoffPacketOptions,
      ) => {
        const result =
          await writeHermesTaskFlowRegistryControlledExecutorActivationOperatorHandoffPacketReportArtifact(
            {
              repoRoot: process.cwd(),
              controlledExecutorActivationReleaseChecklistCoverageReportPath,
              outputDir: options.outputDir,
            },
          );
        process.stdout.write(JSON.stringify(result, null, 2) + "\n");
        process.exitCode = result.report.status === "handoff_ready" ? 0 : 1;
      },
    );
  hermes
    .command(
      "report-taskflow-registry-controlled-executor-activation-operator-handoff-packet-coverage",
    )
    .description(
      "Write a read-only controlled executor activation operator handoff packet coverage report",
    )
    .argument(
      "<controlled-executor-activation-operator-handoff-packet-report>",
      "Workspace-relative or absolute controlled executor activation operator handoff packet report path",
    )
    .option(
      "--output-dir <dir>",
      "Workspace-relative controlled executor activation operator handoff packet coverage output directory",
    )
    .action(
      async (
        controlledExecutorActivationOperatorHandoffPacketReportPath: string,
        options: HermesReportTaskFlowRegistryControlledExecutorActivationOperatorHandoffPacketCoverageOptions,
      ) => {
        const result =
          await writeHermesTaskFlowRegistryControlledExecutorActivationOperatorHandoffPacketCoverageReportArtifact(
            {
              repoRoot: process.cwd(),
              controlledExecutorActivationOperatorHandoffPacketReportPath,
              outputDir: options.outputDir,
            },
          );
        process.stdout.write(JSON.stringify(result, null, 2) + "\n");
        process.exitCode = result.report.status === "coverage_pass" ? 0 : 1;
      },
    );
  hermes
    .command("report-taskflow-registry-controlled-executor-activation-final-safety-summary")
    .description("Write a read-only controlled executor activation final safety summary report")
    .argument(
      "<controlled-executor-activation-operator-handoff-packet-coverage-report>",
      "Workspace-relative or absolute controlled executor activation operator handoff packet coverage report path",
    )
    .option(
      "--output-dir <dir>",
      "Workspace-relative controlled executor activation final safety summary output directory",
    )
    .action(
      async (
        controlledExecutorActivationOperatorHandoffPacketCoverageReportPath: string,
        options: HermesReportTaskFlowRegistryControlledExecutorActivationFinalSafetySummaryOptions,
      ) => {
        const result =
          await writeHermesTaskFlowRegistryControlledExecutorActivationFinalSafetySummaryReportArtifact(
            {
              repoRoot: process.cwd(),
              controlledExecutorActivationOperatorHandoffPacketCoverageReportPath,
              outputDir: options.outputDir,
            },
          );
        process.stdout.write(JSON.stringify(result, null, 2) + "\n");
        process.exitCode = result.summary.status === "summary_ready" ? 0 : 1;
      },
    );
  hermes
    .command(
      "report-taskflow-registry-controlled-executor-activation-final-safety-summary-coverage",
    )
    .description(
      "Write a read-only controlled executor activation final safety summary coverage report",
    )
    .argument(
      "<controlled-executor-activation-final-safety-summary-report>",
      "Workspace-relative or absolute controlled executor activation final safety summary report path",
    )
    .option(
      "--output-dir <dir>",
      "Workspace-relative controlled executor activation final safety summary coverage output directory",
    )
    .action(
      async (
        controlledExecutorActivationFinalSafetySummaryReportPath: string,
        options: HermesReportTaskFlowRegistryControlledExecutorActivationFinalSafetySummaryCoverageOptions,
      ) => {
        const result =
          await writeHermesTaskFlowRegistryControlledExecutorActivationFinalSafetySummaryCoverageReportArtifact(
            {
              repoRoot: process.cwd(),
              controlledExecutorActivationFinalSafetySummaryReportPath,
              outputDir: options.outputDir,
            },
          );
        process.stdout.write(JSON.stringify(result, null, 2) + "\n");
        process.exitCode = result.report.status === "coverage_pass" ? 0 : 1;
      },
    );
  hermes
    .command("report-taskflow-registry-controlled-executor-activation-next-safe-task-decision")
    .description("Write a read-only controlled executor activation next-safe-task decision report")
    .argument(
      "<controlled-executor-activation-final-safety-summary-coverage-report>",
      "Workspace-relative or absolute controlled executor activation final safety summary coverage report path",
    )
    .option(
      "--output-dir <dir>",
      "Workspace-relative controlled executor activation next-safe-task decision output directory",
    )
    .action(
      async (
        controlledExecutorActivationFinalSafetySummaryCoverageReportPath: string,
        options: HermesReportTaskFlowRegistryControlledExecutorActivationNextSafeTaskDecisionOptions,
      ) => {
        const result =
          await writeHermesTaskFlowRegistryControlledExecutorActivationNextSafeTaskDecisionReportArtifact(
            {
              repoRoot: process.cwd(),
              controlledExecutorActivationFinalSafetySummaryCoverageReportPath,
              outputDir: options.outputDir,
            },
          );
        process.stdout.write(JSON.stringify(result, null, 2) + "\n");
        process.exitCode = result.report.status === "decision_ready" ? 0 : 1;
      },
    );
  hermes
    .command("report-taskflow-registry-controlled-executor-activation-execution-manifest-proposal")
    .description(
      "Write a read-only controlled executor activation execution-manifest proposal report",
    )
    .argument(
      "<controlled-executor-activation-next-safe-task-decision-report>",
      "Workspace-relative or absolute controlled executor activation next-safe-task decision report path",
    )
    .option(
      "--output-dir <dir>",
      "Workspace-relative controlled executor activation execution-manifest proposal output directory",
    )
    .action(
      async (
        controlledExecutorActivationNextSafeTaskDecisionReportPath: string,
        options: HermesReportTaskFlowRegistryControlledExecutorActivationExecutionManifestProposalOptions,
      ) => {
        const result =
          await writeHermesTaskFlowRegistryControlledExecutorActivationExecutionManifestProposalReportArtifact(
            {
              repoRoot: process.cwd(),
              controlledExecutorActivationNextSafeTaskDecisionReportPath,
              outputDir: options.outputDir,
            },
          );
        process.stdout.write(JSON.stringify(result, null, 2) + "\n");
        process.exitCode = result.report.status === "proposal_ready" ? 0 : 1;
      },
    );
  hermes
    .command(
      "report-taskflow-registry-controlled-executor-activation-execution-manifest-proposal-coverage",
    )
    .description(
      "Write a read-only controlled executor activation execution-manifest proposal coverage report",
    )
    .argument(
      "<controlled-executor-activation-execution-manifest-proposal-report>",
      "Workspace-relative or absolute controlled executor activation execution-manifest proposal report path",
    )
    .option(
      "--output-dir <dir>",
      "Workspace-relative controlled executor activation execution-manifest proposal coverage output directory",
    )
    .action(
      async (
        controlledExecutorActivationExecutionManifestProposalReportPath: string,
        options: HermesReportTaskFlowRegistryControlledExecutorActivationExecutionManifestProposalCoverageOptions,
      ) => {
        const result =
          await writeHermesTaskFlowRegistryControlledExecutorActivationExecutionManifestProposalCoverageReportArtifact(
            {
              repoRoot: process.cwd(),
              controlledExecutorActivationExecutionManifestProposalReportPath,
              outputDir: options.outputDir,
            },
          );
        process.stdout.write(JSON.stringify(result, null, 2) + "\n");
        process.exitCode = result.report.status === "coverage_pass" ? 0 : 1;
      },
    );
  hermes
    .command(
      "report-taskflow-registry-controlled-executor-activation-execution-manifest-final-readiness-summary",
    )
    .description(
      "Write a read-only controlled executor activation execution-manifest final readiness summary report",
    )
    .argument(
      "<controlled-executor-activation-execution-manifest-proposal-coverage-report>",
      "Workspace-relative or absolute controlled executor activation execution-manifest proposal coverage report path",
    )
    .option(
      "--output-dir <dir>",
      "Workspace-relative controlled executor activation execution-manifest final readiness summary output directory",
    )
    .action(
      async (
        controlledExecutorActivationExecutionManifestProposalCoverageReportPath: string,
        options: HermesReportTaskFlowRegistryControlledExecutorActivationExecutionManifestFinalReadinessSummaryOptions,
      ) => {
        const result =
          await writeHermesTaskFlowRegistryControlledExecutorActivationExecutionManifestFinalReadinessSummaryReportArtifact(
            {
              repoRoot: process.cwd(),
              controlledExecutorActivationExecutionManifestProposalCoverageReportPath,
              outputDir: options.outputDir,
            },
          );
        process.stdout.write(JSON.stringify(result, null, 2) + "\n");
        process.exitCode = result.report.status === "summary_ready" ? 0 : 1;
      },
    );
  hermes
    .command("report-taskflow-registry-controlled-executor-activation-memory-layer-sandwich-loop")
    .description(
      "Write a read-only controlled executor activation memory-layer sandwich loop report",
    )
    .argument(
      "<controlled-executor-activation-execution-manifest-final-readiness-summary-report>",
      "Workspace-relative or absolute controlled executor activation execution-manifest final readiness summary report path",
    )
    .option(
      "--output-dir <dir>",
      "Workspace-relative controlled executor activation memory-layer sandwich loop output directory",
    )
    .action(
      async (
        controlledExecutorActivationExecutionManifestFinalReadinessSummaryReportPath: string,
        options: HermesReportTaskFlowRegistryControlledExecutorActivationMemoryLayerSandwichLoopOptions,
      ) => {
        const result =
          await writeHermesTaskFlowRegistryControlledExecutorActivationMemoryLayerSandwichLoopReportArtifact(
            {
              repoRoot: process.cwd(),
              controlledExecutorActivationExecutionManifestFinalReadinessSummaryReportPath,
              outputDir: options.outputDir,
            },
          );
        process.stdout.write(JSON.stringify(result, null, 2) + "\n");
        process.exitCode = result.report.status === "loop_ready" ? 0 : 1;
      },
    );
  hermes
    .command(
      "run-taskflow-registry-controlled-executor-activation-memory-layer-sandwich-loop-dry-run",
    )
    .description("Run the controlled memory-layer sandwich loop as a closed-loop dry-run")
    .argument(
      "<controlled-executor-activation-memory-layer-sandwich-loop-report>",
      "Workspace-relative or absolute controlled executor activation memory-layer sandwich loop report path",
    )
    .option(
      "--output-dir <dir>",
      "Workspace-relative controlled executor activation memory-layer sandwich loop dry-run output directory",
    )
    .action(
      async (
        controlledExecutorActivationMemoryLayerSandwichLoopReportPath: string,
        options: HermesRunTaskFlowRegistryControlledExecutorActivationMemoryLayerSandwichLoopDryRunOptions,
      ) => {
        const result =
          await writeHermesTaskFlowRegistryControlledExecutorActivationMemoryLayerSandwichLoopDryRunReportArtifact(
            {
              repoRoot: process.cwd(),
              controlledExecutorActivationMemoryLayerSandwichLoopReportPath,
              outputDir: options.outputDir,
            },
          );
        process.stdout.write(JSON.stringify(result, null, 2) + "\n");
        process.exitCode = result.report.status === "closed_loop_complete" ? 0 : 1;
      },
    );
  hermes
    .command("report-taskflow-registry-controlled-executor-activation-godmode-safety-lock")
    .description("Write a read-only lock report for Hermes godmode requests")
    .argument(
      "<controlled-executor-activation-memory-layer-sandwich-loop-dry-run-report>",
      "Workspace-relative or absolute controlled executor activation memory-layer sandwich loop dry-run report path",
    )
    .option(
      "--output-dir <dir>",
      "Workspace-relative controlled executor activation godmode safety lock output directory",
    )
    .action(
      async (
        controlledExecutorActivationMemoryLayerSandwichLoopDryRunReportPath: string,
        options: HermesReportTaskFlowRegistryControlledExecutorActivationGodmodeSafetyLockOptions,
      ) => {
        const result =
          await writeHermesTaskFlowRegistryControlledExecutorActivationGodmodeSafetyLockReportArtifact(
            {
              repoRoot: process.cwd(),
              controlledExecutorActivationMemoryLayerSandwichLoopDryRunReportPath,
              outputDir: options.outputDir,
            },
          );
        process.stdout.write(JSON.stringify(result, null, 2) + "\n");
        process.exitCode = result.report.status === "locked" ? 0 : 1;
      },
    );
  hermes
    .command("report-taskflow-registry-controlled-executor-activation-godmode-safety-lock-coverage")
    .description("Write a read-only coverage report for the Hermes godmode safety lock")
    .argument(
      "<controlled-executor-activation-godmode-safety-lock-report>",
      "Workspace-relative or absolute controlled executor activation godmode safety lock report path",
    )
    .option(
      "--output-dir <dir>",
      "Workspace-relative controlled executor activation godmode safety lock coverage output directory",
    )
    .action(
      async (
        controlledExecutorActivationGodmodeSafetyLockReportPath: string,
        options: HermesReportTaskFlowRegistryControlledExecutorActivationGodmodeSafetyLockCoverageOptions,
      ) => {
        const result =
          await writeHermesTaskFlowRegistryControlledExecutorActivationGodmodeSafetyLockCoverageReportArtifact(
            {
              repoRoot: process.cwd(),
              controlledExecutorActivationGodmodeSafetyLockReportPath,
              outputDir: options.outputDir,
            },
          );
        process.stdout.write(JSON.stringify(result, null, 2) + "\n");
        process.exitCode = result.report.status === "coverage_pass" ? 0 : 1;
      },
    );
  hermes
    .command("plan-taskflow-registry-controlled-executor-activation-red-team-sandbox-boundary")
    .description("Write a read-only red-team-only sandbox boundary plan")
    .argument(
      "<controlled-executor-activation-godmode-safety-lock-coverage-report>",
      "Workspace-relative or absolute controlled executor activation godmode safety lock coverage report path",
    )
    .option(
      "--output-dir <dir>",
      "Workspace-relative controlled executor activation red-team sandbox boundary plan output directory",
    )
    .action(
      async (
        controlledExecutorActivationGodmodeSafetyLockCoverageReportPath: string,
        options: HermesPlanTaskFlowRegistryControlledExecutorActivationRedTeamSandboxBoundaryOptions,
      ) => {
        const result =
          await writeHermesTaskFlowRegistryControlledExecutorActivationRedTeamSandboxBoundaryPlanArtifact(
            {
              repoRoot: process.cwd(),
              controlledExecutorActivationGodmodeSafetyLockCoverageReportPath,
              outputDir: options.outputDir,
            },
          );
        process.stdout.write(JSON.stringify(result, null, 2) + "\n");
        process.exitCode = result.plan.status === "plan_ready" ? 0 : 1;
      },
    );
  hermes
    .command(
      "report-taskflow-registry-controlled-executor-activation-red-team-sandbox-boundary-coverage",
    )
    .description("Write a read-only coverage report for the red-team-only sandbox boundary plan")
    .argument(
      "<controlled-executor-activation-red-team-sandbox-boundary-plan>",
      "Workspace-relative or absolute controlled executor activation red-team sandbox boundary plan path",
    )
    .option(
      "--output-dir <dir>",
      "Workspace-relative controlled executor activation red-team sandbox boundary coverage output directory",
    )
    .action(
      async (
        controlledExecutorActivationRedTeamSandboxBoundaryPlanPath: string,
        options: HermesReportTaskFlowRegistryControlledExecutorActivationRedTeamSandboxBoundaryCoverageOptions,
      ) => {
        const result =
          await writeHermesTaskFlowRegistryControlledExecutorActivationRedTeamSandboxBoundaryPlanCoverageReportArtifact(
            {
              repoRoot: process.cwd(),
              controlledExecutorActivationRedTeamSandboxBoundaryPlanPath,
              outputDir: options.outputDir,
            },
          );
        process.stdout.write(JSON.stringify(result, null, 2) + "\n");
        process.exitCode = result.report.status === "coverage_pass" ? 0 : 1;
      },
    );
  hermes
    .command(
      "write-taskflow-registry-controlled-executor-activation-red-team-sandbox-operator-approval-challenge-fixture",
    )
    .description("Write a read-only red-team-only sandbox operator approval challenge fixture")
    .argument(
      "<controlled-executor-activation-red-team-sandbox-boundary-plan-coverage-report>",
      "Workspace-relative or absolute controlled executor activation red-team sandbox boundary plan coverage report path",
    )
    .option(
      "--output-dir <dir>",
      "Workspace-relative controlled executor activation red-team sandbox operator approval challenge output directory",
    )
    .action(
      async (
        controlledExecutorActivationRedTeamSandboxBoundaryPlanCoverageReportPath: string,
        options: HermesWriteTaskFlowRegistryControlledExecutorActivationRedTeamSandboxOperatorApprovalChallengeOptions,
      ) => {
        const result =
          await writeHermesTaskFlowRegistryControlledExecutorActivationRedTeamSandboxOperatorApprovalChallengeFixtureArtifact(
            {
              repoRoot: process.cwd(),
              controlledExecutorActivationRedTeamSandboxBoundaryPlanCoverageReportPath,
              outputDir: options.outputDir,
            },
          );
        process.stdout.write(JSON.stringify(result, null, 2) + "\n");
        process.exitCode = result.fixture.status === "fixture_ready" ? 0 : 1;
      },
    );
  hermes
    .command(
      "report-taskflow-registry-controlled-executor-activation-red-team-sandbox-operator-approval-challenge-coverage",
    )
    .description(
      "Write a read-only red-team-only sandbox operator approval challenge coverage report",
    )
    .argument(
      "<controlled-executor-activation-red-team-sandbox-operator-approval-challenge-fixture>",
      "Workspace-relative or absolute controlled executor activation red-team sandbox operator approval challenge fixture path",
    )
    .option(
      "--output-dir <dir>",
      "Workspace-relative controlled executor activation red-team sandbox operator approval challenge coverage output directory",
    )
    .action(
      async (
        controlledExecutorActivationRedTeamSandboxOperatorApprovalChallengeFixturePath: string,
        options: HermesReportTaskFlowRegistryControlledExecutorActivationRedTeamSandboxOperatorApprovalChallengeCoverageOptions,
      ) => {
        const result =
          await writeHermesTaskFlowRegistryControlledExecutorActivationRedTeamSandboxOperatorApprovalChallengeCoverageReportArtifact(
            {
              repoRoot: process.cwd(),
              controlledExecutorActivationRedTeamSandboxOperatorApprovalChallengeFixturePath,
              outputDir: options.outputDir,
            },
          );
        process.stdout.write(JSON.stringify(result, null, 2) + "\n");
        process.exitCode = result.report.status === "coverage_pass" ? 0 : 1;
      },
    );
  hermes
    .command(
      "report-taskflow-registry-controlled-executor-activation-red-team-sandbox-final-safety-summary",
    )
    .description("Write a read-only red-team-only sandbox final safety summary report")
    .argument(
      "<controlled-executor-activation-red-team-sandbox-operator-approval-challenge-coverage-report>",
      "Workspace-relative or absolute controlled executor activation red-team sandbox operator approval challenge coverage report path",
    )
    .option(
      "--output-dir <dir>",
      "Workspace-relative controlled executor activation red-team sandbox final safety summary output directory",
    )
    .action(
      async (
        controlledExecutorActivationRedTeamSandboxOperatorApprovalChallengeCoverageReportPath: string,
        options: HermesReportTaskFlowRegistryControlledExecutorActivationRedTeamSandboxFinalSafetySummaryOptions,
      ) => {
        const result =
          await writeHermesTaskFlowRegistryControlledExecutorActivationRedTeamSandboxFinalSafetySummaryReportArtifact(
            {
              repoRoot: process.cwd(),
              controlledExecutorActivationRedTeamSandboxOperatorApprovalChallengeCoverageReportPath,
              outputDir: options.outputDir,
            },
          );
        process.stdout.write(JSON.stringify(result, null, 2) + "\n");
        process.exitCode = result.report.status === "summary_ready" ? 0 : 1;
      },
    );
  hermes
    .command(
      "report-taskflow-registry-controlled-executor-activation-red-team-sandbox-final-safety-summary-coverage",
    )
    .description("Write a read-only red-team-only sandbox final safety summary coverage report")
    .argument(
      "<controlled-executor-activation-red-team-sandbox-final-safety-summary-report>",
      "Workspace-relative or absolute controlled executor activation red-team sandbox final safety summary report path",
    )
    .option(
      "--output-dir <dir>",
      "Workspace-relative controlled executor activation red-team sandbox final safety summary coverage output directory",
    )
    .action(
      async (
        controlledExecutorActivationRedTeamSandboxFinalSafetySummaryReportPath: string,
        options: HermesReportTaskFlowRegistryControlledExecutorActivationRedTeamSandboxFinalSafetySummaryCoverageOptions,
      ) => {
        const result =
          await writeHermesTaskFlowRegistryControlledExecutorActivationRedTeamSandboxFinalSafetySummaryCoverageReportArtifact(
            {
              repoRoot: process.cwd(),
              controlledExecutorActivationRedTeamSandboxFinalSafetySummaryReportPath,
              outputDir: options.outputDir,
            },
          );
        process.stdout.write(JSON.stringify(result, null, 2) + "\n");
        process.exitCode = result.report.status === "coverage_pass" ? 0 : 1;
      },
    );
  hermes
    .command(
      "report-taskflow-registry-controlled-executor-activation-red-team-sandbox-operator-handoff-packet",
    )
    .description("Write a read-only red-team-only sandbox operator handoff packet")
    .argument(
      "<controlled-executor-activation-red-team-sandbox-final-safety-summary-coverage-report>",
      "Workspace-relative or absolute controlled executor activation red-team sandbox final safety summary coverage report path",
    )
    .option(
      "--output-dir <dir>",
      "Workspace-relative controlled executor activation red-team sandbox operator handoff packet output directory",
    )
    .action(
      async (
        controlledExecutorActivationRedTeamSandboxFinalSafetySummaryCoverageReportPath: string,
        options: HermesReportTaskFlowRegistryControlledExecutorActivationRedTeamSandboxOperatorHandoffPacketOptions,
      ) => {
        const result =
          await writeHermesTaskFlowRegistryControlledExecutorActivationRedTeamSandboxOperatorHandoffPacketArtifact(
            {
              repoRoot: process.cwd(),
              controlledExecutorActivationRedTeamSandboxFinalSafetySummaryCoverageReportPath,
              outputDir: options.outputDir,
            },
          );
        process.stdout.write(JSON.stringify(result, null, 2) + "\n");
        process.exitCode = result.packet.status === "handoff_ready" ? 0 : 1;
      },
    );
  hermes
    .command("learn")
    .description("Record Hermes success or failure patterns for future tasks")
    .requiredOption("--trace-id <id>", "Hermes trace id")
    .requiredOption("--status <status>", "success or failure")
    .requiredOption("--summary <text>", "Short learning summary")
    .option("--tags <csv>", "Optional comma-separated tags")
    .option("--state-dir <dir>", "Workspace-relative state directory")
    .action(async (options: HermesLearnOptions) => {
      const tags = options.tags ? options.tags.split(",") : [];
      const result = await appendHermesLearningRecord({
        repoRoot: process.cwd(),
        stateDir: options.stateDir,
        traceId: options.traceId,
        status: options.status,
        summary: options.summary,
        tags,
      });
      process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
    });

  hermes
    .command("promote")
    .description("Run staging validation and produce promote/rollback decision")
    .requiredOption("--trace-id <id>", "Hermes trace id")
    .requiredOption("--validate <command...>", "Validation command(s) to run in order")
    .option("--timeout-ms <ms>", "Timeout for each validation command")
    .option("--output-dir <dir>", "Workspace-relative promotion report directory")
    .action(async (options: HermesPromoteOptions) => {
      const timeoutMs = options.timeoutMs ? Number.parseInt(options.timeoutMs, 10) : undefined;
      const result = await runHermesPromotionGate({
        repoRoot: process.cwd(),
        traceId: options.traceId,
        validationCommands: options.validate,
        timeoutMs,
        outputDir: options.outputDir,
      });
      process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
    });
}

function parseOptionalPositiveInteger(name: string, value: string | undefined): number | undefined {
  if (value === undefined) {
    return undefined;
  }
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    throw new Error(`${name} must be a positive integer.`);
  }
  return parsed;
}





























