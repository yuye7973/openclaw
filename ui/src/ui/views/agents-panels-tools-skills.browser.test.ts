import { render } from "lit";
import { describe, expect, it } from "vitest";
import type { SkillStatusEntry } from "../types.ts";
import { renderAgentSkills, renderAgentTools } from "./agents-panels-tools-skills.ts";

function createBaseParams(overrides: Partial<Parameters<typeof renderAgentTools>[0]> = {}) {
  return {
    agentId: "main",
    configForm: {
      agents: {
        list: [{ id: "main", tools: { profile: "full" } }],
      },
    } as Record<string, unknown>,
    configLoading: false,
    configSaving: false,
    configDirty: false,
    toolsCatalogLoading: false,
    toolsCatalogError: null,
    toolsCatalogResult: null,
    toolsEffectiveLoading: false,
    toolsEffectiveError: null,
    toolsEffectiveResult: null,
    runtimeSessionKey: "main",
    runtimeSessionMatchesSelectedAgent: true,
    onProfileChange: () => undefined,
    onOverridesChange: () => undefined,
    onConfigReload: () => undefined,
    onConfigSave: () => undefined,
    ...overrides,
  };
}

function createSkillEntry(overrides: Partial<SkillStatusEntry> = {}): SkillStatusEntry {
  return {
    name: "clawsweeper",
    description: "Inspect ClawSweeper reports",
    source: "agents-skills-project",
    filePath: "/workspace/.agents/skills/clawsweeper/SKILL.md",
    baseDir: "/workspace/.agents/skills/clawsweeper",
    skillKey: "clawsweeper",
    always: false,
    disabled: false,
    blockedByAllowlist: false,
    blockedByAgentFilter: false,
    eligible: true,
    modelVisible: true,
    userInvocable: true,
    commandVisible: true,
    requirements: { bins: [], env: [], config: [], os: [] },
    missing: { bins: [], env: [], config: [], os: [] },
    configChecks: [],
    install: [],
    ...overrides,
  };
}

function createSkillsParams(overrides: Partial<Parameters<typeof renderAgentSkills>[0]> = {}) {
  return {
    agentId: "main",
    report: {
      workspaceDir: "/workspace",
      managedSkillsDir: "/managed",
      agentId: "main",
      skills: [],
    },
    loading: false,
    error: null,
    activeAgentId: "main",
    configForm: { agents: { list: [{ id: "main" }] } } as Record<string, unknown>,
    configLoading: false,
    configSaving: false,
    configDirty: false,
    filter: "",
    onFilterChange: () => undefined,
    onRefresh: () => undefined,
    onToggle: () => undefined,
    onClear: () => undefined,
    onDisableAll: () => undefined,
    onConfigReload: () => undefined,
    onConfigSave: () => undefined,
    ...overrides,
  };
}

