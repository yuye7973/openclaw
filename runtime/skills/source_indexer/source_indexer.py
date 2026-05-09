"""Runtime source indexer anchor for OpenClaw autonomous checks."""

from __future__ import annotations


def collect_runtime_surface() -> dict[str, str]:
    """Return a minimal marker that the runtime surface is real."""

    return {
        "module": "source_indexer",
        "surface": "runtime",
        "status": "available",
    }
