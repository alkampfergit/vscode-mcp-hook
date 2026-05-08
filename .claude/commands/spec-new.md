---
description: Draft a new feature spec under docs/specs/. Captures what + why, never how.
argument-hint: <short feature description>
---

Phase 1 (Spec) of the workflow in `AGENTS.md`. Skill: `.claude/skills/sdd/SKILL.md`.

User input: $ARGUMENTS

## Pre-flight

Verify the repo is bootstrapped:

- `AGENTS.md`, `CLAUDE.md`, `ARCHITECTURE.md` exist at the repo root.
- `docs/specs/_template.md` exists.

If any are missing, **stop** and tell the user to run `/sdd-init` first.

## Procedure

1. Read `AGENTS.md` and `ARCHITECTURE.md` if you have not already this session.
2. List `docs/specs/` and pick the next free `NNNN` (skip `_template.md`). Never reuse a number.
3. Choose a kebab-case slug (≤ 5 words) from the user's description.
4. Copy `docs/specs/_template.md` to `docs/specs/NNNN-<slug>.md` and fill it in based on the description.
5. For any field you had to guess, mark it **(proposed)** and add a corresponding line to **§7 Open questions**.
6. Set the status to `draft`.
7. Stop. Show the user a short summary:
   - The new file path.
   - The 3–5 most important open questions.
   - A reminder that they should run `/spec-plan NNNN` only after the spec is approved.

## Hard rules

- No file paths, library names, or implementation choices anywhere in the spec.
- No code blocks except for sample inputs/outputs.
- Do not start a plan or tasks file in this command. Only the spec.
