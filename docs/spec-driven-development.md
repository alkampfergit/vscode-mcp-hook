# Spec-Driven Development

This repo follows a spec-driven development (SDD) workflow tailored for AI coding agents (Claude Code, Codex, and similar). Every behavior change flows through a fixed five-phase loop, with each phase producing a numbered markdown artifact that the next phase reads. The goal is to keep agent-driven work **reviewable, revertable, and grounded in real intent** instead of plausible-sounding code.

> Recommended location: `docs/spec-driven-development.md`. You can also drop it at the repo root as `SDD.md` if you'd rather keep `docs/` reserved for specs/plans/tasks.

---

## Why this exists

Agent-driven coding fails in predictable ways: agents invent requirements that were never agreed, they "fill in the gaps" silently when context is missing, they bundle unrelated changes into single PRs, and they let architecture documentation rot until it's worse than no doc at all. The SDD workflow closes those failure modes by making each phase a **gate**: the next phase refuses to start until the previous artifact is approved.

The system rests on a clean separation of concerns:

- **Specs** own behavior — the *what* and *why*.
- **`ARCHITECTURE.md`** owns the map — *where* code lives.
- **`AGENTS.md`** owns the rules — *how* agents must operate.

Three files, three jobs, no overlap. Agents read all three before any non-trivial change.

## The loop

```
┌───────────┐   ┌───────────┐   ┌───────────┐   ┌─────────────┐   ┌───────────────┐
│ /spec-new │ → │ /spec-plan│ → │/spec-tasks│ → │  /spec-do   │ → │ /arch-update  │
│           │   │           │   │           │   │ (per task)  │   │ (post-merge)  │
└───────────┘   └───────────┘   └───────────┘   └─────────────┘   └───────────────┘
   spec.md         plan.md         tasks.md        code + tests       ARCHITECTURE.md
```

Each phase has explicit inputs, an artifact it produces, and hard rules about what it must not do.

### Phase 1 — Spec (`/spec-new`)

Captures **what** the system should do and **why**. One feature = one spec at `docs/specs/NNNN-slug.md`. Specs are written in Given/When/Then form so each scenario is independently testable. They contain no file paths, no library choices, no implementation details — those belong in the next phase.

### Phase 2 — Plan (`/spec-plan NNNN`)

Captures **how**, grounded in the actual repo. The plan references real paths from `ARCHITECTURE.md`, lists components touched, data changes, external integrations, test strategy, rollout, and risks. If writing the plan reveals a gap in the spec, the plan stops and the spec is revised — not silently patched over.

### Phase 3 — Tasks (`/spec-tasks NNNN`)

Decomposes the plan into an ordered, atomic checklist. Each task has one verifiable goal, a tight file scope, and a runnable "Done when" check (a test name, a command + expected exit, a file that must exist). Each task leaves the repo green. The first task is usually a failing test that captures a spec scenario.

### Phase 4 — Implement (`/spec-do NNNN [Tnn]`)

Executes one task end to end. The agent reads only the task it's working on, makes the smallest change that satisfies the Done-when check, runs the relevant tests, and marks the task done. **It must not edit `docs/specs/*` while implementing** — that's the rule that prevents the worst kind of drift (agents quietly rewriting the contract to match their code).

### Phase 5 — Arch update (`/arch-update`)

Refreshes `ARCHITECTURE.md` from the structural changes that just landed. Each task can append entries under `## Pending arch updates`; this phase consumes that list. Architecture maintenance is in-band with feature work, not a separate cleanup chore.

### Audit (`/spec-audit NNNN`)

Verifies code matches spec. Delegates to the `spec-auditor` subagent, which runs in an isolated context so its findings aren't biased by the implementer's reasoning. It produces a structured report: which acceptance criteria are covered, which are missing tests, which behaviors diverge, what's implemented but not in the spec.

## Repository layout

```
repo/
├── AGENTS.md                  ← rules for agents (Claude Code + Codex read this)
├── CLAUDE.md                  ← thin pointer to AGENTS.md
├── ARCHITECTURE.md            ← repo navigation map (always current)
├── docs/
│   ├── specs/                 ← what + why, one file per feature
│   ├── plans/                 ← how, one per spec
│   └── tasks/                 ← ordered atomic checklist, one per spec
└── .claude/
    ├── README.md              ← plugin docs
    ├── skills/
    │   ├── sdd/               ← the workflow itself
    │   └── arch-keeper/       ← keeps ARCHITECTURE.md fresh
    ├── commands/              ← slash commands
    └── agents/
        └── spec-auditor.md    ← isolated-context reviewer
```

## Slash commands

| Command | Purpose |
|---|---|
| `/sdd-init` | One-time bootstrap. Copies `AGENTS.md`, `CLAUDE.md`, `ARCHITECTURE.md` and doc templates into place. Never overwrites. |
| `/spec-new "<feature>"` | Phase 1 — draft a new spec. |
| `/spec-plan NNNN` | Phase 2 — turn an approved spec into a plan grounded in the real repo. |
| `/spec-tasks NNNN` | Phase 3 — decompose an approved plan into atomic ordered tasks. |
| `/spec-do NNNN [Tnn]` | Phase 4 — execute one task end to end. |
| `/spec-audit NNNN` | Run the auditor subagent against an implemented spec. |
| `/arch-update` | Phase 5 — refresh `ARCHITECTURE.md` from `Pending arch updates`. |

