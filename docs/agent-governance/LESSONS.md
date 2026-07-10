# Agent Governance Lessons

**Status:** curated ledger  
**Version:** 1.0  
**Last reviewed:** 2026-07-10

Admission, promotion, merge, retirement, and compaction rules are defined in `docs/agent-governance/40-maintenance-protocol.md`. This file stores reusable prevention rules only; it is not a session transcript.

## L-2026-001 — Root instructions became a fixed startup-context tax

- Status: ACTIVE
- Observed: 2026-07-10
- Trigger: root `CLAUDE.md` resolved to the full 185-line `AGENTS.md` for every Claude session, including tasks that did not need repository implementation, PR, release, mobile, or platform rules
- Evidence: original `CLAUDE.md` blob `47dc3e3d863cfb5727b87d785d09abf9743c0a72` contained the symlink target `AGENTS.md`; original `AGENTS.md` blob `a8ab45e10b577b7f48d0fb872324e19a6600e045`; exact copies live under `docs/agent-governance/backups/2026-07-10/`
- Failure: unrelated sessions paid the token and attention cost of all project procedures, increasing instruction competition and making task-relevant rules harder to follow
- Root cause: the Claude-specific entry point was treated as a mirror of the generic project policy instead of a minimal router
- Prevention: keep root `CLAUDE.md` as a regular file of at most 80 nonblank lines; use no active `@path` imports; route repository work to `AGENTS.md` and task procedures on demand
- Enforcement: `scripts/validate-agent-governance.mjs`; backup manifest; fresh-context review
- Affected files: `CLAUDE.md`, `docs/agent-governance/00-diagnosis.md`, `docs/agent-governance/README.md`
- Owner: governance maintainer
- Review by: 2026-10-10
- Supersedes / merged into: NONE

## L-2026-002 — Delegation without a return contract moves noise, not context

- Status: ACTIVE
- Observed: 2026-07-10
- Trigger: specialized skills recommended subagents for noisy work, but no repository-wide rule constrained worker scope, model/effort, output length, evidence format, or path ownership
- Evidence: `.agents/skills/autoreview/SKILL.md` recommends a subagent filter for noisy review output; no general model-routing document or project-scoped `.claude/agents/` contract existed at baseline
- Failure: a lead could delegate yet still ingest raw logs, broad inventories, and process narration; parallel workers could overlap edits; model selection remained implicit
- Root cause: delegation was defined as role assignment, not as a bounded information-compression interface
- Prevention: every assignment includes goal and motivation, pass/fail acceptance criteria, and the common report contract; long output goes to an artifact; concurrent writers receive disjoint path sets; model and effort are explicit
- Enforcement: `docs/agent-governance/10-model-routing.md`, `docs/agent-governance/30-delegation-prompts.md`, `.claude/agents/*.md`
- Affected files: model routing, prompt templates, subagent definitions
- Owner: lead session
- Review by: 2026-10-10
- Supersedes / merged into: NONE

## L-2026-003 — Author-only verification creates completion illusion

- Status: ACTIVE
- Observed: 2026-07-10
- Trigger: the same context could plan, write, summarize, and declare its own work complete without one cross-task fresh-context gate
- Evidence: existing code-review skill is strong for code, but baseline harness lacked a universal definition of done and fresh verifier contract for files, research, governance, and high-risk decisions
- Failure: coherent reasoning could preserve the same hidden assumption through implementation and self-review; a successful write response or green nearby test could be mistaken for complete user-visible proof
- Root cause: verification was treated as a final prose pass rather than independent disconfirmation plus deterministic evidence
- Prevention: separate deterministic proof, fresh-context semantic review, and human/external judgment; require durable read-back; expose all proof gaps; do not count model majority as authority for taste or private intent
- Enforcement: `docs/agent-governance/20-judgment-rubric.md`, `docs/agent-governance/10-model-routing.md`, `fresh-reviewer` subagent, governance review artifacts
- Affected files: all deliverables and closeout procedures
- Owner: verifier and lead jointly
- Review by: 2026-10-10
- Supersedes / merged into: NONE

## L-2026-004 — More architecture is not more reliability without an observed failure

- Status: CANDIDATE
- Observed: 2026-07-10
- Trigger: multi-agent, memory, debate, graph, self-healing, or “neural” layers are proposed without a measured failure class, acceptance test, or cost boundary
- Evidence: this governance pass found the highest-value repairs in startup context, delegation contracts, and independent proof rather than adding a new runtime framework
- Failure: the harness can gain routing indirection, token cost, stale states, and ceremonial components while the original error rate remains unmeasured
- Root cause: architecture labels are used as proxies for evidence and operational value
- Prevention: admit a new subsystem only when it names the observed failure, baseline metric, contract, owner, deterministic or evaluative gate, rollback, and removal condition; otherwise prefer a document, test, or small script
- Enforcement: architecture proposal checklist in `docs/agent-governance/90-letter-to-future-sessions.md`; user approval for Class 2 policy changes
- Affected files: future architecture and orchestration proposals
- Owner: governance maintainer
- Review by: 2026-10-10
- Supersedes / merged into: NONE

## L-2026-005 — Model names decay faster than task contracts

- Status: CANDIDATE
- Observed: 2026-07-10
- Trigger: instructions bind a workflow to a specific current model or unsupported effort field without a role-based fallback
- Evidence: Claude Code model aliases, supported models, effort levels, and subagent frontmatter are product-version-dependent and must be checked against current official documentation
- Failure: a future session may fail to launch, silently downgrade, or apply an obsolete routing assumption
- Root cause: implementation identifiers were treated as stable policy
- Prevention: define stable roles first—mechanical explorer, substantive worker, judgment model, independent verifier—then map current model aliases to them; verify named fields every 90 days and maintain a Sonnet-executable fallback
- Enforcement: `docs/agent-governance/40-maintenance-protocol.md`; `scripts/validate-agent-governance.mjs`; dated `REFERENCES.md`
- Affected files: `.claude/agents/*.md`, `10-model-routing.md`, `REFERENCES.md`
- Owner: governance maintainer
- Review by: 2026-10-10
- Supersedes / merged into: NONE
