# AI Trading Source Report

- generated_at: 2026-05-09T02:41:56Z
- mode: read-only registry deployment
- install_external_skill: false
- execute_external_skill: false
- broker_write_allowed: false
- exchange_api_write_allowed: false
- secret_access: false
- live_trading: false

## Validation

- validator_status: PASS
- candidate_count: 17
- error_count: 0
- warning_count: 2
- status_counts: {"available_read_only": 11, "blocked_rejected": 6}

## Read-Only Research Cards

| Source | Candidate | Risk | License | Action |
| --- | --- | ---: | --- | --- |
| AI Trading Open Source Platforms | vectorbt-backtest-research-reference | 44 | NOASSERTION at repository metadata | read_only |
| AI Trading Open Source Platforms | backtrader-backtest-reference | 45 | GPL-3.0 | read_only |
| AI Trading Platform Forums | ai-trading-forum-scan-readonly | 48 | public forum terms vary; not verified at registry level | read_only |
| AI Trading Open Source Platforms | openbb-market-research-reference | 49 | NOASSERTION at repository metadata | read_only |
| AI Trading Open Source Platforms | microsoft-qlib-ai-quant-research-reference | 52 | MIT | read_only |
| AI Trading Open Source Platforms | finrl-paper-strategy-learning-reference | 56 | MIT | read_only |
| AI Trading Open Source Platforms | finrobot-financial-agent-reference | 58 | Apache-2.0 | read_only |
| AI Trading Open Source Platforms | quantconnect-lean-backtest-engine-reference | 60 | Apache-2.0 | read_only |
| AI Trading Open Source Platforms | nautilus-trader-research-reference | 64 | LGPL-3.0 | read_only |
| AI Trading Open Source Platforms | ai-hedge-fund-agent-reference | 66 | not verified at registry level | read_only |
| AI Trading Open Source Platforms | finrl-trading-paper-reference | 70 | Apache-2.0 | read_only |

## Blocked Live-Capable References

| Source | Candidate | Risk | Reason |
| --- | --- | ---: | --- |
| AI Trading Open Source Platforms | superalgos-auto-trading-platform-reference-rejected | 78 | live-capable trading surface remains blocked |
| AI Trading Open Source Platforms | jesse-crypto-trading-framework-reference-rejected | 84 | live-capable trading surface remains blocked |
| AI Trading Open Source Platforms | octobot-crypto-trading-bot-reference-rejected | 84 | live-capable trading surface remains blocked |
| AI Trading Open Source Platforms | vnpy-live-trading-framework-reference-rejected | 86 | live-capable trading surface remains blocked |
| AI Trading Open Source Platforms | freqtrade-live-bot-reference-rejected | 88 | live-capable trading surface remains blocked |
| AI Trading Open Source Platforms | hummingbot-live-market-making-reference-rejected | 90 | live-capable trading surface remains blocked |

## Safety Rules

- These cards are metadata only.
- Forum posts are untrusted research signals.
- Trading bots and live-capable frameworks stay rejected for executable deployment.
- Any future sandbox or install path requires a new approval report and explicit review.

## Rollback Path

- Remove runtime/skills/source_indexer/ai_trading_source_report.py.
- Remove reports/open-source-skills/ai_trading_source_report.md.
- Remove dashboard/feeds/open-source-skills/ai_trading_sources.json.
- Remove AI trading entries from skills/registry/open_source_skill_candidates.json.
