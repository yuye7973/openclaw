# Maintenance Protocol for Agent Governance

**Status:** normative  
**Version:** 1.0  
**Date:** 2026-07-10  
**Owner:** repository maintainers; routine upkeep may be performed by a Claude lead under this protocol

This protocol keeps the governance system useful without letting it grow into an unreviewable prompt archive. It applies to `CLAUDE.md`, `.claude/agents/*.md`, `docs/agent-governance/**`, and `scripts/validate-agent-governance.mjs`.

## 1. Change classes

Classify the proposed change before editing.

### Class 0 — factual repair

Examples:

- fix a broken path, typo, invalid frontmatter field, or stale link;
- align a command with the current repository-prescribed command;
- repair a contradiction without changing intended policy;
- refresh a dated model/tool name while preserving the same routing role.

The lead may proceed autonomously after verification.

Required proof:

- authoritative source or repository evidence;
- backup of every existing file before modification;
- governance validator;
- fresh-context read-back of the affected rule.

### Class 1 — clarification or lesson promotion

Examples:

- add a concrete trigger, acceptance criterion, or positive/negative example;
- add a lesson from an observed failure;
- merge duplicate wording without changing precedence;
- strengthen a deterministic validator around an existing rule.

The lead may proceed autonomously when the change preserves policy meaning and has a concrete failure/evidence trail.

Required proof:

- lesson record or issue showing the observed failure;
- before/after statement of meaning;
- backup, validator, and independent review;
- no increase to root startup context unless text is simultaneously removed.

### Class 2 — policy or operating-model change

Examples:

- change model escalation thresholds, default effort, or delegation triggers;
- change what “done” means;
- alter verifier independence, report contracts, memory admission, or lesson retirement;
- add a new normative governance document;
- change precedence between `CLAUDE.md`, `AGENTS.md`, scoped rules, or skills.

Ask the user or designated governance owner before editing. Present:

1. the failure or opportunity;
2. the smallest proposed policy delta;
3. expected benefit and new failure modes;
4. migration impact on current agents and validators;
5. rollback path.

### Class 3 — authority, safety, or irreversible change

Examples:

- expand tool permissions, network access, secret access, or autonomous mutation;
- authorize external messages, releases, publishing, deletion, spending, or credential changes;
- weaken security, privacy, compatibility, or independent verification gates;
- delete or retire a hard rule without an equivalent guard;
- make Fable, Opus, a proprietary MCP server, or any one vendor capability mandatory;
- change public product behavior, protocol version, dependency ownership, or release policy.

Explicit user/owner approval is mandatory. A high-risk independent reviewer and deterministic proof are also mandatory. Absence of objection is not approval.

## 2. Before editing any existing file

1. Re-fetch the current file from the durable repository and record its blob/commit identity.
2. Create a dated backup under `docs/agent-governance/backups/YYYY-MM-DD/` before the first edit.
3. Add or update that date’s `BACKUP-MANIFEST.md` with source path, source identity, backup path, and restore procedure.
4. Read the nearest scoped `AGENTS.md` and this protocol.
5. Define acceptance criteria and the proof command before writing.
6. Check for an active worker that owns the same path. Do not overlap writers.

A backup is not a paraphrase. It must preserve exact content or, for a symlink, the exact target plus the resolved target’s backed-up content.

## 3. Safe edit sequence

Use this sequence for every governance change:

```text
classify → collect evidence → define acceptance → back up → edit smallest surface
→ run deterministic validator → fresh-context adversarial review
→ repair → rerun validator/review → read back durable files → update lesson/handoff
```

Do not combine unrelated policy changes merely because they touch the same file. One change should have one reason and one rollback story.

## 4. Files the lead may update autonomously

Subject to Class 0 or 1 rules, the lead may update:

- examples and clarifications in `20-judgment-rubric.md` and `30-delegation-prompts.md`;
- observed lessons in `LESSONS.md`;
- source dates and factual annotations in `REFERENCES.md`;
- validator checks that encode an already-approved rule;
- subagent descriptions, allowed read-only tools, and report wording when the authority boundary does not expand;
- index and navigation text in `README.md`;
- the future-session letter’s status/unfinished-work section;
- broken paths caused by verified non-behavioral repository moves.

The lead may compact duplicated prose outside root `CLAUDE.md` when no rule, example class, or exception is lost.

## 5. Files or changes requiring approval

Ask before:

- changing root `CLAUDE.md` hard rules, precedence, or stop conditions after this baseline;
- changing root `AGENTS.md` project policy;
- adding active `@path` imports to `CLAUDE.md`;
- raising or lowering model/effort defaults for a task class;
- enabling worker memory, unrestricted Bash, new MCP servers, background mutation, or broader permissions;
- altering any Class 2 or 3 policy;
- deleting a normative document, lesson evidence, backup, or validator gate;
- converting the root router back into a symlink or loading the full `AGENTS.md` at every startup;
- changing release, security, data retention, external action, or compatibility authority.

