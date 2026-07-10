# Proof-Carrying Agent Control Loop

**Status:** normative architecture  
**Version:** 1.0  
**Date:** 2026-07-10

This file is the operating theory behind the repository harness. It translates research ideas into a Sonnet-executable control system. It is not a requirement to expose private chain-of-thought; all control signals are observable artifacts, evidence, checks, and decisions.

## 1. Design objective

Maximize **verified useful outcome per unit of lead-context, cost, and irreversible risk**.

Do not optimize for number of tool calls, amount of prose, model prestige, test count, or worker agreement. Those are inputs, not outcomes.

The harness treats:

- the lead context as scarce decision state;
- workers as bounded evidence/implementation processors;
- artifacts as durable shared memory;
- tests and read-back as sensors;
- reviewers as fault detectors, not authors;
- the user as the authority for intent, taste, policy, and irreversible choices.

## 2. Six-state loop

Every substantive task moves through these states:

```text
SCOPE -> CONTRACT -> ROUTE -> EXECUTE -> PROVE -> LEARN
  ^         |          |          |         |
  |         +----------+----------+---------+
  +----------- re-scope when evidence changes
```

### 2.1 SCOPE

Produce a bounded problem statement:

- desired end state;
- explicit constraints and authority;
- known facts versus assumptions;
- consequence, ambiguity, breadth, evidence difficulty, and novelty scores;
- the smallest missing decision that only the user can make.

Exit condition: one primary outcome can be stated in a sentence, or the user must choose among a small set of materially different outcomes.

Anti-pattern: start scanning the repository before knowing what decision the scan must enable.

### 2.2 CONTRACT

Turn the outcome into observable pass/fail criteria:

- artifact paths or state changes;
- invariants and forbidden surfaces;
- required evidence;
- required deterministic and independent verification;
- stop and escalation conditions.

Exit condition: a fresh worker could distinguish PASS, PARTIAL, and BLOCKED without guessing the lead's intent.

Anti-pattern: “fix it thoroughly” or “make it high quality.”

### 2.3 ROUTE

Choose the cheapest safe topology, not merely a model:

- direct lead work versus worker;
- Haiku, Sonnet, Opus, or optional Fable;
- foreground versus background;
- read-only versus writable;
- main checkout versus verified-base worktree;
- single worker, independent parallel hypotheses, or sequential chain;
- deterministic verifier, fresh model reviewer, human/domain expert, or a combination.

Exit condition: every worker has the delegation three-pack, explicit model/effort, non-overlapping write ownership, and a return contract.

Anti-pattern: give every task to the strongest model at maximum effort.

### 2.4 EXECUTE

Workers interleave reasoning with observation and action:

- retrieve only evidence needed for the current decision;
- cite observations before making consequential inferences;
- establish failing or pre-change behavior before repair when feasible;
- keep high-volume output outside the lead context;
- stop on authority expansion, wrong abstraction, or evidence collapse.

Exit condition: the requested artifact or bounded result exists, with local proof and explicit gaps.

Anti-pattern: a worker silently broadens the problem and returns an impressive but unreviewable narrative.

### 2.5 PROVE

Use a verification ladder:

1. **Structural:** file exists, syntax/frontmatter/schema/path/links are valid.
2. **Behavioral:** targeted test or real execution proves the visible contract.
3. **Regression:** relevant prior behavior remains valid.
4. **Independent semantic:** a fresh-context reviewer checks the original request and artifacts.
5. **Authority:** user or qualified expert resolves subjective, regulated, strategic, or irreversible judgment.

Do not substitute a higher rung for a missing lower rung. An Opus review cannot prove code execution. A green unit test cannot prove product intent.

Exit condition: all applicable gates pass, or the handoff explicitly owns every failed/blocked gate.

Anti-pattern: the author reviews its own summary and calls that independent verification.

### 2.6 LEARN

Convert feedback into one durable mechanism, in this priority order:

1. regression test or executable guard;
2. scoped skill/procedure;
3. path-specific rule;
4. reusable prompt/agent definition;
5. compact lesson entry;
6. root instruction only when it applies to almost every session and has repeated evidence.

Exit condition: a concrete recurrence would be prevented or detected without relying on recollection.

Anti-pattern: append a long story to root CLAUDE.md after one unusual incident.

## 3. Proof-carrying work unit

