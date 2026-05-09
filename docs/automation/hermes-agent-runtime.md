---
summary: "Hermes Agent Runtime for guarded task packages, AI-to-AI envelopes, audit records, and approval requests"
read_when:
  - Converting Hermes prompts into OpenClaw task packages
  - Building a safe AI-to-AI bridge inside OpenClaw
  - Reviewing approval gates for high-risk automation
title: "Hermes Agent Runtime"
---

Hermes Agent Runtime turns a user request into an OpenClaw-owned task package
before any execution. It is a bundled plugin, not a second OpenClaw project.
The runtime creates four reviewable artifacts:

- `task_package`: bounded execution scope, steps, validation commands, success criteria, risk, and rollback expectations.
- `envelope`: AI-to-AI message wrapper for routing the package to an OpenClaw worker or reviewer.
- `audit`: dry-run audit record keyed by `trace_id`.
- `approval_request`: optional high-risk gate for external writes, trading or payment actions, and credential-sensitive work.

It can also call the configured OpenClaw model provider through `hermes decide`.
That path returns a dry-run `model_decision` on top of the same deterministic
task package and approval boundary.

Hermes is an orchestration layer only. It does not own BrokerDesk quote reading,
market-data ingestion, or quote freshness validation. Those surfaces belong to
the brokerdesk quote reader and its validation commands.

## Why it exists

Hermes is the bridge between free-form planning prompts and OpenClaw's controlled
automation model. It keeps planning inside native plugin, skill, CLI, slash
command, audit, and approval surfaces so the agent does not invent a parallel
runtime.

## Safety contract

Hermes is dry-run by default.

- It does not create a second OpenClaw project.
- It does not run real trading, payment, credential, deployment, or external-write actions.
- It does not use global Codex skills as the formal runtime source.
- It uses OpenClaw's configured model/provider runtime when `hermes decide` is requested.
- It writes local audit or approval files only when the operator passes explicit write flags.
- High-risk requests produce a pending approval request instead of execution.

## CLI

Create a task package:

```bash
openclaw hermes plan "create a guarded OpenClaw module"
```

Create a dry-run role deployment plan:

