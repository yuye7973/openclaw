# Agent Governance System Architecture

**Status:** design doctrine  
**Version:** 1.0  
**Date:** 2026-07-10

This document explains the deeper architecture behind the operational rules. Read it on demand; do not import it from root `CLAUDE.md`.

## 1. Design objective

Maximize **verified user value per unit of lead-context attention**, subject to safety, authorization, and durability constraints.

The scarce resource is not only model tokens. It is the lead model's clean decision state. Raw evidence, logs, and partial implementation details increase context entropy: they make relevant constraints harder to retrieve and anchor later judgments to accidental details. The architecture therefore separates decision authority from high-volume execution and makes evidence durable outside conversation history.

## 2. Four-plane architecture

### 2.1 Intent and control plane

Owned by the lead/commander.

Responsibilities:

- preserve the user's outcome, constraints, and authorization boundary;
- score ambiguity, breadth, consequence, evidence difficulty, and novelty;
- select task boundaries, models, effort, tools, and proof;
- assign non-overlapping ownership;
- decide escalation, stopping, and user questions;
- synthesize evidence into a decision.

It should contain compact state: decisions, open risks, artifact paths, and acceptance criteria. It should not contain raw logs, full corpus text, or large patches.

### 2.2 Work and tool plane

Owned by bounded workers.

Responsibilities:

- repository exploration, source retrieval, implementation, refactor, test execution, and data processing;
- local adaptation to tool feedback;
- writing long outputs directly to artifacts;
- returning a compact, typed report.

Workers get only the tools and permissions they need. Read-only tasks omit mutation tools. Concurrent writers receive disjoint path ownership.

### 2.3 Evidence and verification plane

Owned by deterministic checks and independent reviewers.

Responsibilities:

- preserve claim-to-evidence links;
- distinguish fact, inference, recommendation, and unknown;
- test end state rather than reward a familiar-looking trajectory;
- falsify author claims;
- reject completion when observable proof is missing.

A runtime claim requires execution evidence. A file claim requires read-back. A current technical claim requires an authoritative current source. A subjective choice requires human calibration. No single proof substitutes for every layer.

### 2.4 Memory and adaptation plane

Owned by curated tracked artifacts, not incidental conversation memory.

Responsibilities:

- convert confirmed failures into compact reusable lessons;
- promote repeated lessons into prompts, rubrics, tests, hooks, or permissions;
- archive superseded detail;
- retain resumable plans and decisions across context compaction or session boundaries.

Machine-local auto memory is useful for personal convenience but is neither shared governance nor an audit trail. Governance changes enter version control only after evidence, review, and compaction discipline.

## 3. Execution state machine

Every substantive task moves through these states:

```text
INTAKE
  -> CLASSIFY
  -> DECOMPOSE
  -> DISCOVER / EXECUTE
  -> SYNTHESIZE
  -> VERIFY
  -> HANDOFF
```

Allowed failure transitions:

```text
DISCOVER -> REFRAME       when evidence invalidates the question
EXECUTE  -> REDESIGN      when patch growth or ownership leakage appears
VERIFY   -> REPAIR        when a specific finding fails acceptance
ANY      -> ASK_USER      when private intent or authorization is decisive
ANY      -> ESCALATE      when model/tool capacity is the bottleneck
ANY      -> BLOCKED       when required evidence or authority is unavailable
```

Forbidden transitions:

- `INTAKE -> EXECUTE` for ambiguous or consequential work;
- `EXECUTE -> HANDOFF` without verification;
- `VERIFY -> VERIFY` by repeating the same author/self-review with no new evidence;
- `BLOCKED -> PASS` by merely restating confidence;
- `ASK_USER` before the harness has exhausted reversible investigation.

## 4. The two-key completion invariant

Consequential work requires two independent keys:

1. **Mechanistic key:** deterministic evidence that the artifact exists and the relevant behavior/check passes.
2. **Semantic key:** an independent context judges that the result satisfies the original outcome and did not violate hidden constraints.

Neither is enough alone.

- Tests can pass while solving the wrong problem.
- A reviewer can like a design that never runs.
- Multiple model opinions can share the same false assumption.
- A successful write response can still contain truncated or malformed content.

For subjective work, add a third key: user or qualified human judgment.

## 5. Evidence graph, not prose confidence

Represent a consequential decision as a small evidence graph:

```text
User outcome
  -> acceptance criterion
      -> claim
          -> observation/source/test
              -> artifact or command result
```

Every load-bearing claim should have at least one incoming evidence edge. Contradictory observations remain separate until resolved; do not average them into vague prose. A recommendation must name which claims and trade-offs cause it.

Minimal claim ledger:

| ID | Claim | Label | Evidence | Falsifier | Owner |
|---|---|---|---|---|---|
| C1 | <statement> | VERIFIED/SUPPORTED/INFERRED/UNKNOWN | <path/test/source> | <what would disprove it> | <agent> |

Use a ledger when consequence is high, sources conflict, or more than five claims drive the decision. Store it as an artifact; the lead receives only the decisive claims.

## 6. Delegation as information compression

Delegate based on expected **context entropy**, not only task duration.

A task should leave the lead when it produces many low-value tokens before one high-value conclusion. Examples: broad search, logs, test output, issue histories, dependency source, and large diffs.

A good worker is an intelligent compression function:

```text
large corpus + bounded question + tools
  -> ranked conclusions + evidence pointers + uncertainty
```

Compression must be loss-aware. Long code, tables, and citations go directly to durable artifacts so later stages can inspect originals without routing everything through the lead. This is the **artifact bus**: workers communicate through durable paths, while the lead communicates through decisions.

## 7. Value-of-information budgeting

Before another search, reviewer, or model upgrade, ask:

