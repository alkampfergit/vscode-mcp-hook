---
description: Execute one task from a spec's task file. Atomic, scoped, verified.
argument-hint: <NNNN> [task-id, e.g. T01]
---

Phase 4 (Implement) of the workflow in `AGENTS.md`. Skill: `.claude/skills/sdd/SKILL.md`.

Args: $ARGUMENTS  (expect: `NNNN [task-id]`)

## Pre-flight

Verify `AGENTS.md` and `ARCHITECTURE.md` exist. If not, stop and tell the user to run `/sdd-init`.

## Procedure

1. Parse args. If no task-id, pick the first task in `docs/tasks/NNNN-*.md` whose Status is `not started`. If all are done, stop and tell the user.
2. Read the spec, plan, and tasks file for context. Read `ARCHITECTURE.md` for relevant module entries.
3. Re-read **just this task**: Goal, File scope, Steps, Done when.
4. **Stop and ask** if any of these are unclear or under-specified. Do not invent details.
5. Mark the task `in progress` in the tasks file.
6. Implement the task:
   - Stay strictly inside **File scope**. If you need to touch more, stop and propose a scope expansion or a task split.
   - Make the smallest change that satisfies **Done when**.
   - Follow existing patterns in the module — use the **Reference example** from `ARCHITECTURE.md` if one is named.
7. Run the **Done when** checks. They must pass before continuing.
8. Run the broader test command for the touched module (project- or workspace-scoped). They must pass.
9. Mark the task `done` in the tasks file.
10. If this task changed the repo map (new module, moved folder, new external integration, new data store), append a line to the file's **Pending arch updates** block.
11. Stop. Report:
    - What changed (files touched).
    - Which tests ran and their result.
    - The next task ID, if any.
    - Whether `/arch-update` should be run now.

## Hard rules

- Do not edit `docs/specs/*` from this command. If reality forces a spec change, stop and surface it.
- Do not auto-roll into the next task unless the user explicitly asks.
- If a Done-when check fails, do not weaken or skip it. Either make it pass or report the blocker honestly.
