import os from "node:os";
import path from "node:path";
import { resolveCliName } from "../cli/cli-name.js";
import { installCompletion } from "../cli/completion-runtime.js";
import type { ShellCompletionStatus } from "../commands/doctor-completion.js";
import { checkShellCompletionStatus } from "../commands/doctor-completion.js";
import { pathExists } from "../utils.js";
import { t } from "./i18n/index.js";
import type { WizardPrompter } from "./prompts.js";
import type { WizardFlow } from "./setup.types.js";

type CompletionDeps = {
  resolveCliName: () => string;
  checkShellCompletionStatus: (binName: string) => Promise<ShellCompletionStatus>;
  installCompletion: (
    shell: string,
    yes: boolean,
    binName?: string,
    options?: { retiredCachePath?: string | null },
  ) => Promise<void>;
};

async function resolveProfileHint(shell: ShellCompletionStatus["shell"]): Promise<string> {
  const home = process.env.HOME || os.homedir();
  if (shell === "zsh") {
    return "~/.zshrc";
  }
  if (shell === "bash") {
    const bashrc = path.join(home, ".bashrc");
    return (await pathExists(bashrc)) ? "~/.bashrc" : "~/.bash_profile";
  }
  if (shell === "fish") {
    return "~/.config/fish/config.fish";
  }
  // Best-effort. PowerShell profile path varies; restart hint is still correct.
  return "$PROFILE";
}

function formatReloadHint(shell: ShellCompletionStatus["shell"], profileHint: string): string {
  if (shell === "powershell") {
    return t("wizard.completion.reloadPowerShell");
  }
  return t("wizard.completion.reloadShell", { profile: profileHint });
}

export async function setupWizardShellCompletion(params: {
  flow: WizardFlow;
  prompter: Pick<WizardPrompter, "confirm" | "note">;
  deps?: Partial<CompletionDeps>;
}): Promise<void> {
  const deps: CompletionDeps = {
    resolveCliName,
    checkShellCompletionStatus,
    installCompletion,
    ...params.deps,
  };

  const cliName = deps.resolveCliName();
  const completionStatus = await deps.checkShellCompletionStatus(cliName);

  if (completionStatus.usesRetiredCache) {
    // Profile points at the retired state-dir cache; rewrite it in place.
    await deps.installCompletion(completionStatus.shell, true, cliName, {
      retiredCachePath: completionStatus.retiredCachePath,
    });
    return;
  }

  if (!completionStatus.profileInstalled) {
    const shouldInstall =
      params.flow === "quickstart"
        ? true
        : await params.prompter.confirm({
            message: t("wizard.completion.enable", {
              shell: completionStatus.shell,
              cli: cliName,
            }),
            initialValue: true,
          });

    if (!shouldInstall) {
      return;
    }

    // Generate cache first (required for fast shell startup)
    const cacheGenerated = await deps.ensureCompletionCacheExists(cliName);
    if (!cacheGenerated) {
      await params.prompter.note(
        t("wizard.completion.cacheFailed", { command: `${cliName} completion --install` }),
        t("wizard.completion.title"),
      );
      return;
    }

    // Install to shell profile
    await deps.installCompletion(completionStatus.shell, true, cliName);

    const profileHint = await resolveProfileHint(completionStatus.shell);
    await params.prompter.note(
      t("wizard.completion.installed", {
        reloadHint: formatReloadHint(completionStatus.shell, profileHint),
      }),
      t("wizard.completion.title"),
    );
  }
}
