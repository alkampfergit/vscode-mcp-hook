---
description: Bootstrap a repo for spec-driven development. Copies AGENTS.md, CLAUDE.md, ARCHITECTURE.md and doc templates from this plugin into the repo root. Run once per repo.
argument-hint: (no args)
---

You are bootstrapping this repo for spec-driven development. The `sdd` skill (`.claude/skills/sdd/`) ships templates that need to be copied to their final locations.

## Procedure

For each pair below, **only copy if the destination does not already exist**. Never overwrite. If a file is already there, report it and move on.

| Source (bundled in skill) | Destination (repo root) |
|---|---|
| `.claude/skills/sdd/templates/AGENTS.md` | `./AGENTS.md` |
| `.claude/skills/sdd/templates/CLAUDE.md` | `./CLAUDE.md` |
| `.claude/skills/sdd/templates/ARCHITECTURE.md` | `./ARCHITECTURE.md` |
| `.claude/skills/sdd/templates/spec.md` | `./docs/specs/_template.md` |
| `.claude/skills/sdd/templates/plan.md` | `./docs/plans/_template.md` |
| `.claude/skills/sdd/templates/tasks.md` | `./docs/tasks/_template.md` |

Steps:

1. Check what already exists at each destination. List anything found.
2. Create `docs/specs/`, `docs/plans/`, `docs/tasks/` if missing.
3. Copy each missing file from source to destination using a shell `cp`. Do not modify content during the copy.
4. Add a `.gitkeep` to any empty `docs/*` directory so Git tracks it.
5. Report:
   - What was copied (one line each).
   - What was skipped because it already existed (one line each).
   - Any errors.
6. Tell the user what to do next:
   - If `ARCHITECTURE.md` was just created, it is full of `TODO` placeholders. The single highest-leverage edit they can make right now is filling it in for their real codebase.
   - Once `ARCHITECTURE.md` reflects reality, they can run `/spec-new "<feature description>"` to start the workflow.

## Hard rules

- **Never overwrite an existing file.** Repos may already have an `ARCHITECTURE.md` or `AGENTS.md`; the user has not asked you to merge.
- **Do not edit the bundled templates** under `.claude/skills/sdd/templates/`. Those are the canonical sources for future runs.
- **Do not commit anything.** Just place the files. Let the user review and commit.
