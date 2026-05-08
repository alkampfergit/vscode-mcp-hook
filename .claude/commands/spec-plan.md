---
description: Turn an approved spec into an implementation plan grounded in the real repo.
argument-hint: <NNNN spec number>
---

Phase 2 (Plan) of the workflow in `AGENTS.md`. Skill: `.claude/skills/sdd/SKILL.md`.

Spec number: $ARGUMENTS

## Pre-flight

Verify `AGENTS.md`, `ARCHITECTURE.md`, and `docs/plans/_template.md` exist. If not, stop and tell the user to run `/sdd-init`.

## Procedure

1. Resolve the spec: open `docs/specs/NNNN-*.md` matching the number. If multiple match, fail clearly. If none, tell the user to run `/spec-new`.
2. Verify spec status is `approved`. If `draft`, **stop** and tell the user the spec must be approved first.
3. Re-read `ARCHITECTURE.md` end to end.
4. Walk the codebase as needed to confirm the paths you'll reference exist. Do not invent paths.
5. Copy `docs/plans/_template.md` to `docs/plans/NNNN-<same-slug>.md` and fill every section.
6. Pay special attention to:
   - **§2 Components touched** — must use real paths or be explicitly marked `(new)`.
   - **§6 Test strategy** — name the test projects/folders, not "we'll add tests."
   - **§7 Rollout** — feature flag, migration order, rollback plan.
   - **§11 Architecture impact** — flip checkboxes for the `ARCHITECTURE.md` sections that will need updating.
7. If writing the plan reveals gaps in the spec, **stop**. Surface the gap to the user. Do not silently revise the spec.
8. Set plan status to `draft`. Stop. Tell the user to review before `/spec-tasks NNNN`.

## Hard rules

- The plan must be executable by an agent that has only the spec, this plan, and `ARCHITECTURE.md`.
- Library choices, framework patterns, and naming conventions live here, not in the spec.
- Do not start writing tasks in this command.
