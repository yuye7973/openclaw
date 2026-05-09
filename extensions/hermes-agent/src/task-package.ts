import { createHash } from "node:crypto";

export type HermesRiskClass =
  | "read_only"
  | "local_write"
  | "external_write"
  | "trading_payment"
  | "credential";

export type HermesTaskPackage = {
  task_name: string;
  task_goal: string;
  execution_scope: string[];
  files_to_create_or_modify: string[];
  concrete_steps: string[];
  forbidden_actions: string[];
  validation_commands: string[];
  success_criteria: string[];
  report_format: string[];
  assumptions: string[];
  risk_class: HermesRiskClass;
  approval_required: boolean;
};

export type HermesAgentMessageEnvelope = {
  protocol: "openclaw.hermes.agent_message.v1";
  trace_id: string;
  source_agent: "hermes-agent";
  target_agent: string;
  intent: "task_package_review";
  approval_required: boolean;
  task_package: HermesTaskPackage;
};

export type HermesApprovalRequest = {
  approval_id: string;
  trace_id: string;
  status: "pending";
  requester: "hermes-agent";
  required_approver: "human";
  reason: string;
  risk_class: Exclude<HermesRiskClass, "read_only" | "local_write">;
  requested_action: string;
  expires_at: string;
  constraints: string[];
  rollback: string[];
};

export type HermesAuditRecord = {
  trace_id: string;
  created_at: string;
  dry_run: true;
  risk_class: HermesRiskClass;
  approval_required: boolean;
  request_digest: string;
  decision: "package_generated" | "approval_required";
  envelope: HermesAgentMessageEnvelope;
  approval_request?: HermesApprovalRequest;
};

export type HermesPlan = {
  task_package: HermesTaskPackage;
  envelope: HermesAgentMessageEnvelope;
  audit: HermesAuditRecord;
  approval_request?: HermesApprovalRequest;
};

const RISK_KEYWORDS: Record<HermesRiskClass, readonly string[]> = {
  credential: [
    "api key",
    "credential",
    "password",
    "secret",
    "token",
    "key",
    "憑證",
    "密碼",
    "密鑰",
  ],
  trading_payment: [
    "buy",
    "order",
    "payment",
    "sell",
    "trade",
    "withdraw",
    "下單",
    "付款",
    "交易",
    "提領",
  ],
  external_write: [
    "deploy",
    "publish",
    "send email",
    "post to",
    "webhook",
    "發佈",
    "部署",
    "傳送",
  ],
  local_write: [
    "add",
    "create",
    "edit",
    "fix",
    "implement",
    "patch",
    "write",
    "加入",
    "修改",
    "建立",
    "修正",
  ],
  read_only: [],
};

export function buildHermesPlan(request: string, now = new Date()): HermesPlan {
  const normalizedRequest = normalizeRequest(request);
  if (!normalizedRequest) {
    throw new Error("Hermes request is required");
  }

  const traceId = buildTraceId(normalizedRequest, now);
  const riskClass = classifyHermesRisk(normalizedRequest);
  const approvalRequired = isApprovalRequired(riskClass);
  const taskPackage = buildTaskPackage(normalizedRequest, riskClass, approvalRequired);
  const approvalRequest = approvalRequired
    ? buildApprovalRequest({
        request: normalizedRequest,
        traceId,
        riskClass,
        now,
      })
    : undefined;
  const envelope: HermesAgentMessageEnvelope = {
    protocol: "openclaw.hermes.agent_message.v1",
    trace_id: traceId,
    source_agent: "hermes-agent",
    target_agent: approvalRequired ? "risk-reviewer" : "openclaw-runtime",
    intent: "task_package_review",
    approval_required: approvalRequired,
    task_package: taskPackage,
  };
  const audit: HermesAuditRecord = {
    trace_id: traceId,
    created_at: now.toISOString(),
    dry_run: true,
    risk_class: riskClass,
    approval_required: approvalRequired,
    request_digest: digest(normalizedRequest),
    decision: approvalRequired ? "approval_required" : "package_generated",
    envelope,
    ...(approvalRequest ? { approval_request: approvalRequest } : {}),
  };

  return {
    task_package: taskPackage,
    envelope,
    audit,
    ...(approvalRequest ? { approval_request: approvalRequest } : {}),
  };
}