Every delegated work unit has this tuple:

```text
W = (Goal, Scope, Authority, Invariants, Acceptance, Evidence, Proof, Gaps, Artifact)
```

A result is admissible to the lead only when it carries:

- a status (`PASS`, `PARTIAL`, `BLOCKED`);
- conclusions bounded by the goal;
- repository-relative `file:line` or authoritative-source evidence;
- exact changes or `NONE`;
- exact checks and outcomes;
- residual uncertainty;
- a path for long output.

This is “proof-carrying” in an operational, not formal-verification, sense: the consumer need not trust the worker's confidence because the decisive claims arrive with inspectable evidence and checks.

## 4. Separation of powers

Use four authorities with distinct failure modes:

| Authority | Owns | Must not own alone |
|---|---|---|
| User | intent, taste, policy, risk appetite, external authorization | repository discovery or routine technical choices |
| Lead | decomposition, routing, synthesis, risk, communication | high-volume execution or final self-verification |
| Worker | bounded evidence or implementation | scope expansion, product intent, its own final acceptance |
| Verifier | falsification and acceptance against contract | rewriting the task to make the artifact pass |

For high-risk work, diversity must be **structural**, not cosmetic. Change at least two of:

- context (fresh, not forked);
- model family/tier;
- evidence source or tool;
- hypothesis or implementation approach;
- grader type (code, model, human).

Three identical prompts to correlated models are three samples, not three independent authorities.

## 5. Context budget

### Lead-context admission rule

Admit only information that changes at least one of:

- task boundary;
- model/tool/topology choice;
- architecture or implementation decision;
- verification plan;
- user-facing conclusion or uncertainty.

Everything else stays in the worker context or a durable artifact.

### Compression rule

A worker summary should be the minimum sufficient statistic for the next decision:

- decision-relevant conclusion;
- decisive evidence;
- uncertainty;
- artifact path.

Do not return search chronology, full logs, or complete patches.

### Context pressure signal

Re-route when the lead:

- rereads the same files or logs;
- forgets an explicit constraint;
- carries more than two large raw outputs;
- cannot state current acceptance gaps in fewer than eight bullets;
- begins solving worker-level details while synthesis is pending.

Before compaction or interruption, write state to an artifact; do not rely on conversation-only memory.

## 6. Value-of-information routing

Before another search, retry, model escalation, or test, ask:

```text
Expected decision value = P(next evidence changes decision) * consequence of a better decision
Expected cost = tokens + latency + tool cost + state/risk exposure
```

Proceed when expected decision value materially exceeds expected cost, or when the check is a mandatory safety/proof gate.

Stop or commit when:

- the acceptance decision is already determined;
- new sources repeat existing evidence;
- a wider test cannot cover a changed contract not already covered by the focused proof;
- another reviewer is likely only to rephrase existing findings;
- the remaining uncertainty is irreducible without user/private/domain input.

This is a qualitative rubric, not fake precision. Do not invent probabilities. State `high`, `medium`, or `low` information value and why.

## 7. Retry budget and hypothesis ledger

For nontrivial debugging or research, keep a compact ledger in the worker artifact:

```text
H1: hypothesis — evidence for — evidence against — next discriminating check — status
H2: ...
```

Rules:

- Correct a malformed invocation or transient failure and retry once.
- Do not retry a semantic approach without new discriminating evidence.
- After two evidence-based failures, change hypothesis, tool/source, task boundary, model, or design.
- A failed hypothesis is useful evidence; retain it so a later worker does not repeat it.
- Delete stale hypotheses from lead context after synthesis; keep them in the artifact.

## 8. Risk tiers

| Tier | Examples | Minimum routing and proof |
|---|---|---|
| R0 reversible/local | lookup, small doc correction | Haiku/Sonnet; structural read-back |
| R1 bounded code/doc | local implementation, internal refactor | Sonnet high; focused proof; fresh review when nontrivial |
| R2 public/operational | public API/config, migration, user-visible behavior, broad dependency | Sonnet xhigh or Opus design; deterministic behavior proof; fresh independent review |
| R3 irreversible/sensitive | release, deletion, credentials, permissions, external messaging, security, money, regulated judgment | explicit user authority; Opus/fresh expert review; real environment proof; rollback/containment plan |

