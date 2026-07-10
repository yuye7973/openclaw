# Agent Harness Diagnosis

**Status:** active baseline  
**Date:** 2026-07-10  
**Scope:** repository-level Claude Code harness in `yuye7973/openclaw`

## Evidence and limits

Observed in the repository:

- Root `CLAUDE.md` is a symlink whose blob content is `AGENTS.md`.
- The resolved root instructions are about 185 lines and include repository architecture, PR operations, release procedure, platform operations, tests, and security rules.
- Existing workflow skills such as `.agents/skills/openclaw-testing/SKILL.md` and `.agents/skills/autoreview/SKILL.md` are detailed and useful, but they are task procedures rather than a complete model-routing contract.
- No project-scoped `.claude/settings.json` or `.mcp.json` was present at diagnosis time.

Not observable from this harness:

- user or managed Claude settings;
- user-level agents, skills, hooks, plugins, MCP servers, and allowlists;
- Claude auto-memory under `~/.claude/projects/...`;
- account-level model availability, budget, or organization policy.

Therefore, every rule below is repository-portable and must degrade safely when a named model, tool, or MCP server is unavailable. It does not claim control over machine-local configuration.

## Top three leaks

### 1. Fixed startup-context tax

**Observed failure**

Every Claude session resolves the root `CLAUDE.md` symlink to the full `AGENTS.md`. This injects many rules that are valid only for particular tasks: release management, GitHub issue mutation, mobile testing, changelog wording, platform operations, and specialized test lanes. Unrelated sessions pay for and must reconcile all of them.

Claude Code documentation states that root instructions load at session start, longer files consume more context and reduce adherence, and `@path` imports still load the imported text. A large router therefore cannot be repaired by merely splitting it into imported files.

**Concrete repair**

1. Replace the symlink with a regular, short `CLAUDE.md` router.
2. Keep only universal behavior, stop conditions, and paths to on-demand documents in that router.
3. Do **not** use `@path` imports for long policy files.
4. Tell the model to read `AGENTS.md` before repository work and only the one specialized governance file required by the task.
5. Keep task procedures in skills; keep path-specific implementation rules in scoped `AGENTS.md` or `.claude/rules/` files.

**Acceptance check**

- `CLAUDE.md` is at most 80 nonblank lines.
- It contains no active `@path` import.
- Every routed path exists.
- Repository-specific work still requires `AGENTS.md` and the nearest scoped `AGENTS.md`.

**Expected value**

The startup context becomes a small control plane instead of a copy of the whole operating manual. This is the highest-value change because it affects every future session and every subsequent turn.

### 2. Commander context pollution and implicit model choice

**Observed failure**

The current repository has excellent specialized skills, and `autoreview` already recommends filtering noisy review output through a subagent. However, there is no repository-wide contract that says:

- which work must leave the main conversation;
- which model and effort to use;
- what a worker may return;
- when to escalate or downgrade;
- how to prevent parallel workers from editing the same files.

Without that contract, the lead model tends to scan the repository, ingest logs, read large files, and perform batch edits itself. The main context accumulates evidence that is no longer useful after synthesis, increasing cost and making later decisions depend on stale or accidental details.

**Concrete repair**

1. Adopt the commander rule: the lead owns intent, decomposition, risk, synthesis, and user communication; workers own high-volume retrieval, implementation, and independent review.
2. Require the delegation three-pack for every worker: goal and motivation, acceptance criteria, and report format.
3. Explicitly assign `model` and `effort` in every reusable subagent and in each exceptional invocation.
4. Limit worker reports to conclusions, uncertainty, and repository-relative `file:line` evidence. Long output must be written to a file and returned by path.
5. Isolate concurrent writers by file ownership or worktree; never let two workers edit an overlapping path set.

**Acceptance check**

Delegate when any one is true:

- the task requires broad repository discovery;
- more than three independent searches or more than five source files are likely;
- raw output is likely to exceed 100 lines;
- implementation spans more than one ownership boundary;
- a web or document corpus must be surveyed;
- a batch edit touches more than three files;
- verification benefits from a context that did not create the change.

The lead may work directly only when the task is narrow, evidence is already in context, and direct work is cheaper than writing and checking a delegation prompt.

### 3. Completion illusion from self-verification and uncurated memory

**Observed failure**

Instructions in `CLAUDE.md` are context, not enforcement. The same model can silently preserve its own mistaken assumptions while planning, implementing, and reviewing. Auto-memory is machine-local and only its small index is loaded automatically; it is not a reliable shared governance ledger. Existing review guidance is strong for code, but the harness lacks one cross-task definition of done, a fresh-context review contract, and a compact lesson lifecycle.

**Concrete repair**

Use three distinct proof layers:

1. **Deterministic proof:** read-back, syntax/schema checks, targeted tests, build or real execution.
2. **Independent semantic proof:** a fresh-context reviewer checks the artifact against the original task and acceptance criteria, not the implementer's summary.
3. **Human or external proof:** subjective taste, materially ambiguous intent, legal/financial/medical judgment, irreversible product choices, and unclear trade-offs require the user, a domain expert, or a genuinely independent second opinion.

Add a project-tracked lessons ledger. A lesson is admitted only after a concrete failure, correction, and reusable prevention rule. Keep the index compact; move details to dated records and periodically merge duplicates.

**Acceptance check**

A task is not complete unless:

- every requested artifact exists and was read back;
- the smallest risk-matched executable proof passed, or the exact blocker is stated;
- an independent reviewer found no accepted actionable issue, or each remaining issue is explicitly owned;
- unresolved ambiguity and untested surfaces are visible in the handoff;
- any reusable new failure mode has a regression test, guard, or lesson entry.

## Priority map

1. Short root router and contradiction-safe backup.
2. Model-routing and report contracts.
3. Judgment rubric and definition of done.
4. Reusable delegation prompts.
5. Safe maintenance and lesson lifecycle.
6. Concrete subagent definitions and deterministic governance validator.
7. Adversarial review, read-back, and session handoff.

## Harness boundary

Decomposition, tool isolation, tests, diverse samples, and independent review can materially improve execution reliability. They cannot manufacture a correct interpretation of an underspecified goal or settle aesthetic and strategic taste. When those dominate, the correct action is to expose the ambiguity, ask the user at the last responsible moment, escalate to a stronger model or external expert, or state that the available evidence cannot determine a unique answer. Repeating the same model with a longer prompt is not independent verification.

## Primary references

- Claude Code memory and instruction loading: `https://code.claude.com/docs/en/memory`
- Claude Code subagents: `https://code.claude.com/docs/en/sub-agents`
- Claude Code model configuration: `https://code.claude.com/docs/en/model-config`
- Claude Code cost and context guidance: `https://code.claude.com/docs/en/costs`
- Anthropic multi-agent research system: `https://www.anthropic.com/engineering/multi-agent-research-system`
- Anthropic agent evaluation guidance: `https://www.anthropic.com/engineering/demystifying-evals-for-ai-agents`
