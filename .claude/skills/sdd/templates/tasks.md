# Tasks NNNN — <Feature name>

- **Spec:** `docs/specs/NNNN-<slug>.md`
- **Plan:** `docs/plans/NNNN-<slug>.md`
- **Status:** `not started` | `in progress` | `done`

> Each task is **atomic, ordered, and verifiable**. Each task ends with the repo green (build + tests pass). Mark tasks complete as you finish them. Do not bundle.

## Conventions

- Task IDs: `T01`, `T02`, … in execution order.
- "Done when" is a concrete check: a test name, a command + expected exit code, a file that must exist.
- File scope is the smallest set of paths the task is allowed to touch.

---

## T01 — <short verb-led title>

- **Goal:** <one sentence>
- **File scope:** <comma-separated paths>
- **Steps:**
  1. <action>
  2. <action>
- **Done when:**
  - [ ] <runnable check, e.g. `pnpm test foo` exits 0>
  - [ ] <new test name passes>
- **Status:** [ ] not started   [ ] in progress   [ ] done

---

## T02 — <title>

- **Goal:** …
- **File scope:** …
- **Steps:**
  1. …
- **Done when:**
  - [ ] …
- **Status:** [ ] not started   [ ] in progress   [ ] done

---

## Pending arch updates

<!-- Append here when a task changes the repo map. /arch-update consumes this section. -->

## Sign-off

- [ ] All tasks above marked done.
- [ ] `/spec-audit NNNN` reports no drift.
- [ ] `/arch-update` run if the **Pending arch updates** list is non-empty.
- [ ] Spec status updated to `implemented`.
