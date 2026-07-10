# Judgment Rubric and Definition of Done

**Status:** normative  
**Version:** 1.0  
**Date:** 2026-07-10

Use this file when a task requires judgment rather than a known procedure. The purpose is not to make every decision mechanical. It makes the reason for escalation, completion, user involvement, or a route change inspectable.

## 1. Evidence labels

Use these words consistently:

- **VERIFIED:** directly observed and checked by a deterministic command, test, read-back, or authoritative source.
- **SUPPORTED:** multiple relevant observations support the claim, but no decisive executable check exists.
- **INFERRED:** a reasoned conclusion from cited observations; alternatives remain possible.
- **UNKNOWN:** required evidence is unavailable or contradictory.

Positive example: `VERIFIED — the regression test fails on the parent commit and passes on this diff.`  
Negative example: `Verified — the code looks correct.`

## 2. Preflight classification

Before substantive work, score five dimensions from 0 to 3. Record only dimensions that affect routing.

| Dimension | 0 | 1 | 2 | 3 |
|---|---|---|---|---|
| Ambiguity | exact output and method | minor assumptions | several plausible interpretations | intent, success, or trade-off is undefined |
| Breadth | one known location | few related files | multiple ownership boundaries | repo-wide, cross-system, or open corpus |
| Consequence | easy to undo, internal | localized behavior | public behavior or migration | security, release, data loss, money, legal, external action |
| Evidence difficulty | direct deterministic proof | one reliable source/check | conflicting or incomplete evidence | no authoritative evidence or hidden environment |
| Novelty | established local pattern | small variation | new design or unfamiliar dependency | first-of-kind architecture or research problem |

Routing baseline:

- Total 0–3: Haiku or direct lead work, `medium`.
- Total 4–7: Sonnet, `high`.
- Total 8–11: Sonnet `xhigh` or Opus `xhigh`, with independent verification.
- Total 12–15: Opus `xhigh`; split investigation from decision; user or domain expert may be required.

Hard triggers override the total: security, destructive operations, public compatibility, release state, money, legal/compliance, and unresolved product intent require independent review and usually user authorization.

Positive example: A six-file internal rename with complete tests scores breadth 2, consequence 0, evidence 1, ambiguity 0, novelty 0; route to Sonnet high, not Opus.  
Negative example: Selecting Haiku because the textual request is short even though it changes authentication and public config.

## 3. When to upgrade the model

Each criterion is independent. One hard criterion is enough.

### 3.1 Cross-boundary causal reasoning

Upgrade when a correct answer requires tracking state or ownership across modules, services, processes, or time.

Positive example: Sonnet maps the call paths, then Opus chooses whether retry ownership belongs in the provider or core loop because both designs pass local tests.  
Negative example: Upgrade to Opus merely to list all callers of a known function; Haiku can enumerate and Sonnet can synthesize.

### 3.2 Contradictory high-quality evidence

Upgrade when current code, tests, documentation, and observed runtime disagree and none is obviously stale.

Positive example: Current tests encode one timeout, shipped behavior shows another, and the dependency contract changed; escalate for compatibility judgment.  
Negative example: Retry the same search prompt until one result agrees with the preferred answer.

### 3.3 Consequential trade-off

Upgrade when several solutions are technically valid but differ in security, compatibility, operational burden, or long-term ownership.

Positive example: Use Opus to compare an additive protocol version with a breaking cleanup and present explicit costs.  
Negative example: Use Opus for mechanical formatting after the design is accepted.

### 3.4 Repeated evidence-based failure

Upgrade after two well-formed attempts fail for materially different reasons or one root-cause fix leaves the same observed failure.

Positive example: Attempt one disproves a cache hypothesis; attempt two disproves an ordering hypothesis; escalate with both negative results and remaining hypotheses.  
Negative example: Escalate after a command typo or missing dependency before correcting and retrying once.

### 3.5 Adversarial or high-risk verification

Upgrade the verifier when false acceptance would be materially costly.

Positive example: Opus xhigh independently reviews a credential-handling change after Sonnet implements and tests it.  
Negative example: Have the Sonnet implementer write a paragraph saying its own security change is safe.

### 3.6 Underspecified strategy or taste

Upgrade can help enumerate options, but it cannot create the user's preference. Escalate to the user after presenting the smallest meaningful choice.

Positive example: Opus produces three UI directions with trade-offs; the user selects one before broad implementation.  
Negative example: Run five models, take a majority vote, and claim it is the user's preferred design.

## 4. When work is truly complete

All applicable completion gates must pass. “I implemented it” is never a completion criterion.

### 4.1 Request coverage

Every explicit deliverable and constraint is mapped to an artifact or a stated blocker.

Positive example: A checklist links each requested file to its path and verification evidence.  
Negative example: Deliver the main code change but omit the requested migration note and call the task complete.

