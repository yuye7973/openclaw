# Open Source Skill Approval Required

- generated_for: AI trading source registry
- install_allowed: false
- execution_allowed: false
- broker_write_allowed: false
- exchange_api_write_allowed: false
- secret_access_allowed: false
- full_disk_access_allowed: false
- live_trading_allowed: false

## Decision

OpenClaw may index and read the registered AI trading sources as metadata.
OpenClaw may not install, run, import, auto-enable, or connect any third-party
trading bot, trading framework, broker adapter, wallet tool, or payment tool
from this registry.

## Approval Boundary

Any future install or sandbox execution must produce a new approval report with:

- exact candidate id
- source URL and license
- install command or package name
- sandbox filesystem scope
- network allowlist
- secret policy
- rollback command
- validator PASS result
- explicit human approval
