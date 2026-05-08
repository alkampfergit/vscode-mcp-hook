# CLAUDE.md

The operating contract for this repo lives in [`AGENTS.md`](./AGENTS.md). Read it before any non-trivial change.

The repo map lives in [`ARCHITECTURE.md`](./ARCHITECTURE.md). Use it to find files; update it when your change makes it stale.

The workflow is **spec → plan → tasks → implement → arch-update**. Slash commands wire each phase:

- `/spec-new` — draft a new feature spec
- `/spec-plan NNNN` — turn a spec into an implementation plan
- `/spec-tasks NNNN` — break a plan into ordered, atomic tasks
- `/spec-do NNNN [task-id]` — execute one task end to end
- `/spec-audit NNNN` — verify implementation matches spec
- `/arch-update` — refresh `ARCHITECTURE.md` after structural change

Skills under `.claude/skills/` load automatically. Subagents under `.claude/agents/` can be invoked for isolated checks.

**If `AGENTS.md` and any other file disagree, `AGENTS.md` wins.**