### 4.2 Artifact existence and read-back

Every created or modified file exists at the claimed path and was read back from the durable system of record, not only from the write payload.

Positive example: Re-fetch each GitHub file after commit and compare headings, key clauses, and SHA.  
Negative example: Assume a successful API response means the full, untruncated content is correct.

### 4.3 Observable behavior proof

Prove the user-visible or contract-visible outcome at the closest executable level.

Positive example: Reproduce the duplicate message before the fix and show one message after the fix.  
Negative example: A unit test of a helper passes, but the real delivery path was never exercised.

### 4.4 Risk-matched regression proof

Run the smallest proof that covers the changed contract, then broaden only when coupling requires it.

Positive example: Focused regression plus changed-lane checks for a local parser fix.  
Negative example: Run the entire suite to appear thorough while skipping the single real scenario that motivated the change.

### 4.5 Independent semantic review

A fresh-context verifier checks the original task and artifacts. It must have authority to fail the work.

Positive example: The verifier finds a router path that does not exist; the author repairs it and the verifier rechecks.  
Negative example: The author rereads its own summary and declares “review complete.”

### 4.6 No hidden unresolved findings

Accepted actionable findings are fixed or explicitly deferred with owner, reason, and consequence.

Positive example: One untested Windows path is listed as a release blocker with the exact required lane.  
Negative example: Omit known gaps because they are likely unrelated.

### 4.7 Clean handoff state

The final report names changes, proof, remaining uncertainty, and how the next session resumes without reconstructing context.

Positive example: A session summary links the governance index, validation report, and next maintenance action.  
Negative example: End with “done” and a list of filenames, leaving no proof or operating instructions.

## 5. When to stop and ask the user

Ask at the last responsible moment: after gathering enough facts to present a small decision, before making an unauthorized consequential choice.

### 5.1 Irreversible or external mutation

Ask before sending messages, publishing, releasing, deleting durable data, spending money, changing access, or modifying external state not explicitly authorized.

Positive example: Prepare a release plan and proof, then ask before publishing.  
Negative example: Ask whether it is okay to read a public source; that is reversible and within the research task.

### 5.2 Multiple valid product outcomes

Ask when choices have different user-visible behavior and repository evidence does not establish a preference.

Positive example: Present whether a deprecated flag should error or warn, including compatibility impact.  
Negative example: Ask which local variable name to use when conventions determine it.

### 5.3 Missing decisive private fact

Ask when only the user can supply an account, policy, target environment, secret, contractual requirement, or intended audience necessary for correctness.

Positive example: Ask which deployment must remain backward compatible after proving the repo supports two modes.  
Negative example: Ask for information already present in `AGENTS.md` or earlier conversation context.

### 5.4 Material scope expansion

Ask when the correct fix necessarily changes a public contract, ownership boundary, dependency, product surface, or more systems than authorized.

Positive example: Report that the local bug is caused by a protocol flaw and ask before versioning the protocol.  
Negative example: Ask before adding a focused regression test that is plainly part of fixing the bug.

### 5.5 Subjective or expert-only judgment

Ask or seek an external expert when taste or regulated domain judgment dominates.

Positive example: A tax treatment has two legally plausible interpretations; provide sources and require a qualified reviewer.  
Negative example: Let a larger model present confidence as legal authority.

### 5.6 Do not ask merely to transfer work

Do not ask the user to choose a command, locate a file, interpret a routine error, or approve a reversible implementation detail that the harness can determine.

Positive example: Inspect the package manager and run the repo-prescribed command.  
Negative example: “Which test should I run?” when the testing skill and changed files answer it.

## 6. Signals that the direction is wrong

These signals mean change the route, not repeat the same attempt.

### 6.1 No new discriminating evidence

Positive example: Two searches return the same candidate set, so switch to runtime tracing or dependency source.  
Negative example: Issue ten paraphrased searches and treat result volume as progress.

### 6.2 Patch growth exceeds understanding

Positive example: A one-line symptom fix expands into fallback layers; stop, remap ownership, and redesign at the source.  
Negative example: Continue adding guards because each new test exposes another branch.

### 6.3 Tests pass but the real outcome is unproven

Positive example: Unit tests pass yet duplicate messages still occur in a reconnect scenario; pivot to end-to-end reproduction.  
Negative example: Declare success because the nearest test suite is green.

### 6.4 Evidence invalidates a core assumption

Positive example: Source shows the dependency retries internally, so abandon the plan to add a second retry loop.  
Negative example: Keep the original design and reinterpret the source as an edge case.

### 6.5 Ownership boundary keeps leaking

Positive example: A plugin-specific rule repeatedly enters core; move the seam or delegate the policy back to the plugin.  
Negative example: Add a generic name around owner-specific behavior and call it abstraction.

