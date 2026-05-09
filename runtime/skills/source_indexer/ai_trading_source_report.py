#!/usr/bin/env python3
"""Build OpenClaw read-only AI trading source report cards.

The report is registry-only: it never installs, imports, runs, or connects any
third-party trading project.
"""

from __future__ import annotations

import argparse
import importlib.util
import json
from datetime import UTC, datetime
from pathlib import Path
from typing import Any


REPO_ROOT = Path(__file__).resolve().parents[3]
CANDIDATES_PATH = REPO_ROOT / "skills/registry/open_source_skill_candidates.json"
VALIDATOR_PATH = REPO_ROOT / "skills/validators/validate_skill_candidate_security.py"
REPORT_PATH = REPO_ROOT / "reports/open-source-skills/ai_trading_source_report.md"
FEED_PATH = REPO_ROOT / "dashboard/feeds/open-source-skills/ai_trading_sources.json"

READ_ONLY_CAPABILITIES = [
    "source metadata search",
    "license and activity review",
    "paper-only research planning",
    "backtest architecture comparison",
    "forum signal triage",
    "validation report generation",
]

BLOCKED_CAPABILITIES = [
    "third-party package install",
    "third-party command execution",
    "broker write",
    "exchange API write",
    "wallet or payment access",
    "secret access",
    "live trading",
]


def load_json(path: Path) -> dict[str, Any]:
    data = json.loads(path.read_text(encoding="utf-8"))
    if not isinstance(data, dict):
        raise TypeError(f"{path} must contain a JSON object")
    return data


def write_json(path: Path, payload: dict[str, Any]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(payload, indent=2, sort_keys=True) + "\n", encoding="utf-8")


def load_validator():
    spec = importlib.util.spec_from_file_location("openclaw_skill_candidate_validator", VALIDATOR_PATH)
    if spec is None or spec.loader is None:
        raise RuntimeError(f"Unable to load validator at {VALIDATOR_PATH}")
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def is_ai_trading_candidate(candidate: dict[str, Any]) -> bool:
    haystack = " ".join(
        str(candidate.get(key, ""))
        for key in ("candidate_id", "skill_name", "category", "source_name", "summary")
    ).casefold()
    return "trading" in haystack or "backtest" in haystack or "market research" in haystack


def card_status(candidate: dict[str, Any]) -> str:
    action = candidate.get("recommended_action")
    if action == "read_only":
        return "available_read_only"
    if action == "reject":
        return "blocked_rejected"
    return "blocked_unexpected_action"


def sort_candidates(candidates: list[dict[str, Any]]) -> list[dict[str, Any]]:
    status_rank = {"available_read_only": 0, "blocked_rejected": 1, "blocked_unexpected_action": 2}
    return sorted(
        candidates,
        key=lambda item: (
            status_rank.get(card_status(item), 99),
            int(item.get("security_risk_score", 100)),
            str(item.get("skill_name", "")),
        ),
    )


def build_cards(candidates: list[dict[str, Any]]) -> list[dict[str, Any]]:
    cards = []
    for candidate in sort_candidates(candidates):
        status = card_status(candidate)
        cards.append(
            {
                "candidate_id": candidate["candidate_id"],
                "title": candidate["skill_name"],
                "source_name": candidate["source_name"],
                "source_url": candidate["source_url"],
                "repo_url": candidate["repo_url"],
                "category": candidate["category"],
                "license": candidate["license"],
                "last_updated": candidate["last_updated"],
                "stars_or_usage": candidate["stars_or_usage"],
                "security_risk_score": candidate["security_risk_score"],
                "recommended_action": candidate["recommended_action"],
                "card_status": status,
                "deployment_status": candidate.get("deployment_status", "openclaw_registry_only"),
                "read_only_capabilities": READ_ONLY_CAPABILITIES if status == "available_read_only" else [],
                "blocked_capabilities": BLOCKED_CAPABILITIES,
                "next_step": (
                    "Show as a read-only trading research card."
                    if status == "available_read_only"
                    else "Keep blocked; do not install or execute."
                ),
                "summary": candidate["summary"],
            }
        )
    return cards


def summarize(cards: list[dict[str, Any]]) -> dict[str, int]:
    counts: dict[str, int] = {}
    for card in cards:
        status = str(card["card_status"])
        counts[status] = counts.get(status, 0) + 1
    return dict(sorted(counts.items()))


