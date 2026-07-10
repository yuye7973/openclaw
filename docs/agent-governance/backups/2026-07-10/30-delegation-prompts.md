# Delegation Prompt Templates

**Status:** normative templates  
**Version:** 1.0  
**Date:** 2026-07-10

Copy one template, replace every `<PLACEHOLDER>`, and delete irrelevant clauses. A prompt is not ready while any placeholder remains.

The lead must attach the original user outcome or a faithful excerpt. Do not delegate from a lossy summary when a requirement can be copied exactly.

## Common report contract

Use this in every assignment unless a stricter format is supplied:

```text
STATUS: PASS | PARTIAL | BLOCKED

CONCLUSION
- At most 8 ranked bullets.

EVIDENCE
- repository/relative/path:line-line — supported claim
- authoritative source identifier — supported claim

CHANGES
- repository/relative/path — one-line description
- NONE

VERIFICATION
- `exact command or check` — PASS | FAIL | NOT RUN; one-line result

RISKS / GAPS
- remaining uncertainty or NONE

ARTIFACT
- path/to/long-output
- NONE
```

Do not paste more than 20 lines of raw logs. Long results go to the artifact path.

---

## 1. Repository search / inventory

**Default:** `repo-explorer`, Haiku `high` for exact inventory; Sonnet `high` when synthesis or causal inference is required.

```text
DELEGATION TYPE: repository search / inventory
AGENT: <repo-explorer | researcher | custom agent>
MODEL: <haiku | sonnet>
EFFORT: <medium | high>
MODE: read-only; <foreground | background>

GOAL AND MOTIVATION
Find <EXACT ENTITY / BEHAVIOR / CONTRACT> within <REPOSITORY / SUBTREE / COMMIT RANGE>.
This matters because <DECISION OR FAILURE THAT DEPENDS ON THE RESULT>.

QUESTION TO ANSWER
<ONE PRIMARY QUESTION>

SCOPE
Include:
- <PATH / FILE TYPE / SYMBOL / HISTORY RANGE>
- <CALLERS / TESTS / DOCS / CONFIG, IF RELEVANT>

Exclude:
- <OUT-OF-SCOPE AREA>
- generated files, vendored code, or dependencies unless they are the contract source

SEARCH STRATEGY REQUIREMENTS
- Start with exact names and known paths, then expand only when a concrete lead requires it.
- Read the nearest scoped AGENTS.md before interpreting a subtree.
- Distinguish definition, caller, test, documentation, and dead/stale reference.
- Record why the search is complete for the stated scope.
- Make no edits.

ACCEPTANCE CRITERIA
- Every in-scope match is listed once, with repository-relative file:line evidence.
- False positives and stale/generated matches are labeled.
- The primary question has a direct answer, not only an inventory.
- Uncertainty is explicit; no API/default/runtime behavior is guessed.
- If more than 30 evidence rows are needed, write them to <ARTIFACT_PATH>.

STOP / ESCALATE
- Stop after the bounded scope is exhausted and one expansion pass finds no new category.
- Escalate to Sonnet if cross-file causal inference, conflicting evidence, or ownership judgment is required.
- Return BLOCKED if required history, dependency source, or permissions are unavailable.

RETURN FORMAT
<PASTE COMMON REPORT CONTRACT>
```

### Filled search example

```text
AGENT: repo-explorer
MODEL: haiku
EFFORT: high
GOAL: enumerate all production writes and reads of the Telegram reconnect cursor under src/ and extensions/telegram/. We need to test whether split ownership can duplicate delivery.
ACCEPTANCE: definitions, callers, relevant tests, and scoped AGENTS.md rules; file:line evidence; no edits; direct conclusion on whether more than one writer exists.
ARTIFACT: tmp/reconnect-cursor-inventory.md if over 30 rows.
```

---

## 2. Implementation

**Default:** `implementer`, Sonnet `high`. Use Sonnet `xhigh` for subtle state/concurrency work. Planning or high-risk boundary decisions should already be resolved by Opus or the lead.

