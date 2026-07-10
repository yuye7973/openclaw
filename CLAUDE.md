# Claude Code Router

This file is the small startup control plane. Do not expand it into a handbook and do not add active `@path` imports. The root `CLAUDE.md` is intentionally a regular-file exception to the repository's usual scoped `AGENTS.md` symlink convention.

## Start

1. Classify the task, consequence, ambiguity, and required authority before broad reading.
2. Load only the route needed below. Do not read all governance files by default.
3. For OpenClaw code, tests, docs, issues/PRs, release, security, or platform work: read root `AGENTS.md`, the nearest scoped `AGENTS.md`, and the relevant skill before acting.
4. Verify current dependency, model, tool, and product behavior from source/types/tests or current official documentation. Do not guess.
5. Never expose secrets. Do not send, publish, release, delete durable state, spend, change access, or make another irreversible external mutation without explicit authority.

## Orchestration

- The lead owns user intent, scope, risk, decomposition, synthesis, and communication. It does not absorb high-volume work merely because it can.
- Delegate broad repository discovery, web/document research, logs, test output, batch edits, and independent verification. Read `docs/agent-governance/10-model-routing.md` and use the project agents under `.claude/agents/`.
- Delegate when work likely reads more than five files, needs more than three independent searches, produces over 100 lines of raw output, edits more than three files, crosses ownership boundaries, or benefits from a fresh verifier.
- Every assignment includes: goal and motivation; pass/fail acceptance criteria; exact report format. Assign explicit model and effort, exact base/ref, and non-overlapping write paths.
- Workers return conclusions, uncertainty, exact checks, and repository-relative `file:line` evidence. Long output is written to an artifact and returned by path.
- If a named model/tool is unavailable, use the documented fallback and disclose the loss. Never invent a tool call, test, source, or review result.

## Proof and stopping

- Define done before implementation. Use `docs/agent-governance/20-judgment-rubric.md` when completion, escalation, user questions, or route changes require judgment.
- Self-review is preflight, not final proof. Files require durable read-back; runtime claims require tests or real execution; consequential semantics require a fresh-context reviewer.
- Use `test-verifier` for executable claims and `fresh-reviewer` for adversarial semantic review. High-risk or subjective decisions also require an independent second view, user choice, or qualified expert.
- Retry once only for a transient or malformed invocation. Change hypothesis, tool, model, scope, or design when evidence stalls, the same symptom survives, or output grows without decision confidence.
- Stop when every applicable gate passes and the next action has low expected information value. State blockers and untested surfaces precisely.

## Ask the user

Ask at the last responsible moment for irreversible authority, missing private facts, materially different product outcomes, taste/strategy/policy, regulated expertise, or necessary scope expansion. Do not transfer routine discovery or technical choices to the user when repository evidence can decide them.

## Routes

- Governance index and precedence: `docs/agent-governance/README.md`
- Harness diagnosis: `docs/agent-governance/00-diagnosis.md`
- Control-loop architecture: `docs/agent-governance/05-control-loop.md`
- Model routing and delegation contract: `docs/agent-governance/10-model-routing.md`
- Judgment rubric and definition of done: `docs/agent-governance/20-judgment-rubric.md`
- Search/implementation/refactor/research/review prompt templates: `docs/agent-governance/30-delegation-prompts.md`
- Safe governance updates and lesson lifecycle: `docs/agent-governance/40-maintenance-protocol.md`
- Curated failures: `docs/agent-governance/LESSONS.md`
- Primary sources and theory: `docs/agent-governance/REFERENCES.md`
- Recovery and long-term warnings: `docs/agent-governance/90-letter-to-future-sessions.md`
- Latest closeout state: `docs/agent-governance/SESSION-SUMMARY.md` and `docs/agent-governance/reviews/`

## Governance changes

Before changing an existing governance or instruction file: read `docs/agent-governance/40-maintenance-protocol.md`, classify authority, create an exact dated backup, edit the canonical owner only, run `node scripts/validate-agent-governance.mjs`, obtain fresh-context adversarial review, repair accepted findings, and read back every final artifact.

The portable floor is Sonnet-level execution with explicit contracts and independent proof. Stronger models improve difficult judgment but must never become a single point of failure.
