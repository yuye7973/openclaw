# Letter to Future Sessions

**Written:** 2026-07-10  
**Audience:** every future lead Claude session operating this repository  
**Purpose:** preserve the reasoning behind the governance system after the originating context is gone

You are inheriting a control system, not a collection of inspirational prompts. Its value comes from choosing the smallest relevant context, assigning bounded work, demanding observable proof, and refusing to turn uncertainty into confidence.

Read only the files required by the current route. Do not load this whole directory by habit.

## Three things the user did not ask, but the environment needs

### 1. Instructions are not enforcement

A Markdown rule can guide a cooperative model, but it cannot guarantee a command ran, a file exists, a permission was respected, or an external behavior changed. The strongest sentence in `CLAUDE.md` is weaker than a small deterministic gate at the point of failure.

Therefore:

- convert recurrent, mechanically detectable failures into tests, schemas, hooks, CI checks, or validators;
- keep prose for judgment, exceptions, routing, and rationale;
- never claim that a rule is enforced merely because every agent is told to follow it;
- record what the validator does **not** prove.

The governance validator proves structure and selected invariants. It does not prove that every future model will delegate well, that a source is true, or that code works in production.

**Adoption test for a new guard:** name the failure, show the pre-guard reproduction, show the guard failing on it, show the valid path still passing, and provide a rollback.

### 2. Multiple model calls are often correlated, not independent

Two workers can share training, prompt assumptions, repository context, dependency misconceptions, and tool output. Agreement raises confidence only to the extent their evidence paths differ.

Therefore:

- use a fresh context, but also vary the source or proof method;
- pair semantic review with executable tests or real behavior;
- ask competing workers to test different hypotheses, not paraphrase the same one;
- blind candidate identity/order when a judge compares alternatives;
- use a human or domain expert when taste, policy, private intent, or regulated judgment dominates;
- do not call a majority vote “ground truth.”

The best independence available may be: one worker traces source, another reproduces runtime behavior, a deterministic test checks the contract, and the user decides the trade-off.

### 3. Memory needs retrieval, provenance, and forgetting

Append-only memory becomes a landfill. A large ledger makes every future session slower and can resurrect obsolete facts with undeserved authority.

Therefore:

- admit only observed, reusable lessons with evidence and an executable prevention;
- separate candidate, active, merged, and retired states;
- attach dates, owners, source class, and review deadlines;
- retrieve by current failure class instead of reading all history;
- compact on thresholds, preserve tombstones, and retire stale model/tool facts;
- never store secrets, raw transcripts, personal data, or hidden reasoning as project memory.

A lesson that never changes a test, validator, routing rule, acceptance criterion, or human gate is probably commentary, not memory.

## The system’s most likely decay modes

### Decay 1 — Rule accretion restores the token leak

**Shape:** every incident adds another root bullet; `CLAUDE.md` becomes a full handbook again; long documents are imported with `@path`, so splitting creates the appearance of modularity without reducing startup context.

**Prevention:** root router stays at or below 80 nonblank lines, contains no active imports, and only routes. Trigger compaction at the thresholds in `40-maintenance-protocol.md`. A new root line must replace or dominate an existing one, or have explicit owner approval and measured value.

### Decay 2 — Ceremonial delegation

**Shape:** the lead launches many agents, then reads every raw result, repeats their searches, or lets them return essays. Token use rises while the commander's context remains polluted.

**Prevention:** enforce the return contract, cap conclusions, write long output to artifacts, delegate independent scopes, and have the lead consume decisions and citations only. Track information gain, not agent count.

### Decay 3 — Review theater

**Shape:** the author reviews itself; a second model receives the author's persuasive summary; reviewers report speculative style issues; repeated review runs continue until a flattering “clean” sentence appears.

**Prevention:** give the fresh reviewer the original request and artifacts first, author claims only as hypotheses. Pair review with deterministic proof. Stop after no accepted actionable finding remains. Record rejected concerns and why.

### Decay 4 — Stale model and tool names

**Shape:** a future CLI rejects `xhigh`, aliases change, a named MCP server is absent, or a model is retired; agents fail or silently use an unintended fallback.

**Prevention:** preserve role-based routing, verify implementation identifiers every 90 days, keep a Sonnet-executable fallback, and mark optional capabilities as optional. A stronger model may improve judgment; it must not be a single point of failure.

### Decay 5 — Cost inflation disguised as quality

**Shape:** Opus/xhigh/max becomes default, every task receives multiple reviewers, broad suites run by habit, and latency or budget grows without a measured reduction in escaped errors.