```text
DELEGATION TYPE: implementation
AGENT: implementer
MODEL: sonnet
EFFORT: <high | xhigh>
MODE: writable; <main checkout with exclusive paths | isolated worktree with verified base>

ORIGINAL OUTCOME
<PASTE USER OUTCOME OR ACCEPTED SPEC>

GOAL AND MOTIVATION
Implement <OBSERVABLE BEHAVIOR> because <USER / SYSTEM IMPACT>.
The accepted design is <ONE-PARAGRAPH CONTRACT, NOT A STEP-BY-STEP SCRIPT>.

WRITE OWNERSHIP
Allowed paths:
- <EXACT PATH OR GLOB>

Read-only adjacent paths:
- <PATHS NEEDED FOR CONTRACT CONTEXT>

Forbidden without returning BLOCKED:
- public protocol or config changes;
- dependency, lockfile, release, permission, or ownership changes;
- files owned by another active worker;
- baseline/snapshot/ignore changes used only to silence checks.

INVARIANTS
- <EXISTING BEHAVIOR THAT MUST REMAIN>
- <SECURITY / COMPATIBILITY / DATA INVARIANT>
- <STYLE / ARCHITECTURE BOUNDARY FROM AGENTS.md>

ACCEPTANCE CRITERIA
- The requested behavior is observable at <TEST / CLI / API / UI / REAL SCENARIO>.
- A regression test fails before the fix and passes after it, when feasible.
- The smallest risk-matched checks pass: <EXACT COMMANDS OR TEST TARGETS>.
- No unrelated formatting or cleanup is included.
- All changed files are read back and listed.
- No placeholder, TODO, silent fallback, or hidden compatibility shim is introduced.

WORK METHOD
- Reproduce or establish a failing proof before editing.
- Read dependency docs/source/types before relying on external behavior.
- Implement at the ownership boundary that owns the policy.
- After the first passing proof, inspect the diff for accidental scope.
- If the accepted design is impossible or unsafe, do not invent a substitute; return BLOCKED with the smallest decision required.

STOP / ESCALATE
- One retry is allowed for a transient command/dependency problem.
- Stop and return PARTIAL/BLOCKED if the change requires a forbidden surface.
- Escalate when two evidence-based attempts fail, the same symptom survives the proposed cause, or public/security/release behavior is implicated.

RETURN FORMAT
<PASTE COMMON REPORT CONTRACT>
```

### Filled implementation example

```text
AGENT: implementer
MODEL: sonnet
EFFORT: high
GOAL: make the provider own reconnect cursor advancement so one successful external delivery advances it exactly once.
ALLOWED: extensions/telegram/src/** and colocated tests.
INVARIANTS: retry behavior, public config, and message ordering remain unchanged.
PROOF: focused failing-before/passing-after reconnect test, then the relevant changed lane.
```

---

## 3. Refactor

**Default:** `refactorer`, Sonnet `xhigh`. Use Opus `xhigh` for selecting the boundary when several valid designs remain.

```text
DELEGATION TYPE: bounded refactor
AGENT: refactorer
MODEL: <sonnet | opus>
EFFORT: xhigh
MODE: writable; exclusive path ownership

GOAL AND MOTIVATION
Refactor <CURRENT STRUCTURE> into <TARGET OWNERSHIP / ABSTRACTION> to remove <SPECIFIC COST OR BUG CLASS>.
This is not a behavior feature. Public behavior must remain <UNCHANGED | EXPLICITLY LISTED DELTA>.

CURRENT PROBLEM EVIDENCE
- <PATH:LINE — DUPLICATION / LEAK / CYCLE / DISCOVERY COST>
- <TEST / PROFILE / INCIDENT EVIDENCE>

TARGET CONTRACT
- Owner: <MODULE / LAYER>
- Inputs: <TYPED OR DOCUMENTED CONTRACT>
- Outputs: <TYPED OR DOCUMENTED CONTRACT>
- Callers migrate in this change: <LIST>
- Compatibility exception, if explicitly approved: <NAME, WARNING, TEST, REMOVAL PLAN | NONE>

WRITE OWNERSHIP
Allowed paths:
- <PATHS>

Forbidden:
- unrelated feature changes;
- broad fallback stacks, aliases, or wrappers solely to shrink the diff;
- permanent internal compatibility for callers that can migrate now;
- baseline/snapshot edits that conceal behavior drift.

ACCEPTANCE CRITERIA
- Existing user-visible behavior is proven by <TESTS / REAL SCENARIO>.
- All intended callers use the new contract; obsolete paths are deleted.
- Import cycles, build/lazy boundaries, and public exports remain valid where applicable.
- Diff contains no duplicate policy or dead abstraction left behind.
- <EXACT CHECKS> pass.
- A fresh reviewer can state the ownership rule in one sentence from the resulting code.

WORK METHOD
- Map current callers and invariants before editing.
- Make the contract explicit before moving implementation.
- Migrate callers in bounded batches with proof after each batch.
- Delete obsolete code only after the replacement path is proven.
- Do not conflate code motion with behavioral repair; report any discovered behavior bug separately.

STOP / ESCALATE
- Stop if behavior parity cannot be measured.
- Escalate if target ownership is still disputed, a public contract must change, or the patch grows because the abstraction is wrong.

RETURN FORMAT
<PASTE COMMON REPORT CONTRACT>
```

