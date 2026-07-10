# Agent Governance Control Plane

**Status:** active index  
**Version:** 1.0  
**Date:** 2026-07-10

This directory externalizes task routing, model selection, judgment, delegation, verification, and maintenance so future Claude sessions can operate consistently without loading the whole manual at startup.

## Start here

Do not read every file by default.

1. Root `CLAUDE.md` is the small startup router.
2. For OpenClaw code, tests, docs, PR, release, security, or platform work, read root `AGENTS.md`, the nearest scoped `AGENTS.md`, and the relevant skill.
3. For orchestration or difficult judgment, load only the governance file named by the route below.
4. For governance maintenance, read `40-maintenance-protocol.md` before editing anything.
5. For final verification, use a fresh-context reviewer and run `node scripts/validate-agent-governance.mjs`.

No governance file is imported into root `CLAUDE.md`; an import would still consume startup context.

## Delivery map

| User deliverable | Durable artifact |
|---|---|
| A. Quick diagnosis | `00-diagnosis.md` |
| B. Short Claude entry point | root `CLAUDE.md`; this index; original state in `backups/2026-07-10/` |
| C. Model dispatch rules | `10-model-routing.md` and `.claude/agents/*.md` |
| D. Externalized judgment | `20-judgment-rubric.md` |
| E. Delegation prompts | `30-delegation-prompts.md` |
| F. Maintenance protocol | `40-maintenance-protocol.md` and `LESSONS.md` |
| G. Future-session letter | `90-letter-to-future-sessions.md` |
| Research basis | `REFERENCES.md` |
| Deterministic structural gate | `scripts/validate-agent-governance.mjs` |
| Independent review record | `reviews/YYYY-MM-DD-*.md` |
| Founding-session closeout | `SESSION-SUMMARY.md` |

## Route by task

### Need to diagnose harness quality or token/focus loss

Read:

- `00-diagnosis.md`
- `20-judgment-rubric.md` only if a policy decision follows

### Need to delegate or select a model

Read:

- `10-model-routing.md`
- the relevant section of `30-delegation-prompts.md`

Use one of:

- `.claude/agents/repo-explorer.md`
- `.claude/agents/researcher.md`
- `.claude/agents/implementer.md`
- `.claude/agents/refactorer.md`
- `.claude/agents/test-verifier.md`
- `.claude/agents/fresh-reviewer.md`
- `.claude/agents/decision-judge.md`

### Need to decide whether to escalate, finish, ask, or change direction

Read:

- `20-judgment-rubric.md`

### Need a copyable worker prompt

Read only the matching section of:

- `30-delegation-prompts.md`

### Need to update governance or record a failure

Read:

- `40-maintenance-protocol.md`
- `LESSONS.md`
- the affected normative file

Back up first. Classify the change before editing.

### Need theoretical or product-source support

Read:

- `REFERENCES.md`

Then verify current implementation-sensitive facts against the linked primary source.

### Need to recover from drift

Read:

- `90-letter-to-future-sessions.md`
- latest file under `reviews/`
- `SESSION-SUMMARY.md`

Run the validator before adding new rules.

## Precedence

When active instructions conflict, use this order:

1. platform, system, organization, and tool-enforced policy;
2. the user's current explicit request and granted authority;
3. the closest scoped `AGENTS.md` or `CLAUDE.md` for the edited subtree;
4. root `AGENTS.md` for OpenClaw repository behavior and project policy;
5. root `CLAUDE.md` for Claude-specific routing and universal execution boundaries;
6. normative governance files in this directory;
7. task skills and templates within their stated scope;
8. examples, lessons, reference commentary, and historical backups.

Additional rules:

- A more specific path rule beats a general rule only within that path and only if it does not violate a higher authority.
- An explicit current user authorization beats a default “ask first” rule for the same action; record the authorization rather than asking again.
- Current verified source or runtime behavior beats stale memory or examples.
- A template does not override its task's acceptance criteria.
- Historical backups never act as current policy.
- If two same-level normative rules prescribe incompatible actions for the same trigger, stop the affected action, report the contradiction, and repair governance under `40-maintenance-protocol.md`.

## Stable roles versus current models

The durable contract is role-based:

- mechanical explorer;
- substantive worker;
- architecture/judgment model;
- deterministic test verifier;
- independent semantic reviewer;
- rubric-based decision judge.

Current model aliases implement those roles but may change. No critical workflow may require Fable or any single optional model. Sonnet-level execution plus explicit contracts and independent proof is the portability floor.

## Minimal operating loop

```text
classify task and risk
→ load smallest relevant instructions
→ delegate high-volume work with goal/acceptance/report contract
→ synthesize evidence, not raw process
→ execute or edit within explicit ownership
→ run claim-matched deterministic proof
→ fresh-context adversarial review
→ repair and rerun
→ durable read-back
→ report changes, proof, gaps, and resume path
```

## Definition of healthy governance

The system is healthy when:

- root `CLAUDE.md` remains a small router;
- future sessions can execute rules without relying on hidden reasoning;
- workers return compressed evidence with exact paths;
- model escalation follows observable signals;
- authoring and final verification are separated when risk warrants it;
- recurring failures become tests, validators, or curated lessons;
- stale rules are retired;
- subjective and underspecified decisions reach the user rather than being disguised as model certainty;
- added complexity demonstrates measured value and has a rollback.

## Validation

Run from repository root:

```bash
node scripts/validate-agent-governance.mjs
```

The validator checks structural invariants only. A pass does not replace a fresh semantic review, code tests, real execution, or human judgment.
