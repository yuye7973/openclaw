#!/usr/bin/env node

import { lstat, readFile, readdir } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const runCases = process.argv.includes("--run-cases");
const errors = [];
const warnings = [];
let checks = 0;

const requiredFiles = [
  "CLAUDE.md",
  "AGENTS.md",
  ".claude/rules/agent-governance.md",
  "docs/agent-governance/README.md",
  "docs/agent-governance/00-diagnosis.md",
  "docs/agent-governance/05-capability-inventory.md",
  "docs/agent-governance/05-control-loop.md",
  "docs/agent-governance/10-model-routing.md",
  "docs/agent-governance/20-judgment-rubric.md",
  "docs/agent-governance/30-delegation-prompts.md",
  "docs/agent-governance/40-maintenance-protocol.md",
  "docs/agent-governance/50-system-architecture.md",
  "docs/agent-governance/60-evaluation-protocol.md",
  "docs/agent-governance/90-letter-to-future-sessions.md",
  "docs/agent-governance/LESSONS.md",
  "docs/agent-governance/REFERENCES.md",
  "docs/agent-governance/evals/cases.jsonl",
  "docs/agent-governance/backups/2026-07-10/AGENTS.md",
  "docs/agent-governance/backups/2026-07-10/CLAUDE.md.symlink-target.txt",
  "docs/agent-governance/backups/2026-07-10/BACKUP-MANIFEST.md",
];

const requiredAgents = [
  "repo-explorer",
  "researcher",
  "implementer",
  "refactorer",
  "test-verifier",
  "fresh-reviewer",
  "decision-judge",
];

const allowedModels = new Set(["haiku", "sonnet", "opus", "fable", "inherit"]);
const allowedEfforts = new Set(["low", "medium", "high", "xhigh", "max"]);
const readOnlyAgents = new Set([
  "repo-explorer",
  "test-verifier",
  "fresh-reviewer",
  "decision-judge",
]);

const caseOracle = {
  "route-001": ["delegate", "haiku", "medium"],
  "route-002": ["delegate", "sonnet", "high"],
  "route-003": ["escalate", "opus", "xhigh"],
  "route-004": ["ask_user", "any", "any"],
  "route-005": ["ask_user", "any", "any"],
  "route-006": ["pivot", "sonnet", "high"],
  "route-007": ["blocked", "any", "any"],
  "route-008": ["blocked", "haiku", "medium"],
  "route-009": ["delegate", "sonnet", "high"],
  "route-010": ["delegate", "sonnet", "high"],
  "route-011": ["blocked", "any", "any"],
  "route-012": ["delegate", "sonnet", "xhigh"],
  "route-013": ["ask_user", "any", "any"],
  "route-014": ["pivot", "sonnet", "high"],
  "route-015": ["complete", "any", "any"],
  "route-016": ["blocked", "any", "any"],
};

function fail(message) {
  errors.push(message);
}

function warn(message) {
  warnings.push(message);
}

function pass() {
  checks += 1;
}

async function stat(relativePath) {
  try {
    return await lstat(path.join(root, relativePath));
  } catch {
    return null;
  }
}

async function text(relativePath) {
  return readFile(path.join(root, relativePath), "utf8");
}

function nonblankLines(value) {
  return value.split(/\r?\n/u).filter((line) => line.trim() !== "").length;
}

function outsideFences(value) {
  const kept = [];
  let fenced = false;
  for (const line of value.split(/\r?\n/u)) {
    if (/^\s*```/u.test(line)) {
      fenced = !fenced;
      continue;
    }
    if (!fenced) kept.push(line);
  }
  return kept.join("\n");
}

function parseScalarFrontmatter(value, relativePath) {
  const lines = value.split(/\r?\n/u);
  if (lines[0]?.trim() !== "---") {
    fail(`${relativePath}: missing opening YAML frontmatter delimiter`);
    return {};
  }
  const end = lines.slice(1).findIndex((line) => line.trim() === "---");
  if (end < 0) {
    fail(`${relativePath}: missing closing YAML frontmatter delimiter`);
    return {};
  }
  const fields = {};
  for (const line of lines.slice(1, end + 1)) {
    const match = line.match(/^([A-Za-z][A-Za-z0-9]*):\s*(.*)$/u);
    if (!match) continue;
    fields[match[1]] = match[2].trim().replace(/^['"]|['"]$/gu, "");
  }
  return fields;
}

function splitTools(value = "") {
  return new Set(
    value
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean),
  );
}

async function validateRequiredFiles() {
  for (const relativePath of requiredFiles) {
    const entry = await stat(relativePath);
    if (!entry?.isFile()) fail(`missing required file: ${relativePath}`);
    else pass();
  }
}

async function validateRootRouter() {
  const relativePath = "CLAUDE.md";
  const entry = await stat(relativePath);
  if (!entry) return;
  if (entry.isSymbolicLink()) fail("CLAUDE.md must be a regular-file router, not a symlink");
  else pass();

  const value = await text(relativePath);
  const count = nonblankLines(value);
  if (count > 80) fail(`CLAUDE.md has ${count} nonblank lines; limit is 80`);
  else pass();

  const active = outsideFences(value);
  const imports = active
    .split(/\r?\n/u)
    .filter((line) => /^\s*@[^\s`]+/u.test(line));
  if (imports.length > 0) fail(`CLAUDE.md contains active @ imports: ${imports.join(" | ")}`);
  else pass();

  for (const marker of [
    "docs/agent-governance/10-model-routing.md",
    "docs/agent-governance/20-judgment-rubric.md",
    "docs/agent-governance/40-maintenance-protocol.md",
    "node scripts/validate-agent-governance.mjs",
  ]) {
    if (!value.includes(marker)) fail(`CLAUDE.md is missing required route: ${marker}`);
    else pass();
  }
}

