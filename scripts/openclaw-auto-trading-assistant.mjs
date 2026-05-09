import path from "node:path";
import { runCapitalPaperAssistantState, writeCapitalPaperAssistantState } from "./openclaw-capital-paper-assistant-state.mjs";

function defaultAliasReportPath(repoRoot) {
  return path.join(repoRoot, ".openclaw", "ui", "auto-trading-assistant-state.json");
}

async function main() {
  const repoRoot = process.cwd();
  const result = await runCapitalPaperAssistantState({
    repoRoot,
    writeState: true,
    silent: true,
  });
  await writeCapitalPaperAssistantState(result.report, defaultAliasReportPath(repoRoot));
  process.stdout.write(`${JSON.stringify(result.report, null, 2)}\n`);
  return result;
}

await main();