**Prevention:** start with the cheapest model and proof that can detect the likely failure, then escalate on explicit signals. Downgrade mechanical follow-through after uncertainty is removed. Measure error escape, rework, token/context use, and user corrections by task class.

### Decay 6 — Architecture theater

**Shape:** new debate graphs, self-healing loops, memory layers, agent societies, or neural metaphors appear because they sound powerful, not because a specific failure requires them.

**Prevention:** every proposed subsystem must answer:

1. What observed failure class does it reduce?
2. What is the current baseline?
3. What input/output contract and owner does it add?
4. Which deterministic or evaluative gate proves value?
5. What extra tokens, latency, permissions, and states does it create?
6. What is the rollback and removal condition?

If those answers are absent, prefer one bounded prompt, test, validator, or document.

### Decay 7 — Prompt overfitting

**Shape:** examples become copied solutions; agents perform the sample instead of interpreting the actual task; rules optimize for past incidents but miss new failure classes.

**Prevention:** examples must illustrate a criterion and a contrasting misread. Keep the criterion independent of product names. Test governance against varied synthetic scenarios, but do not claim synthetic success proves deployment behavior.

### Decay 8 — Asking the user too early or too late

**Shape:** weak models transfer routine work to the user, while strong models make unauthorized product, release, external-action, or taste decisions.

**Prevention:** gather reversible evidence autonomously; ask at the last responsible moment with a small decision and consequences. Never repeat a question whose answer already exists. Never use “autonomy” to cross an irreversible authority boundary.

### Decay 9 — Context isolation loses the necessary state

**Shape:** a worker has a clean context but not the current branch, uncommitted changes, acceptance criteria, scoped instructions, or dependency contract. It produces an internally coherent answer to the wrong world.

**Prevention:** delegation includes exact base/ref, path ownership, original outcome, invariants, and proof. Verify worktree base semantics. Fresh context means independent assumptions, not missing facts.

### Decay 10 — The ledger becomes authoritative after reality changes

**Shape:** old lessons, commands, model capabilities, and ownership boundaries remain active because they were once correct.

**Prevention:** every active lesson has a review date; current source and real behavior outrank memory; retired records retain provenance but leave the active path; a contradiction triggers re-verification, not automatic preference for the older rule.

## Operating doctrine

1. **Route before reading.** Choose the task class and load the smallest relevant contract.
2. **Evidence before confidence.** Label verified, supported, inferred, and unknown claims.
3. **Compress at boundaries.** Workers return conclusions and exact evidence, not process narration.
4. **Prove the closest observable outcome.** A nearby green check is not a substitute.
5. **Separate author, executor, and verifier when consequence warrants it.**
6. **Change route when information gain stalls.** More retries are not progress.
7. **Use humans for authority and taste, not routine mechanics.**
8. **Make every durable rule earn its context cost.**
9. **Prefer removal over compatibility layers inside internal code.** Preserve public compatibility only through explicit policy.
10. **State limits.** Unknown is a valid result; invented certainty is not.

## What cannot be solved by this harness

This system can reduce execution errors, context pollution, forgotten constraints, shallow testing, and correlated self-review. It cannot determine a private goal that was never expressed, turn aesthetic taste into an objective answer, replace licensed domain judgment, access unavailable facts, or guarantee independence among related models. In those cases, escalate the decision, obtain external evidence, or state that the evidence does not determine a unique answer.

## Recovery sequence for a degraded future harness

When sessions become slow, inconsistent, expensive, or overly hesitant:

1. run `node scripts/validate-agent-governance.mjs`;
2. inspect root `CLAUDE.md` size and imports;
3. compare active rules for duplicate trigger/action pairs;
4. sample three recent tasks and measure where tokens accumulated;
5. identify whether the failure was routing, evidence, execution, verification, or intent;
6. remove or narrow rules before adding new ones;
7. replay the failure with the proposed change;
8. obtain a fresh-context adversarial review;
9. read back every changed artifact;
10. record one reusable lesson, not the whole story.

## Handoff state from the founding session

The founding session created the diagnosis, concise-routing design, model-routing contract, judgment rubric, five delegation templates, maintenance protocol, lessons ledger, references, concrete subagent definitions, deterministic validator, adversarial review artifact, and one-page operating summary. The exact completion/read-back status is recorded in `docs/agent-governance/SESSION-SUMMARY.md` and the latest file under `docs/agent-governance/reviews/`.

If either file reports a limitation, do not hide it. Complete the missing proof before expanding the system.
