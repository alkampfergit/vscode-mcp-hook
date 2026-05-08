# Plan NNNN — <Feature name>

- **Status:** `draft` | `approved` | `implemented`
- **Spec:** `docs/specs/NNNN-<slug>.md`
- **Created:** YYYY-MM-DD
- **Author:** <name>

> Plans are grounded in the **actual repo**. Every component reference must resolve to a real path in `ARCHITECTURE.md` or in the working tree. No invented paths.

## 1. Summary

<!-- 3–5 sentences: the implementation approach in plain language. -->

## 2. Components touched

| Path / Module | Role in this change | Existing or new |
|---|---|---|
| `src/<path>` | <what changes here> | existing / new |

## 3. Data changes

- **Schema:** <new tables, columns, indexes>
- **Migrations:** <forward + rollback strategy>
- **Backfill / seed:** <if needed>

## 4. External integrations

- <service> — <call shape, auth, retry, timeout>
- None (delete this section if so)

## 5. API / contract changes

- New endpoints: <method + path, request/response shape, error codes>
- Breaking changes: none / list them.
- OpenAPI / SDK regeneration required: yes/no.

## 6. Test strategy

- **Unit:** <what's covered, where the tests live>
- **Integration:** <DB, message bus, HTTP — where they live>
- **E2E:** <if any — keep this minimal>
- **Performance / load:** <if NFRs require it>
- **Manual checks:** <if unavoidable, list them>

## 7. Rollout

- **Feature flag:** <name, default state, who flips it>
- **Migration order:** schema → code → flag-on
- **Rollback plan:** <how to disable safely>
- **Observability before flip:** <metrics, alerts to add first>

## 8. Risks and trade-offs

- <risk> — <mitigation>
- <trade-off> — <why this trade was acceptable>

## 9. Out of scope (deferred)

<!-- What this plan deliberately does not solve, with a pointer to a follow-up spec if relevant. -->

## 10. Open questions

- [ ] <question> — owner, due

## 11. Architecture impact

<!-- If this plan changes the repo map, list the ARCHITECTURE.md sections that will need editing. -->
- [ ] Repository map: <yes/no>
- [ ] Module guide: <yes/no — which modules>
- [ ] Data stores / external systems: <yes/no>
- [ ] Change guide entries: <yes/no>
- [ ] Glossary: <yes/no>
