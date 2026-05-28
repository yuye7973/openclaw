import path from "node:path";
import { resolveOpenClawRepoRoot } from "./repo-root-runtime.js";
import {
  buildTelegramRuntimeStatusReply,
  type TelegramRuntimeStatusReply,
} from "./runtime-status-reply.js";
import {
  readTelegramRuntimeStatusSnapshotOrDefault,
  type ReadTelegramRuntimeStatusSnapshotOptions,
} from "./runtime-status-snapshot-reader.js";
import type { TelegramRuntimeStatusSummaryInput } from "./runtime-status-summary.js";

const REQUIRED_STATUS_RELATIVE_PATH =
  "reports/hermes-agent/state/openclaw-capital-service-status-latest.json";

export type BuildTelegramRuntimeStatusControllerReplyInput = {
  preferredRepoRoot?: string;
  includeTradingButtons?: boolean;
  includeReturnMainMenu?: boolean;
};

export type TelegramRuntimeStatusControllerReply = TelegramRuntimeStatusReply & {
  repoRoot: string;
  status: TelegramRuntimeStatusSummaryInput;
};

function resolveStatusSnapshotOptions(
  input: BuildTelegramRuntimeStatusControllerReplyInput,
): ReadTelegramRuntimeStatusSnapshotOptions & { repoRoot: string } {
  if (input.preferredRepoRoot && input.preferredRepoRoot.trim().length > 0) {
    return {
      repoRoot: path.resolve(input.preferredRepoRoot.trim()),
    };
  }
  const repoRoot = resolveOpenClawRepoRoot({
    preferredRoot: input.preferredRepoRoot,
    requiredRelativePath: REQUIRED_STATUS_RELATIVE_PATH,
  });
  return {
    repoRoot,
  };
}

export function buildTelegramRuntimeStatusControllerReply(
  input: BuildTelegramRuntimeStatusControllerReplyInput = {},
): TelegramRuntimeStatusControllerReply {
  const snapshotOptions = resolveStatusSnapshotOptions(input);
  const status = readTelegramRuntimeStatusSnapshotOrDefault(snapshotOptions);
  const reply = buildTelegramRuntimeStatusReply({
    status,
    includeTradingButtons: input.includeTradingButtons,
    includeReturnMainMenu: input.includeReturnMainMenu,
  });
  return {
    ...reply,
    repoRoot: snapshotOptions.repoRoot,
    status,
  };
}