```bash
openclaw hermes deploy-plan "connect Hermes and OpenClaw as a controlled self-improvement loop"
openclaw hermes deploy-plan --taskflow-skeleton "connect Hermes and OpenClaw as a controlled self-improvement loop"
openclaw hermes deploy-plan --write-taskflow-skeleton "connect Hermes and OpenClaw as a controlled self-improvement loop"
openclaw hermes validate-taskflow-skeleton reports/hermes-agent/state/<flow_id>-taskflow-skeleton.json
openclaw hermes stage-taskflow-registry reports/hermes-agent/state/<flow_id>-taskflow-skeleton.json
openclaw hermes gate-taskflow-registry reports/hermes-agent/state/<flow_id>-taskflow-registry-staging.json
openclaw hermes write-taskflow-registry-noop reports/hermes-agent/state/<flow_id>-taskflow-registry-promotion-gate.json
openclaw hermes preview-taskflow-registry-diff reports/hermes-agent/state/<flow_id>-taskflow-registry-noop-write.json
openclaw hermes request-taskflow-registry-approval reports/hermes-agent/state/<flow_id>-taskflow-registry-preview-diff.json
openclaw hermes validate-taskflow-registry-approval reports/hermes-agent/state/<flow_id>-taskflow-registry-operator-approval.json
openclaw tasks flow list --json > reports/hermes-agent/state/<flow_id>-taskflow-list.json
openclaw hermes snapshot-taskflow-registry-dry-run reports/hermes-agent/state/<flow_id>-taskflow-list.json --flow-id <flow_id>
openclaw hermes read-taskflow-registry-dry-run reports/hermes-agent/state/<flow_id>-taskflow-registry-approval-validation.json --registry-snapshot reports/hermes-agent/state/<flow_id>-taskflow-registry-snapshot.json
openclaw hermes review-taskflow-registry-write reports/hermes-agent/state/<flow_id>-taskflow-registry-read-adapter.json
openclaw hermes apply-taskflow-registry-noop reports/hermes-agent/state/<flow_id>-taskflow-registry-writer-review.json
openclaw hermes validate-taskflow-registry-approval-token reports/hermes-agent/state/<flow_id>-taskflow-registry-noop-writer-apply.json --token approve:<flow_id>:create:taskflow-registry
openclaw hermes write-taskflow-registry-writer-contract-fixture reports/hermes-agent/state/<flow_id>-taskflow-registry-approval-token-validation.json
openclaw hermes report-taskflow-registry-contract-coverage reports/hermes-agent/state/<flow_id>-taskflow-registry-writer-contract-fixture.json
openclaw hermes preflight-taskflow-registry-promotion reports/hermes-agent/state/<flow_id>-taskflow-registry-contract-coverage-report.json
openclaw hermes write-taskflow-registry-rollback-contract-fixture reports/hermes-agent/state/<flow_id>-taskflow-registry-promotion-preflight-report.json
openclaw hermes report-taskflow-registry-rollback-contract-coverage reports/hermes-agent/state/<flow_id>-taskflow-registry-rollback-contract-fixture.json
openclaw hermes summarize-taskflow-registry-final-writer-readiness reports/hermes-agent/state/<flow_id>-taskflow-registry-rollback-contract-coverage-report.json
openclaw hermes plan-taskflow-registry-real-writer-implementation reports/hermes-agent/state/<flow_id>-taskflow-registry-final-writer-readiness-summary.json
openclaw hermes report-taskflow-registry-real-writer-implementation-plan-coverage reports/hermes-agent/state/<flow_id>-taskflow-registry-real-writer-implementation-plan.json
openclaw hermes write-taskflow-registry-real-writer-api-contract-fixture reports/hermes-agent/state/<flow_id>-taskflow-registry-real-writer-implementation-plan-coverage-report.json
openclaw hermes report-taskflow-registry-real-writer-api-contract-coverage reports/hermes-agent/state/<flow_id>-taskflow-registry-real-writer-api-contract-fixture.json
openclaw hermes preflight-taskflow-registry-real-writer-promotion reports/hermes-agent/state/<flow_id>-taskflow-registry-real-writer-api-contract-coverage-report.json
openclaw hermes report-taskflow-registry-real-writer-promotion-preflight-coverage reports/hermes-agent/state/<flow_id>-taskflow-registry-real-writer-promotion-preflight-report.json
openclaw hermes report-taskflow-registry-real-writer-final-readiness-lock reports/hermes-agent/state/<flow_id>-taskflow-registry-real-writer-promotion-preflight-coverage-report.json
openclaw hermes write-taskflow-registry-real-writer-activation-approval-token-fixture reports/hermes-agent/state/<flow_id>-taskflow-registry-real-writer-final-readiness-lock-report.json
openclaw hermes report-taskflow-registry-real-writer-activation-approval-token-coverage reports/hermes-agent/state/<flow_id>-taskflow-registry-real-writer-activation-approval-token-fixture.json
openclaw hermes preflight-taskflow-registry-real-writer-activation-approval reports/hermes-agent/state/<flow_id>-taskflow-registry-real-writer-activation-approval-token-coverage-report.json
openclaw hermes report-taskflow-registry-real-writer-activation-approval-preflight-coverage reports/hermes-agent/state/<flow_id>-taskflow-registry-real-writer-activation-approval-preflight-report.json
openclaw hermes report-taskflow-registry-real-writer-activation-final-readiness-lock reports/hermes-agent/state/<flow_id>-taskflow-registry-real-writer-activation-approval-preflight-coverage-report.json
openclaw hermes report-taskflow-registry-real-writer-activation-final-readiness-lock-coverage reports/hermes-agent/state/<flow_id>-taskflow-registry-real-writer-activation-final-readiness-lock-report.json
openclaw hermes report-taskflow-registry-real-writer-activation-release-checklist reports/hermes-agent/state/<flow_id>-taskflow-registry-real-writer-activation-final-readiness-lock-coverage-report.json
openclaw hermes report-taskflow-registry-real-writer-activation-release-checklist-coverage reports/hermes-agent/state/<flow_id>-taskflow-registry-real-writer-activation-release-checklist-report.json
openclaw hermes write-taskflow-registry-real-writer-activation-operator-handoff-packet reports/hermes-agent/state/<flow_id>-taskflow-registry-real-writer-activation-release-checklist-coverage-report.json
openclaw hermes report-taskflow-registry-real-writer-activation-operator-handoff-packet-coverage reports/hermes-agent/state/<flow_id>-taskflow-registry-real-writer-activation-operator-handoff-packet.json
openclaw hermes report-taskflow-registry-real-writer-activation-final-safety-summary reports/hermes-agent/state/<flow_id>-taskflow-registry-real-writer-activation-operator-handoff-packet-coverage-report.json
openclaw hermes report-taskflow-registry-real-writer-activation-final-safety-summary-coverage reports/hermes-agent/state/<flow_id>-taskflow-registry-real-writer-activation-final-safety-summary.json
openclaw hermes write-taskflow-registry-next-safe-task-proposer-fixture reports/hermes-agent/state/<flow_id>-taskflow-registry-real-writer-activation-final-safety-summary-coverage-report.json
openclaw hermes report-taskflow-registry-next-safe-task-proposer-fixture-coverage reports/hermes-agent/state/<flow_id>-taskflow-registry-next-safe-task-proposer-fixture.json
openclaw hermes write-taskflow-registry-task-dialoguer-fixture reports/hermes-agent/state/<flow_id>-taskflow-registry-next-safe-task-proposer-fixture-coverage-report.json
openclaw hermes report-taskflow-registry-task-dialoguer-fixture-coverage reports/hermes-agent/state/<flow_id>-taskflow-registry-task-dialoguer-fixture.json
openclaw hermes write-taskflow-registry-task-dialoguer-handoff-package reports/hermes-agent/state/<flow_id>-taskflow-registry-task-dialoguer-fixture-coverage-report.json
openclaw hermes write-taskflow-registry-task-dialoguer-reasoning-policy reports/hermes-agent/state/<flow_id>-taskflow-registry-task-dialoguer-handoff-package.json
openclaw hermes report-taskflow-registry-task-dialoguer-reasoning-policy-coverage reports/hermes-agent/state/<flow_id>-taskflow-registry-task-dialoguer-reasoning-policy.json
openclaw hermes report-taskflow-registry-task-dialoguer-status-summary reports/hermes-agent/state/<flow_id>-taskflow-registry-task-dialoguer-reasoning-policy-coverage-report.json
openclaw hermes report-taskflow-registry-task-dialoguer-status-summary-coverage reports/hermes-agent/state/<flow_id>-taskflow-registry-task-dialoguer-status-summary-report.json
openclaw hermes run-taskflow-registry-controlled-dialogue-executor-dry-run reports/hermes-agent/state/<flow_id>-taskflow-registry-task-dialoguer-status-summary-coverage-report.json
openclaw hermes write-taskflow-registry-controlled-executor-intake-validator reports/hermes-agent/state/<flow_id>-taskflow-registry-task-dialoguer-reasoning-policy-coverage-report.json
openclaw hermes report-taskflow-registry-controlled-executor-intake-coverage reports/hermes-agent/state/<flow_id>-taskflow-registry-controlled-executor-intake-validator.json
openclaw hermes report-taskflow-registry-controlled-executor-intake-release-summary reports/hermes-agent/state/<flow_id>-taskflow-registry-controlled-executor-intake-coverage-report.json
openclaw hermes preflight-taskflow-registry-controlled-executor-approval reports/hermes-agent/state/<flow_id>-taskflow-registry-controlled-executor-intake-release-summary-report.json
openclaw hermes report-taskflow-registry-controlled-executor-approval-preflight-coverage reports/hermes-agent/state/<flow_id>-taskflow-registry-controlled-executor-approval-preflight-report.json
openclaw hermes report-taskflow-registry-controlled-executor-final-readiness-lock reports/hermes-agent/state/<flow_id>-taskflow-registry-controlled-executor-approval-preflight-coverage-report.json
openclaw hermes report-taskflow-registry-controlled-executor-final-readiness-lock-coverage reports/hermes-agent/state/<flow_id>-taskflow-registry-controlled-executor-final-readiness-lock-report.json
openclaw hermes report-taskflow-registry-controlled-executor-activation-release-checklist reports/hermes-agent/state/<flow_id>-taskflow-registry-controlled-executor-final-readiness-lock-coverage-report.json
openclaw hermes report-taskflow-registry-controlled-executor-activation-release-checklist-coverage reports/hermes-agent/state/<flow_id>-taskflow-registry-controlled-executor-activation-release-checklist-report.json
openclaw hermes report-taskflow-registry-controlled-executor-activation-operator-handoff-packet reports/hermes-agent/state/<flow_id>-taskflow-registry-controlled-executor-activation-release-checklist-coverage-report.json
openclaw hermes report-taskflow-registry-controlled-executor-activation-operator-handoff-packet-coverage reports/hermes-agent/state/<flow_id>-taskflow-registry-controlled-executor-activation-operator-handoff-packet-report.json
openclaw hermes report-taskflow-registry-controlled-executor-activation-final-safety-summary reports/hermes-agent/state/<flow_id>-taskflow-registry-controlled-executor-activation-operator-handoff-packet-coverage-report.json
openclaw hermes report-taskflow-registry-controlled-executor-activation-final-safety-summary-coverage reports/hermes-agent/state/<flow_id>-taskflow-registry-controlled-executor-activation-final-safety-summary-report.json
openclaw hermes report-taskflow-registry-controlled-executor-activation-next-safe-task-decision reports/hermes-agent/state/<flow_id>-taskflow-registry-controlled-executor-activation-final-safety-summary-coverage-report.json
openclaw hermes report-taskflow-registry-controlled-executor-activation-execution-manifest-proposal reports/hermes-agent/state/<flow_id>-taskflow-registry-controlled-executor-activation-next-safe-task-decision-report.json
openclaw hermes report-taskflow-registry-controlled-executor-activation-execution-manifest-proposal-coverage reports/hermes-agent/state/<flow_id>-taskflow-registry-controlled-executor-activation-execution-manifest-proposal-report.json
openclaw hermes report-taskflow-registry-controlled-executor-activation-execution-manifest-final-readiness-summary reports/hermes-agent/state/<flow_id>-taskflow-registry-controlled-executor-activation-execution-manifest-proposal-coverage-report.json
openclaw hermes report-taskflow-registry-controlled-executor-activation-memory-layer-sandwich-loop reports/hermes-agent/state/<flow_id>-taskflow-registry-controlled-executor-activation-execution-manifest-final-readiness-summary-report.json
openclaw hermes run-taskflow-registry-controlled-executor-activation-memory-layer-sandwich-loop-dry-run reports/hermes-agent/state/<flow_id>-taskflow-registry-controlled-executor-activation-memory-layer-sandwich-loop-report.json
openclaw hermes report-taskflow-registry-controlled-executor-activation-godmode-safety-lock reports/hermes-agent/state/<flow_id>-taskflow-registry-controlled-executor-activation-memory-layer-sandwich-loop-dry-run-report.json
openclaw hermes report-taskflow-registry-controlled-executor-activation-godmode-safety-lock-coverage reports/hermes-agent/state/<flow_id>-taskflow-registry-controlled-executor-activation-godmode-safety-lock-report.json
openclaw hermes plan-taskflow-registry-controlled-executor-activation-red-team-sandbox-boundary reports/hermes-agent/state/<flow_id>-taskflow-registry-controlled-executor-activation-godmode-safety-lock-coverage-report.json
openclaw hermes report-taskflow-registry-controlled-executor-activation-red-team-sandbox-boundary-coverage reports/hermes-agent/state/<flow_id>-taskflow-registry-controlled-executor-activation-red-team-sandbox-boundary-plan.json
openclaw hermes write-taskflow-registry-controlled-executor-activation-red-team-sandbox-operator-approval-challenge-fixture reports/hermes-agent/state/<flow_id>-taskflow-registry-controlled-executor-activation-red-team-sandbox-boundary-plan-coverage-report.json
openclaw hermes report-taskflow-registry-controlled-executor-activation-red-team-sandbox-operator-approval-challenge-coverage reports/hermes-agent/state/<flow_id>-taskflow-registry-controlled-executor-activation-red-team-sandbox-operator-approval-challenge-fixture.json
openclaw hermes report-taskflow-registry-controlled-executor-activation-red-team-sandbox-final-safety-summary reports/hermes-agent/state/<flow_id>-taskflow-registry-controlled-executor-activation-red-team-sandbox-operator-approval-challenge-coverage-report.json
openclaw hermes report-taskflow-registry-controlled-executor-activation-red-team-sandbox-final-safety-summary-coverage reports/hermes-agent/state/<flow_id>-taskflow-registry-controlled-executor-activation-red-team-sandbox-final-safety-summary-report.json
openclaw hermes report-taskflow-registry-controlled-executor-activation-red-team-sandbox-operator-handoff-packet reports/hermes-agent/state/<flow_id>-taskflow-registry-controlled-executor-activation-red-team-sandbox-final-safety-summary-coverage-report.json
```

