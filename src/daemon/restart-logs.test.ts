import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  GATEWAY_RESTART_LOG_FILENAME,
  renderCmdRestartLogSetup,
  renderPosixRestartLogSetup,
  shellEscapeRestartLogValue,
  resolveGatewayLogPaths,
  resolveGatewayRestartLogPath,
} from "./restart-logs.js";

describe("restart log conventions", () => {
  it("resolves profile-aware gateway logs and restart attempts together", () => {
    const env = {
      HOME: "/Users/test",
      OPENCLAW_PROFILE: "work",
    };
    const expectedLogDir = path.join("/Users/test", ".openclaw-work", "logs");

    expect(resolveGatewayLogPaths(env)).toEqual({
      logDir: expectedLogDir,
      stdoutPath: path.join(expectedLogDir, "gateway.log"),
      stderrPath: path.join(expectedLogDir, "gateway.err.log"),
    });
    expect(resolveGatewayRestartLogPath(env)).toBe(path.join(expectedLogDir, GATEWAY_RESTART_LOG_FILENAME));
  });

  it("honors OPENCLAW_STATE_DIR for restart attempts", () => {
    const env = {
      HOME: "/Users/test",
      OPENCLAW_STATE_DIR: "/tmp/openclaw-state",
    };

    expect(resolveGatewayRestartLogPath(env)).toBe(
      path.join(path.resolve("/tmp/openclaw-state"), "logs", GATEWAY_RESTART_LOG_FILENAME),
    );
  });

  it("renders best-effort POSIX log setup with escaped paths", () => {
    const setup = renderPosixRestartLogSetup({
      HOME: "/Users/test's",
    });
    const logPath = resolveGatewayRestartLogPath({ HOME: "/Users/test's" });
    const logDir = path.dirname(logPath);
    const escapedLogDir = shellEscapeRestartLogValue(logDir);
    const escapedLogPath = shellEscapeRestartLogValue(logPath);

    expect(setup).toContain(
      `if mkdir -p '${escapedLogDir}' 2>/dev/null && : >>'${escapedLogPath}' 2>/dev/null; then`,
    );
    expect(setup).toContain(`exec >>'${escapedLogPath}' 2>&1`);
  });

  it("renders CMD log setup with quoted paths", () => {
    const setup = renderCmdRestartLogSetup({
      USERPROFILE: "C:\\Users\\Test User",
    });
    const expectedLogDir = path.join("C:\\Users\\Test User", ".openclaw", "logs");
    const expectedLogPath = path.join(expectedLogDir, GATEWAY_RESTART_LOG_FILENAME);

    expect(setup.quotedLogPath).toBe(`"${expectedLogPath}"`);
    expect(setup.lines).toContain(
      `if not exist "${expectedLogDir}" mkdir "${expectedLogDir}" >nul 2>&1`,
    );
  });
});
