---
paths:
  - CLAUDE.md
  - .claude/agents/**/*.md
  - .claude/rules/agent-governance.md
  - docs/agent-governance/**
  - scripts/validate-agent-governance.mjs
---

# Agent governance edit rule

Before editing any matched path:

1. Read `docs/agent-governance/40-maintenance-protocol.md`.
2. Read the durable current file, not a prior summary.
3. Back up every pre-existing file before modification and record its SHA or version in the dated backup manifest.
4. Name the concrete failure, changed external contract, or requested objective. Do not edit governance merely to “improve quality.”
5. Put the change in the narrowest correct layer: root router, scoped rule, agent, skill, rubric or template, deterministic guard, or lesson.
6. Preserve the root router budget: at most 80 nonblank lines, no active `@path` import, universal routing only.
7. Keep every project agent explicit about `model`, `effort`, permissions, acceptance, stopping, escalation, and return format.
8. Add or update a validator check, eval case, example, or source that would catch the regression.
9. Run `node scripts/validate-agent-governance.mjs` and relevant evals.
10. Obtain a fresh-context, read-only review for substantive changes. The author cannot be the only final verifier.
11. Read every changed file back from the durable system after writing.
12. Update the governance change record. Add a lesson only when the admission criteria are met.

Ask the user before enabling project settings, hooks, MCP servers, plugins, persistent agent memory, agent teams, broader permission modes, higher default model cost, or any weaker proof or safety gate.

If a required check cannot run, return `PARTIAL` or `BLOCKED` with the exact missing capability. Never relabel an unverified change as complete.
