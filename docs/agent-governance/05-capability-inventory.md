# Harness Capability Inventory

**Status:** observed and source-verified baseline  
**As of:** 2026-07-10  
**Scope:** repository-visible configuration plus capabilities confirmed in current official Claude Code documentation

Never infer machine-local or organization-managed capability from this file. Re-discover the effective environment at session start when a task depends on it.

## Repository state observed

| Surface | Observed baseline | Consequence |
|---|---|---|
| Root Claude entry | `CLAUDE.md` was a symlink to root `AGENTS.md` | Every Claude session received the full generic repository instruction set before routing |
| Root generic policy | `AGENTS.md`, about 185 lines | Remains authoritative for architecture, commands, tests, PR/release/security/platform work |
| Scoped instruction pattern | Root policy requires nearest scoped `AGENTS.md`; new scoped pairs normally add a sibling `CLAUDE.md` symlink | The new regular root router is an explicit existing-root exception, not a change to scoped pairs |
| Existing workflows directly inspected | `.agents/skills/openclaw-testing/SKILL.md`, `.agents/skills/autoreview/SKILL.md` | Route to specialized procedures instead of copying them into startup context |
| Project Claude settings | no `.claude/settings.json` observed at baseline | This package does not silently add permissions, hooks, environment variables, or model defaults |
| Project MCP config | no `.mcp.json` observed at baseline | This package does not silently connect tools or external services |
| Project subagents before this package | no project `.claude/agents/` definitions observed | New roles may require a Claude Code restart if the directory did not exist when the process started |
| Shared governance lessons | no reviewed repository ledger observed | `LESSONS.md` begins with evidence from this installation rather than invented history |

## Current Claude Code contract verified from official documentation

### Models

Portable subagent aliases currently include:

- `haiku`
- `sonnet`
- `opus`
- `fable`
- `inherit`

Full model IDs are accepted, but aliases are more portable. Availability can be constrained by provider, organization allowlist, account, or invocation. A meaningful fallback must be disclosed when model identity affects cost or review confidence.

Stable policy is role-based, not model-name-based:

- Haiku: bounded mechanical retrieval and exact checks;
- Sonnet: normal investigation, implementation, refactor, and research;
- Opus: consequential architecture, adversarial review, and candidate judgment;
- Fable: optional long-horizon capability, never a required dependency.

### Effort

Subagent frontmatter currently supports:

- `low`
- `medium`
- `high`
- `xhigh`
- `max`

Available levels depend on the selected model. Claude Code may fall back to the highest supported level at or below the request. This package uses `high` for substantive execution and `xhigh` for consequential judgment/refactor/review. It does not make `max` a default because official guidance warns of diminishing returns and overthinking.

### Reusable subagent fields

Current documented fields include `name`, `description`, `tools`, `disallowedTools`, `model`, `permissionMode`, `maxTurns`, `skills`, `mcpServers`, `hooks`, `memory`, `effort`, `background`, `isolation`, `initialPrompt`, and `color`.

This package uses only the smallest required subset:

- identity and delegation description;
- explicit tool allowlist/denylist;
- model and effort;
- permission mode;
- turn limit.

It intentionally does **not** enable by default:

- `memory`: persistent subagent memory creates a durable write channel and needs a separate retention/provenance decision;
- `isolation: worktree`: worktree base and uncommitted-state semantics must be verified for the actual task;
- `mcpServers`: no new external capability was authorized;
- `hooks`: no new interceptor code was authorized;
- preloaded `skills`: avoid injecting task procedures into every role invocation without measured need;
- experimental agent-team behavior: delegation contracts and independent proof are the portable baseline.

### Permissions are not a sandbox

`permissionMode: plan` and tool allowlists reduce reachable operations, but parent modes can affect child behavior, and `Bash` can write indirectly. A security claim of hard read-only behavior requires omission of mutation-capable tools plus an OS sandbox, hook/interceptor, or equivalent enforced boundary. Prose and frontmatter alone are behavioral controls, not a security proof.

### Built-in tool names used here

The project roles use documented built-in names:

- `Read`, `Grep`, `Glob`, `Bash`
- `WebSearch`, `WebFetch`
- `Write`, `Edit`

Workers are not granted an orchestration tool by default. The lead owns delegation. No role inherits arbitrary MCP capability merely because a server is installed.

## Bootstrap execution environment observed

These observations describe only the environment used to install this governance package:

| Capability | Result |
|---|---|
| Local `claude` CLI | unavailable |
| Local `codex` CLI | unavailable |
| Local `gh` CLI | unavailable |
| Direct network clone/download from the shell | unavailable due DNS/network restriction |
| Connected GitHub repository read | available |
| Connected GitHub repository write | available |
| Local Node.js | available for syntax and structural validation |
| True fresh-context Claude subagent runtime | not exposed to this installation session |

The last limitation matters: deterministic checks and an adversarial self-audit can be completed here, but they are not honestly equivalent to a separate Claude context. The repository includes `fresh-reviewer` and a review packet so the first Claude Code session with Agent support can run the missing independent audit.

## Roles installed

| Agent | Model | Effort | Purpose |
|---|---|---|---|
| `repo-explorer` | Haiku | high | bounded exact repository inventory and call-path evidence |
| `researcher` | Sonnet | high | current primary-source research and source audit |
| `implementer` | Sonnet | high | bounded implementation and regression proof |
| `refactorer` | Sonnet | xhigh | ownership-correct bounded refactor |
| `test-verifier` | Sonnet | high | deterministic proof without source edits |
| `fresh-reviewer` | Opus | xhigh | independent adversarial acceptance review |
| `decision-judge` | Opus | xhigh | rubric-based comparison of genuinely different candidates |

If Opus is unavailable, use an independent Sonnet `xhigh` reviewer, strengthen deterministic or external proof, and disclose that the review path is weaker. Do not silently claim equivalence.

## Session discovery checklist

Before relying on a capability:

1. inspect the effective Claude Code version and model allowlist;
2. inspect project, local, user, and managed settings precedence;
3. list project/user/plugin subagents and detect duplicate names;
4. list active skills and read only the required one;
5. list MCP servers and defer unused tool surfaces;
6. inspect parent permission and sandbox mode;
7. confirm git branch, dirty state, and worktree base;
8. run `node scripts/validate-agent-governance.mjs` after governance changes;
9. state unavailable or inherited capability instead of inventing it.

## Primary sources

- Claude Code subagents: `https://code.claude.com/docs/en/sub-agents`
- Claude Code memory and rules: `https://code.claude.com/docs/en/memory`
- Claude Code model configuration: `https://code.claude.com/docs/en/model-config`
- Claude Code cost guidance: `https://code.claude.com/docs/en/costs`
- Claude Code security: `https://code.claude.com/docs/en/security`
