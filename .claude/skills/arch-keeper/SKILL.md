---
name: arch-keeper
description: >
  Maintain the architecture documentation set so it stays a living map of the repo.
  Use when a feature has just merged, when the user asks to refresh or audit the
  architecture doc, when a folder is added/moved/renamed, or when a tasks file has
  a non-empty "Pending arch updates" section. Do NOT use to write new architecture
  from scratch — for that, draft a spec/plan first.
---

# Architecture keeper

The architecture documentation uses **progressive disclosure**: a thin hub at the repo root links to detail files so agents load only what they need.

## File structure

The architecture doc set has three tiers:

### Tier 1 — Hub (always read first)

`ARCHITECTURE.md` at the repo root. Under 150 lines. Contains:

- **Purpose** — one paragraph: what, who, hardest constraints.
- **How to use this file** — reading instructions.
- **Repository map** — top-level directories, one bullet each, stable paths only.
- **Runtime flow** — numbered steps, one sentence each, the 30-second tour.
- **Module index** — table with columns: Module, Responsibility (one sentence), Detail link. Links to either `arch/<slug>.md` or a co-located `<code-folder>/ARCHITECTURE.md`.
- **Links** — pointers to `arch/change-guide.md`, `arch/external-systems.md`, `arch/glossary.md`.
- **Avoid unless required** — stop-sign list of folders agents should not touch.

The hub must never contain module deep-dives, long change-guide lists, or glossary definitions inline. Those belong in detail files.

### Tier 2 — Cross-cutting detail files (`arch/`)

`arch/` at the repo root holds detail files for concerns that span multiple modules:

| File | Contents |
|---|---|
| `arch/change-guide.md` | "If you change X, also touch Y" rules. One bullet per rule. |
| `arch/external-systems.md` | Third-party services, SDKs, and the adapter directories that wrap them. |
| `arch/glossary.md` | Domain terms, acronyms, bounded contexts. One line each. |

Add new files to `arch/` only for genuinely cross-cutting concerns (e.g. `arch/security.md`, `arch/observability.md`). Don't create a file for a single module.

### Tier 3 — Co-located module architecture

When a source directory contains enough architectural substance to warrant its own doc, place an `ARCHITECTURE.md` inside that directory. Examples:

- `src/server/ARCHITECTURE.md` — HTTP server + MCP protocol layer details.
- `src/tools/ARCHITECTURE.md` — tool harness pattern, registry, per-tool file contract.

A co-located `ARCHITECTURE.md` must contain:

- **Modules in this directory** — one block per module/file with: Responsibility, Start-here path, Tests path, Reference example file.
- **Linked specs** — pointers to relevant specs under `docs/specs/`.
- **Local invariants** — rules specific to this directory (e.g. "every tool file exports `TOOL_NAME` and `register`").

Keep each module block under 10 lines. Keep the whole file under 150 lines.

**When to create a co-located file vs. a line in the hub:**
- If the directory has 1–2 simple files → just a row in the hub's module index.
- If the directory has 3+ files, internal patterns, or local invariants → co-located `ARCHITECTURE.md`.

## When to run

- A `docs/tasks/*.md` file has items under **Pending arch updates**.
- A PR introduces a new top-level directory, module, data store, or external integration.
- A folder has been renamed or moved.
- The user asks: "is the architecture doc up to date?" or "refresh ARCHITECTURE.md."

## Procedure

1. **Read the hub** (`ARCHITECTURE.md`) end to end. Note the existing structure.
2. **Read the relevant detail files.** If the delta touches a module that has a co-located `ARCHITECTURE.md`, read that too.
3. **Collect the deltas.** Sources, in order:
   - Any `## Pending arch updates` blocks across `docs/tasks/*.md`.
   - `git diff` for the recent merge range, focused on:
     - new directories under top-level source/test trees
     - new top-level files
     - renamed or removed folders
     - new dependencies that imply external systems
   - Linked spec and plan for the feature.
4. **Map deltas to files.** For each change, decide which file is affected:

   | Change type | Target file |
   |---|---|
   | New top-level directory | Hub → Repository map |
   | New module (simple) | Hub → Module index (add row) |
   | New module (complex, 3+ files) | Create co-located `<dir>/ARCHITECTURE.md`, add row to hub |
   | New data store or third-party service | `arch/external-systems.md` |
   | New "if you change X also touch Y" rule | `arch/change-guide.md` |
   | New domain term | `arch/glossary.md` |
   | New cross-cutting concern | New `arch/<concern>.md`, link from hub |
   | Folder agents should avoid | Hub → Avoid unless required |
   | Module internals changed | Co-located `<dir>/ARCHITECTURE.md` |

5. **Edit in place, preserving voice and shape.** Match the bullet style and section order already there.
6. **For each new module block in a co-located file, include:** Responsibility, Start-here path, Tests path, **Reference example** file.
7. **Clear consumed Pending arch updates.** Tick the boxes in the relevant tasks files.
8. **Sanity check.** Re-read every file you touched. Does every path you wrote actually exist? Run a quick `ls` on new paths.

## Hard rules

- **Hub stays under 150 lines.** If it's growing past that, you're putting detail in the wrong place.
- **Each module block in a co-located file ≤ 10 lines.** Each glossary entry ≤ 1 line.
- **Don't drop content** unless the corresponding code has been deleted.
- **Don't add diagrams without file links.** If you reference a flow, it must point to a real file.
- **Don't promote a temporary folder** to the architecture docs. If it's experimental, leave it out or put it under **Avoid unless required**.
- **Stable paths only.** Use `src/tools/registry.ts` rather than "the tool assembler module."
- **Co-located files are optional.** Don't create one for a directory with 1–2 trivial files.
- **Every link in the hub must resolve.** If you add a row to the module index, the linked file must exist.

## Bootstrap mode

When starting from scratch (all TODOs or empty template), treat the entire repo as the delta:

1. Walk the source tree. Identify directories with 3+ files or internal patterns → candidates for co-located `ARCHITECTURE.md`.
2. Create `arch/` with `change-guide.md`, `external-systems.md`, `glossary.md`.
3. Fill the hub: purpose, repo map, runtime flow, module index (one row per module, linking to co-located files or marking as hub-only), links to `arch/` files, avoid list.
4. Fill each co-located file with module blocks.
5. Sanity-check all paths.

## When in doubt

Ask: *would a fresh agent need to know this to find or modify code correctly?* If yes, write it. If no, skip it. Then ask: *does this belong in the hub, a cross-cutting file, or next to the code?* Put it in the most local place that makes sense.