describe("agents tools panel (browser)", () => {
  it("renders catalog provenance and effective runtime tools", async () => {
    const container = document.createElement("div");
    render(
      renderAgentTools(
        createBaseParams({
          toolsCatalogResult: {
            agentId: "main",
            profiles: [
              { id: "minimal", label: "Minimal" },
              { id: "coding", label: "Coding" },
              { id: "messaging", label: "Messaging" },
              { id: "full", label: "Full" },
            ],
            groups: [
              {
                id: "media",
                label: "Media",
                source: "core",
                tools: [
                  {
                    id: "tts",
                    label: "tts",
                    description: "Text-to-speech conversion",
                    source: "core",
                    defaultProfiles: [],
                  },
                ],
              },
              {
                id: "plugin:voice-call",
                label: "voice-call",
                source: "plugin",
                pluginId: "voice-call",
                tools: [
                  {
                    id: "voice_call",
                    label: "voice_call",
                    description: "Voice call tool",
                    source: "plugin",
                    pluginId: "voice-call",
                    optional: true,
                    defaultProfiles: [],
                  },
                ],
              },
            ],
          },
          toolsEffectiveResult: {
            agentId: "main",
            profile: "messaging",
            groups: [
              {
                id: "channel",
                label: "Channel tools",
                source: "channel",
                tools: [
                  {
                    id: "message",
                    label: "Message Actions",
                    description: "Send and manage messages in this channel",
                    rawDescription: "Send and manage messages in this channel",
                    source: "channel",
                    channelId: "guildchat",
                  },
                ],
              },
            ],
          },
        }),
      ),
      container,
    );
    await Promise.resolve();

    const text = container.textContent ?? "";
    expect(text).toContain("Built-In");
    expect(text).toContain("Plugin: voice-call");
    expect(text).toContain("Optional");
    expect(text).toContain("Available Right Now");
    expect(text).toContain("Message Actions");
    expect(text).toContain("Channel: guildchat");
    expect(container.querySelector(".agent-tool-card[open]")).toBeNull();
  });

  it("shows fallback warning when runtime catalog fails", async () => {
    const container = document.createElement("div");
    render(
      renderAgentTools(
        createBaseParams({
          toolsCatalogError: "unavailable",
          toolsCatalogResult: null,
        }),
      ),
      container,
    );
    await Promise.resolve();

    expect(container.textContent ?? "").toContain("Could not load runtime tool catalog");
  });

  it("closes expanded tool rows when the parent group collapses", async () => {
    const container = document.createElement("div");
    render(
      renderAgentTools(
        createBaseParams({
          toolsCatalogResult: {
            agentId: "main",
            profiles: [{ id: "full", label: "Full" }],
            groups: [
              {
                id: "files",
                label: "Files",
                source: "core",
                tools: [
                  {
                    id: "read",
                    label: "read",
                    description: "Read file contents",
                    source: "core",
                    defaultProfiles: ["full"],
                  },
                ],
              },
            ],
          },
        }),
      ),
      container,
    );
    await Promise.resolve();

    const group = container.querySelector<HTMLDetailsElement>(".agent-tools-group");
    const tool = container.querySelector<HTMLDetailsElement>(".agent-tool-card");

    expect(group).not.toBeNull();
    expect(tool).not.toBeNull();

    if (!group || !tool) {
      return;
    }

    group.open = true;
    tool.open = true;

    group.open = false;
    group.dispatchEvent(new Event("toggle"));

    expect(tool.open).toBe(false);
  });

  it("keeps the access toggle inside the collapsed tool summary", async () => {
    const container = document.createElement("div");
    render(
      renderAgentTools(
        createBaseParams({
          toolsCatalogResult: {
            agentId: "main",
            profiles: [{ id: "full", label: "Full" }],
            groups: [
              {
                id: "files",
                label: "Files",
                source: "core",
                tools: [
                  {
                    id: "read",
                    label: "read",
                    description: "Read file contents",
                    source: "core",
                    defaultProfiles: ["full"],
                  },
                ],
              },
            ],
          },
        }),
      ),
      container,
    );
    await Promise.resolve();

    const tool = container.querySelector<HTMLDetailsElement>(".agent-tool-card");
    const summary = container.querySelector<HTMLElement>(".agent-tool-summary");
    const toggle = container.querySelector<HTMLInputElement>(".agent-tool-toggle input");

    expect(tool?.open).toBe(false);
    expect(toggle?.closest(".agent-tool-summary")).toBe(summary);
  });

  it("uses section-level plugin provenance for tool details", async () => {
    const container = document.createElement("div");
    render(
      renderAgentTools(
        createBaseParams({
          toolsCatalogResult: {
            agentId: "main",
            profiles: [{ id: "full", label: "Full" }],
            groups: [
              {
                id: "plugin:voice-call",
                label: "voice-call",
                source: "plugin",
                pluginId: "voice-call",
                tools: [
                  {
                    id: "voice_call",
                    label: "voice_call",
                    description: "Voice call tool",
                    source: undefined as never,
                    defaultProfiles: ["full"],
                  },
                ],
              },
            ],
          },
        }),
      ),
      container,
    );
    await Promise.resolve();

    const tool = container.querySelector<HTMLDetailsElement>(".agent-tool-card");
    tool!.open = true;

    const sourceDetail = Array.from(
      container.querySelectorAll<HTMLElement>(".agent-tool-detail"),
    ).find((detail) => detail.textContent?.includes("Source"));

    expect(sourceDetail?.textContent).toContain("Plugin: voice-call");
  });

  it("opens the collapsed group and tool row from a live tool chip", async () => {
    const container = document.createElement("div");
    document.body.append(container);
    render(
      renderAgentTools(
        createBaseParams({
          toolsCatalogResult: {
            agentId: "main",
            profiles: [{ id: "full", label: "Full" }],
            groups: [
              {
                id: "files",
                label: "Files",
                source: "core",
                tools: [
                  {
                    id: "read",
                    label: "read",
                    description: "Read file contents",
                    source: "core",
                    defaultProfiles: ["full"],
                  },
                ],
              },
            ],
          },
          toolsEffectiveResult: {
            agentId: "main",
            profile: "full",
            groups: [
              {
                id: "core",
                label: "Built-in tools",
                source: "core",
                tools: [
                  {
                    id: "read",
                    label: "read",
                    description: "Read file contents",
                    rawDescription: "Read file contents",
                    source: "core",
                  },
                ],
              },
            ],
          },
        }),
      ),
      container,
    );
    await Promise.resolve();

    const group = container.querySelector<HTMLDetailsElement>(".agent-tools-group");
    const tool = container.querySelector<HTMLDetailsElement>(".agent-tool-card");
    const chip = container.querySelector<HTMLAnchorElement>(
      '.agent-tools-runtime-chip[href="#agent-tool-read"]',
    );

    expect(group).not.toBeNull();
    expect(tool).not.toBeNull();
    expect(chip).not.toBeNull();

    if (!group || !tool || !chip) {
      container.remove();
      return;
    }

    expect(group.open).toBe(false);
    expect(tool.open).toBe(false);

    chip.click();
    await new Promise((resolve) => requestAnimationFrame(resolve));

    expect(group.open).toBe(true);
    expect(tool.open).toBe(true);

    container.remove();
  });

  it("renders skill-declared architecture agents", async () => {
    const container = document.createElement("div");
    render(
      renderAgentSkills(
        createSkillsParams({
          report: {
            workspaceDir: "/workspace",
            managedSkillsDir: "/managed",
            agentId: "main",
            skills: [
              createSkillEntry({
                agentInterface: {
                  displayName: "ClawSweeper",
                  shortDescription: "Inspect ClawSweeper reports",
                  defaultPrompt: "Review recent ClawSweeper reports.",
                  filePath: "/workspace/.agents/skills/clawsweeper/agents/openai.yaml",
                },
              }),
              createSkillEntry({
                name: "tengyi-401-pdf-autonomous-trainer",
                description: "Execute the controlled Tengyi 401 PDF autonomous training workflow.",
                source: "openclaw-workspace",
                filePath: "/workspace/skills/tengyi-401-pdf-autonomous-trainer/SKILL.md",
                baseDir: "/workspace/skills/tengyi-401-pdf-autonomous-trainer",
                skillKey: "tengyi-401-pdf-autonomous-trainer",
                eligible: true,
                modelVisible: true,
                userInvocable: true,
                commandVisible: true,
              }),
            ],
          },
        }),
      ),
      container,
    );
    await Promise.resolve();

    const text = container.textContent ?? "";
    expect(text).toContain("Architecture Agents");
    expect(text).toContain("ClawSweeper");
    expect(text).toContain("architecture agent");
    expect(text).toContain("Review recent ClawSweeper reports.");
    expect(text).toContain("tengyi-401-pdf-autonomous-trainer");
    expect(text).toContain("Execute the controlled Tengyi 401 PDF autonomous training workflow.");
  });
});
