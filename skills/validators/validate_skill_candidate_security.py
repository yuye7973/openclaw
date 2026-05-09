#!/usr/bin/env python3
"""Validate OpenClaw open-source skill candidate security metadata."""

from __future__ import annotations

import argparse
import json
import re
from pathlib import Path
from typing import Any


REQUIRED_FIELDS = [
    "source_name",
    "source_url",
    "skill_name",
    "category",
    "compatible_with_openclaw",
    "install_method",
    "license",
    "repo_url",
    "last_updated",
    "stars_or_usage",
    "required_permissions",
    "filesystem_access",
    "network_access",
    "command_execution",
    "secret_access_required",
    "security_risk_score",
    "recommended_action",
]

RECOMMENDED_ACTIONS = {"reject", "sandbox", "read_only", "install"}
FORBIDDEN_FILESYSTEM_ACCESS = {"full_disk", "home_directory", "root", "system", "unrestricted"}
HIGH_RISK_CATEGORY_PATTERN = re.compile(r"(trading|wallet|payment|crypto|defi|nft|mainnet|401)", re.IGNORECASE)
INSTALL_SCRIPT_PATTERN = re.compile(
    r"(curl\s+.*\|\s*(bash|sh)|wget\s+.*\|\s*(bash|sh)|install\.sh|setup\.sh|powershell\s+-|iex\s)",
    re.IGNORECASE,
)


def issue(severity: str, code: str, message: str) -> dict[str, str]:
    return {"severity": severity, "code": code, "message": message}


def candidate_id(candidate: dict[str, Any], index: int) -> str:
    return str(candidate.get("candidate_id") or candidate.get("skill_name") or f"candidate[{index}]")


def validate_candidate(candidate: dict[str, Any], index: int) -> dict[str, Any]:
    errors: list[dict[str, str]] = []
    warnings: list[dict[str, str]] = []
    cid = candidate_id(candidate, index)

    for field in REQUIRED_FIELDS:
        if field not in candidate:
            errors.append(issue("error", "missing_required_field", f"{cid}: missing {field}"))

    action = candidate.get("recommended_action")
    if action not in RECOMMENDED_ACTIONS:
        errors.append(issue("error", "invalid_recommended_action", f"{cid}: invalid recommended_action"))

    risk = candidate.get("security_risk_score")
    if not isinstance(risk, int) or risk < 0 or risk > 100:
        errors.append(issue("error", "invalid_security_risk_score", f"{cid}: risk must be integer 0..100"))
        risk = 100

    if action == "sandbox" and risk > 30:
        errors.append(issue("error", "sandbox_risk_too_high", f"{cid}: sandbox requires risk <= 30"))

    if action == "install":
        if candidate.get("approval_required_before_install") is not True:
            errors.append(issue("error", "install_missing_approval_required", f"{cid}: install requires approval"))
        if not candidate.get("approval_report_path"):
            errors.append(issue("error", "install_missing_approval_report", f"{cid}: install requires report path"))
        warnings.append(issue("warning", "install_is_approval_only", f"{cid}: install is never automatic"))

    if candidate.get("approval_required_before_install") is not True:
        errors.append(issue("error", "approval_required_flag_missing", f"{cid}: approval flag must be true"))

    install_method = str(candidate.get("install_method", ""))
    if INSTALL_SCRIPT_PATTERN.search(install_method):
        errors.append(issue("error", "install_script_not_allowed", f"{cid}: install scripts are forbidden"))

    permissions = candidate.get("required_permissions")
    if not isinstance(permissions, list) or not all(isinstance(item, str) for item in permissions):
        errors.append(issue("error", "invalid_required_permissions", f"{cid}: permissions must be strings"))

    if str(candidate.get("filesystem_access", "")) in FORBIDDEN_FILESYSTEM_ACCESS:
        errors.append(issue("error", "forbidden_filesystem_access", f"{cid}: full disk access is forbidden"))

    if str(candidate.get("network_access", "")) in {"raw_internet", "unrestricted"}:
        errors.append(issue("error", "unrestricted_network_access", f"{cid}: unrestricted network is forbidden"))

    if not isinstance(candidate.get("command_execution"), bool):
        errors.append(issue("error", "invalid_command_execution", f"{cid}: command_execution must be boolean"))

    secret_access_required = candidate.get("secret_access_required")
    if not isinstance(secret_access_required, bool):
        errors.append(issue("error", "invalid_secret_access_required", f"{cid}: secret flag must be boolean"))
    elif secret_access_required and action not in {"reject", "read_only"}:
        errors.append(issue("error", "secret_access_not_sandboxable", f"{cid}: secrets require reject/read_only"))

    category_text = f"{candidate.get('category', '')} {candidate.get('skill_name', '')}"
    if HIGH_RISK_CATEGORY_PATTERN.search(category_text) and action not in {"reject", "read_only"}:
        errors.append(
            issue(
                "error",
                "high_risk_domain_requires_reject_or_read_only",
                f"{cid}: trading/wallet/payment/crypto/mainnet candidates must be reject/read_only",
            )
        )

    if "not verified" in str(candidate.get("license", "")).casefold():
        warnings.append(issue("warning", "license_not_verified", f"{cid}: license needs review before promotion"))

    return {
        "candidate_id": cid,
        "errors": errors,
        "status": "PASS" if not errors else "FAIL",
        "warnings": warnings,
    }


def validate_catalog(catalog: dict[str, Any]) -> dict[str, Any]:
    candidates = catalog.get("candidates")
    if not isinstance(candidates, list):
        return {
            "candidate_count": 0,
            "candidate_results": [],
            "error_count": 1,
            "status": "FAIL",
            "warning_count": 0,
        }

    results = [validate_candidate(candidate, index) for index, candidate in enumerate(candidates)]
    error_count = sum(len(result["errors"]) for result in results)
    warning_count = sum(len(result["warnings"]) for result in results)
    return {
        "candidate_count": len(candidates),
        "candidate_results": results,
        "error_count": error_count,
        "status": "PASS" if error_count == 0 else "FAIL",
        "warning_count": warning_count,
    }


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("catalog", nargs="?", default="skills/registry/open_source_skill_candidates.json")
    parser.add_argument("--json", action="store_true")
    args = parser.parse_args()

    catalog = json.loads(Path(args.catalog).read_text(encoding="utf-8"))
    result = validate_catalog(catalog)
    if args.json:
        print(json.dumps(result, indent=2, sort_keys=True))
    else:
        print(f"validator_status={result['status']}")
        print(f"candidate_count={result['candidate_count']}")
        print(f"error_count={result['error_count']}")
        print(f"warning_count={result['warning_count']}")
    return 0 if result["status"] == "PASS" else 1


if __name__ == "__main__":
    raise SystemExit(main())
