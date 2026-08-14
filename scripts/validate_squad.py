#!/usr/bin/env python3
"""Validate the ProdSquad squad against the CONTRACT.md invariants.

Usage:
    python scripts/validate_squad.py [root]

Exit 0 if the squad is consistent, 1 otherwise. Dependency-free (stdlib only).

Invariants enforced (see CONTRACT.md §7):
  1. Every canonical roster id has a matching .claude/agents/<id>.md file.
  2. Every agent file has the required frontmatter keys + body H2 sections.
  3. No agent file exists outside the canonical roster (no drift).
  4. Every `*.md` reference named by the orchestrator resolves to a real file.
"""
from __future__ import annotations

import re
import sys
from pathlib import Path

REQUIRED_FRONTMATTER = ("name", "description")
REQUIRED_SECTIONS = (
    "## Mandate",
    "## Operational Framework",
    "## Investor Bar",
    "## Anti-Patterns",
    "## Voice",
)


def _parse_frontmatter(text: str) -> dict[str, str]:
    """Tiny YAML-frontmatter reader: the leading `---` block, `key: value` lines."""
    if not text.startswith("---"):
        return {}
    end = text.find("\n---", 3)
    if end == -1:
        return {}
    fm: dict[str, str] = {}
    for line in text[3:end].splitlines():
        m = re.match(r"^([A-Za-z_]+):\s*(.*)$", line)
        if m:
            fm[m.group(1)] = m.group(2).strip()
    return fm


def _canonical_roster(contract: Path) -> list[str]:
    """Roster ids = first-cell backticked ids of the CONTRACT roster table."""
    ids: list[str] = []
    for line in contract.read_text().splitlines():
        m = re.match(r"^\|\s*`([a-z][a-z-]+)`\s*\|", line)
        if m:
            ids.append(m.group(1))
    return ids


def _resolve(root: Path, skill_dir: Path, token: str) -> bool:
    """A `*.md` reference resolves if found relative to the skill dir or the repo root."""
    if "/" in token:
        return (skill_dir / token).exists() or (root / token).exists()
    for d in ("templates", "references"):
        if (skill_dir / d / token).exists():
            return True
    for d in ("memory", "brand", "."):
        if (root / d / token).exists():
            return True
    return False


def validate(root: Path) -> list[str]:
    root = Path(root)
    errors: list[str] = []
    agents_dir = root / ".claude" / "agents"
    skill_dir = root / ".claude" / "skills" / "prod-squad"
    contract = root / "CONTRACT.md"

    if not contract.exists():
        return ["CONTRACT.md missing — cannot validate"]
    if not skill_dir.exists():
        errors.append(".claude/skills/prod-squad/ missing (orchestrator)")

    roster = _canonical_roster(contract)
    if not roster:
        errors.append("CONTRACT.md: could not parse a roster table")

    # Invariants 1 & 2 — every roster id maps to a well-formed agent file.
    for aid in roster:
        f = agents_dir / f"{aid}.md"
        if not f.exists():
            errors.append(f"roster id '{aid}' has no agent file (.claude/agents/{aid}.md)")
            continue
        text = f.read_text()
        fm = _parse_frontmatter(text)
        for key in REQUIRED_FRONTMATTER:
            if not fm.get(key):
                errors.append(f"{aid}.md: missing frontmatter key '{key}'")
        for sec in REQUIRED_SECTIONS:
            if sec not in text:
                errors.append(f"{aid}.md: missing body section '{sec}'")

    # Invariant 3 — no orphan agent files (roster drift).
    if agents_dir.exists():
        for f in sorted(agents_dir.glob("*.md")):
            if f.stem not in roster:
                errors.append(f"agent file '{f.name}' is not in the CONTRACT roster (drift)")

    # Invariant 4 — every `*.md` reference the orchestrator names must exist.
    for src in (skill_dir / "SKILL.md", skill_dir / "references" / "lifecycle.md"):
        if not src.exists():
            errors.append(f"orchestrator file missing: {src.relative_to(root)}")
            continue
        for token in re.findall(r"`([^`]+\.md)`", src.read_text()):
            if any(c in token for c in "<>{}"):  # skip placeholders like templates/<name>.md
                continue
            if not _resolve(root, skill_dir, token):
                errors.append(f"{src.relative_to(root)}: dangling reference '{token}'")

    return errors


def main(argv: list[str] | None = None) -> int:
    argv = argv if argv is not None else sys.argv
    root = Path(argv[1]).resolve() if len(argv) > 1 else Path(__file__).resolve().parents[1]
    errors = validate(root)
    if errors:
        print(f"✗ {len(errors)} problem(s) in {root}:")
        for e in errors:
            print(f"  - {e}")
        return 1
    print(f"✓ squad valid — all CONTRACT invariants hold ({root})")
    return 0


if __name__ == "__main__":
    raise SystemExit(main(sys.argv))