Run `report-taskflow-registry-contract-coverage` after the writer contract fixture to emit a read-only coverage report that checks required contract fields and safety flags while keeping registry writes, SQLite writes, worker execution, and model invocation disabled. Run `preflight-taskflow-registry-promotion` after that coverage report to prove the green coverage state still blocks every real writer path before any promotion exists. Run `write-taskflow-registry-rollback-contract-fixture` after promotion preflight to create a dry-run rollback contract fixture before any real writer can exist. Run `report-taskflow-registry-rollback-contract-coverage` after rollback fixture creation to prove rollback fields and safety flags remain locked. Run `summarize-taskflow-registry-final-writer-readiness` after rollback coverage to summarize writer coverage, promotion preflight, and rollback coverage as green while keeping every real writer path disabled. Run `plan-taskflow-registry-real-writer-implementation` after the final readiness summary to create only a dry-run implementation plan and guardrail checklist; it must not create a real writer or enable registry, SQLite, worker, or model paths. Run `report-taskflow-registry-real-writer-implementation-plan-coverage` after that plan to prove the implementation plan, guardrail checklist, required validation, rollback path, and disabled execution flags are complete before any writer code exists. Run `write-taskflow-registry-real-writer-api-contract-fixture` after plan coverage to describe only the future writer API contract, input and output schemas, approval-token boundary, rollback precondition, and disabled commit strategy. Run `report-taskflow-registry-real-writer-api-contract-coverage` after that fixture to prove the API contract, input/output schema, approval-token boundary, rollback precondition, disabled commit strategy, and disabled execution flags are complete without creating writer code. Run `preflight-taskflow-registry-real-writer-promotion` after API contract coverage to prove the coverage is green, operator approval remains false, rollback precondition exists, disabled commit strategy is locked, and every real writer path remains disabled. Run `report-taskflow-registry-real-writer-promotion-preflight-coverage` after promotion preflight to prove that preflight green state, API coverage, approval boundary, rollback precondition, disabled commit strategy, and all disabled write/execution flags remain complete. Run `report-taskflow-registry-real-writer-final-readiness-lock` after promotion preflight coverage to lock final readiness while keeping operator approval false and every registry, SQLite, worker, and model path disabled. Run `write-taskflow-registry-real-writer-activation-approval-token-fixture` after the final readiness lock to create only the future activation challenge and fingerprint boundary; it does not store raw approval tokens and does not enable writer execution. Run `report-taskflow-registry-real-writer-activation-approval-token-coverage` after that fixture to prove the challenge/fingerprint boundary is complete, raw tokens are not persisted, the fixture is not operator approval, and every real write/execution path stays disabled. Run `preflight-taskflow-registry-real-writer-activation-approval` after token coverage to prove approval-token coverage is green, fixture approval is not operator approval, operator approval remains false, raw tokens are not stored, rollback precondition exists, disabled commit strategy is locked, and registry writes, SQLite writes, worker execution, and model invocation remain disabled. Run `report-taskflow-registry-real-writer-activation-approval-preflight-coverage` after that preflight to prove the preflight green state, token coverage green state, fixture-not-approval boundary, raw-token non-persistence, rollback precondition, disabled commit strategy, and disabled write/execution flags remain complete before any writer exists. Run `report-taskflow-registry-real-writer-activation-final-readiness-lock` after preflight coverage to lock final activation readiness while keeping operator approval false, raw tokens unpersisted, rollback precondition present, disabled commit strategy locked, and every registry, SQLite, worker, and model path disabled. Run `report-taskflow-registry-real-writer-activation-final-readiness-lock-coverage` after that lock to prove the lock green state, approval preflight coverage, token coverage, rollback precondition, disabled commit strategy, and all disabled write/execution flags remain complete before any writer exists. Run `report-taskflow-registry-real-writer-activation-release-checklist` after that coverage report to emit the final read-only release checklist while still keeping registry writes, SQLite writes, worker execution, and model invocation disabled. Run `report-taskflow-registry-real-writer-activation-release-checklist-coverage` after the release checklist to prove release checklist green, final readiness lock coverage green, activation lock green, approval preflight coverage green, approval token coverage green, fixture-not-approval, raw-token non-persistence, rollback precondition, disabled commit strategy, and disabled write/execution flags remain complete before any writer exists. Run `write-taskflow-registry-real-writer-activation-operator-handoff-packet` after that coverage report to create only a dry-run human handoff packet with manual review checklist, approval challenge reference, rollback precondition reference, and disabled commit strategy confirmation; the packet cannot activate a writer and still keeps registry writes, SQLite writes, worker execution, and model invocation disabled. Run `report-taskflow-registry-real-writer-activation-operator-handoff-packet-coverage` after that packet to prove packet readiness, review checklist completeness, approval challenge reference completeness, packet-not-approval boundary, raw-token non-persistence, rollback reference, disabled commit confirmation, and disabled write/execution flags remain complete. Run `report-taskflow-registry-real-writer-activation-final-safety-summary` after that coverage report to summarize release checklist coverage, handoff packet coverage, approval challenge boundary, rollback precondition reference, disabled commit strategy confirmation, and disabled write/execution flags without creating a writer or invoking registry, SQLite, worker, or model paths. Run `report-taskflow-registry-real-writer-activation-final-safety-summary-coverage` after that summary to prove the final summary is ready, every referenced green state remains green, operator approval is still false, and registry writes, SQLite writes, worker execution, and model invocation remain disabled. Run `write-taskflow-registry-next-safe-task-proposer-fixture` after final safety summary coverage to create only a dry-run deterministic next-task proposal; it may reference a Hermes model decision boundary but must not invoke models or enable registry, SQLite, worker, or writer paths. Run `report-taskflow-registry-next-safe-task-proposer-fixture-coverage` after that fixture to prove the proposer is ready, model decisions are reference-only, operator approval remains false, and all write/execution/model paths remain disabled. Run `write-taskflow-registry-task-dialoguer-fixture` after proposer fixture coverage to create a read-only Hermes/OpenClaw/operator dialogue fixture for the next safe task; it is `dialogue_only: true` and `execution_allowed: false`, so it cannot approve, write, execute, or invoke a model. Run `report-taskflow-registry-task-dialoguer-fixture-coverage` after that fixture to prove the dialogue-only contract, approval boundary, disabled writes, disabled worker execution, and disabled model invocation are still locked. Run `write-taskflow-registry-task-dialoguer-handoff-package` after that coverage report to create the controlled execution-loop handoff package; it links dialogue, package, approval, controlled execution, verification, and feedback, but it still does not start execution by itself. Run `write-taskflow-registry-task-dialoguer-reasoning-policy` after that handoff package to write read-only rules for goal understanding, risk classification, next-safe-task selection, approval gate, handoff, and feedback; it does not invoke a model and does not start execution. Run `report-taskflow-registry-task-dialoguer-reasoning-policy-coverage` after that reasoning policy to prove policy completeness and keep execution approval, registry writes, SQLite writes, worker execution, and model invocation disabled. Run `report-taskflow-registry-task-dialoguer-status-summary-coverage` after that summary report to prove status summary ready, summary_ratio=1, fixture/handoff/reasoning policy/coverage all green, `dialogue_only_locked` true, `execution_disabled` true, `operator_approved` false, `execution_started` false, and all registry/SQLite/worker/model paths disabled. Run `report-taskflow-registry-task-dialoguer-status-summary` after that coverage report to produce a single read-only status summary for the task dialoguer chain while keeping `operator_approved` false, `execution_started` false, and all registry/SQLite/worker/model paths disabled. Run `write-taskflow-registry-controlled-executor-intake-validator` after that coverage report to prove executor intake preconditions are complete while `operator_approved` remains false, `execution_started` remains false, and all write/execution/model paths remain disabled. Run `report-taskflow-registry-controlled-executor-intake-coverage` after that intake validator artifact to produce a read-only coverage report that proves intake preconditions stay complete, intake boundary stays locked, `operator_approved` stays false, `execution_started` stays false, and registry writes, SQLite writes, worker execution, and model invocation all remain disabled. Run `report-taskflow-registry-controlled-executor-intake-release-summary` after that coverage report to produce a read-only release summary artifact that keeps intake coverage green, intake preconditions complete, intake boundary locked, `operator_approved` false, `execution_started` false, and all registry/SQLite/worker/model paths disabled. Run `preflight-taskflow-registry-controlled-executor-approval` after that release summary report to produce a read-only approval preflight artifact that proves intake release summary remains green, intake coverage remains green, intake preconditions remain complete, intake boundary remains locked, `operator_approved` remains false, `execution_started` remains false, and all registry/SQLite/worker/model paths remain disabled. Run `report-taskflow-registry-controlled-executor-approval-preflight-coverage` after that preflight report to produce a read-only coverage artifact that proves approval preflight remains green, intake release summary remains green, intake coverage remains green, intake preconditions remain complete, intake boundary remains locked, `operator_approved` remains false, `execution_started` remains false, and all registry/SQLite/worker/model paths remain disabled. Run `report-taskflow-registry-controlled-executor-final-readiness-lock` after that coverage report to produce a read-only final readiness lock artifact that proves approval preflight coverage remains green, approval preflight remains green, intake release summary remains green, intake coverage remains green, intake preconditions remain complete, intake boundary remains locked, `operator_approved` remains false, `execution_started` remains false, and all registry/SQLite/worker/model paths remain disabled. Run `report-taskflow-registry-controlled-executor-final-readiness-lock-coverage` after that final readiness lock report to produce a read-only coverage artifact that proves final readiness lock remains green, approval preflight coverage remains green, approval preflight remains green, intake release summary remains green, intake coverage remains green, intake preconditions remain complete, intake boundary remains locked, `operator_approved` remains false, `execution_started` remains false, and all registry/SQLite/worker/model paths remain disabled. Run `report-taskflow-registry-controlled-executor-activation-release-checklist` after that coverage report to produce a read-only activation release checklist artifact that proves final readiness lock coverage remains green, final readiness lock remains green, approval preflight coverage remains green, approval preflight remains green, intake release summary remains green, intake coverage remains green, intake preconditions remain complete, intake boundary remains locked, `operator_approved` remains false, `execution_started` remains false, and all registry/SQLite/worker/model paths remain disabled. Run `report-taskflow-registry-controlled-executor-activation-release-checklist-coverage` after that checklist report to produce a read-only coverage artifact that proves activation release checklist remains green, final readiness lock coverage remains green, final readiness lock remains green, approval preflight coverage remains green, approval preflight remains green, intake release summary remains green, intake coverage remains green, intake preconditions remain complete, intake boundary remains locked, `operator_approved` remains false, `execution_started` remains false, and all registry/SQLite/worker/model paths remain disabled. Run `report-taskflow-registry-controlled-executor-activation-operator-handoff-packet` after that coverage report to produce a read-only operator handoff packet report that keeps activation release checklist coverage green, activation release checklist green, final readiness lock coverage green, final readiness lock green, approval preflight coverage green, approval preflight green, intake release summary green, intake coverage green, intake preconditions complete, intake boundary locked, `operator_approved` false, `execution_started` false, and all registry/SQLite/worker/model paths disabled. Run `report-taskflow-registry-controlled-executor-activation-operator-handoff-packet-coverage` after that handoff report to produce a read-only coverage artifact that proves handoff packet readiness while keeping every approval/write/execution/model boundary locked and disabled. Run `report-taskflow-registry-controlled-executor-activation-final-safety-summary` after that coverage report to produce a read-only final safety summary artifact that proves operator handoff packet coverage stays green, activation operator handoff packet stays ready, activation release checklist coverage stays green, activation release checklist stays green, final readiness lock coverage stays green, final readiness lock stays green, approval preflight coverage stays green, approval preflight stays green, intake release summary stays green, intake coverage stays green, intake preconditions stay complete, intake boundary stays locked, `operator_approved` stays false, `execution_started` stays false, and all registry/SQLite/worker/model paths remain disabled.

