---
summary: "Tracks core module and skill inventory checkpoints used by autonomous gate validation."
read_when:
  - You need to confirm the module and skill surfaces required by autonomous workflows
  - You are troubleshooting autonomous inventory failures
title: "Module Skill Inventory"
---

# Module Skill Inventory

The autonomous inventory gate validates these required surfaces:

| Scope                  | Required path candidates                          |
| ---------------------- | ------------------------------------------------- |
| Agent skills           | `.agents/skills`                                  |
| Workspace skills       | `skills`                                          |
| Bundled plugins        | `extensions`                                      |
| Hooks                  | `hooks` or `src/hooks`                            |
| Cron                   | `cron` or `src/cron`                              |
| Gateway                | `gateway` or `src/gateway`                        |
| Runtime                | `runtime` or `src/runtime`                        |
| Controlled paths check | `scripts/check-openclaw-controlled-paths.mjs`     |
| Runtime anchor         | `runtime/skills/source_indexer/source_indexer.py` |

## BrokerDesk quote surface

`brokerdesk:quote:*` belongs to the BrokerDesk quote reader surface, not the Hermes orchestration layer.

- `scripts/openclaw-capital-quote-reader.mjs`
- `scripts/check-capital-quote-reader.mjs`
- `scripts/openclaw-capital-quote-status.mjs`
- `scripts/check-capital-quote-status.mjs`
- `scripts/openclaw-capital-quote-pump.mjs`
- `scripts/check-capital-quote-pump.mjs`
- `scripts/openclaw-capital-quote-runtime-event.mjs`
- `scripts/check-capital-quote-runtime-event.mjs`
- `scripts/openclaw-capital-quote-architecture.mjs`
- `scripts/check-capital-quote-architecture.mjs`
- `scripts/openclaw-capital-quote-ui-state.mjs`
- `scripts/check-capital-quote-ui-state.mjs`
- `scripts/validate-capital-quote-state.mjs`

These commands verify and report quote state only. They do not own Hermes task packaging, approval, UI rendering, or learning/promotion flow.

The architecture gate must pass before a runtime or strategy layer treats BrokerDesk quote state as usable context. It checks package scripts, required quote files, skill guardrails, generated status/event schemas, read-only safety flags, event type mapping, strategy gate consistency, and latest-symbol consistency.

The quote pump is the safe bridge from BrokerDesk callback output to OpenClaw runtime state. It reads BrokerDesk files, rewrites OpenClaw quote status/runtime event with a strict max quote age, and never logs in or writes broker orders. Stale pump output must block paper trading instead of retrying the broker.

## Capital paper HFT automation surface

`brokerdesk:paper-hft:*` and `brokerdesk:paper-trade:*` belong to the paper-only automation surface. They do not enable live broker writes.

- `config/capital-paper-hft-risk-controls.json`
- `config/capital-paper-microstructure-strategy.json`
- `scripts/openclaw-capital-paper-automation-loop.mjs`
- `scripts/check-capital-paper-automation-loop.mjs`
- `scripts/check-capital-paper-cron-job.mjs`
- `scripts/openclaw-capital-paper-hft-burst.mjs`
- `scripts/check-capital-paper-hft-burst.mjs`
- `scripts/openclaw-capital-paper-hft-trigger.mjs`
- `scripts/check-capital-paper-hft-trigger.mjs`
- `scripts/openclaw-capital-paper-learning-summary.mjs`
- `scripts/check-capital-paper-learning-summary.mjs`
- `scripts/openclaw-capital-paper-assistant-state.mjs`
- `scripts/check-capital-paper-assistant-state.mjs`
- `scripts/openclaw-capital-paper-promotion-gate.mjs`
- `scripts/check-capital-paper-promotion-gate.mjs`
- `brokerdesk:auto-trading`
- `brokerdesk:auto-trading:check`
- `brokerdesk:auto-trading-loop`
- `brokerdesk:auto-trading-loop:check`
- `brokerdesk:auto-trading-watch`
- `brokerdesk:auto-trading-watch:daemon`
- `brokerdesk:auto-trading-watch:check`
- `scripts/openclaw-auto-trading-assistant.mjs`
- `scripts/check-auto-trading-assistant-state.mjs`
- `scripts/openclaw-auto-trading-watch.mjs`
- `scripts/check-auto-trading-watch-state.mjs`
- `scripts/openclaw-auto-trading-learning-snapshot.mjs`
- `scripts/check-auto-trading-learning-snapshot.mjs`
- `scripts/openclaw-auto-trading-tick-diagnostic.mjs`
- `scripts/check-auto-trading-tick-diagnostic.mjs`
- `.openclaw/ui/auto-trading-learning-summary.md`
- `.openclaw/ui/auto-trading-assistant-state.json`
- `.openclaw/ui/auto-trading-watch-state.json`
- `.openclaw/ui/auto-trading-learning-snapshot.json`
- `.openclaw/quote/capital-tick-diagnostic.json`
- `.openclaw/quote/capital-tick-diagnostic.md`
- `scripts/openclaw-capital-paper-hft-readiness.mjs`
- `scripts/check-capital-paper-hft-readiness.mjs`
- `scripts/openclaw-capital-paper-trading-simulator.mjs`
- `scripts/check-capital-paper-trading-simulator.mjs`

