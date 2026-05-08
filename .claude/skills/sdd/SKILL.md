---
name: sdd
description: Spec-driven development workflow. Use whenever the user wants to add, change, or remove behavior — i.e. anything that would normally start with "implement…", "add a feature for…", "change the way X works", "fix the behavior of…". Walks the spec → plan → tasks → implement → arch-update loop, reading and writing files under docs/specs, docs/plans, docs/tasks. Do NOT use for pure refactors with no behavior change, dependency bumps, or typo fixes.
---

# Spec-driven development

This skill enforces the workflow defined in the repo's `AGENTS.md`. It owns four document types: **specs** (what + why), **plans** (how), **tasks** (atomic execution checklist), and architectural updates that flow from them.

## Bundled resources

This skill ships templates inside its directory. Reference them via `${CLAUDE_SKILL_DIR}/templates/`:

- `${CLAUDE_SKILL_DIR}/templates/AGENTS.md` — the rules (copied to repo root by `/sdd-init`).
- `${CLAUDE_SKILL_DIR}/templates/CLAUDE.md` — Claude Code pointer (repo root).
- `${CLAUDE_SKILL_DIR}/templates/ARCHITECTURE.md` — repo map (repo root).
- `${CLAUDE_SKILL_DIR}/templates/spec.md` — copied to `docs/specs/_template.md` and used per spec.
- `${CLAUDE_SKILL_DIR}/templates/plan.md` — copied to `docs/plans/_template.md`.
- `${CLAUDE_SKILL_DIR}/templates/tasks.md` — copied to `docs/tasks/_template.md`.

## Pre-flight check (every run)

Before doing real work, verify the repo has been bootstrapped:

1. Check that `AGENTS.md`, `CLAUDE.md`, `ARCHITECTURE.md` exist at the repo root.
2. Check that `docs/specs/`, `docs/plans/`, `docs/tasks/` exist.

If any are missing, **stop and tell the user to run `/sdd-init`**. Do not silently create them.

If everything is in place, read `AGENTS.md` and `ARCHITECTURE.md` once per session before continuing.

## Decide which phase you are in

Look at what the user asked for and what files already exist:

| Situation | Phase |
|---|---|
| User describes a new feature, no spec yet | **Spec** |
| Spec exists, no plan | **Plan** |
| Plan exists, no tasks file | **Tasks** |
| Tasks file exists with un-done items | **Implement** |
| Tasks all done, `## Pending arch updates` non-empty | **Arch update** |
| User asks "does the code match the spec?" | **Audit** (delegate to `spec-auditor` subagent) |

If unsure, ask the user which phase they want.

## Phase 1 — Spec

Goal: produce `docs/specs/NNNN-<slug>.md`.

1. Find the next free `NNNN` by listing `docs/specs/` and taking `max + 1`. Skip the `_template.md` file. Never reuse a number.
2. Choose a short kebab-case slug from the feature name (`<= 5 words`).
3. Copy `docs/specs/_template.md` to the new path.
4. Fill **§1 Problem**, **§2 Users**, **§3 Scope** from the user's description.
5. For **§4 Behavior**, write Given/When/Then scenarios. If the user gave examples, use them; otherwise propose 2–3 and ask for confirmation.
6. **§5 NFRs** — propose defaults (latency, auth, observability) but mark them as **proposed** until confirmed.
7. **§7 Open questions** — anything you had to guess goes here. Surface these to the user before asking them to approve.
8. Set status to `draft`. Stop. Ask the user to review before moving to plan.

**Hard rules**
- No file paths, library names, or implementation choices in the spec.
- No code blocks except for sample inputs/outputs (e.g. JSON payloads).
- If the user pushes you to "just write the code," push back: the spec exists so the next phase has something to ground in.

## Phase 2 — Plan

Goal: produce `docs/plans/NNNN-<slug>.md`.

1. Re-read the spec and `ARCHITECTURE.md` end to end.
2. Verify spec status is `approved`. If `draft`, **stop** and tell the user the spec must be approved first.
3. Copy `docs/plans/_template.md` to the new path.
4. List actual files you plan to touch. **Verify each path exists** (or mark it as `(new)`).
5. Fill the components table, data changes, integrations, contract changes, test strategy, rollout, risks.
6. Fill **§11 Architecture impact** — this is what `/arch-update` will consume later.
7. If you find yourself wanting to change the spec, **stop**. Surface the issue and let the user decide whether to revise the spec or the plan.

**Hard rules**
- Every path mentioned must be real or explicitly marked `(new)`.
- If the plan would require an unjustified deviation from `ARCHITECTURE.md` patterns, call it out as a risk.
- The plan must be implementable by a fresh agent reading only the spec, plan, and `ARCHITECTURE.md`.

## Phase 3 — Tasks

Goal: produce `docs/tasks/NNNN-<slug>.md`.

1. Read the plan. Verify status is `approved`.
2. Copy `docs/tasks/_template.md` to the new path.
3. Decompose into **atomic** tasks: each one a single goal, ≤ ~150 lines of diff, leaves the repo green.
4. Order them so each task can be merged independently if the chain were cut. Schema migrations come before code that depends on them. Tests for a unit come with that unit, not at the end.
5. For every task, fill **File scope** and **Done when**. "Done when" must be a runnable check, not a vibe.
6. If the plan implies repo-map changes, pre-populate **Pending arch updates** at the bottom from the plan's §11.

**Hard rules**
- A task that says "and also fix X while we're here" is not atomic. Split it.
- A task without a runnable Done-when check is not ready.
- The first task is usually a failing test that captures the spec scenario.

## Phase 4 — Implement

Goal: execute one task from `docs/tasks/NNNN-<slug>.md`.

1. Re-read the task's **Goal**, **File scope**, **Done when**.
2. If anything is unclear, **stop and ask**. Do not invent.
3. Make the smallest change that satisfies Done-when. Stay inside File scope.
4. Run the Done-when checks. They must pass.
5. Run the broader test command for the touched module (project- or workspace-scoped, not the whole monorepo unless tiny).
6. Mark the task `done` in the tasks file.
7. If the change touches the repo map, append to **Pending arch updates** in the tasks file.
8. Stop. Don't auto-roll into the next task unless the user says so.

**Hard rules**
- Never edit `docs/specs/*` from this phase. If reality forces a spec change, stop and surface it.
- Never widen File scope silently. If a task needs to touch more, propose splitting or expanding it explicitly.
- If a Done-when check fails, do not "fix it later." Either make it pass or report the blocker.

## Phase 5 — Arch update

Delegate to the `arch-keeper` skill (`.claude/skills/arch-keeper/SKILL.md`).

## Phase 6 — Audit

Delegate to the `spec-auditor` subagent (`.claude/agents/spec-auditor.md`). It runs in an isolated context so its findings aren't biased by your implementation reasoning.

## Common pitfalls

- **Skipping the spec because "it's small."** If it's truly small, say so explicitly and follow the trivial-change carve-out in `AGENTS.md`. Otherwise write the spec.
- **Writing a plan that pretends `ARCHITECTURE.md` doesn't exist.** Always cite the modules and paths you're working in.
- **Bundling tasks.** Five tasks in one PR means none of them is reviewable.
- **Editing the spec mid-implementation.** This is the strongest signal that the plan was wrong; surface it, don't paper over it.