Ask the configured OpenClaw model for a dry-run decision:

```bash
openclaw hermes decide "create a guarded OpenClaw module"
openclaw hermes decide --model ollama/qwen3:14b "review the safest next repair"
openclaw hermes decide --output-dir reports/hermes-agent/state "start OpenClaw and Hermes model dialogue"
openclaw hermes report-model-backed-dialogue-decision-coverage reports/hermes-agent/state/<trace_id>-model-backed-dialogue-decision.json
openclaw hermes plan-model-backed-dialogue-decision-handoff reports/hermes-agent/state/<trace_id>-model-backed-dialogue-decision-coverage-report.json
openclaw hermes report-model-backed-dialogue-handoff-intake-coverage reports/hermes-agent/state/<trace_id>-model-backed-dialogue-decision-handoff-plan.json
openclaw hermes report-model-backed-dialogue-intake-release-summary reports/hermes-agent/state/<trace_id>-model-backed-dialogue-handoff-intake-coverage-report.json
openclaw hermes report-model-backed-dialogue-intake-release-summary-coverage reports/hermes-agent/state/<trace_id>-model-backed-dialogue-intake-release-summary-report.json
openclaw hermes preflight-model-backed-dialogue-controlled-executor-intake-activation reports/hermes-agent/state/<trace_id>-model-backed-dialogue-intake-release-summary-coverage-report.json
openclaw hermes report-model-backed-dialogue-controlled-executor-intake-activation-preflight-coverage reports/hermes-agent/state/<trace_id>-model-backed-dialogue-controlled-executor-intake-activation-preflight-report.json
openclaw hermes report-model-backed-dialogue-controlled-executor-intake-activation-final-readiness-summary reports/hermes-agent/state/<trace_id>-model-backed-dialogue-controlled-executor-intake-activation-preflight-coverage-report.json
openclaw hermes report-model-backed-dialogue-controlled-executor-intake-activation-final-readiness-summary-coverage reports/hermes-agent/state/<trace_id>-model-backed-dialogue-controlled-executor-intake-activation-final-readiness-summary-report.json
```