The paper HFT readiness gate requires the BrokerDesk quote architecture gate to pass, runtime event strategy gate to be ready, quote freshness to satisfy the stricter HFT-like age limit, and risk controls to keep live trading and broker writes disabled. A failed readiness gate is a controlled block, not a signal to retry broker login.

The paper trading simulator consumes the readiness report and the latest quote state. It writes paper intent and learning ledger records only when readiness passes and bid/ask are usable. If readiness is blocked or bid/ask are invalid, it records a learning observation without creating an order intent.

The paper automation loop is the single safe heartbeat target for HFT-like simulation. It runs quote pump, quote architecture, paper HFT readiness, and one paper simulator cycle in order, then writes one loop report. It does not log in, retry broker API calls, advance quote queue StartIndex, or enable broker order writes.

The auto-trading watch command is the continuous quote-driven prototype entrypoint. It watches BrokerDesk quote callback files and reruns the paper automation loop whenever a new callback or guard/queue update arrives. It stays read-only, no-login, and paper-only.

The auto-trading watch daemon launcher prepares a Windows hidden background launch path for the watch loop and records its plan in OpenClaw state. The startup install/check entrypoints keep that plan verifiable without enabling broker writes.

The paper HFT burst runner is the short-cycle simulation entrypoint. It repeatedly executes the paper automation loop at the configured `decisionLoopIntervalMs` cadence, but stops immediately on stale quotes, 1115 cooldown, failed readiness, invalid bid/ask, max cycles, or max duration. It is paper-only and cannot enable broker writes.

The paper HFT trigger is the event-deduplication gate in front of burst execution. It reads the latest SKQuoteLib callback identity/hash, skips duplicate quotes, blocks stale or invalid bid/ask quotes without running burst, and only executes the paper HFT burst for a new actionable callback.

The paper learning summary is the read-only bridge from the learning registry to strategy promotion. It summarizes candidate / approved / blocked state, keeps paper and live eligibility separate, and surfaces the next safe task without enabling broker writes.

The 類高頻自動交易助手 state is the single OpenClaw control center for quote status, paper automation loop, learning summary, promotion gate, and cron check. It stays read-only, shows the strongest current status, and gives the operator one next safe task without enabling broker writes.

The paper promotion gate is the read-only threshold check that consumes the learning summary and decides whether the strategy is ready for paper promotion review. It does not promote live, does not enable writes, and keeps the next safe task explicit when the gate is still blocked.

The paper cron job check validates the OpenClaw-owned scheduler entry for the paper HFT trigger. It checks that exactly one `Capital paper HFT trigger` job exists, is enabled, runs every 30 minutes in an isolated session, uses `brokerdesk:paper-hft:trigger` as the only entrypoint, and keeps delivery/tool/live-trading guardrails locked.

## Hermes migration contract

`extensions/migrate-hermes/openclaw.plugin.json` must keep:

- `id: "migrate-hermes"`
- `contracts.migrationProviders` contains `"hermes"`

## Verification

```bash
node --check scripts/openclaw-autonomous-inventory.mjs
pnpm autonomous:inventory:check
```






