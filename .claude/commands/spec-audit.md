---
description: Verify implementation matches its spec. Runs the spec-auditor subagent for unbiased review.
argument-hint: <NNNN spec number>
---

Spec number: $ARGUMENTS

Delegate this audit to the `spec-auditor` subagent at `.claude/agents/spec-auditor.md`. The subagent runs in an isolated context so its findings are not biased by your implementation reasoning.

Pass it:

- The path to the spec: `docs/specs/NNNN-*.md`
- The path to the plan: `docs/plans/NNNN-*.md`
- The path to the tasks file: `docs/tasks/NNNN-*.md`
- The instruction: "Audit the codebase against this spec and report drift."

When it returns, summarize:

- Pass/fail per acceptance criterion.
- Any drift between spec, plan, and code.
- Anything in the plan that wasn't implemented.
- Anything implemented that isn't in the plan.

Do not silently fix the drift. Surface it; let the user decide whether to update the spec, the plan, or the code.