async function validateAgents() {
  const directory = path.join(root, ".claude/agents");
  let files = [];
  try {
    files = (await readdir(directory)).filter((name) => name.endsWith(".md")).sort();
  } catch {
    fail("missing .claude/agents directory");
    return;
  }

  const names = new Map();
  for (const file of files) {
    const relativePath = `.claude/agents/${file}`;
    const value = await text(relativePath);
    const fields = parseScalarFrontmatter(value, relativePath);
    for (const required of [
      "name",
      "description",
      "tools",
      "disallowedTools",
      "model",
      "effort",
      "permissionMode",
      "maxTurns",
    ]) {
      if (!fields[required]) fail(`${relativePath}: missing frontmatter field ${required}`);
      else pass();
    }

    const name = fields.name;
    if (!name) continue;
    if (names.has(name)) fail(`duplicate agent name ${name}: ${names.get(name)} and ${relativePath}`);
    else {
      names.set(name, relativePath);
      pass();
    }

    if (file !== `${name}.md`) fail(`${relativePath}: filename must match agent name ${name}.md`);
    else pass();

    if (!allowedModels.has(fields.model)) fail(`${relativePath}: unsupported model alias ${fields.model}`);
    else pass();

    if (!allowedEfforts.has(fields.effort)) fail(`${relativePath}: unsupported effort ${fields.effort}`);
    else pass();

    if (!/^\d+$/u.test(fields.maxTurns ?? "")) fail(`${relativePath}: maxTurns must be a positive integer`);
    else if (Number(fields.maxTurns) <= 0) fail(`${relativePath}: maxTurns must be greater than zero`);
    else pass();

    const tools = splitTools(fields.tools);
    const denied = splitTools(fields.disallowedTools);
    if (readOnlyAgents.has(name)) {
      for (const mutationTool of ["Write", "Edit"]) {
        if (tools.has(mutationTool)) fail(`${relativePath}: read-only role allows ${mutationTool}`);
        else pass();
        if (!denied.has(mutationTool)) fail(`${relativePath}: read-only role does not explicitly deny ${mutationTool}`);
        else pass();
      }
    }

    if (name === "researcher") {
      if (!tools.has("Write") || tools.has("Edit") || tools.has("Bash")) {
        fail(`${relativePath}: researcher must allow artifact Write but not Edit or Bash`);
      } else pass();
    }

    const body = outsideFences(value);
    for (const phrase of ["Return contract", "STATUS:"]) {
      if (!body.includes(phrase)) fail(`${relativePath}: missing ${phrase}`);
      else pass();
    }
  }

  for (const required of requiredAgents) {
    if (!names.has(required)) fail(`missing required project agent: ${required}`);
    else pass();
  }
}

