# Agent Governance References

**Status:** reference, not an instruction file  
**Last checked:** 2026-07-10

Use primary and official sources for implementation-sensitive claims. This bibliography records why each source affected the governance design; it does not make every result universally true outside the studied setting.

## Claude Code: current product contracts

### Memory and `CLAUDE.md`

- Source: `https://code.claude.com/docs/en/memory`
- Used for: instruction-file loading, `@path` imports, scoped memory, auto-memory, and guidance that large instruction files consume context and reduce adherence.
- Policy derived: root `CLAUDE.md` is a short router; long governance documents are routed on demand and are not imported at startup; project-tracked lessons do not rely on machine-local auto-memory.
- Recheck when: Claude Code changes instruction discovery, import semantics, auto-memory limits, or precedence.

### Subagents

- Source: `https://code.claude.com/docs/en/sub-agents`
- Used for: project agent location and frontmatter fields such as `name`, `description`, `tools`, `disallowedTools`, `model`, `permissionMode`, `maxTurns`, `skills`, `mcpServers`, `hooks`, `memory`, `background`, `isolation`, and `effort`; model-selection precedence; context isolation; worktree behavior.
- Policy derived: reusable workers name model and effort, use least privilege, return bounded reports, and do not assume that a worktree inherits an uncommitted parent state.
- Recheck when: an agent definition fails to load or any supported field changes.

### Model configuration and effort

- Source: `https://code.claude.com/docs/en/model-config`
- Used for: current aliases, effort values, environment/setting precedence, and warnings that maximal effort can overthink or have diminishing returns.
- Policy derived: role-based model routing, explicit effort, `max` only for exceptional decisions with a stopping condition, and a portable fallback when a named model is unavailable.
- Recheck when: models are added/retired, aliases change, or effort support changes.

### Cost and context management

- Source: `https://code.claude.com/docs/en/costs`
- Used for: model-cost trade-offs, context use, compacting, and using lower-cost models for simple subagent tasks.
- Policy derived: Haiku handles bounded mechanical work; lead context contains conclusions rather than raw retrieval; escalation is triggered by evidence, not prestige.

### Security and permissions

- Source: `https://code.claude.com/docs/en/security`
- Used for: permission controls, least privilege, and protecting credentials and external actions.
- Policy derived: explorers/reviewers are read-only where possible; mutation and high-risk permissions require explicit authority; secrets do not enter tracked files, reports, or memory.

### CLI reference

- Source: `https://code.claude.com/docs/en/cli-reference`
- Used for: current CLI flags such as model selection, agent definitions, permission modes, and worktrees.
- Policy derived: commands and model/tool names are verified before becoming normative; worktree base semantics are not guessed.

## Agent interfaces and orchestration

### Model Context Protocol architecture

- Source: `https://modelcontextprotocol.io/docs/learn/architecture`
- Used for: the distinction among tools, resources, and prompts, and the cost/safety implications of exposing capabilities to a model.
- Policy derived: load specialized MCP capability only for the worker that needs it; discover tools before naming them in a critical procedure; prefer a smaller trustworthy interface when equivalent.

### MCP specification

- Source: `https://modelcontextprotocol.io/specification/latest`
- Used for: protocol-level contracts and current capability semantics.
- Policy derived: MCP behavior is an external dependency contract and must not be guessed from names or prior versions.

### Anthropic multi-agent research system

- Source: `https://www.anthropic.com/engineering/multi-agent-research-system`
- Used for: separate worker contexts, lead-worker orchestration, parallel research, and the relationship between token use and difficult research performance.
- Policy derived: delegate high-volume independent search and compress returns; reserve multi-agent work for tasks whose value justifies its cost; do not infer that more agents always improve outcomes.

### Anthropic agent evaluation guidance

- Source: `https://www.anthropic.com/engineering/demystifying-evals-for-ai-agents`
- Used for: deterministic checks, production monitoring, LLM-as-judge, and human evaluation as complementary proof types.
- Policy derived: completion requires proof matched to the claim; semantic review cannot replace execution; subjective outcomes need human calibration.

### Anthropic Agent Skills

- Source: `https://www.anthropic.com/engineering/equipping-agents-for-the-real-world-with-agent-skills`
- Used for: progressive disclosure and keeping task procedures out of always-loaded context.
- Policy derived: skills own specialized workflows; root instructions own routing and hard boundaries.

### Evaluator-optimizer workflow