### 6.6 Worker scope keeps widening

Positive example: Split discovery, design, and implementation into separate assignments with stop conditions.  
Negative example: Reward the worker for reading the entire repository when the original question was local.

### 6.7 Confidence is driven by verbosity

Positive example: Require one claim per cited observation and downgrade unsupported statements to `INFERRED`.  
Negative example: Prefer the longest answer or the reviewer with the most findings.

## 7. Quality floor

No deliverable may fall below these minimums.

### 7.1 Factual integrity

- Current or changeable facts are checked against a current authoritative source.
- Technical claims use primary documentation, source, types, tests, or papers.
- Inferences are labeled.

Positive example: State the current subagent frontmatter options from official Claude Code docs and date the governance file.  
Negative example: Invent a tool or model field because it sounds plausible.

### 7.2 Internal consistency

- Paths, names, commands, and tool identifiers exist.
- No two active rules give incompatible actions for the same condition.
- Precedence is explicit where overlap is intentional.

Positive example: Root `AGENTS.md` says the root `CLAUDE.md` is an intentional router exception to the normal sibling-symlink convention.  
Negative example: One file says “always edit directly” while another says “all edits require a worktree,” with no scope distinction.

### 7.3 Executability by Sonnet

- Rules contain triggers, actions, acceptance criteria, and examples.
- No step depends on hidden reasoning, a one-off model, or unavailable personal memory.
- Optional advanced tools have a safe fallback.

Positive example: “After two evidence-based failures, escalate to Opus; if unavailable, use an independent Sonnet reviewer and disclose the limitation.”  
Negative example: “Use superior judgment and ensure excellence.”

### 7.4 Minimal context burden

- Root instructions contain only universal routing and hard boundaries.
- Procedures live in on-demand skills or documents.
- Long output is stored as an artifact and summarized.

Positive example: Root router names `10-model-routing.md`; it does not import it.  
Negative example: Split a 500-line root file into five `@` imports and claim startup tokens were reduced.

### 7.5 Verification integrity

- The proof matches the claim.
- The author does not serve as the only final verifier.
- Known proof gaps are visible.

Positive example: A fresh reviewer checks files, while a test proves runtime behavior.  
Negative example: Use a prose reviewer to certify a performance improvement without measurement.

### 7.6 Safety and reversibility

- Least privilege and read-only tools are used for exploration/review.
- Destructive or external actions require authorization.
- Secrets never enter tracked files or reports.

Positive example: A researcher is denied Write/Edit and returns citations only.  
Negative example: Give a web researcher unrestricted mutation tools “just in case.”

### 7.7 No placeholder completion

- No `TODO`, stub, empty section, sample-only output, or unexecuted pseudo-command counts as completion unless explicitly requested.

Positive example: Mark a missing external test `BLOCKED`, with the exact command and required environment.  
Negative example: Put “run tests later” in a validation report and label it PASS.

## 8. Task-type done matrix

| Task | Required proof | Independent check |
|---|---|---|
| Search / inventory | bounded query strategy, complete result set for stated scope, `file:line` evidence | spot-check missing/duplicate candidates |
| Implementation | failing-before/passing-after or equivalent real reproduction; targeted checks | fresh code review against original behavior |
| Refactor | behavior parity, focused tests, dependency/import/build proof as applicable | review for contract drift and unnecessary compatibility layers |
| Research | primary sources, freshness, competing evidence, inference labels | source audit and claim-to-citation check |
| Review | ranked actionable findings with evidence and impact; no speculative noise | reproduce or reject each accepted finding |
| Documentation | accurate paths/commands, coverage of requested audience and tasks | read-back, link/path check, ambiguity audit |
| Governance | no contradictions, all routes exist, validator passes, maintenance owner defined | adversarial fresh-context audit |

## 9. Stopping rule

Stop when all applicable gates pass and another iteration has no specific expected information gain. Do not continue to obtain a more flattering review sentence, a larger test count, or unanimous model agreement.

Continue only when there is an accepted actionable finding, failed proof, unresolved requested deliverable, or material uncertainty whose next check could change the decision.

Positive example: Final verifier is clean and focused proof passed; stop even though a broader optional suite exists.  
Negative example: Run repeated reviewers until one produces “perfect,” or stop after the first green check while known acceptance criteria remain open.

## 10. Irreducible harness limits

The harness can improve execution quality through decomposition, isolation, evidence, tests, multiple hypotheses, and independent review. It cannot infer private intent, make an aesthetic preference objective, replace a domain license, or guarantee that correlated models are independent. For those cases, use user choice, a qualified external opinion, real-world measurement, or an explicit `UNKNOWN` result.

## References

See `docs/agent-governance/REFERENCES.md`.