## A feature, end to end

```text
$ /spec-new "Allow customers to save draft orders"
   → docs/specs/0001-save-draft-orders.md           (review, set status: approved)

$ /spec-plan 0001
   → docs/plans/0001-save-draft-orders.md           (review, set status: approved)

$ /spec-tasks 0001
   → docs/tasks/0001-save-draft-orders.md           (T01..T05)

$ /spec-do 0001 T01    # add failing test for the spec scenario
$ /spec-do 0001 T02    # add the OrderDraft aggregate
$ /spec-do 0001 T03    # add persistence
$ /spec-do 0001 T04    # add the HTTP endpoint
$ /spec-do 0001 T05    # wire feature flag

$ /spec-audit 0001
   → drift report from a clean-context subagent

$ /arch-update
   → ARCHITECTURE.md refreshed from "Pending arch updates"
```

Every step leaves the repo green. Any step can be reviewed and reverted independently.

## Working with Codex

Codex reads `AGENTS.md` natively, so the rules apply identically. The slash commands are Claude Code-specific, but every skill body in `.claude/skills/` is plain markdown — Codex can read them on instruction. To run a phase from Codex:

> "Following `AGENTS.md` and `.claude/skills/sdd/SKILL.md`, run **Phase 1 (spec)** for: <feature description>."

> "Following `.claude/skills/sdd/SKILL.md`, run **Phase 4 (implement)** for spec 0001, task T01."

For the auditor, paste the body of `.claude/agents/spec-auditor.md` as the system prompt of a fresh Codex session and pass it the spec number.

## Design principles

A few choices are load-bearing and worth understanding before changing the workflow:

**Phases are gates, not suggestions.** `/spec-plan` refuses a `draft` spec; `/spec-tasks` refuses a `draft` plan. The most common failure mode in agent-driven dev is silently skipping a phase when it feels redundant. The gates make that failure visible.

**Specs are immutable from `/spec-do`.** If reality contradicts the spec, the agent must stop and surface the conflict. Letting implementation rewrite its own contract is the worst kind of drift — code starts looking right while the requirements drift away.

**Tasks are atomic.** Each task ≤ ~150 lines of diff, with a runnable Done-when check, leaving the repo green. Bundling tasks ("and also fix X while we're here") makes both review and revert impossible.

**`ARCHITECTURE.md` is updated in-band.** A feature PR with stale architecture docs is incomplete by definition. The `Pending arch updates` block in each tasks file is consumed by `/arch-update` so this never becomes orphaned cleanup work.

**The auditor runs in isolation.** Self-review by the agent that wrote the code is mostly theatre — it has too much context and too much sunk reasoning. A subagent with a clean context and a single job (compare spec to code) catches drift the implementer rationalized away.

**Numbering is monotonic.** `NNNN` is never reused. Dropped specs leave gaps. This keeps cross-references stable and makes audit trails legible.

## Bootstrapping `ARCHITECTURE.md`

The init command leaves `ARCHITECTURE.md` full of `TODO` placeholders because no template can guess your repo. To fill it in, ask the agent:

> "Read this entire repo and rewrite `ARCHITECTURE.md`, replacing every TODO. Use stable file paths, list real reference example files (don't invent any), detect external systems from dependency manifests, and mark anything you had to guess with `<!-- ?? verify -->`."

Once `ARCHITECTURE.md` reflects reality — even just the repo map and one or two module blocks — `/spec-new` can productively reference it.

## Customizing for your stack

A few extension points are worth knowing:

- **Stack-specific test commands** belong in `.claude/skills/sdd/SKILL.md` under Phase 4. Reference the actual commands you use (`dotnet test --filter Category=Unit`, `pnpm -F api test`, `pytest -k`, etc.) instead of generic placeholders.
- **A domain glossary** at `docs/specs/_glossary.md` helps when agents keep getting domain terms wrong.
- **Nested `AGENTS.md`** in large bounded contexts (e.g. `src/Payments/AGENTS.md`) carry area-local rules. Keep the root file as the router.
- **Pre-commit hook** that fails when `docs/tasks/*.md` has open `Pending arch updates` is a cheap guard against architecture drift.

## Pitfalls to watch for

- **The "trivial" carve-out being abused.** Anything user-observable is not trivial. The carve-out is for typo fixes and dependency bumps, not "small features."
- **Specs growing implementation details.** A spec that mentions `OrderRepository` or `Postgres` has drifted into plan territory. Move it.
- **Tasks bundling.** "T03: implement endpoint and add tests and update docs" is three tasks, not one.
- **Architecture drift.** If `/arch-update` is producing big diffs, it's been skipped for several features. Run it per feature.
- **Spec edits during implementation.** This is the strongest signal that the plan was wrong. Surface it; don't paper over it.

## Hard rules (do not violate)

- No edits to `docs/specs/*` from `/spec-do`.
- No new top-level directories without an entry in `ARCHITECTURE.md` in the same change.
- Tests run green before any task is marked complete.
- Numbering is monotonic; never reuse `NNNN`.
- Generated and legacy zones are off-limits unless the task explicitly names them.

When in doubt, the order of authority is: `AGENTS.md` > spec > plan > tasks > code. If two disagree, the higher-authority file wins, and the lower-authority file should be updated to match.