def render_report(generated_at: str, cards: list[dict[str, Any]], validation: dict[str, Any]) -> str:
    counts = summarize(cards)
    lines = [
        "# AI Trading Source Report",
        "",
        f"- generated_at: {generated_at}",
        "- mode: read-only registry deployment",
        "- install_external_skill: false",
        "- execute_external_skill: false",
        "- broker_write_allowed: false",
        "- exchange_api_write_allowed: false",
        "- secret_access: false",
        "- live_trading: false",
        "",
        "## Validation",
        "",
        f"- validator_status: {validation['status']}",
        f"- candidate_count: {len(cards)}",
        f"- error_count: {validation['error_count']}",
        f"- warning_count: {validation['warning_count']}",
        f"- status_counts: {json.dumps(counts, sort_keys=True)}",
        "",
        "## Read-Only Research Cards",
        "",
        "| Source | Candidate | Risk | License | Action |",
        "| --- | --- | ---: | --- | --- |",
    ]
    for card in cards:
        if card["card_status"] == "available_read_only":
            lines.append(
                f"| {card['source_name']} | {card['title']} | {card['security_risk_score']} | {card['license']} | {card['recommended_action']} |"
            )

    lines.extend(
        [
            "",
            "## Blocked Live-Capable References",
            "",
            "| Source | Candidate | Risk | Reason |",
            "| --- | --- | ---: | --- |",
        ]
    )
    for card in cards:
        if card["card_status"] != "available_read_only":
            lines.append(
                f"| {card['source_name']} | {card['title']} | {card['security_risk_score']} | live-capable trading surface remains blocked |"
            )

    lines.extend(
        [
            "",
            "## Safety Rules",
            "",
            "- These cards are metadata only.",
            "- Forum posts are untrusted research signals.",
            "- Trading bots and live-capable frameworks stay rejected for executable deployment.",
            "- Any future sandbox or install path requires a new approval report and explicit review.",
            "",
            "## Rollback Path",
            "",
            "- Remove runtime/skills/source_indexer/ai_trading_source_report.py.",
            "- Remove reports/open-source-skills/ai_trading_source_report.md.",
            "- Remove dashboard/feeds/open-source-skills/ai_trading_sources.json.",
            "- Remove AI trading entries from skills/registry/open_source_skill_candidates.json.",
        ]
    )
    return "\n".join(lines) + "\n"


def run(args: argparse.Namespace) -> int:
    generated_at = datetime.now(UTC).replace(microsecond=0).isoformat().replace("+00:00", "Z")
    catalog = load_json(CANDIDATES_PATH)
    validator = load_validator()
    validation = validator.validate_catalog(catalog)
    candidates = catalog.get("candidates", [])
    if not isinstance(candidates, list):
        raise TypeError("candidate registry must contain a candidates array")

    trading_candidates = [candidate for candidate in candidates if is_ai_trading_candidate(candidate)]
    cards = build_cards(trading_candidates)
    payload = {
        "schema_version": "openclaw.ai_trading_source_cards.v1",
        "generated_at": generated_at,
        "guardrails": {
            "install_allowed": False,
            "execution_allowed": False,
            "broker_write_allowed": False,
            "exchange_api_write_allowed": False,
            "secret_access_allowed": False,
            "full_disk_access_allowed": False,
            "live_trading_allowed": False,
        },
        "validator": {
            "status": validation["status"],
            "error_count": validation["error_count"],
            "warning_count": validation["warning_count"],
        },
        "summary": summarize(cards),
        "cards": cards,
    }

    if args.write:
        write_json(FEED_PATH, payload)
        REPORT_PATH.parent.mkdir(parents=True, exist_ok=True)
        REPORT_PATH.write_text(render_report(generated_at, cards, validation), encoding="utf-8")

    if args.json:
        print(json.dumps(payload, indent=2, sort_keys=True))
    else:
        for card in cards:
            print(
                "{candidate_id}\t{card_status}\trisk={security_risk_score}\taction={recommended_action}".format(
                    **card
                )
            )

    has_unexpected_action = any(card["card_status"] == "blocked_unexpected_action" for card in cards)
    has_error = validation["status"] != "PASS" or not cards or has_unexpected_action
    return 1 if args.check and has_error else 0


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--json", action="store_true", help="Print dashboard JSON")
    parser.add_argument("--check", action="store_true", help="Fail on validation errors")
    parser.add_argument("--no-write", dest="write", action="store_false", help="Do not write report/feed")
    parser.set_defaults(write=True)
    return parser.parse_args()


if __name__ == "__main__":
    raise SystemExit(run(parse_args()))