async function validateRoutes() {
  const sources = ["CLAUDE.md", "docs/agent-governance/README.md"];
  const pathPattern = /`((?:docs\/agent-governance|\.claude\/agents|scripts\/validate-agent-governance\.mjs)[^`\s]*)`/gu;
  for (const source of sources) {
    const value = await text(source);
    for (const match of value.matchAll(pathPattern)) {
      let target = match[1];
      if (target.includes("*")) continue;
      target = target.replace(/[.,;:]$/u, "");
      if (target.endsWith("/")) continue;
      if (target.includes("YYYY-MM-DD") || target.includes("<")) continue;
      const entry = await stat(target);
      if (!entry) fail(`${source}: routed path does not exist: ${target}`);
      else pass();
    }
  }
}

async function validateGovernanceDocs() {
  const activeDocs = [
    "docs/agent-governance/00-diagnosis.md",
    "docs/agent-governance/05-capability-inventory.md",
    "docs/agent-governance/05-control-loop.md",
    "docs/agent-governance/10-model-routing.md",
    "docs/agent-governance/20-judgment-rubric.md",
    "docs/agent-governance/30-delegation-prompts.md",
    "docs/agent-governance/40-maintenance-protocol.md",
    "docs/agent-governance/50-system-architecture.md",
    "docs/agent-governance/60-evaluation-protocol.md",
    "docs/agent-governance/90-letter-to-future-sessions.md",
    "docs/agent-governance/LESSONS.md",
    "docs/agent-governance/REFERENCES.md",
  ];

  for (const relativePath of activeDocs) {
    const value = await text(relativePath);
    if (!value.endsWith("\n")) warn(`${relativePath}: no final newline`);
    else pass();

    const active = outsideFences(value);
    if (/\b(TODO|TBD|FIXME)\b/u.test(active)) fail(`${relativePath}: active placeholder TODO/TBD/FIXME found`);
    else pass();
  }

  const reference = await text("docs/agent-governance/REFERENCES.md");
  for (const source of [
    "https://code.claude.com/docs/en/sub-agents",
    "https://code.claude.com/docs/en/memory",
    "https://code.claude.com/docs/en/model-config",
    "https://www.anthropic.com/engineering/demystifying-evals-for-ai-agents",
    "https://arxiv.org/abs/2210.03629",
  ]) {
    if (!reference.includes(source)) fail(`REFERENCES.md is missing primary source ${source}`);
    else pass();
  }
}

async function validateCases() {
  const relativePath = "docs/agent-governance/evals/cases.jsonl";
  const lines = (await text(relativePath))
    .split(/\r?\n/u)
    .map((line) => line.trim())
    .filter(Boolean);
  const ids = new Set();

  for (const [index, line] of lines.entries()) {
    let parsed;
    try {
      parsed = JSON.parse(line);
      pass();
    } catch (error) {
      fail(`${relativePath}:${index + 1}: invalid JSON: ${error.message}`);
      continue;
    }

    for (const field of ["id", "category", "risk", "input", "expected", "rationale"]) {
      if (parsed[field] === undefined || parsed[field] === "") fail(`${relativePath}:${index + 1}: missing ${field}`);
      else pass();
    }

    if (ids.has(parsed.id)) fail(`${relativePath}:${index + 1}: duplicate id ${parsed.id}`);
    else {
      ids.add(parsed.id);
      pass();
    }

    if (!parsed.expected || !Array.isArray(parsed.expected.must_include) || !Array.isArray(parsed.expected.must_not_include)) {
      fail(`${relativePath}:${index + 1}: expected must contain must_include and must_not_include arrays`);
    } else pass();

    if (runCases) {
      const oracle = caseOracle[parsed.id];
      if (!oracle) {
        fail(`${relativePath}:${index + 1}: no static policy oracle for ${parsed.id}`);
      } else {
        const actual = [parsed.expected.action, parsed.expected.model, parsed.expected.effort];
        if (actual.join("|") !== oracle.join("|")) {
          fail(`${relativePath}:${index + 1}: oracle mismatch for ${parsed.id}; expected ${oracle.join("/")}, found ${actual.join("/")}`);
        } else pass();
      }
    }
  }

  if (lines.length < 12) fail(`${relativePath}: expected at least 12 decision cases, found ${lines.length}`);
  else pass();

  if (runCases) {
    for (const id of Object.keys(caseOracle)) {
      if (!ids.has(id)) fail(`${relativePath}: oracle case missing from corpus: ${id}`);
      else pass();
    }
  }
}

async function main() {
  await validateRequiredFiles();
  await validateRootRouter();
  await validateAgents();
  await validateRoutes();
  await validateGovernanceDocs();
  await validateCases();

  for (const message of warnings) console.warn(`WARN: ${message}`);
  if (errors.length > 0) {
    for (const message of errors) console.error(`ERROR: ${message}`);
    console.error(`agent-governance validation FAILED: ${errors.length} error(s), ${warnings.length} warning(s), ${checks} checks passed`);
    process.exitCode = 1;
    return;
  }

  console.log(`agent-governance validation PASS: ${checks} checks, ${warnings.length} warning(s), cases=${runCases ? "oracle" : "syntax"}`);
}

await main();