- Source: `https://www.anthropic.com/engineering/building-a-c-compiler-with-a-team-of-parallel-claudes`
- Used for: iterative generation, evaluation, repair, and parallel agents in a concrete engineering project.
- Policy derived: separate executor and verifier roles for consequential work, but stop when no accepted actionable issue remains rather than reviewing indefinitely.

## Research translated into operational policy

### ReAct: reasoning interleaved with action

- Paper: Shunyu Yao et al., “ReAct: Synergizing Reasoning and Acting in Language Models.”
- Source: `https://arxiv.org/abs/2210.03629`
- Used for: grounding reasoning through environment interactions rather than relying only on internal generation.
- Policy derived: workers cite observations and run checks; the harness values external evidence over confident unexecuted plans.
- Limit: benchmark gains do not prove that every long tool trace is useful; report compression still applies.

### Reflexion: feedback and episodic learning

- Paper: Noah Shinn et al., “Reflexion: Language Agents with Verbal Reinforcement Learning.”
- Source: `https://arxiv.org/abs/2303.11366`
- Used for: learning from feedback without weight updates.
- Policy derived: a failure may become a durable lesson only when feedback is converted into a reusable prevention rule and enforcement mechanism.
- Limit: internal reflection can preserve the same misconception; external or deterministic feedback is stronger.

### Self-Refine: iterative feedback and revision

- Paper: Aman Madaan et al., “Self-Refine: Iterative Refinement with Self-Feedback.”
- Source: `https://arxiv.org/abs/2303.17651`
- Used for: value of explicit critique/revision loops.
- Policy derived: repair after a concrete finding, then rerun the affected proof.
- Limit: stop when no specific information gain remains; self-refinement is not independent verification.

### Self-consistency

- Paper: Xuezhi Wang et al., “Self-Consistency Improves Chain of Thought Reasoning in Language Models.”
- Source: `https://arxiv.org/abs/2203.11171`
- Used for: benefits of diverse reasoning paths on tasks with a determinate answer.
- Policy derived: high-risk ambiguity may use multiple hypotheses/candidates and a rubric-based judge.
- Limit: agreement is not authority for taste, private intent, or correlated factual error.

### Multi-agent debate

- Paper: Yilun Du et al., “Improving Factuality and Reasoning in Language Models through Multiagent Debate.”
- Source: `https://arxiv.org/abs/2305.14325`
- Used for: potential gains from agents exposing competing reasoning and factual claims.
- Policy derived: use debate only when workers hold genuinely different hypotheses or evidence paths; do not add ceremonial debate to mechanical tasks.
- Limit: benchmark improvement does not guarantee independence among related models or prompts.

### LLM-as-a-judge biases

- Paper: Lianmin Zheng et al., “Judging LLM-as-a-Judge with MT-Bench and Chatbot Arena.”
- Source: `https://arxiv.org/abs/2306.05685`
- Used for: judge position, verbosity, self-enhancement, and reasoning biases, alongside observed agreement with human preferences in studied settings.
- Policy derived: written rubrics, blind labels/order when practical, claim-level evidence, and human calibration for subjective decisions.
- Limit: an LLM judge is a scalable approximation, not ground truth.

### AgentBench

- Paper: Xiao Liu et al., “AgentBench: Evaluating LLMs as Agents.”
- Source: `https://arxiv.org/abs/2308.03688`
- Used for: evaluating multi-turn agents in interactive environments and identifying long-horizon reasoning/instruction-following failures.
- Policy derived: evaluate complete task trajectories and environment outcomes, not only answer quality or local code generation.
- Limit: benchmark environments do not substitute for repository-specific acceptance tests.

### SWE-bench

- Paper: Carlos E. Jimenez et al., “SWE-bench: Can Language Models Resolve Real-World GitHub Issues?”
- Source: `https://arxiv.org/abs/2310.06770`
- Used for: the difficulty of real repository tasks that require cross-file context and execution environments.
- Policy derived: implementation tasks need repository discovery, environment interaction, and behavior proof; a plausible patch is not completion.
- Limit: benchmark headline scores are historical and should not be used as current model rankings.

## Source hierarchy

For a current technical claim, prefer in this order:

1. observed behavior in the target environment;
2. current source/types/tests or protocol specification;
3. current official documentation/release notes;
4. original peer-reviewed or preprint research for general methods;
5. reputable independent analysis;
6. secondary summaries only for discovery.

Repository memory and prior model output never outrank current contradictory evidence.

## Review schedule

Recheck current Claude Code and MCP sources at least every 90 days while active, and immediately after a CLI/model/tool failure. Academic method references are stable historical sources, but their policy interpretation should be revised when repository evidence shows a different failure mode.
