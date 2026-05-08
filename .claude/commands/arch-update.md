---
description: Refresh ARCHITECTURE.md after structural changes. Reads "Pending arch updates" from task files.
argument-hint: (no args needed)
---

Phase 5 (Arch update) of the workflow in `AGENTS.md`. Skill: `.claude/skills/arch-keeper/SKILL.md`.

## Pre-flight

Verify `ARCHITECTURE.md` exists at the repo root. If not, stop and tell the user to run `/sdd-init`.

## Procedure

1. Load the `arch-keeper` skill and follow it.
2. Sources of deltas, in priority order:
   - All `docs/tasks/*.md` files with non-empty `## Pending arch updates` blocks.
   - `git log --since="2 weeks ago" --name-status` for recent structural moves.
   - `git diff` against the merge base of the current branch for the in-flight feature.
3. Update `ARCHITECTURE.md` in place. Match its existing voice and section structure.
4. After updating, tick the consumed boxes in the relevant task files (or remove the block if all items are absorbed).
5. Stop. Show the user a concise diff of `ARCHITECTURE.md` and a list of task files cleaned up.

## Hard rules from the skill

- New module blocks must include a **Reference example** file path.
- Don't add diagrams without file links.
- Stable paths only (`src/Orders/Application`, not "the order business layer").
- Each module block ≤ 10 lines, glossary entry ≤ 1 line.
