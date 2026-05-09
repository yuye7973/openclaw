import { describe, expect, it } from "vitest";
import { buildPlatformRuntimeLogHints, buildPlatformServiceStartHints } from "./runtime-hints.js";
import { resolveGatewayLogPaths, resolveGatewayRestartLogPath } from "./restart-logs.js";

function toDarwinDisplayPath(value: string): string {
  return value.replace(/\\/g, "/").replace(/^[A-Za-z]:/, "");
}

describe("buildPlatformRuntimeLogHints", () => {
  it("renders launchd log hints on darwin", () => {
    const env = {
      OPENCLAW_STATE_DIR: "/tmp/openclaw-state",
      OPENCLAW_LOG_PREFIX: "gateway",
    };
    const logs = resolveGatewayLogPaths(env);
    const restartLog = resolveGatewayRestartLogPath(env);
    expect(
      buildPlatformRuntimeLogHints({
        platform: "darwin",
        env,
        systemdServiceName: "openclaw-gateway",
        windowsTaskName: "OpenClaw Gateway",
      }),
    ).toEqual([
      `Launchd stdout (if installed): ${toDarwinDisplayPath(logs.stdoutPath)}`,
      `Launchd stderr (if installed): ${toDarwinDisplayPath(logs.stderrPath)}`,
      `Restart attempts: ${toDarwinDisplayPath(restartLog)}`,
    ]);
  });

  it("renders systemd and windows hints by platform", () => {
    const env = {
      OPENCLAW_STATE_DIR: "/tmp/openclaw-state",
    };
    const restartLog = resolveGatewayRestartLogPath(env);
    expect(
      buildPlatformRuntimeLogHints({
        platform: "linux",
        env,
        systemdServiceName: "openclaw-gateway",
        windowsTaskName: "OpenClaw Gateway",
      }),
    ).toEqual([
      "Logs: journalctl --user -u openclaw-gateway.service -n 200 --no-pager",
      `Restart attempts: ${restartLog}`,
    ]);
    expect(
      buildPlatformRuntimeLogHints({
        platform: "win32",
        env,
        systemdServiceName: "openclaw-gateway",
        windowsTaskName: "OpenClaw Gateway",
      }),
    ).toEqual([
      'Logs: schtasks /Query /TN "OpenClaw Gateway" /V /FO LIST',
      `Restart attempts: ${restartLog}`,
    ]);
  });
});

describe("buildPlatformServiceStartHints", () => {
  it("builds platform-specific service start hints", () => {
    expect(
      buildPlatformServiceStartHints({
        platform: "darwin",
        installCommand: "openclaw gateway install",
        startCommand: "openclaw gateway",
        launchAgentPlistPath: "~/Library/LaunchAgents/com.openclaw.gateway.plist",
        systemdServiceName: "openclaw-gateway",
        windowsTaskName: "OpenClaw Gateway",
      }),
    ).toEqual([
      "openclaw gateway install",
      "openclaw gateway",
      "launchctl bootstrap gui/$UID ~/Library/LaunchAgents/com.openclaw.gateway.plist",
    ]);
    expect(
      buildPlatformServiceStartHints({
        platform: "linux",
        installCommand: "openclaw gateway install",
        startCommand: "openclaw gateway",
        launchAgentPlistPath: "~/Library/LaunchAgents/com.openclaw.gateway.plist",
        systemdServiceName: "openclaw-gateway",
        windowsTaskName: "OpenClaw Gateway",
      }),
    ).toEqual([
      "openclaw gateway install",
      "openclaw gateway",
      "systemctl --user start openclaw-gateway.service",
    ]);
  });
});