export function classifyHermesRisk(request: string): HermesRiskClass {
  const normalized = request.toLowerCase();
  for (const riskClass of ["credential", "trading_payment", "external_write", "local_write"] as const) {
    if (RISK_KEYWORDS[riskClass].some((keyword) => normalized.includes(keyword.toLowerCase()))) {
      return riskClass;
    }
  }
  return "read_only";
}

export function isApprovalRequired(
  riskClass: HermesRiskClass,
): riskClass is Exclude<HermesRiskClass, "read_only" | "local_write"> {
  return riskClass !== "read_only" && riskClass !== "local_write";
}

function buildTaskPackage(
  request: string,
  riskClass: HermesRiskClass,
  approvalRequired: boolean,
): HermesTaskPackage {
  return {
    task_name: `Hermes task package: ${request.slice(0, 80)}`,
    task_goal: request,
    execution_scope: [
      "Stay inside the selected OpenClaw workspace.",
      "Prefer the smallest safe change that can be validated.",
      "Produce a dry-run package before any execution.",
    ],
    files_to_create_or_modify: [
      "To be resolved by the receiving OpenClaw worker after scoped inspection.",
    ],
    concrete_steps: [
      "Classify the request and confirm the risk boundary.",
      "Inspect only directly relevant files and docs.",
      "Create the smallest bounded change or no-op report.",
      "Run targeted validation for the touched surface.",
      "Return changed files, validation results, risk, rollback path, and next safe task.",
    ],
    forbidden_actions: buildForbiddenActions(approvalRequired),
    validation_commands: [
      "git diff --check",
      "pnpm test <targeted-file-or-filter>",
      "pnpm check:changed",
    ],
    success_criteria: [
      "No parallel OpenClaw project is created.",
      "No real external write, trading action, credential write, or deployment is performed.",
      "The task package can be audited by trace_id.",
      approvalRequired
        ? "Execution remains blocked until the approval request is accepted."
        : "The package is safe for local dry-run review.",
    ],
    report_format: [
      "Core result",
      "Files changed",
      "Validation result",
      "Remaining blockers",
      "Risk",
      "Rollback path",
      "Next safe task",
    ],
    assumptions: [
      "OpenClaw repo root has already been verified.",
      "Missing details are resolved through local inspection, not external side effects.",
    ],
    risk_class: riskClass,
    approval_required: approvalRequired,
  };
}

function buildForbiddenActions(approvalRequired: boolean): string[] {
  const forbidden = [
    "Do not create a second OpenClaw project.",
    "Do not use global Codex skills as the formal runtime source.",
    "Do not run real trading, payment, credential, deployment, or external-write actions.",
    "Do not modify unrelated active automation trees.",
  ];
  if (approvalRequired) {
    forbidden.push("Do not execute the requested high-risk action before human approval.");
  }
  return forbidden;
}

function buildApprovalRequest(params: {
  request: string;
  traceId: string;
  riskClass: HermesRiskClass;
  now: Date;
}): HermesApprovalRequest {
  if (!isApprovalRequired(params.riskClass)) {
    throw new Error(`Approval request is not required for risk class ${params.riskClass}`);
  }
  const riskClass = params.riskClass;
  const expiresAt = new Date(params.now.getTime() + 24 * 60 * 60 * 1000).toISOString();
  return {
    approval_id: `${params.traceId}:approval`,
    trace_id: params.traceId,
    status: "pending",
    requester: "hermes-agent",
    required_approver: "human",
    reason: `Hermes classified this request as ${riskClass}.`,
    risk_class: riskClass,
    requested_action: params.request,
    expires_at: expiresAt,
    constraints: [
      "Approval unlocks only the described bounded action.",
      "Execution must still run through OpenClaw validation and audit reporting.",
      "Secrets and live funds must not be printed or stored in reports.",
    ],
    rollback: [
      "Discard the generated task package if approval is denied.",
      "Revert only the files listed in the final changed-files report.",
    ],
  };
}

function normalizeRequest(request: string): string {
  return request.trim().replace(/\s+/g, " ");
}

function buildTraceId(request: string, now: Date): string {
  const timestamp = now.toISOString().replace(/[-:T.Z]/g, "").slice(0, 14);
  return `hermes-${timestamp}-${digest(request)}`;
}

function digest(value: string): string {
  return createHash("sha256").update(value, "utf8").digest("hex").slice(0, 8);
}