If the current user request explicitly grants the needed authority, record the exact grant in the change note; do not ask again.

## 6. Lesson lifecycle

`docs/agent-governance/LESSONS.md` is a curated prevention ledger, not a chronological diary.

### Admission rule

Add a lesson only when all are present:

- a concrete failure, near miss, user correction, or review finding;
- evidence that identifies the trigger;
- a reusable root cause rather than a one-off symptom;
- a prevention rule, test, validator, or routing change;
- an owner and review date.

Do not admit preferences, speculative risks, generic advice, raw transcripts, or unsupported self-criticism.

### Lesson format

```markdown
## L-YYYY-NNN — Short failure class

- Status: CANDIDATE | ACTIVE | MERGED | RETIRED
- Observed: YYYY-MM-DD
- Trigger: observable condition
- Evidence: path:line, test, run, issue, or source
- Failure: what happened or nearly happened
- Root cause: reusable causal statement
- Prevention: executable rule/check
- Enforcement: validator/test/hook/reviewer/manual gate
- Affected files: paths
- Owner: role or person
- Review by: YYYY-MM-DD
- Supersedes / merged into: ID or NONE
```

### Promotion

- `CANDIDATE`: first observed event; prevention drafted but not yet replayed.
- `ACTIVE`: severe one-time event or prevention proved on a replay/second occurrence.
- `MERGED`: rule incorporated into a more general active lesson; retain cross-reference.
- `RETIRED`: underlying system no longer exists or a stronger deterministic guard makes the prose lesson unnecessary; retain reason and evidence.

A model may promote a lesson autonomously only when a deterministic replay proves the prevention. Subjective lessons require user/owner confirmation.

## 7. Compaction and decay control

Run a compaction review when any trigger fires:

- `LESSONS.md` exceeds 40 entries or 12,000 words;
- any normative governance file exceeds 400 nonblank lines;
- root `CLAUDE.md` exceeds 80 nonblank lines;
- two active rules cover the same trigger/action;
- a model/tool field has not been verified for 90 days;
- at least once per calendar quarter while the harness is in active use.

Compaction procedure:

1. group lessons by failure class;
2. merge duplicates into the narrowest general prevention rule;
3. preserve IDs and evidence links;
4. move detailed retired/merged records to `docs/agent-governance/lessons/archive/YYYY.md`;
5. retain a one-line tombstone in `LESSONS.md`;
6. remove examples only when another example covers the same misreading;
7. rerun the validator and adversarial review.

Never compact by replacing executable criteria with abstract phrases such as “use good judgment,” “be careful,” or “maintain quality.”

## 8. Source and model freshness

Every 90 days, or when a named model/tool fails:

- verify current Claude Code frontmatter, model aliases, effort values, memory behavior, permissions, and worktree semantics against official documentation;
- test every `.claude/agents/*.md` definition with the current CLI where available;
- mark unsupported names as deprecated and add a portable fallback before removal;
- update `REFERENCES.md` with the checked date;
- do not silently map a stronger-model role to a weaker model without changing acceptance or review requirements.

Model names are implementation details; task roles and proof obligations are the stable contract.

## 9. Validation and review requirements

Minimum proof by change class:

| Class | Deterministic validator | Fresh semantic review | User/owner approval | Real execution |
|---|---:|---:|---:|---:|
| 0 | required | affected file | no | when behavior/tool syntax changed |
| 1 | required | required | no | lesson replay when available |
| 2 | required | Opus or independent strong reviewer | required | representative scenario |
| 3 | required | high-risk independent review | explicit required | closest real environment before adoption |

Review output must be written under `docs/agent-governance/reviews/` when it changes a normative rule. A clean result records scope, checks, accepted/rejected findings, and remaining limits.

## 10. Rollback

Rollback is required when:

- the router no longer loads or routes correctly;
- a supported workflow becomes impossible without an optional model/tool;
- token/context use materially increases without measured benefit;
- a new rule causes repeated unnecessary questions or blocks authorized work;
- validation passes but two real sessions misinterpret the same rule;
- permissions or external-action boundaries become ambiguous.

Restore from the dated backup, rerun validation, record the failed change as a lesson candidate, and propose a smaller correction. Do not patch forward indefinitely around a bad governance design.

## 11. Change note template

Use in the commit/PR description or review artifact:

```text
Governance class: 0 | 1 | 2 | 3
Observed trigger:
Policy delta:
Files backed up:
Acceptance criteria:
Deterministic proof:
Independent review:
New authority or permissions: NONE | details
Known limits:
Rollback path:
```

## 12. Maintenance definition of done

A governance maintenance task is complete only when:

- the change class and authority are recorded;
- backups predate edits and can restore exact state;
- all references and routed paths exist;
- no active contradiction remains;
- the validator passes;
- a fresh reviewer has no accepted actionable finding;
- every changed file has been read back from the repository;
- lessons and future-session handoff are updated when applicable;
- root startup context did not grow without explicit approval and measured reason.
