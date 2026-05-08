# Spec NNNN — <Feature name>

- **Status:** `draft` | `approved` | `implemented` | `superseded`
- **Owner:** <name or handle>
- **Created:** YYYY-MM-DD
- **Last updated:** YYYY-MM-DD
- **Linked plan:** `docs/plans/NNNN-<slug>.md` (created later)
- **Linked tasks:** `docs/tasks/NNNN-<slug>.md` (created later)
- **Supersedes:** none | `docs/specs/MMMM-<slug>.md`

> A spec describes **what** the system should do and **why**. It must not contain file paths, library names, or implementation choices — those belong in the plan.

## 1. Problem

<!-- 3–6 sentences. What is broken or missing today. Concrete, observable. No solutioning. -->

## 2. Users and use cases

<!-- Who triggers this behavior, in what context, what outcome they want. -->
- **<User type 1>** — <one-line use case>
- **<User type 2>** — <one-line use case>

## 3. Scope

**In scope**
- <bullet>
- <bullet>

**Out of scope (explicitly)**
- <bullet>
- <bullet>

## 4. Behavior

> Use Given/When/Then. Each scenario is independently testable.

### Scenario: <name>
- **Given** <precondition>
- **When** <trigger>
- **Then** <observable outcome>

### Scenario: <name>
- **Given** …
- **When** …
- **Then** …

<!-- Add edge cases, error paths, idempotency expectations. -->

## 5. Non-functional constraints

- **Performance:** <e.g. p95 < 200 ms at 100 rps>
- **Reliability:** <retry/idempotency expectations>
- **Security & privacy:** <authn/authz, PII handling>
- **Observability:** <metrics, logs, traces this feature must emit>
- **Compatibility:** <backwards compat, API versioning>

## 6. Acceptance criteria

<!-- A flat checklist a reviewer can run down. Each item is verifiable. -->
- [ ] All scenarios in §4 pass automated tests.
- [ ] Non-functional constraints in §5 are measured (link to dashboard or test).
- [ ] No regression in <related feature>.

## 7. Open questions

<!-- Anything not yet decided. Block plan creation until resolved or explicitly deferred. -->
- [ ] <question> — owner: <name>, due: <date>

## 8. References

- Related specs: …
- Tickets / discussions: …
- Domain references: …
