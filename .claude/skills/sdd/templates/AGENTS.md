# AGENTS.md

This file is the operating contract for any AI agent (Claude Code, Codex, etc.) working in this repo. **Read it fully before making any non-trivial change.**

`CLAUDE.md` at the repo root points here so Claude Code picks up the same rules.

---

## Prime directives

1. **Specs are the source of truth for behavior.** If behavior is not in a spec under `docs/specs/`, it is not committed behavior. Do not invent requirements; ask or draft a spec first.
2. **`ARCHITECTURE.md` is the source of truth for the map.** Use it to find files. If your change makes it stale, update it in the same change.
3. **Do not skip phases.** The workflow is `spec → plan → tasks → implement`. Skipping a phase is allowed only for trivial changes (typo, dependency bump, single-file refactor with no behavior change).
4. **Small, reviewable steps.** Implement one task at a time. Run tests after each task. Never bundle unrelated changes.
5. **Ask before assuming on ambiguity.** If a spec, plan, or task is unclear, stop and ask. Do not "fill in the gaps" silently.
6. **Never edit `docs/specs/*` while implementing.** If reality forces a spec change, stop the implementation, propose the spec edit, get it approved, then resume.

## The workflow

```
┌───────────┐   ┌───────────┐   ┌───────────┐   ┌─────────────┐   ┌───────────────┐
│ /spec-new │ → │ /spec-plan│ → │/spec-tasks│ → │  /spec-do   │ → │ /arch-update  │
│           │   │           │   │           │   │ (per task)  │   │ (post-merge)  │
└───────────┘   └───────────┘   └───────────┘   └─────────────┘   └───────────────┘
   spec.md         plan.md         tasks.md        code + tests       ARCHITECTURE.md
```

Each phase has its own slash command. Skills under `.claude/skills/` load automatically when relevant. Codex users invoke phases by name: *"Following AGENTS.md, run Phase 1 (spec) for feature X."*

### Phase 1 — Spec (`/spec-new`)

Goal: capture **what** and **why**, never **how**.

- One feature = one spec at `docs/specs/NNNN-slug.md`. `NNNN` is the next free 4-digit number.
- Use `docs/specs/_template.md`.
- A spec is done when it has: problem, users, scope (in/out), behavior (Given/When/Then), non-functional constraints, and open questions.
- No code, no file paths, no library choices in a spec.

### Phase 2 — Plan (`/spec-plan NNNN`)

Goal: capture **how**, grounded in the actual repo.

- One spec = one plan at `docs/plans/NNNN-slug.md`. Use `docs/plans/_template.md`.
- The plan must reference real files from `ARCHITECTURE.md` and the codebase. No invented paths.
- The plan must list: components touched, new components, data changes, external integrations, test strategy, rollout/migration, risks.
- Re-read `ARCHITECTURE.md` before writing the plan.

### Phase 3 — Tasks (`/spec-tasks NNNN`)

Goal: turn the plan into an ordered checklist a single agent can execute.

- Tasks at `docs/tasks/NNNN-slug.md`. Use `docs/tasks/_template.md`.
- Each task: one verifiable outcome, a tight file scope, an explicit "done when" check (test passes, command exits 0, etc.).
- Order tasks so each one leaves the repo green (build + tests).

### Phase 4 — Implement (`/spec-do NNNN [task-id]`)

Goal: execute one task end to end.

- Read the task. If unclear, stop and surface the question.
- Make the smallest change that satisfies the "done when" check.
- Run the build and the tests scoped to the task.
- Mark the task complete in `docs/tasks/NNNN-slug.md`.
- If the change touches the repo map (new module, moved folder, new external integration), append a note under `## Pending arch updates` in the task file.

### Phase 5 — Arch update (`/arch-update`)

Goal: keep `ARCHITECTURE.md` from drifting.

- Run after a feature merges or when `## Pending arch updates` is non-empty.
- Update repo map, module guide, data flow, change guide, glossary as needed.
- A diff to `ARCHITECTURE.md` is a normal part of feature PRs, not a separate cleanup task.

## File layout

```
repo/
├── AGENTS.md                  ← you are here
├── CLAUDE.md                  ← pointer to AGENTS.md
├── ARCHITECTURE.md            ← repo map (always current)
├── docs/
│   ├── specs/                 ← what + why, one file per feature
│   ├── plans/                 ← how, one per spec
│   └── tasks/                 ← ordered checklist, one per spec
├── .claude/
│   ├── skills/                ← invoked automatically by Claude Code
│   ├── commands/              ← slash commands
│   └── agents/                ← subagents (run in isolated context)
└── …source tree, see ARCHITECTURE.md
```

## Hard rules (do not violate)

- **No edits to `docs/specs/*` from `/spec-do`.** Implementation never modifies its own contract.
- **No new top-level directories** without an entry in `ARCHITECTURE.md` in the same change.
- **Tests run green** before any task is marked complete.
- **Numbering is monotonic.** Never reuse a `NNNN`. If a spec is dropped, leave the gap.
- **Generated and legacy zones are off-limits** unless the task explicitly names them. See `ARCHITECTURE.md ▸ Avoid unless required`.

## When you're stuck

If after reading `ARCHITECTURE.md`, the spec, the plan, and the task you still don't have enough to act:

1. State precisely what's missing.
2. Cite the file and section you read.
3. Propose two or three options with trade-offs.
4. Stop and wait for input.

Do not paper over ambiguity with plausible-looking code.