### Filled refactor example

```text
AGENT: refactorer
MODEL: sonnet
EFFORT: xhigh
GOAL: carry prepared provider/model/channel facts from registry resolution into the hot path; remove repeated request-time discovery.
ACCEPTANCE: all internal callers migrate, old lookup branches deleted, focused behavior tests and import-cycle checks pass, no public SDK change.
```

---

## 4. Research

**Default:** `researcher`, Sonnet `high`. Use parallel Sonnet workers for distinct source domains. Use Opus `xhigh` only for synthesis when sources conflict or a consequential decision follows.

```text
DELEGATION TYPE: research
AGENT: researcher
MODEL: <sonnet | opus>
EFFORT: <high | xhigh>
MODE: read-only; <foreground | background>

DECISION QUESTION
<ONE QUESTION THE RESEARCH MUST ENABLE>

WHY IT MATTERS
<DECISION, DESIGN, RISK, OR USER CLAIM THAT DEPENDS ON IT>

AS-OF DATE / FRESHNESS
Answer as of <YYYY-MM-DD>.
Treat any fact that may have changed as untrusted until checked.

SCOPE
Include:
- <OFFICIAL DOCUMENTATION / SOURCE / SPEC / PAPER / RELEASE NOTES>
- <COMPETING IMPLEMENTATIONS OR VIEWPOINTS, IF MATERIAL>

Exclude:
- SEO summaries, unattributed claims, copied documentation, and model-generated pages as evidence;
- sources outside <DATE / DOMAIN / JURISDICTION>, unless used to explain history.

SOURCE POLICY
- Technical claims: primary documentation, source, types, standards, release notes, or original papers.
- Current product/model/tool behavior: current official source first.
- Academic claims: original paper; distinguish benchmark result from general conclusion.
- Use at least two independent sources for a consequential claim when available.
- Record publication/event dates and identify stale or superseded material.
- Quote minimally; paraphrase and link claims to sources.

ACCEPTANCE CRITERIA
- Direct answer to the decision question.
- Claim-to-source mapping for every load-bearing fact.
- Conflicts and uncertainty are visible.
- Facts, inference, recommendation, and unknowns are separate.
- At least one disconfirming search or alternative hypothesis was attempted.
- Long synthesis is written to <ARTIFACT_PATH>; chat report stays within the common contract.

STOP / ESCALATE
- Stop when additional sources repeat existing evidence and cannot change the decision.
- Change route if searches add volume but no discriminating evidence.
- Escalate synthesis to Opus when primary sources disagree, assumptions span domains, or several recommendations remain valid.
- Return BLOCKED when the decisive evidence is private, paywalled without access, unverifiable, or outside available expertise.

RETURN FORMAT
<PASTE COMMON REPORT CONTRACT>
```

### Filled research example

```text
AGENT: researcher
MODEL: sonnet
EFFORT: high
QUESTION: which Claude Code subagent frontmatter fields and effort values are officially supported as of 2026-07-10, and what precedence controls the effective model?
SOURCES: current official Claude Code docs only; record version caveats; no edits.
ARTIFACT: docs/agent-governance/research/claude-subagent-capabilities.md.
```