`hermes decide` resolves model/auth from the selected OpenClaw agent, calls the
local simple-completion provider path, and returns JSON with `model_invoked`,
`provider`, `model`, `task_package`, `envelope`, and `decision`. It does not
execute the decision. With `--output-dir`, it persists the model-backed dialogue
decision artifact for readback validation. Run
`report-model-backed-dialogue-decision-coverage` on that artifact to prove the
source decision invoked a model, parsed JSON, selected provider/model, includes
validation commands and disabled registry/SQLite/worker/live-action notes, while
the coverage report itself stays read-only and does not invoke another model. Run `plan-model-backed-dialogue-decision-handoff` after coverage to produce only a controlled-executor intake context handoff; it is not operator approval, not a registry or SQLite writer, not worker execution, and not a model caller. Run `report-model-backed-dialogue-handoff-intake-coverage` after the handoff plan to prove `handoff_ready` can only enter the controlled executor as intake context while operator approval, execution, registry writes, SQLite writes, worker execution, model invocation, and live actions remain disabled. Run `report-model-backed-dialogue-intake-release-summary` after intake coverage to summarize that green boundary as read-only release evidence; the summary cannot approve, write registry or SQLite state, execute workers, call a model, or run live actions. Run `report-model-backed-dialogue-intake-release-summary-coverage` after the release summary to prove the summary is ready, intake coverage is green, the controlled executor intake-context boundary remains complete, and approval/execution/writes/model/live actions are still disabled. Run `preflight-model-backed-dialogue-controlled-executor-intake-activation` after release-summary coverage to produce a read-only preflight gate that confirms the same boundaries before any controlled executor activation path can be considered. Run `report-model-backed-dialogue-controlled-executor-intake-activation-preflight-coverage` after that preflight report to prove the preflight is green, release summary coverage remains green, handoff/intake boundaries stay intact, and operator approval, execution, registry writes, SQLite writes, worker execution, model invocation, and live actions remain disabled. Run `report-model-backed-dialogue-controlled-executor-intake-activation-final-readiness-summary` after preflight coverage to produce the read-only final readiness summary and prove all boundaries remain green while operator approval, execution, registry writes, SQLite writes, worker execution, model invocation, and live actions stay disabled. Run `report-model-backed-dialogue-controlled-executor-intake-activation-final-readiness-summary-coverage` after that summary to prove summary readiness (`summary_ratio=1`) and all disabled boundaries remain locked as read-only coverage evidence.

