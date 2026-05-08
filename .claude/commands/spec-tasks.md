---
description: Decompose an approved plan into an ordered, atomic task checklist.
argument-hint: <NNNN spec number>
---

Phase 3 (Tasks) of the workflow in `AGENTS.md`. Skill: `.claude/skills/sdd/SKILL.md`.

Spec number: $ARGUMENTS

## Pre-flight

Verify `docs/tasks/_template.md` exists. If not, stop and tell the user to run `/sdd-init`.

## Procedure

1. Open `docs/specs/NNNN-*.md` and `docs/plans/NNNN-*.md`. Verify plan status is `approved`. If not, stop.
2. Copy `docs/tasks/_template.md` to `docs/tasks/NNNN-<same-slug>.md`.
3. Decompose the plan into atomic tasks. Each task:
   - Has one verifiable goal.
   - Has a tight **File scope** (the smallest set of paths it can touch).
   - Has a **Done when** check that is runnable (a test name, a command + expected exit, a file that must exist).
   - Leaves the repo green — build + tests pass after the task.
   - Is ≤ ~150 lines of diff.
4. Order tasks so:
   - Schema/contract changes precede code that depends on them.
   - The first task usually adds a failing test that captures a §4 spec scenario.
   - Each task is mergeable independently if the chain were cut.
5. If the plan implies repo-map changes, pre-populate the **Pending arch updates** block at the bottom of the tasks file from the plan's §11.
6. Stop. Show the user:
   - The task list at a glance (T01, T02, …) with one-line summaries.
   - A reminder to run `/spec-do NNNN T01` when ready.

## Hard rules

- A task that says "and also fix X while we're here" is not atomic. Split it.
- A task without a runnable Done-when check is not ready. Refine it.
- Do not start implementing in this command.