---

## 5. Review / verification

**Default:** `fresh-reviewer`, Opus `xhigh` for consequential work; Sonnet `high` for normal bounded work. The reviewer must not be the authoring context.

```text
DELEGATION TYPE: independent review
AGENT: fresh-reviewer
MODEL: <sonnet | opus>
EFFORT: <high | xhigh>
MODE: read-only; fresh context; foreground

ORIGINAL REQUEST
<PASTE ORIGINAL USER REQUEST OR EXACT ACCEPTANCE SPEC>

ARTIFACTS TO REVIEW
- <PATH / DIFF RANGE / COMMIT / PR>

AUTHOR CLAIMS
Use only as hypotheses, not evidence:
- <CLAIMED OUTCOME>
- <CLAIMED PROOF>

RISK PROFILE
<LOW | MEDIUM | HIGH> because <CONSEQUENCE>.

REVIEW QUESTIONS
1. Does every requested deliverable exist and satisfy the exact constraint?
2. Do paths, names, commands, model fields, tool names, and references exist?
3. Are active rules contradictory, ambiguous, or vulnerable to predictable misreading by a weaker model?
4. Does the proof actually establish the user-visible or contract-visible claim?
5. Is there an untested, unsafe, irreversible, or unauthorized change?
6. Is complexity necessary, or is a simpler ownership-correct design available?
7. What evidence would falsify the current conclusion?

METHOD
- Read the original request before the artifacts.
- Inspect changed files directly; do not rely on the author's summary.
- Re-run deterministic checks that are safe and within scope.
- Trace every finding to file:line and explain impact.
- Reject speculative edge cases that lack a real production state, hostile/public input, shipped upgrade path, or dependency contract.
- Rank findings by consequence, not style preference.

ACCEPTANCE CRITERIA
- Return PASS only when no accepted actionable finding remains and required proof is present.
- Return PARTIAL/FAIL when a requested deliverable, route, invariant, or proof is missing.
- Each finding includes severity, evidence, consequence, smallest repair, and verification to rerun.
- List checked surfaces with no findings so coverage is inspectable.
- Do not edit files.

RETURN FORMAT
STATUS: PASS | FAIL | BLOCKED

FINDINGS
- [P0 | P1 | P2 | P3] path:line — problem; consequence; smallest repair; proof to rerun
- NONE

COVERAGE
- files, commands, and acceptance criteria checked

REJECTED CONCERNS
- concern — one-line reason it is not actionable

GAPS
- missing environment/evidence or NONE
```

### Filled review example

```text
AGENT: fresh-reviewer
MODEL: opus
EFFORT: xhigh
REQUEST: adversarially audit the agent-governance package and root router.
ARTIFACTS: CLAUDE.md, AGENTS.md, .claude/agents/*.md, docs/agent-governance/**, scripts/validate-agent-governance.mjs.
RISK: high because every future session loads or follows these rules.
REQUIRED: contradictions, nonexistent paths/tools, invalid frontmatter, ambiguous weaker-model instructions, unsupported claims, and read-back completeness.
```

---

## Optional: multi-candidate judge

Use only when independent workers produced genuinely different candidates. Randomize labels so the judge is less influenced by model identity or ordering.

```text
AGENT: decision-judge
MODEL: opus
EFFORT: xhigh

DECISION
Choose among candidates A–<N> for <OUTCOME>.

RUBRIC WITH WEIGHTS
- Correctness / evidence: <WEIGHT>%
- Requirement coverage: <WEIGHT>%
- Safety / reversibility: <WEIGHT>%
- Simplicity / maintainability: <WEIGHT>%
- Verification quality: <WEIGHT>%

RULES
- Score each criterion independently before choosing.
- Cite candidate text or artifact evidence.
- Penalize unsupported confidence, verbosity without evidence, and hidden assumptions.
- If no candidate clears <PASS THRESHOLD>, return NONE and specify the missing property.
- Do not average away a hard safety failure.

RETURN
- score table
- winner or NONE
- decisive evidence
- required repair before adoption
```

## References

See `docs/agent-governance/REFERENCES.md`.
