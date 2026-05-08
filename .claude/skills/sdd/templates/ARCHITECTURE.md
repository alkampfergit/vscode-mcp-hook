# ARCHITECTURE.md

> The repo map. Read this **before** changing behavior. Update it **in the same change** if the structure shifts.
> Companion files: [`AGENTS.md`](./AGENTS.md) (rules), [`docs/specs/`](./docs/specs) (behavior).

## Purpose

<!-- One paragraph: what the system does, who uses it, top constraints. -->
TODO: describe the product, primary users, and the 2-3 hardest technical constraints.

## How to use this file

This is a **progressive disclosure hub**. It gives you the map; detail lives in linked files.

- **Find a module** → scan the Module index below, follow the Detail link.
- **Understand a cross-cutting concern** → follow the links in the Links section.
- **Know what else to touch** → read [`arch/change-guide.md`](arch/change-guide.md).
- **Look up a term** → read [`arch/glossary.md`](arch/glossary.md).
- **Know what NOT to touch** → read the Avoid section below.

## Repository map

<!-- Top-level directories, one bullet each. Stable paths only. -->
- `src/` — TODO: replace with your real top-level source layout.
- `tests/` — TODO: replace.
- `arch/` — cross-cutting architecture detail files.
- `docs/specs/` — feature specs (the *what*).
- `docs/plans/` — implementation plans (the *how*).
- `docs/tasks/` — ordered task lists (the *do*).

## Runtime flow

<!-- The 30-second tour. One sentence per step. -->
1. TODO: entry point.
2. TODO: dispatch.
3. TODO: domain/business logic.
4. TODO: persistence and outbound integrations.
5. TODO: response shape.

## Module index

<!-- One row per module. Link to co-located ARCHITECTURE.md for complex dirs, or mark (hub-only) for simple ones. -->

| Module | Responsibility | Detail |
|---|---|---|
| TODO: Module name | One sentence. | [`src/<dir>/ARCHITECTURE.md`](src/<dir>/ARCHITECTURE.md) |

<!-- For simple modules (1-2 files, no local invariants), skip the Detail link and put (hub-only). -->

## Links

- [Change guide](arch/change-guide.md) — "if you change X, also touch Y."
- [External systems](arch/external-systems.md) — third-party services and their adapters.
- [Glossary](arch/glossary.md) — domain terms, one line each.

## Avoid unless required

<!-- Folders agents should not touch by default. -->
