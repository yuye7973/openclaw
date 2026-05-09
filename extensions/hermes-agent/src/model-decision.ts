import { mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { resolveDefaultAgentId } from "openclaw/plugin-sdk/agent-runtime";
import type { OpenClawConfig } from "openclaw/plugin-sdk/config-types";
import { getRuntimeConfig } from "openclaw/plugin-sdk/runtime-config-snapshot";
import {
  completeWithPreparedSimpleCompletionModel,
  prepareSimpleCompletionModelForAgent,
} from "openclaw/plugin-sdk/simple-completion-runtime";
import { buildHermesPlan, type HermesPlan, type HermesRiskClass } from "./task-package.js";

export type HermesModelDecision = {
  schema: "openclaw.hermes.model_decision.v1";
  trace_id: string;
  created_at: string;
  dry_run: true;
  model_invoked: true;
  agent_id: string;
  provider: string;
  model: string;
  request: string;
  risk_class: HermesRiskClass;
  approval_required: boolean;
  parsed_model_json: boolean;
  decision: {
    summary: string;
    action_plan: string[];
    validation_commands: string[];
    risk_notes: string[];
  };
  model_text: string;
  task_package: HermesPlan["task_package"];
  envelope: HermesPlan["envelope"];
  approval_request?: HermesPlan["approval_request"];
};

export type HermesModelDecisionArtifact = {
  path: string;
  decision: HermesModelDecision;
};

export type HermesModelDecisionCoverageReport = {
  schema: "openclaw.hermes.model_decision_coverage_report.v1";
  created_at: string;
  dry_run: true;
  read_only: true;
  source_model_decision: string;
  trace_id: string;
  status: "coverage_pass" | "blocked";
  validation_status: "pass" | "fail";
  failures: string[];
  coverage: {
    source_model_invoked: boolean;
    parsed_model_json: boolean;
    provider_selected: boolean;
    model_selected: boolean;
    risk_boundary_present: boolean;
    validation_commands_present: boolean;
    registry_writes_disabled: boolean;
    sqlite_writes_disabled: boolean;
    worker_execution_disabled: boolean;
    live_actions_disabled: boolean;
    coverage_ratio: number;
  };
  registry_write_allowed: false;
  taskflow_registry_write: false;
  sqlite_write: false;
  worker_execution: false;
  model_invoked: false;
  live_actions_enabled: false;
  blocked_actions: string[];
  rollback_path: string;
  next_safe_task: string;
};

export type HermesModelDecisionCoverageReportArtifact = {
  path: string;
  report: HermesModelDecisionCoverageReport;
};

export type HermesModelDecisionHandoffPlan = {
  schema: "openclaw.hermes.model_decision_handoff_plan.v1";
  created_at: string;
  dry_run: true;
  read_only: true;
  source_coverage_report: string;
  source_model_decision: string;
  trace_id: string;
  status: "handoff_ready" | "blocked";
  validation_status: "pass" | "fail";
  failures: string[];
  handoff: {
    context_type: "controlled_executor_intake_context";
    model_dialogue_coverage_pass: boolean;
    coverage_ratio: number;
    intake_context_only: true;
    operator_approval_granted: false;
    approval_required_for_execution: true;
    execution_start_allowed: false;
    registry_writer_allowed: false;
    sqlite_writer_allowed: false;
    worker_execution_allowed: false;
    model_caller_allowed: false;
    live_actions_allowed: false;
    handoff_ratio: number;
  };
  operator_approved: false;
  execution_started: false;
  registry_write_allowed: false;
  taskflow_registry_write: false;
  sqlite_write: false;
  worker_execution: false;
  model_invoked: false;
  live_actions_enabled: false;
  blocked_actions: string[];
  rollback_path: string;
  next_safe_task: string;
};

export type HermesModelDecisionHandoffPlanArtifact = {
  path: string;
  plan: HermesModelDecisionHandoffPlan;
};

export type HermesModelDecisionHandoffIntakeCoverageReport = {
  schema: "openclaw.hermes.model_decision_handoff_intake_coverage_report.v1";
  created_at: string;
  dry_run: true;
  read_only: true;
  source_handoff_plan: string;
  source_coverage_report: string;
  trace_id: string;
  status: "coverage_pass" | "blocked";
  validation_status: "pass" | "fail";
  failures: string[];
  coverage: {
    handoff_ready: boolean;
    controlled_executor_intake_context: boolean;
    intake_context_only: boolean;
    operator_approval_false: boolean;
    execution_started_false: boolean;
    registry_writes_disabled: boolean;
    sqlite_writes_disabled: boolean;
    worker_execution_disabled: boolean;
    model_invocation_disabled: boolean;
    live_actions_disabled: boolean;
    coverage_ratio: number;
  };
  operator_approved: false;
  execution_started: false;
  registry_write_allowed: false;
  taskflow_registry_write: false;
  sqlite_write: false;
  worker_execution: false;
  model_invoked: false;
  live_actions_enabled: false;
  blocked_actions: string[];
  rollback_path: string;
  next_safe_task: string;
};

export type HermesModelDecisionHandoffIntakeCoverageReportArtifact = {
  path: string;
  report: HermesModelDecisionHandoffIntakeCoverageReport;
};

export type HermesModelDecisionIntakeReleaseSummaryReport = {
  schema: "openclaw.hermes.model_decision_intake_release_summary_report.v1";
  created_at: string;
  dry_run: true;
  read_only: true;
  source_intake_coverage_report: string;
  source_handoff_plan: string;
  trace_id: string;
  status: "summary_ready" | "blocked";
  validation_status: "pass" | "fail";
  failures: string[];
  summary: {
    intake_coverage_green: boolean;
    handoff_ready: boolean;
    controlled_executor_intake_context: boolean;
    intake_context_only: boolean;
    operator_approval_false: boolean;
    execution_started_false: boolean;
    registry_writes_disabled: boolean;
    sqlite_writes_disabled: boolean;
    worker_execution_disabled: boolean;
    model_invocation_disabled: boolean;
    live_actions_disabled: boolean;
    summary_ratio: number;
  };
  operator_approved: false;
  execution_started: false;
  registry_write_allowed: false;
  taskflow_registry_write: false;
  sqlite_write: false;
  worker_execution: false;
  model_invoked: false;
  live_actions_enabled: false;
  blocked_actions: string[];
  rollback_path: string;
  next_safe_task: string;
};

export type HermesModelDecisionIntakeReleaseSummaryReportArtifact = {
  path: string;
  report: HermesModelDecisionIntakeReleaseSummaryReport;
};

export type HermesModelDecisionIntakeReleaseSummaryCoverageReport = {
  schema: "openclaw.hermes.model_decision_intake_release_summary_coverage_report.v1";
  created_at: string;
  dry_run: true;
  read_only: true;
  source_release_summary_report: string;
  source_intake_coverage_report: string;
  source_handoff_plan: string;
  trace_id: string;
  status: "coverage_pass" | "blocked";
  validation_status: "pass" | "fail";
  failures: string[];
  coverage: {
    release_summary_ready: boolean;
    intake_coverage_green: boolean;
    handoff_ready: boolean;
    controlled_executor_intake_context_boundary: boolean;
    intake_context_only: boolean;
    operator_approval_false: boolean;
    execution_started_false: boolean;
    registry_writes_disabled: boolean;
    sqlite_writes_disabled: boolean;
    worker_execution_disabled: boolean;
    model_invocation_disabled: boolean;
    live_actions_disabled: boolean;
    release_summary_not_approval: boolean;
    coverage_report_not_executor: boolean;
    coverage_ratio: number;
  };
  operator_approved: false;
  execution_started: false;
  registry_write_allowed: false;
  taskflow_registry_write: false;
  sqlite_write: false;
  worker_execution: false;
  model_invoked: false;
  live_actions_enabled: false;
  blocked_actions: string[];
  rollback_path: string;
  next_safe_task: string;
};

export type HermesModelDecisionIntakeReleaseSummaryCoverageReportArtifact = {
  path: string;
  report: HermesModelDecisionIntakeReleaseSummaryCoverageReport;
};

export type HermesModelDecisionIntakeActivationPreflightReport = {
  schema: "openclaw.hermes.model_decision_intake_activation_preflight_report.v1";
  created_at: string;
  dry_run: true;
  read_only: true;
  source_release_summary_coverage_report: string;
  source_release_summary_report: string;
  source_intake_coverage_report: string;
  source_handoff_plan: string;
  trace_id: string;
  status: "preflight_pass" | "blocked";
  validation_status: "pass" | "fail";
  failures: string[];
  preflight: {
    release_summary_coverage_green: boolean;
    release_summary_ready: boolean;
    intake_coverage_green: boolean;
    handoff_ready: boolean;
    controlled_executor_intake_context_boundary: boolean;
    operator_approval_false: boolean;
    execution_started_false: boolean;
    registry_writes_disabled: boolean;
    sqlite_writes_disabled: boolean;
    worker_execution_disabled: boolean;
    model_invocation_disabled: boolean;
    live_actions_disabled: boolean;
    preflight_ratio: number;
  };
  operator_approved: false;
  execution_started: false;
  registry_write_allowed: false;
  taskflow_registry_write: false;
  sqlite_write: false;
  worker_execution: false;
  model_invoked: false;
  live_actions_enabled: false;
  blocked_actions: string[];
  rollback_path: string;
  next_safe_task: string;
};

export type HermesModelDecisionIntakeActivationPreflightReportArtifact = {
  path: string;
  report: HermesModelDecisionIntakeActivationPreflightReport;
};

export type HermesModelDecisionIntakeActivationPreflightCoverageReport = {
  schema: "openclaw.hermes.model_decision_intake_activation_preflight_coverage_report.v1";
  created_at: string;
  dry_run: true;
  read_only: true;
  source_preflight_report: string;
  source_release_summary_coverage_report: string;
  source_release_summary_report: string;
  source_intake_coverage_report: string;
  source_handoff_plan: string;
  trace_id: string;
  status: "coverage_pass" | "blocked";
  validation_status: "pass" | "fail";
  failures: string[];
  coverage: {
    intake_activation_preflight_green: boolean;
    release_summary_coverage_green: boolean;
    release_summary_ready: boolean;
    intake_coverage_green: boolean;
    handoff_ready: boolean;
    controlled_executor_intake_context_boundary: boolean;
    operator_approval_false: boolean;
    execution_started_false: boolean;
    registry_writes_disabled: boolean;
    sqlite_writes_disabled: boolean;
    worker_execution_disabled: boolean;
    model_invocation_disabled: boolean;
    live_actions_disabled: boolean;
    preflight_report_not_approval: boolean;
    coverage_report_not_executor: boolean;
    coverage_ratio: number;
  };
  operator_approved: false;
  execution_started: false;
  registry_write_allowed: false;
  taskflow_registry_write: false;
  sqlite_write: false;
  worker_execution: false;
  model_invoked: false;
  live_actions_enabled: false;
  blocked_actions: string[];
  rollback_path: string;
  next_safe_task: string;
};

export type HermesModelDecisionIntakeActivationPreflightCoverageReportArtifact = {
  path: string;
  report: HermesModelDecisionIntakeActivationPreflightCoverageReport;
};


export type HermesModelDecisionIntakeActivationFinalReadinessSummaryReport = {
  schema: "openclaw.hermes.model_decision_intake_activation_final_readiness_summary_report.v1";
  created_at: string;
  dry_run: true;
  read_only: true;
  source_preflight_coverage_report: string;
  source_preflight_report: string;
  source_release_summary_coverage_report: string;
  source_release_summary_report: string;
  source_intake_coverage_report: string;
  source_handoff_plan: string;
  trace_id: string;
  status: "summary_ready" | "blocked";
  validation_status: "pass" | "fail";
  failures: string[];
  summary: {
    intake_activation_preflight_coverage_green: boolean;
    intake_activation_preflight_green: boolean;
    release_summary_coverage_green: boolean;
    release_summary_ready: boolean;
    intake_coverage_green: boolean;
    handoff_ready: boolean;
    controlled_executor_intake_context_boundary: boolean;
    operator_approval_false: boolean;
    execution_started_false: boolean;
    registry_writes_disabled: boolean;
    sqlite_writes_disabled: boolean;
    worker_execution_disabled: boolean;
    model_invocation_disabled: boolean;
    live_actions_disabled: boolean;
    final_readiness_summary_not_approval: boolean;
    summary_report_not_executor: boolean;
    summary_ratio: number;
  };
  operator_approved: false;
  execution_started: false;
  registry_write_allowed: false;
  taskflow_registry_write: false;
  sqlite_write: false;
  worker_execution: false;
  model_invoked: false;
  live_actions_enabled: false;
  blocked_actions: string[];
  rollback_path: string;
  next_safe_task: string;
};

export type HermesModelDecisionIntakeActivationFinalReadinessSummaryReportArtifact = {
  path: string;
  report: HermesModelDecisionIntakeActivationFinalReadinessSummaryReport;
};

export type HermesModelDecisionIntakeActivationFinalReadinessSummaryCoverageReport = {
  schema: "openclaw.hermes.model_decision_intake_activation_final_readiness_summary_coverage_report.v1";
  created_at: string;
  dry_run: true;
  read_only: true;
  source_final_readiness_summary_report: string;
  source_preflight_coverage_report: string;
  source_preflight_report: string;
  source_release_summary_coverage_report: string;
  source_release_summary_report: string;
  source_intake_coverage_report: string;
  source_handoff_plan: string;
  trace_id: string;
  status: "coverage_pass" | "blocked";
  validation_status: "pass" | "fail";
  failures: string[];
  coverage: {
    final_readiness_summary_ready: boolean;
    summary_ratio_complete: boolean;
    intake_activation_preflight_coverage_green: boolean;
    intake_activation_preflight_green: boolean;
    release_summary_coverage_green: boolean;
    release_summary_ready: boolean;
    intake_coverage_green: boolean;
    handoff_ready: boolean;
    controlled_executor_intake_context_boundary: boolean;
    operator_approval_false: boolean;
    execution_started_false: boolean;
    registry_writes_disabled: boolean;
    sqlite_writes_disabled: boolean;
    worker_execution_disabled: boolean;
    model_invocation_disabled: boolean;
    live_actions_disabled: boolean;
    final_readiness_summary_not_approval: boolean;
    coverage_report_not_executor: boolean;
    coverage_ratio: number;
  };
  operator_approved: false;
  execution_started: false;
  registry_write_allowed: false;
  taskflow_registry_write: false;
  sqlite_write: false;
  worker_execution: false;
  model_invoked: false;
  live_actions_enabled: false;
  blocked_actions: string[];
  rollback_path: string;
  next_safe_task: string;
};

export type HermesModelDecisionIntakeActivationFinalReadinessSummaryCoverageReportArtifact = {
  path: string;
  report: HermesModelDecisionIntakeActivationFinalReadinessSummaryCoverageReport;
};

export type HermesModelDecisionIntakeActivationExecutionManifestProposalReport = {
  schema: "openclaw.hermes.model_decision_intake_activation_execution_manifest_proposal_report.v1";
  created_at: string;
  dry_run: true;
  read_only: true;
  source_final_readiness_summary_coverage_report: string;
  source_final_readiness_summary_report: string;
  source_preflight_coverage_report: string;
  source_preflight_report: string;
  source_release_summary_coverage_report: string;
  source_release_summary_report: string;
  source_intake_coverage_report: string;
  source_handoff_plan: string;
  trace_id: string;
  status: "proposal_ready" | "blocked";
  validation_status: "pass" | "fail";
  failures: string[];
  required_validation_checklist: string[];
  rollback_precondition: string;
  proposal: {
    final_readiness_summary_coverage_green: boolean;
    final_readiness_summary_ready: boolean;
    summary_ratio_complete: boolean;
    intake_activation_preflight_coverage_green: boolean;
    intake_activation_preflight_green: boolean;
    release_summary_coverage_green: boolean;
    release_summary_ready: boolean;
    intake_coverage_green: boolean;
    handoff_ready: boolean;
    controlled_executor_intake_context_boundary: boolean;
    approval_required_true: boolean;
    execution_start_allowed_false: boolean;
    operator_approval_false: boolean;
    execution_started_false: boolean;
    rollback_precondition_present: boolean;
    required_validation_checklist_complete: boolean;
    registry_writes_disabled: boolean;
    sqlite_writes_disabled: boolean;
    worker_execution_disabled: boolean;
    model_invocation_disabled: boolean;
    live_actions_disabled: boolean;
    proposal_report_not_approval: boolean;
    proposal_ratio: number;
  };
  approval_required: true;
  execution_start_allowed: false;
  operator_approved: false;
  execution_started: false;
  registry_write_allowed: false;
  taskflow_registry_write: false;
  sqlite_write: false;
  worker_execution: false;
  model_invoked: false;
  live_actions_enabled: false;
  blocked_actions: string[];
  rollback_path: string;
  next_safe_task: string;
};

export type HermesModelDecisionIntakeActivationExecutionManifestProposalReportArtifact = {
  path: string;
  report: HermesModelDecisionIntakeActivationExecutionManifestProposalReport;
};

export type HermesModelDecisionIntakeActivationExecutionManifestProposalCoverageReport = {
  schema: "openclaw.hermes.model_decision_intake_activation_execution_manifest_proposal_coverage_report.v1";
  created_at: string;
  dry_run: true;
  read_only: true;
  source_execution_manifest_proposal_report: string;
  source_final_readiness_summary_coverage_report: string;
  source_final_readiness_summary_report: string;
  source_preflight_coverage_report: string;
  source_preflight_report: string;
  source_release_summary_coverage_report: string;
  source_release_summary_report: string;
  source_intake_coverage_report: string;
  source_handoff_plan: string;
  trace_id: string;
  status: "coverage_pass" | "blocked";
  validation_status: "pass" | "fail";
  failures: string[];
  coverage: {
    proposal_ready: boolean;
    proposal_ratio_complete: boolean;
    approval_required_true: boolean;
    execution_start_allowed_false: boolean;
    operator_approval_false: boolean;
    execution_started_false: boolean;
    rollback_precondition_present: boolean;
    required_validation_checklist_complete: boolean;
    registry_writes_disabled: boolean;
    sqlite_writes_disabled: boolean;
    worker_execution_disabled: boolean;
    model_invocation_disabled: boolean;
    live_actions_disabled: boolean;
    coverage_report_not_approval: boolean;
    coverage_ratio: number;
  };
  approval_required: true;
  execution_start_allowed: false;
  operator_approved: false;
  execution_started: false;
  registry_write_allowed: false;
  taskflow_registry_write: false;
  sqlite_write: false;
  worker_execution: false;
  model_invoked: false;
  live_actions_enabled: false;
  blocked_actions: string[];
  rollback_path: string;
  next_safe_task: string;
};

export type HermesModelDecisionIntakeActivationExecutionManifestProposalCoverageReportArtifact = {
  path: string;
  report: HermesModelDecisionIntakeActivationExecutionManifestProposalCoverageReport;
};

export type HermesModelDecisionIntakeActivationExecutionManifestFinalReadinessSummaryReport = {
  schema: "openclaw.hermes.model_decision_intake_activation_execution_manifest_final_readiness_summary_report.v1";
  created_at: string;
  dry_run: true;
  read_only: true;
  source_execution_manifest_proposal_coverage_report: string;
  source_execution_manifest_proposal_report: string;
  source_final_readiness_summary_coverage_report: string;
  source_final_readiness_summary_report: string;
  source_preflight_coverage_report: string;
  source_preflight_report: string;
  source_release_summary_coverage_report: string;
  source_release_summary_report: string;
  source_intake_coverage_report: string;
  source_handoff_plan: string;
  trace_id: string;
  status: "summary_ready" | "blocked";
  validation_status: "pass" | "fail";
  failures: string[];
  summary: {
    proposal_coverage_green: boolean;
    proposal_ready: boolean;
    proposal_ratio_complete: boolean;
    approval_required_true: boolean;
    execution_start_allowed_false: boolean;
    operator_approval_false: boolean;
    execution_started_false: boolean;
    rollback_precondition_present: boolean;
    required_validation_checklist_complete: boolean;
    registry_writes_disabled: boolean;
    sqlite_writes_disabled: boolean;
    worker_execution_disabled: boolean;
    model_invocation_disabled: boolean;
    live_actions_disabled: boolean;
    summary_report_not_approval: boolean;
    summary_ratio: number;
  };
  approval_required: true;
  execution_start_allowed: false;
  operator_approved: false;
  execution_started: false;
  registry_write_allowed: false;
  taskflow_registry_write: false;
  sqlite_write: false;
  worker_execution: false;
  model_invoked: false;
  live_actions_enabled: false;
  blocked_actions: string[];
  rollback_path: string;
  next_safe_task: string;
};

export type HermesModelDecisionIntakeActivationExecutionManifestFinalReadinessSummaryReportArtifact = {
  path: string;
  report: HermesModelDecisionIntakeActivationExecutionManifestFinalReadinessSummaryReport;
};


export type HermesModelDecisionIntakeActivationExecutionManifestFinalReadinessSummaryCoverageReport = {
  schema: "openclaw.hermes.model_decision_intake_activation_execution_manifest_final_readiness_summary_coverage_report.v1";
  created_at: string;
  dry_run: true;
  read_only: true;
  source_execution_manifest_final_readiness_summary_report: string;
  source_execution_manifest_proposal_coverage_report: string;
  source_execution_manifest_proposal_report: string;
  source_final_readiness_summary_coverage_report: string;
  source_final_readiness_summary_report: string;
  source_preflight_coverage_report: string;
  source_preflight_report: string;
  source_release_summary_coverage_report: string;
  source_release_summary_report: string;
  source_intake_coverage_report: string;
  source_handoff_plan: string;
  trace_id: string;
  status: "coverage_pass" | "blocked";
  validation_status: "pass" | "fail";
  failures: string[];
  coverage: {
    final_readiness_summary_ready: boolean;
    summary_ratio_complete: boolean;
    proposal_coverage_green: boolean;
    proposal_ready: boolean;
    proposal_ratio_complete: boolean;
    approval_required_true: boolean;
    execution_start_allowed_false: boolean;
    operator_approval_false: boolean;
    execution_started_false: boolean;
    rollback_precondition_present: boolean;
    required_validation_checklist_complete: boolean;
    registry_writes_disabled: boolean;
    sqlite_writes_disabled: boolean;
    worker_execution_disabled: boolean;
    model_invocation_disabled: boolean;
    live_actions_disabled: boolean;
    coverage_report_not_approval: boolean;
    coverage_ratio: number;
  };
  approval_required: true;
  execution_start_allowed: false;
  operator_approved: false;
  execution_started: false;
  registry_write_allowed: false;
  taskflow_registry_write: false;
  sqlite_write: false;
  worker_execution: false;
  model_invoked: false;
  live_actions_enabled: false;
  blocked_actions: string[];
  rollback_path: string;
  next_safe_task: string;
};

export type HermesModelDecisionIntakeActivationExecutionManifestFinalReadinessSummaryCoverageReportArtifact = {
  path: string;
  report: HermesModelDecisionIntakeActivationExecutionManifestFinalReadinessSummaryCoverageReport;
};

export type HermesModelDecisionIntakeActivationExecutionManifestNextSafeTaskDecisionReport = {
  schema: "openclaw.hermes.model_decision_intake_activation_execution_manifest_next_safe_task_decision_report.v1";
  created_at: string;
  dry_run: true;
  read_only: true;
  source_execution_manifest_final_readiness_summary_coverage_report: string;
  source_execution_manifest_final_readiness_summary_report: string;
  source_execution_manifest_proposal_coverage_report: string;
  source_execution_manifest_proposal_report: string;
  source_final_readiness_summary_coverage_report: string;
  source_final_readiness_summary_report: string;
  source_preflight_coverage_report: string;
  source_preflight_report: string;
  source_release_summary_coverage_report: string;
  source_release_summary_report: string;
  source_intake_coverage_report: string;
  source_handoff_plan: string;
  trace_id: string;
  status: "decision_ready" | "blocked";
  validation_status: "pass" | "fail";
  failures: string[];
  decision: {
    next_task: string;
    reason: string;
    risk_level: "low" | "medium" | "high";
    required_preconditions: string[];
    boundary_enforced: boolean;
  };
  approval_required: true;
  execution_start_allowed: false;
  operator_approved: false;
  execution_started: false;
  registry_write_allowed: false;
  taskflow_registry_write: false;
  sqlite_write: false;
  worker_execution: false;
  model_invoked: false;
  live_actions_enabled: false;
  blocked_actions: string[];
  rollback_path: string;
  next_safe_task: string;
};

export type HermesModelDecisionIntakeActivationExecutionManifestNextSafeTaskDecisionReportArtifact = {
  path: string;
  report: HermesModelDecisionIntakeActivationExecutionManifestNextSafeTaskDecisionReport;
};


export type HermesModelDecisionIntakeActivationExecutionManifestNextSafeTaskDecisionCoverageReport = {
  schema: "openclaw.hermes.model_decision_intake_activation_execution_manifest_next_safe_task_decision_coverage_report.v1";
  created_at: string;
  dry_run: true;
  read_only: true;
  source_execution_manifest_next_safe_task_decision_report: string;
  source_execution_manifest_final_readiness_summary_coverage_report: string;
  source_execution_manifest_final_readiness_summary_report: string;
  source_execution_manifest_proposal_coverage_report: string;
  source_execution_manifest_proposal_report: string;
  source_final_readiness_summary_coverage_report: string;
  source_final_readiness_summary_report: string;
  source_preflight_coverage_report: string;
  source_preflight_report: string;
  source_release_summary_coverage_report: string;
  source_release_summary_report: string;
  source_intake_coverage_report: string;
  source_handoff_plan: string;
  trace_id: string;
  status: "coverage_pass" | "blocked";
  validation_status: "pass" | "fail";
  failures: string[];
  coverage: {
    decision_ready: boolean;
    risk_level_low: boolean;
    boundary_enforced: boolean;
    approval_required_true: boolean;
    execution_start_allowed_false: boolean;
    operator_approval_false: boolean;
    execution_started_false: boolean;
    registry_writes_disabled: boolean;
    sqlite_writes_disabled: boolean;
    worker_execution_disabled: boolean;
    model_invocation_disabled: boolean;
    live_actions_disabled: boolean;
    required_preconditions_present: boolean;
    coverage_report_not_approval: boolean;
    coverage_ratio: number;
  };
  approval_required: true;
  execution_start_allowed: false;
  operator_approved: false;
  execution_started: false;
  registry_write_allowed: false;
  taskflow_registry_write: false;
  sqlite_write: false;
  worker_execution: false;
  model_invoked: false;
  live_actions_enabled: false;
  blocked_actions: string[];
  rollback_path: string;
  next_safe_task: string;
};

export type HermesModelDecisionIntakeActivationExecutionManifestNextSafeTaskDecisionCoverageReportArtifact = {
  path: string;
  report: HermesModelDecisionIntakeActivationExecutionManifestNextSafeTaskDecisionCoverageReport;
};

export type HermesModelDecisionIntakeActivationExecutionManifestActivationReadinessDeltaReport = {
  schema: "openclaw.hermes.model_decision_intake_activation_execution_manifest_activation_readiness_delta_report.v1";
  created_at: string;
  dry_run: true;
  read_only: true;
  source_execution_manifest_next_safe_task_decision_coverage_report: string;
  source_execution_manifest_next_safe_task_decision_report: string;
  source_execution_manifest_final_readiness_summary_coverage_report: string;
  source_execution_manifest_final_readiness_summary_report: string;
  source_execution_manifest_proposal_coverage_report: string;
  source_execution_manifest_proposal_report: string;
  source_final_readiness_summary_coverage_report: string;
  source_final_readiness_summary_report: string;
  source_preflight_coverage_report: string;
  source_preflight_report: string;
  source_release_summary_coverage_report: string;
  source_release_summary_report: string;
  source_intake_coverage_report: string;
  source_handoff_plan: string;
  trace_id: string;
  status: "delta_ready" | "blocked";
  validation_status: "pass" | "fail";
  failures: string[];
  delta: {
    decision_coverage_green: boolean;
    decision_ready: boolean;
    risk_level_low: boolean;
    boundary_enforced: boolean;
    approval_required_true: boolean;
    execution_start_allowed_false: boolean;
    operator_approval_false: boolean;
    execution_started_false: boolean;
    registry_writes_disabled: boolean;
    sqlite_writes_disabled: boolean;
    worker_execution_disabled: boolean;
    model_invocation_disabled: boolean;
    live_actions_disabled: boolean;
    delta_report_not_approval: boolean;
    delta_ratio: number;
  };
  approval_required: true;
  execution_start_allowed: false;
  operator_approved: false;
  execution_started: false;
  registry_write_allowed: false;
  taskflow_registry_write: false;
  sqlite_write: false;
  worker_execution: false;
  model_invoked: false;
  live_actions_enabled: false;
  blocked_actions: string[];
  rollback_path: string;
  next_safe_task: string;
};

export type HermesModelDecisionIntakeActivationExecutionManifestActivationReadinessDeltaReportArtifact = {
  path: string;
  report: HermesModelDecisionIntakeActivationExecutionManifestActivationReadinessDeltaReport;
};

export type HermesModelDecisionRuntime = {
  getRuntimeConfig: () => OpenClawConfig;
  resolveDefaultAgentId: (cfg: OpenClawConfig) => string;
  prepareSimpleCompletionModelForAgent: typeof prepareSimpleCompletionModelForAgent;
  completeWithPreparedSimpleCompletionModel: typeof completeWithPreparedSimpleCompletionModel;
};

export type BuildHermesModelDecisionParams = {
  request: string;
  agentId?: string;
  modelRef?: string;
  maxTokens?: number;
  now?: Date;
  runtime?: HermesModelDecisionRuntime;
};

export type WriteHermesModelDecisionArtifactParams = BuildHermesModelDecisionParams & {
  repoRoot: string;
  outputDir?: string;
};

export type WriteHermesModelDecisionCoverageReportArtifactParams = {
  repoRoot: string;
  modelDecisionPath: string;
  outputDir?: string;
  now?: Date;
};

export type WriteHermesModelDecisionHandoffPlanArtifactParams = {
  repoRoot: string;
  modelDecisionCoverageReportPath: string;
  outputDir?: string;
  now?: Date;
};

export type WriteHermesModelDecisionHandoffIntakeCoverageReportArtifactParams = {
  repoRoot: string;
  handoffPlanPath: string;
  outputDir?: string;
  now?: Date;
};

export type WriteHermesModelDecisionIntakeReleaseSummaryReportArtifactParams = {
  repoRoot: string;
  intakeCoverageReportPath: string;
  outputDir?: string;
  now?: Date;
};

export type WriteHermesModelDecisionIntakeReleaseSummaryCoverageReportArtifactParams = {
  repoRoot: string;
  releaseSummaryReportPath: string;
  outputDir?: string;
  now?: Date;
};

export type WriteHermesModelDecisionIntakeActivationPreflightReportArtifactParams = {
  repoRoot: string;
  releaseSummaryCoverageReportPath: string;
  outputDir?: string;
  now?: Date;
};

export type WriteHermesModelDecisionIntakeActivationPreflightCoverageReportArtifactParams = {
  repoRoot: string;
  preflightReportPath: string;
  outputDir?: string;
  now?: Date;
};


export type WriteHermesModelDecisionIntakeActivationFinalReadinessSummaryReportArtifactParams = {
  repoRoot: string;
  preflightCoverageReportPath: string;
  outputDir?: string;
  now?: Date;
};

export type WriteHermesModelDecisionIntakeActivationFinalReadinessSummaryCoverageReportArtifactParams = {
  repoRoot: string;
  finalReadinessSummaryReportPath: string;
  outputDir?: string;
  now?: Date;
};

export type WriteHermesModelDecisionIntakeActivationExecutionManifestProposalReportArtifactParams = {
  repoRoot: string;
  finalReadinessSummaryCoverageReportPath: string;
  outputDir?: string;
  now?: Date;
};

export type WriteHermesModelDecisionIntakeActivationExecutionManifestProposalCoverageReportArtifactParams = {
  repoRoot: string;
  executionManifestProposalReportPath: string;
  outputDir?: string;
  now?: Date;
};

export type WriteHermesModelDecisionIntakeActivationExecutionManifestFinalReadinessSummaryReportArtifactParams = {
  repoRoot: string;
  executionManifestProposalCoverageReportPath: string;
  outputDir?: string;
  now?: Date;
};


export type WriteHermesModelDecisionIntakeActivationExecutionManifestFinalReadinessSummaryCoverageReportArtifactParams = {
  repoRoot: string;
  executionManifestFinalReadinessSummaryReportPath: string;
  outputDir?: string;
  now?: Date;
};

export type WriteHermesModelDecisionIntakeActivationExecutionManifestNextSafeTaskDecisionReportArtifactParams = {
  repoRoot: string;
  executionManifestFinalReadinessSummaryCoverageReportPath: string;
  outputDir?: string;
  now?: Date;
};


export type WriteHermesModelDecisionIntakeActivationExecutionManifestNextSafeTaskDecisionCoverageReportArtifactParams = {
  repoRoot: string;
  executionManifestNextSafeTaskDecisionReportPath: string;
  outputDir?: string;
  now?: Date;
};

export type WriteHermesModelDecisionIntakeActivationExecutionManifestActivationReadinessDeltaReportArtifactParams =
  {
    repoRoot: string;
    executionManifestNextSafeTaskDecisionCoverageReportPath: string;
    outputDir?: string;
    now?: Date;
  };
const CODEX_LOCAL_TRANSPORT_ERROR =
  'The codex provider is served by the Codex app-server agent runtime, not the local simple-completion transport. Use an openai/<model> ref with agents.defaults.agentRuntime.id: "codex", run through the gateway, or use /codex commands.';

const DEFAULT_MAX_TOKENS = 1200;

const defaultRuntime: HermesModelDecisionRuntime = {
  getRuntimeConfig,
  resolveDefaultAgentId,
  prepareSimpleCompletionModelForAgent,
  completeWithPreparedSimpleCompletionModel,
};

export async function buildHermesModelDecision(
  params: BuildHermesModelDecisionParams,
): Promise<HermesModelDecision> {
  const now = params.now ?? new Date();
  const plan = buildHermesPlan(params.request, now);
  const runtime = params.runtime ?? defaultRuntime;
  const cfg = runtime.getRuntimeConfig();
  const agentId = params.agentId?.trim() || runtime.resolveDefaultAgentId(cfg);
  const prepared = await runtime.prepareSimpleCompletionModelForAgent({
    cfg,
    agentId,
    modelRef: params.modelRef,
    allowMissingApiKeyModes: ["aws-sdk"],
    skipPiDiscovery: true,
  });

  if ("error" in prepared) {
    throw new Error(prepared.error);
  }
  if (prepared.selection.provider === "codex") {
    throw new Error(CODEX_LOCAL_TRANSPORT_ERROR);
  }

  const result = await runtime.completeWithPreparedSimpleCompletionModel({
    model: prepared.model,
    auth: prepared.auth,
    cfg,
    context: {
      messages: [
        {
          role: "user",
          content: buildHermesDecisionPrompt(plan),
          timestamp: now.getTime(),
        },
      ],
    },
    options: {
      maxTokens: resolveMaxTokens(params.maxTokens, prepared.model.maxTokens),
    },
  });
  const modelText = collectModelText(result.content);
  if (!modelText) {
    throw new Error(
      `No text output returned for provider "${prepared.selection.provider}" model "${prepared.selection.modelId}".`,
    );
  }
  const parsed = parseModelDecision(modelText);
  const decision = normalizeModelDecision(parsed.value, modelText, plan);

  return {
    schema: "openclaw.hermes.model_decision.v1",
    trace_id: plan.audit.trace_id,
    created_at: plan.audit.created_at,
    dry_run: true,
    model_invoked: true,
    agent_id: agentId,
    provider: prepared.selection.provider,
    model: prepared.selection.modelId,
    request: plan.task_package.task_goal,
    risk_class: plan.task_package.risk_class,
    approval_required: plan.task_package.approval_required,
    parsed_model_json: parsed.ok,
    decision,
    model_text: modelText,
    task_package: plan.task_package,
    envelope: plan.envelope,
    ...(plan.approval_request ? { approval_request: plan.approval_request } : {}),
  };
}

export async function writeHermesModelDecisionArtifact(
  params: WriteHermesModelDecisionArtifactParams,
): Promise<HermesModelDecisionArtifact> {
  const decision = await buildHermesModelDecision(params);
  const outputDir = resolveInsideRepo(
    params.repoRoot,
    params.outputDir ?? "reports/hermes-agent/state",
  );
  await mkdir(outputDir, { recursive: true });
  const filePath = resolve(outputDir, decision.trace_id + "-model-backed-dialogue-decision.json");
  await writeFile(filePath, JSON.stringify(decision, null, 2) + "\n", "utf8");
  return {
    path: filePath,
    decision,
  };
}

export async function writeHermesModelDecisionCoverageReportArtifact(
  params: WriteHermesModelDecisionCoverageReportArtifactParams,
): Promise<HermesModelDecisionCoverageReportArtifact> {
  const modelDecisionPath = resolveInsideRepo(params.repoRoot, params.modelDecisionPath);
  const failures: string[] = [];
  let parsedDecision: unknown;

  try {
    parsedDecision = JSON.parse(await readFile(modelDecisionPath, "utf8"));
  } catch (error) {
    failures.push(
      "model-backed dialogue decision JSON parse failed: " +
        (error instanceof Error ? error.message : String(error)),
    );
  }

  if (parsedDecision !== undefined) {
    failures.push(...validateHermesModelDecision(parsedDecision));
  }

  const record = isRecord(parsedDecision) ? parsedDecision : null;
  const decision = isRecord(record?.decision) ? record.decision : null;
  const notes = readStringList(decision?.risk_notes);
  const validationCommands = readStringList(decision?.validation_commands);
  const coverage = {
    source_model_invoked: record?.model_invoked === true,
    parsed_model_json: record?.parsed_model_json === true,
    provider_selected: typeof record?.provider === "string" && record.provider.trim() !== "",
    model_selected: typeof record?.model === "string" && record.model.trim() !== "",
    risk_boundary_present:
      typeof record?.risk_class === "string" && record.risk_class.trim() !== "",
    validation_commands_present: validationCommands.length > 0,
    registry_writes_disabled: notes.includes("registry writes disabled"),
    sqlite_writes_disabled: notes.includes("SQLite writes disabled"),
    worker_execution_disabled: notes.includes("worker execution disabled"),
    live_actions_disabled: notes.includes("live actions disabled"),
  };
  const coverageChecks = Object.values(coverage);
  const coverageRatio = coverageChecks.filter(Boolean).length / Math.max(coverageChecks.length, 1);
  const validationStatus = failures.length === 0 ? "pass" : "fail";
  const coveragePass = validationStatus === "pass" && coverageRatio === 1;
  const outputDir = resolveInsideRepo(
    params.repoRoot,
    params.outputDir ?? "reports/hermes-agent/state",
  );
  await mkdir(outputDir, { recursive: true });

  const report: HermesModelDecisionCoverageReport = {
    schema: "openclaw.hermes.model_decision_coverage_report.v1",
    created_at: (params.now ?? new Date()).toISOString(),
    dry_run: true,
    read_only: true,
    source_model_decision: modelDecisionPath,
    trace_id: readTraceId(parsedDecision),
    status: coveragePass ? "coverage_pass" : "blocked",
    validation_status: validationStatus,
    failures,
    coverage: {
      ...coverage,
      coverage_ratio: coverageRatio,
    },
    registry_write_allowed: false,
    taskflow_registry_write: false,
    sqlite_write: false,
    worker_execution: false,
    model_invoked: false,
    live_actions_enabled: false,
    blocked_actions: [
      "treating model-backed dialogue as operator approval",
      "starting worker execution from model-backed dialogue",
      "writing Task Flow registry state",
      "writing SQLite state",
      "calling another model from coverage generation",
      "running live actions from model-backed dialogue",
    ],
    rollback_path:
      "Discard this read-only model decision coverage report; it did not persist registry, SQLite, worker, model, approval, or live-action state.",
    next_safe_task: coveragePass
      ? "Feed the covered model-backed dialogue decision into controlled executor intake coverage."
      : "Fix the model-backed dialogue decision artifact before using it as controlled dialogue context.",
  };
  if (coveragePass) {
    const selfValidationFailures = validateHermesModelDecisionCoverageReport(report);
    if (selfValidationFailures.length > 0) {
      throw new Error(
        "model-backed dialogue decision coverage report self-validation failed: " +
          selfValidationFailures.join("; "),
      );
    }
  }
  const filePath = resolve(
    outputDir,
    report.trace_id + "-model-backed-dialogue-decision-coverage-report.json",
  );
  await writeFile(filePath, JSON.stringify(report, null, 2) + "\n", "utf8");
  return {
    path: filePath,
    report,
  };
}


export async function writeHermesModelDecisionIntakeActivationExecutionManifestFinalReadinessSummaryCoverageReportArtifact(
  params: WriteHermesModelDecisionIntakeActivationExecutionManifestFinalReadinessSummaryCoverageReportArtifactParams,
): Promise<HermesModelDecisionIntakeActivationExecutionManifestFinalReadinessSummaryCoverageReportArtifact> {
  const executionManifestFinalReadinessSummaryReportPath = resolveInsideRepo(
    params.repoRoot,
    params.executionManifestFinalReadinessSummaryReportPath,
  );
  const failures: string[] = [];
  let parsedSummary: unknown;

  try {
    parsedSummary = JSON.parse(await readFile(executionManifestFinalReadinessSummaryReportPath, "utf8"));
  } catch (error) {
    failures.push(
      "model-backed dialogue intake activation execution-manifest final readiness summary report JSON parse failed: " +
        (error instanceof Error ? error.message : String(error)),
    );
  }

  if (parsedSummary !== undefined) {
    failures.push(
      ...validateHermesModelDecisionIntakeActivationExecutionManifestFinalReadinessSummaryReport(
        parsedSummary,
      ),
    );
  }

  const record = isRecord(parsedSummary) ? parsedSummary : null;
  const summary = isRecord(record?.summary) ? record.summary : null;

  const coverage = {
    final_readiness_summary_ready:
      record?.status === "summary_ready" && record?.validation_status === "pass",
    summary_ratio_complete: summary?.summary_ratio === 1,
    proposal_coverage_green: summary?.proposal_coverage_green === true,
    proposal_ready: summary?.proposal_ready === true,
    proposal_ratio_complete: summary?.proposal_ratio_complete === true,
    approval_required_true:
      record?.approval_required === true && summary?.approval_required_true === true,
    execution_start_allowed_false:
      record?.execution_start_allowed === false && summary?.execution_start_allowed_false === true,
    operator_approval_false:
      record?.operator_approved === false && summary?.operator_approval_false === true,
    execution_started_false:
      record?.execution_started === false && summary?.execution_started_false === true,
    rollback_precondition_present: summary?.rollback_precondition_present === true,
    required_validation_checklist_complete:
      summary?.required_validation_checklist_complete === true,
    registry_writes_disabled:
      record?.registry_write_allowed === false &&
      record?.taskflow_registry_write === false &&
      summary?.registry_writes_disabled === true,
    sqlite_writes_disabled:
      record?.sqlite_write === false && summary?.sqlite_writes_disabled === true,
    worker_execution_disabled:
      record?.worker_execution === false && summary?.worker_execution_disabled === true,
    model_invocation_disabled:
      record?.model_invoked === false && summary?.model_invocation_disabled === true,
    live_actions_disabled:
      record?.live_actions_enabled === false && summary?.live_actions_disabled === true,
    coverage_report_not_approval:
      record?.operator_approved === false &&
      record?.execution_started === false &&
      summary?.summary_report_not_approval === true,
  };
  const coverageChecks = Object.values(coverage);
  const coverageRatio =
    coverageChecks.filter(Boolean).length / Math.max(coverageChecks.length, 1);
  const validationStatus = failures.length === 0 ? "pass" : "fail";
  const coveragePass = validationStatus === "pass" && coverageRatio === 1;
  const outputDir = resolveInsideRepo(
    params.repoRoot,
    params.outputDir ?? "reports/hermes-agent/state",
  );
  await mkdir(outputDir, { recursive: true });

  const report: HermesModelDecisionIntakeActivationExecutionManifestFinalReadinessSummaryCoverageReport = {
    schema: "openclaw.hermes.model_decision_intake_activation_execution_manifest_final_readiness_summary_coverage_report.v1",
    created_at: (params.now ?? new Date()).toISOString(),
    dry_run: true,
    read_only: true,
    source_execution_manifest_final_readiness_summary_report:
      executionManifestFinalReadinessSummaryReportPath,
    source_execution_manifest_proposal_coverage_report:
      readString(record?.source_execution_manifest_proposal_coverage_report) ?? "",
    source_execution_manifest_proposal_report:
      readString(record?.source_execution_manifest_proposal_report) ?? "",
    source_final_readiness_summary_coverage_report:
      readString(record?.source_final_readiness_summary_coverage_report) ?? "",
    source_final_readiness_summary_report:
      readString(record?.source_final_readiness_summary_report) ?? "",
    source_preflight_coverage_report: readString(record?.source_preflight_coverage_report) ?? "",
    source_preflight_report: readString(record?.source_preflight_report) ?? "",
    source_release_summary_coverage_report:
      readString(record?.source_release_summary_coverage_report) ?? "",
    source_release_summary_report: readString(record?.source_release_summary_report) ?? "",
    source_intake_coverage_report: readString(record?.source_intake_coverage_report) ?? "",
    source_handoff_plan: readString(record?.source_handoff_plan) ?? "",
    trace_id: readTraceId(parsedSummary),
    status: coveragePass ? "coverage_pass" : "blocked",
    validation_status: validationStatus,
    failures,
    coverage: {
      ...coverage,
      coverage_ratio: coverageRatio,
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
    blocked_actions: [
      "treating execution-manifest final readiness summary coverage report as operator approval",
      "turning execution-manifest final readiness summary coverage report into a registry writer",
      "turning execution-manifest final readiness summary coverage report into a SQLite writer",
      "starting worker execution from execution-manifest final readiness summary coverage report",
      "calling a model from execution-manifest final readiness summary coverage report",
      "running live actions from execution-manifest final readiness summary coverage report",
    ],
    rollback_path:
      "Discard this read-only execution-manifest final readiness summary coverage report; it did not persist registry, SQLite, worker, model, approval, or live-action state.",
    next_safe_task: coveragePass
      ? "Prepare a read-only model-backed dialogue controlled executor intake activation execution-manifest next-safe-task decision report."
      : "Fix the model-backed dialogue controlled executor intake activation execution-manifest final readiness summary report before coverage promotion.",
  };
  if (coveragePass) {
    const selfValidationFailures =
      validateHermesModelDecisionIntakeActivationExecutionManifestFinalReadinessSummaryCoverageReport(
        report,
      );
    if (selfValidationFailures.length > 0) {
      throw new Error(
        "model-backed dialogue controlled executor intake activation execution-manifest final readiness summary coverage report self-validation failed: " +
          selfValidationFailures.join("; "),
      );
    }
  }
  const filePath = resolve(
    outputDir,
    report.trace_id +
      "-model-backed-dialogue-controlled-executor-intake-activation-execution-manifest-final-readiness-summary-coverage-report.json",
  );
  await writeFile(filePath, JSON.stringify(report, null, 2) + "\n", "utf8");
  return {
    path: filePath,
    report,
  };
}



export async function writeHermesModelDecisionIntakeActivationExecutionManifestNextSafeTaskDecisionReportArtifact(
  params: WriteHermesModelDecisionIntakeActivationExecutionManifestNextSafeTaskDecisionReportArtifactParams,
): Promise<HermesModelDecisionIntakeActivationExecutionManifestNextSafeTaskDecisionReportArtifact> {
  const executionManifestFinalReadinessSummaryCoverageReportPath = resolveInsideRepo(
    params.repoRoot,
    params.executionManifestFinalReadinessSummaryCoverageReportPath,
  );
  const failures: string[] = [];
  let parsedCoverage: unknown;

  try {
    parsedCoverage = JSON.parse(
      await readFile(executionManifestFinalReadinessSummaryCoverageReportPath, "utf8"),
    );
  } catch (error) {
    failures.push(
      "model-backed dialogue intake activation execution-manifest final readiness summary coverage report JSON parse failed: " +
        (error instanceof Error ? error.message : String(error)),
    );
  }

  if (parsedCoverage !== undefined) {
    failures.push(
      ...validateHermesModelDecisionIntakeActivationExecutionManifestFinalReadinessSummaryCoverageReport(
        parsedCoverage,
      ),
    );
  }

  const record = isRecord(parsedCoverage) ? parsedCoverage : null;
  const coverage = isRecord(record?.coverage) ? record.coverage : null;
  const validationStatus = failures.length === 0 ? "pass" : "fail";
  const boundaryEnforced =
    record?.approval_required === true &&
    record?.execution_start_allowed === false &&
    record?.operator_approved === false &&
    record?.execution_started === false &&
    record?.registry_write_allowed === false &&
    record?.taskflow_registry_write === false &&
    record?.sqlite_write === false &&
    record?.worker_execution === false &&
    record?.model_invoked === false &&
    record?.live_actions_enabled === false;

  const decisionReady =
    validationStatus === "pass" &&
    record?.status === "coverage_pass" &&
    record?.validation_status === "pass" &&
    coverage?.coverage_ratio === 1 &&
    boundaryEnforced;

  const report: HermesModelDecisionIntakeActivationExecutionManifestNextSafeTaskDecisionReport = {
    schema: "openclaw.hermes.model_decision_intake_activation_execution_manifest_next_safe_task_decision_report.v1",
    created_at: (params.now ?? new Date()).toISOString(),
    dry_run: true,
    read_only: true,
    source_execution_manifest_final_readiness_summary_coverage_report:
      executionManifestFinalReadinessSummaryCoverageReportPath,
    source_execution_manifest_final_readiness_summary_report:
      readString(record?.source_execution_manifest_final_readiness_summary_report) ?? "",
    source_execution_manifest_proposal_coverage_report:
      readString(record?.source_execution_manifest_proposal_coverage_report) ?? "",
    source_execution_manifest_proposal_report:
      readString(record?.source_execution_manifest_proposal_report) ?? "",
    source_final_readiness_summary_coverage_report:
      readString(record?.source_final_readiness_summary_coverage_report) ?? "",
    source_final_readiness_summary_report:
      readString(record?.source_final_readiness_summary_report) ?? "",
    source_preflight_coverage_report: readString(record?.source_preflight_coverage_report) ?? "",
    source_preflight_report: readString(record?.source_preflight_report) ?? "",
    source_release_summary_coverage_report:
      readString(record?.source_release_summary_coverage_report) ?? "",
    source_release_summary_report: readString(record?.source_release_summary_report) ?? "",
    source_intake_coverage_report: readString(record?.source_intake_coverage_report) ?? "",
    source_handoff_plan: readString(record?.source_handoff_plan) ?? "",
    trace_id: readTraceId(parsedCoverage),
    status: decisionReady ? "decision_ready" : "blocked",
    validation_status: validationStatus,
    failures,
    decision: {
      next_task:
        "Prepare a read-only model-backed dialogue controlled executor intake activation execution-manifest next-safe-task decision coverage report.",
      reason:
        "execution-manifest final readiness summary coverage is green and all execution boundaries remain locked.",
      risk_level: "low",
      required_preconditions: [
        "final readiness summary coverage status is coverage_pass",
        "coverage_ratio equals 1",
        "approval_required stays true and execution_start_allowed stays false",
        "operator_approved/execution_started stay false",
        "registry/sqlite/worker/model/live actions stay disabled",
      ],
      boundary_enforced: boundaryEnforced,
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
    blocked_actions: [
      "treating execution-manifest next-safe-task decision report as operator approval",
      "turning execution-manifest next-safe-task decision report into a registry writer",
      "turning execution-manifest next-safe-task decision report into a SQLite writer",
      "starting worker execution from execution-manifest next-safe-task decision report",
      "calling a model from execution-manifest next-safe-task decision report",
      "running live actions from execution-manifest next-safe-task decision report",
    ],
    rollback_path:
      "Discard this read-only execution-manifest next-safe-task decision report; it did not persist registry, SQLite, worker, model, approval, or live-action state.",
    next_safe_task: decisionReady
      ? "Prepare a read-only model-backed dialogue controlled executor intake activation execution-manifest next-safe-task decision coverage report."
      : "Fix the model-backed dialogue controlled executor intake activation execution-manifest final readiness summary coverage report before decision promotion.",
  };

  if (decisionReady) {
    const selfValidationFailures =
      validateHermesModelDecisionIntakeActivationExecutionManifestNextSafeTaskDecisionReport(report);
    if (selfValidationFailures.length > 0) {
      throw new Error(
        "model-backed dialogue controlled executor intake activation execution-manifest next-safe-task decision report self-validation failed: " +
          selfValidationFailures.join("; "),
      );
    }
  }

  const outputDir = resolveInsideRepo(
    params.repoRoot,
    params.outputDir ?? "reports/hermes-agent/state",
  );
  await mkdir(outputDir, { recursive: true });
  const filePath = resolve(
    outputDir,
    report.trace_id +
      "-model-backed-dialogue-controlled-executor-intake-activation-execution-manifest-next-safe-task-decision-report.json",
  );
  await writeFile(filePath, JSON.stringify(report, null, 2) + "\n", "utf8");
  return {
    path: filePath,
    report,
  };
}



export async function writeHermesModelDecisionIntakeActivationExecutionManifestNextSafeTaskDecisionCoverageReportArtifact(
  params: WriteHermesModelDecisionIntakeActivationExecutionManifestNextSafeTaskDecisionCoverageReportArtifactParams,
): Promise<HermesModelDecisionIntakeActivationExecutionManifestNextSafeTaskDecisionCoverageReportArtifact> {
  const executionManifestNextSafeTaskDecisionReportPath = resolveInsideRepo(
    params.repoRoot,
    params.executionManifestNextSafeTaskDecisionReportPath,
  );
  const failures: string[] = [];
  let parsedDecision: unknown;

  try {
    parsedDecision = JSON.parse(await readFile(executionManifestNextSafeTaskDecisionReportPath, "utf8"));
  } catch (error) {
    failures.push(
      "model-backed dialogue intake activation execution-manifest next-safe-task decision report JSON parse failed: " +
        (error instanceof Error ? error.message : String(error)),
    );
  }

  if (parsedDecision !== undefined) {
    failures.push(
      ...validateHermesModelDecisionIntakeActivationExecutionManifestNextSafeTaskDecisionReport(
        parsedDecision,
      ),
    );
  }

  const record = isRecord(parsedDecision) ? parsedDecision : null;
  const decision = isRecord(record?.decision) ? record.decision : null;

  const coverage = {
    decision_ready: record?.status === "decision_ready" && record?.validation_status === "pass",
    risk_level_low: decision?.risk_level === "low",
    boundary_enforced: decision?.boundary_enforced === true,
    approval_required_true: record?.approval_required === true,
    execution_start_allowed_false: record?.execution_start_allowed === false,
    operator_approval_false: record?.operator_approved === false,
    execution_started_false: record?.execution_started === false,
    registry_writes_disabled:
      record?.registry_write_allowed === false && record?.taskflow_registry_write === false,
    sqlite_writes_disabled: record?.sqlite_write === false,
    worker_execution_disabled: record?.worker_execution === false,
    model_invocation_disabled: record?.model_invoked === false,
    live_actions_disabled: record?.live_actions_enabled === false,
    required_preconditions_present:
      Array.isArray(decision?.required_preconditions) && decision.required_preconditions.length > 0,
    coverage_report_not_approval:
      record?.operator_approved === false && record?.execution_started === false,
  };
  const coverageChecks = Object.values(coverage);
  const coverageRatio = coverageChecks.filter(Boolean).length / Math.max(coverageChecks.length, 1);
  const validationStatus = failures.length === 0 ? "pass" : "fail";
  const coveragePass = validationStatus === "pass" && coverageRatio === 1;

  const report: HermesModelDecisionIntakeActivationExecutionManifestNextSafeTaskDecisionCoverageReport = {
    schema: "openclaw.hermes.model_decision_intake_activation_execution_manifest_next_safe_task_decision_coverage_report.v1",
    created_at: (params.now ?? new Date()).toISOString(),
    dry_run: true,
    read_only: true,
    source_execution_manifest_next_safe_task_decision_report:
      executionManifestNextSafeTaskDecisionReportPath,
    source_execution_manifest_final_readiness_summary_coverage_report:
      readString(record?.source_execution_manifest_final_readiness_summary_coverage_report) ?? "",
    source_execution_manifest_final_readiness_summary_report:
      readString(record?.source_execution_manifest_final_readiness_summary_report) ?? "",
    source_execution_manifest_proposal_coverage_report:
      readString(record?.source_execution_manifest_proposal_coverage_report) ?? "",
    source_execution_manifest_proposal_report:
      readString(record?.source_execution_manifest_proposal_report) ?? "",
    source_final_readiness_summary_coverage_report:
      readString(record?.source_final_readiness_summary_coverage_report) ?? "",
    source_final_readiness_summary_report:
      readString(record?.source_final_readiness_summary_report) ?? "",
    source_preflight_coverage_report: readString(record?.source_preflight_coverage_report) ?? "",
    source_preflight_report: readString(record?.source_preflight_report) ?? "",
    source_release_summary_coverage_report:
      readString(record?.source_release_summary_coverage_report) ?? "",
    source_release_summary_report: readString(record?.source_release_summary_report) ?? "",
    source_intake_coverage_report: readString(record?.source_intake_coverage_report) ?? "",
    source_handoff_plan: readString(record?.source_handoff_plan) ?? "",
    trace_id: readTraceId(parsedDecision),
    status: coveragePass ? "coverage_pass" : "blocked",
    validation_status: validationStatus,
    failures,
    coverage: {
      ...coverage,
      coverage_ratio: coverageRatio,
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
    blocked_actions: [
      "treating execution-manifest next-safe-task decision coverage report as operator approval",
      "turning execution-manifest next-safe-task decision coverage report into a registry writer",
      "turning execution-manifest next-safe-task decision coverage report into a SQLite writer",
      "starting worker execution from execution-manifest next-safe-task decision coverage report",
      "calling a model from execution-manifest next-safe-task decision coverage report",
      "running live actions from execution-manifest next-safe-task decision coverage report",
    ],
    rollback_path:
      "Discard this read-only execution-manifest next-safe-task decision coverage report; it did not persist registry, SQLite, worker, model, approval, or live-action state.",
    next_safe_task: coveragePass
      ? "Prepare a read-only model-backed dialogue controlled executor intake activation execution-manifest activation-readiness delta report."
      : "Fix the model-backed dialogue controlled executor intake activation execution-manifest next-safe-task decision report before coverage promotion.",
  };

  if (coveragePass) {
    const selfValidationFailures =
      validateHermesModelDecisionIntakeActivationExecutionManifestNextSafeTaskDecisionCoverageReport(
        report,
      );
    if (selfValidationFailures.length > 0) {
      throw new Error(
        "model-backed dialogue controlled executor intake activation execution-manifest next-safe-task decision coverage report self-validation failed: " +
          selfValidationFailures.join("; "),
      );
    }
  }

  const outputDir = resolveInsideRepo(
    params.repoRoot,
    params.outputDir ?? "reports/hermes-agent/state",
  );
  await mkdir(outputDir, { recursive: true });
  const filePath = resolve(
    outputDir,
    report.trace_id +
      "-model-backed-dialogue-controlled-executor-intake-activation-execution-manifest-next-safe-task-decision-coverage-report.json",
  );
  await writeFile(filePath, JSON.stringify(report, null, 2) + "\n", "utf8");
  return {
    path: filePath,
    report,
  };
}


export async function writeHermesModelDecisionIntakeActivationExecutionManifestActivationReadinessDeltaReportArtifact(
  params: WriteHermesModelDecisionIntakeActivationExecutionManifestActivationReadinessDeltaReportArtifactParams,
): Promise<HermesModelDecisionIntakeActivationExecutionManifestActivationReadinessDeltaReportArtifact> {
  const executionManifestNextSafeTaskDecisionCoverageReportPath = resolveInsideRepo(
    params.repoRoot,
    params.executionManifestNextSafeTaskDecisionCoverageReportPath,
  );
  const failures: string[] = [];
  let parsedCoverage: unknown;

  try {
    parsedCoverage = JSON.parse(
      await readFile(executionManifestNextSafeTaskDecisionCoverageReportPath, "utf8"),
    );
  } catch (error) {
    failures.push(
      "model-backed dialogue intake activation execution-manifest next-safe-task decision coverage report JSON parse failed: " +
        (error instanceof Error ? error.message : String(error)),
    );
  }

  if (parsedCoverage !== undefined) {
    failures.push(
      ...validateHermesModelDecisionIntakeActivationExecutionManifestNextSafeTaskDecisionCoverageReport(
        parsedCoverage,
      ),
    );
  }

  const record = isRecord(parsedCoverage) ? parsedCoverage : null;
  const coverage = isRecord(record?.coverage) ? record.coverage : null;

  const delta = {
    decision_coverage_green:
      record?.status === "coverage_pass" &&
      record?.validation_status === "pass" &&
      coverage?.coverage_ratio === 1,
    decision_ready: coverage?.decision_ready === true,
    risk_level_low: coverage?.risk_level_low === true,
    boundary_enforced: coverage?.boundary_enforced === true,
    approval_required_true: record?.approval_required === true,
    execution_start_allowed_false: record?.execution_start_allowed === false,
    operator_approval_false: record?.operator_approved === false,
    execution_started_false: record?.execution_started === false,
    registry_writes_disabled:
      record?.registry_write_allowed === false && record?.taskflow_registry_write === false,
    sqlite_writes_disabled: record?.sqlite_write === false,
    worker_execution_disabled: record?.worker_execution === false,
    model_invocation_disabled: record?.model_invoked === false,
    live_actions_disabled: record?.live_actions_enabled === false,
    delta_report_not_approval: record?.operator_approved === false && record?.execution_started === false,
  };
  const deltaChecks = Object.values(delta);
  const deltaRatio = deltaChecks.filter(Boolean).length / Math.max(deltaChecks.length, 1);
  const validationStatus = failures.length === 0 ? "pass" : "fail";
  const deltaReady = validationStatus === "pass" && deltaRatio === 1;

  const report: HermesModelDecisionIntakeActivationExecutionManifestActivationReadinessDeltaReport = {
    schema: "openclaw.hermes.model_decision_intake_activation_execution_manifest_activation_readiness_delta_report.v1",
    created_at: (params.now ?? new Date()).toISOString(),
    dry_run: true,
    read_only: true,
    source_execution_manifest_next_safe_task_decision_coverage_report:
      executionManifestNextSafeTaskDecisionCoverageReportPath,
    source_execution_manifest_next_safe_task_decision_report:
      readString(record?.source_execution_manifest_next_safe_task_decision_report) ?? "",
    source_execution_manifest_final_readiness_summary_coverage_report:
      readString(record?.source_execution_manifest_final_readiness_summary_coverage_report) ?? "",
    source_execution_manifest_final_readiness_summary_report:
      readString(record?.source_execution_manifest_final_readiness_summary_report) ?? "",
    source_execution_manifest_proposal_coverage_report:
      readString(record?.source_execution_manifest_proposal_coverage_report) ?? "",
    source_execution_manifest_proposal_report:
      readString(record?.source_execution_manifest_proposal_report) ?? "",
    source_final_readiness_summary_coverage_report:
      readString(record?.source_final_readiness_summary_coverage_report) ?? "",
    source_final_readiness_summary_report:
      readString(record?.source_final_readiness_summary_report) ?? "",
    source_preflight_coverage_report: readString(record?.source_preflight_coverage_report) ?? "",
    source_preflight_report: readString(record?.source_preflight_report) ?? "",
    source_release_summary_coverage_report:
      readString(record?.source_release_summary_coverage_report) ?? "",
    source_release_summary_report: readString(record?.source_release_summary_report) ?? "",
    source_intake_coverage_report: readString(record?.source_intake_coverage_report) ?? "",
    source_handoff_plan: readString(record?.source_handoff_plan) ?? "",
    trace_id: readTraceId(parsedCoverage),
    status: deltaReady ? "delta_ready" : "blocked",
    validation_status: validationStatus,
    failures,
    delta: {
      ...delta,
      delta_ratio: deltaRatio,
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
    blocked_actions: [
      "treating execution-manifest activation-readiness delta report as operator approval",
      "turning execution-manifest activation-readiness delta report into a registry writer",
      "turning execution-manifest activation-readiness delta report into a SQLite writer",
      "starting worker execution from execution-manifest activation-readiness delta report",
      "calling a model from execution-manifest activation-readiness delta report",
      "running live actions from execution-manifest activation-readiness delta report",
    ],
    rollback_path:
      "Discard this read-only execution-manifest activation-readiness delta report; it did not persist registry, SQLite, worker, model, approval, or live-action state.",
    next_safe_task: deltaReady
      ? "Prepare a read-only model-backed dialogue controlled executor intake activation execution-manifest activation-readiness delta coverage report."
      : "Fix the model-backed dialogue controlled executor intake activation execution-manifest next-safe-task decision coverage report before delta promotion.",
  };

  if (deltaReady) {
    const selfValidationFailures =
      validateHermesModelDecisionIntakeActivationExecutionManifestActivationReadinessDeltaReport(
        report,
      );
    if (selfValidationFailures.length > 0) {
      throw new Error(
        "model-backed dialogue controlled executor intake activation execution-manifest activation-readiness delta report self-validation failed: " +
          selfValidationFailures.join("; "),
      );
    }
  }

  const outputDir = resolveInsideRepo(
    params.repoRoot,
    params.outputDir ?? "reports/hermes-agent/state",
  );
  await mkdir(outputDir, { recursive: true });
  const filePath = resolve(
    outputDir,
    report.trace_id +
      "-model-backed-dialogue-controlled-executor-intake-activation-execution-manifest-activation-readiness-delta-report.json",
  );
  await writeFile(filePath, JSON.stringify(report, null, 2) + "\n", "utf8");
  return {
    path: filePath,
    report,
  };
}

export async function writeHermesModelDecisionHandoffPlanArtifact(
  params: WriteHermesModelDecisionHandoffPlanArtifactParams,
): Promise<HermesModelDecisionHandoffPlanArtifact> {
  const coverageReportPath = resolveInsideRepo(
    params.repoRoot,
    params.modelDecisionCoverageReportPath,
  );
  const failures: string[] = [];
  let parsedCoverage: unknown;

  try {
    parsedCoverage = JSON.parse(await readFile(coverageReportPath, "utf8"));
  } catch (error) {
    failures.push(
      "model-backed dialogue decision coverage report JSON parse failed: " +
        (error instanceof Error ? error.message : String(error)),
    );
  }

  if (parsedCoverage !== undefined) {
    failures.push(...validateHermesModelDecisionCoverageReport(parsedCoverage));
  }

  const record = isRecord(parsedCoverage) ? parsedCoverage : null;
  const coverage = isRecord(record?.coverage) ? record.coverage : null;
  const coverageRatio =
    typeof coverage?.coverage_ratio === "number" && Number.isFinite(coverage.coverage_ratio)
      ? coverage.coverage_ratio
      : 0;
  const handoff = {
    context_type: "controlled_executor_intake_context" as const,
    model_dialogue_coverage_pass:
      record?.status === "coverage_pass" &&
      record?.validation_status === "pass" &&
      coverageRatio === 1,
    coverage_ratio: coverageRatio,
    intake_context_only: true as const,
    operator_approval_granted: false as const,
    approval_required_for_execution: true as const,
    execution_start_allowed: false as const,
    registry_writer_allowed: false as const,
    sqlite_writer_allowed: false as const,
    worker_execution_allowed: false as const,
    model_caller_allowed: false as const,
    live_actions_allowed: false as const,
  };
  const handoffChecks = [
    handoff.model_dialogue_coverage_pass,
    handoff.coverage_ratio === 1,
    handoff.intake_context_only,
    !handoff.operator_approval_granted,
    handoff.approval_required_for_execution,
    !handoff.execution_start_allowed,
    !handoff.registry_writer_allowed,
    !handoff.sqlite_writer_allowed,
    !handoff.worker_execution_allowed,
    !handoff.model_caller_allowed,
    !handoff.live_actions_allowed,
  ];
  const handoffRatio = handoffChecks.filter(Boolean).length / Math.max(handoffChecks.length, 1);
  const validationStatus = failures.length === 0 ? "pass" : "fail";
  const handoffReady = validationStatus === "pass" && handoffRatio === 1;
  const outputDir = resolveInsideRepo(
    params.repoRoot,
    params.outputDir ?? "reports/hermes-agent/state",
  );
  await mkdir(outputDir, { recursive: true });

  const plan: HermesModelDecisionHandoffPlan = {
    schema: "openclaw.hermes.model_decision_handoff_plan.v1",
    created_at: (params.now ?? new Date()).toISOString(),
    dry_run: true,
    read_only: true,
    source_coverage_report: coverageReportPath,
    source_model_decision: readString(record?.source_model_decision) ?? "",
    trace_id: readTraceId(parsedCoverage),
    status: handoffReady ? "handoff_ready" : "blocked",
    validation_status: validationStatus,
    failures,
    handoff: {
      ...handoff,
      handoff_ratio: handoffRatio,
    },
    operator_approved: false,
    execution_started: false,
    registry_write_allowed: false,
    taskflow_registry_write: false,
    sqlite_write: false,
    worker_execution: false,
    model_invoked: false,
    live_actions_enabled: false,
    blocked_actions: [
      "treating model-backed dialogue as operator approval",
      "turning model-backed dialogue into a registry writer",
      "turning model-backed dialogue into a SQLite writer",
      "turning model-backed dialogue into worker execution",
      "calling another model from handoff planning",
      "running live actions from the handoff plan",
    ],
    rollback_path:
      "Discard this read-only handoff plan; it did not persist registry, SQLite, worker, model, approval, or live-action state.",
    next_safe_task: handoffReady
      ? "Consume this handoff plan in controlled executor intake validation without enabling execution."
      : "Fix the model-backed dialogue decision coverage report before creating intake handoff context.",
  };
  if (handoffReady) {
    const selfValidationFailures = validateHermesModelDecisionHandoffPlan(plan);
    if (selfValidationFailures.length > 0) {
      throw new Error(
        "model-backed dialogue decision handoff plan self-validation failed: " +
          selfValidationFailures.join("; "),
      );
    }
  }
  const filePath = resolve(
    outputDir,
    plan.trace_id + "-model-backed-dialogue-decision-handoff-plan.json",
  );
  await writeFile(filePath, JSON.stringify(plan, null, 2) + "\n", "utf8");
  return {
    path: filePath,
    plan,
  };
}
export async function writeHermesModelDecisionHandoffIntakeCoverageReportArtifact(
  params: WriteHermesModelDecisionHandoffIntakeCoverageReportArtifactParams,
): Promise<HermesModelDecisionHandoffIntakeCoverageReportArtifact> {
  const handoffPlanPath = resolveInsideRepo(params.repoRoot, params.handoffPlanPath);
  const failures: string[] = [];
  let parsedHandoff: unknown;

  try {
    parsedHandoff = JSON.parse(await readFile(handoffPlanPath, "utf8"));
  } catch (error) {
    failures.push(
      "model-backed dialogue handoff plan JSON parse failed: " +
        (error instanceof Error ? error.message : String(error)),
    );
  }

  if (parsedHandoff !== undefined) {
    failures.push(...validateHermesModelDecisionHandoffPlan(parsedHandoff));
  }

  const record = isRecord(parsedHandoff) ? parsedHandoff : null;
  const handoff = isRecord(record?.handoff) ? record.handoff : null;
  const coverage = {
    handoff_ready: record?.status === "handoff_ready" && record?.validation_status === "pass",
    controlled_executor_intake_context:
      handoff?.context_type === "controlled_executor_intake_context",
    intake_context_only: handoff?.intake_context_only === true,
    operator_approval_false:
      record?.operator_approved === false && handoff?.operator_approval_granted === false,
    execution_started_false:
      record?.execution_started === false && handoff?.execution_start_allowed === false,
    registry_writes_disabled:
      record?.registry_write_allowed === false &&
      record?.taskflow_registry_write === false &&
      handoff?.registry_writer_allowed === false,
    sqlite_writes_disabled:
      record?.sqlite_write === false && handoff?.sqlite_writer_allowed === false,
    worker_execution_disabled:
      record?.worker_execution === false && handoff?.worker_execution_allowed === false,
    model_invocation_disabled:
      record?.model_invoked === false && handoff?.model_caller_allowed === false,
    live_actions_disabled:
      record?.live_actions_enabled === false && handoff?.live_actions_allowed === false,
  };
  const coverageChecks = Object.values(coverage);
  const coverageRatio = coverageChecks.filter(Boolean).length / Math.max(coverageChecks.length, 1);
  const validationStatus = failures.length === 0 ? "pass" : "fail";
  const coveragePass = validationStatus === "pass" && coverageRatio === 1;
  const outputDir = resolveInsideRepo(
    params.repoRoot,
    params.outputDir ?? "reports/hermes-agent/state",
  );
  await mkdir(outputDir, { recursive: true });

  const report: HermesModelDecisionHandoffIntakeCoverageReport = {
    schema: "openclaw.hermes.model_decision_handoff_intake_coverage_report.v1",
    created_at: (params.now ?? new Date()).toISOString(),
    dry_run: true,
    read_only: true,
    source_handoff_plan: handoffPlanPath,
    source_coverage_report: readString(record?.source_coverage_report) ?? "",
    trace_id: readTraceId(parsedHandoff),
    status: coveragePass ? "coverage_pass" : "blocked",
    validation_status: validationStatus,
    failures,
    coverage: {
      ...coverage,
      coverage_ratio: coverageRatio,
    },
    operator_approved: false,
    execution_started: false,
    registry_write_allowed: false,
    taskflow_registry_write: false,
    sqlite_write: false,
    worker_execution: false,
    model_invoked: false,
    live_actions_enabled: false,
    blocked_actions: [
      "treating handoff intake coverage as operator approval",
      "turning handoff intake coverage into a registry writer",
      "turning handoff intake coverage into a SQLite writer",
      "starting worker execution from handoff intake coverage",
      "calling a model from handoff intake coverage",
      "running live actions from handoff intake coverage",
    ],
    rollback_path:
      "Discard this read-only intake coverage report; it did not persist registry, SQLite, worker, model, approval, or live-action state.",
    next_safe_task: coveragePass
      ? "Prepare a read-only controlled executor intake release summary from this coverage report."
      : "Fix the model-backed dialogue handoff plan before using it as controlled executor intake context.",
  };
  if (coveragePass) {
    const selfValidationFailures = validateHermesModelDecisionHandoffIntakeCoverageReport(report);
    if (selfValidationFailures.length > 0) {
      throw new Error(
        "model-backed dialogue handoff intake coverage report self-validation failed: " +
          selfValidationFailures.join("; "),
      );
    }
  }
  const filePath = resolve(
    outputDir,
    report.trace_id + "-model-backed-dialogue-handoff-intake-coverage-report.json",
  );
  await writeFile(filePath, JSON.stringify(report, null, 2) + "\n", "utf8");
  return {
    path: filePath,
    report,
  };
}
export async function writeHermesModelDecisionIntakeReleaseSummaryReportArtifact(
  params: WriteHermesModelDecisionIntakeReleaseSummaryReportArtifactParams,
): Promise<HermesModelDecisionIntakeReleaseSummaryReportArtifact> {
  const intakeCoverageReportPath = resolveInsideRepo(
    params.repoRoot,
    params.intakeCoverageReportPath,
  );
  const failures: string[] = [];
  let parsedCoverage: unknown;

  try {
    parsedCoverage = JSON.parse(await readFile(intakeCoverageReportPath, "utf8"));
  } catch (error) {
    failures.push(
      "model-backed dialogue handoff intake coverage report JSON parse failed: " +
        (error instanceof Error ? error.message : String(error)),
    );
  }

  if (parsedCoverage !== undefined) {
    failures.push(...validateHermesModelDecisionHandoffIntakeCoverageReport(parsedCoverage));
  }

  const record = isRecord(parsedCoverage) ? parsedCoverage : null;
  const coverage = isRecord(record?.coverage) ? record.coverage : null;
  const summary = {
    intake_coverage_green:
      record?.status === "coverage_pass" &&
      record?.validation_status === "pass" &&
      coverage?.coverage_ratio === 1,
    handoff_ready: coverage?.handoff_ready === true,
    controlled_executor_intake_context: coverage?.controlled_executor_intake_context === true,
    intake_context_only: coverage?.intake_context_only === true,
    operator_approval_false:
      record?.operator_approved === false && coverage?.operator_approval_false === true,
    execution_started_false:
      record?.execution_started === false && coverage?.execution_started_false === true,
    registry_writes_disabled:
      record?.registry_write_allowed === false &&
      record?.taskflow_registry_write === false &&
      coverage?.registry_writes_disabled === true,
    sqlite_writes_disabled:
      record?.sqlite_write === false && coverage?.sqlite_writes_disabled === true,
    worker_execution_disabled:
      record?.worker_execution === false && coverage?.worker_execution_disabled === true,
    model_invocation_disabled:
      record?.model_invoked === false && coverage?.model_invocation_disabled === true,
    live_actions_disabled:
      record?.live_actions_enabled === false && coverage?.live_actions_disabled === true,
  };
  const summaryChecks = Object.values(summary);
  const summaryRatio = summaryChecks.filter(Boolean).length / Math.max(summaryChecks.length, 1);
  const validationStatus = failures.length === 0 ? "pass" : "fail";
  const summaryReady = validationStatus === "pass" && summaryRatio === 1;
  const outputDir = resolveInsideRepo(
    params.repoRoot,
    params.outputDir ?? "reports/hermes-agent/state",
  );
  await mkdir(outputDir, { recursive: true });

  const report: HermesModelDecisionIntakeReleaseSummaryReport = {
    schema: "openclaw.hermes.model_decision_intake_release_summary_report.v1",
    created_at: (params.now ?? new Date()).toISOString(),
    dry_run: true,
    read_only: true,
    source_intake_coverage_report: intakeCoverageReportPath,
    source_handoff_plan: readString(record?.source_handoff_plan) ?? "",
    trace_id: readTraceId(parsedCoverage),
    status: summaryReady ? "summary_ready" : "blocked",
    validation_status: validationStatus,
    failures,
    summary: {
      ...summary,
      summary_ratio: summaryRatio,
    },
    operator_approved: false,
    execution_started: false,
    registry_write_allowed: false,
    taskflow_registry_write: false,
    sqlite_write: false,
    worker_execution: false,
    model_invoked: false,
    live_actions_enabled: false,
    blocked_actions: [
      "treating intake release summary as operator approval",
      "turning intake release summary into a registry writer",
      "turning intake release summary into a SQLite writer",
      "starting worker execution from intake release summary",
      "calling a model from intake release summary",
      "running live actions from intake release summary",
    ],
    rollback_path:
      "Discard this read-only release summary; it did not persist registry, SQLite, worker, model, approval, or live-action state.",
    next_safe_task: summaryReady
      ? "Prepare a read-only model-backed dialogue intake release summary coverage report."
      : "Fix the model-backed dialogue handoff intake coverage report before release summary.",
  };
  if (summaryReady) {
    const selfValidationFailures = validateHermesModelDecisionIntakeReleaseSummaryReport(report);
    if (selfValidationFailures.length > 0) {
      throw new Error(
        "model-backed dialogue intake release summary report self-validation failed: " +
          selfValidationFailures.join("; "),
      );
    }
  }
  const filePath = resolve(
    outputDir,
    report.trace_id + "-model-backed-dialogue-intake-release-summary-report.json",
  );
  await writeFile(filePath, JSON.stringify(report, null, 2) + "\n", "utf8");
  return {
    path: filePath,
    report,
  };
}
export async function writeHermesModelDecisionIntakeReleaseSummaryCoverageReportArtifact(
  params: WriteHermesModelDecisionIntakeReleaseSummaryCoverageReportArtifactParams,
): Promise<HermesModelDecisionIntakeReleaseSummaryCoverageReportArtifact> {
  const releaseSummaryReportPath = resolveInsideRepo(
    params.repoRoot,
    params.releaseSummaryReportPath,
  );
  const failures: string[] = [];
  let parsedSummary: unknown;

  try {
    parsedSummary = JSON.parse(await readFile(releaseSummaryReportPath, "utf8"));
  } catch (error) {
    failures.push(
      "model-backed dialogue intake release summary report JSON parse failed: " +
        (error instanceof Error ? error.message : String(error)),
    );
  }

  if (parsedSummary !== undefined) {
    failures.push(...validateHermesModelDecisionIntakeReleaseSummaryReport(parsedSummary));
  }

  const record = isRecord(parsedSummary) ? parsedSummary : null;
  const summary = isRecord(record?.summary) ? record.summary : null;
  const coverage = {
    release_summary_ready:
      record?.status === "summary_ready" &&
      record?.validation_status === "pass" &&
      summary?.summary_ratio === 1,
    intake_coverage_green: summary?.intake_coverage_green === true,
    handoff_ready: summary?.handoff_ready === true,
    controlled_executor_intake_context_boundary:
      summary?.controlled_executor_intake_context === true && summary?.intake_context_only === true,
    intake_context_only: summary?.intake_context_only === true,
    operator_approval_false:
      record?.operator_approved === false && summary?.operator_approval_false === true,
    execution_started_false:
      record?.execution_started === false && summary?.execution_started_false === true,
    registry_writes_disabled:
      record?.registry_write_allowed === false &&
      record?.taskflow_registry_write === false &&
      summary?.registry_writes_disabled === true,
    sqlite_writes_disabled:
      record?.sqlite_write === false && summary?.sqlite_writes_disabled === true,
    worker_execution_disabled:
      record?.worker_execution === false && summary?.worker_execution_disabled === true,
    model_invocation_disabled:
      record?.model_invoked === false && summary?.model_invocation_disabled === true,
    live_actions_disabled:
      record?.live_actions_enabled === false && summary?.live_actions_disabled === true,
    release_summary_not_approval:
      record?.operator_approved === false && record?.execution_started === false,
    coverage_report_not_executor: true,
  };
  const coverageChecks = Object.values(coverage);
  const coverageRatio = coverageChecks.filter(Boolean).length / Math.max(coverageChecks.length, 1);
  const validationStatus = failures.length === 0 ? "pass" : "fail";
  const coveragePass = validationStatus === "pass" && coverageRatio === 1;
  const outputDir = resolveInsideRepo(
    params.repoRoot,
    params.outputDir ?? "reports/hermes-agent/state",
  );
  await mkdir(outputDir, { recursive: true });

  const report: HermesModelDecisionIntakeReleaseSummaryCoverageReport = {
    schema: "openclaw.hermes.model_decision_intake_release_summary_coverage_report.v1",
    created_at: (params.now ?? new Date()).toISOString(),
    dry_run: true,
    read_only: true,
    source_release_summary_report: releaseSummaryReportPath,
    source_intake_coverage_report: readString(record?.source_intake_coverage_report) ?? "",
    source_handoff_plan: readString(record?.source_handoff_plan) ?? "",
    trace_id: readTraceId(parsedSummary),
    status: coveragePass ? "coverage_pass" : "blocked",
    validation_status: validationStatus,
    failures,
    coverage: {
      ...coverage,
      coverage_ratio: coverageRatio,
    },
    operator_approved: false,
    execution_started: false,
    registry_write_allowed: false,
    taskflow_registry_write: false,
    sqlite_write: false,
    worker_execution: false,
    model_invoked: false,
    live_actions_enabled: false,
    blocked_actions: [
      "treating intake release summary coverage as operator approval",
      "turning intake release summary coverage into a registry writer",
      "turning intake release summary coverage into a SQLite writer",
      "starting worker execution from intake release summary coverage",
      "calling a model from intake release summary coverage",
      "running live actions from intake release summary coverage",
    ],
    rollback_path:
      "Discard this read-only release summary coverage report; it did not persist registry, SQLite, worker, model, approval, or live-action state.",
    next_safe_task: coveragePass
      ? "Prepare a read-only model-backed dialogue controlled executor intake activation preflight report."
      : "Fix the model-backed dialogue intake release summary report before coverage promotion.",
  };
  if (coveragePass) {
    const selfValidationFailures =
      validateHermesModelDecisionIntakeReleaseSummaryCoverageReport(report);
    if (selfValidationFailures.length > 0) {
      throw new Error(
        "model-backed dialogue intake release summary coverage report self-validation failed: " +
          selfValidationFailures.join("; "),
      );
    }
  }
  const filePath = resolve(
    outputDir,
    report.trace_id + "-model-backed-dialogue-intake-release-summary-coverage-report.json",
  );
  await writeFile(filePath, JSON.stringify(report, null, 2) + "\n", "utf8");
  return {
    path: filePath,
    report,
  };
}

export async function writeHermesModelDecisionIntakeActivationPreflightReportArtifact(
  params: WriteHermesModelDecisionIntakeActivationPreflightReportArtifactParams,
): Promise<HermesModelDecisionIntakeActivationPreflightReportArtifact> {
  const releaseSummaryCoverageReportPath = resolveInsideRepo(
    params.repoRoot,
    params.releaseSummaryCoverageReportPath,
  );
  const failures: string[] = [];
  let parsedCoverage: unknown;

  try {
    parsedCoverage = JSON.parse(await readFile(releaseSummaryCoverageReportPath, "utf8"));
  } catch (error) {
    failures.push(
      "model-backed dialogue intake release summary coverage report JSON parse failed: " +
        (error instanceof Error ? error.message : String(error)),
    );
  }

  if (parsedCoverage !== undefined) {
    failures.push(...validateHermesModelDecisionIntakeReleaseSummaryCoverageReport(parsedCoverage));
  }

  const record = isRecord(parsedCoverage) ? parsedCoverage : null;
  const coverage = isRecord(record?.coverage) ? record.coverage : null;
  const preflight = {
    release_summary_coverage_green:
      record?.status === "coverage_pass" &&
      record?.validation_status === "pass" &&
      coverage?.coverage_ratio === 1,
    release_summary_ready: coverage?.release_summary_ready === true,
    intake_coverage_green: coverage?.intake_coverage_green === true,
    handoff_ready: coverage?.handoff_ready === true,
    controlled_executor_intake_context_boundary:
      coverage?.controlled_executor_intake_context_boundary === true &&
      coverage?.intake_context_only === true,
    operator_approval_false:
      record?.operator_approved === false && coverage?.operator_approval_false === true,
    execution_started_false:
      record?.execution_started === false && coverage?.execution_started_false === true,
    registry_writes_disabled:
      record?.registry_write_allowed === false &&
      record?.taskflow_registry_write === false &&
      coverage?.registry_writes_disabled === true,
    sqlite_writes_disabled:
      record?.sqlite_write === false && coverage?.sqlite_writes_disabled === true,
    worker_execution_disabled:
      record?.worker_execution === false && coverage?.worker_execution_disabled === true,
    model_invocation_disabled:
      record?.model_invoked === false && coverage?.model_invocation_disabled === true,
    live_actions_disabled:
      record?.live_actions_enabled === false && coverage?.live_actions_disabled === true,
  };
  const preflightChecks = Object.values(preflight);
  const preflightRatio =
    preflightChecks.filter(Boolean).length / Math.max(preflightChecks.length, 1);
  const validationStatus = failures.length === 0 ? "pass" : "fail";
  const preflightPass = validationStatus === "pass" && preflightRatio === 1;
  const outputDir = resolveInsideRepo(
    params.repoRoot,
    params.outputDir ?? "reports/hermes-agent/state",
  );
  await mkdir(outputDir, { recursive: true });

  const report: HermesModelDecisionIntakeActivationPreflightReport = {
    schema: "openclaw.hermes.model_decision_intake_activation_preflight_report.v1",
    created_at: (params.now ?? new Date()).toISOString(),
    dry_run: true,
    read_only: true,
    source_release_summary_coverage_report: releaseSummaryCoverageReportPath,
    source_release_summary_report: readString(record?.source_release_summary_report) ?? "",
    source_intake_coverage_report: readString(record?.source_intake_coverage_report) ?? "",
    source_handoff_plan: readString(record?.source_handoff_plan) ?? "",
    trace_id: readTraceId(parsedCoverage),
    status: preflightPass ? "preflight_pass" : "blocked",
    validation_status: validationStatus,
    failures,
    preflight: {
      ...preflight,
      preflight_ratio: preflightRatio,
    },
    operator_approved: false,
    execution_started: false,
    registry_write_allowed: false,
    taskflow_registry_write: false,
    sqlite_write: false,
    worker_execution: false,
    model_invoked: false,
    live_actions_enabled: false,
    blocked_actions: [
      "treating intake activation preflight as operator approval",
      "turning intake activation preflight into a registry writer",
      "turning intake activation preflight into a SQLite writer",
      "starting worker execution from intake activation preflight",
      "calling a model from intake activation preflight",
      "running live actions from intake activation preflight",
    ],
    rollback_path:
      "Discard this read-only intake activation preflight report; it did not persist registry, SQLite, worker, model, approval, or live-action state.",
    next_safe_task: preflightPass
      ? "Prepare a read-only model-backed dialogue controlled executor intake activation preflight coverage report."
      : "Fix the model-backed dialogue intake release summary coverage report before intake activation preflight.",
  };
  if (preflightPass) {
    const selfValidationFailures =
      validateHermesModelDecisionIntakeActivationPreflightReport(report);
    if (selfValidationFailures.length > 0) {
      throw new Error(
        "model-backed dialogue controlled executor intake activation preflight report self-validation failed: " +
          selfValidationFailures.join("; "),
      );
    }
  }
  const filePath = resolve(
    outputDir,
    report.trace_id +
      "-model-backed-dialogue-controlled-executor-intake-activation-preflight-report.json",
  );
  await writeFile(filePath, JSON.stringify(report, null, 2) + "\n", "utf8");
  return {
    path: filePath,
    report,
  };
}

export async function writeHermesModelDecisionIntakeActivationPreflightCoverageReportArtifact(
  params: WriteHermesModelDecisionIntakeActivationPreflightCoverageReportArtifactParams,
): Promise<HermesModelDecisionIntakeActivationPreflightCoverageReportArtifact> {
  const preflightReportPath = resolveInsideRepo(params.repoRoot, params.preflightReportPath);
  const failures: string[] = [];
  let parsedPreflight: unknown;

  try {
    parsedPreflight = JSON.parse(await readFile(preflightReportPath, "utf8"));
  } catch (error) {
    failures.push(
      "model-backed dialogue intake activation preflight report JSON parse failed: " +
        (error instanceof Error ? error.message : String(error)),
    );
  }

  if (parsedPreflight !== undefined) {
    failures.push(...validateHermesModelDecisionIntakeActivationPreflightReport(parsedPreflight));
  }

  const record = isRecord(parsedPreflight) ? parsedPreflight : null;
  const preflight = isRecord(record?.preflight) ? record.preflight : null;
  const coverage = {
    intake_activation_preflight_green:
      record?.status === "preflight_pass" &&
      record?.validation_status === "pass" &&
      preflight?.preflight_ratio === 1,
    release_summary_coverage_green: preflight?.release_summary_coverage_green === true,
    release_summary_ready: preflight?.release_summary_ready === true,
    intake_coverage_green: preflight?.intake_coverage_green === true,
    handoff_ready: preflight?.handoff_ready === true,
    controlled_executor_intake_context_boundary:
      preflight?.controlled_executor_intake_context_boundary === true,
    operator_approval_false:
      record?.operator_approved === false && preflight?.operator_approval_false === true,
    execution_started_false:
      record?.execution_started === false && preflight?.execution_started_false === true,
    registry_writes_disabled:
      record?.registry_write_allowed === false &&
      record?.taskflow_registry_write === false &&
      preflight?.registry_writes_disabled === true,
    sqlite_writes_disabled:
      record?.sqlite_write === false && preflight?.sqlite_writes_disabled === true,
    worker_execution_disabled:
      record?.worker_execution === false && preflight?.worker_execution_disabled === true,
    model_invocation_disabled:
      record?.model_invoked === false && preflight?.model_invocation_disabled === true,
    live_actions_disabled:
      record?.live_actions_enabled === false && preflight?.live_actions_disabled === true,
    preflight_report_not_approval:
      record?.operator_approved === false && record?.execution_started === false,
    coverage_report_not_executor: true,
  };
  const coverageChecks = Object.values(coverage);
  const coverageRatio = coverageChecks.filter(Boolean).length / Math.max(coverageChecks.length, 1);
  const validationStatus = failures.length === 0 ? "pass" : "fail";
  const coveragePass = validationStatus === "pass" && coverageRatio === 1;
  const outputDir = resolveInsideRepo(
    params.repoRoot,
    params.outputDir ?? "reports/hermes-agent/state",
  );
  await mkdir(outputDir, { recursive: true });

  const report: HermesModelDecisionIntakeActivationPreflightCoverageReport = {
    schema: "openclaw.hermes.model_decision_intake_activation_preflight_coverage_report.v1",
    created_at: (params.now ?? new Date()).toISOString(),
    dry_run: true,
    read_only: true,
    source_preflight_report: preflightReportPath,
    source_release_summary_coverage_report:
      readString(record?.source_release_summary_coverage_report) ?? "",
    source_release_summary_report: readString(record?.source_release_summary_report) ?? "",
    source_intake_coverage_report: readString(record?.source_intake_coverage_report) ?? "",
    source_handoff_plan: readString(record?.source_handoff_plan) ?? "",
    trace_id: readTraceId(parsedPreflight),
    status: coveragePass ? "coverage_pass" : "blocked",
    validation_status: validationStatus,
    failures,
    coverage: {
      ...coverage,
      coverage_ratio: coverageRatio,
    },
    operator_approved: false,
    execution_started: false,
    registry_write_allowed: false,
    taskflow_registry_write: false,
    sqlite_write: false,
    worker_execution: false,
    model_invoked: false,
    live_actions_enabled: false,
    blocked_actions: [
      "treating intake activation preflight coverage as operator approval",
      "turning intake activation preflight coverage into a registry writer",
      "turning intake activation preflight coverage into a SQLite writer",
      "starting worker execution from intake activation preflight coverage",
      "calling a model from intake activation preflight coverage",
      "running live actions from intake activation preflight coverage",
    ],
    rollback_path:
      "Discard this read-only intake activation preflight coverage report; it did not persist registry, SQLite, worker, model, approval, or live-action state.",
    next_safe_task: coveragePass
      ? "Prepare a read-only model-backed dialogue controlled executor intake activation final readiness summary report."
      : "Fix the model-backed dialogue controlled executor intake activation preflight report before coverage promotion.",
  };
  if (coveragePass) {
    const selfValidationFailures =
      validateHermesModelDecisionIntakeActivationPreflightCoverageReport(report);
    if (selfValidationFailures.length > 0) {
      throw new Error(
        "model-backed dialogue controlled executor intake activation preflight coverage report self-validation failed: " +
          selfValidationFailures.join("; "),
      );
    }
  }
  const filePath = resolve(
    outputDir,
    report.trace_id +
      "-model-backed-dialogue-controlled-executor-intake-activation-preflight-coverage-report.json",
  );
  await writeFile(filePath, JSON.stringify(report, null, 2) + "\n", "utf8");
  return {
    path: filePath,
    report,
  };
}

export async function writeHermesModelDecisionIntakeActivationFinalReadinessSummaryReportArtifact(
  params: WriteHermesModelDecisionIntakeActivationFinalReadinessSummaryReportArtifactParams,
): Promise<HermesModelDecisionIntakeActivationFinalReadinessSummaryReportArtifact> {
  const preflightCoverageReportPath = resolveInsideRepo(
    params.repoRoot,
    params.preflightCoverageReportPath,
  );
  const failures: string[] = [];
  let parsedCoverage: unknown;

  try {
    parsedCoverage = JSON.parse(await readFile(preflightCoverageReportPath, "utf8"));
  } catch (error) {
    failures.push(
      "model-backed dialogue intake activation preflight coverage report JSON parse failed: " +
        (error instanceof Error ? error.message : String(error)),
    );
  }

  if (parsedCoverage !== undefined) {
    failures.push(...validateHermesModelDecisionIntakeActivationPreflightCoverageReport(parsedCoverage));
  }

  const record = isRecord(parsedCoverage) ? parsedCoverage : null;
  const coverage = isRecord(record?.coverage) ? record.coverage : null;
  const summary = {
    intake_activation_preflight_coverage_green:
      record?.status === "coverage_pass" &&
      record?.validation_status === "pass" &&
      coverage?.coverage_ratio === 1,
    intake_activation_preflight_green: coverage?.intake_activation_preflight_green === true,
    release_summary_coverage_green: coverage?.release_summary_coverage_green === true,
    release_summary_ready: coverage?.release_summary_ready === true,
    intake_coverage_green: coverage?.intake_coverage_green === true,
    handoff_ready: coverage?.handoff_ready === true,
    controlled_executor_intake_context_boundary:
      coverage?.controlled_executor_intake_context_boundary === true,
    operator_approval_false:
      record?.operator_approved === false && coverage?.operator_approval_false === true,
    execution_started_false:
      record?.execution_started === false && coverage?.execution_started_false === true,
    registry_writes_disabled:
      record?.registry_write_allowed === false &&
      record?.taskflow_registry_write === false &&
      coverage?.registry_writes_disabled === true,
    sqlite_writes_disabled:
      record?.sqlite_write === false && coverage?.sqlite_writes_disabled === true,
    worker_execution_disabled:
      record?.worker_execution === false && coverage?.worker_execution_disabled === true,
    model_invocation_disabled:
      record?.model_invoked === false && coverage?.model_invocation_disabled === true,
    live_actions_disabled:
      record?.live_actions_enabled === false && coverage?.live_actions_disabled === true,
    final_readiness_summary_not_approval:
      record?.operator_approved === false && record?.execution_started === false,
    summary_report_not_executor: true,
  };
  const summaryChecks = Object.values(summary);
  const summaryRatio = summaryChecks.filter(Boolean).length / Math.max(summaryChecks.length, 1);
  const validationStatus = failures.length === 0 ? "pass" : "fail";
  const summaryReady = validationStatus === "pass" && summaryRatio === 1;
  const outputDir = resolveInsideRepo(
    params.repoRoot,
    params.outputDir ?? "reports/hermes-agent/state",
  );
  await mkdir(outputDir, { recursive: true });

  const report: HermesModelDecisionIntakeActivationFinalReadinessSummaryReport = {
    schema: "openclaw.hermes.model_decision_intake_activation_final_readiness_summary_report.v1",
    created_at: (params.now ?? new Date()).toISOString(),
    dry_run: true,
    read_only: true,
    source_preflight_coverage_report: preflightCoverageReportPath,
    source_preflight_report: readString(record?.source_preflight_report) ?? "",
    source_release_summary_coverage_report:
      readString(record?.source_release_summary_coverage_report) ?? "",
    source_release_summary_report: readString(record?.source_release_summary_report) ?? "",
    source_intake_coverage_report: readString(record?.source_intake_coverage_report) ?? "",
    source_handoff_plan: readString(record?.source_handoff_plan) ?? "",
    trace_id: readTraceId(parsedCoverage),
    status: summaryReady ? "summary_ready" : "blocked",
    validation_status: validationStatus,
    failures,
    summary: {
      ...summary,
      summary_ratio: summaryRatio,
    },
    operator_approved: false,
    execution_started: false,
    registry_write_allowed: false,
    taskflow_registry_write: false,
    sqlite_write: false,
    worker_execution: false,
    model_invoked: false,
    live_actions_enabled: false,
    blocked_actions: [
      "treating intake activation final readiness summary as operator approval",
      "turning intake activation final readiness summary into a registry writer",
      "turning intake activation final readiness summary into a SQLite writer",
      "starting worker execution from intake activation final readiness summary",
      "calling a model from intake activation final readiness summary",
      "running live actions from intake activation final readiness summary",
    ],
    rollback_path:
      "Discard this read-only intake activation final readiness summary report; it did not persist registry, SQLite, worker, model, approval, or live-action state.",
    next_safe_task: summaryReady
      ? "Prepare a read-only model-backed dialogue controlled executor intake activation final readiness summary coverage report."
      : "Fix the model-backed dialogue controlled executor intake activation preflight coverage report before final readiness summary promotion.",
  };
  if (summaryReady) {
    const selfValidationFailures =
      validateHermesModelDecisionIntakeActivationFinalReadinessSummaryReport(report);
    if (selfValidationFailures.length > 0) {
      throw new Error(
        "model-backed dialogue controlled executor intake activation final readiness summary report self-validation failed: " +
          selfValidationFailures.join("; "),
      );
    }
  }
  const filePath = resolve(
    outputDir,
    report.trace_id +
      "-model-backed-dialogue-controlled-executor-intake-activation-final-readiness-summary-report.json",
  );
  await writeFile(filePath, JSON.stringify(report, null, 2) + "\n", "utf8");
  return {
    path: filePath,
    report,
  };
}

export async function writeHermesModelDecisionIntakeActivationFinalReadinessSummaryCoverageReportArtifact(
  params: WriteHermesModelDecisionIntakeActivationFinalReadinessSummaryCoverageReportArtifactParams,
): Promise<HermesModelDecisionIntakeActivationFinalReadinessSummaryCoverageReportArtifact> {
  const finalReadinessSummaryReportPath = resolveInsideRepo(
    params.repoRoot,
    params.finalReadinessSummaryReportPath,
  );
  const failures: string[] = [];
  let parsedSummary: unknown;

  try {
    parsedSummary = JSON.parse(await readFile(finalReadinessSummaryReportPath, "utf8"));
  } catch (error) {
    failures.push(
      "model-backed dialogue intake activation final readiness summary report JSON parse failed: " +
        (error instanceof Error ? error.message : String(error)),
    );
  }

  if (parsedSummary !== undefined) {
    failures.push(...validateHermesModelDecisionIntakeActivationFinalReadinessSummaryReport(parsedSummary));
  }

  const record = isRecord(parsedSummary) ? parsedSummary : null;
  const summary = isRecord(record?.summary) ? record.summary : null;
  const coverage = {
    final_readiness_summary_ready:
      record?.status === "summary_ready" &&
      record?.validation_status === "pass" &&
      summary?.summary_ratio === 1,
    summary_ratio_complete: summary?.summary_ratio === 1,
    intake_activation_preflight_coverage_green:
      summary?.intake_activation_preflight_coverage_green === true,
    intake_activation_preflight_green: summary?.intake_activation_preflight_green === true,
    release_summary_coverage_green: summary?.release_summary_coverage_green === true,
    release_summary_ready: summary?.release_summary_ready === true,
    intake_coverage_green: summary?.intake_coverage_green === true,
    handoff_ready: summary?.handoff_ready === true,
    controlled_executor_intake_context_boundary:
      summary?.controlled_executor_intake_context_boundary === true,
    operator_approval_false:
      record?.operator_approved === false && summary?.operator_approval_false === true,
    execution_started_false:
      record?.execution_started === false && summary?.execution_started_false === true,
    registry_writes_disabled:
      record?.registry_write_allowed === false &&
      record?.taskflow_registry_write === false &&
      summary?.registry_writes_disabled === true,
    sqlite_writes_disabled:
      record?.sqlite_write === false && summary?.sqlite_writes_disabled === true,
    worker_execution_disabled:
      record?.worker_execution === false && summary?.worker_execution_disabled === true,
    model_invocation_disabled:
      record?.model_invoked === false && summary?.model_invocation_disabled === true,
    live_actions_disabled:
      record?.live_actions_enabled === false && summary?.live_actions_disabled === true,
    final_readiness_summary_not_approval:
      summary?.final_readiness_summary_not_approval === true &&
      record?.operator_approved === false &&
      record?.execution_started === false,
    coverage_report_not_executor: true,
  };
  const coverageChecks = Object.values(coverage);
  const coverageRatio = coverageChecks.filter(Boolean).length / Math.max(coverageChecks.length, 1);
  const validationStatus = failures.length === 0 ? "pass" : "fail";
  const coveragePass = validationStatus === "pass" && coverageRatio === 1;
  const outputDir = resolveInsideRepo(
    params.repoRoot,
    params.outputDir ?? "reports/hermes-agent/state",
  );
  await mkdir(outputDir, { recursive: true });

  const report: HermesModelDecisionIntakeActivationFinalReadinessSummaryCoverageReport = {
    schema: "openclaw.hermes.model_decision_intake_activation_final_readiness_summary_coverage_report.v1",
    created_at: (params.now ?? new Date()).toISOString(),
    dry_run: true,
    read_only: true,
    source_final_readiness_summary_report: finalReadinessSummaryReportPath,
    source_preflight_coverage_report: readString(record?.source_preflight_coverage_report) ?? "",
    source_preflight_report: readString(record?.source_preflight_report) ?? "",
    source_release_summary_coverage_report:
      readString(record?.source_release_summary_coverage_report) ?? "",
    source_release_summary_report: readString(record?.source_release_summary_report) ?? "",
    source_intake_coverage_report: readString(record?.source_intake_coverage_report) ?? "",
    source_handoff_plan: readString(record?.source_handoff_plan) ?? "",
    trace_id: readTraceId(parsedSummary),
    status: coveragePass ? "coverage_pass" : "blocked",
    validation_status: validationStatus,
    failures,
    coverage: {
      ...coverage,
      coverage_ratio: coverageRatio,
    },
    operator_approved: false,
    execution_started: false,
    registry_write_allowed: false,
    taskflow_registry_write: false,
    sqlite_write: false,
    worker_execution: false,
    model_invoked: false,
    live_actions_enabled: false,
    blocked_actions: [
      "treating intake activation final readiness summary coverage as operator approval",
      "turning intake activation final readiness summary coverage into a registry writer",
      "turning intake activation final readiness summary coverage into a SQLite writer",
      "starting worker execution from intake activation final readiness summary coverage",
      "calling a model from intake activation final readiness summary coverage",
      "running live actions from intake activation final readiness summary coverage",
    ],
    rollback_path:
      "Discard this read-only intake activation final readiness summary coverage report; it did not persist registry, SQLite, worker, model, approval, or live-action state.",
    next_safe_task: coveragePass
      ? "Prepare a read-only model-backed dialogue controlled executor intake activation execution-manifest proposal report."
      : "Fix the model-backed dialogue controlled executor intake activation final readiness summary report before coverage promotion.",
  };
  if (coveragePass) {
    const selfValidationFailures =
      validateHermesModelDecisionIntakeActivationFinalReadinessSummaryCoverageReport(report);
    if (selfValidationFailures.length > 0) {
      throw new Error(
        "model-backed dialogue controlled executor intake activation final readiness summary coverage report self-validation failed: " +
          selfValidationFailures.join("; "),
      );
    }
  }
  const filePath = resolve(
    outputDir,
    report.trace_id +
      "-model-backed-dialogue-controlled-executor-intake-activation-final-readiness-summary-coverage-report.json",
  );
  await writeFile(filePath, JSON.stringify(report, null, 2) + "\n", "utf8");
  return {
    path: filePath,
    report,
  };
}
export async function writeHermesModelDecisionIntakeActivationExecutionManifestProposalReportArtifact(
  params: WriteHermesModelDecisionIntakeActivationExecutionManifestProposalReportArtifactParams,
): Promise<HermesModelDecisionIntakeActivationExecutionManifestProposalReportArtifact> {
  const finalReadinessSummaryCoverageReportPath = resolveInsideRepo(
    params.repoRoot,
    params.finalReadinessSummaryCoverageReportPath,
  );
  const failures: string[] = [];
  let parsedCoverage: unknown;

  try {
    parsedCoverage = JSON.parse(await readFile(finalReadinessSummaryCoverageReportPath, "utf8"));
  } catch (error) {
    failures.push(
      "model-backed dialogue intake activation final readiness summary coverage report JSON parse failed: " +
        (error instanceof Error ? error.message : String(error)),
    );
  }

  if (parsedCoverage !== undefined) {
    failures.push(
      ...validateHermesModelDecisionIntakeActivationFinalReadinessSummaryCoverageReport(parsedCoverage),
    );
  }

  const record = isRecord(parsedCoverage) ? parsedCoverage : null;
  const coverage = isRecord(record?.coverage) ? record.coverage : null;
  const requiredValidationChecklist = [
    "Verify operator approval remains false before any execution attempt.",
    "Verify execution_start_allowed remains false until manual approval token validation completes.",
    "Verify rollback precondition and boundary checklist before any writer path is introduced.",
  ];
  const rollbackPrecondition =
    typeof record?.rollback_path === "string" && record.rollback_path.trim() !== ""
      ? record.rollback_path
      : "";

  const proposal = {
    final_readiness_summary_coverage_green:
      record?.status === "coverage_pass" && record?.validation_status === "pass",
    final_readiness_summary_ready: coverage?.final_readiness_summary_ready === true,
    summary_ratio_complete: coverage?.summary_ratio_complete === true,
    intake_activation_preflight_coverage_green:
      coverage?.intake_activation_preflight_coverage_green === true,
    intake_activation_preflight_green: coverage?.intake_activation_preflight_green === true,
    release_summary_coverage_green: coverage?.release_summary_coverage_green === true,
    release_summary_ready: coverage?.release_summary_ready === true,
    intake_coverage_green: coverage?.intake_coverage_green === true,
    handoff_ready: coverage?.handoff_ready === true,
    controlled_executor_intake_context_boundary:
      coverage?.controlled_executor_intake_context_boundary === true,
    approval_required_true: true,
    execution_start_allowed_false: true,
    operator_approval_false:
      record?.operator_approved === false && coverage?.operator_approval_false === true,
    execution_started_false:
      record?.execution_started === false && coverage?.execution_started_false === true,
    rollback_precondition_present: rollbackPrecondition.length > 0,
    required_validation_checklist_complete: requiredValidationChecklist.every(
      (item) => item.trim().length > 0,
    ),
    registry_writes_disabled:
      record?.registry_write_allowed === false &&
      record?.taskflow_registry_write === false &&
      coverage?.registry_writes_disabled === true,
    sqlite_writes_disabled: record?.sqlite_write === false && coverage?.sqlite_writes_disabled === true,
    worker_execution_disabled:
      record?.worker_execution === false && coverage?.worker_execution_disabled === true,
    model_invocation_disabled:
      record?.model_invoked === false && coverage?.model_invocation_disabled === true,
    live_actions_disabled:
      record?.live_actions_enabled === false && coverage?.live_actions_disabled === true,
    proposal_report_not_approval:
      record?.operator_approved === false &&
      record?.execution_started === false &&
      coverage?.coverage_report_not_executor === true,
  };
  const proposalChecks = Object.values(proposal);
  const proposalRatio = proposalChecks.filter(Boolean).length / Math.max(proposalChecks.length, 1);
  const validationStatus = failures.length === 0 ? "pass" : "fail";
  const proposalReady = validationStatus === "pass" && proposalRatio === 1;
  const outputDir = resolveInsideRepo(
    params.repoRoot,
    params.outputDir ?? "reports/hermes-agent/state",
  );
  await mkdir(outputDir, { recursive: true });

  const report: HermesModelDecisionIntakeActivationExecutionManifestProposalReport = {
    schema: "openclaw.hermes.model_decision_intake_activation_execution_manifest_proposal_report.v1",
    created_at: (params.now ?? new Date()).toISOString(),
    dry_run: true,
    read_only: true,
    source_final_readiness_summary_coverage_report: finalReadinessSummaryCoverageReportPath,
    source_final_readiness_summary_report:
      readString(record?.source_final_readiness_summary_report) ?? "",
    source_preflight_coverage_report: readString(record?.source_preflight_coverage_report) ?? "",
    source_preflight_report: readString(record?.source_preflight_report) ?? "",
    source_release_summary_coverage_report:
      readString(record?.source_release_summary_coverage_report) ?? "",
    source_release_summary_report: readString(record?.source_release_summary_report) ?? "",
    source_intake_coverage_report: readString(record?.source_intake_coverage_report) ?? "",
    source_handoff_plan: readString(record?.source_handoff_plan) ?? "",
    trace_id: readTraceId(parsedCoverage),
    status: proposalReady ? "proposal_ready" : "blocked",
    validation_status: validationStatus,
    failures,
    required_validation_checklist: requiredValidationChecklist,
    rollback_precondition: rollbackPrecondition,
    proposal: {
      ...proposal,
      proposal_ratio: proposalRatio,
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
    blocked_actions: [
      "treating execution-manifest proposal report as operator approval",
      "turning execution-manifest proposal report into a registry writer",
      "turning execution-manifest proposal report into a SQLite writer",
      "starting worker execution from execution-manifest proposal report",
      "calling a model from execution-manifest proposal report",
      "running live actions from execution-manifest proposal report",
    ],
    rollback_path:
      "Discard this read-only execution-manifest proposal report; it did not persist registry, SQLite, worker, model, approval, or live-action state.",
    next_safe_task: proposalReady
      ? "Prepare a read-only model-backed dialogue controlled executor intake activation execution-manifest proposal coverage report."
      : "Fix the model-backed dialogue controlled executor intake activation final readiness summary coverage report before execution-manifest proposal promotion.",
  };
  if (proposalReady) {
    const selfValidationFailures =
      validateHermesModelDecisionIntakeActivationExecutionManifestProposalReport(report);
    if (selfValidationFailures.length > 0) {
      throw new Error(
        "model-backed dialogue controlled executor intake activation execution-manifest proposal report self-validation failed: " +
          selfValidationFailures.join("; "),
      );
    }
  }
  const filePath = resolve(
    outputDir,
    report.trace_id +
      "-model-backed-dialogue-controlled-executor-intake-activation-execution-manifest-proposal-report.json",
  );
  await writeFile(filePath, JSON.stringify(report, null, 2) + "\n", "utf8");
  return {
    path: filePath,
    report,
  };
}
export async function writeHermesModelDecisionIntakeActivationExecutionManifestProposalCoverageReportArtifact(
  params: WriteHermesModelDecisionIntakeActivationExecutionManifestProposalCoverageReportArtifactParams,
): Promise<HermesModelDecisionIntakeActivationExecutionManifestProposalCoverageReportArtifact> {
  const executionManifestProposalReportPath = resolveInsideRepo(
    params.repoRoot,
    params.executionManifestProposalReportPath,
  );
  const failures: string[] = [];
  let parsedProposal: unknown;

  try {
    parsedProposal = JSON.parse(await readFile(executionManifestProposalReportPath, "utf8"));
  } catch (error) {
    failures.push(
      "model-backed dialogue intake activation execution-manifest proposal report JSON parse failed: " +
        (error instanceof Error ? error.message : String(error)),
    );
  }

  if (parsedProposal !== undefined) {
    failures.push(
      ...validateHermesModelDecisionIntakeActivationExecutionManifestProposalReport(parsedProposal),
    );
  }

  const record = isRecord(parsedProposal) ? parsedProposal : null;
  const proposal = isRecord(record?.proposal) ? record.proposal : null;
  const requiredValidationChecklist = Array.isArray(record?.required_validation_checklist)
    ? record.required_validation_checklist
    : [];
  const rollbackPrecondition =
    typeof record?.rollback_precondition === "string" && record.rollback_precondition.trim() !== ""
      ? record.rollback_precondition
      : "";

  const coverage = {
    proposal_ready: record?.status === "proposal_ready" && record?.validation_status === "pass",
    proposal_ratio_complete: proposal?.proposal_ratio === 1,
    approval_required_true:
      record?.approval_required === true && proposal?.approval_required_true === true,
    execution_start_allowed_false:
      record?.execution_start_allowed === false && proposal?.execution_start_allowed_false === true,
    operator_approval_false:
      record?.operator_approved === false && proposal?.operator_approval_false === true,
    execution_started_false:
      record?.execution_started === false && proposal?.execution_started_false === true,
    rollback_precondition_present:
      rollbackPrecondition.length > 0 && proposal?.rollback_precondition_present === true,
    required_validation_checklist_complete:
      requiredValidationChecklist.length > 0 &&
      requiredValidationChecklist.every((item) => typeof item === "string" && item.trim().length > 0) &&
      proposal?.required_validation_checklist_complete === true,
    registry_writes_disabled:
      record?.registry_write_allowed === false &&
      record?.taskflow_registry_write === false &&
      proposal?.registry_writes_disabled === true,
    sqlite_writes_disabled:
      record?.sqlite_write === false && proposal?.sqlite_writes_disabled === true,
    worker_execution_disabled:
      record?.worker_execution === false && proposal?.worker_execution_disabled === true,
    model_invocation_disabled:
      record?.model_invoked === false && proposal?.model_invocation_disabled === true,
    live_actions_disabled:
      record?.live_actions_enabled === false && proposal?.live_actions_disabled === true,
    coverage_report_not_approval:
      record?.operator_approved === false &&
      record?.execution_started === false &&
      proposal?.proposal_report_not_approval === true,
  };
  const coverageChecks = Object.values(coverage);
  const coverageRatio = coverageChecks.filter(Boolean).length / Math.max(coverageChecks.length, 1);
  const validationStatus = failures.length === 0 ? "pass" : "fail";
  const coveragePass = validationStatus === "pass" && coverageRatio === 1;
  const outputDir = resolveInsideRepo(
    params.repoRoot,
    params.outputDir ?? "reports/hermes-agent/state",
  );
  await mkdir(outputDir, { recursive: true });

  const report: HermesModelDecisionIntakeActivationExecutionManifestProposalCoverageReport = {
    schema: "openclaw.hermes.model_decision_intake_activation_execution_manifest_proposal_coverage_report.v1",
    created_at: (params.now ?? new Date()).toISOString(),
    dry_run: true,
    read_only: true,
    source_execution_manifest_proposal_report: executionManifestProposalReportPath,
    source_final_readiness_summary_coverage_report:
      readString(record?.source_final_readiness_summary_coverage_report) ?? "",
    source_final_readiness_summary_report:
      readString(record?.source_final_readiness_summary_report) ?? "",
    source_preflight_coverage_report: readString(record?.source_preflight_coverage_report) ?? "",
    source_preflight_report: readString(record?.source_preflight_report) ?? "",
    source_release_summary_coverage_report:
      readString(record?.source_release_summary_coverage_report) ?? "",
    source_release_summary_report: readString(record?.source_release_summary_report) ?? "",
    source_intake_coverage_report: readString(record?.source_intake_coverage_report) ?? "",
    source_handoff_plan: readString(record?.source_handoff_plan) ?? "",
    trace_id: readTraceId(parsedProposal),
    status: coveragePass ? "coverage_pass" : "blocked",
    validation_status: validationStatus,
    failures,
    coverage: {
      ...coverage,
      coverage_ratio: coverageRatio,
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
    blocked_actions: [
      "treating execution-manifest proposal coverage report as operator approval",
      "turning execution-manifest proposal coverage report into a registry writer",
      "turning execution-manifest proposal coverage report into a SQLite writer",
      "starting worker execution from execution-manifest proposal coverage report",
      "calling a model from execution-manifest proposal coverage report",
      "running live actions from execution-manifest proposal coverage report",
    ],
    rollback_path:
      "Discard this read-only execution-manifest proposal coverage report; it did not persist registry, SQLite, worker, model, approval, or live-action state.",
    next_safe_task: coveragePass
      ? "Prepare a read-only model-backed dialogue controlled executor intake activation execution-manifest final readiness summary report."
      : "Fix the model-backed dialogue controlled executor intake activation execution-manifest proposal report before coverage promotion.",
  };
  if (coveragePass) {
    const selfValidationFailures =
      validateHermesModelDecisionIntakeActivationExecutionManifestProposalCoverageReport(report);
    if (selfValidationFailures.length > 0) {
      throw new Error(
        "model-backed dialogue controlled executor intake activation execution-manifest proposal coverage report self-validation failed: " +
          selfValidationFailures.join("; "),
      );
    }
  }
  const filePath = resolve(
    outputDir,
    report.trace_id +
      "-model-backed-dialogue-controlled-executor-intake-activation-execution-manifest-proposal-coverage-report.json",
  );
  await writeFile(filePath, JSON.stringify(report, null, 2) + "\n", "utf8");
  return {
    path: filePath,
    report,
  };
}
export async function writeHermesModelDecisionIntakeActivationExecutionManifestFinalReadinessSummaryReportArtifact(
  params: WriteHermesModelDecisionIntakeActivationExecutionManifestFinalReadinessSummaryReportArtifactParams,
): Promise<HermesModelDecisionIntakeActivationExecutionManifestFinalReadinessSummaryReportArtifact> {
  const executionManifestProposalCoverageReportPath = resolveInsideRepo(
    params.repoRoot,
    params.executionManifestProposalCoverageReportPath,
  );
  const failures: string[] = [];
  let parsedCoverage: unknown;

  try {
    parsedCoverage = JSON.parse(await readFile(executionManifestProposalCoverageReportPath, "utf8"));
  } catch (error) {
    failures.push(
      "model-backed dialogue intake activation execution-manifest proposal coverage report JSON parse failed: " +
        (error instanceof Error ? error.message : String(error)),
    );
  }

  if (parsedCoverage !== undefined) {
    failures.push(
      ...validateHermesModelDecisionIntakeActivationExecutionManifestProposalCoverageReport(
        parsedCoverage,
      ),
    );
  }

  const record = isRecord(parsedCoverage) ? parsedCoverage : null;
  const coverage = isRecord(record?.coverage) ? record.coverage : null;

  const summary = {
    proposal_coverage_green: record?.status === "coverage_pass" && record?.validation_status === "pass",
    proposal_ready: coverage?.proposal_ready === true,
    proposal_ratio_complete:
      coverage?.proposal_ratio_complete === true && coverage?.coverage_ratio === 1,
    approval_required_true:
      record?.approval_required === true && coverage?.approval_required_true === true,
    execution_start_allowed_false:
      record?.execution_start_allowed === false && coverage?.execution_start_allowed_false === true,
    operator_approval_false:
      record?.operator_approved === false && coverage?.operator_approval_false === true,
    execution_started_false:
      record?.execution_started === false && coverage?.execution_started_false === true,
    rollback_precondition_present: coverage?.rollback_precondition_present === true,
    required_validation_checklist_complete:
      coverage?.required_validation_checklist_complete === true,
    registry_writes_disabled:
      record?.registry_write_allowed === false &&
      record?.taskflow_registry_write === false &&
      coverage?.registry_writes_disabled === true,
    sqlite_writes_disabled:
      record?.sqlite_write === false && coverage?.sqlite_writes_disabled === true,
    worker_execution_disabled:
      record?.worker_execution === false && coverage?.worker_execution_disabled === true,
    model_invocation_disabled:
      record?.model_invoked === false && coverage?.model_invocation_disabled === true,
    live_actions_disabled:
      record?.live_actions_enabled === false && coverage?.live_actions_disabled === true,
    summary_report_not_approval:
      record?.operator_approved === false &&
      record?.execution_started === false &&
      coverage?.coverage_report_not_approval === true,
  };
  const summaryChecks = Object.values(summary);
  const summaryRatio = summaryChecks.filter(Boolean).length / Math.max(summaryChecks.length, 1);
  const validationStatus = failures.length === 0 ? "pass" : "fail";
  const summaryReady = validationStatus === "pass" && summaryRatio === 1;
  const outputDir = resolveInsideRepo(
    params.repoRoot,
    params.outputDir ?? "reports/hermes-agent/state",
  );
  await mkdir(outputDir, { recursive: true });

  const report: HermesModelDecisionIntakeActivationExecutionManifestFinalReadinessSummaryReport = {
    schema: "openclaw.hermes.model_decision_intake_activation_execution_manifest_final_readiness_summary_report.v1",
    created_at: (params.now ?? new Date()).toISOString(),
    dry_run: true,
    read_only: true,
    source_execution_manifest_proposal_coverage_report: executionManifestProposalCoverageReportPath,
    source_execution_manifest_proposal_report:
      readString(record?.source_execution_manifest_proposal_report) ?? "",
    source_final_readiness_summary_coverage_report:
      readString(record?.source_final_readiness_summary_coverage_report) ?? "",
    source_final_readiness_summary_report:
      readString(record?.source_final_readiness_summary_report) ?? "",
    source_preflight_coverage_report: readString(record?.source_preflight_coverage_report) ?? "",
    source_preflight_report: readString(record?.source_preflight_report) ?? "",
    source_release_summary_coverage_report:
      readString(record?.source_release_summary_coverage_report) ?? "",
    source_release_summary_report: readString(record?.source_release_summary_report) ?? "",
    source_intake_coverage_report: readString(record?.source_intake_coverage_report) ?? "",
    source_handoff_plan: readString(record?.source_handoff_plan) ?? "",
    trace_id: readTraceId(parsedCoverage),
    status: summaryReady ? "summary_ready" : "blocked",
    validation_status: validationStatus,
    failures,
    summary: {
      ...summary,
      summary_ratio: summaryRatio,
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
    blocked_actions: [
      "treating execution-manifest final readiness summary report as operator approval",
      "turning execution-manifest final readiness summary report into a registry writer",
      "turning execution-manifest final readiness summary report into a SQLite writer",
      "starting worker execution from execution-manifest final readiness summary report",
      "calling a model from execution-manifest final readiness summary report",
      "running live actions from execution-manifest final readiness summary report",
    ],
    rollback_path:
      "Discard this read-only execution-manifest final readiness summary report; it did not persist registry, SQLite, worker, model, approval, or live-action state.",
    next_safe_task: summaryReady
      ? "Prepare a read-only model-backed dialogue controlled executor intake activation execution-manifest final readiness summary coverage report."
      : "Fix the model-backed dialogue controlled executor intake activation execution-manifest proposal coverage report before final readiness summary promotion.",
  };
  if (summaryReady) {
    const selfValidationFailures =
      validateHermesModelDecisionIntakeActivationExecutionManifestFinalReadinessSummaryReport(report);
    if (selfValidationFailures.length > 0) {
      throw new Error(
        "model-backed dialogue controlled executor intake activation execution-manifest final readiness summary report self-validation failed: " +
          selfValidationFailures.join("; "),
      );
    }
  }
  const filePath = resolve(
    outputDir,
    report.trace_id +
      "-model-backed-dialogue-controlled-executor-intake-activation-execution-manifest-final-readiness-summary-report.json",
  );
  await writeFile(filePath, JSON.stringify(report, null, 2) + "\n", "utf8");
  return {
    path: filePath,
    report,
  };
}
function buildHermesDecisionPrompt(plan: HermesPlan): string {
  return [
    "/no_think",
    "You are Hermes inside OpenClaw. Produce a safe dry-run decision only.",
    "Do not execute tasks, modify files, deploy, trade, pay, or handle credentials.",
    "Preserve the deterministic risk and approval boundary from the task package.",
    "Return compact JSON only with these keys: summary, action_plan, validation_commands, risk_notes.",
    "Keep each array to at most three short strings.",
    "",
    JSON.stringify(
      {
        request: plan.task_package.task_goal,
        risk_class: plan.task_package.risk_class,
        approval_required: plan.task_package.approval_required,
        task_package: plan.task_package,
      },
      null,
      2,
    ),
  ].join("\n");
}

function collectModelText(content: Array<{ type: string; text?: string }>): string {
  return content
    .map((block) => (block.type === "text" && typeof block.text === "string" ? block.text : ""))
    .join("")
    .trim();
}

function resolveMaxTokens(requested: number | undefined, modelMaxTokens: unknown): number {
  if (typeof requested === "number" && Number.isFinite(requested) && requested > 0) {
    return Math.floor(requested);
  }
  if (typeof modelMaxTokens === "number" && Number.isFinite(modelMaxTokens) && modelMaxTokens > 0) {
    return Math.min(Math.floor(modelMaxTokens), DEFAULT_MAX_TOKENS);
  }
  return DEFAULT_MAX_TOKENS;
}

function parseModelDecision(
  text: string,
): { ok: true; value: unknown } | { ok: false; value: null } {
  const trimmed = text.trim();
  const direct = parseJson(trimmed);
  if (direct.ok) {
    return direct;
  }
  const start = trimmed.indexOf("{");
  const end = trimmed.lastIndexOf("}");
  if (start >= 0 && end > start) {
    return parseJson(trimmed.slice(start, end + 1));
  }
  return { ok: false, value: null };
}

function parseJson(text: string): { ok: true; value: unknown } | { ok: false; value: null } {
  try {
    return { ok: true, value: JSON.parse(text) as unknown };
  } catch {
    return { ok: false, value: null };
  }
}

function normalizeModelDecision(
  parsed: unknown,
  modelText: string,
  plan: HermesPlan,
): HermesModelDecision["decision"] {
  const record = isRecord(parsed) ? parsed : undefined;
  const summary = readSummary(record?.summary, modelText);
  const actionPlan = readStringList(record?.action_plan);
  const validationCommands = readStringList(record?.validation_commands);
  const riskNotes = readStringList(record?.risk_notes);
  return {
    summary,
    action_plan: actionPlan.length > 0 ? actionPlan : plan.task_package.concrete_steps,
    validation_commands:
      validationCommands.length > 0 ? validationCommands : plan.task_package.validation_commands,
    risk_notes:
      riskNotes.length > 0
        ? riskNotes
        : [
            `Hermes deterministic risk class: ${plan.task_package.risk_class}.`,
            plan.task_package.approval_required
              ? "Execution remains blocked until human approval."
              : "Local dry-run review does not require human approval.",
          ],
  };
}

function readString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function readSummary(value: unknown, fallback: string): string {
  const single = readString(value);
  if (single) {
    return single;
  }
  const entries = readStringList(value);
  return entries.length > 0 ? entries.join(" ") : fallback;
}

function readStringList(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value
      .filter((entry): entry is string => typeof entry === "string")
      .map((entry) => entry.trim())
      .filter(Boolean);
  }
  const single = readString(value);
  return single ? [single] : [];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function readTraceId(value: unknown): string {
  return isRecord(value) && typeof value.trace_id === "string" && value.trace_id.trim() !== ""
    ? value.trace_id
    : "unknown-trace";
}

function validateHermesModelDecision(value: unknown): string[] {
  const failures: string[] = [];
  if (!isRecord(value)) {
    return ["model-backed dialogue decision must be a JSON object"];
  }

  expectField(value, "schema", "openclaw.hermes.model_decision.v1", failures);
  expectField(value, "dry_run", true, failures);
  expectField(value, "model_invoked", true, failures);
  expectField(value, "parsed_model_json", true, failures);
  if (typeof value.trace_id !== "string" || value.trace_id.trim() === "") {
    failures.push("trace_id must be a non-empty string");
  }
  if (typeof value.provider !== "string" || value.provider.trim() === "") {
    failures.push("provider must be a non-empty string");
  }
  if (typeof value.model !== "string" || value.model.trim() === "") {
    failures.push("model must be a non-empty string");
  }
  if (typeof value.risk_class !== "string" || value.risk_class.trim() === "") {
    failures.push("risk_class must be a non-empty string");
  }
  if (!isRecord(value.decision)) {
    failures.push("decision must be a JSON object");
  } else {
    if (typeof value.decision.summary !== "string" || value.decision.summary.trim() === "") {
      failures.push("decision.summary must be a non-empty string");
    }
    if (readStringList(value.decision.action_plan).length === 0) {
      failures.push("decision.action_plan must contain at least one step");
    }
    if (readStringList(value.decision.validation_commands).length === 0) {
      failures.push("decision.validation_commands must contain at least one command");
    }
    const notes = readStringList(value.decision.risk_notes);
    for (const required of [
      "registry writes disabled",
      "SQLite writes disabled",
      "worker execution disabled",
      "live actions disabled",
    ]) {
      if (!notes.includes(required)) {
        failures.push(`decision.risk_notes must include ${required}`);
      }
    }
  }
  if (!isRecord(value.task_package)) {
    failures.push("task_package must be a JSON object");
  }
  if (!isRecord(value.envelope)) {
    failures.push("envelope must be a JSON object");
  }

  return failures;
}

function validateHermesModelDecisionCoverageReport(value: unknown): string[] {
  const failures: string[] = [];
  if (!isRecord(value)) {
    return ["model-backed dialogue decision coverage report must be a JSON object"];
  }

  expectField(value, "schema", "openclaw.hermes.model_decision_coverage_report.v1", failures);
  expectField(value, "dry_run", true, failures);
  expectField(value, "read_only", true, failures);
  expectField(value, "status", "coverage_pass", failures);
  expectField(value, "validation_status", "pass", failures);
  expectField(value, "registry_write_allowed", false, failures);
  expectField(value, "taskflow_registry_write", false, failures);
  expectField(value, "sqlite_write", false, failures);
  expectField(value, "worker_execution", false, failures);
  expectField(value, "model_invoked", false, failures);
  expectField(value, "live_actions_enabled", false, failures);
  if (typeof value.trace_id !== "string" || value.trace_id.trim() === "") {
    failures.push("trace_id must be a non-empty string");
  }
  if (
    typeof value.source_model_decision !== "string" ||
    value.source_model_decision.trim() === ""
  ) {
    failures.push("source_model_decision must be a non-empty string");
  }
  const reportFailures = Array.isArray(value.failures) ? value.failures : [];
  if (reportFailures.length > 0) {
    failures.push("model-backed dialogue decision coverage failures must be empty");
  }
  if (!isRecord(value.coverage)) {
    failures.push("coverage must be a JSON object");
  } else {
    expectField(value.coverage, "source_model_invoked", true, failures, "coverage");
    expectField(value.coverage, "parsed_model_json", true, failures, "coverage");
    expectField(value.coverage, "provider_selected", true, failures, "coverage");
    expectField(value.coverage, "model_selected", true, failures, "coverage");
    expectField(value.coverage, "risk_boundary_present", true, failures, "coverage");
    expectField(value.coverage, "validation_commands_present", true, failures, "coverage");
    expectField(value.coverage, "registry_writes_disabled", true, failures, "coverage");
    expectField(value.coverage, "sqlite_writes_disabled", true, failures, "coverage");
    expectField(value.coverage, "worker_execution_disabled", true, failures, "coverage");
    expectField(value.coverage, "live_actions_disabled", true, failures, "coverage");
    expectField(value.coverage, "coverage_ratio", 1, failures, "coverage");
  }
  if (!Array.isArray(value.blocked_actions) || value.blocked_actions.length === 0) {
    failures.push("blocked_actions must be a non-empty array");
  }
  if (typeof value.rollback_path !== "string" || value.rollback_path.trim() === "") {
    failures.push("rollback_path must be a non-empty string");
  }
  if (typeof value.next_safe_task !== "string" || value.next_safe_task.trim() === "") {
    failures.push("next_safe_task must be a non-empty string");
  }

  return failures;
}

function validateHermesModelDecisionHandoffPlan(value: unknown): string[] {
  const failures: string[] = [];
  if (!isRecord(value)) {
    return ["model-backed dialogue decision handoff plan must be a JSON object"];
  }

  expectField(value, "schema", "openclaw.hermes.model_decision_handoff_plan.v1", failures);
  expectField(value, "dry_run", true, failures);
  expectField(value, "read_only", true, failures);
  expectField(value, "status", "handoff_ready", failures);
  expectField(value, "validation_status", "pass", failures);
  expectField(value, "operator_approved", false, failures);
  expectField(value, "execution_started", false, failures);
  expectField(value, "registry_write_allowed", false, failures);
  expectField(value, "taskflow_registry_write", false, failures);
  expectField(value, "sqlite_write", false, failures);
  expectField(value, "worker_execution", false, failures);
  expectField(value, "model_invoked", false, failures);
  expectField(value, "live_actions_enabled", false, failures);
  if (typeof value.trace_id !== "string" || value.trace_id.trim() === "") {
    failures.push("trace_id must be a non-empty string");
  }
  if (
    typeof value.source_coverage_report !== "string" ||
    value.source_coverage_report.trim() === ""
  ) {
    failures.push("source_coverage_report must be a non-empty string");
  }
  if (
    typeof value.source_model_decision !== "string" ||
    value.source_model_decision.trim() === ""
  ) {
    failures.push("source_model_decision must be a non-empty string");
  }
  const reportFailures = Array.isArray(value.failures) ? value.failures : [];
  if (reportFailures.length > 0) {
    failures.push("model-backed dialogue decision handoff failures must be empty");
  }
  if (!isRecord(value.handoff)) {
    failures.push("handoff must be a JSON object");
  } else {
    expectField(
      value.handoff,
      "context_type",
      "controlled_executor_intake_context",
      failures,
      "handoff",
    );
    expectField(value.handoff, "model_dialogue_coverage_pass", true, failures, "handoff");
    expectField(value.handoff, "coverage_ratio", 1, failures, "handoff");
    expectField(value.handoff, "intake_context_only", true, failures, "handoff");
    expectField(value.handoff, "operator_approval_granted", false, failures, "handoff");
    expectField(value.handoff, "approval_required_for_execution", true, failures, "handoff");
    expectField(value.handoff, "execution_start_allowed", false, failures, "handoff");
    expectField(value.handoff, "registry_writer_allowed", false, failures, "handoff");
    expectField(value.handoff, "sqlite_writer_allowed", false, failures, "handoff");
    expectField(value.handoff, "worker_execution_allowed", false, failures, "handoff");
    expectField(value.handoff, "model_caller_allowed", false, failures, "handoff");
    expectField(value.handoff, "live_actions_allowed", false, failures, "handoff");
    expectField(value.handoff, "handoff_ratio", 1, failures, "handoff");
  }
  if (!Array.isArray(value.blocked_actions) || value.blocked_actions.length === 0) {
    failures.push("blocked_actions must be a non-empty array");
  }
  if (typeof value.rollback_path !== "string" || value.rollback_path.trim() === "") {
    failures.push("rollback_path must be a non-empty string");
  }
  if (typeof value.next_safe_task !== "string" || value.next_safe_task.trim() === "") {
    failures.push("next_safe_task must be a non-empty string");
  }

  return failures;
}
function validateHermesModelDecisionHandoffIntakeCoverageReport(value: unknown): string[] {
  const failures: string[] = [];
  if (!isRecord(value)) {
    return ["model-backed dialogue handoff intake coverage report must be a JSON object"];
  }

  expectField(
    value,
    "schema",
    "openclaw.hermes.model_decision_handoff_intake_coverage_report.v1",
    failures,
  );
  expectField(value, "dry_run", true, failures);
  expectField(value, "read_only", true, failures);
  expectField(value, "status", "coverage_pass", failures);
  expectField(value, "validation_status", "pass", failures);
  expectField(value, "operator_approved", false, failures);
  expectField(value, "execution_started", false, failures);
  expectField(value, "registry_write_allowed", false, failures);
  expectField(value, "taskflow_registry_write", false, failures);
  expectField(value, "sqlite_write", false, failures);
  expectField(value, "worker_execution", false, failures);
  expectField(value, "model_invoked", false, failures);
  expectField(value, "live_actions_enabled", false, failures);
  if (typeof value.trace_id !== "string" || value.trace_id.trim() === "") {
    failures.push("trace_id must be a non-empty string");
  }
  if (typeof value.source_handoff_plan !== "string" || value.source_handoff_plan.trim() === "") {
    failures.push("source_handoff_plan must be a non-empty string");
  }
  if (
    typeof value.source_coverage_report !== "string" ||
    value.source_coverage_report.trim() === ""
  ) {
    failures.push("source_coverage_report must be a non-empty string");
  }
  const reportFailures = Array.isArray(value.failures) ? value.failures : [];
  if (reportFailures.length > 0) {
    failures.push("model-backed dialogue handoff intake coverage failures must be empty");
  }
  if (!isRecord(value.coverage)) {
    failures.push("coverage must be a JSON object");
  } else {
    expectField(value.coverage, "handoff_ready", true, failures, "coverage");
    expectField(value.coverage, "controlled_executor_intake_context", true, failures, "coverage");
    expectField(value.coverage, "intake_context_only", true, failures, "coverage");
    expectField(value.coverage, "operator_approval_false", true, failures, "coverage");
    expectField(value.coverage, "execution_started_false", true, failures, "coverage");
    expectField(value.coverage, "registry_writes_disabled", true, failures, "coverage");
    expectField(value.coverage, "sqlite_writes_disabled", true, failures, "coverage");
    expectField(value.coverage, "worker_execution_disabled", true, failures, "coverage");
    expectField(value.coverage, "model_invocation_disabled", true, failures, "coverage");
    expectField(value.coverage, "live_actions_disabled", true, failures, "coverage");
    expectField(value.coverage, "coverage_ratio", 1, failures, "coverage");
  }
  if (!Array.isArray(value.blocked_actions) || value.blocked_actions.length === 0) {
    failures.push("blocked_actions must be a non-empty array");
  }
  if (typeof value.rollback_path !== "string" || value.rollback_path.trim() === "") {
    failures.push("rollback_path must be a non-empty string");
  }
  if (typeof value.next_safe_task !== "string" || value.next_safe_task.trim() === "") {
    failures.push("next_safe_task must be a non-empty string");
  }

  return failures;
}
function validateHermesModelDecisionIntakeReleaseSummaryReport(value: unknown): string[] {
  const failures: string[] = [];
  if (!isRecord(value)) {
    return ["model-backed dialogue intake release summary report must be a JSON object"];
  }

  expectField(
    value,
    "schema",
    "openclaw.hermes.model_decision_intake_release_summary_report.v1",
    failures,
  );
  expectField(value, "dry_run", true, failures);
  expectField(value, "read_only", true, failures);
  expectField(value, "status", "summary_ready", failures);
  expectField(value, "validation_status", "pass", failures);
  expectField(value, "operator_approved", false, failures);
  expectField(value, "execution_started", false, failures);
  expectField(value, "registry_write_allowed", false, failures);
  expectField(value, "taskflow_registry_write", false, failures);
  expectField(value, "sqlite_write", false, failures);
  expectField(value, "worker_execution", false, failures);
  expectField(value, "model_invoked", false, failures);
  expectField(value, "live_actions_enabled", false, failures);
  if (typeof value.trace_id !== "string" || value.trace_id.trim() === "") {
    failures.push("trace_id must be a non-empty string");
  }
  if (
    typeof value.source_intake_coverage_report !== "string" ||
    value.source_intake_coverage_report.trim() === ""
  ) {
    failures.push("source_intake_coverage_report must be a non-empty string");
  }
  if (typeof value.source_handoff_plan !== "string" || value.source_handoff_plan.trim() === "") {
    failures.push("source_handoff_plan must be a non-empty string");
  }
  const reportFailures = Array.isArray(value.failures) ? value.failures : [];
  if (reportFailures.length > 0) {
    failures.push("model-backed dialogue intake release summary failures must be empty");
  }
  if (!isRecord(value.summary)) {
    failures.push("summary must be a JSON object");
  } else {
    expectField(value.summary, "intake_coverage_green", true, failures, "summary");
    expectField(value.summary, "handoff_ready", true, failures, "summary");
    expectField(value.summary, "controlled_executor_intake_context", true, failures, "summary");
    expectField(value.summary, "intake_context_only", true, failures, "summary");
    expectField(value.summary, "operator_approval_false", true, failures, "summary");
    expectField(value.summary, "execution_started_false", true, failures, "summary");
    expectField(value.summary, "registry_writes_disabled", true, failures, "summary");
    expectField(value.summary, "sqlite_writes_disabled", true, failures, "summary");
    expectField(value.summary, "worker_execution_disabled", true, failures, "summary");
    expectField(value.summary, "model_invocation_disabled", true, failures, "summary");
    expectField(value.summary, "live_actions_disabled", true, failures, "summary");
    expectField(value.summary, "summary_ratio", 1, failures, "summary");
  }
  if (!Array.isArray(value.blocked_actions) || value.blocked_actions.length === 0) {
    failures.push("blocked_actions must be a non-empty array");
  }
  if (typeof value.rollback_path !== "string" || value.rollback_path.trim() === "") {
    failures.push("rollback_path must be a non-empty string");
  }
  if (typeof value.next_safe_task !== "string" || value.next_safe_task.trim() === "") {
    failures.push("next_safe_task must be a non-empty string");
  }

  return failures;
}
function validateHermesModelDecisionIntakeReleaseSummaryCoverageReport(value: unknown): string[] {
  const failures: string[] = [];
  if (!isRecord(value)) {
    return ["model-backed dialogue intake release summary coverage report must be a JSON object"];
  }

  expectField(
    value,
    "schema",
    "openclaw.hermes.model_decision_intake_release_summary_coverage_report.v1",
    failures,
  );
  expectField(value, "dry_run", true, failures);
  expectField(value, "read_only", true, failures);
  expectField(value, "status", "coverage_pass", failures);
  expectField(value, "validation_status", "pass", failures);
  expectField(value, "operator_approved", false, failures);
  expectField(value, "execution_started", false, failures);
  expectField(value, "registry_write_allowed", false, failures);
  expectField(value, "taskflow_registry_write", false, failures);
  expectField(value, "sqlite_write", false, failures);
  expectField(value, "worker_execution", false, failures);
  expectField(value, "model_invoked", false, failures);
  expectField(value, "live_actions_enabled", false, failures);
  if (typeof value.trace_id !== "string" || value.trace_id.trim() === "") {
    failures.push("trace_id must be a non-empty string");
  }
  if (
    typeof value.source_release_summary_report !== "string" ||
    value.source_release_summary_report.trim() === ""
  ) {
    failures.push("source_release_summary_report must be a non-empty string");
  }
  if (
    typeof value.source_intake_coverage_report !== "string" ||
    value.source_intake_coverage_report.trim() === ""
  ) {
    failures.push("source_intake_coverage_report must be a non-empty string");
  }
  if (typeof value.source_handoff_plan !== "string" || value.source_handoff_plan.trim() === "") {
    failures.push("source_handoff_plan must be a non-empty string");
  }
  const reportFailures = Array.isArray(value.failures) ? value.failures : [];
  if (reportFailures.length > 0) {
    failures.push("model-backed dialogue intake release summary coverage failures must be empty");
  }
  if (!isRecord(value.coverage)) {
    failures.push("coverage must be a JSON object");
  } else {
    expectField(value.coverage, "release_summary_ready", true, failures, "coverage");
    expectField(value.coverage, "intake_coverage_green", true, failures, "coverage");
    expectField(value.coverage, "handoff_ready", true, failures, "coverage");
    expectField(
      value.coverage,
      "controlled_executor_intake_context_boundary",
      true,
      failures,
      "coverage",
    );
    expectField(value.coverage, "intake_context_only", true, failures, "coverage");
    expectField(value.coverage, "operator_approval_false", true, failures, "coverage");
    expectField(value.coverage, "execution_started_false", true, failures, "coverage");
    expectField(value.coverage, "registry_writes_disabled", true, failures, "coverage");
    expectField(value.coverage, "sqlite_writes_disabled", true, failures, "coverage");
    expectField(value.coverage, "worker_execution_disabled", true, failures, "coverage");
    expectField(value.coverage, "model_invocation_disabled", true, failures, "coverage");
    expectField(value.coverage, "live_actions_disabled", true, failures, "coverage");
    expectField(value.coverage, "release_summary_not_approval", true, failures, "coverage");
    expectField(value.coverage, "coverage_report_not_executor", true, failures, "coverage");
    expectField(value.coverage, "coverage_ratio", 1, failures, "coverage");
  }
  if (!Array.isArray(value.blocked_actions) || value.blocked_actions.length === 0) {
    failures.push("blocked_actions must be a non-empty array");
  }
  if (typeof value.rollback_path !== "string" || value.rollback_path.trim() === "") {
    failures.push("rollback_path must be a non-empty string");
  }
  if (typeof value.next_safe_task !== "string" || value.next_safe_task.trim() === "") {
    failures.push("next_safe_task must be a non-empty string");
  }

  return failures;
}

function validateHermesModelDecisionIntakeActivationPreflightReport(value: unknown): string[] {
  const failures: string[] = [];
  if (!isRecord(value)) {
    return [
      "model-backed dialogue controlled executor intake activation preflight report must be a JSON object",
    ];
  }

  expectField(
    value,
    "schema",
    "openclaw.hermes.model_decision_intake_activation_preflight_report.v1",
    failures,
  );
  expectField(value, "dry_run", true, failures);
  expectField(value, "read_only", true, failures);
  expectField(value, "status", "preflight_pass", failures);
  expectField(value, "validation_status", "pass", failures);
  expectField(value, "operator_approved", false, failures);
  expectField(value, "execution_started", false, failures);
  expectField(value, "registry_write_allowed", false, failures);
  expectField(value, "taskflow_registry_write", false, failures);
  expectField(value, "sqlite_write", false, failures);
  expectField(value, "worker_execution", false, failures);
  expectField(value, "model_invoked", false, failures);
  expectField(value, "live_actions_enabled", false, failures);
  if (typeof value.trace_id !== "string" || value.trace_id.trim() === "") {
    failures.push("trace_id must be a non-empty string");
  }
  if (
    typeof value.source_release_summary_coverage_report !== "string" ||
    value.source_release_summary_coverage_report.trim() === ""
  ) {
    failures.push("source_release_summary_coverage_report must be a non-empty string");
  }
  if (
    typeof value.source_release_summary_report !== "string" ||
    value.source_release_summary_report.trim() === ""
  ) {
    failures.push("source_release_summary_report must be a non-empty string");
  }
  if (
    typeof value.source_intake_coverage_report !== "string" ||
    value.source_intake_coverage_report.trim() === ""
  ) {
    failures.push("source_intake_coverage_report must be a non-empty string");
  }
  if (typeof value.source_handoff_plan !== "string" || value.source_handoff_plan.trim() === "") {
    failures.push("source_handoff_plan must be a non-empty string");
  }
  const reportFailures = Array.isArray(value.failures) ? value.failures : [];
  if (reportFailures.length > 0) {
    failures.push("model-backed dialogue intake activation preflight failures must be empty");
  }
  if (!isRecord(value.preflight)) {
    failures.push("preflight must be a JSON object");
  } else {
    expectField(value.preflight, "release_summary_coverage_green", true, failures, "preflight");
    expectField(value.preflight, "release_summary_ready", true, failures, "preflight");
    expectField(value.preflight, "intake_coverage_green", true, failures, "preflight");
    expectField(value.preflight, "handoff_ready", true, failures, "preflight");
    expectField(
      value.preflight,
      "controlled_executor_intake_context_boundary",
      true,
      failures,
      "preflight",
    );
    expectField(value.preflight, "operator_approval_false", true, failures, "preflight");
    expectField(value.preflight, "execution_started_false", true, failures, "preflight");
    expectField(value.preflight, "registry_writes_disabled", true, failures, "preflight");
    expectField(value.preflight, "sqlite_writes_disabled", true, failures, "preflight");
    expectField(value.preflight, "worker_execution_disabled", true, failures, "preflight");
    expectField(value.preflight, "model_invocation_disabled", true, failures, "preflight");
    expectField(value.preflight, "live_actions_disabled", true, failures, "preflight");
    expectField(value.preflight, "preflight_ratio", 1, failures, "preflight");
  }
  if (!Array.isArray(value.blocked_actions) || value.blocked_actions.length === 0) {
    failures.push("blocked_actions must be a non-empty array");
  }
  if (typeof value.rollback_path !== "string" || value.rollback_path.trim() === "") {
    failures.push("rollback_path must be a non-empty string");
  }
  if (typeof value.next_safe_task !== "string" || value.next_safe_task.trim() === "") {
    failures.push("next_safe_task must be a non-empty string");
  }

  return failures;
}

function validateHermesModelDecisionIntakeActivationPreflightCoverageReport(
  value: unknown,
): string[] {
  const failures: string[] = [];
  if (!isRecord(value)) {
    return [
      "model-backed dialogue controlled executor intake activation preflight coverage report must be a JSON object",
    ];
  }

  expectField(
    value,
    "schema",
    "openclaw.hermes.model_decision_intake_activation_preflight_coverage_report.v1",
    failures,
  );
  expectField(value, "dry_run", true, failures);
  expectField(value, "read_only", true, failures);
  expectField(value, "status", "coverage_pass", failures);
  expectField(value, "validation_status", "pass", failures);
  expectField(value, "operator_approved", false, failures);
  expectField(value, "execution_started", false, failures);
  expectField(value, "registry_write_allowed", false, failures);
  expectField(value, "taskflow_registry_write", false, failures);
  expectField(value, "sqlite_write", false, failures);
  expectField(value, "worker_execution", false, failures);
  expectField(value, "model_invoked", false, failures);
  expectField(value, "live_actions_enabled", false, failures);
  if (typeof value.trace_id !== "string" || value.trace_id.trim() === "") {
    failures.push("trace_id must be a non-empty string");
  }
  if (typeof value.source_preflight_report !== "string" || value.source_preflight_report.trim() === "") {
    failures.push("source_preflight_report must be a non-empty string");
  }
  if (
    typeof value.source_release_summary_coverage_report !== "string" ||
    value.source_release_summary_coverage_report.trim() === ""
  ) {
    failures.push("source_release_summary_coverage_report must be a non-empty string");
  }
  if (
    typeof value.source_release_summary_report !== "string" ||
    value.source_release_summary_report.trim() === ""
  ) {
    failures.push("source_release_summary_report must be a non-empty string");
  }
  if (
    typeof value.source_intake_coverage_report !== "string" ||
    value.source_intake_coverage_report.trim() === ""
  ) {
    failures.push("source_intake_coverage_report must be a non-empty string");
  }
  if (typeof value.source_handoff_plan !== "string" || value.source_handoff_plan.trim() === "") {
    failures.push("source_handoff_plan must be a non-empty string");
  }
  const reportFailures = Array.isArray(value.failures) ? value.failures : [];
  if (reportFailures.length > 0) {
    failures.push("model-backed dialogue intake activation preflight coverage failures must be empty");
  }
  if (!isRecord(value.coverage)) {
    failures.push("coverage must be a JSON object");
  } else {
    expectField(value.coverage, "intake_activation_preflight_green", true, failures, "coverage");
    expectField(value.coverage, "release_summary_coverage_green", true, failures, "coverage");
    expectField(value.coverage, "release_summary_ready", true, failures, "coverage");
    expectField(value.coverage, "intake_coverage_green", true, failures, "coverage");
    expectField(value.coverage, "handoff_ready", true, failures, "coverage");
    expectField(
      value.coverage,
      "controlled_executor_intake_context_boundary",
      true,
      failures,
      "coverage",
    );
    expectField(value.coverage, "operator_approval_false", true, failures, "coverage");
    expectField(value.coverage, "execution_started_false", true, failures, "coverage");
    expectField(value.coverage, "registry_writes_disabled", true, failures, "coverage");
    expectField(value.coverage, "sqlite_writes_disabled", true, failures, "coverage");
    expectField(value.coverage, "worker_execution_disabled", true, failures, "coverage");
    expectField(value.coverage, "model_invocation_disabled", true, failures, "coverage");
    expectField(value.coverage, "live_actions_disabled", true, failures, "coverage");
    expectField(value.coverage, "preflight_report_not_approval", true, failures, "coverage");
    expectField(value.coverage, "coverage_report_not_executor", true, failures, "coverage");
    expectField(value.coverage, "coverage_ratio", 1, failures, "coverage");
  }
  if (!Array.isArray(value.blocked_actions) || value.blocked_actions.length === 0) {
    failures.push("blocked_actions must be a non-empty array");
  }
  if (typeof value.rollback_path !== "string" || value.rollback_path.trim() === "") {
    failures.push("rollback_path must be a non-empty string");
  }
  if (typeof value.next_safe_task !== "string" || value.next_safe_task.trim() === "") {
    failures.push("next_safe_task must be a non-empty string");
  }

  return failures;
}

function validateHermesModelDecisionIntakeActivationFinalReadinessSummaryReport(
  value: unknown,
): string[] {
  const failures: string[] = [];
  if (!isRecord(value)) {
    return [
      "model-backed dialogue controlled executor intake activation final readiness summary report must be a JSON object",
    ];
  }

  expectField(
    value,
    "schema",
    "openclaw.hermes.model_decision_intake_activation_final_readiness_summary_report.v1",
    failures,
  );
  expectField(value, "dry_run", true, failures);
  expectField(value, "read_only", true, failures);
  expectField(value, "status", "summary_ready", failures);
  expectField(value, "validation_status", "pass", failures);
  expectField(value, "operator_approved", false, failures);
  expectField(value, "execution_started", false, failures);
  expectField(value, "registry_write_allowed", false, failures);
  expectField(value, "taskflow_registry_write", false, failures);
  expectField(value, "sqlite_write", false, failures);
  expectField(value, "worker_execution", false, failures);
  expectField(value, "model_invoked", false, failures);
  expectField(value, "live_actions_enabled", false, failures);
  if (typeof value.trace_id !== "string" || value.trace_id.trim() === "") {
    failures.push("trace_id must be a non-empty string");
  }
  if (
    typeof value.source_preflight_coverage_report !== "string" ||
    value.source_preflight_coverage_report.trim() === ""
  ) {
    failures.push("source_preflight_coverage_report must be a non-empty string");
  }
  if (typeof value.source_preflight_report !== "string" || value.source_preflight_report.trim() === "") {
    failures.push("source_preflight_report must be a non-empty string");
  }
  if (
    typeof value.source_release_summary_coverage_report !== "string" ||
    value.source_release_summary_coverage_report.trim() === ""
  ) {
    failures.push("source_release_summary_coverage_report must be a non-empty string");
  }
  if (
    typeof value.source_release_summary_report !== "string" ||
    value.source_release_summary_report.trim() === ""
  ) {
    failures.push("source_release_summary_report must be a non-empty string");
  }
  if (
    typeof value.source_intake_coverage_report !== "string" ||
    value.source_intake_coverage_report.trim() === ""
  ) {
    failures.push("source_intake_coverage_report must be a non-empty string");
  }
  if (typeof value.source_handoff_plan !== "string" || value.source_handoff_plan.trim() === "") {
    failures.push("source_handoff_plan must be a non-empty string");
  }
  const reportFailures = Array.isArray(value.failures) ? value.failures : [];
  if (reportFailures.length > 0) {
    failures.push(
      "model-backed dialogue intake activation final readiness summary failures must be empty",
    );
  }
  if (!isRecord(value.summary)) {
    failures.push("summary must be a JSON object");
  } else {
    expectField(
      value.summary,
      "intake_activation_preflight_coverage_green",
      true,
      failures,
      "summary",
    );
    expectField(value.summary, "intake_activation_preflight_green", true, failures, "summary");
    expectField(value.summary, "release_summary_coverage_green", true, failures, "summary");
    expectField(value.summary, "release_summary_ready", true, failures, "summary");
    expectField(value.summary, "intake_coverage_green", true, failures, "summary");
    expectField(value.summary, "handoff_ready", true, failures, "summary");
    expectField(
      value.summary,
      "controlled_executor_intake_context_boundary",
      true,
      failures,
      "summary",
    );
    expectField(value.summary, "operator_approval_false", true, failures, "summary");
    expectField(value.summary, "execution_started_false", true, failures, "summary");
    expectField(value.summary, "registry_writes_disabled", true, failures, "summary");
    expectField(value.summary, "sqlite_writes_disabled", true, failures, "summary");
    expectField(value.summary, "worker_execution_disabled", true, failures, "summary");
    expectField(value.summary, "model_invocation_disabled", true, failures, "summary");
    expectField(value.summary, "live_actions_disabled", true, failures, "summary");
    expectField(
      value.summary,
      "final_readiness_summary_not_approval",
      true,
      failures,
      "summary",
    );
    expectField(value.summary, "summary_report_not_executor", true, failures, "summary");
    expectField(value.summary, "summary_ratio", 1, failures, "summary");
  }
  if (!Array.isArray(value.blocked_actions) || value.blocked_actions.length === 0) {
    failures.push("blocked_actions must be a non-empty array");
  }
  if (typeof value.rollback_path !== "string" || value.rollback_path.trim() === "") {
    failures.push("rollback_path must be a non-empty string");
  }
  if (typeof value.next_safe_task !== "string" || value.next_safe_task.trim() === "") {
    failures.push("next_safe_task must be a non-empty string");
  }

  return failures;
}
function validateHermesModelDecisionIntakeActivationFinalReadinessSummaryCoverageReport(
  value: unknown,
): string[] {
  const failures: string[] = [];
  if (!isRecord(value)) {
    return [
      "model-backed dialogue controlled executor intake activation final readiness summary coverage report must be a JSON object",
    ];
  }

  expectField(
    value,
    "schema",
    "openclaw.hermes.model_decision_intake_activation_final_readiness_summary_coverage_report.v1",
    failures,
  );
  expectField(value, "dry_run", true, failures);
  expectField(value, "read_only", true, failures);
  expectField(value, "status", "coverage_pass", failures);
  expectField(value, "validation_status", "pass", failures);
  expectField(value, "operator_approved", false, failures);
  expectField(value, "execution_started", false, failures);
  expectField(value, "registry_write_allowed", false, failures);
  expectField(value, "taskflow_registry_write", false, failures);
  expectField(value, "sqlite_write", false, failures);
  expectField(value, "worker_execution", false, failures);
  expectField(value, "model_invoked", false, failures);
  expectField(value, "live_actions_enabled", false, failures);
  if (typeof value.trace_id !== "string" || value.trace_id.trim() === "") {
    failures.push("trace_id must be a non-empty string");
  }
  if (
    typeof value.source_final_readiness_summary_report !== "string" ||
    value.source_final_readiness_summary_report.trim() === ""
  ) {
    failures.push("source_final_readiness_summary_report must be a non-empty string");
  }
  if (
    typeof value.source_preflight_coverage_report !== "string" ||
    value.source_preflight_coverage_report.trim() === ""
  ) {
    failures.push("source_preflight_coverage_report must be a non-empty string");
  }
  if (typeof value.source_preflight_report !== "string" || value.source_preflight_report.trim() === "") {
    failures.push("source_preflight_report must be a non-empty string");
  }
  if (
    typeof value.source_release_summary_coverage_report !== "string" ||
    value.source_release_summary_coverage_report.trim() === ""
  ) {
    failures.push("source_release_summary_coverage_report must be a non-empty string");
  }
  if (
    typeof value.source_release_summary_report !== "string" ||
    value.source_release_summary_report.trim() === ""
  ) {
    failures.push("source_release_summary_report must be a non-empty string");
  }
  if (
    typeof value.source_intake_coverage_report !== "string" ||
    value.source_intake_coverage_report.trim() === ""
  ) {
    failures.push("source_intake_coverage_report must be a non-empty string");
  }
  if (typeof value.source_handoff_plan !== "string" || value.source_handoff_plan.trim() === "") {
    failures.push("source_handoff_plan must be a non-empty string");
  }
  const reportFailures = Array.isArray(value.failures) ? value.failures : [];
  if (reportFailures.length > 0) {
    failures.push(
      "model-backed dialogue intake activation final readiness summary coverage failures must be empty",
    );
  }
  if (!isRecord(value.coverage)) {
    failures.push("coverage must be a JSON object");
  } else {
    expectField(value.coverage, "final_readiness_summary_ready", true, failures, "coverage");
    expectField(value.coverage, "summary_ratio_complete", true, failures, "coverage");
    expectField(
      value.coverage,
      "intake_activation_preflight_coverage_green",
      true,
      failures,
      "coverage",
    );
    expectField(value.coverage, "intake_activation_preflight_green", true, failures, "coverage");
    expectField(value.coverage, "release_summary_coverage_green", true, failures, "coverage");
    expectField(value.coverage, "release_summary_ready", true, failures, "coverage");
    expectField(value.coverage, "intake_coverage_green", true, failures, "coverage");
    expectField(value.coverage, "handoff_ready", true, failures, "coverage");
    expectField(
      value.coverage,
      "controlled_executor_intake_context_boundary",
      true,
      failures,
      "coverage",
    );
    expectField(value.coverage, "operator_approval_false", true, failures, "coverage");
    expectField(value.coverage, "execution_started_false", true, failures, "coverage");
    expectField(value.coverage, "registry_writes_disabled", true, failures, "coverage");
    expectField(value.coverage, "sqlite_writes_disabled", true, failures, "coverage");
    expectField(value.coverage, "worker_execution_disabled", true, failures, "coverage");
    expectField(value.coverage, "model_invocation_disabled", true, failures, "coverage");
    expectField(value.coverage, "live_actions_disabled", true, failures, "coverage");
    expectField(value.coverage, "final_readiness_summary_not_approval", true, failures, "coverage");
    expectField(value.coverage, "coverage_report_not_executor", true, failures, "coverage");
    expectField(value.coverage, "coverage_ratio", 1, failures, "coverage");
  }
  if (!Array.isArray(value.blocked_actions) || value.blocked_actions.length === 0) {
    failures.push("blocked_actions must be a non-empty array");
  }
  if (typeof value.rollback_path !== "string" || value.rollback_path.trim() === "") {
    failures.push("rollback_path must be a non-empty string");
  }
  if (typeof value.next_safe_task !== "string" || value.next_safe_task.trim() === "") {
    failures.push("next_safe_task must be a non-empty string");
  }

  return failures;
}
function validateHermesModelDecisionIntakeActivationExecutionManifestProposalReport(
  value: unknown,
): string[] {
  const failures: string[] = [];
  if (!isRecord(value)) {
    return [
      "model-backed dialogue controlled executor intake activation execution-manifest proposal report must be a JSON object",
    ];
  }

  expectField(
    value,
    "schema",
    "openclaw.hermes.model_decision_intake_activation_execution_manifest_proposal_report.v1",
    failures,
  );
  expectField(value, "dry_run", true, failures);
  expectField(value, "read_only", true, failures);
  expectField(value, "status", "proposal_ready", failures);
  expectField(value, "validation_status", "pass", failures);
  expectField(value, "approval_required", true, failures);
  expectField(value, "execution_start_allowed", false, failures);
  expectField(value, "operator_approved", false, failures);
  expectField(value, "execution_started", false, failures);
  expectField(value, "registry_write_allowed", false, failures);
  expectField(value, "taskflow_registry_write", false, failures);
  expectField(value, "sqlite_write", false, failures);
  expectField(value, "worker_execution", false, failures);
  expectField(value, "model_invoked", false, failures);
  expectField(value, "live_actions_enabled", false, failures);
  if (typeof value.trace_id !== "string" || value.trace_id.trim() === "") {
    failures.push("trace_id must be a non-empty string");
  }
  if (
    typeof value.source_final_readiness_summary_coverage_report !== "string" ||
    value.source_final_readiness_summary_coverage_report.trim() === ""
  ) {
    failures.push("source_final_readiness_summary_coverage_report must be a non-empty string");
  }
  if (
    typeof value.source_final_readiness_summary_report !== "string" ||
    value.source_final_readiness_summary_report.trim() === ""
  ) {
    failures.push("source_final_readiness_summary_report must be a non-empty string");
  }
  if (
    typeof value.source_preflight_coverage_report !== "string" ||
    value.source_preflight_coverage_report.trim() === ""
  ) {
    failures.push("source_preflight_coverage_report must be a non-empty string");
  }
  if (typeof value.source_preflight_report !== "string" || value.source_preflight_report.trim() === "") {
    failures.push("source_preflight_report must be a non-empty string");
  }
  if (
    typeof value.source_release_summary_coverage_report !== "string" ||
    value.source_release_summary_coverage_report.trim() === ""
  ) {
    failures.push("source_release_summary_coverage_report must be a non-empty string");
  }
  if (
    typeof value.source_release_summary_report !== "string" ||
    value.source_release_summary_report.trim() === ""
  ) {
    failures.push("source_release_summary_report must be a non-empty string");
  }
  if (
    typeof value.source_intake_coverage_report !== "string" ||
    value.source_intake_coverage_report.trim() === ""
  ) {
    failures.push("source_intake_coverage_report must be a non-empty string");
  }
  if (typeof value.source_handoff_plan !== "string" || value.source_handoff_plan.trim() === "") {
    failures.push("source_handoff_plan must be a non-empty string");
  }
  if (!Array.isArray(value.required_validation_checklist) || value.required_validation_checklist.length === 0) {
    failures.push("required_validation_checklist must be a non-empty array");
  }
  if (typeof value.rollback_precondition !== "string" || value.rollback_precondition.trim() === "") {
    failures.push("rollback_precondition must be a non-empty string");
  }
  const reportFailures = Array.isArray(value.failures) ? value.failures : [];
  if (reportFailures.length > 0) {
    failures.push(
      "model-backed dialogue intake activation execution-manifest proposal failures must be empty",
    );
  }
  if (!isRecord(value.proposal)) {
    failures.push("proposal must be a JSON object");
  } else {
    expectField(value.proposal, "final_readiness_summary_coverage_green", true, failures, "proposal");
    expectField(value.proposal, "final_readiness_summary_ready", true, failures, "proposal");
    expectField(value.proposal, "summary_ratio_complete", true, failures, "proposal");
    expectField(
      value.proposal,
      "intake_activation_preflight_coverage_green",
      true,
      failures,
      "proposal",
    );
    expectField(value.proposal, "intake_activation_preflight_green", true, failures, "proposal");
    expectField(value.proposal, "release_summary_coverage_green", true, failures, "proposal");
    expectField(value.proposal, "release_summary_ready", true, failures, "proposal");
    expectField(value.proposal, "intake_coverage_green", true, failures, "proposal");
    expectField(value.proposal, "handoff_ready", true, failures, "proposal");
    expectField(
      value.proposal,
      "controlled_executor_intake_context_boundary",
      true,
      failures,
      "proposal",
    );
    expectField(value.proposal, "approval_required_true", true, failures, "proposal");
    expectField(value.proposal, "execution_start_allowed_false", true, failures, "proposal");
    expectField(value.proposal, "operator_approval_false", true, failures, "proposal");
    expectField(value.proposal, "execution_started_false", true, failures, "proposal");
    expectField(value.proposal, "rollback_precondition_present", true, failures, "proposal");
    expectField(
      value.proposal,
      "required_validation_checklist_complete",
      true,
      failures,
      "proposal",
    );
    expectField(value.proposal, "registry_writes_disabled", true, failures, "proposal");
    expectField(value.proposal, "sqlite_writes_disabled", true, failures, "proposal");
    expectField(value.proposal, "worker_execution_disabled", true, failures, "proposal");
    expectField(value.proposal, "model_invocation_disabled", true, failures, "proposal");
    expectField(value.proposal, "live_actions_disabled", true, failures, "proposal");
    expectField(value.proposal, "proposal_report_not_approval", true, failures, "proposal");
    expectField(value.proposal, "proposal_ratio", 1, failures, "proposal");
  }
  if (!Array.isArray(value.blocked_actions) || value.blocked_actions.length === 0) {
    failures.push("blocked_actions must be a non-empty array");
  }
  if (typeof value.rollback_path !== "string" || value.rollback_path.trim() === "") {
    failures.push("rollback_path must be a non-empty string");
  }
  if (typeof value.next_safe_task !== "string" || value.next_safe_task.trim() === "") {
    failures.push("next_safe_task must be a non-empty string");
  }

  return failures;
}
function validateHermesModelDecisionIntakeActivationExecutionManifestProposalCoverageReport(
  value: unknown,
): string[] {
  const failures: string[] = [];
  if (!isRecord(value)) {
    return [
      "model-backed dialogue controlled executor intake activation execution-manifest proposal coverage report must be a JSON object",
    ];
  }

  expectField(
    value,
    "schema",
    "openclaw.hermes.model_decision_intake_activation_execution_manifest_proposal_coverage_report.v1",
    failures,
  );
  expectField(value, "dry_run", true, failures);
  expectField(value, "read_only", true, failures);
  expectField(value, "status", "coverage_pass", failures);
  expectField(value, "validation_status", "pass", failures);
  expectField(value, "approval_required", true, failures);
  expectField(value, "execution_start_allowed", false, failures);
  expectField(value, "operator_approved", false, failures);
  expectField(value, "execution_started", false, failures);
  expectField(value, "registry_write_allowed", false, failures);
  expectField(value, "taskflow_registry_write", false, failures);
  expectField(value, "sqlite_write", false, failures);
  expectField(value, "worker_execution", false, failures);
  expectField(value, "model_invoked", false, failures);
  expectField(value, "live_actions_enabled", false, failures);
  if (typeof value.trace_id !== "string" || value.trace_id.trim() === "") {
    failures.push("trace_id must be a non-empty string");
  }
  if (
    typeof value.source_execution_manifest_proposal_report !== "string" ||
    value.source_execution_manifest_proposal_report.trim() === ""
  ) {
    failures.push("source_execution_manifest_proposal_report must be a non-empty string");
  }
  if (
    typeof value.source_final_readiness_summary_coverage_report !== "string" ||
    value.source_final_readiness_summary_coverage_report.trim() === ""
  ) {
    failures.push("source_final_readiness_summary_coverage_report must be a non-empty string");
  }
  if (
    typeof value.source_final_readiness_summary_report !== "string" ||
    value.source_final_readiness_summary_report.trim() === ""
  ) {
    failures.push("source_final_readiness_summary_report must be a non-empty string");
  }
  if (
    typeof value.source_preflight_coverage_report !== "string" ||
    value.source_preflight_coverage_report.trim() === ""
  ) {
    failures.push("source_preflight_coverage_report must be a non-empty string");
  }
  if (typeof value.source_preflight_report !== "string" || value.source_preflight_report.trim() === "") {
    failures.push("source_preflight_report must be a non-empty string");
  }
  if (
    typeof value.source_release_summary_coverage_report !== "string" ||
    value.source_release_summary_coverage_report.trim() === ""
  ) {
    failures.push("source_release_summary_coverage_report must be a non-empty string");
  }
  if (
    typeof value.source_release_summary_report !== "string" ||
    value.source_release_summary_report.trim() === ""
  ) {
    failures.push("source_release_summary_report must be a non-empty string");
  }
  if (
    typeof value.source_intake_coverage_report !== "string" ||
    value.source_intake_coverage_report.trim() === ""
  ) {
    failures.push("source_intake_coverage_report must be a non-empty string");
  }
  if (typeof value.source_handoff_plan !== "string" || value.source_handoff_plan.trim() === "") {
    failures.push("source_handoff_plan must be a non-empty string");
  }
  const reportFailures = Array.isArray(value.failures) ? value.failures : [];
  if (reportFailures.length > 0) {
    failures.push(
      "model-backed dialogue intake activation execution-manifest proposal coverage failures must be empty",
    );
  }
  if (!isRecord(value.coverage)) {
    failures.push("coverage must be a JSON object");
  } else {
    expectField(value.coverage, "proposal_ready", true, failures, "coverage");
    expectField(value.coverage, "proposal_ratio_complete", true, failures, "coverage");
    expectField(value.coverage, "approval_required_true", true, failures, "coverage");
    expectField(value.coverage, "execution_start_allowed_false", true, failures, "coverage");
    expectField(value.coverage, "operator_approval_false", true, failures, "coverage");
    expectField(value.coverage, "execution_started_false", true, failures, "coverage");
    expectField(value.coverage, "rollback_precondition_present", true, failures, "coverage");
    expectField(
      value.coverage,
      "required_validation_checklist_complete",
      true,
      failures,
      "coverage",
    );
    expectField(value.coverage, "registry_writes_disabled", true, failures, "coverage");
    expectField(value.coverage, "sqlite_writes_disabled", true, failures, "coverage");
    expectField(value.coverage, "worker_execution_disabled", true, failures, "coverage");
    expectField(value.coverage, "model_invocation_disabled", true, failures, "coverage");
    expectField(value.coverage, "live_actions_disabled", true, failures, "coverage");
    expectField(value.coverage, "coverage_report_not_approval", true, failures, "coverage");
    expectField(value.coverage, "coverage_ratio", 1, failures, "coverage");
  }
  if (!Array.isArray(value.blocked_actions) || value.blocked_actions.length === 0) {
    failures.push("blocked_actions must be a non-empty array");
  }
  if (typeof value.rollback_path !== "string" || value.rollback_path.trim() === "") {
    failures.push("rollback_path must be a non-empty string");
  }
  if (typeof value.next_safe_task !== "string" || value.next_safe_task.trim() === "") {
    failures.push("next_safe_task must be a non-empty string");
  }

  return failures;
}
function validateHermesModelDecisionIntakeActivationExecutionManifestFinalReadinessSummaryReport(
  value: unknown,
): string[] {
  const failures: string[] = [];
  if (!isRecord(value)) {
    return [
      "model-backed dialogue controlled executor intake activation execution-manifest final readiness summary report must be a JSON object",
    ];
  }

  expectField(
    value,
    "schema",
    "openclaw.hermes.model_decision_intake_activation_execution_manifest_final_readiness_summary_report.v1",
    failures,
  );
  expectField(value, "dry_run", true, failures);
  expectField(value, "read_only", true, failures);
  expectField(value, "status", "summary_ready", failures);
  expectField(value, "validation_status", "pass", failures);
  expectField(value, "approval_required", true, failures);
  expectField(value, "execution_start_allowed", false, failures);
  expectField(value, "operator_approved", false, failures);
  expectField(value, "execution_started", false, failures);
  expectField(value, "registry_write_allowed", false, failures);
  expectField(value, "taskflow_registry_write", false, failures);
  expectField(value, "sqlite_write", false, failures);
  expectField(value, "worker_execution", false, failures);
  expectField(value, "model_invoked", false, failures);
  expectField(value, "live_actions_enabled", false, failures);
  if (typeof value.trace_id !== "string" || value.trace_id.trim() === "") {
    failures.push("trace_id must be a non-empty string");
  }
  if (
    typeof value.source_execution_manifest_proposal_coverage_report !== "string" ||
    value.source_execution_manifest_proposal_coverage_report.trim() === ""
  ) {
    failures.push("source_execution_manifest_proposal_coverage_report must be a non-empty string");
  }
  if (
    typeof value.source_execution_manifest_proposal_report !== "string" ||
    value.source_execution_manifest_proposal_report.trim() === ""
  ) {
    failures.push("source_execution_manifest_proposal_report must be a non-empty string");
  }
  if (
    typeof value.source_final_readiness_summary_coverage_report !== "string" ||
    value.source_final_readiness_summary_coverage_report.trim() === ""
  ) {
    failures.push("source_final_readiness_summary_coverage_report must be a non-empty string");
  }
  if (
    typeof value.source_final_readiness_summary_report !== "string" ||
    value.source_final_readiness_summary_report.trim() === ""
  ) {
    failures.push("source_final_readiness_summary_report must be a non-empty string");
  }
  if (
    typeof value.source_preflight_coverage_report !== "string" ||
    value.source_preflight_coverage_report.trim() === ""
  ) {
    failures.push("source_preflight_coverage_report must be a non-empty string");
  }
  if (typeof value.source_preflight_report !== "string" || value.source_preflight_report.trim() === "") {
    failures.push("source_preflight_report must be a non-empty string");
  }
  if (
    typeof value.source_release_summary_coverage_report !== "string" ||
    value.source_release_summary_coverage_report.trim() === ""
  ) {
    failures.push("source_release_summary_coverage_report must be a non-empty string");
  }
  if (
    typeof value.source_release_summary_report !== "string" ||
    value.source_release_summary_report.trim() === ""
  ) {
    failures.push("source_release_summary_report must be a non-empty string");
  }
  if (
    typeof value.source_intake_coverage_report !== "string" ||
    value.source_intake_coverage_report.trim() === ""
  ) {
    failures.push("source_intake_coverage_report must be a non-empty string");
  }
  if (typeof value.source_handoff_plan !== "string" || value.source_handoff_plan.trim() === "") {
    failures.push("source_handoff_plan must be a non-empty string");
  }
  const reportFailures = Array.isArray(value.failures) ? value.failures : [];
  if (reportFailures.length > 0) {
    failures.push(
      "model-backed dialogue intake activation execution-manifest final readiness summary failures must be empty",
    );
  }
  if (!isRecord(value.summary)) {
    failures.push("summary must be a JSON object");
  } else {
    expectField(value.summary, "proposal_coverage_green", true, failures, "summary");
    expectField(value.summary, "proposal_ready", true, failures, "summary");
    expectField(value.summary, "proposal_ratio_complete", true, failures, "summary");
    expectField(value.summary, "approval_required_true", true, failures, "summary");
    expectField(value.summary, "execution_start_allowed_false", true, failures, "summary");
    expectField(value.summary, "operator_approval_false", true, failures, "summary");
    expectField(value.summary, "execution_started_false", true, failures, "summary");
    expectField(value.summary, "rollback_precondition_present", true, failures, "summary");
    expectField(value.summary, "required_validation_checklist_complete", true, failures, "summary");
    expectField(value.summary, "registry_writes_disabled", true, failures, "summary");
    expectField(value.summary, "sqlite_writes_disabled", true, failures, "summary");
    expectField(value.summary, "worker_execution_disabled", true, failures, "summary");
    expectField(value.summary, "model_invocation_disabled", true, failures, "summary");
    expectField(value.summary, "live_actions_disabled", true, failures, "summary");
    expectField(value.summary, "summary_report_not_approval", true, failures, "summary");
    expectField(value.summary, "summary_ratio", 1, failures, "summary");
  }
  if (!Array.isArray(value.blocked_actions) || value.blocked_actions.length === 0) {
    failures.push("blocked_actions must be a non-empty array");
  }
  if (typeof value.rollback_path !== "string" || value.rollback_path.trim() === "") {
    failures.push("rollback_path must be a non-empty string");
  }
  if (typeof value.next_safe_task !== "string" || value.next_safe_task.trim() === "") {
    failures.push("next_safe_task must be a non-empty string");
  }

  return failures;
}
function validateHermesModelDecisionIntakeActivationExecutionManifestFinalReadinessSummaryCoverageReport(
  value: unknown,
): string[] {
  const failures: string[] = [];
  if (!isRecord(value)) {
    return [
      "model-backed dialogue controlled executor intake activation execution-manifest final readiness summary coverage report must be a JSON object",
    ];
  }

  expectField(
    value,
    "schema",
    "openclaw.hermes.model_decision_intake_activation_execution_manifest_final_readiness_summary_coverage_report.v1",
    failures,
  );
  expectField(value, "dry_run", true, failures);
  expectField(value, "read_only", true, failures);
  expectField(value, "status", "coverage_pass", failures);
  expectField(value, "validation_status", "pass", failures);
  expectField(value, "approval_required", true, failures);
  expectField(value, "execution_start_allowed", false, failures);
  expectField(value, "operator_approved", false, failures);
  expectField(value, "execution_started", false, failures);
  expectField(value, "registry_write_allowed", false, failures);
  expectField(value, "taskflow_registry_write", false, failures);
  expectField(value, "sqlite_write", false, failures);
  expectField(value, "worker_execution", false, failures);
  expectField(value, "model_invoked", false, failures);
  expectField(value, "live_actions_enabled", false, failures);
  if (typeof value.trace_id !== "string" || value.trace_id.trim() === "") {
    failures.push("trace_id must be a non-empty string");
  }
  if (
    typeof value.source_execution_manifest_final_readiness_summary_report !== "string" ||
    value.source_execution_manifest_final_readiness_summary_report.trim() === ""
  ) {
    failures.push(
      "source_execution_manifest_final_readiness_summary_report must be a non-empty string",
    );
  }
  if (
    typeof value.source_execution_manifest_proposal_coverage_report !== "string" ||
    value.source_execution_manifest_proposal_coverage_report.trim() === ""
  ) {
    failures.push("source_execution_manifest_proposal_coverage_report must be a non-empty string");
  }
  if (
    typeof value.source_execution_manifest_proposal_report !== "string" ||
    value.source_execution_manifest_proposal_report.trim() === ""
  ) {
    failures.push("source_execution_manifest_proposal_report must be a non-empty string");
  }
  if (
    typeof value.source_final_readiness_summary_coverage_report !== "string" ||
    value.source_final_readiness_summary_coverage_report.trim() === ""
  ) {
    failures.push("source_final_readiness_summary_coverage_report must be a non-empty string");
  }
  if (
    typeof value.source_final_readiness_summary_report !== "string" ||
    value.source_final_readiness_summary_report.trim() === ""
  ) {
    failures.push("source_final_readiness_summary_report must be a non-empty string");
  }
  if (
    typeof value.source_preflight_coverage_report !== "string" ||
    value.source_preflight_coverage_report.trim() === ""
  ) {
    failures.push("source_preflight_coverage_report must be a non-empty string");
  }
  if (typeof value.source_preflight_report !== "string" || value.source_preflight_report.trim() === "") {
    failures.push("source_preflight_report must be a non-empty string");
  }
  if (
    typeof value.source_release_summary_coverage_report !== "string" ||
    value.source_release_summary_coverage_report.trim() === ""
  ) {
    failures.push("source_release_summary_coverage_report must be a non-empty string");
  }
  if (
    typeof value.source_release_summary_report !== "string" ||
    value.source_release_summary_report.trim() === ""
  ) {
    failures.push("source_release_summary_report must be a non-empty string");
  }
  if (
    typeof value.source_intake_coverage_report !== "string" ||
    value.source_intake_coverage_report.trim() === ""
  ) {
    failures.push("source_intake_coverage_report must be a non-empty string");
  }
  if (typeof value.source_handoff_plan !== "string" || value.source_handoff_plan.trim() === "") {
    failures.push("source_handoff_plan must be a non-empty string");
  }
  const reportFailures = Array.isArray(value.failures) ? value.failures : [];
  if (reportFailures.length > 0) {
    failures.push(
      "model-backed dialogue intake activation execution-manifest final readiness summary coverage failures must be empty",
    );
  }
  if (!isRecord(value.coverage)) {
    failures.push("coverage must be a JSON object");
  } else {
    expectField(value.coverage, "final_readiness_summary_ready", true, failures, "coverage");
    expectField(value.coverage, "summary_ratio_complete", true, failures, "coverage");
    expectField(value.coverage, "proposal_coverage_green", true, failures, "coverage");
    expectField(value.coverage, "proposal_ready", true, failures, "coverage");
    expectField(value.coverage, "proposal_ratio_complete", true, failures, "coverage");
    expectField(value.coverage, "approval_required_true", true, failures, "coverage");
    expectField(value.coverage, "execution_start_allowed_false", true, failures, "coverage");
    expectField(value.coverage, "operator_approval_false", true, failures, "coverage");
    expectField(value.coverage, "execution_started_false", true, failures, "coverage");
    expectField(value.coverage, "rollback_precondition_present", true, failures, "coverage");
    expectField(
      value.coverage,
      "required_validation_checklist_complete",
      true,
      failures,
      "coverage",
    );
    expectField(value.coverage, "registry_writes_disabled", true, failures, "coverage");
    expectField(value.coverage, "sqlite_writes_disabled", true, failures, "coverage");
    expectField(value.coverage, "worker_execution_disabled", true, failures, "coverage");
    expectField(value.coverage, "model_invocation_disabled", true, failures, "coverage");
    expectField(value.coverage, "live_actions_disabled", true, failures, "coverage");
    expectField(value.coverage, "coverage_report_not_approval", true, failures, "coverage");
    expectField(value.coverage, "coverage_ratio", 1, failures, "coverage");
  }
  if (!Array.isArray(value.blocked_actions) || value.blocked_actions.length === 0) {
    failures.push("blocked_actions must be a non-empty array");
  }
  if (typeof value.rollback_path !== "string" || value.rollback_path.trim() === "") {
    failures.push("rollback_path must be a non-empty string");
  }
  if (typeof value.next_safe_task !== "string" || value.next_safe_task.trim() === "") {
    failures.push("next_safe_task must be a non-empty string");
  }

  return failures;
}
function validateHermesModelDecisionIntakeActivationExecutionManifestNextSafeTaskDecisionReport(
  value: unknown,
): string[] {
  const failures: string[] = [];
  if (!isRecord(value)) {
    return [
      "model-backed dialogue controlled executor intake activation execution-manifest next-safe-task decision report must be a JSON object",
    ];
  }

  expectField(
    value,
    "schema",
    "openclaw.hermes.model_decision_intake_activation_execution_manifest_next_safe_task_decision_report.v1",
    failures,
  );
  expectField(value, "dry_run", true, failures);
  expectField(value, "read_only", true, failures);
  expectField(value, "status", "decision_ready", failures);
  expectField(value, "validation_status", "pass", failures);
  expectField(value, "approval_required", true, failures);
  expectField(value, "execution_start_allowed", false, failures);
  expectField(value, "operator_approved", false, failures);
  expectField(value, "execution_started", false, failures);
  expectField(value, "registry_write_allowed", false, failures);
  expectField(value, "taskflow_registry_write", false, failures);
  expectField(value, "sqlite_write", false, failures);
  expectField(value, "worker_execution", false, failures);
  expectField(value, "model_invoked", false, failures);
  expectField(value, "live_actions_enabled", false, failures);

  if (typeof value.trace_id !== "string" || value.trace_id.trim() === "") {
    failures.push("trace_id must be a non-empty string");
  }
  const sourceKeys = [
    "source_execution_manifest_final_readiness_summary_coverage_report",
    "source_execution_manifest_final_readiness_summary_report",
    "source_execution_manifest_proposal_coverage_report",
    "source_execution_manifest_proposal_report",
    "source_final_readiness_summary_coverage_report",
    "source_final_readiness_summary_report",
    "source_preflight_coverage_report",
    "source_preflight_report",
    "source_release_summary_coverage_report",
    "source_release_summary_report",
    "source_intake_coverage_report",
    "source_handoff_plan",
  ];
  for (const key of sourceKeys) {
    const v = value[key];
    if (typeof v !== "string" || v.trim() === "") {
      failures.push(key + " must be a non-empty string");
    }
  }

  const reportFailures = Array.isArray(value.failures) ? value.failures : [];
  if (reportFailures.length > 0) {
    failures.push(
      "model-backed dialogue intake activation execution-manifest next-safe-task decision failures must be empty",
    );
  }

  if (!isRecord(value.decision)) {
    failures.push("decision must be a JSON object");
  } else {
    if (typeof value.decision.next_task !== "string" || value.decision.next_task.trim() === "") {
      failures.push("decision.next_task must be a non-empty string");
    }
    if (typeof value.decision.reason !== "string" || value.decision.reason.trim() === "") {
      failures.push("decision.reason must be a non-empty string");
    }
    if (!["low", "medium", "high"].includes(String(value.decision.risk_level))) {
      failures.push("decision.risk_level must be low, medium, or high");
    }
    if (
      !Array.isArray(value.decision.required_preconditions) ||
      value.decision.required_preconditions.length === 0
    ) {
      failures.push("decision.required_preconditions must be a non-empty array");
    }
    expectField(value.decision, "boundary_enforced", true, failures, "decision");
  }

  if (!Array.isArray(value.blocked_actions) || value.blocked_actions.length === 0) {
    failures.push("blocked_actions must be a non-empty array");
  }
  if (typeof value.rollback_path !== "string" || value.rollback_path.trim() === "") {
    failures.push("rollback_path must be a non-empty string");
  }
  if (typeof value.next_safe_task !== "string" || value.next_safe_task.trim() === "") {
    failures.push("next_safe_task must be a non-empty string");
  }

  return failures;
}

function validateHermesModelDecisionIntakeActivationExecutionManifestNextSafeTaskDecisionCoverageReport(
  value: unknown,
): string[] {
  const failures: string[] = [];
  if (!isRecord(value)) {
    return [
      "model-backed dialogue controlled executor intake activation execution-manifest next-safe-task decision coverage report must be a JSON object",
    ];
  }

  expectField(
    value,
    "schema",
    "openclaw.hermes.model_decision_intake_activation_execution_manifest_next_safe_task_decision_coverage_report.v1",
    failures,
  );
  expectField(value, "dry_run", true, failures);
  expectField(value, "read_only", true, failures);
  expectField(value, "status", "coverage_pass", failures);
  expectField(value, "validation_status", "pass", failures);
  expectField(value, "approval_required", true, failures);
  expectField(value, "execution_start_allowed", false, failures);
  expectField(value, "operator_approved", false, failures);
  expectField(value, "execution_started", false, failures);
  expectField(value, "registry_write_allowed", false, failures);
  expectField(value, "taskflow_registry_write", false, failures);
  expectField(value, "sqlite_write", false, failures);
  expectField(value, "worker_execution", false, failures);
  expectField(value, "model_invoked", false, failures);
  expectField(value, "live_actions_enabled", false, failures);

  if (typeof value.trace_id !== "string" || value.trace_id.trim() === "") {
    failures.push("trace_id must be a non-empty string");
  }

  const sourceKeys = [
    "source_execution_manifest_next_safe_task_decision_report",
    "source_execution_manifest_final_readiness_summary_coverage_report",
    "source_execution_manifest_final_readiness_summary_report",
    "source_execution_manifest_proposal_coverage_report",
    "source_execution_manifest_proposal_report",
    "source_final_readiness_summary_coverage_report",
    "source_final_readiness_summary_report",
    "source_preflight_coverage_report",
    "source_preflight_report",
    "source_release_summary_coverage_report",
    "source_release_summary_report",
    "source_intake_coverage_report",
    "source_handoff_plan",
  ];
  for (const key of sourceKeys) {
    const v = value[key];
    if (typeof v !== "string" || v.trim() === "") {
      failures.push(key + " must be a non-empty string");
    }
  }

  const reportFailures = Array.isArray(value.failures) ? value.failures : [];
  if (reportFailures.length > 0) {
    failures.push(
      "model-backed dialogue intake activation execution-manifest next-safe-task decision coverage failures must be empty",
    );
  }

  if (!isRecord(value.coverage)) {
    failures.push("coverage must be a JSON object");
  } else {
    expectField(value.coverage, "decision_ready", true, failures, "coverage");
    expectField(value.coverage, "risk_level_low", true, failures, "coverage");
    expectField(value.coverage, "boundary_enforced", true, failures, "coverage");
    expectField(value.coverage, "approval_required_true", true, failures, "coverage");
    expectField(value.coverage, "execution_start_allowed_false", true, failures, "coverage");
    expectField(value.coverage, "operator_approval_false", true, failures, "coverage");
    expectField(value.coverage, "execution_started_false", true, failures, "coverage");
    expectField(value.coverage, "registry_writes_disabled", true, failures, "coverage");
    expectField(value.coverage, "sqlite_writes_disabled", true, failures, "coverage");
    expectField(value.coverage, "worker_execution_disabled", true, failures, "coverage");
    expectField(value.coverage, "model_invocation_disabled", true, failures, "coverage");
    expectField(value.coverage, "live_actions_disabled", true, failures, "coverage");
    expectField(value.coverage, "required_preconditions_present", true, failures, "coverage");
    expectField(value.coverage, "coverage_report_not_approval", true, failures, "coverage");
    expectField(value.coverage, "coverage_ratio", 1, failures, "coverage");
  }

  if (!Array.isArray(value.blocked_actions) || value.blocked_actions.length === 0) {
    failures.push("blocked_actions must be a non-empty array");
  }
  if (typeof value.rollback_path !== "string" || value.rollback_path.trim() === "") {
    failures.push("rollback_path must be a non-empty string");
  }
  if (typeof value.next_safe_task !== "string" || value.next_safe_task.trim() === "") {
    failures.push("next_safe_task must be a non-empty string");
  }

  return failures;
}

function validateHermesModelDecisionIntakeActivationExecutionManifestActivationReadinessDeltaReport(
  value: unknown,
): string[] {
  const failures: string[] = [];
  if (!isRecord(value)) {
    return [
      "model-backed dialogue controlled executor intake activation execution-manifest activation-readiness delta report must be a JSON object",
    ];
  }

  expectField(
    value,
    "schema",
    "openclaw.hermes.model_decision_intake_activation_execution_manifest_activation_readiness_delta_report.v1",
    failures,
  );
  expectField(value, "dry_run", true, failures);
  expectField(value, "read_only", true, failures);
  expectField(value, "status", "delta_ready", failures);
  expectField(value, "validation_status", "pass", failures);
  expectField(value, "approval_required", true, failures);
  expectField(value, "execution_start_allowed", false, failures);
  expectField(value, "operator_approved", false, failures);
  expectField(value, "execution_started", false, failures);
  expectField(value, "registry_write_allowed", false, failures);
  expectField(value, "taskflow_registry_write", false, failures);
  expectField(value, "sqlite_write", false, failures);
  expectField(value, "worker_execution", false, failures);
  expectField(value, "model_invoked", false, failures);
  expectField(value, "live_actions_enabled", false, failures);

  if (typeof value.trace_id !== "string" || value.trace_id.trim() === "") {
    failures.push("trace_id must be a non-empty string");
  }

  const sourceKeys = [
    "source_execution_manifest_next_safe_task_decision_coverage_report",
    "source_execution_manifest_next_safe_task_decision_report",
    "source_execution_manifest_final_readiness_summary_coverage_report",
    "source_execution_manifest_final_readiness_summary_report",
    "source_execution_manifest_proposal_coverage_report",
    "source_execution_manifest_proposal_report",
    "source_final_readiness_summary_coverage_report",
    "source_final_readiness_summary_report",
    "source_preflight_coverage_report",
    "source_preflight_report",
    "source_release_summary_coverage_report",
    "source_release_summary_report",
    "source_intake_coverage_report",
    "source_handoff_plan",
  ];
  for (const key of sourceKeys) {
    const v = value[key];
    if (typeof v !== "string" || v.trim() === "") {
      failures.push(key + " must be a non-empty string");
    }
  }

  const reportFailures = Array.isArray(value.failures) ? value.failures : [];
  if (reportFailures.length > 0) {
    failures.push(
      "model-backed dialogue intake activation execution-manifest activation-readiness delta failures must be empty",
    );
  }

  if (!isRecord(value.delta)) {
    failures.push("delta must be a JSON object");
  } else {
    expectField(value.delta, "decision_coverage_green", true, failures, "delta");
    expectField(value.delta, "decision_ready", true, failures, "delta");
    expectField(value.delta, "risk_level_low", true, failures, "delta");
    expectField(value.delta, "boundary_enforced", true, failures, "delta");
    expectField(value.delta, "approval_required_true", true, failures, "delta");
    expectField(value.delta, "execution_start_allowed_false", true, failures, "delta");
    expectField(value.delta, "operator_approval_false", true, failures, "delta");
    expectField(value.delta, "execution_started_false", true, failures, "delta");
    expectField(value.delta, "registry_writes_disabled", true, failures, "delta");
    expectField(value.delta, "sqlite_writes_disabled", true, failures, "delta");
    expectField(value.delta, "worker_execution_disabled", true, failures, "delta");
    expectField(value.delta, "model_invocation_disabled", true, failures, "delta");
    expectField(value.delta, "live_actions_disabled", true, failures, "delta");
    expectField(value.delta, "delta_report_not_approval", true, failures, "delta");
    expectField(value.delta, "delta_ratio", 1, failures, "delta");
  }

  if (!Array.isArray(value.blocked_actions) || value.blocked_actions.length === 0) {
    failures.push("blocked_actions must be a non-empty array");
  }
  if (typeof value.rollback_path !== "string" || value.rollback_path.trim() === "") {
    failures.push("rollback_path must be a non-empty string");
  }
  if (typeof value.next_safe_task !== "string" || value.next_safe_task.trim() === "") {
    failures.push("next_safe_task must be a non-empty string");
  }

  return failures;
}

function expectField(
  value: Record<string, unknown>,
  key: string,
  expected: unknown,
  failures: string[],
  path = "",
): void {
  const actual = value[key];
  if (actual !== expected) {
    failures.push(`${path ? path + "." : ""}${key} must equal ${String(expected)}`);
  }
}

function resolveInsideRepo(repoRoot: string, maybeRelativePath: string): string {
  const repo = resolve(repoRoot);
  const candidate = resolve(repo, maybeRelativePath);
  if (candidate !== repo && !candidate.startsWith(repo + "\\")) {
    throw new Error(`Output path must stay inside repo: ${maybeRelativePath}`);
  }
  return candidate;
}





