Write a local audit report:

```bash
openclaw hermes plan --write-audit "create a guarded OpenClaw module"
```

Generate a pending approval request for a high-risk action:

```bash
openclaw hermes plan --write-approval "create a bridge that can place a trade order"
```

## Chat command

```text
/hermes plan create a guarded OpenClaw module
```

The chat command returns the same dry-run JSON package without writing files.

## Risk classes

| Risk class        | Approval | Typical trigger                                  |
| ----------------- | -------- | ------------------------------------------------ |
| `read_only`       | No       | Inspect, review, summarize                       |
| `local_write`     | No       | Create, edit, fix, implement inside workspace    |
| `external_write`  | Yes      | Deploy, publish, webhook, send email             |
| `trading_payment` | Yes      | Trade, order, payment, withdraw                  |
| `credential`      | Yes      | API key, token, password, secret, credential use |

## Relationship to Task Flow

Hermes prepares the package and approval boundary. [Task Flow](/automation/taskflow)
is the durable orchestration layer that can later execute multi-step flows once
the package has passed review and any required approval.

For self-improving OpenClaw loops, start with `hermes deploy-plan`. It defines
the sequential Hermes planner, worker coder, verifier, and memory summarizer
handoff before those roles are wired into Task Flow or assigned separate models.
Use `--taskflow-skeleton` to preview the managed Task Flow shape without writing
to the Task Flow registry or starting worker execution.
Use `--write-taskflow-skeleton` to persist that dry-run skeleton under the
workspace as a report artifact. It still does not write to the Task Flow
registry.
Run `validate-taskflow-skeleton` against the persisted artifact before any
future registry promotion. The validator checks the sequential steps, gates,
report requirements, resource policy, and high-risk action blocks, but still
does not write to the Task Flow registry or start worker execution.
Run `stage-taskflow-registry` only after validation passes. It writes a
reviewable `taskflow_registry_staging` dry-run artifact under the workspace and
keeps `taskflow_registry_write`, `worker_execution`, and `model_invoked` locked
to `false`. This is the safe handoff boundary before any future explicit
registry-write promotion gate.
Run `gate-taskflow-registry` to create that explicit promotion gate report. The report rechecks the staging artifact and source skeleton, keeps `registry_write_allowed` locked to `false`, and requires manual approval before any future real registry writer can be added.
Run `write-taskflow-registry-noop` to exercise the registry writer adapter boundary without touching the real SQLite registry. It writes a `taskflow_registry_noop_write` artifact and keeps `taskflow_registry_write`, `sqlite_write`, `worker_execution`, and `model_invoked` locked to `false`.
Run `preview-taskflow-registry-diff` to produce a read-only preview of the flow that would be written later. This preview is artifact-only: it does not read or write the SQLite Task Flow registry and keeps all execution flags disabled.
Run `request-taskflow-registry-approval` to persist the explicit operator approval request for that preview. It records `approval_state: pending`, keeps `operator_approved` false, and still blocks registry writes, SQLite writes, worker execution, and model invocation.
Run `validate-taskflow-registry-approval` to write a validation artifact for that pending approval request. The validator keeps `registry_write_allowed`, `taskflow_registry_write`, `sqlite_write`, `worker_execution`, and `model_invoked` locked to `false`.
Run `snapshot-taskflow-registry-dry-run` after an operator exports `openclaw tasks flow list --json` to normalize the official Task Flow list output into a read-only snapshot artifact. Then run `read-taskflow-registry-dry-run` with that snapshot to compare the desired flow state without reading SQLite directly, writing SQLite, starting worker execution, or invoking a model. Run `review-taskflow-registry-write` only after that comparison; it writes a review-only writer gate and still keeps Task Flow registry writes, SQLite writes, worker execution, and model invocation disabled. Run `apply-taskflow-registry-noop` after writer review to create the final no-op apply artifact; it validates the proposed create/update operation but still does not write Task Flow registry state, mutate SQLite, start workers, or invoke a model. Run `validate-taskflow-registry-approval-token` after the no-op apply artifact to validate the explicit operator token challenge. That validator stores only a token fingerprint and keeps `operator_approved`, `registry_write_allowed`, `taskflow_registry_write`, `sqlite_write`, `worker_execution`, and `model_invoked` false. Run `write-taskflow-registry-writer-contract-fixture` after token validation to produce a dry-run writer contract fixture with `commit_strategy: disabled`, `taskflow_registry_write: false`, and `sqlite_write: false`.

## Related

- [Task Flow](/automation/taskflow) - durable multi-step orchestration
- [Background Tasks](/automation/tasks) - ledger for detached work
- [Hooks](/automation/hooks) - event-driven lifecycle automation
- [Plugin hooks](/plugins/hooks) - in-process plugin interception
- [Exec approvals](/tools/exec-approvals) - host exec approval policy

## Learning and promotion gate

Record a success or failure pattern:

```bash
openclaw hermes learn --trace-id <trace_id> --status success --summary "guarded patch passed" --tags patch,guarded
```

Run staging validation and produce promote or rollback decision:

```bash
openclaw hermes promote --trace-id <trace_id> --validate "pnpm check" "pnpm test -- src/hooks/install.test.ts"
```

These commands write deterministic state reports under `reports/hermes-agent/state` for closed-loop learning and promotion evidence.