A lower model may execute an R3 task after the decision and contract are fixed, but it cannot waive R3 authority or verification.

## 9. Verification lattice

Use complementary graders rather than one universal judge:

- **Code-based:** exact match, schema, compiler, tests, static checks, execution, benchmark measurement.
- **Model-based:** ambiguity, requirement coverage, contradiction, maintainability, groundedness.
- **Human/SME:** taste, strategy, policy, high-consequence domain judgment, calibration of model graders.

Combine them with hard gates:

```text
Complete = required code gates PASS
        AND required semantic gates PASS
        AND required authority gates PASS
```

Do not average a security or authority failure into a passing weighted score.

When comparing candidates:

- anonymize and randomize labels when practical;
- score criteria before choosing;
- reverse candidate order once for a consequential pairwise judgment;
- penalize unsupported verbosity;
- return `NONE` when no candidate clears the threshold.

## 10. Memory architecture

Use four layers:

### L0 — root router

Tiny, universal, loaded every session. Contains hard boundaries and paths, not procedures.

### L1 — scoped operational knowledge

`AGENTS.md`, path-scoped rules, and skills. Loaded only for the relevant subtree or task.

### L2 — tracked governance and lessons

This directory and its lesson ledger. Shared across machines and reviewable in version control.

### L3 — machine-local auto memory

Convenient for environment-specific commands and recurring local observations. It is not the source of truth because it is machine-local, capped at startup, and model-written.

Promotion rule: an L3 note becomes L2/L1/L0 only after evidence, review, and scope classification. Never copy auto-memory text into root policy uncritically.

## 11. Anti-drift mechanisms

The harness degrades unless it actively removes entropy.

- Validate all routed paths and agent frontmatter after governance changes.
- Search active instruction surfaces for contradictory trigger/action pairs.
- Admit a lesson only with incident evidence and a prevention mechanism.
- Merge duplicate rules; keep one canonical owner and links elsewhere.
- Date current-state claims and revalidate model/tool fields quarterly or after a Claude Code upgrade.
- Cap root `CLAUDE.md` at 80 nonblank lines and governance `INDEX.md` at 120.
- When a file exceeds 300 lines, split by decision boundary, not arbitrary size.
- Archive superseded records; never leave two active versions with unclear precedence.
- Use an independent governance audit after substantive changes.

## 12. Failure containment

When a worker fails:

- preserve partial artifacts and exact error;
- do not merge partial writes into a passing result;
- release or reassign file ownership explicitly;
- resume only when the prior context is useful and trusted;
- start fresh when the prior context contains a poisoned assumption, uncontrolled scope, or author-review contamination.

When a model/tool is unavailable:

- follow the fallback in `10-model-routing.md`;
- reduce scope or increase deterministic proof;
- disclose the independence or capability loss;
- never invent a successful invocation.

## 13. Why this architecture

- Interleaving reasoning with external actions grounds plans in observations (ReAct).
- Separate context windows make broad search a compression operation and reduce lead-context pollution (Anthropic multi-agent research and Claude Code subagents).
- Diverse candidate paths can improve hard reasoning, but only when paired with an external criterion rather than self-confidence (self-consistency, Tree of Thoughts, multi-agent debate).
- Linguistic feedback becomes durable only when it changes a future policy, test, or memory artifact (Reflexion).
- Agent evaluation is strongest when code, model, and human graders are matched to the property being measured (Anthropic eval guidance).
- LLM judges exhibit position and related biases, so blind labels, order checks, hard gates, and human calibration are required.
- End-state evaluation permits flexible trajectories while still enforcing the final contract; checkpoints contain compound errors.

## 14. Minimal session algorithm

```text
1. Read root router.
2. Classify risk and ambiguity.
3. Read only the routed policy/skill/scoped rules.
4. Write acceptance criteria before broad work.
5. Delegate any high-volume or independently verifiable unit.
6. Keep worker returns contract-shaped; store long output by path.
7. Synthesize decisions; do not copy raw worker context.
8. Run deterministic proof.
9. Run fresh semantic review when required.
10. Ask the user only for irreducible intent/authority.
11. Read back durable artifacts.
12. Record a lesson only when it prevents a demonstrated recurrence.
13. Stop when all applicable gates pass and the next action has low information value.
```

## References

See `docs/agent-governance/REFERENCES.md`.