1. What uncertain variable could this action resolve?
2. Could its result change the decision or verification status?
3. Is there a cheaper independent action with similar discriminating power?
4. What is the stopping condition?

Continue only when expected decision value exceeds coordination and token cost. This prevents endless search and review theater.

Examples:

- A second exact grep after a complete inventory has near-zero information gain.
- A real reconnect scenario after unit tests pass has high information gain because it can falsify the user-visible claim.
- A fifth reviewer using the same model, sources, and rubric has low independence and low marginal value.

## 8. Epistemic independence ladder

Independence is not binary. Increase it along different axes:

1. New turn, same author context — weak; useful only for preflight.
2. Fresh context, same model and evidence — better against local anchoring.
3. Fresh context, different prompt role or rubric — better against framing.
4. Different model strength or family — reduces some correlated errors.
5. Different tool or source class — tests evidence dependence.
6. Deterministic execution or measurement — strongest for mechanical claims.
7. Human, domain expert, or user — necessary for authority, taste, and regulated judgment.

Use at least two different axes for high-risk work. “Three agents agreed” is weak if all saw the same summary and copied the same assumption.

## 9. Generator–critic–judge topology

For open-ended high-value decisions:

1. **Generators** produce genuinely different candidates or hypotheses in parallel. Give them different lenses or source domains.
2. **Critics** try to falsify one candidate each; they do not rewrite it.
3. **Judge** receives anonymized candidates, evidence, criticisms, and a weighted rubric. It may select `NONE`.
4. **Executor** implements the accepted contract using a cheaper model.
5. **Verifier** checks end state without the generator's reasoning narrative.

Do not use this topology for routine edits; coordination cost dominates. Use it when several valid designs exist, uncertainty is costly, or anchoring risk is high.

## 10. Policy enforcement gradient

Controls increase in strength:

```text
prose instruction
  < structured prompt/frontmatter
  < schema/validator/test
  < permission allow/deny
  < hook/interceptor
  < sandbox/worktree/process boundary
  < independent external watcher/human authorization
```

Use prose for judgment and defaults. Use deterministic controls for invariants whose violation is unacceptable. Never claim `CLAUDE.md` “enforces” a rule; official documentation describes it as context, not configuration enforcement.

High-risk actions should combine capability limits with verification. For example, a read-only reviewer should have both a review instruction and denied write tools; an external message should require explicit authorization and end-state confirmation.

A frontmatter permission mode is not an operating-system sandbox. Parent permission modes can affect child behavior, and `Bash` can mutate indirectly unless a sandbox, hook, or external process boundary blocks it. Therefore:

- read-only roles use an explicit tool allowlist and never inherit an orchestration tool or broad MCP tools;
- reviewers with `Bash` are behaviorally read-only, not claimed to be OS-level read-only;
- high-consequence environments add a user-approved sandbox/hook or omit `Bash`;
- the effective parent permission mode is evidence in any security-sensitive review.

## 11. Capability–identity–knowledge boundary

A stateful agent's risk is not only what tools it can call.

- **Capability:** tools, shell, network, filesystem, credentials, permissions.
- **Identity:** whose authority the agent represents, which account or workspace it can act as, and whether approval is authentic.
- **Knowledge:** prompts, memory, repository instructions, retrieved content, secrets, and durable state that can steer future actions.

A safe change asks how all three dimensions move. Limiting shell commands does not protect a poisoned skill or memory. Protecting files does not prevent misuse of a valid identity through an authorized messaging tool. Use this as a design lens whenever adding memory, MCP, hooks, external actions, or autonomous workers.

## 12. Memory flywheel

Durable improvement follows:

```text
incident / failed eval
  -> root-cause lesson
  -> prompt or rubric guard
  -> deterministic test/hook when repeatable
  -> regression corpus
  -> measured outcome
  -> prune ineffective rule
```

Reflection without an artifact, changed guard, or test is not institutional learning. Conversely, not every incident deserves a root instruction; most belong in a scoped layer.

## 13. Evaluation doctrine

Evaluate the **model plus harness**, not the model in isolation. Use end-state graders because valid agent trajectories differ. Run multiple trials for nondeterministic behavior. Track:

- task success and requirement coverage;
- unauthorized actions and safety stops;
- proof quality and false completion rate;
- token and tool-call cost;
- lead-context growth;
- escalation precision: upgrades that changed the outcome;
- user-question precision: questions that were actually necessary;
- time or turns to first discriminating evidence.

A governance change is an experiment. It should improve at least one target metric without materially degrading safety or another explicit budget.

## 14. Context checkpoints

At phase boundaries or before compaction, persist:

- original outcome and constraints;
- accepted decisions and rejected alternatives;
- open risks and questions;
- artifact paths and current SHAs;
- exact proof run and status;
- next state-machine transition.

Do not persist private chain-of-thought. Persist decisions, evidence, and resumable state. A fresh session should continue without trusting the previous session's confidence.

## 15. Failure containment

When a worker fails:

- keep its artifact and exact error;
- do not merge partial writes across an ownership boundary;
- distinguish transient tool failure from semantic route failure;
- replace the worker only after changing one causal variable;
- use checkpoints so one failed subagent does not force a full restart;
- never let a blocked worker authorize a weaker proof standard.

## 16. Architecture invariants

1. One user outcome has one accountable lead.
2. Every writer has exclusive path ownership.
3. Every consequential claim has inspectable evidence.
4. Every completion has mechanistic and semantic proof.
5. Every retry changes a causal variable or stops.
6. Every persistent lesson has a concrete incident and guard.
7. Every hard guarantee has a deterministic enforcement layer.
8. Every subjective choice remains visibly subjective.
9. Every advanced feature has a lower-capability fallback.
10. Every governance layer has a token/load budget and a pruning rule.

## References

See `docs/agent-governance/REFERENCES.md`.
